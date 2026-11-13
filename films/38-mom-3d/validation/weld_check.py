# Are the 2,953 'parts' real gaps, or just UV-seam splits from glTF export? Weld a copy and recount.
import bpy, bmesh, os, json
H = os.path.dirname(os.path.abspath(__file__))
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=os.path.join(H, '..', 'model', 'mom.glb'))
mesh = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent and o.parent.type == 'ARMATURE'][0]
bm = bmesh.new(); bm.from_mesh(mesh.data)
before = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
seen = set(); parts = []
for v in bm.verts:
    if v.index in seen: continue
    n = 0; st = [v]
    while st:
        x = st.pop()
        if x.index in seen: continue
        seen.add(x.index); n += 1; st.extend(e.other_vert(x) for e in x.link_edges)
    parts.append(n)
parts.sort(reverse=True)
r = {'verts_before_weld': before, 'verts_after_weld': len(bm.verts), 'parts_after_weld': len(parts), 'largest_parts': parts[:8],
     'open_boundary_edges_after_weld': sum(1 for e in bm.edges if e.is_boundary), 'non_manifold_edges_after_weld': sum(1 for e in bm.edges if not e.is_manifold)}
json.dump(r, open(os.path.join(H, 'weld_check.json'), 'w'), indent=1); print(json.dumps(r))
