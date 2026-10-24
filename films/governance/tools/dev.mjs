// 开发截帧：不要时间轴，单独画一个镜头的几个时刻，拼成一张对照图。
// 用法：node tools/dev.mjs <镜头> <v|h> <dur> <句数> "<名字:秒,…>" 秒 秒 … [--cut=long] [--theme=night|paper|poster]
//   → out/dev/<镜头>_<v|h>.jpg
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, REPO } from '../../../engine/pipeline/serve.mjs';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const cut = (process.argv.find((a) => a.startsWith('--cut=')) || '--cut=short').slice(6);
const theme = (process.argv.find((a) => a.startsWith('--theme=')) || '').slice(8);
const [shot, fmt, dur, n, keys, ...ts] = args;
const [w, h] = fmt === 'h' ? [1920, 1080] : [1080, 1920];
mkdirSync('out/dev', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto(`${url}/films/${basename(process.cwd())}/index.html?v=dev&shot=${shot}&fmt=${fmt}&dur=${dur}&n=${n}&k=${encodeURIComponent(keys)}&cut=${cut}${theme ? '&theme=' + theme : ''}`, { timeout: 180000 });
await page.evaluate(() => window.ready);
const files = [];
for (const t of ts) {
  const data = await page.evaluate((t) => window.renderAt(t, 0.85), +t);
  const f = `out/dev/_${shot}_${fmt}_${t}.jpg`;
  writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
  files.push(f);
}
await browser.close(); srv.close();
const out = `out/dev/${shot}_${fmt}.jpg`;
const cols = fmt === 'h' ? 3 : Math.min(5, files.length), tw = fmt === 'h' ? 640 : 360;
spawnSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[3:]; cols=int(sys.argv[2]); tw=${tw}
ims=[Image.open(f).convert('RGB') for f in fs]
th=int(ims[0].height*tw/ims[0].width)
S=Image.new('RGB',(tw*cols, th*((len(ims)+cols-1)//cols)))
for i,(f,im) in enumerate(zip(fs,ims)):
    im=im.resize((tw,th)); ImageDraw.Draw(im).text((6,4), f.split('_')[-1][:-4]+'s', fill=(255,255,0)); S.paste(im,((i%cols)*tw,(i//cols)*th))
S.save(sys.argv[1], quality=85)
import os
for f in fs: os.remove(f)`, out, String(cols), ...files], { stdio: 'inherit' });
console.log(out);
