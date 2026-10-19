// 《Anthropic 不再逐行审代码了》的渲染引擎（沿用上一部《Anthropic 把 Git 换掉了》的画面语言）：一切画面都是时间的纯函数；同一套镜头适配 16:9 与 9:16。
// 视觉语言：深蓝蓝图上的扁平动态图形。橙色小机器人是写代码的 Claude，紫色是审查的 AI，红色小虫是问题，薄荷绿是通过，金色是数字。
const Q = new URLSearchParams(location.search);
const FMT = (window.TL && TL.fmt) || Q.get('fmt') || 'h';
const [W, H] = Q.get('size') ? Q.get('size').split('x').map(Number) : { h: [1920, 1080], v: [1080, 1920] }[FMT] || [1920, 1080];
const CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const PORTRAIT = H > W;
const LANG = (window.TL && TL.lang) || Q.get('lang') || 'zh';
const ZH = LANG === 'zh';
// 舞台：主体画面所在的区域。竖屏顶部留给常驻标题，底部留给字幕和平台按钮（视频号 6:7 安全区是 y 330–1590）
const ST = PORTRAIT ? { x: 40, y: 560, w: W - 80, h: 720 } : { x: 60, y: 96, w: W - 120, h: 800 };
ST.cx = ST.x + ST.w / 2; ST.cy = ST.y + ST.h / 2;
// 镜头里用的“舞台坐标”：原点在舞台中心，整体放大 Z 倍（手机上看得清）；竖屏约 833 × 600，横屏约 1607 × 714
const Z = PORTRAIT ? 1.2 : 1.12;
const SW = ST.w / 2 / Z, SH = ST.h / 2 / Z;
const WIDE = !PORTRAIT;

const C = {
  bg0: '#070b1a', bg1: '#0c1430', grid: 'rgba(110,150,255,0.075)', gridHi: 'rgba(110,150,255,0.16)',
  ink: '#f5f2ea', inkRGB: [245, 242, 234], dim: '#8d97ba', dimRGB: [141, 151, 186], faint: '#3a4670', panel: '#121b3c', panel2: '#18244d', line: '#2b3a6e',
  clay: '#ff8a4c', clayRGB: [255, 138, 76], clayDk: '#c95d2a', // 智能体
  mint: '#3ef0b0', mintRGB: [62, 240, 176], mintDk: '#1a9c72', // Scion
  red: '#ff4a5f', redRGB: [255, 74, 95], // Git 撑不住
  blue: '#58b8ff', blueRGB: [88, 184, 255], // 数据
  gold: '#ffd166', goldRGB: [255, 209, 102], // 数字
  violet: '#a58bff', violetRGB: [165, 139, 255],
  skin: '#f1c7a1', hair: '#2a2236',
};
const F = {
  sans: '"SC Sans", "Noto Sans CJK SC", sans-serif',
  grot: '"SC Grotesk", "SC Sans", sans-serif',
  mono: '"SC Mono", "Noto Sans Mono CJK SC", monospace',
};
const T = (pair) => (Array.isArray(pair) ? pair[ZH ? 0 : 1] : pair);
const FT = () => (ZH ? F.sans : F.grot); // 当前语言的正文字体

