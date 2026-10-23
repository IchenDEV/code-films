// Sweeps a 2D profile along the deck arch (a curve in the YZ plane), giving the
// side beams, stringers and rails a constant section that follows the arch.
import * as THREE from 'three';

const DEG = Math.PI / 180;

// Rounded rectangle, counter-clockwise, centred on (0, 0): points are [dx, dn].
export function roundedRect(w, h, r, seg = 3, cy = 0) {
  const pts = [];
  const hw = w / 2 - r, hh = h / 2 - r;
  [[hw, -hh, -90], [hw, hh, 0], [-hw, hh, 90], [-hw, -hh, 180]].forEach(([cx, cyy, a0]) => {
    for (let i = 0; i <= seg; i++) {
      const a = (a0 + (90 * i) / seg) * DEG;
      pts.push([cx + r * Math.cos(a), cy + cyy + r * Math.sin(a)]);
    }
  });
  return pts;
}

// profile: closed loop of [dx, dn]; dx across the deck, dn along the deck normal.
// The curve point is (x, yOf(z) + yo, z). Caps close both ends.
export function sweep(profile, { yOf, x, za, zb, n, yo = 0, uScale = 0.25 }) {
  let prof = profile.map((p) => p.slice());
  let area = 0;
  for (let i = 0; i < prof.length; i++) {
    const a = prof[i], b = prof[(i + 1) % prof.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  if (area < 0) prof.reverse();
  const m = prof.length;

  const edgeN = [], vAt = [0];
  for (let j = 0; j < m; j++) {
    const a = prof[j], b = prof[(j + 1) % m];
    const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
    edgeN.push([ey / l, -ex / l]);
    vAt.push(vAt[j] + l);
  }
  const cosLimit = Math.cos(40 * DEG);
  const blend = (p, q) => {
    if (p[0] * q[0] + p[1] * q[1] < cosLimit) return q;
    const s = [p[0] + q[0], p[1] + q[1]], l = Math.hypot(s[0], s[1]);
    return [s[0] / l, s[1] / l];
  };

  const pos = [], nor = [], uv = [], idx = [];
  let u = 0, prevY = yOf(za), prevZ = za;
  const ringBase = [];
  for (let i = 0; i <= n; i++) {
    const z = za + ((zb - za) * i) / n;
    const y = yOf(z);
    u += Math.hypot(z - prevZ, y - prevY);
    prevY = y; prevZ = z;
    const th = Math.atan((yOf(z + 0.01) - yOf(z - 0.01)) / 0.02);
    const Ny = Math.cos(th), Nz = -Math.sin(th);
    ringBase.push(pos.length / 3);
    for (let j = 0; j < m; j++) {
      const prevEdge = edgeN[(j - 1 + m) % m], thisEdge = edgeN[j], nextEdge = edgeN[(j + 1) % m];
      const a = prof[j], b = prof[(j + 1) % m];
      const nA = blend(prevEdge, thisEdge), nB = blend(nextEdge, thisEdge);
      for (const [p, nn, v] of [[a, nA, vAt[j]], [b, nB, vAt[j + 1]]]) {
        pos.push(x + p[0], y + yo + Ny * p[1], z + Nz * p[1]);
        nor.push(nn[0], Ny * nn[1], Nz * nn[1]);
        uv.push(u * uScale, v);
      }
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const A = ringBase[i] + 2 * j, B = A + 1, D = ringBase[i + 1] + 2 * j, C = D + 1;
      idx.push(A, B, C, A, C, D);
    }
  }
  for (const [i, dir] of [[0, -1], [n, 1]]) {
    const z = za + ((zb - za) * i) / n, y = yOf(z);
    const th = Math.atan((yOf(z + 0.01) - yOf(z - 0.01)) / 0.02);
    const Ny = Math.cos(th), Nz = -Math.sin(th), Ty = Math.sin(th), Tz = Math.cos(th);
    const c = pos.length / 3;
    let cx = 0, cn = 0;
    prof.forEach((p) => { cx += p[0] / m; cn += p[1] / m; });
    const put = (px, pn) => {
      pos.push(x + px, y + yo + Ny * pn, z + Nz * pn);
      nor.push(0, dir * Ty, dir * Tz);
      uv.push(px, pn);
    };
    put(cx, cn);
    prof.forEach((p) => put(p[0], p[1]));
    for (let j = 0; j < m; j++) {
      const a = c + 1 + j, b = c + 1 + ((j + 1) % m);
      if (dir > 0) idx.push(c, a, b); else idx.push(c, b, a);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
