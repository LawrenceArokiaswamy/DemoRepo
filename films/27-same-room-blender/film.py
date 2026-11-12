# "Same Room" — free Blender version (Cycles CPU). MPFB2 humans (CC0 MakeHuman assets), Poly Haven CC0 models and HDRIs.
# Usage:  python film.py --shot 2 --frames 0:120 [--res 540x960] [--samples 16] [--out out/frames]   (24 fps, 5 s per shot)
#         python film.py --still 2:60 --out review/       (one test frame)
import bpy, sys, os, math, argparse
from mathutils import Vector, Matrix, Quaternion
sys.path.insert(0, '/root/bfilm')
HERE = os.path.dirname(os.path.abspath(__file__)); ASSET = '/root/blender_assets'
FPS, SHOT_F = 24, 120
ap = argparse.ArgumentParser(); ap.add_argument('--shot', type=int, default=2); ap.add_argument('--frames', default='0:1'); ap.add_argument('--still', default='')
ap.add_argument('--res', default='540x960'); ap.add_argument('--samples', type=int, default=16); ap.add_argument('--out', default=f'{HERE}/out/frames')
A = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
clamp = lambda x, a=0., b=1.: max(a, min(b, x)); lerp = lambda a, b, k: a + (b - a) * k
seg = lambda t, a, b: clamp((t - a) / (b - a)); ss = lambda x: (lambda y: y * y * (3 - 2 * y))(clamp(x)); eio = lambda x: (lambda y: 4 * y ** 3 if y < .5 else 1 - (-2 * y + 2) ** 3 / 2)(clamp(x))
V3 = lambda a, b, k: tuple(lerp(a[i], b[i], k) for i in range(3))

# ---------------- setup ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
import addon_utils; addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
from human import make_human
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = A.samples; sc.cycles.use_denoising = True
sc.cycles.use_adaptive_sampling = True; sc.cycles.max_bounces = 6; sc.cycles.transparent_max_bounces = 16; sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
rw, rh = map(int, A.res.split('x')); sc.render.resolution_x, sc.render.resolution_y = rw, rh; sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 94
col = sc.collection

def mat(name, color, rough=.6, metal=0., emit=None, estr=0., sss=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if sss: b.inputs['Subsurface Weight'].default_value = sss
    return m
def box(name, size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size; o.data.materials.append(m); return o
def model(n, loc, rz=0., s=1.):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f'{ASSET}/models/{n}/{n}.gltf'); new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(n + '_root', None); col.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, rz); root.scale = (s, s, s); return root

# ---------------- world + room ----------------
W = bpy.data.worlds.new('w'); sc.world = W; W.use_nodes = True; wn = W.node_tree
ENV = wn.nodes.new('ShaderNodeTexEnvironment'); ENV.image = bpy.data.images.load(f'{ASSET}/hdri/rogland_moonlit_night_2k.hdr')
LP = wn.nodes.new('ShaderNodeLightPath'); BG2 = wn.nodes.new('ShaderNodeBackground'); MIXW = wn.nodes.new('ShaderNodeMixShader')
MAP = wn.nodes.new('ShaderNodeMapping'); TC = wn.nodes.new('ShaderNodeTexCoord'); wn.links.new(TC.outputs['Generated'], MAP.inputs['Vector']); wn.links.new(MAP.outputs['Vector'], ENV.inputs['Vector'])
BG = wn.nodes['Background']; wn.links.new(ENV.outputs['Color'], BG.inputs['Color']); wn.links.new(ENV.outputs['Color'], BG2.inputs['Color']); MAP.inputs['Rotation'].default_value[2] = math.radians(200)
wn.links.new(LP.outputs['Is Camera Ray'], MIXW.inputs['Fac']); wn.links.new(BG.outputs['Background'], MIXW.inputs[1]); wn.links.new(BG2.outputs['Background'], MIXW.inputs[2]); wn.links.new(MIXW.outputs[0], wn.nodes['World Output'].inputs['Surface']); BG2.inputs['Strength'].default_value = .35

