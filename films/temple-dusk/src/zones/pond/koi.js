// Koi: one InstancedMesh. Body, fins, eyes and barbels are a single merged geometry in a local frame
// (+X forward, nose at x = 0.5, tail tip at x ~ -0.68). Swimming (undulation, fin flap, turning bend)
// runs in the vertex shader; the colour pattern (kohaku, sanke, showa, ogon, asagi) is procedural in the
// fragment shader from body-local position. Positions are a pure function of film time t.

import * as THREE from 'three';
import { surface, tube, tinted, merge, smooth } from './util.js';

const TAU = Math.PI * 2;

// Type codes used by the shader.
const KOHAKU = 0, SANKE = 1, SHOWA = 2, OGON = 3, ASAGI = 4;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const X_NOSE = 0.5, X_TAIL = -0.38; // body span; the tail fin continues past X_TAIL
const H_MAX = 0.122, W_MAX = 0.104; // body half-height / half-width at the widest point

// Body cross-section at x: centre height c, half-height h, half-width w.
function bodyAt(x) {
  const s = Math.min(1, Math.max(0, (X_NOSE - x) / (X_NOSE - X_TAIL)));
  let fh, fw;
  if (s < 0.34) {
    const q = (0.34 - s) / 0.34;
    fh = Math.sqrt(Math.max(0, 1 - q ** 2.2));
    fw = Math.sqrt(Math.max(0, 1 - q ** 2.0)) * (0.9 + 0.1 * (1 - q));
  } else {
    const q = (s - 0.34) / 0.66;
    fh = 0.2 + 0.8 * (1 - q ** 1.55);
    fw = 0.1 + 0.9 * (1 - q ** 1.35);
  }
  // Back rises behind the head (the shoulder hump), belly stays low and soft.
  const c = 0.012 * smooth(0.08, 0.3, s) * (1 - smooth(0.4, 0.9, s)) - 0.006 * (1 - smooth(0, 0.2, s));
  return { s, c, h: H_MAX * fh, w: W_MAX * fw };
}

function bodyGeometry(detail) {
  const NS = detail ? 54 : 30, NA = detail ? 24 : 14;
  const g = surface(NS, NA, (i, j, o) => {
    const u = i / NS;
    const s = 0.5 - 0.5 * Math.cos(Math.PI * u); // rings crowd at nose and tail
    const x = X_NOSE - s * (X_NOSE - X_TAIL);
    const b = bodyAt(x);
    const a = (j / NA) * TAU;
    const sn = Math.sin(a), cs = Math.cos(a);
    const ex = 2.5;
    let y = Math.sign(sn) * Math.abs(sn) ** (2 / ex);
    const z = Math.sign(cs) * Math.abs(cs) ** (2 / ex);
    if (y < 0) y *= 0.86; else y *= 1 + 0.05 * smooth(0.1, 0.35, s) * (1 - smooth(0.5, 0.9, s));
    // The mouth end is a little flatter on top.
    const head = 1 - smooth(0.0, 0.2, s);
    o.p = [x, b.c + b.h * y * (1 - 0.1 * head * Math.max(0, y)), b.w * z];
    o.uv = [s, a / TAU];
  }, { wrap: true, flap: true });
  return g;
}

// Radial fan fin: root, primary axis, spread angle, length. aFlap = distance fraction from the root.
function fanFin({ root, axis, across, L, half, tipRound = 0.25, ripple = 0.006, droop = 0.05, detail }) {
  const nu = detail ? 6 : 3, nv = detail ? 10 : 5;
  const ax = new THREE.Vector3(...axis).normalize();
  const ac = across ? new THREE.Vector3(...across).normalize() : new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize();
  return surface(nu, nv, (i, j, o) => {
    const t = i / nu, a = (j / nv * 2 - 1) * half;
    const len = L * (1 - tipRound * (a / half) ** 2) * (1 + 0.1 * Math.cos(a * 5));
    const r = t * len;
    const p = new THREE.Vector3(...root).addScaledVector(ax, r * Math.cos(a)).addScaledVector(ac, r * Math.sin(a));
    p.y += ripple * Math.sin(t * 17 + a * 4) * t - droop * r * r / L;
    o.p = [p.x, p.y, p.z];
    o.f = t;
    o.uv = [j / nv, t];
  }, { flap: true });
}

