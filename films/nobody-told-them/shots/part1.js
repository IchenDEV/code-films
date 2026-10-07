// 片名 · 01 梯子：三层
SHOT.title = (ctx, u, dur) => {
  paper(ctx);
  riso(ctx, (L) => {
    const k1 = pop(u, 0.3, 0.5), k2 = pop(u, 0.7, 0.5);
    if (isZH()) {
      L.b.save(); L.b.translate(CX, CY - 60); L.b.scale(k1, k1); txt(L.b, '初生牛犊', 0, 0, 230, DZH); L.b.restore();
      L.p.save(); L.p.translate(CX + 10, CY - 50); L.p.scale(k2, k2); txt(L.p, '初生牛犊', 0, 0, 230, DZH); L.p.restore();
      txt(L.b, 'NOBODY TOLD THEM', CX, CY + 110, 40, DEN, { spacing: '6px', alpha: ease(u, 1.2, 1.8) });
    } else {
      L.b.save(); L.b.translate(CX, CY - 70); L.b.scale(k1, k1); txt(L.b, 'NOBODY', 0, -80, 170, DEN); txt(L.b, 'TOLD THEM', 0, 90, 170, DEN); L.b.restore();
      L.p.save(); L.p.translate(CX + 10, CY - 60); L.p.scale(k2, k2); txt(L.p, 'NOBODY', 0, -80, 170, DEN); txt(L.p, 'TOLD THEM', 0, 90, 170, DEN); L.p.restore();
      txt(L.b, '初生牛犊', CX, CY + 150, 44, DZH, { spacing: '8px', alpha: ease(u, 1.2, 1.8) });
    }
    label(L.p, '根据 Theo 的一段直播', 'after a talk by Theo', CX, isZH() ? CY + 175 : CY + 225, 28, { alpha: ease(u, 1.6, 2.3) });
    const cx = lerp(-200, 1560, ease(u, 0.2, 3.2));
    calf(L.y, cx, 920, 120, u, { horn: L.p });
  }, null, u);
};

SHOT.ladder = (ctx, u, dur, sh) => {
  paper(ctx);
  const tilt = ease(u, 0.3, dur);
  riso(ctx, (L) => {
    // 海：越深网点越密
    for (let i = 0; i < 9; i++) {
      const y0 = 430 + i * 90;
      L.b.fillStyle = ht(L.b, 'b', 0.12 + i * 0.1);
      L.b.beginPath(); L.b.moveTo(0, y0);
      for (let x = 0; x <= W; x += 30) L.b.lineTo(x, y0 + Math.sin(x / 140 + u * 1.2 + i) * 10);
      L.b.lineTo(W, y0 + 120); L.b.lineTo(0, y0 + 120); L.b.closePath(); L.b.fill();
    }
    solid(L.b);
    // 粉色的梯子一节节往下伸
    const p = ease(u, 0.2, at(sh, 'p1', 0.7));
    const x0 = CX - 70, x1 = CX + 70, top = 80, bot = lerp(top, 1300, p);
    L.p.lineWidth = 16;
    L.p.beginPath(); L.p.moveTo(x0, top); L.p.lineTo(x0 - 10, bot); L.p.moveTo(x1, top); L.p.lineTo(x1 + 10, bot); L.p.stroke();
    for (let y = top + 60; y < bot; y += 80) { L.p.beginPath(); L.p.moveTo(x0 - (y - top) / 120, y); L.p.lineTo(x1 + (y - top) / 120, y); L.p.stroke(); }
    // 三层的标记
    const tags = [[250, '1', '你会的', 'WHAT YOU KNOW'], [510, '2', '你不太懂的', 'WHAT YOU DON’T'], [770, '3', '几乎碰不了的', 'THE UNTOUCHABLE']];
    tags.forEach(([y, n, zh, en], i) => {
      const k = pop(u, at(sh, 'p1', 0.35 + i * 0.15), 0.4);
      if (k <= 0) return;
      L.y.beginPath(); L.y.arc(x1 + 120, y, 46 * k, 0, TAU); L.y.fill();
      txt(L.b, n, x1 + 120, y + 4, 56 * k, DEN);
      label(L.b, zh, en, x1 + 190, y, 34, { align: 'left', alpha: clamp(k) });
    });
  }, [1 + 0.05 * tilt, CX, CY + 120 * tilt], u);
};

