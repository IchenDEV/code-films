// Ten shots, seven seconds each. Every shot opens on a close-up of one small
// object, holds there, then pulls back faster and faster to reveal its part of
// the temple, and eases into its last frame. The last shot rises from a backlit
// maple leaf cluster to a top-down aerial view of the whole compound.
//
// Camera targets come from layout.anchors; nothing here invents a coordinate
// for an object. End framings are free camera choices, chosen against the plan.

import { layout } from './layout.js';

const A = layout.anchors;
const { shotSec } = layout.film;

const HOLD = 0.16; // share of the shot spent resting on the close-up
const HOLD_DRIFT = 0.012; // progress made during the hold (a slow creep, not a freeze)

// Asymmetric sigmoid: gentle start, fast middle, long soft landing.
function pullCurve(u) {
  const a = u ** 2.1;
  const b = (1 - u) ** 3.2;
  return a / (a + b);
}

export function progress(s) {
  if (s <= HOLD) return HOLD_DRIFT * (s / HOLD);
  return HOLD_DRIFT + (1 - HOLD_DRIFT) * pullCurve((s - HOLD) / (1 - HOLD));
}

const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((x, i) => lerp(x, b[i], t));
const sub = (a, b) => a.map((x, i) => x - b[i]);

function slerp(a, b, t) {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const th = Math.acos(d);
  if (th < 1e-4) return lerp3(a, b, t);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
  return norm(a.map((x, i) => x * wa + b[i] * wb));
}

// A shot: start = close-up (target anchor, direction from target to camera,
// distance, fov). end = wide framing (camera position, look target, fov).
// focus: how long the look target stays on the anchor (exponent on progress).
const shots = [
  {
    name: '山门 · 红灯笼', // gate chochin -> the gate from the outer approach
    target: () => A.gateChochin,
    start: { dir: [0.28, -0.22, 1], dist: 1.75, fov: 34 },
    end: { position: [0.8, 2.1, 96], target: [0, 5.4, 62], fov: 38 },
  },
  {
    name: '石灯笼', // stone lantern -> the approach, pond and hall beyond
    target: () => A.pathLantern,
    start: { dir: [0.62, 0.08, 0.78], dist: 1.05, fov: 34 },
    end: { position: [6.5, 3.4, 56], target: [0, 3.2, 8], fov: 42 },
  },
  {
    name: '莲花', // lotus -> lotus bed, bridge, hall
    target: () => A.heroLotus,
    start: { dir: [0.35, 0.5, 0.79], dist: 0.75, fov: 32 },
    end: { position: [17, 3.4, 39], target: [1, 2.0, 16], fov: 42 },
  },
  {
    name: '锦鲤', // koi -> the bridge against the sunset, from the water
    target: (t) => layout.heroKoiAt(t).position,
    start: { dir: [0.75, 0.62, -0.2], dist: 1.1, fov: 34 },
    end: { position: [15, 2.4, 12.5], target: [0, 2.6, 21], fov: 44 },
  },
  {
    name: '擬宝珠', // bronze bridge finial -> along the bridge to the hall
    target: () => A.bridgeGiboshi,
    start: { dir: [0.62, 0.22, 0.75], dist: 0.85, fov: 32 },
    end: { position: [6.5, 3.2, 41], target: [0, 5.0, -2], fov: 40 },
  },
  {
    name: '吊灯笼', // hanging bronze lantern -> the hall facade
    target: () => A.hallLantern,
    start: { dir: [-0.35, -0.12, 0.93], dist: 0.95, fov: 34 },
    end: { position: [-15, 3.6, 5], target: [0, 7.0, -18], fov: 42 },
  },
  {
    name: '佛像面部', // Buddha's face -> out through the open bay
    target: () => A.buddhaFace,
    start: { dir: [0.12, -0.04, 1], dist: 1.7, fov: 30 },
    end: { position: [0, 6.0, 6], target: [0, 6.4, -20], fov: 40 },
  },
  {
    name: '风铃', // pagoda wind chime -> the pagoda from the south-west
    target: () => A.pagodaChime,
    start: { dir: [-0.55, -0.12, 0.83], dist: 0.55, fov: 32 },
    end: { position: [6, 5, 26], target: [29, 15, -4], fov: 42 },
  },
  {
    name: '相轮', // pagoda finial rings -> pagoda against the sunset
    target: () => A.sorinRings,
    start: { dir: [0.45, -0.06, 0.89], dist: 3.2, fov: 30 },
    end: { position: [60, 32, 6], target: [16, 14, -6], fov: 42 },
  },
  {
    name: '逆光枫叶', // backlit maple -> top-down aerial of the whole compound
    target: () => A.heroMapleLeaves,
    start: { dir: [0.9, -0.12, -0.42], dist: 0.85, fov: 34 },
    end: { position: [6, 150, 84], target: [0, 0, 4], fov: 42 },
    focus: 1.3,
  },
];

export const shotList = shots.map((s, i) => ({ index: i, name: s.name, startSec: i * shotSec }));

// Camera for shot i at local time s in [0, 1].
export function shotCamera(i, s, t) {
  const shot = shots[i];
  const p = progress(s);
  const anchor = shot.target(t);
  const target = lerp3(anchor, shot.end.target, p ** (shot.focus ?? 1.6));
  const startDir = norm(shot.start.dir);
  const endOffset = sub(shot.end.position, shot.end.target);
  const endDist = Math.hypot(...endOffset);
  const dir = slerp(startDir, norm(endOffset), p);
  const dist = Math.exp(lerp(Math.log(shot.start.dist), Math.log(endDist), p));
  const position = target.map((x, k) => x + dir[k] * dist);
  return { position, target, fov: lerp(shot.start.fov, shot.end.fov, p) };
}

// Camera at film time t (seconds).
export function cameraAt(t) {
  const i = Math.min(shots.length - 1, Math.max(0, Math.floor(t / shotSec)));
  const s = Math.min(1, Math.max(0, (t - i * shotSec) / shotSec));
  return shotCamera(i, s, t);
}
