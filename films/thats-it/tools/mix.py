"""混音：配乐（情绪的主线）+ 少量对位音效（+ 短版的旁白）→ out/mix/<variant>.wav。
- 配乐：按段落做增益自动化，保证高潮是全片最响的地方（ElevenLabs 每段的响度不可靠）；
  长版曲线立起来之后、画面黑下去的那一刻，高潮在半秒内退下去，落进一层很轻的长音，钢琴再进来（不留死寂：
  黑屏加静音在手机上像卡住了）；短版的配乐一直连着；
- 音效：只点在几个动作上（气泡、卷帘门、就这？、雷、片名、水滴、门、钢笔、按键、裂缝……），音量压在配乐下面一点，听得清但不抢；
- 短版有旁白：旁白统一响度、轻压缩，配乐在说话时退后约 8 dB；段落增益按“目标情绪曲线”自适应（先测每段响度再拉到目标）；
- 长版 -15 LUFS（无口播，不刺耳），短版 -14 LUFS（有旁白，竖屏平台常用）；真峰值 -1.5 dBTP。
同一剪辑、同一语言的版本时间轴相同，混一次复制即可。
用法：python3 tools/mix.py [long | short-zh | short-en]（不给就全部）"""
import json, os, re, shutil, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
GROUPS = {'long': ['bilibili', 'youtube', 'douyin', 'channels'], 'short-zh': ['douyin_short', 'channels_short'], 'short-en': ['shorts']}
LUFS = {'long': -15, 'short-zh': -14, 'short-en': -14}
# 短版各段的目标响度（dB，相对值）：高潮最响，问题段落最静
TARGET = {'hook': -17, 'storm': -18, 'question': -21, 'funnel': -19, 'why': -19, 'door': -18, 'climax': -13.5, 'ending': -18, 'end': -20}


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
    S = {s['kind']: s for s in TL['shots']}
    # 短版没有的镜头（片名、敲代码、鸿沟……）对应的音效自动跳过
    cue = lambda kind, name=None, d=0.0: ((S[kind]['cues'].get(name) if name else S[kind]['a']) + d) if kind in S and (name is None or name in S[kind]['cues']) else None
    E = []
    add = lambda name, t, g, dur=None, fade=0.0: E.append((name, t, g, dur, fade)) if t is not None else None
    add('bubble', 0.0, -12)                          # 你的问题弹出来（第一帧）
    add('reply', 1.6, -15)                            # 它很快就答了
    add('shutter', cue('shop', d=0.2), -11)           # 卷帘门落下
    add('boop', cue('shrug', d=0.33), -9)             # 就这？
    add('whoosh', cue('facade', d=0.1), -18)          # 镜头移到隔壁那扇窗
    add('keys', cue('desk', d=0.3), -21)              # 一下午的键盘声
    add('thunder', cue('desk', 'L06', 0.45), -8)      # 要变天了
    add('city', cue('split', 'L08', 0.1), -17, 4.4 if TL['cut'] == 'long' else 2.6, 1.0)  # 拉远：整座城的声音
    add('boom', cue('title', d=0.05), -9)             # 片名
    add('whoosh', cue('funnel', d=0.3), -17)          # 灯火聚成漏斗
    add('chime', cue('funnel', 'L13', 0.4), -13)      # 漏斗尖亮起来
    add('drip', cue('sea', d=2.7), -9)                # 一杯水
    add('sink', cue('sea', 'L15', 0.1), -11)          # 暖光沉下去
    add('wind', cue('peaks', d=0.1), -19)             # 山风
    add('chime', cue('peaks', 'L17', 0.4), -14)       # 阳光照到峰顶
    add('door', cue('door', 'L21', 0.0), -11)         # 门开了
    add('swell', cue('door', 'L21', 1.2), -11)        # 光涌出来
    add('impact', cue('swarm', d=0.02), -9)           # 门里
    add('pen', cue('napkin', d=0.25), -13)            # 钢笔画漏斗
    add('stroke', cue('keys', d=0.4), -11)            # 一个字一个字
    add('rumble', cue('gap', d=0.3), -11)             # 鸿沟变宽
    add('city', cue('city', d=0.0), -19, 5.0, 1.0)    # 同一天
    add('bubble', cue('return', 'L29', 0.2), -12)     # 那个放了很多年的问题
    add('reply', cue('return', 'L29', 1.9), -15)
    add('swell', cue('dawn', d=1.6), -14)             # 天亮
    add('chime', cue('dawn', d=2.1), -12)             # 就从这儿开始
    return E


