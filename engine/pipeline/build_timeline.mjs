// 根据旁白时长排出镜头表，生成画面与声音共享的时间轴（每种语言一份）。
// 在片子目录里运行（./run.sh <片名> timeline）。有配音时读 out/vo/<lang>/manifest.json 的实测时长，否则按语速估算。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const FILM = process.cwd();
const CONFIG = JSON.parse(readFileSync(join(FILM, 'film.json'), 'utf8'));
const { LINES, SCREEN = {}, LABELS = {}, CAPTIONS = {}, SHOTS } = await import(pathToFileURL(join(FILM, 'script.mjs')));
const EVENTS = existsSync(join(FILM, 'events.mjs')) ? await import(pathToFileURL(join(FILM, 'events.mjs'))) : null;
const FPS = CONFIG.fps ?? 24;

function estimate(text, lang) {
  if (/^(zh|ja)/.test(lang)) return [...text.replace(/[，。、：；！？“”《》—\s]/g, '')].length / 3.7 + 0.35;
  return text.split(/\s+/).length / 2.25 + 0.35;
}

// variant：同一语言的另一套配音（如 enB），文件名用 variant，内容语言仍是 lang
function build(lang, variant = lang) {
  const L = CONFIG.languages.indexOf(lang); // 文本数组里的下标
  const mf = `out/vo/${variant}/manifest.json`;
  const measured = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : {};
  const dur = (id) => measured[id]?.duration ?? estimate(LINES[id][L], lang);

  // 确定性伪随机
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

  // 节奏：句与句之间额外的呼吸（film.json → breath）
  const BREATH = CONFIG.breath?.[lang] ?? 0.1;
  const shots = [], subs = [], captions = [], labels = [], vo = [];
  let end = 0;
  for (const def of SHOTS) {
    const xf = def.xf ?? 1;
    const start = def.silenceBefore ? end + def.silenceBefore : Math.max(0, end - xf);
    let lt = (def.lead ?? 0.8) + (def.lines.length ? BREATH * 0.5 : 0);
    const lines = [];
    def.lines.forEach((id, i) => {
      const d = dur(id);
      lines.push({ id, a: +(start + lt).toFixed(3), d: +d.toFixed(3) });
      lt += d + (i < def.lines.length - 1 ? (def.gap ?? 0.6) + BREATH : 0);
    });
    // 带章节标签的镜头保留完整的尾部停顿，其余收紧 15%
    lt += def.lines.length ? (def.tail ?? 1.2) * (def.label ? 1 : 0.85) + BREATH : 0;
    const d = Math.max(def.min ?? 0, lt);
    const shot = { kind: def.kind, a: +start.toFixed(3), b: +(start + d).toFixed(3), fi: def.silenceBefore || shots.length === 0 ? 0.01 : xf, fo: 1, lines: lines.map((l) => l.id) };
    // 下一个镜头的叠化长度决定本镜头的淡出
    if (shots.length) shots.at(-1).fo = def.silenceBefore || def.xf === 0 ? 0.01 : xf;
    if (def.hardOut) shot.hardOut = true;
    shots.push(shot);
    for (const l of lines) {
      vo.push({ id: l.id, t: l.a, d: l.d });
      subs.push({ a: l.a - 0.1, b: +(l.a + l.d + 0.35).toFixed(3), text: LINES[l.id][L] });
      shot[l.id] = l.a - start; // 镜头内的台词时刻，供画面对位
      shot[l.id + '_end'] = l.a - start + l.d;
    }
    if (def.caption) captions.push({ a: start + 0.9, b: start + d - 0.5, text: CAPTIONS[def.caption][L] });
    if (def.label) {
      const title = def.label === 'title';
      labels.push({ a: title ? start + 0.9 : start + d - 4.2, b: title ? start + d - 0.8 : start + d - 0.2, text: LABELS[def.label][L], kind: title ? 'title' : 'label' });
    }
    end = start + d;
  }
  const DURATION = +(end + 0.5).toFixed(3);

  // 片子专属的镜头内事件（可选）：<片目录>/events.mjs 导出 addEvents()
  if (EVENTS) EVENTS.addEvents({ lang, L, shots, SCREEN, rnd });

  const TL = { lang, FPS, DURATION, shots, subs, captions, labels, vo };
  writeFileSync(`timeline_${variant}.json`, JSON.stringify(TL, null, 1));
  writeFileSync(`timeline_${variant}.js`, `window.TL = ${JSON.stringify(TL)};\n`);
  const fmt = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  console.log(`[${lang}] ${fmt(DURATION)} · ${shots.length} shots · vo ${Object.keys(measured).length ? 'measured' : 'estimated'}`);
  if (process.argv.includes('-v')) for (const sh of shots) console.log('  ', fmt(sh.a), sh.kind.padEnd(11), (sh.b - sh.a).toFixed(1) + 's');
}

// 参数可以是语言，也可以是同一语言的另一套配音（如 enB → 语言 en）
const variants = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const v of variants.length ? variants : CONFIG.languages) build(CONFIG.languages.find((l) => v.startsWith(l)), v);
