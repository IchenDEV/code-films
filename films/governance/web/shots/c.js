// 镜头 C：纠偏，而不是救火 —— 两个 AI 互相否定的死循环、救火、往提示词里加“以后请注意”、杠杆、三个追问、改机制、好的技术负责人。

// 一个小虫：问题
function bug(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha != null) g.globalAlpha *= o.alpha;
  const wig = Math.sin(t * 20 + (o.seed ?? 0)) * 3;
  glow(g, 0, 0, 40, C.redRGB, 0.35);
  g.strokeStyle = '#3a0c14'; g.lineWidth = 3.5; g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 8, i * 8); g.lineTo(d * 22, i * 10 + (i ? wig : -wig)); g.stroke(); }
  g.fillStyle = C.red; g.beginPath(); g.ellipse(0, 4, 14, 18, 0, 0, TAU); g.fill();
  g.fillStyle = '#5a1420'; g.beginPath(); g.arc(0, -12, 8, 0, TAU); g.fill();
  g.restore();
}
// 灭火器
function extinguisher(g, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(rot);
  g.fillStyle = '#e8453c'; rr(g, -14, -10, 28, 60, 10); g.fill();
  g.fillStyle = '#2b2230'; rr(g, -8, -22, 16, 14, 3); g.fill();
  g.strokeStyle = '#2b2230'; g.lineWidth = 5; g.beginPath(); g.moveTo(6, -18); g.quadraticCurveTo(30, -26, 36, -10); g.stroke();
  g.restore();
}

// —— 死循环：两个 AI 互相审查、互相否定 ——
SHOT.loop = (g, c) => {
  const u = c.u, tDeny = KT(c, 'deny', 0, 1.2), tLoop = c.k('loop', tDeny + 1.0);
  const tRedo = c.k('redo', 1e9);
  const ax = P ? 270 : 430, ay = P ? 40 : 30;
  const spin = Math.max(0, u - 0.3), speed = 1 + 2.5 * ease(u, tDeny, tLoop + 1);
  const ang = spin * 1.8 * speed;
  // 中间的循环箭头，越转越快
  g.save(); g.translate(0, ay); g.rotate(ang);
  for (let i = 0; i < 2; i++) {
    g.save(); g.rotate(i * Math.PI);
    g.strokeStyle = rgba(mixRGB(C.goldRGB, C.redRGB, ease(u, tLoop - 0.3, tLoop + 0.3)), 0.9); g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, P ? 150 : 210, 0.25, Math.PI - 0.35); g.stroke();
    const r = P ? 150 : 210, a = Math.PI - 0.35;
    g.fillStyle = g.strokeStyle; g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(a + Math.PI / 2);
    g.beginPath(); g.moveTo(0, -18); g.lineTo(20, 4); g.lineTo(-20, 4); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
  // 来回飞的意见：✗ 和“改”
  for (let i = 0; i < 24; i++) {
    const t0 = 0.2 + i * 0.5 / speed;
    const k = (u - t0) / 0.55;
    if (k <= 0 || k >= 1) continue;
    const dir = i % 2 ? 1 : -1, x = lerp(-dir * (ax - 70), dir * (ax - 70), outCubic(k)), y = ay - 150 * Math.sin(k * Math.PI) * dir * (P ? 0.8 : 1);
    if (i % 2) badge(g, x, y, 22, 'cross', C.red);
    else { g.fillStyle = C.card; rr(g, x - 26, y - 18, 52, 36, 8); g.fill(); if (C.cardLine) { g.strokeStyle = C.cardLine; g.lineWidth = 2.5; g.stroke(); } txt(g, '改', x, y, 24, C.bubbleFg, { weight: '900' }); }
  }
  const dizzy = u > tLoop;
  agent(g, -ax, ay, P ? 1.35 : 1.7, u, { color: C.teal, seed: 1, mood: dizzy ? 'dizzy' : u > tDeny ? 'stress' : 'focus', look: 1 });
  agent(g, ax, ay, P ? 1.35 : 1.7, u, { color: C.violet, seed: 2, mood: dizzy ? 'dizzy' : u > tDeny ? 'stress' : 'focus', look: -1 });
  txt(g, '写', -ax, ay + (P ? 120 : 150), 32, C.dim, { weight: '900' }); txt(g, '审', ax, ay + (P ? 120 : 150), 32, C.dim, { weight: '900' });
  if (u > tDeny - 0.1) {
    const k = pop(u, tDeny, 0.3);
    chip(g, '互相否定', 0, P ? -230 : -260, 34, null, rgba(C.redRGB, 0.95), { alpha: k * (1 - ease(u, tLoop - 0.2, tLoop)), weight: '900' });
  }
  if (u < tDeny - 0.1 && c.has('redo')) chip(g, '反复修改', 0, P ? -230 : -260, 32, null, rgba(C.goldRGB, 0.95), { alpha: ease(u, tRedo, tRedo + 0.3), weight: '900' });
  stamp(g, '死循环', 0, P ? -230 : -260, P ? 64 : 72, C.red, u, tLoop, -0.08);
  if (dizzy) { g.save(); g.translate(0, ay); g.rotate(-ang * 0.5); txt(g, '∞', 0, 6, P ? 110 : 130, rgba(C.redRGB, 0.9), { family: F.grot, weight: '700' }); g.restore(); }
};

