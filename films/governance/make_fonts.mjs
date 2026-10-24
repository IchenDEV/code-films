// 把四种开源字体裁剪成本片用到的字，放进 fonts/（全部 SIL OFL 1.1）。
//   Noto Sans SC（字幕、标题、画面里的中文）· Noto Serif SC（书名、引文）· Space Grotesk（数字、英文）· JetBrains Mono（代码）
// 需要 subset-font：在任意目录 npm i subset-font，再用 SUBSET_FONT_DIR 指过去。
//   SRC=/tmp/gov-fonts SUBSET_FONT_DIR=/tmp/gov-subset node make_fonts.mjs
// 拉丁两种直接沿用 films/code-review 已裁好的文件（只含 ASCII 和常用符号），这里只裁中文两种。
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire((process.env.SUBSET_FONT_DIR ?? '.') + '/');
const subsetFont = req('subset-font');
const SRC = process.env.SRC ?? '/tmp/gov-fonts';
const files = ['script.mjs', 'web/engine.js', 'web/main.js', 'web/cover.js', ...readdirSync('web/shots').map((f) => 'web/shots/' + f)];
const text = files.map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('');
let latin = '';
for (let c = 0x20; c < 0x7f; c++) latin += String.fromCharCode(c);
latin += '·×→←↑↓–—‘’“”…✓✗≈「」《》、，。？！：；（）%‰/';
const all = [...new Set(text + latin)].join('');
mkdirSync('fonts', { recursive: true });
for (const [src, out] of [['NotoSansSC.ttf', 'fonts/sans-zh.ttf'], ['NotoSerifSC.ttf', 'fonts/serif-zh.ttf']]) {
  const buf = await subsetFont(readFileSync(`${SRC}/${src}`), all, { targetFormat: 'truetype', preserveNameIds: [0, 1, 2, 3, 4, 5, 6, 13, 14] });
  writeFileSync(out, buf);
  console.log(out, (buf.length / 1024).toFixed(0) + ' KB');
}
