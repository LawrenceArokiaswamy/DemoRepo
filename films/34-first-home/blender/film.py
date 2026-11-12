# Film 34 "Her First Home" (62 s, 30 fps): build everything, stage each shot per frame, render frames with Cycles.
# usage: blender-python film.py -- out_dir [--frames a,b,c | --range a b] [--photo] [--scale pct]
import bpy, sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from mathutils import Vector
from lib import *; from rig import *; from sets import *
R = math.radians; FPS = 30
argv = sys.argv[sys.argv.index("--") + 1:]; OUT = argv[0]; os.makedirs(OUT, exist_ok=True)
def arg(k, d=None):
    return argv[argv.index(k) + 1] if k in argv else d
PHOTO = "--photo" in argv
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene

# ---------------- cast ----------------
FEM = dict(skin="#e9b996", hair="#4a2f25", lip="#a83a3e", lash="#2a1a16", lashes=True, scale=0.5)
MOM1 = Char("mom1", dict(FEM, style="long", top="#c8202c", bottom="#c8202c", dress=True, shoe="#d8b25a"))
MOM2 = Char("mom2", dict(FEM, style="long", top="#a9c6e6", bottom="#5c6274", shoe="#e8e4dc"))
MOM3 = Char("mom3", dict(FEM, style="long", top="#b7d3dc", bottom="#b7d3dc"))
MOM4 = Char("mom4", dict(FEM, style="bun", top="#c99a3e", bottom="#6b5446", grey=True, shoe="#8a6a50"))
SON = Char("son", dict(skin="#e3ae8a", hair="#2b211c", style="short", top="#2c3e66", bottom="#4a5f80", lip="#8c4a42", scale=0.53))
KID = Char("kid", dict(skin="#e3ae8a", hair="#2b211c", style="short", top="#f2c14e", bottom="#4a5f80", lip="#8c4a42", scale=0.34))
FR1 = Char("fr1", dict(skin="#c98e6a", hair="#1f1814", style="short", top="#2a9d8f", bottom="#33334a", scale=0.5))
FR2 = Char("fr2", dict(FEM, skin="#f0c9a8", hair="#c7893e", style="long", top="#e9c46a", bottom="#e9c46a", dress=True))
CAST = [MOM1, MOM2, MOM3, MOM4, SON, KID, FR1, FR2]
GREY = [o for o in bpy.data.objects if o.name.startswith("mom4_hg")]
for o in bpy.data.objects:
    if o.name.startswith("mom3_shoe"): o.scale = (0.001,) * 3
