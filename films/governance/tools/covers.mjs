// 各平台封面：node tools/covers.mjs → out/deliver/covers/*.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
import { basename } from 'node:path';
const FILM = basename(process.cwd()); // 片子目录名（tools 都在片子目录里运行）
const JOBS = [['抖音_封面_9x16', 1080, 1920], ['视频号_封面_6x7', 1080, 1260], ['视频号_封面_9x16', 1080, 1920], ['B站_封面_16x9', 1920, 1080]];
mkdirSync('out/deliver/covers', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
for (const [name, w, h] of JOBS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto(`${url}/films/${FILM}/cover.html?size=${w}x${h}`, { timeout: 180000 });
  await page.evaluate(() => window.ready);
  const data = await page.evaluate(() => window.renderCover());
  writeFileSync(`out/deliver/covers/${name}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  console.log(name, `${w}×${h}`);
  await page.close();
}
await browser.close(); srv.close();
