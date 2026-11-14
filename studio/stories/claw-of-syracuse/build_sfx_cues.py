"""Sound cue sheet for the episode: events authored in story-world time, converted to video time via story.json timeMap."""
import json, random, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open('story.json')); TM = S['timeMap']; random.seed(7)
def w2v(w):   # monotonic part of the map (after the rewind)
    for (a, wa), (b, wb) in list(zip(TM, TM[1:]))[2:]:
        if wa <= w <= wb and wb > wa: return a + (b - a) * (w - wa) / (wb - wa)
    return None
E = []
def at(w, **e):
    v = w2v(w)
    if v is not None: E.append({**e, 't': round(v, 3)})
# hook (video time directly): the ship hanging from the claw
E += [{'type': 'groan', 't': 0.2, 'dur': 2.4}, {'type': 'creak', 't': 0.6, 'dur': 1.6, 'f': 190}, {'type': 'pour', 't': 0.0, 'dur': 5.2, 'decay': 0.05}, {'type': 'chain', 't': 1.4, 'dur': 1.2, 'gain': 0.5}, {'type': 'creak', 't': 3.1, 'dur': 1.4, 'f': 240}, {'type': 'groan', 't': 3.4, 'dur': 1.8}]
E += [{'type': 'drip', 't': round(random.uniform(0.3, 5), 3)} for _ in range(14)]
E += [{'type': 'whoosh', 't': TM[1][0] - 0.05, 'dur': 1.0, 'hi': True, 'gain': 1.2}]           # rewind
for w in [4.6 + k * 1.82 for k in range(5)]: at(w, type='plop', gain=0.9)                       # oar strokes on the approach
for w in (11.0, 11.8, 12.6): at(w, type='thud', gain=0.35); at(w + 0.7, type='whoosh', dur=0.6, gain=0.8); at(w + 1.9, type='plop', gain=3.0)   # catapult stones
at(14.4, type='creak', dur=1.5, f=150, gain=1.3)                                               # something creaks
at(16.2, type='groan', dur=3.2); at(16.6, type='creak', dur=2.6, f=200); at(18.8, type='chain', dur=2.1)   # beam swings out, chain pays out
at(21.0, type='clank', gain=1.7); at(21.02, type='thud', gain=0.7); at(21.03, type='scuff', gain=0.9); at(21.2, type='chain', dur=1.1, gain=0.45)   # the bite
at(22.5, type='snap')                                                                           # chain snaps taut
for k, w in enumerate([23.1, 24.4, 25.7, 27.0, 28.3, 29.6, 30.9]): at(w, type='creak', dur=1.1, f=190 + k * 25, gain=0.85); at(w + 0.2, type='groan', dur=1.4, gain=0.6 + 0.06 * k)
at(23.2, type='pour', dur=9.5, decay=0.06, gain=1.1)
for _ in range(30): at(round(random.uniform(23.5, 32.6), 3), type='drip')
for w in (26.9, 28.0, 28.5, 29.7, 30.3, 31.0, 31.6, 32.1): at(w, type='plop', gain=2.0)         # falling shields / oars / helmets
at(32.85, type='snap', gain=0.8); at(32.9, type='whoosh', dur=0.9, gain=1.3)                    # released, falls
at(33.7, type='thud', gain=2.2); at(33.7, type='pour', dur=2.2, decay=1.4, gain=1.6); at(33.72, type='roll', gain=1.4); at(33.9, type='pour', dur=4.0, decay=0.5, gain=1.0)   # impact
for _ in range(18): at(round(random.uniform(34.2, 37.5), 3), type='bubble')
for w in (52.4, 52.9, 53.4, 53.9, 54.4, 54.9): at(w, type='plop', gain=1.1)                       # marines back water in panic
at(53.0, type='plop', gain=3.2); at(53.0, type='whoosh', dur=0.4, hi=True, gain=0.5)               # marine jumps overboard / fish yanked out
json.dump({'duration': S['duration'], 'events': sorted(E, key=lambda e: e['t'])}, open('build/cues.json', 'w')); print(len(E), 'cues')
