# Look test 37: "the hallway". Mom sits on the floor against the wall beside her daughter's closed door, lit by the
# ceiling lamp; a thin line of warm light under the door. She turns to the door, lays her hand on it; the light under
# the door goes out; she stays. 10 s, 30 fps. Original characters and set (reference: REFERENCES.md, ref 1).
# usage: blender python scene.py -- outdir [--frames a,b] [--range a b] [--scale pct] [--spp n] [--force]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "34-first-home", "blender"))
from lib import lin, mat, rbox as _rbox, plane, cyl, area, point, aim, piv, smooth, mix, clamp01

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
    x = -2.2 + k * 0.11; cyl(f"bal{k}", 0.018, 0.9, TRIM, loc=(x, -1.15, 0.45))
rbox("handrail", (0.52, 0.04, 0.03), RAIL, loc=(-1.76, -1.15, 0.92), bev=0.01)
rbox("newel", (0.05, 0.05, 0.6), RAIL, loc=(-1.22, -1.15, 0.6), bev=0.01)
rbox("rug", (0.32, 0.22, 0.004), RUG, loc=(-0.75, -0.75, 0.004), bev=0.003)
rbox("picframe", (0.17, 0.012, 0.13), FRAMEM, loc=(-0.85, -0.012, 1.55), bev=0.004)
rbox("pic", (0.14, 0.004, 0.1), PIC, loc=(-0.85, -0.026, 1.55), bev=0.0)
# ceiling lamp (a glowing dome) over the hallway
lamp = blob("lamp", LAMPG, loc=(-0.1, -0.9, 2.62), scale=(0.2, 0.2, 0.09), keep=lambda c: c.z < 0.005, lv=1)
lampL = point("lampL", (-0.1, -0.9, 2.5), 120, (1.0, 0.64, 0.38), r=0.15)
area("wash", (-0.3, -0.6, 2.4), (0.0, 0, 0.6), 0.8, 30, (1.0, 0.66, 0.4))
area("fill", (-1.6, -2.6, 1.6), (0, 0, 0.8), 2.0, 3, (0.5, 0.58, 0.95))                 # cool fill from the stair window
area("bounce", (0.4, -1.4, 0.05), (0, -0.2, 0.7), 1.5, 3, (1.0, 0.7, 0.45))              # warm floor bounce

# ---------------- Mom (original): segmented toy body, soft round head, bob, bead eyes ----------------
HIP = piv("hip", loc=(-0.12, -0.17, 0.13))
SP = piv("spine", HIP, loc=(0, 0, 0.04))
CH = piv("chest", SP, loc=(0, 0, 0.26))
NK = piv("neck", CH, loc=(0, 0, 0.16))
HD = piv("head", NK, loc=(0, 0, 0.04))
capsule("pelvis", 0.12, 0.0, PANTS, HIP, loc=(0, 0, 0.02), scale=(1.15, 0.85, 1))
torso = capsule("torso", 0.125, 0.2, TOP, SP, loc=(0, 0, 0.24), scale=(1.12, 0.78, 1))
capsule("tee", 0.03, 0.0, TEE, CH, loc=(0, -0.07, 0.13), scale=(1.4, 0.5, 0.5))
capsule("neckm", 0.04, 0.06, SKIN, NK, loc=(0, 0, 0.07))
R = 0.135; HC = Vector((0, 0, 0.13))
def headdef(c):
    x, y, z = c; k = clamp01(-z / R); x *= 1 - 0.12 * k ** 2; y *= 1 - 0.06 * k ** 2
    return Vector((x, y, z)) + HC
head = blob("headm", SKIN, HD, scale=(R, R * 0.96, R * 1.06), deform=headdef, seg=48, rings=32)
for sx in (-1, 1):
    blob(f"ear{sx}", SKIN, HD, loc=HC + Vector((sx * R * 0.98, 0.005, -0.01)), scale=(0.014, 0.022, 0.03), seg=16, rings=10, lv=1)
