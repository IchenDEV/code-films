// 构成主义剪纸拼贴的画面语言：米色纸，黑、红两色的纸片，一点牛皮纸；
// 每张纸片带一道硬阴影，像是剪下来贴在纸上的。黑方块是固定的工位，红圆是随任务出现的执行者。
const PAPER = [234, 226, 208], INK = [28, 25, 23], RED = [198, 46, 32], KRAFT = [186, 162, 124], SLIP = [247, 242, 230], GREY = [146, 140, 130];
const DZH = '"HC Display ZH", "Noto Sans CJK SC", sans-serif';
const DEN = '"HC Display EN", "Noto Sans CJK SC", sans-serif';
const BEN = '"HC Body EN", "Noto Sans CJK SC", sans-serif';

const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const at = (sh, id, frac = 0) => (sh[id] ?? 0) + frac * ((sh[id + '_end'] ?? sh[id] ?? 0) - (sh[id] ?? 0));
const isZH = () => TL.lang === 'zh';
const T2 = (zh, en) => (isZH() ? zh : en);
// 弹出：略微过冲
const pop = (u, t0, d = 0.35) => { const k = clamp((u - t0) / d); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.12 * (1 - k) - (1 - smooth(k)) * 0.6; };
const back = (k) => { const s = 1.6; return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };

const _loadImages = loadImages;
loadImages = async () => {
  await Promise.all([
    _loadImages(),
    document.fonts.load(`80px ${DZH}`, '编制反对官僚主义'),
    document.fonts.load(`80px ${DEN}`, 'HEADCOUNT'),
    document.fonts.load(`40px ${BEN}`, 'Headcount'),
    document.fonts.load(`700 40px ${BEN}`, 'Headcount'),
    document.fonts.load(`700 40px ${SANS}`, '编制'),
  ]);
};

// —— 纸 ——
let PAPER_TEX, FIBER, PVIG;
INITS.push(() => {
  PAPER_TEX = makeCanvas(); const p = PAPER_TEX.getContext('2d');
  const sw = W / 6, shh = H / 6, sm = makeCanvas(sw, shh), sx = sm.getContext('2d'), im = sx.createImageData(sw, shh);
  for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) {
    const n = fbm2(x / 26, y / 26, 11, 4) * 0.8, i = (y * sw + x) * 4;
    im.data[i] = PAPER[0] + n * 9; im.data[i + 1] = PAPER[1] + n * 9; im.data[i + 2] = PAPER[2] + n * 8; im.data[i + 3] = 255;
  }
  sx.putImageData(im, 0, 0); p.imageSmoothingQuality = 'high'; p.drawImage(sm, 0, 0, W, H);
  for (let k = 0; k < 2200; k++) {
    p.fillStyle = rand(k, 1) > 0.5 ? 'rgba(255,253,245,0.4)' : 'rgba(120,100,70,0.10)';
    p.fillRect(rand(k, 2) * W, rand(k, 3) * H, 1 + rand(k, 4) * 2, 1 + rand(k, 5) * 2);
  }
  // 纸纤维：一层很淡的短线，正片叠底到所有纸片上（固定不动，压缩友好）
  FIBER = makeCanvas(); const f = FIBER.getContext('2d');
  f.fillStyle = '#fff'; f.fillRect(0, 0, W, H);
  for (let k = 0; k < 5000; k++) {
    const x = rand(k, 6) * W, y = rand(k, 7) * H, a = rand(k, 8) * TAU, l = 4 + rand(k, 9) * 14;
    f.strokeStyle = `rgba(150,130,100,${0.06 + rand(k, 10) * 0.1})`; f.lineWidth = 0.8;
    f.beginPath(); f.moveTo(x, y); f.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); f.stroke();
  }
  PVIG = makeCanvas(); const v = PVIG.getContext('2d');
  const gr = v.createRadialGradient(CX, CY, H * 0.45, CX, CY, H * 1.1);
  gr.addColorStop(0, 'rgb(255,255,255)'); gr.addColorStop(1, 'rgb(214,204,186)');
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
});
function paper(ctx) { ctx.drawImage(PAPER_TEX, 0, 0); }

