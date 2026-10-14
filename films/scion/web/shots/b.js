// 镜头 B：Scion 怎么做 —— 揭晓、六条原则、变更集、派生数据、只要不报、三层缓存、结果。
// 文件名、哈希都是示意，不是 Anthropic 仓库里的真实内容。

// 揭晓：一截新枝长出来，SCION
SHOT.scion = (g, c) => {
  const u = c.u, aN = c.k('name', 0.4), aP = c.k('nopush');
  tint(g, C.mintRGB, 0.6 + 0.3 * ease(u, aN, aN + 0.4));
  const ops = c.n > 1; // 短版第二句：操作都在服务器上
  const up = ops ? ease(u, c.line(1) - 0.3, c.line(1) + 0.3) : 0;
  // 地面与嫩芽
  g.save(); g.globalAlpha = 1 - up;
  const gy = SH - 40;
  line(g, -SW * 0.6, gy, SW * 0.6, gy, rgba(C.mintRGB, 0.4), 4);
  sprout(g, 0, gy, P ? 1.6 : 1.8, ease(u, 0, 1.1), u);
  g.restore();
  // 字标
  const wy = lerp(P ? -80 : -110, -SH + 30, up), ws = lerp(1, 0.42, up);
  g.save(); g.translate(0, wy); g.scale(ws, ws);
  slam(g, 'SCION', 0, 0, P ? 150 : 190, C.mint, u, Math.min(aN, 0.5), { rgb: C.mintRGB, spacing: '14px', ringW: 2.2 });
  g.restore();
  if (!ops) {
    txt(g, T(TL.txt.scionSub), 0, P ? 30 : 20, P ? 38 : 44, C.ink, { weight: '900', alpha: ease(u, aN + 0.2, aN + 0.5) });
    txt(g, T(TL.txt.scionDef), 0, P ? 90 : 84, P ? 26 : 30, C.dim, { family: ZH ? F.sans : F.grot, weight: '500', alpha: ease(u, aN + 0.4, aN + 0.7) });
    return;
  }
  // 提交、合并、变基、历史、blame 都飞进服务器；push 被划掉
  const sy = P ? 20 : 30;
  g.save(); g.globalAlpha = up;
  glow(g, 0, sy, 260, C.mintRGB, 0.4);
  server(g, 0, sy, 170, 230, u, { seed: 5, rows: 8 });
  txt(g, 'scion-server', 0, sy + 150, 28, C.mint, { family: F.mono, weight: '700' });
  g.restore();
  const names = T(TL.txt.onServer), t1 = c.line(1);
  names.forEach((s, i) => {
    const t0 = t1 + 0.15 + i * 0.22, k = ease(u, t0, t0 + 0.6);
    if (u < t0) return;
    const ang = (i / names.length) * TAU - Math.PI / 2, r = lerp(P ? 300 : 420, 0, inCubic(k)) + (k >= 1 ? 0 : 0);
    const x = Math.cos(ang) * r * (P ? 1 : 1.3), y = sy + Math.sin(ang) * r * 0.7;
    if (k < 1) chip(g, s, x, y, 30, '#06251b', C.mint, { weight: '700', alpha: 1 - ease(u, t0 + 0.5, t0 + 0.6) });
  });
  // 落进去以后，在服务器两边排成一列
  names.forEach((s, i) => {
    const t0 = t1 + 0.15 + i * 0.22 + 0.6;
    if (u < t0) return;
    const side = i % 2 ? 1 : -1, x = side * (P ? 250 : 330), y = sy - 120 + Math.floor(i / 2) * 80;
    chip(g, s + ' ✓', x, y, 28, C.ink, C.panel2, { stroke: C.mint, weight: '700', alpha: ease(u, t0, t0 + 0.2) });
  });
  if (u > aP - 0.6) {
    const k = ease(u, aP - 0.6, aP);
    g.save(); g.translate(lerp(SW + 100, P ? 0 : 0, outCubic(k)), sy + (P ? 230 : 250));
    chip(g, 'git push', 0, 0, 34, C.ink, '#3a2030', { family: F.mono, stroke: C.red, weight: '700' });
    g.restore();
    if (u > aP) { line(g, -120, sy + (P ? 230 : 250), lerp(-120, 120, ease(u, aP, aP + 0.2)), sy + (P ? 230 : 250), C.red, 8); stamp(g, T(TL.txt.noPush), P ? 0 : 330, sy + (P ? 160 : 230), P ? 60 : 70, C.red, C.redRGB, u, aP + 0.1, -0.1); }
  }
};