floorM = bpy.data.materials.new('floor'); floorM.use_nodes = True; nt = floorM.node_tree; b = nt.nodes['Principled BSDF']
wave = nt.nodes.new('ShaderNodeTexWave'); wave.inputs['Scale'].default_value = 3; wave.inputs['Distortion'].default_value = 6; wave.inputs['Detail'].default_value = 3
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (.16, .09, .05, 1); ramp.color_ramp.elements[1].color = (.34, .2, .11, 1)
nt.links.new(wave.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .35
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0)); bpy.context.object.data.materials.append(floorM)
wallM = mat('wall', (.62, .58, .54), .9); trimM = mat('trim', (.85, .84, .8), .5)
box('wallL', (2.0, .12, 2.8), (-2.25, 1.35, 1.4), wallM); box('wallR', (2.0, .12, 2.8), (2.25, 1.35, 1.4), wallM)
box('wallT', (2.5, .12, .55), (0, 1.35, 2.525), wallM); box('wallB', (2.5, .12, .75), (0, 1.35, .375), wallM)
for x in (-1.25, 1.25): box('mul', (.05, .14, 1.5), (x, 1.35, 1.5), trimM)
box('sill', (2.6, .25, .05), (0, 1.3, .75), trimM); box('mid', (.04, .14, 1.5), (0, 1.35, 1.5), trimM); box('top', (2.6, .14, .05), (0, 1.35, 2.25), trimM)
box('wallSide', (.12, 6, 2.8), (-3.2, -1.5, 1.4), wallM); box('wallSide2', (.12, 6, 2.8), (3.2, -1.5, 1.4), wallM); box('ceil', (6.6, 6, .1), (0, -1.5, 2.85), wallM)
rugM = mat('rug', (.42, .4, .38), .95); bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -.6, .005)); rug = bpy.context.object; rug.scale = (2.6, 1.9, 1); rug.data.materials.append(rugM)
fabM = bpy.data.materials.new('fabric'); fabM.use_nodes = True; fn = fabM.node_tree; fb = fn.nodes['Principled BSDF']; fb.inputs['Base Color'].default_value = (.2, .2, .21, 1); fb.inputs['Roughness'].default_value = .95
nz = fn.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 400; bm = fn.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = .25; fn.links.new(nz.outputs['Fac'], bm.inputs['Height']); fn.links.new(bm.outputs['Normal'], fb.inputs['Normal'])
def rbox(name, size, loc, m, bev=.04):
    o = box(name, size, loc, m); md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 4; md.limit_method = 'NONE'; o.modifiers.new('sub', 'SUBSURF').levels = 1
    bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_smooth(); return o
SX, SY = 0, .6
rbox('sofa_base', (2.5, .9, .28), (SX, SY, .2), fabM, .03); [rbox(f'seat{i}', (.81, .78, .16), (SX + (i - 1) * .83, SY - .04, .42), fabM, .06) for i in range(3)]
[rbox(f'back{i}', (.81, .24, .5), (SX + (i - 1) * .83, SY + .33, .72), fabM, .08) for i in range(3)]; [rbox(f'arm{s}', (.22, .9, .62), (SX + s * 1.36, SY, .31), fabM, .07) for s in (-1, 1)]
legM = mat('leg', (.08, .06, .05), .4)
for x in (-1.3, 1.3):
    for y in (SY - .38, SY + .38): box('leg', (.05, .05, .08), (x, y, .04), legM)
bpy.ops.mesh.primitive_plane_add(size=1, location=(.9, SY - .05, .5)); thr = bpy.context.object; thr.scale = (.5, .7, 1); thr.data.materials.append(mat('throw', (.55, .5, .44), .95)); thr.modifiers.new('sol', 'SOLIDIFY').thickness = .02
model('coffee_table_round_01', (0, -.75, 0), 0, .75)
model('potted_plant_02', (1.95, .75, 0), 0, 1.25)
PIL = model('throw_pillows_01', (0, .62, .5), 0, .9)
for o in PIL.children_recursive:
    if o.type == 'MESH': recolor_m = [setattr(o, 'active_material', mat('pillow', (.34, .3, .26), .95))]
