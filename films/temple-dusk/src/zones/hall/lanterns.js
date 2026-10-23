// Lanterns and lamp stands: the hexagonal bronze hanging lantern (釣燈籠), the
// gate's red paper chōchin (提灯), and the standing candle stands on the altar.

import * as THREE from 'three';
import { xf, lathe, extrudeShape, clamp, smooth } from './kit.js';
import { fbm2 } from '../../rng.js';


// Softer amber glow for the bronze lanterns: the shared flame material clips to white behind a panel.
let _glow;
function lanternGlowMat(m) {
  if (!_glow) {
    _glow = m.lanternGlow.clone();
    _glow.name = 'lanternGlowSoft';
    _glow.color.set('#ffb060');
    _glow.emissive.set('#ff7a22');
    _glow.emissiveIntensity = 2.0;
  }
  return _glow;
}

// ---------------------------------------------------------------------------
// Bronze hanging lantern. y is the centre of the body; chainTopY the fixing point.
// ---------------------------------------------------------------------------

function panelGeometry(w, h) {
  // Plate with a flower-head window (花頭窓) and two small round piercings.
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2, -h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
  const ww = w * 0.34, wh = h * 0.58, y0 = -h * 0.2;
  const win = new THREE.Path();
  win.moveTo(-ww, y0);
  win.lineTo(-ww, y0 + wh * 0.62);
  win.bezierCurveTo(-ww, y0 + wh * 0.8, -ww * 0.3, y0 + wh * 0.82, -ww * 0.12, y0 + wh * 0.9);
  win.lineTo(0, y0 + wh);
  win.lineTo(ww * 0.12, y0 + wh * 0.9);
  win.bezierCurveTo(ww * 0.3, y0 + wh * 0.82, ww, y0 + wh * 0.8, ww, y0 + wh * 0.62);
  win.lineTo(ww, y0);
  win.closePath();
  shape.holes.push(win);
  for (const sx of [-1, 1]) {
    const c = new THREE.Path();
    c.absarc(sx * w * 0.28, h * 0.4, w * 0.05, 0, Math.PI * 2, true);
    shape.holes.push(c);
  }
  return extrudeShape(shape, 0.014, { bevel: 0.003, curveSegments: 10 });
}

