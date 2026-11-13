# Flat (unlit) orthographic front render of the head, texture colour only, to map the painted features in world x/z
import bpy, os, sys, math
H = os.path.dirname(os.path.abspath(__file__)); sys.path.append(os.path.join(H, '..', '..', 'tools', 'character'))
import load_char
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb'))
m = mesh.data.materials[0]; nt = m.node_tree
img = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image.name == 'Image_0'][0]
out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]; em = nt.nodes.new('ShaderNodeEmission')
import sys as _s
if '--clean' in _s.argv: img.image = bpy.data.images.load(os.path.join(H, '..', 'model', 'face_rig', 'Image_0_faceclean.png'))
nt.links.new(img.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs[0], out.inputs['Surface'])
sc = bpy.context.scene
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 0.4; cam.location = (0, -2, 1.45); cam.rotation_euler = (math.radians(90), 0, 0)
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.use_denoising = False
sc.render.resolution_x = sc.render.resolution_y = 800; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0, 0, 0)
sc.render.filepath = os.path.join(H, 'face_ortho_clean.png' if '--clean' in _s.argv else 'face_ortho.png'); bpy.ops.render.render(write_still=True); print('ok')
