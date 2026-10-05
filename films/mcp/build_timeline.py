"""按各版本实测旁白与逐字对齐重建画面；无需音频或 API。"""
import json
import math
import random
import re
from project import ROOT, arguments, read_script, source_hash, synthesis_hash

project, args = arguments(__doc__)
s = read_script()
man = json.loads((project.timing / 'manifest.json').read_text())
MAXC = 24
STRIP_END = '，。；、'
alignments = {}

# 验证所有输入后才写产物，避免缺失或过期声音悄悄生成错误画面。
ids = set()
for act in s['acts']:
    if not math.isfinite(act['lead']) or act['lead'] < 0:
        raise ValueError(f'{act["id"]}: lead 必须是非负秒数')
    for line in act['lines']:
        lid = line['id']
        if lid in ids:
            raise ValueError(f'{lid}: 重复的旁白 id')
        ids.add(lid)
        entry = man[lid]
        duration = entry['duration']
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError(f'{lid}: 配音时长必须为正数')
        if not math.isfinite(line['gap']) or line['gap'] < 0:
            raise ValueError(f'{lid}: gap 必须是非负秒数')
        if entry['text'] != line['text'] or entry['hash'] != synthesis_hash(line['text'], project):
            raise ValueError(f'{lid}: 配音文本或声音设置已改变，请先运行 tts')
        alignment = json.loads((project.timing / f'align/{lid}.json').read_text())
        characters = alignment['characters']
        text = ''.join(c['text'] for c in characters)
        if not characters or ''.join(text.split()) != ''.join(line['text'].split()):
            raise ValueError(f'{lid}: 逐字对齐与旁白文本不符，请先运行 align')
        previous = 0
        for character in characters:
            start, end = character['start'], character['end']
            if (
                not all(math.isfinite(v) for v in (start, end))
                or not 0 <= start <= end <= duration + 0.1
                or start < previous
            ):
                raise ValueError(f'{lid}: 逐字对齐时间无效')
            previous = start
        audio = project.output / f'vo/{lid}.wav'
        if audio.exists() and alignment.get('_sourceHash') != source_hash(audio, line['text']):
            raise ValueError(f'{lid}: 旁白音频已改变，请先运行 align')
        alignments[lid] = characters


def chars(lid, text):
    al = alignments[lid]
    al = [c for c in al if c['text'].strip()]
    out, j = [], 0
    for ch in text:
        if not ch.strip():
            out.append(None); continue
        if j < len(al) and al[j]['text'] == ch:
            out.append((al[j]['start'], al[j]['end'])); j += 1
        else:
            out.append(None)
    # 缺失的时间用相邻插值
    known = [i for i, v in enumerate(out) if v]
    for i, v in enumerate(out):
        if v is None:
            p = max([k for k in known if k < i], default=None); n = min([k for k in known if k > i], default=None)
            t = out[p][1] if p is not None else (out[n][0] if n is not None else 0)
            out[i] = (t, t)
    return out


def screens(text):
    parts = re.findall(r'[^，。：；？！、]*[，。：；？！、]?', text)
    parts = [p for p in parts if p]
    res, cur, pos, start = [], '', 0, 0
    for p in parts:
        if cur and len((cur + p).strip()) > MAXC:
            res.append((start, cur)); start = pos; cur = ''
        cur += p; pos += len(p)
    if cur: res.append((start, cur))
    return res


def show(t):
    t = t.strip().rstrip(STRIP_END)
    return re.sub(r'[，。；]\s*', '　', t)


t = 0.0
acts, lines, subs = {}, {}, []
for a in s['acts']:
    a0 = t; t += a['lead']
    for l in a['lines']:
        d = man[l['id']]['duration']
        lines[l['id']] = {'start': round(t, 3), 'end': round(t + d, 3), 'act': a['id']}
        cs = chars(l['id'], l['text'])
        if 'sub' in l:
            sc, pos = [], 0
            for seg in l['sub'].split('|'):
                sc.append((pos, seg)); pos += len(seg)
        else:
            sc = screens(l['text'])
        for k, (i0, txt) in enumerate([] if l.get('nosub') else sc):
            st = t + max(0, cs[i0][0] - 0.08) if k else t
            subs.append({'t0': round(st, 3), 'text': show(txt), 'line': l['id']})
        # 分句开始时间（供画面对位）
        cl, i0 = [], 0
        for part in [x for x in re.findall(r'[^，。：；？！、]*[，。：；？！、]?', l['text']) if x]:
            k = next((j for j in range(i0, i0 + len(part)) if l['text'][j].strip()), i0)
            cl.append(round(t + cs[k][0], 3)); i0 += len(part)
        lines[l['id']]['cl'] = cl
        lines[l['id']]['subEnd'] = round(t + d + min(l['gap'], 0.35), 3)
        t += d + l['gap']
    acts[a['id']] = {'start': round(a0, 3), 'end': round(t, 3), 'key': a.get('key', '')}
