// 合成：镜头调度与转场、关键词上的镜头冲击、逐字高亮字幕、竖屏常驻标题与进度条、出处，以及浏览器内预览。
let ctx, bufA, bufB, vign, grain, scrim;


// 进入某个镜头时用的转场 [类型, 时长]：whip 快速横甩，flash 白闪（大揭晓），zoom 推进，cut 硬切
// 与 tools/mix.py 的 TRTYPE 一致（转场音效跟着它）
const TR = {
  hook: ['whip', 0.3], title: ['flash', 0.35], evolution: ['whip', 0.3], ladder: ['zoom', 0.4], simon: ['whip', 0.3], context: ['whip', 0.3],
  coord: ['whip', 0.3], adhoc: ['whip', 0.3], evidence: ['whip', 0.3], maturity: ['whip', 0.3], pain: ['flash', 0.35],
  loop: ['flash', 0.35], firefight: ['whip', 0.3], leverage: ['zoom', 0.35], why: ['whip', 0.3], fixes: ['whip', 0.3], lead: ['whip', 0.3],
  noorg: ['whip', 0.3], skeleton: ['zoom', 0.35], attention: ['zoom', 0.4], purpose: ['flash', 0.4], finale: ['zoom', 0.45], endcard: ['flash', 0.4],
};

// 镜头冲击：每个关键词被念出时画面轻轻一“顶”，每句开头更轻地顶一下
let IMPACTS = [];
function initImpacts() {
  const ks = [];
  for (const s of TL.shots) for (const v of Object.values(s.k)) ks.push([v, 1]);
  for (const c of TL.caps) ks.push([c.a, 0.4]);
  IMPACTS = ks.sort((a, b) => a[0] - b[0]);
}
function punch(t) {
  let p = 0, sx = 0, sy = 0;
  for (const [ti, w] of IMPACTS) {
    if (ti > t) break;
    const d = t - ti;
    if (d < 0.45) {
      const k = Math.pow(1 - d / 0.45, 2) * w;
      p = Math.max(p, k);
      if (w >= 1 && d < 0.18) { sx += (rand(ti * 100, 1) - 0.5) * 9 * (1 - d / 0.18); sy += (rand(ti * 100, 2) - 0.5) * 9 * (1 - d / 0.18); }
    }
  }
  return { s: 1 + 0.028 * p, sx, sy };
}

function init() {
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  ctx = cv.getContext('2d');
  bufA = makeCanvas(); bufB = makeCanvas();
  vign = makeCanvas();
  const v = vign.getContext('2d'), gr = v.createRadialGradient(CX, CY, Math.min(W, H) * 0.45, CX, CY, Math.max(W, H) * 0.8);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, C.vignette);
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
  // 静态颗粒：消除暗部色带；不逐帧变化（逐帧噪点会让码率暴涨）
  grain = makeCanvas(256, 256);
  const d = grain.getContext('2d'), img = d.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const n = rand(i, 9) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
  d.putImageData(img, 0, 0);
  // 字幕与标题底下的压暗（亮色主题里是提亮）：颜色取主题的 scrimRGB；亮色主题压得浅一些
  const S = (a) => rgba(C.scrimRGB, a * (C.dark ? 1 : 0.85));
  scrim = makeCanvas();
  const s = scrim.getContext('2d');
  if (PORTRAIT) {
    const y0 = CAP.y - 190, y1 = CAP.y + 200;
    const sg = s.createLinearGradient(0, y0, 0, y1);
    sg.addColorStop(0, S(0)); sg.addColorStop(0.3, S(0.55)); sg.addColorStop(0.75, S(0.55)); sg.addColorStop(1, S(0));
    s.fillStyle = sg; s.fillRect(0, y0, W, y1 - y0);
    const tg = s.createLinearGradient(0, 0, 0, 600);
    tg.addColorStop(0, S(0.85)); tg.addColorStop(0.8, S(0.6)); tg.addColorStop(1, S(0));
    s.fillStyle = tg; s.fillRect(0, 0, W, 600);
  } else {
    const sg = s.createLinearGradient(0, H - 230, 0, H);
    sg.addColorStop(0, S(0)); sg.addColorStop(0.5, S(0.6)); sg.addColorStop(1, S(0.75));
    s.fillStyle = sg; s.fillRect(0, H - 230, W, 230);
    const tg = s.createLinearGradient(0, 0, 0, 110);
    tg.addColorStop(0, S(0.6)); tg.addColorStop(1, S(0));
    s.fillStyle = tg; s.fillRect(0, 0, W, 110);
  }
  initImpacts();
  for (const f of INITS) f();
}

