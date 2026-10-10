// 合成：镜头调度与转场、辉光、字幕、竖屏标题条、年代标尺与标签，以及浏览器内预览。
let ctx, bufA, bufB, small1, small2, small3, vign, dither;

// 进入某个镜头时用的转场 [类型, 时长]
const TR = {
  rewind: ['glitch', 0.4], title: ['flash', 0.24], ide: ['zoom', 0.4], tab: ['whip', 0.32], diff: ['whip', 0.32],
  agent: ['zoom', 0.4], term: ['whip', 0.32], grid: ['zoom', 0.42], overload: ['flash', 0.18], neck: ['cut', 0],
  bloom: ['flash', 0.3], projects: ['whip', 0.32], archive: ['glitch', 0.4], loop: ['zoom', 0.42], harness: ['whip', 0.32],
  reality: ['cut', 0], ladder: ['zoom', 0.5], end: ['fade', 0.7], endcard: ['fade', 0.6],
};

function init() {
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  ctx = cv.getContext('2d');
  bufA = makeCanvas(); bufB = makeCanvas();
  small1 = makeCanvas(W / 4, H / 4); small2 = makeCanvas(W / 4, H / 4); small3 = makeCanvas(W / 10, H / 10);
  vign = makeCanvas();
  const v = vign.getContext('2d'), gr = v.createRadialGradient(CX, CY, Math.min(W, H) * 0.35, CX, CY, Math.max(W, H) * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
  // 静态抖动噪点：只为消除暗部渐变的色带，不逐帧变化（逐帧噪点会让码率暴涨）
  dither = makeCanvas(256, 256);
  const d = dither.getContext('2d'), img = d.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const n = rand(i, 9) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
  d.putImageData(img, 0, 0);
  for (const f of INITS) f();
}

function drawShot(g, s, t) {
  const u = t - s.a;
  const cue = (name, def = 0) => (s.cues[name] != null ? s.cues[name] - s.a : def);
  g.save();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  (SHOT[s.kind] || SHOT._missing)(g, u, s.b - s.a, cue, t, s);
  g.restore();
}

function composite(t) {
  const S = TL.shots;
  let i = S.findIndex((s) => t >= s.a && t < s.b);
  if (i < 0) i = t < 0 ? 0 : S.length - 1;
  // 是否在转场窗口里：本镜头开头，或下一个镜头的开头
  let pair = null;
  const nx = S[i + 1], [ntype, nlen] = nx ? TR[nx.kind] || ['cut', 0] : ['cut', 0];
  const [ctype, clen] = TR[S[i].kind] || ['cut', 0];
  if (nx && nlen && t > nx.a - nlen / 2) pair = [S[i], nx, ntype, nlen];
  else if (i > 0 && clen && t < S[i].a + clen / 2) pair = [S[i - 1], S[i], ctype, clen];
  if (!pair) { drawShot(ctx, S[i], t); return; }
  const [A, B, type, len] = pair;
  const k = clamp((t - (B.a - len / 2)) / len);
  const g = ctx;
  if (type === 'flash' || type === 'cut') {
    drawShot(g, t < B.a ? A : B, t);
    if (type === 'flash') { g.fillStyle = `rgba(255,255,255,${(1 - Math.abs(k - 0.5) * 2) * 0.9})`; g.fillRect(0, 0, W, H); }
    return;
  }
  drawShot(bufA.getContext('2d'), A, t);
  drawShot(bufB.getContext('2d'), B, t);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const put = (buf, a, sc = 1, dx = 0, dy = 0) => {
    if (a <= 0.003) return;
    g.save(); g.globalAlpha = a; g.translate(CX + dx, CY + dy); g.scale(sc, sc); g.drawImage(buf, -CX, -CY); g.restore();
  };
  if (type === 'fade') { put(bufA, 1 - k); g.globalCompositeOperation = 'lighter'; put(bufB, k); g.globalCompositeOperation = 'source-over'; }
  else if (type === 'zoom') {
    put(bufA, 1 - ease(k, 0.25, 0.75), 1 + 0.6 * inCubic(k));
    g.globalCompositeOperation = 'lighter';
    put(bufB, ease(k, 0.25, 0.75), 0.72 + 0.28 * outCubic(k));
    g.globalCompositeOperation = 'source-over';
  } else if (type === 'whip') {
    const sp = W * 1.1;
    const off = k < 0.5 ? -sp * inCubic(k * 2) : sp * (1 - outCubic((k - 0.5) * 2));
    const buf = k < 0.5 ? bufA : bufB;
    for (let j = 0; j < 5; j++) put(buf, j === 0 ? 1 : 0.22, 1, off + (j - 2) * 60 * (1 - Math.abs(k - 0.5) * 2), 0);
  } else if (type === 'glitch') {
    const buf = k < 0.5 ? bufA : bufB, amt = 1 - Math.abs(k - 0.5) * 2;
    const n = 14, f = Math.floor(t * 30);
    for (let j = 0; j < n; j++) {
      const y0 = (H / n) * j, hh = H / n + 1, dx = (rand(j, f) - 0.5) * 260 * amt * (rand(j, f + 1) > 0.4 ? 1 : 0);
      g.drawImage(buf, 0, y0, W, hh, dx, y0, W, hh);
    }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * amt;
    g.drawImage(buf, 14 * amt, 0); g.drawImage(buf, -14 * amt, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(255,255,255,${0.12 * amt})`;
    for (let j = 0; j < H; j += 4) g.fillRect(0, j, W, 1);
  }
}

function bloom(amt = 0.62) {
  const a = small1.getContext('2d'), b = small2.getContext('2d'), c = small3.getContext('2d');
  a.filter = 'contrast(1.9) brightness(0.8)';
  a.drawImage(ctx.canvas, 0, 0, small1.width, small1.height);
  a.filter = 'none';
  b.clearRect(0, 0, small2.width, small2.height);
  b.filter = 'blur(3px)'; b.drawImage(small1, 0, 0); b.filter = 'none';
  c.clearRect(0, 0, small3.width, small3.height);
  c.filter = 'blur(4px)'; c.drawImage(small1, 0, 0, small3.width, small3.height); c.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = amt; ctx.drawImage(small2, 0, 0, W, H);
  ctx.globalAlpha = amt * 0.7; ctx.drawImage(small3, 0, 0, W, H);
  ctx.restore();
}

// —— 叠加层 ——
const VERT = FMT !== 'h';
const CAP = {
  h: { y: H - 92, size: ZH ? 44 : 40, maxW: 1500 },
  v: { y: 1354, size: ZH ? 64 : 56, maxW: 960 },
  p: { y: 1196, size: ZH ? 60 : 52, maxW: 960 },
}[FMT];

function wrap(g, text, maxW) {
  if (g.measureText(text).width <= maxW) return [text];
  if (ZH) { const n = Math.ceil([...text].length / 2); return [[...text].slice(0, n).join(''), [...text].slice(n).join('')]; }
  const ws = text.split(' '); let best = 1, bd = 1e9;
  for (let i = 1; i < ws.length; i++) { const d = Math.abs(g.measureText(ws.slice(0, i).join(' ')).width - g.measureText(ws.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } }
  return [ws.slice(0, best).join(' '), ws.slice(best).join(' ')];
}

function captions(g, t) {
  const c = TL.caps.find((c) => t >= c.a - 0.05 && t < c.b);
  if (!c) return;
  const a = clamp((t - c.a + 0.05) / 0.12) * clamp((c.b - t) / 0.12);
  g.save();
  const size = CAP.size;
  g.font = VERT ? `${size}px ${ZH ? F.displayZH : F.black}` : `600 ${size}px ${ZH ? F.cjk : F.ui}`;
  g.textBaseline = 'middle';
  const lines = wrap(g, c.text, CAP.maxW);
  const lh = size * 1.28;
  const y0 = CAP.y - ((lines.length - 1) * lh) / 2;
  if (!VERT) {
    // 横屏：干净的底部字幕
    g.textAlign = 'center';
    g.shadowColor = 'rgba(0,0,0,0.95)'; g.shadowBlur = 14;
    g.fillStyle = `rgba(245,248,252,${a})`;
    lines.forEach((l, i) => g.fillText(l, CX, y0 + i * lh));
    g.restore();
    return;
  }
  // 竖屏：大字，逐字高亮（已念白，正念琥珀，未念半透明）
  const pop = 1 + 0.06 * (1 - ease(t, c.a, c.a + 0.18));
  g.translate(CX, CAP.y); g.scale(pop, pop); g.translate(-CX, -CAP.y);
  g.lineJoin = 'round';
  let idx = 0;
  const times = c.w;
  lines.forEach((l, li) => {
    const units = ZH ? [...l] : l.split(/(\s+)/);
    const widths = units.map((u) => g.measureText(u).width);
    let x = CX - widths.reduce((s, w) => s + w, 0) / 2;
    const y = y0 + li * lh;
    units.forEach((u, ui) => {
      const n = ZH ? 1 : u.trim() ? [...u].length : 0;
      const ts = times[idx], te = times[idx + n] ?? c.b;
      idx += ZH ? (/\s/.test(u) ? 0 : 1) : n;
      const spoken = ts != null && t >= ts;
      const cur = spoken && t < te;
      g.lineWidth = size * 0.16; g.strokeStyle = `rgba(0,0,0,${0.85 * a})`;
      g.strokeText(u, x, y);
      g.fillStyle = cur ? rgba(C.amberRGB, a) : `rgba(255,255,255,${a * (spoken || ts == null ? 1 : 0.62)})`;
      g.fillText(u, x, y);
      x += widths[ui];
    });
  });
  g.restore();
}

// 横屏左上 / 竖屏标尺下方：年代与出处标签
function chips(g, t) {
  for (const c of TL.chips) {
    if (t < c.a || t > c.b) continue;
    const a = win(t, c.a, c.b, 0.15, 0.35);
    const k = ex(t, c.a, c.a + 0.5);
    g.save();
    g.font = `500 ${VERT ? 26 : 22}px ${F.mono}`;
    g.textBaseline = 'middle';
    const tw = g.measureText(c.text).width;
    const w = (tw + 54) * k, h = VERT ? 46 : 40;
    const x = VERT ? CX - (tw + 54) / 2 : 64, y = VERT ? (FMT === 'v' ? 516 : 222) : 104;
    g.globalAlpha = a;
    rr(g, x, y - h / 2, w, h, h / 2);
    g.fillStyle = 'rgba(8,14,26,0.82)'; g.fill();
    g.strokeStyle = rgba(C.amberRGB, 0.7); g.lineWidth = 1.5; g.stroke();
    g.save(); g.clip();
    glow(g, x + 22, y, 18, C.amberRGB, 0.8 + 0.2 * Math.sin(t * 8), 1);
    g.fillStyle = C.ink; g.textAlign = 'left';
    g.fillText(c.text, x + 40, y + 1);
    g.restore();
    g.restore();
  }
}

// 年代标尺：2021 → 2026，琥珀色的点跟着故事走
function eraAt(t) {
  const E = TL.eras;
  if (!E.length || t < E[0].t - 0.2) return null;
  let v = E[0].era;
  for (let i = 1; i < E.length; i++) v = lerp(v, E[i].era, ease(t, E[i].t - 0.2, E[i].t + 0.6));
  return v;
}
function ruler(g, t) {
  const e = eraAt(t);
  if (e == null) return;
  const lad = TL.shots.find((s) => s.kind === 'ladder');
  const endT = lad ? lad.a : TL.duration;
  const a = ease(t, TL.eras[0].t - 0.2, TL.eras[0].t + 0.4) * (1 - ease(t, endT - 0.3, endT + 0.2));
  if (a <= 0.004) return;
  const w = VERT ? 760 : 620, x0 = CX - w / 2, y = VERT ? (FMT === 'v' ? 462 : 168) : 46;
  // 刻度在每年 1 月 1 日；标尺覆盖 2020 年中到 2026 年底，2026.09 这样的日期也落在线内
  const pos = (yr) => x0 + ((yr - 2020.5) / 6.5) * w;
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(125,139,163,0.35)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke();
  const px = pos(e);
  g.strokeStyle = rgba(C.cyanRGB, 0.75); g.beginPath(); g.moveTo(x0, y); g.lineTo(px, y); g.stroke();
  g.font = `${VERT ? 24 : 20}px ${F.num}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let yr = 2021; yr <= 2026; yr++) {
    const x = pos(yr), on = e >= yr - 0.02;
    g.fillStyle = on ? C.ink : C.dim; g.globalAlpha = a * (on ? 1 : 0.6);
    g.fillRect(x - 1, y - 6, 2, 12);
    g.fillText(String(yr), x, y + (VERT ? 22 : 19));
  }
  g.globalAlpha = a;
  glow(g, px, y, 26, C.amberRGB, 1, 1);
  g.restore();
}

// 竖屏顶部常驻标题（钩子之后出现）：中途划进来的人也知道在看什么
function header(g, t) {
  if (!VERT) return;
  const first = TL.shots.find((s) => s.kind === 'tab' || s.kind === 'ide');
  const end = TL.shots.find((s) => s.kind === 'endcard');
  if (!first) return;
  const a = ease(t, first.a, first.a + 0.4) * (1 - ease(t, end.a - 0.3, end.a));
  if (a <= 0.004) return;
  const y = FMT === 'v' ? 392 : 98;
  g.save(); g.globalAlpha = a;
  const s = txt(g, TL.txt.header, CX, y, ZH ? 54 : 46, C.white, { maxW: 980, shadow: 'rgba(0,0,0,0.9)', blur: 16, family: ZH ? F.displayZH : F.black });
  g.restore();
}

function renderFrame(t) {
  ctx.save();
  composite(t);
  ctx.restore();
  bloom();
  ctx.drawImage(vign, 0, 0);
  ctx.save(); ctx.globalAlpha = 0.022; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(dither, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  header(ctx, t); ruler(ctx, t); chips(ctx, t); captions(ctx, t);
}

SHOT._missing = (g, u, dur, cue, t, s) => { background(g, t); txt(g, s.kind, CX, CY, 80, C.dim); };

window.renderAt = (t, q = 0.92) => { renderFrame(t); return ctx.canvas.toDataURL('image/jpeg', q); };
window.renderPNG = (t) => { renderFrame(t); return ctx.canvas.toDataURL('image/png'); };
window.shotAt = (kind, n = 0) => TL.shots.filter((s) => s.kind === kind)[n];
window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`40px ${F.displayZH}`, '从写代码到让指挥'),
    document.fonts.load(`40px ${F.black}`, 'FROM WRITING CODE'),
    document.fonts.load(`40px ${F.num}`, '2021'),
    document.fonts.load(`20px ${F.mono}`, 'const x = 1;'),
    document.fonts.load(`600 20px ${F.ui}`, 'Agents'),
    document.fonts.load(`600 20px ${F.cjk}`, '代码'),
  ]);
  init();
  return true;
})();

if (Q.has('preview')) {
  window.ready.then(() => {
    const ui = document.getElementById('ui'); ui.hidden = false;
    const range = document.getElementById('t'), label = document.getElementById('lab'), audio = document.getElementById('aud');
    audio.src = `out/mix/${TL.variant}.wav`;
    range.max = TL.duration;
    let playing = false, t0 = 0, start = 0;
    const show = (t) => { renderFrame(t); range.value = t; label.textContent = t.toFixed(2) + 's'; };
    range.oninput = () => { start = +range.value; t0 = performance.now(); audio.currentTime = start; show(start); };
    document.getElementById('play').onclick = () => {
      playing = !playing; start = +range.value; t0 = performance.now();
      if (playing) { audio.currentTime = start; audio.play().catch(() => {}); loop(); } else audio.pause();
    };
    function loop() {
      if (!playing) return;
      show(Math.min(audio.paused ? start + (performance.now() - t0) / 1000 : audio.currentTime, TL.duration - 0.01));
      requestAnimationFrame(loop);
    }
    show(+(Q.get('t') || 0));
  });
}
