// 第二幕：我们把自己写进天地
const GOLD = [214, 180, 112], STEEL = [200, 214, 232];

// 宇宙图：地心 → 日心 → 缩放。几何上，日心说就是把参照系平移到太阳。
// o: { grow, human, helio, z, starSphere, cool }
const COSMOS_R = [110, 165, 220, 280, 340, 400, 455];
const COSMOS_SPEED = [0.21, 0.09, 0.065, 0.05, 0.035, 0.022, 0.014];
function cosmosState(t, o) {
  const k = o.helio ?? 0, z = o.z ?? 1;
  const ang = (i) => 1.3 * i + 0.7 + t * COSMOS_SPEED[i];
  const sunA = ang(3);
  const sv = [Math.cos(sunA) * 280, Math.sin(sunA) * 280];
  const earth = [-k * sv[0], -k * sv[1]];
  const sun = [(1 - k) * sv[0], (1 - k) * sv[1]];
  const rc = [lerp(earth[0], sun[0], k), lerp(earth[1], sun[1], k)];
  return { k, z, ang, earth, sun, rc };
}
function drawCosmos(ctx, t, o) {
  const S = cosmosState(t, o);
  const { k, z } = S;
  const grow = o.grow ?? 1, cool = o.cool ?? k;
  const col = [0, 1, 2].map((i) => lerp(GOLD[i], STEEL[i], cool));
  const rgba = (a) => `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
  const P = ([x, y]) => [CX + x * z, CY + y * z];
  ctx.save();
  ctx.lineCap = 'round';
  // 恒星天球与黄道带：在日心之后退为无限远
  const sph = (1 - k) * (o.starSphere ?? 1);
  if (sph > 0.01) {
    const c = P([lerp(0, S.rc[0], 0), 0]);
    const r0 = 505 * z * (1 + k * 1.5), r1 = 538 * z * (1 + k * 1.5);
    const g = ease(grow, 0.45, 1);
    ctx.strokeStyle = rgba(0.5 * sph * g); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(c[0], c[1], r0, -Math.PI / 2, -Math.PI / 2 + TAU * g); ctx.stroke();
    ctx.beginPath(); ctx.arc(c[0], c[1], r1, -Math.PI / 2, -Math.PI / 2 - TAU * g, true); ctx.stroke();
    const rot = t * 0.01;
    ctx.beginPath();
    for (let i = 0; i < 360; i += 2) {
      const a = (i / 360) * TAU + rot, big = i % 30 === 0, mid = i % 10 === 0;
      if (i / 360 > g) break;
      const ri = r0 + (big ? 0 : mid ? 18 : 24) * z * (1 + k * 1.5);
      ctx.moveTo(c[0] + Math.cos(a) * ri, c[1] + Math.sin(a) * ri);
      ctx.lineTo(c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1);
    }
    ctx.lineWidth = 0.9; ctx.strokeStyle = rgba(0.38 * sph * g); ctx.stroke();
    // 放射线
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rot;
      ctx.moveTo(c[0] + Math.cos(a) * 60 * z, c[1] + Math.sin(a) * 60 * z);
      ctx.lineTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0);
    }
    ctx.strokeStyle = rgba(0.09 * sph * ease(grow, 0.6, 1)); ctx.stroke();
  }
  // 各天层
  const earthP = P(S.earth), sunP = P(S.sun);
  for (let i = 0; i < 7; i++) {
    const isMoon = i === 0;
    const g = ease(grow, i * 0.06, 0.35 + i * 0.06);
    if (g <= 0) continue;
    const cen = isMoon ? earthP : P(S.rc);
    const R = (isMoon ? lerp(110, 44, k) : COSMOS_R[i]) * z;
    ctx.strokeStyle = rgba((i === 3 ? 0.6 : 0.42) * g);
    ctx.lineWidth = i === 3 ? 1.4 : 1;
    ctx.beginPath(); ctx.arc(cen[0], cen[1], R, -Math.PI / 2, -Math.PI / 2 + TAU * g); ctx.stroke();
    if (i === 3) continue; // 太阳层的“行星”就是太阳本身，另画
    const a = S.ang(i);
    const px = cen[0] + Math.cos(a) * R, py = cen[1] + Math.sin(a) * R;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, px, py, 9 + 3 * z, col, 0.9 * g, 1);
    ctx.restore();
  }
  // 太阳
  {
    const g = ease(grow, 0.3, 0.55);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, sunP[0], sunP[1], (22 + 26 * k) * Math.max(0.35, Math.min(1.2, z)), [255, 220, 160], g * (0.8 + 0.4 * k), 1);
    glow(ctx, sunP[0], sunP[1], (70 + 90 * k) * Math.max(0.3, Math.min(1.2, z)), [255, 190, 120], g * (0.25 + 0.25 * k));
    ctx.restore();
  }
  // 中心的人 → 一个淡蓝的点
  const hk = o.human ?? 1;
  if (hk > 0.01) {
    const s = lerp(84, 8, ease(k, 0.1, 0.8)) * Math.min(1, z);
    ctx.save();
    ctx.globalAlpha = hk * (1 - ease(k, 0.55, 0.9));
    ctx.fillStyle = rgba(0.9);
    standingPath(ctx, earthP[0], earthP[1] + s * 0.5, s);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, earthP[0], earthP[1], 90 * (1 - k * 0.8), col, 0.18 * hk * (1 - k));
    glow(ctx, earthP[0], earthP[1], 6, [160, 200, 255], hk * ease(k, 0.5, 0.9), 1);
    ctx.restore();
  }
  ctx.restore();
}

(() => {
  let wall;
  const PRINTS = [
    // x, y, scale, rot, negative?
    [880, 470, 128, -0.12, 1], [1060, 420, 118, 0.18, 1], [730, 610, 104, -0.42, 1],
    [1210, 600, 112, 0.36, 1], [990, 690, 96, 0.05, 0], [1390, 450, 92, 0.5, 1], [560, 420, 86, -0.3, 1],
  ];
  INITS.push(() => {
    const lw = 960, lh = 540;
    const base = makeCanvas(lw, lh);
    const x = base.getContext('2d'), img = x.createImageData(lw, lh);
    const hgt = (i, j) => fbm2(i / 120, j / 120, 401, 6) + 0.35 * fbm2(i / 28, j / 28, 405, 3);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const h0 = hgt(i, j), hx = hgt(i + 1, j) - h0, hy = hgt(i, j + 1) - h0;
      const shade = clamp(0.62 + (-hx * 0.6 + -hy * 0.8) * 14 + h0 * 0.35);
      const tint = 0.5 + 0.5 * fbm2(i / 200, j / 200, 409);
      const p = (j * lw + i) * 4;
      img.data[p] = (150 + 40 * tint) * shade; img.data[p + 1] = (112 + 20 * tint) * shade;
      img.data[p + 2] = (82 + 6 * tint) * shade; img.data[p + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    wall = makeCanvas();
    const w = wall.getContext('2d');
    w.drawImage(base, 0, 0, W, H);
    // 手印：吹喷的赭石，留下手的负形
    PRINTS.forEach(([px, py, s, r, neg], n) => {
      const c = makeCanvas(420, 420), cx = c.getContext('2d');
      if (neg) {
        const g = cx.createRadialGradient(210, 200, 10, 210, 200, 200);
        g.addColorStop(0, 'rgba(150,40,22,0.95)'); g.addColorStop(0.5, 'rgba(140,38,22,0.6)'); g.addColorStop(1, 'rgba(130,36,20,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, 420, 420);
        for (let i = 0; i < 1600; i++) {
          const a = rand(i, n + 410) * TAU, d = Math.pow(rand(i, n + 411), 0.6) * 200;
          cx.fillStyle = `rgba(120,30,18,${0.3 * rand(i, n + 412)})`;
          cx.fillRect(210 + Math.cos(a) * d, 200 + Math.sin(a) * d, 2, 2);
        }
        cx.globalCompositeOperation = 'destination-out';
        cx.fillStyle = cx.strokeStyle = '#000';
        fillHand(cx, 210, 250, s, 0, 1 + rand(n, 413) * 0.25);
      } else {
        cx.fillStyle = cx.strokeStyle = 'rgba(140,48,28,0.5)';
        fillHand(cx, 210, 250, s, 0, 0.9);
      }
      w.save();
      w.globalCompositeOperation = 'multiply';
      w.globalAlpha = 0.85;
      w.translate(px, py); w.rotate(r);
      w.drawImage(c, -210, -250);
      w.restore();
    });
  });

  // 神庙线稿：阶梯塔、柱廊、远处城邦
  const LINES = [];
  {
    const base = H * 0.79, tierH = 64, top = base - tierH * 5;
    for (let i = 0; i < 5; i++) {
      const hw = 500 - i * 82, y0 = base - i * tierH, y1 = y0 - tierH;
      LINES.push({ pts: [[CX - hw, y0], [CX - hw + 22, y1], [CX + hw - 22, y1], [CX + hw, y0]], a: 42.0 + i * 0.55, d: 1.6 });
    }
    LINES.push({ pts: [[CX - 55, base], [CX - 26, top]], a: 44.6, d: 1.4 });
    LINES.push({ pts: [[CX + 55, base], [CX + 26, top]], a: 44.6, d: 1.4 });
    for (let j = 1; j < 14; j++) {
      const y = base - (j / 14) * (base - top), hw = lerp(55, 26, j / 14);
      LINES.push({ pts: [[CX - hw, y], [CX + hw, y]], a: 44.8 + j * 0.06, d: 0.4, w: 0.6 });
    }
    LINES.push({ pts: [[CX - 40, top], [CX - 40, top - 30], [CX + 40, top - 30], [CX + 40, top]], a: 45.6, d: 0.8 });
    // 柱廊
    for (const side of [-1, 1]) {
      const x0 = CX + side * 700, x1 = CX + side * 930;
      for (let c = 0; c <= 5; c++) {
        const x = lerp(x0, x1, c / 5);
        LINES.push({ pts: [[x, base], [x, base - 200]], a: 43.0 + c * 0.15, d: 1.0, w: 0.8 });
      }
      LINES.push({ pts: [[x0 - 20 * side, base - 200], [x1 + 20 * side, base - 200]], a: 44.0, d: 0.8 });
      LINES.push({ pts: [[x0 - 26 * side, base - 220], [(x0 + x1) / 2, base - 280], [x1 + 26 * side, base - 220], [x0 - 26 * side, base - 220]], a: 44.4, d: 1.0 });
    }
    // 远处的城：一行低矮的屋宇
    for (let b = 0; b < 26; b++) {
      const side = b < 13 ? -1 : 1, i = b % 13;
      const x = CX + side * (1000 + i * 70), h = 30 + rand(b, 420) * 70, w = 40 + rand(b, 421) * 22;
      LINES.push({ pts: [[x, base], [x, base - h], [x + w * side, base - h], [x + w * side, base]], a: 43.4 + i * 0.12, d: 0.6, w: 0.6, dim: 0.5 });
    }
    LINES.push({ pts: [[0, base], [W, base]], a: 41.6, d: 2.2, w: 0.8 });
    LINES.top = top - 30;
  }

  function drawTemple(ctx, t, k) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [[5, 0.08], [1.2, 0.75]]) {
      for (const L of LINES) {
        const p = ramp(t, L.a, L.a + L.d);
        if (p <= 0) continue;
        ctx.strokeStyle = `rgba(${GOLD},${pass[1] * k * (L.dim ?? 1)})`;
        ctx.lineWidth = pass[0] * (L.w ?? 1);
        ctx.beginPath(); polyProgress(ctx, L.pts, p); ctx.stroke();
      }
    }
    ctx.restore();
  }

  scene('altar', 34.2, 66.6, 1.6, 0.01, (ctx, _, t) => {
    // 洞穴：火光在岩壁上跳动
    const caveK = 1 - ease(t, 41.0, 43.5);
    if (caveK > 0.002) {
      const push = 1.02 + ease(t, 34, 43.5) * 0.08;
      ctx.save();
      ctx.globalAlpha = caveK;
      ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
      ctx.drawImage(wall, 0, 0);
      ctx.restore();
      const fl = 0.85 + 0.15 * fbm1(t * 3.3, 31);
      const lx = W * 0.32 + fbm1(t * 0.9, 33) * 40, ly = H * 1.0;
      const g = ctx.createRadialGradient(lx, ly, 60, lx, ly, 1300 * fl);
      g.addColorStop(0, 'rgba(255,150,70,0)');
      g.addColorStop(0.3, `rgba(0,0,0,${0.15})`);
      g.addColorStop(0.75, 'rgba(0,0,0,0.82)');
      g.addColorStop(1, 'rgba(0,0,0,0.97)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, lx, ly, 700 * fl, [255, 120, 50], 0.18 * caveK);
      ctx.restore();
      if (caveK < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - caveK})`; ctx.fillRect(0, 0, W, H); }
    }
    // 神庙 → 推向祭坛之火 → 宇宙图从火中展开
    const toFire = easeInOut(ramp(t, 49.2, 53.2));
    const templeK = ease(t, 41.8, 43) * (1 - ease(t, 50.2, 52.6));
    const fy = LINES.top;
    if (templeK > 0.002) {
      ctx.save();
      const sc = 1 + toFire * 3.2;
      ctx.translate(CX, lerp(fy, CY, toFire)); ctx.scale(sc, sc); ctx.translate(-CX, -fy);
      drawTemple(ctx, t, templeK);
      drawFire(ctx, CX, fy + 2, 0.32, t, ease(t, 45.6, 47) * (1 - ease(t, 52, 53.5)), 7);
      drawEmbers(ctx, CX, fy, 0.5, t, ease(t, 46, 47.5) * templeK, 8, 18, 300);
      ctx.restore();
    }
    // 火的光芒在中心炸开，展成天层
    const flare = win(t, 51.6, 54.8, 1.2, 2.0);
    if (flare > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, CX, CY, 420 * (0.6 + flare * 0.6), [255, 180, 100], 0.4 * flare);
      ctx.restore();
    }
    const grow = ramp(t, 52.0, 60.5);
    if (grow > 0) {
      drawStars(ctx, t, 0.5 * ease(t, 55, 62), H * 0.7, 0.3);
      drawCosmos(ctx, t, { grow: easeInOut(grow), human: ease(t, 53.4, 56) });
    }
  });
})();