# props on characters
test_in_hand = piv("handtest", MOM2.arms[1][2], (0, -0.1, -0.12), (R(90), 0, R(90)))
rbox("ht_b", (0.62, 0.12, 0.05), mat("testw", "#f7f7f7"), test_in_hand, (0, 0, 0), 0.015)
rbox("ht_c", (0.18, 0.124, 0.054), mat("testcap", "#7fb3e8"), test_in_hand, (0.3, 0, 0), 0.015)
held_dress = dress_prop("held_dress", MOM4.spine, (0, -0.75, 0.55), (R(-12), 0, 0), 2.2)
phone = rbox("son_phone", (0.2, 0.36, 0.03), mat("phone", "#141418", 0.2, coat=1), SON.arms[1][2], (0, -0.12, -0.12), 0.02, rot=(R(70), 0, 0))
son_photo = piv("son_photo", SON.arms[1][2], (0.05, -0.2, -0.05), (R(-10), 0, R(-15)))
rbox("sp_b", (0.36, 0.008, 0.44), mat("phborder", "#fbfaf6"), son_photo, (0, 0, 0), 0.006)
pth = os.path.join(TEX, "photo.png")
plane("sp_img", 0.3, 0.34, img_mat("photoimg2", pth) if os.path.exists(pth) else mat("phgrey", "#888888"), son_photo, (0, -0.006, 0.025))
# baby (in character units, rides on Mom's chest)
baby = piv("baby", MOM3.spine, (0.05, -0.8, 0.85), (R(-35), 0, R(-12))); baby.scale = (1.3,) * 3
rbox("bb_wrap", (0.8, 0.46, 0.44), mat("babyblanket", "#f6efe2", 0.9), baby, (0.15, 0, 0), 0.18, seg=5)
bh = piv("bb_head", baby, (-0.4, -0.02, 0.1), (0, 0, 0))
bskin = mat("babyskin", "#f1bfa0", 0.5, sss=0.15)
rbox("bb_face", (0.36, 0.32, 0.34), bskin, bh, (0, 0, 0), 0.1, seg=4)
rbox("bb_hat", (0.4, 0.36, 0.14), mat("babyhat", "#a9cbe8", 0.9), bh, (0, 0.02, 0.18), 0.06)
for x in (-0.08, 0.08): rbox("bb_eye", (0.07, 0.02, 0.014), mat("pupil", "#16151a"), bh, (x, -0.165, 0.03), 0.005)
baby_mouth = rbox("bb_mouth", (0.07, 0.02, 0.06), mat("mouthin", "#3a1216"), bh, (0, -0.165, -0.07), 0.015)
for x in (-0.11, 0.11): rbox("bb_blush", (0.06, 0.01, 0.03), mat("blush", "#ff8f8f"), bh, (x, -0.165, -0.04), 0.01)

PARTY, BED, KIT, HOSP, INS = build_party(), build_bed(), build_kitchen(), build_hosp(), build_ins()
mustard, navy = mat("mustard", "#c99a3e", 0.85), mat("navy", "#2c3e66", 0.85)
bed_box, bed_flaps = box_open("bedbox", BED.root, (0.55, 1.15, 0.58), scale=1.0)
dress_peek = rbox("bedbox_dress", (0.4, 0.3, 0.06), mat("dressred", "#c8202c"), bed_box, (0, 0, 0.2), 0.03)

# ---------------- camera / world / render ----------------
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.dof.use_dof = True; cam.data.clip_start = 0.02
w = bpy.data.worlds.new("w"); sc.world = w; w.color = (0.004, 0.004, 0.006)
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(arg("--spp", 24)); sc.cycles.use_denoising = True
sc.cycles.adaptive_threshold = 0.04; sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2
sc.cycles.transmission_bounces = 2; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = 720, 1280; sc.render.resolution_percentage = int(arg("--scale", 100))
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.use_persistent_data = True; sc.render.image_settings.file_format = "PNG"

def P(place, x, y, z): return Vector((PL[place] + x, y, z))
def set_cam(pos, look, lens, focus, fstop=2.2):
    cam.location = pos; aim(cam, look); cam.data.lens = lens
    fwd = (Vector(look) - Vector(pos)).normalized(); cam.data.dof.focus_distance = max(0.05, (Vector(focus) - Vector(pos)).dot(fwd))
    cam.data.dof.aperture_fstop = fstop
def lights(place, mode):
    for (pl, md), objs in LIGHTS.items():
        for o in objs: o.hide_render = not (pl == place and md == mode)
def headpos(c, fwd=0.0, up=0.0):
    bpy.context.view_layer.update(); m = c.head.matrix_world
    return m @ Vector((0, -fwd, 0.5 + up))
def L3(a, b, k): return a.lerp(b, k)
def shake(t, amp, f=19): return amp * math.sin(t * f) * math.sin(t * f * 0.37 + 1)

ARMS0 = dict(armL=(0, 6, 8, 0), armR=(0, 6, 8, 0))
SIT = dict(legL=(84, 4), legR=(84, 4))

