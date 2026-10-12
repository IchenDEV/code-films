// 开场：你的房间、关了门的馆子、「就这？」、隔壁那扇窗、一下午做完一个月的活、拉远到整座城、片名。
const L = (h, v) => (PORTRAIT ? v : h);

// —— 城市世界：facade / split / title / city / dawn 共用 ——
// 世界坐标以 1920×1080 为参照，地面 y = 1000。A 楼是“你”，B 楼是“他”，两栋楼是邻居。
const CITY = { base: 1000, her: { x: 872, y: 596, w: 58, h: 76 }, him: { x: 992, y: 584, w: 58, h: 76 } };
function cityLayers(g, t, cam, o = {}) {
  const [wx, wy, s] = cam;
  const layer = (p, fn) => {
    g.save();
    const ls = lerp(1, s, p), lx = lerp(960, wx, p), ly = lerp(540, wy, p), k = ls * (W / 1920) * (PORTRAIT ? 1.6 : 1);
    g.translate(CX, CY); g.scale(k, k); g.translate(-lx, -ly);
    fn(k);
    g.restore();
  };
  const winA = o.winA ?? 1;
  // 远景：淡淡的楼影
  layer(0.55, (z) => skyline(g, CITY.base - 40, { zoom: z, x0: -2600, x1: 4600, seed: 11, minH: 160, varH: 380, minW: 90, varW: 120, color: o.far || '#1a1b45', density: 0.22, winA: 0.6 * winA, glow: false, scale: 1.1 }));
  layer(0.8, (z) => skyline(g, CITY.base + 10, { zoom: z, x0: -2400, x1: 4400, seed: 23, minH: 120, varH: 300, minW: 70, varW: 90, color: o.mid || '#13143a', density: 0.36, winA, scale: 1, t,
    lit: o.lit }));
  layer(1, (z) => {
    // A 楼与 B 楼
    building(g, 700, CITY.base + 40, 240, 680, { cols: 4, rows: 9, seed: 5, color: '#0e0f2c', density: 0.4, winA, t, zoom: z });
    building(g, 976, CITY.base + 40, 250, 760, { cols: 4, rows: 10, seed: 9, color: '#100f2e', density: 0.35, winA, t, zoom: z });
    // 两扇主角的窗：画出室内
    room(g, t, CITY.her, 'her', o);
    room(g, t, CITY.him, 'him', o);
    // 前景地面
    g.fillStyle = '#07081a'; g.fillRect(-3000, CITY.base + 40, 9000, 3000);
    if (o.extra) o.extra();
  });
}
// 一扇窗里的小房间（世界坐标）
function room(g, t, w, who, o = {}) {
  const { x, y, w: ww, h: wh } = w;
  g.save();
  g.beginPath(); g.rect(x, y, ww, wh); g.clip();
  if (who === 'her') {
    const gr = g.createLinearGradient(x, y, x, y + wh);
    gr.addColorStop(0, '#6e4a3a'); gr.addColorStop(1, '#3a2630');
    g.fillStyle = gr; g.fillRect(x, y, ww, wh);
    glow(g, x + ww * 0.85, y + wh * 0.35, ww * 0.9, C.warmRGB, 0.85);
    // 沙发
    g.fillStyle = '#1a1020'; g.fillRect(x + ww * 0.12, y + wh * 0.66, ww * 0.8, wh * 0.34); g.fillRect(x + ww * 0.12, y + wh * 0.56, ww * 0.12, wh * 0.2);
    person(g, x + ww * 0.36, y + wh * 0.72, ww * 0.052, o.herPose || 'sofa', { color: '#140c18', hair: 'bun', k: o.herK ?? 0, screen: o.herScreen ?? 1 });
    glow(g, x + ww * 0.5, y + wh * 0.42, ww * 0.25, C.screenRGB, 0.5 * (o.herScreen ?? 1));
  } else {
    const gr = g.createLinearGradient(x, y, x, y + wh);
    gr.addColorStop(0, '#2b3a62'); gr.addColorStop(1, '#151c36');
    g.fillStyle = gr; g.fillRect(x, y, ww, wh);
    const fl = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3);
    // 显示器的光
    g.fillStyle = rgba(C.screenRGB, 0.95 * fl); g.fillRect(x + ww * 0.56, y + wh * 0.42, ww * 0.34, wh * 0.24);
    glow(g, x + ww * 0.72, y + wh * 0.54, ww * 0.9, C.aiRGB, 0.75 * fl);
    g.fillStyle = '#0b0d1e'; g.fillRect(x, y + wh * 0.7, ww, wh * 0.06); // 桌面
    person(g, x + ww * 0.22, y + wh * 0.75, ww * 0.05, o.himPose || 'desk', { color: '#0a0c1c', k: o.himK ?? 0 });
  }
  g.restore();
  // 窗框
  g.strokeStyle = '#06061a'; g.lineWidth = 3;
  g.strokeRect(x, y, ww, wh);
  g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + wh); g.lineWidth = 1.6; g.stroke();
  glow(g, x + ww / 2, y + wh / 2, ww * 1.4, who === 'her' ? C.warmRGB : C.aiRGB, 0.22);
}
// 世界坐标 → 屏幕坐标（与 cityLayers 的近景层一致）
function cityToScreen(px, py, cam) {
  const [wx, wy, s] = cam, k = s * (W / 1920) * (PORTRAIT ? 1.6 : 1);
  return [CX + (px - wx) * k, CY + (py - wy) * k, k];
}

