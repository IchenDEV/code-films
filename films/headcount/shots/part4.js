// 06 回收 · 尾声

// 任务树：新证据一回来，就增加、合并或者剪掉
SHOT.prune = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'r1', f);
  const sx = 230, sy = 390;
  scheduler(ctx, sx, sy, 64);
  const grow = ease(u, 0.2, q(0.15));
  // 分支：[起点y, 终点y]
  const branches = [[130, 0], [260, 1], [390, 0], [520, 2], [650, 2]];
  const cutK = ease(u, q(0.62), q(0.72)), mergeK = ease(u, q(0.5), q(0.6)), addK = ease(u, q(0.4), q(0.5));
  branches.forEach(([y], i) => {
    const isCut = i === 3 || i === 4, isMerge = i === 1 || i === 2;
    let ey = y;
    if (isMerge) ey = lerp(y, 325, mergeK);
    const fallY = isCut ? cutK * cutK * 160 : 0, fade = isCut ? 1 - ease(u, q(0.72), q(0.95)) : 1;
    // 剪掉的分支：从中间断开，后半截掉下去
    bar(ctx, sx + 70, sy, 760, ey, 10, INK, grow, { lift: 0.5, seed: i });
    const col = isCut ? [lerp(INK[0], GREY[0], cutK), lerp(INK[1], GREY[1], cutK), lerp(INK[2], GREY[2], cutK)] : INK;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, fallY);
    if (isCut) { ctx.translate(900, ey); ctx.rotate(cutK * 0.3 * (i === 3 ? 1 : -1)); ctx.translate(-900, -ey); }
    bar(ctx, 760, ey, 1500, ey, 10, col, grow, { lift: 0.5, seed: i + 5 });
    if (grow > 0.9 && !(isMerge && i === 2 && mergeK > 0.9)) memo(ctx, 1600, ey, 170, 70, '', { lines: 2, seed: i + 60, alpha: isMerge && i === 2 ? 1 - mergeK : 1 });
    ctx.restore();
  });
  // 增加的一枝
  if (addK > 0) { bar(ctx, 760, 130, 1500, 40, 10, RED, addK, { lift: 0.6 }); if (addK > 0.9) memo(ctx, 1600, 40, 170, 70, '', { lines: 2, seed: 70, col: SLIP }); }
  // 剪刀：在两枝上剪一下
  const sk = win(u, q(0.58), q(0.8), 0.2, 0.3);
  if (sk > 0) {
    for (const y of [520, 650]) {
      ctx.save(); ctx.translate(840, y); ctx.globalAlpha = sk;
      const open = 0.35 * Math.abs(Math.cos((u - q(0.58)) * 9));
      for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * open); cut(ctx, RED, P([[0, -10], [120, -4], [120, 4], [0, 10]], 2, 0.4), { lift: 1 }); cut(ctx, RED, (c) => { c.arc(-24, s * 18, 18, 0, TAU); c.arc(-24, s * 18, 9, 0, TAU, true); }, { lift: 1, rule: 'evenodd' }); ctx.restore(); }
      ctx.restore();
    }
  }
  // 新证据
  const ek = ease(u, q(0.12), q(0.35));
  if (ek > 0 && ek < 1) memo(ctx, lerp(1650, sx + 120, easeInOut(ek)), lerp(760, sy - 100, easeInOut(ek)) - Math.sin(ek * Math.PI) * 160, 240, 70, T2('新证据', 'NEW EVIDENCE'), { size: 30, rot: (1 - ek) * 0.3, col: SLIP, seed: 80 });
  if (ek >= 1) memo(ctx, sx + 120, sy - 120, 240, 70, T2('新证据', 'NEW EVIDENCE'), { size: 30, rot: -0.06, seed: 80 });
  // 预算：一根导火索，剪掉之后不再烧
  const burnStop = q(0.72), burn = clamp((Math.min(u, burnStop) - 0.2) / (dur * 1.6));
  const fx0 = 760, fx1 = 1500, fy = 800, fx = lerp(fx1, fx0 + 120, burn);
  label(ctx, '预算', 'BUDGET', fx0 - 30, fy, 30, { align: 'right', fill: INK });
  cut(ctx, KRAFT, R(fx0, fy - 7, fx - fx0, 14, 4, 0.5), { lift: 0.3 });
  if (u < burnStop + 0.2) for (let i = 0; i < 5; i++) agent(ctx, fx + rand(i, Math.floor(u * 12)) * 16, fy + (rand(i + 3, Math.floor(u * 12)) - 0.5) * 20, 5 + rand(i, 2) * 6, { col: i % 2 ? RED : [240, 160, 40], lift: 0 });
  head(ctx, '熔断', 'CUT', 1150, 720, 60, { fill: RED, alpha: ease(u, q(0.7), q(0.8)) });
};

