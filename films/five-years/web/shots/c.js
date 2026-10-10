// 2026：Agent 管 Agent（动态组织）、Cursor Projects、2024 年的架构、验证闭环、Harness Engineering。

// —— 协调者 ——
function coordinator(g, x, y, u, k = 1, size = 1) {
  if (k <= 0) return;
  glow(g, x, y, 220 * size * k + 20 * Math.sin(u * 3), C.violetRGB, 0.55 * k);
  glow(g, x, y, 70 * size * k, C.whiteRGB, 0.95 * k, 1);
  g.save();
  g.strokeStyle = rgba(C.violetRGB, 0.8 * k); g.lineWidth = 2.5;
  for (let r = 0; r < 2; r++) {
    g.beginPath(); g.ellipse(x, y, 92 * size, 34 * size, u * (r ? -0.8 : 0.6) + r * 1.2, 0, TAU); g.stroke();
  }
  for (let i = 0; i < 6; i++) { const a = u * 1.4 + (i / 6) * TAU; glow(g, x + Math.cos(a) * 92 * size, y + Math.sin(a) * 34 * size, 10, C.whiteRGB, k, 1); }
  g.restore();
}

// 动态组织：所有节点由 cue 时刻推出（纯函数）
function orgNodes(cue, dur, short) {
  const S = [];
  const R1 = PORTRAIT ? 330 : 400;
  const add = (o) => (S.push(o), o);
  const scout = cue('scout', -1), fan = cue('fan', -1), chain = cue('chain', -1), sub = cue('sub', -1);
  const reclaim = cue('reclaim', -1), reroute = cue('reroute', -1), count = cue('count', -1);
  const endT = dur + 5;
  const pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r * (PORTRAIT ? 1.05 : 0.78)];
  if (scout > 0) for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * 0.75;
    add({ type: 'scout', born: scout + i * 0.12, die: (fan > 0 ? fan - 0.2 : scout + 2), pos: pol(a, R1 * 1.05), parent: null, rgb: [140, 210, 255] });
  }
  if (fan > 0) for (let i = 0; i < 6; i++) {
    const a = (PORTRAIT ? -0.55 : -0.7) + i * (PORTRAIT ? 0.3 : 0.28);
    const die = reclaim > 0 ? reclaim + i * 0.12 : endT;
    add({ type: 'fan', i, born: fan + i * 0.05, die, pos: pol(a, R1), rgb: C.cyanRGB });
  }
  if (chain > 0) {
    let prev = null;
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (PORTRAIT ? 0.2 : 0.35) - i * 0.0;
      const p = pol(a - 0.05, R1 * (0.7 + i * 0.32));
      const pp = [p[0], p[1] + (i - 1) * (PORTRAIT ? 110 : 90)];
      prev = add({ type: 'chain', i, born: chain + i * 0.45, die: reclaim > 0 ? reclaim + 0.3 + i * 0.1 : endT, pos: pp, link: prev, rgb: [120, 240, 255] });
    }
  }
  if (sub > 0) {
    const m = add({ type: 'sub', born: sub, die: endT, pos: pol(Math.PI / 2 + (PORTRAIT ? 0.0 : 0.15), R1 * 0.95), rgb: C.violetRGB });
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i - 3) * 0.48;
      const off = [Math.cos(a) * 150, Math.sin(a) * 120];
      add({ type: 'leaf', i, born: sub + 0.35 + i * 0.09, die: reclaim > 0 ? reclaim + 0.5 + i * 0.08 : endT, pos: [m.pos[0] + off[0], m.pos[1] + off[1]], parentNode: m, rgb: C.cyanRGB });
    }
  }
  // 结尾的呼吸：新任务不断生出、做完、回收
  if (count > 0 || (short && reclaim > 0)) {
    const t0 = count > 0 ? count - 0.4 : reclaim + 1.2;
    for (let i = 0; i < 14; i++) {
      const b = t0 + i * 0.22, a = rand(i, 80) * TAU, r = R1 * (0.55 + rand(i, 81) * 0.6);
      add({ type: 'pulse', born: b, die: b + 1.3 + rand(i, 82), pos: pol(a, r), rgb: C.cyanRGB });
    }
  }
  return { S, reroute };
}

