# Film 34: blocky 3D characters with a face built for big, readable emotion.
# Rigid bevelled blocks on a pivot hierarchy (no skinning). Faces are driven by a small set of numbers
# (brows, lids, pupils, mouth curve/open, tears, welling, blush, sick tint, squeezed eyes) blended from presets.
import bpy, math
from lib import *

R = math.radians
EXPR = {  # every emotion is a point in this space; shots blend between them
    "neutral": {},
    "happy":   dict(smile=0.8, lower=0.25, brow=0.03),
    "joy":     dict(smile=1.0, open=0.45, happyeyes=1.0, brow=0.06, blush=0.6),
    "laugh":   dict(smile=1.0, open=0.7, happyeyes=1.0, brow=0.08, blush=0.4),
    "shock":   dict(brow=0.1, pupil=0.7, open=0.55, ow=0.55, lid=-0.1),
    "touched": dict(brow=0.05, sad=0.18, smile=0.55, well=1.0, blush=0.5, lid=0.12),
    "happycry":dict(smile=0.9, open=0.3, happyeyes=1.0, tears=1.0, well=0.6, blush=0.7, sad=0.15, wobble=0.3),
    "sad":     dict(sad=0.35, lid=0.3, smile=-0.6, brow=-0.02, look=(0, -0.03)),
    "sadsmile":dict(sad=0.3, lid=0.25, smile=0.35, well=0.6),
    "cry":     dict(sad=0.45, lid=0.35, smile=-0.8, open=0.25, ow=0.7, tears=1.0, well=1.0, wobble=1.0, blush=0.3),
    "pain":    dict(squeeze=1.0, angry=0.35, open=0.75, ow=1.0, teeth=1.0, brow=-0.05, tears=0.6, sweat=1.0),
    "strain":  dict(squeeze=1.0, angry=0.4, smile=-0.2, teeth=1.0, open=0.3, ow=1.0, brow=-0.06, sweat=1.0, blush=0.7),
    "tired":   dict(lid=0.55, sad=0.12, brow=-0.04, smile=-0.15, sweat=0.6),
    "sick":    dict(sick=1.0, lid=0.35, sad=0.25, smile=-0.5, sweat=1.0, open=0.12, ow=0.6),
    "worried": dict(sad=0.3, brow=0.04, smile=-0.3, pupil=0.85),
    "love":    dict(smile=0.75, lid=0.28, blush=0.7, sad=0.1, well=0.5),
    "melt":    dict(smile=0.6, lid=0.85, blush=0.6, sad=0.08, well=0.4, tears=0.4),
    "resolve": dict(angry=0.2, lid=0.1, smile=-0.15, brow=-0.02),
    "bored":   dict(lid=0.4, smile=-0.05, look=(0.04, -0.04)),
    "blank":   dict(lid=0.15, smile=0.0, pupil=0.95),
}
KEYS = ["brow", "sad", "angry", "lid", "lower", "pupil", "smile", "open", "ow", "teeth", "tears", "well", "blush", "sick",
        "squeeze", "happyeyes", "wobble", "sweat"]
DEF = dict(pupil=1.0, ow=1.0)

def expr_mix(a, b, k):
    A, B = EXPR[a] if isinstance(a, str) else a, EXPR[b] if isinstance(b, str) else b
    out = {}
    for key in KEYS:
        out[key] = mix(A.get(key, DEF.get(key, 0.0)), B.get(key, DEF.get(key, 0.0)), k)
    la, lb = A.get("look", (0, 0)), B.get("look", (0, 0)); out["look"] = (mix(la[0], lb[0], k), mix(la[1], lb[1], k))
    return out

def track(keys, t):
    """keys: [(time, preset_or_dict), ...] -> blended dict at t (0.35 s ease into each key)"""
    if t <= keys[0][0]: return expr_mix(keys[0][1], keys[0][1], 0)
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t < t1: return expr_mix(a, b, smooth((t - t0) / max(0.01, min(t1 - t0, 0.45))))
    return expr_mix(keys[-1][1], keys[-1][1], 0)