// —— 剪纸 ——
// 一张纸片：build(ctx) 画出路径；带一道硬阴影，lift 越大纸片越“浮”
function cut(ctx, col, build, o = {}) {
  const lift = o.lift ?? 1;
  if (o.alpha !== undefined && o.alpha <= 0.002) return;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (lift > 0) { ctx.shadowColor = `rgba(60,40,20,${0.22 * Math.min(1, lift)})`; ctx.shadowOffsetX = 3 * lift; ctx.shadowOffsetY = 5 * lift; ctx.shadowBlur = 2 * lift; }
  ctx.fillStyle = Array.isArray(col) ? rgba(col) : col;
  ctx.beginPath(); build(ctx); ctx.fill(o.rule ?? 'nonzero');
  ctx.restore();
}
// 手剪的直边：每条边加一点抖动
function edge(c, pts, seed = 0, amp = 1.6) {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const seg = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 40));
    for (let j = 0; j < seg; j++) {
      const q = j / seg, x = lerp(a[0], b[0], q) + noise1((i * 7 + j) * 0.9, seed) * amp, y = lerp(a[1], b[1], q) + noise1((i * 7 + j) * 0.9, seed + 5) * amp;
      i || j ? c.lineTo(x, y) : c.moveTo(x, y);
    }
  }
  c.closePath();
}
const R = (x, y, w, h, seed = 0, amp = 1.6) => (c) => edge(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, amp);
const P = (pts, seed = 0, amp = 1.6) => (c) => edge(c, pts, seed, amp);
const C = (x, y, r) => (c) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); };
// 旋转后的矩形
function rotRect(x, y, w, h, a, seed = 0) {
  const cs = Math.cos(a), sn = Math.sin(a);
  return P([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([px, py]) => [x + px * cs - py * sn, y + px * sn + py * cs]), seed);
}
// 一条粗直线（构成主义的“杆”），p 为画出的比例
function bar(ctx, x0, y0, x1, y1, w, col, p = 1, o = {}) {
  if (p <= 0) return;
  const x = lerp(x0, x1, p), y = lerp(y0, y1, p), a = Math.atan2(y - y0, x - x0), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
  cut(ctx, col, P([[x0 + nx, y0 + ny], [x + nx, y + ny], [x - nx, y - ny], [x0 - nx, y0 - ny]], o.seed ?? 0, 0.8), o);
}
function arrow(ctx, x0, y0, x1, y1, w, col, p = 1, o = {}) {
  if (p <= 0) return;
  const x = lerp(x0, x1, p), y = lerp(y0, y1, p), a = Math.atan2(y1 - y0, x1 - x0), hl = w * 2.6;
  const bx = x - Math.cos(a) * hl, by = y - Math.sin(a) * hl;
  if (Math.hypot(bx - x0, by - y0) > 2 && Math.hypot(x - x0, y - y0) > hl) bar(ctx, x0, y0, bx, by, w, col, 1, o);
  const nx = -Math.sin(a), ny = Math.cos(a);
  cut(ctx, col, P([[x, y], [bx + nx * w * 1.4, by + ny * w * 1.4], [bx - nx * w * 1.4, by - ny * w * 1.4]], 3, 0.5), o);
}

// —— 文字 ——
function txt(c, s, x, y, size, font, o = {}) {
  c.save();
  c.font = `${o.weight ?? ''} ${size}px ${font}`;
  c.textAlign = o.align ?? 'center'; c.textBaseline = o.base ?? 'middle';
  c.letterSpacing = o.spacing ?? '0px';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  c.fillStyle = o.fill ? (Array.isArray(o.fill) ? rgba(o.fill) : o.fill) : rgba(INK);
  c.fillText(s, x, y);
  c.restore();
}
// 标题字：中文得意黑（斜体海报字），英文 Bebas Neue
function head(c, zh, en, x, y, size, o = {}) {
  isZH() ? txt(c, zh, x, y, size, DZH, o) : txt(c, en, x, y, size * (o.enScale ?? 1.0), DEN, { spacing: '2px', ...o });
}
function label(c, zh, en, x, y, size, o = {}) {
  isZH() ? txt(c, zh, x, y, size, SANS, { weight: 700, ...o }) : txt(c, en, x, y, size * 0.92, BEN, { weight: 700, ...o });
}
function measure(c, s, size, font, weight = '') { c.save(); c.font = `${weight} ${size}px ${font}`; const w = c.measureText(s).width; c.restore(); return w; }

