# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav. Everything synthesised with numpy,
# timed from film.json (narration layout) and events.json (the page's sound cues, exported by events.mjs).
import json, os, sys, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d, maximum_filter1d
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_, norm
H = os.path.dirname(os.path.abspath(__file__))
F = json.load(open(f'{H}/film.json')); EV = json.load(open(f'{H}/events.json'))['ev']
DUR = F['dur']; N = int(DUR * SR); S0, HIT = F['S0'], F['HIT']
L0 = lambda i: F['lines'][i][0]; L1 = lambda i: F['lines'][i][1]
def W(i, w):
    for x in F['words'][i]:
        if x[0].lower().strip('.,?!') == w: return x[1]
    return F['words'][i][0][1]
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); rng = np.random.default_rng(7)
mt = lambda m: 440 * 2 ** ((m - 69) / 12)
ev = lambda typ: [e for e in EV if e['type'] == typ]
tR = next(e['t'] for e in EV if e['type'] == 'rewind'); tE = next(e['t'] for e in EV if e['type'] == 'click')

# ---------------- instruments ----------------
def env(d, a=.005, r=.05):
    tt = t_(d); return np.minimum(1, tt / max(a, 1e-4)) * np.minimum(1, np.maximum(0, d - tt) / max(r, 1e-4))
def saw(f, d, det=0.):
    tt = t_(d); x = np.zeros_like(tt)
    for dd in (-det, 0, det): x += 2 * ((tt * f * (1 + dd)) % 1) - 1
    return x / 3
def bass(m, d, v=1., bright=1.):
    tt = t_(d); f = mt(m); x = saw(f, d, .003) * .7 + np.sin(2 * np.pi * f * tt) * .7
    e = np.exp(-tt / .06); x = lp(x, 300 + 500 * bright) * (1 - e) + lp(x, 1400 + 1200 * bright) * e
    return np.tanh(x * 1.8) * np.exp(-tt / .22) * env(d, .003, .03) * v
def sub(v=1., f0=90, f1=34, d=2.4):
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-tt / .08); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d / 3.5))
    x += .3 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d / 6)); return np.tanh(x * 1.5) * v
def kick(v=1., f0=140, f1=44, d=.45):
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-tt / .03); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .13)
    x = np.tanh(x * 1.7); x[:200] += noise(200 / SR)[:200] * .4 * np.linspace(1, 0, 200); return x * v
def tick(v=1., f=3800, d=.025):
    x = bp(noise(d), f * .75, f * 1.3, 2) * np.exp(-t_(d) / .004); return norm(x) * v
def bell(m, d=1.2, v=1., idx=2.5):
    tt = t_(d); f = mt(m); x = np.sin(2 * np.pi * f * tt + idx * np.exp(-tt / .25) * np.sin(2 * np.pi * f * 3.5 * tt))
    return x * np.exp(-tt / (d / 3.5)) * env(d, .002, .05) * v
def pluck(m, d=.32, v=1.):
    tt = t_(d); f = mt(m); x = np.sin(2 * np.pi * f * tt + 1.2 * np.exp(-tt / .04) * np.sin(2 * np.pi * f * 2 * tt))
    x += .3 * saw(f * 2, d) * np.exp(-tt / .03); return x * np.exp(-tt / .1) * env(d, .002, .03) * v
def pad(ms, d, v=1., cut=1500, att=.6, rel=.6):
    x = sum(saw(mt(m), d, .005) for m in ms) / len(ms); x = lp(lp(x, cut), cut * 1.4)
    return x * env(d, att, rel) * v
def riser(d, v=1., f0=200, f1=7000):
    tt = t_(d); n = noise(d); out = np.zeros_like(n); B = 1200
    for k in range(0, len(n), B):
        fc = f0 * (f1 / f0) ** (k / len(n)); e = min(len(n), k + B); seg_ = n[max(0, k - 6000):e]
        out[k:e] = bp(seg_, fc * .8, min(fc * 1.25, 20000))[-(e - k):]
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (3.5 * tt / d)) / SR) * .4
    return (norm(out) * .8 + tone) * (tt / d) ** 2.2 * v
