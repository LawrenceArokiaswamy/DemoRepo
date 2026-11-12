# Film 32 "How Do I Send a Photo?" (88 s): piano score + foley -> out/mix.wav (no narration).
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/).
# Shots are 5 s each: 1 flashback | 2 screens | 3 she stops sharing | 4 the memory | 5 strangers | 6 phone face-down | 7 "I'm here" | 8 3 AM again | 9 put it down
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 88.0; N = int(DUR * SR); rng = np.random.default_rng(32)
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


# ================= score (timeline = story3.ts) =================
G, Em, C, D, Am = [55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57], [57, 60, 64]
THEME = [(0, 71, 1.0), (1.0, 74, .8), (2.0, 76, 1.8), (3.6, 74, 1.4)]          # the homecoming motif (B D E D)
def theme(t0, vel=.34, oct=0, k=1.0):
    for dt, m, d in THEME: piano(t0 + dt * k, m + oct, vel, d * k, .1)
# 0-6.4 arrival + hug: warm G major
piano(.3, 31, .3, 5.8, -.2); piano(.32, 43, .24, 5.8); arp(.3, G + [67, 62, 59], .45, 13, .26); strings(.4, G, 6.0, .05, att=2, rel=1, bright=2100); theme(1.2)
# 6.4-13.6 the couch: E minor, thinner; at "Right... okay" (12.0) it stops
piano(6.5, 28, .28, 5.4, -.2); arp(6.5, Em + [55], .7, 8, .2); piano(7.4, 71, .28, 2.0); piano(8.6, 67, .26, 1.4); piano(10.0, 69, .24, 1.6); piano(11.0, 66, .22, 1.0)
strings(6.5, [40, 47], 5.4, .04, att=2, rel=1.0, bright=900)
# 13.6-17.6 no answer: one low note holds, one high note as he looks down
piano(13.7, 40, .26, 3.6, -.1); piano(15.2, 64, .2, 2.4, .1)
# 17.6-26 night: music box version of the motif, high and slow; the photo (24.35) gets a warm chord
for k_, t0 in enumerate([18.2, 21.8]): theme(t0, .2, 12, 0.9)
piano(17.8, 43, .2, 4, -.2); piano(21.7, 40, .2, 4, -.2); strings(18.0, [55, 62], 8.0, .025, att=3, rel=2, bright=1400)
piano(24.4, 31, .3, 3.0, -.2); arp(24.4, G + [67], .35, 6, .24); piano(24.6, 74, .3, 2.0)
# 26-30 morning goodbye: plain C - Am, the reply (28.3) lands on a minor chord
piano(26.2, 36, .26, 2.0, -.2); arp(26.2, C + [60], .5, 4, .2); piano(28.3, 33, .3, 2.2, -.2); arp(28.3, Am, .5, 4, .2); piano(28.6, 64, .26, 1.6)
# 30-34 the car leaves: the motif falls, descending, unresolved
for i, (t0, m) in enumerate([(30.4, 76), (31.2, 74), (32.0, 71), (32.8, 69)]): piano(t0, m, .3 - i * .03, 1.6, .1)
piano(30.3, 31, .26, 3.8, -.2); strings(30.3, [43, 50, 59], 3.8, .04, att=1.5, rel=1.5, bright=1100)
# 34-44 phone screens: almost silence, a low drone grows under the texts; the last one gets a deep note and nothing
strings(36.0, [28, 35], 7.0, .03, att=4, rel=1.0, bright=500)
piano(42.35, 28, .42, 4.0, -.1); piano(42.37, 40, .3, 4.0, .1)
# 44-48 office: a soft dissonant cluster, then a falling line
strings(44.1, [52, 53, 59], 3.8, .03, att=1.5, rel=1.2, bright=800); piano(45.0, 64, .24, 1.2); piano(46.0, 62, .22, 1.2); piano(47.0, 59, .2, 1.4)
# 48-56 rain / alone: Em - C, slow
for t0, ch, b in [(48.2, Em, 28), (50.2, C, 36), (52.2, Em, 28), (54.2, C, 36)]: piano(t0, b, .24, 2.2, -.2); arp(t0, ch, .55, 4, .17)
strings(48.2, [40, 47, 55], 7.6, .035, att=3, rel=1.5, bright=900)
# 56-66 the drafts: the motif returns slowly in minor, building; "Not sent" beats get a low note; the last draft swells
for t0, ch, b in [(56.2, Em, 28), (57.8, C, 36), (59.4, G, 31), (61.0, D, 38), (62.6, Em, 28), (64.2, C, 36)]: piano(t0, b, .3, 1.8, -.2); arp(t0, ch + [ch[0] + 12], .4, 4, .22)
theme(56.6, .3, 0, 1.3); theme(61.4, .36, 0, 1.2)
for t0 in [57.2, 58.8, 60.4]: piano(t0, 40, .26, 1.0, .2)
strings(58.0, [52, 59, 64, 67], 8.0, .05, att=4, rel=.5, bright=1500)
# 66-71 the breakdown: full strings and piano peak, then they fall away
strings(66.0, [40, 52, 59, 64, 67], 5.0, .09, att=1.0, rel=2.2, bright=2000); piano(66.0, 28, .5, 4.5, -.2); piano(66.02, 40, .4, 4.5)
for t0, m in [(66.4, 76), (67.4, 74), (68.2, 71), (69.4, 72), (70.2, 71)]: piano(t0, m, .44, 1.4, .1)
# 71-83 years later: the homecoming theme returns, warm and whole; "He was trying to reach you" (79.8) resolves
piano(71.2, 31, .3, 5.6, -.2); arp(71.2, G + [67, 62, 59], .45, 12, .25); strings(71.4, G, 5.6, .045, att=2, rel=1, bright=2100); theme(72.2, .34)
piano(76.8, 36, .32, 3.0, -.2); arp(76.8, C + [64, 67], .45, 6, .26); theme(77.2, .38, 0, 1.1)
piano(79.8, 31, .45, 4.2, -.2); piano(79.82, 43, .36, 4.2); arp(79.8, G + [67, 71, 74], .4, 9, .3); strings(79.8, [43, 55, 59, 62, 67], 4.0, .09, att=.6, rel=1.4, bright=2300)
for t0, m in [(80.2, 79), (81.4, 78), (82.2, 76)]: piano(t0, m, .4, 1.6, .1)
# 83-88 the question: a last music-box echo of the motif, fading
theme(83.6, .18, 12, 1.0); piano(83.4, 31, .26, 4.4, -.2); strings(83.4, [55, 62, 67], 4.4, .04, att=1, rel=2, bright=1800)
def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2

