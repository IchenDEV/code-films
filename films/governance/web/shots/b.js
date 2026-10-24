// 镜头 B：机制 —— 拆不拆（汤普森）、临时小组（明茨伯格）、怎样才算做完（产出与证据）、按成熟度放权（格鲁夫）、痛觉越级（斯塔福德·比尔）。

// —— 拆不拆：边做边商量的依赖最贵；拆成流水线，或各做各的最后汇总 ——
SHOT.coord = (g, c) => {
  const u = c.u, tMany = KT(c, 'many', 0, 0.8), tCost = KT(c, 'cost', 0, 2.5);
  const tPipe = c.k('pipe', tCost + 1.3), tSolo = c.k('solo', 1e9);
  const split = ease(u, tMany - 0.1, tMany + 0.5), pipe = ease(u, tPipe - 0.2, tPipe + 0.7), solo = ease(u, tSolo - 0.2, tSolo + 0.7);
  const tangle = P ? [[-240, -70], [220, -120], [-180, 165], [250, 135]] : [[-500, -130], [420, -170], [-380, 180], [520, 150]];
  const line4 = P ? [[-300, 60], [-100, 60], [100, 60], [300, 60]] : [[-560, 40], [-190, 40], [190, 40], [560, 40]];
  const lanes = P ? [[-260, -120], [-260, 0], [-260, 120], [-260, 240]] : [[-420, -170], [-420, -50], [-420, 70], [-420, 190]];
  const pos = (i) => {
    const a = [lerp(0, tangle[i][0], split), lerp(20, tangle[i][1], split)];
    const b = line4[i], s = lanes[i];
    const p1 = [lerp(a[0], b[0], pipe), lerp(a[1], b[1], pipe)];
    return [lerp(p1[0], s[0], solo), lerp(p1[1], s[1], solo)];
  };
  // 互相牵动的连线：每两个之间都有来回的消息；越缠越乱、越来越红
  const hot = ease(u, tCost - 0.4, tCost + 0.2) * (1 - pipe);
  if (split > 0.05 && pipe < 0.98) {
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const a = pos(i), b = pos(j), m = [(a[0] + b[0]) / 2 + Math.sin(u * 2 + i * 3 + j) * 60, (a[1] + b[1]) / 2 + Math.cos(u * 1.7 + j) * 50];
      const pts = []; for (let q = 0; q <= 16; q++) pts.push(qpt(a, m, b, q / 16));
      trail(g, pts, mixRGB(C.dimRGB, C.redRGB, hot), u * (((i + j) % 2) ? 1 : -1), { w: 4, alpha: split * (1 - pipe), speed: 90 + 120 * hot });
      if (((i * 3 + j + Math.floor(u * 2.2)) % 4) === 0 && split > 0.9) bubble(g, m[0], m[1] - 20, 0.7, ['等你', '你先', '改了吗', '?'][(i + j) % 4], { alpha: 1 - pipe, size: 26 });
    }
  }
  // 流水线：任务卡一棒一棒往下传
  if (pipe > 0.5 && solo < 0.5) {
    for (let i = 0; i < 3; i++) { const a = pos(i), b = pos(i + 1); trail(g, [[a[0] + 50, a[1]], [b[0] - 50, b[1]]], C.greenRGB, u, { w: 4, alpha: pipe * (1 - solo) }); }
    const k = ((u - tPipe) * 0.9) % 1, seg = Math.floor(((u - tPipe) * 0.9) % 3);
    if (u > tPipe + 0.4) { const a = pos(seg), b = pos(seg + 1); taskCard(g, lerp(a[0], b[0], outCubic(k)), lerp(a[1], b[1], outCubic(k)) - 70, 0.7, AG[seg]); }
  }
  // 各做各的，最后汇总
  if (solo > 0.01) {
    const mx = P ? 270 : 420, my = P ? 60 : 10;
    for (let i = 0; i < 4; i++) { const a = pos(i); trail(g, [[a[0] + 50, a[1]], [mx - 120, a[1]], [mx - 60, my]], C.greenRGB, u, { w: 4, alpha: solo, k: ease(u, tSolo + 0.2, tSolo + 1.0) }); }
    agent(g, mx, my, 0.9 * pop(u, tSolo + 0.6, 0.4), u, { color: C.boss, crown: true, seed: 9, mood: 'happy', lamp: 1 });
    chip(g, '汇总', mx, my - 100, 26, null, rgba(C.bossRGB, 0.95), { alpha: ease(u, tSolo + 0.8, tSolo + 1.1), weight: '800' });
  }
  for (let i = 0; i < 4; i++) {
    if (i && split < 0.05) continue;
    const [x, y] = pos(i);
    agent(g, x, y, (P ? 1.15 : 1.4) * (i ? clamp(split * 1.4) : 1), u, { color: AG[i], seed: i, mood: hot > 0.5 ? 'stress' : pipe > 0.5 ? 'focus' : 'ok', look: Math.sin(u * 3 + i) });
  }
  if (split > 0.05 && split < 1) glow(g, 0, 20, 160 * (1 - split), C.limeRGB, 0.6);
  // 协调成本表：连线越多越高
  const lvl = clamp(split * 0.55 + hot * 0.45) * (1 - pipe * 0.75);
  const mx0 = P ? -230 : -560, my0 = P ? -255 : -300, mw = P ? 460 : 1120;
  txt(g, '协调成本', mx0 - 10, my0, 26, C.dim, { align: 'right', weight: '800', alpha: ease(u, 0.1, 0.4) });
  g.fillStyle = C.track; rr(g, mx0, my0 - 10, mw, 20, 10); g.fill();
  g.fillStyle = rgba(mixRGB(C.greenRGB, C.redRGB, clamp(lvl * 1.3)), 0.95); rr(g, mx0, my0 - 10, mw * lvl, 20, 10); g.fill();
  if (hot > 0.6) stamp(g, '最贵', mx0 + mw * lvl - 40, my0 + 46, 34, C.red, u, tCost, 0.08);
  if (pipe > 0.5) chip(g, solo > 0.5 ? '各做各的，最后汇总' : '拆成流水线', 0, P ? 250 : 290, P ? 32 : 34, null, rgba(C.greenRGB, 0.95), { alpha: pipe, weight: '900' });
  cite(g, BOOKS.thompson, ease(u, 0.3, 0.8), { x: P ? SW - 86 : SW - 120, y: P ? SH - 100 : SH - 140, rot: 0.05 });
};

