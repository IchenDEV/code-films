// 第四幕 · 第三重：心智
(() => {
  // —— 显微镜下：高尔基染色的神经元 ——
  const AP = { x: CX - 210, y: 440, r: 350 };
  let field, AXON = [];
  INITS.push(() => {
    const S = AP.r * 2 + 40;
    field = makeCanvas(S, S);
    const x = field.getContext('2d');
    const lw = 220, img = x.createImageData(lw, lw), small = makeCanvas(lw, lw);
    for (let j = 0; j < lw; j++) for (let i = 0; i < lw; i++) {
      const d = Math.hypot(i - lw / 2, j - lw / 2) / (lw / 2);
      const n = 0.5 + 0.5 * fbm2(i / 30, j / 30, 701);
      const b = (1 - d * d * 0.55) * (0.82 + 0.18 * n);
      const p = (j * lw + i) * 4;
      img.data[p] = 218 * b; img.data[p + 1] = 168 * b; img.data[p + 2] = 92 * b; img.data[p + 3] = 255;
    }
    small.getContext('2d').putImageData(img, 0, 0);
    x.drawImage(small, 0, 0, S, S);
    let sd = 1;
    function branch(px, py, a, len, w, depth, col, seedBase) {
      const nx = px + Math.cos(a) * len, ny = py + Math.sin(a) * len;
      const mx = (px + nx) / 2 + (rand(sd, seedBase) - 0.5) * len * 0.4, my = (py + ny) / 2 + (rand(sd++, seedBase + 1) - 0.5) * len * 0.4;
      x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round';
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(mx, my, nx, ny); x.stroke();
      // 树突棘
      if (depth >= 2) for (let q = 0; q < 6; q++) {
        const u = rand(sd++, seedBase + 2), sx = lerp(px, nx, u), sy = lerp(py, ny, u), sa = a + (rand(sd++, seedBase + 3) < 0.5 ? 1.4 : -1.4);
        x.lineWidth = 0.8; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(sa) * 4, sy + Math.sin(sa) * 4); x.stroke();
      }
      if (depth >= 4 || w < 0.9) return;
      const n = rand(sd++, seedBase + 4) < 0.7 ? 2 : 1;
      for (let b = 0; b < n; b++) branch(nx, ny, a + (rand(sd++, seedBase + 5) - 0.5) * 1.3, len * (0.65 + rand(sd++, seedBase + 6) * 0.25), w * 0.68, depth + 1, col, seedBase);
    }
    function neuron(cx, cy, s, col, seedBase, axonA, main) {
      for (let d = 0; d < 7; d++) {
        const a = (d / 7) * TAU + rand(d, seedBase) * 0.6;
        if (Math.abs(((a - axonA + Math.PI * 3) % TAU) - Math.PI) < 0.5) continue;
        branch(cx, cy, a, 70 * s * (0.7 + rand(d, seedBase + 9) * 0.6), 5 * s, 0, col, seedBase + d * 10);
      }
      // 轴突：细长、少分支
      const pts = [[cx, cy]];
      let px = cx, py = cy, a = axonA;
      for (let i = 0; i < 40; i++) { a += (rand(i, seedBase + 50) - 0.5) * 0.25; px += Math.cos(a) * 16 * s; py += Math.sin(a) * 16 * s; pts.push([px, py]); }
      x.strokeStyle = col; x.lineWidth = 2 * s;
      x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
      x.fillStyle = col;
      x.beginPath();
      const sp = [];
      for (let i = 0; i < 9; i++) { const aa = (i / 9) * TAU; const r = 15 * s * (1 + 0.25 * noise1(i * 1.3, seedBase)); sp.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r * 1.2]); }
      splinePath(x, sp, true); x.fill();
      if (main) AXON = pts;
    }
    x.filter = 'blur(3px)';
    neuron(160, 520, 0.9, 'rgba(70,40,18,0.4)', 900, -0.4, false);
    neuron(560, 160, 0.8, 'rgba(70,40,18,0.35)', 940, 2.4, false);
    x.filter = 'blur(1.2px)';
    neuron(520, 560, 0.75, 'rgba(50,28,12,0.6)', 980, 3.6, false);
    x.filter = 'none';
    neuron(330, 330, 1.25, 'rgba(32,16,6,0.92)', 820, 0.95, true);
  });

  function micro(ctx, t, k) {
    const o = AP.r + 20;
    const drift = [noise1(t * 0.2, 711) * 6, noise1(t * 0.2, 712) * 6];
    ctx.save();
    ctx.globalAlpha = k;
    const r = AP.r * (0.9 + 0.1 * ease(t, 2.4, 4.0));
    ctx.beginPath(); ctx.arc(AP.x, AP.y, r, 0, TAU); ctx.save(); ctx.clip();
    ctx.drawImage(field, AP.x - o + drift[0], AP.y - o + drift[1]);
    const ox = AP.x - o + drift[0], oy = AP.y - o + drift[1];
    // 放电：从胞体沿轴突传出的亮点
    ctx.globalCompositeOperation = 'lighter';
    for (const sp of SPK) {
      const d = t - sp;
      if (d < 0 || d > 0.9) continue;
      const soma = AXON[0];
      glow(ctx, ox + soma[0], oy + soma[1], 70, [255, 240, 200], 0.6 * Math.exp(-d * 10));
      const idx = Math.min(AXON.length - 1, d * 60);
      const p = AXON[Math.floor(idx)];
      glow(ctx, ox + p[0], oy + p[1], 22, [255, 248, 220], 0.75 * (1 - d / 0.9));
    }
    ctx.globalCompositeOperation = 'source-over';
    // 电极：玻璃微管从右上方进入
    const ek = ease(t, 3.4, 4.6);
    if (ek > 0) {
      const tip = [ox + AXON[0][0] + 14, oy + AXON[0][1] - 10];
      const back = [tip[0] + 600, tip[1] - 520];
      const tx = lerp(back[0], tip[0], ek), ty = lerp(back[1], tip[1], ek);
      ctx.fillStyle = 'rgba(240,236,220,0.18)'; ctx.strokeStyle = 'rgba(20,14,8,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 640, ty - 520 - 26); ctx.lineTo(tx + 640, ty - 520 + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // 测量的网格逐渐覆盖
    const gk = ease(t, 6.0, 8.0);
    if (gk > 0) {
      ctx.strokeStyle = `rgba(30,18,8,${0.25 * gk})`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let g = -AP.r; g <= AP.r; g += 50) { ctx.moveTo(AP.x + g, AP.y - AP.r); ctx.lineTo(AP.x + g, AP.y + AP.r); ctx.moveTo(AP.x - AP.r, AP.y + g); ctx.lineTo(AP.x + AP.r, AP.y + g); }
      ctx.stroke();
    }
    ctx.restore();
    // 镜筒
    const rim = ctx.createRadialGradient(AP.x, AP.y, r * 0.8, AP.x, AP.y, r);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(AP.x, AP.y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,190,170,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(AP.x, AP.y, r + 6, 0, TAU); ctx.stroke();
    // 十字与比例尺
    ctx.strokeStyle = 'rgba(220,210,190,0.35)';
    ctx.beginPath();
    ctx.moveTo(AP.x - 16, AP.y); ctx.lineTo(AP.x + 16, AP.y); ctx.moveTo(AP.x, AP.y - 16); ctx.lineTo(AP.x, AP.y + 16);
    ctx.moveTo(AP.x - 220, AP.y + 250); ctx.lineTo(AP.x - 120, AP.y + 250);
    ctx.stroke();
    ctx.font = `14px ${MONO}`; ctx.fillStyle = 'rgba(220,210,190,0.5)'; ctx.textAlign = 'center';
    ctx.fillText('50 μm', AP.x - 170, AP.y + 270);
    ctx.restore();
  }

  // 示波器与读数
  function scope(ctx, t, k) {
    const x0 = 1330, x1 = 1800, y0 = 250, y1 = 470, win2 = 2.4;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.strokeStyle = 'rgba(200,214,232,0.18)'; ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.beginPath();
    for (let g = 1; g < 6; g++) { const gx = lerp(x0, x1, g / 6); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); }
    for (let g = 1; g < 4; g++) { const gy = lerp(y0, y1, g / 4); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); }
    ctx.strokeStyle = 'rgba(200,214,232,0.06)'; ctx.stroke();
    const vm = (tt) => {
      let v = -70 + noise1(tt * 40, 720) * 1.6;
      for (const sp of SPK) {
        const d = tt - sp;
        if (d < -0.02 || d > 0.2) continue;
        v += 100 * Math.exp(-((d / 0.006) ** 2)) - 12 * Math.exp(-(((d - 0.04) / 0.035) ** 2));
      }
      return v;
    };
    ctx.beginPath();
    for (let i = 0; i <= 600; i++) {
      const tt = t - win2 + (i / 600) * win2;
      const y = lerp(y1 - 20, y0 + 20, (vm(tt) + 85) / 125);
      i ? ctx.lineTo(lerp(x0, x1, i / 600), y) : ctx.moveTo(x0, y);
    }
    ctx.strokeStyle = 'rgba(214,236,255,0.85)'; ctx.lineWidth = 1.4;
    ctx.shadowColor = 'rgba(160,210,255,0.8)'; ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const n = SPK.filter((s) => s <= t).length;
    ctx.font = `15px ${MONO}`; ctx.fillStyle = 'rgba(200,214,232,0.62)'; ctx.textAlign = 'left';
    const rows = [
      ['Vm', `${vm(t).toFixed(1)} mV`, 4.0],
      ['spikes', `${n}`, 4.6],
      ['rate', `${(SPK.filter((s) => s <= t && s > t - 2).length / 2).toFixed(1)} Hz`, 5.2],
      ['t', `${(t - 3.4).toFixed(3)} s`, 5.8],
      ['ch', '01 · 20 kHz · Ag/AgCl', 6.4],
      ['model', 'Hodgkin–Huxley · fit 0.97', 7.0],
    ];
    rows.forEach(([a, b, ts], i) => {
      const rk = ease(t, ts, ts + 0.6);
      if (rk <= 0) return;
      ctx.globalAlpha = k * rk;
      ctx.fillText(a, x0, y1 + 44 + i * 28);
      ctx.fillText(b, x0 + 110, y1 + 44 + i * 28);
    });
    ctx.restore();
  }


  const STEEL_C = '200,214,232';
  const st = (a) => `rgba(${STEEL_C},${a})`;
  let pcb, HANDIMG, TRACES = [];

  INITS.push(() => {
    // 电路：正交与 45° 走线
    pcb = makeCanvas();
    const x = pcb.getContext('2d');
    x.lineCap = 'round'; x.lineJoin = 'round';
    const dirs = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]];
    for (let i = 0; i < 90; i++) {
      let px = Math.round(rand(i, 800) * 48) * 40, py = Math.round(rand(i, 801) * 27) * 40;
      let d = Math.floor(rand(i, 802) * 4) * 2;
      const pts = [[px, py]];
      for (let s = 0; s < 8; s++) {
        const len = (2 + Math.floor(rand(i * 9 + s, 803) * 6)) * 40;
        px += dirs[d][0] * len; py += dirs[d][1] * len; pts.push([px, py]);
        d = (d + (rand(i * 9 + s, 804) < 0.5 ? 1 : 7)) % 8;
        if (d % 2 === 1 && rand(i * 9 + s, 805) < 0.5) d = (d + 1) % 8;
      }
      TRACES.push(pts);
      x.strokeStyle = st(0.22); x.lineWidth = 2;
      x.beginPath(); pts.forEach((p, q) => (q ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
      for (const p of [pts[0], pts.at(-1)]) { x.beginPath(); x.arc(p[0], p[1], 5, 0, TAU); x.stroke(); }
    }
    for (let c = 0; c < 7; c++) {
      const cx = 200 + rand(c, 806) * 1500, cy = 150 + rand(c, 807) * 750, w = 120 + rand(c, 808) * 140;
      x.fillStyle = '#05070a'; x.strokeStyle = st(0.35); x.lineWidth = 1.2;
      x.fillRect(cx, cy, w, w * 0.7); x.strokeRect(cx, cy, w, w * 0.7);
      x.beginPath();
      for (let p = 0; p < w; p += 14) { x.moveTo(cx + p + 7, cy); x.lineTo(cx + p + 7, cy - 10); x.moveTo(cx + p + 7, cy + w * 0.7); x.lineTo(cx + p + 7, cy + w * 0.7 + 10); }
      x.stroke();
    }
    // 手印，用作“图像”
    HANDIMG = makeCanvas(256, 256);
    const h = HANDIMG.getContext('2d');
    const g = h.createRadialGradient(128, 120, 10, 128, 120, 150);
    g.addColorStop(0, 'rgb(170,60,34)'); g.addColorStop(0.6, 'rgb(120,52,34)'); g.addColorStop(1, 'rgb(70,50,40)');
    h.fillStyle = g; h.fillRect(0, 0, 256, 256);
    h.fillStyle = h.strokeStyle = 'rgb(196,170,140)';
    fillHand(h, 128, 160, 86, -0.08, 1.15);
  });

  // —— 各个机械与符号的画面 ——
  function gear(ctx, x, y, R, N, a, al) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const b = a + (i / N) * TAU, s = TAU / N;
      const pts = [[R - 12, b], [R - 12, b + s * 0.18], [R + 12, b + s * 0.3], [R + 12, b + s * 0.55], [R - 12, b + s * 0.68]];
      pts.forEach(([r, aa], q) => (i === 0 && q === 0 ? ctx.moveTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r) : ctx.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r)));
    }
    ctx.closePath();
    ctx.strokeStyle = st(0.75 * al); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.24, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 5; k++) { const aa = a + (k / 5) * TAU; ctx.moveTo(x + Math.cos(aa) * R * 0.3, y + Math.sin(aa) * R * 0.3); ctx.lineTo(x + Math.cos(aa) * (R - 24), y + Math.sin(aa) * (R - 24)); }
    ctx.strokeStyle = st(0.3 * al); ctx.stroke();
  }
  function link(ctx, ax, ay, bx, by, w, al) {
    const a = Math.atan2(by - ay, bx - ax), L = Math.hypot(bx - ax, by - ay);
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.strokeStyle = st(0.75 * al); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-w / 2, -w / 2, L + w, w, w / 2); ctx.stroke();
    ctx.strokeStyle = st(0.25 * al);
    ctx.beginPath(); ctx.moveTo(w * 0.6, 0); ctx.lineTo(L - w * 0.6, 0); ctx.stroke();
    for (const px of [0, L]) { ctx.beginPath(); ctx.arc(px, 0, w * 0.32, 0, TAU); ctx.strokeStyle = st(0.75 * al); ctx.stroke(); }
    ctx.restore();
  }

  const DRAW = {
    arm(ctx, lt, d, sp) {
      const k = d > 1.5 ? ease(lt, 0.5, 1.3) : 1;
      if (k < 1) drawBones(ctx, LIMB_DATA.human, CX, CY - 40, 0.82, 1 - k, '#05070a');
      const sh = [CX - 400, CY - 40];
      const a1 = k * (Math.sin(lt * 1.6 * sp) * 0.35 - 0.25), a2 = k * (Math.sin(lt * 2.1 * sp + 1) * 0.6 + 0.4);
      const el = [sh[0] + Math.cos(a1) * 330, sh[1] + Math.sin(a1) * 330];
      const wr = [el[0] + Math.cos(a1 + a2) * 280, el[1] + Math.sin(a1 + a2) * 280];
      if (k > 0) {
        link(ctx, sh[0], sh[1], el[0], el[1], 54, k);
        link(ctx, el[0], el[1], wr[0], wr[1], 40, k);
        const ga = a1 + a2, open = 0.3 + 0.25 * Math.sin(lt * 3 * sp);
        for (const s of [-1, 1]) {
          const b = [wr[0] + Math.cos(ga + s * open) * 90, wr[1] + Math.sin(ga + s * open) * 90];
          link(ctx, wr[0], wr[1], b[0], b[1], 16, k);
        }
        ctx.strokeStyle = st(0.5 * k);
        ctx.beginPath(); ctx.roundRect(sh[0] - 70, sh[1] + 40, 140, 300, 8); ctx.stroke();
      }
    },
    gears(ctx, lt, d, sp) {
      const a = lt * 0.9 * sp;
      gear(ctx, CX - 170, CY - 20, 230, 28, a, 1);
      gear(ctx, CX - 170 + 230 + 128, CY - 20, 128, 16, -a * 28 / 16 + Math.PI / 16, 1);
      gear(ctx, CX - 170 + 230 + 128 + 128 + 70 - 10, CY - 20 - 90, 76, 10, a * 28 / 10, 1);
    },
    leg(ctx, lt, d, sp) {
      const k = d > 1.2 ? ease(lt, d * 0.35, d * 0.7) : 1;
      const ph = lt * 4 * sp;
      // 走路的腿
      if (k < 1) {
        const hip = [CX - 60, CY - 200];
        const th = Math.sin(ph) * 0.45, kn = Math.max(0, Math.sin(ph + 1.4)) * 0.9;
        const knee = [hip[0] + Math.sin(th) * 240, hip[1] + Math.cos(th) * 240];
        const ank = [knee[0] + Math.sin(th - kn) * 230, knee[1] + Math.cos(th - kn) * 230];
        drawBones(ctx, [[hip[0], hip[1], knee[0], knee[1], 26], [knee[0], knee[1], ank[0], ank[1], 20], [ank[0], ank[1], ank[0] + 80, ank[1] + 10, 14]], 0, 0, 1, 1 - k, '#05070a');
      }
      if (k > 0) {
        const R = 230, c = [CX, CY - 10], rot = ph * 0.6;
        ctx.strokeStyle = st(0.75 * k); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(c[0], c[1], R - 16, 0, TAU); ctx.stroke();
        ctx.beginPath();
        for (let s = 0; s < 14; s++) { const a = rot + (s / 14) * TAU; ctx.moveTo(c[0] + Math.cos(a) * 26, c[1] + Math.sin(a) * 26); ctx.lineTo(c[0] + Math.cos(a) * (R - 16), c[1] + Math.sin(a) * (R - 16)); }
        ctx.strokeStyle = st(0.4 * k); ctx.stroke();
        ctx.beginPath(); ctx.arc(c[0], c[1], 26, 0, TAU); ctx.stroke();
      }
      // 地面向后流动
      ctx.strokeStyle = st(0.35); ctx.beginPath(); ctx.moveTo(0, CY + 222); ctx.lineTo(W, CY + 222); ctx.stroke();
      ctx.beginPath();
      for (let x = -((ph * 60) % 80); x < W; x += 80) { ctx.moveTo(x, CY + 222); ctx.lineTo(x - 18, CY + 240); }
      ctx.strokeStyle = st(0.18); ctx.stroke();
    },
    crank(ctx, lt, d, sp) {
      const a = lt * 6 * sp, c = [CX - 330, CY - 20], r = 120, L = 420;
      gear(ctx, c[0], c[1], 200, 36, a * 0.2, 0.5);
      const pin = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
      const px = pin[0] + Math.sqrt(L * L - (pin[1] - c[1]) ** 2);
      link(ctx, c[0], c[1], pin[0], pin[1], 34, 1);
      link(ctx, pin[0], pin[1], px, c[1], 26, 1);
      ctx.strokeStyle = st(0.7); ctx.lineWidth = 1.4;
      ctx.strokeRect(c[0] + L - r - 40, c[1] - 74, 2 * r + 220, 148);
      ctx.fillStyle = '#05070a'; ctx.fillRect(px - 10, c[1] - 66, 110, 132); ctx.strokeRect(px - 10, c[1] - 66, 110, 132);
      // 燃烧室的闪光
      const fire = Math.max(0, Math.cos(a)) ** 8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, c[0] + L + r + 160, c[1], 120, [255, 170, 90], fire * 0.6);
      ctx.restore();
    },
    digits(ctx, lt, d, sp) {
      const p = lt / d;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (p < 0.4 || d < 1) {
        // 手写的算术
        ctx.font = `italic 64px ${LATIN}`;
        const rows = ['3 7 4 9', '× 2 0 6 1', '7 7 2 6 6 8 9'];
        rows.forEach((r, i) => {
          const a = ease(lt, i * 0.18, i * 0.18 + 0.3);
          ctx.fillStyle = `rgba(226,214,190,${0.8 * a})`;
          ctx.textAlign = 'right'; ctx.fillText(r, CX + 220, CY - 140 + i * 110);
        });
        ctx.strokeStyle = 'rgba(226,214,190,0.6)';
        ctx.beginPath(); ctx.moveTo(CX - 260, CY + 20); ctx.lineTo(CX + 220, CY + 20); ctx.stroke();
      } else if (p < 0.72) {
        // 数字轮
        ctx.font = `20px ${MONO}`;
        for (let w = 0; w < 6; w++) {
          const x = CX - 450 + w * 180, y = CY - 20, r = 76;
          const val = Math.floor(lt * sp * 4 / Math.pow(4, 5 - w)) % 10 + (lt * sp * 4 / Math.pow(4, 5 - w)) % 1 * (w === 5 ? 1 : 0);
          gear(ctx, x, y, r, 10, -val / 10 * TAU, 0.6);
          for (let n = 0; n < 10; n++) {
            const a = -val / 10 * TAU + (n / 10) * TAU - Math.PI / 2;
            ctx.fillStyle = st(n === Math.round(val) % 10 ? 0.9 : 0.35);
            ctx.fillText(String(n), x + Math.cos(a) * (r - 34), y + Math.sin(a) * (r - 34));
          }
        }
      } else {
        ctx.font = `30px ${MONO}`;
        for (let r = 0; r < 9; r++) {
          let s = '';
          for (let c = 0; c < 32; c++) s += rand(r * 40 + c, Math.floor(lt * 14 * sp)) < 0.5 ? '0' : '1';
          ctx.fillStyle = st(0.25 + 0.5 * (r === 4));
          ctx.fillText(s, CX, CY - 260 + r * 56);
        }
      }
      ctx.restore();
    },
    punch(ctx, lt, d, sp) {
      const cw = 1300, ch = 520, x0 = CX - cw / 2 - lt * 60, y0 = CY - ch / 2 - 30;
      ctx.strokeStyle = st(0.6); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x0 + 30, y0); ctx.lineTo(x0 + cw, y0); ctx.lineTo(x0 + cw, y0 + ch); ctx.lineTo(x0, y0 + ch); ctx.lineTo(x0, y0 + 30); ctx.closePath(); ctx.stroke();
      const cols = 64, rowsN = 12, n = Math.floor(ease(lt, 0, d * 0.9) * cols);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rowsN; r++) {
        const x = x0 + 40 + c * 19.5, y = y0 + 40 + r * 38;
        const punched = c < n && rand(c * 13 + r, 820) < 0.22;
        ctx.fillStyle = punched ? st(0.85) : st(0.08);
        ctx.fillRect(x, y, 8, 20);
      }
    },
    language(ctx, lt, d, sp, t) {
      const txt = TL.subs.map((c) => c.text).join(TL.lang === 'zh' ? '' : ' ');
      const chars = [...txt];
      ctx.save();
      ctx.font = `30px ${SERIF}`; ctx.textBaseline = 'middle';
      for (let r = 0; r < 12; r++) {
        const y = 110 + r * 58, speed = (40 + rand(r, 830) * 120) * sp, off = (lt * speed + rand(r, 831) * 900) % 48;
        const base = Math.floor((lt * speed + rand(r, 831) * 900) / 48);
        for (let c = -1; c < 42; c++) {
          const ch = chars[(base + c + r * 17) % chars.length];
          const hl = rand(base + c, r + 840) < 0.06;
          ctx.fillStyle = hl ? 'rgba(236,230,214,0.85)' : `rgba(${STEEL_C},${0.12 + 0.1 * (r % 3 === 1)})`;
          const x = 40 + c * 48 - off;
          ctx.fillText(ch, x, y);
          if (hl) { ctx.strokeStyle = 'rgba(236,230,214,0.3)'; ctx.strokeRect(x - 4, y - 20, 40, 40); }
        }
      }
      ctx.restore();
    },
    image(ctx, lt, d, sp) {
      const steps = [4, 8, 16, 32, 64, 256];
      const i = Math.min(steps.length - 1, Math.floor((lt / Math.max(0.3, d)) * steps.length * 1.1));
      const n = steps[i], S = 600;
      const tmp = makeCanvas(n, n), tx = tmp.getContext('2d');
      tx.drawImage(HANDIMG, 0, 0, n, n);
      ctx.save();
      ctx.imageSmoothingEnabled = n >= 256;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(tmp, CX - S / 2, CY - S / 2 - 50, S, S);
      ctx.globalAlpha = 1;
      if (n <= 32) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let g = 0; g <= n; g++) { const p = (g / n) * S; ctx.moveTo(CX - S / 2 + p, CY - S / 2 - 50); ctx.lineTo(CX - S / 2 + p, CY + S / 2 - 50); ctx.moveTo(CX - S / 2, CY - S / 2 - 50 + p); ctx.lineTo(CX + S / 2, CY - S / 2 - 50 + p); }
        ctx.stroke();
      }
      ctx.font = `16px ${MONO}`; ctx.fillStyle = st(0.5);
      ctx.fillText(`${n} × ${n}`, CX + S / 2 + 20, CY + S / 2 - 50);
      ctx.restore();
    },
    code(ctx, lt, d, sp) {
      const lines = [
        'def step(x, h):', '    q, k, v = W_q @ x, W_k @ h, W_v @ h', '    a = softmax(q @ k.T / sqrt(d))',
        '    return a @ v', '', 'for t in range(T):', '    h = layer_norm(h + attn(h))', '    h = layer_norm(h + mlp(h))',
        '    p = softmax(W_out @ h[-1])', '    x = sample(p, temperature=0.8)', '    tokens.append(x)', '',
        'loss = -log(p[target]).mean()', 'loss.backward()', 'opt.step()', '',
      ];
      ctx.save();
      ctx.font = `26px ${MONO}`; ctx.textBaseline = 'middle';
      const scroll = lt * 70 * sp;
      for (let i = 0; i < 26; i++) {
        const li = i + Math.floor(scroll / 40), y = 120 + i * 40 - (scroll % 40);
        if (y > H * 0.74) break;
        const s = lines[li % lines.length];
        const kw = /^(\s*)(def|for|return)/.test(s);
        ctx.fillStyle = kw ? 'rgba(236,230,214,0.8)' : st(0.5);
        ctx.fillText(String(li + 1).padStart(3, ' '), 520, y);
        ctx.fillText(s, 600, y);
      }
      ctx.restore();
    },
  };


  // 一台笔记本电脑：屏幕盖、边框与摄像头、金属边缘、转轴、透视的键盘面
  const LID = { x: CX - 540, y: 110, w: 1080, h: 640, r: 26 };
  const SCR = { x: LID.x + 24, y: LID.y + 28, w: LID.w - 48, h: LID.h - 60 };

  function typedText(item, t) {
    let s = '';
    for (const c of item.chars) if (c.t <= t) s += c.ch;
    return s;
  }

  function laptop(ctx, lit) {
    // 键盘面（梯形透视）
    const y0 = LID.y + LID.h + 8, y1 = y0 + 160;
    const tl = LID.x - 16, tr = LID.x + LID.w + 16, bl = LID.x - 170, br = LID.x + LID.w + 170;
    const xAt = (v, side) => (side < 0 ? lerp(tl, bl, v) : lerp(tr, br, v));
    const deck = ctx.createLinearGradient(0, y0, 0, y1);
    deck.addColorStop(0, `rgb(${24 + 34 * lit},${26 + 37 * lit},${30 + 42 * lit})`);
    deck.addColorStop(1, 'rgb(9,10,12)');
    ctx.fillStyle = deck;
    ctx.beginPath(); ctx.moveTo(tl, y0); ctx.lineTo(tr, y0); ctx.lineTo(br, y1); ctx.lineTo(bl, y1); ctx.closePath(); ctx.fill();
    // 前沿的金属倒角
    ctx.strokeStyle = `rgba(200,214,232,${0.16 + 0.12 * lit})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bl, y1); ctx.lineTo(br, y1); ctx.stroke();
    ctx.fillStyle = 'rgb(6,7,8)';
    ctx.beginPath(); ctx.moveTo(bl, y1); ctx.lineTo(br, y1); ctx.lineTo(br - 6, y1 + 12); ctx.lineTo(bl + 6, y1 + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(200,214,232,${0.07 + 0.08 * lit})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tl, y0); ctx.lineTo(bl, y1); ctx.moveTo(tr, y0); ctx.lineTo(br, y1); ctx.stroke();
    // 键位
    const rows = 5, cols = 14;
    for (let r = 0; r < rows; r++) {
      const va = 0.07 + (r / rows) * 0.5, vb = va + 0.5 / rows * 0.78;
      const ya = lerp(y0, y1, va), yb = lerp(y0, y1, vb);
      const ra = [xAt(va, -1) + 120 * (1 + va), xAt(va, 1) - 120 * (1 + va)], rb = [xAt(vb, -1) + 120 * (1 + vb), xAt(vb, 1) - 120 * (1 + vb)];
      const keys = r === rows - 1 ? [[0, 0.12], [0.13, 0.25], [0.26, 0.74], [0.75, 0.87], [0.88, 1]] : [...Array(cols).keys()].map((i) => [i / cols, (i + 0.86) / cols]);
      for (const [u0, u1] of keys) {
        const p = [[lerp(ra[0], ra[1], u0), ya], [lerp(ra[0], ra[1], u1), ya], [lerp(rb[0], rb[1], u1), yb], [lerp(rb[0], rb[1], u0), yb]];
        ctx.fillStyle = 'rgb(7,8,10)';
        ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(200,214,232,${(0.05 + 0.1 * lit) * (1 - r * 0.12)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.stroke();
      }
    }
    // 触控板
    const ta = 0.66, tb = 0.95, tw0 = 0.2, tw1 = 0.23;
    const tp = [[lerp(xAt(ta, -1), xAt(ta, 1), 0.5 - tw0), lerp(y0, y1, ta)], [lerp(xAt(ta, -1), xAt(ta, 1), 0.5 + tw0), lerp(y0, y1, ta)],
      [lerp(xAt(tb, -1), xAt(tb, 1), 0.5 + tw1), lerp(y0, y1, tb)], [lerp(xAt(tb, -1), xAt(tb, 1), 0.5 - tw1), lerp(y0, y1, tb)]];
    ctx.strokeStyle = `rgba(200,214,232,${0.08 + 0.08 * lit})`;
    ctx.beginPath(); tp.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.stroke();
    // 转轴
    const hg = ctx.createLinearGradient(0, LID.y + LID.h - 2, 0, y0 + 2);
    hg.addColorStop(0, 'rgb(14,15,17)'); hg.addColorStop(1, 'rgb(4,4,5)');
    ctx.fillStyle = hg; ctx.fillRect(LID.x + 50, LID.y + LID.h - 2, LID.w - 100, y0 - LID.y - LID.h + 4);
    // 屏幕盖：外壳、金属边缘、边框、摄像头
    ctx.fillStyle = 'rgb(8,9,11)';
    ctx.beginPath(); ctx.roundRect(LID.x, LID.y, LID.w, LID.h, LID.r); ctx.fill();
    const rim = ctx.createLinearGradient(0, LID.y, 0, LID.y + LID.h);
    rim.addColorStop(0, `rgba(210,222,238,${0.22 + 0.15 * lit})`); rim.addColorStop(0.5, `rgba(200,214,232,${0.08 + 0.06 * lit})`); rim.addColorStop(1, `rgba(200,214,232,${0.18 + 0.1 * lit})`);
    ctx.strokeStyle = rim; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(LID.x, LID.y, LID.w, LID.h, LID.r); ctx.stroke();
    ctx.fillStyle = 'rgb(3,3,4)';
    ctx.beginPath(); ctx.roundRect(LID.x + 6, LID.y + 6, LID.w - 12, LID.h - 12, LID.r - 5); ctx.fill();
    ctx.fillStyle = 'rgb(20,22,25)';
    ctx.beginPath(); ctx.arc(CX, LID.y + 15, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(90,120,150,${0.35 + 0.2 * lit})`;
    ctx.beginPath(); ctx.arc(CX, LID.y + 15, 1.4, 0, TAU); ctx.fill();
  }

  // answer=false：冷开场只有提问，没有回答
  function screen(ctx, t, k, answer = true) {
    const push = 1 + ease(t, 0, 20) * 0.06;
    const lit = 0.55 + 0.45 * k;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
    // 屏幕光漏进房间，照亮桌面
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, CX, LID.y + LID.h * 0.5, 1150, [150, 175, 210], 0.11);
    glow(ctx, CX, LID.y + LID.h + 120, 700, [150, 175, 210], 0.06);
    ctx.restore();
    laptop(ctx, lit);
    const bg = ctx.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h);
    bg.addColorStop(0, '#11141a'); bg.addColorStop(1, '#0b0d11');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 6); ctx.fill();
    const q = TYPING[0], r1 = TYPING[1], r2 = TYPING[2];
    let fs = 34;
    ctx.font = `${fs}px ${SANS}`; ctx.letterSpacing = TL.lang === 'zh' ? '0.06em' : '0.01em';
    if (r1) while (ctx.measureText(r1.text).width > SCR.w - 170 && fs > 22) { fs -= 1; ctx.font = `${fs}px ${SANS}`; }
    ctx.textBaseline = 'middle';
    // 提问：右侧气泡
    const qs = typedText(q, t);
    const tw = ctx.measureText(q.text).width;
    if (qs) {
      ctx.fillStyle = 'rgba(200,214,232,0.08)';
      ctx.beginPath(); ctx.roundRect(SCR.x + SCR.w - 80 - tw - 36, SCR.y + 86, tw + 48, 64, 14); ctx.fill();
      ctx.fillStyle = 'rgba(214,220,228,0.82)'; ctx.textAlign = 'left';
      ctx.fillText(qs, SCR.x + SCR.w - 80 - tw - 12, SCR.y + 118);
    }
    const typingQ = t >= q.chars[0].t - 0.6 && t <= q.chars.at(-1).t + 0.05;
    let cx = null, cy = null;
    if (typingQ) { cx = SCR.x + SCR.w - 80 - tw - 12 + ctx.measureText(qs).width + 4; cy = SCR.y + 118; }
    if (answer && r1) {
      const lines = [typedText(r1, t), typedText(r2, t)];
      ctx.fillStyle = 'rgba(236,232,222,0.92)'; ctx.textAlign = 'left';
      lines.forEach((s, i) => s && ctx.fillText(s, SCR.x + 80, SCR.y + 240 + i * 68));
      if (!typingQ && t > q.chars.at(-1).t) {
        const second = t >= r2.chars[0].t - 0.4;
        cx = SCR.x + 80 + ctx.measureText(lines[second ? 1 : 0]).width + 6; cy = SCR.y + 240 + (second ? 68 : 0);
      }
    } else if (!typingQ && t > q.chars.at(-1).t) { cx = SCR.x + 80; cy = SCR.y + 240; } // 等待回答
    const typingNow = [q, r1, r2].some((it) => it && t >= it.chars[0].t && t <= it.chars.at(-1).t + 0.05);
    if (cx !== null && (Math.floor(t * 1.8) % 2 === 0 || typingNow)) {
      ctx.fillStyle = 'rgba(236,232,222,0.75)';
      ctx.fillRect(cx, cy - 17, 3, 34);
    }
    // 玻璃反光
    const gl = ctx.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w, SCR.y + SCR.h);
    gl.addColorStop(0, 'rgba(255,255,255,0.03)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0.012)');
    ctx.fillStyle = gl; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    ctx.restore();
  }

  let SPK = [], TYPING = [];
  function sparks(ctx, u, cuts) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const m of cuts) {
      const dt = u - m.t;
      if (dt < 0 || dt > 0.9) continue;
      const ox = W * (0.25 + rand(m.t * 10, 850) * 0.5), oy = H * (0.35 + rand(m.t * 10, 851) * 0.3);
      glow(ctx, ox, oy, 260, [190, 220, 255], 0.45 * Math.exp(-dt * 14));
      for (let i = 0; i < 40; i++) {
        const a = -Math.PI / 2 + (rand(i, m.t * 7) - 0.5) * 3.2, v = 300 + rand(i, m.t * 7 + 1) * 700;
        const x = ox + Math.cos(a) * v * dt, y = oy + Math.sin(a) * v * dt + 900 * dt * dt;
        const vx = Math.cos(a) * v, vy = Math.sin(a) * v + 1800 * dt;
        const life = 0.4 + rand(i, m.t * 7 + 2) * 0.5;
        if (dt > life) continue;
        const k = 1 - dt / life;
        ctx.strokeStyle = `rgba(255,${200 + 55 * k},${140 + 100 * k},${k})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.02, y - vy * 0.02); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function montage(ctx, u, dur, cuts, speedBase) {
    let m = null, next = null;
    for (let i = 0; i < cuts.length; i++) if (cuts[i].t <= u) { m = cuts[i]; next = cuts[i + 1]; }
    if (!m) return;
    const d = (next ? next.t : dur) - m.t, lt = u - m.t;
    const sp = speedBase + u / 4;
    ctx.save();
    const kick = 1 + 0.04 * Math.exp(-lt * 6);
    ctx.translate(CX, CY); ctx.scale(kick, kick); ctx.translate(-CX, -CY);
    DRAW[m.kind](ctx, lt, d, sp, u);
    ctx.restore();
  }

  SHOT.descartes = (ctx, u, dur, sh) => {
    kenburns(ctx, 'descartes', u / dur, [0.5, 0.5, 1.0], [0.3, 0.3, 0.55], { vig: 0.7 });
    const k = win(u, sh.d2 - 0.2, sh.d3 + 0.5, 0.8, 0.8);
    if (k > 0) {
      ctx.save();
      ctx.font = `italic 46px ${LATIN}`; ctx.textAlign = 'right'; ctx.letterSpacing = '0.06em';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(236,226,204,${0.85 * k})`;
      ctx.fillText('Cogito, ergo sum.', W - 150, H - 230);
      ctx.restore();
    }
  };

  SHOT.neurons = (ctx, u, dur, sh) => {
    SPK = sh.spikes;
    const ak = 1 - ease(u, 2.6, 3.6);
    if (ak > 0) kenburns(ctx, 'purkinje', u / 3.6, [0.5, 0.45, 0.95], [0.5, 0.35, 0.62], { alpha: ak, filter: 'brightness(0.85)' });
    const mk = ease(u, 2.4, 3.8);
    if (mk > 0) { micro(ctx, u, mk); scope(ctx, u, mk * ease(u, 3.8, 4.6)); }
  };

  SHOT.machines = (ctx, u, dur, sh) => {
    // 电路先闪过一下，然后机械蒙太奇
    const pk = 1 - ease(u, 0.6, 1.1);
    if (pk > 0) {
      ctx.save(); ctx.globalAlpha = pk; ctx.drawImage(pcb, 0, 0); ctx.restore();
    }
    montage(ctx, u, dur, sh.cuts, 1.2);
    sparks(ctx, u, sh.cuts);
  };

  SHOT.streams = (ctx, u, dur, sh) => {
    montage(ctx, u, dur, sh.cuts, 2);
    const over = ease(u, dur - 1.8, dur);
    if (over > 0) { ctx.fillStyle = `rgba(226,234,246,${over * 0.6})`; ctx.fillRect(0, 0, W, H); }
  };

  // 图灵的提问：打字机逐字敲出
  const TURING = ['I PROPOSE TO CONSIDER THE QUESTION,', '"CAN MACHINES THINK?"'];
  SHOT.turing = (ctx, u, dur, sh) => {
    ctx.save();
    const g = ctx.createRadialGradient(CX, CY, 100, CX, CY, 900);
    g.addColorStop(0, 'rgb(24,22,19)'); g.addColorStop(1, 'rgb(4,4,4)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.font = `40px ${TYPEWRITER}`; ctx.textBaseline = 'middle'; ctx.letterSpacing = '0.04em';
    const t0 = Math.max(0.3, (sh.d6 ?? 0.5) - 0.2), step = 0.045;
    let n = Math.floor((u - t0) / step);
    TURING.forEach((line, i) => {
      const shown = line.slice(0, clamp(n, 0, line.length));
      n -= line.length + 6;
      const x = CX - 470, y = CY - 60 + i * 80;
      ctx.fillStyle = 'rgba(232,224,206,0.9)';
      ctx.fillText(shown, x, y);
    });
    const k = ease(u, dur - 2.6, dur - 1.6);
    ctx.font = `20px ${TYPEWRITER}`; ctx.fillStyle = `rgba(232,224,206,${0.55 * k})`;
    ctx.fillText('A. M. TURING, 1950', CX - 470, CY + 120);
    ctx.restore();
  };

  // 国际象棋
  const CHESS = (() => {
    // 一个中局局面：只作示意
    const rows = ['r....rk.', 'pp..qppp', '..p.pn..', '...p....', '..PP.B..', '..N.P...', 'PP..QPPP', 'R....RK.'];
    const pcs = [];
    rows.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && pcs.push({ c, x, y })));
    return pcs;
  })();
  const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟', K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' };
  SHOT.chess = (ctx, u, dur) => {
    const s = 86, x0 = CX - 4 * s, y0 = CY - 4 * s + 30;
    const rot = 1 + ease(u, 0, dur) * 0.05;
    ctx.save();
    ctx.translate(CX, CY); ctx.scale(rot, rot); ctx.translate(-CX, -CY);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 ? 'rgba(200,214,232,0.08)' : 'rgba(200,214,232,0.02)';
      ctx.fillRect(x0 + x * s, y0 + y * s, s, s);
    }
    ctx.strokeStyle = 'rgba(200,214,232,0.35)'; ctx.strokeRect(x0, y0, 8 * s, 8 * s);
    ctx.font = `64px "DejaVu Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 一步棋：白马跳出
    const mv = easeInOut(ramp(u, 1.4, 2.4));
    for (const p of CHESS) {
      let px = p.x, py = p.y;
      if (p.c === 'N' && p.x === 2 && p.y === 5) { px = lerp(2, 3, mv); py = lerp(5, 3, mv); }
      const white = p.c === p.c.toUpperCase();
      ctx.fillStyle = white ? 'rgba(236,232,222,0.9)' : 'rgba(150,160,175,0.85)';
      ctx.fillText(GLYPH[p.c], x0 + (px + 0.5) * s, y0 + (py + 0.56) * s);
    }
    const hk = ease(u, 2.3, 2.9);
    if (hk > 0) { ctx.strokeStyle = `rgba(236,226,204,${0.6 * hk})`; ctx.lineWidth = 2; ctx.strokeRect(x0 + 3 * s + 4, y0 + 3 * s + 4, s - 8, s - 8); }
    ctx.restore();
  };

  // 围棋：第 37 手
  const GO = (() => {
    const st = [];
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 36; i++) {
      const cx = r() < 0.5 ? 3 + Math.floor(r() * 4) : 12 + Math.floor(r() * 4), cy = r() < 0.5 ? 2 + Math.floor(r() * 5) : 12 + Math.floor(r() * 5);
      if (!st.some((q) => q.x === cx && q.y === cy)) st.push({ x: cx, y: cy, b: i % 2 === 0 });
    }
    return st;
  })();
  SHOT.go = (ctx, u, dur, sh) => {
    const s = 41, n = 19, x0 = CX - 9 * s, y0 = CY - 9 * s + 40;
    const push = 1 + ease(u, 0, dur) * 0.06;
    ctx.save();
    ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
    ctx.fillStyle = 'rgba(170,140,90,0.13)'; ctx.fillRect(x0 - s * 0.7, y0 - s * 0.7, s * 19.4, s * 19.4);
    ctx.strokeStyle = 'rgba(214,190,150,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { ctx.moveTo(x0, y0 + i * s); ctx.lineTo(x0 + 18 * s, y0 + i * s); ctx.moveTo(x0 + i * s, y0); ctx.lineTo(x0 + i * s, y0 + 18 * s); }
    ctx.stroke();
    for (const [x, y] of [[3, 3], [9, 3], [15, 3], [3, 9], [9, 9], [15, 9], [3, 15], [9, 15], [15, 15]]) { ctx.fillStyle = 'rgba(214,190,150,0.6)'; ctx.beginPath(); ctx.arc(x0 + x * s, y0 + y * s, 3.5, 0, TAU); ctx.fill(); }
    const nShow = Math.floor(ease(u, 0, 2.2) * GO.length);
    const stone = (x, y, b, a = 1) => {
      const g = ctx.createRadialGradient(x0 + x * s - 6, y0 + y * s - 6, 2, x0 + x * s, y0 + y * s, s * 0.47);
      if (b) { g.addColorStop(0, `rgba(70,70,74,${a})`); g.addColorStop(1, `rgba(10,10,12,${a})`); }
      else { g.addColorStop(0, `rgba(250,248,240,${a})`); g.addColorStop(1, `rgba(190,186,176,${a})`); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x0 + x * s, y0 + y * s, s * 0.46, 0, TAU); ctx.fill();
      if (b) { ctx.strokeStyle = `rgba(214,190,150,${0.35 * a})`; ctx.stroke(); }
    };
    GO.slice(0, nShow).forEach((p) => stone(p.x, p.y, p.b));
    // 那一步：五路肩冲
    const t37 = (sh.d8 ?? 1) + 1.6, k = ease(u, t37, t37 + 0.25);
    if (k > 0) {
      stone(13, 9, true, k);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rr = (u - t37) * 260;
      ctx.strokeStyle = `rgba(236,226,204,${0.5 * Math.exp(-(u - t37) * 1.6)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x0 + 13 * s, y0 + 9 * s, Math.max(1, rr), 0, TAU); ctx.stroke();
      glow(ctx, x0 + 13 * s, y0 + 9 * s, 80, [236, 226, 204], 0.25 * k);
      ctx.restore();
    }
    ctx.restore();
  };

  // 蛋白质折叠：一条链收拢成螺旋与片层
  const FOLD = (() => {
    const N = 140, folded = [];
    for (let i = 0; i < N; i++) {
      const seg = Math.floor(i / 28), j = i % 28;
      const helix = seg % 2 === 0;
      const bx = (seg - 2) * 70, by = 0, bz = (seg % 2 ? 1 : -1) * 40;
      if (helix) folded.push([bx + Math.cos(j * 0.9) * 30, by + (j - 14) * 7, bz + Math.sin(j * 0.9) * 30]);
      else folded.push([bx + (j % 2 ? 12 : -12), by + (14 - j) * 10, bz]);
    }
    return folded;
  })();
  SHOT.protein = (ctx, u, dur) => {
    const f = easeInOut(ramp(u, 0.4, dur - 1.0));
    const rot = u * 0.35, N = FOLD.length;
    const pts = FOLD.map(([x, y, z], i) => {
      const lx = (i - N / 2) * 11, ly = Math.sin(i * 0.25) * 30, lz = Math.cos(i * 0.21) * 20;
      const X = lerp(lx, x, f), Y = lerp(ly, y, f), Z = lerp(lz, z, f);
      const c = Math.cos(rot), s = Math.sin(rot);
      const xr = X * c + Z * s, zr = -X * s + Z * c;
      const sc = 2.2 / (1 + zr / 900);
      return [CX + xr * sc, CY - 30 + Y * sc, zr];
    });
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 由远及近分段画平滑曲线，近处更粗更亮
    const segs = [];
    for (let i = 0; i < N - 1; i += 3) segs.push(i);
    segs.sort((p, q) => pts[q][2] - pts[p][2]);
    for (const i of segs) {
      const chunk = pts.slice(Math.max(0, i - 1), Math.min(N, i + 5));
      const z = clamp((pts[i][2] + 220) / 440), hue = i / N;
      ctx.strokeStyle = `rgba(${lerp(140, 236, hue) | 0},${lerp(196, 176, hue) | 0},${lerp(236, 140, hue) | 0},${0.4 + 0.5 * (1 - z)})`;
      ctx.lineWidth = 4 + 9 * (1 - z);
      ctx.beginPath(); splinePath(ctx, chunk, false); ctx.stroke();
    }
    ctx.restore();
  };

  SHOT.screen = (ctx, u, dur, sh) => {
    TYPING = sh.typing;
    const sk = ease(u, 0.0, 0.9) * (1 - ease(u, dur - 2.4, dur - 0.4));
    if (sk > 0.002) screen(ctx, u, sk);
  };
  SHOT.coldopen = (ctx, u, dur, sh) => {
    TYPING = sh.typing;
    const sk = ease(u, 0.0, 0.9);
    screen(ctx, u, sk, false);
  };
})();

