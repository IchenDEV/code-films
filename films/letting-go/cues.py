"""逐字对齐几句关键旁白，记下画面要对位的时刻 → timing/cues.json（入库，离线也能重排时间轴）。
现在只有一个：第七段末句里“更好的那一笔”的“更”/“better”，墨笔在这一刻挥出。
在片子目录里运行：python3 cues.py [语言...]（需要已登录的 elevenlabs CLI；音频与文本不变时跳过）"""
import hashlib, json, os, subprocess, sys

CUES = {'sweep': ('g3', {'zh': '更好', 'en': 'better'})}
LANGS = sys.argv[1:] or json.load(open('film.json'))['languages']
path = 'timing/cues.json'
data = json.load(open(path)) if os.path.exists(path) else {}
lines = json.loads(subprocess.check_output(['node', '-e', "import('./script.mjs').then(m=>console.log(JSON.stringify(m.LINES)))"]))
L = json.load(open('film.json'))['languages']
for lang in LANGS:
    for name, (lid, words) in CUES.items():
        wav = f'out/vo/{lang}/{lid}.wav'
        text = lines[lid][L.index(lang)]
        h = hashlib.sha1(open(wav, 'rb').read() + text.encode()).hexdigest()[:12]
        if data.get(lang, {}).get(name, {}).get('hash') == h:
            continue
        r = subprocess.run(['elevenlabs', 'forced-alignment', 'create', '--file', wav, '--text', text, '--format', 'json'], capture_output=True, text=True, check=True)
        chars = json.loads(r.stdout)['characters']
        joined = ''.join(c['text'] for c in chars)
        i = joined.find(words[lang])
        if i < 0: sys.exit(f'{lang} {lid}: 找不到“{words[lang]}”')
        t = round(chars[i]['start'], 3)
        data.setdefault(lang, {})[name] = {'line': lid, 'at': t, 'hash': h}
        print(lang, name, lid, f'+{t:.2f}s', words[lang])
os.makedirs('timing', exist_ok=True)
json.dump(data, open(path, 'w'), ensure_ascii=False, indent=1)
