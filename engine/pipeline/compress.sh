#!/bin/bash
# 交付压缩。母版带胶片颗粒，体积很大；H.265 约 45 MB / 6 分钟，H.264（轻降噪）约 110 MB，兼容性最好。
# 用法：pipeline/compress.sh out/凡人.mp4 [h265|h264|both]
set -euo pipefail
in="$1"; mode="${2:-both}"; base="${in%.mp4}"
if [[ $mode == h265 || $mode == both ]]; then
  ffmpeg -y -loglevel error -i "$in" -c:v libx265 -preset fast -crf 26 -tag:v hvc1 -x265-params log-level=error \
    -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${base}_H265.mp4"
  echo "${base}_H265.mp4"
fi
if [[ $mode == h264 || $mode == both ]]; then
  ffmpeg -y -loglevel error -i "$in" -vf hqdn3d=1.5:1.5:6:6 -c:v libx264 -preset medium -crf 22 -tune film \
    -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${base}_H264.mp4"
  echo "${base}_H264.mp4"
fi
