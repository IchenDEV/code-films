// 2024—2026：Agent 接管任务、终端、同时开十个、人成了瓶颈。

// —— 仓库是一座等轴测的城：每栋楼是一个文件 ——
const CITY = [];
INITS.push(() => {
  for (let x = 0; x < 7; x++) for (let y = 0; y < 7; y++) {
    const i = x * 7 + y;
    if (rand(i, 21) < 0.12) continue;
    CITY.push({ x, y, h: 0.4 + rand(i, 22) * 1.8 + (x === 3 && y === 3 ? 1 : 0), i });
  }
});
function cityO() {
  return PORTRAIT ? { x: ST.cx, y: ST.y + (FMT === 'v' ? 290 : 230), s: FMT === 'v' ? 56 : 50 } : { x: ST.cx - 330, y: ST.cy + 80, s: 68 };
}
// 每栋楼的状态函数：返回 [颜色, 亮度]
function drawCity(g, o, state, u) {
  const blocks = [...CITY].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const b of blocks) {
    const [rgb, lit, lift] = state(b);
    const h = b.h + (lift || 0);
    const p = (x, y, z) => iso(b.x + x - 3.5, b.y + y - 3.5, z, o);
    const top = [p(0.1, 0.1, h), p(0.9, 0.1, h), p(0.9, 0.9, h), p(0.1, 0.9, h)];
    const L = [p(0.1, 0.9, h), p(0.9, 0.9, h), p(0.9, 0.9, 0), p(0.1, 0.9, 0)];
    const R = [p(0.9, 0.1, h), p(0.9, 0.9, h), p(0.9, 0.9, 0), p(0.9, 0.1, 0)];
    const poly = (pts, fill, stroke) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } };
    poly(L, rgba(mix([7, 11, 20], rgb, 0.05 + lit * 0.25), 1), rgba(rgb, 0.22 + lit * 0.4));
    poly(R, rgba(mix([11, 17, 30], rgb, 0.07 + lit * 0.3), 1), rgba(rgb, 0.22 + lit * 0.4));
    poly(top, rgba(mix([16, 26, 44], rgb, 0.12 + lit * 0.55), 1), rgba(rgb, 0.6 + lit * 0.4));
    // 楼顶的“代码行”
    g.strokeStyle = rgba(mix([140, 170, 210], rgb, lit), 0.25 + lit * 0.6); g.lineWidth = 1.5;
    g.beginPath();
    for (let k = 0; k < 4; k++) {
      const len = 0.25 + rand(b.i, 30 + k) * 0.5;
      const a = p(0.2, 0.22 + k * 0.17, h), c = p(0.2 + len * 0.6, 0.22 + k * 0.17, h);
      g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]);
    }
    g.stroke();
    if (lit > 0.05) { const c = p(0.5, 0.5, h); glow(g, c[0], c[1], o.s * (1 + lit), rgb, 0.45 * lit); }
  }
}
const bpos = (bx, by, o) => { const b = CITY.find((c) => c.x === bx && c.y === by) || { h: 1 }; return iso(bx + 0.5 - 3.5, by + 0.5 - 3.5, b.h + 0.6, o); };

function termPanel(g, x, y, w, h, lines, u, opts = {}) {
  panel(g, x, y, w, h, { title: opts.title || 'agent — zsh', rgb: opts.rgb || C.cyanRGB, glow: 0.8, alpha: opts.alpha ?? 1 });
  g.save(); rr(g, x, y, w, h, 14); g.clip();
  const size = opts.size || (PORTRAIT ? 23 : 22), lh = size * 1.55;
  const vis = lines.filter((l) => u >= l[0]);
  const maxRows = Math.floor((h - 56) / lh);
  const start = Math.max(0, vis.length - maxRows);
  vis.slice(start).forEach((l, i) => {
    const [t0, s, col] = l;
    const k = clamp((u - t0) / Math.max(0.15, [...s].length * 0.018));
    typeText(g, s, x + 22, y + 56 + i * lh + lh / 2, size, col || '#cfe3ff', k, { family: F.mono, alpha: opts.alpha ?? 1 });
  });
  g.restore();
}

