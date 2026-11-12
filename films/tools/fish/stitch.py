# Build ONE take from the per-line Fish clips: trim each line's edges, match loudness, lay out with the gaps in fish_vo.json, 1 s pad.
#   $LIB/.venv/bin/python stitch.py FILM_DIR   -> FILM_DIR/take.wav   (then ./build.sh --vo take.wav)
import json, os, sys, numpy as np, soundfile as sf
d = os.path.abspath(sys.argv[1]); S = json.load(open(f'{d}/fish_vo.json')); SR = 44100
def trim(a):
    hop = SR // 100; n = len(a) // hop; e = np.sqrt((a[:n*hop].reshape(n, hop)**2).mean(1)); thr = .03 * e.max()
    idx = np.where(e > thr)[0]; s, t = max(idx[0] - 3, 0), min(idx[-1] + 8, n)
    a = a[s*hop:t*hop].copy(); f = int(.008*SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f); return a
out = [np.zeros(SR)]; rep = []
for L in S['lines']:
    lid, gap = L[0], L[2]
    a, sr = sf.read(f'{d}/vo_fish/{lid}.wav'); a = a if a.ndim == 1 else a.mean(1); assert sr == SR
    a = trim(a); act = a[np.abs(a) > .02]; a *= (10**(-20/20)) / np.sqrt((act**2).mean())
    out += [a, np.zeros(int(gap * SR))]; rep.append(f'{lid} {len(a)/SR:.2f}s')
y = np.concatenate(out + [np.zeros(SR)]); y *= min(1, .89 / np.abs(y).max())
sf.write(f'{d}/take.wav', y.astype(np.float32), SR, subtype='PCM_24'); print(' '.join(rep), '| total', round(len(y)/SR, 2))
