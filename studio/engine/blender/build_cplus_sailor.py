"""Build the C+ 'Cinematic Expressive' Roman sailor in Blender (headless bpy) and export a rigged glTF for our three.js renderer.
usage:  <bpy-python> build_cplus_sailor.py -- <out.glb> [costume]
costume: roman (default, the approved C+ V1 baseline) | sailor1628[:cap colour] | officer1628 | council1628 | shipwright1628
The 1628 costumes (Episode 2, Vasa) reuse the same body, rig, face shell and proportions; only costume pieces change.
Design source: studio/design/concept_cplus.html (approved C+ direction). Units: metres, Blender Z-up, character faces -Y
(glTF export converts to Y-up, facing +Z). Proportions follow the concept (head ~26% of height).
Rig: hips > spine > chest > neck > head (> crest), upperarm/forearm/hand L/R, thigh/shin/foot L/R, cape1 > cape2.
Limbs, torso and cape are skinned with smooth position-based weights (no hand weight painting); rigid parts are bone-parented.
The face is a separate 'FaceShell' (front of the head, planar UV) that the renderer textures with the live C+ face drawing."""
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[-1:]
OUT = ARGS[0]; COST = (ARGS[1] if len(ARGS) > 1 else 'roman').split(':'); KIND = COST[0]; ROMAN = KIND == 'roman'
CAPCOL = COST[1] if len(COST) > 1 else '#9b2f2a'
# 1628 wardrobe (original designs after period dress: loose shirt + knee breeches for sailors; doublet, falling collar or ruff for officers)
WARD = {'sailor1628': dict(top='#e6dcc3', sleeve=0.78, breech='#6b5844', hose='skin', shoe='#3b2a1e', belt='sash', hat='knit', collar=None, beard=False),
        'officer1628': dict(top='#2d3a5c', sleeve=1.0, breech='#2d3a5c', hose='#d9d0bd', shoe='#1f1a17', belt='sashx', hat='wide', collar='falling', beard=True, tabs=True),
        'council1628': dict(top='#26221f', sleeve=1.0, breech='#26221f', hose='#26221f', shoe='#141110', belt=None, hat=None, collar='ruff', beard=True, tabs=True),
        'shipwright1628': dict(top='#d6c9a6', sleeve=0.8, breech='#5e4a36', hose='#cdbf9f', shoe='#3b2a1e', belt='apron', hat='flat', collar=None, beard=False)}
W8 = WARD.get(KIND, {})
bpy.ops.wm.read_factory_settings(use_empty=True)
C = bpy.context

# ---------------- materials (base colours; the renderer converts them to cel/toon materials) ----------------
PAL = {'skin': '#f0b88f', 'steel': '#c3ccd6', 'red': '#c8382d', 'leather': '#7c4b2b', 'brass': '#e0b354', 'ink': '#2a1b17', 'hair': '#5a2f1a', 'face': '#ffffff', 'strap': '#5d3720',
       'top': W8.get('top', '#c3ccd6'), 'breech': W8.get('breech', '#6b5844'), 'hose': W8.get('hose', '#f0b88f') if W8.get('hose') != 'skin' else '#f0b88f', 'shoe': W8.get('shoe', '#3b2a1e'),
       'cap': CAPCOL, 'white': '#f4efe4', 'hat': '#231d1a', 'feather': '#f2ede2', 'sash': '#c8382d', 'gold': '#d9a93a'}
def hexc(h): h = h.lstrip('#'); return tuple(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)) + (1,)
MAT = {}
for k, v in PAL.items():
    m = bpy.data.materials.new(k); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = hexc(v); b.inputs['Roughness'].default_value = 0.8; MAT[k] = m

def obj_from_bm(name, bm, mat, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); C.collection.objects.link(o)
    if isinstance(mat, list):
        for m in mat: me.materials.append(MAT[m])
    else: me.materials.append(MAT[mat])
    for p in me.polygons: p.use_smooth = smooth
    return o

def ellipsoid(name, c, r, mat, seg=40, ring=28, deform=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1)
    for v in bm.verts:
        p = Vector((v.co.x * r[0], v.co.y * r[1], v.co.z * r[2]))
        if deform: p = deform(p)
        v.co = p + Vector(c)
    return obj_from_bm(name, bm, mat)

