"""各版本程序配乐、音效与旁白混音，输出独立音轨（-16 LUFS）。"""
import hashlib, json, re, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt
from project import arguments, mix_fingerprint, source_hash, write_json

SR = 48000
project, args = arguments(__doc__)
T = json.loads(project.timeline.read_text())
# 在合成配乐之前检查旁白，防止用新音频配旧时间轴。
manifest = json.loads((project.timing / 'manifest.json').read_text())
for lid, line in T['lines'].items():
    path = project.output / f'vo/{lid}.wav'
    alignment = json.loads((project.timing / f'align/{lid}.json').read_text())
    if alignment.get('_sourceHash') != source_hash(path, manifest[lid]['text']):
        raise ValueError(f'{lid}: 音频已改变，请先运行 align 和 timeline')
    sr, samples = wavfile.read(path)
    if sr != SR or samples.ndim != 1 or samples.dtype != np.int16:
        raise ValueError(f'{lid}: 旁白必须是 48 kHz 单声道 PCM16')
    if abs(len(samples) / SR - (line['end'] - line['start'])) > 0.002:
        raise ValueError(f'{lid}: 声音时长与时间轴不符，请先运行 timeline')
DUR = T['dur']
N = int(DUR * SR)
A = {k: v['start'] for k, v in T['acts'].items()}
AE = {k: v['end'] for k, v in T['acts'].items()}
CUE = T['cues']
rng = np.random.default_rng(3)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, sus, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def add(buf, x, t, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * l
    buf[1, i:i + len(x)] += x * r


# ---------- instruments ----------
def pad(notes, dur, bright=900, amp=0.05):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        f = hz(m)
        for det in (-0.07, 0.0, 0.06):
            ph = rng.random() * 2 * np.pi
            ff = f * 2 ** (det / 12)
            # 柔和的锯齿：有限谐波
            for k in range(1, 7):
                x += np.sin(2 * np.pi * ff * k * t + ph * k) / (k ** 1.35)
    x = lp(x, bright) * env_adsr(n, min(2.5, dur / 3), min(3.0, dur / 2.5))
    lfo = 1 + 0.12 * np.sin(2 * np.pi * 0.11 * t + rng.random() * 6)
    return x * lfo * amp / max(1, len(notes))


def pluck(m, dur=1.6, amp=0.05, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
         + 0.12 * bright * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 9))
    return x * np.exp(-t * 2.8) * env_adsr(n, 0.004, 0.05) * amp


def tick(amp=0.03, fc=5200, dur=0.05):
    n = int(dur * SR)
    x = hp(rng.standard_normal(n), fc) * np.exp(-np.arange(n) / SR * 90)
    return x * amp


def sub(m, dur, amp=0.07):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(m) * t) + 0.2 * np.sin(2 * np.pi * 2 * hz(m) * t)
    return x * env_adsr(n, 0.02, min(0.4, dur / 2)) * np.exp(-t * 1.2) * amp


def chime(ms, amp=0.09, dur=2.6, warm=False):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for i, m in enumerate(ms):
        d = int(i * 0.09 * SR)
        f = hz(m); tt = t[: n - d]
        y = (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * 2.0 * f * tt) * np.exp(-tt * 4)
             + (0.0 if warm else 0.22) * np.sin(2 * np.pi * 3.0 * f * tt) * np.exp(-tt * 7))
        x[d:] += y * np.exp(-tt * (1.6 if warm else 2.4))
    return x * env_adsr(n, 0.003, 0.2) * amp


def reverb(x, sec=3.2, damp=2600, seed=0):
    r = np.random.default_rng(seed)
    n = int(sec * SR); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-t * 6.9 / sec)
        ir = lp(ir, damp); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt((ir ** 2).sum())
        out.append(fftconvolve(x[ch], ir)[: x.shape[1]])
    return np.array(out)


# ---------- score ----------
mus = np.zeros((2, N))
dry = np.zeros((2, N))
L = T['lines']
def LS(i): return L[i]['start']
def LEn(i): return L[i]['end']
def CL(i, k): c = L[i]['cl']; return c[min(k, len(c) - 1)]

