"""单独试听配乐：在片子目录里运行，生成 out/score_<lang>.wav"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
sys.path.insert(0, os.getcwd())
from score import build_score
from orchestra import SR
lang = sys.argv[1] if len(sys.argv) > 1 else 'zh'
x = build_score(json.load(open(f'timeline_{lang}.json')))
os.makedirs('out', exist_ok=True)
wavfile.write(f'out/score_{lang}.wav', SR, (np.tanh(x * 1.2) / 1.2 * 32767).astype(np.int16))
print('ok', round(x.shape[0] / SR, 1), 's')
