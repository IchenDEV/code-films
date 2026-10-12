// 合成：镜头调度与转场、辉光与颗粒、双语字幕、竖屏标题条，以及浏览器内预览。
let ctx, bufA, bufB, small1, small2, vign, grain, scrim;

// 进入某个镜头时用的转场 [类型, 时长]
const TR = {
  shop: ['cut', 0], shrug: ['cut', 0], facade: ['fade', 0.5], desk: ['zoom', 0.6], split: ['cut', 0],
  title: ['fade', 0.8], funnel: ['fade', 0.9], sea: ['fade', 0.9], peaks: ['fade', 0.9], valley: ['cut', 0],
  door: ['fade', 0.7], swarm: ['white', 0.7], vertigo: ['cut', 0], napkin: ['cut', 0], keys: ['fade', 0.6],
  gap: ['fade', 0.7], city: ['fade', 0.9], return: ['zoom', 0.8], dawn: ['fade', 0.7], endcard: ['fade', 1.2],
};

function init() {
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  ctx = cv.getContext('2d');
  bufA = makeCanvas(); bufB = makeCanvas();
  small1 = makeCanvas(W / 4, H / 4); small2 = makeCanvas(W / 8, H / 8);
  vign = makeCanvas();
  const v = vign.getContext('2d'), gr = v.createRadialGradient(CX, CY, Math.min(W, H) * 0.4, CX, CY, Math.max(W, H) * 0.78);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,8,0.5)');
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
  // 静态颗粒：像纸，也消除暗部色带；不逐帧变化（逐帧噪点会让码率暴涨）
  grain = makeCanvas(256, 256);
  const d = grain.getContext('2d'), img = d.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const n = rand(i, 9) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
  d.putImageData(img, 0, 0);
  // 字幕底下的一层柔和压暗：任何背景上都看得清
  scrim = makeCanvas();
  const s = scrim.getContext('2d');
  if (PORTRAIT) {
    const y0 = CAP.y - 170, y1 = CAP.y + 230;
    const sg = s.createLinearGradient(0, y0, 0, y1);
    sg.addColorStop(0, 'rgba(4,5,16,0)'); sg.addColorStop(0.35, 'rgba(4,5,16,0.42)'); sg.addColorStop(0.7, 'rgba(4,5,16,0.42)'); sg.addColorStop(1, 'rgba(4,5,16,0)');
    s.fillStyle = sg; s.fillRect(0, y0, W, y1 - y0);
    const tg = s.createLinearGradient(0, 300, 0, 520);
    tg.addColorStop(0, 'rgba(4,5,16,0.35)'); tg.addColorStop(1, 'rgba(4,5,16,0)');
    s.fillStyle = tg; s.fillRect(0, 300, W, 220);
    s.fillStyle = 'rgba(4,5,16,0.35)'; s.fillRect(0, 0, W, 300);
  } else {
    const sg = s.createLinearGradient(0, H - 270, 0, H);
    sg.addColorStop(0, 'rgba(4,5,16,0)'); sg.addColorStop(0.6, 'rgba(4,5,16,0.38)'); sg.addColorStop(1, 'rgba(4,5,16,0.55)');
    s.fillStyle = sg; s.fillRect(0, H - 270, W, 270);
  }
  for (const f of INITS) f();
}

function drawShot(g, s, t) {
  const u = t - s.a;
  const cue = (name, def = 0) => (s.cues[name] != null ? s.cues[name] - s.a : def);
  g.save();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = C.night; g.fillRect(0, 0, W, H);
  (SHOT[s.kind] || SHOT._missing)(g, u, s.b - s.a, cue, t, s);
  g.restore();
}

