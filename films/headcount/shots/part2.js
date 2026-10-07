// 02 交接税 · 03 即时

// 两张海报式的柱：可并行的任务变强，一步扣一步的任务变弱
SHOT.bars = (ctx, u, dur, sh) => {
  paper(ctx);
  const base = 500, Lx = 520, Rx = 1400;
  // 基线
  bar(ctx, 140, base, 1780, base, 8, INK, ease(u, 0.2, 1.0), { seed: 2 });
  bar(ctx, CX, 130, CX, 860, 4, GREY, ease(u, 0.4, 1.2), { lift: 0 });
  // 左：可并行
  const lk = pop(u, at(sh, 'c1', 0.6), 0.5);
  if (lk > 0) {
    head(ctx, '能拆开并行', 'PARALLEL WORK', Lx, 170, 50, { alpha: clamp(lk) });
    // 四个执行者并排干活
    for (let i = 0; i < 4; i++) {
      const x = Lx - 270 + i * 180, bob = Math.sin(u * 4 + i) * 6;
      agent(ctx, x, base + 70 + bob, 30 * clamp(lk));
      memo(ctx, x, base + 150, 70, 46, '·', { lines: 1, alpha: clamp(lk), seed: i, rot: (i - 1.5) * 0.06 });
    }
  }
  const lg = ease(u, at(sh, 'c1', 0.75), at(sh, 'c1', 0.95));
  if (lg > 0) {
    const h = 200 * lg;
    cut(ctx, RED, R(Lx - 90, base - h, 180, h, 3, 1), { lift: 1.2 });
    head(ctx, '+81%', '+81%', Lx, base - h - 50, 80, { fill: RED, alpha: clamp(lg * 2) });
  }
  // 右：一步扣一步，链条一断，柱往下掉
  const rk = pop(u, at(sh, 'c2', 0.05), 0.5);
  if (rk > 0) {
    head(ctx, '一步扣一步', 'STEP BY STEP', Rx, 170, 50, { alpha: clamp(rk) });
    const brk = ease(u, at(sh, 'c2', 0.45), at(sh, 'c2', 0.6));
    for (let i = 0; i < 5; i++) {
      const x = Rx - 280 + i * 140, off = (i >= 2 ? 1 : -1) * brk * (20 + i * 4), drop = brk * (i >= 2 ? 30 : 0);
      ctx.save(); ctx.globalAlpha = clamp(rk);
      ctx.strokeStyle = rgba(INK); ctx.lineWidth = 14;
      ctx.beginPath(); ctx.ellipse(x + off, 290 + drop, 62, 34, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  const rg = ease(u, at(sh, 'c2', 0.62), at(sh, 'c2', 0.9));
  if (rg > 0) {
    // 一组下降的柱：-39% 到 -70%
    const vals = [39, 48, 55, 62, 70];
    vals.forEach((v, i) => {
      const h = v * 3.2 * clamp(rg * 1.3 - i * 0.08);
      if (h > 0) cut(ctx, INK, R(Rx - 250 + i * 104, base, 80, h, i + 7, 1), { lift: 1 });
    });
    head(ctx, '−39% ~ −70%', '−39% TO −70%', Rx, base + 300, 70, { fill: INK, alpha: clamp(rg * 2 - 0.6) });
  }
  // 一百八十种配置：一枚大数字先盖上来
  const nk = win(u, at(sh, 'c1', 0.22), at(sh, 'c1', 0.62), 0.3, 0.4);
  if (nk > 0) {
    ctx.save(); ctx.translate(CX, 330); ctx.scale(lerp(1.3, 1, back(clamp(nk))), lerp(1.3, 1, back(clamp(nk)))); ctx.rotate(-0.05);
    cut(ctx, SLIP, R(-260, -170, 520, 340, 12), { lift: 1.6, alpha: nk });
    txt(ctx, '180', 0, -20, 220, DEN, { fill: RED, alpha: nk });
    label(ctx, '种智能体配置', 'AGENT CONFIGURATIONS', 0, 120, 36, { fill: INK, alpha: nk });
    ctx.restore();
  }
  // 出处
  txt(ctx, 'Google Research & MIT · “Towards a Science of Scaling Agent Systems” · arXiv 2512.08296 · 180 configurations',
    CX, 860, 22, BEN, { fill: GREY, alpha: ease(u, at(sh, 'c1', 0.4), at(sh, 'c1', 0.6)) });
};

// 传话：一个复杂的意图，每经过一张工位就少几个角，掉下几片“隐含决定”
function starShape(cx, cy, r, pts, inner, rot = 0) {
  const out = [];
  for (let i = 0; i < pts * 2; i++) {
    const a = rot + (i / (pts * 2)) * TAU, rr = i % 2 ? r * inner : r;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
}
SHOT.whisper = (ctx, u, dur, sh) => {
  paper(ctx);
  const c3 = at(sh, 'c3'), c3e = at(sh, 'c3', 1);
  const y = 420, xs = [420, 760, 1100, 1440];
  xs.forEach((x, i) => desk(ctx, x - 100, y + 120, 200, 90, '', '', { seed: i + 4, alpha: ease(u, 0.1 + i * 0.12, 0.5 + i * 0.12) }));
  // 意图沿着工位传下去
  const p = ease(u, lerp(c3, c3e, 0.32), lerp(c3, c3e, 0.88)) * 4;
  const stage = Math.min(4, Math.floor(p)), f = p - stage;
  const pts = [12, 8, 5, 3, 0][stage];
  const x = lerp(160, 1700, p / 4) , yy = y - Math.sin(f * Math.PI) * 30;
  const r = lerp(150, 60, p / 4);
  if (pts > 0) cut(ctx, RED, P(starShape(x, yy, r, pts, lerp(0.45, 0.7, p / 4), u * 0.4), 2, 0.8), { lift: 1.4 });
  else cut(ctx, RED, C(x, yy, r * 0.6), { lift: 1.4 });
  // 星里的“隐含决定”：小米色圆点，越传越少
  const dots = [6, 4, 2, 1, 0][stage];
  for (let i = 0; i < dots; i++) { const a = (i / Math.max(1, dots)) * TAU + u; cut(ctx, SLIP, C(x + Math.cos(a) * r * 0.28, yy + Math.sin(a) * r * 0.28, 8), { lift: 0.3 }); }
  // 掉下来的碎片
  for (let s = 1; s <= stage; s++) {
    const t0 = lerp(c3, c3e, 0.32) + (s / 4) * (lerp(c3, c3e, 0.88) - lerp(c3, c3e, 0.32));
    for (let i = 0; i < 3; i++) {
      const k = clamp((u - t0) / 1.4), fx = 160 + (s / 4) * 1540 + (i - 1) * 40, fy = y + k * k * 360 + 20;
      ctx.save(); ctx.translate(fx, Math.min(fy, 820 + i * 6)); ctx.rotate(k * (i - 1) * 3);
      cut(ctx, KRAFT, R(-14, -9, 28, 18, s * 3 + i, 1), { lift: 0.6 });
      ctx.restore();
    }
  }
  label(ctx, '原意', 'INTENT', 160, 230, 34, { alpha: ease(u, lerp(c3, c3e, 0.2), lerp(c3, c3e, 0.3)), fill: RED });
  label(ctx, '摘要', 'SUMMARY', 1700, 230, 34, { alpha: ease(u, lerp(c3, c3e, 0.8), lerp(c3, c3e, 0.9)), fill: INK });
  label(ctx, '隐含决定', 'THE QUIET DECISIONS', 930, 870, 32, { alpha: ease(u, lerp(c3, c3e, 0.85), lerp(c3, c3e, 0.95)), fill: KRAFT.map((v) => v * 0.7) });
  // 开头：token 只是零钱
  const tk = win(u, lerp(c3, c3e, 0.08), lerp(c3, c3e, 0.32), 0.3, 0.4);
  if (tk > 0) {
    head(ctx, '不是 token', 'NOT TOKENS', CX - 240, 140, 70, { alpha: tk, fill: GREY });
    head(ctx, '是失真', 'DISTORTION', CX + 240, 140, 70, { alpha: tk, fill: RED });
  }
};

// 叠床架屋：一层层的协调压在一个小问题上面
SHOT.sprawl = (ctx, u, dur, sh) => {
  paper(ctx);
  const c4 = at(sh, 'c4'), c4e = at(sh, 'c4', 1);
  const layers = [['拆分', 'SPLIT', 0.02], ['同步', 'SYNC', 0.15], ['总结', 'SUMMARIES', 0.32], ['协调官', 'COORDINATOR', 0.5], ['管理中台', 'MANAGEMENT LAYER', 0.62]];
  const zoom = lerp(1.25, 0.82, ease(u, c4, lerp(c4, c4e, 0.75)));
  ctx.save(); ctx.translate(CX, 800); ctx.scale(zoom, zoom); ctx.translate(-CX, -800);
  bug(ctx, CX, 770, 22, u);
  let top = 740;
  layers.forEach(([zh, en, q], i) => {
    const k = ease(u, lerp(c4, c4e, q), lerp(c4, c4e, q) + 0.5);
    if (k <= 0) return;
    const n = i + 1, w = 220, gap = 14, h = 92, rowW = n * w + (n - 1) * gap, y = top - (i + 1) * (h + 14) - 20;
    for (let j = 0; j < n; j++) {
      const x = CX - rowW / 2 + j * (w + gap), dy = (1 - k) * -400;
      desk(ctx, x, y + dy, w, h, j === Math.floor(n / 2) ? zh : '', en, { col: i === 3 ? RED : INK, seed: i * 7 + j, alpha: clamp(k * 2), lift: 1 + (1 - k) * 2 });
    }
  });
  ctx.restore();
  // 问题还没动
  const nk = ease(u, lerp(c4, c4e, 0.75), lerp(c4, c4e, 0.85));
  if (nk > 0) {
    ctx.save(); ctx.globalAlpha = nk;
    bar(ctx, 1560, 860, CX + 50, 800, 6, RED, nk, { lift: 0 });
    label(ctx, '问题还在这儿', 'THE PROBLEM, STILL HERE', 1600, 880, 30, { fill: RED, align: 'left' });
    ctx.restore();
  }
};

// 03 · 即时：塔散了，剩下一个调度器和四个问题
function scheduler(ctx, x, y, r, o = {}) {
  cut(ctx, INK, (c) => { c.arc(x, y, r, 0, TAU); c.arc(x, y, r * 0.62, 0, TAU, true); }, { lift: o.lift ?? 1.2, alpha: o.alpha });
  cut(ctx, RED, C(x, y, r * 0.36), { lift: 0.5, alpha: o.alpha });
}
SHOT.sched = (ctx, u, dur, sh) => {
  paper(ctx);
  // 塔倒了
  const fall = ease(u, 0.0, 1.8);
  if (fall < 1) for (let i = 0; i < 12; i++) {
    const x0 = CX - 500 + (i % 4) * 260, y0 = 200 + Math.floor(i / 4) * 140, k = clamp(fall * 1.2 - rand(i, 2) * 0.2);
    ctx.save(); ctx.translate(x0 + (rand(i, 3) - 0.5) * 600 * k, y0 + k * k * 900); ctx.rotate(k * (rand(i, 4) - 0.5) * 4);
    desk(ctx, -100, -45, 200, 90, '', '', { seed: i, col: i === 6 ? RED : INK });
    ctx.restore();
  }
  const sk = pop(u, at(sh, 'j1', 0.45), 0.6);
  const cx = CX, cy = 470;
  if (sk > 0) scheduler(ctx, cx, cy, 90 * sk);
  const qs = [['现在什么能推进？', 'WHAT CAN MOVE NOW?', 0.22], ['需要什么能力？', 'WHAT DOES IT NEED?', 0.42], ['哪些可以并行？', 'WHAT CAN RUN IN PARALLEL?', 0.6], ['什么产物值得接受？', 'WHAT IS GOOD ENOUGH?', 0.78]];
  const spots = [[cx - 520, 220], [cx + 520, 220], [cx - 520, 720], [cx + 520, 720]];
  qs.forEach(([zh, en, q], i) => {
    const k = ease(u, at(sh, 'j2', q), at(sh, 'j2', q) + 0.5);
    if (k <= 0) return;
    const [x, y] = spots[i];
    const ang = Math.atan2(y - cy, x - cx);
    bar(ctx, cx + Math.cos(ang) * 100, cy + Math.sin(ang) * 100, x - Math.cos(ang) * 230 * 0.9, y - Math.sin(ang) * 60, 8, INK, k, { seed: i, lift: 0.4 });
    memo(ctx, x, y, isZH() ? 400 : 470, 96, T2(zh, en), { size: isZH() ? 36 : 34, rot: (i % 2 ? 0.03 : -0.03), alpha: k, scale: lerp(0.7, 1, back(k)), seed: i + 11 });
  });
  label(ctx, '调度器', 'SCHEDULER', cx, cy + 135, 30, { alpha: ease(u, at(sh, 'j1', 0.7), at(sh, 'j1', 0.9)), fill: INK });
};

// 即时派生一个实例：带上工具和时限，做完回收，只留下证据
function tools(ctx, x, y, s, which, k) {
  // 放大镜 · 日志 · 沙漏
  if (which === 0) { cut(ctx, KRAFT, (c) => { c.arc(x, y, s, 0, TAU); c.arc(x, y, s * 0.6, 0, TAU, true); }, { alpha: k, lift: 0.6 }); bar(ctx, x + s * 0.7, y + s * 0.7, x + s * 1.5, y + s * 1.5, s * 0.4, KRAFT, 1, { alpha: k, lift: 0.6 }); }
  if (which === 1) { cut(ctx, SLIP, R(x - s, y - s * 1.2, s * 2, s * 2.4, 3, 1), { alpha: k, lift: 0.6 }); for (let i = 0; i < 4; i++) { ctx.globalAlpha = k * 0.7; ctx.fillStyle = rgba(GREY); ctx.fillRect(x - s * 0.7, y - s * 0.8 + i * s * 0.5, s * 1.4 * (0.5 + rand(i, 7) * 0.5), s * 0.18); ctx.globalAlpha = 1; } }
  if (which === 2) { cut(ctx, INK, P([[x - s, y - s * 1.2], [x + s, y - s * 1.2], [x, y], [x + s, y + s * 1.2], [x - s, y + s * 1.2], [x, y]], 1, 0.5), { alpha: k, lift: 0.6, rule: 'evenodd' }); }
}
SHOT.spawn = (ctx, u, dur, sh) => {
  paper(ctx);
  const t = (q) => at(sh, 'j3', q), sx = 300, sy = 420;
  scheduler(ctx, sx, sy, 80);
  // 页面
  const px = 1180, py = 180, pw = 560, ph = 400;
  cut(ctx, SLIP, R(px, py, pw, ph, 5), { lift: 1.2 });
  cut(ctx, INK, R(px, py, pw, 46, 6), { lift: 0 });
  for (let i = 0; i < 3; i++) cut(ctx, SLIP, C(px + 30 + i * 30, py + 23, 8), { lift: 0 });
  for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(GREY, 0.5); ctx.fillRect(px + 40, py + 90 + i * 50, (pw - 80) * (0.4 + rand(i, 2) * 0.6), 18); }
  const fixd = ease(u, t(0.55), t(0.62));
  bug(ctx, px + pw - 90, py + 300, 18 * (1 - fixd), u);
  // 实例：从调度器上长出来，飞到页面前
  const born = ease(u, t(0.05), t(0.15)), go = ease(u, t(0.12), t(0.3)), gone = ease(u, t(0.64), t(0.74));
  const ax = lerp(sx, px - 70, go), ay = lerp(sy, py + 300, go) - Math.sin(go * Math.PI) * 120;
  const ar = 48 * born * (1 - gone);
  if (ar > 0.5) {
    agent(ctx, ax, ay, ar, { lift: 1.6 });
    const tk = [t(0.22), t(0.3), t(0.4)].map((q) => ease(u, q, q + 0.4) * (1 - gone));
    for (let i = 0; i < 3; i++) {
      const a = u * 1.2 + (i / 3) * TAU, rr = ar + 50;
      tools(ctx, ax + Math.cos(a) * rr, ay + Math.sin(a) * rr, 18, i, tk[i]);
    }
  }
  // 证据：一张纸条飞进左下的档案
  const ev = ease(u, t(0.72), t(0.95));
  const stackX = 300, stackY = 760;
  const nArch = (ev >= 1 ? 1 : 0) + [0.3, 0.55, 0.8].filter((q) => u > at(sh, 'j4', q) + 0.8).length;
  for (let i = 0; i < nArch; i++) memo(ctx, stackX, stackY - i * 22, 220, 70, '', { rot: (rand(i, 3) - 0.5) * 0.1, seed: i + 30, lift: 0.8, lines: 2 });
  if (ev > 0 && ev < 1) memo(ctx, lerp(px - 70, stackX, easeInOut(ev)), lerp(py + 300, stackY, easeInOut(ev)) - Math.sin(ev * Math.PI) * 200, 220, 70, T2('证据', 'EVIDENCE'), { size: 30, rot: ev * 0.4 });
  if (ev >= 1 && nArch > 0) label(ctx, '证据', 'EVIDENCE', stackX, stackY - (nArch - 1) * 22 + 2, 30, { fill: INK });
  // j4：更多实例一闪而过，各自留下一张纸条
  [0.3, 0.55, 0.8].forEach((q, i) => {
    const t0 = at(sh, 'j4', q) - 0.6, k = clamp((u - t0) / 1.4);
    if (k <= 0 || k >= 1) return;
    const x = 900 + i * 280, y = 760 - i * 40, r = 40 * Math.sin(k * Math.PI);
    agent(ctx, x, y, r, { lift: 1.2 });
    if (k > 0.55) { const e = (k - 0.55) / 0.45; memo(ctx, lerp(x, stackX, e), lerp(y, stackY - (i + 1) * 22, e) - Math.sin(e * Math.PI) * 120, 220 * e + 80 * (1 - e), 70 * e + 30 * (1 - e), '', { rot: e * 0.3, seed: i + 31 }); }
  });
  const j4 = ease(u, at(sh, 'j4'), at(sh, 'j4') + 0.5);
  head(ctx, '临时', 'TEMPORARY', 1180, 830, 64, { fill: RED, alpha: j4 });
  head(ctx, '持久', 'PERMANENT', stackX + 280, 830, 64, { fill: INK, alpha: ease(u, at(sh, 'j4', 0.5), at(sh, 'j4', 0.5) + 0.5) });
};
