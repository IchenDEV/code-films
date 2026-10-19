// 镜头 B：六层筛子 —— 总览（虫子往下掉，每层拦住一些），然后一层一层：自己先验证、AI 审查、标签、安全与自动化、按风险批准、合并与回滚。

// 六层筛子：每一层是一块斜放的玻璃板，板上有洞；虫子从上面掉下来，大多在前几层被拦住，极少数掉进最底下回滚的网
const SIEVE = (() => {
  const catchAt = [0, 1, 0, 2, 0, 0, 3, 1, 0, 4, 0, 2, 0, 1, 5, 6, 0, 0]; // 6 = 掉进回滚的网
  return catchAt.map((L, i) => ({ L, x: (rand(i, 41) - 0.5) * 0.86, t: i * 0.42 }));
})();
const LAYERC = [C.clay, C.violet, C.red, C.blue, C.gold, C.mint];
SHOT.sieve = (g, c) => {
  const u = c.u, a6 = c.k('six', 1.2), an = c.k('net', a6 + 1.6), af = c.k('few');
  tint(g, C.blueRGB, 0.35);
  const top = P ? -SH + 70 : -SH + 70, gap = P ? 72 : 80, pw = P ? 470 : 860, ox = P ? 80 : 120, sk = P ? 34 : 60;
  const ys = [...Array(6).keys()].map((i) => top + i * gap), ny = top + 6 * gap + (P ? 10 : 6);
  // 开头：只有一道门（“答案不是一道门”）
  const gateK = 1 - ease(u, a6 - 0.35, a6);
  if (gateK > 0.01) {
    g.save(); g.globalAlpha = gateK;
    panel(g, ox - 140, -40, 280, 80, { r: 14, fill: C.panel2, stroke: C.dim });
    txt(g, ZH ? '一道门' : 'one gate', ox, 0, 40, C.dim, { weight: '900' });
    line(g, ox - 160, -60, ox + 160, 60, C.red, 10 * ease(u, 0.3, 0.7));
    g.restore();
  }
  // 洞开在会穿过这一层的虫子的位置上；靠得太近的合成一个
  const holeX = (i) => SIEVE.filter((b) => b.L > i).map((b) => b.x * pw).sort((a, b) => a - b).filter((x, j, a) => !j || x - a[j - 1] > 70);
  // 板子
  ys.forEach((y, i) => {
    const k = pop(u, a6 - 0.05 + i * 0.1, 0.4);
    if (k <= 0) return;
    g.save(); g.translate(ox, y); g.scale(1, k);
    const col = hex(LAYERC[i]);
    g.beginPath(); g.moveTo(-pw / 2 + sk, -14); g.lineTo(pw / 2 + sk, -14); g.lineTo(pw / 2 - sk, 14); g.lineTo(-pw / 2 - sk, 14); g.closePath();
    g.fillStyle = rgba(col, 0.32); g.fill(); g.lineWidth = 3; g.strokeStyle = rgba(col, 0.95); g.stroke();
    for (const hx of holeX(i)) { g.fillStyle = 'rgba(4,6,18,0.9)'; g.beginPath(); g.ellipse(hx, 0, 26, 7, 0, 0, TAU); g.fill(); }
    g.restore();
    const lab = T(TL.txt.layers)[i];
    txt(g, `${i + 1}  ${lab}`, P ? -SW + 6 : ox - pw / 2 - sk - 30, y, P ? 22 : 28, LAYERC[i], { align: P ? 'left' : 'right', weight: '900', alpha: ease(u, a6 + i * 0.1, a6 + i * 0.1 + 0.3) });
  });
  // 回滚的网
  const nk = ease(u, an - 0.2, an + 0.3);
  if (nk > 0) {
    let sag = 0;
    const netBug = SIEVE.find((b) => b.L === 6), tb = a6 + 0.5 + netBug.t;
    const fallT = (y1) => Math.sqrt((2 * (y1 - (-SH - 60))) / 1400);
    if (u > tb + fallT(ny)) sag = 30 * Math.exp(-(u - tb - fallT(ny)) * 3) * Math.cos((u - tb - fallT(ny)) * 14) + 12;
    g.save(); g.globalAlpha = nk; g.strokeStyle = rgba(C.mintRGB, 0.9); g.lineWidth = 3;
    const nw = pw * 0.55 * nk;
    g.beginPath(); g.moveTo(ox - nw, ny - 10); g.quadraticCurveTo(ox, ny + 40 + sag, ox + nw, ny - 10); g.stroke();
    for (let j = -4; j <= 4; j++) { const x = ox + (j / 4) * nw * 0.9; g.beginPath(); g.moveTo(x, ny - 10); g.lineTo(x * 0.98 + ox * 0.02, ny + 26 + sag * (1 - Math.abs(j) / 5)); g.stroke(); }
    g.restore();
    txt(g, '↺ ' + T(TL.txt.rollback), P ? -SW + 6 : ox - pw / 2 - sk - 30, ny + 10, P ? 22 : 28, C.mint, { align: P ? 'left' : 'right', weight: '900', alpha: nk });
  }
  // 虫子
  if (u > a6) {
    for (const b of SIEVE) {
      const t0 = a6 + 0.5 + b.t, d = u - t0;
      if (d < 0) continue;
      const stopY = b.L < 6 ? ys[b.L] - 18 : ny + 6;
      const y = Math.min(stopY, -SH - 60 + 0.5 * 1400 * d * d);
      const landed = y >= stopY, tl = landed ? d - Math.sqrt((2 * (stopY + SH + 60)) / 1400) : 0;
      const fade = b.L < 6 ? 1 - ease(tl, 0.5, 1.1) : 1;
      if (fade <= 0) continue;
      const x = ox + b.x * pw;
      if (landed && tl < 0.4) glow(g, x, stopY, 70, hex(b.L < 6 ? LAYERC[b.L] : C.mint), 0.8 * (1 - tl / 0.4));
      bug(g, x, y, P ? 0.8 : 0.9, u, { seed: b.t * 10, alpha: fade, still: landed, rot: landed ? 0 : Math.sin(d * 9) * 0.3 });
    }
  }
  if (c.has('few') && u > af - 0.1) chip(g, ZH ? '每层都会漏 · 很少能穿过全部' : 'every layer misses some · few get through all', ox, -SH + 10, P ? 26 : 32, '#0b1124', C.gold, { weight: '900', alpha: ease(u, af, af + 0.3) });
};

