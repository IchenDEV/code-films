// 高潮：门里的五千人看见的；曲线立起来。之后：画漏斗的人、一个字一个字敲代码、鸿沟变宽；同一天，不同的明天；回到「就这？」。

// —— 门里：成千上万个 AI，几周做完几年的活 ——
SHOT.swarm = (g, u, dur) => {
  const bg = g.createRadialGradient(CX, L(H * 0.62, ST.cy + 120), 0, CX, CY, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#3a2f7a'); bg.addColorStop(0.45, '#151a4a'); bg.addColorStop(1, '#05061a');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  stars(g, u + 110, 0.8, { n: 200, h: H, seed: 51 });
  const gx = CX, gy = L(H * 0.8, ST.y + ST.h - 40);
  const z = 1 + 0.12 * ease(u, 0, dur);
  g.save(); g.translate(gx, gy); g.scale(z, z); g.translate(-gx, -gy);
  g.globalCompositeOperation = 'lighter';
  // 光做的城：一座座塔从地面长起来
  const n = L(17, 11);
  for (let i = 0; i < n; i++) {
    const x = gx + (i - (n - 1) / 2) * L(92, 82) + (rand(i, 400) - 0.5) * 30;
    const hMax = (L(160, 150) + Math.pow(rand(i, 401), 1.3) * L(420, 380)) * (1 - Math.abs(i - (n - 1) / 2) / n * 0.9);
    const st = rand(i, 402) * 1.4, h = hMax * outCubic(ramp(u, st, st + 2.2));
    const w = L(60, 54) * (0.7 + 0.5 * rand(i, 403));
    if (h < 2) continue;
    const col = rand(i, 404) > 0.7 ? C.aiRGB : C.goldRGB;
    const tg = g.createLinearGradient(0, gy - h, 0, gy);
    tg.addColorStop(0, rgba(col, 0.32)); tg.addColorStop(1, rgba(col, 0.06));
    g.fillStyle = tg;
    g.beginPath(); g.moveTo(x - w / 2, gy); g.lineTo(x - w / 2, gy - h); g.lineTo(x, gy - h - w * 0.8 * (rand(i, 405) > 0.5 ? 1 : 0.2)); g.lineTo(x + w / 2, gy - h); g.lineTo(x + w / 2, gy); g.closePath(); g.fill();
    g.strokeStyle = rgba(col, 0.8); g.lineWidth = 2; g.stroke();
    // 一层层亮起来的窗
    for (let yy = gy - 22, f = 0; yy > gy - h + 10; yy -= 22, f++) {
      for (let c = 0; c < 3; c++) if (rand(i * 50 + f, c + 406) > 0.45) { g.fillStyle = rgba(col, 0.55); g.fillRect(x - w / 2 + 8 + c * (w - 16) / 3, yy - 8, (w - 16) / 3 - 6, 8); }
    }
    glow(g, x, gy - h - w * 0.4, 40 * U, col, 0.9, 1);
  }
  // 漂浮的公式与星图：科学和数学也在往前走
  const glyphs = ['∑', '∫', 'π', '∞', 'e^iπ', '∂', '√', 'Δ', '⊗', 'λ'];
  for (let i = 0; i < 18; i++) {
    const x = rand(i, 410) * W, y = H * (0.15 + 0.5 * rand(i, 411)) - u * 18 * U;
    txt(g, glyphs[i % glyphs.length], x, y, (30 + 30 * rand(i, 412)) * U, rgba([200, 220, 255], 1), { family: F.loraI, alpha: 0.3 + 0.3 * Math.sin(u * 2 + i) ** 2 });
  }
  glow(g, gx, gy - L(250, 230), L(700, 560), [255, 220, 170], 0.35 + 0.1 * Math.sin(u * 3));
  // 蜂群：从四面八方涌进来
  for (let i = 0; i < 1400; i++) {
    const ph = (u * (0.25 + 0.35 * rand(i, 420)) + rand(i, 421)) % 1;
    const a0 = rand(i, 422) * TAU, a = a0 + ph * 3.2 * (rand(i, 423) > 0.5 ? 1 : -1);
    const R = Math.max(W, H) * 0.75 * (1 - ph);
    const tx = gx + (rand(i, 424) - 0.5) * L(1400, 860), ty = gy - rand(i, 425) * L(520, 480);
    const x = lerp(tx, gx + Math.cos(a) * R, 1 - ph * ph), y = lerp(ty, gy - L(260, 240) + Math.sin(a) * R * 0.6, 1 - ph * ph);
    glow(g, x, y, (5 + 6 * rand(i, 426)) * U, rand(i, 427) > 0.8 ? C.aiRGB : [255, 236, 200], 0.85 * Math.sin(ph * Math.PI), 1);
  }
  g.restore();
  // 几周 vs 几年
  const bx = L(110, 120), by = L(110, ST.y + 10), bw = L(560, 640);
  T('bars').forEach(([who, how], i) => {
    const k = ease(u, 0.5 + i * 0.3, 1.0 + i * 0.3);
    if (k <= 0) return;
    const y = by + i * L(92, 90);
    g.save(); g.globalAlpha = k;
    txt(g, `${who} · ${how}`, bx, y, L(36, 36), i ? C.gold : C.ink, { align: 'left', shadow: 'rgba(0,0,0,0.9)', blur: 12 });
    rr(g, bx, y + 30, bw, 14, 7); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fill();
    const fillK = i ? outExpo(ramp(u, 1.3, 2.4)) : 0.06 + 0.04 * ease(u, 1, dur);
    rr(g, bx, y + 30, bw * fillK, 14, 7); g.fillStyle = i ? C.gold : '#c9cbe0'; g.fill();
    if (i) glow(g, bx + bw * fillK, y + 37, 30 * U, C.goldRGB, 0.9 * k, 1);
    g.restore();
  });
};

// —— 曲线立了起来 ——
SHOT.vertigo = (g, u, dur, cue) => {
  const tEnd = cue('L23_end', dur - 1.6);
  if (u > tEnd + 0.15) {
    // 骤停：一片黑，只剩一个小小的光点
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    glow(g, CX, CY, 8 * U, [255, 240, 220], 0.6 * (1 - ease(u, tEnd + 0.4, dur)), 1);
    return;
  }
  const p = ramp(u, 0, tEnd); // 曲线走到哪
  // 曲线：y = e^(kx) - 1，前面几乎是平的，最后一下子立起来（曲棍球杆）
  const K = 9, X = (s) => s * L(1300, 760), Y = (s) => -(Math.exp(K * s) - 1) * 1.6;
  const tipS = p, tx = X(tipS), ty = Y(tipS);
  const slope = Math.atan2(-(Math.exp(K * tipS) * K * 1.6), L(1300, 760));
  const pathStep = (s) => Math.max(0.0005, 0.004 / (1 + Math.exp(K * s) * K * 1.6 / 4000));
  const ox = L(W * 0.2, 150), oy0 = L(H * 0.78, ST.y + ST.h - 40), topY = L(H * 0.26, ST.y + 120);
  // 曲线头要冲出画面时，镜头跟着往上走：起点和那个小小的人沉到画面下面去
  const follow = Math.max(0, topY - (oy0 + ty));
  const [qx, qy] = [noise1(u * 30, 5) * 10 * U * ease(u, 2.5, tEnd), noise1(u * 30, 9) * 10 * U * ease(u, 2.5, tEnd)];
  const sc = 1, rot = 0.06 * Math.sin(u * 1.7) * ease(u, 2.5, tEnd);
  g.fillStyle = '#05061a'; g.fillRect(0, 0, W, H);
  g.save();
  g.translate(ox + qx, oy0 + follow + qy); g.rotate(rot);
  // 星星拉成线：速度感
  const speed = clamp((-slope - 0.6) / 0.9);
  for (let i = 0; i < 160; i++) {
    const sx = tx + (rand(i, 430) - 0.5) * W * 3, sy = ty + ((rand(i, 431) - 0.5) * H * 3 + u * 900 * speed) % (H * 3);
    g.strokeStyle = `rgba(220,225,255,${0.3 + 0.4 * rand(i, 432)})`; g.lineWidth = 2 / sc;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 6 - 160 * speed * rand(i, 433)); g.stroke();
  }
  // 坐标轴
  g.strokeStyle = 'rgba(160,170,220,0.35)'; g.lineWidth = 2 / sc;
  g.beginPath(); g.moveTo(-200, 0); g.lineTo(2400, 0); g.moveTo(0, 200); g.lineTo(0, -40000); g.stroke();
  // 一个小小的人站在起点，纸页在身边乱飞
  person(g, 60, -8.6 * 12, 12, 'look', { color: '#c9cbe8' });
  for (let i = 0; i < 26; i++) {
    const k = (u * (0.3 + 0.3 * rand(i, 440)) + rand(i, 441)) % 1;
    const px = 60 + (rand(i, 442) - 0.15) * 1000 * k, py = -120 - k * 600 * (0.4 + rand(i, 443));
    g.save(); g.translate(px, py); g.rotate(u * (1 + rand(i, 444) * 3) + i);
    g.globalAlpha = 0.85 * Math.sin(k * Math.PI);
    g.fillStyle = '#f2ecdc'; g.fillRect(-22, -28, 44, 56);
    g.fillStyle = 'rgba(60,60,90,0.6)'; for (let l = 0; l < 6; l++) g.fillRect(-16, -20 + l * 8, 32 * (0.5 + 0.5 * rand(i, l + 445)), 2);
    g.restore();
  }
  // 曲线本身
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  for (let s = 0; s <= tipS + 0.0001; s += pathStep(s)) (s ? g.lineTo(X(s), Y(s)) : g.moveTo(X(s), Y(s)));
  g.lineTo(tx, ty);
  g.strokeStyle = rgba(C.goldRGB, 0.25); g.lineWidth = 18 / sc; g.stroke();
  g.strokeStyle = '#fff1cf'; g.lineWidth = 5 / sc; g.stroke();
  g.restore();
  glow(g, tx, ty, 120 / sc, C.goldRGB, 0.9);
  glow(g, tx, ty, 26 / sc, [255, 255, 255], 1, 1);
  g.restore();
  // 走到最后，白光
  const wk = ease(u, tEnd - 0.5, tEnd + 0.1);
  if (wk > 0) { g.fillStyle = `rgba(255,248,232,${wk})`; g.fillRect(0, 0, W, H); }
};

