// Geometry accumulator and primitives for the pagoda. Every part is appended,
// already transformed, to one accumulator per material, so each material
// becomes one merged mesh (one draw call).
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3();
const _s = new THREE.Vector3(), _e = new THREE.Euler(), _v = new THREE.Vector3();
const _n3 = new THREE.Matrix3(), _mm = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

export class Acc {
  constructor() {
    this.pos = []; this.nor = []; this.uv = [];
    this.frame = new THREE.Matrix4();
  }

  // Append geo transformed by frame * m.
  add(geo, m) {
    const M = m ? _mm.multiplyMatrices(this.frame, m) : this.frame;
    const nm = _n3.getNormalMatrix(M);
    const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv;
    const ix = geo.index;
    const n = ix ? ix.count : P.count;
    for (let k = 0; k < n; k++) {
      const i = ix ? ix.getX(k) : k;
      _v.fromBufferAttribute(P, i).applyMatrix4(M);
      this.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      this.nor.push(_v.x, _v.y, _v.z);
      this.uv.push(U.getX(i), U.getY(i));
    }
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere();
    return g;
  }

  get triangles() { return this.pos.length / 9; }
}

// Run fn(k) once per side with every accumulator's frame rotated so local +Z is
// outward, +X runs along the face: k = 0 S, 1 E, 2 N, 3 W.
export function sides(accs, fn) {
  for (let k = 0; k < 4; k++) {
    for (const a of accs) a.frame.makeRotationY(k * Math.PI / 2);
    fn(k);
  }
  for (const a of accs) a.frame.identity();
}

// Run fn with the frame turned by `ry` about the vertical axis through (x, z).
export function pivoted(acc, x, z, ry, fn) {
  const saved = acc.frame.clone();
  const t = new THREE.Matrix4().makeTranslation(x, 0, z)
    .multiply(new THREE.Matrix4().makeRotationY(ry))
    .multiply(new THREE.Matrix4().makeTranslation(-x, 0, -z));
  acc.frame.multiply(t);
  fn();
  acc.frame.copy(saved);
}

