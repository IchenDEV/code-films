"""音效：可直接使用 engine/pipeline/dsp.py 的全部名字（fx/dry 总线、at/end/span、pink/bp/click/boom/whoosh……）。"""
a, b = span('stars')
n = idx(b) - idx(a)
add(fx, a, bp(pink(n), 200, 1200) * np.interp(np.arange(n) / SR, [0, 2, (b - a) - 1, b - a], [0, 0.06, 0.06, 0]), -0.2)  # 风
