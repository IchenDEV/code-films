// Site plan: the single source of every coordinate in the scene.
//
// Units: metres. Axes: +X east, +Y up, +Z south (north is -Z). Ground inside
// the compound is y = 0. Azimuths are degrees clockwise from north.
//
// Zone builders, shots and tools read positions and sizes from here. Do not
// hard-code a world position anywhere else; derive it from this file. A zone may
// choose its own local detail (a bracket size, a petal count), but where a thing
// stands, how big its footprint is and where a camera target sits live here.

import { fbm2 } from './rng.js';

export const SEED = 'temple-dusk-v1';

const deg = Math.PI / 180;

// ---------------------------------------------------------------------------
// Sun and film
// ---------------------------------------------------------------------------

// West-south-west, about 7 degrees above the horizon, warm light.
const SUN_AZIMUTH = 247.5;
const SUN_ELEVATION = 7;

export const sun = {
  azimuthDeg: SUN_AZIMUTH,
  elevationDeg: SUN_ELEVATION,
  // Unit vector from the scene toward the sun.
  dir: [
    Math.sin(SUN_AZIMUTH * deg) * Math.cos(SUN_ELEVATION * deg),
    Math.sin(SUN_ELEVATION * deg),
    -Math.cos(SUN_AZIMUTH * deg) * Math.cos(SUN_ELEVATION * deg),
  ],
  color: [1.0, 0.62, 0.36], // linear RGB, warm
};

export const film = {
  durationSec: 70,
  shotCount: 10,
  shotSec: 7,
  fps: 30,
  width: 1920,
  height: 1080,
};

// ---------------------------------------------------------------------------
// Compound and terrain
// ---------------------------------------------------------------------------

// Earthen wall (tsuiji-bei) around the compound. The south wall is broken by
// the gate. Outer faces lie on these lines.
export const wall = {
  minX: -48, maxX: 48, minZ: -48, maxZ: 62,
  height: 2.6,
  thickness: 0.9,
  gateGapHalfWidth: 6.6, // |x| < this is open on the south wall (the gate fills it)
};

// Flat terrace that holds the compound. Outside it the ground rises to the
// north and east and falls away toward the sunset (west-south-west).
const FLAT = { minX: -56, maxX: 56, minZ: -56, maxZ: 70 };

export function terrainHeight(x, z) {
  const dx = Math.max(0, FLAT.minX - x, x - FLAT.maxX);
  const dz = Math.max(0, FLAT.minZ - z, z - FLAT.maxZ);
  const d = Math.hypot(dx, dz);
  if (d === 0) return pondDepthAt(x, z);
  // Bearing from the compound centre, clockwise from north.
  const az = Math.atan2(x, -(z - 7));
  const rise = Math.cos(az - 25 * deg); // +1 toward NNE, -1 toward SSW
  const ramp = Math.min(1, d / 30);
  const n = fbm2(x / 55, z / 55, 4, 7);
  if (rise > -0.15) {
    // Hills: up to ~60 m at 250 m out to the north.
    return ramp * (d * 0.07 + d * d * 0.0007) * (0.25 + 0.75 * (rise + 0.15) / 1.15) * (0.7 + 0.6 * n);
  }
  // Valley toward the sun: a gentle fall, so the low sun clears the horizon.
  return -ramp * Math.min(28, d * 0.09) * Math.min(1, (-rise - 0.15) / 0.4) * (0.8 + 0.4 * n);
}

// ---------------------------------------------------------------------------
// Lotus pond
// ---------------------------------------------------------------------------

export const pond = {
  center: [0, 0, 20],
  radiusX: 26,
  radiusZ: 9,
  waterY: -0.35,
  floorY: -1.4,
  // Edge stones sit on this band around the waterline.
  bankWidth: 1.2,
  // Lotus beds (circles); keep the water near the bridge clear for koi and reflections.
  lotusBeds: [
    { center: [12.5, 0, 21.5], radius: 5.5 },
    { center: [-13, 0, 19], radius: 6.0 },
    { center: [21, 0, 18], radius: 3.0 },
  ],
  koiCount: 14,
};

