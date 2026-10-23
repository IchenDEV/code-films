// Forest on the hills outside the wall: low-poly instanced cedars, pines and maples.
// Species geometry is built once at unit height (base at y = 0); placement uses a
// jittered grid thinned by a density field (dense and tall to the north, light east and south).
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V3, tube, hn, keep, smooth, clamp01, leafMatrix, addSway, paint } from './common.js';
import { valueNoise2, fbm2 } from '../../rng.js';
import { autumn } from './maple.js';
import { needleCard } from './conifers.js';
import { leafCard } from './leaf.js';

const deg = Math.PI / 180;

// Unit height, base at y = 0. Near trees use branch sprays; only distant trees
// use noise-displaced masses, where their individual leaves are subpixel.

// One foliage clump: displaced icosphere, darker underneath and inside.
function clump(parts, { x, y, z, rx, ry, seed, dark, light, sun = 0.55 }) {
  const ico = new THREE.IcosahedronGeometry(1, 0);
  ico.deleteAttribute('uv');
  ico.deleteAttribute('normal');
  const g = mergeVertices(ico);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let v = 0; v < p.count; v++) {
    const ux = p.getX(v), uy = p.getY(v), uz = p.getZ(v);
    // Correlated surface variation keeps branch clumps organic; independent
    // random displacement at each vertex produced angular rock-like crowns.
    const n = 0.82 + 0.36 * fbm2(ux * 3.1 + uy * 1.7 + seed, uz * 2.9 - uy * 1.3, 3, 73);
    const flat = uy < 0 ? 0.45 : 1;
    p.setXYZ(v, x + ux * rx * n, y + uy * ry * n * flat, z + uz * rx * n);
    const top = smooth(-0.6, 1, uy) * sun + (1 - sun) * hn(v * 0.37, seed, 1.3);
    c.copy(dark).lerp(light, top * (0.55 + 0.45 * n - 0.3));
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  parts.push(keep(g, ['position', 'normal', 'color']));
}

function trunkPart(parts, top, r0, color, lean = 0) {
  const t = tube([V3(0, -0.02, 0), V3(lean * 0.4, top * 0.5, 0), V3(lean, top, 0)], [r0, r0 * 0.75, r0 * 0.4], 5, color, { jitter: 0.15 });
  parts.push(keep(t, ['position', 'normal', 'color']));
}

// Sugi: straight trunk, narrow cone of drooping clumps in irregular whorls.
function cedarParts(seed) {
  const parts = [];
  const dark = new THREE.Color('#0b1710'), light = new THREE.Color('#2c4a30');
  trunkPart(parts, 0.9, 0.016, new THREE.Color('#4a2a1e'));
  const tiers = 7;
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1);
    const y = 0.24 + f * 0.66;
    const R = 0.17 * Math.pow(1 - f * 0.85, 0.85);
    const n = Math.max(1, Math.round(2.6 * (1 - f) + 1));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * 6.283 + k * 2.1 + seed + hn(k, j, seed) * 0.8;
      const rr = n === 1 ? 0 : R * (0.45 + 0.4 * hn(j, k + 0.5, seed));
      const sz = (R * 0.75 + 0.022) * (0.8 + 0.4 * hn(k + 0.2, j, seed));
      clump(parts, {
        x: Math.cos(a) * rr, y: y - 0.02 * hn(j, k, seed + 2), z: Math.sin(a) * rr,
        rx: sz, ry: sz * (k === tiers - 1 ? 1.6 : 0.85), seed: seed + k * 7 + j, dark, light,
      });
    }
  }
  return parts;
}

// Black/red pine: leaning trunk with a few flat-topped needle clouds.
function pineParts(seed) {
  const parts = [];
  const dark = new THREE.Color('#0f1d0b'), light = new THREE.Color('#3a5524');
  const lean = (hn(seed, 1) - 0.5) * 0.12;
  trunkPart(parts, 0.78, 0.02, new THREE.Color('#3a2c24'), lean);
  const clouds = 4;
  for (let i = 0; i < clouds; i++) {
    const f = i / (clouds - 1);
    const a = i * 2.4 + seed;
    const r = 0.2 * (1 - 0.6 * f) * (0.6 + 0.5 * hn(i, seed));
    const cx = Math.cos(a) * r + lean * (0.5 + f), cz = Math.sin(a) * r, cy = 0.5 + 0.42 * f;
    const sz = 0.17 * (1 - 0.45 * f) * (0.8 + 0.4 * hn(i + 0.3, seed));
    clump(parts, { x: cx, y: cy, z: cz, rx: sz, ry: sz * 0.38, seed: seed + i, dark, light, sun: 0.75 });
  }
  return parts;
}

