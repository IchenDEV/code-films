"""白板版配乐 + 音效 + 旁白混音。全部程序合成。
配乐：112 BPM 的轻快律动（马林巴、贝斯、鼓），随段落加码；关键句前留白，“不够！”“活的！”“就这么办”落重音。
音效：画线/写字的马克笔声、弹出、叮、盖章等，时间来自画面导出的 out/sfx.json。"""
import json, re, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
T = json.load(open('timeline.json'))
EV = json.load(open('out/sfx.json'))
DUR = T['dur']; N = int(DUR * SR)
A = {k: v['start'] for k, v in T['acts'].items()}
AE = {k: v['end'] for k, v in T['acts'].items()}
Lx = T['lines']
L = lambda i: Lx[i]['start']
LE = lambda i: Lx[i]['end']
C = lambda i, k: Lx[i]['cl'][min(k, len(Lx[i]['cl']) - 1)]
rng = np.random.default_rng(7)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)


def add(buf, x, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[: N - i] * g
    buf[0, i:i + len(x)] += x * np.cos((pan + 1) * np.pi / 4)
    buf[1, i:i + len(x)] += x * np.sin((pan + 1) * np.pi / 4)


def tt(d): return np.arange(int(d * SR)) / SR


# ---------- instruments ----------
def kick(amp=0.5):
    t = tt(0.35); f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * amp


def clap(amp=0.22):
    t = tt(0.25); x = bp(rng.standard_normal(len(t)), 900, 3200)
    env = np.exp(-t * 22)
    for d in (0.0, 0.011, 0.023):
        k = int(d * SR); env[k:k + 60] += 0.6
    return x * env * amp


def hat(amp=0.06, open_=False):
    t = tt(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70)) * amp


def shaker(amp=0.035):
    t = tt(0.09)
    return bp(rng.standard_normal(len(t)), 5000, 11000) * np.sin(np.pi * t / t[-1]) ** 2 * amp


def bass(m, d, amp=0.16):
    t = tt(d); f = hz(m)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8))
    return lp(x, 700) * np.minimum(1, t / 0.008) * np.exp(-t * 3.2) * amp


def marimba(m, amp=0.09, d=0.7):
    t = tt(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30) + 0.15 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t * 60)
    return x * np.exp(-t * 7) * np.minimum(1, t / 0.002) * amp


def pad(notes, d, bright=1400, amp=0.05):
    t = tt(d); x = np.zeros(len(t))
    for m in notes:
        for det in (-0.08, 0, 0.07):
            f = hz(m) * 2 ** (det / 12); ph = rng.random() * 6
            for k in range(1, 6): x += np.sin(2 * np.pi * f * k * t + ph * k) / k ** 1.4
    a = min(1.2, d / 3); r = min(2.0, d / 2.5)
    env = np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
    return lp(x, bright) * env * amp / len(notes)


def riser(d, amp=0.08):
    t = tt(d); x = rng.standard_normal(len(t))
    out = np.zeros(len(t)); seg = int(0.05 * SR)
    for i in range(0, len(t), seg):
        fc = 400 + 7000 * (i / len(t)) ** 2
        out[i:i + seg] = bp(x[i:i + seg + 2000], fc, fc * 1.8)[: len(out[i:i + seg])]
    return out * (t / d) ** 2 * amp


def crash(amp=0.12):
    t = tt(2.2); return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 2.2) * amp


def chime(ms, amp=0.08, d=2.0):
    t = tt(d); x = np.zeros(len(t))
    for i, m in enumerate(ms):
        k = int(i * 0.07 * SR); f = hz(m); u = t[: len(t) - k]
        x[k:] += (np.sin(2 * np.pi * f * u) + 0.4 * np.sin(2 * np.pi * 2.76 * f * u) * np.exp(-u * 6)) * np.exp(-u * 3)
    return x * amp


def reverb(x, sec=2.4, damp=3000, seed=0):
    r = np.random.default_rng(seed); n = int(sec * SR); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = lp(r.standard_normal(n) * np.exp(-t * 6.9 / sec), damp); ir[:400] *= np.linspace(0, 1, 400); ir /= np.sqrt((ir ** 2).sum())
        out.append(fftconvolve(x[ch], ir)[: x.shape[1]])
    return np.array(out)


# ---------- arrangement ----------
BPM = 112; B = 60 / BPM; BAR = 4 * B
T0 = A['s1']
PROG = [(50, [62, 66, 69, 74]), (45, [61, 64, 69, 73]), (47, [62, 66, 71, 74]), (43, [62, 67, 71, 74])]  # D A Bm G
MINOR = [(47, [62, 66, 71, 74]), (43, [62, 67, 71, 74]), (50, [62, 66, 69, 74]), (45, [61, 64, 69, 73])]

