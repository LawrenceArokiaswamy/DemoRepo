# Look test 35: a smooth, sculpted-style character (one rounded head, sculpted hair locks, soft clothes)
# in cinematic night lighting. Original design: "Mom" — low bun, rust knit cardigan, holding an old photo.
# Beat (5 s): she looks down at the photo, wistful -> a soft smile grows -> eyes glisten -> she closes her eyes, smiling.
# usage: blender python look.py -- outdir [--frames a,b,..] [--range a b] [--scale pct] [--spp n]
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "34-first-home", "blender"))
from lib import lin, mat, img_mat, piv, plane, area, point, aim, smooth, mix, clamp01

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "out"
def arg(k, d=None):
    return argv[argv.index(k) + 1] if k in argv else d
FPS, N = 30, 150
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene

# ---------------- geometry helpers ----------------
def link(o, parent=None):
    sc.collection.objects.link(o)
    if parent is not None: o.parent = parent
    return o

def subsurf(o, lv=2):
    m = o.modifiers.new("ss", 'SUBSURF'); m.levels = 1; m.render_levels = lv; return o

def uvsphere(name, m, parent=None, loc=(0, 0, 0), scale=(1, 1, 1), deform=None, seg=48, rings=32, keep=None, smooth_lv=1):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    for v in bm.verts:
        c = Vector(v.co); c = Vector((c.x * scale[0], c.y * scale[1], c.z * scale[2]))
        if deform: c = deform(c)
        v.co = c
    if keep:
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); o.data.materials.append(m); link(o, parent); o.location = loc
    if smooth_lv: subsurf(o, smooth_lv)
    return o

def _frames(pts, up=None):
    T = []
    for i in range(len(pts)):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]; T.append((b - a).normalized())
    Ns = []
    if up is not None:
        for i, t in enumerate(T):
            u = up[i] if isinstance(up, list) else up
            n = (u - t * u.dot(t)); Ns.append(n.normalized() if n.length > 1e-6 else t.orthogonal().normalized())
    else:
        n = T[0].orthogonal().normalized()
        for t in T:
            n = (n - t * n.dot(t)).normalized(); Ns.append(n)
    return T, Ns

