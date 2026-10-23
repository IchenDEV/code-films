// Water of the basin: a dark mirror at the brim, the thin bamboo-spout stream, and the
// ripple rings where the stream lands. All motion is a pure function of the film time.
import * as THREE from 'three';
import { WATER_Y, WATER_R, SPOUT_TIP } from './basin.js';

function streamTexture() {
  const W = 8, Hh = 64;
  const data = new Uint8Array(W * Hh * 4);
  for (let j = 0; j < Hh; j++) {
    const v = j / Hh;
    // Bright streaks of varying length along the fall; column-wise phase so it is not a stripe set.
    for (let i = 0; i < W; i++) {
      const ph = (i * 0.37) % 1;
      const s = 0.5 + 0.5 * Math.sin((v + ph) * Math.PI * 2 * 3);
      const s2 = 0.5 + 0.5 * Math.sin((v * 2 + ph * 1.7) * Math.PI * 2);
      const a = Math.min(1, Math.max(0, 0.25 + 0.75 * s * s2));
      const k = (j * W + i) * 4;
      data[k] = 235; data[k + 1] = 245; data[k + 2] = 250; data[k + 3] = Math.round(255 * a);
    }
  }
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// origin: world position of the basin centre (ground level).
export function buildBasinWater(origin) {
  const group = new THREE.Group();
  group.position.set(...origin);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(WATER_R + 0.01, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'basin-water', color: '#040c0d', roughness: 0.02, metalness: 0, envMapIntensity: 1.0 }),
  );
  water.position.y = WATER_Y;
  water.userData.noCastShadow = true;

  const rippleMat = new THREE.ShaderMaterial({
    name: 'basin-ripple',
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: { value: 0 }, uHit: { value: new THREE.Vector2(SPOUT_TIP[0], SPOUT_TIP[2]) }, uRadius: { value: WATER_R } },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec2 uHit; uniform float uRadius;
      varying vec2 vXZ;
      void main() {
        float d = distance(vXZ, uHit);
        float a = 0.0;
        for (int k = 0; k < 4; k++) {
          float u = fract(uTime * 0.55 + float(k) * 0.25);
          float rad = 0.015 + u * 0.3;
          float ring = exp(-pow((d - rad) / 0.012, 2.0)) * (1.0 - u) * (1.0 - u);
          a += ring;
        }
        // Fade near the stone wall so the rings do not ride up the bowl.
        a *= 1.0 - smoothstep(uRadius - 0.04, uRadius, length(vXZ));
        // A small bright disturbance where the stream lands.
        a += exp(-pow(d / 0.03, 2.0)) * 0.5;
        gl_FragColor = vec4(0.75, 0.82, 0.85, min(a, 1.0) * 0.5);
      }`,
  });
  const ripple = new THREE.Mesh(new THREE.CircleGeometry(WATER_R, 40).rotateX(-Math.PI / 2), rippleMat);
  ripple.position.y = WATER_Y + 0.002;
  ripple.userData.noCastShadow = true;
  ripple.userData.noReceiveShadow = true;
  ripple.renderOrder = 6;

  const fall = SPOUT_TIP[1] - WATER_Y;
  const tex = streamTexture();
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.009, fall, 6, 1, true),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8, side: THREE.DoubleSide, fog: false }),
  );
  stream.position.set(SPOUT_TIP[0], WATER_Y + fall / 2, SPOUT_TIP[2]);
  stream.userData.noCastShadow = true;
  stream.userData.noReceiveShadow = true;
  stream.renderOrder = 6;

  group.add(water, ripple, stream);
  return {
    group,
    update: (t) => {
      rippleMat.uniforms.uTime.value = t;
      tex.offset.y = (t * 1.6) % 1;
    },
  };
}
