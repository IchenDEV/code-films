// Hip-and-gable roof (irimoya) shared by the hall and the gate.
//
// Shape. Plan view: an eave rectangle (half extents ex x ez). From the eave the
// roof rises as a hip skirt to a smaller rectangle (xs x zg) at height yG, and
// above that a gable roof (two planes) runs to the ridge. All planes share one
// concave profile (steep near the ridge, flatter toward the eave), and the eave
// line is lifted toward the corners. Each plane is its own grid so hips stay
// crisp; tile ribs and joints come from a generated texture plus a bump map.

import * as THREE from 'three';
import { sweep, xf, between, clamp } from './kit.js';
import { fbm2 } from '../../rng.js';

const TILE_W = 1.8; // metres of roof per texture repeat (4 ribs across, 6 tile rows down)

// Tileable noise by blending four offsets (as materials.js does).
function tileNoise(u, v, freq, seed) {
  const f = (a, b) => fbm2(a * freq, b * freq, 4, seed);
  return f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
}

// Roof tile material: M.roofTile with rib/joint colour pattern and a bump map.
export function makeTileMaterial(M) {
  const N = 128;
  const col = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N;
      const phi = (u * 4) % 1, psi = (v * 6) % 1;
      const dr = Math.abs(phi - 0.5);
      const rib = dr < 0.2 ? Math.sqrt(1 - (dr / 0.2) ** 2) : 0;
      const joint = psi < 0.07 ? 1 : 0;
      const h = clamp(0.15 + 0.5 * rib + 0.3 * psi - 0.2 * joint, 0, 1);
      const n = 0.80 + 0.2 * clamp((tileNoise(u, v, 6, 41) - 0.25) / 0.5, 0, 1);
      const shade = n * (0.74 + 0.2 * rib + 0.12 * psi) * (joint ? 0.72 : 1);
      const k = (j * N + i) * 4;
      col[k] = Math.round(255 * shade * 0.96);
      col[k + 1] = Math.round(255 * shade * 0.98);
      col[k + 2] = Math.round(255 * shade);
      col[k + 3] = 255;
      bump[k] = bump[k + 1] = bump[k + 2] = Math.round(255 * h);
      bump[k + 3] = 255;
    }
  }
  const mk = (data, srgb) => {
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  const mat = M.roofTile.clone();
  mat.name = 'roofTileRibbed';
  mat.map = mk(col, true);
  mat.bumpMap = mk(bump, false);
  // Keep ribs readable without letting a subpixel texel turn the normal sideways.
  mat.bumpScale = 0.18;
  return mat;
}

