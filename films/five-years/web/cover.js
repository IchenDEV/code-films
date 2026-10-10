// 各平台封面：同一套画面语言（光点群 + 琥珀色光标 + 大字），按画幅重新排版。
function coverBloom(ctx) {
  const s1 = makeCanvas(Math.round(W / 4), Math.round(H / 4)), s2 = makeCanvas(s1.width, s1.height);
  const a = s1.getContext('2d'), b = s2.getContext('2d');
  a.filter = 'contrast(1.9) brightness(0.8)'; a.drawImage(ctx.canvas, 0, 0, s1.width, s1.height);
  b.filter = 'blur(4px)'; b.drawImage(s1, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75; ctx.drawImage(s2, 0, 0, W, H); ctx.restore();
}
function pill(g, text, x, y, size, rgb) {
  g.save(); g.font = `600 ${size}px ${F.mono}`; g.textBaseline = 'middle';
  const w = g.measureText(text).width + size * 1.6, h = size * 1.9;
  rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = 'rgba(8,14,26,0.85)'; g.fill();
  g.strokeStyle = rgba(rgb, 0.9); g.lineWidth = 2.5; g.stroke();
  g.fillStyle = rgba(rgb, 1); g.textAlign = 'center'; g.fillText(text, x, y + 1);
  g.restore();
}
window.renderCover = (kind) => {
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const f of INITS) f();
  const zh = TL.lang === 'zh', wide = W > H;
  background(g, 0, { tint: [12, 18, 38], dots: false });
  // 光点群：竖版放在下半部，横版放在右侧
  const cam = { yaw: 0.9, pitch: -0.3, dist: wide ? 900 : 850, fov: wide ? H * 1.1 : W * 1.15, cx: wide ? W * 0.72 : W / 2, cy: wide ? H * 0.5 : H * 0.74 };
  drawSwarm(g, 6, cam, { wave: 0.75 });
  g.globalCompositeOperation = 'lighter'; drawSwarm(g, 6, cam, { wave: 0.75, alpha: 0.5 }); g.globalCompositeOperation = 'source-over';
  glow(g, cam.cx, cam.cy, Math.min(W, H) * 0.35, C.violetRGB, 0.6);
  glow(g, cam.cx, cam.cy, Math.min(W, H) * 0.06, C.whiteRGB, 1, 1);
  // 底部压暗，让字站得住
  const gr = g.createLinearGradient(0, 0, wide ? W : 0, wide ? 0 : H);
  if (wide) { gr.addColorStop(0, 'rgba(3,5,10,0.92)'); gr.addColorStop(0.55, 'rgba(3,5,10,0.55)'); gr.addColorStop(1, 'rgba(3,5,10,0)'); }
  else { gr.addColorStop(0, 'rgba(3,5,10,0.85)'); gr.addColorStop(0.5, 'rgba(3,5,10,0.35)'); gr.addColorStop(1, 'rgba(3,5,10,0.2)'); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  coverBloom(g);
  const disp = zh ? F.displayZH : F.black;
  if (!wide) {
    // 竖版：文字落在中央 3:4 区域内（抖音主页网格会裁成 3:4）
    const top = (H - Math.min(H, W * 4 / 3)) / 2, u = W / 1080;
    const y0 = top + (zh ? 190 : 200) * u;
    pill(g, '2021 → 2026', W / 2, y0, 34 * u, C.amberRGB);
    if (zh) {
      txt(g, '从写代码', W / 2, y0 + 170 * u, 170 * u, C.amber, { family: disp, shadow: rgba(C.amberRGB, 0.7), blur: 40 });
      txt(g, '到 AI 指挥 AI', W / 2, y0 + 360 * u, 190 * u, C.white, { family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50, maxW: W * 0.94 });
      txt(g, '软件开发这五年，到底变了什么？', W / 2, y0 + 510 * u, 58 * u, C.ink, { family: F.cjk, weight: 700, maxW: W * 0.9, shadow: 'rgba(0,0,0,0.9)' });
    } else {
      txt(g, 'FROM WRITING CODE', W / 2, y0 + 150 * u, 96 * u, C.amber, { family: disp, shadow: rgba(C.amberRGB, 0.7), blur: 40, maxW: W * 0.92 });
      txt(g, 'TO AI', W / 2, y0 + 300 * u, 190 * u, C.white, { family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50 });
      txt(g, 'DIRECTING AI', W / 2, y0 + 470 * u, 150 * u, C.white, { family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50, maxW: W * 0.94 });
      txt(g, 'Five years of how we build software', W / 2, y0 + 590 * u, 50 * u, C.ink, { family: F.ui, weight: 600, maxW: W * 0.9, shadow: 'rgba(0,0,0,0.9)' });
    }
    if (zh) { g.save(); setFont(g, 170 * u, disp); const tw = g.measureText('从写代码').width; g.restore(); cursorBar(g, W / 2 + tw / 2 + 24 * u, y0 + 170 * u, 140 * u, 0, C.amberRGB, 1, false); }
  } else {
    const u = H / 1080, x = W * 0.06;
    pill(g, '2021 → 2026', x + 150 * u, H * 0.17, 36 * u, C.amberRGB);
    if (zh) {
      txt(g, '从写代码', x, H * 0.36, 150 * u, C.amber, { align: 'left', family: disp, shadow: rgba(C.amberRGB, 0.7), blur: 40 });
      txt(g, '到 AI 指挥 AI', x, H * 0.56, 190 * u, C.white, { align: 'left', family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50, maxW: W * 0.62 });
      txt(g, '软件开发这五年，到底变了什么？', x, H * 0.76, 60 * u, C.ink, { align: 'left', family: F.cjk, weight: 700, maxW: W * 0.6, shadow: 'rgba(0,0,0,0.9)' });
    } else {
      txt(g, 'FROM WRITING CODE', x, H * 0.34, 92 * u, C.amber, { align: 'left', family: disp, shadow: rgba(C.amberRGB, 0.7), blur: 40, maxW: W * 0.6 });
      txt(g, 'TO AI', x, H * 0.53, 200 * u, C.white, { align: 'left', family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50 });
      txt(g, 'DIRECTING AI', x, H * 0.73, 150 * u, C.white, { align: 'left', family: disp, shadow: rgba(C.cyanRGB, 0.9), blur: 50, maxW: W * 0.6 });
    }
  }
  return cv.toDataURL('image/jpeg', 0.93);
};
window.ready = Promise.all([
  document.fonts.load(`40px ${F.displayZH}`, '从写代码到让指挥这五年'), document.fonts.load(`40px ${F.black}`, 'FROM'),
  document.fonts.load(`20px ${F.mono}`, '2021'), document.fonts.load(`700 20px ${F.cjk}`, '软件'), document.fonts.load(`600 20px ${F.ui}`, 'Five'),
]);
