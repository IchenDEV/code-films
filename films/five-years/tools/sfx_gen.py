"""音效库：用 ElevenLabs Sound Effects 生成一批短音效，缓存在 out/sfx/<名字>.mp3（文本不变就不重复生成）。
用法：python3 tools/sfx_gen.py"""
import hashlib, json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

SFX = {
    'impact':    ('Deep cinematic trailer impact hit, huge sub-bass boom with a short punchy tail', 2.5),
    'hit':       ('Short punchy cinematic hit, tight low thump with a bright transient', 1.2),
    'whoosh':    ('Fast airy whoosh transition, clean swish passing by', 0.9),
    'whip':      ('Quick whip pan swoosh, very short and sharp', 0.6),
    'riser':     ('Short cinematic tension riser, white noise and synth swelling up quickly', 2.0),
    'glitch':    ('Digital glitch stutter burst, data corruption, short', 0.8),
    'rewind':    ('VHS tape rewinding fast, reverse warble with mechanical whir', 2.4),
    'typing':    ('Fast typing on a mechanical keyboard, crisp clicky keys, close up', 3.0),
    'tabkey':    ('One heavy satisfying keyboard key slam with a deep thud', 0.7),
    'ping':      ('Soft modern UI notification ping', 0.5),
    'pings':     ('Many overlapping app notification pings and message alerts piling up, chaotic and stressful', 4.0),
    'heartbeat': ('Slow deep heartbeat thumps, tense, cinematic', 3.5),
    'shimmer':   ('Bright digital sparkle shimmer, magical data spawn, short', 1.2),
    'pop':       ('Soft clean digital bubble pop, UI', 0.5),
    'stamp':     ('Rubber stamp slammed onto paper on a wooden desk, firm thud', 0.7),
    'scratch':   ('Vinyl record scratch stop', 0.8),
    'error':     ('Short low digital error buzz, UI', 0.6),
    'success':   ('Bright short success chime, two rising notes, UI', 0.9),
    'crack':     ('Sharp glass crack and small shatter', 1.0),
    'swell':     ('Warm airy cinematic swell, soft pad rising gently', 3.0),
    'tick':      ('Single crisp UI tick blip', 0.5),
    'cash':      ('Fast spinning mechanical counter ticking, cash register meter running', 2.0),
}


def gen(item):
    name, (text, dur) = item
    h = hashlib.sha1(json.dumps([text, dur]).encode()).hexdigest()[:8]
    path = f'out/sfx/{name}.mp3'
    tag = f'out/sfx/{name}.hash'
    if os.path.exists(path) and os.path.exists(tag) and open(tag).read() == h: return name, 'cached'
    body = {'text': text, 'duration_seconds': dur, 'prompt_influence': 0.6, 'model_id': 'eleven_text_to_sound_v2'}
    r = subprocess.run(['elevenlabs', 'text-to-sound-effects', 'convert', '--json', '-', '-o', path], input=json.dumps(body), capture_output=True, text=True)
    if r.returncode or not os.path.exists(path): return name, 'FAILED ' + (r.stderr or r.stdout)[-300:]
    open(tag, 'w').write(h)
    return name, 'new'


os.makedirs('out/sfx', exist_ok=True)
with ThreadPoolExecutor(4) as ex:
    for name, st in ex.map(gen, SFX.items()): print(f'{name:10s} {st}')
