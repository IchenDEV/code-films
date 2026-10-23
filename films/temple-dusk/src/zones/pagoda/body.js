// Stone base and the five storey bodies: columns, beams, plaster panels, doors
// and windows, bracket sets (dougong), balconies with railings.
import * as THREE from 'three';
import { bx, cyl, frustum, sphere, put, revolve, sides, pivoted } from './acc.js';

const ONION = revolve([[0.045, 0], [0.075, 0.03], [0.095, 0.08], [0.1, 0.12], [0.085, 0.17], [0.05, 0.22], [0.02, 0.26], [0, 0.285]], 12);
const STUD = new THREE.SphereGeometry(1, 8, 5);

export function buildBase(A, p) {
  const h = p.base.size / 2, H = p.base.height;
  const S = A.stone;
  bx(S, -h, h, 0, 0.14, -h, h);
  bx(S, -h + 0.1, h - 0.1, 0.14, 0.78, -h + 0.1, h - 0.1);
  bx(S, -h, h, 0.78, H, -h, h);
  bx(S, -h + 0.06, h - 0.06, 0.74, 0.78, -h + 0.06, h - 0.06);
  sides([S], () => {
    // Pillar stones proud of the wall face: corners and two along each side.
    for (const x of [-h + 0.35, -h / 3, h / 3, h - 0.35]) bx(S, x - 0.17, x + 0.17, 0.14, 0.78, h - 0.1, h - 0.04);
  });
  // Steps on the west side (k = 3): three treads, cheek stones either side.
  sides([S], (k) => {
    if (k !== 3) return;
    for (let j = 0; j < 3; j++) {
      const top = 0.75 - 0.25 * j;
      bx(S, -1.6, 1.6, 0, top, h + 0.5 * j, h + 0.5 * (j + 1));
      bx(S, 1.6, 1.85, 0, top + 0.15, h + 0.5 * j, h + 0.5 * (j + 1));
      bx(S, -1.85, -1.6, 0, top + 0.15, h + 0.5 * j, h + 0.5 * (j + 1));
    }
  });
}

// Bearing block and arms; (x, hc) is the column axis in the side frame, yT the
// underside of the eave rafters at the wall.
function dou(a, x, hc, yT) {
  frustum(a, x, hc, yT - 0.6, yT - 0.4, 0.3, 0.46);
  bx(a, x - 0.5, x + 0.5, yT - 0.4, yT - 0.28, hc - 0.075, hc + 0.075);
  bx(a, x - 0.38, x + 0.38, yT - 0.16, yT - 0.05, hc + 0.45 - 0.065, hc + 0.45 + 0.065);
  for (const dx of [-0.4, 0.4]) frustum(a, x + dx, hc, yT - 0.28, yT - 0.16, 0.16, 0.2);
  for (const dx of [-0.3, 0.3]) frustum(a, x + dx, hc + 0.45, yT - 0.16, yT - 0.05, 0.14, 0.18);
}
function outArms(a, x, hc, yT) {
  bx(a, x - 0.075, x + 0.075, yT - 0.4, yT - 0.28, hc - 0.35, hc + 0.55);
  frustum(a, x, hc + 0.45, yT - 0.28, yT - 0.16, 0.16, 0.22);
  frustum(a, x, hc - 0.25, yT - 0.28, yT - 0.16, 0.16, 0.2);
  bx(a, x - 0.065, x + 0.065, yT - 0.16, yT - 0.05, hc + 0.05, hc + 0.95);
  frustum(a, x, hc + 0.85, yT - 0.05, yT + 0.05, 0.16, 0.2);
}
function midBay(a, x, hc, yT) {
  frustum(a, x, hc, yT - 0.6, yT - 0.4, 0.26, 0.34);
  bx(a, x - 0.34, x + 0.34, yT - 0.4, yT - 0.28, hc - 0.07, hc + 0.07);
  bx(a, x - 0.065, x + 0.065, yT - 0.4, yT - 0.28, hc - 0.2, hc + 0.5);
  frustum(a, x, hc + 0.42, yT - 0.28, yT - 0.16, 0.16, 0.22);
  bx(a, x - 0.3, x + 0.3, yT - 0.16, yT - 0.05, hc + 0.42 - 0.06, hc + 0.42 + 0.06);
  bx(a, x - 0.06, x + 0.06, yT - 0.16, yT - 0.05, hc + 0.1, hc + 0.9);
  frustum(a, x, hc + 0.85, yT - 0.05, yT + 0.05, 0.14, 0.18);
}

