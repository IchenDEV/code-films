// 冷静一下、五层阶梯、结尾、片尾卡。

SHOT.reality = (g, u, dur, cue) => {
  background(g, u, { tint: [16, 16, 26] });
  const ten = cue('ten', 2.5), pass = cue('pass', 5), crash = cue('crash', 7), when = cue('when', -1), wait = cue('wait', -1), tog = cue('together', -1);
  const p1 = 1 - ease(u, pass - 0.5, pass - 0.1), p2 = ease(u, pass - 0.4, pass) * (when > 0 ? 1 - ease(u, when - 0.4, when - 0.1) : 1);
  const cx = ST.cx, cy = ST.cy;
  // ① 一行小改动，挤满了十个 Agent
  if (p1 > 0) {
    g.save(); g.globalAlpha = p1;
    const cw = PORTRAIT ? 640 : 760;
    panel(g, cx - cw / 2, cy - 60, cw, 120, { bar: false, rgb: C.cyanRGB, r: 16 });
    codeLine(g, '- maxAge: 3600', cx - cw / 2 + 36, cy - 20, PORTRAIT ? 30 : 34, { color: '#ff8fa0' });
    codeLine(g, '+ maxAge: 86400', cx - cw / 2 + 36, cy + 24, PORTRAIT ? 30 : 34, { color: '#8dffc9' });
    txt(g, TL.txt.oneLine, cx, cy - 110, 40, C.ink, { family: F.mono });
    const n = u < ten ? 1 : 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + u * 0.8, r = i === 0 && n === 1 ? 0 : (PORTRAIT ? 300 : 340) * ex(u, ten, ten + 0.4);
      const x = cx + (n === 1 ? cw / 2 + 60 : Math.cos(a) * r), y = cy + (n === 1 ? 0 : Math.sin(a) * r * 0.6);
      glow(g, x, y, 40, C.cyanRGB, 0.8); glow(g, x, y, 10, C.whiteRGB, 1, 1);
      if (n > 1) glowLine(g, [[x, y], [cx, cy - 160]], C.violetRGB, 0.25, 1);
    }
    if (u > ten) {
      coordinator(g, cx, cy - 170, u, ex(u, ten, ten + 0.3), 0.5);
      // 计费表在转
      const cost = (Math.max(0, u - ten) * 7.3 + 0.12).toFixed(2);
      txt(g, '$' + cost, PORTRAIT ? cx : cx + 520, PORTRAIT ? ST.y + ST.h - 30 : cy + 40, PORTRAIT ? 70 : 80, C.red, { family: F.num, shadow: rgba(C.redRGB, 0.8) });
      slam(g, TL.txt.slower, cx, PORTRAIT ? ST.y - 10 : ST.y + 40, PORTRAIT ? 80 : 84, u, ten + 0.3, C.white, { glow: C.redRGB, maxW: W * 0.9 });
    }
    g.restore();
  }
  // ② 各自测试全过，合在一起照样崩
  if (p2 > 0) {
    g.save(); g.globalAlpha = p2;
    const names = [TL.txt.db, TL.txt.api, TL.txt.ui];
    const bw = PORTRAIT ? 420 : 440, bh = PORTRAIT ? 170 : 240;
    const ck = ex(u, crash - 0.35, crash);
    const [sx, sy] = shakeXY(u, crash, 26, 0.5);
    g.translate(sx, sy);
    names.forEach((nm, i) => {
      const spread = PORTRAIT ? 0 : (i - 1) * (bw + 120) * (1 - ck);
      const vy = PORTRAIT ? (i - 1) * (bh + 60) * (1 - ck) : 0;
      const x = cx - bw / 2 + spread + (PORTRAIT ? 0 : (i - 1) * bw * ck * 0.98), y = cy - bh / 2 + vy + (PORTRAIT ? (i - 1) * bh * ck * 0.98 : 0);
      const off = ck * (i === 1 ? 14 : i === 2 ? -10 : 0); // 拼起来却错位
      const bad = u > crash;
      panel(g, x + (PORTRAIT ? off : 0), y + (PORTRAIT ? 0 : off), bw, bh, { bar: false, rgb: bad ? C.redRGB : C.cyanRGB, r: 12, glow: bad ? 2 : 0.8 });
      txt(g, nm, x + bw / 2 + (PORTRAIT ? off : 0), y + bh / 2 - 14 + (PORTRAIT ? 0 : off), PORTRAIT ? 44 : 50, C.white, { family: ZH ? F.displayZH : F.black });
      const tk = ex(u, pass + i * 0.2, pass + i * 0.2 + 0.25);
      if (tk > 0) txt(g, '✓ tests', x + bw / 2, y + bh / 2 + 40 + (PORTRAIT ? 0 : off), 28, C.green, { family: F.mono, alpha: tk * (bad ? 0.5 : 1) });
      if (!bad) { glow(g, x + bw - 20, y + 20, 30, C.cyanRGB, 0.8); }
    });
    if (u > crash) {
      // 裂缝
      g.strokeStyle = C.red; g.lineWidth = 4; g.shadowColor = C.red; g.shadowBlur = 25;
      for (let j = 0; j < 2; j++) {
        g.beginPath();
        const bx = PORTRAIT ? cx : cx - bw / 2 + (j + 1) * bw * 0.98 - bw * 0.49, by = PORTRAIT ? cy - bh / 2 + (j + 1) * bh * 0.98 - bh * 0.49 : cy;
        for (let s = 0; s <= 8; s++) {
          const q = s / 8 - 0.5;
          const x = PORTRAIT ? bx + q * bw * 1.1 * ease(u, crash, crash + 0.25) : bx + (rand(s, j + 110) - 0.5) * 30;
          const y = PORTRAIT ? by + (rand(s, j + 111) - 0.5) * 26 : by + q * bh * 1.1 * ease(u, crash, crash + 0.25);
          s ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.shadowBlur = 0;
    }
    g.restore();
    if (u > crash) {
      const f = 1 - clamp((u - crash) / 0.3);
      g.fillStyle = `rgba(255,60,90,${0.35 * f})`; g.fillRect(0, 0, W, H);
      slam(g, TL.txt.integ, cx, PORTRAIT ? ST.y - 10 : ST.y + 50, PORTRAIT ? 88 : 96, u, crash + 0.05, C.red, { glow: C.redRGB, maxW: W * 0.9, out: when > 0 ? when - 0.5 : 1e9 });
    }
  }
  // ③ 拆、等、一起验证
  if (when > 0) {
    const ws = TL.txt.when, ts = [when, wait > 0 ? wait : when + 0.8, tog > 0 ? tog : when + 1.6];
    ws.forEach((w, i) => {
      const y = cy + (i - 1) * (PORTRAIT ? 170 : 150);
      const a = slam(g, w, cx, y, PORTRAIT ? 70 : 76, u, ts[i], i === 2 ? C.green : C.white, { glow: i === 2 ? C.greenRGB : C.cyanRGB, maxW: W * 0.9, family: ZH ? F.displayZH : F.black });
    });
  }
};

// —— 五层阶梯：人一层层往上走 ——
SHOT.ladder = (g, u, dur, cue) => {
  background(g, u, { tint: [12, 14, 30] });
  const up = cue('up', 0.6), cl = [0, cue('l1', -1), cue('l2', -1), cue('l3', -1), cue('l4', -1), cue('l5', -1)], ask = cue('ask', dur - 3);
  const names = TL.txt.levels;
  const n = 6;
  // 当前所在层（缺的层随下一层一起点亮）
  let level = 0;
  for (let i = 1; i < n; i++) if (cl[i] > 0 && u > cl[i]) level = i;
  if (cl[4] < 0 && cl[5] > 0 && u > cl[5]) level = 5;
  const lvlK = (i) => {
    if (i === 0) return 1;
    let t0 = cl[i];
    if (t0 < 0) t0 = i === 4 ? cl[5] - 0.15 : -1;
    return t0 > 0 ? ease(u, t0 - 0.1, t0 + 0.3) : 0;
  };
  const gap = PORTRAIT ? 104 : 118, pw = PORTRAIT ? 560 : 620, ph = PORTRAIT ? 120 : 130;
  const bx = PORTRAIT ? ST.cx : ST.cx - 280, by = ST.y + ST.h - (PORTRAIT ? 60 : 70);
  const rise = ease(u, 0, 1.0);
  const askK = ease(u, ask - 0.2, ask + 0.3);
  // 镜头跟着人往上
  const camY = 0;
  g.save(); g.translate(0, -camY * (1 - askK));
  for (let i = 0; i < n; i++) {
    const k = ex(u, up - 0.6 + i * 0.12, up - 0.2 + i * 0.12);
    if (k <= 0) continue;
    const y = by - i * gap * rise - (1 - k) * 60;
    const lit = lvlK(i), cur = i === level;
    const rgb = i === 5 ? C.violetRGB : i >= 3 ? C.cyanRGB : i === 0 ? C.amberRGB : [130, 180, 240];
    // 一层平台（平行四边形）
    const sk = PORTRAIT ? 70 : 90;
    g.beginPath();
    g.moveTo(bx - pw / 2 + sk, y - ph / 2); g.lineTo(bx + pw / 2 + sk, y - ph / 2); g.lineTo(bx + pw / 2 - sk, y + ph / 2); g.lineTo(bx - pw / 2 - sk, y + ph / 2); g.closePath();
    g.fillStyle = rgba(mix([18, 24, 40], rgb, 0.12 + 0.25 * lit + (cur ? 0.15 : 0)), 0.85 * k);
    g.fill();
    g.strokeStyle = rgba(rgb, (0.25 + 0.7 * lit) * k); g.lineWidth = cur ? 3 : 1.5;
    g.shadowColor = rgba(rgb, cur ? 0.9 : 0); g.shadowBlur = cur ? 30 : 0; g.stroke(); g.shadowBlur = 0;
    // 层号与名称
    txt(g, 'L' + i, bx - pw / 2 - (PORTRAIT ? 30 : 20), y, PORTRAIT ? 44 : 50, rgba(rgb, 0.5 + 0.5 * lit), { family: F.num, align: 'right', alpha: k });
    const lx = PORTRAIT ? bx : bx + pw / 2 + 100;
    txt(g, names[i], lx, y, PORTRAIT ? 38 : 42, lit > 0.5 ? C.white : C.dim, { family: ZH ? F.displayZH : F.black, align: PORTRAIT ? 'center' : 'left', alpha: k * (0.5 + 0.5 * lit), maxW: PORTRAIT ? pw - 80 : 640 });
    if (i === 5 && lit > 0) { // 顶层：小小的一棵组织树
      for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.4, r = 60 + (j % 2) * 18; glowLine(g, [[bx + pw / 2 - 20, y], [bx + pw / 2 - 20 + Math.cos(a) * r, y + Math.sin(a) * r * 0.5]], C.cyanRGB, lit * 0.8, 1.2); glow(g, bx + pw / 2 - 20 + Math.cos(a) * r, y + Math.sin(a) * r * 0.5, 10, C.cyanRGB, lit, 1); }
      glow(g, bx + pw / 2 - 20, y, 26, C.violetRGB, lit, 1);
    }
  }
  // 人：琥珀色的光点，在当前层
  const tgtY = by - level * gap * rise;
  const prevY = by - Math.max(0, level - 1) * gap * rise;
  const lastT = cl[level] > 0 ? cl[level] : (level === 5 ? cl[5] : 0);
  const hk = outBack(clamp((u - lastT) / 0.4), 1.6);
  const hy = level === 0 ? by : lerp(prevY, tgtY, hk) - 34;
  const hx = bx - (PORTRAIT ? 170 : 200);
  glow(g, hx, hy, 70, C.amberRGB, 0.9); glow(g, hx, hy, 16, C.whiteRGB, 1, 1);
  g.restore();
  if (askK > 0) {
    g.fillStyle = `rgba(4,6,12,${0.62 * askK})`; g.fillRect(0, 0, W, H);
    slam(g, TL.txt.whichLevel, CX, PORTRAIT ? ST.y + 10 : ST.cy, PORTRAIT ? 100 : 130, u, ask, C.white, { glow: C.amberRGB, maxW: W * 0.92 });
    // L0…L5 一排数字闪过
    for (let i = 0; i < 0; i++) {
      const k = ex(u, ask + 0.3 + i * 0.07, ask + 0.5 + i * 0.07);
      const x = CX + (i - 2.5) * (PORTRAIT ? 150 : 170), y = PORTRAIT ? ST.y + 170 : ST.cy + 150;
      txt(g, 'L' + i, x, y, PORTRAIT ? 64 : 70, i === 5 ? C.violet : C.white, { family: F.num, alpha: k, shadow: rgba(C.cyanRGB, 0.7) });
    }
  }
};

