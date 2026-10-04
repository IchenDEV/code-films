// 字幕、档案图说明、章节标签、片名
const ZH = () => TL.lang === 'zh';

function wrapLines(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return [text];
  const out = [];
  if (ZH()) {
    // 优先在标点后断行
    let cur = '';
    for (const ch of text) {
      cur += ch;
      if (ctx.measureText(cur).width > maxW) {
        const cut = Math.max(cur.lastIndexOf('，'), cur.lastIndexOf('：'), cur.lastIndexOf('、'), cur.lastIndexOf('；'));
        if (cut > cur.length * 0.4) { out.push(cur.slice(0, cut + 1)); cur = cur.slice(cut + 1); }
        else { out.push(cur.slice(0, -1)); cur = ch; }
      }
    }
    if (cur) out.push(cur);
  } else {
    let cur = '';
    for (const w of text.split(' ')) {
      const next = cur ? cur + ' ' + w : w;
      if (ctx.measureText(next).width > maxW && cur) { out.push(cur); cur = w; } else cur = next;
    }
    if (cur) out.push(cur);
  }
  // 两行时尽量均衡
  return out;
}

function drawSubs(ctx, t) {
  for (const s of TL.subs) {
    if (t < s.a || t > s.b) continue;
    const a = win(t, s.a, s.b, 0.35, 0.4);
    ctx.save();
    const size = ZH() ? 36 : 34;
    ctx.font = `${size}px ${SERIF}`;
    ctx.letterSpacing = ZH() ? '0.08em' : '0.01em';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapLines(ctx, s.text, ZH() ? 1180 : 1400);
    const lh = size * 1.6;
    const y0 = H - 92 - (lines.length - 1) * lh;
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(240,234,222,${0.94 * a})`;
    lines.forEach((l, i) => ctx.fillText(l, CX + (ZH() ? size * 0.04 : 0), y0 + i * lh));
    ctx.restore();
  }
}

function drawCaptions(ctx, t) {
  for (const c of TL.captions) {
    if (t < c.a || t > c.b) continue;
    const a = win(t, c.a, c.b, 0.9, 0.7);
    ctx.save();
    ctx.font = `${ZH() ? 20 : 19}px ${SERIF}`;
    ctx.letterSpacing = ZH() ? '0.18em' : '0.08em';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 12;
    ctx.fillStyle = `rgba(222,210,186,${0.62 * a})`;
    ctx.fillRect(84, 78, 1, 0); // 占位，保持状态一致
    ctx.strokeStyle = `rgba(222,210,186,${0.4 * a})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(86, 64); ctx.lineTo(86, 92); ctx.stroke();
    ctx.fillText(c.text, 104, 79);
    ctx.restore();
  }
}

function drawLabels(ctx, t) {
  for (const c of TL.labels) {
    if (t < c.a - 0.1 || t > c.b + 0.1) continue;
    const isTitle = c.kind === 'title';
    const fi = isTitle ? 2.4 : 1.2, fo = isTitle ? 2.0 : 1.0;
    const a = win(t, c.a, c.b, fi, fo);
    if (a <= 0.003) continue;
    const size = isTitle ? (ZH() ? 96 : 64) : (ZH() ? 34 : 28);
    const spacing = isTitle ? (ZH() ? 0.9 : 0.6) : 0.5;
    const drift = (1 - ease(t, c.a, c.a + fi)) * 6 - ease(t, c.b - fo, c.b) * 4;
    const blur = (1 - a) * (isTitle ? 10 : 5);
    ctx.save();
    ctx.font = `${size}px ${SERIF}`;
    ctx.letterSpacing = `${spacing}em`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
    const y = isTitle ? CY : CY + 4;
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 30;
    ctx.fillStyle = `rgba(238,232,220,${a * 0.95})`;
    ctx.fillText(c.text, CX + (size * spacing) / 2, y + drift);
    if (!isTitle) {
      ctx.filter = 'none'; ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(222,210,186,${a * 0.45})`; ctx.lineWidth = 1;
      const w = 60 * ease(t, c.a, c.a + 2);
      ctx.beginPath(); ctx.moveTo(CX - w, y - 52); ctx.lineTo(CX + w, y - 52); ctx.moveTo(CX - w, y + 52); ctx.lineTo(CX + w, y + 52); ctx.stroke();
    }
    ctx.restore();
  }
}

// 章节标签出现时，把画面压暗，让字站得住
function labelDim(t) {
  let d = 0;
  for (const c of TL.labels) if (c.kind !== 'title') d = Math.max(d, win(t, c.a - 0.4, c.b, 1.2, 1.0));
  return d;
}

// 字幕底部的暗带：只在有字幕时出现，压住明亮的档案图
function subBand(ctx, t) {
  let k = 0;
  for (const s of TL.subs) k = Math.max(k, win(t, s.a - 0.3, s.b + 0.3, 0.5, 0.6));
  if (k <= 0) return;
  const g = ctx.createLinearGradient(0, H - 260, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, `rgba(0,0,0,${0.5 * k})`); g.addColorStop(1, `rgba(0,0,0,${0.62 * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, H - 260, W, 260);
}

function drawText(ctx, t) {
  subBand(ctx, t);
  const d = labelDim(t);
  if (d > 0) { ctx.fillStyle = `rgba(0,0,0,${0.55 * d})`; ctx.fillRect(0, 0, W, H); }
  drawCaptions(ctx, t);
  drawLabels(ctx, t);
  drawSubs(ctx, t);
}
