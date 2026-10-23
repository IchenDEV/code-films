// The seated Buddha: lotus pedestal, robed body in meditation (dhyana mudra),
// flame halo, and the head from face.js. Everything is built in the pedestal's
// frame: origin at the top centre of the pedestal, +Z toward the viewer.

import * as THREE from 'three';
import { xf, lathe, extrudeShape, clamp } from './kit.js';
import { grid } from './roof.js';
import { buildHead, faceCentreLocal } from './face.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Flip triangle winding when the closed mesh has negative signed volume.
function fixWinding(geo) {
  const pos = geo.attributes.position.array, idx = geo.index.array;
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    vol += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  if (vol < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  }
  geo.computeVertexNormals();
  return geo;
}

// Tube along a spline with a radius that varies along its length, closed with fans.
function taperTube(points, radii, { radial = 16, segs = 40 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pts = curve.getSpacedPoints(segs);
  const frames = curve.computeFrenetFrames(segs, false);
  const rAt = (t) => {
    const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f));
    const u = f - i, s = u * u * (3 - 2 * u);
    return radii[i] + (radii[i + 1] - radii[i]) * s;
  };
  const pos = [], idx = [], uv = [];
  for (let i = 0; i <= segs; i++) {
    const r = rAt(i / segs), N = frames.normals[i], B = frames.binormals[i];
    for (let k = 0; k < radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      pos.push(pts[i].x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r, pts[i].y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r, pts[i].z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r);
      uv.push(k / radial, i / segs);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < radial; k++) {
      const k2 = (k + 1) % radial;
      const a = i * radial + k, b = i * radial + k2, c = (i + 1) * radial + k, d = (i + 1) * radial + k2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const c0 = pos.length / 3; pos.push(pts[0].x, pts[0].y, pts[0].z); uv.push(0, 0);
  const c1 = pos.length / 3; pos.push(pts[segs].x, pts[segs].y, pts[segs].z); uv.push(0, 1);
  for (let k = 0; k < radial; k++) {
    const k2 = (k + 1) % radial;
    idx.push(c0, k, k2);
    idx.push(c1, segs * radial + k2, segs * radial + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return fixWinding(g);
}

// Piecewise cubic interpolation (Catmull-Rom tangents) over rows [[y, a, b, c], ...].
function sampleRows(rows, y) {
  let i = 0;
  while (i < rows.length - 2 && y > rows[i + 1][0]) i++;
  const p0 = rows[Math.max(0, i - 1)], p1 = rows[i], p2 = rows[i + 1], p3 = rows[Math.min(rows.length - 1, i + 2)];
  const t = clamp((y - p1[0]) / (p2[0] - p1[0]), 0, 1);
  const h = p2[0] - p1[0];
  return [1, 2, 3].map((k) => {
    const m1 = (p2[k] - p0[k]) / (p2[0] - p0[0]) * h, m2 = (p3[k] - p1[k]) / (p3[0] - p1[0]) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[k] + (t3 - t2) * m2;
  });
}

// y, half-width x, half-depth z, centre z.
const BODY_RINGS = [
  [0.00, 1.30, 0.98, 0.20],
  [0.10, 1.26, 0.93, 0.20],
  [0.28, 1.12, 0.80, 0.18],
  [0.46, 0.90, 0.64, 0.14],
  [0.60, 0.68, 0.48, 0.08],
  [0.80, 0.54, 0.38, 0.02],
  [1.10, 0.60, 0.40, 0.00],
  [1.50, 0.72, 0.40, -0.01],
  [1.88, 0.80, 0.34, -0.03],
  [2.08, 0.52, 0.27, -0.04],
  [2.20, 0.34, 0.27, -0.02],
  [2.32, 0.27, 0.24, 0.00],
  [2.45, 0.225, 0.205, 0.01],
  [2.56, 0.15, 0.14, 0.0],
];
const BODY_P = 2.4;

function bodySurface(a, y) {
  const [rx, rz, cz] = sampleRows(BODY_RINGS, y);
  const sx = Math.sin(a), sz = -Math.cos(a);
  const amp = y < 0.7 ? 0.024 : y < 1.9 ? 0.011 : 0.002;
  const ripple = 0.6 * Math.sin(9 * a + 2.1 * y) + 0.4 * Math.sin(17 * a - 1.3 * y + 1.7);
  const k = 1 + amp * ripple;
  return [
    Math.sign(sx) * Math.abs(sx) ** (2 / BODY_P) * rx * k,
    y,
    cz + Math.sign(sz) * Math.abs(sz) ** (2 / BODY_P) * rz * k,
  ];
}

function bodyGeometry() {
  const rows = 96, cols = 128;
  const y0 = 0, y1 = 2.45;
  const g = grid(rows, cols, (j, i) => {
    const y = y0 + ((y1 - y0) * j) / rows;
    const [x, yy, z] = bodySurface((i / cols) * Math.PI * 2, y);
    return [x, yy, z, i / cols, j / rows];
  }, V3(0, 0, 1));
  // grid() chooses winding from the middle quad; make sure the whole closed shell faces outward.
  return fixWinding(g);
}

function petalGeometry(L, W, bulge, curl) {
  const rows = 12, cols = 10;
  const surf = (t, s, thick) => {
    const hw = (W / 2) * Math.sin(Math.PI * t ** 0.78) ** 0.62;
    const x = s * hw;
    const z = bulge * (1 - s * s) * Math.sin(Math.PI * Math.min(1, t ** 0.7)) + 0.014 * Math.exp(-((s / 0.13) ** 2)) * Math.sin(Math.PI * t) + curl * t ** 3 - thick;
    return [x, L * t - 0.06 * curl * t ** 3, z];
  };
  const mk = (thick, outward) => grid(rows, cols, (j, i) => {
    const t = j / rows, s = (2 * i) / cols - 1;
    const [x, y, z] = surf(t, s, thick);
    return [x, y, z, (s + 1) / 2, t];
  }, outward);
  const front = mk(0, V3(0, 0, 1));
  const back = mk(0.022, V3(0, 0, -1));
  const out = mergeGeometries([front, back], false);
  out.computeVertexNormals();
  return out;
}

function flameOutline(rIn, rOut, n, lean, phase = 0) {
  const pts = [];
  const per = 18;
  for (let f = 0; f < n; f++) {
    for (let k = 0; k < per; k++) {
      const s = k / per;
      const sp = s ** lean;
      const tongue = (1 - Math.abs(2 * sp - 1)) ** 1.35;
      const a = ((f + s) / n) * Math.PI * 2 + phase;
      const r = rIn + (rOut - rIn) * tongue;
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
  }
  return pts;
}

export function buildBuddha({ bag, mats, layout, rng }) {
  const hall = layout.hall, bd = hall.buddha;
  const [px, py, pz] = bd.pedestalCenter;
  const topY = py + bd.pedestalHeight;
  const O = xf(px, topY, pz);
  const placeAt = (matrix) => new THREE.Matrix4().multiplyMatrices(O, matrix);

  // --- Lotus pedestal ---------------------------------------------------------
  const P0 = xf(px, py, pz);
  const atP = (m, geo, matrix) => bag.add(m, geo, new THREE.Matrix4().multiplyMatrices(P0, matrix));
  atP(mats.lacquer, lathe([[0.001, 0], [1.95, 0], [1.95, 0.06], [1.82, 0.1], [1.82, 0.2], [1.7, 0.26], [1.7, 0.3], [0.001, 0.3]], 64), xf());
  for (const [r, y] of [[1.9, 0.07], [1.84, 0.2], [1.72, 0.28]]) atP(mats.gold, new THREE.TorusGeometry(r, 0.022, 6, 64), xf(0, y, 0, Math.PI / 2));
  const rings = [
    { n: 16, base: 1.36, y: 0.28, tilt: 0.70, L: 0.64, W: 0.8, bulge: 0.07, curl: 0.07, phase: 0 },
    { n: 16, base: 1.16, y: 0.5, tilt: 0.44, L: 0.6, W: 0.74, bulge: 0.06, curl: 0.05, phase: 0.5 },
    { n: 16, base: 0.98, y: 0.78, tilt: 0.2, L: 0.46, W: 0.64, bulge: 0.05, curl: 0.03, phase: 0 },
  ];
  for (const rg of rings) {
    const pet = petalGeometry(rg.L, rg.W, rg.bulge, rg.curl);
    for (let k = 0; k < rg.n; k++) {
      const a = ((k + rg.phase) / rg.n) * Math.PI * 2;
      atP(mats.gold, pet, xf(Math.sin(a) * rg.base, rg.y, Math.cos(a) * rg.base, rg.tilt, a, 0));
    }
  }
  atP(mats.gold, lathe([[0.001, 1.04], [1.1, 1.04], [1.38, 1.12], [1.52, 1.2], [1.46, 1.27], [1.2, 1.3], [0.001, 1.3]], 64), xf());
  const bead = new THREE.SphereGeometry(0.04, 8, 6);
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    atP(mats.gold, bead, xf(Math.sin(a) * 1.5, 1.2, Math.cos(a) * 1.5));
  }

  // --- Robed body --------------------------------------------------------------
  bag.add(mats.gilt, bodyGeometry(), O);
  // Three folds of the neck (sando), a mark of a Buddha image.
  for (const y of [2.25, 2.32, 2.39]) {
    const [rx, rz, cz] = sampleRows(BODY_RINGS, y);
    const ring = new THREE.TorusGeometry(1, 0.006, 6, 48).rotateX(Math.PI / 2);
    ring.scale(rx * 1.02, 1, rz * 1.02);
    ring.translate(0, y, cz);
    bag.add(mats.gilt, ring, O);
  }

  // Arms: sleeves running from the shoulders to the lap, hands in dhyana mudra.
  for (const sg of [-1, 1]) {
    const pts = [V3(sg * 0.74, 1.88, -0.02), V3(sg * 0.87, 1.45, 0.0), V3(sg * 0.9, 1.0, 0.08), V3(sg * 0.76, 0.78, 0.3), V3(sg * 0.48, 0.7, 0.5), V3(sg * 0.24, 0.66, 0.6)];
    bag.add(mats.gilt, taperTube(pts, [0.19, 0.205, 0.185, 0.165, 0.15, 0.17], { radial: 18, segs: 44 }), O);
  }
  // Hands: right over left, thumbs meeting at the top.
  const hand = new THREE.SphereGeometry(1, 20, 12);
  bag.add(mats.gilt, hand, placeAt(xf(-0.01, 0.655, 0.6, 0, 0.0, 0, 0.21, 0.05, 0.15)));
  bag.add(mats.gilt, hand, placeAt(xf(0.02, 0.705, 0.58, 0, 0.0, 0, 0.2, 0.045, 0.15)));
  const finger = new THREE.CapsuleGeometry(0.018, 0.13, 4, 8);
  for (let f = 0; f < 4; f++) {
    for (const [hx, hy, sgn] of [[0.02, 0.735, 1], [-0.01, 0.685, -1]]) {
      bag.add(mats.gilt, finger, placeAt(xf(hx + sgn * 0.0, hy, 0.5 + f * 0.036, 0, 0, Math.PI / 2, 1, 1, 1)));
    }
  }
  const thumb = new THREE.CapsuleGeometry(0.022, 0.12, 4, 8);
  bag.add(mats.gilt, thumb, placeAt(xf(-0.05, 0.775, 0.5, 0, 0, -1.15)));
  bag.add(mats.gilt, thumb, placeAt(xf(0.05, 0.775, 0.5, 0, 0, 1.15)));

  // Robe hems on the chest: nested U-curves.
  for (const [off, r] of [[0, 0.03], [-0.12, 0.026], [-0.24, 0.022]]) {
    const pts = [];
    for (let k = 0; k <= 28; k++) {
      const x = -0.62 + (k / 28) * 1.24;
      const y = 1.78 + off - 0.44 * (1 - (x / 0.62) ** 2) * (1 - 0.0);
      const [rx, rz, cz] = sampleRows(BODY_RINGS, y);
      const z = cz + rz * Math.sqrt(Math.max(0.0, 1 - (x / rx) ** 2)) + 0.012;
      pts.push(V3(x, y, z));
    }
    bag.add(mats.gilt, taperTube(pts, [r * 0.4, r, r, r * 0.4], { radial: 8, segs: 28 }), O);
  }
  // Fold ridges across the lap.
  for (let k = -5; k <= 5; k++) {
    const x0 = k * 0.22;
    const pts = [];
    for (let j = 0; j <= 10; j++) {
      const y = 0.56 - j * 0.05;
      const [rx, rz, cz] = sampleRows(BODY_RINGS, Math.max(0.02, y));
      const x = clamp(x0 * (1 + (0.56 - y) * 1.1), -0.85 * rx, 0.85 * rx);
      const z = cz + rz * Math.sqrt(Math.max(0.0, 1 - (x / rx) ** 2)) + 0.01;
      pts.push(V3(x, y, z));
    }
    bag.add(mats.gilt, taperTube(pts, [0.012, 0.02, 0.016, 0.006], { radial: 6, segs: 12 }), O);
  }

  // --- Head ------------------------------------------------------------------------
  const [fdy, fz] = faceCentreLocal();
  const fc = bd.faceCenter;
  const headOrigin = [fc[0], fc[1] - fdy, fc[2] - fz];
  const head = buildHead({ origin: headOrigin, rng, mats });

  // --- Halo --------------------------------------------------------------------------
  const hc = { y: 2.55, z: -0.98 };
  const R = bd.haloRadius;
  const H0 = xf(px, topY + hc.y, pz + hc.z);
  const atH = (m, geo, matrix = xf()) => bag.add(m, geo, new THREE.Matrix4().multiplyMatrices(H0, matrix));
  const flames1 = extrudeShape(new THREE.Shape(flameOutline(R * 0.62, R, 28, 1.35)), 0.07, { bevel: 0.012, curveSegments: 4 });
  atH(mats.halo, flames1, xf(0, 0, 0.035));
  const sh2 = new THREE.Shape(flameOutline(R * 0.56, R * 0.84, 28, 1.5, Math.PI / 28));
  const hole = new THREE.Path();
  hole.absarc(0, 0, R * 0.5, 0, Math.PI * 2, true);
  sh2.holes.push(hole);
  atH(mats.gold, extrudeShape(sh2, 0.05, { bevel: 0.01, curveSegments: 4 }), xf(0, 0, 0.1));
  atH(mats.lacquer, new THREE.CylinderGeometry(R * 0.56, R * 0.56, 0.07, 64), xf(0, 0, 0.11, Math.PI / 2));
  for (const [r, z, t] of [[R * 0.56, 0.15, 0.035]]) atH(mats.gold, new THREE.TorusGeometry(r, t, 8, 64), xf(0, 0, z));
  // Head halo: a ring with a lacquer disc behind the head.
  const hh = xf(px, topY + 2.82, pz - 0.56);
  bag.add(mats.lacquer, new THREE.CylinderGeometry(0.66, 0.66, 0.05, 48), new THREE.Matrix4().multiplyMatrices(hh, xf(0, 0, 0, Math.PI / 2)));
  bag.add(mats.gold, new THREE.TorusGeometry(0.66, 0.035, 8, 48), new THREE.Matrix4().multiplyMatrices(hh, xf(0, 0, 0.03)));
  // Stem holding the halo.
  bag.box(mats.gold, 0.16, 1.4, 0.12, px, topY + 1.5, pz + hc.z - 0.15);

  return { head: head.group, curlCount: head.curlCount };
}