DM = [[50, 57, 62, 65], [46, 53, 62, 65], [53, 57, 60, 65], [48, 55, 60, 64]]      # Dm Bb F C
SUS = [[50, 57, 62, 67], [48, 55, 62, 67], [46, 53, 60, 65], [45, 52, 57, 64]]     # Dsus4 Csus2 Bb Am
TEN = [[50, 57, 62, 65], [55, 58, 62, 67], [46, 53, 58, 62], [45, 52, 57, 61]]     # Dm Gm Bb A
OPEN = [[53, 60, 65, 69], [48, 55, 64, 67], [50, 57, 62, 69], [46, 53, 62, 65]]    # F C Dm Bb


def chords(t0, t1, prog, length, bright, amp):
    t, i = t0, 0
    while t < t1:
        d = min(length, t1 - t) + 2.0
        add(mus, pad(prog[i % len(prog)], d, bright, amp), max(0, t))
        t += length; i += 1


def arp(t0, t1, prog, length, step, amp, octave=12, pattern=(0, 1, 2, 3, 2, 1), bright=1.0):
    t, k = t0, 0
    while t < t1:
        ch = prog[int((t - t0) // length) % len(prog)]
        add(dry, pluck(ch[pattern[k % len(pattern)]] + octave, 1.4, amp, bright), t, pan=0.35 * np.sin(k * 0.9))
        t += step; k += 1


def pulse(t0, t1, step, amp, fc=5200, accent=4):
    t, k = t0, 0
    while t < t1:
        add(dry, tick(amp * (1.6 if k % accent == 0 else 1.0), fc), t, pan=0.25 if k % 2 else -0.25)
        t += step; k += 1


def bass(t0, t1, prog, length, amp):
    t, i = t0, 0
    while t < t1:
        add(dry, sub(prog[i % len(prog)][0] - 12, min(length, t1 - t), amp), t)
        t += length; i += 1


B = 60 / 76
# 片头 + Pi：稀疏，小调
add(mus, pad([38, 50, 57, 62], 6.0, 600, 0.06), 0.2)
chords(A['p'] - 0.5, A['c'], DM, 8 * B, 800, 0.05)
arp(LS('p1'), LS('p5'), DM, 8 * B, B, 0.020, pattern=(0, 2, 3, 2))
bass(LS('p3'), LS('p5'), DM, 8 * B, 0.04)
add(mus, pad([45, 52, 57, 62], A['c'] - LS('p5') + 2, 600, 0.055), LS('p5'))
# 连接：明亮一点；插上之后问题出现，转为挂留和弦
chords(A['c'], LS('c3'), OPEN, 8 * B, 1100, 0.05)
arp(CUE['click'], LS('c3'), OPEN, 8 * B, B / 2, 0.018, pattern=(0, 1, 2, 3))
chords(LS('c3'), A['g'], SUS, 8 * B, 900, 0.05)
arp(LS('c3'), A['g'] - 1.0, SUS, 8 * B, B, 0.019, pattern=(0, 3, 1, 2))
bass(LS('c3'), A['g'] - 1.0, SUS, 8 * B, 0.04)
# 两头猜：紧张、脉冲变密
chords(A['g'], A['x'], TEN, 8 * B, 1200, 0.055)
pulse(A['g'] + 0.5, LS('g4'), B / 2, 0.011)
pulse(LS('g2'), LS('g4'), B / 4, 0.007, fc=6400)
arp(LS('g2'), LEn('g4'), TEN, 8 * B, B / 2, 0.016, pattern=(0, 1, 2, 3, 1, 2))
bass(A['g'], LEn('g4'), TEN, 4 * B, 0.05)
# 扩展：低音持续上升
for k, m in enumerate([38, 40, 41, 43, 45]):
    add(mus, pad([m, m + 7, m + 12], 3.4, 500 + k * 150, 0.05 + k * 0.004), CUE['slab%d' % (k + 1)] - 0.1)
add(mus, pad([46, 53, 58, 62, 65], A['s'] - CL('x2', 2) + 1.5, 900, 0.05), CL('x2', 2))
# 沙箱：平静，节点式的稀疏拨弦
chords(A['s'], A['m'], DM, 8 * B, 700, 0.045)
arp(LS('s3'), A['m'] - 1.0, DM, 8 * B, B, 0.018, pattern=(0, 2, 1, 3))
bass(LS('s3'), A['m'] - 1.0, DM, 8 * B, 0.035)
# 更小的位置：打开；讽刺处只留下薄薄一层
chords(A['m'], LS('m4'), OPEN, 8 * B, 1300, 0.05)
arp(LS('m2'), LS('m4'), OPEN, 8 * B, B / 2, 0.017, pattern=(0, 1, 2, 3, 2, 1))
bass(LS('m2'), LS('m4'), OPEN, 8 * B, 0.04)
add(mus, pad([50, 57, 62, 64], A['e'] - LS('m4') + 1.5, 600, 0.05), LS('m4'))
# 结尾：回顾时温和，书名出现前收空
chords(A['e'], LS('e3') - 0.8, DM, 8 * B, 900, 0.05)
arp(A['e'] + 0.4, LS('e2') + 2.0, DM, 8 * B, B, 0.018, pattern=(0, 1, 2, 3))
add(mus, pad([38, 45, 50, 53, 57], DUR - LS('e3') + 1.0, 700, 0.07), LS('e3') - 0.15)
add(dry, sub(38, 6.0, 0.09), LS('e3') - 0.05)
mus = mus + 0.9 * dry
wet = reverb(mus, 3.6, 2400)
music = 0.75 * mus + 0.55 * wet
music = hp(music, 38)
fe = int((DUR - 3.5) * SR)
music[:, fe:] *= np.linspace(1, 0, N - fe) ** 1.5

# ---------- 音效 ----------
sfx = np.zeros((2, N))


def thump(f=70, dur=0.5, amp=0.25, noise=0.2, fc=900):
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (f * (1 + 0.6 * np.exp(-t * 30))) * t) * np.exp(-t * 9)
    nz = lp(rng.standard_normal(n), fc) * np.exp(-t * 40) * noise
    return (body + nz) * env_adsr(n, 0.002, 0.05) * amp


def click(amp=0.12):
    n = int(0.25 * SR); t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 2500) * np.exp(-t * 160) * 0.8
    x += np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 60) * 0.25 + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 45) * 0.2
    return x * amp


