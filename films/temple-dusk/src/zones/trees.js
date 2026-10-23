// Trees zone: autumn maples (with a backlit hero cluster), black pines, a cedar grove,
// clipped azalea shrubs, falling leaves, and the forest on the hills around the wall.
// Everything is generated in code; see src/zones/trees/ for the parts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V3, foliageMaterial } from './trees/common.js';
import { makeLeafTexture, leafCard } from './trees/leaf.js';
import { buildMaple, autumn } from './trees/maple.js';
import { buildPine, buildCedar, makeNeedleTexture, needleCard, padGeometry } from './trees/conifers.js';
import { forestGeometries, placeForest } from './trees/forest.js';

const FALLING = 18;

function instanced(geometry, material, items, name) {
  const n = items.length / 2;
  const mesh = new THREE.InstancedMesh(geometry, material, n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    mesh.setMatrixAt(i, items[i * 2]);
    mesh.setColorAt(i, c.copy(items[i * 2 + 1]));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.name = name;
  return mesh;
}

// Bark relief as a tangent-space normal map: long fissures running along the stem
// (tube uv.x runs along the branch, uv.y around it), broken into plates.
function barkNormalMap(r, size = 256) {
  const hgt = new Float32Array(size * size);
  const ph = Array.from({ length: 6 }, () => r.range(0, 6.283));
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const u = i / size, v = j / size; // u along, v around
    const ridge = Math.abs(Math.sin(v * Math.PI * 14 + 1.3 * Math.sin(u * Math.PI * 4 + ph[0]) + 0.6 * Math.sin(u * Math.PI * 10 + ph[1])));
    const plates = 0.5 + 0.5 * Math.sin(u * Math.PI * 22 + 3 * Math.sin(v * Math.PI * 6 + ph[2]));
    hgt[j * size + i] = Math.pow(ridge, 0.6) * (0.75 + 0.25 * plates) + 0.08 * Math.sin(u * 90 + v * 40 + ph[3]);
  }
  const data = new Uint8Array(size * size * 4);
  const at = (i, j) => hgt[((j + size) % size) * size + ((i + size) % size)];
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const dx = (at(i + 1, j) - at(i - 1, j)) * 2.2, dy = (at(i, j + 1) - at(i, j - 1)) * 2.2;
    const l = Math.hypot(dx, dy, 1);
    const k = (j * size + i) * 4;
    data[k] = Math.round(255 * (0.5 - 0.5 * dx / l));
    data[k + 1] = Math.round(255 * (0.5 - 0.5 * dy / l));
    data[k + 2] = Math.round(255 * (0.5 + 0.5 / l));
    data[k + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export function build({ layout, M, rng }) {
  const time = { value: 0 };
  const group = new THREE.Group();
  const ctx = { bark: [], mass: [], cards: [], leaves: [], hero: [] };

  // ---- hand-placed trees -------------------------------------------------------------------------
  layout.trees.forEach((tree, i) => {
    const r = rng.fork(`${tree.kind}${i}`);
    if (tree.kind === 'maple' || tree.kind === 'ginkgo') buildMaple({ layout, tree, index: i, rng: r, ctx });
    else if (tree.kind === 'pine') buildPine({ layout, tree, rng: r, ctx });
    else buildCedar({ layout, tree, rng: r, ctx });
  });

  // ---- clipped azalea mounds at the foot of the maples ---------------------------------------------
  const srng = rng.fork('shrubs');
  const azDark = new THREE.Color('#1c3216'), azLight = new THREE.Color('#34561f');
  let placed = 0;
  for (const tree of layout.trees) {
    if (tree.kind !== 'maple') continue;
    for (let k = 0; k < 3 && placed < 30; k++) {
      const a = srng.range(0, 6.283), d = tree.crown * srng.range(0.55, 0.9) + 1.2;
      const x = tree.position[0] + Math.cos(a) * d, z = tree.position[2] + Math.sin(a) * d;
      const rx = srng.range(0.55, 0.95);
      if (!layout.isClear(x, z, rx + 0.6)) continue;
      const g = padGeometry(rx, rx * 0.62, x, azDark, azLight, { lump: 0.12, flat: 0.1 });
      g.translate(x, layout.terrainHeight(x, z) + rx * 0.06, z);
      ctx.mass.push(g);
      placed++;
    }
  }

  // ---- materials -----------------------------------------------------------------------------------
  const barkMat = M.wood.clone();
  barkMat.color.set(0xffffff);
  barkMat.vertexColors = true;
  barkMat.roughness = 0.92;
  barkMat.normalMap = barkNormalMap(rng.fork('bark'));
  barkMat.normalScale = new THREE.Vector2(0.55, 0.55);
  const leafTex = makeLeafTexture(512);
  const canopyMat = foliageMaterial({ time, trans: 0.3, glow: 0, wind: 0.04, roughness: 0.82, map: leafTex, alphaTest: 0.2 });
  const massMat = foliageMaterial({ time, trans: 0.08, wind: 0.025, roughness: 0.9 });
  const needleMat = foliageMaterial({ time, trans: 0.35, wind: 0.05, roughness: 0.8, map: makeNeedleTexture(rng.fork("needles")), alphaTest: 0.25 });
  const forestMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
  const forestMapleMat = foliageMaterial({ time, trans: 0.2, glow: 0, wind: 0, roughness: 0.9, side: THREE.FrontSide });

  const leafGeo = leafCard();
  // ---- hand-placed meshes (merged / instanced per material) -------------------------------------------
  const bark = new THREE.Mesh(mergeGeometries(ctx.bark), barkMat);
  bark.name = 'bark';
  const mass = new THREE.Mesh(mergeGeometries(ctx.mass), massMat);
  mass.name = 'conifer-mass';
  const canopy = instanced(leafGeo, canopyMat, ctx.leaves, 'maple-leaves');
  const needles = instanced(needleCard(), needleMat, ctx.cards, 'needles');
  const heroLeaves = new THREE.Mesh(mergeGeometries(ctx.hero), canopyMat);
  heroLeaves.name = 'hero-leaves';
  group.add(bark, mass, canopy, needles, heroLeaves);

  // ---- falling leaves (pure function of t) -----------------------------------------------------------
  const frng = rng.fork('falling');
  const maples = layout.trees.filter((t) => t.kind === 'maple');
  const fall = Array.from({ length: FALLING }, (_, i) => {
    const t = maples[i % maples.length];
    // spawn on the side of the crown away from the hero's line of sight (east / south of the trunk)
    const a = frng.range(-0.6, 2.2);
    const d = t.crown * frng.range(0.2, 0.9);
    return {
      x: t.position[0] + Math.cos(a) * d, z: t.position[2] + Math.sin(a) * d,
      top: t.height * frng.range(0.7, 1.0), period: frng.range(9, 15), phase: frng.next(),
      drift: V3(frng.range(0.5, 2.2), 0, frng.range(-1.2, 1.2)), size: frng.range(0.12, 0.17),
      spin: V3(frng.range(0.6, 1.4), frng.range(0.8, 1.6), frng.range(0.5, 1.2)), ph: V3(frng.range(0, 6.3), frng.range(0, 6.3), frng.range(0, 6.3)),
      gy: layout.terrainHeight(t.position[0], t.position[2]),
    };
  });
  const fallingItems = [];
  const col = new THREE.Color();
  fall.forEach((f, i) => { fallingItems.push(new THREE.Matrix4(), autumn(0.05 + 0.6 * ((i * 0.618) % 1), col).clone()); });
  const falling = instanced(leafGeo, canopyMat, fallingItems, 'falling-leaves');
  falling.frustumCulled = false;
  group.add(falling);
  const fm = new THREE.Matrix4(), fe = new THREE.Euler(), fq = new THREE.Quaternion(), fp = V3(), fs = V3();
  function updateFalling(t) {
    fall.forEach((f, i) => {
      const u = (((t / f.period + f.phase) % 1) + 1) % 1;
      const y = f.gy + 0.05 + f.top * (1 - u);
      fp.set(
        f.x + f.drift.x * u * 2.5 + 0.45 * Math.sin(t * 1.3 + f.ph.x),
        y,
        f.z + f.drift.z * u * 2.5 + 0.45 * Math.cos(t * 1.1 + f.ph.z),
      );
      fe.set(0.9 * Math.sin(t * f.spin.x + f.ph.x), t * f.spin.y + f.ph.y, 0.9 * Math.cos(t * f.spin.z + f.ph.z));
      fq.setFromEuler(fe);
      fs.setScalar(f.size);
      fm.compose(fp, fq, fs);
      falling.setMatrixAt(i, fm);
    });
    falling.instanceMatrix.needsUpdate = true;
  }

  // ---- forest -----------------------------------------------------------------------------------------
  const geos = forestGeometries();
  const placed2 = placeForest({ layout, rng: rng.fork('forest') });
  for (const [key, items] of Object.entries(placed2)) {
    if (!items.length) continue;
    const mat = key.endsWith('F')
      ? (key.startsWith('maple') ? forestMapleMat : forestMat)
      : [forestMat, key.startsWith('maple') ? canopyMat : needleMat];
    const mesh = instanced(geos[key], mat, items, `forest-${key}`);
    mesh.userData.noCastShadow = true;
    mesh.userData.noReceiveShadow = true;
    group.add(mesh);
  }

  group.name = 'trees';
  updateFalling(0);
  return {
    object: group,
    update(t) {
      time.value = t;
      updateFalling(t);
    },
  };
}
