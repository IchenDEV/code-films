// Draws the site plan from src/layout.js as SVG (and PNG via Chromium).
//   node tools/plan.mjs   -> previews/plan.svg
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './serve.mjs';
import { layout as L } from '../src/layout.js';

const S = 6; // px per metre
const X0 = -72, X1 = 72, Z0 = -60, Z1 = 104;
const W = (X1 - X0) * S, H = (Z1 - Z0) * S;
const px = (x) => ((x - X0) * S).toFixed(1);
const pz = (z) => ((z - Z0) * S).toFixed(1);
const rect = (x0, z0, x1, z1, style) => `<rect x="${px(Math.min(x0, x1))}" y="${pz(Math.min(z0, z1))}" width="${(Math.abs(x1 - x0) * S).toFixed(1)}" height="${(Math.abs(z1 - z0) * S).toFixed(1)}" ${style}/>`;
const label = (x, z, text, size = 13, extra = '') => `<text x="${px(x)}" y="${pz(z)}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" ${extra}>${text}</text>`;
const el = [];

// Grid every 10 m.
for (let x = -70; x <= 70; x += 10) el.push(`<line x1="${px(x)}" y1="0" x2="${px(x)}" y2="${H}" class="grid"/>` + label(x, Z0 + 2, x, 10, 'class="tick"'));
for (let z = -60; z <= 100; z += 10) el.push(`<line x1="0" y1="${pz(z)}" x2="${W}" y2="${pz(z)}" class="grid"/>` + label(X0 + 3, z, z, 10, 'class="tick"'));

