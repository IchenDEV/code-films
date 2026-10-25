"""混音：配乐 + 旁白 + 对位音效 → out/mix/douyin.wav。
- 旁白：整条一次合成，先统一处理（高通、统一响度、轻压缩），再按段落放到时间轴上；说话时配乐退后约 6 dB；
- 配乐：段落增益按“目标情绪曲线”自适应（先测每段响度再拉到目标），结尾最响；
- 铺底：配乐真的空下来的地方，升起一层很轻的长音接住（ElevenLabs 偶尔会留空洞）；
- 音效：每次切画面一声轻的风声，砸出来的大字一记重音，几个关键词各有对位；
- 全部 -14 LUFS（film.json），真峰值 -1.5 dBTP。
用法：python3 tools/mix.py"""
import json, os, re, subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
LUFS = json.load(open('film.json'))['loudness']
# 各段的目标响度（dB，相对值）：结论一段最响，神坛一段最静
TARGET = {'hook': -17, 'altar': -20, 'one': -18, 'two': -19, 'three': -17, 'end': -15, 'outro': -18}
CLIMAX = 'end'
# 砸出来的大字的声音：章节卡一记重落地（原片三幕之间也是这一声），数字一记闷击
STAMP = {None: ('slam', -9), 'num': ('hit', -11)}
# 关键词的声音：(画面段落, 关键词) → [(音效, 增益 dB, 相对关键词的偏移秒)]
CUES = {
    ('paleblue', 'dot'): [('shimmer', -12, 0)],
    ('tree', 'branch'): [('shimmer', -15, 0)],
    ('making', 'ai'): [('riser', -16, -1.8), ('pulse', -10, 0)],
    ('ordinary', 'fan'): [('bell', -10, 0)],
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
        if i: E.append(('whoosh', s['a'] - 0.1, -21))  # 每次切画面
        for st in s['stamp']:
            if st[0] in s['k'] and not (s['kind'] == 'ordinary'):
                name, g = STAMP[st[3] if len(st) > 3 else None]
                E.append((name, s['k'][st[0]] - 0.03, g))
        for k, t in s['k'].items():
            for name, g, d in CUES.get((s['kind'], k), []): E.append((name, t + d, g))
    E.append(('slam', 0.0, -12))  # 第一帧：一记重音，开门见山
    end = next(s for s in TL['shots'] if s['kind'] == 'endcard')
    for j in range(3): E.append(('pop', end['a'] + 0.4 + j * 0.35, -15))
    return sorted(E, key=lambda e: e[1])


def music_auto(TL, n, music):
    """段落增益：先测每段响度，再拉向目标曲线；结果段落里再往上推一点。"""
    t = np.arange(n) / SR
    mono = music.mean(axis=1)
    GAIN = {}
    for a in TL['acts']:
        seg = mono[int(a['a'] * SR): int(a['b'] * SR)]
        m = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
        GAIN[a['name']] = float(np.clip(TARGET[a['name']] - m, -4, 8))  # 安静段落（结尾的长音）要能拉上来，否则旁白停顿处像掉空
    print('   段落增益', {k: round(v, 1) for k, v in GAIN.items()})
    step = SR // 100
    tt = np.arange(0, n, step) / SR
    gdb = np.zeros(len(tt))
    for a in TL['acts']: gdb[(tt >= a['a']) & (tt < a['b'])] = GAIN[a['name']]
    w = 240
    gdb = np.convolve(np.pad(gdb, w // 2, mode='edge'), np.ones(w) / w, mode='same')[w // 2: w // 2 + len(tt)]
    g = db(np.interp(t, tt, gdb)).astype(np.float32)
    cl = next(a for a in TL['acts'] if a['name'] == CLIMAX)
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
    """铺底：配乐真的空下来（< -28 dB 持续半秒以上）的地方，升起一层很轻的长音接住；片尾投票时也接住，直到最后的淡出。"""
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
    mask[np.arange(len(mask)) * 48 / SR > TL['duration'] - 0.6] = 0  # 片尾投票时配乐会收住，长音接到最后，和整体一起淡出
    mask = np.convolve(mask, np.ones(400) / 400, mode='same')
    mask = np.interp(np.arange(n), np.arange(len(mask)) * 48, mask)
    print(f'   铺底补洞：{(mask > 0.5).sum() / SR:.1f} 秒')
    return bed * mask[:, None]


def mix(v):
    TL = json.load(open(f'timeline/{v}.json'))
    n = int(TL['duration'] * SR)
    mfile = json.load(open('out/music/zh-score.json'))['file']
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
    out[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))[:, None] ** 2
    out = np.tanh(out * 1.05) / 1.05
    os.makedirs('out/mix', exist_ok=True)
    tmp = f'out/mix/{v}.raw.wav'
    wavfile.write(tmp, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
    li = loudnorm(tmp, f'out/mix/{v}.wav', LUFS)
    os.remove(tmp)
    print(f'{v}: {TL["duration"]:.1f}s · {len(E)} sfx · {len(TL["vo"])} vo · {li} LUFS → {LUFS} LUFS → out/mix/{v}.wav')


if __name__ == '__main__':
    mix('douyin')
