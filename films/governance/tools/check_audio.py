"""混音检查：按段落打印响度（RMS dB）与峰值，确认情绪曲线（结果最响、片尾淡出），并找出掉空和突然跳变。
用法：python3 tools/check_audio.py [variant…]"""
import json, subprocess, sys
import numpy as np

for v in sys.argv[1:] or ['douyin', 'bilibili']:
  print('==', v)
  TL = json.load(open(f'timeline/{v}.json'))
  raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'out/mix/{v}.wav', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
  x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
  for a in TL['acts']:
      seg = x[int(a['a'] * 16000): int(a['b'] * 16000)]
      rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
      pk = 20 * np.log10(np.max(np.abs(seg)) + 1e-9)
      print(f"{a['name']:9s} {a['a']:6.1f}–{a['b']:6.1f}s  rms {rms:6.1f} dB  peak {pk:5.1f} dB  " + '#' * max(0, int((rms + 40) * 1.2)))
  # 连贯性：成片里每 0.25 秒的响度，标出掉到几乎无声（< -45 dB）和突然跳变（> 12 dB）的地方；只有片头第一格和片尾淡出除外
  step = 4000
  dbs = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + step] ** 2)) + 1e-9) for i in range(0, len(x) - step, step)])
  ts = np.arange(len(dbs)) * 0.25
  skip = lambda t: t > TL['duration'] - 2.5 or t < 0.25
  drops = [t for t, d in zip(ts, dbs) if d < -45 and not skip(t)]
  jumps = [(t, dbs[i] - dbs[i - 1]) for i, t in enumerate(ts) if i and abs(dbs[i] - dbs[i - 1]) > 12 and not skip(t)]
  print(f'掉空 {len(drops)} 处' + (': ' + ', '.join(f'{t:.2f}s' for t in drops[:12]) if drops else ''))
  print(f'跳变 {len(jumps)} 处' + (': ' + ', '.join(f'{t:.2f}s {d:+.0f}' for t, d in jumps[:12]) if jumps else ''))
