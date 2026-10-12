"""短版旁白：整片旁白一次合成（Eleven v4，一条录音），拿回逐字时间戳。
一条录音里音高、语速、音色前后一致；分段合成时每段都是一次新的“开口”，段与段之间音高会跳（实测 120↔170 Hz），听起来像换了一条录音。
只在配乐段落之间、念完一段后的停顿里下刀（不在句中、不在段内切），每段在时间轴上整段连续播放；
每句在段里的起止时间交给 timeline.mjs，字幕和镜头跟着走。
整条用 Scribe 转写回来核对（v4 偶尔会漏字）；转写核对不了声调，多音字已在 script.mjs 里改写或用 SAY 替换。
结果按（文本、声音、参数）缓存在 out/vo/<lang>/。
用法：python3 tools/tts.py <zh|en>  → out/vo/short-<lang>.json"""
import base64, difflib, hashlib, json, os, re, subprocess, sys, time
import numpy as np

SR = 48000
LANG = sys.argv[1] if len(sys.argv) > 1 else 'zh'


def load():
    out = subprocess.check_output(['node', '-e', "import('./script.mjs').then(m=>console.log(JSON.stringify({S:m.SHORT,N:m.NARRATION,SAY:m.SAY})))"])
    return json.loads(out)


def spoken(line, D):
    text = line[LANG]
    for a, b in D['SAY'].get(LANG, {}).get(line['id'], []): text = text.replace(a, b)
    return text


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
        print('retry', path, r.stderr[-300:]); time.sleep(4 * (attempt + 1))
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
    n = D['N'][LANG]
    lines = [l for l in D['S'] if l.get('zh')]
    # 段内句子之间空一格，段与段之间空一行（v4 会在这里停得长一点）
    text, spans, acts = '', [], []
    for l in lines:
        if acts and acts[-1] != l['act']: text += '\n\n'
        elif text: text += ' '
        if not acts or acts[-1] != l['act']: acts.append(l['act'])
        a = len(text); text += spoken(l, D)
        spans.append((l['id'], l['act'], a, len(text)))
    d = f'out/vo/{LANG}'; os.makedirs(d, exist_ok=True)
    h = hashlib.sha1(json.dumps([text, n], ensure_ascii=False).encode()).hexdigest()[:10]
    p = f'{d}/take-{h}'
    if not os.path.exists(p + '.json'):
        al = synth(n, text, p)
        heard = transcribe(p)
        ratio = difflib.SequenceMatcher(None, norm(text), norm(heard)).ratio()
        json.dump({'text': text, 'spans': spans, 'alignment': al, 'heard': heard, 'match': round(ratio, 3)}, open(p + '.json', 'w'), ensure_ascii=False)
    m = json.load(open(p + '.json'))
    if len(m['alignment']['characters']) != len(m['text']): sys.exit(f"alignment 长度 {len(m['alignment']['characters'])} ≠ 文本 {len(m['text'])}")
    st, en = m['alignment']['character_start_times_seconds'], m['alignment']['character_end_times_seconds']
    x = decode(p + '.mp3')
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    loud = env > 10 ** (-42 / 20)
    # 刀口：段与段之间那段真实静音（< -50 dB）的正中。逐字时间戳和声音能差 0.1～0.2 秒，按它下刀会切掉下一段第一个字的起音
    groups = [[s for s in m['spans'] if s[1] == act] for act in acts]
    bounds = [(st[g[0][2]], en[g[-1][3] - 1]) for g in groups]
    silent = env < 10 ** (-50 / 20)
    cuts = [0.0]
    for k in range(1, len(acts)):
        i0, i1 = int((bounds[k - 1][1] - 0.3) * SR), int((bounds[k][0] + 0.3) * SR)
        run = np.concatenate([[0], silent[i0:i1].astype(np.int8), [0]])
        e = np.flatnonzero(np.diff(run)); starts, ends = e[::2], e[1::2]
        if not len(starts) or (ends - starts).max() < 0.1 * SR: sys.exit(f'{acts[k - 1]} → {acts[k]} 之间找不到 0.1 秒以上的静音')
        j = np.argmax(ends - starts)
        cuts.append((i0 + (starts[j] + ends[j]) / 2) / SR)
    cuts.append(len(x) / SR)
    out = []
    for k, (act, g) in enumerate(zip(acts, groups)):
        lo, hi = cuts[k], cuts[k + 1]
        on = np.flatnonzero(loud[int(lo * SR): int(hi * SR)]) + int(lo * SR)
        a0 = max(lo, on[0] / SR - 0.04); b0 = min(hi, on[-1] / SR + 0.25)
        spans_rel = {lid: [round(max(0.0, st[a] - a0), 3), round(en[b - 1] - a0, 3)] for lid, _, a, b in g}
        spans_rel[g[0][0]][0] = 0.0
        out.append({'act': act, 'file': p + '.mp3', 'a': round(a0, 3), 'dur': round(b0 - a0, 3), 'lines': spans_rel})
        print(f'{act:9s} {a0:6.2f}–{b0:6.2f}s  {b0 - a0:5.2f}s' + (f'  刀口 {hi:6.2f}s' if k + 1 < len(acts) else ''))
    flag = '  ⚠ 核对' if m['match'] < 0.9 else ''
    print(f"整条 {len(x) / SR:.1f}s · 转写吻合 {m['match']:.2f}{flag}")
    if flag: print('      写：', m['text']); print('      听：', m['heard'])
    json.dump(out, open(f'out/vo/short-{LANG}.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
