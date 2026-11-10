# "Same Room" — score + sound design -> out/mix.wav and stems. No narration.
# Piano: Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0) via @audio-samples/piano-velocity{4,8,12} (samples/, fetched by build.sh).
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve, resample_poly
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, bp, lp, hp, noise, t_, norm
H = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(f'{H}/events.json'))['ev']; DUR = 45.0; N = int(DUR * SR)
rng = np.random.default_rng(25)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
mt = lambda m: 440 * 2 ** ((m - 69) / 12)
def add2(buf, x, t, g=1.):
    i = int(t * SR); e = min(len(buf), i + len(x))
    if e > i: buf[i:e] += x[:e - i] * g
def env(d, a=.005, r=.05):
    tt = t_(d); return np.minimum(1, tt / max(a, 1e-4)) * np.minimum(1, np.maximum(0, d - tt) / max(r, 1e-4))

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
def pad(t, ms, d, v=1., att=1.5, rel=2., bright=1400):
    d = d + rel; tt = t_(d); out = np.zeros((len(tt), 2))
    for m in ms:
        for k in range(5):
            f = mt(m) * (1 + (k - 2) * .003) * (1 + .002 * np.sin(2 * np.pi * (4.3 + k * .4) * tt + k)); x = 2 * ((np.cumsum(f) / SR + rng.random()) % 1) - 1
            p = (k - 2) / 2.5; out[:, 0] += x * (1 - p) * .5; out[:, 1] += x * (1 + p) * .5
    out = lp(lp(out.T, bright), bright * 1.3).T / (len(ms) * 5); e = np.minimum(1, (tt / att) ** 1.5) * np.minimum(1, np.maximum(0, d - tt) / rel)
    add2(mus, out * e[:, None] * v, t)

# ---------------- cue sheet ----------------
# 0-8 together: a gentle D-major figure. 8-27 drifting: D minor, the figure loses notes. 27.5 silence. 31.4 low chord.
# 37.6 phone face down: warmth returns. 41.2 the floor closes: D major resolves.
def figure(t0, notes, step, vel, pan=.15):
    for k, m in enumerate(notes): piano(t0 + k * step, m, vel * (.9 + .2 * rng.random()), step * 4, pan if k % 2 else -pan)
for t0 in (.3, 2.3, 4.3, 6.3): figure(t0, [62, 66, 69, 74], .5, .3)
piano(.3, 38, .3, 7.5, -.2); piano(.32, 50, .25, 7.5, -.1); pad(.3, [62, 66, 69], 7.6, .05, att=2.5)
drift = [(8.0, [62, 65, 69, 74]), (10.0, [62, 65, 69]), (12.0, [58, 62, 65, 70]), (14.0, [58, 62, 65]), (16.0, [57, 60, 64, 69]), (18.0, [57, 64]),
         (20.0, [55, 58, 62, 67]), (22.0, [55, 62]), (24.0, [53, 57]), (26.0, [57])]
bass = {8.0: 38, 12.0: 34, 16.0: 33, 20.0: 31, 24.0: 29}
for t0, ns in drift:
    figure(t0, ns, .5 if t0 < 16 else .62, .28 if t0 < 22 else .22)
    if t0 in bass: piano(t0, bass[t0], .3, 4.4, -.2)
pad(8.0, [50, 57, 62], 19.5, .045, att=3, rel=1.0, bright=1100)
# phone dies: everything stops (27.5 - 31.4), then one low chord as she sees the distance
s0, s1 = int(27.5 * SR), int(31.4 * SR)
piano(31.4, 26, .45, 5.5); piano(31.42, 38, .35, 5.5); piano(31.45, 45, .3, 5.5); pad(31.4, [38, 45, 50], 5.6, .05, att=1.5, rel=1.0, bright=800)
piano(34.6, 74, .3, 2.5, .3); piano(35.1, 81, .22, 2.5, .3)                    # her call
# 37.6 phone face down -> the floor closes -> 41.2 resolve in D major
for t0, ns in [(37.6, [62, 66, 69]), (39.0, [62, 67, 71]), (40.2, [64, 69, 73])]: figure(t0, ns, .45, .32)
piano(37.6, 38, .32, 4.0, -.2); pad(37.6, [62, 66, 69, 74], 3.8, .07, att=1.6, rel=.8, bright=1800)
piano(41.2, 38, .45, 4.5, -.2); piano(41.22, 50, .38, 4.5, -.1); piano(41.25, 57, .34, 4.5); piano(41.3, 66, .34, 4.5, .1); piano(41.35, 74, .32, 4.5, .2)
for k, m in enumerate([78, 81, 86, 90]): piano(41.8 + k * .45, m, .22, 3, .25)
pad(41.2, [50, 57, 62, 66, 69], 3.6, .09, att=.8, rel=1.6, bright=2200)
fade = int(.12 * SR); mus[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None] ** 2