// —— 道具 ——
// 一张工位：黑色方块 + 米色名牌
function desk(ctx, x, y, w, h, zh, en, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  ctx.save();
  if (o.rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); ctx.translate(-x - w / 2, -y - h / 2); }
  cut(ctx, o.col ?? INK, R(x, y, w, h, o.seed ?? 1), { alpha: a, lift: o.lift ?? 1 });
  if (zh) {
    const nh = Math.min(42, h * 0.36), size = nh * 0.62;
    cut(ctx, o.plate ?? SLIP, R(x + 10, y + h - nh - 10, w - 20, nh, (o.seed ?? 1) + 3, 1), { alpha: a, lift: 0.3 });
    label(ctx, zh, en, x + w / 2, y + h - nh / 2 - 9, size, { alpha: a, fill: INK });
  }
  ctx.restore();
}
// 一张纸条（消息、备忘、产物）
function memo(ctx, x, y, w, h, s, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  if (o.scale !== undefined) ctx.scale(o.scale, o.scale);
  cut(ctx, o.col ?? SLIP, P([[-w / 2, -h / 2], [w / 2 - 18, -h / 2], [w / 2, -h / 2 + 18], [w / 2, h / 2], [-w / 2, h / 2]], o.seed ?? 2, 1), { alpha: a, lift: o.lift ?? 1.2 });
  cut(ctx, KRAFT, P([[w / 2 - 18, -h / 2], [w / 2 - 18, -h / 2 + 18], [w / 2, -h / 2 + 18]], 1, 0.3), { alpha: a, lift: 0 });
  if (s) {
    if (o.lines) for (let i = 0; i < o.lines; i++) { ctx.globalAlpha = a * 0.5; ctx.fillStyle = rgba(GREY); ctx.fillRect(-w / 2 + 18, -h / 2 + 22 + i * 16, (w - 50) * (0.6 + rand(i, o.seed ?? 2) * 0.4), 6); ctx.globalAlpha = 1; }
    else txt(ctx, s, 0, 2, o.size ?? 26, isZH() ? SANS : BEN, { weight: 600, alpha: a, fill: o.ink ?? INK });
  }
  ctx.restore();
}
// 一个执行者：红色的圆，r 为半径；ring = 只描边
function agent(ctx, x, y, r, o = {}) {
  if (r <= 0.5) return;
  cut(ctx, o.col ?? RED, C(x, y, r), { alpha: o.alpha, lift: o.lift ?? 1 });
}
// 小人（剪影）：圆头 + 梯形身子
function figure(ctx, x, y, s, col = INK, o = {}) {
  cut(ctx, col, (c) => { c.moveTo(x - 0.36 * s, y); c.lineTo(x - 0.26 * s, y - 0.8 * s); c.quadraticCurveTo(x, y - 0.95 * s, x + 0.26 * s, y - 0.8 * s); c.lineTo(x + 0.36 * s, y); c.closePath(); C(x, y - 1.16 * s, 0.23 * s)(c); }, o);
}
// 眼睛：杏仁形 + 瞳孔；open 0..1
function eye(ctx, x, y, s, open = 1, o = {}) {
  const h = s * 0.42 * open;
  cut(ctx, o.white ?? SLIP, (c) => { c.moveTo(x - s, y); c.quadraticCurveTo(x, y - h * 2, x + s, y); c.quadraticCurveTo(x, y + h * 2, x - s, y); }, { lift: o.lift ?? 0.6, alpha: o.alpha });
  if (open > 0.3) cut(ctx, o.pupil ?? INK, C(x + (o.look ?? 0) * s * 0.3, y, s * 0.3 * Math.min(1, open * 1.3)), { lift: 0, alpha: o.alpha });
}
// 时钟
function clock(ctx, x, y, r, t, o = {}) {
  cut(ctx, o.face ?? SLIP, C(x, y, r), { lift: o.lift ?? 1, alpha: o.alpha });
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.fillStyle = rgba(INK); ctx.fillRect(x + Math.cos(a) * r * 0.82 - 3, y + Math.sin(a) * r * 0.82 - 3, 6, 6); }
  ctx.restore();
  bar(ctx, x, y, x + Math.cos(t * 0.5 - Math.PI / 2) * r * 0.5, y + Math.sin(t * 0.5 - Math.PI / 2) * r * 0.5, r * 0.1, INK, 1, { lift: 0, alpha: o.alpha });
  bar(ctx, x, y, x + Math.cos(t * 6 - Math.PI / 2) * r * 0.75, y + Math.sin(t * 6 - Math.PI / 2) * r * 0.75, r * 0.05, o.hand ?? RED, 1, { lift: 0, alpha: o.alpha });
}
// 一枚“错误”的红点（被修的那个登录异常）
function bug(ctx, x, y, r, t, o = {}) {
  const pulse = 1 + 0.08 * Math.sin(t * 5);
  cut(ctx, RED, C(x, y, r * pulse), { lift: 1, alpha: o.alpha });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    bar(ctx, x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1, x + Math.cos(a) * r * 1.55, y + Math.sin(a) * r * 1.55, r * 0.18, RED, 1, { lift: 0.4, alpha: o.alpha });
  }
}

