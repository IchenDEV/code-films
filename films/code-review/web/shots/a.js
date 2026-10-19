// 镜头 A：钩子与问题 —— 看不完的代码瀑布、九成是 Claude 写的、反常的两组数、压力、换一个问题、审查的两份工作、拼写检查、人的时间。
// 坐标：原点在舞台中心；竖屏约 ±417 × ±300，横屏约 ±804 × ±357（SW、SH 是半宽、半高）。
const P = PORTRAIT;
function tint(g, rgb, k) {
  if (k <= 0.004) return;
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H) * 0.6);
  gr.addColorStop(0, rgba(rgb, 0.2 * k)); gr.addColorStop(1, rgba(rgb, 0.04 * k));
  g.fillStyle = gr; g.fillRect(-W, -H, W * 2, H * 2);
}
const BOXC = [C.blue, C.violet, C.gold, C.mint, '#ff9ec7'];
const SKINS = ['#f1c7a1', '#d9a27c', '#f6d3b3', '#b97f5a'];
// 盖一层暗幕（镜头里切换到下一个画面时用）
function dim(g, a) { if (a <= 0.003) return; g.save(); g.fillStyle = `rgba(7,11,26,${clamp(a)})`; g.fillRect(-W, -H, W * 2, H * 2); g.restore(); }

