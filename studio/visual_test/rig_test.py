import json, math, sys
from PIL import Image
J = json.load(open('joints.json')); P = lambda n: Image.open(f'cut/{n}.png').convert('RGBA')
RIG = json.load(open('rig.json'))
def place(canvas, img, anchor, at, scale, rot):
    """paste img so that its normalized anchor lands on canvas point `at`, rotated rot degrees (ccw) about that anchor"""
    w, h = img.size; img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS); w, h = img.size
    ax, ay = anchor[0] * w, anchor[1] * h; pad = int(math.hypot(w, h)); big = Image.new('RGBA', (pad * 2, pad * 2)); big.alpha_composite(img, (int(pad - ax), int(pad - ay)))
    big = big.rotate(rot, resample=Image.BICUBIC, center=(pad, pad)); canvas.alpha_composite(big, (int(at[0] - pad), int(at[1] - pad)))
def limb_end(start, anchor_top, anchor_bot, size, scale, rot):
    dx = (anchor_bot[0] - anchor_top[0]) * size[0] * scale; dy = (anchor_bot[1] - anchor_top[1]) * size[1] * scale; r = math.radians(-rot)
    return (start[0] + dx * math.cos(r) - dy * math.sin(r), start[1] + dx * math.sin(r) + dy * math.cos(r))
def build(pose, out):
    R = RIG; cv = Image.new('RGBA', (1400, 2400), (0, 0, 0, 0)); T = P('part_0'); ts = R['torso_scale']; tw, th = T.size[0] * ts, T.size[1] * ts
    tor = (700 - tw / 2, 520); tp = lambda u, v: (tor[0] + u * tw, tor[1] + v * th)
    def arm(side, up, fore, a1, a2, front):
        sh = tp(*R['shoulder_' + side]); U = P(up); us = R['upper_scale']
        el = limb_end(sh, J[up]['top'], J[up]['bot'], U.size, us, a1); F = P(fore)
        return [(F, J[fore]['top'], el, R['fore_scale'], a1 + a2), (U, J[up]['top'], sh, us, a1)]  # forearm under the sleeve cuff
    far = arm('far', 'part_2', pose.get('far_hand', 'part_3'), *pose['far'], False)
    near = arm('near', 'part_1', pose.get('near_hand', 'part_3'), *pose['near'], True)
    legs = [(P('part_7'), J['part_7']['top'], tp(*R['hip_near']), R['leg_scale'], pose['legs'][0]), (P('part_8'), J['part_8']['top'], tp(*R['hip_far']), R['leg_scale'], pose['legs'][1])]
    for L in legs[::-1]: place(cv, *L)
    for a in far: place(cv, *a)
    place(cv, T, (0.5, 0), (700, 520), ts, 0)
    H = P('head_' + pose['head']); place(cv, H, J['head_' + pose['head']]['collar'], tp(*R['collar']), R['head_scale'], pose.get('head_rot', 0))
    for a in near: place(cv, *a)
    bg = Image.new('RGBA', cv.size, (120, 140, 160, 255)); bg.alpha_composite(cv); return bg
if __name__ == '__main__':
    poses = json.load(open(sys.argv[1])); ims = [build(p, None).resize((700, 1200)) for p in poses]
    d = Image.open('design.png').convert('RGBA'); dd = Image.new('RGBA', d.size, (120, 140, 160, 255)); dd.alpha_composite(d); ims.insert(0, dd.resize((int(1200 * d.size[0] / d.size[1]), 1200)))
    sheet = Image.new('RGB', (sum(i.size[0] for i in ims), 1200)); x = 0
    for i in ims: sheet.paste(i.convert('RGB'), (x, 0)); x += i.size[0]
    sheet.save(sys.argv[2], quality=88)
