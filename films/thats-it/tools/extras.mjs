// 发布用的附件：每个版本的双语 SRT（中文一行、英文一行；B 站 / YouTube 的 CC，或剪映导入），以及章节时间戳。
// 用法：node tools/extras.mjs → out/deliver/<名字>.srt、out/deliver/chapters.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { VARIANTS } from '../script.mjs';

const CHAPTERS = {
  zh: { phone: '你的「就这？」', facade: '另一扇窗：要变天了', split: '谁看错了？', funnel: '八十亿人的漏斗', sea: '一杯水，量不出海', peaks: '本事是一座山脉',
        door: '一道门', swarm: '门里的五千人', napkin: '画漏斗的人', city: '同一天，不同的明天', return: '就从这儿开始' },
  en: { phone: 'Your "That\'s it?"', facade: 'Another window', split: 'Who\'s wrong?', funnel: 'A funnel of eight billion', sea: 'A cup can\'t measure the sea', peaks: 'A mountain range, not a plain',
        door: 'A door', swarm: 'Inside the labs', napkin: 'The man who drew the funnel', city: 'Same day, different tomorrows', return: 'Where it starts' },
};
const ts = (t) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
mkdirSync('out/deliver', { recursive: true });
const chapters = {};
for (const [v, V] of Object.entries(VARIANTS)) {
  const TL = JSON.parse(readFileSync(`timeline/${v}.json`, 'utf8'));
  const srt = TL.caps.map((c, i) => `${i + 1}\n${ts(Math.max(0, c.a))} --> ${ts(c.b)}\n${c.zh}\n${c.en}\n`).join('\n');
  writeFileSync(`out/deliver/${V.name}.srt`, srt);
  if (TL.fmt === 'h') {
    const names = CHAPTERS[TL.lang];
    chapters[v] = TL.shots.filter((s) => names[s.kind]).map((s) => `${mmss(s.kind === 'phone' ? 0 : s.a)} ${names[s.kind]}`);
  }
  console.log(`${V.name}.srt · ${TL.caps.length} cues · ${mmss(TL.duration)}`);
}
writeFileSync('out/deliver/chapters.json', JSON.stringify(chapters, null, 1));
for (const [v, c] of Object.entries(chapters)) console.log(`\n${v}\n${c.join('\n')}`);
