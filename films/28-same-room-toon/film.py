# "Same Room" — stylised toy-3D version (free): Blender Cycles on CPU, every character and prop modelled here in code.
# Look: rounded toy people with painted eyes and sculpted hair, cozy dressed room, warm lamp / cold phone light, shallow depth of field.
# Usage:  python film.py -- --still 2:60 [--res 540x960 --samples 24 --out review]     one test frame (shot:frame, 24 fps, 120 frames/shot)
#         python film.py -- --shot 2 --frames 0:120 [--out out/frames]               render a range
import bpy, sys, os, math, argparse, random
from mathutils import Vector, Euler
HERE = os.path.dirname(os.path.abspath(__file__)); ASSET = '/root/blender_assets'; FPS = 24
ap = argparse.ArgumentParser(); ap.add_argument('--shot', type=int, default=2); ap.add_argument('--frames', default='0:1'); ap.add_argument('--still', default='')
ap.add_argument('--res', default='540x960'); ap.add_argument('--samples', type=int, default=24); ap.add_argument('--out', default=f'{HERE}/out/frames')
A = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
clamp = lambda x, a=0., b=1.: max(a, min(b, x)); lerp = lambda a, b, k: a + (b - a) * k; seg = lambda t, a, b: clamp((t - a) / (b - a))
ss = lambda x: (lambda y: y * y * (3 - 2 * y))(clamp(x)); V3 = lambda a, b, k: tuple(lerp(a[i], b[i], k) for i in range(3))
R = math.radians

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = A.samples; sc.cycles.use_denoising = True; sc.cycles.use_adaptive_sampling = True
sc.cycles.max_bounces = 6; sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
rw, rh = map(int, A.res.split('x')); sc.render.resolution_x, sc.render.resolution_y = rw, rh
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 94
col = sc.collection

# ---------------- materials ----------------
def mat(name, color, rough=.6, metal=0., emit=None, estr=0., sss=0., bump=0., bscale=200.):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (.5, .2, .1)
    if bump:
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = bscale; nz.inputs['Detail'].default_value = 4
        bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = bump; nt.links.new(nz.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], b.inputs['Normal'])
    return m
def knit(name, color):   # sweater: soft ribbed knit
    m = mat(name, color, .95); nt = m.node_tree; b = nt.nodes['Principled BSDF']
    w = nt.nodes.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'X'; w.inputs['Scale'].default_value = 60; w.inputs['Distortion'].default_value = 1.5
    bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = .35; nt.links.new(w.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], b.inputs['Normal']); return m
def plaid(name, c1, c2, c3, scale=6):
    m = mat(name, c1, .95); nt = m.node_tree; b = nt.nodes['Principled BSDF']; tc = nt.nodes.new('ShaderNodeTexCoord')
    sx = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['UV'], sx.inputs[0]); out = None
    def stripes(sock):
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = scale; nt.links.new(sock, mul.inputs[0])
        fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; nt.links.new(mul.outputs[0], fr.inputs[0])
        lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .18; nt.links.new(fr.outputs[0], lt.inputs[0]); return lt.outputs[0]
    a, bb = stripes(sx.outputs['X']), stripes(sx.outputs['Y']); mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; nt.links.new(a, mx.inputs[0]); nt.links.new(bb, mx.inputs[1])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['A'].default_value = (*c1, 1); mix.inputs['B'].default_value = (*c2, 1); nt.links.new(mx.outputs[0], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color']); return m

# ---------------- mesh helpers ----------------
def smooth(o, sub=2):
    if sub: o.modifiers.new('sub', 'SUBSURF').levels = sub; o.modifiers['sub'].render_levels = sub
    for p in o.data.polygons: p.use_smooth = True
    return o
def rbox(size, loc, m, bev=.03, sub=2, parent=None, rot=(0, 0, 0), name='b'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size; o.data.materials.append(m)
    bpy.ops.object.transform_apply(scale=True); md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 3; md.limit_method = 'NONE'; smooth(o, sub)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o
def ball(r, loc, m, scale=(1, 1, 1), parent=None, seg=32, name='s'):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2); o = bpy.context.object; o.name = name; o.scale = scale; o.data.materials.append(m); smooth(o, 0)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o
def tube(r, length, loc, m, parent=None, r2=None, name='t'):  # capsule-ish limb hanging down from loc
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=(loc[0], loc[1], loc[2] - length / 2), vertices=24); o = bpy.context.object; o.name = name; o.data.materials.append(m)
    if r2:
        for v in o.data.vertices:
            if v.co.z < 0: v.co.x *= r2 / r; v.co.y *= r2 / r
    md = o.modifiers.new('bev', 'BEVEL'); md.width = r * .6; md.segments = 4; md.limit_method = 'NONE'; smooth(o, 1)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o
def joint(name, loc, parent=None):
    e = bpy.data.objects.new(name, None); col.objects.link(e); e.location = loc
    if parent: e.parent = parent; e.matrix_parent_inverse = parent.matrix_world.inverted()
    return e

