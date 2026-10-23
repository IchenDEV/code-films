// Garden planting: bamboo groves, clipped azalea / boxwood mounds (karikomi) and dry
// autumn grass tufts, inside the wall and along the outer approach. Positions come from
// layout.garden and are kept off buildings, paths and water with layout.isClear.
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash2 } from '../rng.js';

export function build({ THREE, layout, M, rng }) {
  const group = new THREE.Group();
  const time = { value: 0 };
  const h = (x, z) => layout.terrainHeight(x, z);
  const w = layout.wall;
  const inside = (x, z, m = 1.5) => x > w.minX + m && x < w.maxX - m && z > w.minZ + m && z < w.maxZ - m;

  // Gentle wind on vertices weighted by the `sway` attribute (0 at the root, 1 at the tip).
  const windy = (mat, amp) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float sway;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec3 wp0 = instanceMatrix[3].xyz;
          #else
            vec3 wp0 = vec3(0.0);
          #endif
          float ph = wp0.x * 0.37 + wp0.z * 0.23;
          transformed.x += sway * ${amp.toFixed(3)} * sin(uTime * 1.3 + ph);
          transformed.z += sway * ${amp.toFixed(3)} * 0.6 * sin(uTime * 0.9 + ph * 1.7);`);
    };
    return mat;
  };

  const instanced = (geo, mat, list, name) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(({ m, c }, i) => { mesh.setMatrixAt(i, m); if (c) mesh.setColorAt(i, c); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };
  const mtx = (x, y, z, yaw, sx, sy = sx, sz = sx, tilt = 0) => new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0)),
    new THREE.Vector3(sx, sy, sz),
  );

  // ---------------------------------------------------------------------------
  // Bamboo: a few culm variants (unit height) with nodes and a leafy top third.
  // ---------------------------------------------------------------------------
  function bambooVariant(seed) {
    const r = rng.fork(`bamboo-geo-${seed}`);
    const parts = [];
    const bend = r.range(0.03, 0.08), dir = r.range(0, 6.283);
    const at = (t) => new THREE.Vector3(Math.cos(dir) * bend * t * t, t, Math.sin(dir) * bend * t * t);
    // Culm: tapered tube with node rings every ~0.07 of the height.
    const segs = 28, radial = 7, R0 = 0.0065;
    const pos = [], col = [], sw = [], idx = [];
    const green = new THREE.Color('#4f6e26'), old = new THREE.Color('#7f8a3c');
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const c = at(t);
      const node = Math.abs(((t * 14) % 1) - 0.5) > 0.46 ? 1.18 : 1;
      const rr = R0 * (1 - 0.6 * t) * node;
      const k = new THREE.Color().copy(green).lerp(old, 0.3 + 0.4 * hash2(i, seed, 3)).multiplyScalar(node > 1 ? 0.75 : 1);
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        pos.push(c.x + Math.cos(a) * rr, c.y, c.z + Math.sin(a) * rr);
        col.push(k.r, k.g, k.b);
        sw.push(t * t);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + 1, d = a + radial + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const culm = new THREE.BufferGeometry();
    culm.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    culm.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    culm.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 1));
    culm.setIndex(idx);
    culm.computeVertexNormals();
    parts.push(culm);
    // Leaves: narrow lance-shaped blades in drooping fans along twigs on the top third.
    const lp = [], lc = [], ls = [], li = [];
    const lg = new THREE.Color('#3f5f1c'), ly = new THREE.Color('#8f9a34');
    const twigs = 44;
    for (let k = 0; k < twigs; k++) {
      const t = 0.45 + 0.53 * (k / twigs) + r.range(-0.02, 0.02);
      const base = at(t);
      const ta = r.range(0, 6.283);
      const tl = 0.06 + 0.08 * r.next();
      for (let n = 0; n < 9; n++) {
        const along = (n + 1) / 9;
        const ox = base.x + Math.cos(ta) * tl * along, oz = base.z + Math.sin(ta) * tl * along, oy = base.y - 0.01 * along;
        const la = ta + r.range(-1.1, 1.1);
        const len = r.range(0.026, 0.04), wid = len * 0.2;
        const dx = Math.cos(la), dz = Math.sin(la), droop = -r.range(0.3, 0.8);
        const tipx = ox + dx * len, tipy = oy + droop * len * 0.6, tipz = oz + dz * len;
        const px = -dz * wid, pz = dx * wid;
        const b0 = lp.length / 3;
        lp.push(ox, oy, oz, ox + dx * len * 0.35 + px, oy + droop * len * 0.15, oz + dz * len * 0.35 + pz,
          tipx, tipy, tipz, ox + dx * len * 0.35 - px, oy + droop * len * 0.15, oz + dz * len * 0.35 - pz);
        const kc = new THREE.Color().copy(lg).lerp(ly, r.next() * 0.6);
        for (let q = 0; q < 4; q++) { lc.push(kc.r, kc.g, kc.b); ls.push(t * t + 0.2 * along); }
        li.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
      }
    }
    const leaves = new THREE.BufferGeometry();
    leaves.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    leaves.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
    leaves.setAttribute('sway', new THREE.Float32BufferAttribute(ls, 1));
    leaves.setIndex(li);
    leaves.computeVertexNormals();
    return { culm, leaves };
  }
  const bv = [0, 1, 2].map(bambooVariant);
  const culmMat = windy(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }), 0.015);
  const leafMat = windy(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), 0.015);
  const culms = [[], [], []];
  const br = rng.fork('bamboo');
  for (const grove of layout.garden.bambooGroves) {
    let made = 0, tries = 0;
    while (made < grove.count && tries++ < grove.count * 6) {
      const a = br.range(0, 6.283), d = Math.sqrt(br.next());
      const x = grove.center[0] + Math.cos(a) * grove.radiusX * d, z = grove.center[2] + Math.sin(a) * grove.radiusZ * d;
      if (!inside(x, z, 1.2) || !layout.isClear(x, z, 0.3)) continue;
      const H = br.range(8, 12.5) * (1 - 0.25 * d);
      const k = br.int(0, 2);
      culms[k].push({ m: mtx(x, h(x, z) - 0.05, z, br.range(0, 6.283), H * br.range(0.9, 1.3), H, H * br.range(0.9, 1.3), br.range(-0.06, 0.06)) });
      made++;
    }
  }
  culms.forEach((list, k) => {
    if (!list.length) return;
    instanced(bv[k].culm, culmMat, list, `bamboo-culms-${k}`);
    const lm = instanced(bv[k].leaves, leafMat, list, `bamboo-leaves-${k}`);
    lm.userData.noCastShadow = false;
  });

  // ---------------------------------------------------------------------------
  // Clipped shrubs: clusters of overlapping lumpy domes, a few in autumn red.
  // ---------------------------------------------------------------------------
  function shrubGeo(seed) {
    const ico = new THREE.IcosahedronGeometry(1, 4);
    ico.deleteAttribute('uv'); ico.deleteAttribute('normal');
    const g = mergeVertices(ico);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color(), dark = new THREE.Color('#5a5a5a');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // fine leafy bumps over a smooth clipped dome
      const bump = 1 + 0.1 * (hash2(Math.round(x * 14), Math.round(z * 14) + Math.round(y * 14) * 31, seed) - 0.5);
      const sy = y < 0 ? 0.25 : 0.62;
      p.setXYZ(i, x * bump, y * sy * bump, z * bump);
      const k = Math.max(0, Math.min(1, 0.55 + 0.45 * y + 0.25 * (hash2(i, seed, 7) - 0.5)));
      c.copy(dark).lerp(new THREE.Color(1, 1, 1), k);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    // Leafy shading: jitter normals per vertex and speckle the colour, so the clipped
    // surface reads as packed small leaves rather than a smooth dome.
    const nrm = g.attributes.normal;
    for (let i = 0; i < nrm.count; i++) {
      const jx = hash2(i, seed, 11) - 0.5, jy = hash2(i, seed, 12) - 0.5, jz = hash2(i, seed, 13) - 0.5;
      const nx = nrm.getX(i) + jx * 0.9, ny = nrm.getY(i) + jy * 0.9, nz = nrm.getZ(i) + jz * 0.9;
      const l = Math.hypot(nx, ny, nz);
      nrm.setXYZ(i, nx / l, ny / l, nz / l);
      const k = 0.7 + 0.6 * hash2(i, seed, 14);
      col[i * 3] *= k; col[i * 3 + 1] *= k; col[i * 3 + 2] *= k;
    }
    return g;
  }
  const shrubMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const sr = rng.fork('shrubs');
  const shrubList = [];
  const green = [new THREE.Color('#1f3a18'), new THREE.Color('#2b4a1c'), new THREE.Color('#34521f')];
  const red = [new THREE.Color('#4a1a10'), new THREE.Color('#5a2614'), new THREE.Color('#3e2a14')];
  // Cluster seeds: along the wall foot, around the hall front corners, by the pond banks.
  const seeds = [];
  for (let i = 0; i < layout.garden.shrubClusters; i++) {
    const mode = i % 3;
    let x, z;
    if (mode === 0) { // wall foot
      const side = sr.int(0, 3), t = sr.next();
      x = side < 2 ? w.minX + 2.5 + t * (w.maxX - w.minX - 5) : side === 2 ? w.minX + 2.6 : w.maxX - 2.6;
      z = side === 0 ? w.minZ + 2.6 : side === 1 ? w.maxZ - 2.6 : w.minZ + 2.5 + t * (w.maxZ - w.minZ - 5);
    } else if (mode === 1) { // pond banks
      const th = sr.range(0, 6.283), rr = layout.pondRadiusAt(th) + layout.pond.bankWidth + sr.range(1.2, 3);
      x = layout.pond.center[0] + Math.cos(th) * rr; z = layout.pond.center[2] + Math.sin(th) * rr;
    } else { // free garden spots
      x = sr.range(w.minX + 4, w.maxX - 4); z = sr.range(w.minZ + 4, w.maxZ - 4);
    }
    seeds.push([x, z, sr.chance(0.15)]);
  }
  for (const [cx, cz, autumnal] of seeds) {
    const n = sr.int(2, 5);
    for (let k = 0; k < n; k++) {
      const x = cx + sr.gauss() * 0.9, z = cz + sr.gauss() * 0.9;
      const s = sr.range(0.35, 0.85);
      if (!inside(x, z, 1.2) || !layout.isClear(x, z, s)) continue;
      const c = (autumnal && sr.chance(0.7) ? sr.pick(red) : sr.pick(green)).clone().multiplyScalar(sr.range(0.85, 1.15));
      shrubList.push({ m: mtx(x, h(x, z) - 0.05, z, sr.range(0, 6.283), s * sr.range(1, 1.4), s * sr.range(0.9, 1.25), s), c });
    }
  }
  instanced(shrubGeo(3), shrubMat, shrubList, 'shrubs');

  // ---------------------------------------------------------------------------
  // Grass tufts: crossed curved blades, dry autumn ochre to olive.
  // ---------------------------------------------------------------------------
  function tuftGeo() {
    const r = rng.fork('tuft-geo');
    const pos = [], col = [], sw = [], idx = [];
    const base = new THREE.Color('#2e3a1c'), tip = new THREE.Color('#8f8a4e');
    const blades = 9;
    for (let b = 0; b < blades; b++) {
      const a = r.range(0, 6.283), lean = r.range(0.25, 0.8), H = r.range(0.45, 1), W = 0.05;
      const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
      const ox = dx * r.range(0, 0.12), oz = dz * r.range(0, 0.12);
      const b0 = pos.length / 3;
      const segs = 3;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const bend = lean * t * t;
        const cx = ox + dx * bend * H, cy = H * t * (1 - 0.25 * lean * t), cz = oz + dz * bend * H;
        const ww = W * (1 - t) + 0.002;
        pos.push(cx + px * ww, cy, cz + pz * ww, cx - px * ww, cy, cz - pz * ww);
        const c = base.clone().lerp(tip, t);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        sw.push(t * t, t * t);
        if (s < segs) { const q = b0 + s * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const grassMat = windy(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), 0.05);
  const gr = rng.fork('grass');
  const tufts = [];
  const field = layout.garden.outerField;
  const total = layout.garden.grassTufts;
  let tries = 0;
  while (tufts.length < total && tries++ < total * 8) {
    let x, z;
    if (gr.chance(0.3)) { x = gr.range(field.minX, field.maxX); z = gr.range(field.minZ, field.maxZ); }
    else { x = gr.range(w.minX + 1, w.maxX - 1); z = gr.range(w.minZ + 1, w.maxZ - 1); }
    // clumpy: noise field decides density
    const dens = 0.25 + hash2(Math.floor(x / 3), Math.floor(z / 3), 41) * 0.5 + hash2(Math.floor(x / 9), Math.floor(z / 9), 42) * 0.5;
    if (gr.next() > dens) continue;
    if (!layout.isClear(x, z, 0.25)) continue;
    if (Math.abs(x) < 2.6 && z > 62) continue; // outer approach paving
    if (z > 62 && Math.abs(x) < w.gateGapHalfWidth + 3 && z < 66) continue; // gate apron
    const s = gr.range(0.2, 0.42);
    const c = gr.chance(0.25) ? new THREE.Color(1.35, 1.2, 0.85) : new THREE.Color().setScalar(gr.range(0.7, 1.1));
    c.g *= gr.range(0.95, 1.08);
    tufts.push({ m: mtx(x, h(x, z) - 0.02, z, gr.range(0, 6.283), s * gr.range(0.8, 1.3), s, s * gr.range(0.8, 1.3)), c });
  }
  const grass = instanced(tuftGeo(), grassMat, tufts, 'grass');
  grass.userData.noCastShadow = true;

  // ---------------------------------------------------------------------------
  // Fallen leaves: carpets under every maple and ginkgo, densest near the trunk and
  // thinning past the crown edge, plus drifts against the wall foot and path kerbs.
  // ---------------------------------------------------------------------------
  function fallenLeafGeo() {
    // A small seven-pointed leaf outline as a triangle fan, slightly cupped.
    const pos = [0, 0.012, 0], col = [0.8, 0.8, 0.8], idx = [];
    const n = 14;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const lobe = k % 2 === 0 ? 1 : 0.55;
      const r = 0.5 * lobe * (a > Math.PI * 1.3 && a < Math.PI * 1.7 ? 0.6 : 1);
      pos.push(Math.cos(a) * r, 0.03 * r, Math.sin(a) * r);
      col.push(1, 1, 1);
      if (k > 0) idx.push(0, k + 1, k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const leafPalette = {
    maple: [[0.45, 0.03, 0.03], [0.62, 0.08, 0.03], [0.75, 0.2, 0.03], [0.55, 0.28, 0.06], [0.33, 0.12, 0.05]],
    ginkgo: [[0.85, 0.6, 0.06], [0.95, 0.72, 0.1], [0.7, 0.45, 0.06], [0.5, 0.35, 0.08]],
  };
  const lr = rng.fork('fallen');
  const fallen = [];
  for (const t of layout.trees) {
    if (t.kind !== 'maple' && t.kind !== 'ginkgo') continue;
    const pal = leafPalette[t.kind];
    const count = Math.round(900 * t.crown);
    for (let i = 0; i < count; i++) {
      const a = lr.range(0, 6.283);
      const d = t.crown * 1.35 * Math.pow(lr.next(), 0.75);
      const x = t.position[0] + Math.cos(a) * d, z = t.position[2] + Math.sin(a) * d;
      if (layout.pondEdgeDistance(x, z) < 0.2) continue; // the pond takes its own leaves
      if (!layout.isClear(x, z, 0) && Math.hypot(x - t.position[0], z - t.position[2]) > 1.3) {
        // allow leaves on paths and gravel (they fall anywhere), but not inside buildings
        const p = layout.pagoda.center, hc = layout.hall.center;
        if (Math.abs(x - hc[0]) < 14 && Math.abs(z - hc[2]) < 10) continue;
        if (Math.abs(x - p[0]) < 4.8 && Math.abs(z - p[2]) < 4.8) continue;
      }
      const c = lr.pick(pal);
      const k = lr.range(0.7, 1.15);
      fallen.push({
        m: mtx(x, h(x, z) + 0.015 + lr.range(0, 0.02), z, lr.range(0, 6.283), lr.range(0.07, 0.12), 1, lr.range(0.07, 0.12), lr.range(-0.25, 0.25)),
        c: new THREE.Color(c[0] * k, c[1] * k, c[2] * k),
      });
    }
  }
  const fallenMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
  const fl = instanced(fallenLeafGeo(), fallenMat, fallen, 'fallen-leaves');
  fl.userData.noCastShadow = true;

  // ---------------------------------------------------------------------------
  // A loose flock of crows crossing the dusk sky, north-east to south-west, toward
  // the sunset. Position and wing beat are pure functions of t.
  // ---------------------------------------------------------------------------
  function birdGeo() {
    // body along +X, wings spread on ±Z; sway = 1 on wing tips (flap amount)
    const pos = [
      0.5, 0, 0, -0.45, 0.02, 0.06, -0.45, 0.02, -0.06, // body
      0.12, 0, 0, -0.18, 0, 0, -0.05, 0.05, 0.9, // left wing
      0.12, 0, 0, -0.05, 0.05, -0.9, -0.18, 0, 0, // right wing
      -0.4, 0.02, 0, -0.7, 0.02, 0.14, -0.7, 0.02, -0.14, // tail
    ];
    const sw = [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 1));
    g.computeVertexNormals();
    return g;
  }
  const birdMat = new THREE.MeshBasicMaterial({ color: '#141014', side: THREE.DoubleSide });
  birdMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float sway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.07;
        transformed.y += sway * 0.55 * sin(uTime * 7.0 + ph);`);
  };
  const flock = [];
  const fr = rng.fork('birds');
  const N_BIRDS = 11;
  for (let i = 0; i < N_BIRDS; i++) flock.push({ dx: fr.gauss() * 9, dy: fr.gauss() * 3, dz: fr.gauss() * 9, ph: fr.range(0, 6.283), s: fr.range(0.75, 1.05) });
  const birds = new THREE.InstancedMesh(birdGeo(), birdMat, N_BIRDS);
  birds.name = 'crows';
  birds.frustumCulled = false;
  birds.userData.noCastShadow = true;
  birds.userData.noReceiveShadow = true;
  group.add(birds);
  const bq = new THREE.Quaternion(), bp = new THREE.Vector3(), bs = new THREE.Vector3(), bm = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);
  // Path: from (90, 52, -90) to (-150, 40, 110) over the 70 s film, gently weaving.
  const P0 = new THREE.Vector3(90, 52, -90), P1 = new THREE.Vector3(-150, 40, 110);
  const heading = Math.atan2(-(P1.z - P0.z), P1.x - P0.x);
  function updateBirds(t) {
    const u = t / layout.film.durationSec;
    flock.forEach((b, i) => {
      bp.copy(P0).lerp(P1, u);
      bp.x += b.dx + 2.5 * Math.sin(t * 0.4 + b.ph);
      bp.y += b.dy + 0.8 * Math.sin(t * 0.7 + b.ph);
      bp.z += b.dz + 2.5 * Math.cos(t * 0.33 + b.ph);
      bq.setFromAxisAngle(up, heading + 0.15 * Math.sin(t * 0.5 + b.ph));
      bs.setScalar(b.s);
      bm.compose(bp, bq, bs);
      birds.setMatrixAt(i, bm);
    });
    birds.instanceMatrix.needsUpdate = true;
  }
  updateBirds(0);

  group.name = 'garden';
  return {
    object: group,
    update(t) { time.value = t; updateBirds(t); },
  };
}
