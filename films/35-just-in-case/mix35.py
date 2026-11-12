# Film 35 "Just In Case" (62 s): score + foley + Daniel's recorded voice -> out/mix.wav
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0), samples shared with film 32.
# The thread is an original "kitchen waltz" in D: piano score -> the little kitchen radio -> three lonely notes in the garage
# -> silence -> a cello in D minor in the rain -> the tinny phone speaker at the wedding -> full piano + strings when Sam steps in.
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_
H = os.path.dirname(os.path.abspath(__file__)); DUR = 65.0; N = int(DUR * SR); rng = np.random.default_rng(35)
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

# ================= the kitchen waltz (original), D major, 3/4 =================
BAR = 1.3; B1 = BAR / 3
MEL = [[(0, 74, 1), (1, 78, 1), (2, 81, 1)], [(0, 79, 2), (2, 78, 1)], [(0, 76, 1), (1, 78, 1), (2, 74, 1)], [(0, 76, 3)],
       [(0, 74, 1), (1, 78, 1), (2, 81, 1)], [(0, 83, 2), (2, 81, 1)], [(0, 79, 1), (1, 78, 1), (2, 76, 1)], [(0, 74, 3)]]
CH = [([62, 66, 69], 38), ([62, 67, 71], 43), ([62, 66, 69], 38), ([61, 64, 69], 33), ([62, 66, 69], 38), ([62, 67, 71], 43), ([61, 64, 67], 33), ([62, 66, 69], 38)]
def melody(t0, bars=range(8), vel=.34, oct=0, k=1.0, minor=False, buf=None, pan=.1):
    for j, b in enumerate(bars):
        for beat, m, n in MEL[b]:
            mm = m - 1 if minor and m % 12 == 6 else m      # F# -> F for D minor
            piano(t0 + (j * 3 + beat) * B1 * k, mm + oct, vel, n * B1 * k * .95, pan, buf)
def accomp(t0, bars=range(8), vel=.24, k=1.0, minor=False, buf=None):
    for j, b in enumerate(bars):
        ch, bass = CH[b]; t = t0 + j * BAR * k
        ch = [c - 1 if minor and c % 12 == 6 else c for c in ch]
        piano(t, bass, vel * 1.15, BAR * k * .9, -.25, buf)
        for q in (1, 2): [piano(t + q * B1 * k, c, vel * .7, B1 * k, .2, buf) for c in ch]

# ---- Part 1 (0-18): lessons. Piano score 0-8; the radio plays the waltz for the kitchen dance 8-13; the hug 13-18 turns
accomp(0.15, range(6), .2); melody(0.15 + 2 * BAR, [0, 1, 2, 3], .27, 12)              # gentle, warm
melody(8.0, range(4), .42, 0, buf=radio); accomp(8.0, range(4), .34, buf=radio)          # the kitchen radio (diegetic)
melody(8.0 + 4 * BAR, [4], .4, 0, buf=radio); accomp(8.0 + 4 * BAR, [4], .32, buf=radio)
strings(13.0, [50, 57, 62, 66], 4.8, .05, att=2.0, rel=1.2, bright=1500)               # under the hug: D, then
strings(15.4, [47, 54, 59, 62], 2.6, .05, att=1.4, rel=.6, bright=1300)                # B minor ("…I promise")
piano(15.4, 35, .26, 2.5, -.2); piano(15.45, 74, .2, 2.2, .15)
# ---- Part 2 (18-25): the garage. Three lone notes of the theme in D minor, a dark low string
strings(18.0, [26, 33, 38], 7.0, .07, att=2.0, rel=.4, bright=500)
for t0, m in [(18.4, 74), (19.5, 77), (20.6, 81)]: piano(t0, m, .3, 2.6, .1)
piano(22.1, 70, .16, 2.5, -.1)                                                          # "Practising a speech." a wrong, sad note
# ---- Part 3 (25-29): silence (clock + drizzle only)
# ---- Part 4 (29-40): the cello carries the theme in D minor; rain; the swell is cut at the white bloom
for j, (beat_t, m, n) in enumerate([(0, 62, 1), (1, 65, 1), (2, 69, 1), (3, 67, 2), (5, 65, 1), (6, 64, 1), (7, 65, 1), (8, 62, 1), (9, 64, 3)]):
    cello(29.4 + beat_t * .62, m - 12, n * .62 * .97, .14)
