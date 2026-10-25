"""旁白：整条一次合成（Eleven v4，一条录音），拿回逐字时间戳。
一条录音里音高、语速、音色前后一致；分段合成时每段都是一次新的“开口”，段与段之间音高会跳。
只在段落之间、念完一段后的真实静音里下刀，每段在时间轴上整段连续播放。
每句输出“字幕上每个字被念出的时刻”（ct），字幕逐字高亮、画面关键词（script.mjs 的 k）都靠它对位。
SAY 的读音替换只发给合成，字幕不变：替换前后长度不同时，按比例把时间映射回字幕上的字。
整条用 Scribe 转写回来核对（v4 偶尔会漏字）；转写核对不了声调，多音字已在 script.mjs 里改写或用 SAY 替换。
结果按（文本、声音、参数）缓存在 out/vo/zh/。
语气标签（script.mjs 的 tag，比如 [sighs]）只发给合成、放在这句前面，不进字幕。
用法：python3 tools/tts.py [--model=<模型>] [--out=<后缀>]  → out/vo/zh<后缀>.json
  --model 换模型试听（比如 eleven_v3_conversational），--out 让试听结果不覆盖正式的那份"""
import base64, difflib, hashlib, json, os, re, subprocess, sys, time
import numpy as np

SR = 48000
LANG = 'zh'
OPT = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)


def load():
    out = subprocess.check_output(['node', '-e', "import('./script.mjs').then(m=>console.log(JSON.stringify({L:m.LINES,SAY:m.SAY})))"])
    d = json.loads(out)
    d['N'] = json.load(open('film.json'))['narration']
    return d


def spoken(shown, say):
    """返回（发给合成的文本，字幕上每个字在合成文本里的位置）。"""
    out, pos, i = '', [], 0
    while i < len(shown):
        hit = next(((a, b) for a, b in say if shown.startswith(a, i)), None)
        if hit:
            a, b = hit
            for j in range(len(a)): pos.append(len(out) + j * len(b) / len(a))
            out += b; i += len(a)
        else:
            pos.append(len(out)); out += shown[i]; i += 1
    return out, pos


