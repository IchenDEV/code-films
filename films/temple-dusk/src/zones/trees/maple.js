// Japanese maple: seeded branching skeleton (tapered tubes), canopy leaf cards on the
// twig tips, and for the hero maple one long reach branch ending in a detailed,
// backlit leaf cluster at layout.heroMapleLeaves.
import * as THREE from 'three';
import { V3, tube, spline, taper, leafMatrix, clamp01, smooth } from './common.js';
import { heroLeaf } from './leaf.js';

const BARK = new THREE.Color('#5b4c42');
const TWIG = new THREE.Color('#6a3b2e');

// Autumn palette (linear RGB): deep crimson -> scarlet -> orange -> amber -> yellow-green.
const STOPS = [
  new THREE.Color('#753a2f'),
  new THREE.Color('#a54f35'),
  new THREE.Color('#bd6c3b'),
  new THREE.Color('#b98447'),
  new THREE.Color('#a5904b'),
];
const GREEN = new THREE.Color().setRGB(0.40, 0.50, 0.05);

// x in [0, 1) walks the palette.
export function autumn(x, out = new THREE.Color()) {
  const f = clamp01(x) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(f));
  return out.copy(STOPS[i]).lerp(STOPS[i + 1], f - i);
}

// Ginkgo palette: x in [0, 1) walks yellow-green -> gold -> butter yellow -> amber.
const GOLD = [
  new THREE.Color().setRGB(0.42, 0.45, 0.05),
  new THREE.Color().setRGB(0.90, 0.62, 0.04),
  new THREE.Color().setRGB(1.00, 0.78, 0.10),
  new THREE.Color().setRGB(0.88, 0.48, 0.04),
];
export function ginkgoGold(x, out = new THREE.Color()) {
  const f = clamp01(x) * (GOLD.length - 1);
  const i = Math.min(GOLD.length - 2, Math.floor(f));
  return out.copy(GOLD[i]).lerp(GOLD[i + 1], f - i);
}

// Wandering polyline: direction jitters, `up` bends it skyward over the length, `droop` pulls the end down.
function wander(start, dir, length, steps, rng, { jitter = 0.22, up = 0, droop = 0 }) {
  const d = dir.clone().normalize();
  const p = start.clone();
  const pts = [p.clone()];
  for (let i = 1; i <= steps; i++) {
    d.x += rng.gauss() * jitter * 0.5;
    d.z += rng.gauss() * jitter * 0.5;
    d.y += rng.gauss() * jitter * 0.3 + up / steps - droop * (i / steps) * (i / steps) * 2 / steps;
    d.normalize();
    p.addScaledVector(d, length / steps);
    pts.push(p.clone());
  }
  return pts;
}

