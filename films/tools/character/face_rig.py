# A movable face for a Meshy character whose eyes/brows/mouth were painted (and have been painted out of a copy of
# the texture, see 38-mom-3d/validation/face_clean.py). Real 3D features, parented to the Head bone:
#   eyes (glossy, with highlights) that look around; upper and lower lids for blinks, sad droop and smiling squint;
#   brows that raise, knit and tilt; a mouth line that smiles, frowns and opens a little; tears that well and fall.
# Positions are measured on the flat front view (face_ortho.png: 800 px = 0.4 m, centre = x 0, z 1.45) and
# projected onto the head surface with ray casts, so the features sit on the face in any pose.
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

def _lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
def _mat(name, hexcol, rough=0.5, coat=0.0, emit=0.0, trans=0.0, sss=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_lin(hexcol), 1); b.inputs["Roughness"].default_value = rough
    if coat: b.inputs["Coat Weight"].default_value = coat
    if emit: b.inputs["Emission Color"].default_value = (*_lin(hexcol), 1); b.inputs["Emission Strength"].default_value = emit
    if trans: b.inputs["Transmission Weight"].default_value = trans
    if sss: b.inputs["Subsurface Weight"].default_value = sss
    if alpha < 1: b.inputs["Alpha"].default_value = alpha
    return m
def _ellipsoid(name, r, mat, keep=None, seg=32, rings=20):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts: v.co = Vector((v.co.x * r[0], v.co.y * r[1], v.co.z * r[2]))
    if keep: bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); me.materials.append(mat); bpy.context.scene.collection.objects.link(o)
    s = o.modifiers.new("ss", 'SUBSURF'); s.levels = 1; s.render_levels = 2; return o