SHOT.bloom = (g, u, dur, cue) => {
  const short = TL.cut === 'short';
  const hand = cue('handoff', 0.8), goal = cue('goal', -1);
  const arrive = hand + 0.5;
  background(g, u, { tint: mix([10, 12, 26], [24, 16, 44], ease(u, arrive, arrive + 0.4) * (0.8 - 0.4 * ease(u, arrive + 0.5, arrive + 3))), dots: false });
  const cx = ST.cx, cy = ST.cy + (PORTRAIT ? -10 : 0);
  // 冲击：协调者接过目标的一刻
  const z = punch(u, arrive, 0.08, 0.6);
  const [sx, sy] = shakeXY(u, arrive, 26, 0.5);
  g.save(); g.translate(cx + sx, cy + sy); g.scale(z, z); g.translate(-cx, -cy);
  // 背景同心圆
  for (let r = 1; r <= 5; r++) {
    g.beginPath(); g.arc(cx, cy, r * (PORTRAIT ? 110 : 140) + (u * 20) % (PORTRAIT ? 110 : 140), 0, TAU);
    g.strokeStyle = rgba(C.violetRGB, 0.05 * ease(u, arrive, arrive + 1)); g.lineWidth = 1; g.stroke();
  }
  const { S, reroute } = orgNodes(cue, dur, short);
  // 远处的背景星环：整个组织在一片更大的系统里
  const amb = ease(u, arrive, arrive + 1.5);
  for (let i = 0; i < 140; i++) {
    const a = rand(i, 120) * TAU + u * 0.03 * (rand(i, 121) - 0.5), r = (PORTRAIT ? 380 : 520) + rand(i, 122) * (PORTRAIT ? 260 : 420);
    glow(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * (PORTRAIT ? 1 : 0.6), 5 + rand(i, 123) * 6, rand(i, 124) > 0.8 ? C.violetRGB : C.cyanRGB, 0.35 * amb, 1);
  }
  const NS = PORTRAIT ? 1.35 : 1.2; // 节点尺寸
  const tags = ['session', 'cookie', 'token-db', 'api/me', 'ui/login', 'e2e', 'schema', 'migrate', 'backfill'];
  const P = (n) => {
    const k = outBack(clamp((u - n.born) / 0.45), 1.4);
    const base = n.parentNode ? [cx + n.parentNode.pos[0], cy + n.parentNode.pos[1]] : n.link && n.type === 'chain' ? [cx + n.link.pos[0], cy + n.link.pos[1]] : [cx, cy];
    const tgt = [cx + n.pos[0] + Math.sin(u * 0.9 + n.born * 7) * 6, cy + n.pos[1] + Math.cos(u * 0.8 + n.born * 5) * 6];
    // 侦察兵：出去再回来
    let k2 = 0;
    if (n.type === 'scout') k2 = inOut(clamp((u - (n.die - 0.7)) / 0.6));
    return [lerp(lerp(base[0], tgt[0], k), cx, k2), lerp(lerp(base[1], tgt[1], k), cy, k2)];
  };
  // 边与数据脉冲
  for (const n of S) {
    if (u < n.born || u > n.die + 0.4) continue;
    const a = clamp((u - n.born) / 0.2) * (1 - clamp((u - n.die) / 0.3));
    const p = P(n);
    const from = n.parentNode ? P(n.parentNode) : n.link ? P(n.link) : [cx, cy];
    let rgb = n.type === 'chain' ? [120, 240, 255] : n.rgb;
    glowLine(g, [from, p], rgb, 0.45 * a, n.type === 'sub' ? 3 : 1.6);
    // 串行：一个做完才轮到下一个，脉冲沿链条走
    const ph = ((u * 1.6 + n.born) % 1);
    glow(g, lerp(from[0], p[0], ph), lerp(from[1], p[1], ph), 12, C.whiteRGB, 0.8 * a, 1);
  }
  // 改道：两个本以为能并行的任务，被接成串行
  if (reroute > 0) {
    const f = S.filter((n) => n.type === 'fan');
    if (f.length >= 2) {
      const k = ease(u, reroute - 0.1, reroute + 0.5);
      const a = P(f[1]), b = P(f[2]);
      const mid = [lerp(a[0], b[0], 0.5) + 60, lerp(a[1], b[1], 0.5)];
      glowLine(g, [a, [lerp(a[0], mid[0], k), lerp(a[1], mid[1], k)], [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]], C.amberRGB, k, 3);
      if (k > 0.5) txt(g, TL.txt.serial, mid[0] + 70, mid[1], 26, C.amber, { family: F.mono, alpha: k, align: 'left' });
    }
  }
  // 节点
  const results = [];
  for (const n of S) {
    if (u < n.born) continue;
    const p = P(n);
    if (u < n.die) {
      const k = clamp((u - n.born) / 0.25);
      const busy = 0.7 + 0.3 * Math.sin(u * 8 + n.born * 10);
      const big = n.type === 'sub' ? 1.6 : n.type === 'scout' ? 0.9 : 1;
      glow(g, p[0], p[1], 52 * NS * big * k * busy, n.rgb, 0.85);
      glow(g, p[0], p[1], 14 * NS * big * k, C.whiteRGB, 1, 1);
      // 工作中的小圈
      g.strokeStyle = rgba(n.rgb, 0.75 * k); g.lineWidth = 2.5;
      g.beginPath(); g.arc(p[0], p[1], 28 * NS * big, u * 4 + n.born, u * 4 + n.born + 4); g.stroke();
      if ((n.type === 'fan' || n.type === 'chain') && k > 0.9) txt(g, tags[((n.i || 0) + (n.type === 'chain' ? 6 : 0)) % tags.length], p[0], p[1] + 46 * NS, PORTRAIT ? 22 : 20, rgba(n.rgb, 0.85), { family: F.mono });
      if (n.type === 'scout') { // 雷达扫过
        const sa = u * 5 + n.born * 3;
        g.save(); g.globalAlpha = 0.25 * k; g.fillStyle = rgba(n.rgb, 1);
        g.beginPath(); g.moveTo(p[0], p[1]); g.arc(p[0], p[1], 90, sa, sa + 0.6); g.closePath(); g.fill(); g.restore();
      }
      if (n.type === 'sub') coordinator(g, p[0], p[1], u, k * 0.7, 0.5);
    } else if (u < n.die + 1.2) {
      // 回收：碎成光点，留下一枚“结果”晶体
      const k = (u - n.die) / 1.2;
      for (let j = 0; j < 10; j++) {
        const a = rand(j, n.born * 13) * TAU, d = 70 * outExpo(k);
        glow(g, p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, 8, n.rgb, 0.8 * (1 - k), 1);
      }
    }
    if (u > n.die && n.type !== 'pulse' && n.type !== 'sub') results.push({ p, t: n.die });
  }
  // 结果晶体飞向结果栏
  const ry = PORTRAIT ? ST.y + ST.h + 30 : ST.y + ST.h - 30;
  results.sort((a, b) => a.t - b.t).forEach((r, i) => {
    const k = inOut(clamp((u - r.t - 0.2) / 0.7));
    const tx = cx - (PORTRAIT ? 400 : 560) + i * (PORTRAIT ? 34 : 44), ty = ry;
    const x = lerp(r.p[0], tx, k), y = lerp(r.p[1], ty, k) - Math.sin(Math.PI * k) * 80;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
    g.fillStyle = C.white; g.shadowColor = C.white; g.shadowBlur = 20; g.fillRect(-9, -9, 18, 18); g.restore();
  });
  if (results.length) txt(g, TL.txt.results + ' ×' + results.filter((r) => u > r.t + 0.9).length, PORTRAIT ? cx : cx + 560, PORTRAIT ? ry - 44 : ry, 28, C.ink, { family: F.mono, alpha: ease(u, results[0].t + 0.5, results[0].t + 1), align: PORTRAIT ? 'center' : 'left' });
  // 协调者
  const ck = ease(u, arrive - 0.05, arrive + 0.2);
  coordinator(g, cx, cy, u, ck, PORTRAIT ? 1.4 : 1.3);
  if (ck > 0) txt(g, TL.txt.coordinator, cx, cy - (PORTRAIT ? 140 : 130), PORTRAIT ? 34 : 32, C.white, { family: F.black, alpha: ck * (1 - 0.6 * ease(u, arrive + 3, arrive + 4)), spacing: '0.06em' });
  g.restore();
  // 人把目标交出去：琥珀色的菱形飞向中心
  const hx = PORTRAIT ? ST.x + 100 : ST.x + 200, hy = PORTRAIT ? ST.y + ST.h - 30 : ST.y + ST.h - 100;
  const hk = 1 - 0.7 * ease(u, arrive, arrive + 1);
  glow(g, hx, hy, 60, C.amberRGB, hk); glow(g, hx, hy, 14, C.whiteRGB, hk, 1);
  const fk = clamp((u - hand + 0.1) / 0.6);
  if (fk > 0 && fk < 1) {
    const x = lerp(hx, cx, inCubic(fk)), y = lerp(hy, cy, inCubic(fk)) - Math.sin(Math.PI * fk) * 120;
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4 + fk * 3); g.fillStyle = C.amber; g.shadowColor = C.amber; g.shadowBlur = 40; g.fillRect(-18, -18, 36, 36); g.restore();
    glow(g, x, y, 80, C.amberRGB, 0.6);
  }
  ring(g, cx, cy, u, arrive, C.whiteRGB, PORTRAIT ? 800 : 1200, 8, 0.9);
  ring(g, cx, cy, u, arrive + 0.12, C.violetRGB, PORTRAIT ? 600 : 900, 5, 1.0);
  burst(g, cx, cy, u, arrive, C.violetRGB, 70, PORTRAIT ? 700 : 1000, 11);
  // 目标卡
  if (goal > 0) {
    const k = ex(u, goal - 0.1, goal + 0.3) * (1 - ease(u, goal + 3.2, goal + 3.8));
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      g.font = `600 ${PORTRAIT ? 36 : 34}px ${ZH ? F.cjk : F.ui}`;
      const tw = g.measureText('◆  ' + TL.txt.goal).width;
      const gx = cx - tw / 2 - 30, gy = cy - (PORTRAIT ? 250 : 230);
      panel(g, gx, gy, tw + 60, 72, { bar: false, r: 36, rgb: C.amberRGB, glow: 1.5 });
      g.fillStyle = C.white; g.textBaseline = 'middle'; g.fillText('◆  ' + TL.txt.goal, gx + 30, gy + 37);
      g.restore();
    }
  }
  // 节奏字
  const labels = [['scout', TL.txt.scout], ['fan', TL.txt.parallel], ['chain', TL.txt.serial], ['sub', TL.txt.manager], ['reclaim', TL.txt.reclaim]];
  for (const [c, word] of labels) {
    const t0 = cue(c, -1);
    if (t0 < 0) continue;
    const next = labels.map(([n]) => cue(n, -1)).filter((x) => x > t0).sort((a, b) => a - b)[0] ?? t0 + 1.6;
    slam(g, word, PORTRAIT ? CX : W - 300, PORTRAIT ? ST.y + 30 : 170, PORTRAIT ? 64 : 64, u, t0, C.white, { glow: C.cyanRGB, out: Math.min(next - 0.25, t0 + 1.8), family: ZH ? F.displayZH : F.black });
  }
  const cnt = cue('count', -1);
  if (cnt > 0) slam(g, TL.txt.asNeeded, CX, PORTRAIT ? ST.y + 30 : 170, PORTRAIT ? 70 : 76, u, cnt, C.white, { glow: C.violetRGB, maxW: W * 0.9 });
};

