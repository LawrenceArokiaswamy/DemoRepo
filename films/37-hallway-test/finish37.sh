#!/bin/sh
# frames (540x960) -> 1080x1920 with the quiet line and the mastered sound -> hallway-test.mp4
set -e; cd "$(dirname "$0")"
python3 subs37.py
ffmpeg -v error -y -framerate 30 -i out/frames/%04d.png -i out/master.wav -map 0:v -map 1:a \
  -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,subtitles=subs37.ass:fontsdir=../34-first-home/fonts,fade=t=in:st=0:d=0.6,fade=t=out:st=9.4:d=0.6" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest hallway-test.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 hallway-test.mp4
