// Shared helpers for the trees zone: tapered tubes, deterministic noise,
// leaf-card orientation and the foliage material (sun translucency + wind sway).
import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// Deterministic hash noise in [0, 1) (pure function of its inputs).
export function hn(x, y = 0, z = 0) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// Tapered tube along a polyline. Parallel-transport frames. Attributes:
// position, normal, uv, color (all indexed). radii[i] is the radius at pts[i].
// uv.x runs along the tube (wood grain), uv.y around it.
export function tube(pts, radii, radial, color, { vScale = 1, jitter = 0.18 } = {}) {
  const n = pts.length;
  const pos = [], nor = [], uv = [], col = [], idx = [];
  const T = pts.map((p, i) => pts[Math.min(i + 1, n - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize());
  const N = Math.abs(T[0].z) > 0.9 ? V3(1, 0, 0) : V3(0, 0, 1);
  N.addScaledVector(T[0], -N.dot(T[0])).normalize();
  const B = V3();
  let len = 0;
  const c = new THREE.Color();
  const seed = pts[0].x * 0.37 + pts[0].z * 0.73;
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      len += pts[i].distanceTo(pts[i - 1]);
      N.addScaledVector(T[i], -N.dot(T[i])).normalize();
    }
    B.crossVectors(T[i], N);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      const dx = N.x * cs + B.x * sn, dy = N.y * cs + B.y * sn, dz = N.z * cs + B.z * sn;
      pos.push(pts[i].x + dx * radii[i], pts[i].y + dy * radii[i], pts[i].z + dz * radii[i]);
      nor.push(dx, dy, dz);
      uv.push(len * vScale, j / radial);
      const k = 1 + (hn(j % radial, i * 1.7, seed) - 0.5) * 2 * jitter;
      c.copy(color).multiplyScalar(k);
      col.push(c.r, c.g, c.b);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j, b = a + 1, d = a + row, e = d + 1;
      idx.push(a, b, d, b, e, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// Smooth polyline through control points (Catmull-Rom), `samples` points.
export function spline(ctrl, samples) {
  return new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(samples - 1);
}

// Linear taper from r0 to r1 over n points, easing so the base flares slightly.
export function taper(n, r0, r1, ease = 0.9) {
  return Array.from({ length: n }, (_, i) => r0 + (r1 - r0) * Math.pow(i / (n - 1), ease));
}

// Matrix for a flat leaf card: origin at `p`, local +y toward `tip`, local +z toward
// `normal` (re-orthogonalised), uniform scale s.
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
export function leafMatrix(p, tip, normal, s, out = new THREE.Matrix4()) {
  _z.copy(normal).normalize();
  _y.copy(tip).addScaledVector(_z, -tip.dot(_z)).normalize();
  _x.crossVectors(_y, _z);
  out.makeBasis(_x.multiplyScalar(s), _y.multiplyScalar(s), _z.multiplyScalar(s));
  out.setPosition(p);
  return out;
}

// Foliage material: double-sided, vertex + instance colours. With trans > 0 the
// sun shines through the leaf when it sits behind it relative to the camera
// (and glows when you look toward the sun). Wind: a slow world-space swell plus a
// fast flutter, scaled by the per-vertex `sway` attribute (0 at the stem, 1 at the tip).
export function foliageMaterial({ time, trans = 0, glow = 0, wind = 0.04, roughness = 0.7, side = THREE.DoubleSide, map = null, alphaTest = 0 }) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0, side, vertexColors: true, map, alphaTest });
  // Smooth cutout coverage in the multisampled HDR buffer instead of toggling a
  // whole pixel when a moving leaf crosses the alpha threshold.
  m.alphaToCoverage = alphaTest > 0;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uWind = { value: wind };
    shader.uniforms.uTrans = { value: trans };
    shader.uniforms.uGlow = { value: glow };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float sway;\nuniform float uTime;\nuniform float uWind;')
      .replace('#include <project_vertex>', /* glsl */ `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        vec4 wpos = modelMatrix * mvPosition;
        float ph = wpos.x * 0.21 + wpos.z * 0.17;
        float swell = sin( uTime * 1.1 + ph ) + 0.6 * sin( uTime * 2.3 + ph * 1.9 + 1.7 );
        float flutter = sin( uTime * 3.7 + wpos.x * 3.1 + wpos.y * 2.3 + wpos.z * 2.7 );
        wpos.xyz += vec3( 0.8 * swell, 0.15 * flutter, 0.5 * swell + 0.3 * flutter ) * ( sway * uWind );
        mvPosition = viewMatrix * wpos;
        gl_Position = projectionMatrix * mvPosition;
      `);
    // Leaf colour lifted a little everywhere, so crowns seen from above stay red at dusk.
    if (glow > 0) {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uGlow;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uGlow;');
    }
    if (trans > 0) {
      let chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
      const anchor = 'vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );';
      if (!chunk.includes(anchor)) throw new Error('trees: three.js lights_physical_pars_fragment changed, update the translucency patch');
      chunk = chunk.replace(anchor, /* glsl */ `
        {
          float back = saturate( dot( -geometryNormal, directLight.direction ) );
          float fwd = pow( saturate( dot( -geometryViewDir, directLight.direction ) ), 3.0 );
          float lum = dot( material.diffuseColor, vec3( 0.3, 0.55, 0.15 ) );
          vec3 tcol = max( mix( vec3( lum ), material.diffuseColor, 1.35 ), vec3( 0.0 ) );
          reflectedLight.directDiffuse += directLight.color * tcol * ( back * 0.95 + fwd * 0.35 ) * uTrans * RECIPROCAL_PI * 3.0;
        }
        ` + anchor);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTrans;')
        .replace('#include <lights_physical_pars_fragment>', chunk);
    }
  };
  m.customProgramCacheKey = () => `trees-foliage-${trans > 0 ? 'trans' : 'plain'}-${glow > 0 ? 'glow' : 'dull'}`;
  return m;
}

// Add a `sway` attribute to a geometry: a constant or fn(x, y, z, i).
export function addSway(geo, fn) {
  const p = geo.attributes.position;
  const a = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) a[i] = typeof fn === 'function' ? fn(p.getX(i), p.getY(i), p.getZ(i), i) : fn;
  geo.setAttribute('sway', new THREE.BufferAttribute(a, 1));
  return geo;
}

// Keep only the listed attributes so geometries merge.
export function keep(geo, names) {
  for (const k of Object.keys(geo.attributes)) if (!names.includes(k)) geo.deleteAttribute(k);
  return geo;
}

// Paint every vertex one colour (adds a `color` attribute).
export function paint(geo, color, noise = 0, seed = 0) {
  const p = geo.attributes.position;
  const a = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const k = 1 + (hn(p.getX(i) * 3.1 + seed, p.getY(i) * 2.7, p.getZ(i) * 3.3) - 0.5) * 2 * noise;
    c.copy(color).multiplyScalar(k);
    a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
