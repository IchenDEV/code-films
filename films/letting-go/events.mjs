// 镜头内事件：把逐字对齐得到的时刻（timing/cues.json）写进镜头，画面、音效与配乐共用。
import { readFileSync, existsSync } from 'node:fs';
export function addEvents({ lang, shots }) {
  const cues = existsSync('timing/cues.json') ? JSON.parse(readFileSync('timing/cues.json', 'utf8'))[lang] ?? {} : {};
  const s = shots.find((q) => q.kind === 'letgo');
  if (!s) return;
  const c = cues.sweep;
  // 没有对齐结果时，按这句的 55% 估计
  s.sweep = c ? +(s[c.line] + c.at).toFixed(3) : +(s.g3 + 0.55 * (s.g3_end - s.g3)).toFixed(3);
}