// —— Cursor Projects：协调者不写代码 ——
SHOT.projects = (g, u, dur, cue) => {
  background(g, u, { tint: [16, 12, 34], dx: u * 8 });
  const coord = cue('coord', 0.8), back = cue('back', dur - 2);
  const cx = ST.cx, cy = ST.cy + (PORTRAIT ? 40 : 30);
  coordinator(g, cx, cy, u, ease(u, 0, 0.4), 1.2);
  // 不写代码：一个 </> 被划掉
  const nk = ex(u, coord, coord + 0.4);
  if (nk > 0) {
    const y = cy - (PORTRAIT ? 270 : 250);
    txt(g, '</>', cx, y, PORTRAIT ? 64 : 64, C.dim, { family: F.mono, alpha: nk });
    const sk = ease(u, coord + 0.25, coord + 0.5);
    g.save(); g.strokeStyle = C.red; g.lineWidth = 7; g.shadowColor = C.red; g.shadowBlur = 20;
    g.beginPath(); g.moveTo(cx - 70, y + 30); g.lineTo(cx - 70 + 140 * sk, y - 30); g.stroke(); g.restore();
    slam(g, TL.txt.noCode, cx, y + (PORTRAIT ? 90 : 84), PORTRAIT ? 64 : 66, u, coord + 0.3, C.white, { glow: C.redRGB, maxW: W * 0.9 });
    txt(g, TL.txt.coordJobs, cx, cy + (PORTRAIT ? 150 : 140), PORTRAIT ? 34 : 34, C.violet, { family: F.mono, alpha: ease(u, coord + 1, coord + 1.5), maxW: W * 0.9 });
  }
  // 云端和本地的执行者
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3, r = (PORTRAIT ? 330 : 420) + (i % 2) * 50;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * (PORTRAIT ? 0.95 : 0.62), i === 6]);
  }
  pts.forEach(([x, y, local], i) => {
    const b = 0.5 + i * 0.12, k = ex(u, b, b + 0.3);
    if (k <= 0) return;
    const rgb = local ? C.greenRGB : C.cyanRGB;
    glowLine(g, [[cx, cy], [lerp(cx, x, k), lerp(cy, y, k)]], rgb, 0.3, 1.4);
    glow(g, x, y, 34 * k, rgb, 0.8); glow(g, x, y, 9, C.whiteRGB, k, 1);
    const ph = (u * 1.2 + i * 0.37) % 1;
    glow(g, lerp(cx, x, ph), lerp(cy, y, ph), 10, C.whiteRGB, 0.7 * k, 1);
    if (local || i === 1) txt(g, local ? TL.txt.local : TL.txt.cloud, x, y + 44, 24, local ? C.green : C.cyan, { family: F.mono, alpha: k });
  });
  // 结果交还给人检查
  const bk = ease(u, back - 0.2, back + 0.6);
  const hx = PORTRAIT ? ST.x + 100 : ST.x + 160, hy = PORTRAIT ? ST.y + ST.h - 20 : ST.y + ST.h - 80;
  glow(g, hx, hy, 60, C.amberRGB, 0.4 + 0.6 * bk); glow(g, hx, hy, 14, C.whiteRGB, 1, 1);
  if (bk > 0) {
    for (let j = 0; j < 4; j++) {
      const k = clamp(bk * 1.3 - j * 0.1);
      const x = lerp(cx, hx, inOut(k)), y = lerp(cy, hy, inOut(k)) - Math.sin(Math.PI * k) * 100;
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = C.white; g.shadowColor = C.white; g.shadowBlur = 20; g.fillRect(-8, -8, 16, 16); g.restore();
    }
    txt(g, '✓', hx + 50, hy - 50, 54, C.green, { family: F.black, alpha: ease(u, back + 0.6, back + 0.9) });
  }
};

