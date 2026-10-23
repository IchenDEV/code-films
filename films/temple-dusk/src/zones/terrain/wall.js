// Earthen wall (tsuiji-bei) with stone footing, five pale bands (sujibei) and a
// tiled cap. Straight prisms swept along the wall lines with per-metre vertex
// tone so the plaster is never one flat colour.
import * as THREE from 'three';
import { TriBuilder, smoothstep, mix3, lerp } from './mesh.js';

const SEG = 1.0; // metres per tone step along the wall

// Sweep a closed cross-section along the segment a->b (plan view, y = height).
// poly: [[u, y], ...] with u across the wall (left of travel positive), in
// order around the section. colorFn(x, y, z, u) -> rgb.
function sweep(tb, a, b, poly, colorFn, uvAlong) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
  const lx = dz, lz = -dx; // left of travel
  const steps = Math.max(1, Math.round(len / SEG));
  const P = (s, u, y) => [a[0] + dx * s + lx * u, y, a[1] + dz * s + lz * u];
  // Section centre, to orient each face away from it.
  const cu = poly.reduce((m, p) => m + p[0], 0) / poly.length;
  const cy = poly.reduce((m, p) => m + p[1], 0) / poly.length;
  for (let k = 0; k < steps; k++) {
    const s0 = (len * k) / steps, s1 = (len * (k + 1)) / steps;
    for (let e = 0; e < poly.length; e++) {
      const p = poly[e], q = poly[(e + 1) % poly.length];
      const A = P(s0, p[0], p[1]), B = P(s1, p[0], p[1]), C = P(s1, q[0], q[1]), D = P(s0, q[0], q[1]);
      const mx = (p[0] + q[0]) / 2 - cu, my = (p[1] + q[1]) / 2 - cy;
      const out = [lx * mx, my, lz * mx];
      const uv = uvAlong ? [[s0 / uvAlong, p[1]], [s1 / uvAlong, p[1]], [s1 / uvAlong, q[1]], [s0 / uvAlong, q[1]]] : [];
      tb.quad(A, B, C, D, out, colorFn(...A, p[0]), colorFn(...B, p[0]), colorFn(...C, q[0]), colorFn(...D, q[0]), ...uv);
    }
  }
  // End caps.
  for (const [s, sign] of [[0, -1], [len, 1]]) {
    const exp = [dx * sign, 0, dz * sign];
    for (let i = 1; i < poly.length - 1; i++) {
      const A = P(s, poly[0][0], poly[0][1]), B = P(s, poly[i][0], poly[i][1]), C = P(s, poly[i + 1][0], poly[i + 1][1]);
      const col = colorFn(...A, poly[0][0]);
      tb.tri(A, B, C, exp, col, colorFn(...B, poly[i][0]), colorFn(...C, poly[i + 1][0]));
    }
  }
}

