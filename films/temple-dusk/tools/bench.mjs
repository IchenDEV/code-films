// Render-speed benchmark on a synthetic scene (independent of the zone files).
//   node tools/bench.mjs --w 960 --h 540 --msaa 0 --bloom 1 --gl swiftshader|egl --tris 600000 --repeat 3
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
  return acc;
}, []));
const w = Number(args.w ?? 960), h = Number(args.h ?? 540);
const gl = args.gl ?? 'swiftshader';
const glArgs = {
  swiftshader: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  egl: ['--use-angle=gl-egl', '--use-gl=angle', '--ignore-gpu-blocklist'],
  gl: ['--use-angle=gl', '--use-gl=angle', '--ignore-gpu-blocklist'],
}[gl];
const server = await startServer(0);
const browser = await chromium.launch({ args: [...glArgs, '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const q = new URLSearchParams({ w, h, zones: 'none', msaa: args.msaa ?? '0', bloom: args.bloom ?? '1', shadow: args.shadow ?? '4096' });
await page.goto(`${server.url}/index.html?${q}`, { timeout: 600_000 });
await page.waitForFunction(() => window.__temple?.ready === true, null, { timeout: 600_000 });
const info = await page.evaluate(async (tris) => {
  const THREE = await import('three');
  const { scene, renderer } = window.__temple.world;
  const g = renderer.getContext();
  const ext = g.getExtension('WEBGL_debug_renderer_info');
  const mats = [0xb8331d, 0x4b5058, 0x8c877e, 0x5c3f2a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300).rotateX(-Math.PI / 2), mats[2]);
  ground.receiveShadow = true; scene.add(ground);
  const geo = new THREE.TorusKnotGeometry(1.2, 0.4, 128, 16); // 4096 tris
  const per = geo.index.count / 3;
  const n = Math.ceil(tris / per);
  for (let k = 0; k < 4; k++) {
    const im = new THREE.InstancedMesh(geo, mats[k], Math.ceil(n / 4));
    const m = new THREE.Matrix4();
    for (let i = 0; i < im.count; i++) {
      const a = i * 2.399 + k, r = 4 + Math.sqrt(i * 4 + k) * 3;
      m.makeTranslation(Math.cos(a) * r, 1.6 + (i % 5) * 2, Math.sin(a) * r);
      im.setMatrixAt(i, m);
    }
    im.castShadow = im.receiveShadow = true;
    scene.add(im);
  }
  return { renderer: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown', tris: n * per };
}, Number(args.tris ?? 600000));
console.log(`gl=${gl} ${w}x${h} msaa=${q.get('msaa')} bloom=${q.get('bloom')} tris=${info.tris}  renderer: ${info.renderer}`);
for (let i = 0; i < Number(args.repeat ?? 3); i++) {
  const t0 = Date.now();
  await page.evaluate(() => { window.__temple.renderAt(1, { position: [40, 25, 60], target: [0, 2, 0], fov: 45 }); window.__temple.frameDataURL('image/jpeg', 0.95); });
  console.log(`  render ${i + 1}: ${Date.now() - t0} ms`);
}
if (errs.length) console.log(errs.slice(0, 5).join('\n'));
await browser.close(); server.close();