// Polar radius of the pond outline at angle theta (atan2(dz, dx) from centre).
// The wobble vanishes on the north-south axis, so the bridge span is exact.
export function pondRadiusAt(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const ellipse = 1 / Math.sqrt((c * c) / (pond.radiusX ** 2) + (s * s) / (pond.radiusZ ** 2));
  const w = c * c;
  return ellipse * (1 + 0.06 * Math.sin(3 * theta + 0.9) * w + 0.04 * Math.sin(5 * theta + 2.3) * w);
}

// Signed distance-like value: < 0 inside the water outline, > 0 outside (metres, approx).
export function pondEdgeDistance(x, z) {
  const dx = x - pond.center[0], dz = z - pond.center[2];
  const r = Math.hypot(dx, dz);
  return r - pondRadiusAt(Math.atan2(dz, dx));
}

// Ground height inside the terrace: 0, dipping to the pond floor inside the outline.
function pondDepthAt(x, z) {
  const e = pondEdgeDistance(x, z);
  if (e >= 0.4) return 0;
  // 0 at +0.4 m outside the outline, waterY at the outline, floorY 3 m in.
  if (e >= 0) return pond.waterY * (1 - e / 0.4) * 0.6;
  const t = Math.min(1, -e / 3);
  return pond.waterY * 0.6 + (pond.floorY - pond.waterY * 0.6) * (t * t * (3 - 2 * t));
}

// Hero koi swims a fixed loop near the east side of the bridge; shot 3 follows it.
// Returns position [x, y, z] and heading (radians, around +Y, 0 = facing +X).
export function heroKoiAt(t) {
  const period = 14;
  const a = (t / period) * Math.PI * 2;
  const cx = 4.6, cz = 17.2, rx = 2.6, rz = 1.5;
  const x = cx + rx * Math.cos(a);
  const z = cz + rz * Math.sin(a);
  const vx = -rx * Math.sin(a), vz = rz * Math.cos(a);
  return { position: [x, pond.waterY - 0.22, z], heading: Math.atan2(-vz, vx) };
}

// ---------------------------------------------------------------------------
// Arched bridge (taikobashi), spans the pond north-south on the main axis
// ---------------------------------------------------------------------------

export const bridge = {
  center: [0, 0, 20],
  length: 22, // z from 9 to 31
  width: 3.2, // deck width
  rise: 3.4, // deck top above its ends at mid-span
  endDeckY: 0.25,
  railHeight: 1.0, // above deck
  // Railing posts with bronze giboshi caps: ends and quarter points, both sides.
  postZ: [9.4, 14.5, 25.5, 30.6],
};

export function bridgeDeckY(z) {
  const u = (z - bridge.center[2]) / (bridge.length / 2);
  return bridge.endDeckY + bridge.rise * (1 - u * u);
}

// Giboshi centre points (top of rail post) on both sides.
bridge.giboshi = bridge.postZ.flatMap((z) => [-1, 1].map((side) => [
  side * (bridge.width / 2 + 0.15), bridgeDeckY(z) + bridge.railHeight + 0.22, z,
]));

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

