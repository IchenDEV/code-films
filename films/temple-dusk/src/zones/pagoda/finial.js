// The spire (sorin): plinth, inverted bowl, lotus, nine rings on a bronze core,
// openwork water-flame, dragon cart, jewel, and four chains to the roof corners.
import * as THREE from 'three';
import { bx, cyl, frustum, sphere, put, revolve, tube } from './acc.js';

const RING_R = 0.52;

// Ring plate: thin disc with a raised, scalloped rim and a small cup at the hub.
const RING = revolve([
  [0.07, -0.03], [0.2, -0.032], [0.4, -0.036], [0.49, -0.04], [0.525, -0.036], [0.53, -0.02], [0.52, 0.0], // underside, rim
  [0.505, 0.03], [0.48, 0.032], [0.4, 0.018], [0.3, 0.03], [0.2, 0.05], [0.13, 0.08], [0.1, 0.1], [0.07, 0.1],
], 64, (th, k) => (k >= 4 && k <= 8 ? 1 + 0.035 * Math.pow(Math.abs(Math.cos(th * 8)), 0.6) : 1));

// Inverted bowl (fukubachi).
const BOWL = revolve([
  [0.3, 0], [0.43, 0.02], [0.52, 0.08], [0.565, 0.17], [0.56, 0.28], [0.5, 0.39], [0.38, 0.47], [0.22, 0.52], [0.1, 0.54], [0.07, 0.55],
], 40);

// Lotus (ukebana): eight petals opening upward.
const LOTUS = revolve([
  [0.1, 0], [0.25, 0.03], [0.38, 0.1], [0.45, 0.2], [0.46, 0.27], [0.43, 0.3], // outside
  [0.4, 0.3], [0.36, 0.22], [0.27, 0.12], [0.12, 0.07], [0.07, 0.07], // inside, top to bottom
], 48, (th, k) => (k >= 3 && k <= 7 ? 1 + 0.08 * Math.pow(Math.abs(Math.cos(th * 4)), 0.7) * (k <= 5 ? 1 : 0.8) : 1));

// Small cup under each ring and the cart base.
const CUP = revolve([[0.07, 0], [0.11, 0.015], [0.14, 0.05], [0.135, 0.09], [0.1, 0.125], [0.075, 0.14]], 20);

// Dragon cart: lotus cup, sphere, crowning collar.
const CART = revolve([
  [0.06, 0], [0.16, 0.03], [0.2, 0.09], [0.15, 0.12], [0.08, 0.1], [0.12, 0.17], [0.17, 0.23], [0.16, 0.3], [0.1, 0.35], [0.05, 0.37],
], 28);

// Jewel (hoju): round at the bottom, a flame-like tip.
const JEWEL = revolve([
  [0.0, 0], [0.09, 0.01], [0.16, 0.05], [0.205, 0.12], [0.21, 0.2], [0.18, 0.3], [0.125, 0.4], [0.075, 0.5], [0.04, 0.6], [0.015, 0.7], [0.0, 0.75],
], 32);

// Openwork water-flame plate in the XY plane, centred on x = 0, y from 0 to H.
function flamePlate(H) {
  const half = [[0.2, 0], [0.34, 0.12], [0.5, 0.3], [0.52, 0.5], [0.4, 0.66], [0.2, 0.74], [0.33, 0.95], [0.42, 1.2], [0.34, 1.42], [0.18, 1.48], [0.26, 1.7], [0.2, 1.9], [0.07, 2.1], [0, H]];
  const right = new THREE.SplineCurve(half.map((p) => new THREE.Vector2(p[0], p[1]))).getPoints(60);
  const pts = right.concat(right.slice(0, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y)));
  const shape = new THREE.Shape(pts);
  const hole = (cx, cy, rx, ry, rot = 0) => {
    const h = new THREE.Path();
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry * (1 + 0.35 * Math.max(0, Math.sin(a)));
      const px = cx + x * Math.cos(rot) - y * Math.sin(rot), py = cy + x * Math.sin(rot) + y * Math.cos(rot);
      if (i === 0) h.moveTo(px, py); else h.lineTo(px, py);
    }
    return h;
  };
  shape.holes.push(
    hole(0, 0.42, 0.11, 0.17), hole(0.3, 0.4, 0.07, 0.07), hole(-0.3, 0.4, 0.07, 0.07),
    hole(0, 0.98, 0.1, 0.26), hole(0.23, 0.98, 0.05, 0.1, -0.3), hole(-0.23, 0.98, 0.05, 0.1, 0.3),
    hole(0, 1.55, 0.06, 0.17),
  );
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -0.015);
  return g;
}