# 字幕结束时间：下一屏开始或本句结束
for i, sb in enumerate(subs):
    nxt = subs[i + 1] if i + 1 < len(subs) else None
    lend = lines[sb['line']]['subEnd']
    sb['t1'] = round(min(lend, nxt['t0']) if nxt and nxt['line'] == sb['line'] else lend, 3)
    if nxt and nxt['t0'] - sb['t1'] < 0.25: sb['t1'] = nxt['t0']
# 提示音与物理事件：画面与混音共用这些时间
def anchor(kind, ref, k=0, off=0.0):
    if kind == 'abs': return ref
    if kind == 'act': return acts[ref]['start'] + off
    if k == 'end': return lines[ref]['end'] + off
    return lines[ref]['cl'][min(k, len(lines[ref]['cl']) - 1)] + off
CUES = {
    'title': ('abs', 0.8),
    'stamp': ('line', 'p2', 2, 0.15),
    'pour': ('line', 'p3', 1, 0.0),
    'result': ('line', 'p4', 2, 0.9),
    'click': ('line', 'c1', 2, 0.05),
    'leds': ('line', 'c1', 3, 0.35),
    'split': ('line', 'c4', 0, 0.9),
    'neq': ('line', 'c5', 1, 0.1),
    'pass': ('line', 'g1', 2, 0.65),
    'deny': ('line', 'g1', 3, 0.65),
    'retry': ('line', 'g1', 4, 0.55),
    'matrix': ('line', 'g2', 0, 0.2),
    'weak': ('line', 'g2', 1, 0.0),
    'paper': ('line', 'g4', 0, -0.35),
    'slab1': ('line', 'x1', 1, 0.45),
    'slab2': ('line', 'x1', 2, 0.25),
    'slab3': ('line', 'x1', 2, 0.85),
    'slab4': ('line', 'x1', 2, 1.45),
    'slab5': ('line', 'x1', 2, 2.0),
    'thud': ('line', 's2', 1, 0.35),
    'keys': ('line', 's2', 2, 0.1),
    'ctrl': ('line', 's4', 0, 0.3),
    'flip': ('line', 'm5', 0, 0.3),
    'endc': ('line', 'e3', 0, 0.0),
}
cues = {k: round(anchor(*v), 3) for k, v in CUES.items()}

# 结尾：九张小卡片摊开后落到地上。落地时间由同一套参数算出，画面与声音一致
G = 2600.0
rr = random.Random(7)
E_KINDS = [('plug', 250, 92), ('code', 300, 120), ('apps', 300, 70), ('ext', 340, 70), ('term', 260, 120),
           ('box', 240, 150), ('ctrl', 330, 76), ('matrix', 230, 150), ('note', 250, 170)]
e3 = lines['e3']['start']
ecards = []
order = list(range(9)); rr.shuffle(order)
for i, (k, w, h) in enumerate(E_KINDS):
    gx, gy = 560 + (i % 3) * 400, 300 + (i // 3) * 210
    sx, sy = gx + rr.uniform(-220, 220) * (1.2 if i % 3 != 1 else 0.6), gy + rr.uniform(-60, 70)
    sr = rr.uniform(-14, 14)
    t0 = e3 - 0.55 + order.index(i) * 0.13
    xf = sx + rr.uniform(-90, 90)
    yf = 1010 - h * 0.42 + rr.uniform(-14, 10)
    rf = rr.choice([-1, 1]) * rr.uniform(4, 24)
    T1 = math.sqrt(2 * (yf - sy) / G)
    v2 = 0.26 * G * T1
    T2 = 2 * v2 / G
    ecards.append({'k': k, 'w': w, 'h': h, 'gx': gx, 'gy': gy, 'sx': round(sx, 1), 'sy': round(sy, 1), 'sr': round(sr, 1),
                   't0': round(t0, 3), 'xf': round(xf, 1), 'yf': round(yf, 1), 'rf': round(rf, 1),
                   'land': round(t0 + T1, 3), 'land2': round(t0 + T1 + T2, 3)})
data = {'dur': round(t, 3), 'acts': acts, 'lines': lines, 'subs': subs, 'cues': cues, 'ecards': ecards, 'G': G}
html = (ROOT / 'src/index.template.html').read_text().replace('__DUR__', str(data['dur']))
html = html.replace('__TIMELINE__', 'window.TL = ' + json.dumps(data, ensure_ascii=False) + ';')
html = html.replace('__FILM__', (ROOT / 'src/film.js').read_text())
# 新克隆尚无混音时，仍可独立检查与预览画面。
if not (project.film / 'assets/mix.wav').exists():
    html = re.sub(r'      <audio\b[^>]*></audio>\n', '', html)
project.film.mkdir(parents=True, exist_ok=True)
temporary = project.film / 'index.tmp'
temporary.write_text(html)
timeline_temporary = project.timeline.with_suffix('.tmp')
timeline_temporary.write_text(json.dumps(data, ensure_ascii=False, indent=1))
timeline_temporary.replace(project.timeline)
temporary.replace(project.film / 'index.html')
print(project.variant, 'duration', data['dur'], 's', f"({int(data['dur']//60)}:{data['dur']%60:04.1f})")
for k, v in acts.items(): print(k, v['start'], '→', v['end'])
