"""混音：配乐（每个剪辑 × 语言一首）+ 旁白 + 对位音效 → out/mix/<variant>.wav。
- 旁白：整条一次合成，先统一处理（高通、统一响度、轻压缩），再按段落放到时间轴上；说话时配乐退后约 6 dB；
- 配乐：段落增益按“目标情绪曲线”自适应（先测每段响度再拉到目标），高潮最响；
- 铺底：配乐真的空下来的地方，升起一层很轻的长音接住（ElevenLabs 偶尔会留空洞）；
- 音效：每个转场、每个被念出的关键词一个，音量压在配乐下面一点；
- 全部 -14 LUFS（film.json），真峰值 -1.5 dBTP。
同一剪辑、同一语言的版本时间轴相同，混一次复制即可。
用法：python3 tools/mix.py [short-zh | short-en | long-zh | long-en]（不给就全部）"""
import json, os, re, shutil, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
GROUPS = {'short-zh': ['douyin', 'channels'], 'short-en': ['tiktok'], 'long-zh': ['bilibili'], 'long-en': ['youtube']}
LUFS = json.load(open('film.json'))['loudness']
# 各段的目标响度（dB，相对值）：高潮最响，讲道理的段落最静
TARGET = {'hook': -17, 'wall': -18, 'insight': -21, 'scion': -18, 'how': -19, 'climax': -13.5, 'human': -19, 'lessons': -19, 'world': -19,
          'ending': -18, 'end': -20}

# 转场的声音
TRANS = {'whip': ('whoosh', -16), 'flash': ('flash', -13), 'zoom': ('whoosh', -19)}
TRTYPE = {'chart': 'whip', 'team': 'whip', 'repo': 'flash', 'mirrors': 'whip', 'offline': 'zoom', 'online': 'whip', 'scion': 'flash', 'principles': 'zoom',
          'changeset': 'whip', 'derived': 'whip', 'fetch': 'whip', 'tiers': 'zoom', 'results': 'flash', 'rewrite': 'whip', 'no': 'whip', 'superfan': 'whip',
          'mergeq': 'whip', 'ecosystem': 'zoom', 'bottleneck': 'zoom', 'endcard': 'flash'}  # 与 web/main.js 的 TR 一致
