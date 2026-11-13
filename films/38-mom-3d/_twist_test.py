# Validation animation (10 s, 1080x1920, 30 fps): Mom sits against the hallway wall, looks to the door, reaches, lowers her hand, sad.
# Built on hallway.py; adds the movable face (tools/character/face_rig.py) and the painted-out face texture copy.
# Mom sits on the floor against the wall beside her daughter's closed door, lit by the
# ceiling lamp; a thin line of warm light under the door. She turns to the door, lays her hand on it; the light under
# the door goes out; she stays. 10 s, 30 fps. Original characters and set (reference: REFERENCES.md, ref 1).
# usage: blender python scene.py -- outdir [--frames a,b] [--range a b] [--scale pct] [--spp n] [--force]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Matrix
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "34-first-home", "blender"))
from lib import img_mat, lin, mat, rbox as _rbox, plane, cyl, area, point, aim, piv, smooth, mix, clamp01

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "out"
def arg(k, d=None): return argv[argv.index(k) + 1] if k in argv else d
FPS, N = 30, 300
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene

def rbox(name, half, *a, **k):
    return _rbox(name, (half[0] * 2, half[1] * 2, half[2] * 2), *a, **k)
def link(o, parent=None):
    sc.collection.objects.link(o)
    if parent is not None: o.parent = parent
    return o
def subsurf(o, lv=2):
    m = o.modifiers.new("ss", 'SUBSURF'); m.levels = 1; m.render_levels = lv; return o
def capsule(name, r, length, m, parent=None, loc=(0, 0, 0), scale=(1, 1, 1), down=True, seg=24):
    """rounded limb from the pivot along -Z (down=True) of the given length"""
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=16, radius=r)
    for v in bm.verts:
        if v.co.z < 0: v.co.z -= length
        v.co.x *= scale[0]; v.co.y *= scale[1]
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); me.materials.append(m); link(o, parent); o.location = loc; subsurf(o, 1); return o
def blob(name, m, parent=None, loc=(0, 0, 0), scale=(1, 1, 1), seg=40, rings=24, keep=None, deform=None, lv=2):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts:
        c = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
        v.co = deform(c) if deform else c
    if keep: bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); me.materials.append(m); link(o, parent); o.location = loc
    if lv: subsurf(o, lv)
    return o

