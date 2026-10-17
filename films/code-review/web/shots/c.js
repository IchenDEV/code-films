// 镜头 C：让 AI 审得更好（考题循环）、一晚 50 轮、新规矩、结果、人留在哪、讲解、你合进去的你负责、照着做、结尾与片尾投票。

// 每一次事故都变成一道考题：一个循环；作者是 AI 时噪音更贵
SHOT.evalloop = (g, c) => {
  const u = c.u, ae = c.k('exam', 1.6), au = c.k('up', c.line(1) + 1.2), ar = c.k('round');
  tint(g, C.goldRGB, 0.3);
  const split = c.has('round') ? ease(u, c.line(2) - 0.4, c.line(2)) : 0;
  if (split < 1) {
    g.save(); g.globalAlpha = 1 - split;
    const R = P ? 225 : 270, cy = P ? 0 : 0, steps = T(TL.txt.evalSteps), cols = [C.red, C.violet, C.gold, C.blue, C.clay, C.mint];
    g.lineWidth = 6; g.strokeStyle = C.line; g.beginPath(); g.arc(0, cy, R, 0, TAU); g.stroke();
    const dot = (u * 0.35) % 1;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * TAU, x = Math.cos(a) * R * (P ? 1 : 1.55), y = cy + Math.sin(a) * R;
      const k = pop(u, 0.1 + i * 0.12);
      if (k <= 0) continue;
      const hot = (i === 2 && u > ae - 0.1 && u < ae + 1.5) || (i === 5 && u > au - 0.1);
      g.save(); g.translate(x, y); g.scale(k * (hot ? 1.12 : 1), k * (hot ? 1.12 : 1));
      if (hot) glow(g, 0, 0, 110, hex(cols[i]), 0.6);
      const bw = P ? 210 : 260;
      panel(g, -bw / 2, -40, bw, 80, { r: 40, fill: C.panel2, stroke: cols[i], lw: 4 });
      txt(g, steps[i], 0, 2, P ? 26 : 30, C.ink, { weight: '900', maxW: bw - 24 });
      g.restore();
    }
    const da = -Math.PI / 2 + dot * TAU;
    glow(g, Math.cos(da) * R * (P ? 1 : 1.55), cy + Math.sin(da) * R, 40, C.goldRGB, 0.9);
    // 中心：考卷 / 分数
    if (u > ae - 0.3) {
      const k = pop(u, ae - 0.2);
      g.save(); g.translate(0, cy); g.scale(k, k);
      panel(g, -90, -110, 180, 220, { r: 12, fill: '#f4efe6', stroke: null });
      for (let j = 0; j < 5; j++) { bug(g, -50, -70 + j * 38, 0.32, u, { seed: j, still: true, glow: 0 }); g.fillStyle = 'rgba(20,26,51,0.3)'; rr(g, -26, -76 + j * 38, 100, 12, 6); g.fill(); }
      g.restore();
    }
    if (u > au - 0.2) {
      const k = ease(u, au - 0.2, au + 0.6);
      g.save(); g.translate(P ? 0 : 0, cy + (P ? 0 : 0));
      g.fillStyle = 'rgba(7,11,26,0.85)'; rr(g, -150, 60, 300, 70, 16); g.fill();
      g.fillStyle = C.mint; rr(g, -140, 70, 280 * (0.55 + 0.35 * k), 50, 12); g.fill();
      txt(g, (ZH ? '分数 ' : 'score ') + '↑', 0, 96, 30, '#06251b', { weight: '900' });
      g.restore();
      if (u > au + 0.6) slam(g, T(TL.txt.keep) + ' ✓', 0, cy - 160, P ? 54 : 64, C.mint, u, au + 0.6, { rgb: C.mintRGB, family: FT(), weight: '900', ring: false });
    }
    g.restore();
  }
  // 噪音：人扫一眼跳过；AI 去改，又多一轮
  if (split > 0) {
    g.save(); g.globalAlpha = split;
    const xs = P ? [-210, 210] : [-380, 380];
    [[T(TL.txt.nitHuman), false], [T(TL.txt.nitAgent), true]].forEach(([lab, agent], i) => {
      const x = xs[i];
      panel(g, x - (P ? 195 : 330), -SH + 10, P ? 390 : 660, 2 * SH - 20, { r: 24, fill: 'rgba(18,27,60,0.9)', stroke: agent ? C.red : C.mint, lw: 4 });
      chip(g, 'Nit', x, -SH + 70, 30, '#0b1124', C.gold, { family: F.grot, weight: '700' });
      if (!agent) {
        person(g, x, 80, P ? 1.1 : 1.3, u, { seed: 3, shirt: C.violet });
        g.save(); g.translate(x + 80, -10); g.rotate(Math.sin(u * 10) * 0.4); g.fillStyle = C.skin; rr(g, -18, -30, 36, 56, 14); g.fill(); g.restore();
      } else {
        bot(g, x - 60, 90, P ? 1 : 1.2, u, { seed: 6, mood: 'focus', look: 1 });
        const n = 1 + Math.floor(Math.max(0, u - ar + 0.4) * 2.5);
        for (let j = 0; j < Math.min(n, 4); j++) prCard(g, x + 80, 60 - j * 50, 0.42, { seed: j + 70, status: C.gold });
        if (u > ar) slam(g, '+1', x + 80, -110, P ? 70 : 86, C.red, u, ar, { rgb: C.redRGB });
      }
      txt(g, lab, x, SH - 50, P ? 26 : 32, C.ink, { weight: '900', maxW: P ? 370 : 620 });
    });
    g.restore();
  }
};

