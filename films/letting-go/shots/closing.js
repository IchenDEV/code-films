// 五 · 放手，与尾声

// ═══ 五 · 推理：朱色的“第一步、第二步”退场，墨笔自己走完 ═══
const GUIDE = [[260, 760], [460, 520], [720, 430], [960, 560], [1160, 700], [1400, 640], [1600, 420]];
const OWN = [[260, 760], [460, 520], [720, 430], [960, 560], [1110, 590], [1215, 430], [1180, 270]];
SHOT.reason = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 1 + 0.03 * (u / dur));
  paper(ctx);
  const zh = TL.lang === 'zh';
  const e1 = at(sh, 'e1'), e1e = at(sh, 'e1', 1), e2 = at(sh, 'e2'), e2e = at(sh, 'e2', 1);
  const ga = ease(u, 0.2, 1.0) * (1 - ease(u, e2 + 0.2, lerp(e2, e2e, 0.7)));
  if (ga > 0) {
    const S = strokeOf(GUIDE);
    ctx.save(); ctx.setLineDash([16, 12]); ctx.strokeStyle = rgba(CINNABAR, 0.7 * ga); ctx.lineWidth = 3;
    ctx.beginPath(); S.P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
    const steps = zh ? ['第一步', '第二步', '第三步', '第四步'] : ['step one', 'step two', 'step three', 'step four'];
    [[460, 520], [960, 560], [1160, 700], [1400, 640]].forEach(([x, y], i) => {
      const jit = ease(u, lerp(e2, e2e, 0.55), e2e) * 6;
      inkText(ctx, steps[i], x + noise1(u * 9, i) * jit, y + (i === 2 ? 52 : -40), 28, zh ? KAI : GARA, { color: CINNABAR, alpha: ga * ease(u, 0.4 + i * 0.25, 0.9 + i * 0.25), style: zh ? '' : 'italic' });
    });
  }
  inkStroke(ctx, OWN, { w: 17, p: smooth(ramp(u, 0.6, e2e + 0.2)), seed: 61, dry: 0.65 });
  // 新的写法：直接、清楚
  const nk = ramp(u, lerp(e2, e2e, 0.75), e2e + 1.4);
  const note = zh ? ['解决这个问题。', '守住约束，用好资料，按标准验收。'] : ['Solve this problem.', 'Keep the constraints, use the sources, judge by the standard.'];
  note.forEach((l, i) => writeLine(ctx, l, 240, 190 + i * 62, i ? (zh ? 34 : 32) : (zh ? 46 : 46), zh ? BRUSH : GARA, clamp(nk * 2 - i), { style: zh ? '' : 'italic' }));
  ctx.restore();
};

