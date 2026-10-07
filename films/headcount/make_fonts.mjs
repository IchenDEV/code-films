// 把三种开源字体裁剪成本片用到的字，放进 fonts/。
//   得意黑 Smiley Sans（OFL）· Bebas Neue（OFL）· Archivo（OFL）
// 需要 subset-font：在任意目录 npm i subset-font，再用 SUBSET_FONT_DIR 指过去。
//   SRC=/tmp/hcfont SUBSET_FONT_DIR=/tmp/hcfont/tool node make_fonts.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire((process.env.SUBSET_FONT_DIR ?? '.') + '/');
const subsetFont = req('subset-font');
const SRC = process.env.SRC ?? '/tmp/hcfont';
const text = ['script.mjs', 'cstyle.js', ...readdirSync('shots').map((f) => 'shots/' + f)].map((f) => readFileSync(f, 'utf8')).join('');
let latin = '';
for (let c = 0x20; c < 0x7f; c++) latin += String.fromCharCode(c);
latin += '·×→–—−‘’“”…~¢';
const jobs = [
  ['smiley/SmileySans-Oblique.ttf', 'fonts/display-zh.ttf', [...new Set(text + latin)].join('')],
  ['bebas.ttf', 'fonts/display-en.ttf', latin],
  ['archivo.ttf', 'fonts/body-en.ttf', latin + 'éèàç'],
];
for (const [src, out, chars] of jobs) {
  const buf = await subsetFont(readFileSync(`${SRC}/${src}`), chars, { targetFormat: 'truetype', preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14] });
  writeFileSync(out, buf);
  console.log(out, (buf.length / 1024).toFixed(0) + ' KB');
}
