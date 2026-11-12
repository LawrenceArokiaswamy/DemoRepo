# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav for "What if ChatGPT was installed in your brain?". Everything synthesised with numpy (no samples),
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

# ---------------- score: intense cinematic trailer (C minor, 140 BPM) ----------------
# hook: heartbeat + low brass swell; build: 16th ostinato + toms; DROP on "smartest": full drums, sub, saw stack;
# dead stop after "until the twist"; mystery pulse for the 10-bit section; epic second build from "everyone";
# darker minor under "same thoughts"; riser into the hard silence; massive hit; warm swell; light pulse under the question.
EVT = lambda typ: [e['t'] for e in EV if e['type'] == typ]
BPM = 140; b = 60 / BPM
tDROP = EVT('drop')[0]; tTW = EVT('dropout')[0]; tF0 = L0('n6') - .04; tG0 = L0('n8') - .05; tSAME = L0('n10') - .05; tQ = L0('n11') - .05; HITt = F['HIT']; tC0 = L0('n13') - .05
def brass(ms, d, v=1., cut=1800): x = sum(saw(mt(m), d, .006) for m in ms) / len(ms); return lp(lp(x, cut), cut * 1.3) * env(d, .25, .3) * v
def tom(v=1., f=110): d = .4; tt = t_(d); fq = f * (1 + .6 * np.exp(-tt / .03)); return np.tanh(np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-tt / .14) * 2) * v
def snare(v=1.): d = .25; return (bp(noise(d), 1500, 7000) * np.exp(-t_(d) / .07) + np.sin(2 * np.pi * 190 * t_(d)) * np.exp(-t_(d) / .04) * .6) * v
def ostinato(t0, t1, notes, g=.05, oct_=0):
    for k, t in enumerate(np.arange(t0, t1, b / 4)): add(mus, pluck(notes[k % len(notes)] + oct_, .16), t, g, .35 if k % 2 else -.35)
