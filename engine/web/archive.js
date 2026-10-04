// 档案图像：预载，以及纪录片式的缓推缓移（Ken Burns）
const IMG = {};
// 要预载的图片列在片子的 film.json → images；文件在片子目录的 img/ 下
async function loadImages() {
  const cfg = await (await fetch('film.json')).json();
  return Promise.all((cfg.images || []).map((n) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; res(); };
    im.onerror = () => rej(new Error('image ' + n));
    im.src = `img/${n}.jpg`;
  })));
}

// from/to: [cx, cy, frac]：视野中心（图像归一化坐标）与可见高度占图像高度的比例
function kenburns(ctx, name, k, from, to, o = {}) {
  const im = IMG[name];
  const e = o.linear ? k : 0.5 - 0.5 * Math.cos(Math.PI * clamp(k));
  const cx = lerp(from[0], to[0], e), cy = lerp(from[1], to[1], e);
  // 缩放在对数空间插值，推近才显得匀速
  const frac = Math.exp(lerp(Math.log(from[2]), Math.log(to[2]), e));
  const s = H / (frac * im.height);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(im, CX - cx * im.width * s, CY - cy * im.height * s, im.width * s, im.height * s);
  ctx.restore();
  // 档案图统一压一层暗角，与片子的黑场衔接
  if (o.vignette !== false) {
    const g = ctx.createRadialGradient(CX, CY, H * 0.3, CX, CY, H * 1.0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${o.vig ?? 0.75})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // 返回映射函数：图像坐标 → 屏幕
  return (u, v) => [CX + (u - cx) * im.width * s, CY + (v - cy) * im.height * s];
}
