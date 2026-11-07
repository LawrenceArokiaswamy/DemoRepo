# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav. Everything synthesised with numpy (no samples),
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
tH1 = L1('n1') + .12; tR1 = L1('n2') + .12; tD1 = W('n4', 'reason') - .05; tK1 = L1('n10') + .12; tV1 = L1('n12') + .12
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

# ---------------- score: tense newsy pulse (D minor, 120 BPM), ticking clock, stinger on the drop, riser into the silence, resolving lift ----------------
BPM = 120; beat = 60 / BPM
CH = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]      # Dm  Bb  C  A
ROOT = [38, 34, 36, 33]
def chord_at(t): return int((t / (beat * 8)) % 4)
grid = np.arange(0, DUR, beat / 2)
for k, t in enumerate(grid):
    if S0 - .01 <= t < HIT: continue
    c = chord_at(t); r = ROOT[c]
    hook = t < tH1; result = tH1 <= t < tR1; drop = tR1 <= t < tD1; why = tD1 <= t < tK1; quest = tK1 <= t < S0; outro = t >= HIT
    if not outro:
        g = .32 if hook else .2 if result else .34 if drop else .24 if why else .3
        add(mus, bass(r + (12 if k % 4 == 3 else 0), beat / 2 * .85, 1., .45 + .4 * (hook or drop or quest)), t, g)
    if k % 2 == 0 and (hook or drop or quest): add(mus, kick(.9), t, .34)
    if k % 4 == 0 and (why or result): add(mus, kick(.7, 120, 45), t, .22)
    if k % 4 == 2 and (why or drop): add(mus, bp(noise(.09), 1500, 6000) * np.exp(-t_(.09) / .03), t, .05)   # soft snare-ish noise on 2 and 4
    # news "stab" motif: two-note pluck on the bar line
    if (k % 16 in (0, 3)) and (hook or result or why) and not outro:
        add(mus, pluck(CH[c][0] + 24 + (3 if k % 16 == 3 else 0), .3), t, .06, .3 if k % 16 else -.3)
    # the ticking clock: every beat until the silence (tock on off-beats softer)
    if t < S0 and k % 2 == 0: add(fx, tick(1, 4200 if (k // 2) % 2 else 3100), t, .10 if why else .08, .25 if (k // 2) % 2 else -.25)
# low drone pads under each section
t = 0.
while t < S0:
    d = min(beat * 8, S0 - t); c = chord_at(t + .01)
    add(mus, pad([x - 12 for x in CH[c]] + [CH[c][0]], d + .2, 1., 800 + 500 * (t > tD1), .3, .25), t, .12); t += beat * 8
# riser into the silence, hard cut at S0
dr = 1.6; add(mus, riser(dr, .8), S0 - dr, .5)
for k in range(14):
    at = S0 - dr + dr * (1 - (1 - k / 14) ** 1.7); add(mus, bp(noise(.06), 900, 5000) * np.exp(-t_(.06) / .02), at, .08 + .2 * k / 14, rng.uniform(-.3, .3))
# the resolving lift after the silence: D minor -> F major -> D major colour
add(mus, sub(1.0, 95, 36, 2.6), HIT, .6); add(mus, kick(1.1, 160, 40, .5), HIT, .5); add(mus, crash(2.0), HIT, .1)
add(mus, pad([41, 53, 57, 60, 65], tV1 - HIT + .4, 1., 1600, .05, .6), HIT, .2)
add(mus, pad([38, 50, 54, 57, 62], DUR - tV1, 1., 2200, .3, 1.8), tV1, .24)
add(mus, pad([66, 69, 74], DUR - tV1 - .6, 1., 3200, .8, 1.5), tV1 + .6, .07)
for k, t in enumerate(np.arange(tV1, DUR - 1.0, beat / 2)):
    add(mus, pluck([74, 78, 81, 86, 81, 78][k % 6], .3), t, .05, .4 if k % 2 else -.4)
    if k % 2 == 0: add(mus, bass(38 if (k // 8) % 2 == 0 else 43, beat * .9, 1., .3), t, .14)
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.4 * SR):] *= np.linspace(1, 0, int(1.4 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
def coin(v=1.):
    d = .25; tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in ((3900, .08), (5200, .05), (7100, .03))); return x * env(d, .001, .02) * v / 2
def creak(d=.7, v=1.):
    tt = t_(d); f = 120 + 60 * np.sin(2 * np.pi * 1.3 * tt); x = saw(1, d) * 0 + np.sin(2 * np.pi * np.cumsum(f) / SR) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 37 * tt)))
    return lp(x, 1500) * env(d, .05, .2) * v
def jingle(v=1.):
    out = np.zeros(int(1.4 * SR))
    for i, m in enumerate([79, 84, 88, 91, 88, 84]):
        g = bell(m, .45, 1, 1.0); at = int(i * .16 * SR); out[at:at + len(g)] += g[:len(out) - at]
    return out * v
def fire_noise(d, v=1.):
    n = noise(d); x = lp(n, 900) * .6 + hp(n, 3000) * .15
    cr = np.zeros_like(n)
    for k in range(int(d * 30)):
        at = int(rng.uniform(0, d) * SR); L = int(.004 * SR); cr[at:at + L] += rng.uniform(.3, 1) * np.sign(rng.normal(size=min(L, len(cr) - at)))
    return (x + cr * .5) * env(d, .2, .3) * v
def stinger(v=1.):
    d = 2.0; out = np.zeros(int(d * SR))
    out += sub(1., 110, 32, d)[:len(out)] * .8
    for m in (38, 45, 50, 53, 56): out[:int(1.2 * SR)] += lp(saw(mt(m), 1.2, .004), 1600) * np.exp(-t_(1.2) / .35) * .25
    out += crash(d)[:len(out)] * .25
    return out * v
for e in EV:
    t, g = e['t'], e.get('g', 1.); T = e['type']
    if T == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif T == 'sweep': d = e.get('d', 1.); add(fx, shimmer(d), t, .22); add(fx, sparkle(d), t + .05, .2); add(fx, riser(d, .4), t, .06)
    elif T == 'drop': add(fx, zap(1., 1800, 120, .6), t, .25 * g); add(fx, sub(.7, 80, 35, .9), t, .3 * g)
    elif T == 'stinger': add(fx, stinger(1.), t, .55 * g); add(fx, zap(1., 2200, 90, .7), t, .2 * g)
    elif T == 'pop': add(fx, sfx.pop(1.), t, .4 * g, rng.uniform(-.2, .2)); add(fx, blip(1500, .07), t, .1)
    elif T == 'bell': add(fx, bell(81, 1.4, 1, 1.5), t, .18 * g, -.2); add(fx, bell(88, 1.2, 1, 1.5), t + .03, .1 * g, .2)
    elif T == 'blip': add(fx, blip(1000 + 120 * rng.integers(0, 6), .06), t, .12 * g, rng.uniform(-.5, .5))
    elif T == 'tickerblip': add(fx, blip(1400 + 160 * rng.integers(0, 8), .05), t, .16 * g, rng.uniform(-.6, .6)); add(fx, tick(1, 3000, .02), t, .1 * g)
    elif T == 'thunk': add(fx, sfx.thump(1., 70), t, .3 * g); add(fx, sfx.click(1., 1.), t, .15 * g)
    elif T == 'hum': add(fx, hum(e.get('d', 2.)) * .6, t, .28)
    elif T == 'clank': add(fx, sfx.clack(1.2 + .3 * rng.random(), 1.), t, .25 * g, rng.uniform(-.4, .4))
    elif T == 'halt': add(fx, zap(1., 900, 140, .5), t, .2); add(fx, sfx.thump(1., 55), t, .35)
    elif T == 'wind_down': d = e.get('d', 1.); tt = t_(d); f = 600 * (1 - .8 * tt / d); add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .05, .2) * .3, t, .25)
    elif T == 'brick': add(fx, sfx.clack(.9 + .3 * rng.random(), 1.), t, .3 * g, rng.uniform(-.4, .4))
    elif T == 'thump': add(fx, sfx.thump(1., 60), t, .5)
    elif T == 'nope': add(fx, zap(1., 700, 300, .35), t, .15)
    elif T == 'coin': add(fx, coin(1.), t, .22 * g, rng.uniform(-.5, .5))
    elif T == 'creak': add(fx, creak(.7), t, .2)
    elif T == 'register': add(fx, bell(96, .4, 1, 1.5), t, .12 * g, rng.uniform(-.3, .3)); add(fx, coin(1.), t + .03, .15 * g)
    elif T == 'deflate': d = .9; tt = t_(d); f = 700 * (1 - tt / d) ** 1.5 + 80; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .02, .1) * .5 + bp(noise(d), 500, 2500) * .2 * (1 - tt / d), t, .25)
    elif T == 'dialup': d = e.get('d', 1.); tt = t_(d); f = 200 + 900 * (tt / d) ** 1.5; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .1, .1) * .35, t, .22); [add(fx, tick(1, 3500, .02), t + k * d / 10, .12) for k in range(10)]
    elif T == 'ding': add(fx, bell(93, 1.2, 1, 1.2), t, .22)
    elif T == 'jingle': add(fx, jingle(1.), t, .22, .3)
    elif T == 'patter': d = e.get('d', 1.); [add(fx, sfx.thump(1., 140) * .5, t + k * .07, .1, rng.uniform(-.5, .5)) for k in range(int(d / .07))]
    elif T == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif T == 'ignite': add(fx, whoosh(.5, 1.), t - .1, .4); add(fx, sfx.pop(1.), t, .4); add(fx, crash(1.0), t, .08)
    elif T == 'fire': add(fx, fire_noise(e.get('d', 1.5)), t, .3)
    elif T == 'chime': add(fx, bell(86, 1.6), t, .2, -.2); add(fx, bell(93, 1.4), t + .02, .12, .2)
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
