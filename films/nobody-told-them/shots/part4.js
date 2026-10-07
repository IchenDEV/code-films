// 04 扔掉 · 05 目标
function rocket(c, f, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.moveTo(0, -0.6 * s); c.quadraticCurveTo(0.25 * s, -0.2 * s, 0.2 * s, 0.35 * s); c.lineTo(-0.2 * s, 0.35 * s); c.quadraticCurveTo(-0.25 * s, -0.2 * s, 0, -0.6 * s); c.fill();
  f.beginPath(); f.moveTo(-0.12 * s, 0.38 * s); f.lineTo(0, 0.8 * s); f.lineTo(0.12 * s, 0.38 * s); f.fill();
  c.restore();
}
SHOT.trash = (ctx, u, dur, sh) => {
  paper(ctx);
  const y1 = at(sh, 'y1'), y1e = at(sh, 'y1', 1), y2 = at(sh, 'y2'), y2e = at(sh, 'y2', 1), y3 = at(sh, 'y3'), y3e = at(sh, 'y3', 1);
  riso(ctx, (L) => {
    // 一排火箭：有的飞走，有的炸成一团粉——没关系
    for (let i = 0; i < 6; i++) {
      const t0 = y1 + 0.2 + i * 0.35, k = ease(u, t0, t0 + 1.8), boom = i % 3 === 1;
      const x = 260 + i * 280, y = 360 - (boom ? Math.min(k, 0.45) : k) * 520;
      if (boom && k > 0.45) { const b = ease(k, 0.45, 0.7); L.p.globalAlpha = 1 - ease(k, 0.75, 1); for (let q = 0; q < 8; q++) { const a = q * TAU / 8; L.p.beginPath(); L.p.arc(x + Math.cos(a) * 60 * b, y + Math.sin(a) * 60 * b, 26 * (1 - b * 0.6), 0, TAU); L.p.fill(); } L.p.globalAlpha = 1; }
      else rocket(L.b, L.y, x, y, 120, 0);
    }
    // 开发者抱着两千行舍不得扔
    const dk = pop(u, y2 - 0.2, 0.4);
    if (dk > 0) {
      const x = 560, y = 900;
      for (let i = 0; i < 9; i++) { L.p.fillStyle = ht(L.p, 'p', 0.4); L.p.fillRect(x - 90 + (i % 2) * 6, y - 120 - i * 26, 180, 24); }
      solid(L.p);
      person(L.b, x, y, 200 * dk, { arm: [1.6, 1.6] });
      label(L.p, '2000 行 · 2 小时', '2,000 LINES · 2 HOURS', x, y - 400, 38, { alpha: clamp(dk) });
      const th = pop(u, lerp(y2, y2e, 0.55), 0.4);
      if (th > 0) { L.y.beginPath(); L.y.ellipse(x + 230, y - 520, 150 * th, 70 * th, 0, 0, TAU); L.y.fill(); for (let q = 0; q < 3; q++) { L.y.beginPath(); L.y.arc(x + 120 - q * 28, y - 440 + q * 30, 14 - q * 3, 0, TAU); L.y.fill(); } label(L.b, '可这是一周的活！', 'BUT IT’S A WEEK!', x + 230, y - 520, 34, { alpha: clamp(th) }); }
    }
    // 不写代码的人：揉成一团，扔进纸篓，再来一张
    const nk = pop(u, y3 - 0.2, 0.4);
    if (nk > 0) {
      const x = 1360, y = 900;
      person(L.b, x, y, 200 * nk, { arm: [0.4, 2.4], head: L.p });
      L.b.beginPath(); L.b.moveTo(1600, y); L.b.lineTo(1580, y - 150); L.b.lineTo(1760, y - 150); L.b.lineTo(1740, y); L.b.fill();
      const tk = ease(u, lerp(y3, y3e, 0.45), lerp(y3, y3e, 0.8));
      const bx = lerp(x + 120, 1670, tk), byy = lerp(y - 300, y - 170, tk) - Math.sin(tk * Math.PI) * 200;
      if (tk < 1) { blob(L.p, bx, byy, 34, 9, u * 4, 0.25); L.p.fill(); }
      label(L.y, '试试看', 'LET’S SEE', x, y - 380, 46, { alpha: clamp(nk) });
    }
  }, null, u);
};