export function buildWall({ layout, M, noise }) {
  const { fbm2, valueNoise2 } = noise;
  const w = layout.wall;
  const t = w.thickness;
  const half = t / 2;

  // Centre lines: the outer face lies on the wall rectangle.
  const x0 = w.minX + half, x1 = w.maxX - half, z0 = w.minZ + half, z1 = w.maxZ - half;
  const g = w.gateGapHalfWidth;
  const runs = [
    [[w.minX, z0], [w.maxX, z0]], // north
    [[x0, w.minZ], [x0, w.maxZ]], // west
    [[x1, w.minZ], [x1, w.maxZ]], // east
    [[w.minX, z1], [-g, z1]], // south, west of the gate
    [[g, z1], [w.maxX, z1]], // south, east of the gate
  ];

  const footing = new TriBuilder(), body = new TriBuilder(), bands = new TriBuilder(), cap = new TriBuilder();

  const yFoot = 0.36, yBody0 = 0.34, yBody1 = 2.2;
  const hw = (y) => lerp(half - 0.03, half - 0.1, (y - yBody0) / (yBody1 - yBody0));

  const footColor = (x, y, z) => {
    const n = fbm2(x * 1.7, z * 1.7 + y, 3, 201);
    const moss = smoothstep(0.3, 0.0, y) * smoothstep(0.35, 0.7, n);
    const v = 0.78 + 0.25 * valueNoise2(x * 9, z * 9 + y * 5, 202);
    return mix3([v, v, v * 0.97], [0.5, 0.62, 0.34], moss * 0.8);
  };
  const plasterColor = (x, y, z) => {
    const n = fbm2(x * 0.45, z * 0.45, 3, 211);
    const stain = fbm2(x * 1.3 + y * 0.2, z * 1.3, 3, 212);
    const splash = smoothstep(1.1, 0.35, y);
    const drip = smoothstep(2.2, 1.85, y) * smoothstep(0.5, 0.8, stain) * 0.25;
    const v = 0.9 + 0.14 * n;
    let c = [v, v * 0.92, v * 0.78];
    c = mix3(c, [0.42, 0.37, 0.28], splash * (0.5 + 0.5 * stain) * 0.8);
    c = mix3(c, [0.55, 0.55, 0.4], smoothstep(0.55, 0.0, y) * 0.35);
    c = mix3(c, [0.45, 0.42, 0.38], drip);
    return c;
  };
  const bandColor = (x, y, z) => {
    const c = plasterColor(x, y, z);
    return [Math.min(1, c[0] * 1.08), Math.min(1, c[1] * 1.1), Math.min(1, c[2] * 1.15)];
  };
  const capColor = (x, y, z) => {
    const n = valueNoise2(x * 0.7, z * 0.7, 221);
    const v = 0.85 + 0.2 * n;
    return [v, v, v];
  };

  const bandY = [1.5, 1.64, 1.78, 1.92, 2.06];
  const footPoly = [[-half - 0.07, -0.08], [half + 0.07, -0.08], [half + 0.07, yFoot - 0.05], [half + 0.05, yFoot], [-half - 0.05, yFoot], [-half - 0.07, yFoot - 0.05]];
  const bodyPoly = [[-hw(yBody0), yBody0], [hw(yBody0), yBody0], [hw(yBody1), yBody1], [-hw(yBody1), yBody1]];
  // Cap: gable with a slightly sagging slope, ridge roll on top.
  const capHalf = 0.6, capBase = 2.18;
  const slope = [];
  for (let i = 0; i <= 5; i++) {
    const u = capHalf * (1 - i / 5);
    const s = i / 5;
    slope.push([u, 2.3 + 0.24 * (1 - Math.pow(1 - s, 1.5)) + 0.0]);
  }
  const roll = [[0.1, 2.57], [0.085, 2.61], [0.0, 2.63], [-0.085, 2.61], [-0.1, 2.57]];
  const capPoly = [
    [capHalf, capBase], [capHalf, 2.3], ...slope.slice(1, 5).map((p) => p), ...roll.slice(0, 5),
    ...slope.slice(1, 5).reverse().map((p) => [-p[0], p[1]]), [-capHalf, 2.3], [-capHalf, capBase],
  ];

  for (const [a, b] of runs) {
    sweep(footing, a, b, footPoly, footColor, 1);
    sweep(body, a, b, bodyPoly, plasterColor, 2);
    for (const y of bandY) {
      const y1 = y + 0.06, p = 0.012;
      sweep(bands, a, b, [[-hw(y) - p, y], [hw(y) + p, y], [hw(y1) + p, y1], [-hw(y1) - p, y1]], bandColor, 2);
    }
    // The cap is swept as a convex-ish polygon; ribs are a bump map, so UV runs along the wall.
    sweep(cap, a, b, capPoly, capColor, 0.18);
  }

  const mkMesh = (tb, mat, name, uvScale) => {
    const m = new THREE.Mesh(tb.geometry(uvScale), mat);
    m.name = name;
    return m;
  };

  const stoneMat = M.stone.clone();
  stoneMat.vertexColors = true;
  const plasterMat = M.plaster.clone();
  plasterMat.vertexColors = true;

  // Bump map for rows of rounded roof tiles, one tile per texture repeat along the wall.
  const bw = 32, bh = 4;
  const bd = new Uint8Array(bw * bh * 4);
  for (let j = 0; j < bh; j++) {
    for (let i = 0; i < bw; i++) {
      const u = i / bw;
      const hgt = Math.pow(Math.sin(Math.PI * u), 0.6);
      const gv = Math.round(255 * hgt);
      const k = (j * bw + i) * 4;
      bd[k] = bd[k + 1] = bd[k + 2] = gv; bd[k + 3] = 255;
    }
  }
  const bump = new THREE.DataTexture(bd, bw, bh, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.generateMipmaps = true;
  bump.needsUpdate = true;
  const tileMat = M.roofTile.clone();
  tileMat.vertexColors = true;
  tileMat.bumpMap = bump;
  tileMat.bumpScale = 0.15;
  tileMat.map = null; // the shared tile noise would repeat once per tile; vertex tone does the variation

  return {
    footing: mkMesh(footing, stoneMat, 'wall-footing', 0.8),
    body: [mkMesh(body, plasterMat, 'wall-body', 2.4), mkMesh(bands, plasterMat, 'wall-bands', 2.4)],
    cap: mkMesh(cap, tileMat, 'wall-cap', 0.18),
  };
}
