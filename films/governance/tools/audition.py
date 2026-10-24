"""试音：同一段口语稿，用几组声音 / 模型 / 参数各念一遍，量出音高（中位数、起伏范围）、语速和停顿，帮着挑“不像念稿”的那一组。
上一部的反馈是“人机感太强”：起伏小、每句一个调、停顿均匀。这里量的就是这几样：
  音高起伏  有声帧 f0 的 p10–p90，单位半音（越大越有抑扬顿挫；太大会显得夸张）
  句调变化  每句（两次停顿之间）的平均音高，句与句之间的标准差（半音；越小越“一个调念到底”）
  语速      每秒字数（不算标点）
  停顿      0.15 秒以上的停顿个数和平均长度
结果缓存在 out/audition/<名字>.mp3（文本和参数不变就不重合成）。
用法：python3 tools/audition.py <稿子.txt> [名字…]（不给名字就全部）"""
import hashlib, json, os, re, subprocess, sys
import numpy as np

SR = 16000
PANGGE = 'hFamrilbAE6WDMtWgKvu'
CANDIDATES = {
    # 上一部（code-review）的设置：平稳，被嫌“人机感太强”
    'v4-calm': ('eleven_v4', PANGGE, {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.15, 'speed': 1.0}),
    'v4-mid': ('eleven_v4', PANGGE, {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.3, 'speed': 1.0}),
    'v4-live': ('eleven_v4', PANGGE, {'stability': 0.32, 'similarity_boost': 0.8, 'style': 0.45, 'speed': 1.0}),
    'v3c': ('eleven_v3_conversational', PANGGE, {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.3}),
    'v3': ('eleven_v3', PANGGE, {'stability': 0.5, 'similarity_boost': 0.8}),
}


def synth(name, text):
    model, voice, settings = CANDIDATES[name]
    h = hashlib.sha1(json.dumps([text, model, voice, settings], ensure_ascii=False).encode()).hexdigest()[:8]
    path = f'out/audition/{name}-{h}.mp3'
    if os.path.exists(path): return path
    body = {'text': text, 'model_id': model, 'voice_id': voice, 'voice_settings': settings, 'language_code': 'zh', 'output_format': 'mp3_44100_192'}
    r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert', '--params', json.dumps(body, ensure_ascii=False), '-o', path], capture_output=True, text=True)
    if r.returncode or not os.path.exists(path): sys.exit(f'{name}: ' + (r.stderr or r.stdout)[-400:])
    return path


def decode(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


def f0_track(x, hop=160, win=640):
    """逐帧基频（YIN 的累积均值归一化差分函数）；不够周期性的帧记为 0。
    语音的二次谐波常常很强，单帧取谷会在真音高和高八度之间跳，量出来的起伏会虚高。
    所以分两遍：第一遍在 70–320 Hz 取最深的谷，得到整段的中位音高；第二遍只在中位数上下 0.8 个八度内找。"""
    lo, hi = SR // 320, SR // 70
    frames = []
    for i in range(0, len(x) - win - hi, hop):
        f = x[i: i + win + hi]
        if 20 * np.log10(np.sqrt(np.mean(f[:win] ** 2)) + 1e-9) < -38: frames.append(None); continue
        d = np.array([np.sum((f[:win] - f[L: L + win]) ** 2) for L in range(hi + 1)])
        cm = d[1:] * np.arange(1, hi + 1) / (np.cumsum(d[1:]) + 1e-12)
        frames.append(np.concatenate([[1], cm]))

    def pick(a, b, thr):
        out = []
        for cm in frames:
            if cm is None: out.append(0); continue
            L = a + int(np.argmin(cm[a: b + 1]))
            out.append(SR / L if cm[L] < thr else 0)
        return np.array(out)

    first = pick(lo, hi, 0.2)
    m = np.median(first[first > 0])
    return pick(max(lo, int(SR / (m * 1.75))), min(hi, int(SR / (m / 1.75))), 0.3)


def measure(path, text):
    x = decode(path)
    f0 = f0_track(x)
    v = f0[f0 > 0]
    st = 12 * np.log2(v / np.median(v))
    env = np.array([np.sqrt(np.mean(x[i: i + 160] ** 2)) for i in range(0, len(x) - 160, 160)])
    quiet = 20 * np.log10(env + 1e-9) < -42
    # 停顿：0.15 秒以上的安静段（去掉头尾）
    runs, cur = [], 0
    for q in quiet:
        if q: cur += 1
        else:
            if cur: runs.append(cur)
            cur = 0
    pauses = [r / 100 for r in runs[1:] if r >= 15]
    # 每句的平均音高：按停顿切开
    segs, cur = [], []
    for i, (q, p) in enumerate(zip(quiet[: len(f0)], f0)):
        if q and cur: segs.append(cur); cur = []
        elif p > 0: cur.append(p)
    if cur: segs.append(cur)
    means = [12 * np.log2(np.median(s) / np.median(v)) for s in segs if len(s) > 20]
    chars = len(re.sub(r'[\W_a-zA-Z]+', '', text)) + len(re.findall(r'[A-Za-z]+', text))
    speech = len(x) / SR - sum(pauses)
    return {'median_hz': round(float(np.median(v)), 1), 'range_st': round(float(np.percentile(st, 90) - np.percentile(st, 10)), 1),
            'phrase_sd_st': round(float(np.std(means)), 2), 'cps': round(chars / speech, 2), 'pauses': len(pauses),
            'pause_avg': round(float(np.mean(pauses)), 2) if pauses else 0, 'dur': round(len(x) / SR, 1)}


def main():
    text = open(sys.argv[1]).read().strip()
    names = sys.argv[2:] or list(CANDIDATES)
    os.makedirs('out/audition', exist_ok=True)
    print(f"{'名字':10s} {'中位 Hz':>8s} {'起伏 st':>8s} {'句调差 st':>9s} {'字/秒':>6s} {'停顿':>5s} {'平均停':>6s} {'时长':>6s}")
    for n in names:
        p = synth(n, text)
        m = measure(p, text)
        print(f"{n:10s} {m['median_hz']:8.1f} {m['range_st']:8.1f} {m['phrase_sd_st']:9.2f} {m['cps']:6.2f} {m['pauses']:5d} {m['pause_avg']:6.2f} {m['dur']:6.1f}  {p}")


if __name__ == '__main__':
    main()
