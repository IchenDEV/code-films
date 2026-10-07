// 04 三条理由 · 05 不是种姓

// 左上角的编号徽章：第几条
function badge(ctx, n, k) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(150, 230); ctx.scale(k, k);
  cut(ctx, RED, C(0, 0, 58), { lift: 1.2 });
  txt(ctx, String(n), 0, 6, 84, DEN, { fill: SLIP });
  ctx.restore();
}
// 一支笔：黑杆红尖，ang 为朝向
function pen(ctx, x, y, ang, s = 1, col = INK) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  cut(ctx, col, R(-18, -230, 36, 190, 2, 1), { lift: 1.4 });
  cut(ctx, RED, P([[-18, -40], [18, -40], [0, 0]], 3, 0.5), { lift: 1 });
  ctx.restore();
}

SHOT.eyes = (ctx, u, dur, sh) => {
  paper(ctx);
  const o2 = (q) => at(sh, 'o2', q);
  // o1：三张编号牌
  const intro = 1 - ease(u, o2(0) - 0.3, o2(0) + 0.4);
  for (let i = 0; i < 3; i++) {
    const k = pop(u, at(sh, 'o1', 0.3 + i * 0.15), 0.4) * intro;
    if (k <= 0) continue;
    ctx.save(); ctx.translate(CX - 300 + i * 300, 440); ctx.scale(k, k); ctx.rotate((i - 1) * 0.05);
    cut(ctx, i === 0 ? RED : INK, R(-110, -140, 220, 280, i + 2), { lift: 1.4 });
    txt(ctx, String(i + 1), 0, 14, 200, DEN, { fill: SLIP });
    ctx.restore();
  }
  badge(ctx, 1, pop(u, o2(0), 0.4));
  if (u < o2(0) - 0.2) return;
  // 一份文件
  const dk = ease(u, o2(0), o2(0) + 0.6);
  const dx = CX - 260, dy = 330, dw = 520, dh = 470;
  cut(ctx, SLIP, R(dx, dy, dw, dh, 9), { lift: 1.2, alpha: dk });
  // 很多双眼睛一起读
  const ek = ease(u, o2(0.12), o2(0.3));
  for (let i = 0; i < 6; i++) {
    const x = CX - 500 + i * 200, y = 180 + (i % 2) * 30, blink = Math.abs(Math.sin(u * 0.7 + i * 1.3)) > 0.97 ? 0.1 : 1;
    if (ek > 0) eye(ctx, x, y, 56 * clamp(ek * 1.5 - i * 0.08), blink, { look: Math.sin(u * 1.5 + i) });
  }
  label(ctx, '读：可以一起', 'READ: TOGETHER', CX + 620, 190, 34, { alpha: ease(u, o2(0.2), o2(0.3)), fill: INK, align: 'left' });
  // 一支笔写字
  const wk = ease(u, o2(0.36), o2(0.6));
  for (let i = 0; i < 7; i++) {
    const lk = clamp(wk * 7 - i);
    if (lk > 0) { ctx.fillStyle = rgba(INK, 0.8); ctx.fillRect(dx + 50, dy + 60 + i * 52, (dw - 120) * (0.6 + rand(i, 5) * 0.4) * lk, 12); }
  }
  const multi = ease(u, o2(0.66), o2(0.76)), clash = ease(u, o2(0.85), o2(0.92));
  const li = Math.min(6, Math.floor(wk * 7)), lx = dx + 50 + (dw - 120) * clamp(wk * 7 - li) * 0.9;
  if (wk > 0) pen(ctx, lx + 10, dy + 66 + li * 52, 0.5);
  label(ctx, '写：一支笔', 'WRITE: ONE PEN', CX + 620, 420, 34, { alpha: ease(u, o2(0.4), o2(0.5)) * (1 - multi), fill: INK, align: 'left' });
  // 几支笔同时改：中间撕开一道红色的冲突
  if (multi > 0) {
    pen(ctx, lerp(W + 200, dx + dw - 40, multi), dy + 200, -0.6);
    pen(ctx, lerp(-200, dx + 60, multi), dy + 330, 0.9);
    pen(ctx, dx + dw / 2 + 40, lerp(-300, dy + 150, multi), 0.15);
  }
  if (clash > 0) {
    const zz = [];
    for (let i = 0; i <= 10; i++) zz.push([dx + 30 + i * (dw - 60) / 10, dy + dh / 2 + (i % 2 ? -36 : 36) * clash]);
    ctx.save(); ctx.strokeStyle = rgba(RED); ctx.lineWidth = 16; ctx.lineJoin = 'miter';
    ctx.beginPath(); polyProgress(ctx, zz, clash); ctx.stroke(); ctx.restore();
    head(ctx, '合并冲突', 'MERGE CONFLICT', CX + 620, 420, 56, { fill: RED, alpha: clash, align: 'left' });
  }
};

