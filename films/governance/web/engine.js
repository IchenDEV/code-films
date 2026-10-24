// 《写程序，越来越像治理一个组织》的渲染引擎：一切画面都是时间的纯函数；同一套镜头适配 16:9 与 9:16。
// 视觉语言：一个“活的组织”。胶囊小机器人是执行任务的 Agent（颜色 = 专长），戴环的是协调者，
// 人站在边上定方向；任务沿着路径流动，绿色是授权范围，橙红是越级的警报，强调色是要记住的词。
// 引用的书是一本本精装书（书名、作者、年份）：画面上的说法都有出处。调子（配色、背景、描边）由下面的主题决定。
const Q = new URLSearchParams(location.search);
const FMT = (window.TL && TL.fmt) || Q.get('fmt') || 'h';
const [W, H] = Q.get('size') ? Q.get('size').split('x').map(Number) : { h: [1920, 1080], v: [1080, 1920] }[FMT] || [1920, 1080];
const CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const PORTRAIT = H > W;
const ZH = true;
// 舞台：主体画面所在的区域。竖屏顶部留给常驻标题，底部留给字幕和平台按钮（视频号 6:7 安全区是 y 330–1590）
const ST = PORTRAIT ? { x: 40, y: 560, w: W - 80, h: 720 } : { x: 60, y: 96, w: W - 120, h: 800 };
ST.cx = ST.x + ST.w / 2; ST.cy = ST.y + ST.h / 2;
// 镜头里用的“舞台坐标”：原点在舞台中心，整体放大 Z 倍；竖屏约 ±417 × ±300，横屏约 ±804 × ±357
const Z = PORTRAIT ? 1.2 : 1.12;
const SW = ST.w / 2 / Z, SH = ST.h / 2 / Z;
const WIDE = !PORTRAIT;

// —— 主题：同一套镜头，三种调子（?theme= 或时间轴里的 theme；默认见 THEME）——
//   night  暖黑夜色、发光（初版；和前几部的深色调子太像）
//   paper  纸本：暖白纸面、墨线勾边、低饱和的柔和颜色，像一本绘本
//   poster 海报：米色底、红蓝黄黑的大色块与几何形、粗黑描边（包豪斯海报）。作者选的是这一套。
//          红色留给人、关键词和警报；协调者是黄色；Agent 是蓝、青、橙、浅蓝、橄榄绿
const THEMES = {
  night: {
    bg0: '#0b0a10', bg1: '#16131d', bg2: '#1f1a24',
    ink: '#f6f1e7', dim: '#a39cae', faint: '#4a4456', line: '#3a3446', panel: '#1b1822', panel2: '#25202e',
    warm: '#ffb454', gold: '#ffd166', teal: '#3fd6c8', violet: '#a493ff', coral: '#ff8a72', sky: '#62adff', lime: '#b9e66e',
    green: '#3fe08f', alarm: '#ff5a36', red: '#ff4d5e', skin: '#f1c7a1', hair: '#2b2230',
    key: '#ffd166', stroke: 'rgba(8,6,12,0.95)', capStroke: 'rgba(8,6,12,0.92)', capDim: 'rgba(246,241,231,0.42)',
    chipBg: '#f6f1e7', chipFg: '#120e18', bubble: '#f6f1e7', bubbleFg: '#17131c', card: '#efe6d6', cardLine: null, stampBg: 'rgba(10,8,14,0.6)',
    shadow: 'rgba(0,0,0,0.35)', textShadow: 'rgba(0,0,0,0.8)', glowK: 1, outline: null, scrimRGB: [8, 6, 12], vignette: 'rgba(4,2,8,0.6)',
    track: 'rgba(255,255,255,0.12)', band: 'rgba(255,255,255,0.05)', mistRGB: [230, 240, 255], flash: [255, 236, 206], dark: false,
  },
  paper: {
    bg0: '#f4eee3', bg1: '#efe6d6', bg2: '#e8dcc8',
    ink: '#2b2622', dim: '#7a7064', faint: '#c9bfae', line: '#d4c9b6', panel: '#fbf8f2', panel2: '#f6f0e5',
    warm: '#e58a3c', gold: '#c9532a', teal: '#3f9d8e', violet: '#7f6cc4', coral: '#e2765a', sky: '#4f86c6', lime: '#86a845',
    green: '#2f9a5f', alarm: '#e2452a', red: '#d23b3b', skin: '#f2c9a3', hair: '#3a2f2a',
    key: '#c9532a', stroke: 'rgba(250,246,238,0.96)', capStroke: 'rgba(250,246,238,0.96)', capDim: 'rgba(43,38,34,0.36)',
    chipBg: '#2b2622', chipFg: '#faf6ee', bubble: '#ffffff', bubbleFg: '#2b2622', card: '#ffffff', cardLine: '#2b2622', stampBg: 'rgba(255,252,246,0.92)',
    shadow: 'rgba(90,70,40,0.16)', textShadow: 'rgba(90,70,40,0.12)', glowK: 0.22, outline: '#2b2622', scrimRGB: [244, 238, 227], vignette: 'rgba(140,110,70,0.16)',
    track: 'rgba(43,38,34,0.12)', band: 'rgba(43,38,34,0.045)', mistRGB: [150, 170, 200], flash: [255, 255, 255], dark: false,
  },
  poster: {
    bg0: '#f1e8d6', bg1: '#ece2cd', bg2: '#e3d6bd',
    ink: '#151515', dim: '#5d5a54', faint: '#b9ae99', line: '#151515', panel: '#fbf6ec', panel2: '#f6efe0',
    warm: '#e0402c', gold: '#e0402c', boss: '#f2b705', teal: '#2a8f84', violet: '#2456c4', coral: '#f28c28', sky: '#6aa7e0', lime: '#8fae3a',
    green: '#2b8a55', alarm: '#e0402c', red: '#d33a2a', skin: '#f2c9a3', hair: '#151515',
    key: '#e0402c', stroke: 'rgba(245,238,224,0.97)', capStroke: 'rgba(245,238,224,0.97)', capDim: 'rgba(21,21,21,0.34)',
    chipBg: '#151515', chipFg: '#f6efe0', bubble: '#ffffff', bubbleFg: '#151515', card: '#ffffff', cardLine: '#151515', stampBg: 'rgba(250,246,236,0.94)',
    shadow: 'rgba(21,21,21,0.18)', textShadow: 'rgba(0,0,0,0)', glowK: 0.0, outline: '#151515', scrimRGB: [241, 232, 214], vignette: 'rgba(90,70,40,0.12)',
    track: 'rgba(21,21,21,0.14)', band: 'rgba(21,21,21,0.05)', mistRGB: [120, 140, 170], flash: [255, 255, 255], dark: false, thick: true,
  },
};
const THEME = Q.get('theme') || (window.TL && TL.theme) || 'poster'; // 作者选定：海报（2026-10-23）
const C = { ...THEMES[THEME] };
C.dark = THEME === 'night';
C.boss = C.boss ?? C.gold; // 协调者的颜色（海报主题里是黄，和警报的红分开）
for (const k of ['ink', 'dim', 'warm', 'gold', 'boss', 'teal', 'violet', 'coral', 'sky', 'lime', 'green', 'alarm', 'red']) C[k + 'RGB'] = [1, 3, 5].map((i) => parseInt(C[k].slice(i, i + 2), 16));
// Agent 的专长色（同一个 Agent 在不同镜头里颜色不变）
const AG = [C.teal, C.violet, C.coral, C.sky, C.lime];
const AGRGB = [C.tealRGB, C.violetRGB, C.coralRGB, C.skyRGB, C.limeRGB];
const F = {
  sans: '"SC Sans", "Noto Sans CJK SC", sans-serif',
  serif: '"SC Serif", "Noto Serif CJK SC", serif',
  grot: '"SC Grotesk", "SC Sans", sans-serif',
  mono: '"SC Mono", "Noto Sans Mono CJK SC", monospace',
};
const T = (pair) => (Array.isArray(pair) ? pair[0] : pair);
const FT = () => F.sans;