# ---------------- toy people ----------------
class Toy:
    def __init__(self, name, skin, top, pants, sock, hair, style):
        self.name = name; S = mat(name + '_skin', skin, .5, sss=.15); TOP = knit(name + '_top', top) if style == 'her' else mat(name + '_top', top, .9, bump=.15, bscale=600)
        PAN = mat(name + '_pants', pants, .95, bump=.25, bscale=300); SOCK = knit(name + '_sock', sock); HAIR = mat(name + '_hair', hair, .45, bump=.4, bscale=90)
        WHITE = mat(name + '_eyew', (.95, .95, .93), .3); PUP = mat(name + '_pup', (.03, .02, .02), .15); MOUTH = mat(name + '_mouth', (.35, .12, .1), .6)
        j = {}; root = joint(name, (0, 0, 0)); j['root'] = root
        j['hips'] = joint(name + '_hips', (0, 0, .78), root); j['spine'] = joint(name + '_spine', (0, 0, .8), j['hips'])
        rbox((.34, .21, .5), (0, 0, 1.05), TOP, .09, 2, j['spine'], name=name + '_torso')
        rbox((.3, .2, .16), (0, 0, .78), PAN, .07, 2, j['hips'], name=name + '_pelvis')
        j['neck'] = joint(name + '_neck', (0, 0, 1.3), j['spine']); tube(.045, .08, (0, 0, 1.36), S, j['neck'], name=name + '_neckm')
        j['head'] = joint(name + '_head', (0, 0, 1.34), j['neck']); H = j['head']
        ball(.155, (0, 0, 1.5), S, (1, .96, 1.1), H, name=name + '_skull')
        for sx in (-1, 1):
            ball(.035, (sx * .152, 0, 1.49), S, (.45, .9, 1), H, name=name + '_ear')
            e = ball(.036, (sx * .056, -.128, 1.51), WHITE, (1, .55, 1.15), H, name=name + '_eye'); p = ball(.019, (sx * .056, -.146, 1.505), PUP, (1, .5, 1.1), H, name=name + '_pupil')
            lid = ball(.039, (sx * .056, -.125, 1.515), S, (1.05, .65, 1.2), H, name=name + '_lid'); j['lid' + ('L' if sx > 0 else 'R')] = lid
            j['brow' + ('L' if sx > 0 else 'R')] = ball(.026, (sx * .058, -.142, 1.575), HAIR, (1, .28, .26), H, 16, name=name + '_brow')
        ball(.022, (0, -.158, 1.47), S, (1, 1, 1.15), H, name=name + '_nose')
        mj = joint(name + '_mouthj', (0, -.147, 1.43), H); bpy.ops.mesh.primitive_cylinder_add(radius=.0055, depth=.055, location=(0, -.147, 1.43), rotation=(0, R(90), 0), vertices=12)
        mo = bpy.context.object; mo.data.materials.append(MOUTH); bpy.ops.object.transform_apply(rotation=True); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=10); bpy.ops.object.mode_set(mode='OBJECT')
        for v in mo.data.vertices: v.co.z += 14 * (v.co.x) ** 2   # smile curve (edited below by scaling z)
        smooth(mo, 0); mo.parent = mj; mo.matrix_parent_inverse = mj.matrix_world.inverted(); j['mouth'] = mj
        if style == 'her':   # curly bun + curls round the hairline
            ball(.165, (0, .015, 1.53), HAIR, (1.02, .98, 1.02), H, name=name + '_hairc'); ball(.085, (0, .07, 1.7), HAIR, (1, 1, .9), H, name=name + '_bun')
            rnd = random.Random(3)
            for i in range(22):
                a = rnd.uniform(0, 2 * math.pi); ball(.03 + rnd.random() * .015, (math.cos(a) * .08, .07 + math.sin(a) * .08, 1.7 + rnd.uniform(-.03, .05)), HAIR, (1, 1, 1), H, 16, name=name + '_curl')
            for x in (-.12, -.06, .0, .06, .12): ball(.03, (x, -.11, 1.6 - abs(x) * .3), HAIR, (1, .8, 1), H, 16, name=name + '_fringe')
            for sx in (-1, 1): ball(.028, (sx * .15, -.06, 1.42), HAIR, (.8, .8, 1.8), H, 16, name=name + '_lock')
        else:                # short messy hair
            ball(.163, (0, .02, 1.54), HAIR, (1.03, 1.0, 1.0), H, name=name + '_hairc'); rnd = random.Random(7)
            for i in range(14): ball(.045, (rnd.uniform(-.12, .12), rnd.uniform(-.1, .08), 1.66 + rnd.uniform(-.02, .03)), HAIR, (1, 1, .7), H, 16, name=name + '_tuft')
            for x in (-.1, -.03, .04, .11): ball(.035, (x, -.12, 1.62), HAIR, (1.1, .8, .8), H, 16, name=name + '_fringe')
        for k, sx in (('L', 1), ('R', -1)):
            sh = joint(f'{name}_sh{k}', (sx * .2, 0, 1.24), j['spine']); j['sh' + k] = sh; tube(.06, .26, (sx * .2, 0, 1.26), TOP, sh, .055, name=name + '_uarm')
            el = joint(f'{name}_el{k}', (sx * .2, 0, 1.0), sh); j['el' + k] = el; tube(.052, .24, (sx * .2, 0, 1.0), TOP if style == 'her' else S, el, .045, name=name + '_farm')
            if style == 'her': rbox((.11, .11, .05), (sx * .2, 0, .78), TOP, .02, 1, el, name=name + '_cuff')
            wr = joint(f'{name}_wr{k}', (sx * .2, 0, .76), el); j['wr' + k] = wr
            ball(.052, (sx * .2, -.01, .71), S, (.75, .5, 1.1), wr, name=name + '_hand'); ball(.022, (sx * .2 - sx * .04, -.035, .73), S, (1, 1, 1.4), wr, 16, name=name + '_thumb')
            hp = joint(f'{name}_hp{k}', (sx * .085, 0, .76), j['hips']); j['hp' + k] = hp; tube(.078, .38, (sx * .085, 0, .78), PAN, hp, .066, name=name + '_thigh')
            kn = joint(f'{name}_kn{k}', (sx * .085, 0, .4), hp); j['kn' + k] = kn; tube(.064, .34, (sx * .085, 0, .42), PAN, kn, .055, name=name + '_shin')
            an = joint(f'{name}_an{k}', (sx * .085, 0, .07), kn); j['an' + k] = an; rbox((.1, .21, .08), (sx * .085, -.045, .045), SOCK, .035, 2, an, name=name + '_foot')
        self.j = j; self.S = S
    def pose(self, p, loc=(0, 0, 0), rz=0.):
        self.j['root'].location = loc; self.j['root'].rotation_euler = (0, 0, rz)
        for k, e in self.j.items():
            if isinstance(e, bpy.types.Object) and e.type == 'EMPTY' and k != 'root': e.rotation_euler = (0, 0, 0)
        for k, v in p.items():
            if k in self.j and self.j[k].type == 'EMPTY': self.j[k].rotation_euler = v
        hy = p.get('hy', 0.); self.j['hips'].location.z = .78 + hy
        blink = p.get('blink', 0.)
        for k in ('lidL', 'lidR'): self.j[k].scale.z = 1.2 if blink > .5 else .001; self.j[k].hide_render = blink < .5
        sad = p.get('sad', 0.)
        for k, s in (('browL', 1), ('browR', -1)): self.j[k].rotation_euler = (0, s * sad * .35, 0)
        sm = p.get('smile', .3); self.j['mouth'].scale = (1, 1, sm if abs(sm) > .05 else .05)
