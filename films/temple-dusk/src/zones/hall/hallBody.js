// The main hall (hondo) without its roof, Buddha and lanterns: podium, steps,
// columns, bracket sets, beams, walls, doors, floor and ceiling.

import * as THREE from 'three';
import { xf, extrudeOutline } from './kit.js';
import { columnGeometry, baseGeometry, bracketSet, bracketPurlin, kaerumataGeometry, unit, lbox, addLattice } from './timber.js';
import { buildRoof } from './roof.js';

export function buildHallBody(bag, m, L, roofMats) {
  const h = L.hall;
  const [cx, , cz] = h.center;
  const xsum = h.bays.x.reduce((a, b) => a + b, 0), zsum = h.bays.z.reduce((a, b) => a + b, 0);
  const hx = xsum / 2, hz = zsum / 2;
  const xl = [cx - hx], zl = [cz - hz];
  for (const b of h.bays.x) xl.push(xl[xl.length - 1] + b);
  for (const b of h.bays.z) zl.push(zl[zl.length - 1] + b);
  const pw = h.podium.width, pd = h.podium.depth, ph = h.podium.height;
  const colR = h.columnDiameter / 2;
  const floorTop = ph + 0.03;
  const colTop = ph + h.columnHeight;
  const nx = h.bays.x.length + 1, nz = h.bays.z.length + 1;

  // --- Podium --------------------------------------------------------------
  bag.box(m.stone, pw, 0.22, pd, cx, 0.11, cz);
  bag.box(m.stone, pw - 0.36, ph - 0.5, pd - 0.36, cx, 0.22 + (ph - 0.5) / 2, cz);
  bag.box(m.stone, pw - 0.14, 0.12, pd - 0.14, cx, ph - 0.28 + 0.06, cz);
  bag.box(m.stone, pw, 0.18, pd, cx, ph - 0.09, cz);
  bag.box(m.stone, pw - 0.5, 0.06, pd - 0.5, cx, ph - 0.03, cz);
  const postGeo = unit(0.34, ph - 0.5, 0.08);
  for (let i = 0; i < nx; i++) {
    for (const sz of [1, -1]) bag.add(m.stone, postGeo, xf(xl[i], 0.22 + (ph - 0.5) / 2, cz + sz * (pd / 2 - 0.18 + 0.02)));
  }
  for (let k = 0; k < nz; k++) {
    for (const sx of [1, -1]) bag.add(m.stone, postGeo, xf(cx + sx * (pw / 2 - 0.18 + 0.02), 0.22 + (ph - 0.5) / 2, zl[k], 0, Math.PI / 2));
  }

  // --- Steps and cheek stones ---------------------------------------------
  const st = h.steps;
  const zFront = cz + pd / 2; // podium front face
  const riser = ph / st.count, tread = st.depth / st.count;
  for (let k = 0; k < st.count - 1; k++) {
    const dep = st.depth - k * tread;
    bag.box(m.stone, st.width, riser * (k + 1), dep, cx, (riser * (k + 1)) / 2, zFront + dep / 2);
    // Nosing line on each tread.
    bag.box(m.stone, st.width + 0.02, 0.03, 0.05, cx, riser * (k + 1) - 0.015, zFront + dep - 0.01 + 0.0);
  }
  for (const sx of [-1, 1]) {
    const cheek = extrudeOutline([[0, 0], [st.depth + 0.1, 0], [st.depth + 0.1, 0.12], [0.1, ph + 0.05], [0, ph + 0.05]], 0.34, { bevel: 0.02 });
    bag.add(m.stone, cheek, xf(cx + sx * (st.width / 2 + 0.17), 0, zFront, 0, Math.PI / 2 * -1, 0));
  }

  // --- Columns, bases, brackets ---------------------------------------------
  const colGeo = columnGeometry(colR, colTop - ph - 0.2);
  const baseGeo = baseGeometry(colR);
  const kept = (i, k) => {
    const perimeter = i === 0 || i === nx - 1 || k === 0 || k === nz - 1;
    if (perimeter) return true;
    const x = xl[i] - cx;
    return !(Math.abs(x) < 5.2 && k <= 2);
  };
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      if (!kept(i, k)) continue;
      bag.add(m.stone, baseGeo, xf(xl[i], ph, zl[k]));
      bag.add(m.vermilion, colGeo, xf(xl[i], ph + 0.2, zl[k]));
      const dirs = [];
      if (k === nz - 1) dirs.push([0, 1]);
      if (k === 0) dirs.push([0, -1]);
      if (i === 0) dirs.push([-1, 0]);
      if (i === nx - 1) dirs.push([1, 0]);
      if (dirs.length) {
        bracketSet(bag, m.vermilion, { x: xl[i], y0: colTop, z: zl[k], dirs, diagonal: dirs.length === 2 });
      } else {
        bag.box(m.vermilion, 0.84, 0.26, 0.84, xl[i], colTop + 0.13, zl[k]);
      }
    }
  }

  // Purlins on top of the bracket sets and the head beams (頭貫) on the wall lines.
  const pu = bracketPurlin(3, 1);
  const purlinY = colTop + pu.y, purlinOut = pu.out;
  const pr = 0.1;
  const purlinGeo = new THREE.CylinderGeometry(pr, pr, 1, 10);
  const horiz = (x0, z0, x1, z1, y) => {
    const a = new THREE.Vector3(x0, y, z0), b = new THREE.Vector3(x1, y, z1);
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    mat.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, a.distanceTo(b), 1));
    return mat;
  };
  const px = hx + purlinOut, pz = hz + purlinOut;
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz + pz, cx + px, cz + pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz - pz, cx + px, cz - pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz - pz, cx - px, cz + pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx + px, cz - pz, cx + px, cz + pz, purlinY));

  const beamY0 = h.openBay.headBeamY, beamY1 = colTop;
  const beamH = beamY1 - beamY0;
  for (let i = 0; i < nx - 1; i++) {
    for (const k of [0, nz - 1]) {
      bag.box(m.vermilion, xl[i + 1] - xl[i], beamH, 0.32, (xl[i] + xl[i + 1]) / 2, beamY0 + beamH / 2, zl[k]);
    }
  }
  for (let k = 0; k < nz - 1; k++) {
    for (const i of [0, nx - 1]) {
      bag.box(m.vermilion, 0.32, beamH, zl[k + 1] - zl[k], xl[i], beamY0 + beamH / 2, (zl[k] + zl[k + 1]) / 2);
    }
  }
  // Interior tie beams along the row behind the front wall and across the side bays.
  for (let i = 0; i < nx - 1; i++) {
    if (kept(i, nz - 2) && kept(i + 1, nz - 2)) bag.box(m.vermilion, xl[i + 1] - xl[i], beamH, 0.3, (xl[i] + xl[i + 1]) / 2, beamY0 + beamH / 2, zl[nz - 2]);
  }
  // Beam noses (木鼻) at the corners: projecting end plus a gilded scroll.
  const noseGeo = new THREE.CylinderGeometry(beamH / 2, beamH / 2, 0.3, 16);
  const bossGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.34, 12);
  const nose = (x, z, ox, oz) => {
    const len = 0.85, yc = beamY0 + beamH / 2;
    bag.box(m.vermilion, ox ? len : 0.32, beamH, oz ? len : 0.32, x + (ox * len) / 2, yc, z + (oz * len) / 2);
    const at = new THREE.Matrix4().makeTranslation(x + ox * len, yc, z + oz * len).multiply(
      new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(ox ? Math.PI / 2 : 0, 0, oz ? Math.PI / 2 : 0)));
    bag.add(m.vermilion, noseGeo, at);
    bag.add(m.goldLeaf, bossGeo, at);
  };
  for (const [i, ox] of [[0, -1], [nx - 1, 1]]) {
    for (const [k, oz] of [[0, -1], [nz - 1, 1]]) {
      nose(xl[i], zl[k], ox, 0);
      nose(xl[i], zl[k], 0, oz);
    }
  }

  // Small plaster band (小壁) with frog-leg struts between beam top and purlin level.
  const kaer = kaerumataGeometry(0.8, 0.82, 0.18);
  for (let i = 0; i < nx - 1; i++) {
    const cxm = (xl[i] + xl[i + 1]) / 2, bw = xl[i + 1] - xl[i] - 2 * colR;
    for (const sz of [1, -1]) {
      const z = sz > 0 ? zl[nz - 1] : zl[0];
      bag.box(m.plaster, bw, 0.9, 0.2, cxm, colTop + 0.45, z);
      bag.add(m.vermilion, kaer, xf(cxm, colTop, z + sz * 0.16, 0, sz > 0 ? 0 : Math.PI));
    }
  }
  for (let k = 0; k < nz - 1; k++) {
    const czm = (zl[k] + zl[k + 1]) / 2, bw = zl[k + 1] - zl[k] - 2 * colR;
    for (const sx of [1, -1]) {
      const x = sx > 0 ? xl[nx - 1] : xl[0];
      bag.box(m.plaster, 0.2, 0.9, bw, x, colTop + 0.45, czm);
      bag.add(m.vermilion, kaer, xf(x + sx * 0.16, colTop, czm, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2));
    }
  }

  // --- Walls and doors ------------------------------------------------------
  const wallY0 = ph, wallY1 = beamY0;
  const wallLine = (center, out, types, lateralCentres, bayWidths) => {
    const base = xf(center[0], 0, center[1], 0, Math.atan2(out[0], out[1]));
    types.forEach((type, n) => {
      if (type === 'open') return;
      const lx = lateralCentres[n], bw = bayWidths[n] - 2 * colR;
      bayWall(bag, m, base, type, lx, bw, wallY0, wallY1);
    });
  };
  // Lateral centres are measured along the local x axis of the frame.
  const bayCentresX = [], bayWidthsX = [];
  for (let i = 0; i < nx - 1; i++) { bayCentresX.push((xl[i] + xl[i + 1]) / 2 - cx); bayWidthsX.push(xl[i + 1] - xl[i]); }
  const bayCentresZ = [], bayWidthsZ = [];
  for (let k = 0; k < nz - 1; k++) { bayCentresZ.push((zl[k] + zl[k + 1]) / 2 - cz); bayWidthsZ.push(zl[k + 1] - zl[k]); }
  const mid = Math.floor((nx - 1) / 2);
  const frontTypes = bayCentresX.map((_, i) => (i === mid ? 'open' : Math.abs(i - mid) === 1 ? 'door' : 'renji'));
  // Front: local x runs west to east, so lateral centres are used as they are.
  wallLine([cx, zl[nz - 1]], [0, 1], frontTypes, bayCentresX, bayWidthsX);
  // Back wall: local x runs east to west.
  wallLine([cx, zl[0]], [0, -1], bayCentresX.map(() => 'plaster'), bayCentresX.map((v) => -v), bayWidthsX);
  const sideTypes = bayCentresZ.map((_, k) => (k === 1 || k === 2 ? 'renji' : 'plaster'));
  wallLine([xl[nx - 1], cz], [1, 0], sideTypes, bayCentresZ.map((v) => -v), bayWidthsZ);
  wallLine([xl[0], cz], [-1, 0], sideTypes, bayCentresZ, bayWidthsZ);

  // Dark timber lining on the inside of the plaster walls (the hall interior stays dim).
  const inY0 = floorTop, inH = colTop - floorTop;
  bag.box(m.wood, xl[nx - 1] - xl[0] - 2 * colR, inH, 0.04, cx, inY0 + inH / 2, zl[0] + 0.13);
  for (const sx of [1, -1]) bag.box(m.wood, 0.04, inH, zl[nz - 1] - zl[0] - 2 * colR, sx > 0 ? xl[nx - 1] - 0.13 : xl[0] + 0.13, inY0 + inH / 2, cz);

  // --- Floor and ceiling ------------------------------------------------------
  const fh = floorTop - ph;
  bag.box(m.wood, xl[nx - 1] - xl[0], fh, zl[nz - 1] - zl[0], cx, ph + fh / 2, cz);
  // Floor board seams.
  for (let s = 1; s < 16; s++) {
    const z = zl[0] + (s * (zl[nz - 1] - zl[0])) / 16;
    bag.box(m.blackLacquer, xl[nx - 1] - xl[0], 0.004, 0.02, cx, floorTop + 0.002, z);
  }
  const ceilY = colTop + 0.25;
  bag.box(m.wood, xl[nx - 1] - xl[0], 0.12, zl[nz - 1] - zl[0], cx, ceilY + 0.06, cz);
  const rose = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16);
  for (let i = 0; i < nx - 1; i++) {
    for (let k = 0; k < nz - 1; k++) {
      const x = (xl[i] + xl[i + 1]) / 2, z = (zl[k] + zl[k + 1]) / 2;
      bag.add(m.goldLeaf, rose, xf(x, ceilY - 0.015, z));
      bag.box(m.vermilion, xl[i + 1] - xl[i] - 0.5, 0.06, 0.06, x, ceilY - 0.05, z);
      bag.box(m.vermilion, 0.06, 0.06, zl[k + 1] - zl[k] - 0.5, x, ceilY - 0.05, z);
    }
  }
  for (let i = 0; i < nx; i++) bag.box(m.wood, 0.2, 0.24, zl[nz - 1] - zl[0], xl[i], ceilY - 0.12, cz);
  for (let k = 0; k < nz; k++) bag.box(m.wood, xl[nx - 1] - xl[0], 0.24, 0.2, cx, ceilY - 0.12, zl[k]);

  // --- Roof -------------------------------------------------------------------
  const roof = buildRoof(bag, roofMats, {
    cx, cz,
    ex: hx + h.eaveOverhang, ez: hz + h.eaveOverhang,
    tipY: h.eaveY + 0.34, ridgeY: h.ridgeY, xs: h.ridgeHalfLength,
    lift: 0.9, c: 0.5, colEx: hx, colEz: hz,
    flyBottomY: h.eaveY, overhang: h.eaveOverhang, rafterRise: 0.24, purlinOut: 1.0,
    closureY0: purlinY - 0.1, closureY1: purlinY + 2.4,
  });

  return { xl, zl, colTop, floorTop, ceilY, roof, hx, hz };
}