SHOT.agent = (g, u, dur, cue) => {
  background(g, u, { tint: [8, 20, 34], dx: u * 10, dy: -u * 5 });
  bigYear(g, '2024', u, PORTRAIT ? ST.cx : ST.cx + 520, ST.cy + 30, PORTRAIT ? 420 : 560, 0.11);
  const long = TL.cut === 'long';
  const dec = cue('decide', -1), task = cue('L11', long ? dur * 0.35 : 0.2);
  const search = cue('search', task + 1.6), locate = cue('locate', search + 0.8), edit = cue('edit', locate + 0.8);
  const test = cue('test', edit + 0.8), retry = cue('retry', test + 1.2), move = cue('move', -1);
  const o = cityO();
  const z = 1 + 0.06 * ease(u, 0, dur);
  g.save(); g.translate(o.x, o.y); g.scale(z, z); g.translate(-o.x, -o.y);
  const bug = [3, 3], bug2 = [5, 1];
  const fixed1 = u > edit + 0.4, fixed2 = u > retry + 0.6;
  drawCity(g, o, (b) => {
    // 扫描：一圈从中心向外扩散
    const d = Math.hypot(b.x - 3, b.y - 3);
    const scan = Math.max(0, 1 - Math.abs((u - search) * 6 - d) / 1.2) * (u > search && u < search + 1.6 ? 1 : 0);
    if (b.x === bug[0] && b.y === bug[1] && u > locate) return fixed1 && u > test + 0.2 ? [C.greenRGB, 0.8] : [C.redRGB, 0.6 + 0.4 * Math.sin(u * 10), 0.15 * Math.sin(u * 10)];
    if (b.x === bug2[0] && b.y === bug2[1] && u > test + 0.3 && long) return fixed2 ? [C.greenRGB, 0.8] : [C.redRGB, 0.5 + 0.4 * Math.sin(u * 10)];
    return [C.cyanRGB, scan * 0.9];
  }, u);
  // Agent：彗星在楼之间飞
  const wps = [[-0.2, [0, 6]], [task + 0.3, [1, 5]], [search, [3, 5]], [search + 0.6, [5, 4]], [locate, bug], [edit + 0.6, bug], [test, [2, 2]], [retry, bug2], [retry + 1.2, bug2], [dur, [4, 4]]];
  const at = (tt) => {
    let i = 0; while (i < wps.length - 2 && tt > wps[i + 1][0]) i++;
    const [t0, a] = wps[i], [t1, b] = wps[i + 1];
    const k = inOut(clamp((tt - t0) / Math.max(0.01, Math.min(t1 - t0, 0.7))));
    const pa = bpos(a[0], a[1], o), pb = bpos(b[0], b[1], o);
    return [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k) - Math.sin(Math.PI * k) * 60 - 20 + Math.sin(tt * 3) * 6];
  };
  const trail = [];
  for (let j = 0; j < 18; j++) trail.push(at(u - j * 0.03));
  for (let j = trail.length - 1; j > 0; j--) glow(g, trail[j][0], trail[j][1], 22 * (1 - j / 18), C.cyanRGB, 0.5 * (1 - j / 18), 1);
  glowLine(g, trail, C.cyanRGB, 0.7, 3);
  const hd = trail[0];
  glow(g, hd[0], hd[1], 70, C.cyanRGB, 0.7); glow(g, hd[0], hd[1], 18, C.whiteRGB, 1, 1);
  g.restore();
  // 人：在城外，下达任务后就退到一边
  const hp = PORTRAIT ? [ST.x + 90, ST.y + ST.h - 40] : [ST.x + 160, ST.y + ST.h - 120];
  const ha = 1 - 0.6 * ease(u, task + 1.2, task + 2);
  glow(g, hp[0], hp[1], 46, C.amberRGB, ha); glow(g, hp[0], hp[1], 12, C.whiteRGB, ha, 1);
  const bk = ex(u, task - 0.2, task + 0.3) * (1 - ease(u, task + 2.4, task + 2.8));
  if (bk > 0) {
    g.save(); g.globalAlpha = bk;
    g.font = `600 ${PORTRAIT ? 34 : 38}px ${ZH ? F.cjk : F.ui}`;
    const tw = g.measureText('› ' + TL.txt.task).width;
    const bx = PORTRAIT ? CX - tw / 2 - 30 : ST.x + 40, by = PORTRAIT ? ST.y - 10 : ST.y + 10;
    g.translate(0, (1 - bk) * 30);
    panel(g, bx, by, tw + 60, 76, { bar: false, r: 30, rgb: C.amberRGB, glow: 1.6 });
    g.fillStyle = C.white; g.textBaseline = 'middle'; g.fillText('› ' + TL.txt.task, bx + 30, by + 39);
    glowLine(g, [[hp[0], hp[1]], [bx + 40, by + 76]], C.amberRGB, 0.5, 1.5);
    g.restore();
  }
  // 终端
  const red = '#ff8fa0', grn = '#8dffc9', dim = '#7f93b3';
  const lines = [
    [search, '$ rg "session" src/'], [search + 0.25, '  src/auth/store.ts:42', dim], [search + 0.4, '  src/api/me.ts:17', dim],
    [locate, ZH ? '→ 刷新时没有续期 cookie' : '→ cookie not renewed on refresh', '#ffd27a'],
    [edit, '✎ edit src/auth/store.ts  +6 −2'],
    [test, '$ npm test'], [test + 0.35, '✗ 2 failed', red],
    [retry, '✎ edit src/api/me.ts  +3 −1'], [retry + 0.5, '$ npm test'], [retry + 0.9, '✓ 48 passed', grn],
  ];
  const tw = PORTRAIT ? ST.w : 620, th = PORTRAIT ? 250 : 470;
  const tx = PORTRAIT ? ST.x : ST.x + ST.w - tw - 10, ty = PORTRAIT ? ST.y + ST.h - th + (FMT === 'v' ? 10 : 30) : ST.y + 140;
  const ta = ex(u, search - 0.5, search);
  if (ta > 0) { g.save(); g.translate((1 - ta) * 120, 0); termPanel(g, tx, ty, tw, th, lines, u, { alpha: ta }); g.restore(); }
  if (dec > 0) slam(g, TL.txt.nextStep, CX, PORTRAIT ? ST.cy - 40 : ST.cy, PORTRAIT ? 86 : 96, u, dec, C.white, { glow: C.cyanRGB, out: task - 0.4, maxW: W * 0.9 });
  if (move > 0) slam(g, 'IDE → TERMINAL', CX, PORTRAIT ? ST.cy - 40 : ST.cy, PORTRAIT ? 80 : 96, u, move, C.white, { glow: C.cyanRGB, family: F.black, maxW: W * 0.9 });
};