# ---------------- materials ----------------
def wood(name, a, b, scale=(1, 12, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True; Nn = m.node_tree.nodes; L = m.node_tree.links
    bs = Nn["Principled BSDF"]; bs.inputs["Roughness"].default_value = 0.42; bs.inputs["Coat Weight"].default_value = 0.25
    tc = Nn.new("ShaderNodeTexCoord"); mp = Nn.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = scale
    w = Nn.new("ShaderNodeTexWave"); w.inputs["Scale"].default_value = 3; w.inputs["Distortion"].default_value = 6; w.inputs["Detail"].default_value = 3
    br = Nn.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.004
    br.inputs["Brick Width"].default_value = 1.2; br.inputs["Row Height"].default_value = 0.14
    br.inputs["Color1"].default_value = (*lin(a), 1); br.inputs["Color2"].default_value = (*lin(b), 1); br.inputs["Mortar"].default_value = (*lin("#3a2414"), 1)
    mx = Nn.new("ShaderNodeMix"); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs["Factor"].default_value = 0.35
    L.new(tc.outputs["Object"], mp.inputs["Vector"]); L.new(mp.outputs["Vector"], w.inputs["Vector"]); L.new(tc.outputs["Object"], br.inputs["Vector"])
    L.new(br.outputs["Color"], mx.inputs["A"]); L.new(w.outputs["Color"], mx.inputs["B"]); L.new(mx.outputs["Result"], bs.inputs["Base Color"])
    return m
FLOOR = wood("floor", "#6e4126", "#83502f", scale=(1, 14, 1))
WALL = mat("wall", "#4a4870", rough=0.85)              # dusty violet-blue upper wall
WAINS = mat("wains", "#d9cdb8", rough=0.6)             # cream wainscoting
TRIM = mat("trim", "#efe6d6", rough=0.45)
DOOR = mat("door", "#e9dfcd", rough=0.5)
BRASS = mat("brass", "#c9a45c", rough=0.25, metal=1.0)
RAIL = mat("rail", "#5a3a22", rough=0.4, coat=0.3)
CEIL = mat("ceil", "#d8d2c8", rough=0.9)
LAMPG = mat("lampglass", "#fff1d6", emit=6.0, rough=0.3)
SLIT = mat("doorslit", "#ffcf8a", emit=12.0)
RUG = mat("rug", "#6b3a33", rough=0.95)
FRAMEM = mat("frame", "#3b2a1e", rough=0.5)
PIC = mat("pic", "#c8a46a", rough=0.7)
SKIN = mat("skin", "#f1c6a3", rough=0.5, sss=0.12)
HAIR = mat("hairm", "#3a2216", rough=0.45, coat=0.25)
EYE = mat("eye", "#120c08", rough=0.08, coat=1.0)
GLINT = mat("glint", "#ffffff", emit=4.0)
BROW = mat("brow", "#2a1a10", rough=0.7)
LIP = mat("lipm", "#a65a50", rough=0.5)
BLUSH = mat("blush", "#f08a7e", rough=0.6, alpha=0.35)
TOP = mat("cardigan", "#3f6f73", rough=0.85)           # deep teal cardigan
TEE = mat("tee", "#efe4d0", rough=0.8)
PANTS = mat("pants", "#4a4038", rough=0.85)
SOCK = mat("sock", "#e8dccb", rough=0.9)

# ---------------- set: the hallway ----------------
# wall along x at y = 0 (facing -y); the door from x = 0.35 to 1.25; floor z = 0
plane("floor", 6, 4, FLOOR, loc=(0, -1.6, 0), rot=(0, 0, 0))
DX0, DX1, DH = 0.35, 1.25, 2.05
for nm, x0, x1 in [("wl", -3.0, DX0), ("wr", DX1, 3.0)]:
    plane(nm + "_up", x1 - x0, 1.75, WALL, loc=((x0 + x1) / 2, 0.0, 0.95 + 1.75 / 2))
    plane(nm + "_lo", x1 - x0, 0.95, WAINS, loc=((x0 + x1) / 2, 0.0, 0.95 / 2))
    rbox(nm + "_cap", ((x1 - x0) / 2, 0.02, 0.02), TRIM, loc=((x0 + x1) / 2, -0.02, 0.95), bev=0.006)
    rbox(nm + "_base", ((x1 - x0) / 2, 0.015, 0.06), TRIM, loc=((x0 + x1) / 2, -0.015, 0.06), bev=0.005)
    for k in range(int((x1 - x0) / 0.45)):                                   # wainscot panels
        cx = x0 + 0.25 + k * 0.45
        if cx + 0.18 < x1: rbox(f"{nm}_pan{k}", (0.17, 0.006, 0.3), WAINS, loc=(cx, -0.008, 0.48), bev=0.004)
plane("over_door", DX1 - DX0, 2.7 - DH, WALL, loc=((DX0 + DX1) / 2, 0.0, DH + (2.7 - DH) / 2))
plane("ceiling", 6, 4, CEIL, loc=(0, -1.6, 2.7), rot=(math.pi, 0, 0))
# the door (slightly inset) and its frame, knob, the line of light under it
door = rbox("door", ((DX1 - DX0) / 2 - 0.01, 0.02, DH / 2 - 0.012), DOOR, loc=((DX0 + DX1) / 2, 0.03, DH / 2 + 0.012), bev=0.004)
for k, (zc, hh) in enumerate([(0.55, 0.38), (1.45, 0.42)]):
    rbox(f"dpan{k}", ((DX1 - DX0) / 2 - 0.12, 0.006, hh), DOOR, loc=((DX0 + DX1) / 2, 0.004, zc), bev=0.006)
for nm, x in [("jl", DX0 - 0.04), ("jr", DX1 + 0.04)]:
    rbox(nm, (0.045, 0.03, DH / 2 + 0.02), TRIM, loc=(x, -0.02, DH / 2 + 0.02), bev=0.006)
rbox("jtop", ((DX1 - DX0) / 2 + 0.09, 0.03, 0.05), TRIM, loc=((DX0 + DX1) / 2, -0.02, DH + 0.06), bev=0.006)
knob = rbox("knob", (0.03, 0.03, 0.03), BRASS, loc=(DX1 - 0.09, -0.01, 0.95), bev=0.02, seg=4)
slit = plane("slit", DX1 - DX0 - 0.03, 0.012, SLIT, loc=((DX0 + DX1) / 2, 0.012, 0.005))
slitlight = area("slitlight", ((DX0 + DX1) / 2, 0.02, 0.01), ((DX0 + DX1) / 2, -0.6, 0.0), 0.8, 14, (1.0, 0.7, 0.4), size_y=0.02)
# stair railing on the left, a rug, a small framed picture
for k in range(9):
    x = -3.2 + k * 0.11; cyl(f"bal{k}", 0.018, 0.9, TRIM, loc=(x, -1.15, 0.45))
rbox("handrail", (0.52, 0.04, 0.03), RAIL, loc=(-2.76, -1.15, 0.92), bev=0.01)
rbox("newel", (0.05, 0.05, 0.6), RAIL, loc=(-2.22, -1.15, 0.6), bev=0.01)
# ceiling lamp (a glowing dome) over the hallway
lamp = blob("lamp", LAMPG, loc=(-0.1, -0.9, 2.62), scale=(0.2, 0.2, 0.09), keep=lambda c: c.z < 0.005, lv=1)
lampL = point("lampL", (-0.1, -0.9, 2.5), 120, (1.0, 0.64, 0.38), r=0.15)
area("wash", (-0.3, -0.6, 2.4), (0.0, 0, 0.6), 0.8, 30, (1.0, 0.66, 0.4))
area("fill", (-1.6, -2.6, 1.6), (0, 0, 0.8), 2.0, 3, (0.5, 0.58, 0.95))
area("facefill", (0.9, -1.4, 1.1), (-0.06, -0.2, 0.85), 1.2, 7, (1.0, 0.78, 0.6))                 # cool fill from the stair window
area("bounce", (0.4, -1.4, 0.05), (0, -0.2, 0.7), 1.5, 3, (1.0, 0.7, 0.45))              # warm floor bounce


# ---------------- furnishing (Poly Haven CC0 props) ----------------
PH = "/root/assets/ph"
HERE38 = os.path.dirname(os.path.abspath(__file__))
def prop(name, loc, rz=0.0, s=1.0):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f"{PH}/{name}/{name}_1k.gltf")
    objs = [o for o in bpy.data.objects if o not in before]; root = piv(name + "_root", loc=loc, rot=(0, 0, rz)); root.scale = (s, s, s)
    for o in objs:
        if o.parent is None: o.parent = root
    return root
prop("ClassicConsole_01", (-1.45, -0.2, 0.0), 0.0, 0.62)
prop("ceramic_vase_01", (-1.62, -0.22, 0.59), 0.0, 0.9)
prop("potted_plant_01", (-2.25, -0.35, 0.0), 0.5, 0.85)
for k, (x, z, w, h) in enumerate([(-1.62, 1.45, 0.17, 0.22), (-1.25, 1.55, 0.13, 0.16)]):
    rbox(f"frame{k}", (w, 0.012, h), FRAMEM, loc=(x, -0.012, z), bev=0.004)
    plane(f"photo{k}", (w - 0.025) * 2, (h - 0.025) * 2, img_mat(f"pm{k}", os.path.join(HERE38, "tex", f"p{k}.jpg"), rough=0.4), loc=(x, -0.025, z))
rbox("runner", (1.2, 0.32, 0.004), RUG, loc=(-0.9, -0.85, 0.004), bev=0.003)
for k, (x, z, w, h) in enumerate([(-0.55, 1.62, 0.16, 0.2), (-0.2, 1.5, 0.12, 0.12), (-0.2, 1.78, 0.12, 0.09)]):
    rbox(f"fr2{k}", (w, 0.012, h), FRAMEM, loc=(x, -0.012, z), bev=0.004); plane(f"ph2{k}", (w - 0.022) * 2, (h - 0.022) * 2, img_mat(f"pm2{k}", os.path.join(HERE38, "tex", f"p{k + 2}.jpg"), rough=0.4), loc=(x, -0.025, z))
SCON = mat("sconce", "#ffe1b0", emit=5.0)
blob("sconce", SCON, loc=(DX0 - 0.25, -0.06, 1.75), scale=(0.07, 0.05, 0.09), lv=1)
point("sconceL", (DX0 - 0.25, -0.15, 1.75), 25, (1.0, 0.68, 0.42), r=0.06)

# ---------------- Mom: the converted, rigged 3D model ----------------
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "mom.glb"))
for o in [o for o in bpy.data.objects if o not in before]:
    if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