// Hexagonal pyramid roof with lifted corners. Returns a BufferGeometry (indexed).
function hexRoof({ rEave, yEave, yTop, lift, rows = 8, cols = 8 }) {
  const pos = [], uv = [], idx = [];
  const profile = (u) => 0.55 * u + 0.45 * (1 - (1 - u) * (1 - u)); // u: 0 at the apex, 1 at the eave
  for (let f = 0; f < 6; f++) {
    const a0 = (f * Math.PI) / 3, a1 = ((f + 1) * Math.PI) / 3;
    const base = pos.length / 3;
    for (let j = 0; j <= rows; j++) {
      const u = 1 - j / rows; // j = 0 at the eave
      const r = Math.max(0.012, rEave * u);
      const y = yTop - (yTop - yEave) * profile(u);
      const L = lift * (1 - u) ** 0 * u ** 1.2;
      for (let i = 0; i <= cols; i++) {
        const t = i / cols, a = Math.abs(2 * t - 1);
        const ax = r * Math.sin(a0), az = r * Math.cos(a0), bx = r * Math.sin(a1), bz = r * Math.cos(a1);
        pos.push(ax + (bx - ax) * t, y + L * a ** 3, az + (bz - az) * t);
        uv.push(t, 1 - u);
      }
    }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function bronzeLantern(bag, m, { x, y, z, rot = 0, chainTopY }) {
  const glowMat = lanternGlowMat(m);
  const R = 0.23, apo = R * Math.cos(Math.PI / 6);
  const yb = -0.28, yt = 0.24;
  const base = xf(x, y, z, 0, rot);
  const at = (geo, lx, ly, lz, ...r) => bag.add(m.bronze, geo, new THREE.Matrix4().multiplyMatrices(base, xf(lx, ly, lz, ...r)));

  // Glow core, seen through the pierced panels.
  const glow = new THREE.CylinderGeometry(0.15, 0.15, yt - yb - 0.02, 6);
  bag.add(glowMat, glow, new THREE.Matrix4().multiplyMatrices(base, xf(0, (yb + yt) / 2, 0, 0, Math.PI / 6)));
  bag.add(glowMat, new THREE.SphereGeometry(0.065, 10, 8), new THREE.Matrix4().multiplyMatrices(base, xf(0, yb + 0.1, 0)));

  const panel = panelGeometry(R * 0.9, yt - yb - 0.05);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    at(panel, Math.sin(a) * apo, (yb + yt) / 2, Math.cos(a) * apo, 0, a);
  }
  // Corner posts and top/bottom hexagonal frames.
  const post = new THREE.CylinderGeometry(0.02, 0.02, yt - yb + 0.04, 8);
  const bar = new THREE.BoxGeometry(R + 0.02, 0.03, 0.04);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    at(post, Math.sin(a) * R, (yb + yt) / 2, Math.cos(a) * R);
    at(new THREE.SphereGeometry(0.026, 8, 6), Math.sin(a) * R, yt + 0.02, Math.cos(a) * R);
    const s = (k * Math.PI) / 3;
    for (const yy of [yb, yt]) at(bar, Math.sin(s) * apo, yy, Math.cos(s) * apo, 0, s);
  }
  // Top plate and tapered base.
  at(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.02, 6), 0, yt + 0.02, 0, 0, Math.PI / 6);
  at(new THREE.CylinderGeometry(R * 1.04, R * 0.62, 0.13, 6), 0, yb - 0.065, 0, 0, Math.PI / 6);
  at(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.025, 6), 0, yb - 0.14, 0, 0, Math.PI / 6);
  at(new THREE.SphereGeometry(0.045, 12, 8), 0, yb - 0.19, 0);
  at(new THREE.ConeGeometry(0.03, 0.12, 8), 0, yb - 0.27, 0, Math.PI);
  at(new THREE.SphereGeometry(0.02, 8, 6), 0, yb - 0.34, 0);

  // Roof with lifted corners, its underside, tip curls and the finial.
  const rEave = 0.42, yEave = yt + 0.05, yTop = yt + 0.27;
  const roof = hexRoof({ rEave, yEave, yTop, lift: 0.07 });
  at(roof, 0, 0, 0);
  const under = hexRoof({ rEave: rEave * 0.97, yEave: yEave - 0.025, yTop: yTop - 0.025, lift: 0.07 });
  const flipped = under.index.array.slice();
  for (let i = 0; i < flipped.length; i += 3) { const t = flipped[i + 1]; flipped[i + 1] = flipped[i + 2]; flipped[i + 2] = t; }
  under.setIndex(Array.from(flipped));
  under.computeVertexNormals();
  at(under, 0, 0, 0);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    const cx = Math.sin(a) * rEave * 1.0, cz = Math.cos(a) * rEave * 1.0;
    at(new THREE.TorusGeometry(0.03, 0.009, 6, 10, Math.PI * 1.25), cx, yEave + 0.07 + 0.015, cz, 0, a + Math.PI / 2, 0);
    at(new THREE.SphereGeometry(0.014, 6, 5), cx, yEave + 0.07, cz);
    at(new THREE.SphereGeometry(0.01, 6, 5), cx, yEave + 0.03 - 0.07, cz);
  }
  const finial = lathe([[0.001, 0], [0.05, 0.012], [0.052, 0.035], [0.034, 0.06], [0.05, 0.085], [0.048, 0.125], [0.026, 0.165], [0.008, 0.2], [0.001, 0.215]], 14);
  at(finial, 0, yTop - 0.012, 0);
  const ringY = yTop + 0.215;
  at(new THREE.TorusGeometry(0.03, 0.007, 6, 12), 0, ringY + 0.02, 0, 0, Math.PI / 2, 0);

  // Chain to the rafters.
  const linkTop = chainTopY - y;
  const link = new THREE.TorusGeometry(0.019, 0.0055, 5, 10);
  const pitch = 0.03;
  const n = Math.floor((linkTop - (ringY + 0.05)) / pitch);
  for (let i = 0; i < n; i++) {
    at(link, 0, ringY + 0.05 + i * pitch, 0, 0, (i % 2) * (Math.PI / 2), 0);
  }
  at(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 12), 0, linkTop, 0);
  at(new THREE.TorusGeometry(0.025, 0.007, 6, 12), 0, linkTop - 0.03, 0, 0, 0, 0);
}