// —— 主战场从 IDE 搬进终端 ——
SHOT.term = (g, u, dur, cue) => {
  background(g, u, { tint: [8, 16, 28], dy: u * 12 });
  const devin = cue('devin', 0.8), cc = cue('cc', 1.6), codex = cue('codex', 2.4), move = cue('move', 3.6), done = cue('done', dur - 2);
  bigYear(g, u < cc ? '2024' : '2025', u, PORTRAIT ? ST.cx : ST.cx - 520, ST.cy, PORTRAIT ? 420 : 560, 0.11);
  // IDE 窗口缩小离开
  const mk = ease(u, move - 0.2, move + 0.6);
  const ide = { x: ST.cx - (PORTRAIT ? 470 : 520), y: ST.y + 60, w: PORTRAIT ? 940 : 1040, h: PORTRAIT ? 560 : 600 };
  if (mk < 1) {
    g.save(); g.globalAlpha = (1 - mk) * (1 - 0.65 * ease(u, devin - 0.2, devin + 0.2));
    const s = 1 - 0.6 * mk;
    g.translate(ide.x + ide.w / 2 - mk * (PORTRAIT ? 300 : 700), ide.y + ide.h / 2 - mk * 200); g.scale(s, s); g.translate(-(ide.x + ide.w / 2), -(ide.y + ide.h / 2));
    panel(g, ide.x, ide.y, ide.w, ide.h, { title: 'IDE', rgb: [130, 150, 190] });
    g.fillStyle = 'rgba(120,140,180,0.12)'; g.fillRect(ide.x + 1, ide.y + 34, 180, ide.h - 35);
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(150,170,210,0.3)'; g.fillRect(ide.x + 20, ide.y + 60 + i * 34, 60 + rand(i, 3) * 90, 8); }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${rand(i, 4) > 0.5 ? '197,155,255' : '127,216,255'},0.45)`; g.fillRect(ide.x + 220 + (i % 3) * 30, ide.y + 70 + i * 36, 100 + rand(i, 5) * 400, 10); }
    g.restore();
  }
  // 终端放大，日志刷屏
  const tk = ex(u, move - 0.3, move + 0.5);
  if (tk > 0) {
    const tw = lerp(300, PORTRAIT ? ST.w : 1300, tk), th = lerp(200, PORTRAIT ? 600 : 640, tk);
    const tx = ST.cx - tw / 2, ty = ST.y + (PORTRAIT ? 40 : 40);
    const L = [], base = move + 0.2;
    const msgs = ZH
      ? ['● 读取 132 个文件', '● 定位：src/auth/store.ts', '● 修改 3 个文件', '● 运行测试 … 48 passed', '● 启动应用，浏览器复现', '● 刷新 10 次：登录保持 ✓', '● 提交 PR #482']
      : ['● read 132 files', '● found: src/auth/store.ts', '● edited 3 files', '● ran tests … 48 passed', '● started app, reproduced in browser', '● refreshed 10×: still signed in ✓', '● opened PR #482'];
    L.push([base - 0.2, '› ' + TL.txt.task, '#ffd27a']);
    msgs.forEach((m, i) => L.push([base + 0.3 + i * Math.min(0.42, (done - base - 0.6) / msgs.length), m, i === msgs.length - 1 ? '#8dffc9' : '#cfe3ff']));
    g.save();
    termPanel(g, tx, ty, tw, th, L, u, { size: PORTRAIT ? 26 : 28, alpha: tk });
    g.restore();
  }
  // 产品徽章
  const badges = [[devin, 'Devin', '2024.03'], [cc, 'Claude Code', '2025.02'], [codex, 'Codex CLI', '2025.04']];
  badges.forEach(([t0, name, date], i) => {
    const k = ex(u, t0 - 0.1, t0 + 0.25) * (1 - ease(u, move - 0.3, move + 0.2));
    if (k <= 0) return;
    const bw = PORTRAIT ? 300 : 380, gap = PORTRAIT ? 20 : 40;
    const x = PORTRAIT ? ST.cx - bw / 2 : ST.cx - (3 * bw + 2 * gap) / 2 + i * (bw + gap);
    const y = PORTRAIT ? ST.y + 160 + i * 170 : ST.cy + 20;
    g.save(); g.globalAlpha = k; g.translate(x + bw / 2, y); g.scale(lerp(1.4, 1, k), lerp(1.4, 1, k)); g.translate(-(x + bw / 2), -y);
    panel(g, x, y - 55, bw, 110, { bar: false, rgb: C.cyanRGB, glow: 1.4, r: 18 });
    txt(g, name, x + bw / 2, y - 12, PORTRAIT ? 44 : 46, C.white, { family: F.black });
    txt(g, date, x + bw / 2, y + 30, 26, C.cyan, { family: F.mono });
    g.restore();
  });
  if (done > 0) {
    const a = slam(g, TL.txt.done, CX, PORTRAIT ? ST.y + ST.h - 60 : ST.y + ST.h - 70, PORTRAIT ? 84 : 92, u, done, C.white, { glow: C.greenRGB, maxW: W * 0.9 });
  }
};

