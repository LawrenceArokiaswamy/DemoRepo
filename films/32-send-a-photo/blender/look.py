# Film 32 Blender look test: the couch, evening lamp light. Dad turns to his son with the phone: "Son... how do I send a
# photo?" The son keeps typing. Dad's arm comes down, his brows fall, he sinks a little. 4.5 s.
# python look.py [--frames a-b | --frames 1,40] [--res 540] [--samples 48] [--out out/look] [--blend]
import sys, os, math, argparse, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
import toy
from toy import Toy, mat, plaid, knit, rbox, sphere, capsule, piv, key, lin

HERE = os.path.dirname(os.path.abspath(__file__))
PH = os.path.join(HERE, "..", "remotion", "public", "ph")
BA = "/root/blender_assets"
ap = argparse.ArgumentParser(); ap.add_argument("--frames", default="1"); ap.add_argument("--res", type=int, default=540)
ap.add_argument("--samples", type=int, default=48); ap.add_argument("--out", default=os.path.join(HERE, "out", "look")); ap.add_argument("--blend", action="store_true")
A = ap.parse_args()
FPS = 24; DUR = 4.5
F = lambda t: 1 + round(t * FPS)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = F(DUR)

# ---------- helpers ----------
def tex_mat(name, stem, scale=1.0, folder=None, tint=None, rough_k=1.0):
    folder = folder or os.path.join(PH, "tex")
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
    b = N["Principled BSDF"]; tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale,) * 3
    L.new(tc.outputs["Generated" if False else "Object"], mp.inputs[0])
    def img(suffix, non_color=False):
        p = os.path.join(folder, f"{stem}_{suffix}.jpg")
        if not os.path.exists(p): return None
        t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(p); t.projection = 'BOX'; t.projection_blend = 0.2
        if non_color: t.image.colorspace_settings.name = 'Non-Color'
        L.new(mp.outputs[0], t.inputs[0]); return t
    d = img("diff")
    if d:
        if tint:
            mx = N.new("ShaderNodeMix"); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs["Factor"].default_value = 1
            L.new(d.outputs[0], mx.inputs["A"]); mx.inputs["B"].default_value = (*lin(tint), 1); L.new(mx.outputs["Result"], b.inputs["Base Color"])
        else: L.new(d.outputs[0], b.inputs["Base Color"])
    r = img("rough", True)
    if r:
        mm = N.new("ShaderNodeMath"); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = rough_k; L.new(r.outputs[0], mm.inputs[0]); L.new(mm.outputs[0], b.inputs["Roughness"])
    n = img("nor", True)
    if n:
        nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.6; L.new(n.outputs[0], nm.inputs["Color"]); L.new(nm.outputs[0], b.inputs["Normal"])
    return m

def plane(name, size, material, loc, rot=(0, 0, 0)):
    o = rbox(name, (size[0], size[1], 0.01), material, None, loc, bevel=0); o.rotation_euler = [math.radians(a) for a in rot]; return o

def gltf(path, loc, rot_z=0.0, scale=1.0):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    g = piv(os.path.basename(path), None, loc)
    for o in new:
        if o.parent is None: o.parent = g
    g.rotation_euler = (0, 0, math.radians(rot_z)); g.scale = (scale,) * 3
    return g

def aim(o, target):
    d = Vector(target) - o.location; o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def area(name, loc, target, size, power, col, shape='RECTANGLE', size_y=None):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.color = col; l.shape = shape; l.size = size; l.size_y = size_y or size
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc; aim(o, target); return o

def point(name, loc, power, col, r=0.05):
    l = bpy.data.lights.new(name, 'POINT'); l.energy = power; l.color = col; l.shadow_soft_size = r
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc; return o

WARM = (1.0, 0.71, 0.44); COOL = (0.55, 0.68, 1.0); SCREEN = (0.62, 0.78, 1.0)

