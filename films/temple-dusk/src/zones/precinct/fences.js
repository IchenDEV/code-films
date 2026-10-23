// Four-eyed bamboo fences (yotsume-gaki) along the layout segments, and the shared bamboo
// pieces used by the water basin. Everything repeated is instanced:
//   posts (aged cypress), rails (horizontal bamboo), uprights (vertical slats), twine knots.
// The ground height under every post comes from layout.terrainHeight, so the fences that
// run down the slope outside the gate follow it and the rails tilt between posts.
import * as THREE from 'three';
import { lathe } from './kit.js';

const SPAN = 1.8; // post spacing
const RAIL_HEIGHTS = [0.2, 0.5, 0.8, 1.02];
const RAIL_LEN = 1.8; // baked length of the bamboo rail geometry
const UPRIGHT_LEN = 1.14;
const UPRIGHTS_PER_SPAN = 5;
const SIDES = 5;

// Bamboo with a few nodes along its length. Vertex colours darken the nodes; instance colours
// give each piece its age (fresh green-yellow to straw).
function bambooGeo(len, radius, nodes) {
  const prof = [[0, 0], [radius * 0.92, 0]];
  for (const f of nodes) {
    const y = f * len;
    prof.push([radius, y - radius * 0.7], [radius * 1.28, y], [radius, y + radius * 0.7]);
  }
  prof.push([radius * 0.95, len], [0, len]);
  const g = lathe(prof, SIDES);
  g.translate(0, -len / 2, 0);
  const P = g.attributes.position;
  const c = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i) + len / 2;
    let node = 0;
    for (const f of nodes) node = Math.max(node, Math.max(0, 1 - Math.abs(y - f * len) / (radius * 1.3)));
    const v = 1 - 0.38 * node;
    c[i * 3] = v; c[i * 3 + 1] = v * 0.96; c[i * 3 + 2] = v * 0.88;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

