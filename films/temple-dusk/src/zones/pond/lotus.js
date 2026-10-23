// Lotus: leaves (floating and held up on stems), flowers, buds, seed pods and the hero flower.
// Three merged meshes: leaves (veined texture), petals, and stems/pods/stamens/seeds.

import * as THREE from 'three';
import { surface, tube, tinted, merge, place, smooth, mix, mixRgb, rgb } from './util.js';

const TAU = Math.PI * 2;
const deg = Math.PI / 180;

// ---------------------------------------------------------------------------
// Textures (generated, tileless, seeded)
// ---------------------------------------------------------------------------

function dataTexture(size, w, h, fn) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.round(255 * Math.min(1, Math.max(0, fn(x / (w - 1), y / (h - 1)))));
      const k = (y * w + x) * 4;
      data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// Polar leaf map: pale raised radial veins with forks toward the rim, mottling, a pale navel.
function leafTexture(noise) {
  const N1 = 15, N2 = 30;
  return dataTexture(0, 384, 384, (u, v) => {
    const x = u * 2 - 1, y = v * 2 - 1;
    const r = Math.hypot(x, y);
    if (r > 1) return 0.8;
    const th = Math.atan2(y, x);
    const warp = (noise.fbm2(r * 6, th * 1.5, 3, 5) - 0.5) * 0.35;
    const vein = (n, offset, w0, w1) => {
      const a = (th / TAU + 1) * n + warp * 0.6 + offset;
      const da = Math.abs(a - Math.round(a)) / n * TAU * r; // arc distance to the nearest vein
      const w = mix(w0, w1, r);
      return Math.exp(-((da / w) ** 2));
    };
    const v1 = vein(N1, 0, 0.016, 0.004);
    const v2 = vein(N2, 0.5, 0.008, 0.003) * smooth(0.32, 0.55, r);
    const ring = Math.exp(-(((r - 0.3) / 0.01) ** 2)) * 0.4 + Math.exp(-(((r - 0.62) / 0.012) ** 2)) * 0.25;
    const mottle = noise.fbm2(x * 7 + 3, y * 7, 4, 9);
    const navel = Math.exp(-((r / 0.05) ** 2));
    return 0.72 + 0.14 * mottle + 0.2 * v1 + 0.12 * v2 + 0.06 * ring + 0.12 * navel;
  });
}

// Petal map: long parallel veins (u across, v along).
function petalTexture(noise) {
  return dataTexture(0, 96, 192, (u, v) => {
    const x = u * 2 - 1;
    const stripes = 0.5 + 0.5 * Math.cos((x * 11 + (noise.valueNoise2(u * 4, v * 3, 3) - 0.5) * 2.2) * Math.PI);
    const fine = 0.5 + 0.5 * Math.cos(x * 31 + noise.valueNoise2(u * 9, v * 4, 8) * 4);
    return 0.9 + 0.06 * stripes * (1 - v * 0.5) + 0.04 * fine;
  });
}