function door(A, hc, yBot, yTop, openW) {
  const V = A.vermilion;
  const z = hc;
  const leafW = openW / 2 - 0.01, h = yTop - yBot;
  bx(A.black, -openW / 2, openW / 2, yBot, yTop, z - 0.3, z - 0.2);
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 0.01 : -0.01 - leafW;
    const x1 = x0 + leafW;
    bx(V, x0, x1, yBot, yTop, z - 0.06, z + 0.01);
    // Framing: stiles, rails.
    for (const [a, b] of [[x0, x0 + 0.09], [x1 - 0.09, x1]]) bx(V, a, b, yBot, yTop, z - 0.06, z + 0.045);
    for (const t of [0, 0.34, 0.66, 1]) {
      const y = yBot + (yTop - yBot - 0.12) * t;
      bx(V, x0, x1, y, y + 0.12, z - 0.06, z + 0.045);
    }
    // Studs in the three panels.
    for (let r = 0; r < 3; r++) {
      const py0 = yBot + (h - 0.12) * [0, 0.34, 0.66][r] + 0.12;
      const ph = (h - 0.12) * [0.34, 0.32, 0.34][r] - 0.12;
      for (let ci = 0; ci < 3; ci++) for (let ri = 0; ri < 3; ri++) {
        const sxp = x0 + 0.09 + ((leafW - 0.18) * (ci + 0.5)) / 3;
        const syp = py0 + (ph * (ri + 0.5)) / 3;
        put(A.gold, STUD, sxp, syp, z + 0.012, { sx: 0.03, sy: 0.03, sz: 0.022 });
      }
    }
  }
  bx(V, -0.03, 0.03, yBot, yTop, z - 0.06, z + 0.06);
}

function window_(A, hc, yc) {
  const V = A.vermilion;
  const w = 0.95, h = 1.0, z = hc + 0.075;
  bx(A.black, -w / 2, w / 2, yc - h / 2, yc + h / 2, z, z + 0.02);
  const f = 0.07;
  bx(V, -w / 2 - f, -w / 2, yc - h / 2 - f, yc + h / 2 + f, z, z + 0.07);
  bx(V, w / 2, w / 2 + f, yc - h / 2 - f, yc + h / 2 + f, z, z + 0.07);
  bx(V, -w / 2, w / 2, yc + h / 2, yc + h / 2 + f, z, z + 0.07);
  bx(V, -w / 2, w / 2, yc - h / 2 - f, yc - h / 2, z, z + 0.07);
  for (let b = 0; b < 7; b++) {
    const x = -w / 2 + (w * (b + 0.5)) / 7;
    bx(V, x - 0.014, x + 0.014, yc - h / 2, yc + h / 2, z + 0.02, z + 0.05);
  }
}

