#!/bin/sh
# usage: stills.sh name t1 t2 ...   -> review/name.jpg
P=$(cd "$(dirname "$0")/.." && pwd); N=$1; shift
cd /root/lemo-opuscar && PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node core/render/still.mjs $P "$@" --size 1080x1920 --out $P/stills >/dev/null 2>$P/stills/err.txt || { cat $P/stills/err.txt; exit 1; }
L=""; for t in "$@"; do L="$L $P/stills/t_$t.jpg"; done
.venv/bin/python core/render/sheet.py $P/review/$N.jpg $L --cols 5 --w 360 >/dev/null