// One bay of wall between two columns. base: wall-line frame; lx: bay centre along the wall; bw: clear width.
function bayWall(bag, m, base, type, lx, bw, y0, y1) {
  const T = 0.22;
  const skirtTop = y0 + 0.45;
  const band0 = 6.12, band1 = 6.42;
  const plasterBox = (a, b) => lbox(bag, m.plaster, base, bw, T, lx, a, b);
  lbox(bag, m.wood, base, bw, T + 0.04, lx, y0, skirtTop);
  // Band (長押) across the bay, wrapping slightly outside.
  lbox(bag, m.vermilion, base, bw, T + 0.16, lx, band0, band1, 0.04);
  if (type === 'plaster') {
    plasterBox(skirtTop, band0);
    plasterBox(band1, y1);
    return;
  }
  const dark = m.blackLacquer;
  if (type === 'renji') {
    const sill = 3.5, head = 5.95;
    plasterBox(skirtTop, sill);
    plasterBox(head, band0);
    plasterBox(band1, y1);
    lbox(bag, m.vermilion, base, bw, T + 0.12, lx, sill, sill + 0.14, 0.03);
    lbox(bag, m.vermilion, base, bw, T + 0.12, lx, head - 0.12, head, 0.03);
    lbox(bag, dark, base, bw, 0.04, lx, sill + 0.14, head - 0.12, -0.08);
    addLattice(bag, m.vermilion, base, lx - bw / 2, lx + bw / 2, sill + 0.14, head - 0.12, 0.2, 0.07, 0.12, 0.02);
    return;
  }
  if (type === 'door') {
    const dTop = 5.95, dBot = y0 + 0.14;
    plasterBox(dTop, band0);
    plasterBox(band1, y1);
    lbox(bag, m.vermilion, base, bw, T + 0.08, lx, dTop - 0.14, dTop, 0.02);
    lbox(bag, m.stone, base, bw + 0.1, T + 0.1, lx, y0, dBot);
    lbox(bag, dark, base, bw, 0.04, lx, dBot, dTop - 0.14, -0.08);
    const leaf = bw / 2;
    for (const sg of [-1, 1]) {
      const c = lx + sg * leaf / 2;
      // Leaf frame: stiles, rails, solid lower panel, lattice above.
      for (const e of [-1, 1]) lbox(bag, m.vermilion, base, 0.1, 0.1, c + e * (leaf / 2 - 0.05), dBot, dTop - 0.14, 0.04);
      lbox(bag, m.vermilion, base, leaf, 0.09, c, dBot, dBot + 0.12, 0.04);
      lbox(bag, m.vermilion, base, leaf, 0.09, c, dBot + 1.0, dBot + 1.14, 0.04);
      lbox(bag, m.vermilion, base, leaf, 0.09, c, dTop - 0.28, dTop - 0.14, 0.04);
      lbox(bag, m.vermilion, base, leaf - 0.2, 0.05, c, dBot + 0.12, dBot + 1.0, 0.04);
      addLattice(bag, m.vermilion, base, c - leaf / 2 + 0.1, c + leaf / 2 - 0.1, dBot + 1.14, dTop - 0.28, 0.14, 0.035, 0.06, 0.04);
      // Door studs on the lower panel.
      for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) {
        bag.add(m.goldLeaf, new THREE.SphereGeometry(0.035, 8, 6), new THREE.Matrix4().multiplyMatrices(base, xf(c - leaf / 2 + 0.3 + q * (leaf - 0.6) / 2, dBot + 0.32 + r * 0.4, 0.1)));
      }
    }
  }
}