// 调度器自己长成了中层：长出桌子、名牌、周报，圆慢慢变方
SHOT.creep = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'r2', f);
  const cx = CX, cy = 400;
  const push = lerp(1.25, 1, ease(u, 0, at(sh, 'r2', 0.35)));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(push, push); ctx.translate(-cx, -cy);
  const deskK = ease(u, q(0.3), q(0.42)), memoK = ease(u, q(0.48), q(0.62)), selfK = ease(u, q(0.6), q(0.72)), sq = ease(u, q(0.7), q(0.86)), ghost = ease(u, q(0.82), q(0.98));
  // 幽灵般的组织架构图回来了
  if (ghost > 0) orgChart(ctx, [1, 1, 1, 1, 1, 0], { col: [200, 190, 175], alpha: ghost * 0.55 });
  // 桌子
  if (deskK > 0) {
    cut(ctx, INK, R(cx - 260, 560, 520, 40, 3), { lift: 1.2, alpha: deskK });
    cut(ctx, INK, R(cx - 230, 600, 30, 200 * deskK, 4), { lift: 1, alpha: deskK });
    cut(ctx, INK, R(cx + 200, 600, 30, 200 * deskK, 5), { lift: 1, alpha: deskK });
    cut(ctx, SLIP, R(cx - 170, 500, 340, 56, 6, 1), { lift: 1, alpha: deskK });
    label(ctx, '调度中心', 'SCHEDULING DEPT.', cx, 528, 32, { alpha: deskK, fill: INK });
  }
  // 由圆变方：圆角从半径缩到 0
  const r = 110, rad = lerp(r, 6, sq);
  cut(ctx, INK, (c) => { c.roundRect(cx - r, cy - r - 30, r * 2, r * 2, rad); c.roundRect(cx - r * 0.62, cy - r * 0.62 - 30, r * 1.24, r * 1.24, rad * 0.62); }, { lift: 1.4, rule: 'evenodd' });
  cut(ctx, RED, (c) => c.roundRect(cx - r * 0.36, cy - r * 0.36 - 30, r * 0.72, r * 0.72, rad * 0.36), { lift: 0.5 });
  // 周报、请汇报
  const memos = [['周报', 'WEEKLY REPORT', -520, 230, -0.08], ['请汇报进度', 'STATUS, PLEASE', 500, 210, 0.06], ['同步会', 'SYNC MEETING', -560, 420, 0.05], ['有什么进展吗？', 'ANY UPDATE?', 540, 400, -0.05]];
  memos.forEach(([zh, en, dx, y, rot], i) => {
    const k = clamp(memoK * 4 - i);
    if (k <= 0) return;
    memo(ctx, cx + dx, y, isZH() ? 280 : 310, 70, T2(zh, en), { rot, scale: lerp(0.6, 1, back(k)), size: 30, seed: i + 90 });
  });
  // 给自己派活：一支箭头绕回自己
  if (selfK > 0) {
    ctx.save(); ctx.strokeStyle = rgba(RED); ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(cx + 150, cy - 160, 90, Math.PI * 0.9, Math.PI * 0.9 + selfK * Math.PI * 1.5); ctx.stroke(); ctx.restore();
    if (selfK > 0.95) { const a = Math.PI * 2.4, x = cx + 150 + Math.cos(a) * 90, y = cy - 160 + Math.sin(a) * 90; cut(ctx, RED, P([[x - 24, y - 10], [x + 20, y - 18], [x, y + 26]], 2, 0.4), { lift: 0.6 }); }
  }
  ctx.restore();
  head(ctx, '官僚换了个工位', 'BUREAUCRACY, AT A NEW DESK', cx, 90, 64, { fill: RED, alpha: ease(u, q(0.88), q(0.98)) });
};