# ---------------- shots ----------------
def s_party(t, g):
    lights("party", "night"); c = MOM1
    spin = 360 * smooth(seg(t, 0.8, 2.2)); c.place(P("party", 0, 0.3, 0), spin)
    b = math.sin(t * 7.0)
    c.set_pose(dict(armL=(70 + 30 * b, 70 - 20 * b, 50, 0), armR=(70 - 30 * b, 70 + 20 * b, 50, 0), spine=(4, 6 * b, 0),
                    head=(-8, -10 * b, 0), legL=(10 * max(0, b), 4), legR=(10 * max(0, -b), 4)))
    c.face(track([(0, "laugh"), (2.4, "joy"), (3.4, "laugh")], t), t)
    for f, x, y, ph in ((FR1, -1.3, 1.7, 0.5), (FR2, 1.35, 2.0, 1.7)):
        bb = math.sin(t * 6.4 + ph); f.place(P("party", x, y, 0.05 * abs(bb)), 15 * bb)
        f.set_pose(dict(armL=(60 + 40 * bb, 40, 70, 0), armR=(60 - 40 * bb, 40, 70, 0), spine=(0, 5 * bb, 0), head=(-6, 8 * bb, 0)))
        f.face(track([(0, "laugh")], t), t)
    k = smooth(t / 5); hp = headpos(c)
    set_cam(L3(P("party", 0.45, -2.5, 1.25), P("party", 0.25, -1.75, 1.2), k), P("party", 0, 0.3, 1.05), 38, hp, 1.8)
    return [c, FR1, FR2]

def mom2_sit(t, extra):
    c = MOM2; c.place(P("bed", -0.15, 0.6, 0), 0)
    p = dict(SIT, hips=0.18, **extra); c.set_pose(p); return c

def s_test(t, g):
    lights("bed", "morning"); test_in_hand.hide_render = False
    up = smooth(seg(t, 1.0, 1.5))
    c = mom2_sit(t, dict(armL=(55 + 60 * up, -10, 70 + 50 * up, 0), armR=(55, -14, 72, 0), head=(14 - 10 * up, 0, 0)))
    c.face(track([(0, "blank"), (0.7, "shock"), (1.6, "shock")], t), t)
    k = smooth(t / 2.2); hp = headpos(c)
    set_cam(L3(P("bed", 0.2, -1.55, 1.25), P("bed", 0.12, -1.25, 1.24), k), P("bed", -0.15, 0.6, 1.08), 40, hp, 2.0)
    return [c]

def s_testins(t, g):
    lights("ins", "warm"); show(INS.test, True); INS.line2.scale = (1, 1, 1) if t > 0.35 else (1, 1, 0.001)
    k = smooth(seg(t, 0.35, 0.8)); INS.line2.scale = (1, max(0.001, k), 1)
    set_cam(L3(P("ins", 0.0, 0.08, 0.36), P("ins", 0.0, 0.12, 0.3), smooth(t / 1.2)), P("ins", -0.02, 0.25, 0.06), 50, P("ins", -0.02, 0.25, 0.06), 2.8)
    return []

def s_happy(t, g):
    lights("bed", "morning"); test_in_hand.hide_render = False
    bel = smooth(seg(t, 0.4, 1.2))
    c = mom2_sit(t, dict(armL=(115 - 70 * bel, -10, 120 - 40 * bel, 0), armR=(25 + 10 * bel, -22, 60 + 25 * bel, 0), head=(10 + 8 * bel, 0, 0)))
    c.face(track([(0, "shock"), (0.3, "touched"), (0.9, "happycry")], t), t)
    hp = headpos(c); f = c.head.matrix_world.to_3x3() @ Vector((0, -1, 0))
    f.normalize(); set_cam(hp + f * mix(1.45, 1.25, smooth(t / 1.6)) + Vector((0.12, 0, -0.08)), hp + Vector((0, 0, -0.34)), 38, hp, 2.0)
    return [c]

