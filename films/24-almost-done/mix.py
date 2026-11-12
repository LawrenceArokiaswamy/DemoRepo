# "Almost Done" — score + sound design -> out/mix.wav and stems. No narration.
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (fetched into samples/).
# Strings, ambience and foley are synthesised here. Timing comes from events.json (exported by the page) and the cue sheet below.
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_, norm
H = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(f'{H}/events.json'))['ev']; DUR = 87.0; N = int(DUR * SR)
rng = np.random.default_rng(24)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
mt = lambda m: 440 * 2 ** ((m - 69) / 12)
def add2(buf, x, t, g=1.):
    i = int(t * SR); e = min(len(buf), i + len(x))
    if e > i: buf[i:e] += x[:e - i] * g
def env(d, a=.005, r=.05):
    tt = t_(d); return np.minimum(1, tt / max(a, 1e-4)) * np.minimum(1, np.maximum(0, d - tt) / max(r, 1e-4))

# ---------------- piano (sampled) ----------------
NAMES = {9: 'A', 0: 'C', 3: 'D#', 6: 'F#'}
SAMP = {}
def sample(layer, m):
    # nearest sampled note (every minor third), pitch-shifted by resampling
    base = min([b for b in range(21, 109) if b % 12 in NAMES], key=lambda b: abs(b - m))
    key = (layer, base)
    if key not in SAMP:
        nm = f"{NAMES[base % 12]}{base // 12 - 1}v{layer}.ogg"; d, sr = sf.read(f'{H}/samples/v{layer}/{nm}'); SAMP[key] = d[:int(9 * SR)]
    d = SAMP[key]; st = m - base
    if st == 0: return d
    up, down = {1: (89, 84), -1: (84, 89), 2: (449, 400), -2: (400, 449)}[st]   # ratios ~2^(st/12)
    return resample_poly(d, down, up, axis=0)
def piano(t, m, vel=.5, dur=4.0, pan=0.):
    layer = 4 if vel < .42 else (8 if vel < .75 else 12)
    d = sample(layer, m).copy(); n = min(len(d), int((dur + 1.2) * SR)); d = d[:n]
    rel = int(min(n, dur * SR)); fade = np.ones(n); fade[rel:] = np.exp(-np.arange(n - rel) / (.35 * SR)); d *= fade[:, None]
    g = (.55 + .9 * vel) * (1 if layer == 4 else .8 if layer == 8 else .65)
    i = int(t * SR); e = min(N, i + n)
    if e <= i: return
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mus[i:e, 0] += d[:e - i, 0] * g * L * 1.41; mus[i:e, 1] += d[:e - i, 1] * g * R * 1.41

# ---------------- strings (ensemble pad) + cello ----------------
def saw(f, d, ph=0.):
    tt = t_(d); return 2 * ((tt * f + ph) % 1) - 1
def strings(t, ms, d, v=1., att=1.2, rel=1.5, bright=1800):
    d = d + rel; tt = t_(d); out = np.zeros((len(tt), 2))
    for m in ms:
        for k in range(5):
            det = (k - 2) * .0035; vib = 1 + .0025 * np.sin(2 * np.pi * (4.6 + k * .3) * tt + k)
            f = mt(m) * (1 + det); x = 2 * ((np.cumsum(f * vib) / SR + rng.random()) % 1) - 1
            pan = (k - 2) / 2.5; out[:, 0] += x * (1 - pan) * .5; out[:, 1] += x * (1 + pan) * .5
    out = lp(lp(out.T, bright), bright * 1.3).T / (len(ms) * 5)
    e = np.minimum(1, (tt / att) ** 1.5) * np.minimum(1, np.maximum(0, d - tt) / rel)
    add2(mus, out * e[:, None] * v, t)
def cello(t, m, d, v=1.):
    tt = t_(d); f = mt(m) * (1 + .003 * np.sin(2 * np.pi * 5 * tt))
    x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h ** 1.2 for h in range(1, 9)); x = lp(x, 1400)
    add(mus, x * env(d, .45, .8) * v, t, 1.)

