# Scene inventory of the validation animation: every object, light and camera, and whether it is real geometry
import sys, os, json
argv_backup = sys.argv
sys.argv = ['anim10.py', '--', '/tmp/none', '--frames', '']
H = os.path.dirname(os.path.abspath(__file__)); src = open(os.path.join(H, '..', 'anim10.py')).read().split('frames = list(range(N))')[0]
g = {'__file__': os.path.join(H, '..', 'anim10.py'), '__name__': 'inv'}; exec(compile(src, g['__file__'], 'exec'), g)
import bpy
inv = {'meshes': [], 'lights': [], 'cameras': [], 'empties': 0, 'armatures': []}
for o in bpy.data.objects:
    if o.type == 'MESH':
        mats = [m.name for m in o.data.materials if m]
        imgs = sorted({n.image.name for m in o.data.materials if m and m.node_tree for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image})
        inv['meshes'].append({'name': o.name, 'verts': len(o.data.vertices), 'faces': len(o.data.polygons), 'materials': mats, 'image_textures': imgs,
                              'parent': (o.parent.name + (':' + o.parent_bone if o.parent_bone else '')) if o.parent else None})
    elif o.type == 'LIGHT': inv['lights'].append({'name': o.name, 'type': o.data.type, 'watts': round(o.data.energy, 1)})
    elif o.type == 'CAMERA': inv['cameras'].append({'name': o.name, 'lens_mm': round(o.data.lens, 1), 'dof': o.data.dof.use_dof})
    elif o.type == 'ARMATURE': inv['armatures'].append({'name': o.name, 'bones': len(o.data.bones)})
    elif o.type == 'EMPTY': inv['empties'] += 1
inv['emissive_materials'] = [m.name for m in bpy.data.materials if m.node_tree and m.node_tree.nodes.get('Principled BSDF') and m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value > 0]
inv['flat_image_planes'] = [m['name'] for m in inv['meshes'] if m['faces'] == 1 and m['image_textures']]
json.dump(inv, open(os.path.join(H, 'scene_inventory.json'), 'w'), indent=1)
print('meshes', len(inv['meshes']), 'lights', len(inv['lights']), 'cameras', len(inv['cameras']), 'armatures', inv['armatures'], 'empties', inv['empties'])
print('image planes', inv['flat_image_planes']); print('lights', inv['lights'])
print('face-rig parts', [m['name'] for m in inv['meshes'] if m['parent'] and ':Head' in m['parent']])