// —— 2024 年就有了：一张文档卡片 ——
function docCard(g, x, y, w, h, u, drawK, solidK) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = '#9d978a'; rr(g, x, y, w, h, 8); g.fill();
  g.shadowColor = 'transparent';
  // 纸纹
  g.fillStyle = 'rgba(120,100,70,0.05)';
  for (let i = 0; i < 40; i++) g.fillRect(x + rand(i, 90) * w, y + rand(i, 91) * h, 1 + rand(i, 92) * 3, 1);
  txt(g, TL.txt.owTitle, x + 40, y + 60, PORTRAIT ? 40 : 42, '#141821', { align: 'left', family: F.black, maxW: w - 80 });
  txt(g, TL.txt.owSub, x + 40, y + 110, 26, '#5a6170', { align: 'left', family: F.mono });
  // Orchestrator-Workers 图
  const ink = '#1a2030';
  const bx = (cx, cy, bw, bh, label, k, solid = 0) => {
    if (k <= 0) return;
    g.save(); g.globalAlpha = k;
    rr(g, cx - bw / 2, cy - bh / 2, bw, bh, 8);
    if (solid > 0) { g.fillStyle = rgba(mix([157, 151, 138], [40, 170, 110], solid), 1); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 2.5; g.setLineDash(solid > 0.5 ? [] : label.startsWith('LLM') ? [8, 6] : []); g.stroke(); g.setLineDash([]);
    txt(g, label, cx, cy, Math.min(28, bw / 6.5), ink, { family: F.mono, maxW: bw - 16, weight: 700 });
    g.restore();
  };
  const ar = (x0, y0, x1, y1, k) => { if (k <= 0) return; g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); g.stroke(); };
  const top = y + 170, cxm = x + w / 2, hh = h - 200;
  const yIn = top + 20, yOr = top + hh * 0.26, yW = top + hh * 0.56, ySy = top + hh * 0.84;
  const bw = Math.min(320, w * 0.42), sw = Math.min(220, (w - 100) / 3);
  bx(cxm, yIn, 120, 44, 'In', clamp(drawK * 6));
  ar(cxm, yIn + 22, cxm, yOr - 26, clamp(drawK * 6 - 1));
  bx(cxm, yOr, bw, 56, 'Orchestrator', clamp(drawK * 6 - 1.5));
  for (let i = 0; i < 3; i++) {
    const wx = cxm + (i - 1) * (sw + 20);
    ar(cxm, yOr + 28, wx, yW - 26, clamp(drawK * 6 - 2.5));
    bx(wx, yW, sw, 52, 'LLM Call ' + (i + 1), clamp(drawK * 6 - 3), solidK);
    ar(wx, yW + 26, cxm, ySy - 26, clamp(drawK * 6 - 4));
    if (solidK > 0.5) txt(g, '✓', wx + sw / 2 - 14, yW - 22, 30, '#1f9d63', { family: F.black, alpha: (solidK - 0.5) * 2 });
  }
  bx(cxm, ySy, bw, 56, 'Synthesizer', clamp(drawK * 6 - 4.5));
  g.restore();
}
SHOT.archive = (g, u, dur, cue) => {
  background(g, u, { tint: [20, 20, 24], dots: false });
  const notnew = cue('notnew', 0.6), ow = cue('ow', notnew + (TL.cut === 'short' ? 0.15 : 1.2)), rel = cue('reliable', dur - 3), letgo = cue('letgo', -1);
  const cw = PORTRAIT ? 840 : 860, ch = PORTRAIT ? 540 : 760;
  const x = ST.cx - cw / 2 + (PORTRAIT ? 0 : -330), y = ST.cy - ch / 2 + (PORTRAIT ? 70 : 10);
  const ink = ease(u, ow - 0.2, ow + 1.4);
  const sol = ease(u, rel, rel + 0.6);
  const k = ex(u, 0, 0.5);
  g.save(); g.globalAlpha = k * (1 - 0.6 * (letgo > 0 ? ease(u, letgo - 0.2, letgo + 0.2) : 0));
  g.translate(x + cw / 2, y + ch / 2); g.rotate(-0.025 + 0.01 * Math.sin(u * 0.5)); g.scale(lerp(1.1, 1, k), lerp(1.1, 1, k)); g.translate(-(x + cw / 2), -(y + ch / 2));
  docCard(g, x, y, cw, ch, u, ink, sol);
  // 红色印章：2024
  const sk = clamp((u - notnew) / 0.2);
  if (sk > 0) {
    const sx = x + cw - 150, sy = y + 120, s = lerp(2.4, 1, outCubic(sk));
    g.save(); g.translate(sx, sy); g.rotate(-0.25); g.scale(s, s); g.globalAlpha = Math.min(1, sk * 2) * 0.9;
    g.strokeStyle = '#d8283f'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 92, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 78, 0, TAU); g.stroke();
    txt(g, '2024', 0, 0, 70, '#d8283f', { family: F.num });
    g.restore();
  }
  g.restore();
  // 右侧（竖屏：上方）大字
  const tx = PORTRAIT ? CX : ST.cx + 500, ty = PORTRAIT ? ST.y + 42 : ST.cy - 120; // 竖屏：落在年代标签下方
  slam(g, TL.txt.notNew, tx, ty, PORTRAIT ? 92 : 104, u, notnew + 0.1, C.white, { glow: C.redRGB, out: rel - 0.3, maxW: PORTRAIT ? W * 0.9 : 640 });
  if (u > rel - 0.1) {
    if (!PORTRAIT) txt(g, TL.txt.archBox, tx, ty - 10, 46, C.dim, { family: ZH ? F.displayZH : F.black, alpha: ease(u, rel, rel + 0.4), maxW: 640 });
    slam(g, TL.txt.reliable, tx, PORTRAIT ? ty : ty + 90, PORTRAIT ? 84 : 86, u, rel + 0.3, C.green, { glow: C.greenRGB, maxW: PORTRAIT ? W * 0.9 : 640, out: letgo > 0 ? letgo - 0.2 : 1e9 });
  }
  if (letgo > 0) slam(g, TL.txt.letGo, CX, ST.cy, PORTRAIT ? 190 : 220, u, letgo, C.amber, { glow: C.amberRGB });
};

