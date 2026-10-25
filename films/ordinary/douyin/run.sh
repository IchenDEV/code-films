#!/bin/bash
# 《凡人》抖音版的流水线（仓库入口 ./run.sh ordinary/douyin <步骤> 会转到这里）。时间轴由实测旁白决定。
#   tts               旁白整条一次合成、转写核对、按段落切开，并重排时间轴
#   timeline [-v]     排时间轴（画面段落、逐字字幕、关键词时刻、配乐段落）
#   music             ElevenLabs Music 作曲 + 铺底长音
#   sfx               生成音效库
#   mix               混音并检查掉空与跳变
#   render            渲染并输出交付文件（磁盘紧时先看 df）
#   extras            SRT 字幕与封面
#   stills @段落[+秒|%比例] … [--sheet]   截帧检查
#   preview           浏览器实时预览
#   all               以上主流程全部
set -euo pipefail
cd "$(dirname "$0")"
step="${1:-}"; shift || true
case "$step" in
  tts)      python3 tools/tts.py; node tools/timeline.mjs ;;
  timeline) node tools/timeline.mjs "$@" ;;
  music)    python3 tools/music.py "$@"; python3 tools/contour.py; python3 tools/bed.py ;;
  sfx)      python3 tools/sfx_gen.py ;;
  mix)      python3 tools/mix.py && python3 tools/check_audio.py ;;
  render)   node tools/render.mjs "$@" ;;
  extras)   node tools/extras.mjs ;;
  stills)   node tools/stills.mjs "$@" ;;
  preview)  echo "打开 http://127.0.0.1:8000/films/ordinary/douyin/index.html?preview"
            exec node ../../../engine/pipeline/serve.mjs 8000 >/dev/null ;;
  all)      "$0" tts; "$0" music; "$0" sfx; "$0" mix; "$0" render; "$0" extras ;;
  *)        sed -n '2,13p' "$0"; exit 1 ;;
esac