// 镜头的上下文：镜头内时间 u、各句起点、关键词时刻（都相对镜头起点）
function shotCtx(s, t) {
  return {
    u: t - s.a, t, dur: s.b - s.a, n: s.lines.length, cut: TL.cut,
    line: (i) => (i < s.lines.length ? s.cues[s.lines[i]] - s.a : 1e9),
    has: (name) => name in s.k,
    k: (name, def = 1e9) => (name in s.k ? s.k[name] - s.a : def),
  };
}
function drawShot(g, s, t) {
  g.save();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  bg(g, t);
  g.translate(ST.cx, ST.cy); g.scale(Z, Z);
  (SHOT[s.kind] || SHOT._missing)(g, shotCtx(s, t), s);
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
  if (type === 'flash') {
    drawShot(g, t < B.a ? A : B, t);
    g.fillStyle = rgba(C.flash, Math.pow(1 - Math.abs(k - 0.5) * 2, 1.4) * 0.55); g.fillRect(0, 0, W, H);
    return;
  }
  drawShot(bufA.getContext('2d'), A, t);
  drawShot(bufB.getContext('2d'), B, t);
  if (type === 'whip') {
    // 横甩：旧画面向左甩出、新画面从右甩进，中段带运动模糊
    const e = inOutQuint(k), blur = Math.sin(k * Math.PI) * 18;
    g.save(); g.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none';
    g.drawImage(bufA, -e * W, 0); g.drawImage(bufB, (1 - e) * W, 0);
    g.restore();
  } else if (type === 'zoom') {
    const put = (buf, a, sc) => { if (a <= 0.003) return; g.save(); g.globalAlpha = a; g.translate(CX, CY); g.scale(sc, sc); g.drawImage(buf, -CX, -CY); g.restore(); };
    put(bufA, 1, 1 + 0.6 * inCubic(k)); put(bufB, ease(k, 0.25, 0.85), 0.8 + 0.2 * outCubic(k));
  } else {
    drawShot(g, t < B.a ? A : B, t);
  }
}
const inOutQuint = (k) => (k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2);

