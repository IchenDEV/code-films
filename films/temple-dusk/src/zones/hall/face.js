// The Buddha's head: a superellipsoid skull with a modelled face (nose, lips,
// brow, chin in the mesh; eyelids, lip lines and nostrils in a normal map;
// painted brows, eyes and lips in a colour map), snail-shell curls (螺髪) on
// the cranium and ushnisha, long pierced ears and the urna.
//
// Head-local frame: origin at the head centre, +Y up, +Z the way the face looks.
// Face coordinates (x, v): x to the viewer's right, v up from the face centre.

import * as THREE from 'three';
import { lathe, clamp, smooth } from './kit.js';

export const HEAD = {
  rx: 0.33, ry: 0.46, rz: 0.375,
  exp: 2.3,
  // Face centre relative to the head centre (v = 0 at the face centre).
  faceDy: -0.17,
  faceZ: 0.38,
  texSpan: 0.8, // metres covered by the face textures
};

// Gaussian bumps, cut to zero beyond 3 sigma (a large share of pixels skip the exp).
const g1 = (d, s) => (Math.abs(d) > 3 * s ? 0 : Math.exp(-(d * d) / (s * s)));
const g2 = (dx, dy, sx, sy) => {
  if (Math.abs(dx) > 3 * sx || Math.abs(dy) > 3 * sy) return 0;
  return Math.exp(-((dx * dx) / (sx * sx) + (dy * dy) / (sy * sy)));
};

function table(pts, v) {
  if (v <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][0]) {
      const [a, fa] = pts[i - 1], [b, fb] = pts[i];
      const t = (v - a) / (b - a);
      const s = t * t * (3 - 2 * t);
      return fa + (fb - fa) * s;
    }
  }
  return pts[pts.length - 1][1];
}
// Tables are given with descending v; reverse for the lookup.
const NOSE_H = [[-0.1, 0], [-0.085, 0.006], [-0.065, 0.034], [-0.05, 0.052], [-0.03, 0.044], [0, 0.03], [0.05, 0.017], [0.11, 0.006], [0.15, 0]];
const NOSE_W = [[-0.1, 0.02], [-0.07, 0.034], [-0.05, 0.04], [-0.03, 0.034], [0, 0.026], [0.14, 0.018], [0.2, 0.02]];

const EYE_X = 0.108, EYE_Y = 0.092, EYE_HALF = 0.06;
const MOUTH_Y = -0.145;

// Face fields. geo: smooth outward displacement (mesh). fine: high-frequency height (normal map only).
// ink: painted weights (brow, eye, lip, lipLine).
export function faceFields(x, v, out) {
  const ax = Math.abs(x);
  let geo = 0, fine = 0, brow = 0, eye = 0, lip = 0, lipLine = 0;

  // Nose.
  const nh = table(NOSE_H, v), nw = table(NOSE_W, v);
  geo += nh * g1(x, nw);
  geo += 0.012 * g2(ax - 0.042, v + 0.052, 0.022, 0.022);
  fine -= 0.012 * g2(ax - 0.021, v + 0.073, 0.009, 0.007);

  // Cheeks and chin.
  geo += 0.016 * g2(ax - 0.15, v + 0.05, 0.085, 0.12);
  geo += 0.016 * g2(x, v + 0.215, 0.07, 0.04);
  fine -= 0.006 * g2(x, v + 0.172, 0.05, 0.008);

  // Brow ridge and painted brow.
  const bx = clamp(ax / 0.22, 0, 1);
  const yb = 0.15 + 0.032 * Math.sin(Math.PI * bx);
  const bFade = smooth(0.0, 0.03, ax) * (1 - smooth(0.17, 0.225, ax));
  geo += 0.012 * g1(v - yb, 0.026) * bFade;
  const bThick = 0.0075 + 0.0045 * Math.sin(Math.PI * bx);
  brow = g1(v - yb - 0.004, bThick) * bFade;
  fine += 0.003 * g1(v - yb - 0.004, bThick * 1.4) * bFade;

  // Eyes: downcast, half-closed.
  const ex = ax - EYE_X;
  const win = Math.max(0, 1 - Math.abs(ex / EYE_HALF) ** 4);
  const ys = EYE_Y + 0.013 * (1 - (ex / EYE_HALF) ** 2) + 0.004 * (ex / EYE_HALF);
  fine -= 0.011 * g1(v - ys, 0.0075) * win;
  fine += 0.0065 * g1(v - (ys + 0.016), 0.012) * win;
  geo += 0.004 * g2(ex, v - EYE_Y, 0.07, 0.04);
  geo -= 0.011 * g2(ax - 0.075, v - 0.1, 0.04, 0.05); // inner canthus hollow
  eye = Math.min(1, g1(v - ys, 0.0055) * win + 0.55 * g1(v - (ys + 0.011), 0.0035) * win);

  // Mouth: small, closed, with the corners lifted a little.
  const mw = Math.max(0, 1 - (ax / 0.072) ** 3);
  const ym = MOUTH_Y + 0.014 * (ax / 0.07) ** 2;
  fine -= 0.009 * g1(v - ym, 0.0065) * mw;
  geo += 0.008 * g1(v - (ym + 0.013), 0.014) * mw;
  geo += 0.011 * g1(v - (ym - 0.018), 0.017) * mw;
  fine -= 0.0035 * g1(x, 0.006) * g1(v - (ym + 0.035), 0.03);
  lip = 0.75 * g1(v - (ym - 0.004), 0.021) * mw;
  lipLine = g1(v - ym, 0.0042) * mw;

  out.geo = geo; out.fine = fine; out.brow = brow; out.eye = eye; out.lip = lip; out.lipLine = lipLine;
  return out;
}

