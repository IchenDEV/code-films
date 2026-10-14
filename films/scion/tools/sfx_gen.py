"""音效库：用 ElevenLabs Sound Effects 生成短音效，缓存在 out/sfx/<名字>.mp3（文本不变就不重复生成）。
每个转场、每个被念出的关键词都有一个对位的声音（见 tools/mix.py 的 CUES）；音效只截短、不循环，所以生成得够长。
用法：python3 tools/sfx_gen.py"""
import hashlib, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor

SFX = {
    'whoosh':   ('Fast clean airy swish whoosh transition, modern motion graphics', 0.8),
    'flash':    ('Bright shimmering reveal swell with a soft airy impact, modern', 2.0),
    'slam':     ('Punchy deep cinematic hit with a short sub drop, modern motion graphics number slam', 1.5),
    'stamp':    ('Heavy rubber stamp thud on a wooden desk, punchy', 0.8),
    'pop':      ('Soft bubbly UI pop, friendly and clean', 0.5),
    'click':    ('Crisp soft UI click tick, modern interface', 0.5),
    'tick':     ('Fast mechanical counter ticking up rapidly, digital slot counter, short', 1.6),
    'alarm':    ('Soft low warning alarm pulse, two quick beeps, sci-fi interface, not harsh', 1.6),
    'rush':     ('Massive rushing data stream whoosh, digital flood sweeping past', 2.6),
    'hum':      ('Server room hum swelling up with fans spinning faster, electric', 3.0),
    'sprout':   ('Magical plant sprouting growth sound with a gentle sparkling chime', 1.6),
    'typing':   ('Fast quiet typing on a laptop keyboard, close', 2.0),
    'crumble':  ('Stack of plastic blocks toppling and clattering down, light and playful', 1.5),
    'success':  ('Positive bright two-note UI success chime, clean', 1.0),
    'error':    ('Short digital error buzz, glitchy, soft', 0.8),
    'riser':    ('Short tense synth riser building up, cinematic', 2.0),
    'question': ('Deep mysterious low boom with a long airy tail', 3.0),
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