mus = hall(mus); mus[-int(1.8 * SR):] *= np.linspace(1, 0, int(1.8 * SR))[:, None] ** 2
# ================= foley =================
def amb(t0, t1, x, g):
    i0, i1 = int(t0 * SR), int(t1 * SR); n = i1 - i0; y = np.stack([x[:n], np.roll(x[:n], 997)], 1)
    f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (.4 * SR))[:, None]; fx[i0:i1] += y * f * g
room = lp(noise(DUR), 220)
def crickets(t0, t1, n, g):
    for _ in range(n):
        tt = t_(.18); f = rng.uniform(4200, 5200); ch = np.sin(2 * np.pi * f * tt) * (np.sin(2 * np.pi * 32 * tt) > 0) * np.sin(np.pi * tt / .18)
        add(fx, ch, rng.uniform(t0, t1 - .2), g, rng.uniform(-.8, .8))
def birds(t0, t1, n, g):
    for _ in range(n):
        d = rng.uniform(.08, .2); tt = t_(d); f0 = rng.uniform(2800, 4200); f = f0 * (1 + .25 * np.sin(2 * np.pi * rng.uniform(15, 30) * tt))
        add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d), rng.uniform(t0, t1 - .2), g, rng.uniform(-.7, .7))
step = lambda: bp(noise(.08), 400, 2500) * np.exp(-t_(.08) / .03)
board = lambda: sfx.thump(.4, 90)
tick = lambda: bp(noise(.02), 3000, 7000) * np.exp(-t_(.02) / .004)
key = lambda: bp(noise(.03), 2500, 6000) * np.exp(-t_(.03) / .006)
def typing(t0, t1, g=.015):
    t = t0
    while t < t1:
        if np.sin(t * 2.3) > -.2: add(fx, key(), t, g, -.2)
        t += rng.uniform(.09, .2)
