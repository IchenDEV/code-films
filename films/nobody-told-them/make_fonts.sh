#!/bin/bash
# 把三种开源字体裁剪成本片用到的字，放进 fonts/。需要 fonttools（pip install fonttools）。
#   站酷庆科黄油体 ZCOOL QingKe HuangYou（OFL）· Archivo Black（OFL）· Archivo（OFL）
set -euo pipefail
cd "$(dirname "$0")"
SRC=${FONT_SRC:-/tmp/ntfont}
mkdir -p "$SRC" fonts
get() { [[ -s "$SRC/$1" ]] || curl -sSL -o "$SRC/$1" "$2"; }
get zcool.ttf "https://github.com/google/fonts/raw/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf"
get archivo-black.ttf "https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf"
get archivo.ttf "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf"
TXT=$(mktemp)
cat script.mjs rstyle.js shots/*.js > "$TXT"
LATIN="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026,U+00B7,U+00D7,U+2192"
pyftsubset "$SRC/zcool.ttf" --text-file="$TXT" --unicodes="$LATIN" --output-file=fonts/display-zh.ttf
pyftsubset "$SRC/archivo-black.ttf" --unicodes="$LATIN" --output-file=fonts/display-en.ttf
pyftsubset "$SRC/archivo.ttf" --unicodes="$LATIN" --layout-features='*' --output-file=fonts/body-en.ttf
rm "$TXT"
ls -la fonts
