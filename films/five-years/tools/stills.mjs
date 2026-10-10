// 截帧检查：node tools/stills.mjs <variant> @镜头[+秒|%比例][#第几个] … 或 绝对秒数 → out/stills/<variant>_<t>.jpg
// 加 --sheet 时另拼一张对照图 out/stills/<variant>_sheet.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
const [variant, ...args] = process.argv.slice(2).filter((a) => a !== '--sheet');
const sheet = process.argv.includes('--sheet');
const TL = (await import(`../timeline/${variant}.json`, { with: { type: 'json' } })).default;
const [w, h] = { h: [1920, 1080], v: [1080, 1920], p: [1080, 1440] }[TL.fmt];
mkdirSync('out/stills', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto(`${url}/films/five-years/index.html?v=${variant}`);
await page.evaluate(() => window.ready);
const files = [];
for (const a of args) {
  let t = +a;
  if (a.startsWith('@')) {
    const m = a.slice(1).match(/^([a-z_]+)(?:#(\d+))?(?:([+%])([\d.]+))?$/);
    const sh = TL.shots.filter((s) => s.kind === m[1])[+(m[2] || 0)];
    if (!sh) { console.error('no shot', a); continue; }
    t = m[3] === '+' ? sh.a + +m[4] : m[3] === '%' ? sh.a + ((sh.b - sh.a) * +m[4]) / 100 : (sh.a + sh.b) / 2;
  }
  const t0 = Date.now();
  const data = await page.evaluate((t) => window.renderAt(t, 0.9), t);
  const f = `out/stills/${variant}_${t.toFixed(2)}.jpg`;
  writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
  files.push(f);
  console.error(f, Date.now() - t0, 'ms');
}
await browser.close(); srv.close();
if (sheet && files.length) {
  const out = `out/stills/${variant}_sheet.jpg`;
  const cols = TL.fmt === 'h' ? 3 : 5, tw = TL.fmt === 'h' ? 640 : 360;
  spawnSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[3:]; cols=int(sys.argv[2]); tw=${tw}
ims=[Image.open(f).convert('RGB') for f in fs]
th=int(ims[0].height*tw/ims[0].width)
S=Image.new('RGB',(tw*cols, th*((len(ims)+cols-1)//cols)))
for i,(f,im) in enumerate(zip(fs,ims)):
    im=im.resize((tw,th)); ImageDraw.Draw(im).text((6,4), f.split('_')[-1][:-4], fill=(255,255,0)); S.paste(im,((i%cols)*tw,(i//cols)*th))
S.save(sys.argv[1], quality=85)`, out, String(cols), ...files], { stdio: 'inherit' });
  console.log(out);
} else console.log(files.join(' '));
