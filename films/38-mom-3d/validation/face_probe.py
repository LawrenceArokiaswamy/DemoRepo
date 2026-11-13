# Locate the painted eyes / brows / mouth: sample the base-colour texture at every head-front vertex and cluster the dark/pink ones
import bpy, os, sys, json, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); sys.path.append(os.path.join(H, '..', '..', 'tools', 'character'))
import load_char
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb'))
me = mesh.data; M = mesh.matrix_world
img = [n.image for n in me.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.name == 'Image_0'][0]
W, Hh = img.size; px = np.array(img.pixels[:]).reshape(Hh, W, 4)
uv = me.uv_layers.active.data
vals = {}
for poly in me.polygons:
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        p = M @ me.vertices[vi].co
        if p.z > 1.33 and p.y < -0.06 and abs(p.x) < 0.13:
            u, v = uv[li].uv; c = px[min(Hh - 1, int(v * Hh)), min(W - 1, int(u * W)), :3]
            vals[vi] = (tuple(p), tuple(c))
P = np.array([v[0] for v in vals.values()]); C = np.array([v[1] for v in vals.values()])
lum = C @ [0.3, 0.59, 0.11]
print('head-front verts', len(P), 'z range', P[:, 2].min().round(3), P[:, 2].max().round(3), 'y min', P[:, 1].min().round(3))
skin = np.median(C[lum > np.percentile(lum, 60)], axis=0); print('skin median', skin.round(3))
dark = lum < 0.12
pink = (C[:, 0] - C[:, 1] > 0.18) & (lum < np.percentile(lum, 40))
for name, mask in (('dark', dark), ('pink', pink)):
    Q = P[mask]; print(name, len(Q))
    if len(Q):
        for lo, hi in ((-0.2, 0.0), (0.0, 0.2)):
            S = Q[(Q[:, 0] >= lo) & (Q[:, 0] < hi)]
            if len(S): print('  x in', lo, hi, 'n', len(S), 'centre', S.mean(0).round(3), 'zmin/max', S[:, 2].min().round(3), S[:, 2].max().round(3))
np.save(os.path.join(H, 'face_pts.npy'), np.c_[P, C])
