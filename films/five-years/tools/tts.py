"""整段旁白合成：每个 beat 一次 Eleven v4 请求（带 [语气标签] 和上下文），同时拿回逐字时间戳。
结果按（文本、声音、模型、参数）缓存在 out/vo/<lang>/，改一段只重合成那一段。
然后修剪首尾静音，并用 Scribe 转写回来核对，标出可能念错的段落。
用法：python3 tools/tts.py <cut> <lang> [variant…]   例：python3 tools/tts.py long zh bilibili"""
import base64, difflib, hashlib, json, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
import numpy as np

CFG = json.load(open('film.json'))
SR = 48000


def load_script():
    out = subprocess.check_output(['node', '-e', "import('./script.mjs').then(m=>console.log(JSON.stringify({B:m.BEATS,V:m.VARIANTS,SAY:m.SAY})))"])
    return json.loads(out)


def parse(text):
    """去掉 {cue}，记下每个 cue 在发送文本里的字符位置；[tag] 保留给合成。"""
    cues, out = {}, ''
    for part in re.split(r'(\{[a-z0-9_]+\})', text):
        if re.fullmatch(r'\{[a-z0-9_]+\}', part): cues[part[1:-1]] = len(out)
        else: out += part
    return out, cues


def plain(text):
    return re.sub(r'\s*\[[^\]]*\]\s*', ' ', re.sub(r'\{[a-z0-9_]+\}', '', text)).strip()


def say(sent, rules):
    """读音替换：等长逐字替换，只影响合成，不影响字幕（时间戳按下标一一对应）。"""
    for a, b in rules:
        assert len(a) == len(b), (a, b)
        sent = sent.replace(a, b)
    return sent


def key(lang, sent):
    n = CFG['narration'][lang]
    return hashlib.sha1(json.dumps([sent, n['voice'], n['model'], n['settings']], ensure_ascii=False).encode()).hexdigest()[:12]


def synth(lang, sent, prev, nxt, path):
    n = CFG['narration'][lang]
    body = {'text': sent, 'model_id': n['model'], 'voice_id': n['voice'], 'voice_settings': n['settings'],
            'output_format': 'mp3_44100_192', 'language_code': n.get('languageCode', lang)}
    if prev: body['previous_text'] = prev
    if nxt: body['next_text'] = nxt
    for attempt in range(4):
        r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert_with_timestamps', '--params', json.dumps(body, ensure_ascii=False), '--format', 'json'],
                           capture_output=True, text=True)
        if r.returncode == 0:
            d = json.loads(r.stdout)
            open(path + '.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
            return d['alignment']
        print('retry', path, r.stderr[-300:]); time.sleep(4 * (attempt + 1))
    sys.exit('failed ' + path)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(float) / 32768


def trim(path):
    """按能量包络找首尾（-42 dB），留 40 ms 起音余量和 180 ms 尾音。"""
    x = decode(path + '.mp3')
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    on = np.where(env > 10 ** (-42 / 20))[0]
    a = max(0, on[0] - int(0.04 * SR)); b = min(len(x), on[-1] + int(0.18 * SR))
    return a / SR, (b - a) / SR


def norm(s):
    return re.sub(r'[\W_]+', '', s.lower())


def transcribe(path):
    r = subprocess.run(['elevenlabs', 'speech-to-text', 'convert', '--model-id', 'scribe_v2', '--file', path + '.mp3', '--format', 'json'],
                       capture_output=True, text=True)
    return json.loads(r.stdout)['text'] if r.returncode == 0 else ''


def jobs_for(cut, lang, variants, S):
    beats = [b for b in S['B'][cut] if not b.get('silent')]
    texts = {}
    for v in [None] + variants:
        ov = (S['V'][v].get('override') or {}) if v else {}
        for i, b in enumerate(beats):
            t = ov.get(b['id'], {}).get(lang, b[lang])
            prev = plain(beats[i - 1][lang]) if i else ''
            nxt = plain(beats[i + 1][lang]) if i + 1 < len(beats) else ''
            texts[(b['id'], t)] = (prev, nxt)
    return texts


def main():
    cut, lang, variants = sys.argv[1], sys.argv[2], sys.argv[3:]
    S = load_script()
    d = f'out/vo/{lang}'; os.makedirs(d, exist_ok=True)

    def one(item):
        (bid, text), (prev, nxt) = item
        shown, cues = parse(text)
        sent = say(shown, S.get('SAY', {}).get(lang, []))
        h = key(lang, sent)
        p = f'{d}/{bid}-{h}'
        if os.path.exists(p + '.json'): return bid, p, False
        al = synth(lang, sent, prev, nxt, p)
        a, dur = trim(p)
        heard = transcribe(p)
        ratio = difflib.SequenceMatcher(None, norm(plain(text)), norm(heard)).ratio()
        json.dump({'id': bid, 'text': text, 'sent': sent, 'shown': shown, 'cues': cues, 'alignment': al, 'trimStart': round(a, 3), 'dur': round(dur, 3),
                   'heard': heard, 'match': round(ratio, 3)}, open(p + '.json', 'w'), ensure_ascii=False, indent=0)
        return bid, p, True

    with ThreadPoolExecutor(3) as ex:
        for bid, p, new in ex.map(one, jobs_for(cut, lang, variants, S).items()):
            m = json.load(open(p + '.json'))
            units = len(norm(plain(m['text']))) if lang == 'zh' else len(plain(m['text']).split())
            flag = '  ⚠ 核对' if m['match'] < 0.93 else ''
            print(f"{'new ' if new else '    '}{bid:5s} {m['dur']:5.2f}s {units / m['dur']:4.2f}/s match {m['match']:.2f}{flag}")
            if flag: print('      写：', plain(m['text'])); print('      听：', m['heard'])


if __name__ == '__main__':
    main()
