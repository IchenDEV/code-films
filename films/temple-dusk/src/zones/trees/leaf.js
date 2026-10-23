// Maple (momiji) leaf: outline function, code-rasterised alpha texture with veins,
// a plain card for the canopy and a folded, detailed mesh for the hero cluster.
//
// Leaf space: origin at the petiole base, +y toward the central lobe tip, +z the
// face normal; the leaf radius (base to central tip) is 1.
import * as THREE from 'three';
import { clamp01 } from './common.js';

const LOBES = 7;
const SPACING = 0.6; // radians between lobe axes (34 degrees), 7 lobes fan over +-103 degrees
const LENGTH = [0.46, 0.8, 0.96, 1.0, 0.96, 0.8, 0.46];
const SINUS = [0.32, 0.3, 0.28, 0.28, 0.28, 0.3, 0.32]; // depth of the cut on the outer side of each lobe

// Leaf radius in the direction theta (radians from the central axis, +y = 0).
export function leafRadius(theta) {
  let r = 0.14; // rounded base around the petiole
  for (let k = 0; k < LOBES; k++) {
    const u = Math.abs(theta - (k - 3) * SPACING) / (SPACING * 0.78);
    if (u < 1) r = Math.max(r, LENGTH[k] * (SINUS[k] + (1 - SINUS[k]) * Math.pow(1 - u, 0.85)));
  }
  if (r > 0.3) {
    // saw teeth along the edge
    const s = (theta * 15.5) % 1;
    const tooth = (s < 0 ? s + 1 : s);
    r *= 1 + 0.06 * ((tooth < 0.7 ? tooth / 0.7 : (1 - tooth) / 0.3) - 0.5);
  }
  return r;
}

// Card framing: leaf radius is UNIT of the card width, petiole base at BASE_V.
export const UNIT = 0.46;
const BASE_V = 0.42;

const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay;
  const t = clamp01(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy));
  const ex = px - ax - vx * t, ey = py - ay - vy * t;
  return Math.sqrt(ex * ex + ey * ey);
};

// RGBA texture, grey (colour comes from instance / vertex colour), alpha = leaf outline.
export function makeLeafTexture(size = 512) {
  const data = new Uint8Array(size * size * 4);
  const px = size * UNIT; // pixels per leaf unit
  // Vein segments in leaf units: [ax, ay, bx, by, halfWidth]
  const veins = [];
  for (let k = 0; k < LOBES; k++) {
    const a = (k - 3) * SPACING, L = LENGTH[k] * 0.93;
    const dx = Math.sin(a), dy = Math.cos(a);
    veins.push([0, 0, dx * L, dy * L, 0.014]);
    for (const f of [0.28, 0.5, 0.72]) {
      for (const side of [-1, 1]) {
        const b = a + side * 0.9;
        const l2 = L * (0.32 - 0.12 * f);
        veins.push([dx * L * f, dy * L * f, dx * L * f + Math.sin(b) * l2, dy * L * f + Math.cos(b) * l2, 0.005]);
      }
    }
  }
  // vein strength per pixel, rasterised segment by segment over bounding boxes
  const vein = new Float32Array(size * size);
  for (const s of veins) {
    const hw = s[4];
    const toPx = (u, axis) => (axis === 0 ? (u * UNIT + 0.5) * size : (u * UNIT + BASE_V) * size);
    const i0 = Math.max(0, Math.floor(toPx(Math.min(s[0], s[2]) - hw * 1.3, 0))), i1 = Math.min(size - 1, Math.ceil(toPx(Math.max(s[0], s[2]) + hw * 1.3, 0)));
    const j0 = Math.max(0, Math.floor(toPx(Math.min(s[1], s[3]) - hw * 1.3, 1))), j1 = Math.min(size - 1, Math.ceil(toPx(Math.max(s[1], s[3]) + hw * 1.3, 1)));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const ux = ((i + 0.5) / size - 0.5) / UNIT, uy = ((j + 0.5) / size - BASE_V) / UNIT;
        const v = clamp01(1.2 - segDist(ux, uy, s[0], s[1], s[2], s[3]) / hw);
        if (v > vein[j * size + i]) vein[j * size + i] = v;
      }
    }
  }
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const ux = ((i + 0.5) / size - 0.5) / UNIT, uy = ((j + 0.5) / size - BASE_V) / UNIT;
      const r = Math.sqrt(ux * ux + uy * uy);
      const theta = Math.atan2(ux, uy);
      let alpha = r > 1.1 ? 0 : clamp01((leafRadius(theta) - r) * px * 0.9 + 0.5);
      // petiole stub below the base
      if (uy < 0.02 && uy > -0.2 && Math.abs(ux) < 0.022) alpha = 1;
      let v = 0.9 - 0.12 * clamp01(r); // slightly darker toward the rim
      if (alpha > 0) {
        v -= 0.34 * vein[j * size + i];
        // soft mottling between veins
        v *= 0.94 + 0.06 * Math.sin(ux * 41 + Math.sin(uy * 23) * 2.1) * Math.sin(uy * 37 + ux * 5);
      }
      // row 0 is v = 0 (bottom)
      const k = (j * size + i) * 4;
      const g = Math.round(255 * clamp01(v));
      data[k] = data[k + 1] = data[k + 2] = alpha > 0 ? g : 215;
      data[k + 3] = Math.round(255 * alpha);
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

