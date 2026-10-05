#!/bin/bash
# 白板版的制作入口；可从仓库根目录运行 ./run.sh ai-steward <步骤>。
set -euo pipefail
cd "$(dirname "$0")"
STEP=${1:-help}
[[ $# -gt 0 ]] && shift
[[ ${1:-} == zh ]] && shift
OUTPUT=$(python3 -c "import json; print(json.load(open('film.json'))['output']['zh'])")
mkdir -p out
case "$STEP" in
  tts)      python3 tts.py "$@"; python3 align.py "$@" ;;
  align)    python3 align.py "$@" ;;
  timeline) python3 build_timeline.py ;;
  audio)    node export_sfx.mjs; python3 audio.py ;;
  check)    python3 -m unittest discover -s tests -v
            (cd film; hyperframes check . "$@") ;;
  preview)  (cd film; hyperframes preview . "$@") ;;
  stills)   (cd film; hyperframes snapshot . --output ../out/stills "$@") ;;
  render)   (cd film; hyperframes render . --fps 30 --quality delivery --output "../out/$OUTPUT.mp4" "$@") ;;
  compress) ../../engine/pipeline/compress.sh "out/$OUTPUT.mp4" both ;;
  all)      ./run.sh tts; ./run.sh timeline; ./run.sh audio; ./run.sh render ;;
  *)        echo '用法：./run.sh ai-steward {tts|align|timeline|audio|check|preview|stills|render|compress|all} [zh] [参数]'
            [[ $STEP == help ]] || exit 1 ;;
esac
