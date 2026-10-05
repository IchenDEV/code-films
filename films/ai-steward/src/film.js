/* 白板手绘版《AI 越来越能干，人为什么越来越忙？》
   一块 3×2 的大白板，马克笔一格一格画下去；最后拉远，看到整张白板。
   所有画面时间锚定在旁白句子 / 分句上（TL 由实测配音生成）。 */
(() => {
  const TL = window.TL;
  const tl = gsap.timeline({ paused: true });
  const L = (id) => TL.lines[id].start;
  const LE = (id) => TL.lines[id].end;
  const C = (id, k) => TL.lines[id].cl[Math.min(k, TL.lines[id].cl.length - 1)];
  const A = (id) => TL.acts[id].start;
  const AE = (id) => TL.acts[id].end;
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('#board'), cam = $('#cam'), world = $('#world');
  const rc = rough.svg(svg);
  const SFX = (window.__SFX = []);
  const sfx = (t, type, d = 0) => SFX.push({ t: +t.toFixed(3), type, d: +d.toFixed(3) });

  const INK = '#23262d', BLUE = '#2463a6', GREEN = '#2c9a5a', ORANGE = '#e8772e', RED = '#d43f3a', GREY = '#8a8f98', HL = '#ffd640';
  let seed = 3;
  const ro = (o) => Object.assign({ roughness: 1.35, bowing: 1.1, stroke: INK, strokeWidth: 3.2, seed: seed++ }, o || {});

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  const LAYER = { base: el('g'), main: el('g'), top: el('g') };
  const penLayer = el('g');

  // 一个放置在 (x,y) 的组；内部用局部坐标画
  function G(x, y, parent) { const g = el('g', {}, parent || LAYER.main); gsap.set(g, { x, y }); return g; }
  const add = (g, node) => { g.appendChild(node); return node; };
  const R = {
    rect: (g, x, y, w, h, o) => add(g, rc.rectangle(x, y, w, h, ro(o))),
    circ: (g, x, y, d, o) => add(g, rc.circle(x, y, d, ro(o))),
    ell: (g, x, y, w, h, o) => add(g, rc.ellipse(x, y, w, h, ro(o))),
    line: (g, x1, y1, x2, y2, o) => add(g, rc.line(x1, y1, x2, y2, ro(o))),
    curve: (g, pts, o) => add(g, rc.curve(pts, ro(o))),
    poly: (g, pts, o) => add(g, rc.polygon(pts, ro(o))),
    lin: (g, pts, o) => add(g, rc.linearPath(pts, ro(o))),
    arc: (g, x, y, w, h, a0, a1, o) => add(g, rc.arc(x, y, w, h, a0, a1, false, ro(o))),
    path: (g, d, o) => add(g, rc.path(d, ro(o))),
  };
  function head(g, x, y, ang, len, o) {
    R.line(g, x, y, x - len * Math.cos(ang - 0.45), y - len * Math.sin(ang - 0.45), o);
    R.line(g, x, y, x - len * Math.cos(ang + 0.45), y - len * Math.sin(ang + 0.45), o);
  }
  function arrow(g, x1, y1, x2, y2, o) {
    R.line(g, x1, y1, x2, y2, o);
    head(g, x2, y2, Math.atan2(y2 - y1, x2 - x1), (o && o.head) || 18, o);
  }
  function carrow(g, pts, o) {
    R.curve(g, pts, o);
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    head(g, b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), (o && o.head) || 18, o);
  }

  // ---------- text (hand lettering, revealed left → right) ----------
  let clipN = 0;
  function textW(s, size) { let w = 0; for (const ch of s) w += /[\x00-\xff]/.test(ch) ? size * 0.52 : size * 1.0; return w; }
  function T(g, x, y, s, o) {
    o = Object.assign({ size: 40, fill: INK, anchor: 'start' }, o || {});
    const w = textW(s, o.size) + o.size * 0.3;
    const x0 = o.anchor === 'middle' ? x - w / 2 : x;
    const id = 'c' + clipN++;
    const cp = el('clipPath', { id }, g);
    const r = el('rect', { x: x0 - 6, y: y - o.size * 1.05, width: 0, height: o.size * 1.5 }, cp);
    const t = el('text', { x, y, 'font-size': o.size, fill: o.fill, 'text-anchor': o.anchor, 'clip-path': `url(#${id})` }, g);
    t.textContent = s;
    return { t, r, w: w + 12, x0, y, size: o.size, g };
  }
  function write(tx, t, d, pen = true) {
    d = d || Math.max(0.35, Math.min(1.6, tx.w / 420));
    tl.to(tx.r, { attr: { width: tx.w }, duration: d, ease: 'none' }, t);
    if (pen) penWrite(tx, t, d);
    sfx(t, 'write', d);
    return t + d;
  }

  // ---------- drawing (stroke-on) ----------
  function prep(g) {
    const ps = [...g.querySelectorAll('path')];
    ps.forEach((p) => {
      const stroke = p.getAttribute('stroke');
      if (!stroke || stroke === 'none') { gsap.set(p, { opacity: 0 }); p._fill = true; p._len = 0; return; }
      const len = p.getTotalLength() + 1;
      p._len = len;
      gsap.set(p, { strokeDasharray: len + ' ' + len, strokeDashoffset: len });
    });
    g._tx = [...g.querySelectorAll('text')].filter((t) => !t.getAttribute('clip-path'));
    g._tx.forEach((t) => gsap.set(t, { opacity: 0 }));
    return ps;
  }
  function draw(g, t, d, pen = true) {
    const ps = g._ps || (g._ps = prep(g));
    const strokes = ps.filter((p) => !p._fill);
    const tot = strokes.reduce((a, p) => a + p._len, 0) || 1;
    let c = t;
    strokes.forEach((p) => {
      const dd = (d * p._len) / tot;
      tl.to(p, { strokeDashoffset: 0, duration: dd, ease: 'none' }, c);
      c += dd;
    });
    ps.filter((p) => p._fill).forEach((p) => tl.to(p, { opacity: 1, duration: 0.3 }, t + d * 0.6));
    (g._tx || []).forEach((x) => tl.to(x, { opacity: 1, duration: 0.25 }, t + d * 0.7));
    if (pen) penDraw(strokes, t, d, tot);
    sfx(t, 'draw', d);
    return t + d;
  }
  function pop(g, t, d = 0.45, s = 0) {
    gsap.set(g, { scale: s, opacity: 0, transformOrigin: '50% 50%' });
    (g._ps || (g._ps = prep(g))).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 }));
    (g._tx || []).forEach((x) => gsap.set(x, { opacity: 1 }));
    tl.to(g, { opacity: 1, duration: 0.08 }, t);
    [...g.querySelectorAll('rect')].forEach((r) => { if (r.parentNode.tagName === 'clipPath') gsap.set(r, { attr: { width: 4000 } }); });
    tl.to(g, { scale: 1, duration: d, ease: 'back.out(2)' }, t);
    sfx(t, 'pop');
    return t + d;
  }
  function show(g, t, d = 0.4) { (g._ps || (g._ps = prep(g))).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); (g._tx || []).forEach((x) => gsap.set(x, { opacity: 1 })); gsap.set(g, { opacity: 0 }); tl.to(g, { opacity: 1, duration: d }, t); return t + d; }
  function fade(g, t, a = 0, d = 0.5) { tl.to(g, { opacity: a, duration: d }, t); }
  function erase(g, t, d = 0.45) { tl.to(g, { opacity: 0, duration: d, ease: 'power1.in' }, t); sfx(t, 'erase', d); }
  function wiggle(g, t, n = 3, a = 4) {
    for (let i = 0; i < n; i++) tl.to(g, { rotation: i % 2 ? -a : a, duration: 0.08, transformOrigin: '50% 50%' }, t + i * 0.08);
    tl.to(g, { rotation: 0, duration: 0.1 }, t + n * 0.08);
  }

  // ---------- marker pen that follows the stroke ----------
  const pen = el('g', {}, penLayer);
  pen.innerHTML = `
    <g transform="rotate(-38)">
      <rect x="2" y="-11" width="36" height="22" rx="4" fill="#2c3340"/>
      <rect x="36" y="-14" width="120" height="28" rx="8" fill="#e9e6df" stroke="#9aa0a8" stroke-width="2"/>
      <rect x="60" y="-14" width="48" height="28" fill="#2463a6"/>
      <rect x="152" y="-12" width="46" height="24" rx="7" fill="#2c3340"/>
      <path d="M2,-6 L-8,0 L2,6 Z" fill="#23262d"/>
    </g>`;
  gsap.set(pen, { x: 960, y: 540, opacity: 0 });
  const PEN = [];
  function penDraw(strokes, t, d, tot) {
    const pts = [];
    let c = t;
    strokes.forEach((p) => {
      const dd = (d * p._len) / tot;
      const n = Math.max(2, Math.min(8, Math.round(p._len / 70)));
      const m = p.getCTM();
      for (let i = 0; i <= n; i++) {
        const q = p.getPointAtLength((p._len - 1) * (i / n));
        const s = svg.createSVGPoint(); s.x = q.x; s.y = q.y;
        const w = s.matrixTransform(m);
        pts.push({ x: w.x, y: w.y, t: c + (dd * i) / n });
      }
      c += dd;
    });
    if (pts.length) PEN.push({ t0: t, t1: t + d, pts });
  }
  function penWrite(tx, t, d) {
    const m = tx.t.getCTM ? null : null;
    const gx = gsap.getProperty(tx.g, 'x'), gy = gsap.getProperty(tx.g, 'y');
    const pts = [];
    const n = Math.max(3, Math.round(tx.w / 45));
    for (let i = 0; i <= n; i++) pts.push({ x: gx + tx.x0 + (tx.w * i) / n, y: gy + tx.y - tx.size * (i % 2 ? 0.55 : 0.2), t: t + (d * i) / n });
    PEN.push({ t0: t, t1: t + d, pts });
  }
  function penFinalize() {
    PEN.sort((a, b) => a.t0 - b.t0);
    let lastEnd = -10, vis = false;
    const segs = [];
    PEN.forEach((s) => { if (s.t0 >= lastEnd - 0.01) { segs.push(s); lastEnd = s.t1; } });
    segs.forEach((s, i) => {
      const p0 = s.pts[0];
      const prev = segs[i - 1];
      if (!prev || s.t0 - prev.t1 > 1.0) {
        tl.set(pen, { x: p0.x + 40, y: p0.y + 30 }, Math.max(0, s.t0 - 0.3));
        tl.to(pen, { opacity: 1, x: p0.x, y: p0.y, duration: 0.28, ease: 'power2.out' }, Math.max(0, s.t0 - 0.28));
      } else {
        tl.to(pen, { x: p0.x, y: p0.y, duration: Math.max(0.05, s.t0 - prev.t1), ease: 'power1.inOut' }, prev.t1);
      }
      for (let k = 1; k < s.pts.length; k++) {
        const a = s.pts[k - 1], b = s.pts[k];
        tl.to(pen, { x: b.x, y: b.y, duration: Math.max(0.01, b.t - a.t), ease: 'none' }, a.t);
      }
      const next = segs[i + 1];
      if (!next || next.t0 - s.t1 > 1.0) tl.to(pen, { opacity: 0, x: '+=50', y: '+=40', duration: 0.3, ease: 'power1.in' }, s.t1 + 0.05);
    });
  }

  // ---------- camera ----------
  function camSet(cx, cy, s) { gsap.set(cam, { scale: s }); gsap.set(world, { x: 960 - cx, y: 540 - cy }); }
  function camTo(t, cx, cy, s, d, ease = 'power2.inOut') {
    tl.to(cam, { scale: s, duration: d, ease }, t);
    tl.to(world, { x: 960 - cx, y: 540 - cy, duration: d, ease }, t);
    sfx(t, 'whoosh', d);
  }

  // =====================================================================
  // ICONS (局部坐标，k = 缩放)
  // =====================================================================
  function iWin(g, cx, cy, w, h, o = {}) {
    const x = cx - w / 2, y = cy - h / 2;
    R.rect(g, x, y, w, h, { strokeWidth: o.sw || 2.6, fill: '#fffdf8', fillStyle: 'solid', ...o.ro });
    R.line(g, x, y + h * 0.22, x + w, y + h * 0.22, { strokeWidth: 1.8 });
    R.circ(g, x + w * 0.09, y + h * 0.11, h * 0.09, { strokeWidth: 1.5, fill: o.dot || GREEN, fillStyle: 'solid' });
    if (!o.bare) {
      R.line(g, x + w * 0.12, y + h * 0.45, x + w * 0.78, y + h * 0.45, { strokeWidth: 2, stroke: GREY });
      R.line(g, x + w * 0.12, y + h * 0.66, x + w * 0.6, y + h * 0.66, { strokeWidth: 2, stroke: GREY });
      if (h > 70) R.line(g, x + w * 0.12, y + h * 0.84, x + w * 0.7, y + h * 0.84, { strokeWidth: 2, stroke: GREY });
    }
  }
  function iPerson(g, k = 1, o = {}) {
    R.circ(g, 0, -120 * k, 64 * k, { strokeWidth: 3.4, fill: '#fffdf8', fillStyle: 'solid' });
    R.line(g, 0, -88 * k, 0, 10 * k, { strokeWidth: 3.6 });
    if (o.arms === 'up') { R.lin(g, [[-62 * k, -96 * k], [-34 * k, -54 * k], [0, -60 * k]], { strokeWidth: 3.4 }); R.lin(g, [[62 * k, -98 * k], [34 * k, -54 * k], [0, -60 * k]], { strokeWidth: 3.4 }); }
    else if (o.arms === 'point') { R.lin(g, [[-44 * k, -10 * k], [0, -56 * k]], { strokeWidth: 3.4 }); R.lin(g, [[70 * k, -70 * k], [0, -56 * k]], { strokeWidth: 3.4 }); }
    else { R.lin(g, [[-44 * k, -6 * k], [0, -58 * k], [44 * k, -6 * k]], { strokeWidth: 3.4 }); }
    R.lin(g, [[-36 * k, 90 * k], [0, 10 * k], [36 * k, 90 * k]], { strokeWidth: 3.6 });
  }
  function iDesk(g, k = 1) {
    R.line(g, -150 * k, 30 * k, 150 * k, 30 * k, { strokeWidth: 3.4 });
    R.line(g, -120 * k, 30 * k, -120 * k, 96 * k, { strokeWidth: 3 });
    R.line(g, 120 * k, 30 * k, 120 * k, 96 * k, { strokeWidth: 3 });
    R.poly(g, [[-70 * k, 30 * k], [-50 * k, -20 * k], [40 * k, -20 * k], [20 * k, 30 * k]], { strokeWidth: 2.6, fill: '#dfe7f2', fillStyle: 'hachure', hachureGap: 7 });
  }
  function iButler(g, k = 1) {
    R.circ(g, 0, -150 * k, 74 * k, { strokeWidth: 3.4, fill: '#fffdf8', fillStyle: 'solid' });
    R.curve(g, [[-34 * k, -164 * k], [-12 * k, -190 * k], [24 * k, -186 * k], [36 * k, -160 * k]], { strokeWidth: 3.6 }); // 发型
    R.line(g, -12 * k, -148 * k, -8 * k, -144 * k, { strokeWidth: 3 });
    R.line(g, 12 * k, -148 * k, 16 * k, -144 * k, { strokeWidth: 3 });
    R.arc(g, 2 * k, -134 * k, 24 * k, 14 * k, 0.2, Math.PI - 0.2, { strokeWidth: 2.4 });
    R.poly(g, [[-46 * k, -96 * k], [46 * k, -96 * k], [58 * k, 70 * k], [10 * k, 40 * k], [-10 * k, 40 * k], [-58 * k, 70 * k]], { strokeWidth: 3.2, fill: '#3a4150', fillStyle: 'hachure', hachureGap: 9, fillWeight: 1.6 });
    R.poly(g, [[-18 * k, -96 * k], [18 * k, -96 * k], [0, -30 * k]], { strokeWidth: 2.4, fill: '#fffdf8', fillStyle: 'solid' });
    R.poly(g, [[0, -100 * k], [-24 * k, -112 * k], [-24 * k, -88 * k]], { strokeWidth: 2.4, fill: ORANGE, fillStyle: 'solid' });
    R.poly(g, [[0, -100 * k], [24 * k, -112 * k], [24 * k, -88 * k]], { strokeWidth: 2.4, fill: ORANGE, fillStyle: 'solid' });
    R.lin(g, [[46 * k, -86 * k], [92 * k, -54 * k], [120 * k, -70 * k]], { strokeWidth: 3.2 }); // 托盘手
    R.ell(g, 128 * k, -76 * k, 96 * k, 18 * k, { strokeWidth: 2.8, fill: '#e5e1d8', fillStyle: 'solid' });
    R.lin(g, [[-46 * k, -86 * k], [-82 * k, -30 * k], [-64 * k, 6 * k]], { strokeWidth: 3.2 });
    R.lin(g, [[-26 * k, 50 * k], [-30 * k, 120 * k]], { strokeWidth: 3.4 });
    R.lin(g, [[26 * k, 50 * k], [30 * k, 120 * k]], { strokeWidth: 3.4 });
  }
  function iEnvelope(g, k = 1, col = BLUE) {
    R.rect(g, -50 * k, -34 * k, 100 * k, 68 * k, { stroke: col, strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    R.lin(g, [[-50 * k, -34 * k], [0, 6 * k], [50 * k, -34 * k]], { stroke: col, strokeWidth: 3 });
  }
  function iAngry(g, k = 1) {
    R.rect(g, -34 * k, -56 * k, 68 * k, 112 * k, { stroke: INK, strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    R.circ(g, 0, -4 * k, 42 * k, { stroke: RED, strokeWidth: 2.6 });
    R.line(g, -12 * k, -14 * k, -4 * k, -10 * k, { stroke: RED, strokeWidth: 2.4 });
    R.line(g, 12 * k, -14 * k, 4 * k, -10 * k, { stroke: RED, strokeWidth: 2.4 });
    R.arc(g, 0, 10 * k, 18 * k, 10 * k, Math.PI + 0.3, 2 * Math.PI - 0.3, { stroke: RED, strokeWidth: 2.4 });
  }
  function iChat(g, k = 1) {
    R.path(g, `M${-56 * k},${-34 * k} h${88 * k} v${50 * k} h${-56 * k} l${-16 * k},${18 * k} v${-18 * k} h${-16 * k} z`, { stroke: GREEN, strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    R.path(g, `M${-8 * k},${-6 * k} h${64 * k} v${44 * k} h${-14 * k} v${14 * k} l${-14 * k},${-14 * k} h${-36 * k} z`, { stroke: GREEN, strokeWidth: 3, fill: '#eef7f1', fillStyle: 'solid' });
    const t = el('text', { x: 24 * k, y: 26 * k, 'font-size': 34 * k, fill: GREEN, 'text-anchor': 'middle' }, g); t.textContent = '@';
  }
  function iAgent(g, k = 1, col = '#6b4fbb') {
    const pts = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; pts.push([46 * k * Math.cos(a), 46 * k * Math.sin(a)]); }
    R.poly(g, pts, { stroke: col, strokeWidth: 3, fill: '#f3effb', fillStyle: 'solid' });
    R.circ(g, -12 * k, -4 * k, 9 * k, { stroke: col, fill: col, fillStyle: 'solid', strokeWidth: 1.5 });
    R.circ(g, 12 * k, -4 * k, 9 * k, { stroke: col, fill: col, fillStyle: 'solid', strokeWidth: 1.5 });
    R.line(g, -10 * k, 16 * k, 10 * k, 16 * k, { stroke: col, strokeWidth: 2.4 });
  }
  function iCheck(g, k = 1, col = GREEN) {
    R.rect(g, -36 * k, -36 * k, 72 * k, 72 * k, { stroke: INK, strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    R.lin(g, [[-20 * k, 0], [-4 * k, 18 * k], [26 * k, -24 * k]], { stroke: col, strokeWidth: 5 });
  }
  function iClock(g, k = 1, col = INK) {
    R.circ(g, 0, 0, 84 * k, { stroke: col, strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    R.line(g, 0, 0, 0, -26 * k, { stroke: col, strokeWidth: 3 });
    R.line(g, 0, 0, 20 * k, 8 * k, { stroke: col, strokeWidth: 3 });
  }
  function iBulb(g, k = 1) {
    R.path(g, `M${-38 * k},${-10 * k} C${-38 * k},${-70 * k} ${38 * k},${-70 * k} ${38 * k},${-10 * k} C${38 * k},${14 * k} ${18 * k},${24 * k} ${16 * k},${44 * k} L${-16 * k},${44 * k} C${-18 * k},${24 * k} ${-38 * k},${14 * k} ${-38 * k},${-10 * k} Z`, { stroke: INK, strokeWidth: 3.2, fill: '#fff3c4', fillStyle: 'hachure', hachureGap: 8, fillWeight: 1.4 });
    R.line(g, -14 * k, 56 * k, 14 * k, 56 * k, { strokeWidth: 3 });
    R.line(g, -10 * k, 66 * k, 10 * k, 66 * k, { strokeWidth: 3 });
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; R.line(g, Math.cos(a) * 62 * k, -20 * k + Math.sin(a) * 62 * k, Math.cos(a) * 84 * k, -20 * k + Math.sin(a) * 84 * k, { stroke: ORANGE, strokeWidth: 3 }); }
  }
  function iHourglass(g, k = 1) {
    R.line(g, -22 * k, -32 * k, 22 * k, -32 * k, { strokeWidth: 3 });
    R.line(g, -22 * k, 32 * k, 22 * k, 32 * k, { strokeWidth: 3 });
    R.lin(g, [[-18 * k, -32 * k], [0, 0], [-18 * k, 32 * k]], { strokeWidth: 2.6 });
    R.lin(g, [[18 * k, -32 * k], [0, 0], [18 * k, 32 * k]], { strokeWidth: 2.6 });
    R.poly(g, [[-10 * k, 26 * k], [10 * k, 26 * k], [0, 12 * k]], { stroke: ORANGE, strokeWidth: 1.5, fill: ORANGE, fillStyle: 'solid' });
  }
  function iSnail(g, k = 1) {
    const sp = []; for (let i = 0; i <= 40; i++) { const a = i * 0.42, r = 4 + i * 1.25; sp.push([r * Math.cos(a) * k, (-34 + r * Math.sin(a)) * k]); }
    R.curve(g, sp, { stroke: ORANGE, strokeWidth: 3.2 });
    R.path(g, `M${-70 * k},${18 * k} C${-40 * k},${24 * k} ${40 * k},${24 * k} ${70 * k},${16 * k} C${86 * k},${12 * k} ${92 * k},${-10 * k} ${80 * k},${-18 * k}`, { stroke: INK, strokeWidth: 3.2 });
    R.line(g, 80 * k, -18 * k, 76 * k, -46 * k, { strokeWidth: 2.6 });
    R.line(g, 86 * k, -16 * k, 96 * k, -42 * k, { strokeWidth: 2.6 });
  }
  function iFlag(g, k = 1) {
    R.lin(g, [[-90 * k, 60 * k], [-20 * k, -10 * k], [20 * k, 20 * k], [90 * k, 60 * k]], { strokeWidth: 3 });
    R.line(g, -20 * k, -10 * k, -20 * k, -96 * k, { strokeWidth: 3.2 });
    R.poly(g, [[-20 * k, -96 * k], [40 * k, -80 * k], [-20 * k, -62 * k]], { stroke: RED, strokeWidth: 2.6, fill: RED, fillStyle: 'hachure', hachureGap: 6 });
  }
  function iScale(g, k = 1) {
    R.line(g, 0, -70 * k, 0, 60 * k, { strokeWidth: 3.2 });
    R.line(g, -40 * k, 60 * k, 40 * k, 60 * k, { strokeWidth: 3.2 });
    R.line(g, -80 * k, -56 * k, 80 * k, -70 * k, { strokeWidth: 3.2 });
    R.lin(g, [[-80 * k, -56 * k], [-100 * k, -6 * k], [-60 * k, -6 * k], [-80 * k, -56 * k]], { stroke: BLUE, strokeWidth: 2.6 });
    R.lin(g, [[80 * k, -70 * k], [60 * k, -20 * k], [100 * k, -20 * k], [80 * k, -70 * k]], { stroke: ORANGE, strokeWidth: 2.6 });
  }
  function iStamp(g, k = 1) {
    R.ell(g, 0, -64 * k, 46 * k, 40 * k, { strokeWidth: 3, fill: '#c9a27a', fillStyle: 'hachure', hachureGap: 7 });
    R.rect(g, -10 * k, -46 * k, 20 * k, 40 * k, { strokeWidth: 3 });
    R.rect(g, -50 * k, -6 * k, 100 * k, 34 * k, { strokeWidth: 3, fill: ORANGE, fillStyle: 'hachure', hachureGap: 7 });
  }
  function iMonitor(g, k = 1) {
    R.rect(g, -110 * k, -80 * k, 220 * k, 140 * k, { strokeWidth: 3.2, fill: '#fffdf8', fillStyle: 'solid' });
    R.line(g, 0, 60 * k, 0, 92 * k, { strokeWidth: 3.2 });
    R.line(g, -50 * k, 94 * k, 50 * k, 94 * k, { strokeWidth: 3.2 });
    R.lin(g, [[-70 * k, -40 * k], [-46 * k, -24 * k], [-70 * k, -8 * k]], { strokeWidth: 2.8, stroke: GREY });
    R.line(g, -36 * k, -8 * k, 10 * k, -8 * k, { strokeWidth: 2.8, stroke: GREY });
  }
  function iBox(g, k = 1) {
    R.poly(g, [[-60 * k, -20 * k], [0, -46 * k], [60 * k, -20 * k], [0, 6 * k]], { strokeWidth: 3, fill: '#f1dcb8', fillStyle: 'solid' });
    R.poly(g, [[-60 * k, -20 * k], [0, 6 * k], [0, 70 * k], [-60 * k, 44 * k]], { strokeWidth: 3, fill: '#e6c695', fillStyle: 'solid' });
    R.poly(g, [[60 * k, -20 * k], [0, 6 * k], [0, 70 * k], [60 * k, 44 * k]], { strokeWidth: 3, fill: '#ddb57c', fillStyle: 'solid' });
    R.line(g, -30 * k, -33 * k, 30 * k, -7 * k, { stroke: BLUE, strokeWidth: 4 });
  }
  function iCompass(g, k = 1) {
    R.circ(g, 0, 0, 120 * k, { strokeWidth: 3.2, fill: '#fffdf8', fillStyle: 'solid' });
    R.poly(g, [[0, -46 * k], [12 * k, 0], [0, 10 * k], [-12 * k, 0]], { stroke: RED, strokeWidth: 2, fill: RED, fillStyle: 'solid' });
    R.poly(g, [[0, 46 * k], [12 * k, 0], [0, -10 * k], [-12 * k, 0]], { stroke: INK, strokeWidth: 2 });
    const t = el('text', { x: 0, y: -66 * k, 'font-size': 24 * k, fill: INK, 'text-anchor': 'middle' }, g); t.textContent = 'N';
  }
  function iPulse(g, w, col = GREEN) {
    R.lin(g, [[-w / 2, 0], [-w * 0.18, 0], [-w * 0.1, -36], [-w * 0.02, 34], [w * 0.06, -16], [w * 0.12, 0], [w / 2, 0]], { stroke: col, strokeWidth: 3.4 });
  }
  function iHook(g, k = 1, col = INK) {
    R.path(g, `M0,${-50 * k} L0,${16 * k} C0,${46 * k} ${-40 * k},${46 * k} ${-40 * k},${16 * k} L${-40 * k},${6 * k}`, { stroke: col, strokeWidth: 3.4 });
    R.line(g, -40 * k, 6 * k, -50 * k, 20 * k, { stroke: col, strokeWidth: 3 });
  }
  function ding(g, t, r = 60, col = ORANGE) {
    const d = el('g', {}, g);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; R.line(d, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r + 22), Math.sin(a) * (r + 22), { stroke: col, strokeWidth: 3 }); }
    draw(d, t, 0.25, false);
    tl.to(d, { opacity: 0, duration: 0.5 }, t + 0.7);
    sfx(t, 'ding');
  }
  function heading(cell, n, s, t) {
    const g = G(cell[0] + 90, cell[1] + 112);
    const num = el('g', {}, g);
    R.circ(num, 26, -14, 58, { stroke: BLUE, strokeWidth: 3 });
    const nt = el('text', { x: 26, y: 0, 'font-size': 38, fill: BLUE, 'text-anchor': 'middle' }, num); nt.textContent = n;
    const tx = T(g, 74, 0, s, { size: 46 });
    draw(num, t, 0.4);
    const e = write(tx, t + 0.4);
    const hl = el('g', {}, LAYER.base);
    gsap.set(hl, { x: cell[0] + 90, y: cell[1] + 112 });
    R.line(hl, 74, 14, 74 + tx.w - 10, 10, { stroke: HL, strokeWidth: 16, roughness: 0.8 });
    draw(hl, e, 0.4, false);
    return e;
  }
  function label(x, y, s, t, o = {}) { const g = G(x, y, o.layer); const tx = T(g, 0, 0, s, { size: o.size || 30, fill: o.fill || INK, anchor: o.anchor || 'middle' }); write(tx, t, o.d, o.pen !== false); return g; }

  // cells
  const CELL = { s1: [0, 0], s2: [1920, 0], s3: [3840, 0], s4: [3840, 1080], s5: [1920, 1080], s6: [0, 1080] };
  const P = (c, x, y) => [CELL[c][0] + x, CELL[c][1] + y];
  const CC = (c) => [CELL[c][0] + 960, CELL[c][1] + 540];

  // =====================================================================
  // OPEN — 白板上写下片名
  // =====================================================================
  camSet(...CC('s1'), 1);
  const ttl = $('#title');
  const tdiv = (cls, s) => { const d = document.createElement('div'); d.className = 'tl ' + cls; d.textContent = s; ttl.appendChild(d); return d; };
  const t1 = tdiv('t1', 'AI 越来越能干，'), t2 = tdiv('t2', '人为什么越来越忙？'), t3 = tdiv('t3', '概念演示 · 非产品实录');
  [t1, t2].forEach((d) => gsap.set(d, { clipPath: 'inset(0 100% 0 0)' }));
  gsap.set(t3, { opacity: 0 });
  tl.to(t1, { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'none' }, 0.2); sfx(0.2, 'write', 1.0);
  tl.to(t2, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'none' }, 1.2); sfx(1.2, 'write', 1.1);
  tl.to(t3, { opacity: 1, duration: 0.6 }, 2.2);
  tl.to(ttl, { opacity: 0, duration: 0.45 }, A('s1') - 0.25); sfx(A('s1') - 0.25, 'erase', 0.45);

  // =====================================================================
  // S1 执行者越来越多
  // =====================================================================
  {
    const c = 's1';
    heading(CELL[c], '1', '执行者越来越多', A('s1') + 0.05);
    // 一个会话，完成
    const w0 = G(...P(c, 960, 330)); iWin(w0, 0, 0, 300, 180);
    draw(w0, L('h1'), 0.9);
    const ck = G(...P(c, 1060, 360)); R.lin(ck, [[-30, 0], [-8, 24], [36, -30]], { stroke: GREEN, strokeWidth: 6 });
    draw(ck, LE('h1') - 0.15, 0.35);
    // 人，越来越忙
    const pg = G(...P(c, 960, 760)); iPerson(pg, 0.9, { arms: 'up' }); iDesk(pg, 0.9);
    draw(pg, L('h2') + 0.1, 1.3);
    const sw = G(...P(c, 1030, 620)); R.curve(sw, [[0, 0], [6, 12], [0, 22]], { stroke: BLUE, strokeWidth: 3 }); R.curve(sw, [[22, 10], [28, 22], [22, 32]], { stroke: BLUE, strokeWidth: 3 });
    draw(sw, C('h2', 1) + 0.4, 0.4, false);
    label(...P(c, 860, 600), '?!', C('h2', 1) + 0.9, { size: 46, fill: ORANGE });
    // 十个、五十个、一百个
    const ring = [];
    const R1 = [[560, 330], [1360, 330], [470, 520], [1450, 520], [560, 700], [1360, 700], [300, 300], [1620, 300], [260, 560], [1660, 560]];
    R1.forEach(([x, y], i) => { const g = G(...P(c, x, y)); iWin(g, 0, 0, 170, 100, { dot: i % 4 === 3 ? ORANGE : GREEN }); pop(g, C('h3', 0) + i * 0.06, 0.4); ring.push(g); });
    let sd = 41;
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const ring2 = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2, x = 960 + Math.cos(a) * (780 + rnd() * 90), y = 520 + Math.sin(a) * (380 + rnd() * 60);
      if (y < 170 || y > 900) continue;
      const g = G(...P(c, x, y)); iWin(g, 0, 0, 90, 56, { sw: 2, bare: true, dot: rnd() < 0.25 ? ORANGE : GREEN }); pop(g, C('h3', 1) + i * 0.02, 0.3); ring2.push(g);
    }
    for (let i = 0; i < 46; i++) {
      const x = 80 + rnd() * 1760, y = 190 + rnd() * 700;
      if (Math.abs(x - 960) < 560 && y > 220 && y < 860) continue;
      const g = G(...P(c, x, y)); iWin(g, 0, 0, 56, 36, { sw: 1.6, bare: true, dot: rnd() < 0.25 ? ORANGE : GREEN }); pop(g, C('h3', 2) + i * 0.015, 0.25);
    }
    const n10 = label(...P(c, 1560, 170), '10', C('h3', 0), { size: 54, fill: BLUE, pen: false, d: 0.3 });
    const n50 = label(...P(c, 1660, 170), '50', C('h3', 1), { size: 54, fill: BLUE, pen: false, d: 0.3 });
    const n100 = label(...P(c, 1790, 170), '100+', C('h3', 2), { size: 54, fill: RED, pen: false, d: 0.4 });
    [[1530, 1590, C('h3', 1) - 0.1], [1630, 1690, C('h3', 2) - 0.1]].forEach(([a, b, t]) => { const s = G(0, 0); R.line(s, a, 152, b, 140, { stroke: RED, strokeWidth: 4 }); draw(s, t, 0.2, false); });
    // 来回切换、复制、粘贴、追问、确认
    const acts = [['切换', 470, 520], ['复制', 1360, 330], ['粘贴', 560, 330], ['追问', 1450, 520], ['确认', 1360, 700]];
    acts.forEach(([s, x, y], i) => {
      const t = C('h4', i + 1);
      const g = G(...P(c, 0, 0));
      const sx = 960 + (x < 960 ? -60 : 60), sy = 640;
      carrow(g, [[sx, sy], [(sx + x) / 2, (sy + y) / 2 + 40], [x + (x < 960 ? 90 : -90), y + 30]], { stroke: ORANGE, strokeWidth: 3, head: 16 });
      draw(g, t - 0.05, 0.32, false);
      label(...P(c, (sx + x) / 2 + (x < 960 ? -30 : 30), (sy + y) / 2 + 10), s, t + 0.15, { size: 30, fill: ORANGE, pen: false, d: 0.3 });
    });
    // 以为在指挥 → 其实是最慢的网线
    const crown = G(...P(c, 960, 600)); R.lin(crown, [[-34, 10], [-38, -26], [-14, -6], [0, -34], [14, -6], [38, -26], [34, 10], [-34, 10]], { stroke: '#c9a227', strokeWidth: 3.4, fill: '#ffe48a' });
    draw(crown, C('h5', 0) + 0.2, 0.6);
    const xx = G(...P(c, 960, 590)); R.line(xx, -40, -40, 40, 30, { stroke: RED, strokeWidth: 5 }); R.line(xx, 40, -40, -40, 30, { stroke: RED, strokeWidth: 5 });
    draw(xx, C('h5', 1), 0.3, false);
    const cable = G(0, 0);
    R.curve(cable, [P(c, 300, 300), P(c, 560, 360), P(c, 760, 460), P(c, 900, 640), P(c, 1020, 700), P(c, 1180, 520), P(c, 1360, 360), P(c, 1600, 330), P(c, 1450, 560), P(c, 1180, 700), P(c, 960, 690), P(c, 720, 640), P(c, 520, 720), P(c, 300, 600)], { stroke: ORANGE, strokeWidth: 5, roughness: 2.2 });
    draw(cable, C('h5', 2), 1.5, true);
    const sn = G(...P(c, 1250, 840)); iSnail(sn, 0.9);
    draw(sn, C('h5', 2) + 1.6, 0.9);
    label(...P(c, 1560, 860), '最慢的网线', C('h5', 2) + 2.3, { size: 40, fill: ORANGE });
    camTo(C('h5', 2) - 0.3, 960, 600, 1.12, 2.4);
  }

  // =====================================================================
  // S2 工作不是一问一答：多源、异步的触发
  // =====================================================================
  {
    const c = 's2';
    camTo(LE('h5') + 0.25, ...CC(c), 1, 1.3);
    heading(CELL[c], '2', '工作不是一问一答', A('s2') + 0.15);
    const bulb = G(...P(c, 300, 390)); iBulb(bulb, 1.05);
    draw(bulb, L('p1') + 0.1, 1.0);
    label(...P(c, 300, 395), 'AI', L('p1') + 0.9, { size: 36, pen: false, d: 0.2 });
    label(...P(c, 300, 520), '很聪明 ✓', LE('p1') - 0.3, { size: 32, fill: GREEN });
    // 每一件事都要等你开口
    const pp = G(...P(c, 880, 470)); iPerson(pp, 0.75);
    draw(pp, C('p2', 0), 0.8);
    const q = [];
    [[640, 250], [640, 360], [640, 470]].forEach(([x, y], i) => {
      const g = G(...P(c, x, y)); iWin(g, 0, 0, 120, 74, { dot: ORANGE });
      const hg = G(...P(c, x + 86, y)); iHourglass(hg, 0.8);
      pop(g, C('p2', 1) + i * 0.12, 0.35); pop(hg, C('p2', 1) + 0.15 + i * 0.12, 0.35);
    });
    const bub = G(...P(c, 1020, 300));
    R.path(bub, 'M-60,-40 h150 v70 h-110 l-24,24 v-24 h-16 z', { strokeWidth: 3, fill: '#fffdf8', fillStyle: 'solid' });
    draw(bub, C('p2', 2), 0.5);
    label(...P(c, 1036, 310), '等你开口…', C('p2', 2) + 0.4, { size: 28, pen: false, d: 0.5 });
    // 一问一答
    const qa = G(...P(c, 0, 0));
    const QA = [['问', 1380, 270], ['答', 1640, 320], ['问', 1380, 380], ['答', 1640, 430]];
    QA.forEach(([s, x, y], i) => {
      R.ell(qa, x, y, 110, 64, { strokeWidth: 2.8, stroke: i % 2 ? BLUE : INK });
      if (i < 3) arrow(qa, x + (i % 2 ? -60 : 60), y + 8, QA[i + 1][1] + (i % 2 ? 60 : -60), QA[i + 1][2] - 8, { strokeWidth: 2.4, head: 12 });
    });
    draw(qa, L('p3') + 0.1, 1.0);
    QA.forEach(([s, x, y], i) => label(...P(c, x, y + 11), s, L('p3') + 0.2 + i * 0.22, { size: 30, pen: false, d: 0.15, fill: i % 2 ? BLUE : INK }));
    const nx = G(...P(c, 1510, 350)); R.line(nx, -150, -110, 150, 120, { stroke: RED, strokeWidth: 7 }); R.line(nx, 150, -110, -150, 120, { stroke: RED, strokeWidth: 7 });
    draw(nx, C('p3', 1) + 0.15, 0.45, false); sfx(C('p3', 1) + 0.15, 'slash');
    // 时间轴上，信号不分先后地落下来
    const ax = G(...P(c, 0, 0)); arrow(ax, 140, 760, 1790, 760, { strokeWidth: 3.4, head: 22 });
    draw(ax, L('p4') - 0.5, 0.7);
    label(...P(c, 1760, 815), '时间', L('p4') - 0.1, { size: 28, fill: GREY, pen: false, d: 0.3 });
    const EV = [
      ['邮件', 1250, (g) => iEnvelope(g, 0.95), C('p4', 0) + 0.1],
      ['线上吐槽', 470, (g) => iAngry(g, 0.85), C('p4', 1) + 0.3],
      ['群里 @', 900, (g) => iChat(g, 1), C('p5', 0) + 0.2],
      ['Agent 回执', 1560, (g) => iAgent(g, 1), C('p5', 1) + 0.2],
      ['下游完成', 300, (g) => iCheck(g, 0.95), C('p5', 2) + 0.4],
      ['定时到点', 1080, (g) => iClock(g, 0.9), L('p6') + 0.1],
    ];
    const evG = [];
    EV.forEach(([s, x, fn, t]) => {
      const g = G(...P(c, x, 650)); fn(g);
      (g._ps = prep(g)).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); g._tx.forEach((x) => gsap.set(x, { opacity: 1 }));
      gsap.set(g, { y: CELL[c][1] + 420, opacity: 0 });
      tl.to(g, { opacity: 1, duration: 0.15 }, t);
      tl.to(g, { y: CELL[c][1] + 650, duration: 0.55, ease: 'bounce.out' }, t);
      const tk = G(...P(c, x, 760)); R.line(tk, 0, -14, 0, 14, { stroke: ORANGE, strokeWidth: 4 }); draw(tk, t + 0.4, 0.15, false);
      ding(G(...P(c, x, 650)), t + 0.45, 66);
      label(...P(c, x, 830), s, t + 0.45, { size: 28, pen: false, d: 0.3 });
      evG.push(g);
    });
    const as = label(...P(c, 1250, 560), '异步 · 多源 · 随时', C('p6', 1), { size: 40, fill: ORANGE });
    evG.forEach((g, i) => wiggle(g, C('p6', 2) + i * 0.05, 4, 6));
  }

  // =====================================================================
  // S3 从 Loop 到 Graph
  // =====================================================================
  {
    const c = 's3';
    camTo(LE('p6') + 0.3, ...CC(c), 1, 1.3);
    heading(CELL[c], '3', '从 Loop 到 Graph', A('s3') + 0.1);
    label(...P(c, 480, 250), 'Loop Engineering', C('g1', 1) - 0.4, { size: 46, fill: BLUE, d: 1.0 });
    const ag = G(...P(c, 480, 520)); iAgent(ag, 1.3, BLUE);
    draw(ag, L('g1') + 0.2, 0.6);
    const lp = G(...P(c, 480, 520));
    R.arc(lp, 0, 0, 360, 360, -Math.PI * 0.4, Math.PI * 1.45, { stroke: INK, strokeWidth: 4 });
    head(lp, 180 * Math.cos(Math.PI * 1.45), 180 * Math.sin(Math.PI * 1.45), Math.PI * 1.45 + Math.PI / 2, 24, { strokeWidth: 4 });
    draw(lp, LE('g1') - 0.4, 1.0);
    // 别再一句句提示
    const pb = G(...P(c, 170, 330)); R.path(pb, 'M-70,-30 h140 v56 h-90 l-20,20 v-20 h-30 z', { strokeWidth: 2.6, stroke: GREY });
    draw(pb, C('g2', 0), 0.4, false);
    label(...P(c, 170, 338), '提示…提示…', C('g2', 0) + 0.2, { size: 22, fill: GREY, pen: false, d: 0.3 });
    const pbx = G(...P(c, 170, 330)); R.line(pbx, -80, -40, 80, 40, { stroke: RED, strokeWidth: 5 }); draw(pbx, C('g2', 0) + 0.8, 0.25, false);
    // 设计循环：心跳、定时、事件
    const trig = [['心跳', 480, 760, (g) => iPulse(g, 120)], ['定时', 760, 520, (g) => iClock(g, 0.75)], ['事件', 200, 560, (g) => iHook(g, 1.1, ORANGE)]];
    trig.forEach(([s, x, y, fn], i) => {
      const g = G(...P(c, x, y)); fn(g);
      draw(g, C('g2', 1) + i * 0.45, 0.45, i === 0);
      label(...P(c, x, y + (i === 0 ? 70 : 92)), s, C('g2', 1) + 0.25 + i * 0.45, { size: 28, pen: false, d: 0.25 });
    });
    // 循环里跑起来的点
    const orbit = G(...P(c, 480, 520));
    [0, 2.1, 4.2].forEach((a) => R.circ(orbit, 180 * Math.cos(a), 180 * Math.sin(a), 18, { stroke: GREEN, fill: GREEN, fillStyle: 'solid', strokeWidth: 1.5 }));
    show(orbit, LE('g2') - 0.6, 0.3);
    const [ocx, ocy] = P(c, 480, 520);
    tl.to(orbit, { rotation: 720, svgOrigin: `${ocx} ${ocy}`, duration: AE('s3') + 1 - (LE('g2') - 0.6), ease: 'none' }, LE('g2') - 0.6);
    // Graph Engineering
    label(...P(c, 1390, 250), 'Graph Engineering', L('g3') + 0.1, { size: 46, fill: BLUE, d: 1.0 });
    const N = { a: [1080, 440], b: [1330, 440], v: [1580, 440], h: [1580, 690] };
    const na = G(...P(c, ...N.a)); R.circ(na, 0, 0, 104, { strokeWidth: 3.4, fill: '#e8f1fb', fillStyle: 'solid' });
    const nb = G(...P(c, ...N.b)); R.circ(nb, 0, 0, 104, { strokeWidth: 3.4, fill: '#e8f1fb', fillStyle: 'solid' });
    const nv = G(...P(c, ...N.v)); R.poly(nv, [[0, -62], [70, 0], [0, 62], [-70, 0]], { strokeWidth: 3.4, fill: '#fff3c4', fillStyle: 'solid' });
    const nh = G(...P(c, ...N.h)); iPerson(nh, 0.55);
    const e1 = G(0, 0); arrow(e1, ...P(c, 1136, 440), ...P(c, 1272, 440), { strokeWidth: 3.2 });
    const e2 = G(0, 0); arrow(e2, ...P(c, 1386, 440), ...P(c, 1505, 440), { strokeWidth: 3.2 });
    const e3 = G(0, 0); arrow(e3, ...P(c, 1580, 506), ...P(c, 1580, 590), { strokeWidth: 3.2 });
    const e4 = G(0, 0); carrow(e4, [P(c, 1560, 380), P(c, 1330, 330), P(c, 1100, 384)], { strokeWidth: 2.6, stroke: RED, head: 14 });
    const g4 = [[na, '做', C('g4', 1)], [nb, '接力', C('g4', 2)], [nv, '校验', C('g4', 3)], [nh, '问人', C('g4', 4)]];
    g4.forEach(([g, s, t], i) => {
      if (i) draw([e1, e2, e3][i - 1], t - 0.3, 0.3, false);
      draw(g, t, 0.45);
      const [x, y] = Object.values(N)[i];
      label(...P(c, x, y + (i === 3 ? 92 : 12)), s, t + 0.35, { size: i === 1 ? 28 : 32, pen: false, d: 0.3, fill: i === 3 ? ORANGE : INK });
    });
    draw(e4, LE('g4') - 0.3, 0.5, false);
    label(...P(c, 1330, 316), '不通过', LE('g4') + 0.1, { size: 22, fill: RED, pen: false, d: 0.3 });
    // 够吗？不够！
    const enough = label(...P(c, 1130, 700), '够吗？', L('g5') + 0.4, { size: 56, fill: ORANGE });
    erase(enough, C('g6', 0) - 0.25, 0.2);
    const stamp = G(...P(c, 1180, 690));
    R.rect(stamp, -120, -56, 240, 100, { stroke: RED, strokeWidth: 5, roughness: 1.6 });
    const stt = el('text', { x: 0, y: 18, 'font-size': 62, fill: RED, 'text-anchor': 'middle' }, stamp); stt.textContent = '不够！';
    gsap.set(stamp, { rotation: -10, transformOrigin: '50% 50%' });
    pop(stamp, C('g6', 0) - 0.05, 0.3, 2.2); sfx(C('g6', 0), 'stamp');
    // 明天的新邮件砸进来
    const ne = G(...P(c, 1950, -120)); iEnvelope(ne, 1.1, RED);
    (ne._ps = prep(ne)).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); ne._tx.forEach((x) => gsap.set(x, { opacity: 1 }));
    gsap.set(ne, { rotation: 25 });
    const ht = C('g6', 1) + 0.5;
    tl.to(ne, { x: CELL[c][0] + 1330, y: CELL[c][1] + 360, rotation: -8, duration: 0.7, ease: 'power3.in' }, ht);
    sfx(ht + 0.65, 'thud');
    erase(e1, ht + 0.7, 0.2); erase(e2, ht + 0.75, 0.2);
    const crack = G(0, 0); R.lin(crack, [P(c, 1140, 470), P(c, 1180, 420), P(c, 1215, 470), P(c, 1250, 410), P(c, 1290, 466), P(c, 1440, 420), P(c, 1500, 470)], { stroke: RED, strokeWidth: 3.2 });
    draw(crack, ht + 0.75, 0.3, false);
    [na, nb, nv].forEach((g, i) => wiggle(g, ht + 0.72 + i * 0.04, 4, 7));
  }

  // =====================================================================
  // S4 大管家：接住每一个信号，图是活的
  // =====================================================================
  {
    const c = 's4';
    camTo(LE('g6') + 0.35, ...CC(c), 1, 1.4);
    heading(CELL[c], '4', '大管家：接住每一个信号', A('s4') + 0.15);
    const bt = G(...P(c, 960, 380)); iButler(bt, 1.15);
    draw(bt, L('k1') + 0.05, 1.5);
    label(...P(c, 1220, 260), '大管家', LE('k1') - 0.3, { size: 46, fill: INK, anchor: 'start' });
    label(...P(c, 1220, 310), '（可替换的 Agent）', LE('k1') + 0.2, { size: 26, fill: GREY, anchor: 'start', pen: false, d: 0.4 });
    // 执行者
    const EX = [[300, '编程平台'], [470, '编程平台'], [640, '编程平台'], [900, '调研'], [1070, '调研'], [1330, '其他工作'], [1500, '其他工作']];
    const ex = EX.map(([x]) => { const g = G(...P(c, x, 760)); iWin(g, 0, 0, 140, 88); return g; });
    ex.forEach((g, i) => pop(g, C('k2', 0) + 0.1 + i * 0.07, 0.35));
    label(...P(c, 470, 850), '编程平台', C('k2', 0) + 0.6, { size: 30, pen: false, d: 0.3 });
    label(...P(c, 470, 886), '如 Codex、Claude Code', C('k2', 0) + 0.9, { size: 22, fill: GREY, pen: false, d: 0.3 });
    label(...P(c, 985, 850), '调研', C('k2', 0) + 0.8, { size: 30, pen: false, d: 0.2 });
    label(...P(c, 1415, 850), '其他工作', C('k2', 0) + 1.0, { size: 30, pen: false, d: 0.3 });
    const BX = 960, BY = 520;
    const edges = EX.map(([x]) => { const g = G(0, 0, LAYER.base); R.line(g, ...P(c, BX, BY), ...P(c, x, 712), { stroke: GREY, strokeWidth: 2.2 }); draw(g, C('k2', 0) + 0.5, 0.5, false); return g; });
    // 接住每一个信号
    const SIG = [[(g) => iEnvelope(g, 0.75), -140, 330], [(g) => iAngry(g, 0.6), 2060, 260], [(g) => iChat(g, 0.75), 300, -120], [(g) => iAgent(g, 0.75), 2060, 560], [(g) => iCheck(g, 0.65), 640, 760]];
    SIG.forEach(([fn, x, y], i) => {
      const g = G(...P(c, x, y), LAYER.top); fn(g);
      (g._ps = prep(g)).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); g._tx.forEach((x) => gsap.set(x, { opacity: 1 }));
      gsap.set(g, { opacity: 0 });
      const t = C('k2', 1) + 0.1 + i * 0.32;
      tl.to(g, { opacity: 1, duration: 0.1 }, t);
      tl.to(g, { x: CELL[c][0] + 1092, y: CELL[c][1] + 288 - i * 6, scale: 0.55, duration: 0.7, ease: 'power2.inOut' }, t);
      tl.to(g, { opacity: 0, duration: 0.25 }, t + 0.75);
      sfx(t + 0.65, 'catch');
    });
    // 三个判断
    const QB = [['新事？老事？', 560, 230, C('k3', 0)], ['交给谁？', 560, 330, C('k3', 1)], ['改安排？', 560, 430, C('k3', 2)]];
    QB.forEach(([s, x, y, t]) => {
      const g = G(...P(c, x, y)); R.ell(g, 0, 0, 230, 72, { strokeWidth: 2.6, stroke: BLUE, fill: '#eef4fb', fillStyle: 'solid' });
      pop(g, t, 0.35);
      label(...P(c, x, y + 10), s, t + 0.1, { size: 28, fill: BLUE, pen: false, d: 0.3 });
    });
    const route = G(0, 0); carrow(route, [P(c, BX, BY), P(c, 960, 640), P(c, 1070, 712)], { stroke: BLUE, strokeWidth: 4 });
    draw(route, C('k3', 1) + 0.5, 0.4, false);
    // 卡住 → 另一个会话补信息
    const stuck = G(...P(c, 640, 700)); R.circ(stuck, 0, 0, 46, { stroke: ORANGE, fill: ORANGE, fillStyle: 'solid', strokeWidth: 2 });
    const se = el('text', { x: 0, y: 11, 'font-size': 32, fill: '#fff', 'text-anchor': 'middle' }, stuck); se.textContent = '!';
    pop(stuck, C('k4', 0) + 0.1, 0.35);
    label(...P(c, 640, 650), '卡住', C('k4', 0) + 0.3, { size: 26, fill: ORANGE, pen: false, d: 0.25 });
    const help = G(0, 0); carrow(help, [P(c, 470, 712), P(c, 555, 640), P(c, 620, 712)], { stroke: GREEN, strokeWidth: 4 });
    draw(help, C('k4', 1) + 0.1, 0.5);
    label(...P(c, 555, 612), '补信息', C('k4', 1) + 0.5, { size: 26, fill: GREEN, pen: false, d: 0.3 });
    fade(stuck, C('k4', 1) + 1.0, 0, 0.3);
    const ok = G(...P(c, 640, 700)); R.lin(ok, [[-16, 0], [-4, 14], [20, -16]], { stroke: GREEN, strokeWidth: 6 });
    draw(ok, C('k4', 1) + 1.05, 0.3, false);
    // 跑偏 → 打回重做
    const up = G(0, 0); carrow(up, [P(c, 1060, 712), P(c, 1110, 620), P(c, 1030, 540)], { stroke: ORANGE, strokeWidth: 3.4 });
    draw(up, C('k5', 0) + 0.1, 0.4, false);
    label(...P(c, 1170, 640), '跑偏', C('k5', 0) + 0.3, { size: 26, fill: ORANGE, pen: false, d: 0.25 });
    const back = G(0, 0); carrow(back, [P(c, 990, 560), P(c, 960, 660), P(c, 1050, 712)], { stroke: RED, strokeWidth: 4 });
    draw(back, C('k5', 1) + 0.05, 0.4, false);
    label(...P(c, 900, 650), '重做', C('k5', 1) + 0.3, { size: 28, fill: RED, pen: false, d: 0.25 });
    // 需求变了 → 整张图重连
    const nr = G(...P(c, 1700, 120), LAYER.top); iEnvelope(nr, 0.7, ORANGE);
    (nr._ps = prep(nr)).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); nr._tx.forEach((x) => gsap.set(x, { opacity: 1 }));
    gsap.set(nr, { opacity: 0 });
    tl.to(nr, { opacity: 1, duration: 0.1 }, C('k6', 0));
    tl.to(nr, { x: CELL[c][0] + 1092, y: CELL[c][1] + 290, duration: 0.6, ease: 'power2.in' }, C('k6', 0));
    tl.to(nr, { opacity: 0, duration: 0.2 }, C('k6', 0) + 0.65);
    sfx(C('k6', 0) + 0.6, 'catch');
    [0, 3, 5].forEach((i, j) => erase(edges[i], C('k6', 1) + j * 0.12, 0.25));
    [up, back, route].forEach((g) => fade(g, C('k6', 1) + 0.2, 0, 0.4));
    const NEW = [[300, 1070], [900, 1500], [1330, 640]];
    const newE = NEW.map(([a, b], i) => {
      const g = G(0, 0, LAYER.base); R.curve(g, [P(c, a, 712), P(c, (a + b) / 2, 620 - i * 30), P(c, b, 712)], { stroke: BLUE, strokeWidth: 3 });
      draw(g, C('k6', 2) + i * 0.25, 0.45, i === 0); return g;
    });
    const newT = [[300, 1330], [900, 470]].map(([x]) => { const g = G(0, 0, LAYER.base); R.line(g, ...P(c, BX, BY), ...P(c, x, 712), { stroke: BLUE, strokeWidth: 3 }); draw(g, C('k6', 2) + 0.5, 0.35, false); return g; });
    // 这张图，是活的！
    const flowT = L('k7') - 0.1;
    const dots = [];
    EX.forEach(([x], i) => {
      const d = G(...P(c, BX, BY), LAYER.top); R.circ(d, 0, 0, 16, { stroke: GREEN, fill: GREEN, fillStyle: 'solid', strokeWidth: 1.4 });
      show(d, flowT + i * 0.08, 0.15);
      for (let r = 0; r < 3; r++) {
        const t0 = flowT + i * 0.08 + r * 1.1;
        tl.to(d, { x: CELL[c][0] + x, y: CELL[c][1] + 712, duration: 0.9, ease: 'power1.inOut' }, t0);
        tl.set(d, { x: CELL[c][0] + BX, y: CELL[c][1] + BY }, t0 + 1.0);
      }
      tl.to(d, { opacity: 0, duration: 0.3 }, flowT + 3.4);
    });
    const pulse = G(...P(c, 1500, 470)); iPulse(pulse, 260);
    draw(pulse, L('k7') + 0.1, 0.6, false);
    label(...P(c, 1500, 420), '活的！', L('k7') + 0.3, { size: 60, fill: GREEN, d: 0.6 });
    sfx(L('k7') + 0.3, 'spark');
  }

  // =====================================================================
  // S5 人：定目标、做取舍、拍板
  // =====================================================================
  {
    const c = 's5';
    camTo(LE('k7') + 0.35, ...CC(c), 1, 1.4);
    heading(CELL[c], '5', '人：定目标 · 做取舍 · 拍板', A('s5') + 0.1);
    const ps = G(...P(c, 360, 560)); iPerson(ps, 1.15, { arms: 'point' });
    draw(ps, L('r1'), 0.9);
    label(...P(c, 470, 330), '?', L('r1') + 0.6, { size: 72, fill: ORANGE, pen: false, d: 0.3 });
    const IC = [[(g) => iFlag(g, 1), 760, '定目标', C('r2', 1)], [(g) => iScale(g, 0.95), 1110, '做取舍', C('r2', 2)], [(g) => iStamp(g, 1.05), 1440, '拍板', C('r2', 3)]];
    IC.forEach(([fn, x, s, t]) => { const g = G(...P(c, x, 400)); fn(g); draw(g, t - 0.15, 0.6); label(...P(c, x, 520), s, t + 0.3, { size: 34, pen: false, d: 0.35 }); });
    const hl = G(...P(c, 0, 0), LAYER.base); R.line(hl, 700, 532, 1500, 528, { stroke: HL, strokeWidth: 22, roughness: 0.7 });
    draw(hl, LE('r2') - 0.2, 0.5, false);
    // 大管家带着背景、选项和影响来
    const sb = G(...P(c, 1660, 780)); iButler(sb, 0.62);
    pop(sb, L('r3') - 0.2, 0.4);
    const card = G(...P(c, 1250, 760), LAYER.top);
    R.rect(card, -230, -110, 460, 220, { stroke: ORANGE, strokeWidth: 3.4, fill: '#fffaf1', fillStyle: 'solid' });
    const ct = el('text', { x: 0, y: -62, 'font-size': 32, fill: INK, 'text-anchor': 'middle' }, card); ct.textContent = '是否保留手机验证？';
    R.rect(card, -200, -36, 180, 64, { strokeWidth: 2.4, stroke: GREY });
    R.rect(card, 20, -36, 180, 64, { strokeWidth: 2.4, stroke: GREY });
    const oa = el('text', { x: -110, y: 6, 'font-size': 26, fill: INK, 'text-anchor': 'middle' }, card); oa.textContent = 'A 保留验证';
    const ob = el('text', { x: 110, y: 6, 'font-size': 26, fill: INK, 'text-anchor': 'middle' }, card); ob.textContent = 'B 减少步骤';
    const cf = el('text', { x: 0, y: 76, 'font-size': 22, fill: GREY, 'text-anchor': 'middle' }, card); cf.textContent = '背景 · 选项 · 影响';
    pop(card, C('r3', 0) + 0.4, 0.45, 0.2);
    tl.to(card, { x: CELL[c][0] + 820, y: CELL[c][1] + 760, scale: 1.4, duration: 0.8, ease: 'power2.inOut' }, C('r3', 1) + 0.2);
    // 就这么办
    const st = G(...P(c, 974, 768), LAYER.top);
    // 印章有意盖在选中的选项上；这是拍板动作，而非两个并列文字区。
    R.rect(st, -110, -40, 220, 80, { stroke: ORANGE, strokeWidth: 5, roughness: 1.5 });
    const stx = el('text', { x: 0, y: 14, 'font-size': 40, fill: ORANGE, 'text-anchor': 'middle', 'data-layout-allow-overlap': '' }, st); stx.textContent = '就这么办';
    gsap.set(st, { rotation: -8, transformOrigin: '50% 50%' });
    pop(st, C('r4', 1) - 0.25, 0.28, 2.2); sfx(C('r4', 1) - 0.1, 'stamp');
    // 网络重新流动
    const net = G(0, 0, LAYER.base);
    const NN = [[1260, 640], [1420, 600], [1580, 660], [1420, 720], [1720, 600]];
    [[0, 1], [1, 2], [1, 3], [2, 4], [3, 2]].forEach(([a, b]) => R.line(net, ...P(c, ...NN[a]), ...P(c, ...NN[b]), { stroke: GREEN, strokeWidth: 3 }));
    NN.forEach(([x, y]) => R.circ(net, ...P(c, x, y), 30, { stroke: GREEN, fill: '#e3f3e9', fillStyle: 'solid', strokeWidth: 2.4 }));
    draw(net, C('r4', 2) + 0.1, 0.9, false);
    const flow = G(0, 0); carrow(flow, [P(c, 1050, 770), P(c, 1150, 700), P(c, 1240, 650)], { stroke: GREEN, strokeWidth: 4 });
    draw(flow, C('r4', 2), 0.4, false);
    NN.forEach(([x, y], i) => { const d = G(...P(c, x, y), LAYER.top); R.circ(d, 0, 0, 14, { stroke: GREEN, fill: GREEN, fillStyle: 'solid' }); show(d, C('r4', 2) + 0.6 + i * 0.1, 0.2); tl.to(d, { scale: 1.8, opacity: 0, duration: 0.9, repeat: 2, transformOrigin: '50% 50%' }, C('r4', 2) + 0.7 + i * 0.1); });
  }

  // =====================================================================
  // S6 托付出去
  // =====================================================================
  {
    const c = 's6';
    camTo(LE('r4') + 0.35, ...CC(c), 1, 1.4);
    heading(CELL[c], '6', '托付出去', A('s6') + 0.1);
    label(...P(c, 330, 250), '过去', C('z1', 0), { size: 36, fill: GREY });
    const mon = G(...P(c, 330, 470)); iMonitor(mon, 1.0);
    draw(mon, C('z1', 1), 0.7);
    const cmd = G(...P(c, 540, 330)); R.path(cmd, 'M-60,-30 h120 v56 h-80 l-20,20 v-20 h-20 z', { strokeWidth: 2.6 });
    draw(cmd, C('z1', 3) - 0.1, 0.3, false);
    label(...P(c, 540, 338), '命令', C('z1', 3), { size: 28, pen: false, d: 0.2 });
    const hg = G(...P(c, 560, 560)); iHourglass(hg, 1.2);
    draw(hg, C('z1', 4), 0.45, false);
    label(...P(c, 640, 570), '等…', C('z1', 4) + 0.3, { size: 30, fill: GREY, pen: false, d: 0.3 });
    const oldG = [mon, cmd, hg];
    // 托付出去
    label(...P(c, 980, 250), '接下来', C('z2', 0), { size: 40, fill: BLUE });
    const pp = G(...P(c, 850, 560)); iPerson(pp, 0.8, { arms: 'point' });
    draw(pp, C('z2', 0) + 0.4, 0.7);
    const sb = G(...P(c, 1270, 560)); iButler(sb, 0.72);
    draw(sb, C('z2', 1) - 0.2, 0.9);
    const box = G(...P(c, 920, 470), LAYER.top); iBox(box, 0.55);
    pop(box, C('z2', 1) + 0.4, 0.35);
    tl.to(box, { x: CELL[c][0] + 1180, y: CELL[c][1] + 470, duration: 0.9, ease: 'power2.inOut' }, C('z2', 1) + 0.8);
    label(...P(c, 1050, 420), '托付', C('z2', 1) + 0.9, { size: 30, fill: BLUE, pen: false, d: 0.3 });
    const ins = [[(g) => iEnvelope(g, 0.5), 1400, 140], [(g) => iChat(g, 0.5), 1500, 300], [(g) => iAgent(g, 0.5), 1420, 860]];
    ins.forEach(([fn, x, y], i) => {
      const g = G(...P(c, x, y), LAYER.top); fn(g);
      (g._ps = prep(g)).forEach((p) => gsap.set(p, p._fill ? { opacity: 1 } : { strokeDashoffset: 0 })); g._tx.forEach((x) => gsap.set(x, { opacity: 1 }));
      gsap.set(g, { opacity: 0 });
      const t = C('z2', 2) + i * 0.35;
      tl.to(g, { opacity: 1, duration: 0.1 }, t);
      tl.to(g, { x: CELL[c][0] + 1340, y: CELL[c][1] + 470, scale: 0.6, duration: 0.7, ease: 'power2.in' }, t);
      tl.to(g, { opacity: 0, duration: 0.2 }, t + 0.72);
      sfx(t + 0.65, 'catch');
    });
    const bars = [1180, 1290, 1400].map((x, i) => {
      const g = G(...P(c, x, 790)); iWin(g, 0, 0, 96, 62, { bare: true });
      pop(g, C('z2', 3) - 0.3 + i * 0.1, 0.3);
      const b = G(...P(c, x - 36, 806)); R.line(b, 0, 0, 72, 0, { stroke: GREEN, strokeWidth: 6, roughness: 0.6 });
      draw(b, C('z2', 3) + 0.2 + i * 0.2, 1.6, false);
      return g;
    });
    oldG.forEach((g) => fade(g, C('z2', 0), 0.35, 0.8));
    // 三层：执行 / 协调 / 方向
    const TX = 1700;
    const tiers = [['执行', 'AI', 760, C('z3', 0)], ['协调', '大管家', 560, C('z3', 1)], ['方向', '你', 340, L('z4')]];
    tiers.forEach(([role, who, y, t], i) => {
      const g = G(...P(c, TX, y)); R.rect(g, -150, -62, 300, 124, { strokeWidth: 3.2, stroke: [GREY, BLUE, ORANGE][i], fill: ['#f4f4f2', '#eef4fb', '#fff4e8'][i], fillStyle: 'solid' });
      draw(g, t, 0.5);
      label(...P(c, TX, y - 6), who, t + 0.3, { size: 30, pen: false, d: 0.25 });
      label(...P(c, TX, y + 38), role, t + 0.45, { size: 34, fill: [INK, BLUE, ORANGE][i], pen: false, d: 0.3 });
      if (i) { const a = G(0, 0); arrow(a, ...P(c, TX, y + 64), ...P(c, TX, y + 136), { strokeWidth: 3 }); draw(a, t - 0.2, 0.25, false); }
    });
    const comp = G(...P(c, TX - 220, 340)); iCompass(comp, 0.9);
    draw(comp, L('z4') + 0.3, 0.6, false);
    const hl = G(0, 0, LAYER.base); R.line(hl, ...P(c, TX - 60, 384), ...P(c, TX + 60, 382), { stroke: HL, strokeWidth: 22, roughness: 0.7 });
    draw(hl, LE('z4') - 0.2, 0.4, false);
    // 拉远：整张白板
    camTo(L('z5') + 0.2, 2880, 1080, 0.322, 4.2, 'power2.inOut');
  }

  // =====================================================================
  // END
  // =====================================================================
  const es = $('#endScrim'), ec = $('#endc');
  gsap.set(es, { opacity: 0 });
  const mk = (cls, s) => { const d = document.createElement('div'); d.className = cls; d.textContent = s; ec.appendChild(d); return d; };
  const ehl = mk('hl', ''); const e1 = mk('e1', '让 AI 协调执行，让人掌握方向。'); const e2 = mk('e2', '一种有待实现与验证的工作方式'); const e3 = mk('e3', '概念演示 · 非产品实录');
  gsap.set(e1, { clipPath: 'inset(0 100% 0 0)' }); gsap.set([e2, e3], { opacity: 0 }); gsap.set(ehl, { scaleX: 0 });
  const EC = TL.cues.endc;
  tl.to(es, { opacity: 1, duration: 0.8 }, EC - 0.5);
  tl.to(e1, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'none' }, EC); sfx(EC, 'write', 1.6);
  tl.to(ehl, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, EC + 1.7);
  tl.to(e2, { opacity: 1, duration: 0.7 }, EC + 2.0);
  tl.to(e3, { opacity: 1, duration: 0.7 }, EC + 2.4);

  // =====================================================================
  // SUBTITLES
  // =====================================================================
  const subs = $('#subs');
  TL.subs.forEach((s) => {
    const d = document.createElement('div'); d.className = 'sub'; d.textContent = s.text; subs.appendChild(d);
    gsap.set(d, { opacity: 0 });
    tl.to(d, { opacity: 1, duration: 0.12 }, s.t0);
    tl.to(d, { opacity: 0, duration: 0.12 }, s.t1 - 0.12);
  });

  penFinalize();
  tl.to({}, { duration: 0.001 }, TL.dur - 0.001);
  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  tl.seek(0);
})();