function postGeo() {
  const g = lathe([[0, -0.2], [0.05, -0.2], [0.056, 0.4], [0.06, 0.9], [0.062, 1.06], [0.05, 1.11], [0.03, 1.13], [0, 1.135]], 8);
  return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();

export function buildFences({ layout, M, rng, bamboo }) {
  const { fences, fenceHeight } = layout.precinct;
  const h = layout.terrainHeight;
  const r = rng.fork('fences');
  const posts = [], rails = [], uprights = [], knots = [];

  // Bamboo tone: 0 fresh green-yellow ... 1 straw.
  const tone = (t) => new THREE.Color().setRGB(0.42 + 0.22 * t, 0.5 + 0.07 * t, 0.2 + 0.15 * t, THREE.SRGBColorSpace);

  for (const f of fences) {
    const A = new THREE.Vector3(f.from[0], 0, f.from[2]), B = new THREE.Vector3(f.to[0], 0, f.to[2]);
    const len = A.distanceTo(B);
    const n = Math.max(1, Math.round(len / SPAN));
    const dir = B.clone().sub(A).normalize();
    // Face the slats toward the path (the x = 0 axis).
    let nrm = new THREE.Vector3(-dir.z, 0, dir.x);
    if (nrm.dot(new THREE.Vector3(-(A.x + B.x) / 2, 0, 0)) < 0) nrm.negate();
    const at = (u, off = 0) => {
      const x = A.x + (B.x - A.x) * u + nrm.x * off, z = A.z + (B.z - A.z) * u + nrm.z * off;
      return [x, h(x, z), z];
    };
    for (let i = 0; i <= n; i++) {
      const p = at(i / n);
      posts.push({ p, ry: r.range(0, 6), tilt: [r.range(-0.015, 0.015), r.range(-0.015, 0.015)], tone: r.range(0.1, 0.7) });
    }
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      // Rails behind the slats, running from post to post.
      for (const ry of RAIL_HEIGHTS) {
        const a = at(u0), b = at(u1);
        rails.push({ a: [a[0], a[1] + ry + r.range(-0.012, 0.012), a[2]], b: [b[0], b[1] + ry + r.range(-0.012, 0.012), b[2]], radius: 0.022, tone: r.range(0.1, 0.9) });
      }
      for (let k = 1; k <= UPRIGHTS_PER_SPAN; k++) {
        const u = u0 + ((u1 - u0) * k) / (UPRIGHTS_PER_SPAN + 1);
        const g = at(u, 0.055);
        const top = fenceHeight + 0.02 + r.range(-0.02, 0.02);
        uprights.push({ x: g[0], y: g[1] + top - UPRIGHT_LEN / 2 + 0.02, z: g[2], tilt: r.range(-0.02, 0.02), ry: r.range(0, 6), tone: r.range(0.05, 0.85) });
        for (const ry of RAIL_HEIGHTS) knots.push([g[0] + nrm.x * 0.02, g[1] + ry, g[2] + nrm.z * 0.02, r.range(0, 3)]);
      }
    }
  }
  for (const piece of bamboo) rails.push(piece);

  const mkMesh = (geo, mat, count, name) => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.name = name;
    return mesh;
  };
  const bambooMat = new THREE.MeshStandardMaterial({ name: 'bamboo', color: '#ffffff', vertexColors: true, roughness: 0.55, metalness: 0 });
  const col = new THREE.Color();

  // Posts.
  const postMat = M.woodRaw.clone();
  postMat.color.set('#6b5640');
  const postMesh = mkMesh(postGeo(), postMat, posts.length, 'fence-posts');
  posts.forEach((p, i) => {
    _q.setFromEuler(new THREE.Euler(p.tilt[0], p.ry, p.tilt[1], 'YXZ'));
    postMesh.setMatrixAt(i, _m.compose(_p.set(...p.p), _q, _s.set(1, 1, 1)));
    postMesh.setColorAt(i, col.setScalar(0.8 + 0.4 * p.tone));
  });

  // Rails (and the basin's bamboo pieces): baked length RAIL_LEN, scaled along the piece.
  const railMesh = mkMesh(bambooGeo(RAIL_LEN, 0.022, [0.18, 0.5, 0.82]), bambooMat, rails.length, 'fence-rails');
  rails.forEach((p, i) => {
    _d.set(p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]);
    const l = _d.length();
    _q.setFromUnitVectors(_up, _d.divideScalar(l));
    const k = (p.radius ?? 0.022) / 0.022;
    railMesh.setMatrixAt(i, _m.compose(_p.set((p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2), _q, _s.set(k, l / RAIL_LEN, k)));
    railMesh.setColorAt(i, tone(p.tone));
  });

  // Upright slats.
  const upMesh = mkMesh(bambooGeo(UPRIGHT_LEN, 0.017, [0.3, 0.62]), bambooMat, uprights.length, 'fence-uprights');
  uprights.forEach((p, i) => {
    _q.setFromEuler(new THREE.Euler(p.tilt, p.ry, 0, 'YXZ'));
    upMesh.setMatrixAt(i, _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(1, 1, 1)));
    upMesh.setColorAt(i, tone(p.tone));
  });

  // Black twine knots at every crossing: a squat bead.
  const knotMat = new THREE.MeshStandardMaterial({ name: 'twine', color: '#1b1814', roughness: 0.9, metalness: 0 });
  const knotMesh = mkMesh(new THREE.IcosahedronGeometry(0.03, 0), knotMat, knots.length, 'fence-knots');
  knots.forEach((k, i) => {
    _q.setFromEuler(new THREE.Euler(0, k[3], 0));
    knotMesh.setMatrixAt(i, _m.compose(_p.set(k[0], k[1], k[2]), _q, _s.set(1, 1.1, 0.8)));
  });

  const meshes = [postMesh, railMesh, upMesh, knotMesh];
  for (const m of meshes) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }
  return meshes;
}
