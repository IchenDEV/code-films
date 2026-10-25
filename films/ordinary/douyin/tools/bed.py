"""铺底：一段 20 秒的持续弦乐长音（无节奏、无旋律），混音时只在配乐掉到几乎无声的地方升起来，
把 ElevenLabs 偶尔留下的空洞补上。结果在 out/music/bed.mp3。
用法：python3 tools/bed.py"""
import json, os, subprocess, sys, time
path = 'out/music/bed.mp3'
if os.path.exists(path): sys.exit(print('cached', path))
styles = ['sustained warm orchestral string pad in D minor', 'very soft', 'no rhythm', 'no melody', 'no percussion', 'continuous, slowly breathing', 'ambient']
neg = ['drums', 'percussion', 'melody', 'vocals', 'silence', 'piano']
body = {'composition_plan': {'positive_global_styles': styles, 'negative_global_styles': neg,
        'chunks': [{'text': '[bed]', 'duration_ms': 20000, 'positive_styles': styles, 'negative_styles': neg, 'context_adherence': 'high'}]},
        'model_id': 'music_v2_5'}
for _ in range(3):
    r = subprocess.run(['elevenlabs', 'music', 'compose', '--json', '-', '-o', path], input=json.dumps(body), capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(path): break
    print('retry', r.stderr[-300:]); time.sleep(5)
print(path)
