// 《就这？》的渲染引擎：一切画面都是时间的纯函数；同一套镜头适配 16:9 与 9:16。
// 视觉语言：夜晚城市的绘本。暖黄的窗是人，冷白的屏幕光是 AI；天色从夜走到黎明，就是全片的情绪。
const Q = new URLSearchParams(location.search);
const FMT = (window.TL && TL.fmt) || Q.get('fmt') || 'h';
const [W, H] = Q.get('size') ? Q.get('size').split('x').map(Number) : { h: [1920, 1080], v: [1080, 1920] }[FMT] || [1920, 1080];
const CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const PORTRAIT = H > W;
const U = Math.min(W, H) / 1080; // 以短边 1080 为 1
// 舞台：主体画面所在的区域。竖屏要给顶部标题、底部字幕和平台按钮留位置（视频号 6:7 安全区是 y 330–1590）
const ST = PORTRAIT ? { x: 40, y: 470, w: W - 80, h: 790 } : { x: 0, y: 0, w: W, h: H - 150 };
ST.cx = ST.x + ST.w / 2; ST.cy = ST.y + ST.h / 2;

const C = {
  ink: '#f6f1e7', dim: '#9aa0bf',
  warm: '#ffc66e', warmRGB: [255, 198, 110], // 窗里的灯：人
  screen: '#d7f0ff', screenRGB: [215, 240, 255], // 屏幕的光：AI
  ai: '#9fe8ff', aiRGB: [159, 232, 255],
  gold: '#ffd889', goldRGB: [255, 216, 137],
  rose: '#ff9a8b', roseRGB: [255, 154, 139],
  night: '#0a0d24', silhouette: '#0d0f24', wall: '#1b1d3d',
};
const F = {
  hand: '"TI Hand", "LXGW WenKai", "Noto Serif CJK SC", serif',
  serif: '"TI Serif", "Noto Serif CJK SC", serif',
  lora: '"TI Lora", Georgia, serif',
  loraI: '"TI Lora Italic", Georgia, serif',
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
const io = (t, a, b) => inOut(ramp(t, a, b));
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(ease(t, a, a + fi), 1 - ease(t, b - fo, b));
function rand(i, j = 0) { const x = Math.sin(i * 127.1 + j * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; return lerp(rand(i, seed), rand(i + 1, seed), sm(f)) * 2 - 1; }
function fbm(x, seed = 0, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise1(x * f, seed + i * 17); a *= 0.5; f *= 2.03; } return s; }
const rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(a)})`;
const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function makeCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

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
  gr.addColorStop(hard ? 0.3 : 0.12, `rgba(${r},${g},${b},${hard ? 0.95 : 0.55})`);
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

// —— 天空 ——
const SKIES = {
  night: ['#05071a', '#0d1238', '#1d1f52', '#3a2f6b'],
  dusk: ['#0e1546', '#3b3482', '#b4628a', '#f2a679'],
  storm: ['#06070f', '#121628', '#1e2238', '#2a2c44'],
  dawn: ['#1a2a63', '#5a64a8', '#e59a86', '#ffd7a1'],
  deep: ['#02030b', '#060a22', '#0b1236', '#131a48'],
};
function lerpSky(a, b, k) { return SKIES[a].map((c, i) => { const p = mixRGB(hex(c), hex(SKIES[b][i]), k); return `rgb(${p[0] | 0},${p[1] | 0},${p[2] | 0})`; }); }
// stops：4 个颜色，从天顶到地平线；horizon：地平线的 y
function sky(g, stops, horizon = H * 0.7, opts = {}) {
  const gr = g.createLinearGradient(0, opts.top ?? 0, 0, horizon);
  gr.addColorStop(0, stops[0]); gr.addColorStop(0.45, stops[1]); gr.addColorStop(0.8, stops[2]); gr.addColorStop(1, stops[3]);
  g.fillStyle = gr; g.fillRect(-W, -H, W * 3, H * 3);
  g.fillStyle = stops[3]; g.fillRect(-W, horizon, W * 3, H * 3);
}
function stars(g, t, a = 1, opts = {}) {
  if (a <= 0.004) return;
  const n = opts.n ?? 220, h = opts.h ?? H * 0.6, seed = opts.seed ?? 3;
  for (let i = 0; i < n; i++) {
    const x = rand(i, seed) * W, y = rand(i, seed + 1) * h * (0.3 + 0.7 * rand(i, seed + 9));
    const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + rand(i, seed + 2) * 2) + i);
    const s = rand(i, seed + 3);
    const r = (s > 0.96 ? 2.4 : s > 0.8 ? 1.6 : 1) * U;
    g.fillStyle = `rgba(255,250,235,${a * tw * (0.35 + 0.65 * s)})`;
    g.fillRect(x - r / 2, y - r / 2, r, r);
    if (s > 0.97) glow(g, x, y, 10 * U, [255, 240, 220], a * tw * 0.5);
  }
}
function moon(g, x, y, r, a = 1) {
  glow(g, x, y, r * 7, [255, 236, 200], 0.35 * a);
  glow(g, x, y, r * 2.6, [255, 240, 215], 0.6 * a);
  g.save(); g.globalAlpha *= a;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#fff4dc'; g.fill();
  g.globalAlpha *= 0.12; g.fillStyle = '#b9a98a';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (rand(i, 41) - 0.5) * r * 1.2, y + (rand(i, 42) - 0.5) * r * 1.2, r * (0.12 + rand(i, 43) * 0.18), 0, TAU); g.fill(); }
  g.restore();
}
function cloud(g, x, y, w, h, color, a = 1, seed = 1) {
  if (a <= 0.004) return;
  g.save(); g.globalAlpha *= a; g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 7; i++) {
    const cx = x + (i / 6 - 0.5) * w, cy = y - Math.sin((i / 6) * Math.PI) * h * (0.4 + rand(i, seed) * 0.4);
    g.moveTo(cx + h * 0.6, cy); g.arc(cx, cy, h * (0.45 + rand(i, seed + 1) * 0.35), 0, TAU);
  }
  g.fill(); g.restore();
}

// —— 楼与窗 ——
// 一栋楼：返回每一扇窗的位置，镜头可以单独点亮或推近某一扇
function building(g, x, base, w, h, o = {}) {
  const seed = o.seed ?? 1;
  g.fillStyle = o.color || '#12142e';
  g.fillRect(x, base - h, w, h);
  if (o.roof) { g.fillRect(x + w * 0.2, base - h - o.roof, w * 0.12, o.roof); }
  const cols = o.cols ?? Math.max(2, Math.floor(w / (34 * (o.scale ?? 1)))), rows = o.rows ?? Math.max(2, Math.floor(h / (46 * (o.scale ?? 1))));
  const mx = w * 0.12, my = h * 0.05, cw = (w - mx * 2) / cols, ch = (h - my * 2) / rows;
  const wins = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const id = r * cols + c, wx = x + mx + c * cw + cw * 0.18, wy = base - h + my + r * ch + ch * 0.2, ww = cw * 0.64, wh = ch * 0.56;
    const p = rand(id, seed);
    const lit = o.lit ? o.lit(id, p) : p < (o.density ?? 0.42);
    wins.push({ x: wx, y: wy, w: ww, h: wh, lit, id });
    if (!lit) { g.fillStyle = 'rgba(40,44,80,0.55)'; g.fillRect(wx, wy, ww, wh); continue; }
    const kind = typeof lit === 'number' ? lit : 1;
    // 1 暖灯，2 屏幕冷光
    const col = kind === 2 ? mixRGB(C.screenRGB, [140, 190, 255], rand(id, seed + 2) * 0.5) : mixRGB(C.warmRGB, [255, 150, 90], rand(id, seed + 3) * 0.6);
    const fl = o.t != null && kind === 2 ? 0.75 + 0.25 * Math.sin(o.t * 9 + id) : 1;
    const A = (0.65 + 0.35 * rand(id, seed + 4)) * fl * (o.winA ?? 1);
    if (ww * (o.zoom ?? 1) > 30) {
      // 推近时：窗里有渐变、窗帘和窗棂
      const gr = g.createLinearGradient(wx, wy, wx, wy + wh);
      gr.addColorStop(0, rgba(mixRGB(col, [255, 255, 255], 0.25), A)); gr.addColorStop(1, rgba(mixRGB(col, [120, 60, 60], 0.35), A));
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      const cur = rand(id, seed + 6);
      g.fillStyle = 'rgba(40,20,40,0.45)';
      if (cur > 0.6) g.fillRect(wx, wy, ww * 0.28, wh); else if (cur > 0.35) g.fillRect(wx, wy, ww, wh * 0.3);
      g.strokeStyle = 'rgba(10,10,30,0.8)'; g.lineWidth = Math.max(1, ww * 0.05);
      g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
    } else {
      g.fillStyle = rgba(col, A);
      g.fillRect(wx, wy, ww, wh);
    }
    if (o.glow !== false) glow(g, wx + ww / 2, wy + wh / 2, Math.max(ww, wh) * 1.3, col, 0.18 * fl * (o.winA ?? 1));
  }
  return wins;
}
// 一排天际线：seed 决定楼的高低
function skyline(g, base, o = {}) {
  const seed = o.seed ?? 7, x0 = o.x0 ?? -40, x1 = o.x1 ?? W + 40;
  let x = x0, i = 0;
  const all = [];
  while (x < x1) {
    const w = (o.minW ?? 70) + rand(i, seed) * (o.varW ?? 90);
    const h = (o.minH ?? 120) + Math.pow(rand(i, seed + 1), 1.6) * (o.varH ?? 300);
    all.push(...building(g, x, base, w, h, { ...o, seed: seed * 31 + i, roof: rand(i, seed + 5) > 0.7 ? 14 * (o.scale ?? 1) : 0 }));
    x += w + (o.gap ?? 6);
    i++;
  }
  return all;
}

// —— 人：纸剪影 ——
// 用粗圆头线条搭出的剪影，单位是“头的半径”。pose：sofa / laugh / desk / lean / stand / look
function person(g, x, y, s, pose = 'stand', o = {}) {
  if (o.rim) {
    // 轮廓光：先画一层亮色、略微错开的剪影
    const [rgb, dx, dy, a] = o.rim;
    g.save(); g.globalAlpha *= a ?? 0.9;
    person(g, x + dx * s, y + dy * s, s, pose, { ...o, rim: null, color: rgba(rgb, 1), phone: false });
    g.restore();
  }
  g.save();
  g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = g.fillStyle = o.color || C.silhouette;
  const seg = (pts, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
  const head = (hx, hy, r = 1.05, tilt = 0) => {
    g.beginPath(); g.ellipse(hx, hy, r * 0.95, r, tilt, 0, TAU); g.fill();
    // 头发：后脑多一点
    g.beginPath(); g.ellipse(hx - 0.25, hy - 0.15, r * 1.02, r * 1.0, tilt, Math.PI * 0.55, Math.PI * 2.05); g.fill();
    if (o.hair === 'bun') { g.beginPath(); g.arc(hx - 0.9, hy - 0.6, 0.48, 0, TAU); g.fill(); }
    if (o.hair === 'long') { g.beginPath(); g.ellipse(hx - 0.7, hy + 0.9, 0.55, 1.4, 0.25, 0, TAU); g.fill(); }
  };
  const k = o.k ?? 0; // 动作的进度
  if (pose === 'sofa' || pose === 'laugh') {
    const lb = pose === 'laugh' ? k : 0;
    seg([[0, 0], [3.6, -0.2]], 2.3); seg([[3.6, -0.2], [3.9, 3.3]], 1.5); seg([[3.9, 3.3], [4.7, 3.4]], 0.9);
    const sh = [lerp(0.3, -0.2, lb), -4.6];
    seg([[0, 0], sh], 3.1);
    const hd = [lerp(0.75, 0.25, lb), lerp(-6.15, -6.25, lb)];
    seg([sh, [hd[0] - 0.1, hd[1] + 0.8]], 1.2);
    head(hd[0], hd[1], 1.08, lerp(0, -0.35, lb));
    // 拿手机的手：笑的时候放到膝上
    const hand = [lerp(2.2, 2.9, lb), lerp(-4.7, -1.0, lb)], elbow = [lerp(1.3, 1.5, lb), lerp(-2.3, -1.9, lb)];
    seg([sh, elbow], 1.25); seg([elbow, hand], 1.0);
    if (o.phone !== false) {
      g.save(); g.translate(hand[0] + 0.2, hand[1] - 0.2); g.rotate(lerp(-0.5, 0.3, lb));
      g.fillStyle = '#0a0b18'; g.fillRect(-0.35, -0.7, 0.7, 1.4);
      g.fillStyle = rgba(C.screenRGB, 0.95 * (o.screen ?? 1)); g.fillRect(-0.28, -0.62, 0.56, 1.24);
      g.restore();
    }
  } else if (pose === 'desk' || pose === 'lean') {
    const lb = pose === 'lean' ? k : 0;
    seg([[0, 0], [3.3, 0.1]], 2.3); seg([[3.3, 0.1], [3.4, 3.6]], 1.5); seg([[3.4, 3.6], [4.2, 3.7]], 0.9);
    const sh = [lerp(1.0, -0.7, lb), lerp(-4.4, -4.5, lb)];
    seg([[0, 0], sh], 3.1);
    const hd = [lerp(1.85, -0.25, lb), lerp(-5.95, -6.25, lb)];
    seg([sh, [hd[0] - 0.15, hd[1] + 0.8]], 1.2);
    head(hd[0], hd[1], 1.05, lerp(0.15, -0.25, lb));
    if (lb < 0.5) { seg([sh, [2.0, -2.2], [4.3, -1.7]], 1.1); }
    else { seg([sh, [0.9, -7.4], [-0.8, -6.9]], 1.1); }
  } else {
    // stand / look：站着；look 时抬头
    const up = pose === 'look' ? 1 : 0;
    seg([[0, 0], [-0.5, 4.6], [-0.6, 8.6]], 1.6); seg([[0, 0], [0.5, 4.6], [0.7, 8.6]], 1.6);
    seg([[0, 0], [0, -4.4]], 3.0);
    seg([[0, -4.2], [-1.4, -1.6], [-1.2, 0.8]], 1.1); seg([[0, -4.2], [1.4, -1.6], [1.2, 0.8]], 1.1);
    seg([[0, -4.4], [0.1, -5.4]], 1.2);
    head(0.15 + up * 0.2, -6.3 - up * 0.1, 1.05, -up * 0.6);
  }
  g.restore();
}

// —— 文字 ——
function setFont(g, size, family = F.hand, weight = '') { g.font = `${weight ? weight + ' ' : ''}${size}px ${family}`; }
function fit(g, text, size, maxW, family = F.hand, weight = '') {
  setFont(g, size, family, weight);
  const w = g.measureText(text).width;
  if (w > maxW) { size *= maxW / w; setFont(g, size, family, weight); }
  return size;
}
function txt(g, text, x, y, size, color, opts = {}) {
  g.save();
  const fam = opts.family || F.hand;
  size = opts.maxW ? fit(g, text, size, opts.maxW, fam, opts.weight) : (setFont(g, size, fam, opts.weight), size);
  g.textAlign = opts.align || 'center'; g.textBaseline = opts.base || 'middle';
  if (opts.spacing) g.letterSpacing = opts.spacing;
  g.globalAlpha *= opts.alpha ?? 1;
  if (opts.shadow) { g.shadowColor = opts.shadow; g.shadowBlur = opts.blur ?? 24; }
  if (opts.stroke) { g.lineJoin = 'round'; g.lineWidth = opts.strokeW ?? size * 0.12; g.strokeStyle = opts.stroke; g.strokeText(text, x, y); }
  g.fillStyle = color;
  g.fillText(text, x, y);
  g.restore();
  return size;
}
// 手写体逐字写出：k 0..1
function writeOn(g, text, x, y, size, color, k, opts = {}) {
  const chars = [...text], n = chars.length;
  g.save();
  setFont(g, size, opts.family || F.hand, opts.weight);
  g.textBaseline = 'middle';
  const widths = chars.map((c) => g.measureText(c).width), total = widths.reduce((a, b) => a + b, 0);
  let cx = opts.align === 'left' ? x : opts.align === 'right' ? x - total : x - total / 2;
  if (opts.shadow) { g.shadowColor = opts.shadow; g.shadowBlur = opts.blur ?? 20; }
  for (let i = 0; i < n; i++) {
    const a = clamp(k * n - i);
    if (a > 0) {
      g.globalAlpha = (opts.alpha ?? 1) * a;
      g.save(); g.translate(cx + widths[i] / 2, y + (1 - a) * size * 0.15);
      const sc = 1 + (1 - a) * 0.25; g.scale(sc, sc);
      g.fillStyle = color; g.textAlign = 'center'; g.fillText(chars[i], 0, 0); g.restore();
    }
    cx += widths[i];
  }
  g.restore();
  return total;
}
// 重击式出字：大→小回弹；t0 出现，opts.out 离场
function slam(g, text, x, y, size, t, t0, color = C.ink, opts = {}) {
  const k = t - t0;
  if (k < 0) return 0;
  const t1 = opts.out ?? 1e9;
  const e = outBack(clamp(k / 0.35), 2.0);
  const out = ease(t, t1, t1 + 0.35);
  const a = clamp(k / 0.1) * (1 - out);
  if (a <= 0.004) return 0;
  const sc = lerp(opts.from ?? 1.7, 1, e) * (opts.scale ?? 1);
  g.save();
  g.translate(x, y); g.scale(sc, sc);
  if (opts.rot) g.rotate(opts.rot);
  txt(g, text, 0, 0, size, color, { ...opts, alpha: a * (opts.alpha ?? 1), shadow: opts.shadow ?? 'rgba(0,0,0,0.6)', blur: opts.blur ?? 30 });
  g.restore();
  return a;
}

// —— 形状 ——
function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function wrapText(g, text, maxW) {
  const out = []; let cur = '';
  const zh = /[一-鿿]/.test(text);
  const units = zh ? [...text] : text.split(/(\s+)/);
  for (const u of units) {
    if (cur && g.measureText(cur + u).width > maxW && !/^[，。？！、：；」）]$/.test(u)) { out.push(cur.trim()); cur = u.trimStart(); }
    else cur += u;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// 聊天气泡：side 'r' 是人（暖色），'l' 是 AI（冷白）。k 是弹出进度
function bubble(g, text, x, y, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0) return null;
  const size = o.size ?? 40 * U, maxW = o.maxW ?? 640 * U;
  g.save();
  setFont(g, size, o.family || F.hand);
  const lines = wrapText(g, text, maxW);
  const tw = Math.max(...lines.map((l) => g.measureText(l).width));
  const pad = size * 0.62, lh = size * 1.32;
  const bw = tw + pad * 2, bh = lines.length * lh + pad * 1.2;
  const side = o.side || 'r';
  const bx = side === 'r' ? x - bw : x, by = y - bh;
  const e = outBack(clamp(k), 1.8);
  const ox = side === 'r' ? x : x, oy = y;
  g.translate(ox, oy); g.scale(e, e); g.translate(-ox, -oy);
  g.globalAlpha *= clamp(k * 3) * (o.alpha ?? 1);
  const fill = o.fill || (side === 'r' ? '#ffd38a' : '#eef6ff');
  g.shadowColor = side === 'r' ? 'rgba(255,190,100,0.45)' : 'rgba(170,220,255,0.5)'; g.shadowBlur = 30 * U;
  rr(g, bx, by, bw, bh, size * 0.7); g.fillStyle = fill; g.fill();
  // 尾巴
  g.beginPath();
  if (side === 'r') { g.moveTo(x - size * 1.0, y - 2); g.lineTo(x + size * 0.15, y + size * 0.45); g.lineTo(x - size * 0.4, y - 2); }
  else { g.moveTo(x + size * 1.0, y - 2); g.lineTo(x - size * 0.15, y + size * 0.45); g.lineTo(x + size * 0.4, y - 2); }
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = o.color || '#2a2140'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const n = o.type != null ? Math.floor([...lines.join('')].length * clamp(o.type)) : 1e9;
  let used = 0;
  lines.forEach((l, i) => {
    const ch = [...l], show = ch.slice(0, Math.max(0, n - used)).join('');
    used += ch.length;
    g.fillText(show, bx + pad, by + pad * 0.6 + lh * (i + 0.5));
  });
  g.restore();
  return { x: bx, y: by, w: bw, h: bh };
}

// —— 粒子（确定性）——
function sparks(g, x, y, t, t0, rgb, n = 30, R = 200, seed = 1) {
  const k = t - t0;
  if (k < 0 || k > 1.6) return;
  for (let i = 0; i < n; i++) {
    const a = rand(i, seed) * TAU, sp = 0.3 + rand(i, seed + 1) * 0.7;
    const d = R * sp * outExpo(clamp(k / 1.2));
    glow(g, x + Math.cos(a) * d, y + Math.sin(a) * d - k * k * 20, (6 + 10 * rand(i, seed + 2)) * U, rgb, (1 - k / 1.6) * 0.9, 1);
  }
}
// 飘在空气里的光尘
function dust(g, t, a = 1, rgb = [255, 220, 170], n = 50, seed = 5) {
  for (let i = 0; i < n; i++) {
    const x = ((rand(i, seed) * W + t * (8 + 14 * rand(i, seed + 1)) * U) % (W + 40)) - 20;
    const y = rand(i, seed + 2) * H + Math.sin(t * 0.6 + i) * 14 * U;
    glow(g, x, y, (3 + 5 * rand(i, seed + 3)) * U, rgb, a * (0.25 + 0.35 * Math.sin(t * 1.3 + i * 2) ** 2), 1);
  }
}

// —— 3D ——
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

// —— 镜头 ——
// 以 (x, y) 为画面中心、放大 s 倍、旋转 rot 去看世界
function camera(g, x, y, s = 1, rot = 0, cx = CX, cy = CY) {
  g.translate(cx, cy); if (rot) g.rotate(rot); g.scale(s, s); g.translate(-x, -y);
}
function shakeXY(t, t0, amt = 14, len = 0.4, seed = 3) {
  const k = (t - t0) / len;
  if (k < 0 || k > 1) return [0, 0];
  const f = (1 - k) * (1 - k) * amt;
  return [noise1(t * 50, seed) * f, noise1(t * 50, seed + 7) * f];
}

// 画面文字：英文版优先用 TL.txt.<键>En
function T(key) { return TL.lang === 'en' && TL.txt[key + 'En'] !== undefined ? TL.txt[key + 'En'] : TL.txt[key]; }

// 镜头注册：SHOT[kind] = (g, u, dur, cue, t, s)。cue('L05') → 这一句在镜头内的开始秒数；cue('L05_end') 结束
const SHOT = {};
const INITS = [];
