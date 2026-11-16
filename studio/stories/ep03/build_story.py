"""Episode 3 (internet history): writes story.json (shots in animation time) and captions_animatic.ass (script as on-screen text; no paid voice).
Timings follow the planned narration (~125 wpm incl. pauses); picture will be conformed to the recorded Grady voice later (time map, as EP02)."""
import json
def K(t, pos, look, fov, focus, ap=0.0008): return {'t': t, 'pos': pos, 'look': look, 'fov': fov, 'focus': focus, 'ap': ap}
INS = [K(0, [-0.38, 1.03, 0.0], [0.0, 1.03, 0.0], 34, 0.38, 0.002)]
SH = [
 ('S01 HOOK insert: 9:41 ALERT, his face blurred behind', 0.0, 2.8, 'table', [K(0, [-0.42, 1.03, 0.0], [0.0, 1.04, 0.0], 34, 0.42, 0.002), K(2.8, [-0.36, 1.03, 0.0], [0.0, 1.04, 0.0], 34, 0.36, 0.002)]),
 ('S02 low wide: phones flare in a wave', 2.8, 5.0, 'world', [K(2.8, [-1.3, 1.0, 1.3], [0.6, 1.0, -5.0], 50, 5, 0.0004), K(5.0, [-0.7, 1.0, 1.1], [0.8, 1.0, -5.0], 50, 5, 0.0004)]),
 ('S03a diner reaction', 5.0, 5.8, 'diner0', [K(5.0, [0.14, 1.16, 1.4], [0.0, 1.12, 0.0], 38, 1.4, 0.0012)]),
 ('S03b diner reaction', 5.8, 6.6, 'diner1', [K(5.8, [-0.14, 1.16, 1.4], [0.0, 1.12, 0.0], 38, 1.4, 0.0012)]),
 ('S03c diner reaction', 6.6, 7.4, 'diner3', [K(6.6, [0.14, 1.16, 1.4], [0.0, 1.12, 0.0], 38, 1.4, 0.0012)]),
 ('S04 two-shot: his search bubble', 7.4, 13.0, 'table', [K(7.4, [-1.7, 1.4, -1.3], [0.52, 1.36, 0.37], 46, 2.5), K(13.0, [-1.58, 1.38, -1.18], [0.52, 1.36, 0.37], 46, 2.4)]),
 ('S05 her bubble; his deadpan turn', 13.0, 16.6, 'table', [K(13.0, [-1.52, 1.38, -1.12], [0.52, 1.36, 0.37], 46, 2.3), K(16.6, [-1.36, 1.36, -1.0], [0.52, 1.34, 0.37], 46, 2.1)]),
 ('S06 insert montage: sharing with Boss / Mom / Everyone nearby', 16.6, 21.2, 'table', INS),
 ('S07 hands: phones face-down', 21.2, 23.2, 'table', [K(21.2, [-0.75, 1.22, -1.0], [0.6, 0.92, -0.15], 42, 1.7, 0.001), K(23.2, [-0.62, 1.18, -0.9], [0.6, 0.9, -0.15], 42, 1.6, 0.001)]),
 ('S08 next day: quiet, cool', 23.2, 25.6, 'world', [K(23.2, [0.4, 1.1, 1.6], [0.3, 1.0, -4.0], 46, 5, 0.0004), K(25.6, [0.4, 1.1, 1.3], [0.3, 1.0, -4.0], 46, 5, 0.0004)]),
 ('S09a diner0 worried', 25.6, 27.0, 'diner0', [K(25.6, [0.14, 1.16, 1.4], [0.0, 1.1, 0.0], 38, 1.4, 0.0012)]),
 ('S09b insert: is this mole normal (deleted)', 27.0, 28.55, 'table', INS),
 ('S09c diner1 sad', 28.55, 29.3, 'diner1', [K(28.55, [-0.14, 1.16, 1.4], [0.0, 1.1, 0.0], 38, 1.4, 0.0012)]),
 ('S09d insert: how to leave a relationship safely (deleted)', 29.3, 30.85, 'table', INS),
 ('S09e diner3 hesitates', 30.85, 31.6, 'diner3', [K(30.85, [0.14, 1.16, 1.4], [0.0, 1.1, 0.0], 38, 1.4, 0.0012)]),
 ('S09f insert: am I depressed or just tired (deleted)', 31.6, 33.15, 'table', INS),
 ('S09g the room: heads down, questions unasked', 33.15, 35.4, 'world', [K(33.15, [0.4, 1.15, 1.2], [0.3, 1.0, -4.0], 46, 5, 0.0004), K(35.4, [0.4, 1.2, 1.5], [0.3, 1.0, -4.0], 46, 5, 0.0004)]),
 ('S10 weeks later: pan across the room, bubbles over everyone, laughter', 35.4, 41.8, 'world', [K(35.4, [0.4, 1.45, 0.6], [-5.0, 1.55, -2.2], 50, 5, 0.0004), K(38.6, [0.4, 1.45, 0.6], [0.4, 1.4, -5.0], 50, 5, 0.0004), K(41.8, [0.4, 1.45, 0.6], [5.0, 1.55, -3.0], 50, 5, 0.0004)]),
 ('S11 final: empty search bar, blinking cursor; he looks up', 41.8, 50.0, 'table', [K(41.8, [-0.55, 1.12, 0.0], [0.78, 1.1, 0.0], 40, 1.3, 0.0012), K(50.0, [-0.5, 1.12, 0.0], [0.78, 1.09, 0.0], 40, 1.25, 0.0012)]),
]
base = json.load(open('../ep03-motion/story.json'))
story = {**base, 'title': 'EP03 What If Everyone Could See Your Internet History (animatic)', 'duration': 50.0, 'business': 'business.js',
         'shots': [{'name': n, 'a': a, 'b': b, 'attach': at, 'keys': ks} for n, a, b, at, ks in SH]}
