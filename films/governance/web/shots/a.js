// 镜头 A：开场与“职责往上一层”—— AI 管 AI、点题、三个阶段、越往上越管机制、西蒙的“决策前提”、《不拘一格》的上下文。
// 坐标：原点在舞台中心；竖屏约 ±417 × ±300，横屏约 ±804 × ±357（SW、SH 是半宽、半高）。
// 每个镜头里的动作跟着关键词（c.k）走；关键词不在这一版旁白里时，退回到句子起点（c.line）。
const P = PORTRAIT;
const BOOKS = {
  simon: { title: '管理行为', author: '赫伯特·西蒙', en: 'Herbert A. Simon', year: 1947, color: '#6e2a2a' },
  rules: { title: '不拘一格', author: '哈斯廷斯 · 迈耶', en: 'Hastings & Meyer', year: 2020, color: '#2c2f3a' },
  thompson: { title: ['行动中的', '组织'], author: '詹姆斯·汤普森', en: 'James D. Thompson', year: 1967, color: '#24465a' },
  mintzberg: { title: ['卓有成效', '的组织'], author: '亨利·明茨伯格', en: 'Henry Mintzberg', year: 1983, color: '#2f4a33' },
  grove: { title: ['格鲁夫给经理人', '的第一课'], author: '安迪·格鲁夫', en: 'Andrew S. Grove', year: 1983, color: '#4a3a1e' },
  beer: { title: '企业之心', author: '斯塔福德·比尔', en: 'Stafford Beer', year: 1979, color: '#3a2448' },
  meadows: { title: '系统之美', author: '德内拉·梅多斯', en: 'Donella H. Meadows', year: 2008, color: '#1f4a44' },
  barnard: { title: ['经理人员', '的职能'], author: '切斯特·巴纳德', en: 'Chester I. Barnard', year: 1938, color: '#3d3020' },
};
// 盖一层暗幕
function dim(g, a) { if (a <= 0.003) return; g.save(); g.fillStyle = rgba(C.scrimRGB, a); g.fillRect(-W, -H, W * 2, H * 2); g.restore(); }
// 关键词时刻，没有就退回到第 i 句开头之后 d 秒
const KT = (c, name, i = 0, d = 0.6) => c.k(name, Math.min(c.line(i), c.dur) + d);
// 一张任务卡从 a 飞到 b（弧线）；k 0..1
function flyCard(g, a, b, k, color, lift = 80) {
  if (k <= 0 || k >= 1) return;
  const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  const [x, y] = qpt(a, m, b, outCubic(k));
  taskCard(g, x, y, 0.8 + 0.25 * Math.sin(k * Math.PI), color, { rot: (k - 0.5) * 0.8 });
}
// 小人群：n 个小点人（远景用），seed 决定位置
function crowd(g, x, y, n, r, t, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = rand(i, o.seed ?? 3) * TAU, d = Math.sqrt(rand(i, (o.seed ?? 3) + 1)) * r;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7;
    const col = AGRGB[i % 5];
    g.fillStyle = rgba(col, o.alpha ?? 0.85); g.beginPath(); g.arc(px, py + Math.sin(t * 3 + i) * 1.2, o.dot ?? 5, 0, TAU); g.fill();
  }
}