// 第一层：Claude 自己跑测试、构建、截图；再开一个全新上下文的分身来审
SHOT.selfcheck = (g, c) => {
  const u = c.u, at = c.k('test', 0.6), ad = c.k('done'), af = c.k('fresh', c.line(1) + 0.4);
  tint(g, C.clayRGB, 0.35);
  // 终端
  const tx = P ? -390 : -760, ty = P ? -290 : -300, tw = P ? 470 : 760, th = P ? 290 : 420;
  panel(g, tx, ty, tw, th, { r: 18, fill: '#0b1124', stroke: C.line });
  for (let i = 0; i < 3; i++) { g.fillStyle = ['#ff5f57', '#febc2e', '#28c840'][i]; g.beginPath(); g.arc(tx + 26 + i * 22, ty + 22, 7, 0, TAU); g.fill(); }
  const items = [T(TL.txt.tests), T(TL.txt.build), T(TL.txt.lint), T(TL.txt.shot)];
  items.forEach((s, i) => {
    const ti = at + 0.1 + i * 0.32;
    if (u < ti - 0.2) return;
    const y = ty + 70 + i * (th - 90) / 4, run = ease(u, ti - 0.2, ti);
    txt(g, '$ ' + s, tx + 30, y, P ? 28 : 34, C.dim, { family: F.mono, align: 'left', weight: '600' });
    g.fillStyle = rgba(C.dimRGB, 0.3); rr(g, tx + tw * 0.5, y - 8, tw * 0.3, 16, 8); g.fill();
    g.fillStyle = C.mint; rr(g, tx + tw * 0.5, y - 8, tw * 0.3 * run, 16, 8); g.fill();
    if (u >= ti) okBadge(g, tx + tw - 40, y, 18);
  });
  // Claude 本人
  const bx = P ? -260 : -560, by = P ? 190 : 230;
  bot(g, bx, by, P ? 1.1 : 1.3, u, { mood: u > at + 1.4 ? 'happy' : 'focus', seed: 1, look: 1 });
  // 长版：“做完了” → 拿出结果
  if (c.has('done') && u > ad - 0.5) {
    const k = pop(u, ad - 0.4);
    g.save(); g.translate(bx + 40, by - 150); g.scale(k, k);
    panel(g, -120, -40, 240, 80, { r: 40, fill: '#f4efe6', stroke: null });
    txt(g, ZH ? '“做完了”' : '"Done."', 0, 2, 34, '#141a33', { weight: '900' });
    line(g, -100, 10, lerp(-100, 100, ease(u, ad + 0.2, ad + 0.5)), -10, C.red, 8);
    g.restore();
    chip(g, T(TL.txt.showOutput), tx + tw / 2, ty + th + 36, P ? 26 : 30, '#06251b', C.mint, { weight: '900', alpha: ease(u, ad + 0.4, ad + 0.7) });
  }
  // 分身：全新上下文，审这次改动
  if (u > af - 0.4) {
    const k = pop(u, af - 0.3);
    const fx = P ? 220 : 420, fy = P ? 60 : 40;
    g.save(); g.translate(fx, fy); g.scale(k, k);
    codePanel(g, P ? -170 : -260, -250, P ? 340 : 520, P ? 230 : 300, { seed: 12, lh: 26, title: 'diff', hi: 3 });
    bot(g, 0, P ? 150 : 190, P ? 1.05 : 1.25, u, { color: '#9b84ff', dark: '#6d58d6', mood: 'focus', seed: 8, look: -0.6, glow: 1, glowRGB: C.violetRGB });
    magnifier(g, P ? 40 : 60, -120, P ? 52 : 64, 2.3);
    g.restore();
    // 从 Claude 指向分身的虚线
    g.save(); g.setLineDash([12, 12]); g.lineDashOffset = -u * 40; line(g, bx + 70, by - 30, fx - 90, fy + 150, rgba(C.violetRGB, 0.8 * k), 4); g.restore();
    chip(g, '✦ ' + T(TL.txt.fresh), fx, P ? -SH + 16 : -SH + 24, P ? 28 : 32, C.ink, rgba(C.violetRGB, 0.9), { weight: '900', alpha: ease(u, af, af + 0.3) });
  }
};

