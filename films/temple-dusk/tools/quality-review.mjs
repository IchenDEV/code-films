// Repeatable render review: identical input, quarter-pixel camera movement,
// and a bump-free control. Use before/after directories for comparisons.
//   node tools/quality-review.mjs <output-dir>
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { openTemple } from './browser.mjs';

const out = process.argv[2];
if (!out) throw new Error('Pass the output directory.');
await mkdir(out, { recursive: true });
const temple = await openTemple({ width: 960, height: 540 });
try {
  const inventory = await temple.page.evaluate(() => {
    const { scene, renderer } = window.__temple.world;
    const materials = new Map();
    scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.bumpMap || m.alphaTest) materials.set(m.uuid, {
          mesh: o.name, name: m.name, bumpScale: m.bumpMap ? m.bumpScale : null,
          alphaTest: m.alphaTest, alphaToCoverage: m.alphaToCoverage,
        });
      }
    });
    return { exposure: renderer.toneMappingExposure, stats: window.__temple.stats(), materials: [...materials.values()] };
  });
  await writeFile(join(out, 'inventory.json'), JSON.stringify(inventory, null, 2));

  async function frame(name, t, options = {}) {
    const started = Date.now();
    const result = await temple.page.evaluate(({ t, options }) => {
      const { world, renderAt, frameDataURL } = window.__temple;
      if (options.offset !== undefined) {
        world.setTime(t);
        const { camera, renderer } = world;
        const { width, height } = renderer.domElement;
        camera.setViewOffset(width, height, options.offset, 0, width, height);
        world.render();
        camera.clearViewOffset();
      } else renderAt(t);
      return frameDataURL('image/png');
    }, { t, options });
    const png = Buffer.from(result.slice(result.indexOf(',') + 1), 'base64');
    assert.equal(png.readUInt32BE(16), 960, 'Internal supersampling must preserve output width.');
    assert.equal(png.readUInt32BE(20), 540, 'Internal supersampling must preserve output height.');
    await writeFile(join(out, `${name}.png`), png);
    console.log(name, `${Date.now() - started}ms`, createHash('sha256').update(png).digest('hex'));
    return png;
  }

  const first = await frame('repeat-a', 6.7);
  await frame('water-visit', 25.5);
  const second = await frame('repeat-b', 6.7);
  const deterministic = first.equals(second);
  console.log('same-time-after-water', deterministic);
  for (const offset of [0.25, 0.5, 0.75]) await frame(`shift-${offset}`, 6.7, { offset });
  // Remove only bump amplitude, keeping geometry, light, camera and textures.
  await temple.page.evaluate(() => {
    window.__temple.world.scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.bumpMap) m.bumpScale = 0;
      }
    });
  });
  await frame('roof-bump-control', 6.7);
  await frame('roof-bump-control-shift', 6.7, { offset: 0.5 });
  await writeFile(join(out, 'determinism.json'), JSON.stringify({ deterministic }, null, 2));
  assert.ok(deterministic, 'A film frame must not depend on previous water/camera renders.');
  if (temple.errors.length) throw new Error(temple.errors.join('\n'));
} finally {
  await temple.close();
}
