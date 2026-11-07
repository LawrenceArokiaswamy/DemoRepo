# Score + foley + voice -> out/mix.wav. Everything is synthesised (numpy), timed from film.json / beats.json / caps.json.
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_, norm
H = os.path.dirname(os.path.abspath(__file__))
F = json.load(open(f'{H}/film.json')); BEATS = json.load(open(f'{H}/beats.json'))
DUR = F['dur']; N = int(DUR * SR); S0, S1 = F['silence']; HIT = F['hit']; LIFT = F['lift']
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
rng = np.random.default_rng(11)
mt = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
def kick(v=1., f0=130, f1=42, d=.42, click=.5):
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-tt / .035); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / .14); x = np.tanh(x * 1.6)
    x[:240] += noise(.005) * click * np.linspace(1, 0, 240); return x * v
def sub(v=1., f=38, d=2.2):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt + 3 * np.exp(-tt / .05)) * np.exp(-tt / (d / 3.2))
    x += .35 * np.sin(4 * np.pi * f * tt) * np.exp(-tt / (d / 5)); return np.tanh(x * 1.4) * v
def tick(v=1., f=3200):
    d = .03; x = bp(noise(d), f * .7, f * 1.3, 2) * np.exp(-t_(d) / .006); return norm(x) * v
def buzz(d=.35, v=1.):  # phone vibration motor
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 168 * tt)) * .6 + np.sin(2 * np.pi * 336 * tt) * .3
    x = lp(x, 900) * (0.75 + .25 * np.sin(2 * np.pi * 31 * tt)); e = np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .02)
    return x * e * v
def marimba(m, d=.45, v=1.):
    tt = t_(d); f = mt(m); x = (np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt / .03)) * np.exp(-tt / .16)
    return x * np.minimum(1, tt / .002) * v
def ringtone(at, gain, buf, reps=2):  # an original 6-note phone ring
    for rep in range(reps):
        for k, m in enumerate([81, 76, 81, 76, 84, 83]): add(buf, marimba(m, .3), at + rep * .62 + k * .085, gain, .1)
def saw(f, d, det=0.):
    tt = t_(d); x = np.zeros_like(tt)
    for dd in (-det, 0, det): x += 2 * ((tt * f * (1 + dd)) % 1) - 1
    return x / 3
def pad(ms, d, v=1., cut=1400, att=.4):
    x = sum(saw(mt(m), d, .004) for m in ms) / len(ms); x = lp(x, cut, 2); tt = t_(d)
    return x * np.minimum(1, tt / att) * np.minimum(1, (d - tt) / .3) * v
def bass(m, d, v=1.):
    tt = t_(d); f = mt(m); x = saw(f, d, .002) * .7 + np.sin(2 * np.pi * f * tt) * .6
    e = np.exp(-tt / .05); x = lp(x, 600) * (1 - e) + lp(x, 1800) * e; return np.tanh(x * 1.5) * np.exp(-tt / .18) * np.minimum(1, tt / .003) * v
def pluck(m, d=.35, v=1.):
    tt = t_(d); f = mt(m); x = np.sin(2 * np.pi * f * tt + .8 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / .05)) * np.exp(-tt / .12)
    return x * np.minimum(1, tt / .002) * v
def thud(v=1.): return sfx.thump(v, 60)
def swoosh(d=.28, v=1.): return sfx.whoosh(d, v)
def key(v=1.): d = .025; return norm(bp(noise(d), 1800, 6000) * np.exp(-t_(d) / .004)) * v
def scratch(d=.4, v=1.): tt = t_(d); return bp(noise(d), 2500, 7000) * (0.5 + .5 * np.sin(2 * np.pi * 23 * tt)) ** 2 * np.sin(np.pi * tt / d) * v * .6
def beep(f, d, v=1.): tt = t_(d); return np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / .005) * np.minimum(1, (d - tt) / .005) * v
def crash(d=2.5, v=1.): tt = t_(d); return hp(noise(d), 3000) * np.exp(-tt / .7) * v

