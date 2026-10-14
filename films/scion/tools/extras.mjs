// 发布用的附件：每个版本的 SRT 字幕（与画面同语言；B 站 / YouTube 的 CC，或剪映导入），以及横屏长版的章节时间戳。
// 用法：node tools/extras.mjs → out/deliver/<名字>.srt、out/deliver/chapters.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { VARIANTS, TXT } from '../script.mjs';

const ts = (t) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
mkdirSync('out/deliver', { recursive: true });
const chapters = {};
for (const [v, V] of Object.entries(VARIANTS)) {
  const TL = JSON.parse(readFileSync(`timeline/${v}.json`, 'utf8'));
  const srt = TL.caps.map((c, i) => `${i + 1}\n${ts(Math.max(0, c.a))} --> ${ts(c.b)}\n${c.text}\n`).join('\n');
  writeFileSync(`out/deliver/${V.name}.srt`, srt);
  if (TL.fmt === 'h') {
    const k = TL.lang === 'zh' ? 0 : 1;
    chapters[v] = TL.acts.filter((a) => TXT.chapters[a.name][k]).map((a, i) => `${mmss(i ? a.a : 0)} ${TXT.chapters[a.name][k]}`);
  }
  console.log(`${V.name}.srt · ${TL.caps.length} cues · ${mmss(TL.duration)}`);
}
writeFileSync('out/deliver/chapters.json', JSON.stringify(chapters, null, 1));
for (const [v, c] of Object.entries(chapters)) console.log(`\n${v}\n${c.join('\n')}`);
