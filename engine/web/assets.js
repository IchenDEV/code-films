// 全片复用的元素：火、余烬、星空、人的剪影、手。

// —— 火 ——
function drawFire(ctx, x, y, s, t, k = 1, seed = 0) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const flick = 0.85 + 0.15 * fbm1(t * 3.1, seed + 5);
  // 火心底光
  glow(ctx, x, y - 30 * s, 260 * s * flick, [255, 120, 40], 0.22 * k);
  glow(ctx, x, y - 20 * s, 110 * s, [255, 190, 110], 0.35 * k);
  const N = 240;
  for (let i = 0; i < N; i++) {
    const P = 0.7 + rand(i, seed) * 0.7;
    const u = t / P + rand(i, seed + 1);
    const cyc = Math.floor(u), age = u - cyc;
    const r1 = rand(i * 7 + cyc, seed + 2), r2 = rand(i * 3 + cyc, seed + 3);
    const spread = (r1 - 0.5) * 70 * s * (1 - age * 0.75);
    const sway = fbm1(t * 1.7 + i * 0.13, seed + 9) * 26 * s * age;
    const px = x + spread + sway;
    const py = y - age * (150 + 110 * r2) * s * flick;
    const size = s * (30 * Math.pow(1 - age, 0.9) + 4);
    const col = rampColor(FIRE_RAMP, age * 0.9 + 0.04 + Math.abs(spread) / (90 * s) * 0.3);
    const a = Math.min(1, age / 0.08) * Math.pow(1 - age, 1.4) * 0.42 * k;
    glow(ctx, px, py, size, col, a);
  }
  ctx.restore();
}

function drawEmbers(ctx, x, y, s, t, k = 1, seed = 0, n = 40, rise = 520) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const P = 2.8 + rand(i, seed + 20) * 3.5;
    const u = t / P + rand(i, seed + 21);
    const cyc = Math.floor(u), age = u - cyc;
    const r = rand(i + cyc * 31, seed + 22);
    const px = x + (r - 0.5) * 90 * s + fbm1(t * 0.6 + i, seed + 23) * 140 * s * age + age * 60 * s;
    const py = y - 40 * s - age * rise * s * (0.6 + r * 0.6);
    const tw = 0.5 + 0.5 * Math.sin(t * (9 + r * 14) + i);
    const a = Math.min(1, age / 0.05) * Math.pow(1 - age, 1.6) * k * (0.5 + 0.5 * tw);
    glow(ctx, px, py, (3 + r * 3) * s, [255, 170 + r * 60, 90], a, 1);
  }
  ctx.restore();
}

// —— 星空 ——
const STARS = [];
let milkyWay = null;
function initStars() {
  for (let i = 0; i < 2600; i++) {
    const m = Math.pow(rand(i, 501), 5);
    const temp = rand(i, 502);
    const col = temp < 0.2 ? [255, 214, 180] : temp > 0.8 ? [190, 210, 255] : [236, 236, 244];
    STARS.push({ x: rand(i, 503) * W, y: rand(i, 504) * H * 2.2, m, col, tw: rand(i, 505) * 50 });
  }
  // 银河：低分辨率噪声云，放大后足够柔和
  const lw = 480, lh = 594;
  milkyWay = makeCanvas(lw, lh);
  const x = milkyWay.getContext('2d');
  const img = x.createImageData(lw, lh);
  for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
    const u = i / lw, v = j / lh;
    const d = (v - (0.25 + u * 0.5)) * 3.2; // 斜向带
    const band = Math.exp(-d * d * 2.4);
    const cloud = 0.55 + 0.45 * fbm2(u * 6, v * 6, 71);
    const dust = clamp(0.5 + fbm2(u * 11, v * 11, 91) * 1.6);
    const b = band * cloud * (0.35 + 0.65 * dust);
    const p = (j * lw + i) * 4;
    img.data[p] = 150 * b; img.data[p + 1] = 160 * b; img.data[p + 2] = 190 * b; img.data[p + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}
// oy：垂直偏移（俯仰），k：整体亮度
function drawStars(ctx, t, k = 1, oy = 0, mw = 1) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (mw > 0) {
    ctx.globalAlpha = 0.55 * k * mw;
    ctx.drawImage(milkyWay, 0, -H * 1.2 + oy, W, H * 2.2);
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const y = s.y - H * 1.2 + oy;
    if (y < -10 || y > H + 10) continue;
    const tw = 0.72 + 0.28 * noise1(t * 2.2 + s.tw, 7);
    const a = (0.12 + s.m * 0.88) * tw * k;
    if (s.m > 0.18) glow(ctx, s.x, y, 3 + s.m * 9, s.col, a, 1);
    else {
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;
      ctx.fillRect(s.x, y, 1.3, 1.3);
    }
  }
  ctx.restore();
}

