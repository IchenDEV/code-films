"""旁白：经已登录的 elevenlabs CLI 逐句合成（带上下句语境），按内容缓存；
修剪首尾静音，过快的句子用保持音高的变速放慢到上限（只放慢，不加快）。
用法：python3 tts.py [--force]"""
import hashlib, json, os, re, subprocess, sys, time
import numpy as np
from scipy.io import wavfile

CONFIG = json.load(open('film.json'))['narration']['zh']
VOICE = CONFIG['voice']  # Haoran
MODEL = CONFIG['model']
SETTINGS = CONFIG['settings']
PACE_CAP = CONFIG['paceCap']
SR = 48000
D = 'out/vo'
HOT = {'h5', 'p6', 'g6', 'k7', 'r2', 'r4', 'z4', 'z5'}  # 高潮句


def units(text):
    t = re.sub(r'[，。、：；！？“”《》—\s]', '', text)
    return len(re.sub(r'[A-Za-z]+', lambda m: '*' * min(2, len(m.group())), t))


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))


def trim(mp3, wav):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    on = np.where(env > 10 ** (-42 / 20))[0]
    a = max(0, on[0] - int(0.04 * SR)); b = min(len(x), on[-1] + int(0.2 * SR))
    y = x[a:b].copy()
    y[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR)); y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    wavfile.write(wav, SR, (y * 32767).astype(np.int16))


def main(force):
    os.makedirs(D, exist_ok=True)
    os.makedirs('timing', exist_ok=True)
    script = json.load(open('script.json'))
    items = [l for a in script['acts'] for l in a['lines']]
    mpath = 'timing/manifest.json'
    man = json.load(open(mpath)) if os.path.exists(mpath) else {}
    for i, l in enumerate(items):
        h = hashlib.sha1(json.dumps([l['text'], 'warm-v2', l['id'] in HOT, VOICE, MODEL, SETTINGS]).encode()).hexdigest()[:12]
        mp3, wav = f'{D}/{l["id"]}.mp3', f'{D}/{l["id"]}.wav'
        if not force and man.get(l['id'], {}).get('hash') == h and os.path.exists(mp3) and os.path.exists(wav):
            continue
        tag = '[confident] ' if l['id'] in HOT else '[warmly] '
        body = {'text': tag + l['text'], 'model_id': MODEL, 'voice_settings': SETTINGS, 'language_code': 'zh',
                'voice_id': VOICE, 'output_format': 'mp3_44100_192'}
        if i > 0: body['previous_text'] = items[i - 1]['text']
        if i < len(items) - 1: body['next_text'] = items[i + 1]['text']
        for attempt in range(4):
            r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert', '--params', json.dumps(body, ensure_ascii=False), '-o', mp3],
                               capture_output=True, text=True)
            if r.returncode == 0 and os.path.exists(mp3) and os.path.exists(wav): break
            print('retry', l['id'], (r.stderr or r.stdout)[-300:]); time.sleep(5 * (attempt + 1))
        else:
            sys.exit(f'failed {l["id"]}')
        trim(mp3, wav)
        d = dur(wav); rate = units(l['text']) / d
        if rate > PACE_CAP:
            tempo = max(0.86, PACE_CAP / rate)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', f'atempo={tempo:.3f}', '-ar', str(SR), '/tmp/paced.wav'], check=True)
            os.replace('/tmp/paced.wav', wav); d = dur(wav)
        man[l['id']] = {'hash': h, 'duration': round(d, 3), 'text': l['text'], 'rate': round(units(l['text']) / d, 2)}
        json.dump(man, open(mpath, 'w'), ensure_ascii=False, indent=1)
        print(l['id'], man[l['id']]['duration'], 's', man[l['id']]['rate'], '字/秒', l['text'])
    print('total speech', round(sum(v['duration'] for v in man.values()), 1), 's')


if __name__ == '__main__':
    main('--force' in sys.argv)