def tube(name, pts, radii, mats, seg=18, per=10):
    """smooth tube along a polyline; material index per ring range: mats = [(t_end, matname), ...]; returns obj + per-vertex param t (0..1)"""
    bm = bmesh.new(); rings, ts = [], []; P = [Vector(p) for p in pts]; L = [0]
    for i in range(1, len(P)): L.append(L[-1] + (P[i] - P[i - 1]).length)
    tot = L[-1]; samples = []
    for i in range(len(P) - 1):
        for j in range(per):
            u = j / per; samples.append((P[i].lerp(P[i + 1], u), (L[i] + u * (L[i + 1] - L[i])) / tot, radii[i] + (radii[i + 1] - radii[i]) * u))
    samples.append((P[-1], 1.0, radii[-1]))
    for k, (p, t, r) in enumerate(samples):
        d = (samples[min(k + 1, len(samples) - 1)][0] - samples[max(k - 1, 0)][0]).normalized(); up = Vector((0, 1, 0)) if abs(d.y) < 0.9 else Vector((1, 0, 0))
        a = d.cross(up).normalized(); b = d.cross(a).normalized(); ring = []
        for s in range(seg):
            ang = s / seg * 2 * math.pi; ring.append(bm.verts.new(p + (a * math.cos(ang) + b * math.sin(ang)) * r))
        rings.append(ring); ts.append(t)
    for k in range(len(rings) - 1):
        for s in range(seg):
            f = bm.faces.new((rings[k][s], rings[k][(s + 1) % seg], rings[k + 1][(s + 1) % seg], rings[k + 1][s]))
            tt = (ts[k] + ts[k + 1]) / 2; f.material_index = next(i for i, (te, _) in enumerate(mats) if tt <= te + 1e-6)
    for ring, end in ((rings[0], samples[0]), (rings[-1], samples[-1])):   # rounded caps
        c = bm.verts.new(end[0]); [bm.faces.new((ring[s], ring[(s + 1) % seg], c)) for s in range(seg)]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = obj_from_bm(name, bm, [m for _, m in mats]); return o

# ---------------- proportions (from the concept; feet at z=0) ----------------
HEAD_C, HEAD_R = Vector((0, 0, 1.40)), 0.226
SH_Z, SH_X, HIP_Z, HIP_X = 1.11, 0.205, 0.66, 0.11
def head_shape(p):   # soft cranium + cheek bulge + gentle forward jaw
    x, y, z = p.x, p.y, p.z; zn = z / HEAD_R
    if zn < 0.1: x *= 1 + 0.07 * math.sin(min(1, (0.1 - zn) / 0.7) * math.pi)          # cheeks
    if zn < -0.45: k = (-0.45 - zn) / 0.55; x *= 1 - 0.28 * k; y -= 0.035 * k; z += 0.02 * k  # jaw tapers, chin forward
    return Vector((x, y * 0.94, z))
head = ellipsoid('Head', HEAD_C, (HEAD_R, HEAD_R, HEAD_R * 1.04), 'skin', 56, 40, head_shape)
nose = ellipsoid('Nose', HEAD_C + Vector((0.004, -0.214, -0.05)), (0.044, 0.04, 0.034), 'skin', 20, 14, lambda p: Vector((p.x, p.y - max(0, -p.z) * 0.3, p.z)))
ears = [ellipsoid(f'Ear.{s}', HEAD_C + Vector((sx * 0.218, 0.02, 0.0)), (0.028, 0.045, 0.06), 'skin', 16, 12) for s, sx in (('L', 1), ('R', -1))]
# (C+ hair tuft dropped in 3D: at the temple it read as a bruise / black eye next to the eye; the silhouette doesn't need it)

# face shell: front of the head (offset outward), planar UV from the front -> live face texture in the renderer
bm = bmesh.new(); bm.from_mesh(head.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y - HEAD_C.y) > -0.06 or abs(v.co.z - HEAD_C.z) > 0.205], context='VERTS')
bm.normal_update()
for v in bm.verts: v.co += v.normal * 0.0035
uv = bm.loops.layers.uv.new('UVMap'); S = 0.25
for f in bm.faces:
    for l in f.loops: co = l.vert.co; l[uv].uv = (0.5 + co.x / (2 * S), 0.5 + (co.z - HEAD_C.z) / (2 * S))
face = obj_from_bm('FaceShell', bm, 'face')

