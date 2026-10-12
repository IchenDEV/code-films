"""音效库：用 ElevenLabs Sound Effects 生成少量短音效，缓存在 out/sfx/<名字>.mp3（文本不变就不重复生成）。
这部片子以音乐为主，音效只点在几个关键动作上。
用法：python3 tools/sfx_gen.py"""
import hashlib, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor

SFX = {
    'bubble':  ('Soft friendly chat message pop, gentle bubbly UI sound', 0.5),
    'reply':   ('Gentle chat reply notification, two soft warm tones', 0.7),
    'shutter': ('Old metal rolling shop shutter rattling down, a little distant, short', 1.6),
    'boop':    ('Cute comedic deflating boop, short cartoon sound, soft', 0.8),
    'keys':    ('Quiet fast typing on a laptop keyboard at night, close', 3.0),
    'thunder': ('Distant rolling thunder, deep soft rumble, cinematic', 3.5),
    'whoosh':  ('Soft airy whoosh transition, gentle', 1.0),
    'boom':    ('Warm deep soft cinematic boom with a gentle shimmering tail', 3.0),
    'drip':    ('Single water droplet falling into a calm sea at night, clear plip and soft ripple', 1.0),
    'sink':    ('Deep muffled underwater whoosh, an object slowly sinking into deep water', 3.0),
    'wind':    ('Soft cold mountain wind at dawn, airy and calm', 4.0),
    'chime':   ('Single soft bright bell chime, gentle and magical', 1.2),
    'door':    ('Heavy old wooden door creaking open slowly', 2.5),
    'swell':   ('Bright cinematic light swell, airy shimmer rising', 3.0),
    'impact':  ('Huge deep cinematic sub boom impact with a long tail', 4.0),
    'stroke':  ('Three slow single keystrokes on a mechanical keyboard in a quiet room, one key at a time', 2.5),
    'pen':     ('Pen scribbling quickly on paper, short', 1.4),
    'rumble':  ('Low slow earth crack, ground splitting apart, deep rumble', 2.5),
    'city':    ('Distant night city ambience, soft traffic hum, peaceful', 6.0),
}


def gen(item):
    name, (text, dur) = item
    h = hashlib.sha1(json.dumps([text, dur]).encode()).hexdigest()[:8]
    path, tag = f'out/sfx/{name}.mp3', f'out/sfx/{name}.hash'
    if os.path.exists(path) and os.path.exists(tag) and open(tag).read() == h: return name, 'cached'
    body = {'text': text, 'duration_seconds': dur, 'prompt_influence': 0.6, 'model_id': 'eleven_text_to_sound_v2'}
    for _ in range(3):
        r = subprocess.run(['elevenlabs', 'text-to-sound-effects', 'convert', '--json', '-', '-o', path], input=json.dumps(body), capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(path): break
    else:
        return name, 'FAILED ' + (r.stderr or r.stdout)[-300:]
    open(tag, 'w').write(h)
    return name, 'new'


os.makedirs('out/sfx', exist_ok=True)
with ThreadPoolExecutor(2) as ex:  # Creator 套餐最多 2 个并发请求
    for name, st in ex.map(gen, SFX.items()): print(f'{name:8s} {st}')
