// 第三幕：天空不再围绕我们
// 宇宙缩放：L 为对数尺度。0 = 太阳系图，-4 = 恒星邻域，-8 = 银河，-12 = 星系之间。
let GALAXY = null;
const NEIGH = [], FIELD = [], GSPRITES = [];
const G_SUN = [0.52, 0.2];

INITS.push(() => {
  // 银河：面向我们略倾斜的旋涡
  const S = 1800, R = 800;
  GALAXY = makeCanvas(S, S);
  const g = GALAXY.getContext('2d');
  g.globalCompositeOperation = 'lighter';
  const core = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, R * 0.35);
  core.addColorStop(0, 'rgba(255,226,180,0.7)'); core.addColorStop(0.3, 'rgba(240,200,150,0.22)'); core.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = core; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70000; i++) {
    const bulge = i < 14000;
    let r, th;
    if (bulge) { r = Math.abs(noiseGauss(i, 1)) * 0.11; th = rand(i, 2) * TAU; }
    else {
      r = 0.06 + Math.pow(rand(i, 3), 0.75) * 0.94;
      th = (i % 2) * Math.PI + 2.7 * Math.log(r * 9 + 1) + noiseGauss(i, 4) * (0.1 + 0.16 * (1 - r)) + (i % 4 > 1 ? 0.5 : 0);
    }
    const x = S / 2 + Math.cos(th) * r * R, y = S / 2 + Math.sin(th) * r * R * 0.62;
    const k = rand(i, 5);
    const col = bulge ? '255,220,170' : k < 0.03 ? '255,150,170' : k < 0.5 ? '190,205,255' : '235,232,240';
    g.fillStyle = `rgba(${col},${bulge ? 0.22 : 0.12 + 0.3 * k * (1 - r)})`;
    const sz = k > 0.985 ? 2.4 : 1.3;
    g.fillRect(x, y, sz, sz);
  }
  // 星系之间的远方星系
  for (let n = 0; n < 14; n++) {
    const c = makeCanvas(64, 64), x = c.getContext('2d');
    x.translate(32, 32); x.rotate(rand(n, 30) * TAU); x.scale(1, 0.35 + rand(n, 31) * 0.65);
    const warm = rand(n, 32) < 0.55;
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, 30);
    gr.addColorStop(0, warm ? 'rgba(255,225,190,0.9)' : 'rgba(215,225,255,0.9)');
    gr.addColorStop(0.25, warm ? 'rgba(240,190,140,0.35)' : 'rgba(170,190,255,0.3)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(-32, -32, 64, 64);
    GSPRITES.push(c);
  }
  for (let i = 0; i < 2600; i++) {
    const a = rand(i, 40) * TAU, d = 0.05 + Math.abs(noiseGauss(i, 41)) * 0.7;
    NEIGH.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, m: Math.pow(rand(i, 42), 3), col: rand(i, 43) < 0.3 ? [255, 210, 170] : [220, 228, 255] });
  }
  for (let i = 0; i < 4200; i++) {
    let x = (rand(i, 50) - 0.5) * 18, y = (rand(i, 51) - 0.5) * 11;
    // 纤维状的宇宙网：沿几条丝带聚集
    const fil = Math.sin(x * 0.9 + Math.sin(y * 0.7) * 2) * Math.cos(y * 1.1 - x * 0.3);
    if (Math.abs(fil) > 0.55 && rand(i, 52) < 0.6) continue;
    if (Math.hypot(x, y) < 0.25) continue;
    FIELD.push({ x, y, s: 0.012 + Math.pow(rand(i, 53), 3) * 0.07, sp: i % GSPRITES.length, a: 0.4 + rand(i, 54) * 0.6 });
  }
});
function noiseGauss(i, s) { return Math.sqrt(-2 * Math.log(rand(i, s * 7) + 1e-6)) * Math.cos(TAU * rand(i, s * 7 + 1)); }