# helmet: dome + brim + forward-tilted crest + cheek guards + neck guard
HZ = HEAD_C.z + 0.115
if ROMAN:
  def dome_cut(p): return Vector((p.x, p.y, max(p.z, -0.004)))
  dome = ellipsoid('HelmetDome', (0, 0.006, HZ), (0.245, 0.234, 0.215), 'brass', 48, 28, dome_cut)
  bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=0.258, radius2=0.258, depth=0.022)
  for v in bm.verts: v.co.y *= 0.95; v.co += Vector((0, 0.006, HZ))
  brim = obj_from_bm('HelmetBrim', bm, 'brass')
  crest = ellipsoid('Crest', (0, 0, 0), (0.042, 0.16, 0.2), 'red', 36, 24, lambda p: Vector((p.x * (0.55 + 0.45 * max(0.0, p.z) / 0.2), p.y, max(p.z, 0.0))))
  for v in crest.data.vertices: v.co = Matrix.Rotation(-0.22, 3, 'X') @ v.co + Vector((0, 0.01, HZ + 0.17))

  guards = []
  for s, sx in (('L', 1), ('R', -1)):
      bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
      for v in bm.verts: v.co = Vector((v.co.x * 0.022, v.co.y * 0.085, v.co.z * 0.2))
      o = obj_from_bm(f'CheekGuard.{s}', bm, 'brass'); m = o.modifiers.new('sub', 'SUBSURF'); m.levels = 2; o.location = HEAD_C + Vector((sx * 0.222, -0.05, -0.02)); o.rotation_euler = (0, sx * -0.12, 0); guards.append(o)
  bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=0.255, radius2=0.205, depth=0.12)
  bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.02], context='VERTS')
  for v in bm.verts: v.co += Vector((0, 0.02, HEAD_C.z + 0.03))
  neckguard = obj_from_bm('NeckGuard', bm, 'brass'); neckguard.modifiers.new('solid', 'SOLIDIFY').thickness = 0.012

# neck + torso (rounded bean, elliptic cross-section) + lorica bands + belt + off-centre buckle + skirt + pteruges
neck = tube('Neck', [(0, 0.01, 1.10), (0, 0.01, 1.25)], [0.062, 0.058], [(1.0, 'skin')], 16, 4)
prof = [(0.60, 0.0), (0.61, 0.13), (0.70, 0.168), (0.85, 0.195), (0.98, 0.205), (1.07, 0.195), (1.13, 0.155), (1.16, 0.08), (1.165, 0.0)]
bm = bmesh.new(); rings = []
for z, r in prof:
    ring = [bm.verts.new((r * math.cos(a), 0.78 * r * math.sin(a), z)) for a in (i / 40 * 2 * math.pi for i in range(40))]; rings.append(ring)
for k in range(len(rings) - 1):
    for i in range(40): bm.faces.new((rings[k][i], rings[k][(i + 1) % 40], rings[k + 1][(i + 1) % 40], rings[k + 1][i]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
torso = obj_from_bm('Torso', bm, 'steel' if ROMAN else 'top'); torso.modifiers.new('sub', 'SUBSURF').levels = 1
if ROMAN:
  bands = []
  for z, r in ((0.80, 0.192), (0.865, 0.2), (0.93, 0.206), (0.995, 0.207)):
      bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=r + 0.004, radius2=r + 0.004, depth=0.012)
      for v in bm.verts: v.co.y *= 0.78; v.co.z += z
      bands.append(obj_from_bm('Band', bm, 'ink'))
  bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.178, radius2=0.178, depth=0.05)
  for v in bm.verts: v.co.y *= 0.8; v.co.z += 0.66
  belt = obj_from_bm('Belt', bm, 'leather'); belt.modifiers.new('solid', 'SOLIDIFY').thickness = 0.012
  bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
  for v in bm.verts: v.co = Vector((v.co.x * 0.05, v.co.y * 0.02, v.co.z * 0.055)) + Vector((0.07, -0.143, 0.66))
  buckle = obj_from_bm('Buckle', bm, 'brass')
  bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.21, radius2=0.168, depth=0.15)
  for v in bm.verts: v.co.y *= 0.82; v.co.z += 0.56
  skirt = obj_from_bm('Skirt', bm, 'red'); skirt.modifiers.new('solid', 'SOLIDIFY').thickness = 0.01
  pter = []
  for i, a in enumerate([-0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9, 2.3, 2.65, 3.0, 3.3, 3.65, 4.0]):
      bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
      for v in bm.verts: v.co = Vector((v.co.x * 0.05, v.co.y * 0.012, v.co.z * 0.2))
      o = obj_from_bm('Pteruges', bm, 'leather'); o.modifiers.new('sub', 'SUBSURF').levels = 1
      ang = -math.pi / 2 + a; o.location = (0.198 * math.cos(ang), 0.198 * 0.82 * math.sin(ang), 0.548); o.rotation_euler = (0, 0, ang + math.pi / 2); pter.append(o)

