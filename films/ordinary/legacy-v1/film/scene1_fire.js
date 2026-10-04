// 第一幕：黑暗中的人
(() => {
  const FX = CX, FY = H * 0.715; // 火的位置
  let clouds, bolts = [];
  const ridgeFar = [], ridgeNear = [];

  function makeBolt(seed, x0, x1, y1) {
    const segs = [];
    function sub(ax, ay, bx, by, depth, w, sd) {
      if (depth === 0) { segs.push([ax, ay, bx, by, w]); return; }
      const mx = (ax + bx) / 2 + (rand(sd, seed) - 0.5) * Math.hypot(bx - ax, by - ay) * 0.32;
      const my = (ay + by) / 2 + (rand(sd, seed + 1) - 0.5) * 18;
      sub(ax, ay, mx, my, depth - 1, w, sd * 2 + 1);
      sub(mx, my, bx, by, depth - 1, w, sd * 2 + 2);
      if (depth >= 3 && rand(sd, seed + 2) < 0.28) {
        const ang = (rand(sd, seed + 3) - 0.5) * 1.6;
        const len = Math.hypot(bx - ax, by - ay) * 0.9;
        sub(mx, my, mx + Math.sin(ang) * len, my + Math.cos(ang) * len * 0.8, depth - 2, w * 0.45, sd * 7 + 3);
      }
    }
    sub(x0, -30, x1, y1, 7, 1, 1);
    return segs;
  }

  INITS.push(() => {
    const lw = 480, lh = 270;
    clouds = makeCanvas(lw, lh);
    const x = clouds.getContext('2d'), img = x.createImageData(lw, lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const v = clamp(0.45 + fbm2(i / 70, j / 45, 301) * 1.1) * (1 - j / lh * 0.55);
      const p = (j * lw + i) * 4;
      img.data[p] = 120 * v; img.data[p + 1] = 124 * v; img.data[p + 2] = 150 * v; img.data[p + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    for (let i = 0; i <= 96; i++) {
      const x = (i / 96) * W;
      ridgeFar.push([x, H * 0.55 + fbm1(i / 14, 41) * 70 - Math.exp(-(((x - W * 0.3) / 300) ** 2)) * 60]);
      ridgeNear.push([x, H * 0.645 + fbm1(i / 9, 43) * 24]);
    }
    bolts = TL.lightning.map((L) => makeBolt(L.seed, L.x * W, L.x * W + (rand(L.seed, 9) - 0.5) * 160, H * 0.6));
  });

  function strikeEnv(t, L) {
    const dt = t - L.t;
    if (dt < 0 || dt > 2.5) return { bolt: 0, sky: 0 };
    let bolt = 0;
    for (const [d, amp] of [[0, 1], [0.07, 0.7], [0.17, 0.85], [0.3, 0.35]]) if (dt >= d) bolt = Math.max(bolt, amp * Math.exp(-(dt - d) * 22));
    return { bolt: bolt * L.power, sky: (bolt * 0.8 + 0.25 * Math.exp(-dt * 3)) * L.power };
  }

  const FIGS = [
    // 火后，面向镜头，被火照亮
    { x: -180, y: -12, h: 140, v: { sw: 1.05, lean: 0.05, tilt: 0.1, seed: 1, asym: 0.08, sh: 0.06 }, back: true },
    { x: 150, y: -18, h: 128, v: { sw: 0.92, lean: -0.1, tilt: -0.15, seed: 2, asym: -0.1, drop: 0.03 }, back: true },
    { x: 30, y: -40, h: 104, v: { sw: 1, lean: 0.03, seed: 3, sh: -0.05 }, back: true },
    // 火前，背光的剪影
    { x: -350, y: 86, h: 214, v: { sw: 1.1, lean: 0.07, turn: 0.03, seed: 4, asym: 0.1, drop: 0.04 } },
    { x: 330, y: 104, h: 236, v: { sw: 1.0, lean: -0.11, tilt: -0.08, seed: 5, sh: 0.07 } },
  ];
  const EYES = [[175, 812, 0.6], [1712, 772, 0.3], [1535, 846, 1.4], [318, 726, 2.2], [1820, 690, 3.1]];

  function wide(ctx, t) {
    const push = 1 + ease(t, 0, 23) * 0.06;
    ctx.save();
    ctx.translate(FX, FY); ctx.scale(push, push); ctx.translate(-FX, -FY);

    let sky = 0, boltK = [];
    TL.lightning.forEach((L, i) => { const e = strikeEnv(t, L); sky += e.sky; boltK[i] = e.bolt; });
    sky = Math.min(1.2, sky);
    if (sky > 0.003) {
      ctx.globalAlpha = Math.min(1, sky * 0.75);
      ctx.drawImage(clouds, -40, -40, W + 80, H * 0.75);
      ctx.globalAlpha = 1;
    }
    // 闪电
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    bolts.forEach((segs, i) => {
      const k = boltK[i];
      if (k < 0.01) return;
      for (const [lw, al, col] of [[16, 0.06, '160,170,255'], [6, 0.18, '200,205,255'], [1.6, 1, '245,246,255']]) {
        for (const main of [true, false]) {
          ctx.strokeStyle = `rgba(${col},${k * al * (main ? 1 : 0.5)})`;
          ctx.lineWidth = lw * (main ? 1 : 0.5);
          ctx.beginPath();
          for (const [ax, ay, bx, by, w] of segs) if ((w > 0.9) === main) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
          ctx.stroke();
        }
      }
      glow(ctx, segs[segs.length - 1][2], H * 0.56, 300, [170, 180, 255], k * 0.25);
    });
    ctx.restore();

    // 山脊与大地（闪光时成为剪影）
    const fireK = ease(t, 9.1, 12.5) * (0.88 + 0.12 * fbm1(t * 4, 2));
    ctx.fillStyle = `rgb(${4 + sky * 10},${4 + sky * 10},${7 + sky * 14})`;
    ctx.beginPath(); ctx.moveTo(-50, H + 50); ridgeFar.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(W + 50, H + 50); ctx.fill();
    ctx.fillStyle = '#020202';
    ctx.beginPath(); ctx.moveTo(-50, H + 50); ridgeNear.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(W + 50, H + 50); ctx.fill();

    // 地面火光
    if (fireK > 0) {
      ctx.save();
      ctx.translate(FX, FY + 10); ctx.scale(1, 0.24);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 640);
      g.addColorStop(0, `rgba(150,62,20,${0.55 * fireK})`);
      g.addColorStop(0.4, `rgba(70,26,10,${0.35 * fireK})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400);
      ctx.restore();
    }

    // 火后的人
    for (const f of FIGS.filter((f) => f.back)) {
      const g = ctx.createRadialGradient(FX, FY + 20, 20, FX, FY + 20, 360);
      g.addColorStop(0, `rgba(${96 * fireK + 3},${38 * fireK + 3},${14 * fireK + 4},1)`);
      g.addColorStop(0.45, `rgba(${46 * fireK + 3},${18 * fireK + 3},${8 * fireK + 4},1)`);
      g.addColorStop(1, 'rgba(4,3,4,1)');
      ctx.fillStyle = g;
      seatedPath(ctx, FX + f.x, FY + f.y, f.h, f.v);
      ctx.fill();
    }

    // 燧石的火星，然后起火
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [st, n] of [[8.55, 0], [8.95, 1], [9.15, 2]]) {
      const dt = t - st;
      if (dt < 0 || dt > 0.5) continue;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (rand(i, n + 60) - 0.5) * 2.4, sp = 120 + rand(i, n + 61) * 220;
        glow(ctx, FX + Math.cos(a) * sp * dt, FY - 6 + Math.sin(a) * sp * dt + 300 * dt * dt, 4, [255, 220, 150], Math.exp(-dt * 9), 1);
      }
      glow(ctx, FX, FY - 6, 40, [255, 200, 130], Math.exp(-dt * 14) * 0.7);
    }
    ctx.restore();
    drawFire(ctx, FX, FY + 4, 0.72 * (0.4 + 0.6 * ease(t, 9.1, 13)), t, fireK, 1);
    drawEmbers(ctx, FX, FY, 0.9, t, fireK, 1, 30, 520);

    // 火前的人：黑色剪影，带边缘光
    for (const f of FIGS.filter((f) => !f.back)) {
      ctx.fillStyle = '#000';
      seatedPath(ctx, FX + f.x, FY + f.y, f.h, f.v);
      ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(FX, FY - 40, 60, FX, FY - 40, 420);
      rg.addColorStop(0, `rgba(255,150,70,${0.5 * fireK})`);
      rg.addColorStop(0.6, `rgba(255,120,50,${0.16 * fireK})`);
      rg.addColorStop(1, 'rgba(255,120,50,0)');
      ctx.strokeStyle = rg;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 火光之外的眼睛
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    EYES.forEach(([ex, ey, ph], i) => {
      const k = win(t, 13 + ph, 22.5 - ph * 0.6, 1.5, 1.5);
      const blink = noise1(t * 0.8 + i * 10, 77) > -0.55 ? 1 : 0;
      const look = noise1(t * 0.3 + i, 78) * 3;
      if (k * blink < 0.01) return;
      for (const d of [-8, 8]) glow(ctx, ex + d + look, ey, 5, [200, 214, 150], 0.45 * k * blink, 1);
    });
    ctx.restore();
  }

  function close(ctx, t) {
    const tilt = easeInOut(ramp(t, 29.6, 34.6));
    const oy = tilt * H * 1.25;
    const flick = 0.82 + 0.18 * fbm1(t * 3.4, 2);
    // 天空先于人出现在画面上方
    drawStars(ctx, t, ease(t, 27.5, 32.5), H * 0.15 + tilt * H * 0.55, ease(t, 30, 34.5));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, W * 0.86, H * 1.12 + oy, 980, [255, 110, 40], 0.22 * flick);
    ctx.restore();
    const a = lerp(0.1, -0.3, easeInOut(ramp(t, 24.2, 29.8)));
    drawProfile(ctx, W * 0.42, H * 0.6 + oy, 360, a, { rgb: [255, 150, 72], k: flick }, 1);
    drawEmbers(ctx, W * 0.72, H * 1.1 + oy, 1.7, t, 1, 4, 22, 700);
  }

  scene('fire', 0, 35.2, 0.01, 1.6, (ctx, t) => {
    const k = 1 - ease(t, 22.4, 24.0);
    if (k > 0.002) { ctx.save(); ctx.globalAlpha = 1; wide(ctx, t); ctx.restore(); }
    if (k < 0.998) {
      // 叠化：先把远景压暗，再叠近景
      if (k > 0.002) { ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(0, 0, W, H); }
      ctx.save();
      ctx.globalAlpha = 1;
      if (k > 0.002) {
        const b2 = makeTemp(); const c2 = b2.getContext('2d');
        c2.fillStyle = '#000'; c2.fillRect(0, 0, W, H); close(c2, t);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k; ctx.drawImage(b2, 0, 0);
      } else close(ctx, t);
      ctx.restore();
    }
  });
})();

// 场景内部叠化用的临时画布
let _tmp = null;
function makeTemp() { return _tmp || (_tmp = makeCanvas()); }
