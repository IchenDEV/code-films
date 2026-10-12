"""配乐：用 ElevenLabs Music（music_v2_5）按时间轴作一首曲子，四个平台版本共用。
没有旁白，整部片子的情绪曲线就是这首曲子：俏皮 → 不安 → 悬停 → 好奇 → 温暖 → 期待 → 高潮 → 退下去 → 独奏钢琴 → 回暖 → 收束。
段落边界取自时间轴的 acts，所以每一次转折都落在画面的转折上。作完测出实际拍点（onset），写进 out/music/beats.json，
再跑一次 timeline.mjs，段落内部的字幕起点会吸附到这些拍点上。
结果按作曲计划的哈希缓存在 out/music/。
用法：python3 tools/music.py [long | short zh | short en] [--beats-only] [--try] [--seed=N]"""
import hashlib, json, os, subprocess, sys, time
import numpy as np

CFG = json.load(open('film.json'))
CUT = next((a for a in sys.argv[1:] if a in ('long', 'short')), 'long')
LANG = next((a for a in sys.argv[1:] if a in ('zh', 'en')), 'zh')
# 长版一首；短版有旁白，中英文时长不同，各作一首
KEY = CUT if CUT == 'long' else f'short-{LANG}'
TL = json.load(open('timeline/' + {'long': 'bilibili', 'short-zh': 'douyin_short', 'short-en': 'shorts'}[KEY] + '.json'))
BPM = f"{TL['bpm']} BPM"
GLOBAL = [BPM, 'emotional cinematic film score', 'instrumental', 'felt piano and strings', 'intimate, warm and human',
          'modern indie film soundtrack', 'D major', 'wide stereo', 'gentle dynamics, never harsh',
          'one continuous flowing piece', 'smooth seamless transitions between sections', 'never drops to silence unless a section asks for it']
NEG = ['vocals', 'singing', 'lyrics', 'spoken word', 'voice', 'rap', 'EDM drop', 'dubstep', 'distorted', 'harsh']

STYLE = {
    'hook': ['starts instantly on the very first beat, no fade-in', 'playful pizzicato strings and celesta', 'light, curious and charming',
             'a little comedic', 'soft staccato piano', 'flows straight into the next section'],
    'storm': ['a low cello ostinato pulsing in eighth notes enters', 'tension rising', 'soft ticking clock-like percussion',
              'darker minor harmony', 'distant timpani roll', 'crescendo into a dramatic swell at the end'],
    'question': ['a sustained soft string chord continues throughout, never silent', 'quiet and contemplative', 'sparse solo piano notes', 'unresolved, questioning', 'leads directly into the next section without a pause'],
    'funnel': ['the main theme enters smoothly on the first beat, continuing the previous section without any pause', 'gentle piano melody over pulsing strings',
               'a sense of wonder', 'slowly descending melodic motif', 'building layer by layer', 'soft low drum pulse'],
    'why': ['thoughtful and warm', 'flowing piano arpeggios', 'strings swell gently like a sunrise', 'hopeful and curious', 'light pulse continues'],
    'door': ['anticipation', 'rising tension', 'soft heartbeat-like low drum', 'string tremolo crescendo', 'building toward a climax'],
    'climax': ['full orchestral climax right on the first beat', 'soaring strings and brass', 'big cinematic drums', 'wordless choir pad',
               'awe and vertigo', 'the most intense and loudest section of the piece', 'sustains full intensity until the very last beat'],
    'reveal': ['begins with two seconds of near silence', 'then solo felt piano, very sparse', 'reflective, intimate and tender', 'no drums'],
    'ending': ['the warm main theme returns', 'felt piano with lush strings', 'heartfelt and hopeful', 'gentle swell growing to a warm peak', 'very soft percussion or none'],
    'end': ['a final warm resolving chord', 'last solo piano notes', 'fades gently to silence'],
}
if CUT == 'short':
    # 短版：每段更短，开头更有推进感；高潮后的钢琴与回暖合成一段。
    # 有旁白压在上面，配乐要连成一片：底下一直有一层连贯的弦乐长音，拨弦只点缀在上面（满篇拨弦和断奏在旁白下面听起来一顿一顿的）
    STYLE = {**STYLE,
        'hook': ['starts instantly at full presence on the very first beat, no fade-in', 'warm sustained strings underneath',
                 'light playful pizzicato and celesta on top', 'curious and catchy', 'flows straight into the next section'],
        # “谁看错了？”只是收一收：长音和稀疏的钢琴一直在（写 quiet / sparse 时，ElevenLabs 会留出三四秒空白）
        'question': ['the legato string chord holds at a soft, steady level the whole time', 'a few gentle piano notes on top',
                     'questioning, unresolved', 'no silence, no pause', 'leads directly into the next section'],
        'climax': STYLE['climax'][:-1] + ['eases off over the last bar and flows into the next section without stopping'],
        'ending': ['continues straight on from the previous section without any pause, softer', 'solo felt piano over a held warm string chord',
                   'the warm main theme grows with lush strings', 'heartfelt and hopeful', 'reaches a warm peak at the end'],
        'end': ['a final warm resolving chord that rings and sustains until the very end']}
    GLOBAL = GLOBAL + ['leaves room for a narrator voice', 'no busy melody in the mid range',
                       'a soft legato string bed sustains underneath the whole piece', 'the music never stops or drops out', 'legato, no staccato']


