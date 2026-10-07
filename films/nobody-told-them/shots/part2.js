// 02 潮水：三群人，每一代模型抬起的高度不一样
const GENS = [
  { zh: 'Copilot', en: 'COPILOT', line: 'g2', f: 0.05, lv: [0.32, 0.1, 0.04] },
  { zh: '会用工具', en: 'TOOLS', line: 'g2', f: 0.5, lv: [0.46, 0.26, 0.05] },
  { zh: 'Opus 4.5', en: 'OPUS 4.5', line: 'g3', f: 0.05, lv: [0.6, 0.44, 0.07] },
  { zh: 'Fable 5', en: 'FABLE 5', line: 'g3', f: 0.42, lv: [0.86, 0.47, 0.08] },
  { zh: 'Opus 5.5', en: 'OPUS 5.5', line: 'g4', f: 0.05, lv: [0.9, 0.82, 0.13] },
];
SHOT.tanks = (ctx, u, dur, sh) => {
  paper(ctx);
  // 每一代模型落下的时刻；Opus 5.5 那一下在说到“门槛”时才真正抬起懂技术的人
  const T = GENS.map((g) => at(sh, g.line, g.f));
  const lvAt = (j) => {
    let v = [0.12, 0.06, 0.03][j];
    GENS.forEach((g, i) => {
      const t0 = i === 4 && j === 1 ? at(sh, 'g4', 0.32) : T[i];
      const k = ease(u, t0 + 0.2, t0 + 1.4);
      v = lerp(v, g.lv[j], k);
    });
    return v;
  };
  riso(ctx, (L) => {
    const xs = [CX - 430, CX, CX + 430], bot = 770, hgt = 470, wd = 200;
    const names = [['开发者', 'DEVELOPERS'], ['懂技术的人', 'TECHNICAL'], ['不懂技术的人', 'NON-TECHNICAL']];
    xs.forEach((x, j) => {
      const lv = lvAt(j), top = bot - hgt * lv;
      // 液体：粉色网点 + 一道波浪的水面
      L.p.fillStyle = ht(L.p, 'p', 0.55);
      L.p.beginPath(); L.p.moveTo(x - wd / 2, bot);
      for (let q = 0; q <= 20; q++) L.p.lineTo(x - wd / 2 + (q / 20) * wd, top + Math.sin(q * 0.8 + u * 3 + j) * 6);
      L.p.lineTo(x + wd / 2, bot); L.p.closePath(); L.p.fill(); solid(L.p);
      L.p.lineWidth = 8; L.p.beginPath();
      for (let q = 0; q <= 20; q++) { const px = x - wd / 2 + (q / 20) * wd, py = top + Math.sin(q * 0.8 + u * 3 + j) * 6; q ? L.p.lineTo(px, py) : L.p.moveTo(px, py); }
      L.p.stroke();
      // 管子
      L.b.lineWidth = 10; L.b.beginPath(); L.b.roundRect(x - wd / 2 - 12, bot - hgt - 20, wd + 24, hgt + 32, 30); L.b.stroke();
      label(L.b, names[j][0], names[j][1], x, bot + 62, 36);
    });
    // 鸿沟：开发者和懂技术的人之间
    const gap = ease(u, T[3] + 0.6, T[3] + 1.6) * (1 - ease(u, at(sh, 'g4', 0.32), at(sh, 'g4', 0.32) + 1.2));
    if (gap > 0.02) {
      const y1 = bot - hgt * lvAt(0), y2 = bot - hgt * lvAt(1), gx = (xs[0] + xs[1]) / 2;
      L.y.globalAlpha = gap; L.y.lineWidth = 10;
      L.y.beginPath(); L.y.moveTo(gx, y1 + 10); L.y.lineTo(gx, y2 - 10); L.y.stroke();
      for (const [yy, d] of [[y1 + 10, 1], [y2 - 10, -1]]) { L.y.beginPath(); L.y.moveTo(gx - 20, yy + d * 26); L.y.lineTo(gx, yy); L.y.lineTo(gx + 20, yy + d * 26); L.y.stroke(); }
      label(L.y, '鸿沟', 'THE GAP', gx, (y1 + y2) / 2, 40, { rot: -0.08 });
      L.y.globalAlpha = 1;
    }
    // 一枚枚“型号”邮票
    GENS.forEach((g, i) => {
      const k = pop(u, T[i], 0.4);
      if (k <= 0) return;
      const x = 420 + i * 290, y = 175;
      L.b.save(); L.b.translate(x, y); L.b.rotate((rand(i, 2) - 0.5) * 0.12); L.b.scale(k, k);
      L.b.lineWidth = 6; L.b.setLineDash([10, 8]); L.b.strokeRect(-130, -46, 260, 92); L.b.setLineDash([]);
      txt(L.b, isZH() ? g.zh : g.en, 0, 4, isZH() ? 44 : 40, isZH() && !/^[A-Z]/.test(g.zh) ? DZH : DEN);
      L.b.restore();
      if (i < 4) { L.p.lineWidth = 6; L.p.beginPath(); L.p.moveTo(x + 140, y); L.p.lineTo(x + 172, y); L.p.stroke(); }
    });
    // “门槛”：Opus 5.5 那一枚盖上黄色的价签
    const tk = pop(u, at(sh, 'g4', 0.5), 0.4);
    if (tk > 0) { L.y.save(); L.y.translate(420 + 4 * 290, 268); L.y.rotate(0.06); L.y.scale(tk, tk); L.y.beginPath(); L.y.roundRect(-110, -32, 220, 64, 32); L.y.fill(); L.y.restore(); label(L.b, '够得着', 'WITHIN REACH', 420 + 4 * 290, 271, 32, { alpha: clamp(tk) }); }
  }, null, u);
};