piano(29.4, 38, .22, 3.0, -.2); piano(32.2, 46, .2, 3.0, -.2)
for t0, m in [(30.0, 86), (31.9, 84), (33.6, 81)]: piano(t0, m, .14, 2.0, .3)          # high, sparse, the mirror
strings(35.0, [38, 45, 50, 53], 5.0, .06, att=3.0, rel=.05, bright=1100)               # Anna in the rain: a swell
strings(37.6, [53, 57, 62], 2.4, .06, att=1.6, rel=.05, bright=1600)
piano(37.6, 26, .4, 2.3, -.2); piano(37.62, 38, .3, 2.3)
# ---- Part 5 (40-62): the wedding. The phone plays the waltz, tiny and far; it blooms into full piano + strings at Sam
melody(48.6, range(4), .4, 0, buf=phone); accomp(48.6, range(4), .3, buf=phone)
melody(48.6 + 4 * BAR, [4], .4, 0, buf=phone); accomp(48.6 + 4 * BAR, [4], .3, buf=phone)
T5 = 53.2                                                                                # Sam steps in: bars 5-8, full and warm
accomp(T5, [4, 5, 6, 7], .3); melody(T5, [4, 5, 6, 7], .4, 12)
strings(T5, [50, 57, 62, 66], 2.6, .055, att=1.2, rel=.6, bright=1900); strings(T5 + 2 * BAR, [43, 55, 59, 62], 1.3, .055, att=.4, rel=.4, bright=1900)
strings(T5 + 3 * BAR, [45, 57, 61, 64, 67], 1.3, .06, att=.4, rel=.3, bright=2000)
T6 = T5 + 4 * BAR                                                                        # 58.4: the last phrase, slower, to the end
accomp(T6, [0, 1], .26, 1.15); melody(T6, [0, 1], .34, 12, 1.15)
piano(T6 + 2 * BAR * 1.15, 38, .3, 3.5, -.2); piano(T6 + 2 * BAR * 1.15, 50, .24, 3.5); [piano(T6 + 2 * BAR * 1.15 + .02 * k, m, .2, 3.4, .15) for k, m in enumerate([66, 69, 74, 78])]
strings(T6, [50, 57, 62, 66, 69], 3.6, .055, att=1.5, rel=1.4, bright=1700)

# ---- process the diegetic buses
def radio_fx(x, lo, hi, drive, crackle):
    m = x.mean(1); m = bp(m, lo, hi); m = np.tanh(m * drive) / np.tanh(drive)
    c = np.zeros(len(m)); idx = rng.integers(0, len(m), int(len(m) / SR * crackle)); c[idx] = rng.standard_normal(len(idx)) * .25
    c = bp(c, 1500, 6000) + bp(noise(len(m) / SR), 2000, 7000) * .004
    out = (m + c * (np.abs(m).max() > 0))[:, None] * np.array([[.92, .82]]); return out
r = radio_fx(radio, 280, 3600, 2.0, 18); r[:int(7.9 * SR)] = 0; env = np.ones(N); i0, i1 = int(12.6 * SR), int(13.6 * SR); env[i0:i1] = np.linspace(1, .25, i1 - i0); env[i1:] = .25 * np.exp(-np.arange(N - i1) / (1.2 * SR)); r *= env[:, None]
p = radio_fx(phone, 650, 3400, 1.6, 6); env = np.ones(N); j0, j1 = int(53.2 * SR), int(54.6 * SR); env[j0:j1] = np.linspace(1, 0, j1 - j0); env[j1:] = 0; p *= env[:, None]
mus = hall(mus, 3.8, .38) * 1.0 + hall(r, 1.2, .18) * .85 + hall(p, 2.2, .3) * 1.15

# ================= Daniel's voice: through a small phone speaker in a quiet hall =================
def phone_voice(path):
    d, sr = sf.read(path); d = d.mean(1) if d.ndim > 1 else d; d = resample_poly(d, SR, sr) if sr != SR else d
    d = bp(d, 260, 4200); d = np.tanh(d * 1.4) / np.tanh(1.4); return np.stack([d, d], 1)
for fn, t0, g in [('r1', 44.35, 1.0), ('r2', 53.35, 1.0), ('r3', 56.5, 1.0)]:
    add2(vo, phone_voice(f'{H}/vo_fish/{fn}.wav'), t0, g)
vo = hall(vo, 1.6, .2)

# ================= foley =================
def amb(t0, t1, x, g, pan=0.):
    n = int((t1 - t0) * SR); x = np.resize(x, n); f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (.25 * SR)); add(fx, x * f, t0, g, pan)
def ratchet(): x = bp(noise(.05), 2500, 7000) * np.exp(-t_(.05) / .008); return x
def tick(): return bp(noise(.03), 2500, 6000) * np.exp(-t_(.03) / .005)
def cough():
    x = np.concatenate([bp(noise(.22), 250, 2200) * np.exp(-t_(.22) / .06) * (1 + .5 * np.sin(2 * np.pi * 130 * t_(.22))) for _ in range(3)]); return x
def creak(d=.9):
    tt = t_(d); f = 180 + 120 * tt / d; ph = 2 * np.pi * np.cumsum(f) / SR
    return bp(np.sign(np.sin(ph)) * (rng.random(len(tt)) * .4 + .6), 300, 2500) * np.sin(np.pi * tt / d) * .5
