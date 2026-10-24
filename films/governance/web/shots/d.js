// 镜头 D：让系统自己运作 —— 不照搬科层、要继承的骨架、注意力的三次拉远、巴纳德 1938 年的那句话、结尾（发光的组织）、片尾投票。

// —— 一张“活的组织”：节点是关口，路径上 Agent 自己流动（结尾、注意力的最远一层、片尾背景共用）——
const NET_N = [[-0.82, -0.15], [-0.48, -0.6], [-0.42, 0.38], [-0.02, -0.12], [0.08, 0.6], [0.42, -0.58], [0.5, 0.22], [0.86, -0.08]];
const NET_E = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 5], [3, 6], [2, 4], [4, 6], [5, 7], [6, 7], [1, 5]];
function netPts(sx, sy) {
  return NET_E.map(([a, b], i) => {
    const A = [NET_N[a][0] * sx, NET_N[a][1] * sy], B = [NET_N[b][0] * sx, NET_N[b][1] * sy];
    const m = [(A[0] + B[0]) / 2 + Math.sin(i * 2.1) * 40, (A[1] + B[1]) / 2 + Math.cos(i * 1.3) * 40];
    const pts = []; for (let q = 0; q <= 12; q++) pts.push(qpt(A, m, B, q / 12));
    return pts;
  });
}
// o: { k 画出比例, density 每条路上的 Agent 数, scale, alpha, hole: 空出中心（放别的东西）}
function network(g, u, o = {}) {
  const sx = o.sx ?? SW * 0.95, sy = o.sy ?? SH * 0.82, k = o.k ?? 1, a = o.alpha ?? 1;
  const paths = netPts(sx, sy);
  g.save(); g.globalAlpha *= a;
  paths.forEach((pts, i) => trail(g, pts, i % 3 === 0 ? C.bossRGB : AGRGB[i % 5], u, { k, w: 4, alpha: 0.55, speed: 40 }));
  NET_N.forEach(([x, y], i) => {
    const px = x * sx, py = y * sy;
    if (o.hole && Math.hypot(px, py) < o.hole) return;
    glow(g, px, py, 50, C.greenRGB, 0.35 * k);
    g.strokeStyle = rgba(C.greenRGB, 0.9); g.lineWidth = 4; g.beginPath(); g.arc(px, py, 16, 0, TAU); g.stroke();
    if (k > 0.8) { g.fillStyle = rgba(C.greenRGB, 0.9); g.beginPath(); g.arc(px, py, 6, 0, TAU); g.fill(); }
  });
  const n = o.density ?? 2;
  if (k > 0.6) paths.forEach((pts, i) => {
    for (let j = 0; j < n; j++) {
      const q = ((u * (0.08 + rand(i, j) * 0.06) + j / n + rand(i, 7)) % 1);
      const [x, y] = pathAt(pts, q);
      if (o.hole && Math.hypot(x, y) < o.hole) continue;
      agent(g, x, y - 18 * (o.scale ?? 0.4), o.scale ?? 0.4, u, { color: AG[(i + j) % 5], seed: i * 3 + j, mood: 'happy', still: true });
    }
  });
  g.restore();
}
function northStar(g, x, y, s, u, a = 1) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha *= a;
  glow(g, x, y, 160 * s, C.goldRGB, 0.6);
  g.translate(x, y); g.rotate(Math.sin(u * 0.5) * 0.05);
  g.fillStyle = C.dark ? '#fff3c4' : C.gold;
  g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 10 * s : 46 * s, an = -Math.PI / 2 + (i * Math.PI) / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill();
  if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = 3; g.stroke(); }
  g.restore();
}

