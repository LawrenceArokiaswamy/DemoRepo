"""Claw of Syracuse v2 (approved 39.8 s script): builds story.json from the shot list below.
Each shot = (name, video a, video b, world a, world b, camera keys, attach). Reuses the v1 world, ship/claw business and cast.
Usage: python3 build_story.py [fps]   (15 for the animatic, 30 for the final)"""
import json, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FPS = int(sys.argv[1]) if len(sys.argv) > 1 else 15
v1 = json.load(open('../claw-of-syracuse/story_62s.json'))
SMUG = {'preset': 'suspicious', 'mouth': {'smile': 0.55, 'asym': 0.8}, 'lidT': [0.32, 0.22]}
CALM = {'preset': 'neutral', 'mouth': {'smile': 0.25}, 'lidT': [0.25, 0.25]}
def K(pos, look, fov, focus, ap=0.0006): return {'pos': pos, 'look': look, 'fov': fov, 'focus': focus, 'ap': ap}
HOOK = (K([38, 6.5, 58], [0.5, 15.0, 20], 52, 53, 0.0001), K([36.5, 6.3, 56], [0.5, 15.3, 20], 50, 51, 0.0001))   # lifted ship + chain + beam + wall in one frame
ARCH_CU = (K([-4.7, 14.85, -5.6], [-4.5, 14.6, -1.6], 30, 4.0, 0.0011), K([-4.7, 14.85, -5.3], [-4.5, 14.6, -1.6], 27, 3.7, 0.0011))
SHOTS = [
 ('01 HOOK: warship lifted out of the sea by the claw', 0.00, 2.15, 27.6, 29.2, HOOK, None),
 ('02 ...by one old man (Archimedes, calm)',          2.15, 3.25, 29.2, 30.3, ARCH_CU, None),
 ('03 rewind',                                         3.25, 3.70, 30.3, 4.4, HOOK, None),
 ('04 sixty warships row in (waterline)',              3.70, 6.70, 4.4, 7.4, (K([-9, 21, -4], [2, 1.5, 150], 40, 140, 0.00004), K([-9, 20.6, -2.5], [2, 1.5, 150], 36, 140, 0.00004)), None),
 ('05 Archimedes draws in the sand; defenders scramble', 6.70, 9.45, 7.4, 10.1, (K([-8.2, 16.4, -6.4], [-4.9, 14.2, -1.6], 40, 6, 0.0006), K([-7.8, 16.2, -6.0], [-4.9, 14.2, -1.6], 38, 5.6, 0.0006)), None),
 ('06 ...and he wasn\'t worried (tiny smile)',         9.45, 11.10, 10.1, 11.8, ARCH_CU, None),
 ('07 the Romans row right up under the walls',       11.10, 13.40, 12.6, 14.9, (K([1.6, 4.0, -1.3], [12, 5.6, 0.6], 54, 2.6, 0.0006), K([2.0, 4.0, -1.3], [12, 6.1, 0.6], 52, 2.4, 0.0006)), 'hero'),
 ('08 ...exactly where he wanted them (hand raised)', 13.40, 15.40, 14.9, 16.4, (K([-4.6, 14.5, -5.4], [-5.1, 14.7, -1.6], 46, 3.9, 0.0008), K([-4.55, 14.5, -5.1], [-5.1, 14.75, -1.6], 42, 3.6, 0.0008)), None),
 ('09 a giant wooden arm swings out (low, against the sky)', 15.40, 17.90, 16.4, 19.2, (K([28, 6.0, 38], [0, 11.5, 8], 54, 38, 0.0001), K([27, 5.8, 37], [0, 11, 9], 52, 38, 0.0001)), None),
 ('10 an iron claw drops... and bites',               17.90, 20.30, 19.2, 21.25, (K([5.4, 4.25, 1.4], [14, 6.2, -0.3], 50, 8.5, 0.0005), K([5.8, 4.25, 1.4], [14, 4.6, -0.3], 48, 8.2, 0.0005)), 'hero'),
 ('11 sailor looks up: grin fades',                   20.30, 21.20, 21.25, 22.1, (K([11.3, 4.1, 1.7], [9.0, 4.0, 0.5], 30, 2.6, 0.0013), K([11.2, 4.1, 1.65], [9.0, 4.0, 0.5], 28, 2.5, 0.0013)), 'hero'),
 ('12 the chain snaps taut: it begins to pull',       21.20, 22.70, 22.1, 23.1, (K([9.5, 5.2, 3.6], [14.6, 9.0, 0], 46, 6, 0.0005), K([9.8, 5.0, 3.4], [14.6, 9.5, 0], 44, 6, 0.0005)), 'hero'),
 ('13 UP. OUT OF THE SEA (the hook image, now understood)', 22.70, 25.70, 23.3, 27.6, (K([16, 2.4, 64], [1, 8.5, 12], 52, 52, 0.00012), HOOK[0]), None),
 ('14 silence: terrified sailor, deck tilted',        25.70, 26.60, 28.0, 28.9, (K([-2.7, 4.1, 3.1], [-0.1, 3.75, 1.9], 34, 2.9, 0.0012), K([-2.6, 4.1, 3.0], [-0.1, 3.75, 1.9], 32, 2.8, 0.0012)), 'hero', 0.7),
 ('15 and then... the claw released it',              26.60, 27.75, 31.3, 32.35, (K([20, 9, 38], [1, 17, 12], 42, 30, 0.0001), K([19.5, 8.8, 37], [1, 16, 12], 42, 30, 0.0001)), None),
 ('15b CLOSE: the claw opens',                        27.75, 28.60, 32.35, 32.75, (K([8.2, 24.6, 23.6], [1.2, 26.4, 16.5], 34, 10, 0.0003), K([7.9, 24.6, 23.2], [1.2, 26.2, 16.5], 32, 9.6, 0.0003)), None),
 ('16 the fall (slow motion) and the crash',          28.60, 30.80, 32.75, 34.6, (K([31, 6.5, 46], [0, 6, 16], 46, 40, 0.0002), K([30, 6.3, 45], [0, 5.5, 16], 44, 40, 0.0002)), None),
 ('17 days later: a pole and rope swing out over the wall (echo of the claw)', 30.80, 32.60, 54.7, 56.0, (K([7.2, 4.3, 0.5], [24.2, 12.6, 3.4], 32, 18, 0.00015), K([7.3, 4.3, 0.5], [24.2, 12.0, 3.4], 28, 18, 0.00015)), 'flag'),
 ('18 the same sailor sees it: PANIC',                32.60, 34.60, 56.0, 57.6, (K([2.0, 4.0, -0.2], [24, 8.5, 3.0], 40, 5.0, 0.0004), K([2.6, 4.0, -0.1], [24, 8.6, 3.0], 36, 4.4, 0.0004)), 'flag'),
 ('19 Rome had sixty warships (holding back at sea)', 34.60, 36.70, 59.6, 61.7, (K([-3.0, 24, -6], [3, 4, 95], 40, 90, 0.00004), K([-3.0, 23.6, -5.0], [3, 4, 95], 36, 90, 0.00004)), None),
 ('20 Syracuse had Archimedes (alone on the wall)',   36.70, 39.80, 61.7, 64.8, (K([-6.6, 14.6, -5.6], [-2.2, 14.4, 8.0], 50, 4.4, 0.0005), K([-6.2, 14.6, -5.0], [-2.2, 14.4, 8.0], 44, 3.8, 0.0005)), None),
]
DUR = 39.8; tm, shots = [], []
if os.path.exists('build/retime.json') and '--animatic-timing' not in sys.argv:   # picture conformed to the recorded narration (build_final.py)
    RT = json.load(open('build/retime.json')); DUR = RT['duration']; SHOTS = [(s[0], RT['shots'][i][0], RT['shots'][i][1], *s[3:]) for i, s in enumerate(SHOTS)]