// Broadleaf (maple / zelkova): forked trunk, rounded crown of many clumps. Grey vertex
// colours: the instance colour carries the autumn tint.
function broadleafParts(seed) {
  const parts = [];
  const dark = new THREE.Color('#5a5a5a'), light = new THREE.Color('#ffffff');
  trunkPart(parts, 0.5, 0.022, new THREE.Color('#4a3c33'));
  const n = 6;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const yy = 1 - 2 * u, rr = Math.sqrt(1 - yy * yy), a = i * 2.39996 + seed;
    const cx = Math.cos(a) * rr * 0.26, cz = Math.sin(a) * rr * 0.26, cy = 0.66 + yy * 0.2;
    const sz = 0.15 * (0.75 + 0.5 * hn(i, seed)) * 1.35;
    clump(parts, { x: cx, y: cy, z: cz, rx: sz, ry: sz * 0.8, seed: seed + i, dark, light, sun: 0.6 });
  }
  return parts;
}

// Near trees use actual branch sprays with cutout needles/leaves. Two material
// groups share one instanced mesh: wood, then foliage. Far trees keep cheap masses.
function nearTree(seed, kind) {
  const wood = [], cards = [];
  const broadleaf = kind === 'maple';
  const cedar = kind === 'cedar';
  const bark = new THREE.Color('#45372d');
  const foliage = new THREE.Color(broadleaf ? '#c3c3c3' : cedar ? '#29412e' : '#304321');
  const card = broadleaf ? leafCard() : needleCard();
  wood.push(tube([V3(0, 0, 0), V3(0.012, 0.45, 0), V3(0, 0.98, 0.008)], [0.018, 0.012, 0.002], 5, bark));
  const levels = cedar ? 15 : 9;
  for (let k = 0; k < levels; k++) {
    const f = k / (levels - 1);
    const y = (cedar ? 0.22 : 0.44) + f * (cedar ? 0.72 : 0.47);
    const reach = cedar ? 0.16 * (1 - f * 0.9) : 0.22 * (1 - f * 0.65);
    const branches = cedar ? 6 : 5;
    for (let j = 0; j < branches; j++) {
      const a = seed + k * 2.399 + j * Math.PI * 2 / branches + hn(k, j, seed) * 0.4;
      const r = reach * (0.7 + 0.5 * hn(j, k, seed));
      const start = V3(0, y, 0);
      const tip = V3(Math.cos(a) * r, y - (cedar ? 0.05 : -0.025), Math.sin(a) * r);
      wood.push(tube([start, start.clone().lerp(tip, 0.6), tip], [0.006, 0.003, 0.001], 4, bark));
      const sprays = broadleaf ? 20 : 8;
      for (let s = 0; s < sprays; s++) {
        const t = 0.2 + 0.8 * (s + 0.5) / sprays;
        const side = (s % 2 ? 1 : -1) * 0.018;
        const p = start.clone().lerp(tip, t).add(V3(-Math.sin(a) * side, (hn(s, k, seed) - 0.5) * 0.03, Math.cos(a) * side));
        const direction = V3(Math.cos(a + side * 15), cedar ? -0.7 : 0.15, Math.sin(a + side * 15));
        const normal = V3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4);
        const size = (broadleaf ? 0.018 : 0.055) * (0.75 + 0.4 * hn(s, j, seed));
        const g = card.clone().applyMatrix4(leafMatrix(p, direction, normal, size));
        paint(g, foliage, 0.12, seed + s);
        addSway(g, 0);
        cards.push(g);
      }
    }
  }
  for (const g of wood) addSway(g, 0);
  const result = mergeGeometries([mergeGeometries(wood), mergeGeometries(cards)], true);
  result.computeBoundingSphere();
  return result;
}

export function forestGeometries() {
  const merge = (parts) => { const g = mergeGeometries(parts); g.computeBoundingSphere(); return g; };
  return {
    cedarA: nearTree(1.1, 'cedar'),
    cedarB: nearTree(4.7, 'cedar'),
    cedarF: merge(cedarParts(2.3)),
    pineA: nearTree(1.7, 'pine'),
    pineB: nearTree(7.3, 'pine'),
    pineF: merge(pineParts(3.9)),
    mapleA: nearTree(3.1, 'maple'),
    mapleB: nearTree(9.2, 'maple'),
    mapleF: merge(broadleafParts(5.5)),
  };
}

