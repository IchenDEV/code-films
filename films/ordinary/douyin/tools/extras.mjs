// 发布用的附件：SRT 字幕（剪映导入或平台外挂字幕）与封面（第一帧之外另传的封面图）。
// 用法：node tools/extras.mjs → out/deliver/凡人_抖音.srt、out/deliver/凡人_抖音_封面.jpg
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { serve, REPO } from '../../../../engine/pipeline/serve.mjs';
import { VARIANTS } from '../script.mjs';

const ts = (t) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
mkdirSync('out/deliver', { recursive: true });
const TL = JSON.parse(readFileSync('timeline/douyin.json', 'utf8'));
const name = VARIANTS.douyin.name;
writeFileSync(`out/deliver/${name}.srt`, TL.caps.map((c, i) => `${i + 1}\n${ts(Math.max(0, c.a))} --> ${ts(c.b)}\n${c.text}\n`).join('\n'));
console.log(`${name}.srt · ${TL.caps.length} 条`);
// 封面：开场神坛那一帧，“3 次”砸出来之后
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`${url}/films/ordinary/douyin/index.html`, { timeout: 180000 });
await page.evaluate(() => window.ready);
const hook = TL.shots[0];
const data = await page.evaluate((t) => window.renderAt(t, 0.95), hook.k.three + 0.6);
writeFileSync(`out/deliver/${name}_封面.jpg`, Buffer.from(data.split(',')[1], 'base64'));
await browser.close(); srv.close();
console.log(`${name}_封面.jpg`);
