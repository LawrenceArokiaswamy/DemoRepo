#!/bin/sh
# render stills: ./still.sh <out-prefix> frame1 frame2 ...
P=$1; shift
for f in "$@"; do npx remotion still src/index.js JustInCase "$P$f.jpg" --frame=$f --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --timeout=600000 --log=error; done