// —— 你的房间（近景）：phone / shrug / return ——
function livingRoom(g, u, o = {}) {
  const R = L({ win: [150, 110, 840, 600], lamp: [1720, 1000], sofa: [380, 1130, 820], hip: [700, 870], s: 33 },
              { win: [90, 480, 900, 560], lamp: [990, 1270], sofa: [110, 820, 1130], hip: [380, 1170], s: 30 });
  const night = o.dawn ?? 0;
  // 墙
  const wg = g.createLinearGradient(0, 0, 0, H);
  wg.addColorStop(0, rgba(mixRGB([46, 38, 84], [80, 66, 108], night), 1)); wg.addColorStop(1, rgba(mixRGB([24, 19, 48], [48, 38, 70], night), 1));
  g.fillStyle = wg; g.fillRect(0, 0, W, H);
  // 落地灯的暖光铺在墙上
  const [lx, ly] = R.lamp, shadeY = ly - L(520, 440);
  glow(g, lx - 40, shadeY, L(900, 760), C.warmRGB, 0.42 * (o.lamp ?? 1));
  // 窗：外面是夜里的城
  const [x, y, w, h] = R.win;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  sky(g, night > 0 ? lerpSky('night', 'dawn', night) : SKIES.night, y + h * 0.95, { top: y });
  stars(g, u, 0.8 * (1 - night), { n: 70, h: y + h * 0.7, seed: 8 });
  moon(g, x + w * 0.78, y + h * 0.22, L(26, 24), 1 - night * 0.7);
  g.translate(x, y + h); g.scale(w / 900, w / 900);
  skyline(g, 0, { x0: -20, x1: 940, seed: 31, minH: 120, varH: 260, minW: 60, varW: 70, color: '#151640', density: 0.35, scale: 0.7, t: u });
  skyline(g, 40, { x0: -40, x1: 960, seed: 47, minH: 60, varH: 160, minW: 80, varW: 90, color: '#0d0e2a', density: 0.45, scale: 0.8, t: u });
  g.restore();
  // 窗框与窗帘
  g.strokeStyle = '#0a0918'; g.lineWidth = L(20, 18); g.strokeRect(x, y, w, h);
  g.lineWidth = L(10, 9); g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.55); g.lineTo(x + w, y + h * 0.55); g.stroke();
  for (const side of [0, 1]) {
    const cx0 = side ? x + w - 30 : x - 60, cg = g.createLinearGradient(cx0, 0, cx0 + 90, 0);
    cg.addColorStop(0, 'rgba(120,96,130,0.0)'); cg.addColorStop(0.5, 'rgba(150,120,150,0.28)'); cg.addColorStop(1, 'rgba(120,96,130,0.0)');
    g.fillStyle = cg; g.fillRect(cx0, y - 40, 90, h + 120);
  }
  // 落地灯
  g.fillStyle = '#0b0a18';
  g.fillRect(lx - 4, shadeY, 8, ly - shadeY);
  g.fillRect(lx - 40, ly - 8, 80, 8);
  g.beginPath(); g.moveTo(lx - L(70, 60), shadeY); g.lineTo(lx + L(70, 60), shadeY); g.lineTo(lx + L(45, 40), shadeY - L(80, 70)); g.lineTo(lx - L(45, 40), shadeY - L(80, 70)); g.closePath();
  g.fillStyle = '#f4c27c'; g.fill();
  glow(g, lx, shadeY, L(220, 190), C.warmRGB, 0.9 * (o.lamp ?? 1));
  // 沙发
  const [sx0, sx1, sy] = R.sofa;
  const sg = g.createLinearGradient(sx1, 0, sx0, 0);
  sg.addColorStop(0, '#5a3550'); sg.addColorStop(1, '#2a1a34');
  g.fillStyle = sg;
  rr(g, sx0, sy - L(110, 100), sx1 - sx0, L(140, 130), 26); g.fill();
  rr(g, sx0 - 30, sy - 30, sx1 - sx0 + 60, L(140, 130), 20); g.fill();
  g.fillRect(sx0 - 20, sy + L(100, 90), sx1 - sx0 + 40, L(160, 200));
  g.strokeStyle = 'rgba(255,190,120,0.22)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(sx0 + 20, sy - L(110, 100)); g.lineTo(sx1 - 20, sy - L(110, 100)); g.stroke();
  // 地板
  g.fillStyle = '#0a0918'; g.fillRect(0, L(1000, 1260), W, H);
  // 人
  const [hx, hy] = R.hip, s = R.s;
  if (o.extra) o.extra(R);
  person(g, hx, hy, s, o.pose || 'sofa', { color: '#0a0814', hair: 'bun', k: o.k ?? 0, screen: o.screen ?? 1, phone: o.phone, rim: [[255, 196, 130], 0.09, -0.05, 0.85] });
  // 手机照亮的脸
  const sc = o.screen ?? 1;
  if (o.phone !== false) {
    const px = hx + (o.pose === 'laugh' ? 2.9 : 2.3) * s * (1 - 0) , py = hy + (o.pose === 'laugh' ? -1.2 : -4.8) * s;
    glow(g, px, py, s * 7, o.phoneRGB || C.screenRGB, 0.55 * sc);
    glow(g, px, py, s * 2, o.phoneRGB || C.screenRGB, 0.6 * sc, 1);
  }
  return R;
}

