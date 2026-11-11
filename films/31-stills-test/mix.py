# Film 31 stills test: piano score -> out/mix.wav (no narration).
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/).
# Shots are 5 s each: 1 flashback | 2 screens | 3 she stops sharing | 4 the memory | 5 strangers | 6 phone face-down | 7 "I'm here" | 8 3 AM again | 9 put it down
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 12.6; N = int(DUR * SR); rng = np.random.default_rng(31)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); mt = lambda m: 440 * 2 ** ((m - 69) / 12)
def add2(buf, x, t, g=1.):
    i = int(t * SR); e = min(len(buf), i + len(x))
    if e > i: buf[i:e] += x[:e - i] * g
NAMES = {9: 'A', 0: 'C', 3: 'D#', 6: 'F#'}; SAMP = {}
def sample(layer, m):
    base = min([b for b in range(21, 109) if b % 12 in NAMES], key=lambda b: abs(b - m)); key = (layer, base)
    if key not in SAMP: d, _ = sf.read(f"{H}/samples/v{layer}/{NAMES[base % 12]}{base // 12 - 1}v{layer}.ogg"); SAMP[key] = d[:int(9 * SR)]
    d = SAMP[key]; st = m - base
    if st == 0: return d
    up, down = {1: (89, 84), -1: (84, 89)}[st]; return resample_poly(d, down, up, axis=0)
def piano(t, m, vel=.4, dur=4.0, pan=0.):
    layer = 4 if vel < .42 else (8 if vel < .75 else 12)
    d = sample(layer, m).copy(); n = min(len(d), int((dur + 1.2) * SR)); d = d[:n]
    rel = int(min(n, dur * SR)); f = np.ones(n); f[rel:] = np.exp(-np.arange(n - rel) / (.35 * SR)); d *= f[:, None]
    g = (.55 + .9 * vel) * (1 if layer == 4 else .8 if layer == 8 else .65); i = int(t * SR); e = min(N, i + n)
    if e <= i: return
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); mus[i:e, 0] += d[:e - i, 0] * g * L * 1.41; mus[i:e, 1] += d[:e - i, 1] * g * R * 1.41
def strings(t, ms, d, v=1., att=1.5, rel=2., bright=1500):
    d = d + rel; tt = t_(d); out = np.zeros((len(tt), 2))
    for m in ms:
        for k in range(5):
            f = mt(m) * (1 + (k - 2) * .003) * (1 + .0025 * np.sin(2 * np.pi * (4.6 + k * .3) * tt + k)); x = 2 * ((np.cumsum(f) / SR + rng.random()) % 1) - 1
            p = (k - 2) / 2.5; out[:, 0] += x * (1 - p) * .5; out[:, 1] += x * (1 + p) * .5
    out = lp(lp(out.T, bright), bright * 1.3).T / (len(ms) * 5); e = np.minimum(1, (tt / att) ** 1.5) * np.minimum(1, np.maximum(0, d - tt) / rel)
    add2(mus, out * e[:, None] * v, t)
def arp(t0, notes, step, n, vel, pan=.18):
    for k in range(n): piano(t0 + k * step, notes[k % len(notes)], vel * (.88 + .24 * rng.random()), step * 4, pan if k % 2 else -pan)

# shot 1 memory (0-3.4): warm D major | 2-3 present (2.8-8.6): B minor, G | 4 phones down (8.6-12.6): resolve to D
piano(.15, 38, .3, 3.0, -.2); arp(.15, [62, 66, 69, 74, 69, 66], .4, 7, .28); strings(.2, [62, 66, 69], 2.8, .05, att=1.2, rel=.5, bright=2200)
for t, m, d in [(.7, 78, 1.0), (1.7, 76, .7), (2.4, 74, 1.0)]: piano(t, m, .36, d, .1)
piano(3.0, 35, .28, 2.8, -.2); arp(3.0, [59, 62, 66, 62], .62, 4, .2); piano(3.2, 74, .3, 1.8); piano(4.6, 71, .28, 1.4)
piano(5.8, 31, .28, 2.8, -.2); arp(5.8, [59, 62, 67, 62], .62, 4, .18); piano(6.0, 69, .28, 1.4); piano(7.0, 66, .26, 1.6)
strings(3.0, [47, 54], 5.6, .035, att=2.5, rel=.8, bright=900)
piano(8.8, 38, .38, 3.6, -.2); piano(8.82, 50, .3, 3.6); arp(8.8, [62, 66, 69, 74, 78], .42, 6, .27)
for t, m, d in [(9.0, 81, 1.4), (10.4, 79, .5), (10.9, 78, 1.8)]: piano(t, m, .38, d, .1)
strings(8.8, [50, 62, 66, 69, 74], 3.6, .08, att=.8, rel=1.2, bright=2300)
def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2
mus = hall(mus)
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

mus *= .5 / np.sqrt((mus ** 2).mean()); mix = hp(mus.T, 30).T * .5
room = lp(noise(DUR), 200); add2(mix, np.stack([room, np.roll(room, 700)], 1), 0, .05)
mix *= .7 / np.abs(mix).max()
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT'); print('mix written')