// —— 人 ——
// 抱膝而坐的剪影（背/正面），h 为坐高。轮廓带不规则起伏，像裹着兽皮。
function seatedPts(x, y, h, v = {}) {
  const sw = (v.sw ?? 1) * 0.8, lean = v.lean ?? 0, seed = v.seed ?? 0;
  // 右半边：颈 → 肩 → 手臂环膝 → 地面；左右不对称
  const R = [[0.05, -0.79], [0.14, -0.75], [0.22, -0.70], [0.27, -0.6], [0.285, -0.47], [0.31, -0.36],
    [0.345, -0.27], [0.375, -0.16], [0.385, -0.06], [0.39, 0]];
  const L = [[-0.05, -0.79], [-0.13, -0.765], [-0.2, -0.73], [-0.25, -0.66], [-0.27, -0.53], [-0.3, -0.4],
    [-0.33, -0.3], [-0.37, -0.18], [-0.395, -0.07], [-0.40, 0]];
  const pts = [...R, ...L.reverse()];
  return pts.map(([px, py], i) => {
    const j = py > -0.02 ? 0 : noise1(i * 1.7, seed) * 0.022 + noise1(i * 5.3, seed + 1) * 0.01;
    const sx = (v.sh ?? 0) * (py < -0.6 ? py + 0.6 : 0); // 肩一高一低
    return [x + (px * sw * (1 + (px > 0 ? v.asym ?? 0 : -(v.asym ?? 0))) + lean * -py + j) * h, y + (py + sx * (px > 0 ? 1 : -1) + j * 0.6) * h];
  });
}
function seatedPath(ctx, x, y, h, v = {}) {
  ctx.beginPath();
  splinePath(ctx, seatedPts(x, y, h, v), true);
  const lean = v.lean ?? 0;
  const hx = x + (lean * 0.9 + (v.turn ?? 0)) * h, hy = y + (-0.875 + (v.drop ?? 0)) * h;
  // 头：略不规则（头发）
  const hp = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    const r = 1 + (Math.sin(a) < 0.2 ? noise1(i * 2.3, (v.seed ?? 0) + 9) * 0.12 : 0);
    hp.push([hx + Math.cos(a + (v.tilt ?? 0)) * 0.082 * h * r, hy + Math.sin(a) * 0.098 * h * r]);
  }
  splinePath(ctx, hp, true);
}

