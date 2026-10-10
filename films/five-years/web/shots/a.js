// 钩子、倒带、片名，以及 2021 年前后到 2024 年：手写、Tab、对话改代码。

// —— 光点群：一个协调者 → 6 个枢纽 → 每个 7 个管理者 → 每个约 34 个执行者 ——
const SW = { nodes: [], dust: [] };
INITS.push(() => {
  const fib = (i, n) => { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963; return [Math.cos(th) * r, y, Math.sin(th) * r]; };
  const add = (p, lvl, parent) => { SW.nodes.push({ p, lvl, parent, ph: rand(SW.nodes.length, 5) * TAU }); return SW.nodes.length - 1; };
  const root = add([0, 0, 0], 0, -1);
  for (let h = 0; h < 6; h++) {
    const d = fib(h, 6), hp = d.map((v) => v * 280);
    const hi = add(hp, 1, root);
    for (let m = 0; m < 7; m++) {
      const a = rand(h * 7 + m, 1) * TAU, b = (rand(h * 7 + m, 2) - 0.5) * 2.2;
      const dir = [d[0] + Math.cos(a) * 0.8, d[1] + Math.sin(b) * 0.8, d[2] + Math.sin(a) * 0.8];
      const L = Math.hypot(...dir), mp = hp.map((v, k) => v + (dir[k] / L) * 190);
      const mi = add(mp, 2, hi);
      for (let w = 0; w < 40; w++) {
        const s = h * 1000 + m * 50 + w;
        const r = 40 + rand(s, 3) * 80, th = rand(s, 4) * TAU, ph = Math.acos(rand(s, 6) * 2 - 1);
        add([mp[0] + r * Math.sin(ph) * Math.cos(th), mp[1] + r * Math.cos(ph), mp[2] + r * Math.sin(ph) * Math.sin(th)], 3, mi);
      }
    }
  }
  for (let i = 0; i < 700; i++) {
    const d = fib(i, 700), r = 1100 + rand(i, 8) * 1400;
    SW.dust.push(d.map((v) => v * r));
  }
});
const LVL_RGB = [C.whiteRGB, C.violetRGB, [150, 200, 255], C.cyanRGB];

// 画光点群。retract：0..1，执行者沿边缩回父节点（倒带用）；wave：从中心向外的点亮波（秒，-1 为无）
function drawSwarm(g, u, cam, opts = {}) {
  const retract = opts.retract || 0, wave = opts.wave ?? -1, alpha = opts.alpha ?? 1;
  const N = SW.nodes;
  const pos = new Array(N.length);
  for (let i = 0; i < N.length; i++) {
    const n = N[i];
    let p = n.p;
    // 缩回：深层先缩
    const kk = clamp(retract * 3 - (3 - n.lvl)) ;
    if (kk > 0 && n.parent >= 0) {
      let q = N[n.parent].p;
      const kp = clamp(retract * 3 - (3 - N[n.parent].lvl));
      if (kp > 0 && N[n.parent].parent >= 0) q = lerp3(q, N[N[n.parent].parent].p, inOut(kp));
      p = lerp3(p, q, inOut(kk));
    }
    const fl = 1 + 0.03 * Math.sin(u * 1.3 + n.ph);
    pos[i] = proj([p[0] * fl, p[1] * fl, p[2] * fl], cam);
  }
  // 远景尘埃
  for (const d of SW.dust) { const q = proj(d, cam); if (q) glow(g, q[0], q[1], 2 + q[2] * 3, [120, 150, 210], 0.35 * alpha * (1 - retract)); }
  // 边：按层批量画
  g.save(); g.lineCap = 'round';
  for (let lvl = 3; lvl >= 1; lvl--) {
    g.beginPath();
    for (let i = 1; i < N.length; i++) {
      if (N[i].lvl !== lvl) continue;
      const a = pos[i], b = pos[N[i].parent];
      if (!a || !b) continue;
      g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
    }
    const lit = wave >= 0 ? clamp((wave - (lvl - 1) * 0.35) / 0.3) : 0;
    g.strokeStyle = rgba(LVL_RGB[lvl], (lvl === 3 ? 0.07 : 0.22) * alpha + lit * (lvl === 3 ? 0.18 : 0.45) * alpha);
    g.lineWidth = lvl === 3 ? 1 : 1.6;
    g.stroke();
  }
  g.restore();
  // 点：按深度从远到近
  const order = [...pos.keys()].filter((i) => pos[i]).sort((a, b) => pos[b][3] - pos[a][3]);
  for (const i of order) {
    const n = N[i], q = pos[i];
    const lit = wave >= 0 ? clamp((wave - n.lvl * 0.35) / 0.25) * (1 - clamp((wave - n.lvl * 0.35 - 0.6) / 1.2) * 0.6) : 0;
    const flick = n.lvl === 3 ? 0.55 + 0.45 * Math.max(0, Math.sin(u * (3 + (i % 7)) + n.ph)) : 1;
    const base = [26, 15, 9, 4.4][n.lvl];
    const r = base * q[2] * (1 + lit * 0.8);
    const near = clamp((900 - q[3]) / 600); // 近处的点更大更虚，像景深
    const a = alpha * (n.lvl === 3 ? 0.9 * flick : 1) * (1 - near * 0.5) * clamp(q[3] / 160);
    glow(g, q[0], q[1], r * (1 + near * 2.5), mix(LVL_RGB[n.lvl], C.whiteRGB, lit * 0.6), a, n.lvl === 3 && near < 0.3 ? 1 : 0);
  }
  return pos;
}
function lerp3(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }

