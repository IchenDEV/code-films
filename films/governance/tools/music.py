"""配乐：用 ElevenLabs Music（music_v2_5）给每个剪辑作一首（短版、长版；时长按各自的旁白排）。
一篇关于“写程序越来越像治理组织”的个人随笔：开头第一拍就有能量；讲机制时稳定推进；“纠偏”一段先带点荒诞（AI 互相否定、救火），
再转为果断；“注意力变了”开始抬升，结尾是全片最动人、最响的段落，最后一个和弦一直响到片尾投票结束。
旁白压在上面，所以底下一直有一层连贯的长音铺底，旋律不占中频；写 quiet / sparse 时 ElevenLabs 会留出几秒空白，所以安静的段落也写“长音一直在”。
段落边界取自时间轴的 acts，每一次转折都落在画面的转折上。结果按作曲计划的哈希缓存在 out/music/。
用法：python3 tools/music.py <short|long> [--seed=N]"""
import hashlib, json, os, subprocess, sys, time
import numpy as np

CFG = json.load(open('film.json'))
CUT = next((a for a in sys.argv[1:] if a in ('long', 'short')), 'short')
KEY = f'{CUT}-zh'
TIMELINE = {'short-zh': 'douyin', 'long-zh': 'bilibili'}
TL = json.load(open(f'timeline/{TIMELINE[KEY]}.json'))
BPM = '100 BPM'
GLOBAL = [BPM, 'warm modern cinematic score for a thoughtful personal tech essay', 'instrumental', 'felt piano, warm analog synth pads, plucked arpeggios and strings over a steady soft pulse',
          'curious, warm, confident', 'wide stereo', 'never harsh', 'one continuous flowing piece', 'smooth seamless transitions between sections',
          'leaves room for a narrator voice', 'no busy melody in the mid range', 'a soft legato synth pad bed sustains underneath the whole piece',
          'the music never stops or drops out']
NEG = ['vocals', 'singing', 'lyrics', 'spoken word', 'voice', 'rap', 'dubstep', 'distorted', 'harsh', 'silence', 'long pauses', 'epic trailer braams']
HOLD = 'the held synth pad and the steady soft pulse continue at a steady level, no breakdown, no silence, no pause'
GO = 'continues straight on without any pause'
STYLE = {
    'hook': ['starts instantly at full energy on the very first beat, no fade-in', 'confident pulsing synth bass', 'bright plucked arpeggio', 'curious and modern', 'light hi-hats'],
    'past': [GO, 'nostalgic warm felt piano over the steady pulse', HOLD],
    'up': [GO, 'widening and building', 'strings swell gradually', 'steady kick drum'],
    'premise': [GO, 'thoughtful and intelligent', 'soft piano motif over the held pad', HOLD],
    'coord': [GO, 'busy interlocking plucked synth patterns', 'steady groove'],
    'adhoc': [GO, 'playful and modular', 'light percussion', 'steady groove'],
    'done': [GO, 'precise clean ticking arpeggios', 'confident groove'],
    'mech': [GO, 'clever and confident groove', 'clean precise arpeggios', 'steady kick drum', 'building momentum'],
    'authority': [GO, 'slightly tense', 'low pulsing bass under the groove', 'rising'],
    'fix': [GO, 'a little absurd and playful at first, comedic pizzicato over the held pad', 'then turns decisive', HOLD],
    'leverage': [GO, 'decisive and rising', 'strings and drums build with confidence'],
    'selfrun': [GO, 'open and spacious', 'calm steady groove', HOLD],
    'self': [GO, 'reflective, zooming out', 'strings begin to swell', 'emotional build'],
    'attention': [GO, 'reflective, zooming out', 'strings begin to swell', 'emotional build'],
    'oldest': [GO, 'timeless and a little mysterious', 'warm cello and piano over the held pad', HOLD],
    'ending': [GO, 'emotional uplifting climax', 'big warm strings and drums', 'the loudest and most moving section of the piece', 'soaring'],
    'end': ['a final warm resolving chord that rings and sustains until the very end'],
}
# 换一个随机种子重作（同一份作曲计划，作出来的那一版在段落交界留了空白时用）
SEED = {}


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