// Gentle sway above the waterline: pure function of t (shared time uniform).
function addSway(mat, timeUniform, waterY, key) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSwayTime = timeUniform;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSwayTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float swH = max(0.0, transformed.y - ${waterY.toFixed(3)});
        transformed.xz += vec2(sin(uSwayTime * 0.7 + transformed.x * 0.9 + transformed.z * 0.4),
                               cos(uSwayTime * 0.55 + transformed.z * 0.8 - transformed.x * 0.3)) * swH * 0.012;`);
  };
  mat.customProgramCacheKey = () => `sway-${key}`;
}

// ---------------------------------------------------------------------------
// Leaves
// ---------------------------------------------------------------------------

const LEAF_PALETTE = [
  [0.0, rgb('#3d6a3b')], [0.28, rgb('#6f8f3a')], [0.5, rgb('#b09a3a')], [0.74, rgb('#a2702c')], [1.0, rgb('#5f4122')],
];
function leafColor(h) {
  for (let i = 1; i < LEAF_PALETTE.length; i++) {
    if (h <= LEAF_PALETTE[i][0]) {
      const [h0, c0] = LEAF_PALETTE[i - 1], [h1, c1] = LEAF_PALETTE[i];
      return mixRgb(c0, c1, (h - h0) / (h1 - h0));
    }
  }
  return LEAF_PALETTE[LEAF_PALETTE.length - 1][1];
}

function leafGeometry(noise, r, { R, cup, ruffle, health, notches, seed, NR, NS }) {
  const phase = r.range(0, TAU);
  const g = surface(NR, NS, (i, j, o) => {
    const t = i / NR, th = (j / NS) * TAU;
    let cut = 0;
    for (const n of notches) {
      let d = Math.abs(th - n.a); d = Math.min(d, TAU - d);
      cut = Math.max(cut, n.depth * Math.max(0, 1 - d / n.w));
    }
    // Ragged rim: small noise on the edge radius.
    const rag = 1 - 0.05 * noise.valueNoise2(Math.cos(th) * 3 + seed, Math.sin(th) * 3, 13) * smooth(0.6, 1, t);
    const rad = Math.max(0.025, 0.04 + t * (1 - cut) * rag) * R;
    const rt = Math.min(1, rad / R);
    const y = cup * R * rt ** 2.2 + ruffle * R * rt ** 3 * Math.sin(5 * th + phase) + 0.045 * R * Math.exp(-((rt / 0.07) ** 2));
    o.p = [Math.cos(th) * rad, y, Math.sin(th) * rad];
    // Colour: healthy centre, browner and yellower toward the rim; patches by noise.
    const patch = noise.fbm2(Math.cos(th) * rt * 3 + seed, Math.sin(th) * rt * 3, 3, 21);
    const hh = Math.min(1, Math.max(0, health * (0.55 + 0.6 * smooth(0.25, 1, rt)) + (patch - 0.5) * 0.35 * (0.3 + health)));
    o.c = leafColor(hh);
    o.uv = [0.5 + 0.5 * Math.cos(th) * t, 0.5 + 0.5 * Math.sin(th) * t];
  }, { wrap: true });
  return g;
}

// ---------------------------------------------------------------------------
// Flower parts
// ---------------------------------------------------------------------------

const C_WHITE = rgb('#fbf5ec'), C_PINK = rgb('#f08db0'), C_DEEP = rgb('#d94f86'), C_BASE = rgb('#eee8a0');

// One petal in flower-local space: base at radius r0 along +x, rising by phi(u).
function petalGeometry(r, { az, r0, L, W, phi0, phi1, cup, twist, pink, nu, nv }) {
  const path = [[r0, 0]];
  const phis = [];
  for (let i = 0; i <= nu; i++) phis.push(phi0 + (phi1 - phi0) * (i / nu) ** 1.4);
  for (let i = 1; i <= nu; i++) {
    const p = path[i - 1], a = (phis[i] + phis[i - 1]) / 2;
    path.push([p[0] + Math.cos(a) * L / nu, p[1] + Math.sin(a) * L / nu]);
  }
  const g = surface(nu, nv, (i, j, o) => {
    const u = i / nu, v = (j / nv) * 2 - 1;
    const w = W * Math.sin(Math.PI * Math.min(1, u) ** 0.75) ** 0.9;
    const nx = -Math.sin(phis[i]), ny = Math.cos(phis[i]);
    const cupd = cup * v * v * w;
    o.p = [path[i][0] + nx * cupd, path[i][1] + ny * cupd, v * w + twist * u ** 3 * W];
    let c = mixRgb(C_WHITE, C_PINK, smooth(0.08, 0.95, u) ** 1.1 * pink);
    c = mixRgb(c, C_DEEP, smooth(0.72, 1, u) * pink * 0.65);
    c = mixRgb(c, C_WHITE, 0.25 * smooth(0.7, 1, Math.abs(v)) * (1 - u * 0.5));
    c = mixRgb(c, C_BASE, (1 - smooth(0, 0.2, u)) * 0.55);
    o.c = c;
    o.uv = [v * 0.5 + 0.5, u];
  });
  return place(g, { rotY: az });
}

const OPEN_RINGS = [
  { n: 7, L: 0.150, W: 0.038, phi0: 20, phi1: -10, r0: 0.030, cup: 0.30, pink: 1.0 },
  { n: 6, L: 0.142, W: 0.036, phi0: 44, phi1: 14, r0: 0.026, cup: 0.45, pink: 0.9 },
  { n: 5, L: 0.115, W: 0.031, phi0: 68, phi1: 44, r0: 0.022, cup: 0.55, pink: 0.75 },
];
const HALF_RINGS = [
  { n: 6, L: 0.145, W: 0.036, phi0: 52, phi1: 30, r0: 0.028, cup: 0.45, pink: 1.0 },
  { n: 5, L: 0.125, W: 0.032, phi0: 72, phi1: 58, r0: 0.022, cup: 0.5, pink: 0.85 },
  { n: 4, L: 0.100, W: 0.028, phi0: 82, phi1: 76, r0: 0.018, cup: 0.5, pink: 0.7 },
];
const BUD_RINGS = [
  { n: 5, L: 0.150, W: 0.036, phi0: 76, phi1: 106, r0: 0.026, cup: 0.5, pink: 1.0 },
  { n: 4, L: 0.130, W: 0.032, phi0: 82, phi1: 112, r0: 0.020, cup: 0.5, pink: 0.9 },
];

function flowerPetals(r, kind, detail) {
  const rings = kind === 'open' ? OPEN_RINGS : kind === 'half' ? HALF_RINGS : BUD_RINGS;
  const nu = detail ? 18 : 9, nv = detail ? 12 : 6;
  const out = [];
  rings.forEach((ring, ri) => {
    const off = ri * 0.5 / ring.n * TAU + r.range(0, 0.2);
    for (let k = 0; k < ring.n; k++) {
      const j = (s) => 1 + r.range(-s, s);
      out.push(petalGeometry(r, {
        az: off + (k / ring.n) * TAU + r.range(-0.08, 0.08),
        r0: ring.r0, L: ring.L * j(0.07), W: ring.W * j(0.08),
        phi0: (ring.phi0 + r.range(-5, 5)) * deg, phi1: (ring.phi1 + r.range(-8, 8)) * deg,
        cup: ring.cup, twist: r.range(-0.25, 0.25), pink: Math.min(1, ring.pink * j(0.1)), nu, nv,
      }));
    }
  });
  return out;
}

// Seed pod: obconical, flat top with sunk holes; seeds sit in some holes. Local y = 0 at the top rim.
function podGeometries(r, { R, height, holes, detail, dried }) {
  const nTop = detail ? 22 : 7, nSeg = detail ? 96 : 28;
  const holeList = [];
  for (let k = 0; k < holes; k++) {
    const rr = 0.76 * R * Math.sqrt((k + 0.5) / holes), a = k * 137.508 * deg;
    holeList.push([rr * Math.cos(a), rr * Math.sin(a), R * (0.13 + 0.02 * r.next())]);
  }
  const cTop = dried ? rgb('#7d7440') : rgb('#a9b94a');
  const cSide = dried ? rgb('#5e4f2c') : rgb('#6e9a3a');
  const cHole = dried ? rgb('#1a140c') : rgb('#2a3412');
  const cRim = dried ? rgb('#8a7a46') : rgb('#c9d65a');
  const rings = [];
  for (let i = 0; i <= nTop; i++) rings.push({ rr: R * i / nTop, y: 0.004 * (1 - (i / nTop) ** 2) , top: true });
  rings.push({ rr: R * 1.0, y: -0.004, top: false, k: 0 });
  rings.push({ rr: R * 0.97, y: -0.010, top: false, k: 0.05 });
  const nSide = 5;
  for (let k = 1; k <= nSide; k++) {
    const t = k / nSide;
    rings.push({ rr: R * (0.95 - 0.7 * t ** 0.8), y: -0.012 - height * t, top: false, k: 0.1 + t });
  }
  const seeds = [];
  const g = surface(rings.length - 1, nSeg, (i, j, o) => {
    const ring = rings[i], a = (j / nSeg) * TAU;
    const x = Math.cos(a) * ring.rr, z = Math.sin(a) * ring.rr;
    let y = ring.y, c = ring.top ? cTop : mixRgb(cTop, cSide, Math.min(1, ring.k * 2));
    if (ring.top) {
      let best = 9;
      for (const [hx, hz, hr] of holeList) {
        const d = Math.hypot(x - hx, z - hz) / hr;
        if (d < best) best = d;
        if (d < 1.15) y -= 0.0075 * (1 - Math.min(1, (d / 1.15) ** 2)) ** 0.9 * (detail ? 1 : 0.5);
      }
      c = best < 0.75 ? mixRgb(cHole, cRim, smooth(0.4, 0.75, best) * 0.4)
        : best < 1.25 ? mixRgb(cRim, cTop, smooth(0.95, 1.25, best)) : cTop;
    }
    o.p = [x, y, z];
    o.c = c;
    o.uv = [j / nSeg, i / (rings.length - 1)];
  }, { wrap: true });
  const parts = [g];
  if (!dried) {
    holeList.forEach(([hx, hz, hr], k) => {
      if (k % 4 === 3) return;
      const s = tinted(new THREE.SphereGeometry(hr * 0.62, detail ? 10 : 5, detail ? 8 : 4), rgb(k % 3 ? '#b6c452' : '#9fb43e'));
      s.translate(hx, -0.0035 + hr * 0.18, hz);
      parts.push(s);
    });
  }
  return parts;
}

// Stamens ringed around the pod: pale filaments with gold anthers.
function stamenGeometries(r, { count, rIn, rOut, up, scale }) {
  const out = [];
  const cFil = rgb('#f1e6a2'), cAnth = rgb('#f0b92a');
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU + r.range(-0.05, 0.05);
    const r0 = r.range(rIn, rOut) * scale, len = r.range(0.04, 0.062) * scale;
    const lean = r.range(0.4, 1.1);
    const dx = Math.cos(a), dz = Math.sin(a);
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const s = i / 4;
      pts.push([dx * (r0 + lean * len * s * s * 0.5), (-0.012 + up * s) * scale + len * 0.9 * s * 0.0, dz * (r0 + lean * len * s * s * 0.5)]);
      pts[i][1] = (-0.012 * scale) + (up * scale + len * 0.55) * s - len * 0.4 * s * s;
    }
    out.push(tube(pts, (s) => (0.0014 - 0.0004 * s) * scale, () => cFil, 4));
    // Anther: a short fat capsule continuing the tip direction.
    const p3 = pts[4], p2 = pts[3];
    const tx = p3[0] - p2[0], ty = p3[1] - p2[1], tz = p3[2] - p2[2], tl = Math.hypot(tx, ty, tz);
    const al = 0.016 * scale, tip = [p3[0] + tx / tl * al, p3[1] + ty / tl * al, p3[2] + tz / tl * al];
    out.push(tube([p3, [(p3[0] + tip[0]) / 2, (p3[1] + tip[1]) / 2, (p3[2] + tip[2]) / 2], tip], (s) => 0.0034 * scale * Math.sin(Math.PI * Math.min(1, s * 0.9 + 0.1)), () => cAnth, 5));
  }
  return out;
}

// Stem from the pond floor to `top`, upright at the root and bending in at the head.
function stemGeometry(root, top, radius, color) {
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const s = i / n, b = s ** 2.4;
    pts.push([root[0] + (top[0] - root[0]) * b, root[1] + (top[1] - root[1]) * s, root[2] + (top[2] - root[2]) * b]);
  }
  return tube(pts, (s) => radius * (1 - 0.25 * s), () => color, 4);
}

// ---------------------------------------------------------------------------

export function buildLotus({ layout, M, rng, noise, timeUniform }) {
  const { pond, terrainHeight, pondEdgeDistance } = layout;
  const wy = pond.waterY;
  const hero = layout.anchors.heroLotus;
  const heroXZ = [hero[0], hero[2]];
  const dHero = (x, z) => Math.hypot(x - heroXZ[0], z - heroXZ[1]);
  const stemGreen = rgb('#5b7a3a'), stemBrown = rgb('#6f6035');

  const leaves = [], petals = [], misc = [];
  const rl = rng.fork('leaves'), rf = rng.fork('flowers');

  // --- leaves ------------------------------------------------------------
  const placed = []; // {x, z, R}
  const coverage = [0.62, 0.7, 0.5];
  pond.lotusBeds.forEach((bed, bi) => {
    const [bx, , bz] = bed.center;
    let tries = 0, count = 0;
    const target = Math.round(Math.PI * bed.radius ** 2 * coverage[bi] / 0.38);
    while (count < target && tries++ < target * 40) {
      const a = rl.range(0, TAU), d = bed.radius * Math.sqrt(rl.next());
      const x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d * 0.95;
      if (rl.next() > 1 - 0.55 * (d / bed.radius) ** 2) continue;
      const R = Math.max(0.2, (0.46 + 0.14 * rl.gauss()) * (1 - 0.25 * (d / bed.radius) ** 2));
      const raised = rl.chance(0.26) && d > 0.6;
      const dh = dHero(x, z);
      if (dh < (raised ? 1.5 : 0.62 + R * 0.6)) continue;
      if (pondEdgeDistance(x, z) > -(R + 1.0)) continue;
      if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < 0.6 * (p.R + R) && (p.raised === raised || (!p.raised && !raised) ))) continue;
      placed.push({ x, z, R, raised });
      count++;
    }
  });
  placed.forEach((L, idx) => {
    const R = L.R;
    const health = Math.min(1, Math.max(0, 0.3 + 0.4 * rl.gauss() * 0.5 + (rl.chance(0.28) ? rl.range(0.35, 0.8) : 0)));
    const notches = [];
    if (health > 0.35 && rl.chance(0.75)) for (let k = rl.int(1, 3); k > 0; k--) notches.push({ a: rl.range(0, TAU), w: rl.range(0.22, 0.5), depth: rl.range(0.25, 0.7) });
    if (rl.chance(0.2)) notches.push({ a: rl.range(0, TAU), w: 0.2, depth: 0.95 });
    const cup = L.raised ? rl.range(0.1, 0.22) : rl.range(0.01, 0.07);
    // Detail follows the camera: full mesh near the hero flower, coarser rings far away.
    const dh = dHero(L.x, L.z);
    const [NR, NS] = dh < 3.5 ? [7, 44] : dh < 9 ? [4, 28] : [3, 20];
    const g = leafGeometry(noise, rl, { R, cup, ruffle: rl.range(0.005, 0.03), health, notches, seed: idx * 1.7, NR, NS });
    const y = L.raised ? wy + rl.range(0.25, 1.0) : wy + 0.018 + rl.range(0, 0.012);
    const tilt = L.raised ? rl.range(0.04, 0.32) : rl.range(0, 0.05), td = rl.range(0, TAU);
    place(g, { pos: [L.x, y, L.z], rotY: rl.range(0, TAU), rotX: tilt * Math.sin(td), rotZ: tilt * Math.cos(td) });
    leaves.push(g);
    if (L.raised) {
      const root = [L.x + rl.range(-0.4, 0.4), terrainHeight(L.x, L.z), L.z + rl.range(-0.4, 0.4)];
      misc.push(stemGeometry(root, [L.x, y - 0.01, L.z], rl.range(0.011, 0.016), health > 0.5 ? stemBrown : stemGreen));
    }
  });

  // --- flowers, buds, pods --------------------------------------------------
  const plan = [
    { kind: 'open' }, { kind: 'open' }, { kind: 'open' }, { kind: 'half' }, { kind: 'half' }, { kind: 'bud' }, { kind: 'bud' },
    { kind: 'pod', dried: true }, { kind: 'pod', dried: true }, { kind: 'pod', dried: true }, { kind: 'pod', dried: false }, { kind: 'pod', dried: true },
  ];
  const spots = [];
  let guard = 0;
  while (spots.length < plan.length && guard++ < 4000) {
    const bed = rf.pick(pond.lotusBeds.slice(0, 2).concat(pond.lotusBeds.slice(0, 1)));
    const a = rf.range(0, TAU), d = bed.radius * 0.85 * Math.sqrt(rf.next());
    const x = bed.center[0] + Math.cos(a) * d, z = bed.center[2] + Math.sin(a) * d * 0.95;
    if (dHero(x, z) < 1.9 || pondEdgeDistance(x, z) > -2.5) continue;
    if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 1.7)) continue;
    spots.push([x, z]);
  }
  plan.forEach((f, i) => {
    const [x, z] = spots[i];
    const topY = wy + rf.range(0.5, 1.0);
    const s = f.kind === 'pod' ? 1 : rf.range(0.8, 1.05);
    const root = [x + rf.range(-0.3, 0.3), terrainHeight(x, z), z + rf.range(-0.3, 0.3)];
    const tiltA = rf.range(0, TAU), tilt = rf.range(0.05, 0.25);
    if (f.kind === 'pod') {
      const g = podGeometries(rf, { R: 0.04, height: 0.07, holes: 12, detail: false, dried: f.dried });
      const m = merge(g);
      place(m, { pos: [x, topY, z], rotX: tilt * Math.sin(tiltA) * 1.3, rotZ: tilt * Math.cos(tiltA) * 1.3 });
      misc.push(m);
      misc.push(stemGeometry(root, [x, topY - 0.08, z], 0.0085, f.dried ? stemBrown : stemGreen));
      return;
    }
    const parts = flowerPetals(rf, f.kind, false);
    petals.push(...parts.map((g) => place(g, { pos: [x, topY, z], scale: s, rotX: tilt * Math.sin(tiltA), rotZ: tilt * Math.cos(tiltA) })));
    if (f.kind !== 'bud') {
      const local = [...podGeometries(rf, { R: 0.036, height: 0.05, holes: 10, detail: false, dried: false }), ...stamenGeometries(rf, { count: 26, rIn: 0.04, rOut: 0.06, up: 0.045, scale: 1 })];
      const m = merge(local.map((g) => g));
      place(m, { pos: [x, topY + 0.03 * s, z], scale: s, rotX: tilt * Math.sin(tiltA), rotZ: tilt * Math.cos(tiltA) });
      misc.push(m);
    }
    misc.push(stemGeometry(root, [x, topY - 0.02, z], 0.0095, stemGreen));
  });

  // --- hero flower -----------------------------------------------------------
  {
    const rh = rng.fork('hero');
    const s = 1.12;
    const tx = 0.2 * Math.sin(0.6), tz = -0.2 * Math.cos(0.6);
    const xf = { pos: hero, scale: s, rotX: -0.16, rotZ: 0.12 };
    petals.push(...flowerPetals(rh, 'open', true).map((g) => place(g, xf)));
    const local = [
      ...podGeometries(rh, { R: 0.044, height: 0.075, holes: 19, detail: true, dried: false }),
      ...stamenGeometries(rh, { count: 78, rIn: 0.047, rOut: 0.072, up: 0.052, scale: 1 }),
    ];
    const m = merge(local);
    place(m, { pos: [hero[0], hero[1], hero[2]], scale: s, rotX: xf.rotX, rotZ: xf.rotZ });
    // Pod top sits a little above the petal bases.
    m.translate(0, 0.045 * s, 0);
    misc.push(m);
    void tx; void tz;
    const root = [hero[0] + 0.25, terrainHeight(hero[0], hero[2]), hero[2] - 0.2];
    misc.push(stemGeometry(root, [hero[0], hero[1] - 0.03, hero[2]], 0.013, stemGreen));
  }

  // --- materials & meshes ------------------------------------------------------
  const leafMap = leafTexture(noise);
  const leafMat = new THREE.MeshStandardMaterial({
    name: 'lotusLeaf', vertexColors: true, map: leafMap, bumpMap: leafMap, bumpScale: 0.04, side: THREE.DoubleSide, roughness: 0.7, metalness: 0,
  });
  const petalMat = new THREE.MeshStandardMaterial({
    name: 'lotusPetal', vertexColors: true, map: petalTexture(noise), side: THREE.DoubleSide, roughness: 0.55, metalness: 0,
    emissive: new THREE.Color(1, 0.55, 0.65), emissiveIntensity: 0.07,
  });
  const miscMat = new THREE.MeshStandardMaterial({ name: 'lotusMisc', vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, metalness: 0 });
  addSway(leafMat, timeUniform, wy, 'leaf');
  addSway(petalMat, timeUniform, wy, 'petal');
  addSway(miscMat, timeUniform, wy, 'misc');

  const mk = (name, list, mat) => {
    const mesh = new THREE.Mesh(merge(list), mat);
    mesh.name = name;
    return mesh;
  };
  const group = new THREE.Group();
  group.add(mk('lotusLeaves', leaves, leafMat), mk('lotusPetals', petals, petalMat), mk('lotusStems', misc, miscMat));
  group.userData.leafCount = placed.length;
  return group;
}
