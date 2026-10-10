// 按实测旁白排出一个成片版本的时间轴：镜头、对位点、字幕（逐字时间）、年代标签、配乐段落。
// 用法：node tools/timeline.mjs <variant>…（不给就全部）→ timeline/<variant>.json + .js
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { BEATS, VARIANTS, TXT, MARKS } from '../script.mjs';

const CFG = JSON.parse(readFileSync('film.json', 'utf8'));
const FPS = CFG.fps;
const LEAD = 0.12, GAP = 0.2; // 节奏：镜头内句间只留一口气
const BREAKS = /[，。？！；：…、—]/;

const stripCues = (s) => s.replace(/\{[a-z0-9_]+\}/g, '');
// 与 tts.py 的 parse() 一致：cue 在去掉标记后的发送文本里的字符位置
function cuePositions(text) {
  const cues = {};
  let n = 0;
  for (const part of text.split(/(\{[a-z0-9_]+\})/)) {
    const m = part.match(/^\{([a-z0-9_]+)\}$/);
    if (m) cues[m[1]] = n; else n += [...part].length;
  }
  return cues;
}

function findVO(lang, id, text) {
  const dir = `out/vo/${lang}`;
  if (!existsSync(dir)) return null;
  // 同一段文本可能有多次合成（换过声音参数），取最新的一次
  let best = null, bt = -1;
  for (const f of readdirSync(dir)) {
    if (!f.startsWith(id + '-') || !f.endsWith('.json')) continue;
    const m = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const mt = statSync(`${dir}/${f}`).mtimeMs;
    // 只比较念出来的文本（去掉 {cue}）：加减对位点不需要重新合成
    if (stripCues(m.text) === stripCues(text) && mt > bt) { best = { ...m, cues: cuePositions(text), file: `${dir}/${f.replace('.json', '.mp3')}` }; bt = mt; }
  }
  return best;
}

