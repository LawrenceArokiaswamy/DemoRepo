# Facial tests: neutral, smile, sad, worried, crying, blink, look left/right, on the real head (close-ups)
import bpy, os, sys, math
from mathutils import Vector
H = os.path.dirname(os.path.abspath(__file__)); sys.path.append(os.path.join(H, '..', '..', 'tools', 'character'))
import load_char, face_rig
OUT = os.path.join(H, 'face'); os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb'))
face_rig.swap_texture(mesh, os.path.join(H, '..', 'model', 'face_rig', 'Image_0_faceclean.png'))
F = face_rig.Face(arm, mesh)
sc = bpy.context.scene
def light(n, loc, e, s, col=(1, 1, 1)):
    l = bpy.data.lights.new(n, 'AREA'); l.energy = e; l.size = s; l.color = col
    o = bpy.data.objects.new(n, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.45)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light('key', (0.9, -1.5, 2.0), 120, 1.2, (1, 0.94, 0.86)); light('fill', (-1.2, -1.0, 1.6), 50, 2, (0.85, 0.9, 1)); light('rim', (0, 1.0, 2.0), 80, 1)
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.3, 0.3, 0.32)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 85
cam.location = (0.18, -1.05, 1.47); cam.rotation_euler = (Vector((0, 0, 1.44)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.render.resolution_x = sc.render.resolution_y = 560; sc.view_settings.view_transform = 'AgX'
tests = [('1_neutral', F.expression('neutral')), ('2_smile', F.expression('smile')), ('3_sad', F.expression('sad')),
         ('4_worried', F.expression('worried')), ('5_crying', dict(F.expression('crying'), tear=0.45)), ('6_blink', F.expression('blink')),
         ('7_look_left', dict(look=(1, 0))), ('8_look_right', dict(look=(-1, 0)))]
for name, kw in tests:
    F.set(**kw); bpy.context.view_layer.update()
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
print('FACE DONE')
