// 抖音版合成：把原片的横屏镜头放进 9:16 竖屏。
// 每个画面段落：原片镜头先在一张 1920×1080 的横屏画布上画好（镜头内时间按 [from, to] 换算），加上原片的暗角与颗粒，
// 再按 w / cx 裁出中间一块放进竖屏的画面框；框外是黑色，上面是常驻标题与进度条，下面是逐字高亮的大字幕。
// 段落之间硬切，新画面带一下推近；关键词被念出时画面一顶，章节与大数字在画面中间砸出来。
const PW = 1080, PH = 1920, PCX = PW / 2;
const BOX = { y0: 590, y1: 1610 }; // 画面框
const BOXC = (BOX.y0 + BOX.y1) / 2;
const COL = { ink: '#f4efe6', dim: 'rgba(244,239,230,0.42)', key: '#f2c46d', stroke: 'rgba(0,0,0,0.92)', faint: 'rgba(222,210,186,0.62)', track: 'rgba(255,255,255,0.16)' };
const HEAVY = '"Noto Sans CJK SC", sans-serif';
let ctx, land;

function init() {
  const cv = document.getElementById('c');
  cv.width = PW; cv.height = PH;
  ctx = cv.getContext('2d');
  land = makeCanvas(); // 横屏 1920×1080
  initPost();
  initStars();
  for (const f of INITS) f();
  initImpacts();
}

// —— 画面：原片镜头 → 横屏画布 → 竖屏画面框 ——
const srcShot = (name) => TL.shots.find((s) => s.kind === name);
function segAt(t) {
  const S = CUT.shots;
  let i = S.findIndex((s) => t >= s.a && t < s.b);
  return S[i < 0 ? (t < 0 ? 0 : S.length - 1) : i];
}
function drawLand(s, t) {
  const o = srcShot(s.src), od = o.b - o.a;
  const u = t - s.a;
  // 段落内时间 → 原片镜头内时间：按锚点（timeline 的 map）分段线性换算
  let j = 1; while (j < s.map.length - 1 && u > s.map[j][0]) j++;
  const [u0, o0] = s.map[j - 1], [u1, o1] = s.map[j];
  const uo = clamp(o0 + (o1 - o0) * ((u - u0) / (u1 - u0)), 0, od - 0.02);
  const g = land.getContext('2d');
  g.save();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  SHOT[o.kind](g, uo, od, o, o.a + uo);
  g.restore();
  post(g, o.a + uo, Math.round(t * CUT.fps));
}
function picture(g, s, t, p) {
  if (!s.src) return;
  drawLand(s, t);
  const u = t - s.a, D = s.b - s.a;
  // 新画面推进来（0.35 秒从 1.07 落到 1），整段再慢慢推近 4%
  const push = 1 + 0.07 * (1 - outCubic(clamp(u / 0.35))) + 0.04 * (u / D);
  const sc = (PW / s.w) * push * p.s;
  g.save();
  g.beginPath(); g.rect(0, BOX.y0, PW, BOX.y1 - BOX.y0); g.clip();
  g.drawImage(land, PCX + p.sx - s.cx * sc, BOXC + p.sy - s.cy * sc, W * sc, H * sc);
  g.restore();
  // 画面上下边缘柔和地融进黑色
  const top = Math.max(BOX.y0, BOXC - s.cy * sc), bot = Math.min(BOX.y1, BOXC + (H - s.cy) * sc);
  for (const [y, dir] of [[top, 1], [bot, -1]]) {
    const gr = g.createLinearGradient(0, y, 0, y + dir * 110);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, dir > 0 ? y : y - 110, PW, 110);
  }
}
const outCubic = (k) => 1 - Math.pow(1 - k, 3);

// 镜头冲击：每个关键词被念出时画面轻轻一“顶”
let IMPACTS = [];
function initImpacts() {
  const ks = [];
  for (const s of CUT.shots) for (const v of Object.values(s.k)) ks.push([v, 1]);
  IMPACTS = ks.sort((a, b) => a[0] - b[0]);
}
function punch(t) {
  let p = 0, sx = 0, sy = 0;
  for (const [ti, w] of IMPACTS) {
    if (ti > t) break;
    const d = t - ti;
    if (d < 0.45) {
      p = Math.max(p, Math.pow(1 - d / 0.45, 2) * w);
      if (d < 0.16) { sx += (rand(ti * 100, 1) - 0.5) * 10 * (1 - d / 0.16); sy += (rand(ti * 100, 2) - 0.5) * 10 * (1 - d / 0.16); }
    }
  }
  return { s: 1 + 0.03 * p, sx, sy };
}

