// Renderer, sky, sun, fog and post-processing. Assembles the six zones.
//
// Rendering is a pure function of (time, camera): zones expose update(t) and
// read no clock, so any frame can be rendered alone and comes out the same.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { layout } from './layout.js';
import { M } from './materials.js';
import { createRng } from './rng.js';

export const ZONES = ['terrain', 'pond', 'hall', 'pagoda', 'bridge', 'trees', 'garden', 'precinct'];

const SUN = new THREE.Vector3(...layout.sun.dir).normalize();
const f = (v) => v.toFixed(5);

// Sky radiance in linear HDR for a world direction. Shared by the sky dome and
// the fog, so distant geometry dissolves into exactly the sky behind it.
const SKY_GLSL = /* glsl */ `
const vec3 SUN_DIR = vec3(${f(SUN.x)}, ${f(SUN.y)}, ${f(SUN.z)});
vec3 skyRadiance(vec3 d) {
  float h = d.y;
  float mu = dot(d, SUN_DIR);
  float toward = max(mu, 0.0);
  vec2 dh = normalize(d.xz + vec2(1e-5));
  float az = 0.5 + 0.5 * dot(dh, normalize(SUN_DIR.xz));
  vec3 zenith = vec3(0.10, 0.15, 0.23);
  vec3 upperAway = vec3(0.23, 0.28, 0.34);
  vec3 upperSun = vec3(0.48, 0.39, 0.30);
  vec3 horizonAway = vec3(0.49, 0.48, 0.44);
  vec3 horizonSun = vec3(1.10, 0.82, 0.54);
  vec3 horizon = mix(horizonAway, horizonSun, pow(az, 3.0));
  vec3 upper = mix(upperAway, upperSun, pow(az, 4.0));
  float hp = clamp(h, 0.0, 1.0);
  vec3 col = mix(horizon, upper, smoothstep(0.0, 0.28, hp));
  col = mix(col, zenith, smoothstep(0.25, 0.95, hp));
  col += vec3(1.7, 0.72, 0.26) * pow(toward, 9.0) * 0.55;
  col += vec3(2.4, 1.25, 0.55) * pow(toward, 90.0) * 1.2;
  // Below the horizon: hazy valley, a little darker.
  col = mix(col, horizon * 0.55, smoothstep(0.0, -0.25, h));
  return col;
}
`;

// Fog in linear HDR before tone mapping, coloured by the sky in the same
// direction (sun-side haze glows, the far side is cool mauve).
function installSkyFog() {
  const c = THREE.ShaderChunk;
  c.fog_pars_vertex = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogDir;
#endif`;
  c.fog_vertex = `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogDir = transpose(mat3(viewMatrix)) * mvPosition.xyz;
#endif`;
  c.fog_pars_fragment = `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogDir;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  ${SKY_GLSL}
#endif`;
  c.fog_fragment = `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  vec3 fogDir = normalize(vFogDir);
  fogDir.y = max(fogDir.y, 0.0) * 0.6 + 0.015;
  gl_FragColor.rgb = mix( gl_FragColor.rgb, skyRadiance(normalize(fogDir)) * fogColor, fogFactor );
#endif`;
}

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    name: 'sky',
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vDir;
      ${SKY_GLSL}
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return s;
      }
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = skyRadiance(d);
        float mu = dot(d, SUN_DIR);
        // Sun disc, slightly larger than life, sitting in the haze.
        col += vec3(28.0, 14.0, 5.5) * smoothstep(0.99985, 0.99993, mu);
        // Thin high cloud streaks lit from below by the sun.
        if (d.y > 0.0) {
          vec2 p = d.xz / (d.y + 0.06);
          p = vec2(p.x * 0.55 + p.y * 0.25, p.y * 1.6 - p.x * 0.2) * 0.9 + vec2(uTime * 0.004, 0.0);
          float n = fbm(p * 1.3);
          float streak = smoothstep(0.52, 0.78, n) * smoothstep(0.02, 0.10, d.y) * (1.0 - smoothstep(0.45, 0.8, d.y));
          float toward = max(mu, 0.0);
          vec3 lit = mix(vec3(0.42, 0.24, 0.32), vec3(2.2, 0.95, 0.42), pow(toward, 3.0));
          lit = mix(lit, vec3(0.20, 0.14, 0.24), smoothstep(0.25, 0.6, d.y));
          col = mix(col, lit, streak * 0.75);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 64, 32), mat);
  mesh.name = 'sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return mesh;
}

