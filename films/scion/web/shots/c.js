// 镜头 C：人和以后 —— 新模型从头写一遍、对 Claude 说“不”、超级粉丝、合并队列、对其他人意味着什么、瓶颈搬家、片尾投票。

// 代码卡片：几行代码条（不是真代码，只是示意）
function codeCard(g, x, y, w, h, title, col, n, seed, o = {}) {
  panel(g, x - w / 2, y - h / 2, w, h, { r: 20, fill: o.fill ?? C.panel, stroke: col, lw: 3 });
  txt(g, title, x - w / 2 + 24, y - h / 2 + 34, 26, col, { align: 'left', weight: '900', maxW: w - 48 });
  for (let i = 0; i < n; i++) {
    const lw = (0.3 + rand(i, seed) * 0.6) * (w - 80), indent = (rand(i, seed + 1) > 0.6 ? 30 : 0) + (rand(i, seed + 2) > 0.85 ? 30 : 0);
    g.fillStyle = i % 4 === 0 ? rgba(hex(col), 0.8) : 'rgba(200,210,240,0.35)';
    rr(g, x - w / 2 + 24 + indent, y - h / 2 + 70 + i * 22, lw - indent, 10, 5); g.fill();
  }
}

// 新模型从头写一遍：内存省 20 倍，快 4 倍
SHOT.rewrite = (g, c) => {
  const u = c.u, aS = c.k('solve'), aG = c.k('give', c.line(1)), a20 = c.k('m20', c.line(2) + 0.3), a4 = c.k('s4', c.line(2) + 1.5);
  tint(g, C.clayRGB, 0.45);
  const loop = c.has('solve');
  const tB = loop ? c.line(1) - 0.2 : -1, tC = a20 - 0.6;
  // A：AI 惹的麻烦，AI 收拾（短版）
  if (loop && u < tB + 0.3) {
    const k = 1 - ease(u, tB, tB + 0.3);
    g.save(); g.globalAlpha = k;
    const r = P ? 200 : 230;
    g.save(); g.rotate(u * 1.5); g.lineWidth = 10; g.strokeStyle = rgba(C.inkRGB, 0.25); g.setLineDash([30, 24]); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.restore();
    arrow(g, -r * 0.7, -r * 0.72, r * 0.7, -r * 0.72, C.red, 7, 1, 22);
    arrow(g, r * 0.7, r * 0.72, -r * 0.7, r * 0.72, C.mint, 7, 1, 22);
    bot(g, -r, 0, 1.0, u, { seed: 1, carry: C.red, mood: 'focus' });
    bot(g, r, 0, 1.0, u, { seed: 2, mood: 'happy', glow: 1 });
    chip(g, T(['AI 惹的麻烦', 'caused it']), 0, -r - 50, 32, C.ink, '#3a2030', { stroke: C.red, weight: '900' });
    if (u > aS) slam(g, T(['AI 收拾', 'fixed it']), 0, r + 50, 54, C.mint, u, aS, { rgb: C.mintRGB, family: FT(), weight: '900' });
    g.restore();
  }
  // B：手写原型 → 新模型 → 从头写一遍
  if (u > tB && u < tC + 0.4) {
    const k = ease(u, tB, tB + 0.3) * (1 - ease(u, tC, tC + 0.4));
    g.save(); g.globalAlpha = k;
    const L = P ? [0, -170] : [-520, 0], R = P ? [0, 190] : [520, 0], w = P ? 520 : 440, h = P ? 200 : 300;
    codeCard(g, L[0], L[1], w, h, T(TL.txt.handwritten), C.dim, P ? 5 : 9, 3);
    const kg = ease(u, aG - 0.3, aG + 0.6);
    const mx = P ? 270 : 0, my = P ? 10 : -20;
    bot(g, mx, my + 20, P ? 0.9 : 1.2, u, { seed: 5, glow: kg, mood: kg > 0.5 ? 'focus' : 'ok' });
    txt(g, T(TL.txt.model), P ? 150 : 0, P ? 100 : 150, P ? 20 : 22, C.dim, { weight: '700', maxW: P ? 520 : 420 });
    if (kg > 0) bubble(g, P ? -40 : 0, P ? my - 10 : -170, T(TL.txt.prompt), '#2a1206', C.clay, 32);
    if (u > aG + 0.5) { const kr = ease(u, aG + 0.5, aG + 1.3); g.save(); g.globalAlpha *= kr; codeCard(g, R[0], R[1], w, h, T(TL.txt.rewritten), C.mint, Math.round((P ? 5 : 9) * kr), 7, { fill: '#0f2a2a' }); g.restore(); }
    g.restore();
  }
  // C：指标
  if (u > tC) {
    const k = ease(u, tC, tC + 0.3), w = P ? 600 : 900;
    g.save(); g.globalAlpha = k;
    const rows = [[T(TL.txt.memory), a20, 1, 1 / 20, '20×', C.redRGB], [T(TL.txt.speed), a4, 0.25, 1, '4×', C.mintRGB]];
    rows.forEach(([lab, a, from, to, big, rgb], i) => {
      const y = (P ? -170 : -150) + i * (P ? 230 : 210), kk = ease(u, a, a + 0.6);
      txt(g, lab, -w / 2, y - 50, 34, C.ink, { align: 'left', weight: '900' });
      g.fillStyle = 'rgba(255,255,255,0.08)'; rr(g, -w / 2, y - 20, w, 44, 12); g.fill();
      g.fillStyle = kk > 0.5 ? C.mint : rgba(rgb, 1); rr(g, -w / 2, y - 20, Math.max(10, w * lerp(from, to, kk)), 44, 12); g.fill();
      if (u > a) slam(g, big, w / 2 - (P ? 60 : 80), y - 70, P ? 92 : 110, C.gold, u, a, {});
    });
    if (c.cut === 'long' && u > a4 + 0.9) chip(g, T(TL.txt.invariants) + ' ✓', 0, P ? 250 : 280, 32, '#06251b', C.mint, { weight: '900', alpha: ease(u, a4 + 0.9, a4 + 1.2) });
    g.restore();
  }
};

