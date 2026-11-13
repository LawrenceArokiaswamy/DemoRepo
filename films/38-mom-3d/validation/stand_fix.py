# Body tests on the real rig: standing, head turn left/right, sitting, reaching, and a retargeted mocap walk
import bpy, sys, math, os
from mathutils import Vector, Matrix
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(H, '..', '..', 'tools')
sys.path += [os.path.join(T, 'character'), os.path.join(T, 'retarget')]
import load_char, retarget as RT
OUT = os.path.join(H, 'body'); os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb')); PB = arm.pose.bones
fl = bpy.data.meshes.new('fl'); fl.from_pydata([(-8, -8, 0), (8, -8, 0), (8, 8, 0), (-8, 8, 0)], [], [(0, 1, 2, 3)])
fo = bpy.data.objects.new('floor', fl); sc.collection.objects.link(fo)
fm = bpy.data.materials.new('fm'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.5, 0.48, 0.45, 1); fl.materials.append(fm)
wl = bpy.data.meshes.new('wl'); wl.from_pydata([(-3, 0.35, 0), (3, 0.35, 0), (3, 0.35, 3), (-3, 0.35, 3)], [], [(0, 1, 2, 3)])
wo = bpy.data.objects.new('wall', wl); sc.collection.objects.link(wo); wl.materials.append(fm)
def light(n, loc, e, s, col=(1, 1, 1)):
    l = bpy.data.lights.new(n, 'AREA'); l.energy = e; l.size = s; l.color = col
    o = bpy.data.objects.new(n, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.8)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light('key', (1.6, -2.2, 2.5), 450, 2.0, (1, 0.94, 0.86)); light('fill', (-2.2, -1.4, 1.5), 140, 3, (0.85, 0.9, 1)); light('rim', (-0.5, 1.2, 2.4), 200, 1.5)
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.3, 0.3, 0.32)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 720, 1280; sc.view_settings.view_transform = 'AgX'
def shot(name, loc, look, lens=45):
    cam.location = loc; cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
def reset():
    arm.location = (0, 0, 0)
    for pb in PB: pb.matrix_basis = Matrix.Identity(4)
    for pb in PB:
        for c in list(pb.constraints): pb.constraints.remove(c)
    bpy.context.view_layer.update()
def rotw(name, axis, ang):
    bpy.context.view_layer.update(); pb = PB[name]; M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(ang, 4, axis) @ Matrix.Translation(-h) @ M
D = math.radians
# 1 standing (arms relaxed down)
reset()
for side, sx in (("Left", 1), ("Right", -1)): rotw(side + "Arm", Vector((0, 1, 0)), D(sx * 26)); rotw(side + "Arm", Vector((1, 0, 0)), D(-6)); rotw(side + "ForeArm", Vector((1, 0, 0)), D(-10))
shot('01_stand_fixed', (0.9, -3.2, 1.0), (0, 0, 0.85))
