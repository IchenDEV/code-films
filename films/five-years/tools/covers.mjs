// 各平台封面：node tools/covers.mjs → out/deliver/covers/*.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
const JOBS = [
  ['抖音_封面_9x16', 'zh', 1080, 1920], ['小红书_封面_3x4', 'zh', 1080, 1440], ['视频号_封面_6x7', 'zh', 1080, 1260],
  ['B站_封面_16x9', 'zh', 1920, 1080], ['YouTube_thumbnail_16x9', 'en', 1280, 720], ['YouTube_Shorts_cover_9x16', 'en', 1080, 1920],
];
mkdirSync('out/deliver/covers', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
for (const [name, lang, w, h] of JOBS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto(`${url}/films/five-years/cover.html?lang=${lang}&size=${w}x${h}`);
  await page.evaluate(() => window.ready);
  const data = await page.evaluate(() => window.renderCover());
  writeFileSync(`out/deliver/covers/${name}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  console.log(name, `${w}×${h}`);
  await page.close();
}
await browser.close(); srv.close();
