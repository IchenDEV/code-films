// 06 我错了 · 尾声
SHOT.fence = (ctx, u, dur, sh) => {
  paper(ctx);
  const x1 = at(sh, 'x1'), x2 = at(sh, 'x2'), x2e = at(sh, 'x2', 1);
  riso(ctx, (L) => {
    L.b.fillStyle = ht(L.b, 'b', 0.2); L.b.fillRect(0, 880, W, 30); solid(L.b);
    // 一道篱笆，上面挂着牌子
    for (let i = 0; i < 12; i++) { const x = 780 + i * 34; L.b.beginPath(); L.b.moveTo(x, 880); L.b.lineTo(x, 600); L.b.lineTo(x + 12, 580); L.b.lineTo(x + 24, 600); L.b.lineTo(x + 24, 880); L.b.fill(); }
    L.b.fillRect(770, 660, 420, 20); L.b.fillRect(770, 800, 420, 20);
    const sk = pop(u, x1 + 0.6, 0.4);
    if (sk > 0) { L.p.save(); L.p.translate(985, 520); L.p.rotate(-0.04); L.p.scale(sk, sk); L.p.beginPath(); L.p.roundRect(-250, -50, 500, 100, 12); L.p.fill(); L.p.restore(); label(L.y, '不该放在一起', 'DOESN’T BELONG TOGETHER', 985, 522, 38, { alpha: clamp(sk) }); }
    // 篱笆后面的老手（戴眼镜）
    person(L.b, 600, 880, 210, { arm: [0.25, 0.25], head: L.p });
    L.b.lineWidth = 6; L.b.beginPath(); L.b.arc(580, 645, 16, 0, TAU); L.b.arc(620, 645, 16, 0, TAU); L.b.stroke();
    // 高中同学：举着一张 Ubuntu 光盘，翻过篱笆，一路跑到前面
    const jump = ease(u, lerp(x2, x2e, 0.25), lerp(x2, x2e, 0.75));
    const kx = lerp(300, 1650, jump), ky = 880 - Math.sin(clamp((jump - 0.25) / 0.5) * Math.PI) * 360;
    person(L.p, kx, ky, 180, { arm: [2.6, 0.5], head: L.b });
    L.y.beginPath(); L.y.arc(kx - 100, ky - 300, 52, 0, TAU); L.y.fill();
    L.b.beginPath(); L.b.arc(kx - 100, ky - 300, 14, 0, TAU); L.b.fill();
    label(L.p, 'Ubuntu', 'UBUNTU', kx - 100, ky - 380, 30);
    if (jump > 0.8) for (let i = 0; i < 4; i++) { L.p.lineWidth = 8; L.p.beginPath(); L.p.moveTo(kx - 160 - i * 30, ky - 140 + i * 40); L.p.lineTo(kx - 260 - i * 30, ky - 140 + i * 40); L.p.stroke(); }
  }, null, u);
};

SHOT.wrong = (ctx, u, dur, sh) => {
  paper(ctx);
  const x3 = at(sh, 'x3'), x3e = at(sh, 'x3', 1), x4 = at(sh, 'x4'), x4e = at(sh, 'x4', 1);
  const shrink = ease(u, x4 - 0.4, x4 + 0.6);
  riso(ctx, (L) => {
    const k1 = pop(u, lerp(x3, x3e, 0.1), 0.5), k2 = pop(u, lerp(x3, x3e, 0.14), 0.5);
    const y = lerp(CY - 40, 230, shrink), s = lerp(1, 0.55, shrink);
    for (const [c, k, dx, dy] of [[L.b, k1, 0, 0], [L.p, k2, 12, 9]]) {
      if (k <= 0) continue;
      c.save(); c.translate(CX + dx, y + dy); c.rotate(-0.03 + Math.sin(u * 2) * 0.01); c.scale(k * s, k * s);
      head(c, '我错了', 'I WAS WRONG', 0, 0, 300, { enScale: 0.62 }); c.restore();
    }
    // 越来越重要的几样东西：一张张贴纸
    const items = isZH() ? ['想象力', '品味', '敢问蠢问题', '敢扔掉失败的作品'] : ['IMAGINATION', 'TASTE', 'STUPID QUESTIONS', 'THROWING WORK AWAY'];
    items.forEach((it, i) => {
      const k = pop(u, lerp(x4, x4e, 0.05 + i * 0.18), 0.4);
      if (k <= 0) return;
      const c = [L.p, L.y, L.b, L.p][i], x = [480, 1440, 620, 1300][i], yy = [540, 560, 800, 820][i];
      c.save(); c.translate(x, yy); c.rotate([-0.08, 0.06, 0.04, -0.05][i]); c.scale(k, k);
      c.beginPath(); c.roundRect(-260, -66, 520, 132, 66); c.fill(); c.restore();
      const tc = i === 2 ? L.y : L.b;
      tc.save(); tc.translate(x, yy); tc.rotate([-0.08, 0.06, 0.04, -0.05][i]); tc.scale(k, k);
      isZH() ? txt(tc, it, 0, 4, 58, DZH) : txt(tc, it, 0, 4, 40, DEN); tc.restore();
    });
  }, null, u);
};

