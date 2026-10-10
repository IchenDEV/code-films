// 发布用的附件：每个版本的 SRT 字幕（B 站 / YouTube 的 CC），以及按镜头整理的章节时间戳。
// 用法：node tools/extras.mjs → out/deliver/<名字>.srt、out/deliver/chapters.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { VARIANTS } from '../script.mjs';

const CHAPTERS = {
  zh: { swarm: '开场：AI 指挥 AI', ide: '2021 年以前：古法编程', tab: '2021：按一下 Tab', diff: '2023—2024：对话改代码', agent: '2024—2025：Agent 接管任务',
        grid: '2025—2026：同时开十个', overload: '2026：人成了瓶颈', bloom: 'Agent 管 Agent：动态组织', archive: '2024 年就有的架构', loop: '为什么是现在：验证闭环',
        reality: '别想得太成熟', ladder: '五年，一层层交出去', end: '下一步' },
  en: { swarm: 'Cold open: AI directing AI', ide: 'Before 2021: writing it by hand', tab: '2021: hit Tab', diff: '2023–2024: editing by asking', agent: '2024–2025: agents take whole tasks',
        grid: '2025–2026: run ten at once', overload: '2026: the bottleneck is us', bloom: 'Agents directing agents', archive: 'The architecture already existed in 2024', loop: 'Why now: closing the loop',
        reality: 'Don\'t overestimate it', ladder: 'Five years, one level at a time', end: 'What\'s next' },
};

const ts = (t, sep = ',') => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

mkdirSync('out/deliver', { recursive: true });
const chapters = {};
for (const [v, V] of Object.entries(VARIANTS)) {
  const TL = JSON.parse(readFileSync(`timeline/${v}.json`, 'utf8'));
  const srt = TL.caps.map((c, i) => `${i + 1}\n${ts(Math.max(0, c.a))} --> ${ts(c.b)}\n${c.text}\n`).join('\n');
  writeFileSync(`out/deliver/${V.name}.srt`, srt);
  if (TL.cut === 'long') {
    const names = CHAPTERS[TL.lang];
    chapters[v] = TL.shots.filter((s) => names[s.kind]).map((s) => `${mmss(s.kind === 'swarm' ? 0 : s.a)} ${names[s.kind]}`);
  }
  console.log(`${V.name}.srt · ${TL.caps.length} cues · ${mmss(TL.duration)}`);
}
writeFileSync('out/deliver/chapters.json', JSON.stringify(chapters, null, 1));
for (const [v, c] of Object.entries(chapters)) console.log(`\n${v}\n${c.join('\n')}`);
