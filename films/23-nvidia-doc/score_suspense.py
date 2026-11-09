# ---------------- score: suspense (C minor). Exec'd inside mix.py (shares its helpers and buffers). ----------------
# Low drone that opens up as the story escalates, a heartbeat that speeds up (66 -> 120 bpm), a ticking clock once the stakes arrive,
# dissonant tremolo strings, a sparse minor piano motif, deep "braam" hits on the turns, a Shepard riser into the silence, a dark hit after it.
EVT = lambda typ: [e['t'] for e in EV if e['type'] == typ]
DOWN = EVT('snap')[0]; HITt = F['HIT']; tQ = L0('n11') - .05
l2, l3, l5, l6, l8 = (L0(k) for k in ('n2', 'n3', 'n5', 'n6', 'n8'))

def piano(m, d=2.2, v=1.):
    tt = t_(d); f = mt(m)
    x = sum(np.sin(2 * np.pi * f * h * (1 + .0004 * h * h) * tt) * np.exp(-tt / (d / (1.5 + h * .9))) / h ** 1.25 for h in range(1, 8))
    h_ = bp(noise(.02), 1500, 6000) * .15; x[:len(h_)] += h_
    return x * env(d, .003, .3) * v
def braam(m, d=2.6, v=1.):
    tt = t_(d); x = sum(saw(mt(m + o), d, .006) for o in (-12, 0, 7, 12)) / 4
    op = np.exp(-tt / .5); x = lp(x, 260) * (1 - op) + lp(x, 1600) * op
    return np.tanh(x * 2.4) * env(d, .03, 1.2) * np.exp(-tt / (d / 1.6)) * v
def strings(ms, d, v=1., att=None, trem=9.):
    tt = t_(d); x = sum(saw(mt(m), d, .004) for m in ms) / len(ms); x = lp(lp(x, 2600), 3200)
    a = att if att is not None else d * .7
    return x * (.75 + .25 * np.sin(2 * np.pi * trem * tt)) * np.minimum(1, (tt / a) ** 1.6) * env(d, .01, .25) * v
def drone(d, v=1., open_=None):
    tt = t_(d); x = (saw(mt(24), d, .004) + saw(mt(31), d, .005) * .7 + np.sin(2 * np.pi * mt(36) * tt) * .5)
    lo, hi = lp(x, 180), lp(x, 900); k = open_ if open_ is not None else tt / d
    return (lo * (1 - k) + hi * k) * env(d, 1.2, .05) * v
def beat(v=1.):  # lub-dub
    a = sub(v, 75, 40, .28); b_ = sub(v * .65, 70, 38, .24); o = np.zeros(len(a) + int(.2 * SR)); o[:len(a)] += a; o[int(.2 * SR):int(.2 * SR) + len(b_)] += b_; return o
def shepard(d, v=1.):
    tt = t_(d); out = np.zeros_like(tt)
    for o in range(6):
        lf = (o + 1.6 * tt / d) % 6; f = 55 * 2 ** lf; w = np.exp(-((lf - 3) ** 2) / 2.2)
        out += np.sin(2 * np.pi * np.cumsum(f) / SR) * w
    return out / 3 * (tt / d) ** 1.5 * v

# 0) frame-4 hook: sub drop + high glass harmonic
add(mus, sub(1.2, 120, 30, 2.0), 0.02, .45); add(mus, strings([84, 85], DOWN + .3, 1., .2, 6), 0, .05)
# 1) "affair": braam + crash
add(mus, braam(36, 3.2), DOWN - .03, .55); add(mus, crash(1.6), DOWN, .07)
# 2) drone under everything until the silence, opening as the story escalates
dd = S0 - DOWN; tt_ = t_(dd); op = np.clip((tt_ - (l3 - DOWN)) / (S0 - l3), 0, 1) ** 1.3
add(mus, drone(dd, 1., op), DOWN, .2)
# 3) heartbeat: 66 bpm from the second line, speeding up to ~120 bpm by the silence
t = l2;
while t < S0 - .35:
    acc = clamp_ = min(1, max(0, (t - l2) / (S0 - l2))); add(mus, beat(.9 + .3 * acc), t, .34 + .14 * acc); t += 60 / (66 + 54 * acc ** 1.4)
# 4) clock from "why is the whole AI world watching?"
t = l5; k = 0
while t < S0 - .1:
    acc = min(1, max(0, (t - l5) / (S0 - l5))); add(mus, tick(1, 3400 if k % 2 else 2600, .02), t, .05 + .04 * acc, (-.4, .4)[k % 2]); k += 1; t += .5 * (1 - .4 * acc)
# 5) piano motif (C minor, sparse), from the second line; last note left hanging
mot = [48, 51, 55, 56, 55, 51, 50, 47]; t = l2 + .2; k = 0
while t < S0 - 1.0:
    add(mus, piano(mot[k % len(mot)], 2.4), t, .11, -.15);
    if k % 4 == 0: add(mus, piano(mot[k % len(mot)] - 12, 2.8), t, .07)
    k += 1; t += 1.1 if t < l6 else .8
# 6) dissonant tremolo strings: semitone cluster enters on the intelligence line, widens on the stakes and on Congress
add(mus, strings([71, 72], S0 - l3, 1., 2.5), l3, .07); add(mus, strings([59, 60, 66], S0 - l6, 1., 2.0, 11), l6, .07); add(mus, strings([77, 78, 83, 84], S0 - l8, 1., S0 - l8, 13), l8, .07)
add(mus, braam(36, 2.6), l3 + .05, .3); add(mus, braam(32, 2.6), l6 - .05, .3); add(mus, braam(31, 2.8), l8 - .05, .36)
# 7) Shepard riser into the silence
add(mus, shepard(S0 - l8 + .2, 1.), l8 - .2, .16); dr = 1.8; add(mus, riser(dr, .9), S0 - dr, .35)
# 8) after the silence: the hit, then a dark drone; the motif slows under the question and never resolves
add(mus, sub(1.4, 110, 26, 3.4), HITt, .85); add(mus, braam(24, 4.0), HITt, .7); add(mus, crash(2.6), HITt, .12); add(mus, kick(1.2, 160, 36, .6), HITt, .5)
add(mus, drone(DUR - HITt, 1., .35), HITt, .2); add(mus, strings([60, 61], DUR - HITt, 1., 1.5, 7), HITt, .06)
t = tQ + .2
for m in [55, 51, 50, 47]:
    if t > DUR - 1.2: break
    add(mus, piano(m, 3.0), t, .12); t += 1.15
fade = int(.01 * SR); s0i, hiti = int(S0 * SR), int(HIT * SR)
mus[s0i - fade:s0i] *= np.linspace(1, 0, fade)[:, None]; mus[s0i:hiti] = 0
mus[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2