// —— 开场：我不再亲手派活，AI 管 AI ——
SHOT.hook = (g, c) => {
  const u = c.u, tAA = KT(c, 'aa', 1, 0.3), tStop = Math.min(KT(c, 'stop', 0, 0.5), tAA - 0.4);
  const hx = P ? -260 : -600, hy = P ? 150 : 130;
  const co = P ? [-15, 40] : [-150, 30];
  const workers = P ? [[260, -130], [335, 40], [255, 200], [95, 250]] : [[380, -210], [610, -50], [610, 150], [380, 280]];
  const nW = c.has('spawn') ? 5 : 4;
  if (c.has('spawn')) workers.push(P ? [120, -250] : [620, 40]);
  const kCo = pop(u, tStop + 0.15, 0.45);
  // 组织线：协调者 → 各个执行者
  if (u > tStop) for (let i = 0; i < nW; i++) {
    const k = ease(u, tStop + 0.35 + i * 0.08, tStop + 0.9 + i * 0.08) * (i === 4 ? ease(u, c.k('spawn'), c.k('spawn') + 0.5) : 1);
    trail(g, [co, [lerp(co[0], workers[i][0], 0.5), co[1]], [lerp(co[0], workers[i][0], 0.5), workers[i][1]], workers[i]], C.bossRGB, u, { k, w: 4, alpha: 0.75 });
  }
  // 卡片：停手之前是人在扔，之后是协调者在派
  const period = 0.42;
  for (let i = 0; i < 60; i++) {
    const t0 = 0.05 + i * period, from = t0 < tStop ? [hx + 40, hy - 40] : co, to = workers[i % (t0 < tStop ? 4 : nW)];
    if (t0 > u || u - t0 > 0.6) continue;
    if (t0 >= tStop && t0 < tStop + 0.55) continue;
    flyCard(g, from, to, (u - t0) / 0.55, AG[i % 5]);
  }
  workers.slice(0, nW).forEach(([x, y], i) => {
    const born = i === 4 ? pop(u, c.k('spawn'), 0.4) : 1;
    if (born <= 0.01) return;
    agent(g, x, y, (P ? 1.12 : 1.4) * born, u, { color: AG[i], seed: i + 2, mood: u < tStop ? 'stress' : 'focus', look: -0.6 });
    if (i === 4) glow(g, x, y, 120 * (1 - ramp(u, c.k('spawn'), c.k('spawn') + 0.8)), C.limeRGB, 0.8);
  });
  if (kCo > 0.01) {
    agent(g, co[0], co[1], (P ? 1.45 : 1.75) * kCo, u, { color: C.boss, crown: true, seed: 9, mood: 'focus', look: 0.6, lamp: 1 });
    chip(g, '协调者', co[0], co[1] - (P ? 145 : 170), P ? 28 : 32, null, rgba(C.bossRGB, 0.95), { alpha: ease(u, tStop + 0.5, tStop + 0.8), weight: '800' });
  }
  // 人：停手前满头大汗地扔卡片，停手后端着杯子退到一边
  const back = ease(u, tStop, tStop + 0.6);
  if (!c.hideHuman) human(g, hx - back * (P ? 30 : 60), hy + back * 10, P ? 1.35 : 1.7, u, { sweat: back < 0.5, mouth: back < 0.5 ? 'open' : 'smile', arm: back < 0.5 ? 0.7 + 0.3 * Math.sin(u * 15) : 0, mug: back > 0.5, look: back > 0.5 ? 1 : 0.5 });
  if (back < 0.5) for (let i = 0; i < 4; i++) taskCard(g, hx + 62, hy - 8 - i * 9, 0.7, AG[i], { rot: 0.1 });
  // 字：先“我派活”被划掉，再砸下“AI 管 AI”
  const ty = P ? -238 : -270;
  if (c.cover) return; // 封面：镜头里的字不画，封面自己写大字
  if (u < tAA) {
    const a = ease(u, 0.1, 0.4) * (1 - ease(u, tAA - 0.2, tAA));
    txt(g, '我 → AI', P ? 0 : -60, ty, P ? 64 : 72, C.ink, { weight: '900', alpha: a, stroke: 8 });
    const sk = ease(u, tStop, tStop + 0.3);
    if (sk > 0) line(g, (P ? 0 : -60) - 150, ty, (P ? 0 : -60) - 150 + 300 * sk, ty, C.alarm, 10);
  }
  slam(g, 'AI 管 AI', P ? 0 : -60, ty, P ? 96 : 110, C.gold, u, tAA, { family: F.sans, stroke: 10 });
  // 长版：分工与验收规则
  if (c.has('rules')) {
    const k = pop(u, c.k('rules'), 0.4), x = P ? -250 : -150, y = P ? -110 : -190;
    if (k > 0.01) {
      g.save(); g.translate(x, y); g.scale(k, k);
      panel(g, -110, -58, 220, 116, { fill: C.panel2, stroke: rgba(C.goldRGB, 0.7), r: 14 });
      txt(g, '分工', -50, -24, 26, C.ink, { weight: '800' }); txt(g, '验收规则', 30, 24, 26, C.ink, { weight: '800' });
      badge(g, -94 + 4, -24, 13); badge(g, -60, 24, 13);
      g.restore();
    }
  }
};

