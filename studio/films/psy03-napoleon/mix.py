"""PSY03 mix: score (pop-print synth toolkit, 100 BPM), SFX from window.EV (events.json), Kokoro voice lines -> out/mix.wav (48 kHz stereo).
Run with the library's venv: "$LIB/.venv/bin/python" mix.py  (needs LIB in the environment for core/audio/sfx.py)."""
import os, sys, json, wave, numpy as np
LIB = os.environ.get('LIB', '/home/user/lemomo-ai/lemo-opuscar'); sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); SR = X.SR
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; EV = ev['ev']; N = int((DUR + 0.5) * SR)
M = np.zeros(N); S = np.zeros((N, 2)); V = np.zeros(N); rng = np.random.default_rng(5)
def put(buf, x, t, g=1.0):
    i = int(t * SR); x = x[: max(0, len(buf) - i)]
    if i < 0 or len(x) == 0: return
    buf[i:i + len(x)] += x * g
def sput(x, t, g=1.0, pan=0.0):
    put(S[:, 0], x, t, g * np.sqrt(0.5 * (1 - pan))); put(S[:, 1], x, t, g * np.sqrt(0.5 * (1 + pan)))
# ---------------- voice
for e in EV:
    if e['type'] != 'voice': continue
    w = wave.open(os.path.join(HERE, 'voice', e['id'] + '.wav')); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; w.close()
    x = resample_poly(x, SR, sr); put(V, x, e['t'])
V = X.compress(X.hp(V, 80), thr=0.18, ratio=3.0)
# ---------------- score
BPM = 100; B = 60 / BPM
def tone(f, d, kind='sine', a=0.004, r=0.25):
    t = X.t_(d); ph = 2 * np.pi * f * t
    w = np.sin(ph) if kind == 'sine' else (np.sign(np.sin(ph)) * 0.6 + np.sin(ph) * 0.4) if kind == 'sq' else 2 / np.pi * np.arcsin(np.sin(ph))
    env = np.minimum(1, t / a) * np.exp(-t / r); return w * env