// Main hall (hondo), faces south. Stone podium, 7 x 4 bays, hip-and-gable roof.
export const hall = {
  center: [0, 0, -22],
  podium: { width: 28, depth: 20, height: 1.4 }, // x -14..14, z -32..-12
  bays: { x: [3.4, 3.4, 3.4, 3.4, 3.4, 3.4, 3.4], z: [3.5, 3.5, 3.5, 3.5] }, // column grid 23.8 x 14.0
  columnHeight: 6.2, // podium top to column top (y 1.4 .. 7.6)
  columnDiameter: 0.6,
  bracketTopY: 8.8,
  eaveY: 8.4, // lower edge of the eave at the mid-side
  eaveOverhang: 3.6, // from outer column line
  ridgeY: 16.5,
  ridgeHalfLength: 6.5,
  // Central bay of the front is fully open from the floor to the head beam;
  // nothing may block the line from the Buddha's face to the courtyard.
  openBay: { minX: -1.7, maxX: 1.7, headBeamY: 7.2 },
  steps: { width: 8, depth: 2.8, count: 7 }, // in front of the podium, z -12 .. -9.2
  buddha: {
    pedestalCenter: [0, 1.4, -25.5],
    pedestalHeight: 1.3,
    seatedHeight: 3.5, // pedestal top to the top of the head
    faceCenter: [0, 5.35, -25.1], // faces +Z
    haloRadius: 2.2,
  },
  // Bronze hanging lanterns under the front eave (centre of the lantern body).
  lanterns: [[-5.1, 6.7, -13.4], [5.1, 6.7, -13.4]],
  // Gilded ridge-end ornaments (shibi), centre points.
  shibi: [[-6.5, 17.6, -22], [6.5, 17.6, -22]],
  // Candles on the altar; small warm point lights live here.
  altarLights: [[-1.6, 3.1, -23.6], [1.6, 3.1, -23.6]],
};

// Gate (sanmon), on the south wall line, faces south. Three bays, centre open.
export const gate = {
  center: [0, 0, 62],
  bays: { x: [4.0, 4.4, 4.0], z: [3.0, 3.0] }, // 12.4 x 6.0
  platformHeight: 0.45,
  columnHeight: 5.0, // platform top to column top
  columnDiameter: 0.55,
  eaveY: 6.0,
  eaveOverhang: 2.5,
  ridgeY: 11.0,
  ridgeHalfLength: 4.2,
  passage: { minX: -2.2, maxX: 2.2, clearY: 3.1 }, // open walkway through the centre bay
  // Large red paper lantern (chochin) hanging in the centre bay.
  chochin: { center: [0, 4.35, 62], height: 2.3, radius: 0.85 },
};

// Five-storey pagoda (goju-no-to), east of the axis so its long shadow falls
// outside the courtyard and its west face takes the sunset.
export const pagoda = {
  center: [30, 0, -4],
  base: { size: 9.6, height: 1.0 }, // stone platform, steps on the west side
  // Per storey: square body width, body base and top heights, eave line height,
  // eave half-span (from the pagoda axis to the eave edge at mid-side).
  storeys: [
    { width: 6.4, baseY: 1.0, topY: 4.6, eaveY: 5.0, eaveHalf: 5.5 },
    { width: 5.8, baseY: 6.3, topY: 9.0, eaveY: 9.4, eaveHalf: 5.1 },
    { width: 5.2, baseY: 10.6, topY: 13.2, eaveY: 13.6, eaveHalf: 4.7 },
    { width: 4.6, baseY: 14.8, topY: 17.3, eaveY: 17.7, eaveHalf: 4.3 },
    { width: 4.0, baseY: 18.9, topY: 21.3, eaveY: 21.7, eaveHalf: 3.9 },
  ],
  cornerLift: 0.55, // eave corner tips curl up by this much
  roofPeakY: 24.0,
  // Bronze-and-gold finial (sorin) from roof peak to the jewel tip.
  sorin: { baseY: 24.0, ringsFromY: 25.0, ringsToY: 29.5, ringCount: 9, topY: 33.0 },
};

// Wind chimes (futaku) hang under each eave corner: centre of the bell.
pagoda.chimes = pagoda.storeys.flatMap((s, storey) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => ({
  storey,
  corner: `${sz < 0 ? 'N' : 'S'}${sx < 0 ? 'W' : 'E'}`,
  position: [
    pagoda.center[0] + sx * (s.eaveHalf + 0.25),
    s.eaveY + pagoda.cornerLift - 0.75,
    pagoda.center[2] + sz * (s.eaveHalf + 0.25),
  ],
})));

// ---------------------------------------------------------------------------
// Ground features
// ---------------------------------------------------------------------------