// —— 数学 ——
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => (b === a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
const sm = (k) => k * k * (3 - 2 * k);
const ease = (t, a, b) => sm(ramp(t, a, b));
const outExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
const outCubic = (k) => 1 - Math.pow(1 - k, 3);
const inCubic = (k) => k * k * k;
const inOutCubic = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - Math.pow(-2 * k + 2, 3) / 2);
const outBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const ex = (t, a, b) => outExpo(ramp(t, a, b));
const pop = (t, a, d = 0.35) => (t < a ? 0 : outBack(ramp(t, a, a + d)));
const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(ease(t, a, a + fi), 1 - ease(t, b - fo, b));
function rand(i, j = 0) { const x = Math.sin(i * 127.1 + j * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); }
const rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(a)})`;
const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 二次贝塞尔上的点
const qpt = (a, c, b, k) => [lerp(lerp(a[0], c[0], k), lerp(c[0], b[0], k), k), lerp(lerp(a[1], c[1], k), lerp(c[1], b[1], k), k)];

function makeCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
const INITS = [];
const SHOT = {}; // 镜头函数：SHOT[名字](g, c, s)，在 web/shots/*.js 里定义

// —— 背景（缓存成一张图，镜头里只平移）——
//   night：暖黑渐变 + 舞台后面一圈台灯的暖光 + 慢慢漂的光斑
//   paper：暖白纸面 + 纸纤维 + 几团很淡的水彩晕 + 笔记本点阵
//   poster：米色底 + 几块大的几何色块（圆、半圆、长方形）+ 很淡的网格
let BG;
INITS.push(() => {
  BG = makeCanvas(W + 240, H + 240);
  const g = BG.getContext('2d'), bw = BG.width, bh = BG.height;
  const gr = g.createLinearGradient(0, 0, 0, bh);
  gr.addColorStop(0, C.bg0); gr.addColorStop(0.55, C.bg1); gr.addColorStop(1, C.bg0);
  g.fillStyle = gr; g.fillRect(0, 0, bw, bh);
  if (THEME === 'night') {
    const lx = bw / 2, ly = ST.cy + 120;
    const lg = g.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.62);
    lg.addColorStop(0, 'rgba(255,170,90,0.10)'); lg.addColorStop(0.5, 'rgba(255,150,80,0.035)'); lg.addColorStop(1, 'rgba(255,150,80,0)');
    g.fillStyle = lg; g.fillRect(0, 0, bw, bh);
    g.strokeStyle = 'rgba(255,220,180,0.035)'; g.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      for (let x = 0; x <= bw; x += 20) { const y = (i + 0.5) * bh / 14 + Math.sin(x * 0.004 + i * 1.7) * 40 + Math.sin(x * 0.011 + i) * 12; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  } else if (THEME === 'paper') {
    // 水彩晕：几团极淡的颜色，压在纸纹下面
    [[0.15, 0.25, C.tealRGB], [0.85, 0.35, C.coralRGB], [0.3, 0.8, C.skyRGB], [0.8, 0.85, C.warmRGB]].forEach(([fx, fy, rgb], i) => {
      const r = Math.max(bw, bh) * (0.32 + 0.08 * i % 2);
      const wg = g.createRadialGradient(fx * bw, fy * bh, 0, fx * bw, fy * bh, r);
      wg.addColorStop(0, rgba(rgb, 0.10)); wg.addColorStop(0.6, rgba(rgb, 0.04)); wg.addColorStop(1, rgba(rgb, 0));
      g.fillStyle = wg; g.fillRect(0, 0, bw, bh);
    });
    // 纸纤维：短的细线和斑点（静态，不逐帧变化）
    for (let i = 0; i < 2600; i++) {
      const x = rand(i, 11) * bw, y = rand(i, 12) * bh, l = 2 + rand(i, 13) * 9, a = rand(i, 14) * TAU;
      g.strokeStyle = rand(i, 15) > 0.5 ? 'rgba(120,95,60,0.07)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.fillStyle = 'rgba(43,38,34,0.07)';
    for (let x = 30; x < bw; x += 60) for (let y = 30; y < bh; y += 60) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
  } else {
    // 包豪斯式的大色块（很淡），加一层细网格
    const sh = [
      () => { g.fillStyle = rgba(C.bossRGB, 0.28); g.beginPath(); g.arc(bw * 0.88, bh * 0.16, Math.min(bw, bh) * 0.3, 0, TAU); g.fill(); },
      () => { g.fillStyle = rgba(C.violetRGB, 0.10); g.beginPath(); g.arc(bw * 0.06, bh * 0.62, Math.min(bw, bh) * 0.3, -Math.PI / 2, Math.PI / 2); g.fill(); },
      () => { g.fillStyle = rgba(C.redRGB, 0.10); g.save(); g.translate(bw * 0.2, bh * 0.15); g.rotate(-0.25); g.fillRect(-140, -60, 280, 120); g.restore(); },
      () => { g.fillStyle = rgba(C.tealRGB, 0.10); g.beginPath(); g.moveTo(bw * 0.92, bh * 0.98); g.lineTo(bw * 1.0, bh * 0.72); g.lineTo(bw * 1.0, bh * 0.98); g.closePath(); g.fill(); },
    ];
    sh.forEach((f) => f());
    g.strokeStyle = 'rgba(21,21,21,0.05)'; g.lineWidth = 1.5;
    for (let x = 0; x <= bw; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, bh); g.stroke(); }
    for (let y = 0; y <= bh; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(bw, y); g.stroke(); }
  }
});
const MOTES = [...Array(46).keys()].map((i) => ({ x: rand(i, 1), y: rand(i, 2), r: 2 + rand(i, 3) * 7, sp: 0.004 + rand(i, 4) * 0.012, a: 0.05 + rand(i, 5) * 0.12, warm: rand(i, 6) > 0.4 }));
// tint：给整个画面一层颜色（橙 = 告急，绿 = 授权）
function bg(g, t, tint = null, k = 0) {
  const ox = 120 + Math.sin(t * 0.11) * 90, oy = 120 + Math.cos(t * 0.09) * 90;
  g.drawImage(BG, -ox, -oy);
  if (THEME === 'night') for (const m of MOTES) {
    const x = ((m.x + t * m.sp) % 1) * W, y = ((m.y + Math.sin(t * 0.3 + m.x * 9) * 0.01) % 1) * H;
    glow(g, x, y, m.r * 3, m.warm ? C.warmRGB : C.tealRGB, m.a);
  }
  if (tint && k > 0.004) {
    const gr = g.createRadialGradient(CX, ST.cy, 0, CX, ST.cy, Math.max(W, H) * 0.75);
    gr.addColorStop(0, rgba(tint, 0.16 * k)); gr.addColorStop(1, rgba(tint, 0.03 * k));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
}

// —— 光 ——
const spriteCache = new Map();
function glowSprite(rgb) {
  const key = rgb.map((v) => Math.round(v / 8) * 8).join(',');
  let c = spriteCache.get(key);
  if (c) return c;
  c = makeCanvas(64, 64);
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  const [r, gg, b] = rgb;
  gr.addColorStop(0, `rgba(${r},${gg},${b},0.9)`); gr.addColorStop(0.25, `rgba(${r},${gg},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  spriteCache.set(key, c);
  return c;
}
function glow(g, x, y, r, rgb, a = 1) {
  a *= C.glowK; // 亮色主题里光晕很淡（海报主题没有）
  if (a <= 0.004 || r <= 0.3) return;
  const base = g.globalAlpha;
  g.globalAlpha = base * Math.min(1, a);
  g.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
  g.globalAlpha = base;
}

