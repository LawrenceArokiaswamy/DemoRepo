#!/bin/sh
# raw/ (Commons downloads) -> img/ (cover size for 1080x1920 with room for a 1.2x push; never upscaled here)
cd "$(dirname "$0")"; mkdir -p img
for f in raw/*; do n=$(basename "${f%.*}"); case $n in h100a|h100b) o=h100;; *) o=$n;; esac
  [ "$n" = h100b ] && [ -f raw/h100a.png ] && continue
  ffmpeg -v error -y -i "$f" -vf "scale='if(gt(1296/iw,2304/ih),min(iw,1296),-2)':'if(gt(1296/iw,2304/ih),-2,min(ih,2304))':flags=lanczos,unsharp=5:5:0.3" -q:v 3 "img/$o.jpg"
done
ls -la img
