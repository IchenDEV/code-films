#!/usr/bin/env bash
# Run from this source snapshot's isolated cloud directory.
node tools/lighting-review.mjs previews/quality-v3/checks > checks.log 2>&1
result=$?
printf '%s\n' "$result" > checks.exit
if [ "$result" -ne 0 ]; then exit "$result"; fi
bash render-cloud/quality-v3-stills.sh
result=$?
if [ "$result" -ne 0 ]; then exit "$result"; fi
node tools/render.mjs --clip 5.6,1.3 --tag quality-v3 --w 960 --h 540 --scale 1.5 --samples 4 --fps 30 > clip.log 2>&1
result=$?
printf '%s\n' "$result" > clip.exit
exit "$result"