# ---------- room ----------
floor = plane("floor", (8, 8), tex_mat("floor", "old_wooden_floor_02", 0.5, tint="#c9a27e"), (0, 0, 0))
wall = plane("wall_back", (8, 4), tex_mat("wall", "beige_wall_001", 0.6, folder=os.path.join(HERE, "assets", "tex"), tint="#d9b48f"), (0, 0.78, 2), (90, 0, 0))
wall_l = plane("wall_left", (6, 4), tex_mat("wall_l", "beige_wall_001", 0.6, folder=os.path.join(HERE, "assets", "tex"), tint="#c79f7d"), (-2.3, -1, 2), (90, 0, 90))
skirting = rbox("skirt", (8, 0.03, 0.12), mat("skirt", "#efe6da", 0.45), None, (0, 0.76, 0.06), bevel=0.004)
rug = plane("rug", (2.6, 1.9), tex_mat("rug", "fabric_pattern_07", 1.4, tint="#e7b48c", rough_k=1.0), (0, -0.85, 0.006))
sofa = gltf(f"{BA}/models/sofa_03/sofa_03.gltf", (0, 0.3, 0))
table = gltf(f"{PH}/models/CoffeeTable_01/CoffeeTable_01.gltf", (0.0, -1.45, 0), 0, 0.9)
gltf(f"{BA}/models/potted_plant_02/potted_plant_02.gltf", (-1.3, 0.4, 0), 20, 1.2)
def picture(name, img, loc, w, h, frame_col="#f1ebe0"):
    """own frame: moulding box + a UV-mapped print"""
    fm = mat(name + "_frame", frame_col, 0.4, coat=0.3)
    rbox(name + "_frame", (w + 0.07, 0.03, h + 0.07), fm, None, loc, bevel=0.008)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(loc[0], loc[1] - 0.017, loc[2]), rotation=(math.radians(90), 0, 0))
    p = bpy.context.active_object; p.name = name; p.scale = (w, h, 1)
    m = bpy.data.materials.new(name + "_print"); m.use_nodes = True; N = m.node_tree.nodes
    t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(img); m.node_tree.links.new(t.outputs[0], N["Principled BSDF"].inputs["Base Color"])
    N["Principled BSDF"].inputs["Roughness"].default_value = 0.35; p.data.materials.append(m)
ART = os.path.join(HERE, "assets", "art")
picture("pic_lake", f"{ART}/lake.jpg", (-0.6, 0.76, 1.72), 0.36, 0.48)
picture("pic_sunset", f"{ART}/sunset.jpg", (0.6, 0.76, 1.68), 0.52, 0.39)
gltf(f"{PH}/models/mantel_clock_01/mantel_clock_01.gltf", (-0.55, -1.4, 0.43), 25, 1.0)
gltf(f"{BA}/models/ceramic_vase_01/ceramic_vase_01.gltf", (0.6, -1.5, 0.43), 0, 1.0)
# floor lamp (right of the sofa): pole, base, glowing fabric shade, warm bulb
lamp = piv("lamp", None, (1.2, 0.35, 0))
brass = mat("brass", "#8a6a3a", 0.35, coat=0.3)
capsule("lamp_pole", 0.012, 1.35, brass, lamp, (0, 0, 1.38))
sphere("lamp_base", 0.14, brass, lamp, (0, 0, 0.01), scale=(1, 1, 0.12))
shade_m = mat("shade", "#f3dcb4", 0.8); sb = shade_m.node_tree.nodes["Principled BSDF"]
sb.inputs["Transmission Weight"].default_value = 0.0; sb.inputs["Emission Color"].default_value = (*lin("#ffc88a"), 1); sb.inputs["Emission Strength"].default_value = 3.0
import bmesh
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=0.24, radius2=0.16, depth=0.3)
me = bpy.data.meshes.new("shade"); bm.to_mesh(me); bm.free(); me.materials.append(shade_m)
so = bpy.data.objects.new("lamp_shade", me); sc.collection.objects.link(so); so.parent = lamp; so.location = (0, 0, 1.45)
so.modifiers.new("sol", 'SOLIDIFY').thickness = 0.006
point("bulb", (1.2, 0.35, 1.42), 55, WARM, 0.06)

# ---------- people ----------
DAD = dict(skin="#f2c6a5", top_mat=plaid("dad_flannel", "#a8352c", "#3b2337", "#e7c9a0", 8.0), pants="#4a5368", shoes="#5b3d28",
           hair="#d8d3cc", brow="#b9b2a8", hair_style="grey", glasses=True, width=1.12, buttons=4)
