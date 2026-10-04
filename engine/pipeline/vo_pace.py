"""语速控制：比纪录片节奏快的句子，用保持音高的变速（atempo）放慢到上限；不加快任何句子。
在片子目录里运行，tts.py 会自动调用。上限来自 film.json：paceCap（字/秒或词/秒）或 paceCapRelative（相对中位语速）。"""
import json, subprocess, sys
import numpy as np
sys.argv.append('_'); lang = sys.argv[1]
from vo_check import units  # 同一套音节计数
m = json.load(open(f'out/vo/{lang}/manifest.json'))
rates = {k: units(v['text']) / v['duration'] for k, v in m.items()}
cfg = json.load(open('film.json'))['narration'][lang]
cap = cfg['paceCap'] if 'paceCap' in cfg else cfg.get('paceCapRelative', 1.12) * float(np.median(list(rates.values())))
for k, v in m.items():
    r = rates[k]
    if r <= cap: continue
    tempo = max(0.86, cap / r)
    src = f'out/vo/{lang}/{k}.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', f'atempo={tempo:.3f}', '-ar', '48000', '/tmp/paced.wav'], check=True)
    subprocess.run(['mv', '/tmp/paced.wav', src], check=True)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
    print(f'{lang} {k}: {r:.2f} → {units(v["text"]) / d:.2f} ({tempo:.2f}×)  {v["text"][:30]}')
    v['duration'] = round(d, 3)
json.dump(m, open(f'out/vo/{lang}/manifest.json', 'w'), ensure_ascii=False, indent=1)
