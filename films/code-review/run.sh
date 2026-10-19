#!/bin/bash
# 《Anthropic 不再逐行审代码了》的流水线（仓库入口 ./run.sh code-review <步骤> 会转到这里）。两个剪辑都有旁白，时间轴由实测旁白决定。
#   tts                       旁白：短版 / 长版 × 中 / 英，各整条一次合成，并重排时间轴
#   timeline [variant…]       排时间轴（镜头、逐字字幕、关键词时刻、配乐段落）
#   music                     ElevenLabs Music 作曲（短版中 / 英、长版中 / 英）+ 铺底长音
#   sfx                       生成音效库
#   mix                       混音（同剪辑同语言的版本混一次）并检查掉空与跳变
#   smoke [variant…]          每个转场逐帧画一遍，抓运行时错误（渲染前跑）
#   render [variant…]         渲染并输出平台交付文件（一次一个；磁盘紧时先看 df）
#   covers | extras           平台封面 | SRT 字幕与长版章节
#   stills <variant> @镜头+秒 …  截帧检查
#   preview [variant]         浏览器实时预览
#   all                       以上主流程全部
set -euo pipefail
cd "$(dirname "$0")"
ALL="douyin channels tiktok bilibili youtube"
step="${1:-}"; shift || true
V="${*:-$ALL}"
case "$step" in
  tts)      for c in short long; do for l in zh en; do python3 tools/tts.py $c $l; done; done; node tools/timeline.mjs ;;
  timeline) node tools/timeline.mjs $V ;;
  music)    for c in short long; do for l in zh en; do python3 tools/music.py $c $l; done; done; python3 tools/bed.py ;;
  sfx)      python3 tools/sfx_gen.py ;;
  mix)      python3 tools/mix.py && python3 tools/check_audio.py ;;
  smoke)    node tools/smoke.mjs ${*:-douyin tiktok bilibili youtube} ;;
  render)   for v in $V; do node tools/render.mjs $v 4; done ;;
  covers)   node tools/covers.mjs ;;
  extras)   node tools/extras.mjs ;;
  stills)   node tools/stills.mjs "$@" ;;
  preview)  echo "打开 http://127.0.0.1:8000/films/code-review/index.html?v=${1:-douyin}&preview"
            exec node ../../engine/pipeline/serve.mjs 8000 code-review >/dev/null ;;
  all)      "$0" tts; "$0" music; "$0" sfx; "$0" mix; "$0" smoke; "$0" render; "$0" covers; "$0" extras ;;
  *)        sed -n '2,15p' "$0"; exit 1 ;;
esac