def hall(x, secs=3.6, wet=.38, pre=.03):
    n = int(secs * SR); tt = np.arange(n) / SR; ir = np.zeros((n, 2))
    for ch in range(2): r = np.random.default_rng(ch + 9).standard_normal(n); ir[:, ch] = lp(r, 5500) * np.exp(-tt / (secs / 6.9))
    ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    return x * (1 - wet) + np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1) * wet * 2.2
mus = hall(mus); mus[s0:s1] = 0

# ---------------- foley ----------------
def buzz(d=.5):
    tt = t_(d); x = np.sin(2 * np.pi * 165 * tt) * (np.sin(2 * np.pi * 26 * tt) > 0) * env(d, .01, .05); return lp(x, 900)
def ping(): tt = t_(.5); return (np.sin(2 * np.pi * 1760 * tt) * .6 + np.sin(2 * np.pi * 2637 * tt) * .3) * np.exp(-tt / .12)
for e in EV:
    t, ty, g = e['t'], e['type'], e.get('g', 1.)
    if ty == 'room': x = lp(noise(DUR), 220); add2(fx, np.stack([x, np.roll(x, 900)], 1), 0, .02)
    elif ty == 'buzz': add(fx, buzz(.45), t, .1, -.3); add(fx, buzz(.45), t + .7, .08, -.3)
    elif ty == 'ping': add(fx, ping(), t, .025 * g, rng.uniform(-.4, .4))
    elif ty == 'crack': add(fx, hp(noise(.35), 2500) * np.exp(-t_(.35) / .05), t, .08); add(fx, sfx.thump(1., 45), t, .25); add(fx, bp(noise(1.2), 60, 300) * np.exp(-t_(1.2) / .4), t, .12)
    elif ty == 'drift': d = 1.4; add(fx, bp(noise(d), 40, 220) * np.sin(np.pi * t_(d) / d) ** 2, t, .12 * g); add(fx, hp(noise(.2), 3000) * np.exp(-t_(.2) / .03), t, .03 * g)
    elif ty == 'share': add(fx, sfx.click(1.), t, .03)
    elif ty == 'die': tt = t_(.6); add(fx, np.sin(2 * np.pi * np.cumsum(900 * (1 - tt / .6) ** 2 + 80) / SR) * env(.6, .005, .1), t, .08)
    elif ty == 'stand': add(fx, sfx.creak(.6), t, .02)
    elif ty == 'steps': [add(fx, sfx.step(1.), t + k * .42, .05, .2) for k in range(int(e.get('d', 2) / .42))]
    elif ty == 'drop': d = 2.4; tt = t_(d); add(fx, bp(noise(d), 300, 3000) * np.exp(-tt / .8) * np.sin(np.pi * np.minimum(1, tt / d) ) , t, .03, -.1)
    elif ty == 'call': tt = t_(2.0); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in ((587, .9), (880, .6), (1175, .4))); add(fx, x * .5, t, .06, .2); add(fx, x * .3, t + .9, .03, -.4)
    elif ty == 'facedown': add(fx, sfx.thump(.6, 140), t, .1); add(fx, sfx.click(.8), t, .04)
    elif ty == 'close': d = e.get('d', 3.); add(fx, bp(noise(d), 40, 200) * np.sin(np.pi * t_(d) / d) ** 2, t, .14)
    elif ty == 'seal': add(fx, bp(noise(1.5), 200, 6000) * np.exp(-t_(1.5) / .3), t, .05); add(fx, sfx.thump(.8, 60), t, .2)
fx[s0:s1] *= .0
# a single room tone keeps the silence alive (very low)
x = lp(noise((s1 - s0) / SR), 180); add2(fx, np.stack([x, x], 1), s0 / SR, .012)

mus *= .5 / np.sqrt((mus[int(1 * SR):int(26 * SR)] ** 2).mean())
fx *= 4.0
mix = mus * .5 + fx; mix = hp(mix.T, 30).T
sc = .7 / np.abs(mix).max(); mix *= sc
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True)
sf.write(f'{H}/out/mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_music.wav', (mus * .5 * sc).astype(np.float32), SR, subtype='FLOAT'); sf.write(f'{H}/out/stem_sfx.wav', (fx * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(f'{H}/out/stem_vo.wav', np.zeros((N, 2), np.float32), SR, subtype='FLOAT')
print('mix written', DUR)