// —— 点题：写程序，越来越像治理一个组织 ——
SHOT.title = (g, c) => {
  const u = c.u, tOrg = KT(c, 'org', 0, 1.0);
  const k1 = ex(u, 0.0, 0.5), k2 = ease(u, tOrg - 0.6, tOrg);
  // 代码行慢慢长成一棵组织树
  const n = 7, tx = P ? 0 : -330, ty = P ? -40 : 30;
  const nodes = [[0, -150], [-150, -20], [0, -20], [150, -20], [-220, 110], [-80, 110], [80, 110], [220, 110]];
  g.save(); g.translate(P ? 0 : 330, P ? 70 : 20); g.scale(P ? 1.15 : 1.25, P ? 1.15 : 1.25);
  for (let i = 0; i < n; i++) {
    const y0 = -150 + i * 44, x0 = -240 + (i % 3) * 24;
    const [nx, ny] = nodes[i + 1] ?? nodes[0];
    const x = lerp(x0, nx, k2), y = lerp(y0, ny, k2), w = lerp(120 + rand(i, 2) * 220, 0, k2);
    g.fillStyle = rgba(AGRGB[i % 5], 0.7 * (1 - k2)); rr(g, x, y - 8, w, 16, 8); g.fill();
  }
  if (k2 > 0.02) {
    const L = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [3, 6], [3, 7]];
    for (const [a, b] of L) trail(g, [nodes[a], [nodes[a][0], (nodes[a][1] + nodes[b][1]) / 2], [nodes[b][0], (nodes[a][1] + nodes[b][1]) / 2], nodes[b]], C.bossRGB, u, { k: k2, w: 4, alpha: 0.8 });
    nodes.forEach(([x, y], i) => { if (i) agent(g, x, y, 0.5 * pop(u, tOrg - 0.3 + i * 0.04, 0.35), u, { color: AG[(i - 1) % 5], seed: i, mood: 'happy' }); });
    agent(g, nodes[0][0], nodes[0][1], 0.62 * pop(u, tOrg - 0.35, 0.35), u, { color: C.boss, crown: true, seed: 9, mood: 'focus', lamp: 1 });
  }
  g.restore();
  if (P) {
    txt(g, '写程序', 0, -250, 84, C.teal, { weight: '900', alpha: k1, stroke: 10 });
    txt(g, '越来越像', 0, -172, 40, C.ink, { weight: '700', alpha: ease(u, 0.3, 0.6), stroke: 6 });
    slam(g, '治理一个组织', 0, 270, 76, C.gold, u, tOrg, { stroke: 10 });
  } else {
    txt(g, '写程序', tx, -170, 110, C.teal, { weight: '900', alpha: k1, stroke: 10 });
    txt(g, '越来越像', tx, -40, 50, C.ink, { weight: '700', alpha: ease(u, 0.3, 0.6), stroke: 6 });
    slam(g, '治理一个组织', tx, 100, 96, C.gold, u, tOrg, { stroke: 10 });
  }
};

