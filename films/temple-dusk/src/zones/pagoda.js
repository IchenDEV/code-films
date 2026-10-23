// Five-storey pagoda (goju-no-to) on a stone base, with bronze wind chimes at
// every eave corner and a gilt-bronze spire. Geometry is accumulated per
// material (acc.js), so the whole building is a handful of draw calls.
import { Acc, cyl, put } from './pagoda/acc.js';
import { buildBase, buildStorey } from './pagoda/body.js';
import { buildRoof } from './pagoda/roof.js';
import { buildFinial } from './pagoda/finial.js';
import { buildChimes } from './pagoda/chimes.js';

export function build({ THREE, layout, M, rng }) {
  const p = layout.pagoda, c = p.center;
  // The finial is backlit by the sunset, so the gold carries a little emission to stay gold in shadow.
  const gold = M.goldLeaf.clone();
  gold.emissive.set('#7a5418');
  gold.emissiveIntensity = 0.08;
  const A = {};
  const mats = {
    vermilion: M.vermilion, plaster: M.plaster, wood: M.wood, woodRaw: M.woodRaw, stone: M.stone,
    black: M.blackLacquer, gold: gold, bronze: M.bronze, tile: M.roofTile,
  };
  for (const k of Object.keys(mats)) A[k] = new Acc();

  buildBase(A, p);
  const top = p.storeys.length - 1;
  p.storeys.forEach((s, i) => {
    // The roof meets the next storey's balcony skirt; the top roof closes on the spire plinth.
    const next = p.storeys[i + 1];
    const Ri = next ? next.width / 2 + 0.3 : 0.6;
    const yIn = next ? next.baseY - 0.4 : p.roofPeakY;
    buildStorey(A, i, s, s.baseY - 0.4);
    buildRoof(A, { E: s.eaveHalf, yE: s.eaveY, lift: p.cornerLift, rb: s.width / 2 - 0.25, topY: s.topY, Ri, yIn });
  });

  // Hook and eye under each corner rafter tip; the bell's loop hangs on the eye.
  for (const m of p.chimes) {
    const x = m.position[0] - c[0], y = m.position[1], z = m.position[2] - c[2];
    cyl(A.bronze, x, z, y + 0.31, y + 0.54, 0.012, 0.012, 8);
    put(A.bronze, new THREE.TorusGeometry(0.026, 0.008, 6, 12), x, y + 0.3, z, { ry: Math.PI / 4 });
    put(A.bronze, new THREE.CylinderGeometry(0.035, 0.035, 0.012, 10), x, y + 0.545, z);
  }

  const L = p.storeys[top].eaveHalf + 0.25;
  buildFinial(A, p.sorin, [L, p.storeys[top].eaveY + p.cornerLift + 0.02, L]);

  const object = new THREE.Group();
  object.position.set(c[0], 0, c[2]);
  for (const [k, acc] of Object.entries(A)) {
    const mesh = new THREE.Mesh(acc.geometry(), mats[k]);
    mesh.name = `pagoda-${k}`;
    object.add(mesh);
  }

  const bellMat = M.bronze.clone();
  bellMat.vertexColors = true;
  const chimes = buildChimes(p.chimes.map((m) => [m.position[0] - c[0], m.position[1], m.position[2] - c[2]]), bellMat, M.bronze, rng.fork('chimes'));
  for (const m of chimes.meshes) object.add(m);
  return { object, update: chimes.update };
}