# eyes, lids for blinks, brows, mouth, blush, nose
EYES = []
for sx in (-1, 1):
    E = piv(f"eye{sx}", HD, loc=HC + Vector((sx * 0.045, -R * 0.93, 0.005)))
    blob(f"eyeb{sx}", EYE, E, scale=(0.015, 0.009, 0.019), seg=24, rings=16, lv=1)
    blob(f"glint{sx}", GLINT, E, loc=(-0.004, -0.008, 0.006), scale=(0.0045, 0.002, 0.0045), seg=10, rings=6, lv=0)
    lid = blob(f"lid{sx}", SKIN, E, loc=(0, -0.001, 0.0), scale=(0.018, 0.011, 0.022), keep=lambda c: c.z > -0.002, seg=24, rings=16, lv=1)
    brow = capsule(f"brow{sx}", 0.0045, 0.03, BROW, HD, loc=HC + Vector((sx * 0.045 - sx * 0.015, -R * 0.9, 0.042)), scale=(1, 0.6, 1))
    brow.rotation_euler = (0, math.radians(90 * sx), 0)
    EYES.append(dict(E=E, lid=lid, brow=brow, sx=sx))
blob("nose", SKIN, HD, loc=HC + Vector((0, -R * 1.0, -0.02)), scale=(0.011, 0.01, 0.012), seg=16, rings=10, lv=1)
mouth = capsule("mouth", 0.0035, 0.024, LIP, HD, loc=HC + Vector((-0.012, -R * 0.94, -0.055)), scale=(1, 0.6, 1)); mouth.rotation_euler = (0, math.radians(90), 0)
for sx in (-1, 1):
    blob(f"blush{sx}", BLUSH, HD, loc=HC + Vector((sx * 0.075, -R * 0.82, -0.032)), scale=(0.02, 0.006, 0.013), seg=16, rings=8, lv=1)
# hair: a soft bob with a side fringe (one sculpted shape)
HS = Vector((R, R * 0.96, R * 1.06))
def bobdef(c):
    d = Vector(c).normalized(); r = 1.1 + 0.05 * clamp01(d.z)
    if d.z < -0.3: r -= (-0.3 - d.z) * 0.35
    return Vector((d.x * HS.x, d.y * HS.y, d.z * HS.z)) * r + HC
def bobkeep(c):
    c = c - HC; d = Vector((c.x / HS.x, c.y / HS.y, c.z / HS.z)).normalized()
    fr = 0.42 - 0.22 * clamp01((d.x + 0.7) / 1.4)                       # side-swept fringe line
    if d.y < -0.2 and d.z < fr and abs(d.x) < 0.75: return False
    if d.z < -0.62: return False
    return True
hair = blob("hair", HAIR, HD, scale=(1, 1, 1), deform=bobdef, keep=bobkeep, seg=96, rings=64, lv=0)
_bm = bmesh.new(); _bm.from_mesh(hair.data)
for _ in range(30):
    new = {}
    for v in [v for v in _bm.verts if v.is_boundary]:
        nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
        if len(nb) == 2: new[v] = v.co * 0.5 + (nb[0].co + nb[1].co) * 0.25
    for v, c in new.items(): v.co = c
_bm.to_mesh(hair.data); _bm.free()
so = hair.modifiers.new("sol", 'SOLIDIFY'); so.thickness = 0.014; so.offset = -1; subsurf(hair, 2)
# arms and legs
ARM = {}
for sx in (-1, 1):
    S = piv(f"sho{sx}", CH, loc=(sx * 0.15, 0, 0.06))
    capsule(f"uarm{sx}", 0.05, 0.22, TOP, S)
    E = piv(f"elb{sx}", S, loc=(0, 0, -0.24))
    capsule(f"farm{sx}", 0.045, 0.2, TOP, E)
    capsule(f"cuff{sx}", 0.047, 0.0, TOP, E, loc=(0, 0, -0.2))
    Wr = piv(f"wri{sx}", E, loc=(0, 0, -0.23))
    blob(f"hand{sx}", SKIN, Wr, loc=(0, 0, -0.04), scale=(0.036, 0.022, 0.05), seg=24, rings=16, lv=1)
    blob(f"thumb{sx}", SKIN, Wr, loc=(-sx * 0.028, -0.01, -0.03), scale=(0.012, 0.012, 0.022), seg=12, rings=8, lv=1)
    ARM[sx] = (S, E, Wr)
LEG = {}
for sx in (-1, 1):
    T = piv(f"thi{sx}", HIP, loc=(sx * 0.075, 0, 0.0))
    capsule(f"thigh{sx}", 0.068, 0.36, PANTS, T)
    K = piv(f"kne{sx}", T, loc=(0, 0, -0.38))
    capsule(f"shin{sx}", 0.058, 0.32, PANTS, K)
    F = piv(f"ank{sx}", K, loc=(0, 0, -0.31))
    blob(f"foot{sx}", SOCK, F, loc=(0, -0.05, -0.02), scale=(0.045, 0.095, 0.04), seg=24, rings=16, lv=1)
    LEG[sx] = (T, K, F)

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
def aim_piv(pv, target):
    """rotate a pivot so its local -Z (the limb) points at a world target"""
    bpy.context.view_layer.update()
    pm = pv.parent.matrix_world.to_3x3().normalized() if pv.parent else Matrix.Identity(3)
    d = pm.inverted() @ (Vector(target) - pv.matrix_world.translation)
    pv.rotation_euler = Vector((0, 0, -1)).rotation_difference(d).to_euler()
