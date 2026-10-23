// Wind chimes (futaku): a cast bronze bell with a flared lip and raised bands,
// hung from an eye at the eave-corner rafter tip, and a clapper cord that
// carries a flat wind plate below the lip. Every chime is one instance of the
// bell mesh and one of the clapper mesh, swung from update(t).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Acc, revolve, cyl, sphere, put } from './acc.js';
import { valueNoise2 } from '../../rng.js';

const HANG = 0.3; // pivot (hook eye) above the bell centre
const CLAPPER_Y = -0.135; // clapper pivot, inside the bell crown, relative to the pivot

// Bell profile (r, y about the bell centre): crown inside, lip underside, outside.
const BELL = [
  [0.0, 0.17], [0.03, 0.167], [0.06, 0.158], [0.088, 0.125], [0.104, 0.06], [0.114, -0.04], [0.123, -0.14], [0.13, -0.2], [0.133, -0.223],
  [0.133, -0.225], [0.158, -0.225], [0.166, -0.221], [0.168, -0.212], [0.166, -0.2], // lip
  [0.158, -0.195], [0.151, -0.19], [0.153, -0.178], [0.16, -0.172], [0.162, -0.162], [0.156, -0.156], [0.15, -0.15], // lower band
  [0.142, -0.1], [0.134, -0.05], [0.136, -0.03], [0.14, -0.022], [0.138, -0.014], [0.132, -0.01], // middle band
  [0.125, 0.04], [0.114, 0.09], [0.116, 0.104], [0.118, 0.118], [0.108, 0.124], [0.1, 0.13], // upper band
  [0.085, 0.16], [0.066, 0.188], [0.045, 0.208], [0.03, 0.218], [0.0, 0.225],
];

const INSIDE_ROWS = 8; // profile rows 0..8 are the inner wall of the bell
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function bellGeometry() {
  const seg = 40;
  const g = revolve(BELL, seg, (th, k) => 1 + (k > 14 ? 0.006 * Math.sin(th * 6 + k) : 0));
  const pos = g.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const th = Math.atan2(x, z), r = Math.hypot(x, z);
    // Verdigris gathers on the shoulder and in streaks that run down from the crown.
    const streak = valueNoise2(th * 2.2 + 9, y * 6, 41) * 0.7 + valueNoise2(th * 7, y * 14, 43) * 0.3;
    const high = Math.min(1, Math.max(0, (y + 0.05) / 0.28));
    let c = lerp3([1.15, 0.95, 0.7], [0.62, 1.05, 0.9], Math.min(1, high * 0.7 + streak * 0.75 - 0.2));
    // The lip and the raised bands are rubbed bright by the clapper and by hands.
    const lip = Math.max(0, 1 - Math.abs(y + 0.213) / 0.022);
    const bands = Math.max(0, 1 - Math.abs(r - 0.162) / 0.02) * (y < -0.15 ? 1 : 0)
      + Math.max(0, 1 - Math.abs(y - 0.11) / 0.014) + Math.max(0, 1 - Math.abs(y + 0.022) / 0.012);
    c = lerp3(c, [2.0, 1.55, 0.9], Math.min(1, lip * 0.9 + bands * 0.55));
    // Inside the bell is dark and shadowed.
    if (Math.floor(i / (seg + 1)) <= INSIDE_ROWS) c = lerp3(c, [0.35, 0.3, 0.25], 0.7);
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.translate(0, -HANG, 0);
  // Suspension loop on the crown, in a vertical plane.
  const loop = new THREE.TorusGeometry(0.03, 0.0075, 6, 14);
  loop.translate(0, -HANG + 0.225 + 0.03, 0);
  const lc = new Float32Array(loop.attributes.position.count * 3).fill(1);
  loop.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  // Ring-shaped boss where the loop meets the crown.
  const boss = new THREE.CylinderGeometry(0.02, 0.034, 0.03, 10).translate(0, -HANG + 0.232, 0);
  boss.setAttribute('color', new THREE.BufferAttribute(new Float32Array(boss.attributes.position.count * 3).fill(0.9), 3));
  // Raised studs (nyu) in two staggered rows on the shoulder, as on a cast temple bell.
  const studs = [];
  for (const [row, y, r] of [[0, -0.088, 0.1405], [1, 0.035, 0.1245]]) {
    for (let j = 0; j < 10; j++) {
      const th = ((j + row * 0.5) / 10) * Math.PI * 2;
      const st = new THREE.SphereGeometry(0.0095, 10, 6);
      st.scale(1, 1, 0.7);
      st.rotateY(th);
      st.translate(Math.sin(th) * (r + 0.001), y - HANG, Math.cos(th) * (r + 0.001));
      st.setAttribute('color', new THREE.BufferAttribute(new Float32Array(st.attributes.position.count * 3).fill(1.5), 3));
      studs.push(st);
    }
  }
  return mergeGeometries([g, loop, boss, ...studs]);
}