def s_sick(t, g):
    lights("kit", "day"); c = MOM2; c.place(P("kit", -0.75, 1.3, 0), -70)
    up = smooth(seg(t, 1.3, 1.8))
    c.set_pose(dict(armL=(75 - 50 * up, 10, 25 + 50 * up, 0), armR=(75 - 45 * up, 10, 25 + 60 * up, 0), spine=(40 * (1 - up), 0, 0), head=(20 * (1 - up) - 6, 0, 0), belly=0.45))
    c.face(track([(0, "sick"), (1.35, "sick"), (1.75, "sadsmile")], t), t)
    hp = headpos(c)
    set_cam(P("kit", -2.15, 0.75, 1.15), hp + Vector((0, 0, -0.12)), 40, hp, 2.2)
    return [c]

def s_night(t, g):
    lights("bed", "night"); c = MOM2; c.place(P("bed", -1.32, 1.5, 0.06), 90)
    rub = math.sin(t * 6) * 10; luv = smooth(seg(t, 1.4, 1.9))
    c.set_pose(dict(legL=(90, 2), legR=(90, 2), hips=0.04, spine=(-14, 0, 0), armR=(-25 + rub * 0.3 + 40 * luv, 18 - 34 * luv, 60 + rub + 20 * luv, 0),
                    armL=(32, -22, 82, 0), head=(4 + 10 * luv, 6, 0), belly=0.8))
    c.face(track([(0, "tired"), (1.3, "tired"), (1.65, "sadsmile"), (2.0, "love")], t), t)
    hp = headpos(c)
    set_cam(L3(P("bed", 0.55, 0.15, 1.15), P("bed", 0.35, 0.3, 1.12), smooth(t / 2.4)), P("bed", -1.35, 1.45, 0.85), 34, hp, 2.2)
    return [c]

def s_kick(t, g):
    lights("kit", "day"); c = MOM2; c.place(P("kit", -0.25, 0.95, 0), 12)
    kick = math.exp(-((t - 1.1) / 0.12) ** 2) * 0.12; joy = smooth(seg(t, 1.1, 1.4))
    c.set_pose(dict(armR=(-25 + 55 * joy, 14 - 30 * joy, 70 + 15 * joy, 0), armL=(30, -24, 80, 0), spine=(-6, 0, 0), head=(-4 + 12 * joy, 0, 0), belly=1.0 + kick))
    c.face(track([(0, "tired"), (0.45, "worried"), (1.1, "shock"), (1.4, "joy")], t), t)
    hp = headpos(c)
    set_cam(L3(P("kit", 0.75, -1.45, 1.25), P("kit", 0.6, -1.2, 1.22), smooth(t / 2.2)), P("kit", -0.25, 0.95, 1.0), 40, hp, 2.2)
    return [c]

def mom3_bed(t, extra):
    c = MOM3; c.place(P("hosp", 0, 1.12, 0.31), 0)
    c.set_pose(dict(dict(legL=(90, 2), legR=(90, 2), spine=(-42, 0, 0), belly=1.0), **extra)); return c

def s_labour(t, g):
    lights("hosp", "night"); con = math.exp(-((t - 1.3) / 0.9) ** 2)
    c = mom3_bed(t, dict(armR=(15, 58, 30 + 10 * con, 0), armL=(35, -20, 80, 0), head=(22 + shake(t, 4 * con), shake(t + 1, 5 * con), 0)))
    c.face(track([(0, "tired"), (0.35, "pain"), (2.2, "pain"), (2.7, "tired")], t), t)
    hp = headpos(c)
    set_cam(L3(P("hosp", -0.62, -0.75, 1.45), P("hosp", -0.45, -0.45, 1.42), smooth(t / 3)), hp + Vector((0, 0, -0.18)), 36, hp, 2.2)
    return [c]

def s_clock(t, g):
    lights("hosp", "night"); hrs = 2 + 11 * smooth(t / 0.9)
    HOSP.hh.rotation_euler = (0, R((hrs % 12) / 12 * 360), 0); HOSP.mh.rotation_euler = (0, R((hrs % 1) * 360), 0)
    cp = P("hosp", -1.15, 2.22, 2.15)
    set_cam(cp + Vector((0.05, -0.9, -0.05)), cp, 50, cp, 4)
    return []

