# Look test 37 (10 s): a few piano notes + room foley -> out/mix.wav
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0), samples shared with film 32.
# The thread is an original "kitchen waltz" in D: piano score -> the little kitchen radio -> three lonely notes in the garage
# -> silence -> a cello in D minor in the rain -> the tinny phone speaker at the wedding -> full piano + strings when Sam steps in.
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 10.0; N = int(DUR * SR); rng = np.random.default_rng(37)
mus = np.zeros((N, 2)); radio = np.zeros((N, 2)); phone = np.zeros((N, 2)); fx = np.zeros((N, 2)); vo = np.zeros((N, 2))
mt = lambda m: 440 * 2 ** ((m - 69) / 12)
def add2(buf, x, t, g=1.):
    i = int(t * SR); e = min(len(buf), i + len(x))
    if e > i: buf[i:e] += x[:e - i] * g
NAMES = {9: 'A', 0: 'C', 3: 'D#', 6: 'F#'}; SAMP = {}
def sample(layer, m):
    base = min([b for b in range(21, 109) if b % 12 in NAMES], key=lambda b: abs(b - m)); key = (layer, base)
    if key not in SAMP: d, _ = sf.read(f"{H}/../32-send-a-photo/samples/v{layer}/{NAMES[base % 12]}{base // 12 - 1}v{layer}.ogg"); SAMP[key] = d[:int(9 * SR)]
    d = SAMP[key]; st = m - base
    if st == 0: return d
    up, down = {1: (89, 84), -1: (84, 89)}[st]; return resample_poly(d, down, up, axis=0)
def piano(t, m, vel=.4, dur=4.0, pan=0., buf=None):
    buf = mus if buf is None else buf
    layer = 4 if vel < .42 else (8 if vel < .75 else 12)
    d = sample(layer, m).copy(); n = min(len(d), int((dur + 1.2) * SR)); d = d[:n]
    rel = int(min(n, dur * SR)); f = np.ones(n); f[rel:] = np.exp(-np.arange(n - rel) / (.35 * SR)); d *= f[:, None]
    g = (.55 + .9 * vel) * (1 if layer == 4 else .8 if layer == 8 else .65); i = int(t * SR); e = min(N, i + n)
    if e <= i: return
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); buf[i:e, 0] += d[:e - i, 0] * g * L * 1.41; buf[i:e, 1] += d[:e - i, 1] * g * R * 1.41
def strings(t, ms, d, v=1., att=1.5, rel=2., bright=1500, vib=4.6, buf=None, spread=.003):
    buf = mus if buf is None else buf
    d = d + rel; tt = t_(d); out = np.zeros((len(tt), 2))
    for m in ms:
        for k in range(5):
            f = mt(m) * (1 + (k - 2) * spread) * (1 + .0025 * np.sin(2 * np.pi * (vib + k * .3) * tt + k)); x = 2 * ((np.cumsum(f) / SR + rng.random()) % 1) - 1
            p = (k - 2) / 2.5; out[:, 0] += x * (1 - p) * .5; out[:, 1] += x * (1 + p) * .5
    out = lp(lp(out.T, bright), bright * 1.3).T / (len(ms) * 5); e = np.minimum(1, (tt / att) ** 1.5) * np.minimum(1, np.maximum(0, d - tt) / rel)
    add2(buf, out * e[:, None] * v, t)
def cello(t, m, d, v=1.):
    """one bowed note: a darker, slower string voice with a soft bow attack"""
    strings(t, [m], d, v, att=.45, rel=.9, bright=900, vib=5.2, spread=.0015)
def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2


# quiet piano: a slow, warm D-major phrase that settles as the light goes out
for t0, m, v in [(0.3, 50, .22), (0.32, 62, .18), (1.6, 66, .16), (2.9, 69, .17), (4.4, 74, .16), (5.6, 73, .15), (6.6, 69, .18),
                 (6.62, 57, .14), (8.6, 62, .16), (8.62, 50, .18), (8.65, 66, .14)]:
    piano(t0, m, v, 3.5, .1)
strings(0.0, [50, 57, 62], 10.0, .035, att=3.0, rel=1.5, bright=900)
mus = hall(mus, 3.6, .4)
def amb(t0, t1, x, g, pan=0.):
    n = int((t1 - t0) * SR); x = np.resize(x, n); f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (.25 * SR)); add(fx, x * f, t0, g, pan)
def rustle(d=.4): return bp(noise(d), 800, 6000) * (rng.random(int(d * SR)) ** 3) * np.sin(np.pi * t_(d) / d)
room = bp(noise(2.0), 60, 500) * .5
amb(0, 10, room, .012)
add(fx, rustle(1.2), 5.0, .03, .2)                                         # sleeve as she reaches
add(fx, bp(noise(.06), 300, 2500) * np.exp(-t_(.06) / .015), 6.6, .05, .3)  # palm on the door
click = bp(noise(.03), 1200, 5000) * np.exp(-t_(.03) / .006); add(fx, lp(click, 1800), 8.45, .08, .4)   # the switch, behind the door
add(fx, bp(noise(1.4), 200, 1500) * np.sin(np.pi * t_(1.4) / 1.4) ** 2, 8.9, .02, -.1)   # her slow breath out
mus *= .5 / np.sqrt((mus[int(.5 * SR):int(9.5 * SR)] ** 2).mean()); fx *= 4.0
mix_ = mus * .45 + fx; mix_ = hp(mix_.T, 30).T; mix_ *= .7 / np.abs(mix_).max()
for ch in range(2): mix_[:, ch] = sfx.limit(mix_[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix_.astype(np.float32), SR, subtype='FLOAT'); print('mix written')
