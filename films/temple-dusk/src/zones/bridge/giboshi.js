// Giboshi (擬宝珠): the bronze onion-shaped jewel on a rail post, turned on a
// lathe. Neck rings, a flared collar below, a pointed onion above.
import * as THREE from 'three';

export const GIBOSHI_HEIGHT = 0.46;
const BULB_R = 0.108;
const NECK_R = 0.05;

// Profile [r, h] from the underside of the collar to the tip.
function profile(step) {
  const p = [];
  const push = (r, h) => p.push([r, h]);
  // Flared collar: lip, then a concave sweep into the neck.
  push(0.0, 0.0);
  push(0.082, 0.0);
  for (let i = 0; i <= 5; i++) { // rounded lip
    const a = (-90 + 18 * i) * Math.PI / 180;
    push(0.082 + 0.012 * (1 + Math.sin(a)) * 0.5 + 0.004 * Math.cos(a) * 0, 0.0045 * (1 + Math.sin(a)));
  }
  for (let i = 1; i <= 10; i++) { // concave flare
    const t = i / 10;
    push(0.094 - (0.094 - 0.058) * (1 - (1 - t) ** 2.2), 0.009 + 0.052 * t);
  }
  // Neck with three raised rings.
  let h = 0.061;
  push(0.056, h);
  for (const hc of [0.078, 0.098, 0.118]) {
    push(NECK_R + 0.004, hc - 0.014);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (i / 8);
      push(NECK_R + 0.003 + 0.016 * Math.sin(a), hc - 0.011 + 0.022 * (i / 8));
    }
    push(NECK_R, hc + 0.011 + 0.003);
  }
  push(NECK_R, 0.136);
  // Collar disc under the jewel.
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (i / 8);
    push(NECK_R + 0.003 + 0.028 * Math.sin(a) ** 0.8, 0.14 + 0.02 * (i / 8));
  }
  push(0.056, 0.164);
  push(NECK_R, 0.17);
  // Onion bulb.
  const hb = 0.176, hTop = GIBOSHI_HEIGHT;
  const rOf = (t) => BULB_R * Math.sin(Math.PI * t ** 0.7) ** 0.9;
  let t0 = 0;
  while (rOf(t0) < NECK_R) t0 += 0.001;
  const nb = 56;
  for (let i = 0; i <= nb; i++) {
    const t = t0 + (1 - t0) * (i / nb) ** 0.85;
    push(Math.max(rOf(t), i === nb ? 0 : 0.0006), hb + (hTop - hb) * t);
  }
  return step === 1 ? p : p.filter((_, i) => i % step === 0 || i === p.length - 1);
}

// Returns { bronze, gold } geometries with the base on y = 0, centred on x = z = 0.
// noise(a, b) in [0, 1) gives the patina.
export function makeGiboshi({ segments, step, noise }) {
  const pts = profile(step);
  const lathe = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), segments);
  const m = pts.length;
  const light = pts.map((_, j) => {
    const a = pts[Math.max(0, j - 1)][0], b = pts[Math.min(m - 1, j + 1)][0];
    const valley = Math.max(0, (a + b) / 2 - pts[j][0]);
    return 1 - Math.min(1, valley * 90) * 0.45;
  });
  const col = new Float32Array(lathe.attributes.position.count * 3);
  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    for (let j = 0; j < m; j++) {
      const n1 = noise(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + pts[j][1] * 14);
      const n2 = noise(ang * 3 + pts[j][1] * 40, pts[j][1] * 90 + 9);
      const green = Math.max(0, n1 - 0.45) * 1.9;
      const k = (i * m + j) * 3;
      const l = light[j] * (0.82 + 0.3 * n2) * 1.45;
      col[k] = l * (1 - 0.18 * green);
      col[k + 1] = l * (1 + 0.1 * green);
      col[k + 2] = l * (1 + 0.04 * green) * 0.92;
    }
  }
  lathe.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const band = (R, h, tube) => {
    const g = new THREE.TorusGeometry(R, tube, segments > 40 ? 8 : 5, Math.max(24, segments), Math.PI * 2);
    g.rotateX(Math.PI / 2);
    g.translate(0, h, 0);
    return g;
  };
  const gold = [band(0.0545, 0.132, 0.0055), band(0.0855, 0.0125, 0.0035), band(0.0535, 0.172, 0.0045)];
  return { bronze: lathe, gold };
}