// —— 救火：这次扑灭了，下次照样冒烟 ——
SHOT.firefight = (g, c) => {
  const u = c.u, tFire = KT(c, 'fire', 0, 0.6), tAgain = KT(c, 'again', c.n > 1 ? 1 : 0, 2.0);
  const cols = P ? 3 : 4, rows = 2, tw = P ? 210 : 260, th = P ? 150 : 170;
  const tiles = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) tiles.push([(q - (cols - 1) / 2) * (tw + 20), (r - 0.5) * (th + 30) + (P ? 40 : 20)]);
  tiles.forEach(([x, y], i) => { panel(g, x - tw / 2, y - th / 2, tw, th, { fill: C.panel2, stroke: rgba(AGRGB[i % 5], 0.35), r: 14, shadow: false }); taskCard(g, x, y + 10, 0.9, AG[i % 5]); });
  // 着火的格子：先一个；扑灭；到“照样冒烟”时同一个格子又着了，再多几处
  const target = 1;
  const out1 = ease(u, tFire + 0.9, tFire + 1.4);
  const fires = [[target, 0, tFire + 0.9], [target, tAgain - 0.1, 1e9], [cols + 2, tAgain + 0.3, 1e9], [cols - 1 + (P ? 0 : 1), tAgain + 0.6, 1e9]];
  fires.forEach(([i, a, b]) => {
    const k = ease(u, a, a + 0.3) * (1 - ease(u, b, b + 0.5));
    if (k > 0.01) flame(g, tiles[i % tiles.length][0], tiles[i % tiles.length][1] - 10, (P ? 0.9 : 1) * k, u + i, { alpha: k });
  });
  // 人拿着灭火器冲过去喷
  const hx = lerp(P ? -300 : -560, tiles[target][0] - (P ? 150 : 170), ease(u, tFire - 0.4, tFire + 0.4));
  const hy = tiles[target][1] + 30;
  human(g, hx, hy, P ? 0.95 : 1.2, u, { sweat: true, mouth: 'open', arm: 0.6, look: 1 });
  extinguisher(g, hx + 50, hy + 10, P ? 0.9 : 1, -0.3);
  if (u > tFire + 0.3 && u < tFire + 1.5) for (let j = 0; j < 14; j++) {
    const k = ((u * 3 + j / 14) % 1), x = hx + 90 + k * (tiles[target][0] - hx - 90), y = hy - 20 + Math.sin(j * 3) * 20 * k;
    g.fillStyle = rgba(C.mistRGB, 0.6 * (1 - k)); g.beginPath(); g.arc(x, y, 8 + k * 16, 0, TAU); g.fill();
  }
  if (u > tAgain) bubble(g, tiles[target][0], tiles[target][1] - 120, pop(u, tAgain, 0.3), '又来了', { size: 30, fill: '#ffe2d6' });
  stamp(g, '救了又烧', 0, P ? -250 : -280, P ? 52 : 60, C.alarm, u, tAgain + 0.4, -0.05);
};

