// 第一幕：神坛——天圆地方、伏羲女娲、创造亚当、努特、维特鲁威人
const GOLD = [214, 180, 112], STEEL = [200, 214, 232];
const gold = (a) => `rgba(${GOLD},${a})`;

(() => {
  // 天圆地方：旋转的天穹（二十八宿）罩着方正的大地（九州）
  const MANSIONS = [];
  INITS.push(() => {
    for (let i = 0; i < 28; i++) {
      const n = 2 + Math.floor(rand(i, 300) * 4), a0 = (i / 28) * TAU, pts = [];
      for (let j = 0; j < n; j++) pts.push([a0 + (rand(i * 9 + j, 301) - 0.2) * 0.17, 0.80 + rand(i * 9 + j, 302) * 0.13]);
      MANSIONS.push(pts);
    }
  });
  SHOT.tianyuan = (ctx, u, dur, sh) => {
    const R = 400, c = [CX, CY - 20];
    drawStars(ctx, u + 40, 0.25, H * 0.7, 0);
    const rot = u * 0.025;
    const gc = ease(u, 0.2, 2.6);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = gold(0.6); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(c[0], c[1], R, -Math.PI / 2 + rot, -Math.PI / 2 + rot + TAU * gc); ctx.stroke();
    ctx.strokeStyle = gold(0.3); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(c[0], c[1], R + 18, -Math.PI / 2 + rot, -Math.PI / 2 + rot - TAU * gc, true); ctx.stroke();
    // 二十八宿
    const mk = ease(u, 1.4, 3.6);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU + rot;
      ctx.strokeStyle = gold(0.35 * gc);
      ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R); ctx.lineTo(c[0] + Math.cos(a) * (R + 18), c[1] + Math.sin(a) * (R + 18)); ctx.stroke();
      const pts = MANSIONS[i].map(([aa, rr]) => [c[0] + Math.cos(aa + rot) * R * rr, c[1] + Math.sin(aa + rot) * R * rr]);
      ctx.strokeStyle = `rgba(214,120,90,${0.35 * mk})`; ctx.lineWidth = 0.9;
      ctx.beginPath(); pts.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const p of pts) glow(ctx, p[0], p[1], 4, [230, 140, 100], 0.8 * mk, 1);
      ctx.restore();
    }
    // 方形大地与九州
    const s = 250, gs = ease(u, 1.0, 3.0), gg = ease(u, 2.0, 4.2);
    ctx.strokeStyle = gold(0.7); ctx.lineWidth = 1.5;
    ctx.beginPath();
    polyProgress(ctx, [[c[0] - s, c[1] - s], [c[0] + s, c[1] - s], [c[0] + s, c[1] + s], [c[0] - s, c[1] + s], [c[0] - s, c[1] - s]], gs);
    ctx.stroke();
    ctx.strokeStyle = gold(0.22 * gg); ctx.lineWidth = 1;
    ctx.beginPath();
    for (const f of [-1 / 3, 1 / 3]) { ctx.moveTo(c[0] + f * 2 * s, c[1] - s); ctx.lineTo(c[0] + f * 2 * s, c[1] + s); ctx.moveTo(c[0] - s, c[1] + f * 2 * s); ctx.lineTo(c[0] + s, c[1] + f * 2 * s); }
    ctx.stroke();
    // 三才：天、人、地
    const t3 = sh.a2 ?? dur * 0.5;
    const glyphs = [['天', 'Heaven', c[1] - 322], ['人', 'Humankind', c[1]], ['地', 'Earth', c[1] + 170]];
    glyphs.forEach(([g, en, y], i) => {
      const k = ease(u, t3 - 0.3 + i * 0.45, t3 + 0.6 + i * 0.45);
      if (k <= 0) return;
      ctx.save();
      ctx.font = `${i === 1 ? 92 : 60}px ${SERIF}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = `rgba(${GOLD},${0.6 * k})`; ctx.shadowBlur = 24;
      ctx.fillStyle = `rgba(236,212,160,${0.92 * k})`;
      ctx.fillText(g, c[0], y - (1 - k) * 8);
      if (TL.lang === 'en') {
        ctx.font = `italic 20px ${LATIN}`; ctx.shadowBlur = 0; ctx.letterSpacing = '0.12em';
        ctx.fillStyle = `rgba(214,200,170,${0.6 * k})`;
        ctx.fillText(en, c[0], y + (i === 1 ? 70 : 52));
      }
      ctx.restore();
    });
    ctx.restore();
  };

  SHOT.fuxi = (ctx, u, dur) => {
    kenburns(ctx, 'fuxi', u / dur, [0.5, 0.74, 0.55], [0.5, 0.26, 0.46], { filter: 'brightness(0.86) saturate(0.9)' });
  };
  SHOT.adam = (ctx, u, dur) => {
    kenburns(ctx, 'adam', u / dur, [0.5, 0.48, 1.0], [0.515, 0.37, 0.4], { filter: 'brightness(0.82) saturate(0.85)' });
  };
  SHOT.nut = (ctx, u, dur) => {
    kenburns(ctx, 'nut', u / dur, [0.5, 0.5, 1.02], [0.5, 0.45, 0.86], { filter: 'brightness(0.78) saturate(0.85)' });
  };
  SHOT.vitruvian = (ctx, u, dur) => {
    const map = kenburns(ctx, 'vitruvian', u / dur, [0.5, 0.46, 0.92], [0.5, 0.43, 0.6], { filter: 'brightness(0.84) saturate(0.8)' });
    // 人在中心，天层围绕着他展开
    const k = ease(u, dur * 0.45, dur);
    if (k > 0) {
      const [x, y] = map(0.5, 0.43);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      COSMOS_R.forEach((r, i) => {
        const g = ease(k, i * 0.08, 0.5 + i * 0.07);
        if (g <= 0) return;
        ctx.strokeStyle = gold(0.45 * g); ctx.lineWidth = i === 3 ? 1.6 : 1.1;
        ctx.beginPath(); ctx.arc(x, y, r * 1.0, -Math.PI / 2, -Math.PI / 2 + TAU * g); ctx.stroke();
      });
      ctx.restore();
    }
  };
})();
