// 各平台封面：钩子画面（堵死的 git 管子、盖上“换掉”）+ 一行大字。数字都出自 Anthropic 工程博客。
window.renderCover = () => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const f of INITS) f();
  bg(g, 0);
  const wide = W > H, u = Math.min(W, H) / 1080;
  // 钩子画面放在下半部
  const c = { u: 3.2, t: 3.2, dur: 6, n: 2, cut: 'short', line: () => 0, has: () => false, k: (n) => ({ swap: 0.9, fast: 2.6 }[n] ?? 1e9) };
  g.save();
  g.translate(wide ? W * 0.62 : W / 2, wide ? H * 0.62 : H * 0.66); g.scale((wide ? 0.82 : 1.15) * u, (wide ? 0.82 : 1.15) * u);
  SHOT.jam(g, c);
  g.restore();
  const gr = g.createLinearGradient(0, 0, wide ? W : 0, wide ? 0 : H);
  gr.addColorStop(0, 'rgba(5,7,20,0.92)'); gr.addColorStop(wide ? 0.5 : 0.42, 'rgba(5,7,20,0.6)'); gr.addColorStop(1, 'rgba(5,7,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const o = (s, x, y, size, col, extra = {}) => txt(g, s, x, y, size * u, col, { weight: '900', stroke: 12 * u, ...extra });
  if (!wide) {
    // 竖版：字落在中央 3:4 区域（主页网格会裁成 3:4）
    const top = (H - Math.min(H, W * 4 / 3)) / 2;
    if (ZH) {
      o('Anthropic', W / 2, top + 150 * u, 84, C.gold, { family: F.grot });
      o('把 Git 换掉了', W / 2, top + 300 * u, 150, C.ink, { maxW: W * 0.94 });
      o('每天 3 万次合并', W / 2, top + 450 * u, 76, C.clay);
      chip(g, '7 个人 · 5 个月 · 自研 Scion', W / 2, top + 570 * u, 44 * u, '#06251b', C.mint, { weight: '900' });
    } else {
      o('ANTHROPIC', W / 2, top + 150 * u, 84, C.gold, { family: F.grot, spacing: '6px' });
      o('REPLACED GIT', W / 2, top + 300 * u, 140, C.ink, { family: F.grot, maxW: W * 0.94 });
      o('30,000 merges a day', W / 2, top + 450 * u, 76, C.clay, { family: F.grot });
      chip(g, '7 people · 5 months · Scion', W / 2, top + 570 * u, 44 * u, '#06251b', C.mint, { family: F.grot, weight: '700' });
    }
  } else {
    const x = W * 0.05;
    if (ZH) {
      o('Anthropic', x, H * 0.17, 84, C.gold, { family: F.grot, align: 'left' });
      o('把 Git 换掉了', x, H * 0.38, 150, C.ink, { align: 'left' });
      o('每天 3 万次合并 · 7 个人 · 5 个月', x, H * 0.58, 60, C.clay, { align: 'left' });
      chip(g, '自研版本控制 Scion 全拆解', x, H * 0.74, 46 * u, '#06251b', C.mint, { align: 'left', weight: '900' });
    } else {
      o('ANTHROPIC', x, H * 0.17, 84, C.gold, { family: F.grot, align: 'left', spacing: '6px' });
      o('REPLACED GIT', x, H * 0.38, 140, C.ink, { family: F.grot, align: 'left' });
      o('30,000 merges a day · 7 people · 5 months', x, H * 0.58, 56, C.clay, { family: F.grot, align: 'left' });
      chip(g, 'How Scion works', x, H * 0.74, 46 * u, '#06251b', C.mint, { family: F.grot, align: 'left', weight: '700' });
    }
  }
  return cv.toDataURL('image/jpeg', 0.93);
};
window.ready = Promise.all([
  document.fonts.load(`900 40px ${F.sans}`, '把换掉了每天万次合并个人月自研版本控制全拆解'), document.fonts.load(`700 40px ${F.grot}`, 'ANTHROPIC'),
  document.fonts.load(`700 40px ${F.mono}`, 'git'),
]);
