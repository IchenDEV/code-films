// 各平台封面：开场画面（人端着杯子退到一边，戴环的协调者在给几个 AI 派活）+ 一行大字。配色跟随引擎的主题（海报）。
window.renderCover = () => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const f of INITS) f();
  bg(g, 0);
  const wide = W > H, u = Math.min(W, H) / 1080;
  // 开场镜头里“AI 管 AI”砸下来之后的那一刻（不画镜头里自带的字）
  const c = { u: 5.2, t: 5.2, dur: 6, n: 2, cut: 'short', cover: true, hideHuman: wide, line: (i) => [0, 2.6][i] ?? 1e9, has: () => false, k: (n) => ({ stop: 1.6, aa: 99 }[n] ?? 1e9) };
  g.save();
  g.translate(wide ? W * 0.67 : W / 2, wide ? H * 0.6 : H * 0.66); g.scale((wide ? 0.95 : 1.2) * u, (wide ? 0.95 : 1.2) * u);
  SHOT.hook(g, c);
  g.restore();
  const gr = g.createLinearGradient(0, 0, wide ? W : 0, wide ? 0 : H);
  gr.addColorStop(0, rgba(C.scrimRGB, 0.96)); gr.addColorStop(wide ? 0.48 : 0.42, rgba(C.scrimRGB, 0.6)); gr.addColorStop(1, rgba(C.scrimRGB, 0));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const o = (s, x, y, size, col, extra = {}) => txt(g, s, x, y, size * u, col, { weight: '900', stroke: 12 * u, ...extra });
  if (!wide) {
    // 竖版：字落在中央 3:4 区域（主页网格会裁成 3:4）
    const top = (H - Math.min(H, W * 4 / 3)) / 2;
    o('我不再亲手给 AI 派活了', W / 2, top + 150 * u, 74, C.ink, { maxW: W * 0.92 });
    o('AI 管 AI', W / 2, top + 300 * u, 170, C.key, { maxW: W * 0.92 });
    chip(g, '写程序，越来越像治理一个组织', W / 2, top + 450 * u, 46 * u, null, C.chipBg, { weight: '900', maxW: W * 0.92 });
  } else {
    const x = W * 0.05;
    o('我不再亲手给 AI 派活了', x, H * 0.2, 70, C.ink, { align: 'left', maxW: W * 0.55 });
    o('AI 管 AI', x, H * 0.42, 170, C.key, { align: 'left', maxW: W * 0.55 });
    chip(g, '写程序，越来越像治理一个组织', x, H * 0.64, 46 * u, null, C.chipBg, { align: 'left', weight: '900' });
    txt(g, '8 本管理学经典 · 完整版', x + 6, H * 0.78, 34 * u, C.dim, { align: 'left', weight: '800' });
  }
  return cv.toDataURL('image/jpeg', 0.93);
};
window.ready = Promise.all([
  document.fonts.load(`900 40px ${F.sans}`, '我不再亲手给派活了管写程序越来像治理一个组织本管学经典完整版'), document.fonts.load(`700 40px ${F.grot}`, 'AI 8'),
]);