function swarmCam(u, extra = {}) {
  const dist = lerp(-60, 1180, outExpo(clamp(u / 3.6))) - (extra.push || 0);
  return { yaw: 0.5 + u * 0.16, pitch: -0.28 + 0.06 * Math.sin(u * 0.4), dist, fov: PORTRAIT ? 1050 : 950, cx: CX, cy: PORTRAIT ? ST.cy : CY };
}

SHOT.swarm = (g, u, dur, cue) => {
  background(g, u, { tint: [10, 18, 36], dots: false });
  const boss = cue('boss', dur * 0.6);
  const push = 260 * ease(u, boss - 0.2, boss + 1.2);
  const cam = swarmCam(u, { push });
  // 穿越时的速度线：近处的点拉成光丝
  const warp = 1 - ease(u, 0, 1.6);
  if (warp > 0.01) {
    const cam0 = swarmCam(Math.max(0, u - 0.05), { push });
    g.save(); g.lineCap = 'round';
    for (let i = 1; i < SW.nodes.length; i += 2) {
      const a = proj(SW.nodes[i].p, cam), b = proj(SW.nodes[i].p, cam0);
      if (!a || !b || a[3] > 700) continue;
      g.strokeStyle = rgba(LVL_RGB[SW.nodes[i].lvl], 0.5 * warp * clamp((700 - a[3]) / 400));
      g.lineWidth = 1 + a[2] * 2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], 3), lerp(a[1], b[1], 3)); g.stroke();
    }
    g.restore();
  }
  const pos = drawSwarm(g, u, cam, { wave: u >= boss - 0.05 ? u - boss + 0.05 : -1 });
  // 第一帧的闪白，像镜头刚打开
  if (u < 0.25) { g.fillStyle = `rgba(200,230,255,${0.28 * (1 - u / 0.25)})`; g.fillRect(0, 0, W, H); }
  const c = pos[0];
  if (c) {
    const k = ease(u, boss - 0.1, boss + 0.3);
    glow(g, c[0], c[1], 120 + 380 * k + 30 * Math.sin(u * 6), C.violetRGB, 0.5 + 0.5 * k);
    glow(g, c[0], c[1], 40 + 60 * k, C.whiteRGB, 0.9, 1);
    ring(g, c[0], c[1], u, boss, C.violetRGB, PORTRAIT ? 700 : 900, 4, 1.1);
    if (k > 0.01) {
      const ly = c[1] + 110;
      txt(g, TL.txt.coordinator, c[0], ly, PORTRAIT ? 40 : 34, C.white, { alpha: k, family: F.black, spacing: '0.08em', shadow: 'rgba(180,147,255,0.9)' });
    }
  }
  // 实时计数：给钩子一点“现场感”
  const n = Math.floor(lerp(1, 1723, outExpo(clamp(u / 2.6))));
  const hx = PORTRAIT ? CX : 70, hy = PORTRAIT ? (FMT === 'v' ? 420 : 150) : 78;
  g.save();
  g.textAlign = PORTRAIT ? 'center' : 'left'; g.textBaseline = 'middle';
  g.font = `${PORTRAIT ? 26 : 22}px ${F.mono}`; g.fillStyle = rgba(C.cyanRGB, 0.85);
  g.fillText('● ' + TL.txt.agentsLive, hx, hy);
  g.font = `${PORTRAIT ? 120 : 96}px ${F.num}`; g.fillStyle = C.white;
  g.shadowColor = rgba(C.cyanRGB, 0.8); g.shadowBlur = 30;
  g.fillText(n.toLocaleString('en-US'), hx, hy + (PORTRAIT ? 86 : 70));
  g.restore();
};

