// Ground mesh: a tensor grid that is fine near the compound and pond and grows
// coarser toward 1500 m, coloured per vertex (moss, earth, forest floor, fields).
import * as THREE from 'three';
import { smoothstep, mix3 } from './mesh.js';

const EXTENT = 1500;
const deg = Math.PI / 180;

// Grid lines along one axis. Each region keeps `step` inside it and the step
// grows 12% of the distance outside it, up to 90 m.
function axisLines(regions) {
  const out = [];
  let c = -EXTENT;
  while (c < EXTENT) {
    out.push(c);
    let step = 90;
    for (const r of regions) {
      const dist = Math.max(0, r.lo - c, c - r.hi);
      step = Math.min(step, r.step + 0.12 * dist);
    }
    c += step;
  }
  out.push(EXTENT);
  return out;
}

const c3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

const PAL = {
  mossDark: c3('#33441f'),
  mossLight: c3('#5f6e32'),
  earth: c3('#4a3a28'),
  dryMoss: c3('#6a6634'),
  mud: c3('#221f16'),
  wet: c3('#1c2616'),
  floor: c3('#34301e'),
  litter: c3('#58381c'),
  grass: c3('#75693a'),
  canopy: c3('#1d2a1c'),
  canopyRed: c3('#5c3216'),
  canopyGold: c3('#6a5424'),
  stubble: c3('#8a7a46'),
  cropGreen: c3('#3f5428'),
  bare: c3('#5e4a30'),
};

export function buildGround({ layout, noise }) {
  const { fbm2, valueNoise2 } = noise;
  const w = layout.wall;
  const pond = layout.pond;

  const xs = axisLines([
    { lo: -30, hi: 30, step: 0.5 },
    { lo: -64, hi: 64, step: 1.5 },
    { lo: -8, hi: 8, step: 1.0 },
  ]);
  const zs = axisLines([
    { lo: pond.center[2] - 13, hi: pond.center[2] + 13, step: 0.5 },
    { lo: -64, hi: 106, step: 1.5 },
  ]);

  // Terrain height. Exact where trees stand (within 200 m of the terrace); far
  // out the hills are softly capped so the layered ridges behind read as taller.
  const edgeDist = (x, z) => {
    const dx = Math.max(0, -56 - x, x - 56);
    const dz = Math.max(0, -56 - z, z - 70);
    return Math.hypot(dx, dz);
  };
  const HCAP = 75;
  const heightAt = (x, z) => {
    const h = layout.terrainHeight(x, z);
    if (h <= 0) return h;
    const k = smoothstep(200, 400, edgeDist(x, z));
    return h + (HCAP * Math.tanh(h / HCAP) - h) * k;
  };

  const nx = xs.length, nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);

  const colorAt = (x, z, h) => {
    const sd = Math.max(w.minX - x, x - w.maxX, w.minZ - z, z - w.maxZ);
    const d = edgeDist(x, z);
    const inside = smoothstep(2.5, -1.5, sd);

    const big = fbm2(x / 9, z / 9, 4, 31);
    const mid = fbm2(x / 2.1, z / 2.1, 3, 32);
    const fine = valueNoise2(x * 3.1, z * 3.1, 33);

    // Compound: dry autumn moss over packed earth.
    let ci = mix3(PAL.earth, PAL.mossDark, smoothstep(0.32, 0.55, big));
    ci = mix3(ci, PAL.mossLight, smoothstep(0.5, 0.75, mid) * 0.7);
    ci = mix3(ci, PAL.dryMoss, smoothstep(0.55, 0.85, fbm2(x / 5, z / 5, 3, 34)) * 0.55);
    const pe = layout.pondEdgeDistance(x, z);
    ci = mix3(ci, PAL.wet, smoothstep(5, 0.5, pe) * 0.65);
    ci = mix3(ci, PAL.mud, smoothstep(0.2, -0.8, pe));
    // Damp, darker strip along the foot of the wall.
    const wallFoot = Math.min(Math.abs(sd + w.thickness * 0.5), 9);
    ci = mix3(ci, PAL.wet, smoothstep(2.0, 0.2, wallFoot) * 0.5 * inside);

    // Outside: forest floor with leaf litter, turning to canopy on the far hills.
    const fl = fbm2(x / 6, z / 6, 3, 41);
    let co = mix3(PAL.floor, PAL.litter, smoothstep(0.4, 0.7, fl) * 0.6);
    co = mix3(co, PAL.grass, smoothstep(0.55, 0.85, fbm2(x / 23, z / 23, 3, 42)) * 0.6);
    const canopyAmt = smoothstep(70, 260, d);
    let canopy = mix3(PAL.canopy, PAL.canopyRed, smoothstep(0.52, 0.78, fbm2(x / 38, z / 38, 4, 43)) * 0.8);
    canopy = mix3(canopy, PAL.canopyGold, smoothstep(0.55, 0.8, fbm2(x / 52 + 9, z / 52, 3, 44)) * 0.55);
    canopy = mix3(canopy, PAL.canopy, smoothstep(0.45, 0.55, fbm2(x / 15, z / 15, 3, 45)) * 0.35);
    co = mix3(co, canopy, canopyAmt);

    // The valley toward the sunset: harvested fields in strips.
    const az = Math.atan2(x, -(z - 7));
    const rise = Math.cos(az - 25 * deg);
    const valley = smoothstep(-0.15, -0.42, rise) * smoothstep(25, 70, d) * (1 - smoothstep(500, 900, d));
    if (valley > 0) {
      const block = fbm2(x / 95 + 3, z / 95, 3, 51);
      const ang = 0.35;
      const rows = 0.5 + 0.5 * Math.sin(((x * Math.cos(ang) + z * Math.sin(ang)) / 3.4) * Math.PI * 2);
      const idx = Math.floor((x * Math.cos(ang) + z * Math.sin(ang)) / 70 + 4.5 * fbm2(x / 160, z / 160, 2, 52));
      const pick = valueNoise2(idx * 1.7, Math.floor(block * 8) * 2.3, 53);
      let field = pick < 0.4 ? PAL.stubble : pick < 0.7 ? PAL.cropGreen : PAL.bare;
      field = mix3(field, PAL.floor, rows * 0.25);
      co = mix3(co, field, valley * 0.9);
    }

    const base = mix3(co, ci, inside);
    const s = 1.08 + 0.28 * fine;
    return [base[0] * s, base[1] * s, base[2] * s];
  };

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j];
      const h = heightAt(x, z);
      const k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      const c = colorAt(x, z, h);
      col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
    }
  }
  const index = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let q = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      // Alternate the diagonal so slopes do not show one grain.
      if ((i + j) & 1) { index.set([a, c, b, b, c, d], q); } else { index.set([a, c, d, a, d, b], q); }
      q += 6;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();

  // Fine grey detail that tiles every 6 m; macro colour comes from the vertices.
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = i / size, v = j / size;
      const f = (a, b) => fbm2(a * 24, b * 24, 5, 61);
      const n = f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
      const t = Math.min(1, Math.max(0, (n - 0.3) / 0.4));
      const g = Math.round(255 * (0.55 + 0.45 * t));
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = g; data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  const mat = new THREE.MeshStandardMaterial({ name: 'terrainGround', vertexColors: true, map: tex, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ground';
  mesh.userData.noCastShadow = true;
  return { mesh, heightAt };
}