// —— 画出这个漏斗的人 ——
function table(g, u) {
  const tg = g.createLinearGradient(0, 0, W, H);
  tg.addColorStop(0, '#3a2418'); tg.addColorStop(1, '#1d110b');
  g.fillStyle = tg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const y = (i / 40) * H + Math.sin(i) * 8; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 10, W * 0.6, y - 12, W, y + 4); g.stroke(); }
  glow(g, W * 0.4, H * 0.35, Math.max(W, H) * 0.7, C.warmRGB, 0.4);
}
function paper(g, x, y, w, h, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.shadowOffsetY = 8;
  g.fillStyle = '#f1ead9'; g.fillRect(-w / 2, -h / 2, w, h);
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  // 餐巾纸的折痕
  g.strokeStyle = 'rgba(150,130,100,0.25)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.moveTo(0, -h / 2); g.lineTo(0, h / 2); g.stroke();
  g.restore();
}
SHOT.napkin = (g, u, dur) => {
  table(g, u);
  const nx = L(W * 0.42, CX), ny = L(H * 0.44, ST.cy - 90), nw = L(720, 760), nh = L(720, 600);
  const z = 1.04 - 0.04 * ease(u, 0, dur);
  g.save(); g.translate(nx, ny); g.scale(z, z); g.translate(-nx, -ny);
  // 咖啡杯印
  g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = 6; g.beginPath(); g.arc(nx + nw * 0.45, ny - nh * 0.5, 70, 0.3, 5.6); g.stroke();
  paper(g, nx, ny, nw, nh, -0.03);
  g.save(); g.translate(nx, ny); g.rotate(-0.03);
  // 钢笔画的漏斗
  const k = ramp(u, 0.2, 2.6);
  const ink = '#1d2a5a';
  const top = -nh * 0.36, bot = nh * 0.3, rTop = nw * 0.36;
  const curve = (side, kk) => {
    g.beginPath();
    for (let i = 0; i <= 40 * kk; i++) { const s = i / 40, y = lerp(top, bot, s), r = rTop * Math.pow(1 - s, 1.4) + 6; (i ? g.lineTo(side * r - nw * 0.08, y) : g.moveTo(side * r - nw * 0.08, y)); }
    g.strokeStyle = ink; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
  };
  curve(-1, clamp(k * 2)); curve(1, clamp(k * 2));
  const lbl = ['~6B', '1–2B', '~20M', '~5K'], ys = [0.18, 0.5, 0.78, 0.97];
  ys.forEach((s, i) => {
    const kk = ramp(u, 1.0 + i * 0.35, 1.3 + i * 0.35);
    if (kk <= 0) return;
    const y = lerp(top, bot, s), r = rTop * Math.pow(1 - s, 1.4) + 6;
    g.strokeStyle = ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-r - nw * 0.08, y); g.lineTo(-r - nw * 0.08 + 2 * r * kk, y); g.stroke();
    writeOn(g, lbl[i], r - nw * 0.08 + 30, y, L(44, 44), ink, kk, { align: 'left', family: F.loraI });
  });
  writeOn(g, TL.txt.napkin, 0, nh * 0.42, L(30, 30), 'rgba(29,42,90,0.75)', ramp(u, 2.2, 2.9), { family: F.loraI });
  g.restore();
  // 钢笔
  const pk = ramp(u, 0.2, 2.6);
  g.save(); g.translate(nx + nw * 0.42 - pk * 60, ny + nh * 0.1 + pk * 40); g.rotate(0.7);
  g.fillStyle = '#111'; rr(g, -12, -150, 24, 260, 12); g.fill(); g.fillStyle = '#c9a25e'; g.fillRect(-12, -60, 24, 8);
  g.restore();
  g.restore();
  // 名字
  const ck = ease(u, 0.6, 1.3);
  if (ck > 0) {
    const cx = L(W * 0.77, CX), cy = L(H * 0.38, ST.y + ST.h - 150);
    g.save(); g.globalAlpha = ck;
    txt(g, TL.txt.karpathy, cx, cy, L(64, 60), C.ink, { family: F.lora, weight: '600', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, T('karpathyRole'), cx, cy + L(64, 62), L(32, 32), '#e8d9c0', { shadow: 'rgba(0,0,0,0.9)', blur: 14, maxW: L(560, 980) });
    txt(g, TL.lang === 'en' ? TL.txt.roleSrcEn : TL.txt.roleSrc, cx, cy + L(108, 104), L(22, 22), 'rgba(232,217,192,0.7)', { family: F.loraI });
    g.restore();
  }
};