def mixp(a, b, k):
    o = {}
    for key in set(a) | set(b):
        va, vb = a.get(key, b.get(key)), b.get(key, a.get(key))
        o[key] = tuple(lerp(va[i], vb[i], k) for i in range(3)) if isinstance(va, tuple) else lerp(va, vb, k)
    return o
# poses (character faces -Y; X-rotation: negative swings a hanging limb forward; positive tips an upright part forward)
SIT = {'hy': -.26, 'hpL': (R(-88), 0, R(-4)), 'hpR': (R(-88), 0, R(4)), 'knL': (R(88), 0, 0), 'knR': (R(88), 0, 0), 'shL': (R(-20), 0, R(8)), 'shR': (R(-20), 0, R(-8)), 'elL': (R(-55), 0, 0), 'elR': (R(-55), 0, 0)}
PHONE = {**SIT, 'spine': (R(12), 0, 0), 'neck': (R(14), 0, 0), 'head': (R(22), 0, 0), 'shR': (R(-28), 0, R(-6)), 'elR': (R(-112), 0, R(40)), 'wrR': (R(-15), 0, 0), 'shL': (R(-26), 0, R(6)), 'elL': (R(-105), 0, R(-42)), 'smile': .1, 'sad': .3}

# ---------------- room ----------------
W = bpy.data.worlds.new('w'); sc.world = W; W.use_nodes = True; BGW = W.node_tree.nodes['Background']; BGW.inputs['Color'].default_value = (.02, .03, .07, 1); BGW.inputs['Strength'].default_value = 1
floorM = bpy.data.materials.new('floor'); floorM.use_nodes = True; nt = floorM.node_tree; fb = nt.nodes['Principled BSDF']
br = nt.nodes.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = 4; br.inputs['Mortar Size'].default_value = .004; br.offset = .5; br.squash = 6
br.inputs['Color1'].default_value = (.36, .21, .11, 1); br.inputs['Color2'].default_value = (.3, .17, .09, 1); br.inputs['Mortar'].default_value = (.1, .06, .03, 1)
nt.links.new(br.outputs['Color'], fb.inputs['Base Color']); fb.inputs['Roughness'].default_value = .38
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0)); bpy.context.object.data.materials.append(floorM)
wallM = mat('wall', (.36, .42, .33), .9, bump=.05, bscale=60); trimM = mat('trim', (.88, .86, .8), .45)
def wall(size, loc): rbox(size, loc, wallM, .005, 0)
wall((2.6, .12, 2.9), (-2.4, 1.4, 1.45)); wall((2.6, .12, 2.9), (2.4, 1.4, 1.45)); wall((2.2, .12, .6), (0, 1.4, 2.6)); wall((2.2, .12, .85), (0, 1.4, .425))
wall((.12, 7, 2.9), (-3.4, -2, 1.45)); wall((.12, 7, 2.9), (3.4, -2, 1.45)); rbox((7, 7, .1), (0, -2, 2.95), wallM, .005, 0)
for x in (-1.08, 1.08): rbox((.07, .16, 1.48), (x, 1.4, 1.58), trimM, .01, 1)
rbox((2.3, .16, .07), (0, 1.4, 2.3), trimM, .01, 1); rbox((2.4, .28, .06), (0, 1.33, .86), trimM, .01, 1); rbox((.05, .16, 1.42), (0, 1.4, 1.58), trimM, .01, 1)
for x in (-3.0, 3.0): pass
rbox((6.6, .03, .12), (0, 1.33, .06), trimM, .005, 1)
# curtains
curM = mat('curtain', (.62, .55, .44), .95, bump=.2, bscale=80)
for sx in (-1, 1):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(sx * 1.32, 1.28, 1.5), rotation=(R(90), 0, 0)); c = bpy.context.object; c.scale = (.45, 2.3, 1); bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=40); bpy.ops.object.mode_set(mode='OBJECT')
    for v in c.data.vertices: v.co.z += .035 * math.sin(v.co.x * 38)
    c.data.materials.append(curM); c.modifiers.new('sol', 'SOLIDIFY').thickness = .01; smooth(c, 0)
