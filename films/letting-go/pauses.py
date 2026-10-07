"""把句内过长的停顿收短（只动静音，不变速）：超过 MAX 秒的静音收到 KEEP 秒。
eleven_v3 的中文旁白爱在逗号处停得很久；在 tts 之后、cues.py 之前运行：python3 pauses.py zh"""
import json, subprocess, sys
import numpy as np
from scipy.io import wavfile
lang = sys.argv[1]
MAX, KEEP = 0.5, 0.36
mf = f'out/vo/{lang}/manifest.json'
m = json.load(open(mf))
for k, v in m.items():
    p = f'out/vo/{lang}/{k}.wav'
    sr, x = wavfile.read(p)
    f = x.astype(float) / 32767 if x.dtype == np.int16 else x.astype(float)
    mono = f if f.ndim == 1 else f.mean(axis=1)
    env = np.sqrt(np.convolve(mono ** 2, np.ones(int(0.02 * sr)) / int(0.02 * sr), 'same'))
    quiet = env < 0.006
    cuts, i, n = [], 0, len(quiet)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if (j - i) / sr > MAX and i > 0 and j < n:
                cuts.append((i + int(KEEP / 2 * sr), j - int(KEEP / 2 * sr)))
            i = j
        else: i += 1
    if not cuts: continue
    keep = np.ones(n, bool)
    for a, b in cuts: keep[a:b] = False
    y = x[keep]
    wavfile.write(p, sr, y)
    d0, d1 = v['duration'], round(len(y) / sr, 3)
    v['duration'] = d1
    print(f'{lang} {k}: {d0:.2f} → {d1:.2f}s ({len(cuts)} 处)')
json.dump(m, open(mf, 'w'), ensure_ascii=False, indent=1)