model('ceramic_vase_01', (.22, -.68, .37), 0, .8)
BOXES = [model('cardboard_box_01', p, r, s) for p, r, s in [((-1.9, -.2, 0), .4, 1.2), ((-1.75, .3, 0), -.2, 1.0), ((-1.8, -.05, .4), .9, .9), ((1.6, -.4, 0), .3, 1.1)]]
# floor lamp (custom): pole + shade + light
poleM = mat('pole', (.08, .07, .06), .4, .6); shadeM = mat('shade', (.95, .85, .7), .8, emit=(1, .72, .4), estr=0.)
bpy.ops.mesh.primitive_cylinder_add(radius=.015, depth=1.5, location=(-1.65, .6, .75)); bpy.context.object.data.materials.append(poleM)
bpy.ops.mesh.primitive_cylinder_add(radius=.16, depth=.05, location=(-1.65, .6, .025)); bpy.context.object.data.materials.append(poleM)
bpy.ops.mesh.primitive_cone_add(radius1=.24, radius2=.16, depth=.32, location=(-1.65, .6, 1.55), end_fill_type='NOTHING'); shade = bpy.context.object; shade.data.materials.append(shadeM)
bpy.ops.object.light_add(type='POINT', location=(-1.65, .6, 1.5)); LAMP = bpy.context.object.data; LAMP.color = (1, .72, .42); LAMP.shadow_soft_size = .12
bpy.ops.object.light_add(type='AREA', location=(-.8, -1.6, 2.4)); FILL = bpy.context.object; FILL.data.size = 1.5; FILL.data.color = (1, .8, .6); FILL.rotation_euler = (math.radians(35), 0, math.radians(-25))
bpy.ops.object.light_add(type='SUN', location=(0, 3, 4)); MOON = bpy.context.object; MOON.data.color = (.62, .72, 1); MOON.data.angle = math.radians(3); MOON.rotation_euler = (math.radians(-40), 0, math.radians(185))

# ---------------- the couple ----------------
def recolor(obj, color, rough=.85):
    for s in obj.material_slots:
        m = s.material
        if not m or not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                for l in list(n.inputs['Base Color'].links): m.node_tree.links.remove(l)
                n.inputs['Base Color'].default_value = (*color, 1); n.inputs['Roughness'].default_value = rough
HER_B, HER = make_human('her', gender=0., age=.5, weight=.45, muscle=.4, height=.42, proportions=.65, race={'african': .55, 'caucasian': .35, 'asian': .1},
                        skin='young_african_female', hair='ponytail01', eyebrows='eyebrow006', clothes=['female_casualsuit01'])
HIM_B, HIM = make_human('him', gender=1., age=.52, weight=.55, muscle=.55, height=.6, proportions=.6, race={'caucasian': .7, 'african': .1, 'asian': .2},
                        skin='young_caucasian_male', hair='short02', eyebrows='eyebrow010', clothes=['male_casualsuit06'])
for o in bpy.data.objects:
    if o.name.endswith('female_casualsuit01'): recolor(o, (.78, .7, .58), .95)
    if o.name.endswith('male_casualsuit06') and o.name.startswith('him'): recolor(o, (.03, .045, .09), .9)
    if o.name.endswith('ponytail01'): recolor(o, (.025, .015, .01), .5)
    if o.name.endswith('short02'): recolor(o, (.03, .02, .015), .55)

# phones (parented to the right wrist) + their light on the face
phoneM = mat('phone', (.02, .02, .025), .25, .6)
def phone(rig):
    bpy.ops.mesh.primitive_cube_add(size=1); p = bpy.context.object; p.scale = (.072, .008, .15); p.data.materials.append(phoneM)
    bpy.ops.mesh.primitive_plane_add(size=1); s = bpy.context.object; s.scale = (.064, .14, 1); s.rotation_euler = (math.radians(90), 0, 0); s.location = (0, -.0045, 0); s.parent = p
    sm = mat('screen_' + rig.name, (0, 0, 0), .2, emit=(.75, .85, 1), estr=4.); s.data.materials.append(sm)
    bpy.ops.object.light_add(type='AREA', location=(0, -.05, 0)); L = bpy.context.object; L.data.size = .1; L.data.color = (.72, .82, 1); L.rotation_euler = (math.radians(-90), 0, 0); L.parent = p
    p.parent = rig; p.parent_type = 'BONE'; p.parent_bone = 'wrist.R'; return p, s, sm, L
PH_HER, PH_HER_S, PH_HER_M, PH_HER_L = phone(HER); PH_HIM, PH_HIM_S, PH_HIM_M, PH_HIM_L = phone(HIM)

