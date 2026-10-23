// Small flat-shaded triangle collector for the terrain zone's stone, plaster and
// tile parts. Every triangle is given the outward normal it should face, so the
// winding order is fixed here once and never reasoned about at the call sites.
import * as THREE from 'three';

export class TriBuilder {
  constructor() {
    this.pos = [];
    this.col = [];
    this.uv = [];
  }

  // a, b, c: [x, y, z]. expect: [x, y, z] direction the triangle must face.
  // ca, cb, cc: optional vertex colours [r, g, b]. ua, ub, uc: optional [u, v].
  tri(a, b, c, expect, ca = [1, 1, 1], cb = ca, cc = ca, ua, ub, uc) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-14) return;
    if (nx * expect[0] + ny * expect[1] + nz * expect[2] < 0) {
      [b, c] = [c, b];
      [cb, cc] = [cc, cb];
      [ub, uc] = [uc, ub];
    }
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.col.push(...ca, ...cb, ...cc);
    if (ua) this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    else this.uv.push(NaN, NaN, NaN, NaN, NaN, NaN);
  }

  quad(a, b, c, d, expect, ca = [1, 1, 1], cb = ca, cc = ca, cd = ca, ua, ub, uc, ud) {
    this.tri(a, b, c, expect, ca, cb, cc, ua, ub, uc);
    this.tri(a, c, d, expect, ca, cc, cd, ua, uc, ud);
  }

  // Move every vertex by f(x, y, z) -> [dx, dy, dz]. f depends on position only,
  // so duplicated vertices of neighbouring faces stay joined.
  displace(f) {
    const p = this.pos;
    for (let i = 0; i < p.length; i += 3) {
      const d = f(p[i], p[i + 1], p[i + 2]);
      p[i] += d[0]; p[i + 1] += d[1]; p[i + 2] += d[2];
    }
  }

  // Recolour every vertex: f(x, y, z, current rgb) -> rgb.
  recolor(f) {
    const p = this.pos, c = this.col;
    for (let i = 0; i < p.length; i += 3) {
      const o = f(p[i], p[i + 1], p[i + 2], [c[i], c[i + 1], c[i + 2]]);
      c[i] = o[0]; c[i + 1] = o[1]; c[i + 2] = o[2];
    }
  }

  // uvScale: metres per texture repeat for the box-projected default UVs.
  geometry(uvScale = 1) {
    const n = this.pos.length / 9;
    const uv = new Float32Array(this.uv);
    for (let t = 0; t < n; t++) {
      const k = t * 9;
      if (!Number.isNaN(uv[t * 6])) continue;
      const p = this.pos;
      const ux = p[k + 3] - p[k], uy = p[k + 4] - p[k + 1], uz = p[k + 5] - p[k + 2];
      const vx = p[k + 6] - p[k], vy = p[k + 7] - p[k + 1], vz = p[k + 8] - p[k + 2];
      const ax = Math.abs(uy * vz - uz * vy), ay = Math.abs(uz * vx - ux * vz), az = Math.abs(ux * vy - uy * vx);
      for (let j = 0; j < 3; j++) {
        const x = p[k + j * 3], y = p[k + j * 3 + 1], z = p[k + j * 3 + 2];
        let u, v;
        if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
        uv[t * 6 + j * 2] = u / uvScale;
        uv[t * 6 + j * 2 + 1] = v / uvScale;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