SHOT.bubble = (ctx, u, dur, sh) => {
  paper(ctx);
  const out = ease(u, at(sh, 't2') - 0.2, dur);
  riso(ctx, (L) => {
    // 远处还有别人的泡泡
    if (out > 0) for (let i = 0; i < 7; i++) {
      const bx = [180, 420, 1500, 1740, 300, 1620, 900][i], by = [220, 760, 200, 700, 470, 450, 120][i];
      L.p.globalAlpha = out; L.p.fillStyle = ht(L.p, 'p', 0.3);
      blob(L.p, bx, by, 90, i + 10, u, 0.07); L.p.fill();
      L.p.globalAlpha = 1; solid(L.p);
      person(L.b, bx, by + 40, 70 * out, {});
    }
    // 我的泡泡
    L.p.fillStyle = ht(L.p, 'p', 0.45);
    blob(L.p, CX, CY - 20, 330, 2, u, 0.05); L.p.fill(); solid(L.p);
    L.p.lineWidth = 8; blob(L.p, CX, CY - 20, 330, 2, u, 0.05); L.p.stroke();
    person(L.b, CX - 110, CY + 150, 170, { arm: [1.1, 1.2] });
    // 桌与屏幕
    L.b.fillRect(CX - 220, CY + 160, 440, 16);
    rect(L.b, CX - 20, CY - 60, 210, 140, 4); L.b.fill();
    L.y.fillRect(CX - 4, CY - 46, 178, 112);
    // 屏幕上一行行补全出来
    for (let i = 0; i < 5; i++) {
      const k = ease(u, at(sh, 't1', 0.25 + i * 0.1), at(sh, 't1', 0.33 + i * 0.1));
      L.b.fillRect(CX + 10, CY - 32 + i * 20, (60 + rand(i, 3) * 90) * k, 9);
    }
    // 扳手调一个齿轮：改一个熟悉的工具
    const gk = ease(u, at(sh, 't1', 0.65), at(sh, 't1', 0.8));
    if (gk > 0) { L.p.globalAlpha = gk; gear(L.p, CX + 210, CY - 170, 52, 9, u * 1.5); L.p.globalAlpha = 1; }
  }, [1 - 0.38 * out, CX, CY], u);
};

SHOT.crab = (ctx, u, dur, sh) => {
  paper(ctx);
  const t3 = at(sh, 't3'), t4 = at(sh, 't4');
  riso(ctx, (L) => {
    // 泡泡破了
    const burst = ease(u, 0.2, 1.2);
    if (burst < 1) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU, r = 300 + burst * 240;
        L.p.globalAlpha = 1 - burst;
        L.p.beginPath(); L.p.arc(380 + Math.cos(a) * r, 520 + Math.sin(a) * r, 26 * (1 - burst) + 4, 0, TAU); L.p.fill();
      }
      L.p.globalAlpha = 1;
    }
    // 地面
    L.b.fillStyle = ht(L.b, 'b', 0.25); L.b.fillRect(0, 760, W, 320); solid(L.b);
    // 螃蟹背着包裹往右走
    const cx = lerp(260, 1080, ease(u, 0.6, t4 + 0.6));
    crab(L.b, cx, 770, 200, u, L.p);
    const sent = (i) => ease(u, t4 + 0.3 + i * 0.35, t4 + 0.9 + i * 0.35);
    for (let i = 0; i < 4; i++) {
      const k = sent(i), bx = lerp(cx - 60 + (i % 2) * 70, 1300 + i * 140, k), by = lerp(650 - Math.floor(i / 2) * 60, 640, k) - Math.sin(k * Math.PI) * 160;
      rect(L.p, bx - 30, by - 30, 60, 60, i + 3); L.p.fill();
      L.y.fillRect(bx - 4, by - 30, 8, 60);
    }
    // 真的用户
    for (let i = 0; i < 4; i++) {
      const k = pop(u, t4 - 0.4 + i * 0.12, 0.4);
      if (k <= 0) continue;
      person(L.b, 1300 + i * 140, 760, 110 * k, { arm: [0.4, 2.6] , head: L.p });
      const lit = sent(i);
      if (lit > 0.9) { L.y.beginPath(); L.y.arc(1300 + i * 140, 560, 22 + 8 * Math.sin(u * 6 + i), 0, TAU); L.y.fill(); }
    }
    label(L.p, 'Rust：几乎不会', 'RUST: BARELY KNOWS IT', 520, 200, 44, { rot: -0.05, alpha: ease(u, t3 + 2, t3 + 2.6) });
  }, null, u);
};

