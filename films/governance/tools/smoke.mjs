// 冒烟测试：每个转场前后 0.8 秒每 1/15 秒画一帧，再把全片每 0.5 秒画一遍，任何一帧抛错就报出来。
// 镜头在转场窗口里会以负的镜头内时间被画，这类错误平时截帧碰不到。
// 用法：node tools/smoke.mjs [variant…]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
import { basename } from 'node:path';
const FILM = basename(process.cwd()); // 片子目录名（tools 都在片子目录里运行）
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['douyin', 'bilibili'];
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
let bad = 0;
for (const v of names) {
  const TL = JSON.parse(readFileSync(`timeline/${v}.json`, 'utf8'));
  const [w, h] = TL.fmt === 'h' ? [1920, 1080] : [1080, 1920];
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${url}/films/${FILM}/index.html?v=${v}`);
  await page.evaluate(() => window.ready);
  const ts = new Set();
  for (const s of TL.shots) for (let t = s.a - 0.8; t <= s.a + 0.8; t += 1 / 15) if (t >= 0 && t < TL.duration) ts.add(+t.toFixed(4));
  for (let t = 0; t < TL.duration; t += 0.5) ts.add(+t.toFixed(4));
  const list = [...ts].sort((a, b) => a - b);
  const errs = await page.evaluate((list) => {
    const out = [];
    for (const t of list) { try { window.drawAt(t); } catch (e) { out.push(`${t.toFixed(3)}s ${e.message.split('\n')[0]}`); if (out.length > 20) break; } }
    return out;
  }, list);
  console.log(`${v}: ${list.length} frames · ${errs.length ? errs.length + ' errors' : 'ok'}`);
  errs.forEach((e) => console.log('   ', e));
  bad += errs.length;
  await page.close();
}
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);