// —— 加速的时间轴：贯穿图灵 → 对话 ——
const MILESTONES = [[1950, '图灵', 'Turing'], [1997, '深蓝', 'Deep Blue'], [2016, 'AlphaGo', 'AlphaGo'], [2020, 'AlphaFold', 'AlphaFold'], [2022, '对话', 'Chat']];
function accelAxis(ctx, upto, grow, k, opt = {}) {
  const y = opt.y ?? 168, x0 = opt.x0 ?? 220, x1 = opt.x1 ?? W - 220;
  const y0 = opt.from ?? 1945, y1 = opt.to ?? 2027;
  const X = (yr) => lerp(x0, x1, (yr - y0) / (y1 - y0));
  const zh = TL.lang === 'zh';
  ctx.save();
  ctx.globalAlpha = k;
  if (opt.band !== false) {
    const bg = ctx.createLinearGradient(0, y - 70, 0, y + 60);
    bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.3, 'rgba(0,0,0,0.7)'); bg.addColorStop(0.7, 'rgba(0,0,0,0.7)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, y - 70, W, 130);
  }
  ctx.strokeStyle = 'rgba(200,214,232,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.font = `15px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= Math.min(upto, MILESTONES.length - 1); i++) {
    const [yr, zn, en] = MILESTONES[i];
    const a = i < upto ? 1 : grow;
    const x = X(yr);
    ctx.fillStyle = `rgba(236,226,204,${0.85 * a})`;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y, 24, [236, 226, 204], 0.5 * a * (i === upto ? 1 : 0.4)); ctx.restore();
    ctx.fillStyle = `rgba(214,206,186,${0.7 * a})`;
    ctx.fillText(String(yr), x, y + 12);
    ctx.fillStyle = `rgba(214,206,186,${0.45 * a})`;
    ctx.fillText(zh ? zn : en, x, y + 32);
    // 与上一个节点之间的间隔
    if (i > 0) {
      const px = X(MILESTONES[i - 1][0]), gap = yr - MILESTONES[i - 1][0];
      const g = i < upto ? 1 : ease(grow, 0, 0.7);
      const xm = lerp(px, x, g);
      ctx.strokeStyle = `rgba(255,214,150,${0.7 * a})`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(px, y - 14); ctx.lineTo(px, y - 22); ctx.lineTo(xm, y - 22); if (g >= 1) ctx.lineTo(x, y - 14); ctx.stroke();
      if (g > 0.6) {
        ctx.textBaseline = 'bottom'; ctx.font = `${i === upto ? 22 : 17}px ${SERIF}`;
        ctx.fillStyle = `rgba(255,222,170,${(i === upto ? 0.95 : 0.6) * ease(g, 0.6, 1)})`;
        ctx.fillText(zh ? `${gap} 年` : `${gap} yr`, (px + x) / 2, y - 28);
        ctx.font = `15px ${SERIF}`; ctx.textBaseline = 'top';
      }
    }
  }
  ctx.restore();
}

