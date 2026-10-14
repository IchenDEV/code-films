// 镜头 A：钩子与问题 —— 堵住的管子、合并量、7 个人、仓库有多大、几百台镜像、离线的 Git、永远在线的智能体。
// 坐标：原点在舞台中心；竖屏约 ±417 × ±300，横屏约 ±804 × ±357（SW、SH 是半宽、半高）。
const P = PORTRAIT;
function tint(g, rgb, k) {
  if (k <= 0.004) return;
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H) * 0.6);
  gr.addColorStop(0, rgba(rgb, 0.2 * k)); gr.addColorStop(1, rgba(rgb, 0.04 * k));
  g.fillStyle = gr; g.fillRect(-W, -H, W * 2, H * 2);
}
const BOXC = [C.blue, C.violet, C.gold, C.mint, '#ff9ec7'];
// 一堆改动：底层多、上层少，堆在 (x, y) 的左边；n 是已经落下来的个数
function heap(g, x, y, n, u, speed = 1) {
  let i = 0;
  for (let L = 0; L < 6 && i < n; L++) for (let q = 0; q < 6 - L && i < n; q++, i++) {
    const bx = x - q * 50 - L * 25, by = y - L * 44;
    const drop = clamp((u * speed * 4 - i * 0.35 + 6) / 1.2);
    if (drop <= 0) continue;
    box(g, bx + (rand(i, 4) - 0.5) * 10, by - (1 - outCubic(drop)) * 260, 1.0, BOXC[i % 5], { rot: (rand(i, 6) - 0.5) * 0.4 });
  }
}

