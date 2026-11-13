# Paint the eyes, the visible brow and the mouth out of a COPY of Mom's colour texture (original GLB untouched).
# Every texel of the face triangles is mapped back to its 3D point (barycentric); texels inside the feature zones
# (measured on the flat orthographic front view, face_ortho.png) are replaced by the surrounding skin tone.
import bpy, os, sys, numpy as np
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); sys.path.append(os.path.join(H, '..', '..', 'tools', 'character'))
import load_char
OUTD = os.path.join(H, '..', 'model', 'face_rig'); os.makedirs(OUTD, exist_ok=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
arm, mesh = load_char.load(os.path.join(H, '..', 'model', 'mom.glb'))
me = mesh.data; Mw = mesh.matrix_world; uvl = me.uv_layers.active.data
tex = np.asarray(Image.open(os.path.join(H, 'tex', 'Image_0.png')).convert('RGB')).astype(np.float32) / 255.0
TH, TW = tex.shape[:2]
px2w = lambda px, py: (( px - 400) * 0.0005, 1.45 - (py - 400) * 0.0005)
# zones: (centre x, centre z, radius x, radius z) in metres, generous margins; brow zone only on the visible (+x) side
Z = []
for (cx, cy, rx, ry) in [(302, 420, 40, 52), (482, 418, 40, 52), (500, 318, 62, 26), (393, 558, 78, 26)]:
    x, z = px2w(cx, cy); Z.append((x, z, rx * 0.0005, ry * 0.0005))
def zone_w(x, z):
    w = np.zeros_like(x)
    for cx, cz, rx, rz in Z:
        d = np.sqrt(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2)
        w = np.maximum(w, np.clip((1.15 - d) / 0.3, 0, 1))          # soft edge from d = 0.85 to 1.15
    return w
mask = np.zeros((TH, TW), np.float32); ring = []
for poly in me.polygons:
    L = list(poly.loop_indices)
    P = np.array([tuple(Mw @ me.vertices[me.loops[i].vertex_index].co) for i in L]); U = np.array([tuple(uvl[i].uv) for i in L])
    if P[:, 1].max() > -0.04 or P[:, 2].min() > 1.56 or P[:, 2].max() < 1.33: continue
    for t in range(1, len(L) - 1):
        tri_p = P[[0, t, t + 1]]; tri_u = U[[0, t, t + 1]] * [TW, TH]; tri_u[:, 1] = TH - tri_u[:, 1]
        x0, y0 = np.floor(tri_u.min(0)).astype(int) - 1; x1, y1 = np.ceil(tri_u.max(0)).astype(int) + 1
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(TW - 1, x1), min(TH - 1, y1)
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx_, cy_) = tri_u; den = (by - cy_) * (ax - cx_) + (cx_ - bx) * (ay - cy_)
        if abs(den) < 1e-9: continue
        l1 = ((by - cy_) * (gx - cx_) + (cx_ - bx) * (gy - cy_)) / den; l2 = ((cy_ - ay) * (gx - cx_) + (ax - cx_) * (gy - cy_)) / den; l3 = 1 - l1 - l2
        inside = (l1 >= -0.02) & (l2 >= -0.02) & (l3 >= -0.02)
        wx = l1 * tri_p[0, 0] + l2 * tri_p[1, 0] + l3 * tri_p[2, 0]; wz = l1 * tri_p[0, 2] + l2 * tri_p[1, 2] + l3 * tri_p[2, 2]
        wv = zone_w(wx, wz) * inside
        sub = mask[y0:y1 + 1, x0:x1 + 1]; np.maximum(sub, wv, out=sub)
        # skin samples: texels just outside the zones on the face (cheek/forehead)
        near = inside & (wv == 0) & (zone_w(wx * 0.7, wz) == 0) & (np.abs(wx) < 0.09) & (wz > 1.36) & (wz < 1.5)
        if near.any(): ring.append(tex[y0:y1 + 1, x0:x1 + 1][near])
skin = np.median(np.concatenate(ring), axis=0) if ring else np.array([0.99, 0.82, 0.70])
# widen the mask across texture seams (texels just outside the triangles still bleed in at render time)
m = mask.copy()
for _ in range(6):
    m2 = m.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): m2 = np.maximum(m2, np.roll(np.roll(m, dy, 0), dx, 1) * 0.92)
    m = m2
mask = m
# soft, low-frequency skin: blur the original skin around each hole instead of one flat colour (keeps cheek gradients)
def box(a, r):
    c = np.cumsum(np.cumsum(np.pad(a, ((r + 1, r), (r + 1, r))), 0), 1)
    return (c[2 * r + 1:, 2 * r + 1:] - c[:-2 * r - 1, 2 * r + 1:] - c[2 * r + 1:, :-2 * r - 1] + c[:-2 * r - 1, :-2 * r - 1])
keep = (1 - np.clip(mask * 3, 0, 1)); num = np.stack([box(tex[..., k] * keep, 24) for k in range(3)], -1); den = box(keep, 24)[..., None]
local = np.where(den > 50, num / np.maximum(den, 1e-6), skin)
skinmap = skin                       # flat skin: neighbouring texels in the atlas belong to other body parts, so local blurs smear
out = tex * (1 - mask[..., None]) + skinmap * mask[..., None]
Image.fromarray((out * 255).clip(0, 255).astype(np.uint8)).save(os.path.join(OUTD, 'Image_0_faceclean.png'))
Image.fromarray((mask * 255).astype(np.uint8)).save(os.path.join(OUTD, 'faceclean_mask.png'))
print('skin', skin.round(3), 'masked texels', int((mask > 0.5).sum()))