def ik2(A, B, target, pole, L1, L2):
    """two-bone IK: A (shoulder/hip) and B (elbow/knee) pivots, limb lengths L1/L2"""
    bpy.context.view_layer.update()
    S = A.matrix_world.translation.copy(); T = Vector(target); d = T - S; dist = max(0.05, min(d.length, L1 + L2 - 1e-3))
    n = d.normalized(); a_ = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist); h = math.sqrt(max(0.0, L1 * L1 - a_ * a_))
    pv = Vector(pole) - S; pv = (pv - n * pv.dot(n)).normalized(); E = S + n * a_ + pv * h
    aim_piv(A, E); aim_piv(B, T)
def stage(f):
    t = f / FPS
    br = math.sin(t * 2 * math.pi / 4.0)
    turn = K_(t, [(0, 0), (3.0, 0), (5.2, 1), (10, 1)])            # toward the door (her left)
    reach = K_(t, [(0, 0), (5.0, 0), (6.6, 1), (8.6, 1), (9.6, 0.2)])   # her left hand to the door
    out = K_(t, [(8.4, 0), (8.5, 1)])                                # the light under the door goes out
    down = K_(t, [(8.5, 0), (9.6, 1)])
    SP.rotation_euler = (D(-8 + 1.2 * br), 0, D(5 * turn))
    CH.rotation_euler = (D(2 * br), 0, D(4 * turn))
    NK.rotation_euler = (D(14 - 8 * turn + 12 * down), D(-4 * turn), D(18 * turn))
    HD.rotation_euler = (D(6 - 2 * turn), D(-14 * turn + 4 * down), D(16 * turn))
    bpy.context.view_layer.update()
    hipw = HIP.matrix_world.translation
    knees = {}
    for sx in (-1, 1):
        T, Kn, F = LEG[sx]
        foot = hipw + Vector((sx * 0.12, -0.52, -hipw.z + 0.04))
        ik2(T, Kn, foot, hipw + Vector((sx * 0.1, -0.4, 0.9)), 0.38, 0.31)
        F.rotation_euler = (D(70), 0, 0)
        bpy.context.view_layer.update(); knees[sx] = Kn.matrix_world.translation.copy()
    for sx in (-1, 1):
        S, E, Wr = ARM[sx]
        rest = knees[sx] + Vector((-sx * 0.05, -0.05, 0.06))
        tgt = rest
        if sx == 1: tgt = rest.lerp(Vector((DX0 + 0.12, -0.005, 0.62)), reach)
        bpy.context.view_layer.update(); Sw = S.matrix_world.translation
        pole = Sw + Vector((sx * 0.35, -0.15, -0.25)) if not (sx == 1 and reach > 0.5) else Sw + Vector((0.1, -0.3, -0.4))
        ik2(S, E, tgt, pole, 0.24, 0.23)
        Wr.rotation_euler = (D(10), 0, D(sx * -20 + (70 * reach if sx == 1 else 0)))
    # face: blink, a softer brow when she turns, eyes close at the end
    blink = max(0.0, 1 - abs(t - 1.6) / 0.09) + max(0.0, 1 - abs(t - 6.9) / 0.09)
    close = K_(t, [(8.8, 0), (9.7, 0.55)])
    for e in EYES:
        lc = max(blink, close); e["lid"].scale = (1, 1, 0.02 + 0.98 * lc); e["lid"].hide_render = lc < 0.03
        e["brow"].rotation_euler = (0, D(90 * e["sx"]), D(e["sx"] * (8 + 6 * turn)))
    SLIT.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 12.0 * (1 - out)
    slitlight.data.energy = 14 * (1 - out)
    # camera: eye level of the sitting woman, from the hallway, slow push-in
    bpy.context.view_layer.update()
    u = smooth(t / 10.0)
    cam.location = Vector((mix(-0.85, -0.75, u), mix(-2.0, -1.78, u), mix(0.86, 0.82, u)))
    aim(cam, (0.2, -0.2, 0.62)); cam.data.lens = 30
    cam.data.dof.focus_distance = (HD.matrix_world @ HC - cam.location).length

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
