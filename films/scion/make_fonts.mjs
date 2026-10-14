// 把三种开源字体裁剪成本片用到的字，放进 fonts/（全部 SIL OFL 1.1）。
//   Noto Sans SC（中文字幕、标题、画面里的中文）· Space Grotesk（英文字幕、标题、数字）· JetBrains Mono（代码、标签）
// 需要 subset-font：在任意目录 npm i subset-font，再用 SUBSET_FONT_DIR 指过去。
//   SRC=/tmp/scion-fonts-src SUBSET_FONT_DIR=/tmp/scion-tool node make_fonts.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire((process.env.SUBSET_FONT_DIR ?? '.') + '/');
const subsetFont = req('subset-font');
const SRC = process.env.SRC ?? '/tmp/scion-fonts-src';
const files = ['script.mjs', 'web/engine.js', 'web/main.js', 'web/cover.js', ...readdirSync('web/shots').map((f) => 'web/shots/' + f)];
const text = files.map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('');
let latin = '';
for (let c = 0x20; c < 0x7f; c++) latin += String.fromCharCode(c);
latin += '·×→←↑↓–—‘’“”…✓✗≈「」《》、，。？！：；（）%‰²/ˈɪəæ';
const all = [...new Set(text + latin)].join('');
mkdirSync('fonts', { recursive: true });
const jobs = [
  ['NotoSansSC.ttf', 'fonts/sans-zh.ttf', all],
  ['SpaceGrotesk.ttf', 'fonts/grotesk.ttf', latin + 'éèàç'],
  ['JetBrainsMono.ttf', 'fonts/mono.ttf', latin],
];
for (const [src, out, chars] of jobs) {
  const buf = await subsetFont(readFileSync(`${SRC}/${src}`), chars, { targetFormat: 'truetype', preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14] });
  writeFileSync(out, buf);
  console.log(out, (buf.length / 1024).toFixed(0) + ' KB');
}
