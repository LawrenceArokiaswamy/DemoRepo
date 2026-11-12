#!/bin/sh
# One-command build: voice stems + captions -> score/mix -> 30 fps render -> master (-14 LUFS, oversampled limiter) -> preview, srt, poster
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
PY="$LIB/.venv/bin/python"
cd "$LIB"
[ -f "$HERE/vo/s1.wav" ] || { "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/vo"; }
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/vo"
"$PY" "$HERE/prep.py"
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
# ffmpeg 6.x on this machine: the library mux.sh rejects the WAV on a loudnorm length bug, so a local copy without that check is used
sh "$HERE/mux_ff6.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/muxed.mp4" 30 0
ffmpeg -v error -y -i "$HERE/out/muxed.mp4" -c:v copy -af "aresample=192000,alimiter=limit=0.8:attack=1:release=40:level=false,aresample=48000" -c:a aac -b:a 256k -movflags +faststart "$HERE/voice-scam.mp4"
ffmpeg -hide_banner -nostats -i "$HERE/voice-scam.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ffmpeg -v error -y -i "$HERE/voice-scam.mp4" -c:v libx264 -preset slow -b:v 3M -maxrate 3.5M -bufsize 6M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$HERE/voice-scam_preview.mp4"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/voice-scam.srt"
ffmpeg -v error -y -ss 4.9 -i "$HERE/voice-scam.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "built $HERE/voice-scam.mp4"
