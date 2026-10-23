// Stone water basin (chozubachi): a carved stone with water at the brim, a bamboo spout
// (kakei) cradled in a crossed pair of stakes, a wooden ladle resting across the brim and
// an apron of river cobbles. Local origin = ground at the basin centre.
// Bamboo pieces are returned as segments for the shared bamboo instancing.
import * as THREE from 'three';
import { put, lathe, roughen, cached } from './kit.js';

export const WATER_Y = 0.545;
export const WATER_R = 0.335;
export const SPOUT_TIP = [0.22, 0.93, 0.02]; // where the stream leaves the bamboo
const SPOUT_HIGH = [1.5, 1.14, -0.05];

export function buildBasin({ layout, S, rng, bamboo }) {
  const apron = layout.precinct.basin.radius;

  // The basin carved from a boulder: bulging flank, brim, inner bowl.
  const profile = [[0, 0.06], [0.3, 0.06], [0.39, 0.12], [0.45, 0.22], [0.475, 0.38], [0.465, 0.5], [0.44, 0.58], [0.4, 0.62], [0.36, 0.625], [0.345, 0.6], [0.335, 0.54], [0.31, 0.44], [0.25, 0.37], [0.12, 0.33], [0, 0.32]];
  const body = lathe(profile, 44);
  roughen(body, 0.03, 3.2, 9, (x, y, z) => Math.hypot(x, z) > 0.37 && y < 0.6);
  roughen(body, 0.008, 12, 19, (x, y, z) => Math.hypot(x, z) > 0.37 && y < 0.6);
  S.stoneMoss.add(body);

  // Cobble apron, larger stones nearest the basin, a few stepping stones toward the spout side.
  const rs = rng.fork('basin-stones');
  const cobble = cached('cobble', () => new THREE.IcosahedronGeometry(1, 2));
  const placeCobble = (x, z, size, flat, i) => {
    const g = cobble.clone();
    roughen(g, 0.12, 1.5, 30 + i);
    put(rs.chance(0.35) ? S.stoneMoss : S.stone, g, x, size * flat * 0.5, z, { sx: size * rs.range(1, 1.4), sy: size * flat, sz: size * rs.range(1, 1.3), ry: rs.range(0, 3) });
  };
  let n = 0;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rs.range(-0.12, 0.12);
    placeCobble(Math.cos(a) * rs.range(0.52, 0.62), Math.sin(a) * rs.range(0.52, 0.62), rs.range(0.09, 0.14), 0.7, n++);
  }
  for (let i = 0; i < 26; i++) {
    const a = rs.range(0, Math.PI * 2);
    const rr = rs.range(0.68, apron + 0.35);
    placeCobble(Math.cos(a) * rr, Math.sin(a) * rr, rs.range(0.05, 0.09), 0.5, n++);
  }
  for (const [x, z] of [[-0.4, 1.0], [0.1, 1.35], [0.7, 1.1]]) placeCobble(x, z, 0.17, 0.3, n++);

  // Bamboo spout: runs from a high end over the basin; its stream falls from SPOUT_TIP.
  const high = SPOUT_HIGH, tip = SPOUT_TIP;
  bamboo.push({ a: high, b: [tip[0] - 0.02, tip[1] - 0.01, tip[2]], radius: 0.04, tone: 0.2 });
  // Two stakes cross under the spout (an X seen along it) and cradle it in the V above the crossing.
  const t = 0.62, cx = tip[0] + (high[0] - tip[0]) * t, cy = tip[1] + (high[1] - tip[1]) * t, cz = tip[2] + (high[2] - tip[2]) * t;
  bamboo.push({ a: [cx - 0.03, 0, cz - 0.42], b: [cx - 0.03, cy + 0.15, cz + 0.13], radius: 0.026, tone: 0.3 });
  bamboo.push({ a: [cx + 0.03, 0, cz + 0.42], b: [cx + 0.03, cy + 0.15, cz - 0.13], radius: 0.026, tone: 0.4 });

  // Ladle (hishaku): a wooden cup and a long bamboo handle laid across the brim.
  const cup = [-0.36, 0.64, -0.1];
  S.woodRaw.add(lathe([[0, 0], [0.05, 0.005], [0.062, 0.04], [0.068, 0.08], [0.062, 0.085], [0.054, 0.075], [0.05, 0.05], [0.03, 0.02], [0, 0.015]], 14), new THREE.Matrix4().makeTranslation(...cup));
  bamboo.push({ a: [cup[0] + 0.07, cup[1] + 0.075, cup[2]], b: [0.5, 0.645, -0.2], radius: 0.013, tone: 0.5 });
}