// Flat card carrying the leaf texture, leaf radius 1.
export function leafCard() {
  const x0 = -0.5 / UNIT, x1 = 0.5 / UNIT, y0 = -BASE_V / UNIT, y1 = (1 - BASE_V) / UNIT;
  const pos = [x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
  g.setAttribute('sway', new THREE.Float32BufferAttribute([0.3, 0.3, 1, 1], 1));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// Detailed leaf for close-ups: a subdivided card cropped to the outline, folded along
// the lobe axes, cupped and drooping. Returns geometry in leaf space scaled by `radius`,
// with per-vertex colour `color` and sway rising toward the tip.
export function heroLeaf(radius, color, base, { grid = 26, cup = 0.1, droop = 0.16, ripple = 0.03, swayAmount = 1 } = {}) {
  const x0 = -0.5 / UNIT, y0 = -BASE_V / UNIT, w = 1 / UNIT;
  const n = grid;
  const pos = [], uv = [], col = [], sway = [];
  const c = new THREE.Color();
  const inside = (ux, uy, pad) => {
    const r = Math.hypot(ux, uy);
    return r <= leafRadius(Math.atan2(ux, uy)) + pad || (r < 0.2 && uy > -0.3);
  };
  const id = new Map();
  const vert = (i, j) => {
    const key = j * (n + 1) + i;
    if (id.has(key)) return id.get(key);
    const ux = x0 + (i / n) * w, uy = y0 + (j / n) * w;
    const r = Math.hypot(ux, uy), th = Math.atan2(ux, uy);
    const z = cup * r * r - droop * Math.max(0, uy) ** 2 + ripple * r * Math.cos(th * (2 * Math.PI / SPACING)) + 0.05 * Math.abs(ux) * (1 - r);
    // droop also pulls the tips slightly toward -y (foreshortening)
    pos.push(ux * radius, (uy - 0.06 * Math.max(0, uy) ** 2) * radius, z * radius);
    uv.push(0.5 + ux * UNIT, BASE_V + uy * UNIT);
    c.copy(base).lerp(color, clamp01((r - 0.1) / 0.6));
    col.push(c.r, c.g, c.b);
    sway.push(swayAmount * clamp01(0.25 + 0.75 * r));
    id.set(key, id.size);
    return id.size - 1;
  };
  const idx = [];
  const step = w / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const cx = x0 + (i + 0.5) * step, cy = y0 + (j + 0.5) * step;
      if (!inside(cx, cy, 1.6 * step)) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('sway', new THREE.Float32BufferAttribute(sway, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
