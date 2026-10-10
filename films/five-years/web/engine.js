// 《五年》的渲染引擎：一切画面都是时间的纯函数；同一套镜头适配 16:9、9:16、3:4 三种画幅。
// 视觉语言：深色空间里的光。琥珀色是人，青色是 AI，白紫色是协调者，绿是通过，红是出错。
const Q = new URLSearchParams(location.search);
const FMT = (window.TL && TL.fmt) || Q.get('fmt') || 'h';
// 封面可以用 ?size=宽x高 指定任意尺寸
const [W, H] = Q.get('size') ? Q.get('size').split('x').map(Number) : { h: [1920, 1080], v: [1080, 1920], p: [1080, 1440] }[FMT];
const CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const PORTRAIT = H > W;
const ZH = TL.lang === 'zh';
// 舞台：主体画面所在的区域（竖屏要给顶部标题和底部字幕、平台按钮留位置）
const ST = {
  h: { x: 80, y: 110, w: 1760, h: 790 },
  v: { x: 40, y: 545, w: 1000, h: 735 },
  p: { x: 40, y: 320, w: 1000, h: 760 },
}[FMT] || { x: 0, y: 0, w: W, h: H };
ST.cx = ST.x + ST.w / 2; ST.cy = ST.y + ST.h / 2;

const C = {
  bg: '#05070d', ink: '#e9eef6', dim: '#7d8ba3', faint: '#2a3446',
  amber: '#ffb547', amberRGB: [255, 181, 71],
  cyan: '#47e5ff', cyanRGB: [71, 229, 255],
  violet: '#b493ff', violetRGB: [180, 147, 255],
  white: '#f4f7fb', whiteRGB: [244, 247, 251],
  green: '#3dffa2', greenRGB: [61, 255, 162],
  red: '#ff4766', redRGB: [255, 71, 102],
};
const F = {
  display: ZH ? '"FY Display", "Noto Sans CJK SC", sans-serif' : '"FY Black", "Inter", sans-serif',
  displayZH: '"FY Display", "Noto Sans CJK SC", sans-serif',
  black: '"FY Black", "Noto Sans CJK SC", sans-serif',
  num: '"FY Num", "FY Black", sans-serif',
  mono: '"FY Mono", "DejaVu Sans Mono", monospace',
  ui: '"FY Inter", "Noto Sans CJK SC", sans-serif',
  cjk: '"Noto Sans CJK SC", "FY Inter", sans-serif',
};

// —— 数学 ——
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => (b === a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
const sm = (k) => k * k * (3 - 2 * k);
const ease = (t, a, b) => sm(ramp(t, a, b));
const outExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
const outCubic = (k) => 1 - Math.pow(1 - k, 3);
const inCubic = (k) => k * k * k;
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const outBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const ex = (t, a, b) => outExpo(ramp(t, a, b));
const win = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(ease(t, a, a + fi), 1 - ease(t, b - fo, b));
function rand(i, j = 0) { const x = Math.sin(i * 127.1 + j * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; return lerp(rand(i, seed), rand(i + 1, seed), sm(f)) * 2 - 1; }
const rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(a)})`;
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

function makeCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// —— 光 ——
const spriteCache = new Map();
function glowSprite(rgb, hard) {
  const key = rgb.map((v) => Math.round(v / 8) * 8).join(',') + '|' + hard;
  let c = spriteCache.get(key);
  if (c) return c;
  c = makeCanvas(64, 64);
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  const [r, g, b] = rgb;
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(hard ? 0.3 : 0.1, `rgba(${r},${g},${b},${hard ? 0.95 : 0.6})`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  spriteCache.set(key, c);
  return c;
}
function glow(g, x, y, r, rgb, a = 1, hard = 0) {
  if (a <= 0.004 || r <= 0.3) return;
  const base = g.globalAlpha;
  g.globalAlpha = base * Math.min(1, a);
  g.drawImage(glowSprite(rgb, hard), x - r, y - r, r * 2, r * 2);
  g.globalAlpha = base;
}
// 发光的线：粗的半透明 + 细的亮芯
function glowLine(g, pts, rgb, a = 1, w = 2, close = false) {
  if (a <= 0.004 || pts.length < 2) return;
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); };
  path(); g.strokeStyle = rgba(rgb, 0.18 * a); g.lineWidth = w * 4; g.stroke();
  path(); g.strokeStyle = rgba(rgb, 0.9 * a); g.lineWidth = w; g.stroke();
  g.restore();
}

// —— 画面基础 ——
function background(g, t, opts = {}) {
  const tint = opts.tint || [14, 22, 40];
  const gr = g.createRadialGradient(opts.x ?? CX, opts.y ?? CY * 0.9, 0, opts.x ?? CX, opts.y ?? CY, Math.max(W, H) * 0.8);
  gr.addColorStop(0, rgba(tint, 1));
  gr.addColorStop(1, '#03050a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (opts.dots !== false) {
    const s = 48, ox = ((opts.dx || 0) % s + s) % s, oy = ((opts.dy || 0) % s + s) % s;
    g.fillStyle = `rgba(120,150,200,${opts.dotA ?? 0.07})`;
    for (let y = oy - s; y < H + s; y += s) for (let x = ox - s; x < W + s; x += s) g.fillRect(x, y, 2, 2);
  }
}
// 背景里巨大的描边年份
function bigYear(g, text, t, x, y, size, a = 0.16, rgb = C.cyanRGB) {
  if (a <= 0.004) return;
  g.save();
  g.font = `${size}px ${F.num}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 2;
  const gr = g.createLinearGradient(x, y - size / 2, x, y + size / 2);
  gr.addColorStop(0, rgba(rgb, a)); gr.addColorStop(1, rgba(rgb, a * 0.1));
  g.strokeStyle = gr;
  g.strokeText(text, x, y);
  g.restore();
}

