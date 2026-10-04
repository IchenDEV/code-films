// 第三幕 · 第二重：起源
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

const LIMBS = ['fish', 'bat', 'whale', 'human'];
const LIMB_NAMES = ['Eusthenopteron', 'Chiroptera', 'Cetacea', 'Homo sapiens'];
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


  const SNOW = [];
  INITS.push(() => { for (let i = 0; i < 260; i++) SNOW.push([rand(i, 600), rand(i, 601), rand(i, 602)]); });
  function sea(ctx, t, k) {
    ctx.save();
    ctx.globalAlpha = k;
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

  function seg(ctx, s, P, lw, a) {
    const [ax, ay] = P(s.x0, s.y0), [bx, by] = P(s.x1, s.y1);
    ctx.lineWidth = lw; ctx.strokeStyle = `rgba(200,216,206,${a})`;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    ctx.bezierCurveTo(ax, lerp(ay, by, 0.55), bx, lerp(ay, by, 0.45), bx, by); ctx.stroke();
  }

  // 存在巨链：从神俯瞰到石头，再回到人
  SHOT.chain = (ctx, u, dur, sh) => {
    const a = sh.c2, b = sh.c2_end, c = sh.c3 - 0.3;
    let from, to, k;
    if (u < a) { from = [0.5, 0.5, 1.0]; to = [0.5, 0.2, 0.42]; k = u / a; }
    else if (u < c) { from = [0.5, 0.2, 0.42]; to = [0.5, 0.82, 0.42]; k = ramp(u, a, Math.max(a + 1, b)); }
    else { from = [0.5, 0.82, 0.42]; to = [0.5, 0.36, 0.5]; k = ramp(u, c, dur); }
    kenburns(ctx, 'chain', k, from, to, { vig: 0.8 });
  };
  SHOT.darwin = (ctx, u, dur) => {
    kenburns(ctx, 'darwin', u / dur, [0.45, 0.42, 0.95], [0.34, 0.25, 0.48], { vig: 0.7 });
  };

  // 阶梯倒下，长成一棵树
  const LADDER = { zh: ['人', '猿', '走兽', '飞鸟', '爬虫', '游鱼', '草木'], en: ['Man', 'Ape', 'Beast', 'Bird', 'Reptile', 'Fish', 'Plant'] };
  const TREE_ORDER = [6, 5, 4, 3, 2, 1, 0]; // 树梢上从左到右：草木、游鱼、爬虫、飞鸟、走兽、猿、人
  const NODES = (() => {
    const lx = (j) => 300 + j * ((W - 600) / 6);
    const X = (ids) => ids.reduce((s, i) => s + lx(TREE_ORDER.indexOf(i)), 0) / ids.length;
    const top = 250;
    const n = {
      R: { x: X([6, 5, 4, 3, 2, 1, 0]), y: 960 }, A: { x: X([5, 4, 3, 2, 1, 0]), y: 820 }, T: { x: X([4, 3, 2, 1, 0]), y: 690 },
      S: { x: X([3, 4]), y: 520 }, M: { x: X([2, 1, 0]), y: 560 }, P: { x: X([1, 0]), y: 420 },
    };
    const leaf = (i) => ({ x: lx(TREE_ORDER.indexOf(i)), y: top });
    const E = [['R', 6, 0], ['R', 'A', 0], ['A', 5, 1], ['A', 'T', 1], ['T', 'S', 2], ['T', 'M', 2], ['S', 4, 3], ['S', 3, 3], ['M', 2, 3], ['M', 'P', 3], ['P', 1, 4], ['P', 0, 4]];
    return { n, leaf, E, root: { x: n.R.x, y: 1040 } };
  })();
  SHOT.ladder = (ctx, u, dur, sh) => {
    const names = LADDER[TL.lang];
    const t0 = sh.c5 ?? 1, fall = easeInOut(ramp(u, t0 + 0.2, t0 + 2.4)), grow = ramp(u, t0 + 1.6, dur - 0.8);
    const col = (a) => `rgba(${lerp(GOLD[0], 200, fall) | 0},${lerp(GOLD[1], 216, fall) | 0},${lerp(GOLD[2], 206, fall) | 0},${a})`;
    ctx.save();
    // 梯子
    const lk = 1 - ease(fall, 0, 0.6);
    if (lk > 0) {
      ctx.save();
      ctx.translate(CX - 120, 960); ctx.rotate(-fall * 0.9); ctx.translate(-(CX - 120), -960);
      ctx.strokeStyle = col(0.6 * lk); ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const x of [CX - 120, CX + 120]) { ctx.moveTo(x, 130); ctx.lineTo(x, 960); }
      for (let i = 0; i < 7; i++) { const y = 200 + i * 112; ctx.moveTo(CX - 120, y); ctx.lineTo(CX + 120, y); }
      ctx.stroke();
      ctx.restore();
    }
    // 树
    if (grow > 0) {
      const { n, leaf, E, root } = NODES;
      const pt = (k) => (typeof k === 'number' ? leaf(k) : n[k]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = col(0.55); ctx.lineWidth = 1.6;
      ctx.beginPath(); polyProgress(ctx, [[root.x, root.y], [n.R.x, n.R.y]], ease(grow, 0, 0.12)); ctx.stroke();
      for (const [p, c, d] of E) {
        const k = ease(grow, 0.1 + d * 0.16, 0.3 + d * 0.16);
        if (k <= 0) continue;
        const A = pt(p), B = pt(c);
        const pts = [];
        for (let q = 0; q <= 20; q++) {
          const s = q / 20, m = 1 - s;
          const y = m * m * m * A.y + 3 * m * m * s * lerp(A.y, B.y, 0.55) + 3 * m * s * s * lerp(A.y, B.y, 0.45) + s * s * s * B.y;
          const x = m * m * m * A.x + 3 * m * m * s * A.x + 3 * m * s * s * B.x + s * s * s * B.x;
          pts.push([x, y]);
        }
        ctx.lineWidth = 2.2 - d * 0.3;
        ctx.beginPath(); polyProgress(ctx, pts, k); ctx.stroke();
      }
    }
    // 名字：从梯级移到树梢，排成一行
    ctx.font = `${TL.lang === 'zh' ? 34 : 28}px ${SERIF}`; ctx.textBaseline = 'middle';
    names.forEach((nm, i) => {
      const ly = 200 + i * 112, lx0 = CX + 150;
      const j = TREE_ORDER.indexOf(i), tx = 300 + j * ((W - 600) / 6), ty = 205;
      const f = easeInOut(ramp(u, t0 + 0.4 + i * 0.08, t0 + 2.4 + i * 0.08));
      const x = lerp(lx0, tx, f), y = lerp(ly, ty, f) + Math.sin(f * Math.PI) * 60;
      ctx.textAlign = f > 0.5 ? 'center' : 'left';
      ctx.fillStyle = col(0.9);
      ctx.fillText(nm, x, y);
      if (f > 0.9) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, tx, 250, 5, [220, 232, 226], ease(grow, 0.8, 1), 1); ctx.restore(); }
    });
    ctx.restore();
  };

  // 同一套骨骼：鱼鳍 → 蝙蝠翼 → 鲸鳍肢 → 人手
  SHOT.limbs = (ctx, u, dur) => {
    sea(ctx, u + 10, 1);
    const MORPH = 0.9, T0 = 0.5, HOLD = Math.max(0.6, (dur - 1.0 - 3 * MORPH) / 4), STEP = HOLD + MORPH;
    const q = (u - T0) / STEP;
    const i = clamp(Math.floor(q), 0, LIMBS.length - 1);
    const f = i >= LIMBS.length - 1 ? 0 : easeInOut(ramp((q - i) * STEP, HOLD, STEP));
    const A = LIMB_DATA[LIMBS[i]], B = LIMB_DATA[LIMBS[Math.min(i + 1, LIMBS.length - 1)]];
    const bones = A.map((b, j) => b.map((v, k) => lerp(v, B[j][k], f)));
    const k = ease(u, 0.2, 0.9);
    drawBones(ctx, bones, CX, CY - 40, 0.92, k, 'rgb(9,26,33)');
    ctx.save();
    ctx.font = `italic 22px ${LATIN}`; ctx.textAlign = 'center'; ctx.letterSpacing = '0.08em';
    for (let n = 0; n < LIMBS.length; n++) {
      const a = n === i ? 1 - f : n === i + 1 ? f : 0;
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(214,206,186,${0.6 * a * k})`;
      ctx.fillText(LIMB_NAMES[n], CX, CY + 270);
    }
    ctx.restore();
  };

  // 细胞、DNA、遗传密码
  const CODE = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  const BASES = 'UCAG';
  SHOT.dna = (ctx, u, dur) => {
    const tc = (a) => `rgba(186,222,214,${a})`;
    // 分裂的细胞
    {
      const cx = 400, cy = CY - 40, ph = (u * 0.42) % 1, sep = easeInOut(ramp(ph, 0.25, 0.8)) * 120;
      const r = 120 - sep * 0.22;
      ctx.save();
      ctx.strokeStyle = tc(0.6); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx - sep, cy, r, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + sep, cy, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = tc(0.05);
      ctx.beginPath(); ctx.arc(cx - sep, cy, r, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + sep, cy, r, 0, TAU); ctx.fill();
      // 染色体
      ctx.strokeStyle = tc(0.75); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let c = 0; c < 4; c++) for (const s of [-1, 1]) {
        const y = cy - 45 + c * 30, x = cx + s * (6 + sep * 1.1);
        ctx.beginPath(); ctx.moveTo(x - 14, y - 6 + c * 2); ctx.lineTo(x + 14, y + 6 - c * 2); ctx.stroke();
      }
      ctx.restore();
    }
    // 双螺旋
    {
      const x0 = CX + 20, y0 = 110, y1 = H - 190, A = 92, rot = u * 1.3;
      ctx.save();
      const cols = [[230, 160, 120], [140, 200, 220], [210, 200, 120], [170, 150, 220]];
      for (let y = y0; y <= y1; y += 22) {
        const th = (y - y0) * 0.032 + rot;
        const xa = x0 + Math.sin(th) * A, xb = x0 + Math.sin(th + Math.PI) * A;
        const za = Math.cos(th), zb = -za;
        const c = cols[Math.floor(rand(y, 640) * 4)];
        ctx.strokeStyle = `rgba(${c},${0.35 + 0.25 * Math.abs(za)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
      }
      for (const off of [0, Math.PI]) {
        ctx.beginPath();
        for (let y = y0; y <= y1; y += 4) {
          const th = (y - y0) * 0.032 + rot + off;
          const x = x0 + Math.sin(th) * A;
          y === y0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = tc(0.8); ctx.lineWidth = 2.4; ctx.stroke();
      }
      ctx.restore();
    }
    // 密码子表：64 个三联体对应 20 种氨基酸，所有生命几乎通用
    {
      const x0 = 1330, y0 = 150, cw = 120, rh = 41;
      ctx.save();
      ctx.font = `17px ${MONO}`; ctx.textBaseline = 'middle';
      for (let i = 0; i < 64; i++) {
        const a = BASES[i >> 4], b = BASES[(i >> 2) & 3], c = BASES[i & 3];
        const row = (i >> 4) * 4 + (i & 3), col = (i >> 2) & 3;
        const k = ease(u, 0.4 + i * 0.05, 0.9 + i * 0.05);
        if (k <= 0) continue;
        const aa = CODE[i] === '*' ? '■' : CODE[i];
        ctx.fillStyle = tc(0.55 * k);
        ctx.fillText(a + b + c, x0 + col * cw, y0 + row * rh);
        ctx.fillStyle = `rgba(236,226,204,${0.85 * k})`;
        ctx.fillText(aa, x0 + col * cw + 52, y0 + row * rh);
      }
      ctx.restore();
    }
  };

  SHOT.huxley = (ctx, u, dur) => {
    kenburns(ctx, 'huxley', u / dur, [0.36, 0.42, 0.8], [0.7, 0.38, 0.62], { vig: 0.7 });
  };

  // 生命之树：从“我们这一枝”拉远到整棵树
  SHOT.tree = (ctx, u, dur, sh) => {
    const pull = easeInOut(ramp(u, 0.3, (sh.c10 ?? dur * 0.5) + 0.6));
    const Z = Math.exp(lerp(Math.log(9), 0, pull));
    const tip = TREE.human;
    const A0 = [lerp(CX, tip[0], pull), lerp(CY, tip[1], pull)];
    const P = (x, y) => [A0[0] + (x - tip[0]) * Z, A0[1] + (y - tip[1]) * Z];
    const t = u + 120;
    ctx.save();
    ctx.lineCap = 'round';
    for (const s of TREE.segs) seg(ctx, s, P, Math.max(0.7, 2.6 - s.d * 0.16) * Math.min(3, Z), s.dead ? 0.22 : 0.42);
    ctx.globalCompositeOperation = 'lighter';
    for (let p = 0; p < 40; p++) {
      const s = TREE.segs[Math.floor(rand(p, 630) * TREE.segs.length)];
      const ph = ((t * 0.5 + rand(p, 631)) % 1);
      const [ax, ay] = P(s.x0, s.y0), [bx, by] = P(s.x1, s.y1);
      const q = ph, mq = 1 - q;
      const x = mq * mq * mq * ax + 3 * mq * mq * q * ax + 3 * mq * q * q * bx + q * q * q * bx;
      const y = mq * mq * mq * ay + 3 * mq * mq * q * lerp(ay, by, 0.55) + 3 * mq * q * q * lerp(ay, by, 0.45) + q * q * q * by;
      glow(ctx, x, y, 5, [200, 230, 220], 0.5 * Math.sin(Math.PI * ph), 1);
    }
    for (const [x, y, isH] of TREE.tips) {
      const [sx, sy] = P(x, y);
      glow(ctx, sx, sy, isH ? 5 : 3, [220, 232, 226], isH ? 0.9 : 0.45, 1);
    }
    ctx.restore();
    const [hx, hy] = P(tip[0], tip[1]);
    ctx.save();
    ctx.strokeStyle = 'rgba(214,206,186,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU); ctx.stroke();
    ctx.font = `italic 18px ${LATIN}`; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(214,206,186,0.55)';
    ctx.fillText('Homo sapiens', hx, hy - 26);
    ctx.restore();
  };
})();