// 一个晚上：AI 写、AI 审，PR 在两个机器人之间来回飞，轮数一路涨到 50+
SHOT.night = (g, c) => {
  const u = c.u, a50 = c.k('n50', 3.2), a59 = c.k('n59', c.line(1) + 1.6), ao = c.k('old');
  // 夜空
  g.save(); g.fillStyle = 'rgba(3,5,22,0.55)'; g.fillRect(-W, -H, W * 2, H * 2); g.restore();
  tint(g, C.violetRGB, 0.4);
  for (let i = 0; i < 40; i++) { const x = (rand(i, 1) - 0.5) * 2 * SW, y = -SH + rand(i, 2) * SH * 0.9; g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(u * 2 + i))})`; g.fillRect(x, y, 3, 3); }
  const mx = P ? 300 : 620, my = -SH + 70;
  glow(g, mx, my, 120, [255, 240, 200], 0.5);
  g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(mx, my, 46, 0, TAU); g.fill();
  g.fillStyle = 'rgba(3,5,22,0.9)'; g.beginPath(); g.arc(mx + 20, my - 12, 40, 0, TAU); g.fill();
  const phase2 = ease(u, a59 - 0.5, a59 - 0.1);
  g.save(); g.globalAlpha = 1 - 0.85 * phase2;
  // 两个机器人
  const ax = P ? -260 : -480, rx = P ? 260 : 480, by = P ? 150 : 170;
  bot(g, ax, by, P ? 1.1 : 1.3, u, { seed: 1, mood: 'focus', look: 1 });
  bot(g, rx, by, P ? 1.1 : 1.3, u, { seed: 2, mood: 'focus', look: -1, color: '#9b84ff', dark: '#6d58d6' });
  txt(g, T(TL.txt.author), ax, by + 90, 28, C.clay, { weight: '900' });
  txt(g, T(TL.txt.reviewerBot), rx, by + 90, 28, C.violet, { weight: '900' });
  // 来回飞的 PR：越来越快
  const rate = 0.8 + 3.2 * ease(u, 0.2, a50);
  const ph = (u * rate) % 2, dir = ph < 1 ? 1 : -1, k = ph % 1;
  const px = dir > 0 ? lerp(ax + 60, rx - 60, sm(k)) : lerp(rx - 60, ax + 60, sm(k)), py = by - 120 - Math.sin(k * Math.PI) * (P ? 160 : 200);
  prCard(g, px, py, P ? 0.5 : 0.6, { seed: Math.floor(u * rate), status: dir > 0 ? C.gold : C.red, rot: (k - 0.5) * 0.4 * dir });
  if (dir < 0) { g.save(); g.translate(px + 50, py - 50); bubble(g, 0, 0, 'Nit', '#0b1124', C.gold, 22); g.restore(); }
  // 轮数
  const rounds = Math.floor(1 + 51 * ease(u, 0.1, a50 + 0.2));
  if (u < a50) txt(g, (ZH ? `第 ${rounds} 轮` : `ROUND ${rounds}`), 0, P ? -170 : -190, P ? 72 : 88, C.ink, { family: ZH ? F.sans : F.grot, weight: '900' });
  else slam(g, ZH ? '50+ 轮' : '50+ ROUNDS', 0, P ? -170 : -190, P ? 96 : 120, C.gold, u, a50);
  icon(g, 'clock', 0, P ? -60 : -70, P ? 80 : 96, C.dim, u * (2 + 6 * ease(u, 0.2, a50)));
  txt(g, T(TL.txt.night), 0, P ? 0 : 0, 26, C.dim, { weight: '700' });
  // 长版：作者叫停
  if (c.cut === 'long' && u > c.line(1) - 0.9) {
    const kk = pop(u, c.line(1) - 0.9);
    g.save(); g.translate(0, by + 10); g.scale(kk, kk); person(g, 0, 0, P ? 1 : 1.2, u, { seed: 5, shirt: C.blue, mouth: 'open' }); g.restore();
    stamp(g, T(TL.txt.stop), 0, by - 170, P ? 70 : 84, C.red, C.redRGB, u, c.line(1) - 0.7, -0.1);
  }
  g.restore();
  // 59%：一直揪出来的问题，大多是第一轮就在的老代码
  if (phase2 > 0) {
    g.save(); g.globalAlpha = phase2;
    const cx = P ? 0 : -300, cy = P ? -20 : 0, R = P ? 170 : 200;
    const sweep = ex(u, a59 - 0.1, a59 + 0.8) * 0.59;
    g.fillStyle = rgba(C.redRGB, 0.85); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU); g.closePath(); g.fill();
    g.fillStyle = '#7d8bb8'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * sweep); g.closePath(); g.fill();
    g.fillStyle = '#0c1430'; g.beginPath(); g.arc(cx, cy, R * 0.55, 0, TAU); g.fill();
    if (u >= a59) slam(g, '59%', cx, cy + 4, P ? 70 : 84, C.gold, u, a59, { ring: false });
    const lx = P ? 0 : 160, ly = P ? 230 : -40;
    txt(g, T(TL.txt.firstPass), lx, ly, P ? 34 : 42, C.ink, { weight: '900', align: P ? 'center' : 'left', alpha: ease(u, a59 + 0.3, a59 + 0.6), maxW: P ? 760 : 620 });
    txt(g, 'git blame', lx, ly + (P ? 46 : 56), P ? 26 : 30, C.dim, { family: F.mono, weight: '600', align: P ? 'center' : 'left', alpha: ease(u, a59 + 0.3, a59 + 0.6) });
    // 长版：每一轮多挖出几个老的
    if (c.has('old') && u > ao - 1.2) {
      const kd = ease(u, ao - 1.2, ao - 0.8), gx = P ? 0 : 420, gy = P ? 160 : 160;
      g.save(); g.globalAlpha *= kd;
      if (P) { g.fillStyle = 'rgba(7,11,26,0.85)'; g.fillRect(-SW, -SH, 2 * SW, 2 * SH); }
      g.fillStyle = '#3b2a22'; rr(g, gx - 220, gy, 440, 120, 14); g.fill();
      for (let j = 0; j < 6; j++) {
        const up = ease(u, ao - 0.8 + j * 0.35, ao - 0.5 + j * 0.35);
        bug(g, gx - 170 + j * 68, gy + 60 - 140 * up, 0.55, u, { seed: j + 3, color: '#8d97ba', rgb: C.dimRGB, glow: 0.4 });
      }
      bot(g, gx + (P ? 0 : 0), gy - (P ? 170 : 150), 0.9, u, { seed: 7, mood: 'focus', color: '#9b84ff', dark: '#6d58d6' });
      txt(g, ZH ? '每一轮，多挖出几个老的' : 'a few more old ones each round', gx, gy + 160, P ? 30 : 32, C.ink, { weight: '900' });
      g.restore();
    }
    g.restore();
  }
};

// 新规矩：三轮不过换思路、之后只看新改动、指出一类、说过的不再说
SHOT.rules = (g, c) => {
  const u = c.u;
  tint(g, C.mintRGB, 0.35);
  const keys = ['r3', 'diff', 'cls', 'rep'], all = T(TL.txt.rules);
  const items = keys.map((k, i) => ({ k, s: all[i], at: c.k(k), i })).filter((x) => c.has(x.k));
  const n = items.length;
  items.forEach((it, j) => {
    const k = pop(u, it.at - 0.25);
    if (k <= 0) return;
    let x, y, w, h;
    if (P) { w = 760; h = Math.min(150, (2 * SH - 20) / n - 18); x = 0; y = -SH + 10 + h / 2 + j * (h + 18); }
    else { w = n > 3 ? 760 : 500; h = n > 3 ? 300 : 420; x = n > 3 ? (j % 2 ? 1 : -1) * 400 : (j - 1) * 530; y = n > 3 ? (j < 2 ? -170 : 170) : 0; }
    g.save(); g.translate(x, y); g.scale(k, k);
    panel(g, -w / 2, -h / 2, w, h, { r: 24, fill: 'rgba(18,27,60,0.94)', stroke: C.mint, lw: 4 });
    const ix = P ? -w / 2 + 80 : 0, iy = P ? 0 : -h * 0.18;
    // 图标
    if (it.k === 'r3') { txt(g, '3', ix, iy, P ? 80 : 120, C.gold, { family: F.grot, weight: '700' }); g.save(); g.strokeStyle = C.mint; g.lineWidth = 7; g.beginPath(); g.arc(ix, iy, P ? 52 : 80, -0.3, Math.PI * 1.4); g.stroke(); g.restore(); }
    if (it.k === 'diff') { for (let r = 0; r < 4; r++) { g.fillStyle = r === 2 ? rgba(C.goldRGB, 0.9) : rgba(C.dimRGB, 0.35); rr(g, ix - (P ? 50 : 80), iy - (P ? 40 : 60) + r * (P ? 22 : 34), P ? 100 : 160, P ? 12 : 18, 6); g.fill(); } }
    if (it.k === 'cls') { for (let r = 0; r < 3; r++) bug(g, ix - (P ? 30 : 50) + r * (P ? 30 : 50), iy, P ? 0.5 : 0.75, u, { seed: r, still: true }); }
    if (it.k === 'rep') { g.save(); g.translate(ix, iy); bubble(g, 0, 0, '…', '#0b1124', C.gold, P ? 28 : 40); line(g, -50, -40, 50, 40, C.red, 8); g.restore(); }
    txt(g, it.s, P ? 40 : 0, P ? 0 : h * 0.26, P ? 44 : 46, C.ink, { weight: '900', maxW: P ? w - 200 : w - 40 });
    g.restore();
  });
};

// 结果（高潮）：一轮就过 65% → 78%；五轮以上 8.9% → 1.5%；平均审几轮 2.08 → 1.32
SHOT.converge = (g, c) => {
  const u = c.u;
  tint(g, C.mintRGB, 0.45 + 0.15 * Math.sin(u * 3));
  const rows = [['p78', 65, 78, '%', 100], ['p15', 8.9, 1.5, '%', 10], ['m132', 2.08, 1.32, '', 2.5]].filter((r) => c.has(r[0]));
  const labs = T(TL.txt.conv), n = rows.length;
  const rh = P ? (n > 2 ? 190 : 250) : (n > 2 ? 220 : 290);
  rows.forEach(([key, b, a, unit, max], j) => {
    const at = c.k(key), t0 = c.line(j) + 0.1;
    const k = pop(u, t0 - 0.1);
    if (k <= 0) return;
    const y = (j - (n - 1) / 2) * rh;
    g.save(); g.translate(0, y); g.scale(k, k);
    const li = ['p78', 'p15', 'm132'].indexOf(key);
    txt(g, labs[li], P ? -SW + 20 : -SW + 40, -rh * 0.3, P ? 32 : 38, C.ink, { align: 'left', weight: '900' });
    const bx = P ? -SW + 20 : -SW + 40, bw = P ? 2 * SW - 260 : 2 * SW - 520, bh = P ? 30 : 36;
    // 之前（灰）与之后（薄荷绿）两根条
    g.fillStyle = rgba(C.dimRGB, 0.5); rr(g, bx, -bh / 2 + 4, bw * (b / max), bh, bh / 2); g.fill();
    const grow = ex(u, at - 0.2, at + 0.7), va = lerp(b, a, grow);
    g.fillStyle = C.mint; rr(g, bx, bh / 2 + 14, bw * (va / max), bh, bh / 2); g.fill();
    txt(g, `${T(TL.txt.before)} ${b}${unit}`, bx + bw * (b / max) + 16, 4, P ? 26 : 30, C.dim, { align: 'left', weight: '700' });
    g.restore();
    if (u >= at - 0.05) {
      const s = unit ? `${a}${unit}` : a.toFixed(2);
      slam(g, s, P ? SW - 110 : SW - 200, y + 10, P ? 76 : 100, C.gold, u, at, { rgb: C.mintRGB });
      if (u > at + 0.2) txt(g, a > b ? '▲' : '▼', P ? SW - 110 : SW - 200, y - (P ? 62 : 80), 34, C.mint, { family: F.grot, alpha: ease(u, at + 0.2, at + 0.4) });
    }
  });
};

// 人留在哪：自动检查绕着转一圈，中间是只有人能做的几个决定
SHOT.humans = (g, c) => {
  const u = c.u, aw = c.k('what', 0.5), ao = c.k('own', c.line(c.n - 1) + 0.4);
  const keys = [['d1', 0], ['d2', 1], ['d3', 2], ['d4', 3], ['own', 4]].filter(([k]) => c.has(k));
  tint(g, C.goldRGB, 0.3 + 0.3 * ease(u, ao, ao + 0.4));
  const intro = c.cut === 'long' ? 1 - ease(u, c.k('d1') - 0.6, c.k('d1') - 0.2) : 0;
  // 长版开头：资深工程师被拽出深度工作去抓一个低级错误 —— 太贵了
  if (intro > 0.01) {
    g.save(); g.globalAlpha = intro;
    glow(g, P ? -120 : -220, 20, 260, C.violetRGB, 0.5);
    const pull = ease(u, aw + 0.6, aw + 1.4);
    person(g, lerp(P ? -120 : -220, P ? 60 : 120, pull), 90, P ? 1.3 : 1.5, u, { seed: 2, shirt: C.violet, mouth: pull > 0.3 ? 'open' : null });
    bug(g, P ? 230 : 420, 160, 0.5, u, { seed: 4 });
    if (u > aw + 1.4) stamp(g, ZH ? '太贵了' : 'TOO COSTLY', P ? 120 : 220, -140, P ? 80 : 96, C.red, C.redRGB, u, aw + 1.5, -0.1);
    g.restore();
  }
  const body = 1 - intro;
  if (body <= 0.01) return;
  g.save(); g.globalAlpha = body;
  // 外圈：自动检查
  const R = P ? 300 : 340, RX = P ? 360 : 700;
  g.save(); g.setLineDash([10, 14]); g.lineDashOffset = -u * 30; g.strokeStyle = rgba(C.blueRGB, 0.5); g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, 0, RX, R, 0, 0, TAU); g.stroke(); g.restore();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + u * 0.25, x = Math.cos(a) * RX, y = Math.sin(a) * R;
    g.fillStyle = C.panel2; g.beginPath(); g.arc(x, y, 22, 0, TAU); g.fill();
    icon(g, ['check', 'search', 'lock', 'chip'][i % 4], x, y, 26, C.blue);
  }
  txt(g, T(TL.txt.autoRing), 0, R - 26, P ? 22 : 26, C.blue, { weight: '700' });
  // 里面：人做的决定
  const labs = T(TL.txt.decisions), n = keys.length;
  keys.forEach(([k, li], j) => {
    const at = c.k(k), kk = pop(u, at - 0.15);
    if (kk <= 0) return;
    const isOwn = k === 'own';
    let x, y;
    if (isOwn) { x = 0; y = P ? 150 : 150; }
    else { const m = n - 1, cols = P ? 2 : m; x = P ? (j % 2 ? 1 : -1) * 170 : (j - (m - 1) / 2) * 330; y = P ? -150 + Math.floor(j / 2) * 120 : -60; }
    g.save(); g.translate(x, y); g.scale(kk, kk);
    if (isOwn) glow(g, 0, 0, 200, C.goldRGB, 0.6);
    const w = isOwn ? (P ? 460 : 560) : (P ? 300 : 300), h = isOwn ? 110 : 90;
    panel(g, -w / 2, -h / 2, w, h, { r: h / 2, fill: isOwn ? C.gold : '#f4efe6', stroke: null });
    person(g, -w / 2 + 50, 4, isOwn ? 0.5 : 0.42, u, { seed: j + 1, shirt: BOXC[j % 5], skin: SKINS[j % 4] });
    txt(g, labs[li], 24, 2, isOwn ? (P ? 44 : 50) : (P ? 30 : 32), '#141a33', { weight: '900', maxW: w - 120 });
    g.restore();
    if (li === 1 && u > at + 0.3) txt(g, T(TL.txt.riskyEx), x, y + 70, P ? 20 : 22, C.dim, { weight: '600', alpha: ease(u, at + 0.3, at + 0.6) });
  });
  if (u < aw + 0.8 && c.cut !== 'long') slam(g, ZH ? '人做什么？' : 'And people?', 0, -40, P ? 76 : 90, C.ink, u, Math.max(0.02, aw - 0.3), { family: FT(), weight: '900', ring: false, alpha: 1 - ease(u, aw + 0.4, aw + 0.8) });
  g.restore();
};

// 讲解：一行文案改动教不了什么；一份现写的讲解教你很多
SHOT.explainer = (g, c) => {
  const u = c.u, ae = c.k('exp', 2), al = c.k('lot', c.line(1) + 2);
  tint(g, C.blueRGB, 0.35);
  const lx = P ? -200 : -400, rx = P ? 200 : 360;
  // 左：一行文案改动
  g.save(); g.translate(lx, -20);
  panel(g, P ? -170 : -260, -90, P ? 340 : 520, 180, { r: 18, fill: '#0e1530' });
  g.fillStyle = 'rgba(255,74,95,0.15)'; g.fillRect(P ? -166 : -256, -50, P ? 332 : 512, 40);
  g.fillStyle = 'rgba(62,240,176,0.12)'; g.fillRect(P ? -166 : -256, 0, P ? 332 : 512, 40);
  txt(g, '- "Sign in"', P ? -140 : -230, -30, P ? 26 : 32, C.red, { family: F.mono, align: 'left', weight: '600' });
  txt(g, '+ "Log in"', P ? -140 : -230, 20, P ? 26 : 32, C.mint, { family: F.mono, align: 'left', weight: '600' });
  g.restore();
  txt(g, T(TL.txt.oneLine), lx, P ? -160 : -170, P ? 30 : 34, C.dim, { weight: '700' });
  if (u > al - 1.6) txt(g, T(TL.txt.teaches)[0], lx, P ? 120 : 130, P ? 32 : 38, C.dim, { weight: '900', alpha: ease(u, al - 1.6, al - 1.2) });
  // 右：现写的讲解（小示意图）
  const k = pop(u, ae - 0.3);
  if (k > 0) {
    g.save(); g.translate(rx, -10); g.scale(k, k);
    const w = P ? 360 : 560, h = P ? 420 : 470;
    panel(g, -w / 2, -h / 2, w, h, { r: 20, fill: '#f4efe6', stroke: null });
    txt(g, T(TL.txt.explainer), 0, -h / 2 + 34, P ? 24 : 28, '#4a5070', { weight: '700' });
    const nodes = [[-0.28, -0.2], [0.28, -0.2], [0, 0.12], [-0.28, 0.34], [0.28, 0.34]];
    const draw = ease(u, ae, ae + 2.2);
    nodes.forEach(([nx, ny], j) => {
      if (draw * 5 < j) return;
      const x = nx * w, y = ny * h;
      if (j) { const [px, py] = nodes[j === 2 ? 0 : j > 2 ? 2 : 0]; arrow(g, px * w, py * h, x, y - 26, '#4a5070', 4, clamp(draw * 5 - j), 12); }
      g.fillStyle = [C.clay, C.violet, C.mint, C.blue, C.gold][j]; rr(g, x - 60, y - 26, 120, 52, 12); g.fill();
    });
    g.restore();
    bot(g, rx + (P ? 150 : 300), P ? 230 : 230, P ? 0.7 : 0.85, u, { seed: 2, mood: 'focus', look: -1 });
  }
  if (u >= al) slam(g, T(TL.txt.teaches)[1], rx, P ? 260 : 290, P ? 54 : 64, C.mint, u, al, { rgb: C.mintRGB, family: FT(), weight: '900' });
};

// 你合进去的，你负责
SHOT.own = (g, c) => {
  const u = c.u, al = c.k('land', 1.2), as = c.k('sys');
  tint(g, C.goldRGB, 0.4);
  const [l1, l2] = T(TL.txt.landOwn);
  const up = c.has('sys') ? ease(u, c.line(1) - 0.4, c.line(1)) : 0;
  g.save(); g.translate(0, lerp(0, P ? -150 : -170, up)); g.scale(lerp(1, 0.7, up), lerp(1, 0.7, up));
  slam(g, l1, 0, P ? -120 : -110, P ? 92 : 110, C.ink, u, Math.max(0.05, al - 0.9), { family: FT(), weight: '900', ring: false });
  if (u >= al) slam(g, l2, 0, P ? 20 : 40, P ? 132 : 160, C.gold, u, al, { family: FT(), weight: '900' });
  g.restore();
  if (up < 0.5) {
    const k = ease(u, al + 0.2, al + 0.6) * (1 - up * 2);
    g.save(); g.globalAlpha = k;
    person(g, P ? -160 : -300, P ? 200 : 230, 0.9, u, { seed: 6, shirt: C.violet });
    prCard(g, P ? 60 : 0, P ? 200 : 220, 0.7, { seed: 8, status: C.mint });
    g.save(); g.strokeStyle = C.clay; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x <= 120 * ease(u, al + 0.4, al + 1.2); x += 4) g.lineTo((P ? 10 : -50) + x, (P ? 250 : 270) + Math.sin(x * 0.12) * 10);
    g.stroke(); g.restore();
    g.restore();
  }
  if (c.has('sys')) {
    T(TL.txt.ownWhy).forEach((s, i) => {
      const at = i === 3 ? as - 0.2 : c.line(1) + 0.3 + i * 0.8;
      const k = pop(u, at);
      if (k <= 0) return;
      const x = P ? 0 : (i % 2 ? 1 : -1) * 380, y = P ? -10 + i * 82 : 40 + Math.floor(i / 2) * 120;
      g.save(); g.translate(x, y); g.scale(k, k);
      chip(g, s, 0, 0, P ? 32 : 38, i === 3 ? '#0b1124' : C.ink, i === 3 ? C.gold : C.panel2, { stroke: C.line, weight: '900' });
      g.restore();
    });
  }
};

// 可以照抄的清单
SHOT.adopt = (g, c) => {
  const u = c.u;
  tint(g, C.mintRGB, 0.3);
  const items = T(TL.txt.adopt), ats = [c.k('a1'), c.k('a2'), c.k('a3'), c.k('a3') + 0.9, c.k('a4'), c.k('a5')];
  txt(g, ZH ? '可以照抄的清单' : 'A checklist you can copy', 0, -SH + 20, P ? 44 : 52, C.ink, { weight: '900' });
  const rows = P ? 6 : 3, cw = P ? 760 : 760, rh = P ? 82 : 140;
  items.forEach((s, i) => {
    const x = P ? 0 : (i < 3 ? -400 : 400), y = (P ? -SH + 100 : -SH + 130) + (i % rows) * rh;
    const k = pop(u, Math.min(ats[i] - 0.6, 0.2 + i * 0.12));
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    panel(g, -cw / 2, -rh / 2 + 6, cw, rh - 12, { r: 18, fill: C.panel2, stroke: C.line });
    const done = u > ats[i];
    g.lineWidth = 4; g.strokeStyle = C.ink; rr(g, -cw / 2 + 24, -20, 40, 40, 8); g.stroke();
    if (done) icon(g, 'check', -cw / 2 + 44, 0, 44, C.mint);
    txt(g, s, -cw / 2 + 90, 2, P ? 32 : 36, done ? C.ink : C.dim, { align: 'left', weight: '900', maxW: cw - 120 });
    g.restore();
  });
};

// 结尾：（长版）这条线还在挪；“人看过” → “有人负责”；你们团队，谁在审？
SHOT.ending = (g, c) => {
  const u = c.u, aL = c.k('line'), af = c.k('from', c.has('line') ? c.line(1) + 1 : 1.2), at = c.k('to', af + 1.2), aw = c.k('who', c.line(c.n - 1) + 1);
  tint(g, C.violetRGB, 0.35);
  const p2 = c.has('line') ? ease(u, af - 0.8, af - 0.4) : 1;
  // 长版：一片 PR，竖线往右挪，左边的不用人看就能合
  if (p2 < 1) {
    g.save(); g.globalAlpha = 1 - p2;
    const cols = P ? 5 : 9, rows = 4, lx = lerp(-SW * 0.4, SW * 0.15, ease(u, aL - 0.3, aL + 2.5));
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols - (cols - 1) / 2) * (P ? 160 : 170), y = (Math.floor(i / cols) - 1.5) * 120;
      const auto = x < lx;
      prCard(g, x, y, 0.5, { seed: i, status: auto ? C.mint : C.gold });
      if (auto) okBadge(g, x + 44, y - 26, 14); else person(g, x + 44, y - 20, 0.22, u, { seed: i, shirt: C.violet });
    }
    line(g, lx, -SH + 20, lx, SH - 20, C.gold, 6);
    txt(g, T(TL.txt.autoMerge), lx - 20, -SH + 10, P ? 22 : 28, C.mint, { align: 'right', weight: '900' });
    chip(g, T(TL.txt.lineMoves) + ' →', lx + 20, SH - 40, P ? 26 : 32, '#0b1124', C.gold, { align: 'left', weight: '900', alpha: ease(u, aL, aL + 0.3) });
    g.restore();
  }
  if (p2 <= 0) return;
  g.save(); g.globalAlpha = p2;
  const qa = ease(u, aw - 0.5, aw - 0.1);
  g.save(); g.globalAlpha *= 1 - 0.85 * qa;
  const [s1, s2] = T(TL.txt.fromTo), y1 = P ? -130 : -120, y2 = P ? 110 : 130;
  if (u > af - 0.3) {
    icon(g, 'eye', P ? -260 : -460, y1, P ? 100 : 120, C.dim);
    slam(g, s1, P ? 60 : 0, y1, P ? 80 : 96, C.dim, u, af - 0.1, { family: FT(), weight: '900', ring: false });
    if (u > at - 0.2) line(g, P ? -110 : -170, y1, lerp(P ? -110 : -170, P ? 230 : 170, ease(u, at - 0.2, at + 0.1)), y1, C.red, 9);
  }
  if (u > at - 0.1) {
    arrow(g, 0, y1 + 50, 0, y2 - 70, C.gold, 7, ease(u, at - 0.1, at + 0.2), 22);
    person(g, P ? -280 : -480, y2 + 10, 0.8, u, { seed: 3, shirt: C.gold });
    slam(g, s2, P ? 60 : 0, y2, P ? 100 : 124, C.gold, u, at, { family: FT(), weight: '900' });
  }
  g.restore();
  if (qa > 0) {
    magnifier(g, P ? 230 : 420, P ? 140 : 120, (P ? 70 : 90) * (1 + 0.05 * Math.sin(u * 6)), 0.8);
    slam(g, ZH ? '谁在审？' : 'Who reviews?', 0, P ? -40 : -40, P ? 130 : 160, C.ink, u, aw - 0.3, { family: FT(), weight: '900', rgb: C.violetRGB });
  }
  g.restore();
};

// 片尾：投票
SHOT.endcard = (g, c) => {
  const u = c.u;
  tint(g, C.violetRGB, 0.4);
  const [q, cta] = TL.cta;
  slam(g, q, 0, P ? -250 : -280, P ? 64 : 76, C.ink, u, 0.05, { family: FT(), weight: '900', ring: false, maxW: 2 * SW - 40 });
  const cols = [C.blue, C.violet, C.clay, C.red];
  T(TL.txt.poll).forEach(([num, s], i) => {
    const k = pop(u, 0.25 + i * 0.12);
    if (k <= 0) return;
    const x = P ? 0 : (i % 2 ? 1 : -1) * 380, y = P ? -130 + i * 100 : -100 + Math.floor(i / 2) * 140;
    const bw = P ? 680 : 700, bh = P ? 82 : 110;
    g.save(); g.translate(x, y); g.scale(k, k);
    panel(g, -bw / 2, -bh / 2, bw, bh, { r: bh / 2, fill: C.panel2, stroke: cols[i], lw: 4 });
    g.fillStyle = cols[i]; g.beginPath(); g.arc(-bw / 2 + bh / 2, 0, bh / 2 - 10, 0, TAU); g.fill();
    txt(g, num, -bw / 2 + bh / 2, 2, bh * 0.5, '#0b1124', { family: F.grot, weight: '700' });
    txt(g, s, 20, 2, P ? 38 : 44, C.ink, { weight: '900', maxW: bw - bh - 60 });
    g.restore();
  });
  const kc = pop(u, 0.9);
  if (kc > 0) { g.save(); g.translate(0, P ? 290 : 220); g.scale(kc, kc); chip(g, cta, 0, 0, P ? 38 : 46, '#2a1206', C.clay, { weight: '900', maxW: 2 * SW - 40 }); g.restore(); }
  txt(g, T(TL.txt.disclaimer), 0, P ? 360 : 300, 20, C.dim, { weight: '500', alpha: ease(u, 1.0, 1.4), maxW: 2 * SW });
  txt(g, TL.txt.sign, P ? 0 : SW - 10, P ? 400 : -SH + 10, 26, C.dim, { family: F.grot, weight: '700', spacing: '6px', align: P ? 'center' : 'right', alpha: ease(u, 1.2, 1.6) });
};
