// 一至四章：描红 · 嘱咐 · 步骤 · 补丁

// ═══ 一 · 续写：先写好几行范例，再留下一个空格 ═══
const SPEC = {
  zh: [['评论：这个产品很好用。', '情绪：正面'], ['评论：刚买回来就坏了。', '情绪：负面'], ['评论：包装普通，但功能符合预期。', '情绪：', '正面']],
  en: [['Review: Works great.', 'Sentiment: positive'], ['Review: Broke the day it arrived.', 'Sentiment: negative'], ['Review: Plain box, but it does the job.', 'Sentiment:', 'positive']],
};
SHOT.trace = (ctx, u, dur, sh) => {
  const t1 = at(sh, 'a1'), t2 = at(sh, 'a2'), t2e = at(sh, 'a2', 1), t3 = at(sh, 'a3');
  const zoom = ease(u, t2, dur);
  ctx.save(); cam(ctx, 1 + 0.06 * zoom, CX + 60 * zoom, CY + 60 * zoom);
  paper(ctx);
  const zh = TL.lang === 'zh', rows = SPEC[zh ? 'zh' : 'en'];
  const F = zh ? KAI : GARA, size = zh ? 50 : 50, sty = zh ? '' : 'italic';
  const xL = CX - 700, xR = CX + 240;
  const units = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];
  const T0 = t2 + 0.2, dt = (t2e - 0.1 - T0) / units.length;
  const traceK = (r, j) => { const n = units.findIndex(([a, b]) => a === r && b === j); return ease(u, T0 + n * dt, T0 + (n + 1.5) * dt); };
  const redK = (r) => { const t = Math.min(t1 + 0.4 + r * 0.5, t2 - 0.5); return ease(u, t, t + 0.7); };
  const emptyK = win(u, t2e - 0.6, t3 + 0.8, 0.5, 0.4), pulse = 0.5 + 0.5 * Math.sin((u - t2e) * 4);
  rows.forEach((r, ri) => {
    const y = 300 + ri * 160;
    const g = ease(u, 0.3 + ri * 0.25, 1.4 + ri * 0.25);
    ctx.save();
    ctx.strokeStyle = rgba(CINNABAR, 0.55 * g); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xL - 40, y + 26); ctx.lineTo(CX + 720, y + 26); ctx.stroke();
    ctx.setLineDash([6, 8]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(CINNABAR, 0.3 * g);
    ctx.beginPath(); ctx.moveTo(xL - 40, y - 46); ctx.lineTo(CX + 720, y - 46); ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(xR - 50, y - 60); ctx.lineTo(xR - 50, y + 40); ctx.stroke();
    ctx.restore();
    r.slice(0, 2).forEach((txt, j) => {
      const x = j ? xR : xL;
      inkText(ctx, txt, x, y, size, F, { align: 'left', color: CINNABAR, alpha: redK(ri) * 0.45, bleed: 0, style: sty });
      writeLine(ctx, txt, x, y, size, F, traceK(ri, j), { style: sty });
    });
    if (r[2]) {
      ctx.save(); ctx.font = `${sty} ${size}px ${F}`; const w0 = ctx.measureText(r[1]).width; ctx.font = `${zh ? '' : 'italic'} 66px ${zh ? BRUSH : GARA}`; const wa = ctx.measureText(r[2]).width; ctx.restore();
      const ax = xR + w0 + 18;
      if (emptyK > 0) { ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = rgba(CINNABAR, 0.6 * emptyK * (0.4 + 0.6 * pulse)); ctx.lineWidth = 2; ctx.strokeRect(ax - 8, y - 50, wa + 24, 86); ctx.restore(); }
      writeLine(ctx, r[2], ax, y + (zh ? 4 : 0), 66, zh ? BRUSH : GARA, ease(u, t3 + 0.3, t3 + 1.4), { style: zh ? '' : 'italic', bleed: 7 });
    }
  });
  ctx.restore();
};