// —— 字幕：逐字（中文）/ 逐词（英文）高亮，关键词念到时变金色 ——
const CAP = PORTRAIT ? { y: 1400, size: ZH ? 64 : 56, maxW: 940, lh: 1.32 } : { y: H - 92, size: ZH ? 52 : 46, maxW: 1640, lh: 1.25 };
function capUnits(g, c) {
  // 中文按字、英文按词；每个单位带上它在原文里的位置和被念出的时刻
  const s = c.text;
  if (ZH) return [...s].map((ch, i) => ({ s: ch, i, t: c.ct[i] ?? c.a }));
  const units = [];
  const re = /\S+\s*/g;
  let m;
  while ((m = re.exec(s))) units.push({ s: m[0], i: m.index, t: c.ct[m.index] ?? c.a });
  return units;
}
function layoutCap(g, units, maxW) {
  // 一行放得下就一行；放不下就分成 n 行，断点尽量落在等分处，中文优先在标点后断开；哪一行超宽就多分一行重排
  const ws = units.map((u) => g.measureText(u.s).width), total = ws.reduce((a, b) => a + b, 0);
  if (total <= maxW) return [units];
  const cum = []; let acc = 0; for (const w of ws) cum.push((acc += w));
  const widthOf = (a, b) => cum[b - 1] - (a ? cum[a - 1] : 0);
  for (let n = Math.ceil(total / maxW); n <= units.length; n++) {
    const breaks = [];
    let from = 0;
    for (let k = 1; k < n; k++) {
      const goal = (total * k) / n;
      let best = -1, bd = 1e9;
      for (let i = from; i < units.length - 1; i++) {
        if (widthOf(from, i + 1) > maxW) break;
        // 优先断在标点后面；不在“——”中间、不在后引号和标点前面断；英文词、数字不拆开
        const punct = /[，。；：？！、”]/.test(units[i].s) || (units[i].s === '—' && units[i - 1]?.s === '—');
        const glue = /^[，。；：？！、”—]/.test(units[i + 1].s) || (units[i].s === '—' && units[i + 1].s === '—') || /^[“《]/.test(units[i].s)
          || (/[A-Za-z0-9]$/.test(units[i].s) && /^[A-Za-z0-9]/.test(units[i + 1].s));
        const d = Math.abs(cum[i] - goal) - (punct ? maxW * 0.4 : 0) + (glue ? 1e6 : 0);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) best = Math.min(units.length - 2, from);
      breaks.push(best + 1); from = best + 1;
    }
    const lines = []; let a = 0;
    for (const b of [...breaks, units.length]) { if (b > a) lines.push(units.slice(a, b)); a = b; }
    if (lines.every((l) => l.reduce((w, u) => w + g.measureText(u.s).width, 0) <= maxW)) return lines;
  }
  return [units];
}
function captions(g, t) {
  TL.caps.forEach((c, i) => {
    // 下一句紧接着开始时直接换句（交叉淡化时两行字会叠在一起）；后面有停顿时才淡出
    const next = TL.caps[i + 1], swap = next && next.a - c.b < 0.2;
    if (t < c.a || t >= c.b + (swap ? 0 : 0.01)) return;
    const a = (c.a < 0.05 ? 1 : ease(t, c.a, c.a + 0.08)) * (swap ? 1 : 1 - ease(t, c.b - 0.15, c.b));
    if (a <= 0.003) return;
    g.save();
    setFont(g, CAP.size, ZH ? F.sans : F.grot, ZH ? '900' : '700');
    g.textBaseline = 'middle'; g.textAlign = 'left';
    const units = capUnits(g, c);
    const lines = layoutCap(g, units, CAP.maxW);
    const lh = CAP.size * CAP.lh;
    const y0 = CAP.y - ((lines.length - 1) * lh) / 2;
    const isKeyAt = (u) => (c.kr ?? []).some(([x, y]) => u.i < y && u.i + u.s.trimEnd().length > x);
    lines.forEach((ln, li) => {
      const wsum = ln.reduce((s, u) => s + g.measureText(u.s).width, 0);
      let x = CX - wsum / 2;
      const y = y0 + li * lh;
      for (const u of ln) {
        const uw = g.measureText(u.s).width;
        const said = t >= u.t - 0.03;
        const fresh = said ? clamp(1 - (t - u.t) / 0.25) : 0;
        const isKey = isKeyAt(u);
        g.globalAlpha = a;
        g.lineJoin = 'round'; g.lineWidth = CAP.size * 0.16; g.strokeStyle = C.capStroke;
        g.save();
        if (fresh > 0) { g.translate(x + uw / 2, y); g.scale(1 + 0.12 * fresh, 1 + 0.12 * fresh); g.translate(-(x + uw / 2), -y); }
        g.strokeText(u.s, x, y);
        g.fillStyle = said ? (isKey ? C.key : C.ink) : C.capDim;
        g.fillText(u.s, x, y);
        g.restore();
        x += uw;
      }
    });
    g.restore();
  });
}
// —— 竖屏常驻标题：从第一帧就在（钩子 + 数字），中途划进来的人也知道在看什么 ——
function header(g, t) {
  const end = TL.shots.find((s) => s.kind === 'endcard');
  const a = 1 - ease(t, end.a - 0.3, end.a + 0.2);
  if (a <= 0.004) return;
  g.save(); g.globalAlpha = a;
  const [l1, l2] = TL.txt.header;
  if (PORTRAIT) {
    txt(g, l1, CX, 372, 70, C.ink, { weight: '900', maxW: 980, stroke: 10 });
    txt(g, l2, CX, 448, 38, C.key, { weight: '800', maxW: 980, stroke: 7 });
    txt(g, T(TL.txt.source), CX, 500, 22, C.dim, { weight: '500', maxW: 980 });
    // 进度条：章节刻度 + 已播放部分
    const x0 = 90, x1 = W - 90, y = 532, total = end.a;
    g.fillStyle = C.track; rr(g, x0, y - 3, x1 - x0, 6, 3); g.fill();
    g.fillStyle = C.warm; rr(g, x0, y - 3, (x1 - x0) * clamp(t / total), 6, 3); g.fill();
    for (const ac of TL.acts) { if (ac.a <= 0 || ac.a >= total) continue; g.fillStyle = rgba(C.scrimRGB, 0.95); g.fillRect(x0 + (x1 - x0) * (ac.a / total) - 2, y - 5, 4, 10); }
  } else {
    txt(g, T(TL.txt.source), 60, 48, 22, C.dim, { align: 'left', weight: '500' });
    // 横屏右上：当前章节
    const ac = TL.acts.find((x) => t >= x.a && t < x.b) ?? TL.acts.at(-1);
    const name = TL.txt.chapters[ac.name] ?? '';
    if (name) {
      const k = ease(t, ac.a, ac.a + 0.3);
      chip(g, name, W - 60, 48, 24, '#1a1208', rgba(C.warmRGB, 0.9), { align: 'right', alpha: k, weight: '800' });
    }
  }
  g.restore();
}

function renderFrame(t) {
  const p = punch(t);
  ctx.save();
  ctx.translate(ST.cx + p.sx, ST.cy + p.sy); ctx.scale(p.s, p.s); ctx.translate(-ST.cx, -ST.cy);
  composite(t);
  ctx.restore();
  ctx.drawImage(vign, 0, 0);
  ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.drawImage(scrim, 0, 0);
  header(ctx, t); captions(ctx, t);
}

SHOT._missing = (g, c, s) => { txt(g, s.kind, 0, 0, 80, C.dim); };

window.renderAt = (t, q = 0.92) => { renderFrame(t); return ctx.canvas.toDataURL('image/jpeg', q); };
window.drawAt = (t) => { renderFrame(t); return true; }; // 只画不编码：给 smoke 测试用
window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`900 40px ${F.sans}`, '写程序治理组织'), document.fonts.load(`700 40px ${F.sans}`, '个人'), document.fonts.load(`500 40px ${F.sans}`, '来源'),
    document.fonts.load(`900 40px ${F.serif}`, '管理行为'), document.fonts.load(`600 40px ${F.serif}`, '西蒙'),
    document.fonts.load(`700 40px ${F.grot}`, 'Agent 1947'), document.fonts.load(`500 40px ${F.grot}`, 'Simon'),
    document.fonts.load(`700 40px ${F.mono}`, 'PR'),
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