# 1) hook: heartbeat + brass swell + rising ostinato into the drop
L1n1 = L1('n1')
for t in np.arange(0, L1n1 + .3, b * 2): add(mus, kick(1.0, 110, 40, .4), t, .4); add(mus, kick(.7, 95, 38, .3), t + .2, .26)
add(mus, brass([36, 43, 48], L1n1 + .6, 1., 900), 0, .22)
for k, t in enumerate(np.arange(L1n1, tDROP, b / 2)):
    if k % 2 == 0: add(mus, kick(.9), t, .3)
    if k % 4 == 2: add(mus, snare(1.), t, .1)
    add(mus, bass([36, 36, 32, 34][(k // 8) % 4], b / 2 * .85, 1., .5), t, .16)
ostinato(L0('n3') - .05, tDROP, [60, 63, 67, 72, 67, 63], .05)
for k in range(8): add(mus, tom(1., 90 + 12 * k), tDROP - 1.0 + k * b / 2 * .9, .16 + .02 * k, (-.4, .4)[k % 2])
dr = 1.6; add(mus, riser(dr, .9), tDROP - dr, .5)
# 2) THE DROP: full kit, sub, saw stack, through "until the twist"
add(mus, sub(1.2, 100, 30, 2.8), tDROP, .75); add(mus, crash(2.4), tDROP, .14); add(mus, brass([36, 48, 55, 60, 63], tTW - tDROP + .2, 1., 2600), tDROP, .3)
for k, t in enumerate(np.arange(tDROP, tTW - .05, b / 2)):
    if k % 2 == 0: add(mus, kick(1.15, 150, 40, .45), t, .42)
    if k % 4 == 2: add(mus, snare(1.2), t, .16)
    add(mus, tick(1, 7200, .02), t, .04); add(mus, bass([36, 36, 39, 34][(k // 4) % 4], b / 2 * .85, 1., .8), t, .26)
ostinato(tDROP, tTW - .05, [72, 75, 79, 84, 79, 75], .05)
# 3) dead stop at tTW until the firehose; mystery pulse (low, sparse)
t = tF0; k = 0
while t < tG0 - .05:
    if k % 2 == 0: add(mus, kick(.75, 90, 36, .5), t, .3)
    if k % 8 == 0: add(mus, pad([36, 43, 51], min(b * 8, tG0 - t) + .2, 1., 700, .3, .2), t, .16)
    add(mus, tick(1, 3600, .02), t, .05, (-.4, .4)[k % 2]); k += 1; t += b
ostinato(L0('n7') - .05, tG0 - .05, [72, 79], .03, -12)
# 4) second build from "everyone": toms, brass, then darker minor for "same thoughts"
add(mus, brass([36, 43, 48, 55], tSAME - tG0 + .2, 1., 2200), tG0, .26); add(mus, sub(1.0, 90, 32, 2.0), tG0, .5); add(mus, crash(1.6), tG0, .1)
for k, t in enumerate(np.arange(tG0, tQ - .05, b / 2)):
    dark = t >= tSAME
    if k % 2 == 0: add(mus, kick(1.05, 140, 40, .45), t, .38)
    if k % 4 == 2: add(mus, snare(1.1), t, .13)
    if k % 8 in (3, 7) and not dark: add(mus, tom(1., 100 + 15 * (k % 3)), t, .14, (-.4, .4)[k % 2])
    add(mus, bass(([36, 36, 32, 34] if not dark else [36, 35, 32, 31])[(k // 4) % 4], b / 2 * .85, 1., .6), t, .22)
ostinato(tG0, tSAME, [72, 75, 79, 82], .045); ostinato(tSAME, tQ - .05, [72, 71, 68, 67], .045)
add(mus, pad([36, 47, 51, 55], tQ - tSAME + .2, 1., 1200, .3, .2), tSAME, .16)
dr = 1.5; add(mus, riser(dr, .9), F['S0'] - dr, .5)
# 5) after the silence: massive hit, warm major swell (Ab -> Eb), then a light pulse under the question
add(mus, sub(1.2, 100, 30, 3.0), HITt, .75); add(mus, kick(1.2, 170, 38, .6), HITt, .55); add(mus, crash(2.6), HITt, .14)
add(mus, brass([44, 56, 60, 63, 68], tC0 - HITt + .4, 1., 2600), HITt, .26); add(mus, pad([51, 55, 58, 63, 67], DUR - tC0, 1., 2600, .4, 1.4), tC0, .18)
for k, t in enumerate(np.arange(tC0, DUR - .8, b / 2)):
    if k % 4 == 0: add(mus, kick(.8), t, .26)
    add(mus, pluck([75, 79, 82, 87, 82, 79][k % 6], .25), t, .045, .4 if k % 2 else -.4)
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
twi, tfi = int(tTW * SR), int(tF0 * SR); fo = int(.06 * SR); mus[twi - fo:twi] *= np.linspace(1, 0, fo)[:, None]; mus[twi:tfi] = 0
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
for e in EV:
    t, g = e['t'], e.get('g', 1.); TY = e['type']
    if TY == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif TY == 'boom': add(fx, sub(1., 80, 30, 1.6), t, .5); add(fx, crash(1.0), t, .06)
    elif TY == 'riser': add(fx, riser(e.get('d', 1.), .5), t, .12)
    elif TY == 'clunk': add(fx, sfx.thump(1., 60), t, .5); add(fx, sfx.clack(.7, 1.), t, .3); add(fx, zap(1., 3000, 400, .25), t, .15)
    elif TY == 'surge': d = e.get('d', 1.); add(fx, shimmer(d), t, .22); add(fx, sparkle(d), t + .05, .2)
    elif TY == 'blip': add(fx, blip(1100 + 150 * rng.integers(0, 6), .06), t, .14 * g, rng.uniform(-.5, .5))
    elif TY == 'pop': add(fx, sfx.pop(1.), t, .4 * g, rng.uniform(-.2, .2)); add(fx, blip(1500, .07), t, .1)
    elif TY == 'drop': add(fx, crash(1.2), t, .1)
    elif TY == 'flood': d = e.get('d', 1.); add(fx, bp(noise(d), 300, 6000) * env(d, .4, .5) * .4, t, .14)
    elif TY == 'tick': add(fx, sfx.click(1., 1.), t, .3); add(fx, blip(880, .05), t, .1)
    elif TY == 'modem':
        d = e.get('d', 1.); tt = t_(d); x = np.sin(2 * np.pi * (1200 + 1000 * (np.floor(tt * 30) % 2)) * tt) * .35 + bp(noise(d), 1500, 3500) * .25 * (tt > d * .5); add(fx, x * env(d, .02, .1), t, .14)
    elif TY == 'swell': d = e.get('d', 1.); add(fx, shimmer(d), t, .15)
    elif TY == 'stamp': add(fx, sfx.thump(1., 70), t, .22 * g); add(fx, sfx.clack(.9, 1.), t, .1 * g)
    elif TY == 'unison': d = e.get('d', 1.); add(fx, sum(np.sin(2 * np.pi * mt(m) * t_(d)) for m in (60, 67, 72)) / 3 * env(d, .3, .5) * .5, t, .12)
    elif TY == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif TY == 'chime': add(fx, bell(87, 1.6), t, .18, -.2); add(fx, bell(94, 1.4), t + .02, .1, .2)
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
