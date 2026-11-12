# expression sheet: Mom (young) in 8 emotions, to check the faces read instantly
import bpy, sys, math
sys.path.insert(0, __import__("os").path.dirname(__file__))
from lib import *; from rig import *
out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
MOM = dict(skin="#e9b996", hair="#4a2f25", style="long", top="#c8202c", bottom="#c8202c", dress=True, lip="#a83a3e", lash="#2a1a16", scale=0.5)
names = ["happy", "joy", "shock", "touched", "happycry", "sick", "pain", "cry", "love", "sadsmile", "tired", "resolve"]
for i, nm in enumerate(names):
    c = Char("m%d" % i, MOM); c.place(((i % 4 - 1.5) * 0.85, 0, -(i // 4) * 1.25))
    c.set_pose({}); c.face(track([(0, nm)], 0.4), 0.4)
    text("lab%d" % i, nm, 0.09, mat("lab", "#ffffff", emit=2), None, ((i % 4 - 1.5) * 0.85, -0.4, 1.05 - (i // 4) * 1.25))
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 2, 0), rotation=(math.pi / 2, 0, 0)); bpy.context.object.data.materials.append(mat("bg", "#2a3150", 0.9))
area("key", (-2, -4, 3), (0, 0, 0.5), 3, 900, (1, 0.92, 0.82)); area("fill", (3, -3, 0), (0, 0, 0), 4, 300, (0.8, 0.85, 1))
w = bpy.data.worlds.new("w"); sc.world = w; w.color = (0.02, 0.02, 0.03)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -6, -0.05); aim(cam, (0, 0, -0.05)); cam.data.lens = 50
sc.render.engine = "CYCLES"; sc.cycles.samples = 16; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1200, 1100
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
