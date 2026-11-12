# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav for "Final Day: 1 million robots vs. aliens". Everything synthesised with numpy (no samples),
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
        if x[0].lower().strip('.,?!:') == w: return x[1]
    return F['words'][i][0][1]
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); rng = np.random.default_rng(7)
mt = lambda m: 440 * 2 ** ((m - 69) / 12)
E1 = lambda typ: next(e['t'] for e in EV if e['type'] == typ)

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

def keytap(v=1., f=2400):
    x = bp(noise(.03), f * .6, f * 1.8, 2) * np.exp(-t_(.03) / .004); y = np.sin(2 * np.pi * 180 * t_(.03)) * np.exp(-t_(.03) / .006) * .5
    return norm(x + y) * v
def boing(v=1.):
    d = .55; tt = t_(d); f = 220 + 160 * np.sin(2 * np.pi * 7 * tt) * np.exp(-tt / .25) + 120 * np.exp(-tt / .05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .22) * env(d, .002, .05) * v
def wahwah(v=1.):   # comedic "nope" sting: two falling muted-brass notes
    out = np.zeros(int(1.0 * SR))
    for k, (m0, m1, d) in enumerate([(63, 62, .26), (61, 56, .62)]):
        tt = t_(d); f = mt(m0) + (mt(m1) - mt(m0)) * np.minimum(1, tt / d) ** 1.5
        ph = 2 * np.pi * np.cumsum(f) / SR; x = sum(np.sin(ph * h) / h ** 1.1 for h in range(1, 9))
        wob = .55 + .45 * np.sin(2 * np.pi * 5.5 * tt) if k == 1 else 1
        x = lp(x, 900 + 1400 * wob if np.ndim(wob) == 0 else 1600) * env(d, .02, .08) * (wob if k == 1 else 1)
        at = int((0 if k == 0 else .3) * SR); out[at:at + len(x)] += x[:len(out) - at]
    return norm(out) * v
def sting_up(v=1.):  # cheerful "correct!" two-note bell
    a = bell(84, 1.0, 1, 1.5); b = bell(91, 1.0, 1, 1.5); o = np.zeros(len(a) + int(.12 * SR)); o[:len(a)] += a; o[int(.12 * SR):] += b; return o * v

# ---------------- score: war trailer (D minor, 128 BPM) ----------------
EVT = lambda typ: [e['t'] for e in EV if e['type'] == typ]
BPM = 128; b = 60 / BPM
tA0 = L0('n2') - .05; tCH = L0('n3') - .05; tLOSE = L0('n4') - .05; tMS = L0('n5') - .05; tSTOP = L0('n6') - .05; tQ = L0('n7') - .05
HITt = F['HIT']; tCL = L0('n9') - .05; tONE = L0('n10') - .05; tMTN = W('n10', 'mountain') - .1; tBACK = L0('n11') - .05; tCTA = L0('n12') - .05; tPUNCH = EVT('beam')[0]
def brass(ms, d, v=1., cut=1800): x = sum(saw(mt(m), d, .006) for m in ms) / len(ms); return lp(lp(x, cut), cut * 1.3) * env(d, .2, .3) * v
def taiko(v=1., f=70): d = .7; tt = t_(d); fq = f * (1 + .5 * np.exp(-tt / .04)); x = np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-tt / .25); x += bp(noise(d), 200, 2000) * np.exp(-tt / .03) * .4; return np.tanh(x * 1.8) * v
def snare(v=1.): d = .25; return (bp(noise(d), 1500, 7000) * np.exp(-t_(d) / .07) + np.sin(2 * np.pi * 190 * t_(d)) * np.exp(-t_(d) / .04) * .6) * v
def choir(ms, d, v=1.):   # formant-filtered saw stack: an "ahh" pad
    x = sum(saw(mt(m), d, .008) for m in ms) / len(ms); y = bp(x, 600, 1000) * .7 + bp(x, 1000, 1400) * .5 + bp(x, 2300, 2900) * .25; return y * env(d, .5, .6) * v
# 1) hook: war drums + low brass, building to the charge
for k, t in enumerate(np.arange(0, tCH - .05, b)):
    add(mus, taiko(1., 62 if k % 2 == 0 else 80), t, .3 + .1 * (t > tA0), (-.3, .3)[k % 2])
    if k % 4 == 3: add(mus, taiko(.8, 95), t + b / 2, .2)
