// Incense burner (jokoro): three cabriole legs with lion-paw feet, a banded round bowl,
// two lion-head handles with rings, and a pavilion lid with an openwork cage, a curved
// roof, and a jewel finial. Local origin = ground at the burner centre.
import * as THREE from 'three';
import { put, sphere, lathe, tube, roughen, bump, cached, unitCyl } from './kit.js';

export function buildBurner({ layout, S }) {
  const { height: H } = layout.precinct.incenseBurner;
  const k = H / 1.75; // everything below is drawn for 1.75 m; scale vertical measures
  const y = (v) => v * k;

  // Stone footing.
  S.stone.add(roughen(lathe([[0, 0], [0.7, 0], [0.72, 0.03], [0.7, 0.08], [0.64, 0.11], [0.62, 0.12], [0, 0.12]], 32), 0.014, 5, 4));

  // Legs: a knee bulge with a lion mask, then a tapering shank to a clawed foot.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const c = Math.cos(a), s = Math.sin(a);
    const pts = [[0.3, 0.58], [0.4, 0.5], [0.48, 0.36], [0.5, 0.22], [0.5, 0.15]].map(([r, h]) => [c * r, y(h), s * r]);
    S.bronze.add(tube(pts, [0.07, 0.075, 0.05, 0.045, 0.05], 8));
    sphere(S.bronze, c * 0.43, y(0.48), s * 0.43, 0.085, 0.085, 0.085, 10, 7);
    sphere(S.bronze, c * 0.5, y(0.44), s * 0.5, 0.045, 0.05, 0.05, 8, 6); // lion snout under the knee
    for (const d of [-0.5, 0, 0.5]) { // three claws
      sphere(S.bronze, c * 0.54 - s * d * 0.05, y(0.135), s * 0.54 + c * d * 0.05, 0.028, 0.03, 0.04, 6, 4, { ry: -a });
    }
    sphere(S.bronze, c * 0.5, y(0.16), s * 0.5, 0.06, 0.05, 0.06, 8, 6);
  }

  // Bowl, banded, with a flared lip.
  const bowl = [[0, 0.5], [0.2, 0.505], [0.34, 0.54], [0.46, 0.62], [0.54, 0.7], [0.585, 0.78], [0.6, 0.86], [0.6, 0.9], [0.62, 0.93], [0.655, 0.96], [0.66, 0.985], [0.64, 0.995], [0.56, 0.99], [0.52, 0.985], [0.5, 0.96], [0.5, 0.93], [0, 0.93]];
  const prof = [];
  // Run the profile bottom to top outside, then down the inside (so the faces point out).
  for (const [r, h] of bowl.slice(0, 12)) prof.push([r + 0.012 * bump(h, 0.74, 0.02) + 0.012 * bump(h, 0.8, 0.02) + 0.01 * bump(h, 0.6, 0.015), y(h)]);
  for (const [r, h] of bowl.slice(12)) prof.push([r, y(h)]);
  S.bronze.add(lathe(prof, 40));
  // Ash surface, hidden by the lid but visible through the openwork.
  // (lathe above already closes the bowl with the ash plane at y = 0.93)

  // Lion-head handles at the sides, each holding a ring in its mouth.
  for (const sx of [-1, 1]) {
    const hx = sx * 0.66;
    put(S.bronze, cached('s10', () => new THREE.SphereGeometry(1, 10, 7)), hx, y(0.8), 0, { sx: 0.075, sy: 0.085, sz: 0.085 });
    put(S.bronze, cached('s10', () => new THREE.SphereGeometry(1, 10, 7)), hx + sx * 0.06, y(0.78), 0, { sx: 0.05, sy: 0.04, sz: 0.052 }); // muzzle
    for (const sz of [-1, 1]) {
      sphere(S.bronze, hx - sx * 0.01, y(0.88), sz * 0.075, 0.03, 0.03, 0.03, 6, 4); // ears / mane tufts
      sphere(S.bronze, hx + sx * 0.04, y(0.83), sz * 0.04, 0.014, 0.014, 0.014, 6, 4); // eyes
      sphere(S.bronze, hx, y(0.74), sz * 0.07, 0.04, 0.035, 0.035, 6, 4); // mane
    }
    put(S.bronze, new THREE.TorusGeometry(0.075, 0.016, 6, 16), hx + sx * 0.03, y(0.67), 0, { ry: Math.PI / 2 });
  }

  // Lid: base ring, openwork cage of bars, top ring.
  const ringGeo = cached('ring', () => lathe([[0.5, 0], [0.54, 0.01], [0.54, 0.05], [0.5, 0.06], [0.46, 0.05], [0.46, 0.01]], 32));
  put(S.bronze, ringGeo, 0, y(0.99), 0, { sy: k });
  const cageLo = y(1.05), cageHi = y(1.3);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    put(S.bronze, unitCyl(5), Math.cos(a) * 0.47, (cageLo + cageHi) / 2, Math.sin(a) * 0.47, { sx: 0.014, sy: cageHi - cageLo, sz: 0.014 });
  }
  for (const h of [1.12, 1.2]) put(S.bronze, new THREE.TorusGeometry(0.47, 0.01, 4, 32), 0, y(h), 0, { rx: Math.PI / 2 });
  put(S.bronze, new THREE.TorusGeometry(0.47, 0.016, 5, 32), 0, y(1.3), 0, { rx: Math.PI / 2 });
  // Pavilion roof with raised eaves, stepped knob, lotus base and jewel.
  const roof = [[0, 1.6], [0.1, 1.58], [0.18, 1.5], [0.3, 1.42], [0.45, 1.375], [0.58, 1.36], [0.66, 1.372], [0.7, 1.4], [0.68, 1.395], [0.62, 1.37], [0.55, 1.34], [0.5, 1.31], [0, 1.31]];
  // outside runs top-down on this list; reverse so the profile goes bottom-to-top along the outside.
  S.bronze.add(lathe(roof.map(([r, h]) => [r, y(h)]).reverse(), 32));
  for (let i = 0; i < 8; i++) { // corner tips
    const a = (i / 8) * Math.PI * 2;
    sphere(S.bronze, Math.cos(a) * 0.69, y(1.41), Math.sin(a) * 0.69, 0.03, 0.035, 0.03, 6, 4);
  }
  S.bronze.add(lathe([[0, 1.58], [0.1, 1.58], [0.12, 1.6], [0.08, 1.62], [0.045, 1.64], [0.04, 1.68], [0.065, 1.7], [0.07, 1.72], [0.03, 1.75], [0, 1.76]].map(([r, h]) => [r, y(h)]), 16));
}