// —— 文字 ——
function setFont(g, size, family = F.display, weight = '') { g.font = `${weight ? weight + ' ' : ''}${size}px ${family}`; }
function fit(g, text, size, maxW, family = F.display, weight = '') {
  setFont(g, size, family, weight);
  const w = g.measureText(text).width;
  if (w > maxW) { size *= maxW / w; setFont(g, size, family, weight); }
  return size;
}
function txt(g, text, x, y, size, color, opts = {}) {
  g.save();
  const fam = opts.family || F.display;
  size = opts.maxW ? fit(g, text, size, opts.maxW, fam, opts.weight) : (setFont(g, size, fam, opts.weight), size);
  g.textAlign = opts.align || 'center'; g.textBaseline = opts.base || 'middle';
  if (opts.spacing) g.letterSpacing = opts.spacing;
  g.globalAlpha *= opts.alpha ?? 1;
  if (opts.shadow) { g.shadowColor = opts.shadow; g.shadowBlur = opts.blur ?? 24; }
  g.fillStyle = color;
  g.fillText(text, x, y);
  g.restore();
  return size;
}
// 重击式出字：大→小回弹，带闪光；t0 出现，t1（可选）离场
function slam(g, text, x, y, size, t, t0, color = C.white, opts = {}) {
  const k = t - t0;
  if (k < 0) return 0;
  const t1 = opts.out ?? 1e9;
  const e = outBack(clamp(k / 0.32), 2.2);
  const out = ease(t, t1, t1 + 0.25);
  const a = clamp(k / 0.08) * (1 - out);
  if (a <= 0.004) return 0;
  const sc = lerp(opts.from ?? 1.9, 1, e) * (1 - 0.15 * out) * (opts.scale ?? 1);
  g.save();
  g.translate(x, y); g.scale(sc, sc);
  if (opts.rot) g.rotate(opts.rot);
  const fl = 1 - clamp(k / 0.25);
  txt(g, text, 0, 0, size, color, { ...opts, alpha: a, shadow: rgba(opts.glow || C.whiteRGB, 0.5 + fl * 0.5), blur: 30 + 40 * fl });
  g.restore();
  return a;
}
// 逐字打出
function typeText(g, text, x, y, size, color, k, opts = {}) {
  const chars = [...text];
  const n = Math.floor(chars.length * clamp(k) + 0.0001);
  const s = chars.slice(0, n).join('');
  g.save();
  setFont(g, size, opts.family || F.mono, opts.weight);
  g.textAlign = opts.align || 'left'; g.textBaseline = 'middle';
  g.fillStyle = color; g.globalAlpha *= opts.alpha ?? 1;
  g.fillText(s, x, y);
  const w = g.measureText(s).width;
  g.restore();
  return w;
}

// —— 玻璃面板 ——
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function panel(g, x, y, w, h, opts = {}) {
  const a = opts.alpha ?? 1, rgb = opts.rgb || C.cyanRGB, r = opts.r ?? 14;
  if (a <= 0.004) return;
  g.save();
  g.globalAlpha *= a;
  rr(g, x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x, y + h);
  gr.addColorStop(0, opts.fillTop || 'rgba(22,32,52,0.86)'); gr.addColorStop(1, opts.fillBot || 'rgba(8,12,22,0.9)');
  g.fillStyle = gr; g.fill();
  g.shadowColor = rgba(rgb, 0.45 * (opts.glow ?? 1)); g.shadowBlur = 30 * (opts.glow ?? 1);
  g.strokeStyle = rgba(rgb, 0.55 * (opts.edge ?? 1)); g.lineWidth = opts.lw ?? 1.5; g.stroke();
  g.shadowBlur = 0;
  if (opts.bar !== false) {
    g.fillStyle = rgba(rgb, 0.1); g.fillRect(x + 1, y + 1, w - 2, Math.min(34, h * 0.18));
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + 18 + i * 16, y + Math.min(17, h * 0.09), 4, 0, TAU); g.fillStyle = rgba(rgb, 0.45); g.fill(); }
    if (opts.title) { g.font = `${opts.titleSize || 15}px ${F.mono}`; g.fillStyle = rgba(rgb, 0.8); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(opts.title, x + 70, y + Math.min(17, h * 0.09)); }
  }
  g.restore();
}