const LINK = new THREE.TorusGeometry(0.017, 0.0045, 4, 8);

// Roof-corner chain from a ring-rim point to the roof tip, drooping a little.
function chain(acc, a, b, sag) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.floor(len / 0.06);
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), qa = new THREE.Quaternion();
  const m = new THREE.Matrix4(), s = new THREE.Vector3(1, 1.7, 1), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const p0 = P(t0), p1 = P(t1);
    const tan = v.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
    q.setFromUnitVectors(up, tan);
    qa.setFromAxisAngle(up, (i % 2) * Math.PI / 2);
    q.multiply(qa);
    m.compose(new THREE.Vector3((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2), q, s);
    acc.add(LINK, m);
  }
}

// A: accumulators; sorin: layout record; roofTip: [x, y, z] of one corner tip of the top roof (x, z > 0).
export function buildFinial(A, sorin, roofTip) {
  const { baseY: y0, ringsFromY, ringsToY, ringCount, topY } = sorin;
  const ringY = (i) => ringsFromY + ((ringsToY - ringsFromY) * i) / (ringCount - 1);
  const suienY = ringsToY + 0.2;
  const suienH = 2.2;
  const cartY = suienY + suienH - 0.05;
  const jewelY = topY - 0.75;

  // Plinth (rohan): two stacked slabs and a tapered neck.
  bx(A.bronze, -0.68, 0.68, y0, y0 + 0.09, -0.68, 0.68);
  bx(A.bronze, -0.58, 0.58, y0 + 0.09, y0 + 0.16, -0.58, 0.58);
  frustum(A.bronze, 0, 0, y0 + 0.16, y0 + 0.4, 1.0, 0.82);
  put(A.bronze, BOWL, 0, y0 + 0.4, 0);
  // Gold band round the bowl's shoulder and the lotus above it.
  put(A.gold, new THREE.TorusGeometry(0.56, 0.018, 6, 40), 0, y0 + 0.23 + 0.4, 0, { rx: Math.PI / 2 });
  put(A.gold, LOTUS, 0, y0 + 0.94, 0);

  // Core shaft.
  cyl(A.bronze, 0, 0, y0 + 0.4, cartY + 0.1, 0.055, 0.055, 12);
  for (let i = 0; i < ringCount; i++) {
    const y = ringY(i);
    put(A.gold, RING, 0, y, 0);
    put(A.bronze, CUP, 0, y - 0.19, 0);
    cyl(A.bronze, 0, 0, y + 0.1, y + 0.16, 0.075, 0.075, 12);
  }
  // Connector sections between rings.
  for (let i = 0; i < ringCount - 1; i++) cyl(A.bronze, 0, 0, ringY(i) + 0.1, ringY(i + 1) - 0.19, 0.07, 0.07, 10);

  // Water-flame: two plates crossed at right angles.
  const plate = flamePlate(suienH);
  put(A.gold, plate, 0, suienY, 0);
  put(A.gold, plate, 0, suienY, 0, { ry: Math.PI / 2 });
  put(A.bronze, CUP, 0, ringsToY + 0.12, 0, { sx: 1.3, sy: 1.1, sz: 1.3 });

  put(A.bronze, CART, 0, cartY, 0);
  put(A.gold, JEWEL, 0, jewelY, 0);
  put(A.bronze, new THREE.TorusGeometry(0.12, 0.014, 6, 20), 0, jewelY - 0.01, 0, { rx: Math.PI / 2 });

  // Four chains from the top ring to the roof corner tips.
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const a = [sx * RING_R * 0.7, ringsToY - 0.03, sz * RING_R * 0.7];
    const b = [sx * roofTip[0], roofTip[1], sz * roofTip[2]];
    chain(A.bronze, a, b, 0.14);
    // Hanging eye at the roof end.
    put(A.bronze, new THREE.TorusGeometry(0.05, 0.01, 6, 12), b[0], b[1] + 0.03, b[2], { rx: Math.PI / 2 });
  }
}
