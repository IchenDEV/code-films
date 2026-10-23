// Lotus pond: reflective water, bank stones, lotus (leaves, flowers, pods, the hero flower) and koi.
// Parts live in src/zones/pond/. Layout gives every position; this file only assembles them.

import { fbm2, valueNoise2 } from '../rng.js';
import { buildWater } from './pond/water.js';
import { buildRocks } from './pond/rocks.js';
import { buildLotus } from './pond/lotus.js';
import { buildKoi } from './pond/koi.js';

export function build({ THREE, layout, M, rng, renderer }) {
  const noise = { fbm2, valueNoise2 };
  const timeUniform = { value: 0 };

  const water = buildWater({ layout, renderer, rng: rng.fork('water') });
  const rocks = buildRocks({ layout, M, rng: rng.fork('rocks'), noise });
  const lotus = buildLotus({ layout, M, rng: rng.fork('lotus'), noise, timeUniform });
  const koi = buildKoi({ layout, rng: rng.fork('koi'), timeUniform });

  const object = new THREE.Group();
  object.name = 'pond';
  object.add(water.water, rocks, lotus, ...koi.meshes);

  return {
    object,
    update(t) {
      timeUniform.value = t;
      water.update(t);
      koi.update(t);
    },
  };
}
