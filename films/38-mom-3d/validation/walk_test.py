# Walk test: CMU 82_08 (casual walk) retargeted onto Mom; side-on tracking camera; also writes an mp4-ready frame sequence
import bpy, sys, math, os
from mathutils import Vector, Matrix
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(H, '..', '..', 'tools')
sys.path += [os.path.join(T, 'character'), os.path.join(T, 'retarget')]
import load_char, retarget as RT
OUT = os.path.join(H, 'walk'); os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb'))
fl = bpy.data.meshes.new('fl'); fl.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)])
fo = bpy.data.objects.new('floor', fl); sc.collection.objects.link(fo)
fm = bpy.data.materials.new('fm'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.5, 0.48, 0.45, 1); fl.materials.append(fm)
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.5; so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(30))
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.35, 0.36, 0.4)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 35
sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 540, 960; sc.view_settings.view_transform = 'AgX'
src = RT.load_bvh('/root/mocap/cmu/82_08__stand-still-casual-walk-forward__120fps.bvh')
# where does the actor go? sample the root path to centre the walk at the origin and face the camera side-on
pts = []
for f in range(1, int(src.animation_data.action.frame_range[1]), 40):
    sc.frame_set(f); bpy.context.view_layer.update(); pts.append((f, (src.matrix_world @ src.pose.bones['root'].head).copy()))
print('root path', [(f, tuple(round(c, 2) for c in p)) for f, p in pts[::3]])
start = pts[0][1]
frames = list(range(int(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else 300, 0, 1))
F0 = 1150; FN = 75                                   # 60 output frames at 30 fps = 2 s, sampled every 4 mocap frames (120 fps)
for i in range(FN):
    RT.apply(src, F0 + i * 4, arm, root_offset=Vector((-start.x * 0.884, -start.y * 0.884, 0)))
    hp = arm.matrix_world @ arm.pose.bones['Hips'].head
    cam.location = (hp.x + 3.2, hp.y - 0.6, 1.0); cam.rotation_euler = (Vector((hp.x, hp.y, 0.8)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, f'{i + 1:04d}.png'); bpy.ops.render.render(write_still=True)
print('WALK DONE')