// —— 倒带：光点沿着边缩回中心，年份倒转，只剩一个光标 ——
SHOT.rewind = (g, u, dur, cue) => {
  const cur = cue('cursor', dur * 0.7);
  const r0 = cue('rew', 0.05);
  const k = ease(u, r0, cur - 0.15);
  background(g, u, { tint: mix([10, 18, 36], [4, 6, 10], k), dots: false });
  const cam = swarmCam(4.2 + (r0 - u) * 1.5, { push: 260 * (1 - k) });
  cam.yaw = 0.5 + (6 + r0) * 0.16 - k * 4; // 倒着转
  if (k < 0.995) drawSwarm(g, u, cam, { retract: k, alpha: 1 - ease(u, cur - 0.4, cur) });
  // 录像带 OSD
  const vhs = win(u, r0, cur + 0.1, 0.05, 0.15);
  if (vhs > 0) {
    g.save();
    g.globalAlpha = vhs;
    g.font = `${PORTRAIT ? 44 : 40}px ${F.mono}`; g.fillStyle = C.white; g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('◀◀ REWIND', PORTRAIT ? 70 : 80, PORTRAIT ? (FMT === 'v' ? 420 : 140) : 90);
    // 跳动的跟踪噪带
    const by = ((u * 700) % (H + 200)) - 100;
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, by, W, 60);
    for (let y = 0; y < H; y += 5) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, W, 2); }
    // 年份倒转
    const yr = Math.round(lerp(2026, 2021, ease(u, r0 + 0.1, cur - 0.2)));
    g.font = `${PORTRAIT ? 300 : 280}px ${F.num}`; g.textAlign = 'center';
    g.shadowColor = rgba(C.amberRGB, 0.9); g.shadowBlur = 40; g.fillStyle = rgba(C.amberRGB, 0.92);
    g.fillText(String(yr), CX + noise1(u * 30, 2) * 6, (PORTRAIT ? ST.cy : CY) + noise1(u * 30, 3) * 4);
    g.restore();
  }
  // 只有一个光标
  const ca = ease(u, cur - 0.1, cur + 0.2);
  if (ca > 0) {
    const y = PORTRAIT ? ST.cy : CY;
    glow(g, CX, y, 320, C.amberRGB, 0.3 * ca);
    cursorBar(g, CX - 6, y, PORTRAIT ? 130 : 120, u - cur, C.amberRGB, ca);
  }
};

