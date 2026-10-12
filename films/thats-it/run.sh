#!/bin/bash
# 《就这？》的流水线（仓库入口 ./run.sh thats-it <步骤> 会转到这里）。长版无口播（时间轴由拍子决定），短版有旁白（由实测旁白决定）。
#   timeline [variant…]       排时间轴（长版按拍子并吸附实测拍点；短版按实测旁白）
#   tts                       短版旁白（中 / 英）
#   music                     ElevenLabs Music 按段落作曲（长版、短版中、短版英），并测出拍点
#   sfx                       生成音效库
#   mix                       混音（同剪辑同语言的版本混一次）
#   smoke [variant…]          每个转场逐帧画一遍，抓运行时错误（渲染前跑）
#   render [variant…]         渲染并输出平台交付文件
#   covers | extras           平台封面 | 双语 SRT 字幕与章节
#   stills <variant> @镜头+秒 …  截帧检查
#   preview [variant]         浏览器实时预览
#   all                       以上主流程全部
set -euo pipefail
cd "$(dirname "$0")"
ALL="douyin_short channels_short shorts bilibili youtube douyin channels"
step="${1:-}"; shift || true
V="${*:-$ALL}"
case "$step" in
  timeline) node tools/timeline.mjs $V ;;
  tts)      python3 tools/tts.py zh && python3 tools/tts.py en && node tools/timeline.mjs ;;
  music)    python3 tools/music.py long && python3 tools/music.py short zh && python3 tools/music.py short en && node tools/timeline.mjs ;;
  sfx)      python3 tools/sfx_gen.py ;;
  mix)      python3 tools/mix.py && python3 tools/check_audio.py ;;
  smoke)    node tools/smoke.mjs ${*:-bilibili douyin} ;;
  render)   for v in $V; do node tools/render.mjs $v 4; done ;;
  covers)   node tools/covers.mjs ;;
  extras)   node tools/extras.mjs ;;
  stills)   node tools/stills.mjs "$@" ;;
  preview)  echo "打开 http://127.0.0.1:8000/films/thats-it/index.html?v=${1:-bilibili}&preview"
            exec node ../../engine/pipeline/serve.mjs 8000 thats-it >/dev/null ;;
  all)      "$0" timeline; "$0" tts; "$0" music; "$0" sfx; "$0" mix; "$0" smoke; "$0" render; "$0" covers; "$0" extras ;;
  *)        sed -n '2,13p' "$0"; exit 1 ;;
esac
