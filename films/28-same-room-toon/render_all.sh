#!/bin/sh
# render all 9 shots (shot 1 first: its frame 60 becomes the memory photo in shot 4)
cd "$(dirname "$0")"
for s in 1 2 3 4 5 6 7 8 9; do /root/blendervenv/bin/python film.py -- --shot $s --frames 0:120 --res 540x960 --samples 16 > out/render_s$s.log 2>&1; echo "shot $s done $(date +%T)"; done
