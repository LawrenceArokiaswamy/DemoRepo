import bpy, os
H = os.path.dirname(os.path.abspath(__file__)); os.makedirs(os.path.join(H, 'tex'), exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=os.path.join(H, '..', 'model', 'mom.glb'))
for im in bpy.data.images:
    if im.size[0] > 0:
        im.filepath_raw = os.path.join(H, 'tex', im.name + '.png'); im.file_format = 'PNG'; im.save(); print('saved', im.name, tuple(im.size))