// 六条原则（长版）：左边一列标题，右边画当前这一条
SHOT.principles = (g, c) => {
  const u = c.u, at = [1, 2, 3, 4, 5, 6].map((i) => c.k('p' + i, c.line(i - 1)));
  let cur = 0;
  at.forEach((a, i) => { if (u >= a - 0.15) cur = i; });
  tint(g, C.mintRGB, 0.45);
  const names = T(TL.txt.principles), icons = ['plug', 'server', 'api', 'scale', 'feather', 'sparse'];
  // 左列
  const lx = P ? -SW + 10 : -SW + 10, rowH = P ? 0 : (2 * SH - 60) / 6, lw = P ? 0 : 560;
  if (!P) names.forEach((s, i) => {
    const y = -SH + 30 + rowH * (i + 0.5), on = i === cur, done = i < cur, k = pop(u, i * 0.06 - 0.3, 0.3);
    if (k <= 0) return;
    g.save(); g.translate(lx, y); g.scale(1, k);
    if (on) { panel(g, 0, -rowH / 2 + 6, lw, rowH - 12, { r: 18, fill: rgba(C.mintRGB, 0.18), stroke: C.mint, lw: 3, shadow: false }); }
    g.fillStyle = on ? C.mint : done ? C.ink : C.faint; g.beginPath(); g.arc(46, 0, 28, 0, TAU); g.fill();
    txt(g, String(i + 1), 46, 2, 32, '#0b1124', { family: F.grot, weight: '700' });
    txt(g, s, 96, 2, 36, on ? C.ink : done ? '#c9cfe6' : C.dim, { align: 'left', weight: on ? '900' : '700', maxW: lw - 120 });
    g.restore();
  });
  // 右边：当前原则的示意
  const rx = P ? 0 : (lx + lw + SW) / 2, ry = P ? 30 : 0, a = at[cur], ku = u - a;
  const kin = pop(u, a - 0.15, 0.35);
  g.save(); g.translate(rx, ry); g.scale(kin, kin);
  const pw = P ? 2 * SW - 20 : SW - lx - lw - 40, ph = 2 * SH - 40;
  panel(g, -pw / 2, -ph / 2, pw, ph, { r: 28, fill: rgba([18, 27, 60], 0.85), stroke: C.line });
  icon(g, icons[cur], -pw / 2 + 80, -ph / 2 + 80, 90, C.mint, u);
  txt(g, (cur + 1) + ' · ' + names[cur], -pw / 2 + 150, -ph / 2 + 80, 44, C.ink, { align: 'left', weight: '900', maxW: pw - 200 });
  const cy = 50;
  if (cur === 0) {
    icon(g, 'cloud', 0, cy - 110, 200, C.mint);
    for (let i = 0; i < 5; i++) { const x = (i - 2) * 150, y = cy + 120; g.save(); g.setLineDash([12, 12]); g.lineDashOffset = -(u * 80) % 24; line(g, x, y - 50, 0, cy - 60, rgba(C.mintRGB, 0.7), 3); g.restore(); bot(g, x, y, 0.85, u, { seed: i, glow: 1 }); }
    if (ku > 1.2) chip(g, T(['用到再拿', 'fetch on demand']), 260, cy - 120, 30, '#06251b', C.mint, { weight: '900', alpha: ease(ku, 1.2, 1.5) });
  } else if (cur === 1) {
    server(g, 0, cy, 180, 250, u, { seed: 3, rows: 9 });
    T(TL.txt.onServer).forEach((s, i) => { const k = pop(ku, 0.3 + i * 0.25); if (k > 0) { g.save(); g.translate((i % 2 ? 1 : -1) * 250, cy - 120 + Math.floor(i / 2) * 85); g.scale(k, k); chip(g, s + ' ✓', 0, 0, 30, '#06251b', C.mint, { weight: '700' }); g.restore(); } });
    bot(g, -330, cy + 120, 0.8, u, { mood: 'happy', seed: 4 });
  } else if (cur === 2) {
    server(g, 220, cy, 150, 210, u, { seed: 6, rows: 7 });
    ['blame?', 'merge-base?', 'diff?'].forEach((q, i) => {
      const k = ease(ku, 0.2 + i * 0.4, 0.8 + i * 0.4), y = cy - 100 + i * 100;
      bot(g, -280, y, 0.65, u, { seed: i + 7, look: 1 });
      arrow(g, -220, y, lerp(-220, 130, k), y, C.mint, 5, 1, 18);
      if (k > 0.1) chip(g, q, lerp(-220, 130, k) - 110, y - 32, 22, C.ink, C.panel2, { family: F.mono, weight: '700' });
    });
    if (ku > 1.4) chip(g, T(['不用本地仓库', 'no local repo']), 0, cy + 200, 32, '#06251b', C.mint, { weight: '900', alpha: ease(ku, 1.4, 1.7) });
  } else if (cur === 3) {
    const n = Math.min(14, 2 + Math.floor(ku * 5));
    for (let i = 0; i < n; i++) { const k = pop(ku, i * 0.2 - 0.2); g.save(); g.translate(-330 + (i % 7) * 110, cy - 70 + Math.floor(i / 7) * 160); g.scale(k, k); server(g, 0, 0, 70, 110, u, { seed: i, rows: 4 }); g.restore(); }
    if (ku > 1.4) stamp(g, T(['没有完整副本', 'no full copy']), 0, cy + 200, 40, C.gold, C.goldRGB, ku, 1.4, -0.06);
  } else if (cur === 4) {
    // 成本跟改动大小走，不跟仓库大小走
    slab(g, -220, cy + 20, 220, 240, '#3d63c9', 9);
    box(g, 160, cy + 80, 1.0, C.mint);
    txt(g, T(['仓库', 'repo']), -220, cy + 190, 30, C.dim, { weight: '700' });
    txt(g, T(['改动', 'change']), 160, cy + 160, 30, C.dim, { weight: '700' });
    const k = ease(ku, 0.5, 1.0);
    if (k > 0) { chip(g, T(['成本 ∝ 改动', 'cost ∝ change']), 160, cy - 80, 34, '#06251b', C.mint, { weight: '900', alpha: k }); icon(g, 'unlock', 330, cy - 80, 60 * k, C.mint); }
    if (ku > 1.0) line(g, -330, cy - 160, -110, cy + 140, rgba(C.redRGB, ease(ku, 1.0, 1.3)), 8);
  } else {
    // 工作副本可选：只有读到的格子才落到磁盘上
    const cols = 8, rows = 4, s2 = 70;
    for (let i = 0; i < cols * rows; i++) {
      const read = rand(i, 3) < 0.22, on = read && ku > 0.3 + rand(i, 4) * 1.4;
      const x = (i % cols - (cols - 1) / 2) * (s2 + 14), y = cy - 60 + (Math.floor(i / cols) - 1.5) * (s2 + 14) + 40;
      g.fillStyle = on ? C.mint : 'rgba(141,151,186,0.12)'; rr(g, x - s2 / 2, y - s2 / 2, s2, s2, 10); g.fill();
      if (!on) { g.save(); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(141,151,186,0.3)'; g.lineWidth = 2; rr(g, x - s2 / 2, y - s2 / 2, s2, s2, 10); g.stroke(); g.restore(); }
    }
    if (ku > 1.4) chip(g, T(['只为读到的付费', 'pay only for what you read']), 0, cy + 210, 32, '#06251b', C.mint, { weight: '900', alpha: ease(ku, 1.4, 1.7) });
  }
  g.restore();
};

// 变更集：Git 提交指向一整棵树；变更集只记改了什么、内容在哪
SHOT.changeset = (g, c) => {
  const u = c.u, aC = c.k('cs', 0.6), aT = c.k('tree', c.line(1)), aL = c.k('list', c.line(2)), aB = c.k('blob', c.line(2) + 1.5), aI = c.k('inst', c.line(3));
  tint(g, C.blueRGB, 0.4);
  const half = P ? 0 : SW / 2;
  // 左：git 提交 → 整棵树
  const gx = P ? 0 : -half, gy = P ? -150 : 0, kg = ease(u, aT - 0.3, aT + 0.3);
  if (u < aT - 0.3) {
    slam(g, T(TL.txt.changeset), 0, -20, P ? 96 : 120, C.mint, u, Math.min(aC, 0.3), { rgb: C.mintRGB, family: FT(), weight: '900' });
    txt(g, 'changeset', 0, P ? 70 : 90, 40, C.dim, { family: F.mono, weight: '700', alpha: ease(u, Math.min(aC, 0.3) + 0.2, Math.min(aC, 0.3) + 0.5) });
  } else {
    g.save(); g.globalAlpha = kg;
    chip(g, T(TL.txt.commit), gx, gy - (P ? 120 : 250), 30, C.ink, '#3a2030', { stroke: C.red, weight: '900' });
    const levels = [1, 3, 9], lvY = [-170, -40, 90].map((y) => y * (P ? 0.6 : 1) + gy + (P ? 0 : 20));
    const nodes = levels.map((n, L) => [...Array(n)].map((_, i) => [gx + (i - (n - 1) / 2) * (P ? 72 : 76) * (L === 2 ? 1 : 2.4), lvY[L]]));
    const lit = ease(u, aT, aT + 0.8);
    nodes.forEach((row, L) => row.forEach(([x, y], i) => {
      if (L > 0) { const [px, py] = nodes[L - 1][Math.floor(i / 3)]; line(g, px, py + 18, x, y - 18, rgba(C.redRGB, 0.4 + 0.5 * lit), 3); }
      g.fillStyle = rgba(mixRGB(C.dimRGB, C.redRGB, lit), 1); rr(g, x - 26, y - 18, 52, 36, 8); g.fill();
    }));
    txt(g, T(TL.txt.tree), gx, lvY[2] + (P ? 50 : 70), 30, C.red, { weight: '900', alpha: lit });
    g.restore();
  }
  // 右：变更集卡片
  if (u > aL - 0.4) {
    const k = pop(u, aL - 0.4), cx = P ? 0 : half, cy = P ? 120 : -40;
    g.save(); g.translate(cx, cy); g.scale(k, k);
    panel(g, -260, -150, 520, 300, { r: 22, fill: '#0f2a2a', stroke: C.mint, lw: 4 });
    txt(g, T(TL.txt.changeset), -230, -110, 34, C.mint, { align: 'left', weight: '900' });
    const files = [['M', 'src/cache.py', '7f3a…'], ['A', 'src/tier.py', 'c19e…'], ['M', 'docs/readme.md', '02bd…']];
    files.forEach(([m, f, h], i) => {
      const kr = ease(u, aL + i * 0.25, aL + i * 0.25 + 0.2);
      g.save(); g.globalAlpha = kr;
      const y = -45 + i * 62;
      txt(g, m, -230, y, 28, m === 'A' ? C.mint : C.gold, { family: F.mono, align: 'left', weight: '700' });
      txt(g, f, -190, y, 28, C.ink, { family: F.mono, align: 'left', weight: '500' });
      if (u > aB) { txt(g, '→ ' + h, 230, y, 26, C.blue, { family: F.mono, align: 'right', weight: '700', alpha: ease(u, aB + i * 0.15, aB + i * 0.15 + 0.2) }); }
      g.restore();
    });
    g.restore();
    if (u > aB) {
      const kb = pop(u, aB + 0.3);
      g.save(); g.translate(P ? 300 : half + 330, P ? 270 : 220); g.scale(kb, kb);
      g.fillStyle = '#1f3d6e'; g.beginPath(); g.ellipse(0, -50, 90, 24, 0, 0, TAU); g.fill(); g.fillRect(-90, -50, 180, 100); g.beginPath(); g.ellipse(0, 50, 90, 24, 0, 0, TAU); g.fill();
      g.strokeStyle = C.blue; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -50, 90, 24, 0, 0, TAU); g.stroke();
      txt(g, T(TL.txt.blobStore), 0, 10, 26, C.ink, { weight: '900' });
      g.restore();
    }
  }
  // 预写日志 + 没有打包文件、没有锁、不用协调
  if (u > aI - 0.4) {
    const k = ease(u, aI - 0.4, aI), y = SH - 30;
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(7,11,26,0.85)'; rr(g, -SW, y - 60, 2 * SW, 120, 18); g.fill();
    txt(g, T(TL.txt.wal), -SW + 20, y - 34, 22, C.dim, { align: 'left', weight: '700' });
    for (let i = 0; i < 16; i++) {
      const x = -SW + 40 + i * 110 - ((u - aI) * 140) % 110;
      if (x > SW - 60) continue;
      g.fillStyle = i % 3 ? C.panel2 : rgba(C.mintRGB, 0.6); rr(g, x, y - 14, 96, 44, 8); g.fill();
    }
    g.restore();
    T(TL.txt.noPack).forEach((s, i) => { const kk = pop(u, aI + 0.2 + i * 0.3); if (kk > 0) { g.save(); g.translate((i - 1) * (P ? 270 : 360), P ? -260 : -300); g.scale(kk, kk); chip(g, s, 0, 0, P ? 28 : 32, '#06251b', C.mint, { weight: '900' }); g.restore(); } });
  }
};