def s_grip(t, g):
    lights("hosp", "night"); sq = 0.5 + 0.5 * math.sin(t * 9)
    c = mom3_bed(t, dict(armR=(15, 58, 34 + 6 * sq, 0), armL=(35, -20, 80, 0), head=(22, 0, 0)))
    c.arms[1][2].scale = (1.0 + 0.06 * sq, 1.0, 1.0 - 0.08 * sq)
    c.face(track([(0, "pain")], t), t)
    bpy.context.view_layer.update(); hp = c.arms[1][2].matrix_world.translation
    set_cam(hp + Vector((0.5, -0.62, 0.22 + shake(t, 0.004))), hp + Vector((-0.1, 0, 0.05)), 45, hp, 2.4)
    return [c]

def s_push(t, g):
    lights("hosp", "night"); MOM3.arms[1][2].scale = (1, 1, 1)
    c = mom3_bed(t, dict(armR=(15, 58, 30, 0), armL=(35, -20, 80, 0), head=(26 + shake(t, 2 * seg(t, 1.0, 1.9)), 0, 0)))
    c.face(track([(0, "tired"), (0.55, "resolve"), (1.05, "strain"), (1.9, "strain")], t), t)
    hp = headpos(c); f = c.head.matrix_world.to_3x3() @ Vector((0, -1, 0))
    f.normalize(); set_cam(hp + f * mix(1.4, 1.15, smooth(t / 1.9)) + Vector((0.08, 0, -0.1)), hp + Vector((0, 0, -0.34)), 38, hp, 2.0)
    return [c]

def s_baby(t, g):
    lights("hosp", "dawn"); HOSP.win.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 0.7, 0.45, 1)
    baby.hide_render = False; show(baby, True)
    c = mom3_bed(t, dict(armL=(48, -30, 95, 0), armR=(48, -30, 95, 0), head=(36, 6, 0), belly=0.35))
    c.face(track([(0, "tired"), (0.8, "melt"), (2.0, "happycry"), (4.6, "love")], t), t)
    cry = t < 1.6; baby_mouth.scale = (1, 1, 1.0 if cry else 0.25)
    hp = headpos(c)
    set_cam(L3(P("hosp", 0.95, -0.95, 1.5), P("hosp", 0.75, -0.7, 1.48), smooth(t / 6.8)), hp + Vector((-0.05, -0.2, -0.32)), 38, hp, 2.6)
    return [c]

def flaps(fl, k):  # k=1 open (folded out), 0 closed
    for p, sy in fl: p.rotation_euler = (R(-sy * 115 * k), 0, 0)

def s_pack(t, g):
    lights("ins", "warm"); show(INS.box, True); show(INS.items, True); show(INS.test, False); INS.blanket.hide_render = False
    INS.sleeve.data.materials[0] = mustard
    flaps(INS.flaps, 1 - smooth(seg(t, 2.9, 3.8)))
    k = smooth(seg(t, 0.2, 1.8))
    INS.photo.location = L3(Vector((0.18, 0.12, 0.45)), Vector((0.06, 0.48, 0.235)), k); INS.photo.rotation_euler = (R(-90 * k), 0, R(-10 + 14 * k))
    show(INS.photo, t < 2.95)
    ar = smooth(seg(t, 1.9, 2.6))
    INS.arm.location = INS.photo.location + Vector((0.12, -0.03, 0.06)) + Vector((0.25, -0.3, 0.3)) * ar
    INS.arm.rotation_euler = (R(-50), R(-35), 0); show(INS.arm, t < 2.6)
    set_cam(L3(P("ins", 0.32, -0.36, 0.78), P("ins", 0.26, -0.2, 0.7), smooth(t / 4)), P("ins", 0.0, 0.48, 0.14), 38, P("ins", 0, 0.45, 0.2), 3.2)
    return []