def marimba(f, d=0.5): return ad(tone(f, d, 'sine', 0.002, 0.18), 0.35 * tone(f * 4, d, 'sine', 0.001, 0.05))
def pizz(f): return X.lp(tone(f, 0.35, 'sq', 0.002, 0.07), 2500) * 0.7
def kick(): t = X.t_(0.35); return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
def snare(): return ad(X.bp(X.noise(0.18), 1500, 6000) * X.env_exp(0.18, 0.05) * 0.6, tone(190, 0.12, 'sine', 0.001, 0.04) * 0.4)
def hat(): return X.hp(X.noise(0.05), 7000) * X.env_exp(0.05, 0.012) * 0.35
def snap(): return X.bp(X.noise(0.06), 2000, 5000) * X.env_exp(0.06, 0.01) * 0.7
def ad(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
sec = [e for e in EV if e['type'] == 'music']
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
MEL = [76, 72, 74, 76, 79, 76, 74, 72]
for i, s0 in enumerate(sec[:-1]):
    a, b, kind = s0['t'], sec[i + 1]['t'], s0['sec']
    beat = int(np.ceil(a / B)); t = beat * B
    while t < b - 0.05:
        bi = beat % 16; bar = (beat // 4) % 4; ch = CH[bar]
        if kind in ('A', 'C'):
            put(M, kick() * 0.8, t); 
            if beat % 2: put(M, snare() * (0.5 if kind == 'A' else 0.7), t)
            for h in (0, 0.5): put(M, hat(), t + h * B)
            for h in (0, 0.5): put(M, X.lp(tone(NOTE(ch[0] - 24), 0.28, 'sq', 0.003, 0.12), 900) * 0.45, t + h * B)
            if beat % 2 == 0: put(M, marimba(NOTE(MEL[(beat // 2) % 8])) * 0.35, t)
            if kind == 'C' and beat % 4 == 3: put(M, X.whoosh(0.5) * 0.25, t)
        elif kind == 'B':
            put(M, pizz(NOTE(ch[(beat) % 3] + 12)) * 0.5, t); put(M, pizz(NOTE(ch[(beat + 1) % 3] + 12)) * 0.35, t + 0.5 * B)
            if beat % 2: put(M, snap(), t)
            if beat % 4 == 0: put(M, X.lp(tone(NOTE(ch[0] - 24), 0.5, 'sq', 0.003, 0.2), 700) * 0.4, t)
        elif kind == 'pad':
            if beat % 4 == 0:
                for m in ch: put(M, tone(NOTE(m), 4 * B, 'tri', 0.4, 2.0) * 0.12, t)
            if beat % 2: put(M, pizz(NOTE(ch[1] + 12)) * 0.25, t)
        elif kind == 'tag':
            for k, m in enumerate([72, 76, 79, 84]): put(M, ad(tone(NOTE(m), 1.2, 'sine', 0.002, 0.5), 0.3 * tone(NOTE(m) * 2.76, 0.8, 'sine', 0.001, 0.2)) * 0.25, t + k * 0.18)
            break
        beat += 1; t = beat * B
# ---------------- SFX
def stamp(big=0):
    t = X.t_(0.6); boom = np.sin(2 * np.pi * (140 * np.exp(-t * 6) + 45) * t) * np.exp(-t * 7); x = ad(boom * 0.9, X.click(0.8, 1.0))
    if big: x = ad(x, X.bp(X.noise(0.6), 800, 5000) * X.env_exp(0.6, 0.08) * 0.35)
    return x
def shutter(): return np.concatenate([X.click(1.4, 0.8), np.zeros(int(0.05 * SR)), X.click(1.1, 0.6)])
for e in EV:
    t, k = e['t'], e['type']
    if k == 'whoosh': sput(X.whoosh(0.4), t, 0.5)
    elif k == 'hit': sput(X.thump(1.0, 55), t, 0.9); sput(X.bp(X.noise(0.3), 300, 3000) * X.env_exp(0.3, 0.06)[:len(X.noise(0.3))], t, 0.3)
    elif k == 'shutter': sput(shutter(), t, 0.6, 0.2)
    elif k == 'stamp': sput(stamp(e.get('big', 0)), t, 0.9)
    elif k == 'tick': sput(X.click(1.6, 0.6), t, 0.35 * e.get('v', 0.5) * 2, -0.2)
    elif k == 'paper' or k == 'slide': sput(X.bp(X.noise(0.35), 1500, 7000) * X.env_exp(0.35, 0.12), t, 0.35)
    elif k == 'slap': sput(ad(X.bp(X.noise(0.12), 600, 4000) * X.env_exp(0.12, 0.03), X.thump(0.5, 120)), t, 0.6)
    elif k == 'pop': sput(X.pop(0.9), t, 0.6)
    elif k == 'pluck': sput(pizz(NOTE([64, 67, 71, 74][e.get('i', 0) % 4])), t, 0.6, [-0.4, 0.4, -0.4, 0.4][e.get('i', 0) % 4])
    elif k == 'clock': sput(X.click(2.0, 1.0), t, 0.8)
    elif k == 'drawer': sput(X.thump(0.7, 90), t, 0.6); sput(X.bp(X.noise(0.3), 800, 4000) * X.env_exp(0.3, 0.1), t - 0.25, 0.3)
    elif k == 'bell': sput(X.ding(0.8), t, 0.5)
# ---------------- mix: duck music under voice, balance voice ~10 dB above music
env = np.convolve(np.abs(V), np.ones(int(0.08 * SR)) / int(0.08 * SR), 'same'); duck = 1 - 0.6 * np.clip(env / (env.max() * 0.15 + 1e-9), 0, 1)
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2) + 1e-12)
M = M * duck; M *= (rms(V) / (rms(M) + 1e-9)) * 10 ** (-11 / 20)
mixL = V + M + S[:, 0]; mixR = V + M + S[:, 1]; out = np.stack([mixL, mixR], 1)
out = np.tanh(out / (np.abs(out).max() + 1e-9) * 1.4) * 0.9
fade = np.ones(N); nf = int(1.0 * SR); fade[-nf:] = np.linspace(1, 0, nf); out *= fade[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); w = wave.open(os.path.join(HERE, 'out', 'mix.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()); w.close(); print('mix', DUR, 's')