// 对 Claude 说“不”：它要往可信的内部服务上加一堆校验，工程师说不
SHOT.no = (g, c) => {
  const u = c.u, aB = c.k('better'), aN = c.k('no', c.line(0) + 1.8), aP = c.k('pile'), aNo2 = c.k('nope'), aI = c.has('intent') ? c.line(3) + 0.7 : 1e9; // 意图那句一开口就换画面，不等句尾的关键词
  tint(g, C.redRGB, 0.25 + 0.4 * ease(u, aN, aN + 0.3) * (1 - ease(u, aN + 1.5, aN + 2.5)));
  const hx = P ? -230 : -470, bx = P ? 190 : 330, gy = P ? 160 : 170;
  const fadeMain = 1 - ease(u, aI - 0.4, aI);
  g.save(); g.globalAlpha = fadeMain;
  person(g, hx, gy, P ? 1.3 : 1.5, u, { seed: 2, shirt: C.blue, mouth: u > aN - 0.1 && u < aN + 0.8 ? 'open' : null, look: 1 });
  if (c.has('better') && u < aN - 0.2) {
    const k = pop(u, aB - 0.2);
    g.save(); g.translate(hx + (P ? 90 : 160), gy - 210); g.scale(k, k); bubble(g, 0, 0, T(TL.txt.better), '#141a33', C.ink, P ? 28 : 34); g.restore();
    txt(g, T(TL.txt.everyone), hx, gy + 130, 26, C.dim, { weight: '700', alpha: k });
  }
  // 校验块越堆越高；被“不”推倒。长版第二次（假想的风险）又堆起来，再被推倒
  const svc = c.cut === 'long';
  const baseY = gy + 40;
  if (svc) { panel(g, bx - 110, baseY - 10, 220, 70, { r: 14, fill: '#0f2a2a', stroke: C.mint }); txt(g, T(['内部服务 ✓', 'internal service ✓']), bx, baseY + 25, 26, C.mint, { weight: '900' }); }
  const stackStart = svc ? baseY - 10 : baseY + 40;
  const second = c.has('pile') && u > aP - 0.6;
  const count = second ? Math.floor(7 * ease(u, aP - 0.6, aP + 0.6)) : Math.floor(7 * ease(u, -0.2, Math.min(aN - 0.2, 3)));
  const fall = second ? (c.has('nope') ? ease(u, aNo2, aNo2 + 0.9) : 0) : ease(u, aN, aN + 0.9);
  for (let i = 0; i < count; i++) {
    const y = stackStart - 30 - i * 54;
    const dx = fall * (120 + i * 60) * (i % 2 ? 1 : 1.2), dy = fall * fall * (300 + i * 40), rot = fall * (i % 2 ? 1.2 : -0.9);
    g.save(); g.translate(bx + (rand(i, 2) - 0.5) * 20 + dx, y + dy); g.rotate(rot); g.globalAlpha *= 1 - ease(fall, 0.6, 1);
    rr(g, -80, -24, 160, 48, 10); g.fillStyle = i % 2 ? '#c0475a' : '#e05a6e'; g.fill();
    txt(g, svc ? T(TL.txt.validation) : T(TL.txt.overEng), 0, 2, 22, C.ink, { weight: '900', maxW: 140 });
    g.restore();
  }
  bot(g, bx + (P ? 150 : 180), gy + 20, 0.9, u, { seed: 9, look: -1, mood: fall > 0.3 ? 'stress' : 'focus' });
  g.restore();
  // “不”
  if (u > aN - 0.05 && u < aN + 2.2 && fadeMain > 0) stamp(g, T(TL.txt.no), 0, P ? -130 : -150, P ? 170 : 190, C.red, C.redRGB, u, aN, -0.12);
  if (c.has('nope') && u > aNo2 - 0.05 && fadeMain > 0) stamp(g, T(['不行', 'NO']), 0, P ? -130 : -150, P ? 150 : 170, C.red, C.redRGB, u, aNo2, 0.1);
  // 看意图，不逐行看
  if (u > aI - 0.4) {
    const k = ease(u, aI - 0.4, aI);
    g.save(); g.globalAlpha = k;
    codeCard(g, P ? 0 : -160, 0, P ? 560 : 640, P ? 360 : 420, T(['改动 #30412', 'change #30412']), C.dim, P ? 11 : 13, 11);
    const mx = (P ? 60 : -60) + Math.sin(u * 1.5) * 30;
    g.save(); g.translate(mx, -40); g.lineWidth = 12; g.strokeStyle = C.gold; g.beginPath(); g.arc(0, 0, 90, 0, TAU); g.stroke(); line(g, 64, 64, 140, 140, C.gold, 18);
    g.fillStyle = 'rgba(255,209,102,0.12)'; g.beginPath(); g.arc(0, 0, 84, 0, TAU); g.fill(); g.restore();
    chip(g, T(['意图：这次改动为了什么', 'intent: what is this change for?']), P ? 0 : 480, P ? 230 : -60, 28, '#2a2006', C.gold, { weight: '900' });
    g.restore();
    slam(g, T(TL.txt.intent), P ? 0 : 480, P ? -250 : 120, P ? 44 : 48, C.ink, u, aI, { family: FT(), weight: '900', ring: false, maxW: P ? 760 : 560 });
  }
};

