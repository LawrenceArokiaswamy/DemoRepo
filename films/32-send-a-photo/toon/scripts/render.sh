#!/bin/sh
# full render of a composition: ./scripts/render.sh <Composition> <out.mp4> [concurrency]
npx remotion render src/index.ts "$1" "$2" --gl=swangle --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell \
  --concurrency=${3:-4} --codec=h264 --crf=16 --timeout=900000 --bundle-cache=false --log=error
