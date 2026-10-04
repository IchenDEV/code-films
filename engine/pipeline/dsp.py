"""声音的共用工具：总线、包络、滤波、噪声，以及一批可复用的合成音色与音效。
mix.py 先调用 init(TL)，再执行片子的 sfx.py；sfx.py 里可以直接使用这里的全部名字。"""
import numpy as np
from scipy import signal

SR = 48000
TL = None; S = {}; DUR = 0.0; N = 0; T = None
music = fx = dry = vo = None
rng = None


def init(tl, seed=7):
    """按时间轴建立总线；全局随机数种子固定，保证每次混音一致。"""
    global TL, S, DUR, N, T, music, fx, dry, vo, rng
    TL = tl; S = {s['kind']: s for s in tl['shots']}
    DUR = tl['DURATION']; N = int(SR * DUR); T = np.arange(N) / SR
    rng = np.random.default_rng(seed)
    music = np.zeros((N, 2)); fx = np.zeros((N, 2)); dry = np.zeros((N, 2)); vo = np.zeros((N, 2))


# —— 镜头时刻 ——
def at(kind, line=None, off=0.0):
    """镜头开始时刻，或镜头内某句旁白开始的时刻（绝对秒）"""
    s = S[kind]
    return s['a'] + (s[line] if line else 0) + off
def end(kind): return S[kind]['b']
def span(kind): return S[kind]['a'], S[kind]['b']


# —— 基础 ——
def idx(t):
    return int(np.clip(t * SR, 0, N))


def env(points):
    """分段线性包络 [(t, v), ...]"""
    ts, vs = zip(*points)
    return np.interp(T, ts, vs)


def pan(x, p):
    """p: -1 左 … 1 右，等功率"""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def add(bus, t0, x, p=0.0, gain=1.0):
    i = idx(t0)
    if i >= N:
        return
    x = x[: N - i]
    bus[i:i + len(x)] += pan(x * gain, p) if x.ndim == 1 else x * gain


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def noise(n):
    return rng.standard_normal(n)


def pink(n):
    w = noise(n)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 8


def brown(n):
    x = np.cumsum(noise(n))
    return hp(x, 15) / 300


def slow(n, rate, seed):
    """平滑的随机起伏 0..1"""
    r = np.random.default_rng(seed)
    k = int(DUR * rate) + 4
    pts = r.random(k)
    return np.interp(np.arange(n) / SR * rate, np.arange(k), pts)


def tone(f, dur, amp=1.0, detune=0.0, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    return amp * np.sin(2 * np.pi * f * (1 + detune) * t + phase)


def bell(f, dur=4.0, bright=1.0):
    """非谐分音的钟声"""
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for ratio, a, d in [(1, 1, 1.0), (2.76, 0.45 * bright, 0.5), (5.4, 0.25 * bright, 0.3), (8.93, 0.12 * bright, 0.18), (0.5, 0.3, 1.4)]:
        out += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (dur * d * 0.35))
    return out * np.minimum(1, t / 0.004)


def pluck(f, dur=2.0):
    t = np.arange(int(dur * SR)) / SR
    x = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2 + h * 1.5)) / h for h in (1, 2, 3, 4))
    return x * np.minimum(1, t / 0.003)


def pad(freqs, t0, t1, shape, voices=3, bright=0.3, seed=0):
    """柔和的和声铺底。shape: [(t, v)] 绝对时间"""
    n = idx(t1) - idx(t0)
    t = np.arange(n) / SR + t0
    e = np.interp(t, *zip(*shape))
    r = np.random.default_rng(seed)
    out = np.zeros((n, 2))
    for f in freqs:
        for v in range(voices):
            d = (v - (voices - 1) / 2) * 0.0025
            lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.05 + r.random() * 0.1) * t + r.random() * 6)
            s = np.sin(2 * np.pi * f * (1 + d) * t + r.random() * 6) + bright * 0.4 * np.sin(2 * np.pi * 2 * f * (1 + d) * t) + bright * 0.15 * np.sin(2 * np.pi * 3 * f * t)
            out += pan(s * lfo / (len(freqs) * voices), (v / max(1, voices - 1)) * 1.2 - 0.6)
    out *= e[:, None]
    i = idx(t0)
    music[i:i + n] += out


NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)  # MIDI → Hz


