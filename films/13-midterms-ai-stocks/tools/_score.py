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
def register(v=1.): return (bell(96, .5, 1, 1.5) * .6 + blip(2400, .06)[:int(.5 * SR)].tolist() and bell(96, .5, 1, 1.5)) * v
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