SHOT.phone = (g, u, dur, cue) => {
  g.save();
  const z = 1 + 0.05 * ease(u, 0, dur);
  g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY);
  livingRoom(g, u);
  g.restore();
  // 你问它一个小问题，它很快就答了
  const ux = L(1800, 1010), uy = L(300, 640), ax = L(1060, 70), ay = L(600, 900);
  bubble(g, T('ask1'), ux, uy, { side: 'r', k: ramp(u, -0.3, 0.1), size: L(46, 46) }); // 第一帧就在画面上
  // AI 在输入……
  if (u > 0.9 && u < 1.6) {
    const k = ramp(u, 0.9, 1.1);
    bubble(g, '· · ·', ax, ay - L(0, 0), { side: 'l', k, size: L(44, 44) });
  }
  if (u >= 1.6) bubble(g, T('answer1'), ax, ay, { side: 'l', k: ramp(u, 1.6, 1.9), size: L(44, 44), type: ramp(u, 1.7, 2.9), maxW: L(760, 880) });
};

// 关了门的馆子
SHOT.shop = (g, u, dur) => {
  const z = 1 + 0.07 * ease(u, 0, dur);
  const S = L({ wall: [330, 150, 1260, 760], sign: [520, 210, 880, 140], sh: [480, 390, 960, 520], note: [960, 650], lamp: 1740, ground: 910 },
              { wall: [50, 450, 980, 820], sign: [130, 490, 820, 130], sh: [110, 650, 860, 600], note: [540, 960], lamp: 1010, ground: 1260 });
  g.save();
  g.translate(S.note[0], S.note[1]); g.scale(z, z); g.translate(-S.note[0], -S.note[1]);
  sky(g, SKIES.night, S.ground);
  stars(g, u, 0.6, { n: 60, h: S.wall[1], seed: 12 });
  // 墙与砖
  const [wx, wy, ww, wh] = S.wall;
  g.fillStyle = '#231b34'; g.fillRect(wx, wy, ww, wh);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
  for (let yy = wy + 30; yy < wy + wh; yy += 30) { g.beginPath(); g.moveTo(wx, yy); g.lineTo(wx + ww, yy); g.stroke(); }
  // 招牌：灯泡都灭了
  const [sx, sy, sw, sh] = S.sign;
  rr(g, sx, sy, sw, sh, 10); g.fillStyle = '#2c1c16'; g.fill();
  g.strokeStyle = '#4a3020'; g.lineWidth = 6; g.stroke();
  txt(g, TL.txt.shopName, sx + sw / 2, sy + sh / 2 + 4, L(104, 96), '#7a5d47', { spacing: '18px' });
  for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(sx + 30 + i * (sw - 60) / 8, sy - 12, 7, 0, TAU); g.fillStyle = '#3a3340'; g.fill(); }
  // 卷帘门：一开场就落下来
  const [rx, ry, rw, rh] = S.sh;
  const drop = outCubic(ramp(u, 0.25, 0.85));
  const hh = rh * lerp(0.15, 1, drop);
  const mg = g.createLinearGradient(rx, 0, rx + rw, 0);
  mg.addColorStop(0, '#3e4562'); mg.addColorStop(0.5, '#59617e'); mg.addColorStop(1, '#353b56');
  g.fillStyle = '#0a0a16'; g.fillRect(rx, ry, rw, rh);
  g.fillStyle = mg; g.fillRect(rx, ry, rw, hh);
  for (let yy = ry + 14; yy < ry + hh; yy += 16) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(rx, yy, rw, 3);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(rx, yy + 3, rw, 2);
  }
  g.fillStyle = '#262a40'; g.fillRect(rx - 6, ry + hh - 14, rw + 12, 16);
  // 蛛网
  g.strokeStyle = 'rgba(220,220,235,0.25)'; g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(rx + rw, ry); g.lineTo(rx + rw - 120 * Math.cos(i / 5 * Math.PI / 2), ry + 120 * Math.sin(i / 5 * Math.PI / 2)); g.stroke(); }
  for (let r = 30; r <= 110; r += 26) { g.beginPath(); g.arc(rx + rw, ry, r, Math.PI / 2, Math.PI); g.stroke(); }
  // 地面与路灯
  g.fillStyle = '#0c0b1a'; g.fillRect(-W, S.ground, W * 3, H);
  const lx = S.lamp, top = L(220, 520);
  g.fillStyle = '#08070f'; g.fillRect(lx - 7, top, 14, S.ground - top);
  g.fillRect(lx - L(140, 120), top - 6, L(140, 120), 10);
  const cone = g.createLinearGradient(0, top, 0, S.ground);
  cone.addColorStop(0, 'rgba(255,210,150,0.30)'); cone.addColorStop(1, 'rgba(255,210,150,0.03)');
  g.fillStyle = cone;
  g.beginPath(); g.moveTo(lx - L(150, 130), top + 4); g.lineTo(lx - L(110, 90), top + 4); g.lineTo(lx + L(160, 60), S.ground); g.lineTo(lx - L(420, 380), S.ground); g.closePath(); g.fill();
  glow(g, lx - L(130, 110), top + 6, L(110, 90), [255, 214, 160], 0.9, 1);
  // 落叶
  for (let i = 0; i < 9; i++) {
    const px = ((rand(i, 61) * W - u * (40 + 60 * rand(i, 62)) * U) % W + W) % W, py = S.ground - 6 - rand(i, 63) * 30 + Math.sin(u * 3 + i) * 6;
    g.save(); g.translate(px, py); g.rotate(u * 2 + i); g.fillStyle = '#5a3b2a'; g.beginPath(); g.ellipse(0, 0, 9 * U, 4 * U, 0, 0, TAU); g.fill(); g.restore();
  }
  // 告示：停业
  const nk = ramp(u, 1.35, 1.75);
  if (nk > 0) {
    const [nx, ny] = S.note, nw = L(300, 300), nh = L(360, 360);
    g.save(); g.translate(nx, ny - (1 - outCubic(nk)) * 40); g.rotate(-0.04);
    g.globalAlpha = clamp(nk * 2);
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20;
    g.fillStyle = '#ece4cf'; g.fillRect(-nw / 2, -nh / 2, nw, nh);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(230,220,180,0.75)'; g.fillRect(-40, -nh / 2 - 10, 80, 22);
    txt(g, TL.txt.closed, 0, -nh * 0.14, L(120, 120), '#9b3b2e');
    g.font = `${L(24, 24)}px ${F.hand}`; g.fillStyle = '#4a3a2e'; g.textAlign = 'center';
    const [l1, l2] = TL.txt.closedNote.split(' · ');
    g.fillText(l1, 0, nh * 0.2); g.fillText(l2, 0, nh * 0.3);
    g.restore();
  }
  g.restore();
  // 它刚才那句很有把握的推荐，还挂在上面
  const bk = 1 - ease(u, 2.2, 2.7);
  if (bk > 0 && !PORTRAIT) bubble(g, T('answer1'), L(120, 70), L(140, 420), { side: 'l', k: 1, alpha: bk, size: L(40, 40), maxW: L(820, 900) });
};