def synth(n, text, path):
    body = {'text': text, 'model_id': n['model'], 'voice_id': n['voice'], 'voice_settings': n['settings'],
            'output_format': 'mp3_44100_192', 'language_code': n['languageCode']}
    for attempt in range(4):
        r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert_with_timestamps', '--params', json.dumps(body, ensure_ascii=False), '--format', 'json'],
                           capture_output=True, text=True)
        if r.returncode == 0:
            d = json.loads(r.stdout)
            open(path + '.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
            return d['alignment']
        print('retry', path, r.stderr[-400:] or r.stdout[-400:]); time.sleep(4 * (attempt + 1))
    sys.exit('failed ' + path)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(float) / 32768


def norm(s):
    return re.sub(r'[\W_]+', '', s.lower())


def transcribe(path):
    r = subprocess.run(['elevenlabs', 'speech-to-text', 'convert', '--model-id', 'scribe_v2', '--file', path + '.mp3', '--format', 'json'],
                       capture_output=True, text=True)
    if r.returncode != 0: sys.exit('transcribe failed: ' + r.stderr[-300:])
    return json.loads(r.stdout)['text']


def main():
    D = load()
    n = dict(D['N'][LANG])
    if 'model' in OPT:
        n['model'] = OPT['model']
        if n['model'].startswith('eleven_v3'): n['settings'] = {k: v for k, v in n['settings'].items() if k != 'speed'}
    say = D['SAY'].get(LANG, [])
    lines = [l for l in D['L'] if l.get('zh')]
    # 段内句子之间空一格，段与段之间空一行（v4 会在这里停得长一点，好下刀）
    text, spans, acts = '', [], []
    for l in lines:
        if acts and acts[-1] != l['act']: text += '\n\n'
        elif text: text += ' '
        if not acts or acts[-1] != l['act']: acts.append(l['act'])
        s, pos = spoken(l[LANG], say)
        if l.get('tag'): text += l['tag'] + ' '
        a = len(text); text += s
        spans.append({'id': l['id'], 'act': l['act'], 'a': a, 'b': len(text), 'pos': [a + p for p in pos]})
    d = f'out/vo/{LANG}'; os.makedirs(d, exist_ok=True)
    h = hashlib.sha1(json.dumps([text, n], ensure_ascii=False).encode()).hexdigest()[:10]
    p = f'{d}/take-{h}'
    if not os.path.exists(p + '.json'):
        print(f'synthesizing {LANG}: {len(text)} chars')
        al = synth(n, text, p)
        heard = transcribe(p)
        ratio = difflib.SequenceMatcher(None, norm(re.sub(r'\[[a-z ]+\]', '', text)), norm(heard)).ratio()
        json.dump({'text': text, 'alignment': al, 'heard': heard, 'match': round(ratio, 3)}, open(p + '.json', 'w'), ensure_ascii=False)
    m = json.load(open(p + '.json'))
    if m['text'] != text: sys.exit('缓存文本与当前脚本不符')
    if len(m['alignment']['characters']) != len(text): sys.exit(f"alignment 长度 {len(m['alignment']['characters'])} ≠ 文本 {len(text)}")
    st, en = m['alignment']['character_start_times_seconds'], m['alignment']['character_end_times_seconds']
    at = lambda x: st[min(int(x), len(st) - 1)] + (x - int(x)) * (en[min(int(x), len(st) - 1)] - st[min(int(x), len(st) - 1)])
    x = decode(p + '.mp3')
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    loud = env > 10 ** (-42 / 20)
    silent = env < 10 ** (-45 / 20)
    # 刀口：段与段之间那段真实静音（< -45 dB；Pangge 的停顿底噪在 -45～-50 dB）的正中。逐字时间戳和声音能差 0.1～0.2 秒，按它下刀会切掉下一段第一个字的起音
    groups = [[s for s in spans if s['act'] == act] for act in acts]
    bounds = [(st[g[0]['a']], en[g[-1]['b'] - 1]) for g in groups]
    cuts = [0.0]
    for k in range(1, len(acts)):
        i0, i1 = int((bounds[k - 1][1] - 0.3) * SR), int((bounds[k][0] + 0.3) * SR)
        run = np.concatenate([[0], silent[i0:i1].astype(np.int8), [0]])
        e = np.flatnonzero(np.diff(run)); starts, ends = e[::2], e[1::2]
        if not len(starts) or (ends - starts).max() < 0.08 * SR: sys.exit(f'{acts[k - 1]} → {acts[k]} 之间找不到 0.08 秒以上的静音')
        j = np.argmax(ends - starts)
        cuts.append((i0 + (starts[j] + ends[j]) / 2) / SR)
    cuts.append(len(x) / SR)
    out = []
    for k, (act, g) in enumerate(zip(acts, groups)):
        lo, hi = cuts[k], cuts[k + 1]
        on = np.flatnonzero(loud[int(lo * SR): int(hi * SR)]) + int(lo * SR)
        a0 = max(lo, on[0] / SR - 0.04); b0 = min(hi, on[-1] / SR + 0.25)
        L = {}
        for s in g:
            ct = [round(max(0.0, at(q) - a0), 3) for q in s['pos']]
            L[s['id']] = {'a': round(max(0.0, st[s['a']] - a0), 3), 'b': round(en[s['b'] - 1] - a0, 3), 'ct': ct}
        L[g[0]['id']]['a'] = 0.0
        out.append({'act': act, 'file': p + '.mp3', 'a': round(a0, 3), 'dur': round(b0 - a0, 3), 'lines': L})
        print(f'{act:9s} {a0:7.2f}–{b0:7.2f}s  {b0 - a0:6.2f}s' + (f'  刀口 {hi:7.2f}s' if k + 1 < len(acts) else ''))
    flag = '  ⚠ 核对' if m['match'] < 0.92 else ''
    print(f"{LANG} 整条 {len(x) / SR:.1f}s · 转写吻合 {m['match']:.3f}{flag}")
    if flag or '-v' in sys.argv: print('      写：', m['text']); print('      听：', m['heard'])
    json.dump(out, open(f"out/vo/{LANG}{OPT.get('out', '')}.json", 'w'))


if __name__ == '__main__':
    main()