el.push(rect(L.courtyard.minX, L.courtyard.minZ, L.courtyard.maxX, L.courtyard.maxZ, 'class="gravel"'));
for (const p of L.paths) {
  const dx = p.to[0] - p.from[0], dz = p.to[2] - p.from[2];
  const horiz = Math.abs(dx) > Math.abs(dz);
  el.push(horiz ? rect(p.from[0], p.from[2] - p.width / 2, p.to[0], p.to[2] + p.width / 2, 'class="path"') : rect(p.from[0] - p.width / 2, p.from[2], p.to[0] + p.width / 2, p.to[2], 'class="path"'));
}
// Pond outline.
const pts = [];
for (let i = 0; i < 180; i++) {
  const th = (i / 180) * Math.PI * 2, r = L.pondRadiusAt(th);
  pts.push(`${px(L.pond.center[0] + Math.cos(th) * r)},${pz(L.pond.center[2] + Math.sin(th) * r)}`);
}
el.push(`<polygon points="${pts.join(' ')}" class="water"/>`);
for (const b of L.pond.lotusBeds) el.push(`<circle cx="${px(b.center[0])}" cy="${pz(b.center[2])}" r="${b.radius * S}" class="lotus"/>`);
// Wall.
const w = L.wall;
el.push(`<path d="M${px(-w.gateGapHalfWidth)},${pz(w.maxZ)} H${px(w.minX)} V${pz(w.minZ)} H${px(w.maxX)} V${pz(w.maxZ)} H${px(w.gateGapHalfWidth)}" class="wall"/>`);
// Bridge.
const b = L.bridge;
el.push(rect(-b.width / 2, b.center[2] - b.length / 2, b.width / 2, b.center[2] + b.length / 2, 'class="red"'));
// Hall.
const h = L.hall, hc = h.center, hp = h.podium;
el.push(rect(hc[0] - hp.width / 2, hc[2] - hp.depth / 2, hc[0] + hp.width / 2, hc[2] + hp.depth / 2, 'class="stone"'));
el.push(rect(-h.steps.width / 2, hc[2] + hp.depth / 2, h.steps.width / 2, hc[2] + hp.depth / 2 + h.steps.depth, 'class="stone"'));
el.push(rect(-11.9, hc[2] - 7, 11.9, hc[2] + 7, 'class="red"'));
el.push(rect(-11.9 - h.eaveOverhang, hc[2] - 7 - h.eaveOverhang, 11.9 + h.eaveOverhang, hc[2] + 7 + h.eaveOverhang, 'class="roof"'));
el.push(label(hc[0], hc[2], '主殿 Main hall', 15, 'class="name"'));
// Gate.
const g = L.gate, gc = g.center;
el.push(rect(gc[0] - 6.2, gc[2] - 3, gc[0] + 6.2, gc[2] + 3, 'class="red"'));
el.push(rect(gc[0] - 6.2 - g.eaveOverhang, gc[2] - 3 - g.eaveOverhang, gc[0] + 6.2 + g.eaveOverhang, gc[2] + 3 + g.eaveOverhang, 'class="roof"'));
el.push(label(gc[0], gc[2] + 9.5, '山门 Gate', 15, 'class="name"'));
// Pagoda.
const pg = L.pagoda, pc = pg.center;
el.push(rect(pc[0] - pg.base.size / 2, pc[2] - pg.base.size / 2, pc[0] + pg.base.size / 2, pc[2] + pg.base.size / 2, 'class="stone"'));
const e0 = pg.storeys[0].eaveHalf;
el.push(rect(pc[0] - e0, pc[2] - e0, pc[0] + e0, pc[2] + e0, 'class="roof"'));
el.push(label(pc[0], pc[2] + e0 + 3, '五重塔 Pagoda', 15, 'class="name"'));
el.push(label(0, 20, '拱桥', 12, 'class="name" transform="translate(28,0)"'));
el.push(label(-14, 20, '莲花池 Lotus pond', 14, 'class="name"'));
// Lanterns, trees.
for (const l of L.stoneLanterns) el.push(`<circle cx="${px(l[0])}" cy="${pz(l[2])}" r="5" class="lantern"/>`);
const tc = { maple: '#c0392b', pine: '#2e4a2a', cedar: '#3b5534' };
for (const t of L.trees) el.push(`<circle cx="${px(t.position[0])}" cy="${pz(t.position[2])}" r="${t.crown * S}" fill="${tc[t.kind]}" fill-opacity="0.45" stroke="${tc[t.kind]}"/>`);
// Shot anchors.
let n = 1;
for (const [name, a] of Object.entries(L.anchors)) {
  if (name === 'compoundCenter') continue;
  el.push(`<circle cx="${px(a[0])}" cy="${pz(a[2])}" r="4" class="anchor"/>` + `<text x="${+px(a[0]) + 7}" y="${+pz(a[2]) - 6}" font-size="11" class="anchorText">${name}</text>`);
  n++;
}
// Sun arrow.
const sx = L.sun.dir[0], sz = L.sun.dir[2], k = 1 / Math.hypot(sx, sz);
el.push(`<line x1="${px(-40)}" y1="${pz(85)}" x2="${px(-40 + sx * k * 22)}" y2="${pz(85 + sz * k * 22)}" class="sun" marker-end="url(#arr)"/>`);
el.push(label(-40, 89, `sun · az ${L.sun.azimuthDeg}° (WSW) · alt ${L.sun.elevationDeg}°`, 12, 'class="sunText"'));
el.push(label(55, 98, 'N ↑ · 1 grid = 10 m', 12, 'class="tick"'));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Noto Sans CJK SC, PingFang SC, sans-serif">
<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e8892b"/></marker></defs>
<style>
 .grid{stroke:#d9d2c3;stroke-width:1} .tick{fill:#9a917f} .gravel{fill:#ece6d8} .path{fill:#c9c1b0}
 .water{fill:#7fa4b3;stroke:#557c8c;stroke-width:2} .lotus{fill:#8fb37a;fill-opacity:.5}
 .wall{fill:none;stroke:#7a6f5d;stroke-width:5} .red{fill:#c0432a} .stone{fill:#a39d92}
 .roof{fill:#4b5058;fill-opacity:.35;stroke:#4b5058} .name{fill:#222;font-weight:600}
 .lantern{fill:#f3b14a;stroke:#7a5a20} .anchor{fill:#fff;stroke:#1d4ed8;stroke-width:2} .anchorText{fill:#1d4ed8}
 .sun{stroke:#e8892b;stroke-width:4} .sunText{fill:#b5651d}
</style>
<rect width="${W}" height="${H}" fill="#f6f2e9"/>
${el.join('\n')}
</svg>`;
await mkdir(join(ROOT, 'previews'), { recursive: true });
await writeFile(join(ROOT, 'previews/plan.svg'), svg);
// No browser here: this machine runs no Chromium (render on the InstaBox, see tools/cloud.sh).
console.log('previews/plan.svg');
