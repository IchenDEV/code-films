// Layered mountain ridges 560-1250 m out. Each layer is a polar height field
// around the compound, shaded by real normals; world fog turns it blue-violet.
import * as THREE from 'three';
import { smoothstep, mix3, lerp } from './mesh.js';

const deg = Math.PI / 180;
const LAYERS = [
  { R: 560, depth: 150, color: '#222c3c', seed: 71 },
  { R: 760, depth: 170, color: '#2a3550', seed: 72 },
  { R: 980, depth: 190, color: '#33405e', seed: 73 },
  { R: 1250, depth: 200, color: '#3e4a6a', seed: 74 },
];
const AZ_SEGMENTS = 720;
const RAD_ROWS = 10;
const BASE_Y = -90;
const REF_Y = 3; // eye height the elevation angles are measured from

export function buildMountains({ noise, center }) {
  const { fbm2, valueNoise2 } = noise;

  // Crest elevation angle (degrees) at azimuth az (degrees from north, clockwise).
  function crestElev(az, li) {
    const sun = Math.cos((az - 247.5) * deg);
    const sunMask = smoothstep(0.45, 0.85, sun);
    const north = Math.cos((az - 35) * deg);
    const tallAmp = 2.6 + 6.5 * smoothstep(-0.3, 0.75, north);
    const r = fbm2(az / 14 + li * 13.1, li * 7.7, 3, 90 + li);
    const jag = fbm2(az * 0.25 + li * 3.3, li * 1.9, 2, 95 + li);
    const tall = tallAmp * (0.55 + 0.95 * r) * (0.9 + 0.2 * jag) * (1 + 0.06 * li);
    const low = 0.6 + 1.8 * Math.min(1, Math.max(0, r * 1.2 - 0.1)) + 0.25 * jag;
    return lerp(tall, low, sunMask);
  }

  const geos = [];
  LAYERS.forEach((L, li) => {
    const nA = AZ_SEGMENTS + 1, nR = RAD_ROWS + 1;
    const pos = new Float32Array(nA * nR * 3);
    const col = new Float32Array(nA * nR * 3);
    const base = new THREE.Color(L.color);
    const baseRgb = [base.r, base.g, base.b];
    const crestRgb = mix3(baseRgb, [0.16, 0.14, 0.2], 0.5);
    const crestY = new Float32Array(nA);
    for (let a = 0; a < nA; a++) {
      const az = (a / AZ_SEGMENTS) * 360;
      const elev = crestElev(az, li);
      crestY[a] = Math.tan(elev * deg) * L.R + REF_Y;
    }
    for (let a = 0; a < nA; a++) {
      const azD = (a / AZ_SEGMENTS) * 360;
      const az = azD * deg;
      const dirX = Math.sin(az), dirZ = -Math.cos(az);
      for (let r = 0; r < nR; r++) {
        // q: -1 at the front toe, 0 at the crest line, +0.5 at the back.
        const q = -1 + (r / RAD_ROWS) * 1.5;
        const rho = L.R + q * L.depth;
        let f;
        if (q < 0) f = 1 - Math.pow(-q, 1.6) * (1 - 0.0);
        else f = 1 - Math.pow(q / 0.5, 1.4) * 0.55;
        // Spurs: the ridge breaks into shoulders running toward the viewer.
        const spur = 0.86 + 0.28 * fbm2(azD * 0.4 + li * 5, rho / 160, 2, 120 + li);
        const h = BASE_Y + (crestY[a] - BASE_Y) * Math.max(0, f) * (q < 0 ? Math.min(1.2, spur) : 1);
        const hh = q < -0.97 ? BASE_Y : h;
        const k = a * nR + r;
        pos[k * 3] = center[0] + dirX * rho;
        pos[k * 3 + 1] = hh;
        pos[k * 3 + 2] = center[2] + dirZ * rho;
        const t = smoothstep(0.1, 1.0, Math.max(0, (hh - BASE_Y) / (crestY[a] - BASE_Y)));
        const speck = 0.85 + 0.3 * valueNoise2(azD * 6, rho / 25, 130 + li);
        const c = mix3(baseRgb, crestRgb, t * 0.6);
        col[k * 3] = c[0] * speck; col[k * 3 + 1] = c[1] * speck; col[k * 3 + 2] = c[2] * speck;
      }
    }
    const idx = [];
    for (let a = 0; a < nA - 1; a++) {
      for (let r = 0; r < nR - 1; r++) {
        const p = a * nR + r, q2 = p + 1, s = p + nR, t = s + 1;
        // Seen from the compound: triangles wound to face the centre.
        idx.push(p, q2, s, q2, t, s);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    geos.push(g);
  });

  const merged = mergeIndexed(geos);
  merged.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ name: 'ridges', vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = 'ridges';
  mesh.userData.noCastShadow = true;
  mesh.userData.noReceiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function mergeIndexed(geos) {
  let vCount = 0, iCount = 0;
  for (const g of geos) { vCount += g.attributes.position.count; iCount += g.index.count; }
  const pos = new Float32Array(vCount * 3), col = new Float32Array(vCount * 3), index = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, vo * 3);
    col.set(g.attributes.color.array, vo * 3);
    for (let i = 0; i < g.index.count; i++) index[io + i] = g.index.array[i] + vo;
    vo += g.attributes.position.count; io += g.index.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  return out;
}
