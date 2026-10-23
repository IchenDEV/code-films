// Renders the film: each shot to out/shots/shot-NN.mp4, then joins them.
//
//   node tools/render.mjs [--shots 1-10] [--w 1920 --h 1080] [--fps 30] [--crf 16]
//   node tools/render.mjs --clip 5.5,1.5 --tag roof-review --w 960 --h 540
//
// Frames are a pure function of film time, so shots render independently and
// a finished shot is skipped on re-run (delete its .done file to redo it).
// Run two workers on a 4-core box to fill the CPU; shots are claimed with .lock files
// (delete stale .lock files after an interrupted run).
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access, rm, open } from 'node:fs/promises';
import { join } from 'node:path';
import { openTemple } from './browser.mjs';
import { ROOT } from './serve.mjs';
import { layout } from '../src/layout.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] === undefined ? 'true' : arr[i + 1]]);
  return acc;
}, []));
const width = Number(args.w ?? layout.film.width), height = Number(args.h ?? layout.film.height);
const fps = Number(args.fps ?? layout.film.fps);
const crf = String(args.crf ?? 16);
const clip = args.clip?.split(',').map(Number);
if (clip && (clip.length !== 2 || !clip.every(Number.isFinite) || clip[0] < 0 || clip[1] <= 0 || clip[0] + clip[1] > layout.film.durationSec)) {
  throw new Error('--clip must be start,duration within the 70-second film.');
}
const [s0, s1] = (args.shots ?? `1-${layout.film.shotCount}`).split('-').map(Number);
const outDir = join(ROOT, 'out', args.tag ?? `${width}x${height}`);
const shotDir = join(outDir, 'shots');
await mkdir(shotDir, { recursive: true });
const exists = (p) => access(p).then(() => true, () => false);

function ffmpegWriter(file) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => ff.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exit ${code}`)))));
  return {
    write: (buf) => new Promise((ok) => (ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok))),
    end: async () => { ff.stdin.end(); await done; },
  };
}

let temple = null;
const jobs = clip
  ? [{ name: 'clip', start: clip[0], frames: Math.round(clip[1] * fps), directory: outDir }]
  : Array.from({ length: s1 - s0 + 1 }, (_, i) => ({
    name: `shot-${String(s0 + i).padStart(2, '0')}`,
    start: (s0 + i - 1) * layout.film.shotSec,
    frames: Math.round(layout.film.shotSec * fps), directory: shotDir,
  }));
for (const { name, start, frames, directory } of jobs) {
  const file = join(directory, `${name}.mp4`);
  if (await exists(`${file}.done`)) { console.log(`${name}: done, skipping`); continue; }
  // Several workers may share one output directory: the first to create the lock owns the shot.
  try { await (await open(`${file}.lock`, 'wx')).close(); } catch { console.log(`${name}: taken by another worker`); continue; }
  temple ??= await openTemple({ width, height, params: Object.fromEntries(
    ['scale', 'samples', 'lighting'].filter((key) => args[key] !== undefined).map((key) => [key, args[key]]),
  ) });
  const writer = ffmpegWriter(file);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const t = start + f / fps;
    // Keep the renderer output lossless until the final H.264 encode, so fine
    // foliage and roof lines do not receive a separate JPEG quantization step.
    const dataUrl = await temple.page.evaluate((tt) => { window.__temple.renderAt(tt); return window.__temple.frameDataURL('image/png'); }, t);
    await writer.write(Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
    if (f === 0 || f % 15 === 14) {
      const per = (Date.now() - t0) / (f + 1);
      console.log(`${name}: ${f + 1}/${frames}  ${(per / 1000).toFixed(2)} s/frame  eta ${((frames - f - 1) * per / 60000).toFixed(1)} min`);
    }
  }
  await writer.end();
  await writeFile(`${file}.done`, new Date().toISOString());
  await rm(`${file}.lock`);
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
if (temple?.errors.length) console.log('page messages:\n' + temple.errors.slice(0, 20).join('\n'));
await temple?.close();

// Join when every shot is present.
const all = [];
for (let shot = 1; shot <= layout.film.shotCount; shot++) all.push(join(shotDir, `shot-${String(shot).padStart(2, '0')}.mp4`));
if (!clip && (await Promise.all(all.map((f) => exists(`${f}.done`)))).every(Boolean)) {
  const list = join(outDir, 'concat.txt');
  await writeFile(list, all.map((f) => `file '${f}'`).join('\n'));
  const final = join(outDir, 'temple-dusk.mp4');
  await new Promise((ok, fail) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', final], { stdio: 'inherit' })
    .on('close', (c) => (c === 0 ? ok() : fail(new Error(`concat exit ${c}`)))));
  await rm(list);
  console.log(`film: ${final}`);
}