drums = np.zeros((2, N)); mel = np.zeros((2, N)); pads = np.zeros((2, N))

# 能量曲线：(开始, 结束, 等级)；0 = 只有长音，1 = 轻，2 = 律动，3 = 加码，4 = 全开
h5_break = C('h5', 2)
SEC = [
    (T0, L('h4'), 2), (L('h4'), h5_break - 0.2, 3), (h5_break - 0.2, A['s2'] - 0.1, 0),
    (A['s2'] - 0.1, L('p3'), 2), (L('p3'), LE('p3'), 1), (LE('p3'), A['s3'], 3),
    (A['s3'], L('g5') - 0.1, 3), (L('g5') - 0.1, C('g6', 0) - 0.02, 0), (C('g6', 0) - 0.02, A['s4'], 4),
    (A['s4'], L('k7') - 0.05, 4), (L('k7') - 0.05, A['s5'], 4),
    (A['s5'], C('r4', 1) - 0.1, 1), (C('r4', 1) - 0.1, A['s6'], 3),
    (A['s6'], L('z2'), 1), (L('z2'), L('z3'), 2), (L('z3'), L('z5'), 4), (L('z5'), DUR, 0),
]
def level(t):
    for a, b, l in SEC:
        if a <= t < b: return l
    return 0

def prog_at(t):
    if A['s3'] <= t < C('g6', 0): return MINOR
    return PROG

nsteps = int((DUR - T0) / (B / 4))
for s in range(nsteps):
    t = T0 + s * B / 4
    lv = level(t)
    if lv == 0: continue
    beat, sub = divmod(s, 4)
    bar = beat // 4; bib = beat % 4
    pr = prog_at(t)[bar % 4]
    if sub == 0:
        if lv >= 4 or (lv >= 2 and bib in (0, 2)) or (lv == 1 and bib == 0): add(drums, kick(0.5 if lv >= 3 else 0.4), t)
        if lv >= 2 and bib in (1, 3): add(drums, clap(0.2 if lv >= 3 else 0.14), t, pan=0.1)
        # 贝斯：每拍（等级 3+ 时八分）
        if lv >= 2: add(mel, bass(pr[0] - 12 + (12 if bib == 3 and lv >= 4 else 0), B * 0.9, 0.15), t)
    if sub == 2 and lv >= 3: add(mel, bass(pr[0] - 12, B * 0.45, 0.11), t)
    # 踩镲/沙锤
    if lv >= 3: add(drums, hat(0.05 if sub % 2 else 0.065, open_=(sub == 2 and bib == 3 and lv >= 4)), t, pan=-0.3)
    elif lv == 2 and sub == 2: add(drums, hat(0.05), t, pan=-0.3)
    if lv >= 1: add(drums, shaker(0.03 if lv >= 2 else 0.02), t + (0.012 if sub % 2 else 0), pan=0.35)
    # 马林巴琶音：等级 1-2 八分，3-4 十六分
    if (lv >= 3) or (lv >= 1 and sub % 2 == 0):
        pat = [0, 2, 1, 3, 2, 1, 3, 0]
        m = pr[1][pat[(s // (1 if lv >= 3 else 2)) % 8]] + (12 if (lv >= 4 and s % 8 in (3, 7)) else 0)
        add(mel, marimba(m, 0.075 if lv >= 3 else 0.065), t, pan=0.4 * np.sin(s * 0.7))

# 和声垫底（每小节一个和弦）
t = T0 - 2 * BAR
i = 0
while t < DUR:
    if t + BAR > 0:
        pr = prog_at(max(t, 0))[i % 4]
        lv = level(max(t, 0) + 0.1)
        add(pads, pad(pr[1], BAR + 0.8, 1600 if lv >= 3 else 1000, 0.05 if lv else 0.04), t)
    t += BAR; i += 1
# 片头：长音 + 上扬
add(pads, pad([50, 57, 62, 66], A['s1'] + 1.0, 900, 0.06), 0)
add(drums, riser(A['s1'] - 0.3, 0.06), 0.3)
# 重音与上扬
for t in [A['s1'], C('g6', 0), L('k7'), C('r4', 1) - 0.1, L('z3')]:
    add(drums, kick(0.6), t); add(drums, crash(0.10), t, pan=0.2)
add(drums, riser(1.4, 0.07), C('g6', 0) - 1.4)
add(drums, riser(1.2, 0.06), L('k7') - 1.2)
# 结尾：大和弦慢慢收
add(pads, pad([38, 50, 57, 62, 66, 69, 74], DUR - L('z5') + 0.5, 1800, 0.09), L('z5') - 0.2)
for k, m in enumerate([74, 78, 81, 86, 90]): add(mel, marimba(m, 0.06, 1.6), L('z5') + 0.3 + k * 0.16, pan=0.3 * np.sin(k))

# 第六幕“过去”：律动发闷（低通）
music = drums + mel + pads
a, b = int(A['s6'] * SR), int(L('z2') * SR)
for ch in range(2): music[ch, a:b] = lp(music[ch, a:b], 900)
music = music + 0.35 * reverb(music, 1.8, 3500)
music = hp(music, 35)
fe = int((DUR - 4.0) * SR); music[:, fe:] *= np.linspace(1, 0, N - fe) ** 1.6

# ---------- 音效 ----------
fx = np.zeros((2, N))
def scribble(d, rate, amp):
    t = tt(max(0.08, d)); x = bp(rng.standard_normal(len(t)), 1800, 6500)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * rate * t + rng.random() * 6) ** 2 * (0.7 + 0.3 * rng.random(len(t)) ** 8)
    env = np.minimum(1, t / 0.02) * np.minimum(1, (t[-1] - t) / 0.04 + 0.001)
    return x * mod * env * amp
last_pop = -1
for e in EV:
    t, ty, d = e['t'], e['type'], e['d']
    if ty == 'draw': add(fx, scribble(min(d, 2.0), 7 + rng.random() * 6, 0.018), t, pan=rng.uniform(-0.3, 0.3))
    elif ty == 'write': add(fx, scribble(min(d, 1.8), 9 + rng.random() * 4, 0.013), t, pan=rng.uniform(-0.2, 0.2))
    elif ty == 'pop':
        if t - last_pop < 0.09: continue
        last_pop = t
        u = tt(0.07); f = 500 + 900 * u / u[-1]
        add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u * 50) * 0.05, t, pan=rng.uniform(-0.4, 0.4))
    elif ty == 'ding': add(fx, chime([88, 95], 0.05, 1.4), t, pan=rng.uniform(-0.3, 0.3))
    elif ty == 'catch':
        u = tt(0.25); add(fx, bp(rng.standard_normal(len(u)), 1500, 5000) * np.sin(np.pi * u / u[-1]) ** 2 * 0.03, t - 0.2)
        add(fx, marimba(86, 0.035, 0.4), t)
    elif ty in ('stamp', 'thud'):
        add(fx, kick(0.55), t); u = tt(0.2); add(fx, lp(rng.standard_normal(len(u)), 1200) * np.exp(-u * 25) * 0.25, t)
    elif ty == 'erase': u = tt(max(0.2, d)); add(fx, lp(rng.standard_normal(len(u)), 2500) * np.sin(np.pi * u / u[-1]) * 0.02, t)
    elif ty == 'slash': u = tt(0.35); add(fx, bp(rng.standard_normal(len(u)), 2000, 7000) * np.sin(np.pi * u / u[-1]) * 0.035, t)
    elif ty == 'whoosh': u = tt(max(0.6, d)); add(fx, bp(rng.standard_normal(len(u)), 300, 1800) * np.sin(np.pi * u / u[-1]) ** 2 * 0.018, t)
    elif ty == 'spark': add(fx, chime([86, 90, 93, 98], 0.05, 2.0), t)