// ═══ 灯照到哪里，它才知道哪里 ═══
function lampAt(ctx, x, y, u) {
  ctx.fillStyle = rgba(INK, 0.85);
  ctx.beginPath(); ctx.ellipse(x, y + 112, 46, 10, 0, 0, TAU); ctx.fill();
  ctx.fillRect(x - 5, y + 30, 10, 84);
  ctx.beginPath(); ctx.ellipse(x, y + 30, 40, 9, 0, 0, Math.PI); ctx.fill();
  const fl = 1 + 0.1 * noise1(u * 7, 3), sway = noise1(u * 3, 4) * 3;
  const g = ctx.createRadialGradient(x, y + 6, 1, x, y - 2, 26 * fl);
  g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(0.45, 'rgba(255,196,96,0.95)'); g.addColorStop(1, 'rgba(220,110,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 9, y + 20); ctx.quadraticCurveTo(x - 12, y, x + sway, y - 30 * fl); ctx.quadraticCurveTo(x + 12, y, x + 9, y + 20); ctx.closePath(); ctx.fill();
}
SHOT.lamp = (ctx, u, dur, sh) => {
  paper(ctx);
  const e3 = at(sh, 'e3'), e3e = at(sh, 'e3', 1);
  const e4 = at(sh, 'e4'), e4e = at(sh, 'e4', 1);
  const mv = easeInOut(ramp(u, lerp(e4, e4e, 0.8), e4e + 1.0));
  const lx = lerp(560, 1160, mv), R = lerp(400, 760, mv);
  // 屋内陈设
  inkStroke(ctx, [[110, 770], [960, 760], [1810, 772]], { w: 7, seed: 81, dry: 0.4 });
  for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(INK, 0.75); ctx.lineWidth = 3; ctx.strokeRect(250 + i * 6, 726 - i * 26, 170 - i * 14, 24); }
  inkStroke(ctx, [[760, 748], [900, 726]], { w: 4, seed: 83 });
  const zh = TL.lang === 'zh';
  // 桌上的旧图纸
  ctx.save(); ctx.translate(560, 712); ctx.rotate(-0.04);
  ctx.fillStyle = 'rgb(232,222,198)'; ctx.fillRect(-150, -60, 300, 50);
  ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-130, -46 + i * 13); ctx.lineTo(80 - i * 30, -46 + i * 13); ctx.stroke(); }
  ctx.restore();
  inkText(ctx, zh ? '旧图纸' : 'OLD PLANS', 560, 620, zh ? 30 : 24, zh ? KAI : GARA, { style: zh ? '' : '600', spacing: '3px' });
  // 墙上的新图纸
  inkText(ctx, zh ? '新图纸' : 'NEW PLANS', 1550, 160, zh ? 30 : 24, zh ? KAI : GARA, { style: zh ? '' : '600', spacing: '3px' });
  ctx.save(); ctx.fillStyle = 'rgb(236,228,208)'; ctx.fillRect(1390, 200, 320, 470);
  ctx.strokeStyle = rgba([110, 120, 122], 0.9); ctx.lineWidth = 22; ctx.strokeRect(1390, 200, 320, 470);
  ctx.beginPath(); ctx.rect(1400, 210, 300, 450); ctx.clip();
  ctx.drawImage(MT_SCROLL, 1390, 200, 330, 460); ctx.restore();
  ctx.fillStyle = 'rgb(70,46,30)'; ctx.fillRect(1370, 186, 360, 12); ctx.fillRect(1366, 670, 368, 16);
  seal(ctx, 1450, 610, 34, '新', { seed: 22 });
  // 黑暗与灯光
  const D = ease(u, 0.2, 1.6);
  const g = ctx.createRadialGradient(lx, 640, R * 0.08, lx, 640, R);
  g.addColorStop(0, 'rgba(14,11,9,0)'); g.addColorStop(0.5, `rgba(14,11,9,${0.42 * D})`); g.addColorStop(1, `rgba(14,11,9,${0.95 * D})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  const wg = ctx.createRadialGradient(lx, 620, 10, lx, 620, R * 0.8);
  wg.addColorStop(0, `rgba(255,170,80,${0.55 * D})`); wg.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, lx, 628, 130, [255, 170, 90], 0.22 * D);
  ctx.restore();
  lampAt(ctx, lx, 628, u);
  // 多写三遍“认真阅读”
  [[300, 360, -0.08], [520, 300, 0.06], [740, 380, -0.03]].forEach(([x, y, r], i) => {
    const t0 = lerp(e4, e4e, 0.56) + i * 0.32, k = ease(u, t0, t0 + 0.2) * (1 - ease(u, e4e + 0.4, e4e + 1.2));
    if (k > 0) slip(ctx, x, y, zh ? 250 : 290, zh ? 88 : 78, r, zh ? '认真阅读！' : 'READ CAREFULLY!', { alpha: k, scale: 1.12 - 0.12 * k });
  });
};

// ═══ 七 · 放手：一笔圆相。旧规矩挡在后半圈，撕掉之后，同一支笔一口气写完 ═══
const ENSO = { cx: CX + 20, cy: CY - 70, r: 300, a0: 120, a1: 468, pause: 0.5 };
const ENSO_PTS = (() => {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const q = i / 40, a = (ENSO.a0 + (ENSO.a1 - ENSO.a0) * q) * Math.PI / 180;
    const r = ENSO.r * (1 + 0.035 * noise1(q * 6, 4)) * (1 - 0.07 * smooth(clamp((q - 0.9) / 0.1)));
    pts.push([ENSO.cx + Math.cos(a) * r, ENSO.cy + Math.sin(a) * r]);
  }
  return pts;
})();
const ON_ARC = [318, 338, 392, 412, 432, 452, 300].map((d, i) => {
  const a = d * Math.PI / 180, r = ENSO.r + (i % 2 ? 24 : -20);
  return [ENSO.cx + Math.cos(a) * r, ENSO.cy + Math.sin(a) * r, (rand(i, 2) - 0.5) * 0.4];
});
const OLD_RULES = { zh: ['必须', '严禁', '铁律', '一律', '务必', '切记', '只能'], en: ['MUST', 'NEVER', 'IRON RULE', 'ALWAYS', 'ONLY', 'REPEAT', 'STRICTLY'] };
const KEPT = { zh: ['保留事实', '写给读者'], en: ['KEEP THE FACTS', 'WRITE FOR THE READER'] };
SHOT.letgo = (ctx, u, dur, sh) => {
  const zh = TL.lang === 'zh';
  const g1 = at(sh, 'g1'), g1e = at(sh, 'g1', 1), g2 = at(sh, 'g2'), g2e = at(sh, 'g2', 1);
  const sw = sh.sweep ?? lerp(at(sh, 'g3'), at(sh, 'g3', 1), 0.55);
  // 镜头：停笔时慢慢推近，挥笔时一下拉开
  const push = 1 + 0.05 * ease(u, 1.0, sw) - 0.07 * easeInOut(ramp(u, sw, sw + 0.9));
  const shake = Math.max(0, 1 - (u - sw) / 0.35) * (u > sw ? 2.5 : 0);
  ctx.save(); cam(ctx, push, CX + noise1(u * 40, 1) * shake, CY - 40 + noise1(u * 40, 2) * shake);
  paper(ctx);
  // 笔的进度：先写到半圈停住；挥笔的一刻，一口气写完
  const first = smooth(ramp(u, 0.3, lerp(g1, g1e, 0.4))) * ENSO.pause;
  const q = ramp(u, sw - 0.06, sw + 0.8);
  const fly = 1 - Math.pow(1 - q, 2.6);
  const p = first + (1 - ENSO.pause) * fly;
  // 停笔处墨慢慢洇开
  const tip = strokePoint(ENSO_PTS, ENSO.pause);
  const pool = ease(u, lerp(g1, g1e, 0.4), sw) * (1 - ease(u, sw, sw + 0.6));
  if (pool > 0) { ctx.fillStyle = rgba(INK, 0.16 * pool); ctx.beginPath(); ctx.arc(tip[0], tip[1], 16 + 14 * pool, 0, TAU); ctx.fill(); }
  inkStroke(ctx, ENSO_PTS, { w: 30, p, seed: 71, dry: 0.95, taper: 0.22, head: 0.04 });
  // 甩出的墨点
  const spl = ease(u, sw + 0.65, sw + 0.85);
  if (spl > 0) {
    const e = ENSO_PTS.at(-1), d = ENSO_PTS.at(-2);
    const dx = e[0] - d[0], dy = e[1] - d[1], l = Math.hypot(dx, dy);
    for (let i = 0; i < 7; i++) {
      const t = 30 + i * 22 + rand(i, 5) * 14, side = (rand(i, 6) - 0.5) * 30;
      ctx.fillStyle = rgba(INK, 0.85 * spl);
      ctx.beginPath(); ctx.arc(e[0] + dx / l * t - dy / l * side, e[1] + dy / l * t + dx / l * side, 2 + rand(i, 7) * 6 * (1 - i / 8), 0, TAU); ctx.fill();
    }
  }
  // 挡在后半圈的旧规矩：八成被撕掉
  const rules = OLD_RULES[zh ? 'zh' : 'en'];
  ON_ARC.forEach(([x, y, r], i) => {
    const f0 = lerp(g1, g1e, 0.5) + i * 0.16, k = ramp(u, f0, f0 + 2.2);
    if (k >= 1) return;
    const lift = ease(k, 0, 0.08);
    slip(ctx, x + Math.sin(k * 5 + i) * 60 * k, y - lift * 12 + k * k * 900, zh ? 130 + [...rules[i]].length * 40 : 120 + rules[i].length * 17, zh ? 88 : 78, r + k * (rand(i, 5) - 0.5) * 5, rules[i], { alpha: 1 - ease(k, 0.6, 1) });
  });
  // 留下的两成
  KEPT[zh ? 'zh' : 'en'].forEach((t, i) => slip(ctx, [300, 330][i], [210, 840][i], zh ? 260 : 330, zh ? 88 : 78, [-0.06, 0.05][i], t, {}));
  // 那条铁律：先被划掉，再换成一句话
  const ix = ENSO.cx + ENSO.r + 4, iy = ENSO.cy + 40;
  const strikeK = smooth(ramp(u, lerp(g2, g2e, 0.32), lerp(g2, g2e, 0.45)));
  const fallK = ramp(u, lerp(g2, g2e, 0.6), lerp(g2, g2e, 0.6) + 2.0);
  if (fallK < 1) {
    const yy = iy + fallK * fallK * 900, rr = 0.05 + fallK * 2;
    slip(ctx, ix, yy, zh ? 360 : 400, 100, rr, zh ? '绝对不许写注释' : 'NEVER WRITE COMMENTS', { alpha: 1 - ease(fallK, 0.6, 1) });
    if (strikeK > 0) { ctx.save(); ctx.translate(ix, yy); ctx.rotate(rr); inkStroke(ctx, [[-160, 6], [0, -4], [160, 4]], { w: 6, p: strikeK, seed: 90, dry: 0.4, alpha: 1 - ease(fallK, 0.6, 1) }); ctx.restore(); }
  }
  writeLine(ctx, zh ? '照着周围已有的写法来。' : 'Follow the style around you.', ENSO.cx + ENSO.r + 60, ENSO.cy + 250, zh ? 40 : 38, zh ? BRUSH : GARA, ramp(u, lerp(g2, g2e, 0.7), g2e + 0.5), { style: zh ? '' : 'italic' });
  // 一方印，落在圆相旁
  seal(ctx, ENSO.cx + 120, ENSO.cy + 150, 78, '放手', { k: ease(u, sw + 1.3, sw + 1.9), seed: 55 });
  ctx.restore();
};

// ═══ 八 · 今后：一页一页改稿，朱笔圈留、划去 ═══
const DRAFT = {
  zh: ['写给第一次用它的人', '必须先列出五个步骤', '保留原文里的事实', '再次强调，绝对不许出错', '先说结论', '每段不超过三十字'],
  en: ['Write for first-time users', 'Always list five steps first', 'Keep the original facts', 'Once again: absolutely no mistakes', 'Lead with the answer', 'At most thirty words a line'],
};
const MARKS = [1, 0, 1, 0, 1, 1];
SHOT.grading = (ctx, u, dur, sh) => {
  const zh = TL.lang === 'zh';
  ctx.save(); cam(ctx, 1.0 + 0.03 * (u / dur), CX, CY - 30);
  paper(ctx);
  const f0 = at(sh, 'f0'), f0e = at(sh, 'f0', 1);
  const sw = 900, shh = 640, x0 = CX - sw / 2, y0 = CY - 50 - shh / 2;
  // 叠在下面的前两稿
  for (let v = 2; v >= 0; v--) {
    ctx.save(); ctx.translate(CX, CY - 50); ctx.rotate([0, -0.035, 0.03][v]); ctx.translate(-CX + v * 22, -(CY - 50) + v * 16);
    ctx.shadowColor = 'rgba(70,46,24,0.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = v ? 'rgb(236,228,208)' : 'rgb(245,238,222)'; ctx.fillRect(x0, y0, sw, shh);
    ctx.restore();
  }
  ctx.strokeStyle = rgba(CINNABAR, 0.35); ctx.lineWidth = 1.4;
  for (let r = 0; r < 6; r++) { const y = y0 + 150 + r * 76 + 20; ctx.beginPath(); ctx.moveTo(x0 + 70, y); ctx.lineTo(x0 + sw - 70, y); ctx.stroke(); }
  inkText(ctx, zh ? '第三稿' : 'Draft 3', x0 + 80, y0 + 70, zh ? 34 : 34, zh ? KAI : GARA, { align: 'left', style: zh ? '' : 'italic', alpha: 0.85 });
  seal(ctx, x0 + sw - 90, y0 + 74, 62, '三稿', { k: ease(u, 0.5, 1.1), seed: 63 });
  const lines = DRAFT[zh ? 'zh' : 'en'];
  lines.forEach((l, i) => {
    const y = y0 + 150 + i * 76;
    inkText(ctx, l, x0 + 130, y, zh ? 38 : 38, zh ? KAI : GARA, { align: 'left', style: zh ? '' : 'italic', alpha: 0.9 });
    const t0 = lerp(f0, f0e, 0.32 + i * 0.1), k = ease(u, t0, t0 + 0.45);
    if (k <= 0) return;
    if (MARKS[i]) {
      const pts = [];
      for (let j = 0; j <= 14; j++) { const a = -2 + (j / 14) * TAU * 0.95; pts.push([x0 + 92 + Math.cos(a) * 18, y + Math.sin(a) * 18]); }
      inkStroke(ctx, pts, { w: 4, p: k, color: CINNABAR, seed: 80 + i, dry: 0.3, bleed: 0.4 });
    } else {
      ctx.save(); ctx.font = `${zh ? '' : 'italic'} 38px ${zh ? KAI : GARA}`; const w = ctx.measureText(l).width; ctx.restore();
      inkStroke(ctx, [[x0 + 120, y + 2], [x0 + 130 + w / 2, y - 4], [x0 + 140 + w, y + 3]], { w: 5, p: k, color: CINNABAR, seed: 85 + i, dry: 0.4 });
    }
  });
  ctx.restore();
};

// ═══ 放手，不是什么都不说：四方印 ═══
const SEALS = ['志', '义', '界', '度'];
const SEAL_TEXT = { zh: ['想做成什么', '为什么值得', '不能接受的代价', '怎样才算好'], en: ['what you hope to make', 'why it is worth making', 'what it must not cost', 'what counts as good'] };
SHOT.seals = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 1.0 + 0.03 * (u / dur), CX, CY - 40);
  paper(ctx);
  const f1 = at(sh, 'f1'), f2 = at(sh, 'f2'), f2e = at(sh, 'f2', 1);
  const zh = TL.lang === 'zh';
  SEALS.forEach((ch, i) => {
    const x = CX + (i - 1.5) * 300, y = CY - 80;
    const slotK = ease(u, f1 + 0.6 + i * 0.25, f1 + 1.4 + i * 0.25);
    ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = rgba(INK, 0.4 * slotK); ctx.lineWidth = 1.6;
    ctx.strokeRect(x - 80, y - 80, 160, 160); ctx.restore();
    const t0 = lerp(f2, f2e, [0.02, 0.23, 0.45, 0.66][i]);
    seal(ctx, x, y, 140, ch, { k: ease(u, t0, t0 + 0.7), seed: 30 + i });
    const tk = ease(u, t0 + 0.3, t0 + 1.2);
    inkText(ctx, SEAL_TEXT[TL.lang][i], x, y + 128, zh ? 30 : 28, zh ? KAI : GARA, { alpha: tk * 0.85, style: zh ? '' : 'italic', spacing: zh ? '3px' : '0px' });
  });
  inkStroke(ctx, [[CX - 600, CY + 200], [CX, CY + 192], [CX + 600, CY + 202]], { w: 8, p: smooth(ramp(u, lerp(f2, f2e, 0.84), f2e + 1.2)), seed: 91, dry: 0.8 });
  ctx.restore();
};

// ═══ 少安排每一步：一笔山水自己走完 ═══
let MT_FREE;
const FREE = { seed: 13, base: 690, amp: 300, ox: -200, oy: -40 };
INITS.push(() => { MT_FREE = makeMountains(FREE.seed, 2400, 1000, FREE.base, FREE.amp, 0.4, 3); });
SHOT.freehand = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 1.06 - 0.06 * ease(u, 0, dur), CX, CY - 30);
  paper(ctx);
  const f3 = at(sh, 'f3'), f3e = at(sh, 'f3', 1);
  const pts = [];
  for (let x = 150; x <= 1680; x += 90) pts.push([x, mtRidge(FREE.seed, FREE.base, FREE.amp, x - FREE.ox) + FREE.oy]);
  const p = smooth(ramp(u, f3 - 0.2, f3e + 1.2));
  const tip = strokePoint(pts, p);
  if (p > 0) {
    // 山下的墨晕跟着笔走，左右两端柔和地化开
    const tmp = makeTemp(), tx = tmp.getContext('2d');
    tx.save(); tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, H);
    tx.drawImage(MT_FREE, FREE.ox, FREE.oy);
    const g = tx.createLinearGradient(110, 0, tip[0] + 20, 0);
    const span = Math.max(1, tip[0] + 20 - 110);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(clamp(150 / span, 0.01, 0.45), 'rgba(0,0,0,1)');
    g.addColorStop(clamp(1 - 140 / span, 0.5, 0.99), 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    tx.globalCompositeOperation = 'destination-in'; tx.fillStyle = g; tx.fillRect(0, 0, W, H);
    tx.restore();
    ctx.save(); ctx.globalAlpha = 0.65 * ease(u, f3, f3 + 2); ctx.drawImage(tmp, 0, 0); ctx.restore();
  }
  inkStroke(ctx, pts, { w: 11, p, seed: 97, dry: 0.6, taper: 0.15, head: 0.02 });
  // 水面与一叶小舟
  const bk = ease(u, f3e - 0.5, f3e + 1.5);
  ctx.strokeStyle = rgba(INK, 0.22 * bk); ctx.lineWidth = 1.2;
  for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(760 + r * 30, 860 + r * 14); ctx.lineTo(1240 - r * 40, 860 + r * 14); ctx.stroke(); }
  inkStroke(ctx, [[930, 852], [990, 860], [1050, 850]], { w: 4, alpha: bk, seed: 98, dry: 0 });
  ctx.fillStyle = rgba(INK, 0.85 * bk); ctx.beginPath(); ctx.arc(992, 834, 6, 0, TAU); ctx.fill(); ctx.fillRect(988, 838, 9, 14);
  // 人留下的：四方小印，与最后一方名章
  SEALS.forEach((ch, i) => seal(ctx, W - 140, 190 + i * 82, 54, ch, { seed: 30 + i, alpha: 0.95 }));
  seal(ctx, 250, 780, 86, '放手', { k: ease(u, dur - 3.4, dur - 2.8), seed: 55 });
  ctx.restore();
};

SHOT.end = (ctx, u, dur) => {
  paper(ctx);
  const { y } = drawTitle(ctx, u, false);
  inkText(ctx, 'IDEVLAB', CX, y + 24, 30, GARA, { alpha: 0.75 * ease(u, 3.0, 4.2), spacing: '10px' });
};
