# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav for "USA or China: who is winning the AI race?". Everything synthesised with numpy (no samples),
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

# ---------------- score: stadium race pulse (E minor, 128 BPM) ----------------
# driving kick + offbeat bass under the hook and rounds, a short "fanfare" sting at each round, a scoreboard ding on each point,
# riser into the hard silence after "who wins?", hit, then a lighter, open-ended major colour for "the race isn't over".
EVT = lambda typ: [e['t'] for e in EV if e['type'] == typ]
BPM = 128; beat = 60 / BPM
ROOTS = [40, 36, 43, 38]                                                   # E  C  G  D
CH = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]
tQ = L0('n11') - .05; HITt = F['HIT']; tRACE = W('n12', 'race') - .25
grid = np.arange(0, tQ - .05, beat / 2)
for k, t in enumerate(grid):
    c = int((t / (beat * 8)) % 4); r = ROOTS[c]
    if k % 2 == 0: add(mus, kick(1.0), t, .34)
    if k % 2 == 1: add(mus, bass(r + 12 * (k % 8 == 7), beat / 2 * .85, 1., .6), t, .24)
    if k % 4 == 2: add(mus, bp(noise(.11), 1400, 7000) * np.exp(-t_(.11) / .035), t, .07)   # clap on 2 and 4
    add(mus, tick(1, 7000 if k % 2 else 5200, .02), t, .03, .3 if k % 2 else -.3)       # hats
    if k % 16 in (0, 3, 6, 10): add(mus, pluck(CH[c][k % 3] + 12, .25), t, .05, -.3 if k % 2 else .3)
t = 0.
while t < tQ - .05:
    d = min(beat * 8, tQ - t); c = int((t / (beat * 8) + .001) % 4); add(mus, pad([x - 12 for x in CH[c]] + [CH[c][0]], d + .2, 1., 1200, .3, .2), t, .1); t += beat * 8
for rt in EVT('bell'):                                                      # round fanfare: rising brass-ish triad
    for i, m in enumerate((64, 67, 71, 76)): add(mus, lp(saw(mt(m), .32, .004), 2600) * env(.32, .01, .12), rt + i * .07, .07, (-.3, -.1, .1, .3)[i])
dr = 1.5; add(mus, riser(dr, .8), F['S0'] - dr, .45)
add(mus, sub(1.0, 95, 34, 2.4), HITt, .6); add(mus, kick(1.1, 160, 40, .5), HITt, .5); add(mus, crash(1.8), HITt, .1)
# verdict: half-time pulse, then the open "first lap" lift (G major colour) into the end card
t = HITt; k = 0
while t < tRACE:
    if k % 2 == 0: add(mus, kick(.8), t, .26)
    add(mus, bass([40, 40, 36, 38][(k // 2) % 4], beat * .9, 1., .4), t, .16); k += 1; t += beat
add(mus, pad([43, 55, 59, 62, 67], DUR - tRACE, 1., 2400, .3, 1.6), tRACE, .2)
for k, t in enumerate(np.arange(tRACE, DUR - .8, beat / 2)):
    if k % 2 == 0: add(mus, kick(.9), t, .3)
    add(mus, tick(1, 6800, .02), t, .03)
    add(mus, pluck([79, 83, 86, 91, 86, 83][k % 6], .28), t, .05, .4 if k % 2 else -.4)
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
def crowd(d, v=1.):
    tt = t_(d); x = bp(noise(d), 300, 3000) * .6 + bp(noise(d), 1500, 6000) * .25
    return x * (np.minimum(1, tt / .3) * np.exp(-np.maximum(0, tt - d * .5) / (d * .3))) * v
for e in EV:
    t, g = e['t'], e.get('g', 1.); TY = e['type']
    if TY == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif TY == 'gun': add(fx, sfx.thump(1., 70), t, .5); add(fx, crash(.4), t, .12); add(fx, bp(noise(.08), 1000, 8000) * np.exp(-t_(.08) / .015), t, .5)
    elif TY == 'crowd': add(fx, crowd(e.get('d', 1.5)), t, .2)
    elif TY == 'pop': add(fx, sfx.pop(1.), t, .4 * g); add(fx, blip(1500, .07), t, .1)
    elif TY == 'board': add(fx, bell(88, .9, 1, 1.2), t, .14); [add(fx, blip(1200 + 200 * i, .05), t + .05 + i * .05, .08) for i in range(5)]
    elif TY == 'bell': add(fx, crowd(.9), t, .08)
    elif TY == 'score': add(fx, bell(84 if e.get('side') == 'u' else 79, 1.3, 1, 1.6), t, .22, -.3 if e.get('side') == 'u' else .3); add(fx, sfx.thump(1., 75), t, .3); add(fx, crowd(1.2), t, .12)
    elif TY == 'rise': add(fx, riser(e.get('d', 1.), .5), t, .12)
    elif TY == 'rewind': add(fx, tape_rewind(e.get('d', .8)), t, .2)
    elif TY == 'chip': add(fx, sfx.clack(1.4 + .3 * rng.random(), 1.), t, .14 * g, rng.uniform(-.5, .5))
    elif TY == 'boop': add(fx, blip(523, .2), t, .16)
    elif TY == 'thunk': add(fx, sfx.thump(1., 65), t, .3 * g); add(fx, sfx.clack(.9, 1.), t, .12 * g)
    elif TY == 'zap': add(fx, zap(1., 2600, 500, .2), t, .2 * g)
    elif TY == 'crash': add(fx, zap(1., 1800, 80, .7), t, .3); add(fx, sub(.8, 90, 30, 1.2), t, .35)
    elif TY == 'stinger': add(fx, crash(1.2), t, .1)
    elif TY == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif TY == 'zoom': d = e.get('d', 1.); add(fx, whoosh(min(d, 1.2), 1.), t, .25); add(fx, crowd(min(d, 2.)), t + .2, .12)
    elif TY == 'chime': add(fx, bell(86, 1.6), t, .2, -.2); add(fx, bell(93, 1.4), t + .02, .12, .2)
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