// —— 往提示词里加“以后请注意”：杠杆最低；长版：改参数 vs 改规则、改信息流 ——
SHOT.leverage = (g, c) => {
  const u = c.u;
  const prompt = c.has('note') || !c.has('rule');
  // 一条路上有块石头：Agent 一遍遍撞上去
  const rx = P ? 150 : 260, ry = P ? 200 : 220, rerouted = c.has('rule') ? ease(u, c.k('rule') + 0.2, c.k('rule') + 1.0) : 0;
  const path0 = [[P ? -380 : -720, ry], [P ? 380 : 720, ry]];
  const path1 = [[P ? -380 : -720, ry], [rx - 170, ry], [rx - 90, ry - 110], [rx + 90, ry - 110], [rx + 170, ry], [P ? 380 : 720, ry]];
  trail(g, path0, C.dimRGB, u, { w: 5, alpha: 0.35 * (1 - rerouted), flow: false });
  if (rerouted > 0) { trail(g, path1, C.greenRGB, u, { w: 6, k: rerouted }); icon(g, 'flag', rx - 170, ry - 50, 50, C.warm); }
  g.fillStyle = '#5b5262'; g.beginPath(); g.moveTo(rx - 80, ry + 30); g.lineTo(rx - 55, ry - 60); g.lineTo(rx + 10, ry - 90); g.lineTo(rx + 70, ry - 30); g.lineTo(rx + 80, ry + 30); g.closePath(); g.fill();
  for (let i = 0; i < 3; i++) {
    const per = 2.4, k = ((u + i * per / 3) % per) / per;
    let x, y, mood = 'focus';
    if (rerouted > 0.5) { [x, y] = pathAt(path1, k); mood = 'happy'; }
    else { x = lerp(path0[0][0], rx - 100, Math.min(1, k / 0.7)); y = ry; if (k > 0.7) { x = rx - 100 - (k - 0.7) * 300; mood = 'dizzy'; } }
    agent(g, x, y - 66, P ? 0.85 : 0.85, u, { color: AG[i], seed: i, mood });
    if (rerouted < 0.5 && k > 0.69 && k < 0.78) txt(g, '咚！', rx - 110, ry - 170, 40, C.red, { weight: '900' });
  }
  if (prompt) {
    // 提示词窗口：“以后请注意……”一条一条往上加
    const tN = c.k('note', 0.6);
    const pw = P ? 700 : 760, ph = P ? 300 : 340, px = P ? -pw / 2 : -pw / 2 - 200, py = P ? -300 : -330;
    panel(g, px, py, pw, ph, { fill: C.panel, stroke: C.outline ?? rgba(C.inkRGB, 0.3), lw: C.outline ? 3 : 3, r: 16 });
    txt(g, 'prompt.md', px + 24, py + 30, 22, C.dim, { family: F.mono, align: 'left', weight: '600' });
    const notes = ['以后请注意：先跑测试', '以后请注意：别改接口', '以后请注意：别互相否定', '以后请注意：做完要验证', '以后请注意：……', '以后请注意：……'];
    const shown = Math.floor(clamp((u - tN + 0.2) / 0.55, 0, notes.length));
    g.save(); rr(g, px, py + 52, pw, ph - 60, 12); g.clip();
    const scroll = Math.max(0, shown - 4) * 48;
    for (let i = 0; i < shown; i++) {
      const y = py + 90 + i * 48 - scroll;
      typeOn(g, notes[i], px + 30, y, P ? 30 : 32, i === shown - 1 ? C.key : C.ink, ramp(u, tN - 0.2 + i * 0.55, tN + 0.2 + i * 0.55), { align: 'left', weight: '800' });
    }
    g.restore();
    if (c.has('low')) stamp(g, '只管这一次', P ? 150 : 0, P ? -40 : -40, P ? 52 : 60, C.red, u, c.k('low'), -0.1);
  }
  if (c.has('rule') || (c.has('low') && !prompt)) {
    // 杠杆：短臂“改参数”压不动，长臂“改规则 · 改信息流”一压就起
    const tLow = c.k('low', 0.8), tRule = c.k('rule', 1e9);
    const lx = P ? 0 : 0, ly = P ? -110 : -150, L = P ? 360 : 520;
    const tilt = -0.06 + 0.04 * Math.sin(ramp(u, tLow, tLow + 0.6) * Math.PI * 3) * (1 - ease(u, tRule, tRule + 0.3)) + 0.22 * ease(u, tRule, tRule + 0.6);
    g.save(); g.translate(lx, ly);
    g.fillStyle = '#6a6070'; g.beginPath(); g.moveTo(-L * 0.25, 40); g.lineTo(-L * 0.25 - 30, 90); g.lineTo(-L * 0.25 + 30, 90); g.closePath(); g.fill();
    g.save(); g.translate(-L * 0.25, 40); g.rotate(tilt);
    g.fillStyle = '#c9b48a'; rr(g, -L * 0.35, -9, L * 1.05, 18, 9); g.fill();
    g.restore(); g.restore();
    chip(g, '改参数', lx - L * 0.5, ly + 120, 28, null, rgba(C.dimRGB, 0.95), { alpha: ease(u, tLow - 0.3, tLow), weight: '900' });
    if (u > tLow) txt(g, '杠杆最低', lx - L * 0.5, ly + 168, 26, C.red, { weight: '900', alpha: ease(u, tLow, tLow + 0.3) });
    chip(g, '改规则 · 改信息流', lx + L * 0.5, ly - 60, 28, null, rgba(C.greenRGB, 0.95), { alpha: ease(u, tRule - 0.2, tRule + 0.2), weight: '900' });
  }
  if (c.has('book')) cite(g, BOOKS.meadows, ease(u, c.k('book') - 0.6, c.k('book')), { x: P ? SW - 86 : SW - 120, rot: 0.05 });
};

