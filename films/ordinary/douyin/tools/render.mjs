// 渲染抖音版：N 个 Chromium 页面并行渲染帧段，各自直接编码；拼接、混入音轨，再出一版平台交付文件。
// 用法：node tools/render.mjs [workers=4] [from秒 to秒] [--resume]
//   --resume：上一次渲染中途被打断（浏览器被关时编码器会正常收尾）时，数出每段已有的帧，只补渲剩下的；
//   只在时间轴、画面代码都没变时可用（开渲时记下的指纹不一致就拒绝）。
//   → out/master/凡人_抖音.mp4（中间母版，画质高、体积大）→ out/deliver/凡人_抖音.mp4（H.264 High，faststart，可直接上传）
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { serve, REPO } from '../../../../engine/pipeline/serve.mjs';
import { VARIANTS } from '../script.mjs';

const variant = 'douyin';
const ARGS = process.argv.slice(2).filter((a) => a !== '--resume');
const RESUME = process.argv.includes('--resume');
const N = +(ARGS[0] || 4);
const TL = JSON.parse(readFileSync(`timeline/${variant}.json`, 'utf8'));
const [w, h] = [1080, 1920];
const RANGE = ARGS[1] !== undefined ? [+ARGS[1], +ARGS[2]] : [0, TL.duration];
const F0 = Math.round(RANGE[0] * TL.fps), F1 = Math.ceil(RANGE[1] * TL.fps);
const name = VARIANTS[variant].name;
const tmp = `out/render/${variant}`;
mkdirSync(tmp, { recursive: true }); mkdirSync('out/master', { recursive: true }); mkdirSync('out/deliver', { recursive: true });
const FR = F0;
const per = Math.ceil((F1 - FR) / N);
// 指纹：时间轴、画面代码、帧段划分；续渲时必须一致，否则接上的帧和已有的帧对不上
const FILES = ['timeline/douyin.json', 'web/main.js', 'index.html', '../timeline_zh.json', ...readdirSync('../shots').map((f) => '../shots/' + f)];
const sig = createHash('sha1').update(JSON.stringify([FILES.map((f) => readFileSync(f, 'utf8')), N, F0, F1])).digest('hex');
const sigFile = `${tmp}/signature`;
if (RESUME) {
  if (!existsSync(sigFile) || readFileSync(sigFile, 'utf8') !== sig) { console.error(`[${variant}] 上一次渲染的指纹不一致（时间轴、画面代码或参数变了），不能续渲`); process.exit(1); }
} else {
  for (const f of readdirSync(tmp)) if (f.startsWith('seg_')) rmSync(`${tmp}/${f}`);
  writeFileSync(sigFile, sig);
}
const frames = (f) => +spawnSync('ffprobe', ['-v', 'error', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', f]).stdout.toString();

// 音轨必须和时间轴一样长（时间轴改了却没重混，就会音画错位）
if (existsSync(`out/mix/${variant}.wav`)) {
  const d = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `out/mix/${variant}.wav`]).stdout.toString();
  if (Math.abs(d - TL.duration) > 0.15) { console.error(`[${variant}] 音轨 ${d.toFixed(2)}s 与时间轴 ${TL.duration}s 不一致：先重混（python3 tools/mix.py）`); process.exit(1); }
}
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const t0 = Date.now();
let done = 0;
async function worker(k) {
  const a0 = FR + k * per, b = Math.min(F1, a0 + per);
  if (a0 >= b) return [];
  const id = String(k).padStart(2, '0');
  // 已有的分片（续渲时）：seg_<k>.mp4、seg_<k>_1.mp4 …，按顺序接着画
  const pieces = readdirSync(tmp).filter((f) => f.startsWith(`seg_${id}`)).sort((x, y) => x.length - y.length || x.localeCompare(y)).map((f) => `${tmp}/${f}`);
  const a = a0 + pieces.reduce((n, f) => n + frames(f), 0);
  done += a - a0;
  if (a >= b) return pieces;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('PAGEERROR', k, e.message));
  await page.goto(`${url}/films/ordinary/douyin/index.html`, { timeout: 180000 }); // 机器负载高时 30 s 默认值曾超时
  await page.evaluate(() => window.ready);
  const out = `${tmp}/seg_${id}${pieces.length ? '_' + pieces.length : ''}.mp4`;
  // 中间段：快编码、高画质（慢编码会抢渲染的 CPU）
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(TL.fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const data = await page.evaluate((t) => window.renderAt(t, 0.94), f / TL.fps);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`[${variant}] ${done}/${F1 - FR} · ${(done / el).toFixed(1)} fps · eta ${((el / done) * (F1 - FR - done)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return [...pieces, out];
}
const segs = (await Promise.all([...Array(N).keys()].map(worker))).flat();
if (segs.reduce((n, f) => n + frames(f), 0) !== F1 - F0) { console.error(`[${variant}] 分片帧数合计不等于 ${F1 - F0}，保留分片，不拼接`); process.exit(1); }
await browser.close(); srv.close();
writeFileSync(`${tmp}/segs.txt`, segs.map((s) => `file '${s.split('/').pop()}'`).join('\n'));
const video = `${tmp}/video.mp4`;
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/segs.txt`, '-c', 'copy', video], { stdio: 'inherit' });
for (const s of segs) rmSync(s);
const audio = `out/mix/${variant}.wav`;
const partial = RANGE[0] > 0 || RANGE[1] < TL.duration;
const master = partial ? `${tmp}/preview_${RANGE[0]}-${RANGE[1]}.mp4` : `out/master/${name}.mp4`;
const aIn = existsSync(audio) ? ['-ss', String(RANGE[0]), '-t', String(RANGE[1] - RANGE[0]), '-i', audio] : [];
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, ...aIn, '-map', '0:v', ...(aIn.length ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '320k'] : []),
  '-c:v', 'copy', '-shortest', '-movflags', '+faststart', master], { stdio: 'inherit' });
rmSync(video);
// 封装后再查一次长度：音轨若在封装时还没写完（比如正在重混），-shortest 会悄悄把整片截短
const dur = (f) => +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).stdout.toString();
if (Math.abs(dur(master) - (RANGE[1] - RANGE[0])) > 0.2) { console.error(`[${variant}] 成片 ${dur(master).toFixed(2)}s，应为 ${(RANGE[1] - RANGE[0]).toFixed(2)}s：音轨不完整，不交付`); process.exit(1); }
console.log(`[${variant}] rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${master}`);
if (!partial) {
  // 交付版：H.264 High / yuv420p / 30fps / AAC 48k，faststart，crf 18。
  const crf = '18';
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', master, '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-level', '4.2',
    '-pix_fmt', 'yuv420p', '-r', String(TL.fps), '-g', String(TL.fps * 2), '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', `out/deliver/${name}.mp4`], { stdio: 'inherit' });
  if (r.status === 0 && Math.abs(dur(`out/deliver/${name}.mp4`) - TL.duration) <= 0.2) { rmSync(master); console.log(`[${variant}] → out/deliver/${name}.mp4`); }
  else { console.error(`[${variant}] 交付文件长度不对，保留母版 ${master}`); process.exit(1); }
}