// —— 三个阶段：以前写函数 → 后来带几个 AI（像技术负责人）→ 现在派活也交出去 ——
function evoPanel(g, i, u, c, live) {
  const t0 = c.line(i), k = ease(u, t0, t0 + 0.4);
  if (i === 0) {
    // 函数与模块：三块模块、数据在箭头上流动
    const boxes = [[-170, -60, '模块 A'], [170, -60, '模块 B'], [0, 110, '模块 C']];
    boxes.forEach(([x, y, s], j) => {
      panel(g, x - 110, y - 56, 220, 112, { fill: C.panel2, stroke: rgba(AGRGB[j], 0.7), r: 14 });
      txt(g, s, x, y - 26, 24, C.ink, { weight: '800' });
      txt(g, 'fn()', x, y + 16, 26, AG[j], { family: F.mono, weight: '700' });
    });
    trail(g, [[-60, -60], [60, -60]], C.tealRGB, u, { w: 4 });
    trail(g, [[170, -4], [170, 110], [110, 110]], C.violetRGB, u, { w: 4 });
    trail(g, [[-110, 110], [-170, 110], [-170, -4]], C.coralRGB, u, { w: 4 });
  } else if (i === 1) {
    // 我带几个 AI：拆任务、审代码、劝架
    human(g, 0, 150, 1.05, u, { arm: 0.6, look: Math.sin(u * 3) });
    const ps = [[-230, -50], [0, -150], [230, -50]];
    ps.forEach(([x, y], j) => agent(g, x, y, 0.95, u, { color: AG[j], seed: j, mood: j === 2 && Math.sin(u * 2) > 0 ? 'stress' : 'focus' }));
    for (let j = 0; j < 3; j++) { const t0 = (u * 1.5 + j / 3) % 1; flyCard(g, [0, 100], ps[j], t0, AG[j], 40); }
    // 冲突：两个 AI 之间的火花，人张开手劝架
    const sp = (Math.sin(u * 6) + 1) / 2;
    glow(g, 105, -105, 50 + 30 * sp, C.alarmRGB, 0.5 * live);
    icon(g, 'bolt', 105, -105, 50, C.alarm);
    chip(g, '活像个技术负责人', 0, 262, 30, null, rgba(C.warmRGB, 0.95), { alpha: ease(u, c.k('lead', t0 + 1.2), c.k('lead', t0 + 1.2) + 0.3), weight: '900' });
  } else {
    // 现在：协调者在中间，人退到边上
    agent(g, 0, -30, 0.85, u, { color: C.boss, crown: true, seed: 9, mood: 'focus', lamp: 1 });
    const ps = [[-220, 110], [-80, 160], [80, 160], [220, 110]];
    ps.forEach(([x, y], j) => { trail(g, [[0, 10], [x, y - 40]], C.goldRGB, u, { w: 3, alpha: 0.7 }); agent(g, x, y, 0.55, u, { color: AG[j], seed: j + 4, mood: 'happy' }); });
    human(g, 250, -150, 0.6, u, { mug: true, look: -1 });
  }
}
SHOT.evolution = (g, c) => {
  const u = c.u, labels = ['以前', '后来'];
  const t1 = c.n > 1 ? c.line(1) : 1e9; // “后来”那一句
  const cur = u >= t1 - 0.05 ? 1 : 0;
  if (P) {
    // 竖屏：一次一块，向左滑
    const sl = ease(u, t1 - 0.15, t1 + 0.35);
    for (let i = 0; i < 2; i++) {
      const x = (i - sl) * 900;
      if (Math.abs(x) > 899) continue;
      g.save(); g.translate(x, 20); g.scale(0.95, 0.95);
      evoPanel(g, i, u, c, 1);
      g.restore();
      chip(g, labels[i], x, -260, 32, null, i ? C.gold : C.ink, { weight: '900' });
    }
  } else {
    for (let i = 0; i < 2; i++) {
      const x = (i - 0.5) * 760, a = i <= cur ? (i === cur ? 1 : 0.35) : 0.12;
      g.save(); g.globalAlpha *= a; g.translate(x, 40); g.scale(1.0, 1.0);
      evoPanel(g, i, u, c, i === cur ? 1 : 0);
      g.restore();
      g.save(); g.globalAlpha *= i <= cur ? 1 : 0.3;
      chip(g, labels[i], x, -300, 32, null, i ? C.gold : C.ink, { weight: '900' });
      g.restore();
    }
    arrow(g, -90, -300, 90, -300, rgba(C.inkRGB, 0.4), 4, 1, 14);
  }
};

// —— 职责往上一层：几个人 → 几个团队 → 几千人；越往上越不碰具体的活，管的是机制 ——
SHOT.ladder = (g, c) => {
  const u = c.u;
  const t2 = KT(c, 'thousands', 0, 1.6), t1 = Math.min(c.k('teams', t2 - 0.9), t2 - 0.5), t3 = KT(c, 'mech', 1, 0.6);
  const z = lerp(1, 0.38, inOutCubic(ramp(u, t1 - 0.3, t1 + 0.6))) * lerp(1, 0.32, inOutCubic(ramp(u, t2 - 0.3, t2 + 0.7)));
  g.save(); g.translate(0, P ? 40 : 30); g.scale(z, z);
  // 远景：几千个小点（只在拉远后出现）
  const far = ramp(u, t2 - 0.2, t2 + 0.6);
  if (far > 0.01) {
    g.save(); g.globalAlpha *= far;
    for (let i = 0; i < 900; i++) {
      const gx = (rand(i, 5) - 0.5) * 3600, gy = (rand(i, 6) - 0.5) * 2400;
      if (Math.abs(gx) < 700 && Math.abs(gy) < 450) continue;
      // 机制：小点沿着弯曲的流线走
      const flow = ease(u, t3, t3 + 1.2);
      const lane = Math.round(gy / 240) * 240, fx = ((gx + 1800 + u * 260) % 3600) - 1800;
      const px = lerp(gx, fx, flow), py = lerp(gy, lane + Math.sin(fx * 0.004 + lane) * 60, flow);
      g.fillStyle = rgba(AGRGB[i % 5], 0.8); g.beginPath(); g.arc(px, py, 12, 0, TAU); g.fill();
    }
    g.restore();
  }
  // 中景：几个团队（每个团队一个负责人 + 一圈人）
  const mid = ramp(u, t1 - 0.2, t1 + 0.4);
  const teams = [[-560, -300], [560, -300], [-560, 320], [560, 320], [0, -520], [0, 560]];
  if (mid > 0.01) teams.forEach(([x, y], j) => {
    g.save(); g.globalAlpha *= mid;
    human(g, x, y - 40, 0.9, u, { shirt: '#c98e4a', seed: j });
    crowd(g, x, y + 80, 7, 110, u, { seed: j * 3 + 1, dot: 16 });
    g.restore();
  });
  // 近景：一个技术负责人带几名工程师
  human(g, 0, -70, 1.3, u, { arm: 0.4 * (1 - mid), shirt: C.warm });
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175); agent(g, Math.cos(a) * 300, 80 + Math.sin(a) * 130, 0.95, u, { color: AG[i], seed: i, mood: 'focus' }); }
  g.restore();
  // 标注
  const lab = u < t1 ? '带几名工程师' : u < t2 ? '管几个团队' : '几千名工程师';
  const lk = u < t1 ? ease(u, 0.1, 0.4) : u < t2 ? ease(u, t1, t1 + 0.3) : ease(u, t2, t2 + 0.3);
  chip(g, lab, 0, P ? -250 : -290, P ? 34 : 36, null, C.ink, { alpha: lk * (1 - ease(u, t3 - 0.2, t3)), weight: '900' });
  if (u > t3 - 0.1) {
    icon(g, 'gear', P ? -150 : -230, P ? -250 : -290, 70, C.gold, u * 0.8);
    slam(g, '管机制', P ? 40 : 30, P ? -250 : -290, P ? 72 : 84, C.gold, u, t3, { stroke: 10 });
    txt(g, '而不是具体的活', 0, P ? 250 : 290, P ? 38 : 44, C.ink, { weight: '800', alpha: ease(u, t3 + 0.4, t3 + 0.8), stroke: 8 });
  }
};

