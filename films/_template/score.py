"""配乐：返回与时间轴等长的立体声数组。乐器与编曲工具见 engine/pipeline/orchestra.py。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'pipeline'))
from orchestra import *  # noqa: F401,F403


def build_score(TL):
    S = {s['kind']: s for s in TL['shots']}
    sc = Score(TL['DURATION'])
    a, b = S['stars']['a'], S['stars']['b']
    sc.chord(a + 0.5, 'Dm', b - a, 'str', 0.5, lo=3)                  # 一个持续的小调和弦
    sc.melody(a + 2, 60 / 60, [('A4', 2), ('D5', 2), ('C5', 4)], 'pno', 0.45)
    t = S['title']['a'] + 0.5
    sc.put('drm', t, taiko(0.9, big=True), 0)
    sc.chord(t, 'D5', S['title']['b'] - t + 1, 'cho', 0.5, lo=3, top=5)
    out = reverb(sc.mix(), 4.0, 0.35)[: int(TL['DURATION'] * SR)]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9
