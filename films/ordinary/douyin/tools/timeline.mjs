// 排出抖音版的时间轴：画面段落、字幕（逐字时刻）、关键词时刻、配乐段落、旁白片段。
// 时间完全由实测旁白决定（tools/tts.py → out/vo/zh.json）：
//   每个 act 的旁白整段连续播放；句子的起点 = 这句第一个字被念出的时刻（画面提前 0.12 秒切）；
//   停顿只加在 act 与 act 之间（GAP）；片尾互动卡在旁白念完后再停留 hold 秒。
// 每个画面段落记下它取原片哪个镜头的哪一段（SEGS 的 src / from / to），合成时按段落长度换算成原片镜头内的时间。
// 用法：node tools/timeline.mjs [-v] → timeline/douyin.json + .js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { LINES, SEGS, VARIANTS, TXT } from '../script.mjs';
import { CAPTIONS } from '../../script.mjs';

const CFG = JSON.parse(readFileSync('film.json', 'utf8'));
const SRC = JSON.parse(readFileSync('../timeline_zh.json', 'utf8')); // 原片时间轴：镜头长度与镜头内对位
const GAP = 0.3; // act 与 act 之间的一口气
const LEAD = 0.12; // 画面比第一个字早一点切
const MAXCAP = 13; // 竖屏一屏字幕一行，最多约 13 字；长句按标点分屏，不在词中间折行

// 字幕分页：一句超过两行的容量时，在中间附近的标点后拆成几屏（按逐字时刻切开，旁白不变）
function pages(cap, max) {
  const n = [...cap.text].length;
  if (n <= max) return [cap];
  let best = -1, bd = 1e9;
  for (let i = 3; i < n - 3; i++) {
    if (!/[，。；：？！、”]/.test(cap.text[i]) && !(cap.text[i] === '—' && cap.text[i + 1] !== '—')) continue;
    const d = Math.abs(i + 1 - n / 2);
    if (d < bd) { bd = d; best = i + 1; }
  }
  if (best < 0) return [cap];
  const cut = (a, b, t0, t1) => ({ id: cap.id, a: t0, b: t1, text: cap.text.slice(a, b), ct: cap.ct.slice(a, b),
    kr: cap.kr.map(([x, y]) => [Math.max(x, a) - a, Math.min(y, b) - a]).filter(([x, y]) => y > x) });
  const tm = +(cap.ct[best] - 0.08).toFixed(3);
  return [...pages(cut(0, best, cap.a, tm), max), ...pages(cut(best, n, tm, cap.b), max)];
}

