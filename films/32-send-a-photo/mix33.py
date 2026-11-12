# Film 33 "The Things They Never Bought" (88 s): piano score + foley -> out/mix.wav (no narration).
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/).
# Timeline = toon/src/videos/sacrifice/story4.ts. Every cue sits on the beat it scores.
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



# ================= score =================
C, Am, F, G, Em, Dm = [48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47], [38, 41, 45]
MOTIF = [(0, 76, 1.0), (1.0, 74, .8), (1.8, 72, 1.6), (3.4, 67, 1.6)]           # the parents' motif: E D C ... G (a gentle fall)
def motif(t0, vel=.32, oct=0, k=1.0, minor=False):
    for dt, m, d in MOTIF: piano(t0 + dt * k, (m - 1 if minor and m == 76 else m) + oct, vel, d * k, .1)
# 0-5 the slippers: one hand alone, the motif, unharmonised
piano(.4, 36, .22, 4.6, -.2); motif(.9, .3, 0, 1.0)
# 5-11.5 the shoe store, twenty years ago: warm C major, a little bounce for the boy; "Only the best for you" (9.9) lands on F
piano(5.1, 36, .3, 3.2, -.2); arp(5.1, C + [64, 67], .38, 9, .26); strings(5.2, C, 4.0, .04, att=1.5, rel=1, bright=2100)
for t0, m in [(5.6, 79), (6.0, 81), (6.4, 79), (7.2, 76)]: piano(t0, m, .3, .8, .2)
piano(8.6, 33, .26, 1.3, -.2); arp(8.6, Am, .42, 3, .2)                     # counting: a worried minor
piano(9.9, 29, .34, 1.8, -.2); arp(9.9, F + [60, 64], .3, 6, .28); piano(10.0, 72, .34, 1.6)
# 11.5-14.5 rain: Am - F, the motif slow and low
piano(11.6, 33, .28, 1.5, -.2); arp(11.6, Am, .5, 3, .2); piano(13.1, 29, .28, 1.5, -.2); arp(13.1, F, .5, 3, .2); motif(11.8, .22, -12, .75)
strings(11.6, [45, 52], 3.0, .035, att=1, rel=1, bright=900)
# 14.5-22 sewing by the lamp: the motif as a music box, high and slow; "Mine still fits" (18.9) gets a soft C
piano(14.6, 36, .22, 3.9, -.2); motif(15.0, .2, 12, .9); strings(14.8, [48, 55], 7.0, .025, att=3, rel=2, bright=1400)
piano(18.6, 41, .22, 3.4, -.2); arp(18.6, F + [60], .55, 6, .2); piano(19.2, 79, .26, 1.6)
# 22-30 dinner: sparse; the chicken moves (23.0-24.4) on rising notes; "I'm not hungry" (26.4) turns minor; the growl, then quiet
for t0, m in [(23.0, 72), (23.5, 74), (24.0, 76)]: piano(t0, m, .24, .9, .1)
piano(22.2, 36, .22, 3.6, -.2)
piano(26.3, 33, .28, 3.4, -.2); arp(26.3, Am + [57], .55, 6, .2); piano(26.6, 69, .24, 2.2)
# 30-34 2:47 AM: a low drone and two lonely notes
strings(30.1, [33, 40], 3.8, .03, att=1.5, rel=1.2, bright=600); piano(30.6, 64, .2, 1.8, .2); piano(32.2, 62, .2, 1.6, .2)
# 34-40 the laptop: morning C; "Finally." (35.7) with no answer from the music; "Study hard" (37.4) a small warm F
piano(34.2, 36, .24, 1.4, -.2); arp(34.2, C, .45, 3, .2)
piano(37.4, 29, .28, 2.4, -.2); arp(37.4, F + [60], .45, 5, .22); piano(37.6, 72, .28, 1.4)
# 40-48 graduation: bright G, then "stand over there" (41.3) drops to Em; a falling line as they step aside
piano(40.1, 31, .3, 1.2, -.2); arp(40.1, G + [67], .3, 4, .26)
piano(41.3, 28, .32, 3.0, -.2); arp(41.3, Em, .5, 5, .2); for_ = [(41.9, 74), (42.7, 72), (43.5, 71), (44.3, 67)]
for t0, m in for_: piano(t0, m, .28, 1.2, .1)
piano(44.2, 33, .26, 3.6, -.2); strings(44.2, [45, 52, 57], 3.6, .035, att=1.2, rel=1.2, bright=1000); motif(44.6, .22, 0, .8, minor=True)
# 48-56 the money texts: thin piano, time passing (two bars, same answer twice)
for t0, ch, b in [(48.2, C, 36), (50.2, Am, 33), (52.2, C, 36), (54.2, Am, 33)]: piano(t0, b, .22, 2.0, -.2); arp(t0, ch, .6, 3, .17)
# 56-60 the call: nothing but the ringtone; the text (58.0) gets one deep note, then silence
piano(58.05, 21 + 12, .42, 4.0, -.1); piano(58.07, 45, .3, 4.0, .1)
# 60-72 the wardrobe, the receipt, the envelope: the motif in minor, building; the envelope (69.0) is the peak
for t0, ch, b in [(60.2, Am, 33), (62.2, F, 29), (64.2, C, 36), (66.2, G, 31)]: piano(t0, b, .3, 2.0, -.2); arp(t0, ch + [ch[0] + 12], .45, 4, .22)
motif(60.6, .28, 0, 1.2, minor=True); motif(64.6, .32, 0, 1.1)
strings(62.0, [45, 52, 57, 60], 6.0, .05, att=4, rel=.5, bright=1500)
strings(68.0, [33, 45, 52, 57, 64], 4.4, .095, att=1.0, rel=2.0, bright=2000); piano(68.0, 21 + 12, .5, 4.0, -.2); piano(68.02, 45, .42, 4.0)
for t0, m in [(68.4, 76), (69.2, 74), (69.9, 72), (70.8, 71), (71.4, 72)]: piano(t0, m, .44, 1.2, .1)
# 72-82 Mom: the motif returns in major, whole and warm; "That's why" (79.5) resolves on C with strings
piano(72.2, 29, .28, 3.8, -.2); arp(72.2, F + [60, 65], .45, 8, .24); strings(72.4, F, 4.0, .04, att=2, rel=1, bright=1900); motif(72.8, .3)
piano(76.2, 31, .3, 3.2, -.2); arp(76.2, G + [62, 67], .45, 7, .25); motif(77.2, .34, 0, 1.05)
piano(79.5, 36, .45, 4.0, -.2); piano(79.52, 48, .36, 4.0); arp(79.5, C + [64, 67, 72], .4, 8, .3); strings(79.5, [36, 48, 55, 60, 64], 3.6, .09, att=.6, rel=1.4, bright=2300)
for t0, m in [(80.0, 79), (81.0, 77), (81.8, 76)]: piano(t0, m, .38, 1.4, .1)
# 82-88 the message: a last music-box echo, fading
piano(82.4, 36, .24, 5.0, -.2); motif(83.0, .18, 12, 1.0); strings(82.4, [48, 55, 64], 5.0, .04, att=1, rel=2, bright=1800)
def hall(x, secs=3.4, wet=.36, pre=.025):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 3).standard_normal(n); ir[:, ch] = lp(r, 6000) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2