// ═══ 二 · 嘱咐：一页八行笺 ═══
SHOT.letter = (ctx, u, dur, sh) => {
  const zh = TL.lang === 'zh';
  ctx.save(); cam(ctx, 0.9 + 0.03 * (u / dur), CX, CY + 10);
  paper(ctx);
  const sw = 820, shh = 860, x0 = CX - sw / 2, y0 = CY - 40 - shh / 2;
  ctx.save();
  ctx.translate(CX, CY - 40); ctx.rotate(-0.012); ctx.translate(-CX, -(CY - 40));
  ctx.shadowColor = 'rgba(70,46,24,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgb(244,237,220)'; ctx.fillRect(x0, y0, sw, shh);
  ctx.shadowColor = 'transparent';
  const b1 = at(sh, 'b1'), b1e = at(sh, 'b1', 1), b2 = at(sh, 'b2'), b2e = at(sh, 'b2', 1), b3 = at(sh, 'b3'), b3e = at(sh, 'b3', 1);
  const k0 = ramp(u, lerp(b1, b1e, 0.62), b1e + 0.3);
  const kx = ramp(u, lerp(b2, b2e, 0.25), b2e + 0.2);
  const strike = smooth(ramp(u, b3 + 0.1, b3 + 0.9));
  const itemT = [0.5, 0.67, 0.84].map((f) => lerp(b3, b3e, f));
  const items = zh ? ['写给谁：第一次用它的人', '为了什么：看懂它能做什么', '哪里不能动：原文的事实'] : ['For whom: first-time users', 'For what: to see what it can do', 'Do not change: the facts'];
  if (zh) {
    const colW = sw / 9, top = y0 + 70, bot = y0 + shh - 70;
    ctx.strokeStyle = rgba(CINNABAR, 0.5); ctx.lineWidth = 1.6;
    for (let c = 0; c <= 8; c++) { const x = x0 + colW * (c + 0.5); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke(); }
    ctx.strokeRect(x0 + colW * 0.5, top, colW * 8, bot - top);
    const colX = (c) => x0 + sw - colW * (c + 1);
    const col = (c, text, k, size = 46, step = 58) => { const cs = [...text]; cs.forEach((ch, i) => writeChar(ctx, ch, colX(c), top + 44 + i * step, size, BRUSH, clamp(k * cs.length - i))); return cs.length; };
    col(0, '请帮我做一件事。', k0, 52, 70);
    const ex = ['你是一位拥有二十年', '经验的世界顶级专家。'];
    const n1 = [...ex[0]].length;
    col(1, ex[0], clamp(kx * 2)); col(2, ex[1], clamp(kx * 2 - 1));
    if (strike > 0) [1, 2].forEach((c, i) => inkStroke(ctx, [[colX(c) - 6, top + 14], [colX(c) + 4, top + 44 + (i ? 10 : n1) * 58 / 2], [colX(c) - 2, top + 44 + (i ? 10 : n1) * 58]], { w: 5, color: CINNABAR, p: clamp(strike * 2 - i), seed: 70 + i, dry: 0.3 }));
    items.forEach((it, n) => {
      const k = ramp(u, itemT[n], itemT[n] + 0.9), x = colX(4 + n);
      if (k > 0) { ctx.fillStyle = rgba(CINNABAR, 0.85 * ease(k, 0, 0.2)); ctx.beginPath(); ctx.arc(x, top + 26, 7, 0, TAU); ctx.fill(); }
      const cs = [...it]; cs.forEach((ch, i) => writeChar(ctx, ch, x, top + 70 + i * 56, 44, BRUSH, clamp(k * cs.length - i)));
    });
    seal(ctx, colX(7), bot - 60, 50, '敬上', { k: ease(u, itemT[2] + 1.2, itemT[2] + 1.8), seed: 4 });
  } else {
    const rowH = 92, left = x0 + 80, right = x0 + sw - 80;
    ctx.strokeStyle = rgba(CINNABAR, 0.45); ctx.lineWidth = 1.6;
    for (let r = 0; r < 8; r++) { const y = y0 + 120 + r * rowH; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(left + 40, y0 + 50); ctx.lineTo(left + 40, y0 + shh - 50); ctx.stroke();
    const Y = (r) => y0 + 120 + r * rowH - 22;
    writeLine(ctx, 'Please, do this for me.', left + 70, Y(0), 50, GARA, k0, { style: 'italic' });
    writeLine(ctx, 'You are a world-class expert', left + 70, Y(1), 42, GARA, clamp(kx * 2), { style: 'italic' });
    writeLine(ctx, 'with twenty years of experience.', left + 70, Y(2), 42, GARA, clamp(kx * 2 - 1), { style: 'italic' });
    if (strike > 0) [1, 2].forEach((r, i) => inkStroke(ctx, [[left + 60, Y(r) + 2], [left + 330, Y(r) - 6], [left + 600, Y(r) + 4]], { w: 5, color: CINNABAR, p: clamp(strike * 2 - i), seed: 70 + i, dry: 0.3 }));
    items.forEach((it, n) => {
      const k = ramp(u, itemT[n], itemT[n] + 0.9), y = Y(4 + n);
      if (k > 0) { ctx.fillStyle = rgba(CINNABAR, 0.85 * ease(k, 0, 0.2)); ctx.beginPath(); ctx.arc(left + 86, y, 7, 0, TAU); ctx.fill(); }
      writeLine(ctx, it, left + 110, y, 42, GARA, k, { style: 'italic' });
    });
    seal(ctx, right - 60, y0 + shh - 70, 50, '敬上', { k: ease(u, itemT[2] + 1.2, itemT[2] + 1.8), seed: 4 });
  }
  ctx.restore();
  ctx.restore();
};

// ═══ 小画与十层画框 ═══
const FRAME_COLORS = [[222, 212, 188], [132, 142, 146], [176, 146, 98], [88, 60, 42]];
function sketch(ctx, cx, cy, p) {
  inkStroke(ctx, [[cx - 92, cy + 52], [cx - 40, cy + 20], [cx + 10, cy - 6], [cx + 74, cy - 46]], { w: 4.2, p: ease(p, 0, 0.5), seed: 31, dry: 0.4 });
  inkStroke(ctx, [[cx - 14, cy + 4], [cx - 6, cy - 26], [cx + 6, cy - 50]], { w: 2.6, p: ease(p, 0.35, 0.7), seed: 32 });
  for (const [bx, by, r, d] of [[cx + 74, cy - 48, 11, 0.6], [cx + 4, cy - 52, 9, 0.7], [cx - 46, cy + 18, 8, 0.8]]) {
    const k = ease(p, d, d + 0.2);
    if (k <= 0) continue;
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 - 1.2;
      ctx.fillStyle = rgba(CINNABAR, 0.75 * k);
      ctx.beginPath(); ctx.arc(bx + Math.cos(a) * r * 0.75, by + Math.sin(a) * r * 0.75, r * 0.62, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = rgba([210, 170, 60], 0.9 * k); ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, TAU); ctx.fill();
  }
}
const FRAME_LABELS = {
  zh: ['角色', '背景', '目标', '技能', '约束', '工作流', '初始化', '输出格式', '示例', '注意事项'],
  en: ['ROLE', 'BACKGROUND', 'GOAL', 'SKILLS', 'CONSTRAINTS', 'WORKFLOW', 'INIT', 'OUTPUT FORMAT', 'EXAMPLES', 'NOTES'],
};
SHOT.frames = (ctx, u, dur, sh) => {
  paper(ctx);
  const zh = TL.lang === 'zh';
  const b = at(sh, 'b4'), be = at(sh, 'b4', 1);
  const F0 = lerp(b, be, 0.2), F1 = lerp(b, be, 0.78);
  const T = (i) => F0 + (i * (F1 - F0)) / 9;
  const s = lerp(1.9, 0.68, easeInOut(ramp(u, F0 - 0.4, F1 + 0.8)));
  const cy = CY - 40;
  ctx.save(); cam(ctx, s, CX, cy);
  const w0 = 250, h0 = 180;
  const bounds = []; let acc = 0;
  for (let i = 0; i < 10; i++) { acc += 22 + 5 * i; bounds.push(acc); }
  const labels = FRAME_LABELS[zh ? 'zh' : 'en'];
  for (let i = 9; i >= 0; i--) {
    const k = ease(u, T(i), T(i) + 0.3);
    if (k <= 0) continue;
    const m = bounds[i] * (1 + 0.04 * (1 - k)), w = w0 + 2 * m, h = h0 + 2 * m;
    const col = FRAME_COLORS[i % 4];
    ctx.save();
    ctx.globalAlpha = k;
    ctx.shadowColor = 'rgba(50,30,15,0.3)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = rgba(col, 1); ctx.fillRect(CX - w / 2, cy - h / 2, w, h);
    ctx.shadowColor = 'transparent';
    if (i % 4 === 2) {
      ctx.strokeStyle = 'rgba(120,90,40,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let d = -h; d < w; d += 14) { ctx.moveTo(CX - w / 2 + d, cy - h / 2); ctx.lineTo(CX - w / 2 + d + h, cy + h / 2); }
      ctx.save(); ctx.clip(new Path2D(`M${CX - w / 2} ${cy - h / 2}h${w}v${h}h${-w}z`)); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(40,25,10,0.35)'; ctx.lineWidth = 2;
    const inner = i ? bounds[i - 1] : 0, iw = w0 + 2 * inner, ih = h0 + 2 * inner;
    ctx.strokeRect(CX - iw / 2 - 1, cy - ih / 2 - 1, iw + 2, ih + 2);
    ctx.restore();
    // 每层画框的名字，写在上边框
    const th = 22 + 5 * i, dark = i % 4 === 1 || i % 4 === 3;
    inkText(ctx, labels[i], CX, cy - ih / 2 - th / 2 - 1, th * (zh ? 0.62 : 0.5), zh ? KAI : GARA,
      { color: dark ? [240, 232, 214] : INK, alpha: k * 0.9, bleed: 0, spacing: zh ? '2px' : '1px', style: zh ? '' : '600' });
  }
  ctx.fillStyle = 'rgb(243,236,218)'; ctx.fillRect(CX - w0 / 2, cy - h0 / 2, w0, h0);
  writeLine(ctx, zh ? '给猫起个名字。' : 'Name my cat.', CX, cy + 4, zh ? 30 : 32, zh ? BRUSH : GARA, ease(u, 0.3, 1.6), { style: zh ? '' : 'italic', align: 'center' });
  ctx.restore();
};

// ═══ 三 · 步骤：过河的石头，分岔的路 ═══
let MT_FAR, MT_MID, BRANCHES = [];
const STONES = [...Array(7).keys()].map((i) => { const q = i / 6; return { x: lerp(330, 1440, q), y: 880 - 210 * q - 50 * Math.sin(Math.PI * q), rx: 74 - 5 * i, ry: 22 - 1.4 * i }; });
INITS.push(() => {
  MT_FAR = makeMountains(3, 2400, 700, 470, 210, 0.22, 5);
  MT_MID = makeMountains(8, 2400, 700, 560, 130, 0.36, 2.5);
  // 从最后一块石头长出的枝杈
  const root = STONES[6];
  const grow = (x, y, a, len, d, path) => {
    if (d > 5) return;
    const pts = [[x, y]];
    for (let k = 1; k <= 3; k++) pts.push([x + Math.cos(a + noise1(d * 7 + k + path, 5) * 0.25) * len * k / 3, y + Math.sin(a + noise1(d * 3 + k + path, 6) * 0.25) * len * k / 3]);
    BRANCHES.push({ pts, d, w: 10 * Math.pow(0.66, d) });
    const [ex, ey] = pts.at(-1);
    const nk = d < 2 ? 2 : 2 + (rand(path, d) > 0.5);
    for (let c = 0; c < nk; c++) grow(ex, ey, a + (c / (nk - 1) - 0.5) * (0.95 - d * 0.06) + (rand(path + c, d) - 0.5) * 0.3, len * (0.7 + rand(path, c + d) * 0.12), d + 1, path * 3 + c + 1);
  };
  grow(root.x, root.y - 14, -Math.PI / 2 - 0.12, 150, 0, 1);
});
function stone(ctx, s, k) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = rgba(INK, 0.78);
  ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba(PAPER, 0.28);
  ctx.beginPath(); ctx.ellipse(s.x - s.rx * 0.18, s.y - s.ry * 0.35, s.rx * 0.55, s.ry * 0.35, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
SHOT.stones = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 1.03 - 0.03 * (u / dur));
  paper(ctx);
  ctx.drawImage(MT_FAR, -240 - u * 5, -20);
  // 河面
  ctx.save();
  for (let r = 0; r < 26; r++) {
    const y = 610 + r * (8 + r * 0.55);
    ctx.strokeStyle = rgba(INK, 0.1 + 0.12 * (r / 26)); ctx.lineWidth = 1 + r * 0.04;
    ctx.beginPath();
    let on = false;
    for (let x = 0; x <= W; x += 10) {
      const v = noise2((x + u * 18 * (1 + r * 0.05)) / 130, r * 1.7, 2);
      if (v > 0.15) { on ? ctx.lineTo(x, y + Math.sin(x / 60 + u) * 1.5) : ctx.moveTo(x, y); on = true; } else on = false;
    }
    ctx.stroke();
  }
  ctx.restore();
  // 两岸
  for (const [x, y, rx, ry] of [[40, 980, 420, 160], [1880, 620, 360, 90]]) {
    const g = ctx.createRadialGradient(x, y, 10, x, y, rx);
    g.addColorStop(0, rgba(INK, 0.45)); g.addColorStop(1, rgba(INK, 0));
    ctx.save(); ctx.scale(1, ry / rx); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y * rx / ry, rx, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 一步一步
  const c1 = at(sh, 'c1'), c1e = at(sh, 'c1', 1), c2 = at(sh, 'c2'), c2e = at(sh, 'c2', 1);
  const S0 = lerp(c1, c1e, 0.36), S1 = c1e + 0.4;
  STONES.forEach((s, i) => {
    const t0 = S0 + (i * (S1 - S0)) / 6;
    const k = ease(u, t0, t0 + 0.3);
    if (k <= 0) return;
    for (let ring = 0; ring < 2; ring++) {
      const q = ramp(u, t0 + ring * 0.25, t0 + 2.2 + ring * 0.25);
      if (q <= 0 || q >= 1) continue;
      ctx.strokeStyle = rgba(INK, 0.3 * (1 - q)); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, s.rx * (1 + q * 1.4), s.ry * (1 + q * 1.4), 0, 0, TAU); ctx.stroke();
    }
    stone(ctx, s, k);
    if (i % 2 === 0) {
      const lab = (TL.lang === 'zh' ? ['先分析', '再拆解', '逐步求解', '最后检查'] : ['analyze', 'break it down', 'solve', 'check'])[i / 2];
      inkText(ctx, lab, s.x, s.y + 48, 26, TL.lang === 'zh' ? KAI : GARA, { alpha: k * 0.85, style: TL.lang === 'zh' ? '' : 'italic' });
    }
  });
  // 走错了，就回头：一串墨点探出去，又收回来
  const last = STONES[6];
  const wrong = [[last.x, last.y - 10], [last.x + 120, last.y - 30], [last.x + 230, last.y - 110], [last.x + 260, last.y - 230]];
  const wp = ease(u, c2 + 0.1, lerp(c2, c2e, 0.28)) - ease(u, lerp(c2, c2e, 0.3), lerp(c2, c2e, 0.45));
  if (wp > 0) {
    const S = strokeOf(wrong);
    const n = Math.floor(S.P.length * wp);
    ctx.fillStyle = rgba(INK, 0.7);
    for (let i = 0; i < n; i += 11) { ctx.beginPath(); ctx.arc(S.P[i][0], S.P[i][1], 3.2, 0, TAU); ctx.fill(); }
  }
  // 那一句最有名的话
  const zh = TL.lang === 'zh';
  writeLine(ctx, zh ? '“让我们一步一步地思考。”' : '\u201cLet\u2019s think step by step.\u201d', CX, 150, zh ? 50 : 54, zh ? BRUSH : GARA, ramp(u, lerp(c1, c1e, 0.55), c1e + 0.2), { style: zh ? '' : 'italic', align: 'center', bleed: 5 });
  // 一条不够，就分出许多条
  const g = ramp(u, lerp(c2, c2e, 0.5), c2e + 1.6);
  for (const b of BRANCHES) {
    const p = clamp(g * 6 - b.d);
    if (p > 0) inkStroke(ctx, b.pts, { w: b.w, p, seed: b.d * 13 + b.pts[0][0], dry: 0.3, bleed: 0.6 });
  }
  ctx.restore();
};

// ═══ 五位先生：其实是同一个人 ═══
function scholar(ctx, x, y, s = 1, a = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = rgba(INK, 0.84 * a);
  ctx.beginPath(); // 宽袍
  ctx.moveTo(-14, -66);
  ctx.bezierCurveTo(-50, -60, -70, -30, -80, 10);
  ctx.bezierCurveTo(-92, 44, -96, 70, -88, 86);
  ctx.lineTo(88, 86);
  ctx.bezierCurveTo(96, 70, 92, 44, 80, 10);
  ctx.bezierCurveTo(70, -30, 50, -60, 14, -66);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(PAPER, 0.55 * a); ctx.lineWidth = 3; // 交领与袖褶
  ctx.beginPath(); ctx.moveTo(-14, -64); ctx.lineTo(8, -20); ctx.moveTo(14, -64); ctx.lineTo(-4, -30);
  ctx.moveTo(-60, 20); ctx.quadraticCurveTo(-40, 50, -20, 60); ctx.moveTo(60, 20); ctx.quadraticCurveTo(40, 50, 20, 60); ctx.stroke();
  ctx.fillStyle = rgba(INK, 0.9 * a);
  ctx.beginPath(); ctx.arc(0, -90, 21, 0, TAU); ctx.fill(); // 头
  ctx.fillRect(-15, -124, 30, 22); // 幞头
  ctx.fillRect(-46, -112, 92, 4); // 展脚
  ctx.restore();
}
SHOT.scholars = (ctx, u, dur, sh) => {
  paper(ctx);
  const c3 = at(sh, 'c3'), c3e = at(sh, 'c3', 1);
  const M = lerp(c3, c3e, 0.55);
  const m = easeInOut(ramp(u, M, M + 1.9));
  const y = CY + 10;
  // 几笔远山作背景
  ctx.globalAlpha = 0.55; ctx.drawImage(MT_MID, -300, -140); ctx.globalAlpha = 1;
  [-480, -240, 0, 240, 480].forEach((dx, i) => {
    const k = ease(u, 0.4 + i * 0.32, 0.9 + i * 0.32);
    if (k > 0) scholar(ctx, CX + dx * (1 - m), y, 1, k);
  });
  const sk = ease(u, c3 + 0.2, c3 + 0.7) * (1 - ease(u, M + 1.4, M + 2.2));
  slip(ctx, CX, 170, TL.lang === 'zh' ? 640 : 700, 96, -0.02, TL.lang === 'zh' ? '请扮演五位专家，开会讨论。' : 'ACT AS FIVE EXPERTS IN A MEETING', { alpha: sk, scale: 1.1 - 0.1 * sk });
  const tk = 1 - m;
  if (tk > 0.01) {
    inkStroke(ctx, [[CX - 640, y + 92], [CX, y + 88], [CX + 640, y + 94]], { w: 7, alpha: tk, seed: 41, dry: 0.5 });
    for (const lx of [-590, 590]) inkStroke(ctx, [[CX + lx, y + 96], [CX + lx + 4, y + 190]], { w: 5, alpha: tk, seed: 42 + lx });
    // 桌上的茶盏与卷册
    for (let i = 0; i < 4; i++) { ctx.fillStyle = rgba(INK, 0.6 * tk); ctx.beginPath(); ctx.ellipse(CX - 360 + i * 240, y + 80, 18, 7, 0, 0, TAU); ctx.fill(); }
  }
};

// ═══ 四 · 补丁：一块补丁盖住一道裂缝，又撑开另一道 ═══
function crackPts(x, y, a, n, seed) {
  const pts = [[x, y]];
  for (let i = 0; i < n; i++) { a += (rand(i, seed) - 0.5) * 0.9; x += Math.cos(a) * 30; y += Math.sin(a) * 30; pts.push([x, y]); }
  return pts;
}
let CRACKS = null;
INITS.push(() => {
  const A = crackPts(540, 120, 1.2, 22, 3);
  const pa = A[11];
  const B = crackPts(pa[0] + 140, pa[1] + 30, 0.35, 20, 7);
  const pb = B[10];
  const Cc = crackPts(pb[0] + 40, pb[1] - 100, -1.1, 14, 11);
  CRACKS = { A, B, C: Cc, pa, pb };
});
function drawCrack(ctx, pts, p) {
  if (p <= 0) return;
  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = rgba(PAPER.map((v) => Math.min(255, v + 14)), 0.9); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.translate(1.5, 1.5); polyProgress(ctx, pts, p); ctx.stroke();
  ctx.translate(-1.5, -1.5);
  ctx.strokeStyle = rgba(INK, 0.8); ctx.lineWidth = 2.2;
  ctx.beginPath(); polyProgress(ctx, pts, p); ctx.stroke();
  // 细小的分叉
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(INK, 0.5);
  const n = Math.floor((pts.length - 1) * p);
  for (let i = 2; i < n; i += 3) {
    const [x, y] = pts[i], a = rand(i, pts.length) * TAU;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); ctx.stroke();
  }
  ctx.restore();
}
function patch(ctx, x, y, w, h, rot, k, seed) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1.1 - 0.1 * k, 1.1 - 0.1 * k);
  ctx.globalAlpha = k;
  ctx.beginPath();
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const q = i / 40, side = Math.floor(q * 4), f = q * 4 - side;
    const [px, py] = [[-w / 2 + f * w, -h / 2], [w / 2, -h / 2 + f * h], [w / 2 - f * w, h / 2], [-w / 2, h / 2 - f * h]][side];
    const j = (rand(i, seed) - 0.5) * 9;
    pts.push([px + j, py + j]);
  }
  pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath();
  ctx.shadowColor = 'rgba(60,40,20,0.3)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = 'rgb(230,216,186)'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(150,120,80,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