const vf = 'out/vo/zh.json';
if (!existsSync(vf)) throw new Error(`没有旁白 ${vf}：先跑 python3 tools/tts.py`);
const vo = JSON.parse(readFileSync(vf, 'utf8'));
const plan = [], voice = [];
let t = 0;
for (let i = 0; i < LINES.length;) {
  const act = LINES[i].act, group = [];
  while (i < LINES.length && LINES[i].act === act) group.push(LINES[i++]);
  const p = vo.find((x) => x.act === act);
  if (!p) throw new Error(`旁白里没有 ${act}：先重跑 tts`);
  const v0 = t + LEAD;
  voice.push({ id: act, file: p.file, trim: p.a, dur: p.dur, t: +v0.toFixed(3) });
  const starts = group.map((l, k) => (k === 0 ? t : v0 + p.lines[l.id].a - LEAD));
  const hold = SEGS[group.at(-1).seg].hold ?? 0;
  const end = v0 + p.dur + (hold || GAP);
  group.forEach((l, k) => {
    const ct = p.lines[l.id].ct.map((x) => +(v0 + x).toFixed(3));
    plan.push({ l, a: starts[k], b: k + 1 < group.length ? starts[k + 1] : end, ct, spokenEnd: v0 + p.lines[l.id].b });
  });
  t = end;
}
const duration = t;
const shots = [], caps = [], acts = [];
for (const p of plan) {
  const { l } = p;
  if (!shots.length || shots.at(-1).kind !== l.seg) {
    if (shots.length) shots.at(-1).b = +p.a.toFixed(3);
    const S = SEGS[l.seg];
    if (!S) throw new Error(`${l.id}：SEGS 里没有 ${l.seg}`);
    const src = S.src && SRC.shots.find((s) => s.kind === S.src);
    if (S.src && !src) throw new Error(`原片没有镜头 ${S.src}`);
    if (src && S.to > src.b - src.a) throw new Error(`${l.seg}：to ${S.to} 超出原片镜头 ${S.src} 的长度 ${(src.b - src.a).toFixed(2)}`);
    shots.push({ kind: l.seg, src: S.src, from: S.from, to: S.to, w: S.w ?? 1180, cx: S.cx ?? 960, cy: S.cy ?? 540, sync: S.sync ?? [], stamp: S.stamp ?? [],
      caption: S.src && CAPTIONS[srcCaption(S.src)] ? CAPTIONS[srcCaption(S.src)][0] : null, a: +p.a.toFixed(3), b: 0, lines: [], cues: {}, k: {} });
  }
  const sh = shots.at(-1);
  sh.lines.push(l.id);
  sh.cues[l.id] = +p.a.toFixed(3);
  for (const [name, sub] of Object.entries(l.k ?? {})) {
    const at = l.zh.indexOf(sub);
    if (at < 0) throw new Error(`${l.id} 里找不到关键词 ${sub}`);
    sh.k[name] = p.ct[at];
  }
  if (!acts.length || acts.at(-1).name !== l.act) acts.push({ name: l.act, a: +p.a.toFixed(3) });
  const kr = Object.values(l.k ?? {}).map((sub) => { const at = l.zh.indexOf(sub); return [at, at + sub.length]; });
  caps.push(...pages({ id: l.id, a: +p.a.toFixed(3), b: +Math.min(p.b, p.spokenEnd + 0.6).toFixed(3), text: l.zh, ct: p.ct, kr }, MAXCAP));
}
shots.at(-1).b = +duration.toFixed(3);
// 原片镜头内的时间锚点：段落起点 → from，关键词时刻 → 指定的原片秒，段落终点 → to
for (const s of shots) {
  if (!s.src) continue;
  const mid = s.sync.map(([k, o]) => { if (!(k in s.k)) throw new Error(`${s.kind}：sync 的关键词 ${k} 不在这段旁白里`); return [+(s.k[k] - s.a).toFixed(3), o]; });
  s.map = [[0, s.from], ...mid, [+(s.b - s.a).toFixed(3), s.to]];
  delete s.sync;
}
for (let i = 0; i < acts.length; i++) acts[i].b = acts[i + 1]?.a ?? +duration.toFixed(3);

// 原片镜头的图说键：大多与镜头同名，几处不同
function srcCaption(src) { return { neurons: 'cajal' }[src] ?? src; }

const V = VARIANTS.douyin;
const TL = { variant: 'douyin', fps: CFG.fps, duration: +duration.toFixed(3), shots, caps, acts, vo: voice, cta: V.cta, txt: TXT };
mkdirSync('timeline', { recursive: true });
writeFileSync('timeline/douyin.json', JSON.stringify(TL, null, 1));
writeFileSync('timeline/douyin.js', `window.CUT = ${JSON.stringify(TL)};\n`);
const fmtT = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
const lens = plan.map((p) => p.b - p.a);
console.log(`douyin ${fmtT(duration)} · ${shots.length} 段画面（平均 ${(duration / shots.length).toFixed(1)}s）· ${caps.length} 屏字幕 · 一句最长 ${Math.max(...lens).toFixed(1)}s`);
for (const s of shots) {
  if (!s.src) continue;
  const sp = Math.max(...s.map.slice(1).map(([u, o], i) => (o - s.map[i][1]) / (u - s.map[i][0])));
  const flag = sp > 2.6 || sp < 0.5 ? '  ⚠ 速度' : '';
  if (process.argv.includes('-v') || flag) console.log('   ', fmtT(s.a), s.kind.padEnd(11), (s.b - s.a).toFixed(1) + 's', `×${sp.toFixed(2)}`, s.lines.join(' ') + flag);
}