# ---------------- the cue sheet ----------------
A, C_, E, F, G = 57, 60, 64, 65, 67
CH = {'Am': [45, 52, 57, 60, 64], 'F': [41, 48, 53, 57, 60], 'C': [36, 43, 48, 52, 55], 'G': [43, 50, 55, 59, 62], 'E': [40, 47, 52, 56, 59], 'Cmaj7': [36, 43, 48, 52, 59], 'Am7': [45, 52, 55, 60, 64], 'Fmaj7': [41, 48, 52, 57, 60], 'Em': [40, 47, 52, 55, 59], 'Dm': [38, 45, 50, 53, 57]}
def arp(t0, chord, dur, step, vel=.3, hi=12, pan=.2):
    c = CH[chord]; seq = [c[2] + hi, c[3] + hi, c[4] + hi, c[3] + hi]; k = 0; t = t0
    while t < t0 + dur - .05: piano(t, seq[k % 4], vel * (.85 + .3 * rng.random()), step * 3, pan * (1 if k % 2 else -1)); k += 1; t += step
def bassn(t, chord, vel=.35, dur=3.):
    c = CH[chord]; piano(t, c[0], vel, dur, -.2); piano(t + .02, c[1], vel * .8, dur, -.1)
def mel(notes, vel=.5, pan=.1):
    for t, m, d in notes: piano(t, m, vel * (.9 + .2 * rng.random()), d, pan)

# A: wonder (0 - 13): soft high arpeggios
for t0, ch in [(.4, 'Cmaj7'), (3.6, 'Am7'), (6.8, 'Fmaj7'), (10.0, 'G')]: bassn(t0, ch, .22, 3.4); arp(t0, ch, 3.2, .4, .2, 12)
strings(.4, [64, 71], 12.8, .05, att=3, rel=1.5, bright=3000)
# the lock: everything stops, one low A
piano(14.55, 33, .7, 7.5); piano(14.56, 45, .55, 7.5); strings(14.55, [88], 5, .025, att=1.5, rel=2, bright=6000)
piano(17.35, 76, .28, 3.5, .2); bassn(21.0, 'Am', .2, 3.5)
# B: the week (24 - 62). Am F C G | Am F C E | Am F C G | Am F E(Am) ...
prog = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E', 'Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E']
step = 2.35; T0 = 24.0
for i, ch in enumerate(prog):
    t = T0 + i * step
    if t > 61.5: break
    v = .3 if t < 47 else (.22 if t < 52 else .34)
    bassn(t, ch, v, step + 1.0); arp(t, ch, step, step / 4, v * .75, 12)
mel([(24.05, 76, 1.2), (25.2, 74, .6), (25.8, 72, 1.6), (28.75, 72, 1.0), (29.75, 69, 1.4), (31.1, 67, 1.2), (32.3, 64, .5), (32.8, 67, 1.6),
     (33.5, 71, 1.0), (34.6, 74, 1.4), (35.85, 76, 1.2), (37.0, 72, 1.2), (38.2, 69, .8), (39.0, 72, .8), (39.8, 77, 1.6),
     (40.55, 76, 1.0), (41.6, 74, .6), (42.2, 72, 1.6), (43.0, 71, 1.0), (44.1, 68, 1.4)], .42)
# day 3 -> 2: fewer notes
mel([(45.3, 69, 1.8), (47.6, 72, 2.2), (49.9, 67, 2.4)], .32)
# strings enter on the sheet (day 4) and grow
for i, ch in enumerate(prog):
    t = T0 + i * step
    if t < 38 or t > 60: continue
    strings(t, CH[ch][2:], step + .2, .05 + .1 * min(1, (t - 38) / 18), att=.9, rel=1.2, bright=1600 + 60 * (t - 38))