// —— 片名 ——
SHOT.title = (g, u, dur, cue) => {
  background(g, u, { tint: [12, 16, 30], dotA: 0.05 });
  const t2 = cue('t2', 1.4), t3 = cue('t3', 3.2);
  const y = PORTRAIT ? ST.cy : CY;
  const z = punch(u, t2, 0.05, 0.5);
  const [sx, sy] = shakeXY(u, t2, 16, 0.4);
  g.save(); g.translate(CX + sx, y + sy); g.scale(z, z); g.translate(-CX, -y);
  // 背后：光点群爆开
  if (u > t2 - 0.05) {
    const cam = { yaw: 0.4 + u * 0.1, pitch: -0.3, dist: lerp(3200, 1500, outExpo(clamp((u - t2) / 1.5))), fov: 900, cx: CX, cy: y };
    drawSwarm(g, u, cam, { alpha: 0.55 * ease(u, t2, t2 + 0.3), wave: u - t2 });
  }
  const s1 = PORTRAIT ? 104 : 120, s2 = PORTRAIT ? 120 : 150;
  const l1 = TL.txt.title1, l2 = TL.txt.title2;
  if (PORTRAIT || !ZH) {
    // 两行
    const y1 = y - (PORTRAIT ? 120 : 95), y2 = y + (PORTRAIT ? 40 : 60);
    const k1 = clamp(u / 0.9);
    g.save(); setFont(g, s1, F.display); const w1 = g.measureText(l1).width; g.restore();
    const typedW = typeText(g, l1, CX - Math.min(w1, W * 0.86) / 2, y1, s1 * Math.min(1, (W * 0.86) / w1), C.amber, k1, { family: F.display });
    if (u < t2) cursorBar(g, CX - Math.min(w1, W * 0.86) / 2 + typedW + 10, y1, s1 * 0.9, u, C.amberRGB);
    slam(g, l2, CX, y2, s2, u, t2, C.white, { maxW: W * 0.9, glow: C.cyanRGB });
  } else {
    // 横屏中文一行：左琥珀右白
    setFont(g, s1, F.display); const w1 = g.measureText(l1).width;
    setFont(g, s2, F.display); const w2 = g.measureText(l2).width;
    const x0 = CX - (w1 + w2) / 2;
    const typedW = typeText(g, l1, x0, y - 10, s1, C.amber, clamp(u / 0.9), { family: F.display });
    if (u < t2) cursorBar(g, x0 + typedW + 10, y - 10, s1 * 0.9, u, C.amberRGB);
    slam(g, l2, x0 + w1 + w2 / 2, y - 10, s2, u, t2, C.white, { glow: C.cyanRGB });
  }
  g.restore();
  // 副标题
  const a3 = ease(u, t3 - 0.1, t3 + 0.5);
  txt(g, TL.txt.title3, CX, y + (PORTRAIT ? 200 : ZH ? 150 : 190), PORTRAIT ? 46 : 44, C.ink, { alpha: a3, family: ZH ? F.cjk : F.ui, weight: 500, maxW: W * 0.88, spacing: '0.06em' });
  burst(g, CX, y, u, t2, C.cyanRGB, 60, PORTRAIT ? 600 : 900, 4);
};

// —— 编辑器面板的位置 ——
function edBox(wide = 1120, tall = 600) {
  const w = Math.min(wide, ST.w), h = Math.min(tall, ST.h);
  return { x: ST.cx - w / 2, y: ST.cy - h / 2, w, h };
}
const CODE_SIZE = PORTRAIT ? 25 : 32;

// 手写时代的代码
const CODE0 = [
  'export async function restoreSession(req) {',
  "  const token = req.cookies.get('sid');",
  '  if (!token) return null;',
  '  const session = await db.sessions.find(token);',
  '  return session?.user ?? null;',
  '}',
];

