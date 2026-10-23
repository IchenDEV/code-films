// Incense smoke: a few soft wisps rising from under the lid's eaves and drifting east.
// Each wisp is two crossed ribbons; a vertex shader bends them (drift, sway) and the
// fragment shader scrolls a code-generated soft alpha texture upward. Everything is a
// pure function of the film time t.
import * as THREE from 'three';
import { fbm2 } from '../../rng.js';

// Tileable soft-streak noise (value in the red channel).
function smokeTexture() {
  const W = 64, Hh = 128;
  const data = new Uint8Array(W * Hh * 4);
  const f = (u, v) => fbm2(u * 3.0, v * 1.6, 4, 61);
  for (let j = 0; j < Hh; j++) {
    for (let i = 0; i < W; i++) {
      const u = i / W, v = j / Hh;
      const n = f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
      const t = Math.min(1, Math.max(0, (n - 0.2) / 0.55));
      const k = (j * W + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = Math.round(255 * t);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

const ROWS = 28;

export function buildSmoke({ layout, rng }) {
  const { center, height } = layout.precinct.incenseBurner;
  const r = rng.fork('smoke');
  const wisps = 6;
  const pos = [], uv = [], base = [], axis = [], seed = [], idx = [];
  let v = 0;
  for (let w = 0; w < wisps; w++) {
    const a = (w / wisps) * Math.PI * 2 + r.range(-0.3, 0.3);
    // Half the wisps climb from the finial, half slip out from under the lid's eaves.
    const rad = w % 2 === 0 ? r.range(0.02, 0.12) : r.range(0.45, 0.58);
    const y0 = w % 2 === 0 ? height * 0.93 : height * 0.8;
    const s = r.next();
    const th0 = r.range(0, Math.PI);
    for (const rot of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
      const th = th0 + rot;
      for (let i = 0; i <= ROWS; i++) {
        for (const side of [-0.5, 0.5]) {
          pos.push(side, i / ROWS, 0);
          uv.push(side + 0.5, i / ROWS);
          base.push(center[0] + Math.cos(a) * rad, y0, center[2] + Math.sin(a) * rad);
          axis.push(Math.cos(th), Math.sin(th));
          seed.push(s);
        }
      }
      for (let i = 0; i < ROWS; i++) {
        const o = v + i * 2;
        idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
      v += (ROWS + 1) * 2;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
  geo.setAttribute('aAxis', new THREE.Float32BufferAttribute(axis, 2));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  geo.setIndex(idx);

  const mat = new THREE.ShaderMaterial({
    name: 'incense-smoke',
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: smokeTexture() },
      uColor: { value: new THREE.Color(0.7, 0.65, 0.65) },
      uOpacity: { value: 0.26 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute vec3 aBase; attribute vec2 aAxis; attribute float aSeed;
      varying vec2 vUv; varying float vH; varying float vSeed;
      void main() {
        float h = position.y;
        float rise = 1.9 + 0.8 * fract(aSeed * 3.7);
        vec3 p = aBase;
        p.y += h * rise;
        float gust = 0.85 + 0.3 * sin(uTime * 0.23 + aSeed * 6.0);
        p.x += pow(h, 1.4) * 0.95 * gust;
        float ph = aSeed * 6.2832;
        p.x += sin(h * 7.5 - uTime * 1.0 + ph) * 0.14 * pow(h, 0.8);
        p.z += cos(h * 6.1 - uTime * 0.8 + ph * 1.7) * 0.18 * pow(h, 0.8);
        float w = mix(0.1, 0.85, pow(h, 0.6)) * (0.85 + 0.3 * sin(h * 9.0 + ph));
        p.xz += aAxis * position.x * w;
        vUv = uv; vH = h; vSeed = aSeed;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
      varying vec2 vUv; varying float vH; varying float vSeed;
      void main() {
        float edge = 1.0 - abs(vUv.x * 2.0 - 1.0);
        edge = smoothstep(0.0, 1.0, edge);
        vec2 tuv = vec2(vUv.x * 0.8 + vSeed, vH * 2.6 - uTime * 0.14 + vSeed * 3.0);
        float n = texture2D(uMap, tuv).r;
        float fadeIn = smoothstep(0.0, 0.14, vH);
        float fadeOut = 1.0 - smoothstep(0.5, 1.0, vH);
        float a = edge * edge * smoothstep(0.28, 0.75, n) * fadeIn * fadeOut * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'incense-smoke';
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.userData.noCastShadow = true;
  mesh.userData.noReceiveShadow = true;
  return { mesh, update: (t) => { mat.uniforms.uTime.value = t; } };
}
