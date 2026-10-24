"""混音：配乐（每个剪辑一首）+ 旁白 + 对位音效 → out/mix/<variant>.wav。
- 旁白：整条一次合成，先统一处理（高通、统一响度、轻压缩），再按段落放到时间轴上；说话时配乐退后约 6 dB；
- 配乐：段落增益按“目标情绪曲线”自适应（先测每段响度再拉到目标），结尾最响；
- 铺底：配乐真的空下来的地方，升起一层很轻的长音接住（ElevenLabs 偶尔会留空洞）；
- 音效：每个转场、每个被念出的关键词一个，音量压在配乐下面一点；
- 全部 -14 LUFS（film.json），真峰值 -1.5 dBTP。
同一剪辑的版本（抖音与视频号）时间轴相同，混一次复制即可。
用法：python3 tools/mix.py [short-zh | long-zh]（不给就全部）"""
import json, os, re, shutil, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
GROUPS = {'short-zh': ['douyin', 'channels'], 'long-zh': ['bilibili']}
LUFS = json.load(open('film.json'))['loudness']
# 各段的目标响度（dB，相对值）：结尾最响，讲道理的段落最静
TARGET = {'hook': -17, 'past': -19, 'up': -18, 'premise': -20, 'coord': -19, 'adhoc': -19, 'done': -19, 'mech': -18, 'authority': -18,
          'fix': -18, 'leverage': -18, 'selfrun': -20, 'self': -18, 'attention': -18, 'oldest': -20, 'ending': -14, 'end': -18}
CLIMAX = 'ending'

# 转场的声音
TRANS = {'whip': ('whoosh', -16), 'flash': ('flash', -13), 'zoom': ('whoosh', -19)}
TRTYPE = {'hook': 'whip', 'title': 'flash', 'evolution': 'whip', 'ladder': 'zoom', 'simon': 'whip', 'context': 'whip', 'coord': 'whip', 'adhoc': 'whip',
          'evidence': 'whip', 'maturity': 'whip', 'pain': 'flash', 'loop': 'flash', 'firefight': 'whip', 'leverage': 'zoom', 'why': 'whip', 'fixes': 'whip',
          'lead': 'whip', 'noorg': 'whip', 'skeleton': 'zoom', 'attention': 'zoom', 'purpose': 'flash', 'finale': 'zoom', 'endcard': 'flash'}  # 与 web/main.js 的 TR 一致