// Stone-paved paths (centre line segments, metres wide).
export const paths = [
  { name: 'outer-approach', from: [0, 0, 100], to: [0, 0, 65.6], width: 3.6 },
  { name: 'inner-approach', from: [0, 0, 58.4], to: [0, 0, 31.2], width: 3.6 },
  { name: 'hall-approach', from: [0, 0, 8.8], to: [0, 0, -9.2], width: 3.6 },
  { name: 'pagoda-branch', from: [1.8, 0, -4], to: [25.2, 0, -4], width: 2.4 },
];

// Raked white gravel in front of the hall.
export const courtyard = { minX: -20, maxX: 20, minZ: -9.2, maxZ: 6 };

// Stone lanterns (kasuga-doro), ~2.3 m tall. Position is the foot; the lit
// firebox centre is 1.45 m above it.
export const stoneLanterns = [
  [-3.4, 0, 52], [3.4, 0, 52],
  [-3.4, 0, 40], [3.4, 0, 40],
  [-3.2, 0, 5], [3.2, 0, 5],
  [-5.8, 0, -7.4], [5.8, 0, -7.4],
  [23.6, 0, -1.2],
  // Outer approach, outside the gate.
  [-3.4, 0, 74], [3.4, 0, 74],
  [-3.4, 0, 86], [3.4, 0, 86],
];
export const stoneLanternFireboxHeight = 1.45;

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------

// Hand-placed trees inside the wall. Position is the trunk foot.
// height: total height; crown: crown radius.
export const trees = [
  // Japanese maples, autumn red. The first is the hero maple of the last shot.
  { kind: 'maple', position: [18, 0, 31], height: 7.5, crown: 4.5, hero: true },
  { kind: 'maple', position: [-15, 0, 33], height: 6.0, crown: 3.5 },
  { kind: 'maple', position: [22, 0, 8], height: 6.5, crown: 3.8 },
  { kind: 'maple', position: [-24, 0, 7], height: 6.0, crown: 3.5 },
  { kind: 'maple', position: [-19, 0, -14], height: 5.5, crown: 3.2 },
  { kind: 'maple', position: [18, 0, -36], height: 7.0, crown: 4.0 },
  { kind: 'maple', position: [-20, 0, -38], height: 6.5, crown: 3.8 },
  { kind: 'maple', position: [40, 0, -18], height: 6.0, crown: 3.5 },
  { kind: 'maple', position: [-38, 0, -22], height: 6.0, crown: 3.5 },
  { kind: 'maple', position: [12.5, 0, 43.5], height: 5.0, crown: 3.0 },
  { kind: 'maple', position: [43, 0, -8], height: 5.5, crown: 3.2 },
  // Black pines, dark and sculpted.
  { kind: 'pine', position: [-7, 0, 46], height: 8, crown: 4.0 },
  { kind: 'pine', position: [12, 0, 54], height: 7, crown: 3.6 },
  { kind: 'pine', position: [-14, 0, 57], height: 9, crown: 4.5 },
  { kind: 'pine', position: [26, 0, 42], height: 8, crown: 4.0 },
  { kind: 'pine', position: [-34, 0, 34], height: 9, crown: 4.5 },
  { kind: 'pine', position: [36, 0, 26], height: 8, crown: 4.0 },
  // Ginkgo (icho), autumn gold, near the hall and the west lawn.
  { kind: 'ginkgo', position: [24, 0, -28], height: 12, crown: 4.2 },
  { kind: 'ginkgo', position: [-36, 0, 12], height: 13, crown: 4.5 },
  { kind: 'ginkgo', position: [-26, 0, 50], height: 11, crown: 4.0 },
  // More maples to thicken the garden.
  { kind: 'maple', position: [-30, 0, 24], height: 5.5, crown: 3.2 },
  { kind: 'maple', position: [30, 0, 30], height: 6.0, crown: 3.4 },
  { kind: 'maple', position: [-8, 0, -38], height: 6.5, crown: 3.6 },
  { kind: 'maple', position: [42, 0, 0], height: 5.5, crown: 3.0 },
  { kind: 'maple', position: [-42, 0, 44], height: 6.0, crown: 3.4 },
  // Cedar avenue (sando) lining the outer approach.
  ...[70, 78, 86, 94, 102].flatMap((z, i) => [-1, 1].map((sx) => ({
    kind: 'cedar', position: [sx * (8.6 + (i % 2) * 0.8), 0, z + (sx > 0 ? 1.5 : 0)], height: 21 + ((i + (sx > 0 ? 1 : 0)) % 3) * 2.5, crown: 2.4,
  }))),
  // Cedars (sugi) in a grove behind the hall.
  ...[-38, -30, -22, -14, -6, 2, 10, 18, 26, 34, 41].map((x, i) => ({
    kind: 'cedar', position: [x, 0, -43 - (i % 2) * 2.5], height: 18 + (i % 3) * 3, crown: 2.6,
  })),
];

