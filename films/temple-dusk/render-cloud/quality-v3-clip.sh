#!/usr/bin/env bash
# Motion proxy; inspect surface detail in the 960x540 supersampled stills.
node tools/render.mjs --clip 5.6,1.3 --tag quality-v3 --w 640 --h 360 --scale 1 --samples 4 --fps 30 > clip.log 2>&1
result=$?
printf '%s\n' "$result" > clip.exit
exit "$result"