// 第二条：一双没被说服过的眼睛
SHOT.fresh = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'o3', f);
  badge(ctx, 2, 1);
  // 左：作者，头上一团假设
  figure(ctx, 470, 780, 260, INK);
  const ak = ease(u, q(0.15), q(0.35));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + u * 0.3, r = 120 + (i % 3) * 30;
    ctx.save(); ctx.translate(470 + Math.cos(a) * r, 330 + Math.sin(a) * r * 0.55); ctx.rotate(a);
    cut(ctx, KRAFT, R(-30, -16, 60, 32, i, 1), { lift: 0.6, alpha: ak });
    ctx.restore();
  }
  label(ctx, '作者的假设', 'THE AUTHOR’S ASSUMPTIONS', 470, 205, 32, { alpha: ak, fill: INK });
  // 右：空白的纸，上面睁开一只眼
  cut(ctx, SLIP, R(1240, 260, 420, 520, 3), { lift: 1.3 });
  const open = ease(u, q(0.28), q(0.42));
  eye(ctx, 1450, 480, 120, open, { lift: 0.3, look: Math.sin(u) * 0.5 });
  label(ctx, '空白上下文', 'BLANK CONTEXT', 1450, 700, 32, { alpha: open, fill: INK });
  // 中间：天平
  const bk = ease(u, q(0.6), q(0.72));
  if (bk > 0) {
    const tilt = Math.sin(u * 1.3) * 0.06 * (1 - ease(u, q(0.8), q(0.95)));
    cut(ctx, INK, P([[CX - 70, 780], [CX + 70, 780], [CX, 560]], 4, 0.5), { lift: 1, alpha: bk });
    ctx.save(); ctx.translate(CX, 560); ctx.rotate(tilt); ctx.globalAlpha = bk;
    cut(ctx, INK, R(-260, -10, 520, 20, 5, 0.5), { lift: 1 });
    for (const sx of [-240, 240]) {
      bar(ctx, sx, 0, sx - 50, 130, 4, INK, 1, { lift: 0 }); bar(ctx, sx, 0, sx + 50, 130, 4, INK, 1, { lift: 0 });
      cut(ctx, sx < 0 ? KRAFT : RED, (c) => { c.moveTo(sx - 80, 130); c.lineTo(sx + 80, 130); c.arc(sx, 130, 80, 0, Math.PI); }, { lift: 1 });
    }
    ctx.restore();
    head(ctx, '不是分工，是制衡', 'NOT DIVISION OF LABOR. A CHECK.', CX + 120, 105, 56, { alpha: bk, fill: RED });
  }
  // 值得留下：一枚红钉子
  const kk = pop(u, q(0.86), 0.4);
  if (kk > 0) {
    ctx.save(); ctx.translate(CX, 470); ctx.scale(kk, kk);
    cut(ctx, RED, C(0, 0, 34), { lift: 2 }); cut(ctx, SLIP, C(-10, -10, 9), { lift: 0 });
    ctx.restore();
    label(ctx, '留下', 'KEEP', CX + 60, 470, 34, { fill: RED, alpha: clamp(kk), align: 'left' });
  }
};

