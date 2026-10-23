// Geometry kit for the precinct: one accumulator per material (each becomes one
// merged mesh, one draw call), and a few sweeps/revolutions used by every part.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { fbm2 } from '../../rng.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3();
const _s = new THREE.Vector3(), _e = new THREE.Euler();

// Collects geometry (already transformed) for one material.
export class Acc {
  constructor() { this.geos = []; }

  add(geo, matrix) {
    const g = geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
    if (matrix) g.applyMatrix4(matrix);
    this.geos.push(g);
  }

  // Move another accumulator's geometry into this one, translated by (x, y, z).
  absorb(other, x = 0, y = 0, z = 0) {
    _m.makeTranslation(x, y, z);
    for (const g of other.geos) this.geos.push(g.clone().applyMatrix4(_m));
    other.geos.length = 0;
  }

  geometry() {
    const g = mergeGeometries(this.geos, false);
    this.geos.length = 0;
    g.computeBoundingSphere();
    return g;
  }
}

export const MATERIAL_KEYS = ['stone', 'stoneMoss', 'moss', 'bronze', 'vermilion', 'wood', 'woodRaw', 'roofTile', 'plaster'];
export const accSet = () => Object.fromEntries(MATERIAL_KEYS.map((k) => [k, new Acc()]));

// Place geo with position, Euler rotation (YXZ) and scale into acc.
export function put(acc, geo, x, y, z, { rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
  acc.add(geo, _m);
}

const cache = new Map();
export const cached = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};
export const unitBox = () => cached('box', () => new THREE.BoxGeometry(1, 1, 1));
export const unitCyl = (seg = 10) => cached(`cyl${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1));
export const unitSphere = (w = 10, h = 6) => cached(`sph${w}/${h}`, () => new THREE.SphereGeometry(1, w, h));

// Box by extents.
export function box(acc, x0, x1, y0, y1, z0, z1) {
  put(acc, unitBox(), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, { sx: x1 - x0, sy: y1 - y0, sz: z1 - z0 });
}

// Bevelled box centred at (x, y, z).
export function rbox(acc, x, y, z, w, h, d, radius = 0.03, seg = 2, rot = {}) {
  const g = cached(`rb${w}/${h}/${d}/${radius}/${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, radius));
  put(acc, g, x, y, z, rot);
}

export function sphere(acc, x, y, z, rx, ry = rx, rz = rx, w = 10, h = 6, rot = {}) {
  put(acc, unitSphere(w, h), x, y, z, { sx: rx, sy: ry, sz: rz, ...rot });
}

// Vertical cylinder from y0 to y1.
export function cyl(acc, x, z, y0, y1, rBottom, rTop = rBottom, seg = 12) {
  const g = cached(`cyl${rTop}/${rBottom}/${seg}`, () => new THREE.CylinderGeometry(rTop, rBottom, 1, seg, 1));
  put(acc, g, x, (y0 + y1) / 2, z, { sy: y1 - y0 });
}

// Surface of revolution about +Y from profile [[r, y], ...]. Profiles that run
// bottom-to-top face outward; a profile that runs down an inner wall faces the cavity.
export function lathe(profile, seg = 24) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

// Displace vertices along their normals with position-based noise (coincident
// vertices move together, so seams stay closed). Used for hand-carved stone.
export function roughen(geo, amp, freq, seed = 1, where) {
  const P = geo.attributes.position, N = geo.attributes.normal;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (where && !where(x, y, z)) continue;
    const n = (fbm2(x * freq + y * freq * 0.7, z * freq - y * freq * 0.7, 3, seed) - 0.5) * 2 * amp;
    P.setXYZ(i, x + N.getX(i) * n, y + N.getY(i) * n, z + N.getZ(i) * n);
  }
  P.needsUpdate = true;
  return geo;
}

// Parametric grid surface: fn(i, j) -> [x, y, z] for i in 0..nu, j in 0..nv.
// uv = (j / nv * uScale, i / nu * vScale). face: direction the surface should look toward
// (the winding is chosen to match); without it, flip reverses the default facing.
export function grid(nu, nv, fn, { flip = false, face, uScale = 1, vScale = 1 } = {}) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  let k = 0;
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++, k++) {
      const p = fn(i, j);
      pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2];
      uv[k * 2] = (j / nv) * uScale; uv[k * 2 + 1] = (i / nu) * vScale;
    }
  }
  if (face) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = (i * (nv + 1) + j) * 3, b = a + 3, c = a + (nv + 1) * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
        const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        nx += uy * vz - uz * vy; ny += uz * vx - ux * vz; nz += ux * vy - uy * vx;
      }
    }
    flip = nx * face[0] + ny * face[1] + nz * face[2] < 0;
  }
  const idx = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Sweep a round cross-section along a polyline. radii: number or one per point.
export function tube(pts, radii, sides = 8, { caps = true } = {}) {
  const n = pts.length;
  const P = pts.map((p) => new THREE.Vector3(...p));
  const T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  let N = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const pos = [], nor = [], uv = [], idx = [];
  const rings = [];
  let len = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) len += P[i].distanceTo(P[i - 1]);
    N = N.sub(T[i].clone().multiplyScalar(N.dot(T[i]))).normalize();
    const B = T[i].clone().cross(N);
    const r = Array.isArray(radii) ? radii[i] : radii;
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const d = N.clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos.push(P[i].x + d.x * r, P[i].y + d.y * r, P[i].z + d.z * r);
      nor.push(d.x, d.y, d.z);
      uv.push(j / sides, len);
    }
    rings.push(N.clone());
  }
  const cols = sides + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  if (caps) {
    for (const end of [0, n - 1]) {
      const base = pos.length / 3;
      const t = T[end];
      const nz = end === 0 ? -1 : 1;
      pos.push(P[end].x, P[end].y, P[end].z); nor.push(t.x * nz, t.y * nz, t.z * nz); uv.push(0.5, 0.5);
      for (let j = 0; j <= sides; j++) {
        const o = (end * cols + j) * 3;
        pos.push(pos[o], pos[o + 1], pos[o + 2]); nor.push(t.x * nz, t.y * nz, t.z * nz); uv.push(0.5, 0.5);
      }
      for (let j = 0; j < sides; j++) {
        if (end === n - 1) idx.push(base, base + 1 + j, base + 2 + j);
        else idx.push(base, base + 2 + j, base + 1 + j);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Smooth 0..1..0 bump centred at c with half-width w.
export const bump = (x, c, w) => {
  const u = Math.max(0, 1 - Math.abs(x - c) / w);
  return u * u * (3 - 2 * u);
};