// Returns { cedarA: {m: Matrix4[], c: Color[]}, ... }.
export function placeForest({ layout, rng }) {
  const f = layout.forest, w = layout.wall;
  const [cx, , cz] = f.center;
  const out = { cedarA: [], cedarB: [], cedarF: [], pineA: [], pineB: [], pineF: [], mapleA: [], mapleB: [], mapleF: [] };
  const cell = 5.4;
  const R = f.outerRadius;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = V3(), scl = V3(), up = V3(0, 1, 0);
  const col = new THREE.Color();
  for (let gx = -R; gx <= R; gx += cell) {
    for (let gz = -R; gz <= R; gz += cell) {
      const x = cx + gx + rng.range(-0.5, 0.5) * cell, z = cz + gz + rng.range(-0.5, 0.5) * cell;
      // draw the random numbers up front so the stream never depends on which tests pass
      const rDensity = rng.next(), rSpecies = rng.next(), rSize = rng.next(), rYaw = rng.next(), rTint = rng.next(), rVar = rng.next(), rScale = rng.next();
      const dx = x - cx, dz = z - cz;
      const r = Math.hypot(dx, dz);
      if (r > R) continue;
      if (x > w.minX - f.wallMargin && x < w.maxX + f.wallMargin && z > w.minZ - f.wallMargin && z < w.maxZ + f.wallMargin) continue;
      const az = ((Math.atan2(dx, -dz) / deg) + 360) % 360;
      if (az >= f.sunSector.fromAzimuth - 3 && az <= f.sunSector.toAzimuth + 3 && r < f.sunSector.clearRadius) continue;
      if (z > w.maxZ - 4 && Math.abs(x) < f.approachClearHalfWidth) continue;
      const north = Math.cos((az - 8) * deg); // +1 due north, -1 due south
      const patch = valueNoise2(x / 60, z / 60, 5);
      const edge = 1 - smooth(R * 0.85, R, r);
      const near = smooth(0, 40, Math.hypot(Math.max(0, w.minX - x, x - w.maxX), Math.max(0, w.minZ - z, z - w.maxZ)) - f.wallMargin);
      const density = (0.42 + 0.5 * Math.max(0, north) + 0.1 * Math.abs(Math.sin(az * deg))) * (0.55 + 0.9 * patch) * edge * (0.45 + 0.55 * near);
      if (rDensity > density) continue;
      const y = layout.terrainHeight(x, z);
      const elev = clamp01(y / 50);
      const wc = 0.3 + 0.55 * Math.max(0, north) + 0.4 * elev;
      const wm = 0.3 * (1 - elev) * (0.5 + 0.8 * patch) * (1 - 0.5 * Math.max(0, north)) * (0.3 + 0.7 * near);
      const wp = 0.25;
      const pick = rSpecies * (wc + wm + wp);
      const kind = pick < wc ? 'cedar' : pick < wc + wm ? 'maple' : 'pine';
      // rich geometry within ~70 m of the wall, cheap clumps beyond
      const wallDist = Math.hypot(Math.max(0, w.minX - x, x - w.maxX), Math.max(0, w.minZ - z, z - w.maxZ));
      const variant = wallDist > 70 ? 'F' : rVar < 0.5 ? 'A' : 'B';
      let h;
      if (kind === 'cedar') h = (9 + 17 * Math.pow(rSize, 1.3)) * (0.8 + 0.35 * Math.max(0, north));
      else if (kind === 'pine') h = 7 + 5 * rSize;
      else h = 7 + 4 * rSize;
      const wide = 0.85 + 0.35 * rScale;
      pos.set(x, y - 0.4, z);
      scl.set(h * wide, h, h * wide);
      q.setFromAxisAngle(up, rYaw * 6.283);
      m.compose(pos, q, scl);
      if (kind === 'maple') {
        // Mixed broadleaf: autumn reds and oranges, golden-yellow (zelkova, ginkgo),
        // russet-brown oaks and a few dull evergreens.
        const mix = (rTint * 7.31) % 1;
        if (mix < 0.5) autumn(0.04 + 0.62 * Math.pow(rTint, 1.2), col);
        else if (mix < 0.7) col.setRGB(0.85, 0.6, 0.08);
        else if (mix < 0.85) col.setRGB(0.5, 0.26, 0.08);
        else col.setRGB(0.16, 0.24, 0.08);
        col.multiplyScalar(0.42 + 0.25 * rScale);
      }
      else { const k = 0.75 + 0.5 * rTint; col.setRGB(k * (0.95 + 0.1 * rScale), k, k * (0.95 + 0.1 * (1 - rScale))); }
      out[kind + variant].push(m.clone(), col.clone());
    }
  }
  return out;
}
