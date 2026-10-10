#!/bin/bash
# 《五年》的流水线（仓库入口 ./run.sh five-years <步骤> 会转到这里）。
#   tts [cut lang variants…]   整段合成旁白（带语气标签与逐字时间戳），默认全部
#   timeline [variant…]       按实测旁白排时间轴
#   music [variant…]          ElevenLabs Music 按段落作曲
#   sfx                       生成音效库
#   mix [variant…]            混音到 -14 LUFS
#   render [variant…]         渲染并输出平台交付文件
#   covers | extras           平台封面 | SRT 字幕与章节
#   stills <variant> @镜头%比例 …  截帧检查
#   preview [variant]         浏览器实时预览
#   all                       以上主流程全部
set -euo pipefail
cd "$(dirname "$0")"
ALL="bilibili youtube douyin xiaohongshu channels shorts"
step="${1:-}"; shift || true
V="${*:-$ALL}"
case "$step" in
  tts)      if [[ $# -gt 0 ]]; then python3 tools/tts.py "$@"; else
              python3 tools/tts.py long zh bilibili; python3 tools/tts.py long en youtube
              python3 tools/tts.py short zh xiaohongshu channels; python3 tools/tts.py short en; fi ;;
  timeline) node tools/timeline.mjs $V ;;
  music)    python3 tools/music.py $V ;;
  sfx)      python3 tools/sfx_gen.py ;;
  mix)      python3 tools/mix.py $V ;;
  render)   for v in $V; do node tools/render.mjs $v 4; done ;;
  covers)   node tools/covers.mjs ;;
  extras)   node tools/extras.mjs ;;
  stills)   node tools/stills.mjs "$@" ;;
  preview)  echo "打开 http://127.0.0.1:8000/films/five-years/index.html?v=${1:-bilibili}&preview"
            exec node ../../engine/pipeline/serve.mjs 8000 five-years >/dev/null ;;
  all)      "$0" tts; "$0" timeline; "$0" sfx; "$0" music; "$0" mix; "$0" render; "$0" covers; "$0" extras ;;
  *)        sed -n '2,13p' "$0"; exit 1 ;;
esac