// —— 三个追问：它为什么能反复发生？ ——
SHOT.why = (g, c) => {
  const u = c.u, tq = KT(c, 'q', 0, 0.5);
  const qs = [['q1', '完成条件', '清楚吗？', 'flag'], ['q2', '唯一的', '事实来源？', 'eye'], ['q3', '“满意”', '门槛？', 'test']];
  txt(g, '它为什么能反复发生？', 0, P ? -240 : -270, P ? 50 : 60, C.ink, { weight: '900', alpha: ease(u, tq - 0.3, tq + 0.1), stroke: 8 });
  qs.forEach(([k, a, b, ic], i) => {
    const t0 = c.k(k, c.line(i + 1) + 0.3), p = pop(u, t0, 0.4);
    if (p <= 0.01) return;
    const x = P ? 0 : (i - 1) * 500, y = P ? -110 + i * 135 : 40;
    const active = i === 2 ? u >= t0 : u < c.k(qs[i + 1][0], 1e9);
    g.save(); g.translate(x, y); g.scale(p, p); g.globalAlpha *= active ? 1 : 0.55;
    if (P) {
      panel(g, -330, -55, 660, 110, { fill: C.panel2, stroke: rgba(AGRGB[i], 0.8), r: 18 });
      icon(g, ic, -270, 0, 60, AG[i], u);
      txt(g, a + b, 10, 2, 40, C.ink, { weight: '900' });
    } else {
      panel(g, -210, -170, 420, 340, { fill: C.panel2, stroke: rgba(AGRGB[i], 0.8), r: 22 });
      icon(g, ic, 0, -80, 90, AG[i], u);
      txt(g, a, 0, 30, 46, C.ink, { weight: '900' }); txt(g, b, 0, 92, 46, C.ink, { weight: '900' });
    }
    g.restore();
  });
  // “满意”门槛：没有门槛时，审查器不停地吐出鸡毛蒜皮的意见
  const t3 = c.k('q3', 1e9);
  if (u > t3) for (let i = 0; i < 8; i++) {
    const k = ((u - t3) * 0.8 + i / 8) % 1, x = (P ? 230 : 500) + Math.sin(i * 2.3) * 60, y = (P ? 160 : 160) - k * 220;
    badge(g, x, y, 14, 'cross', rgba(C.redRGB, 0.8 * (1 - k)));
  }
};

