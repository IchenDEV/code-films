// 场景调度、合成，以及浏览器内预览。

let ctx, buf;
function init() {
  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d');
  buf = makeCanvas();
  initPost();
  initStars();
  for (const s of SCENES) if (s.init) s.init();
  for (const f of INITS) f();
}

function renderFrame(t) {
  const frame = Math.round(t * TL.FPS);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const active = SCENES.filter((s) => t >= s.a && t < s.b);
  for (const s of active) {
    const k = win(t, s.a, s.b, s.fi, s.fo);
    if (k <= 0.002) continue;
    if (active.length === 1 && k >= 0.999) { ctx.save(); s.draw(ctx, t - s.a, t); ctx.restore(); continue; }
    const b = buf.getContext('2d');
    b.save();
    b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.filter = 'none';
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    s.draw(b, t - s.a, t);
    b.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = k;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }
  drawCards(ctx, t);
  post(ctx, t, frame);
}

window.renderAt = (t, q = 0.94) => { renderFrame(t); return ctx.canvas.toDataURL('image/jpeg', q); };
window.renderPNG = (t) => { renderFrame(t); return ctx.canvas.toDataURL('image/png'); };

window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`40px ${SERIF}`, '我们规律之内'),
    document.fonts.load(`30px ${SANS}`, '你们问过火'),
    document.fonts.load(`20px ${MONO}`, 'softmax'),
    document.fonts.load(`italic 20px ${LATIN}`, 'Homo sapiens'),
  ]);
  init();
  return true;
})();

// —— 预览：film/index.html?preview ——
if (location.search.includes('preview')) {
  window.ready.then(() => {
    const ui = document.getElementById('ui');
    ui.hidden = false;
    const range = document.getElementById('t'), label = document.getElementById('lab');
    const audio = document.getElementById('aud');
    range.max = TL.DURATION;
    let playing = false, t0 = 0, start = 0;
    const show = (t) => { renderFrame(t); range.value = t; label.textContent = t.toFixed(2) + 's'; };
    range.oninput = () => { start = +range.value; t0 = performance.now(); audio.currentTime = start; show(start); };
    document.getElementById('play').onclick = () => {
      playing = !playing;
      start = +range.value; t0 = performance.now();
      if (playing) { audio.currentTime = start; audio.play().catch(() => {}); loop(); } else audio.pause();
    };
    function loop() {
      if (!playing) return;
      const t = audio.paused ? start + (performance.now() - t0) / 1000 : audio.currentTime;
      show(Math.min(t, TL.DURATION - 0.01));
      requestAnimationFrame(loop);
    }
    show(+(new URLSearchParams(location.search).get('t') || 0));
  });
}