// The hero maple's backlit leaf cluster: the tip of one long branch that
// reaches north-north-west out of the crown, over the pond edge, about 0.9 m
// beyond the crown. The last shot opens on it from the east-north-east, looking
// toward the sun, so only sky and water lie behind the leaves.
export const heroMapleLeaves = [16.0, 4.8, 26.0];

// Forest outside the wall. Trees fill the ring between the wall and
// outerRadius, but the sector toward the sun stays clear out to clearRadius so
// the low sun reaches the compound.
export const forest = {
  center: [0, 0, 7],
  wallMargin: 4, // keep this far outside the wall
  outerRadius: 230,
  sunSector: { fromAzimuth: 205, toAzimuth: 290, clearRadius: 320 },
  approachClearHalfWidth: 16, // along the outer approach (x near 0, z > 62); the cedar avenue lives here
};

// ---------------------------------------------------------------------------
// Precinct furniture (precinct zone): bell tower, incense burner, water basin,
// stone pagodas, bamboo fences
// ---------------------------------------------------------------------------

export const precinct = {
  // Open bell tower (shoro) on the east lawn: four splayed posts on a stone base,
  // hip-and-gable roof, a bronze bell hanging in the middle.
  bellTower: { center: [39, 0, 16], base: 5.6, baseHeight: 0.8, postSpan: 3.6, eaveY: 6.4, ridgeY: 8.6, bellCenter: [39, 3.9, 16], bellHeight: 1.6 },
  // Bronze incense burner (jokoro) on the hall approach, smoke rising.
  incenseBurner: { center: [0, 0, -3.2], height: 1.75, radius: 0.75 },
  // Stone water basin (chozubachi) with a bamboo spout, by the bridge's north end.
  basin: { center: [-9, 0, 7.5], radius: 0.65 },
  // Small stone pagodas (gorinto / hokyointo) in the north-west corner.
  stonePagodas: [[-44, 0, -14], [-45.2, 0, -11.4], [-43.6, 0, -9.2], [-45.4, 0, -7]],
  // Four-eyed bamboo fences (yotsume-gaki): centre lines, 1.1 m high.
  fences: [
    { from: [-5.6, 0, 57.5], to: [-5.6, 0, 34] }, { from: [5.6, 0, 57.5], to: [5.6, 0, 34] },
    { from: [-6, 0, 104], to: [-6, 0, 66] }, { from: [6, 0, 104], to: [6, 0, 66] },
  ],
  fenceHeight: 1.1,
};

// ---------------------------------------------------------------------------
// Garden planting (garden zone): bamboo groves, clipped shrubs, grass
// ---------------------------------------------------------------------------

export const garden = {
  bambooGroves: [
    { center: [37, 0, 52], radiusX: 8.5, radiusZ: 6.5, count: 230 }, // inside the SE corner
    { center: [-40, 0, -33], radiusX: 5.5, radiusZ: 7.5, count: 160 }, // inside the NW corner
  ],
  shrubClusters: 46, // clipped azalea / boxwood mounds (karikomi)
  grassTufts: 30000, // inside the wall and along the outer approach
  outerField: { minX: -26, maxX: 26, minZ: 62, maxZ: 108 }, // grass band outside the gate
};

// ---------------------------------------------------------------------------
// Camera targets for the ten shots (see shots.js)
// ---------------------------------------------------------------------------

