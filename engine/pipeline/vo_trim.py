"""从原始 mp3 精确修剪首尾静音（保留少量余量），更新 manifest 时长"""
import json, subprocess, sys
import numpy as np
from scipy.io import wavfile
SR = 48000
for lang in sys.argv[1:]:
    mp = f'out/vo/{lang}/manifest.json'
    m = json.load(open(mp))
    for lid, v in m.items():
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'out/vo/{lang}/{lid}.mp3', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).astype(float) / 32768
        env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
        on = np.where(env > 10 ** (-42 / 20))[0]
        a = max(0, on[0] - int(0.04 * SR)); b = min(len(x), on[-1] + int(0.18 * SR))
        y = x[a:b]
        y[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR)); y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
        wavfile.write(f'out/vo/{lang}/{lid}.wav', SR, (y * 32767).astype(np.int16))
        old = v['duration']; v['duration'] = round(len(y) / SR, 3)
        if abs(old - v['duration']) > 0.3: print(lang, lid, old, '→', v['duration'])
    json.dump(m, open(mp, 'w'), ensure_ascii=False, indent=1)
    print(lang, 'total', round(sum(v['duration'] for v in m.values()), 1), 's')