// —— 临时小组：不预设固定岗位；任务来了聚，做完就散 ——
SHOT.adhoc = (g, c) => {
  const u = c.u, tFixed = KT(c, 'fixed', 0, 0.8), tCrack = KT(c, 'crack', 1, 1.0), tTeam = KT(c, 'team', 2, 0.8);
  const tGather = c.k('gather', tTeam + 1.5), tGone = c.k('gone', tGather + 2);
  // 固定编制：一棵空着的组织树，裂开、塌下去
  const roles = ['产品经理', '架构师', '前端', '后端'];
  const fall = ease(u, tCrack, tCrack + 0.9);
  if (fall < 1) {
    const nodes = P ? [[0, -170], [-230, 0], [0, 0], [230, 0]] : [[0, -190], [-360, -10], [0, -10], [360, -10]];
    nodes.forEach(([x, y], i) => {
      const k = pop(u, tFixed - 0.6 + i * 0.12, 0.35), dy = fall * fall * (500 + i * 80), rot = fall * (i % 2 ? 0.5 : -0.4);
      if (k <= 0.01) return;
      if (i) line(g, nodes[0][0], nodes[0][1] + 40, x, y - 40 + dy, rgba(C.dimRGB, 0.5 * (1 - fall)), 3);
      g.save(); g.translate(x, y + dy); g.rotate(rot); g.scale(k, k); g.globalAlpha *= 1 - fall;
      panel(g, -105, -42, 210, 84, { fill: C.panel2, stroke: rgba(C.dimRGB, 0.6), r: 12 });
      txt(g, i ? roles[i] : '编制', 0, -6, 30, C.dim, { weight: '800' });
      txt(g, '空缺', 0, 26, 18, C.faint, { weight: '700' });
      if (u > tCrack - 0.1) line(g, -30, -42, 10, 42, rgba(C.redRGB, 0.8), 3);
      g.restore();
    });
  }
  // 任务来了：中间一颗星，几个不同专长的 Agent 聚过来；做完散开
  const star = pop(u, tTeam, 0.5), cx0 = 0, cy0 = P ? 40 : 20;
  if (star > 0.01) {
    const done = ease(u, tGone - 0.3, tGone + 0.3);
    glow(g, cx0, cy0, 140, done > 0.5 ? C.greenRGB : C.goldRGB, 0.5 * star);
    g.save(); g.translate(cx0, cy0); g.scale(star, star); g.rotate(u * 0.3 * (1 - done));
    icon(g, 'star', 0, 0, 90, done > 0.5 ? C.green : C.gold);
    g.restore();
    if (done > 0.5) badge(g, cx0 + 48, cy0 - 48, 22);
    const shelfY = P ? 250 : 280;
    for (let i = 0; i < 5; i++) {
      const home = [(i - 2) * (P ? 150 : 260), shelfY];
      const a = (i / 5) * TAU + 0.4, spot = [cx0 + Math.cos(a) * (P ? 170 : 220), cy0 + Math.sin(a) * (P ? 120 : 150)];
      const go = ease(u, tGather - 0.3 + i * 0.08, tGather + 0.5 + i * 0.08) * (1 - ease(u, tGone + 0.2 + i * 0.06, tGone + 0.9 + i * 0.06));
      const x = lerp(home[0], spot[0], go), y = lerp(home[1], spot[1], go);
      if (go > 0.6) line(g, x, y, cx0, cy0, rgba(AGRGB[i], 0.5), 3, [6, 8], -u * 30);
      agent(g, x, y, P ? 0.8 : 1.0, u, { color: AG[i], seed: i + 3, mood: go > 0.6 ? 'focus' : 'happy', look: go > 0.6 ? 0 : -0.3 });
    }
    chip(g, '技能库', 0, shelfY + 70, 22, C.ink, C.track, { alpha: star, weight: '700' });
    const lab = u < tGather ? '任务来了' : u < tGone ? '临时组队' : '做完就散';
    chip(g, lab, 0, P ? -250 : -290, 34, null, rgba(C.goldRGB, 0.95), { alpha: star, weight: '900' });
  }
  cite(g, BOOKS.mintzberg, ease(u, c.k('crack', 0.3) - 0.6, c.k('crack', 0.3)), { x: P ? SW - 86 : SW - 120, rot: 0.05 });
};