// ---------------------------------------------------------------------------
// Standing candle stand. Returns nothing; flame sits at flameY.
// ---------------------------------------------------------------------------

export function candleStand(bag, m, { x, z, floorY, flameY }) {
  const dishY = flameY - 0.32;
  const base = lathe([[0.001, 0], [0.27, 0], [0.27, 0.03], [0.22, 0.07], [0.12, 0.13], [0.055, 0.2], [0.04, 0.28]], 20);
  bag.add(m.bronze, base, xf(x, floorY, z));
  const shaftTop = dishY - 0.03;
  const shaft = new THREE.CylinderGeometry(0.03, 0.036, shaftTop - floorY - 0.28, 10);
  bag.add(m.bronze, shaft, xf(x, floorY + 0.28 + (shaftTop - floorY - 0.28) / 2, z));
  for (const t of [0.25, 0.5, 0.75]) {
    bag.add(m.bronze, new THREE.TorusGeometry(0.06, 0.018, 6, 14), xf(x, floorY + 0.28 + (shaftTop - floorY - 0.28) * t, z, Math.PI / 2));
  }
  const dish = lathe([[0.001, 0], [0.04, 0], [0.14, 0.035], [0.155, 0.075], [0.135, 0.07], [0.04, 0.03], [0.001, 0.03]], 20);
  bag.add(m.bronze, dish, xf(x, dishY, z));
  const candleH = flameY - dishY - 0.075;
  bag.add(m.plaster, new THREE.CylinderGeometry(0.026, 0.028, candleH, 10), xf(x, dishY + 0.03 + candleH / 2, z));
  bag.add(m.lanternGlow, new THREE.SphereGeometry(0.03, 10, 8), xf(x, flameY, z, 0, 0, 0, 0.75, 1.9, 0.75));
}

// ---------------------------------------------------------------------------
// Chōchin: ribbed red paper lantern with black-lacquer rims.
// ---------------------------------------------------------------------------

