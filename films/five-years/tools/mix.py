"""混音：旁白 + 配乐（按旁白自动避让）+ 对位音效 → out/mix/<variant>.wav，整体响度 -14 LUFS（短视频与 YouTube 的常用标准）。
- 旁白：每段统一响度，轻压缩，高通 80 Hz；
- 配乐：说话时退后约 9 dB，句间回来；协调者接过目标之前强制静一下，让“落地”那一下真的落下去；
- 音效：转场、重击、按键、提示音……都挂在镜头的对位点上（见 events）。
用法：python3 tools/mix.py <variant>…"""
import json, os, re, subprocess, sys
import numpy as np
from scipy import signal

SR = 48000
CFG = json.load(open('film.json'))
TR = {'rewind': 'glitch', 'title': 'flash', 'ide': 'zoom', 'tab': 'whip', 'diff': 'whip', 'agent': 'zoom', 'term': 'whip', 'grid': 'zoom',
      'overload': 'flash', 'bloom': None, 'projects': 'whip', 'archive': None, 'loop': 'zoom', 'harness': 'whip', 'ladder': 'zoom', 'end': None, 'endcard': None}


def decode(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', str(ch), '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    return x.reshape(-1, ch) if ch > 1 else x


def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, fs=SR, output='sos'), x, axis=0)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x, axis=0)
def db(x): return 10 ** (x / 20)