// Superellipsoid surface point for a unit direction; returns x, y, z (head-local, before the face relief).
function surfacePoint(nx, ny, nz, out) {
  const p = HEAD.exp;
  const k = (Math.abs(nx) ** p + Math.abs(ny) ** p + Math.abs(nz) ** p) ** (1 / p);
  let x = (nx / k) * HEAD.rx, y = (ny / k) * HEAD.ry, z = (nz / k) * HEAD.rz;
  // Jaw taper: the lower face narrows toward the chin.
  const t = clamp((-y - 0.05) / 0.41, 0, 1);
  x *= 1 - 0.3 * t ** 1.2;
  z *= 1 - 0.08 * t;
  out.x = x; out.y = y; out.z = z;
  return out;
}

// Face textures: sRGB colour map (painted ink) and a tangent-space normal map.
function faceTextures() {
  const N = 768, span = HEAD.texSpan;
  const col = new Uint8Array(N * N * 4);
  const height = new Float32Array(N * N);
  const f = {};
  for (let j = 0; j < N; j++) {
    const v = ((j + 0.5) / N - 0.5) * span;
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N - 0.5) * span;
      faceFields(x, v, f);
      height[j * N + i] = f.fine;
      const dark = Math.min(1, f.brow * 0.35 + f.eye * 0.8 + f.lipLine * 0.5);
      // Lips take a warmer, redder gilt tone.
      const r = 1 - 0.0 * dark, gC = 1 - 0.33 * f.lip, b = 1 - 0.55 * f.lip;
      const k = (j * N + i) * 4;
      const inkTint = 0.07 + 0.93 * (1 - dark);
      col[k] = Math.round(255 * clamp(r * inkTint, 0, 1));
      col[k + 1] = Math.round(255 * clamp(gC * inkTint, 0, 1));
      col[k + 2] = Math.round(255 * clamp(b * inkTint * (1 - 0.0), 0, 1));
      col[k + 3] = 255;
    }
  }
  const nrm = new Uint8Array(N * N * 4);
  const px = span / N;
  const strength = 1.0;
  const H = (i, j) => height[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * px);
      const dy = (H(i, j + 1) - H(i, j - 1)) / (2 * px);
      let nx = -dx * strength, ny = -dy * strength, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const k = (j * N + i) * 4;
      nrm[k] = Math.round(255 * (nx * 0.5 + 0.5));
      nrm[k + 1] = Math.round(255 * (ny * 0.5 + 0.5));
      nrm[k + 2] = Math.round(255 * (nz * 0.5 + 0.5));
      nrm[k + 3] = 255;
    }
  }
  const mk = (data, srgb) => {
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  return { map: mk(col, true), normal: mk(nrm, false) };
}