const PATCH_TEXT = {
  zh: ['严禁解释', '只许输出标签', '禁止尾逗号', '标签外不许有字', '再次警告'],
  en: ['NO EXPLANATIONS', 'ONLY THE TAGS', 'NO TRAILING COMMAS', 'NOTHING OUTSIDE THE TAGS', 'FINAL WARNING'],
};
// 一张写着名字的小卡：引号被“修复”之后，名字也坏了
function nameCard(ctx, x, y, broke, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(0.05 + 0.08 * broke);
  ctx.globalAlpha = k;
  ctx.shadowColor = 'rgba(60,40,20,0.3)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = 'rgb(248,242,226)'; ctx.fillRect(-150, -48, 300, 96);
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;
  ctx.font = `italic 56px ${GARA}`; ctx.textBaseline = 'middle';
  const A = 'O', Bq = broke > 0.5 ? '\u201d' : '\u2019', C = 'Connor';
  const wa = ctx.measureText(A).width, wb = ctx.measureText(Bq).width, wc = ctx.measureText(C).width;
  let x0 = -(wa + wb + wc) / 2;
  inkText(ctx, A, x0, 4, 56, GARA, { align: 'left', style: 'italic', alpha: k });
  inkText(ctx, Bq, x0 + wa, 4, 56, GARA, { align: 'left', style: 'italic', alpha: k, color: broke > 0.5 ? CINNABAR : INK });
  inkText(ctx, C, x0 + wa + wb, 4, 56, GARA, { align: 'left', style: 'italic', alpha: k });
  if (broke > 0) { ctx.strokeStyle = rgba(INK, 0.75 * broke); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-150, -30); ctx.lineTo(-40, 6); ctx.lineTo(10, -8); ctx.lineTo(150, 36); ctx.stroke(); }
  ctx.restore();
}
SHOT.patches = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 1.0 + 0.04 * (u / dur));
  paper(ctx);
  const d1 = at(sh, 'd1'), d1e = at(sh, 'd1', 1), d2 = at(sh, 'd2'), d2e = at(sh, 'd2', 1);
  const { A, B, C: Cc, pa, pb } = CRACKS;
  const zh = TL.lang === 'zh';
  drawCrack(ctx, A, ease(u, 0.4, lerp(d1, d1e, 0.35)));
  // 补丁 A：把单引号全换成双引号
  const kA = ease(u, d2 + 0.1, d2 + 0.4);
  patch(ctx, pa[0], pa[1], 290, 210, 0.07, kA, 5);
  if (kA > 0) {
    ctx.save(); ctx.translate(pa[0], pa[1]); ctx.rotate(0.07);
    inkText(ctx, '\u2019  \u2192  \u201d', 0, -24, 60, GARA, { alpha: kA });
    inkText(ctx, zh ? '单引号全换成双引号' : 'every \u2019 becomes \u201d', 0, 46, zh ? 24 : 26, zh ? KAI : GARA, { alpha: kA * 0.85, style: zh ? '' : 'italic' });
    ctx.restore();
  }
  // 裂缝 B 一路裂到名字卡上
  const pB = ease(u, lerp(d2, d2e, 0.3), lerp(d2, d2e, 0.78));
  drawCrack(ctx, B, pB);
  const nc = B[Math.round((B.length - 1) * 0.86)];
  nameCard(ctx, nc[0] + 30, nc[1] + 10, ease(u, lerp(d2, d2e, 0.76), lerp(d2, d2e, 0.84)), ease(u, d2 + 0.3, d2 + 0.8));
  drawCrack(ctx, Cc, ease(u, d2e + 0.5, dur + 0.5));
  patch(ctx, pb[0], pb[1], 220, 170, -0.05, ease(u, d2e + 0.1, d2e + 0.4), 9);
  const texts = PATCH_TEXT[zh ? 'zh' : 'en'];
  texts.forEach((tx, i) => {
    const t0 = lerp(d1, d1e, 0.3) + i * 0.4, k = ease(u, t0, t0 + 0.22);
    if (k <= 0) return;
    slip(ctx, 1270 + (i % 2) * 230 + rand(i, 3) * 40, 180 + i * 86 + rand(i, 4) * 16, zh ? 130 + [...tx].length * 40 : 120 + tx.length * 17, zh ? 92 : 80, (rand(i, 5) - 0.5) * 0.24, tx, { alpha: k, scale: 1.14 - 0.14 * k });
  });
  ctx.restore();
};

