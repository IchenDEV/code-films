// Geometry kit shared by the hall and the gate: a bag that merges parts per
// material, small transform helpers, and a profile sweep.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Matrix from position, Euler rotation (YXZ order) and scale.
export function xf(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// Matrix that maps local +Y to the direction a -> b and places the origin at a.
export function between(a, b, sx = 1, sz = sx) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  _q.setFromUnitVectors(_p.set(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(a, _q, _s.set(sx, len, sz));
}

export class Bag {
  constructor() {
    this.parts = new Map();
  }

  // Adds a copy of geo (optionally transformed) under material mat.
  add(mat, geo, matrix) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (matrix) g.applyMatrix4(matrix);
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g);
    return this;
  }

  box(mat, w, h, d, x = 0, y = 0, z = 0, ry = 0, rz = 0) {
    // Small edge radii let timber beams and stone steps catch grazing light.
    const radius = Math.min(0.025, Math.min(w, h, d) * 0.08);
    const geo = new RoundedBoxGeometry(w, h, d, 1, radius);
    this.add(mat, geo, xf(x, y, z, 0, ry, rz));
    geo.dispose();
    return this;
  }

  // Merged meshes into group; one per material.
  flush(group, namePrefix = '') {
    for (const [mat, list] of this.parts) {
      const geo = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `${namePrefix}${mat.name || 'mat'}`;
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }

  triangleCount() {
    let n = 0;
    for (const list of this.parts.values()) for (const g of list) n += g.attributes.position.count / 3;
    return n;
  }
}

// Sweeps a 2D profile along a 3D path. Profile points are [right, up] in the
// frame whose "right" is cross(tangent, worldUp) and "up" is the world up
// bent by the tangent. closedProfile joins the last profile point to the first.
export function sweep(profile, path, { closedProfile = false, closedPath = false, uScale = 1, up = new THREE.Vector3(0, 1, 0) } = {}) {
  const n = path.length, m = profile.length;
  const pos = [], uv = [], idx = [];
  const tan = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
  let run = 0;
  for (let i = 0; i < n; i++) {
    const a = closedPath ? path[(i - 1 + n) % n] : path[Math.max(0, i - 1)];
    const b = closedPath ? path[(i + 1) % n] : path[Math.min(n - 1, i + 1)];
    tan.subVectors(b, a).normalize();
    right.crossVectors(tan, up).normalize();
    upv.crossVectors(right, tan).normalize();
    if (i > 0) run += path[i].distanceTo(path[i - 1]);
    for (let k = 0; k < m; k++) {
      const [r, u] = profile[k];
      pos.push(
        path[i].x + right.x * r + upv.x * u,
        path[i].y + right.y * r + upv.y * u,
        path[i].z + right.z * r + upv.z * u,
      );
      uv.push(run * uScale, k / (m - 1));
    }
  }
  const segs = closedProfile ? m : m - 1;
  const rowsN = closedPath ? n : n - 1;
  for (let i = 0; i < rowsN; i++) {
    const i2 = (i + 1) % n;
    for (let k = 0; k < segs; k++) {
      const k2 = (k + 1) % m;
      const a = i * m + k, b = i * m + k2, c = i2 * m + k, d = i2 * m + k2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Lathe from [radius, y] pairs, y rising.
export function lathe(points, segments = 24) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

// Extrude a closed 2D outline (array of [x, y]) along +Z by depth, centred on z = 0.
export function extrudeOutline(points, depth, { bevel = 0, curveSegments = 8 } = {}) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return extrudeShape(shape, depth, { bevel, curveSegments });
}

export function extrudeShape(shape, depth, { bevel = 0, curveSegments = 8 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
