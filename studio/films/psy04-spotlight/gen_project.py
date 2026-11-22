import json, math
T = json.load(open('timing.json'))
L = 0.15; TAIL = 1.3
seg = {s['id']: (s['start'] + L, s['end'] + L) for s in T['segments']}
DUR = 42.925542 + L + TAIL

# captions: balanced chunks per phrase, char-proportional time, digits for numbers
DISP = {'P07': "In 2000, Cornell psychologists sent students into a room",
        'P11': "The real answer? About 1 in 4."}
caps = []
for s in T['segments']:
    text = DISP.get(s['id'], s['text']); words = text.split()
    n = max(1, math.ceil(len(text) / 30))
    # greedy balanced split
    target = len(text) / n; chunks = []; cur = []
    for w in words:
        if cur and len(' '.join(cur + [w])) > target + 4 and len(chunks) < n - 1:
            chunks.append(' '.join(cur)); cur = [w]
        else: cur.append(w)
    chunks.append(' '.join(cur))
    a, b = seg[s['id']]; tot = sum(len(c) for c in chunks); t = a
    for c in chunks:
        e = t + (b - a) * len(c) / tot
        caps.append({'start': round(t, 3), 'end': round(e, 3), 'text': c}); t = e

IMG = dict(x=110, y=520, w=1010, h=1010)
INK = json.load(open('ink_bbox_cropped.json'))
def img(id, path, t0=0.0, dur=3.0, zoom=1.0, dx=0, dy=0, sway=0):
    x0, y0, x1, y1 = INK[path]; iw, ih = x1 - x0, y1 - y0
    base = min(960 / iw, 990 / ih) * zoom           # design units per source px
    cx, cy = 602 + dx, 1095 + dy                     # ink centre target
    def st(t, z, bob=0, **kw):                       # scale about ink centre
        k = base * z
        return {'t': round(t, 3), 'w': round(iw * k, 2), 'x': round(cx - (x0 + iw / 2) * k, 2),
                'y': round(cy - (y0 + ih / 2) * k + bob, 2), **kw}
    keys = [st(t0, .9, alpha=0), st(t0 + .2, 1.03, alpha=1), st(t0 + .34, 1.0)]
    t, n = t0 + .34, 0
    while t < dur:
        t = min(dur, t + 1.1); n += 1
        keys.append(st(t, 1 + min(.05, .01 * n), bob=-7 if n % 2 else 0))
    first = keys[2]
    return {'id': id, 'type': 'image', 'path': f'media/{path}', 'x': first['x'], 'y': first['y'], 'w': first['w'], 'from': t0, 'keys': keys,
            'motion': {'role': 'actor', 'reason': 'figure pops in and keeps breathing so the beat never freezes'}}
def txt(id, s, y, t0, size=124, color='#191916', x=95, to=None):
    l = {'id': id, 'type': 'text', 'text': s, 'x': x, 'y': y, 'w': 1020, 'size': size, 'bold': True, 'color': color, 'from': t0,
         'keys': [{'t': t0, 'alpha': 0, 'y': y + 26}, {'t': t0 + .18, 'alpha': 1, 'y': y}]}
    if to is not None: l['to'] = to
    return l
def under(id, x, y, w, t0, color='#EC4338'):
    return {'id': id, 'type': 'underline', 'x': x, 'y': y, 'w': w, 'color': color, 'lineWidth': 9, 'from': t0,
            'keys': [{'t': t0, 'progress': 0}, {'t': t0 + .3, 'progress': 1}],
            'motion': {'role': 'information', 'reason': 'marker stroke underlines the number being stressed'}}

RED, YEL = '#EC4338', '#E8B500'
plan = []  # (start, end, layers, intent)
def cut(pid): return round(seg[pid][0] - .1, 3)
def rel(pid, s0, off=0): return round(seg[pid][0] - s0 + off, 3)

bounds = [0, cut('P02'), cut('P03'), cut('P04'), cut('P05'), cut('P07'), cut('P08'), cut('P09'), cut('P10'), cut('P11'), cut('P12'), cut('P14'), cut('P16'), cut('P17'), DUR - 0.0005]
def S(i): return bounds[i], bounds[i + 1]