// 钩子：智能体抱着改动往一根细管子里塞，管子标着 git，堵死了。第一帧就在这个状态
SHOT.jam = (g, c) => {
  const u = c.u, sw = c.k('swap', 0.9), fast = c.k('fast', 2.6);
  const speed = 1 + 1.6 * ease(u, fast, fast + 0.5);
  const heat = 0.45 + 0.55 * ease(u, fast, fast + 0.6);
  tint(g, C.redRGB, heat * (0.8 + 0.2 * Math.sin(u * 9)));
  const py = P ? -60 : -40, mx = P ? -40 : -120, px1 = SW + 80;
  const shake = heat * 3 * Math.sin(u * 47);
  // 管子与漏斗口
  g.save(); g.translate(0, shake);
  g.fillStyle = '#26315f'; g.beginPath(); g.moveTo(mx - 150, py - 170); g.lineTo(mx, py - 50); g.lineTo(mx, py + 50); g.lineTo(mx - 150, py + 170); g.closePath(); g.fill();
  g.lineWidth = 6; g.strokeStyle = rgba(C.redRGB, 0.5 + 0.5 * heat); g.stroke();
  panel(g, mx, py - 50, px1 - mx, 100, { r: 14, fill: '#26315f', stroke: rgba(C.redRGB, 0.5 + 0.5 * heat), lw: 6, shadow: false });
  for (let x = mx + 70; x < px1; x += 150) { g.fillStyle = '#323f78'; g.fillRect(x, py - 58, 18, 116); }
  // 压力表，指针顶到红区
  const gx = P ? 230 : 420;
  g.fillStyle = '#e9ecf7'; g.beginPath(); g.arc(gx, py - 100, 46, 0, TAU); g.fill();
  g.lineWidth = 7; g.strokeStyle = C.red; g.beginPath(); g.arc(gx, py - 100, 34, Math.PI * 1.55, Math.PI * 1.95); g.stroke();
  const na = Math.PI * (1.15 + 0.75 * clamp(0.55 + 0.45 * heat + 0.04 * Math.sin(u * 30)));
  line(g, gx, py - 100, gx + Math.cos(na) * 32, py - 100 + Math.sin(na) * 32, '#141a33', 6);
  line(g, gx, py - 54, gx, py - 50, '#e9ecf7', 10);
  const lx = P ? 100 : 170;
  txt(g, 'git', lx, py + 2, 70, C.ink, { family: F.mono, weight: '700' });
  // 管子里只漏得过去一点点
  for (let i = 0; i < 3; i++) { const x = mx + 30 + ((u * 35 + i * 170) % (px1 - mx)); if (Math.abs(x - lx) > 90) box(g, x, py + 4, 0.75, BOXC[i % 5]); }
  g.restore();
  // 堵在漏斗口的一大堆改动
  heap(g, mx - 110, py + 120, Math.floor(16 + u * 6 * speed), u, speed);
  // 源源不断抱着改动跑来的智能体
  const lane = SH - 60, x0 = -SW - 100, x1 = mx + 40;
  for (let i = 0; i < 6; i++) {
    const x = x0 + ((u * 160 * speed + i * 130) % (x1 - x0 + 130));
    if (x > x1) continue;
    bot(g, x, lane + (i % 2) * 14, 0.85, u, { seed: i + 3, carry: BOXC[i % 5], mood: u > fast ? 'stress' : 'focus', look: 1 });
    if (speed > 1.2) for (let j = 0; j < 3; j++) line(g, x - 56 - j * 18, lane - 14 + j * 16, x - 92 - j * 26, lane - 14 + j * 16, rgba(C.inkRGB, 0.35 * (speed - 1)), 3);
  }
  // 告急灯
  const ax = mx - 150, ay = py - 190;
  glow(g, ax, ay, 70, C.redRGB, 0.5 + 0.5 * Math.sin(u * 10));
  g.fillStyle = C.red; g.beginPath(); g.arc(ax, ay, 16, 0, TAU); g.fill();
  // 换掉：git 被划掉，盖章
  if (u >= sw) {
    const k = ease(u, sw, sw + 0.25);
    line(g, lx - 80, py + 2, lerp(lx - 80, lx + 80, k), py + 2, C.red, 12);
    stamp(g, T(['换掉', 'REPLACED']), P ? 220 : 470, P ? -230 : -250, P ? 88 : 104, C.red, C.redRGB, u, sw + 0.05, -0.14);
  }
  if (u >= fast) slam(g, T(['太快了', 'TOO FAST']), P ? -220 : -540, P ? 150 : 230, P ? 76 : 92, C.clay, u, fast, { rgb: C.clayRGB, family: FT(), weight: '900' });
};

// 每天合并多少次：五月 2500 → 九月 3 万（只画博客给出的两个数）
SHOT.chart = (g, c) => {
  const u = c.u, a1 = c.k('n1', 0.6), a2 = c.k('n2', c.line(1) + 0.5);
  tint(g, C.goldRGB, 0.4);
  const base = SH - 70, top = -SH + 60, hmax = base - top - 110;
  const xs = P ? [-170, 170] : [-300, 300], bw = P ? 210 : 280;
  line(g, -SW + 30, base, SW - 30, base, C.line, 4);
  txt(g, T(TL.txt.merges), 0, top - 30, P ? 32 : 36, C.dim, { weight: '700' });
  const v1 = 2500 * ex(u, a1 - 0.2, a1 + 0.6), v2 = 30000 * ex(u, a2 - 0.2, a2 + 1.0);
  const h1 = (v1 / 30000) * hmax, h2 = (v2 / 30000) * hmax;
  [[xs[0], h1, v1, T(TL.txt.may), C.blue, a1], [xs[1], h2, v2, T(TL.txt.sep), C.clay, a2]].forEach(([x, h, v, lab, col, a]) => {
    // 先有空柱子的轮廓，念到数字时才长出来
    g.save(); g.setLineDash([10, 10]); g.strokeStyle = rgba(C.dimRGB, 0.35); g.lineWidth = 3; rr(g, x - bw / 2, top + 40, bw, base - top - 40, 14); g.stroke(); g.restore();
    txt(g, lab, x, base + 40, P ? 36 : 38, C.ink, { weight: '700' });
    if (u < a - 0.25) return;
    panel(g, x - bw / 2, base - Math.max(h, 6), bw, Math.max(h, 6), { r: 14, fill: col, stroke: null });
    slam(g, fmtInt(v), x, base - Math.max(h, 6) - 50, P ? 74 : 92, C.gold, u, a, { ring: false });
  });
  // 九月那根柱子顶上，智能体还在往上堆
  if (u > a2 + 0.6) {
    const yb = base - h2;
    for (let i = 0; i < 2; i++) box(g, xs[1] - 40 + i * 70, yb - 130, 0.9, BOXC[i]);
    bot(g, xs[1] + (P ? 150 : 200), base - 40, 0.9, u, { mood: 'happy', seed: 2, look: -1 });
  }
  if (u > a2 + 0.9) slam(g, T(['超过 10 倍', '> 10×']), xs[0], P ? -60 : -80, P ? 64 : 80, C.red, u, a2 + 0.9, { rgb: C.redRGB, family: FT(), weight: '900' });
};