// 超级粉丝：每个组件一个 Claude，整天盯着监控
SHOT.superfan = (g, c) => {
  const u = c.u, aF = c.k('fan', 0.5), aS = c.k('spot', c.line(1) + 1);
  tint(g, C.violetRGB, 0.45);
  const chans = TL.txt.fans;
  const pw = P ? 760 : 470, ph = P ? 170 : 380;
  for (let i = 0; i < 3; i++) {
    const k = pop(u, aF - 0.3 + i * 0.15);
    if (k <= 0) continue;
    const x = P ? 0 : (i - 1) * 510, y = P ? -200 + i * 195 : -10;
    g.save(); g.translate(x, y); g.scale(k, k);
    panel(g, -pw / 2, -ph / 2, pw, ph, { r: 20, fill: C.panel, stroke: C.line });
    txt(g, chans[i], -pw / 2 + 20, -ph / 2 + 30, 24, C.violet, { family: F.mono, align: 'left', weight: '700', maxW: pw - 40 });
    bot(g, -pw / 2 + 60, ph / 2 - 60, 0.6, u, { seed: i + 40, mood: 'focus', look: 1, glow: 0.8 });
    // 滚动的曲线；第一个面板在 spot 时刻出现一个小鼓包
    const cx0 = -pw / 2 + 120, cw = pw - 150, cy = P ? 10 : 20, ch = P ? 60 : 120;
    g.save(); g.beginPath(); g.rect(cx0, cy - ch, cw, ch * 2); g.clip();
    g.strokeStyle = C.mint; g.lineWidth = 3; g.beginPath();
    for (let j = 0; j <= 60; j++) {
      const xx = cx0 + (j / 60) * cw, tt = u * 2 + j * 0.15;
      let v = Math.sin(tt * 1.3 + i) * 0.25 + Math.sin(tt * 3.1 + i * 2) * 0.12;
      if (i === 0 && u > aS - 0.5) v -= Math.exp(-Math.pow((j - 44) / 3, 2)) * 0.9 * ease(u, aS - 0.5, aS);
      const yy = cy + v * ch * 0.8;
      if (j) g.lineTo(xx, yy); else g.moveTo(xx, yy);
    }
    g.stroke(); g.restore();
    if (i === 0 && u > aS) {
      const kk = ease(u, aS, aS + 0.3);
      g.save(); g.globalAlpha = kk; g.strokeStyle = C.gold; g.lineWidth = 4; g.beginPath(); g.arc(cx0 + (44 / 60) * cw, cy - ch * 0.6, 30, 0, TAU); g.stroke(); g.restore();
      g.save(); g.translate(P ? 120 : 0, P ? -ph / 2 - 10 : ph / 2 + 70); g.scale(kk, kk); bubble(g, 0, 0, T(TL.txt.fanSays), '#141a33', C.gold, 26); g.restore();
    }
    g.restore();
  }
  if (u > aS + 0.6) chip(g, '✓ ' + T(TL.txt.alert), 0, P ? 300 : -SH + 10, 28, '#06251b', 'rgba(62,240,176,0.5)', { weight: '700', alpha: ease(u, aS + 0.6, aS + 0.9) });
};

