// Pond water: mirror pass (half resolution) + Fresnel mix with a dark green-brown body.
// Output is linear HDR, alpha-blended so koi and the pond floor read through it.

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

const VERT = /* glsl */ `
uniform mat4 textureMatrix;
attribute float aDepth;
varying vec4 vUv;
varying vec3 vWorld;
varying float vDepth;
#include <fog_pars_vertex>
void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vDepth = aDepth;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uTexel;
uniform vec4 uRings[6];
uniform vec3 uBody;
uniform float uAbsorb;
varying vec4 vUv;
varying vec3 vWorld;
varying float vDepth;
#include <fog_pars_fragment>

void wave(vec2 p, vec2 k, float w, float a, inout vec2 g) {
  g += k * (a * cos(dot(k, p) + w * uTime));
}

void main() {
  vec2 p = vWorld.xz;
  vec2 g = vec2(0.0);
  wave(p, vec2( 1.9,  0.8), 0.9, 0.0035, g);
  wave(p, vec2(-1.1,  2.6), 1.3, 0.0030, g);
  wave(p, vec2( 3.6, -2.1), 1.9, 0.0018, g);
  wave(p, vec2(-4.8, -3.3), 2.3, 0.0012, g);
  wave(p, vec2( 0.7, -7.5), 2.9, 0.0008, g);
  // Slow expanding rings (a fish rising, a drop from the maples).
  for (int i = 0; i < 6; i++) {
    vec4 rg = uRings[i];
    float cyc = mod(uTime + rg.w, rg.z);
    float R = 0.28 * cyc;
    vec2 dv = p - rg.xy;
    float d = length(dv) + 1e-4;
    float q = (d - R) / 0.16;
    float amp = 0.020 * exp(-cyc * 0.34) * smoothstep(0.0, 0.5, cyc);
    float kk = 22.0;
    g += (dv / d) * amp * exp(-q * q) * (cos(kk * (d - R)) - 2.0 * q / (0.16 * kk) * sin(kk * (d - R)));
  }
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float c = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.04 + 0.96 * pow(1.0 - c, 4.5);

  vec4 uvp = vUv;
  uvp.xy += N.xz * (0.25 + 0.75 * (1.0 - c)) * 0.55 * vUv.w;
  vec2 o = uTexel * vUv.w;
  vec3 refl = texture2DProj(tDiffuse, uvp).rgb * 0.36;
  refl += texture2DProj(tDiffuse, uvp + vec4( o.x,  o.y, 0.0, 0.0)).rgb * 0.16;
  refl += texture2DProj(tDiffuse, uvp + vec4(-o.x,  o.y, 0.0, 0.0)).rgb * 0.16;
  refl += texture2DProj(tDiffuse, uvp + vec4( o.x, -o.y, 0.0, 0.0)).rgb * 0.16;
  refl += texture2DProj(tDiffuse, uvp + vec4(-o.x, -o.y, 0.0, 0.0)).rgb * 0.16;
  refl *= color * 0.8;

  float T = exp(-vDepth / max(c, 0.3) * uAbsorb);
  float a = F + (1.0 - F) * (1.0 - T);
  vec3 lit = refl * F + uBody * (1.0 - F) * (1.0 - T);
  gl_FragColor = vec4(lit / max(a, 1e-3), a);
  #include <fog_fragment>
}`;

export function buildWater({ layout, renderer, rng }) {
  const { pond, pondRadiusAt, terrainHeight } = layout;
  const [cx, , cz] = pond.center;

  // Polar grid in the reflector's local XY plane (local y = -world z). Rings bunch up at
  // the bank, where the depth attribute changes fastest; the edge runs 0.6 m under the bank.
  const NT = 192, NR = 28;
  const pos = [], depth = [], index = [];
  for (let i = 0; i <= NR; i++) {
    const s = 1 - (1 - i / NR) ** 1.7;
    for (let j = 0; j < NT; j++) {
      const th = (j / NT) * Math.PI * 2;
      const r = s * (pondRadiusAt(th) + 0.6);
      const wx = cx + Math.cos(th) * r, wz = cz + Math.sin(th) * r;
      pos.push(wx - cx, -(wz - cz), 0);
      depth.push(Math.max(0, pond.waterY - terrainHeight(wx, wz)));
    }
  }
  for (let i = 0; i < NR; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * NT + j, b = i * NT + (j + 1) % NT, c = (i + 1) * NT + j, d = (i + 1) * NT + (j + 1) % NT;
      index.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depth, 1));
  geo.setIndex(index);

  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const tw = Math.max(64, Math.round(size.x * 0.5)), th = Math.max(64, Math.round(size.y * 0.5));

  const shader = {
    name: 'PondWater',
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      color: { value: null },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      uTime: { value: 0 },
      uTexel: { value: new THREE.Vector2(1.2 / tw, 1.2 / th) },
      uRings: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) },
      uBody: { value: new THREE.Vector3(0.010, 0.020, 0.014) },
      uAbsorb: { value: 0.65 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  };
  const water = new Reflector(geo, { textureWidth: tw, textureHeight: th, multisample: 0, clipBias: 0.002, color: 0xffffff, shader });
  water.rotation.x = -Math.PI / 2;
  water.position.set(cx, pond.waterY, cz);
  water.name = 'pondWater';
  water.userData.noCastShadow = true;
  water.userData.noReceiveShadow = true;
  // The generated geometry has a valid local bound. Let Three skip the mirror
  // render when the pond is outside the shot or a subpixel sample's frustum.
  water.frustumCulled = true;
  const mat = water.material;
  mat.fog = true;
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;

  // Ring sources: seeded spots in the open middle of the pond.
  const r = rng.fork('rings');
  const rings = mat.uniforms.uRings.value;
  rings.forEach((v, i) => {
    const th2 = r.range(0, Math.PI * 2), rad = r.range(2, 9);
    v.set(cx + Math.cos(th2) * rad * 1.4, cz + Math.sin(th2) * rad * 0.5, r.range(9, 15), r.range(0, 15) + i);
  });

  return { water, update: (t) => { mat.uniforms.uTime.value = t; } };
}