# 换一个随机种子重作（同一份作曲计划，作出来的那一版在段落交界留了空白时用）
SEED = {'short-en': 3}


def plan():
    return [{'text': f"[{a['name']}]", 'duration_ms': int(round((a['b'] - a['a']) * 1000)), 'positive_styles': [BPM] + STYLE[a['name']],
             'negative_styles': NEG, 'context_adherence': 'high'} for a in TL['acts']]


def decode(path, sr=22050):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768, sr


def measure_beats(path):
    """音符起音（onset）：频谱通量的局部峰。只要强的那些，字幕跟着它们换。"""
    x, sr = decode(path)
    hop, n = 512, 2048
    win = np.hanning(n).astype(np.float32)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * win
    mag = np.log1p(np.abs(np.fft.rfft(frames, axis=1)) * 10)
    flux = np.maximum(np.diff(mag, axis=0), 0).sum(axis=1)
    flux = (flux - np.convolve(flux, np.ones(43) / 43, mode='same')).clip(0)  # 去掉慢变化
    t = (np.arange(len(flux)) + 1) * hop / sr
    thr = np.percentile(flux, 80)
    peaks = [t[i] for i in range(2, len(flux) - 2) if flux[i] > thr and flux[i] == flux[i - 2: i + 3].max()]
    # 每个拍点只留一个
    out = []
    for p in peaks:
        if not out or p - out[-1] > 0.25: out.append(round(float(p), 3))
    # 逐段落的响度（RMS dB），画面的能量可以对照
    rms = []
    for a in TL['acts']:
        seg = x[int(a['a'] * sr): int(a['b'] * sr)]
        rms.append((a['name'], round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)), 1)))
    return out, rms


def main():
    os.makedirs('out/music', exist_ok=True)
    chunks = plan()
    seed = next((int(x.split('=')[1]) for x in sys.argv if x.startswith('--seed=')), SEED.get(KEY))
    h = hashlib.sha1(json.dumps([chunks, GLOBAL] + ([seed] if seed is not None else [])).encode()).hexdigest()[:10]
    path = f'out/music/score-{h}.mp3'
    if '--beats-only' not in sys.argv and not os.path.exists(path):
        body = {'composition_plan': {'positive_global_styles': GLOBAL, 'negative_global_styles': NEG, 'chunks': chunks},
                'model_id': CFG['music']['model'], **({'seed': seed} if seed is not None else {})}
        for attempt in range(3):
            # 用 --json - 直接发请求体：CLI 的本地校验还要求旧版 music_prompt 字段
            r = subprocess.run(['elevenlabs', 'music', 'compose', '--json', '-', '-o', path], input=json.dumps(body), capture_output=True, text=True)
            if r.returncode == 0 and os.path.exists(path) and os.path.getsize(path) > 10000: break
            print('retry', (r.stderr or r.stdout)[-500:]); time.sleep(6)
        else:
            sys.exit('music failed')
    if not os.path.exists(path): sys.exit('no score yet: ' + path)
    beats, rms = measure_beats(path)
    dst = f'out/music/{KEY}-score' + ('.try' if '--try' in sys.argv else '') + '.json'
    json.dump({'file': path, 'plan': chunks}, open(dst, 'w'), indent=1)
    # 长版画面已按 long-beats.json 排好；新曲子的拍点另存，不去挪动已渲染的画面
    json.dump({'file': path, 'beats': beats}, open(f'out/music/{KEY}-beats' + ('.new' if KEY == 'long' and os.path.exists('out/music/long-beats.json') else '') + '.json', 'w'))
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))
    print(f'{KEY} score: {d:.1f}s (timeline {TL["duration"]:.1f}s) → {path} · {len(beats)} onsets')
    for c, (name, db) in zip(chunks, rms): print(f'   {c["text"]:12s} {c["duration_ms"] / 1000:5.1f}s  {db:6.1f} dB')


if __name__ == '__main__':
    main()
