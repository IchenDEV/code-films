// 各平台封面：钩子画面（看不完的代码瀑布、放大镜、盖上“不再逐行”）+ 一行大字。数字都出自 claude.dev 博客。
window.renderCover = () => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const f of INITS) f();
  bg(g, 0);
  const wide = W > H, u = Math.min(W, H) / 1080;
  // 钩子画面放在下半部；时间取在盖章落定、放大镜刚开始掉的那一刻
  const c = { u: 1.58, t: 1.58, dur: 4, n: 1, cut: 'short', line: () => 0, has: () => false, k: (n) => ({ stop: 1.3 }[n] ?? 1e9) };
  g.save();
  g.translate(wide ? W * 0.66 : W / 2, wide ? H * 0.58 : H * 0.7); g.scale((wide ? 0.78 : 1.1) * u, (wide ? 0.78 : 1.1) * u);
  SHOT.flood(g, c);
  g.restore();
  const gr = g.createLinearGradient(0, 0, wide ? W : 0, wide ? 0 : H);
  gr.addColorStop(0, 'rgba(5,7,20,0.94)'); gr.addColorStop(wide ? 0.5 : 0.44, 'rgba(5,7,20,0.6)'); gr.addColorStop(1, 'rgba(5,7,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const o = (s, x, y, size, col, extra = {}) => txt(g, s, x, y, size * u, col, { weight: '900', stroke: 12 * u, ...extra });
  if (!wide) {
    // 竖版：字落在中央 3:4 区域（主页网格会裁成 3:4）
    const top = (H - Math.min(H, W * 4 / 3)) / 2;
    if (ZH) {
      o('Anthropic', W / 2, top + 150 * u, 84, C.gold, { family: F.grot });
      o('不再逐行审代码了', W / 2, top + 300 * u, 124, C.ink, { maxW: W * 0.94 });
      o('Claude Code 九成代码 AI 写', W / 2, top + 450 * u, 70, C.clay, { maxW: W * 0.94 });
      chip(g, '合并翻倍 · 回滚比例降四成多', W / 2, top + 570 * u, 44 * u, '#06251b', C.mint, { weight: '900' });
    } else {
      o('ANTHROPIC', W / 2, top + 150 * u, 84, C.gold, { family: F.grot, spacing: '6px' });
      o('STOPPED READING', W / 2, top + 290 * u, 112, C.ink, { family: F.grot, maxW: W * 0.94 });
      o('EVERY LINE', W / 2, top + 400 * u, 112, C.ink, { family: F.grot, maxW: W * 0.94 });
      chip(g, 'merged PRs 2× · revert share −40%+', W / 2, top + 540 * u, 44 * u, '#06251b', C.mint, { family: F.grot, weight: '700' });
    }
  } else {
    const x = W * 0.05;
    if (ZH) {
      o('Anthropic', x, H * 0.17, 84, C.gold, { family: F.grot, align: 'left' });
      o('不再逐行审代码了', x, H * 0.37, 130, C.ink, { align: 'left', maxW: W * 0.62 });
      o('Claude Code 九成代码 AI 写，谁来审？', x, H * 0.56, 60, C.clay, { align: 'left', maxW: W * 0.62 });
      chip(g, '六层检查 · 一晚 50 轮 · 全拆解', x, H * 0.73, 46 * u, '#06251b', C.mint, { align: 'left', weight: '900' });
    } else {
      o('ANTHROPIC', x, H * 0.17, 84, C.gold, { family: F.grot, align: 'left', spacing: '6px' });
      o('STOPPED READING', x, H * 0.34, 110, C.ink, { family: F.grot, align: 'left', maxW: W * 0.62 });
      o('EVERY LINE', x, H * 0.49, 110, C.ink, { family: F.grot, align: 'left', maxW: W * 0.62 });
      chip(g, 'AI writes 90% of Claude Code. Who reviews it?', x, H * 0.68, 46 * u, '#06251b', C.mint, { family: F.grot, align: 'left', weight: '700' });
    }
  }
  return cv.toDataURL('image/jpeg', 0.93);
};
window.ready = Promise.all([
  document.fonts.load(`900 40px ${F.sans}`, '不再逐行审代码了写谁来合并翻倍回滚比例降四成多六层检查一晚轮全拆解的九'), document.fonts.load(`700 40px ${F.grot}`, 'ANTHROPIC'),
  document.fonts.load(`700 40px ${F.mono}`, 'diff'),
]);