// Boris Cherny 的话（据博客转述）：让 Claude 能验证自己的结果，可能是最重要的一件事；结果好 2–3 倍
SHOT.quote = (g, c) => {
  const u = c.u, ab = c.k('boris', 0.5), a3 = c.k('x3', c.line(1) + 0.4);
  tint(g, C.goldRGB, 0.3);
  const k = pop(u, 0.05);
  g.save(); g.scale(k, k);
  const w = P ? 780 : 1240, h = P ? 400 : 420;
  panel(g, -w / 2, -h / 2 - 40, w, h, { r: 30, fill: '#f4efe6', stroke: null });
  txt(g, '“', -w / 2 + 70, -h / 2 + 30, 160, C.clay, { family: F.grot });
  // 引文按宽度分行
  const q = T(TL.txt.borisQuote), size = P ? 46 : 56;
  g.save(); setFont(g, size, FT(), '900');
  const units = ZH ? [...q] : q.split(/(?<=\s)/), lines = [];
  let cur = '';
  for (const s of units) { if (g.measureText(cur + s).width > w - 160 && cur) { lines.push(cur); cur = s.trimStart(); } else cur += s; }
  lines.push(cur); g.restore();
  lines.forEach((l, i) => txt(g, l, 0, -h / 2 + 90 + i * size * 1.3, size, '#141a33', { weight: '900' }));
  txt(g, T(TL.txt.boris), 0, h / 2 - 110, P ? 28 : 32, '#4a5070', { weight: '700', alpha: ease(u, ab, ab + 0.4) });
  txt(g, T(TL.txt.viaBlog), 0, h / 2 - 70, P ? 20 : 22, '#7a7f96', { weight: '500', alpha: ease(u, ab, ab + 0.4) });
  g.restore();
  if (u >= a3) slam(g, T(TL.txt.better23), 0, P ? 250 : 270, P ? 64 : 80, C.gold, u, a3);
};

// CLAUDE.md 与 REVIEW.md：反复出现的同一条意见，飞进文件里
SHOT.docs = (g, c) => {
  const u = c.u, a1 = c.k('cm', 1.5), a2 = c.k('rm', a1 + 0.8), al = c.k('lies', c.line(1) + 1.5);
  tint(g, C.blueRGB, 0.35);
  const xs = P ? [-200, 200] : [-330, 330], dw = P ? 360 : 500, dh = P ? 400 : 460;
  [['CLAUDE.md', T(TL.txt.claudeMd), a1, C.clay], ['REVIEW.md', T(TL.txt.reviewMd), a2, C.violet]].forEach(([name, desc, at, col], i) => {
    const k = pop(u, at - 0.3);
    if (k <= 0) return;
    g.save(); g.translate(xs[i], 20); g.scale(k, k);
    panel(g, -dw / 2, -dh / 2, dw, dh, { r: 18, fill: '#f4efe6', stroke: null });
    g.fillStyle = col; rr(g, -dw / 2, -dh / 2, dw, 70, 18); g.fill(); g.fillRect(-dw / 2, -dh / 2 + 40, dw, 30);
    txt(g, name, 0, -dh / 2 + 36, P ? 36 : 42, '#141a33', { family: F.mono, weight: '700' });
    for (let j = 0; j < 6; j++) { g.fillStyle = 'rgba(20,26,51,0.25)'; rr(g, -dw / 2 + 30, -dh / 2 + 110 + j * 36, (dw - 60) * (0.5 + rand(j, i + 3) * 0.5), 14, 7); g.fill(); }
    txt(g, desc, 0, dh / 2 - 50, P ? 24 : 28, '#4a5070', { weight: '700', maxW: dw - 30 });
    g.restore();
  });
  // 同一条意见反复出现，然后飞进文件
  for (let j = 0; j < 3; j++) {
    const t0 = 0.2 + j * 0.35, fly = ease(u, a1 - 0.2 + j * 0.15, a1 + 0.4 + j * 0.15);
    if (u < t0) continue;
    const x = lerp((j - 1) * (P ? 230 : 380), xs[j % 2], fly), y = lerp(P ? -230 : -260, 0, fly), s = lerp(1, 0.2, fly);
    if (fly >= 1) continue;
    g.save(); g.translate(x, y); g.scale(s * pop(u, t0), s * pop(u, t0));
    bubble(g, 0, 0, ZH ? '又是这个问题…' : 'This again…', '#2a1206', C.gold, P ? 26 : 30);
    g.restore();
  }
  if (u > al - 0.2) {
    dim(g, 0.6 * ease(u, al - 0.2, al + 0.2));
    T(TL.txt.fails).forEach((s, i) => slam(g, s, 0, (i ? 1 : -1) * (P ? 70 : 80), P ? 48 : 62, i ? C.ink : C.gold, u, al + i * 0.5, { family: FT(), weight: '900', ring: false, maxW: 2 * SW - 40 }));
  }
};
// 对话气泡（从上一部沿用）
function bubble(g, x, y, s, fg, bgc, size = 32) {
  const w = textW(g, s, size, FT(), '700') + size * 1.4, h = size * 2.1;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,10,0.35)'; rr(g, -w / 2 + 5, -h / 2 + 7, w, h, h / 2); g.fill();
  g.fillStyle = bgc; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill();
  g.beginPath(); g.moveTo(-w / 2 + 40, h / 2 - 4); g.lineTo(-w / 2 + 30, h / 2 + 22); g.lineTo(-w / 2 + 70, h / 2 - 4); g.fill();
  txt(g, s, 0, 2, size, fg, { weight: '700' });
  g.restore();
}

