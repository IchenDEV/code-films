"""按实测旁白时长排时间轴；用强制对齐的逐字时间切字幕。输出 film/index.html 与 timeline.json"""
import json, re, os

s = json.load(open('script.json'))
man = json.load(open('timing/manifest.json'))
MAXC = 22
STRIP_END = '，。；、'


def chars(lid, text):
    al = json.load(open(f'timing/align/{lid}.json'))['characters']
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
        for k, (i0, txt) in enumerate(sc):
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
# 提示音：只用于关键反馈与人的决定。画面与混音共用这些时间
def anchor(kind, ref, k, off):
    if kind == 'act': return acts[ref]['start'] + off
    if k == 'end': return lines[ref]['end'] + off
    return lines[ref]['cl'][k] + off
CUES = {'endc': ('act', 'end', 0, 0.3)}
cues = {k: round(anchor(*v), 3) for k, v in CUES.items()}
data = {'dur': round(t, 3), 'acts': acts, 'lines': lines, 'subs': subs, 'cues': cues}
json.dump(data, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
# 把总时长写进 index.html
p = 'film/index.html'
html = open('src/index.template.html').read().replace('__DUR__', str(data['dur']))
html = html.replace('__TIMELINE__', 'window.TL = ' + json.dumps(data, ensure_ascii=False) + ';')
html = html.replace('__FILM__', open('src/film.js').read())
open(p, 'w').write(html)
print('duration', data['dur'], 's', f"({int(data['dur']//60)}:{data['dur']%60:04.1f})")
for k, v in acts.items(): print(k, v['start'], '→', v['end'])
for sb in subs: print(f"{sb['t0']:7.2f}-{sb['t1']:7.2f}  {sb['text']}")