# —— 音效库 ——
def fire_layer(t0, t1, shape, p=0.0, seed=0):
    r = np.random.default_rng(seed)
    n = idx(t1) - idx(t0)
    roar = lp(pink(n), 380) * 0.5 + bp(pink(n), 400, 1400) * 0.08
    crack = np.zeros(n)
    for i in r.integers(0, max(1, n - 4000), int((t1 - t0) * 14)):
        m = int(r.integers(80, 900))
        crack[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m / 4)) * (0.3 + r.random() * 1.4)
    crack = bp(crack, 1200, 7000)
    tt = np.arange(n) / SR + t0
    e = np.interp(tt, *zip(*shape))
    grid = np.arange(t0, t1 + 1, 0.2)
    flick = 0.7 + 0.3 * np.interp(tt, grid, r.random(len(grid)))
    add(fx, t0, (roar * flick + crack * 0.5) * e, p)


def click(dur=0.02, lo=1500, hi=7000, decay=0.004):
    m = int(dur * SR)
    return bp(noise(m), lo, hi) * np.exp(-np.arange(m) / SR / decay)


def boom(f=46, dur=5.0, decay=1.5):
    tt = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(f * np.exp(-tt * 0.3)) / SR) * np.exp(-tt / decay) * np.minimum(1, tt / 0.02)


def metal(f, dur=0.9):
    tt = np.arange(int(dur * SR)) / SR
    return sum(np.sin(2 * np.pi * f * r_ * tt) * np.exp(-tt / (0.25 / r_ ** 0.5)) for r_ in (1, 1.52, 2.33, 3.17, 4.41)) / 3 * np.minimum(1, tt / 0.002)


def whoosh(t0, dur, lo=150, hi=5000, gain=0.4, p=0.0):
    n = int(dur * SR)
    x = pink(n + 4000)
    ctr = np.geomspace(lo, hi, n)
    out = np.zeros(n)
    for k in range(0, n, 4800):
        seg = bp(x[k:k + 6800], ctr[k] * 0.7, min(ctr[k] * 1.4, 20000))
        out[k:k + 4800] = seg[:len(out[k:k + 4800])]
    tt = np.arange(n) / n
    add(fx, t0, out * tt ** 2 * gain, p)


def landing(seed):
    """重物落在地上：短促的撞击、低沉的身体、碎屑般的余响，外加一次小回弹"""
    r = np.random.default_rng(seed)
    n = int(2.4 * SR); tt = np.arange(n) / SR
    hit = lp(r.standard_normal(n), 2500) * np.exp(-tt / 0.008) * 0.9
    body = np.sin(2 * np.pi * np.cumsum(95 * np.exp(-tt * 9) + 42) / SR) * np.exp(-tt / 0.38)
    rumble = lp(r.standard_normal(n), 350) * np.exp(-tt / 0.6) * 0.7
    grit = bp(r.standard_normal(n), 600, 3000) * np.exp(-tt / 0.06) * 0.25
    x = hit + body + rumble + grit
    o = int(0.14 * SR)  # 小回弹
    x[o:] += (body[:n - o] * 0.18 + hit[:n - o] * 0.25)
    return x * np.minimum(1, tt / 0.001)


def projector_click(seed):
    r = np.random.default_rng(seed)
    n = int(0.22 * SR); tt = np.arange(n) / SR
    out = np.zeros(n)
    # 咔：快门，带一点塑料/金属的共鸣
    k = int(0.03 * SR)
    burst = bp(r.standard_normal(k), 1800, 7000) * np.exp(-np.arange(k) / SR / 0.004)
    out[:k] += burst * 0.9
    for f, a, d in ((1150 * (1 + r.normal(0, 0.04)), 0.35, 0.018), (2350 * (1 + r.normal(0, 0.04)), 0.2, 0.012)):
        out += np.sin(2 * np.pi * f * tt) * a * np.exp(-tt / d)
    # 哒：片框落位，低而闷
    o = int((0.065 + r.normal(0, 0.006)) * SR)
    m = n - o; t2 = np.arange(m) / SR
    out[o:] += np.sin(2 * np.pi * 170 * t2) * 0.5 * np.exp(-t2 / 0.035)
    out[o:] += lp(r.standard_normal(m), 1500) * 0.35 * np.exp(-t2 / 0.012)
    return out * np.minimum(1, tt / 0.0005)


# —— 混响 ——
def reverb_ir(sec, seed):
    r = np.random.default_rng(seed)
    n = int(sec * SR); tt = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-tt / (sec / 6.9))[:, None]
    ir[:, 0] = lp(ir[:, 0], 7000); ir[:, 1] = lp(ir[:, 1], 7000)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=0))
def apply_rev(x, ir, wet):
    out = np.zeros_like(x)
    for c in range(2): out[:, c] = signal.oaconvolve(x[:, c], ir[:, c])[: len(x)]
    return x * (1 - wet) + out * wet * 2.2
