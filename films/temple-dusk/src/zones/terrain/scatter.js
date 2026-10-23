// Small things lying on the ground: rocks, moss tufts and fallen maple leaves.
// All placed with the seeded rng, kept off buildings, paths and water by isClear.
import * as THREE from 'three';
import { mix3 } from './mesh.js';

const dummy = new THREE.Object3D();
const tint = new THREE.Color();

function pickSpot(r, layout, { around, spread, radius, tries = 60 }) {
  for (let i = 0; i < tries; i++) {
    const [cx, cz] = around();
    const x = cx + r.gauss() * spread, z = cz + r.gauss() * spread;
    if (layout.isClear(x, z, radius)) return [x, z];
  }
  return null;
}

// Positions along the inside foot of the wall, at random distance 0.4-4 m from it.
function wallFootSpot(r, layout) {
  const w = layout.wall;
  const t = r.next() * 2 * ((w.maxX - w.minX) + (w.maxZ - w.minZ));
  const off = w.thickness + r.range(0.3, 3.5);
  let s = t;
  if (s < w.maxX - w.minX) return [w.minX + s, w.minZ + off];
  s -= w.maxX - w.minX;
  if (s < w.maxZ - w.minZ) return [w.maxX - off, w.minZ + s];
  s -= w.maxZ - w.minZ;
  if (s < w.maxX - w.minX) return [w.maxX - s, w.maxZ - off];
  s -= w.maxX - w.minX;
  return [w.minX + off, w.maxZ - s];
}