def paper_tick(amp=0.03):
    n = int(0.06 * SR); t = np.arange(n) / SR
    x = sosfilt(butter(2, [1500, 6000], 'band', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 70)
    return x * amp


def swish(dur=0.9, amp=0.05):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for i in range(0, n, 2400):
        fc = 600 + 3000 * (i / n)
        seg = x[i:i + 2400]
        out[i:i + len(seg)] = sosfilt(butter(2, [fc * 0.6, fc * 1.4], 'band', fs=SR, output='sos'), seg)
    return out * np.sin(np.pi * t / dur) ** 2 * amp


def clink(f=2600, amp=0.05):
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 30)) * np.exp(-t * 14) * amp


def air(dur, amp=0.03):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(hp(rng.standard_normal(n), 300), 1800)
    return x * (np.sin(np.pi * t / dur) ** 2) * amp


add(sfx, chime([62, 69, 74], 0.045, 4.0, warm=True), CUE['title'])
add(sfx, thump(60, 0.6, 0.30, 0.6, 1400), CUE['stamp'], pan=-0.2)
for i in range(34):
    add(sfx, paper_tick(0.022 + 0.01 * rng.random()), CUE['pour'] + 0.55 + i / 34 * 2.9, pan=0.4 - 0.5 * rng.random())