// —— 验证闭环 ——
function loopRing(g, cx, cy, R, u, litK, opts = {}) {
  const st = TL.txt.loop, n = st.length;
  const ry = R * (PORTRAIT ? 1 : 0.72);
  const pos = (i) => { const a = -Math.PI / 2 + (i / n) * TAU; return [cx + Math.cos(a) * R, cy + Math.sin(a) * ry]; };
  // 弧段
  for (let i = 0; i < n; i++) {
    const on = litK(i) * litK((i + 1) % n);
    const pts = [];
    for (let s = 0; s <= 16; s++) { const a = -Math.PI / 2 + ((i + s / 16) / n) * TAU; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * ry]); }
    const broken = opts.broken ? opts.broken(i) : 0;
    glowLine(g, pts, mix(mix([60, 70, 90], C.greenRGB, on), C.redRGB, broken), 0.35 + 0.65 * on, on > 0.5 ? 4 : 2);
  }
  // 绕圈的能量
  const sp = opts.speed ?? 0;
  if (sp > 0) for (let j = 0; j < 3; j++) {
    const a = -Math.PI / 2 + (((u * sp + j / 3) % 1) * TAU);
    glow(g, cx + Math.cos(a) * R, cy + Math.sin(a) * ry, 30, C.greenRGB, 0.9, 1);
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pos(i), k = litK(i);
    const rgb = i === 0 ? C.cyanRGB : mix([70, 80, 100], C.greenRGB, k);
    glow(g, x, y, 60 + 30 * k, rgb, 0.4 + 0.5 * k);
    g.beginPath(); g.arc(x, y, 34, 0, TAU); g.fillStyle = 'rgba(8,12,22,0.9)'; g.fill(); g.strokeStyle = rgba(rgb, 0.9); g.lineWidth = 3; g.stroke();
    const out = Math.abs(Math.cos(-Math.PI / 2 + (i / n) * TAU)) > 0.3;
    const lx = x + (out ? Math.sign(Math.cos(-Math.PI / 2 + (i / n) * TAU)) * 60 : 0), ly = y + (out ? 0 : Math.sign(Math.sin(-Math.PI / 2 + (i / n) * TAU)) * 62);
    txt(g, st[i], lx, ly, PORTRAIT ? 34 : 34, k > 0.5 || i === 0 ? C.white : C.dim, { family: ZH ? F.displayZH : F.black, align: out ? (lx > x ? 'left' : 'right') : 'center' });
  }
}
SHOT.loop = (g, u, dur, cue) => {
  background(g, u, { tint: [8, 22, 26] });
  const steps = cue('steps', 1.5), unv = cue('unverified', dur - 4);
  const cx = ST.cx, cy = ST.cy + (PORTRAIT ? 0 : 10), R = PORTRAIT ? 300 : 330;
  const breakK = ease(u, unv - 0.1, unv + 0.4);
  loopRing(g, cx, cy, R, u, (i) => (i === 0 ? 1 : ease(u, steps + (i - 1) * 0.32, steps + (i - 1) * 0.32 + 0.25) * (1 - breakK)), {
    speed: (u > steps + 1.8 ? lerp(0.3, 1.2, ease(u, steps + 1.8, unv)) : 0) * (1 - breakK), broken: (i) => breakK * (i > 0 ? 1 : 0),
  });
  if (u > steps + 1.8 && breakK < 1) txt(g, TL.txt.closed, cx, cy, PORTRAIT ? 80 : 90, C.green, { family: ZH ? F.displayZH : F.black, alpha: ease(u, steps + 1.8, steps + 2.2) * (1 - breakK), shadow: rgba(C.greenRGB, 0.8) });
  // 不验证：灰色的代码块越堆越高
  if (breakK > 0) {
    const n = Math.floor(lerp(0, 46, ease(u, unv, dur)));
    for (let i = 0; i < n; i++) {
      const col = i % 8, row = Math.floor(i / 8);
      const bx = cx - 4 * 46 + col * 46 + (row % 2) * 12, by = cy + 60 - row * 30;
      const k = clamp((u - unv - i * 0.06) / 0.25);
      g.fillStyle = `rgba(140,150,170,${0.75 * k})`; g.fillRect(bx, by - (1 - k) * 80, 40, 24);
    }
    txt(g, TL.txt.unverified, cx, cy - (PORTRAIT ? 170 : 150), PORTRAIT ? 58 : 60, C.red, { family: ZH ? F.displayZH : F.black, alpha: ease(u, unv + 0.3, unv + 0.7), shadow: rgba(C.redRGB, 0.8) });
  }
};

