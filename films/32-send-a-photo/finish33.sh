#!/bin/sh
# Film 33: burn the subtitles (subs33.ass) over the render and mux the mastered score -> the-things-they-never-bought.mp4
set -e
cd "$(dirname "$0")"
python3 subs33.py
ffmpeg -y -loglevel error -i toon/out-33/video.mp4 -i out/master33.wav -vf "subtitles=subs33.ass:fontsdir=/usr/share/fonts/opentype/inter" \
  -map 0:v -map 1:a -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart the-things-they-never-bought.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 the-things-they-never-bought.mp4
