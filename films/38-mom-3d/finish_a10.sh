#!/bin/sh
# 1080x1920 30 fps frames + mastered sound -> mom-validation-animation.mp4 (no upscaling: frames are rendered at full size)
set -e; cd "$(dirname "$0")"
ffmpeg -v error -y -framerate 30 -i out/a10full/%04d.png -i out/master_a10.wav -map 0:v -map 1:a \
  -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=9.5:d=0.5" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 256k -movflags +faststart -shortest mom-validation-animation.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration -of compact mom-validation-animation.mp4