# night outside: sky gradient, moon, distant lit windows
skyM = bpy.data.materials.new('sky'); skyM.use_nodes = True; nt = skyM.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF']); em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(em.outputs[0], nt.nodes['Material Output'].inputs[0])
tc = nt.nodes.new('ShaderNodeTexCoord'); sx_ = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sx_.inputs[0]); rp = nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(sx_.outputs['Z'], rp.inputs['Fac'])
rp.color_ramp.elements[0].color = (.04, .06, .14, 1); rp.color_ramp.elements[1].color = (.01, .015, .05, 1); nt.links.new(rp.outputs['Color'], em.inputs['Color']); em.inputs['Strength'].default_value = 1.2
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 4.5, 2), rotation=(R(90), 0, 0)); sky = bpy.context.object; sky.scale = (14, 8, 1); sky.data.materials.append(skyM)
ball(.22, (.7, 4.3, 2.55), mat('moon', (1, 1, 1), emit=(.9, .93, 1), estr=6), name='moon')
cityM = mat('city', (0, 0, 0), emit=(1, .75, .45), estr=3); bldM = mat('bld', (.01, .012, .02), .9); rnd = random.Random(5)
for i in range(16):
    x = -4 + i * .55; h = rnd.uniform(.8, 2.0); rbox((.5, .3, h), (x, 4.0, h / 2), bldM, .0, 0)
    for k in range(int(h / .18)):
        if rnd.random() < .35: rbox((.06, .01, .07), (x + rnd.uniform(-.18, .18), 3.84, .15 + k * .18), cityM, 0, 0)
# sofa
fabM = mat('fabric', (.26, .27, .29), .95, bump=.25, bscale=500); SY = .62
rbox((2.6, .9, .26), (0, SY, .21), fabM, .04, 2); [rbox((.84, .8, .15), ((i - 1) * .86, SY - .04, .41), fabM, .06, 2) for i in range(3)]
[rbox((.84, .25, .52), ((i - 1) * .86, SY + .33, .72), fabM, .09, 2) for i in range(3)]; [rbox((.24, .9, .62), (s * 1.42, SY, .31), fabM, .08, 2) for s in (-1, 1)]
legM = mat('leg', (.1, .07, .05), .4)
for x in (-1.36, 1.36):
    for y in (SY - .38, SY + .38): rbox((.05, .05, .09), (x, y, .045), legM, .01, 0)