# arms (sleeve red -> skin forearm), shoulder plates, hands (relaxed + pointing variant on the right)
ARM = {}
for s, sx in (('L', 1), ('R', -1)):
    sh, el, wr = Vector((sx * SH_X, 0.0, SH_Z)), Vector((sx * 0.265, 0.01, 0.86)), Vector((sx * 0.29, -0.01, 0.63))
    ARM[s] = (sh, el, wr); tube(f'Arm.{s}', [sh, el, wr], [0.072, 0.061, 0.053] if ROMAN else [0.076, 0.066, 0.056], [(0.32, 'red'), (1.0, 'skin')] if ROMAN else ([(W8['sleeve'], 'top'), (1.0, 'skin')] if W8['sleeve'] < 1 else [(0.97, 'top'), (1.0, 'white' if W8.get('collar') else 'top')]), 20, 12)
    if ROMAN: ellipsoid(f'ShoulderPlate.{s}', sh + Vector((sx * 0.025, 0.0, 0.03)), (0.098, 0.085, 0.07), 'steel', 28, 18, lambda p: Vector((p.x, p.y, max(p.z, -0.012))))
def hand(name, wr, sx, point=False):
    """chunky 4-finger mitten hand hanging along the forearm: palm faces the thigh (-sx), fingers spaced front-back, thumb at the front"""
    objs = []; palm = wr + Vector((0, -0.004, -0.062)); inn = -sx
    objs.append(ellipsoid(name + '.palm', palm, (0.034, 0.05, 0.058), 'skin', 22, 16))
    for i in range(4):
        y = -0.03 + i * 0.021; base = palm + Vector((inn * 0.004, y, -0.042)); straight = point and i == 0
        if straight: pts = [base, base + Vector((0, -0.004, -0.045)), base + Vector((0, -0.006, -0.088))]
        elif point: pts = [base, base + Vector((inn * 0.02, 0, -0.022)), base + Vector((inn * 0.042, 0, -0.008))]
        else: pts = [base, base + Vector((inn * 0.006, 0, -0.03)), base + Vector((inn * 0.026, 0, -0.05))]
        objs.append(tube(name + f'.f{i}', pts, [0.0175, 0.0165, 0.0155], [(1.0, 'skin')], 12, 4))
    th = palm + Vector((inn * 0.012, -0.045, 0.012))
    tp = [th, th + Vector((0, -0.03, -0.02)), th + Vector((0, -0.05, -0.045))] if point else [th, th + Vector((inn * 0.01, -0.022, -0.03)), th + Vector((inn * 0.018, -0.022, -0.05))]   # pointing: thumb up and out (reads as a clear 'look there!' hand)
    objs.append(tube(name + '.thumb', tp, [0.019, 0.017, 0.016], [(1.0, 'skin')], 12, 4))
    return objs
HANDS = {'L': hand('Hand.L', ARM['L'][2], 1), 'R': hand('Hand.R', ARM['R'][2], -1), 'Rp': hand('HandPoint.R', ARM['R'][2], -1, True)}

# legs, sandal straps, boots
LEG = {}
for s, sx in (('L', 1), ('R', -1)):
    hp, kn, an = Vector((sx * HIP_X, 0.0, HIP_Z)), Vector((sx * 0.118, -0.01, 0.34)), Vector((sx * 0.12, 0.0, 0.08)); LEG[s] = (hp, kn, an)
    if ROMAN: tube(f'Leg.{s}', [hp, kn, an], [0.066, 0.057, 0.05], [(1.0, 'skin')], 20, 12)
    else: tube(f'Leg.{s}', [hp, kn, an], [0.082, 0.064, 0.05], [(0.6, 'breech'), (1.0, 'skin' if W8['hose'] == 'skin' else 'hose')], 20, 12)
    for z in ((0.15, 0.22) if ROMAN else ()):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.054, radius2=0.054, depth=0.014)
        for v in bm.verts: v.co += Vector((sx * 0.12, 0.0, z))
        st = obj_from_bm(f'Strap.{s}', bm, 'strap'); st['leg'] = s
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * 0.1, v.co.y * 0.17, v.co.z * 0.075)) + Vector((sx * 0.122, -0.035, 0.04))
    boot = obj_from_bm(f'Boot.{s}', bm, 'leather' if ROMAN else 'shoe'); m = boot.modifiers.new('sub', 'SUBSURF'); m.levels = 2