// —— 不照搬科层：层层汇报、开会 → 一个 Agent 能做完就别组团队；能直接对齐就别绕几层 ——
SHOT.noorg = (g, c) => {
  const u = c.u, tL = KT(c, 'layers', 1, 1.0), tSolo = KT(c, 'solo', 2, 0.6), tDirect = c.k('direct', tSolo + 1.6), tLess = KT(c, 'less', 3, 0.6);
  const out = ease(u, tSolo - 0.3, tSolo + 0.3);
  // 一座科层金字塔：一层一层的小经理，汇报箭头往上，会议气泡
  if (out < 1) {
    g.save(); g.globalAlpha *= 1 - out;
    const rows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]], dy = P ? 120 : 130, dx = P ? 110 : 150;
    rows.forEach((r, i) => r.forEach((q) => {
      const x = q * dx, y = -200 + i * dy + (P ? 20 : 0);
      if (i) line(g, x, y - 40, x * 0.6, y - dy + 30, rgba(C.dimRGB, 0.5), 3);
      agent(g, x, y, i < 3 ? 0.5 : 0.55, u, { color: i < 3 ? C.gold : AG[(q + 3) % 5], crown: i === 0, seed: i * 5 + q, mood: i === 3 ? 'stress' : 'focus', still: true });
    }));
    for (let i = 0; i < 4; i++) { const k = ((u * 0.5 + i / 4) % 1); g.fillStyle = rgba(C.coralRGB, 0.9 * (1 - k)); rr(g, (i - 1.5) * dx * 1.6 - 14, 200 - k * 380 - 10, 28, 20, 4); g.fill(); }
    ['开会', '汇报', '对齐会'].forEach((s, i) => bubble(g, (i - 1) * (P ? 230 : 380), -250 + (i % 2) * 40, 0.75 * pop(u, 0.4 + i * 0.3, 0.3), s, { size: 26 }));
    stamp(g, '不照搬', 0, 0, P ? 80 : 96, C.red, u, tL, -0.1);
    g.restore();
  }
  // 一个 Agent 自己做完；两个 Agent 直接对齐，不绕经理
  if (out > 0.01) {
    g.save(); g.globalAlpha *= out * (1 - 0.6 * ease(u, tLess - 0.2, tLess + 0.3));
    const ax = P ? -170 : -420, ay = P ? -110 : 0;
    agent(g, ax, ay, 0.95, u, { color: C.teal, seed: 3, mood: 'happy' });
    taskCard(g, ax + (P ? 130 : 140), ay + 10, 1.0, C.teal, { check: u > tSolo + 0.6 });
    chip(g, '一个就够', ax + 50, ay - (P ? 110 : 120), 28, null, rgba(C.greenRGB, 0.95), { weight: '900' });
    const bx = P ? 0 : 380, by = P ? 170 : 0, k = ease(u, tDirect - 0.2, tDirect + 0.4);
    agent(g, bx - 150, by, 0.8, u, { color: C.violet, seed: 4, mood: 'focus', look: 1 });
    agent(g, bx + 150, by, 0.8, u, { color: C.coral, seed: 5, mood: 'focus', look: -1 });
    agent(g, bx, by - 150, 0.6, u, { color: C.boss, crown: true, seed: 6, mood: 'sleep', alpha: 1 - 0.6 * k });
    line(g, bx - 150, by - 140 + 0, bx, by - 190, rgba(C.dimRGB, 0.4 * (1 - k)), 3, [6, 8]); line(g, bx, by - 190, bx + 150, by - 140, rgba(C.dimRGB, 0.4 * (1 - k)), 3, [6, 8]);
    if (k > 0.01) { trail(g, [[bx - 90, by], [bx + 90, by]], C.greenRGB, u, { k, w: 6 }); chip(g, '直接对齐', bx, by + 90, 26, null, rgba(C.greenRGB, 0.95), { alpha: k, weight: '900' }); }
    g.restore();
  }
  if (u > tLess - 0.3) {
    const k = ease(u, tLess - 0.2, tLess + 0.3);
    txt(g, '管理的目的', 0, P ? -60 : -70, P ? 50 : 60, C.ink, { weight: '900', alpha: k, stroke: 9 });
    slam(g, '不是制造更多管理', 0, P ? 30 : 40, P ? 62 : 80, C.gold, u, tLess + 0.3, { stroke: 10 });
  }
};