export function buildScatter({ layout, M, rng, noise }) {
  const { fbm2 } = noise;
  const h = (x, z) => layout.terrainHeight(x, z);
  const maples = layout.trees.filter((t) => t.kind === 'maple');
  const inWall = (x, z) => x > layout.wall.minX + 1.5 && x < layout.wall.maxX - 1.5 && z > layout.wall.minZ + 1.5 && z < layout.wall.maxZ - 1.5;
  const out = [];

  // --- Rocks: lumpy icosahedra, flattened, moss on top.
  const rr = rng.fork('rocks');
  const rockGeo = new THREE.IcosahedronGeometry(1, 3);
  {
    const p = rockGeo.attributes.position;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const lump = 0.82 + 0.4 * fbm2(x * 1.6 + 3, y * 1.6 + z, 4, 501) + 0.05 * fbm2(x * 9, y * 9 + z * 4, 2, 502);
      const flat = y < 0 ? 0.55 : 1;
      p.setXYZ(i, x * lump, y * lump * 0.62 * flat, z * lump);
      const top = Math.max(0, y);
      const c = mix3([0.72, 0.7, 0.66], [0.38, 0.5, 0.24], Math.min(1, top * 0.9 + (fbm2(x * 4, z * 4, 3, 503) - 0.4) * 1.2));
      col.set(c, i * 3);
    }
    rockGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    rockGeo.computeVertexNormals();
  }
  const rockMat = M.stoneMoss.clone();
  rockMat.vertexColors = true;
  const rockCount = 46;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocks.name = 'rocks';
  const rockSpots = [];
  for (let i = 0; i < rockCount; i++) {
    const size = rr.range(0.1, 0.42) * (rr.chance(0.15) ? 1.6 : 1);
    const spot = pickSpot(rr, layout, {
      around: () => (rr.chance(0.55) ? wallFootSpot(rr, layout) : (() => { const t = rr.pick(maples); return [t.position[0], t.position[2]]; })()),
      spread: 1.6, radius: size * 1.1,
    });
    if (!spot || !inWall(...spot)) { dummy.scale.setScalar(0); dummy.position.set(0, -50, 0); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); continue; }
    rockSpots.push([...spot, size]);
    dummy.position.set(spot[0], h(...spot) - size * 0.1, spot[1]);
    dummy.rotation.set(rr.range(-0.12, 0.12), rr.range(0, Math.PI * 2), rr.range(-0.12, 0.12));
    dummy.scale.set(size * rr.range(0.9, 1.4), size * rr.range(0.8, 1.2), size * rr.range(0.9, 1.4));
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    tint.setScalar(rr.range(0.85, 1.05)); rocks.setColorAt(i, tint);
  }
  out.push(rocks);

  // --- Moss tufts: low bumpy domes, clustered at rocks, the wall foot and maple roots.
  const mr = rng.fork('moss');
  const mossGeo = new THREE.IcosahedronGeometry(1, 1);
  {
    const p = mossGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 0.8 + 0.35 * fbm2(x * 2.5 + 9, z * 2.5 + y, 2, 511);
      p.setXYZ(i, x * k, Math.max(y, -0.1) * k * 0.4, z * k);
    }
    mossGeo.computeVertexNormals();
  }
  const mossMat = new THREE.MeshStandardMaterial({ name: 'mossTuft', color: 0xffffff, roughness: 1, metalness: 0 });
  const mossCount = 450;
  const moss = new THREE.InstancedMesh(mossGeo, mossMat, mossCount);
  moss.name = 'moss-tufts';
  moss.userData.noCastShadow = true;
  const greens = ['#4d6a1f', '#5d7a26', '#3c5a1a', '#6e7f2c', '#56612a'];
  for (let i = 0; i < mossCount; i++) {
    let spot = null;
    const kind = mr.next();
    if (kind < 0.35 && rockSpots.length) {
      const rk = mr.pick(rockSpots);
      spot = pickSpot(mr, layout, { around: () => [rk[0], rk[1]], spread: rk[2] * 1.4, radius: 0.1 });
    } else if (kind < 0.7) {
      spot = pickSpot(mr, layout, { around: () => wallFootSpot(mr, layout), spread: 0.4, radius: 0.1 });
    } else {
      spot = pickSpot(mr, layout, { around: () => { const t = mr.pick(maples); return [t.position[0], t.position[2]]; }, spread: 2.2, radius: 0.1 });
    }
    if (!spot || !inWall(...spot)) { dummy.scale.setScalar(0); dummy.position.set(0, -50, 0); dummy.updateMatrix(); moss.setMatrixAt(i, dummy.matrix); continue; }
    const s = mr.range(0.08, 0.28);
    dummy.position.set(spot[0], h(...spot) - 0.01, spot[1]);
    dummy.rotation.set(0, mr.range(0, 6.28), 0);
    dummy.scale.set(s * mr.range(0.9, 1.5), s * mr.range(0.6, 1.2), s * mr.range(0.9, 1.5));
    dummy.updateMatrix();
    moss.setMatrixAt(i, dummy.matrix);
    tint.set(mr.pick(greens)).multiplyScalar(mr.range(0.75, 1.15));
    moss.setColorAt(i, tint);
  }
  out.push(moss);

  // --- Fallen maple leaves: five-lobed stars lying almost flat.
  const lr = rng.fork('leaves');
  const lobes = 5;
  const lp = [], lt = [];
  lp.push(0, 0, 0);
  for (let i = 0; i < lobes * 2; i++) {
    const a = (i / (lobes * 2)) * Math.PI * 2;
    const rad = i % 2 ? 0.42 : 1;
    lp.push(Math.cos(a) * rad, 0.12 * rad * rad, Math.sin(a) * rad);
  }
  for (let i = 0; i < lobes * 2; i++) lt.push(0, 1 + i, 1 + ((i + 1) % (lobes * 2)));
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  leafGeo.setIndex(lt);
  leafGeo.computeVertexNormals();
  const leafMat = new THREE.MeshStandardMaterial({ name: 'fallenLeaf', color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  const leafCount = 1600;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  leaves.name = 'fallen-leaves';
  leaves.userData.noCastShadow = true;
  const warm = ['#a8301a', '#c4451c', '#d9702a', '#8a2414', '#b8862a', '#6e3d1a', '#c25a20'];
  for (let i = 0; i < leafCount; i++) {
    const t = lr.pick(maples);
    const spot = pickSpot(lr, layout, { around: () => [t.position[0], t.position[2]], spread: t.crown * 0.9, radius: 0.05 });
    if (!spot || !inWall(...spot)) { dummy.scale.setScalar(0); dummy.position.set(0, -50, 0); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix); continue; }
    const s = lr.range(0.04, 0.075) * (t.hero ? 1.1 : 1);
    dummy.position.set(spot[0], h(...spot) + 0.012 + lr.next() * 0.02, spot[1]);
    dummy.rotation.set(lr.range(-0.2, 0.2), lr.range(0, 6.28), lr.range(-0.2, 0.2));
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    tint.set(lr.pick(warm)).multiplyScalar(lr.range(0.8, 1.15));
    leaves.setColorAt(i, tint);
  }
  out.push(leaves);
  return out;
}