def music_auto(TL, n, music):
    """段落增益 + 长版高潮后的退场。"""
    t = np.arange(n) / SR
    g = np.ones(n, np.float32)
    if TL['cut'] == 'long':
        GAIN = {'hook': 0, 'storm': 0.5, 'question': 0, 'funnel': -1.5, 'why': -2.5, 'door': -0.5, 'climax': 3.0, 'reveal': 0.5, 'ending': 0, 'end': 0}
    else:
        # 自适应：先测每段的响度，再拉向目标曲线；最多 ±4 dB，免得段落之间忽大忽小
        mono = music.mean(axis=1)
        GAIN = {}
        for a in TL['acts']:
            seg = mono[int(a['a'] * SR): int(a['b'] * SR)]
            m = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
            GAIN[a['name']] = float(np.clip(TARGET[a['name']] - m, -4, 4))
        print('   段落增益', {k: round(v, 1) for k, v in GAIN.items()})
    # 段落增益是阶梯，再用 2.4 秒的窗口抹平：段落之间慢慢过渡，听不出“换挡”
    step = SR // 100
    tt = np.arange(0, n, step) / SR
    gdb = np.zeros(len(tt))
    for a in TL['acts']: gdb[(tt >= a['a']) & (tt < a['b'])] = GAIN[a['name']]
    w = 240
    gdb = np.convolve(np.pad(gdb, w // 2, mode='edge'), np.ones(w) / w, mode='same')[w // 2: w // 2 + len(tt)]
    g *= db(np.interp(t, tt, gdb)).astype(np.float32)
    # 高潮里再往上推：越到后面越响
    S = {s['kind']: s for s in TL['shots']}
    cl = [a for a in TL['acts'] if a['name'] == 'climax'][0]
    g *= db((2.0 if TL['cut'] == 'long' else 1.0) * np.clip((t - cl['a']) / (cl['b'] - cl['a']), 0, 1) * (t < cl['b']))
    if TL['cut'] == 'long':
        # 曲线立到顶、画面黑下去的那一刻：高潮半秒内退下去（铺底的长音接住），钢琴再慢慢进来
        cut = S['vertigo']['cues']['L23_end'] + 0.15
        back = S['napkin']['a'] + 0.2
        down = np.clip((cut + 0.5 - t) / 0.5, 0, 1)
        up = np.clip((t - back) / 0.8, 0, 1)
        g *= np.where(t < back, down, up)
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
    """旁白：整条录音先统一处理（高通 80 Hz、整条统一响度、-24 dB 以上 2:1 轻压缩，包络慢，不压出“咬字”感），
    再按段落取出、整段连续地放到时间轴上（刀口都在段与段之间的停顿里）。"""
    voice = np.zeros(n, np.float32)
    takes = {}
    for e in TL.get('vo', []):
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
    """铺底：配乐真的空下来（< -28 dB 持续半秒以上：段落间的空当、长版高潮退下去之后）的地方，升起一层很轻的持续弦乐长音接住；
    拨弦之间零点几秒的休止是音乐本身的呼吸，不补（补了会一下一下地冒出长音）；片尾最后 3 秒的自然淡出不补。"""
    if not os.path.exists('out/music/bed.mp3'): return 0
    b = decode('out/music/bed.mp3', 2)
    fade = int(1.0 * SR)
    # 循环到全片长度，每次接缝交叉淡化 1 秒
    out = b.copy()
    while len(out) < n:
        x = b.copy()
        out[-fade:] = out[-fade:] * np.linspace(1, 0, fade)[:, None] + x[:fade] * np.linspace(0, 1, fade)[:, None]
        out = np.concatenate([out, x[fade:]])
    bed = out[:n] * (db(-18) / (np.sqrt(np.mean(b ** 2)) + 1e-9)) * db(-11)
    env = follower(np.abs(music.mean(axis=1)), 0.02, 0.12)[::48]   # 1 kHz
    envdb = 20 * np.log10(env + 1e-9)
    mask = np.clip((-28 - envdb) / 5, 0, 1)
    # 只留连续空了 0.5 秒以上的地方（从空当的第一刻补起）；更短的休止不补
    quiet = np.concatenate([[0], (mask > 0).astype(np.int8), [0]])
    edges = np.flatnonzero(np.diff(quiet))
    for a, b in zip(edges[::2], edges[1::2]):
        if b - a < 500: mask[a:b] = 0
    mask[np.arange(len(mask)) * 48 / SR > TL['duration'] - 3] = 0
    # 0.4 秒平滑：补的那层起落不突兀
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
    if TL.get('vo'):
        # 说话时配乐退后 6 dB；起落都慢（0.15 秒压下、1 秒回来），句间不会一抽一抽
        vact = np.clip(follower(np.abs(voice), 0.15, 1.0) / db(-26), 0, 1)
        music *= (1 - (1 - db(-6)) * vact)[:, None] * db(-1)
    music += bed_fill(TL, n, music)
    fx = np.zeros((n, 2), np.float32)
    E = events(TL)
    for name, t, gdb, dur, fade in E:
        x = sfx(name).copy()
        if dur:
            # 只截短、不循环：硬接循环在接缝处会断一下（音效文件自己带淡出）
            L = int(dur * SR)
            if L > len(x): sys.exit(f'音效 {name} 只有 {len(x) / SR:.1f} 秒，要用 {dur} 秒：在 sfx_gen.py 里生成更长的')
            x = x[:L]
            f = int(max(fade, 0.08) * SR)
            x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(max(0, t) * SR)
        seg = x[: max(0, n - i)] * db(gdb)
        fx[i: i + len(seg)] += seg
    out = music + fx + voice[:, None]
    out[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    out[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))[:, None] ** 2
    out = np.tanh(out * 1.05) / 1.05
    os.makedirs('out/mix', exist_ok=True)
    tmp = f'out/mix/{v}.raw.wav'
    wavfile.write(tmp, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
    li = loudnorm(tmp, f'out/mix/{v}.wav', LUFS[key])
    os.remove(tmp)
    print(f'{v}: {TL["duration"]:.1f}s · {len(E)} sfx · {len(TL.get("vo", []))} vo · {li} LUFS → {LUFS[key]} LUFS → out/mix/{v}.wav')


if __name__ == '__main__':
    for key in sys.argv[1:] or list(GROUPS):
        names = GROUPS[key]
        # 共用一份混音的前提：时间轴完全相同（否则画面和声音会错位）
        tls = [json.load(open(f'timeline/{v}.json')) for v in names]
        bad = [v for v, T in zip(names, tls) if T['shots'] != tls[0]['shots'] or T.get('vo') != tls[0].get('vo')]
        if bad: sys.exit(f'时间轴与 {names[0]} 不同，先跑 node tools/timeline.mjs：{bad}')
        mix(names[0], key)
        # 时间轴完全一样：其余版本直接复制
        for v in names[1:]:
            shutil.copy(f'out/mix/{names[0]}.wav', f'out/mix/{v}.wav'); print(f'{v}: = {names[0]}')
