// 第二幕 · 第一重：位置
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
  const NIGHTS = 6;
  let N0 = 0.6, ND = 1.45;
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


  SHOT.ptolemy = (ctx, u, dur, sh) => {
    const sw = ease(u, sh.b2 - 0.8, sh.b2 + 0.8);
    if (sw < 1) kenburns(ctx, 'ptolemy', u / Math.max(1, sh.b2 + 0.8), [0.5, 0.52, 1.0], [0.5, 0.5, 0.56], { alpha: 1 - sw, filter: 'brightness(0.8) saturate(0.85)' });
    if (sw > 0) {
      ctx.save(); ctx.globalAlpha = sw;
      drawStars(ctx, u + 60, 0.45, H * 0.7, 0.3);
      drawCosmos(ctx, u * 3 + 20, { grow: 1, human: 1 });
      // 一千四百年
      const k = ease(u, sh.b2, sh.b2_end + 1.0);
      const year = Math.round(lerp(150, 1543, k));
      ctx.font = `44px ${SERIF}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '0.08em';
      ctx.fillStyle = gold(0.75);
      ctx.fillText(String(year), W - 150, CY);
      ctx.font = `16px ${SERIF}`; ctx.fillStyle = gold(0.5); ctx.letterSpacing = '0.3em';
      ctx.fillText(TL.lang === 'zh' ? '公元' : 'A.D.', W - 150, CY - 46);
      ctx.restore();
    }
  };
  SHOT.flammarion = (ctx, u, dur) => {
    kenburns(ctx, 'flammarion', u / dur, [0.32, 0.6, 0.62], [0.2, 0.36, 0.5]);
  };
  SHOT.copernicus = (ctx, u, dur, sh) => {
    const helio = easeInOut(ramp(u, sh.b3 + 0.2, sh.b3 + 4.6));
    const arch = ease(u, dur - 3.4, dur - 1.6);
    if (arch < 1) {
      ctx.save(); ctx.globalAlpha = 1 - arch;
      drawStars(ctx, u + 80, 0.45 * (1 - helio * 0.4), H * 0.7, 0.3);
      drawCosmos(ctx, u * 3 + 20 + 34, { helio, human: 1, cool: helio });
      ctx.restore();
    }
    if (arch > 0) kenburns(ctx, 'copernicus', ramp(u, dur - 3.4, dur), [0.5, 0.5, 0.75], [0.5, 0.5, 0.5], { alpha: arch, filter: 'brightness(0.8) saturate(0.85)' });
  };
  SHOT.galileo = (ctx, u, dur) => {
    N0 = 0.5; ND = (dur - 1.0) / NIGHTS;
    drawStars(ctx, u + 90, 0.2, H * 0.7, 0);
    telescope(ctx, u, win(u, 0, dur, 0.6, 0.6));
  };
  SHOT.zoom = (ctx, u, dur) => {
    const L = -12 * (0.5 - 0.5 * Math.cos(Math.PI * ramp(u, 0.4, dur - 0.6)));
    drawUniverse(ctx, u + 100, L, 0);
  };
  SHOT.paleblue = (ctx, u, dur, sh) => {
    const D = [0.5946, 0.5196];
    const map = kenburns(ctx, 'paleblue', ramp(u, 0, dur - 2.5), [0.5, 0.5, 1.0], [D[0], D[1] + 0.028, 0.14], { filter: 'brightness(0.9)', vig: 0.6 });
    const k = ease(u, sh.b9 - 0.2, sh.b9 + 0.8) * (1 - ease(u, dur - 4.4, dur - 3.4));
    if (k > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(220,230,240,${0.6 * k})`; ctx.lineWidth = 1.2;
      const [dx, dy] = map(D[0], D[1]);
      ctx.beginPath(); ctx.arc(dx, dy, 22 + (1 - k) * 10, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  };
})();