// 7 个人 · 5 个月 · 怎么做到的？（长版后面同一个镜头还会列出他们造的东西）
SHOT.team = (g, c) => {
  const u = c.u, a7 = c.k('seven', 0.3), a5 = c.k('five', 1.4), ah = c.k('how', 2.8), a10 = c.k('x10');
  tint(g, C.violetRGB, 0.5);
  const lessons = c.has('x10');
  const shirts = [C.violet, C.blue, C.clay, C.mint, '#ff9ec7', C.gold, '#7aa2ff'];
  const py = P ? 30 : (lessons ? 20 : 50), gap = P ? 114 : 170, s = P ? 0.95 : 1.2;
  for (let i = 0; i < 7; i++) {
    const k = pop(u, a7 + i * 0.07, 0.4);
    if (k <= 0) continue;
    g.save(); g.translate(-3 * gap + i * gap, py); g.scale(k, k);
    person(g, 0, 0, s, u, { seed: i, shirt: shirts[i], hairLong: i % 3 === 1, skin: ['#f1c7a1', '#d9a27c', '#f6d3b3', '#b97f5a'][i % 4], look: Math.sin(u + i) * 0.5 });
    g.restore();
  }
  slam(g, T(TL.txt.people), P ? -200 : -460, P ? -205 : -250, P ? 86 : 104, C.gold, u, a7, { family: FT(), weight: '900', ring: false });
  // 日历：从 5 月翻到 9 月，最后一页留着
  const cx = P ? 200 : 460, cy = P ? -200 : -240;
  if (u > a5 - 0.2) {
    const flips = 4 * ease(u, a5, a5 + 1.0);
    const months = ZH ? ['5 月', '6 月', '7 月', '8 月', '9 月'] : ['May', 'Jun', 'Jul', 'Aug', 'Sep'];
    for (let i = 4; i >= 0; i--) {
      const gone = clamp(flips - i);
      if (gone >= 1) continue;
      g.save(); g.translate(cx, cy); g.rotate(-gone * 0.6); g.translate(gone * 120, gone * 80); g.globalAlpha = 1 - gone;
      panel(g, -78, -66, 156, 132, { r: 12, fill: '#f4efe6', stroke: null });
      g.fillStyle = C.red; rr(g, -78, -66, 156, 34, 12); g.fill(); g.fillRect(-78, -46, 156, 14);
      txt(g, months[i], 0, 18, 50, '#141a33', { weight: '900' });
      g.restore();
    }
    slam(g, T(TL.txt.monthsN), cx, cy + 112, P ? 50 : 60, C.ink, u, a5 + 0.2, { family: FT(), weight: '900', ring: false });
  }
  // 长版：他们造了什么
  if (lessons) {
    const items = T(TL.txt.products);
    items.forEach((s2, i) => {
      const k = pop(u, a7 + 0.8 + i * 0.35);
      if (k <= 0) return;
      g.save(); g.translate((i - 2) * (SW * 0.39), py + 200); g.scale(k, k);
      chip(g, s2, 0, 0, 28, i === 0 ? '#06251b' : C.ink, i === 0 ? C.mint : C.panel2, { stroke: C.line, weight: '700' });
      g.restore();
    });
    if (u > a10 - 0.1) slam(g, T(TL.txt.growth), 0, P ? -120 : -170, P ? 60 : 74, C.red, u, a10, { rgb: C.redRGB, family: FT(), weight: '900' });
    return;
  }
  // 问号
  if (u > ah - 1.0) {
    if (c.cut === 'long') {
      T(TL.txt.why3).forEach((q, i) => slam(g, q, (i - 1) * (P ? 280 : 460), P ? 230 : 270, P ? 48 : 60, [C.gold, C.mint, C.clay][i], u, ah - 1.6 + i * 0.7,
        { family: FT(), weight: '900', ring: false, rgb: [C.goldRGB, C.mintRGB, C.clayRGB][i] }));
    } else if (u > ah - 0.05) {
      slam(g, T(TL.txt.how), 0, P ? 230 : 270, P ? 80 : 96, C.mint, u, ah, { rgb: C.mintRGB, family: FT(), weight: '900' });
    }
  }
};