if ROMAN:
  # one-shoulder cape (signature asymmetry) from the left shoulder, brass brooch
  bm = bmesh.new(); W, Hh, NX, NY = 0.3, 0.62, 8, 14; grid = []
  for j in range(NY + 1):
      row = []
      for i in range(NX + 1):
          u, v = i / NX, j / NY; x = 0.17 + (u - 0.5) * W * (0.7 + 0.6 * v); y = 0.17 + 0.05 * math.sin(u * math.pi) + v * 0.06; z = 1.14 - v * Hh
          row.append(bm.verts.new((x, y, z)))
      grid.append(row)
  for j in range(NY):
      for i in range(NX): bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
  cape = obj_from_bm('Cape', bm, 'red'); cape.modifiers.new('solid', 'SOLIDIFY').thickness = 0.014
  brooch = ellipsoid('Brooch', (0.13, -0.1, 1.1), (0.032, 0.02, 0.032), 'brass', 18, 12)
  capestrap = tube('CapeStrap', [(0.13, -0.09, 1.1), (0.17, -0.03, 1.185), (0.18, 0.09, 1.18), (0.17, 0.17, 1.13)], [0.026, 0.03, 0.03, 0.028], [(1.0, 'red')], 14, 6)


# ---------------- 1628 costume pieces ----------------
if not ROMAN:
    hair = ellipsoid('Hair', HEAD_C + Vector((0, 0.025, 0.035)), (0.236, 0.232, 0.225), 'hair', 40, 28,
                     lambda p: Vector((p.x, p.y, p.z if (p.y > -0.06 or p.z > 0.1) else 0.1 + (p.z - 0.1) * 0.08)))   # cap of hair; fringe stays above the brows
    if W8['hat'] == 'knit':   # slouched knitted cap
        ellipsoid('HatKnit', HEAD_C + Vector((0, 0.03, 0.11)), (0.245, 0.24, 0.17), 'cap', 36, 22, lambda p: Vector((p.x, p.y + max(0, p.z) * 0.55, max(p.z, -0.035))))
        tube('HatRoll', [HEAD_C + Vector((math.cos(a) * 0.243, 0.03 + math.sin(a) * 0.238, 0.08)) for a in [i / 24 * 2 * math.pi for i in range(25)]], [0.026] * 25, [(1.0, 'cap')], 10, 2)
    elif W8['hat'] == 'wide':   # broad-brimmed felt hat, brim pinned up on the left, plume
        tube('HatCrown', [HEAD_C + Vector((0, 0.02, 0.15)), HEAD_C + Vector((0, 0.03, 0.33))], [0.19, 0.165], [(1.0, 'hat')], 28, 4)
        bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=48, radius=0.36)
        for v in bm.verts: x, y = v.co.x, v.co.y; v.co = Vector((x, y * 0.92 + 0.02, 0.15 + max(0, x - 0.08) * 0.55 + (0.02 if y > 0 else 0))) + Vector((0, 0, HEAD_C.z))
        o = obj_from_bm('HatBrim', bm, 'hat'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.014
        tube('HatBand', [HEAD_C + Vector((math.cos(a) * 0.188, 0.02 + math.sin(a) * 0.188, 0.175)) for a in [i / 24 * 2 * math.pi for i in range(25)]], [0.012] * 25, [(1.0, 'gold')], 8, 2)
        tube('Plume', [HEAD_C + Vector((0.16, 0.0, 0.22)), HEAD_C + Vector((0.25, 0.08, 0.33)), HEAD_C + Vector((0.24, 0.22, 0.36)), HEAD_C + Vector((0.18, 0.32, 0.3))], [0.03, 0.05, 0.045, 0.02], [(1.0, 'feather')], 14, 6)
    elif W8['hat'] == 'flat':   # flat working cap
        ellipsoid('HatFlat', HEAD_C + Vector((0, 0.0, 0.17)), (0.265, 0.27, 0.075), 'breech', 36, 18, lambda p: Vector((p.x, p.y - max(0, -p.y) * 0.15, max(p.z, -0.02))))
    if W8['collar'] == 'falling':   # flat white linen collar over the shoulders
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=0.2, radius2=0.075, depth=0.06)
        for v in bm.verts: v.co.y *= 0.82; v.co.z += 1.13
        o = obj_from_bm('Collar', bm, 'white'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.01
    elif W8['collar'] == 'ruff':
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.13, radius2=0.13, depth=0.06)
        for v in bm.verts: v.co.z += 1.17
        bmesh.ops.inset_region(bm, faces=[], thickness=0) if False else None
        o = ellipsoid('Ruff', (0, 0.005, 1.165), (0.15, 0.14, 0.04), 'white', 40, 12)
    if W8['beard']: ellipsoid('Goatee', HEAD_C + Vector((0, -0.185, -0.215)), (0.032, 0.026, 0.05), 'hair', 18, 12, lambda p: Vector((p.x * (1 - max(0, -p.z) * 6), p.y, p.z)))
    if W8['belt'] in ('sash', 'sashx'):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.176, radius2=0.18, depth=0.07)
        for v in bm.verts: v.co.y *= 0.8; v.co.z += 0.67
        o = obj_from_bm('Sash', bm, 'sash' if W8['belt'] == 'sash' else 'gold'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.01
        if W8['belt'] == 'sashx':   # officer's sash across the chest
            tube('SashX', [(0.2, -0.0, 1.1), (0.1, -0.155, 0.98), (-0.08, -0.17, 0.82), (-0.18, -0.06, 0.7)], [0.03, 0.032, 0.032, 0.03], [(1.0, 'gold')], 12, 6)
    elif W8['belt'] == 'apron':
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=0.2, radius2=0.168, depth=0.5)
        for v in bm.verts: v.co.y *= 0.82; v.co.z += 0.66 + 0.0
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > -0.02], context='VERTS')
        for v in bm.verts: v.co.z = 0.42 + (v.co.z - 0.41) * 0.9
        o = obj_from_bm('Apron', bm, 'leather'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.01
    if W8.get('tabs'):   # short doublet skirt tabs below the waist
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.2, radius2=0.172, depth=0.09)
        for v in bm.verts: v.co.y *= 0.82; v.co.z += 0.6
        o = obj_from_bm('Tabs', bm, 'top'); o.modifiers.new('solid', 'SOLIDIFY').thickness = 0.01
    for k in range(5):   # doublet / shirt buttons down the front
        if W8.get('collar'): ellipsoid('Button', (0, -0.158 + (k * 0.004 if k < 0 else 0), 1.05 - k * 0.075), (0.012, 0.008, 0.012), 'gold', 10, 8)

