# Multi-angle renders (front, three-quarter, side, back) textured and as grey clay (geometry only, no texture)
import bpy, sys, math, os
from mathutils import Vector
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, 'angles'); os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=os.path.join(H, '..', 'model', 'mom.glb'))
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
if arm.animation_data: arm.animation_data.action = None
sc = bpy.context.scene
fl = bpy.data.meshes.new('fl'); fl.from_pydata([(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [], [(0, 1, 2, 3)])
fo = bpy.data.objects.new('floor', fl); sc.collection.objects.link(fo)
fm = bpy.data.materials.new('fm'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.55, 0.53, 0.5, 1); fl.materials.append(fm)
def light(n, loc, e, s, col=(1, 1, 1)):
    l = bpy.data.lights.new(n, 'AREA'); l.energy = e; l.size = s; l.color = col
    o = bpy.data.objects.new(n, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.9)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
key = light('key', (1.5, -2.0, 2.4), 450, 2.0, (1, 0.94, 0.86)); fill = light('fill', (-2.2, -1.2, 1.5), 140, 3, (0.85, 0.9, 1)); rim = light('rim', (0, 2.4, 2.2), 300, 1.5)
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.3, 0.3, 0.32)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 55
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 720, 1280; sc.view_settings.view_transform = 'AgX'
clay = bpy.data.materials.new('clay'); clay.use_nodes = True; b = clay.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.22, 0.22, 0.22, 1); b.inputs['Roughness'].default_value = 0.45
orig = list(mesh.data.materials)
for mode in ('tex', 'clay'):
    if mode == 'clay': mesh.data.materials.clear(); mesh.data.materials.append(clay)
    for name, ang in [('front', 0), ('three', 40), ('side', 90), ('back', 180)]:
        a = math.radians(ang); d = 4.3
        cam.location = (math.sin(a) * d, -math.cos(a) * d, 1.05)
        cam.rotation_euler = (Vector((0, 0, 0.85)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        for L in (key, fill, rim):                                                   # light rig turns with the camera
            p = Vector(L['p'] if 'p' in L else L.location); L['p'] = list(p)
            R = __import__('mathutils').Matrix.Rotation(a, 3, 'Z'); L.location = R @ p
            L.rotation_euler = (Vector((0, 0, 0.9)) - L.location).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(OUT, f'{mode}_{name}.png'); bpy.ops.render.render(write_still=True)
mesh.data.materials.clear()
for m in orig: mesh.data.materials.append(m)
print('ANGLES DONE')
