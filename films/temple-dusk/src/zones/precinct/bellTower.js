// Bell tower (shoro): stone base, four splayed vermilion posts, tie beams, bracket
// blocks, an irimoya roof (hip skirt below, gable above) with curved planes, lifted
// corners and round-tile ribs, and a bronze temple bell hanging beside a striking log.
// Built in tower-local coordinates (origin on the ground at the tower centre).
// Static parts go into the accumulator set S; the swinging bell and log are returned
// as two geometries that precinct.js turns into meshes.
import * as THREE from 'three';
import { Acc, put, box, rbox, sphere, lathe, tube, grid, roughen, bump, cached, unitCyl } from './kit.js';

const PERIOD = 0.34; // spacing of the round-tile ribs, also of the rafters
const RIB = 0.03; // rib height
const FASCIA = 0.2; // eave edge thickness
const CURVE = 1.5; // concavity of the roof planes (flat at the eave, steeper inside)
const SIDE_ROT = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // S, E, N, W (outward = local +z)

const ribProfile = (u) => {
  const p = Math.max(0, 1 - Math.abs(u - 0.5) / 0.24);
  return p * p * (3 - 2 * p);
};

export function buildBellTower({ layout, S }) {
  const bt = layout.precinct.bellTower;
  const { base: B, baseHeight: BH, postSpan, eaveY, ridgeY } = bt;
  const bx = bt.bellCenter[0] - bt.center[0], bz = bt.bellCenter[2] - bt.center[2];
  const hp = postSpan / 2;

  // --- stone base ----------------------------------------------------------
  rbox(S.stone, 0, 0.23, 0, B, 0.46, B, 0.04, 2);
  rbox(S.stone, 0, 0.58, 0, B - 0.28, 0.24, B - 0.28, 0.03, 2);
  rbox(S.stone, 0, 0.75, 0, B - 0.04, 0.1, B - 0.04, 0.03, 2);
  // Paving slabs on the platform.
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) rbox(S.stone, i * 1.52, BH + 0.005, j * 1.52, 1.48, 0.012, 1.48, 0.005, 1);
  // Two steps on the south side.
  rbox(S.stone, 0, 0.135, B / 2 + 0.42, 1.9, 0.27, 0.8, 0.03, 2);
  rbox(S.stone, 0, 0.265, B / 2 + 0.1, 1.7, 0.53, 0.5, 0.03, 2);

  // --- posts ---------------------------------------------------------------
  const postY0 = BH + 0.17, postTop = eaveY;
  const lean = 0.16; // top of each post sits this much closer to the axis
  const halfAt = (y) => hp - lean * (y - postY0) / (postTop - postY0);
  const postLen = Math.hypot(postTop - postY0, lean * Math.SQRT2);
  const postProfile = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    postProfile.push([0.205 - 0.035 * u + 0.012 * Math.sin(Math.PI * u), u * postLen]);
  }
  postProfile.unshift([0, 0]);
  postProfile.push([0, postLen]);
  const postGeo = lathe(postProfile, 20);
  const plinthGeo = roughen(lathe([[0, 0], [0.4, 0], [0.41, 0.03], [0.38, 0.1], [0.33, 0.15], [0.28, 0.175], [0, 0.185]], 22), 0.008, 5, 3);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of corners) {
    put(S.stone, plinthGeo, sx * hp, BH, sz * hp);
    const a = [sx * hp, postY0, sz * hp], b = [sx * (hp - lean), postTop, sz * (hp - lean)];
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...a),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()),
      new THREE.Vector3(1, 1, 1),
    );
    S.vermilion.add(postGeo, m);
  }

  // --- tie beams (nuki) and the head frame ----------------------------------
  for (const y of [2.05, 4.45]) {
    const hx = halfAt(y), hz = halfAt(y + 0.2);
    for (const s of [-1, 1]) {
      rbox(S.vermilion, 0, y, s * hx, 2 * hx + 0.3, 0.18, 0.15, 0.02, 1);
      rbox(S.vermilion, s * hz, y + 0.2, 0, 0.15, 0.18, 2 * hz + 0.3, 0.02, 1);
    }
  }
  const headX = 5.5, headZ = 5.2;
  const hh = halfAt(headX);
  for (const s of [-1, 1]) {
    rbox(S.vermilion, 0, headX, s * hh, 2 * hh + 0.7, 0.32, 0.24, 0.025, 2);
    rbox(S.vermilion, s * halfAt(headZ), headZ, 0, 0.22, 0.26, 2 * hh, 0.025, 2);
  }
  // The beam the bell and striking log hang from (ridge-wise it runs north-south).
  const beamY0 = headX + 0.16, beamH = 0.34;
  const beamHalf = hh + 0.75;
  rbox(S.vermilion, bx, beamY0 + beamH / 2, bz, 0.3, beamH, 2 * beamHalf, 0.05, 2);
  const pivotY = beamY0;

  // --- bracket sets on the post tops --------------------------------------------
  const ring = hp - lean + 0.45; // outer wall-plate line
  for (const [sx, sz] of corners) {
    const px = sx * (hp - lean), pz = sz * (hp - lean);
    rbox(S.wood, px, postTop + 0.085, pz, 0.5, 0.17, 0.5, 0.02, 1);
    rbox(S.wood, px, postTop + 0.24, pz, 1.1, 0.14, 0.2, 0.02, 1);
    rbox(S.wood, px, postTop + 0.255, pz, 0.2, 0.14, 1.1, 0.02, 1);
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) rbox(S.wood, px + ax * 0.45, postTop + 0.385, pz + az * 0.45, 0.24, 0.15, 0.24, 0.02, 1);
  }
  const plateY = postTop + 0.56 - 0.09;
  for (const s of [-1, 1]) {
    rbox(S.wood, 0, plateY, s * ring, 2 * ring + 0.3, 0.18, 0.2, 0.02, 1);
    rbox(S.wood, s * ring, plateY, 0, 0.2, 0.18, 2 * ring + 0.3, 0.02, 1);
  }
  rbox(S.wood, 0, plateY + 0.02, 0, 2 * ring, 0.05, 2 * ring, 0.01, 1);

  // --- roof ------------------------------------------------------------------------
  const EX = 3.5, EZ = 3.3, TIP = 0.28, LIFT = 0.45;
  const IX = 2.0, IZ = 1.5, GX = 0.35;
  const yE = eaveY + FASCIA; // top surface at the eave
  const yK = plateY + 0.7; // where the hip skirt meets the gable roof
  const soffitIn = plateY - 0.02;

  // One side of the hip skirt in a frame with lateral x and outward z.
  function skirtSide(k) {
    const ew = k % 2 === 0;
    const latE = (ew ? EX : EZ) + TIP, depE = ew ? EZ : EX, latI = ew ? IX : IZ, depI = ew ? IZ : IX;
    const out = (l) => depE + TIP * Math.abs(l) ** 3;
    const ribs = Math.round((2 * latE) / PERIOD), sub = 5, nv = ribs * sub, nu = 8;
    const lat = (j) => -1 + (2 * j) / nv;
    const corr = (j) => RIB * ribProfile((j % sub) / sub);
    const top = (s, l, c = 0) => [
      l * (latI + (latE - latI) * s),
      yK + (yE - yK) * (1 - (1 - s) ** CURVE) + LIFT * Math.abs(l) ** 2.5 * s ** 2.5 + c * Math.min(1, s * 6),
      depI + (out(l) - depI) * s,
    ];
    const rot = new THREE.Matrix4().makeRotationY(SIDE_ROT[k]);
    const surface = grid(nu, nv, (i, j) => top(i / nu, lat(j), corr(j)), { face: [0, 1, 0], uScale: 6, vScale: 2 });
    const edge = grid(1, nv, (i, j) => {
      const t = top(1, lat(j), corr(j));
      return i === 0 ? t : [t[0], top(1, lat(j))[1] - FASCIA, t[2]];
    }, { face: [0, 0, 1], uScale: 6, vScale: 0.3 });
    const soffitPt = (u, l) => [
      l * (latI + 0.3 + (latE - latI - 0.3) * u),
      soffitIn + (eaveY - soffitIn) * u + LIFT * Math.abs(l) ** 2.5 * u ** 2.5,
      depI + 0.3 + (out(l) - depI - 0.3) * u,
    ];
    const under = grid(5, 20, (i, j) => soffitPt(i / 5, -1 + (2 * j) / 20), { face: [0, -1, 0], uScale: 4, vScale: 1.5 });
    S.roofTile.add(surface, rot);
    S.roofTile.add(edge, rot);
    S.wood.add(under, rot);

    const acc = (a, geo, x, y, z, opt) => { // place in the rotated frame
      const t = new THREE.Matrix4().makeRotationY(SIDE_ROT[k]);
      const loc = new THREE.Matrix4();
      loc.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(opt?.rx ?? 0, opt?.ry ?? 0, opt?.rz ?? 0, 'YXZ')), new THREE.Vector3(opt?.sx ?? 1, opt?.sy ?? 1, opt?.sz ?? 1));
      a.add(geo, t.multiply(loc));
    };
    const disc = cached('tiledisc', () => new THREE.CircleGeometry(1, 8));
    for (let m = 0; m < ribs; m++) {
      const l = -1 + (2 * (m + 0.5)) / ribs;
      if (Math.abs(l) > 0.94) continue;
      // Rafter (round) under the soffit, running out to the eave.
      const pts = [0.28, 0.55, 0.82, 0.985].map((u) => { const p = soffitPt(u, l); return [p[0], p[1] - 0.06, p[2]]; });
      S.wood.add(tube(pts, [0.05, 0.05, 0.048, 0.045], 6, { caps: false }), rot);
      // Eave tile end, a round disc on the fascia.
      const e = top(1, l, RIB);
      acc(S.roofTile, disc, e[0], e[1] - FASCIA * 0.5, e[2] + 0.008, { sx: 0.07, sy: 0.07 });
    }
    // Hip ridge toward the corner l = 1, and its tip ornament.
    const hip = [0, 0.2, 0.4, 0.6, 0.8, 1].map((s) => { const p = top(s, 1); return [p[0], p[1] + 0.05, p[2]]; });
    S.roofTile.add(tube(hip, [0.09, 0.1, 0.105, 0.11, 0.115, 0.12], 8, { caps: false }), rot);
    const tp = top(1, 1);
    acc(S.roofTile, cached('s8', () => new THREE.SphereGeometry(1, 8, 6)), tp[0], tp[1] + 0.06, tp[2], { sx: 0.17, sy: 0.14, sz: 0.17 });
  }
  for (let k = 0; k < 4; k++) skirtSide(k);

  // Upper gable roof: two curved planes (S, then N by rotation) with ridge along x.
  const GL = IX + GX;
  const yUp = (s) => yK + (ridgeY - yK) * s ** 1.4;
  {
    const ribs = Math.round((2 * GL) / PERIOD), sub = 5, nv = ribs * sub, nu = 8;
    const corr = (j) => RIB * ribProfile((j % sub) / sub);
    const surf = grid(nu, nv, (i, j) => {
      const s = i / nu;
      return [(-1 + (2 * j) / nv) * GL, yUp(s) + corr(j), IZ * (1 - s)];
    }, { face: [0, 0.6, 1], uScale: 5, vScale: 1.5 });
    const edgeG = grid(1, nv, (i, j) => {
      const x = (-1 + (2 * j) / nv) * GL;
      return [x, yK + (i ? -FASCIA * 0.8 : corr(j)), IZ];
    }, { face: [0, 0, 1], uScale: 5, vScale: 0.3 });
    // Gable-end thickness and the underside of the overhang beyond the gable wall.
    const endFace = (sx) => grid(8, 1, (i, j) => [sx * GL, yUp(i / 8) - (j ? 0.14 : 0), IZ * (1 - i / 8)], { face: [sx, 0, 0] });
    const underside = (sx) => grid(8, 1, (i, j) => [sx * (j ? GL : IX), yUp(i / 8) - 0.14, IZ * (1 - i / 8)], { face: [0, -1, 0] });
    for (const ry of [0, Math.PI]) {
      const rot = new THREE.Matrix4().makeRotationY(ry);
      S.roofTile.add(surf, rot);
      S.roofTile.add(edgeG, rot);
      for (const sx of [-1, 1]) {
        S.roofTile.add(endFace(sx), rot);
        S.wood.add(underside(sx), rot);
      }
    }
    // Barge boards along the sloped gable edges.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pts = [0, 0.2, 0.4, 0.6, 0.8, 1].map((s) => [sx * GL, yUp(s) - 0.02, sz * IZ * (1 - s)]);
        S.wood.add(tube(pts, 0.075, 6, { caps: true }));
      }
    }
    // Ridge and its end ornaments.
    S.roofTile.add(tube([[-GL - 0.05, ridgeY + 0.08, 0], [GL + 0.05, ridgeY + 0.08, 0]], 0.17, 10));
    S.roofTile.add(tube([[-GL - 0.02, ridgeY + 0.26, 0], [GL + 0.02, ridgeY + 0.26, 0]], 0.1, 8));
    for (const sx of [-1, 1]) {
      const horn = [[0, 0, 0], [0.12, 0.2, 0], [0.12, 0.45, 0], [0.0, 0.65, 0], [-0.15, 0.7, 0]].map(([a, b]) => [sx * (GL + 0.05 + a), ridgeY + 0.1 + b, 0]);
      S.roofTile.add(tube(horn, [0.12, 0.1, 0.08, 0.05, 0.022], 7));
    }
    // Gable wall (E, W) with battens, and a hanging ornament (gegyo) under the apex.
    const gableWall = grid(8, 1, (i, j) => {
      const s = i / 8;
      return [IX, yK - 0.02 + (ridgeY - yK) * s ** 1.4 - 0.04, (j ? 1 : -1) * IZ * (1 - s)];
    }, { face: [1, 0, 0], uScale: 2, vScale: 1 });
    for (const ry of [0, Math.PI]) {
      const rot = new THREE.Matrix4().makeRotationY(ry);
      S.plaster.add(gableWall, rot);
      const sgn = ry === 0 ? 1 : -1;
      for (const z of [-0.95, -0.5, 0, 0.5, 0.95]) {
        const s = 1 - Math.abs(z) / IZ;
        const top = yK - 0.06 + (ridgeY - yK) * s ** 1.4;
        box(S.wood, sgn * (IX - 0.01), sgn * (IX + 0.06), yK - 0.02, top - 0.04, z - 0.035, z + 0.035);
      }
      box(S.wood, sgn * (IX - 0.01), sgn * (IX + 0.07), yK - 0.02, yK + 0.04, -IZ, IZ);
      // Gegyo: a carved hanging piece, three lobes and a tail.
      const gx = sgn * (IX + 0.12);
      sphere(S.wood, gx, ridgeY - 0.55, 0, 0.05, 0.16, 0.2, 8, 5);
      sphere(S.wood, gx, ridgeY - 0.42, 0.17, 0.05, 0.1, 0.1, 8, 5);
      sphere(S.wood, gx, ridgeY - 0.42, -0.17, 0.05, 0.1, 0.1, 8, 5);
      put(S.wood, unitCyl(6), gx, ridgeY - 0.78, 0, { rz: Math.PI / 2, sx: 0.025, sy: 0.05, sz: 0.025 });
      sphere(S.vermilion, gx + sgn * 0.045, ridgeY - 0.55, 0, 0.02, 0.05, 0.07, 6, 4);
    }
  }
  // Ceiling plate behind the soffit.
  box(S.wood, -ring + 0.1, ring - 0.1, soffitIn - 0.04, soffitIn + 0.01, -ring + 0.1, ring - 0.1);

  // --- the bell and its striking log (pivot local coordinates, origin at the beam underside) ----
  const H = bt.bellHeight;
  const lip = bt.bellCenter[1] - H / 2 - pivotY; // lip height below the pivot (negative)
  const rOf = (() => {
    const ctl = [[0, 0.5], [0.03, 0.525], [0.09, 0.52], [0.14, 0.48], [0.22, 0.455], [0.5, 0.425], [0.9, 0.395], [1.15, 0.37], [1.35, 0.335], [1.46, 0.3], [1.53, 0.27], [1.575, 0.26], [1.6, 0.25]]
      .map(([y, r]) => [y * H / 1.6, r]);
    const curve = new THREE.SplineCurve(ctl.map(([y, r]) => new THREE.Vector2(y, r)));
    const samples = curve.getPoints(160);
    return (y) => {
      let k = 0;
      while (k < samples.length - 2 && samples[k + 1].x < y) k++;
      const a = samples[k], b = samples[k + 1];
      const t = b.x === a.x ? 0 : Math.min(1, Math.max(0, (y - a.x) / (b.x - a.x)));
      const r = a.y + (b.y - a.y) * t;
      return r + 0.016 * bump(y, 0.17, 0.028) + 0.02 * bump(y, 0.7, 0.03) + 0.02 * bump(y, 0.78, 0.03) + 0.018 * bump(y, 1.13, 0.03) + 0.014 * bump(y, 1.47, 0.022);
    };
  })();
  const bellProfile = [];
  const innerPts = [[0, 1.47], [0.12, 1.45], [0.22, 1.38], [0.31, 1.15], [0.37, 0.8], [0.42, 0.4], [0.455, 0.08], [0.465, 0.0]];
  for (const [r, y] of innerPts) bellProfile.push([r, y * H / 1.6]);
  bellProfile.push([0.505, 0]);
  const NS = 86;
  for (let i = 0; i <= NS; i++) {
    const y = (i / NS) * H;
    if (y < 0.001) continue;
    bellProfile.push([rOf(y), y]);
  }
  bellProfile.push([0.13, H], [0, H]);
  const bell = new Acc();
  const bellGeo = lathe(bellProfile.map(([r, y]) => [r, y + lip]), 40);
  bell.add(bellGeo);
  // Vertical bands separating the four panels.
  for (let q = 0; q < 4; q++) {
    const phi = Math.PI / 4 + (q * Math.PI) / 2;
    const w = 0.026, y0 = 0.19, y1 = 1.11;
    bell.add(grid(24, 3, (i, j) => {
      const y = y0 + (y1 - y0) * (i / 24);
      const off = [-w, -w * 0.65, w * 0.65, w][j];
      const rr = rOf(y) + (j === 1 || j === 2 ? 0.014 : -0.003);
      return [rr * Math.sin(phi) + off * Math.cos(phi), y + lip, rr * Math.cos(phi) - off * Math.sin(phi)];
    }, { face: [Math.sin(phi), 0, Math.cos(phi)] }));
  }
  // Nipples (nyu): five columns by three rows in each panel.
  const nip = new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let q = 0; q < 4; q++) {
    const phi0 = (q * Math.PI) / 2;
    for (let row = 0; row < 3; row++) {
      const y = 1.2 + row * 0.095;
      const rr = rOf(y);
      for (let c = -2; c <= 2; c++) {
        const phi = phi0 + (c * 0.098) / rr;
        const n = new THREE.Vector3(Math.sin(phi), 0.12, Math.cos(phi)).normalize();
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(rr * Math.sin(phi), y + lip, rr * Math.cos(phi)).addScaledVector(n, -0.004),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n),
          new THREE.Vector3(1, 1, 1),
        );
        bell.add(nip, m);
      }
    }
  }
  // Striking seats (tsukiza): carved lotus discs on two opposite sides.
  const seat = new Acc();
  seat.add(lathe([[0, 0], [0.115, 0], [0.115, 0.014], [0.1, 0.018], [0.094, 0.026], [0.07, 0.03], [0.05, 0.04], [0, 0.045]], 20));
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * Math.PI * 2;
    put(seat, cached('s8', () => new THREE.SphereGeometry(1, 8, 6)), Math.cos(a) * 0.072, 0.03, Math.sin(a) * 0.072, { sx: 0.03, sy: 0.016, sz: 0.018, ry: -a });
  }
  const seatGeo = seat.geometry();
  const seatY = 0.43;
  for (const phi of [0, Math.PI]) {
    const rr = rOf(seatY);
    const n = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
    bell.add(seatGeo, new THREE.Matrix4().compose(
      new THREE.Vector3(rr * n.x, seatY + lip, rr * n.z).addScaledVector(n, -0.006),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n),
      new THREE.Vector3(1, 1, 1),
    ));
  }
  // Dragon-head loop (ryuzu) on the crown, and the iron hanger up to the beam.
  const crown = lip + H;
  bell.add(new THREE.TorusGeometry(0.17, 0.04, 8, 16, Math.PI), new THREE.Matrix4().makeTranslation(0, crown, 0));
  for (const sx of [-1, 1]) {
    const hx = sx * 0.19;
    put(bell, cached('s10', () => new THREE.SphereGeometry(1, 10, 7)), hx + sx * 0.04, crown + 0.03, 0, { sx: 0.1, sy: 0.07, sz: 0.075, rz: sx * 0.35 });
    put(bell, cached('s10', () => new THREE.SphereGeometry(1, 10, 7)), hx + sx * 0.12, crown + 0.005, 0, { sx: 0.06, sy: 0.038, sz: 0.05, rz: sx * 0.5 });
    for (const sz of [-1, 1]) {
      put(bell, new THREE.ConeGeometry(0.014, 0.1, 5), hx - sx * 0.01, crown + 0.12, sz * 0.045, { rz: -sx * 0.9 + sx * 0.2, rx: sz * 0.25 });
      put(bell, cached('s6', () => new THREE.SphereGeometry(1, 6, 4)), hx + sx * 0.07, crown + 0.065, sz * 0.05, { sx: 0.014, sy: 0.014, sz: 0.014 });
    }
  }
  const rodLo = crown + 0.17, rodHi = -0.03;
  bell.add(new THREE.TorusGeometry(0.06, 0.013, 6, 12), new THREE.Matrix4().makeTranslation(0, crown + 0.27, 0));
  put(bell, unitCyl(6), 0, (rodLo + rodHi) / 2, 0, { sx: 0.02, sy: rodHi - rodLo, sz: 0.02 });
  box(bell, -0.08, 0.08, rodHi - 0.02, 0, -0.14, 0.14);

  // Striking log (shumoku) hung on a V of ropes from the same beam, hitting the seat on +z.
  const log = new Acc();
  const seatWorldY = lip + seatY;
  const zl0 = 0.64, zl1 = 2.32, len = zl1 - zl0;
  const rl = 0.15;
  const logProfile = [];
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * len;
    const end = Math.min(y, len - y);
    const cap = end < 0.08 ? Math.sqrt(Math.max(0, 1 - ((0.08 - end) / 0.08) ** 2)) : 1;
    logProfile.push([rl * (0.97 + 0.03 * (y / len)) * cap + 0.012 * bump(y, 0.39, 0.03) + 0.012 * bump(y, 1.14, 0.03), y]);
  }
  put(log, lathe(logProfile, 16), 0, seatWorldY, zl0, { rx: Math.PI / 2 });
  // Ropes: each hanging point has two ropes meeting at the log top.
  for (const z of [1.0, 1.75]) {
    for (const sx of [-1, 1]) {
      log.add(tube([[sx * 0.2, -0.02, z], [sx * 0.12, (seatWorldY + 0.2) / 2, z], [sx * 0.02, seatWorldY + rl - 0.01, z]], 0.017, 5));
    }
    put(log, cached('s6', () => new THREE.SphereGeometry(1, 6, 4)), 0, seatWorldY + rl, z, { sx: 0.045, sy: 0.03, sz: 0.045 });
  }
  return {
    pivot: [bx, pivotY, bz],
    bellGeo: bell.geometry(),
    logGeo: log.geometry(),
  };
}
