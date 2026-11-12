# Film 32 (Blender): toy-style characters built from code. Rigid rounded parts on a pivot hierarchy (no skinning):
# big round head, dot eyes with a catch light, brows and a mouth curve that carry the emotion, rounded torso, tube limbs.
import bpy, bmesh, math
from mathutils import Vector

# ---------- materials ----------
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

_M = {}
def mat(name, hexcol, rough=0.6, sss=0.0, sheen=0.0, emit=0.0, coat=0.0):
    if name in _M: return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; c = lin(hexcol)
    b.inputs["Base Color"].default_value = (*c, 1); b.inputs["Roughness"].default_value = rough
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss; b.inputs["Subsurface Radius"].default_value = (1.0, 0.45, 0.25)
        b.inputs["Subsurface Scale"].default_value = 0.02
    if sheen: b.inputs["Sheen Weight"].default_value = sheen
    if coat: b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*c, 1); b.inputs["Emission Strength"].default_value = emit
    _M[name] = m; return m

def plaid(name, base, dark, line, scale=9.0):
    """procedural flannel: two crossing band sets + thin light lines, in object space"""
    if name in _M: return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.85; b.inputs["Sheen Weight"].default_value = 0.4
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    def band(axis, width, off=0.0):
        mul = N.new("ShaderNodeMath"); mul.operation = 'MULTIPLY_ADD'; mul.inputs[1].default_value = scale; mul.inputs[2].default_value = off
        L.new(sep.outputs[axis], mul.inputs[0])
        fr = N.new("ShaderNodeMath"); fr.operation = 'FRACT'; L.new(mul.outputs[0], fr.inputs[0])
        lt = N.new("ShaderNodeMath"); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = width; L.new(fr.outputs[0], lt.inputs[0])
        return lt
    bx, bz = band(0, 0.42), band(2, 0.42)
    lx, lz = band(0, 0.05, 0.7), band(2, 0.05, 0.7)
    add = N.new("ShaderNodeMath"); add.operation = 'ADD'; L.new(bx.outputs[0], add.inputs[0]); L.new(bz.outputs[0], add.inputs[1])
    half = N.new("ShaderNodeMath"); half.operation = 'MULTIPLY'; half.inputs[1].default_value = 0.5; L.new(add.outputs[0], half.inputs[0])
    m1 = N.new("ShaderNodeMix"); m1.data_type = 'RGBA'; L.new(half.outputs[0], m1.inputs["Factor"])
    m1.inputs["A"].default_value = (*lin(base), 1); m1.inputs["B"].default_value = (*lin(dark), 1)
    ladd = N.new("ShaderNodeMath"); ladd.operation = 'MAXIMUM'; L.new(lx.outputs[0], ladd.inputs[0]); L.new(lz.outputs[0], ladd.inputs[1])
    m2 = N.new("ShaderNodeMix"); m2.data_type = 'RGBA'; L.new(ladd.outputs[0], m2.inputs["Factor"])
    L.new(m1.outputs["Result"], m2.inputs["A"]); m2.inputs["B"].default_value = (*lin(line), 1)
    # cloth weave bump
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 900; L.new(tc.outputs["Object"], nz.inputs["Vector"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.12; L.new(nz.outputs["Fac"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    L.new(m2.outputs["Result"], b.inputs["Base Color"])
    _M[name] = m; return m

def knit(name, hexcol, scale=700, strength=0.25):
    if name in _M: return _M[name]
    m = mat(name + "_b", hexcol, rough=0.9, sheen=0.6); m.name = name; nt = m.node_tree; N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); w = N.new("ShaderNodeTexWave"); w.inputs["Scale"].default_value = scale * 0.06
    w.inputs["Distortion"].default_value = 2; w.inputs["Detail"].default_value = 3; L.new(tc.outputs["Object"], w.inputs["Vector"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = strength; L.new(w.outputs["Fac"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], N["Principled BSDF"].inputs["Normal"])
    _M[name] = m; return m

# ---------- mesh helpers ----------
def _obj(name, bm, material, parent=None, loc=(0, 0, 0), smooth=True):
    if smooth:
        for f in bm.faces: f.smooth = True
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if material: me.materials.append(material)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if parent: o.parent = parent
    o.location = loc; return o

def sphere(name, r, material, parent=None, loc=(0, 0, 0), scale=(1, 1, 1), seg=32, ring=16):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    o = _obj(name, bm, material, parent, loc); o.scale = scale; return o

def capsule(name, r, length, material, parent=None, loc=(0, 0, 0), r2=None):
    """capsule hanging down from its origin: top cap centred at origin, bottom cap centred at (0,0,-length); r2 tapers the bottom"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=r)
    r2 = r if r2 is None else r2
    for v in bm.verts:
        if v.co.z < -1e-6:
            v.co.x *= r2 / r; v.co.y *= r2 / r; v.co.z = v.co.z * r2 / r - length
    return _obj(name, bm, material, parent, loc)

def rbox(name, size, material, parent=None, loc=(0, 0, 0), bevel=0.01, seg=3):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    o = _obj(name, bm, material, parent, loc, smooth=False)
    if bevel:
        md = o.modifiers.new("bev", 'BEVEL'); md.width = bevel; md.segments = seg; md.harden_normals = False
        for p in o.data.polygons: p.use_smooth = True
    return o

def torso(name, h, r_bot, r_top, depth_k, material, parent=None, loc=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=32, radius1=r_bot, radius2=r_top, depth=h)
    for v in bm.verts: v.co.z += h / 2; v.co.y *= depth_k
    o = _obj(name, bm, material, parent, loc, smooth=False)
    md = o.modifiers.new("bev", 'BEVEL'); md.width = min(r_top, r_bot) * 0.55; md.segments = 6; md.limit_method = 'ANGLE'
    o.modifiers.new("sub", 'SUBSURF').levels = 1
    for p in o.data.polygons: p.use_smooth = True
    return o

def piv(name, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); e.empty_display_size = 0.05
    bpy.context.scene.collection.objects.link(e)
    if parent: e.parent = parent
    e.location = loc; return e

def torus(name, R, r, material, parent, loc, rot=(math.pi / 2, 0, 0)):
    bm = bmesh.new(); seg, ring = 40, 10
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            row.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        verts.append(row)
    for i in range(seg):
        for j in range(ring):
            bm.faces.new((verts[i][j], verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % ring], verts[i][(j + 1) % ring]))
    o = _obj(name, bm, material, parent, loc); o.rotation_euler = rot; return o

def cap_cut(name, r, material, parent, loc, plane_no, plane_d, thick=0.012):
    """hair: a shell sphere cut by a plane (keeps the side the normal points to)"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=r)
    n = Vector(plane_no).normalized()
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=n * plane_d, plane_no=n, clear_inner=True)
    o = _obj(name, bm, material, parent, loc)
    md = o.modifiers.new("sol", 'SOLIDIFY'); md.thickness = thick; md.offset = -1
    o.modifiers.new("sub", 'SUBSURF').levels = 1
    return o

# ---------- character ----------
HEAD_R = 0.15

class Toy:
    """pivots: root (pelvis), spine, head, shL/shR (shoulders), elL/elR, haL/haR (hands), hpL/hpR (hips), knL/knR.
    L = +x (the character's left when facing -Y)."""
    def __init__(self, name, spec):
        self.n = name; s = spec; self.spec = s
        skin = mat(name + "_skin", s["skin"], rough=0.5, sss=0.15)
        top = s["top_mat"]; sleeve = s.get("sleeve_mat", top); pants = mat(name + "_pants", s["pants"], rough=0.8, sheen=0.3)
        shoes = mat(name + "_shoes", s["shoes"], rough=0.5, coat=0.2)
        hair = mat(name + "_hair", s["hair"], rough=0.55, sheen=0.3)
        ink = mat("eye_ink", "#141212", rough=0.25, coat=0.6); white = mat("eye_glint", "#ffffff", emit=6.0)
        w = s.get("width", 1.0)
        self.root = piv(name, None)
        self.spine = piv(name + "_spine", self.root, (0, 0, 0.02))
        torso(name + "_torso", 0.52, 0.175 * w, 0.165 * w, 0.72, top, self.spine, (0, 0, -0.04))
        # collar / hood
        if s.get("hood"):
            torus(name + "_hood", 0.1, 0.035, top, self.spine, (0, 0.035, 0.49), rot=(math.radians(70), 0, 0))
            for sx in (-0.03, 0.03): capsule(name + "_cord", 0.005, 0.1, mat("cord", "#e8e4dc"), self.spine, (sx, -0.115, 0.44))
        else:
            torus(name + "_collar", 0.075, 0.022, top, self.spine, (0, 0.0, 0.485), rot=(math.radians(-8), 0, 0))
        for i in range(s.get("buttons", 0)):
            sphere(name + "_btn", 0.009, mat("btn", "#2a1d18", rough=0.3), self.spine, (0, -0.127 * w * 1.0, 0.40 - i * 0.1), scale=(1, 0.5, 1))
        # head
        self.head = piv(name + "_head", self.spine, (0, 0, 0.5))
        capsule(name + "_neck", 0.05, 0.05, skin, self.head, (0, 0, 0.06))
        hc = Vector((0, 0, 0.17)); self.hc = hc
        sphere(name + "_skull", HEAD_R, skin, self.head, hc, scale=(1, 0.96, 1.0))
        for sx in (-1, 1): sphere(name + "_ear", 0.032, skin, self.head, hc + Vector((sx * 0.148, 0.0, -0.005)), scale=(0.5, 0.9, 1.1))
        sphere(name + "_nose", 0.019, skin, self.head, hc + Vector((0, -0.148, -0.025)), scale=(1.1, 0.9, 0.9))
        def on_face(x, z, out=0.0):
            y = -math.sqrt(max(HEAD_R ** 2 - x * x - z * z, 0)) * 0.96 - out
            return hc + Vector((x, y, z))
        self.on_face = on_face
        # eyes (scale z animates blinks / sleepy lids), glints
        self.eyes = []
        for sx in (-1, 1):
            e = sphere(name + "_eye", 0.0175, ink, self.head, on_face(sx * 0.05, 0.012, -0.004), scale=(1, 0.55, 1.2))
            sphere(name + "_glint", 0.0055, white, e, (0.006, -0.016, 0.007), scale=(1, 1, 1))
            self.eyes.append(e)
        # brows (rot_y tilts, z offset raises)
        bcol = mat(name + "_brow", s.get("brow", s["hair"]), rough=0.6)
        self.brows = []
        for sx in (-1, 1):
            b = sphere(name + "_brow", 0.026, bcol, self.head, on_face(sx * 0.052, 0.062, 0.002), scale=(1, 0.32, 0.26))
            self.brows.append((sx, b, b.location.copy()))
        # mouth: a bezier line (3 points) + an open-mouth shape scaled for speech
        cu = bpy.data.curves.new(name + "_mouthc", 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.0042; cu.bevel_resolution = 3
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
        for i, x in enumerate((-0.03, 0, 0.03)):
            p = sp.bezier_points[i]; p.co = (x, 0, 0); p.handle_left_type = p.handle_right_type = 'AUTO'
        cu.materials.append(mat("mouth_ink", "#3a1c18", rough=0.4))
        self.mouth = bpy.data.objects.new(name + "_mouth", cu); bpy.context.scene.collection.objects.link(self.mouth)
        self.mouth.parent = self.head; self.mouth.location = on_face(0, -0.074, 0.003)
        self.mouth.rotation_euler = (math.radians(-12), 0, 0)
        self.mouth_open = sphere(name + "_mopen", 0.022, mat("mouth_in", "#5a1f1c", rough=0.5), self.head, on_face(0, -0.08, -0.006), scale=(1, 0.5, 0.05))
        # hair
        self.hair_objs = []
        if s.get("hair_style") == "grey":
            self.hair_objs.append(cap_cut(name + "_hair", 0.157, hair, self.head, hc, (0, 1.0, 0.3), -0.005, 0.012))
            for sx in (-1, 1): sphere(name + "_tuft", 0.045, hair, self.head, hc + Vector((sx * 0.128, 0.02, 0.045)), scale=(0.55, 1.1, 0.7))
            sphere(name + "_tache", 0.033, hair, self.head, on_face(0, -0.04, 0.008), scale=(1, 0.42, 0.26))
        else:
            self.hair_objs.append(cap_cut(name + "_hair", 0.16, hair, self.head, hc, (0, 0.45, 1), 0.0, 0.016))
            import random; rr = random.Random(7)
            for i in range(9):   # a messy fringe of soft tufts along the hairline
                a = math.radians(-70 + i * 17.5); x = 0.13 * math.sin(a); y = -0.13 * math.cos(a)
                sphere(name + "_tuft", 0.04 + rr.uniform(0, 0.012), hair, self.head, hc + Vector((x, y, 0.085 + rr.uniform(-0.01, 0.012))),
                       scale=(1.0, 0.8, 0.62)).rotation_euler = (rr.uniform(-0.3, 0.3), 0, a)
            sphere(name + "_crown", 0.12, hair, self.head, hc + Vector((0, 0.01, 0.075)), scale=(1.28, 1.25, 0.72))
        if s.get("glasses"):
            fr = mat("frames", "#2b2420", rough=0.3, coat=0.5)
            for sx in (-1, 1):
                torus(name + "_lens", 0.031, 0.0042, fr, self.head, on_face(sx * 0.052, 0.012, 0.016))
                capsule(name + "_temple", 0.0035, 0.075, fr, self.head, hc + Vector((sx * 0.146, -0.105, 0.016))).rotation_euler = (math.radians(90), 0, 0)
            capsule(name + "_bridge", 0.0035, 0.038, fr, self.head, on_face(0.019, 0.02, 0.026)).rotation_euler = (0, math.radians(90), 0)
            gl = mat("lens_glass", "#ffffff", rough=0.02); gl.node_tree.nodes["Principled BSDF"].inputs["Transmission Weight"].default_value = 1.0; gl.node_tree.nodes["Principled BSDF"].inputs["IOR"].default_value = 1.03
            for sx in (-1, 1):
                d = sphere(name + "_glass", 0.03, gl, self.head, on_face(sx * 0.052, 0.012, 0.016), scale=(1, 0.08, 1))
        # arms
        self.sh, self.el, self.ha = {}, {}, {}
        for side, sx in (("L", 1), ("R", -1)):
            sh = piv(f"{name}_sh{side}", self.spine, (sx * 0.17 * w, 0, 0.42)); self.sh[side] = sh
            sphere(name + "_shoulder", 0.058, sleeve, sh, (0, 0, 0))
            capsule(name + "_uarm", 0.052, 0.24, sleeve, sh, (0, 0, 0), r2=0.047)
            el = piv(f"{name}_el{side}", sh, (0, 0, -0.25)); self.el[side] = el
            capsule(name + "_farm", 0.046, 0.21, sleeve, el, (0, 0, 0), r2=0.043)
            ha = piv(f"{name}_ha{side}", el, (0, 0, -0.25)); self.ha[side] = ha
            sphere(name + "_hand", 0.046, skin, ha, (0, 0, 0.0), scale=(0.85, 0.75, 1.05))
            sphere(name + "_thumb", 0.018, skin, ha, (sx * -0.0, -0.035, 0.012), scale=(1, 1, 1.4))
        # legs
        self.hp, self.kn = {}, {}
        for side, sx in (("L", 1), ("R", -1)):
            hp = piv(f"{name}_hp{side}", self.root, (sx * 0.085 * w, 0, 0)); self.hp[side] = hp
            capsule(name + "_thigh", 0.075 * w, 0.3, pants, hp, (0, 0, 0), r2=0.06)
            kn = piv(f"{name}_kn{side}", hp, (0, 0, -0.31)); self.kn[side] = kn
            capsule(name + "_shin", 0.058, 0.3, pants, kn, (0, 0, 0), r2=0.05)
            rbox(name + "_shoe", (0.1, 0.19, 0.075), shoes, kn, (0, -0.035, -0.35), bevel=0.03, seg=4)

    # ---------- posing / keys ----------
    def sit(self, frame=None):
        for side in "LR":
            self.hp[side].rotation_euler = (math.radians(-90), 0, 0); self.kn[side].rotation_euler = (math.radians(90), 0, 0)
            if frame is not None:
                self.hp[side].keyframe_insert("rotation_euler", frame=frame); self.kn[side].keyframe_insert("rotation_euler", frame=frame)

    def face(self, frame, brow=0.0, brow_up=0.0, smile=0.0, lid=1.0):
        """brow: + = sad/worried (inner ends up), - = cross; brow_up raises both; smile: + smile, - frown; lid: eye height"""
        for sx, b, base in self.brows:
            b.rotation_euler = (0, sx * math.radians(18) * brow, 0)
            b.location = base + Vector((0, 0, 0.012 * brow_up))
            b.keyframe_insert("rotation_euler", frame=frame); b.keyframe_insert("location", frame=frame)
        pts = self.mouth.data.splines[0].bezier_points
        for i, x in enumerate((-0.03, 0, 0.03)):
            z = 0.0 if i == 1 else 0.012 * smile
            w = 1.0 + (0.15 * smile if smile > 0 else 0.0)
            pts[i].co = (x * w, 0, z); pts[i].keyframe_insert("co", frame=frame)
        for e in self.eyes:
            e.scale = (1, 0.55, 1.2 * lid); e.keyframe_insert("scale", frame=frame)

    def talk(self, f0, f1, fps, seed=1):
        """mouth open/close for speech between frames f0..f1"""
        import random
        rnd = random.Random(seed); m = self.mouth_open
        m.scale = (1, 0.5, 0.05); m.keyframe_insert("scale", frame=f0 - 1)
        f = f0
        while f < f1:
            o = rnd.uniform(0.35, 1.0); m.scale = (0.8 + 0.2 * o, 0.5, 0.05 + 0.75 * o); m.keyframe_insert("scale", frame=f)
            f += rnd.choice((2, 3, 3, 4)); m.scale = (0.85, 0.5, 0.08); m.keyframe_insert("scale", frame=f); f += rnd.choice((1, 2, 2))
        m.scale = (1, 0.5, 0.05); m.keyframe_insert("scale", frame=f1 + 1)

    def blink(self, frame, lid=1.0):
        for e in self.eyes:
            for df, k in ((0, lid), (2, 0.08), (4, lid)):
                e.scale = (1, 0.55, 1.2 * k); e.keyframe_insert("scale", frame=frame + df)


def key(o, frame, rot=None, loc=None, deg=True):
    if rot is not None:
        o.rotation_euler = [math.radians(a) for a in rot] if deg else rot; o.keyframe_insert("rotation_euler", frame=frame)
    if loc is not None:
        o.location = loc; o.keyframe_insert("location", frame=frame)


def ease_all():
    """bezier ease on every fcurve (default); keep auto-clamped handles so holds stay still"""
    for a in bpy.data.actions:
        for fc in getattr(a, "fcurves", []):
            for k in fc.keyframe_points:
                k.interpolation = 'BEZIER'; k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'