# ---------------- posing: aim bones at directions (character space: -Y forward, +Z up, +X = her/his left) ----------------
def apply_pose(rig, targets):
    pb = rig.pose.bones; M = {}
    for b in rig.data.bones:
        base = (M[b.parent.name] @ (b.parent.matrix_local.inverted() @ b.matrix_local)) if b.parent else b.matrix_local.copy()
        if b.name in targets:
            cur = (base.to_3x3() @ Vector((0, 1, 0))).normalized(); q = cur.rotation_difference(Vector(targets[b.name]).normalized())
            Mb = Matrix.Translation(base.translation) @ (q.to_matrix() @ base.to_3x3()).to_4x4(); pb[b.name].matrix_basis = base.inverted() @ Mb
        else: pb[b.name].matrix_basis = Matrix.Identity(4); Mb = base
        M[b.name] = Mb
def mirror(d): return {k.replace('.R', '.X').replace('.L', '.R').replace('.X', '.L'): (-v[0], v[1], v[2]) for k, v in d.items()}
def both(d): o = dict(d); o.update(mirror(d)); return o
SIT_LEGS = both({'upperleg01.L': (.1, -1, -.06), 'upperleg02.L': (.1, -1, -.06), 'lowerleg01.L': (.03, -.12, -1), 'lowerleg02.L': (.03, -.12, -1), 'foot.L': (0, -1, -.45)})
def spine(lean=0., turn=0.):  # lean>0 forward
    return {'spine05': (0, .05, 1), 'spine04': (0, .03 - lean * .2, 1), 'spine03': (turn * .1, -lean * .3, 1), 'spine02': (turn * .15, -lean * .45, 1), 'spine01': (turn * .2, -.05 - lean * .5, 1)}
def head(dx=0., down=.0, tilt=0.):  # dx: + = looks to his/her left; down 0..1
    return {'neck01': (dx * .25, -.15 - down * .4, 1), 'neck02': (dx * .35, -.2 - down * .5, 1), 'neck03': (dx * .45, -.25 - down * .6, 1), 'head': (dx * .9 + tilt, -.3 - down * .9, 1)}
ARMS_REST = both({'upperarm01.L': (.18, -.1, -1), 'upperarm02.L': (.18, -.15, -1), 'lowerarm01.L': (-.15, -1, -.12), 'lowerarm02.L': (-.15, -1, -.12), 'wrist.L': (-.1, -1, -.2)})
ARMS_PHONE = both({'upperarm01.L': (.12, -.3, -1), 'upperarm02.L': (.12, -.32, -1), 'lowerarm01.L': (-.32, -1, .62), 'lowerarm02.L': (-.32, -1, .62), 'wrist.L': (-.25, -.55, .95)})
def blend(a, b, k): return {n: V3(a.get(n, b.get(n)), b.get(n, a.get(n)), k) for n in set(a) | set(b)}
def place(rig, x, y=.5, rz=0.): rig.location = (x, y, -.4); rig.rotation_euler = (0, 0, rz)

# ---------------- camera ----------------
bpy.ops.object.camera_add(); CAM = bpy.context.object; sc.camera = CAM; CAM.data.sensor_width = 36; CAM.data.dof.use_dof = True; CAM.data.dof.aperture_fstop = 2.2
AIM = bpy.data.objects.new('aim', None); col.objects.link(AIM); tc = CAM.constraints.new('TRACK_TO'); tc.target = AIM; tc.up_axis = 'UP_Y'; tc.track_axis = 'TRACK_NEGATIVE_Z'
def cam(p, look, lens=35, focus=None):
    CAM.location = p; AIM.location = look; CAM.data.lens = lens; CAM.data.dof.focus_distance = focus or (Vector(p) - Vector(look)).length

# ---------------- moods ----------------
def mood(kind):
    warm = kind in ('flash', 'warm')
    LAMP.energy = 260 if warm else 0; shadeM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 6 if warm else 0
    FILL.data.energy = 70 if warm else 1.5; MOON.data.energy = .3 if warm else 1.1; BG.inputs['Strength'].default_value = .12 if warm else .035; BG2.inputs['Strength'].default_value = .25 if warm else .4
    for b in BOXES: b.hide_render = kind != 'flash'
    for s in (PH_HER_M, PH_HIM_M): s.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 4.