// —— 要继承的骨架：目标、责任、授权、可验证的交付、跑偏时的反馈；再加三根支撑 ——
SHOT.skeleton = (g, c) => {
  const u = c.u;
  const bones = [['b1', '明确的目标'], ['b2', '清晰的责任'], ['b3', '合理的授权'], ['b4', '可验证的交付'], ['b5', '跑偏时的反馈']];
  const props = [['s1', '可靠的事实来源', 'eye'], ['s2', '明确的权限边界', 'lock'], ['s3', '出了异常能介入、能恢复', 'flag']];
  const sx = P ? -150 : -360, y0 = P ? -230 : -250, step = P ? 92 : 110;
  // 脊柱
  const tFirst = c.k('b1', 0.5);
  line(g, sx, y0 - 20, sx, y0 + step * 4 + 20, rgba(C.inkRGB, (C.dark ? 0.25 : 0.7) * ease(u, 0, 0.4)), 8);
  bones.forEach(([k, s], i) => {
    const t0 = c.k(k, tFirst + i * 0.7), p = pop(u, t0 - 0.1, 0.35), y = y0 + i * step;
    if (p <= 0.01) return;
    g.save(); g.translate(sx, y); g.scale(p, p);
    glow(g, 0, 0, 60, C.goldRGB, 0.4);
    rr(g, -46, -24, 92, 48, 18); g.fillStyle = C.dark ? '#efe0bd' : C.boss; g.fill();
    if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = 4; g.stroke(); }
    g.restore();
    txt(g, s, sx + 80, y, P ? 38 : 42, C.ink, { align: 'left', weight: '900', alpha: p, stroke: 6 });
  });
  // 三根支撑：系统越自主越需要
  props.forEach(([k, s, ic], i) => {
    const t0 = c.k(k, 1e9), p = pop(u, t0 - 0.1, 0.4);
    if (p <= 0.01) return;
    const x = P ? -80 + i * 0 : 520, y = P ? 260 + i * 0 : -160 + i * 160;
    if (P) {
      chip(g, s, 0, 250 + (i - 1) * 0, 28, null, rgba(C.greenRGB, 0.95), { alpha: p * (i === props.filter(([kk]) => u >= c.k(kk, 1e9) - 0.1).length - 1 ? 1 : 0), weight: '900' });
    } else {
      g.save(); g.translate(x, y); g.scale(p, p);
      panel(g, -200, -56, 400, 112, { fill: C.panel2, stroke: rgba(C.greenRGB, 0.8), r: 18 });
      icon(g, ic, -150, 0, 56, C.green, u);
      txt(g, s, 20, 0, s.length > 8 ? 26 : 30, C.ink, { weight: '900', maxW: 300 });
      g.restore();
    }
  });
  txt(g, '要继承的，是骨架', P ? 0 : -360, P ? -285 : -320, P ? 34 : 40, C.gold, { weight: '900', alpha: ease(u, 0.1, 0.4) * (P ? 1 - ease(u, c.k('s1', 1e9) - 0.3, c.k('s1', 1e9)) : 1) });
};