SHOT.ide = (g, u, dur, cue) => {
  background(g, u, { tint: [16, 18, 30], dx: -u * 8 });
  bigYear(g, '2020', u, ST.cx + (PORTRAIT ? 0 : 420), ST.cy - 20 - u * 6, PORTRAIT ? 420 : 620, 0.13, C.amberRGB);
  const hl = cue('hl', dur * 0.4), ren = hl, jump = cue('jump', hl + 0.6), rename = cue('rename', hl + 1.4), decide = cue('decide', dur - 2.4);
  const typeAt = 0.3;
  const B = edBox(1360, 520);
  const tilt = 0.08 * (1 - ease(u, 0, 2.5));
  const zoom = 1 + 0.05 * ease(u, 0, dur);
  const dim = ease(u, decide - 0.2, decide + 0.3);
  g.save();
  g.translate(B.x + B.w / 2, B.y + B.h / 2); g.scale(zoom, zoom); g.transform(1, tilt * 0.5, -tilt, 1, 0, 0); g.translate(-(B.x + B.w / 2), -(B.y + B.h / 2));
  g.globalAlpha = 1 - dim * 0.88;
  panel(g, B.x, B.y, B.w, B.h, { title: 'session.ts — VS Code', rgb: [130, 150, 190], glow: 0.4 });
  // 打字：人的速度，一行一行
  const cps = CODE0.join('').length / Math.max(2, rename - 0.8 - typeAt), lh = CODE_SIZE * 1.75, x0 = B.x + (PORTRAIT ? 28 : 60), y0 = B.y + 70;
  let left = Math.max(0, (u - typeAt) * cps), cx = x0, cy = y0;
  const colorK = ease(u, ren - 0.1, ren + 0.6); // “高亮”：从单色变成语法着色
  const renK = ease(u, rename, rename + 0.6);
  CODE0.forEach((line0, i) => {
    let line = line0;
    const n = [...line].length;
    const k = clamp(left / n);
    left = Math.max(0, left - n - 3);
    const y = y0 + i * lh;
    g.fillStyle = 'rgba(120,135,160,0.4)'; g.font = `${CODE_SIZE * 0.8}px ${F.mono}`; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText(String(i + 1), x0 - 14, y);
    if (renK > 0) line = line.replace(/\btoken\b/g, renK > 0.5 ? 'sessionId' : 'token');
    const w = codeLine(g, line, x0, y, CODE_SIZE, { k, color: colorK < 0.5 ? '#c8d0dc' : undefined });
    if (k > 0 && k < 1) { cx = x0 + w; cy = y; }
    if (k >= 1 && i === CODE0.length - 1) { cx = x0 + w; cy = y; }
    // 重命名的涟漪
    if (renK > 0 && renK < 1 && /\btoken\b/.test(line0)) {
      setFont(g, CODE_SIZE, F.mono);
      const re = /\btoken\b/g; let m;
      while ((m = re.exec(line0))) {
        const px = x0 + g.measureText(line0.slice(0, m.index)).width;
        const a = Math.sin(Math.PI * clamp((renK - i * 0.05) * 1.2));
        g.fillStyle = rgba(C.cyanRGB, 0.25 * a); g.fillRect(px - 4, y - CODE_SIZE * 0.7, g.measureText(renK > 0.5 ? 'sessionId' : 'token').width + 8, CODE_SIZE * 1.4);
        glow(g, px + 40, y, 60, C.cyanRGB, 0.5 * a);
      }
    }
  });
  if (u > typeAt - 0.6) cursorBar(g, cx + 4, cy, CODE_SIZE * 1.2, u, C.amberRGB, 1, left <= 0);
  // 键入的火花
  const ks = Math.floor((u - typeAt) * cps);
  if (u > typeAt && left > 0) glow(g, cx, cy, 30 + 20 * rand(ks, 1), C.amberRGB, 0.6);
  g.restore();
  // 跳转：一条弧线从调用处跳到定义
  const jk = ease(u, jump - 0.1, jump + 0.4) * (1 - ease(u, jump + 0.7, jump + 1.0));
  if (jk > 0) {
    const p0 = [B.x + B.w * 0.62, B.y + 70 + 3 * CODE_SIZE * 1.75], p1 = [B.x + B.w * 0.33, B.y + 70];
    const pts = [];
    for (let i = 0; i <= 20; i++) { const k = i / 20 * jk; pts.push([lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k) - Math.sin(Math.PI * k) * 90]); }
    glowLine(g, pts, C.cyanRGB, 1, 3);
  }
  if (dim > 0) {
    const y = ST.cy, gap = PORTRAIT ? 90 : 80;
    slam(g, '✓ ' + TL.txt.canDo, CX, y - gap, PORTRAIT ? 78 : 84, u, decide - 0.35, C.cyan, { glow: C.cyanRGB, maxW: W * 0.88 });
    slam(g, '✗ ' + TL.txt.cantDo, CX, y + gap, PORTRAIT ? 78 : 84, u, decide, C.amber, { glow: C.amberRGB, maxW: W * 0.88 });
  }
};

