// The three-bay gate (八脚門): stone platform, twelve vermilion columns, bracket
// sets, latticed side bays, an open central passage with the red chōchin, and a
// hip-and-gable roof built by the shared roof builder.

import * as THREE from 'three';
import { xf } from './kit.js';
import { columnGeometry, baseGeometry, bracketSet, bracketPurlin, lbox, addLattice } from './timber.js';
import { buildRoof } from './roof.js';
import { chochin } from './lanterns.js';

export function buildGate(bag, m, L, roofMats) {
  const g = L.gate;
  const [cx, , cz] = g.center;
  const xsum = g.bays.x.reduce((a, b) => a + b, 0), zsum = g.bays.z.reduce((a, b) => a + b, 0);
  const xl = [cx - xsum / 2], zl = [cz - zsum / 2];
  for (const b of g.bays.x) xl.push(xl[xl.length - 1] + b);
  for (const b of g.bays.z) zl.push(zl[zl.length - 1] + b);
  const hx = xsum / 2, hz = zsum / 2;
  const ph = g.platformHeight;
  const colR = g.columnDiameter / 2;
  const colTop = ph + g.columnHeight;
  const S = 0.75;

  // --- Platform and passage steps -----------------------------------------------------
  bag.box(m.stone, 2 * hx + 2.0, 0.16, 2 * hz + 2.0, cx, 0.08, cz);
  bag.box(m.stone, 2 * hx + 1.7, ph - 0.16, 2 * hz + 1.7, cx, 0.16 + (ph - 0.16) / 2, cz);
  bag.box(m.stone, 2 * hx + 2.0, 0.08, 2 * hz + 2.0, cx, ph - 0.04, cz);
  const pw = g.passage.maxX - g.passage.minX;
  for (const sz of [1, -1]) {
    bag.box(m.stone, pw, 0.22, 0.6, cx, 0.11, cz + sz * (hz + 1.0 + 0.3));
  }

  // --- Columns and bracket sets -------------------------------------------------------------
  const colGeo = columnGeometry(colR, colTop - ph - 0.2);
  const baseGeo = baseGeometry(colR);
  const nx = xl.length, nz = zl.length;
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      bag.add(m.stone, baseGeo, xf(xl[i], ph, zl[k]));
      bag.add(m.vermilion, colGeo, xf(xl[i], ph + 0.2, zl[k]));
      const dirs = [];
      if (k === nz - 1) dirs.push([0, 1]);
      if (k === 0) dirs.push([0, -1]);
      if (k === 1 && i === 0) dirs.push([-1, 0]);
      if (k === 1 && i === nx - 1) dirs.push([1, 0]);
      if (i === 0 && k !== 1) dirs.push([-1, 0]);
      if (i === nx - 1 && k !== 1) dirs.push([1, 0]);
      if (dirs.length) bracketSet(bag, m.vermilion, { x: xl[i], y0: colTop, z: zl[k], dirs, diagonal: dirs.length === 2, s: S, steps: 2 });
      else bag.box(m.vermilion, 0.64, 0.24, 0.64, xl[i], colTop + 0.12, zl[k]);
      // Gilded column-head fitting.
      bag.add(m.goldLeaf, new THREE.TorusGeometry(colR * 0.98, 0.022, 6, 24), xf(xl[i], colTop - 0.2, zl[k], Math.PI / 2));
    }
  }
  const pu = bracketPurlin(2, S);
  const purlinY = colTop + pu.y, purlinOut = pu.out;
  const pr = 0.085;
  const purlinGeo = new THREE.CylinderGeometry(pr, pr, 1, 10);
  const horiz = (x0, z0, x1, z1, y) => {
    const a = new THREE.Vector3(x0, y, z0), b = new THREE.Vector3(x1, y, z1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, a.distanceTo(b), 1));
  };
  const px = hx + purlinOut, pz = hz + purlinOut;
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz + pz, cx + px, cz + pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz - pz, cx + px, cz - pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx - px, cz - pz, cx - px, cz + pz, purlinY));
  bag.add(m.wood, purlinGeo, horiz(cx + px, cz - pz, cx + px, cz + pz, purlinY));

  // --- Beams ------------------------------------------------------------------------------------
  const by0 = colTop - 0.45, by1 = colTop;
  const bh = by1 - by0;
  for (let i = 0; i < nx - 1; i++) {
    const mid = (xl[i] + xl[i + 1]) / 2, w = xl[i + 1] - xl[i];
    for (const k of [0, nz - 1]) bag.box(m.vermilion, w, bh, 0.3, mid, by0 + bh / 2, zl[k]);
    if (i !== 1) bag.box(m.vermilion, w, bh, 0.3, mid, by0 + bh / 2, zl[1]);
  }
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz - 1; k++) bag.box(m.vermilion, 0.3, bh, zl[k + 1] - zl[k], xl[i], by0 + bh / 2, (zl[k] + zl[k + 1]) / 2);
  }
  // Main beam across the whole width on the middle line, over the dou: the chōchin hangs from it.
  const mainY0 = colTop + 0.26, mainY1 = colTop + 0.66;
  for (let i = 0; i < nx; i++) bag.box(m.vermilion, 0.62, 0.26, 0.62, xl[i], colTop + 0.13, zl[1]);
  bag.box(m.vermilion, 2 * hx + 0.9, mainY1 - mainY0, 0.42, cx, (mainY0 + mainY1) / 2, zl[1]);
  // Gilded beam ends and noses at the four outer corners.
  const nose = new THREE.CylinderGeometry(bh / 2, bh / 2, 0.28, 16);
  const boss = new THREE.CylinderGeometry(0.1, 0.1, 0.32, 12);
  for (const [i, ox] of [[0, -1], [nx - 1, 1]]) {
    for (const [k, oz] of [[0, -1], [nz - 1, 1]]) {
      for (const [dx, dz] of [[ox, 0], [0, oz]]) {
        const len = 0.7;
        bag.box(m.vermilion, dx ? len : 0.3, bh, dz ? len : 0.3, xl[i] + (dx * len) / 2, by0 + bh / 2, zl[k] + (dz * len) / 2);
        const at = new THREE.Matrix4().makeTranslation(xl[i] + dx * len, by0 + bh / 2, zl[k] + dz * len).multiply(
          new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(dx ? Math.PI / 2 : 0, 0, dz ? Math.PI / 2 : 0)));
        bag.add(m.vermilion, nose, at);
        bag.add(m.goldLeaf, boss, at);
      }
    }
  }
  // Gold caps on the main beam ends.
  for (const sx of [-1, 1]) {
    bag.add(m.goldLeaf, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), xf(cx + sx * (hx + 0.47), (mainY0 + mainY1) / 2, zl[1], 0, 0, Math.PI / 2));
  }

  // --- Ceiling over the passage and side bays -----------------------------------------------------
  const ceilY = mainY1;
  bag.box(m.wood, 2 * hx, 0.1, 2 * hz, cx, ceilY + 0.05, cz);
  for (let i = 0; i < nx - 1; i++) {
    for (let k = 0; k < nz - 1; k++) bag.add(m.goldLeaf, new THREE.CylinderGeometry(0.14, 0.14, 0.03, 14), xf((xl[i] + xl[i + 1]) / 2, ceilY - 0.015, (zl[k] + zl[k + 1]) / 2));
  }

  // --- Side bays: latticed screens on the middle line -------------------------------------------------------
  const base = xf(cx, 0, zl[1], 0, 0);
  for (const i of [0, 2]) {
    const lx = (xl[i] + xl[i + 1]) / 2 - cx, bw = xl[i + 1] - xl[i] - 2 * colR;
    const T = 0.2;
    lbox(bag, m.wood, base, bw, T + 0.04, lx, ph, ph + 0.4);
    lbox(bag, m.plaster, base, bw, T, lx, ph + 0.4, ph + 1.2);
    lbox(bag, m.vermilion, base, bw, T + 0.1, lx, ph + 1.2, ph + 1.34, 0.02);
    lbox(bag, m.blackLacquer, base, bw, 0.04, lx, ph + 1.34, colTop - 0.6, -0.06);
    addLattice(bag, m.vermilion, base, lx - bw / 2, lx + bw / 2, ph + 1.34, colTop - 0.6, 0.18, 0.06, 0.1, 0.02);
    lbox(bag, m.vermilion, base, bw, T + 0.1, lx, colTop - 0.6, colTop - 0.46, 0.02);
    lbox(bag, m.plaster, base, bw, T, lx, colTop - 0.46, colTop - 0.45 + 0.0);
  }

  // --- Roof ---------------------------------------------------------------------------------------------------
  buildRoof(bag, roofMats, {
    cx, cz,
    ex: hx + g.eaveOverhang, ez: hz + g.eaveOverhang,
    tipY: g.eaveY + 0.3, ridgeY: g.ridgeY, xs: g.ridgeHalfLength,
    lift: 0.5, c: 0.5, colEx: hx, colEz: hz,
    flyBottomY: g.eaveY, overhang: g.eaveOverhang, rafterRise: 0.14, purlinOut: 0.7,
    rafterSpacing: 0.4, scale: 0.8,
    closureY0: purlinY - 0.1, closureY1: purlinY + 1.4,
  });

  // --- Chōchin ------------------------------------------------------------------------------------------------------
  const c = g.chochin;
  chochin(bag, m, { cx: c.center[0], cy: c.center[1], cz: c.center[2], height: c.height, radius: c.radius, hangY: mainY0 });
}