// —— 西蒙：不替它做决定，管住它做决定的前提（看重什么、看到什么）——
SHOT.simon = (g, c) => {
  const u = c.u, tV = KT(c, 'value', 0, 1.6), tF = c.k('fact', tV + 0.6), tP = KT(c, 'premise', 0, 1.0);
  const tOn = Math.min(tV, tF, tP);
  const x0 = P ? -380 : -720, fx = P ? -120 : -260, ends = P ? [[380, -170], [380, 30], [380, 230]] : [[720, -200], [720, 20], [720, 240]];
  const fy = P ? 30 : 20;
  const best = 1; // 被照亮的那条路
  const lit = ease(u, tOn, tOn + 0.6);
  ends.forEach(([ex2, ey], j) => trail(g, [[fx, fy], [fx + (ex2 - fx) * 0.35, ey], [ex2, ey]], j === best ? mixRGB(C.dimRGB, C.goldRGB, lit) : C.dimRGB, u, { w: j === best ? 6 + 3 * lit : 5, alpha: j === best ? 0.5 + 0.5 * lit : 0.35 * (1 - 0.5 * lit), flow: j === best && lit > 0.5 }));
  trail(g, [[x0, fy], [fx, fy]], C.inkRGB, u, { w: 6, alpha: 0.5 });
  // 一队 Agent 走到岔路口：点亮前随便选（有的打转），点亮后都走同一条
  for (let i = 0; i < 9; i++) {
    const t0 = i * 0.55, k = (u - t0) / 2.6;
    if (k <= 0 || k >= 1) continue;
    const chosen = t0 + 1.2 > tOn ? best : Math.floor(rand(i, 4) * 3);
    let x, y;
    if (k < 0.45) { x = lerp(x0, fx, k / 0.45); y = fy; }
    else { const e = ends[chosen], q = (k - 0.45) / 0.55; [x, y] = pathAt([[fx, fy], [fx + (e[0] - fx) * 0.35, e[1]], e], q); }
    const lost = chosen !== best && k > 0.6;
    agent(g, x, y - 44, P ? 0.68 : 0.8, u, { color: AG[i % 5], seed: i, mood: lost ? 'dizzy' : chosen === best && k > 0.5 ? 'happy' : 'focus' });
    if (lost) icon(g, 'q', x + 26, y - 90, 40, C.dim);
  }
  // 两盏灯：价值、事实
  const lamps = [['看重什么', '价值', C.warmRGB, -1, tV], ['看到什么', '事实', C.tealRGB, 1, tF]];
  lamps.forEach(([a, b, rgb, s, t1]) => {
    const lx = (P ? 0 : 60) + s * (P ? 150 : 210), ly = P ? -200 : -240, on = ease(u, t1, t1 + 0.4);
    line(g, lx, ly - 80, lx, ly - 30, rgba(C.inkRGB, 0.4), 3);
    glow(g, lx, ly, 70 + 50 * on, rgb, 0.2 + 0.7 * on);
    g.fillStyle = rgba(mixRGB([60, 55, 70], rgb, on), 1); g.beginPath(); g.arc(lx, ly, 24, 0, TAU); g.fill();
    txt(g, b, lx, ly + 52, 24, rgba(rgb, 0.6 + 0.4 * on), { weight: '800' });
    txt(g, a, lx, ly + 86, P ? 28 : 30, rgba(C.inkRGB, 0.3 + 0.7 * on), { weight: '900', stroke: 6 });
  });
  slam(g, '管前提', P ? 0 : 60, P ? 250 : 290, P ? 64 : 72, C.gold, u, tP, { stroke: 9 });
  if (u < tP) txt(g, '不替它做决定', P ? 0 : 60, P ? 250 : 290, P ? 44 : 50, C.ink, { weight: '900', alpha: ease(u, 0.2, 0.5) * (1 - ease(u, tP - 0.15, tP)), stroke: 8 });
  cite(g, BOOKS.simon, ease(u, 0.2, 0.7));
};

