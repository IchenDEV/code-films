#!/bin/bash
# 把三种开源字体裁剪成本片用到的字，放进 fonts/。需要 fonttools（pip install fonttools）。
#   马善政楷书 Ma Shan Zheng（OFL）· 霞鹜文楷 LXGW WenKai（OFL）· EB Garamond（OFL）
set -euo pipefail
cd "$(dirname "$0")"
SRC=${FONT_SRC:-/tmp/fontdl}
mkdir -p "$SRC" fonts
get() { [[ -s "$SRC/$1" ]] || curl -sSL -o "$SRC/$1" "$2"; }
get MaShanZheng.ttf "https://github.com/google/fonts/raw/main/ofl/mashanzheng/MaShanZheng-Regular.ttf"
get LXGWWenKai.ttf "https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-Regular.ttf"
get EBG.ttf "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf"
get EBGi.ttf "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf"
TXT=$(mktemp)
cat script.mjs style.js shots/*.js > "$TXT"
LATIN="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026,U+00B7"
pyftsubset "$SRC/MaShanZheng.ttf" --text-file="$TXT" --unicodes="$LATIN" --output-file=fonts/brush.ttf
pyftsubset "$SRC/LXGWWenKai.ttf" --text-file="$TXT" --unicodes="$LATIN,U+30FB" --output-file=fonts/kai.ttf
pyftsubset "$SRC/EBG.ttf" --unicodes="$LATIN" --layout-features='*' --output-file=fonts/garamond.ttf
pyftsubset "$SRC/EBGi.ttf" --unicodes="$LATIN" --layout-features='*' --output-file=fonts/garamond-italic.ttf
rm "$TXT"
ls -la fonts
