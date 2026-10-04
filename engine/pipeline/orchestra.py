"""配乐的共用“乐团”：音高与和弦、各种合成乐器（弦乐、铜管、合唱、钢琴、竖琴、太鼓、定音鼓……）、
编曲工具 Score（分轨放置音符、和弦、旋律）与大厅混响。片子的 score.py 用它来编曲。"""
import json, sys
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)

# ───────────────────────── 音高 ─────────────────────────
NAMES = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def hz(n):
    """'D4' → 频率"""
    if isinstance(n, (int, float)): return n
    name, octv = n[:-1], int(n[-1])
    return 440 * 2 ** ((NAMES[name] + 12 * (octv + 1) - 69) / 12)

CHORDS = {
    'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'F': ['F', 'A', 'C'], 'C': ['C', 'E', 'G'], 'Gm': ['G', 'Bb', 'D'],
    'A': ['A', 'Db', 'E'], 'Asus': ['A', 'D', 'E'], 'Eb': ['Eb', 'G', 'Bb'], 'D5': ['D', 'A'], 'Dsus': ['D', 'G', 'A'], 'Am': ['A', 'C', 'E'],
}
def voicing(ch, lo=3, top=5):
    """一个和弦的开放排列：低音根音 + 中声部三和弦"""
    notes = CHORDS[ch]
    out = [notes[0] + str(lo - 1)]
    o = lo
    for k in range(2):
        for n in notes:
            out.append(n + str(o + k))
    return [n for n in out if int(n[-1]) <= top]

# 主题（四四拍，单位：拍）

def transpose(note, semis):
    f = hz(note) * 2 ** (semis / 12)
    return f

# ───────────────────────── 音色 ─────────────────────────
def adsr(n, a, d, s, r, sus_len=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.ones(n) * s
    a = min(a, n); e[:a] = np.linspace(0, 1, a) if a else e[:a]
    dd = min(d, max(0, n - a)); e[a:a + dd] = np.linspace(1, s, dd) if dd else e[a:a + dd]
    if r and n > r: e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return e

def saw(f, n, phase=0.0, vib=0.0, vib_rate=5.0):
    t = np.arange(n) / SR
    inst = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t + rng.random() * 6))
    ph = phase + np.cumsum(inst) / SR
    return 2 * (ph - np.floor(ph + 0.5))

def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, min(f, SR / 2 - 100), fs=SR, output='sos'), x)
def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)

def strings(f, dur, vel=1.0, bright=1800, attack=0.5, release=1.2, voices=5):
    n = int((dur + release) * SR)
    x = np.zeros(n)
    for v in range(voices):
        det = (v - (voices - 1) / 2) * 0.0035 + rng.normal(0, 0.0008)
        x += saw(f * (1 + det), n, rng.random(), vib=0.0025, vib_rate=4.5 + rng.random())
    x = lp(x / voices, bright * (0.7 + 0.3 * vel), 2)
    x = hp(x, 60)
    return x * adsr(n, attack, 0.3, 0.85, release) * vel

def brass(f, dur, vel=1.0, release=0.8):
    n = int((dur + release) * SR)
    x = sum(saw(f * (1 + d), n, rng.random(), vib=0.002) for d in (-0.003, 0, 0.003)) / 3
    # 滤波包络：吹开
    t = np.arange(n) / SR
    cut = 500 + (1800 * vel) * (1 - np.exp(-t / 0.25))
    out = np.zeros(n)
    for k in range(0, n, 2400):
        seg = x[max(0, k - 400):k + 2400]
        y = lp(seg, cut[k], 2)
        out[k:k + 2400] = y[-len(out[k:k + 2400]):]
    return out * adsr(n, 0.18, 0.4, 0.8, release) * vel

FORMANTS = [(800, 1.0), (1150, 0.5), (2900, 0.25)]
def choir(f, dur, vel=1.0, release=1.6, voices=4):
    n = int((dur + release) * SR)
    src = sum(saw(f * (1 + (v - 1.5) * 0.004), n, rng.random(), vib=0.004, vib_rate=5.2 + rng.random() * 0.6) for v in range(voices)) / voices
    x = sum(bp(src, fc * 0.85, fc * 1.15) * g for fc, g in FORMANTS)
    return x * adsr(n, 0.9, 0.5, 0.9, release) * vel * 2.2

def piano(f, dur=3.0, vel=0.8):
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    B = 0.0004
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 12000: break
        x += np.sin(2 * np.pi * fk * t) * (vel ** (0.5 + k * 0.15)) / k ** 1.1 * np.exp(-t * (0.6 + k * 0.45) * (f / 260) ** 0.3)
    x += lp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.08 * vel
    return x * np.minimum(1, t / 0.002) * vel

def harp(f, vel=0.7, dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.2 + k * 1.1)) / k ** 1.3 for k in range(1, 7))
    return x * np.minimum(1, t / 0.002) * vel