// —— 不到一年前，一个字一个字地敲代码 ——
SHOT.keys = (g, u, dur) => {
  g.fillStyle = '#0c0b16'; g.fillRect(0, 0, W, H);
  glow(g, L(W * 0.3, CX - 200), L(H * 0.1, ST.y), Math.max(W, H) * 0.7, C.warmRGB, 0.35);
  // 屏幕上的一行代码
  const sx = L(W * 0.18, 80), sy = L(H * 0.32, ST.y + 200), sw = L(W * 0.64, W - 160), sh = L(230, 210);
  rr(g, sx, sy, sw, sh, 16); g.fillStyle = '#141a2e'; g.fill();
  glow(g, sx + sw / 2, sy + sh / 2, sw * 0.6, C.screenRGB, 0.12);
  const code = TL.txt.code, n = Math.floor(clamp((u - 0.4) / (dur - 0.9)) * [...code].length);
  const size = L(48, 40), mono = '"DejaVu Sans Mono", monospace';
  g.font = `${size}px ${mono}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const shown = [...code].slice(0, n).join('');
  g.fillStyle = '#d7e6ff'; g.fillText(shown, sx + 40, sy + sh / 2);
  const cw = g.measureText(shown).width;
  if (Math.floor(u * 2.4) % 2 === 0) { g.fillStyle = C.warm; g.fillRect(sx + 42 + cw, sy + sh / 2 - size * 0.6, 4, size * 1.2); }
  // 键盘：一次只按下一个键
  const ky = L(H * 0.62, ST.y + ST.h - 260), kw = L(78, 64), gap = L(10, 8);
  const rows = [10, 9, 7];
  const pressed = n % 26;
  let id = 0;
  rows.forEach((cnt, r) => {
    const rowW = cnt * kw + (cnt - 1) * gap, x0 = CX - rowW / 2 + r * kw * 0.25;
    for (let i = 0; i < cnt; i++, id++) {
      const down = id === pressed && (u * 6) % 1 < 0.6;
      const x = x0 + i * (kw + gap), y = ky + r * (kw + gap) + (down ? 4 : 0);
      rr(g, x, y, kw, kw, 10); g.fillStyle = down ? '#3a3550' : '#1e1c2c'; g.fill();
      g.strokeStyle = down ? rgba(C.warmRGB, 0.8) : 'rgba(255,220,170,0.12)'; g.lineWidth = 2; g.stroke();
      if (down) glow(g, x + kw / 2, y + kw / 2, kw, C.warmRGB, 0.4);
    }
  });
  // 依据：帖子原文，原样引用
  const qa = ease(u, 0.3, 0.9);
  const qx = L(W * 0.18, CX), qy = L(H * 0.07, ST.y + 25), al = L('left', 'center');
  txt(g, T('oneYear'), qx, qy, L(40, 40), C.gold, { align: al, alpha: qa, shadow: 'rgba(0,0,0,0.8)', blur: 12 });
  TL.txt.codeQuote.forEach((l, i) => txt(g, l, qx, qy + L(54, 56) + i * L(38, 40), L(30, 28), '#e9e2d4', { align: al, family: F.loraI, alpha: qa, maxW: L(W * 0.7, W - 80), shadow: 'rgba(0,0,0,0.8)', blur: 10 }));
  txt(g, TL.txt.codeQuoteSrc, qx, qy + L(54, 56) + 3 * L(38, 40) + L(8, 8), L(22, 22), 'rgba(233,226,212,0.65)', { align: al, family: F.lora, alpha: qa });
};

// —— 鸿沟，正在变宽 ——
SHOT.gap = (g, u, dur) => {
  const base = L(H * 0.62, ST.y + ST.h - 200);
  sky(g, SKIES.dusk, base + 40);
  stars(g, u + 140, 0.6, { n: 100, h: base * 0.6, seed: 61 });
  const wGap = L(40, 30) + ease(u, 0.3, dur) * L(360, 260);
  const [sx, sy] = shakeXY(u % 1.2, 0.05, 4 * U, 0.6);
  g.save(); g.translate(sx, sy);
  // 两块崖
  const cliff = (side) => {
    g.beginPath();
    const edge = CX + side * wGap / 2;
    g.moveTo(side < 0 ? -50 : W + 50, base); g.lineTo(edge, base);
    for (let i = 0; i <= 12; i++) g.lineTo(edge + side * (8 + 20 * rand(i, 450 + side)) * U, base + (i / 12) * (H - base + 50));
    g.lineTo(side < 0 ? -50 : W + 50, H + 50); g.closePath();
    const cg = g.createLinearGradient(0, base, 0, H);
    cg.addColorStop(0, '#2a2350'); cg.addColorStop(1, '#0a0820');
    g.fillStyle = cg; g.fill();
    g.strokeStyle = 'rgba(255,190,160,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(side < 0 ? -50 : W + 50, base); g.lineTo(edge, base); g.stroke();
  };
  cliff(-1); cliff(1);
  // 深处
  const dg = g.createLinearGradient(0, base, 0, H);
  dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = dg; g.fillRect(CX - wGap / 2, base, wGap, H);
  // 左边很多人，右边很少的人，光不一样
  for (let i = 0; i < L(30, 18); i++) {
    const x = CX - wGap / 2 - L(60, 40) - i * L(28, 24) - rand(i, 460) * 14;
    if (x < 20) break;
    person(g, x, base - 8.6 * 7 * U, 7 * U, 'stand', { color: '#0a0920', flip: false });
    glow(g, x + 6 * U, base - 60 * U, 14 * U, C.warmRGB, 0.4);
  }
  for (let i = 0; i < 3; i++) {
    const x = CX + wGap / 2 + L(60, 40) + i * L(36, 30);
    person(g, x, base - 8.6 * 7 * U, 7 * U, 'stand', { color: '#0a0920', flip: true });
    glow(g, x - 6 * U, base - 60 * U, 40 * U, C.aiRGB, 0.8);
  }
  // 落进缝里的碎石
  for (let i = 0; i < 14; i++) {
    const k = (u * 0.8 + rand(i, 470)) % 1, x = CX + (rand(i, 471) - 0.5) * wGap * 0.9, y = base + k * k * (H - base);
    g.fillStyle = `rgba(80,70,120,${1 - k})`; g.fillRect(x, y, 6 * U, 6 * U);
  }
  g.restore();
  // 他写下的话
  const qk = ease(u, 0.3, 1.0);
  g.save(); g.globalAlpha = qk;
  const qy = L(H * 0.2, ST.y + 60);
  rr(g, CX - L(170, 160), qy - L(78, 74), L(340, 320), L(44, 42), 22); g.fillStyle = 'rgba(10,10,30,0.6)'; g.fill();
  txt(g, TL.txt.postDate, CX, qy - L(56, 53), L(26, 25), C.gold, { family: F.lora, spacing: '3px' });
  txt(g, TL.txt.quote, CX, qy, L(46, 40), C.ink, { family: F.loraI, shadow: 'rgba(0,0,0,0.9)', blur: 16, maxW: W * 0.9 });
  txt(g, TL.txt.quote2.replace(/\*/g, ''), CX, qy + L(58, 52), L(46, 40), C.ink, { family: F.loraI, shadow: 'rgba(0,0,0,0.9)', blur: 16, maxW: W * 0.9 });
  g.restore();
};

// —— 同一天，不同的明天：每扇窗的光，往天上走到不同的高度 ——
SHOT.city = (g, u, dur) => {
  sky(g, lerpSky('night', 'dawn', 0.15), H);
  stars(g, u + 160, 1, { n: 260, h: H * 0.75, seed: 71 });
  const s = L(0.6, 0.75) * (1 + 0.04 * ease(u, 0, dur));
  const cam = [960, L(470, 610), s];
  const beams = [];
  cityLayers(g, u, cam, { herPose: 'sofa', himPose: 'lean', himK: 1 });
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const wx = -1400 + rand(i, 480) * 4200, wy = CITY.base - 60 - rand(i, 481) * 500;
    const [x, y] = cityToScreen(wx, wy, cam);
    if (x < -20 || x > W + 20) continue;
    const tier = rand(i, 482), rise = ease(u, 0.2 + rand(i, 483) * 1.2, 2.6 + rand(i, 483) * 1.4);
    const len = (tier > 0.95 ? 1.1 : tier > 0.8 ? 0.55 : tier > 0.45 ? 0.24 : 0.08) * H * rise;
    const col = tier > 0.8 ? C.aiRGB : C.warmRGB, bw = (tier > 0.8 ? 7 : 5) * U;
    const bg = g.createLinearGradient(0, y, 0, y - len);
    bg.addColorStop(0, rgba(col, 0.5)); bg.addColorStop(0.7, rgba(col, 0.18)); bg.addColorStop(1, rgba(col, 0));
    g.fillStyle = bg; g.fillRect(x - bw / 2, y - len, bw, len);
    glow(g, x, y - len, (14 + 20 * (len / H)) * U, col, 0.9 * rise, 1);
    glow(g, x, y, 16 * U, col, 0.6 * rise);
  }
  g.restore();
};

// —— 回到你的房间 ——
SHOT.return = (g, u, dur, cue) => {
  const t29 = cue('L29', dur / 2);
  const dawn = 0.35 * ease(u, 0, dur);
  g.save();
  const z = 1.04 + 0.03 * ease(u, 0, dur);
  g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY);
  const R = livingRoom(g, u, { dawn, pose: 'sofa', screen: 1, phoneRGB: mixRGB(C.screenRGB, C.warmRGB, ease(u, t29 + 1.5, dur)),
    extra: (R) => {
      // 膝上摊开的本子：我的小馆子
      const nk = ease(u, t29 - 0.2, t29 + 0.6);
      if (nk <= 0) return;
      const [hx, hy] = R.hip, s = R.s;
      g.save(); g.translate(hx + s * L(13, 9.2), hy - s * L(4.4, 4.0) - (1 - nk) * 30); g.rotate(-0.06); g.scale(L(1.75, 1.45), L(1.75, 1.45)); g.globalAlpha = nk;
      g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 24;
      g.fillStyle = '#efe6d2'; g.fillRect(-s * 2.6, -s * 1.6, s * 5.2, s * 3.2); g.shadowBlur = 0;
      g.strokeStyle = 'rgba(120,90,60,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s * 1.6); g.lineTo(0, s * 1.6); g.stroke();
      txt(g, T('dream'), -s * 1.3, -s * 1.1, s * 0.5, '#7a3a2a');
      // 一间小店的速写
      g.strokeStyle = '#5a4a3a'; g.lineWidth = 2;
      g.strokeRect(-s * 2.1, -s * 0.2, s * 1.6, s * 1.3); g.beginPath(); g.moveTo(-s * 2.25, -s * 0.2); g.lineTo(-s * 1.3, -s * 0.65); g.lineTo(-s * 0.35, -s * 0.2); g.stroke(); g.strokeRect(-s * 1.5, s * 0.45, s * 0.4, s * 0.65);
      T('dreamLines').forEach((l, i) => txt(g, l, s * 1.3, -s * 0.9 + i * s * 0.75, s * 0.36, '#4a3a2e', { maxW: s * 2.3 }));
      g.restore();
    } });
  g.restore();
  // 先前那句「就这？」，淡淡地浮起来，又散了
  const jk = win(u, 0.4, t29 - 0.2, 0.8, 1.2);
  if (jk > 0) txt(g, T('justThis'), L(1360, 650), L(400, 760), L(170, 150), C.warm, { alpha: jk * 0.45, shadow: rgba(C.warmRGB, 0.4), blur: 40 });
  // 这一次，问它那个放了很多年的问题
  const ux = L(1800, 1010), uy = L(300, 640), ax = L(1060, 70), ay = L(560, 860);
  bubble(g, T('dreamAsk'), ux, uy, { side: 'r', k: ramp(u, t29 + 0.2, t29 + 0.6), size: L(44, 42), maxW: L(700, 860), type: ramp(u, t29 + 0.3, t29 + 1.4) });
  if (u > t29 + 1.9) bubble(g, T('dreamReply'), ax, ay, { side: 'l', k: ramp(u, t29 + 1.9, t29 + 2.2), size: L(42, 40), maxW: L(700, 880), type: ramp(u, t29 + 2.0, t29 + 3.4) });
};

// —— 就这？——不，就从这儿开始 ——
SHOT.dawn = (g, u, dur) => {
  const k = ease(u, 0, dur);
  sky(g, lerpSky('night', 'dawn', 0.4 + 0.6 * k), H);
  stars(g, u + 180, 0.6 * (1 - k), { n: 160, h: H * 0.6, seed: 81 });
  // 太阳从城后面升起来
  const sunY = lerp(H * 0.95, H * 0.62, ease(u, 0.3, dur + 2));
  glow(g, W * 0.5, sunY, Math.max(W, H) * 0.5, [255, 200, 140], 0.55 * k);
  glow(g, W * 0.5, sunY, 70 * U, [255, 240, 210], 0.9 * k, 1);
  const s = Math.exp(lerp(Math.log(L(4.2, 3.2)), Math.log(L(0.9, 0.95)), io(u, 0, dur - 0.6)));
  const cam = [lerp(CITY.her.x + 29, 960, io(u, 0.4, dur)), lerp(CITY.her.y + 38, L(540, 600), io(u, 0.4, dur)), s];
  cityLayers(g, u, cam, { herPose: 'sofa', herScreen: 1, himPose: 'lean', himK: 1, far: '#3a2f62', mid: '#241c48' });
  // 你的那扇窗，最亮
  const [hx, hy] = cityToScreen(CITY.her.x + 29, CITY.her.y + 38, cam);
  glow(g, hx, hy, 160 * U, C.warmRGB, 0.6);
  // 字：就这？ → 就从这儿开始
  const ty = L(H * 0.3, ST.y + 150);
  const bd = g.createRadialGradient(CX, ty + 30, 0, CX, ty + 30, L(700, 560));
  bd.addColorStop(0, `rgba(20,16,50,${0.55 * ease(u, 0.2, 0.8)})`); bd.addColorStop(1, 'rgba(20,16,50,0)');
  g.fillStyle = bd; g.fillRect(0, 0, W, H);
  const a1 = ease(u, 0.2, 0.7), q = ease(u, 1.4, 2.0);
  g.save();
  setFont(g, L(150, 130), F.hand);
  const wJ = g.measureText('就这').width;
  g.restore();
  txt(g, '就这', CX - L(40, 30) * q, ty, L(150, 130), C.ink, { alpha: a1 * (1 - ease(u, 2.0, 2.6)), shadow: rgba(C.warmRGB, 0.5), blur: 40 });
  txt(g, '？', CX + wJ / 2 + L(40, 30), ty, L(150, 130), C.ink, { alpha: a1 * (1 - q), shadow: rgba(C.warmRGB, 0.5), blur: 40 });
  const wk = ramp(u, 2.1, 3.3);
  if (wk > 0) {
    if (TL.lang === 'en') {
      writeOn(g, TL.txt.startEn, CX, ty, L(96, 64), C.gold, wk, { family: F.loraI, shadow: rgba(C.goldRGB, 0.7), blur: 50 });
      txt(g, TL.txt.start, CX, ty + L(110, 90), L(44, 40), '#fff3dc', { alpha: ease(u, 3.0, 3.6), shadow: 'rgba(0,0,0,0.6)', blur: 14 });
    } else {
      writeOn(g, TL.txt.start, CX, ty, L(150, 112), C.gold, wk, { shadow: rgba(C.goldRGB, 0.7), blur: 50 });
      txt(g, TL.txt.startEn, CX, ty + L(120, 100), L(44, 38), '#fff3dc', { family: F.loraI, alpha: ease(u, 3.0, 3.6), shadow: 'rgba(0,0,0,0.6)', blur: 14 });
    }
  }
};

// —— 片尾 ——
SHOT.endcard = (g, u, dur) => {
  sky(g, lerpSky('dawn', 'dusk', 0.25), H);
  glow(g, W * 0.5, H * 0.7, Math.max(W, H) * 0.6, [255, 200, 150], 0.35);
  const out = 1 - ease(u, dur - 1.6, dur);
  const a = ease(u, 0.3, 1.0) * out;
  const ty = L(H * 0.3, ST.y + 120);
  g.save(); g.globalAlpha = a;
  txt(g, TL.txt.title, CX, ty, L(150, 140), C.ink, { shadow: 'rgba(60,20,40,0.6)', blur: 40 });
  txt(g, TL.txt.titleEn, CX, ty + L(110, 110), L(36, 34), '#fff0d8', { family: F.loraI, weight: '600', spacing: '10px' });
  g.globalAlpha = ease(u, 0.9, 1.6) * out;
  const fam = TL.lang === 'en' ? F.loraI : F.hand;
  txt(g, TL.cta[0], CX, ty + L(250, 260), L(58, 64), '#fff6e6', { family: fam, shadow: 'rgba(60,20,40,0.6)', blur: 20, maxW: W * 0.9 });
  if (TL.poll) {
    // 评论区站队：1 / 2 / 3 / 4
    const opts = TL.lang === 'en' ? TL.txt.pollEn : TL.txt.poll;
    opts.forEach(([n, label], i) => {
      const k = ease(u, 1.0 + i * 0.15, 1.4 + i * 0.15);
      const x = CX + (i % 2 ? 1 : -1) * L(300, 240), y = ty + L(360, 380) + Math.floor(i / 2) * L(100, 110);
      const w = L(540, 440), h = L(76, 84);
      g.save(); g.globalAlpha = k * out;
      rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = 'rgba(30,20,60,0.55)'; g.fill();
      g.strokeStyle = 'rgba(255,226,192,0.7)'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(x - w / 2 + h / 2, y, h * 0.36, 0, TAU); g.fillStyle = C.warm; g.fill();
      txt(g, n, x - w / 2 + h / 2, y + 2, h * 0.46, '#2a1a3a', { family: F.lora, weight: '700' });
      txt(g, label, x + h * 0.3, y + 2, L(34, 36), '#fff6e6', { family: fam, maxW: w - h * 1.4 });
      g.restore();
    });
    txt(g, TL.cta[1], CX, ty + L(600, 640), L(40, 44), '#ffe2c0', { family: fam, maxW: W * 0.9, alpha: ease(u, 1.6, 2.2) });
  } else txt(g, TL.cta[1], CX, ty + L(330, 340), L(38, 36), '#ffe2c0', { family: fam, maxW: W * 0.9 });
  g.globalAlpha = ease(u, 1.4, 2.1) * out;
  txt(g, TL.lang === 'en' ? TL.txt.sourceEn : TL.txt.source, CX, L(H - 150, TL.poll ? 1400 : ST.y + ST.h - 40), L(28, 28), 'rgba(255,240,225,0.85)', { family: TL.lang === 'en' ? F.loraI : F.serif, maxW: W * 0.9 });
  txt(g, TL.txt.sign, CX, L(H - 96, TL.poll ? 1450 : ST.y + ST.h + 20), L(26, 26), 'rgba(255,240,225,0.75)', { family: F.lora, spacing: '8px' });
  g.restore();
};