def crash(d=2.5, v=1.): tt = t_(d); return hp(noise(d), 4000) * np.exp(-tt / .8) * v
def whoosh(d=.4, v=1.):
    tt = t_(d); n = noise(d); x = np.zeros_like(n); B = 600
    for k in range(0, len(n), B):
        u = k / len(n); fc = 300 + 3500 * np.sin(np.pi * u) ** 2; e = min(len(n), k + B); x[k:e] = bp(n[max(0, k - 3000):e], fc * .6, fc * 1.6)[-(e - k):]
    return norm(x) * np.sin(np.pi * tt / d) ** 1.5 * v
def zap(v=1., f0=2400, f1=600, d=.12):
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-tt / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .04) * v
def blip(f=1320, d=.09, v=1.): tt = t_(d); return np.sin(2 * np.pi * f * tt) * np.exp(-tt / .03) * env(d, .001, .01) * v
def shimmer(d, v=1.):
    tt = t_(d); x = bp(noise(d), 6000, 14000) * (.5 + .5 * np.sin(2 * np.pi * 23 * tt) ** 2) * np.sin(np.pi * tt / d)
    return x * v
def hum(d, v=1.):
    tt = t_(d); ramp = np.minimum(1, tt / .9); f = 55 + 55 * ramp ** .6
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .6 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * .3 + np.sin(2 * np.pi * np.cumsum(f * 3) / SR) * .15
    fan = bp(noise(d), 300, 2500) * .25 * ramp; whine = np.sin(2 * np.pi * np.cumsum(3000 + 1800 * ramp) / SR) * .02 * ramp
    return (x + fan + whine) * env(d, .05, .4) * v
def tape_rewind(d=1.0, v=1.):
    tt = t_(d); f = 900 * (1 - tt / d) ** 1.6 + 60; x = saw(1, d) * 0
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + bp(noise(d), 800, 5000) * (1 - tt / d) * .5
    x += whoosh(d, .6)[:len(x)] * 0 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * .2
    return x * env(d, .02, .1) * v
def sparkle(d=.6, v=1.):
    x = np.zeros(int(d * SR))
    for k in range(18):
        at = int(rng.uniform(0, d * .8) * SR); g = bell(rng.choice([86, 88, 91, 93, 95, 98]), .25, .3)
        x[at:at + len(g)] += g[:len(x) - at]
    return x * v

# ---------------- score ----------------
BPM = 104; beat = 60 / BPM
CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]            # Dm  Bb  F  C
ROOT = [38, 34, 41, 36]
def chord_at(t): return int((t / (beat * 8)) % 4)
grid = np.arange(0, DUR, beat / 2)                                        # eighth notes
for k, t in enumerate(grid):
    if S0 - .01 <= t < HIT: continue
    c = chord_at(t); r = ROOT[c]
    hook = t < tR; slow = tR <= t < tE + .05; build = tE <= t < S0; twist = HIT <= t < L0('n12') - .15; outro = t >= L0('n12') - .15
    if slow: continue                                                      # "let's slow it down": the pulse stops
    # pulsing synth bass, eighths
    if hook or build or outro:
        g = .30 if hook else .26 + .1 * (t - tE) / max(1, S0 - tE)
        add(mus, bass(r + (12 if k % 4 == 3 else 0), beat / 2 * .92, 1., .6 + .6 * (t > L0('n7'))), t, g)
    elif twist and k % 2 == 0:
        add(mus, bass(r - 12 + 12, beat * .95, 1., .3), t, .26)               # half-time in the twist
    # kick on beats
    if k % 2 == 0 and (hook or (build and t > L0('n6')) or outro): add(mus, kick(.9), t, .42 if not outro else .3)
    if twist and k % 4 == 0: add(mus, kick(.9, 120, 40), t, .38)
    # ticking millisecond clock (tick-tock), from Enter to the silence, accelerating to 16ths in the predict section
    if build:
        add(fx, tick(1, 4200 if k % 2 else 3300), t, .16, .25)
        if t > L0('n8'): add(fx, tick(.8, 5000), t + beat / 4, .11, -.25)