// Deterministic point of the unit sphere i of n (Fibonacci lattice).
function fib(i, n) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(1 - y * y);
  const a = i * 2.399963229728653;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

// Curl geometry: a squat snail-shell dome, unit radius, pole along +Y.
function curlGeometry() {
  return lathe([[0.001, -0.25], [0.9, -0.25], [1.0, 0.02], [0.92, 0.38], [0.72, 0.6], [0.5, 0.66], [0.38, 0.84], [0.001, 1.0]], 9);
}

// Hairline: v above which the hair starts, as a function of x (face coordinates).
const hairline = (x) => 0.37 - 0.17 * Math.min(1, Math.abs(x) / 0.3) ** 2;

export function buildHead({ origin, rng, mats }) {
  const group = new THREE.Group();
  group.name = 'buddha-head';
  group.position.set(origin[0], origin[1], origin[2]);
  const tex = faceTextures();

  // --- Skull and face -------------------------------------------------------
  const geo = new THREE.SphereGeometry(1, 192, 128);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const colr = new Float32Array(pos.count * 3);
  const P = {}, f = {};
  const faceCy = HEAD.faceDy;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i), ny = pos.getY(i), nz = pos.getZ(i);
    surfacePoint(nx, ny, nz, P);
    const v = P.y - faceCy;
    // Face relief fades out toward the sides and back of the head.
    const front = smooth(0.1, 0.42, nz) * (1 - smooth(0.72, 0.95, Math.abs(P.x) / HEAD.rx));
    let d = 0;
    if (nz > 0.05 && v > -0.4 && v < 0.5) {
      faceFields(P.x, v, f);
      d = f.geo * front;
    }
    const len = Math.hypot(nx / HEAD.rx, ny / HEAD.ry, nz / HEAD.rz);
    const ox = nx / HEAD.rx / len, oy = ny / HEAD.ry / len, oz = nz / HEAD.rz / len;
    pos.setXYZ(i, P.x + ox * d, P.y + oy * d, P.z + oz * d);
    if (nz > 0.05) {
      uv[i * 2] = 0.5 + P.x / HEAD.texSpan;
      uv[i * 2 + 1] = 0.5 + v / HEAD.texSpan;
    } else {
      uv[i * 2] = -2; uv[i * 2 + 1] = -2;
    }
    // Hair region tint: dark blue-black above the hairline, around the sides and the back.
    const hairFront = smooth(-0.015, 0.015, v - hairline(P.x));
    const hairSide = smooth(-0.12, -0.06, P.y);
    const hairW = hairSide + (hairFront - hairSide) * smooth(0.2, 0.4, nz);
    const c = 1 - hairW;
    colr[i * 3] = 0.42 + 0.58 * c; colr[i * 3 + 1] = 0.33 + 0.67 * c; colr[i * 3 + 2] = 0.22 + 0.78 * c;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  geo.computeVertexNormals();
  const skin = mats.skin.clone();
  skin.map = tex.map;
  skin.normalMap = tex.normal;
  skin.normalScale = new THREE.Vector2(1.4, 1.4);
  skin.emissiveMap = tex.map;
  skin.vertexColors = true;
  const head = new THREE.Mesh(geo, skin);
  head.name = 'head';
  group.add(head);

  // --- Ears -----------------------------------------------------------------
  // Long, fleshy earlobes: a tapered capsule hanging from a flattened upper ear,
  // set close against the head.
  const upper = new THREE.SphereGeometry(1, 20, 14);
  upper.scale(0.03, 0.085, 0.06);
  const lobe = new THREE.CapsuleGeometry(1, 2.2, 6, 16);
  {
    const p = lobe.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = (y + 2.1) / 4.2; // 0 bottom .. 1 top
      const w = 0.95 - 0.35 * t; // fuller at the bottom
      p.setXYZ(i, p.getX(i) * 0.034 * w, y * 0.062, p.getZ(i) * 0.052 * w);
    }
    lobe.computeVertexNormals();
  }
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    const top = new THREE.Mesh(upper, mats.skin);
    top.position.set(0, 0.06, 0);
    const hang = new THREE.Mesh(lobe, mats.skin);
    hang.position.set(0, -0.12, 0.004);
    ear.add(top, hang);
    ear.position.set(side * 0.275, HEAD.faceDy + 0.03, -0.035);
    ear.rotation.set(0, -side * 0.25, side * 0.06);
    ear.name = 'ear';
    group.add(ear);
  }

  // --- Urna: a pearl on the forehead at x = 0 -----------------------------------------------
  const urnaY = 0.265 + faceCy;
  const urnaZ = HEAD.rz * (1 - Math.abs(urnaY / HEAD.ry) ** HEAD.exp) ** (1 / HEAD.exp);
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12), mats.pearl);
  urna.position.set(0, urnaY, urnaZ + 0.004);
  urna.name = 'urna';
  group.add(urna);

  // --- Ushnisha and its jewel ------------------------------------------------------------------
  const ush = { cy: 0.4, rx: 0.2, ry: 0.21, rz: 0.2, cz: -0.03 };
  const ushMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mats.hair);
  ushMesh.scale.set(ush.rx, ush.ry, ush.rz);
  ushMesh.position.set(0, ush.cy, ush.cz);
  ushMesh.name = 'ushnisha';
  group.add(ushMesh);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), mats.pearl);
  jewel.scale.set(1, 1.15, 1);
  jewel.position.set(0, ush.cy + ush.ry + 0.02, ush.cz);
  jewel.name = 'jewel';
  group.add(jewel);

  // --- Curls ----------------------------------------------------------------------------
  const curls = [];
  const cg = curlGeometry();
  const rr = rng.fork('curls');
  const candidates = 1350;
  for (let i = 0; i < candidates; i++) {
    const [nx, ny, nz] = fib(i, candidates);
    surfacePoint(nx, ny, nz, P);
    const v = P.y - faceCy;
    let inHair;
    if (nz > 0.3) inHair = v > hairline(P.x) + 0.012;
    else inHair = P.y > -0.06 && !(Math.abs(P.x) > 0.22 && Math.abs(P.z) < 0.09 && P.y < 0.12); // keep the ear zone free
    if (!inHair) continue;
    const n = new THREE.Vector3(P.x / HEAD.rx ** 2, P.y / HEAD.ry ** 2, P.z / HEAD.rz ** 2).normalize();
    curls.push({ p: new THREE.Vector3(P.x, P.y, P.z), n, s: 0.0245 });
  }
  // Ushnisha curls.
  const nU = 300;
  for (let i = 0; i < nU; i++) {
    const [nx, ny, nz] = fib(i, nU);
    if (ny < 0.12) continue;
    const p = new THREE.Vector3(nx * ush.rx, ny * ush.ry, nz * ush.rz);
    const n = new THREE.Vector3(nx / ush.rx, ny / ush.ry, nz / ush.rz).normalize();
    curls.push({ p: p.add(new THREE.Vector3(0, ush.cy, ush.cz)), n, s: 0.0225 });
  }
  const inst = new THREE.InstancedMesh(cg, mats.hair, curls.length);
  inst.name = 'curls';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  curls.forEach((c, i) => {
    q.setFromUnitVectors(up, c.n);
    qy.setFromAxisAngle(up, rr.range(0, Math.PI * 2));
    q.multiply(qy);
    const pp = c.p.clone().addScaledVector(c.n, c.s * 0.35);
    m4.compose(pp, q, new THREE.Vector3(c.s, c.s * 0.9, c.s));
    inst.setMatrixAt(i, m4);
  });
  inst.instanceMatrix.needsUpdate = true;
  inst.userData.noCastShadow = true;
  group.add(inst);

  return { group, curlCount: curls.length };
}

// Where the face centre (nose bridge, v = 0) lies relative to the head centre: [y, z].
export function faceCentreLocal() {
  const y = HEAD.faceDy;
  const taper = clamp((-y - 0.05) / 0.41, 0, 1);
  const base = HEAD.rz * (1 - Math.abs(y / HEAD.ry) ** HEAD.exp) ** (1 / HEAD.exp) * (1 - 0.08 * taper);
  const f = {};
  faceFields(0, 0, f);
  return [y, base + f.geo];
}