// 派生数据：从每个变更集的父辈一代代推出来，用到才算
SHOT.derived = (g, c) => {
  const u = c.u, aD = c.k('der', c.line(0) + 1.5), aS = c.k('swap', c.line(1) + 1);
  tint(g, C.violetRGB, 0.45);
  const n = P ? 4 : 6, gap = P ? 190 : 230, y0 = P ? 190 : 210;
  const kinds = T(TL.txt.derivedKinds), cols = [C.gold, C.blue, C.violet];
  txt(g, T(TL.txt.derived), 0, -SH + 20, P ? 52 : 60, C.ink, { weight: '900', alpha: ease(u, aD - 0.3, aD) });
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * gap;
    const k = pop(u, i * 0.1);
    if (k <= 0) continue;
    g.save(); g.translate(x, y0); g.scale(k, k);
    panel(g, -70, -40, 140, 80, { r: 14, fill: '#0f2a2a', stroke: C.mint, lw: 3 });
    txt(g, 'cs ' + (i + 1), 0, 2, 28, C.mint, { family: F.mono, weight: '700' });
    g.restore();
    if (i > 0) arrow(g, x - gap + 76, y0, x - 76, y0, C.mint, 4, k, 14);
    // 派生层：从左到右一层层算出来（每一格由父辈那一格推出来）
    kinds.forEach((kd, L) => {
      const t0 = aD + i * 0.25 + L * 0.08, kk = ease(u, t0, t0 + 0.25);
      const swapped = L === 2 && u > aS + i * 0.1;
      if (kk <= 0) return;
      const yy = y0 - 120 - L * 90;
      g.save(); g.globalAlpha = kk;
      g.fillStyle = swapped ? C.mint : cols[L]; rr(g, x - 66, yy - 30, 132, 60, 12); g.fill();
      if (swapped) txt(g, 'v2', x, yy + 2, 26, '#06251b', { family: F.mono, weight: '700' });
      g.restore();
      if (i > 0 && kk > 0) arrow(g, x - gap + 70, yy, x - 70, yy, rgba(C.inkRGB, 0.35), 3, kk, 10);
    });
  }
  if (!P) kinds.forEach((kd, L) => txt(g, kd, -SW + 10, y0 - 120 - L * 90, 26, cols[L], { align: 'left', weight: '900', alpha: ease(u, aD, aD + 0.4) }));
  if (u > aD + 1.5) chip(g, T(TL.txt.lazy), P ? 0 : SW - 180, P ? -SH + 90 : -SH + 30, 30, '#06251b', C.mint, { weight: '900', alpha: ease(u, aD + 1.5, aD + 1.8) });
  if (u > aS) {
    const k = pop(u, aS + 0.4);
    g.save(); g.translate(P ? 0 : SW - 140, P ? -SH + 160 : -40); g.scale(k, k);
    bot(g, 0, 0, 0.9, u, { mood: 'happy', seed: 8 });
    chip(g, T(['客户端：无感', 'client: unchanged']), 0, 90, 26, C.ink, C.panel2, { weight: '700' });
    g.restore();
  }
};