SHOT.deep = (ctx, u, dur, sh) => {
  paper(ctx);
  const t5 = at(sh, 't5'), t5e = at(sh, 't5', 1);
  const work = ease(u, lerp(t5, t5e, 0.72), lerp(t5, t5e, 0.85));
  riso(ctx, (L) => {
    L.b.fillStyle = ht(L.b, 'b', 0.7); L.b.fillRect(0, 0, W, H); solid(L.b);
    // 沉在海底的城堡：由齿轮堆成
    const base = 1000;
    L.p.fillRect(CX - 420, base - 300, 840, 300);
    for (const [x, w, h] of [[-420, 160, 520], [-160, 320, 640], [260, 160, 520]]) {
      L.p.fillRect(CX + x, base - h, w, h);
      L.p.beginPath(); L.p.moveTo(CX + x - 20, base - h); L.p.lineTo(CX + x + w / 2, base - h - 140); L.p.lineTo(CX + x + w + 20, base - h); L.p.fill();
    }
    const spin = u * (0.3 + 2.2 * work);
    [[CX - 250, 820, 70, 10, 1], [CX + 30, 600, 110, 14, -1], [CX + 300, 760, 60, 9, 1], [CX - 60, 860, 50, 8, -1], [CX + 160, 900, 80, 11, 1]].forEach(([x, y, r, n, d], i) => {
      L.y.globalAlpha = 0.25 + 0.75 * work; gear(L.y, x, y, r, n, d * spin + i); L.y.globalAlpha = 1;
    });
    // 窗户：AI 动手之后一扇扇亮起来
    for (let i = 0; i < 6; i++) {
      const wx = CX - 360 + i * 130, wy = 620 + (i % 2) * 90, k = ease(u, lerp(t5, t5e, 0.78) + i * 0.15, lerp(t5, t5e, 0.78) + i * 0.15 + 0.3);
      L.y.globalAlpha = 0.15 + 0.85 * k; L.y.beginPath(); L.y.roundRect(wx, wy, 44, 64, 22); L.y.fill(); L.y.globalAlpha = 1;
    }
    // 提着灯的潜水员
    const dx = lerp(-150, CX + 40, ease(u, 0.3, lerp(t5, t5e, 0.7))), dy = 430 + Math.sin(u * 1.4) * 20;
    L.y.fillStyle = ht(L.y, 'y', 0.5); L.y.beginPath(); L.y.arc(dx + 90, dy, 150, 0, TAU); L.y.fill(); solid(L.y);
    L.p.beginPath(); L.p.ellipse(dx, dy, 90, 38, -0.15, 0, TAU); L.p.fill();
    L.y.beginPath(); L.y.arc(dx + 70, dy - 18, 30, 0, TAU); L.y.fill();
    L.p.lineWidth = 12; L.p.beginPath(); L.p.moveTo(dx - 80, dy + 10); L.p.lineTo(dx - 150, dy + 30 + Math.sin(u * 5) * 16); L.p.stroke();
    L.y.beginPath(); L.y.arc(dx + 110, dy + 30, 14, 0, TAU); L.y.fill();
    // 气泡
    for (let i = 0; i < 16; i++) {
      const by = (H + 100 - ((u * (60 + rand(i, 2) * 50) + rand(i, 3) * H) % (H + 200)));
      L.y.beginPath(); L.y.arc(rand(i, 1) * W, by, 4 + rand(i, 4) * 8, 0, TAU); L.y.lineWidth = 3; L.y.stroke();
    }
    // 城堡、窗、灯光与标题处把蓝版挖空，颜色才干净
    knock(L, ['b'], (c) => {
      c.fillRect(CX - 420, base - 300, 840, 300);
      for (const [x, w, h] of [[-420, 160, 520], [-160, 320, 640], [260, 160, 520]]) { c.fillRect(CX + x, base - h, w, h); c.beginPath(); c.moveTo(CX + x - 20, base - h); c.lineTo(CX + x + w / 2, base - h - 140); c.lineTo(CX + x + w + 20, base - h); c.fill(); }
      const g = c.createRadialGradient(dx + 90, dy, 20, dx + 90, dy, 170); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(dx + 90, dy, 170, 0, TAU); c.fill();
      const lk = ease(u, t5 + 1.0, t5 + 1.6); c.globalAlpha = lk; c.fillStyle = '#000'; c.beginPath(); c.roundRect(CX - 300, 120, 600, 100, 50); c.fill();
    });
    knock(L, ['p'], (c) => { for (let i = 0; i < 6; i++) { const wx = CX - 360 + i * 130, wy = 620 + (i % 2) * 90; c.beginPath(); c.roundRect(wx, wy, 44, 64, 22); c.fill(); } });
    label(L.p, '《超级马里奥 64》', 'SUPER MARIO 64', CX, 170, 52, { alpha: ease(u, t5 + 1.0, t5 + 1.6) });
  }, null, u);
};