def follower(x, attack, release):
    """包络跟随（一阶，攻击/释放不同）。x ≥ 0；在 1 kHz 上算再插值回去，快得多。"""
    step = SR // 1000
    y = x[: len(x) // step * step].reshape(-1, step).max(axis=1)
    out = np.zeros_like(y)
    a, r = np.exp(-1 / (attack * 1000)), np.exp(-1 / (release * 1000))
    v = 0.0
    for i, s in enumerate(y):
        v = a * v + (1 - a) * s if s > v else r * v + (1 - r) * s
        out[i] = v
    return np.interp(np.arange(len(x)) / step, np.arange(len(out)), out)


_cache = {}
def sfx(name, pitch=0.0):
    k = (name, pitch)
    if k not in _cache:
        x = decode(f'out/sfx/{name}.mp3', 2)
        if pitch:
            n = int(len(x) / 2 ** (pitch / 12))
            x = signal.resample(x, n, axis=0).astype(np.float32)
        _cache[k] = x / (np.max(np.abs(x)) + 1e-9) * db(-1)
    return _cache[k]


def events(TL):
    E = []
    add = lambda name, t, g, p=0.0, dur=None: E.append((name, t, g, p, dur)) if t is not None and t >= -0.5 else None
    for i, s in enumerate(TL['shots']):
        k, a, c = s['kind'], s['a'], s['cues']
        cue = lambda n, d=None: c.get(n, d)
        tr = TR.get(k)
        if i and tr == 'whip': add('whip', a - 0.2, -9)
        elif i and tr == 'zoom': add('whoosh', a - 0.4, -10)
        elif i and tr == 'glitch': add('glitch', a - 0.2, -9)
        elif i and tr == 'flash': add('hit', a - 0.02, -8)
        if k == 'swarm':
            add('impact', 0.0, -3); add('whoosh', 0.0, -7); add('shimmer', 0.25, -12)
            add('hit', cue('boss'), -9); add('shimmer', cue('boss'), -9)
        elif k == 'rewind':
            add('rewind', cue('rew', a + 0.05), -6); add('tick', cue('cursor'), -6); add('hit', cue('cursor'), -14)
        elif k == 'title':
            add('riser', cue('t2') - 2.0, -10); add('impact', cue('t2'), -3)
        elif k == 'ide':
            r = cue('rename', a + 6)
            add('typing', a + 0.3, -16, 0, r - 0.8 - a - 0.3)
            add('pop', cue('jump'), -12); add('shimmer', r, -13); add('error', cue('decide'), -13)
        elif k == 'tab':
            add('typing', a + 0.1, -17, 0, 1.0); add('shimmer', cue('ghost'), -12)
            add('tabkey', cue('tab'), -4); add('impact', cue('tab'), -7)
            if cue('push'):
                for j in range(3): add('tabkey', cue('tab') + 1.6 + j * 0.55, -15, j * 1.5)
        elif k == 'diff':
            p = cue('prompt', a + 0.4)
            n = len(TL['txt']['promptShort' if TL['cut'] == 'short' else 'prompt'])
            add('typing', p, -17, 0, n * 0.07); add('pop', p + n * 0.07, -10)
            add('whoosh', cue('multi'), -13); add('tick', cue('watch'), -10)
        elif k == 'agent':
            add('hit', cue('decide'), -10); add('ping', cue('L11', a + 0.2), -9); add('tick', cue('search'), -11)
            add('tick', cue('locate'), -10, 3); add('typing', cue('edit'), -18, 0, 0.6)
            if cue('test') and cue('retry'): add('error', cue('test') + 0.35, -11); add('success', cue('retry') + 0.9, -9)
            elif cue('test'): add('success', cue('test') + 0.5, -10)
            add('whoosh', cue('move'), -11)
        elif k == 'term':
            for j, n in enumerate(['devin', 'cc', 'codex']): add('pop', cue(n), -9, j * 2)
            add('whoosh', cue('move'), -10); add('success', cue('done'), -8)
        elif k == 'grid':
            x = cue('x10', a + 1)
            add('hit', x, -6)
            for j, d in enumerate([0, 0.18, 0.36]): add('pop', x + d, -10, [0, 3, 7][j])
            add('shimmer', cue('iso'), -13); add('whoosh', cue('gui'), -11)
        elif k == 'overload':
            m = cue('many', a + 0.8)
            add('ping', a + 0.3, -10); add('ping', a + 0.7, -10, 2)
            add('pings', m, -10); add('pings', m + 3.6, -12)
            add('heartbeat', cue('memory', m + 2.5), -9); add('glitch', cue('switch'), -13)
            if cue('neck'): add('impact', cue('neck'), -3)
        elif k == 'neck':
            add('heartbeat', a + 0.2, -8); add('heartbeat', a + 3.6, -8); add('impact', cue('neck'), -3)
        elif k == 'bloom':
            h = cue('handoff', a + 0.8)
            add('riser', h - 1.5, -7); add('impact', h + 0.5, 0); add('hit', h + 0.5, -4)
            for n in ['scout', 'fan', 'chain', 'sub']: add('shimmer', cue(n), -10)
            if cue('reclaim'):
                for j in range(5): add('pop', cue('reclaim') + j * 0.12, -12, j * 2)
            add('whoosh', cue('reroute'), -12); add('hit', cue('count'), -9)
        elif k == 'projects':
            add('shimmer', cue('coord'), -11); add('whip', cue('coord', a) + 0.25, -13); add('success', cue('back', a) + 0.6, -9)
        elif k == 'archive':
            add('scratch', a, -6); add('stamp', cue('notnew'), -4); add('success', cue('reliable', a) + 0.3, -10)
            if cue('letgo'): add('impact', cue('letgo'), -4)
        elif k == 'loop':
            st = cue('steps', a + 1.5)
            for j in range(5): add('tick', st + j * 0.32, -10, j * 2)
            add('success', st + 1.8, -10); add('error', cue('unverified'), -9)
        elif k == 'harness':
            add('riser', cue('million', a) - 0.3, -13); add('cash', cue('million'), -13)
            add('stamp', cue('zero'), -4); add('whoosh', cue('harness'), -10); add('impact', cue('letgo'), -3)
        elif k == 'reality':
            add('cash', cue('ten', a) + 0.3, -11); add('success', cue('pass'), -13)
            add('crack', cue('crash'), -4); add('error', cue('crash'), -9)
            for j, n in enumerate(['when', 'wait', 'together']): add('tick' if j < 2 else 'success', cue(n), -9, j * 2)
        elif k == 'ladder':
            for j, n in enumerate(['l1', 'l2', 'l3', 'l4', 'l5']): add('pop', cue(n), -8, j * 2)
            add('impact', cue('ask'), -6)
        elif k == 'end':
            add('swell', cue('other', a + 4) - 0.8, -11)
        elif k == 'endcard':
            add('hit', a + 0.1, -14)
    return [e for e in E if e[1] is not None]


def music_auto(TL, n):
    """配乐的段落自动化：协调者接过目标前的静默、回顾与冷静段的退后、片尾淡出。"""
    S = {s['kind']: s for s in TL['shots']}
    t = np.arange(n) / SR
    g = np.ones(n, np.float32)
    def seg(a, b, gain_db, ramp=0.4):
        k = np.clip(np.minimum((t - a) / ramp, (b - t) / ramp), 0, 1)
        g[:] *= 1 - (1 - db(gain_db)) * k
    arrive = S['bloom']['cues'].get('handoff', S['bloom']['a'] + 0.8) + 0.5
    # 静默：落地前 1.3 秒压到 -22 dB，落地那一帧立刻回来
    k = np.clip((t - (arrive - 1.6)) / 0.3, 0, 1) * (t < arrive)
    g *= 1 - (1 - db(-22)) * k
    if 'archive' in S: seg(S['archive']['a'], (S['loop']['a'] if 'loop' in S else S['archive']['b']), -5)
    if 'reality' in S: seg(S['reality']['a'], S['reality']['b'], -4)
    end = S['endcard']['b']
    g *= np.clip((end - t) / 1.2, 0, 1)
    return g


def loudnorm(src, dst, target):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={target}:TP=-1.0:LRA=20:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
    af = (f"loudnorm=I={target}:TP=-1.0:LRA=20:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', dst], check=True)
    return m['input_i']


def mix(v):
    TL = json.load(open(f'timeline/{v}.json'))
    n = int(TL['duration'] * SR) + SR
    # 旁白
    voice = np.zeros(n, np.float32)
    for e in TL['vo']:
        x = decode(e['file'])
        a = int(e['trim'] * SR); x = x[a: a + int(e['dur'] * SR)]
        x = hp(x, 80)
        env = np.sqrt(np.maximum(lp(x ** 2, 8), 0) + 1e-10)
        act = env > db(-38)
        x = x * (db(-18) / (np.sqrt(np.mean(x[act] ** 2)) + 1e-9))
        # 轻压缩：-22 dB 以上 3:1
        env = np.sqrt(np.maximum(lp(x ** 2, 12), 0) + 1e-10)
        over = np.maximum(env / db(-22), 1)
        x = x * over ** (1 / 3 - 1)
        x[: 240] *= np.linspace(0, 1, 240); x[-480:] *= np.linspace(1, 0, 480)
        i = int(e['t'] * SR)
        voice[i: i + len(x)] += x[: n - i]
    voice *= db(-18) / (np.sqrt(np.mean(voice[np.abs(voice) > db(-40)] ** 2)) + 1e-9)
    # 配乐
    mfile = json.load(open(f'out/music/{v}.json'))['file']
    m = decode(mfile, 2)[:n]
    music = np.zeros((n, 2), np.float32); music[: len(m)] = m
    music *= db(-16) / (np.sqrt(np.mean(music ** 2)) + 1e-9)  # 配乐整体 RMS → -16 dBFS，再交给自动化与避让
    vact = follower(np.abs(voice), 0.04, 0.45)
    vact = np.clip(vact / db(-26), 0, 1)
    duck = 1 - (1 - db(-9)) * vact
    music *= (duck * music_auto(TL, n) * db(-4))[:, None]
    # 音效
    fx = np.zeros((n, 2), np.float32)
    for name, t, gdb, p, dur in events(TL):
        x = sfx(name, p).copy()
        if dur:  # 循环到指定长度（打字声）
            L = int(dur * SR)
            reps = int(np.ceil(L / len(x)))
            x = np.concatenate([x] * reps)[:L]
            x[-2400:] *= np.linspace(1, 0, 2400)[:, None]
        i = int(max(0, t) * SR)
        seg = x[: max(0, n - i)] * db(gdb)
        fx[i: i + len(seg)] += seg
    out = music + fx + voice[:, None]
    out[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
    out = np.tanh(out * 1.1) / 1.1  # 软限幅，削掉偶发尖峰
    out = out[: int(TL['duration'] * SR)]
    os.makedirs('out/mix', exist_ok=True)
    tmp = f'out/mix/{v}.raw.wav'
    from scipy.io import wavfile
    wavfile.write(tmp, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
    li = loudnorm(tmp, f'out/mix/{v}.wav', CFG.get('loudness', -14))
    os.remove(tmp)
    print(f'{v}: {TL["duration"]:.1f}s · {len(events(TL))} sfx · {li} LUFS → {CFG.get("loudness", -14)} LUFS → out/mix/{v}.wav')


if __name__ == '__main__':
    for v in sys.argv[1:]: mix(v)