add(sfx, chime([81, 88], 0.05, 2.6), CUE['result'], pan=-0.3)
add(sfx, click(0.16), CUE['click']); add(sfx, thump(90, 0.3, 0.12, 0.3), CUE['click'])
for i in range(4): add(sfx, click(0.05), CUE['leds'] + i * 0.2, pan=0.3)
add(sfx, paper_tick(0.04), CUE['split'])
add(sfx, chime([62, 63], 0.05, 2.4, warm=True), CUE['neq'])
add(sfx, chime([76, 83], 0.05, 2.0), CUE['pass'], pan=0.3)
add(sfx, thump(55, 0.4, 0.18, 0.5, 600), CUE['deny'], pan=0.3)
for k in range(4): add(sfx, clink(1800 + k * 40, 0.025), CUE['retry'] + k * 0.45, pan=0.35)
for i in range(42): add(sfx, paper_tick(0.012), CUE['matrix'] + i / 42 * 2.0 + 0.25, pan=0.6 * (rng.random() - 0.5))
add(sfx, sub(38, 2.0, 0.08), CUE['weak'])
add(sfx, swish(1.0, 0.06), CUE['paper'] - 0.1)
for k in range(5): add(sfx, thump(58 - k * 3, 0.7, 0.22 + k * 0.02, 0.5, 1000), CUE['slab%d' % (k + 1)])
add(sfx, thump(45, 1.0, 0.36, 0.7, 900), CUE['thud'])
for k in range(5): add(sfx, clink(2300 + 230 * k, 0.04), CUE['keys'] + k * 0.32, pan=0.2 * (k - 2))
add(sfx, chime([69, 74, 78], 0.055, 3.0, warm=True), CUE['ctrl'])
for k in range(8): add(sfx, paper_tick(0.03), CUE['flip'] + k * 0.16, pan=0.5 * ((k % 3) - 1))
for c in T['ecards']:
    p = (c['xf'] - 960) / 960 * 0.6
    add(sfx, thump(80, 0.35, 0.10, 0.6, 1500), c['land'], pan=p)
    add(sfx, paper_tick(0.03), c['land'], pan=p)
    add(sfx, thump(95, 0.2, 0.03, 0.4, 1500), c['land2'], pan=p)
add(sfx, air(7.0, 0.03), LS('e3') - 0.4)
sfx = sfx + 0.5 * reverb(sfx, 2.0, 3800, seed=5)

# ---------- 旁白 ----------
vo = np.zeros(N)
for lid, l in T['lines'].items():
    sr, x = wavfile.read(project.output / f'vo/{lid}.wav')
    x = x.astype(float) / 32768
    i = int(l['start'] * SR)
    vo[i:i + len(x)] += x[: N - i]
vo = hp(vo, 70)
vo_st = np.array([vo, vo]) + 0.10 * reverb(np.array([vo, vo]), 1.2, 3000, seed=9)

# 侧链：说话时音乐退让约 6 dB
env = np.sqrt(np.convolve(vo ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
gate = (env > 0.01).astype(float)
k = int(0.35 * SR)
gate = np.convolve(gate, np.ones(k) / k, 'same')
duck = 1 - 0.5 * np.clip(gate * 1.3, 0, 1)


def rms_db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)


# 旁白比音乐高约 11 dB（说话时），音乐低音量铺底
speech = vo_st[:, gate[: N] > 0.5]
m_sp = music[:, gate > 0.5] * duck[gate > 0.5]
g = 10 ** ((rms_db(speech) - 11 - rms_db(m_sp)) / 20)
mix = vo_st + music * duck * g + sfx * g * 1.6
print('music gain', round(20 * np.log10(g), 1), 'dB')
peak = np.abs(mix).max()
mix = mix / peak * 0.8
project.output.mkdir(parents=True, exist_ok=True)
raw_mix = project.output / 'mix_raw.wav'
wavfile.write(raw_mix, SR, (mix.T * 32767).astype(np.int16))
wavfile.write(project.output / 'music_only.wav', SR, ((music * g + sfx * g * 1.6).T / peak * 0.8 * 32767).astype(np.int16))

# 两遍 loudnorm → -16 LUFS
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(raw_mix), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=18:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True, check=True)
m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=18:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
target = project.film / 'assets/mix.wav'
temporary = target.with_name('mix.tmp.wav')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw_mix), '-af', af, '-ar', '48000', str(temporary)], check=True)
temporary.replace(target)
write_json(project.output / 'mix.json', {
    'sourceHash': mix_fingerprint(project),
    'audioHash': hashlib.sha256(target.read_bytes()).hexdigest(),
})
print(project.variant, 'mix:', m['input_i'], 'LUFS → -16 LUFS ; written', target)
