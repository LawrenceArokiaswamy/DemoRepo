# "Same Room" — 3D version (free): the couple are the Higgsfield character designs turned into rigged 3D models (films/29-characters), set in a room modelled in code.
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

# ---------------- the couple: rigged 3D models from films/29-characters ----------------
from mathutils import Matrix, Quaternion
CH = '/home/user/DemoRepo/films/29-characters/models'
def load_char(name):
    with bpy.data.libraries.load(f'{CH}/{name}.blend', link=False) as (src, dst): dst.objects = [n for n in src.objects]
    rig = mesh = None
    for o in dst.objects:
        if o is None: continue
        col.objects.link(o)
        if o.type == 'ARMATURE': rig = o
        elif o.type == 'MESH': mesh = o
    rig.rotation_mode = 'XYZ'; mesh.rotation_mode = 'XYZ'; return rig, mesh
class Char:
    def __init__(self, name):
        self.rig, self.mesh = load_char(name); self.name = name
        self.H = max(v.co.z for v in self.mesh.data.vertices)
        self.mesh.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .6
    def pose(self, targets, loc=(0, 0, 0), rz=0., sit=True):
        rig = self.rig; pb = rig.pose.bones; M = {}
        for b in rig.data.bones:
            base = (M[b.parent.name] @ (b.parent.matrix_local.inverted() @ b.matrix_local)) if b.parent else b.matrix_local.copy()
            if b.name in targets:
                cur = (base.to_3x3() @ Vector((0, 1, 0))).normalized(); q = cur.rotation_difference(Vector(targets[b.name]).normalized())
                Mb = Matrix.Translation(base.translation) @ (q.to_matrix() @ base.to_3x3()).to_4x4(); pb[b.name].matrix_basis = base.inverted() @ Mb
            else: pb[b.name].matrix_basis = Matrix.Identity(4); Mb = base
            M[b.name] = Mb
        rig.location = (loc[0], loc[1], loc[2] - ((.52 * self.H - .5) if sit else 0)); rig.rotation_euler = (0, 0, rz)
    def bone_world(self, name, tail=True):
        bpy.context.view_layer.update(); pb = self.rig.pose.bones[name]; m = self.rig.matrix_world
        return m @ (pb.tail if tail else pb.head), (m.to_3x3() @ (pb.tail - pb.head)).normalized()
def mir(d): return {k.replace('.L', '.X').replace('.R', '.L').replace('.X', '.R'): (-v[0], v[1], v[2]) for k, v in d.items()}
def both(d): o = dict(d); o.update(mir({k: v for k, v in d.items() if k.endswith('.R')})); return o
def blendp(a, b, k): return {n: V3(a.get(n, b.get(n)), b.get(n, a.get(n)), k) for n in set(a) | set(b)}
SITL = both({'thigh.R': (-.12, -1, -.04), 'shin.R': (-.02, -.1, -1), 'foot.R': (0, -1, -.35)})
REST = {**SITL, **both({'upperarm.R': (-.14, -.18, -1), 'forearm.R': (.22, -1, -.12), 'hand.R': (.1, -1, -.3)}), 'spine': (0, .02, 1), 'chest': (0, -.05, 1), 'neck': (0, -.12, 1), 'head': (0, -.18, 1)}
PHONE = {**SITL, **both({'upperarm.R': (-.15, -.3, -1), 'forearm.R': (.45, -1, .32), 'hand.R': (.3, -1, .3)}), 'spine': (0, -.05, 1), 'chest': (0, -.2, 1), 'neck': (0, -.45, 1), 'head': (0, -1.0, 1)}
def look(base, dx=0., down=.2, tilt=0.): o = dict(base); o['neck'] = (dx * .4, -.15 - down * .4, 1); o['head'] = (dx + tilt, -.2 - down, 1); return o
HER = Char('her'); HIM = Char('him')
# phones: screen faces local +Z; they follow the right hand each frame and turn their screen to the head
phoneM = mat('phone', (.02, .02, .025), .25, .5)
def make_phone(T):
    bpy.ops.mesh.primitive_cube_add(size=1); p = bpy.context.object; p.scale = (.075, .15, .012); bpy.ops.object.transform_apply(scale=True); p.data.materials.append(phoneM); p.rotation_mode = 'QUATERNION'
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, .0065)); s = bpy.context.object; s.scale = (.066, .14, 1); s.parent = p
    sm = mat('scr_' + T.name, (0, 0, 0), .2, emit=(.7, .82, 1), estr=6); s.data.materials.append(sm)
    bpy.ops.object.light_add(type='AREA', location=(0, 0, .05)); L = bpy.context.object; L.data.size = .12; L.data.color = (.7, .8, 1); L.rotation_euler = (math.pi, 0, 0); L.parent = p
    return p, s, sm, L