const perpTo = (d, angle) => {
  const a = Math.abs(d.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
  const u = V3().crossVectors(d, a).normalize();
  const v = V3().crossVectors(d, u);
  return u.multiplyScalar(Math.cos(angle)).addScaledVector(v, Math.sin(angle));
};

// Hero exclusion volume: the camera of shot 10 and the line of sight past the cluster.
function makeHeroKeepOut(layout) {
  const C = V3(...layout.heroMapleLeaves);
  const D = V3(0.9, -0.12, -0.42).normalize();
  const cam = C.clone().addScaledVector(D, 0.85);
  const S = D.clone().negate();
  const q = V3();
  return {
    cam, C, D,
    blocked(p, camRadius = 1.0, rayRadius = 1.0) {
      q.copy(p).sub(cam);
      if (q.length() < camRadius) return true;
      const t = q.dot(S);
      if (t <= 0) return false;
      return q.addScaledVector(S, -t).length() < rayRadius;
    },
  };
}

// ctx collects: bark geometries, canopy leaf instances, hero leaf geometries.
export function buildMaple({ layout, tree, index, rng, ctx }) {
  const hero = !!tree.hero;
  const ginkgo = tree.kind === 'ginkgo';
  const H = tree.height, R = tree.crown;
  const [px, , pz] = tree.position;
  const gy = layout.terrainHeight(px, pz);
  const base = V3(px, gy, pz);
  const keepOut = hero ? makeHeroKeepOut(layout) : null;
  const blockedLocal = (p) => hero && keepOut.blocked(V3(p.x + px, p.y + gy, p.z + pz));

  const branches = [];
  const tips = [];
  const addTip = (p, dir, depth) => tips.push({ p: p.clone(), dir: dir.clone(), depth });

  // Trunk: gentle lean, flared foot, ends in a short leader inside the crown.
  const forkY = H * 0.3;
  const lean = V3(rng.gauss() * 0.12, 1, rng.gauss() * 0.12).normalize();
  const trunkPts = wander(V3(0, -0.3, 0), lean, forkY + H * 0.28 + 0.3, 9, rng, { jitter: 0.1 });
  const trunkR = 0.075 + H * 0.018;
  const trunkRadii = taper(trunkPts.length, trunkR, 0.05, 0.8).map((r, i) => r * (i < 2 ? 1.35 - 0.15 * i : 1));
  branches.push({ pts: trunkPts, radii: trunkRadii, radial: 12, color: BARK });
  const trunkAt = (y) => {
    for (let i = 1; i < trunkPts.length; i++) if (trunkPts[i].y >= y) {
      const t = (y - trunkPts[i - 1].y) / (trunkPts[i].y - trunkPts[i - 1].y);
      return trunkPts[i - 1].clone().lerp(trunkPts[i], t);
    }
    return trunkPts[trunkPts.length - 1].clone();
  };

  // Recursive branching.
  const maxDepth = 4;
  const grow = (start, dir, len, r0, depth, opts = {}) => {
    const steps = depth <= 1 ? 7 : depth === 2 ? 5 : 3;
    let pts = wander(start, dir, len, steps, rng, {
      jitter: 0.16 + depth * 0.07,
      up: opts.up ?? (depth === 1 ? 0.5 : 0.25),
      droop: opts.droop ?? (depth === 1 ? 0.9 : 0.4),
    });
    if (hero) {
      const cut = pts.findIndex((p) => blockedLocal(p));
      if (cut === 0 || cut === 1) return;
      if (cut > 0) pts = pts.slice(0, cut);
    }
    const radii = taper(pts.length, r0, Math.max(0.006, r0 * 0.28), 0.9);
    branches.push({ pts, radii, radial: depth <= 1 ? 8 : depth === 2 ? 6 : 5, color: depth >= 3 ? TWIG : BARK });
    const endDir = pts[pts.length - 1].clone().sub(pts[pts.length - 2]).normalize();
    if (depth >= maxDepth || pts.length < 3) { addTip(pts[pts.length - 1], endDir, depth); return; }
    const nChild = depth === 1 ? 4 : depth === 2 ? 3 : 2;
    for (let c = 0; c < nChild; c++) {
      const t = 0.3 + 0.7 * (c + rng.range(0.1, 0.8)) / nChild;
      const k = Math.max(1, Math.min(pts.length - 1, Math.round(t * (pts.length - 1))));
      const seg = pts[k].clone().sub(pts[k - 1]).normalize();
      const tilt = rng.range(0.7, 1.15);
      const cd = seg.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(perpTo(seg, rng.range(0, 6.283)), Math.sin(tilt));
      cd.y = cd.y * 0.7 + 0.12;
      grow(pts[k], cd, len * rng.range(0.5, 0.66) * (1 - 0.25 * t), radii[k] * 0.62, depth + 1);
    }
    // the parent's own end continues into leaf cover
    addTip(pts[pts.length - 1], endDir, depth);
    if (depth >= 2) addTip(pts[Math.floor(pts.length / 2)], endDir, depth);
  };

  // Main limbs fan out from the top of the trunk; limb 0 of the hero is the reach branch.
  const nLimbs = hero ? 6 : R > 3.6 ? 5 : 4;
  const reachAz = hero ? Math.atan2(layout.heroMapleLeaves[0] - px, -(layout.heroMapleLeaves[2] - pz)) : 0;
  const az0 = hero ? reachAz : rng.range(0, 6.283);
  const limbStart = (i) => trunkAt(forkY * (0.88 + 0.2 * (i % 3) / 2) + 0.15 * i);
  for (let i = hero ? 1 : 0; i < nLimbs; i++) {
    const az = az0 + (i / nLimbs) * 6.283 + rng.range(-0.25, 0.25);
    const elev = ginkgo ? rng.range(0.95, 1.25) : rng.range(0.5, 0.85);
    const dir = V3(Math.sin(az) * Math.cos(elev), Math.sin(elev), -Math.cos(az) * Math.cos(elev));
    const s = limbStart(i);
    grow(s, dir, R * rng.range(1.0, 1.25), trunkR * rng.range(0.4, 0.48), 1);
  }
  // Upper leader branches fill the top of the crown.
  for (let i = 0; i < 3; i++) {
    const az = rng.range(0, 6.283);
    const dir = V3(Math.sin(az) * 0.5, 1, -Math.cos(az) * 0.5);
    grow(trunkAt(forkY + (H * 0.2) * (i + 1) / 3 + 0.4), dir, R * 0.7, trunkR * 0.3, 2, { up: 0.3, droop: 0.3 });
  }

  // ---- hero reach branch and the leaf cluster ------------------------------------------------
  if (hero) buildReach();

  function buildReach() {
    const rel = V3(layout.heroMapleLeaves[0] - px, layout.heroMapleLeaves[1] - gy, layout.heroMapleLeaves[2] - pz);
    const horiz = V3(rel.x, 0, rel.z);
    const dist = horiz.length();
    horiz.normalize();
    const side = V3(-horiz.z, 0, horiz.x);
    const at = (d, y, wob) => horiz.clone().multiplyScalar(d).add(V3(0, y, 0)).addScaledVector(side, wob);
    const ctrl = [
      trunkAt(forkY * 0.95),
      at(0.25, forkY * 0.95 + 0.55, 0).add(V3(trunkPts[0].x, 0, trunkPts[0].z)),
      at(dist * 0.28, 3.55, 0.28),
      at(dist * 0.52, 4.25, -0.22),
      at(dist * 0.78, 4.62, 0.14),
      at(dist, rel.y, 0),
    ];
    const pts = spline(ctrl, 34);
    const radii = taper(pts.length, trunkR * 0.46, 0.0045, 0.75);
    branches.push({ pts, radii, radial: 10, color: BARK });
    // Side twigs along the outer half, with ordinary canopy leaves.
    const nTw = 6;
    for (let k = 0; k < nTw; k++) {
      const t = 0.42 + 0.5 * (k + 0.3) / nTw;
      const i = Math.round(t * (pts.length - 1));
      const seg = pts[i].clone().sub(pts[i - 1]).normalize();
      const sd = k % 2 ? 1 : -1;
      const dir = seg.clone().multiplyScalar(0.55).addScaledVector(side, sd * 0.7).add(V3(0, 0.25 + rng.range(-0.1, 0.2), 0)).normalize();
      grow(pts[i], dir, rng.range(0.7, 1.3), radii[i] * 0.55, 3, { up: 0.2, droop: 0.8 });
    }
    heroCluster(pts);
  }

  function heroCluster(mainPts) {
    const { C, D } = keepOut;
    const Cl = V3(C.x - px, C.y - gy, C.z - pz); // tree-local
    const e1 = V3().crossVectors(D, V3(0, 1, 0)).normalize(); // screen-right (perpendicular to the view)
    const e2 = V3().crossVectors(e1, D).normalize(); // screen-up
    const crng = rng.fork('cluster');
    // Point on the reach branch `back` metres before its end.
    const pointBack = (back) => {
      let left = back;
      for (let i = mainPts.length - 1; i > 0; i--) {
        const d = mainPts[i].distanceTo(mainPts[i - 1]);
        if (left <= d) return mainPts[i].clone().lerp(mainPts[i - 1], left / d);
        left -= d;
      }
      return mainPts[0].clone();
    };
    // Fine twigs leave the last half metre of the branch and fan out to targets around the node.
    const subs = [];
    const nSub = 7;
    for (let k = 0; k < nSub; k++) {
      const back = 0.03 + 0.5 * Math.pow(k / (nSub - 1), 1.1);
      const P = pointBack(back);
      const r = 0.1 + 0.26 * Math.sqrt(crng.next());
      const phi = k * 2.4 + crng.range(-0.3, 0.3);
      const T = Cl.clone().addScaledVector(e1, Math.cos(phi) * r).addScaledVector(e2, Math.sin(phi) * r * 0.85).addScaledVector(D, crng.range(-0.38, 0.0));
      const mid = P.clone().lerp(T, 0.5).add(V3(0, 0.02, 0)).addScaledVector(V3(crng.gauss(), 0, crng.gauss()), 0.02);
      const rad = 0.0085 * (1 - 0.6 * back);
      subs.push({ P, mid, T });
      branches.push({ pts: [P, mid, T], radii: [rad, rad * 0.72, rad * 0.45], radial: 6, color: TWIG });
    }
    // 22 leaves: three or so per twig, colours from deep crimson to yellow-green.
    const palette = [0.0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.58, 0.64, 0.7, 0.1, 0.22, 0.34, 0.84, 0.94];
    const col = new THREE.Color(), colBase = new THREE.Color();
    const nLeaves = 22;
    for (let L = 0; L < nLeaves; L++) {
      const s = subs[L % nSub];
      const along = L < nSub ? 1 : L < 2 * nSub ? 0.62 : 0.8;
      const anchor = s.P.clone().lerp(s.T, along);
      const out = anchor.clone().sub(Cl);
      const petLen = crng.range(0.035, 0.065);
      const radius = crng.range(0.085, 0.125);
      // leaf faces the camera/sun axis with a spread; its tip points outward in the screen plane
      const tilt = crng.range(0.2, 1.0);
      const normal = D.clone().addScaledVector(perpTo(D, crng.range(0, 6.283)), tilt).normalize();
      const flat = e1.clone().multiplyScalar(out.dot(e1)).addScaledVector(e2, out.dot(e2));
      const tip = (flat.lengthSq() > 1e-4 ? flat.normalize() : e2.clone()).addScaledVector(perpTo(D, crng.range(0, 6.283)), 0.7).normalize();
      const bPos = anchor.clone().addScaledVector(tip, petLen).addScaledVector(normal, -petLen * 0.15);
      autumn(palette[L % palette.length] + crng.range(-0.04, 0.04), col);
      colBase.copy(col).lerp(GREEN, 0.3).lerp(STOPS[3], 0.15);
      const g = heroLeaf(radius, col, colBase, { cup: crng.range(0.06, 0.16), droop: crng.range(0.1, 0.26), ripple: crng.range(0.02, 0.05) });
      const m = leafMatrix(bPos, tip, normal, 1);
      g.applyMatrix4(m);
      g.translate(base.x, base.y, base.z);
      ctx.hero.push(g);
      branches.push({ pts: [anchor, anchor.clone().lerp(bPos, 0.5).add(V3(0, -0.004, 0)), bPos], radii: [0.0035, 0.003, 0.0024], radial: 4, color: TWIG });
    }
  }

  // ---- bark geometry ---------------------------------------------------------------------------
  for (const b of branches) {
    const g = tube(b.pts, b.radii, b.radial, b.color, { vScale: 1.4, jitter: 0.16 });
    g.translate(base.x, base.y, base.z);
    ctx.bark.push(g);
  }

  // ---- canopy leaves -----------------------------------------------------------------------------
  const nLeaves = Math.round(1700 * Math.pow(R, 1.5));
  const perTip = Math.max(2, Math.round(nLeaves / Math.max(1, tips.length)));
  const treeBias = rng.range(0.12, 0.38); // some trees run crimson, others orange
  const col = new THREE.Color();
  const p = V3(), tipDir = V3(), nrm = V3();
  const spread = 0.55 + 0.1 * R;
  const lrng = rng.fork('leaves');
  for (const tip of tips) {
    for (let k = 0; k < perTip; k++) {
      // a flattened ball around the tip
      let ux, uy, uz, d2;
      do { ux = lrng.range(-1, 1); uy = lrng.range(-1, 1); uz = lrng.range(-1, 1); d2 = ux * ux + uy * uy + uz * uz; } while (d2 > 1);
      p.set(tip.p.x + ux * spread + tip.dir.x * 0.2, tip.p.y + uy * spread * 0.45 + tip.dir.y * 0.2 + 0.05, tip.p.z + uz * spread + tip.dir.z * 0.2);
      if (p.y < 0.9) continue;
      const wp = V3(p.x + px, p.y + gy, p.z + pz);
      if (hero && keepOut.blocked(wp, 1.1, 1.1)) continue;
      // leaves face up and out; some hang
      nrm.set(lrng.gauss() * 0.7 + layout.sun.dir[0] * 0.9, 1.0 - 0.4 * lrng.next(), lrng.gauss() * 0.7 + layout.sun.dir[2] * 0.9).normalize();
      const a = lrng.range(0, 6.283);
      tipDir.set(Math.cos(a), lrng.gauss() * 0.15, Math.sin(a));
      const s = lrng.range(0.11, 0.18) * (0.9 + 0.06 * R);
      const m = leafMatrix(wp, tipDir, nrm, s);
      const hgt = smooth(0.2, 1.0, (p.y - forkY) / (H - forkY));
      const outer = clamp01(Math.hypot(p.x, p.z) / R);
      let x = treeBias + 0.38 * (hgt - 0.5) + 0.22 * (outer - 0.5) + lrng.gauss() * 0.14;
      if (ginkgo) ginkgoGold(0.35 + 0.6 * (x - treeBias) + lrng.gauss() * 0.12, col);
      else if (lrng.chance(0.045)) autumn(0.97, col).lerp(GREEN, lrng.range(0.2, 0.8));
      else autumn(x, col);
      col.multiplyScalar(lrng.range(0.82, 1.12));
      ctx.leaves.push(m, col.clone());
    }
  }
}