// 合并队列：全库加锁排队 → 合并后、部署前测试；冲突由 Claude 马上修好
SHOT.mergeq = (g, c) => {
  const u = c.u, aL = c.k('land', c.line(0) + 1.5), aU = c.k('unlock', c.line(1) + 0.5), aF = c.k('fix', c.line(2) + 0.5);
  tint(g, C.blueRGB, 0.45);
  const y = P ? -40 : 0, open = ease(u, aU, aU + 0.4);
  line(g, -SW, y, SW, y, C.line, 10);
  txt(g, 'main', SW - 30, y - 30, 26, C.dim, { family: F.mono, align: 'right', weight: '700' });
  const gate = P ? -120 : -260;
  g.save(); g.globalAlpha = 1 - open * 0.8;
  rr(g, gate - 12, y - 110, 24, 220, 8); g.fillStyle = C.red; g.fill();
  g.restore();
  icon(g, open > 0.5 ? 'unlock' : 'lock', gate, y - 160, 90, open > 0.5 ? C.mint : C.red);
  if (open < 1) chip(g, T(TL.txt.queue), gate, y + 150, P ? 26 : 30, C.ink, '#3a2030', { stroke: C.red, weight: '900', alpha: 1 - open });
  // 改动：锁着时堆在闸门前，打开后流过去
  for (let i = 0; i < 18; i++) {
    const queued = gate - 60 - i * 58;
    const flowX = -SW - 60 + ((u * 260 + i * 120) % (2 * SW + 120));
    box(g, lerp(Math.max(queued, -SW - 40), flowX, open), y + (open > 0 ? Math.sin(i) * 6 : 0), 0.8, BOXC[i % 5]);
  }
  // 测试检查点（打开后出现）
  if (open > 0) [T(TL.txt.postMerge), T(TL.txt.preDeploy)].forEach((s, i) => {
    const x = (P ? 80 : 120) + i * (P ? 220 : 380), k = pop(u, aU + 0.4 + i * 0.3);
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = '#0f2a2a'; g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fill();
    g.strokeStyle = C.mint; g.lineWidth = 5; g.stroke(); icon(g, 'check', 0, 0, 50, C.mint);
    chip(g, s, 0, -90, P ? 22 : 26, '#06251b', C.mint, { weight: '900' });
    g.restore();
  });
  // 测试还在跑，已经合进上千个
  if (u > aL - 0.3 && open < 1) {
    const v = 1000 * ex(u, aL - 0.2, aL + 1.2);
    g.save(); g.globalAlpha = 1 - open;
    txt(g, T(['测试运行中…', 'tests running…']), P ? 160 : 300, y - 200, 30, C.dim, { weight: '700' });
    slam(g, '+' + fmtInt(v), P ? 160 : 300, y - 130, P ? 70 : 84, C.gold, u, aL, { ring: false });
    g.restore();
  }
  // 冲突 → 已修复；人还在找问题在哪
  if (u > aF - 0.8) {
    const cy = P ? 200 : 240, k = ease(u, aF - 0.8, aF - 0.3);
    box(g, -lerp(160, 30, k), cy, 1.1, C.blue);
    box(g, lerp(160, 30, k), cy, 1.1, C.violet);
    const fixed = ease(u, aF, aF + 0.3);
    if (k >= 1 && fixed < 1) { glow(g, 0, cy, 90, C.redRGB, 0.8); chip(g, T(TL.txt.conflict) + ' !', 0, cy - 80, 28, C.ink, C.red, { weight: '900' }); }
    if (fixed > 0) { glow(g, 0, cy, 120, C.mintRGB, 0.6 * fixed); chip(g, '✓ ' + T(TL.txt.fixed), 0, cy - 80, 28, '#06251b', C.mint, { weight: '900', alpha: fixed }); bot(g, 190, cy + 10, 0.8, u, { seed: 12, mood: 'happy', glow: 1 }); }
    if (u > aF) { person(g, -220, cy + 30, 0.8, u, { seed: 6, shirt: C.violet }); txt(g, '?', -160, cy - 60, 50, C.dim, { weight: '900' }); }
  }
};