// 仓库有多大：100 GB 的历史、25 GB 的工作副本、每天 2500 万次检出、600 PB
SHOT.repo = (g, c) => {
  const u = c.u, aG = c.k('gb', c.line(0) + 0.6), aW = c.k('wc'), aM = c.k('n25m', c.line(1) + 0.6), aX = c.k('more'), aP = c.k('pb', c.line(2) + 0.6);
  const flood = ease(u, aP - 0.1, aP + 0.6);
  tint(g, C.redRGB, flood);
  tint(g, C.blueRGB, 0.5 * (1 - flood));
  const phase2 = ease(u, aM - 0.2, aM + 0.4);
  g.save(); g.globalAlpha = 1 - 0.75 * flood;
  // 阶段一：一大摞历史，旁边的智能体只有它的脚踝高
  const big = ex(u, aG - 0.3, aG + 0.8);
  const sx = lerp(P ? -170 : -380, P ? -330 : -680, phase2), sy = P ? 200 : 230, sc = lerp(1, 0.5, phase2);
  g.save(); g.translate(sx, sy); g.scale(sc, sc);
  const hh = (P ? 380 : 440) * Math.max(0.03, big);
  slab(g, 0, -hh / 2, P ? 240 : 300, hh, '#3d63c9', Math.max(1, Math.round(12 * big)));
  bot(g, P ? 210 : 260, -40, 0.85, u, { mood: big > 0.5 ? 'stress' : 'ok', look: -1, seed: 4 });
  g.restore();
  if (u > aG - 0.1) {
    slam(g, '100 GB', P ? 150 : 40, P ? -180 : -200, P ? 104 : 130, C.gold, u, aG, { alpha: 1 - phase2 });
    txt(g, T(TL.txt.history), P ? 150 : 40, P ? -105 : -110, P ? 32 : 36, C.dim, { weight: '700', alpha: ease(u, aG, aG + 0.3) * (1 - phase2) });
  }
  if (u > aW - 0.1 && phase2 < 1) {
    const k = pop(u, aW);
    g.save(); g.globalAlpha *= 1 - phase2; g.translate(P ? 260 : 420, P ? 150 : 170); g.scale(k, k);
    slab(g, 0, -55, 140, 110, '#2f8f74', 5);
    g.restore();
    slam(g, '25 GB', P ? 260 : 420, P ? 225 : 250, P ? 54 : 64, C.mint, u, aW, { rgb: C.mintRGB, ring: false, alpha: 1 - phase2 });
  }
  // 阶段二：一份份复印出去
  if (phase2 > 0) {
    const cols = P ? 8 : 15, rows = 5, cw = P ? 72 : 76, x0 = P ? -200 : -440, y0 = P ? -40 : -60;
    const n = Math.floor(cols * rows * ease(u, aM, aM + 1.2));
    for (let i = 0; i < n; i++) {
      const cx2 = x0 + (i % cols) * cw, cy2 = y0 + Math.floor(i / cols) * 60;
      slab(g, cx2, cy2, 44, 40, '#3d63c9', 3);
    }
  }
  g.restore();
  if (phase2 > 0) {
    const v = 25e6 * ex(u, aM, aM + 1.4);
    slam(g, ZH ? `${Math.round(v / 1e4)} 万` : fmtInt(v), P ? 80 : 160, P ? -210 : -250, P ? 90 : 112, C.gold, u, aM, { alpha: 1 - flood });
    txt(g, T(TL.txt.checkouts), P ? 80 : 160, P ? -135 : -165, P ? 30 : 36, C.dim, { weight: '700', alpha: ease(u, aM, aM + 0.3) * (1 - flood) });
    if (u > aX - 0.1) txt(g, T(TL.txt.plus), 0, SH - 30, P ? 26 : 32, C.ink, { weight: '700', alpha: ease(u, aX, aX + 0.3) * (1 - flood), maxW: 2 * SW - 60 });
  }
  // 阶段三：数据的洪水
  if (flood > 0) {
    g.save(); g.globalAlpha = flood;
    for (let i = 0; i < 80; i++) {
      const y = -SH - 60 + rand(i, 7) * (2 * SH + 120), len = 60 + rand(i, 8) * 160, x = -SW - 200 + ((u * (900 + rand(i, 9) * 900) + rand(i, 10) * 3000) % (2 * SW + 400));
      line(g, x, y, x + len, y, rgba(i % 3 ? C.blueRGB : C.redRGB, 0.45), 4 + rand(i, 11) * 4);
    }
    g.restore();
    slam(g, '600 PB', 0, P ? -10 : -20, P ? 160 : 200, C.red, u, aP, { rgb: C.redRGB, ringW: 1.8 });
    txt(g, T(TL.txt.traffic), 0, P ? 110 : 130, P ? 40 : 46, C.ink, { weight: '900', stroke: 8, alpha: ease(u, aP + 0.2, aP + 0.5) });
  }
};