def s_dress(t, g):
    lights("bed", "day"); show(held_dress, True)
    c = MOM4; c.place(P("bed", 0.65, 0.5, 0), -8)
    for o in GREY: o.hide_render = True
    c.set_pose(dict(armL=(62, -24, 50, 0), armR=(62, -24, 50, 0), head=(16, 4, 0)))
    held_dress.rotation_euler = (R(-12 + 3 * math.sin(t * 2)), 0, 0)
    c.face(track([(0, "sadsmile"), (1.1, "sad"), (1.8, "sadsmile")], t), t)
    hp = headpos(c)
    set_cam(L3(P("bed", 0.62, -0.95, 1.28), P("bed", 0.6, -0.75, 1.25), smooth(t / 2.2)), P("bed", 0.65, 0.5, 1.08), 42, hp, 2.2)
    return [c]

def s_ward(t, g):
    lights("bed", "day"); show(BED.topbox, True)
    c = MOM4
    for o in GREY: o.hide_render = True
    turn = smooth(seg(t, 0.8, 1.5)); c.place(P("bed", 1.95, 1.2 - 0.25 * turn, 0), 180 + 170 * turn)
    dn = smooth(seg(t, 0.0, 0.7))
    c.set_pose(dict(armL=(165 - 160 * dn, -8, 10, 0), armR=(165 - 160 * dn, -8, 10, 0), head=(-25 * (1 - turn) + 4, 0, -50 * turn * (1 - smooth(seg(t, 1.5, 1.8))))))
    c.face(track([(0, "sadsmile"), (1.2, "sad"), (1.6, "sadsmile")], t), t)
    set_cam(P("bed", 0.15, -1.55, 1.35), P("bed", 1.55, 1.5, 1.45), 28, P("bed", 1.95, 1.2, 1.3), 4)
    return [c]

def s_years(t, g):
    lights("kit", "day")
    c = MOM4
    for o in GREY: o.hide_render = True
    c.place(P("kit", 0.55, 1.25, 0), -60)
    st = math.sin(t * 5)
    c.set_pose(dict(armR=(55, -10, 60 + 15 * st, 0), armL=(30, 10, 40, 0), head=(4, 0, -45 if t > 0.9 else 0)))
    c.face(track([(0, "tired"), (1.0, "happy")], t), t)
    k = KID; k.place(P("kit", -1.2, 1.0, 0), 0)
    call = 0.3 < t < 2.2
    k.set_pose(dict(SIT, hips=0.42, armL=(70, -5, 20 + (50 * abs(st) if call else 0), 0), armR=(70 + (50 if call else 0), -5, 30, 0), head=(-8, 0, -20 if call else 0)))
    talk = abs(math.sin(t * 13)) if call else 0
    k.face(expr_mix("joy", dict(EXPR["happy"], open=0.5 * talk + 0.1), 0.5), t)
    set_cam(L3(P("kit", 0.8, -1.35, 1.35), P("kit", 0.7, -1.15, 1.33), smooth(t / 2.5)), P("kit", -0.1, 1.0, 0.95), 26, P("kit", -0.3, 1.0, 0.95), 4)
    return [c, k]

def s_passby(t, g):
    lights("kit", "eve")
    c = MOM4
    for o in GREY: o.hide_render = False
    c.place(P("kit", 0.45, 1.25, 0), 14)
    c.set_pose(dict(armL=(35, -18, 70, 0), armR=(35, -18, 70, 0), head=(2, 0, -25 if t < 2.2 else -10)))
    c.face(track([(0, "tired"), (0.7, "blank"), (2.2, "sadsmile"), (3.0, "happy"), (3.6, "sadsmile")], t), t)
    s = SON; show(phone, True)
    x = mix(1.7, -1.2, smooth(seg(t, 0.0, 3.8))); s.place(P("kit", x, 0.55, 0), -90)
    wk = math.sin(t * 8.5)
    s.set_pose(dict(legL=(25 * wk, 0), legR=(-25 * wk, 0), armL=(-20 * wk, 6, 10, 0), armR=(48, -8, 82, 0), head=(14, 0, 55 if 0.6 < t < 2.2 else 0)))
    talk = abs(math.sin(t * 12)) if 0.4 < t < 2.0 else 0
    s.face(dict(expr_mix("bored", "bored", 0), open=0.35 * talk), t)
    set_cam(L3(P("kit", 0.15, -1.75, 1.32), P("kit", 0.1, -1.5, 1.32), smooth(t / 4)), P("kit", 0.2, 0.95, 1.05), 32, headpos(c), 3)
    return [c, s]