// 对其他人意味着什么：不是扔掉 Git；6–12 个月；把思路带回 Git，和社区一起做
SHOT.ecosystem = (g, c) => {
  const u = c.u, aN = c.k('nope', 0.8), aO = c.k('only', c.line(1) + 0.8), aM = c.k('m612', c.line(2) + 0.6), aB = c.k('back', c.line(3) + 0.5), aT = c.k('tog', c.line(4) + 0.5);
  tint(g, C.blueRGB, 0.45);
  const ph = u < c.line(1) - 0.2 ? 0 : u < c.line(2) - 0.2 ? 1 : u < c.line(3) - 0.2 ? 2 : 3;
  const fadeIn = (t0) => ease(u, t0 - 0.2, t0 + 0.2);
  if (ph === 0) {
    slam(g, T(['扔掉 Git？', 'Ditch Git?']), 0, -120, P ? 90 : 110, C.ink, u, 0.1, { family: FT(), weight: '900', ring: false });
    branchGraph(g, 0, 120, P ? 600 : 900, 80, u, 1, { color: C.blue, n: 11 });
    if (u > aN) stamp(g, T(['不是', 'NO']), P ? 150 : 420, P ? 0 : -10, P ? 100 : 120, C.mint, C.mintRGB, u, aN, -0.12);
  } else if (ph === 1) {
    const k = fadeIn(c.line(1));
    g.save(); g.globalAlpha = k;
    slab(g, P ? -170 : -420, 160, P ? 260 : 340, P ? 330 : 380, '#3d63c9', 12);
    sprout(g, P ? -170 : -420, P ? -10 : -30, 0.9, ease(u, c.line(1), c.line(1) + 0.8), u);
    for (let i = 0; i < 4; i++) { const x = (P ? 120 : 160) + (i % 2) * (P ? 150 : 230), y = -60 + Math.floor(i / 2) * 200; panel(g, x - 60, y - 40, 120, 80, { r: 14, fill: C.panel2 }); branchGraph(g, x, y, 80, 20, u, 1, { color: C.blue, n: 4 }); }
    g.restore();
    if (u > aO) chip(g, T(TL.txt.forWho), P ? -170 : -420, P ? -230 : -280, P ? 26 : 30, '#06251b', C.mint, { weight: '900' });
    if (u > aO + 1.0) stamp(g, T(TL.txt.notFor), P ? 140 : 280, P ? 280 : 290, P ? 32 : 40, C.gold, C.goldRGB, u, aO + 1.0, -0.05);
  } else if (ph === 2) {
    const k = fadeIn(c.line(2)), m = P ? 4 : 6;
    g.save(); g.globalAlpha = k;
    for (let i = 0; i < m; i++) {
      const x = (i - (m - 1) / 2) * (P ? 190 : 250), y = 140;
      panel(g, x - 80, y - 26, 160, 52, { r: 12, fill: '#26315f', stroke: rgba(C.redRGB, ease(u, aM + i * 0.15, aM + i * 0.15 + 0.5)), lw: 4, shadow: false });
      txt(g, 'git', x, y + 2, 26, C.ink, { family: F.mono, weight: '700' });
      heap(g, x + 40, y - 50, Math.floor(ease(u, aM, aM + 2.5) * 6), u, 1);
    }
    g.restore();
    slam(g, T(TL.txt.soon), 0, -150, P ? 110 : 130, C.gold, u, aM, {});
  } else {
    const k = fadeIn(c.line(3));
    g.save(); g.globalAlpha = k;
    const gyy = P ? 170 : 160;
    glow(g, 0, gyy, 300, C.blueRGB, 0.4 * ease(u, aB + 0.6, aB + 1.4));
    branchGraph(g, 0, gyy, P ? 640 : 1000, 80, u, 1, { color: C.blue, n: 11 });
    T(TL.txt.ideas).forEach((s, i) => {
      const t0 = aB + 0.1 + i * 0.35, kk = ease(u, t0, t0 + 0.7);
      if (u < t0) return;
      const x0 = (i - 1) * (P ? 270 : 420), y0 = -170;
      chip(g, s, x0, lerp(y0, y0 + 40, kk), P ? 24 : 30, '#06251b', C.mint, { weight: '900' });
      arrow(g, x0, y0 + 70, x0 * 0.6, gyy - 40, rgba(C.mintRGB, 0.8), 4, kk, 16);
    });
    g.restore();
    if (u > aT - 0.2) {
      const kk = pop(u, aT - 0.2);
      g.save(); g.translate(0, P ? -280 : -300); g.scale(kk, kk);
      chip(g, T(TL.txt.partners), 0, 0, P ? 30 : 36, C.ink, C.panel2, { stroke: C.blue, weight: '900' });
      g.restore();
      txt(g, T(TL.txt.git20), 0, P ? 290 : 300, 26, C.dim, { weight: '700', alpha: ease(u, aT + 0.5, aT + 0.8) });
    }
  }
};