// —— 《不拘一格》：给上下文，不给控制；我不在场，事情照样推进 ——
SHOT.context = (g, c) => {
  const u = c.u, tC = KT(c, 'ctx', 0, 1.0), tA = KT(c, 'away', 1, 0.6);
  const cut = ease(u, tC, tC + 0.25);
  const ps = P ? [[-240, 130], [-80, 160], [80, 160], [240, 130]] : [[-420, 150], [-140, 180], [140, 180], [420, 150]];
  // 目标、边界、验收标准：一块发光的板
  const board = ease(u, tC + 0.1, tC + 0.6);
  if (board > 0.01) {
    const bw = P ? 640 : 900, by = P ? -150 : -170;
    panel(g, -bw / 2, by - 70, bw, 140, { fill: rgba([40, 34, 30], 0.92 * board), stroke: rgba(C.warmRGB, 0.8 * board), r: 18 });
    ['目标', '边界', '验收标准'].forEach((s, i) => { const x = (i - 1) * bw * 0.31; txt(g, s, x, by, P ? 38 : 44, C.warm, { weight: '900', alpha: ease(u, tC + 0.25 + i * 0.12, tC + 0.5 + i * 0.12) }); });
    txt(g, '上下文', 0, by - 96, 28, C.dim, { weight: '800', alpha: board });
  }
  // 提线：断开之前，Agent 被一根根线吊着、一顿一顿地动
  const barY = P ? -230 : -260;
  if (cut < 1) {
    g.save(); g.globalAlpha *= 1 - cut;
    g.fillStyle = '#8a7a66'; rr(g, P ? -300 : -480, barY - 12, P ? 600 : 960, 24, 12); g.fill();
    txt(g, '指令控制', 0, barY - 44, 28, C.dim, { weight: '800' });
    g.restore();
  }
  ps.forEach(([x, y], i) => {
    const jerk = cut < 1 ? Math.round(Math.sin(u * 2.4 + i) * 2) * 10 : 0;
    const free = ease(u, tC + 0.3, tC + 1.2), walk = Math.max(0, u - tC - 0.3);
    const xx = x + free * Math.sin(walk * 0.8 + i) * 30, yy = y + jerk * (1 - cut) - free * 10;
    if (cut < 1) {
      const fall = cut * 40;
      line(g, x, barY + 12, x, yy - 60 - fall, rgba(C.inkRGB, 0.6 * (1 - cut)), 2);
    }
    agent(g, xx, yy, P ? 0.8 : 1.0, u, { color: AG[i], seed: i, mood: cut > 0.5 ? 'happy' : 'focus', look: free * Math.sin(walk + i) });
  });
  // 我不在场：人淡成轮廓，Agent 照样走
  const away = ease(u, tA, tA + 0.8);
  const hx = P ? 300 : 650, hy = P ? -10 : 0;
  human(g, hx, hy, P ? 0.7 : 0.85, u, { alpha: 1 - 0.75 * away, mug: true, look: -1 });
  if (away > 0.01) chip(g, '我不在场，事情照样推进', 0, P ? 270 : 300, P ? 30 : 34, null, rgba(C.warmRGB, 0.95), { alpha: away, weight: '800' });
  cite(g, BOOKS.rules, ease(u, 0.2, 0.7));
};
