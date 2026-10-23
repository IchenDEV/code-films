// Seeded randomness. Every random value in the scene comes from here.
// Math.random is banned (tools/check.mjs enforces it), so a seed string fully
// determines the output: same seed, same temple, every render.

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32
export function createRng(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, maxInclusive) => min + Math.floor(next() * (maxInclusive - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    // Approximately normal, mean 0, sd 1.
    gauss: () => (next() + next() + next() + next() + next() + next() - 3) / 0.7071,
    fork: (label) => createRng(hashString(`${a}:${label}`)),
  };
}

// Stateless lattice hash in [0, 1). Same inputs, same output, any call order.
export function hash2(ix, iz, seed = 0) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Smooth 2D value noise in [0, 1).
export function valueNoise2(x, z, seed = 0) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

// Fractal value noise in roughly [0, 1).
export function fbm2(x, z, octaves = 4, seed = 0) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise2(x, z, seed + o * 101) * amp;
    norm += amp;
    x *= 2.03; z *= 2.03; amp *= 0.5;
  }
  return sum / norm;
}
