"""试音：几位候选声音读同一段有语气词的旁白，测语速、音高、起伏，并转写核对。
python3 tools/audition.py → out/audition/<lang>_<名字>.mp3 + 汇总表"""
import base64, json, os, re, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'engine', 'pipeline'))
from vo_check import f0

PASSAGE = {
    'zh': '[curious] 你看到的每一个光点，都是一个正在写代码的 AI。而指挥它们的……也是 AI。[laughs] 好家伙。可就在五年前，这里只有一个光标。'
          '[thoughtful] 嗯，问题来了：两个 Agent 还好，十几个呢？哪个先做、谁依赖谁、冲突怎么合……说白了，AI 能同时干很多活，人却没法同时指挥那么多 AI。',
    'en': '[curious] Every one of these lights is an AI, writing code. And the thing directing them? Also an AI. [laughs] Yeah. '
          'But five years ago, there was just... a cursor. [thoughtful] So here\'s the problem. Two agents? Fine. Ten? '
          'Which one goes first, who depends on whom, how do you merge the conflicts... AI could do a lot of work at once. We just couldn\'t direct that much AI at once.',
}
VOICES = {
    'zh': {'Pangge': 'hFamrilbAE6WDMtWgKvu', 'Rippel': 'nss5M23ZSzhG3Tn0b7wN', 'QiaoFeng': 'ZJsn5HnrE3eUbep2ia8D', 'XingheJiang': 'lt7GBaCoAHWbT7JSZ5Xs'},
    'en': {'MichaelDan': 'QngvLQR8bsLR5bzoa6Vv', 'JerryB': 'J9NvviOEdVm6E7Hwdpdj', 'JonCatalyst': 'dSByRdUbTGloB7TFA1qD'},
}
SET = {'zh': {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.35, 'speed': 1.08},
       'en': {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.35, 'speed': 1.03}}

def plain(t): return re.sub(r'\[[^\]]*\]\s*', '', t)

os.makedirs('out/audition', exist_ok=True)
for lang, vs in VOICES.items():
    for name, vid in vs.items():
        mp3 = f'out/audition/{lang}_{name}.mp3'
        if not os.path.exists(mp3):
            body = {'text': PASSAGE[lang], 'model_id': 'eleven_v4', 'voice_id': vid, 'voice_settings': SET[lang], 'output_format': 'mp3_44100_192'}
            if lang == 'zh': body['language_code'] = 'zh'
            r = subprocess.run(['elevenlabs', 'text-to-speech', 'convert', '--params', json.dumps(body, ensure_ascii=False), '-o', mp3], capture_output=True, text=True)
            if r.returncode: print(name, 'FAILED', r.stderr[-300:]); continue
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp3, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).astype(float) / 32768
        d = len(x) / 48000
        p = f0(x, 48000)
        st = float(np.std(12 * np.log2(p / np.median(p))))
        n = len(re.sub(r'[，。、：；！？…\s]', '', plain(PASSAGE[lang]))) if lang == 'zh' else len(plain(PASSAGE[lang]).split())
        tr = f'out/audition/{lang}_{name}.txt'
        if not os.path.exists(tr):
            s = subprocess.run(['elevenlabs', 'speech-to-text', 'convert', '--model-id', 'scribe_v2', '--file', mp3, '--format', 'json'], capture_output=True, text=True)
            open(tr, 'w').write(json.loads(s.stdout)['text'] if s.returncode == 0 else 'STT failed')
        print(f'{lang} {name:12s} {d:5.1f}s  {n / d:4.2f} {"字" if lang == "zh" else "词"}/s  {np.median(p):4.0f}Hz  起伏 {st:3.1f}st  | {open(tr).read()[:70]}')