// 瓶颈搬家：写代码不再是瓶颈 → 源码管理被 Scion 撑开 → 下一个是谁？
SHOT.bottleneck = (g, c) => {
  const u = c.u, aN = c.k('neck', 0.5), aW = c.k('wall', c.line(1) + 0.6), aX = c.k('next', c.line(2) + 0.3);
  tint(g, C.redRGB, 0.2 + 0.4 * ease(u, aX, aX + 0.3));
  const labels = T(TL.txt.necks), n = 4;
  // 每段管子的粗细：写代码已经很粗；源码管理被 Scion 撑开；构建 · CI 卡在“人的速度”上；最后一段是问号
  const widths = [lerp(110, 170, ease(u, aN, aN + 0.5)), 150, lerp(120, 46, ease(u, aW, aW + 0.6)), lerp(90, 30, ease(u, aX, aX + 0.6))];
  const cols = [C.mint, C.mint, C.red, C.gold];
  const len = P ? 110 : 330;
  const pos = (i) => (P ? [-60, -SH + 70 + i * 150] : [-SW + 230 + i * 380, -20]);
  for (let i = 0; i < n - 1; i++) { const [x, y] = pos(i), [x2, y2] = pos(i + 1); line(g, x, y, x2, y2, '#26315f', 18); }
  for (let i = 0; i < n; i++) {
    const [x, y] = pos(i), w = widths[i];
    const neck = (i === 2 && u > aW) || (i === 3 && u > aX);
    if (neck) glow(g, x, y, 140, i === 3 ? C.goldRGB : C.redRGB, 0.5 + 0.3 * Math.sin(u * 8));
    g.save(); g.translate(x, y); if (P) g.rotate(Math.PI / 2);
    rr(g, -len / 2, -w / 2, len, w, Math.min(20, w / 2)); g.fillStyle = '#26315f'; g.fill();
    g.lineWidth = 5; g.strokeStyle = cols[i]; g.stroke();
    // 流过的改动：越窄越慢
    for (let j = 0; j < 3; j++) { const xx = -len / 2 + ((u * w * 1.6 + j * len / 3) % len); box(g, xx, 0, Math.min(0.8, w / 70), BOXC[(i + j) % 5]); }
    g.restore();
    const lx = P ? x + 140 : x, ly = P ? y : y + 150;
    txt(g, labels[i], lx, ly, i === 3 ? 60 : (P ? 34 : 38), i === 3 ? C.gold : C.ink, { weight: '900', align: P ? 'left' : 'center' });
    if (i === 0 && u > aN) chip(g, '✓', P ? x - 130 : x, P ? y : y - 120, 30, '#06251b', C.mint, { weight: '900' });
    if (i === 1) chip(g, 'Scion', P ? x - 160 : x, P ? y : y - 120, 26, '#06251b', C.mint, { family: F.grot, weight: '700' });
  }
  if (u > aW) { const [x, y] = pos(2); chip(g, T(TL.txt.humanSpeed), P ? x + 140 : x, P ? y + 48 : y - 120, P ? 24 : 28, C.ink, '#3a2030', { stroke: C.red, weight: '900', align: P ? 'left' : 'center' }); }
  if (u > aX) { const [x, y] = pos(3); slam(g, '?', x, y, P ? 150 : 200, C.gold, u, aX, { ringW: 1.2 }); }
};