// 第三条：隔离权限；三条都不沾，就别拆
function database(ctx, x, y, s, col = INK) {
  for (let i = 2; i >= 0; i--) {
    const yy = y + i * s * 0.55;
    cut(ctx, col, (c) => { c.ellipse(x, yy + s * 0.5, s, s * 0.32, 0, 0, Math.PI); c.lineTo(x - s, yy); c.ellipse(x, yy, s, s * 0.32, 0, Math.PI, TAU); c.closePath(); }, { lift: 0.8 });
    cut(ctx, SLIP, (c) => c.ellipse(x, yy, s * 0.96, s * 0.28, 0, 0, TAU), { lift: 0, alpha: i === 0 ? 1 : 0 });
  }
}
function globe(ctx, x, y, r) {
  cut(ctx, SLIP, C(x, y, r), { lift: 1 });
  ctx.save(); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r * 0.45, r, 0, 0, TAU); ctx.stroke(); ctx.restore();
}
SHOT.walls = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'o4', f), o5 = at(sh, 'o5');
  const merge = ease(u, o5 - 0.4, o5 + 0.6);
  badge(ctx, 3, 1 - merge);
  ctx.save(); ctx.globalAlpha = 1 - merge;
  // 墙
  const wk = ease(u, q(0.15), q(0.35));
  cut(ctx, INK, R(CX - 22, lerp(860, 120, wk), 44, 740 * wk, 2), { lift: 1.4 });
  if (wk > 0.9) {
    cut(ctx, RED, R(CX - 46, 430, 92, 76, 3, 1), { lift: 1.4 });
    ctx.save(); ctx.strokeStyle = rgba(RED); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(CX, 430, 32, Math.PI, TAU); ctx.stroke(); ctx.restore();
    cut(ctx, SLIP, C(CX, 462, 10), { lift: 0 });
  }
  // 左：生产数据库
  const lk = ease(u, q(0.35), q(0.55));
  ctx.globalAlpha = (1 - merge) * lk;
  database(ctx, 560, 370, 120, INK);
  agent(ctx, 560, 720, 46);
  label(ctx, '生产数据库', 'PRODUCTION DATABASE', 560, 270, 32, { fill: INK });
  // 右：随手读的网页
  const rk = ease(u, q(0.65), q(0.85));
  ctx.globalAlpha = (1 - merge) * rk;
  globe(ctx, 1360, 470, 130);
  agent(ctx, 1360, 720, 46, { col: KRAFT });
  label(ctx, '随便哪个网页', 'ANY WEB PAGE', 1360, 270, 32, { fill: INK });
  ctx.restore();
  // o5：三条都划掉，只剩一个执行者
  if (merge > 0) {
    for (let i = 0; i < 3; i++) {
      const k = pop(u, o5 + 0.1 + i * 0.25, 0.3), x = CX - 360 + i * 360;
      if (k <= 0) continue;
      ctx.save(); ctx.translate(x, 330); ctx.scale(k, k);
      cut(ctx, GREY, C(0, 0, 70), { lift: 1 });
      txt(ctx, String(i + 1), 0, 8, 96, DEN, { fill: SLIP });
      bar(ctx, -80, 80, 80, -80, 12, RED, ease(u, o5 + 0.3 + i * 0.25, o5 + 0.5 + i * 0.25), { lift: 0.6 });
      ctx.restore();
    }
    const fk = pop(u, o5 + 1.0, 0.5);
    if (fk > 0) { agent(ctx, CX, 620, 70 * fk, { lift: 1.6 }); head(ctx, '别拆', 'DON’T SPLIT', CX, 790, 80, { fill: INK, alpha: clamp(fk) }); }
  }
};

