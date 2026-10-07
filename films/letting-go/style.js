// 《放手》的画面语言：宣纸、墨、朱砂。覆盖引擎默认的黑底字幕与后期，换成纸上的墨色。
const PAPER = [236, 227, 206], INK = [30, 26, 24], CINNABAR = [176, 52, 36];
const BRUSH = '"LG Brush", "Noto Serif CJK SC", serif';
const KAI = '"LG Kai", "Noto Serif CJK SC", serif';
const GARA = '"LG Garamond", "Nimbus Roman", serif';
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, k) => [0, 1, 2].map((i) => lerp(a[i], b[i], k));
// 镜头内某句旁白的时刻：frac=0 开始，1 结束
const at = (sh, id, frac = 0) => (sh[id] ?? 0) + frac * ((sh[id + '_end'] ?? sh[id] ?? 0) - (sh[id] ?? 0));

// —— 字体与图片一起预载 ——
const _loadImages = loadImages;
loadImages = async () => {
  await Promise.all([
    _loadImages(),
    document.fonts.load(`80px ${BRUSH}`, '放手'),
    document.fonts.load(`40px ${KAI}`, '放手描红'),
    document.fonts.load(`40px ${GARA}`, 'Letting Go'),
    document.fonts.load(`italic 40px ${GARA}`, 'Letting Go'),
  ]);
};

// —— 宣纸 ——
let PAPER_TEX = null, PVIG = null, PGRAIN = [];
const PW = 2240, PH = 1260;
INITS.push(() => {
  // 低频的纸色起伏：四分之一分辨率计算再放大
  const sw = PW / 4, sh = PH / 4;
  const small = makeCanvas(sw, sh), sx = small.getContext('2d');
  const img = sx.createImageData(sw, sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const n = fbm2(x / 46, y / 46, 3, 4) * 0.6 + fbm2(x / 9, y / 9, 8, 2) * 0.25;
    const i = (y * sw + x) * 4;
    img.data[i] = PAPER[0] + n * 16; img.data[i + 1] = PAPER[1] + n * 15; img.data[i + 2] = PAPER[2] + n * 13; img.data[i + 3] = 255;
  }
  sx.putImageData(img, 0, 0);
  PAPER_TEX = makeCanvas(PW, PH);
  const p = PAPER_TEX.getContext('2d');
  p.imageSmoothingQuality = 'high';
  p.drawImage(small, 0, 0, PW, PH);
  // 纤维
  for (let k = 0; k < 2600; k++) {
    const x = rand(k, 1) * PW, y = rand(k, 2) * PH, a = rand(k, 3) * TAU, l = 8 + rand(k, 4) * 34;
    const light = rand(k, 5) > 0.45;
    p.strokeStyle = light ? `rgba(255,252,240,${0.10 + rand(k, 6) * 0.14})` : `rgba(120,96,64,${0.04 + rand(k, 6) * 0.06})`;
    p.lineWidth = 0.6 + rand(k, 7) * 0.9;
    p.beginPath(); p.moveTo(x, y);
    p.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (rand(k, 8) - 0.5) * 8, y + Math.sin(a) * l * 0.5 + (rand(k, 9) - 0.5) * 8, x + Math.cos(a) * l, y + Math.sin(a) * l);
    p.stroke();
  }
  // 暖色暗角（正片叠底）
  PVIG = makeCanvas();
  const v = PVIG.getContext('2d');
  const g = v.createRadialGradient(CX, CY, H * 0.32, CX, CY, H * 1.02);
  g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(0.65, 'rgb(240,232,218)'); g.addColorStop(1, 'rgb(168,146,116)');
  v.fillStyle = g; v.fillRect(0, 0, W, H);
  // 纸面颗粒：大多接近白，偶有深点
  for (let k = 0; k < 4; k++) {
    const c = makeCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256);
    let s = 99 + k * 7919;
    for (let i = 0; i < d.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const r = ((s >> 16) & 255) / 255;
      const val = 255 - Math.pow(r, 4) * 70;
      d.data[i] = val; d.data[i + 1] = val * 0.985; d.data[i + 2] = val * 0.96; d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    PGRAIN.push(c);
  }
});