# apply modifiers so the exported meshes match
for o in list(C.collection.objects):
    if o.type == 'MESH' and o.modifiers:
        C.view_layer.objects.active = o; o.select_set(True)
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
        o.select_set(False)

# ---------------- armature ----------------
arm = bpy.data.objects.new('Rig', bpy.data.armatures.new('Rig')); C.collection.objects.link(arm); C.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT'); EB = arm.data.edit_bones
def bone(n, h, t, parent=None, conn=False):
    b = EB.new(n); b.head = h; b.tail = t
    if parent: b.parent = EB[parent]; b.use_connect = conn
    return b
bone('hips', (0, 0, 0.60), (0, 0, 0.76)); bone('spine', (0, 0, 0.76), (0, 0, 0.94), 'hips', True); bone('chest', (0, 0, 0.94), (0, 0, 1.12), 'spine', True)
bone('neck', (0, 0.01, 1.12), (0, 0.01, 1.24), 'chest', True); bone('head', (0, 0.01, 1.24), (0, 0.01, 1.64), 'neck', True); bone('crest', (0, 0, HZ + 0.17), (0, 0.04, HZ + 0.32), 'head')
for s in ('L', 'R'):
    sh, el, wr = ARM[s]; bone(f'upperarm.{s}', sh, el, 'chest'); bone(f'forearm.{s}', el, wr, f'upperarm.{s}', True); bone(f'hand.{s}', wr, wr + (wr - el).normalized() * 0.11, f'forearm.{s}', True)
    hp, kn, an = LEG[s]; bone(f'thigh.{s}', hp, kn, 'hips'); bone(f'shin.{s}', kn, an, f'thigh.{s}', True); bone(f'foot.{s}', an, an + Vector((0, -0.14, -0.04)), f'shin.{s}', True)
