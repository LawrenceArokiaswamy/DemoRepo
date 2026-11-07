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
tSend, tStop = E1('send'), E1('stop'); tPhone = L1('n2') - .05
tMap, tNope, tFood, tStar = E1('boing'), E1('nope'), E1('ding'), E1('star')
tTw = L0('n14') - .1; tLearn = W('n15', 'learned') - .15; tBack = L0('n16') - .05; tRet0 = W('n16', 'zooms') - .1; tRet1 = L0('n17') + .3
tBuild = W('n7', 'building') - .12; tZap = L0('n7') - .08
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

# ---------------- score: playful pluck over a synth pulse, ticking clock ----------------
BPM = 112; beat = 60 / BPM
CH = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]]      # F  C  Dm  Bb
ROOT = [41, 36, 38, 34]
def chord_at(t): return int((t / (beat * 8)) % 4)
grid = np.arange(0, DUR, beat / 2)
MOTIF = [0, 2, 1, 2, 0, 1, 2, 3]                                       # chord-tone indices for the pluck hook
for k, t in enumerate(grid):
    if S0 - .01 <= t < HIT: continue
    c = chord_at(t); r = ROOT[c]
    hook = t < tPhone; typing = tPhone <= t < tSend; dive = tSend <= t < tZap; journey = tZap <= t < tBuild + .4
    work = tBuild + .4 <= t < tLearn; mtn_ = tLearn <= t < tBack; ret = tBack <= t < S0; outro = t >= HIT
    twq = tTw <= t < tStar                                               # hush for the "twinkle, twinkle, little…" beat
    # synth pulse (bass eighths)
    if not twq and not outro:
        g = {True: .3}.get(hook, .22 if typing else .27 if dive or journey else .2 if work else .16 if mtn_ else .3)
        add(mus, bass(r + (12 if k % 4 == 3 else 0), beat / 2 * .9, 1., .5 + .5 * (dive or journey or ret)), t, g)
    if outro and k % 2 == 0: add(mus, bass(r, beat * .95, 1., .3), t, .16)
    # kick on beats in the driving parts
    if k % 2 == 0 and (hook or dive or journey or ret) and not twq: add(mus, kick(.9), t, .36)
    if k % 4 == 0 and work and not twq: add(mus, kick(.7, 120, 45), t, .24)
    # playful pluck hook
    if (hook or typing or work or outro) and not twq and k % 2 == 0:
        m = CH[c][MOTIF[(k // 2) % 8] % 3] + 12 * (1 + (MOTIF[(k // 2) % 8] == 3))
        add(mus, pluck(m + 12, .3), t, .07 if not work else .06, .35 if (k // 2) % 2 else -.35)
    if (dive or journey or ret) and not twq:
        notes = CH[c] + [x + 12 for x in CH[c]]; add(mus, pluck(notes[k % 6] + 12, .25), t, .05, .4 if k % 2 else -.4)
        add(mus, pluck(notes[(k + 3) % 6] + 24, .2), t + beat / 4, .03, -.4 if k % 2 else .4)
    # the ticking clock: tick-tock from SEND until the clock stops
    if tSend <= t < tStop and not (tLearn <= t < tBack):
        add(fx, tick(1, 4300 if k % 2 else 3200), t, .13, .25 if k % 2 else -.25)
# pads: hook drone, work bed, mountain swell, outro lift
add(mus, pad([41, 48, 53, 57], tPhone + .3, 1., 900, .2, .4), 0, .2)
t = tSend
while t < S0:
    d = min(beat * 8, S0 - t); c = chord_at(t + .01)
    add(mus, pad([x - 12 for x in CH[c]] + [CH[c][0]], d + .2, 1., 900 + 600 * (t > tBuild), .3, .25), t, .12 * (0.4 if tTw <= t < tStar else 1)); t += beat * 8
add(mus, pad([53, 57, 60, 65], tBack - tLearn + .3, 1., 2400, .5, .5), tLearn, .14)
add(mus, riser(.9, .5), tSend - .35, .18)                              # into the dive
add(mus, riser(1.2, .4), tBuild - 1.0, .2)
# "Star!" lands on a bright chord
add(mus, pad([65, 69, 72, 77], 1.6, 1., 3000, .01, 1.2), tStar, .16); add(mus, sub(.6, 90, 40, 1.2), tStar, .3)
# riser into the silence, hard cut at S0
dr = 2.2; add(mus, riser(dr, .8), S0 - dr, .5)
for k in range(16):
    at = S0 - dr + dr * (1 - (1 - k / 16) ** 1.7); add(mus, bp(noise(.06), 900, 5000) * np.exp(-t_(.06) / .02), at, .08 + .2 * k / 16, rng.uniform(-.3, .3))
# the warm lift after the silence
add(mus, sub(1.0, 95, 36, 2.8), HIT, .7); add(mus, kick(1.1, 160, 40, .5), HIT, .55); add(mus, crash(2.2), HIT, .14)
add(mus, pad([41, 53, 57, 60, 65], DUR - HIT, 1., 1800, .05, 1.8), HIT, .24)
add(mus, pad([69, 72, 77], DUR - HIT - 1, 1., 3200, 1.2, 1.5), HIT + 1, .07)
for k, t in enumerate(np.arange(HIT + .1, DUR - 1.0, beat / 2)):
    add(mus, pluck([77, 81, 84, 89, 84, 81][k % 6], .3), t, .05, .4 if k % 2 else -.4)
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.4 * SR):] *= np.linspace(1, 0, int(1.4 * SR))[:, None] ** 2

# ---------------- sound design from the page's cue list ----------------
for e in EV:
    t, g = e['t'], e.get('g', 1.); T = e['type']
    if T in ('key', 'space') and abs(t - W('n3', 'so') - .08) < .16: g *= .15     # keep the first word of the question clear
    if T in ('glass', 'layer') : g *= .6
    if T == 'whoosh': add(fx, whoosh(.42, 1.), max(0, t - .1), .3 * g, rng.uniform(-.5, .5))
    elif T == 'ping': add(fx, bell(93, .9, 1, 1.2), t, .14, .2); add(fx, blip(2640, .12), t, .08)
    elif T == 'shimmer': add(fx, shimmer(e.get('d', 1.)), t, .18); add(fx, sparkle(1.0), t + .05, .18)
    elif T == 'key': add(fx, keytap(1, 2200 + 900 * rng.random()), t, .22 * g, rng.uniform(-.2, .3))
    elif T == 'space': add(fx, keytap(1, 1300), t, .26 * g, .05)
    elif T == 'send': add(fx, sfx.click(1.2, 1.), t - .01, .7); add(fx, whoosh(.5, 1.), t + .02, .45); add(fx, blip(1760, .1), t, .12)
    elif T == 'dive': d = e.get('d', 1.); add(fx, whoosh(d, 1.), t - .1, .3); add(fx, riser(d * .8, .6), t - .1, .1)
    elif T == 'glass': add(fx, shimmer(.6), t - .05, .25 * g); add(fx, sparkle(.6), t, .2 * g); add(fx, hp(noise(.25), 5000) * np.exp(-t_(.25) / .06), t, .2)
    elif T == 'layer': add(fx, shimmer(.25), t, .14 * g); add(fx, blip(3000 + 800 * rng.random(), .05), t, .06)
    elif T == 'bits':
        d = e.get('d', 1.)
        for k in range(int(d * 22)): add(fx, blip(1800 + 1600 * rng.random(), .035), t + k / 22 + rng.uniform(0, .02), .05, rng.uniform(-.6, .6))
    elif T == 'power': add(fx, zap(1., 300, 1400, .5)[::-1].copy(), t - .1, .2); add(fx, sub(.7, 70, 120, .6), t, .25); add(fx, hum(1.4), t, .12); add(fx, bell(81, 1.2, 1, 3), t + .05, .1)
    elif T == 'zip': add(fx, zap(1., 3200, 900, .12), t, .1 * g, rng.uniform(-.5, .5))
    elif T == 'radio': add(fx, shimmer(1.0), t, .3); [add(fx, zap(1., 2200 - 200 * k, 1800 - 200 * k, .2), t + k * .12, .06) for k in range(5)]
    elif T == 'zap': add(fx, zap(1., 3600, 400, .25), t - .06, .18); add(fx, whoosh(.4), t - .15, .18)
    elif T == 'lightzip': d = e.get('d', 1.); add(fx, shimmer(d), t, .25); add(fx, whoosh(d, 1.), t, .3); add(fx, riser(d, .5), t, .08)
    elif T == 'hum': add(fx, hum(e.get('d', 3.)) * .6, t, .3)
    elif T == 'snap': add(fx, sfx.clack(1.4 + .2 * rng.random(), 1.), t, .35 * g, rng.uniform(-.4, .4))
    elif T == 'flip': add(fx, tick(1, 2600, .03), t, .3 * g); add(fx, blip(900 + 200 * rng.integers(0, 5), .07), t + .03, .16)
    elif T == 'thread': add(fx, zap(1., 2400 + rng.uniform(-300, 500), 900, .14), t, .1 * g, rng.uniform(-.6, .6))
    elif T == 'pop': add(fx, sfx.pop(1.), t, .4 * g, rng.uniform(-.2, .2)); add(fx, blip(1500, .07), t, .12)
    elif T == 'boing': add(fx, boing(1.), t, .35); add(fx, sfx.pop(1.), t, .25)
    elif T == 'nope': add(fx, wahwah(1.), t - .02, .38); add(fx, sfx.thump(1., 60), t, .35)
    elif T == 'ding': add(fx, sting_up(1.), t, .3)
    elif T == 'strike': add(fx, bp(noise(.3), 1500, 7000) * np.sin(np.pi * t_(.3) / .3), t, .25)
    elif T == 'shatter': add(fx, sparkle(.7), t, .35); add(fx, hp(noise(.5), 3000) * np.exp(-t_(.5) / .12), t, .18)
    elif T == 'pick': add(fx, blip(1320, .1), t, .28 * g); add(fx, tick(1, 3000, .03), t, .25 * g)
    elif T == 'tick': add(fx, blip(1700 + 60 * rng.integers(0, 8), .06), t, .16 * g, rng.uniform(-.5, .5))
    elif T == 'bar': add(fx, blip(600 + 300 * rng.random(), .08), t, .12 * g)
    elif T == 'star': add(fx, sparkle(1.2), t, .45); add(fx, bell(96, 1.5, 1, 1.2), t, .2, .2); add(fx, bell(100, 1.4, 1, 1.2), t + .05, .12, -.2)
    elif T == 'rush': add(fx, whoosh(.38, 1.), t - .05, .4 * g, rng.uniform(-.6, .6)); add(fx, zap(1., 2800, 500, .15), t, .07)
    elif T == 'blip': add(fx, blip(1200 + 120 * rng.integers(0, 6), .07), t, .16 * g, .1)
    elif T == 'stop': add(fx, bell(88, 1.4, 1, 2), t, .25); add(fx, sfx.click(1., 1.), t, .4)
    elif T == 'hit': add(fx, sfx.thump(1., 55), t, .5)
    elif T == 'chime': add(fx, bell(89, 1.6), t, .2, -.2); add(fx, bell(96, 1.4), t + .02, .12, .2)
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
