// 公众号封面：用片子自己的画笔画一张没有字幕的图 → out/cover/
//   wechat-cover-900x383.png（头条 2.35:1）· wechat-cover-square-383.png（转发与次条 1:1）· video-cover-1920x1080.png（视频封面）
// 在片子目录里运行：node cover.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { serve, REPO } from '../../engine/pipeline/serve.mjs';
mkdirSync('out/cover', { recursive: true });
const { srv, url } = await serve(REPO);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
await page.goto(`${url}/films/letting-go/index.html?lang=zh`);
await page.evaluate(() => window.ready);
const shot = (layout) => page.evaluate((layout) => {
  const c = document.getElementById('c'), ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  paper(ctx);
  const enso = (cx, cy, s) => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-ENSO.cx, -ENSO.cy);
    inkStroke(ctx, ENSO_PTS, { w: 30, p: 1, seed: 71, dry: 0.95, taper: 0.22, head: 0.04 });
    const e = ENSO_PTS.at(-1), d = ENSO_PTS.at(-2), dx = e[0] - d[0], dy = e[1] - d[1], l = Math.hypot(dx, dy);
    for (let i = 0; i < 7; i++) {
      const t = 30 + i * 22 + rand(i, 5) * 14, side = (rand(i, 6) - 0.5) * 30;
      ctx.fillStyle = rgba(INK, 0.85); ctx.beginPath(); ctx.arc(e[0] + dx / l * t - dy / l * side, e[1] + dy / l * t + dx / l * side, 2 + rand(i, 7) * 6 * (1 - i / 8), 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
  if (layout === 'wide') {
    // 2.35:1 的取景是画面中间 1920×817；圆相在左，片名在右
    enso(640, 560, 0.86);
    ['放', '手'].forEach((ch, i) => writeChar(ctx, ch, 1170 + i * 236, 500, 240, BRUSH, 1, { bleed: 7 }));
    seal(ctx, 1640, 600, 70, '心手', { seed: 12 });
    inkText(ctx, '提示词这几年 · 从描红到放手', 1290, 690, 40, KAI, { alpha: 0.85, spacing: '6px' });
    inkText(ctx, 'IDEVLAB', 1290, 760, 26, GARA, { alpha: 0.6, spacing: '10px' });
  } else if (layout === 'square') {
    // 1:1 取中间 1080×1080；圆相居中，片名写在圈里
    enso(CX, CY + 20, 1.32);
    ['放', '手'].forEach((ch, i) => writeChar(ctx, ch, CX - 6, CY - 110 + i * 210, 200, BRUSH, 1, { bleed: 7 }));
    seal(ctx, CX + 190, CY + 250, 74, '心手', { seed: 12 });
  } else {
    enso(700, 520, 1.0);
    ['放', '手'].forEach((ch, i) => writeChar(ctx, ch, 1250 + i * 250, 470, 260, BRUSH, 1, { bleed: 7 }));
    seal(ctx, 1740, 580, 76, '心手', { seed: 12 });
    inkText(ctx, '一部关于提示词的水墨短片', 1375, 680, 42, KAI, { alpha: 0.85, spacing: '6px' });
    inkText(ctx, 'IDEVLAB', 1375, 750, 28, GARA, { alpha: 0.6, spacing: '10px' });
  }
  post(ctx, 0, 0);
  return c.toDataURL('image/png');
}, layout);
for (const l of ['wide', 'square', 'video']) writeFileSync(`out/cover/_${l}.png`, Buffer.from((await shot(l)).split(',')[1], 'base64'));
await browser.close(); srv.close();
