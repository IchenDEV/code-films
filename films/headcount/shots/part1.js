// 片名 · 冷开场 · 01 编制
const ROLES = [['产品', 'PRODUCT'], ['架构', 'ARCHITECT'], ['后端', 'BACKEND'], ['前端', 'FRONTEND'], ['测试', 'QA'], ['项目经理', 'PM']];
// 组织架构图：项目经理在顶上，两层下属
const OX = 720;
const ORG = [
  [OX - 400, 300], [OX + 100, 300],
  [OX - 560, 490], [OX - 150, 490], [OX + 260, 490],
  [OX - 150, 110],
];
const DW = 300, DH = 116;
const BUG = [1580, 720];
// 连线：上级底部中点 → 下级顶部中点
const LINKS = [[5, 0], [5, 1], [0, 2], [0, 3], [1, 4]];
function orgChart(ctx, ks, o = {}) {
  const col = o.col ?? INK, a = o.alpha ?? 1;
  LINKS.forEach(([p, c], i) => {
    const k = Math.min(ks[p], ks[c]);
    if (k <= 0) return;
    const [px, py] = ORG[p], [cx, cy] = ORG[c], mid = (py + DH + cy) / 2;
    const x0 = px + DW / 2, x1 = cx + DW / 2;
    bar(ctx, x0, py + DH, x0, mid, 8, col, clamp(k * 2), { lift: 0.4, alpha: a, seed: i });
    bar(ctx, x0, mid, x1, mid, 8, col, clamp(k * 2 - 0.5), { lift: 0.4, alpha: a, seed: i + 9 });
    bar(ctx, x1, mid, x1, cy, 8, col, clamp(k * 2 - 1), { lift: 0.4, alpha: a, seed: i + 19 });
  });
  ORG.forEach(([x, y], i) => {
    const k = ks[i];
    if (k <= 0) return;
    const dy = (1 - Math.min(1, k)) * -260;
    desk(ctx, x, y + dy, DW, DH, ROLES[i][0], ROLES[i][1], { col: i === 5 ? (o.pm ?? col) : col, alpha: a * clamp(k * 3), seed: i + 1, lift: 1 + (1 - clamp(k)) * 2 });
  });
}
const deskCenter = (i) => [ORG[i][0] + DW / 2, ORG[i][1] + DH / 2];

SHOT.title = (ctx, u) => {
  paper(ctx);
  // 方格阵：整齐的工位
  const hit = 2.1;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const i = r * 6 + c, k = pop(u, 0.15 + i * 0.03, 0.3);
    if (k <= 0) continue;
    let x = 1000 + c * 120, y = 250 + r * 120, rot = 0;
    const d = Math.hypot(x - 1500, y - 520), blast = ease(u, hit, hit + 1.2) * Math.max(0, 1 - d / 700);
    x += blast * (x - 1300) * 0.5 + blast * 40; y += blast * (y - 400) * 0.6 - blast * 60 + blast * blast * 200; rot = blast * (rand(i, 2) - 0.5) * 2.4;
    ctx.save(); ctx.translate(x + 45, y + 45); ctx.rotate(rot); ctx.scale(k, k);
    cut(ctx, INK, R(-45, -45, 90, 90, i), { lift: 1 + blast * 2 });
    ctx.restore();
  }
  // 红色楔子从右下刺进来
  const wk = ease(u, 1.3, hit);
  if (wk > 0) {
    const tipX = lerp(2300, 1380, wk), tipY = lerp(1000, 560, wk);
    cut(ctx, RED, P([[tipX, tipY], [tipX + 900, tipY + 180], [tipX + 820, tipY + 420]], 2, 1), { lift: 1.6 });
  }
  // 斜杠
  bar(ctx, 100, 930, 900, 820, 22, INK, ease(u, 0.6, 1.4), { seed: 5 });
  const tk = ease(u, 1.6, 2.4), sk = ease(u, 2.6, 3.4);
  ctx.save(); ctx.globalAlpha = tk; ctx.translate(lerp(-80, 0, back(tk)), 0);
  if (isZH()) {
    txt(ctx, '编制', 520, 470, 330, DZH, { fill: INK });
    txt(ctx, 'HEADCOUNT', 520, 680, 64, DEN, { fill: RED, spacing: '14px' });
  } else {
    txt(ctx, 'HEAD', 520, 380, 260, DEN, { fill: INK, spacing: '6px' });
    txt(ctx, 'COUNT', 520, 600, 260, DEN, { fill: INK, spacing: '6px' });
  }
  ctx.restore();
  label(ctx, '反对 AI 官僚主义', 'AGAINST AI BUREAUCRACY', 520, isZH() ? 770 : 770, 38, { alpha: sk, fill: INK, spacing: isZH() ? '6px' : '3px' });
};