// —— Tab ——
const CODE_TAB_HEAD = '// restore the session after a page refresh';
const CODE_TAB = [
  'export async function restoreSession(req) {',
  "  const sid = req.cookies.get('sid');",
  '  if (!sid) return null;',
  '  const s = await sessions.find(sid);',
  '  if (!s || s.expires < Date.now()) return null;',
  '  return s.user;',
  '}',
];
function keycap(g, x, y, size, label, press = 0, a = 1) {
  if (a <= 0.004) return;
  const w = size * 1.9, h = size, d = size * 0.18 * (1 - press * 0.7);
  g.save(); g.globalAlpha = a;
  rr(g, x - w / 2, y - h / 2 + d, w, h, size * 0.16); g.fillStyle = '#0d1422'; g.fill();
  rr(g, x - w / 2, y - h / 2 + press * size * 0.12, w, h, size * 0.16);
  const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); gr.addColorStop(0, '#2a3954'); gr.addColorStop(1, '#141d2e');
  g.fillStyle = gr; g.fill();
  g.shadowColor = rgba(C.cyanRGB, 0.8); g.shadowBlur = 40 + press * 60; g.strokeStyle = rgba(C.cyanRGB, 0.85); g.lineWidth = 3; g.stroke();
  g.shadowBlur = 0;
  g.font = `${size * 0.42}px ${F.black}`; g.fillStyle = C.white; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, x, y + press * size * 0.12);
  g.restore();
}
SHOT.tab = (g, u, dur, cue) => {
  background(g, u, { tint: [10, 20, 36], dy: u * 10 });
  bigYear(g, '2021', u, ST.cx - (PORTRAIT ? 0 : 430), ST.cy - u * 5, PORTRAIT ? 420 : 620, 0.14);
  const ghost = cue('ghost', dur * 0.3), tab = cue('tab', dur * 0.55), push = cue('push', -1);
  const B = edBox(1300, PORTRAIT ? 560 : 640);
  const z = punch(u, tab, 0.07, 0.5);
  const [sx, sy] = shakeXY(u, tab, 22, 0.4);
  const dimEnd = push > 0 ? ease(u, push - 0.2, push + 0.3) : 0;
  g.save(); g.translate(CX + sx, ST.cy + sy); g.scale(z, z); g.translate(-CX, -ST.cy);
  g.globalAlpha = 1 - dimEnd * 0.88;
  panel(g, B.x, B.y, B.w, B.h, { title: 'session.ts', glow: 0.6 + 0.8 * ease(u, tab, tab + 0.1) * (1 - ease(u, tab + 0.2, tab + 1.2)) });
  const lh = CODE_SIZE * 1.7, x0 = B.x + (PORTRAIT ? 26 : 50), y0 = B.y + 72;
  const hk = clamp((u - 0.1) / 1.0);
  const hw = codeLine(g, CODE_TAB_HEAD, x0, y0, CODE_SIZE, { k: hk, color: '#ffcf7a' });
  if (u < ghost + 0.2) cursorBar(g, x0 + hw + 4, y0, CODE_SIZE * 1.2, u, C.amberRGB);
  const solid = ease(u, tab, tab + 0.12);
  CODE_TAB.forEach((line, i) => {
    const y = y0 + (i + 1) * lh;
    const gk = ease(u, ghost + i * 0.06, ghost + i * 0.06 + 0.2);
    if (gk <= 0) return;
    // Tab 之后：一道青色的波从上往下把灰字点亮
    const lk = clamp((u - tab - i * 0.035) / 0.12);
    if (lk < 1) codeLine(g, line, x0, y, CODE_SIZE, { ghost: true, alpha: gk * (1 - lk) });
    if (lk > 0) {
      codeLine(g, line, x0, y, CODE_SIZE, { alpha: lk });
      if (lk < 1) { g.fillStyle = rgba(C.cyanRGB, 0.35 * (1 - lk)); g.fillRect(B.x + 8, y - lh / 2, B.w - 16, lh); }
    }
  });
  // 之后：一段又一段，Tab、Tab、Tab
  if (push > 0) {
    for (let j = 0; j < 3; j++) {
      const tt = tab + 1.6 + j * 0.55;
      keycap(g, B.x + B.w - 120 - j * 150, B.y + B.h - 60, 52, 'Tab', clamp((u - tt) / 0.08) * (1 - clamp((u - tt - 0.15) / 0.1)), ease(u, tt - 0.2, tt) * (1 - dimEnd));
    }
  }
  g.restore();
  // 巨大的 Tab 键落下
  const kk = clamp((u - (tab - 0.32)) / 0.32);
  if (kk > 0 && u < tab + 1.6) {
    const ky = lerp(ST.y - 200, ST.cy + (PORTRAIT ? 120 : 100), outCubic(kk));
    const ks = lerp(PORTRAIT ? 420 : 460, PORTRAIT ? 220 : 240, outCubic(kk));
    const press = clamp((u - tab) / 0.06) * (1 - clamp((u - tab - 0.2) / 0.2));
    keycap(g, CX, ky, ks, 'Tab ⇥', press, (1 - ease(u, tab + 0.9, tab + 1.5)));
  }
  ring(g, CX, ST.cy, u, tab, C.cyanRGB, PORTRAIT ? 700 : 1000, 6, 0.7);
  burst(g, CX, ST.cy + 100, u, tab, C.cyanRGB, 50, 700, 7);
  if (push > 0) {
    const y = ST.cy, d = PORTRAIT ? 0 : 420;
    const a1 = slam(g, TL.txt.complete, CX - d, y - (PORTRAIT ? 90 : 0), PORTRAIT ? 80 : 88, u, push - 0.5, C.cyan, { glow: C.cyanRGB });
    slam(g, TL.txt.drive, CX + d, y + (PORTRAIT ? 90 : 0), PORTRAIT ? 80 : 88, u, push, C.amber, { glow: C.amberRGB });
  }
};