SON = dict(skin="#f4cfb2", top_mat=knit("son_hoodie", "#6d7a8e"), pants="#2c3954", shoes="#ece8e0", hair="#3a281d", hood=True, width=1.0)
SEAT = 0.5
dad = Toy("dad", DAD); son = Toy("son", SON)
dad.root.location = (0.48, 0.16, SEAT + 0.06); son.root.location = (-0.48, 0.16, SEAT + 0.06)
dad.root.rotation_euler = (0, 0, math.radians(-8)); son.root.rotation_euler = (0, 0, math.radians(10))
for t in (dad, son): t.sit(1)

# laptop on the son's lap: base + lid with a glowing screen; its light falls on his face
lap = piv("laptop", son.root, (0, -0.24, 0.085))
alu = mat("alu", "#b9bcc2", 0.3, coat=0.2)
rbox("lap_base", (0.32, 0.22, 0.014), alu, lap, (0, 0, 0), bevel=0.006)
rbox("lap_keys", (0.27, 0.1, 0.002), mat("keys", "#2b2d33", 0.6), lap, (0, 0.02, 0.008), bevel=0)
lid = piv("lap_hinge", lap, (0, 0.11, 0.007)); lid.rotation_euler = (math.radians(-12), 0, 0)
rbox("lap_lid", (0.32, 0.01, 0.21), alu, lid, (0, 0.006, 0.105), bevel=0.006)
rbox("lap_screen", (0.29, 0.002, 0.18), mat("screen", "#cfe0ff", 0.2, emit=2.2), lid, (0, -0.001, 0.108), bevel=0)
scr = area("screen_light", (0, 0, 0), (0, 0, 0), 0.25, 6, SCREEN, size_y=0.16); scr.parent = lid; scr.location = (0, -0.02, 0.11)
scr.rotation_euler = (math.radians(90), 0, 0)

# Dad's phone (in his right hand)
phone = piv("phone", dad.ha["R"], (0.0, -0.03, -0.03)); phone.rotation_euler = (math.radians(-60), 0, math.radians(10))
rbox("phone_body", (0.075, 0.009, 0.15), mat("phone", "#1d1f24", 0.3, coat=0.6), phone, (0, 0, 0), bevel=0.008)
rbox("phone_scr", (0.066, 0.001, 0.138), mat("phone_scr", "#dfe9ff", 0.2, emit=1.6), phone, (0, -0.005, 0), bevel=0)

# ---------- animation ----------
def dad_arms(f, reach):
    """reach 0: both hands hold the phone over his lap; 1: right arm stretched toward the son"""
    import numpy as np
    a = lambda x, y: x + (y - x) * reach
    key(dad.sh["R"], f, (a(-38, -68), 0, a(12, -38))); key(dad.el["R"], f, (a(-62, -28), 0, 0))
    key(dad.ha["R"], f, (a(0, -10), 0, a(0, 20)))
    key(dad.sh["L"], f, (a(-38, -26), 0, a(-14, -4))); key(dad.el["L"], f, (a(-62, -52), 0, 0))

def dad_head(f, x, z, spine_x=0, spine_y=0):
    key(dad.head, f, (x, 0, z)); key(dad.spine, f, (spine_x, spine_y, 0))

dad_arms(F(0), 0); dad_head(F(0), 16, 0); dad.face(F(0), brow=0.35, brow_up=0, smile=0, lid=0.85)
dad_head(F(0.5), 16, 0); dad.face(F(0.5), brow=0.35, smile=0, lid=0.85)
dad_head(F(1.1), 2, -30, 0, -3); dad.face(F(1.1), brow=0.55, brow_up=1.0, smile=0.6, lid=1.0)
dad_arms(F(1.0), 0); dad_arms(F(1.75), 1)
dad_head(F(1.8), 0, -32, 0, -6)
dad.talk(F(1.5), F(3.0), FPS, seed=3)
dad.face(F(3.0), brow=0.6, brow_up=1.0, smile=0.45, lid=1.0)
dad_arms(F(3.3), 1); dad_head(F(3.3), 0, -32, 0, -6)
dad.face(F(3.6), brow=0.9, brow_up=0.4, smile=-0.1, lid=0.9)
dad_arms(F(4.3), 0.0); dad_head(F(4.3), 18, -8, 7, 0)
dad.face(F(4.4), brow=1.1, brow_up=0.1, smile=-0.6, lid=0.72)
dad.blink(F(0.35), 0.85); dad.blink(F(2.35), 1.0)