SHOT.tower = (ctx, u, dur, sh) => {
  paper(ctx);
  const f = (q) => at(sh, 'n1', q);
  const ks = [0.27, 0.34, 0.42, 0.48, 0.55, 0.82].map((q) => ease(u, f(q), f(q) + 0.5));
  // 那个小小的错误，一直在右下角
  bug(ctx, BUG[0], BUG[1], 26 * ease(u, 0.2, 0.8), u);
  label(ctx, '登录异常', 'LOGIN BUG', BUG[0], BUG[1] + 90, 30, { alpha: ease(u, 0.5, 1.1), fill: RED });
  orgChart(ctx, ks, { pm: RED });
};

// 消息在工位之间飞：沿弧线
function flying(ctx, from, to, k, s, o = {}) {
  if (k <= 0 || k >= 1) return;
  const [x0, y0] = deskCenter(from), [x1, y1] = deskCenter(to), e = easeInOut(k);
  const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(e * Math.PI) * (o.arc ?? 140);
  memo(ctx, x, y, o.w ?? 70, o.h ?? 46, s, { rot: (k - 0.5) * 0.5, lines: o.lines, size: o.size, lift: 2, seed: o.seed });
}
SHOT.chatter = (ctx, u, dur, sh) => {
  paper(ctx);
  orgChart(ctx, [1, 1, 1, 1, 1, 1], { pm: RED });
  bug(ctx, BUG[0], BUG[1], 26, u);
  label(ctx, '登录异常', 'LOGIN BUG', BUG[0], BUG[1] + 90, 30, { fill: RED });
  clock(ctx, 1640, 230, 90, u * 3);
  label(ctx, '等待中', 'WAITING', 1640, 360, 30, { fill: INK });
  // 小纸条不停地在工位之间转
  const pairs = [[5, 2], [2, 0], [0, 5], [5, 4], [4, 1], [1, 3], [3, 5], [5, 0]];
  for (let i = 0; i < 14; i++) {
    const [a, b] = pairs[i % pairs.length], period = 1.6;
    const k = ((u - 0.2 + i * 0.37) % period) / period;
    if (u < 0.2 + (i % 5) * 0.2) continue;
    flying(ctx, a, b, k, '·', { w: 46, h: 30, lines: 1, arc: 90 + (i % 3) * 40, seed: i });
  }
  // 三条“台词”纸条
  const msgs = [['请确认是否已复现。', 'Can you reproduce it?', 0.18, [5, 4]], ['上下文已转交后端。', 'Context → backend.', 0.48, [0, 2]], ['有什么进展吗？', 'Any update?', 0.76, [5, 3]]];
  msgs.forEach(([zh, en, q, [a, b]], i) => {
    const t0 = at(sh, 'n2', q), k = ease(u, t0, t0 + 0.9);
    const [x0, y0] = deskCenter(a), [x1, y1] = deskCenter(b);
    const x = lerp(x0, x1 + (i - 1) * 60, k), y = lerp(y0, y1, k) - Math.sin(k * Math.PI) * 160 - 120;
    const fade = 1 - ease(u, t0 + 2.6, t0 + 3.2);
    if (k > 0) memo(ctx, x, y, isZH() ? 330 : 340, 66, T2(zh, en), { rot: -0.04 + i * 0.04, alpha: fade, size: 28, lift: 2, seed: i + 7 });
  });
};