// 你笑了一下：就这？
SHOT.shrug = (g, u, dur) => {
  g.save();
  const z = 1.06 - 0.02 * ease(u, 0, dur);
  g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY);
  const R = livingRoom(g, u, { pose: 'laugh', k: ease(u, 0.0, 0.5), screen: 1 - 0.6 * ease(u, 0.3, 1.2) });
  g.restore();
  const x = L(1340, 640), y = L(420, 820);
  slam(g, T('justThis'), x, y, L(220, 200), u, 0.35, C.warm, { rot: -0.06, shadow: rgba(C.warmRGB, 0.55), blur: 50, from: 2.2 });
  // 一个小小的耸肩记号
  const k = ease(u, 0.6, 1.0);
  if (k > 0) {
    g.save(); g.globalAlpha = k * 0.8; g.strokeStyle = C.warm; g.lineWidth = 5 * U; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.4; g.beginPath(); g.moveTo(x - L(170, 150) + Math.cos(a) * 50, y - 90 + Math.sin(a) * 50); g.lineTo(x - L(170, 150) + Math.cos(a) * 80, y - 90 + Math.sin(a) * 80); g.stroke(); }
    g.restore();
  }
};

// 同一天，另一扇窗里——镜头从你的窗，移到隔壁楼那扇冷白的窗
SHOT.facade = (g, u, dur) => {
  sky(g, SKIES.night, H);
  stars(g, u, 1, { n: 200, h: H * 0.7 });
  moon(g, W * 0.82, H * 0.16, 34 * U);
  const k = io(u, 0.2, dur - 0.3);
  const her = [CITY.her.x + 29, CITY.her.y + 30], him = [CITY.him.x + 29, CITY.him.y + 40];
  const s = lerp(3.2, 3.6, k) * L(1, 0.9);
  const cam = [lerp(her[0] - 60, him[0], k), lerp(her[1] - 10, him[1], k), s];
  cityLayers(g, u, cam, { herK: 1, herPose: 'sofa' });
};

