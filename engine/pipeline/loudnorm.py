"""两遍 loudnorm（线性模式）：整体响度到 -16 LUFS，不压缩动态。用法：python3 pipeline/loudnorm.py in.wav out.wav"""
import json, re, subprocess, sys
src, dst = sys.argv[1], sys.argv[2]
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=18:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=18:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', '48000', dst], check=True)
print(f"{src}: {m['input_i']} LUFS → -16 LUFS")