SHOT.direct = (ctx, u, dur, sh) => {
  paper(ctx);
  const dim = ease(u, 0, 1.2);
  // 组织架构图褪成灰色
  orgChart(ctx, [1, 1, 1, 1, 1, 1], { col: [lerp(INK[0], 200, dim), lerp(INK[1], 192, dim), lerp(INK[2], 178, dim)], pm: [lerp(RED[0], 210, dim), lerp(RED[1], 190, dim), lerp(RED[2], 175, dim)], alpha: 1 - 0.4 * dim });
  const t0 = at(sh, 'n3', 0.2), t1 = at(sh, 'n3', 0.72), k = ease(u, t0, t1);
  const sx = 120, sy = BUG[1];
  const fixed = ease(u, t1, t1 + 0.4);
  // 一条直线：一个执行者直奔问题
  if (k > 0) arrow(ctx, sx, sy, BUG[0] - 80, sy, 18, RED, k, { seed: 3 });
  agent(ctx, lerp(sx, BUG[0] - 110, k), sy, 34 * ease(u, t0 - 0.4, t0) * (1 - fixed), { lift: 1.5 });
  if (fixed < 1) bug(ctx, BUG[0], BUG[1], 26 * (1 - fixed), u);
  if (fixed > 0) {
    cut(ctx, INK, (c) => { c.arc(BUG[0], BUG[1], 46 * back(fixed), 0, TAU); c.arc(BUG[0], BUG[1], 34 * back(fixed), 0, TAU, true); }, { lift: 1 });
    bar(ctx, BUG[0] - 20, BUG[1], BUG[0] - 4, BUG[1] + 16, 9, INK, fixed, { lift: 0 });
    bar(ctx, BUG[0] - 4, BUG[1] + 16, BUG[0] + 24, BUG[1] - 18, 9, INK, clamp(fixed * 2 - 1), { lift: 0 });
  }
  head(ctx, '2 分钟', '2 MIN', (sx + BUG[0]) / 2, sy - 70, 70, { alpha: ease(u, t1, t1 + 0.5), fill: RED });
};

SHOT.stamp = (ctx, u, dur, sh) => {
  paper(ctx);
  const t = (q) => at(sh, 'n4', q);
  // 一页系统提示词
  const px = CX - 360, py = 70, pw = 720, ph = 780;
  cut(ctx, SLIP, R(px, py, pw, ph, 3), { lift: 1.4 });
  label(ctx, '系统提示词', 'SYSTEM PROMPT', px + 60, py + 70, 40, { align: 'left', fill: INK });
  for (let i = 0; i < 18; i++) {
    const k = ease(u, 0.3 + i * 0.08, 0.6 + i * 0.08);
    ctx.fillStyle = rgba(GREY, 0.6); ctx.fillRect(px + 60, py + 130 + i * 34, (pw - 120) * (0.45 + rand(i, 4) * 0.55) * k, 10);
  }
  // 橡皮章落下，印出一张组织架构图
  const hit = t(0.62), s = ease(u, hit - 0.7, hit), up = ease(u, hit + 0.15, hit + 0.8);
  const ink = ease(u, hit, hit + 0.05);
  if (ink > 0) {
    ctx.save(); ctx.translate(CX + 20, 470); ctx.rotate(-0.08); ctx.globalAlpha = 0.88;
    ctx.strokeStyle = rgba(RED); ctx.lineWidth = 10; ctx.strokeRect(-250, -190, 500, 380);
    ctx.fillStyle = rgba(RED);
    const mini = [[-50, -150], [-170, -60], [70, -60], [-230, 30], [-50, 30], [130, 30]];
    mini.forEach(([x, y]) => ctx.fillRect(x, y, 100, 50));
    ctx.fillRect(-3, -100, 6, 24); ctx.fillRect(-123, -82, 246, 6); ctx.fillRect(-123, -82, 6, 22); ctx.fillRect(117, -82, 6, 22);
    ctx.fillRect(-123, -10, 6, 20); ctx.fillRect(-183, 4, 190, 6); ctx.fillRect(117, -10, 6, 40);
    txt(ctx, T2('编制', 'HEADCOUNT'), 0, 135, 66, isZH() ? DZH : DEN, { fill: RED, spacing: isZH() ? '20px' : '8px' });
    ctx.restore();
  }
  // 印章本身
  const sy = lerp(-420, 270, s) - up * 700;
  if (s > 0 && up < 1) {
    ctx.save(); ctx.translate(CX + 20, sy); ctx.rotate(-0.08);
    cut(ctx, KRAFT, R(-60, -260, 120, 220, 2), { lift: 2 });
    cut(ctx, INK, R(-270, -60, 540, 70, 4), { lift: 2 });
    cut(ctx, RED, R(-260, 10, 520, 30, 5), { lift: 1 });
    ctx.restore();
  }
};