// 05 · 不是种姓：模型各有所长，但别排成阶级
SHOT.caste = (ctx, u, dur, sh) => {
  paper(ctx);
  const m1 = (f) => at(sh, 'm1', f), m2 = (f) => at(sh, 'm2', f);
  const snap = ease(u, m2(0.1), m2(0.4));
  const crossed = ease(u, m2(0.72), m2(0.85));
  const kinds = [
    { col: RED, r: 52, speed: 0.4, zh: '文字', en: 'PROSE', price: '$$' },
    { col: INK, r: 66, speed: 0.25, zh: '逻辑', en: 'LOGIC', price: '$$$' },
    { col: KRAFT, r: 46, speed: 0.55, zh: '审美', en: 'TASTE', price: '$$' },
    { col: GREY, r: 26, speed: 2.4, zh: '又快又便宜', en: 'FAST & CHEAP', price: '¢' },
  ];
  // 金字塔（种姓）：被钉上去的位置
  const slots = [[CX, 250], [CX - 230, 460], [CX + 230, 460], [CX, 670]];
  const titles = [['总监', 'DIRECTOR'], ['后端', 'BACKEND'], ['文案', 'COPYWRITER'], ['杂活', 'CHORES']];
  if (snap > 0) {
    ctx.save(); ctx.globalAlpha = snap * (1 - crossed * 0.5);
    for (const [x, y] of [[CX - 230, 460], [CX + 230, 460]]) bar(ctx, CX, 250, x, y, 8, INK, 1, { lift: 0.3 });
    for (const [x, y] of [[CX - 230, 460], [CX + 230, 460]]) bar(ctx, x, y, CX, 670, 8, INK, 1, { lift: 0.3 });
    ctx.restore();
  }
  kinds.forEach((k, i) => {
    const lane = 210 + i * 170, appear = ease(u, m1(0.1 + i * 0.12), m1(0.2 + i * 0.12));
    if (appear <= 0) return;
    // 跑道上：各自的速度
    const x = 220 + ((u * k.speed * 260 + i * 300) % 1480);
    const sx = lerp(x, slots[[1, 0, 2, 3][i]][0], snap), sy = lerp(lane, slots[[1, 0, 2, 3][i]][1], snap);
    if (snap < 1) {
      ctx.save(); ctx.globalAlpha = appear * (1 - snap);
      ctx.fillStyle = rgba(GREY, 0.35); ctx.fillRect(200, lane + k.r + 6, 1520, 4);
      label(ctx, k.zh, k.en, 120, lane, 28, { fill: INK, align: 'left' });
      label(ctx, k.price, k.price, 1800, lane, 32, { fill: RED, align: 'right' });
      ctx.restore();
    }
    agent(ctx, sx, sy, k.r * appear, { col: k.col, lift: 1.2 });
    if (snap > 0.6) {
      const slot = [1, 0, 2, 3][i], [tx, ty] = slots[slot];
      memo(ctx, tx, ty + k.r + 40, isZH() ? 230 : 340, 54, T2(`${titles[slot][0]} · 模型 ${'ABCD'[i]}`, `${titles[slot][1]} · MODEL ${'ABCD'[i]}`), { size: isZH() ? 26 : 23, alpha: ease(snap, 0.6, 1), seed: i + 40 });
    }
  });
  // 十倍、百倍
  const xk = win(u, m1(0.7), m2(0.05), 0.3, 0.4);
  if (xk > 0) { head(ctx, '×10', '×10', 1500, 120, 80, { fill: RED, alpha: xk, rot: -0.08 }); head(ctx, '×100', '×100', 1720, 140, 100, { fill: INK, alpha: xk * ease(u, m1(0.8), m1(0.9)), rot: 0.06 }); }
  // 划掉
  if (crossed > 0) {
    bar(ctx, CX - 420, 150, CX + 420, 820, 30, RED, crossed, { lift: 1.6 });
    bar(ctx, CX + 420, 150, CX - 420, 820, 30, RED, clamp(crossed * 1.4 - 0.4), { lift: 1.6 });
    head(ctx, '品牌官僚', 'BRAND BUREAUCRACY', 1560, 460, 60, { fill: RED, alpha: ease(u, m2(0.75), m2(0.9)), rot: -0.05 });
  }
};

