// 孔版印刷（risograph）的画面语言：米色纸，两种专色叠印——荧光粉与孔版蓝，偶尔一点黄；
// 每一版单独画在一张透明图层上，加固定的油墨颗粒，再以正片叠底印到纸上，各版略微错开。
const PAPER = [243, 237, 224], BLUE = [0, 120, 191], PINK = [255, 72, 176], YEL = [255, 212, 0];
const DZH = '"NT Display ZH", "Noto Sans CJK SC", sans-serif';
const DEN = '"NT Display EN", "Noto Sans CJK SC", sans-serif';
const BEN = '"NT Body EN", "Noto Sans CJK SC", sans-serif';

const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const at = (sh, id, frac = 0) => (sh[id] ?? 0) + frac * ((sh[id + '_end'] ?? sh[id] ?? 0) - (sh[id] ?? 0));
const isZH = () => TL.lang === 'zh';
const T2 = (zh, en) => (isZH() ? zh : en);

const _loadImages = loadImages;
loadImages = async () => {
  await Promise.all([
    _loadImages(),
    document.fonts.load(`80px ${DZH}`, '初生牛犊'),
    document.fonts.load(`80px ${DEN}`, 'NOBODY'),
    document.fonts.load(`40px ${BEN}`, 'Nobody told them'),
    document.fonts.load(`600 40px ${BEN}`, 'Nobody told them'),
    document.fonts.load(`700 40px ${SANS}`, '初生牛犊'),
  ]);
};

// —— 纸、油墨颗粒、网点 ——
let PAPER_TEX, GRAIN_PAT_SRC, PVIG, LAYERS, HT = {};
const INKS = { b: BLUE, p: PINK, y: YEL };
// 各版的错版偏移（像素），全片固定，只极慢地漂一点
const MISREG = { b: [0, 0], p: [4, -3], y: [-3, 4] };
INITS.push(() => {
  PAPER_TEX = makeCanvas(); const p = PAPER_TEX.getContext('2d');
  p.fillStyle = rgba(PAPER); p.fillRect(0, 0, W, H);
  const sw = W / 6, shh = H / 6, sm = makeCanvas(sw, shh), sx = sm.getContext('2d'), im = sx.createImageData(sw, shh);
  for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) {
    const n = fbm2(x / 30, y / 30, 5, 3) * 0.7, i = (y * sw + x) * 4;
    im.data[i] = PAPER[0] + n * 10; im.data[i + 1] = PAPER[1] + n * 10; im.data[i + 2] = PAPER[2] + n * 9; im.data[i + 3] = 255;
  }
  sx.putImageData(im, 0, 0); p.imageSmoothingQuality = 'high'; p.drawImage(sm, 0, 0, W, H);
  for (let k = 0; k < 1800; k++) {
    p.fillStyle = rand(k, 1) > 0.5 ? 'rgba(255,255,250,0.35)' : 'rgba(150,130,100,0.10)';
    p.fillRect(rand(k, 2) * W, rand(k, 3) * H, 1 + rand(k, 4) * 2, 1 + rand(k, 5) * 2);
  }
  // 油墨颗粒：在每一版上挖掉的小点（固定不闪）
  const g = makeCanvas(256, 256), gx = g.getContext('2d'), gd = gx.createImageData(256, 256);
  let s = 4242;
  for (let i = 0; i < gd.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = ((s >> 16) & 255) / 255;
    gd.data[i + 3] = r > 0.9 ? 160 + (r - 0.9) * 900 : r > 0.75 ? 40 : 0;
  }
  gx.putImageData(gd, 0, 0); GRAIN_PAT_SRC = g;
  LAYERS = { b: makeCanvas(), p: makeCanvas(), y: makeCanvas() };
  // 网点：每种墨 8 档浓度
  for (const [k, c] of Object.entries(INKS)) {
    HT[k] = [];
    for (let lv = 1; lv <= 8; lv++) {
      const t = makeCanvas(10, 10), tx = t.getContext('2d');
      tx.fillStyle = rgba(c); tx.beginPath(); tx.arc(5, 5, 0.6 + lv * 0.62, 0, TAU); tx.fill();
      HT[k].push(t);
    }
  }
  PVIG = makeCanvas(); const v = PVIG.getContext('2d');
  const gr = v.createRadialGradient(CX, CY, H * 0.4, CX, CY, H * 1.1);
  gr.addColorStop(0, 'rgb(255,255,255)'); gr.addColorStop(1, 'rgb(226,216,198)');
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
});
function paper(ctx) { ctx.drawImage(PAPER_TEX, 0, 0); }
// 网点填充：k 为 0..1 的浓度
function ht(c, ink, k) { const lv = Math.max(0, Math.min(7, Math.round(k * 7))); return c.createPattern(HT[ink][lv], 'repeat'); }

