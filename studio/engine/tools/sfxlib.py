"""Studio SFX library (original, numpy only): renders a typed cue sheet + ambience presets to a stereo WAV.
usage: sfxlib.py cues.json out.wav "sea,wind,masons"
Event types: step, scrape, whoosh(dur,hi), plop, sizzle(peak,end), bubble, clunk(gain), roll, scuff, thud, chisel, tick, bell, clank."""
import sys, json, wave, numpy as np
C = json.load(open(sys.argv[1])); AMB = [a for a in (sys.argv[3] if len(sys.argv) > 3 else '').split(',') if a]
SR = 48000; DUR = C['duration']; N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(5); tt = np.arange(N) / SR
def filt(x, fc, high=False, order=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); r = (f / fc) ** (2 * order); H = np.sqrt(r / (1 + r)) if high else 1 / np.sqrt(1 + r); return np.fft.irfft(X * H, len(x))
def band(x, lo, hi): return filt(filt(x, lo, True), hi)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
def nz(n): return rng.standard_normal(n)
def place(s, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    s = s[:N - i]; L[i:i + len(s)] += s * g * np.sqrt(0.5 * (1 - pan)); R[i:i + len(s)] += s * g * np.sqrt(0.5 * (1 + pan))
def partials(f, dur, parts, damp):
    n = int(dur * SR); t = np.arange(n) / SR; return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (damp + damp * 0.4 * m)) for m, a in parts)
def whoosh(dur, f0, f1):
    n = int(dur * SR); x = nz(n); out = np.zeros(n); seg = n // 8
    for k in range(8): fc = f0 + (f1 - f0) * k / 7; out[k * seg:(k + 1) * seg] = band(x, fc * 0.6, fc * 1.6)[k * seg:(k + 1) * seg]
    return out * np.sin(np.linspace(0, np.pi, n)) ** 2
def S_step(e): n = int(0.11 * SR); return (band(nz(n), 600, 3500) * env(n, 0.004, 0.035) + filt(nz(n), 250) * env(n, 0.002, 0.02) * 2), 0.22, 0.3
def S_scrape(e): n = int(0.35 * SR); return band(nz(n), 400, 2500) * env(n, 0.05, 0.12), 0.12, 0.2
def S_whoosh(e): return (whoosh(e.get('dur', 0.4), 900, 2500) if e.get('hi') else whoosh(e.get('dur', 0.4), 500, 1800)), 0.33, 0.1
def S_plop(e):
    n = int(0.09 * SR); t = np.arange(n) / SR; f = 520 * np.exp(-t * 18) + 140
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.03) + filt(nz(n), 900) * env(n, 0.001, 0.01) * 0.6, 0.16 + rng.uniform(0, 0.08), rng.uniform(-0.2, 0.2)
def S_sizzle(e):
    n = int((e.get('end', DUR) - e['t']) * SR); t = e['t'] + np.arange(n) / SR; pk = e.get('peak', e['t'] + 1)
    lvl = np.clip((t - e['t']) / 0.9, 0, 1) * 0.35 + np.exp(-((t - pk) / 0.55) ** 2) * 0.9; lvl = np.where(t > pk + 0.4, np.maximum(lvl, 0.38 * np.exp(-(t - pk - 0.4) / 6)), lvl)
    crack = filt((rng.random(n) < 0.0016) * nz(n) * 4, 1500, True) * np.clip(lvl * 2, 0, 1); return band(nz(n), 2800, 9000) * lvl + crack * 0.35, 0.32, -0.05
def S_bubble(e): m = int(0.05 * SR); tb = np.arange(m) / SR; return np.sin(2 * np.pi * (300 + 500 * rng.random()) * tb * (1 + tb * 8)) * env(m, 0.002, 0.012), 0.06, rng.uniform(-0.3, 0.3)
def S_clunk(e): n = int(0.3 * SR); return partials(430 + 60 * rng.random(), 0.3, [(1, 1), (1.7, 0.6), (2.9, 0.35)], 28) + band(nz(n), 500, 4000) * env(n, 0.0005, 0.012), 0.5, 0.4
def S_roll(e): n = int(0.55 * SR); return band(nz(n), 200, 1200) * env(n, 0.03, 0.2) * (0.6 + 0.4 * np.sin(np.arange(n) / SR * 2 * np.pi * 9)), 0.18, 0.4
def S_scuff(e): m = int(0.18 * SR); return band(nz(m), 300, 2500) * env(m, 0.01, 0.07), 0.22, 0.4
def S_thud(e): m = int(0.5 * SR); tb = np.arange(m) / SR; return np.sin(2 * np.pi * (85 - 30 * tb) * tb) * env(m, 0.003, 0.12) * 1.4 + band(nz(m), 300, 2000) * env(m, 0.005, 0.15) * 0.5, 0.55, 0.3
def S_chisel(e): n = int(0.12 * SR); return partials(1900 + rng.uniform(-150, 150), 0.12, [(1, 1), (2.7, 0.5), (4.1, 0.3)], 40) + filt(nz(n), 2500, True) * env(n, 0.0005, 0.008), 0.035, -0.5
def S_tick(e): n = int(0.05 * SR); return filt(nz(n), 2100, True) * env(n, 0.0005, 0.006) + np.sin(2 * np.pi * 3000 * np.arange(n) / SR) * env(n, 0.0005, 0.01) * 0.4, 0.18, 0
def S_bell(e): return partials(1180, 0.8, [(1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)], 3) / 1.9, 0.4, 0
def S_clank(e): return partials(620, 0.25, [(1, 1), (1.53, 0.7), (2.41, 0.5), (3.9, 0.3)], 18), 0.3, 0.3
# ambience presets
if 'sea' in AMB:
    sw = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 6.5) ** 2; sea = filt(nz(N), 500) * sw + filt(nz(N), 1800, True) * 0.08 * sw ** 3; sea /= np.abs(sea).max()
    place(sea, 0, 0.10, -0.2); place(np.roll(sea, 30000), 0, 0.10, 0.3)
if 'wind' in AMB: w = band(nz(N), 300, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 9 + 1)); place(w / np.abs(w).max(), 0, 0.035)
if 'room' in AMB: place(filt(nz(N), 300) * 0.5 + filt(nz(N), 2000, True) * 0.03, 0, 0.05)
if 'masons' in AMB:
    for t0 in np.sort(rng.uniform(0.3, DUR - 0.3, int(DUR * 0.8))): s, g, p = S_chisel({}); place(s, t0, g, p)
for e in C['events']:
    fn = globals().get('S_' + e['type'])
    if not fn: print('unknown cue', e['type']); continue
    s, g, p = fn(e); place(s, e['t'], g * e.get('gain', 1), e.get('pan', p))
st = np.stack([L, R], 1); st = st / max(1.0, np.abs(st).max() / 0.85)
with wave.open(sys.argv[2], 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('sfx ok', len(C['events']), 'events')
