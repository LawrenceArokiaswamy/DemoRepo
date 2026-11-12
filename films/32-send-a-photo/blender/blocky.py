# Blocky 3D look test: the film-33 Dad as a toy-block character (bevelled boxes, inset eyes, soft key light, shallow DOF).
import bpy, math, sys
from mathutils import Vector
out = sys.argv[sys.argv.index("--")+1] if "--" in sys.argv else "/tmp/blocky.png"
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def mat(name, col, rough=0.55, emit=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = (*col, 1); b.inputs["Emission Strength"].default_value = emit
    return m
def hexc(h): h = h.lstrip("#"); return tuple((int(h[i:i+2], 16)/255)**2.2 for i in (0, 2, 4))
def box(name, loc, size, m, bev=0.02, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = (size[0]/2, size[1]/2, size[2]/2); bpy.ops.object.transform_apply(scale=True)
    if bev: md = o.modifiers.new("b", "BEVEL"); md.width = bev; md.segments = 4
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
skin, hair, white, black = mat("skin", hexc("#e8b48f"), .5), mat("hair", hexc("#3b2a22"), .7), mat("w", hexc("#f4f1ea"), .3), mat("k", hexc("#141418"), .25)
shirt, shirt2, glass = mat("shirt", hexc("#b8322c"), .8), mat("shirt2", hexc("#7a1e1b"), .8), mat("gl", hexc("#1a1a1a"), .3)
lip, grey = mat("lip", hexc("#5a2e28"), .6), mat("grey", hexc("#9a948c"), .7)
# head
box("head", (0, 0, 1.0), (1.0, 0.9, 0.95), skin, .09)
for x in (-.53, .53): box("ear", (x, 0.02, 0.98), (.08, .2, .24), skin, .03)
# hair: chunky blocks, greying at the sides (he's older now)
for i, x in enumerate((-.38, -.13, .13, .38)):
    box("h", (x, .02, 1.5 + .03*(i % 2)), (.28, .95, .18), hair, .05, (0, 0, .05*(i-1.5)))
for x in (-.48, .48): box("side", (x, .05, 1.28), (.1, .8, .32), grey, .03)
box("hb", (0, .46, 1.25), (1.02, .1, .5), hair, .04)
# eyes: white inset, black pupil, square catch-light — looking slightly down/right, tired
for x in (-.22, .22):
    box("ew", (x, -.452, 1.04), (.24, .02, .17), white, .01)
    box("ep", (x + .03, -.462, 1.025), (.12, .02, .13), black, .008)
    box("eh", (x + .05, -.47, 1.065), (.035, .02, .035), white, .003)
    box("lid", (x, -.462, 1.13), (.26, .03, .05), skin, .01)
# brows: worried tilt
box("bl", (-.22, -.47, 1.22), (.26, .04, .06), hair, .012, (0, -.18, 0))
box("br", (.22, -.47, 1.22), (.26, .04, .06), hair, .012, (0, .18, 0))
# glasses (thin frames)
for x in (-.22, .22):
    for dz, w, h in ((.11, .32, .025), (-.1, .32, .025)): box("gf", (x, -.49, 1.035 + dz), (w, .02, h), glass, .004)
    for dx in (-.15, .15): box("gs", (x + dx, -.49, 1.035), (.025, .02, .235), glass, .004)
box("bridge", (0, -.49, 1.06), (.12, .02, .025), glass, .004)
box("nose", (0, -.49, .92), (.1, .08, .14), skin, .02)
box("mous", (0, -.47, .8), (.3, .04, .06), grey, .015)
box("mouth", (0, -.455, .71), (.2, .02, .03), lip, .006, (0, .06, 0))
# body: flannel shirt (two-tone checks), collar, buttons
box("neck", (0, 0, .48), (.3, .3, .14), skin, .02)
box("torso", (0, 0, -.05), (1.05, .62, .95), shirt, .07)
for i in range(5):
    box("stripe", (-.42 + i*.21, -.311, -.05), (.07, .004, .9), shirt2, 0)
for j in range(4):
    box("band", (0, -.312, .3 - j*.22), (1.0, .004, .06), shirt2, 0)
for x, r in ((-.17, .5), (.17, -.5)): box("col", (x, -.3, .4), (.3, .08, .1), shirt, .02, (0, r, 0))
for z in (.25, .05, -.15): box("btn", (0, -.33, z), (.06, .02, .06), white, .01)
for x in (-.64, .64): box("arm", (x, 0, -.08), (.26, .3, .85), shirt, .06)
# backdrop + bokeh
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 6, 2), rotation=(math.pi/2, 0, 0)); bpy.context.object.data.materials.append(mat("bg", hexc("#151b3a"), .9))
for i, (x, z, s) in enumerate(((-2.2, 2.6, .12), (-3.4, 1.4, .09), (-1.2, .3, .1), (-3.0, 3.3, .07), (-0.6, 3.4, .06), (-4.2, 2.4, .08))):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=s, location=(x, 5, z)); bpy.context.object.data.materials.append(mat(f"bk{i}", hexc("#ffd88a"), .5, 18))
# lights: warm key, cool rim, soft fill
def light(kind, loc, energy, col, size, rot):
    bpy.ops.object.light_add(type=kind, location=loc, rotation=rot); l = bpy.context.object.data; l.energy = energy; l.color = col
    if kind == "AREA": l.size = size
light("AREA", (-2.2, -2.6, 2.4), 420, (1, .88, .74), 2.0, (math.radians(60), 0, math.radians(-40)))
light("AREA", (2.4, 1.6, 2.2), 380, (.55, .65, 1), 1.2, (math.radians(-60), 0, math.radians(130)))
light("AREA", (1.8, -3, .6), 90, (.8, .85, 1), 3, (math.radians(85), 0, math.radians(30)))
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (.01, .012, .03, 1)
# camera: close, slightly low, shallow DOF
bpy.ops.object.camera_add(location=(0.95, -3.4, 1.2)); cam = bpy.context.object; sc.camera = cam
d = Vector((-0.12, 0, .78)) - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 44; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 3.25; cam.data.dof.aperture_fstop = 2.2
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, 50
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
