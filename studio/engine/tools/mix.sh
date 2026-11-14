#!/usr/bin/env bash
# mix.sh <build_dir> <voice.wav> <voice_offset_s> <music> <music_LUFS> <duration>: voice + ducked music + ducked SFX -> mix.wav (-14 LUFS, -1.5 dBTP)
set -e; B=$1; V=$2; OFF=$3; M=$4; ML=${5:--24}; D=$6; MS=$(python3 -c "print(int($OFF*1000))")
ffmpeg -v error -y -i "$V" -af "adelay=${MS}|${MS},apad=whole_dur=$D,atrim=0:$D,aresample=48000" -ac 2 "$B/v.wav"
ffmpeg -v error -y -i "$M" -af "atrim=0:$D,afade=t=in:d=0.4,afade=t=out:st=$(python3 -c "print($D-1.0)"):d=1.0,loudnorm=I=${ML}:TP=-6,aresample=48000" -ac 2 "$B/m.wav"
ffmpeg -v error -y -i "$B/m.wav" -i "$B/v.wav" -filter_complex "[0][1]sidechaincompress=threshold=0.03:ratio=3:attack=25:release=450[d]" -map "[d]" "$B/m_duck.wav"
ffmpeg -v error -y -i "$B/sfx.wav" -i "$B/v.wav" -filter_complex "[0][1]sidechaincompress=threshold=0.05:ratio=2:attack=8:release=250[d]" -map "[d]" "$B/s_duck.wav"
ffmpeg -v error -y -i "$B/v.wav" -i "$B/m_duck.wav" -i "$B/s_duck.wav" -filter_complex "[0][1][2]amix=inputs=3:normalize=0:duration=longest,atrim=0:$D" "$B/mix_raw.wav"
I=$(ffmpeg -i "$B/mix_raw.wav" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'); G=$(python3 -c "print(round(-14 - ($I),2))")
ffmpeg -v error -y -i "$B/mix_raw.wav" -af "volume=${G}dB,alimiter=limit=0.84:level=disabled:attack=3:release=60,aresample=48000" "$B/mix.wav"
ffmpeg -i "$B/mix.wav" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