SHOT.tower = (ctx, u, dur, sh) => {
  paper(ctx);
  const y4 = at(sh, 'y4'), y4e = at(sh, 'y4', 1);
  const build = ease(u, lerp(y4, y4e, 0.3), lerp(y4, y4e, 0.7));
  riso(ctx, (L) => {
    L.b.fillStyle = ht(L.b, 'b', 0.25); L.b.fillRect(0, 900, W, 30); solid(L.b);
    // 一座塔，一块块垒上去
    const n = Math.floor(build * 22);
    for (let i = 0; i < n; i++) {
      const c = i % 3 === 0 ? L.p : i % 3 === 1 ? L.b : L.y, w = 260 - i * 6;
      c.beginPath(); c.roundRect(CX - w / 2 + Math.sin(i * 1.7) * 10, 870 - i * 32, w, 30, 4); c.fill();
    }
    crab(L.b, CX - 330 + Math.sin(u * 2) * 40, 900, 150, u * 1.6, L.p);
    // 一只转得飞快的钟：不到二十小时
    const cx = 380, cy = 330, r = 130;
    L.p.lineWidth = 12; L.p.beginPath(); L.p.arc(cx, cy, r, 0, TAU); L.p.stroke();
    const ang = build * TAU * 20;
    L.b.lineWidth = 10; L.b.beginPath(); L.b.moveTo(cx, cy); L.b.lineTo(cx + Math.sin(ang) * r * 0.8, cy - Math.cos(ang) * r * 0.8); L.b.stroke();
    L.b.beginPath(); L.b.moveTo(cx, cy); L.b.lineTo(cx + Math.sin(ang / 12) * r * 0.5, cy - Math.cos(ang / 12) * r * 0.5); L.b.stroke();
    txt(L.b, `< ${Math.round(build * 20)}h`, cx, cy + r + 70, 64, DEN);
    label(L.b, 'TypeScript 编译器 → Rust', 'TYPESCRIPT COMPILER → RUST', 1400, 200, 40);
    const fast = pop(u, lerp(y4, y4e, 0.78), 0.4);
    if (fast > 0) { L.y.save(); L.y.translate(1420, 470); L.y.rotate(0.08); L.y.scale(fast, fast); L.y.beginPath(); L.y.roundRect(-230, -90, 460, 180, 30); L.y.fill(); L.y.restore(); L.p.save(); L.p.translate(1420, 470); L.p.rotate(0.08); L.p.scale(fast, fast); head(L.p, '快 2–3 倍', '2–3× FASTER', 0, 4, 84, { enScale: 0.72 }); L.p.restore(); }
  }, null, u);
};

