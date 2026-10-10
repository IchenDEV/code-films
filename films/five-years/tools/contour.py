"""音频响度轮廓：每秒 RMS（dBFS）+ 段落均值，检查配乐的起伏是否落在计划的位置。python3 tools/contour.py file.mp3 [variant]"""
import json, subprocess, sys
import numpy as np
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(float) / 32768
sec = [20 * np.log10(np.sqrt(np.mean(x[i:i + 16000] ** 2)) + 1e-9) for i in range(0, len(x) - 8000, 16000)]
bar = lambda d: '█' * max(0, int((d + 50) / 2))
if len(sys.argv) > 2:
    meta = json.load(open(f'out/music/{sys.argv[2]}.json'))
    t = 0
    for c in meta['plan']:
        a, b = int(t), int(t + c['duration_ms'] / 1000)
        seg = sec[a:b]
        print(f"{c['text']:18s} {a:4d}-{b:<4d} mean {np.mean(seg):6.1f} dB  min {min(seg):6.1f}  max {max(seg):6.1f}  last2 {np.mean(seg[-2:]):6.1f}")
        t += c['duration_ms'] / 1000
else:
    for i, d in enumerate(sec): print(f'{i:4d} {d:6.1f} {bar(d)}')
