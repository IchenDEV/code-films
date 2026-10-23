// Precinct furniture: bell tower with its bronze bell, incense burner with smoke, stone
// water basin with a bamboo spout, moss-covered stone pagodas and four-eyed bamboo fences.
// All positions come from layout.precinct. Static parts of one material are merged into one
// mesh; repeated bamboo is instanced; the bell, the striking log, the smoke and the water
// move as pure functions of the film time.
import * as THREE from 'three';
import { MATERIAL_KEYS, accSet } from './precinct/kit.js';
import { buildBellTower } from './precinct/bellTower.js';
import { buildBurner } from './precinct/burner.js';
import { buildBasin } from './precinct/basin.js';
import { buildPagodas, placePagodas } from './precinct/pagodas.js';
import { buildFences } from './precinct/fences.js';
import { buildSmoke } from './precinct/smoke.js';
import { buildBasinWater } from './precinct/water.js';

export function build({ layout, M, rng }) {
  const P = layout.precinct;
  const object = new THREE.Group();
  const S = accSet();
  // Moss-stained stone for the pagodas: greener and darker than the shared weathered stone.
  const mats = { ...M, moss: M.stoneMoss.clone() };
  mats.moss.color.set('#6c7650');

  // Bell tower, with the swinging bell and striking log as their own meshes.
  const [tx, , tz] = P.bellTower.center;
  const tower = accSet();
  const bellParts = buildBellTower({ layout, S: tower });
  for (const k of MATERIAL_KEYS) S[k].absorb(tower[k], tx, 0, tz);
  const bell = new THREE.Mesh(bellParts.bellGeo, M.bronze);
  const log = new THREE.Mesh(bellParts.logGeo, M.woodRaw);
  bell.name = 'bell';
  log.name = 'striking-log';
  const bellPivot = new THREE.Group(), logPivot = new THREE.Group();
  bellPivot.position.set(tx + bellParts.pivot[0], bellParts.pivot[1], tz + bellParts.pivot[2]);
  logPivot.position.copy(bellPivot.position);
  bellPivot.add(bell);
  logPivot.add(log);
  object.add(bellPivot, logPivot);

  // Incense burner and its smoke.
  const [bx, , bz] = P.incenseBurner.center;
  const burner = accSet();
  buildBurner({ layout, S: burner });
  for (const k of MATERIAL_KEYS) S[k].absorb(burner[k], bx, 0, bz);
  const smoke = buildSmoke({ layout, rng });
  object.add(smoke.mesh);

  // Water basin: static stone, bamboo pieces for the instanced bamboo, animated water.
  const [wx, , wz] = P.basin.center;
  const basin = accSet();
  const basinBamboo = [];
  buildBasin({ layout, S: basin, rng, bamboo: basinBamboo });
  for (const k of MATERIAL_KEYS) S[k].absorb(basin[k], wx, 0, wz);
  const shift = (p) => [p[0] + wx, p[1], p[2] + wz];
  const bamboo = basinBamboo.map((b) => ({ ...b, a: shift(b.a), b: shift(b.b) }));
  const water = buildBasinWater([wx, 0, wz]);
  object.add(water.group);

  // Stone pagodas and fences.
  placePagodas(S, buildPagodas({ layout, rng }), layout.terrainHeight);
  for (const mesh of buildFences({ layout, M, rng, bamboo })) object.add(mesh);

  for (const k of MATERIAL_KEYS) {
    const geo = S[k].geometry();
    const mesh = new THREE.Mesh(geo, mats[k]);
    mesh.name = `precinct-${k}`;
    object.add(mesh);
  }

  const update = (t) => {
    bellPivot.rotation.x = 0.008 * Math.sin((t / 5.6) * Math.PI * 2);
    logPivot.rotation.x = 0.012 * Math.sin((t / 4.3) * Math.PI * 2 + 1.1);
    smoke.update(t);
    water.update(t);
  };
  update(0);
  return { object, update };
}