def taiko(vel=1.0, big=False):
    n = int((1.6 if big else 0.9) * SR)
    t = np.arange(n) / SR
    f = (95 if big else 120) * np.exp(-t * 7) + (42 if big else 55)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.45 if big else 0.25))
    skin = lp(rng.standard_normal(n), 900) * np.exp(-t / 0.03) * 0.6
    return (body + skin) * vel

def timpani(f, vel=1.0):
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t / d) for r, a, d in ((1, 1, 1.4), (1.5, 0.5, 0.9), (1.98, 0.35, 0.7), (2.44, 0.2, 0.5)))
    x += lp(rng.standard_normal(n), 600) * np.exp(-t / 0.02) * 0.4
    return x * vel

def cymbal_swell(dur):
    n = int(dur * SR)
    x = hp(rng.standard_normal(n), 4000) * 0.25
    return x * np.linspace(0, 1, n) ** 3

def crash(vel=1.0):
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.9) * 0.3 * vel

def braam(root='D1', dur=4.0, vel=1.0):
    """低音铜管群的重音"""
    n = int(dur * SR)
    f0 = hz(root)
    x = sum(saw(f0 * m * (1 + d), n, rng.random()) for m in (1, 2, 3) for d in (-0.004, 0.004)) / 6
    t = np.arange(n) / SR
    out = np.zeros(n)
    cut = 200 + 1400 * np.exp(-t / 0.8)
    for k in range(0, n, 2400):
        seg = x[max(0, k - 400):k + 2400]
        out[k:k + 2400] = lp(seg, cut[k], 2)[-len(out[k:k + 2400]):]
    return out * np.minimum(1, t / 0.05) * np.exp(-t / (dur * 0.45)) * vel

def sub(f, dur, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * adsr(n, 1.0, 0.1, 1.0, 1.5) * vel

def pulse_note(f, dur=0.14, vel=0.6):
    """弦乐短弓（跳弓）"""
    n = int((dur + 0.15) * SR)
    x = sum(saw(f * (1 + d), n, rng.random()) for d in (-0.003, 0.003)) / 2
    return lp(x, 2200, 2) * adsr(n, 0.008, 0.08, 0.5, 0.12) * vel

def arp_note(f, dur=0.1, vel=0.5):
    """合成器琶音（方波，带滤波）"""
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + saw(f * 1.005, n) * 0.4
    return lp(x, 3200, 2) * adsr(n, 0.004, 0.06, 0.4, 0.07) * vel


# ───────────────────────── 编曲 ─────────────────────────
class Score:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR * 6
        self.bus = {k: np.zeros((self.n, 2)) for k in ('str', 'brs', 'cho', 'pno', 'hrp', 'drm', 'fx')}

    def put(self, bus, t, x, pan=0.0, gain=1.0):
        i = int(t * SR)
        if i >= self.n or i < 0: return
        x = x[: self.n - i] * gain
        a = (pan + 1) * np.pi / 4
        self.bus[bus][i:i + len(x), 0] += x * np.cos(a)
        self.bus[bus][i:i + len(x), 1] += x * np.sin(a)

    def chord(self, t, ch, dur, inst='str', vel=0.6, lo=3, top=5, **kw):
        notes = voicing(ch, lo, top)
        fn = {'str': strings, 'cho': choir, 'brs': brass}[inst]
        for i, nt in enumerate(notes):
            p = (i / max(1, len(notes) - 1)) * 1.2 - 0.6
            self.put(inst, t, fn(hz(nt), dur, vel, **kw), p, 1 / np.sqrt(len(notes)))

    def melody(self, t, beat, notes, inst='str', vel=0.7, octave=0, pan=0.0, legato=1.05):
        for nt, b in notes:
            f = hz(nt) * 2 ** octave
            d = b * beat * legato
            x = {'str': lambda: strings(f, d, vel, bright=3200, attack=0.25, voices=4),
                 'brs': lambda: brass(f, d, vel), 'cho': lambda: choir(f, d, vel),
                 'pno': lambda: piano(f, max(1.5, d * 1.5), vel), 'hrp': lambda: harp(f, vel)}[inst]()
            self.put(inst, t, x, pan)
            t += b * beat
        return t

    def mix(self):
        g = {'str': 1.0, 'brs': 0.8, 'cho': 0.55, 'pno': 0.75, 'hrp': 0.6, 'drm': 0.9, 'fx': 0.7}
        out = sum(self.bus[k] * g[k] for k in self.bus)
        return out


def reverb(x, sec=4.0, wet=0.35, seed=5):
    r = np.random.default_rng(seed)
    n = int(sec * SR); tt = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-tt / (sec / 6.9))[:, None]
    for c in range(2): ir[:, c] = lp(ir[:, c], 6000)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    out = np.zeros_like(x)
    for c in range(2): out[:, c] = signal.oaconvolve(x[:, c], ir[:, c])[: len(x)]
    return x * (1 - wet) + out * wet * 2.0
