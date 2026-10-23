// Static rules for src/: deterministic, code-only, zones stay in their lane.
//   node tools/check.mjs          exit 1 on any violation
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './serve.mjs';

const SRC = join(ROOT, 'src');
const files = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p); else if (p.endsWith('.js')) files.push(p);
  }
}
await walk(SRC);

const banned = [
  [/Math\.random\s*\(/, 'Math.random: use the seeded rng from ctx / rng.js'],
  [/Date\.now\s*\(|new Date\s*\(/, 'wall clock: animate from the film time t only'],
  [/\b(TextureLoader|ImageLoader|ImageBitmapLoader|CubeTextureLoader|GLTFLoader|OBJLoader|FBXLoader|RGBELoader|EXRLoader|KTX2Loader|FileLoader)\b/, 'loader: no external models, textures or photos'],
  [/\.(png|jpe?g|webp|gif|glb|gltf|obj|fbx|hdr|exr|ktx2)['"`]/i, 'asset file reference: everything is generated in code'],
  [/\bfetch\s*\(|new Image\s*\(/, 'network/image load: everything is generated in code'],
];
const SHARED = ['src/layout.js', 'src/materials.js', 'src/rng.js'];

const problems = [];
for (const f of files) {
  const rel = relative(ROOT, f);
  const text = await readFile(f, 'utf8');
  const syntax = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (syntax.status !== 0) problems.push(`${rel}  syntax error:\n${syntax.stderr.trim().split('\n').slice(0, 4).join('\n')}`);
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    for (const [re, why] of banned) if (re.test(code)) problems.push(`${rel}:${i + 1}  ${why}\n    ${line.trim()}`);
  });
  if (rel.startsWith('src/zones/')) {
    // A zone may import three, the shared modules, and its own files
    // (src/zones/<zone>.js and src/zones/<zone>/...).
    const zone = rel.slice('src/zones/'.length).split(/[/.]/)[0];
    for (const m of text.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? m[2];
      if (spec === 'three' || spec.startsWith('three/addons/')) continue;
      const target = relative(ROOT, resolve(dirname(f), spec));
      const own = target === `src/zones/${zone}.js` || target.startsWith(`src/zones/${zone}/`);
      if (!own && !SHARED.includes(target)) problems.push(`${rel}  imports ${spec} (${target}): a zone may import three, src/layout.js, src/materials.js, src/rng.js or its own files`);
    }
  }
}
if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`check ok: ${files.length} files`);