// Fit an orthographic shadow frustum around the compound as seen from the sun.
function fitSunShadow(light, direction = SUN) {
  const target = new THREE.Vector3(...layout.anchors.compoundCenter);
  light.target.position.copy(target);
  light.position.copy(target).addScaledVector(direction, 400);
  const view = new THREE.Matrix4().lookAt(light.position, target, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.clone().invert();
  const box = new THREE.Box3();
  const w = layout.wall;
  for (const x of [w.minX - 6, w.maxX + 6]) for (const z of [w.minZ - 6, layout.garden.outerField.maxZ + 6]) for (const y of [-2, layout.pagoda.sorin.topY + 1]) {
    box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inv));
  }
  const cam = light.shadow.camera;
  cam.left = box.min.x; cam.right = box.max.x;
  cam.bottom = box.min.y; cam.top = box.max.y;
  cam.near = 1; cam.far = 900;
  cam.updateProjectionMatrix();
}

export async function createWorld({ canvas, width, height, zones = ZONES, bloom = true, msaa = 4, shadowSize = 4096, pixelRatio = 1, renderScale = 1.5, lighting = true, samples = 4 }) {
  installSkyFog();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // The sun and almost all geometry are static: the shadow map is drawn once,
  // at film time 0, so every frame gets the same shadows no matter where a
  // render starts (see bakeShadows).
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 60, 1400);

  const sky = makeSky();
  scene.add(sky);

  // Image-based fill light from the same sky (code-generated, no HDR file).
  const envScene = new THREE.Scene();
  const envSky = makeSky();
  envSky.scale.setScalar(0.1);
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(envScene, 0.02, 1, 1000);
  scene.environment = envRT.texture;
  // Retain a small environment floor; most diffuse sky fill now has occlusion.
  scene.environmentIntensity = lighting ? 0.50 : 0.85;
  pmrem.dispose();

  const sunLight = new THREE.DirectionalLight(new THREE.Color(...layout.sun.color), 2.8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(shadowSize, shadowSize);
  sunLight.shadow.bias = -0.00025;
  sunLight.shadow.normalBias = 0.035;
  sunLight.shadow.radius = 2;
  fitSunShadow(sunLight);
  scene.add(sunLight, sunLight.target);

  const skyLights = [];
  if (lighting) {
    // Four fixed sky directions approximate diffuse sky visibility. Their
    // shadow maps are baked with the sun, so offscreen roofs still block fill.
    // This is a static lighting approximation, not a multiple-bounce GI solver.
    for (let i = 0; i < 4; i++) {
      const az = (layout.sun.azimuthDeg + 45 + i * 90) * Math.PI / 180;
      const direction = new THREE.Vector3(Math.sin(az), 0.75, -Math.cos(az)).normalize();
      const light = new THREE.DirectionalLight('#b8c8df', 0.24);
      light.name = `sky-fill-${i}`;
      light.castShadow = true;
      light.shadow.mapSize.set(2048, 2048);
      light.shadow.bias = -0.00015;
      light.shadow.normalBias = 0.045;
      fitSunShadow(light, direction);
      scene.add(light, light.target);
      skyLights.push(light);
    }
    // Unoccluded first-bounce ground fill, scaled by the sun's grazing angle
    // and granite albedo. Downward-facing surfaces see the warm ground.
    const ground = sunLight.color.clone().multiplyScalar(sunLight.intensity * SUN.y)
      .add(new THREE.Color('#b8c8df').multiplyScalar(0.8))
      .multiply(new THREE.Color('#8c877e'));
    const bounce = new THREE.HemisphereLight(0x000000, ground, 1);
    bounce.name = 'ground-bounce';
    scene.add(bounce);
  }

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.05, 6000);

  // Zones.
  const built = [];
  for (const name of zones) {
    const mod = await import(`./zones/${name}.js`);
    const t0 = performance.now();
    const res = mod.build({ THREE, layout, M, rng: createRng(`${layout.SEED}:${name}`), renderer });
    res.object.name = `zone:${name}`;
    res.object.traverse((o) => {
      if (o.isMesh || o.isInstancedMesh) {
        o.castShadow = !o.userData.noCastShadow;
        o.receiveShadow = !o.userData.noReceiveShadow;
      }
    });
    scene.add(res.object);
    built.push({ name, ...res, buildMs: performance.now() - t0 });
  }

  // Render fine detail above delivery resolution, then filter it in OutputPass.
  // MSAA covers silhouettes; the larger HDR buffer also samples texture/bump detail.
  const renderWidth = Math.round(width * renderScale);
  const renderHeight = Math.round(height * renderScale);
  const rt = new THREE.WebGLRenderTarget(renderWidth * pixelRatio, renderHeight * pixelRatio, { type: THREE.HalfFloatType, samples: msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(renderWidth, renderHeight);
  const scenePass = samples === 1 ? new RenderPass(scene, camera) : new SSAARenderPass(scene, camera);
  if (samples > 1) {
    scenePass.sampleLevel = Math.log2(samples);
    // The stock SSAA pass owns a single-sample target. Its fixed subpixel
    // samples resolve cutout coverage; alpha-to-coverage requires MSAA.
    scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.alphaToCoverage = false;
    });
  }
  composer.addPass(scenePass);
  if (bloom) composer.addPass(new UnrealBloomPass(new THREE.Vector2(renderWidth, renderHeight), 0.12, 0.45, 2.2));
  composer.addPass(new OutputPass());

  const lookTarget = new THREE.Vector3();
  let currentTime = 0;

  function setTime(t) {
    currentTime = t;
    sky.material.uniforms.uTime.value = t;
    for (const z of built) z.update?.(t);
  }

  function setCamera({ position, target, fov = 35, near, roll = 0 }) {
    camera.position.set(...position);
    lookTarget.set(...target);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookTarget);
    if (roll) camera.rotateZ(roll);
    camera.fov = fov;
    const dist = camera.position.distanceTo(lookTarget);
    camera.near = near ?? Math.min(0.5, Math.max(0.02, dist * 0.04));
    camera.far = 6000;
    camera.updateProjectionMatrix();
    sky.position.copy(camera.position);
  }

  renderer.info.autoReset = false;
  let shadowsBaked = false;
  const shadowProbe = new THREE.WebGLRenderTarget(1, 1);
  function bakeShadows(t) {
    setTime(0);
    renderer.shadowMap.needsUpdate = true;
    renderer.setRenderTarget(shadowProbe);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    setTime(t);
    shadowsBaked = true;
  }

  function render() {
    if (!shadowsBaked) bakeShadows(currentTime);
    renderer.info.reset();
    composer.render();
  }

  function stats() {
    let tris = 0, meshes = 0;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      const g = o.geometry;
      const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      tris += n * (o.isInstancedMesh ? o.count : 1);
    });
    return { meshes, tris: Math.round(tris), lighting: { skyDirections: skyLights.length, groundBounce: lighting, shadowSize }, samples, resolution: { output: [width, height], internal: [renderWidth, renderHeight] }, zones: built.map((z) => ({ name: z.name, buildMs: Math.round(z.buildMs) })), info: renderer.info.render };
  }

  return { renderer, scene, camera, setTime, setCamera, render, stats, zones: built };
}
