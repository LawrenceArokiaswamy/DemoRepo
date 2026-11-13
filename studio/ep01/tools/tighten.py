"""Shorten long pauses in a narration track, then speed it up slightly (pitch preserved).
usage: tighten.py in.mp3 out.wav max_pause_s tempo"""
import sys, subprocess, re, numpy as np, wave
src, dst, maxp, tempo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
SR = 48000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
err = subprocess.run(["ffmpeg", "-i", src, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r"silence_start: ([0-9.]+)", err)]; en = [float(v) for v in re.findall(r"silence_end: ([0-9.]+)", err)]
keep, cur = [], 0
for a, b in zip(st, en):
    if b - a > maxp:  # keep maxp of silence, centred, with 30 ms fades handled by keeping natural tails
        cut0, cut1 = a + maxp / 2, b - maxp / 2
        keep.append(x[int(cur * SR):int(cut0 * SR)]); cur = cut1
keep.append(x[int(cur * SR):]); y = np.concatenate(keep)
lead = np.argmax(np.abs(y) > 0.01); y = y[max(0, lead - int(0.05 * SR)):]
tmp = dst + ".tmp.f32"; y.astype(np.float32).tofile(tmp)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", tmp, "-af", f"atempo={tempo}", "-ar", str(SR), dst], check=True)
import os; os.remove(tmp); print("ok")
