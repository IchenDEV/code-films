// 第四幕：我们也长在生命之树上
const BONE = [228, 222, 206];

// 前肢骨骼：同一套结构（肱骨、桡骨、尺骨、腕骨、五指），不同的比例。
function limbSpec(kind) {
  const B = [];
  const seg = (ax, ay, bx, by, w) => B.push([ax, ay, bx, by, w]);
  const S = {
    fish: { hum: [130, 30], rad: [95, 18, -14], uln: [110, 20, 14], carp: 14, wx: 0,
      dig: [[-0.18, [34, 30, 26, 22], 12], [-0.08, [36, 32, 28, 24], 12], [0.02, [38, 34, 30, 26], 12], [0.12, [36, 32, 28, 22], 11], [0.22, [32, 28, 24, 20], 10]] },
    tetra: { hum: [160, 30], rad: [130, 20, -16], uln: [135, 21, 16], carp: 16, wx: 0,
      dig: [[-0.75, [46, 30, 24, 0], 13], [-0.38, [52, 34, 26, 20], 13], [0, [54, 36, 28, 22], 13], [0.38, [50, 34, 26, 20], 12], [0.72, [44, 30, 22, 0], 11]] },
    bat: { hum: [200, 18], rad: [340, 12, -6], uln: [300, 6, 8], carp: 10, wx: 0,
      dig: [[-1.1, [40, 30, 20, 0], 8], [-0.42, [270, 150, 110, 40], 6], [-0.1, [270, 170, 120, 60], 6], [0.28, [250, 140, 100, 40], 6], [0.62, [230, 120, 80, 30], 6]] },
    whale: { hum: [95, 36], rad: [100, 30, -18], uln: [100, 30, 20], carp: 20, wx: 0,
      dig: [[-0.28, [60, 50, 40, 30], 18], [-0.12, [70, 64, 56, 46], 19], [0.02, [74, 70, 62, 54], 19], [0.16, [70, 62, 54, 44], 18], [0.3, [56, 44, 36, 26], 16]] },
    human: { hum: [300, 26], rad: [235, 16, -13], uln: [242, 16, 14], carp: 14, wx: 0,
      dig: [[-0.78, [70, 52, 40, 0], 15], [-0.24, [112, 62, 40, 28], 13], [-0.06, [108, 70, 44, 30], 13], [0.12, [102, 66, 42, 28], 12], [0.3, [94, 52, 32, 24], 11]] },
  }[kind];
  const h = S.hum[0];
  seg(0, 0, h, 0, S.hum[1]);
  seg(h + 8, S.rad[2], h + 8 + S.rad[0], S.rad[2] * 1.6, S.rad[1]);
  seg(h + 8, S.uln[2], h + 8 + S.uln[0], S.uln[2] * 1.15, S.uln[1]);
  const wx = h + 16 + Math.max(S.rad[0], S.uln[0]);
  for (let c = -1; c <= 1; c++) seg(wx, c * S.carp * 1.4, wx + S.carp, c * S.carp * 1.4, S.carp);
  const bx = wx + S.carp * 1.8;
  S.dig.forEach(([a, lens, w], d) => {
    let x = bx, y = (d - 2) * w * 1.15;
    for (let j = 0; j < 4; j++) {
      const L = lens[j], ww = w * (1 - j * 0.14);
      const nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
      seg(x, y, nx, ny, L > 0 ? ww : 0.01);
      x = nx + Math.cos(a) * (L > 0 ? 4 : 0); y = ny + Math.sin(a) * (L > 0 ? 4 : 0);
    }
  });
  // 归一化：每种肢体占据相近的画幅
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const b of B) { x0 = Math.min(x0, b[0], b[2]); x1 = Math.max(x1, b[0], b[2]); y0 = Math.min(y0, b[1], b[3]); y1 = Math.max(y1, b[1], b[3]); }
  const k = Math.min(980 / (x1 - x0), 520 / (y1 - y0));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return B.map(([ax, ay, bx, by, w]) => [(ax - mx) * k, (ay - my) * k, (bx - mx) * k, (by - my) * k, w * Math.sqrt(k)]);
}

