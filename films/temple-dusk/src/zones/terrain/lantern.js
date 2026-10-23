// Stone lantern (kasuga-doro), about 2.3 m: hexagonal base slab, round bowl,
// banded round shaft, flared platform, hexagonal firebox with carved openings and
// a glowing core, hexagonal roof with curled corner tips, jewel finial. One
// merged geometry, instanced at every lantern foot.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smoothstep, mix3 } from './mesh.js';

const D30 = Math.PI / 6;
const FIRE_Y0 = 1.17, FIRE_Y1 = 1.72;
const FIRE_R = 0.24; // circumradius of the firebox hexagon
const APO = FIRE_R * Math.cos(D30);

// Position and normal only: UVs are projected from the merged shape at the end.
const nonIndexed = (g) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  return out;
};

// Surface of revolution from profile [[r, y], ...] (bottom to top). With hex, r is
// the circumradius of a hexagon whose face 0 looks along +z; every face has its
// own columns (sub + 1 per face) so corners stay crisp while flat faces keep
// vertices to carry weathering. warp(r, y, psi) returns an extra height.
function lathe(profile, { hex = false, sub = 2, seg = 24, warp } = {}) {
  const faces = hex ? 6 : 1;
  const cols = hex ? faces * (sub + 1) : seg;
  const rows = profile.length;
  const pos = new Float32Array(rows * cols * 3);
  const colAngle = (j) => {
    if (!hex) return { phi: (j / seg) * Math.PI * 2, psi: 0, fac: 1 };
    const f = Math.floor(j / (sub + 1)), i = j % (sub + 1);
    const psi = -D30 + (2 * D30 * i) / sub;
    return { phi: f * 2 * D30 + psi, psi, fac: Math.cos(D30) / Math.cos(psi) };
  };
  for (let j = 0; j < cols; j++) {
    const { phi, psi, fac } = colAngle(j);
    for (let k = 0; k < rows; k++) {
      const r = profile[k][0] * fac;
      const y = profile[k][1] + (warp ? warp(profile[k][0], profile[k][1], psi, fac) : 0);
      const o = (k * cols + j) * 3;
      pos[o] = r * Math.sin(phi); pos[o + 1] = y; pos[o + 2] = r * Math.cos(phi);
    }
  }
  const idx = [];
  const next = (j) => {
    if (!hex) return (j + 1) % cols;
    return j % (sub + 1) === sub ? -1 : j + 1;
  };
  for (let k = 0; k < rows - 1; k++) {
    for (let j = 0; j < cols; j++) {
      const j2 = next(j);
      if (j2 < 0) continue;
      const a = k * cols + j, b = k * cols + j2, c = (k + 1) * cols + j, d = (k + 1) * cols + j2;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// Small positional noise, so shared corners move together.
function weather(g, noise, amp, freq, seed) {
  const { valueNoise2 } = noise;
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = valueNoise2(x * freq + y * 3.1, z * freq, seed) - 0.5;
    const b = valueNoise2(y * freq, x * freq + z * 2.3, seed + 7) - 0.5;
    const c = valueNoise2(z * freq + y * 1.7, y * freq - x * 1.1, seed + 13) - 0.5;
    p.setXYZ(i, x + a * amp, y + b * amp, z + c * amp);
  }
}

function finishLathe(g, amp = 0.0035, freq = 38) {
  weather(g, noiseFns, amp, freq, 401);
  g.computeVertexNormals();
  return g;
}

// Extruded panel of the firebox with optional holes, outward face at the apothem.
function panel(face, holes, { lift = 0, depth = 0.04, w = 0.205, h = FIRE_Y1 - FIRE_Y0 - 0.01, bevel = 0.006 } = {}) {
  const s = new THREE.Shape();
  const hw = w / 2 - bevel, hh = h / 2 - bevel;
  s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
  for (const mk of holes) s.holes.push(mk());
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, (FIRE_Y0 + FIRE_Y1) / 2, APO - depth + bevel + lift);
  g.rotateY(face * 2 * D30);
  return nonIndexed(g);
}

const rectHole = (cx, cy, w, h) => () => {
  const p = new THREE.Path();
  p.moveTo(cx - w / 2, cy - h / 2); p.lineTo(cx - w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy - h / 2); p.closePath();
  return p;
};
const circleHole = (cx, cy, r) => () => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };
const crescentHole = (cx, cy, r) => () => {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0.9, Math.PI * 2 - 0.9, false);
  p.absarc(cx + r * 0.42, cy, r * 0.82, Math.PI * 2 - 0.9 - 0.15, 0.9 + 0.15 - Math.PI * 2, true);
  p.closePath();
  return p;
};