// 只说要什么：一棵目录树，只有要到的那几枝被拉下来
SHOT.fetch = (g, c) => {
  const u = c.u, aH = c.k('have'), aW = c.k('want', 0.2), aA = c.k('any');
  tint(g, C.mintRGB, 0.4);
  const long = c.has('have');
  const ty = long ? (P ? 40 : 60) : -40, sc = long ? (P ? 0.8 : 0.85) : 1;
  // 目录树
  g.save(); g.translate(long && !P ? 300 : 0, ty); g.scale(sc, sc);
  const L = [[0], [-1, 0, 1], [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]];
  const path = [0, 2, 3, 4];
  const lit = (lv, i) => i === [0, 1, 2, 5][lv] || (lv === 3 && i === 6);
  const t0 = long ? aW + 0.3 : 0.2;
  L.forEach((row, lv) => row.forEach((x, i) => {
    const X = x * (P ? 100 : 120), Y = -210 + lv * 140;
    const on = lit(lv, i) && u > t0 + lv * 0.25;
    if (lv > 0) { const parent = L[lv - 1].reduce((b, px, j) => (Math.abs(px - x / (lv === 1 ? 1 : 1.5)) < Math.abs(L[lv - 1][b] - x / (lv === 1 ? 1 : 1.5)) ? j : b), 0); line(g, L[lv - 1][parent] * (P ? 100 : 120), Y - 140 + 24, X, Y - 24, on ? C.mint : 'rgba(141,151,186,0.25)', on ? 5 : 2, on ? null : [6, 8]); }
    if (on) glow(g, X, Y, 70, C.mintRGB, 0.5);
    g.fillStyle = on ? C.mint : 'rgba(141,151,186,0.14)'; rr(g, X - 36, Y - 24, 72, 48, 10); g.fill();
    txt(g, lv === 3 ? 'blob' : 'tree', X, Y + 2, 20, on ? '#06251b' : 'rgba(141,151,186,0.5)', { family: F.mono, weight: '700' });
  }));
  g.restore();
  if (!long) {
    bot(g, P ? -300 : -560, P ? 220 : 220, 0.9, u, { seed: 2, look: 1, glow: 1 });
    if (u > 0.5) chip(g, T(['只拉要的', 'only what you ask for']), P ? 0 : 520, P ? 270 : -250, 34, '#06251b', C.mint, { weight: '900', alpha: ease(u, 0.5, 0.8) });
    return;
  }
  // 长版：git 说“我有……”（一长串），Scion 只说“我要：”
  const bx = P ? 0 : -430;
  if (u > aH - 0.3) {
    const k = pop(u, aH - 0.3);
    g.save(); g.translate(bx, P ? -230 : -160); g.scale(k, k);
    panel(g, -230, -110, 460, 220, { r: 22, fill: '#2a1a2e', stroke: C.red, lw: 3 });
    txt(g, 'git: ' + T(TL.txt.iHave), -200, -70, 30, C.red, { align: 'left', weight: '900' });
    for (let i = 0; i < 5; i++) txt(g, 'have ' + (rand(i, 2).toString(16).slice(2, 10)) + '…', -200, -22 + i * 30, 22, 'rgba(255,170,180,0.7)', { family: F.mono, align: 'left', weight: '500' });
    if (u > aW) line(g, -210, 0, lerp(-210, 210, ease(u, aW, aW + 0.25)), 0, C.red, 8);
    g.restore();
  }
  if (u > aW - 0.1) {
    const k = pop(u, aW);
    g.save(); g.translate(bx, P ? -230 : 120); g.scale(k, k);
    panel(g, -230, -90, 460, 180, { r: 22, fill: '#0f2a2a', stroke: C.mint, lw: 3 });
    txt(g, 'scion: ' + T(TL.txt.iWant), -200, -50, 30, C.mint, { align: 'left', weight: '900' });
    txt(g, 'tree a1f…  tree 3c8…', -200, 0, 24, C.ink, { family: F.mono, align: 'left', weight: '500' });
    txt(g, 'blob 9c2…', -200, 36, 24, C.ink, { family: F.mono, align: 'left', weight: '500' });
    g.restore();
  }
  if (u > aA - 0.2) {
    chip(g, T(TL.txt.immutable), P ? 0 : 300, -SH + 10, 30, '#06251b', C.mint, { weight: '900', alpha: ease(u, aA - 0.2, aA + 0.1) });
    [0, 1, 2].forEach((i) => { const k = pop(u, aA + 0.2 + i * 0.2); if (k > 0) { g.save(); g.translate((P ? -250 : 40) + i * (P ? 250 : 180), P ? 290 : 310); g.scale(k * 0.8, k * 0.8); server(g, 0, -30, 80, 100, u, { seed: i + 20, rows: 4 }); icon(g, 'check', 50, -90, 50, C.mint); g.restore(); } });
  }
};