const LIMBS = ['fish', 'tetra', 'bat', 'whale', 'human'];
const LIMB_NAMES = ['Eusthenopteron', 'Acanthostega', 'Chiroptera', 'Cetacea', 'Homo sapiens'];
const LIMB_DATA = {};
INITS.push(() => { for (const k of LIMBS) LIMB_DATA[k] = limbSpec(k); });

// 单根骨头：两端骨骺膨大，中段收窄
function bonePath(ctx, ax, ay, bx, by, w) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const e = Math.min(w * 0.55, L * 0.3), hw = w * 0.5, mw = w * 0.3;
  const P = (s, o) => [ax + ux * s + nx * o, ay + uy * s + ny * o];
  const side = (sg) => [P(e * 0.2, sg * hw), P(e * 1.2, sg * mw * 1.15), P(L * 0.5, sg * mw), P(L - e * 1.2, sg * mw * 1.15), P(L - e * 0.2, sg * hw)];
  const r = side(1), l = side(-1).reverse();
  const pts = [P(-e * 0.35, hw * 0.35), P(-e * 0.35, -hw * 0.35), ...l.reverse().reverse(), P(L + e * 0.35, -hw * 0.3), P(L + e * 0.35, hw * 0.3), ...r.reverse()];
  splinePath(ctx, pts, true);
}
function drawBones(ctx, bones, ox, oy, s, a, fill) {
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(s, s);
  ctx.lineJoin = 'round';
  for (const [ax, ay, bx, by, w] of bones) {
    if (w < 0.6 || Math.hypot(bx - ax, by - ay) < 2) continue;
    ctx.beginPath(); bonePath(ctx, ax, ay, bx, by, w * 1.25);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = `rgba(${BONE},${0.8 * a})`; ctx.lineWidth = 1.3 / Math.max(0.3, s); ctx.stroke();
    // 版画式的骨干阴影线
    ctx.strokeStyle = `rgba(${BONE},${0.16 * a})`; ctx.lineWidth = 0.8 / Math.max(0.3, s);
    const L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L, o = w * 0.16;
    ctx.beginPath();
    ctx.moveTo(lerp(ax, bx, 0.22) + nx * o, lerp(ay, by, 0.22) + ny * o); ctx.lineTo(lerp(ax, bx, 0.78) + nx * o, lerp(ay, by, 0.78) + ny * o);
    ctx.stroke();
  }
  ctx.restore();
}

