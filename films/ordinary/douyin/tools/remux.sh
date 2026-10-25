#!/bin/bash
# 只换音轨：画面不变（时间轴没动）时，把 out/mix/<variant>.wav 重新封装进交付文件，不用重渲。
# 用法：tools/remux.sh <variant> <交付文件名（不含 .mp4）>
set -euo pipefail
cd "$(dirname "$0")/.."
v="$1"; name="$2"; f="out/deliver/$name.mp4"; tmp="out/deliver/.$name.remux.mp4"
ffmpeg -y -loglevel error -i "$f" -i "out/mix/$v.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$tmp"
# 音轨若没写完，-shortest 会悄悄截短整片：长度不对就不替换
d() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
if awk -v a="$(d "$f")" -v b="$(d "$tmp")" 'BEGIN { exit !((a - b) > 0.2 || (b - a) > 0.2) }'; then
  echo "remux $f: 新文件 $(d "$tmp")s，原文件 $(d "$f")s，不替换" >&2; rm "$tmp"; exit 1
fi
mv "$tmp" "$f"
echo "remuxed $f"
