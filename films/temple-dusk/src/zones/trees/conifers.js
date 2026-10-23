// Black pine (kuromatsu) with sculpted needle pads, and cedar (sugi) with a tall
// straight trunk and a narrow tiered crown. Both build a dark "mass" mesh (the
// pad / tier surface that reads solid from far away) plus needle cards on top.
import * as THREE from 'three';
import { V3, tube, spline, taper, leafMatrix, hn, clamp01, smooth } from './common.js';
import { fbm2 } from '../../rng.js';

const PINE_BARK = new THREE.Color('#2f2723');
const CEDAR_BARK = new THREE.Color('#3f2f28');
const PINE_DARK = new THREE.Color('#0c1609');
const PINE_LIGHT = new THREE.Color('#2f4a1d');
const CEDAR_DARK = new THREE.Color('#0f1c14');
const CEDAR_LIGHT = new THREE.Color('#25402a');

// Needle spray texture: a fan of fine needles from the bottom centre. Grey (colour
// comes from the instance), alpha = needles, lighter toward the tips.
export function makeNeedleTexture(rng, size = 256) {
  const data = new Uint8Array(size * size * 4);
  const needles = [];
  for (let i = 0; i < 70; i++) {
    const a = rng.gauss() * 0.75;
    const l = rng.range(0.45, 0.8) * (1 - 0.25 * Math.min(1, Math.abs(a)));
    needles.push([Math.sin(a) * l, Math.cos(a) * l, rng.range(0.9, 1.1)]);
  }
  const bx = 0.5, by = 0.04;
  const w = 0.008;
  const cover = new Float32Array(size * size);
  const tone = new Float32Array(size * size);
  for (const [nx, ny, wm] of needles) {
    const len2 = nx * nx + ny * ny;
    const pad = w * wm + 2 / size;
    const i0 = Math.max(0, Math.floor((bx + Math.min(0, nx) - pad) * size)), i1 = Math.min(size - 1, Math.ceil((bx + Math.max(0, nx) + pad) * size));
    const j0 = Math.max(0, Math.floor((by + Math.min(0, ny) - pad) * size)), j1 = Math.min(size - 1, Math.ceil((by + Math.max(0, ny) + pad) * size));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const x = (i + 0.5) / size - bx, y = (j + 0.5) / size - by;
        const t = clamp01((x * nx + y * ny) / len2);
        const ex = x - nx * t, ey = y - ny * t;
        const d = Math.sqrt(ex * ex + ey * ey);
        const c = clamp01((w * wm * (1 - 0.7 * t) - d) * size * 0.8 + 0.5);
        if (c > cover[j * size + i]) { cover[j * size + i] = c; tone[j * size + i] = 0.55 + 0.45 * t; }
      }
    }
  }
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const o = j * size + i;
      const k = (j * size + i) * 4;
      const g = Math.round(255 * tone[o]);
      data[k] = data[k + 1] = data[k + 2] = cover[o] > 0 ? g : 150;
      data[k + 3] = Math.round(255 * cover[o]);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// Needle card: unit width, base at the origin, +y outward.
export function needleCard() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.04, 0, 0.5, -0.04, 0, 0.5, 0.96, 0, -0.5, 0.96, 0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
  g.setAttribute('sway', new THREE.Float32BufferAttribute([0.2, 0.2, 1, 1], 1));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// Noise-displaced pad: flattened ball, flat underside, lumpy top. Mass-mesh attributes.