// —— 对话改代码：一句话，几个文件一起改 ——
const DIFFS = [
  { file: 'user.ts', rows: [[0, 'function loadUser(id) {'], [-1, "  const r = fetchSync('/api/users/' + id);"], [1, '  const r = await fetch(`/api/users/${id}`);'], [-1, '  return parse(r);'], [1, '  return r.json();'], [0, '}']], fix: [0, 'async function loadUser(id) {'] },
  { file: 'session.ts', rows: [[0, 'export function restore(req) {'], [-1, '  const u = loadUser(req.uid);'], [1, '  const u = await loadUser(req.uid);'], [0, '  return u;'], [0, '}']], fix: [0, 'export async function restore(req) {'] },
  { file: 'routes.ts', rows: [[0, "app.get('/me', (req, res) => {"], [-1, '  res.json(restore(req));'], [1, '  res.json(await restore(req));'], [0, '});']], fix: [0, "app.get('/me', async (req, res) => {"] },
];
SHOT.diff = (g, u, dur, cue) => {
  background(g, u, { tint: [12, 16, 34], dx: u * 6 });
  const pr = cue('prompt', 0.4), multi = cue('multi', -1), watch = cue('watch', dur - 2.5);
  // 背景年份跟着年代标记走：先 2023（Copilot Chat），多文件编辑 / 审阅时到 2024（Composer）
  const y24 = multi > 0 ? multi : TL.cut === 'short' ? watch : 1e9;
  bigYear(g, u < y24 ? '2023' : '2024', u, ST.cx + (PORTRAIT ? 0 : 430), ST.cy + 40, PORTRAIT ? 420 : 620, 0.12, C.violetRGB);
  const short = TL.cut === 'short';
  const ptxt = short ? TL.txt.promptShort : TL.txt.prompt;
  // 输入框
  const pw = PORTRAIT ? 900 : 980, ph = PORTRAIT ? 92 : 84, px = CX - pw / 2, py = ST.y + (PORTRAIT ? 10 : 30);
  const pin = ex(u, pr - 0.5, pr - 0.1);
  g.save(); g.globalAlpha = pin; g.translate(0, (1 - pin) * -40);
  panel(g, px, py, pw, ph, { bar: false, r: ph / 2, rgb: C.violetRGB, glow: 1.2 });
  const tk = clamp((u - pr) / Math.max(0.6, [...ptxt].length * 0.07));
  const tw = typeText(g, ptxt, px + 46, py + ph / 2, PORTRAIT ? 38 : 36, C.white, tk, { family: ZH ? F.cjk : F.ui, weight: 500 });
  if (tk < 1) cursorBar(g, px + 50 + tw, py + ph / 2, 40, u, C.violetRGB, 1, false);
  // 发送键
  const sent = ease(u, pr + [...ptxt].length * 0.07, pr + [...ptxt].length * 0.07 + 0.2);
  g.beginPath(); g.arc(px + pw - ph / 2, py + ph / 2, ph * 0.34, 0, TAU); g.fillStyle = rgba(C.violetRGB, 0.3 + 0.6 * sent); g.fill();
  txt(g, '↑', px + pw - ph / 2, py + ph / 2, 34, C.white, { family: F.black });
  g.restore();
  const go = pr + [...ptxt].length * 0.07 + 0.2;
  // 文件卡片
  const cards = DIFFS.length;
  const cw = PORTRAIT ? 880 : 566, rowH = PORTRAIT ? 34 : 42, cs = PORTRAIT ? 20 : 19, clipH = FMT === 'v' ? 176 : 160;
  for (let ci = 0; ci < cards; ci++) {
    const D = DIFFS[ci];
    const start = ci === 0 ? go : multi > 0 ? multi + (ci - 1) * 0.25 : go + ci * 0.3;
    const ca = ex(u, start - 0.3, start + 0.2);
    if (ca <= 0) continue;
    const ch = (D.rows.length + 1) * rowH + 56;
    let x, y;
    if (PORTRAIT) { x = CX - cw / 2; y = py + ph + 26 + ci * (clipH + 16); }
    else { x = CX - (cards * cw + (cards - 1) * 30) / 2 + ci * (cw + 30); y = py + ph + 50; }
    const lift = (1 - ca) * 80;
    g.save(); g.globalAlpha = ca; g.translate(0, lift);
    const reviewing = u > watch && Math.floor((u - watch) / 0.55) % cards === ci;
    panel(g, x, y, cw, PORTRAIT ? Math.min(ch, clipH) : ch, { title: D.file, rgb: reviewing ? C.amberRGB : C.violetRGB, glow: reviewing ? 1.6 : 0.6, titleSize: 15 });
    g.save(); rr(g, x, y, cw, PORTRAIT ? Math.min(ch, clipH) : ch, 14); g.clip();
    const dk = (u - start - 0.3) / 0.9; // 修改进度
    let yy = y + 56;
    const rows = [D.fix[0] === 0 && dk > 0.1 ? [2, D.fix[1], D.rows[0][1]] : D.rows[0], ...D.rows.slice(1)];
    for (const r of rows) {
      const [kind, text, old] = r;
      if (PORTRAIT && yy > y + clipH) break;
      if (kind === 2) { // 首行就地改写
        const k = clamp((dk - 0.1) / 0.3);
        g.fillStyle = rgba(C.greenRGB, 0.12 * k); g.fillRect(x + 6, yy - rowH / 2, cw - 12, rowH);
        codeLine(g, k > 0.5 ? text : old, x + 22, yy, cs, { alpha: 1 });
        yy += rowH; continue;
      }
      if (kind === 0) { codeLine(g, text, x + 22, yy, cs, { alpha: 0.85 }); yy += rowH; continue; }
      if (kind === -1) {
        const k = clamp((dk - 0.2) / 0.3);
        g.save();
        g.fillStyle = rgba(C.redRGB, 0.2 * k); g.fillRect(x + 6, yy - rowH / 2, cw - 12, rowH);
        codeLine(g, (k > 0 ? '- ' : '  ') + text.trim(), x + 22, yy, cs, { color: k > 0 ? '#ff8fa0' : undefined, alpha: 1 - 0.35 * k });
        setFont(g, cs, F.mono);
        g.strokeStyle = rgba(C.redRGB, 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(x + 22, yy); g.lineTo(x + 22 + Math.min(cw - 50, g.measureText(text).width + 20) * k, yy); g.stroke();
        g.restore();
        yy += rowH; continue;
      }
      const k = clamp((dk - 0.45) / 0.3);
      if (k <= 0) continue;
      const h = rowH * outCubic(k);
      g.save(); g.globalAlpha = k;
      g.fillStyle = rgba(C.greenRGB, 0.16); g.fillRect(x + 6, yy - rowH / 2, cw - 12, rowH);
      codeLine(g, '+ ' + text.trim(), x + 22 + (1 - k) * 80, yy, cs, { color: '#8dffc9' });
      g.restore();
      yy += h;
    }
    g.restore();
    // 审阅框
    if (reviewing) {
      const rk = ((u - watch) / 0.55) % 1;
      g.strokeStyle = rgba(C.amberRGB, 0.9); g.lineWidth = 3; g.setLineDash([12, 8]); g.lineDashOffset = -u * 40;
      rr(g, x - 10, y - 10, cw + 20, (PORTRAIT ? Math.min(ch, clipH) : ch) + 20, 18); g.stroke(); g.setLineDash([]);
      glow(g, x + cw * rk, y + 30, 50, C.amberRGB, 0.6);
    }
    g.restore();
  }
  if (u > watch - 0.1) {
    const y = PORTRAIT ? ST.y + ST.h - 8 : ST.y + ST.h - 20;
    const a = ease(u, watch, watch + 0.3);
    g.save(); g.globalAlpha = a;
    txt(g, '◉  ' + TL.txt.review, CX, y, PORTRAIT ? 40 : 38, C.amber, { family: F.black, shadow: rgba(C.amberRGB, 0.8), spacing: '0.1em' });
    g.restore();
  }
};
