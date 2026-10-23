// Timber details shared by the hall and the gate: columns on stone bases,
// bracket sets (斗栱), purlins, frog-leg struts (蟇股) and lattice.

import * as THREE from 'three';
import { xf, lathe, extrudeOutline } from './kit.js';

// Round column with entasis. Bottom at y = 0, top at y = h.
export function columnGeometry(r, h, segments = 20) {
  const pts = [[0.001, 0], [r * 1.0, 0], [r * 1.01, h * 0.05]];
  for (let k = 1; k <= 8; k++) {
    const t = k / 8;
    const bulge = 1 + 0.035 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) - 0.12 * Math.max(0, t - 0.35) ** 1.3 * 1.4;
    pts.push([r * bulge, h * (0.05 + 0.9 * t)]);
  }
  const top = pts[pts.length - 1][0];
  pts.push([top + 0.025, h * 0.965], [top + 0.025, h], [0.001, h]);
  return lathe(pts, segments);
}

// Round stone base (礎石) with a moulded edge, 0.2 high, bottom at y = 0.
export function baseGeometry(r) {
  return lathe([[0.001, 0], [r * 1.65, 0], [r * 1.65, 0.07], [r * 1.5, 0.12], [r * 1.22, 0.16], [r * 1.12, 0.2], [0.001, 0.2]], 24);
}

// Arm (肘木): profile in the x-y plane (x lengthwise), thickness w along z.
// Bottom corners are cut in two steps; origin at the arm's bottom centre.
export function armGeometry(len, h, w) {
  const l = len / 2, c = Math.min(0.14, len * 0.15);
  const pts = [[-l + c, 0], [l - c, 0], [l - c * 0.4, h * 0.22], [l, h * 0.5], [l, h], [-l, h], [-l, h * 0.5], [-l + c * 0.4, h * 0.22]];
  const g = extrudeOutline(pts, w);
  return g;
}

// Purlin centre height above the column top and its distance out from the column line.
export function bracketPurlin(steps, s) {
  return { y: (0.26 + (steps - 1) * 0.28 + 0.26) * s, out: steps * 0.6 * s };
}

const _cache = new Map();
function cached(key, make) {
  if (!_cache.has(key)) _cache.set(key, make());
  return _cache.get(key);
}

const local = (base, lx, ly, lz, ry = 0) => new THREE.Matrix4().multiplyMatrices(base, xf(lx, ly, lz, 0, ry));

// Three-step (or two-step) bracket set on a column top.
//   x, y0, z: top centre of the column; dirs: outward unit vectors [ox, oz] (axis-aligned);
//   diagonal: add a 45-degree arm set for a corner column; scale s; steps 2 or 3.
// Returns the y of the purlin centre (relative to y0 * s) and its out distance.
export function bracketSet(bag, mat, { x, y0, z, dirs, diagonal = false, s = 1, steps = 3 }) {
  const d = 0.6 * s;
  const dou0 = cached(`dou0${s}`, () => new THREE.BoxGeometry(0.62 * s, 0.08 * s, 0.62 * s));
  const dou1 = cached(`dou1${s}`, () => new THREE.BoxGeometry(0.84 * s, 0.18 * s, 0.84 * s));
  const block = cached(`blk${s}`, () => new THREE.BoxGeometry(0.28 * s, 0.12 * s, 0.28 * s));
  const armH = 0.16 * s;
  const rot = (o) => Math.atan2(o[0], o[1]);
  const all = dirs.map((o) => ({ ry: rot(o), len: 1 }));
  if (diagonal) {
    const o = dirs.length === 2 ? [dirs[0][0] + dirs[1][0], dirs[0][1] + dirs[1][1]] : dirs[0];
    all.push({ ry: rot(o), len: Math.SQRT2 });
  }
  const base0 = xf(x, y0, z);
  bag.add(mat, dou0, local(base0, 0, 0.04 * s, 0));
  bag.add(mat, dou1, local(base0, 0, 0.17 * s, 0));
  const crossLen = [1.7, 1.3, 0.9];
  for (const { ry, len } of all) {
    const base = xf(x, y0, z, 0, ry);
    for (let n = 1; n <= steps; n++) {
      const yA = (0.26 + (n - 1) * 0.28) * s;
      const z0 = ((n - 1) * d - 0.2 * s) * len, z1 = (n * d + 0.2 * s) * len;
      const oa = cached(`oa${n}${len}${s}`, () => armGeometry(z1 - z0, armH, 0.24 * s));
      bag.add(mat, oa, local(base, 0, yA, (z0 + z1) / 2, Math.PI / 2));
      const cl = crossLen[n - 1] * s;
      const ca = cached(`ca${n}${s}`, () => armGeometry(cl, armH, 0.22 * s));
      if (len === 1) bag.add(mat, ca, local(base, 0, yA, (n - 1) * d));
      if (n < steps) {
        bag.add(mat, block, local(base, 0, yA + armH + 0.06 * s, n * d * len, 0));
        if (len === 1) {
          for (const sg of [-1, 1]) bag.add(mat, block, local(base, sg * (cl / 2 - 0.14 * s), yA + armH + 0.06 * s, (n - 1) * d));
        }
      }
    }
  }
  const pu = bracketPurlin(steps, s);
  return { purlinY: y0 + pu.y, purlinOut: pu.out };
}