// 三层缓存：每台机器的 daemon → 每个区域的 cache → server → Spanner / 云存储
SHOT.tiers = (g, c) => {
  const u = c.u, aH = c.k('hit', c.line(0) + 1.4), aIso = c.k('iso');
  const hl = { 1: c.k('d'), 2: c.k('c'), 3: c.k('s') };
  tint(g, C.mintRGB, 0.4);
  const names = ZH ? TL.txt.tierNames : TL.txt.tierNamesEn;
  // 五个位置：任务 → daemon → cache → server → 存储
  const pos = P ? [[0, 250], [0, 120], [0, -10], [0, -140], [0, -255]] : [[-660, 60], [-330, 60], [0, 60], [330, 60], [640, 60]];
  const fail = ease(u, aIso - 0.2, aIso + 0.2);
  // 连线
  for (let i = 0; i < 4; i++) line(g, pos[i][0], pos[i][1], pos[i + 1][0], pos[i + 1][1], C.line, 6);
  // 请求包：大多数在第一层就命中返回，越往上越少
  for (let i = 0; i < 26; i++) {
    const r = rand(i, 3), depth = r < 0.7 ? 1 : r < 0.9 ? 2 : r < 0.97 ? 3 : 4;
    const period = 2.2, ph = ((((u + rand(i, 5) * period) % period) + period) % period) / period; // 转场里镜头时间是负的
    const legs = depth, tt = ph * 2 * legs;
    const leg = Math.min(legs - 1, Math.floor(tt < legs ? tt : 2 * legs - tt));
    const f = tt < legs ? tt - leg : (2 * legs - tt) - leg;
    const [x1, y1] = pos[leg], [x2, y2] = pos[leg + 1];
    const blocked = fail > 0.5 && depth >= 3 && leg >= 2;
    if (blocked) continue;
    const back = tt >= legs;
    g.fillStyle = back ? C.mint : C.blue; rr(g, lerp(x1, x2, f) - 9, lerp(y1, y2, f) - 9, 18, 18, 4); g.fill();
  }
  // 各层
  pos.forEach(([x, y], i) => {
    const k = pop(u, i * 0.12);
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    const on = hl[i] != null && u > hl[i] - 0.1 && u < hl[i] + 1.4;
    if (on) glow(g, 0, 0, 160, C.mintRGB, 0.7);
    if (i === 0) { for (let j = 0; j < 3; j++) bot(g, (j - 1) * 70, 10, 0.55, u, { seed: j + 30 }); }
    else if (i === 4) {
      g.fillStyle = '#1f3d6e'; g.beginPath(); g.ellipse(0, -36, 70, 18, 0, 0, TAU); g.fill(); g.fillRect(-70, -36, 140, 72); g.beginPath(); g.ellipse(0, 36, 70, 18, 0, 0, TAU); g.fill();
      g.strokeStyle = C.blue; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -36, 70, 18, 0, 0, TAU); g.stroke();
    } else {
      const bad = i === 2 && fail > 0.3;
      panel(g, -80, -46, 160, 92, { r: 16, fill: bad ? '#3a1a26' : '#0f2a2a', stroke: bad ? C.red : C.mint, lw: 4 });
      txt(g, names[i - 1][0], 0, -8, 22, bad ? C.red : C.mint, { family: F.mono, weight: '700', maxW: 150 });
      txt(g, names[i - 1][1], 0, 22, 20, C.dim, { weight: '700' });
      if (u > aH) { const kk = pop(u, aH + (i - 1) * 0.15); g.save(); g.translate(P ? 160 : 0, P ? 0 : -86); g.scale(kk, kk); chip(g, '>99%', 0, 0, 26, '#06251b', bad ? C.red : C.gold, { family: F.grot, weight: '700' }); g.restore(); }
    }
    if (i === 4) txt(g, names[3][0], 0, P ? 0 : 74, 22, C.dim, { weight: '700' });
    g.restore();
  });
  if (u > aH) slam(g, (ZH ? '命中率 ' : 'hit rate ') + '>99%', P ? -255 : 0, P ? -60 : -250, P ? 40 : 70, C.gold, u, aH, { family: FT(), weight: '900', ring: false });
  // 故障隔离：一层出事，挡在这一层
  if (fail > 0) {
    const [x1, y1] = pos[2], [x2, y2] = pos[3], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    g.save(); g.globalAlpha = fail;
    g.fillStyle = C.gold; if (P) rr(g, mx - 110, my - 9, 220, 18, 9); else rr(g, mx - 9, my - 110, 18, 220, 9); g.fill();
    g.restore();
    stamp(g, T(TL.txt.isolated), P ? 200 : mx, P ? my : my + 190, P ? 40 : 50, C.gold, C.goldRGB, u, aIso + 0.1, -0.08);
  }
};