mus = hall(mus); mus[-int(1.8 * SR):] *= np.linspace(1, 0, int(1.8 * SR))[:, None] ** 2
# ================= foley =================
def amb(t0, t1, x, g):
    i0, i1 = int(t0 * SR), int(t1 * SR); n = i1 - i0; y = np.stack([x[:n], np.roll(x[:n], 997)], 1)
    f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (.3 * SR))[:, None]; fx[i0:i1] += y * f * g
room = lp(noise(DUR), 220); street = lp(noise(DUR), 500)
tick = lambda: bp(noise(.02), 3000, 7000) * np.exp(-t_(.02) / .004)
scuff = lambda: bp(noise(.22), 300, 2200) * np.sin(np.pi * t_(.22) / .22) ** 2
rustle = lambda d=.35: bp(noise(d), 1500, 7000) * (np.abs(np.sin(2 * np.pi * 9 * t_(d))) ** 2) * np.sin(np.pi * t_(d) / d)
clink = lambda f=2600: (np.sin(2 * np.pi * f * t_(.4)) + .5 * np.sin(2 * np.pi * f * 2.7 * t_(.4))) * np.exp(-t_(.4) / .06)
ping = lambda: (np.sin(2 * np.pi * 1318 * t_(.5)) * .6 + np.sin(2 * np.pi * 1975 * t_(.5)) * .4) * np.exp(-t_(.5) / .12)
def birds(t0, t1, n, g):
    for _ in range(n):
        d = rng.uniform(.08, .2); tt = t_(d); f0 = rng.uniform(2800, 4200); f = f0 * (1 + .25 * np.sin(2 * np.pi * rng.uniform(15, 30) * tt))
        add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d), rng.uniform(t0, t1 - .2), g, rng.uniform(-.7, .7))