// 责任留在记录、产物，和拥有目标的人身上
SHOT.ledger = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'r3', f);
  // 实例一个个消失
  for (let i = 0; i < 7; i++) {
    const k = 1 - ease(u, 0.3 + i * 0.25, 0.6 + i * 0.25);
    agent(ctx, 300 + i * 220, 150 + (i % 2) * 40, 34 * k * (1 + 0.1 * Math.sin(u * 3 + i)));
  }
  // 记录：一摞账本
  const lk = ease(u, q(0.25), q(0.4));
  for (let i = 0; i < 5; i++) {
    const k = clamp(lk * 5 - i);
    if (k <= 0) continue;
    cut(ctx, i % 2 ? INK : [60, 52, 46], R(280 + (i % 2) * 8, 700 - i * 60 - (1 - k) * 200, 320, 52, i + 3, 1), { lift: 1, alpha: k });
    cut(ctx, SLIP, R(560 + (i % 2) * 8, 708 - i * 60 - (1 - k) * 200, 30, 36, i + 9, 0.5), { lift: 0, alpha: k });
  }
  label(ctx, '可追溯的记录', 'RECORDS YOU CAN TRACE', 440, 820, 32, { fill: INK, alpha: lk });
  // 产物：带勾的纸条
  const pk = ease(u, q(0.45), q(0.6));
  for (let i = 0; i < 3; i++) {
    const k = clamp(pk * 3 - i);
    if (k <= 0) continue;
    const x = CX, y = 360 + i * 130;
    memo(ctx, x, y, 300, 96, '', { lines: 3, seed: i + 100, alpha: k, rot: (i - 1) * 0.04 });
    cut(ctx, INK, (c) => { c.arc(x + 110, y + 10, 30, 0, TAU); c.arc(x + 110, y + 10, 22, 0, TAU, true); }, { lift: 0, alpha: k, rule: 'evenodd' });
    bar(ctx, x + 98, y + 10, x + 108, y + 22, 7, RED, k, { lift: 0 }); bar(ctx, x + 108, y + 22, x + 126, y - 4, 7, RED, k, { lift: 0 });
  }
  label(ctx, '可复查的产物', 'RESULTS YOU CAN CHECK', CX, 820, 32, { fill: INK, alpha: pk });
  // 人：拿着一面红旗，指向目标
  const hk = ease(u, q(0.68), q(0.85));
  if (hk > 0) {
    figure(ctx, 1450, 760, 300 * hk, INK);
    bar(ctx, 1560, 760 - 150 * hk, 1560, 760 - 520 * hk, 10, INK, 1, { lift: 0.8 });
    const wave = Math.sin(u * 3) * 10;
    cut(ctx, RED, P([[1565, 760 - 520 * hk], [1750, 760 - 470 * hk + wave], [1565, 760 - 400 * hk]], 3, 0.6), { lift: 1 });
    label(ctx, '拥有目标的人', 'THE PERSON WHO OWNS THE GOAL', 1500, 820, 32, { fill: INK, alpha: hk });
  }
};

// 尾声：公司的样子一件件飞走
SHOT.office = (ctx, u, dur, sh) => {
  paper(ctx);
  const q = (f) => at(sh, 'e1', f);
  const dissolve = ease(u, q(0.9), q(1) + 0.6);
  // 一栋写字楼（偏左），右边是要飞走的东西
  const BX = 560;
  const bk = ease(u, 0.2, 1.2) * (1 - dissolve);
  if (bk > 0) {
    cut(ctx, INK, R(BX - 230, 140, 460, 690, 2), { lift: 1.4, alpha: bk });
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) {
      const lit = rand(r * 4 + c, Math.floor(u * 0.8)) > 0.4;
      cut(ctx, lit ? SLIP : [70, 62, 56], R(BX - 190 + c * 100, 180 + r * 76, 60, 44, r * 4 + c, 0.6), { lift: 0, alpha: bk });
    }
  }
  // 打卡、领带、面具——各自飞走
  const things = [
    [0.4, (c, k) => { cut(c, SLIP, R(-70, -100, 140, 200, 1), { lift: 1.4, alpha: k }); c.fillStyle = rgba(GREY, 0.6 * k); for (let i = 0; i < 6; i++) c.fillRect(-50, -70 + i * 28, 100, 6); cut(c, RED, R(-50, 60, 50, 20, 2, 0.5), { lift: 0, alpha: k }); }, ['打卡', 'TIME CARDS'], 1060],
    [0.58, (c, k) => { cut(c, RED, P([[-24, -110], [24, -110], [14, -80], [44, 90], [0, 130], [-44, 90], [-14, -80]], 3, 0.6), { lift: 1.4, alpha: k }); }, ['职场礼仪', 'OFFICE MANNERS'], 1380],
    [0.8, (c, k) => { for (const s of [-1, 1]) { c.save(); c.translate(s * 60, 0); c.rotate(s * 0.15); cut(c, s < 0 ? SLIP : KRAFT, (p) => { p.ellipse(0, 0, 70, 90, 0, 0, TAU); }, { lift: 1.2, alpha: k }); cut(c, INK, (p) => { p.ellipse(-24, -16, 12, 8, 0, 0, TAU); p.ellipse(24, -16, 12, 8, 0, 0, TAU); p.moveTo(-30, 40 * -s + 30); p.quadraticCurveTo(0, 40 * s + 30, 30, 40 * -s + 30); p.lineTo(30, 40 * -s + 38); p.quadraticCurveTo(0, 40 * s + 38, -30, 40 * -s + 38); }, { lift: 0, alpha: k }); c.restore(); } }, ['办公室政治', 'OFFICE POLITICS'], 1700],
  ];
  things.forEach(([f, draw, [zh, en], px]) => {
    const t0 = q(f), inK = ease(u, t0 - 0.2, t0 + 0.3), away = ease(u, t0 + 1.2, t0 + 2.2);
    if (inK <= 0 || away >= 1) return;
    const x = px, y = 420 - away * 700;
    ctx.save(); ctx.translate(x + away * 200, y); ctx.rotate(away * 1.2); ctx.scale(back(inK), back(inK));
    draw(ctx, 1 - away);
    ctx.restore();
    label(ctx, zh, en, x, 640, 34, { fill: INK, alpha: inK * (1 - away) });
    if (inK > 0.8) bar(ctx, x - 120, 640, x + 120, 640, 8, RED, ease(u, t0 + 0.4, t0 + 0.9), { lift: 0, alpha: 1 - away });
  });
};