// 他：一下午做完一个月的活；然后，后背发凉
SHOT.desk = (g, u, dur, cue) => {
  const t6 = cue('L06', dur / 2);
  const D = L({ win: [1180, 130, 600, 560], desk: [250, 1180, 760], mon: [560, 330, 520, 340], hip: [330, 820], s: 30, cal: [90, 170, 220, 260] },
              { win: [330, 490, 650, 430], desk: [60, 1020, 1120], mon: [470, 860, 470, 250], hip: [190, 1180], s: 26, cal: [70, 520, 210, 240] });
  const z = 1 + 0.06 * ease(u, 0, dur);
  const [qx, qy] = shakeXY(u, t6 + 0.55, 12 * U, 0.5);
  g.save(); g.translate(CX + qx, CY + qy); g.scale(z, z); g.translate(-CX, -CY);
  // 墙：冷色
  const wg = g.createLinearGradient(0, 0, 0, H);
  wg.addColorStop(0, '#18203e'); wg.addColorStop(1, '#0b0f22');
  g.fillStyle = wg; g.fillRect(0, 0, W, H);
  // 窗外：下午 → 傍晚 → 夜（L05）→ 暴风雨（L06）
  const [x, y, w, h] = D.win;
  const day = ramp(u, 0.2, t6 - 0.2);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const stops = day < 0.5 ? lerpSky('dawn', 'dusk', day * 2) : lerpSky('dusk', 'night', (day - 0.5) * 2);
  const storm = ease(u, t6, t6 + 0.8);
  sky(g, storm > 0 ? stops.map((c, i) => { const a = c.match(/\d+/g).map(Number), b = hex(SKIES.storm[i]); const m = mixRGB(a, b, storm); return `rgb(${m[0] | 0},${m[1] | 0},${m[2] | 0})`; }) : stops, y + h, { top: y });
  // 太阳飞快地落下去
  const sunY = lerp(y + h * 0.2, y + h * 1.1, day);
  glow(g, x + w * 0.3, sunY, w * 0.5, [255, 200, 140], 0.8 * (1 - storm)); glow(g, x + w * 0.3, sunY, 30 * U, [255, 236, 200], 1 - storm, 1);
  // 暴风云
  for (let i = 0; i < 6; i++) cloud(g, x + w * (rand(i, 70) * 1.2 - 0.1) + Math.sin(u * 0.7 + i) * 30, y + h * (0.15 + 0.3 * rand(i, 71)), w * 0.6, h * 0.16, '#2a2d48', storm * 0.9, i);
  // 闪电
  const fl = u > t6 + 0.5 && u < t6 + 0.75 ? 1 - (u - t6 - 0.5) / 0.25 : 0;
  if (fl > 0) {
    g.fillStyle = `rgba(220,230,255,${fl * 0.6})`; g.fillRect(x, y, w, h);
    g.strokeStyle = `rgba(255,255,255,${fl})`; g.lineWidth = 4; g.beginPath();
    let lxp = x + w * 0.62, lyp = y;
    g.moveTo(lxp, lyp); for (let i = 0; i < 7; i++) { lxp += (rand(i, 77) - 0.5) * 60; lyp += h / 9; g.lineTo(lxp, lyp); } g.stroke();
  }
  g.translate(x, y + h); g.scale(w / 900, w / 900);
  skyline(g, 0, { x0: -20, x1: 940, seed: 53, minH: 100, varH: 240, minW: 60, varW: 80, color: '#0f1230', density: 0.3 * day + 0.1, scale: 0.8 });
  g.restore();
  g.strokeStyle = '#080a18'; g.lineWidth = 18; g.strokeRect(x, y, w, h);
  g.lineWidth = 9; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
  // 墙上的日历：一页一页飞走
  const [cx, cy, cw, ch] = D.cal;
  const day30 = Math.min(30, 1 + Math.floor(29 * ease(u, 0.3, t6 - 0.3)));
  g.fillStyle = '#e9e3d4'; g.fillRect(cx, cy, cw, ch);
  g.fillStyle = '#c4473a'; g.fillRect(cx, cy, cw, ch * 0.22);
  txt(g, T('calendar').join(''), cx + cw / 2, cy + ch * 0.11, ch * 0.12, '#fff3e6');
  txt(g, String(day30), cx + cw / 2, cy + ch * 0.6, ch * 0.5, '#2b2230', { family: F.lora, weight: '700' });
  for (let i = 0; i < 4; i++) {
    const ph = ((u * 7.2 + i * 0.25) % 1), on = u > 0.3 && u < t6 - 0.3;
    if (!on) break;
    g.save(); g.translate(cx + cw / 2 + ph * L(260, 160), cy + ch / 2 - ph * 90 + ph * ph * 260); g.rotate(ph * 2.4 * (i % 2 ? 1 : -1));
    g.globalAlpha = 1 - ph; g.fillStyle = '#e9e3d4'; g.fillRect(-cw / 2, -ch * 0.35, cw, ch * 0.7); g.restore();
  }
  // 桌子与显示器
  const [dx0, dx1, dy] = D.desk;
  g.fillStyle = '#080a18'; g.fillRect(dx0, dy, dx1 - dx0, 22); g.fillRect(dx0 + 20, dy, 16, H); g.fillRect(dx1 - 36, dy, 16, H);
  const [mx, my, mw, mh] = D.mon;
  const bright = 0.8 + 0.2 * Math.sin(u * 11) * Math.sin(u * 3.7) + storm * 0.2;
  glow(g, mx + mw / 2, my + mh / 2, mw * 1.3, C.aiRGB, 0.6 * bright);
  g.fillStyle = '#05060f'; rr(g, mx - 12, my - 12, mw + 24, mh + 24, 10); g.fill();
  g.fillRect(mx + mw / 2 - 10, my + mh + 12, 20, dy - my - mh - 12);
  g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
  g.fillStyle = '#0f1a33'; g.fillRect(mx, my, mw, mh);
  // 屏幕上：飞快滚动的代码行和不停打勾的任务
  const lh = mh / 14, scroll = u * 9;
  for (let i = -1; i < 16; i++) {
    const row = Math.floor(scroll) + i, yy = my + (i - (scroll % 1)) * lh + lh;
    let xx = mx + 14 + (rand(row, 5) * 3 | 0) * 18;
    for (let j = 0; j < 4; j++) {
      const ww = (20 + rand(row, j + 9) * 90) * (mw / 520);
      if (xx + ww > mx + mw * 0.66) break;
      g.fillStyle = ['#8fd0ff', '#c59bff', '#ffd27a', '#9df5c9'][(((row + j) % 4) + 4) % 4]; g.globalAlpha = 0.8;
      g.fillRect(xx, yy - lh * 0.22, ww, lh * 0.42); xx += ww + 10;
    }
  }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(mx + mw * 0.68, my, mw * 0.32, mh);
  const done = Math.floor(u * 2.6);
  for (let i = 0; i < 7; i++) {
    const yy = my + 20 + i * (mh - 30) / 7;
    g.fillStyle = 'rgba(200,230,255,0.25)'; g.fillRect(mx + mw * 0.72, yy, mw * 0.18, lh * 0.35);
    if (i < done % 8) txt(g, '✓', mx + mw * 0.94, yy + lh * 0.18, lh * 0.7, '#9df5c9', { family: F.lora });
  }
  g.restore();
  glow(g, mx + mw / 2, my + mh / 2, mw * 0.6, C.screenRGB, 0.25 * bright);
  // 人：先前倾，后靠
  const [hx, hy] = D.hip;
  g.fillStyle = '#05060f'; g.fillRect(hx - D.s * 1.2, hy - D.s * 0.4, D.s * 2.6, D.s * 0.6); g.fillRect(hx - D.s * 0.2, hy, D.s * 0.4, D.s * 3.8);
  person(g, hx, hy, D.s, u < t6 + 0.2 ? 'desk' : 'lean', { color: '#05060f', k: ease(u, t6 + 0.2, t6 + 0.9) });
  glow(g, hx + D.s * 2, hy - D.s * 6, D.s * 4, C.aiRGB, 0.35 * bright);
  g.restore();
  // 要变天了
  slam(g, T('bigChange'), L(1480, 640), L(820, 700), L(150, 140), u, t6 + 0.55, '#e6f3ff', { rot: 0.04, shadow: rgba(C.aiRGB, 0.7), blur: 50, maxW: L(820, 820) });
};

