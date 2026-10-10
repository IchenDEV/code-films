#!/bin/bash
# 依次渲染全部成片版本，每一步写一行带时间的状态到 out/render_status.log
cd "$(dirname "$0")/.."
for v in "$@"; do
  echo "$(date +%T) start $v" >> out/render_status.log
  while [[ ! -f out/mix/$v.wav ]]; do sleep 10; done
  node tools/render.mjs $v 4 > out/render_$v.log 2>&1 && echo "$(date +%T) done $v" >> out/render_status.log || echo "$(date +%T) FAILED $v" >> out/render_status.log
done
echo "$(date +%T) all finished" >> out/render_status.log