s, e = S(0); plan.append((s, e, [img('s1_img', 'a01_door.png', 0, e - s), txt('s1_t', 'EVERYONE', 236, .05), txt('s1_t2', 'NOTICED.', 382, 1.6, color=RED)], 'He freezes in the doorway, sure every eye is on him'))
s, e = S(1); plan.append((s, e, [img('s2_img', 'a02_stain.png', 0, e - s), txt('s2_t', 'THE STAIN.', 290, .05)], 'Insert one: a coffee stain he thinks everyone sees'))
s, e = S(2); plan.append((s, e, [img('s3_img', 'a03_wave.png', 0, e - s), txt('s3_t', 'THE WAVE.', 290, .05)], 'Insert two: an awkward wave nobody returns'))
s, e = S(3); plan.append((s, e, [img('s4_img', 'a04_crack.png', 0, e - s), txt('s4_t', 'THE VOICE CRACK.', 290, .05)], 'Insert three: the voice crack, hand on throat'))
s, e = S(4); plan.append((s, e, [img('s5_img', 'a05_phones.png', 0, e - s), txt('s5_t', 'BUT...', 236, .05, to=rel('P06', s)), txt('s5_t2', "THEY DIDN'T", 236, rel('P06', s, .9)), txt('s5_t3', 'EVEN LOOK.', 382, rel('P06', s, 1.15), color=RED)], 'Everyone else is buried in their phones and never looked'))
s, e = S(5); plan.append((s, e, [img('s6_img', 'a07_class.png', 0, e - s), txt('s6_t', 'CORNELL, 2000', 236, .2), under('s6_u', 100, 372, 820, .5, YEL)], 'The real study: students sent into a room'))
s, e = S(6); plan.append((s, e, [img('s7_img', 'a06_shirt.png', 0, e - s), txt('s7_t', 'THE CRINGE', 236, .05), txt('s7_t2', 'T-SHIRT.', 382, rel('P08', s, 1.6), color=RED)], 'One student wears an embarrassing pop-star shirt'))
s, e = S(7); plan.append((s, e, [img('s8_img', 'a07_class.png', 0, e - s, zoom=1.0), txt('s8_t', 'HOW MANY', 236, .05), txt('s8_t2', 'NOTICED?', 382, rel('P09', s, 1.4), color=RED)], 'The question to the room: who noticed the shirt?'))
s, e = S(8); plan.append((s, e, [img('s9_img', 'a08_bubble.png', 0, e - s), txt('s9_t', 'THEIR GUESS:', 236, .05), txt('s9_t2', 'HALF THE ROOM', 382, rel('P10', s, 1.35), color=RED)], 'He imagines a whole crowd staring at him'))
s, e = S(9); plan.append((s, e, [img('s10_img', 'a09_onein4.png', 0, e - s), txt('s10_t', 'REALITY:', 236, .05), txt('s10_t2', '1 IN 4.', 382, rel('P11', s, 1.95), size=140, color=RED), under('s10_u', 100, 530, 420, rel('P11', s, 2.15))], 'Only one student in four actually looked up'))
s, e = S(10); plan.append((s, e, [img('s11_img', 'a10_stage.png', 0, e - s), txt('s11_t', 'THE SPOTLIGHT', 236, .15), txt('s11_t2', 'EFFECT', 382, .45, color=RED), under('s11_u', 100, 518, 420, .8, YEL)], 'Named: he feels alone on stage under a giant light'))
s, e = S(11); plan.append((s, e, [img('s12_img', 'a11_everyone.png', 0, e - s), txt('s12_t', "EVERYONE'S IN", 236, .1), txt('s12_t2', 'THEIR OWN SHOW.', 382, rel('P15', s, .1), color=RED)], 'Everyone stands under their own light, worried about themselves'))
s, e = S(12); plan.append((s, e, [img('s13_img', 'a08_bubble.png', 0, e - s), txt('s13_t', 'FEEL WATCHED?', 236, .1)], 'The viewer feels watched again'))
s, e = S(13); plan.append((s, e, [img('s14_img', 'a10_stage.png', 0, e - s), txt('s14_t', "YOU'RE HOLDING", 236, rel('P17', s, .9)), txt('s14_t2', 'THE SPOTLIGHT.', 382, rel('P17', s, 1.7), color=RED)], 'Payoff: the only one holding the light is you'))

shots = []
for (s0, e0, layers, _) in plan:
    span = round(e0 - s0, 3) - 0.001
    for l in layers:
        l['from'] = min(l.get('from', 0), span - .05)
        ks = []
        for k in l.get('keys', []):
            k['t'] = round(min(k['t'], span), 3)
            if not ks or k['t'] > ks[-1]['t']: ks.append(k)
        l['keys'] = ks
for i, (s, e, layers, intent) in enumerate(plan):
    regions = [{'id': f'r{i}_actor', 'role': 'actor', 'layer_ids': [l['id'] for l in layers if l['type'] == 'image'],
                'region': {'x': 80, 'y': 550, 'w': 1044, 'h': 1125}, 'intent': 'the drawn figure acting out the beat'}]
    info = [l['id'] for l in layers if l['type'] != 'image']
    if info: regions.append({'id': f'r{i}_info', 'role': 'information', 'layer_ids': info,
                             'region': {'x': 85, 'y': 220, 'w': 1039, 'h': 325}, 'intent': 'handwritten headline with the key idea'})
    shots.append({'start': s, 'end': e, 'layers': layers, 'portrait': {'intent': intent, 'regions': regions}})

sfx = []
for i, (s, e, layers, _) in enumerate(plan):
    if i: sfx.append({'time': round(max(0, s - .03), 3), 'kind': 'file', 'path': 'audio/swish.wav', 'gain': .35})
    for l in layers:
        if l['type'] == 'text': sfx.append({'time': round(s + l['from'], 3), 'kind': 'tap', 'gain': .16})
sfx.append({'time': round(seg['P05'][0] - .12, 3), 'kind': 'file', 'path': 'audio/scratch.wav', 'gain': .45})
sfx.append({'time': round(seg['P11'][0] + 1.95, 3), 'kind': 'chime', 'gain': .22})
sfx.append({'time': round(seg['P12'][0] + .1, 3), 'kind': 'pop', 'gain': .2})
sfx.sort(key=lambda x: x['time'])

p = json.load(open('project/project.json'))
p.update({'voice': {'path': 'narration.wav', 'lead': L, 'tail': TAIL}, 'captions': caps, 'shots': shots, 'sfx': sfx,
          'music': {'path': 'audio/bgm-investigations.mp3', 'gain': .07}, 'ambience': [{'path': 'audio/roomtone.wav', 'start': 0, 'end': DUR - 0.0005, 'gain': .03, 'loop': True}]})
json.dump(p, open('project/project.json', 'w'), indent=1)
print(len(shots), 'shots', len(caps), 'captions', round(DUR, 2), 's')