// —— 代码 ——
const KW = /^(export|async|function|const|let|return|await|if|null|new|import|from|true|false|else|for|of)$/;
function tokens(line) {
  const out = [];
  const re = /(\/\/.*$)|('[^']*'|`[^`]*`|"[^"]*")|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push([m[1], '#6b7d99']);
    else if (m[2]) out.push([m[2], '#ffcf7a']);
    else if (m[3]) out.push([m[3], KW.test(m[3]) ? '#c59bff' : /^[A-Z]/.test(m[3]) ? '#ffd27a' : line[re.lastIndex] === '(' ? '#7fd8ff' : '#dce6f5']);
    else out.push([m[4] || m[5], '#93a4bf']);
  }
  return out;
}
// 一行带高亮的代码；k 为打出进度（0..1），ghost 时为半透明灰
function codeLine(g, line, x, y, size, opts = {}) {
  const k = opts.k ?? 1, a = opts.alpha ?? 1;
  if (a <= 0.004 || k <= 0) return 0;
  setFont(g, size, F.mono);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const total = [...line].length, show = Math.floor(total * clamp(k) + 0.0001);
  const base = g.globalAlpha;
  let n = 0, cx = x;
  for (const [s, col] of tokens(line)) {
    if (n >= show) break;
    const part = [...s].slice(0, show - n).join('');
    g.fillStyle = opts.ghost ? `rgba(150,165,190,${0.5 * a})` : opts.color || col;
    g.globalAlpha = base * (opts.ghost ? 1 : a);
    g.fillText(part, cx, y);
    cx += g.measureText(part).width;
    n += [...s].length;
  }
  g.globalAlpha = base;
  return cx - x;
}
function cursorBar(g, x, y, h, t, rgb = C.amberRGB, a = 1, blink = true) {
  const on = blink ? (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0.15) : 1;
  g.fillStyle = rgba(rgb, a * on);
  g.fillRect(x, y - h / 2, Math.max(3, h * 0.12), h);
  glow(g, x + 2, y, h * 1.2, rgb, 0.35 * a * on);
}

// —— 3D ——
// 相机在 (0,0,-dist) 看向原点，先绕 y 再绕 x 旋转
function proj(p, cam) {
  let [x, y, z] = p;
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  [x, z] = [x * cy - z * sy, x * sy + z * cy];
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  z += cam.dist;
  if (z < 1) return null;
  const s = cam.fov / z;
  return [cam.cx + x * s, cam.cy + y * s, s, z];
}
// 等轴测：网格坐标 → 屏幕
function iso(x, y, z, o) {
  return [o.x + (x - y) * o.s * 0.866, o.y + (x + y) * o.s * 0.5 - z * o.s];
}

// —— 粒子爆发（确定性） ——
function burst(g, x, y, t, t0, rgb, n = 40, R = 260, seed = 1) {
  const k = t - t0;
  if (k < 0 || k > 1.4) return;
  for (let i = 0; i < n; i++) {
    const a = rand(i, seed) * TAU, sp = 0.35 + rand(i, seed + 1) * 0.65;
    const d = R * sp * outExpo(clamp(k / 1.1));
    glow(g, x + Math.cos(a) * d, y + Math.sin(a) * d, 10 + 14 * rand(i, seed + 2), rgb, (1 - k / 1.4) * 0.9, 1);
  }
}
function ring(g, x, y, t, t0, rgb, R = 400, w = 3, dur = 0.8) {
  const k = (t - t0) / dur;
  if (k < 0 || k > 1) return;
  g.save();
  g.beginPath(); g.arc(x, y, R * outCubic(k), 0, TAU);
  g.strokeStyle = rgba(rgb, (1 - k) * 0.8); g.lineWidth = w * (1 - k) + 0.5; g.shadowColor = rgba(rgb, 1); g.shadowBlur = 20; g.stroke();
  g.restore();
}

// 镜头冲击：在 t0 时刻一下“顶”出去再回来
function punch(t, t0, amt = 0.06, len = 0.45) {
  const k = (t - t0) / len;
  if (k < 0 || k > 1) return 1;
  return 1 + amt * Math.sin(Math.PI * Math.pow(k, 0.5)) * (1 - k);
}
function shakeXY(t, t0, amt = 14, len = 0.35, seed = 3) {
  const k = (t - t0) / len;
  if (k < 0 || k > 1) return [0, 0];
  const f = (1 - k) * (1 - k) * amt;
  return [noise1(t * 60, seed) * f, noise1(t * 60, seed + 7) * f];
}

// 镜头注册：SHOT[kind] = (g, u, dur, cue)。cue(名字, 缺省时刻) → 镜头内秒数
const SHOT = {};
const INITS = [];