ARM = [o for o in bpy.data.objects if o.type == 'ARMATURE'][-1]
if ARM.animation_data: ARM.animation_data.action = None
# glTF has no bone tails: the importer leaves very long, oddly aimed bones, which breaks IK.
# Re-aim every bone at its child joint (leaf bones get a short extension along the parent direction).
NEXT = {"Hips": "Spine02", "Spine02": "Spine01", "Spine01": "Spine", "Spine": "neck", "neck": "Head", "Head": "head_end",
        "LeftShoulder": "LeftArm", "LeftArm": "LeftForeArm", "LeftForeArm": "LeftHand", "RightShoulder": "RightArm",
        "RightArm": "RightForeArm", "RightForeArm": "RightHand", "LeftUpLeg": "LeftLeg", "LeftLeg": "LeftFoot", "LeftFoot": "LeftToeBase",
        "RightUpLeg": "RightLeg", "RightLeg": "RightFoot", "RightFoot": "RightToeBase"}
bpy.context.view_layer.objects.active = ARM
for o in bpy.context.view_layer.objects: o.select_set(o == ARM)
bpy.ops.object.mode_set(mode='EDIT')
EB = ARM.data.edit_bones
for b in EB:
    if b.name in NEXT and NEXT[b.name] in EB: b.tail = EB[NEXT[b.name]].head.copy()