// 调度的单位是一份规格
SHOT.spec = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'm3', f);
  const cx = 560, cy = 470;
  // 一张索引卡
  cut(ctx, KRAFT, R(cx - 330, cy - 330, 660, 620, 2), { lift: 1.4 });
  cut(ctx, SLIP, R(cx - 310, cy - 310, 620, 580, 3), { lift: 0.4 });
  head(ctx, '执行规格', 'EXECUTION SPEC', cx, cy - 250, 54, { fill: RED });
  const rows = [['模型', 'MODEL', 0.18], ['推理强度', 'EFFORT', 0.26], ['工具', 'TOOLS', 0.34], ['上下文', 'CONTEXT', 0.42], ['预算', 'BUDGET', 0.5]];
  rows.forEach(([zh, en, f], i) => {
    const y = cy - 150 + i * 88, k = ease(u, q(f), q(f) + 0.5);
    ctx.fillStyle = rgba(GREY, 0.4); ctx.fillRect(cx - 270, y + 34, 540, 3);
    label(ctx, zh, en, cx - 270, y, 32, { fill: INK, align: 'left', alpha: clamp(k * 2) });
    // 每一行的值：不同的形状
    if (i === 0) agent(ctx, cx + 180, y, 22 * k, { lift: 0.5 });
    if (i === 1) for (let j = 0; j < 5; j++) cut(ctx, j < 4 ? INK : GREY, R(cx + 60 + j * 44, y - 16, 30, 32, j, 0.5), { lift: 0.3, alpha: clamp(k * 5 - j) });
    if (i === 2) for (let j = 0; j < 3; j++) tools(ctx, cx + 90 + j * 80, y, 13, j, clamp(k * 3 - j));
    if (i === 3) cut(ctx, INK, R(cx + 40, y - 12, 230 * k, 24, 3, 0.5), { lift: 0.3 });
    if (i === 4) { cut(ctx, RED, R(cx + 40, y - 12, 160 * k, 24, 4, 0.5), { lift: 0.3 }); cut(ctx, GREY, R(cx + 40 + 160 * k, y - 12, 70 * k, 24, 5, 0.5), { lift: 0.1 }); }
  });
  // 右上：难题——一个大执行者，久久地啃一个结
  const hk = ease(u, q(0.6), q(0.7));
  if (hk > 0) {
    const kx = 1350, ky = 300;
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.strokeStyle = rgba(INK, hk); ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(kx, ky, 90, 40, i * 1.05 + u * 0.2, 0, TAU); ctx.stroke(); ctx.restore(); }
    agent(ctx, kx - 230, ky, 70 * hk, { lift: 1.6 });
    cut(ctx, RED, R(kx - 330, ky + 110, 520 * hk, 22, 2, 0.5), { lift: 0.4 });
    label(ctx, '难题：给足算力', 'HARD: REAL COMPUTE', kx - 70, ky + 170, 32, { fill: INK, alpha: hk });
  }
  // 右下：琐事——小个子来回飞
  const ck = ease(u, q(0.8), q(0.9));
  if (ck > 0) {
    for (let i = 0; i < 6; i++) memo(ctx, 1150 + i * 90, 700 + (i % 2) * 30, 60, 40, '', { lines: 1, seed: i + 50, alpha: ck });
    for (let i = 0; i < 4; i++) { const k = ((u * 1.6 + i * 0.25) % 1); agent(ctx, 1120 + k * 560, 640 - Math.sin(k * Math.PI) * 60, 14 * ck, { col: GREY, lift: 0.6 }); }
    label(ctx, '琐事：又快又便宜', 'CHORES: FAST & CHEAP', 1380, 800, 32, { fill: INK, alpha: ck });
  }
};
