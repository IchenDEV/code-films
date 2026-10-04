"""混音：片子的音效（sfx.py）+ 配乐（score.py 的 build_score）+ 旁白 → out/mix_<lang>.wav
- 每句旁白统一响度；说话时音乐与音效退后约 6 dB，旁白比音乐高 7 dB；
- sfx.py 若设置了 HARD = (起, 止)，这一段清成纯静音；
- 最后软限幅，交付前再用 loudnorm.py 标准化到 -16 LUFS。
在片子目录里运行：./run.sh <片名> audio [语言]"""
import json, os, sys
import numpy as np
from scipy.io import wavfile

import dsp
from dsp import SR, add, hp, lp, apply_rev, reverb_ir, idx

LANG = sys.argv[1] if len(sys.argv) > 1 else 'zh'
TL = json.load(open(f'timeline_{LANG}.json'))
dsp.init(TL)

# 片子的音效：在共享命名空间里执行
ns = dict(vars(dsp))
exec(compile(open('sfx.py', encoding='utf-8').read(), 'sfx.py', 'exec'), ns)
HARD = ns.get('HARD')
fx, dry, vo, N = dsp.fx, dsp.dry, dsp.vo, dsp.N

# 旁白
mf = f'out/vo/{LANG}/manifest.json'
have_vo = os.path.exists(mf)
if have_vo:
    for v in TL['vo']:
        path = f'out/vo/{LANG}/{v["id"]}.wav'
        if not os.path.exists(path):
            print('missing', path); continue
        sr, x = wavfile.read(path)
        x = x.astype(float) / 32767 if x.dtype == np.int16 else x.astype(float)
        if x.ndim > 1: x = x.mean(axis=1)
        x = hp(x, 70)
        voiced = np.abs(x) > 0.02  # 每句统一响度
        r = np.sqrt(np.mean(x[voiced] ** 2)) if voiced.any() else 1
        add(vo, v['t'], x * (0.16 / r), 0.0, 1.0)
else:
    print('no narration yet: music and effects only')

# 配乐
print('score...')
sys.path.insert(0, os.getcwd())
from score import build_score
score = build_score(TL)[:N]
music = dsp.music.copy()  # sfx.py 里用 pad()/bell() 写进 music 总线的声音也会保留
music[:len(score)] += score

print('reverb...')
fxr = apply_rev(fx, reverb_ir(2.2, 2), 0.22)
bed = music * 0.85 + fxr * 0.6
voice = apply_rev(vo, reverb_ir(1.2, 3), 0.07)
envv = lp(np.abs(vo[:, 0]), 6, order=1)
envv = np.clip(envv / (np.percentile(envv[envv > 1e-4], 90) + 1e-9) if have_vo else envv * 0, 0, 1)
duck = 1 - 0.5 * lp(envv, 2, order=1)  # 旁白时配乐退后约 6 dB
if have_vo:
    act = np.abs(lp(np.abs(vo[:, 0]), 6, order=1)) > 0.01
    rv = np.sqrt(np.mean(voice[act] ** 2)); rb = np.sqrt(np.mean((bed * duck[:, None] + dry)[act] ** 2))
    voice *= 10 ** ((7 - 20 * np.log10(rv / rb)) / 20)
    print(f'narration was {20 * np.log10(rv / rb):.1f} dB above music; set to 7 dB')
mix = bed * duck[:, None] + voice + dry
if HARD:
    i0, i1 = idx(HARD[0]), idx(HARD[1])
    mix[i0:i1] = 0
    mix[i1:i1 + 2400] *= np.linspace(0, 1, 2400)[:, None]
mix = np.tanh(mix * 1.5) / 1.5
mix *= 0.89 / np.max(np.abs(mix))
if HARD: mix[i0:i1] = 0
mix[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))[:, None]
os.makedirs('out', exist_ok=True)
wavfile.write(f'out/mix_{LANG}.wav', SR, (mix * 32767).astype(np.int16))
print('ok', LANG, f"{TL['DURATION']:.1f}s", 'rms', float(np.sqrt(np.mean(mix ** 2))))
