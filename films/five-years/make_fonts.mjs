// 把五种开源字体裁剪成本片用到的字，放进 fonts/（全部 SIL OFL 1.1）。
//   得意黑 Smiley Sans · Archivo Black · Bebas Neue · JetBrains Mono · Inter
// 需要 subset-font：在任意目录 npm i subset-font，再用 SUBSET_FONT_DIR 指过去。
//   SRC=/tmp/fy_fonts_src SUBSET_FONT_DIR=/tmp/fy_tool node make_fonts.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire((process.env.SUBSET_FONT_DIR ?? '.') + '/');
const subsetFont = req('subset-font');
const SRC = process.env.SRC ?? '/tmp/fy_fonts_src';
const files = ['script.mjs', 'web/engine.js', 'web/main.js', 'web/cover.js', ...readdirSync('web/shots').map((f) => 'web/shots/' + f)];
const text = files.map((f) => readFileSync(f, 'utf8')).join('');
let latin = '';
for (let c = 0x20; c < 0x7f; c++) latin += String.fromCharCode(c);
latin += '·×→←↑–—−‘’“”…✓✗◉●◆⇥◀▶≈';
const all = [...new Set(text + latin)].join('');
const jobs = [
  ['SmileySans-Oblique.ttf', 'fonts/display-zh.ttf', all],
  ['ArchivoBlack-Regular.ttf', 'fonts/black-en.ttf', latin],
  ['BebasNeue-Regular.ttf', 'fonts/num.ttf', latin],
  ['JetBrainsMono[wght].ttf', 'fonts/mono.ttf', latin],
  ['Inter[opsz,wght].ttf', 'fonts/ui.ttf', latin + 'éèàç'],
];
for (const [src, out, chars] of jobs) {
  const buf = await subsetFont(readFileSync(`${SRC}/${src}`), chars, { targetFormat: 'truetype', preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14] });
  writeFileSync(out, buf);
  console.log(out, (buf.length / 1024).toFixed(0) + ' KB');
}