for b in EB:
    if b.name not in NEXT or NEXT[b.name] not in EB:
        d = (b.head - b.parent.head).normalized() if b.parent else Vector((0, 0, 1)); b.tail = b.head + d * 6.0
    b.roll = 0.0
bpy.ops.object.mode_set(mode='OBJECT')
PB = ARM.pose.bones
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools", "character"))
import face_rig
MOMMESH = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent == ARM][0]
face_rig.swap_texture(MOMMESH, os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "face_rig", "Image_0_faceclean.png"))
FACE = face_rig.Face(ARM, MOMMESH)
if True:                                                   # weld UV-seam splits, then smooth bunched skin (scene copy only; GLB untouched)
    import bmesh as _bm_
    _b = _bm_.new(); _b.from_mesh(MOMMESH.data); _bm_.ops.remove_doubles(_b, verts=_b.verts, dist=1e-5); _b.to_mesh(MOMMESH.data); _b.free()
    cs = MOMMESH.modifiers.new('corrective', 'CORRECTIVE_SMOOTH'); cs.factor = 0.6; cs.iterations = 12; cs.scale = 1.0; cs.rest_source = 'ORCO'; cs.smooth_type = 'LENGTH_WEIGHTED'                       # built in the rest pose at the origin, then carried by the Head bone
HIP0 = Vector((-0.004, -0.03, 0.884))                    # rest position of the Hips joint
SEAT = Vector((-0.06, -0.2, 0.21))                       # where her hips sit on the floor
ARM.location = SEAT - HIP0
def tgt(name):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e); return e
IKT = {}
for side, bone in [("L", "LeftLeg"), ("R", "RightLeg"), ("Lh", "LeftForeArm"), ("Rh", "RightForeArm")]:
    t = tgt("ik_" + side); p = tgt("pole_" + side)
    c = PB[bone].constraints.new('IK'); c.target = t; c.pole_target = p; c.chain_count = 2; c.pole_angle = math.radians(-90)
    IKT[side] = (t, p, c)