def phones(her_on, him_on, her_vis=True, him_vis=True):
    for p, s, sm, L, on, vis in ((PH_HER, PH_HER_S, PH_HER_M, PH_HER_L, her_on, her_vis), (PH_HIM, PH_HIM_S, PH_HIM_M, PH_HIM_L, him_on, him_vis)):
        for o in (p, s, L): o.hide_render = not vis
        L.data.energy = 9 * on; sm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 4. * on
        p.location = (0, .02, .06); p.rotation_euler = (math.radians(-10), 0, 0)

# ---------------- shots (t = 0..5 s inside the shot) ----------------
def sit(rig, x, extra, rz=0.): place(rig, x, rz=rz); P = {}; P.update(SIT_LEGS); P.update(extra); apply_pose(rig, P)
def shot(n, t):
    k = t / 5.
    if n == 1:   # flashback: close together, laughing toward each other
        mood('flash'); phones(0, 0, False, False); bob = abs(math.sin(t * 7)) * .05
        sit(HER, .32, {**ARMS_REST, **spine(-.1 - bob, -.6), **head(-.75, -.05 - bob, .1)}, rz=-.25)
        sit(HIM, -.3, {**ARMS_REST, **spine(-.05 - bob * .6, .5), **head(.7, -.1, -.05)}, rz=.25)
        cam(V3((.15, -2.6, 1.05), (.1, -2.25, 1.0), k), (0, .35, .85), 40)
    elif n == 2:  # years later: opposite ends, both on phones; slow pull-back
        mood('night'); phones(1, 1)
        sit(HER, 1.0, {**ARMS_PHONE, **spine(.25), **head(0, .85)}); sit(HIM, -1.0, {**ARMS_PHONE, **spine(.3), **head(0, .9)})
        cam(V3((0, -2.9, 1.0), (0, -3.5, 1.1), k), (0, .4, .75), 30)
    elif n == 3:  # she turns to show him; he never looks; she gives up
        mood('night'); phones(1, 1); turn = ss(seg(t, .4, 1.4)) * (1 - ss(seg(t, 3.0, 4.2)))
        her = blend({**ARMS_PHONE, **spine(.25), **head(0, .85)}, {**ARMS_PHONE, **spine(.05, .8), **head(.8, .1), 'lowerarm02.R': (.6, -.8, .3), 'wrist.R': (.7, -.6, .2)}, turn)
        if t > 3.0: her = blend(her, {**ARMS_REST, **spine(.35), **head(-.1, .95)}, ss(seg(t, 3.4, 4.6)))
        sit(HER, .55, her); sit(HIM, -.55, {**ARMS_PHONE, **spine(.3), **head(0, .9)})
        cam(V3((.75, -1.7, 1.15), (.6, -1.55, 1.12), k), (.2, .4, 1.0), 42)
    elif n == 4:  # over his shoulder: the memory on his phone
        mood('night'); phones(1, 1, False, True); PH_HIM_M.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 3
        sit(HIM, -1.0, {**ARMS_PHONE, **spine(.3), **head(0, .9)}); sit(HER, 1.0, {**ARMS_PHONE, **spine(.25), **head(0, .85)})
        ph = PH_HIM.matrix_world.translation; cam(V3((-1.18, .2, 1.55), (-1.12, .12, 1.45), k), tuple(ph), 55, None)
    elif n == 5:  # his POV: she is alone at the far end
        mood('night'); phones(1, 1); look = ss(seg(t, 1.0, 2.5))
        sit(HIM, -1.0, {**ARMS_PHONE, **spine(.3 - .2 * look), **head(-.75 * look, .9 - .7 * look)}); sit(HER, 1.05, {**ARMS_PHONE, **spine(.4), **head(.05, .95)})
        cam(V3((-1.35, .05, 1.35), (-1.2, -.25, 1.3), k), (1.0, .45, .95), lerp(50, 58, k))
    elif n == 6:  # the phone goes face-down on the table
        mood('night'); phones(1 - ss(seg(t, 2.2, 3.4)), 1); flip = ss(seg(t, .6, 2.4))
        sit(HER, 1.05, {**ARMS_PHONE, **spine(.4), **head(.05, .95)}); sit(HIM, -.9, {**ARMS_PHONE, **spine(.3 + .5 * flip), **head(0, .9), 'upperarm01.R': V3((-.12, -.3, -1), (-.15, -1, -.6), flip), 'upperarm02.R': V3((-.12, -.32, -1), (-.15, -1, -.6), flip), 'lowerarm01.R': V3((.32, -1, .62), (.1, -1, -.7), flip), 'lowerarm02.R': V3((.32, -1, .62), (.1, -1, -.7), flip)})
        PH_HIM.rotation_euler = (math.radians(-10 + 170 * flip), 0, 0)
        cam(V3((-.55, -1.55, .95), (-.5, -1.45, .9), k), (-.55, -.7, .5), 50)
    elif n == 7:  # he slides next to her and lowers her phone
        mood('night'); phones(1 - ss(seg(t, 1.6, 3.0)), 0, True, False); mv = ss(seg(t, 0, 1.2)); low = ss(seg(t, 1.2, 2.4)); turn = ss(seg(t, 2.0, 3.0))
        sit(HIM, lerp(.15, .6, mv), {**ARMS_REST, **spine(.15, .3), **head(.7, .3), 'upperarm01.L': (.3, -.6, -.8), 'upperarm02.L': (.3, -.6, -.8), 'lowerarm01.L': (.55, -.8, -.1), 'lowerarm02.L': (.55, -.8, -.1)}, rz=.2)
        sit(HER, 1.05, blend({**ARMS_PHONE, **spine(.35), **head(0, .9)}, {**blend(ARMS_PHONE, ARMS_REST, low), **spine(.0, -.4), **head(-.8, .05, .05)}, turn), rz=-.15)
        cam(V3((1.3, -1.2, 1.2), (1.2, -1.05, 1.18), k), (.85, .4, 1.1), 50)
    elif n == 8:  # lamp on: together again, laughing
        mood('warm'); phones(0, 0, False, False); bob = abs(math.sin(t * 6)) * .05
        sit(HER, .35, {**ARMS_REST, **spine(-.12 - bob, -.6), **head(-.7, -.05 - bob, .25)}, rz=-.3)
        sit(HIM, -.25, {**ARMS_REST, **spine(-.05 - bob * .5, .5), **head(.6, -.05)}, rz=.3)
        cam(V3((.1, -2.3, 1.05), (.05, -2.05, 1.02), k), (.05, .35, .9), 42)
    elif n == 9:  # phones face-down in front, the couple close behind
        mood('warm'); phones(0, 0, False, False); FACEDOWN.hide_render = False
        sit(HER, .22, {**ARMS_REST, **spine(-.1, -.4), **head(-.6, .15, .45)}, rz=-.2); sit(HIM, -.3, {**ARMS_REST, **spine(-.05, .3), **head(.35, .0)}, rz=.25)
        cam(V3((.35, -1.75, .75), (.4, -2.25, .85), k), (.0, -.5, .55), 40, (Vector((.35, -1.75, .75)) - Vector((0, .45, .9))).length * .55)
# two phones lying face-down on the table for the last shot
FACEDOWN = bpy.data.objects.new('facedown', None); col.objects.link(FACEDOWN)
for x, r in ((-.12, .2), (.14, -.3)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -.72, .382), rotation=(0, 0, r)); o = bpy.context.object; o.scale = (.072, .15, .008); o.data.materials.append(phoneM); o.parent = FACEDOWN
def set_facedown(v):
    for c in FACEDOWN.children: c.hide_render = not v

def render_frame(n, f, path):
    for c in FACEDOWN.children: c.hide_render = True
    FACEDOWN.hide_render = True
    shot(n, f / FPS)
    if n == 9: set_facedown(True)
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
if A.still:
    n, f = map(int, A.still.split(':')); os.makedirs(A.out, exist_ok=True); render_frame(n, f, f'{A.out}/s{n}_{f:03d}.jpg')
else:
    a, b = map(int, A.frames.split(':')); os.makedirs(A.out, exist_ok=True)
    for f in range(a, b):
        p = f'{A.out}/s{A.shot}_{f:03d}.jpg'
        if not os.path.exists(p): render_frame(A.shot, f, p)
