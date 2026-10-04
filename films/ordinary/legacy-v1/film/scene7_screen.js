// 第七幕：我们制造的东西，开始回答
(() => {
  const SCR = { x: CX - 560, y: CY - 360, w: 1120, h: 630 };

  function typedText(item, t) {
    let s = '';
    for (const c of item.chars) if (c.t <= t) s += c.ch;
    return s;
  }

  function screen(ctx, t, k) {
    const push = 1 + ease(t, 210.5, 227) * 0.07;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
    // 屏幕向房间里漏出的光
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, CX, CY - 40, 1100, [150, 175, 210], 0.1);
    ctx.restore();
    ctx.fillStyle = '#07080a';
    ctx.beginPath(); ctx.roundRect(SCR.x - 22, SCR.y - 22, SCR.w + 44, SCR.h + 44, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(200,214,232,0.08)'; ctx.lineWidth = 1; ctx.stroke();
    const bg = ctx.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h);
    bg.addColorStop(0, '#0e1013'); bg.addColorStop(1, '#0a0b0d');
    ctx.fillStyle = bg; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    const [q, r1, r2] = TL.typing;
    ctx.font = `34px ${SANS}`; ctx.textBaseline = 'middle'; ctx.letterSpacing = '0.06em';
    // 提问：右侧
    const qs = typedText(q, t);
    if (qs) {
      const tw = ctx.measureText(q.text).width;
      ctx.fillStyle = 'rgba(200,214,232,0.07)';
      ctx.beginPath(); ctx.roundRect(SCR.x + SCR.w - 90 - tw - 36, SCR.y + 92, tw + 48, 64, 14); ctx.fill();
      ctx.fillStyle = 'rgba(214,220,228,0.78)';
      ctx.textAlign = 'left';
      ctx.fillText(qs, SCR.x + SCR.w - 90 - tw - 12, SCR.y + 124);
    }
    // 回答：左侧，逐字
    const lines = [typedText(r1, t), typedText(r2, t)];
    ctx.fillStyle = 'rgba(236,232,222,0.92)';
    ctx.textAlign = 'left';
    lines.forEach((s, i) => s && ctx.fillText(s, SCR.x + 90, SCR.y + 250 + i * 68));
    // 光标
    const typingNow = [q, r1, r2].find((it) => t >= it.chars[0].t - 0.6 && t <= it.chars.at(-1).t + 0.05);
    const active = typingNow || (t > r2.chars.at(-1).t ? r2 : t > q.chars.at(-1).t && t < r1.chars[0].t ? null : null);
    let cx = null, cy = null;
    if (active === q) { cx = null; }
    else if (active === r1 || (t > q.chars.at(-1).t + 0.3 && t < r1.chars[0].t)) { cx = SCR.x + 90 + ctx.measureText(lines[0]).width + 6; cy = SCR.y + 250; }
    else if (active === r2 || t > r1.chars.at(-1).t) { cx = SCR.x + 90 + ctx.measureText(lines[1]).width + 6; cy = SCR.y + 318; }
    if (cx !== null && (Math.floor(t * 1.8) % 2 === 0 || typingNow)) {
      ctx.fillStyle = 'rgba(236,232,222,0.75)';
      ctx.fillRect(cx, cy - 17, 3, 34);
    }
    // 屏幕玻璃上的微弱反光
    const gl = ctx.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w, SCR.y + SCR.h);
    gl.addColorStop(0, 'rgba(255,255,255,0.025)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0.012)');
    ctx.fillStyle = gl; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    ctx.restore();
  }

  scene('screen', 202.6, TL.DURATION, 0.01, 0.01, (ctx, _, t) => {
    // 火光中的侧脸 → 屏幕光中的侧脸，同一个姿势
    const pk = ease(t, 203.0, 204.8) * (1 - ease(t, 210.4, 211.6));
    if (pk > 0.002) {
      const m = ease(t, 205.6, 208.0);
      const flick = 0.82 + 0.18 * fbm1(t * 3.4, 2);
      const scr = 0.9 + 0.1 * noise1(t * 1.3, 901);
      ctx.save();
      ctx.globalAlpha = pk;
      if (m < 1) {
        ctx.save(); ctx.globalAlpha = pk * (1 - m);
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, W * 0.86, H * 1.12, 980, [255, 110, 40], 0.22 * flick);
        ctx.globalCompositeOperation = 'source-over';
        drawProfile(ctx, W * 0.42, H * 0.6, 360, 0.06, { rgb: [255, 150, 72], k: flick }, 1);
        ctx.restore();
      }
      if (m > 0) {
        const b = makeTemp(), c = b.getContext('2d');
        c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter';
        glow(c, W * 1.02, H * 0.42, 900, [150, 180, 220], 0.2 * scr);
        c.restore();
        drawProfile(c, W * 0.42, H * 0.6, 360, 0.06, { rgb: [180, 205, 240], k: 0.85 * scr }, 0);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pk * m;
        ctx.drawImage(b, 0, 0);
      }
      ctx.restore();
    }
    const sk = ease(t, 210.6, 212.0) * (1 - ease(t, 225.2, 227.4));
    if (sk > 0.002) screen(ctx, t, sk);
  });
})();