def frame_from(f, n):
    f = f.normalized(); n = (n - f * n.dot(f)).normalized(); return Matrix((f, n, f.cross(n))).transposed()
REST_HAND = {}
def orient_hand(name, finger, palm, rest_palm):
    """turn a hand so its fingers point along `finger` and its palm faces `palm` (world), keeping the IK position"""
    bpy.context.view_layer.update()
    pb = PB[name]; b = ARM.data.bones[name]
    Rw = (ARM.matrix_world @ b.matrix_local).to_3x3().normalized()
    f0 = (Rw @ Vector((0, 1, 0))).normalized()                                  # rest finger direction (bone Y)
    R = frame_from(Vector(finger), Vector(palm)) @ frame_from(f0, Vector(rest_palm)).transposed()
    Mw = (R @ Rw).to_4x4(); Mw.translation = (ARM.matrix_world @ pb.matrix).translation
    M = ARM.matrix_world.inverted() @ Mw
    pb.matrix = Matrix.LocRotScale(M.translation, M.to_quaternion(), pb.matrix.to_scale())
def rot_bone_world(name, axis, ang):
    """rotate a pose bone about a world axis through its head (armature space)"""
    bpy.context.view_layer.update()
    pb = PB[name]; M = pb.matrix.copy(); h = M.translation.copy()
    R = Matrix.Rotation(ang, 4, axis); T = Matrix.Translation(h); pb.matrix = T @ R @ T.inverted() @ M
# ---------------- camera / render ----------------
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); link(cam); sc.camera = cam
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.8; cam.data.sensor_width = 36
w = bpy.data.worlds.new("w"); sc.world = w; w.color = (0.01, 0.01, 0.015)
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(arg("--spp", 32)); sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 2; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920; sc.render.resolution_percentage = int(arg("--scale", 50))
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"; sc.view_settings.exposure = -0.55


# ---------------- performance ----------------
def K_(t, keys):
    if t <= keys[0][0]: return keys[0][1]
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if t <= b: return mix(va, vb, smooth((t - a) / (b - a)))
    return keys[-1][1]
