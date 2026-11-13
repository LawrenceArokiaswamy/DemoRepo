#!/usr/bin/env python3
"""Synthesized sound design for EP01 (original). Writes a stereo SFX+ambience stem: sfx.py out.wav duration_s"""
import sys, wave, numpy as np
SR = 48000
out, DUR = sys.argv[1], float(sys.argv[2])
N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(7)

def noise(n): return rng.standard_normal(n)
def _filt(x, fc, order, high):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); r = (f / fc) ** (2 * order)
    H = np.sqrt(r / (1 + r)) if high else 1 / np.sqrt(1 + r); return np.fft.irfft(X * H, len(x))
def lp(x, fc, order=2): return _filt(x, fc, order, False)
def hp(x, fc, order=2): return _filt(x, fc, order, True)
def bp(x, lo, hi): return hp(lp(x, hi), lo)
def env(n, a, d, shape=2.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4) * shape / 2); return e
def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); sig = sig[: max(0, N - i)]; gl, gr = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * gain * gl; R[i:i + len(sig)] += sig * gain * gr
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def sweep_noise(dur, f0, f1, a=0.05):
    n = int(dur * SR); x = noise(n); bands = [bp(x, f * 0.6, f * 1.4) for f in np.geomspace(f0, f1, 8)]
    w = np.linspace(0, 7, n); out = sum(b * np.maximum(0, 1 - np.abs(w - i)) for i, b in enumerate(bands))
    return norm(out) * env(n, a, dur * 0.7)

# ---- ambience beds ----
def waves(t0, t1, gain, period=4.2, bright=900):
    n = int((t1 - t0) * SR); x = lp(noise(n), bright); t = np.arange(n) / SR
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / period) ** 2; crash = np.maximum(0, np.sin(2 * np.pi * t / period - 0.6)) ** 6
    y = norm(x) * swell + norm(hp(noise(n), 1500)) * crash * 0.35; fade = np.minimum(1, np.minimum(t / 0.4, (t[-1] - t) / 0.4))
    place(y * fade, t0, gain, 0.0)
waves(0, 10.45, 0.10, 5.0, 700)
waves(10.45, 20.3, 0.16, 3.6, 1100)
waves(27.55, DUR, 0.17, 3.3, 1200)
# distant construction knocks (Roman era)
for t in [0.9, 2.3, 6.8, 7.9, 9.6]: n = int(0.18 * SR); s = np.sin(2 * np.pi * 180 * np.arange(n) / SR) * env(n, 0.002, 0.05) + lp(noise(n), 2500) * env(n, 0.001, 0.02) * 0.5; place(s, t, 0.05, -0.4)
# ---- story events ----
place(sweep_noise(0.32, 500, 2600), 3.36, 0.26, 0.2)                       # shovel swing
n = int(1.1 * SR); place(norm(bp(noise(n), 1800, 7000)) * env(n, 0.05, 0.6), 3.6, 0.22, 0.15)   # powder pour
n = int(2.0 * SR); hiss = norm(hp(noise(n), 3500)) * env(n, 0.04, 1.2)                 # steam hiss
crk = np.zeros(n); idx = rng.integers(0, n - 400, 120); crk[idx] = rng.uniform(0.3, 1, 120); crk = hp(crk, 2000)
place(hiss * 0.8 + norm(crk) * 0.25, 5.3, 0.28, 0.1)
for k in range(14):                                                                     # bubbling
    n = int(0.07 * SR); f = rng.uniform(220, 520); tt = np.arange(n) / SR; b = np.sin(2 * np.pi * (f + 900 * tt) * tt) * env(n, 0.003, 0.03); place(b, 5.55 + k * 0.17 + rng.uniform(0, 0.06), 0.12, rng.uniform(-0.3, 0.3))
place(sweep_noise(0.55, 300, 5000, 0.5)[::-1].copy(), 9.95, 0.2)               # riser into time jump
place(sweep_noise(0.9, 4000, 300, 0.02), 10.42, 0.3)                                   # time-jump whoosh
def crack(t, g):
    n = int(0.6 * SR); x = np.zeros(n); idx = rng.integers(0, int(0.08 * SR), 60); x[idx] = rng.uniform(0.4, 1, 60)
    s = hp(x, 1200) * 2 + np.sin(2 * np.pi * 60 * np.arange(n) / SR) * env(n, 0.002, 0.25) * 0.9 + lp(noise(n), 400) * env(n, 0.002, 0.15)
    place(norm(s), t, g)
crack(16.6, 0.42); crack(17.03, 0.26)
n = int(1.2 * SR); place(norm(lp(noise(n), 2500)) * env(n, 0.01, 0.5), 17.9, 0.3, 0.2)            # splash
n = int(1.4 * SR); place(norm(bp(noise(n), 2500, 8000)) * env(n, 0.2, 1.4) * 0.6, 18.1, 0.12)   # trickle bed
for k in range(16):                                                                    # droplet plinks
    n = int(0.12 * SR); tt = np.arange(n) / SR; f = rng.uniform(1400, 2600); d = np.sin(2 * np.pi * f * (1 + 2.2 * tt) * tt) * env(n, 0.001, 0.035)
    place(d, 18.15 + k * 0.085 + rng.uniform(0, 0.05), 0.1, rng.uniform(-0.4, 0.4))
place(sweep_noise(0.7, 200, 3000, 0.6), 19.6, 0.28)                                   # dive whoosh
n = int(1.4 * SR); tt = np.arange(n) / SR; place(np.sin(2 * np.pi * (48 + 30 * np.exp(-tt * 6)) * tt) * env(n, 0.005, 0.7) + lp(noise(n), 300) * env(n, 0.005, 0.3), 20.3, 0.45)  # underwater whomp
n = int(7.3 * SR); tt = np.arange(n) / SR                                              # micro-world drone + fizz
drone = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 82.5 * tt + 0.3)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt)); fade = np.minimum(1, np.minimum(tt / 0.6, (tt[-1] - tt) / 0.5))
place(drone * fade * 0.5 + norm(bp(noise(n), 3000, 9000)) * fade * 0.12, 20.3, 0.16)
for k in range(70):                                                                    # crystal shimmer (denser as the crack fills)
    t = 20.9 + 6.4 * np.sqrt(rng.uniform()); n = int(0.6 * SR); tt = np.arange(n) / SR; f = rng.choice([1760, 2093, 2349, 2637, 3136, 3520])
    place(np.sin(2 * np.pi * f * tt) * env(n, 0.002, 0.35) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * f * tt)), t, 0.035, rng.uniform(-0.6, 0.6))
place(sweep_noise(0.6, 3000, 300, 0.05), 27.5, 0.25)                                   # surface whoosh
n = int(2.2 * SR); place(norm(lp(noise(n), 1800)) * env(n, 0.04, 1.0) + norm(hp(noise(n), 3000)) * env(n, 0.06, 0.4) * 0.4, 27.95, 0.4, 0.3)  # big wave crash
n = int(3.0 * SR); tt = np.arange(n) / SR                                              # final boom + warm chime
boom = np.sin(2 * np.pi * (40 + 25 * np.exp(-tt * 5)) * tt) * env(n, 0.005, 1.2)
chime = sum(np.sin(2 * np.pi * f * tt) * env(n, 0.01, 1.6) for f in (523.25, 659.25, 783.99, 1046.5)) / 4
place(boom * 0.7 + chime * 0.35, 28.95, 0.4)

st = np.stack([L, R], 1); st = np.clip(st, -1, 1)
with wave.open(out, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('sfx ok', out, round(DUR, 2), 's, peak', round(float(np.max(np.abs(st))), 3))