// —— 怎样才算做完：“写完了”不算，拿出对得上真实版本的证据；PR 的几道关各自验收 ——
SHOT.evidence = (g, c) => {
  const u = c.u, tDone = KT(c, 'done', 0, 0.8), tNo = c.k('notyet', tDone + 0.8), tProof = c.k('proof', tNo + 1.6);
  const tCheat = c.k('cheat', 1e9), tStages = c.k('stages', 1e9), tStd = c.k('std', 1e9);
  const stg = ease(u, tStages - 0.2, tStages + 0.6);
  const gx = P ? 200 : 330, gy = P ? 60 : 40;
  g.save(); g.globalAlpha *= 1 - stg; g.translate(0, -stg * 120);
  // 关口：先待检，“写完了”被拦下（红），带着证据再来（扫描 → 绿，通过）
  const pass = ease(u, tProof + 1.0, tProof + 1.3);
  const state = u > tProof + 1.0 ? 1 : u > tNo ? -1 : 0;
  trail(g, [[P ? -380 : -700, gy + 60], [P ? 380 : 700, gy + 60]], C.inkRGB, u, { w: 4, alpha: 0.25, flow: false });
  gate(g, gx, gy, P ? 1.7 : 2.0, state, { label: '验收' });
  // 走捷径：一条红色虚线从关口旁边绕过去（被叉掉）
  if (u > tCheat - 0.2) {
    const k = ease(u, tCheat, tCheat + 0.7);
    trail(g, [[gx - 200, gy + 40], [gx - 60, gy - 160], [gx + 160, gy - 160], [gx + 260, gy + 40]], C.redRGB, u, { k, w: 4, alpha: 0.9 });
    if (k > 0.9) { icon(g, 'cross', gx + 50, gy - 160, 60, C.red); txt(g, '捷径', gx + 50, gy - 220, 28, C.red, { weight: '900' }); }
  }
  // Agent：走向关口 → 被弹回 → 抱着证据再走过去
  let ax;
  if (u < tNo) ax = lerp(P ? -330 : -600, gx - 150, ease(u, 0, tNo));
  else if (u < tProof) ax = gx - 150 - 120 * ease(u, tNo, tNo + 0.4);
  else ax = lerp(gx - 270, gx + (P ? 190 : 300), ease(u, tProof + 0.2, tProof + 1.9));
  const bounce = u > tNo && u < tNo + 0.4 ? Math.sin(ramp(u, tNo, tNo + 0.4) * Math.PI) * 30 : 0;
  agent(g, ax, gy - bounce, P ? 1.4 : 1.65, u, { color: C.teal, seed: 4, mood: u > tNo && u < tProof ? 'stress' : u > tProof + 1.2 ? 'happy' : 'focus', look: 1 });
  if (u > tDone - 0.1 && u < tProof) bubble(g, ax, gy - 160, 1.1 * pop(u, tDone - 0.1, 0.3), '写完了 ✓', { size: 30 });
  stamp(g, '不算数', P ? -40 : -60, P ? -200 : -220, P ? 58 : 66, C.red, u, tNo, -0.1, { alpha: 1 - ease(u, tProof - 0.2, tProof + 0.2) });
  // 证据包：测试、改动、版本号（示意）
  if (u > tProof - 0.1) {
    const items = [['test', '测试通过'], ['diff', '改动'], ['tag', '版本 3f9c2e1']];
    items.forEach(([ic, s], i) => {
      const k = pop(u, tProof + i * 0.12, 0.35), x = Math.min(ax, P ? 280 : 560), y = gy - 170 - i * 62;
      if (k <= 0.01) return;
      g.save(); g.translate(x, y); g.scale(k, k);
      panel(g, -120, -26, 240, 52, { fill: C.card, stroke: C.cardLine, lw: 2.5, r: 12, shadow: false });
      icon(g, ic, -92, 0, 34, ic === 'test' ? '#1c8f5a' : '#3a3046');
      txt(g, s, 14, 2, 24, C.bubbleFg, { weight: '800' });
      g.restore();
    });
    // 扫描线
    const sk = ramp(u, tProof + 0.7, tProof + 1.1);
    if (sk > 0 && sk < 1) { g.fillStyle = rgba(C.greenRGB, 0.5); g.fillRect(gx - 60, gy - 90 + sk * 160, 120, 5); glow(g, gx, gy - 90 + sk * 160, 60, C.greenRGB, 0.6); }
  }
  if (pass > 0.01) chip(g, '对得上真实版本，才算', 0, P ? 250 : 290, P ? 32 : 34, null, rgba(C.greenRGB, 0.95), { alpha: pass, weight: '900' });
  g.restore();
  // 长版：PR 的四件事，每一件各自验收
  if (stg > 0.01) {
    const steps = ['准备好审查', '通过审查', '合并', '部署'];
    const xs = P ? [-300, -100, 100, 300] : [-540, -180, 180, 540];
    steps.forEach((s, i) => {
      const k = pop(u, tStages + 0.2 + i * 0.35, 0.4), lit = ease(u, tStages + 0.6 + i * 0.5, tStages + 0.9 + i * 0.5);
      if (i) arrow(g, xs[i - 1] + (P ? 60 : 90), 40, xs[i] - (P ? 60 : 90), 40, rgba(C.inkRGB, 0.5 * k), 4, k, 14);
      g.save(); g.translate(xs[i], 40); g.scale(k, k);
      gate(g, 0, 0, P ? 0.7 : 0.9, lit > 0.5 ? 1 : 0);
      txt(g, s, 0, P ? 90 : 110, P ? 26 : 30, lit > 0.5 ? C.green : C.ink, { weight: '900' });
      g.restore();
    });
    chip(g, '几件完全不同的事', 0, P ? -250 : -280, 34, null, rgba(C.goldRGB, 0.95), { alpha: stg, weight: '900' });
  }
  if (tStd < 1e8) {
    chip(g, '产出标准化', P ? 0 : -360, P ? -250 : -290, 32, null, rgba(C.goldRGB, 0.95), { alpha: win(u, tStd, tDone - 0.2), weight: '900' });
    cite(g, BOOKS.mintzberg, win(u, tStd - 0.3, tDone, 0.4, 0.4), { x: P ? SW - 86 : SW - 120, rot: 0.05 });
  }
};