// 两扇窗，然后拉远：整座城
SHOT.split = (g, u, dur, cue) => {
  const t8 = cue('L08', dur / 2);
  sky(g, SKIES.night, H);
  stars(g, u, ease(u, t8, t8 + 2), { n: 260, h: H * 0.75 });
  moon(g, W * 0.84, H * 0.14, 34 * U, ease(u, t8 + 1, t8 + 3));
  const k = Math.pow(io(u, t8, dur), 1.0);
  const mid = [(CITY.her.x + CITY.him.x + CITY.him.w) / 2, (CITY.her.y + CITY.him.y + CITY.him.h) / 2 + 10];
  const s0 = L(8, 5.6), s1 = L(0.62, 0.75);
  const s = Math.exp(lerp(Math.log(s0), Math.log(s1), k));
  const cam = [lerp(mid[0], 960, ease(k, 0.3, 1)), lerp(mid[1], L(470, 610), ease(k, 0.2, 1)), s];
  cityLayers(g, u, cam, { herPose: 'laugh', herK: 1, herScreen: 0.6, himPose: 'lean', himK: 1 });
  // 两句话挂在各自的窗边，拉远时淡出
  const a = 1 - ease(u, t8 + 0.3, t8 + 1.4);
  if (a > 0) {
    const [hx, hy] = cityToScreen(CITY.her.x + 29, CITY.her.y, cam), [mx, my] = cityToScreen(CITY.him.x + 29, CITY.him.y, cam);
    g.save(); g.globalAlpha = a;
    slam(g, T('justThis'), hx, hy - L(90, 110), L(110, 90), u, 0.15, C.warm, { shadow: rgba(C.warmRGB, 0.6), blur: 40, rot: -0.05 });
    const [, mb, kz] = cityToScreen(CITY.him.x + 29, CITY.him.y + CITY.him.h, cam);
    slam(g, T('bigChange'), mx, PORTRAIT ? my - 70 : mb + 70, L(96, 76), u, 0.75, '#e6f3ff', { shadow: rgba(C.aiRGB, 0.7), blur: 40, rot: 0.04, maxW: L(560, 420) });
    slam(g, '？', CX, L(CY + 40, 1000), L(200, 150), u, 1.6, C.ink, { shadow: 'rgba(255,255,255,0.4)', blur: 40, alpha: 0.9 });
    g.restore();
  }
};

