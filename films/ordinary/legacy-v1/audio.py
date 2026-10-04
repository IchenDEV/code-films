"""全片声音：按 timeline.json 合成，与画面共享同一份时间轴。输出 out/audio.wav"""
import json
import numpy as np
from scipy import signal
from scipy.io import wavfile

TL = json.load(open('timeline.json'))
SR = 48000
DUR = TL['DURATION']
N = int(SR * DUR)
T = np.arange(N) / SR
rng = np.random.default_rng(7)

music = np.zeros((N, 2))   # 进混响
fx = np.zeros((N, 2))      # 少量混响
dry = np.zeros((N, 2))     # 干声


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


NOTE = lambda name: 440 * 2 ** ((name - 69) / 12)  # MIDI → Hz
D1, D2, A2, D3, F3, A3, C4, D4, E4, F4, G4, A4, C5, D5, E5, F5, A5 = [NOTE(m) for m in (26, 38, 45, 50, 53, 57, 60, 62, 64, 65, 67, 69, 72, 74, 76, 77, 81)]
Bb2, Bb3, G2, G3 = NOTE(46), NOTE(58), NOTE(43), NOTE(55)

# —— 第一幕：风、雷、火 ——
w = pink(N)
wind = bp(w, 140, 900) * 0.6 + bp(w, 900, 2400) * 0.15
gust = 0.4 + 0.6 * slow(N, 0.35, 1) ** 2
fx += pan(wind * gust * env([(0, 0), (2.5, 0.22), (20, 0.18), (30, 0.12), (36, 0.05), (42, 0.03), (44, 0)]), -0.2)
fx += pan(bp(pink(N), 200, 1200) * slow(N, 0.3, 2) * env([(0, 0), (3, 0.12), (30, 0.08), (40, 0)]), 0.4)

for L in TL['lightning']:
    t0 = L['t'] + L['delay']
    p = (L['x'] - 0.5) * 1.4
    n = int(6 * SR)
    tt = np.arange(n) / SR
    rumble = lp(brown(n), 160 + 120 * L['power']) * 3
    shape = np.minimum(1, tt / 0.08) * np.exp(-tt / (1.4 + L['power']))
    shape *= 0.6 + 0.4 * np.interp(tt, np.arange(0, 6.01, 0.15), rng.random(41))
    add(fx, t0, rumble * shape, p, 0.9 * L['power'])
    if L['power'] > 0.8:
        c = hp(noise(int(0.35 * SR)), 900) * np.exp(-np.arange(int(0.35 * SR)) / SR / 0.06)
        add(fx, t0 - 0.03, c, p, 0.25)
    # 远处的低频滚动
    add(fx, t0 + 0.4, lp(brown(n), 70) * np.exp(-tt / 2.5) * np.minimum(1, tt / 0.5) * 4, -p, 0.6 * L['power'])

# 燧石
for st in (8.55, 8.95, 9.15):
    n = int(0.08 * SR)
    add(fx, st, bp(noise(n), 2500, 9000) * np.exp(-np.arange(n) / SR / 0.012), 0.0, 0.5)


def fire_layer(t0, t1, shape, p=0.0, seed=0):
    r = np.random.default_rng(seed)
    n = idx(t1) - idx(t0)
    roar = lp(pink(n), 380) * 0.5 + bp(pink(n), 400, 1400) * 0.08
    crack = np.zeros(n)
    k = int((t1 - t0) * 14)
    for i in r.integers(0, n - 4000, k):
        m = int(r.integers(80, 900))
        crack[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m / 4)) * (0.3 + r.random() * 1.4)
    crack = bp(crack, 1200, 7000)
    tt = np.arange(n) / SR + t0
    e = np.interp(tt, *zip(*shape))
    grid = np.arange(t0, t1 + 1, 0.2)
    flick = 0.7 + 0.3 * np.interp(tt, grid, r.random(len(grid)))
    add(fx, t0, (roar * flick + crack * 0.5) * e, p)


