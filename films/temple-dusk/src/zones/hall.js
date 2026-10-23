// Main hall (hondo) with its seated Buddha, and the gate (sanmon).
// See src/zones/hall/ for the parts; this file assembles them and owns the
// two altar lights.

import * as THREE from 'three';
import { Bag, xf, extrudeShape } from './hall/kit.js';
import { makeTileMaterial } from './hall/roof.js';
import { buildHallBody } from './hall/hallBody.js';
import { buildGate } from './hall/gate.js';
import { bronzeLantern, candleStand } from './hall/lanterns.js';
import { buildBuddha } from './hall/buddha.js';

// Gilded ridge-end ornament (鴟尾): a tall fin curling inward over the ridge.
function shibiGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0.5, 0);
  s.lineTo(0.5, 0.55);
  s.bezierCurveTo(0.52, 1.3, 0.2, 1.95, -0.62, 2.28);
  s.bezierCurveTo(-0.18, 1.7, -0.08, 1.15, -0.34, 0.7);
  s.lineTo(-0.5, 0);
  s.closePath();
  return extrudeShape(s, 0.34, { bevel: 0.05, curveSegments: 14 });
}

export function build({ THREE: _THREE, layout, M, rng }) {
  void _THREE;
  const group = new THREE.Group();
  group.name = 'hall';

  const tile = makeTileMaterial(M);
  const roofMats = { tile, wood: M.wood, rafter: M.vermilion, rafterEnd: M.plaster, gold: M.goldLeaf, plaster: M.plaster };

  // Buddha materials: gilt body, darker gilt halo, indigo curls, pearl.
  const gilt = M.goldLeaf.clone();
  gilt.name = 'gilt';
  gilt.color.set('#e9b95c');
  gilt.roughness = 0.34;
  gilt.metalness = 0.92;
  gilt.emissive.set('#5a3208');
  gilt.emissiveIntensity = 0.08;
  const halo = M.goldLeaf.clone();
  halo.name = 'giltHalo';
  halo.color.set('#cf9d3f');
  halo.roughness = 0.4;
  const hair = new THREE.MeshStandardMaterial({ name: 'buddhaHair', color: '#6b4a22', roughness: 0.42, metalness: 0.85 });
  const pearl = new THREE.MeshStandardMaterial({ name: 'pearl', color: '#f3e9d2', roughness: 0.18, metalness: 0.0, emissive: '#6a5a3a', emissiveIntensity: 0.25 });
  const mats = { gilt, halo, hair, pearl, skin: gilt.clone(), lacquer: M.blackLacquer, gold: M.goldLeaf };

  const bag = new Bag();
  const body = buildHallBody(bag, M, layout, roofMats);
  const h = layout.hall;

  // Shibi at the ridge ends.
  const shibi = shibiGeometry();
  h.shibi.forEach(([x, y, z]) => {
    const sg = x < 0 ? -1 : 1;
    // Local +x is the outward direction; mirror by rotating half a turn for the west end.
    bag.add(M.goldLeaf, shibi, xf(x, y - 1.1, z, 0, sg > 0 ? 0 : Math.PI));
    for (let k = 0; k < 4; k++) {
      bag.box(M.goldLeaf, 1.1, 0.05, 0.4, x - sg * 0.02, y - 0.6 + k * 0.35, z, 0, 0);
    }
  });

  // Hanging bronze lanterns under the front eave.
  h.lanterns.forEach(([x, y, z]) => {
    const out = z - body.zl[body.zl.length - 1]; // distance in front of the front column line
    const rafterY = h.eaveY + 0.24 * (h.eaveOverhang - out) + 0.05 - 0.075;
    bronzeLantern(bag, M, { x, y, z, rot: -0.36, chainTopY: rafterY });
  });

  // Candle stands.
  h.altarLights.forEach(([x, y, z]) => candleStand(bag, M, { x, z, floorY: body.floorTop, flameY: y }));

  // Buddha.
  const buddha = buildBuddha({ bag, mats, layout, rng: rng.fork('buddha') });

  // Gate.
  buildGate(bag, M, layout, roofMats);

  bag.flush(group, 'hall-');
  group.add(buddha.head);

  // Altar lights: small, warm, no shadows.
  const lights = h.altarLights.map(([x, y, z], i) => {
    const l = new THREE.PointLight(0xffa24a, 14, 12, 2);
    l.position.set(x, y + 0.12, z + 0.1);
    l.castShadow = false;
    l.userData.phase = i * 2.1;
    group.add(l);
    return l;
  });

  return {
    object: group,
    update(t) {
      for (const l of lights) {
        const p = l.userData.phase;
        l.intensity = 14 * (1 + 0.07 * Math.sin(t * 7.3 + p) + 0.04 * Math.sin(t * 13.1 + p * 1.7) + 0.03 * Math.sin(t * 3.1 + p));
      }
    },
  };
}
