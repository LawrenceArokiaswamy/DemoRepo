#!/usr/bin/env bash
# mix.sh <music_LUFS>: narration (v.wav) + ducked music + ducked SFX -> mix.wav at -14 LUFS, -1.5 dBTP
set -e; ML=${1:--15}
ffmpeg -v error -y -i music.mp3 -af "atrim=0:30.6,afade=t=in:d=0.3,afade=t=out:st=29.7:d=0.9,loudnorm=I=${ML}:TP=-3,aresample=48000" -ac 2 m.wav
ffmpeg -v error -y -i m.wav -i v.wav -filter_complex "[0][1]sidechaincompress=threshold=0.03:ratio=3:attack=25:release=450[d]" -map "[d]" m_duck.wav
ffmpeg -v error -y -i sfx.wav -i v.wav -filter_complex "[0][1]sidechaincompress=threshold=0.04:ratio=2.5:attack=8:release=250[d]" -map "[d]" s_duck.wav
ffmpeg -v error -y -i v.wav -i m_duck.wav -i s_duck.wav -filter_complex "[0]apad=whole_dur=30.6[a];[1]apad=whole_dur=30.6[b];[2]volume=1.05[c];[a][b][c]amix=inputs=3:normalize=0:duration=longest,atrim=0:30.6" mix_raw.wav
I=$(ffmpeg -i mix_raw.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'); G=$(python3 -c "print(round(-14 - ($I),2))")
ffmpeg -v error -y -i mix_raw.wav -af "volume=${G}dB,alimiter=limit=0.84:level=disabled:attack=3:release=60,aresample=48000" mix.wav
ffmpeg -i mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