// 结果（高潮）：两百分之一、几分钟变几秒、CI 省回 25% 的 CPU
SHOT.results = (g, c) => {
  const u = c.u, a1 = c.k('x200', 0.8), a2 = c.k('sec', c.line(1) + 1.2), a3 = c.k('cpu');
  tint(g, C.mintRGB, 0.7 + 0.2 * Math.sin(u * 4));
  const three = c.has('cpu');
  const res = TL.txt.res.map(T);
  // 1. CPU + 内存：原来的 Git 镜像一整条，Scion 只剩一小截。镜头一开始就在，念到数字时缩下去
  {
    const [x, y] = P ? [0, -200] : three ? [-540, 0] : [-380, 0], w = P ? 640 : (three ? 440 : 600);
    const k = pop(u, 0, 0.35);
    g.save(); g.translate(x, y); g.scale(k, k);
    txt(g, res[0], 0, -80, 32, C.dim, { weight: '700' });
    const sh = ease(u, a1, a1 + 0.6);
    g.fillStyle = rgba(C.redRGB, 0.85 - 0.45 * sh); rr(g, -w / 2, -36, w, 30, 8); g.fill();
    g.fillStyle = C.mint; rr(g, -w / 2, 8, Math.max(6, w * lerp(1, 1 / 200, sh)), 30, 8); g.fill();
    txt(g, 'git mirrors', w / 2, -54, 20, C.red, { family: F.mono, align: 'right', weight: '700' });
    txt(g, 'scion', -w / 2, 60, 20, C.mint, { family: F.mono, align: 'left', weight: '700' });
    g.restore();
    slam(g, ZH ? '1/200' : '200×', x + (P ? 90 : 0), y + (P ? 110 : -170), P ? 104 : 120, C.gold, u, a1, {});
    txt(g, T(TL.txt.vsMirrors), x + (P ? 90 : 0), y + (P ? 180 : 110), 24, C.dim, { weight: '700', alpha: ease(u, a1 + 0.3, a1 + 0.6) });
  }
  // 2. 检出：几分钟 → 几秒
  if (u > c.line(1) - 0.2) {
    const [x, y] = P ? [0, 200] : three ? [0, 0] : [380, 0], k = pop(u, c.line(1) - 0.2);
    g.save(); g.translate(x, y); g.scale(k, k);
    txt(g, res[1], 0, -100, 32, C.dim, { weight: '700' });
    panel(g, -60, -60, 120, 120, { r: 60, fill: C.panel2, stroke: C.mint });
    icon(g, 'clock', 0, 0, 96, C.mint, u * (u > a2 ? 16 : 3));
    txt(g, T(TL.txt.minutes), -175, 0, 40, C.red, { weight: '900' });
    if (u > a2) line(g, -250, 0, lerp(-250, -100, ease(u, a2, a2 + 0.2)), 0, C.red, 7);
    g.restore();
    if (u > a2) slam(g, T(TL.txt.seconds), x + 185, y, P ? 72 : 80, C.mint, u, a2, { rgb: C.mintRGB, family: FT(), weight: '900' });
  }
  // 3. CI 省回 25% 的 CPU（长版）
  if (three && u > c.line(2) - 0.2) {
    const [x, y] = P ? [0, 300] : [540, 0], k = pop(u, c.line(2) - 0.2);
    g.save(); g.translate(x, y); g.scale(k, k);
    icon(g, 'chip', 0, -10, 100, C.mint);
    txt(g, res[2], 0, -100, 32, C.dim, { weight: '700' });
    g.restore();
    if (u > a3) slam(g, '+25%', x, y + (P ? 0 : 110), P ? 90 : 100, C.gold, u, a3, {});
  }
  // 彩纸：每个数字砸下来时炸一下
  for (const a of [a1, a2, a3]) {
    const d = u - a;
    if (d < 0 || d > 1.4) continue;
    for (let i = 0; i < 40; i++) {
      const ang = rand(i, a * 7) * TAU, sp = 300 + rand(i, a * 9) * 600;
      const x = Math.cos(ang) * sp * d, y = Math.sin(ang) * sp * d + 500 * d * d;
      g.save(); g.globalAlpha = clamp(1.4 - d); g.translate(x, y); g.rotate(d * 8 + i);
      g.fillStyle = [C.mint, C.gold, C.clay, C.blue][i % 4]; g.fillRect(-7, -3, 14, 6); g.restore();
    }
  }
};
