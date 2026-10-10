// 渲染一个成片版本：N 个 Chromium 页面并行渲染帧段，各自直接编码；拼接、混入音轨，再出一版平台交付文件。
// 用法：node tools/render.mjs <variant> [workers=4] [from秒 to秒]
//   → out/master/<名字>.mp4（中间母版，画质高、体积大）→ out/deliver/<名字>.mp4（H.264 High，faststart，可直接上传）
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
import { VARIANTS } from '../script.mjs';

const variant = process.argv[2];
const N = +(process.argv[3] || 4);
const TL = JSON.parse(readFileSync(`timeline/${variant}.json`, 'utf8'));
const [w, h] = { h: [1920, 1080], v: [1080, 1920], p: [1080, 1440] }[TL.fmt];
const RANGE = process.argv[4] !== undefined ? [+process.argv[4], +process.argv[5]] : [0, TL.duration];
const F0 = Math.round(RANGE[0] * TL.fps), F1 = Math.ceil(RANGE[1] * TL.fps);
const per = Math.ceil((F1 - F0) / N);
const name = VARIANTS[variant].name;
const tmp = `out/render/${variant}`;
mkdirSync(tmp, { recursive: true }); mkdirSync('out/master', { recursive: true }); mkdirSync('out/deliver', { recursive: true });

const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const t0 = Date.now();
let done = 0;
async function worker(k) {
  const a = F0 + k * per, b = Math.min(F1, a + per);
  if (a >= b) return null;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('PAGEERROR', k, e.message));
  await page.goto(`${url}/films/five-years/index.html?v=${variant}`);
  await page.evaluate(() => window.ready);
  const out = `${tmp}/seg_${String(k).padStart(2, '0')}.mp4`;
  // 中间段：快编码、高画质（慢编码会抢渲染的 CPU）
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(TL.fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const data = await page.evaluate((t) => window.renderAt(t, 0.94), f / TL.fps);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`[${variant}] ${done}/${F1 - F0} · ${(done / el).toFixed(1)} fps · eta ${((el / done) * (F1 - F0 - done)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return out;
}
const segs = (await Promise.all([...Array(N).keys()].map(worker))).filter(Boolean);
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
console.log(`[${variant}] rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${master}`);
if (!partial) {
  // 交付版：H.264 High / yuv420p / 30fps / AAC 48k，faststart。长片 crf 18，竖屏短片 crf 19。
  const crf = TL.fmt === 'h' ? '18' : '19';
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', master, '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-level', '4.2',
    '-pix_fmt', 'yuv420p', '-r', String(TL.fps), '-g', String(TL.fps * 2), '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', `out/deliver/${name}.mp4`], { stdio: 'inherit' });
  if (r.status === 0) { rmSync(master); console.log(`[${variant}] → out/deliver/${name}.mp4`); }
}
