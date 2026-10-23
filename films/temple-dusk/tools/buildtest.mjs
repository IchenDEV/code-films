// Builds zones in plain Node (no WebGL) and prints mesh/triangle counts and build time.
//   node tools/buildtest.mjs garden trees ...
import * as THREE from 'three';
import assert from 'node:assert/strict';
import { ROOT as root } from './serve.mjs';
const { layout } = await import(root + '/src/layout.js');
const { M } = await import(root + '/src/materials.js');
const { createRng } = await import(root + '/src/rng.js');
for (const z of process.argv.slice(2)) {
  const t0 = Date.now();
  const mod = await import(`${root}/src/zones/${z}.js`);
  const r = mod.build({ THREE, layout, M, rng: createRng(`${layout.SEED}:${z}`), renderer: null });
  r.update?.(10);
  let tris = 0, meshes = 0;
  r.object.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    assert.ok(g.attributes.position.array.every(Number.isFinite), `${o.name}: finite positions`);
    if (o.isInstancedMesh) assert.ok(o.instanceMatrix.array.every(Number.isFinite), `${o.name}: finite transforms`);
    if (Array.isArray(o.material)) {
      assert.equal(g.groups.reduce((n, group) => n + group.count, 0), g.index.count, `${o.name}: all triangles assigned to materials`);
      for (const group of g.groups) assert.ok(o.material[group.materialIndex], `${o.name}: material group exists`);
    }
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
  });
  console.log(z, 'meshes', meshes, 'tris', Math.round(tris), 'ms', Date.now() - t0);
}