for sh in SHOTS:
    name, va, vb, wa, wb, (k0, k1), att = sh[:7]
    tm.append([round(va + (1e-3 if tm else 0), 3), wa])
    if name.startswith('16'):   # slow-motion fall: release -> impact stretched, then real time
        tm += [[round(va + (vb - va) * 0.4 / 2.2, 3), 32.95], [round(va + (vb - va) * 1.6 / 2.2, 3), 33.75]]
    tm.append([vb, wb])
    s = {'name': name, 'a': va, 'b': vb, 'keys': [dict(k0, t=va), dict(k1, t=vb)], 'a_world': wa, 'b_world': wb}
    if att: s['attach'] = att
    if len(sh) > 7: s['attachUp'] = sh[7]
    shots.append(s)
cast = json.loads(json.dumps(v1['cast'])); cast['archimedes']['spec'].pop('prop', None); cast['archimedes']['spec'].pop('propHand', None)
P = v1['performances']
P['archimedes'] = {'beats': [
  {'t': 0, 'act': 'idle', 'face': CALM}, {'t': 7.4, 'act': 'curious'}, {'t': 9.6, 'act': 'idle', 'face': SMUG},
  {'t': 15.3, 'act': 'point', 'face': SMUG, 'body': {'armR': [128, 30], 'handR': 'open', 'headTilt': 6}}, {'t': 17.2, 'act': 'idle', 'face': SMUG},
  {'t': 27.0, 'act': 'idle', 'face': CALM}, {'t': 32.4, 'act': 'idle', 'face': SMUG},
  {'t': 49.5, 'act': 'idle', 'face': CALM}, {'t': 62.6, 'act': 'idle', 'face': SMUG}]}