// 没有配音时按语速估算，便于先排画面
function estimate(text, lang) {
  const p = text.replace(/\{[a-z0-9_]+\}/g, '').replace(/\[[^\]]*\]/g, '');
  const n = lang === 'zh' ? [...p.replace(/[\s，。？！；：…、—“”"]/g, '')].length / 4.7 : p.split(/\s+/).length / 2.7;
  return n + 0.2;
}

// 发送文本的逐字时间 → 去掉 [tag] 后可见字符的时间
function visibleChars(m, lang) {
  const al = m.alignment, out = [];
  // 字幕用原文：合成时做过等长的读音替换（协调→协条 等），按下标换回来
  const shown = m.shown && [...m.shown].length === al.characters.length ? [...m.shown] : al.characters;
  let inTag = false;
  for (let i = 0; i < al.characters.length; i++) {
    const c = shown[i];
    if (c === '[') { inTag = true; continue; }
    if (c === ']') { inTag = false; continue; }
    if (inTag) continue;
    out.push({ c, t: al.character_start_times_seconds[i] - m.trimStart, e: al.character_end_times_seconds[i] - m.trimStart });
  }
  // 标签两侧会留下多余空格
  const res = [];
  for (const ch of out) if (!(ch.c === ' ' && (!res.length || res.at(-1).c === ' '))) res.push(ch);
  return res;
}

function phrases(chars, lang, maxLen) {
  const out = [];
  let cur = [];
  const flush = () => {
    while (cur.length && /\s/.test(cur[0].c)) cur.shift();
    while (cur.length && /\s/.test(cur.at(-1).c)) cur.pop();
    if (cur.length) out.push(cur);
    cur = [];
  };
  for (const ch of chars) {
    cur.push(ch);
    if (BREAKS.test(ch.c) || (lang === 'en' && /[,.?!;:]/.test(ch.c) && ch.c !== "'")) flush();
  }
  flush();
  // 过长的短语从中间断开（英文在空格处，中文在“的/了/是”之后或正中）
  const res = [];
  const len = (p) => (lang === 'zh' ? p.filter((c) => !/[，。？！；：…、—“”\s]/.test(c.c)).length : p.length);
  const split = (p) => {
    if (len(p) <= maxLen) return res.push(p);
    const mid = p.length / 2;
    let best = Math.floor(mid), bd = 1e9;
    for (let i = 2; i < p.length - 2; i++) {
      // 中文不在英文单词中间断开（如 Symphony），英文只在空格处断
      const inWord = /[A-Za-z0-9]/.test(p[i - 1].c) && /[A-Za-z0-9]/.test(p[i].c);
      const ok = lang === 'zh' ? !inWord && (/[的了是在把就和与]/.test(p[i - 1].c) || /\s/.test(p[i].c)) : p[i].c === ' ';
      const d = Math.abs(i - mid) + (ok ? 0 : lang === 'zh' && !inWord ? 3 : 1e6);
      if (d < bd) { bd = d; best = i; }
    }
    split(p.slice(0, best)); split(p.slice(best).filter((c, i) => i || !/\s/.test(c.c)));
  };
  out.forEach(split);
  return res;
}

const display = (p, lang) => {
  let s = p.map((c) => c.c).join('');
  s = lang === 'zh' ? s.replace(/[，。；：、…—]+$/u, '') : s.replace(/[,.;:—]+$/u, '');
  return s.trim();
};

function build(vname) {
  const V = VARIANTS[vname];
  const { cut, lang, fmt } = V;
  const L = lang === 'zh' ? 0 : 1;
  const beats = BEATS[cut];
  const vertical = fmt !== 'h';
  const maxLen = lang === 'zh' ? (vertical ? 13 : 20) : (vertical ? 30 : 46);
  const shots = [], vo = [], caps = [], chips = [], acts = [], eras = [];
  let t = 0, measured = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const newShot = !shots.length || shots.at(-1).kind !== b.shot || b.silent;
    if (newShot) {
      if (shots.length) shots.at(-1).b = +t.toFixed(3);
      shots.push({ kind: b.shot, a: +t.toFixed(3), b: 0, beats: [], cues: {} });
    }
    const sh = shots.at(-1);
    sh.beats.push(b.id);
    if (!acts.length || acts.at(-1).name !== b.act) acts.push({ name: b.act, a: +t.toFixed(3) });
    if (b.silent) { sh.cues[b.id] = t; t += b.min; continue; }
    const text = V.override?.[b.id]?.[lang] ?? b[lang];
    const m = findVO(lang, b.id, text);
    const start = t + (newShot ? LEAD : 0);
    let dur, chars = null;
    if (m) { measured++; dur = m.dur; chars = visibleChars(m, lang); } else dur = estimate(text, lang);
    sh.cues[b.id] = +start.toFixed(3);
    // 对位点
    const cueNames = [...text.matchAll(/\{([a-z0-9_]+)\}/g)].map((x) => x[1]);
    if (m) {
      const al = m.alignment;
      for (const [name, idx] of Object.entries(m.cues)) {
        const k = Math.min(idx, al.characters.length - 1);
        // 跳过紧跟在 cue 后面的 [tag] 和空格
        let j = k;
        while (j < al.characters.length - 1 && (al.characters[j] === ' ' || al.characters[j] === '[')) {
          if (al.characters[j] === '[') while (j < al.characters.length - 1 && al.characters[j] !== ']') j++;
          j++;
        }
        sh.cues[name] = +(start + al.character_start_times_seconds[j] - m.trimStart).toFixed(3);
      }
      vo.push({ id: b.id, file: m.file, t: +start.toFixed(3), trim: m.trimStart, dur });
      for (const p of phrases(chars, lang, maxLen)) {
        const text = display(p, lang);
        if (!text) continue;
        caps.push({ a: +(start + p[0].t).toFixed(3), b: +(start + p.at(-1).e).toFixed(3), text,
          w: p.filter((c) => !/\s/.test(c.c)).map((c) => +(start + c.t).toFixed(3)) });
      }
    } else {
      // 估算：cue 按在文本里的位置比例分布
      const plain = text.replace(/\[[^\]]*\]/g, '');
      for (const name of cueNames) sh.cues[name] = +(start + dur * plain.indexOf(`{${name}}`) / plain.length).toFixed(3);
      caps.push({ a: start, b: start + dur, text: plain.replace(/\{[a-z0-9_]+\}/g, ''), w: [] });
    }
    t = start + dur + (b.gap ?? GAP) + (b.pad ?? 0);
  }
  shots.at(-1).b = +t.toFixed(3);
  // 字幕：相邻短语间的小空隙补齐，避免闪烁
  for (let i = 0; i < caps.length; i++) {
    const nx = caps[i + 1];
    caps[i].b = nx && nx.a - caps[i].b < 0.45 ? nx.a : +(caps[i].b + 0.25).toFixed(3);
  }
  for (let i = 0; i < acts.length; i++) acts[i].b = acts[i + 1]?.a ?? +t.toFixed(3);
  // 年代标记：标尺位置与日期标签来自同一条记录
  const shotOf = {};
  for (const s of shots) for (const id of s.beats) shotOf[id] = s;
  const marks = MARKS.filter(([id]) => shotOf[id]).map(([id, cue, date, label]) => ({ t: shotOf[id].cues[cue] ?? shotOf[id].cues[id], date, label }))
    .sort((a, b) => a.t - b.t);
  marks.forEach((m, i) => {
    eras.push({ t: +m.t.toFixed(3), era: m.date });
    if (m.label) chips.push({ a: +m.t.toFixed(3), b: +Math.min(m.t + 3.4, (marks[i + 1]?.t ?? 1e9) - 0.15).toFixed(3), text: m.label[L] });
  });
  const txt = Object.fromEntries(Object.entries(TXT).map(([k, v]) => [k, v[L]]));
  const TL = { variant: vname, cut, lang, fmt, safe67: !!V.safe67, fps: FPS, duration: +t.toFixed(3), shots, vo, caps, chips, acts, eras, txt };
  mkdirSync('timeline', { recursive: true });
  writeFileSync(`timeline/${vname}.json`, JSON.stringify(TL, null, 1));
  writeFileSync(`timeline/${vname}.js`, `window.TL = ${JSON.stringify(TL)};\n`);
  const fmtT = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  console.log(`${vname.padEnd(12)} ${fmtT(t)} · ${shots.length} shots · vo ${measured}/${beats.filter((b) => !b.silent).length} measured`);
  if (process.argv.includes('-v')) for (const s of shots) console.log('   ', fmtT(s.a), s.kind.padEnd(10), (s.b - s.a).toFixed(1) + 's', Object.keys(s.cues).join(' '));
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const v of names.length ? names : Object.keys(VARIANTS)) build(v);