// —— 同时开十个 ——
function gridRects(n) {
  const cols = PORTRAIT ? (n <= 2 ? 1 : 2) : n <= 2 ? n : n <= 4 ? 2 : 5;
  const rows = Math.ceil(n / cols);
  const gap = PORTRAIT ? 18 : 24;
  const w = (ST.w - gap * (cols - 1)) / cols, h = Math.min((ST.h - gap * (rows - 1)) / rows, w * 0.7);
  const totH = rows * h + (rows - 1) * gap;
  return [...Array(n).keys()].map((i) => ({ x: ST.x + (i % cols) * (w + gap), y: ST.cy - totH / 2 + Math.floor(i / cols) * (h + gap), w, h }));
}
const AG_NAMES = () => [TL.txt.front, TL.txt.back, TL.txt.migrate, TL.txt.oldbug, 'auth', 'search', 'billing', 'docs', 'i18n', 'perf'];
function miniAgent(g, r, u, i, opts = {}) {
  const a = opts.alpha ?? 1;
  const rgb = opts.rgb || C.cyanRGB;
  panel(g, r.x, r.y, r.w, r.h, { title: opts.title, titleSize: Math.max(12, Math.min(18, r.h * 0.08)), rgb, glow: 0.7, alpha: a });
  if (a < 0.05) return;
  g.save(); rr(g, r.x, r.y, r.w, r.h, 14); g.clip(); g.globalAlpha *= a;
  const lh = Math.max(9, r.h * 0.085), n = Math.floor((r.h - 50) / lh);
  const scroll = u * (3 + (i % 4));
  for (let k = 0; k < n; k++) {
    const row = Math.floor(scroll) + k, len = 0.2 + rand(row, i + 40) * 0.6;
    g.fillStyle = rgba(rand(row, i + 41) > 0.7 ? C.violetRGB : rand(row, i + 42) > 0.8 ? C.greenRGB : [150, 190, 230], 0.5);
    g.fillRect(r.x + 16 + (rand(row, i + 43) > 0.6 ? 20 : 0), r.y + 46 + (k - (scroll % 1)) * lh, (r.w - 50) * len, lh * 0.45);
  }
  // 进度条
  const p = (u * (0.08 + rand(i, 50) * 0.1) + rand(i, 51)) % 1;
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(r.x + 14, r.y + r.h - 16, r.w - 28, 5);
  g.fillStyle = rgba(rgb, 0.9); g.fillRect(r.x + 14, r.y + r.h - 16, (r.w - 28) * p, 5);
  g.restore();
}
SHOT.grid = (g, u, dur, cue) => {
  background(g, u, { tint: [10, 16, 32], dx: -u * 14 });
  bigYear(g, PORTRAIT ? '×10' : '×10', u, ST.cx, ST.cy, PORTRAIT ? 520 : 700, 0.1 * ease(u, cue('x10', 1) - 0.2, cue('x10', 1) + 0.4));
  const x10 = cue('x10', Math.min(1.2, dur * 0.4)), isoT = cue('iso', -1), gui = cue('gui', -1);
  const names = AG_NAMES();
  const gk = gui > 0 ? ease(u, gui - 0.3, gui + 0.6) : 0;
  // 1 → 2 → 4 → 10 个
  const n = u < x10 ? 1 : u < x10 + 0.18 ? 2 : u < x10 + 0.36 ? 4 : 10;
  const R = gridRects(n);
  const z = punch(u, x10, 0.04, 0.4) * punch(u, x10 + 0.36, 0.05, 0.4);
  g.save(); g.translate(CX, ST.cy); g.scale(z, z); g.translate(-CX, -ST.cy);
  if (gk < 1) {
    R.forEach((r, i) => {
      const born = i === 0 ? -1 : x10 + (i < 2 ? 0 : i < 4 ? 0.18 : 0.36);
      const k = ex(u, born, born + 0.25);
      const c = { x: lerp(r.x + r.w / 2, r.x, k), y: r.y, w: r.w * k, h: r.h };
      miniAgent(g, i === 0 && n === 1 ? { x: ST.cx - 380, y: ST.cy - 230, w: 760, h: 460 } : c, u, i, { title: (i === 0 && n === 1 ? 'agent' : names[i]), alpha: (1 - gk) * k });
      if (isoT > 0 && u > isoT + i * 0.05) {
        const ik = ease(u, isoT + i * 0.05, isoT + i * 0.05 + 0.3);
        g.save(); g.strokeStyle = rgba(C.greenRGB, 0.8 * ik * (1 - gk)); g.lineWidth = 2.5; g.setLineDash([10, 8]); g.lineDashOffset = -u * 30;
        rr(g, c.x - 8, c.y - 8, c.w + 16, c.h + 16, 18); g.stroke(); g.restore();
      }
    });
  }
  g.restore();
  // 隔离：每个 Agent 一条自己的分支（worktree）
  if (isoT > 0 && gk < 1) {
    const a = ease(u, isoT, isoT + 0.4) * (1 - gk);
    txt(g, TL.txt.isolate, CX, PORTRAIT ? ST.y + ST.h + 16 : ST.y - 22, PORTRAIT ? 30 : 28, C.green, { alpha: a, family: F.mono, maxW: W * 0.9 });
  }
  // GUI 回来了：一个列着 Agent 的桌面应用
  if (gk > 0) {
    const aw = PORTRAIT ? ST.w : 1500, ah = PORTRAIT ? ST.h : 760;
    const ax = ST.cx - aw / 2, ay = ST.cy - ah / 2;
    g.save(); g.globalAlpha = gk; g.translate(CX, ST.cy); g.scale(lerp(0.9, 1, gk), lerp(0.9, 1, gk)); g.translate(-CX, -ST.cy);
    panel(g, ax, ay, aw, ah, { title: 'Codex', rgb: C.whiteRGB, glow: 0.6 });
    const sw = PORTRAIT ? aw : 520;
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(ax + 1, ay + 36, sw, ah - 37);
    const rows = PORTRAIT ? 9 : 10, rh = (ah - 60) / rows;
    for (let i = 0; i < rows; i++) {
      const y = ay + 50 + i * rh, st = (Math.floor(u * 0.8 + rand(i, 60) * 5) + i) % 5;
      const rgb = st === 0 ? C.greenRGB : st === 1 ? C.amberRGB : C.cyanRGB;
      const sel = i === Math.floor(u * 1.2) % rows;
      if (sel) { g.fillStyle = 'rgba(71,229,255,0.1)'; g.fillRect(ax + 6, y, sw - 12, rh - 6); }
      glow(g, ax + 34, y + rh / 2 - 3, 16, rgb, 0.9, 1);
      txt(g, names[i % names.length], ax + 64, y + rh / 2 - 3, PORTRAIT ? 30 : 28, C.ink, { align: 'left', family: ZH ? F.cjk : F.ui, weight: 600 });
      const lbl = st === 0 ? '✓' : st === 1 ? '!' : (Math.floor(u * 4) % 4 === 0 ? '·  ' : Math.floor(u * 4) % 4 === 1 ? '·· ' : '···');
      txt(g, lbl, ax + sw - 40, y + rh / 2 - 3, 28, rgba(rgb, 1), { align: 'right', family: F.mono });
      g.fillStyle = rgba(rgb, 0.25); g.fillRect(ax + 64, y + rh - 14, (sw - 140) * ((u * 0.1 + rand(i, 61)) % 1), 3);
    }
    if (!PORTRAIT) miniAgent(g, { x: ax + sw + 30, y: ay + 60, w: aw - sw - 60, h: ah - 90 }, u, 3, { title: 'diff · ' + names[Math.floor(u * 1.2) % rows % names.length] });
    g.restore();
  }
};

