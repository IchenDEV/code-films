import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { lathe, grid, roughen } from './kit.js';

const PLAN = [
  { kind: 'gorinto', height: 2.2 },
  { kind: 'gorinto', height: 1.7 },
  { kind: 'hokyointo', height: 1.5 },
  { kind: 'gorinto', height: 1.95 },
];

// One part list per pagoda: [{ geo, mat: 'stone' | 'moss', m: Matrix4 }] in the pagoda's own frame.
export function buildPagodas({ layout, rng }) {
  return layout.precinct.stonePagodas.map((position, i) => {
    const r = rng.fork(`pagoda${i}`);
    const spec = PLAN[i % PLAN.length];
    const parts = (spec.kind === 'gorinto' ? gorinto : hokyointo)(spec.height, r);
    return { position, parts, lean: [r.range(-0.018, 0.018), r.range(-0.018, 0.018)], yaw: r.range(0, Math.PI * 2) };
  });
}

// Move the parts to each pagoda's place on the ground (with its lean and yaw) and add them to S.
export function placePagodas(S, pagodas, terrainHeight) {
  for (const pg of pagodas) {
    const [x, , z] = pg.position;
    const base = new THREE.Matrix4().compose(
      new THREE.Vector3(x, terrainHeight(x, z), z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(pg.lean[0], pg.yaw, pg.lean[1], 'YXZ')),
      new THREE.Vector3(1, 1, 1),
    );
    for (const part of pg.parts) (part.mat === 'moss' ? S.moss : S.stone).add(part.geo, base.clone().multiply(part.m));
  }
}

const T = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));

// Box with bevelled edges and carved noise.
function slab(w, h, d, seed, amp = 0.006) {
  return roughen(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.12), amp, 7, seed);
}

// Concave pyramid roof with upturned corners (kara-hafu style), base side w, height h.
function pyramidRoof(w, h, lift, seed) {
  const half = w / 2;
  const n = 8;
  const curve = (s) => 1 - (1 - s) ** 1.7;
  const geos = [];
  for (let k = 0; k < 4; k++) {
    const g = grid(n, n, (i, j) => {
      const s = i / n, l = -1 + (2 * j) / n; // s: 0 at eave, 1 at top
      const lat = l * half * (1 - 0.82 * s), depth = half * (1 - 0.82 * s);
      const y = h * curve(s) + lift * Math.abs(l) ** 2.5 * (1 - s) ** 1.2;
      return [lat, y, depth];
    }, { face: [0, 1, 1], uScale: 2, vScale: 1.2 });
    const rot = new THREE.Matrix4().makeRotationY((k * Math.PI) / 2);
    geos.push(g.applyMatrix4(rot));
    // Eave face
    const f = grid(1, n, (i, j) => [(-1 + (2 * j) / n) * half, i === 0 ? lift * Math.abs(-1 + (2 * j) / n) ** 2.5 : -0.05 + lift * Math.abs(-1 + (2 * j) / n) ** 2.5, half], { face: [0, 0, 1] });
    geos.push(f.applyMatrix4(rot));
    // Underside
    const u = grid(1, 1, (i, j) => [(j ? 1 : -1) * half, -0.05, i ? 0 : half], { face: [0, -1, 0] });
    geos.push(u.applyMatrix4(rot));
  }
  return geos.map((g) => roughen(g, 0.004, 9, seed));
}

// Soft lumps of moss on the upward-facing surfaces: spots = [[x, y, z, radius], ...].
function mossLumps(spots, r, seed) {
  return spots.map(([x, y, z, rad], i) => ({
    geo: roughen(new THREE.SphereGeometry(rad, 8, 5), rad * 0.5, 14, seed + i),
    mat: 'moss',
    m: T(x, y, z, r.range(1, 1.5), 0.4, r.range(1, 1.5), r.range(0, 3)),
  }));
}

function gorinto(H, r) {
  const parts = [];
  const add = (geo, mat, m) => parts.push({ geo, mat, m });
  const u = H / 1.7;
  const seed = Math.floor(r.range(1, 99));
  // Stepped base: two slabs.
  add(slab(0.62 * u, 0.1 * u, 0.62 * u, seed), 'moss', T(0, 0.05 * u, 0));
  add(slab(0.5 * u, 0.12 * u, 0.5 * u, seed + 1), 'stone', T(0, 0.16 * u, 0));
  // Chi (cube).
  let y = 0.22 * u;
  add(slab(0.4 * u, 0.4 * u, 0.4 * u, seed + 2, 0.008), 'stone', T(0, y + 0.2 * u, 0));
  y += 0.4 * u;
  // Sui (sphere), slightly squashed.
  const ball = roughen(new THREE.SphereGeometry(0.22 * u, 22, 15), 0.007, 6, seed + 3);
  add(ball, 'moss', T(0, y + 0.2 * u, 0, 1, 0.92, 1));
  y += 0.4 * u;
  // Ka (roofed pyramid).
  for (const g of pyramidRoof(0.56 * u, 0.2 * u, 0.06 * u, seed + 4)) add(g, 'moss', T(0, y, 0, 1, 1, 1, r.range(-0.05, 0.05)));
  y += 0.2 * u;
  // Fu (half-moon bowl, flat on top).
  add(roughen(lathe([[0, 0], [0.04, 0], [0.12 * u, 0.02 * u], [0.2 * u, 0.07 * u], [0.24 * u, 0.12 * u], [0.25 * u, 0.15 * u], [0, 0.15 * u]], 20), 0.005, 8, seed + 5), 'stone', T(0, y, 0));
  y += 0.15 * u;
  // Ku (jewel): onion-shaped, with a pointed tip.
  const jewel = [[0, 0], [0.07 * u, 0], [0.11 * u, 0.04 * u], [0.12 * u, 0.1 * u], [0.095 * u, 0.17 * u], [0.05 * u, 0.23 * u], [0.02 * u, 0.28 * u], [0.012 * u, 0.31 * u], [0, 0.33 * u]];
  add(roughen(lathe(jewel, 18), 0.003, 9, seed + 6), 'moss', T(0, y, 0));
  // Moss on the top faces of the lower slabs, the cube and the roof.
  const tops = [[0.1, 0.26], [0.22, 0.2], [0.62, 0.15], [1.2, 0.07]]; // [y of a top face, reach]
  const lumps = [];
  for (let i = 0; i < 10; i++) {
    const [ty, reach] = tops[i % 4];
    const a = r.range(0, Math.PI * 2), rr = r.range(0.3, 1) * reach * u;
    lumps.push([Math.cos(a) * rr, ty * u, Math.sin(a) * rr, r.range(0.03, 0.055) * u]);
  }
  parts.push(...mossLumps(lumps, r, seed + 40));
  return parts;
}

