// Validate the upgraded lighting and seek-safe SSAA using actual rendered PNGs.
//   node tools/lighting-review.mjs previews/quality-v3/checks
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openTemple } from './browser.mjs';

const out = process.argv[2];
if (!out) throw new Error('Pass the output directory.');
await mkdir(out, { recursive: true });
const temple = await openTemple({ width: 480, height: 270, params: { scale: '1', samples: '4' } });
try {
  const initialFill = await temple.page.evaluate(() => {
    const { scene } = window.__temple.world;
    return {
      environment: scene.environmentIntensity,
      sky: Array.from({ length: 4 }, (_, i) => scene.getObjectByName(`sky-fill-${i}`).intensity),
      ground: scene.getObjectByName('ground-bounce').intensity,
    };
  });
  async function frame(name, t, fill = true) {
    const result = await temple.page.evaluate(({ t, fill, initialFill }) => {
      const { world, renderAt, frameDataURL } = window.__temple;
      world.scene.environmentIntensity = fill ? initialFill.environment : 0.85;
      for (let i = 0; i < 4; i++) world.scene.getObjectByName(`sky-fill-${i}`).intensity = fill ? initialFill.sky[i] : 0;
      world.scene.getObjectByName('ground-bounce').intensity = fill ? initialFill.ground : 0;
      renderAt(t);
      return { png: frameDataURL('image/png'), view: world.camera.view, stats: world.stats() };
    }, { t, fill, initialFill });
    const png = Buffer.from(result.png.split(',')[1], 'base64');
    assert.equal(png.readUInt32BE(16), 480);
    assert.equal(png.readUInt32BE(20), 270);
    assert.ok(!result.view?.enabled, 'Subpixel sampling must restore the camera projection.');
    await writeFile(join(out, `${name}.png`), png);
    console.log(name, createHash('sha256').update(png).digest('hex'));
    return { png, stats: result.stats };
  }

  const a = await frame('gate-a', 6.7);
  await frame('pond', 20.7);
  const b = await frame('gate-b', 6.7);
  assert.ok(a.png.equals(b.png), 'Same-time SSAA output must survive a different shot and water reflection.');
  const control = await frame('gate-unoccluded-fill', 6.7, false);
  assert.ok(!control.png.equals(a.png), 'Directional sky shadows must change the rendered image.');
  assert.equal(a.stats.samples, 4);
  assert.equal(a.stats.lighting.skyDirections, 4);
  if (temple.errors.length) throw new Error(temple.errors.join('\n'));
  await writeFile(join(out, 'verification.json'), JSON.stringify({
    deterministic: true, cameraRestored: true, lightingChangesImage: true, stats: a.stats,
  }, null, 2));
} finally {
  await temple.close();
}