UP = {'pupil': [0, -0.9]}
for e in v1['extras']:
    if e['id'].startswith('worker'): e['beats'] = [{'t': 0, 'act': 'idle'}, {'t': 7.4, 'act': 'shock'}, {'t': 8.0, 'act': 'fear'}, {'t': 21.2, 'act': 'effort'}]
P['titus'] = {'beats': [
  {'t': 0, 'act': 'idle'}, {'t': 12.0, 'act': 'laugh'}, {'t': 15.0, 'act': 'idle', 'face': {'preset': 'neutral', 'mouth': {'smile': 0.6}}},
  {'t': 20.9, 'act': 'notice'}, {'t': 21.5, 'act': 'confused'}, {'t': 22.0, 'act': 'fear'}, {'t': 23, 'act': 'stumble'}, {'t': 25.2, 'act': 'fear'},
  {'t': 28.2, 'act': 'recoil'}, {'t': 32.7, 'act': 'shock'}, {'t': 34, 'act': 'fear'},
  {'t': 49.5, 'act': 'idle', 'face': {'preset': 'neutral', 'mouth': {'smile': 0.3}}}, {'t': 55.75, 'act': 'notice', 'face': dict(UP, preset='notice')}, {'t': 56.15, 'act': 'shock', 'face': dict(UP, preset='shock')}, {'t': 56.8, 'act': 'fear', 'face': dict(UP, preset='fear')}]}
story = {'title': 'The Claw of Syracuse (v2)', 'period': v1['period'], 'set': v1['set'], 'fps': FPS, 'duration': DUR, 'business': '../claw-of-syracuse/business.js',
         'cardHeight': v1['cardHeight'], 'cardEmissive': v1.get('cardEmissive', 0.16), 'timeMap': tm, 'ambience': v1.get('ambience'),
         'cast': cast, 'extras': v1['extras'], 'performances': P, 'shots': shots, 'kicks': [], 'noStones': True, 'clearAfter': 49.5, 'exposure': [[34.6, 39.8, 0.62, 0.15]], 'hazeScale': 0.3,
         'extraFleet': 22, 'hideAfter': {'w': 59.5, 'ids': ['titus', 'marcellus', 'crew1', 'crew2', 'crew3', 'crew4', 'crew5', 'crew6', 'officer1', 'officer2']}, 'ropeGag': {'pivot': [-3.6, 13.6, 0.4], 'len': 3.6, 't0': 55.0, 'swing': 0.9, 'until': 58.5}, 'workerRun': {'t0': 7.6, 't1': 10.6, 'x0': -10.5, 'x1': 2.0, 'z': -0.9}}
s19 = next(x for x in shots if x['name'].startswith('19')); story['exposure'] = [[s19['a'], DUR + 1, 0.52, 0.0, 0.08]]; story['hazeScale'] = 0.2   # late sun-facing shots (19-20): less exposure and glare
json.dump(story, open('story.json', 'w'), indent=1)
print('shots', len(shots), 'frames', round(DUR * FPS)); print('timeMap', tm)
