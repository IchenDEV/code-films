// 03 怪人
function brick(c, x, y, w, h, studs = 4) {
  c.beginPath(); c.roundRect(x, y, w, h, 6); c.fill();
  for (let i = 0; i < studs; i++) { c.beginPath(); c.roundRect(x + 10 + i * (w - 20) / studs, y - 14, (w - 20) / studs - 12, 16, 4); c.fill(); }
}
function chili(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.moveTo(-0.1 * s, -0.45 * s); c.bezierCurveTo(0.45 * s, -0.4 * s, 0.4 * s, 0.4 * s, -0.25 * s, 0.6 * s); c.bezierCurveTo(0.05 * s, 0.2 * s, -0.35 * s, -0.25 * s, -0.1 * s, -0.45 * s); c.fill();
  c.restore();
}
SHOT.bricks = (ctx, u, dur, sh) => {
  paper(ctx);
  const w1 = at(sh, 'w1'), w2 = at(sh, 'w2'), w2e = at(sh, 'w2', 1);
  riso(ctx, (L) => {
    // “最辣的观点”
    const ck = pop(u, w1 + 0.2, 0.45);
    if (ck > 0) { chili(L.p, 1500, 300, 260 * ck, 0.4); L.y.lineWidth = 10; L.y.beginPath(); L.y.moveTo(1470, 190); L.y.quadraticCurveTo(1440, 120, 1500, 100); L.y.stroke(); }
    // 一模一样的砖，被整整齐齐地码起来
    const n = Math.floor(ease(u, w2, w2e) * 24);
    for (let i = 0; i < 24; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      const x = 380 + col * 150 + (row % 2) * 75, y = 860 - row * 86;
      const k = i < n ? 1 : i === n ? (ease(u, w2, w2e) * 24) % 1 : 0;
      if (k <= 0) continue;
      const odd = i === 17;
      (odd ? L.p : L.b).save(); const c = odd ? L.p : L.b; c.translate(x + 66, y - 100 * (1 - k) + 34); if (odd) c.rotate(0.12); brick(c, -66, -34, 132, 68); c.restore();
    }
    person(L.b, 1320, 900, 190, { arm: [1.5, 0.4], head: L.p });
    label(L.b, '把现成的库，换个方式连起来', 'LINKING EXISTING LIBRARIES', 760, 230, 40, { alpha: ease(u, w2 + 1.2, w2 + 1.8) });
  }, null, u);
};

