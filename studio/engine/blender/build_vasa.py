"""Build a stylised VASA (1628) warship in headless Blender and export GLB for our three.js renderer (Episode 2).
usage:  <bpy-python> build_vasa.py -- <out.glb>
Original stylised reconstruction after the real ship's proportions (≈47 m hull, ≈11.7 m beam, two gun decks with 2 x 12 ports
per side, tall gilded stern, three masts). Not a replica of any existing model. Blender: X = length (bow +X), Y = port (+Y),
Z = up, keel at z = 0, design waterline z = 4.8. glTF export -> three.js: x = length, y = up, z = starboard.
Named parts used by the renderer: Hull (wood / bottom / redpaint), Deck*, PortLid.*, Cannon.*, Sail.*, SternPanel (painted carvings
canvas), Flag*, Pennant*. The lower gunports are real openings so the gun-deck interior shot can see water pour in."""
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
C = bpy.context
PAL = {'wood': '#8a5d35', 'bottom': '#4a3526', 'redpaint': '#a8322a', 'gold': '#d9a93a', 'bronze': '#9c7440', 'sail': '#efe4c9', 'tar': '#2f241c', 'deck': '#a37a4f',
       'black': '#1e1a18', 'rope': '#6b5537', 'flagblue': '#1f5aa8', 'flagyellow': '#f0c330', 'lidred': '#b8342b', 'stern': '#ffffff', 'dark': '#120d0a'}
def hexc(h): h = h.lstrip('#'); return tuple(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)) + (1,)
MAT = {}
for k, v in PAL.items():
    m = bpy.data.materials.new(k); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = hexc(v); b.inputs['Roughness'].default_value = 0.85; MAT[k] = m
def obj(name, bm, mats, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); C.collection.objects.link(o)
    for m in (mats if isinstance(mats, list) else [mats]): me.materials.append(MAT[m])
    for p in me.polygons: p.use_smooth = smooth
    return o
def box(name, size, loc, mat, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = obj(name, bm, mat); o.location = loc; o.rotation_euler = rot; return o
def cyl(name, p0, p1, r0, r1, mat, seg=12):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=d.length)
    o = obj(name, bm, mat, True); o.location = (p0 + p1) / 2; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized()); return o

# ---------------- hull ----------------
L, B, WL = 47.0, 11.7, 4.8
def rail(u):    # sheer: high stern castle, raised forecastle
    return 11.4 + 4.3 * max(0.0, (0.2 - u) / 0.2) ** 1.1 + 1.1 * max(0.0, (u - 0.8) / 0.2) ** 1.5
def zmin(u):    # keel line rises into the forefoot at the bow
    return 3.4 * max(0.0, (u - 0.86) / 0.14) ** 1.8 + 0.4 * max(0.0, (0.04 - u) / 0.04)
def hw(z, u):   # half-width at height z, station u (0 = stern, 1 = bow)
    zz = max(0.0, z)
    prof = math.sin(min(1.0, zz / 5.6) * math.pi / 2) ** 0.55 if zz < 5.6 else 1 - 0.19 * ((zz - 5.6) / 7.0) ** 1.3
    prof = max(0.05, prof)
    k = max(0.0, (u - 0.62) / 0.38); bow = 1 - (k ** (1.25 if zz < WL else 1.7)) * 0.96
    ks = max(0.0, (0.22 - u) / 0.22); stern = 1 - ks ** 1.4 * (0.75 * max(0.0, 1 - zz / 6.5) + 0.18)
    return B / 2 * prof * bow * stern
NU, NV = 64, 28
bm = bmesh.new(); rings = []
for i in range(NU + 1):
    u = i / NU; x = -L / 2 + u * L; z0, z1 = zmin(u), rail(u); ring = []
    for j in range(2 * NV + 1):
        s = abs(j - NV) / NV; side = 1 if j < NV else -1; z = z0 + (z1 - z0) * (1 - (1 - s) ** 1.0) if False else z1 - (z1 - z0) * (s ** 0.8)
        y = side * hw(z, u) if j != NV else 0.0; ring.append(bm.verts.new((x, y, z)))
    rings.append(ring)