// Clapper cord, ball and wind plate; pivot at the crown inside the bell.
function clapperGeometry() {
  const a = new Acc();
  const len = 0.5;
  cyl(a, 0, 0, -len, 0, 0.0045, 0.0045, 6);
  sphere(a, 0, -0.27, 0, 0.026, 0.03, 0.026, 12); // clapper ball inside the bell
  sphere(a, 0, 0.0, 0, 0.012, 0.012, 0.012, 8);
  // Wind plate: a thin rounded diamond turned a quarter against the bell's hook.
  const plate = new THREE.Shape();
  plate.moveTo(0, 0.085); plate.quadraticCurveTo(0.052, 0.04, 0.05, 0);
  plate.quadraticCurveTo(0.05, -0.04, 0, -0.085); plate.quadraticCurveTo(-0.05, -0.04, -0.05, 0);
  plate.quadraticCurveTo(-0.052, 0.04, 0, 0.085);
  const pg = new THREE.ExtrudeGeometry(plate, { depth: 0.004, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 8 });
  pg.translate(0, 0, -0.002);
  put(a, pg, 0, -len - 0.075, 0, { ry: Math.PI / 5 });
  return a.geometry();
}

// positions: chime centres relative to the pagoda axis; returns { meshes, update }.
export function buildChimes(positions, bellMat, clapperMat, rng) {
  const bellGeo = bellGeometry();
  const clGeo = clapperGeometry();
  const n = positions.length;
  const bells = new THREE.InstancedMesh(bellGeo, bellMat, n);
  const claps = new THREE.InstancedMesh(clGeo, clapperMat, n);
  bells.frustumCulled = claps.frustumCulled = false;
  bells.name = 'chime-bells'; claps.name = 'chime-clappers';
  const phase = positions.map(() => rng.range(0, 6.283));
  const freq = positions.map(() => rng.range(0.85, 1.2));
  const dir = positions.map(() => rng.range(-0.5, 0.5));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const place = (mesh, i, x, y, z, rx, rz) => {
    e.set(rx, 0, rz); q.setFromEuler(e);
    m.compose(p.set(x, y, z), q, one);
    mesh.setMatrixAt(i, m);
  };
  function update(t) {
    // A slow gust envelope sets how hard the wind blows; the bell leans along the
    // wind (mostly west-east) and the light clapper follows a beat behind.
    for (let i = 0; i < n; i++) {
      const [x, y, z] = positions[i];
      const gust = 0.55 + 0.45 * Math.sin(t * 0.37 + phase[i] * 0.3) * Math.sin(t * 0.11 + 1.3);
      const s = Math.sin(t * 1.35 * freq[i] + phase[i]) + 0.4 * Math.sin(t * 2.9 * freq[i] + phase[i] * 2.1);
      const c = Math.sin(t * 1.35 * freq[i] + phase[i] - 1.1) + 0.4 * Math.sin(t * 2.9 * freq[i] + phase[i] * 2.1 - 1.9);
      place(bells, i, x, y + HANG, z, 0.05 * gust * s * dir[i], -0.07 * gust * s);
      const lag = Math.sin(t * 1.35 * freq[i] + phase[i] - 0.9) + 0.4 * Math.sin(t * 2.9 * freq[i] + phase[i] * 2.1 - 1.5);
      place(claps, i, x, y + HANG + CLAPPER_Y, z, 0.1 * gust * c, -0.14 * gust * lag);
    }
    bells.instanceMatrix.needsUpdate = true;
    claps.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { meshes: [bells, claps], update };
}