// —— 文字 ——
function txt(g, s, x, y, size, color, o = {}) {
  g.save();
  g.font = `${o.weight ?? '700'} ${size}px ${o.font ?? HEAVY}`;
  g.letterSpacing = o.spacing ?? '0px';
  g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  if (o.maxW) { const w = g.measureText(s).width; if (w > o.maxW) { g.translate(x, y); g.scale(o.maxW / w, 1); g.translate(-x, -y); } }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.stroke; g.strokeStyle = COL.stroke; g.strokeText(s, x, y); }
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * 0.5; }
  g.fillStyle = color; g.fillText(s, x, y);
  g.restore();
}

// 关键词被念出时砸出大字：章节卡（“第一次 · 位置”“3 次”“凡人”）压暗画面、在正中；数字（'num'）在画面上部、不压暗
function stamps(g, s, t) {
  for (const [k, big, small, style] of s.stamp) {
    if (!(k in s.k)) continue;
    const num = style === 'num';
    const t0 = s.k[k] - 0.04, t1 = s.kind === 'ordinary' || num ? s.b : Math.min(s.b, t0 + 1.7);
    if (t < t0 || t > t1) continue;
    const u = t - t0, a = ease(u, 0, 0.08) * (1 - ease(t, t1 - 0.2, t1));
    const z = 1 + 0.35 * (1 - outCubic(clamp(u / 0.2)));
    const serif = s.kind === 'ordinary';
    const y = num ? BOX.y0 + 190 : BOXC - 60;
    g.save();
    if (num) {
      const gr = g.createRadialGradient(PCX, y + 30, 0, PCX, y + 30, 420);
      gr.addColorStop(0, `rgba(0,0,0,${0.55 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, y - 400, PW, 860);
    } else { g.fillStyle = `rgba(0,0,0,${0.5 * a})`; g.fillRect(0, BOX.y0, PW, BOX.y1 - BOX.y0); }
    g.translate(PCX, y); g.scale(z, z); g.translate(-PCX, -y);
    txt(g, big, PCX, y, serif ? 230 : num ? 150 : 190, num ? COL.key : COL.ink, { alpha: a, stroke: 14, font: serif ? SERIF : HEAVY, weight: serif ? '700' : '900', spacing: serif ? '0.3em' : '0.02em', glow: 'rgba(255,214,140,0.35)' });
    txt(g, small, PCX, y + (num ? 112 : 170), serif ? 40 : num ? 40 : 64, num ? COL.ink : COL.key, { alpha: a * ease(u, 0.12, 0.3), stroke: 9, spacing: serif ? '0.5em' : '0.08em', font: serif ? LATIN : HEAVY });
    g.restore();
  }
}

// 原片的档案图说：画面框左上角的小字
function archiveCaption(g, s, t) {
  if (!s.caption) return;
  const a = ease(t, s.a + 0.25, s.a + 0.6) * (1 - ease(t, s.b - 0.2, s.b));
  if (a <= 0.003) return;
  g.save(); g.globalAlpha = a;
  g.fillStyle = COL.faint; g.fillRect(56, BOX.y0 + 34, 2, 34);
  txt(g, s.caption, 72, BOX.y0 + 52, 25, COL.faint, { align: 'left', font: SERIF, weight: '400', spacing: '0.08em', stroke: 5, maxW: PW - 140 });
  g.restore();
}

// —— 常驻标题与进度条：从第一帧就在 ——
function header(g, t) {
  const end = CUT.shots.find((s) => s.kind === 'endcard');
  const a = 1 - ease(t, end.a - 0.3, end.a + 0.2);
  if (a <= 0.004) return;
  g.save(); g.globalAlpha = a;
  const [l1, l2] = CUT.txt.header;
  txt(g, l1, PCX, 318, 68, COL.ink, { weight: '900', maxW: 980, stroke: 10 });
  txt(g, l2, PCX, 398, 44, COL.key, { weight: '700', maxW: 980, stroke: 8 });
  txt(g, CUT.txt.source, PCX, 452, 24, COL.dim, { weight: '400', maxW: 980 });
  // 进度条：三次“降级”的刻度，当前一段亮起来
  const x0 = 110, x1 = PW - 110, y = 500, total = end.a;
  const X = (tt) => x0 + (x1 - x0) * clamp(tt / total);
  g.fillStyle = COL.track; g.fillRect(x0, y - 3, x1 - x0, 6);
  g.fillStyle = COL.key; g.fillRect(x0, y - 3, X(t) - x0, 6);
  for (const ac of CUT.acts) {
    const name = CUT.txt.chapters[ac.name];
    if (!name) continue;
    const on = t >= ac.a && t < ac.b;
    g.fillStyle = t >= ac.a ? COL.key : 'rgba(255,255,255,0.5)';
    g.beginPath(); g.arc(X(ac.a), y, on ? 9 : 6, 0, TAU); g.fill();
    txt(g, name, X(ac.a), y + 34, on ? 28 : 24, on ? COL.key : COL.dim, { weight: on ? '700' : '400' });
  }
  g.restore();
}

// —— 字幕：逐字高亮，关键词念到时变金色 ——
const CAP = { y: 1452, size: 68, maxW: 930, lh: 1.3 };
function layoutCap(g, units, maxW) {
  const ws = units.map((u) => g.measureText(u.s).width), total = ws.reduce((a, b) => a + b, 0);
  if (total <= maxW) return [units];
  // 两行：断点尽量在中间，优先断在标点后面；不拆开英文词和数字，不把标点放在行首
  let best = -1, bd = 1e9, acc = 0;
  for (let i = 0; i < units.length - 1; i++) {
    acc += ws[i];
    if (acc > maxW || total - acc > maxW) continue;
    const punct = /[，。；：？！、”—]/.test(units[i].s);
    const glue = /^[，。；：？！、”—]/.test(units[i + 1].s) || /^[“《]/.test(units[i].s) || (/[A-Za-z0-9]$/.test(units[i].s) && /^[A-Za-z0-9]/.test(units[i + 1].s));
    const d = Math.abs(acc - total / 2) - (punct ? maxW * 0.3 : 0) + (glue ? 1e6 : 0);
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) return [units];
  return [units.slice(0, best + 1), units.slice(best + 1)];
}
function captions(g, t) {
  const end = CUT.shots.find((s) => s.kind === 'endcard');
  if (t >= end.a) return; // 片尾互动卡自己写着
  CUT.caps.forEach((c, i) => {
    const next = CUT.caps[i + 1], swap = next && next.a - c.b < 0.2;
    if (t < c.a || t >= c.b + (swap ? 0 : 0.01)) return;
    const a = (c.a < 0.05 ? 1 : ease(t, c.a, c.a + 0.08)) * (swap ? 1 : 1 - ease(t, c.b - 0.15, c.b));
    if (a <= 0.003) return;
    g.save();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    const units = [...c.text].map((ch, j) => ({ s: ch, i: j, t: c.ct[j] ?? c.a }));
    // 英文词、数字连成一个单位
    for (let j = units.length - 1; j > 0; j--) if (/[A-Za-z0-9.]/.test(units[j].s) && /[A-Za-z0-9.]$/.test(units[j - 1].s)) { units[j - 1].s += units[j].s; units.splice(j, 1); }
    // 一行放不下时先把字缩小（最多到 0.8 倍），还放不下才折成两行：折行容易断在词中间
    g.font = `700 ${CAP.size}px ${HEAVY}`;
    const full = units.reduce((sum, u) => sum + g.measureText(u.s).width, 0);
    const size = full > CAP.maxW && full * 0.8 <= CAP.maxW ? CAP.size * (CAP.maxW / full) : CAP.size;
    g.font = `700 ${size}px ${HEAVY}`;
    const lines = layoutCap(g, units, CAP.maxW);
    const lh = size * CAP.lh, y0 = CAP.y - ((lines.length - 1) * lh) / 2;
    const isKey = (u) => (c.kr ?? []).some(([x, y]) => u.i < y && u.i + u.s.length > x);
    lines.forEach((ln, li) => {
      const wsum = ln.reduce((sum, u) => sum + g.measureText(u.s).width, 0);
      let x = PCX - wsum / 2;
      const y = y0 + li * lh;
      for (const u of ln) {
        const uw = g.measureText(u.s).width;
        const said = t >= u.t - 0.03, fresh = said ? clamp(1 - (t - u.t) / 0.25) : 0;
        g.globalAlpha = a;
        g.save();
        if (fresh > 0) { g.translate(x + uw / 2, y); g.scale(1 + 0.12 * fresh, 1 + 0.12 * fresh); g.translate(-(x + uw / 2), -y); }
        g.lineJoin = 'round'; g.lineWidth = size * 0.17; g.strokeStyle = COL.stroke;
        g.strokeText(u.s, x, y);
        g.fillStyle = said ? (isKey(u) ? COL.key : COL.ink) : COL.dim;
        g.fillText(u.s, x, y);
        g.restore();
        x += uw;
      }
    });
    g.restore();
  });
}

// —— 片尾互动卡：三次里最难接受哪一次 ——
function endcard(g, s, t) {
  const u = t - s.a;
  drawStars(g, t + 400, 0.5, 0, 0);
  txt(g, '凡人', PCX, 520, 150, COL.ink, { font: SERIF, weight: '700', spacing: '0.3em', alpha: ease(u, 0, 0.4), glow: 'rgba(255,214,140,0.3)' });
  txt(g, 'ORDINARY', PCX, 640, 32, COL.dim, { font: LATIN, spacing: '0.5em', alpha: ease(u, 0.2, 0.6) });
  CUT.txt.poll.forEach(([n, name, desc], i) => {
    const t0 = 0.4 + i * 0.35, k = ease(u, t0, t0 + 0.25), y = 820 + i * 170;
    if (k <= 0) return;
    g.save(); g.globalAlpha = k; g.translate((1 - outCubic(k)) * 80, 0);
    g.fillStyle = 'rgba(242,196,109,0.12)'; g.strokeStyle = 'rgba(242,196,109,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(140, y - 66, PW - 280, 132, 22); g.fill(); g.stroke();
    g.fillStyle = COL.key; g.beginPath(); g.arc(230, y, 46, 0, TAU); g.fill();
    txt(g, n, 230, y + 2, 58, '#1a1208', { weight: '900' });
    txt(g, name, 310, y - 22, 52, COL.ink, { align: 'left', weight: '900' });
    txt(g, desc, 310, y + 34, 32, COL.dim, { align: 'left', weight: '400' });
    g.restore();
  });
  const [c1, c2] = CUT.cta;
  const kc = ease(u, 1.6, 1.9);
  txt(g, c1, PCX, 1390, 54, COL.ink, { weight: '900', alpha: kc, stroke: 8, maxW: 960 });
  txt(g, c2, PCX, 1472, 60, COL.key, { weight: '900', alpha: kc, stroke: 8, maxW: 960 });
  txt(g, CUT.txt.sign, PCX, 1580, 26, COL.dim, { font: LATIN, spacing: '0.4em', alpha: ease(u, 2.0, 2.4) });
}

function renderFrame(t) {
  const g = ctx;
  g.save();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH);
  const s = segAt(t);
  if (s.src) {
    picture(g, s, t, punch(t));
    archiveCaption(g, s, t);
  } else if (s.kind === 'endcard') endcard(g, s, t);
  if (s.stamp.length) stamps(g, s, t);
  // 字幕底下压暗一点，档案图亮的时候字也站得住
  const sg = g.createLinearGradient(0, CAP.y - 170, 0, CAP.y + 170);
  sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.35, 'rgba(0,0,0,0.5)'); sg.addColorStop(0.65, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  if (s.kind !== 'endcard') { g.fillStyle = sg; g.fillRect(0, CAP.y - 170, PW, 340); }
  header(g, t);
  captions(g, t);
  g.restore();
}

window.renderAt = (t, q = 0.92) => { renderFrame(t); return ctx.canvas.toDataURL('image/jpeg', q); };
window.drawAt = (t) => { renderFrame(t); return true; };
window.ready = (async () => {
  await Promise.all([
    document.fonts.load(`900 60px ${HEAVY}`, '科学把人类请下神坛'), document.fonts.load(`700 60px ${HEAVY}`, '第三次'),
    document.fonts.load(`400 30px ${HEAVY}`, '改编'), document.fonts.load(`700 40px ${SERIF}`, '凡人'), document.fonts.load(`400 30px ${SERIF}`, '托勒密'),
    document.fonts.load(`20px ${MONO}`, 'softmax'), document.fonts.load(`20px ${TYPEWRITER}`, 'CAN MACHINES THINK'),
    document.fonts.load(`italic 20px ${LATIN}`, 'Homo sapiens'), document.fonts.load(`30px ${LATIN}`, 'ORDINARY'),
    loadImages(),
  ]);
  init();
  return true;
})();

// —— 预览：/films/ordinary/douyin/index.html?preview ——
if (location.search.includes('preview')) {
  window.ready.then(() => {
    const ui = document.getElementById('ui'); ui.hidden = false;
    const range = document.getElementById('t'), label = document.getElementById('lab'), audio = document.getElementById('aud');
    audio.src = 'douyin/out/mix/douyin.wav';
    range.max = CUT.duration;
    let playing = false, t0 = 0, start = 0;
    const show = (t) => { renderFrame(t); range.value = t; label.textContent = t.toFixed(2) + 's'; };
    range.oninput = () => { start = +range.value; t0 = performance.now(); audio.currentTime = start; show(start); };
    document.getElementById('play').onclick = () => {
      playing = !playing; start = +range.value; t0 = performance.now();
      if (playing) { audio.currentTime = start; audio.play().catch(() => {}); loop(); } else audio.pause();
    };
    function loop() {
      if (!playing) return;
      show(Math.min(audio.paused ? start + (performance.now() - t0) / 1000 : audio.currentTime, CUT.duration - 0.01));
      requestAnimationFrame(loop);
    }
    show(+(new URLSearchParams(location.search).get('t') || 0));
  });
}