# 关键词的声音：(镜头, 关键词) → [(音效, 增益 dB, 相对关键词的偏移秒)]
CUES = {
    ('jam', 'swap'): [('stamp', -9, 0.05)], ('jam', 'fast'): [('alarm', -15, 0)],
    ('chart', 'n1'): [('slam', -12, 0), ('tick', -20, 0)], ('chart', 'n2'): [('slam', -10, 0), ('tick', -19, 0)],
    ('team', 'seven'): [('pop', -14, 0)], ('team', 'five'): [('whoosh', -20, 0)], ('team', 'how'): [('pop', -13, 0)], ('team', 'x10'): [('slam', -12, 0)],
    ('repo', 'gb'): [('slam', -11, 0)], ('repo', 'wc'): [('pop', -14, 0)], ('repo', 'n25m'): [('tick', -18, 0), ('slam', -13, 0)], ('repo', 'more'): [('pop', -16, 0)],
    ('repo', 'pb'): [('rush', -13, -0.1), ('slam', -10, 0)],
    ('mirrors', 't1'): [('pop', -14, 0)], ('mirrors', 't2'): [('pop', -14, 0)], ('mirrors', 't3'): [('pop', -14, 0)], ('mirrors', 'mir'): [('hum', -17, 0)],
    ('mirrors', 'lag'): [('whoosh', -18, 0)], ('mirrors', 'strain'): [('stamp', -11, 0)],
    ('offline', 'whole'): [('pop', -13, -0.2)], ('offline', 'off'): [('click', -13, 0)], ('offline', 'center'): [('whoosh', -18, -0.3)],
    ('online', 'on'): [('success', -14, 0)], ('online', 'drag'): [('stamp', -11, 0.1)], ('online', 'ask'): [('pop', -13, 0), ('pop', -15, 0.6)],
    ('scion', 'name'): [('sprout', -12, -0.2)], ('scion', 'nopush'): [('stamp', -10, 0.1)],
    ('principles', 'p1'): [('click', -13, 0)], ('principles', 'p2'): [('click', -13, 0)], ('principles', 'p3'): [('click', -13, 0)],
    ('principles', 'p4'): [('click', -13, 0)], ('principles', 'p5'): [('click', -13, 0)], ('principles', 'p6'): [('click', -13, 0)],
    ('changeset', 'cs'): [('slam', -13, 0)], ('changeset', 'tree'): [('whoosh', -18, 0)], ('changeset', 'list'): [('typing', -20, 0)],
    ('changeset', 'blob'): [('pop', -14, 0.3)], ('changeset', 'inst'): [('success', -14, 0)],
    ('derived', 'der'): [('typing', -20, 0)], ('derived', 'swap'): [('success', -14, 0)],
    ('fetch', 'have'): [('error', -16, 0)], ('fetch', 'want'): [('success', -14, 0)], ('fetch', 'any'): [('pop', -14, 0.2)],
    ('tiers', 'd'): [('click', -14, 0)], ('tiers', 'c'): [('click', -14, 0)], ('tiers', 's'): [('click', -14, 0)], ('tiers', 'hit'): [('slam', -12, 0)],
    ('tiers', 'iso'): [('error', -15, -0.1), ('stamp', -11, 0.1)],
    ('results', 'x200'): [('riser', -17, -1.9), ('slam', -9, 0)], ('results', 'sec'): [('slam', -10, 0)], ('results', 'cpu'): [('slam', -10, 0)],
    ('rewrite', 'solve'): [('success', -13, 0)], ('rewrite', 'give'): [('typing', -19, 0.3)], ('rewrite', 'hand'): [('typing', -21, 0)],
    ('rewrite', 'm20'): [('slam', -10, 0)], ('rewrite', 's4'): [('slam', -10, 0)],
    ('no', 'better'): [('pop', -14, -0.2)], ('no', 'no'): [('stamp', -8, 0), ('crumble', -13, 0.1)], ('no', 'pile'): [('pop', -16, -0.4)],
    ('no', 'nope'): [('stamp', -8, 0), ('crumble', -13, 0.1)], ('no', 'intent'): [('click', -13, 0)],
    ('superfan', 'fan'): [('pop', -14, 0)], ('superfan', 'spot'): [('alarm', -18, 0), ('pop', -14, 0.2)],
    ('mergeq', 'land'): [('tick', -18, 0)], ('mergeq', 'unlock'): [('success', -13, 0)], ('mergeq', 'fix'): [('error', -16, -0.4), ('success', -13, 0)],
    ('ecosystem', 'nope'): [('stamp', -10, 0)], ('ecosystem', 'only'): [('pop', -14, 0)], ('ecosystem', 'm612'): [('slam', -11, 0)],
    ('ecosystem', 'back'): [('whoosh', -18, 0)], ('ecosystem', 'tog'): [('success', -14, 0)],
    ('bottleneck', 'neck'): [('success', -15, 0)], ('bottleneck', 'wall'): [('error', -15, 0)], ('bottleneck', 'next'): [('question', -10, 0)],
}


