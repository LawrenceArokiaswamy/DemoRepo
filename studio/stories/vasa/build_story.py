"""Episode 2 (Vasa): writes story.json (shots/cameras) and captions_animatic.ass (temp on-screen script text; no paid voice yet).
Timings are the planned VO timings (~138 wpm for the Grady voice); picture will be conformed to the recorded voice later."""
import json
VX, VZ = 40, 10
def K(t, pos, look, fov, focus=None, ap=0.0002): return {'t': t, 'pos': pos, 'look': look, 'fov': fov, 'focus': focus or 10, 'ap': ap}
SH = [  # name, a, b, attach, keys, outline px
 ('S01 hook: gilded stern under sail', 0.0, 1.6, 'ship@0.8', [K(0, [-62, 1.0, 30], [-14, 15, 0], 46, 60), K(1.6, [-59, 1.1, 28.5], [-13, 15, 0], 45, 58)], 3.6),
 ('S02 hook: the tilt; the smile freezes', 1.6, 4.0, 'deck', [K(1.6, [1.3, 7.15, 5.6], [1.0, 7.1, 3.3], 34, 2.3, 0.0005), K(4.0, [1.25, 7.15, 5.25], [1.0, 7.1, 3.3], 34, 2.0, 0.0005)], 5.2),
 ('S03 the king wanted two gun decks', 4.0, 6.9, 'ship@5', [K(4.0, [17, 3.0, -10.5], [-8, 5, -5.8], 46, 8), K(6.9, [16.5, 7.5, -10.8], [-8, 7.5, -5.8], 46, 8)], 4.2),
 ('S04 the test is set up', 6.9, 9.4, 'ship@8', [K(6.9, [-3, 15, 13], [-4, 6.0, -2.5], 52, 12), K(9.4, [-3, 14.2, 12.2], [-4, 6.0, -2.5], 52, 12)], 3.6),
 ('S05a the runs', 9.4, 12.0, 'ship@10', [K(9.4, [-5.2, 7.6, 3.9], [-10.5, 6.3, -1.2], 52, 6), K(12.0, [-5.4, 7.6, 3.8], [-10.5, 6.3, -1.2], 52, 6)], 4.0),
 ('S05b the admiral watches', 12.0, 12.8, 'ship@12', [K(12.0, [6.6, 3.9, -6.6], [6.0, 3.65, -8.1], 32, 1.6, 0.0006), K(12.8, [6.55, 3.9, -6.75], [6.0, 3.65, -8.1], 32, 1.5, 0.0006)], 5.0),
 ('S05c third run: the hero lands on the high side', 12.8, 14.1, 'ship@13', [K(12.8, [4.4, 7.3, 6.2], [2.4, 6.8, 1.0], 42, 4), K(14.1, [4.2, 7.3, 6.0], [2.4, 6.9, 2.0], 42, 4)], 4.6),
 ('S06a STOP', 14.1, 15.2, 'ship@14', [K(14.1, [7.2, 3.7, -5.9], [6.0, 4.4, -8.1], 46, 2.5, 0.0004), K(15.2, [7.1, 3.7, -6.0], [6.0, 4.4, -8.1], 46, 2.4, 0.0004)], 5.0),
 ('S06b frozen crew', 15.2, 16.2, 'ship@15.5', [K(15.2, [-6, 11, 9.5], [-1, 6.2, -1.5], 55, 10), K(16.2, [-6, 10.6, 9.2], [-1, 6.2, -1.5], 55, 10)], 3.8),
 ('S07 they sailed anyway', 16.2, 18.6, 'ship@17', [K(16.2, [8.6, 3.8, -6.6], [6.0, 3.85, -8.1], 42, 3), K(18.6, [8.4, 3.8, -6.7], [6.0, 3.85, -8.1], 42, 2.8)], 4.8),
 ('S08 departure, salute', 18.6, 21.0, 'ship@19.8', [K(18.6, [55, 6, 70], [-2, 13, -2], 44, 90, 0.0001), K(21.0, [52, 6.5, 66], [0, 13, -2], 44, 88, 0.0001)], 3.2),
 ('S09 first breeze: she leans and comes back', 21.0, 24.0, 'ship', [K(21.0, [3.4, 7.3, 6.6], [2.0, 7.0, 3.5], 40, 3.3, 0.0004), K(24.0, [3.3, 7.3, 6.4], [2.0, 7.0, 3.5], 40, 3.1, 0.0004)], 5.0),
 ('S10 a stronger gust', 24.0, 25.8, 'ship@24.9', [K(24.0, [22, 3, 62], [0, 9, 0], 48, 60, 0.0001), K(25.8, [20, 3.4, 58], [0, 9, 0], 48, 58, 0.0001)], 3.2),
 ('S11 the lower gun deck', 25.8, 28.2, 'deck', [K(25.8, [1.6, 1.65, -3.0], [2.6, 1.4, 1.2], 56, 3), K(28.2, [1.7, 1.6, -2.8], [2.6, 1.4, 1.2], 56, 3)], 5.0),
 ('S12 the open gunports dip under: water rushes in', 28.2, 30.2, 'ship', [K(28.2, [5.0, 0.9, -15.5], [0.5, 0.6, -5.8], 46, 10), K(30.2, [4.6, 0.8, -15.0], [0.5, 0.4, -5.8], 46, 10)], 4.0),
 ('S13 the sinking, from the shore', 30.2, 35.4, 'world', [K(30.2, [VX - 2.2, 2.9, 103.4], [VX, 7, VZ], 40, 90, 0.0001), K(35.4, [VX - 2.0, 2.85, 103.1], [VX, 4.5, VZ], 38, 90, 0.0001)], 3.8),
 ('S14 the inquiry', 35.4, 40.8, 'room', [K(35.4, [0, 2.5, 5.4], [0, 1.1, 0.0], 46, 5), K(40.8, [0, 2.3, 4.6], [0, 1.15, 0.0], 46, 4.6)], 4.6),
 ('S15 333 years on the seabed', 40.8, 45.0, 'world', [K(40.8, [VX + 20, -21, VZ + 22], [VX, -25, VZ], 50, 25), K(45.0, [VX + 16, -22.5, VZ + 19], [VX, -24, VZ], 48, 22)], 3.4),
 ('S16 1961: she comes back up', 45.0, 48.0, 'world', [K(45.0, [VX + 26, 2.2, VZ + 28], [VX, 2.0, VZ], 40, 38, 0.0001), K(48.0, [VX + 24, 3.4, VZ + 26], [VX, 3.0, VZ], 40, 35, 0.0001)], 3.2),
 ('S17 payoff: the stern, framed like the opening', 48.0, 50.4, 'ship@49', [K(48.0, [-62, 1.0, 30], [-14, 5, 0], 46, 60), K(50.4, [-60, 1.05, 29], [-14, 5.2, 0], 45, 58)], 3.6),
]
sun = {'zenith': '#4f86d9', 'mid': '#9fc2ee', 'horizon': '#ffd9a0', 'sun': '#fff6dc', 'sunDir': [-0.6, 0.42, 0.68], 'clouds': '#ffffff', 'cloudShade': '#c6b7e2'}   # late-afternoon sun from the south-west
story = {'title': 'Vasa: The Warship That Sank on Its First Voyage (animatic)', 'period': 'baroque', 'set': 'stockholm', 'fps': 30, 'duration': 50.4, 'business': 'business.js',
         'cast': {}, 'performances': {}, 'extras': [], 'kicks': [], 'style': {'preset': 'golden', 'override': {'sky': sun}, 'shadowBox': [0, 5, 0, 40]},
         'shots': [{'name': n, 'a': a, 'b': b, 'attach': at, 'keys': ks, 'outline': ol} for n, a, b, at, ks, ol in SH]}