// Git 的办法与几百台镜像：工具都用上了，镜像越开越多、越来越烫；快照追不上 main
SHOT.mirrors = (g, c) => {
  const u = c.u, a1 = c.k('t1'), a2 = c.k('t2'), a3 = c.k('t3'), aM = c.k('mir', c.line(0) + 0.3), aL = c.k('lag'), aS = c.k('strain');
  const hot = clamp(ease(u, aM + 0.8, aM + 2.5) + ease(u, aS, aS + 0.6));
  tint(g, C.redRGB, 0.3 + 0.5 * hot);
  const toolsOn = c.has('t1');
  // 工具（长版）：都用上了
  if (toolsOn) {
    const fade = 1 - ease(u, aM - 0.4, aM);
    if (fade > 0) T(TL.txt.tools).forEach((s, i) => {
      const k = pop(u, [a1, a2, a3][i]);
      if (k <= 0) return;
      g.save(); g.globalAlpha = fade; g.translate(P ? 0 : (i - 1) * 520, P ? -200 + i * 200 : 0); g.scale(k, k);
      panel(g, -230, -95, 460, 190, { r: 24, fill: C.panel2 });
      icon(g, ['bolt', 'sparse', 'cloud'][i], -140, 0, 96, C.blue, u);
      txt(g, s, 50, 0, 38, C.ink, { weight: '900', maxW: 260 });
      icon(g, 'check', 190, -64, 54, C.mint);
      g.restore();
    });
  }
  if (u > aM - 0.2) {
    const k0 = ease(u, aM - 0.2, aM + 0.8);
    const cols = P ? 6 : 13, rows = 4, sw2 = P ? 124 : 116, sh2 = P ? 112 : 118;
    const lagOn = u > aL - 0.3;
    const yshift = (lagOn ? lerp(0, -70, ease(u, aL - 0.3, aL + 0.3)) : 0) - 10;
    let i = 0;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++, i++) {
      const appear = clamp(k0 * cols * rows - i * 0.8);
      if (appear <= 0) continue;
      g.save(); g.translate((q - (cols - 1) / 2) * sw2, (r - (rows - 1) / 2) * sh2 + yshift); g.scale(appear, appear);
      server(g, 0, 0, 70, 96, u, { hot: clamp(hot * (0.6 + rand(i, 2))), seed: i, rows: 4 });
      g.restore();
    }
    slam(g, T(TL.txt.mirrors), 0, -SH + 10, P ? 52 : 62, C.ink, u, aM, { family: FT(), weight: '900', ring: false });
    // 快照追不上 main（长版）
    if (lagOn) {
      const k = ease(u, aL - 0.2, aL + 0.4), y = SH - 70;
      g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(7,11,26,0.85)'; rr(g, -SW + 10, y - 70, 2 * SW - 20, 140, 20); g.fill();
      line(g, -SW + 40, y, SW - 40, y, C.line, 6);
      const tip = -SW + 80 + (2 * SW - 200) * clamp(0.45 + 0.55 * ease(u, aL, aL + 3));
      arrow(g, -SW + 40, y, tip, y, C.clay, 8, 1, 24);
      chip(g, T(TL.txt.main), tip, y - 40, 24, '#2a1206', C.clay, { weight: '700' });
      const seed = -SW + 140;
      g.fillStyle = C.blue; g.beginPath(); g.arc(seed, y, 16, 0, TAU); g.fill();
      chip(g, T(TL.txt.seed), seed, y + 40, 24, '#061a2e', C.blue, { weight: '700' });
      txt(g, '← ' + T(TL.txt.behind) + ' →', (seed + tip) / 2, y + 36, 28, C.red, { weight: '900' });
      g.restore();
    }
    if (u > aS - 0.1) stamp(g, T(TL.txt.diffBlame), 0, P ? 0 : -20, P ? 64 : 80, C.red, C.redRGB, u, aS, -0.08, { family: F.mono });
    // 短版：只是在拖时间
    if (!toolsOn && u > aM + 1.0) {
      const k = pop(u, aM + 1.0);
      g.save(); g.translate(0, SH - 40); g.scale(k, k);
      panel(g, -64, -64, 128, 128, { r: 64, fill: C.panel2, stroke: C.red });
      icon(g, 'clock', 0, 0, 96, C.red, u * 3);
      g.restore();
    }
  }
};