// —— 形状 ——
function rr(g, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function panel(g, x, y, w, h, o = {}) {
  g.save();
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.shadow !== false) { g.fillStyle = C.shadow; rr(g, x + 6, y + 8, w, h, o.r ?? 18); g.fill(); }
  rr(g, x, y, w, h, o.r ?? 18);
  g.fillStyle = o.fill ?? C.panel; g.fill();
  if (o.stroke !== null) { g.lineWidth = o.lw ?? 3; g.strokeStyle = o.stroke ?? C.line; g.stroke(); }
  g.restore();
}
function line(g, x1, y1, x2, y2, color, w = 3, dash = null, off = 0) {
  g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; if (dash) { g.setLineDash(dash); g.lineDashOffset = off; }
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
}
// 箭头：k 是画出来的进度
function arrow(g, x1, y1, x2, y2, color, w = 5, k = 1, head = 16) {
  if (k <= 0.01) return;
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k), a = Math.atan2(y2 - y1, x2 - x1);
  line(g, x1, y1, x - Math.cos(a) * head * 0.6, y - Math.sin(a) * head * 0.6, color, w);
  g.save(); g.fillStyle = color; g.translate(x, y); g.rotate(a);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-head, -head * 0.6); g.lineTo(-head, head * 0.6); g.closePath(); g.fill(); g.restore();
}
// 发光的路径：pts 是折线；k 是画出来的比例；flow 让虚线沿路径流动（任务在走）
function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function pathAt(pts, k) {
  const L = pathLen(pts) * clamp(k);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + d >= L) { const f = d ? (L - acc) / d : 0; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
    acc += d;
  }
  const n = pts.length - 1; return [pts[n][0], pts[n][1], Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0])];
}
function trail(g, pts, rgb, t, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.005) return;
  const L = pathLen(pts) * k;
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + d >= L) { const f = (L - acc) / d; g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); break; }
    g.lineTo(pts[i][0], pts[i][1]); acc += d;
  }
  const w = (o.w ?? 6) * (C.thick ? 1.3 : 1), a = o.alpha ?? 1;
  if (C.dark) { g.strokeStyle = rgba(rgb, 0.16 * a); g.lineWidth = w * 3.2; g.stroke(); }
  if (C.thick && o.outline !== false) { g.strokeStyle = rgba([21, 21, 21], 0.9 * a); g.lineWidth = w + 5; g.stroke(); }
  g.strokeStyle = rgba(rgb, (C.dark ? 0.55 : 0.9) * a); g.lineWidth = w; g.stroke();
  if (o.flow !== false) {
    g.setLineDash([w * 1.6, w * 3.4]); g.lineDashOffset = -t * (o.speed ?? 60);
    g.strokeStyle = rgba(mixRGB(rgb, [255, 255, 255], C.dark ? 0.55 : 0.75), 0.95 * a); g.lineWidth = w * 0.6; g.stroke();
  }
  g.restore();
}

