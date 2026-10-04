// 全片渲染：N 个页面并行，各自渲染一段帧，编码为分段，再拼接。
// 用法：node render.mjs [workers=4] [from=0] [to=DURATION]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const TL = JSON.parse(readFileSync('timeline.json', 'utf8'));
const N = +(process.argv[2] || 4);
const from = +(process.argv[3] || 0), to = +(process.argv[4] || TL.DURATION);
const F0 = Math.round(from * TL.FPS), F1 = Math.round(to * TL.FPS);
const per = Math.ceil((F1 - F0) / N);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const t0 = Date.now();
let done = 0;
async function worker(w) {
  const a = F0 + w * per, b = Math.min(F1, a + per);
  if (a >= b) return null;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', w, e.message));
  await page.goto('file://' + process.cwd() + '/film/index.html');
  await page.evaluate(() => window.ready);
  const out = `out/seg_${String(w).padStart(2, '0')}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(TL.FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-tune', 'grain', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const url = await page.evaluate((t) => window.renderAt(t, 0.95), f / TL.FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 120 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${F1 - F0} frames · ${el.toFixed(0)}s · eta ${((el / done) * (F1 - F0 - done)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  return out;
}
const segs = (await Promise.all([...Array(N).keys()].map(worker))).filter(Boolean);
await browser.close();
writeFileSync('out/segs.txt', segs.map((s) => `file '${s.replace('out/', '')}'`).join('\n'));
console.log('segments', segs.join(' '), 'in', ((Date.now() - t0) / 1000).toFixed(0), 's');