(() => {
  const idx = { turing: 0, chess: 1, go: 2, protein: 3, talk: 4 };
  // 包一层：原镜头画完后叠加时间轴
  for (const k of Object.keys(idx)) {
    const base = SHOT[k];
    SHOT[k] = (ctx, u, dur, sh, t) => {
      if (base) base(ctx, u, dur, sh, t);
      accelAxis(ctx, idx[k], ease(u, 0.3, 1.6), ease(u, 0, 0.5));
    };
  }

  // 对话：一扇对话窗口，拉远成成千上万扇
  SHOT.talk = (() => {
    const draw = (ctx, u, dur) => {
      const z = Math.exp(lerp(Math.log(1), Math.log(0.16), easeInOut(ramp(u, 1.0, dur - 0.6))));
      const cw = 760, ch = 460, gx = 26, gy = 16;
      ctx.save();
      ctx.translate(CX, CY + 30); ctx.scale(z, z);
      const n = Math.ceil(1 / z) + 2;
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const x = i * (cw + 40) - cw / 2, y = j * (ch + 40) - ch / 2;
        const seed = (i + 50) * 131 + (j + 50) * 17;
        const d = Math.hypot(i, j);
        const born = d === 0 ? 0 : 0.9 + d * 0.12 + rand(seed, 3) * 0.6;
        const a = ease(u, born, born + 0.3);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#0d1014'; ctx.strokeStyle = 'rgba(200,214,232,0.22)'; ctx.lineWidth = 2 / Math.max(z, 0.2);
        ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 22); ctx.fill(); ctx.stroke();
        // 气泡：问与答交替出现
        const nb = 4;
        for (let b = 0; b < nb; b++) {
          const tb = born + 0.25 + b * (0.35 + rand(seed, b) * 0.3);
          if (u < tb) break;
          const right = b % 2 === 0;
          const w = right ? 180 + rand(seed, b + 9) * 160 : 300 + rand(seed, b + 7) * 280;
          const bx = right ? x + cw - 40 - w : x + 40;
          const by = y + 40 + b * 100;
          ctx.fillStyle = right ? 'rgba(200,214,232,0.12)' : 'rgba(236,226,204,0.10)';
          ctx.beginPath(); ctx.roundRect(bx, by, w, 70, 18); ctx.fill();
          ctx.fillStyle = right ? 'rgba(214,220,228,0.45)' : 'rgba(236,232,222,0.6)';
          const lw = Math.min(1, (u - tb) / 0.4);
          for (let l = 0; l < 2; l++) ctx.fillRect(bx + 20, by + 22 + l * 22, (w - 40) * (l ? 0.6 : 1) * lw, 7);
        }
      }
      ctx.restore();
    };
    return draw;
  })();

  // 加速：间隔从几十年缩到几个月
  SHOT.accel = (ctx, u, dur) => {
    const zh = TL.lang === 'zh';
    const zoom = easeInOut(ramp(u, 0.6, dur - 0.5));
    // 视窗从 1945–2027 推近到 2018–2027
    const from = lerp(1945, 2018.5, zoom), to = 2027;
    accelAxis(ctx, 4, 1, 1, { y: CY - 10, from, to, x0: 160, x1: W - 160, band: false });
    const X = (yr) => lerp(160, W - 160, (yr - from) / (to - from));
    // 之后的几个月一跳：越来越密的刻度与闪光
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const months = [2023.2, 2023.6, 2024.0, 2024.3, 2024.55, 2024.8, 2025.0, 2025.2, 2025.4, 2025.55, 2025.7, 2025.82, 2025.93, 2026.03, 2026.12, 2026.2, 2026.27, 2026.33, 2026.39, 2026.44, 2026.49, 2026.53, 2026.57, 2026.6];
    months.forEach((yr, i) => {
      const tb = 0.8 + i * (dur - 1.6) / months.length;
      const a = ease(u, tb, tb + 0.2);
      if (a <= 0) return;
      const x = X(yr), flash = Math.exp(-(u - tb) * 5);
      ctx.strokeStyle = `rgba(255,222,170,${(0.45 + 0.5 * flash) * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, CY - 10 - 18 - flash * 30); ctx.lineTo(x, CY - 10 + 6); ctx.stroke();
      glow(ctx, x, CY - 10, 30, [255, 222, 170], 0.6 * flash);
    });
    ctx.restore();
    const lk = ease(u, dur * 0.45, dur * 0.6);
    if (lk > 0) {
      ctx.save();
      ctx.font = `26px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,222,170,${0.85 * lk})`;
      ctx.fillText(zh ? '几个月' : 'months', X(2025.4), CY - 110);
      ctx.restore();
    }
  };

  // 能力分布：一束光扫过“我们之中的大多数”，停在最顶尖者之前
  const invNorm = (p) => { // Acklam 近似
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) return -invNorm(1 - p);
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  window.drawCurve = (ctx, u, dur, sh, frozen) => {
    const zh = TL.lang === 'zh';
    const x0 = 260, x1 = W - 260, base = H * 0.7, ht = 380;
    const X = (z) => lerp(x0, x1, (z + 3.4) / 6.8);
    const Y = (z) => base - ht * Math.exp(-z * z / 2);
    const d12 = sh.d12 ?? 0.4, d13 = sh.d13 ?? dur * 0.5;
    let q;
    if (frozen) q = 0.955;
    else {
      const s1 = easeInOut(ramp(u, d12 + 0.2, d13 - 0.4));
      const s2 = easeInOut(ramp(u, d13 + 1.0, d13 + 3.5));
      q = lerp(0.02, 0.93, s1) + 0.035 * s2;
    }
    const zq = invNorm(q);
    ctx.save();
    // 被扫过的区域
    const g = ctx.createLinearGradient(x0, 0, X(zq), 0);
    g.addColorStop(0, `rgba(${GOLD},0.05)`); g.addColorStop(1, `rgba(${GOLD},0.28)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, base);
    for (let z = -3.4; z <= zq; z += 0.02) ctx.lineTo(X(z), Y(z));
    ctx.lineTo(X(zq), base); ctx.closePath(); ctx.fill();
    // 曲线
    ctx.strokeStyle = 'rgba(236,226,204,0.75)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); for (let z = -3.4; z <= 3.4; z += 0.02) (z === -3.4 ? ctx.moveTo(X(z), Y(z)) : ctx.lineTo(X(z), Y(z))); ctx.stroke();
    ctx.strokeStyle = 'rgba(236,226,204,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.stroke();
    // 最顶尖的一小撮
    const zt = invNorm(0.99);
    ctx.fillStyle = 'rgba(200,214,232,0.18)';
    ctx.beginPath(); ctx.moveTo(X(zt), base); for (let z = zt; z <= 3.4; z += 0.02) ctx.lineTo(X(z), Y(z)); ctx.lineTo(X(3.4), base); ctx.closePath(); ctx.fill();
    // 光束
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lx = X(zq);
    const bg = ctx.createLinearGradient(0, base - ht - 80, 0, base);
    bg.addColorStop(0, 'rgba(255,236,200,0)'); bg.addColorStop(1, 'rgba(255,236,200,0.9)');
    ctx.strokeStyle = bg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, base - ht - 80); ctx.lineTo(lx, base); ctx.stroke();
    glow(ctx, lx, base, 120, [255, 222, 170], 0.5);
    ctx.restore();
    // 标签
    ctx.font = `24px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(236,226,204,${0.7 * ease(q, 0.4, 0.7)})`;
    ctx.fillText(zh ? '我们之中的大多数' : 'most of us', X(0), base - ht * 0.45);
    ctx.font = `19px ${SERIF}`; ctx.fillStyle = 'rgba(200,214,232,0.7)';
    ctx.fillText(zh ? '最顶尖的人' : 'the very best', X(2.75), base - 70);
    ctx.font = `22px ${SERIF}`; ctx.fillStyle = 'rgba(255,222,170,0.9)';
    ctx.fillText('AI', lx, base - ht - 100);
    // 领域轮换：写作 → 编程 → 影像
    if (!frozen) {
      const names = zh ? ['写作', '编程', '影像'] : ['Writing', 'Coding', 'Film'];
      const ph = clamp((u - d12) / Math.max(1, dur - d12 - 1)) * 3;
      ctx.font = `20px ${SERIF}`; ctx.letterSpacing = '0.3em';
      names.forEach((nm, i) => {
        const on = Math.max(0, 1 - Math.abs(ph - i - 0.5) * 1.6);
        ctx.fillStyle = `rgba(236,226,204,${0.25 + 0.65 * on})`;
        ctx.fillText(nm, CX + (i - 1) * 180, base + 60);
      });
    }
    ctx.restore();
  };
  SHOT.curve = (ctx, u, dur, sh) => window.drawCurve(ctx, u, dur, sh, false);

  // 本片的制作过程：真实的代码、旁白波形、配乐频谱，越来越快，过曝，硬切
  SHOT.making = (ctx, u, dur) => {
    const sp = 1 + Math.pow(u / dur, 2) * 5;
    ctx.save();
    // 代码
    const ck = 1 - ease(u, dur * 0.42, dur * 0.55);
    if (ck > 0) {
      ctx.globalAlpha = ck;
      ctx.font = `20px ${MONO}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const scroll = (u * 60 + u * u * 40) * 1.0;
      for (let i = 0; i < 25; i++) {
        const li = Math.floor(scroll / 30) + i, y = 110 + i * 30 - (scroll % 30);
        const line = SELF.code[li % SELF.code.length];
        const kw = /\b(function|const|return|for|def|import|while)\b/.test(line);
        ctx.fillStyle = kw ? 'rgba(236,226,204,0.85)' : 'rgba(200,214,232,0.5)';
        ctx.fillText(String(li + 1).padStart(4, ' '), 300, y);
        ctx.fillText(line, 380, y);
      }
      ctx.globalAlpha = 1;
    }
    // 旁白波形
    const wk = win(u, dur * 0.4, dur * 0.82, 0.6, 0.5);
    if (wk > 0) {
      ctx.globalAlpha = wk;
      const n = SELF.wave.length, off = Math.floor(ramp(u, dur * 0.4, dur) * n * 0.6 * sp / 3);
      ctx.strokeStyle = 'rgba(200,214,232,0.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 900; i++) {
        const v = SELF.wave[(off + i) % n], x = 160 + i * (W - 320) / 900;
        ctx.moveTo(x, CY - 160 - v * 120); ctx.lineTo(x, CY - 160 + v * 120);
      }
      ctx.stroke();
      ctx.font = `16px ${MONO}`; ctx.fillStyle = 'rgba(200,214,232,0.5)';
      ctx.fillText(TL.lang === 'zh' ? 'narration.wav · 旁白' : 'narration.wav', 160, CY - 310);
      ctx.globalAlpha = 1;
    }
    // 配乐频谱
    const sk = ease(u, dur * 0.55, dur * 0.7);
    if (sk > 0) {
      const im = IMG.selfspec, sx = ramp(u, dur * 0.55, dur) * im.width * 0.7 * sp / 3;
      ctx.globalAlpha = sk;
      ctx.drawImage(im, sx % (im.width - 600), 0, 600, im.height, 160, CY + 20, W - 320, 260);
      ctx.font = `16px ${MONO}`; ctx.fillStyle = 'rgba(200,214,232,0.5)';
      ctx.fillText(TL.lang === 'zh' ? 'score.wav · 配乐' : 'score.wav', 160, CY + 0);
      ctx.globalAlpha = 1;
    }
    // 时间线播放头越来越快
    const ph = (u * u * 0.9) % 1;
    ctx.strokeStyle = 'rgba(255,222,170,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(160 + ph * (W - 320), 90); ctx.lineTo(160 + ph * (W - 320), H - 200); ctx.stroke();
    const over = ease(u, dur - 1.6, dur);
    if (over > 0) { ctx.fillStyle = `rgba(226,234,246,${over * 0.65})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };
  // 符号洪流不再负责过曝（交给“本片的制作过程”）
  const streams = SHOT.streams;
  SHOT.streams = (ctx, u, dur, sh, t) => {
    const fake = { ...sh };
    streams(ctx, u, dur + 100, fake, t);
  };
})();