# 关键词的声音：(镜头, 关键词) → [(音效, 增益 dB, 相对关键词的偏移秒)]
CUES = {
    ('hook', 'stop'): [('stamp', -10, 0.05)], ('hook', 'aa'): [('slam', -9, 0)], ('hook', 'rules'): [('pop', -13, 0)], ('hook', 'spawn'): [('sparkle', -13, 0)],
    ('title', 'org'): [('slam', -9, 0)],
    ('evolution', 'fn'): [('typing', -20, 0)], ('evolution', 'agent'): [('deal', -15, 0), ('deal', -16, 0.3)], ('evolution', 'fight'): [('zap', -17, 0)], ('evolution', 'lead'): [('pop', -12, 0)],
    ('ladder', 'few'): [('pop', -15, 0)], ('ladder', 'teams'): [('whoosh', -18, -0.2)], ('ladder', 'thousands'): [('whoosh', -16, -0.3), ('slam', -13, 0)],
    ('ladder', 'pr'): [('stamp', -12, 0.05)], ('ladder', 'why'): [('pop', -15, 0)], ('ladder', 'mech'): [('gear', -10, 0)],
    ('simon', 'q'): [('question', -14, 0)], ('simon', 'limit'): [('pop', -15, 0)], ('simon', 'premise'): [('slam', -10, 0)], ('simon', 'value'): [('click', -12, 0)], ('simon', 'fact'): [('click', -12, 0)],
    ('context', 'ctx'): [('snap', -10, 0), ('sparkle', -16, 0.25)], ('context', 'away'): [('warm', -18, 0)],
    ('coord', 'many'): [('sparkle', -14, 0)], ('coord', 'slow'): [('pop', -15, 0)], ('coord', 'book'): [('book', -14, 0)], ('coord', 'cost'): [('alarm', -17, 0), ('stamp', -10, 0.05)],
    ('coord', 'pipe'): [('success', -14, 0)], ('coord', 'solo'): [('success', -14, 0.6)],
    ('adhoc', 'fixed'): [('pop', -14, 0)], ('adhoc', 'crack'): [('crumble', -10, 0)], ('adhoc', 'team'): [('sparkle', -14, 0)], ('adhoc', 'gather'): [('whoosh', -17, 0)], ('adhoc', 'gone'): [('whoosh', -17, 0), ('success', -15, 0.3)],
    ('evidence', 'q'): [('question', -16, 0)], ('evidence', 'std'): [('book', -14, 0)], ('evidence', 'done'): [('pop', -13, 0)], ('evidence', 'notyet'): [('error', -12, 0), ('stamp', -9, 0.05)],
    ('evidence', 'cheat'): [('error', -15, 0.4)], ('evidence', 'proof'): [('pop', -15, 0), ('scan', -13, 0.7), ('success', -12, 1.0)],
    ('evidence', 'stages'): [('click', -13, 0.6), ('click', -13, 1.1), ('click', -13, 1.6), ('success', -13, 2.1)],
    ('maturity', 'q'): [('question', -14, 0)], ('maturity', 'box'): [('click', -13, 0)], ('maturity', 'mature'): [('riser', -20, -0.3)], ('maturity', 'check'): [('scan', -14, 0)],
    ('pain', 'nerve'): [('heartbeat', -12, 0)], ('pain', 'probe'): [('scan', -16, 0)], ('pain', 'pain'): [('heartbeat', -13, 0)], ('pain', 'routine'): [('pop', -16, 0)],
    ('pain', 'alarm'): [('alarm', -12, 0)], ('pain', 'skip'): [('zap', -10, 0)], ('pain', 'fuse'): [('breaker', -10, 0)], ('pain', 'human'): [('stamp', -10, 0.05)], ('pain', 'inst'): [('slam', -12, 0)],
    ('loop', 'start'): [('pop', -15, 0)], ('loop', 'redo'): [('click', -15, 0), ('click', -16, 0.3)], ('loop', 'deny'): [('error', -13, 0)], ('loop', 'loop'): [('spin', -12, -0.4), ('stamp', -10, 0.05)],
    ('firefight', 'fire'): [('fire', -13, -0.6), ('spray', -13, 0.4)], ('firefight', 'again'): [('fire', -11, -0.1), ('stamp', -10, 0.45)],
    ('leverage', 'note'): [('typing', -18, 0)], ('leverage', 'low'): [('stamp', -9, 0.05)], ('leverage', 'book'): [('book', -14, 0)], ('leverage', 'rule'): [('lever', -10, 0), ('success', -14, 0.5)],
    ('why', 'q'): [('question', -14, 0)], ('why', 'q1'): [('pop', -12, 0)], ('why', 'q2'): [('pop', -12, 0)], ('why', 'q3'): [('pop', -12, 0)],
    ('fixes', 'f1'): [('success', -13, 0)], ('fixes', 'f2'): [('success', -13, 0)], ('fixes', 'f3'): [('success', -13, 0)], ('fixes', 'note'): [('deal', -14, -0.2)],
    ('fixes', 'patch'): [('stamp', -10, 0.05)], ('fixes', 'fix'): [('slam', -9, 0)],
    ('lead', 'hero'): [('fire', -16, 0)], ('lead', 'fewer'): [('success', -13, 0)],
    ('noorg', 'copy'): [('pop', -15, 0)], ('noorg', 'layers'): [('stamp', -9, 0.05)], ('noorg', 'solo'): [('success', -13, 0)], ('noorg', 'direct'): [('whoosh', -16, 0)], ('noorg', 'less'): [('slam', -9, 0.3)],
    ('skeleton', 'b1'): [('click', -12, 0)], ('skeleton', 'b2'): [('click', -12, 0)], ('skeleton', 'b3'): [('click', -12, 0)], ('skeleton', 'b4'): [('click', -12, 0)], ('skeleton', 'b5'): [('click', -12, 0)],
    ('skeleton', 's1'): [('pop', -12, 0)], ('skeleton', 's2'): [('pop', -12, 0)], ('skeleton', 's3'): [('pop', -12, 0)],
    ('attention', 'shift'): [('question', -15, 0)], ('attention', 'a1'): [('click', -12, 0.4)], ('attention', 'a2'): [('whoosh', -15, -0.3), ('success', -15, 0.3)], ('attention', 'a3'): [('whoosh', -14, -0.4), ('warm', -14, 0.2)],
    ('purpose', 'book'): [('book', -12, 0)], ('purpose', 'quote'): [('typing', -21, 0)], ('purpose', 'purpose'): [('sparkle', -11, 0)], ('purpose', 'keep'): [('slam', -11, 0)],
    ('finale', 'code'): [('click', -14, 0)], ('finale', 'agents'): [('sparkle', -14, 0)], ('finale', 'rules'): [('gear', -14, 0)], ('finale', 'self'): [('whoosh', -16, 0)],
    ('finale', 'org'): [('slam', -10, 0)], ('finale', 'hundred'): [('riser', -16, -1.6), ('slam', -11, 0)], ('finale', 'never'): [('snap', -12, 0), ('warm', -13, 0.2)],
    ('finale', 'create'): [('warm', -11, 0), ('sparkle', -13, 0.2)], ('finale', 'you'): [('question', -10, 0)],
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
    for j in range(4): E.append(('deal', 0.05 + j * 0.42, -17))  # 开场：人在一张张发任务卡
    # “以后请注意”那一场：没改规则之前，小机器人每 2.4 秒撞一次石头（与 web/shots/c.js 的 leverage 同一个周期）
    for s in TL['shots']:
        if s['kind'] != 'leverage': continue
        stop = s['k']['rule'] - s['a'] + 0.2 if 'rule' in s['k'] else s['b'] - s['a']
        for i in range(3):
            u = 0.7 * 2.4 - i * 0.8
            while u < 0: u += 2.4
            while u < stop:
                E.append(('bonk', s['a'] + u, -19)); u += 2.4
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
    out[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))[:, None] ** 2
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
