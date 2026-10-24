"""音效库：用 ElevenLabs Sound Effects 生成短音效，缓存在 out/sfx/<名字>.mp3（文本不变就不重复生成）。
每个转场、每个被念出的关键词都有一个对位的声音（见 tools/mix.py 的 CUES）；音效只截短、不循环，所以生成得够长。
用法：python3 tools/sfx_gen.py"""
import hashlib, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor

SFX = {
    'whoosh':   ('Fast clean airy swish whoosh transition, modern motion graphics', 0.8),
    'flash':    ('Bright warm shimmering reveal swell with a soft airy impact, modern', 2.0),
    'slam':     ('Punchy deep cinematic hit with a short sub drop, modern motion graphics title slam', 1.5),
    'stamp':    ('Heavy rubber stamp thud on a wooden desk, punchy', 0.8),
    'pop':      ('Soft bubbly UI pop, friendly and clean', 0.5),
    'click':    ('Crisp soft UI click tick, modern interface', 0.5),
    'deal':     ('Quick flick of a playing card being dealt across a table, crisp', 0.5),
    'alarm':    ('Urgent but not harsh warning alarm pulse, two rising beeps, sci-fi interface', 1.6),
    'zap':      ('Fast electric nerve signal zap shooting upward, bright crackle', 1.0),
    'breaker':  ('Heavy electrical circuit breaker snapping off with a clunk', 0.8),
    'success':  ('Positive bright two-note UI success chime, clean', 1.0),
    'error':    ('Short digital error buzz, glitchy, soft', 0.8),
    'riser':    ('Short tense synth riser building up, cinematic', 2.0),
    'question': ('Deep mysterious low boom with a long airy tail', 3.0),
    'sparkle':  ('Magical soft sparkle shimmer, something new appears, clean', 1.2),
    'snap':     ('Several taut strings snapping in quick succession, crisp, then silence', 1.0),
    'fire':     ('Small fire bursting into flame with a whoosh and crackle', 1.5),
    'spray':    ('Fire extinguisher short spray burst, hiss', 1.2),
    'spin':     ('Comedic cartoon spinning dizzy whirl, accelerating, playful', 2.5),
    'bonk':     ('Small cartoon bonk of a little robot bumping its head on a rock, cute', 0.6),
    'gear':     ('Mechanical gears engaging and turning smoothly, satisfying clockwork clunk', 1.5),
    'lever':    ('Big heavy metal lever pulled down with a satisfying clunk', 0.9),
    'book':     ('A heavy hardcover book set down on a wooden desk, soft thud', 0.7),
    'crumble':  ('Stack of cardboard boxes toppling and tumbling down, light and playful', 1.5),
    'typing':   ('Fast quiet typing on a laptop keyboard, close', 2.0),
    'scan':     ('Futuristic scanner beam sweeping, short electronic scan then confirmation blip', 1.2),
    'warm':     ('Warm gentle magical chime swell, hopeful, soft bells and pad', 3.0),
    'heartbeat': ('Single deep soft heartbeat thump, cinematic', 0.8),
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
