// 第六幕：我们开始制造自己的能力
(() => {
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
      const txt = TL.cards.flatMap((c) => c.lines).join('') + '火星空身体规律文明神坛知识位置起源思想';
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

  function sparks(ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const m of TL.montage) {
      const dt = t - m.t;
      if (dt < 0 || dt > 0.9) continue;
      const ox = W * (0.25 + rand(m.t * 10, 850) * 0.5), oy = H * (0.35 + rand(m.t * 10, 851) * 0.3);
      glow(ctx, ox, oy, 260, [190, 220, 255], 0.5 * Math.exp(-dt * 14));
      for (let i = 0; i < 46; i++) {
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

  scene('machines', 167.0, TL.HARD_CUT, 1.6, 0.01, (ctx, _, t) => {
    // 神经的电信号流进电路
    const pk = 1 - ease(t, 171.4, 172.0);
    if (pk > 0.002) {
      const sc = 1.25 - ease(t, 167, 172) * 0.25;
      ctx.save();
      ctx.globalAlpha = pk;
      ctx.translate(CX, CY); ctx.scale(sc, sc); ctx.translate(-CX, -CY);
      ctx.drawImage(pcb, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      TRACES.forEach((pts, i) => {
        const ph = (t * 0.35 + rand(i, 860)) % 1;
        let total = 0; const seg = [];
        for (let q = 1; q < pts.length; q++) { const l = Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]); seg.push(l); total += l; }
        let left = ph * total;
        for (let q = 1; q < pts.length; q++) {
          if (left > seg[q - 1]) { left -= seg[q - 1]; continue; }
          const k = left / seg[q - 1];
          glow(ctx, lerp(pts[q - 1][0], pts[q][0], k), lerp(pts[q - 1][1], pts[q][1], k), 10, [170, 220, 255], 0.9, 1);
          break;
        }
      });
      ctx.restore();
    }
    // 剪辑
    let m = null, next = null;
    for (let i = 0; i < TL.montage.length; i++) if (TL.montage[i].t <= t) { m = TL.montage[i]; next = TL.montage[i + 1]; }
    if (m) {
      const d = (next ? next.t : TL.HARD_CUT) - m.t, lt = t - m.t;
      const sp = 1 + Math.max(0, t - 180) / 6;
      ctx.save();
      // 每次切换带一点冲击性的推近
      const kick = 1 + 0.04 * Math.exp(-lt * 6);
      ctx.translate(CX, CY); ctx.scale(kick, kick); ctx.translate(-CX, -CY);
      DRAW[m.kind](ctx, lt, d, sp, t);
      ctx.restore();
      if (t < 186.2 || t > 195.5) sparks(ctx, t);
      // 结尾越来越亮，直至硬切
      const over = ease(t, 197.6, TL.HARD_CUT);
      if (over > 0) { ctx.fillStyle = `rgba(226,234,246,${over * 0.55})`; ctx.fillRect(0, 0, W, H); }
    }
  });
})();