// —— 改机制：架构问题改架构；测试能拦的让程序拦；交接出错就改交接 ——
SHOT.fixes = (g, c) => {
  const u = c.u;
  const rows = [['f1', '架构的问题', '改架构', 'gear'], ['f2', '测试能拦的', '让程序拦', 'test'], ['f3', '交接出错', '改交接', 'tag']];
  rows.forEach(([k, a, b, ic], i) => {
    const t0 = c.k(k, c.line(0) + 0.8 + i * 1.6), p = pop(u, 0.15 + i * 0.12, 0.4), ok = ease(u, t0 - 0.1, t0 + 0.25), fixP = pop(u, t0 - 0.1, 0.35);
    if (p <= 0.01) return;
    const x = P ? 0 : (i - 1) * 520, y = P ? -150 + i * 165 : -30;
    g.save(); g.translate(x, y); g.scale(p, p);
    if (P) {
      panel(g, -390, -66, 780, 132, { fill: C.panel2, stroke: rgba(ok > 0.5 ? C.greenRGB : C.dimRGB, 0.3 + 0.6 * ok), r: 20 });
      icon(g, ic, -325, 0, 64, AG[i], u);
      txt(g, a, -255, 0, 38, ok > 0.5 ? C.dim : C.ink, { align: 'left', weight: '800' });
      if (fixP > 0.01) {
        arrow(g, 20, 0, 80, 0, rgba(C.inkRGB, 0.6), 5, fixP, 14);
        g.save(); g.translate(110, 0); g.scale(fixP, fixP); txt(g, b, 0, 0, 46, C.green, { align: 'left', weight: '900' }); g.restore();
        badge(g, 340, 0, 30 * fixP);
      }
    } else {
      panel(g, -230, -200, 460, 400, { fill: C.panel2, stroke: rgba(ok > 0.5 ? C.greenRGB : C.dimRGB, 0.3 + 0.6 * ok), r: 22 });
      icon(g, ic, 0, -100, 90, AG[i], u);
      txt(g, a, 0, 10, 38, ok > 0.5 ? C.dim : C.ink, { weight: '800' });
      if (fixP > 0.01) {
        arrow(g, 0, 50, 0, 90, rgba(C.inkRGB, 0.6), 5, fixP, 14);
        g.save(); g.translate(0, 135); g.scale(fixP, fixP); txt(g, b, 0, 0, 50, C.green, { weight: '900' }); g.restore();
        badge(g, 170, -150, 32 * fixP);
      }
    }
    g.restore();
  });
  // 长版：把“以后请注意”划掉；系统级的纠偏
  if (c.has('note')) {
    const tN = c.k('note'), tP = c.k('patch', tN + 1.5);
    const k = pop(u, tN - 0.2, 0.35), y = P ? 230 : 250;
    if (k > 0.01) {
      g.save(); g.translate(0, y); g.scale(k, k); g.rotate(-0.03);
      g.fillStyle = '#f6e27a'; rr(g, -230, -40, 460, 80, 6); g.fill();
      txt(g, '以后请注意……', 0, 2, 38, '#3a2e10', { weight: '900' });
      g.restore();
      const sk = ease(u, tP, tP + 0.3);
      if (sk > 0) line(g, -240, y, -240 + 480 * sk, y, C.red, 9);
    }
  }
  if (c.has('fix')) slam(g, '系统级的纠偏', 0, P ? -270 : -290, P ? 56 : 64, C.gold, u, c.k('fix'), { stroke: 9 });
  else txt(g, '要改的，是机制', 0, P ? -275 : -300, P ? 46 : 54, C.gold, { weight: '900', alpha: ease(u, 0.1, 0.4), stroke: 8 });
};

// —— 好的技术负责人：不靠救火证明自己，而是让本可避免的问题越来越少 ——
SHOT.lead = (g, c) => {
  const u = c.u, tHero = KT(c, 'hero', 0, 1.0), tFew = KT(c, 'fewer', 1, 0.8);
  const lx = P ? 0 : -420, ly = P ? -130 : 0, rx = P ? 0 : 420, ry = P ? 150 : 0;
  // 左：救火英雄，身边一圈火
  const a1 = ease(u, 0.1, 0.4) * (1 - 0.55 * ease(u, tFew - 0.3, tFew));
  g.save(); g.globalAlpha *= a1;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + u; flame(g, lx + Math.cos(a) * 150, ly + Math.sin(a) * 60 + 20, 0.45, u + i); }
  human(g, lx, ly, P ? 0.7 : 0.9, u, { sweat: true, mouth: 'open', arm: 0.5 + 0.5 * Math.sin(u * 8) });
  chip(g, '每天解决最多的问题', lx, ly + (P ? 90 : 130), 26, null, rgba(C.alarmRGB, 0.9), { alpha: ease(u, tHero, tHero + 0.3), weight: '900' });
  g.restore();
  // 右：一条往下走的曲线——本可避免的问题越来越少
  const k = ease(u, tFew - 0.3, tFew + 1.2), gw = P ? 520 : 600, gh = P ? 170 : 300;
  g.save(); g.translate(rx - gw / 2, ry - gh / 2); g.globalAlpha *= ease(u, tFew - 0.6, tFew - 0.2);
  line(g, 0, gh, gw, gh, rgba(C.inkRGB, 0.5), 3); line(g, 0, 0, 0, gh, rgba(C.inkRGB, 0.5), 3);
  const pts = []; for (let i = 0; i <= 30; i++) { const x = i / 30; pts.push([x * gw, gh * (0.12 + 0.8 * (1 - Math.exp(-x * 2.6))) ]); }
  trail(g, pts, C.greenRGB, u, { k, w: 6 });
  txt(g, '本可避免的问题', 10, -26, 26, C.green, { align: 'left', weight: '900' });
  g.restore();
  if (u > tFew) human(g, rx + gw / 2 - 30, ry - gh / 2 - (P ? 30 : 60), P ? 0.55 : 0.7, u, { mug: true, look: -1, alpha: ease(u, tFew, tFew + 0.4) });
};
