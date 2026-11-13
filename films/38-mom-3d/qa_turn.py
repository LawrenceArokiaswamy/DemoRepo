# QA renders of a converted character: front, three-quarter, side, in soft studio light
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; glb, out = argv[0], argv[1]
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=glb)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
sc = bpy.context.scene
if arm.animation_data: arm.animation_data.action = None
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
fl = bpy.data.meshes.new('fl'); fl.from_pydata([(-5, -5, 0), (5, -5, 0), (5, 5, 0), (-5, 5, 0)], [], [(0, 1, 2, 3)])
fo = bpy.data.objects.new('floor', fl); sc.collection.objects.link(fo)
m = bpy.data.materials.new('fm'); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.6, 0.58, 0.56, 1); fl.materials.append(m)
def light(n, loc, e, s, col=(1, 1, 1)):
    l = bpy.data.lights.new(n, 'AREA'); l.energy = e; l.size = s; l.color = col
    o = bpy.data.objects.new(n, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.9)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light('key', (1.5, -2.0, 2.4), 400, 2.0, (1, 0.93, 0.85)); light('fill', (-2.2, -1.2, 1.5), 120, 3, (0.85, 0.9, 1)); light('rim', (0, 2.2, 2.2), 250, 1.5)
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.25, 0.25, 0.27)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 50
sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 600, 1000
sc.view_settings.view_transform = 'AgX'
for name, ang in [('front', 0), ('three', 35), ('side', 90)]:
    a = math.radians(ang); d = 4.2
    cam.location = (math.sin(a) * d, -math.cos(a) * d, 1.0)
    cam.rotation_euler = (Vector((0, 0, 0.85)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(out, f'qa_{name}.png'); bpy.ops.render.render(write_still=True)
# close-up of the face
cam.data.lens = 85; cam.location = (0.35, -1.6, 1.5); cam.rotation_euler = (Vector((0, 0, 1.45)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.filepath = os.path.join(out, 'qa_face.png'); bpy.ops.render.render(write_still=True)
print('QA DONE')
