"""“本片的制作过程”镜头用的真实素材：本片代码、旁白波形、配乐频谱。"""
import json, glob, re, numpy as np
from scipy.io import wavfile
from scipy import signal
from PIL import Image
lines = []
for f in ['shots/place.js', 'shots/origin.js', 'shots/mind.js', 'score.py', 'sfx.py']:
    for l in open(f, encoding='utf-8'):
        l = l.rstrip('\n')
        if l.strip() and not re.search(r'[一-鿿]', l) and len(l) < 110: lines.append(l)
rng = np.random.default_rng(3)
start = rng.integers(0, max(1, len(lines) - 400))
code = lines[start:start + 400]
sr, x = wavfile.read('out/mix_zh.wav'); m = x.astype(float).mean(1) / 32767
wave = [float(np.abs(m[i:i + sr // 8]).max()) for i in range(0, len(m) - sr // 8, sr // 8)][:2400]
sr2, y = wavfile.read('out/score_zh.wav'); y = y.astype(float).mean(1)[::4] / 32767
f, t, S = signal.spectrogram(y, sr2 / 4, nperseg=1024, noverlap=512)
D = np.clip((10 * np.log10(S + 1e-12) + 105) / 65, 0, 1)[f < 5000][::-1]
img = (np.stack([D ** 0.8 * 255, D ** 1.6 * 200, D ** 3 * 120], -1)).astype(np.uint8)
Image.fromarray(img).resize((2400, 300)).save('img/selfspec.jpg', quality=88)
open('selfdata.js', 'w').write('window.SELF = ' + json.dumps({'code': code, 'wave': [round(v, 3) for v in wave]}) + ';\n')
print(len(code), 'code lines,', len(wave), 'wave points')
