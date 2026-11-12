#!/bin/sh
# one-question: one-command build (free: everything is rendered from code on this machine).
#   ./build.sh                    scratch narration (Kokoro am_puck; generated if vo/ is empty)
#   ./build.sh --vo take.wav      the Fish Audio narration (fish_vo.json -> ../tools/fish/gen.py + stitch.py -> take.wav)
#   ./build.sh --vo myvoice.wav   ONE recording of the whole VO_SCRIPT.md (any rate/format ffmpeg reads); Whisper finds every line
#   ./build.sh --vo-dir takes/    one WAV per line: takes/n1.wav … takes/n21.wav (ids as in lines.json / VO_SCRIPT.md)
#   add --no-render to remix/remaster only (valid only if the voice timing did not change)
# A new voice re-times everything: shots, captions (word-synced from Whisper word timestamps), sound cues, .srt.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
NAME=one-question
export LIB PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
PY="$LIB/.venv/bin/python"
MODE=kokoro; ARG=""; RENDER=1
while [ $# -gt 0 ]; do
  case "$1" in
    --vo) MODE=take; ARG=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); shift 2;;
    --vo-dir) MODE=dir; ARG=$(cd "$2" && pwd); shift 2;;
    --no-render) RENDER=0; shift;;
    *) echo "unknown option $1"; exit 2;;
  esac
done
cd "$LIB"
# 1. voice + word timestamps
case $MODE in
  kokoro) [ -f "$HERE/vo/n1.wav" ] || "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/vo"
          "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/vo"
          "$PY" "$HERE/prep.py";;
  dir)    "$PY" core/tts/asr_check.py "$HERE/lines.json" "$ARG" || echo "note: some lines differ from the script (see above); timing still uses the words Whisper found"
          "$PY" "$HERE/prep.py" --vo-dir "$ARG";;
  take)   WHISPER_MODEL=${WHISPER_MODEL:-small.en} "$PY" "$HERE/prep.py" --vo "$ARG";;
esac
# 2. picture (anchored to the narration timing in film.json)
node core/render/events.mjs "$HERE" --size 1080x1920
[ $RENDER = 1 ] && node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
# 3. score + sound design + voice -> stems and mix; master to -14 LUFS / <= -1.2 dBTP
"$PY" "$HERE/mix.py"
"$PY" "$HERE/master.py"
# 4. mux (BT.709 limited range), preview, subtitles, poster
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -preset slow -crf 17 -r 30 -c:a aac -b:a 320k -movflags +faststart -shortest "$HERE/$NAME.mp4"
ffmpeg -hide_banner -nostats -i "$HERE/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ffmpeg -v error -y -i "$HERE/$NAME.mp4" -c:v libx264 -preset slow -b:v 3M -maxrate 3.5M -bufsize 6M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$HERE/${NAME}_preview.mp4"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/$NAME.srt"
POSTER_T=$("$PY" -c "import json;f=json.load(open('$HERE/film.json'));print(round([w for w in f['words']['n1'] if w[0].startswith('questions')][0][1]+.45,2))")
ffmpeg -v error -y -ss "$POSTER_T" -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "built $HERE/$NAME.mp4"