// —— 结尾：又回到一个光标 ——
SHOT.end = (g, u, dur, cue) => {
  background(g, u, { tint: [8, 10, 18], dots: false });
  const other = cue('other', dur * 0.55), fin = cue('final', dur - 2.5);
  const cy = PORTRAIT ? ST.cy : CY - 20;
  // 远处的光点群
  const sk = ease(u, other - 0.4, other + 1.2);
  if (sk > 0) {
    const cam = { yaw: 1.2 + u * 0.05, pitch: -0.25, dist: lerp(3600, 2600, sk), fov: 900, cx: CX, cy };
    drawSwarm(g, u, cam, { alpha: 0.6 * sk, wave: u - other });
  }
  // 问号
  const q = win(u, 0.1, other, 0.5, 0.8);
  txt(g, '?', CX, cy, PORTRAIT ? 560 : 640, rgba(C.whiteRGB, 0.06 * q), { family: F.black });
  // 光标：始终在
  const ca = 1 - 0.3 * sk;
  glow(g, CX, cy, 240, C.amberRGB, 0.16 * ca);
  cursorBar(g, CX - 6, cy, PORTRAIT ? 110 : 100, u, C.amberRGB, ca);
  if (fin > 0) {
    const a = ease(u, fin + 0.6, fin + 1.4);
    txt(g, TL.txt.endSub, CX, cy + (PORTRAIT ? 170 : 150), PORTRAIT ? 34 : 32, C.dim, { family: F.mono, alpha: a, maxW: W * 0.9 });
  }
};

SHOT.endcard = (g, u, dur) => {
  background(g, u, { tint: [10, 12, 22], dots: false });
  const a = ease(u, 0.1, 0.8) * (1 - ease(u, dur - 0.6, dur));
  const y = PORTRAIT ? ST.cy - 40 : CY - 60;
  g.save(); g.globalAlpha = a;
  txt(g, TL.txt.title1, CX, y - (PORTRAIT ? 90 : 60), PORTRAIT ? 84 : 80, C.amber, { family: ZH ? F.displayZH : F.black, maxW: W * 0.88, shadow: rgba(C.amberRGB, 0.5) });
  txt(g, TL.txt.title2, CX, y + (PORTRAIT ? 30 : 50), PORTRAIT ? 100 : 104, C.white, { family: ZH ? F.displayZH : F.black, maxW: W * 0.9, shadow: rgba(C.cyanRGB, 0.6) });
  txt(g, TL.txt.sign, CX, y + (PORTRAIT ? 200 : 210), 34, C.dim, { family: F.mono, spacing: '0.5em' });
  g.restore();
  glow(g, CX, y + (PORTRAIT ? 260 : 270), 30, C.amberRGB, a * (Math.floor(u * 2.2) % 2 ? 0.2 : 1), 1);
};