def _tube_into(me, pts, radii, flat=0.5, up=None, seg=8):
    pts = [Vector(p) for p in pts]; n = len(pts); bm = bmesh.new(); rings = []
    for i, p in enumerate(pts):
        t = (pts[min(n - 1, i + 1)] - pts[max(0, i - 1)]).normalized(); u = (up[i] if up else Vector((0, -1, 0)))
        nn = (u - t * u.dot(t)).normalized(); b = t.cross(nn)
        rings.append([bm.verts.new(p + radii[i] * (math.cos(2 * math.pi * k / seg) * nn * flat + math.sin(2 * math.pi * k / seg) * b)) for k in range(seg)])
    for i in range(n - 1):
        for k in range(seg): bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    for ring, p, sgn in ((rings[0], pts[0], -1), (rings[-1], pts[-1], 1)):
        c = bm.verts.new(p)
        for k in range(seg): bm.faces.new((c, ring[(k + 1) % seg], ring[k]) if sgn < 0 else (c, ring[k], ring[(k + 1) % seg]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True

class Face:
    def __init__(self, arm, mesh, eyes=((-0.049, 1.440), (0.041, 1.441)), eye_r=(0.0118, 0.0062, 0.0172),
                 brow_z=1.497, mouth=(-0.003, 1.371, 0.026), skin="#fdc59c", brow_col="#4a2616", iris="#3a2418",
                 lip_col="#8a4436", lip_scale=1.0, lip_off=0.0008):
        self.arm, self.mesh = arm, mesh
        self.head = arm.pose.bones["Head"]; self.HB = arm.data.bones["Head"]
        bpy.context.view_layer.update()
        self._rest_head = (arm.matrix_world @ self.HB.matrix_local).copy()       # rest world matrix of the head bone
        # frozen rest-pose copy of the body surface: set() rebuilds the mouth and brows every frame, and must not ray-cast the
        # posed or moved body (a miss used to drop the mouth to a fallback depth inside the head)
        _bm = bmesh.new(); _bm.from_object(mesh, bpy.context.evaluated_depsgraph_get()); _bm.transform(mesh.matrix_world)
        self._bvh = BVHTree.FromBMesh(_bm); _bm.free()
        self.SKIN = _mat("face_skin", skin, rough=0.5, sss=0.05); EYE = _mat("face_eye", iris, rough=0.05, coat=1.0)
        GL = _mat("face_glint", "#ffffff", emit=5.0); self.BROW = _mat("face_brow", brow_col, rough=0.7)
        LIP = _mat("face_mouth", lip_col, rough=0.5); self.lip_scale = lip_scale; self.lip_off = lip_off; TEAR = _mat("face_tear", "#ffffff", rough=0.02, trans=1.0, coat=1.0)
        self.objs = []; self.eyes = []
        for sx, (x, z) in zip((-1, 1), eyes):
            p, n = self.surf(x, z)
            piv = self._empty(f"eye_piv{sx}", Matrix.Translation(p - n * eye_r[1] * 0.35))
            ball = _ellipsoid(f"eye{sx}", eye_r, EYE); self._attach(ball, piv)
            g1 = _ellipsoid(f"glint{sx}", (eye_r[0] * 0.3, 0.002, eye_r[2] * 0.22), GL, seg=12, rings=8); self._attach(g1, piv, Vector((-eye_r[0] * 0.3, -eye_r[1] * 0.98, eye_r[2] * 0.38)))
            g2 = _ellipsoid(f"glint2{sx}", (eye_r[0] * 0.14, 0.002, eye_r[2] * 0.1), GL, seg=10, rings=6); self._attach(g2, piv, Vector((eye_r[0] * 0.32, -eye_r[1] * 0.98, -eye_r[2] * 0.4)))
            lr = (eye_r[0] * 1.22, eye_r[1] * 1.5, eye_r[2] * 1.16)
            up = self._empty(f"lidU_piv{sx}", Matrix.Translation(p - n * eye_r[1] * 0.35)); lu = _ellipsoid(f"lidU{sx}", lr, self.SKIN); self._attach(lu, up)
            lo = self._empty(f"lidL_piv{sx}", Matrix.Translation(p - n * eye_r[1] * 0.35)); ll = _ellipsoid(f"lidL{sx}", lr, self.SKIN); self._attach(ll, lo)
            tear = _ellipsoid(f"tear{sx}", (0.0042, 0.003, 0.0055), TEAR, seg=16, rings=10); self._attach(tear, piv, Vector((sx * eye_r[0] * 0.2, -eye_r[1] * 1.0, -eye_r[2] * 1.05)))
            lme = bpy.data.meshes.new(f"lash{sx}"); lo_ = bpy.data.objects.new(f"lash{sx}", lme); lme.materials.append(self.BROW if hasattr(self, "BROW") else EYE)
            bpy.context.scene.collection.objects.link(lo_); self._attach(lo_, piv)
            self.eyes.append(dict(sx=sx, x=x, z=z, piv=piv, ball=ball, glints=(g1, g2), up=up, lu=lu, lo=lo, ll=ll, tear=tear, r=eye_r, lash=(lme, lo_)))
        self.brow_me = {}; self.brow_z = brow_z
        for sx, (x, z) in zip((-1, 1), eyes):
            me = bpy.data.meshes.new(f"brow{sx}"); o = bpy.data.objects.new(f"brow{sx}", me); me.materials.append(self.BROW)
            bpy.context.scene.collection.objects.link(o); self._attach(o, None); self.brow_me[sx] = (me, x)
        self.mouth_me = bpy.data.meshes.new("mouth"); mo = bpy.data.objects.new("mouth", self.mouth_me); self.mouth_me.materials.append(LIP)
        bpy.context.scene.collection.objects.link(mo); self._attach(mo, None); self.mouth = mouth
        self.set()

    # ---- placement helpers (all built in the head's REST frame, then carried by the Head bone) ----
    def surf(self, x, z, off=0.0):
        w, nw, _i, _d = self._bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
        if w is None: raise RuntimeError(f"face_rig.surf: no face surface at x={x:.3f} z={z:.3f} (check the face coordinates)")
        nw = nw.normalized()
        if nw.y > 0: nw = -nw
        return w + nw * off, nw
    def _empty(self, name, Mw):
        e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e); self._attach(e, None, mw=Mw); return e
    def _attach(self, o, parent_empty, offset=Vector((0, 0, 0)), mw=None):
        if parent_empty is not None:
            o.parent = parent_empty; o.location = offset
        else:
            o.parent = self.arm; o.parent_type = 'BONE'; o.parent_bone = "Head"
            bpy.context.view_layer.update()
            o.matrix_world = mw if mw is not None else Matrix.Identity(4)
        self.objs.append(o)

    # ---- controls ----
    def set(self, blink=0.0, look=(0.0, 0.0), brow_in=0.0, brow_out=0.0, brow_down=0.0, smile=0.0, sad=0.0, squint=0.0, open_=0.0, tear=0.0):
        """blink 0..1, look (x, z) -1..1, brow_in/out raise inner/outer ends (sad/worried = inner up),
        brow_down knits/lowers, smile -1 (frown) .. 1, sad 0..1 (droopy lids), squint 0..1 (smiling cheeks push lids up),
        open_ 0..1 (lips part), tear 0..1 (wells, then falls when > 0.5)"""
        R = self._rest_head.inverted()                                   # the parts are positioned in the rest frame
        for e in self.eyes:
            r = e["r"]; gx, gz = look
            for g, base in zip(e["glints"], (Vector((-r[0] * 0.3, -r[1] * 0.98, r[2] * 0.38)), Vector((r[0] * 0.32, -r[1] * 0.98, -r[2] * 0.4)))):
                g.location = base + Vector((gx * r[0] * 0.3, 0, gz * r[2] * 0.22))
            e["ball"].location = (gx * r[0] * 0.22, 0, gz * r[2] * 0.16)
            # upper lid: hidden when open; closes downward from the top (rotation about the eye's horizontal axis)
            close = max(blink, 0.55 * sad, 0.35 * squint)
            e["lu"].hide_render = close < 0.02
            c = max(0.02, close); e["lu"].scale = (1, 1, c); e["lu"].location = (0, -r[1] * 0.05, r[2] * 1.16 * (1 - c))
            # closed-eye lash line along the lid edge (curves down when happy, flatter when sad)
            lme, lob = e["lash"]; lob.hide_render = close < 0.55
            if close >= 0.55:
                edge = r[2] * 1.16 * (1 - 2 * c); pts = []
                for i in range(9):
                    u = -1 + 2 * i / 8; pts.append(Vector((u * r[0] * 1.05, -r[1] * 1.45, edge + r[2] * (0.25 * squint - 0.05 * sad) * (1 - u * u) - r[2] * 0.08 * (u * u))))
                _tube_into(lme, pts, [0.0007, 0.0011, 0.0013, 0.0014, 0.0014, 0.0014, 0.0013, 0.0011, 0.0007], flat=0.5, up=[Vector((0, -1, 0))] * 9)
            low = max(0.42 * squint, 0.18 * sad * 0)
            c = max(0.02, low); e["ll"].hide_render = low < 0.02; e["ll"].scale = (1, 1, c); e["ll"].location = (0, -r[1] * 0.05, -r[2] * 1.16 * (1 - c))
            e["tear"].hide_render = tear < 0.05
            fall = max(0.0, (tear - 0.5) / 0.5)
            e["tear"].scale = (min(1, tear * 2),) * 3
            e["tear"].location = Vector((e["sx"] * r[0] * 0.2, -r[1] * 1.0, -r[2] * 1.05 - fall * 0.045))
        for sx, (me, x0) in self.brow_me.items():
            xs = [x0 - sx * 0.006, x0 + sx * 0.004, x0 + sx * 0.014, x0 + sx * 0.023]
            inner = brow_in * 0.009 - brow_down * 0.004; outer = brow_out * 0.005 - brow_down * 0.002
            pts, ups = [], []
            for i, x in enumerate(xs):
                t = i / (len(xs) - 1); z = self.brow_z + 0.0035 * math.sin(t * math.pi) + inner * (1 - t) + outer * t
                xx = x + (-sx) * brow_down * 0.002 * (1 - t)
                p, n = self.surf(xx, z, 0.0012); pts.append(p); ups.append(-n)
            _tube_into(me, pts, [0.003, 0.0042, 0.0038, 0.0022], flat=0.42, up=ups)
        mx, mz, w = self.mouth; pts, ups = [], []
        for i in range(9):
            u = -1 + 2 * i / 8; z = mz + smile * 0.0075 * (u * u) - smile * 0.0015 - abs(min(0, smile)) * 0.0
            p, n = self.surf(mx + u * w * (1 + 0.15 * smile), z, self.lip_off); pts.append(p); ups.append(-n)
        rad = [0.0010, 0.0014, 0.0017, 0.0019 + open_ * 0.002, 0.0020 + open_ * 0.003, 0.0019 + open_ * 0.002, 0.0017, 0.0014, 0.0010]
        rad = [r * self.lip_scale for r in rad]
        _tube_into(self.mouth_me, pts, rad, flat=0.5 + open_ * 0.8, up=ups)

    def expression(self, name, k=1.0):
        E = {"neutral": {}, "smile": dict(smile=0.9, squint=0.6, brow_out=0.3),
             "sad": dict(smile=-0.8, sad=0.75, brow_in=1.0, brow_out=-0.3),
             "worried": dict(smile=-0.35, brow_in=1.0, brow_down=0.4, sad=0.2),
             "crying": dict(smile=-1.0, sad=0.9, brow_in=1.0, brow_out=-0.4, tear=1.0, open_=0.3),
             "blink": dict(blink=1.0)}[name]
        return {kk: v * k for kk, v in E.items()}

def swap_texture(mesh, path):
    """use the painted-out face texture (a copy); the original GLB stays untouched"""
    for n in mesh.data.materials[0].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and n.image.name.startswith('Image_0'):
            n.image = bpy.data.images.load(path); return True
    return False