// ═══ 立轴：形状交给画框，对不对还要人来看 ═══
let MT_SCROLL, MT_SCROLL2;
INITS.push(() => { MT_SCROLL = makeMountains(21, 460, 640, 300, 150, 0.6, 2); MT_SCROLL2 = makeMountains(5, 460, 640, 420, 90, 0.4, 3.5); });
function scrollPainting(ctx, x, y, w, h, u) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = 'rgb(242,235,217)'; ctx.fillRect(x, y, w, h);
  ctx.drawImage(MT_SCROLL2, x - 10 - u * 2, y - 10);
  ctx.drawImage(MT_SCROLL, x - 20, y + 40);
  // 水与一叶小舟
  ctx.strokeStyle = rgba(INK, 0.25); ctx.lineWidth = 1;
  for (let r = 0; r < 5; r++) { ctx.beginPath(); ctx.moveTo(x + 40 + r * 12, y + h - 120 + r * 16); ctx.lineTo(x + w - 60 - r * 20, y + h - 120 + r * 16); ctx.stroke(); }
  inkStroke(ctx, [[x + w * 0.55, y + h - 128], [x + w * 0.62, y + h - 122], [x + w * 0.7, y + h - 128]], { w: 3.5, seed: 77, dry: 0 });
  ctx.fillStyle = rgba(INK, 0.85); ctx.fillRect(x + w * 0.635, y + h - 142, 3, 14);
  ctx.restore();
}
SHOT.scroll = (ctx, u, dur, sh) => {
  ctx.save(); cam(ctx, 0.92 - 0.02 * (u / dur), CX, CY - 10);
  paper(ctx);
  const d3 = at(sh, 'd3'), d3e = at(sh, 'd3', 1);
  const pw = 420, ph = 580, px = CX - pw / 2, py = CY - 40 - ph / 2;
  const m = easeInOut(ramp(u, lerp(d3, d3e, 0.05), lerp(d3, d3e, 0.42)));
  if (m > 0) {
    const L = lerp(px, CX - 290, m), R = lerp(px + pw, CX + 290, m), T = lerp(py, 70, m), Bm = lerp(py + ph, 900, m);
    ctx.save();
    ctx.globalAlpha = ease(m, 0, 0.3);
    ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(CX - 200, 46); ctx.lineTo(CX, -40); ctx.lineTo(CX + 200, 46); ctx.stroke();
    ctx.shadowColor = 'rgba(50,30,15,0.3)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgb(134,146,148)'; ctx.fillRect(L, T, R - L, Bm - T);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgb(222,212,186)'; ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28);
    ctx.fillStyle = 'rgb(104,116,118)'; // 惊燕
    ctx.fillRect(CX - 60, T, 8, (py - T) * 0.7); ctx.fillRect(CX + 52, T, 8, (py - T) * 0.7);
    ctx.fillStyle = 'rgb(70,46,30)';
    ctx.fillRect(L - 16, T - 18, R - L + 32, 18); // 天杆
    ctx.fillRect(L - 26, Bm, R - L + 52, 24); // 地轴
    ctx.beginPath(); ctx.arc(L - 30, Bm + 12, 16, 0, TAU); ctx.arc(R + 30, Bm + 12, 16, 0, TAU); ctx.fill();
    ctx.restore();
  }
  scrollPainting(ctx, px, py, pw, ph, u);
  // 题款与审定印
  [...'丙午秋'].forEach((ch, i) => inkText(ctx, ch, px + pw - 36, py + 50 + i * 36, 28, KAI, { alpha: 0.8 }));
  seal(ctx, px + 70, py + ph - 70, 64, '审定', { k: ease(u, lerp(d3, d3e, 0.74), lerp(d3, d3e, 0.74) + 0.6), seed: 17 });
  ctx.restore();
};