function spiral(c, x, y, s, rot = 0) {
  // 海螺：一笔粗粗的螺旋，越转越细
  let px = null, py = null;
  for (let q = 0; q <= 90; q++) {
    const t = q / 90, a = rot + t * TAU * 2.4, r = s * 0.62 * (1 - t);
    const nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r * 0.85;
    if (px !== null) { c.lineWidth = s * (0.05 + 0.2 * (1 - t)); c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); }
    px = nx; py = ny;
  }
}
function clam(c, x, y, s) {
  c.beginPath(); c.moveTo(x - 0.6 * s, y + 0.2 * s); c.quadraticCurveTo(x - 0.5 * s, y - 0.65 * s, x, y - 0.6 * s); c.quadraticCurveTo(x + 0.5 * s, y - 0.65 * s, x + 0.6 * s, y + 0.2 * s); c.closePath(); c.fill();
  c.beginPath(); c.roundRect(x - 0.18 * s, y + 0.15 * s, 0.36 * s, 0.16 * s, 0.05 * s); c.fill();
  c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 0.045 * s;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 0.02 * s, y + 0.18 * s); c.lineTo(x + i * 0.16 * s, y - 0.5 * s + Math.abs(i) * 0.06 * s); c.stroke(); }
  c.restore();
}
function agent(c, eye, x, y, r, t, i) {
  const bob = Math.sin(t * 3 + i) * 8;
  c.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * TAU / 10, rr = q % 2 ? r * 0.5 : r; c.lineTo(x + Math.cos(a) * rr, y + bob + Math.sin(a) * rr); } c.closePath(); c.fill();
  for (const sd of [-1, 1]) { eye.beginPath(); eye.arc(x + sd * r * 0.2, y + bob - r * 0.05, r * 0.08, 0, TAU); eye.fill(); }
}
SHOT.shells = (ctx, u, dur, sh) => {
  paper(ctx);
  const o1 = at(sh, 'o1'), o1e = at(sh, 'o1', 1), o2 = at(sh, 'o2'), o2e = at(sh, 'o2', 1);
  const tgt = 1 - ease(u, o2 - 0.3, o2 + 0.5);
  riso(ctx, (L) => {
    // 目标：一支箭正中靶心
    if (tgt > 0) {
      for (let i = 0; i < 4; i++) { const c = i % 2 ? L.b : L.p; c.globalAlpha = tgt; c.beginPath(); c.arc(CX, CY - 40, 260 - i * 62, 0, TAU); c.fill(); c.globalAlpha = 1; }
      L.y.globalAlpha = tgt; L.y.beginPath(); L.y.arc(CX, CY - 40, 50, 0, TAU); L.y.fill();
      const ak = ease(u, o1 + 0.2, lerp(o1, o1e, 0.7));
      const ax = lerp(-200, CX, ak);
      L.b.lineWidth = 14; L.b.beginPath(); L.b.moveTo(ax - 400, CY - 40); L.b.lineTo(ax, CY - 40); L.b.stroke();
      L.b.beginPath(); L.b.moveTo(ax - 400, CY - 40); L.b.lineTo(ax - 450, CY - 80); L.b.moveTo(ax - 400, CY - 40); L.b.lineTo(ax - 450, CY); L.b.stroke();
      L.y.globalAlpha = 1;
    }
    const sk = 1 - tgt;
    if (sk <= 0) return;
    // 两只贝壳：花哨的 Zsh，朴素的 Bash
    const put = ease(u, lerp(o2, o2e, 0.2), lerp(o2, o2e, 0.35));
    L.p.globalAlpha = sk; spiral(L.p, lerp(820, 420, put), lerp(460, 640, put), 190, u * 0.2); L.p.globalAlpha = 1;
    label(L.p, 'Zsh · 他喜欢的', 'ZSH · HIS FAVORITE', lerp(820, 420, put), lerp(280, 460, put), 36, { alpha: sk });
    L.b.globalAlpha = sk; clam(L.b, 1220, 560, 230); L.b.globalAlpha = 1;
    label(L.b, 'Bash', 'BASH', 1220, 360, 48, { alpha: sk });
    person(L.b, 820, 830, 150 * sk, { arm: [put > 0.5 ? 0.3 : 1.2, 0.3], head: L.p });
    // 三成以上的错误
    const pie = ease(u, lerp(o2, o2e, 0.4), lerp(o2, o2e, 0.55));
    if (pie > 0) {
      L.b.fillStyle = ht(L.b, 'b', 0.3); L.b.beginPath(); L.b.arc(1640, 260, 110, 0, TAU); L.b.fill(); solid(L.b);
      L.p.beginPath(); L.p.moveTo(1640, 260); L.p.arc(1640, 260, 110, -Math.PI / 2, -Math.PI / 2 + TAU * 0.32 * pie); L.p.closePath(); L.p.fill();
      label(L.b, '30%+ 错误来自 Shell', '30%+ OF ERRORS: THE SHELL', 1640, 420, 30, { alpha: pie });
    }
    // 智能体们围到 Bash 旁边
    for (let i = 0; i < 6; i++) {
      const k = pop(u, lerp(o2, o2e, 0.62) + i * 0.15, 0.4);
      if (k > 0) agent(L.y, L.b, 1000 + i * 90, 730 - (i % 2) * 60, 40 * k, u, i);
    }
    label(L.p, '给智能体用', 'FOR HIS AGENTS', 1640, 620, 40, { alpha: ease(u, lerp(o2, o2e, 0.8), lerp(o2, o2e, 0.9)) });
  }, null, u);
};
