// Terrain zone: ground, distant ridges, wall, paths, courtyard, stone lanterns
// and the small litter of rocks, moss and fallen leaves.
import { fbm2, valueNoise2 } from '../rng.js';
import { buildGround } from './terrain/ground.js';
import { buildMountains } from './terrain/mountains.js';
import { buildWall } from './terrain/wall.js';
import { buildPaving } from './terrain/paving.js';
import { buildCourtyard } from './terrain/courtyard.js';
import { buildLanternGeometry, buildGlowGeometry } from './terrain/lantern.js';
import { buildScatter } from './terrain/scatter.js';
import { buildGranite } from './terrain/granite.js';

const noise = { fbm2, valueNoise2 };

export function build({ THREE, layout, M, rng }) {
  const g = new THREE.Group();

  const { mesh: ground, heightAt } = buildGround({ layout, noise });
  g.add(ground);
  g.add(buildMountains({ noise, center: layout.forest.center }));

  const wall = buildWall({ layout, M, noise });
  g.add(wall.footing, ...wall.body, wall.cap);

  // Path slabs and the courtyard kerb share one stone mesh.
  const granite = buildGranite({ noise });
  const graniteMat = (bumpScale) => {
    const m = M.stone.clone();
    m.vertexColors = true;
    m.map = granite.map;
    m.bumpMap = granite.bump;
    m.bumpScale = bumpScale;
    return m;
  };
  const stoneMat = graniteMat(0.06);
  const paving = new THREE.Mesh(buildPaving({ layout, rng, noise, heightAt }), stoneMat);
  paving.name = 'paving';
  g.add(paving);
  g.add(buildCourtyard({ layout, M, noise }));

  // Stone lanterns: one geometry, one instance per foot.
  const lanternMat = graniteMat(0.12);
  const glowMat = M.lanternGlow.clone();
  glowMat.emissiveIntensity = 1.5;
  const feet = layout.stoneLanterns;
  const lanterns = new THREE.InstancedMesh(buildLanternGeometry({ noise }), lanternMat, feet.length);
  const glow = new THREE.InstancedMesh(buildGlowGeometry(), glowMat, feet.length);
  lanterns.name = 'stone-lanterns';
  glow.name = 'lantern-glow';
  glow.userData.noCastShadow = true;
  const o = new THREE.Object3D();
  const lr = rng.fork('lanterns');
  const hero = 3; // layout.anchors.pathLantern = stoneLanterns[3]
  const c = new THREE.Color();
  feet.forEach(([x, , z], i) => {
    // Openings face the path (the axis x = 0); the pagoda-branch lantern faces its path.
    let yaw = x === 0 ? 0 : -Math.sign(x) * Math.PI / 2;
    if (Math.abs(z - -4) < 5 && x > 10) yaw = Math.PI;
    yaw += lr.range(-0.12, 0.12);
    // Shot 2 looks from (0.62, 0.08, 0.78) at the firebox: turn the opening to meet it, slightly off axis.
    if (i === hero) yaw = Math.atan2(0.62, 0.78) - 0.2;
    o.position.set(x, heightAt(x, z), z);
    o.rotation.set(0, yaw, 0);
    o.scale.setScalar(1);
    o.updateMatrix();
    lanterns.setMatrixAt(i, o.matrix);
    glow.setMatrixAt(i, o.matrix);
    lanterns.setColorAt(i, c.setScalar(lr.range(0.9, 1.05)));
  });
  g.add(lanterns, glow);

  for (const m of buildScatter({ layout, M, rng, noise })) g.add(m);
  return { object: g };
}
