// One pagoda roof: square hipped roof with a concave, corrugated tile surface,
// upturned corners, a soffit with two layers of rafters, corner beams and hip
// ridges. Built in a side frame (+Z outward) and repeated for the four sides.
import * as THREE from 'three';
import { gridGeo, sides, tube, put, sphere } from './acc.js';

const TIP = 0.25; // plan offset of the corner tip beyond the mid-side eave line
const CONCAVE = 1.8; // exponent of the roof curve (steep near the ridge, flat at the eave)
const PERIOD = 0.42; // spacing of the round-tile ribs, also of the rafters
const SAMPLES = 8; // lateral samples per rib period
const RIB = 0.045; // rib height
const FASCIA = 0.24; // eave edge thickness
const SLICES = [0, 0.1, 0.22, 0.36, 0.5, 0.63, 0.75, 0.85, 0.93, 1];

const ribProfile = (u) => {
  const p = Math.max(0, 1 - Math.abs(u - 0.5) / 0.22);
  return p * p * (3 - 2 * p);
};

const DISC = new THREE.CircleGeometry(1, 8);

// roof: { E, yE, lift, rb, topY, Ri, yIn }
export function buildRoof(A, roof) {
  const { E, yE, lift, rb, topY, Ri, yIn } = roof;
  const L = E + TIP;
  const out = (l) => E + TIP * Math.abs(l) ** 3;
  const top = (s, l, corr = 0) => [
    l * (Ri + (L - Ri) * s),
    yIn + (yE - yIn) * (1 - (1 - s) ** CONCAVE) + lift * Math.abs(l) ** 2.5 * s ** 2.5 + corr,
    Ri + (out(l) - Ri) * s,
  ];
  const soffit = (u, l) => [
    l * (rb + (L - rb) * u),
    topY + (yE - FASCIA - topY) * u + lift * Math.abs(l) ** 2.5 * u ** 2.5,
    rb + (out(l) - rb) * u,
  ];

  const ribs = Math.round((2 * L) / PERIOD);
  const nv = ribs * SAMPLES;
  const lat = (j) => -1 + (2 * j) / nv;
  const corr = (j) => RIB * ribProfile((j % SAMPLES) / SAMPLES);

  const surface = gridGeo(SLICES.length - 1, nv, (i, j) => top(SLICES[i], lat(j), corr(j)), [0, 1, 0.3]);
  const edge = gridGeo(1, nv, (i, j) => {
    const t = top(1, lat(j), corr(j));
    return i === 0 ? t : [t[0], top(1, lat(j), 0)[1] - FASCIA, t[2]];
  }, [0, 0, 1]);
  const under = gridGeo(6, 24, (i, j) => soffit(i / 6, -1 + (2 * j) / 24), [0, -1, 0]);

  // Hip ridge and corner beam follow the diagonal l = +1.
  const hip = SLICES.map((s) => { const p = top(s, 1); return [p[0], p[1] + 0.05, p[2]]; });
  const beamUs = [0.3, 0.5, 0.7, 0.85, 1];
  const beam = beamUs.map((u) => { const p = soffit(u, 1); return [p[0], p[1] - 0.09, p[2]]; });
  const tip = top(1, 1);

  sides([A.tile, A.wood, A.plaster], () => {
    A.tile.add(surface);
    A.tile.add(edge);
    A.wood.add(under);
    tube(A.tile, hip, SLICES.map((s) => 0.1 + 0.05 * s), 8);
    sphere(A.tile, tip[0], tip[1] + 0.04, tip[2], 0.17, 0.12, 0.17);
    tube(A.wood, beam, 0.12, 4, { flat: true, phase: Math.PI / 4 });

    for (let m = 0; m < ribs; m++) {
      const l = -1 + (2 * (m + 0.5)) / ribs;
      if (Math.abs(l) > 0.93) continue;
      const low = [0.3, 0.5, 0.7, 0.88].map((u) => { const p = soffit(u, l); return [p[0], p[1] - 0.075, p[2]]; });
      tube(A.wood, low, 0.055, 6, { caps: false });
      const fly = [0.88, 0.94, 0.984].map((u) => { const p = soffit(u, l); return [p[0], p[1] - 0.06, p[2]]; });
      tube(A.wood, fly, 0.064, 4, { flat: true, phase: Math.PI / 4, caps: false });
      const a = soffit(0.984, l), b = soffit(0.995, l);
      tube(A.plaster, [[a[0], a[1] - 0.06, a[2]], [b[0], b[1] - 0.06, b[2]]], 0.066, 4, { flat: true, phase: Math.PI / 4 });
      // Eave tile end, a round disc on the fascia between ribs.
      const e = top(1, l, RIB);
      put(A.tile, DISC, e[0], e[1] - 0.075, e[2] + 0.005, { sx: 0.075, sy: 0.075, rx: -0.12 });
    }
  });
}