// 片名：城市的灯开始升起
SHOT.title = (g, u, dur) => {
  sky(g, SKIES.night, H);
  stars(g, u + 30, 1, { n: 280, h: H * 0.8 });
  moon(g, W * 0.84, H * 0.14, 34 * U, 1 - ease(u, 0, dur));
  const s = L(0.62, 0.75) * (1 - 0.06 * ease(u, 0, dur));
  cityLayers(g, u + 30, [960, L(470, 610), s], { herPose: 'laugh', herK: 1, himPose: 'lean', himK: 1 });
  // 灯火升起：之后会排成漏斗
  for (let i = 0; i < 160; i++) {
    const x0 = rand(i, 81) * W, y0 = H * (0.6 + 0.35 * rand(i, 82));
    const st = rand(i, 83) * 1.6, k = ease(u, st, st + 2.4);
    if (k <= 0) continue;
    const x = x0 + Math.sin(u * 1.4 + i) * 12 * U, y = y0 - k * H * (0.5 + 0.3 * rand(i, 84));
    const col = rand(i, 85) > 0.85 ? C.aiRGB : C.warmRGB;
    glow(g, x, y, (8 + 8 * rand(i, 86)) * U, col, 0.75 * k, 1);
  }
  const k = ease(u, 0.1, 0.9);
  const ty = L(CY - 150, 800);
  const dg = g.createRadialGradient(CX, ty + 80, 0, CX, ty + 80, L(760, 620));
  dg.addColorStop(0, `rgba(5,6,22,${0.75 * k})`); dg.addColorStop(1, 'rgba(5,6,22,0)');
  g.fillStyle = dg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = k;
  txt(g, TL.txt.title, CX, ty, L(260, 240), C.ink, { shadow: rgba(C.warmRGB, 0.6), blur: 60 });
  txt(g, TL.txt.titleEn, CX, ty + L(170, 160), L(46, 44), C.warm, { family: F.loraI, weight: '600', spacing: '14px', shadow: 'rgba(0,0,0,0.8)', blur: 18 });
  g.globalAlpha = k * ease(u, 0.8, 1.5);
  txt(g, TL.txt.titleSub, CX, ty + L(250, 240), L(46, 44), '#dfe0ef', { maxW: W * 0.86, shadow: 'rgba(0,0,0,0.9)', blur: 18 });
  g.restore();
};