def decode(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', str(ch), '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    return x.reshape(-1, ch) if ch > 1 else x


def db(x): return 10 ** (x / 20)


_cache = {}
def sfx(name):
    if name not in _cache:
        x = decode(f'out/sfx/{name}.mp3', 2)
        _cache[name] = x / (np.max(np.abs(x)) + 1e-9) * db(-1)
    return _cache[name]


def events(TL):
    E = []
    for i, s in enumerate(TL['shots']):
        if i and s['kind'] in TRTYPE:
            name, g = TRANS[TRTYPE[s['kind']]]
            E.append((name, s['a'] - 0.12, g))
        for k, t in s['k'].items():
            for name, g, d in CUES.get((s['kind'], k), []): E.append((name, t + d, g))
    E.append(('slam', 0.0, -11))  # 第一帧：一记重音，开门见山
    end = next(s for s in TL['shots'] if s['kind'] == 'endcard')
    for j in range(4): E.append(('pop', end['a'] + 0.25 + j * 0.12, -16))
    E.append(('pop', end['a'] + 0.9, -13))
    return sorted(E, key=lambda e: e[1])


def music_auto(TL, n, music):
    """段落增益：先测每段响度，再拉向目标曲线；结果段落里再往上推一点。"""
    t = np.arange(n) / SR
    mono = music.mean(axis=1)
    GAIN = {}
    for a in TL['acts']:
        seg = mono[int(a['a'] * SR): int(a['b'] * SR)]
        m = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
        GAIN[a['name']] = float(np.clip(TARGET[a['name']] - m, -4, 4))
    print('   段落增益', {k: round(v, 1) for k, v in GAIN.items()})
    step = SR // 100
    tt = np.arange(0, n, step) / SR
    gdb = np.zeros(len(tt))
    for a in TL['acts']: gdb[(tt >= a['a']) & (tt < a['b'])] = GAIN[a['name']]
    w = 240
    gdb = np.convolve(np.pad(gdb, w // 2, mode='edge'), np.ones(w) / w, mode='same')[w // 2: w // 2 + len(tt)]
    g = db(np.interp(t, tt, gdb)).astype(np.float32)
    cl = next(a for a in TL['acts'] if a['name'] == 'climax')
    g *= db(1.5 * np.clip((t - cl['a']) / (cl['b'] - cl['a']), 0, 1) * (t < cl['b'])).astype(np.float32)
    return g


def loudnorm(src, dst, target):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={target}:TP=-1.5:LRA=20:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
    af = (f"loudnorm=I={target}:TP=-1.5:LRA=20:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', dst], check=True)
    return m['input_i']


def follower(x, attack, release):
    """包络跟随（一阶，攻击/释放不同），在 1 kHz 上算再插值回去。"""
    step = SR // 1000
    y = x[: len(x) // step * step].reshape(-1, step).max(axis=1)
    out = np.zeros_like(y)
    a, r = np.exp(-1 / (attack * 1000)), np.exp(-1 / (release * 1000))
    v = 0.0
    for i, s in enumerate(y):
        v = a * v + (1 - a) * s if s > v else r * v + (1 - r) * s
        out[i] = v
    return np.interp(np.arange(len(x)) / step, np.arange(len(out)), out)


def voice_track(TL, n):
    """旁白：整条录音先统一处理（高通 80 Hz、整条统一响度、-24 dB 以上 2:1 轻压缩，包络慢），再按段落整段放到时间轴上。"""
    voice = np.zeros(n, np.float32)
    takes = {}
    for e in TL['vo']:
        if e['file'] not in takes:
            x = signal.sosfilt(signal.butter(2, 80, btype='high', fs=SR, output='sos'), decode(e['file']))
            env = np.sqrt(np.maximum(signal.sosfilt(signal.butter(2, 8, fs=SR, output='sos'), x ** 2), 0) + 1e-10)
            x = x * (db(-18) / (np.sqrt(np.mean(x[env > db(-38)] ** 2)) + 1e-9))
            env = np.sqrt(np.maximum(signal.sosfilt(signal.butter(2, 6, fs=SR, output='sos'), x ** 2), 0) + 1e-10)
            takes[e['file']] = x * np.maximum(env / db(-24), 1) ** (1 / 2 - 1)
        a = int(e['trim'] * SR); x = takes[e['file']][a: a + int(e['dur'] * SR)].copy()
        x[:480] *= np.linspace(0, 1, 480); x[-3840:] *= np.linspace(1, 0, 3840)
        i = int(e['t'] * SR)
        voice[i: i + len(x)] += x[: n - i].astype(np.float32)
    return voice


def bed_fill(TL, n, music):
    """铺底：配乐真的空下来（< -28 dB 持续半秒以上）的地方，升起一层很轻的长音接住；片尾最后 3 秒的自然淡出不补。"""
    b = decode('out/music/bed.mp3', 2)
    fade = int(1.0 * SR)
    out = b.copy()
    while len(out) < n:
        x = b.copy()
        out[-fade:] = out[-fade:] * np.linspace(1, 0, fade)[:, None] + x[:fade] * np.linspace(0, 1, fade)[:, None]
        out = np.concatenate([out, x[fade:]])
    bed = out[:n] * (db(-18) / (np.sqrt(np.mean(b ** 2)) + 1e-9)) * db(-11)
    env = follower(np.abs(music.mean(axis=1)), 0.02, 0.12)[::48]
    envdb = 20 * np.log10(env + 1e-9)
    mask = np.clip((-28 - envdb) / 5, 0, 1)
    quiet = np.concatenate([[0], (mask > 0).astype(np.int8), [0]])
    edges = np.flatnonzero(np.diff(quiet))
    for a, b2 in zip(edges[::2], edges[1::2]):
        if b2 - a < 500: mask[a:b2] = 0
    mask[np.arange(len(mask)) * 48 / SR > TL['duration'] - 3] = 0
    mask = np.convolve(mask, np.ones(400) / 400, mode='same')
    mask = np.interp(np.arange(n), np.arange(len(mask)) * 48, mask)
    print(f'   铺底补洞：{(mask > 0.5).sum() / SR:.1f} 秒')
    return bed * mask[:, None]


def mix(v, key):
    TL = json.load(open(f'timeline/{v}.json'))
    n = int(TL['duration'] * SR)
    mfile = json.load(open(f'out/music/{key}-score.json'))['file']
    m = decode(mfile, 2)[:n]
    music = np.zeros((n, 2), np.float32); music[: len(m)] = m
    music *= db(-18) / (np.sqrt(np.mean(music ** 2)) + 1e-9)
    music *= music_auto(TL, n, music)[:, None]
    voice = voice_track(TL, n)
    vact = np.clip(follower(np.abs(voice), 0.15, 1.0) / db(-26), 0, 1)
    music *= (1 - (1 - db(-6)) * vact)[:, None] * db(-1)
    music += bed_fill(TL, n, music)
    fx = np.zeros((n, 2), np.float32)
    E = events(TL)
    for name, t, gdb in E:
        x = sfx(name)
        i = int(max(0, t) * SR)
        seg = x[: max(0, n - i)] * db(gdb)
        fx[i: i + len(seg)] += seg
    # 音效也给旁白让一点路
    fx *= (1 - (1 - db(-3)) * vact)[:, None]
    out = music + fx + voice[:, None]
    out[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    out[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))[:, None] ** 2
    out = np.tanh(out * 1.05) / 1.05
    os.makedirs('out/mix', exist_ok=True)
    tmp = f'out/mix/{v}.raw.wav'
    wavfile.write(tmp, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
    li = loudnorm(tmp, f'out/mix/{v}.wav', LUFS)
    os.remove(tmp)
    print(f'{v}: {TL["duration"]:.1f}s · {len(E)} sfx · {len(TL["vo"])} vo · {li} LUFS → {LUFS} LUFS → out/mix/{v}.wav')


if __name__ == '__main__':
    for key in sys.argv[1:] or list(GROUPS):
        names = GROUPS[key]
        tls = [json.load(open(f'timeline/{v}.json')) for v in names]
        bad = [v for v, T in zip(names, tls) if T['shots'] != tls[0]['shots'] or T['vo'] != tls[0]['vo']]
        if bad: sys.exit(f'时间轴与 {names[0]} 不同，先跑 node tools/timeline.mjs：{bad}')
        mix(names[0], key)
        for v in names[1:]:
            shutil.copy(f'out/mix/{names[0]}.wav', f'out/mix/{v}.wav'); print(f'{v}: = {names[0]}')