rbox((.42, .14, .38), (-.95, SY + .2, .66), mat('pil1', (.75, .55, .22), .95, bump=.2, bscale=300), .08, 2, rot=(R(-12), 0, R(8)))
rbox((.38, .14, .36), (.95, SY + .2, .66), mat('pil2', (.2, .38, .42), .95, bump=.2, bscale=300), .08, 2, rot=(R(-12), 0, R(-10)))
throw = rbox((.6, .55, .03), (1.0, SY - .05, .5), plaid('throw', (.55, .18, .14), (.85, .78, .6), (0, 0, 0), 8), .01, 1)
# coffee table, rug, plant, lamp, frames
woodM = mat('wood', (.42, .26, .14), .45, bump=.05, bscale=40)
bpy.ops.mesh.primitive_cylinder_add(radius=.48, depth=.05, location=(0, -.72, .4), vertices=64); tt = bpy.context.object; tt.data.materials.append(woodM); smooth(tt, 1); tt.modifiers.new('bev', 'BEVEL').width = .015
for a in range(3): rbox((.04, .04, .38), (math.cos(a * 2.1) * .3, -.72 + math.sin(a * 2.1) * .3, .19), woodM, .01, 1)
mugM = mat('mug', (.88, .86, .82), .3); bpy.ops.mesh.primitive_cylinder_add(radius=.045, depth=.1, location=(.22, -.65, .475)); bpy.context.object.data.materials.append(mugM); smooth(bpy.context.object, 1)
rugM = plaid('rug', (.62, .58, .5), (.48, .42, .36), (0, 0, 0), 3); bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -.55, .006)); rg = bpy.context.object; rg.scale = (3.0, 2.0, 1); rg.data.materials.append(rugM)
potM = mat('pot', (.7, .4, .28), .7); leafM = mat('leaf', (.13, .32, .12), .6, sss=.1)
bpy.ops.mesh.primitive_cylinder_add(radius=.17, depth=.32, location=(2.0, .9, .16)); bpy.context.object.data.materials.append(potM); smooth(bpy.context.object, 1)
rnd = random.Random(11)
for i in range(16): ball(.12, (2.0 + rnd.uniform(-.2, .2), .9 + rnd.uniform(-.2, .2), .5 + rnd.uniform(0, .6)), leafM, (1, .4, 1.6), seg=16).rotation_euler = (rnd.uniform(-.6, .6), rnd.uniform(-.6, .6), rnd.uniform(0, 3))
poleM = mat('pole', (.1, .08, .06), .35, .6); shadeM = mat('shade', (.95, .86, .7), .8, emit=(1, .7, .38), estr=0.)
bpy.ops.mesh.primitive_cylinder_add(radius=.015, depth=1.45, location=(-1.8, .72, .72)); bpy.context.object.data.materials.append(poleM)
bpy.ops.mesh.primitive_cylinder_add(radius=.17, depth=.04, location=(-1.8, .72, .02)); bpy.context.object.data.materials.append(poleM)
bpy.ops.mesh.primitive_cone_add(radius1=.25, radius2=.17, depth=.32, location=(-1.8, .72, 1.5), end_fill_type='NOTHING'); bpy.context.object.data.materials.append(shadeM); bpy.context.object.modifiers.new('sol', 'SOLIDIFY').thickness = .01
bpy.ops.object.light_add(type='POINT', location=(-1.8, .72, 1.45)); LAMP = bpy.context.object.data; LAMP.color = (1, .7, .4); LAMP.shadow_soft_size = .15
frM = mat('frame', (.12, .09, .07), .4); artM = mat('art', (.75, .55, .35), .7)
for x, w, h in ((-2.3, .5, .65), (2.4, .55, .42)): rbox((w, .03, h), (x, 1.33, 1.6), frM, .01, 0); rbox((w - .08, .01, h - .08), (x, 1.31, 1.6), artM, .002, 0)
# moving boxes + pizza (flashback only)
boxM = mat('box', (.62, .45, .28), .85, bump=.1, bscale=100); BOXES = []
for p, s, r in (((-2.1, -.1, .25), (.55, .45, .5), 20), ((-1.95, .45, .2), (.5, .4, .4), -10), ((-2.05, .15, .62), (.42, .36, .34), 35), ((1.75, -.5, .2), (.45, .4, .4), 15)): BOXES.append(rbox(s, p, boxM, .01, 0, rot=(0, 0, R(r))))
BOXES.append(rbox((.4, .4, .04), (.15, -.65, .45), mat('pizza', (.8, .72, .55), .8), .005, 0, rot=(0, 0, R(12))))
# lights
bpy.ops.object.light_add(type='AREA', location=(.2, 3.0, 2.2)); MOON = bpy.context.object; MOON.data.size = 2.0; MOON.data.color = (.55, .65, 1); MOON.rotation_euler = (R(-60), 0, R(180))
bpy.ops.object.light_add(type='AREA', location=(.9, -2.2, 2.3)); FILL = bpy.context.object; FILL.data.size = 2.2; FILL.data.color = (1, .82, .62); FILL.rotation_euler = (R(42), 0, R(20))