function paper(ctx, s = 1, dx = 0, dy = 0) {
  ctx.drawImage(PAPER_TEX, CX - (PW / 2) * s + dx, CY - (PH / 2) * s + dy, PW * s, PH * s);
}
function cam(ctx, s, cx = CX, cy = CY) {
  ctx.translate(CX, CY); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// 覆盖引擎后期：纸上不用“发光”颗粒，改为正片叠底的暗角和纸粒
function post(ctx, t, frame) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(PVIG, 0, 0);
  // 纸粒是纸的一部分，不随帧闪烁（也让成片好压缩）
  ctx.fillStyle = ctx.createPattern(PGRAIN[0], 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// —— 毛笔 ——
// 采样一条 Catmull-Rom 曲线，按约 2px 等距重采样，附带法线
const _strokeCache = new Map();
function strokeOf(pts) {
  const key = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(';');
  let S = _strokeCache.get(key);
  if (S) return S;
  const dense = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let j = 0; j < 16; j++) {
      const t = j / 16, t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  dense.push(pts[n - 1]);
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = cum.at(-1), m = Math.max(2, Math.ceil(L / 2));
  const P = [];
  let j = 0;
  for (let i = 0; i <= m; i++) {
    const d = (L * i) / m;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const k = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
    P.push([lerp(dense[j][0], dense[j + 1][0], k), lerp(dense[j][1], dense[j + 1][1], k)]);
  }
  const N = P.map((_, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  S = { P, N, L };
  _strokeCache.set(key, S);
  return S;
}

// 一笔：起笔略顿、行笔饱满、收笔出锋，尾段有飞白
function inkStroke(ctx, pts, o = {}) {
  const p = clamp(o.p ?? 1);
  if (p <= 0.001) return;
  const S = strokeOf(pts), n = S.P.length;
  const w = o.w ?? 10, seed = o.seed ?? 0, col = o.color ?? INK, alpha = o.alpha ?? 1;
  const dry = o.dry ?? 0.5, taper = o.taper ?? 0.28, head = o.head ?? 0.06;
  const iEnd = Math.max(1, Math.floor(p * (n - 1)));
  const R = [];
  for (let i = 0; i <= iEnd; i++) {
    const s = i / (n - 1);
    let r = (0.55 + 0.45 * smooth(clamp(s / head))) * (1 - 0.85 * smooth(clamp((s - (1 - taper)) / taper)));
    r *= 1 + 0.12 * noise1(i * 0.045, seed) + 0.05 * noise1(i * 0.4, seed + 3);
    // 正在书写的笔锋：最后几像素收圆
    const tip = clamp((iEnd - i) / 6);
    R.push(w * r * (0.55 + 0.45 * tip));
  }
  const edge = (scale) => {
    ctx.beginPath();
    for (let i = 0; i <= iEnd; i++) { const [x, y] = S.P[i], [nx, ny] = S.N[i]; i ? ctx.lineTo(x + nx * R[i] * scale, y + ny * R[i] * scale) : ctx.moveTo(x + nx * R[i] * scale, y + ny * R[i] * scale); }
    for (let i = iEnd; i >= 0; i--) { const [x, y] = S.P[i], [nx, ny] = S.N[i]; ctx.lineTo(x - nx * R[i] * scale, y - ny * R[i] * scale); }
    ctx.closePath();
  };
  ctx.save();
  // 洇：一圈很淡的墨晕
  if (o.bleed !== 0) { ctx.fillStyle = rgba(col, 0.09 * alpha * (o.bleed ?? 1)); edge(1.45); ctx.fill(); }
  ctx.fillStyle = rgba(col, 0.9 * alpha);
  edge(1); ctx.fill();
  // 起笔处的圆头
  ctx.beginPath(); ctx.arc(S.P[0][0], S.P[0][1], R[0] * 0.95, 0, TAU); ctx.fill();
  // 飞白：在笔画后段用纸色划出断续的细丝
  if (dry > 0) {
    const B = 9;
    ctx.strokeStyle = rgba(PAPER, 0.75 * Math.min(1, alpha * 1.2));
    for (let b = 0; b < B; b++) {
      const off = (b / (B - 1)) * 1.6 - 0.8;
      ctx.lineWidth = Math.max(0.6, w * (0.06 + 0.05 * rand(b, seed)));
      ctx.beginPath();
      let on = false;
      for (let i = 0; i <= iEnd; i += 2) {
        const s = i / (n - 1);
        const th = 1 - dry * smooth(clamp((s - 0.35) / 0.55)) * 1.4;
        const v = noise2(i * 0.03, b * 2.7, seed + 11) * 0.5 + 0.5;
        const x = S.P[i][0] + S.N[i][0] * R[i] * off, y = S.P[i][1] + S.N[i][1] * R[i] * off;
        if (v > th) { on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true; } else on = false;
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  return S.P[iEnd];
}
// 曲线上进度 p 处的点
function strokePoint(pts, p) { const S = strokeOf(pts); return S.P[Math.round(clamp(p) * (S.P.length - 1))]; }

// —— 墨字 ——
function inkText(ctx, text, x, y, size, font, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  ctx.save();
  ctx.font = `${o.style ?? ''} ${size}px ${font}`;
  ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = o.base ?? 'middle';
  ctx.letterSpacing = o.spacing ?? '0px';
  const col = o.color ?? INK;
  ctx.shadowColor = rgba(col, 0.45 * a); ctx.shadowBlur = o.bleed ?? size * 0.05;
  ctx.fillStyle = rgba(col, (o.op ?? 0.92) * a);
  ctx.fillText(text, x, y);
  ctx.restore();
}
// 逐字书写：每个字自上而下显出
function writeChar(ctx, ch, x, y, size, font, k, o = {}) {
  if (k <= 0) return;
  ctx.save();
  ctx.beginPath();
  const top = y - size * 0.62;
  ctx.rect(x - size, top, size * 2, size * 1.24 * clamp(k * 1.15));
  ctx.clip();
  inkText(ctx, ch, x, y, size, font, { ...o, alpha: (o.alpha ?? 1) * clamp(k * 2) });
  ctx.restore();
}
// 横排逐渐写出（英文用）：从左到右揭开
function writeLine(ctx, text, x, y, size, font, k, o = {}) {
  if (k <= 0) return;
  ctx.save();
  ctx.font = `${o.style ?? ''} ${size}px ${font}`;
  const w = ctx.measureText(text).width;
  const x0 = o.align === 'center' ? x - w / 2 : x;
  ctx.beginPath(); ctx.rect(x0 - 10, y - size, (w + 20) * clamp(k), size * 2); ctx.clip();
  inkText(ctx, text, x0, y, size, font, { ...o, align: 'left' });
  ctx.restore();
}

// —— 印章：k 为盖下的过程 ——
function seal(ctx, x, y, s, chars, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0) return;
  const press = ease(k, 0, 0.35), a = (o.alpha ?? 1) * press;
  const sc = 1 + 0.22 * (1 - press);
  const seed = o.seed ?? chars.length;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.rot ?? (rand(seed, 9) - 0.5) * 0.06); ctx.scale(sc, sc);
  ctx.globalAlpha = a;
  // 略不规整的印边
  ctx.beginPath();
  const h = s / 2, steps = 10;
  const pts = [];
  for (let side = 0; side < 4; side++) for (let i = 0; i < steps; i++) {
    const q = i / steps;
    const [px, py] = [[-h + q * s, -h], [h, -h + q * s], [h - q * s, h], [-h, h - q * s]][side];
    const j = noise1(side * 10 + i, seed) * s * 0.012;
    pts.push([px + j, py + j]);
  }
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.fillStyle = rgba(CINNABAR, 0.92);
  ctx.fill();
  // 白文
  const n = [...chars].length, cs = [...chars];
  ctx.fillStyle = rgba(PAPER, 0.95);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const F = `"Noto Serif CJK SC", serif`;
  if (n === 1) { ctx.font = `900 ${s * 0.68}px ${F}`; ctx.fillText(cs[0], 0, s * 0.03); }
  else if (n === 2) { ctx.font = `900 ${s * 0.4}px ${F}`; ctx.fillText(cs[0], 0, -s * 0.2); ctx.fillText(cs[1], 0, s * 0.22); }
  else { ctx.font = `900 ${s * 0.36}px ${F}`; [[s * 0.2, -s * 0.2], [s * 0.2, s * 0.22], [-s * 0.2, -s * 0.2], [-s * 0.2, s * 0.22]].forEach(([dx, dy], i) => cs[i] && ctx.fillText(cs[i], dx, dy)); }
  // 斑驳
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rgba(PAPER, 0.35 + rand(i, seed) * 0.4);
    ctx.beginPath(); ctx.arc((rand(i, seed + 1) - 0.5) * s * 0.96, (rand(i, seed + 2) - 0.5) * s * 0.96, 0.6 + rand(i, seed + 3) * s * 0.018, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// —— 告示条：贴在纸上的一张小纸，朱笔写字 ——
function slip(ctx, x, y, w, h, rot, text, o = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(70,46,24,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.fillStyle = 'rgb(246,238,218)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(150,120,80,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
  // 浆糊的四角
  ctx.fillStyle = 'rgba(190,170,120,0.35)';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(sx * (w / 2 - 10), sy * (h / 2 - 10), 5, 0, TAU); ctx.fill(); }
  const zh = /[一-鿿]/.test(text);
  const size = zh ? Math.min(h * 0.56, (w * 0.82) / Math.max(1, [...text].length)) : Math.min(h * 0.36, (w * 1.5) / Math.max(4, text.length));
  ctx.globalAlpha = 1;
  inkText(ctx, text, 0, zh ? 2 : 3, size, zh ? BRUSH : GARA, { color: CINNABAR, alpha: a, style: zh ? '' : '600', spacing: zh ? '2px' : '1px' });
  ctx.restore();
}

// —— 远山：预先渲染的水墨层 ——
const mtRidge = (seed, base, amp, px) => base - amp * (0.55 + 0.6 * fbm1(px / 340, seed, 5) + 0.35 * Math.max(0, noise1(px / 900, seed + 5)));
function makeMountains(seed, w, h, base, amp, a0, blur = 3) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  const ridge = (px) => mtRidge(seed, base, amp, px);
  const g = x.createLinearGradient(0, base - amp * 1.3, 0, h);
  g.addColorStop(0, rgba(INK, a0)); g.addColorStop(0.35, rgba(INK, a0 * 0.55)); g.addColorStop(1, rgba(INK, 0));
  x.filter = `blur(${blur}px)`;
  x.beginPath(); x.moveTo(0, h);
  for (let px = 0; px <= w; px += 6) x.lineTo(px, ridge(px));
  x.lineTo(w, h); x.closePath();
  x.fillStyle = g; x.fill();
  // 山脊的一道浓墨
  x.filter = `blur(${Math.max(0.6, blur * 0.3)}px)`;
  x.strokeStyle = rgba(INK, Math.min(0.9, a0 * 1.4)); x.lineWidth = 2.2;
  x.beginPath();
  for (let px = 0; px <= w; px += 6) px ? x.lineTo(px, ridge(px)) : x.moveTo(px, ridge(px));
  x.stroke();
  x.filter = 'none';
  return c;
}

// —— 文字层：墨色字幕、竖排题款；灯下的暗场里字幕改为纸色 ——
function subDark(t) {
  const s = TL.shots.find((q) => q.kind === 'lamp');
  if (!s || t < s.a || t > s.b) return 0;
  return win(t, s.a, s.b, s.fi, s.fo) * ease(t - s.a, 0.2, 1.6);
}
// 两行字幕尽量等长，避免最后一行只剩一两个词
function balance(ctx, lines) {
  if (lines.length !== 2) return lines;
  const all = lines.join(ZH() ? '' : ' ');
  const parts = ZH() ? [...all] : all.split(' ');
  const join = (a) => a.join(ZH() ? '' : ' ');
  let best = lines, bw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  for (let i = 1; i < parts.length; i++) {
    const a = join(parts.slice(0, i)), b = join(parts.slice(i));
    if (ZH() && /^[，。、：；！？”]/.test(b)) continue;
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    // 中文优先在标点后断开
    const pen = ZH() && !/[，。、：；！？]$/.test(a) ? 500 : 0;
    if (w + pen < bw) { bw = w + pen; best = [a, b]; }
  }
  return best;
}
function drawSubs(ctx, t) {
  const dk = subDark(t);
  const col = mixc(INK, [238, 228, 206], dk), halo = mixc(PAPER, [12, 10, 9], dk);
  for (const s of TL.subs) {
    if (t < s.a || t > s.b) continue;
    const a = win(t, s.a, s.b, 0.35, 0.4);
    ctx.save();
    const size = ZH() ? 38 : 40;
    ctx.font = `${size}px ${ZH() ? KAI : GARA}`;
    ctx.letterSpacing = ZH() ? '0.1em' : '0.01em';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = balance(ctx, wrapLines(ctx, s.text, ZH() ? 1240 : 1420));
    const lh = size * 1.55;
    const y0 = H - 96 - (lines.length - 1) * lh;
    ctx.shadowColor = rgba(halo, 0.95 * a); ctx.shadowBlur = 16;
    ctx.fillStyle = rgba(col, 0.9 * a);
    lines.forEach((l, i) => ctx.fillText(l, CX + (ZH() ? size * 0.05 : 0), y0 + i * lh));
    ctx.shadowBlur = 0;
    lines.forEach((l, i) => ctx.fillText(l, CX + (ZH() ? size * 0.05 : 0), y0 + i * lh));
    ctx.restore();
  }
}
function drawCaptions(ctx, t) {
  for (const c of TL.captions) {
    if (t < c.a || t > c.b) continue;
    const a = win(t, c.a, c.b, 1.2, 0.9);
    const mark = '续嘱步补推灯放今'[TL.captions.indexOf(c)] || '印';
    if (ZH()) {
      const chars = [...c.text.replace(/\s/g, '')];
      chars.forEach((ch, i) => inkText(ctx, ch === '·' ? '・' : ch, W - 120, 120 + i * 46, 34, KAI, { alpha: a * 0.86 }));
      seal(ctx, W - 120, 120 + chars.length * 46 + 26, 38, mark, { k: ease(t, c.a + 0.6, c.a + 1.4), alpha: a });
    } else {
      inkText(ctx, c.text, W - 160, 104, 32, GARA, { alpha: a * 0.86, align: 'right', style: 'italic' });
      seal(ctx, W - 118, 104, 38, mark, { k: ease(t, c.a + 0.6, c.a + 1.4), alpha: a });
    }
  }
}
function drawText(ctx, t) {
  // 字幕下方一层淡淡的纸色，防止压在墨上读不清
  let k = 0;
  for (const s of TL.subs) k = Math.max(k, win(t, s.a - 0.3, s.b + 0.3, 0.5, 0.6));
  if (k > 0) {
    const dk = subDark(t), c = mixc(PAPER, [10, 8, 7], dk);
    const g = ctx.createLinearGradient(0, H - 250, 0, H);
    g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, 0.42 * k)); g.addColorStop(1, rgba(c, 0.55 * k));
    ctx.fillStyle = g; ctx.fillRect(0, H - 250, W, 250);
  }
  drawCaptions(ctx, t);
  drawSubs(ctx, t);
}
