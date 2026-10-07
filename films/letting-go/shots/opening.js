// 序：贴满告示的纸 → 告示被风吹走，一条边界 → 片名
const SLIP_TEXT = {
  zh: ['必须', '严禁', '铁律', '强制', '再次强调', '绝对不能', '禁止省略', '严格遵守', '不得改动', '务必', '禁止解释', '切记', '只能', '一律', '警告', '重要'],
  en: ['MUST', 'NEVER', 'STRICTLY', 'IRON RULE', 'REPEAT', 'DO NOT', 'ALWAYS', 'ONLY', 'WARNING', 'NO EXCEPTIONS', 'IMPORTANT', 'FORBIDDEN', 'OBEY', 'AGAIN', 'AT ALL TIMES', 'ABSOLUTELY'],
};
let SLIPS = [];
const N_SLIPS = 28;
INITS.push(() => {
  const texts = SLIP_TEXT[TL.lang] || SLIP_TEXT.en;
  // 抖动的网格，打乱顺序，让纸慢慢被盖满
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) cells.push([c, r]);
  cells.sort((p, q) => rand(p[0] * 7 + p[1], 21) - rand(q[0] * 7 + q[1], 21));
  SLIPS = cells.map(([c, r], i) => {
    const text = texts[i % texts.length];
    const zh = TL.lang === 'zh';
    const w = zh ? 150 + [...text].length * 44 : 120 + text.length * 19;
    return {
      x: 230 + c * 243 + (rand(i, 1) - 0.5) * 110, y: 150 + r * 205 + (rand(i, 2) - 0.5) * 90,
      w, h: zh ? 104 : 92, rot: (rand(i, 3) - 0.5) * 0.3, text,
    };
  });
});
// 第 i 张告示出现的时刻（镜头内秒）。sfx.py 用同一个公式放盖章声。
function slipTime(i, sh) {
  const T1 = (sh.o2_end ?? 14) + 0.3;
  return 1.0 + (T1 - 1.0) * Math.pow(i / (N_SLIPS - 1), 0.55);
}

SHOT.notes = (ctx, u, dur, sh) => {
  const s = 1 + 0.06 * (u / dur);
  ctx.save(); cam(ctx, s);
  paper(ctx);
  SLIPS.forEach((q, i) => {
    const t0 = slipTime(i, sh), k = ease(u, t0, t0 + 0.22);
    if (k <= 0) return;
    slip(ctx, q.x, q.y, q.w, q.h, q.rot, q.text, { alpha: k, scale: 1.14 - 0.14 * k });
  });
  ctx.restore();
};

SHOT.thesis = (ctx, u, dur, sh) => {
  const s = lerp(1.06, 1.0, ease(u, 1.4, 5));
  ctx.save(); cam(ctx, s);
  paper(ctx);
  // 风把告示吹走
  SLIPS.forEach((q, i) => {
    const b0 = 1.5 + rand(i, 7) * 1.4 + (q.x / W) * 0.6;
    const k = ramp(u, b0, b0 + 2.6);
    if (k >= 1) return;
    const e = k * k;
    const x = q.x + e * (1500 + rand(i, 8) * 900), y = q.y + Math.sin(k * 3 + i) * 60 * k - e * (120 + rand(i, 9) * 260) + e * e * 200;
    slip(ctx, x, y, q.w, q.h, q.rot + e * (rand(i, 10) - 0.4) * 4, q.text, { alpha: 1 - smooth(clamp((k - 0.55) / 0.45)), scale: 1 - 0.2 * e });
  });
  ctx.restore();
  // 边界：一条竖笔，慢慢向左移动；左边是朱色（人），右边是墨色（模型）
  const t4 = at(sh, 'o4'), t5 = at(sh, 'o5');
  const appear = ease(u, t4 - 0.2, t4 + 2.5);
  const bx = CX + 230 - 460 * ease(u, t4 + 2.6, dur + 3);
  if (appear > 0) {
    ctx.save();
    const gl = ctx.createLinearGradient(bx - 700, 0, bx, 0);
    gl.addColorStop(0, rgba(CINNABAR, 0)); gl.addColorStop(1, rgba(CINNABAR, 0.16 * appear));
    ctx.fillStyle = gl; ctx.fillRect(bx - 700, 0, 700, H);
    const gr = ctx.createLinearGradient(bx, 0, bx + 700, 0);
    gr.addColorStop(0, rgba(INK, 0.14 * appear)); gr.addColorStop(1, rgba(INK, 0));
    ctx.fillStyle = gr; ctx.fillRect(bx, 0, 700, H);
    ctx.restore();
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([bx + noise1(i * 0.9, 4) * 18, 110 + i * 100]);
    inkStroke(ctx, pts, { w: 13, p: ease(u, t4 + 0.1, t4 + 2.2), seed: 5, dry: 0.7 });
  }
  // 两个记号：人的一方小印，模型的一圈墨
  const q = ease(u, t5 + 0.2, t5 + 1.2);
  if (q > 0) seal(ctx, bx - 330, CY - 70, 92, '人', { k: q, seed: 3 });
  const r = ease(u, t5 + 1.3, t5 + 3.6);
  if (r > 0) {
    const pts = [];
    for (let i = 0; i <= 28; i++) { const a = -1.9 + (i / 28) * TAU * 0.93; const rr = 72 * (1 + 0.04 * noise1(i * 0.5, 9)); pts.push([bx + 330 + Math.cos(a) * rr, CY - 70 + Math.sin(a) * rr]); }
    inkStroke(ctx, pts, { w: 11, p: r, seed: 8, dry: 0.8, taper: 0.4 });
  }
};

// 片名
function drawTitle(ctx, u, big) {
  const zh = TL.lang === 'zh';
  const size = big ? (zh ? 250 : 190) : 170;
  const y = big ? (zh ? CY - 40 : CY - 90) : CY - 70;
  const chars = ['放', '手'];
  chars.forEach((ch, i) => writeChar(ctx, ch, CX + (i - 0.5) * size * 0.98, y, size, BRUSH, ease(u, 0.8 + i * 0.9, 1.9 + i * 0.9), { bleed: 6 }));
  seal(ctx, CX + size * 1.08, y + size * 0.42, big ? 64 : 52, '心手', { k: ease(u, 3.0, 3.6), seed: 12 });
  const sub = ease(u, 3.2, 4.6);
  if (!zh) inkText(ctx, 'Letting Go', CX, y + size * 0.82, big ? 86 : 66, GARA, { style: 'italic', alpha: ease(u, 2.2, 3.4), spacing: '2px' });
  return { sub, y: zh ? y + size * 0.78 : y + size * 0.82 + 80 };
}
SHOT.title = (ctx, u, dur) => {
  paper(ctx, 1 + 0.02 * (u / dur));
  const { sub, y } = drawTitle(ctx, u, true);
  inkText(ctx, TL.lang === 'zh' ? '一部关于提示词的短片' : 'a short film about prompts', CX, y, TL.lang === 'zh' ? 30 : 32, TL.lang === 'zh' ? KAI : GARA,
    { alpha: sub * 0.75, spacing: TL.lang === 'zh' ? '8px' : '3px', style: TL.lang === 'zh' ? '' : 'italic' });
};