// —— 注意力的三次拉远：一段代码 → 一项任务 → 我不在时也一直做对的系统 ——
SHOT.attention = (g, c) => {
  const u = c.u, t1 = KT(c, 'a1', 0, 0.5), t2 = KT(c, 'a2', 0, 2.2), t3 = KT(c, 'a3', 1, 0.6);
  // 相机缩放：1 → 1/4 → 1/16（按对数插值，拉远的速度看起来均匀）
  const e1 = inOutCubic(ramp(u, t2 - 0.5, t2 + 0.4)), e2 = inOutCubic(ramp(u, t3 - 0.6, t3 + 0.6));
  const lz = -Math.log(4) * e1 - Math.log(4) * e2, Zm = Math.exp(lz);
  // 最远一层：系统（中心留空给任务卡）
  if (Zm < 0.6) {
    g.save(); g.scale(Zm * 16, Zm * 16); // 在 Zm = 1/16 时是原尺寸
    network(g, u, { alpha: clamp(1 - (Zm - 0.0625) / 0.12), hole: 70, density: 2 });
    g.restore();
  }
  // 中间一层：任务卡（在 Zm = 1/4 时是原尺寸）
  const cardS = Zm * 4;
  if (cardS < 8) {
    g.save(); g.scale(cardS, cardS);
    g.globalAlpha *= clamp(2 - cardS / 2);
    panel(g, -150, -95, 300, 190, { fill: C.panel2, stroke: rgba(C.warmRGB, 0.9), lw: 4 / cardS + 2, r: 18, shadow: false });
    g.fillStyle = C.warm; rr(g, -150, -95, 14, 190, 7); g.fill();
    txt(g, '任务', -120, -66, 24, C.warm, { align: 'left', weight: '900', alpha: clamp(1.6 - cardS / 2) });
    if (u > t2 + 0.3) { g.strokeStyle = C.green; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(70, 40); g.lineTo(95, 66); g.lineTo(135, 10); g.stroke(); }
    g.restore();
  }
  // 最近一层：一段代码（在 Zm = 1 时是原尺寸），坐在任务卡里
  const codeS = Zm;
  if (codeS > 0.02) {
    g.save(); g.scale(codeS, codeS);
    g.globalAlpha *= clamp(codeS * 3);
    panel(g, -330, -80, 660, 160, { fill: '#0f0d14', stroke: rgba(C.inkRGB, 0.3), r: 16, shadow: false });
    txt(g, 'return total + tax', -290, 0, 44, C.teal, { family: F.mono, align: 'left', weight: '700' });
    if (u > t1 + 0.4) badge(g, 270, 0, 34 * pop(u, t1 + 0.4, 0.3));
    g.restore();
  }
  // 人：最后一层时站在系统外面
  if (e2 > 0.3) human(g, P ? -300 : -700, P ? 220 : 230, P ? 0.7 : 0.8, u, { mug: true, look: 1, alpha: ease(e2, 0.3, 0.8) });
  // 标签：从前 / 后来 / 现在
  const labs = [['从前', '代码写没写对', t1], ['后来', '任务交没交付', t2], ['现在', '我不在时，系统能不能一直做对', t3]];
  const cur = u >= t3 - 0.2 ? 2 : u >= t2 - 0.2 ? 1 : 0;
  const [a, b] = labs[cur];
  const k = ease(u, labs[cur][2] - 0.25, labs[cur][2] + 0.15);
  chip(g, a, P ? 0 : -560, P ? -258 : -300, 30, null, cur === 2 ? C.gold : C.ink, { alpha: k, weight: '900' });
  txt(g, b, P ? 0 : -480, P ? -200 : -300, P ? (cur === 2 ? 36 : 44) : 46, cur === 2 ? C.gold : C.ink, { align: P ? 'center' : 'left', weight: '900', alpha: k, stroke: 8, maxW: P ? 800 : 1100 });
  if (c.has('shift')) txt(g, '注意力，变了', 0, 0, P ? 72 : 90, C.ink, { weight: '900', alpha: win(u, c.k('shift') - 0.3, t1 - 0.1), stroke: 10 });
};

