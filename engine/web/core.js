// 渲染核心：一切画面都是时间 t 的纯函数，可任意跳帧、并行渲染。
const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
const TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (k) => k * k * (3 - 2 * k);
const ease = (t, a, b) => smooth(ramp(t, a, b));
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
// 在 [a,b] 内可见，fi/fo 为淡入淡出时长
const win = (t, a, b, fi = 1, fo = 1) => Math.min(ease(t, a, a + fi), 1 - ease(t, b - fo, b));

function rand(i, j = 0) {
  const x = Math.sin(i * 127.1 + j * 311.7 + 74.7) * 43758.5453;
  return x - Math.floor(x);
}
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return lerp(rand(i, seed), rand(i + 1, seed), smooth(f)) * 2 - 1;
}
function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
  const a = rand(ix + iy * 57, seed), b = rand(ix + 1 + iy * 57, seed);
  const c = rand(ix + (iy + 1) * 57, seed), d = rand(ix + 1 + (iy + 1) * 57, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy) * 2 - 1;
}
function fbm1(x, seed = 0, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let o = 0; o < oct; o++) { v += noise1(x * f, seed + o * 13) * amp; f *= 2.03; amp *= 0.5; }
  return v;
}
function fbm2(x, y, seed = 0, oct = 5) {
  let v = 0, amp = 0.5, f = 1;
  for (let o = 0; o < oct; o++) { v += noise2(x * f, y * f, seed + o * 17) * amp; f *= 2.01; amp *= 0.5; }
  return v;
}

function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 柔光点精灵：按颜色缓存
const spriteCache = new Map();
function glowSprite(r, g, b, hard = 0) {
  const key = `${r | 0},${g | 0},${b | 0},${hard}`;
  let c = spriteCache.get(key);
  if (c) return c;
  c = makeCanvas(64, 64);
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(hard ? 0.25 : 0.12, `rgba(${r},${g},${b},${hard ? 0.9 : 0.55})`);
  gr.addColorStop(0.45, `rgba(${r},${g},${b},0.14)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  spriteCache.set(key, c);
  return c;
}
function glow(ctx, x, y, size, rgb, alpha = 1, hard = 0) {
  if (alpha <= 0.002 || size <= 0) return;
  const q = (v) => Math.round(v / 8) * 8;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(q(rgb[0]), q(rgb[1]), q(rgb[2]), hard), x - size, y - size, size * 2, size * 2);
  ctx.globalAlpha = 1;
}

// 光的通用调色：火 → 星 → 显微镜 → 电光 → 屏幕
const FIRE_RAMP = [[255, 248, 220], [255, 214, 140], [255, 150, 60], [214, 78, 26], [110, 30, 12], [40, 10, 6]];
function rampColor(ramp, k) {
  k = clamp(k) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(k)), f = k - i;
  return [0, 1, 2].map((c) => lerp(ramp[i][c], ramp[i + 1][c], f));
}

// Catmull-Rom 平滑闭合/开放路径
function splinePath(ctx, pts, closed = true, move = true) {
  const n = pts.length;
  const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  if (move) ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}

// 折线按进度描出
function polyProgress(ctx, pts, p) {
  if (p <= 0 || pts.length < 2) return;
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); total += d;
  }
  let left = total * clamp(p);
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (left >= seg[i - 1]) { ctx.lineTo(pts[i][0], pts[i][1]); left -= seg[i - 1]; continue; }
    const k = left / seg[i - 1];
    ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k));
    break;
  }
}

const SERIF = '"Noto Serif CJK SC", "Noto Serif CJK JP", serif';
const SANS = '"Noto Sans CJK SC", sans-serif';
const MONO = '"DejaVu Sans Mono", "Noto Sans Mono CJK SC", monospace';
const LATIN = '"Nimbus Roman", "DejaVu Serif", serif';
const TYPEWRITER = '"Nimbus Mono PS", "DejaVu Sans Mono", monospace';

// —— 胶片颗粒与暗角 ——
let grainTiles = null, vignette = null;
function initPost() {
  grainTiles = [];
  for (let k = 0; k < 6; k++) {
    const c = makeCanvas(512, 512), x = c.getContext('2d');
    const img = x.createImageData(512, 512);
    let s = 1234 + k * 999;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const v = (s >> 16) & 255;
      const g = Math.pow(v / 255, 2.2) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    grainTiles.push(c);
  }
  vignette = makeCanvas();
  const v = vignette.getContext('2d');
  const g = v.createRadialGradient(CX, CY, H * 0.35, CX, CY, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0.82)');
  v.fillStyle = g;
  v.fillRect(0, 0, W, H);
}
function post(ctx, t, frame) {
  ctx.drawImage(vignette, 0, 0);
  const tile = grainTiles[frame % grainTiles.length];
  const ox = Math.floor(rand(frame, 3) * 512), oy = Math.floor(rand(frame, 4) * 512);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.034;
  ctx.translate(-ox, -oy);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(ox, oy, W, H);
  ctx.restore();
}

// 镜头注册：SHOT[kind] = (ctx, u, dur, sh, t)，u 为镜头内时间
const SHOT = {};
const INITS = [];

// 镜头内部叠化用的临时画布
let _tmp = null;
function makeTemp() { return _tmp || (_tmp = makeCanvas()); }