for i in range(NU):
    for j in range(2 * NV): bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]))
bm.faces.new(list(reversed(rings[0])))   # flat transom
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.02); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
for f in bm.faces:
    zc = f.calc_center_median().z; f.material_index = 0 if zc < WL else (1 if zc < 9.3 else 2)
hull = obj('Hull', bm, ['bottom', 'wood', 'redpaint'])
hull.modifiers.new('solid', 'SOLIDIFY').thickness = 0.28
C.view_layer.objects.active = hull; bpy.ops.object.modifier_apply(modifier='solid')

# gunports: two rows x 12 per side; the openings are cut through the hull (boolean), lids hinge up and out
PORTS = []
for row, (zc, sz) in enumerate(((6.15, 0.74), (8.45, 0.7))):
    for side in (1, -1):
        for k in range(12):
            u = 0.24 + k * (0.58 / 11); x = -L / 2 + u * L; y = side * hw(zc, u); PORTS.append((row, side, k, x, y, zc, sz))
cut = bmesh.new()
for (row, side, k, x, y, zc, sz) in PORTS:
    bmesh.ops.create_cube(cut, size=1, matrix=Matrix.Translation((x, y, zc)) @ Matrix.Diagonal((sz, 1.6, sz, 1)))
cutter = obj('Cutter', cut, 'dark')
bo = hull.modifiers.new('ports', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cutter; bo.solver = 'EXACT'
C.view_layer.objects.active = hull; bpy.ops.object.modifier_apply(modifier='ports'); bpy.data.objects.remove(cutter)
# the exact boolean closes the open top of the hull shell: remove those cap faces (horizontal faces inside the rails)
bm = bmesh.new(); bm.from_mesh(hull.data); bm.normal_update(); kill = []
for f in bm.faces:
    c = f.calc_center_median(); u = (c.x + L / 2) / L
    if abs(f.normal.z) > 0.9 and c.z > 9.0 and abs(c.y) < hw(c.z, min(max(u, 0.0), 1.0)) - 0.45: kill.append(f)
bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(hull.data); bm.free(); print('removed cap faces', len(kill))
for (row, side, k, x, y, zc, sz) in PORTS:
    sd = 'p' if side > 0 else 's'   # exported CLOSED (flat on the hull); the renderer hinges them open at the top edge
    box(f'PortLid_{row}_{sd}_{k}', (sz * 1.08, 0.07, sz * 1.08), (x, y + side * 0.07, zc), 'lidred')
    gun = cyl(f'Cannon_{row}_{sd}_{k}', (x, y - side * 2.4, zc - 0.05), (x, y + side * 0.55, zc - 0.02), 0.22 if row == 0 else 0.18, 0.15 if row == 0 else 0.12, 'bronze', 10)
    box(f'Carriage_{row}_{sd}_{k}', (0.9, 1.3, 0.45), (x, y - side * 1.75, zc - 0.62), 'wood')

# decks (interior floors) + bulwark caps + wales + gilded trim
for name, z, u0, u1 in (('DeckLower', 5.25, 0.12, 0.9), ('DeckUpperGun', 7.55, 0.1, 0.92), ('DeckWeather', 10.45, 0.04, 0.96)):
    bm = bmesh.new(); N = 40; top = []; bot = []
    for i in range(N + 1):
        u = u0 + (u1 - u0) * i / N; x = -L / 2 + u * L; w = hw(z, u) - 0.16; top.append(bm.verts.new((x, w, z))); bot.append(bm.verts.new((x, -w, z)))
    for i in range(N): bm.faces.new((top[i], top[i + 1], bot[i + 1], bot[i]))
    o = obj(name, bm, 'deck'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.18
bm = bmesh.new(); N = 30; a = []; b = []
for i in range(N + 1):
    u = i / N * 0.2; x = -L / 2 + u * L + 0.2; z = 14.6; w = hw(z, max(u, 0.01)) - 0.15; a.append(bm.verts.new((x, w, z))); b.append(bm.verts.new((x, -w, z)))
for i in range(N): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
o = obj('DeckQuarter', bm, 'deck'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.2
def wale(name, z, mat, r, u0=0.02, u1=0.97):
    for side in (1, -1):
        pts = [Vector((-L / 2 + u * L, side * (hw(z, u) + r * 0.6), z)) for u in [u0 + (u1 - u0) * i / 40 for i in range(41)]]
        bm = bmesh.new(); prev = None
        for i, p in enumerate(pts):
            ring = [bm.verts.new(p + Vector((0, math.cos(t) * r * side, math.sin(t) * r))) for t in [k / 8 * 2 * math.pi for k in range(8)]]
            if prev:
                for k in range(8): bm.faces.new((prev[k], prev[(k + 1) % 8], ring[(k + 1) % 8], ring[k]))
            prev = ring
        obj(f'{name}.{side}', bm, mat, True)
wale('Wale', 5.05, 'tar', 0.16); wale('Wale', 7.25, 'tar', 0.14, 0.05, 0.95); wale('Trim', 9.35, 'gold', 0.08, 0.04, 0.96); wale('Trim', 11.25, 'gold', 0.07, 0.2, 0.8)

# stern: painted carvings panel (texture drawn by the renderer), lanterns, ensign staff
zt0, zt1 = 6.2, 17.2; wt = hw(10.5, 0.0) * 2
bm = bmesh.new(); vv = [bm.verts.new(p) for p in ((-L / 2 - 0.12, wt / 2, zt0), (-L / 2 - 0.12, -wt / 2, zt0), (-L / 2 - 0.12, -wt / 2 * 0.82, zt1), (-L / 2 - 0.12, wt / 2 * 0.82, zt1))]
f = bm.faces.new(vv); uvl = bm.loops.layers.uv.new('UVMap')
for l, uvv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uvl].uv = uvv
obj('SternPanel', bm, 'stern')
for dy in (-2.2, 0, 2.2): cyl('Lantern', (-L / 2 + 0.6, dy, 17.2), (-L / 2 + 0.6, dy, 18.4), 0.32, 0.18, 'gold', 10)
cyl('EnsignStaff', (-L / 2 - 0.6, 0, 16.0), (-L / 2 - 2.2, 0, 23.0), 0.1, 0.07, 'wood')
bm = bmesh.new(); NXf, NYf = 10, 6; grid = []
for j in range(NYf + 1):
    grid.append([bm.verts.new((-L / 2 - 2.0 - i * 0.9, 0.18 * math.sin(i * 0.9), 22.6 - j * 0.85)) for i in range(NXf + 1)])
for j in range(NYf):
    for i in range(NXf):
        fx = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])); cross = (i in (3, 4)) or (j == 3)
        fx.material_index = 1 if cross else 0
