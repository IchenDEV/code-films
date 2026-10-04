// 镜头函数：SHOT[kind] = (ctx, u, dur, sh, t)。u 为镜头内时间，sh[句子id] 是这句旁白在镜头内开始的时刻。
SHOT.stars = (ctx, u, dur, sh) => {
  drawStars(ctx, u, ease(u, 0, 2), H * 0.7 + u * 6, 0.6); // engine/web/assets.js 里的星空
  // 第二句旁白开始时，画面中央亮起一点光
  const k = ease(u, sh.l2 ?? dur / 2, (sh.l2 ?? dur / 2) + 1.5);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, CX, CY - 40, 160, [255, 220, 170], 0.5 * k);
  ctx.restore();
};
SHOT.title = () => {}; // 片名由 text.js 根据 LABELS.title 绘制