// ret：回落阶段，镜头对准地球而非太阳
function drawUniverse(ctx, t, L, ret = 0) {
  const D = -L; // 深度：越大越远
  const vis = (a, b, c, d) => Math.min(a === null ? 1 : ramp(D, a, b), 1 - ramp(D, c, d));
  // 银河视角下，镜头从太阳挪向银心
  const ppuG = 400 * Math.exp(L + 8);
  const kg = smooth(ramp(-L, 6, 10));
  const S = [CX + G_SUN[0] * ppuG * kg, CY + G_SUN[1] * ppuG * kg];
  const G = [S[0] - G_SUN[0] * ppuG, S[1] - G_SUN[1] * ppuG];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // 星系之间
  const fk = vis(9.6, 11.2, 99, 100);
  if (fk > 0) {
    const ppu = 400 * Math.exp(L + 12);
    for (const f of FIELD) {
      const x = G[0] + f.x * ppu, y = G[1] + f.y * ppu, r = Math.max(1.2, f.s * ppu);
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      ctx.globalAlpha = fk * f.a;
      ctx.drawImage(GSPRITES[f.sp], x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
  // 银河
  const gk = vis(4.9, 6.2, 99, 100);
  if (gk > 0) {
    const r = ppuG * 1.125; // 图像半径 900px 对应 1.125 单位
    ctx.globalAlpha = gk;
    if (r < 6000) ctx.drawImage(GALAXY, G[0] - r, G[1] - r, r * 2, r * 2);
    if (r < 30) glow(ctx, G[0], G[1], 6, [240, 225, 200], gk * 0.5 * (1 - r / 30), 1);
    ctx.globalAlpha = 1;
  }
  // 恒星邻域
  const nk = vis(1.4, 2.6, 4.7, 6.0) * (1 - ret);
  if (nk > 0) {
    const ppu = 400 * Math.exp(L + 4);
    for (const s of NEIGH) {
      const x = S[0] + s.x * ppu, y = S[1] + s.y * ppu;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const shrink = clamp(ppu / 3000, 0.25, 1);
      glow(ctx, x, y, (2 + s.m * 7) * shrink, s.col, nk * (0.25 + s.m * 0.75) * (0.4 + 0.6 * shrink), 1);
    }
  }
  ctx.restore();
  // 太阳系
  const sk = vis(null, 0, 3.2, 4.6);
  if (sk > 0) {
    ctx.save();
    ctx.globalAlpha = sk;
    const z = Math.exp(L);
    const st = cosmosState(t, { helio: 1, z });
    const ke = ret * smooth(ramp(L, -2.2, 0.8));
    ctx.translate(-st.earth[0] * z * ke, -st.earth[1] * z * ke);
    drawCosmos(ctx, t, { helio: 1, z, starSphere: 0, human: 1 });
    ctx.restore();
  }
  // “我们在这里”
  const mk = vis(2.8, 3.6, 11.6, 12.4) * (1 - ret);
  if (mk > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(200,214,232,${0.55 * mk})`;
    ctx.lineWidth = 1;
    const r = lerp(18, 7, ramp(-L, 6, 12));
    ctx.beginPath(); ctx.arc(S[0], S[1], r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

(() => {
  // 伽利略的木星：四颗卫星在几个夜晚之间换位
  const MOONS = [[1.77, 4.2, 0.3], [3.55, 6.7, 1.9], [7.15, 10.7, 3.1], [16.7, 18.8, 4.4]];
  const NIGHTS = 6, N0 = 69.0, ND = 1.45;
  const moonX = (j, day) => Math.sin((TAU * day) / MOONS[j][0] + MOONS[j][2]) * MOONS[j][1];

  function telescope(ctx, t, k) {
    const R = 290 * (0.94 + 0.06 * k);
    const n = clamp(Math.floor((t - N0) / ND), 0, NIGHTS - 1);
    const day = n * 1 + (t - N0 - n * ND) * 0.04;
    const ap = [CX - 150, CY - 20];
    ctx.save();
    ctx.globalAlpha = k;
    ctx.beginPath(); ctx.arc(ap[0], ap[1], R, 0, TAU);
    ctx.fillStyle = '#020204'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) glow(ctx, ap[0] + (rand(i, 70) - 0.5) * R * 2, ap[1] + (rand(i, 71) - 0.5) * R * 2, 2.5, [220, 225, 255], 0.3 * rand(i, 72), 1);
    // 视宁度造成的轻微抖动
    const jx = noise1(t * 7, 73) * 1.5, jy = noise1(t * 7, 74) * 1.5;
    const jx0 = ap[0] + jx, jy0 = ap[1] + jy;
    const g = ctx.createRadialGradient(jx0 - 6, jy0 - 6, 2, jx0, jy0, 30);
    g.addColorStop(0, 'rgba(250,236,210,1)'); g.addColorStop(0.8, 'rgba(214,190,150,0.95)'); g.addColorStop(1, 'rgba(150,120,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(jx0, jy0, 30, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(150,110,80,0.35)'; ctx.lineWidth = 2.2;
    for (const by of [-9, 6]) { ctx.beginPath(); ctx.moveTo(jx0 - 27, jy0 + by); ctx.quadraticCurveTo(jx0, jy0 + by + 2, jx0 + 27, jy0 + by); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, jx0, jy0, 90, [255, 230, 190], 0.18);
    for (let j = 0; j < 4; j++) glow(ctx, jx0 + moonX(j, day) * 11, jy0 + moonX(j, day) * 0.4, 6, [240, 236, 228], 0.95, 1);
    ctx.restore();
    // 镜筒边缘
    const rim = ctx.createRadialGradient(ap[0], ap[1], R * 0.82, ap[0], ap[1], R);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(ap[0], ap[1], R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,190,170,0.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ap[0], ap[1], R + 6, 0, TAU); ctx.stroke();
    // 观测手记：O 为木星，* 为卫星
    const nx = CX + 300, ny0 = CY - 190;
    ctx.font = `italic 20px ${LATIN}`;
    ctx.textBaseline = 'middle';
    for (let r = 0; r <= n; r++) {
      const a = r === n ? ease(t - N0 - r * ND, 0, 0.6) : 1;
      const y = ny0 + r * 66;
      ctx.fillStyle = `rgba(214,200,176,${0.55 * a})`;
      ctx.fillText(['Jan. 7', '8', '10', '11', '12', '13'][r], nx, y);
      ctx.strokeStyle = `rgba(226,214,190,${0.75 * a})`; ctx.lineWidth = 1.3;
      const jx = nx + 260;
      ctx.beginPath(); ctx.arc(jx, y, 9, 0, TAU); ctx.stroke();
      for (let j = 0; j < 4; j++) {
        const mx = jx + moonX(j, r) * 9;
        if (Math.abs(mx - jx) < 14) continue; // 被木星挡住
        ctx.beginPath();
        for (let q = 0; q < 3; q++) { const aa = (q / 3) * Math.PI; ctx.moveTo(mx - Math.cos(aa) * 5, y - Math.sin(aa) * 5); ctx.lineTo(mx + Math.cos(aa) * 5, y + Math.sin(aa) * 5); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  scene('cosmos', 66.6, 104.4, 0.01, 0.9, (ctx, _, t) => {
    const scope = win(t, 67.4, 78.4, 1.4, 1.2);
    const helio = easeInOut(ramp(t, 79.6, 86.6));
    // 缩出，然后在下一幕开头冲回地球
    let L = -12 * (0.5 - 0.5 * Math.cos(Math.PI * ramp(t, 87.0, 100.0))), ret = 0;
    if (t > 100.6) { const r = ramp(t, 100.6, 104.4); L = lerp(-12, 2.4, Math.pow(r, 2.2)); ret = 1; }
    const starsK = 0.5 * (1 - ease(t, 86, 90)) * (1 - scope * 0.6);
    drawStars(ctx, t, starsK, H * 0.7, 0.3);
    if (L > -0.02 && t < 87.1) {
      ctx.save();
      ctx.globalAlpha = 1 - scope * 0.8;
      drawCosmos(ctx, t, { helio, human: 1, cool: helio });
      ctx.restore();
    } else drawUniverse(ctx, t, L, ret);
    if (scope > 0) telescope(ctx, t, scope);
    // 回落：地球的淡蓝在画面里涨满
    if (ret) {
      const b = ease(t, 102.6, 104.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, CX, CY, 80 + b * 1400, [90, 150, 200], 0.2 + b * 0.5);
      ctx.restore();
    }
  });
})();
