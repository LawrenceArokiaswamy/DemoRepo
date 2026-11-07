# Score + sound design + voice -> stems (vo / music / sfx) and out/mix.wav for "What if you married an AI?". Everything synthesised with numpy (no samples),
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

# ---------------- score: "wedding music box" that turns cold ----------------
# C major music box + heartbeat (lub-dub) for the fairy tale; near-silence after "here's the twist"; A minor drone + cold pulse for the
# company/update/hologram stretch; riser into the hard silence; hit; then the music-box returns slightly detuned (wry) for the ending.
EVT = lambda typ: [e['t'] for e in EV if e['type'] == typ]
tH1 = L1('n1') + .14; tTW = EVT('dropout')[0]; tTURN = L0('n6') - .03; tL0 = L1('n11') + .12
BPM = 96; beat = 60 / BPM
MB = [72, 76, 79, 84, 79, 76, 77, 81, 84, 81, 77, 74, 76, 79, 83, 79]        # music-box line (C · F · G colours)
BASSC = [36, 36, 41, 43]
def heartbeat(t, v): add(mus, kick(v, 110, 42, .35), t, .32); add(mus, kick(v * .7, 95, 40, .3), t + .16, .22)
k = 0; t = 0.
while t < tTW:                                                               # 1) fairy tale
    hook = t < tH1
    if k % 2 == 0: heartbeat(t, 1.0 if hook else .8)
    add(mus, bell(MB[k % 16], .9, 1, 1.2), t, .07, .35 if k % 2 else -.35)
    if k % 2 == 1: add(mus, bell(MB[(k + 3) % 16] + 12, .5, 1, .8), t + beat / 2, .03, .5)
    if k % 4 == 0: add(mus, pad([48, 52, 55, 60] if (k // 4) % 4 != 2 else [53, 57, 60, 65], beat * 4 + .2, 1., 1600, .3, .4), t, .1)
    if k % 2 == 0 and not hook: add(mus, bass(BASSC[(k // 4) % 4], beat * .9, 1., .3), t, .12)
    k += 1; t += beat
# 2) near-silence: the music stops dead after "here's the twist" until the turn (applied below, after all music is written)
# 3) the turn: A minor drone, cold pulse, heartbeat slower and further away
t = tTURN; k = 0
while t < F['S0'] - .01:
    if k % 2 == 0: heartbeat(t, .6)
    if k % 8 == 0: add(mus, pad([45, 52, 57, 60], min(beat * 8, F['S0'] - t) + .2, 1., 700, .4, .2), t, .16)
    if k % 2 == 1: add(mus, pluck([69, 72, 76, 72][(k // 2) % 4] - 12, .4), t, .05, .3 if k % 4 == 1 else -.3)
    add(mus, bass(33 if (k // 8) % 2 == 0 else 29, beat * .85, 1., .25), t, .13)
    k += 1; t += beat
dr = 1.5; add(mus, riser(dr, .8), F['S0'] - dr, .4)
# 4) after the silence: hit, then a minor pulse under the three spotlights, then the wry music box
HITt = F['HIT']; add(mus, sub(1.0, 95, 34, 2.4), HITt, .6); add(mus, kick(1.1, 160, 40, .5), HITt, .5); add(mus, crash(1.6), HITt, .08)
t = HITt; k = 0
while t < tL0:
    if k % 2 == 0: add(mus, kick(.8), t, .26)
    add(mus, bass([33, 33, 41, 40][(k // 2) % 4], beat * .5 * .9, 1., .5), t, .2); add(mus, bass([33, 33, 41, 40][(k // 2) % 4], beat * .5 * .9, 1., .5), t + beat / 2, .14)
    k += 1; t += beat
t = tL0; k = 0
while t < DUR - .6:
    add(mus, bell(MB[k % 16] + (0.25 if k % 3 == 2 else 0), .9, 1, 1.4), t, .08, .35 if k % 2 else -.35)
    if k % 2 == 0: heartbeat(t, .7)
    if k % 4 == 0: add(mus, pad([48, 52, 55, 59], beat * 4 + .3, 1., 1800, .2, .6), t, .1)
    k += 1; t += beat
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
twi, tui = int(tTW * SR), int(tTURN * SR); fo = int(.08 * SR); mus[twi - fo:twi] *= np.linspace(1, 0, fo)[:, None]; mus[twi:tui] = 0
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
def glitch(v=1.):
    d = .32; x = np.zeros(int(d * SR))
    for k in range(7):
        at = int(rng.uniform(0, d - .05) * SR); L = int(rng.uniform(.01, .04) * SR); f = rng.uniform(300, 3000)
        x[at:at + L] += np.sign(np.sin(2 * np.pi * f * t_(L / SR)))[:len(x) - at] * .6
    return (x + bp(noise(d), 2000, 9000) * .3 * np.exp(-t_(d) / .08)) * v
for e in EV:
    t, g = e['t'], e.get('g', 1.); TY = e['type']
    if TY == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif TY == 'sweep': d = e.get('d', 1.); add(fx, shimmer(d), t, .2); add(fx, riser(d, .4), t, .05)
    elif TY == 'sparkle': add(fx, sparkle(.9), t, .25 * g)
    elif TY == 'pop': add(fx, sfx.pop(1.), t, .4 * g); add(fx, blip(1500, .07), t, .1)
    elif TY == 'glow': add(fx, bell(84, 1.4, 1, 1.0), t, .14); add(fx, shimmer(.8), t, .1)
    elif TY == 'bells': [add(fx, bell(m, 1.6, 1, 1.6), t + i * .14, .12, (-.4, 0, .4)[i]) for i, m in enumerate((79, 84, 88))]
    elif TY == 'bubble': add(fx, blip(1100 + 140 * rng.integers(0, 6), .07), t, .15 * g, rng.uniform(-.5, .5)); add(fx, sfx.pop(1.), t, .1 * g)
    elif TY == 'swish': add(fx, whoosh(.3, 1.), t - .05, .22)
    elif TY == 'yes': add(fx, sting_up(1.), t, .25); add(fx, sparkle(.8), t + .05, .25)
    elif TY == 'stamp': add(fx, sfx.thump(1., 55), t, .6); add(fx, sfx.clack(.8, 1.), t, .3); add(fx, crash(.5), t, .05)
    elif TY == 'flutter': d = e.get('d', 1.); [add(fx, bp(noise(.05), 800, 4000) * np.exp(-t_(.05) / .015), t + k * .06, .08, rng.uniform(-.6, .6)) for k in range(int(d / .06))]
    elif TY == 'hum': add(fx, hum(e.get('d', 2.)) * .6, t, .3)
    elif TY == 'rise': add(fx, riser(e.get('d', 1.), .6), t, .12)
    elif TY == 'dialup': d = e.get('d', 1.); tt = t_(d); f = 200 + 900 * (tt / d) ** 1.5; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .1, .1) * .3, t, .2); [add(fx, tick(1, 3500, .02), t + k * d / 12, .1) for k in range(12)]
    elif TY == 'glitch': add(fx, glitch(1.), t, .35 * g, rng.uniform(-.3, .3))
    elif TY == 'coldblip': add(fx, blip(660, .14), t, .14); add(fx, blip(523, .2), t + .08, .1)
    elif TY == 'holo': d = e.get('d', 1.); add(fx, shimmer(d) * .7, t, .15); add(fx, hum(d) * .3, t, .12)
    elif TY == 'powerdown': d = .9; tt = t_(d); f = 900 * (1 - tt / d) ** 1.8 + 40; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .01, .1) * .5, t, .3); add(fx, zap(1., 1200, 60, .5), t, .15)
    elif TY == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif TY == 'spot': add(fx, sfx.thump(1., 80), t, .3 * g); add(fx, crash(.6), t, .04 * g)
    elif TY == 'scroll': d = e.get('d', 1.); [add(fx, tick(1, 2600, .015), t + k * .05, .06) for k in range(int(d / .05))]
    elif TY == 'tick': add(fx, sfx.click(1., 1.), t, .3); add(fx, bell(88, .5, 1, 1.0), t, .1)
    elif TY == 'chime': add(fx, bell(84, 1.6), t, .2, -.2); add(fx, bell(91, 1.4), t + .02, .12, .2)
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
