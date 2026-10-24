"""配乐连贯性检查：每 0.5 秒的响度，标出静音（< -40 dB）和突变（相邻两格差 > 8 dB）。
用法：python3 tools/contour.py <short-zh|long-zh>"""
import json, subprocess, sys
import numpy as np
key = sys.argv[1] if len(sys.argv) > 1 else 'short-zh'
f = sys.argv[2] if len(sys.argv) > 2 else json.load(open(f'out/music/{key}-score.json'))['file']
TL = json.load(open('timeline/' + {'short-zh': 'douyin', 'long-zh': 'bilibili'}[key] + '.json'))
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
step = 4000
db = [20 * np.log10(np.sqrt(np.mean(x[i:i + step] ** 2)) + 1e-9) for i in range(0, len(x) - step, step)]
bounds = {round(a['a'] * 2): a['name'] for a in TL['acts']}
issues = []
for i, d in enumerate(db):
    t = i / 2
    tag = bounds.get(i, '')
    flag = ''
    if d < -40: flag = '静音'
    elif i and abs(d - db[i - 1]) > 8: flag = f'突变 {d - db[i - 1]:+.0f}'
    if flag: issues.append((t, flag, tag))
for t, flag, tag in issues: print(f'{t:6.1f}s {flag} {tag}')
print(f'{key}: {len(issues)} 处')