# porch arrival + hug
crickets(0, 6.4, 30, .006); amb(0, 6.4, room, .02)
for t0 in [.5, 1.05, 1.6, 2.15, 2.7]: add(fx, step(), t0, .03, .3)
add(fx, board(), 3.25, .05); add(fx, bp(noise(.6), 300, 1200) * np.sin(np.pi * t_(.6) / .6) ** 2, 3.3, .03)
# living room: clock, typing, the phone handed over (taps)
amb(6.4, 26, room, .012); t = 6.4
while t < 26: add(fx, tick(), t, .015, .4); t += 1.0
typing(6.6, 10.0); typing(12.5, 17.4)
for t0 in [10.55, 10.85, 11.15]: add(fx, bp(noise(.02), 1500, 4000) * np.exp(-t_(.02) / .005), t0, .03, .1)
# night: crickets outside, Dad's slow finger taps; the shutter + flash
crickets(17.6, 26, 18, .003)
for t0 in np.arange(18.3, 21.3, 1.2): add(fx, bp(noise(.02), 1500, 4000) * np.exp(-t_(.02) / .005), t0, .02, .2)
add(fx, bp(noise(.05), 1500, 6000) * np.exp(-t_(.05) / .012), 24.35, .06); add(fx, bp(noise(.04), 1000, 4000) * np.exp(-t_(.04) / .01), 24.43, .05)
add(fx, np.sin(2 * np.pi * 3500 * t_(.25)) * np.exp(-t_(.25) / .08), 24.36, .01)
# morning: birds, the car door, the engine pulling away over gravel
birds(26, 34, 26, .006); amb(26, 34, room, .015)
add(fx, sfx.thump(.5, 70), 29.9, .1); add(fx, bp(noise(.08), 200, 900) * np.exp(-t_(.08) / .02), 29.9, .05)
eng_t = t_(3.7); eng = (np.sin(2 * np.pi * (38 + 6 * eng_t) * eng_t) + .5 * np.sin(2 * np.pi * (76 + 12 * eng_t) * eng_t)) * np.exp(-eng_t / 1.6)
add(fx, lp(eng, 400), 30.3, .12, .3); add(fx, bp(noise(3.4), 300, 2500) * np.exp(-t_(3.4) / 1.2) * .5, 30.6, .04, .3)
# office phone face down: three buzzes on wood, the flip; texts arrive with soft pings
amb(34, 48, lp(noise(DUR), 400), .01)
for t0 in [34.15, 34.7]: add(fx, lp(np.sin(2 * np.pi * 150 * t_(.4)) * (np.sin(2 * np.pi * 25 * t_(.4)) > 0), 600), t0, .05)
add(fx, sfx.thump(.4, 120), 35.95, .07); add(fx, sfx.click(.6), 35.95, .03)
ping = lambda: (np.sin(2 * np.pi * 1318 * t_(.5)) * .6 + np.sin(2 * np.pi * 1975 * t_(.5)) * .4) * np.exp(-t_(.5) / .12)
for t0 in [37.5, 39.1, 40.7, 42.3]: add(fx, ping(), t0, .03, .1)
# rain on the porch roof, a far thunder
rain = hp(bp(noise(9.0), 800, 9000), 500); drips = np.zeros(int(9 * SR))
for _ in range(220): i = rng.integers(0, len(drips) - 2800); drips[i:i + 2800] += bp(noise(.06), 1500, 5000)[:2800] * np.exp(-t_(.06)[:2800] / .01) * rng.uniform(.2, 1)
amb(47.6, 56.6, rain + drips * .5, .05); add(fx, lp(noise(2.5), 120) * np.exp(-t_(2.5) / .9), 49.0, .25)
amb(52, 56, room, .012)
# drafts + breakdown: just the room
amb(56, 71, room, .01)
# years later: birds, the boy's running feet on the boards, the chair creaks
birds(71, 88, 40, .006); amb(71, 88, room, .015)
for t0 in np.arange(71.3, 73.5, .22): add(fx, step(), t0, .025, -.3)
for t0 in [76.9, 78.6, 80.4]: add(fx, bp(noise(.5), 250, 900) * np.sin(np.pi * t_(.5) / .5) ** 2, t0, .02)

mus *= .5 / np.sqrt((mus[int(1 * SR):int(70 * SR)] ** 2).mean()); fx *= 4.0
mix = mus * .5 + fx; mix = hp(mix.T, 30).T; sc = .7 / np.abs(mix).max(); mix *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT'); print('mix written', mix.shape[0] / SR)
