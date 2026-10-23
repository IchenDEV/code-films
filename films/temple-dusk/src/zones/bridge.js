// Vermilion arched bridge (taikobashi): planked deck on arched side beams,
// lathe-turned posts with bronze giboshi, piers in the water, stone abutments.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { fbm2 } from '../rng.js';
import { sweep, roundedRect } from './bridge/sweep.js';
import { makeGiboshi, GIBOSHI_HEIGHT } from './bridge/giboshi.js';

export function build({ THREE, layout, M, rng }) {
  const B = layout.bridge, deckY = layout.bridgeDeckY;
  const zMid = B.center[2], zA = zMid - B.length / 2, zB = zMid + B.length / 2;
  const half = B.width / 2;
  const sideX = half + 0.12; // centre line of the side beams
  const postX = half + 0.15;
  const slope = (z) => (deckY(z + 0.01) - deckY(z - 0.01)) / 0.02;
  const arcPitch = (z) => Math.hypot(1, slope(z));

  const group = new THREE.Group();
  const lacquer = [], timber = [], bronze = [], gold = [], stone = [];
  const sw = (profile, opts) => sweep(profile, { yOf: deckY, za: zA, zb: zB, n: 56, ...opts });
  const place = (g, x, y, z, rx = 0, sx = 1, sy = 1, sz = 1) => {
    g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(sx, sy, sz)));
    return g;
  };

  // Walk along the arch in equal arc steps, from za to zb.
  const arcWalk = (za, zb, pitch, fn) => {
    let z = za, k = 0;
    while (z <= zb + 1e-6) { fn(z, k++); z += pitch / arcPitch(z); }
  };

  // ---- Side beams, stringers ---------------------------------------------
  for (const s of [-1, 1]) {
    lacquer.push(sw(roundedRect(0.26, 0.41, 0.025, 3, -0.155), { x: s * sideX, yo: 0.0 }));
  }
  for (const x of [-0.9, 0, 0.9]) {
    timber.push(sw(roundedRect(0.14, 0.22, 0.012, 2, -0.2), { x, yo: 0, uScale: 0.3 }));
  }

  // ---- Deck planks (instanced) -------------------------------------------
  const plankLen = B.width + 0.04, plankT = 0.085, plankW = 0.235;
  const plankGeo = new RoundedBoxGeometry(plankLen, plankT, plankW, 1, 0.014);
  const planks = [];
  const rp = rng.fork('planks');
  arcWalk(zA + 0.12, zB - 0.12, plankW + 0.022, (z) => planks.push(z));
  const plankMesh = new THREE.InstancedMesh(plankGeo, M.wood, planks.length);
  const mat = new THREE.Matrix4(), col = new THREE.Color();
  planks.forEach((z, i) => {
    const th = Math.atan(slope(z));
    const tilt = rp.range(-0.004, 0.004);
    const lift = rp.range(-0.004, 0.003);
    const y = deckY(z) - plankT / 2 + lift * Math.cos(th);
    mat.compose(
      new THREE.Vector3(rp.range(-0.012, 0.012), y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-th, 0, tilt)),
      new THREE.Vector3(1, 1 + rp.range(-0.05, 0.08), 1 + rp.range(-0.03, 0.03)));
    plankMesh.setMatrixAt(i, mat);
    const v = rp.range(0.78, 1.18);
    plankMesh.setColorAt(i, col.setRGB(v * rp.range(0.97, 1.04), v, v * rp.range(0.94, 1.02)));
  });
  plankMesh.instanceMatrix.needsUpdate = true;
  plankMesh.instanceColor.needsUpdate = true;
  group.add(plankMesh);

  // ---- Cross cleats on the steep ends --------------------------------------
  const cleatZ = [];
  const steepZ = 0.24; // slope above which a cleat is laid
  const zSteepN = zMid - (steepZ * (B.length / 2)) / (2 * B.rise);
  const zSteepS = zMid + (steepZ * (B.length / 2)) / (2 * B.rise);
  arcWalk(zA + 0.4, zSteepN, 0.5, (z) => cleatZ.push(z));
  arcWalk(zSteepS, zB - 0.4, 0.5, (z) => cleatZ.push(z));
  const cleatGeo = new RoundedBoxGeometry(B.width - 0.12, 0.05, 0.085, 1, 0.012);
  const cleatMesh = new THREE.InstancedMesh(cleatGeo, M.woodRaw, cleatZ.length);
  cleatZ.forEach((z, i) => {
    const th = Math.atan(slope(z)), n = [0, Math.cos(th), -Math.sin(th)];
    mat.compose(new THREE.Vector3(0, deckY(z) + 0.02 * n[1], z + 0.02 * n[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-th, 0, 0)), new THREE.Vector3(1, 1, 1));
    cleatMesh.setMatrixAt(i, mat);
    const v = rp.range(0.55, 0.8);
    cleatMesh.setColorAt(i, col.setRGB(v, v * 0.95, v * 0.9));
  });
  group.add(cleatMesh);

  // ---- Rails -----------------------------------------------------------------
  const railSpec = [
    { yo: 0.86, w: 0.115, h: 0.08, r: 0.034 }, // top rail
    { yo: 0.50, w: 0.085, h: 0.07, r: 0.024 }, // middle rail
    { yo: 0.17, w: 0.1, h: 0.09, r: 0.026 }, // low rail
  ];
  const railEnd = 0.13;
  for (const s of [-1, 1]) {
    for (const rs of railSpec) {
      lacquer.push(sw(roundedRect(rs.w, rs.h, rs.r, 4), { x: s * postX, yo: rs.yo, za: zA + railEnd, zb: zB - railEnd, n: 72 }));
      for (const z of [zA + railEnd, zB - railEnd]) { // rounded rail ends
        const th = Math.atan(slope(z));
        lacquer.push(place(new THREE.SphereGeometry(0.5, 14, 10), s * postX, deckY(z) + rs.yo, z, -th, rs.w, rs.h, rs.w * 0.9));
      }
    }
  }

  // ---- Posts and balusters ---------------------------------------------------
  const majorZ = B.postZ;
  const minorZ = [12.0, 17.25, 20, 22.75, 28.0];
  const allPostZ = [...majorZ, ...minorZ].sort((a, b) => a - b);
  const postBottom = (z) => deckY(z) + 0.05 - 0.2;
  const postProfile = (R, top, major) => {
    const p = [[0, 0], [R + 0.03, 0], [R + 0.036, 0.015], [R + 0.03, 0.03], [R + 0.012, 0.05], [R, 0.07], [R * 0.97, 0.5]];
    const t = top;
    p.push([R * 0.97, t - 0.2]);
    // bead under the top rail
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (i / 8);
      p.push([R * 0.97 + 0.02 * Math.sin(a), t - 0.2 + 0.05 * (i / 8) - 0.0 * i]);
    }
    p.push([R, t - 0.14]);
    if (major) {
      p.push([R * 1.0, t - 0.04], [R * 1.08, t - 0.026], [R * 1.08, t - 0.012], [R * 0.86, t], [0, t]);
    } else { // domed cap
      for (let i = 0; i <= 8; i++) {
        const a = (Math.PI / 2) * (i / 8);
        p.push([R * 1.02 * Math.cos(a), t - 0.07 + 0.09 * Math.sin(a)]);
      }
    }
    return p.map(([r, h]) => new THREE.Vector2(r, h));
  };
  for (const s of [-1, 1]) {
    for (const z of allPostZ) {
      const major = majorZ.includes(z);
      const R = major ? 0.078 : 0.06;
      const y0 = postBottom(z), top = deckY(z) + 0.99 - y0;
      const g = new THREE.LatheGeometry(postProfile(R, top, major), major ? 28 : 18);
      lacquer.push(g.translate(s * postX, y0, z));
    }
  }
  // Balusters between low rail and top rail, evenly spaced in each bay.
  const balusters = [];
  for (let i = 0; i + 1 < allPostZ.length; i++) {
    const za = allPostZ[i], zb = allPostZ[i + 1];
    let arc = 0;
    const steps = 40;
    for (let k = 0; k < steps; k++) arc += (zb - za) / steps * arcPitch(za + ((k + 0.5) * (zb - za)) / steps);
    const count = Math.max(1, Math.round(arc / 0.44));
    for (let k = 1; k < count; k++) {
      // find z at arc fraction k/count
      let acc = 0, z = za;
      const target = (arc * k) / count;
      for (let q = 0; q < steps * 4 && acc < target; q++) { const dz = (zb - za) / (steps * 4); acc += dz * arcPitch(z + dz / 2); z += dz; }
      balusters.push(z);
    }
  }
  const balGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.62, 10, 1);
  const balMesh = new THREE.InstancedMesh(balGeo, M.vermilion, balusters.length * 2);
  let bi = 0;
  for (const s of [-1, 1]) for (const z of balusters) {
    mat.makeTranslation(s * postX, deckY(z) + 0.52, z);
    balMesh.setMatrixAt(bi++, mat);
  }
  group.add(balMesh);

  // ---- Giboshi -------------------------------------------------------------
  const noise = (a, b) => fbm2(a, b, 4, 31);
  const heroIndex = 7;
  const detail = [makeGiboshi({ segments: 24, step: 3, noise }), makeGiboshi({ segments: 96, step: 1, noise })];
  B.giboshi.forEach(([gx, gy, gz], i) => {
    const lod = detail[i === heroIndex ? 1 : 0];
    const turn = (i * 0.9) % (Math.PI * 2);
    const at = (g) => g.clone().rotateY(turn).translate(gx, gy - GIBOSHI_HEIGHT / 2, gz);
    bronze.push(at(lod.bronze));
    lod.gold.forEach((g) => gold.push(at(g)));
  });

  // ---- Substructure: bents of round piers under the sloping ends ---------------
  const beamBetween = (a, b, w, h) => {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    const g = new THREE.BoxGeometry(w, h, len);
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir.clone().normalize().negate(), new THREE.Vector3(0, 1, 0));
    // lookAt aims -Z at the target; box length lies on Z, so the sign does not matter for a symmetric box
    g.applyMatrix4(m.setPosition(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)));
    return g;
  };
  const pierX = 1.15;
  const bents = [12.1, 14.5, zMid * 2 - 14.5, zMid * 2 - 12.1];
  const bentTop = (z) => deckY(z) - 0.42;
  const pierBase = (x, z) => layout.terrainHeight(x, z) - 0.15;
  const tieY = layout.pond.waterY + 0.55;
  for (const z of bents) {
    for (const s of [-1, 1]) {
      const x = s * pierX, y0 = pierBase(x, z), y1 = bentTop(z);
      const pier = new THREE.CylinderGeometry(0.15, 0.175, y1 - y0, 22, 1);
      lacquer.push(pier.translate(x, (y0 + y1) / 2, z));
      const ring = new THREE.CylinderGeometry(0.185, 0.185, 0.07, 22, 1);
      lacquer.push(ring.translate(x, tieY - 0.12, z));
    }
    // cap beam across the piers, tie beam near the water, and an X brace between
    timber.push(new THREE.BoxGeometry(3.7, 0.24, 0.3).translate(0, bentTop(z), z));
    timber.push(new THREE.BoxGeometry(2.6, 0.16, 0.2).translate(0, tieY, z));
    const lo = tieY - 0.05, hi = bentTop(z) - 0.2;
    timber.push(beamBetween(new THREE.Vector3(-pierX, lo, z), new THREE.Vector3(pierX, hi, z), 0.11, 0.17));
    timber.push(beamBetween(new THREE.Vector3(pierX, lo, z), new THREE.Vector3(-pierX, hi, z), 0.11, 0.17));
  }
  // Longitudinal ties and diagonals between the two bents at each end.
  for (const [za, zb] of [[bents[0], bents[1]], [bents[2], bents[3]]]) {
    for (const s of [-1, 1]) {
      const x = s * (pierX + 0.17);
      timber.push(beamBetween(new THREE.Vector3(x, tieY, za), new THREE.Vector3(x, tieY, zb), 0.13, 0.17));
      const upper = (za < zMid ? zb : za), lower = (za < zMid ? za : zb);
      timber.push(beamBetween(new THREE.Vector3(x, tieY + 0.05, lower), new THREE.Vector3(x, bentTop(upper) - 0.25, upper), 0.1, 0.14));
    }
  }

  // ---- Stone: abutments under the deck ends, facing courses, landings ------------
  const rs = rng.fork('stone');
  const white = (g, v = 1, tint = [1, 1, 1]) => {
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[3 * i] = v * tint[0]; c[3 * i + 1] = v * tint[1]; c[3 * i + 2] = v * tint[2]; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  };
  const absW = 3.5, faceOff = 2.0; // body half-length along the bank
  for (const dir of [-1, 1]) {
    const zEnd = dir < 0 ? zA : zB; // deck end
    const zFace = zEnd - dir * faceOff; // face toward the water
    const topAt = (z) => Math.max(deckY(z) - 0.37, -0.12);
    // Body: extruded side profile (z along local x, y up), width along world x.
    const shape = new THREE.Shape();
    const zs = [zEnd, zFace];
    const zNear = zEnd + dir * 0.1;
    shape.moveTo(zNear, -1.0);
    shape.lineTo(zFace, -1.0);
    for (let k = 0; k <= 8; k++) { const z = zFace + (zEnd - zFace) * (k / 8); shape.lineTo(z, topAt(z)); }
    shape.lineTo(zNear, topAt(zEnd));
    const body = new THREE.ExtrudeGeometry(shape, { depth: absW - 0.06, bevelEnabled: false });
    body.translate(0, 0, -(absW - 0.06) / 2);
    body.rotateY(-Math.PI / 2);
    const bodyNI = white(body, 0.78, [0.95, 0.97, 0.9]);
    stone.push(bodyNI);
    // Facing courses on the water-side face, running-bond blocks.
    const yTop = topAt(zFace), yBot = -1.0;
    const courses = Math.ceil((yTop - yBot) / 0.3), ch = (yTop - yBot) / courses;
    for (let c = 0; c < courses; c++) {
      const yc = yBot + ch * (c + 0.5);
      let x = -absW / 2 + rs.range(0, 0.4) - 0.4;
      while (x < absW / 2 - 0.02) {
        const w = rs.range(0.55, 1.0);
        const x0 = Math.max(x, -absW / 2), x1 = Math.min(x + w, absW / 2);
        if (x1 - x0 > 0.2) {
          const bl = new RoundedBoxGeometry(x1 - x0 - 0.02, ch - 0.025, 0.16, 2, 0.03);
          const wet = yc < layout.pond.waterY + 0.45;
          const v = rs.range(0.8, 1.12);
          white(bl, v * (wet ? 0.8 : 1), wet ? [0.8, 1, 0.78] : [1, 1, 1]);
          stone.push(bl.translate((x0 + x1) / 2, yc + rs.range(-0.006, 0.006), zFace + dir * 0.02));
        }
        x += w;
      }
    }
    // Landing slab where the path meets the deck.
    const slab = new RoundedBoxGeometry(absW + 0.5, 0.36, 1.0, 3, 0.04);
    stone.push(white(slab, 0.95).translate(0, 0.12 - 0.18, zEnd - dir * 0.0 + dir * -0.1 + dir * 0.35));
  }
  const stoneMat = M.stone.clone();
  stoneMat.vertexColors = true;
  const bronzeMat = M.bronze.clone();
  bronzeMat.vertexColors = true;

  // ---- Assemble -----------------------------------------------------------------
  const merged = (geos, material, name) => {
    const g = mergeGeometries(geos.map((x) => (x.index && geos.some((y) => !y.index) ? x.toNonIndexed() : x)));
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };
  merged(lacquer, M.vermilion, 'bridge-lacquer');
  merged(timber, M.wood, 'bridge-timber');
  merged(bronze, bronzeMat, 'bridge-giboshi');
  merged(gold, M.goldLeaf, 'bridge-gold');
  merged(stone, stoneMat, 'bridge-stone');
  return { object: group };
}