// 01 · 编制：手段变成了目的
SHOT.loop = (ctx, u, dur, sh) => {
  paper(ctx);
  const cx = CX, cy = 450, r = 300, spin = u * 0.25;
  const names = [['角色', 'ROLES'], ['层级', 'LAYERS'], ['审批', 'APPROVALS'], ['汇报', 'REPORTS']];
  // 环形的箭头
  for (let i = 0; i < 4; i++) {
    const a0 = spin + (i / 4) * TAU + 0.42, a1 = spin + ((i + 1) / 4) * TAU - 0.42, k = ease(u, 0.6 + i * 0.25, 1.2 + i * 0.25);
    ctx.save(); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 14; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, lerp(a0, a1, k)); ctx.stroke(); ctx.restore();
    if (k > 0.98) {
      const ax = cx + Math.cos(a1) * r, ay = cy + Math.sin(a1) * r, d = a1 + Math.PI / 2;
      cut(ctx, INK, P([[ax + Math.cos(d) * 30, ay + Math.sin(d) * 30], [ax + Math.cos(d + 2.2) * 26, ay + Math.sin(d + 2.2) * 26], [ax + Math.cos(d - 2.2) * 26, ay + Math.sin(d - 2.2) * 26]], i), { lift: 0.5 });
    }
  }
  // 算力：一颗颗红点绕着圈跑，没有一颗进到中间
  const flow = ease(u, at(sh, 'd1', 0.5), at(sh, 'd1', 0.6));
  for (let i = 0; i < 26; i++) {
    const a = spin * 3 + (i / 26) * TAU;
    agent(ctx, cx + Math.cos(a) * (r + 46), cy + Math.sin(a) * (r + 46), 9 * flow, { lift: 0.5 });
  }
  names.forEach(([zh, en], i) => {
    const a = spin + (i / 4) * TAU, k = pop(u, 0.2 + i * 0.2, 0.4);
    if (k <= 0) return;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    desk(ctx, -110, -50, 220, 100, zh, en, { seed: i + 2 });
    ctx.restore();
  });
  // 中间：真正的问题，没人碰
  const pk = pop(u, at(sh, 'd1', 0.62), 0.5);
  if (pk > 0) {
    cut(ctx, SLIP, C(cx, cy, 110 * pk), { lift: 1 });
    bug(ctx, cx, cy - 10, 20 * pk, u);
    label(ctx, '问题', 'THE PROBLEM', cx, cy + 58, 26, { fill: INK, alpha: clamp(pk) });
  }
};

