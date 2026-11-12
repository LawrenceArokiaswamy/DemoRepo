#!/bin/sh
# Swap the captioned frame ranges of the full render for caption-free re-renders, burn the streaming-style subtitles
# (subs.ass), and mux the master audio -> send-a-photo-subs.mp4
set -e
cd "$(dirname "$0")"
V=toon/out-full/video.mp4; C=toon/out-full/clean
python3 subs.py
ffmpeg -y -loglevel error -i $V -i $C/15-96.mp4 -i $C/204-408.mp4 -i $C/537-642.mp4 -i $C/792-900.mp4 -i $C/2136-2487.mp4 -i out/master_full.wav -filter_complex "\
[0:v]trim=start_frame=0:end_frame=15,setpts=PTS-STARTPTS[o0];\
[0:v]trim=start_frame=97:end_frame=204,setpts=PTS-STARTPTS[o1];\
[0:v]trim=start_frame=409:end_frame=537,setpts=PTS-STARTPTS[o2];\
[0:v]trim=start_frame=643:end_frame=792,setpts=PTS-STARTPTS[o3];\
[0:v]trim=start_frame=901:end_frame=2136,setpts=PTS-STARTPTS[o4];\
[0:v]trim=start_frame=2488:end_frame=2640,setpts=PTS-STARTPTS[o5];\
[1:v]setpts=PTS-STARTPTS[c1];[2:v]setpts=PTS-STARTPTS[c2];[3:v]setpts=PTS-STARTPTS[c3];[4:v]setpts=PTS-STARTPTS[c4];[5:v]setpts=PTS-STARTPTS[c5];\
[o0][c1][o1][c2][o2][c3][o3][c4][o4][c5][o5]concat=n=11:v=1:a=0,fps=30,subtitles=subs.ass:fontsdir=/usr/share/fonts/opentype/inter[v]" \
  -map "[v]" -map 6:a -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart send-a-photo-subs.mp4
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -show_entries format=duration -of compact send-a-photo-subs.mp4