# ---------- score ----------
for i, b in enumerate(BEATS):
    if b < 3.3:   # heartbeat under the hook
        add(mus, kick(.9, 110, 45, click=.15), b, .8); add(mus, kick(.55, 95, 42, click=.1), b + .2, .6)
    elif b < S0:  # accelerating pulse
        add(mus, kick(1.0), b, .95)
        if b > 8.9 and i + 1 < len(BEATS): add(mus, tick(1, 4200), (b + BEATS[i + 1]) / 2, .22)
        add(mus, tick(1), b, .3)
    elif b < LIFT:
        add(mus, kick(.8, 120, 40), b, .75); add(mus, tick(1, 2600), b, .14)
    else:
        add(mus, kick(.9, 125, 44), b, .8)
        if i + 1 < len(BEATS): add(mus, hp(noise(.05), 7000) * np.exp(-t_(.05) / .015), (b + BEATS[i + 1]) / 2, .25, .3)
# phone-vibration buzz as rhythm (on the offbeat of every other bar)
for i, b in enumerate(BEATS):
    if 3.3 < b < S0 and i % 8 == 6: add(mus, buzz(.22), b + .12, .28, -.3)
# D minor bass ostinato in 8ths, 3.3 -> 21.1
pat = [38, 38, 50, 38, 41, 38, 46, 45]
for i, b in enumerate(BEATS):
    if 3.3 <= b < S0 and i + 1 < len(BEATS):
        bl = BEATS[i + 1] - b; root = [38, 38, 34, 33][(i // 8) % 4] if b > 8.9 else 38
        for h in range(2): add(mus, bass(root + (12 if h and (i % 4 == 3) else 0), bl / 2 * .9), b + h * bl / 2, .32 * (0.75 + .25 * (b / S0)))
# tension drone + minor-second cluster that swells into the reveal
add(mus, pad([50, 51, 57], S0 - 3.3, 1., cut=900, att=3.), 3.3, .22)
add(mus, pad([62, 63], S0 - 12, 1., cut=2400, att=6.), 12, .12)
# riser 19.6 -> 21.1: noise sweep + rising tone, hard cut at S0
d = S0 - 19.6; tt = t_(d); n = noise(d); out = np.zeros_like(n)
for k in range(0, len(n), 960):
    f = 400 + 6000 * (k / len(n)) ** 2; e = min(len(n), k + 960); out[k:e] = bp(n[max(0, k - 4000):e], f * .8, f * 1.25)[-(e - k):]
ris = norm(out) * (tt / d) ** 2 * .8 + np.sin(2 * np.pi * np.cumsum(110 * 2 ** (3 * tt / d)) / SR) * (tt / d) ** 2 * .35
add(mus, ris, 19.6, .7)
for k in range(16):  # snare-ish roll accelerating
    at = 19.6 + d * (1 - (1 - k / 16) ** 1.6); add(mus, bp(noise(.08), 900, 5000) * np.exp(-t_(.08) / .02), at, .15 + .25 * k / 16)
# the twist: massive hit
add(mus, sub(1.0, 36, 3.2), HIT, 1.0); add(mus, kick(1.2, 160, 38, .6, 1.), HIT, 1.0); add(mus, crash(2.8), HIT, .35)
add(mus, pad([26, 38, 45, 50], 2.6, 1., cut=700, att=.005), HIT, .5)
add(mus, pad([38, 45, 50, 53], LIFT - HIT - .2, 1., cut=800, att=1.), HIT + .2, .16)
add(mus, sub(.8, 40, 1.6), 22.97, .7)
# the lift: hopeful but tense (F - C - Dm - Bb), plucked 8ths
chords = [[53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62]]
lb = [b for b in BEATS if b >= LIFT - .01]
for j, b in enumerate(lb):
    ch = chords[(j // 4) % 4]
    if j % 4 == 0: add(mus, pad(ch, min(4 * 60 / 122, DUR - b) , 1., cut=2600, att=.25), b, .2); add(mus, bass(ch[0] - 12, .45), b, .35)
    bl = 60 / 122
    for h in range(2): add(mus, pluck(ch[(j * 2 + h) % 4] + 12, .3), b + h * bl / 2, .16, .4 if h else -.4)
add(mus, sub(.7, 44, 2.0), LIFT, .6); add(mus, crash(1.6), LIFT, .15)
add(mus, sub(.6, 44, 1.8), 33.3, .5)
# hard cut to silence before the twist
fade = int(.012 * SR); s0, s1 = int(S0 * SR), int(S1 * SR)
mus[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None]; mus[s0:s1] = 0

# ---------- foley (every visible action) ----------
add(fx, buzz(.42), 0.0, .7); ringtone(0.0, .35, fx, 1); add(fx, key(1), .40, .5)          # ring + answer
HARD = {'B1', 'F1', 'SIL', 'A1'}
for sid, t0 in F['shots']:
    if sid not in HARD: add(fx, swoosh(.26), max(0, t0 - .1), .32, rng.uniform(-.5, .5))
for at, g in [[3.3, 1.0], [4.3, .6], [11.55, .55], [11.86, .55], [16.08, .9], [18.22, .5], [30.16, .55]]:
    add(fx, thud(1), at, g); add(fx, sub(.5, 42, .8), at, .35 * g)
add(fx, scratch(.25), 3.66, .5)                                         # strike-through
add(fx, crash(.5), 3.3, .25)
for k in range(10): add(fx, tick(1, 2400), 5.32 + k * .1, .3)            # stopwatch
add(fx, beep(1760, .08), 6.32, .18)
for k in range(12): add(fx, tick(.8, 3000 + 60 * k), 6.45 + k * .05, .18) # meter fill
add(fx, scratch(.4), 7.6, .35); add(fx, tick(1, 1800), 7.95, .3)         # leader + sample chip
for t0, n in [(8.95, 14), (10.12, 10), (12.88, 16)]:                     # transcript typing
    for k in range(n): add(fx, key(.8 + .2 * rng.random()), t0 + k * .028 + rng.uniform(0, .01), .22, rng.uniform(-.2, .2))
for at in [9.5, 10.4, 13.2, 14.0]: add(fx, scratch(.3), at, .35)          # highlights
for at in [11.6, 11.91, 24.13, 24.45, 31.25]: add(fx, marimba(84, .3), at, .25)  # check badges
add(fx, scratch(.5), 14.2, .4); add(fx, scratch(.5), 14.4, .35)         # circles
for at in [15.12, 15.3, 15.48]: add(fx, thud(.6), at, .3)
for k in range(18): add(fx, tick(.8, 2600 + 50 * k), 16.85 + k * .05, .2) # counter
for k in range(24): add(fx, tick(.6, 5200), 18.35 + k * .048, .08)       # dots lighting
add(fx, crash(1.2), 23.0, .2)
ringtone(25.3, .25, fx); add(fx, buzz(.4), 25.3, .5); add(fx, buzz(.4), 26.0, .45)
add(fx, marimba(77, .4), 27.02, .2); add(fx, marimba(81, .4), 27.1, .2)
for k in range(7): add(fx, key(1), 28.02 + k * .07, .25)                 # safe word locking in
add(fx, key(1), 30.16, .6); add(fx, beep(480, .12), 30.25, .12); add(fx, beep(480, .12), 30.4, .12)  # hang up tone
add(fx, beep(440, .9) + beep(480, .9), 30.62, .05)                        # call-back ringback
add(fx, swoosh(.5), 32.1, .4)
fx[s0:s1] = 0

# ---------- voice ----------
vn, _ = sf.read(f'{H}/out/voice_narr.wav'); vs, _ = sf.read(f'{H}/out/voice_scam.wav')
def comp(x): return sfx.compress(x, thr=.12, ratio=3.5, att=.003, rel=.09)
vn = comp(vn); vs = comp(vs)
def rms_active(x): a = np.abs(x); m = a > .02 * a.max(); return np.sqrt((x[m] ** 2).mean())
vn *= .25 / rms_active(vn); vs *= .25 / rms_active(vs) * 1.12
voice = vn + vs
# ducking: music -9 dB under voice
from scipy.ndimage import uniform_filter1d, maximum_filter1d
ve = maximum_filter1d(np.abs(voice), int(.15 * SR)); ve = uniform_filter1d((ve > .03).astype(float), int(.12 * SR))
duck = 1 - (1 - 10 ** (-9 / 20)) * ve
mb = mus * duck[:, None]
# balance: voice ~10 dB above the music bed (RMS where voice is active)
act = ve > .5
mr = np.sqrt((mb[act] ** 2).mean()); vr = np.sqrt((voice[act] ** 2).mean())
mb *= (vr / 10 ** (10 / 20)) / mr
fxb = fx * ((vr / 10 ** (7 / 20)) / max(1e-9, np.sqrt((fx[np.abs(fx).max(1) > 1e-4] ** 2).mean())))
mix = mb + fxb + voice[:, None]
mix = hp(mix.T, 28).T
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch] / np.abs(mix).max() * .98, ceil=.6)
mix = mix / np.abs(mix).max() * .89
mix[s0:s1] = 0
sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
print('mix written', mix.shape, 'voice/music dB', round(20 * np.log10(vr / np.sqrt((mb[act] ** 2).mean())), 1))
