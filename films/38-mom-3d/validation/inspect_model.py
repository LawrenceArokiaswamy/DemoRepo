# Mom model inspection: geometry, materials/textures, rig and skin weights -> validation/inspect.json
import bpy, bmesh, sys, json, os, collections
H = os.path.dirname(os.path.abspath(__file__))
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=os.path.join(H, '..', 'model', 'mom.glb'))
R = {'objects': []}
for o in bpy.data.objects:
    R['objects'].append({'name': o.name, 'type': o.type, 'parent': o.parent.name if o.parent else None, 'dims_m': [round(v, 3) for v in o.dimensions]})
mesh = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent and o.parent.type == 'ARMATURE'][0]
arm = mesh.parent; me = mesh.data
bm = bmesh.new(); bm.from_mesh(me)
islands = 0; seen = set()
for v in bm.verts:
    if v.index in seen: continue
    islands += 1; stack = [v]
    while stack:
        x = stack.pop()
        if x.index in seen: continue
        seen.add(x.index); stack.extend(e.other_vert(x) for e in x.link_edges)
nonman = sum(1 for e in bm.edges if not e.is_manifold); boundary = sum(1 for e in bm.edges if e.is_boundary)
tris = sum(len(f.verts) - 2 for f in bm.faces)
xs = [v.co for v in bm.verts]
R['mesh'] = {'name': mesh.name, 'verts': len(bm.verts), 'faces': len(bm.faces), 'triangles': tris, 'separate_parts': islands,
             'non_manifold_edges': nonman, 'open_boundary_edges': boundary,
             'world_size_m (w,d,h)': [round(v, 3) for v in mesh.dimensions], 'uv_maps': [u.name for u in me.uv_layers],
             'shape_keys': [k.name for k in me.shape_keys.key_blocks] if me.shape_keys else [], 'materials': [m.name for m in me.materials]}
bm.free()
imgs = []
for m in me.materials:
    for n in m.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            links = [l.to_socket.name for l in m.node_tree.links if l.from_node == n]
            imgs.append({'node': n.name, 'image': n.image.name, 'size': list(n.image.size), 'feeds': links})
R['textures'] = imgs
# rig + weights
vg = {g.index: g.name for g in mesh.vertex_groups}
per_bone = collections.Counter(); unweighted = 0; maxinf = 0; inf_hist = collections.Counter(); bad_sum = 0
for v in me.vertices:
    ws = [(vg[g.group], g.weight) for g in v.groups if g.weight > 1e-4]
    if not ws: unweighted += 1
    s = sum(w for _, w in ws)
    if ws and abs(s - 1) > 0.05: bad_sum += 1
    maxinf = max(maxinf, len(ws)); inf_hist[len(ws)] += 1
    for b, w in ws: per_bone[b] += 1
R['rig'] = {'armature': arm.name, 'bones': len(arm.data.bones), 'bone_names': [b.name for b in arm.data.bones],
            'hierarchy': {b.name: (b.parent.name if b.parent else None) for b in arm.data.bones},
            'armature_modifier': [m.type for m in mesh.modifiers], 'vertex_groups': len(mesh.vertex_groups),
            'unweighted_vertices': unweighted, 'weight_sum_not_1': bad_sum, 'max_influences_per_vertex': maxinf,
            'influence_histogram': dict(sorted(inf_hist.items())),
            'vertices_per_bone': dict(per_bone.most_common()), 'bones_without_weights': [b.name for b in arm.data.bones if per_bone[b.name] == 0],
            'finger_bones': [b.name for b in arm.data.bones if any(k in b.name.lower() for k in ('thumb', 'index', 'middle', 'ring', 'pinky', 'finger'))],
            'face_bones': [b.name for b in arm.data.bones if any(k in b.name.lower() for k in ('jaw', 'eye', 'lid', 'brow', 'lip', 'mouth'))],
            'actions_in_file': [a.name for a in bpy.data.actions]}
json.dump(R, open(os.path.join(H, 'inspect.json'), 'w'), indent=1)
print(json.dumps({k: R[k] for k in ('mesh', 'textures')}, indent=1)); print(json.dumps({k: v for k, v in R['rig'].items() if k not in ('hierarchy', 'bone_names')}, indent=1))