function composite(t) {
  const S = TL.shots;
  let i = S.findIndex((s) => t >= s.a && t < s.b);
  if (i < 0) i = t < 0 ? 0 : S.length - 1;
  let pair = null;
  const nx = S[i + 1], [ntype, nlen] = nx ? TR[nx.kind] || ['cut', 0] : ['cut', 0];
  const [ctype, clen] = TR[S[i].kind] || ['cut', 0];
  if (nx && nlen && t > nx.a - nlen / 2) pair = [S[i], nx, ntype, nlen];
  else if (i > 0 && clen && t < S[i].a + clen / 2) pair = [S[i - 1], S[i], ctype, clen];
  if (!pair) { drawShot(ctx, S[i], t); return; }
  const [A, B, type, len] = pair;
  const k = clamp((t - (B.a - len / 2)) / len);
  const g = ctx;
  if (type === 'cut') { drawShot(g, t < B.a ? A : B, t); return; }
  if (type === 'white') {
    drawShot(g, t < B.a ? A : B, t);
    g.fillStyle = `rgba(255,248,232,${Math.pow(1 - Math.abs(k - 0.5) * 2, 0.7)})`; g.fillRect(0, 0, W, H);
    return;
  }
  drawShot(bufA.getContext('2d'), A, t);
  drawShot(bufB.getContext('2d'), B, t);
  const put = (buf, a, sc = 1) => {
    if (a <= 0.003) return;
    g.save(); g.globalAlpha = a; g.translate(CX, CY); g.scale(sc, sc); g.drawImage(buf, -CX, -CY); g.restore();
  };
  if (type === 'fade') { put(bufA, 1); put(bufB, sm(k)); }
  else if (type === 'zoom') { put(bufA, 1, 1 + 0.5 * inCubic(k)); put(bufB, ease(k, 0.2, 0.8), 0.85 + 0.15 * outCubic(k)); }
}

function bloom(amt = 0.5) {
  const a = small1.getContext('2d'), b = small2.getContext('2d');
  a.filter = 'brightness(0.75) contrast(1.6)';
  a.drawImage(ctx.canvas, 0, 0, small1.width, small1.height);
  a.filter = 'none';
  b.clearRect(0, 0, small2.width, small2.height);
  b.filter = 'blur(3px)'; b.drawImage(small1, 0, 0, small2.width, small2.height); b.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = amt; ctx.drawImage(small2, 0, 0, W, H);
  ctx.restore();
}