json.dump(story, open('story.json', 'w'), indent=1)
VO = [(0.2, 4.4, "At 9:41 tonight, every search you've ever made goes public."), (4.8, 6.8, 'For everyone. All at once.'), (7.6, 12.8, "At first, it's funny. He searched: how to seem interesting on a date."),
      (13.2, 16.2, 'She searched: how to leave a date early.'), (16.8, 20.8, 'Then your boss can see it. Your family. Strangers.'), (21.4, 23.0, 'So people stop searching.'), (23.4, 25.2, 'Even when they need it most.'),
      (25.8, 32.0, 'No one looks up a scary symptom. No one asks how to leave a bad relationship.'), (32.6, 35.2, 'Questions that could have helped… go unasked.'),
      (35.8, 41.6, "Weeks later, people realize everyone's history is weird… and the shame starts to fade."), (42.6, 47.4, 'If every search became public… would you still dare to ask?')]
def ts(x): return f'{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}'
hdr = open('../vasa/captions_animatic.ass').read().split('[Events]')[0] + '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
# lines over phone inserts go to the top of frame so the screen stays readable; line 1 splits at the S01/S02 cut
def cap(a, b, x, top=False): return f'Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,{150 if top else 0},,' + ('{\\an8}' if top else '') + x
TOP = {4, 7}   # line indices (0-based) wholly or mostly over inserts: line 5 (S06 share cards), line 8 (S09 typing)
ev = [cap(0.2, 2.8, VO[0][2], True), cap(2.8, VO[0][1], VO[0][2])] + [cap(a, b, x, i in TOP) for i, (a, b, x) in enumerate(VO) if i] + [f'Dialogue: 0,{ts(0.2)},{ts(3.0)},Note,,0,0,120,,{{\\an2}}FICTION · WHAT IF?'] + [f'Dialogue: 0,{ts(a)},{ts(b)},Tag,,0,0,0,,ANIMATIC · temp script text, no voice · {n.split(" ")[0]}' for n, a, b, *_ in SH]
open('captions_animatic.ass', 'w').write(hdr + '\n'.join(ev) + '\n'); print('shots', len(SH))