// —— 文字 ——
function setFont(g, size, family = FT(), weight = '700') { g.font = `${weight} ${Math.round(size)}px ${family}`; }
function txt(g, s, x, y, size, color, o = {}) {
  g.save();
  setFont(g, size, o.family ?? FT(), o.weight ?? '700');
  g.textAlign = o.align ?? 'center'; g.textBaseline = o.base ?? 'middle';
  if (o.spacing) g.letterSpacing = o.spacing;
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  let sc = 1;
  if (o.maxW) { const w = g.measureText(s).width; if (w > o.maxW) sc = o.maxW / w; }
  g.translate(x, y); g.scale(sc, sc);
  if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur ?? 14; g.shadowOffsetY = o.dy ?? 3; }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.stroke; g.strokeStyle = o.strokeColor ?? C.stroke; g.strokeText(s, 0, 0); g.shadowColor = 'transparent'; }
  g.fillStyle = color; g.fillText(s, 0, 0);
  g.restore();
}
function textW(g, s, size, family = FT(), weight = '700') { g.save(); setFont(g, size, family, weight); const w = g.measureText(s).width; g.restore(); return w; }
// 底色上的字用深色还是浅色（按底色亮度选，三个主题通用）
function fgOn(bgc) {
  const m = bgc.startsWith('#') ? [1, 3, 5].map((i) => parseInt(bgc.slice(i, i + 2), 16)) : bgc.match(/[\d.]+/g).slice(0, 3).map(Number);
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] < 150 ? '#fffaf2' : '#17131c';
}
// 胶囊标签；fg 为 null 时按底色自动选字色
function chip(g, s, x, y, size, fg, bgc, o = {}) {
  fg = fg ?? fgOn(bgc);
  if (o.maxW) { const w0 = textW(g, s, size, o.family ?? FT(), o.weight ?? '700') + size * 1.2; if (w0 > o.maxW) size *= o.maxW / w0; }
  const w = textW(g, s, size, o.family ?? FT(), o.weight ?? '700') + size * 1.2, h = size * 1.75;
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  g.save(); g.globalAlpha *= o.alpha ?? 1;
  rr(g, x0, y - h / 2, w, h, h / 2); g.fillStyle = bgc; g.fill();
  if (o.stroke) { g.lineWidth = 2.5; g.strokeStyle = o.stroke; g.stroke(); }
  g.restore();
  txt(g, s, x0 + w / 2, y + size * 0.04, size, fg, { family: o.family, weight: o.weight, alpha: o.alpha });
  return w;
}
// 大字“砸”下来：之后保持
function slam(g, s, x, y, size, color, t, t0, o = {}) {
  if (t < t0) return;
  const k = ramp(t, t0, t0 + 0.28);
  const sc = lerp(o.from ?? 1.9, 1, outCubic(k)) * (1 + 0.04 * Math.sin(ramp(t, t0 + 0.28, t0 + 0.6) * Math.PI));
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2.5) * (o.alpha ?? 1);
  if (o.glow !== false) glow(g, 0, 0, size * 1.6, o.rgb ?? C.goldRGB, 0.3 * (1 - 0.5 * k));
  txt(g, s, 0, 0, size, color, { family: o.family ?? F.sans, weight: o.weight ?? '900', shadow: C.textShadow, blur: 20, maxW: o.maxW, align: o.align, spacing: o.spacing, stroke: o.stroke });
  g.restore();
  const r = ramp(t, t0 + 0.05, t0 + 0.6);
  if (r > 0 && r < 1 && o.ring !== false) {
    g.save(); g.strokeStyle = rgba(o.rgb ?? C.goldRGB, 0.55 * (1 - r)); g.lineWidth = 6 * (1 - r) + 1;
    g.beginPath(); g.ellipse(x, y, size * (0.6 + 2.2 * outCubic(r)) * (o.ringW ?? 1.6), size * (0.6 + 1.4 * outCubic(r)), 0, 0, TAU); g.stroke(); g.restore();
  }
}
// 盖章：大字斜着落下来
function stamp(g, s, x, y, size, color, t, t0, rot = -0.12, o = {}) {
  if (t < t0) return;
  const k = ramp(t, t0, t0 + 0.22);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(lerp(2.4, 1, outCubic(k)), lerp(2.4, 1, outCubic(k))); g.globalAlpha *= clamp(k * 3) * (o.alpha ?? 1);
  const w = textW(g, s, size, F.sans, '900') + size * 0.7, h = size * 1.3;
  g.fillStyle = C.stampBg; rr(g, -w / 2, -h / 2, w, h, size * 0.18); g.fill();
  g.lineWidth = size * 0.09; g.strokeStyle = color; rr(g, -w / 2, -h / 2, w, h, size * 0.18); g.stroke();
  txt(g, s, 0, size * 0.04, size, color, { weight: '900' });
  g.restore();
}
// 一段文字按字逐个出现（k 0..1）
function typeOn(g, s, x, y, size, color, k, o = {}) {
  const chars = [...s], n = Math.floor(chars.length * clamp(k) + 0.0001);
  if (n <= 0) return;
  txt(g, chars.slice(0, n).join(''), x, y, size, color, o);
}