# hook drone + awe pads
add(mus, pad([38, 45, 50, 53], tR + .3, 1., 900, .3, .4), 0, .22)
add(mus, pad([62, 65, 69], tR - 2.3 + .3, 1., 2200, 1.5, .4), 2.3, .08)
# slow-motion bed: one long low chord through the rewind and Enter
add(mus, pad([38, 50, 57], tE - tR + .8, 1., 600, .4, .7), tR, .2)
# build: pads follow the chords; rising arpeggios layer in (tokens -> map -> data centre -> attention)
t = tE; seg = beat * 8
while t < S0:
    d = min(seg, S0 - t); c = chord_at(t + .01)
    add(mus, pad([x - 12 for x in CH[c]] + [CH[c][0]], d + .2, 1., 1100 + 900 * (t > L0('n6')), .3, .25), t, .14)
    t += seg
arp_from = L0('n4') - .2
for k, t in enumerate(np.arange(arp_from, S0 - .02, beat / 4)):
    c = chord_at(t); notes = CH[c] + [CH[c][0] + 12, CH[c][1] + 12, CH[c][2] + 12]
    dens = 1 if t > L0('n7') else (2 if t > L0('n5') else 4)
    if k % dens: continue
    oct = 12 if t > L0('n6') else 0
    m = notes[(k // dens) % len(notes)] + 12 + oct
    g = .08 + .06 * (t - arp_from) / (S0 - arp_from)
    add(mus, pluck(m, .3), t, g, .45 if (k // dens) % 2 else -.45)
# riser into the twist, hard cut at S0
dr = S0 - (L0('n9') - .6); add(mus, riser(dr, .75), S0 - dr, .55)
for k in range(20):
    at = S0 - dr + dr * (1 - (1 - k / 20) ** 1.7); add(mus, bp(noise(.07), 900, 5000) * np.exp(-t_(.07) / .02), at, .1 + .25 * k / 20, rng.uniform(-.3, .3))
# the hit: sub boom + kick + crash + low stab, then a dark twist bed
add(mus, sub(1.1, 100, 32, 3.2), HIT, .9); add(mus, kick(1.2, 170, 38, .6), HIT, .8); add(mus, crash(3.0), HIT, .3)
add(mus, pad([26, 38, 45, 50, 57], 2.4, 1., 800, .004, 1.6), HIT, .45)
tw_end = L0('n12') - .15
add(mus, pad([38, 45, 50, 53], tw_end - HIT - .3, 1., 1000, 1.2, .6), HIT + .3, .17)
add(mus, pad([62, 69, 74], tw_end - (L0('n11') + 2), 1., 2600, 1.5, .5), L0('n11') + 2, .07)
for k, t in enumerate(np.arange(W('n11', 'trained'), tw_end, beat / 2)):         # mountains: glassy arpeggio returns
    add(mus, pluck([62, 65, 69, 74, 77, 74, 69, 65][k % 8] + 12, .3), t, .07, .4 if k % 2 else -.4)
# outro: lift to D major, awe
add(mus, pad([38, 50, 54, 57, 62], DUR - tw_end, 1., 1800, .5, 1.5), tw_end, .2)
add(mus, sub(.9, 90, 36, 2.6), tw_end, .6); add(mus, crash(2.0), tw_end, .15)
for k, t in enumerate(np.arange(tw_end, DUR - 1.2, beat / 4)):
    add(mus, pluck([74, 78, 81, 86, 81, 78][k % 6], .3), t, .06, .4 if k % 2 else -.4)
# silence before the twist: digital zero on every music track
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
for e in EV:
    t, g = e['t'], e.get('g', 1.)
    T = e['type']
    if T == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .32 * g, rng.uniform(-.5, .5))
    elif T == 'rewind': add(fx, tape_rewind(1.1), t, .55); add(fx, whoosh(.9, 1.)[::-1].copy(), t, .3)
    elif T == 'click': add(fx, sfx.click(1.3, 1.), t - .01, .8); add(fx, tick(1, 2200, .04), t, .5)
    elif T == 'boom': add(fx, sub(1., 85, 36, 1.6), t, .55 * g); add(fx, kick(.8, 120, 40), t, .3 * g)
    elif T == 'pop': add(fx, sfx.pop(1.), t, .35 * g, rng.uniform(-.4, .4)); add(fx, blip(1500 + 120 * rng.integers(0, 6), .06), t, .15)
    elif T == 'flip': add(fx, tick(1, 2600, .03), t, .35 * g); add(fx, blip(900 + 200 * rng.integers(0, 5), .07), t + .03, .18)
    elif T == 'chime': add(fx, bell(86, 1.6), t, .22 * g, -.2); add(fx, bell(93, 1.4), t + .02, .12 * g, .2)
    elif T == 'chime2': add(fx, bell(88, 1.6), t, .22 * g, .2); add(fx, bell(95, 1.4), t + .02, .12 * g, -.2)
    elif T == 'shimmer': add(fx, shimmer(e.get('d', 1.5)), t, .22); add(fx, sparkle(1.2), t + .1, .25)
    elif T == 'hum': add(fx, hum(e.get('d', 2.5)), t, .5)
    elif T == 'zap': add(fx, zap(1., 2600 + rng.uniform(-400, 600), 700, .14), t, .14 * g, rng.uniform(-.6, .6)); add(fx, shimmer(.25), t, .05 * g)
    elif T == 'strike': add(fx, bp(noise(.3), 1500, 7000) * np.sin(np.pi * t_(.3) / .3), t, .3)
    elif T == 'shatter': add(fx, sparkle(.7), t, .35); add(fx, hp(noise(.5), 3000) * np.exp(-t_(.5) / .12), t, .18)
    elif T == 'pick': add(fx, blip(1320, .1), t, .3 * g); add(fx, tick(1, 3000, .03), t, .3 * g); add(fx, kick(.5, 160, 70, .15), t, .25 * g)
    elif T == 'tick': add(fx, blip(1700 + 60 * rng.integers(0, 8), .06), t, .18 * g, rng.uniform(-.5, .5)); add(fx, sfx.pop(.7), t, .08)
    elif T == 'hit': add(fx, sfx.thump(1., 55), t, .6)
# hook: a data stream shimmer under the eruption of numbers
add(fx, shimmer(tR - .3, 1.), .2, .12); add(fx, sparkle(1.5), 2.6, .2)
fx[s0i:hiti] = 0

# ---------------- voice, balance, stems ----------------
vo, sr = sf.read(f'{H}/out/vo.wav'); vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 70); vo = sfx.compress(vo, thr=.1, ratio=3.2, att=.003, rel=.1)
act_env = maximum_filter1d(np.abs(vo), int(.12 * SR)); act = act_env > .02 * act_env.max()
vo *= .22 / np.sqrt((vo[act] ** 2).mean())
ve = uniform_filter1d(act.astype(float), int(.15 * SR))
duck = 1 - (1 - 10 ** (-5 / 20)) * ve
mus *= duck[:, None]; fx *= (1 - (1 - 10 ** (-2 / 20)) * ve)[:, None]
vr = np.sqrt((vo[act] ** 2).mean()); mr = np.sqrt((mus[act] ** 2).mean())
mus *= (vr / 10 ** (10 / 20)) / mr                                        # voice 10 dB above the music (RMS while speaking)
fr = np.sqrt((fx[np.abs(fx).max(1) > 1e-4] ** 2).mean()); fx *= (vr / 10 ** (8 / 20)) / fr
vo2 = np.stack([vo, vo], 1)
mix = mus + fx + vo2
mix = hp(mix.T, 25).T
pk = np.abs(mix).max(); sc = .7 / pk
mix *= sc; mus *= sc; fx *= sc; vo2 *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
mix[s0i:hiti] = 0
os.makedirs(f'{H}/stems', exist_ok=True)
sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
for n, x in (('vo', vo2), ('music', mus), ('sfx', fx)): sf.write(f'{H}/out/stem_{n}.wav', x.astype(np.float32), SR, subtype='FLOAT')
db = lambda a, b: 20 * np.log10(np.sqrt((a[act] ** 2).mean()) / np.sqrt((b[act] ** 2).mean()))
print(f'mix written {DUR:.2f}s  voice-music {db(vo2, mus):.1f} dB  voice-sfx {db(vo2, fx):.1f} dB')
