// 年代卡：一条横贯纸面的历史线，每到新的一段就向前延伸一截；当前一段用朱色标出。
const ERAS = [
  { a: 2019.0, b: 2022.0, row: 0, zh: '续写', en: 'Continuation', zs: '把前文铺好，让答案成为最顺的下一笔', es: 'lay out the page so the answer is the natural next line' },
  { a: 2022.0, b: 2023.0, row: 0, zh: '嘱咐', en: 'Instructions', zs: '直接说出要它做的事', es: 'simply say what you want done' },
  { a: 2022.1, b: 2024.0, row: 1, zh: '步骤', en: 'Steps', zs: '教它一步一步地想', es: 'teach it to think step by step' },
  { a: 2023.0, b: 2024.0, row: 0, zh: '补丁', en: 'Patches', zs: '提示词越写越像程序', es: 'prompts start to look like programs' },
  { a: 2024.0, b: 2025.0, row: 1, zh: '推理', en: 'Reasoning', zs: '模型自己学会了推理', es: 'models learn to reason on their own' },
  { a: 2025.0, b: 2026.0, row: 0, zh: '上下文', en: 'Context', zs: '它到底看到了什么', es: 'what can it actually see?' },
  { a: 2026.0, b: 2026.9, row: 1, zh: '放手', en: 'Letting Go', zs: '删掉旧补丁', es: 'remove the old patches' },
  { a: 2026.9, b: 2027.7, row: 0, zh: '今后', en: 'Next', zs: '有版本，能检验', es: 'versioned and tested' },
];
const YEAR_X = (y) => lerp(200, 1720, (y - 2019) / 8.7);
const LINE_Y = 700;
function bracket(ctx, e, k, col, w, label, size) {
  if (k <= 0) return;
  const x0 = YEAR_X(e.a) + 6, x1 = YEAR_X(e.b) - 6, h = 34 + e.row * 58;
  const pts = [[x0, LINE_Y - 8], [x0 + 6, LINE_Y - h], [(x0 + x1) / 2, LINE_Y - h - 6], [x1 - 6, LINE_Y - h], [x1, LINE_Y - 8]];
  inkStroke(ctx, pts, { w, p: k, color: col, seed: e.a * 7, dry: 0.3, bleed: 0.4, taper: 0.2, head: 0.1 });
  if (label) inkText(ctx, label, (x0 + x1) / 2, LINE_Y - h - 26, size, TL.lang === 'zh' ? KAI : GARA, { color: col, alpha: ease(k, 0.5, 1), style: TL.lang === 'zh' ? '' : 'italic' });
}
function eraShot(n) {
  return (ctx, u, dur) => {
    const zh = TL.lang === 'zh';
    paper(ctx, 1 + 0.015 * (u / dur));
    const e = ERAS[n - 1];
    const ext = smooth(ramp(u, 0.35, 1.3));
    // 主线：已经走过的部分已在，再延伸到这一段的终点
    const xEnd = lerp(n > 1 ? YEAR_X(ERAS[n - 2].b) : YEAR_X(2019) + 2, YEAR_X(e.b), ext);
    const full = [[YEAR_X(2019), LINE_Y], [YEAR_X(2021), LINE_Y + 2], [YEAR_X(2023.5), LINE_Y - 1], [YEAR_X(2025.6), LINE_Y + 2], [YEAR_X(2027.7), LINE_Y]];
    const L = YEAR_X(2027.7) - YEAR_X(2019);
    inkStroke(ctx, full, { w: 5, p: (xEnd - YEAR_X(2019)) / L, seed: 3, dry: 0.2, taper: 0.05, head: 0.02, bleed: 0.5 });
    // 年份刻度
    for (let y = 2019; y <= 2027; y++) {
      const x = YEAR_X(y);
      if (x > xEnd + 4) break;
      ctx.fillStyle = rgba(INK, 0.6); ctx.fillRect(x - 1, LINE_Y + 8, 2, 14);
      inkText(ctx, y === 2027 ? (zh ? '今后' : 'next') : String(y), x, LINE_Y + 46, 24, y === 2027 && zh ? KAI : GARA, { alpha: 0.7 });
    }
    // 走过的段落：淡墨；当前：朱色
    ERAS.slice(0, n - 1).forEach((q) => bracket(ctx, q, 1, mixc(INK, PAPER, 0.35), 3, zh ? q.zh : q.en, 22));
    bracket(ctx, e, ease(u, 0.7, 1.6), CINNABAR, 5, zh ? e.zh : e.en, 28);
    // 段名、年份与一句说明
    const yrs = e.b - e.a < 1.01 && n >= 6 ? (n === 8 ? (zh ? '往后' : 'from here') : String(Math.floor(e.a))) : `${Math.floor(e.a)} — ${Math.floor(e.b)}`;
    const num = ['一', '二', '三', '四', '五', '六', '七', '八'][n - 1];
    inkText(ctx, zh ? `第${num}段` : `Part ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n - 1]}`, CX, 228, 30, zh ? KAI : GARA, { alpha: 0.75 * ease(u, 0.5, 1.2), spacing: '6px', style: zh ? '' : 'italic' });
    if (zh) [...e.zh].forEach((ch, i, a) => writeChar(ctx, ch, CX + (i - (a.length - 1) / 2) * 150, 352, 150, BRUSH, ease(u, 0.9 + i * 0.3, 1.5 + i * 0.3), { bleed: 6 }));
    else writeLine(ctx, e.en, CX, 352, 120, GARA, ease(u, 0.9, 1.9), { style: 'italic', align: 'center' });
    inkText(ctx, yrs, CX, 470, 44, GARA, { alpha: ease(u, 1.4, 2.0), spacing: '4px', color: CINNABAR });
    inkText(ctx, zh ? e.zs : e.es, CX, 540, 30, zh ? KAI : GARA, { alpha: 0.8 * ease(u, 1.7, 2.4), style: zh ? '' : 'italic', spacing: zh ? '4px' : '0px' });
  };
}
for (let n = 1; n <= 8; n++) SHOT[`era${n}`] = eraShot(n);