function dorsalFin(detail) {
  const nu = detail ? 5 : 3, nv = detail ? 12 : 6;
  return surface(nu, nv, (i, j, o) => {
    const v = i / nu, a = j / nv;
    const xb = 0.13 - 0.33 * a;
    const base = bodyAt(xb);
    const H = 0.015 + 0.15 * (1 - a) ** 1.3 * (0.6 + 0.4 * smooth(0, 0.25, a));
    o.p = [xb - 0.09 * v * (1 - a) , base.c + base.h * 0.93 + v * H, 0.004 * Math.sin(v * 5 + a * 6) * v];
    o.f = v;
    o.uv = [a, v];
  }, { flap: true });
}

function tailFin(detail) {
  const nu = detail ? 10 : 5, nv = detail ? 14 : 7;
  return surface(nu, nv, (i, j, o) => {
    const t = i / nu, jj = (j / nv) * 2 - 1;
    const L = 0.30, fork = 0.62 + 0.38 * Math.abs(jj) ** 1.1;
    const half = 0.034 + 0.15 * Math.sin(Math.min(1, t * 1.15) * Math.PI / 2) ** 1.2 * (0.55 + 0.45 * t);
    // The fin trails in a loose twist, so it also reads from above.
    const roll = 0.35 + 0.8 * t;
    const yy = jj * half * (1 + 0.05 * Math.cos(jj * 6)), zz = 0.012 * Math.sin(jj * 5 + t * 4) * t;
    o.p = [X_TAIL + 0.02 - t * L * fork, yy * Math.cos(roll) - zz * Math.sin(roll), yy * Math.sin(roll) + zz * Math.cos(roll)];
    o.f = t;
    o.uv = [j / nv, t];
  }, { flap: true });
}

function finish(g, part, flap = 0) {
  const n = g.attributes.position.count;
  if (!g.attributes.aFlap) g.setAttribute('aFlap', new THREE.BufferAttribute(new Float32Array(n).fill(flap), 1));
  g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(n).fill(part), 1));
  return g;
}