let noiseFns;

export function buildLanternGeometry({ noise }) {
  noiseFns = noise;
  const parts = [];
  const add = (g) => parts.push(nonIndexed(g));

  // Hexagonal ground slab, round bowl (inverted-lotus profile), banded shaft.
  add(finishLathe(lathe([[0, 0], [0.41, 0], [0.415, 0.02], [0.41, 0.07], [0.385, 0.09], [0, 0.09]], { hex: true, sub: 4 })));
  add(finishLathe(lathe([[0, 0.09], [0.285, 0.09], [0.31, 0.105], [0.328, 0.14], [0.322, 0.175], [0.29, 0.205], [0.22, 0.228], [0.15, 0.24], [0.118, 0.262], [0.105, 0.285]], { seg: 28 })));
  const shaft = [[0.105, 0.28]];
  const band = (y) => shaft.push([0.097, y - 0.045], [0.112, y - 0.028], [0.12, y - 0.012], [0.12, y + 0.012], [0.112, y + 0.028], [0.097, y + 0.045]);
  band(0.42); band(0.66); band(0.9);
  shaft.push([0.097, 0.93], [0.11, 0.96]);
  add(finishLathe(lathe(shaft, { seg: 24 })));
  // Flared platform (chudai), then the seat of the firebox.
  add(finishLathe(lathe([[0.10, 0.95], [0.15, 0.962], [0.24, 0.99], [0.31, 1.025], [0.335, 1.055], [0.34, 1.085], [0.325, 1.11], [0.31, 1.12], [0, 1.12]], { hex: true, sub: 3 })));
  add(finishLathe(lathe([[0, 1.12], [0.285, 1.12], [0.285, 1.15], [0.268, 1.17], [0, 1.17]], { hex: true, sub: 2 })));
  // Firebox: six corner posts and six panels.
  for (let i = 0; i < 6; i++) {
    const phi = D30 + i * 2 * D30;
    add(new THREE.CylinderGeometry(0.02, 0.02, FIRE_Y1 - FIRE_Y0, 8, 1).translate(FIRE_R * Math.sin(phi), (FIRE_Y0 + FIRE_Y1) / 2, FIRE_R * Math.cos(phi)));
  }
  const cy = 0.01;
  add(panel(0, [rectHole(0, cy, 0.105, 0.3)]));
  add(panel(3, [rectHole(0, cy, 0.105, 0.3)]));
  add(panel(1, [circleHole(0, cy + 0.02, 0.052)]));
  add(panel(4, [crescentHole(-0.01, cy + 0.02, 0.06)]));
  for (const f of [2, 5]) {
    add(panel(f, []));
    // Raised frame on the solid faces.
    add(panel(f, [rectHole(0, 0, 0.13, 0.38)], { lift: 0.008, depth: 0.014, w: 0.17, h: 0.46, bevel: 0.004 }));
  }
  // Roof: thick eave edge, concave top, hips lifting toward the corner tips.
  const hip = (r, y, psi) => {
    const corner = Math.pow(Math.abs(psi) / D30, 4);
    const out = r / 0.67;
    return (0.02 * corner * out + 0.05 * corner * Math.pow(out, 5)) * (y > 1.76 ? 1 : 0.5);
  };
  add(finishLathe(lathe([
    [0.2, 1.76], [0.3, 1.766], [0.5, 1.785], [0.64, 1.806], [0.67, 1.815], [0.675, 1.845], [0.66, 1.865],
    [0.6, 1.873], [0.52, 1.89], [0.44, 1.915], [0.35, 1.955], [0.27, 1.995], [0.2, 2.03], [0.14, 2.055], [0.1, 2.07], [0, 2.075],
  ], { hex: true, sub: 6, warp: hip }), 0.003, 30));
  add(finishLathe(lathe([[0, 1.72], [0.3, 1.72], [0.31, 1.735], [0.3, 1.755], [0, 1.76]], { hex: true, sub: 2 })));
  // Curled corner tips (warabite): a spiral tube off each roof corner.
  for (let i = 0; i < 6; i++) {
    const phi = D30 + i * 2 * D30;
    const pts = [];
    const r0 = 0.675, y0 = 1.93;
    for (let t = 0; t <= 1.0001; t += 0.07) {
      const th = -2.0 + t * 7.6;
      const rad = 0.075 - 0.055 * t;
      pts.push(new THREE.Vector3((r0 + 0.045) + rad * Math.cos(th), y0 + 0.052 + rad * Math.sin(th) * 1.0, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 26, 0.013, 6, false);
    g.rotateY(phi - Math.PI / 2);
    add(g);
  }
  // Jewel finial on a lotus collar.
  add(finishLathe(lathe([[0, 2.07], [0.1, 2.07], [0.118, 2.085], [0.122, 2.1], [0.098, 2.118], [0.066, 2.125], [0.05, 2.135], [0.066, 2.148], [0.088, 2.175], [0.092, 2.2], [0.076, 2.232], [0.046, 2.262], [0.016, 2.287], [0, 2.305]], { seg: 20 }), 0.0015, 60));

  const geo = mergeGeometries(parts, false);
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const col = new Float32Array(p.count * 3);
  const { fbm2 } = noise;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    if (Math.abs(ny) > 0.7) { uv[i * 2] = x; uv[i * 2 + 1] = z; } else if (Math.abs(nx) > Math.abs(nz)) { uv[i * 2] = z; uv[i * 2 + 1] = y; } else { uv[i * 2] = x; uv[i * 2 + 1] = y; }
    // Grey granite, patchy; moss climbs from the base and settles on upward faces.
    const grain = 0.86 + 0.26 * fbm2(x * 14, y * 14 + z * 9, 3, 411);
    const patch = fbm2(x * 7 + z * 3, y * 6, 3, 412);
    const low = smoothstep(0.75, 0.05, y);
    const up = Math.max(0, ny);
    const moss = Math.min(1, low * smoothstep(0.38, 0.62, patch) * 1.1 + up * smoothstep(0.55, 0.72, patch) * 0.65);
    const lichen = smoothstep(0.66, 0.8, fbm2(x * 22, y * 22 + z * 5, 2, 413)) * 0.25;
    let c = mix3([grain, grain, grain * 0.96], [0.36, 0.46, 0.2], moss * 0.85);
    c = mix3(c, [0.78, 0.8, 0.62], lichen);
    // Soot-dark stain below the roof and inside the openings.
    const cavity = Math.hypot(x, z) < 0.2 && y > FIRE_Y0 && y < FIRE_Y1 ? 1 : 0;
    c = mix3(c, [0.18, 0.17, 0.16], cavity * 0.6);
    col.set(c, i * 3);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// The glowing core inside the firebox.
export function buildGlowGeometry() {
  const g = new THREE.CapsuleGeometry(0.06, 0.22, 4, 12);
  g.translate(0, (FIRE_Y0 + FIRE_Y1) / 2 + 0.0, 0);
  return g;
}