// 第二层：几个 AI 同时找 bug，另一组投票，够多 AI 认可才贴出来
SHOT.jury = (g, c) => {
  const u = c.u, ah = c.k('hunt', 0.8), av = c.k('vote', ah + 1.2), ar = c.k('real', av + 1.0);
  tint(g, C.violetRGB, 0.4);
  const pw = P ? 520 : 760, ph = P ? 300 : 340, py = P ? -SH + 10 : -SH + 10;
  codePanel(g, -pw / 2, py, pw, ph, { seed: 31, lh: 28, title: 'PR · diff' });
  // 三个找 bug 的
  const hunters = P ? [[-330, -90], [330, -110], [-330, 80]] : [[-560, -150], [560, -170], [-560, 40]];
  hunters.forEach(([x, y], i) => {
    const k = pop(u, ah - 0.4 + i * 0.1);
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    bot(g, 0, 0, P ? 0.8 : 0.95, u, { seed: i + 20, mood: 'focus', look: x < 0 ? 1 : -1 });
    magnifier(g, (x < 0 ? 1 : -1) * 64, -40, 28, x < 0 ? 2.3 : 0.8);
    g.restore();
  });
  // 发现：5 条
  const keep = [true, false, false, true, false];
  const fx = (j) => -pw / 2 + 60 + ((j * 0.19 + 0.08) % 1) * (pw - 120), fy = (j) => py + 70 + (j % 4) * 58;
  const drop = ease(u, ar - 0.1, ar + 0.6);
  for (let j = 0; j < 5; j++) {
    const k = pop(u, ah + 0.2 + j * 0.22);
    if (k <= 0) continue;
    const gone = keep[j] ? 0 : drop;
    const x = fx(j), y = fy(j) + gone * 400;
    g.save(); g.translate(x, y); g.scale(k * (1 - 0.4 * gone), k * (1 - 0.4 * gone)); g.globalAlpha = 1 - gone;
    const surv = keep[j] && drop > 0;
    if (surv) glow(g, 0, 0, 60, C.mintRGB, 0.7);
    g.fillStyle = surv ? C.mint : C.gold; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
    txt(g, '!', 0, 2, 32, '#0b1124', { family: F.grot, weight: '700' });
    g.restore();
  }
  // 投票的一排
  const vy = P ? 220 : 240, nv = P ? 5 : 7;
  for (let i = 0; i < nv; i++) {
    const k = pop(u, av - 0.4 + i * 0.05);
    if (k <= 0) continue;
    const x = (i - (nv - 1) / 2) * (P ? 150 : 170);
    g.save(); g.translate(x, vy); g.scale(k, k);
    bot(g, 0, 0, P ? 0.7 : 0.8, u, { seed: i + 40, color: '#6f8cff', dark: '#4a64d0', mood: 'ok' });
    // 举牌：针对当前那条发现投 ✓ / ✗
    const j = Math.min(4, Math.floor(clamp((u - av) / 0.22, 0, 4.99)));
    if (u > av) {
      const yes = keep[j] ? rand(i, j) > 0.15 : rand(i, j) > 0.8;
      g.fillStyle = '#f4efe6'; rr(g, 28, -110, 50, 50, 8); g.fill(); line(g, 53, -60, 53, -30, '#c9d1e8', 5);
      icon(g, yes ? 'check' : 'cross', 53, -85, 34, yes ? C.mintDk : C.red);
    }
    g.restore();
  }
  if (u > av - 0.1) txt(g, T(TL.txt.voters), 0, vy + 90, P ? 26 : 30, C.dim, { weight: '700' });
  if (u > ar) {
    stamp(g, T(TL.txt.posted) + ' ✓', P ? 0 : 0, P ? -SH + ph + 60 : -SH + ph + 60, P ? 56 : 66, C.mint, C.mintRGB, u, ar + 0.2, -0.06);
  }
};

