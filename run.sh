#!/bin/bash
# 代码电影流水线。每部片子在 films/<片名>/，共用 engine/。
#   ./run.sh <片名> tts [语言]       ElevenLabs 合成旁白（文本未变的句子跳过，不重复计费）
#   ./run.sh <片名> timeline         按实测旁白时长排镜头
#   ./run.sh <片名> audio [语言]     音效 + 配乐 + 旁白混音
#   ./run.sh <片名> score [语言]     只渲染配乐，单独试听
#   ./run.sh <片名> render [语言]    渲染画面并合成音轨（-16 LUFS）
#   ./run.sh <片名> compress         压缩交付版（H.265 + H.264）
#   ./run.sh <片名> stills @镜头+秒 … 渲染任意镜头的任意时刻，检查画面
#   ./run.sh <片名> check [语言]     旁白逐句语速/音高检查
#   ./run.sh <片名> preview          浏览器实时预览
#   ./run.sh <片名> all              以上主流程全部
#   ./run.sh new <片名>              从模板新建一部片子
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
E="$ROOT/engine/pipeline"
usage() { sed -n '2,13p' "$0"; exit 1; }
[[ $# -lt 2 ]] && usage
if [[ $1 == new ]]; then
  [[ -e "$ROOT/films/$2" ]] && { echo "films/$2 已存在"; exit 1; }
  cp -r "$ROOT/films/_template" "$ROOT/films/$2"
  sed -i "s/\"id\": \"_template\"/\"id\": \"$2\"/" "$ROOT/films/$2/film.json"
  echo "已创建 films/$2 —— 从 script.mjs 和 shots/ 开始写"; exit 0
fi
FILM="$1"; STEP="$2"; shift 2
cd "$ROOT/films/$FILM" || { echo "没有 films/$FILM"; exit 1; }
LANGS=${*:-$(python3 -c "import json; print(' '.join(json.load(open('film.json'))['languages']))")}
step() { echo -e "\n\033[1m▸ $FILM · $*\033[0m"; }
case "$STEP" in
  tts)      for L in $LANGS; do step "narration $L"; python3 "$E/tts.py" $L; done ;;
  timeline) step timeline; node "$E/build_timeline.mjs" ;;
  audio)    for L in $LANGS; do step "audio $L"; python3 "$E/mix.py" $L; done ;;
  score)    for L in $LANGS; do step "score $L"; python3 "$E/score_preview.py" $L; done ;;
  render)   for L in $LANGS; do step "render $L"; node "$E/render.mjs" $L 4; done ;;
  compress) for f in $(python3 -c "import json; c=json.load(open('film.json')); print(' '.join('out/'+c['output'][l]+'.mp4' for l in c['languages']))"); do
              [[ -f $f ]] && { step "compress $f"; "$E/compress.sh" "$f" both; }; done ;;
  stills)   node "$E/stills.mjs" $LANGS ;;
  check)    for L in $LANGS; do python3 "$E/vo_check.py" $L; done ;;
  preview)  node "$E/serve.mjs" 8000 "$FILM" ;;
  all)      "$0" "$FILM" tts; "$0" "$FILM" timeline; "$0" "$FILM" audio; "$0" "$FILM" render; "$0" "$FILM" compress ;;
  *)        usage ;;
esac
