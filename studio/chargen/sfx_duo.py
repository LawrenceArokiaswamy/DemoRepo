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
t = 0.1
while t < 3.0:
    if abs(t - 1.0) > 0.15 and abs(t - 2.6) > 0.15: place(tick(3000 if int(t * 10) % 2 else 2600), t, 0.18, 0.0)
    t += 0.45
place(tick(1800, 2), 1.0, 0.4); place(tick(2000, 1.6), 2.6, 0.3)                           # twitches
n = int(0.42 * SR); place(filt(nz(n), 2500, True) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * np.arange(n) / SR)) * env(n, 0.05, 0.3) * 0.6, 3.0, 0.15)
n = int(0.9 * SR); tt = np.arange(n) / SR; place(np.sin(2 * np.pi * (180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 3)) * tt) * env(n, 0.002, 0.45), 3.4, 0.45)   # spring
place(bell(1180, 1.4), 3.42, 0.45); place(filt(nz(int(0.4 * SR)), 1500, True) * env(int(0.4 * SR), 0.01, 0.15), 3.4, 0.25)
def clank(f, g):  # armour plates: inharmonic metal partials
    n = int(0.25 * SR); tt = np.arange(n) / SR; return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (18 + 6 * m)) for m, a in [(1, 1), (1.53, 0.7), (2.41, 0.5), (3.9, 0.3)]) * g + filt(nz(n), 3000, True) * env(n, 0.0005, 0.01) * 0.5 * g
place(clank(620, 1), 3.45, 0.35, 0.4); place(clank(540, 0.8), 3.62, 0.3, 0.4)            # soldier jolts
for k, tt0 in enumerate([3.98, 4.16, 4.34]): place(clank(700 - k * 40, 0.6), tt0, 0.25, 0.45); place(filt(nz(int(0.08 * SR)), 500) * env(int(0.08 * SR), 0.001, 0.03), tt0, 0.3, 0.45)  # backing steps
place(filt(nz(int(0.3 * SR)), 600) * env(int(0.3 * SR), 0.001, 0.06) + bell(820, 0.3) * 0.6, 4.2, 0.5)      # clock lands
k = 4.25
while k < 8.0: place(bell(1180 + rng.uniform(-20, 20), 0.25), k, 0.2 * max(0.2, 1 - (k - 4.25) / 4.5), rng.uniform(-0.2, 0.2)); k += 0.055
for hop in np.linspace(4.4, 7.6, 7): place(filt(nz(int(0.08 * SR)), 900) * env(int(0.08 * SR), 0.001, 0.02), hop, 0.3 * (1 - (hop - 4.4) / 5), 0.0)
place(clank(660, 0.5), 6.35, 0.2, 0.4)   # helmet scratch
st = np.stack([L, R], 1); st = st / max(1.0, np.abs(st).max() / 0.85)
with wave.open(sys.argv[1], 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('ok peak', float(np.abs(st).max()))