// —— 后期与文字层 ——
function post(ctx) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(FIBER, 0, 0); ctx.drawImage(PVIG, 0, 0);
  ctx.restore();
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
    const size = 38;
    ctx.font = isZH() ? `500 ${size}px ${SANS}` : `500 ${size}px ${BEN}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = balance(ctx, wrapLines(ctx, s.text, isZH() ? 1300 : 1460));
    const lh = size * 1.5, y0 = H - 92 - (lines.length - 1) * lh;
    ctx.shadowColor = rgba(PAPER, 0.95 * a); ctx.shadowBlur = 14;
    ctx.fillStyle = rgba(INK, 0.95 * a);
    lines.forEach((l, i) => ctx.fillText(l, CX, y0 + i * lh));
    ctx.shadowBlur = 0; lines.forEach((l, i) => ctx.fillText(l, CX, y0 + i * lh));
    ctx.restore();
  }
}
// 章节号：左上角一枚红色的斜切纸片
function drawCaptions(ctx, t) {
  for (const c of TL.captions) {
    if (t < c.a || t > c.b) continue;
    const a = win(t, c.a, c.b, 0.5, 0.6), k = ease(t, c.a, c.a + 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = isZH() ? `${34}px ${DZH}` : `${40}px ${DEN}`;
    ctx.letterSpacing = isZH() ? '0px' : '2px';
    const w = ctx.measureText(c.text).width + 60, x = lerp(-w, 0, back(k));
    cut(ctx, RED, P([[x - 20, 64], [x + 70 + w, 64], [x + 40 + w, 124], [x - 20, 124]], 4, 1), { lift: 1 });
    ctx.fillStyle = rgba(SLIP); ctx.textBaseline = 'middle'; ctx.fillText(c.text, x + 70, 96);
    ctx.restore();
  }
}
function drawText(ctx, t) {
  let k = 0;
  for (const s of TL.subs) k = Math.max(k, win(t, s.a - 0.3, s.b + 0.3, 0.4, 0.5));
  if (k > 0) {
    const g = ctx.createLinearGradient(0, H - 250, 0, H);
    g.addColorStop(0, rgba(PAPER, 0)); g.addColorStop(0.45, rgba(PAPER, 0.6 * k)); g.addColorStop(1, rgba(PAPER, 0.78 * k));
    ctx.fillStyle = g; ctx.fillRect(0, H - 250, W, 250);
  }
  drawCaptions(ctx, t);
  drawSubs(ctx, t);
}
