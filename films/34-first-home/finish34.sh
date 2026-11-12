#!/bin/sh
# Film 34: post (dips, flash, end darken) -> upscale 2x -> burn subs34.ass -> mux the master -> her-first-home.mp4
set -e
cd "$(dirname "$0")"
python3 subs34.py
python3 post.py
ffmpeg -y -loglevel error -framerate 30 -i out/post/%04d.png -i out/master.wav \
  -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.45,subtitles=subs34.ass:fontsdir=fonts" \
  -map 0:v -map 1:a -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart her-first-home.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 her-first-home.mp4