// 标签：重要 / 小问题 / 原本就有；每条都必须回应
SHOT.tags = (g, c) => {
  const u = c.u, ts = [c.k('t1', 0.6), c.k('t2', 1.2), c.k('t3', 1.9)], aa = c.k('answer', 3.4);
  tint(g, C.blueRGB, 0.35);
  const cols = [C.red, C.gold, C.blue], rw = P ? 760 : 1100, rh = P ? 120 : 130;
  T(TL.txt.tags).forEach((tag, i) => {
    const k = pop(u, ts[i] - 0.2);
    if (k <= 0) return;
    const y = (i - 1) * (rh + 30) - 30;
    g.save(); g.translate(0, y); g.scale(k, k);
    panel(g, -rw / 2, -rh / 2, rw, rh, { r: 20, fill: C.panel2, stroke: cols[i], lw: 4 });
    chip(g, tag, -rw / 2 + 30, 0, P ? 30 : 34, '#0b1124', cols[i], { align: 'left', weight: '900', family: ZH ? F.sans : F.grot });
    for (let j = 0; j < 2; j++) { g.fillStyle = rgba(C.dimRGB, 0.5); rr(g, -rw / 2 + (P ? 280 : 300), -22 + j * 30, (rw - (P ? 440 : 520)) * (0.6 + 0.4 * rand(i, j)), 14, 7); g.fill(); }
    // 回应
    const ka = ease(u, aa + i * 0.25, aa + i * 0.25 + 0.25);
    if (ka > 0) { g.save(); g.globalAlpha = ka; okBadge(g, rw / 2 - 50, 0, 26, i === 1 ? C.gold : C.mint, i === 1 ? 'check' : 'check'); g.restore(); }
    g.restore();
    // 原本就有：不算作者的
    if (i === 2 && u > ts[2] + 0.3) {
      const k2 = pop(u, ts[2] + 0.3);
      g.save(); g.translate(P ? 230 : 420, y + rh / 2 + 70); g.scale(k2, k2);
      chip(g, ZH ? '老 bug · 不算作者的' : 'old bug · not the author’s fault', 0, 0, P ? 24 : 28, C.ink, rgba(C.blueRGB, 0.85), { weight: '700' });
      g.restore();
    }
  });
  if (u > aa - 0.1) chip(g, T(TL.txt.mustAnswer), 0, P ? -SH + 20 : -SH + 20, P ? 28 : 34, '#06251b', C.mint, { weight: '900', alpha: ease(u, aa, aa + 0.3), maxW: 2 * SW });
};

// 收到实质性意见的内部 PR：16% → 54%
SHOT.hits = (g, c) => {
  const u = c.u, a1 = c.k('a16', 1.6), a2 = c.k('a54', a1 + 0.8);
  tint(g, C.mintRGB, 0.35);
  const base = P ? 200 : 220, hmax = P ? 400 : 440, bw = P ? 180 : 220;
  txt(g, T(TL.txt.substantive), 0, -SH + 30, P ? 32 : 38, C.dim, { weight: '700', maxW: 2 * SW });
  [[T(TL.txt.before), 16, a1, rgba(C.dimRGB, 0.7)], [T(TL.txt.after), 54, a2, C.mint]].forEach(([lab, v, at, col], i) => {
    const x = (i ? 1 : -1) * (P ? 150 : 200), h = (v / 60) * hmax * ex(u, at - 0.2, at + 0.6);
    g.fillStyle = col; rr(g, x - bw / 2, base - h, bw, Math.max(4, h), 14); g.fill();
    txt(g, lab, x, base + 34, P ? 30 : 34, C.ink, { weight: '700' });
    if (u >= at - 0.1) slam(g, `${Math.round(v * ex(u, at - 0.2, at + 0.6))}%`, x, base - h - 50, P ? 70 : 86, C.gold, u, at, { ring: i === 1 });
  });
  line(g, -SW + 60, base, SW - 60, base, C.line, 3);
};