# ---------------- the couple + phones ----------------
HER = Toy('her', (.55, .33, .22), (.86, .8, .68), (.42, .42, .44), (.92, .9, .86), (.04, .025, .02), 'her')
HIM = Toy('him', (.72, .5, .38), (.04, .055, .11), (.38, .38, .4), (.32, .32, .34), (.05, .035, .025), 'him')
phoneM = mat('phone', (.02, .02, .025), .25, .5)
def make_phone(T):
    wr = T.j['wrR']; bpy.ops.mesh.primitive_cube_add(size=1); p = bpy.context.object; p.scale = (.075, .012, .15); bpy.ops.object.transform_apply(scale=True); p.data.materials.append(phoneM)
    bpy.ops.mesh.primitive_plane_add(size=1); s = bpy.context.object; s.scale = (.066, .14, 1); s.rotation_euler = (R(-90), 0, 0); s.location = (0, .0065, 0); s.parent = p
    sm = mat('scr_' + T.name, (0, 0, 0), .2, emit=(.7, .82, 1), estr=5); s.data.materials.append(sm)
    bpy.ops.object.light_add(type='AREA', location=(0, .06, 0)); L = bpy.context.object; L.data.size = .12; L.data.color = (.7, .8, 1); L.rotation_euler = (R(90), 0, 0); L.parent = p
    p.parent = wr; p.location = (0, -.05, -.07); p.rotation_euler = (R(60), 0, 0); return p, sm, L
HER.ph = make_phone(HER); HIM.ph = make_phone(HIM)
def phone(T, on=1., vis=True):
    p, sm, L = T.ph; p.hide_render = not vis
    for c in p.children: c.hide_render = not vis
    sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 6 * on; L.data.energy = 18 * on

# ---------------- camera + moods ----------------
bpy.ops.object.camera_add(); CAM = bpy.context.object; sc.camera = CAM; CAM.data.sensor_width = 36; CAM.data.dof.use_dof = True; CAM.data.dof.aperture_fstop = 2.0
AIM = bpy.data.objects.new('aim', None); col.objects.link(AIM); tcn = CAM.constraints.new('TRACK_TO'); tcn.target = AIM; tcn.up_axis = 'UP_Y'; tcn.track_axis = 'TRACK_NEGATIVE_Z'
def cam(p, look, lens=40, focus=None): CAM.location = p; AIM.location = look; CAM.data.lens = lens; CAM.data.dof.focus_distance = focus or (Vector(p) - Vector(look)).length
def mood(kind):
    warm = kind in ('flash', 'warm')
    LAMP.energy = 140 if warm else 0; shadeM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 4 if warm else 0
    FILL.data.energy = 120 if warm else 18; FILL.data.color = (1, .82, .62) if warm else (.55, .62, .9); MOON.data.energy = 25 if warm else 260; BGW.inputs['Strength'].default_value = .6 if warm else .5
    for b in BOXES: b.hide_render = kind != 'flash'

# ---------------- extra props: tears, the memory photo, table phones, a hand ----------------
tearM = mat('tear', (.75, .85, 1), .02); tearM.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = .9
TEARS = [ball(.012, (sx * .07, -.15, 1.45), tearM, (1, .7, 1.4), HER.j['head'], 16, name='tear') for sx in (-1, 1)]
def tears(on, t=0.):
    for i, o in enumerate(TEARS): o.hide_render = not on; o.location.z = - (t * .02 if on else 0) * (1 + i * .5)
memM = bpy.data.materials.new('memory'); memM.use_nodes = True; mn = memM.node_tree; mn.nodes.remove(mn.nodes['Principled BSDF']); MEM_EM = mn.nodes.new('ShaderNodeEmission'); MEM_TX = mn.nodes.new('ShaderNodeTexImage')
mn.links.new(MEM_TX.outputs['Color'], MEM_EM.inputs['Color']); mn.links.new(MEM_EM.outputs[0], mn.nodes['Material Output'].inputs[0]); MEM_EM.inputs['Strength'].default_value = 1.6
def show_memory(on):
    s_ = [c for c in HIM.ph[0].children if c.type == 'MESH'][0]
    if on:
        if MEM_TX.image is None:
            src = f'{HERE}/out/frames/s1_060.jpg' if os.path.exists(f'{HERE}/out/frames/s1_060.jpg') else f'{HERE}/review/s1_060.jpg'
            MEM_TX.image = bpy.data.images.load(src)
        s_.data.materials[0] = memM
    else: s_.data.materials[0] = HIM.ph[1]
TPH = []
for x, r in ((-.14, .25), (.13, -.35)):
    o = rbox((.075, .15, .012), (x, -.7, .432), phoneM, .004, 1, rot=(0, 0, r)); TPH.append(o)
def table_phones(on):
    for o in TPH: o.hide_render = not on
# a lone hand + forearm for the face-down insert (his skin, his sleeve)
HAND = joint('handrig', (0, 0, 0)); tube(.045, .26, (0, .13, 0), HIM.S, HAND, .04, name='h_farm'); HAND.children[0].rotation_euler = (R(90), 0, 0)
ball(.045, (0, -.04, .008), HIM.S, (.8, 1.25, .38), HAND, name='h_hand')
HPH = rbox((.075, .15, .012), (0, -.05, -.02), phoneM, .004, 1, HAND, name='h_phone')
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -.05, -.013)); HPS = bpy.context.object; HPS.scale = (.066, .14, 1); HPS.data.materials.append(HIM.ph[1]); HPS.parent = HAND; HPS.matrix_parent_inverse = HAND.matrix_world.inverted()
bpy.ops.object.light_add(type='AREA', location=(0, -.05, .06)); HPL = bpy.context.object; HPL.data.size = .12; HPL.data.color = (.7, .8, 1); HPL.parent = HAND; HPL.matrix_parent_inverse = HAND.matrix_world.inverted()
def hand_rig(vis):
    for o in [HAND] + list(HAND.children_recursive): o.hide_render = not vis

