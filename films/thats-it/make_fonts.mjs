// 把三种开源字体裁剪成本片用到的字，放进 fonts/（全部 SIL OFL 1.1）。
//   霞鹜文楷 LXGW WenKai Medium（手写感：就这？、片名、画面里的字）
//   思源宋体 Noto Serif SC（中文字幕）
//   Lora / Lora Italic（英文字幕与英文标题）
// 需要 subset-font：在任意目录 npm i subset-font，再用 SUBSET_FONT_DIR 指过去。
//   SRC=/tmp/thats-it-fonts-src SUBSET_FONT_DIR=/tmp/thats-it-tool node make_fonts.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire((process.env.SUBSET_FONT_DIR ?? '.') + '/');
const subsetFont = req('subset-font');
const SRC = process.env.SRC ?? '/tmp/thats-it-fonts-src';
const files = ['script.mjs', 'web/engine.js', 'web/main.js', 'web/cover.js', ...readdirSync('web/shots').map((f) => 'web/shots/' + f)];
const text = files.map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('');
let latin = '';
for (let c = 0x20; c < 0x7f; c++) latin += String.fromCharCode(c);
latin += '·×→←↑↓–—‘’“”…✓✗≈「」《》、，。？！：；（）%‰';
const all = [...new Set(text + latin)].join('');
mkdirSync('fonts', { recursive: true });
const jobs = [
  ['LXGWWenKai-Medium.ttf', 'fonts/hand.ttf', all],
  ['NotoSerifSC.ttf', 'fonts/serif-zh.ttf', all],
  ['Lora.ttf', 'fonts/lora.ttf', latin + 'éèàç'],
  ['Lora-Italic.ttf', 'fonts/lora-italic.ttf', latin + 'éèàç'],
];
for (const [src, out, chars] of jobs) {
  const buf = await subsetFont(readFileSync(`${SRC}/${src}`), chars, { targetFormat: 'truetype', preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14] });
  writeFileSync(out, buf);
  console.log(out, (buf.length / 1024).toFixed(0) + ' KB');
}