// Git 是为离线设计的：一个人在飞机上，背包里是完整的仓库；（长版）其实大家都对着一台中心服务器
SHOT.offline = (g, c) => {
  const u = c.u, aW = c.k('whole', c.line(0) + 1.0), aO = c.k('off'), aC = c.k('center');
  tint(g, C.blueRGB, 0.5);
  const zoomOut = ease(u, aC - 0.3, aC + 0.6);
  g.save(); g.globalAlpha = 1 - zoomOut; g.scale(lerp(1, 0.6, zoomOut), lerp(1, 0.6, zoomOut));
  // 飞机舷窗
  const wx = P ? 210 : 380, wy = P ? -60 : -40;
  g.save(); g.translate(wx, wy);
  rr(g, -140, -180, 280, 360, 130); g.fillStyle = '#d9dff2'; g.fill();
  rr(g, -110, -150, 220, 300, 104); g.fillStyle = '#7fb4ff'; g.fill();
  g.save(); rr(g, -110, -150, 220, 300, 104); g.clip();
  for (let i = 0; i < 4; i++) cloudPuff(g, -140 + ((u * 120 + i * 140) % 420), -80 + i * 55, 0.8 + rand(i, 3) * 0.5);
  g.restore();
  g.restore();
  // 人、电脑、背着的完整仓库
  const px = P ? -170 : -300, py2 = P ? 170 : 190;
  person(g, px, py2, P ? 1.4 : 1.6, u, { laptop: true, shirt: C.violet, seed: 3 });
  if (u > aW - 0.4) {
    const k = pop(u, aW - 0.2);
    g.save(); g.translate(px, P ? -110 : -140); g.scale(k, k);
    panel(g, -150, -95, 300, 190, { r: 26, fill: '#2a3a78', stroke: C.blue, lw: 4 });
    branchGraph(g, 0, -15, 210, 60, u, ease(u, aW, aW + 0.8), { color: C.blue, n: 8 });
    txt(g, T(TL.txt.fullRepo), 0, 56, 32, C.ink, { weight: '900' });
    g.restore();
  }
  const aOff = c.has('off') ? aO : aW + 0.7;
  if (u > aOff - 0.2) {
    const k = pop(u, aOff);
    g.save(); g.translate(wx, wy + 230); g.scale(k, k);
    chip(g, T(TL.txt.offline) + ' ✓', 0, 0, P ? 40 : 44, '#06251b', C.mint, { weight: '900' });
    g.restore();
    g.save(); g.globalAlpha *= 0.85; icon(g, 'wifiOff', wx, wy, 120 * k, '#141a33'); g.restore();
  }
  g.restore();
  // 长版：拉远，原来大家都对着一台服务器
  if (zoomOut > 0.01) {
    g.save(); g.globalAlpha = zoomOut;
    const hubX = 0, hubY = P ? -150 : -170;
    server(g, hubX, hubY, 120, 170, u, { label: 'origin', labelSize: 24, seed: 9, rows: 6 });
    for (let i = 0; i < 9; i++) {
      const ang = Math.PI * (0.06 + 0.88 * (i / 8));
      const cx2 = hubX + Math.cos(ang) * (P ? 340 : 640), cy2 = hubY + 120 + Math.sin(ang) * (P ? 300 : 360);
      if (i % 3) bot(g, cx2, cy2, 0.75, u, { seed: i }); else person(g, cx2, cy2, 0.75, u, { seed: i, laptop: true, shirt: BOXC[i % 5] });
      g.save(); g.setLineDash([12, 12]); g.lineDashOffset = -(u * 60) % 24; line(g, cx2, cy2 - 50, hubX, hubY + 90, rgba(C.blueRGB, 0.7), 4); g.restore();
    }
    chip(g, T(TL.txt.centralized), hubX, hubY - 130, P ? 32 : 38, '#2a1206', C.clay, { weight: '900' });
    g.restore();
  }
};
function cloudPuff(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath(); g.arc(-30, 0, 26, 0, TAU); g.arc(0, -14, 34, 0, TAU); g.arc(32, 0, 26, 0, TAU); g.rect(-30, 0, 62, 26); g.fill(); g.restore();
}