# ---------------- shots (t in seconds within a 5 s shot) ----------------
SHOW = {**SIT, 'spine': (R(4), 0, R(-22)), 'neck': (0, 0, R(-10)), 'head': (R(-4), 0, R(-28)), 'shR': (R(-75), 0, R(-35)), 'elR': (R(-25), 0, 0), 'shL': (R(-26), 0, R(6)), 'elL': (R(-80), 0, 0), 'smile': 1., 'sad': 0.}
SADPH = {**PHONE, 'head': (R(30), 0, 0), 'neck': (R(18), 0, 0), 'smile': -.6, 'sad': .9}
REST = {**SIT, 'smile': .2}
def headcam(T): bpy.context.view_layer.update(); return T.j['head'].matrix_world.translation.copy()
def shot(n, t):
    k = t / 5.; tears(False); show_memory(False); table_phones(False); hand_rig(False)
    HIM.ph[0].rotation_euler = (R(60), 0, 0)
    if n == 1:
        mood('flash'); phone(HER, 0, False); phone(HIM, 0, False); bob = abs(math.sin(t * 7)) * .06
        HER.pose({**SIT, 'spine': (R(-6) - bob, 0, R(-8)), 'head': (R(-8) - bob, 0, R(-22)), 'smile': 1., 'blink': 1. if (t % 2.2) < .12 else 0.}, (.3, SY - .02, 0), R(-20))
        HIM.pose({**SIT, 'spine': (R(-4) - bob * .5, 0, R(6)), 'head': (R(-6), 0, R(22)), 'smile': 1.}, (-.32, SY - .02, 0), R(22))
        cam(V3((.1, -2.7, 1.1), (.05, -2.35, 1.05), k), (0, .45, .95), 42)
    elif n == 2:
        mood('night'); phone(HER); phone(HIM)
        HER.pose({**PHONE}, (1.0, SY - .02, 0)); HIM.pose({**PHONE}, (-1.0, SY - .02, 0))
        cam(V3((0, -3.1, 1.05), (0, -3.6, 1.12), k), (0, .45, .8), 32)
    elif n == 3:
        mood('night'); phone(HER); phone(HIM); up = ss(seg(t, .3, 1.1)); down = ss(seg(t, 2.8, 4.0))
        pz = mixp(mixp(PHONE, SHOW, up), SADPH, down); HER.pose(pz, (.55, SY - .02, 0)); HIM.pose({**PHONE, 'smile': .7}, (-.55, SY - .02, 0))
        cam(V3((.75, -1.75, 1.15), (.65, -1.55, 1.12), k), (.25, .45, 1.0), 40, 2.0)
    elif n == 4:
        mood('night'); phone(HER); phone(HIM); show_memory(True)
        HIM.ph[0].rotation_euler = (R(60), 0, R(180))
        HER.pose({**PHONE}, (1.0, SY - .02, 0)); HIM.pose({**PHONE, 'smile': -.2, 'sad': .5}, (-1.0, SY - .02, 0))
        bpy.context.view_layer.update(); ph = HIM.ph[0].matrix_world.translation.copy(); hd = headcam(HIM)
        c = hd + Vector((-.3, .24, .22)); c = c.lerp(ph, .2 * k); cam(tuple(c), tuple(ph), 40, (c - ph).length)
    elif n == 5:
        mood('night'); phone(HER); phone(HIM, .5); look = ss(seg(t, .8, 2.2))
        HER.pose({**SADPH, 'hpL': (R(-120), 0, R(-6)), 'hpR': (R(-120), 0, R(6)), 'knL': (R(140), 0, 0), 'knR': (R(140), 0, 0)}, (1.05, SY - .02, 0))
        HIM.pose(mixp({**PHONE}, {**PHONE, 'spine': (R(4), 0, R(10)), 'neck': (0, 0, R(15)), 'head': (R(2), 0, R(45)), 'sad': .8, 'smile': -.3}, look), (-1.0, SY - .02, 0))
        hd = headcam(HIM); c = hd + Vector((-.3, .32, .12)); tgt = Vector((1.05, SY - .1, 1.0)); c = c.lerp(tgt, .08 * k)
        cam(tuple(c), tuple(tgt), lerp(50, 62, k), (c - tgt).length)
    elif n == 6:
        mood('night'); phone(HER); phone(HIM, 0, False); hand_rig(True); flip = ss(seg(t, .6, 2.2)); lift = ss(seg(t, 3.2, 4.4)); on = 1 - ss(seg(t, 2.0, 2.6))
        HER.pose({**SADPH}, (1.05, SY - .02, 0)); HIM.pose({**SIT, 'spine': (R(30), 0, 0)}, (-.6, SY - .02, 0))
        HAND.location = (-.12, -.62 + .25 * lift, lerp(.62, .455, flip) + .3 * lift); HAND.rotation_euler = (R(-15 + 15 * flip), R(180 * flip), R(-65))
        HIM.ph[1].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 6 * on; HPL.data.energy = 18 * on * (1 - flip) + 2 * on
        HPH.hide_render = lift > .5; HPS.hide_render = lift > .5
        if lift > .5: table_phones(True); TPH[1].hide_render = True
        cam(V3((.35, -1.35, .78), (.32, -1.3, .74), k), (-.12, -.66, .45), 55)
    elif n == 7:
        mood('night'); mv = ss(seg(t, 0, 1.2)); low = ss(seg(t, 1.1, 2.3)); turn = ss(seg(t, 2.0, 2.8)); phone(HER, 1 - low * .9); phone(HIM, 0, False)
        HIM.pose(mixp({**SIT, 'head': (R(5), 0, R(30)), 'sad': .4, 'smile': -.1}, {**SIT, 'spine': (R(10), 0, R(15)), 'head': (R(8), 0, R(35)), 'shL': (R(-60), 0, R(30)), 'elL': (R(-40), 0, R(15)), 'sad': .5, 'smile': .2}, low), (lerp(.0, .55, mv), SY - .02, 0), R(10))
        HER.pose(mixp(mixp({**SADPH}, {**SADPH, 'shR': (R(-15), 0, R(-6)), 'elR': (R(-70), 0, R(20)), 'shL': (R(-15), 0, R(6)), 'elL': (R(-70), 0, R(-20))}, low), {**SIT, 'head': (R(-6), 0, R(-40)), 'neck': (0, 0, R(-10)), 'sad': 1., 'smile': -.5, 'shR': (R(-15), 0, R(-6)), 'elR': (R(-70), 0, R(20))}, turn), (1.05, SY - .02, 0), R(-10))
        tears(turn > .5, t - 2.8)
        cam(V3((1.25, -1.15, 1.25), (1.15, -1.0, 1.22), k), (.85, .4, 1.15), 48, 1.65)
    elif n == 8:
        mood('warm'); phone(HER, 0, False); phone(HIM, 0, False); bob = abs(math.sin(t * 6)) * .06
        HER.pose({**SIT, 'spine': (R(-8) - bob, 0, R(-10)), 'head': (R(-12) - bob, 0, R(-25)), 'shR': (R(-95), 0, R(-25)), 'elR': (R(-115), 0, R(30)), 'smile': 1., 'sad': .2, 'blink': 1.}, (.34, SY - .02, 0), R(-25))
        HIM.pose({**SIT, 'spine': (R(-4) - bob * .5, 0, R(10)), 'head': (R(-4), 0, R(25)), 'shL': (R(-10), 0, R(75)), 'elL': (R(-20), 0, R(70)), 'smile': 1.}, (-.24, SY - .02, 0), R(25))
        tears(True, 0)
        cam(V3((.1, -2.25, 1.08), (.05, -2.0, 1.05), k), (.05, .45, .98), 44)
    elif n == 9:
        mood('warm'); phone(HER, 0, False); phone(HIM, 0, False); table_phones(True)
        HER.pose({**SIT, 'spine': (R(-4), 0, R(-12)), 'neck': (0, R(-14), 0), 'head': (R(2), R(-18), R(-15)), 'smile': .8, 'blink': 1.}, (.22, SY - .02, 0), R(-15))
        HIM.pose({**SIT, 'spine': (R(-4), 0, R(8)), 'head': (R(6), 0, R(18)), 'shL': (R(-10), 0, R(75)), 'elL': (R(-20), 0, R(70)), 'smile': .7}, (-.3, SY - .02, 0), R(15))
        c = V3((.25, -1.55, .7), (.32, -2.05, .82), k); f = lerp(.85, 2.35, ss(seg(t, 1.0, 3.5)))
        cam(c, (0, -.3, .62), 40, f)
    elif n == 99:
        mood('night'); phone(HER); phone(HIM); HER.pose({**PHONE}, (1.0, SY - .02, 0)); HIM.pose({**PHONE}, (-1.0, SY - .02, 0)); cam((1.0, -.9, 1.2), (1.0, .5, .95), 40)
DEFAULT_PHONE = None
def render_frame(n, f, path): shot(n, f / FPS); sc.render.filepath = path; bpy.ops.render.render(write_still=True)
if A.still:
    n, f = map(int, A.still.split(':')); os.makedirs(A.out, exist_ok=True); render_frame(n, f, f'{A.out}/s{n}_{f:03d}.jpg')
else:
    a, b = map(int, A.frames.split(':')); os.makedirs(A.out, exist_ok=True)
    for f in range(a, b):
        p = f'{A.out}/s{A.shot}_{f:03d}.jpg'
        if not os.path.exists(p): render_frame(A.shot, f, p)