add(mus, brass([38, 45, 50], tA0 + .4, 1., 800), 0, .24); add(mus, brass([38, 45, 50, 53], tCH - tA0, 1., 1400), tA0, .26)
dr = 1.3; add(mus, riser(dr, .8), tCH - dr, .45)
# 2) the charge: full drop, driving 8ths, brass stabs
add(mus, sub(1.2, 100, 30, 2.5), tCH, .7); add(mus, crash(2.2), tCH, .14)
for k, t in enumerate(np.arange(tCH, tMS - .05, b / 2)):
    if k % 2 == 0: add(mus, kick(1.1, 150, 40, .45), t, .38)
    if k % 4 == 2: add(mus, snare(1.2), t, .15)
    add(mus, bass([38, 38, 34, 36][(k // 8) % 4], b / 2 * .85, 1., .7), t, .24); add(mus, tick(1, 7000, .02), t, .035)
    if k % 8 == 0: add(mus, brass([50, 57, 62], b * 1.5, 1., 2600), t, .16)
    if k % 4 == 0: add(mus, taiko(1., 70), t, .18)
# 3) losing -> mothership: half-time, sinking minor, brass falling
for k, t in enumerate(np.arange(tMS, tSTOP - .05, b)):
    add(mus, taiko(1.1, 55), t, .36); add(mus, bass([38, 37, 36, 34][k % 4], b * .9, 1., .4), t, .24)
add(mus, brass([50, 53, 57], tSTOP - tMS + .2, 1., 1600), tMS, .26); add(mus, choir([62, 65, 69], tSTOP - tMS + .3, 1.), tMS + .3, .14)
# 4) the stop: everything drains away (low drone fading), then silence from the question
d = tQ - tSTOP + .4; add(mus, pad([26, 33, 38], d, 1., 500, .1, d * .8), tSTOP, .22)
dr = 1.2; add(mus, riser(dr, .5, 120, 2400), F['S0'] - dr, .25)
# 5) "No." hit -> "calculating" pulse -> climb build -> giant
add(mus, sub(1.2, 110, 30, 2.6), HITt, .75); add(mus, kick(1.2, 170, 38, .6), HITt, .55); add(mus, crash(2.0), HITt, .12)
for k, t in enumerate(np.arange(HITt + b, tCL, b / 4)): add(mus, pluck([74, 77, 81, 86][k % 4] - 12, .14), t, .045, (-.4, .4)[k % 2])
for k, t in enumerate(np.arange(tCL, tMTN - .05, b / 2)):
    acc = (t - tCL) / (tMTN - tCL)
    if k % 2 == 0: add(mus, kick(1.0, 140, 40, .45), t, .3 + .1 * acc)
    if k % 2 == 1 or acc > .6: add(mus, taiko(.9, 75 + 30 * acc), t, .14 + .1 * acc, (-.3, .3)[k % 2])
    add(mus, bass([38, 41, 43, 45][(k // 8) % 4], b / 2 * .85, 1., .6), t, .2)
add(mus, choir([50, 57, 62, 65], tMTN - tCL + .2, 1.), tCL, .18); dr = 1.6; add(mus, riser(dr, .9), tMTN - dr, .5)
# 6) THE GIANT: triumphant D major, brass + choir; then the back-away and the punch
add(mus, sub(1.3, 100, 28, 3.0), tMTN, .8); add(mus, crash(2.6), tMTN, .16)
add(mus, brass([38, 50, 54, 57, 62], tCTA - tMTN + .3, 1., 2800), tMTN, .3); add(mus, choir([62, 66, 69, 74], tCTA - tMTN + .3, 1.), tMTN, .2)
for k, t in enumerate(np.arange(tMTN, tPUNCH - .05, b / 2)):
    if k % 2 == 0: add(mus, kick(1.1, 150, 40, .45), t, .34)
    if k % 4 == 2: add(mus, snare(1.1), t, .14)
    add(mus, bass([38, 38, 43, 45][(k // 8) % 4], b / 2 * .85, 1., .7), t, .22)
dr = 1.0; add(mus, riser(dr, .8), tPUNCH - dr, .4)
add(mus, brass([38, 50, 54, 57, 62, 66], DUR - tPUNCH, 1., 3000), tPUNCH + .45, .28); add(mus, choir([62, 66, 69, 74, 78], DUR - tPUNCH, 1.), tPUNCH + .45, .18)
for k, t in enumerate(np.arange(tPUNCH + .45, DUR - .8, b)): add(mus, taiko(.9, 70), t, .2)
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.4 * SR):] *= np.linspace(1, 0, int(1.4 * SR))[:, None] ** 2

# ---------------- sound design ----------------
def laser(v=1.): d = .22; tt = t_(d); f = 1800 * np.exp(-tt / .06) + 300; return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + np.sin(2 * np.pi * np.cumsum(f * .5) / SR) * .5) * np.exp(-tt / .07) * v
def boom(v=1., d=1.4): tt = t_(d); return (lp(noise(d), 400) * 1.5 + sub(1., 70, 28, d)[:int(d * SR)] * .8) * np.exp(-tt / (d / 3)) * v
for e in EV:
    t, g = e['t'], e.get('g', 1.); TY = e['type']
    if TY == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif TY == 'boom': add(fx, boom(1., 2.0), t, .45)
    elif TY == 'drone': d = e.get('d', 1.); tt = t_(d); add(fx, (np.sin(2 * np.pi * 41 * tt) + .5 * np.sin(2 * np.pi * 61.5 * tt)) * env(d, .3, .4) * (.6 + .4 * np.sin(2 * np.pi * .7 * tt)), t, .2)
    elif TY == 'redflash': add(fx, crash(1.2), t, .1); add(fx, sub(.8, 80, 30, 1.2), t, .35)
    elif TY == 'ships': d = e.get('d', 2.); tt = t_(d); add(fx, (np.sin(2 * np.pi * np.cumsum(90 + 20 * np.sin(2 * np.pi * 3 * tt)) / SR) * .5 + bp(noise(d), 200, 1200) * .5) * env(d, .5, .6), t, .25)
    elif TY == 'powerup': d = e.get('d', 1.); tt = t_(d); f = 200 + 1600 * (tt / d) ** 1.5; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .05, .2) * .4, t, .18); [add(fx, blip(1400 + 100 * k, .05), t + k * d / 16, .06, rng.uniform(-.6, .6)) for k in range(16)]
    elif TY == 'charge': add(fx, crowd(1.6) if 'crowd' in dir() else bp(noise(1.6), 300, 3000) * env(1.6, .1, .8) * .7, t, .2)
    elif TY == 'step': add(fx, sfx.thump(1., 90), t, .12 * g, rng.uniform(-.5, .5)); add(fx, sfx.clack(.6, 1.), t, .05 * g)
    elif TY == 'laser': add(fx, laser(1.), t, .18 * g, rng.uniform(-.6, .6))
    elif TY == 'explode': add(fx, boom(1., 1.2), t, .3 * g, rng.uniform(-.4, .4))
    elif TY == 'mothership': d = e.get('d', 2.); tt = t_(d); add(fx, (np.sin(2 * np.pi * 32 * tt) + .6 * np.sin(2 * np.pi * 48 * tt) + bp(noise(d), 80, 400)) * env(d, .8, .8), t, .2)
    elif TY == 'powerdown': d = 1.2; tt = t_(d); f = 900 * (1 - tt / d) ** 2 + 40; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .01, .2) * .5, t, .3)
    elif TY == 'flicker': [add(fx, blip(700, .04), t + k * .17, .08) for k in range(5)]
    elif TY == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif TY == 'compute': d = e.get('d', 1.); [add(fx, blip(1000 + 200 * rng.integers(0, 8), .03), t + k * .05, .05, rng.uniform(-.7, .7)) for k in range(int(d / .05))]
    elif TY == 'clank': add(fx, sfx.clack(.8 + .3 * rng.random(), 1.), t, .2 * g, rng.uniform(-.5, .5)); add(fx, sfx.thump(1., 110), t, .1 * g)
    elif TY == 'lock': add(fx, sfx.thump(1., 70), t, .4); add(fx, sfx.clack(.6, 1.), t, .3); add(fx, zap(1., 2400, 600, .15), t, .1)
    elif TY == 'rise': d = e.get('d', 1.); add(fx, riser(d, .6), t, .15)
    elif TY == 'giant': add(fx, boom(1., 2.4), t, .5); add(fx, sfx.thump(1., 45), t + .3, .5)
    elif TY == 'retreat': d = e.get('d', 2.); tt = t_(d); f = 120 * (1 - .6 * tt / d); add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .2, .6) * .5, t, .2)
    elif TY == 'beam': add(fx, zap(1., 4000, 200, .6), t, .3); add(fx, riser(.45, .6, 800, 9000), t, .2)
    elif TY == 'blast': add(fx, boom(1., 3.0), t, .6); add(fx, crash(2.4), t, .18)
fx[s0i:hiti] = 0
# ---------------- voice, balance, stems ----------------
vo, sr = sf.read(f'{H}/out/vo.wav'); vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 70); vo = sfx.compress(vo, thr=.1, ratio=3.2, att=.003, rel=.1)
act_env = maximum_filter1d(np.abs(vo), int(.12 * SR)); act = act_env > .02 * act_env.max()
vo *= .22 / np.sqrt((vo[act] ** 2).mean())
ve = uniform_filter1d(act.astype(float), int(.15 * SR))
duck = 1 - (1 - 10 ** (-5 / 20)) * ve
mus *= duck[:, None]; fx *= (1 - (1 - 10 ** (-7 / 20)) * ve)[:, None]
vr = np.sqrt((vo[act] ** 2).mean()); mr = np.sqrt((mus[act] ** 2).mean())
mus *= (vr / 10 ** (10 / 20)) / mr                                        # voice 10 dB above the music (RMS while speaking)
fr = np.sqrt((fx[np.abs(fx).max(1) > 1e-4] ** 2).mean()); fx *= (vr / 10 ** (9 / 20)) / fr
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