// —— 角色 ——
// Agent：胶囊形的小机器人（原创造型）：圆角竖胶囊身体、一条面罩、两只眼、头顶一颗指示灯。
// o: { color, mood: 'ok'|'focus'|'happy'|'stress'|'dizzy'|'sleep', seed, look: -1..1, crown: 协调者的金环, carry: 抱着的东西颜色, still, alpha, lamp: 指示灯 0..1 }
function agent(g, x, y, s, t, o = {}) {
  const seed = o.seed ?? 1, col = o.color ?? C.teal;
  const bob = o.still ? 0 : Math.sin(t * (4 + rand(seed, 3) * 3) + seed * 7) * 2.5;
  g.save(); g.translate(x, y + bob * s); g.scale(s, s);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.rot) g.rotate(o.rot);
  if (o.squash) g.scale(1 + o.squash * 0.15, 1 - o.squash * 0.15);
  g.fillStyle = C.shadow; g.beginPath(); g.ellipse(0, 52 - bob, 30, 6, 0, 0, TAU); g.fill();
  const rgb = hex(col), OL = C.thick ? 5 : 3.5;
  glow(g, 0, 0, 70, rgb, 0.18 + 0.2 * (o.lamp ?? 0.3));
  // 协调者：身后一圈金环
  if (o.crown) {
    g.save(); g.strokeStyle = C.thick ? C.outline : rgba(C.bossRGB, 0.9); g.lineWidth = C.dark ? 4 : 6;
    g.beginPath(); g.ellipse(0, -2, 52, 58, 0, 0, TAU); g.stroke();
    g.setLineDash([6, 10]); g.lineDashOffset = -t * 20; g.strokeStyle = C.thick ? C.outline : rgba(C.bossRGB, 0.5); g.beginPath(); g.ellipse(0, -2, 62, 68, 0, 0, TAU); g.stroke();
    g.restore();
  }
  // 脚
  g.fillStyle = C.dark ? '#0f0d14' : C.outline; rr(g, -20, 38, 14, 12, 5); g.fill(); rr(g, 6, 38, 14, 12, 5); g.fill();
  // 身体（亮色主题有墨线勾边）
  rr(g, -32, -44, 64, 86, 32); g.fillStyle = col; g.fill();
  if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = OL; g.stroke(); }
  g.save(); rr(g, -32, -44, 64, 86, 32); g.clip();
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-32, 14, 64, 40);
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-14, -26, 9, 14, -0.4, 0, TAU); g.fill();
  g.restore();
  // 面罩
  rr(g, -24, -22, 48, 26, 13); g.fillStyle = '#14111b'; g.fill();
  const lk = (o.look ?? 0) * 5, mood = o.mood ?? 'ok';
  g.strokeStyle = g.fillStyle = mood === 'stress' || mood === 'dizzy' ? '#ffb3a6' : '#e9fffb'; g.lineWidth = 3.2; g.lineCap = 'round';
  if (mood === 'happy') {
    g.beginPath(); g.arc(-9 + lk, -6, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(9 + lk, -6, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  } else if (mood === 'stress') {
    g.beginPath(); g.moveTo(-14 + lk, -13); g.lineTo(-6 + lk, -9); g.lineTo(-14 + lk, -5); g.stroke();
    g.beginPath(); g.moveTo(14 + lk, -13); g.lineTo(6 + lk, -9); g.lineTo(14 + lk, -5); g.stroke();
  } else if (mood === 'dizzy') {
    for (const d of [-1, 1]) { g.beginPath(); for (let a = 0; a < 9; a += 0.4) { const r = a * 0.7; const px = d * 9 + lk + Math.cos(a + t * 8) * r, py = -9 + Math.sin(a + t * 8) * r; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  } else if (mood === 'sleep') {
    line(g, -14 + lk, -9, -5 + lk, -9, '#e9fffb', 3); line(g, 5 + lk, -9, 14 + lk, -9, '#e9fffb', 3);
  } else {
    const blink = Math.sin(t * 1.3 + seed * 9) > 0.985 ? 0.15 : 1;
    const eh = (mood === 'focus' ? 5 : 11) * blink;
    rr(g, -13 + lk, -9 - eh / 2, 7, eh, 3); g.fill(); rr(g, 6 + lk, -9 - eh / 2, 7, eh, 3); g.fill();
  }
  // 头顶的指示灯
  const lamp = o.lamp ?? 0.3, lrgb = o.lampRGB ?? (o.crown ? C.bossRGB : [233, 255, 251]);
  line(g, 0, -44, 0, -54, C.outline ?? 'rgba(0,0,0,0.5)', C.outline ? OL : 4);
  glow(g, 0, -58, 12 + 12 * lamp, lrgb, 0.3 + 0.6 * lamp);
  g.fillStyle = C.dark ? rgba(lrgb, 0.6 + 0.4 * lamp) : rgba(mixRGB([250, 246, 238], lrgb[0] > 200 && lrgb[1] > 200 && lrgb[2] > 200 ? C.goldRGB : lrgb, lamp), 1);
  g.beginPath(); g.arc(0, -58, 5.5, 0, TAU); g.fill();
  if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = 2.5; g.stroke(); }
  if (o.carry) taskCard(g, 0, 22, 0.55, o.carry);
  g.restore();
}
// 人：圆头、暖色上衣；可选：咖啡杯、灭火器、笔记本电脑、指向
function human(g, x, y, s, t, o = {}) {
  const seed = o.seed ?? 1;
  const bob = o.still ? 0 : Math.sin(t * 2 + seed) * 1.5;
  g.save(); g.translate(x, y + bob * s); g.scale(s, s);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.flip) g.scale(-1, 1);
  g.fillStyle = C.shadow; g.beginPath(); g.ellipse(0, 74, 46, 8, 0, 0, TAU); g.fill();
  glow(g, 0, 10, 110, C.warmRGB, 0.16 * (o.glow ?? 1));
  // 身体
  rr(g, -38, 4, 76, 70, 30); g.fillStyle = o.shirt ?? C.warm; g.fill();
  if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = C.thick ? 5 : 3.5; g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; rr(g, -38, 44, 76, 30, 14); g.fill();
  // 手臂
  g.strokeStyle = o.shirt ?? C.warm; g.lineWidth = 15; g.lineCap = 'round';
  const arm = o.arm ?? 0; // 0 垂下，1 指向前方，-1 抱胸 / 叉腰
  if (arm > 0) { g.beginPath(); g.moveTo(26, 20); g.lineTo(26 + 40 * arm, 4 - 26 * arm); g.stroke(); g.fillStyle = o.skin ?? C.skin; g.beginPath(); g.arc(26 + 46 * arm, 2 - 30 * arm, 8, 0, TAU); g.fill(); }
  else { g.beginPath(); g.moveTo(30, 20); g.lineTo(38, 54); g.stroke(); }
  g.beginPath(); g.moveTo(-30, 20); g.lineTo(-38, 54); g.stroke();
  // 头
  g.fillStyle = o.skin ?? C.skin; g.beginPath(); g.arc(0, -30, 30, 0, TAU); g.fill();
  g.fillStyle = o.hair ?? C.hair; g.beginPath(); g.arc(0, -36, 31, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  g.fillStyle = '#2b2230'; const lk = (o.look ?? 0) * 4;
  if (o.eyes === 'closed') { g.strokeStyle = '#2b2230'; g.lineWidth = 3; g.beginPath(); g.arc(-10 + lk, -27, 4, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.arc(10 + lk, -27, 4, 0.1, Math.PI - 0.1); g.stroke(); }
  else { g.beginPath(); g.arc(-10 + lk, -27, 3.5, 0, TAU); g.arc(10 + lk, -27, 3.5, 0, TAU); g.fill(); }
  if (o.mouth === 'open') { g.fillStyle = '#5a2030'; g.beginPath(); g.ellipse(0 + lk, -13, 6, 7, 0, 0, TAU); g.fill(); }
  else if (o.mouth === 'flat') { line(g, -6 + lk, -14, 6 + lk, -14, '#2b2230', 3); }
  else { g.strokeStyle = '#2b2230'; g.lineWidth = 3; g.beginPath(); g.arc(0 + lk, -18, 7, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  if (o.sweat) { g.fillStyle = '#9fd8ff'; g.beginPath(); g.moveTo(30, -46); g.quadraticCurveTo(38, -34, 30, -30); g.quadraticCurveTo(22, -34, 30, -46); g.fill(); }
  if (o.mug) { g.fillStyle = '#e9e2d6'; rr(g, 30, 30, 22, 26, 5); g.fill(); g.strokeStyle = '#e9e2d6'; g.lineWidth = 4; g.beginPath(); g.arc(54, 42, 7, -1.2, 1.2); g.stroke();
    for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; g.strokeStyle = `rgba(255,255,255,${0.35 * (1 - k)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(38 + i * 7, 26 - k * 30); g.quadraticCurveTo(44 + i * 7, 18 - k * 30, 38 + i * 7, 10 - k * 30); g.stroke(); } }
  if (o.laptop) {
    g.fillStyle = '#cfc7d9'; rr(g, -46, 32, 92, 8, 3); g.fill();
    g.fillStyle = '#9d94ad'; g.save(); g.translate(0, 32); g.transform(1, 0, -0.25, 1, 0, 0); rr(g, -40, -54, 80, 54, 6); g.fill(); g.restore();
    glow(g, -6, 6, 30, C.skyRGB, 0.3);
  }
  g.restore();
}
// 任务卡：一张小卡片（几行字的示意）
function taskCard(g, x, y, s, color = C.ink, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  rr(g, -34, -24, 68, 48, 8); g.fillStyle = C.card; g.fill();
  if (C.cardLine) { g.strokeStyle = C.cardLine; g.lineWidth = C.thick ? 4 : 3; g.stroke(); }
  g.fillStyle = color; rr(g, -34, -24, 10, 48, 4); g.fill();
  g.fillStyle = 'rgba(40,30,50,0.45)'; for (let i = 0; i < 3; i++) { rr(g, -18, -12 + i * 12, 40 - i * 9, 5, 2.5); g.fill(); }
  if (o.check) { g.strokeStyle = C.green; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 4); g.lineTo(18, 13); g.lineTo(32, -8); g.stroke(); }
  g.restore();
}
// 被引用的书：精装书正面（书名、作者、年份），被台灯照亮。o: { color, w, h, alpha, sub }
function book(g, x, y, s, title, author, year, o = {}) {
  const w = o.w ?? 230, h = o.h ?? 320, col = o.color ?? '#7a2e2e';
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  glow(g, 0, -h * 0.1, h * 0.9, C.warmRGB, 0.25);
  g.fillStyle = C.shadow; rr(g, -w / 2 + 10, -h / 2 + 14, w, h, 8); g.fill();
  // 书页的厚度
  g.fillStyle = '#e8dcc4'; rr(g, -w / 2 + 6, -h / 2 + 6, w, h, 6); g.fill();
  g.fillStyle = col; rr(g, -w / 2, -h / 2, w, h, 6); g.fill();
  const lg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  lg.addColorStop(0, 'rgba(255,255,255,0.16)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = lg; rr(g, -w / 2, -h / 2, w, h, 6); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2 + 14, -h / 2, 4, h);
  g.strokeStyle = 'rgba(255,214,140,0.55)'; g.lineWidth = 2; g.strokeRect(-w / 2 + 26, -h / 2 + 18, w - 44, h - 36);
  const gold = '#f3d28c';
  const lines = Array.isArray(title) ? title : [title];
  const ts = o.ts ?? (lines.some((l) => [...l].length > 5) ? 30 : 38);
  lines.forEach((l, i) => txt(g, l, 8, -h * 0.18 + (i - (lines.length - 1) / 2) * ts * 1.3, ts, gold, { family: F.serif, weight: '900', maxW: w - 64 }));
  line(g, -w * 0.18 + 8, h * 0.06, w * 0.18 + 8, h * 0.06, 'rgba(243,210,140,0.6)', 2);
  txt(g, author, 8, h * 0.17, 19, gold, { family: F.serif, weight: '600', maxW: w - 64 });
  if (o.sub) txt(g, o.sub, 8, h * 0.26, 15, 'rgba(243,210,140,0.75)', { family: F.grot, weight: '500', maxW: w - 64 });
  txt(g, String(year), 8, h * 0.38, 24, gold, { family: F.grot, weight: '700' });
  g.restore();
}
// 镜头角落里的出处：一本小书 + 一行“据《…》”。k 是出现进度
function cite(g, b, k, o = {}) {
  if (k <= 0.004) return;
  const x = o.x ?? (WIDE ? -SW + 120 : -SW + 86), y = o.y ?? (WIDE ? -SH + 150 : -SH + 112), s = (o.s ?? (WIDE ? 0.62 : 0.48)) * lerp(0.8, 1, outBack(k));
  g.save(); g.globalAlpha *= clamp(k * 1.6);
  book(g, x, y, s, b.title, b.author, b.year, { color: b.color, sub: b.en, rot: o.rot ?? -0.05 });
  g.restore();
}
// 关口：一道拱门；state 0 待检、1 通过（绿）、-1 拦下（红）
function gate(g, x, y, s, state = 0, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const rgb = state > 0 ? C.greenRGB : state < 0 ? C.redRGB : C.dimRGB;
  glow(g, 0, -40, 90, rgb, 0.25 + 0.2 * Math.abs(state));
  g.strokeStyle = rgba(rgb, 0.95); g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-50, 60); g.lineTo(-50, -30); g.arc(0, -30, 50, Math.PI, 0); g.lineTo(50, 60); g.stroke();
  if (o.label) txt(g, o.label, 0, -100, 24, rgba(rgb, 1), { weight: '800' });
  if (state > 0) { g.strokeStyle = C.green; g.lineWidth = 9; g.beginPath(); g.moveTo(-18, -32); g.lineTo(-4, -18); g.lineTo(22, -46); g.stroke(); }
  if (state < 0) { line(g, -16, -46, 16, -14, C.red, 9); line(g, 16, -46, -16, -14, C.red, 9); }
  g.restore();
}
// 打勾的小圆章 / 叉
function badge(g, x, y, r, kind = 'check', col = C.green) {
  g.save(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = '#0d0b12'; g.lineWidth = r * 0.24; g.lineCap = 'round';
  if (kind === 'check') { g.beginPath(); g.moveTo(x - r * 0.45, y); g.lineTo(x - r * 0.1, y + r * 0.35); g.lineTo(x + r * 0.5, y - r * 0.35); g.stroke(); }
  else { line(g, x - r * 0.35, y - r * 0.35, x + r * 0.35, y + r * 0.35, '#0d0b12', r * 0.24); line(g, x + r * 0.35, y - r * 0.35, x - r * 0.35, y + r * 0.35, '#0d0b12', r * 0.24); }
  g.restore();
}
// 对话气泡
function bubble(g, x, y, s, text, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha != null) g.globalAlpha *= o.alpha;
  const size = o.size ?? 30, w = textW(g, text, size, o.family ?? FT(), o.weight ?? '800') + size * 1.2, h = size * 1.9;
  g.fillStyle = o.fill ?? C.bubble; rr(g, -w / 2, -h / 2, w, h, h / 2.4); g.fill();
  if (C.outline) { g.strokeStyle = C.outline; g.lineWidth = 3; g.stroke(); }
  const tx = o.tail ?? 0; g.beginPath(); g.moveTo(tx - 10, h / 2 - 2); g.lineTo(tx + 6, h / 2 + 16); g.lineTo(tx + 14, h / 2 - 2); g.fill();
  txt(g, text, 0, size * 0.04, size, o.color ?? C.bubbleFg, { family: o.family, weight: o.weight ?? '800' });
  g.restore();
}
// 火：一团跳动的火苗
function flame(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha != null) g.globalAlpha *= o.alpha;
  glow(g, 0, -20, 80, C.alarmRGB, 0.5);
  const f = (k, c, sc) => {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, 30 * sc);
    const wob = Math.sin(t * 14 + k) * 6 * sc;
    g.bezierCurveTo(34 * sc, 20 * sc, 26 * sc + wob, -30 * sc, 0 + wob, -64 * sc);
    g.bezierCurveTo(-24 * sc + wob, -30 * sc, -34 * sc, 20 * sc, 0, 30 * sc); g.fill();
  };
  f(0, C.alarm, 1); f(1.3, '#ffb347', 0.68); f(2.1, '#fff1b0', 0.36);
  g.restore();
}
// 图标
function icon(g, kind, x, y, s, color, t = 0) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'check': g.beginPath(); g.moveTo(-34, 2); g.lineTo(-10, 26); g.lineTo(36, -24); g.stroke(); break;
    case 'cross': g.beginPath(); g.moveTo(-28, -28); g.lineTo(28, 28); g.moveTo(28, -28); g.lineTo(-28, 28); g.stroke(); break;
    case 'bolt': g.beginPath(); g.moveTo(8, -46); g.lineTo(-24, 6); g.lineTo(0, 6); g.lineTo(-8, 46); g.lineTo(24, -8); g.lineTo(0, -8); g.closePath(); g.fill(); break;
    case 'star': g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 44, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'gear': g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 30 : 42, a = (i * Math.PI) / 8 + t; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = '#16131d'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill(); break;
    case 'eye': g.beginPath(); g.moveTo(-44, 0); g.quadraticCurveTo(0, -38, 44, 0); g.quadraticCurveTo(0, 38, -44, 0); g.stroke(); g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill(); break;
    case 'lock': rr(g, -30, -6, 60, 46, 8); g.fill(); g.beginPath(); g.arc(0, -8, 20, Math.PI, 0); g.stroke(); break;
    case 'flag': line(g, -20, 44, -20, -44, color, 8); g.beginPath(); g.moveTo(-20, -44); g.lineTo(34, -30); g.lineTo(-20, -14); g.closePath(); g.fill(); break;
    case 'test': rr(g, -34, -40, 68, 80, 10); g.stroke(); g.beginPath(); g.moveTo(-18, -6); g.lineTo(-6, 6); g.lineTo(18, -18); g.stroke(); line(g, -18, 24, 18, 24, color, 7); break;
    case 'diff': for (let i = 0; i < 4; i++) { g.globalAlpha = 1; g.fillStyle = i % 2 ? '#ff6b6b' : '#3fe08f'; rr(g, -34, -34 + i * 18, 20 + ((i * 37) % 48), 10, 5); g.fill(); } break;
    case 'tag': g.beginPath(); g.moveTo(-36, -20); g.lineTo(14, -20); g.lineTo(36, 0); g.lineTo(14, 20); g.lineTo(-36, 20); g.closePath(); g.stroke(); g.beginPath(); g.arc(12, 0, 6, 0, TAU); g.fill(); break;
    case 'q': setFont(g, 96, F.grot, '700'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 4); break;
  }
  g.restore();
}
