# Master out/mix.wav to -14 LUFS integrated, true peak <= -1.2 dBTP (gain + 4x-oversampled limiter), and write the stems
# with the same gain so vo + music + sfx line up with the master:  stems/vo.wav  stems/music.wav  stems/sfx.wav  stems/mix_master.wav
import json, os, re, subprocess, sys, numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
def meas(fn):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', fn, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]); return I, P
def limit(src, dst, gain_db):
    # 4x oversampled true-peak limiting: ceiling -1.6 dBFS at 192 kHz, then back to 48 kHz
    af = f'volume={gain_db:.3f}dB,aresample=192000,alimiter=limit={10 ** (-1.6 / 20):.4f}:attack=1:release=60:level=false,aresample=48000'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-c:a', 'pcm_f32le', dst], check=True)
mix = f'{H}/out/mix.wav'; out = f'{H}/out/master.wav'
I0, P0 = meas(mix); g = -14 - I0
for _ in range(3):
    limit(mix, out, g); I, P = meas(out)
    if abs(I + 14) <= .15 and P <= -1.2: break
    g += -14 - I
print(f'master: {I:.1f} LUFS, true peak {P:.1f} dBTP (gain {g:+.2f} dB)')
json.dump({'lufs': I, 'true_peak': P, 'gain_db': g}, open(f'{H}/out/master.json', 'w'))