// —— 数学 ——
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => (b === a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
const sm = (k) => k * k * (3 - 2 * k);
const ease = (t, a, b) => sm(ramp(t, a, b));
const outExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
const outCubic = (k) => 1 - Math.pow(1 - k, 3);
const inCubic = (k) => k * k * k;
const outBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const ex = (t, a, b) => outExpo(ramp(t, a, b));
const pop = (t, a, d = 0.35) => (t < a ? 0 : outBack(ramp(t, a, a + d)));
const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(ease(t, a, a + fi), 1 - ease(t, b - fo, b));
function rand(i, j = 0) { const x = Math.sin(i * 127.1 + j * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); }
const rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(a)})`;
const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const fmtInt = (n) => (ZH ? String(Math.round(n)) : Math.round(n).toLocaleString('en-US'));

function makeCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
const INITS = [];
const SHOT = {}; // 镜头函数：SHOT[名字](g, c, s)，在 web/shots/*.js 里定义

// —— 背景：深蓝渐变 + 蓝图网格（缓存成一张图，镜头里只平移）——
let BG;
INITS.push(() => {
  BG = makeCanvas(W + 240, H + 240);
  const g = BG.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, BG.height);
  gr.addColorStop(0, C.bg0); gr.addColorStop(0.5, C.bg1); gr.addColorStop(1, C.bg0);
  g.fillStyle = gr; g.fillRect(0, 0, BG.width, BG.height);
  const step = 60;
  for (let x = 0; x <= BG.width; x += step) { g.fillStyle = x % (step * 4) === 0 ? C.gridHi : C.grid; g.fillRect(x, 0, 1.5, BG.height); }
  for (let y = 0; y <= BG.height; y += step) { g.fillStyle = y % (step * 4) === 0 ? C.gridHi : C.grid; g.fillRect(0, y, BG.width, 1.5); }
  for (let x = 0; x <= BG.width; x += step * 4) for (let y = 0; y <= BG.height; y += step * 4) { g.fillStyle = 'rgba(140,175,255,0.3)'; g.fillRect(x - 3, y - 0.75, 7.5, 1.5); g.fillRect(x - 0.75, y - 3, 1.5, 7.5); }
});
// tint：给整个画面一层颜色（红 = 告急，绿 = Scion）
function bg(g, t, tint = null, k = 0) {
  const ox = 120 + Math.sin(t * 0.13) * 100, oy = 120 + Math.cos(t * 0.11) * 100;
  g.drawImage(BG, -ox, -oy);
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
  if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,10,0.35)'; rr(g, x + 6, y + 8, w, h, o.r ?? 18); g.fill(); }
  rr(g, x, y, w, h, o.r ?? 18);
  g.fillStyle = o.fill ?? C.panel; g.fill();
  if (o.stroke !== null) { g.lineWidth = o.lw ?? 3; g.strokeStyle = o.stroke ?? C.line; g.stroke(); }
  g.restore();
}
function line(g, x1, y1, x2, y2, color, w = 3, dash = null) {
  g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; if (dash) g.setLineDash(dash);
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
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.stroke; g.strokeStyle = o.strokeColor ?? 'rgba(4,6,18,0.95)'; g.strokeText(s, 0, 0); g.shadowColor = 'transparent'; }
  g.fillStyle = color; g.fillText(s, 0, 0);
  g.restore();
}
function textW(g, s, size, family = FT(), weight = '700') { g.save(); setFont(g, size, family, weight); const w = g.measureText(s).width; g.restore(); return w; }
// 胶囊标签
function chip(g, s, x, y, size, fg, bgc, o = {}) {
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
// 大数字“砸”下来：k 从 0 到 1；之后保持
function slam(g, s, x, y, size, color, t, t0, o = {}) {
  if (t < t0) return;
  const k = ramp(t, t0, t0 + 0.28);
  const sc = lerp(o.from ?? 1.9, 1, outCubic(k)) * (1 + 0.04 * Math.sin(ramp(t, t0 + 0.28, t0 + 0.6) * Math.PI));
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2.5) * (o.alpha ?? 1);
  if (o.glow !== false) glow(g, 0, 0, size * 1.6, o.rgb ?? C.goldRGB, 0.35 * (1 - 0.5 * k));
  txt(g, s, 0, 0, size, color, { family: o.family ?? F.grot, weight: o.weight ?? '700', shadow: 'rgba(0,0,10,0.8)', blur: 20, maxW: o.maxW, align: o.align, spacing: o.spacing });
  g.restore();
  // 冲击波
  const r = ramp(t, t0 + 0.05, t0 + 0.6);
  if (r > 0 && r < 1 && o.ring !== false) {
    g.save(); g.strokeStyle = rgba(o.rgb ?? C.goldRGB, 0.6 * (1 - r)); g.lineWidth = 6 * (1 - r) + 1;
    g.beginPath(); g.ellipse(x, y, size * (0.6 + 2.2 * outCubic(r)) * (o.ringW ?? 1.6), size * (0.6 + 1.4 * outCubic(r)), 0, 0, TAU); g.stroke(); g.restore();
  }
}
// 盖章：大字斜着落下来
function stamp(g, s, x, y, size, color, rgb, t, t0, rot = -0.12, o = {}) {
  if (t < t0) return;
  const k = ramp(t, t0, t0 + 0.22);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(lerp(2.4, 1, outCubic(k)), lerp(2.4, 1, outCubic(k))); g.globalAlpha *= clamp(k * 3);
  const w = textW(g, s, size, o.family ?? FT(), '900') + size * 0.7, h = size * 1.3;
  g.lineWidth = size * 0.09; g.strokeStyle = color; rr(g, -w / 2, -h / 2, w, h, size * 0.18); g.stroke();
  txt(g, s, 0, size * 0.04, size, color, { family: o.family ?? FT(), weight: '900' });
  g.restore();
}
// —— 角色：智能体小机器人（原创造型：圆角方块身体、面罩、两只眼睛、天线）——
// o: { color, mood: 'ok' | 'stress' | 'happy' | 'focus', seed, look: -1..1, carry: 盒子颜色, glow: 天线发光 0..1, plug: true }
function bot(g, x, y, s, t, o = {}) {
  const seed = o.seed ?? 1, col = o.color ?? C.clay, dk = o.dark ?? C.clayDk;
  const bob = Math.sin(t * (5 + rand(seed, 3) * 3) + seed * 7) * 2.5 * s * (o.still ? 0 : 1);
  g.save(); g.translate(x, y + bob); g.scale(s, s);
  if (o.squash) g.scale(1 + o.squash * 0.15, 1 - o.squash * 0.15);
  // 影子
  g.fillStyle = 'rgba(0,0,10,0.35)'; g.beginPath(); g.ellipse(0, 46 - bob / s, 34, 7, 0, 0, TAU); g.fill();
  // 腿
  g.fillStyle = '#1a1f3a'; rr(g, -24, 30, 14, 14, 5); g.fill(); rr(g, 10, 30, 14, 14, 5); g.fill();
  // 天线
  line(g, 0, -40, 0, -56, dk, 4);
  const ag = o.glow ?? 0.3;
  glow(g, 0, -60, 16 + 14 * ag, o.glowRGB ?? C.mintRGB, 0.35 + 0.6 * ag);
  g.fillStyle = ag > 0.5 ? rgba(o.glowRGB ?? C.mintRGB, 1) : '#ffe2c9'; g.beginPath(); g.arc(0, -60, 6, 0, TAU); g.fill();
  // 身体
  rr(g, -38, -42, 76, 76, 20); g.fillStyle = col; g.fill();
  g.save(); rr(g, -38, -42, 76, 76, 20); g.clip(); g.fillStyle = dk; g.fillRect(-38, 18, 76, 20); g.restore();
  // 面罩
  rr(g, -28, -30, 56, 34, 12); g.fillStyle = '#141a33'; g.fill();
  const lk = (o.look ?? 0) * 6;
  const mood = o.mood ?? 'ok';
  g.strokeStyle = g.fillStyle = mood === 'stress' ? '#ff9aa6' : C.mint; g.lineWidth = 3.5; g.lineCap = 'round';
  if (mood === 'happy') {
    g.beginPath(); g.arc(-11 + lk, -10, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(11 + lk, -10, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  } else if (mood === 'stress') {
    g.beginPath(); g.moveTo(-16 + lk, -18); g.lineTo(-8 + lk, -13); g.lineTo(-16 + lk, -8); g.stroke();
    g.beginPath(); g.moveTo(16 + lk, -18); g.lineTo(8 + lk, -13); g.lineTo(16 + lk, -8); g.stroke();
    // 汗
    g.fillStyle = '#9fd8ff'; g.beginPath(); g.moveTo(34, -40); g.quadraticCurveTo(42, -28, 34, -24); g.quadraticCurveTo(26, -28, 34, -40); g.fill();
  } else {
    const blink = (Math.sin(t * 1.3 + seed * 9) > 0.985) ? 0.15 : 1;
    const eh = (mood === 'focus' ? 6 : 12) * blink;
    rr(g, -15 + lk, -13 - eh / 2, 8, eh, 3); g.fill(); rr(g, 7 + lk, -13 - eh / 2, 8, eh, 3); g.fill();
  }
  // 抱着的盒子
  if (o.carry) box(g, 0, 18, 0.62, o.carry);
  g.restore();
}
// 代码改动 / 提交：一个小包裹
function box(g, x, y, s, color = C.blue, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.rot) g.rotate(o.rot);
  rr(g, -26, -22, 52, 44, 8); g.fillStyle = color; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(-5, -22, 10, 44);
  g.fillStyle = 'rgba(0,0,20,0.18)'; g.fillRect(-26, 10, 52, 12);
  if (o.label) txt(g, o.label, 0, 0, 16, '#0b1124', { family: F.mono, weight: '700' });
  g.restore();
}
// 人：圆头、身体、可选笔记本电脑
function person(g, x, y, s, t, o = {}) {
  const seed = o.seed ?? 1;
  const bob = Math.sin(t * 2 + seed) * 1.5;
  g.save(); g.translate(x, y + bob); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,10,0.35)'; g.beginPath(); g.ellipse(0, 70, 44, 8, 0, 0, TAU); g.fill();
  rr(g, -38, 2, 76, 70, 30); g.fillStyle = o.shirt ?? C.violet; g.fill();
  g.fillStyle = o.skin ?? C.skin; g.beginPath(); g.arc(0, -30, 30, 0, TAU); g.fill();
  g.fillStyle = o.hair ?? C.hair; g.beginPath(); g.arc(0, -36, 31, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  if (o.hairLong) { g.fillRect(-31, -38, 10, 34); g.fillRect(21, -38, 10, 34); }
  g.fillStyle = '#2a2236'; g.beginPath(); g.arc(-10 + (o.look ?? 0) * 4, -26, 3.5, 0, TAU); g.arc(10 + (o.look ?? 0) * 4, -26, 3.5, 0, TAU); g.fill();
  if (o.mouth === 'open') { g.fillStyle = '#5a2030'; g.beginPath(); g.ellipse(0, -12, 7, 8, 0, 0, TAU); g.fill(); }
  else { g.strokeStyle = '#2a2236'; g.lineWidth = 3; g.beginPath(); g.arc(0, -16, 7, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  if (o.laptop) {
    g.fillStyle = '#c9d1e8'; rr(g, -46, 30, 92, 8, 3); g.fill();
    g.fillStyle = '#9aa6c8'; g.save(); g.translate(0, 30); g.transform(1, 0, -0.25, 1, 0, 0); rr(g, -40, -54, 80, 54, 6); g.fill(); g.restore();
    glow(g, -6, 6, 30, C.blueRGB, 0.3);
  }
  g.restore();
}
// —— 图标 ——
function icon(g, kind, x, y, s, color, t = 0) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'cloud': g.beginPath(); g.arc(-22, 8, 22, Math.PI * 0.5, Math.PI * 1.5); g.arc(4, -14, 28, Math.PI, Math.PI * 1.9); g.arc(30, 8, 22, Math.PI * 1.5, Math.PI * 0.5); g.closePath(); g.stroke(); break;
    case 'wifiOff':
      for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(0, 26, i * 18, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
      g.beginPath(); g.arc(0, 26, 5, 0, TAU); g.fill(); line(g, -40, -36, 40, 40, color, 9); break;
    case 'lock': rr(g, -30, -6, 60, 46, 8); g.fill(); g.beginPath(); g.arc(0, -8, 20, Math.PI, 0); g.stroke(); break;
    case 'unlock': rr(g, -30, -6, 60, 46, 8); g.fill(); g.beginPath(); g.arc(-26, -14, 20, Math.PI, Math.PI * 2.0); g.stroke(); break;
    case 'check': g.beginPath(); g.moveTo(-34, 2); g.lineTo(-10, 26); g.lineTo(36, -24); g.stroke(); break;
    case 'cross': g.beginPath(); g.moveTo(-28, -28); g.lineTo(28, 28); g.moveTo(28, -28); g.lineTo(-28, 28); g.stroke(); break;
    case 'search': g.beginPath(); g.arc(-8, -8, 26, 0, TAU); g.stroke(); line(g, 12, 12, 36, 36, color, 11); break;
    case 'bolt': g.beginPath(); g.moveTo(8, -46); g.lineTo(-24, 6); g.lineTo(0, 6); g.lineTo(-8, 46); g.lineTo(24, -8); g.lineTo(0, -8); g.closePath(); g.fill(); break;
    case 'plug': rr(g, -22, -10, 44, 34, 8); g.fill(); line(g, -10, -10, -10, -32, color, 8); line(g, 10, -10, 10, -32, color, 8); line(g, 0, 24, 0, 46, color, 8); break;
    case 'api': setFont(g, 70, F.mono, '700'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('{ }', 0, 4); break;
    case 'scale': for (let i = 0; i < 3; i++) { rr(g, -44 + i * 32, -16, 24, 32, 5); g.fill(); } break;
    case 'feather': g.beginPath(); g.moveTo(-30, 40); g.quadraticCurveTo(-10, -30, 36, -40); g.quadraticCurveTo(20, 10, -30, 40); g.fill(); break;
    case 'sparse': for (let i = 0; i < 9; i++) { const on = [0, 4, 5, 7].includes(i); g.globalAlpha = on ? 1 : 0.25; rr(g, -40 + (i % 3) * 28, -40 + Math.floor(i / 3) * 28, 22, 22, 4); g.fill(); } break;
    case 'server': rr(g, -32, -40, 64, 80, 8); g.stroke(); for (let i = 0; i < 3; i++) line(g, -18, -20 + i * 20, 18, -20 + i * 20, color, 6); break;
    case 'clock': g.beginPath(); g.arc(0, 0, 38, 0, TAU); g.stroke(); line(g, 0, 0, 0, -24, color, 7); line(g, 0, 0, Math.cos(t * 6) * 22, Math.sin(t * 6) * 22, color, 6); break;
    case 'eye': g.beginPath(); g.moveTo(-44, 0); g.quadraticCurveTo(0, -38, 44, 0); g.quadraticCurveTo(0, 38, -44, 0); g.stroke(); g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill(); break;
    case 'chip': rr(g, -30, -30, 60, 60, 8); g.stroke(); for (let i = -1; i <= 1; i++) { line(g, i * 18, -30, i * 18, -44, color, 6); line(g, i * 18, 30, i * 18, 44, color, 6); line(g, -30, i * 18, -44, i * 18, color, 6); line(g, 30, i * 18, 44, i * 18, color, 6); } break;
  }
  g.restore();
}
