// Granite path slabs and the courtyard kerb: bevelled slabs that follow the
// ground, merged into one vertex-coloured mesh on the shared stone material.
import { TriBuilder, smoothstep, mix3 } from './mesh.js';

const CHAMFER = 0.014;
const GAP = 0.03;

// One slab. corners: four [x, z] in order around the plan. topY(x, z) is the top
// height at a corner; the sides run down `drop` below it.
function slab(tb, corners, topY, tone, drop, grain) {
  const cx = corners.reduce((m, p) => m + p[0], 0) / 4;
  const cz = corners.reduce((m, p) => m + p[1], 0) / 4;
  const tilt = (grain() - 0.5) * 0.01;
  const outer = corners.map(([x, z]) => [x, topY(x, z) - CHAMFER + tilt * (x - cx), z]);
  const inner = corners.map(([x, z]) => {
    const k = CHAMFER / Math.hypot(x - cx, z - cz);
    return [x + (cx - x) * k * 1.0, topY(x, z) + tilt * (x - cx) + (grain() - 0.5) * 0.003, z + (cz - z) * k * 1.0];
  });
  const base = corners.map(([x, z], i) => [x, outer[i][1] - drop, z]);
  const edge = mix3(tone, [0.45, 0.43, 0.38], 0.5);
  const dark = mix3(tone, [0.3, 0.29, 0.26], 0.55);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const mx = (corners[i][0] + corners[j][0]) / 2 - cx, mz = (corners[i][1] + corners[j][1]) / 2 - cz;
    // Chamfer, then vertical side down into the earth.
    tb.quad(outer[i], outer[j], inner[j], inner[i], [mx, 1, mz], edge, edge, tone, tone);
    tb.quad(base[i], base[j], outer[j], outer[i], [mx, 0, mz], dark, dark, edge, edge);
  }
  tb.quad(inner[0], inner[1], inner[2], inner[3], [0, 1, 0], tone);
}

export function buildPaving({ layout, rng, noise, heightAt }) {
  const { fbm2 } = noise;
  const c = layout.courtyard;
  const inCourt = (x, z) => x > c.minX - 0.4 && x < c.maxX + 0.4 && z > c.minZ - 0.4 && z < c.maxZ + 0.4;
  const r = rng.fork('paving');
  const tb = new TriBuilder();

  const toneAt = (x, z) => {
    const v = 0.82 + 0.3 * r.next();
    const warm = (r.next() - 0.5) * 0.06;
    const n = fbm2(x * 0.8, z * 0.8, 3, 301);
    const moss = smoothstep(0.55, 0.8, n) * 0.5;
    return mix3([v + warm, v, v - warm], [0.5, 0.58, 0.34], moss);
  };

  // Paths: rows of slabs across the width, uneven lengths and widths.
  for (const p of layout.paths) {
    const dx = p.to[0] - p.from[0], dz = p.to[2] - p.from[2];
    const len = Math.hypot(dx, dz);
    const d = [dx / len, dz / len], n = [d[1], -d[0]];
    const P = (s, u) => [p.from[0] + d[0] * s + n[0] * u, p.from[2] + d[1] * s + n[1] * u];
    const lift = (x, z) => (inCourt(x, z) ? 0.075 : 0.03);
    const topY = (x, z) => heightAt(x, z) + lift(x, z);
    let s = 0;
    while (s < len - 0.05) {
      let ds = r.range(0.85, 1.55);
      if (len - (s + ds) < 0.6) ds = len - s;
      const cols = p.width > 3 ? r.pick([2, 3, 3]) : 2;
      const cuts = [0];
      for (let i = 1; i < cols; i++) cuts.push((i + r.range(-0.22, 0.22)) / cols);
      cuts.push(1);
      for (let i = 0; i < cols; i++) {
        const u0 = -p.width / 2 + p.width * cuts[i] + GAP / 2, u1 = -p.width / 2 + p.width * cuts[i + 1] - GAP / 2;
        // Stagger the row joint between neighbouring columns.
        const sj = i % 2 ? r.range(-0.18, 0.18) : 0;
        const a = Math.max(0, s + sj + GAP / 2), b = Math.min(len, s + ds + sj - GAP / 2);
        const tone = toneAt(...P((a + b) / 2, (u0 + u1) / 2));
        slab(tb, [P(a, u0), P(b, u0), P(b, u1), P(a, u1)], topY, tone, 0.08, r.next);
      }
      s += ds;
    }
  }

  // Kerb around the courtyard; the paths cross it.
  const gaps = {
    south: [[-1.8 - 0.05, 1.8 + 0.05]],
    north: [[-layout.hall.steps.width / 2 - 0.2, layout.hall.steps.width / 2 + 0.2]],
    east: [[-4 - 1.2 - 0.05, -4 + 1.2 + 0.05]],
    west: [],
  };
  const KW = 0.3, KH = 0.11;
  const kerbTop = (x, z) => heightAt(x, z) + KH;
  const runs = (lo, hi, cuts) => {
    const out = [];
    let a = lo;
    for (const [g0, g1] of [...cuts].sort((p, q) => p[0] - q[0])) { if (g0 > a) out.push([a, g0]); a = g1; }
    if (hi > a) out.push([a, hi]);
    return out;
  };
  const along = (lo, hi, make) => {
    for (const [a, b] of lo) {
      const n = Math.max(1, Math.round((b - a) / 1.2));
      for (let i = 0; i < n; i++) {
        const s0 = a + ((b - a) * i) / n + GAP / 2, s1 = a + ((b - a) * (i + 1)) / n - GAP / 2;
        make(s0, s1);
      }
    }
    return hi;
  };
  const kerbTone = () => { const v = 0.8 + 0.18 * r.next(); return [v, v, v * 0.97]; };
  for (const [side, lo, hi] of [['south', c.minX - KW, c.maxX + KW], ['north', c.minX - KW, c.maxX + KW], ['east', c.minZ, c.maxZ], ['west', c.minZ, c.maxZ]]) {
    along(runs(lo, hi, gaps[side]), hi, (s0, s1) => {
      let q;
      if (side === 'south') q = [[s0, c.maxZ], [s1, c.maxZ], [s1, c.maxZ + KW], [s0, c.maxZ + KW]];
      else if (side === 'north') q = [[s0, c.minZ - KW], [s1, c.minZ - KW], [s1, c.minZ], [s0, c.minZ]];
      else if (side === 'east') q = [[c.maxX, s0], [c.maxX + KW, s0], [c.maxX + KW, s1], [c.maxX, s1]];
      else q = [[c.minX - KW, s0], [c.minX, s0], [c.minX, s1], [c.minX - KW, s1]];
      slab(tb, q, kerbTop, kerbTone(), 0.12, r.next);
    });
  }

  const geo = tb.geometry(0.9);
  return geo;
}