export const anchors = {
  pathLantern: [stoneLanterns[3][0], stoneLanternFireboxHeight, stoneLanterns[3][2]],
  gateChochin: gate.chochin.center,
  heroLotus: [12.2, pond.waterY + 0.75, 24.6], // flower centre; pond.js puts the hero flower here
  bridgeGiboshi: bridge.giboshi[7], // east side, south end
  hallLantern: hall.lanterns[0],
  buddhaFace: hall.buddha.faceCenter,
  pagodaChime: pagoda.chimes.find((c) => c.storey === 1 && c.corner === 'SW').position,
  sorinRings: [pagoda.center[0], (pagoda.sorin.ringsFromY + pagoda.sorin.ringsToY) / 2, pagoda.center[2]],
  hallShibi: hall.shibi[0],
  heroMapleLeaves,
  compoundCenter: [0, 0, 12],
};

// ---------------------------------------------------------------------------
// Keep-out test for scattering (trees, rocks, moss tufts)
// ---------------------------------------------------------------------------

function rectHit(x, z, minX, maxX, minZ, maxZ, r) {
  return x > minX - r && x < maxX + r && z > minZ - r && z < maxZ + r;
}

function segDist(x, z, a, b) {
  const vx = b[0] - a[0], vz = b[2] - a[2];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[2]) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(x - (a[0] + vx * t), z - (a[2] + vz * t));
}

// True when a circle of radius r at (x, z) touches no building, path, water,
// bridge, lantern or hand-placed tree trunk.
export function isClear(x, z, r = 0) {
  const hc = hall.center, hp = hall.podium;
  if (rectHit(x, z, hc[0] - hp.width / 2, hc[0] + hp.width / 2, hc[2] - hp.depth / 2, hc[2] + hp.depth / 2 + hall.steps.depth, r + 1)) return false;
  const gc = gate.center;
  if (rectHit(x, z, gc[0] - 6.2 - 2.5, gc[0] + 6.2 + 2.5, gc[2] - 3 - 2.5, gc[2] + 3 + 2.5, r)) return false;
  const pc = pagoda.center, ps = pagoda.base.size / 2;
  if (rectHit(x, z, pc[0] - ps, pc[0] + ps, pc[2] - ps, pc[2] + ps, r + 1)) return false;
  if (rectHit(x, z, -bridge.width, bridge.width, bridge.center[2] - bridge.length / 2, bridge.center[2] + bridge.length / 2, r)) return false;
  if (pondEdgeDistance(x, z) < r + pond.bankWidth) return false;
  if (rectHit(x, z, courtyard.minX, courtyard.maxX, courtyard.minZ, courtyard.maxZ, r)) return false;
  for (const p of paths) if (segDist(x, z, p.from, p.to) < p.width / 2 + r + 0.5) return false;
  for (const l of stoneLanterns) if (Math.hypot(x - l[0], z - l[2]) < r + 1) return false;
  for (const t of trees) if (Math.hypot(x - t.position[0], z - t.position[2]) < r + 1.2) return false;
  const bt = precinct.bellTower;
  if (rectHit(x, z, bt.center[0] - bt.base / 2, bt.center[0] + bt.base / 2, bt.center[2] - bt.base / 2, bt.center[2] + bt.base / 2, r + 0.5)) return false;
  for (const c of [precinct.incenseBurner, precinct.basin]) if (Math.hypot(x - c.center[0], z - c.center[2]) < r + c.radius + 0.6) return false;
  for (const p of precinct.stonePagodas) if (Math.hypot(x - p[0], z - p[2]) < r + 0.9) return false;
  for (const f of precinct.fences) if (segDist(x, z, f.from, f.to) < r + 0.3) return false;
  return true;
}

export const layout = {
  SEED, sun, film, wall, terrainHeight, pond, pondRadiusAt, pondEdgeDistance, heroKoiAt,
  bridge, bridgeDeckY, hall, gate, pagoda, paths, courtyard, stoneLanterns, garden, precinct,
  stoneLanternFireboxHeight, trees, heroMapleLeaves, forest, anchors, isClear,
};
export default layout;