// —— 本片的道具 ——
// 一块代码改动：一行一行的色条，绿 = 新增、红 = 删除、灰 = 上下文；scroll 是向上滚过的像素
function codePanel(g, x, y, w, h, o = {}) {
  const head = o.title ? 40 : 6, lh = o.lh ?? 26, seed = o.seed ?? 1, scroll = o.scroll ?? 0;
  panel(g, x, y, w, h, { r: 16, fill: o.fill ?? '#0e1530', stroke: o.stroke ?? C.line, lw: 3, shadow: o.shadow });
  if (o.title) txt(g, o.title, x + 18, y + 22, o.titleSize ?? 20, C.dim, { family: F.mono, align: 'left', weight: '600', maxW: w - 36 });
  g.save(); rr(g, x + 4, y + head, w - 8, h - head - 4, 12); g.clip();
  const i0 = Math.floor(scroll / lh), n = Math.ceil((h - head) / lh) + 1;
  for (let j = 0; j < n; j++) {
    const i = i0 + j, yy = y + head + j * lh - (scroll % lh);
    const r = rand(i, seed), kind = r < 0.22 ? 1 : r < 0.38 ? -1 : 0;
    if (kind) { g.fillStyle = kind > 0 ? 'rgba(62,240,176,0.10)' : 'rgba(255,74,95,0.13)'; g.fillRect(x + 4, yy, w - 8, lh - 2); }
    if (o.hi === i) { g.fillStyle = rgba(C.goldRGB, 0.28); g.fillRect(x + 4, yy, w - 8, lh - 2); }
    g.fillStyle = kind > 0 ? C.mint : kind < 0 ? C.red : C.faint; g.fillRect(x + 12, yy + lh * 0.32, 6, lh * 0.36);
    const ind = Math.floor(rand(i, seed + 7) * 4) * 18, len = 0.2 + rand(i, seed + 3) * 0.5;
    const col = kind > 0 ? rgba(C.mintRGB, 0.75) : kind < 0 ? rgba(C.redRGB, 0.75) : rgba(C.dimRGB, 0.5);
    g.fillStyle = col; rr(g, x + 30 + ind, yy + lh * 0.3, (w - 70 - ind) * len, lh * 0.4, 4); g.fill();
    if (rand(i, seed + 5) > 0.4) { g.fillStyle = rgba(rand(i, seed + 9) > 0.5 ? C.blueRGB : C.violetRGB, 0.6); rr(g, x + 40 + ind + (w - 70 - ind) * len, yy + lh * 0.3, (w - 70) * 0.18 * rand(i, seed + 11), lh * 0.4, 4); g.fill(); }
  }
  g.restore();
}
// 虫子：红色小甲虫 = 一个问题
function bug(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  const wig = Math.sin(t * 22 + (o.seed ?? 0) * 3) * (o.still ? 0 : 1);
  glow(g, 0, 2, 46, o.rgb ?? C.redRGB, 0.3 * (o.glow ?? 1));
  g.strokeStyle = '#2a0a12'; g.lineWidth = 4; g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) for (const d of [-1, 1]) {
    const sw = (i % 2 ? 1 : -1) * wig * 4;
    g.beginPath(); g.moveTo(d * 10, i * 9 + 4); g.lineTo(d * 24, i * 11 + sw); g.lineTo(d * 30, i * 14 + 8 + sw); g.stroke();
  }
  g.beginPath(); g.moveTo(-5, -16); g.quadraticCurveTo(-10, -30, -18, -33 + wig * 2); g.moveTo(5, -16); g.quadraticCurveTo(10, -30, 18, -33 - wig * 2); g.stroke();
  g.fillStyle = o.color ?? C.red; g.beginPath(); g.ellipse(0, 6, 17, 21, 0, 0, TAU); g.fill();
  g.fillStyle = '#5a1420'; g.beginPath(); g.arc(0, -13, 10, 0, TAU); g.fill();
  line(g, 0, -4, 0, 26, 'rgba(60,10,20,0.6)', 3);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-7, 0, 4, 7, -0.3, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -15, 3, 0, TAU); g.arc(4, -15, 3, 0, TAU); g.fill();
  g.restore();
}
// 放大镜：rot 是手柄方向
function magnifier(g, x, y, r, rot = 0.8, o = {}) {
  g.save(); g.translate(x, y);
  g.save(); g.rotate(rot); rr(g, r * 0.92, -r * 0.17, r * 1.35, r * 0.34, r * 0.17); g.fillStyle = o.handle ?? '#c4884a'; g.fill(); g.restore();
  g.fillStyle = o.glass ?? 'rgba(170,215,255,0.18)'; g.beginPath(); g.arc(0, 0, r * 0.92, 0, TAU); g.fill();
  g.lineWidth = r * 0.17; g.strokeStyle = o.rim ?? '#dfe5f7'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(0, 0, r * 0.68, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.restore();
}
// 一个 PR：小卡片，编号、状态灯、几行改动
function prCard(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  panel(g, -110, -72, 220, 144, { r: 16, fill: o.fill ?? '#1b2756', stroke: o.stroke ?? C.line, lw: 3, shadow: o.shadow });
  txt(g, o.num ?? 'PR', -90, -46, 22, C.ink, { family: F.mono, align: 'left', weight: '700' });
  g.fillStyle = o.status ?? C.mint; g.beginPath(); g.arc(84, -46, 9, 0, TAU); g.fill();
  for (let i = 0; i < 4; i++) {
    const k = rand(i, o.seed ?? 1);
    g.fillStyle = k < 0.35 ? rgba(C.mintRGB, 0.8) : k < 0.6 ? rgba(C.redRGB, 0.8) : rgba(C.dimRGB, 0.5);
    rr(g, -90, -20 + i * 22, 60 + k * 110, 10, 5); g.fill();
  }
  g.restore();
}
// 打勾的小圆章
function okBadge(g, x, y, r, col = C.mint, kind = 'check') {
  g.save(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
  icon(g, kind, x, y + (kind === 'check' ? 2 : 0), r * 1.15, '#0b1124');
}
// 编号用的 PR 号（示意）
const prNum = (i) => '#' + (4200 + Math.floor(rand(i, 77) * 5000));

// —— 钩子：代码像瀑布一样往上冲，一个人拿着放大镜一行一行看；念到“不逐行”时放大镜掉下去，盖章 ——
SHOT.flood = (g, c) => {
  const u = c.u, ks = c.k('stop', 1.3);
  const after = ease(u, ks, ks + 0.45);
  tint(g, C.redRGB, (0.5 + 0.15 * Math.sin(u * 8)) * (1 - 0.6 * after));
  const speed = 300 + 160 * u + 1400 * after;
  // 后面几列，代码越涌越多
  const cols = P ? 2 : 4, pw = P ? 430 : 620, ph = 2 * SH - 10, px = P ? -120 : -260, py = -SH + 4;
  for (let j = cols - 1; j >= 0; j--) {
    g.save(); g.globalAlpha = 0.28 + 0.1 * j / cols;
    codePanel(g, px + pw + 24 + j * (P ? 170 : 230), py + 36 + j * 8, P ? 150 : 210, ph - 70, { scroll: u * speed * (0.8 + 0.15 * j) + j * 400, seed: 20 + j, lh: 20, shadow: false });
    g.restore();
  }
  // 主面板：放大镜下面那一行是高亮的
  // 放大镜的高度；它下面那一行高亮
  const lh = 30, lensY = (P ? -20 : -30) + 30 * Math.sin(u * 1.1), hiRow = Math.floor((lensY - py - 40 + u * speed) / lh);
  codePanel(g, px, py, pw, ph, { scroll: u * speed, seed: 3, lh, title: 'diff', hi: after < 0.5 ? hiRow : -1 });
  // 速度线
  if (after > 0) for (let i = 0; i < 26; i++) {
    const x = px + 20 + rand(i, 2) * (pw + (P ? 300 : 900)), y = -SH + ((rand(i, 3) * 2 * SH - u * 2200) % (2 * SH) + 2 * SH) % (2 * SH) - SH;
    line(g, x, y, x, y + 80 + rand(i, 4) * 140, rgba(C.inkRGB, 0.18 * after), 3);
  }
  // PR 还在不停地往右边那一堆上落
  const rx = P ? 300 : 640;
  for (let i = 0; i < 14; i++) {
    const t0 = i * 0.32 - 0.6, d = u * (1 + 1.5 * after) - t0;
    if (d < 0) continue;
    const ty = (P ? 250 : 270) - (i % 5) * 46 - Math.floor(i / 5) * 8;
    prCard(g, rx + ((i * 37) % 90) - 45, Math.min(ty, -SH - 100 + 1500 * d * d), P ? 0.5 : 0.6, { seed: i + 3, rot: (rand(i, 2) - 0.5) * 0.5, status: rand(i, 4) > 0.5 ? C.gold : C.red, shadow: true });
  }
  // 人举着放大镜，一行一行看
  const hx = P ? -255 : -560, hy = P ? 175 : 200, hs = P ? 1.45 : 1.7;
  person(g, hx, hy, hs, u, { shirt: C.violet, seed: 2, mouth: after > 0.4 ? 'open' : null, look: 1 });
  if (after < 0.6) { const sw = Math.sin(u * 7) * 6; g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(hx + 34 * hs, hy - 80 * hs + sw * 0.4, 7, 11, 0, 0, TAU); g.fill(); }
  const lx = hx + (P ? 175 : 220) + 20 * Math.sin(u * 2.3), ly = lensY;
  const fall = inCubic(after);
  const mx = lerp(lx, lx - 40, fall), my = lerp(ly, SH + 260, fall);
  line(g, hx + 30 * hs, hy + 10, lerp(mx - 60, hx + 40, after), lerp(my + 70, hy + 40, after), C.skin, 16);
  g.save(); g.translate(mx, my); g.rotate(fall * 1.6);
  magnifier(g, 0, 0, P ? 96 : 110, 2.3);
  g.restore();
  // 标签：逐行审
  const tag = T(TL.txt.lineByLine);
  chip(g, tag, P ? -200 : -470, -SH + 34, P ? 34 : 40, C.ink, rgba(C.redRGB, 0.85), { weight: '900', alpha: 1 - after });
  if (u >= ks) stamp(g, T(TL.txt.notAnymore), P ? 90 : 120, P ? -150 : -160, P ? 92 : 110, C.red, C.redRGB, u, ks + 0.05, -0.13);
};

// 约九成的代码是 Claude 写的：一百个小方块，九十个是 Claude 的颜色
SHOT.ratio = (g, c) => {
  const u = c.u, a = c.k('n90', 1.2);
  tint(g, C.clayRGB, 0.45);
  const cell = P ? 40 : 48, gx = P ? 60 : 170, gy = P ? -10 : 0, n = 10;
  const human = new Set([3, 17, 28, 42, 55, 61, 73, 86, 91, 98]);
  const fill = ex(u, 0.1, a + 0.3) * 100;
  txt(g, T(TL.txt.ofCode), gx, gy - n * cell / 2 - 36, P ? 30 : 36, C.dim, { weight: '700' });
  for (let i = 0; i < 100; i++) {
    const x = gx + ((i % n) - (n - 1) / 2) * cell, y = gy + (Math.floor(i / n) - (n - 1) / 2) * cell;
    const k = clamp(fill - i);
    g.fillStyle = 'rgba(255,255,255,0.05)'; rr(g, x - cell * 0.42, y - cell * 0.42, cell * 0.84, cell * 0.84, 6); g.fill();
    if (k <= 0) continue;
    const s = outBack(k);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = human.has(i) ? C.violet : C.clay; rr(g, -cell * 0.42, -cell * 0.42, cell * 0.84, cell * 0.84, 6); g.fill();
    g.restore();
  }
  // 敲代码的 Claude
  const bx = P ? -300 : -560;
  bot(g, bx, P ? 120 : 140, P ? 1.25 : 1.5, u, { mood: 'focus', seed: 5, look: 1, glow: 0.6 + 0.4 * Math.sin(u * 9) });
  for (let i = 0; i < 4; i++) {
    const t0 = (u * 2.2 + i * 0.25) % 1;
    txt(g, ['{ }', '=>', '()', ';'][i], bx + 70 + t0 * 120, (P ? 40 : 50) - t0 * 90 + i * 8, 26, rgba(C.clayRGB, 1 - t0), { family: F.mono, weight: '700' });
  }
  const kl = ease(u, a - 0.3, a + 0.2);
  chip(g, T(TL.txt.byClaude), gx - (P ? 110 : 140), gy + n * cell / 2 + 40, P ? 28 : 32, '#2a1206', C.clay, { weight: '900', alpha: kl });
  chip(g, T(TL.txt.byHuman), gx + (P ? 110 : 140), gy + n * cell / 2 + 40, P ? 28 : 32, C.ink, C.violet, { weight: '900', alpha: kl });
  if (u >= a) slam(g, '≈90%', bx + (P ? 10 : 20), P ? -150 : -170, P ? 110 : 140, C.gold, u, a, { rgb: C.clayRGB });
};

// 反常的两组数：合并的 PR 翻了一倍多，回滚比例反而降了四成多（柱高只表示相对变化）
SHOT.paradox = (g, c) => {
  const u = c.u, a2 = c.k('x2', 0.8), a4 = c.k('n40', c.line(1) + 0.8), aw = c.k('why', c.line(2) + 0.3), ap = c.k('post');
  tint(g, C.goldRGB, 0.35);
  const pw = P ? 370 : 560, ph = P ? 470 : 560, gap = P ? 22 : 80;
  const xs = [-(pw + gap) / 2, (pw + gap) / 2];
  const sets = [
    { lab: T(TL.txt.merged), v: [0.45, 0.45 * 2.15], at: a2, big: ZH ? '×2+' : '×2+', col: C.blue, arrow: -1 },
    { lab: T(TL.txt.reverted), v: [0.9, 0.9 * 0.58], at: a4, big: ZH ? '−40%+' : '−40%+', col: C.red, arrow: 1 },
  ];
  sets.forEach((S, j) => {
    const x0 = xs[j], show = pop(u, j === 0 ? 0.05 : Math.min(a2 + 0.5, c.line(1) - 0.3));
    if (show <= 0) return;
    g.save(); g.translate(x0, 0); g.scale(show, show);
    panel(g, -pw / 2, -ph / 2, pw, ph, { r: 24, fill: 'rgba(18,27,60,0.92)' });
    txt(g, S.lab, 0, -ph / 2 + 44, P ? 34 : 40, C.ink, { weight: '900', maxW: pw - 40 });
    const base = ph / 2 - 70, hmax = ph - 210, bw = P ? 110 : 150;
    const grow = ex(u, S.at - 0.15, S.at + 0.7);
    [[T(TL.txt.jun), S.v[0], 1], [T(TL.txt.sep), lerp(S.v[0], S.v[1], grow), grow]].forEach(([m, v, k], i) => {
      const bx = (i ? 1 : -1) * (P ? 80 : 120), h = v * hmax;
      g.fillStyle = i ? (j ? C.mint : S.col) : rgba(C.dimRGB, 0.6); rr(g, bx - bw / 2, base - h, bw, h, 12); g.fill();
      txt(g, m, bx, base + 32, P ? 28 : 32, C.dim, { weight: '700' });
    });
    line(g, -pw / 2 + 30, base, pw / 2 - 30, base, C.line, 3);
    if (u >= S.at) slam(g, S.big, 0, -ph / 2 + 120, P ? 84 : 104, C.gold, u, S.at, { rgb: j ? C.mintRGB : C.goldRGB });
    g.restore();
  });
  // 问号：人看得少了，怎么反而更稳？
  if (u > aw - 0.25) {
    const k = ease(u, aw - 0.25, aw + 0.15) * (c.has('post') ? 1 - ease(u, ap - 0.6, ap - 0.2) : 1);
    dim(g, 0.72 * k);
    g.save(); g.globalAlpha = k;
    icon(g, 'eye', P ? -150 : -260, 0, P ? 150 : 190, C.ink);
    line(g, (P ? -150 : -260) - 80, -70, (P ? -150 : -260) + 80, 70, C.red, 12);
    g.restore();
    if (k > 0.01) slam(g, '?', P ? 140 : 240, 0, P ? 300 : 380, C.gold, u, aw, { alpha: k, family: F.grot });
  }
  // 长版：出处卡片
  if (c.has('post') && u > ap - 0.5) {
    const k = pop(u, ap - 0.4);
    dim(g, 0.75 * ease(u, ap - 0.6, ap - 0.2));
    g.save(); g.scale(k, k);
    panel(g, P ? -380 : -620, -150, P ? 760 : 1240, 300, { r: 26, fill: '#f4efe6', stroke: null });
    txt(g, 'claude.dev · Engineering · Oct 15, 2026', 0, -88, P ? 24 : 30, '#6a6f86', { family: F.mono, weight: '600' });
    txt(g, 'How the Claude Code team', 0, -20, P ? 50 : 66, '#141a33', { family: F.grot, weight: '700' });
    txt(g, 'does code review', 0, 46, P ? 50 : 66, '#141a33', { family: F.grot, weight: '700' });
    txt(g, 'Addy Osmani · Morgan Westlee Lunt · Qing Wang', 0, 108, P ? 22 : 26, '#6a6f86', { family: F.grot, weight: '500' });
    g.restore();
  }
};

// 压力：Anthropic 大仓库每天合并的改动 2500 → 3 万；一个拿放大镜的人被 PR 埋了
SHOT.pressure = (g, c) => {
  const u = c.u, a1 = c.k('n1', 0.8), a2 = c.k('n2', 1.8), ac = c.k('cant', c.line(1) + 0.5), ao = c.k('own'), am = c.k('move');
  tint(g, C.redRGB, 0.25 + 0.4 * ease(u, a2, ac));
  // 左：两根柱子
  const cx0 = P ? -190 : -420, base = P ? 170 : 200, hmax = P ? 300 : 380, bw = P ? 92 : 130;
  txt(g, T(TL.txt.mergesDay), cx0, -SH + 40, P ? 22 : 28, C.dim, { weight: '700', maxW: P ? 380 : 700 });
  [[T(TL.txt.may), 2500, a1, C.blue, -1], [T(TL.txt.sep), 30000, a2, C.clay, 1]].forEach(([m, n, at, col, d]) => {
    const x = cx0 + d * (P ? 70 : 110), v = n * ex(u, at - 0.15, at + 0.8), h = Math.max(4, (v / 30000) * hmax);
    g.fillStyle = col; rr(g, x - bw / 2, base - h, bw, h, 10); g.fill();
    txt(g, m, x, base + 30, P ? 26 : 30, C.dim, { weight: '700' });
    if (u >= at - 0.1) slam(g, fmtInt(v), x, base - h - 34, P ? 44 : 56, C.gold, u, at, { ring: false });
  });
  line(g, cx0 - (P ? 160 : 230), base, cx0 + (P ? 160 : 230), base, C.line, 3);
  // 上期回顾
  const kl = ease(u, 0.2, 0.6) * (1 - ease(u, ac, ac + 0.4));
  chip(g, '↩ ' + T(TL.txt.lastEp), cx0, -SH + 92, P ? 22 : 26, '#06251b', C.mint, { weight: '700', alpha: kl });
  // 右：PR 像雪崩一样落下来，人被埋了
  const rx = P ? 210 : 420, floor = P ? 230 : 260;
  const n = Math.floor(clamp((u - a2 + 0.6) / 2.2) * 34);
  for (let i = 0; i < n; i++) {
    const col = i % 7, row = Math.floor(i / 7);
    const drop = clamp((u - a2 + 0.6) * 4 - i * 0.18);
    const tx = rx + (col - 3) * (P ? 46 : 62) + (rand(i, 3) - 0.5) * 30, ty = floor - 40 - row * (P ? 52 : 60);
    prCard(g, tx, lerp(-SH - 120, ty, outCubic(clamp(drop))), P ? 0.36 : 0.46, { rot: (rand(i, 5) - 0.5) * 0.6, seed: i, status: rand(i, 6) > 0.5 ? C.gold : C.mint });
  }
  const buried = clamp(n / 34);
  person(g, rx, floor + 20 - 10 * buried, P ? 0.9 : 1.1, u, { shirt: C.violet, seed: 4, mouth: buried > 0.3 ? 'open' : null, look: -0.5 });
  magnifier(g, rx + 70, floor - 40, 32, 2.2);
  if (u >= ac) stamp(g, ZH ? '看不完' : 'TOO MUCH', rx, P ? -120 : -140, P ? 80 : 96, C.red, C.redRGB, u, ac + 0.05, 0.1);
  // 长版：Claude Code 自己的仓库
  if (c.has('own') && u > ao - 0.3) {
    const k = pop(u, ao - 0.2) * (1 - ease(u, am - 0.6, am - 0.2));
    if (k > 0) {
      g.save(); g.translate(0, P ? -40 : -60); g.scale(k, k);
      panel(g, -190, -70, 380, 140, { r: 22, fill: C.panel2, stroke: C.clay, lw: 4 });
      txt(g, ZH ? 'Claude Code 仓库' : 'Claude Code repo', 0, -18, 34, C.ink, { weight: '900' });
      txt(g, ZH ? '单独 · 压力也不小' : 'separate · under pressure too', 0, 30, 24, C.clay, { weight: '700' });
      g.restore();
    }
  }
  // 长版：读代码交给机器 —— 一排拿放大镜的机器人
  if (c.has('move') && u > am - 0.4) {
    const k = ease(u, am - 0.4, am + 0.2);
    dim(g, 0.9 * k);
    for (let i = 0; i < 5; i++) {
      const kk = pop(u, am - 0.2 + i * 0.08);
      if (kk <= 0) continue;
      const x = (i - 2) * (P ? 150 : 250), y = P ? 70 : 80;
      g.save(); g.translate(x, y); g.scale(kk, kk);
      prCard(g, 0, -150, 0.6, { seed: i + 30, status: C.mint });
      bot(g, 0, 20, P ? 0.85 : 1, u, { seed: i + 2, mood: 'focus', glow: 1 });
      magnifier(g, 42, -120, 30, 2.3);
      g.restore();
    }
    slam(g, ZH ? '大部分“读” → 机器' : 'most of the reading → machines', 0, P ? -220 : -250, P ? 48 : 60, C.mint, u, am, { rgb: C.mintRGB, family: FT(), weight: '900', ring: false });
  }
};

// 换一个问题：“人看过没有？”被划掉，换成“可能出什么错？谁来拦？”
SHOT.question = (g, c) => {
  const u = c.u, a1 = c.k('q1', 0.4), a2 = c.k('q2', c.line(1) + 0.4), a3 = c.k('q3', a2 + 1.2);
  tint(g, C.blueRGB, 0.4);
  const strike = ease(u, a2 - 0.5, a2 - 0.1);
  // 旧问题
  const k1 = pop(u, a1 - 0.25);
  if (k1 > 0) {
    const y = lerp(0, P ? -210 : -230, strike), s = lerp(1, 0.7, strike);
    g.save(); g.translate(lerp(0, P ? 0 : -380, strike), y); g.scale(k1 * s, k1 * s);
    panel(g, P ? -330 : -380, -70, P ? 660 : 760, 140, { r: 26, fill: C.panel2, stroke: C.line });
    g.lineWidth = 6; g.strokeStyle = C.ink; rr(g, P ? -290 : -330, -26, 52, 52, 10); g.stroke();
    icon(g, 'check', P ? -264 : -304, 0, 50, C.mint);
    txt(g, T(TL.txt.oldQ), P ? 40 : 50, 2, P ? 56 : 64, C.ink, { weight: '900', maxW: P ? 520 : 600 });
    if (strike > 0) line(g, P ? -310 : -350, 4, lerp(P ? -310 : -350, P ? 310 : 350, strike), 4, C.red, 10);
    g.restore();
    if (c.cut === 'long' && strike > 0.5) chip(g, T(TL.txt.proxy), P ? 0 : 60, P ? -130 : -150, P ? 26 : 30, C.ink, rgba(C.redRGB, 0.85), { weight: '700', alpha: ease(u, a2 - 0.2, a2 + 0.2), align: P ? 'center' : 'left' });
  }
  // 新问题
  if (u > a2 - 0.1) {
    const y2 = P ? 10 : 0;
    g.save(); g.translate(0, y2);
    bug(g, P ? -300 : -560, 0, P ? 1.3 : 1.6, u, { seed: 2 });
    slam(g, T(TL.txt.newQ), P ? 40 : 40, 0, P ? 66 : 84, C.gold, u, a2, { family: FT(), weight: '900', maxW: P ? 620 : 1000 });
    g.restore();
  }
  if (u > a3 - 0.1) {
    const y3 = P ? 170 : 170;
    g.save(); g.translate(P ? -300 : -560, y3);
    for (let i = 0; i < 3; i++) { g.fillStyle = rgba(C.mintRGB, 0.35 + 0.2 * i); rr(g, -50, -36 + i * 26, 100, 14, 7); g.fill(); }
    g.restore();
    slam(g, T(TL.txt.newQ2), P ? 40 : 40, y3, P ? 54 : 70, C.mint, u, a3, { rgb: C.mintRGB, family: FT(), weight: '900', maxW: P ? 620 : 1000 });
  }
};

// 审查的两份工作
SHOT.twojobs = (g, c) => {
  const u = c.u, a1 = c.k('j1', 0.8), a2 = c.k('j2', 2.2);
  tint(g, C.violetRGB, 0.4);
  const pw = P ? 380 : 600, ph = P ? 460 : 520, xs = P ? [-200, 200] : [-340, 340];
  [[a1, '1', T(TL.txt.twoJobs)[0], C.red], [a2, '2', T(TL.txt.twoJobs)[1], C.blue]].forEach(([at, num, lab, col], i) => {
    const k = pop(u, at - 0.3);
    if (k <= 0) return;
    g.save(); g.translate(xs[i], 0); g.scale(k, k);
    panel(g, -pw / 2, -ph / 2, pw, ph, { r: 26, fill: 'rgba(18,27,60,0.92)', stroke: col, lw: 4 });
    g.fillStyle = col; g.beginPath(); g.arc(0, -ph / 2 + 64, 38, 0, TAU); g.fill();
    txt(g, num, 0, -ph / 2 + 66, 48, '#0b1124', { family: F.grot, weight: '700' });
    if (i === 0) {
      bug(g, -50, 0, 1.6, u, { seed: 1, still: u > at + 1 });
      g.save(); g.translate(60, 10); g.rotate(-0.6 + 0.2 * Math.sin(u * 5));
      g.fillStyle = '#c9d1e8'; rr(g, -10, -60, 20, 120, 8); g.fill(); g.beginPath(); g.arc(0, -66, 26, Math.PI * 0.15, Math.PI * 0.85, true); g.lineWidth = 16; g.strokeStyle = '#c9d1e8'; g.stroke();
      g.restore();
    } else {
      const pts = [[-90, 40], [0, -30], [90, 40]];
      for (const [x1, y1] of pts) for (const [x2, y2] of pts) line(g, x1, y1, x2, y2, rgba(C.blueRGB, 0.6), 4);
      pts.forEach(([x, y], j) => person(g, x, y + 20, 0.55, u, { seed: j + 5, shirt: BOXC[j], skin: SKINS[j] }));
      glow(g, 0, -100, 60, C.goldRGB, 0.6 + 0.3 * Math.sin(u * 4));
      g.fillStyle = C.gold; g.beginPath(); g.arc(0, -100, 20, 0, TAU); g.fill();
    }
    txt(g, lab, 0, ph / 2 - 60, P ? 36 : 42, C.ink, { weight: '900', maxW: pw - 40 });
    g.restore();
  });
};

// 审查不再是终点前的一道关，而像拼写检查一直在跑
SHOT.spell = (g, c) => {
  const u = c.u, as = c.k('spell', 2);
  tint(g, C.mintRGB, 0.3 * ease(u, as - 0.3, as + 0.3));
  const sw = ease(u, as - 0.4, as + 0.3);
  // 旧：路的尽头一道关
  g.save(); g.globalAlpha = 1 - 0.75 * sw;
  const y = P ? -120 : 0, x0 = P ? -390 : -760, x1 = P ? 390 : -40;
  g.fillStyle = '#26315f'; g.fillRect(x0, y - 30, x1 - x0, 60);
  g.fillStyle = '#e9ecf7';
  for (let x = x0 + 20; x < x1; x += 70) g.fillRect(x, y - 3, 34, 6);
  const gx = x1 - 50;
  g.fillStyle = '#8d97ba'; g.fillRect(gx, y - 120, 16, 150);
  g.save(); g.translate(gx + 8, y - 100); g.rotate(0);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? C.red : '#f4efe6'; g.fillRect(-160 + i * 26, -8, 26, 16); }
  g.restore();
  prCard(g, gx - 200, y - 90, 0.5, { seed: 2, status: C.gold });
  icon(g, 'clock', gx - 200, y - 190, 60, C.gold, u);
  txt(g, T(TL.txt.gate), (x0 + x1) / 2, y + 70, P ? 30 : 34, C.dim, { weight: '700' });
  if (sw > 0) line(g, gx - 280, y - 230, gx + 60, y + 50, C.red, 10 * sw);
  g.restore();
  // 新：编辑器里边打字边划红线
  const ex0 = P ? -360 : 60, ey0 = P ? 30 : -250, ew = P ? 720 : 720, eh = P ? 260 : 440;
  const k = pop(u, as - 0.3);
  if (k > 0) {
    g.save(); g.translate(ex0 + ew / 2, ey0 + eh / 2); g.scale(k, k); g.translate(-ew / 2, -eh / 2);
    panel(g, 0, 0, ew, eh, { r: 20, fill: '#0e1530', stroke: C.mint, lw: 4 });
    const rows = P ? 5 : 9;
    for (let r = 0; r < rows; r++) {
      const shown = clamp((u - as) * 1.6 - r * 0.35);
      if (shown <= 0) continue;
      const w0 = (ew - 80) * (0.5 + rand(r, 3) * 0.45) * shown, yy = 40 + r * 44;
      g.fillStyle = rgba(C.dimRGB, 0.6); rr(g, 40, yy, w0, 16, 6); g.fill();
      if (rand(r, 5) > 0.45 && shown > 0.6) {
        const sx = 40 + w0 * 0.4, fixed = clamp((u - as) * 1.6 - r * 0.35 - 1.2);
        g.save(); g.strokeStyle = fixed > 0 ? C.mint : C.red; g.lineWidth = 3; g.beginPath();
        for (let x = 0; x < 80; x += 4) g.lineTo(sx + x, yy + 24 + (x % 8 ? 3 : -3));
        g.stroke(); g.restore();
      }
    }
    g.restore();
    chip(g, T(TL.txt.spellcheck), ex0 + ew / 2, ey0 + eh + 44, P ? 30 : 34, '#06251b', C.mint, { weight: '900', alpha: ease(u, as, as + 0.3) });
  }
};

// 人的时间：两头相通的水箱（这头省了那头涨）；目标：最多一个人；护栏：回滚率、事故率
SHOT.scale = (g, c) => {
  const u = c.u, aS = c.k('scarce', 0.6), aa = c.k('a', c.line(1) + 0.4), ab = c.k('b', aa + 1.4), az = c.k('zero', ab + 1.6), a1 = c.k('one', c.line(2) + 0.4), ar = c.k('rail', a1 + 2.5);
  tint(g, C.goldRGB, 0.3);
  const ph1 = ease(u, aa - 0.5, aa - 0.1), ph2 = ease(u, a1 - 0.5, a1 - 0.1);
  // 开头：稀缺的是人的时间和注意力
  if (ph1 < 1) {
    g.save(); g.globalAlpha = 1 - ph1;
    const k = pop(u, 0.05);
    g.save(); g.translate(P ? -150 : -260, 0); g.scale(k, k);
    // 沙漏
    g.fillStyle = '#c9d1e8'; g.fillRect(-90, -150, 180, 16); g.fillRect(-90, 134, 180, 16);
    g.beginPath(); g.moveTo(-70, -134); g.lineTo(70, -134); g.lineTo(8, 0); g.lineTo(70, 134); g.lineTo(-70, 134); g.lineTo(-8, 0); g.closePath(); g.fillStyle = 'rgba(160,210,255,0.18)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#c9d1e8'; g.stroke();
    const sand = clamp(u / 6);
    g.fillStyle = C.gold; g.beginPath(); g.moveTo(-60 * (1 - sand), -120 + 110 * sand); g.lineTo(60 * (1 - sand), -120 + 110 * sand); g.lineTo(0, -6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-60, 130); g.lineTo(60, 130); g.lineTo(60 * (1 - sand * 0.6), 130 - 100 * sand); g.lineTo(-60 * (1 - sand * 0.6), 130 - 100 * sand); g.closePath(); g.fill();
    line(g, 0, -6, 0, 130, C.gold, 3);
    g.restore();
    icon(g, 'eye', P ? 150 : 260, -40, P ? 150 : 180, C.ink);
    if (u > aS - 0.1) slam(g, ZH ? '人的时间和注意力' : 'human time & attention', P ? 150 : 260, 110, P ? 40 : 52, C.gold, u, aS, { family: FT(), weight: '900', ring: false, maxW: P ? 380 : 600 });
    g.restore();
  }
  // 两个相通的水箱
  if (ph1 > 0 && ph2 < 1) {
    g.save(); g.globalAlpha = ph1 * (1 - ph2);
    const squeeze = ease(u, az - 0.6, az + 0.4);
    const tw = P ? 230 : 300, th = P ? 320 : 360, xs = P ? [-200, 200] : [-300, 300], by = P ? 140 : 160;
    const lv = [0.55 - 0.3 * squeeze, 0.55 + 0.3 * squeeze];
    g.fillStyle = '#26315f'; g.fillRect(xs[0], by - 26, xs[1] - xs[0], 30);
    g.fillStyle = rgba(C.blueRGB, 0.8); g.fillRect(xs[0], by - 20, xs[1] - xs[0], 18);
    [[T(TL.txt.timeSides)[0], aa], [T(TL.txt.timeSides)[1], ab]].forEach(([lab, at], i) => {
      const x = xs[i], hi = ease(u, at - 0.1, at + 0.3);
      panel(g, x - tw / 2, by - th, tw, th, { r: 18, fill: 'rgba(14,21,48,0.95)', stroke: hi > 0.5 ? C.gold : C.line, lw: 4 });
      g.save(); rr(g, x - tw / 2 + 6, by - th + 6, tw - 12, th - 12, 14); g.clip();
      const wy = by - 6 - (th - 12) * lv[i];
      g.fillStyle = rgba(i ? C.redRGB : C.blueRGB, 0.75); g.beginPath(); g.moveTo(x - tw / 2, wy);
      for (let xx = -tw / 2; xx <= tw / 2; xx += 10) g.lineTo(x + xx, wy + Math.sin(u * 4 + xx * 0.05 + i) * 5);
      g.lineTo(x + tw / 2, by); g.lineTo(x - tw / 2, by); g.closePath(); g.fill();
      g.restore();
      txt(g, lab, x, by - th - 36, P ? 30 : 36, C.ink, { weight: '900', maxW: tw + 60 });
    });
    if (squeeze > 0) {
      g.save(); g.translate(xs[0], by - th - 100 + 60 * squeeze); icon(g, 'bolt', 0, 0, 60, C.gold); g.restore();
      arrow(g, xs[1] + tw / 2 + 30, by - 60, xs[1] + tw / 2 + 30, by - th + 40, C.red, 6, squeeze, 18);
    }
    if (u > az) stamp(g, T(TL.txt.saved), 0, P ? -40 : -60, P ? 80 : 96, C.red, C.redRGB, u, az + 0.05, -0.1);
    g.restore();
  }
  // 目标与护栏
  if (ph2 > 0) {
    g.save(); g.globalAlpha = ph2;
    const k = pop(u, a1 - 0.2);
    g.save(); g.translate(0, P ? -140 : -150); g.scale(k, k);
    panel(g, P ? -380 : -520, -100, P ? 760 : 1040, 200, { r: 26, fill: C.panel2, stroke: C.mint, lw: 4 });
    person(g, P ? -290 : -420, 10, 0.9, u, { seed: 3, shirt: C.mint });
    txt(g, T(TL.txt.goal), P ? 50 : 60, -20, P ? 44 : 54, C.ink, { weight: '900', maxW: P ? 560 : 820 });
    txt(g, T(TL.txt.canBeAuthor), P ? 50 : 60, 44, P ? 28 : 32, C.mint, { weight: '700' });
    g.restore();
    if (u > ar - 0.4) {
      const kr = ease(u, ar - 0.4, ar + 0.3), y = P ? 140 : 160;
      g.fillStyle = '#26315f'; g.fillRect(-SW, y - 50, 2 * SW, 100);
      for (let x = -SW + ((u * 200) % 80); x < SW; x += 80) { g.fillStyle = '#e9ecf7'; g.fillRect(x, y - 3, 40, 6); }
      for (const d of [-1, 1]) {
        const ry = y + d * 70;
        line(g, -SW, ry, lerp(-SW, SW, kr), ry, C.gold, 8);
        for (let x = -SW + 30; x < lerp(-SW, SW, kr); x += 90) line(g, x, ry, x, ry + 30, C.gold, 6);
      }
      prCard(g, -SW + ((u * 220) % (2 * SW)), y, 0.35, { seed: 9 });
      slam(g, T(TL.txt.guard), 0, y + (P ? 140 : 140), P ? 40 : 50, C.gold, u, ar, { family: FT(), weight: '900', ring: false, maxW: 2 * SW - 40 });
    }
    g.restore();
  }
};
