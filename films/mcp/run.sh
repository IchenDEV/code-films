#!/bin/bash
# 仓库统一入口：./run.sh mcp <步骤> [E|F] [参数]，默认 F。
set -euo pipefail
cd "$(dirname "$0")"
STEP=${1:-help}
[[ $# -gt 0 ]] && shift
[[ ${1:-} == zh ]] && shift
VARIANT=$(python3 -c "import json; print(json.load(open('film.json'))['defaultVariant'])")
if [[ $# -gt 0 && $1 != -* ]]; then
  VARIANT=$1
  shift
fi
[[ $VARIANT == E || $VARIANT == F ]] || { echo '配音版本必须是 E 或 F' >&2; exit 1; }
OUTPUT=$(python3 -c 'import json,sys; print(json.load(open("film.json"))["variants"][sys.argv[1]]["output"])' "$VARIANT")
PROJECT="film/$VARIANT"
OUT="out/$VARIANT"
mkdir -p "$OUT"
case "$STEP" in
  tts)      python3 tts.py "$VARIANT" "$@"; python3 align.py "$VARIANT" "$@" ;;
  align)    python3 align.py "$VARIANT" "$@" ;;
  timeline) python3 build_timeline.py "$VARIANT" "$@" ;;
  audio)    python3 build_timeline.py "$VARIANT"; python3 audio.py "$VARIANT" "$@" ;;
  check)    python3 -m unittest discover -s tests -v
            python3 build_timeline.py "$VARIANT"
            hyperframes check "$PROJECT" "$@" ;;
  preview)  python3 build_timeline.py "$VARIANT"
            hyperframes preview "$PROJECT" "$@" ;;
  stills)   python3 build_timeline.py "$VARIANT"
            hyperframes snapshot "$PROJECT" --output "$OUT/stills" "$@" ;;
  render)   python3 build_timeline.py "$VARIANT"
            python3 project.py "$VARIANT"
            hyperframes render "$PROJECT" --fps 30 --quality delivery --output "$OUT/$OUTPUT.mp4" "$@" ;;
  compress) ffmpeg -y -loglevel error -i "$OUT/$OUTPUT.mp4" -c:v libx265 -preset fast -crf 24 -tag:v hvc1 \
              -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT/${OUTPUT}_h265.mp4" "$@" ;;
  all)      ./run.sh tts "$VARIANT"; ./run.sh audio "$VARIANT"; ./run.sh check "$VARIANT"
            ./run.sh render "$VARIANT"; ./run.sh compress "$VARIANT" ;;
  help)     echo '用法：./run.sh mcp {tts|align|timeline|audio|check|preview|stills|render|compress|all} [E|F] [参数]' ;;
  *)        echo "未知步骤：$STEP" >&2; exit 1 ;;
esac