// —— 按成熟度放权：日常生产是黑盒；越熟练，绿色的授权范围越大；管理者只在关键处抽查 ——
SHOT.maturity = (g, c) => {
  const u = c.u, tBox = KT(c, 'box', 1, 0.8), tMat = KT(c, 'mature', 2, 0.6), tCheck = c.k('check', tMat + 1.6);
  const bx = P ? 0 : -380, by = P ? -120 : 0;
  // 黑盒：任务卡进去、带勾的卡出来
  const kb = pop(u, tBox - 0.2, 0.45);
  if (kb > 0.01) {
    g.save(); g.translate(bx, by); g.scale(kb * (P ? 0.8 : 1), kb * (P ? 0.8 : 1));
    panel(g, -130, -100, 260, 200, { fill: '#08070b', stroke: rgba(C.inkRGB, 0.5), r: 18 });
    txt(g, '日常生产', 0, -20, 34, '#f6f1e7', { weight: '900' }); txt(g, '黑盒', 0, 30, 30, '#a39cae', { weight: '800' });
    for (let i = 0; i < 3; i++) {
      const k = (u * 0.7 + i / 3) % 1;
      taskCard(g, -260 + k * 120, -40 + i * 40, 0.6, AG[i], { alpha: clamp(k * 4) * clamp((1 - k) * 4) });
      taskCard(g, 150 + k * 120, -40 + i * 40, 0.6, AG[i], { check: true, alpha: clamp(k * 4) * clamp((1 - k) * 4) });
    }
    g.restore();
  }
  // 成熟度滑杆与授权范围
  const lv = ease(u, tMat, tMat + 1.6);
  const sx = P ? -280 : 60, sy = P ? 250 : 260, sw = P ? 560 : 640;
  if (u > tMat - 0.5) {
    const a = ease(u, tMat - 0.5, tMat);
    g.save(); g.globalAlpha *= a;
    txt(g, '任务成熟度', sx, sy - 44, 26, C.dim, { align: 'left', weight: '800' });
    g.fillStyle = C.track; rr(g, sx, sy - 8, sw, 16, 8); g.fill();
    g.fillStyle = rgba(C.greenRGB, 0.9); rr(g, sx, sy - 8, sw * (0.15 + 0.85 * lv), 16, 8); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.arc(sx + sw * (0.15 + 0.85 * lv), sy, 18, 0, TAU); g.fill();
    txt(g, '低', sx, sy + 40, 22, C.dim, { weight: '700' }); txt(g, '高', sx + sw, sy + 40, 22, C.dim, { weight: '700' });
    const zx = P ? 0 : 380, zy = P ? 90 : -20, zr = (P ? 90 : 110) + lv * (P ? 150 : 200);
    g.fillStyle = rgba(C.greenRGB, 0.12); g.strokeStyle = rgba(C.greenRGB, 0.7); g.lineWidth = 3; g.setLineDash([10, 8]);
    g.beginPath(); g.ellipse(zx, zy, zr, zr * 0.62, 0, 0, TAU); g.fill(); g.stroke(); g.setLineDash([]);
    txt(g, '授权范围', zx, zy - zr * 0.62 - 26, 26, C.green, { weight: '900' });
    for (let i = 0; i < 3; i++) agent(g, zx + (i - 1) * 130 * (0.6 + 0.4 * lv), zy + 10, P ? 0.8 : 1.0, u, { color: AG[i], seed: i, mood: lv > 0.6 ? 'happy' : 'focus' });
    // 抽查：一束暖光扫过来，停在一个 Agent 身上，打勾
    if (u > tCheck - 0.3) {
      const k = ease(u, tCheck - 0.3, tCheck + 0.5), tx2 = zx + 110 * (0.6 + 0.4 * lv);
      g.save(); g.globalCompositeOperation = 'lighter';
      const grd = g.createLinearGradient(tx2, zy - 300, tx2, zy);
      grd.addColorStop(0, rgba(C.warmRGB, 0)); grd.addColorStop(1, rgba(C.warmRGB, 0.35 * k));
      g.fillStyle = grd; g.beginPath(); g.moveTo(tx2 - 20, zy - 320); g.lineTo(tx2 + 20, zy - 320); g.lineTo(tx2 + 80, zy + 40); g.lineTo(tx2 - 80, zy + 40); g.closePath(); g.fill();
      g.restore();
      if (k > 0.9) badge(g, tx2 + 40, zy - 70, 20);
      chip(g, '只在关键处抽查', zx, zy + zr * 0.62 + 40, 26, null, rgba(C.warmRGB, 0.95), { alpha: k, weight: '800' });
    }
    g.restore();
  }
  if (u < tBox) txt(g, '什么能自己定？', 0, 0, P ? 64 : 76, C.ink, { weight: '900', alpha: ease(u, 0.1, 0.4) * (1 - ease(u, tBox - 0.4, tBox - 0.1)), stroke: 10 });
  cite(g, { title: BOOKS.grove.title, author: BOOKS.grove.author, en: BOOKS.grove.en, year: BOOKS.grove.year, color: BOOKS.grove.color }, ease(u, tBox - 0.6, tBox - 0.1), { x: P ? SW - 86 : SW - 120, rot: 0.05 });
};