export function put(acc, geo, x, y, z, { ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
  acc.add(geo, _m);
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
// Box by extents.
export function bx(acc, x0, x1, y0, y1, z0, z1) {
  put(acc, UNIT_BOX, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, { sx: x1 - x0, sy: y1 - y0, sz: z1 - z0 });
}

const cache = new Map();
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

// Cylinder from y0 to y1 at (x, z).
export function cyl(acc, x, z, y0, y1, rBottom, rTop = rBottom, seg = 14) {
  const g = cached(`cyl${rTop}/${rBottom}/${seg}`, () => new THREE.CylinderGeometry(rTop, rBottom, 1, seg, 1));
  put(acc, g, x, (y0 + y1) / 2, z, { sy: y1 - y0 });
}

// Square frustum (bearing block): bottom and top side lengths.
export function frustum(acc, x, z, y0, y1, sizeBottom, sizeTop) {
  const k = Math.SQRT1_2;
  const g = cached(`fr${sizeTop}/${sizeBottom}`, () => new THREE.CylinderGeometry(sizeTop * k, sizeBottom * k, 1, 4, 1).rotateY(Math.PI / 4));
  put(acc, g, x, (y0 + y1) / 2, z, { sy: y1 - y0 });
}

export function sphere(acc, x, y, z, rx, ry = rx, rz = rx, seg = 10) {
  const g = cached(`sph${seg}`, () => new THREE.SphereGeometry(1, seg, Math.max(4, seg >> 1)));
  put(acc, g, x, y, z, { sx: rx, sy: ry, sz: rz });
}

// Sweep a cross-section along a polyline. radii: number or per-point array.
// flat: one normal per side (angular parts), else smooth.
export function tube(acc, pts, radii, sides = 8, { caps = true, flat = false, phase = 0 } = {}) {
  const n = pts.length;
  const P = pts.map((p) => new THREE.Vector3(...p));
  const T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  const Nn = [], Bn = [];
  let ref = Math.abs(T[0].dot(UP)) > 0.95 ? new THREE.Vector3(1, 0, 0) : UP;
  let N = new THREE.Vector3().crossVectors(T[0], ref).normalize();
  for (let i = 0; i < n; i++) {
    N = N.clone().addScaledVector(T[i], -N.dot(T[i])).normalize();
    Nn.push(N);
    Bn.push(new THREE.Vector3().crossVectors(T[i], N));
  }
  const rad = (i) => (Array.isArray(radii) ? radii[i] : radii);
  const pos = [], nor = [], uv = [];
  const ring = (i, a, nrmAngle) => {
    const c = Math.cos(a), s = Math.sin(a);
    const dir = new THREE.Vector3().addScaledVector(Nn[i], c).addScaledVector(Bn[i], s);
    const nd = nrmAngle === undefined ? dir : new THREE.Vector3().addScaledVector(Nn[i], Math.cos(nrmAngle)).addScaledVector(Bn[i], Math.sin(nrmAngle));
    return { p: P[i].clone().addScaledVector(dir, rad(i)), n: nd };
  };
  const push = (v, i, j) => { pos.push(v.p.x, v.p.y, v.p.z); nor.push(v.n.x, v.n.y, v.n.z); uv.push(j / sides, i / (n - 1)); };
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a0 = phase + (j / sides) * Math.PI * 2, a1 = phase + ((j + 1) / sides) * Math.PI * 2;
      const mid = (a0 + a1) / 2;
      const a = ring(i, a0, flat ? mid : undefined), b = ring(i, a1, flat ? mid : undefined);
      const c = ring(i + 1, a0, flat ? mid : undefined), d = ring(i + 1, a1, flat ? mid : undefined);
      push(a, i, j); push(b, i, j + 1); push(c, i + 1, j);
      push(b, i, j + 1); push(d, i + 1, j + 1); push(c, i + 1, j);
    }
  }
  if (caps) {
    for (const [i, sgn] of [[0, -1], [n - 1, 1]]) {
      const ctr = { p: P[i].clone(), n: T[i].clone().multiplyScalar(sgn) };
      for (let j = 0; j < sides; j++) {
        const a0 = phase + (j / sides) * Math.PI * 2, a1 = phase + ((j + 1) / sides) * Math.PI * 2;
        const p0 = ring(i, a0), p1 = ring(i, a1);
        p0.n = ctr.n; p1.n = ctr.n;
        if (sgn > 0) { push(ctr, i, 0); push(p0, i, 0); push(p1, i, 0); } else { push(ctr, i, 0); push(p1, i, 0); push(p0, i, 0); }
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  acc.add(g);
}

// Surface of revolution about Y. profile: [[r, y], ...] walked so the visible
// face is on the +r side when y rises (outer walls bottom to top, inner walls
// top to bottom). mod(theta, k) scales the radius of profile point k.
export function revolve(profile, seg = 24, mod = null) {
  const cols = seg + 1, rows = profile.length;
  const pos = [], uv = [], idx = [];
  for (let k = 0; k < rows; k++) {
    for (let j = 0; j < cols; j++) {
      const th = (j / seg) * Math.PI * 2;
      const r = profile[k][0] * (mod ? mod(th, k) : 1);
      pos.push(r * Math.sin(th), profile[k][1], r * Math.cos(th));
      uv.push(j / seg, k / (rows - 1));
    }
  }
  for (let k = 0; k < rows - 1; k++) {
    for (let j = 0; j < seg; j++) {
      const a = k * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Weld the seam normals.
  const nrm = g.attributes.normal;
  for (let k = 0; k < rows; k++) {
    const i0 = k * cols, i1 = k * cols + seg;
    _v.set(nrm.getX(i0) + nrm.getX(i1), nrm.getY(i0) + nrm.getY(i1), nrm.getZ(i0) + nrm.getZ(i1)).normalize();
    nrm.setXYZ(i0, _v.x, _v.y, _v.z); nrm.setXYZ(i1, _v.x, _v.y, _v.z);
  }
  return g;
}

// Regular grid surface. fn(i, j) -> [x, y, z]; wantDir flips the winding so the
// normal faces that way (checked at the middle vertex).
export function gridGeo(nu, nv, fn, wantDir, uvScale = 0.5) {
  const pos = [], uv = [], idx = [];
  const pts = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) pts.push(fn(i, j));
  for (const p of pts) pos.push(p[0], p[1], p[2]);
  let acc0 = 0;
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const p = pts[i * (nv + 1) + j];
      uv.push((p[0] + p[2]) * uvScale, p[1] * uvScale + i * 0.3);
    }
  }
  const row = nv + 1;
  const quad = (a, b, c, d) => idx.push(a, b, c, b, d, c);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * row + j; quad(a, a + 1, a + row, a + row + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mid = Math.floor(nu / 2) * row + Math.floor(nv / 2);
  const nrm = g.attributes.normal;
  acc0 = nrm.getX(mid) * wantDir[0] + nrm.getY(mid) * wantDir[1] + nrm.getZ(mid) * wantDir[2];
  if (acc0 < 0) {
    const flipped = [];
    for (let t = 0; t < idx.length; t += 3) flipped.push(idx[t], idx[t + 2], idx[t + 1]);
    g.setIndex(flipped);
    g.computeVertexNormals();
  }
  return g;
}
