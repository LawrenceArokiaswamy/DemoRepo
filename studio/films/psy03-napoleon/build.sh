#!/bin/sh
# One-command build: events -> score/SFX/voice mix -> frames -> master (-14 LUFS) -> delivery copy.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/lemomo-ai/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines.json" "$HERE/voice"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/napoleon-was-short.mp4" 30 1
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/subtitles_en.srt"