D = math.radians
def stage(f):
    t = f / FPS
    br = math.sin(t * 2 * math.pi / 4.0)
    turn = K_(t, [(0, 0), (2.3, 0), (4.2, 1), (7.4, 1), (9.0, 0.35), (10, 0.35)])     # head toward the door, then back and down
    reach = K_(t, [(0, 0), (4.3, 0), (6.0, 1), (7.3, 1), (8.8, 0)])                # her left hand to the door and back to the knee
    out = K_(t, [(6.95, 0), (7.05, 1)])                                            # the light under the door goes out
    down = K_(t, [(7.4, 0), (9.2, 1)])                                             # head lowers, shoulders soften
    for pb in PB: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    for side, sx in [("L", 1), ("R", -1)]:
        t_, p_, c = IKT[side]
        t_.location = SEAT + Vector((sx * 0.12, -0.42, -0.13)); p_.location = SEAT + Vector((sx * 0.14, -0.55, 1.2))
    for side, sx in [("Lh", 1), ("Rh", -1)]:
        t_, p_, c = IKT[side]
        rest = SEAT + Vector((sx * 0.09, -0.34, 0.25))
        goal = rest.lerp(Vector((DX0 + 0.1, -0.035, 0.58)), reach) if side == "Lh" else rest
        t_.location = goal; p_.location = SEAT + Vector((sx * 0.6, 0.1, 0.1))
    rot_bone_world("Spine02", Vector((1, 0, 0)), D(-6 + 1.0 * br + 4 * down))
    rot_bone_world("Spine", Vector((0, 0, 1)), D(6 * turn))
    rot_bone_world("neck", Vector((0, 0, 1)), D(16 * turn))
    rot_bone_world("Head", Vector((0, 0, 1)), D(20 * turn))
    rot_bone_world("Head", Vector((1, 0, 0)), D(8 + 12 * down - 4 * turn))
    rot_bone_world("Head", Vector((0, 1, 0)), D(-8 * turn + 5 * down))
    for name, sx in (("LeftFoot", 1), ("RightFoot", -1)):
        orient_hand(name, Vector((sx * 0.18, -1.0, -0.12)), Vector((0, 0, -1)), Vector((0, 0, -1)))
    for name, sx in (("LeftHand", 1), ("RightHand", -1)):
        fin = Vector((-sx * 0.15, -0.55, -0.82)); palm = Vector((-sx * 0.75, 0.1, -0.65))     # half-turned palm: less wrist twist (no forearm twist bones)
        if name == "LeftHand":
            fin = fin.lerp(Vector((0.15, 0.0, 1.0)), reach); palm = palm.lerp(Vector((0, 1, 0)), reach)
        orient_hand(name, fin, palm, Vector((-sx, 0, 0)))
    # face: quiet worry -> eyes lead the turn to the door -> hope while touching -> the light goes out -> sadness
    blink = max(0.0, 1 - abs(t - 1.4) / 0.1) + max(0.0, 1 - abs(t - 4.9) / 0.1) + max(0.0, 1 - abs(t - 7.25) / 0.12)
    slow = K_(t, [(8.9, 0), (9.3, 0.85), (9.8, 0.55)])                             # a slow, heavy close at the end
    gx = K_(t, [(0, 0.0), (2.0, 0.0), (2.5, 0.9), (7.3, 0.9), (8.2, -0.1)])
    gz = K_(t, [(0, -0.6), (2.3, -0.6), (2.8, 0.1), (7.2, 0.1), (8.4, -0.8)])
    FACE.set(blink=min(1, max(blink, slow)), look=(gx, gz),
             brow_in=K_(t, [(0, 0.35), (4.5, 0.55), (6.4, 0.25), (7.2, 0.4), (8.4, 1.0)]),
             brow_out=K_(t, [(0, 0), (8.4, -0.3)]), sad=K_(t, [(0, 0.2), (6.0, 0.1), (7.3, 0.25), (8.6, 0.85)]),
             smile=K_(t, [(0, -0.25), (6.0, -0.05), (7.3, -0.3), (8.6, -0.85)]), tear=K_(t, [(8.6, 0), (9.8, 0.42)]))
    SLIT.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 12.0 * (1 - out)
    slitlight.data.energy = 14 * (1 - out)
    bpy.context.view_layer.update()
    # camera: from the door side, a wide hallway that slowly closes in on her face and hand
    u = smooth(t / 10.0)
    hd = ARM.matrix_world @ PB["Head"].head
    look = Vector((mix(0.05, hd.x, u), mix(-0.2, hd.y, u), mix(0.85, hd.z - 0.1, u)))
    cam.location = Vector((mix(1.55, 0.72, u), mix(-3.0, -1.5, u), mix(1.2, 0.98, u)))
    aim(cam, look); cam.data.lens = mix(24, 38, u)
    cam.data.dof.focus_distance = (hd - cam.location).length
    if "--handcam" in argv:                                    # validation close-up on her left hand (the reaching one)
        hw = ARM.matrix_world @ PB["LeftHand"].head
        cam.location = hw + Vector((0.32, -0.42, 0.12)); aim(cam, hw + Vector((0.02, 0, -0.03))); cam.data.lens = 60
        cam.data.dof.focus_distance = (hw - cam.location).length

frames = list(range(N))
if "--frames" in argv: frames = [int(x) for x in arg("--frames").split(",")]
if "--range" in argv:
    i = argv.index("--range"); frames = list(range(int(argv[i + 1]), int(argv[i + 2])))
os.makedirs(OUT, exist_ok=True)
for f in frames:
    p = os.path.join(OUT, f"{f + 1:04d}.png")
    if os.path.exists(p) and "--force" not in argv: continue
    sc.frame_set(f); stage(f); sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
print("DONE", len(frames))
