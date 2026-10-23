#!/usr/bin/env bash
# Run a still/render command on the project's dedicated InstaBox, from an exact
# snapshot of the current working files, and fetch the outputs back. Each tag runs
# in its own remote directory (node_modules shared by symlink), so runs never
# overwrite each other's snapshot.
#   tools/cloud.sh start <tag> '<command>'   upload snapshot, start in background
#   tools/cloud.sh wait  <tag>               block until done, print exit code + log tail
#   tools/cloud.sh fetch <tag> <path>...     copy files back (same relative paths)
#   tools/cloud.sh stop  <tag>               stop that tag's run
set -euo pipefail
BOX=${TEMPLE_BOX:-temple-render-27b11492}
BASE=/data/workspace/temple-dusk
cd "$(dirname "$0")/.."
cmd=$1; tag=$2; shift 2
RUN=/data/workspace/runs/$tag
case "$cmd" in
  start)
    mkdir -p render-cloud
    tar czf "render-cloud/scene-$tag.tar.gz" index.html package.json package-lock.json src tools render-cloud/*.json
    sum=$(sha256sum "render-cloud/scene-$tag.tar.gz" | cut -c1-16)
    instabox exec "$BOX" -- "mkdir -p $RUN"
    instabox ssh "$BOX" -- "cat > $RUN.tar.gz" < "render-cloud/scene-$tag.tar.gz"
    instabox exec "$BOX" --cwd "$RUN" -- "test \$(sha256sum $RUN.tar.gz | cut -c1-16) = $sum && cmp -s <(tar xzOf $RUN.tar.gz package-lock.json) $BASE/package-lock.json && rm -rf src tools && tar xzf $RUN.tar.gz && ln -sfn $BASE/node_modules node_modules && node tools/check.mjs | tail -1 && rm -f run.exit && (setsid nohup bash -c '$1 > run.log 2>&1; echo \$? > run.exit' </dev/null >/dev/null 2>&1 &) ; echo started $tag snapshot $sum" || true
    ;;
  wait)
    until instabox exec "$BOX" --cwd "$RUN" -- "test -f run.exit && echo DONE" 2>/dev/null | grep -q DONE; do sleep 20; done
    instabox exec "$BOX" --cwd "$RUN" -- "echo exit=\$(cat run.exit); grep -v '^ *\"\\|^ *[]{}[]' run.log | tail -25"
    ;;
  fetch)
    for f in "$@"; do mkdir -p "$(dirname "$f")"; instabox ssh "$BOX" -- "cat $RUN/$f" > "$f"; done
    ;;
  stop)
    instabox exec "$BOX" -- "for p in \$(pgrep -f 'tools/'); do test \"\$(readlink /proc/\$p/cwd)\" = $RUN && kill -TERM \$p; done; sleep 3; echo stopped"
    ;;
esac