fx = fx + 0.25 * reverb(fx, 1.0, 5000, seed=4)

# ---------- 旁白 ----------
vo = np.zeros(N)
for lid, l in Lx.items():
    sr, x = wavfile.read(f'out/vo/{lid}.wav'); x = x.astype(float) / 32768
    i = int(l['start'] * SR); vo[i:i + len(x)] += x[: N - i]
vo = hp(vo, 70)
vo2 = np.array([vo, vo]) + 0.06 * reverb(np.array([vo, vo]), 0.8, 4000, seed=9)

env = np.sqrt(np.convolve(vo ** 2, np.ones(2400) / 2400, 'same'))
gate = np.convolve((env > 0.01).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
duck = 1 - 0.45 * np.clip(gate * 1.3, 0, 1)
rms = lambda x: np.sqrt((x ** 2).mean()) + 1e-12
sp = gate > 0.5
g = rms(vo2[:, sp]) / rms((music * duck)[:, sp]) * 10 ** (-11 / 20)   # 说话时音乐比人声低约 11 dB
mix = vo2 + music * duck * g + fx * g * 1.4
print('music gain', round(20 * np.log10(g), 1), 'dB')
mix = mix / np.abs(mix).max() * 0.8
wavfile.write('out/mix_raw.wav', SR, (mix.T * 32767).astype(np.int16))
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'out/mix_raw.wav', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=14:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
af = (f"loudnorm=I=-15:TP=-1.5:LRA=14:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'out/mix_raw.wav', '-af', af, '-ar', '48000', 'film/assets/mix.wav'], check=True)
print('mix', m['input_i'], 'LUFS → -15 LUFS')
