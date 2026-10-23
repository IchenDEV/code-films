#!/usr/bin/env bash
# Run from the isolated cloud source directory. Preserve the renderer's exit.
node tools/still.mjs --jobs render-cloud/quality-v3-jobs.json --w 960 --h 540 --scale 1.5 --samples 4 --stats > stills.log 2>&1
result=$?
printf '%s\n' "$result" > stills.exit
exit "$result"