for t, m in [(38.1, 45), (42.8, 41), (47.5, 43), (52.2, 45), (54.6, 41), (57.0, 38)]: cello(t, m, 2.6, .07)
# day 1: the last bolt, the climax, then a held F that fades into nothing
mel([(52.3, 81, 1.4), (53.6, 79, .7), (54.3, 77, 1.6), (55.6, 76, .9), (56.5, 74, 1.4), (57.2, 72, 3.0)], .55, 0)
piano(57.2, 41, .35, 4.5); piano(57.22, 48, .3, 4.5); piano(57.25, 57, .28, 4.5); piano(58.6, 64, .2, 3.4); strings(57.2, [53, 57, 60], 3.6, .12, att=.6, rel=1.2, bright=1500)
# C: zero. Silence (62 - 65), then one hand on the piano at the tag
mel([(69.4, 76, 1.4), (70.6, 74, 1.4), (71.6, 72, 2.4)], .26, 0); piano(71.6, 45, .2, 3)
# D: a year later (72 - 87): the theme, warmer, resolving to C
prog2 = [(72.2, 'F'), (74.6, 'C'), (77.0, 'G'), (79.4, 'Am'), (81.8, 'F'), (84.2, 'G'), (85.4, 'C')]
for i, (t, ch) in enumerate(prog2):
    d = (prog2[i + 1][0] - t) if i + 1 < len(prog2) else 3.0
    bassn(t, ch, .32, d + 1.2); arp(t, ch, d, .3, .26, 12); strings(t, CH[ch][2:], d + .1, .11 if t < 84 else .14, att=.8, rel=1.6 if t < 85 else 2.0, bright=2200)
mel([(72.3, 72, 1.0), (73.3, 74, .6), (73.9, 76, 1.4), (75.2, 79, 1.2), (76.4, 84, 2.2), (78.6, 83, .6), (79.2, 81, 1.8), (81.0, 79, .8), (81.9, 77, 1.2), (83.1, 76, .8), (84.0, 74, 1.4), (85.4, 72, 3.2)], .44, 0)
for t, m in [(85.45, 84), (85.8, 88), (86.2, 91)]: piano(t, m, .22, 2.5, .3)

# silence before the zero card: everything stops on the cut
s0, s1 = int(62.0 * SR), int(65.0 * SR); fade = int(.25 * SR)
mus[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None] ** 2

# ---------------- reverb (hall) ----------------
def hall(x, secs=3.2, wet=.32, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 7).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 2.2
mus = hall(mus, 3.4, .36)
mus[s0:s1] = 0

# ---------------- ambience + foley ----------------
def chirp(f0, f1, d):
    tt = t_(d); f = f0 + (f1 - f0) * tt / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
def birds(t, d, g=.04):
    for _ in range(int(d * 1.6)):
        at = t + rng.uniform(0, d); f = rng.uniform(2600, 4800); p = rng.uniform(-.8, .8)
        for k in range(rng.integers(2, 5)): add(fx, chirp(f, f * rng.uniform(1.1, 1.4), .07), at + k * .1, g * rng.uniform(.5, 1), p)
