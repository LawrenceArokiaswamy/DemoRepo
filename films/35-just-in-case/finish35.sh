#!/bin/sh
# Film 35: subtitles + mastered mix over the Remotion picture -> just-in-case.mp4
set -e
cd "$(dirname "$0")"
python3 subs35.py
ffmpeg -v error -y -i out/picture.mp4 -i out/master.wav -map 0:v -map 1:a \
  -vf "subtitles=subs35.ass:fontsdir=../34-first-home/fonts" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest just-in-case.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 just-in-case.mp4