// 永远在线：一群智能体，每个都连着服务器；它们不要整棵树，只问一句
SHOT.online = (g, c) => {
  const u = c.u, aOn = c.k('on', c.line(0) + 1.4), aD = c.k('drag'), aA = c.k('ask', c.line(1) + 1.2);
  tint(g, C.mintRGB, 0.35 + 0.4 * ease(u, aOn, aOn + 0.5));
  const hubY = P ? -190 : -220;
  g.save(); g.translate(0, hubY);
  glow(g, 0, 0, 220, C.mintRGB, 0.35 * ease(u, aOn - 0.3, aOn + 0.3));
  icon(g, 'cloud', 0, 0, P ? 250 : 290, C.mint);
  txt(g, 'server', 0, 18, 34, C.mint, { family: F.mono, weight: '700' });
  g.restore();
  const n = P ? 7 : 13, on = ease(u, aOn - 0.4, aOn + 0.4);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (P ? 112 : 118), y = (P ? 120 : 130) + (i % 2) * 100;
    const k = pop(u, i * 0.04, 0.4);
    if (k <= 0) continue;
    if (on > 0) { g.save(); g.globalAlpha = on; g.setLineDash([14, 14]); g.lineDashOffset = -((u * 90 + i * 7) % 28); line(g, x, y - 66, 0, hubY + 80, rgba(C.mintRGB, 0.65), 3); g.restore(); }
    g.save(); g.translate(x, y); g.scale(k, k);
    bot(g, 0, 0, P ? 0.85 : 0.9, u, { seed: i + 11, glow: on });
    g.restore();
  }
  if (u > aOn - 0.05) slam(g, T(TL.txt.online), 0, P ? -40 : -50, P ? 64 : 76, C.mint, u, aOn, { rgb: C.mintRGB, family: FT(), weight: '900', ring: false });
  txt(g, T(TL.txt.agents), 0, SH - 6, 30, C.dim, { weight: '700', alpha: ease(u, 0.3, 0.6) });
  // 拖着整个仓库的那个（长版）
  if (u > aD - 0.3 && u < aA + 0.3) {
    const k = ease(u, aD - 0.3, aD + 0.2) * (1 - ease(u, aA - 0.2, aA + 0.3));
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(7,11,26,0.8)'; g.fillRect(-W, -H, W * 2, H * 2);
    const x = (P ? -200 : -260) + Math.sin(u * 3) * 4;
    slab(g, x + (P ? 330 : 420), 120, 300, 260, '#3d63c9', 10);
    line(g, x + 40, 90, x + (P ? 180 : 270), 80, C.ink, 4);
    bot(g, x, 110, 1.2, u, { mood: 'stress', look: 1, seed: 7, still: true });
    stamp(g, T(['拖住了', 'HELD BACK']), 0, -170, P ? 74 : 86, C.red, C.redRGB, u, aD + 0.1, -0.1);
    g.restore();
  }
  // 只问一句
  if (u > aA - 0.2) {
    if (c.cut === 'long') {
      g.save(); g.fillStyle = `rgba(7,11,26,${0.8 * ease(u, aA - 0.2, aA + 0.2)})`; g.fillRect(-W, -H, W * 2, H * 2); g.restore();
      slam(g, T(TL.txt.whatIf), 0, -60, P ? 44 : 60, C.ink, u, aA, { family: FT(), weight: '900', maxW: 2 * SW - 40, rgb: C.mintRGB });
      if (u > aA) bot(g, 0, 140, 1.3, u, { glow: 1, mood: 'happy', seed: 3 });
    } else {
      const k = pop(u, aA - 0.1);
      g.save(); g.translate(P ? -150 : -380, 10); g.scale(k, k);
      bubble(g, 0, 0, T(TL.txt.q1), C.ink, '#141a33', P ? 32 : 36);
      g.restore();
      const k2 = pop(u, aA + 0.6);
      g.save(); g.translate(P ? 170 : 380, -70); g.scale(k2, k2);
      bubble(g, 0, 0, T(TL.txt.a1), '#06251b', C.mint, P ? 32 : 36);
      g.restore();
    }
  }
};
// 对话气泡
function bubble(g, x, y, s, fg, bgc, size = 32) {
  const w = textW(g, s, size, FT(), '700') + size * 1.4, h = size * 2.1;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,10,0.35)'; rr(g, -w / 2 + 5, -h / 2 + 7, w, h, h / 2); g.fill();
  g.fillStyle = bgc; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill();
  g.beginPath(); g.moveTo(-w / 2 + 40, h / 2 - 4); g.lineTo(-w / 2 + 30, h / 2 + 22); g.lineTo(-w / 2 + 70, h / 2 - 4); g.fill();
  txt(g, s, 0, 2, size, fg, { weight: '700' });
  g.restore();
}