// 宇宙年历：一整年转过，镜头推到最后一天、最后一分钟，只有最后约 11 秒属于我们的文明
(() => {
  const MONTHS = { zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] };
  const col = (a) => `rgba(${GOLD},${a})`;
  function bar(ctx, y, x0, x1, ticks, labels, k, hiFrom = null, hiLabel = '') {
    ctx.strokeStyle = col(0.6 * k); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.font = `18px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i <= ticks; i++) {
      const x = lerp(x0, x1, i / ticks), big = labels[i] !== undefined;
      ctx.strokeStyle = col((big ? 0.6 : 0.25) * k);
      ctx.beginPath(); ctx.moveTo(x, y - (big ? 14 : 7)); ctx.lineTo(x, y); ctx.stroke();
      if (big) { ctx.fillStyle = col(0.6 * k); ctx.fillText(labels[i], x, y + 14); }
    }
    if (hiFrom !== null) {
      const xa = lerp(x0, x1, hiFrom);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(xa, 0, x1, 0);
      g.addColorStop(0, `rgba(255,220,160,${0.35 * k})`); g.addColorStop(1, `rgba(255,236,200,${0.85 * k})`);
      ctx.fillStyle = g; ctx.fillRect(xa, y - 26, x1 - xa, 26);
      glow(ctx, x1, y - 13, 80, [255, 220, 160], 0.4 * k);
      ctx.restore();
      ctx.font = `22px ${SERIF}`; ctx.fillStyle = `rgba(255,232,190,${0.9 * k})`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(hiLabel, x1, y - 38);
    }
  }
  SHOT.cosmicyear = (ctx, u, dur, sh) => {
    drawStars(ctx, u + 140, 0.35, H * 0.7, 0.3);
    const L = TL.lang === 'zh' ? 'zh' : 'en';
    const p1 = ramp(u, 0.3, dur * 0.42);                 // 一年转过
    const s2 = ease(u, dur * 0.38, dur * 0.5);            // 换到最后一天
    const s3 = ease(u, dur * 0.62, dur * 0.72);           // 换到最后一分钟
    const c = [CX, CY - 40], R = 300;
    const dk = 1 - s2;
    if (dk > 0.01) {
      ctx.save();
      const z = 1 + s2 * 6;
      ctx.translate(c[0], c[1] - R * s2 * 0.9); ctx.scale(z, z); ctx.translate(-c[0], -c[1]);
      ctx.globalAlpha = dk;
      ctx.strokeStyle = col(0.55); ctx.lineWidth = 1.4 / z;
      ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.stroke();
      ctx.font = `20px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let m = 0; m < 12; m++) {
        const a = -Math.PI / 2 + (m / 12) * TAU, a2 = a + TAU / 24;
        ctx.strokeStyle = col(0.5); ctx.beginPath();
        ctx.moveTo(c[0] + Math.cos(a) * (R - 16), c[1] + Math.sin(a) * (R - 16)); ctx.lineTo(c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R); ctx.stroke();
        ctx.fillStyle = col(0.55); ctx.fillText(MONTHS[L][m], c[0] + Math.cos(a2) * (R + 34), c[1] + Math.sin(a2) * (R + 34));
      }
      // 时针扫过一年，留下轨迹
      const ang = -Math.PI / 2 + easeInOut(p1) * TAU;
      ctx.strokeStyle = col(0.25); ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(c[0], c[1], R - 40, -Math.PI / 2, ang); ctx.stroke();
      ctx.strokeStyle = col(0.85); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(ang) * (R - 24), c[1] + Math.sin(ang) * (R - 24)); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, c[0] + Math.cos(ang) * (R - 24), c[1] + Math.sin(ang) * (R - 24), 30, [255, 220, 160], 0.7);
      ctx.restore();
      ctx.font = `16px ${SERIF}`; ctx.fillStyle = col(0.5);
      ctx.fillText(TL.lang === 'zh' ? '大爆炸 · 一月一日零点' : 'Big Bang · Jan 1, 00:00', c[0], c[1] - R + 46);
      ctx.restore();
    }
    // 最后一天：12 月 31 日
    const k2 = s2 * (1 - s3);
    if (k2 > 0.01) {
      const hours = {}; for (let h = 0; h <= 24; h += 6) hours[h] = `${String(h).padStart(2, '0')}:00`;
      ctx.save(); ctx.globalAlpha = 1;
      ctx.font = `24px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = col(0.7 * k2);
      ctx.fillText(TL.lang === 'zh' ? '十二月三十一日' : 'December 31', CX, CY - 150);
      bar(ctx, CY, 260, W - 260, 24, hours, k2);
      ctx.restore();
    }
    // 最后一分钟：23:59:00 — 24:00:00，最后约 11 秒亮起
    if (s3 > 0.01) {
      const secs = {}; for (let sc = 0; sc <= 60; sc += 10) secs[sc] = sc === 60 ? '24:00:00' : `23:59:${String(sc).padStart(2, '0')}`;
      const hk = ease(u, dur * 0.74, dur * 0.84);
      ctx.save();
      ctx.font = `24px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = col(0.7 * s3);
      ctx.fillText(TL.lang === 'zh' ? '最后一分钟' : 'The final minute', CX, CY - 150);
      bar(ctx, CY, 260, W - 260, 60, secs, s3, hk > 0 ? lerp(1, 49 / 60, hk) : null, TL.lang === 'zh' ? '我们的全部文明 · 约 11 秒' : 'All of our civilization · about 11 seconds');
      ctx.restore();
    }
  };
})();