// —— 字幕：一句中文，下面一行英文斜体 ——
const CAP = PORTRAIT ? { y: 1318, zh: 56, en: 33, maxW: 900, gap: 70 } : { y: H - 116, zh: 46, en: 29, maxW: 1600, gap: 54 };
// 锚词「就这」在字幕里用暖金色
const ANCHOR = /(就这？?|That's it\??)/;
function splitZh(g, text, maxW) {
  if (g.measureText(text).width <= maxW) return [text];
  // 竖屏放不下时在最靠中间的标点后断开
  const ch = [...text], mid = ch.length / 2;
  let best = Math.round(mid), bd = 1e9;
  ch.forEach((c, i) => { if (/[，。？！：；—]/.test(c) && i < ch.length - 2) { const d = Math.abs(i + 1 - mid); if (d < bd) { bd = d; best = i + 1; } } });
  if (ch[best] === '—') best++;
  return [ch.slice(0, best).join(''), ch.slice(best).join('')];
}
function richLine(g, text, x, y, base, hi, a) {
  const parts = text.split(ANCHOR).filter((p) => p !== '');
  const widths = parts.map((p) => g.measureText(p).width), total = widths.reduce((s, w) => s + w, 0);
  let cx = x - total / 2;
  g.textAlign = 'left';
  parts.forEach((p, i) => {
    g.fillStyle = ANCHOR.test(p) ? rgba(hi, a) : rgba(base, a);
    g.fillText(p, cx, y);
    cx += widths[i];
  });
}
function captions(g, t) {
  for (const c of TL.caps) {
    if (t < c.a - 0.05 || t > c.b + 0.05) continue;
    // 第一句不淡入：第一帧就有字
    const a = (c.a < 0.05 ? 1 : ease(t, c.a, c.a + 0.35)) * (1 - ease(t, c.b - 0.3, c.b));
    if (a <= 0.003) continue;
    const rise = c.a < 0.05 ? 0 : (1 - ease(t, c.a, c.a + 0.5)) * 8;
    g.save();
    g.textBaseline = 'middle';
    if (TL.lang === 'en' && TL.cut === 'short') { enFirst(g, c, a, rise); g.restore(); continue; }
    // 中文
    setFont(g, CAP.zh, F.serif, '600');
    const zl = splitZh(g, c.zh, CAP.maxW), zlh = CAP.zh * 1.34;
    setFont(g, CAP.en, F.loraI, '500');
    const el = wrapText(g, c.en, CAP.maxW * (PORTRAIT ? 1 : 0.9)), elh = CAP.en * 1.3;
    // 中文行落在 CAP.y 附近，英文在下面；竖屏两行中文时整体上移
    const y0 = CAP.y - (zl.length - 1) * zlh * (PORTRAIT ? 0.75 : 1) + rise;
    g.shadowColor = 'rgba(0,0,6,0.9)'; g.shadowBlur = 16; g.shadowOffsetY = 2;
    setFont(g, CAP.zh, F.serif, '600');
    zl.forEach((l, i) => richLine(g, l, CX, y0 + i * zlh, [248, 244, 234], C.warmRGB, a));
    setFont(g, CAP.en, F.loraI, '500');
    const ey = y0 + (zl.length - 1) * zlh + CAP.gap;
    el.forEach((l, i) => richLine(g, l, CX, ey + i * elh, [226, 228, 240], C.warmRGB, a * 0.92));
    g.restore();
  }
}

// 英文旁白的短版（YouTube Shorts）：英文在上（正体，说的就是这句），中文在下
function enFirst(g, c, a, rise) {
  const es = 50, zs = 34;
  setFont(g, es, F.lora, '600');
  const el = wrapText(g, c.en, CAP.maxW), elh = es * 1.26;
  setFont(g, zs, F.serif, '500');
  const zl = splitZh(g, c.zh, CAP.maxW);
  const y0 = CAP.y - (el.length - 1) * elh * 0.75 + rise;
  g.shadowColor = 'rgba(0,0,6,0.9)'; g.shadowBlur = 16; g.shadowOffsetY = 2;
  setFont(g, es, F.lora, '600');
  el.forEach((l, i) => richLine(g, l, CX, y0 + i * elh, [248, 244, 234], C.warmRGB, a));
  setFont(g, zs, F.serif, '500');
  const zy = y0 + (el.length - 1) * elh + 64;
  zl.forEach((l, i) => richLine(g, l, CX, zy + i * zs * 1.3, [226, 228, 240], C.warmRGB, a * 0.9));
}

// 竖屏顶部常驻标题：从第一帧就在（钩子 + 话题），中途划进来的人也知道在看什么
function header(g, t) {
  if (!PORTRAIT) return;
  const end = TL.shots.find((s) => s.kind === 'endcard');
  const a = 1 - ease(t, end.a - 0.4, end.a);
  if (a <= 0.004) return;
  const [l1, l2] = TL.lang === 'en' ? TL.txt.headerEn : TL.txt.header;
  g.save(); g.globalAlpha = a;
  const en = TL.lang === 'en';
  txt(g, l1, CX, 360, en ? 44 : 50, C.ink, { maxW: 980, family: en ? F.lora : F.hand, weight: en ? '700' : '', shadow: 'rgba(0,0,10,0.95)', blur: 18 });
  txt(g, l2, CX, 428, 42, C.warm, { maxW: 980, family: en ? F.loraI : F.hand, weight: en ? '600' : '', shadow: 'rgba(0,0,10,0.95)', blur: 18 });
  g.restore();
}

function renderFrame(t) {
  ctx.save();
  composite(t);
  ctx.restore();
  bloom();
  ctx.drawImage(vign, 0, 0);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  // 字幕底的压暗只在有字幕时出现
  const capOn = TL.caps.some((c) => t > c.a - 0.4 && t < c.b + 0.4);
  const hdrOn = PORTRAIT;
  if (capOn || hdrOn) { ctx.save(); ctx.globalAlpha = capOn ? 1 : 0.6; ctx.drawImage(scrim, 0, 0); ctx.restore(); }
  header(ctx, t); captions(ctx, t);
}

SHOT._missing = (g, u, dur, cue, t, s) => { sky(g, SKIES.night); txt(g, s.kind, CX, CY, 80, C.dim); };

window.renderAt = (t, q = 0.92) => { renderFrame(t); return ctx.canvas.toDataURL('image/jpeg', q); };
window.drawAt = (t) => { renderFrame(t); return true; }; // 只画不编码：给 smoke 测试用
window.shotAt = (kind, n = 0) => TL.shots.filter((s) => s.kind === kind)[n];
window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`40px ${F.hand}`, '就这？要变天了'),
    document.fonts.load(`600 40px ${F.serif}`, '你让它推荐一家馆子'),
    document.fonts.load(`500 40px ${F.loraI}`, 'That\'s it?'),
    document.fonts.load(`40px ${F.lora}`, 'THAT\'S IT?'),
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
