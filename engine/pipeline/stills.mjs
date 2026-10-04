// 在片子目录里运行：node ../../engine/pipeline/stills.mjs [zh|en] 3.0 8.2 ... 或 node stills.mjs zh @storm @ptolemy+2.5
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { serve, REPO } from './serve.mjs';
import { basename } from 'node:path';
const FILM_ID = basename(process.cwd()); // 在片子目录里运行
const args = process.argv.slice(2);
const lang = ['zh', 'en'].includes(args[0]) ? args.shift() : 'zh';
mkdirSync('out/stills', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto(`${url}/films/${FILM_ID}/index.html?lang=${lang}`);
await page.evaluate(() => window.ready);
const files = [];
for (const a of args) {
  let t = +a;
  if (a.startsWith('@')) {
    const [kind, off] = a.slice(1).split('+');
    const sh = await page.evaluate((k) => window.shotAt(k), kind);
    t = sh.a + (off === undefined ? (sh.b - sh.a) / 2 : +off);
  }
  const t0 = Date.now();
  const data = await page.evaluate((t) => window.renderPNG(t), t);
  const f = `out/stills/${lang}_${t.toFixed(2)}.png`;
  writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
  files.push(f);
  console.error(f, Date.now() - t0, 'ms');
}
console.log(files.join(' '));
await browser.close();
srv.close();