function teapot(c, x, y, s) { blob(c, x, y, 0.5 * s, 2, 0, 0.03); c.fill(); c.beginPath(); c.moveTo(x + 0.4 * s, y); c.lineTo(x + 0.85 * s, y - 0.35 * s); c.lineTo(x + 0.75 * s, y - 0.2 * s); c.lineTo(x + 0.45 * s, y + 0.2 * s); c.fill(); c.lineWidth = 0.1 * s; c.beginPath(); c.arc(x - 0.55 * s, y, 0.22 * s, 1.4, 4.9); c.stroke(); }
function bell(c, x, y, s) { c.beginPath(); c.moveTo(x - 0.5 * s, y + 0.4 * s); c.quadraticCurveTo(x - 0.4 * s, y - 0.55 * s, x, y - 0.55 * s); c.quadraticCurveTo(x + 0.4 * s, y - 0.55 * s, x + 0.5 * s, y + 0.4 * s); c.fill(); c.beginPath(); c.arc(x, y + 0.48 * s, 0.12 * s, 0, TAU); c.fill(); }
function cactus(c, x, y, s) { c.beginPath(); c.roundRect(x - 0.15 * s, y - 0.7 * s, 0.3 * s, 1.1 * s, 0.15 * s); c.roundRect(x - 0.5 * s, y - 0.35 * s, 0.22 * s, 0.4 * s, 0.11 * s); c.roundRect(x + 0.28 * s, y - 0.5 * s, 0.22 * s, 0.35 * s, 0.11 * s); c.fill(); c.fillRect(x - 0.42 * s, y - 0.05 * s, 0.3 * s, 0.12 * s); c.fillRect(x + 0.12 * s, y - 0.2 * s, 0.3 * s, 0.12 * s); }
function toaster(c, x, y, s) { c.beginPath(); c.roundRect(x - 0.55 * s, y - 0.35 * s, 1.1 * s, 0.7 * s, 0.18 * s); c.fill(); }
SHOT.layers = (ctx, u, dur, sh) => {
  paper(ctx);
  const w3 = at(sh, 'w3'), w3e = at(sh, 'w3', 1), w4 = at(sh, 'w4');
  riso(ctx, (L) => {
    // 左：Zapier 式的胡乱连接
    const objs = [[200, 340, teapot], [520, 220, bell], [300, 700, cactus], [660, 600, toaster]];
    objs.forEach(([x, y, f], i) => f(i % 2 ? L.b : L.y, x, y, 140));
    const tangle = ease(u, w3 + 0.3, lerp(w3, w3e, 0.45));
    L.p.lineWidth = 10;
    [[0, 3], [1, 2], [0, 2], [1, 3]].forEach(([a, b], i) => {
      const A = objs[a], B = objs[b], pts = [];
      for (let q = 0; q <= 40; q++) { const t = q / 40; pts.push([lerp(A[0], B[0], t) + Math.sin(t * 12 + i) * 60, lerp(A[1], B[1], t) + Math.cos(t * 9 + i * 2) * 50]); }
      scribble(L.p, pts, 10, 30 + i, clamp(tangle * 4 - i));
    });
    // 右：OBS 里叠起来的四万个场景
    const stackK = ease(u, lerp(w3, w3e, 0.5), w3e + 0.4);
    const nLay = Math.floor(4 + stackK * 26);
    for (let i = 0; i < nLay; i++) {
      const c = i % 3 === 0 ? L.p : i % 3 === 1 ? L.b : L.y;
      const x = 1180 + i * 9, y = 820 - i * 13;
      c.fillStyle = ht(c, c.ink, 0.25 + (i % 4) * 0.1);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 300, y - 60); c.lineTo(x + 480, y + 10); c.lineTo(x + 180, y + 70); c.closePath(); c.fill();
      solid(c); c.lineWidth = 3; c.stroke();
    }
    const count = Math.floor(stackK * 40000);
    txt(L.b, count.toLocaleString('en-US'), 1480, 220, 110, DEN, { alpha: ease(u, lerp(w3, w3e, 0.5), lerp(w3, w3e, 0.6)) });
    label(L.p, '个场景', 'SCENES IN OBS', 1480, 310, 40, { alpha: ease(u, lerp(w3, w3e, 0.55), lerp(w3, w3e, 0.65)) });
    // 可它管用
    const ok = pop(u, at(sh, 'w4', 0.55), 0.4);
    if (ok > 0) {
      L.y.save(); L.y.translate(CX, CY - 40); L.y.rotate(-0.08); L.y.scale(ok, ok);
      L.y.beginPath(); L.y.arc(0, 0, 170, 0, TAU); L.y.fill(); L.y.restore();
      L.b.save(); L.b.translate(CX, CY - 40); L.b.rotate(-0.08); L.b.scale(ok, ok);
      head(L.b, '管用！', 'IT WORKS!', 0, 0, 90, { enScale: 0.62 }); L.b.restore();
    }
  }, null, u);
};

