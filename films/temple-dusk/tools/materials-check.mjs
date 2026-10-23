import assert from 'node:assert/strict';
import * as THREE from 'three';
import { M } from '../src/materials.js';

let count = 0;
for (const material of Object.values(M)) {
  if (!material.roughnessMap) continue;
  const { map, roughnessMap } = material;
  assert.notEqual(map.source, roughnessMap.source, `${material.name}: colour and roughness need independent Sources`);
  assert.notEqual(map.image.data, roughnessMap.image.data, `${material.name}: independent pixel arrays`);
  assert.equal(map.colorSpace, THREE.SRGBColorSpace, `${material.name}: colour is sRGB`);
  assert.equal(roughnessMap.colorSpace, THREE.NoColorSpace, `${material.name}: roughness is linear`);
  count++;
}
assert.ok(count > 0, 'The upgraded surfaces must include roughness maps.');
console.log(`materials ok: ${count} independent colour/roughness pairs`);
