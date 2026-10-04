// 全片渲染：N 个页面并行渲染帧段并直接编码，最后拼接并混入声音。
// 在片子目录里运行：node ../../engine/pipeline/render.mjs zh|en [workers=4] [from秒 to秒 输出名]（或 ./run.sh <片名> render）
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { serve, REPO } from './serve.mjs';
import { basename } from 'node:path';
const FILM_ID = basename(process.cwd()); // 在片子目录里运行
const lang = process.argv[2] || 'zh';
const N = +(process.argv[3] || 4);
const TL = JSON.parse(readFileSync(`timeline_${lang}.json`, 'utf8'));
const RANGE = process.argv[4] !== undefined ? [+process.argv[4], +process.argv[5]] : [0, TL.DURATION];
const F0 = Math.round(RANGE[0] * TL.FPS), F1 = Math.ceil(RANGE[1] * TL.FPS);
const per = Math.ceil((F1 - F0) / N);
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const t0 = Date.now();
let done = 0;
async function worker(w) {
  const a = F0 + w * per, b = Math.min(F1, a + per);
  if (a >= b) return null;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', w, e.message));
  await page.goto(`${url}/films/${FILM_ID}/index.html?lang=${lang}`);
  await page.evaluate(() => window.ready);
  const out = `out/seg_${lang}_${String(w).padStart(2, '0')}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(TL.FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-x264-params', 'aq-mode=3', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const data = await page.evaluate((t) => window.renderAt(t, 0.95), f / TL.FPS);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 240 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`[${lang}] ${done}/${F1 - F0} · ${el.toFixed(0)}s · eta ${((el / done) * (F1 - F0 - done)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return out;
}
const segs = (await Promise.all([...Array(N).keys()].map(worker))).filter(Boolean);
await browser.close(); srv.close();
writeFileSync(`out/segs_${lang}.txt`, segs.map((s) => `file '${s.replace('out/', '')}'`).join('\n'));
spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `out/segs_${lang}.txt`, '-c', 'copy', `out/video_${lang}.mp4`], { stdio: 'inherit' });
const CONFIG = JSON.parse(readFileSync('film.json', 'utf8'));
const name = process.argv[6] || CONFIG.output?.[lang.replace(/B$/, '')] || `${CONFIG.id}_${lang}`;
// 先做响度标准化
  spawnSync('python3', [new URL('./loudnorm.py', import.meta.url).pathname, `out/mix_${lang}.wav`, `out/mix_${lang}_ln.wav`], { stdio: 'inherit' });
  const audio = `out/mix_${lang}_ln.wav`;
if (existsSync(audio)) {
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `out/video_${lang}.mp4`, ...(RANGE[0] ? ['-ss', String(RANGE[0])] : []), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', `out/${name}.mp4`], { stdio: 'inherit' });
}
console.log(`[${lang}] done in ${((Date.now() - t0) / 1000).toFixed(0)}s → out/${name}.mp4`);