fire_layer(9.0, 35.0, [(9.0, 0), (9.3, 0.06), (12.5, 0.2), (22.5, 0.2), (24, 0.32), (29.5, 0.3), (34.5, 0.0), (35, 0)], 0.05, 1)
fire_layer(34.0, 43.5, [(34.0, 0), (35.5, 0.09), (41, 0.08), (43.5, 0)], -0.5, 2)
fire_layer(45.4, 54.0, [(45.4, 0), (46.5, 0.05), (52, 0.06), (54, 0)], 0.0, 3)
fire_layer(203.0, 208.5, [(203, 0), (204.5, 0.07), (206, 0.06), (208, 0), (208.5, 0)], 0.3, 4)

# 音乐：第一幕
pad([D2, A2], 11, 36, [(11, 0), (18, 0.10), (26, 0.16), (34, 0.2), (36, 0.18)], seed=1)
pad([D5, A5, E5], 27, 37, [(27, 0), (31, 0.05), (34.5, 0.07), (37, 0)], bright=0.0, seed=2)

# —— 第二幕：祭坛与天层 ——
pad([D2, A2, D3, F3], 34, 67, [(34, 0.0), (36, 0.16), (42, 0.14), (48, 0.2), (52, 0.26), (56, 0.34), (66, 0.32), (67, 0.3)], bright=0.6, seed=3)
pad([A3, D4, F4, A4], 50, 67, [(50, 0), (53, 0.08), (58, 0.13), (67, 0.12)], bright=0.4, seed=4)
add(music, 52.0, bell(D3, 7, 0.6), 0, 0.22)
add(music, 52.05, bell(A3, 6, 0.5), 0.3, 0.12)
for i in range(6):  # 神庙线条逐层落成
    add(music, 42.0 + i * 0.55, pluck(NOTE(50 + [0, 3, 7, 10, 12, 15][i]), 3), (i - 2.5) * 0.25, 0.07)

# —— 第三幕：天空不再围绕我们 ——
pad([D2, A2, D3, F3], 67, 81, [(67, 0.3), (75, 0.24), (80, 0.22), (81, 0)], bright=0.6, seed=5)
pad([A3, D4, F4, A4], 67, 81, [(67, 0.12), (78, 0.08), (81, 0)], bright=0.4, seed=6)
for n_ in range(6):
    add(music, 69.0 + n_ * 1.45, bell([A5, E5, D5, F5, A5, E5][n_], 3, 1.2), (n_ - 2.5) * 0.3, 0.05)
# 地心 → 日心：小调转为大调
pad([Bb2, F3, D3, Bb3], 79, 101, [(79, 0), (84, 0.26), (88, 0.3), (94, 0.34), (98, 0.12), (100.4, 0.0), (101, 0)], bright=0.5, seed=7)
pad([D4, F4, A4, C5], 85, 101, [(85, 0), (90, 0.06), (95, 0.1), (99, 0.04), (101, 0)], bright=0.1, seed=8)
# 缩出：空间的呼吸，最后只剩一个细高的音
n = idx(101) - idx(86)
tt = np.arange(n) / SR
sw = bp(pink(n), 60, 600) * np.interp(tt, [0, 6, 11, 13.5, 15], [0, 0.18, 0.25, 0.05, 0])
add(fx, 86, sw, 0.0)
pad([A5], 96, 101, [(96, 0), (98.5, 0.05), (100.3, 0.05), (100.7, 0)], bright=0, seed=9)
# 回落：吸入式的上扬
n = idx(104.6) - idx(100.6)
tt = np.arange(n) / SR
x = pink(n)
ctr = np.geomspace(150, 5000, n)
riser = np.zeros(n)
for k in range(0, n, 4800):
    seg = x[k:k + 4800 + 2000]
    riser[k:k + 4800] = bp(seg, ctr[k] * 0.7, min(ctr[k] * 1.4, 20000))[:len(riser[k:k + 4800])]
add(fx, 100.6, riser * (tt / tt[-1]) ** 2 * 0.5, 0.0)

# —— 第四幕：水下与生命之树 ——
n = idx(127) - idx(104)
tt = np.arange(n) / SR
und = lp(brown(n) * 6, 220) * np.interp(tt, [0, 1.2, 18, 23], [0, 0.35, 0.3, 0])
add(fx, 104.0, und, 0.0)
for i in range(40):  # 气泡
    t0 = 104.5 + rng.random() * 18
    m = int(0.06 * SR)
    f = 400 + rng.random() * 900
    ch = np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.8, m)) / SR) * np.exp(-np.arange(m) / m * 4)
    add(fx, t0, ch, rng.random() * 1.6 - 0.8, 0.03)