HER.ph = make_phone(HER); HIM.ph = make_phone(HIM)
def hold(T, on=1., vis=True, mem=False):
    p, s, sm, L = T.ph
    for o in (p, s, L): o.hide_render = not vis
    sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 6 * on; L.data.energy = 14 * on
    if not vis: return
    tip, d = T.bone_world('hand.R'); hd, _ = T.bone_world('head', False); eye = hd + Vector((0, -.08, .12))
    pos = tip - d * .03; p.location = pos; z = (eye - pos).normalized(); p.rotation_quaternion = z.to_track_quat('Z', 'Y')
    s.data.materials[0] = memM if mem else sm
memM = bpy.data.materials.new('memory'); memM.use_nodes = True; mn = memM.node_tree; mn.nodes.remove(mn.nodes['Principled BSDF']); MEM_EM = mn.nodes.new('ShaderNodeEmission'); MEM_TX = mn.nodes.new('ShaderNodeTexImage')
mn.links.new(MEM_TX.outputs['Color'], MEM_EM.inputs['Color']); mn.links.new(MEM_EM.outputs[0], mn.nodes['Material Output'].inputs[0]); MEM_EM.inputs['Strength'].default_value = 1.6
tearM = mat('tear', (.75, .85, 1), .02); tearM.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = .9
TEARS = []
for sx in (-1, 1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.011, segments=16, ring_count=8); o = bpy.context.object; o.scale = (1, .7, 1.5); o.data.materials.append(tearM); TEARS.append((o, sx))
def tears(T, on, t=0.):
    hd, _ = T.bone_world('head', False); r = T.rig.rotation_euler.z
    for o, sx in TEARS:
        o.hide_render = not on
        if on: off = Vector((sx * .055, -.13, .1 - min(.05, t * .025))); off.rotate(Euler((0, 0, r))); o.location = hd + off
TPH = []
for x, r in ((-.14, .25), (.13, -.35)): TPH.append(rbox((.075, .15, .012), (x, -.7, .432), phoneM, .004, 1, rot=(0, 0, R(r))))
def table_phones(on):
    for o in TPH: o.hide_render = not on
# ---------------- camera + moods ----------------
bpy.ops.object.camera_add(); CAM = bpy.context.object; sc.camera = CAM; CAM.data.sensor_width = 36; CAM.data.dof.use_dof = True; CAM.data.dof.aperture_fstop = 2.0
AIM = bpy.data.objects.new('aim', None); col.objects.link(AIM); tcn = CAM.constraints.new('TRACK_TO'); tcn.target = AIM; tcn.up_axis = 'UP_Y'; tcn.track_axis = 'TRACK_NEGATIVE_Z'
def cam(p, look, lens=40, focus=None): CAM.location = p; AIM.location = look; CAM.data.lens = lens; CAM.data.dof.focus_distance = focus or (Vector(p) - Vector(look)).length
def mood(kind):
    warm = kind in ('flash', 'warm')
    LAMP.energy = 140 if warm else 0; shadeM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 4 if warm else 0
    FILL.data.energy = 120 if warm else 18; FILL.data.color = (1, .82, .62) if warm else (.55, .62, .9); MOON.data.energy = 25 if warm else 260; BGW.inputs['Strength'].default_value = .6 if warm else .5
    for b in BOXES: b.hide_render = kind != 'flash'