def ribbon(name, m, parent, n=16):
    me = bpy.data.meshes.new(name); verts = [(0, 0, 0)] * ((n + 1) * 4); faces = []
    for i in range(n):
        a, b = i * 4, (i + 1) * 4
        faces += [(a, b, b + 1, a + 1), (a + 2, a + 3, b + 3, b + 2), (a, a + 2, b + 2, b), (a + 1, b + 1, b + 3, a + 3)]
    faces += [(0, 1, 3, 2), (n * 4, n * 4 + 2, n * 4 + 3, n * 4 + 1)]
    me.from_pydata(verts, [], faces); me.materials.append(m)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); o.parent = parent; o["n"] = n; return o

def set_ribbon(o, hw, top, bot, y, depth):
    n = o["n"]; co = []
    for i in range(n + 1):
        u = i / n * 2 - 1; x = u * hw; t, b = top(u), bot(u)
        co += [(x, y, t), (x, y, b), (x, y + depth, t), (x, y + depth, b)]
    o.data.vertices.foreach_set("co", [c for v in co for c in v]); o.data.update()

class Char:
    """spec: skin, hair, style(long|bun|short), top, bottom, shoe, dress(bool), scale, eyes"""
    def __init__(self, name, spec):
        self.n = name; s = spec; self.spec = s; self.t = 0.0
        self.root = piv(name); self.root.scale = (s.get("scale", 0.5),) * 3
        self.skin = skin_mat(name + "_skin", s["skin"])
        k = lambda n, h, r=0.6: mat(name + n, h, r)
        hair, top, bot, shoe = k("_hair", s["hair"], 0.65), k("_top", s["top"], 0.85), k("_bot", s["bottom"], 0.85), k("_shoe", s.get("shoe", "#2b2b30"), 0.5)
        self.hips = piv(name + "_hips", self.root, (0, 0, 1.0))
        self.legs = []
        for side, x in (("L", -0.22), ("R", 0.22)):
            p = piv(name + "_leg" + side, self.hips, (x, 0, 0))
            rbox(name + "_thigh" + side, (0.4, 0.44, 0.92), bot if not s.get("dress") else self.skin, p, (0, 0, -0.46), 0.06)
            rbox(name + "_shoe" + side, (0.43, 0.56, 0.16), shoe, p, (0, -0.05, -0.93), 0.05)
            self.legs.append(p)
        self.spine = piv(name + "_spine", self.hips, (0, 0, 0))
        self.torso = rbox(name + "_torso", (1.0, 0.6, 1.08), top, self.spine, (0, 0, 0.56), 0.08)
        self.extra = {}
        if s.get("dress"):
            self.extra["skirt"] = rbox(name + "_skirt", (1.02, 0.62, 0.62), top, self.spine, (0, 0, -0.2), 0.06, taper=(1.45, 1.3))
        if s.get("belt"): rbox(name + "_belt", (1.03, 0.63, 0.08), k("_belt", s["belt"]), self.spine, (0, 0, 0.08), 0.02)
        # pregnant belly (scaled 0..1 per frame)
        self.belly = rbox(name + "_belly", (0.86, 0.56, 0.78), top, self.spine, (0, -0.2, 0.38), 0.2, seg=5)
        self.belly.scale = (0.001,) * 3
        self.neck = piv(name + "_neck", self.spine, (0, 0, 1.1))
        rbox(name + "_neckb", (0.3, 0.3, 0.16), self.skin, self.neck, (0, 0, 0.0), 0.03)
        self.head = piv(name + "_head", self.neck, (0, 0, 0.06)); self.head.scale = (1.15,) * 3
        rbox(name + "_skull", (1.0, 0.9, 0.95), self.skin, self.head, (0, 0, 0.5), 0.1, seg=4)
        for x in (-0.53, 0.53): rbox(name + "_ear", (0.08, 0.2, 0.24), self.skin, self.head, (x, 0.02, 0.48), 0.03)
        self._hair(s.get("style", "short"), hair, s)
        self._face(s)
        self.arms = []
        for side, x in (("L", -0.66), ("R", 0.66)):
            sh = piv(name + "_sh" + side, self.spine, (x, 0, 1.0))
            rbox(name + "_upper" + side, (0.3, 0.32, 0.52), top, sh, (0, 0, -0.24), 0.07)
            el = piv(name + "_el" + side, sh, (0, 0, -0.5))
            rbox(name + "_fore" + side, (0.28, 0.3, 0.42), top if s.get("long_sleeve", True) else self.skin, el, (0, 0, -0.18), 0.07)
            hand = rbox(name + "_hand" + side, (0.27, 0.3, 0.24), self.skin, el, (0, 0, -0.5), 0.07)
            self.arms.append((sh, el, hand))
        self.pose = {}

    # ---------- hair ----------
    def _hair(self, style, hm, s):
        h, n = self.head, self.n
        def hb(nm, size, loc, rot=(0, 0, 0), m=hm): return rbox(n + "_h" + nm, size, m, h, loc, 0.05, rot)
        tops = [(-0.36, 1.0), (-0.12, 1.03), (0.12, 1.0), (0.36, 1.02)]
        if style == "short":
            for i, (x, z) in enumerate(tops): hb("t%d" % i, (0.28, 0.96, 0.2), (x, 0.02, z), (0, 0, 0.06 * (i - 1.5)))
            for i, x in enumerate((-0.33, -0.08, 0.2)): hb("f%d" % i, (0.3, 0.14, 0.2), (x, -0.43, 0.88), (R(-10), 0, 0))
            hb("bk", (1.02, 0.12, 0.55), (0, 0.44, 0.7))
            for x in (-0.5, 0.5): hb("sd" + str(x), (0.08, 0.6, 0.32), (x, 0.08, 0.78))
        else:
            for i, (x, z) in enumerate(tops): hb("t%d" % i, (0.28, 0.96, 0.18), (x, 0.02, z - 0.01), (0, 0, 0.04 * (i - 1.5)))
            # parted fringe
            hb("fl", (0.5, 0.14, 0.26), (-0.27, -0.43, 0.86), (R(-8), R(-8), 0)); hb("fr", (0.42, 0.14, 0.22), (0.29, -0.43, 0.88), (R(-8), R(10), 0))
            hb("bk", (1.04, 0.14, 0.75), (0, 0.44, 0.6))
            for x in (-0.53, 0.53): hb("sd" + str(x), (0.09, 0.66, 0.5), (x, 0.06, 0.72))
            if style == "long":
                self.extra["longhair"] = [hb("lb", (1.06, 0.18, 0.95), (0, 0.42, -0.05)),
                    hb("ll", (0.2, 0.5, 1.15), (-0.55, 0.05, 0.25)), hb("lr", (0.2, 0.5, 1.15), (0.55, 0.05, 0.25)),
                    hb("lt1", (0.2, 0.3, 0.3), (-0.55, -0.05, -0.38), (0, R(8), 0)), hb("lt2", (0.2, 0.3, 0.3), (0.55, -0.05, -0.38), (0, R(-8), 0))]
            if style == "bun":
                self.extra["bun"] = [hb("bun", (0.42, 0.4, 0.36), (0, 0.42, 1.08)), hb("bunb", (0.3, 0.12, 0.08), (0, 0.42, 0.88), m=mat(n + "_band", "#8a3a3a"))]
                if s.get("grey"):
                    g = mat(n + "_grey", "#b9b4ae", 0.6); hb("g1", (0.12, 0.62, 0.4), (-0.57, 0.04, 0.75), m=g); hb("g2", (0.2, 0.15, 0.22), (-0.38, -0.44, 0.9), (R(-8), R(-8), 0), m=g)

    # ---------- face ----------
    def _face(self, s):
        h, n = self.head, self.n
        W, K = mat("eyewhite", "#f6f3ee", 0.25, coat=0.4), mat("pupil", "#16151a", 0.2, coat=1.0)
        HL, LASH = mat("catch", "#ffffff", 0.2, emit=1.2), mat(n + "_lash", s.get("lash", "#2a1e1a"), 0.5)
        TEAR = mat("tear", "#6fc0ff", 0.02, coat=1.0, emit=0.9)
        BR = mat(n + "_brow", s.get("brow", s["hair"]), 0.7); LIP = mat(n + "_lip", s.get("lip", "#7a3b36"), 0.45)
        MO = mat("mouthin", "#3a1216", 0.6); TE = mat("teeth", "#f4f1ea", 0.3)
        BL = mat("blush", "#ff8f8f", 0.6, alpha=0.55); SW = mat("sweat", "#cfeaff", 0.05, coat=1.0, emit=0.2)
        self.F = {}
        Y = -0.452; EZ = 0.53
        for side, x in (("L", -0.22), ("R", 0.22)):
            e = piv(n + "_eye" + side, h, (x, Y, EZ))
            d = {"e": e}
            d["white"] = rbox(n + "_ew" + side, (0.29, 0.02, 0.24), W, e, (0, 0, 0), 0.014)
            d["pupil"] = rbox(n + "_ep" + side, (0.15, 0.02, 0.18), K, e, (0.02, -0.008, -0.01), 0.012)
            d["hl"] = rbox(n + "_eh" + side, (0.04, 0.02, 0.04), HL, e, (0.05, -0.016, 0.03), 0.004)
            d["hl2"] = rbox(n + "_eh2" + side, (0.022, 0.02, 0.022), HL, e, (-0.025, -0.016, -0.05), 0.003)
            d["lid"] = rbox(n + "_lid" + side, (0.33, 0.03, 1.0), self.skin, e, (0, -0.02, 0.1), 0.006)
            d["lash"] = rbox(n + "_lash" + side, (0.33, 0.034, 0.035), LASH, e, (0, -0.022, 0.1), 0.006)
            d["low"] = rbox(n + "_low" + side, (0.33, 0.03, 1.0), self.skin, e, (0, -0.02, -0.1), 0.006)
            d["well"] = rbox(n + "_well" + side, (0.28, 0.016, 0.045), TEAR, e, (0, -0.02, -0.1), 0.008)
            # squeezed eyes: two dark bars as > < ; happy closed eyes: ^ ^
            d["sq1"] = rbox(n + "_sq1" + side, (0.17, 0.03, 0.04), LASH, e, (0, -0.03, 0.03), 0.01)
            d["sq2"] = rbox(n + "_sq2" + side, (0.17, 0.03, 0.04), LASH, e, (0, -0.03, -0.03), 0.01)
            if s.get("lashes"):
                d["wing"] = rbox(n + "_wing" + side, (0.09, 0.03, 0.035), LASH, e, (0.16 * (1 if side == "R" else -1), -0.024, 0.11), 0.008, rot=(0, R(-30) if side == "R" else R(30), 0))
            d["brow"] = rbox(n + "_brow" + side, (0.3, 0.05, 0.08), BR, h, (x, Y - 0.02, 0.75), 0.015)
            d["tears"] = [rbox(n + "_tear%d" % i + side, (0.07, 0.03, 0.11), TEAR, h, (x, Y - 0.02, 0.4), 0.02, seg=4) for i in range(2)]
            d["blush"] = rbox(n + "_blush" + side, (0.16, 0.012, 0.075), BL, h, (x * 1.45, Y - 0.004, 0.36), 0.02)
            d["x"] = x; self.F[side] = d
        self.nose = rbox(n + "_nose", (0.1, 0.08, 0.13), self.skin, h, (0, Y - 0.03, 0.42), 0.025)
        if s.get("mustache"): rbox(n + "_mus", (0.3, 0.04, 0.06), mat(n + "_must", s["mustache"]), h, (0, Y - 0.02, 0.31), 0.015)
        self.mp = piv(n + "_mouth", h, (0, Y - 0.005, 0.23))
        self.lips = ribbon(n + "_lips", LIP, self.mp); self.mouth = ribbon(n + "_mouthin", MO, self.mp)
        self.teeth = rbox(n + "_teeth", (0.2, 0.024, 0.04), TE, self.mp, (0, -0.006, 0), 0.01)
        self.sweat = rbox(n + "_sweat", (0.06, 0.03, 0.09), SW, h, (0.4, Y - 0.02, 0.78), 0.025, seg=4)
        if s.get("glasses"):
            G = mat(n + "_gl", "#1a1a1a", 0.3)
            for x in (-0.22, 0.22):
                for dz in (0.12, -0.11): rbox(n + "_gf", (0.33, 0.02, 0.025), G, h, (x, Y - 0.04, EZ + dz), 0.004)
                for dx in (-0.155, 0.155): rbox(n + "_gs", (0.025, 0.02, 0.25), G, h, (x + dx, Y - 0.04, EZ), 0.004)
            rbox(n + "_gb", (0.12, 0.02, 0.025), G, h, (0, Y - 0.04, EZ + 0.03), 0.004)

    def face(self, e, t):
        """apply an expression dict (from track())"""
        self.skin.node_tree.nodes["SICK"].inputs["Factor"].default_value = 0.75 * e["sick"]
        blink = 0.0
        ph = (t * 0.37 + hash(self.n) % 7 * 0.13) % 1.0      # blink every ~2.7 s
        if ph < 0.045: blink = math.sin(ph / 0.045 * math.pi)
        lid = clamp01(max(e["lid"], 0) + blink * (1 - max(e["lid"], 0)))
        sq, he = e["squeeze"], e["happyeyes"]
        closed = max(sq, he)
        for side, d in self.F.items():
            sgn = -1 if side == "L" else 1
            H = 0.24
            L = clamp01(max(lid, closed)); low = clamp01(e["lower"] * 0.5)
            lt = max(0.001, L * H); d["lid"].scale.z = lt; d["lid"].location.z = H / 2 - lt / 2 + 0.004 + max(0, -e["lid"]) * 0.02
            d["lash"].location.z = H / 2 - lt + 0.006; d["lash"].scale = (1, 1, 1) if L > 0.05 and closed < 0.5 else (0.001,) * 3
            lw = max(0.001, low * H); d["low"].scale.z = lw; d["low"].location.z = -H / 2 + lw / 2 - 0.004
            p = e["pupil"]; lx, lz = e["look"]
            d["pupil"].scale = (p, 1, p); d["pupil"].location.x = 0.02 * sgn * -1 + lx; d["pupil"].location.z = -0.01 + lz
            hl = 1.0 + 0.6 * e["well"]
            d["hl"].scale = (hl, 1, hl); d["hl"].location.x = 0.05 + lx; d["hl"].location.z = 0.03 + lz
            d["hl2"].location.x = -0.025 + lx; d["hl2"].location.z = -0.05 + lz
            d["well"].scale = (1, 1, max(0.001, e["well"])) if closed < 0.5 else (0.001,) * 3
            vis = closed < 0.5
            for k in ("white", "pupil", "hl", "hl2"): d[k].hide_render = not vis
            d["lid"].hide_render = not vis; d["low"].hide_render = not vis
            if "wing" in d: d["wing"].location.z = H / 2 - max(0.001, L * H) + 0.03; d["wing"].hide_render = not vis
            on = 1.0 if closed >= 0.5 else 0.001
            if sq >= he:   # > <  (pointing inwards)
                a = R(24) * -sgn
                d["sq1"].rotation_euler = (0, a, 0); d["sq2"].rotation_euler = (0, -a, 0)
                d["sq1"].location = (0.02 * -sgn, -0.03, 0.03); d["sq2"].location = (0.02 * -sgn, -0.03, -0.03)
            else:          # ^ ^
                d["sq1"].rotation_euler = (0, R(-28), 0); d["sq2"].rotation_euler = (0, R(28), 0)
                d["sq1"].location = (-0.055, -0.03, 0.0); d["sq2"].location = (0.055, -0.03, 0.0)
            d["sq1"].scale = d["sq2"].scale = (on, 1, on)
            # brows: up/down, sad (inner up), angry (inner down)
            tilt = (e["sad"] - e["angry"]) * 0.9
            d["brow"].rotation_euler = (0, tilt if side == "R" else -tilt, 0)
            d["brow"].location.z = 0.75 + e["brow"] + 0.03 * e["sad"] - 0.05 * sq
            d["brow"].location.x = d["x"] + 0.01 * sgn * -1 * e["angry"]
            # tears roll down from the lower lid
            for i, tr in enumerate(d["tears"]):
                if e["tears"] < 0.05: tr.scale = (0.001,) * 3; continue
                u = (t * 0.55 + i * 0.5 + (0.25 if side == "R" else 0)) % 1.0
                tr.location = (d["x"] + (0.07 if side == "R" else -0.07), -0.475, 0.42 - 0.32 * u)
                k = e["tears"] * min(1, u * 6) * (1 - smooth((u - 0.8) / 0.2))
                tr.scale = (k, 1, k * (1 + 0.6 * u))
            b = max(0.001, e["blush"]); d["blush"].scale = (b, 1, b)
        # mouth
        wob = e["wobble"] * 0.25 * math.sin(t * 23)
        op = clamp01(e["open"] + abs(wob) * 0.12)
        sm = e["smile"] + wob; a = 0.075 * sm
        hw = 0.13 * (1 + 0.22 * abs(sm)) * (1.0 if op < 0.05 else (0.55 + 0.5 * e["ow"]))
        up = lambda u: a * u * u - a * 0.35
        if op < 0.05:
            set_ribbon(self.lips, hw, lambda u: up(u) + 0.022, lambda u: up(u) - 0.022, -0.008, 0.02); self.lips.hide_render = False
            self.mouth.hide_render = True
        else:
            dep = lambda u: op * 0.2 * (1 - 0.75 * u * u) + 0.01
            set_ribbon(self.mouth, hw, lambda u: up(u) + 0.012, lambda u: up(u) - dep(u), -0.004, 0.02); self.mouth.hide_render = False
            set_ribbon(self.lips, hw * 1.04, lambda u: up(u) - dep(u) + 0.006, lambda u: up(u) - dep(u) - 0.026, -0.01, 0.02)
            self.lips.hide_render = False
        self.teeth.scale = (0.8 + 0.45 * e["ow"], 1, 1) if (e["teeth"] > 0.5 and op > 0.1) else (0.001,) * 3
        self.teeth.location.z = 0.0 if e["teeth"] > 0.5 else 0
        sw = max(0.001, e["sweat"]); self.sweat.scale = (sw, 1, sw)
        self.sweat.location.z = 0.8 - 0.06 * ((t * 0.5) % 1.0)

    # ---------- body ----------
    def set_pose(self, p):
        """p: dict with optional armL/armR=(fwd, out, elbow, twist), legL/legR=(fwd, out), spine=(fwd, side, twist),
        head=(nod, tilt, turn), hips=dz, belly=0..1  (degrees)"""
        for (sh, el, hand), key, sgn in ((self.arms[0], "armL", 1), (self.arms[1], "armR", -1)):
            fwd, out, elb, tw = p.get(key, (0, 6, 8, 0))
            sh.rotation_euler = (R(-fwd), R(out * sgn), R(tw * sgn)); el.rotation_euler = (R(-elb), 0, 0)
        for leg, key in ((self.legs[0], "legL"), (self.legs[1], "legR")):
            fwd, out = p.get(key, (0, 0)); leg.rotation_euler = (R(-fwd), R(out * (1 if key == "legL" else -1)), 0)
        a, b, c = p.get("spine", (0, 0, 0)); self.spine.rotation_euler = (R(-a), R(b), R(c))
        a, b, c = p.get("head", (0, 0, 0)); self.head.rotation_euler = (R(-a), R(b), R(c))
        self.hips.location.z = 1.0 + p.get("hips", 0.0)
        bl = max(0.001, p.get("belly", 0.0)); self.belly.scale = (bl, bl, bl)

    def place(self, loc, rz=0.0):
        self.root.location = loc; self.root.rotation_euler = (0, 0, R(rz))

def pose_mix(A, B, k):
    out = {}
    for key in set(A) | set(B):
        a, b = A.get(key), B.get(key)
        if a is None: a = b
        if b is None: b = a
        if isinstance(a, tuple): out[key] = tuple(mix(x, y, k) for x, y in zip(a, b))
        else: out[key] = mix(a, b, k)
    return out

def ptrack(keys, t, ease=0.6):
    if t <= keys[0][0]: return dict(keys[0][1])
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t < t1: return pose_mix(a, b, smooth((t - t0) / max(0.01, min(t1 - t0, ease))))
    return dict(keys[-1][1])