// Frog-leg strut (蟇股) outline, width w, height h, thickness t; bottom centre at origin.
export function kaerumataGeometry(w, h, t) {
  const hw = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(hw, 0);
  shape.bezierCurveTo(hw * 1.02, h * 0.25, hw * 0.55, h * 0.45, hw * 0.42, h * 0.62);
  shape.bezierCurveTo(hw * 0.38, h * 0.8, hw * 0.3, h * 0.95, 0, h);
  shape.bezierCurveTo(-hw * 0.3, h * 0.95, -hw * 0.38, h * 0.8, -hw * 0.42, h * 0.62);
  shape.bezierCurveTo(-hw * 0.55, h * 0.45, -hw * 1.02, h * 0.25, -hw, 0);
  const hole = new THREE.Path();
  hole.moveTo(0, h * 0.18);
  hole.bezierCurveTo(hw * 0.42, h * 0.2, hw * 0.34, h * 0.52, 0, h * 0.58);
  hole.bezierCurveTo(-hw * 0.34, h * 0.52, -hw * 0.42, h * 0.2, 0, h * 0.18);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -t / 2);
  return g;
}

const boxes = new Map();
export const unit = (w, h, d) => {
  const k = `${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`;
  if (!boxes.has(k)) boxes.set(k, new THREE.BoxGeometry(w, h, d));
  return boxes.get(k);
};

// Box in a wall-line frame: base maps local +z to the outward direction and local x along the wall.
export function lbox(bag, mat, base, w, d, lx, y0, y1, lz = 0) {
  bag.add(mat, unit(w, y1 - y0, d), new THREE.Matrix4().multiplyMatrices(base, xf(lx, (y0 + y1) / 2, lz)));
}

// Vertical bars plus horizontal ties in the wall-line frame.
export function addLattice(bag, mat, base, x0, x1, y0, y1, pitch, bar, depth, lz) {
  const n = Math.max(1, Math.round((x1 - x0) / pitch));
  const geo = unit(bar, y1 - y0, depth);
  for (let i = 0; i < n; i++) {
    const lx = x0 + ((i + 0.5) * (x1 - x0)) / n;
    bag.add(mat, geo, new THREE.Matrix4().multiplyMatrices(base, xf(lx, (y0 + y1) / 2, lz)));
  }
  const tie = unit(x1 - x0, 0.04, depth * 0.8);
  for (const t of [0.33, 0.66]) bag.add(mat, tie, new THREE.Matrix4().multiplyMatrices(base, xf((x0 + x1) / 2, y0 + (y1 - y0) * t, lz)));
}
