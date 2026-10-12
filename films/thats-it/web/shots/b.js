// 漏斗（八十亿人）、海（问题的大小）、山脉与山谷（本事不平均）、一道门（看得到多少）。

// —— 漏斗 ——
// 粒子的层级只是示意，不按比例：真按比例，下面两层根本看不见
const FUN = [];
const TIER_D = [[0, 0.42], [0.42, 0.72], [0.72, 0.93], [0.995, 1]];
const TIER_RGB = [[128, 140, 186], C.warmRGB, C.aiRGB, [255, 246, 220]];
INITS.push(() => {
  FUN.length = 0;
  const N = 2400, counts = [1700, 540, 159, 1];
  let i = 0;
  counts.forEach((n, tier) => {
    for (let j = 0; j < n; j++, i++) {
      const [d0, d1] = TIER_D[tier];
      const d = tier === 3 ? 1 : lerp(d0, d1, Math.pow(rand(i, 201), tier === 0 ? 0.8 : 1));
      FUN.push({ tier, d, th: rand(i, 202) * TAU, jit: rand(i, 203), sz: rand(i, 204), sx: rand(i, 205), sy: rand(i, 206), del: rand(i, 207) });
    }
  });
});
function funnelR(d) { return 520 * Math.pow(1 - d, 1.25) + 8; }
SHOT.funnel = (g, u, dur, cue) => {
  const TC = ['L09', 'L10', 'L11', 'L12', 'L13'].map((id) => cue(id, 0));
  sky(g, SKIES.deep, H);
  stars(g, u + 50, 0.6, { n: 180, h: H, seed: 21 });
  // 镜头：先看全貌，再一层层往下走，最后贴近漏斗尖
  const dive = io(u, TC[1], TC[4] + 2.5);
  const zoom = lerp(1, 1.5, ease(u, TC[3], TC[4] + 3)) * L(1, 0.95);
  const cam = { yaw: u * 0.12, pitch: -0.42, dist: 1700, fov: L(1180, 1100) * zoom, cx: L(W * 0.4, CX), cy: lerp(L(CY - 40, ST.cy + 20), L(CY - 300, ST.cy - 240), dive) };
  const Hf = 900, form = (i, p) => ease(u, 0.1 + p.del * 1.4, 1.6 + p.del * 1.6);
  // 当前点亮到第几层
  const on = (tier) => (tier === 0 ? ease(u, TC[1], TC[1] + 0.6) : tier === 1 ? ease(u, TC[2], TC[2] + 0.6) : tier === 2 ? ease(u, TC[3], TC[3] + 0.6) : ease(u, TC[4], TC[4] + 0.5));
  const focus = u < TC[1] ? -1 : u < TC[2] ? 0 : u < TC[3] ? 1 : u < TC[4] ? 2 : 3;
  g.save();
  g.globalCompositeOperation = 'lighter';
  // 漏斗的轮廓线
  for (let r = 0; r <= 1; r += 0.125) {
    const pts = [];
    for (let a = 0; a <= TAU + 0.01; a += TAU / 60) { const p = proj([funnelR(r) * Math.cos(a), r * Hf - Hf / 2, funnelR(r) * Math.sin(a)], cam); if (p) pts.push(p); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.strokeStyle = `rgba(150,160,220,${0.06 * ease(u, 0.5, 2)})`; g.lineWidth = 1.2; g.stroke();
  }
  for (let i = 0; i < FUN.length; i++) {
    const p = FUN[i];
    const r = funnelR(p.d) * (0.92 + 0.08 * p.jit);
    const spin = 0.15 / (0.15 + (1 - p.d)) * 0.9 + 0.08;
    const a = p.th + u * spin;
    const tgt = proj([r * Math.cos(a), p.d * Hf - Hf / 2, r * Math.sin(a)], cam);
    if (!tgt) continue;
    const f = form(i, p);
    // 起点：散落在画面下方的灯火（接片名里升起的灯）
    const x = lerp(p.sx * W, tgt[0], f), y = lerp(H * (0.5 + 0.5 * p.sy), tgt[1], f);
    const lit = on(p.tier), foc = focus === p.tier ? 1 : focus > p.tier ? 0.55 : 0.35;
    const base = p.tier === 0 ? 0.5 : 0.35;
    const rgb = lit > 0 ? mixRGB([110, 118, 160], TIER_RGB[p.tier], lit) : [110, 118, 160];
    const rad = (p.tier === 3 ? 26 : p.tier === 2 ? 8 : p.tier === 1 ? 6.5 : 5) * (0.7 + 0.6 * p.sz) * tgt[2] * U * 1.35;
    glow(g, x, y, rad * (1 + lit * 0.4 * (focus === p.tier ? 1 : 0)), rgb, (base + lit * 0.5) * (focus === -1 ? 0.9 : foc + 0.2), 1);
  }
  // 漏斗尖：五千人，亮得刺眼
  const tip = proj([0, Hf / 2, 0], cam);
  const tk = on(3);
  if (tip && tk > 0) {
    glow(g, tip[0], tip[1], 160 * U * tk * (1 + 0.1 * Math.sin(u * 6)), [255, 236, 200], 0.9 * tk);
    glow(g, tip[0], tip[1], 30 * U * tk, [255, 255, 255], 1, 1);
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * TAU + u * 0.3, len = (120 + 80 * rand(j, 230)) * U * tk;
      g.strokeStyle = `rgba(255,240,210,${0.35 * tk})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(tip[0] + Math.cos(a) * 20, tip[1] + Math.sin(a) * 20); g.lineTo(tip[0] + Math.cos(a) * len, tip[1] + Math.sin(a) * len); g.stroke();
    }
  }
  g.restore();
  // 第二层：小小的聊天框冒出来又消失
  const bk = on(1) * (1 - ease(u, TC[3] + 0.5, TC[3] + 1.5));
  if (bk > 0) {
    for (let j = 0; j < 9; j++) {
      const p = FUN[1700 + j * 37], a = p.th + u * (0.15 / (0.15 + (1 - p.d)) * 0.9 + 0.08);
      const q = proj([funnelR(p.d) * Math.cos(a), p.d * Hf - Hf / 2, funnelR(p.d) * Math.sin(a)], cam);
      if (!q || Math.sin(a) < -0.2) continue;
      const ph = (u * 0.6 + rand(j, 240)) % 1;
      g.save(); g.globalAlpha = bk * Math.sin(ph * Math.PI);
      rr(g, q[0] - 22 * U, q[1] - 44 * U, 44 * U, 26 * U, 8 * U); g.fillStyle = '#ffe0a8'; g.fill();
      txt(g, '…', q[0], q[1] - 33 * U, 22 * U, '#5a4030', { family: F.lora });
      g.restore();
    }
  }
  // 标签：每一层一个数字
  const labels = TL.txt.tiers;
  const lx = L(W * 0.6, CX), size = L(1, 0.82);
  // 80 亿人
  const k0 = ease(u, 0.6, 1.4) * (1 - ease(u, TC[1] - 0.3, TC[1] + 0.2));
  if (k0 > 0) {
    g.save(); g.globalAlpha = k0;
    txt(g, T('eightB'), L(lx + 120, CX), L(CY - 120, ST.y + 70), L(120, 110), C.ink, { shadow: 'rgba(0,0,0,0.8)', blur: 30 });
    if (TL.lang !== 'en') txt(g, TL.txt.eightBEn, L(lx + 120, CX), L(CY - 30, ST.y + 160), L(30, 28), C.dim, { family: F.lora, spacing: '6px' });
    g.restore();
  }
  for (let tier = 0; tier < 4; tier++) {
    const k = on(tier) * (focus === tier ? 1 : 0.0) + (focus > tier ? 0 : 0);
    const kk = on(tier) * (focus === tier ? 1 : 1 - ease(u, TC[tier + 2] ?? 1e9, (TC[tier + 2] ?? 1e9) + 0.4));
    if (kk <= 0.004) continue;
    // 从这一层的右边缘拉出一根细线
    const d = tier === 3 ? 1 : (TIER_D[tier][0] + TIER_D[tier][1]) / 2;
    const edge = proj([funnelR(d), d * Hf - Hf / 2, 0], { ...cam, yaw: 0 });
    const ly = PORTRAIT ? ST.y + ST.h - 120 : clamp(edge ? edge[1] : CY, 200, H - 330);
    g.save(); g.globalAlpha = kk;
    if (!PORTRAIT && edge) {
      g.strokeStyle = rgba(TIER_RGB[tier], 0.6); g.lineWidth = 2;
      g.beginPath(); g.moveTo(edge[0] + 10, edge[1]); g.lineTo(lx - 30, ly); g.stroke();
      glow(g, edge[0] + 10, edge[1], 14, TIER_RGB[tier], 1, 1);
    }
    const ax = PORTRAIT ? CX : lx, al = PORTRAIT ? 'center' : 'left';
    const e = ex(u, TC[tier + 1], TC[tier + 1] + 0.5);
    txt(g, labels[tier].n, ax + (1 - e) * 40, ly - 50 * size, 110 * size, rgba(mixRGB(TIER_RGB[tier], [255, 255, 255], 0.3), 1), { align: al, shadow: rgba(TIER_RGB[tier], 0.5), blur: 30 });
    if (TL.lang === 'en') txt(g, labels[tier].en, ax, ly + 40 * size, 30 * size, C.ink, { align: al, family: F.lora, weight: '600', spacing: '2px', shadow: 'rgba(0,0,0,0.9)', blur: 14, maxW: L(W - lx - 60, W - 100) });
    else {
      txt(g, `${labels[tier].pct} · ${labels[tier].what}`, ax, ly + 40 * size, 40 * size, C.ink, { align: al, shadow: 'rgba(0,0,0,0.9)', blur: 14, maxW: L(W - lx - 60, W - 100) });
      txt(g, labels[tier].en, ax, ly + 88 * size, 22 * size, C.dim, { align: al, family: F.lora, spacing: '3px' });
    }
    g.restore();
  }
  // 他们看见了什么？
  if (tip) {
    const qk = ease(u, TC[4] + 2.2, TC[4] + 2.8);
    if (qk > 0) txt(g, '？', tip[0] + L(-150, -130), tip[1] - L(90, 100), L(110, 96), C.gold, { alpha: qk, shadow: rgba(C.goldRGB, 0.8), blur: 40 });
  }
};

// —— 海：一杯水，量不出海有多深 ——
SHOT.sea = (g, u, dur, cue) => {
  const t15 = cue('L15', dur / 2);
  const surf = L(H * 0.5, 980); // 海面在屏幕上的位置（入水前）
  // 一团暖光（你真在乎的问题）沉下去；镜头跟着它
  const sinkK = io(u, t15, dur + 0.6);
  const orbY = surf + 40 + sinkK * L(1500, 1700), ox = L(W * 0.68, CX + 150);
  const dive = io(u, t15 - 0.3, t15 + 1.4);
  const oy = dive * Math.max(0, orbY - L(H * 0.4, 820));
  g.save(); g.translate(0, -oy);
  // 天与月
  sky(g, SKIES.night, surf, { top: surf - H });
  stars(g, u + 70, 1, { n: 160, h: surf, seed: 31 });
  const mx = L(W * 0.7, W * 0.68), my = surf - L(330, 380);
  moon(g, mx, my, 44 * U);
  // 海面以下：越深越暗，没有底
  const deep = g.createLinearGradient(0, surf, 0, surf + L(2400, 2800));
  deep.addColorStop(0, '#22356a'); deep.addColorStop(0.12, '#14244f'); deep.addColorStop(0.45, '#081232'); deep.addColorStop(1, '#02040e');
  g.fillStyle = deep; g.fillRect(0, surf, W, L(3200, 3600));
  // 水面下的光柱
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let j = 0; j < 7; j++) {
    const x = W * (0.08 + j * 0.14) + Math.sin(u * 0.5 + j) * 30, w = (40 + 60 * rand(j, 300)) * U;
    const lg = g.createLinearGradient(0, surf, 0, surf + L(1100, 1200));
    lg.addColorStop(0, `rgba(140,180,255,${0.10 + 0.05 * Math.sin(u + j)})`); lg.addColorStop(1, 'rgba(140,180,255,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x, surf); g.lineTo(x + w, surf); g.lineTo(x + w * 2.5 + 160, surf + L(1100, 1200)); g.lineTo(x + 160, surf + L(1100, 1200)); g.closePath(); g.fill();
  }
  g.restore();
  // 月光在海面上的碎影
  for (let i = 0; i < 46; i++) {
    const yy = surf + 6 + Math.pow(i / 46, 1.6) * L(260, 300), w = (12 + 80 * rand(i, 300)) * (1 + i / 30) * U;
    const xx = mx + Math.sin(u * 1.2 + i * 1.7) * (10 + i * 2.2) * U;
    g.fillStyle = `rgba(255,236,200,${0.5 * (1 - i / 50)})`; g.fillRect(xx - w / 2, yy, w, 2.2 * U);
  }
  g.fillStyle = 'rgba(170,200,255,0.3)'; g.fillRect(0, surf - 1, W, 2);
  // 一只茶杯，舀起一杯水
  const cx = L(W * 0.3, W * 0.32), tilt = Math.sin(clamp(ramp(u, 0.4, 2.4)) * Math.PI);
  const cupY = surf - L(40, 50) + tilt * L(50, 50) - ease(u, 2.4, 3.4) * L(90, 90);
  const cs = L(1.15, 1.05) * U;
  g.save(); g.translate(cx, cupY); g.rotate(-0.9 * tilt); g.scale(cs, cs);
  g.beginPath(); g.moveTo(-80, -50); g.bezierCurveTo(-80, 40, -40, 70, 0, 70); g.bezierCurveTo(40, 70, 80, 40, 80, -50); g.closePath();
  const cg = g.createLinearGradient(-80, 0, 80, 0); cg.addColorStop(0, '#d8d2c4'); cg.addColorStop(0.5, '#fbf6ea'); cg.addColorStop(1, '#bdb6a8');
  g.fillStyle = cg; g.fill();
  g.strokeStyle = '#c9a25e'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, -50, 80, 14, 0, 0, TAU); g.stroke();
  g.fillStyle = '#2a4a8a'; g.beginPath(); g.ellipse(0, -50, 74, 11, 0, 0, TAU); g.fill();
  g.strokeStyle = '#e8e2d4'; g.lineWidth = 12; g.beginPath(); g.arc(98, 0, 26, -1.2, 1.2); g.stroke();
  g.restore();
  const dk = ramp(u, 2.6, 3.6);
  if (dk > 0 && dk < 1) for (let j = 0; j < 3; j++) { const yy = cupY + 70 * cs + dk * 140 * U + j * 20; glow(g, cx + (j - 1) * 14, yy, 7 * U, [200, 225, 255], 0.9 * (1 - dk), 1); }
  txt(g, T('cup'), cx, cupY - L(140, 140), L(50, 50), C.ink, { alpha: ease(u, 0.6, 1.2) * (1 - dive), shadow: 'rgba(0,0,0,0.8)', blur: 16 });
  // 深度刻度：一直往下，没有底
  g.fillStyle = 'rgba(180,200,255,0.3)';
  for (let j = 1; j <= 16; j++) { const yy = surf + j * L(140, 160); g.fillRect(L(70, 44), yy, j % 4 ? 16 : 44, 2); }
  const ok = ease(u, t15 - 0.4, t15 + 0.1);
  if (ok > 0) {
    // 光照出的深处：一头巨大的鲸，安静地游过
    const lightR = L(820, 700);
    const wy = surf + L(1470, 1640), wx = L(W * 0.3, CX - 120) + (u - t15) * 22 * U;
    const wk = ok * ease(u, t15 + 1.0, t15 + 2.6);
    if (wk > 0) {
      g.save(); g.globalAlpha = wk;
      const wg = g.createRadialGradient(ox, orbY, 0, ox, orbY, lightR * 1.4);
      wg.addColorStop(0, '#3d5f9a'); wg.addColorStop(1, '#0c1838');
      g.fillStyle = wg;
      const R = L(560, 440), r = L(120, 96);
      g.beginPath(); g.ellipse(wx, wy, R, r, -0.04, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(wx - R * 0.95, wy - r * 0.1); g.quadraticCurveTo(wx - R * 1.25, wy - r * 0.3, wx - R * 1.38, wy - r * 1.1);
      g.quadraticCurveTo(wx - R * 1.3, wy, wx - R * 1.4, wy + r * 0.9); g.quadraticCurveTo(wx - R * 1.2, wy + r * 0.2, wx - R * 0.9, wy + r * 0.25); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(wx + R * 0.2, wy + r * 0.9, R * 0.22, r * 0.2, 0.5, 0, TAU); g.fill();
      g.fillStyle = 'rgba(200,220,255,0.18)';
      for (let j = 0; j < 9; j++) { g.fillRect(wx + R * 0.1 + j * R * 0.07, wy + r * 0.35, R * 0.035, r * 0.45); }
      g.fillStyle = '#e8f0ff'; g.beginPath(); g.arc(wx + R * 0.7, wy - r * 0.05, 6 * U, 0, TAU); g.fill();
      g.restore();
    }
    // 浮游的光点
    for (let j = 0; j < 110; j++) {
      const px = rand(j, 310) * W, py = surf + 80 + rand(j, 311) * L(2300, 2600) + Math.sin(u + j) * 10;
      const near = clamp(1 - Math.hypot(px - ox, py - orbY) / lightR);
      glow(g, px, py, (3 + 5 * rand(j, 312)) * U, [150, 220, 255], (0.12 + 0.85 * near) * ok, 1);
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, ox, orbY, lightR, [90, 150, 230], 0.35 * ok);
    const lg = g.createLinearGradient(0, orbY, 0, orbY + L(1000, 1000));
    lg.addColorStop(0, rgba(C.goldRGB, 0.22 * ok)); lg.addColorStop(1, rgba(C.goldRGB, 0));
    g.fillStyle = lg; g.beginPath(); g.moveTo(ox - 24, orbY); g.lineTo(ox + 24, orbY); g.lineTo(ox + L(380, 300), orbY + L(1000, 1000)); g.lineTo(ox - L(380, 300), orbY + L(1000, 1000)); g.closePath(); g.fill();
    glow(g, ox, orbY, 240 * U, C.goldRGB, 0.85 * ok);
    g.restore();
    glow(g, ox, orbY, 44 * U, [255, 250, 230], ok, 1);
    txt(g, T('deep'), ox + L(90, 0), orbY + L(0, -110), L(50, 46), C.gold, { align: L('left', 'center'), alpha: ease(u, t15 + 0.4, t15 + 1.0), shadow: 'rgba(0,0,0,0.9)', blur: 16 });
  }
  g.restore();
};

// —— 山脉：它的本事不是平原 ——
// 能对答案的地方（算式、代码、证明）高得惊人；日常生活在山谷里
const PEAKS = [[0.22, 0.6, 'peakA'], [0.5, 1.0, 'peakB'], [0.77, 0.74, 'peakC']];
function ridge(x, rise, grow, seed = 1) {
  // x：0..1；返回 0..1 的高度。尖峰 + 锯齿，不是馒头
  let h = 0.07 + 0.05 * fbm(x * 5, seed);
  for (const [px, ph] of PEAKS) {
    const d = Math.abs(x - px), w = 0.075 + 0.05 * ph;
    const g2 = ph > 0.9 ? grow + (grow - 1) * 0.5 : grow;
    h += ph * g2 * Math.pow(Math.max(0, 1 - d / w), 1.35);
  }
  // 次要的小峰与锯齿
  h += 0.2 * Math.pow(Math.max(0, fbm(x * 9, seed + 3)), 1.1);
  h += 0.05 * fbm(x * 34, seed + 9) * (0.3 + h) + 0.025 * fbm(x * 110, seed + 11) * (0.3 + h);
  return 0.015 + (h - 0.015) * rise;
}
function range(g, u, o) {
  const { base, top, rise, grow, sun, x0 = 0, x1 = W } = o;
  const Hm = base - top;
  // 远处的山（淡）
  g.beginPath(); g.moveTo(x0 - 50, base);
  for (let x = x0 - 50; x <= x1 + 50; x += 6) g.lineTo(x, base - Hm * 0.42 * rise * (0.35 + 0.65 * (0.5 + 0.5 * fbm(x / W * 7, 77))) - Hm * 0.03 * fbm(x / W * 40, 78));
  g.lineTo(x1 + 50, base); g.closePath();
  g.fillStyle = 'rgba(126,112,176,0.5)'; g.fill();
  // 主山脉：越高越早被太阳照到
  const pts = [];
  for (let x = x0 - 50; x <= x1 + 50; x += 3) pts.push([x, base - Hm * ridge((x - x0) / (x1 - x0), rise, grow)]);
  g.save();
  g.beginPath(); g.moveTo(x0 - 50, base); pts.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(x1 + 50, base); g.closePath();
  const mg = g.createLinearGradient(0, top - Hm * 0.2, 0, base);
  const S = clamp(sun);
  mg.addColorStop(0, rgba(mixRGB([70, 66, 128], [255, 222, 160], S), 1));
  mg.addColorStop(0.22, rgba(mixRGB([62, 58, 118], [246, 160, 120], S), 1));
  mg.addColorStop(0.5, rgba(mixRGB([50, 48, 104], [120, 84, 140], S * 0.8), 1));
  mg.addColorStop(1, '#141434');
  g.fillStyle = mg; g.fill();
  g.clip();
  // 背光面：每座峰的右侧
  for (const [px, ph] of PEAKS) {
    const cx = x0 + px * (x1 - x0), cy = base - Hm * ridge(px, rise, grow);
    const sg = g.createLinearGradient(cx, cy, cx + Hm * 0.5, base);
    sg.addColorStop(0, 'rgba(14,12,48,0.55)'); sg.addColorStop(1, 'rgba(14,12,48,0.15)');
    g.fillStyle = sg; g.beginPath(); g.moveTo(cx, cy - 2); g.lineTo(cx + (x1 - x0) * (0.11 + 0.05 * ph) * 1.1, base); g.lineTo(cx + 6, base); g.closePath(); g.fill();
  }
  // 山脚的雾
  const fg = g.createLinearGradient(0, base - Hm * 0.35, 0, base);
  fg.addColorStop(0, 'rgba(60,50,110,0)'); fg.addColorStop(1, 'rgba(60,50,110,0.65)');
  g.fillStyle = fg; g.fillRect(x0 - 60, base - Hm * 0.35, x1 - x0 + 120, Hm * 0.35);
  g.restore();
  // 山脊上的高光
  g.strokeStyle = rgba([255, 232, 196], 0.55 * S + 0.1); g.lineWidth = 2;
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
  return pts;
}
SHOT.peaks = (g, u, dur, cue) => {
  const t17 = cue('L17', 3.3), t18 = cue('L18', 7.5);
  const base = L(H * 0.86, ST.y + ST.h), top = L(H * 0.14, ST.y + 60);
  const sunK = ease(u, t17 - 0.2, t17 + 1.8);
  const skyStops = lerpSky('night', 'dawn', 0.35 + 0.65 * sunK);
  sky(g, skyStops, base);
  stars(g, u + 90, 1 - sunK, { n: 140, h: base * 0.7, seed: 41 });
  // 日出的光晕在山后
  glow(g, L(W * 0.62, CX + 80), base - 60, L(900, 760), [255, 200, 150], 0.5 * sunK);
  const rise = ex(u, 0.25, 1.9), grow = 1 + 0.18 * ease(u, t18 + 0.4, dur);
  const z = 1 + 0.04 * ease(u, 0, dur);
  g.save(); g.translate(CX, base); g.scale(z, z); g.translate(-CX, -base);
  // 平原 → 山脉
  const x0 = L(0, -110), x1 = L(W, W + 110);
  range(g, u, { base, top, rise, grow, sun: sunK, x0, x1 });
  // 近处的暗丘
  g.beginPath(); g.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) g.lineTo(x, base - 40 + 30 * fbm(x / W * 3, 9)); g.lineTo(W + 50, H); g.closePath();
  g.fillStyle = '#0c0c26'; g.fill();
  // 峰顶的名字
  const Hm = base - top;
  PEAKS.forEach(([px, ph, key], i) => {
    const x = x0 + px * (x1 - x0), y = base - Hm * ridge(px, rise, grow);
    const k = ease(u, t17 + 0.3 + i * 0.35, t17 + 0.9 + i * 0.35);
    if (k <= 0) return;
    glow(g, x, y, 90 * U, C.goldRGB, 0.6 * k);
    txt(g, T(key), x, y - L(60, 54), L(56, 50), '#fff6e2', { alpha: k, shadow: 'rgba(80,40,10,0.8)', blur: 18 });
  });
  // 一遍遍“对答案”：✓ 落在峰顶，山就再长高一点
  if (u > t18 - 0.2) {
    for (let j = 0; j < 70; j++) {
      const pk = PEAKS[j % 3], st = t18 - 0.2 + rand(j, 320) * (dur - t18 - 0.4);
      const k = ramp(u, st, st + 0.9);
      if (k <= 0 || k >= 1) continue;
      const x = x0 + (pk[0] + (rand(j, 321) - 0.5) * 0.05) * (x1 - x0), yEnd = base - Hm * ridge(pk[0], rise, grow);
      const y = lerp(top - 160, yEnd, k * k);
      const bad = rand(j, 322) > 0.78;
      txt(g, bad ? '✗' : '✓', x, y, L(54, 48), bad ? '#ff9a8b' : '#b8ffd8', { family: F.lora, alpha: (1 - k) * 0.4 + 0.6 * (k < 0.85 ? 1 : (1 - k) / 0.15), shadow: bad ? 'rgba(255,120,120,0.6)' : 'rgba(150,255,200,0.7)', blur: 16 });
      if (k > 0.9 && !bad) glow(g, x, yEnd, 40 * U, [190, 255, 220], (1 - k) * 8);
    }
  }
  g.restore();
};

// —— 山谷：找馆子、过日子，阳光还没照到 ——
SHOT.valley = (g, u, dur) => {
  const base = L(H * 0.86, ST.y + ST.h), top = L(H * 0.14, ST.y + 60);
  const tilt = io(u, 0, 1.6);
  const oy = tilt * L(420, 360);
  sky(g, lerpSky('night', 'dawn', 1), base - oy);
  g.save(); g.translate(0, -oy);
  const sc = 1.04;
  g.save(); g.translate(CX, base); g.scale(sc, sc); g.translate(-CX, -base);
  range(g, u, { base, top, rise: 1, grow: 1.18, sun: 1, x0: L(0, -110), x1: L(W, W + 110) });
  g.restore();
  // 山谷：蓝色的影子里，一个小村子
  const vy = base + L(20, 10);
  const vg = g.createLinearGradient(0, base - 60, 0, base + L(420, 360));
  vg.addColorStop(0, '#1d1d4a'); vg.addColorStop(1, '#0b0b24');
  g.fillStyle = vg; g.beginPath(); g.moveTo(-50, base - 30);
  for (let x = -50; x <= W + 50; x += 10) g.lineTo(x, base - 30 + 24 * fbm(x / W * 4, 13));
  g.lineTo(W + 50, H + oy + 400); g.lineTo(-50, H + oy + 400); g.closePath(); g.fill();
  const houses = L(14, 9);
  for (let i = 0; i < houses; i++) {
    const hx = L(160, 70) + i * (W - L(320, 140)) / (houses - 1) + (rand(i, 330) - 0.5) * 40, hy = vy + L(90, 90) + rand(i, 331) * L(150, 130);
    const hw = (60 + 40 * rand(i, 332)) * U, hh = (46 + 30 * rand(i, 333)) * U;
    g.fillStyle = '#151432'; g.fillRect(hx - hw / 2, hy - hh, hw, hh);
    g.beginPath(); g.moveTo(hx - hw / 2 - 8, hy - hh); g.lineTo(hx, hy - hh - hw * 0.45); g.lineTo(hx + hw / 2 + 8, hy - hh); g.closePath(); g.fill();
    const lit = rand(i, 334) > 0.25;
    if (lit) { g.fillStyle = C.warm; g.fillRect(hx - hw * 0.15, hy - hh * 0.65, hw * 0.3, hh * 0.35); glow(g, hx, hy - hh * 0.5, hw * 0.9, C.warmRGB, 0.4); }
  }
  // 日常的小气泡
  const words = [T('valleyA'), T('valleyB'), T('valleyC')];
  words.forEach((w, i) => {
    const k = ease(u, 1.2 + i * 0.45, 1.7 + i * 0.45);
    if (k <= 0) return;
    const x = L(W * (0.22 + i * 0.28), W * (0.2 + i * 0.3)), y = vy + L(40, 40) - Math.sin(u * 1.5 + i) * 6 + (i === 1 ? -30 : 0);
    bubble(g, w, x + L(80, 60), y, { side: 'r', k, size: L(40, 36), fill: '#ffe2ae' });
  });
  g.restore();
};

// —— 一道门：门外的人只看过预告片 ——
SHOT.door = (g, u, dur, cue) => {
  const t21 = cue('L21', 3.9);
  const vx = L(W * 0.6, CX), vy = L(H * 0.36, 940);
  const push = Math.pow(ease(u, t21 + 0.3, dur + 0.3), 2);
  const z = 1 + 0.05 * ease(u, 0, t21) + push * 2.2;
  g.save(); g.translate(vx, vy); g.scale(z, z); g.translate(-vx, -vy);
  // 墙
  const wg = g.createLinearGradient(0, 0, 0, H);
  wg.addColorStop(0, '#13153a'); wg.addColorStop(1, '#090a1e');
  g.fillStyle = wg; g.fillRect(-W, -H, W * 3, H * 3);
  // 三道门，一道比一道窄，一道比一道亮
  const open = ease(u, t21, t21 + 1.2);
  const frames = [[L(520, 420), L(620, 440), 0.12], [L(330, 270), L(460, 320), 0.35], [L(180, 150), L(320, 220), 1]];
  const fy = L(vy + 310, 1180);
  frames.forEach(([fw, fh, br], i) => {
    const x = vx - fw / 2, y = fy - fh;
    const light = i === 2 ? lerp(0.55, 1, open) : br;
    const gg = g.createLinearGradient(0, y, 0, y + fh);
    gg.addColorStop(0, rgba(mixRGB([30, 34, 80], [255, 246, 225], light), 1)); gg.addColorStop(1, rgba(mixRGB([18, 20, 50], [255, 220, 170], light * 0.9), 1));
    g.fillStyle = gg; g.fillRect(x, y, fw, fh);
    g.strokeStyle = '#05061a'; g.lineWidth = 16; g.strokeRect(x, y, fw, fh);
    txt(g, T('doors')[i], vx, y - L(36, 32), L(40, 36) * (1 - i * 0.15), i === 2 ? C.gold : C.dim, { alpha: 0.95 });
  });
  glow(g, vx, fy - L(160, 120), L(300, 240) * (1 + open), [255, 240, 210], 0.55 + 0.4 * open);
  // 门缝里漏出的光，铺在地上
  const lg = g.createLinearGradient(0, fy, 0, fy + L(300, 260));
  lg.addColorStop(0, `rgba(255,236,200,${0.35 + 0.3 * open})`); lg.addColorStop(1, 'rgba(255,236,200,0)');
  g.fillStyle = lg; g.beginPath(); g.moveTo(vx - L(90, 85), fy); g.lineTo(vx + L(90, 85), fy); g.lineTo(vx + L(700, 540), fy + L(300, 260)); g.lineTo(vx - L(700, 540), fy + L(300, 260)); g.closePath(); g.fill();
  g.fillStyle = '#07071a'; g.fillRect(-W, fy, W * 3, 6);
  // 墙上的预告片：一格格胶片在闪
  const sx = L(W * 0.08, CX - 300), sy = L(H * 0.16, ST.y + 6), sw = L(520, 600), sh = L(320, 160);
  g.fillStyle = '#05050f'; g.fillRect(sx - 14, sy - 14, sw + 28, sh + 28);
  const fr = Math.floor(u * 2.2);
  const sg = g.createLinearGradient(sx, sy, sx + sw, sy + sh);
  sg.addColorStop(0, ['#3b5aa8', '#a85a7a', '#5aa88a', '#a8905a'][((fr % 4) + 4) % 4]); sg.addColorStop(1, '#1a1a3a');
  g.fillStyle = sg; g.fillRect(sx, sy, sw, sh);
  for (let j = 0; j < 10; j++) { g.fillStyle = '#05050f'; g.fillRect(sx + 10 + j * (sw - 20) / 10, sy + 6, 18, 10); g.fillRect(sx + 10 + j * (sw - 20) / 10, sy + sh - 16, 18, 10); }
  txt(g, '▶ ' + T('trailer'), sx + sw / 2, sy + sh / 2, L(48, 44), 'rgba(255,255,255,0.9)', { shadow: 'rgba(0,0,0,0.8)', blur: 10 });
  glow(g, sx + sw / 2, sy + sh / 2, sw * 0.7, [140, 160, 255], 0.25);
  // 门外的人群：仰头看着预告片
  const n = L(26, 16);
  for (let i = 0; i < n; i++) {
    const px = L(60, 40) + i * (W - L(120, 80)) / (n - 1) + (rand(i, 350) - 0.5) * 30, py = fy + L(120, 60) + rand(i, 351) * L(40, 30);
    if (Math.abs(px - vx) < L(110, 90)) continue;
    person(g, px, py - 8.6 * 10 * U, 10 * U * (0.9 + 0.25 * rand(i, 353)), 'look', { color: '#05051a', flip: px > vx, rim: [[255, 220, 170], 0.08 * (px < vx ? 1 : -1), 0, 0.35 * (0.5 + open)] });
  }
  g.restore();
  if (push > 0) { g.fillStyle = `rgba(255,248,232,${push * 0.9})`; g.fillRect(0, 0, W, H); }
};
