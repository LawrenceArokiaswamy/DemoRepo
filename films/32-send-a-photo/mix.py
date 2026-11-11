# Film 32 look test: piano score + foley -> out/mix.wav (no narration).
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/).
# Shots are 5 s each: 1 flashback | 2 screens | 3 she stops sharing | 4 the memory | 5 strangers | 6 phone face-down | 7 "I'm here" | 8 3 AM again | 9 put it down
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 12.0; N = int(DUR * SR); rng = np.random.default_rng(32)
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

# 0-6 porch: warm G major, rising; 6-12 couch: the figure thins out to E minor, a held note under "how do I send a photo?"
piano(.3, 31, .3, 5.5, -.2); piano(.32, 43, .24, 5.5); arp(.3, [55, 59, 62, 67, 62, 59], .45, 12, .26); strings(.4, [55, 59, 62], 5.6, .05, att=2, rel=1, bright=2100)
for t, m, d in [(1.2, 71, 1.0), (2.2, 74, .8), (2.9, 76, 1.6), (4.4, 74, 1.4)]: piano(t, m, .34, d, .1)
piano(6.1, 28, .28, 5.8, -.2); arp(6.1, [52, 55, 59, 55], .7, 6, .2); piano(7.2, 71, .28, 2.2); piano(9.6, 67, .26, 2.0)
strings(6.1, [40, 47], 5.8, .04, att=2.5, rel=1.4, bright=900)
def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2
mus = hall(mus)
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# foley
SR_ = SR; room = lp(noise(DUR), 220)
out_amb = np.zeros(N); i6 = int(6.0 * SR)
for k in range(28):                                   # crickets at golden hour (porch only)
    t0 = rng.uniform(0, 5.8); f = rng.uniform(4200, 5200); tt = t_(.18)
    ch = np.sin(2 * np.pi * f * tt) * (np.sin(2 * np.pi * 32 * tt) > 0) * np.sin(np.pi * tt / .18)
    add(fx, ch, t0, .006, rng.uniform(-.8, .8))
add2(fx, np.stack([room, np.roll(room, 900)], 1)[:i6] * 1.0, 0, .02)
for t0 in [.45, 1.0, 1.55]: add(fx, sfx.thump(.4, 90), t0, .05, .2)    # footsteps on porch boards
add(fx, bp(noise(.6), 300, 1200) * np.sin(np.pi * t_(.6) / .6) ** 2, 2.0, .03)  # board creak / clothes as they hug
tick = lambda: bp(noise(.02), 3000, 7000) * np.exp(-t_(.02) / .004)
t = 6.0
while t < 12: add(fx, tick(), t, .02, .4); t += 1.0                       # mantel clock
t = 6.2
while t < 11.8:
    if np.sin(t * 2.3) > 0: add(fx, bp(noise(.03), 2500, 6000) * np.exp(-t_(.03) / .006), t, .015, -.2)
    t += rng.uniform(.09, .2)                                              # laptop keys
add2(fx, np.stack([room, room], 1)[i6:] * 1.0, 6.0, .012)
mus = hall(mus); mus[-int(.9 * SR):] *= np.linspace(1, 0, int(.9 * SR))[:, None] ** 2
mus *= .5 / np.sqrt((mus ** 2).mean()); fx *= 4.0
mix = mus * .5 + fx; mix = hp(mix.T, 30).T; mix *= .7 / np.abs(mix).max()
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT'); print('mix written')