// —— 巴纳德 1938：组织是有意识地协调起来的活动或力量的系统；规定组织的目的 ——
SHOT.purpose = (g, c) => {
  const u = c.u, tQ = KT(c, 'quote', 1, 0.3), tP = KT(c, 'purpose', 2, 0.6), tK = c.k('keep', tP + 2.5);
  const up = ease(u, tP - 0.3, tP + 0.8);
  g.save(); g.translate(0, up * (P ? 70 : 90)); g.scale(1 - 0.3 * up, 1 - 0.3 * up);
  // 摊开的书
  const bw = P ? 380 : 520, bh = P ? 420 : 470;
  glow(g, 0, 0, bw * 1.3, C.warmRGB, 0.3);
  g.fillStyle = C.shadow; rr(g, -bw - 10, -bh / 2 + 16, bw * 2 + 20, bh, 10); g.fill();
  for (const s of [-1, 1]) {
    g.save(); g.scale(s, 1);
    g.fillStyle = '#efe4cc'; g.beginPath(); g.moveTo(0, -bh / 2 + 10); g.quadraticCurveTo(bw * 0.5, -bh / 2 - 8, bw, -bh / 2); g.lineTo(bw, bh / 2); g.quadraticCurveTo(bw * 0.5, bh / 2 - 14, 0, bh / 2 - 4); g.closePath(); g.fill();
    const sh = g.createLinearGradient(0, 0, bw * 0.25, 0); sh.addColorStop(0, 'rgba(80,60,30,0.3)'); sh.addColorStop(1, 'rgba(80,60,30,0)'); g.fillStyle = sh; g.fillRect(0, -bh / 2, bw * 0.25, bh);
    g.restore();
  }
  // 左页：书名、作者、年份；右页：那句话
  const ink = '#3a2c1c';
  txt(g, '经理人员的职能', -bw / 2, -bh / 2 + 70, P ? 34 : 44, ink, { family: F.serif, weight: '900' });
  txt(g, 'The Functions of the Executive', -bw / 2, -bh / 2 + 120, P ? 18 : 22, ink, { family: F.grot, weight: '500', alpha: 0.8 });
  txt(g, '切斯特·巴纳德', -bw / 2, 0, P ? 30 : 36, ink, { family: F.serif, weight: '700' });
  txt(g, 'Chester I. Barnard', -bw / 2, 44, P ? 18 : 22, ink, { family: F.grot, weight: '500', alpha: 0.8 });
  slam(g, '1938', -bw / 2, bh / 2 - 90, P ? 64 : 84, '#8a4b1c', u, 0.25, { family: F.grot, weight: '700', glow: false, ring: false });
  const q = ['组织不是一群人，', '而是两个或更多人', '有意识地协调起来的', '活动或力量的系统。'];
  q.forEach((s, i) => typeOn(g, s, bw / 2, -bh / 2 + 90 + i * (P ? 62 : 74), P ? 30 : 38, ink, ramp(u, tQ - 0.4 + i * 0.6, tQ + 0.2 + i * 0.6), { family: F.serif, weight: '700' }));
  txt(g, '“a system of consciously coordinated', bw / 2, bh / 2 - 92, P ? 15 : 19, ink, { family: F.grot, weight: '500', alpha: 0.75 * ease(u, tQ + 2, tQ + 2.5) });
  txt(g, 'activities or forces of two or more persons”', bw / 2, bh / 2 - 64, P ? 15 : 19, ink, { family: F.grot, weight: '500', alpha: 0.75 * ease(u, tQ + 2, tQ + 2.5) });
  g.restore();
  // 北极星：规定组织的目的
  northStar(g, 0, P ? -190 : -220, P ? 1.1 : 1.3, u, ease(u, tP - 0.2, tP + 0.5));
  if (u > tP) chip(g, '规定组织的目的', 0, P ? -105 : -120, P ? 32 : 36, null, rgba(C.goldRGB, 0.95), { alpha: ease(u, tP, tP + 0.3), weight: '900' });
  if (u > tK - 0.2) txt(g, '最不能交出去的一项', 0, P ? 285 : 335, P ? 40 : 46, C.gold, { weight: '900', alpha: ease(u, tK, tK + 0.4), stroke: 8 });
};