def rustle(d=.4): return bp(noise(d), 800, 6000) * (rng.random(int(d * SR)) ** 3) * np.sin(np.pi * t_(d) / d)
def clink(f=2600): tt = t_(.6); return np.sin(2 * np.pi * f * tt) * np.exp(-tt / .12) * .5 + np.sin(2 * np.pi * f * 2.7 * tt) * np.exp(-tt / .05) * .2
room = bp(noise(2.0), 80, 600) * .5
rain_h = hp(lp(noise(4.0), 9000), 400); rain_l = lp(noise(4.0), 500)
# 0-4 driveway: evening outside, the wrench ratchet
amb(0, 4.0, bp(noise(4.0), 200, 3000) * .5, .012)
for t0 in np.arange(1.0, 3.6, .21): add(fx, ratchet(), t0, .05, .2)
# 4-8 bathroom: soft room, the tie sliding
amb(4, 8, room, .012); add(fx, rustle(.7), 5.0, .03); add(fx, rustle(.5), 6.4, .03)
# 8-18 kitchen: room, socks on wood (the waltz steps on beat 1)
amb(8, 18, room, .012)
for t0 in np.arange(8.0, 13.0, BAR): add(fx, sfx.step(.4), t0, .015, rng.uniform(-.3, .3))
# 18-25 garage: hum of the bulb, cough, the door creak, the phone hidden (fabric)
hum = (np.sin(2 * np.pi * 100 * t_(1.0)) * .3 + bp(noise(1.0), 100, 400) * .4); amb(18, 25, hum, .008)
add(fx, cough(), 19.3, .05, .1); add(fx, creak(1.0), 21.6, .05, .5); add(fx, rustle(.35), 22.2, .04)
# 25-29 gone: a clock, drizzle on the window
amb(25, 29.4, rain_h * .3, .025)
for t0 in np.arange(25.2, 29.2, 1.0): add(fx, tick(), t0, .06, -.3)
# 29-35 the mirror: a quiet room, the tie pulled tight
amb(29, 35, room, .01); add(fx, rustle(.5), 29.6, .03)
# 35-40 rain on the road: heavy rain, a passing car hiss, the ratchet, the wrench drops at 37.7
amb(35, 40.0, rain_h, .05); amb(35, 40.0, rain_l, .03)
add(fx, bp(noise(2.0), 300, 3000) * np.sin(np.pi * t_(2.0) / 2.0), 35.6, .03, -.6)
for t0 in np.arange(35.3, 37.4, .25): add(fx, ratchet(), t0, .04, .2)
add(fx, clink(1900) + clink(2400) * .6, 37.7, .05, .1)
# 40-44 wedding: murmur and glasses, the box rustle; the hall falls silent as she presses play (44.2)
murmur = bp(noise(3.0), 250, 2200) * (.7 + .3 * np.sin(2 * np.pi * .7 * t_(3.0))); amb(40.1, 44.3, murmur, .05)
for t0 in [40.6, 41.9, 43.1]: add(fx, clink(rng.uniform(2600, 3400)), t0, .008, rng.uniform(-.6, .6))
add(fx, rustle(.6), 41.0, .03); add(fx, rustle(.4), 43.4, .03); add(fx, tick() * 2, 44.15, .05)
amb(44.3, 62, room, .006)
# 49-53 her dress on the floor; 53.2 Sam's steps
add(fx, rustle(1.5) * .5, 49.3, .015); [add(fx, sfx.step(.5), t0, .02, .3) for t0 in (52.5, 52.9)]

# ================= mix =================
mus *= .5 / np.sqrt((mus[int(1 * SR):int(60 * SR)] ** 2).mean()); fx *= 4.0
vo *= .5 / np.sqrt((vo[np.abs(vo).max(1) > 1e-4] ** 2).mean())
duck = np.ones(N); act = np.convolve((np.abs(vo).max(1) > .02).astype(float), np.ones(int(.3 * SR)) / (.3 * SR), 'same'); duck = 1 - .55 * np.minimum(1, act * 3)
mix_ = mus * .42 * duck[:, None] + fx + vo * 1.25
# the white bloom (40.0): a breath of total silence
s0, s1 = int(39.85 * SR), int(40.25 * SR); g = np.ones(N); g[s0:s1] = np.concatenate([np.linspace(1, 0, (s1 - s0) // 2), np.linspace(0, 1, (s1 - s0) - (s1 - s0) // 2)]); mix_ *= g[:, None]
mix_ = hp(mix_.T, 30).T; mix_ *= .7 / np.abs(mix_).max()
for ch in range(2): mix_[:, ch] = sfx.limit(mix_[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix_.astype(np.float32), SR, subtype='FLOAT'); print('mix written', mix_.shape[0] / SR)