// 先挂好工位牌，再让每件事走完整条流水线
SHOT.belt = (ctx, u, dur, sh) => {
  paper(ctx);
  const d2 = at(sh, 'd2'), d3 = at(sh, 'd3'), y = 640;
  const stop = ease(u, d3 - 0.2, d3 + 0.6);
  // 先说不是什么问题：Agent 多、有人协调，都没问题
  const ok = win(u, 0.2, at(sh, 'd2', 0.5), 0.5, 0.6);
  if (ok > 0) {
    ctx.save(); ctx.globalAlpha = ok;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + u * 0.5, rr = 170 + 30 * Math.sin(u * 2 + i);
      agent(ctx, 640 + Math.cos(a) * rr, 380 + Math.sin(a) * rr * 0.7, 18 * ease(u, 0.2 + i * 0.05, 0.5 + i * 0.05));
    }
    scheduler(ctx, 1280, 380, 70 * ease(u, at(sh, 'd2', 0.18), at(sh, 'd2', 0.25)));
    label(ctx, 'Agent 多 · 没问题', 'MANY AGENTS: FINE', 640, 600, 34, { fill: INK, alpha: ease(u, at(sh, 'd2', 0.05), at(sh, 'd2', 0.15)) });
    label(ctx, '有人协调 · 没问题', 'A COORDINATOR: FINE', 1280, 600, 34, { fill: INK, alpha: ease(u, at(sh, 'd2', 0.2), at(sh, 'd2', 0.3)) });
    ctx.restore();
  }
  // 工位牌从上面挂下来
  const N = 6, x0 = 170, step = 290;
  for (let i = 0; i < N; i++) {
    const k = ease(u, at(sh, 'd2', 0.45) + i * 0.12, at(sh, 'd2', 0.45) + i * 0.12 + 0.5);
    const x = x0 + i * step, yy = lerp(-160, 260, back(k));
    if (k <= 0) continue;
    bar(ctx, x + 115, 0, x + 115, yy, 4, INK, 1, { lift: 0.2 });
    desk(ctx, x, yy, 230, 100, ROLES[i][0], ROLES[i][1], { col: i === 5 ? RED : INK, seed: i + 3, rot: Math.sin(u * 1.4 + i) * 0.03 * (1 - stop) });
  }
  // 传送带
  cut(ctx, INK, R(0, y + 40, W, 34, 1), { lift: 1 });
  const ue = Math.min(u, d3 + 0.3), roll = ue;
  for (let i = 0; i < 24; i++) {
    const rx = ((i * 90 - roll * 120) % (W + 90) + W + 90) % (W + 90) - 45;
    cut(ctx, KRAFT, C(rx, y + 57, 10), { lift: 0 });
  }
  // 任务：大大小小都在每个工位前停一下
  const flowStart = at(sh, 'd2', 0.7);
  for (let j = 0; j < 4; j++) {
    const tt = Math.max(0, ue - flowStart - j * 1.3);
    if (u < flowStart + j * 1.3) continue;
    // 走走停停：在每个工位下面停一下
    const seg = tt / 0.85, whole = Math.floor(seg), frac = seg - whole;
    const x = x0 + 115 + (whole - 1 + smooth(clamp(frac * 2))) * step;
    const s = [52, 20, 36, 14][j];
    cut(ctx, RED, R(x - s / 2, y + 40 - s, s, s, j + 5, 1), { lift: 1 });
  }
  // “凭什么？”
  const qk = pop(u, at(sh, 'd3', 0.62), 0.45);
  if (qk > 0) {
    ctx.save(); ctx.translate(CX, 470); ctx.scale(qk, qk); ctx.rotate(-0.06);
    cut(ctx, RED, C(0, 0, 130), { lift: 2 });
    head(ctx, '凭什么？', 'WHY HERE?', 0, 4, isZH() ? 64 : 72, { fill: SLIP });
    ctx.restore();
  }
};