// —— 结尾：一个发光的组织自己运转；人站在边上，看着北极星 ——
SHOT.finale = (g, c) => {
  const u = c.u;
  const tH = KT(c, 'hundred', 0, 1.0), tN = c.k('never', tH + 2.2), tC = c.k('create', tN + 2.0), tY = c.k('you', tC + 2.4);
  const tOrg = c.k('org', 1e9), tCode = c.k('code', 1e9), tAg = c.k('agents', 1e9), tSelf = c.k('self', 1e9);
  const grow = c.has('code') ? ease(u, tCode, tAg + 0.8) : ease(u, 0, 0.8);
  // 背景：活的组织
  network(g, u, { k: 0.3 + 0.7 * grow, density: u > tH ? 3 : 2, alpha: 1 - 0.35 * ease(u, tY - 0.3, tY + 0.3) });
  // 长版开头：模块方块（组织代码）
  if (c.has('code')) {
    const a = 1 - ease(u, tAg - 0.2, tAg + 0.6);
    if (a > 0.01) NET_N.forEach(([x, y], i) => panel(g, x * SW * 0.92 - 50, y * SH * 0.78 - 30, 100, 60, { fill: C.panel2, stroke: rgba(AGRGB[i % 5], 0.8), r: 10, alpha: a * pop(u, tCode + i * 0.08, 0.3) }));
  }
  // 几百个：指挥的线从人连向一大群 Agent；不再需要：线一根根断掉，它们照样走
  const hx = P ? -310 : -720, hy = P ? 215 : 240;
  const cmd = ease(u, tH - 0.2, tH + 0.5) * (1 - ease(u, tN, tN + 0.9));
  if (cmd > 0.01) {
    for (let i = 0; i < 36; i++) {
      const x = (rand(i, 3) - 0.3) * SW * 1.6, y = (rand(i, 4) - 0.5) * SH * 1.5;
      line(g, hx + 30, hy - 40, x, y, rgba(C.warmRGB, 0.35 * cmd), 2);
      agent(g, x, y, 0.28, u, { color: AG[i % 5], seed: i, mood: 'focus', still: true, alpha: cmd });
    }
    txt(g, '几百个 AI', P ? 120 : 200, P ? -250 : -280, P ? 56 : 66, C.warm, { weight: '900', alpha: cmd * (1 - ease(u, tN - 0.15, tN + 0.1)), stroke: 9 });
  }
  const free = ease(u, tN, tN + 0.9);
  if (free > 0.01) slam(g, '不再需要指挥它们', 0, P ? -250 : -280, P ? 58 : 72, C.ink, u, tN + 0.1, { stroke: 10, rgb: C.warmRGB });
  // 北极星：想清楚要创造什么
  const star = c.has('code') ? Math.max(ease(u, tOrg - 0.5, tOrg + 0.5) * 0.6, ease(u, tC - 0.3, tC + 0.5)) : ease(u, tC - 0.3, tC + 0.5);
  northStar(g, P ? 170 : 420, P ? -170 : -220, (P ? 1.0 : 1.2) * (1 + 0.4 * ease(u, tC, tC + 0.6)), u, Math.max(0.25, star));
  if (u > tC) txt(g, '我们到底要创造什么', P ? 0 : 240, P ? 250 : 290, P ? 46 : 54, C.gold, { weight: '900', alpha: ease(u, tC, tC + 0.4) * (1 - ease(u, tY - 0.2, tY + 0.2)), stroke: 9 });
  // 人：站在边上，先指挥，后放手，最后抬头看星
  human(g, hx, hy, P ? 0.95 : 1.2, u, { arm: cmd > 0.3 ? 0.9 : 0, mug: free > 0.6 && u < tC, look: u > tC ? 0.8 : 0.3, glow: 1.3 });
  if (c.has('org') && u > tOrg - 0.2 && u < tH - 0.3) slam(g, '治理一个组织', 0, P ? -250 : -280, P ? 64 : 80, C.gold, u, tOrg, { stroke: 10 });
  if (c.has('self') && u > tSelf - 0.2 && u < (c.has('org') ? tOrg - 0.3 : 1e9)) txt(g, '让它们自己运作', 0, P ? -250 : -280, P ? 52 : 64, C.ink, { weight: '900', alpha: ease(u, tSelf, tSelf + 0.3), stroke: 9 });
  if (u > tY - 0.2) slam(g, '你呢？', 0, P ? 0 : 0, P ? 96 : 120, C.ink, u, tY, { stroke: 12, rgb: C.warmRGB });
};

// —— 片尾：投票 ——
SHOT.endcard = (g, c) => {
  const u = c.u;
  network(g, u, { alpha: 0.25, density: 1 });
  dim(g, 0.35);
  const [q, cta] = TL.cta;
  txt(g, q, 0, P ? -250 : -290, P ? 52 : 64, C.ink, { weight: '900', stroke: 9, alpha: ease(u, 0.0, 0.3) });
  const opts = TL.txt.poll;
  opts.forEach(([n, s], i) => {
    const p = pop(u, 0.25 + i * 0.12, 0.35);
    if (p <= 0.01) return;
    const x = P ? 0 : (i % 2 ? 330 : -330), y = P ? -140 + i * 100 : -120 + Math.floor(i / 2) * 130;
    g.save(); g.translate(x, y); g.scale(p, p);
    panel(g, P ? -340 : -300, -40, P ? 680 : 600, 80, { fill: C.panel2, stroke: rgba(i === 2 ? C.goldRGB : C.inkRGB, i === 2 ? 0.9 : 0.3), r: 40, shadow: false });
    g.fillStyle = i === 2 ? C.gold : C.chipBg; g.beginPath(); g.arc(P ? -290 : -250, 0, 28, 0, TAU); g.fill();
    txt(g, n, P ? -290 : -250, 2, 34, fgOn(i === 2 ? C.gold : C.chipBg), { family: F.grot, weight: '700' });
    txt(g, s, P ? -235 : -195, 2, 38, C.ink, { align: 'left', weight: '900' });
    g.restore();
  });
  chip(g, cta, 0, P ? 280 : 200, P ? 36 : 40, null, rgba(C.warmRGB, 0.95), { alpha: ease(u, 0.9, 1.2), weight: '900' });
  txt(g, TL.txt.sign, 0, P ? 360 : 300, 26, C.dim, { family: F.grot, weight: '700', spacing: '6px', alpha: ease(u, 1.1, 1.4) });
};