// —— 痛觉越级：平时在授权范围里自己跑；高风险、超预算、跑偏时，信号绕过中间层，熔断，直接到人 ——
SHOT.pain = (g, c) => {
  const u = c.u;
  const tAlarm = KT(c, 'alarm', c.n > 2 ? 2 : 0, 2.2), tSkip = c.k('skip', tAlarm + 1.0), tHuman = c.k('human', tSkip + 0.6), tFuse = c.k('fuse', tSkip + 0.4);
  const tRoutine = c.k('routine', 0.4), tNerve = c.k('nerve', 1e9), tProbe = c.k('probe', 1e9), tInst = c.k('inst', 1e9);
  const topY = P ? -215 : -250, botY = P ? 185 : 220, bandY = P ? [-70, 40] : [-90, 50];
  const hx = P ? 0 : 0;
  // 神经网络的底纹（长版：把组织看成神经系统）
  const nerve = ease(u, tNerve, tNerve + 1);
  if (nerve > 0.01) for (let i = 0; i < 12; i++) {
    const x0 = (rand(i, 2) - 0.5) * (P ? 760 : 1500), pts = [[x0, botY + 40]];
    for (let j = 1; j <= 5; j++) pts.push([x0 * (1 - j / 5) + Math.sin(i + j) * 40, lerp(botY + 40, topY, j / 5)]);
    trail(g, pts, C.violetRGB, u, { w: 2, alpha: 0.35 * nerve, k: nerve, outline: false });
  }
  // 中间层：两条横带，汇报一格一格往上走，还被“美化”成绿色
  ['协调层', '汇报层'].forEach((s, i) => {
    const y = bandY[i];
    g.fillStyle = C.band; rr(g, P ? -380 : -620, y - 34, P ? 760 : 1240, 68, 16); g.fill();
    txt(g, s, P ? -360 : -600, y, 22, C.dim, { align: 'left', weight: '800' });
    for (let j = 0; j < 3; j++) agent(g, (j - 1) * (P ? 170 : 260) + (P ? 60 : 80), y, 0.45, u, { color: C.boss, seed: 10 + i * 3 + j, mood: 'focus', still: true });
  });
  for (let i = 0; i < 3; i++) {
    const k = ((u * 0.22 + i / 3) % 1), y = lerp(botY - 40, topY + 60, k), x = (P ? -170 : -300) + i * 30;
    const col = mixRGB(C.coralRGB, C.greenRGB, clamp((botY - y) / (botY - topY) * 1.6));
    g.fillStyle = rgba(col, 0.9); rr(g, x - 16, y - 11, 32, 22, 4); g.fill();
  }
  if (u > tRoutine) txt(g, '层层汇报 · 层层美化', P ? -120 : -300, bandY[0] - 50, 22, C.dim, { weight: '700', alpha: ease(u, tRoutine, tRoutine + 0.4) * 0.8 });
  // 底层：绿色授权范围里干活的 Agent
  const zw = P ? 720 : 1200;
  g.fillStyle = rgba(C.greenRGB, 0.1); g.strokeStyle = rgba(C.greenRGB, 0.6); g.lineWidth = 3; g.setLineDash([10, 8]);
  rr(g, -zw / 2, botY - 70, zw, 140, 30); g.fill(); g.stroke(); g.setLineDash([]);
  txt(g, '授权范围', zw / 2 - 20, botY - 92, 22, C.green, { align: 'right', weight: '900' });
  const alarm = ease(u, tAlarm - 0.1, tAlarm + 0.3);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * (P ? 170 : 280), bad = i === 2;
    agent(g, x, botY, P ? 0.72 : 0.95, u, { color: AG[i], seed: i, mood: bad && alarm > 0.5 ? 'stress' : 'focus', lamp: bad ? alarm : 0.3, lampRGB: bad ? C.alarmRGB : undefined });
    if (bad && alarm > 0.01) glow(g, x, botY, 120 + 40 * Math.sin(u * 12), C.alarmRGB, 0.6 * alarm);
  }
  // 探针（长版）：从人直插底层
  if (u > tProbe - 0.2) {
    const k = ease(u, tProbe, tProbe + 0.6), x = (P ? -0.5 : -0.5) * (P ? 170 : 280);
    line(g, x, topY + 50, x, lerp(topY + 50, botY - 50, k), rgba(C.tealRGB, 0.9), 4, [8, 8], -u * 40);
    txt(g, '越级探针', x - 16, lerp(topY + 50, botY - 50, 0.5), 22, C.teal, { align: 'right', weight: '800', alpha: k });
  }
  // 警报：几个原因弹出来，然后一道橙红的信号从侧面直冲到人
  if (alarm > 0.01) {
    const why = ['高风险', '超预算', '跑偏'];
    why.forEach((s, i) => chip(g, s, (P ? 85 : 140) + (i - 1) * (P ? 150 : 170), botY + (P ? 100 : 105), 24, null, rgba(C.alarmRGB, 0.95), { alpha: ease(u, tAlarm + i * 0.15, tAlarm + 0.25 + i * 0.15), weight: '900' }));
  }
  const sk = ease(u, tSkip - 0.1, tSkip + 0.5);
  if (sk > 0.01) {
    const sx = P ? 85 : 140, side = P ? 360 : 700;
    trail(g, [[sx, botY - 40], [side, botY - 80], [side, topY + 20], [hx + 70, topY]], C.alarmRGB, u, { k: sk, w: 8, speed: 260 });
    const [px, py] = pathAt([[sx, botY - 40], [side, botY - 80], [side, topY + 20], [hx + 70, topY]], sk);
    glow(g, px, py, 70, C.alarmRGB, 0.9 * (1 - ease(u, tSkip + 0.5, tSkip + 1.0)));
    txt(g, '越级', side - 24, botY - 150, P ? 36 : 42, C.alarm, { align: 'right', weight: '900', alpha: sk, stroke: 6 });
  }
  // 熔断开关
  if (u > tFuse - 0.1 && (c.has('fuse') || c.has('skip'))) {
    const k = pop(u, tFuse, 0.3), fx = P ? 250 : 560, fy = bandY[0] - 10;
    g.save(); g.translate(fx, fy); g.scale(k, k);
    panel(g, -60, -40, 120, 80, { fill: C.panel, stroke: C.alarm, lw: 4, r: 12 });
    g.save(); g.rotate(-0.6 * ease(u, tFuse, tFuse + 0.2)); g.fillStyle = C.alarm; rr(g, -8, -34, 16, 40, 6); g.fill(); g.restore();
    txt(g, '熔断', 0, 62, 26, C.alarm, { weight: '900' });
    g.restore();
  }
  // 人：在最上面，信号到了才抬头
  const seen = ease(u, tHuman - 0.2, tHuman + 0.3);
  human(g, hx, topY, P ? 0.75 : 0.85, u, { mouth: seen > 0.5 ? 'open' : 'smile', mug: seen < 0.5, arm: seen > 0.5 ? 0.8 : 0, look: seen > 0.5 ? 1 : 0 });
  if (seen > 0.01) { glow(g, hx + 60, topY - 30, 90, C.alarmRGB, 0.6 * seen); stamp(g, '找人', hx - (P ? 150 : 170), topY, 40, C.alarm, u, tHuman, -0.08); }
  if (u > tInst - 0.2) chip(g, '这已经是在设计组织的制度', 0, 0, P ? 32 : 38, null, rgba(C.goldRGB, 0.95), { alpha: ease(u, tInst, tInst + 0.4), weight: '900' });
  cite(g, BOOKS.beer, c.has('nerve') ? ease(u, tNerve - 0.4, tNerve + 0.2) : ease(u, 0.3, 0.8), { x: P ? -SW + 86 : -SW + 120, y: P ? -SH + 112 : -SH + 150 });
};