pad([G2, D3, Bb3], 104, 139, [(104, 0), (106, 0.16), (120, 0.2), (126, 0.2), (134, 0.16), (139, 0)], bright=0.2, seed=10)
for i, f in enumerate([D4, F4, A4, C5, D5]):
    add(music, 107.0 + i * 2.8, bell(f, 5, 0.6), (i - 2) * 0.3, 0.09)
# 树：时间沿枝干上升，稀疏的拨弦
arp = [G3, D4, Bb3, F4, A4, D5, G4, Bb3, C5, F4]
for i in range(30):
    add(music, 123.0 + i * 0.45, pluck(arp[i % len(arp)] * (2 if i > 18 else 1), 2.5), np.sin(i) * 0.6, 0.035 * (1 - i / 40))

# —— 第五幕：身体 ——
pad([D1 * 2, A2 / 2], 137, 169, [(137, 0), (140, 0.14), (160, 0.14), (168, 0.08), (169, 0)], bright=0.0, seed=11)
for hb in TL['heartbeats']:
    for off, a in ((0, 1.0), (0.28, 0.65)):
        m = int(0.32 * SR)
        tt = np.arange(m) / SR
        f = 58 * np.exp(-tt * 3) + 36
        th = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.09) * np.minimum(1, tt / 0.004)
        k = 1 - np.clip((hb - 148) / 18, 0, 0.6)   # 进入显微镜后心跳退远
        add(fx, hb + off, lp(th, 180) * a * k, 0.0, 0.7)
n = idx(168.6) - idx(146)
add(fx, 146, hp(noise(n), 3000) * np.interp(np.arange(n) / SR, [0, 2, 20, 22.6], [0, 0.012, 0.016, 0]), 0.0)
for sp in TL['spikes']:
    m = int(0.012 * SR)
    c = bp(noise(m), 800, 5000) * np.exp(-np.arange(m) / SR / 0.002)
    add(fx, sp, c, 0.15, 0.55)

# —— 第六幕：机器 ——
n = idx(199.6) - idx(167)
tt = np.arange(n) / SR + 167
hum = sum(np.sin(2 * np.pi * 50 * h * tt) / h for h in (1, 2, 3, 5)) * np.interp(tt, [167, 170, 186, 199.6], [0, 0.05, 0.04, 0.08])
add(fx, 167, hum, 0.0)
# 脉冲节奏：速度从 96 BPM 逐渐升至 176 BPM
beats, tb = [], 172.0
while tb < 199.5:
    beats.append(tb)
    bpm = 96 + (tb - 172) / 27.6 * 80
    tb += 60 / bpm / 2
for i, bt in enumerate(beats):
    m = int(0.25 * SR)
    tt = np.arange(m) / SR
    if i % 2 == 0:
        f = 90 * np.exp(-tt * 20) + 45
        k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12)
        add(fx, bt, k, 0.0, 0.32 + 0.2 * (bt - 172) / 28)
    else:
        tick = hp(noise(int(0.03 * SR)), 5000) * np.exp(-np.arange(int(0.03 * SR)) / SR / 0.006)
        add(fx, bt, tick, 0.35 * (1 if i % 4 == 1 else -1), 0.12 + 0.1 * (bt - 172) / 28)
for mo in TL['montage']:
    f = 180 + rng.random() * 300
    m = int(0.9 * SR)
    tt = np.arange(m) / SR
    metal = sum(np.sin(2 * np.pi * f * r_ * tt) * np.exp(-tt / (0.25 / r_ ** 0.5)) for r_ in (1, 1.52, 2.33, 3.17, 4.41)) / 3
    add(fx, mo['t'], metal * np.minimum(1, tt / 0.002), rng.random() * 1.2 - 0.6, 0.12)
    if mo['t'] < 186.2 or mo['t'] > 195.5:
        m = int(0.6 * SR)
        cr = np.zeros(m)
        for j in rng.integers(0, m - 500, 40):
            cr[j:j + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 60)
        add(fx, mo['t'], hp(cr, 2500) * np.exp(-np.arange(m) / m * 3), rng.random() - 0.5, 0.08)