SHOT.maps = (ctx, u, dur, sh) => {
  paper(ctx);
  const g5 = at(sh, 'g5'), g5e = at(sh, 'g5', 1);
  riso(ctx, (L) => {
    // 右边：一个新世界（蓝色等距网格的山丘）
    L.b.fillStyle = ht(L.b, 'b', 0.35);
    L.b.beginPath(); L.b.moveTo(960, 900);
    for (let x = 960; x <= W; x += 20) L.b.lineTo(x, 640 - 140 * Math.sin((x - 960) / 300) * Math.exp(-((x - 1400) ** 2) / 300000));
    L.b.lineTo(W, 1080); L.b.lineTo(960, 1080); L.b.fill(); solid(L.b);
    L.b.lineWidth = 3;
    for (let i = 0; i < 14; i++) { L.b.beginPath(); L.b.moveTo(1000 + i * 70, 1080); L.b.lineTo(1250 + i * 40, 700); L.b.stroke(); }
    // 空出来的一块：等着那张旧地图
    const slot = [1360, 720];
    L.p.lineWidth = 6; L.p.setLineDash([12, 10]); L.p.strokeRect(slot[0] - 110, slot[1] - 80, 220, 160); L.p.setLineDash([]);
    // 左边：童年游戏里的像素地图，被一个小人搬过去
    const k = ease(u, lerp(g5, g5e, 0.3), lerp(g5, g5e, 0.85));
    const px = lerp(420, slot[0], k), py = lerp(560, slot[1], k) - Math.sin(k * Math.PI) * 120;
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 11; gx++) {
      const v = noise2(gx * 0.4, gy * 0.4, 3);
      const c = v > 0.25 ? L.y : v > -0.15 ? L.p : L.b;
      c.fillRect(px - 110 + gx * 20, py - 80 + gy * 20, 19, 19);
    }
    if (k < 0.98) person(L.b, px - 10, py + 230, 150, { arm: [2.7, 2.7], head: L.p });
    label(L.p, '童年的游戏', 'A CHILDHOOD GAME', 420, 380, 38, { alpha: 1 - k });
    label(L.b, '逆向出来的新游戏', 'A REVERSE-ENGINEERED GAME', 1400, 470, 38, { alpha: ease(u, g5 + 0.8, g5 + 1.4) });
    if (k >= 1) { const s = pop(u, lerp(g5, g5e, 0.86) + 0.1, 0.4); L.y.beginPath(); L.y.arc(slot[0] + 150, slot[1] - 120, 40 * s, 0, TAU); L.y.fill(); }
  }, null, u);
};

SHOT.rope = (ctx, u, dur, sh) => {
  paper(ctx);
  const g6 = at(sh, 'g6'), g6e = at(sh, 'g6', 1);
  riso(ctx, (L) => {
    // 一间小屋，妈妈在门口；头顶飘着一个个问号
    L.b.fillStyle = ht(L.b, 'b', 0.3);
    L.b.beginPath(); L.b.moveTo(1050, 820); L.b.lineTo(1050, 560); L.b.lineTo(1250, 420); L.b.lineTo(1450, 560); L.b.lineTo(1450, 820); L.b.fill(); solid(L.b);
    L.b.fillRect(0, 820, W, 14);
    person(L.p, 1230, 820, 170, { hair: true, head: L.p, arm: [0.3, 0.3] });
    // 帮她修电脑的人
    person(L.b, 620, 820, 180, { arm: [0.3, 1.9], head: L.p });
    L.b.fillRect(690, 600, 110, 70);
    const solved = (i) => ease(u, lerp(g6, g6e, 0.55) + i * 0.4, lerp(g6, g6e, 0.55) + i * 0.4 + 0.35);
    for (let i = 0; i < 6; i++) {
      const x = 1000 + (i % 3) * 210 + Math.sin(u + i) * 10, y = 240 + Math.floor(i / 3) * 140 + Math.cos(u * 1.2 + i) * 10;
      const s = solved(i), appear = pop(u, 0.3 + i * 0.25, 0.4);
      if (appear <= 0) continue;
      if (s < 0.5) { L.b.globalAlpha = 1 - s * 2; txt(L.b, '?', x, y, 110 * appear, DEN); L.b.globalAlpha = 1; }
      else { const r = 44 * s; L.y.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * TAU / 10, rr = q % 2 ? r * 0.45 : r; L.y.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } L.y.closePath(); L.y.fill(); }
    }
    // 一根粉色的线，把能力递过去
    L.p.lineWidth = 8;
    const pts = []; for (let q = 0; q <= 30; q++) { const t = q / 30; pts.push([lerp(800, 1200, t), lerp(620, 640, t) - Math.sin(t * Math.PI) * 120]); }
    scribble(L.p, pts, 8, 4, ease(u, lerp(g6, g6e, 0.5), lerp(g6, g6e, 0.62)));
    label(L.p, '机会在这里', 'THE OPPORTUNITY', 620, 360, 44, { rot: -0.06, alpha: ease(u, lerp(g6, g6e, 0.38), lerp(g6, g6e, 0.45)) });
  }, null, u);
};
