// 排出一个成片版本的时间轴：镜头、字幕（逐字时刻）、关键词时刻、配乐段落、旁白片段。
// 两个剪辑版本都有旁白，时间完全由实测旁白决定（tools/tts.py → out/vo/<cut>-<lang>.json）：
//   每个段落的旁白整段连续播放；句子的起点 = 这句第一个字被念出的时刻（镜头提前 0.12 秒切）；
//   停顿只加在段与段之间（GAP）；一句至少停留 min 秒（画面要演完）；片尾没有旁白，停留 hold 秒。
// 关键词 k 是 { 名字: 字幕里的子串 }。
// 用法：node tools/timeline.mjs [variant…]（不给就全部）→ timeline/<variant>.json + .js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { LINES, VARIANTS, TXT } from '../script.mjs';

const CFG = JSON.parse(readFileSync('film.json', 'utf8'));
const GAP = 0.32; // 段与段之间的一口气
const LEAD = 0.12; // 镜头比第一个字早一点切

// 字幕分页：一句超过两行的容量（竖屏约 26 字、横屏约 50 字）时，在中间附近的标点后拆成几屏。
// 按逐字时刻切开，旁白不变；每一屏从它第一个字被念出前一点开始。
function pages(cap, max) {
  const n = [...cap.text].length;
  if (n <= max) return [cap];
  let best = -1, bd = 1e9;
  for (let i = 4; i < n - 4; i++) {
    if (!/[，。；：？！、]/.test(cap.text[i]) && !(cap.text[i] === '—' && cap.text[i + 1] !== '—')) continue;
    const d = Math.abs(i + 1 - n / 2);
    if (d < bd) { bd = d; best = i + 1; }
  }
  if (best < 0) return [cap];
  const cut = (a, b, t0, t1) => ({ id: cap.id, a: t0, b: t1, text: cap.text.slice(a, b), ct: cap.ct.slice(a, b),
    kr: cap.kr.map(([x, y]) => [Math.max(x, a) - a, Math.min(y, b) - a]).filter(([x, y]) => y > x) });
  const tm = +(cap.ct[best] - 0.08).toFixed(3);
  return [...pages(cut(0, best, cap.a, tm), max), ...pages(cut(best, n, tm, cap.b), max)];
}

function build(vname) {
  const V = VARIANTS[vname];
  const CUT = LINES[V.cut];
  const vf = `out/vo/${V.cut}-${V.lang}.json`;
  if (!existsSync(vf)) throw new Error(`没有旁白 ${vf}：先跑 python3 tools/tts.py ${V.cut} ${V.lang}`);
  const vo = JSON.parse(readFileSync(vf, 'utf8'));
  const plan = [], voice = [];
  let t = 0;
  for (let i = 0; i < CUT.length;) {
    const act = CUT[i].act, group = [];
    while (i < CUT.length && CUT[i].act === act) group.push(CUT[i++]);
    const p = vo.find((x) => x.act === act);
    if (!p) { for (const l of group) { plan.push({ l, a: t, b: t + l.hold }); t += l.hold; } continue; }
    const v0 = t + LEAD;
    voice.push({ id: act, file: p.file, trim: p.a, dur: p.dur, t: +v0.toFixed(3) });
    const starts = group.map((l, k) => (k === 0 ? t : v0 + p.lines[l.id].a - LEAD));
    // 一句太短、画面演不完时往后推（只推后面的句子起点，不挪旁白）：这里只检查，推迟会和旁白错位，所以报出来
    group.forEach((l, k) => {
      const next = k + 1 < group.length ? starts[k + 1] : v0 + p.dur;
      if (l.min && next - starts[k] < l.min - 0.05 && k + 1 < group.length) console.warn(`  ! ${l.id} 只有 ${(next - starts[k]).toFixed(2)}s，画面要 ${l.min}s`);
    });
    const last = group.at(-1);
    const end = Math.max(v0 + p.dur + GAP, starts.at(-1) + (last.min ?? 0));
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
    if (!shots.length || shots.at(-1).kind !== l.shot) {
      if (shots.length) shots.at(-1).b = +p.a.toFixed(3);
      shots.push({ kind: l.shot, a: +p.a.toFixed(3), b: 0, lines: [], cues: {}, k: {} });
    }
    const sh = shots.at(-1);
    sh.lines.push(l.id);
    sh.cues[l.id] = +p.a.toFixed(3);
    sh.cues[l.id + '_end'] = +p.b.toFixed(3);
    // 关键词：这个词第一个字被念出的时刻
    for (const [name, sub] of Object.entries(l.k ?? {})) {
      const at = l[V.lang].indexOf(sub);
      if (at < 0) throw new Error(`${l.id} 里找不到关键词 ${sub}`);
      sh.k[name] = p.ct[at];
    }
    if (!acts.length || acts.at(-1).name !== l.act) acts.push({ name: l.act, a: +p.a.toFixed(3) });
    // kr：关键词在字幕原文里的位置（字幕念到时变金色）
    const kr = Object.values(l.k ?? {}).map((sub) => { const at = l[V.lang].indexOf(sub); return [at, at + sub.length]; });
    if (l.zh) caps.push(...pages({ id: l.id, a: +p.a.toFixed(3), b: +Math.min(p.b, p.spokenEnd + 0.6).toFixed(3), text: l[V.lang], ct: p.ct, kr }, V.fmt === 'v' ? 26 : 50));
  }
  shots.at(-1).b = +duration.toFixed(3);
  for (let i = 0; i < acts.length; i++) acts[i].b = acts[i + 1]?.a ?? +duration.toFixed(3);
  const TL = { variant: vname, cut: V.cut, poll: !!V.poll, vo: voice, fmt: V.fmt, lang: V.lang, safe67: !!V.safe67, fps: CFG.fps,
    duration: +duration.toFixed(3), shots, caps, acts, cta: V.cta, txt: TXT };
  mkdirSync('timeline', { recursive: true });
  writeFileSync(`timeline/${vname}.json`, JSON.stringify(TL, null, 1));
  writeFileSync(`timeline/${vname}.js`, `window.TL = ${JSON.stringify(TL)};\n`);
  const fmtT = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  const lens = shots.map((s) => s.b - s.a), lines = plan.map((p) => p.b - p.a);
  console.log(`${vname.padEnd(9)} ${fmtT(duration)} · ${shots.length} shots (avg ${(duration / shots.length).toFixed(1)}s) · ${caps.length} lines (avg ${(lines.reduce((a, b) => a + b) / lines.length).toFixed(1)}s, max ${Math.max(...lines).toFixed(1)}s)`);
  if (process.argv.includes('-v')) for (const s of shots) console.log('   ', fmtT(s.a), s.kind.padEnd(11), (s.b - s.a).toFixed(1) + 's', s.lines.join(' '));
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const v of names.length ? names : Object.keys(VARIANTS)) build(v);