// 一次叠印：fn(L) 在 L.b / L.p / L.y 三版上作画；cam = [缩放, 中心x, 中心y]
function riso(ctx, fn, cam = null, t = 0) {
  const L = {};
  for (const [k, cv] of Object.entries(LAYERS)) {
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.clearRect(0, 0, W, H);
    if (cam) { c.translate(CX, CY); c.scale(cam[0], cam[0]); c.translate(-cam[1], -cam[2]); }
    c.fillStyle = rgba(INKS[k]); c.strokeStyle = rgba(INKS[k]); c.lineCap = 'round'; c.lineJoin = 'round';
    c.ink = k;
    L[k] = c;
  }
  fn(L);
  ctx.save();
  for (const k of ['y', 'b', 'p']) {
    const c = L[k];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = c.createPattern(GRAIN_PAT_SRC, 'repeat'); c.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    const [dx, dy] = MISREG[k];
    ctx.drawImage(LAYERS[k], dx + Math.sin(t * 0.2 + dx) * 0.8, dy + Math.cos(t * 0.17 + dy) * 0.8);
  }
  ctx.restore();
}

// —— 形状 ——
// 手剪的边：沿多边形加一点噪声
function cutPath(c, pts, seed = 0, amp = 3, closed = true) {
  c.beginPath();
  const n = pts.length;
  for (let i = 0; i < n + (closed ? 0 : -1); i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const seg = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 18));
    for (let j = 0; j < seg; j++) {
      const q = j / seg, x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q);
      const jx = noise1((i * 13 + j) * 0.7, seed) * amp, jy = noise1((i * 13 + j) * 0.7, seed + 9) * amp;
      i || j ? c.lineTo(x + jx, y + jy) : c.moveTo(x + jx, y + jy);
    }
  }
  if (!closed) c.lineTo(pts[n - 1][0], pts[n - 1][1]);
  if (closed) c.closePath();
}
function rect(c, x, y, w, h, seed = 0, amp = 2.5) { cutPath(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, amp); }
function blob(c, x, y, r, seed = 0, t = 0, wob = 0.08, n = 40) {
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, rr = r * (1 + wob * noise1(Math.cos(a) * 1.6 + 3 + t * 0.4, seed) + wob * 0.6 * noise1(Math.sin(a) * 2.1 + t * 0.3, seed + 4));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
}
// 抖动的手绘线
function scribble(c, pts, w = 6, seed = 0, p = 1) {
  if (p <= 0) return;
  c.lineWidth = w; c.beginPath();
  const tot = pts.length - 1, end = tot * clamp(p);
  for (let i = 0; i <= Math.floor(end); i++) {
    const [x, y] = pts[i];
    const jx = noise1(i * 0.9, seed) * 1.6, jy = noise1(i * 0.9, seed + 3) * 1.6;
    i ? c.lineTo(x + jx, y + jy) : c.moveTo(x + jx, y + jy);
  }
  const f = end - Math.floor(end), i0 = Math.floor(end);
  if (f > 0 && i0 < tot) c.lineTo(lerp(pts[i0][0], pts[i0 + 1][0], f), lerp(pts[i0][1], pts[i0 + 1][1], f));
  c.stroke();
}
// 一个小人：圆头、梯形身子、两条胳膊；arm = [左臂, 右臂] 向外张开的角度（弧度，0 朝下，π 朝上）
function person(c, x, y, s, o = {}) {
  const arm = o.arm ?? [0.35, 0.35], head = o.head ?? c;
  c.beginPath();
  c.moveTo(x - 0.34 * s, y); c.lineTo(x - 0.26 * s, y - 0.78 * s); c.quadraticCurveTo(x, y - 0.92 * s, x + 0.26 * s, y - 0.78 * s); c.lineTo(x + 0.34 * s, y); c.closePath();
  c.fill();
  c.lineWidth = 0.1 * s;
  for (const [sx, a] of [[-1, arm[0]], [1, arm[1]]]) {
    const ox = x + sx * 0.24 * s, oy = y - 0.7 * s;
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + sx * Math.sin(a) * 0.55 * s, oy + Math.cos(a) * 0.55 * s); c.stroke();
  }
  head.beginPath(); head.arc(x, y - 1.12 * s, 0.22 * s, 0, TAU); head.fill();
  if (o.hair) { head.beginPath(); head.arc(x, y - 1.36 * s, 0.11 * s, 0, TAU); head.fill(); }
}
function txt(c, s, x, y, size, font, o = {}) {
  c.save();
  c.font = `${o.weight ?? ''} ${size}px ${font}`;
  c.textAlign = o.align ?? 'center'; c.textBaseline = o.base ?? 'middle';
  c.letterSpacing = o.spacing ?? '0px';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.alpha !== undefined) c.globalAlpha = o.alpha;
  if (o.fill) c.fillStyle = o.fill;
  c.fillText(s, x, y);
  c.restore();
}
// 标题字：中文用庆科黄油体，英文用 Archivo Black（全大写）
function head(c, zh, en, x, y, size, o = {}) {
  isZH() ? txt(c, zh, x, y, size, DZH, o) : txt(c, en, x, y, size * (o.enScale ?? 0.82), DEN, o);
}
function label(c, zh, en, x, y, size, o = {}) {
  isZH() ? txt(c, zh, x, y, size, SANS, { weight: 700, ...o }) : txt(c, en, x, y, size * 0.95, BEN, { weight: 700, ...o });
}
const pop = (u, t0, d = 0.35) => { const k = clamp((u - t0) / d); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.12 * (1 - k) - (1 - smooth(k)) * 0.6; };