def bed(t, d, x, g): x = x[:int(d * SR)] * env(d, .6, .6)[:len(x[:int(d * SR)])]; add2(fx, np.stack([x, np.roll(x, 1500)], 1), t, g)
for e in EV:
    t, ty = e['t'], e['type']; d = e.get('d', 1.)
    if ty == 'amb':
        k = e['k']
        if k == 'city': bed(t, d, bp(noise(d), 180, 1200), .025); [add(fx, bp(noise(.3), 300, 900) * env(.3, .1, .15), t + rng.uniform(0, d), .03, rng.uniform(-.8, .8)) for _ in range(int(d * 2))]; [add(fx, sfx.step(1.), t + .3 + i * .48, .05, rng.uniform(-.4, .4)) for i in range(int(d / .48))]
        if k == 'birds': bed(t, d, lp(noise(d), 700), .03); birds(t, d)
        if k in ('garage', 'room'): bed(t, d, lp(noise(d), 300), .03)
        if k == 'vinyl': bed(t, d, bp(noise(d), 2500, 6000) * .2, .006); [add(fx, sfx.click(1.), t + rng.uniform(0, d), .05, rng.uniform(-.3, .3)) for _ in range(int(d * 9))]
        if k == 'evening': bed(t, d, lp(noise(d), 500), .025); [add(fx, chirp(4200, 4300, .05) * .5, t + rng.uniform(0, d), .015, rng.uniform(-.6, .6)) for _ in range(int(d * 6))]
        if k == 'night': bed(t, d, lp(noise(d), 250), .028); [add(fx, chirp(4600, 4700, .04), t + i * .5 + rng.uniform(0, .05), .008, .6) for i in range(int(d / .5))]
        if k == 'cold': bed(t, d, lp(noise(d), 400), .03); birds(t + 1.5, d - 1.5, .015)
        if k == 'park': bed(t, d, lp(noise(d), 600), .03); birds(t, d, .03)
    elif ty == 'boot': add(fx, sfx.ding(1.), t, .05); [add(fx, chirp(1800 + i * 400, 2000 + i * 400, .06), t + .35 + i * .12, .03) for i in range(4)]
    elif ty == 'scan': add(fx, chirp(2400, 3200, .08), t, .025, rng.uniform(-.5, .5)); add(fx, chirp(3200, 3200, .05), t + .2, .02)
    elif ty == 'lock': add(fx, chirp(1200, 900, .25), t, .04); add(fx, sfx.thump(.8, 45), t, .12)
    elif ty == 'car': x = lp(noise(d), 160) * 3 + np.sin(2 * np.pi * np.cumsum(np.full(int(d * SR), 48.0)) / SR) * .3; x *= np.sin(np.pi * t_(d) / d) ** .7; add(fx, x, t, .06, -.3); add(fx, bp(noise(d), 300, 1500) * np.sin(np.pi * t_(d) / d), t, .02)
    elif ty == 'door': x = lp(noise(d), 220) * 2 + np.sin(2 * np.pi * 85 * t_(d)) * .2; x *= env(d, .1, .25); add(fx, x, t, .07); [add(fx, sfx.clack(1.2, .8), t + i * .09, .025) for i in range(int(d / .09))]; add(fx, sfx.thump(.7, 70), t + d, .06)
    elif ty == 'glassoff': add(fx, sfx.click(1.), t, .05); add(fx, bp(noise(.2), 2000, 7000) * env(.2, .02, .15), t, .015)
    elif ty == 'drawer': add(fx, bp(noise(.35), 300, 2500) * env(.35, .05, .1), t - .35, .04); add(fx, sfx.thump(.8, 110), t, .12); add(fx, sfx.clack(.9, .8), t, .05)
    elif ty == 'drawerOpen': add(fx, bp(noise(.45), 300, 2500) * env(.45, .05, .1), t, .035)
    elif ty == 'sheet': add(fx, bp(noise(.6), 400, 4000) * np.sin(np.pi * t_(.6) / .6) ** 2, t, .05)
    elif ty == 'brush': add(fx, bp(noise(.4), 1500, 7000) * np.sin(np.pi * t_(.4) / .4) ** 2, t, .02, rng.uniform(-.2, .2))
    elif ty == 'creak': add(fx, sfx.creak(1.), t, .05)
    elif ty == 'chimes': [add(fx, sfx.ding(rng.uniform(.6, 1.0)), t + rng.uniform(0, d), .012, rng.uniform(-.5, .5)) for _ in range(7)]
    elif ty == 'click': [add(fx, sfx.click(1.), t + i * .07, .05, .1) for i in range(3)]
    elif ty == 'paper': add(fx, bp(noise(.5), 1500, 8000) * np.abs(np.sin(np.pi * t_(.5) * 6)) * env(.5, .03, .2), t, .025)
    elif ty == 'bell': [add(fx, sum(np.sin(2 * np.pi * f * t_(1.2)) * np.exp(-t_(1.2) / dd) for f, dd in ((2350, .5), (3120, .3), (4710, .2))) * .4, t + k * .28, .05, .3) for k in range(2)]
fx[s0:s1] = 0

# ---------------- balance, stems ----------------
mus *= .5 / np.sqrt((mus[int(24 * SR):int(60 * SR)] ** 2).mean())
fx *= 4.0   # absolute foley gains, set per event above (about 17 dB under the score)
mix = mus * .5 + fx
mix = hp(mix.T, 30).T
pk = np.abs(mix).max(); sc = .7 / pk; mix *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
mix[s0:s1] = 0
os.makedirs(f'{H}/out', exist_ok=True)
sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_music.wav', (mus * .5 * sc).astype(np.float32), SR, subtype='FLOAT'); sf.write(f'{H}/out/stem_sfx.wav', (fx * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_vo.wav', np.zeros((N, 2), np.float32), SR, subtype='FLOAT')
print(f'mix written {DUR}s')