// 第三、四层：安全审查与自动化检查；亮红灯不准合；PR 里写清怎么测、怎么撤回
SHOT.gates = (g, c) => {
  const u = c.u, as = c.k('sec', 0.6), ac = c.k('ci', as + 1.4), ar = c.k('red', ac + 1.6), au = c.k('undo');
  tint(g, C.redRGB, 0.2 + 0.4 * ease(u, ar, ar + 0.3) * (c.has('undo') ? 1 - ease(u, au - 1, au - 0.5) : 1));
  const y = P ? -60 : -40;
  // 传送带
  g.fillStyle = '#26315f'; g.fillRect(-SW, y + 60, 2 * SW, 26);
  for (let x = -SW + ((u * 120) % 60); x < SW; x += 60) { g.fillStyle = '#323f78'; g.fillRect(x, y + 64, 30, 18); }
  const gx = P ? [-130, 180] : [-200, 260];
  // 安全审查：盾牌
  const k1 = pop(u, as - 0.3);
  if (k1 > 0) {
    g.save(); g.translate(gx[0], y - 40); g.scale(k1, k1);
    g.beginPath(); g.moveTo(0, -90); g.lineTo(76, -60); g.quadraticCurveTo(76, 40, 0, 90); g.quadraticCurveTo(-76, 40, -76, -60); g.closePath();
    g.fillStyle = C.violet; g.fill(); g.lineWidth = 5; g.strokeStyle = '#d8ccff'; g.stroke();
    icon(g, 'lock', 0, 4, 70, '#20164a');
    txt(g, T(TL.txt.security), 0, 130, P ? 28 : 32, C.ink, { weight: '900' });
    g.restore();
  }
  // 自动化检查：四个灯
  const k2 = pop(u, ac - 0.3);
  const fail = u > ar;
  if (k2 > 0) {
    g.save(); g.translate(gx[1], y - 40); g.scale(k2, k2);
    panel(g, -110, -110, 220, 220, { r: 22, fill: '#0b1124', stroke: fail ? C.red : C.line, lw: 4 });
    T(TL.txt.ciItems).forEach((s, i) => {
      const yy = -70 + i * 46, on = u > ac + i * 0.2;
      const red = fail && i === 2;
      g.fillStyle = !on ? '#1d2a55' : red ? C.red : C.mint; g.beginPath(); g.arc(-70, yy, 13, 0, TAU); g.fill();
      if (on) glow(g, -70, yy, 30, red ? C.redRGB : C.mintRGB, 0.5);
      txt(g, s, -40, yy + 2, 26, C.ink, { align: 'left', weight: '700' });
    });
    txt(g, T(TL.txt.ci), 0, 150, P ? 28 : 32, C.ink, { weight: '900' });
    g.restore();
  }
  // PR 从左边走过来，红灯时被拦下
  const stopX = gx[1] - (P ? 170 : 220);
  const px = fail ? stopX : lerp(-SW - 120, stopX, clamp((u - as + 0.4) / (ar - as + 0.4)));
  prCard(g, px, y + 10, P ? 0.5 : 0.6, { seed: 4, status: fail ? C.red : C.gold });
  if (fail) {
    g.save(); g.translate(gx[1] - (P ? 110 : 140), y + 30); g.rotate(-Math.PI / 2 * (1 - ease(u, ar, ar + 0.25)));
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? C.red : '#f4efe6'; g.fillRect(-8, -130 + i * 26, 16, 26); }
    g.restore();
    stamp(g, T(TL.txt.blocked), 0, P ? 200 : 220, P ? 80 : 96, C.red, C.redRGB, u, ar + 0.1, -0.08);
  }
  // 长版：PR 里写清怎么测、怎么撤回
  if (c.has('undo') && u > au - 1.2) {
    const k = ease(u, au - 1.2, au - 0.8);
    dim(g, 0.92 * k);
    g.save(); g.globalAlpha = k;
    panel(g, P ? -340 : -460, -200, P ? 680 : 920, 400, { r: 24, fill: '#f4efe6', stroke: null });
    txt(g, 'Pull request', P ? -300 : -420, -150, 30, '#6a6f86', { family: F.grot, weight: '700', align: 'left' });
    T(TL.txt.template).forEach((s, i) => {
      const yy = -60 + i * 120, ok = u > au - 0.8 + i * 0.5;
      g.lineWidth = 5; g.strokeStyle = '#141a33'; rr(g, P ? -300 : -420, yy - 26, 52, 52, 10); g.stroke();
      if (ok) icon(g, 'check', (P ? -300 : -420) + 26, yy, 50, C.mintDk);
      txt(g, s, P ? -220 : -340, yy, P ? 44 : 52, '#141a33', { align: 'left', weight: '900' });
      g.fillStyle = 'rgba(20,26,51,0.2)'; rr(g, P ? -220 : -340, yy + 36, P ? 420 : 640, 12, 6); g.fill();
    });
    g.restore();
  }
};