export function padGeometry(rx, ry, seed, dark, light, { lump: lumpAmp = 0.5, flat = 0.35 } = {}) {
  const g = new THREE.SphereGeometry(1, 20, 10);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const sw = new Float32Array(p.count);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm2(x * 2.4 + y * 1.3 + seed, z * 2.4 - y * 1.7 + seed * 0.7, 3, 11);
    const lump = 1 - lumpAmp * 0.45 + lumpAmp * n;
    const sy = y < 0 ? ry * flat : ry;
    p.setXYZ(i, x * rx * lump, y * sy * lump, z * rx * lump);
    const top = smooth(-0.3, 0.9, y) * (0.6 + 0.4 * n);
    c.copy(dark).lerp(light, top * 0.75);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    sw[i] = 0.3 + 0.4 * clamp01(y);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('sway', new THREE.BufferAttribute(sw, 1));
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

// Needle cards over a pad's upper surface (pad centre at world `c`), lying on the dome and
// splaying outward like a tuft.
function padCards(ctx, rng, c, rx, ry, count, size, tone) {
  const dir = V3(), n = V3(), tip = V3(), pos = V3(), tan = V3();
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = rng.range(0, 6.283);
    const u = rng.range(-0.3, 1);
    const y = u < 0 ? u : u ** 0.8; // height on the unit sphere, biased up
    const h = Math.sqrt(1 - y * y);
    dir.set(Math.cos(a) * h, y, Math.sin(a) * h);
    pos.set(c.x + dir.x * rx * 0.9, c.y + dir.y * (dir.y < 0 ? ry * 0.35 : ry) * 0.92, c.z + dir.z * rx * 0.9);
    tan.set(Math.cos(a) * y, -h, Math.sin(a) * y); // downhill along the meridian
    n.copy(dir).multiplyScalar(0.7).add(V3(rng.gauss() * 0.3, 0.4, rng.gauss() * 0.3)).normalize();
    tip.copy(dir).multiplyScalar(0.55).addScaledVector(tan, 0.6).add(V3(rng.gauss() * 0.5, rng.gauss() * 0.2, rng.gauss() * 0.5)).normalize();
    const m = leafMatrix(pos, tip, n, size * rng.range(0.8, 1.25));
    col.copy(tone).multiplyScalar(rng.range(0.7, 1.25));
    if (rng.chance(0.25)) col.lerp(PINE_LIGHT, 0.55);
    ctx.cards.push(m, col.clone());
  }
}

export function buildPine({ layout, tree, rng, ctx }) {
  const H = tree.height, R = tree.crown;
  const [px, , pz] = tree.position;
  const gy = layout.terrainHeight(px, pz);
  const base = V3(px, gy, pz);

  // Twisted trunk: S-curve leaning, thick flared foot.
  const lean = rng.range(0, 6.283), amp = rng.range(0.35, 0.6);
  const ctrl = [];
  const nC = 7;
  for (let i = 0; i < nC; i++) {
    const t = i / (nC - 1);
    const sx = Math.sin(t * 5.2 + lean) * amp * t * (1 - 0.4 * t);
    const sz = Math.cos(t * 4.1 + lean * 1.7) * amp * 0.6 * t;
    ctrl.push(V3(sx + Math.cos(lean) * 0.25 * t * t * 1.5, -0.3 + t * (H * 0.9 + 0.3), sz + Math.sin(lean) * 0.25 * t * t * 1.5));
  }
  const pts = spline(ctrl, 30);
  const r0 = 0.2 + H * 0.014;
  const radii = taper(pts.length, r0, 0.05, 0.85).map((r, i) => r * (i < 3 ? 1.3 - 0.1 * i : 1));
  const tg = tube(pts, radii, 10, PINE_BARK, { vScale: 1.2, jitter: 0.22 });
  tg.translate(base.x, base.y, base.z);
  ctx.bark.push(tg);
  const trunkAtT = (t) => pts[Math.min(pts.length - 1, Math.round(t * (pts.length - 1)))];

  // Branches ending in pads, spiralling up, shorter toward the top.
  const nB = 6;
  let az = rng.range(0, 6.283);
  for (let i = 0; i < nB; i++) {
    const t = 0.34 + 0.6 * i / (nB - 1);
    const s = trunkAtT(t);
    az += 2.4 + rng.range(-0.35, 0.35);
    const reach = R * (1.0 - 0.55 * (i / (nB - 1))) * rng.range(0.85, 1.1);
    const dir = V3(Math.sin(az), 0, -Math.cos(az));
    const up = 0.35 + 0.1 * i;
    const end = s.clone().addScaledVector(dir, reach).add(V3(0, up * 0.7 - 0.2, 0));
    const mid1 = s.clone().addScaledVector(dir, reach * 0.4).add(V3(rng.gauss() * 0.2, 0.25 + up * 0.2, rng.gauss() * 0.2));
    const mid2 = s.clone().addScaledVector(dir, reach * 0.75).add(V3(rng.gauss() * 0.2, up * 0.5, rng.gauss() * 0.2));
    const bp = spline([s.clone(), mid1, mid2, end], 10);
    const bt = tube(bp, taper(bp.length, radii[Math.round(t * (radii.length - 1))] * 0.5, 0.025, 0.8), 6, PINE_BARK, { vScale: 1.4 });
    bt.translate(base.x, base.y, base.z);
    ctx.bark.push(bt);
    // main pad at the end of the branch, plus a smaller one inward
    const pads = [[end, R * 0.42 * rng.range(0.85, 1.15)], [mid2.clone().add(V3(0, 0.15, 0)), R * 0.26]];
    if (i === nB - 1) pads.push([end.clone().add(V3(0, 0.55, 0)), R * 0.3]);
    for (const [c, rx] of pads) {
      const ry = rx * 0.6;
      const pg = padGeometry(rx * 0.65, ry * 0.65, i * 3.7 + px, PINE_DARK, PINE_LIGHT);
      pg.translate(base.x + c.x, base.y + c.y + ry * 0.2, base.z + c.z);
      ctx.mass.push(pg);
      padCards(ctx, rng, V3(base.x + c.x, base.y + c.y + ry * 0.2, base.z + c.z), rx, ry, Math.round(170 + rx * 280), 0.3 + rx * 0.08, new THREE.Color('#22381a'));
    }
  }
}

