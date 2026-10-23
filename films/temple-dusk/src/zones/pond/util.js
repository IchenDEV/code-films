// Geometry helpers shared by the pond zone files.
// Every geometry built here carries position, normal, color and uv, so any of
// them can be merged with any other.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const mix = (a, b, t) => a + (b - a) * t;
export const mixRgb = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// sRGB hex -> linear rgb triple (vertex colours are read as linear).
export const rgb = (hex) => new THREE.Color(hex).toArray();

// A (nu+1) x (nvc) grid surface. fn(i, j, o) fills o.p [x,y,z], o.c [r,g,b], o.uv [u,v]
// and optionally o.f (the flap weight stored in aFlap). wrap: j runs around a closed ring.
export function surface(nu, nv, fn, { wrap = false, flap = false } = {}) {
  const nvc = wrap ? nv : nv + 1;
  const n = (nu + 1) * nvc;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const fl = flap ? new Float32Array(n) : null;
  const o = { p: [0, 0, 0], c: [1, 1, 1], uv: [0, 0], f: 0 };
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j < nvc; j++) {
      o.f = 0; o.uv[0] = 0; o.uv[1] = 0;
      fn(i, j, o);
      const k = i * nvc + j;
      pos.set(o.p, k * 3); col.set(o.c, k * 3); uv.set(o.uv, k * 2);
      if (fl) fl[k] = o.f;
    }
  }
  const index = [];
  const vmax = wrap ? nvc : nvc - 1;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < vmax; j++) {
      const a = i * nvc + j, b = i * nvc + ((j + 1) % nvc), c = (i + 1) * nvc + j, d = (i + 1) * nvc + ((j + 1) % nvc);
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (fl) g.setAttribute('aFlap', new THREE.BufferAttribute(fl, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

// Swept tube along a polyline. radius(s), color(s) take s in [0,1].
export function tube(points, radius, color, sides = 5) {
  const n = points.length;
  const P = points.map((p) => new THREE.Vector3(...p));
  const T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  return surface(n - 1, sides, (i, j, o) => {
    const t = T[i];
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(t, ref).normalize();
    const v = new THREE.Vector3().crossVectors(t, u);
    const s = i / (n - 1), r = radius(s), a = (j / sides) * Math.PI * 2;
    o.p = [P[i].x + (u.x * Math.cos(a) + v.x * Math.sin(a)) * r, P[i].y + (u.y * Math.cos(a) + v.y * Math.sin(a)) * r, P[i].z + (u.z * Math.cos(a) + v.z * Math.sin(a)) * r];
    o.c = color(s);
    o.uv = [j / sides, s];
  }, { wrap: true });
}

// Give a stock three.js geometry the position/normal/color/uv layout used here.
export function tinted(geo, color, flapWeight = null) {
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set(color, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (flapWeight !== null) geo.setAttribute('aFlap', new THREE.BufferAttribute(new Float32Array(n).fill(flapWeight), 1));
  return geo;
}

export function merge(list) {
  const g = mergeGeometries(list, false);
  list.forEach((x) => x.dispose());
  return g;
}

// Euler-free placement: scale, rotate about X/Y/Z (radians) then translate.
export function place(geo, { pos = [0, 0, 0], rotY = 0, rotX = 0, rotZ = 0, scale = 1 } = {}) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ, 'YXZ')),
    new THREE.Vector3().setScalar(scale),
  );
  geo.applyMatrix4(m);
  return geo;
}
