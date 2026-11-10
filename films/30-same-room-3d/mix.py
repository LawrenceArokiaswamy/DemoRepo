# Film 28 "Same Room" (toy-3D): same piano score as film 26 + foley -> out/mix.wav (no narration).
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/).
# Shots are 5 s each: 1 flashback | 2 screens | 3 she stops sharing | 4 the memory | 5 strangers | 6 phone face-down | 7 "I'm here" | 8 3 AM again | 9 put it down
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 45.0; N = int(DUR * SR); rng = np.random.default_rng(26)
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

# 1 flashback (0-5): warm D major, bright arpeggio
piano(.2, 38, .32, 5.0, -.2); piano(.22, 50, .26, 5.0); arp(.2, [62, 66, 69, 74, 69, 66], .4, 12, .3); strings(.3, [62, 66, 69], 4.4, .05, att=1.5, rel=.6, bright=2200)
mel = [(1.0, 78, 1.2), (2.2, 76, .8), (3.0, 74, 1.8)]
for t, m, d in mel: piano(t, m, .38, d, .1)
# 2-5 the present (5-25): B minor / G / D / A, the figure thins out, melody sparse and falling
prog = [(5.2, 35, [59, 62, 66]), (7.7, 31, [59, 62, 67]), (10.2, 38, [57, 62, 66]), (12.7, 33, [57, 61, 64]), (15.2, 35, [59, 62, 66]), (17.7, 31, [55, 59, 62]), (20.2, 38, [57, 62, 66]), (22.7, 33, [57, 61, 64])]
for t, b, ns in prog:
    piano(t, b, .28, 2.9, -.2); arp(t, ns + [ns[1]], .62, 4, .22 if t < 15 else .19)
for t, m, d in [(5.4, 74, 2.2), (7.9, 71, 2.0), (10.4, 69, 2.0), (12.0, 66, 1.4), (12.9, 64, 2.0), (16.0, 71, 2.6), (18.2, 74, 2.0), (20.4, 76, 1.6), (21.6, 74, 1.4), (23.0, 73, 2.0)]: piano(t, m, .3, d, .05)
strings(5.2, [47, 54], 19.6, .035, att=4, rel=1.2, bright=900)
# 4 the memory (15-20): a soft music-box echo of the flashback figure, high and far
for k, m in enumerate([86, 90, 93, 98, 93, 90]): piano(15.4 + k * .4, m, .18, 1.6, .35)
# 6 phone face-down (25-30): the music falls away to one low note and room tone
piano(25.0, 26, .3, 5.5, -.1); piano(25.02, 38, .22, 5.5)
cut = int(25.3 * SR); fade = int(1.4 * SR); mus[cut:cut + fade] *= np.linspace(1, .25, fade)[:, None]; mus[cut + fade:int(30 * SR)] *= .25
# 7 "I'm here" (30-35): strings rise, piano returns gently
strings(30.0, [50, 57, 62, 66], 5.2, .07, att=3.5, rel=.8, bright=1700)
for t, m, d in [(30.6, 66, 1.4), (31.8, 69, 1.4), (33.0, 71, 1.0), (33.8, 69, 1.6)]: piano(t, m, .32, d)
piano(30.2, 31, .3, 4.8, -.2)
# 8 3 AM again (35-40) and 9 put it down (40-45): the flashback theme returns, full and warm, resolving in D major
piano(35.0, 38, .4, 5, -.2); piano(35.02, 50, .32, 5); arp(35.0, [62, 66, 69, 74, 69, 66], .4, 12, .3)
for t, m, d in [(35.6, 78, 1.2), (36.8, 76, .8), (37.6, 74, 1.4), (38.6, 76, .8), (39.4, 78, 1.0)]: piano(t, m, .42, d, .1)
strings(35.0, [62, 66, 69, 74], 5.0, .08, att=1.2, rel=.8, bright=2200)
piano(40.0, 31, .38, 2.4, -.2); piano(42.3, 38, .42, 3.0, -.2); arp(40.0, [62, 67, 71, 74], .45, 5, .28); arp(42.3, [62, 66, 69, 74, 78], .42, 5, .28)
for t, m, d in [(40.2, 81, 1.6), (41.8, 79, .6), (42.4, 78, 2.6)]: piano(t, m, .4, d, .1)
strings(40.0, [55, 62, 67, 71], 2.3, .08, att=.6, rel=.4, bright=2200); strings(42.3, [50, 62, 66, 69, 74], 2.7, .09, att=.4, rel=1.8, bright=2400)

def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2
mus = hall(mus)
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# ---------------- foley ----------------
room = lp(noise(DUR), 200); add2(fx, np.stack([room, np.roll(room, 700)], 1), 0, .018)
def tap(): return bp(noise(.03), 2500, 6000) * np.exp(-t_(.03) / .006)
for t0, t1 in [(5.3, 9.8), (10.2, 11.0), (12.8, 14.8), (20.3, 24.8)]:
    t = t0
    while t < t1: add(fx, tap(), t, .02, rng.uniform(-.3, .3)); t += rng.uniform(.35, .9)
tt = t_(.6); add(fx, (np.sin(2 * np.pi * 1568 * tt) * .5 + np.sin(2 * np.pi * 2349 * tt) * .3) * np.exp(-tt / .15), 15.3, .03, .2)   # memory notification
add(fx, sfx.thump(.5, 150), 26.3, .12); add(fx, sfx.click(.7), 26.3, .03)                                                               # phone face-down
add(fx, sfx.click(1.2), 35.1, .06, .3)                                                                                                  # lamp switch
add(fx, bp(noise(.5), 200, 2000) * np.sin(np.pi * t_(.5) / .5) ** 2, 30.4, .02)                                                       # fabric shift as he moves closer

mus *= .5 / np.sqrt((mus[int(1 * SR):int(24 * SR)] ** 2).mean()); fx *= 4.0
mix = mus * .5 + fx; mix = hp(mix.T, 30).T; sc = .7 / np.abs(mix).max(); mix *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True)
sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_music.wav', (mus * .5 * sc).astype(np.float32), SR, subtype='FLOAT'); sf.write(f'{H}/out/stem_sfx.wav', (fx * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_vo.wav', np.zeros((N, 2), np.float32), SR, subtype='FLOAT'); print('mix written')