export function buildCedar({ layout, tree, rng, ctx }) {
  const H = tree.height, R = tree.crown;
  const [px, , pz] = tree.position;
  const gy = layout.terrainHeight(px, pz);
  const base = V3(px, gy, pz);

  // Tall straight trunk, slightly tapered, fluted.
  const lean = V3(rng.gauss() * 0.02, 1, rng.gauss() * 0.02).normalize();
  const n = 18;
  const pts = Array.from({ length: n }, (_, i) => lean.clone().multiplyScalar(-0.4 + (i / (n - 1)) * (H * 0.97 + 0.4)).add(V3(Math.sin(i * 0.5 + px) * 0.05, 0, Math.cos(i * 0.4 + pz) * 0.05)));
  const radii = taper(n, 0.26 + H * 0.007, 0.03, 0.6).map((r, i) => r * (i < 2 ? 1.25 : 1));
  const tg = tube(pts, radii, 10, CEDAR_BARK, { vScale: 0.8, jitter: 0.28 });
  tg.translate(base.x, base.y, base.z);
  ctx.bark.push(tg);

  // Small opaque cores sit inside fine drooping sprays. Keep gaps between
  // branches so the avenue trees do not read as stacked solid balloons.
  const crownBottom = H * 0.3;
  const tiers = Math.round(18 + H * 0.5);
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1); // 0 low, 1 high
    const y = crownBottom + f * (H * 0.98 - crownBottom);
    const rad = R * Math.pow(1 - f, 0.8) * rng.range(0.85, 1.1) + 0.12;
    // Several lumpy, drooping clumps per whorl instead of a solid skirt, so the crown
    // silhouette breaks up like a real sugi.
    const ph = rng.range(0, 6.283);
    const nClump = Math.max(1, Math.round(1 + 5 * Math.pow(1 - f, 0.8)));
    for (let j = 0; j < nClump; j++) {
      const a = ph + (j / nClump) * 6.283 + rng.range(-0.3, 0.3);
      const rr = nClump === 1 ? 0 : rad * rng.range(0.45, 0.8);
      const branch = tube([
        lean.clone().multiplyScalar(y),
        V3(Math.cos(a) * rr * 0.55, y - 0.08, Math.sin(a) * rr * 0.55),
        V3(Math.cos(a) * rr, y - 0.3, Math.sin(a) * rr),
      ], [0.025 * (1 - f) + 0.008, 0.015, 0.005], 5, CEDAR_BARK, { jitter: 0.1 });
      branch.translate(base.x, base.y, base.z);
      ctx.bark.push(branch);
    }
    // drooping spray cards around the rim
    const nCard = Math.round(40 + 80 * rad / R);
    const pos = V3(), nrm = V3(), tip = V3();
    const col = new THREE.Color();
    for (let i = 0; i < nCard; i++) {
      const a = ph + rng.range(0, 6.283);
      const rr = rad * rng.range(0.55, 1.0);
      pos.set(base.x + Math.cos(a) * rr, base.y + y - 0.5 - rng.range(0, 0.35), base.z + Math.sin(a) * rr);
      tip.set(Math.cos(a), -0.55 - rng.next() * 0.3, Math.sin(a)).normalize();
      nrm.set(Math.cos(a) * 0.3 + rng.gauss() * 0.3, 1, Math.sin(a) * 0.3 + rng.gauss() * 0.3).normalize();
      const m = leafMatrix(pos, tip, nrm, rng.range(0.32, 0.6) * (0.8 + 0.5 * rad / R));
      col.copy(CEDAR_LIGHT).lerp(CEDAR_DARK, 0.3).multiplyScalar(rng.range(0.7, 1.15));
      ctx.cards.push(m, col.clone());
    }
  }
}