// 第五层：按风险定几个人点头；AI 的批准不算人的批准
SHOT.tiers = (g, c) => {
  const u = c.u, r0 = c.k('r0', 1.4), r1 = c.k('r1', r0 + 1.0), r2 = c.k('r2', r1 + 1.0), an = c.k('never', c.line(1) + 0.8), acl = c.k('cls'), aw = c.k('who');
  tint(g, C.goldRGB, 0.3);
  const cols = [C.mint, C.gold, C.red], xs = P ? [-280, 0, 280] : [-480, 0, 480], cw = P ? 250 : 400, chh = P ? 430 : 470, cy = P ? 10 : 20;
  const ats = [r0, r1, r2];
  for (let i = 0; i < 3; i++) {
    const k = pop(u, ats[i] - 0.7 - (i ? 0 : 0.3));
    if (k <= 0) continue;
    g.save(); g.translate(xs[i], cy); g.scale(k, k);
    panel(g, -cw / 2, -chh / 2, cw, chh, { r: 22, fill: 'rgba(18,27,60,0.94)', stroke: cols[i], lw: 4 });
    g.fillStyle = cols[i]; rr(g, -cw / 2, -chh / 2, cw, 64, 22); g.fill(); g.fillRect(-cw / 2, -chh / 2 + 34, cw, 30);
    txt(g, T(TL.txt.risk)[i], 0, -chh / 2 + 33, P ? 30 : 36, '#0b1124', { weight: '900' });
    txt(g, T(TL.txt.riskEx)[i], 0, -chh / 2 + 104, P ? 24 : 28, C.dim, { weight: '700', maxW: cw - 20 });
    // 人位：0 / 1 / 2 个
    if (i === 0) { bot(g, 0, 40, P ? 0.8 : 1, u, { seed: 3, mood: 'happy' }); okBadge(g, P ? 70 : 90, -20, 22); }
    for (let j = 0; j < i; j++) {
      const x = (j - (i - 1) / 2) * (P ? 100 : 130), on = ease(u, ats[i], ats[i] + 0.3);
      g.save(); g.setLineDash([8, 8]); g.lineWidth = 3; g.strokeStyle = rgba(C.inkRGB, 0.5);
      g.beginPath(); g.arc(x, 0, 26, 0, TAU); g.stroke(); rr(g, x - 34, 32, 68, 60, 26); g.stroke(); g.restore();
      if (on > 0) { g.save(); g.globalAlpha = on; person(g, x, 34, 0.75, u, { seed: i * 3 + j, shirt: BOXC[(i + j) % 5], skin: SKINS[(i + j) % 4] }); g.restore(); }
    }
    g.restore();
    if (u >= ats[i]) slam(g, T(TL.txt.people)[i], xs[i], cy + chh / 2 - 50, P ? 52 : 64, C.gold, u, ats[i], { family: FT(), weight: '900', ring: false });
  }
  // AI 的批准 ≠ 人的批准
  if (u > an - 0.6) {
    const k = ease(u, an - 0.6, an - 0.2);
    dim(g, 0.9 * k);
    g.save(); g.globalAlpha = k;
    const bx = P ? -180 : -300;
    bot(g, bx, 60, P ? 1.3 : 1.5, u, { seed: 6, mood: u > an + 0.3 ? 'stress' : 'happy', look: 1 });
    g.save(); g.translate(bx + 120, -20); g.rotate(0.1);
    panel(g, -90, -50, 180, 100, { r: 14, fill: '#f4efe6', stroke: null });
    icon(g, 'check', -40, 0, 50, C.mintDk);
    txt(g, ZH ? '批准' : 'OK', 30, 2, 40, '#141a33', { weight: '900' });
    g.restore();
    // 人形的空位
    const sx = P ? 200 : 330;
    g.save(); g.setLineDash([12, 10]); g.lineWidth = 5; g.strokeStyle = C.ink;
    g.beginPath(); g.arc(sx, -40, 50, 0, TAU); g.stroke(); rr(g, sx - 70, 20, 140, 120, 50); g.stroke(); g.restore();
    txt(g, ZH ? '人的位置' : "a human's slot", sx, 180, 30, C.dim, { weight: '700' });
    g.restore();
    if (u > an) stamp(g, T(TL.txt.notHuman), 0, P ? -190 : -200, P ? 72 : 88, C.red, C.redRGB, u, an + 0.05, -0.08, { family: ZH ? F.sans : F.grot });
  }
  // 长版：分类器定级；指挥 AI 的人算审核人之一
  if (c.has('cls') && u > acl - 0.3 && u < an - 0.6) chip(g, T(TL.txt.classifier), 0, -SH + 8, P ? 24 : 30, '#0b1124', C.gold, { weight: '900', alpha: ease(u, acl - 0.3, acl + 0.1) * (1 - ease(u, an - 1, an - 0.6)), maxW: 2 * SW });
  if (c.has('who') && u > aw - 0.4) {
    const k = ease(u, aw - 0.4, aw);
    dim(g, 0.96 * k);
    g.save(); g.globalAlpha = k;
    person(g, P ? -170 : -260, 60, P ? 1.3 : 1.5, u, { seed: 2, shirt: C.violet });
    bot(g, P ? 170 : 260, 70, P ? 1.2 : 1.4, u, { seed: 4, mood: 'focus' });
    g.save(); g.setLineDash([14, 10]); g.lineDashOffset = -u * 40; line(g, P ? -100 : -170, 40, P ? 100 : 170, 40, C.gold, 5); g.restore();
    g.restore();
    slam(g, T(TL.txt.director), 0, P ? -170 : -190, P ? 44 : 56, C.gold, u, aw, { family: FT(), weight: '900', ring: false, maxW: 2 * SW - 40 });
  }
};

