"""ElevenLabs 旁白：经已登录的 elevenlabs CLI 逐句合成（带上下句作语境），按内容缓存，测时长，
写 out/vo/<lang>/manifest.json；随后自动修剪静音（vo_trim）并控制语速（vo_pace）。
在片子目录里运行：./run.sh <片名> tts [语言]
声音、模型与参数来自 film.json 的 narration.<lang>。"""
import hashlib, json, os, subprocess, sys, time

ROOT = os.getcwd()  # 片子目录
HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG = json.load(open(os.path.join(ROOT, 'film.json')))
LANGS = CONFIG['languages']
NAR = CONFIG['narration']
VOICE = {l: NAR[l]['voice'] for l in LANGS}
MODEL = {l: NAR[l].get('model', 'eleven_v4') for l in LANGS}
SETTINGS = {l: NAR[l].get('settings', {}) for l in LANGS}


def cli_tts(voice, body, out):
    params = dict(body, voice_id=voice, output_format='mp3_44100_192')
    r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert', '--params', json.dumps(params, ensure_ascii=False), '-o', out],
                       capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(out):
        raise RuntimeError(r.stderr[-400:] or r.stdout[-400:])


def lines():
    out = subprocess.check_output(['node', '-e', "import('./script.mjs').then(m=>console.log(JSON.stringify(m.LINES)))"], cwd=ROOT)
    return json.loads(out)


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).strip())


def synth(lang, force=False):
    L = LANGS.index(lang)
    d = os.path.join(ROOT, 'out', 'vo', lang)
    os.makedirs(d, exist_ok=True)
    mpath = os.path.join(d, 'manifest.json')
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}
    items = list(lines().items())
    for i, (lid, texts) in enumerate(items):
        text = texts[L]
        h = hashlib.sha1(json.dumps([text, VOICE[lang], MODEL[lang], SETTINGS[lang]]).encode()).hexdigest()[:12]
        wav = os.path.join(d, f'{lid}.wav')
        if not force and manifest.get(lid, {}).get('hash') == h and os.path.exists(os.path.join(d, f'{lid}.mp3')):
            continue
        body = {'text': text, 'model_id': MODEL[lang], 'voice_settings': SETTINGS[lang]}
        if NAR[lang].get('languageCode'): body['language_code'] = NAR[lang]['languageCode']
        # 上下文让语调连贯
        if i > 0: body['previous_text'] = items[i - 1][1][L]
        if i < len(items) - 1: body['next_text'] = items[i + 1][1][L]
        raw = os.path.join(d, f'{lid}.mp3')
        for attempt in range(4):
            try:
                cli_tts(VOICE[lang], body, raw)
                break
            except RuntimeError as e:
                print('retry', lid, e); time.sleep(5 * (attempt + 1))
        else:
            sys.exit(f'failed {lid}')
        manifest[lid] = {'hash': h, 'duration': round(duration(raw), 3), 'text': text}
        json.dump(manifest, open(mpath, 'w'), ensure_ascii=False, indent=1)
        print(lang, lid, manifest[lid]['duration'], 's', text)
    # 首尾静音的修剪交给 vo_trim.py（按能量包络，保留余量）
    subprocess.run([sys.executable, os.path.join(HERE, 'vo_trim.py'), lang], cwd=ROOT, check=True)
    # 语速控制：过快的句子放慢到纪录片节奏
    subprocess.run([sys.executable, os.path.join(HERE, 'vo_pace.py'), lang], cwd=ROOT, check=True)


if __name__ == '__main__':
    synth(sys.argv[1], '--force' in sys.argv)