# final conform (build_final.py): shots and camera keys are authored in animation time; the director wants video time
import os
if os.path.exists('build/timeline.json'):
    TLJ = json.load(open('build/timeline.json')); TM = TLJ['timeMap']
    def w2v(w):
        for (v0, w0), (v1, w1) in zip(TM, TM[1:]):
            if w <= w1 + 1e-9: return round(v0 + (v1 - v0) * (w - w0) / max(1e-6, (w1 - w0)), 4)
        return TM[-1][0]
    for sh in story['shots']:
        sh['a'], sh['b'] = w2v(sh['a']), w2v(sh['b'])
        for k in sh['keys']: k['t'] = w2v(k['t'])
    story['timeMap'] = TM; story['duration'] = TLJ['duration']; story['title'] = story['title'].replace(' (animatic)', '')
json.dump(story, open('story.json', 'w'), indent=1)
# ---- temp captions (the locked script lines at their planned times) ----
VO = [(0.2, 2.4, 'Sweden built a warship so powerful…'), (2.7, 4.0, '…it sank on its first voyage.'), (4.2, 6.8, 'The king wanted two gun decks. Sixty-four cannons.'),
      (7.0, 9.3, 'First, a test: thirty men ran across the deck.'), (13.9, 16.1, 'She rolled so hard, the admiral stopped the test.'), (17.4, 18.4, 'They sailed anyway.'),
      (21.1, 23.8, 'A breeze. She leaned… and came back.'), (24.2, 25.4, 'Then, a stronger gust.'), (26.0, 27.6, 'The lower gunports were open.'),
      (31.0, 33.0, 'Within sight of the city, she sank.'), (33.6, 35.0, 'At least thirty people died.'), (35.6, 37.0, 'The designer was dead.'), (37.2, 39.4, 'The builders said the king approved the plans.'), (39.6, 40.6, 'Nobody was punished.'),
      (41.0, 42.6, 'She sank in twenty minutes.'), (42.8, 45.6, 'Then she lay underwater for 333 years…'), (46.0, 47.8, '…until they brought her back,'), (48.2, 49.4, 'almost whole.')]
NOTES = [(4.2, 6.8, 'STOCKHOLM · 1628'), (18.8, 20.9, '10 AUGUST 1628'), (46.0, 47.9, '1961')]
def ts(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f'{h}:{m:02d}:{s:05.2f}'
hdr = """[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,66,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,1,0,1,6,3,2,110,110,700,1
Style: Note,DejaVu Sans,44,&H00F2F2F2,&H00FFFFFF,&H64000000,&H64000000,1,0,0,0,100,100,2,0,3,10,0,8,90,90,215,1
Style: Tag,DejaVu Sans,30,&H00D0D0D0,&H00FFFFFF,&H80000000,&H80000000,0,0,0,0,100,100,0,0,3,6,0,7,30,30,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = [f'Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{x}' for a, b, x in VO] + [f'Dialogue: 0,{ts(a)},{ts(b)},Note,,0,0,0,,{x}' for a, b, x in NOTES]
ev += [f'Dialogue: 0,{ts(a)},{ts(b)},Tag,,0,0,0,,ANIMATIC · temp script text, no voice · {n.split(" ")[0]}' for n, a, b, *_ in SH]
open('captions_animatic.ass', 'w').write(hdr + '\n'.join(ev) + '\n')
print('shots', len(SH), 'duration', story['duration'])
