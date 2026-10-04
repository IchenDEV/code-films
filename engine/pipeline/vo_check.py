"""旁白逐句检查：语速、音高、起伏；标出离群句。在片子目录里运行：python3 ../../engine/pipeline/vo_check.py zh"""
import json, re, subprocess, sys
import numpy as np
from scipy.io import wavfile
lang = sys.argv[1] if len(sys.argv) > 1 else 'zh'

def units(text):
    """语速的计数单位：中日文按字（夹杂的拉丁词每个最多算 4 个音节），其它语言按词（四位年份约 6 个音节）。"""
    if re.match(r'^(zh|ja)', lang):
        t = re.sub(r'[，。、：；！？“”《》—\s]', '', text)
        t = re.sub(r'[A-Za-z]+', lambda m: '*' * min(4, len(m.group())), t)
        return len(t)
    n = 0
    for w in text.replace('—', ' ').split():
        w = re.sub(r'\W', '', w)
        n += (6 if len(w) == 4 else len(w) + 2) if w.isdigit() else 1
    return n

def f0(x, sr):
    x = x[::3]; sr //= 3; out = []
    for i in range(0, len(x) - 1024, 320):
        w = x[i:i + 1024]
        if np.sqrt((w ** 2).mean()) < 0.02: continue
        w = w - w.mean(); ac = np.correlate(w, w, 'full')[1023:]
        lo, hi = int(sr / 300), int(sr / 55); k = lo + np.argmax(ac[lo:hi])
        if ac[k] > 0.45 * ac[0]: out.append(sr / k)
    return np.array(out) if out else np.array([100.])
def main():
    m = json.load(open(f'out/vo/{lang}/manifest.json'))
    rows = []
    for k, v in m.items():
        sr, x = wavfile.read(f'out/vo/{lang}/{k}.wav'); x = x.astype(float) / 32767
        # 只计有声时长（去掉句内长停顿的影响，另算停顿占比）
        env = np.sqrt(np.convolve(x ** 2, np.ones(960) / 960, 'same'))
        voiced = (env > 0.015).mean()
        p = f0(x, sr)
        rate = units(v['text']) / v['duration']
        rows.append((k, rate, np.median(p), np.std(12 * np.log2(p / np.median(p))), voiced, v['duration'], v['text']))
    R = np.median([r[1] for r in rows]); P = np.median([r[2] for r in rows]); G = np.median([r[3] for r in rows])
    unit = '字/秒' if lang == 'zh' else '音节/秒'
    print(f'[{lang}] 中位语速 {R:.2f} {unit} · 中位音高 {P:.0f}Hz · 中位起伏 {G:.1f}st')
    flag = []
    for k, rate, f, g, vo, d, t in rows:
        why = []
        if rate > R * 1.15: why.append('快')
        if rate < R * 0.8: why.append('慢')
        if abs(12 * np.log2(f / P)) > 2.0: why.append('音高偏')
        if g > G * 2.2 and g > 3: why.append('起伏过大')
        if why: flag.append(k)
        print(f"{k:4s} {rate:5.2f} {f:5.0f}Hz {g:4.1f}st {d:5.2f}s {'⚠ ' + '/'.join(why) if why else ''}  {t[:40]}")
    print('离群：', ' '.join(flag) or '无')
    json.dump(flag, open(f'out/vo/{lang}/flagged.json', 'w'))

if __name__ == '__main__':
    main()