// Paper texture: red with hoop lines, black bands and a lotus crest on the south side.
function chochinTexture() {
  const W = 1536, H = 768;
  const data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) {
    const v = j / H; // 0 bottom .. 1 top of the paper
    for (let i = 0; i < W; i++) {
      const u = i / W;
      // Fine paper fibre noise.
      const n = fbm2(u * 90, v * 45, 3, 77);
      let r = 0.86 + 0.14 * n, g = r, b = r;
      let ink = 0;
      // Hoop lines (bamboo ribs): one thin dark line every 1/20 of the height.
      const hoop = Math.abs(((v * 20) % 1) - 0.5);
      const hoopShade = hoop > 0.46 ? 0.8 : 1;
      // Black bands near both ends.
      for (const c of [0.1, 0.9]) ink = Math.max(ink, 1 - smooth(0.009, 0.013, Math.abs(v - c)));
      for (const c of [0.135, 0.865]) ink = Math.max(ink, 1 - smooth(0.003, 0.006, Math.abs(v - c)));
      // Lotus crest centred at u = 0.5, v = 0.5 (8 petals, outlined, with a boss), soft-edged.
      const du = (u - 0.5) * 5.34, dv = (v - 0.5) * 2.0; // metres on the paper
      const rho = Math.hypot(du, dv), phi = Math.atan2(dv, du);
      const petal = 0.46 * (0.5 + 0.5 * Math.abs(Math.cos(4 * phi)) ** 0.8);
      const line = (d, w) => 1 - smooth(w * 0.4, w, Math.abs(d));
      if (rho < 0.5) ink = Math.max(ink, line(rho - petal, 0.016));
      if (rho < petal && rho > 0.1) ink = Math.max(ink, line(Math.sin(4 * phi) * rho * 0.25, 0.006));
      ink = Math.max(ink, 1 - smooth(0.085, 0.095, rho));
      ink = Math.max(ink, line(rho - 0.53, 0.02));
      const f = hoopShade + (0.07 - hoopShade) * ink;
      const k = (j * W + i) * 4;
      data[k] = Math.round(255 * clamp(r * f, 0, 1));
      data[k + 1] = Math.round(255 * clamp(g * f, 0, 1));
      data[k + 2] = Math.round(255 * clamp(b * f, 0, 1));
      data[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function chochin(bag, m, { cx, cy, cz, height, radius, hangY }) {
  const rimH = 0.13, bodyH = height - 2 * rimH;
  const bodyTop = cy + bodyH / 2, bodyBot = cy - bodyH / 2;
  const rEnd = radius * 0.62;
  const profile = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 bottom .. 1 top
    const s = 2 * t - 1;
    const barrel = rEnd + (radius - rEnd) * Math.sqrt(Math.max(0, 1 - s * s));
    const rib = 0.5 + 0.5 * Math.cos(2 * Math.PI * 20 * t);
    profile.push([barrel + 0.012 * rib ** 2, bodyBot + bodyH * t]);
  }
  const body = lathe(profile, 64);
  body.rotateY(Math.PI);
  const paperTex = chochinTexture();
  const paper = m.chochinPaper.clone();
  paper.name = 'chochinPaperPainted';
  paper.color = new THREE.Color('#d0301c');
  paper.map = paperTex;
  paper.emissiveMap = paperTex;
  paper.emissive = new THREE.Color('#ff3a14');
  paper.emissiveIntensity = 0.5;
  // The lathe's v runs along the profile (0 bottom .. 1 top), matching the texture rows.
  bag.add(paper, body, xf(cx, 0, cz));

  // Rims: black lacquer collars with gold trim, top and bottom.
  const rim = (y0, up) => {
    const r0 = rEnd - 0.01;
    const pts = up
      ? [[0.001, 0], [r0 - 0.02, 0], [r0 + 0.07, 0.03], [r0 + 0.075, rimH - 0.03], [r0 + 0.04, rimH], [0.001, rimH]]
      : [[0.001, 0], [r0 + 0.04, 0], [r0 + 0.075, 0.03], [r0 + 0.07, rimH - 0.03], [r0 - 0.02, rimH], [0.001, rimH]];
    bag.add(m.blackLacquer, lathe(pts, 48), xf(cx, y0, cz));
    for (const yy of [y0 + 0.02, y0 + rimH - 0.02]) {
      bag.add(m.goldLeaf, new THREE.TorusGeometry(r0 + 0.073, 0.009, 6, 48), xf(cx, yy, cz, Math.PI / 2));
    }
  };
  rim(bodyTop, true);
  rim(bodyBot - rimH, false);
  // Bottom tassel and top hanging fittings up to the beam.
  const topY = bodyTop + rimH;
  bag.add(m.goldLeaf, new THREE.SphereGeometry(0.045, 12, 8), xf(cx, bodyBot - rimH - 0.04, cz));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    bag.add(m.blackLacquer, new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), xf(cx + Math.sin(a) * 0.03, bodyBot - rimH - 0.18, cz + Math.cos(a) * 0.03));
  }
  bag.add(m.goldLeaf, new THREE.CylinderGeometry(0.05, 0.07, 0.04, 16), xf(cx, topY + 0.02, cz));
  const rod = hangY - topY;
  bag.add(m.blackLacquer, new THREE.CylinderGeometry(0.018, 0.018, rod, 8), xf(cx, topY + rod / 2, cz));
  bag.add(m.goldLeaf, new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), xf(cx, hangY, cz));
  bag.add(m.goldLeaf, new THREE.TorusGeometry(0.04, 0.008, 6, 16), xf(cx, topY + 0.07, cz, 0, Math.PI / 2));
}