// s: storey record, i: index, below: roof ring top of the storey beneath (yIn of the roof under), none for the first.
export function buildStorey(A, i, s, yRoofBelow) {
  const hc = s.width / 2 - 0.2, bw = (2 * hc) / 3;
  const colR = 0.15 + (0.04 * (s.width - 4)) / 2.4;
  const y0 = s.baseY + (i === 0 ? 0.12 : 0);
  const yCol = s.topY - 0.74, yBeam = s.topY - 1.0, yT = s.topY;
  const V = A.vermilion;
  const panelW = bw - 2 * colR - 0.03;
  const yPanel0 = y0 + 0.14;

  sides([V, A.plaster, A.wood, A.stone, A.black, A.gold, A.bronze, A.woodRaw], (k) => {
    for (let j = 0; j < 3; j++) {
      const x = -hc + j * bw;
      cyl(V, x, hc, y0, yCol, colR, colR * 0.88, 16);
      if (i === 0) cyl(A.stone, x, hc, s.baseY, y0, colR + 0.1, colR + 0.1, 12);
      dou(V, x, hc, yT);
      if (j === 0) pivoted(V, x, hc, -Math.PI / 2, () => outArms(V, x, hc, yT));
      outArms(V, x, hc, yT);
      midBay(V, x + bw / 2, hc, yT);
    }
    // Corner column is drawn by side k's j = 0 only; the +hc column belongs to the next side.
    // Beams and sill along the face.
    bx(V, -hc - 0.18, hc + 0.18, yBeam, yCol, hc - 0.1, hc + 0.1);
    bx(V, -hc - 0.28, hc + 0.28, yCol, yCol + 0.14, hc - 0.16, hc + 0.16);
    bx(A.wood, -hc, hc, y0, yPanel0, hc - 0.1, hc + 0.1);
    bx(A.wood, -hc - 0.3, hc + 0.3, yT - 0.05, yT + 0.12, hc + 0.78, hc + 0.92);
    // Small wall (kobe) above the beam, behind the brackets.
    bx(A.plaster, -hc, hc, yCol + 0.14, yT, hc - 0.08, hc + 0.06);
    for (let b = -1; b <= 1; b++) {
      const xc = b * bw;
      const yP1 = yBeam;
      if (i === 0 && b === 0) {
        door(A, hc, y0 + 0.1, yBeam, panelW);
        continue;
      }
      bx(A.plaster, xc - panelW / 2, xc + panelW / 2, yPanel0, yP1, hc - 0.07, hc + 0.07);
      const yR = yPanel0 + (yP1 - yPanel0) * 0.33;
      bx(V, xc - panelW / 2, xc + panelW / 2, yR, yR + 0.07, hc + 0.06, hc + 0.11);
      if (i > 0 && b === 0) window_(A, hc, (yPanel0 + yP1) / 2 + 0.12);
    }
    // Balcony, from storey 2 up.
    if (i > 0) balcony(A, s, i, hc, yRoofBelow);
  });
}

function balcony(A, s, i, hc, yRoofBelow) {
  const V = A.vermilion;
  const dh = s.width / 2 + 0.85, hr = dh - 0.13;
  const yD = s.baseY;
  bx(A.woodRaw, -dh, dh, yD - 0.12, yD, -dh, dh);
  // Deck-edge beam and the skirt standing on the roof below.
  bx(V, -dh - 0.05, dh + 0.05, yD - 0.34, yD - 0.12, dh - 0.2, dh);
  const zs = s.width / 2 + 0.3;
  bx(A.wood, -zs, zs, yRoofBelow - 0.1, yD - 0.34, zs - 0.05, zs + 0.05);
  for (let q = -3; q <= 3; q++) {
    const x = (q * (dh - 0.3)) / 3;
    frustum(V, x, dh - 0.55, yD - 0.54, yD - 0.34, 0.14, 0.24);
    bx(V, x - 0.06, x + 0.06, yD - 0.54, yD - 0.46, zs - 0.05, dh - 0.45);
  }
  // Railing: posts, rails, balusters. Corner posts of this side start at x = -hr.
  const n = Math.round((2 * hr) / 0.95);
  const step = (2 * hr) / n;
  const yTop = yD + 0.98;
  bx(V, -hr - 0.1, hr + 0.1, yTop - 0.05, yTop + 0.05, hr - 0.07, hr + 0.07);
  bx(V, -hr - 0.1, hr + 0.1, yD + 0.52, yD + 0.6, hr - 0.05, hr + 0.05);
  bx(V, -hr - 0.1, hr + 0.1, yD, yD + 0.12, hr - 0.09, hr + 0.09);
  for (let j = 0; j < n; j++) {
    const x = -hr + j * step;
    const w = j === 0 ? 0.085 : 0.065;
    bx(V, x - w, x + w, yD, yTop + 0.02, hr - w, hr + w);
    if (j === 0) {
      put(A.bronze, ONION, x, yTop + 0.02, hr, { sx: 1, sy: 1, sz: 1 });
    }
    const m = Math.max(2, Math.round(step / 0.17));
    for (let b = 1; b < m; b++) {
      const xb = x + (step * b) / m;
      bx(V, xb - 0.017, xb + 0.017, yD + 0.12, yTop - 0.05, hr - 0.017, hr + 0.017);
    }
  }
}