obj('Flag', bm, ['flagblue', 'flagyellow'])
# bow: beakhead + gilded lion figurehead + bowsprit
bx = L / 2
cyl('Beak', (bx - 1.5, 0, 9.0), (bx + 6.0, 0, 10.6), 0.9, 0.35, 'redpaint', 12)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=1)
for v in bm.verts: v.co = Vector((v.co.x * 1.4, v.co.y * 0.7, v.co.z * 1.0)) + Vector((bx + 6.2, 0, 11.4))
obj('Lion', bm, 'gold', True)
cyl('Bowsprit', (bx - 3, 0, 11.8), (bx + 14, 0, 18.5), 0.45, 0.25, 'wood')

# masts, tops, yards, sails (four set: fore course, fore + main topsails, mizzen lateen), shrouds, pennants
MASTS = {'fore': (0.79, 34.0), 'main': (0.53, 41.0), 'mizzen': (0.22, 25.0)}
for name, (u, Hm) in MASTS.items():
    x = -L / 2 + u * L; z0 = 4.0; zd = rail(u) - 1
    cyl(f'Mast.{name}', (x, 0, z0), (x, 0, zd + Hm), 0.55 if name != 'mizzen' else 0.4, 0.22, 'wood', 14)
    cyl(f'Top.{name}', (x, 0, zd + Hm * 0.56), (x, 0, zd + Hm * 0.56 + 0.5), 2.2, 2.0, 'wood', 16)
    for side in (1, -1):
        for k in range(6):
            xr = x - 2.4 + k * 0.95; yr = side * (hw(rail(u), u) + 0.15)
            cyl(f'Shroud.{name}', (xr, yr, rail(u)), (x, side * 1.6, zd + Hm * 0.56), 0.035, 0.035, 'rope', 4)
    cyl(f'Stay.{name}', (x, 0, zd + Hm * 0.56), (x + (14 if name != 'fore' else 18), 0, (zd + 2) if name != 'fore' else 18.0), 0.05, 0.05, 'rope', 4)
    bm = bmesh.new(); NX, NY = 10, 8
    def sail(sname, zt, zb, wt_, wb, belly):
        bm = bmesh.new(); g = []
        for j in range(NY + 1):
            v = j / NY; z = zt + (zb - zt) * v; w = wt_ + (wb - wt_) * v
            g.append([bm.verts.new((x + 0.35 + belly * math.sin(v * math.pi) * (1 - (2 * i / NX - 1) ** 2) * (0.6 + 0.4 * v), (i / NX - 0.5) * w, z)) for i in range(NX + 1)])
        for j in range(NY):
            for i in range(NX): bm.faces.new((g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]))
        o = obj(sname, bm, 'sail', True); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.05
    if name in ('fore', 'main'):
        yC, yT = zd + Hm * 0.48, zd + Hm * 0.82; W1, W2 = (19 if name == 'main' else 16), (13 if name == 'main' else 11)
        cyl(f'Yard.{name}', (x + 0.4, -W1 / 2 - 1, yC), (x + 0.4, W1 / 2 + 1, yC), 0.28, 0.28, 'wood', 8)
        cyl(f'YardT.{name}', (x + 0.4, -W2 / 2 - 0.8, yT), (x + 0.4, W2 / 2 + 0.8, yT), 0.2, 0.2, 'wood', 8)
        sail(f'Sail.{name}.top', yT, zd + Hm * 0.58, W2, W1 * 0.92, 2.4)
        if name == 'fore': sail(f'Sail.{name}.course', yC, rail(u) + 3.5, W1, W1 * 1.05, 2.8)
    else:   # mizzen lateen
        cyl('Yard.mizzen', (x - 7, 0, zd + 6), (x + 7, 0, zd + 19), 0.2, 0.15, 'wood', 8)
        bm = bmesh.new(); vv = [bm.verts.new(p) for p in ((x - 6.5, 0.3, zd + 6.3), (x + 6.6, 0.3, zd + 18.6), (x + 0.4, 0.9, zd + 3.0))]; bm.faces.new(vv)
        o = obj('Sail.mizzen', bm, 'sail'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.05
    bm = bmesh.new(); pts = [bm.verts.new((x - i * 1.1, 0.25 * math.sin(i), zd + Hm + 0.3 - (0.5 - i * 0.04) * (1 if s else -1))) for i in range(9) for s in (0, 1)]
    for i in range(8): bm.faces.new((pts[2 * i], pts[2 * i + 2], pts[2 * i + 3], pts[2 * i + 1]))
    obj(f'Pennant.{name}', bm, 'redpaint')

# weather-deck furniture for scale: capstan, hatches, bitts, belfry
xm = -L / 2 + 0.42 * L
cyl('Capstan', (xm, 0, 10.5), (xm, 0, 11.6), 0.55, 0.45, 'wood', 12)
for (u, w, d) in ((0.36, 2.6, 2.2), (0.62, 3.0, 2.4), (0.7, 1.8, 1.8)): box('Hatch', (w, d, 0.35), (-L / 2 + u * L, 0, 10.62), 'tar')
for u in (0.47, 0.6): box('Bitts', (0.5, 2.8, 1.0), (-L / 2 + u * L, 0, 11.0), 'wood')

# apply modifiers, export
for o in list(C.collection.objects):
    if o.type == 'MESH' and o.modifiers:
        C.view_layer.objects.active = o
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True)
print('exported', OUT, len([o for o in C.collection.objects if o.type == 'MESH']), 'meshes')