function koiGeometry(detail) {
  const parts = [finish(bodyGeometry(detail), 0)];
  const white = [1, 1, 1];
  // Pectoral fins, behind the gills on both sides.
  const bp = bodyAt(0.25);
  for (const side of [-1, 1]) {
    parts.push(finish(fanFin({
      root: [0.25, bp.c - bp.h * 0.5, side * (bp.w * 0.8)],
      axis: [-0.8, -0.34, side * 0.5], L: 0.21, half: 0.5, droop: 0.1, detail,
    }), 4));
    const bq = bodyAt(0.0);
    parts.push(finish(fanFin({
      root: [0.0, bq.c - bq.h * 0.85, side * bq.w * 0.4],
      axis: [-0.8, -0.5, side * 0.32], L: 0.12, half: 0.55, droop: 0.05, detail,
    }), 4));
  }
  const ba = bodyAt(-0.22);
  parts.push(finish(fanFin({
    root: [-0.22, ba.c - ba.h * 0.9, 0], axis: [-0.55, -0.85, 0], L: 0.10, half: 0.5, droop: 0, detail,
  }), 1));
  parts.push(finish(dorsalFin(detail), 1));
  parts.push(finish(tailFin(detail), 1));
  // Eyes, set on the sides of the head.
  const be = bodyAt(0.375);
  for (const side of [-1, 1]) {
    const eye = tinted(new THREE.SphereGeometry(0.0155, detail ? 10 : 6, detail ? 8 : 4), white);
    eye.scale(1, 1, 0.8);
    eye.translate(0.375, be.c + be.h * 0.28, side * (be.w * 0.86));
    parts.push(finish(eye, 2));
  }
  // Two pairs of barbels at the mouth.
  const bm = bodyAt(0.485);
  for (const side of [-1, 1]) {
    const t = tube([[0.488, bm.c - bm.h * 0.12, side * 0.02], [0.51, bm.c - bm.h * 0.2, side * 0.04], [0.52, bm.c - bm.h * 0.38, side * 0.05]], (s) => 0.0035 * (1 - 0.6 * s), () => white, 4);
    parts.push(finish(t, 3));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

const VERT_HEAD = /* glsl */ `
attribute vec4 aKoi;    // type, seed, tint, phase
attribute vec4 aMotion; // omega, amplitude, bend
attribute float aPart;
attribute float aFlap;
uniform float uKoiTime;
varying vec4 vKoi;
varying vec3 vLocal;
varying float vPart;
varying float vFlap;
varying vec2 vKUv;

float koiPhase() { return uKoiTime * aMotion.x + aKoi.w; }
float koiU(float x) { return clamp((0.42 - x) / 0.95, 0.0, 1.25); }
float koiZ(vec3 p) {
  float u = koiU(p.x);
  float u2 = u * u;
  float w = sin(koiPhase() - 4.4 * u) * aMotion.y * (0.06 + 0.94 * u2);
  return w + aMotion.z * u2 * 0.34;
}
`;

const VERT_NORMAL = /* glsl */ `
#include <beginnormal_vertex>
{
  float dz = (koiZ(position + vec3(0.01, 0.0, 0.0)) - koiZ(position - vec3(0.01, 0.0, 0.0))) / 0.02;
  objectNormal = normalize(vec3(objectNormal.x - dz * objectNormal.z, objectNormal.y, objectNormal.z + dz * objectNormal.x));
}
`;

const VERT_BEGIN = /* glsl */ `
#include <begin_vertex>
vLocal = position;
vKoi = aKoi;
vPart = aPart;
vFlap = aFlap;
vKUv = uv;
{
  float ph = koiPhase();
  float u = koiU(position.x);
  if (aPart > 3.5) {
    float side = position.z >= 0.0 ? 1.0 : -1.0;
    float f = sin(ph * 1.6 + position.x * 5.0 + (side > 0.0 ? 0.0 : 1.2));
    transformed.y += f * aFlap * 0.028;
    transformed.z += side * (0.5 + 0.5 * f) * aFlap * 0.03;
  } else if (aPart > 0.5 && aPart < 1.5) {
    transformed.z += aFlap * aFlap * 0.022 * sin(ph * 1.2 + 9.0 * position.y - 6.0 * u);
  }
  transformed.z += koiZ(position);
}
`;

const FRAG_HEAD = /* glsl */ `
varying vec4 vKoi;
varying vec3 vLocal;
varying float vPart;
varying float vFlap;
varying vec2 vKUv;

float k31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float kn3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(k31(i), k31(i + vec3(1,0,0)), f.x), mix(k31(i + vec3(0,1,0)), k31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(k31(i + vec3(0,0,1)), k31(i + vec3(1,0,1)), f.x), mix(k31(i + vec3(0,1,1)), k31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float kfbm(vec3 p) { return (0.5 * kn3(p) + 0.25 * kn3(p * 2.03 + 7.1) + 0.125 * kn3(p * 4.1 + 3.7) + 0.0625 * kn3(p * 8.3 + 1.3)) / 0.9375; }
vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
`;

const FRAG_COLOR = /* glsl */ `
float koiMetal = 0.0;
float koiRough = 0.32;
{
  float type = vKoi.x + 0.5;
  vec3 so = vec3(vKoi.y * 13.7, vKoi.y * 7.3, vKoi.y * 3.1);
  vec3 L = vLocal;
  vec3 col;
  if (vPart > 1.5 && vPart < 2.5) {
    // Eye: black pupil ring in a pale gold iris.
    col = srgb(vec3(0.04, 0.035, 0.03));
    koiRough = 0.1;
  } else if (vPart > 2.5 && vPart < 3.5) {
    col = srgb(vec3(0.85, 0.75, 0.5));
  } else {
    float dors = clamp(L.y / 0.105, -1.0, 1.0);
    // Scales: an overlapping lattice running along the body and around it.
    float a = L.x * 64.0;
    float b = atan(L.z, L.y) * 17.0 + 0.5 * mod(floor(a), 2.0);
    vec2 cell = fract(vec2(a, b)) - 0.5;
    float scale = 1.0 - 0.055 * smoothstep(0.28, 0.62, length(cell * vec2(1.0, 0.8)));
    float patchField = kfbm(vec3(L.x * 2.9, L.y * 6.5, L.z * 6.5) + so) + 0.14 * dors - 0.04;
    float head = smoothstep(0.30, 0.40, L.x);
    vec3 white = srgb(vec3(0.95, 0.93, 0.89));
    vec3 red = mix(srgb(vec3(0.90, 0.20, 0.07)), srgb(vec3(0.97, 0.33, 0.10)), kn3(L * 9.0 + so));
    vec3 black = srgb(vec3(0.045, 0.045, 0.05));
    float vk = vKoi.x;
    if (type < 1.0) {
      // kohaku: red patches on white, crisp edges; sometimes the head is red
      float r = smoothstep(0.585, 0.605, patchField + head * (vKoi.z - 0.45) * 0.5);
      col = mix(white, red, r);
    } else if (type < 2.0) {
      // sanke: kohaku plus small black patches on the back
      float r = smoothstep(0.55, 0.57, patchField);
      float k = smoothstep(0.64, 0.66, kfbm(vec3(L.x * 4.5, L.y * 9.0, L.z * 9.0) + so * 1.7 + 11.0) + 0.3 * dors) * (1.0 - head * 0.9);
      col = mix(mix(white, red, r), black, k);
    } else if (type < 3.0) {
      // showa: black body with red and white patches, black head
      float r = smoothstep(0.52, 0.54, patchField);
      float w = smoothstep(0.60, 0.62, kfbm(vec3(L.x * 3.6, L.y * 8.0, L.z * 8.0) + so * 0.6 + 5.0) - 0.15 * dors);
      col = mix(black, red, r);
      col = mix(col, white, w * (1.0 - r) * (1.0 - head * 0.55));
      col = mix(col, black, 0.6 * head * (1.0 - r));
    } else if (type < 4.0) {
      // ogon: metallic gold (a few are the orange yamabuki)
      vec3 gold = mix(srgb(vec3(0.82, 0.60, 0.16)), srgb(vec3(0.88, 0.42, 0.10)), vKoi.z);
      col = gold * (0.88 + 0.2 * kn3(L * 11.0 + so)) * (1.0 + 0.2 * dors);
      koiMetal = 0.85;
      koiRough = 0.28;
    } else {
      // asagi: blue-grey netted back, red-orange belly and cheeks
      vec3 blue = srgb(vec3(0.20, 0.31, 0.46));
      float net = smoothstep(0.30, 0.55, length(cell * vec2(1.0, 0.8)));
      vec3 back = mix(blue, srgb(vec3(0.62, 0.70, 0.78)), net * 0.55);
      float belly = smoothstep(0.1, -0.35, dors + 0.35 * (kn3(vec3(L.x * 4.0, 0.0, 0.0) + so) - 0.5));
      float cheek = smoothstep(0.12, 0.34, L.x) * smoothstep(0.55, 0.1, dors);
      col = mix(back, red, max(belly, cheek * 0.8));
    }
    col *= scale * 1.12;
    // Gill cover edge and a pale belly.
    col = mix(col, col * 0.55, 0.5 * smoothstep(0.02, 0.0, abs(L.x - 0.285)) * step(-0.2, dors));
    col = mix(col, col * 1.12 + 0.02, smoothstep(0.0, -1.0, dors) * 0.5);
    if (vPart > 0.5) {
      // Fins: pale, translucent-looking, with rays; kohaku and sanke fins stay white
      float rays = 0.9 + 0.1 * sin(vKUv.x * 70.0);
      vec3 fin = type < 3.0 ? white * 0.95 : (type < 4.0 ? srgb(vec3(0.9, 0.68, 0.25)) : srgb(vec3(0.82, 0.55, 0.4)));
      if (type > 1.5 && type < 2.5) fin = mix(fin, black, 0.45 * smoothstep(0.35, 0.0, vFlap));
      col = fin * rays * (0.8 + 0.2 * vFlap);
      koiMetal = 0.0;
      koiRough = 0.5;
    }
  }
  diffuseColor.rgb = col;
}
`;

function koiMaterial(timeUniform) {
  const mat = new THREE.MeshStandardMaterial({ name: 'koi', roughness: 0.32, metalness: 0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uKoiTime = timeUniform;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
      .replace('#include <beginnormal_vertex>', VERT_NORMAL)
      .replace('#include <begin_vertex>', VERT_BEGIN);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAG_COLOR}`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = koiRough;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = koiMetal;');
  };
  mat.customProgramCacheKey = () => 'koi-v1';
  return mat;
}

// ---------------------------------------------------------------------------
// Swimming paths
// ---------------------------------------------------------------------------

export function buildKoi({ layout, rng, timeUniform }) {
  const { pond, heroKoiAt } = layout;
  const count = pond.koiCount;
  const r = rng.fork('koi');
  const pcz = pond.center[2];

  // Type mix; index 0 is the hero (kohaku), driven by layout.heroKoiAt.
  const types = [KOHAKU, KOHAKU, KOHAKU, KOHAKU, SANKE, SANKE, SANKE, SHOWA, SHOWA, OGON, OGON, OGON, ASAGI, ASAGI];
  const hero = heroKoiAt(0);

  // Loop centres in open water (the lotus beds sit at |x| > 8), spread apart from each other.
  const loops = [];
  const centres = [[hero.position[0], hero.position[2]]];
  const open = (x, z) => layout.pondEdgeDistance(x, z) < -2.5
    && !pond.lotusBeds.some((b) => Math.hypot(x - b.center[0], (z - b.center[2]) * 1.2) < b.radius + 1.6);
  for (let k = 1; k < count; k++) {
    let best = null, bestD = -1;
    for (let tries = 0; tries < 80; tries++) {
      const x = r.range(-14, 12), z = pcz + r.range(-6, 5.5);
      if (!open(x, z)) continue;
      const d = Math.min(...centres.map((c) => Math.hypot(c[0] - x, (c[1] - z) * 1.8)));
      if (d > bestD) { bestD = d; best = [x, z]; }
    }
    centres.push(best);
    const rx = r.range(1.6, 3.6), rz = r.range(0.9, 2.0);
    const speed = r.range(0.35, 0.75);
    const circ = TAU * Math.sqrt((rx * rx + rz * rz) / 2);
    loops.push({
      cx: best[0], cz: best[1], rx, rz, period: circ / speed, phase: r.range(0, TAU), dir: r.chance(0.5) ? 1 : -1,
      wob: r.range(0.15, 0.5), wobPhase: r.range(0, TAU), depth: r.range(0.16, 0.34), bob: r.range(0, TAU), speed,
    });
  }
  const posOf = (L, t) => {
    const a = L.dir * (TAU * t / L.period) + L.phase;
    return [L.cx + L.rx * Math.cos(a) + L.wob * Math.cos(2 * a + L.wobPhase), L.cz + L.rz * Math.sin(a) + L.wob * 0.6 * Math.sin(3 * a + L.wobPhase)];
  };

  const material = koiMaterial(timeUniform);
  const kinds = [];
  const params = [];
  for (let k = 0; k < count; k++) {
    const speed = k === 0 ? 0.96 : loops[k - 1].speed;
    params.push({
      type: types[k],
      scale: k === 0 ? 0.8 : r.range(0.46, 0.72),
      seed: k === 0 ? 3.1 : r.range(0, 9),
      tint: types[k] === OGON ? (k % 2) * 0.8 : r.range(0, 1),
      phase: r.range(0, TAU),
      omega: TAU * (0.55 + 0.7 * speed),
      amp: 0.05 + 0.02 * speed,
    });
  }
  // The hero (index 0) gets the full mesh; the others share a coarser one.
  const makeMesh = (name, detail, ids) => {
    const geo = koiGeometry(detail);
    const aKoi = new THREE.InstancedBufferAttribute(new Float32Array(ids.length * 4), 4);
    const aMotion = new THREE.InstancedBufferAttribute(new Float32Array(ids.length * 4), 4);
    ids.forEach((k, n) => {
      const p = params[k];
      aKoi.setXYZW(n, p.type, p.seed, p.tint, p.phase);
      aMotion.setXYZW(n, p.omega, p.amp, 0, 0);
    });
    aMotion.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aKoi', aKoi);
    geo.setAttribute('aMotion', aMotion);
    const mesh = new THREE.InstancedMesh(geo, material, ids.length);
    mesh.name = name;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    kinds.push({ mesh, aMotion, ids });
    return mesh;
  };
  const heroMesh = makeMesh('pondKoiHero', true, [0]);
  const schoolMesh = makeMesh('pondKoiSchool', false, Array.from({ length: count - 1 }, (_, i) => i + 1));

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const dt = 0.1;
  const state = (k, t) => {
    if (k === 0) { const h = heroKoiAt(t); return { x: h.position[0], y: h.position[1], z: h.position[2], heading: h.heading }; }
    const L = loops[k - 1];
    const [x, z] = posOf(L, t), [x1, z1] = posOf(L, t - dt), [x2, z2] = posOf(L, t + dt);
    const y = pond.waterY - L.depth + 0.02 * Math.sin(t * 0.8 + L.bob);
    return { x, y, z, heading: Math.atan2(-(z2 - z1), x2 - x1) };
  };
  const turn = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

  const update = (t) => {
    for (const { mesh, aMotion, ids } of kinds) {
      ids.forEach((k, n) => {
        const s0 = state(k, t - dt), s1 = state(k, t), s2 = state(k, t + dt);
        q.setFromAxisAngle(up, s1.heading);
        m.compose(pv.set(s1.x, s1.y, s1.z), q, sv.setScalar(params[k].scale));
        mesh.setMatrixAt(n, m);
        // Body bends with the turn: the tail trails to the outside.
        const rate = (turn(s0.heading, s1.heading) + turn(s1.heading, s2.heading)) / (2 * dt);
        aMotion.setZ(n, Math.max(-1.2, Math.min(1.2, rate)) * 0.6);
      });
      mesh.instanceMatrix.needsUpdate = true;
      aMotion.needsUpdate = true;
    }
  };
  update(0);
  return { meshes: [heroMesh, schoolMesh], update };
}
