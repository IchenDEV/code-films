// Raked white gravel. The rake lines run north-south, across the low sun, so they
// catch light; they are a bump map (a groove profile tiled every 8 grooves).
import * as THREE from 'three';

const GROOVE = 0.11; // metres between rake lines
const GROOVES_PER_TILE = 8;
const RAISE = 0.035;

export function buildCourtyard({ layout, M, noise }) {
  const c = layout.courtyard;
  const w = c.maxX - c.minX, d = c.maxZ - c.minZ;
  const { fbm2 } = noise;

  const tw = 256, th = 64;
  const data = new Uint8Array(tw * th * 4);
  for (let j = 0; j < th; j++) {
    for (let i = 0; i < tw; i++) {
      const phase = ((i / tw) * GROOVES_PER_TILE) % 1;
      // Flat-topped ridge, sharp-bottomed groove; tines never leave quite equal.
      const prof = Math.pow(0.5 + 0.5 * Math.cos(phase * Math.PI * 2), 0.7);
      const wobble = 0.1 * (fbm2(i / 9, j / 9, 3, 311) - 0.5);
      const v = Math.round(255 * Math.min(1, Math.max(0, 0.15 + 0.8 * prof + wobble)));
      const k = (j * tw + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255;
    }
  }
  const bump = new THREE.DataTexture(data, tw, th, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.generateMipmaps = true;
  bump.anisotropy = 8;
  bump.repeat.set(1 / (GROOVE * GROOVES_PER_TILE), 1 / 3);
  bump.needsUpdate = true;

  const mat = M.gravel.clone();
  mat.bumpMap = bump;
  mat.bumpScale = 0.08;
  mat.map = M.gravel.map.clone();
  mat.map.repeat.set(1 / 0.8, 1 / 0.8);
  mat.map.needsUpdate = true;

  const geo = new THREE.PlaneGeometry(w, d, 40, 15).rotateX(-Math.PI / 2);
  geo.translate((c.minX + c.maxX) / 2, RAISE, (c.minZ + c.maxZ) / 2);
  // UVs in metres so the textures keep their physical size.
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'courtyard-gravel';
  return mesh;
}