bone('cape1', (0.17, 0.17, 1.13), (0.17, 0.2, 0.84), 'chest'); bone('cape2', (0.17, 0.2, 0.84), (0.17, 0.23, 0.52), 'cape1', True)
bpy.ops.object.mode_set(mode='OBJECT')

def skin(o, groups):
    """groups: list of (bone, weight_fn(co)); weights normalised per vertex"""
    for b, _ in groups: o.vertex_groups.new(name=b)
    for v in o.data.vertices:
        ws = [max(0.0, f(v.co)) for _, f in groups]; s = sum(ws) or 1.0
        for (b, _), w in zip(groups, ws):
            if w > 0: o.vertex_groups[b].add([v.index], w / s, 'REPLACE')
    md = o.modifiers.new('arm', 'ARMATURE'); md.object = arm; o.parent = arm
def seg_weights(a, b, c):   # 2-bone chain a->b->c: smooth blend around the middle joint
    def t(co): d = c - a; return max(0.0, min(1.0, (Vector(co) - a).dot(d) / d.length_squared))
    tb = (b - a).length / ((b - a).length + (c - b).length)
    return (lambda co: 1 - max(0, min(1, (t(co) - tb + 0.06) / 0.12))), (lambda co: max(0, min(1, (t(co) - tb + 0.06) / 0.12)))
for s in ('L', 'R'):
    sh, el, wr = ARM[s]; w1, w2 = seg_weights(sh, el, wr); skin(bpy.data.objects[f'Arm.{s}'], [(f'upperarm.{s}', w1), (f'forearm.{s}', w2)])
    hp, kn, an = LEG[s]; w1, w2 = seg_weights(hp, kn, an); skin(bpy.data.objects[f'Leg.{s}'], [(f'thigh.{s}', w1), (f'shin.{s}', w2)])
band = lambda lo, hi: (lambda co: max(0, min(1, (co.z - lo) / (hi - lo))))
skin(torso, [('hips', lambda co: 1 - band(0.74, 0.82)(co)), ('spine', lambda co: band(0.74, 0.82)(co) * (1 - band(0.92, 1.0)(co))), ('chest', band(0.92, 1.0))])
if ROMAN: skin(cape, [('cape1', lambda co: 1 - band(0.72, 0.92)(co)), ('cape2', band(0.72, 0.92))])

def rigid(o, b):
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = b; o.matrix_world = mw
for n in ('Head', 'Nose', 'Ear.L', 'Ear.R', 'FaceShell', 'HelmetDome', 'HelmetBrim', 'CheekGuard.L', 'CheekGuard.R', 'NeckGuard'):
    if n in bpy.data.objects: rigid(bpy.data.objects[n], 'head')
if ROMAN: rigid(bpy.data.objects['Crest'], 'crest')
rigid(neck, 'neck')
for o in list(C.collection.objects):
    n = o.name
    if n.startswith('Band'): rigid(o, 'chest')
    elif n.startswith(('Belt', 'Buckle', 'Skirt', 'Pteruges')): rigid(o, 'hips')
    elif n.startswith('ShoulderPlate.'): rigid(o, 'upperarm.' + n[-1])
    elif n.startswith('Hand.L'): rigid(o, 'hand.L')
    elif n.startswith(('Hand.R', 'HandPoint.R')): rigid(o, 'hand.R')
    elif n.startswith('Strap.'): rigid(o, 'shin.' + o['leg'])
    elif n.startswith('Boot.'): rigid(o, 'foot.' + n[-1])
    elif n.startswith(('Brooch', 'CapeStrap')): rigid(o, 'chest')
    elif n.startswith(('Hair', 'Hat', 'Plume', 'Goatee')): rigid(o, 'head')
    elif n.startswith(('Collar', 'Ruff', 'SashX', 'Button')): rigid(o, 'chest')
    elif n.startswith(('Sash', 'Apron', 'Tabs')): rigid(o, 'hips')

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_skins=True, export_animations=False, export_apply=False, export_yup=True)
print('exported', OUT, len([o for o in C.collection.objects if o.type == 'MESH']), 'meshes')