# son: eyes on the screen the whole time, typing
key(son.head, F(0), (24, 0, 4)); key(son.spine, F(0), (6, 0, 0))
for side, sx in (("L", 1), ("R", -1)):
    key(son.sh[side], F(0), (-30, 0, sx * -14)); key(son.el[side], F(0), (-66, 0, sx * -8))
son.face(F(0), brow=-0.1, brow_up=0, smile=-0.05, lid=0.62)
for i, t in enumerate([x / FPS for x in range(0, int(DUR * FPS), 3)]):
    side = "LR"[i % 2]; up = 0.006 if (i // 2) % 2 else 0.0
    h = son.ha[side]; h.location = (0, 0, -0.25 + up); h.keyframe_insert("location", frame=F(t))
son.blink(F(1.3), 0.62); son.blink(F(3.9), 0.62)
key(son.head, F(2.4), (24, 0, 4)); key(son.head, F(3.2), (25, 0, 2))

toy.ease_all()

# ---------- lights, world, camera ----------
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (*lin("#2a3348"), 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
area("key", (1.6, -2.2, 2.3), (0.1, 0, 0.9), 1.6, 140, (1.0, 0.86, 0.7))
area("window", (-2.2, -0.6, 1.5), (-0.4, 0.0, 0.9), 1.2, 80, COOL)
area("fill_back", (0.0, 0.5, 2.6), (0, 0.6, 0.0), 2.0, 20, WARM)
def camera(name, lens, focus, fstop, p0, p1, t0, t1, ta, tb):
    d = bpy.data.cameras.new(name); o = bpy.data.objects.new(name, d); sc.collection.objects.link(o)
    d.lens = lens; d.sensor_width = 36; d.dof.use_dof = True; d.dof.aperture_fstop = fstop; d.dof.focus_object = focus
    tg = piv(name + "_tgt", None, t0); tr = o.constraints.new('TRACK_TO'); tr.target = tg; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
    key(o, F(ta), loc=p0); key(o, F(tb), loc=p1); key(tg, F(ta), loc=t0); key(tg, F(tb), loc=t1); return o
CUT = 2.9
cam1 = camera("cam_two", 32, dad.head, 2.4, (0.5, -2.25, 1.42), (0.42, -1.95, 1.37), (0.02, 0.1, 0.98), (0.05, 0.1, 0.98), 0, CUT)
cam2 = camera("cam_dad", 45, dad.head, 2.0, (-0.22, -1.1, 1.36), (-0.14, -0.95, 1.32), (0.46, 0.12, 1.06), (0.46, 0.12, 1.03), CUT, DUR)
sc.camera = cam1
for nm, t, cm in (("two", 0, cam1), ("dad", CUT, cam2)):
    mk = sc.timeline_markers.new(nm, frame=F(t)); mk.camera = cm

# ---------- render ----------
r = sc.render; r.engine = 'CYCLES'; r.resolution_x = A.res; r.resolution_y = round(A.res * 16 / 9); r.resolution_percentage = 100
c = sc.cycles; c.device = 'CPU'; c.samples = A.samples; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.03
c.use_denoising = True; c.denoiser = 'OPENIMAGEDENOISE'; c.max_bounces = 6; c.diffuse_bounces = 3; c.glossy_bounces = 2
c.transmission_bounces = 4; c.caustics_reflective = c.caustics_refractive = False; c.sample_clamp_indirect = 4
r.use_persistent_data = True; r.use_motion_blur = True; r.motion_blur_shutter = 0.4
r.film_transparent = False; r.image_settings.file_format = 'PNG'
vs = sc.view_settings
try: vs.view_transform = 'AgX'
except Exception: pass
for lk in ("AgX - Medium High Contrast", "Medium High Contrast", "AgX - Punchy"):
    try: vs.look = lk; break
    except Exception: pass
vs.exposure = 0.2
os.makedirs(A.out, exist_ok=True)
if A.blend: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "look.blend"))
if "-" in A.frames: a, b = map(int, A.frames.split("-")); frames = range(a, b + 1)
else: frames = [int(x) for x in A.frames.split(",")]
for f in frames:
    sc.frame_set(f); r.filepath = os.path.join(A.out, f"{f:04d}.png"); t = time.time()
    bpy.ops.render.render(write_still=True); print(f"FRAME {f} {time.time() - t:.1f}s", flush=True)
