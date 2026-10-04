// 第五幕：我们把神圣藏进身体里面
(() => {
  const beatEnv = (t) => {
    let e = 0;
    for (const hb of TL.heartbeats) {
      const d = t - hb;
      if (d < -0.1 || d > 1.2) continue;
      if (d >= 0) e += Math.exp(-d * 9);
      if (d >= 0.28) e += 0.6 * Math.exp(-(d - 0.28) * 10);
    }
    return e;
  };
  // 心电：P 波、QRS、T 波
  const ecg = (t) => {
    let v = 0;
    for (const hb of TL.heartbeats) {
      const d = t - hb;
      if (d < -0.3 || d > 0.6) continue;
      v += 0.12 * Math.exp(-(((d + 0.16) / 0.03) ** 2));
      v -= 0.15 * Math.exp(-(((d + 0.02) / 0.008) ** 2));
      v += 1.0 * Math.exp(-((d / 0.011) ** 2));
      v -= 0.28 * Math.exp(-(((d - 0.025) / 0.01) ** 2));
      v += 0.22 * Math.exp(-(((d - 0.24) / 0.06) ** 2));
    }
    return v;
  };

  function ribcage(ctx, t, k) {
    const c = `rgba(${BONE},`;
    ctx.save();
    ctx.lineCap = 'round';
    // 脊柱
    for (let i = 0; i < 17; i++) {
      const y = 150 + i * 50;
      ctx.strokeStyle = c + 0.16 * k + ')'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(CX - 22, y, 44, 36, 9); ctx.stroke();
    }
    // 胸骨
    ctx.strokeStyle = c + 0.3 * k + ')'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.roundRect(CX - 18, 250, 36, 380, 14); ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const y0 = 268 + i * 44, wi = 170 + 170 * Math.sin((Math.PI * (i + 2.5)) / 14);
      for (const sd of [-1, 1]) for (const off of [0, 13 - i * 0.5]) {
        ctx.strokeStyle = c + (0.3 - i * 0.012) * k + ')';
        ctx.beginPath();
        ctx.moveTo(CX + sd * 22, y0 + off);
        ctx.bezierCurveTo(CX + sd * wi * 0.55, y0 - 10 + off, CX + sd * wi * 1.04, y0 + 50 + off + i * 3, CX + sd * wi * 0.9, y0 + 150 + off + i * 6);
        ctx.stroke();
      }
    }
    // 锁骨
    for (const sd of [-1, 1]) {
      ctx.strokeStyle = c + 0.28 * k + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(CX + sd * 26, 236); ctx.bezierCurveTo(CX + sd * 140, 200, CX + sd * 220, 250, CX + sd * 330, 210); ctx.stroke();
    }
    ctx.restore();
  }

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
    const r = AP.r * (0.9 + 0.1 * ease(t, 145.5, 148.5));
    ctx.beginPath(); ctx.arc(AP.x, AP.y, r, 0, TAU); ctx.save(); ctx.clip();
    ctx.drawImage(field, AP.x - o + drift[0], AP.y - o + drift[1]);
    const ox = AP.x - o + drift[0], oy = AP.y - o + drift[1];
    // 放电：从胞体沿轴突传出的亮点
    ctx.globalCompositeOperation = 'lighter';
    for (const sp of TL.spikes) {
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
    const ek = ease(t, 150.6, 152.6);
    if (ek > 0) {
      const tip = [ox + AXON[0][0] + 14, oy + AXON[0][1] - 10];
      const back = [tip[0] + 600, tip[1] - 520];
      const tx = lerp(back[0], tip[0], ek), ty = lerp(back[1], tip[1], ek);
      ctx.fillStyle = 'rgba(240,236,220,0.18)'; ctx.strokeStyle = 'rgba(20,14,8,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 640, ty - 520 - 26); ctx.lineTo(tx + 640, ty - 520 + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // 测量的网格逐渐覆盖
    const gk = ease(t, 157.5, 162);
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
      for (const sp of TL.spikes) {
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
    const n = TL.spikes.filter((s) => s <= t).length;
    ctx.font = `15px ${MONO}`; ctx.fillStyle = 'rgba(200,214,232,0.62)'; ctx.textAlign = 'left';
    const rows = [
      ['Vm', `${vm(t).toFixed(1)} mV`, 151.5],
      ['spikes', `${n}`, 153],
      ['rate', `${(TL.spikes.filter((s) => s <= t && s > t - 2).length / 2).toFixed(1)} Hz`, 155],
      ['t', `${(t - 150).toFixed(3)} s`, 157.5],
      ['ch', '01 · 20 kHz · Ag/AgCl', 159.5],
      ['model', 'Hodgkin–Huxley · fit 0.97', 162],
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

  scene('body', 137.0, 168.8, 1.6, 1.4, (ctx, _, t) => {
    const chestK = 1 - ease(t, 145.2, 147.6);
    if (chestK > 0.002) {
      const push = 1 + ease(t, 137, 147.6) * 0.16;
      ctx.save();
      ctx.translate(CX, 470); ctx.scale(push, push); ctx.translate(-CX, -470);
      const e = beatEnv(t);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, CX + 50, 500, 300 * (1 + 0.06 * e), [170, 26, 22], chestK * (0.18 + 0.3 * e));
      glow(ctx, CX + 50, 500, 110 * (1 + 0.1 * e), [230, 60, 40], chestK * (0.1 + 0.3 * e));
      ctx.restore();
      ribcage(ctx, t, chestK * ease(t, 137, 139.5));
      ctx.restore();
      // 心电，荧光余辉
      const y = H * 0.74, sweep = 520;
      ctx.save();
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const head = ((t - 137) * sweep) % (W + 200) - 100;
      for (let i = 0; i < 160; i++) {
        const a = i / 160, b = (i + 1) / 160;
        const xa = head - a * 900, xb = head - b * 900;
        if (xa < -10) break;
        const ta = t - (a * 900) / sweep, tb = t - (b * 900) / sweep;
        ctx.strokeStyle = `rgba(255,196,186,${chestK * 0.8 * (1 - a) ** 1.5})`;
        ctx.beginPath(); ctx.moveTo(xa, y - ecg(ta) * 110); ctx.lineTo(xb, y - ecg(tb) * 110); ctx.stroke();
      }
      ctx.restore();
    }
    const mk = ease(t, 145.6, 148.2);
    if (mk > 0) { micro(ctx, t, mk); scope(ctx, t, mk * ease(t, 151, 152.5)); }
  });
})();