// 第六层与回滚的网：合并队列 → 功能开关 → 内部先用 → 分批发布；出了事几分钟撤回
SHOT.release = (g, c) => {
  const u = c.u, aq = c.k('mq', 0.4), af = c.k('flag', aq + 1.2), au = c.k('undo', c.line(c.n - 1) + 1.5);
  tint(g, C.mintRGB, 0.3);
  const n = 4, xs = [...Array(n).keys()].map((i) => (i - 1.5) * (P ? 205 : 380)), y = P ? -40 : -30, r = P ? 84 : 110;
  const labs = T(TL.txt.stages);
  line(g, xs[0], y, xs[3], y, C.line, 8);
  const flagOn = ease(u, af, af + 0.25) * (1 - ease(u, au + 0.2, au + 0.45));
  const live = ease(u, af + 0.4, af + 2.4);
  for (let i = 0; i < n; i++) {
    const k = pop(u, Math.min(aq, 0.3) - 0.2 + i * 0.15);
    if (k <= 0) continue;
    g.save(); g.translate(xs[i], y); g.scale(k, k);
    panel(g, -r, -r, 2 * r, 2 * r, { r: 26, fill: C.panel2, stroke: i === 1 && flagOn > 0.5 ? C.mint : C.line, lw: 4 });
    if (i === 0) { for (let j = 0; j < 3; j++) prCard(g, -8 + j * 8, -14 + j * 12, 0.42, { seed: j + 50, status: u > aq + j * 0.3 ? C.mint : C.gold }); }
    if (i === 1) { // 开关
      const on = flagOn;
      rr(g, -54, -28, 108, 56, 28); g.fillStyle = on > 0.5 ? C.mint : '#3a4670'; g.fill();
      g.fillStyle = '#f4efe6'; g.beginPath(); g.arc(lerp(-26, 26, on), 0, 22, 0, TAU); g.fill();
    }
    if (i === 2) for (let j = 0; j < 3; j++) person(g, (j - 1) * 46, 10, 0.42, u, { seed: j + 9, shirt: BOXC[j], skin: SKINS[j] });
    if (i === 3) for (let j = 1; j <= 3; j++) { g.strokeStyle = rgba(C.mintRGB, 0.9 * clamp(live * 3 - j + 1)); g.lineWidth = 6; g.beginPath(); g.arc(0, 0, j * r * 0.27, 0, TAU); g.stroke(); }
    g.restore();
    txt(g, labs[i], xs[i], y + r + 34, P ? 26 : 32, C.ink, { weight: '900', alpha: k, maxW: P ? 200 : 360 });
  }
  if (u > af + 0.2 && flagOn > 0.5) { const tx = lerp(xs[1], xs[3], (live * 1.6) % 1); glow(g, tx, y, 50, C.mintRGB, 0.9); }
  // 出事 → 关开关、撤回
  if (u > au - 0.6) {
    const k = ease(u, au - 0.6, au - 0.2);
    bug(g, xs[3], y - r - 50, P ? 0.9 : 1.1, u, { seed: 5, alpha: 1 - ease(u, au + 0.4, au + 0.8) });
    g.save(); g.globalAlpha = k; g.strokeStyle = C.red; g.lineWidth = 9; g.lineCap = 'round';
    // 回滚的箭头从标签下面绕回开关
    const y0 = y + r + (P ? 66 : 72), ry = y0 + (P ? 90 : 110);
    g.beginPath(); g.moveTo(xs[3], y0); g.quadraticCurveTo((xs[3] + xs[1]) / 2, ry, xs[1] + 20, y0); g.stroke();
    arrow(g, xs[1] + 60, y0 + 40, xs[1] + 22, y0 + 2, C.red, 9, 1, 26);
    g.restore();
    if (u > au) slam(g, T(TL.txt.minutes), 0, P ? -220 : -240, P ? 60 : 76, C.mint, u, au, { rgb: C.mintRGB, family: FT(), weight: '900' });
  }
};

// 同事的话：放慢速度确实能少出错，但主要是因为你什么都做得少了；他们宁可更快地发现、更快地修
SHOT.slow = (g, c) => {
  const u = c.u, al = c.k('less', 2), af = c.k('fast', c.line(1) + 0.4);
  tint(g, C.violetRGB, 0.35);
  const w = P ? 780 : 1300, h = P ? 380 : 330;
  const k = pop(u, 0.05);
  g.save(); g.translate(0, -60); g.scale(k, k);
  panel(g, -w / 2, -h / 2, w, h, { r: 30, fill: '#f4efe6', stroke: null });
  const q = T(TL.txt.slowQuote), size = P ? 40 : 48;
  g.save(); setFont(g, size, FT(), '900');
  const units = ZH ? [...q] : q.split(/(?<=\s)/), lines = [];
  let cur = '';
  for (const s of units) { if (g.measureText(cur + s).width > w - 120 && cur) { lines.push(cur); cur = s.trimStart(); } else cur += s; }
  lines.push(cur); g.restore();
  lines.forEach((l, i) => txt(g, l, 0, -h / 2 + 70 + i * size * 1.35, size, '#141a33', { weight: '900' }));
  txt(g, T(TL.txt.colleague), w / 2 - 40, h / 2 - 40, P ? 24 : 28, '#4a5070', { weight: '700', align: 'right' });
  g.restore();
  // 速度表
  const gy = P ? 230 : 240, kk = ease(u, af - 0.2, af + 0.5);
  g.save(); g.translate(0, gy);
  g.lineWidth = 14; g.strokeStyle = '#26315f'; g.beginPath(); g.arc(0, 0, 70, Math.PI, 0); g.stroke();
  g.strokeStyle = C.mint; g.beginPath(); g.arc(0, 0, 70, Math.PI, Math.PI * (1 + 0.85 * kk)); g.stroke();
  const na = Math.PI * (1.1 + 0.8 * kk);
  line(g, 0, 0, Math.cos(na) * 58, Math.sin(na) * 58, C.ink, 6);
  g.restore();
  if (u > af) txt(g, ZH ? '更快发现 · 更快修' : 'notice faster · fix faster', P ? 0 : 240, gy + (P ? 60 : -20), P ? 34 : 40, C.mint, { weight: '900', align: P ? 'center' : 'left', alpha: kk });
};