// —— 后期与文字层 ——
function post(ctx) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(PVIG, 0, 0); ctx.restore();
}
function balance(ctx, lines) {
  if (lines.length !== 2) return lines;
  const parts = isZH() ? [...lines.join('')] : lines.join(' ').split(' ');
  const join = (a) => a.join(isZH() ? '' : ' ');
  let best = lines, bw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  for (let i = 1; i < parts.length; i++) {
    const a = join(parts.slice(0, i)), b = join(parts.slice(i));
    if (isZH() && /^[，。、：；！？”」）]/.test(b)) continue;
    const pen = isZH() && !/[，。、：；！？——]$/.test(a) ? 500 : 0;
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (w + pen < bw) { bw = w + pen; best = [a, b]; }
  }
  return best;
}
function drawSubs(ctx, t) {
  for (const s of TL.subs) {
    if (t < s.a || t > s.b) continue;
    const a = win(t, s.a, s.b, 0.3, 0.35);
    ctx.save();
    const size = isZH() ? 38 : 38;
    ctx.font = isZH() ? `500 ${size}px ${SANS}` : `500 ${size}px ${BEN}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = balance(ctx, wrapLines(ctx, s.text, isZH() ? 1300 : 1460));
    const lh = size * 1.5, y0 = H - 92 - (lines.length - 1) * lh;
    ctx.shadowColor = rgba(PAPER, 0.95 * a); ctx.shadowBlur = 14;
    ctx.fillStyle = rgba([20, 50, 110], 0.95 * a);
    lines.forEach((l, i) => ctx.fillText(l, CX, y0 + i * lh));
    ctx.shadowBlur = 0; lines.forEach((l, i) => ctx.fillText(l, CX, y0 + i * lh));
    ctx.restore();
  }
}
function drawCaptions(ctx, t) {
  for (const c of TL.captions) {
    if (t < c.a || t > c.b) continue;
    const a = win(t, c.a, c.b, 0.5, 0.6), k = pop(t, c.a, 0.4);
    ctx.save();
    ctx.translate(120, 96); ctx.rotate(-0.045); ctx.scale(Math.max(0.01, k), Math.max(0.01, k));
    ctx.font = isZH() ? `900 30px ${SANS}` : `30px ${DEN}`;
    const w = ctx.measureText(c.text).width + 44;
    ctx.globalAlpha = a; ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(PINK); ctx.beginPath(); ctx.roundRect(-10, -30, w, 60, 8); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(PAPER); ctx.textBaseline = 'middle'; ctx.fillText(c.text, 12, 1);
    ctx.restore();
  }
}
function drawText(ctx, t) {
  let k = 0;
  for (const s of TL.subs) k = Math.max(k, win(t, s.a - 0.3, s.b + 0.3, 0.4, 0.5));
  if (k > 0) {
    const g = ctx.createLinearGradient(0, H - 240, 0, H);
    g.addColorStop(0, rgba(PAPER, 0)); g.addColorStop(0.5, rgba(PAPER, 0.55 * k)); g.addColorStop(1, rgba(PAPER, 0.7 * k));
    ctx.fillStyle = g; ctx.fillRect(0, H - 240, W, 240);
  }
  drawCaptions(ctx, t);
  drawSubs(ctx, t);
}
const solid = (c) => { c.fillStyle = rgba(INKS[c.ink]); c.strokeStyle = rgba(INKS[c.ink]); };
// 齿轮
function gear(c, x, y, r, teeth, rot) {
  c.beginPath();
  for (let i = 0; i <= teeth * 4; i++) {
    const a = rot + (i / (teeth * 4)) * TAU, q = i % 4, rr = q === 1 || q === 2 ? r : r * 0.82;
    i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.moveTo(x + r * 0.32, y); c.arc(x, y, r * 0.32, 0, TAU, true);
  c.fill('evenodd');
}
// 一只小牛犊
function calf(c, x, y, s, t = 0, o = {}) {
  const hop = Math.abs(Math.sin(t * 5)) * 0.12 * s * (o.hop ?? 1);
  y -= hop;
  blob(c, x, y - 0.55 * s, 0.5 * s, 3, t, 0.05); c.fill();
  for (const lx of [-0.32, -0.12, 0.14, 0.34]) { c.beginPath(); c.roundRect(x + lx * s - 0.05 * s, y - 0.3 * s, 0.1 * s, 0.38 * s + hop, 0.05 * s); c.fill(); }
  const hx = x + 0.55 * s, hy = y - 0.85 * s;
  blob(c, hx, hy, 0.27 * s, 7, t, 0.06); c.fill();
  const hc = o.horn ?? c;
  hc.lineWidth = 0.07 * s;
  hc.beginPath(); hc.moveTo(hx - 0.1 * s, hy - 0.2 * s); hc.lineTo(hx - 0.16 * s, hy - 0.38 * s); hc.moveTo(hx + 0.12 * s, hy - 0.2 * s); hc.lineTo(hx + 0.2 * s, hy - 0.36 * s); hc.stroke();
  c.beginPath(); c.moveTo(x - 0.48 * s, y - 0.7 * s); c.quadraticCurveTo(x - 0.75 * s, y - 0.75 * s, x - 0.7 * s, y - 0.45 * s); c.lineWidth = 0.05 * s; c.stroke();
}
// 一只蓝色小螃蟹（Rust 的吉祥物是一只螃蟹）
function crab(c, x, y, s, t = 0, eye = null) {
  const step = Math.sin(t * 9);
  c.lineWidth = 0.07 * s;
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const lx = x + sd * (0.3 + i * 0.13) * s, ph = (i % 2 ? 1 : -1) * step * 0.08 * s;
    c.beginPath(); c.moveTo(x + sd * 0.25 * s, y - 0.15 * s); c.lineTo(lx + sd * 0.15 * s, y - 0.05 * s + ph); c.lineTo(lx + sd * 0.22 * s, y + 0.18 * s + ph); c.stroke();
  }
  c.beginPath(); c.ellipse(x, y - 0.25 * s, 0.48 * s, 0.3 * s, 0, 0, TAU); c.fill();
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(x + sd * 0.4 * s, y - 0.35 * s); c.lineTo(x + sd * 0.62 * s, y - 0.62 * s); c.stroke();
    c.beginPath(); c.arc(x + sd * 0.66 * s, y - 0.72 * s, 0.13 * s, sd > 0 ? 2.4 : -0.7, sd > 0 ? 2.4 + 5 : -0.7 + 5); c.lineTo(x + sd * 0.66 * s, y - 0.72 * s); c.fill();
  }
  const e = eye ?? c;
  for (const sd of [-1, 1]) { e.beginPath(); e.arc(x + sd * 0.14 * s, y - 0.6 * s, 0.07 * s, 0, TAU); e.fill(); }
}

// 在指定的几版上挖空（露出纸色），让字和亮处印得干净
function knock(L, inks, draw) {
  for (const k of inks) { const c = L[k]; c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.strokeStyle = '#000'; draw(c); c.restore(); }
}
