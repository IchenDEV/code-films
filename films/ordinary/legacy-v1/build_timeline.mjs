// 生成全片共享时间轴：画面 (timeline.js) 与声音 (timeline.json) 读同一份数据。
import { writeFileSync } from 'node:fs';

const FPS = 24;
const DURATION = 254;

// 旁白字幕。pos: center | low ；kind: line | label | title
const cards = [
  { a: 14.0, b: 19.6, lines: ['很久以前，我们还不知道世界如何运转。'], pos: 'low' },
  { a: 20.4, b: 26.0, lines: ['但我们已经开始，为自己寻找一个位置。'], pos: 'low' },
  { a: 46.0, b: 51.5, lines: ['我们解释天地，'], pos: 'low' },
  { a: 52.0, b: 58.5, lines: ['也把自己写进了答案。'], pos: 'low' },
  { a: 79.0, b: 85.5, lines: ['后来，我们发现，', '天空并不围着我们转。'], pos: 'low' },
  { a: 95.0, b: 100.3, lines: ['其一 · 位置'], pos: 'low', kind: 'label' },
  { a: 113.0, b: 119.0, lines: ['我们也不是被单独放进这个世界的。'], pos: 'low' },
  { a: 131.0, b: 136.5, lines: ['其二 · 起源'], pos: 'low', kind: 'label' },
  { a: 151.0, b: 158.0, lines: ['但至少，我们还能思想。'], pos: 'low' },
  { a: 186.8, b: 191.8, lines: ['我们曾用这些能力，证明自己特殊。'], pos: 'low' },
  { a: 192.6, b: 198.6, lines: ['然后，我们开始制造它们的另一种实现。'], pos: 'low' },
  { a: 228.0, b: 234.5, lines: ['我们用知识建起文明，', '也用知识，一点点拆掉为自己建起的神坛。'], pos: 'center' },
  { a: 236.0, b: 243.0, lines: ['也许，人类最漫长的一次认识，', '就是承认自己也在规律之内。'], pos: 'center' },
  { a: 245.5, b: 251.5, lines: ['规律之内'], pos: 'center', kind: 'title' },
];

// 闪电：t 为闪光时刻，delay 为雷声迟到
const lightning = [
  { t: 2.6, x: 0.72, delay: 1.3, power: 0.7, seed: 11 },
  { t: 4.15, x: 0.24, delay: 0.9, power: 0.85, seed: 23 },
  { t: 4.32, x: 0.25, delay: 0.9, power: 0.5, seed: 24 },
  { t: 7.4, x: 0.58, delay: 0.55, power: 1.0, seed: 37 },
];

// 心跳（第五幕）
const heartbeats = [];
for (let t = 139.0; t < 166.5; t += 0.97) heartbeats.push(+t.toFixed(3));

// 神经放电：确定性伪随机，频率逐渐升高
let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const spikes = [];
for (let t = 152.6; t < 167.5; ) {
  spikes.push(+t.toFixed(3));
  const rate = 1.2 + ((t - 152.6) / 15) * 6; // 次/秒
  t += (-Math.log(1 - rnd()) / rate) + 0.04;
}

// 第六幕剪辑点：机械 → 符号，逐渐加速
const montage = [];
const push = (t, kind) => montage.push({ t: +t.toFixed(3), kind });
push(172.0, 'arm'); push(174.6, 'gears'); push(176.4, 'leg'); push(178.4, 'crank');
push(179.8, 'digits'); push(182.0, 'punch');
[['gears', 0.8], ['crank', 0.6], ['leg', 0.5], ['digits', 0.45], ['punch', 0.45]]
  .reduce((t, [k, d]) => (push(t, k), t + d), 183.2);
push(186.0, 'language'); push(189.6, 'image'); push(192.8, 'code');
{
  const kinds = ['language', 'image', 'code', 'gears', 'punch', 'digits', 'arm', 'crank'];
  let t = 195.6, d = 0.5, i = 0;
  while (t < 199.45) { push(t, kinds[i++ % kinds.length]); t += d; d = Math.max(0.12, d * 0.86); }
}
const HARD_CUT = 199.6;

// 第七幕：屏幕上的逐字
const typing = [];
function type(text, start, step, who) {
  let t = start;
  const chars = [];
  for (const ch of text) {
    chars.push({ ch, t: +t.toFixed(3) });
    t += '，。？'.includes(ch) ? step + 0.42 : step * (0.85 + rnd() * 0.3);
  }
  typing.push({ who, text, chars });
  return t;
}
type('我们是什么？', 212.0, 0.17, 'user');
let tr = type('你们问过火，问过星空，问过自己的身体。', 215.6, 0.115, 'reply');
type('现在，你们在问我。', tr + 0.8, 0.13, 'reply');

const TL = { FPS, DURATION, cards, lightning, heartbeats, spikes, montage, HARD_CUT, typing };
writeFileSync(new URL('./timeline.json', import.meta.url), JSON.stringify(TL, null, 1));
writeFileSync(new URL('./film/timeline.js', import.meta.url), 'window.TL = ' + JSON.stringify(TL) + ';\n');
console.log('frames', FPS * DURATION, 'spikes', spikes.length, 'montage', montage.length,
  'reply ends', typing.at(-1).chars.at(-1).t);