// —— 人被淹没 ——
SHOT.overload = (g, u, dur, cue) => {
  const many = cue('many', 0.8), mem = cue('memory', -1), sw = cue('switch', -1), neck = cue('neck', -1);
  const grey = ease(u, many, dur * 0.85) * 0.7;
  background(g, u, { tint: mix([14, 18, 34], [18, 18, 20], grey) });
  const hx = ST.cx, hy = ST.cy + (PORTRAIT ? 30 : 10);
  // 卡片环绕；越来越多
  const count = Math.floor(lerp(2, PORTRAIT ? 18 : 26, ease(u, many - 0.2, many + 1.6)));
  const pings = TL.txt.pings;
  const rx = PORTRAIT ? 330 : 660, ry = PORTRAIT ? 300 : 280;
  const cards = [];
  for (let i = 0; i < count; i++) {
    const ring = i < 10 ? 0 : 1;
    const a = (i / Math.min(count, 10)) * TAU + (ring ? 0.3 : 0) + u * 0.05 * (ring ? -1 : 1);
    const rr2 = ring ? 1.25 : 0.85;
    cards.push({ x: hx + Math.cos(a) * rx * rr2, y: hy + Math.sin(a) * ry * rr2, i });
  }
  // 每张卡片对人发出的请求线
  const hit = [];
  cards.forEach((c, j) => {
    const t0 = (j < 2 ? 0.3 + j * 0.4 : many + (j - 2) * 0.12);
    const k = ease(u, t0, t0 + 0.3);
    if (k <= 0) return;
    hit.push(t0);
    const wob = mem > 0 ? ease(u, mem - 0.5, mem + 0.5) : 0;
    const pts = [];
    for (let s = 0; s <= 12; s++) {
      const q = s / 12;
      pts.push([lerp(c.x, hx, q) + Math.sin(q * 9 + j + u * 3) * 40 * wob * Math.sin(q * Math.PI), lerp(c.y, hy, q) + Math.cos(q * 7 + j) * 40 * wob * Math.sin(q * Math.PI)]);
    }
    const rgb = mix(C.amberRGB, C.redRGB, ease(u, many + 1, many + 3));
    glowLine(g, pts.slice(0, Math.max(2, Math.floor(13 * k))), rgb, 0.35, 1.5);
  });
  // 被切来切去的注意力：一束聚光在卡片之间跳
  const focus = sw > 0 && u > sw ? Math.floor((u - sw) * 5) % Math.max(1, cards.length) : -1;
  cards.forEach((c, j) => {
    const t0 = (j < 2 ? 0.1 + j * 0.4 : many + (j - 2) * 0.12);
    const k = ex(u, t0, t0 + 0.25);
    if (k <= 0) return;
    const cw = PORTRAIT ? 170 : 200, ch = PORTRAIT ? 96 : 110;
    const waiting = u > t0 + 0.8;
    const rgb = j === focus ? C.amberRGB : waiting ? mix(C.cyanRGB, [90, 100, 120], grey) : C.cyanRGB;
    g.save(); g.translate(c.x, c.y); g.scale(k, k);
    panel(g, -cw / 2, -ch / 2, cw, ch, { bar: false, rgb, glow: j === focus ? 2 : 0.5, r: 12 });
    const msg = pings[j % pings.length];
    txt(g, msg, 0, -12, PORTRAIT ? 26 : 26, j === focus ? C.amber : C.ink, { family: ZH ? F.cjk : F.ui, weight: 700, maxW: cw - 20 });
    txt(g, waiting ? TL.txt.needsYou + (Math.floor(u * 3) % 2 ? ' …' : ' ..') : '● run', 0, 24, 18, rgba(waiting ? C.amberRGB : C.cyanRGB, 0.8), { family: F.mono, maxW: cw - 20 });
    g.restore();
  });
  // 人：中间一个琥珀色的点，越来越抖
  const stress = ease(u, many, dur);
  const [sx, sy] = [noise1(u * 40, 1) * 8 * stress, noise1(u * 40, 2) * 8 * stress];
  glow(g, hx + sx, hy + sy, 140 + 40 * Math.sin(u * 12) * stress, C.amberRGB, 0.5);
  glow(g, hx + sx, hy + sy, 30, C.whiteRGB, 1, 1);
  // 未读角标
  const n = hit.filter((t0) => u > t0 + 0.3).length;
  const badge = n > 60 ? '99+' : String(Math.min(99, Math.round(n * (1 + stress * 3))));
  if (n > 0) {
    g.save(); g.translate(hx + 52 + sx, hy - 46 + sy);
    const bk = punch(u, hit[Math.min(hit.length - 1, n - 1)] + 0.3, 0.25, 0.2);
    g.scale(bk, bk);
    g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fillStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 30; g.fill();
    txt(g, badge, 0, 2, badge.length > 2 ? 30 : 36, C.white, { family: F.black });
    g.restore();
  }
  // 短版：同一镜头里落到“瓶颈是人”
  if (neck > 0) {
    const k = ease(u, neck - 0.15, neck);
    g.fillStyle = `rgba(3,4,8,${0.9 * k})`; g.fillRect(0, 0, W, H);
    slam(g, TL.txt.neck, CX, ST.cy - (PORTRAIT ? 70 : 60), PORTRAIT ? 150 : 170, u, neck, C.white, { glow: C.redRGB });
    slam(g, TL.txt.neck2, CX, ST.cy + (PORTRAIT ? 110 : 110), PORTRAIT ? 150 : 170, u, neck + 0.35, C.amber, { glow: C.amberRGB });
  }
};