pad([D2, A2, D3], 172, 199.6, [(172, 0), (176, 0.12), (186, 0.16), (199.6, 0.3)], bright=0.8, seed=12)
pad([F3, A3, C4, E4], 186, 199.6, [(186, 0), (190, 0.08), (199.6, 0.2)], bright=0.6, seed=13)
# 上扬：音高与噪声一起爬升，直到硬切
n = idx(199.6) - idx(191)
tt = np.arange(n) / SR
f = np.geomspace(110, 880, n)
rise = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
add(music, 191, rise * (tt / tt[-1]) ** 2.5 * 0.12, 0.0)
add(fx, 191, hp(pink(n), 1500) * (tt / tt[-1]) ** 3 * 0.25, 0.0)

# —— 第七幕：屏幕 ——
n = idx(228) - idx(203)
add(dry, 203, lp(pink(n), 500) * np.interp(np.arange(n) / SR, [0, 2, 23, 25], [0, 0.012, 0.012, 0]), 0.0)
for c in TL['typing'][0]['chars']:   # 键盘
    m = int(0.05 * SR)
    tt = np.arange(m) / SR
    k = bp(noise(m), 1500, 6000) * np.exp(-tt / 0.006) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.015) * 0.4
    add(dry, c['t'], k, 0.25, 0.16 * (0.8 + 0.4 * rng.random()))
for item in TL['typing'][1:]:        # 回答：几乎听不见的细响
    for c in item['chars']:
        m = int(0.03 * SR)
        add(dry, c['t'], np.sin(2 * np.pi * 2400 * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.004), -0.1, 0.02)
pad([D2], 214, 227.5, [(214, 0), (219, 0.06), (225, 0.07), (227.5, 0)], bright=0, seed=14)
# 结尾：冷的、持续的低音与五度
pad([D2, A2, D3], 227.5, 253.5, [(227.5, 0), (231, 0.2), (236, 0.24), (243, 0.26), (246, 0.2), (251, 0.06), (253.5, 0)], bright=0.2, seed=15)
pad([A4, E5], 236, 252, [(236, 0), (240, 0.05), (246, 0.05), (252, 0)], bright=0, seed=16)
add(music, 228.0, bell(D3, 8, 0.4), 0, 0.14)
add(music, 236.0, bell(A2, 8, 0.4), 0, 0.14)
m = int(6 * SR)
tt = np.arange(m) / SR
boom = np.sin(2 * np.pi * np.cumsum(46 * np.exp(-tt * 0.3)) / SR) * np.exp(-tt / 1.6) * np.minimum(1, tt / 0.02)
add(dry, 245.5, boom, 0, 0.5)
add(music, 245.5, bell(D4, 9, 0.5), 0, 0.12)

# —— 混响与总线 ——
def reverb_ir(sec, seed):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    tt = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-tt / (sec / 6.9))[:, None]
    ir[:, 0] = lp(ir[:, 0], 7000); ir[:, 1] = lp(ir[:, 1], 7000)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def apply_rev(x, ir, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = signal.oaconvolve(x[:, c], ir[:, c])[: len(x)]
    return x * (1 - wet) + out * wet * 2.2


print('reverb...')
ir = reverb_ir(4.5, 1)
mix = apply_rev(music, ir, 0.55) + apply_rev(fx, reverb_ir(2.2, 2), 0.22) + dry
# 硬切：全部声音（含混响尾）在此刻消失
i0, i1 = idx(TL['HARD_CUT']), idx(203.0)
mix[i0:i1] = 0
mix[i1:i1 + 2400] *= np.linspace(0, 1, 2400)[:, None]
# 软限幅与归一
mix = np.tanh(mix * 1.6) / 1.6
mix *= 0.89 / np.max(np.abs(mix))
mix[i0:i1] = 0
mix[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))[:, None]
wavfile.write('out/audio.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape, 'peak', np.max(np.abs(mix)), 'rms', np.sqrt(np.mean(mix ** 2)))
