"""配乐：用 ElevenLabs Music（music_v2_5）给每个剪辑 × 语言作一首（短版中 / 英、长版中 / 英；时长按各自的旁白排）。
科技纪录片的推进感：开头第一拍就满能量，问题段落压力上升，Scion 揭晓时转亮，结果是全片最响的高潮，结尾留一个悬而未决的问号。
旁白压在上面，所以底下一直有一层连贯的长音铺底，旋律不占中频；写 quiet / sparse 时 ElevenLabs 会留出几秒空白，所以安静的段落也写“长音一直在”。
段落边界取自时间轴的 acts，每一次转折都落在画面的转折上。结果按作曲计划的哈希缓存在 out/music/。
用法：python3 tools/music.py <short|long> <zh|en> [--seed=N]"""
import hashlib, json, os, subprocess, sys, time
import numpy as np

CFG = json.load(open('film.json'))
CUT = next((a for a in sys.argv[1:] if a in ('long', 'short')), 'short')
LANG = next((a for a in sys.argv[1:] if a in ('zh', 'en')), 'zh')
KEY = f'{CUT}-{LANG}'
TIMELINE = {'short-zh': 'douyin', 'short-en': 'tiktok', 'long-zh': 'bilibili', 'long-en': 'youtube'}
TL = json.load(open(f'timeline/{TIMELINE[KEY]}.json'))
BPM = '118 BPM'
GLOBAL = [BPM, 'modern cinematic tech documentary score', 'instrumental', 'driving electronic pulse with warm analog synths and strings',
          'confident, curious, energetic', 'wide stereo', 'punchy but never harsh', 'one continuous flowing piece', 'smooth seamless transitions between sections',
          'leaves room for a narrator voice', 'no busy melody in the mid range', 'a soft legato synth pad bed sustains underneath the whole piece',
          'the music never stops or drops out']
NEG = ['vocals', 'singing', 'lyrics', 'spoken word', 'voice', 'rap', 'dubstep', 'distorted', 'harsh', 'silence', 'long pauses']
STYLE = {
    'hook': ['starts instantly at full energy on the very first beat, no fade-in', 'tense ticking synth arpeggio', 'deep pulsing bass', 'urgent and curious', 'light hi-hats'],
    'wall': ['pressure keeps building', 'low pulsing sub bass', 'staccato strings over a held pad', 'subtle alarm-like synth motif', 'rising tension'],
    'insight': ['a warm held chord at a steady level that sustains the whole time', 'thoughtful and curious', 'soft plucked synth on top', 'steady soft pulse',
                'keeps playing right up to the next section with no break before it', 'no silence, no pause'],
    'scion': ['bright uplifting reveal right on the first beat', 'shimmering synth arpeggio', 'hopeful major key', 'steady kick drum returns', 'building momentum'],
    'how': ['steady focused groove', 'clean precise arpeggios', 'light percussion', 'clever and confident', 'steady energy throughout'],
    'climax': ['triumphant climax right on the first beat', 'big drums', 'soaring synth lead and strings', 'the loudest and most intense section of the piece',
               'eases off over the last bar and flows into the next section without stopping'],
    'human': ['continues straight on without any pause', 'warm and human, a little playful', 'soft piano over the steady pulse', 'light percussion'],
    'lessons': ['continues straight on without any pause', 'warm and human, a little playful', 'soft piano over the steady pulse', 'light percussion', 'gently evolving'],
    'world': ['expansive, warm and open', 'strings swell slowly', 'steady pulse continues', 'hopeful'],
    'ending': ['continues straight on without any pause', 'suspenseful build toward an open question', 'held tension chord with a ticking pulse', 'rising'],
    'end': ['a final bright resolving hit that rings and sustains until the very end'],
}
# 换一个随机种子重作（同一份作曲计划，作出来的那一版在段落交界留了空白时用）
SEED = {'long-zh': 7}
# 短版中文两次都在 Scion 揭晓前空出 6 秒（模型在“揭晓”前习惯先停下来）：这一首让脉冲一直走，揭晓从里面长出来
if KEY == 'short-zh':
    STYLE = {**STYLE,
        'insight': ['the steady soft pulse and held synth pad continue at a steady level the whole time', 'thoughtful and curious', 'soft plucked synth on top', 'no breakdown, no silence, no pause'],
        'scion': ['continues straight on from the previous section without any pause', 'brightens into a hopeful major key', 'shimmering synth arpeggio', 'kick drum joins', 'building momentum']}
    SEED['short-zh'] = 11


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
    json.dump({'file': path, 'plan': chunks, 'onsets': beats}, open(f'out/music/{KEY}-score.json', 'w'), indent=1)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))
    print(f'{KEY} score: {d:.1f}s (timeline {TL["duration"]:.1f}s) → {path} · {len(beats)} onsets')
    for c, (name, db) in zip(chunks, rms): print(f'   {c["text"]:12s} {c["duration_ms"] / 1000:5.1f}s  {db:6.1f} dB')


if __name__ == '__main__':
    main()