// —— Harness Engineering：空仓库、一百万行、零行手写、工程师搭环境 ——
SHOT.harness = (g, u, dur, cue) => {
  background(g, u, { tint: [12, 18, 30] });
  const mil = cue('million', 1.2), zero = cue('zero', mil + 1.4), har = cue('harness', zero + 1.6), letgo = cue('letgo', -1);
  const bw = PORTRAIT ? 400 : 420, bh = PORTRAIT ? 300 : 300;
  const cx = PORTRAIT ? ST.cx : ST.cx - 380, cy = ST.cy + (PORTRAIT ? 150 : 170);
  const o = { x: cx, y: cy, s: 1 };
  // 线框盒子（等轴测）
  const P = (x, y, z) => [cx + (x - y) * 0.866 * bw / 2, cy + (x + y) * 0.5 * bw / 2 - z * bh];
  const edges = [[[-1, -1, 0], [1, -1, 0]], [[1, -1, 0], [1, 1, 0]], [[1, 1, 0], [-1, 1, 0]], [[-1, 1, 0], [-1, -1, 0]],
    [[-1, -1, 1], [1, -1, 1]], [[1, -1, 1], [1, 1, 1]], [[1, 1, 1], [-1, 1, 1]], [[-1, 1, 1], [-1, -1, 1]],
    [[-1, -1, 0], [-1, -1, 1]], [[1, -1, 0], [1, -1, 1]], [[1, 1, 0], [1, 1, 1]], [[-1, 1, 0], [-1, 1, 1]]];
  // 代码一层层填满
  const fill = ease(u, mil - 0.2, zero + 0.4);
  const layers = Math.floor(fill * 16);
  for (let l = 0; l < layers; l++) {
    const z = (l + 0.5) / 16 * 0.95;
    const pts = [P(-0.95, -0.95, z), P(0.95, -0.95, z), P(0.95, 0.95, z), P(-0.95, 0.95, z)];
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath();
    g.fillStyle = rgba(mix(C.cyanRGB, C.violetRGB, l / 16), 0.03 + 0.015 * Math.sin(u * 4 + l)); g.fill();
    g.strokeStyle = rgba(C.cyanRGB, 0.22); g.lineWidth = 1; g.stroke();
  }
  // 往里倒的代码
  if (u > mil - 0.3 && u < zero + 0.6) for (let i = 0; i < 30; i++) {
    const p = (u * 1.5 + rand(i, 100)) % 1;
    const sx = cx + (rand(i, 101) - 0.5) * bw * 0.9, sy = lerp(cy - bh - 260, cy - bh * fill * 0.95 + 40, p);
    g.fillStyle = rgba(C.cyanRGB, 0.6 * (1 - p)); g.fillRect(sx, sy, 30 + rand(i, 102) * 50, 4);
  }
  for (const [a, b] of edges) glowLine(g, [P(...a), P(...b)], C.cyanRGB, 0.8, 2);
  txt(g, TL.txt.emptyRepo, cx, cy + bh * 0.62 + 40, 28, C.dim, { family: F.mono, alpha: 1 - ease(u, mil, mil + 0.5) });
  // 计数
  const lines = Math.round(lerp(0, 1000000, outCubic(ease(u, mil - 0.2, zero))) / 1000) * 1000;
  const nx = PORTRAIT ? CX : ST.cx + 540, ny = PORTRAIT ? ST.y + 10 : ST.y + 170;
  if (u > mil - 0.3) {
    txt(g, (lines >= 1000000 ? '≈ ' : '') + lines.toLocaleString('en-US'), nx, ny, PORTRAIT ? 120 : 140, C.white, { family: F.num, shadow: rgba(C.cyanRGB, 0.8) });
    txt(g, TL.txt.linesOfCode, nx, ny + (PORTRAIT ? 78 : 92), 32, C.cyan, { family: F.mono });
  }
  if (zero > 0) {
    const zy = PORTRAIT ? ST.y + ST.h - 10 : ST.y + 420;
    slam(g, '0 ' + TL.txt.byHand, nx, zy, PORTRAIT ? 96 : 110, u, zero, C.amber, { glow: C.amberRGB, maxW: PORTRAIT ? W * 0.9 : 600, out: letgo > 0 ? letgo - 0.3 : 1e9 });
  }
  // 工程师搭的“脚手架”：琥珀色的框和标签
  const hk = ease(u, har - 0.1, har + 1.2);
  if (hk > 0) {
    const labels = TL.txt.harness;
    const sc = [[-1.35, -1.35, 0], [1.35, -1.35, 0], [1.35, 1.35, 0], [-1.35, 1.35, 0]];
    for (let i = 0; i < 4; i++) {
      const k = clamp(hk * 4 - i);
      const a = P(...sc[i]), b = P(sc[i][0], sc[i][1], 1.25);
      glowLine(g, [a, [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]], C.amberRGB, 0.9, 3);
      if (k >= 1) glowLine(g, [P(sc[i][0], sc[i][1], 1.25), P(sc[(i + 1) % 4][0], sc[(i + 1) % 4][1], 1.25)], C.amberRGB, 0.6, 2);
    }
    labels.forEach((l, i) => {
      const k = ex(u, har + 0.3 + i * 0.35, har + 0.6 + i * 0.35);
      if (k <= 0) return;
      const a = -Math.PI * 0.9 + i * (Math.PI * 0.45);
      const lx = cx + Math.cos(a) * (PORTRAIT ? 380 : 430), ly = cy - bh * 0.5 + Math.sin(a) * (PORTRAIT ? 300 : 280);
      g.save(); g.globalAlpha = k;
      g.font = `600 ${PORTRAIT ? 28 : 28}px ${ZH ? F.cjk : F.ui}`;
      const tw = g.measureText(l).width;
      panel(g, lx - tw / 2 - 20, ly - 26, tw + 40, 52, { bar: false, r: 26, rgb: C.amberRGB, glow: 1 });
      g.fillStyle = C.white; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l, lx, ly + 1);
      g.restore();
    });
  }
  if (letgo > 0 && u > letgo - 0.4) {
    const k = ease(u, letgo - 0.4, letgo);
    g.save(); g.globalAlpha = k;
    loopRing(g, cx, cy - bh * 0.4, PORTRAIT ? 420 : 470, u, () => k, { speed: 0.9 * k });
    g.restore();
    g.fillStyle = `rgba(3,5,10,${0.5 * ease(u, letgo - 0.1, letgo + 0.2)})`; g.fillRect(0, 0, W, H);
    slam(g, TL.txt.letGo, CX, ST.cy, PORTRAIT ? 190 : 220, u, letgo, C.amber, { glow: C.amberRGB });
  }
};