// 侧面头像（面朝右）。单位约为头高，原点在颈下。
const PROFILE_HEAD = [
  [-0.30, 0.18], [-0.40, -0.05], [-0.44, -0.35], [-0.38, -0.70], [-0.20, -0.93], [0.05, -1.0],
  [0.26, -0.90], [0.37, -0.71], [0.41, -0.50], [0.435, -0.38], [0.415, -0.305], [0.465, -0.19],
  [0.545, -0.06], [0.50, -0.005], [0.44, 0.02], [0.455, 0.085], [0.43, 0.13], [0.448, 0.172],
  [0.40, 0.23], [0.425, 0.315], [0.36, 0.395], [0.22, 0.43], [0.16, 0.48], [0.15, 0.72],
  [-0.22, 0.78],
];
const PROFILE_BODY = [
  [0.14, 0.62], [0.30, 0.96], [0.46, 1.3], [0.54, 2.2], [-1.1, 2.2], [-0.86, 1.15], [-0.5, 0.82], [-0.27, 0.5],
];
const PIVOT = [-0.05, 0.6];
function rotPts(pts, a, [px, py]) {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c]);
}
function profileHeadPts(a, rough = 0, t = 0) {
  let pts = PROFILE_HEAD;
  if (rough > 0) {
    // 发际与后脑的不规则轮廓
    pts = pts.map(([x, y], i) => (i >= 1 && i <= 6
      ? [x + noise1(i * 3.3, 5) * 0.03 * rough - 0.02 * rough, y - Math.abs(noise1(i * 2.1, 6)) * 0.05 * rough]
      : [x, y]));
  }
  return rotPts(pts, a, PIVOT);
}
// light: { rgb, k } 来自右前方
function drawProfile(ctx, x, y, s, a, light, rough = 0) {
  const head = profileHeadPts(a, rough).map(([px, py]) => [x + px * s, y + py * s]);
  const body = PROFILE_BODY.map(([px, py]) => [x + px * s, y + py * s]);
  const [r, g, b] = light.rgb;
  const grad = ctx.createLinearGradient(x + 0.2 * s, 0, x + 0.62 * s, 0);
  grad.addColorStop(0, '#000');
  grad.addColorStop(0.55, `rgba(${r * 0.14 * light.k},${g * 0.14 * light.k},${b * 0.14 * light.k},1)`);
  grad.addColorStop(1, `rgba(${r * 0.42 * light.k},${g * 0.42 * light.k},${b * 0.42 * light.k},1)`);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath(); splinePath(ctx, body, true); ctx.fill();
  ctx.beginPath(); splinePath(ctx, head, true); ctx.fill();
  // 面部轮廓的边缘光
  ctx.globalCompositeOperation = 'lighter';
  const rg = ctx.createLinearGradient(0, head[6][1], 0, head[10][1]);
  rg.addColorStop(0, `rgba(${r},${g},${b},0)`);
  rg.addColorStop(1, `rgba(${r},${g},${b},${0.5 * light.k})`);
  ctx.strokeStyle = rg;
  ctx.lineWidth = 2.2;
  ctx.shadowColor = `rgba(${r},${g},${b},${0.9 * light.k})`;
  ctx.shadowBlur = 14;
  ctx.beginPath(); splinePath(ctx, head.slice(6, 23), false); ctx.stroke();
  ctx.restore();
}

// 站立的人（正面）——宇宙图中心的小像
function standingPath(ctx, x, y, h) {
  const half = [
    [0.03, -0.86], [0.07, -0.83], [0.16, -0.80], [0.2, -0.74], [0.22, -0.52], [0.245, -0.36],
    [0.21, -0.35], [0.18, -0.52], [0.16, -0.62], [0.15, -0.42], [0.13, -0.03], [0.04, 0], [0.025, -0.42],
  ];
  const pts = [];
  // 身形略修长
  for (const [px, py] of half) pts.push([x + px * h * 0.78, y + py * h]);
  for (let i = half.length - 1; i >= 0; i--) pts.push([x - half[i][0] * h * 0.78, y + half[i][1] * h]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.closePath();
  ctx.moveTo(x + 0.075 * h, y - 0.93 * h);
  ctx.ellipse(x, y - 0.93 * h, 0.072 * h, 0.085 * h, 0, 0, TAU);
}

// 手的形状（掌心朝向观者，指尖向上）：以粗圆头线段拼出
const HAND_FINGERS = [
  // [根部x, 根部y, 角度, 长度, 粗细]
  [-0.34, -0.10, -1.05, 0.62, 0.22], // 拇指
  [-0.25, -0.55, -0.22, 0.86, 0.19],
  [-0.06, -0.62, -0.05, 0.95, 0.195],
  [0.13, -0.58, 0.1, 0.88, 0.185],
  [0.29, -0.46, 0.27, 0.68, 0.165],
];
function fillHand(ctx, x, y, s, rot, spread = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath();
  ctx.ellipse(0, -0.2, 0.42, 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.lineCap = 'round';
  for (const [fx, fy, a, len, w] of HAND_FINGERS) {
    const aa = a * spread;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.sin(aa) * len, fy - Math.cos(aa) * len);
    ctx.stroke();
  }
  // 手腕
  ctx.lineWidth = 0.62;
  ctx.beginPath(); ctx.moveTo(0, 0.1); ctx.lineTo(0.02, 0.75); ctx.stroke();
  ctx.restore();
}