def tube_into(me, pts, radii, seg=10, flat=1.0, up=None, cap=True):
    """tube along pts; ring = r*(cos a * N * flat + sin a * B). up gives N (e.g. surface normal) so flat locks lie on the head."""
    pts = [Vector(p) for p in pts]; T, Ns = _frames(pts, up)
    bm = bmesh.new(); rings = []
    for p, t, n, r in zip(pts, T, Ns, radii):
        b = t.cross(n); ring = []
        for k in range(seg):
            a = 2 * math.pi * k / seg
            ring.append(bm.verts.new(p + r * (math.cos(a) * n * flat + math.sin(a) * b)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    if cap:
        c0 = bm.verts.new(pts[0] - T[0] * radii[0] * 0.6); c1 = bm.verts.new(pts[-1] + T[-1] * radii[-1] * 0.6)
        for k in range(seg):
            bm.faces.new((c0, rings[0][(k + 1) % seg], rings[0][k]))
            bm.faces.new((c1, rings[-1][k], rings[-1][(k + 1) % seg]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True

def tube(name, pts, radii, m, parent=None, seg=10, flat=1.0, up=None, lv=2):
    me = bpy.data.meshes.new(name); tube_into(me, pts, radii, seg, flat, up)
    o = bpy.data.objects.new(name, me); o.data.materials.append(m); link(o, parent); subsurf(o, lv); return o

def catmull(ctrl, n=24):
    P = [Vector(c) for c in ctrl]; P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for j in range(n):
            t = j / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2]); return out

def prof(n, r0, rm, r1, bias=0.5):
    """radius profile along a lock: r0 at root, rm in the middle, r1 at tip"""
    out = []
    for i in range(n):
        t = i / (n - 1)
        if t < bias: out.append(mix(r0, rm, math.sin(t / bias * math.pi / 2)))
        else: out.append(mix(rm, r1, ((t - bias) / (1 - bias)) ** 1.4))
    return out

# ---------------- materials ----------------
def knit(name, hexcol):
    m = bpy.data.materials.new(name); m.use_nodes = True; Nn = m.node_tree.nodes; L = m.node_tree.links
    b = Nn["Principled BSDF"]; b.inputs["Base Color"].default_value = (*lin(hexcol), 1); b.inputs["Roughness"].default_value = 0.85
    b.inputs["Sheen Weight"].default_value = 0.15; b.inputs["Sheen Tint"].default_value = (1, 0.85, 0.75, 1)
    tc = Nn.new("ShaderNodeTexCoord"); w = Nn.new("ShaderNodeTexWave"); w.wave_type = 'BANDS'; w.bands_direction = 'X'
    w.inputs["Scale"].default_value = 60; w.inputs["Distortion"].default_value = 2.0
    nz = Nn.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 300
    mx = Nn.new("ShaderNodeMath"); mx.operation = 'ADD'
    bp = Nn.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.35; bp.inputs["Distance"].default_value = 0.003
    L.new(tc.outputs["Object"], w.inputs["Vector"]); L.new(tc.outputs["Object"], nz.inputs["Vector"])
    L.new(w.outputs["Fac"], mx.inputs[0]); L.new(nz.outputs["Fac"], mx.inputs[1]); L.new(mx.outputs[0], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"]); return m

SKIN = mat("skin", "#e9b48f", rough=0.48, sss=0.18)
LIP = mat("lip", "#b9645a", rough=0.4, sss=0.1)
BLUSH = mat("blush", "#f07c7c", rough=0.6, alpha=0.5)
HAIR = mat("hair", "#2a1810", rough=0.38, coat=0.35)
HAIR_HI = mat("hair_hi", "#3b2418", rough=0.35, coat=0.35)
SCLERA = mat("sclera", "#f3ede6", rough=0.25, coat=1.0)
def iris_mat():
    m = bpy.data.materials.new("irisring"); m.use_nodes = True; Nn = m.node_tree.nodes; L = m.node_tree.links
    b = Nn["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.25; b.inputs["Coat Weight"].default_value = 1.0
    tc = Nn.new("ShaderNodeTexCoord"); g = Nn.new("ShaderNodeTexGradient"); g.gradient_type = 'SPHERICAL'
    mp = Nn.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.0, 0.0, 1.0)
    nz = Nn.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 18; nz.inputs["Detail"].default_value = 4
    mxn = Nn.new("ShaderNodeMix"); mxn.data_type = 'FLOAT'; mxn.inputs["Factor"].default_value = 0.12
    cr = Nn.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.0; E[0].color = (*lin("#1c0d06"), 1); E[1].position = 0.86; E[1].color = (*lin("#070303"), 1)
    for pos, col in [(0.08, "#4a2410"), (0.35, "#9a5a26"), (0.62, "#c98a3e"), (0.74, "#5a3014")]:
        e = E.new(pos); e.color = (*lin(col), 1)
    L.new(tc.outputs["Object"], mp.inputs["Vector"]); L.new(mp.outputs["Vector"], g.inputs["Vector"]); L.new(tc.outputs["Object"], nz.inputs["Vector"])
    L.new(g.outputs["Fac"], mxn.inputs["A"]); L.new(nz.outputs["Fac"], mxn.inputs["B"]); L.new(mxn.outputs["Result"], cr.inputs["Fac"])
    L.new(cr.outputs["Color"], b.inputs["Base Color"]); return m
IRIS = iris_mat()
CORNEA = mat("cornea", "#ffffff", rough=0.02, trans=1.0, coat=1.0)
PUPIL = mat("pupil", "#100907", rough=0.15, coat=1.0)
GLINT = mat("glint", "#ffffff", emit=6.0)
LASH = mat("lash", "#1a0f0a", rough=0.5)
BROW = mat("brow", "#2e1c13", rough=0.7)
TEAR = mat("tear", "#ffffff", rough=0.02, trans=1.0, coat=1.0)
CARD = knit("cardigan", "#6a2216")
TOP = knit("top", "#efe4d2")
EAR = mat("earring", "#e8c46a", rough=0.2, metal=1.0)

# ---------------- character ----------------
ROOT = piv("mom", loc=(0, 0, 0))
CH = piv("chest", ROOT, loc=(0, 0.02, 0.86))          # breathing pivot
NECK = piv("neck", CH, loc=(0, 0.0, 0.215))
HEAD = piv("head", NECK, loc=(0, 0.0, 0.05))
R = 0.155; HC = Vector((0, 0.0, 0.14))                # head radius and centre (head-pivot coords)

def head_deform(c):
    x, y, z = c
    k = clamp01(-z / R)                               # lower half: jaw narrows, chin comes forward a touch
    x *= 1 - 0.30 * k ** 1.6
    y *= 1 - 0.18 * k ** 1.3
    if y > 0: y *= 1.06                               # rounder back of the head
    for sx in (-1, 1):                                # soft cheeks
        g = math.exp(-(((x - sx * 0.58 * R) / (0.30 * R)) ** 2 + ((y + 0.62 * R) / (0.35 * R)) ** 2 + ((z + 0.22 * R) / (0.28 * R)) ** 2))
        x += sx * 0.05 * R * g; y -= 0.06 * R * g
    g = math.exp(-((x / (0.25 * R)) ** 2 + ((z + 0.78 * R) / (0.2 * R)) ** 2))
    y -= 0.05 * R * g
    return Vector((x, y, z)) + HC

head = uvsphere("headmesh", SKIN, HEAD, scale=(R * 0.97, R * 0.93, R * 1.05), deform=head_deform, seg=64, rings=48, smooth_lv=0)
bpy.context.view_layer.update()

def surf(x, z, off=0.0):
    """point on the face surface (head-pivot coords) seen straight from the front, pushed out by off"""
    ok, loc, nor, _ = head.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
    if not ok: return Vector((x, HC.y - R, z)), Vector((0, -1, 0))
    return loc + nor * off, nor
subsurf(head, 2)

# ears + earrings
for sx in (-1, 1):
    ear = uvsphere(f"ear{sx}", SKIN, HEAD, loc=HC + Vector((sx * R * 0.95, 0.01, -0.01)), scale=(0.012, 0.024, 0.034))
    ear.rotation_euler = (0, sx * 0.25, 0)
    uvsphere(f"earring{sx}", EAR, HEAD, loc=HC + Vector((sx * R * 0.98, 0.0, -0.045)), scale=(0.006, 0.006, 0.006), seg=16, rings=8)

# nose
np_, nn = surf(0, HC.z - 0.03)
uvsphere("nose", SKIN, HEAD, loc=np_ + nn * -0.004 + Vector((0, 0, 0.0)), scale=(0.012, 0.011, 0.015))
uvsphere("nosetip", SKIN, HEAD, loc=np_ + Vector((0, -0.007, -0.005)), scale=(0.008, 0.008, 0.007))

# eyes (unit-eye coords under a scaled pivot)
EYE_R = 0.024; EYES = []
BEAD = mat("bead", "#0d0806", rough=0.06, coat=1.0)
for sx in (-1, 1):
    ep, en = surf(sx * 0.058, HC.z + 0.002)
    E = piv(f"eye{sx}", HEAD, loc=ep + Vector((0, 0.013, 0)))
    E.scale = (EYE_R * 0.92, EYE_R * 0.7, EYE_R * 1.22); E.rotation_euler = (0, sx * -0.12, sx * -0.18)
    uvsphere(f"bead{sx}", BEAD, E, scale=(1, 1, 1), seg=40, rings=28)
    G = piv(f"gaze{sx}", E)
    uvsphere(f"glint{sx}", GLINT, G, loc=(-0.3, -0.98, 0.32), scale=(0.24, 0.05, 0.24), seg=12, rings=8, smooth_lv=0)
    uvsphere(f"glint2{sx}", GLINT, G, loc=(0.26, -0.98, -0.26), scale=(0.1, 0.04, 0.1), seg=12, rings=8, smooth_lv=0)
    LU = piv(f"lidU{sx}", E)
    uvsphere(f"lidUm{sx}", SKIN, LU, scale=(1.02, 1.02, 1.02), keep=lambda c: c.z > -0.02, seg=40, rings=24)
    LL = piv(f"lidL{sx}", E)
    uvsphere(f"lidLm{sx}", SKIN, LL, scale=(1.018, 1.018, 1.018), keep=lambda c: c.z < 0.02, seg=40, rings=24)
    tr = tube(f"tear{sx}", [Vector((1.0 * math.sin(math.radians(d)), -1.03 * math.cos(math.radians(d)), -0.02)) for d in range(-60, 64, 8)],
              [0.07] * 16, TEAR, LL, seg=8, flat=0.7, lv=1)
    EYES.append(dict(E=E, G=G, LU=LU, LL=LL, tear=tr, sx=sx))

# brows, mouth, blush: rebuilt per frame along the face surface
browme = {}
for sx in (-1, 1):
    me = bpy.data.meshes.new(f"brow{sx}"); o = bpy.data.objects.new(f"brow{sx}", me); o.data.materials.append(BROW); link(o, HEAD); subsurf(o, 1)
    browme[sx] = me
mouthme = bpy.data.meshes.new("mouth"); mo = bpy.data.objects.new("mouth", mouthme); mo.data.materials.append(LIP); link(mo, HEAD); subsurf(mo, 1)
for sx in (-1, 1):
    bp_, bn = surf(sx * 0.07, HC.z - 0.045, 0.002)
    b = uvsphere(f"blush{sx}", BLUSH, HEAD, loc=bp_, scale=(0.026, 0.008, 0.016), seg=24, rings=12)
    b.rotation_euler = (0, 0, sx * 0.5)

def set_brow(sx, inner, outer):
    xs = [0.024, 0.04, 0.058, 0.075, 0.088]; pts = []; ups = []
    for i, x in enumerate(xs):
        t = i / (len(xs) - 1)
        z = HC.z + 0.056 + 0.010 * math.sin(t * math.pi) * 0.9 + inner * 0.012 * (1 - t) ** 1.5 + outer * 0.006 * t - 0.004 * t
        p, n = surf(sx * x, z, 0.003); pts.append(p); ups.append(n)
    tube_into(browme[sx], pts, prof(len(pts), 0.0045, 0.0062, 0.0025, 0.35), seg=8, flat=0.45, up=ups)

def set_mouth(smile, open_=0.0):
    w = 0.026 * (1 + 0.22 * smile); pts = []; ups = []
    for i in range(9):
        u = -1 + 2 * i / 8
        z = HC.z - 0.083 + smile * 0.011 * (u * u) - smile * 0.003 - 0.0015 * (1 - u * u)
        p, n = surf(u * w, z, 0.0015); pts.append(p); ups.append(n)
    tube_into(mouthme, pts, [0.0022, 0.0032, 0.0042, 0.0046, 0.0048, 0.0046, 0.0042, 0.0032, 0.0022], seg=8, flat=0.55, up=ups)

# hair: cap + sculpted locks swept back into a low bun
HS = Vector((R * 0.97, R * 0.93, R * 1.05))
def hdir(d, k=1.0):
    d = Vector(d).normalized(); return HC + Vector((d.x * HS.x, d.y * HS.y, d.z * HS.z)) * k
def keepcap(c):
    c = c - HC; c = Vector((c.x / HS.x, c.y / HS.y, c.z / HS.z))
    if c.y < -0.2 and c.z < 0.5 - 0.25 * abs(c.x): return False      # face opening with a soft hairline
    if c.z < -0.25 and c.y < 0.35: return False                        # below the ears at the front/sides
    if c.z < -0.75: return False
    return True
HAIRC = mat("hairclay", "#4a2617", rough=0.42, coat=0.3)
def bob_def(c):
    """sculpted bob: shell around the head, longer at the sides, cut in a fringe at the front, curled under at the ends"""
    d = Vector(c).normalized(); x, y, z = d
    az = math.atan2(x, -y)                                      # 0 = front
    r = 1.0 + 0.10 * clamp01((z + 0.2) / 1.2)                   # volume grows toward the crown
    r += 0.035 * math.sin(az * 9 + 0.6) * clamp01(0.3 - z) * 0.6   # soft sculpted sections lower down
    if z < -0.35: r -= (-0.35 - z) * 0.45                       # ends curl in toward the jaw
    p = Vector((x * HS.x, y * HS.y * (1.06 if y > 0 else 1.0), z * HS.z)) * r * 1.08
    return p + HC
def keep_bob(c):
    c = c - HC; c = Vector((c.x / HS.x, c.y / HS.y, c.z / HS.z)).normalized(); x, y, z = c
    fr = 0.6 - 0.36 * clamp01((x + 0.6) / 1.2)                  # fringe line: low over her left brow, high on the right (side part)
    if y < -0.25 and z < fr and abs(x) < 0.72: return False     # face opening
    if z < -0.78: return False                                  # bob length: just above the jaw
    if y < -0.1 and z < -0.15 and abs(x) < 0.82: return False   # keep the cheeks clear
    return True
hair = uvsphere("hairbob", HAIRC, HEAD, scale=(1, 1, 1), deform=lambda c: bob_def(c), keep=keep_bob, seg=160, rings=110, smooth_lv=0)
_bm = bmesh.new(); _bm.from_mesh(hair.data)                    # smooth the cut edge into a clean hairline
for _ in range(40):
    bv = [v for v in _bm.verts if v.is_boundary]; new = {}
    for v in bv:
        nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
        if len(nb) == 2: new[v] = v.co * 0.5 + (nb[0].co + nb[1].co) * 0.25
    for v, c in new.items(): v.co = c
_bm.to_mesh(hair.data); _bm.free()
so = hair.modifiers.new("sol", 'SOLIDIFY'); so.thickness = 0.018; so.offset = -1
subsurf(hair, 3)
# a soft swoop of fringe across the forehead (one sculpted lock) and a small low bun
swoop = [hdir((0.34, -0.25, 0.93), 1.1), hdir((0.05, -0.8, 0.68), 1.115), hdir((-0.38, -0.86, 0.56), 1.115), hdir((-0.78, -0.55, 0.32), 1.1), hdir((-0.95, -0.2, 0.1), 1.09)]
tube("fringe", catmull(swoop, 8), prof(33, 0.02, 0.045, 0.015, 0.45), HAIRC, HEAD, seg=16, flat=0.28, up=[(p - HC).normalized() for p in catmull(swoop, 8)], lv=3)
BUN = hdir((0, 0.92, -0.18), 1.12); uvsphere("bun", HAIRC, HEAD, loc=BUN, scale=(0.055, 0.05, 0.05), seg=40, rings=24, smooth_lv=2)
# neck + body
tube("neckm", [Vector((0, 0.005, -0.06)), Vector((0, 0.005, 0.04)), Vector((0, 0.01, 0.12))], [0.047, 0.044, 0.044], SKIN, NECK, seg=16)
def torso_def(c):
    x, y, z = c
    if z > 0: x *= 1 + 0.18 * (z / 0.26) ** 2; y *= 1 - 0.12 * (z / 0.26) ** 2
    return Vector((x, y, z))
uvsphere("topm", TOP, CH, scale=(0.15, 0.112, 0.26), deform=torso_def, seg=48, rings=32)
def vcut(c):
    return not (c.y < -0.03 and abs(c.x) < 0.11 * clamp01((c.z + 0.02) / 0.3) + 0.012 and c.z > -0.02) and c.z < 0.27
card = uvsphere("cardm", CARD, CH, scale=(0.162, 0.124, 0.265), deform=torso_def, keep=vcut, seg=56, rings=36)
s2 = card.modifiers.new("sol", 'SOLIDIFY'); s2.thickness = 0.012; card.modifiers.move(1, 0)
# V-neck rib edges
for sx in (-1, 1):
    pts = [Vector((sx * (0.11 * clamp01((z + 0.02) / 0.3) + 0.014), -0.122 + 0.13 * clamp01(z / 0.27) ** 3, z)) for z in [-0.02 + 0.03 * i for i in range(10)]]
    tube(f"rib{sx}", pts, [0.011] * len(pts), CARD, CH, seg=8, flat=0.6)

# arms (rebuilt per frame toward the hands) + hands holding the photo
PH = piv("photo_grp", ROOT, loc=(0.0, -0.27, 0.99), rot=(math.radians(62), 0, 0))
PHOTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "34-first-home", "blender", "tex", "photo.png")
pf = plane("photo", 0.12, 0.15, img_mat("photoimg", PHOTO, rough=0.35), PH, loc=(0, 0, 0), rot=(math.radians(-90), 0, math.pi))
pb = plane("photoback", 0.122, 0.152, mat("photoback", "#f1ece2", rough=0.7), PH, loc=(0, -0.0012, 0), rot=(math.radians(90), 0, 0))
hands = {}
for sx in (-1, 1):
    Hh = piv(f"hand{sx}", PH, loc=(sx * 0.064, 0.0, -0.01), rot=(0, 0, 0))
    uvsphere(f"palm{sx}", SKIN, Hh, loc=(sx * 0.012, 0.012, -0.012), scale=(0.02, 0.016, 0.034))
    for f in range(4):                                     # fingers curl round the back of the photo (camera side)
        z0 = 0.016 - f * 0.014
        pts = [Vector((sx * 0.02, 0.004, z0)), Vector((sx * 0.004, -0.008, z0)), Vector((-sx * 0.012, -0.012, z0 - 0.002)), Vector((-sx * 0.022, -0.007, z0 - 0.004))]
        tube(f"fing{sx}{f}", catmull(pts, 4), [0.0072, 0.0072, 0.007, 0.0066, 0.006, 0.0055, 0.0052, 0.005, 0.0048, 0.0045, 0.0042, 0.004, 0.0038][:13], SKIN, Hh, seg=8)
    TH = piv(f"thumbp{sx}", Hh, loc=(sx * 0.012, 0.02, 0.0))
    tube(f"thumb{sx}", catmull([Vector((0, 0, -0.012)), Vector((-sx * 0.012, 0.004, 0.006)), Vector((-sx * 0.022, 0.003, 0.02))], 5),
         prof(11, 0.009, 0.0085, 0.006, 0.4), SKIN, TH, seg=8)
    hands[sx] = (Hh, TH)
armme = {}
for sx in (-1, 1):
    me = bpy.data.meshes.new(f"arm{sx}"); o = bpy.data.objects.new(f"arm{sx}", me); o.data.materials.append(CARD); link(o, ROOT); subsurf(o, 2)
    me2 = bpy.data.meshes.new(f"cuff{sx}"); o2 = bpy.data.objects.new(f"cuff{sx}", me2); o2.data.materials.append(CARD); link(o2, ROOT); subsurf(o2, 2)
    armme[sx] = (me, me2)
def set_arms():
    bpy.context.view_layer.update()
    for sx in (-1, 1):
        sh = CH.matrix_world @ Vector((sx * 0.155, 0.0, 0.19))
        wr = hands[sx][0].matrix_world @ Vector((sx * 0.03, 0.02, -0.03))
        el = Vector((sx * 0.21, 0.07, 0.83)); el.z = min(el.z, wr.z - 0.1)
        pts = catmull([sh, sh + Vector((sx * 0.03, 0.02, -0.1)), el, el.lerp(wr, 0.5) + Vector((0, -0.01, -0.015)), wr], 6)
        r = [mix(0.04, 0.035, i / (len(pts) - 1)) for i in range(len(pts))]
        tube_into(armme[sx][0], pts, r, seg=14)
        d = (wr - pts[-3]).normalized()
        tube_into(armme[sx][1], [wr - d * 0.03, wr - d * 0.005, wr + d * 0.006], [0.038, 0.039, 0.036], seg=14)

# ---------------- set: night window, city bokeh, warm lamp ----------------
WALL = mat("wall", "#2d2730", rough=0.9)
FRAME = mat("frame", "#16131a", rough=0.6)
WOOD = mat("wood", "#5b3a26", rough=0.45, coat=0.3)
BLD = mat("bld", "#0c0e16", rough=0.9)
plane("table", 1.6, 0.8, WOOD, None, loc=(0, -0.55, 0.8), rot=(0, 0, 0))
plane("tableedge", 1.6, 0.04, WOOD, None, loc=(0, -0.95, 0.78))
# back wall with a big window (four wall pieces around the opening)
for nm, w, h, x, z in [("wl", 1.2, 3, -1.55, 1.5), ("wr", 1.2, 3, 1.55, 1.5), ("wt", 2.0, 0.8, 0, 2.6), ("wb", 2.0, 0.6, 0, 0.3)]:
    plane(nm, w, h, WALL, None, loc=(x, 1.3, z))
for x in (-0.95, 0.0, 0.95):
    plane(f"mull{x}", 0.05, 1.7, FRAME, None, loc=(x, 1.28, 1.45))
for z in (0.6, 2.2):
    plane(f"rail{z}", 1.95, 0.06, FRAME, None, loc=(0, 1.28, z))
rnd = random.Random(7)
WINS = [mat(f"cw{i}", c, emit=e) for i, (c, e) in enumerate([("#ffcf8a", 6), ("#ffe2b0", 4), ("#9fc4ff", 4), ("#ffb36b", 5)])]
for b in range(14):
    x = -9 + b * 1.4 + rnd.uniform(-0.3, 0.3); d = rnd.uniform(9, 22); h = rnd.uniform(2.5, 9); w = rnd.uniform(0.9, 1.6)
    plane(f"b{b}", w, h, BLD, None, loc=(x * d / 12, 1.3 + d, h / 2 - 1.5))
    for k in range(rnd.randint(6, 16)):
        plane(f"bw{b}_{k}", 0.12, 0.16, rnd.choice(WINS), None, loc=(x * d / 12 + rnd.uniform(-w / 2.5, w / 2.5), 1.25 + d, rnd.uniform(-1.2, h - 1.8)))
SKY = mat("sky", "#1b2747", emit=0.35)
plane("sky", 60, 30, SKY, None, loc=(0, 26, 6))
FAIRY = mat("fairy", "#ffc77a", emit=14)
for i in range(26):
    t = i / 25; x = -0.95 + 1.9 * t
    uvsphere(f"fl{i}", FAIRY, None, loc=(x, 1.2, 2.05 - 0.18 * math.sin(t * math.pi) + 0.03 * math.sin(i * 1.7)), scale=(0.012,) * 3, seg=10, rings=6, smooth_lv=0)
# lamp on the table (left), mug, small plant
SHADE = mat("shade", "#ffd9a0", emit=2.5, rough=0.8)
LMET = mat("lampmetal", "#2a2420", rough=0.3, metal=0.8)
tube("lampstem", [Vector((-0.5, -0.35, 0.8)), Vector((-0.5, -0.35, 1.12))], [0.012, 0.012], LMET, None, seg=12)
uvsphere("lampshade", SHADE, None, loc=(-0.5, -0.35, 1.18), scale=(0.11, 0.11, 0.08), keep=lambda c: abs(c.z) < 0.06, seg=40, rings=16)
MUG = mat("mug", "#d9cfc0", rough=0.3, coat=0.5)
tube("mug", [Vector((0.3, -0.55, 0.8)), Vector((0.3, -0.55, 0.9))], [0.04, 0.04], MUG, None, seg=24)

# lights
WARM = (1.0, 0.72, 0.45); COOL = (0.45, 0.62, 1.0)
key = area("key", (-0.8, -0.3, 1.4), (0, 0, 1.15), 0.35, 60, WARM)
area("bounce", (0.3, -1.0, 0.95), (0, 0, 1.15), 1.0, 2.0, (1.0, 0.8, 0.65))
rim = area("rim", (0.6, 0.7, 1.6), (0, 0.05, 1.2), 0.5, 140, COOL)
rim2 = area("rim2", (-0.7, 0.9, 1.5), (0, 0.05, 1.15), 0.5, 30, COOL)
point("lampbulb", (-0.5, -0.35, 1.16), 18, WARM, 0.04)

# camera / world / render
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); link(cam); sc.camera = cam
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 1.8; cam.data.sensor_width = 36
w = bpy.data.worlds.new("w"); sc.world = w; w.color = (0.006, 0.007, 0.012)
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(arg("--spp", 32)); sc.cycles.use_denoising = True
sc.cycles.adaptive_threshold = 0.03; sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 3
sc.cycles.transmission_bounces = 4; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920; sc.render.resolution_percentage = int(arg("--scale", 50))
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.fps = FPS

# ---------------- performance ----------------
def K(t, keys):
    if t <= keys[0][0]: return keys[0][1]
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if t <= b: return mix(va, vb, smooth((t - a) / (b - a)))
    return keys[-1][1]

def stage(f):
    t = f / FPS
    breath = math.sin(t * 2 * math.pi / 3.6)
    CH.scale = (1, 1, 1 + 0.008 * breath); CH.location.z = 0.86 + 0.003 * breath - K(t, [(3.8, 0), (4.6, 0.008)])
    nod = K(t, [(0, 0.34), (1.6, 0.31), (3.4, 0.27), (5, 0.24)])
    tilt = K(t, [(0, 0.03), (1.4, 0.05), (3.4, 0.17), (5, 0.2)])
    NECK.rotation_euler = (nod * 0.35, 0, 0)
    HEAD.rotation_euler = (nod * 0.65, tilt, K(t, [(0, 0.05), (5, 0.1)]))
    smile = K(t, [(0, 0.0), (1.9, 0.04), (3.5, 0.85), (5, 0.95)])
    brin = K(t, [(0, 0.15), (1.4, 0.95), (3.0, 0.55), (5, 0.35)])
    blink = max(0.0, 1 - abs(t - 0.75) / 0.12)
    close = K(t, [(3.95, 0.0), (4.6, 1.0)])
    for e in EYES:
        sx = e["sx"]
        e["G"].rotation_euler = (math.radians(K(t, [(0, 22), (5, 19)])), 0, math.radians(sx * 2))
        up = mix(-6 + 16 * smile, 84, max(blink, close))
        e["LU"].rotation_euler = (math.radians(up), 0, 0)
        e["LL"].rotation_euler = (math.radians(mix(34 - 26 * smile, 12, close)), 0, 0)
        e["tear"].scale = (1, 1, 1) if t > 2.6 else (0.001,) * 3
        e["tear"].hide_render = t < 2.6
        set_brow(sx, brin, 0.2 * smile)
    set_mouth(smile)
    PH.location = (0.0, -0.27, 0.99 + K(t, [(0, 0), (3.5, 0.012), (5, 0.016)]))
    PH.rotation_euler = (math.radians(K(t, [(0, 62), (5, 58)])), 0, 0)
    hands[1][1].rotation_euler = (0, math.radians(8 * math.sin(max(0, t - 2.2) * 3.0)) if 2.2 < t < 3.9 else 0, 0)
    set_arms()
    bpy.context.view_layer.update()
    hp = HEAD.matrix_world @ HC
    d = K(t, [(0, 1.42), (5, 1.18)])
    dirv = Vector((-0.42, -1.0, 0.1)).normalized()
    cam.location = hp + dirv * d + Vector((0, 0, -0.02))
    aim(cam, hp + Vector((0.0, 0, -0.07))); cam.data.lens = 52
    if "--portrait" in argv:                                  # look-dev camera: straight at her face
        NECK.rotation_euler = (0.05, 0, 0); HEAD.rotation_euler = (0.02, 0.08, 0.12)
        for e in EYES: e['G'].rotation_euler = (0, 0, 0); e['LU'].rotation_euler = (math.radians(-70 + 25 * smile), 0, 0); e['LL'].rotation_euler = (math.radians(70 - 30 * smile), 0, 0)
        bpy.context.view_layer.update()
        hp = HEAD.matrix_world @ HC; cam.location = hp + Vector((-0.3, -1.05, 0.04)); aim(cam, hp + Vector((0, 0, -0.03))); cam.data.lens = 58
    eye = EYES[0]["E"].matrix_world.translation
    cam.data.dof.focus_distance = (eye - cam.location).length

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
