#!/bin/sh
# almost-done: one-command build. No narration: picture (index.html) + score/foley (mix.py) -> master -> mux.
# Free: everything is rendered from code on this machine. The piano samples (Salamander Grand Piano V3, CC BY 3.0, Alexander Holm)
# are fetched from npm into samples/ (not committed): ./build.sh fetches them if missing.
#   ./build.sh               full build
#   ./build.sh --no-render   remix/remaster only (picture unchanged)
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
NAME=almost-done
export LIB PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
PY="$LIB/.venv/bin/python"
RENDER=1; [ "$1" = "--no-render" ] && RENDER=0
# 0. piano samples
if [ ! -f "$HERE/samples/v8/C4v8.ogg" ]; then
  T=$(mktemp -d); for v in 4 8 12; do (cd "$T" && npm pack -q @audio-samples/piano-velocity$v@1.0.5 >/dev/null && mkdir -p v$v && tar xzf audio-samples-piano-velocity$v-1.0.5.tgz -C v$v); mkdir -p "$HERE/samples/v$v"; cp "$T"/v$v/package/audio/*.ogg "$HERE/samples/v$v/"; done; rm -rf "$T"
fi
cd "$LIB"
# 1. picture
node core/render/events.mjs "$HERE" --size 1080x1920
[ $RENDER = 1 ] && node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
# 2. score + foley -> mix -> master (-14 LUFS, <= -1.2 dBTP)
"$PY" "$HERE/mix.py"
"$PY" "$HERE/master.py"
# 3. mux, preview, poster
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -preset slow -crf 17 -r 30 -c:a aac -b:a 320k -movflags +faststart -shortest "$HERE/$NAME.mp4"
ffmpeg -hide_banner -nostats -i "$HERE/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ffmpeg -v error -y -i "$HERE/$NAME.mp4" -c:v libx264 -preset slow -b:v 3.5M -maxrate 4M -bufsize 7M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$HERE/${NAME}_preview.mp4"
ffmpeg -v error -y -ss 59 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "built $HERE/$NAME.mp4"
