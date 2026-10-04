#!/bin/bash
# 可选：把成片上传到飞书云空间，并让机器人私信发链接（需要已登录的 lark-cli）。
# 配置走环境变量，不写进仓库：
#   LARK_USER_ID   接收消息的用户 open_id（ou_xxx）
#   LARK_FOLDER    云空间父文件夹 token（不填则传到根目录）
# 用法：pipeline/deliver_lark.sh "版本说明" out/凡人_H265.mp4 out/Ordinary_H265.mp4 ...
set -euo pipefail
: "${LARK_USER_ID:?set LARK_USER_ID (ou_xxx)}"
title="$1"; shift
folder_args=(); [[ -n "${LARK_FOLDER:-}" ]] && folder_args=(--folder-token "$LARK_FOLDER")
sub=$(lark-cli drive +create-folder --as user "${folder_args[@]}" --name "$title" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['folder_token'])")
md="**$title**"$'\n'
for f in "$@"; do
  url=$(lark-cli drive +upload --as user --file "$f" --folder-token "$sub" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['url'])")
  size=$(python3 -c "import os,sys; print(round(os.path.getsize(sys.argv[1])/1048576))" "$f")
  md+=$'\n'"· $(basename "$f")（${size} MB）：$url"
done
lark-cli im +messages-send --as bot --user-id "$LARK_USER_ID" --markdown "$md" --idempotency-key "deliver-$(date +%s)" > /dev/null
echo "sent: $title"