// 片尾：投票 + 平台互动语 + 出处
SHOT.endcard = (g, c) => {
  const u = c.u;
  tint(g, C.clayRGB, 0.4);
  const [q, cta] = TL.cta;
  slam(g, q, 0, P ? -250 : -280, P ? 64 : 76, C.ink, u, 0.05, { family: FT(), weight: '900', ring: false, maxW: 2 * SW - 40 });
  const cols = [C.blue, C.violet, C.clay, C.mint];
  T(TL.txt.poll).forEach(([num, s], i) => {
    const k = pop(u, 0.25 + i * 0.12);
    if (k <= 0) return;
    const x = P ? 0 : (i % 2 ? 1 : -1) * 380, y = P ? -130 + i * 100 : -100 + Math.floor(i / 2) * 140;
    const bw = P ? 640 : 680, bh = P ? 82 : 110;
    g.save(); g.translate(x, y); g.scale(k, k);
    panel(g, -bw / 2, -bh / 2, bw, bh, { r: bh / 2, fill: C.panel2, stroke: cols[i], lw: 4 });
    g.fillStyle = cols[i]; g.beginPath(); g.arc(-bw / 2 + bh / 2, 0, bh / 2 - 10, 0, TAU); g.fill();
    txt(g, num, -bw / 2 + bh / 2, 2, bh * 0.5, '#0b1124', { family: F.grot, weight: '700' });
    txt(g, s, 20, 2, P ? 38 : 46, C.ink, { weight: '900', maxW: bw - bh - 60 });
    g.restore();
  });
  const kc = pop(u, 0.9);
  if (kc > 0) { g.save(); g.translate(0, P ? 290 : 220); g.scale(kc, kc); chip(g, cta, 0, 0, P ? 40 : 46, '#2a1206', C.clay, { weight: '900' }); g.restore(); }
  txt(g, T(TL.txt.disclaimer), 0, P ? 360 : 300, 20, C.dim, { weight: '500', alpha: ease(u, 1.0, 1.4), maxW: 2 * SW });
  txt(g, TL.txt.sign, P ? 0 : SW - 10, P ? 400 : -SH + 10, 26, C.dim, { family: F.grot, weight: '700', spacing: '6px', align: P ? 'center' : 'right', alpha: ease(u, 1.2, 1.6) });
};
