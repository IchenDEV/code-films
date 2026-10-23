// Shared materials. Every zone takes its lacquer, gold, bronze, roof tile, wood,
// stone and plaster from here, so the temple reads as one place.
//
// Surface variation comes from small noise textures generated in code from a
// fixed seed. No image files are loaded anywhere.
//
// Zones may clone a material to change a value locally (M.wood.clone()); a
// zone-only organic material (koi skin, lotus petal, leaves) stays in its zone.

import * as THREE from 'three';
import { fbm2 } from './rng.js';

// Grey or two-colour noise as an sRGB DataTexture.
// stretch > 1 elongates features along U (wood grain).
function noiseTexture({ seed, size = 256, freq = 8, stretch = 1, lo = [0.8, 0.8, 0.8], hi = [1, 1, 1], gamma = 1, repeat = 1 }) {
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      // Tileable: sample a torus-like wrap by blending four offsets.
      const u = i / size, v = j / size;
      const f = (a, b) => fbm2(a * freq / stretch, b * freq, 5, seed);
      const n = (f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v);
      const t = Math.pow(Math.min(1, Math.max(0, (n - 0.25) / 0.5)), gamma);
      const k = (j * size + i) * 4;
      for (let c = 0; c < 3; c++) data[k + c] = Math.round(255 * (lo[c] + (hi[c] - lo[c]) * t));
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const lacquerMap = noiseTexture({ seed: 11, freq: 6, lo: [0.86, 0.84, 0.84], hi: [1, 1, 1] });
const goldMap = noiseTexture({ seed: 12, freq: 10, lo: [0.9, 0.86, 0.8], hi: [1, 1, 1] });
const bronzeMap = noiseTexture({ seed: 13, freq: 7, lo: [0.36, 0.30, 0.22], hi: [0.40, 0.52, 0.42], gamma: 1.4 });
const tileMap = noiseTexture({ seed: 14, freq: 9, lo: [0.82, 0.83, 0.86], hi: [1, 1, 1] });
const woodMap = noiseTexture({ seed: 15, freq: 4, stretch: 12, lo: [0.72, 0.66, 0.62], hi: [1, 1, 1] });
const stoneMap = noiseTexture({ seed: 16, freq: 9, lo: [0.72, 0.71, 0.68], hi: [1, 1, 1] });
const mossMap = noiseTexture({ seed: 17, freq: 7, lo: [0.55, 0.62, 0.40], hi: [0.95, 0.95, 0.90], gamma: 0.8 });
const plasterMap = noiseTexture({ seed: 18, freq: 5, lo: [0.9, 0.89, 0.86], hi: [1, 1, 1] });

// The same generated wear pattern also changes reflection width. Roughness is
// linear data, not an sRGB colour texture; use Three's green roughness channel.
function roughnessMap(source, low, high) {
  const { data, width, height } = source.image;
  let min = 255, max = 0;
  for (let i = 1; i < data.length; i += 4) { min = Math.min(min, data[i]); max = Math.max(max, data[i]); }
  const pixels = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const t = (data[i + 1] - min) / (max - min);
    pixels[i] = pixels[i + 2] = pixels[i + 3] = 255;
    pixels[i + 1] = Math.round(255 * (low + (high - low) * t));
  }
  const texture = source.clone();
  // Texture.clone() shares its TextureSource. Give roughness independent pixels
  // so assigning it cannot replace the base-colour texture's image.
  texture.source = new THREE.TextureSource({ data: pixels, width, height });
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const std = (params) => new THREE.MeshStandardMaterial(params);

export const M = {
  // 朱漆 vermilion lacquer: columns, rails, bridge, gate.
  vermilion: std({ name: 'vermilion', color: '#994530', map: lacquerMap, roughnessMap: roughnessMap(lacquerMap, 0.62, 0.90), roughness: 1, metalness: 0 }),
  // 金箔 gold leaf: finials, shibi, Buddha, door studs.
  goldLeaf: std({ name: 'goldLeaf', color: '#c6a260', map: goldMap, roughnessMap: roughnessMap(goldMap, 0.30, 0.52), roughness: 1, metalness: 1, envMapIntensity: 0.85 }),
  // 青铜 patinated bronze: giboshi, hanging lanterns, chimes, sorin.
  bronze: std({ name: 'bronze', color: '#ffffff', map: bronzeMap, roughnessMap: roughnessMap(bronzeMap, 0.38, 0.78), roughness: 1, metalness: 0.75 }),
  // 屋瓦 grey-blue fired roof tile.
  roofTile: std({ name: 'roofTile', color: '#505455', map: tileMap, roughnessMap: roughnessMap(tileMap, 0.72, 0.96), roughness: 1, metalness: 0 }),
  // 木头 aged dark timber: brackets, rafters, floors, lattice.
  wood: std({ name: 'wood', color: '#5c3f2a', map: woodMap, roughnessMap: roughnessMap(woodMap, 0.70, 0.96), roughness: 1, metalness: 0 }),
  // Unpainted cypress (hinoki), lighter.
  woodRaw: std({ name: 'woodRaw', color: '#a07b55', map: woodMap, roughnessMap: roughnessMap(woodMap, 0.70, 0.96), roughness: 1, metalness: 0 }),
  // White lime plaster walls.
  plaster: std({ name: 'plaster', color: '#e8e1d2', map: plasterMap, roughness: 0.95, metalness: 0 }),
  // Granite: podiums, steps, lanterns, paving.
  stone: std({ name: 'stone', color: '#8c877e', map: stoneMap, roughnessMap: roughnessMap(stoneMap, 0.82, 1), roughness: 1, metalness: 0 }),
  // Moss-stained stone: pond edge rocks, old lanterns.
  stoneMoss: std({ name: 'stoneMoss', color: '#8a8a78', map: mossMap, roughness: 0.95, metalness: 0 }),
  // Raked white gravel.
  gravel: std({ name: 'gravel', color: '#bdb5a5', map: stoneMap, roughness: 1, metalness: 0 }),
  // Black lacquer / iron fittings.
  blackLacquer: std({ name: 'blackLacquer', color: '#1d1b1a', roughness: 0.4, metalness: 0.1 }),
  // Lit firebox / candle flame: bright, feeds the bloom pass.
  lanternGlow: std({ name: 'lanternGlow', color: '#ffd7a0', emissive: '#ff9440', emissiveIntensity: 5, roughness: 1 }),
  // Paper of the gate's red chochin, lit from inside.
  chochinPaper: std({ name: 'chochinPaper', color: '#a33d2c', emissive: '#ff8040', emissiveIntensity: 0.22, roughness: 0.85, side: THREE.DoubleSide }),
};

export default M;
