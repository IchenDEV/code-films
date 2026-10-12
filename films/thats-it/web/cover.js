// 各平台封面：夜里的城，两扇相邻的窗（暖的「就这？」，冷的「要变天了」），一行大字。
window.renderCover = () => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const f of INITS) f();
  const zh = TL.lang === 'zh', wide = W > H, u = Math.min(W, H) / 1080;
  sky(g, SKIES.night, H);
  stars(g, 3, 1, { n: 260, h: H * 0.8 });
  moon(g, W * 0.86, H * 0.12, 40 * u);
  // 两扇窗放在画面下半部
  const mid = [(CITY.her.x + CITY.him.x + CITY.him.w) / 2, (CITY.her.y + CITY.him.y + CITY.him.h) / 2];
  const s = wide ? 4.2 * (1920 / W) * (W / 1920) : 3.4;
  g.save(); g.translate(0, wide ? H * 0.12 : H * 0.17);
  cityLayers(g, 2, [mid[0] + (wide ? -60 : 0), mid[1], s], { herPose: 'laugh', herK: 1, herScreen: 0.7, himPose: 'lean', himK: 1 });
  g.restore();
  // 上方压暗，让字站得住
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, 'rgba(5,6,22,0.88)'); gr.addColorStop(0.45, 'rgba(5,6,22,0.55)'); gr.addColorStop(0.75, 'rgba(5,6,22,0.05)'); gr.addColorStop(1, 'rgba(5,6,22,0.3)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 钩子：一个真实的数字（Karpathy 的粗算）+ 一句站队的问题
  if (!wide && zh) {
    // 竖版：字落在中央 3:4 区域（抖音主页网格会裁成 3:4）
    const top = (H - Math.min(H, W * 4 / 3)) / 2;
    txt(g, '全球只有约', W / 2, top + 150 * u, 74 * u, C.ink, { family: F.serif, weight: '700', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, '5000 人', W / 2, top + 330 * u, 250 * u, C.warm, { shadow: rgba(C.warmRGB, 0.7), blur: 60 });
    txt(g, '用过最前沿的 AI', W / 2, top + 510 * u, 80 * u, C.ink, { family: F.serif, weight: '700', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, '你站在第几层？', W / 2, top + 640 * u, 66 * u, '#e6f3ff', { family: F.serif, weight: '600', shadow: rgba(C.aiRGB, 0.6), blur: 24 });
  } else if (!wide) {
    const top = (H - Math.min(H, W * 4 / 3)) / 2;
    txt(g, 'ONLY', W / 2, top + 150 * u, 80 * u, C.ink, { family: F.lora, weight: '700', spacing: '10px', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, '5,000', W / 2, top + 330 * u, 240 * u, C.warm, { family: F.lora, weight: '700', shadow: rgba(C.warmRGB, 0.7), blur: 60 });
    txt(g, 'people have used', W / 2, top + 500 * u, 76 * u, C.ink, { family: F.lora, weight: '700', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, 'the most advanced AI', W / 2, top + 590 * u, 76 * u, C.ink, { family: F.lora, weight: '700', maxW: W * 0.92, shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, 'Where do you stand?', W / 2, top + 710 * u, 64 * u, '#e6f3ff', { family: F.loraI, weight: '600', shadow: rgba(C.aiRGB, 0.6), blur: 24 });
  } else if (zh) {
    const x = W * 0.06;
    txt(g, '全球只有约', x, H * 0.16, 70 * u, C.ink, { align: 'left', family: F.serif, weight: '700', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, '5000 人', x, H * 0.36, 230 * u, C.warm, { align: 'left', shadow: rgba(C.warmRGB, 0.7), blur: 60 });
    txt(g, '用过最前沿的 AI', x, H * 0.56, 84 * u, C.ink, { align: 'left', family: F.serif, weight: '700', shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, '你站在第几层？', x, H * 0.7, 66 * u, '#e6f3ff', { align: 'left', family: F.serif, weight: '700', shadow: rgba(C.aiRGB, 0.6), blur: 24 });
  } else {
    const x = W * 0.06;
    txt(g, 'ONLY 5,000 PEOPLE', x, H * 0.22, 120 * u, C.warm, { align: 'left', family: F.lora, weight: '700', maxW: W * 0.9, shadow: rgba(C.warmRGB, 0.7), blur: 50 });
    txt(g, 'have used the most advanced AI', x, H * 0.42, 70 * u, C.ink, { align: 'left', family: F.lora, weight: '700', maxW: W * 0.88, shadow: 'rgba(0,0,0,0.9)', blur: 20 });
    txt(g, 'Where do you stand?', x, H * 0.56, 66 * u, '#e6f3ff', { align: 'left', family: F.loraI, weight: '600', shadow: rgba(C.aiRGB, 0.6), blur: 24 });
  }
  return cv.toDataURL('image/jpeg', 0.93);
};
window.ready = Promise.all([
  document.fonts.load(`40px ${F.hand}`, '就这？'), document.fonts.load(`700 40px ${F.serif}`, '全球只有约用过最前沿的你站在第几层'),
  document.fonts.load(`700 40px ${F.loraI}`, 'THAT'), document.fonts.load(`700 40px ${F.lora}`, 'Same'),
]);