(() => {
  const T0 = 107.0, HOLD = 1.6, MORPH = 1.2, STEP = HOLD + MORPH;
  const SNOW = [];
  INITS.push(() => { for (let i = 0; i < 260; i++) SNOW.push([rand(i, 600), rand(i, 601), rand(i, 602)]); });

  // —— 生命之树 ——
  const TREE = { segs: [], tips: [], human: null };
  INITS.push(() => {
    const N = 150, top = 170, BOT = H * 0.78, X0 = 120, X1 = W - 120;
    const leafX = (i) => lerp(X0, X1, i / (N - 1)) + (rand(i, 610) - 0.5) * 4;
    const HUMAN = 97;
    let sd = 1;
    const yOf = (n) => top + (BOT - top) * Math.pow(Math.log(n) / Math.log(N), 0.85) * (0.9 + rand(sd++, 612) * 0.2);
    function build(a, b, y, depth) {
      if (b - a === 1) { TREE.tips.push([leafX(a), top, a === HUMAN]); if (a === HUMAN) TREE.human = [leafX(a), top]; return { x: leafX(a), y: top }; }
      const r = rand(sd++, 611);
      const m = a + 1 + Math.floor((0.2 + r * 0.6) * (b - a - 1));
      const kids = [[a, m], [m, b]].map(([p, q]) => build(p, q, q - p === 1 ? top : Math.min(y - 8, yOf(q - p)), depth + 1));
      const x = (kids[0].x + kids[1].x) / 2;
      for (const k of kids) TREE.segs.push({ x0: x, y0: y, x1: k.x, y1: k.y, d: depth });
      // 灭绝的旁枝：长到半途就停下
      if (rand(sd++, 613) < 0.3 && depth > 1 && y - top > 60) {
        const ex = x + (rand(sd++, 614) - 0.5) * 30, ey = y - (y - top) * (0.2 + rand(sd++, 615) * 0.55);
        TREE.segs.push({ x0: x, y0: y, x1: ex, y1: ey, d: depth + 1, dead: true });
        TREE.dead = TREE.dead || []; TREE.dead.push([ex, ey]);
      }
      return { x, y };
    }
    const root = build(0, N, BOT, 0);
    TREE.segs.push({ x0: root.x, y0: BOT + 36, x1: root.x, y1: root.y, d: 0 });
  });

  function seg(ctx, s, P, lw, a) {
    const [ax, ay] = P(s.x0, s.y0), [bx, by] = P(s.x1, s.y1);
    ctx.lineWidth = lw; ctx.strokeStyle = `rgba(200,216,206,${a})`;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    ctx.bezierCurveTo(ax, lerp(ay, by, 0.55), bx, lerp(ay, by, 0.45), bx, by); ctx.stroke();
  }

  scene('life', 103.4, 138.6, 1.2, 1.6, (ctx, _, t) => {
    // 水下
    const sea = ease(t, 103.4, 105.4) * (1 - ease(t, 122, 126.5));
    if (sea > 0.002) {
      ctx.save();
      ctx.globalAlpha = sea;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgb(22,54,64)'); g.addColorStop(0.5, 'rgb(8,24,31)'); g.addColorStop(1, 'rgb(2,7,10)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const x = W * (0.1 + i * 0.14) + Math.sin(t * 0.3 + i * 1.7) * 60;
        const wd = 60 + rand(i, 620) * 120, sk = 0.25 + 0.2 * Math.sin(t * 0.5 + i);
        const sg = ctx.createLinearGradient(0, 0, 0, H * 0.9);
        sg.addColorStop(0, `rgba(120,190,200,${0.07 * sk})`); sg.addColorStop(1, 'rgba(120,190,200,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.moveTo(x - wd * 0.3, 0); ctx.lineTo(x + wd * 0.3, 0); ctx.lineTo(x + wd + 200, H * 0.9); ctx.lineTo(x - wd + 200, H * 0.9); ctx.fill();
      }
      for (const [u, v, r] of SNOW) {
        const x = (u * W + Math.sin(t * 0.4 + r * 20) * 20 + t * 4) % W;
        const y = ((v * H + t * (6 + r * 10)) % H);
        glow(ctx, x, y, 1.5 + r * 2.5, [170, 210, 210], 0.25 + r * 0.35, 1);
      }
      ctx.restore();
    }
    // 肢骨的连续变形
    const u = (t - T0) / STEP;
    const i = clamp(Math.floor(u), 0, LIMBS.length - 1);
    const f = i >= LIMBS.length - 1 ? 0 : easeInOut(ramp((u - i) * STEP, HOLD, STEP));
    const A = LIMB_DATA[LIMBS[i]], Bd = LIMB_DATA[LIMBS[Math.min(i + 1, LIMBS.length - 1)]];
    const bones = A.map((b, j) => b.map((v, q) => lerp(v, Bd[j][q], f)));
    // 回拉：手退成树梢上的一点
    const pull = easeInOut(ramp(t, 121.6, 130.5));
    const Z = Math.exp(lerp(Math.log(18), 0, pull));
    const tip = TREE.human;
    const A0 = [lerp(CX + 470, tip[0], pull), lerp(CY - 10, tip[1], pull)];
    const limbK = ease(t, 105.4, 107) * (1 - ease(t, 123.2, 125.4));
    if (limbK > 0.002) {
      const s = Z / 18;
      const fill = sea > 0.5 ? 'rgb(9,26,33)' : 'rgb(4,6,7)';
      // 肢体的位置：在放大的树梢上
      drawBones(ctx, bones, A0[0] - 470 * s, A0[1], s, limbK, fill);
      // 鱼鳍的鳍条、蝙蝠的翼膜、鲸的鳍状轮廓
      const wFish = i === 0 ? 1 - f : 0, wBat = i === 2 ? 1 - f : i === 1 ? f : 0, wWhale = i === 3 ? 1 - f : i === 2 ? f : 0;
      ctx.save();
      ctx.translate(A0[0] - 470 * s, A0[1]); ctx.scale(s, s);
      ctx.strokeStyle = `rgba(${BONE},${0.3 * wFish * limkSafe(limbK)})`; ctx.lineWidth = 1;
      if (wFish > 0.01) {
        ctx.beginPath();
        for (let r = 0; r < 26; r++) {
          const a = -0.5 + (r / 25) * 1.0;
          const bx = bones[16][2], by = bones[16][3];
          ctx.moveTo(bx - 40, by + (r - 13) * 6); ctx.lineTo(bx - 40 + Math.cos(a) * 320, by + (r - 13) * 6 + Math.sin(a) * 320);
        }
        ctx.stroke();
      }
      if (wBat > 0.01 || wWhale > 0.01) {
        const tipsIdx = [9, 13, 17, 21, 25];
        const pts = [[bones[0][0], bones[0][1] + 40]];
        for (const ti of tipsIdx.slice(1).reverse()) pts.push([bones[ti][2], bones[ti][3]]);
        ctx.fillStyle = `rgba(${BONE},${0.06 * wBat * limbK})`;
        ctx.beginPath(); pts.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineTo(bones[1][2], bones[1][3]); ctx.closePath(); ctx.fill();
        if (wWhale > 0.01) {
          ctx.strokeStyle = `rgba(${BONE},${0.35 * wWhale * limbK})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.ellipse(bones[17][2] * 0.5, 0, 560, 150, 0, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();
      // 学名
      if (pull < 0.05) {
        ctx.save();
        ctx.font = `italic 22px ${LATIN}`; ctx.textAlign = 'center'; ctx.letterSpacing = '0.08em';
        for (let n = 0; n < LIMBS.length; n++) {
          const a = n === i ? 1 - f : n === i + 1 ? f : 0;
          if (a < 0.01) continue;
          ctx.fillStyle = `rgba(214,206,186,${0.6 * a * limbK})`;
          ctx.fillText(LIMB_NAMES[n], CX, CY + 300);
        }
        ctx.restore();
      }
    }
    // 生命之树
    const treeK = ease(t, 122.4, 125.5);
    if (treeK > 0.002) {
      const P = (x, y) => [A0[0] + (x - tip[0]) * Z, A0[1] + (y - tip[1]) * Z];
      ctx.save();
      ctx.lineCap = 'round';
      for (const s of TREE.segs) seg(ctx, s, P, Math.max(0.7, 2.6 - s.d * 0.16) * Math.min(3, Z), (s.dead ? 0.22 : 0.42) * treeK);
      ctx.globalCompositeOperation = 'lighter';
      // 时间沿着枝干向上流动
      for (let p = 0; p < 40; p++) {
        const s = TREE.segs[Math.floor(rand(p, 630) * TREE.segs.length)];
        const ph = ((t * 0.5 + rand(p, 631)) % 1);
        const [ax, ay] = P(s.x0, s.y0), [bx, by] = P(s.x1, s.y1);
        const q = ph, mq = 1 - q;
        const x = mq * mq * mq * ax + 3 * mq * mq * q * ax + 3 * mq * q * q * bx + q * q * q * bx;
        const y = mq * mq * mq * ay + 3 * mq * mq * q * lerp(ay, by, 0.55) + 3 * mq * q * q * lerp(ay, by, 0.45) + q * q * q * by;
        glow(ctx, x, y, 5, [200, 230, 220], 0.5 * treeK * Math.sin(Math.PI * ph), 1);
      }
      for (const [x, y, isH] of TREE.tips) {
        const [sx, sy] = P(x, y);
        glow(ctx, sx, sy, isH ? 5 : 3, [220, 232, 226], (isH ? 0.9 : 0.45) * treeK, 1);
      }
      ctx.restore();
      // 我们这一枝
      const hk = treeK * ease(t, 128.5, 130.5);
      if (hk > 0.01) {
        const [hx, hy] = P(tip[0], tip[1]);
        ctx.save();
        ctx.strokeStyle = `rgba(214,206,186,${0.5 * hk})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU); ctx.stroke();
        ctx.font = `italic 18px ${LATIN}`; ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(214,206,186,${0.55 * hk})`;
        ctx.fillText('Homo sapiens', hx, hy - 26);
        ctx.restore();
      }
    }
  });
  function limkSafe(k) { return k; }
})();
