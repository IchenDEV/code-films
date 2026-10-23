// Render stills for review.
//
//   node tools/still.mjs --out previews/x.png [--w 1280 --h 720]
//        [--zones pond,bridge]            build only these zones (default all)
//        [--cam x,y,z --look x,y,z --fov 40]   free camera
//        [--shot 3 --at 0,0.5,1]          shot index (1-10) at local progress 0..1 (several -> several files)
//        [--t 12.5]                       film time in seconds (animation clock; camera from shots unless --cam)
//        [--stats]                        print triangle counts and build times
//        [--jobs jobs.json]               several renders in one session: [{file, t, cam} | {file, shot, at}]
//        [--repeat N]                     render each job N times (timing)
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { openTemple } from './browser.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] === undefined ? 'true' : arr[i + 1]]);
  return acc;
}, []));
const num3 = (s) => s.split(',').map(Number);
const width = Number(args.w ?? 1280), height = Number(args.h ?? 720);
const out = args.out ?? 'previews/still.png';
const params = {};
if (args.zones) params.zones = args.zones;
if (args.bloom) params.bloom = args.bloom;
if (args.msaa) params.msaa = args.msaa;
if (args.shadow) params.shadow = args.shadow;
if (args.scale) params.scale = args.scale;
if (args.samples) params.samples = args.samples;
if (args.lighting) params.lighting = args.lighting;

const t0 = Date.now();
const temple = await openTemple({ width, height, params });
const tReady = Date.now();

const jobs = [];
if (args.jobs) {
  // [{ file, t, cam: { position, target, fov } } | { file, shot, at }]
  for (const j of JSON.parse(await readFile(args.jobs, 'utf8'))) {
    if (j.shot) jobs.push({ t: (j.shot - 1 + Math.min(j.at ?? 0, 0.9999)) * 7, cam: null, file: j.file });
    else jobs.push({ t: j.t ?? 0, cam: j.cam ?? null, file: j.file });
  }
} else if (args.shot) {
  const i = Number(args.shot) - 1;
  const ats = (args.at ?? '0,0.5,1').split(',').map(Number);
  for (const at of ats) {
    const t = (i + Math.min(at, 0.9999)) * 7;
    jobs.push({ t, cam: null, file: ats.length > 1 ? out.replace(/(\.\w+)$/, `-${String(at).replace('.', '_')}$1`) : out });
  }
} else {
  const t = Number(args.t ?? 0);
  const cam = args.cam ? { position: num3(args.cam), target: num3(args.look ?? '0,0,0'), fov: Number(args.fov ?? 40) } : null;
  jobs.push({ t, cam, file: out });
}

const repeat = Number(args.repeat ?? 1);
for (const job of jobs.flatMap((j) => Array.from({ length: repeat }, () => j))) {
  const r0 = Date.now();
  const dataUrl = await temple.page.evaluate(({ t, cam }) => {
    window.__temple.renderAt(t, cam ?? undefined);
    return window.__temple.frameDataURL('image/png');
  }, job);
  await mkdir(dirname(job.file), { recursive: true });
  await writeFile(job.file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`${job.file}  t=${job.t.toFixed(2)}s  render ${Date.now() - r0} ms`);
}
if (args.stats) console.log(JSON.stringify(await temple.page.evaluate(() => window.__temple.stats()), null, 1));
if (temple.errors.length) console.log('page messages:\n' + temple.errors.slice(0, 20).join('\n'));
console.log(`startup ${tReady - t0} ms`);
await temple.close();