SHOT.weird = (ctx, u, dur, sh) => {
  paper(ctx);
  const x5 = at(sh, 'x5');
  const burst = ease(u, 0.1, 2.2);
  riso(ctx, (L) => {
    // 前面出现过的一切，混成一锅
    const things = [
      (c, x, y, s) => calf(c, x, y, s, u, { horn: L.p }), (c, x, y, s) => crab(c, x, y, s, u, L.y), (c, x, y, s) => gear(c, x, y, s * 0.5, 9, u),
      (c, x, y, s) => spiral(c, x, y, s * 0.8, u), (c, x, y, s) => brick(c, x - s * 0.5, y, s, s * 0.5), (c, x, y, s) => teapot(c, x, y, s),
      (c, x, y, s) => chili(c, x, y, s, u), (c, x, y, s) => rocket(c, L.y, x, y, s, u * 0.5), (c, x, y, s) => cactus(c, x, y, s * 0.8),
    ];
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996, r = (180 + (i % 6) * 95) * burst;
      const x = CX + Math.cos(a + u * 0.15) * r * 1.5, y = CY - 40 + Math.sin(a + u * 0.15) * r * 0.85;
      const c = [L.b, L.p, L.y][i % 3];
      things[i % things.length](c, x, y, 110 + (i % 4) * 25);
    }
    // 彩纸屑
    for (let i = 0; i < 60; i++) {
      const c = [L.b, L.p, L.y][i % 3];
      const x = rand(i, 1) * W, y = ((rand(i, 2) * H + u * (40 + rand(i, 3) * 60)) % (H + 40)) - 20;
      c.save(); c.translate(x, y); c.rotate(u * 2 + i); c.fillRect(-10, -5, 20, 10); c.restore();
    }
    const tk = pop(u, x5 + 0.1, 0.5);
    const cool = pop(u, at(sh, 'x5', 0.6), 0.5);
    knock(L, ['b', 'p', 'y'], (c) => {
      if (tk > 0) { c.save(); c.translate(CX, CY - 40); c.rotate(-0.05); c.scale(tk, tk); c.beginPath(); c.roundRect(-460, -140, 920, 280, 50); c.fill(); c.restore(); }
      if (cool > 0) { c.save(); c.translate(CX + 300, CY + 150); c.rotate(0.1); c.scale(cool, cool); c.beginPath(); c.roundRect(-330, -70, 660, 140, 40); c.fill(); c.restore(); }
    });
    if (tk > 0) {
      L.y.save(); L.y.translate(CX, CY - 40); L.y.rotate(-0.05); L.y.scale(tk, tk); L.y.beginPath(); L.y.roundRect(-430, -120, 860, 240, 40); L.y.fill(); L.y.restore();
      L.b.save(); L.b.translate(CX, CY - 40); L.b.rotate(-0.05); L.b.scale(tk, tk); head(L.b, '未来会很怪', 'WEIRD FUTURE', 0, 6, 150, { enScale: 0.62 }); L.b.restore();
    }
    if (cool > 0) { L.p.save(); L.p.translate(CX + 300, CY + 150); L.p.rotate(0.1); L.p.scale(cool, cool); head(L.p, '也许，还很酷', 'AND PRETTY COOL', 0, 0, 80, { enScale: 0.62 }); L.p.restore(); }
  }, null, u);
};

SHOT.end = (ctx, u, dur) => {
  paper(ctx);
  riso(ctx, (L) => {
    const k1 = pop(u, 0.3, 0.5), k2 = pop(u, 0.55, 0.5);
    if (isZH()) {
      L.b.save(); L.b.translate(CX, CY - 90); L.b.scale(k1, k1); txt(L.b, '初生牛犊', 0, 0, 170, DZH); L.b.restore();
      L.p.save(); L.p.translate(CX + 8, CY - 82); L.p.scale(k2, k2); txt(L.p, '初生牛犊', 0, 0, 170, DZH); L.p.restore();
    } else {
      L.b.save(); L.b.translate(CX, CY - 100); L.b.scale(k1, k1); txt(L.b, 'NOBODY TOLD THEM', 0, 0, 120, DEN); L.b.restore();
      L.p.save(); L.p.translate(CX + 8, CY - 92); L.p.scale(k2, k2); txt(L.p, 'NOBODY TOLD THEM', 0, 0, 120, DEN); L.p.restore();
    }
    label(L.b, '根据 Theo（t3.gg）的一段直播整理', 'Adapted from a talk by Theo (t3.gg)', CX, CY + 60, 32, { alpha: ease(u, 1.4, 2.2) });
    txt(L.p, 'IDEVLAB', CX, CY + 140, 34, DEN, { spacing: '12px', alpha: ease(u, 2.0, 2.8) });
    calf(L.y, lerp(-200, CX + 520, ease(u, 0.5, 3.0)), 900, 110, u, { horn: L.p, hop: 1 - ease(u, 2.8, 3.2) });
  }, null, u);
};
