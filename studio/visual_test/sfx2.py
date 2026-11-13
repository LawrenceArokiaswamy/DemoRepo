import sys, wave, numpy as np
SR = 48000; DUR = 8.0; N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(3)
def filt(x, fc, high=False, order=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); r = (f / fc) ** (2 * order); H = np.sqrt(r / (1 + r)) if high else 1 / np.sqrt(1 + r); return np.fft.irfft(X * H, len(x))
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
def place(s, t, g=1.0, pan=0.0):
    i = int(t * SR); s = s[:max(0, N - i)]; L[i:i + len(s)] += s * g * np.sqrt(0.5 * (1 - pan)); R[i:i + len(s)] += s * g * np.sqrt(0.5 * (1 + pan))
def nz(n): return rng.standard_normal(n)
def tick(f=3200, g=1.0):
    n = int(0.05 * SR); return (filt(nz(n), f * 0.7, True) * env(n, 0.0005, 0.006) + np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, 0.0005, 0.01) * 0.4) * g
def bell(f0, dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR; return sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * (3 + 4 * m)) for m, a in [(1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)]) / 1.9
# room tone
place(filt(nz(N), 300) * 0.5 + filt(nz(N), 2000, True) * 0.03, 0, 0.05)
# ticking: steady, then faster while he laughs
t = 0.1
while t < 3.6: place(tick(3000 if int(t * 10) % 2 else 2600), t, 0.18, 0.15); t += 0.5 if t < 2.4 else 0.16
place(tick(1800, 2) + filt(nz(int(0.12 * SR)), 900)[: int(0.05 * SR)] * 0, 1.0, 0.4, 0.1)                            # twitch clack
n = int(1.15 * SR); place(filt(nz(n), 2500, True) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * np.arange(n) / SR)) * env(n, 0.05, 0.9) * 0.6, 2.45, 0.12)  # rattle
# the spring: boing (pitch-wobble) + big bell clang + flash whoosh
n = int(0.9 * SR); tt = np.arange(n) / SR; place(np.sin(2 * np.pi * (180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 3)) * tt) * env(n, 0.002, 0.45), 3.6, 0.45, 0.1)
place(bell(1180, 1.4), 3.62, 0.45, 0.15); place(filt(nz(int(0.4 * SR)), 1500, True) * env(int(0.4 * SR), 0.01, 0.15), 3.6, 0.25)
# landing clank, then frantic ringing with hops
place(filt(nz(int(0.3 * SR)), 600) * env(int(0.3 * SR), 0.001, 0.06) + bell(820, 0.3) * 0.6, 4.55, 0.5)
k = 4.6
while k < 6.25: place(bell(1180 + rng.uniform(-20, 20), 0.25), k, 0.22, rng.uniform(-0.3, 0.4)); k += 0.055
for hop in np.linspace(4.7, 6.1, 8): place(filt(nz(int(0.08 * SR)), 900) * env(int(0.08 * SR), 0.001, 0.02), hop, 0.35, 0.2)
# fall + crash
n = int(0.35 * SR); place(filt(nz(n), 3000, True) * np.linspace(0, 1, n) * 0.6, 6.25, 0.2)
n = int(1.2 * SR); place(filt(nz(n), 1200) * env(n, 0.001, 0.25) + filt(nz(n), 4000, True) * env(n, 0.001, 0.08) * 0.6 + bell(640, 1.2) * 0.5, 6.6, 0.55)
place(bell(1180, 1.5), 7.6, 0.25, 0.2)                                                                               # one last lonely ding
st = np.stack([L, R], 1); st = st / max(1.0, np.abs(st).max() / 0.85)
with wave.open(sys.argv[1], 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('ok peak', float(np.abs(st).max()))