def s_open(t, g):
    lights("ins", "cool"); show(INS.box, True); show(INS.items, True); show(INS.test, False)
    flaps(INS.flaps, 1); INS.sleeve.data.materials[0] = navy
    k = smooth(seg(t, 1.2, 3.0))
    INS.photo.location = L3(Vector((0.06, 0.48, 0.235)), Vector((0.03, 0.18, 0.5)), k)
    INS.photo.rotation_euler = (R(-90 + 78 * k), 0, R(4 - 4 * k)); show(INS.photo, True)
    INS.arm.location = INS.photo.location + Vector((0.11, 0.0, -0.04)); INS.arm.rotation_euler = (R(-60), R(-40), R(10))
    show(INS.arm, t > 1.0)
    set_cam(L3(P("ins", 0.12, -0.2, 0.8), P("ins", 0.08, -0.32, 0.62), smooth(seg(t, 0.8, 3.0))), L3(P("ins", 0.0, 0.48, 0.14), P("ins", 0.03, 0.2, 0.45), smooth(seg(t, 1.0, 3.0))), 40,
            L3(P("ins", 0.0, 0.48, 0.14), P("ins", 0.03, 0.18, 0.5), smooth(seg(t, 1.0, 3.0))), 3.2)
    return []

def s_realise(t, g):
    lights("bed", "night"); s = SON; show(son_photo, True); show(bed_box, True); flaps(bed_flaps, 1)
    s.place(P("bed", -0.2, 0.6, 0), 0)
    s.set_pose(dict(SIT, hips=0.14, armR=(58, -18, 70, 0), armL=(58, -26, 75, 0), head=(16 - 8 * smooth(seg(t, 3.0, 3.5)), 0, 40 * smooth(seg(t, 3.0, 3.5))), spine=(10, 0, 0)))
    s.face(track([(0, "blank"), (0.9, "worried"), (1.7, "sad"), (2.5, "cry")], t), t)
    hp = headpos(s)
    set_cam(L3(P("bed", 0.05, -1.0, 1.3), P("bed", -0.05, -0.78, 1.28), smooth(t / 3.5)), hp + Vector((0, 0, -0.36)), 42, hp, 2.0)
    return [s]

def s_hug(t, g):
    lights("kit", "eve"); c = MOM4
    for o in GREY: o.hide_render = False
    show(KIT.dress, True)
    c.place(P("kit", 0.5, 1.0, 0), 16)
    melt = smooth(seg(t, 2.4, 3.2))
    c.set_pose(dict(armL=(30 + 25 * melt, -20, 75 + 20 * melt, 0), armR=(30, -18, 70, 0), head=(4, -10 * melt, -6 * melt), spine=(0, -3 * melt, 0)))
    c.face(track([(0, "tired"), (1.25, "shock"), (1.8, "touched"), (2.6, "melt"), (4.2, "happycry"), (6.0, "melt")], t), t)
    s = SON; walk_in = smooth(seg(t, 0.0, 1.1))
    s.place(P("kit", mix(-0.7, 0.58, walk_in), mix(1.35, 1.3, walk_in), 0), mix(-90, 16, smooth(seg(t, 0.8, 1.3))))
    wk = math.sin(t * 8.5) * (1 - walk_in)
    hugk = smooth(seg(t, 1.0, 1.6))
    s.set_pose(dict(legL=(25 * wk, 0), legR=(-25 * wk, 0), armL=(80 * hugk, 6 - 34 * hugk, 10 + 40 * hugk, 0), armR=(80 * hugk, 6 - 34 * hugk, 10 + 40 * hugk, 0),
                    spine=(12 * hugk, 0, 0), head=(14 * hugk, -16 * hugk, 0)))
    s.face(track([(0, "sad"), (1.4, "cry"), (3.8, "touched"), (5.5, "sadsmile")], t), t)
    hp = headpos(c)
    set_cam(L3(P("kit", 0.85, -1.15, 1.45), P("kit", 0.66, -0.7, 1.45), smooth(t / 8)), hp + Vector((0.1, 0, -0.34)), 40, hp, 2.0)
    return [c, s]

