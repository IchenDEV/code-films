// 截帧检查：node tools/stills.mjs @段落[+秒|%比例] … 或 绝对秒数 → out/stills/<t>.jpg；加 --sheet 另拼一张对照图 out/stills/sheet.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { serve, REPO } from '../../../../engine/pipeline/serve.mjs';
const args = process.argv.slice(2).filter((a) => a !== '--sheet');
const sheet = process.argv.includes('--sheet');
const CUT = JSON.parse(readFileSync('timeline/douyin.json', 'utf8'));
mkdirSync('out/stills', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto(`${url}/films/ordinary/douyin/index.html`, { timeout: 180000 });
await page.evaluate(() => window.ready);
const files = [];
for (const a of args) {
  let t = +a;
  if (a.startsWith('@')) {
    const m = a.slice(1).match(/^([a-z_]+)(?:([+%])([\d.]+))?$/);
    const sh = CUT.shots.find((s) => s.kind === m[1]);
    if (!sh) { console.error('no shot', a); continue; }
    t = m[2] === '+' ? sh.a + +m[3] : m[2] === '%' ? sh.a + ((sh.b - sh.a) * +m[3]) / 100 : (sh.a + sh.b) / 2;
  }
  const data = await page.evaluate((t) => window.renderAt(t, 0.9), t);
  const f = `out/stills/${t.toFixed(2)}.jpg`;
  writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
  files.push(f);
}
await browser.close(); srv.close();
if (sheet && files.length) {
  spawnSync('python3', ['-I', '-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; cols=6; tw=300
ims=[Image.open(f).convert('RGB') for f in fs]
th=int(ims[0].height*tw/ims[0].width)
S=Image.new('RGB',(tw*cols, th*((len(ims)+cols-1)//cols)))
for i,(f,im) in enumerate(zip(fs,ims)):
    im=im.resize((tw,th)); ImageDraw.Draw(im).text((6,4), f.split('/')[-1][:-4], fill=(255,255,0)); S.paste(im,((i%cols)*tw,(i//cols)*th))
S.save(sys.argv[1], quality=85)`, 'out/stills/sheet.jpg', ...files], { stdio: 'inherit' });
  console.log('out/stills/sheet.jpg');
} else console.log(files.join(' '));