// —— 瓶颈：一只瓶子，所有光都堵在瓶口；瓶口坐着人 ——
SHOT.neck = (g, u, dur, cue) => {
  const neck = cue('neck', dur * 0.6);
  background(g, u, { tint: [16, 12, 22], dots: false });
  const cx = ST.cx, top = ST.y + (PORTRAIT ? 20 : 10), mid = ST.cy + (PORTRAIT ? 120 : 110), bot = ST.y + ST.h;
  const wTop = PORTRAIT ? 470 : 760, wNeck = 46;
  const zoomK = ease(u, neck - 0.4, neck + 0.3);
  const z = lerp(1, 1.35, zoomK);
  g.save(); g.translate(cx, mid); g.scale(z, z); g.translate(-cx, -mid);
  // 瓶身
  const L = [[cx - wTop, top], [cx - wTop * 0.9, mid - 220], [cx - wNeck, mid - 20], [cx - wNeck, mid + 30]];
  const R = L.map(([x, y]) => [2 * cx - x, y]);
  glowLine(g, L, C.violetRGB, 0.8, 2.5); glowLine(g, R, C.violetRGB, 0.8, 2.5);
  // 光点往下流，到瓶口就挤住
  for (let i = 0; i < 260; i++) {
    const s = rand(i, 70), ph = rand(i, 71);
    const prog = ((u * (0.18 + s * 0.2) + ph) % 1);
    const jam = Math.min(prog, 0.86 + rand(i, 72) * 0.12);
    const y = lerp(top + 20, mid - 10, jam);
    const yk = (y - top) / (mid - top);
    const half = lerp(wTop * 0.85, wNeck * 0.8, Math.pow(yk, 1.6));
    const x = cx + (rand(i, 73) * 2 - 1) * half;
    glow(g, x, y, 9, C.cyanRGB, 0.5 + 0.4 * yk, 1);
  }
  // 人在瓶口
  glow(g, cx, mid + 6, 80 + 10 * Math.sin(u * 9), C.amberRGB, 0.9);
  glow(g, cx, mid + 6, 20, C.whiteRGB, 1, 1);
  // 只有一滴一滴漏下去
  for (let k = 0; k < 6; k++) {
    const p = ((u * 0.7 + k / 6) % 1);
    glow(g, cx, lerp(mid + 30, bot, p), 12, C.cyanRGB, 0.8 * (1 - p), 1);
  }
  g.restore();
  const dk = ease(u, neck - 0.1, neck + 0.1);
  if (dk > 0) { g.fillStyle = `rgba(3,4,8,${0.55 * dk})`; g.fillRect(0, 0, W, H); }
  slam(g, TL.txt.neck, CX, ST.cy - (PORTRAIT ? 80 : 70), PORTRAIT ? 150 : 180, u, neck, C.white, { glow: C.redRGB });
  slam(g, TL.txt.neck2, CX, ST.cy + (PORTRAIT ? 110 : 120), PORTRAIT ? 150 : 180, u, neck + 0.4, C.amber, { glow: C.amberRGB });
};