# 0-5 kitchen morning: clock, the slippers scuffing on the tiles, birds outside
amb(0, 5, room, .015); birds(0, 5, 10, .004)
for t0 in np.arange(.3, 5, .55): add(fx, scuff(), t0, .05, -.2 + .1 * np.sin(t0))
for t0 in np.arange(.2, 5, 1.0): add(fx, tick(), t0, .012, .4)
# 5-11.5 street: traffic hush, the boy's excitement, the bills counted (one rustle per bill)
amb(5, 11.5, street, .02)
for t0 in [8.7, 9.3, 9.9, 10.5]: add(fx, rustle(.3), t0, .03, .1)
# 11.5-14.5 rain: rain on the street, wet steps
rain = hp(bp(noise(3.2), 800, 9000), 500); amb(11.5, 14.6, rain, .06)
for t0 in np.arange(11.7, 14.4, .38): add(fx, bp(noise(.12), 400, 3000) * np.exp(-t_(.12) / .04), t0, .03, .2)
# 14.5-22 sewing: clock, thread pulled through
amb(14.5, 22, room, .012)
for t0 in np.arange(14.6, 22, 1.0): add(fx, tick(), t0, .012, .4)
for t0 in np.arange(15.2, 18.4, 1.45): add(fx, bp(noise(.5), 2000, 7000) * np.sin(np.pi * t_(.5) / .5) ** 3, t0, .02, -.1)
# 22-30 dinner: spoons on plates; the chicken set down (24.4); the stomach growl (28.1)
amb(22, 30, room, .012)
for t0 in [22.4, 23.1, 25.2, 25.9, 27.0, 29.2]: add(fx, clink(rng.uniform(2300, 3000)), t0, .012, rng.uniform(-.4, .4))
add(fx, clink(1900), 24.4, .02)
g_t = t_(1.3); growl = lp(np.sin(2 * np.pi * (70 + 30 * np.sin(2 * np.pi * 3 * g_t)) * g_t) * (.6 + .4 * np.sin(2 * np.pi * 11 * g_t)), 300) * np.sin(np.pi * g_t / 1.3)
add(fx, growl, 28.1, .1)
# 30-34 the booth at night: the light's hum, a far car
hum = np.sin(2 * np.pi * 120 * t_(4.0)) * .5 + np.sin(2 * np.pi * 240 * t_(4.0)) * .2; amb(30, 34, np.tile(hum, 30), .006); amb(30, 34, street, .015)
add(fx, bp(noise(2.0), 200, 1500) * np.sin(np.pi * t_(2.0) / 2.0) ** 2, 31.3, .03, .5)
# 34-40 morning: birds, the box handed over (paper), wrapping
birds(34, 40, 14, .005); amb(34, 40, room, .012); add(fx, rustle(.6), 35.6, .04, -.2)
# 40-48 graduation: a crowd murmur, applause, the camera click
crowd = bp(noise(8.0), 300, 2500) * (.7 + .3 * np.sin(2 * np.pi * .7 * t_(8.0))); amb(40, 48, crowd, .02)
for _ in range(120): add(fx, bp(noise(.03), 1000, 5000) * np.exp(-t_(.03) / .008), rng.uniform(40.1, 41.4), .02, rng.uniform(-.8, .8))
add(fx, bp(noise(.05), 1500, 6000) * np.exp(-t_(.05) / .012), 46.6, .06); add(fx, bp(noise(.04), 1000, 4000) * np.exp(-t_(.04) / .01), 46.68, .05)
# 48-56 texts: a send whoosh for his messages, a ping for Dad's replies
for t0 in [48.45, 49.05, 52.75, 53.35]: add(fx, sfx.whoosh(.25), t0, .02, .2)
for t0 in [50.85, 54.85]: add(fx, ping(), t0, .03, -.1)
# 56-60 the ringtone (two rings), then the text ping
for r0 in [56.1, 56.9]:
    for k_, m in enumerate([76, 79, 84, 79]): add(fx, np.sin(2 * np.pi * mt(m) * t_(.18)) * np.exp(-t_(.18) / .06), r0 + k_ * .12, .03)
add(fx, ping(), 58.0, .03)
# 60-72 the wardrobe door, the box lid, the envelope paper
amb(60, 72, room, .01); add(fx, sfx.creak(.6), 60.4, .05, .3); add(fx, rustle(.5), 64.2, .03); add(fx, rustle(.7), 68.4, .035)
# 72-88 Mom's living room: clock, quiet
amb(72, 88, room, .012)
for t0 in np.arange(72.3, 88, 1.0): add(fx, tick(), t0, .01, .4)

mus *= .5 / np.sqrt((mus[int(1 * SR):int(80 * SR)] ** 2).mean()); fx *= 4.0
mix = mus * .5 + fx; mix = hp(mix.T, 30).T; sc = .7 / np.abs(mix).max(); mix *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT'); print('mix written', mix.shape[0] / SR)