SHOT.envfile = (ctx, u, dur, sh) => {
  paper(ctx);
  const w5 = at(sh, 'w5'), w5e = at(sh, 'w5', 1);
  const re = easeInOut(ramp(u, lerp(w5, w5e, 0.55), lerp(w5, w5e, 0.8)));
  riso(ctx, (L) => {
    // 一个装着钥匙的小盒子：.env
    const bx = CX - 160, by = 470;
    L.p.beginPath(); L.p.roundRect(bx - 150, by - 110, 300, 220, 18); L.p.fill();
    txt(L.y, '.env', bx, by - 50, 64, DEN);
    L.y.lineWidth = 16; L.y.beginPath(); L.y.arc(bx - 50, by + 40, 30, 0, TAU); L.y.stroke(); L.y.fillRect(bx - 20, by + 32, 110, 16); L.y.fillRect(bx + 60, by + 40, 14, 28);
    // 今天这些边界（虚线框），后来一点点挪了位置
    const boxes = [
      [['Git', 'GIT'], [CX - 700, 180, 520, 600], [CX - 760, 240, 380, 540]],
      [['密钥', 'SECRETS'], [CX - 120, 260, 360, 420], [CX - 380, 300, 480, 420]],
      [['权限', 'PERMISSIONS'], [CX + 300, 200, 420, 560], [CX + 160, 160, 560, 380]],
    ];
    boxes.forEach(([nm, A, B], i) => {
      const r = A.map((v, j) => lerp(v, B[j], re));
      L.b.lineWidth = 7; L.b.setLineDash([18, 12]); L.b.lineDashOffset = -u * 20;
      L.b.beginPath(); L.b.roundRect(r[0], r[1], r[2], r[3], 20); L.b.stroke(); L.b.setLineDash([]);
      label(L.b, nm[0], nm[1], r[0] + 20, r[1] + 36, 34, { align: 'left', alpha: ease(u, 0.4 + i * 0.3, 1 + i * 0.3) });
    });
    // 那个大问号
    const q = pop(u, lerp(w5, w5e, 0.5), 0.5);
    if (q > 0) { L.p.save(); L.p.translate(CX + 520, 520); L.p.rotate(0.12); L.p.scale(q, q); txt(L.p, '?', 0, 0, 420, DEN); L.p.restore(); }
  }, null, u);
};

SHOT.music = (ctx, u, dur, sh) => {
  paper(ctx);
  const w6 = at(sh, 'w6'), w6e = at(sh, 'w6', 1);
  riso(ctx, (L) => {
    const p = ease(u, 0.3, lerp(w6, w6e, 0.55));
    const mix = ease(u, lerp(w6, w6e, 0.25), lerp(w6, w6e, 0.5));
    // 远方的曲子（蓝）从左边来，本地的调子（粉）从下面来，汇成一股新的
    const blue = [], pink = [];
    for (let q = 0; q <= 120; q++) {
      const t = q / 120, x = lerp(80, 1840, t);
      const m = smooth(clamp((x - 820) / 320));
      blue.push([x, 470 + Math.sin(x / 70 + u * 2) * 70 * (1 - m * 0.4) + m * 40 * Math.sin(x / 31)]);
      pink.push([x, lerp(820, 470, smooth(clamp((x - 400) / 600))) + Math.sin(x / 45 - u * 2.4) * 50 * (0.5 + m * 0.5)]);
    }
    scribble(L.b, blue, 14, 1, p);
    scribble(L.p, pink.slice(30), 14, 2, clamp(mix * 1.2));
    // 音符一路长出来，汇合之后开出花
    for (let i = 0; i < 18; i++) {
      const t = (i + 0.5) / 18, idx = Math.floor(t * 120);
      if (t > p) continue;
      const [x, y] = blue[idx];
      const c = x > 1000 ? (i % 2 ? L.p : L.y) : L.b;
      c.beginPath(); c.ellipse(x, y - 60, 18, 13, -0.4, 0, TAU); c.fill();
      c.lineWidth = 5; c.beginPath(); c.moveTo(x + 15, y - 62); c.lineTo(x + 15, y - 130); c.stroke();
    }
    const bloom = pop(u, lerp(w6, w6e, 0.62), 0.6);
    if (bloom > 0) for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7 + u * 0.3;
      L.y.beginPath(); L.y.ellipse(1640 + Math.cos(a) * 70 * bloom, 470 + Math.sin(a) * 70 * bloom, 60 * bloom, 34 * bloom, a, 0, TAU); L.y.fill();
      L.p.beginPath(); L.p.arc(1640, 470, 40 * bloom, 0, TAU); L.p.fill();
    }
    label(L.b, '学错了', 'LEARNED WRONG', 300, 240, 40, { alpha: ease(u, 0.8, 1.4), rot: -0.05 });
    label(L.p, '混进本地的东西', '+ SOMETHING LOCAL', 560, 760, 40, { alpha: mix });
    label(L.b, '新的声音', 'A NEW SOUND', 1640, 270, 48, { alpha: clamp(bloom) });
  }, null, u);
};