function hokyointo(H, r) {
  const parts = [];
  const add = (geo, mat, m) => parts.push({ geo, mat, m });
  const u = H / 1.4;
  const seed = Math.floor(r.range(100, 199));
  add(slab(0.58 * u, 0.1 * u, 0.58 * u, seed), 'moss', T(0, 0.05 * u, 0));
  add(slab(0.48 * u, 0.14 * u, 0.48 * u, seed + 1), 'stone', T(0, 0.17 * u, 0));
  // Upturned lotus petals around the base block (kaeribana), as a flaring lathe.
  add(roughen(lathe([[0, 0], [0.16 * u, 0], [0.23 * u, 0.02 * u], [0.25 * u, 0.06 * u], [0.22 * u, 0.1 * u], [0.17 * u, 0.12 * u], [0, 0.12 * u]], 20), 0.004, 7, seed + 2), 'stone', T(0, 0.24 * u, 0));
  let y = 0.36 * u;
  add(slab(0.3 * u, 0.3 * u, 0.3 * u, seed + 3, 0.007), 'stone', T(0, y + 0.15 * u, 0)); // body
  y += 0.3 * u;
  // Cap (kasa): five stepped tiers narrowing upward.
  const steps = [0.46, 0.4, 0.34, 0.28, 0.22];
  steps.forEach((w, i) => { add(slab(w * u, 0.055 * u, w * u, seed + 10 + i, 0.004), i % 2 ? 'stone' : 'moss', T(0, y + 0.0275 * u + i * 0.05 * u, 0)); });
  y += 0.25 * u;
  // Corner horns (mimi): leaning plates at the four corners of the top step.
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const horn = new THREE.ConeGeometry(0.045 * u, 0.1 * u, 4);
    horn.rotateY(Math.PI / 4);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(Math.sin(a) * 0.1 * u, y + 0.04 * u, Math.cos(a) * 0.1 * u),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3)),
      new THREE.Vector3(1, 1, 0.5),
    );
    add(horn, 'stone', m);
  }
  y += 0.02 * u;
  // Bowl (fuhachi), lotus ring (ukebana), nine-rings (kurin) and jewel.
  add(roughen(lathe([[0, 0], [0.07 * u, 0], [0.1 * u, 0.03 * u], [0.11 * u, 0.07 * u], [0.09 * u, 0.11 * u], [0.05 * u, 0.13 * u], [0, 0.135 * u]], 16), 0.003, 9, seed + 20), 'moss', T(0, y, 0));
  y += 0.12 * u;
  add(lathe([[0, 0], [0.06 * u, 0], [0.09 * u, 0.02 * u], [0.1 * u, 0.04 * u], [0.06 * u, 0.045 * u], [0.03 * u, 0.045 * u], [0, 0.045 * u]], 16), 'stone', T(0, y, 0));
  y += 0.045 * u;
  const rings = [];
  for (let i = 0; i < 4; i++) rings.push([0.03 * u, i * 0.03 * u], [0.055 * u, i * 0.03 * u + 0.008 * u], [0.055 * u, i * 0.03 * u + 0.018 * u], [0.03 * u, i * 0.03 * u + 0.026 * u]);
  add(lathe([[0, 0], ...rings, [0, 0.12 * u]], 14), 'stone', T(0, y, 0));
  y += 0.12 * u;
  add(roughen(lathe([[0, 0], [0.045 * u, 0], [0.065 * u, 0.04 * u], [0.06 * u, 0.09 * u], [0.03 * u, 0.14 * u], [0.012 * u, 0.17 * u], [0, 0.185 * u]], 14), 0.002, 9, seed + 21), 'moss', T(0, y, 0));
  parts.push(...mossLumps([[0.18 * u, 0.1 * u, 0.1 * u, 0.04 * u], [-0.1 * u, 0.1 * u, 0.2 * u, 0.035 * u], [-0.2 * u, 0.1 * u, -0.12 * u, 0.04 * u], [0.1 * u, 0.36 * u, 0.1 * u, 0.04 * u], [0.0, 0.66 * u, -0.1 * u, 0.04 * u], [-0.09 * u, 0.8 * u, 0.1 * u, 0.03 * u]], r, seed + 40));
  return parts;
}
