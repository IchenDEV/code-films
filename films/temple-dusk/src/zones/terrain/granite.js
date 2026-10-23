// Granite surface: one tiling speckle texture (colour) and a matching bump map.
// UVs on the lanterns and slabs are metres; the texture tiles every 0.5 m.
import * as THREE from 'three';
import { hash2 } from '../../rng.js';

const SIZE = 256;

export const GRANITE_TILE = 0.5;

export function buildGranite({ noise }) {
  const { fbm2 } = noise;
  const colour = new Uint8Array(SIZE * SIZE * 4);
  const height = new Uint8Array(SIZE * SIZE * 4);
  // Wrap-around noise by blending four offset samples.
  const tile = (u, v, f, oct, seed) => {
    const s = (a, b) => fbm2(a * f, b * f, oct, seed);
    return s(u, v) * (1 - u) * (1 - v) + s(u - 1, v) * u * (1 - v) + s(u, v - 1) * (1 - u) * v + s(u - 1, v - 1) * u * v;
  };
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const u = i / SIZE, v = j / SIZE;
      const blotch = tile(u, v, 5, 3, 601);
      const grain = tile(u, v, 28, 3, 602);
      const sp = hash2(i, j, 603);
      let speck = 0;
      if (sp > 0.955) speck = -0.28 * ((sp - 0.955) / 0.045 + 0.4); // dark biotite
      else if (sp < 0.03) speck = 0.16; // quartz
      const lum = Math.min(1.1, Math.max(0.35, 0.72 + 0.5 * (blotch - 0.5) + 0.35 * (grain - 0.5) + speck));
      const pink = 0.5 * (tile(u, v, 3, 2, 604) - 0.5);
      const k = (j * SIZE + i) * 4;
      colour[k] = Math.round(255 * Math.min(1, lum * (1 + 0.05 * pink + 0.02)));
      colour[k + 1] = Math.round(255 * Math.min(1, lum * (1 - 0.01 * pink)));
      colour[k + 2] = Math.round(255 * Math.min(1, lum * (1 - 0.06 * pink - 0.02)));
      colour[k + 3] = 255;
      const hv = Math.round(255 * Math.min(1, Math.max(0, 0.5 + 0.75 * (grain - 0.5) + 0.35 * (tile(u, v, 80, 2, 605) - 0.5) + speck * 0.4)));
      height[k] = height[k + 1] = height[k + 2] = hv; height[k + 3] = 255;
    }
  }
  const make = (data, srgb) => {
    const t = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.repeat.set(1 / GRANITE_TILE, 1 / GRANITE_TILE);
    t.needsUpdate = true;
    return t;
  };
  return { map: make(colour, true), bump: make(height, false) };
}