// Grid surface; fn(j, i) -> [x, y, z, u, v]. Winding is chosen so the middle
// quad faces `outward`.
export function grid(nr, nc, fn, outward) {
  const W = nc + 1;
  const pos = new Float32Array((nr + 1) * W * 3);
  const uv = new Float32Array((nr + 1) * W * 2);
  for (let j = 0; j <= nr; j++) {
    for (let i = 0; i <= nc; i++) {
      const [x, y, z, u, v] = fn(j, i);
      const k = j * W + i;
      pos.set([x, y, z], k * 3);
      uv.set([u, v], k * 2);
    }
  }
  const jm = Math.floor(nr / 2), im = Math.floor(nc / 2);
  const P = (j, i) => new THREE.Vector3().fromArray(pos, (j * W + i) * 3);
  const a = P(jm, im);
  const nrm = new THREE.Vector3().crossVectors(P(jm + 1, im).sub(a), P(jm, im + 1).sub(a));
  const flip = nrm.dot(outward) < 0;
  const idx = [];
  for (let j = 0; j < nr; j++) {
    for (let i = 0; i < nc; i++) {
      const a0 = j * W + i, b = a0 + 1, c = a0 + W, d = c + 1;
      if (flip) idx.push(a0, b, c, b, d, c); else idx.push(a0, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Stepped ridge-tile profile, counter-clockwise in (right, up).
function capProfile(s) {
  const pts = [[-0.48, -0.14], [0.48, -0.14], [0.48, 0], [0.38, 0], [0.38, 0.09], [0.28, 0.09], [0.28, 0.14]];
  for (let k = 1; k <= 8; k++) {
    const a = (k / 8) * Math.PI;
    pts.push([0.28 * Math.cos(a), 0.14 + 0.28 * Math.sin(a)]);
  }
  pts.push([-0.28, 0.09], [-0.38, 0.09], [-0.38, 0], [-0.48, 0]);
  return pts.map(([r, u]) => [r * s, u * s]);
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Builds the roof into `bag`. mats: { tile, wood (dark timber), rafter, rafterEnd, gold, plaster }.
// p: { cx, cz, ex, ez, tipY, ridgeY, xs, zgFrac, lift, c, colEx, colEz, flyBottomY,
//      rafterSpacing, rafterRise, purlinOut, scale }
export function buildRoof(bag, mats, p) {
  const { cx, cz, ex: X, ez: D, tipY, ridgeY, xs, lift, colEx, colEz } = p;
  const c = p.c ?? 0.5;
  const zg = D * (p.zgFrac ?? 0.4);
  const H = ridgeY - tipY;
  const f = (u) => c * u + (1 - c) * (1 - (1 - u) * (1 - u));
  const yns = (d) => ridgeY - H * f(d / D);
  const yG = yns(zg);
  const nHip = p.rowsHip ?? 20, nUp = p.rowsUp ?? 8, nc = p.cols ?? 72;
  const s = p.scale ?? 1;

  // Row table, eave first.
  const rows = [];
  for (let j = 0; j <= nHip; j++) {
    const tau = j / nHip;
    const d = D - (D - zg) * tau;
    rows.push({ d, hx: X - (X - xs) * tau, y: yns(d), L: lift * (1 - tau) ** 1.5 });
  }
  for (let j = 1; j <= nUp; j++) {
    const d = zg * (1 - j / nUp);
    rows.push({ d, hx: xs, y: yns(d), L: 0 });
  }
  // Slope length from the eave along the profile, for the tile texture.
  const sNS = [0], sEW = [0];
  for (let j = 1; j < rows.length; j++) {
    const a = rows[j - 1], b = rows[j];
    sNS.push(sNS[j - 1] + Math.hypot(a.d - b.d, a.y - b.y));
    sEW.push(sEW[j - 1] + Math.hypot(a.hx - b.hx, a.y - b.y));
  }
  const cube = (a) => Math.abs(a) ** 3;

  // Roof planes.
  const nr = rows.length - 1;
  for (const sz of [1, -1]) {
    bag.add(mats.tile, grid(nr, nc, (j, i) => {
      const r = rows[j], a = (2 * i) / nc - 1;
      return [cx + a * r.hx, r.y + r.L * cube(a), cz + sz * r.d, (a * r.hx) / TILE_W, sNS[j] / TILE_W];
    }, V3(0, 1, sz)));
  }
  for (const sx of [1, -1]) {
    bag.add(mats.tile, grid(nHip, nc, (j, i) => {
      const r = rows[j], b = (2 * i) / nc - 1;
      return [cx + sx * r.hx, r.y + r.L * cube(b), cz + b * r.d, (b * r.d) / TILE_W, sEW[j] / TILE_W];
    }, V3(sx, 1, 0)));
  }

  // Soffit: underside of the eave between the colonnade line and the tip.
  const soffitRows = (limit) => {
    let n = 0;
    while (n < nHip && limit(rows[n + 1])) n++;
    return n + 1;
  };
  const thick = 0.3;
  const nSN = soffitRows((r) => r.d >= colEz);
  const nSE = soffitRows((r) => r.hx >= colEx);
  for (const sz of [1, -1]) {
    bag.add(mats.wood, grid(nSN, nc, (j, i) => {
      const r = rows[j], a = (2 * i) / nc - 1;
      return [cx + a * r.hx, r.y + r.L * cube(a) - thick, cz + sz * r.d, a * r.hx * 0.3, sNS[j] * 0.3];
    }, V3(0, -1, 0)));
  }
  for (const sx of [1, -1]) {
    bag.add(mats.wood, grid(nSE, nc, (j, i) => {
      const r = rows[j], b = (2 * i) / nc - 1;
      return [cx + sx * r.hx, r.y + r.L * cube(b) - thick, cz + b * r.d, b * r.d * 0.3, sEW[j] * 0.3];
    }, V3(0, -1, 0)));
  }

  // Dark closure wall around the colonnade between the brackets and the soffit.
  const closeY0 = p.closureY0, closeY1 = p.closureY1;
  if (closeY0 !== undefined) {
    const h = closeY1 - closeY0;
    bag.box(mats.wood, 2 * colEx, h, 0.12, cx, closeY0 + h / 2, cz + colEz);
    bag.box(mats.wood, 2 * colEx, h, 0.12, cx, closeY0 + h / 2, cz - colEz);
    bag.box(mats.wood, 0.12, h, 2 * colEz, cx + colEx, closeY0 + h / 2, cz);
    bag.box(mats.wood, 0.12, h, 2 * colEz, cx - colEx, closeY0 + h / 2, cz);
  }

  // Gable faces (plaster) with a frame.
  const nz = 24;
  for (const sx of [1, -1]) {
    bag.add(mats.plaster, grid(1, nz, (j, i) => {
      const z = -zg + (2 * zg * i) / nz;
      const y = j === 0 ? yG : yns(Math.abs(z));
      return [cx + sx * xs, y, cz + z, z * 0.5, y * 0.5];
    }, V3(sx, 0, 0)));
    // Barge boards along both sloped edges.
    for (const side of [1, -1]) {
      const path = [];
      for (let k = 0; k <= 14; k++) {
        const d = zg * (1 - k / 14);
        path.push(V3(cx + sx * xs, yns(d) + 0.05, cz + side * d));
      }
      bag.add(mats.wood, sweep([[-0.16, -0.5 * s], [0.16, -0.5 * s], [0.16, 0.14 * s], [-0.16, 0.14 * s]], path, { closedProfile: true }));
    }
    // Hanging fish (kigyo): a gilded carved board below the apex.
    const apex = yns(0);
    const kig = new THREE.Shape();
    const w = 0.62 * s, hgt = 0.95 * s;
    kig.moveTo(0, 0);
    kig.bezierCurveTo(w * 0.9, -0.05 * hgt, w * 1.0, -0.45 * hgt, w * 0.35, -0.7 * hgt);
    kig.bezierCurveTo(w * 0.2, -0.8 * hgt, w * 0.12, -0.9 * hgt, 0, -hgt);
    kig.bezierCurveTo(-w * 0.12, -0.9 * hgt, -w * 0.2, -0.8 * hgt, -w * 0.35, -0.7 * hgt);
    kig.bezierCurveTo(-w * 1.0, -0.45 * hgt, -w * 0.9, -0.05 * hgt, 0, 0);
    const kg = new THREE.ExtrudeGeometry(kig, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 8 });
    kg.rotateY(Math.PI / 2);
    bag.add(mats.gold, kg, xf(cx + sx * (xs + 0.18), apex - 0.2 * s, cz));
  }

  // Ridge and hip ridges.
  bag.add(mats.tile, sweep(capProfile(1.35 * s), [V3(cx - xs - 0.3, ridgeY + 0.02, cz), V3(cx + xs + 0.3, ridgeY + 0.02, cz)], { closedProfile: true }));
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const path = [];
      for (let j = 0; j <= nHip; j++) {
        const r = rows[j];
        path.push(V3(cx + sx * r.hx, r.y + r.L + 0.04, cz + sz * r.d));
      }
      bag.add(mats.tile, sweep(capProfile(0.95 * s), path, { closedProfile: true }));
    }
    // End tile discs on the ridge.
    bag.add(mats.tile, new THREE.CylinderGeometry(0.34 * s, 0.34 * s, 0.1, 16), xf(cx + sx * (xs + 0.32), ridgeY + 0.22 * s, cz, 0, 0, Math.PI / 2));
  }

  // Eave edge: facia board and round end tiles, walking the lifted tip line.
  const loop = [];
  const step = 0.2;
  const nx = Math.round((2 * X) / step), nz2 = Math.round((2 * D) / step);
  for (let i = 0; i < nx; i++) { const a = -1 + (2 * i) / nx; loop.push({ p: V3(cx + a * X, tipY + lift * cube(a), cz + D), o: V3(0, 0, 1) }); }
  for (let i = 0; i < nz2; i++) { const b = 1 - (2 * i) / nz2; loop.push({ p: V3(cx + X, tipY + lift * cube(b), cz + b * D), o: V3(1, 0, 0) }); }
  for (let i = 0; i < nx; i++) { const a = 1 - (2 * i) / nx; loop.push({ p: V3(cx + a * X, tipY + lift * cube(a), cz - D), o: V3(0, 0, -1) }); }
  for (let i = 0; i < nz2; i++) { const b = -1 + (2 * i) / nz2; loop.push({ p: V3(cx - X, tipY + lift * cube(b), cz + b * D), o: V3(-1, 0, 0) }); }
  bag.add(mats.wood, sweep([[-0.05, -0.3 * s], [0.1, -0.3 * s], [0.1, 0.05], [-0.05, 0.05]], loop.map((l) => l.p), { closedProfile: true, closedPath: true }));
  const disc = new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.05, 14);
  const boss = new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.07, 8);
  const spacing = p.rafterSpacing ?? 0.46;
  const discEvery = Math.round(spacing / step);
  for (let i = 0; i < loop.length; i += discEvery) {
    const l = loop[i];
    const axis = V3(l.o.x, -0.4, l.o.z).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), axis);
    const at = l.p.clone().addScaledVector(l.o, 0.13).add(V3(0, -0.07 * s, 0));
    const m = new THREE.Matrix4().compose(at, q, V3(1, 1, 1));
    bag.add(mats.tile, disc, m);
    bag.add(mats.gold, boss, new THREE.Matrix4().compose(at.clone().addScaledVector(axis, 0.025), q, V3(1, 1, 1)));
  }

  // Rafters: round main rafters and square flying rafters under the eave.
  const out = p.overhang;
  const rise = p.rafterRise ?? 0.3;
  const riseFly = rise * 0.8;
  const sp = spacing;
  const mainCyl = new THREE.CylinderGeometry(0.075 * s, 0.075 * s, 1, 8);
  const flyBox = new THREE.BoxGeometry(0.12 * s, 1, 0.1 * s);
  const cap = new THREE.BoxGeometry(0.13 * s, 0.015, 0.11 * s);
  // side: unit outward direction (ox, oz); along: unit lateral direction; lat0: colonnade half length on that side.
  const sides = [
    { ox: 0, oz: 1, ax: 1, az: 0, half: colEx, base: colEz, tipHalf: X, tipLen: D },
    { ox: 0, oz: -1, ax: 1, az: 0, half: colEx, base: colEz, tipHalf: X, tipLen: D },
    { ox: 1, oz: 0, ax: 0, az: 1, half: colEz, base: colEx, tipHalf: D, tipLen: X },
    { ox: -1, oz: 0, ax: 0, az: 1, half: colEz, base: colEx, tipHalf: D, tipLen: X },
  ];
  const mid = p.flyBottomY;
  const inner = p.purlinOut ?? 1.0;
  for (const sd of sides) {
    const n = Math.floor(sd.tipHalf / sp);
    for (let k = -n; k <= n; k++) {
      const lat = k * sp;
      const over = Math.max(0, Math.abs(lat) - sd.half); // distance beyond the colonnade corner
      const o0 = Math.max(inner, over + 0.15);
      const oTip = out - 0.55;
      if (o0 > oTip - 0.4) continue;
      const a = Math.abs(lat) / sd.tipHalf;
      const yTip = mid + lift * cube(a);
      const pt = (o, y) => V3(cx + sd.ox * (sd.base + o) + sd.ax * lat, y, cz + sd.oz * (sd.base + o) + sd.az * lat);
      const yMain = (o) => yTip + rise * (out - o) + 0.05;
      bag.add(mats.rafter, mainCyl, between(pt(o0, yMain(o0)), pt(oTip, yMain(oTip))));
      // Flying rafter from just inside the main rafter tip to the eave tip.
      const f0 = Math.max(oTip - 0.5, o0);
      const yFly = (o) => yTip + riseFly * (out - o) + 0.05;
      bag.add(mats.rafter, flyBox, between(pt(f0, yFly(f0)), pt(out - 0.02, yFly(out - 0.02))));
      bag.add(mats.rafterEnd, cap, new THREE.Matrix4().compose(
        pt(out - 0.01, yFly(out - 0.01)),
        new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), V3(sd.ox, -riseFly, sd.oz).normalize()),
        V3(1, 1, 1),
      ));
    }
  }

  return { yG, zg, yns, rows };
}
