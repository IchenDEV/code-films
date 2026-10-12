// 排出一个成片版本的时间轴：镜头、字幕、配乐段落（、旁白）。
//   长版无口播：时间完全由 script.mjs 里的拍数决定；作曲后测出拍点（out/music/long-beats.json），段落内部的字幕起点吸附上去。
//   短版有旁白：每句的长度 = max(实测旁白 + 一口气, 画面需要的最短时间)，配乐按排好的段落再作曲。
// 用法：node tools/timeline.mjs [variant…]（不给就全部）→ timeline/<variant>.json + .js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { LINES, SHORT, VARIANTS, TXT, BPM } from '../script.mjs';
const CUTS = { long: LINES, short: SHORT };

const CFG = JSON.parse(readFileSync('film.json', 'utf8'));
const BEAT = 60 / BPM;
const LEAD = 0.1; // 字幕比拍点早一点点出现，读起来正好落在拍上

// 字数检查：一句中文不超过 18 字（标点、空格、英文名不算）
for (const l of [...LINES, ...SHORT]) {
  if (!l.zh) continue;
  const n = [...l.zh.replace(/[A-Za-z0-9\s，。？！；：…、—“”"「」·]/g, '')].length;
  if (n > 18) console.warn(`! ${l.id} 有 ${n} 个字，超过 18：${l.zh}`);
}

// 作曲后测出的拍点（长版）
const BEATS = { long: existsSync('out/music/long-beats.json') ? JSON.parse(readFileSync('out/music/long-beats.json', 'utf8')) : null };
let beats = null;
// 短版的旁白（tools/tts.py 的输出）
const VO = (lang) => (existsSync(`out/vo/short-${lang}.json`) ? JSON.parse(readFileSync(`out/vo/short-${lang}.json`, 'utf8')) : null);
function snap(t, lo, hi) {
  if (!beats) return t;
  let best = t, bd = 0.22; // 只在 ±0.22 秒内吸附，且不越过段落边界
  for (const b of beats.beats) if (Math.abs(b - t) < bd && b > lo && b < hi) { bd = Math.abs(b - t); best = b; }
  return best;
}

function build(vname) {
  const V = VARIANTS[vname];
  beats = BEATS[V.cut] ?? null;
  const vo = V.cut === 'short' ? VO(V.lang) : null;
  const shots = [], caps = [], acts = [], voice = [];
  let t = 0;
  // 先排出每一句的起止。
  //   长版：按拍子。
  //   短版：每个段落的旁白整段连续播放；句子的起点 = 这句第一个字被念出的时刻（镜头提前 0.12 秒切），
  //         停顿只加在段与段之间；段落最后一句不短于画面需要的 0.85 × 拍数（让动画演完）。
  const CUT = CUTS[V.cut];
  let plan;
  if (!vo) {
    plan = CUT.map((l) => { const a = t; t += (l.beats + (l.rest ?? 0)) * BEAT; return { l, a, b: a + l.beats * BEAT, end: t }; });
  } else {
    plan = [];
    for (let i = 0; i < CUT.length;) {
      const act = CUT[i].act, group = [];
      while (i < CUT.length && CUT[i].act === act) group.push(CUT[i++]);
      const p = vo.find((x) => x.act === act);
      const a0 = t;
      if (!p) { for (const l of group) { plan.push({ l, a: t, b: t + l.beats * BEAT }); t += l.beats * BEAT; } continue; }
      const v0 = a0 + 0.1;
      voice.push({ id: act, file: p.file, trim: p.a, dur: p.dur, t: +v0.toFixed(3) });
      const starts = group.map((l, k) => (k === 0 ? a0 : v0 + p.lines[l.id][0] - 0.12));
      const last = group.at(-1);
      const end = Math.max(v0 + p.dur + 0.35, starts.at(-1) + last.beats * BEAT * 0.85) + (last.rest ?? 0) * BEAT;
      group.forEach((l, k) => plan.push({ l, a: starts[k], b: k + 1 < group.length ? starts[k + 1] : end - (l.rest ?? 0) * BEAT }));
      t = end;
    }
  }
  const duration = t;
  // 段落边界（配乐的 chunk 边界）保持不动；段落内部的句子起点吸附到实测拍点
  const actStart = {};
  for (const p of plan) if (!(p.l.act in actStart)) actStart[p.l.act] = p.a;
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (!vo && actStart[p.l.act] !== p.a) {
      const s = snap(p.a, plan[i - 1].a + 2.4, p.b - 2.4);
      if (s !== p.a) { plan[i - 1].b += s - p.a; plan[i - 1].end = s; p.a = s; }
    }
  }
  for (const p of plan) {
    const { l } = p;
    if (!shots.length || shots.at(-1).kind !== l.shot) {
      if (shots.length) shots.at(-1).b = +p.a.toFixed(3);
      shots.push({ kind: l.shot, a: +p.a.toFixed(3), b: 0, lines: [], cues: {} });
    }
    const sh = shots.at(-1);
    sh.lines.push(l.id);
    sh.cues[l.id] = +p.a.toFixed(3);
    sh.cues[l.id + '_end'] = +p.b.toFixed(3);
    if (!acts.length || acts.at(-1).name !== l.act) acts.push({ name: l.act, a: +p.a.toFixed(3) });
    if (l.zh) caps.push({ id: l.id, a: +Math.max(0, p.a - LEAD).toFixed(3), b: +(p.b - 0.12).toFixed(3), zh: l.zh, en: l.en });
  }
  shots.at(-1).b = +duration.toFixed(3);
  for (let i = 0; i < acts.length; i++) acts[i].b = acts[i + 1]?.a ?? +duration.toFixed(3);
  const TL = { variant: vname, cut: V.cut, poll: !!V.poll, vo: voice, fmt: V.fmt, lang: V.lang, safe67: !!V.safe67, fps: CFG.fps, bpm: BPM, beat: BEAT,
    duration: +duration.toFixed(3), shots, caps, acts, cta: V.cta, txt: TXT, snapped: !!beats };
  mkdirSync('timeline', { recursive: true });
  writeFileSync(`timeline/${vname}.json`, JSON.stringify(TL, null, 1));
  writeFileSync(`timeline/${vname}.js`, `window.TL = ${JSON.stringify(TL)};\n`);
  const fmtT = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  console.log(`${vname.padEnd(14)} ${fmtT(duration)} · ${shots.length} shots · ${caps.length} lines${beats ? ' · snapped to measured beats' : ''}${voice.length ? ` · narration ${voice.length} lines` : ''}`);
  if (process.argv.includes('-v')) for (const s of shots) console.log('   ', fmtT(s.a), s.kind.padEnd(9), (s.b - s.a).toFixed(1) + 's', s.lines.join(' '));
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const v of names.length ? names : Object.keys(VARIANTS)) build(v);
