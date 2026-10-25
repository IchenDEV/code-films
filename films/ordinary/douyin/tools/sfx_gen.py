"""音效库：用 ElevenLabs Sound Effects 生成短音效，缓存在 out/sfx/<名字>.mp3（文本不变就不重复生成）。
每次切画面、每个砸出来的大字都有一个对位的声音（见 tools/mix.py）；音效只截短、不循环，所以生成得够长。
用法：python3 tools/sfx_gen.py"""
import hashlib, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor

SFX = {
    'whoosh':  ('Soft fast airy whoosh, cinematic cut transition, subtle', 0.8),
    'slam':    ('Heavy stone slab dropped on the ground, deep cinematic impact with a short low boom tail', 2.0),
    'hit':     ('Deep soft cinematic hit, warm low thump with a short shimmer tail', 1.5),
    'shimmer': ('Faint high crystalline shimmer, a single distant star twinkling, airy', 2.0),
    'riser':   ('Short dark cinematic riser building tension, strings and air', 2.0),
    'pulse':   ('Single deep electronic heartbeat pulse, modern and clean', 1.0),
    'pop':     ('Soft warm UI pop, clean', 0.5),
    'bell':    ('One deep ancient bronze temple bell strike with a long warm decay', 4.0),
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
