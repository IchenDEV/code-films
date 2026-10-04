// 一部新片子的全部内容：旁白（每种语言一列，顺序同 film.json → languages）与镜头表。
export const LINES = {
  l1: ['每一部片子，都从一句话开始。', 'Every film begins with a single line.'],
  l2: ['把它写进 script.mjs，画面和声音会跟着它走。', 'Write it in script.mjs, and the picture and sound will follow.'],
};

export const LABELS = { title: ['新片', 'NEW FILM'] };

// kind 对应 shots/*.js 里注册的 SHOT[kind]；lines 依次念出；lead/gap/tail 为留白（秒）；xf 为叠化
export const SHOTS = [
  { kind: 'stars', lines: ['l1', 'l2'], lead: 1.5, gap: 0.8, tail: 2.0, min: 8, xf: 0 },
  { kind: 'title', lines: [], min: 5, label: 'title', xf: 1.2 },
];