S = lambda s: int(round(s * FPS))
SHOTS = [  # (start s, end s, stage)
    (0, 5, s_party), (5, 7.2, s_test), (7.2, 8.4, s_testins), (8.4, 10, s_happy), (10, 12.4, s_sick), (12.4, 14.8, s_night),
    (14.8, 17, s_kick), (17, 20, s_labour), (20, 20.9, s_clock), (20.9, 21.7, s_grip), (21.7, 23.6, s_push), (23.6, 25.2, None),
    (25.2, 32, s_baby), (32, 36, s_pack), (36, 38.2, s_dress), (38.2, 40, s_ward), (40, 42.5, s_years), (42.5, 46.5, s_passby),
    (46.5, 50, s_open), (50, 54, s_realise), (54, 62, s_hug)]
TOTAL = S(62)
PROPS = [test_in_hand, held_dress, phone, son_photo, baby, BED.topbox, bed_box, KIT.dress, INS.test, INS.box, INS.photo, INS.arm]

def stage(f):
    t = f / FPS
    for a, b, fn in SHOTS:
        if S(a) <= f < S(b): break
    for p in PROPS: show(p, False)
    for c in CAST: show(c.root, False)
    if fn is None: return None
    chars = fn(t - a, t) or []
    snap = {p: p.hide_render for p in PROPS}
    for c in chars: show(c.root, True)
    for p in PROPS: show(p, not snap[p])
    return fn

if PHOTO:   # her photo for the box: young Mom laughing at the party
    lights("party", "night"); stage(S(3.1)); MOM1.face(track([(0, "laugh")], 0), 0)
    hp = headpos(MOM1); set_cam(hp + Vector((0.08, -1.9, -0.1)), hp + Vector((0, 0, -0.22)), 50, hp, 2.0)
    sc.render.resolution_x, sc.render.resolution_y = 600, 680; sc.render.filepath = os.path.join(TEX, "photo.png")
    bpy.ops.render.render(write_still=True); sys.exit(0)

if "--frames" in argv: frames = [int(x) for x in arg("--frames").split(",")]
elif "--range" in argv: i = argv.index("--range"); frames = list(range(int(argv[i + 1]), int(argv[i + 2])))
else: frames = list(range(TOTAL))
for f in frames:
    fp = os.path.join(OUT, "%04d.png" % f)
    if os.path.exists(fp) and "--force" not in argv: continue
    sc.frame_set(f)
    if stage(f) is None: continue
    if "--debug" in argv:
        bpy.context.view_layer.update()
        vis = [c.n for c in CAST if not c.root.hide_render]
        print("DBG", f, tuple(round(x, 2) for x in cam.location), [ (c.n, tuple(round(x,2) for x in c.root.location), tuple(round(x,2) for x in headpos(c))) for c in CAST if c.n in vis],
              "test", test_in_hand.hide_render, [o.hide_render for o in test_in_hand.children]); continue
    sc.render.filepath = fp; bpy.ops.render.render(write_still=True)
print("DONE", len(frames))