// 任务催生组织：一个红色的任务，四周长出一圈小执行者，又散去
SHOT.final = (ctx, u, dur, sh) => {
  paper(ctx);
  const e2 = at(sh, 'e2'), e2e = at(sh, 'e2', 1);
  const cx = CX, cy = 380;
  const tk = pop(u, 0.2, 0.6);
  // 一圈执行者：长出来，又散去，再长出来
  const cyc = (u % 4) / 4;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + u * 0.2, k = Math.sin(clamp(cyc * 1.25 - i * 0.02) * Math.PI) * ease(u, 0.8, 1.6);
    const rr = 150 + 60 * k;
    agent(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 22 * k, { lift: 1 });
  }
  agent(ctx, cx, cy, 90 * tk, { lift: 1.8 });
  label(ctx, '任务', 'THE WORK', cx, cy + 4, 34, { fill: SLIP, alpha: clamp(tk) });
  const ak = ease(u, e2, lerp(e2, e2e, 0.3)), bk = ease(u, lerp(e2, e2e, 0.5), lerp(e2, e2e, 0.8));
  head(ctx, '任务催生组织', 'LET THE WORK CREATE THE TEAM', cx, 690, isZH() ? 92 : 96, { fill: INK, alpha: ak });
  ctx.save(); ctx.globalAlpha = bk;
  head(ctx, '而不是编制滋生任务', 'NOT THE HEADCOUNT CREATE THE WORK', cx, 800, isZH() ? 54 : 58, { fill: GREY });
  const w = measure(ctx, T2('而不是编制滋生任务', 'NOT THE HEADCOUNT CREATE THE WORK'), isZH() ? 54 : 58, isZH() ? DZH : DEN);
  bar(ctx, cx - w / 2 - 20, 804, cx + w / 2 + 20, 796, 8, RED, ease(u, lerp(e2, e2e, 0.85), e2e + 0.5), { lift: 0.4 });
  ctx.restore();
};

SHOT.end = (ctx, u) => {
  paper(ctx);
  const k = ease(u, 0.3, 1.3);
  agent(ctx, CX, 380, 60 * back(clamp(k)), { lift: 1.6 });
  bar(ctx, CX - 300, 520, CX + 300, 520, 6, INK, ease(u, 0.6, 1.4), { lift: 0.4 });
  head(ctx, '编制', 'HEADCOUNT', CX, 610, isZH() ? 80 : 84, { fill: INK, alpha: ease(u, 0.8, 1.6), spacing: isZH() ? '12px' : '8px' });
  txt(ctx, 'IDEVLAB', CX, 720, 34, DEN, { fill: RED, spacing: '10px', alpha: ease(u, 1.4, 2.2) });
  label(ctx, '用代码绘制、作曲与混音 · 旁白由 ElevenLabs 合成', 'Drawn, scored and mixed in code · narration by ElevenLabs', CX, 800, 24, { fill: GREY, alpha: ease(u, 1.8, 2.6) });
};