# ---------------- shots (t in seconds within a 5 s shot; she sits on the right (+X), he on the left) ----------------
SHOW = {**SITL, **both({'upperarm.R': (-.14, -.18, -1), 'forearm.R': (.22, -1, -.12), 'hand.R': (.1, -1, -.3)}), 'upperarm.R': (-.55, -.75, -.35), 'forearm.R': (-.55, -.8, .15), 'hand.R': (-.5, -.85, .1),
        'spine': (-.05, 0, 1), 'chest': (-.22, -.05, 1), 'neck': (-.35, -.1, 1), 'head': (-.75, -.25, 1)}
SAD = look(PHONE, 0, 1.25)
def shot(n, t):
    k = t / 5.; tears(HER, False); table_phones(False)
    if n == 1:   # flashback: close together, laughing
        mood('flash'); bob = abs(math.sin(t * 7)) * .12
        HER.pose(look({**REST, 'spine': (0, .05 + bob * .2, 1)}, -.7, -.05 - bob * .3), (.32, SY - .02, 0), R(-22)); HIM.pose(look({**REST, 'spine': (0, .04 + bob * .15, 1)}, .65, 0), (-.3, SY - .02, 0), R(22))
        hold(HER, 0, False); hold(HIM, 0, False); cam(V3((.1, -2.7, 1.1), (.05, -2.35, 1.05), k), (0, .45, .95), 42)
    elif n == 2:  # years later: opposite ends, both on phones
        mood('night'); HER.pose(PHONE, (1.0, SY - .02, 0)); HIM.pose(PHONE, (-1.0, SY - .02, 0)); hold(HER); hold(HIM)
        cam(V3((0, -3.1, 1.05), (0, -3.6, 1.12), k), (0, .45, .8), 32)
    elif n == 3:  # she turns to show him; he never looks; she gives up
        mood('night'); up = ss(seg(t, .3, 1.1)); down = ss(seg(t, 2.8, 4.0))
        HER.pose(blendp(blendp(PHONE, SHOW, up), SAD, down), (.55, SY - .02, 0)); HIM.pose(PHONE, (-.55, SY - .02, 0)); hold(HER); hold(HIM)
        cam(V3((.75, -1.75, 1.15), (.65, -1.55, 1.12), k), (.25, .45, 1.0), 40, 2.0)
    elif n == 4:  # over his shoulder: the memory on his phone
        mood('night'); HER.pose(PHONE, (1.0, SY - .02, 0)); HIM.pose(PHONE, (-1.0, SY - .02, 0)); hold(HER); hold(HIM, mem=True)
        if MEM_TX.image is None:
            src = f'{HERE}/out/frames/s1_060.jpg' if os.path.exists(f'{HERE}/out/frames/s1_060.jpg') else f'{HERE}/review/s1_060.jpg'
            if os.path.exists(src): MEM_TX.image = bpy.data.images.load(src)
        ph = HIM.ph[0].location.copy(); hd, _ = HIM.bone_world('head', False); c = hd + Vector((-.28, .26, .2)); c = c.lerp(ph, .2 * k); cam(tuple(c), tuple(ph), 40, (c - ph).length)
    elif n == 5:  # his point of view: she is alone at the far end, knees up
        mood('night'); lk = ss(seg(t, .8, 2.2))
        HER.pose({**SAD, **both({'thigh.R': (-.1, -.75, .55), 'shin.R': (-.02, .2, -1)})}, (1.05, SY - .02, 0)); hold(HER)
        HIM.pose(blendp(PHONE, look({**PHONE, 'chest': (.15, -.1, 1)}, .9, .1), lk), (-1.0, SY - .02, 0)); hold(HIM, .5)
        hd, _ = HIM.bone_world('head', False); c = hd + Vector((-.3, .32, .12)); tgt = Vector((1.05, SY - .1, .95)); c = c.lerp(tgt, .08 * k); cam(tuple(c), tuple(tgt), lerp(50, 62, k), (c - tgt).length)
    elif n == 6:  # he lowers his phone to his lap; the glow leaves his face
        mood('night'); low = ss(seg(t, .6, 2.4)); lk = ss(seg(t, 2.8, 4.0))
        HER.pose(SAD, (1.05, SY - .02, 0)); hold(HER)
        HIM.pose(blendp(blendp(PHONE, look(REST, 0, .6), low), look(REST, .55, .25), lk), (-.5, SY - .02, 0)); hold(HIM, 1 - ss(seg(t, 1.6, 2.4)), low < .85)
        cam(V3((-.2, -1.25, 1.2), (-.25, -1.12, 1.18), k), (-.5, .45, 1.05), 45, 1.75)
    elif n == 7:  # he moves next to her and lowers her phone; she looks at him, tears
        mood('night'); mv = ss(seg(t, 0, 1.2)); low = ss(seg(t, 1.1, 2.3)); turn = ss(seg(t, 2.0, 2.8))
        reachL = {'upperarm.L': (.55, -.75, -.4), 'forearm.L': (.55, -.8, -.05), 'hand.L': (.5, -.85, -.1)}
        HIM.pose(blendp(look(REST, .5, .2), {**look(REST, .55, .3), **reachL}, low), (lerp(-.1, .45, mv), SY - .02, 0), R(12)); hold(HIM, 0, False)
        HER.pose(blendp(blendp(SAD, look(REST, 0, .9), low), look(REST, -.8, .05), turn), (1.05, SY - .02, 0), R(-12)); hold(HER, 1 - low, low < .7)
        tears(HER, turn > .5, t - 2.8); cam(V3((.95, -1.55, 1.2), (.9, -1.4, 1.18), k), (.78, .45, 1.08), 40, 1.85)
    elif n == 8:  # lamp on: together again, laughing; his arm around her
        mood('warm'); bob = abs(math.sin(t * 6)) * .12
        hug = {'upperarm.L': (.9, .2, .3), 'forearm.L': (.25, .95, -.2), 'hand.L': (-.1, .6, -.8)}
        HER.pose(look({**REST, 'spine': (0, .05 + bob * .2, 1), 'upperarm.R': (-.15, -.55, -.85), 'forearm.R': (.35, -.55, .75), 'hand.R': (.3, -.3, .9)}, -.5, -.1 - bob * .3, -.2), (.3, SY - .02, 0), R(-20))
        HIM.pose(look({**REST, **hug, 'spine': (0, .04 + bob * .15, 1)}, .55, 0), (-.22, SY - .02, 0), R(20)); hold(HER, 0, False); hold(HIM, 0, False)
        tears(HER, True, 0); cam(V3((.1, -2.25, 1.08), (.05, -2.0, 1.05), k), (.05, .45, .98), 44)
    elif n == 9:  # the two phones face-down in front; the couple close in warm light
        mood('warm'); table_phones(True)
        HER.pose(look({**REST, 'chest': (-.15, 0, 1)}, -.55, .1, -.35), (.2, SY - .02, 0), R(-15)); HIM.pose(look({**REST, 'upperarm.L': (.9, .2, .3), 'forearm.L': (.25, .95, -.2)}, .3, .0), (-.28, SY - .02, 0), R(15))
        hold(HER, 0, False); hold(HIM, 0, False)
        c = V3((.25, -1.55, .7), (.32, -2.05, .82), k); f = lerp(.85, 2.35, ss(seg(t, 1.0, 3.5))); cam(c, (0, -.3, .62), 40, f)

def render_frame(n, f, path): shot(n, f / FPS); sc.render.filepath = path; bpy.ops.render.render(write_still=True)
if A.still:
    for st in A.still.split(','):
        n, f = map(int, st.split(':')); os.makedirs(A.out, exist_ok=True); render_frame(n, f, f'{A.out}/s{n}_{f:03d}.jpg')
else:
    a, b = map(int, A.frames.split(':')); os.makedirs(A.out, exist_ok=True)
    for f in range(a, b):
        p = f'{A.out}/s{A.shot}_{f:03d}.jpg'
        if not os.path.exists(p): render_frame(A.shot, f, p)
