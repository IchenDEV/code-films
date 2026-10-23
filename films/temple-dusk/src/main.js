// Entry point. Query parameters:
//   w, h        canvas size in CSS pixels (default film size)
//   zones       comma list of zones to build (default all six)
//   bloom=0     disable bloom;  msaa=N  MSAA samples (default 4)
//   scale=N     internal render resolution multiplier (default 1.5)
//   samples=N   fixed subpixel samples per frame: 1, 2, 4, 8, 16, 32 (default 4)
//   lighting=0  disable directional sky shadows and ground bounce for review
//   t           film time in seconds;  play=1  run in real time (browser preview)
// The page exposes window.__temple for the still/render tools.

import { createWorld, ZONES } from './world.js';
import { cameraAt } from './shots.js';
import { layout } from './layout.js';

const q = new URLSearchParams(location.search);
const samples = Number(q.get('samples') ?? 4);
if (![1, 2, 4, 8, 16, 32].includes(samples)) throw new Error('samples must be 1, 2, 4, 8, 16 or 32.');
const width = Number(q.get('w') ?? layout.film.width);
const height = Number(q.get('h') ?? layout.film.height);
const zones = q.get('zones') === 'none' ? [] : q.get('zones') ? q.get('zones').split(',').filter(Boolean) : ZONES;

const canvas = document.getElementById('c');
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

const world = await createWorld({
  canvas, width, height, zones,
  bloom: q.get('bloom') !== '0',
  msaa: Number(q.get('msaa') ?? 4),
  shadowSize: Number(q.get('shadow') ?? 4096),
  renderScale: Number(q.get('scale') ?? 1.5),
  lighting: q.get('lighting') !== '0',
  samples,
});

// Render film time t. cam overrides the shot camera: { position, target, fov, near, roll }.
function renderAt(t, cam) {
  world.setTime(t);
  world.setCamera(cam ?? cameraAt(t));
  world.render();
}

function frameDataURL(type = 'image/jpeg', quality = 0.95) {
  return canvas.toDataURL(type, quality);
}

window.__temple = { renderAt, frameDataURL, stats: world.stats, layout, world, ready: true };

if (q.get('play') === '1') {
  const start = performance.now() - Number(q.get('t') ?? 0) * 1000;
  const loop = () => {
    renderAt(((performance.now() - start) / 1000) % layout.film.durationSec);
    requestAnimationFrame(loop);
  };
  loop();
} else {
  renderAt(Number(q.get('t') ?? 0));
}
