// Bank stones: seeded, deformed icospheres on the waterline band, one merged mesh.

import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { merge, smooth } from './util.js';

// Unit rock with lumpy rounded form; shape is a pure function of position + seed.
function rockGeometry(detail, seed, noise) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n1 = noise.fbm2(v.x * 1.3 + v.y * 0.7 + seed, v.z * 1.3 - v.y * 0.9 + seed * 0.3, 3, 31);
    const n2 = noise.valueNoise2(v.x * 3.1 + seed * 2, v.z * 3.1 + v.y * 2.3, 47);
    const r = 0.55 + 0.8 * n1 + 0.22 * n2;
    // Weathered granite: a flattened top and a sheared side, so stones read as stones.
    let y = v.y * r;
    if (y > 0.3) y = 0.3 + (y - 0.3) * 0.35;
    const shear = 0.25 * Math.sin(seed * 1.7);
    p.setXYZ(i, v.x * r + shear * y, y, v.z * r);
  }
  return g;
}

export function buildRocks({ layout, M, rng, noise }) {
  const { pond, pondRadiusAt, terrainHeight } = layout;
  const r = rng.fork('rocks');
  const [cx, , cz] = pond.center;
  const parts = [];
  // Six templates per detail level, reused with different transforms.
  const small = Array.from({ length: 6 }, (_, i) => rockGeometry(2, i * 7.3, noise));
  const big = Array.from({ length: 4 }, (_, i) => rockGeometry(4, 50 + i * 5.1, noise));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  const addRock = (tpl, x, z, sx, sy, sz, yaw, sink) => {
    const g = tpl.clone();
    const ground = Math.max(terrainHeight(x, z), pond.floorY);
    // Base rests on the terrain (or the floor under water); `sink` buries part of it.
    const y = ground + sy * (1 - sink);
    e.set(r.range(-0.18, 0.18), yaw, r.range(-0.18, 0.18), 'YXZ');
    q.setFromEuler(e);
    m.compose(pv.set(x, y, z), q, sv.set(sx, sy, sz));
    g.applyMatrix4(m);
    // Colour: per-stone value, wet dark band near the waterline, mossy top.
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    const tone = r.range(0.72, 1.05), warm = r.range(-0.05, 0.05);
    g.computeVertexNormals();
    const P = g.attributes.position, Nn = g.attributes.normal;
    for (let i = 0; i < n; i++) {
      const wy = P.getY(i);
      const wet = 1 - 0.5 * smooth(pond.waterY + 0.22, pond.waterY - 0.02, wy);
      const top = Math.max(0, Nn.getY(i));
      const k = tone * wet;
      col[i * 3] = k * (1 + warm - 0.06 * top);
      col[i * 3 + 1] = k * (1 + 0.05 * top);
      col[i * 3 + 2] = k * (1 - warm - 0.1 * top);
      uv[i * 2] = (P.getX(i) + 0.6 * P.getZ(i)) * 0.55;
      uv[i * 2 + 1] = (P.getY(i) * 1.2 + 0.4 * P.getZ(i)) * 0.55;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    parts.push(g);
  };

  // Edge stones: walk the outline by arc length. The waterline sits ~0.6 m inside the
  // outline (terrain crosses waterY there), so stones straddle outline-0.9 .. outline+0.3.
  let th = r.range(0, 0.2);
  while (th < Math.PI * 2 - 0.05) {
    const R = pondRadiusAt(th);
    // Mostly small and mid stones, a few large ones, gaps where the moss bank shows.
    const w = r.chance(0.12) ? r.range(0.8, 1.3) : r.chance(0.5) ? r.range(0.18, 0.38) : r.range(0.38, 0.62);
    const rr = R + r.range(-0.9, 0.35);
    const x = cx + Math.cos(th) * rr, z = cz + Math.sin(th) * rr;
    const nearBridgeEnd = Math.abs(x) < 2.5 && Math.abs(z - cz) > 5;
    if (!nearBridgeEnd && !r.chance(0.18)) {
      addRock(r.pick(small), x, z, w, w * r.range(0.3, 0.6), w * r.range(0.55, 1.15), r.range(0, Math.PI * 2), r.range(0.12, 0.3));
      // pebbles tucked against bigger stones
      if (w > 0.5) for (let k = 0; k < 3; k++) {
        const a = r.range(0, 6.283), d = w * r.range(0.8, 1.2), pw = r.range(0.08, 0.18);
        addRock(r.pick(small), x + Math.cos(a) * d, z + Math.sin(a) * d, pw, pw * 0.5, pw * r.range(0.7, 1.1), r.range(0, 6.28), 0.2);
      }
    }
    th += (w * 1.05 + r.range(0, 0.45)) / R;
  }
  // A second, sparser row further out and a few partly submerged stones inside.
  th = r.range(0, 0.4);
  while (th < Math.PI * 2) {
    const R = pondRadiusAt(th);
    const w = r.range(0.3, 0.6);
    const rr = R + r.range(0.4, 1.0);
    const x = cx + Math.cos(th) * rr, z = cz + Math.sin(th) * rr;
    if (!(Math.abs(x) < 2.5 && Math.abs(z - cz) > 5)) addRock(r.pick(small), x, z, w, w * 0.5, w * 0.8, r.range(0, 6.28), 0.3);
    th += (w * 2.4 + r.range(0.2, 1.5)) / R;
  }
  // Accent rocks, larger, placed by hand on the plan: they sit on or just inside the bank.
  const accents = [0.45, 1.25, 2.0, 2.75, 3.65, 4.2, 5.35, 5.9];
  accents.forEach((a, i) => {
    const R = pondRadiusAt(a);
    const rr = R - r.range(0.2, 0.7);
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    if (Math.abs(x) < 3.2 && Math.abs(z - cz) > 5) return;
    const w = r.range(0.7, 1.2);
    addRock(big[i % big.length], x, z, w, w * r.range(0.5, 0.75), w * r.range(0.7, 1.0), r.range(0, 6.28), 0.28);
  });

  const mat = M.stoneMoss.clone();
  mat.vertexColors = true;
  const mesh = new THREE.Mesh(merge(parts), mat);
  mesh.name = 'pondRocks';
  return mesh;
}
