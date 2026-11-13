"""Test shot 01 - "The Engine Wakes".
Builds the full scene procedurally and saves shot01.blend.
Usage: python build_scene.py -- <out.blend>
"""
import bpy, bmesh, math, random, os, sys
from math import pi, sin, cos, radians as R
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[-1] if sys.argv[-1].endswith('.blend') else os.path.join(HERE, 'shot01.blend')
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
FPS, F_END = 24, 192
scn.render.fps = FPS
scn.frame_start, scn.frame_end = 1, F_END

# ---------------------------------------------------------------- helpers
def link(o, parent=None):
    scn.collection.objects.link(o)
    if parent is not None:
        o.parent = parent
    return o

def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.empty_display_size = 0.1
    o.location, o.rotation_euler = loc, rot
    return link(o, parent)

def mesh_obj(name, bm, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    if mat:
        me.materials.append(mat)
    o.location, o.rotation_euler = loc, rot
    return link(o, parent)

def sphere(name, r=1.0, scale=(1, 1, 1), mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=48, ring=24):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
    return mesh_obj(name, bm, mat, parent, loc, rot)

def hemisphere(name, r, upper=True, mat=None, parent=None, loc=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=r)
    kill = [v for v in bm.verts if (v.co.z < -1e-4 if upper else v.co.z > 1e-4)]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    o = mesh_obj(name, bm, mat, parent, loc)
    m = o.modifiers.new('solid', 'SOLIDIFY'); m.thickness = 0.006; m.offset = 1
    return o

def box(name, size, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.01, seg=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    o = mesh_obj(name, bm, mat, parent, loc, rot, smooth=False)
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'ANGLE'
        o.data.polygons.foreach_set('use_smooth', [True] * len(o.data.polygons))
        try:
            o.data.set_sharp_from_angle(angle=R(40))
        except Exception:
            pass
    return o

def cyl(name, r1, r2, depth, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), verts=48, bevel=0.0, smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r1, radius2=r2, depth=depth)
    o = mesh_obj(name, bm, mat, parent, loc, rot, smooth=smooth)
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL'); m.width = bevel; m.segments = 2; m.limit_method = 'ANGLE'
    if smooth:
        try:
            o.data.set_sharp_from_angle(angle=R(35))
        except Exception:
            pass
    return o

def torus(name, R_, r_, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=96, mseg=16):
    bm = bmesh.new()
    verts = []
    for i in range(seg):
        a = 2 * pi * i / seg
        row = []
        for j in range(mseg):
            b = 2 * pi * j / mseg
            p = Vector(((R_ + r_ * cos(b)) * cos(a), (R_ + r_ * cos(b)) * sin(a), r_ * sin(b)))
            row.append(bm.verts.new(p))
        verts.append(row)
    for i in range(seg):
        for j in range(mseg):
            bm.faces.new((verts[i][j], verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % mseg], verts[i][(j + 1) % mseg]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat, parent, loc, rot)

def clump(name, blobs, mat, parent=None, loc=(0, 0, 0), voxel=0.007, smooth=12):
    """Stylized sculpted hair: overlapping blobs fused by a voxel remesh, then relaxed. blobs=[(center, radius, scale)]"""
    bm = bmesh.new()
    for c, r, s in blobs:
        mtx = Matrix.Translation(c) @ Matrix.Diagonal((*s, 1.0))
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=r, matrix=mtx)
    o = mesh_obj(name, bm, mat, parent, loc)
    rm = o.modifiers.new('fuse', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = o.modifiers.new('relax', 'SMOOTH'); sm.factor = 0.6; sm.iterations = smooth
    return o

def gear_mesh(name, teeth, r, depth, thick, mat, parent=None, loc=(0, 0, 0)):
    bm = bmesh.new()
    pts = []
    step = 2 * pi / teeth
    for i in range(teeth):
        a0 = i * step
        for f, rr in ((0.0, r - depth), (0.15, r), (0.45, r), (0.6, r - depth)):
            pts.append(bm.verts.new((rr * cos(a0 + f * step), rr * sin(a0 + f * step), -thick / 2)))
    face = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, thick), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_obj(name, bm, mat, parent, loc, smooth=False)
    m = o.modifiers.new('bev', 'BEVEL'); m.width = 0.0025; m.segments = 2; m.limit_method = 'ANGLE'
    return o

def K(obj, prop, f, val):
    setattr(obj, prop, val)
    obj.keyframe_insert(prop, frame=f)

def KS(sock, f, val):
    sock.default_value = val
    sock.keyframe_insert('default_value', frame=f)

def set_interp(kind):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = kind

# ---------------------------------------------------------------- materials
def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m, m.node_tree.nodes, m.node_tree.links, m.node_tree.nodes['Principled BSDF']

def simple(name, color, rough=0.5, metal=0.0, **kw):
    m, N, L, p = new_mat(name)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    for k, v in kw.items():
        p.inputs[k].default_value = v
    return m

def noise_node(N, L, tc, scale, detail=6.0, rough=0.55):
    n = N.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough
    L.new(tc.outputs['Object'], n.inputs['Vector'])
    return n

def ramp(N, L, src, pos0, pos1, c0, c1):
    r = N.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].position, r.color_ramp.elements[0].color = pos0, (*c0, 1)
    r.color_ramp.elements[1].position, r.color_ramp.elements[1].color = pos1, (*c1, 1)
    L.new(src, r.inputs['Fac'])
    return r

def bump(N, L, p, height_src, strength, dist=0.01):
    b = N.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = dist
    L.new(height_src, b.inputs['Height'])
    L.new(b.outputs['Normal'], p.inputs['Normal'])
    return b

def metal_mat(name, base, patina=(0.17, 0.40, 0.33), patina_amt=0.55, rough=(0.18, 0.42)):
    m, N, L, p = new_mat(name)
    tc = N.new('ShaderNodeTexCoord')
    n1 = noise_node(N, L, tc, 7.0, 8)
    rr = N.new('ShaderNodeMapRange')
    rr.inputs['To Min'].default_value, rr.inputs['To Max'].default_value = rough
    L.new(n1.outputs['Fac'], rr.inputs['Value'])
    L.new(rr.outputs['Result'], p.inputs['Roughness'])
    n2 = noise_node(N, L, tc, 2.5, 12, 0.65)
    mask = ramp(N, L, n2.outputs['Fac'], 0.58, 0.78, (0, 0, 0), (patina_amt,) * 3)
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs[6].default_value = (*base, 1)
    mix.inputs[7].default_value = (*patina, 1)
    L.new(mask.outputs['Color'], mix.inputs[0])
    L.new(mix.outputs[2], p.inputs['Base Color'])
    inv = N.new('ShaderNodeMapRange')
    inv.inputs['To Min'].default_value, inv.inputs['To Max'].default_value = 1.0, 0.15
    L.new(mask.outputs['Color'], inv.inputs['Value'])
    L.new(inv.outputs['Result'], p.inputs['Metallic'])
    n3 = noise_node(N, L, tc, 60.0, 4)
    bump(N, L, p, n3.outputs['Fac'], 0.08, 0.002)
    return m

def stone_mat(name, scale=3.0, c0=(0.30, 0.26, 0.22), c1=(0.46, 0.41, 0.35), brick=True, axes='xy'):
    m, N, L, p = new_mat(name)
    tc0 = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc0.outputs['Object'], sep.inputs[0])
    com = N.new('ShaderNodeCombineXYZ')
    order = {'xy': 'XYZ', 'xz': 'XZY', 'yz': 'YZX'}[axes]
    for k, a in enumerate(order):
        L.new(sep.outputs[a], com.inputs[k])
    class _TC:  # duck-typed texcoord exposing remapped 'Object'
        outputs = {'Object': com.outputs[0]}
    tc = _TC()
    n = noise_node(N, L, tc, scale * 4, 10, 0.6)
    col = ramp(N, L, n.outputs['Fac'], 0.35, 0.7, c0, c1)
    p.inputs['Roughness'].default_value = 0.85
    if brick:
        b = N.new('ShaderNodeTexBrick')
        b.inputs['Scale'].default_value = scale
        b.inputs['Mortar Size'].default_value = 0.02
        b.inputs['Mortar Smooth'].default_value = 0.4
        b.inputs['Color1'].default_value = (1, 1, 1, 1)
        b.inputs['Color2'].default_value = (0.75, 0.72, 0.68, 1)
        b.inputs['Mortar'].default_value = (0.25, 0.22, 0.2, 1)
        b.offset = 0.5
        L.new(tc.outputs['Object'], b.inputs['Vector'])
        mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
        mul.inputs[0].default_value = 1.0
        L.new(col.outputs['Color'], mul.inputs[6]); L.new(b.outputs['Color'], mul.inputs[7])
        L.new(mul.outputs[2], p.inputs['Base Color'])
        add = N.new('ShaderNodeMath'); add.operation = 'ADD'
        L.new(b.outputs['Fac'], add.inputs[0]); L.new(n.outputs['Fac'], add.inputs[1])
        bump(N, L, p, add.outputs['Value'], 0.35, 0.02)
    else:
        L.new(col.outputs['Color'], p.inputs['Base Color'])
        bump(N, L, p, n.outputs['Fac'], 0.3, 0.02)
    return m

def wood_mat(name, c0=(0.16, 0.08, 0.035), c1=(0.33, 0.18, 0.08), scale=3.0):
    m, N, L, p = new_mat(name)
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 1, 12)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    w = N.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'
    w.inputs['Scale'].default_value = scale; w.inputs['Distortion'].default_value = 6
    w.inputs['Detail'].default_value = 4
    L.new(mp.outputs['Vector'], w.inputs['Vector'])
    col = ramp(N, L, w.outputs['Fac'], 0.2, 0.9, c0, c1)
    L.new(col.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.6
    bump(N, L, p, w.outputs['Fac'], 0.15, 0.005)
    return m

def cloth_mat(name, color, sheen=(0.9, 0.85, 0.7)):
    m, N, L, p = new_mat(name)
    tc = N.new('ShaderNodeTexCoord')
    n = noise_node(N, L, tc, 25, 4)
    col = ramp(N, L, n.outputs['Fac'], 0.3, 0.8, tuple(c * 0.75 for c in color), color)
    L.new(col.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.85
    p.inputs['Sheen Weight'].default_value = 0.6
    p.inputs['Sheen Tint'].default_value = (*sheen, 1)
    n2 = noise_node(N, L, tc, 180, 2)
    bump(N, L, p, n2.outputs['Fac'], 0.12, 0.002)
    return m

def image_mat(name, path, rough=0.8):
    m, N, L, p = new_mat(name)
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path)
    L.new(t.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    return m

def emit_mat(name, color, strength):
    m, N, L, p = new_mat(name)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = strength
    return m

M = {}
M['bronze'] = metal_mat('bronze', (0.55, 0.32, 0.13))
M['brass'] = metal_mat('brass', (0.80, 0.60, 0.25), patina_amt=0.25, rough=(0.15, 0.3))
M['copper'] = metal_mat('copper', (0.70, 0.30, 0.17), patina_amt=0.4)
M['iron'] = metal_mat('iron', (0.10, 0.09, 0.085), patina=(0.25, 0.12, 0.05), patina_amt=0.6, rough=(0.4, 0.7))
M['stone_wall'] = stone_mat('stone_wall', 2.2, (0.16, 0.135, 0.115), (0.30, 0.26, 0.22), axes='xz')
M['stone_wall_side'] = stone_mat('stone_wall_side', 2.2, (0.16, 0.135, 0.115), (0.30, 0.26, 0.22), axes='yz')
M['stone_floor'] = stone_mat('stone_floor', 1.6, (0.22, 0.19, 0.16), (0.36, 0.31, 0.26))
M['wood'] = wood_mat('wood')
M['wood_dark'] = wood_mat('wood_dark', (0.07, 0.035, 0.018), (0.17, 0.09, 0.045))
M['skin'] = simple('skin', (0.80, 0.52, 0.40), 0.45, **{'Subsurface Weight': 0.25, 'Subsurface Scale': 0.02})
M['skin_rosy'] = simple('skin_rosy', (0.80, 0.47, 0.37), 0.45, **{'Subsurface Weight': 0.25, 'Subsurface Scale': 0.02})
M['hair'] = cloth_mat('hair', (0.88, 0.86, 0.82), (1, 1, 1))
M['robe'] = cloth_mat('robe', (0.05, 0.20, 0.26))
M['robe_trim'] = metal_mat('trim', (0.75, 0.55, 0.2), patina_amt=0.1)
M['leather'] = cloth_mat('leather', (0.22, 0.11, 0.05), (0.6, 0.45, 0.3))
M['eye_white'] = simple('eye_white', (0.92, 0.91, 0.88), 0.15, **{'Coat Weight': 1.0, 'Subsurface Weight': 0.1})
M['iris'] = simple('iris', (0.30, 0.16, 0.06), 0.2, **{'Coat Weight': 1.0})
M['pupil'] = simple('pupil', (0.005, 0.005, 0.005), 0.1, **{'Coat Weight': 1.0})
M['mouth'] = simple('mouth', (0.12, 0.025, 0.025), 0.6)
M['lens'] = simple('lens', (0.9, 0.95, 1.0), 0.02, **{'Transmission Weight': 1.0, 'IOR': 1.5})
M['glass_green'] = simple('glass_g', (0.25, 0.6, 0.35), 0.05, **{'Transmission Weight': 1.0})
M['glass_amber'] = simple('glass_a', (0.8, 0.45, 0.12), 0.05, **{'Transmission Weight': 1.0})
M['wax'] = simple('wax', (0.92, 0.88, 0.75), 0.5, **{'Subsurface Weight': 0.5, 'Subsurface Scale': 0.02})
M['flame'] = emit_mat('flame', (1.0, 0.55, 0.18), 25)
M['paper'] = cloth_mat('paper', (0.85, 0.78, 0.6))
M['book_r'] = cloth_mat('book_r', (0.35, 0.06, 0.05))
M['book_b'] = cloth_mat('book_b', (0.06, 0.12, 0.28))
M['book_g'] = cloth_mat('book_g', (0.08, 0.2, 0.1))
M['rope'] = cloth_mat('rope', (0.45, 0.35, 0.2))
for k in ('gears', 'armillary', 'stars'):
    M['sheet_' + k] = image_mat('sheet_' + k, os.path.join(HERE, 'tex', f'sheet_{k}.png'))

# machine core + lamps: animated emission
M['core'] = emit_mat('core', (1.0, 0.62, 0.22), 0.4)
M['lamp'] = [emit_mat(f'lamp{i}', (1.0, 0.45, 0.12), 0.0) for i in range(3)]

# ---------------------------------------------------------------- environment
ENV = empty('ENV')
floor = box('ENV_floor', (9, 9, 0.1), M['stone_floor'], ENV, (0, 0, -0.05), bevel=0)
BACK_Y = 2.6
# back wall with window opening x[-1.3,-0.5] z[1.3,2.6]
wall_parts = [((-3.0, -1.3), (0, 3.6)), ((-0.5, 3.2), (0, 3.6)), ((-1.3, -0.5), (0, 1.3)), ((-1.3, -0.5), (2.6, 3.6))]
for i, ((x0, x1), (z0, z1)) in enumerate(wall_parts):
    box(f'ENV_backwall{i}', (x1 - x0, 0.4, z1 - z0), M['stone_wall'], ENV, ((x0 + x1) / 2, BACK_Y + 0.2, (z0 + z1) / 2), bevel=0)
box('ENV_leftwall', (0.4, 9, 3.6), M['stone_wall_side'], ENV, (-2.6, -1.9, 1.8), bevel=0)
box('ENV_rightwall', (0.4, 9, 3.6), M['stone_wall_side'], ENV, (3.0, -1.9, 1.8), bevel=0)
box('ENV_ceiling', (7, 9, 0.2), M['wood_dark'], ENV, (0.2, -1.9, 3.7), bevel=0)
for i, y in enumerate((-3.5, -2.0, -0.5, 1.0, 2.2)):
    box(f'ENV_beam{i}', (6.0, 0.22, 0.28), M['wood_dark'], ENV, (0.2, y, 3.45), bevel=0.02)
# window: frame + mullions + deep sill + night sky card
WX0, WX1, WZ0, WZ1 = -1.3, -0.5, 1.3, 2.6
for nm, sz, lc in [('top', (0.92, 0.46, 0.08), ((WX0 + WX1) / 2, BACK_Y + 0.2, WZ1)),
                   ('sill', (1.0, 0.55, 0.08), ((WX0 + WX1) / 2, BACK_Y + 0.15, WZ0)),
                   ('l', (0.08, 0.46, WZ1 - WZ0), (WX0, BACK_Y + 0.2, (WZ0 + WZ1) / 2)),
                   ('r', (0.08, 0.46, WZ1 - WZ0), (WX1, BACK_Y + 0.2, (WZ0 + WZ1) / 2)),
                   ('mv', (0.04, 0.05, WZ1 - WZ0), ((WX0 + WX1) / 2, BACK_Y + 0.35, (WZ0 + WZ1) / 2)),
                   ('mh', (WX1 - WX0, 0.05, 0.04), ((WX0 + WX1) / 2, BACK_Y + 0.35, (WZ0 + WZ1) / 2 + 0.15))]:
    box('ENV_win_' + nm, sz, M['wood_dark'], ENV, lc, bevel=0.008)
sky = simple('sky', (0, 0, 0), 1.0)
skyN = sky.node_tree.nodes; skyP = skyN['Principled BSDF']
skyP.inputs['Emission Color'].default_value = (0.25, 0.42, 0.75, 1); skyP.inputs['Emission Strength'].default_value = 2.5
box('ENV_sky', (3.0, 0.05, 3.0), sky, ENV, (-0.9, BACK_Y + 1.2, 2.0), bevel=0)
moon = emit_mat('moon', (0.9, 0.95, 1.0), 30)
sphere('ENV_moon', 0.12, mat=moon, parent=ENV, loc=(-1.1, BACK_Y + 1.1, 2.35))

# workbench behind/left of the character
BX, BY, BZ = -1.45, 1.95, 0.92
box('SET_bench_top', (1.9, 0.75, 0.07), M['wood'], ENV, (BX, BY, BZ), bevel=0.012)
for dx in (-0.85, 0.85):
    for dy in (-0.3, 0.3):
        box('SET_bench_leg', (0.08, 0.08, BZ), M['wood_dark'], ENV, (BX + dx, BY + dy, BZ / 2), bevel=0.006)
box('SET_bench_shelf', (1.8, 0.6, 0.04), M['wood_dark'], ENV, (BX, BY, 0.25), bevel=0.006)
# books
bx = BX - 0.75
for i, (w, h, mm) in enumerate([(0.06, 0.26, 'book_r'), (0.05, 0.24, 'book_b'), (0.07, 0.28, 'book_g'), (0.05, 0.22, 'book_r'), (0.06, 0.25, 'book_b')]):
    box(f'SET_book{i}', (w, 0.18, h), M[mm], ENV, (bx, BY + 0.2, BZ + 0.035 + h / 2), rot=(0, R(random.uniform(-4, 4)), 0), bevel=0.006)
    bx += w + 0.004
box('SET_book_flat', (0.22, 0.17, 0.05), M['book_g'], ENV, (BX - 0.35, BY + 0.18, BZ + 0.06), rot=(0, 0, R(12)), bevel=0.006)
box('SET_book_flat2', (0.2, 0.15, 0.045), M['book_r'], ENV, (BX - 0.33, BY + 0.17, BZ + 0.108), rot=(0, 0, R(-7)), bevel=0.006)
# scrolls
for i in range(4):
    cyl(f'SET_scroll{i}', 0.03, 0.03, 0.34, M['paper'], ENV, (BX + 0.1 + 0.07 * i, BY - 0.12 + 0.03 * i, BZ + 0.065), rot=(0, R(90), R(25 + i * 9)), verts=24)
# bottles
for i, (mm, h) in enumerate([('glass_green', 0.24), ('glass_amber', 0.18), ('glass_green', 0.14)]):
    o = cyl(f'SET_bottle{i}', 0.045, 0.045, h, M[mm], ENV, (BX + 0.55 + 0.11 * i, BY + 0.22, BZ + 0.035 + h / 2), verts=32)
    cyl(f'SET_neck{i}', 0.016, 0.014, 0.08, M[mm], ENV, (BX + 0.55 + 0.11 * i, BY + 0.22, BZ + 0.035 + h + 0.04), verts=24)
# candles with flames + flickering point lights
candle_lights = []
for i, (dx, dy, h) in enumerate([(-0.15, -0.15, 0.20), (-0.05, -0.2, 0.14), (0.02, -0.1, 0.24)]):
    cx, cy = BX + dx, BY + dy
    cyl(f'SET_candle{i}', 0.025, 0.023, h, M['wax'], ENV, (cx, cy, BZ + 0.035 + h / 2), verts=24)
    fz = BZ + 0.035 + h + 0.03
    sphere(f'SET_flame{i}', 0.012, (1, 1, 2.2), M['flame'], ENV, (cx, cy, fz), seg=16, ring=8)
    ld = bpy.data.lights.new(f'LGT_candle{i}', 'POINT'); ld.energy = 6; ld.color = (1.0, 0.55, 0.22); ld.shadow_soft_size = 0.02
    lo = bpy.data.objects.new(f'LGT_candle{i}', ld); lo.location = (cx, cy, fz + 0.01); link(lo)
    candle_lights.append(ld)
box('SET_candle_plate', (0.32, 0.22, 0.012), M['brass'], ENV, (BX - 0.07, BY - 0.15, BZ + 0.04), bevel=0.004)
# loose gears on the bench
for i, (gx, gy, n, r) in enumerate([(0.3, -0.15, 12, 0.06), (0.42, -0.05, 9, 0.04), (0.6, -0.18, 16, 0.08)]):
    gear_mesh(f'SET_loosegear{i}', n, r, 0.012, 0.012, M['brass'], ENV, (BX + gx, BY + gy, BZ + 0.042))
# pinned blueprints on the back wall
for i, (k, x, z, w, h, rz) in enumerate([('gears', 0.15, 1.85, 0.55, 0.75, 3), ('armillary', 0.85, 1.75, 0.5, 0.68, -4), ('stars', -1.85, 1.65, 0.5, 0.5, 2)]):
    o = box(f'SET_sheet_{k}', (w, 0.004, h), M['sheet_' + k], ENV, (x, BACK_Y - 0.005, z), rot=(0, R(rz), 0), bevel=0)
    # uv: project box faces simply (front face gets full image)
    me = o.data
    uv = me.uv_layers.new()
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (co.x / w + 0.5, co.z / h + 0.5)
    for dx, dz in ((-w / 2 + 0.03, h / 2 - 0.03), (w / 2 - 0.03, h / 2 - 0.03)):
        sphere('SET_pin', 0.01, mat=M['brass'], parent=ENV, loc=(x + dx, BACK_Y - 0.012, z + dz), seg=12, ring=6)
# shelves (right side of back wall)
for i, z in enumerate((1.05, 1.5, 2.3)):
    box(f'SET_shelf{i}', (1.1, 0.3, 0.04), M['wood'], ENV, (1.7, BACK_Y - 0.15, z), bevel=0.006)
    for j in range(5):
        kind = (i * 5 + j) % 3
        sx = 1.25 + j * 0.2
        if kind == 0:
            cyl(f'SET_jar{i}{j}', 0.05, 0.05, 0.14, M['glass_amber' if j % 2 else 'glass_green'], ENV, (sx, BACK_Y - 0.15, z + 0.09), verts=24)
        elif kind == 1:
            box(f'SET_sbook{i}{j}', (0.05, 0.18, 0.22), M[('book_r', 'book_b', 'book_g')[j % 3]], ENV, (sx, BACK_Y - 0.15, z + 0.13), bevel=0.005)
        else:
            sphere(f'SET_orb{i}{j}', 0.06, mat=M['copper'], parent=ENV, loc=(sx, BACK_Y - 0.15, z + 0.08), seg=24, ring=12)
# big wall gear (theme silhouette) on the left wall
g = gear_mesh('SET_wallgear', 28, 0.6, 0.06, 0.06, M['iron'], ENV, (-2.36, 0.4, 2.0))
g.rotation_euler = (0, R(90), 0)
# hanging lantern above the bench (gently swinging)
LP = empty('LANTERN_pivot', (-0.95, 1.55, 3.3), parent=ENV)
for k in range(8):
    torus(f'LAN_chain{k}', 0.025, 0.006, M['iron'], LP, (0, 0, -0.06 * k - 0.03), rot=(0, 0, R(90 * (k % 2))), seg=24, mseg=8).rotation_euler = (R(90), 0, R(90 * (k % 2)))
cage = cyl('LAN_cage', 0.11, 0.09, 0.26, M['iron'], LP, (0, 0, -0.7), verts=8)
w = cage.modifiers.new('wire', 'WIREFRAME'); w.thickness = 0.012
cyl('LAN_cap', 0.13, 0.04, 0.08, M['iron'], LP, (0, 0, -0.55), verts=8)
cyl('LAN_base', 0.12, 0.12, 0.03, M['iron'], LP, (0, 0, -0.84), verts=8)
sphere('LAN_flame', 0.025, (1, 1, 2.0), M['flame'], LP, (0, 0, -0.74), seg=16, ring=8)
ld = bpy.data.lights.new('LGT_lantern', 'POINT'); ld.energy = 70; ld.color = (1.0, 0.48, 0.18); ld.shadow_soft_size = 0.06
lan = bpy.data.objects.new('LGT_lantern', ld); lan.location = (0, 0, -0.72); link(lan, LP)
K(LP, 'rotation_euler', 1, (R(2.5), 0, 0)); K(LP, 'rotation_euler', 96, (R(-2.5), 0, 0)); K(LP, 'rotation_euler', 192, (R(2.5), 0, 0))
# foreground props for depth & parallax
box('SET_post', (0.24, 0.24, 3.6), M['wood_dark'], ENV, (1.35, -2.7, 1.8), bevel=0.02)
barrel = cyl('SET_barrel', 0.27, 0.27, 0.72, M['wood'], ENV, (1.55, -1.4, 0.36), verts=32)
for z in (0.12, 0.6):
    torus('SET_barrel_band', 0.275, 0.012, M['iron'], ENV, (1.55, -1.4, z))
box('SET_crate', (0.55, 0.5, 0.5), M['wood'], ENV, (-1.75, -0.4, 0.25), rot=(0, 0, R(15)), bevel=0.015)
box('SET_crate2', (0.4, 0.4, 0.35), M['wood_dark'], ENV, (-1.7, -0.45, 0.68), rot=(0, 0, R(-8)), bevel=0.015)
torus('SET_rope', 0.16, 0.035, M['rope'], ENV, (-1.2, -1.0, 0.035))
torus('SET_rope2', 0.13, 0.035, M['rope'], ENV, (-1.2, -1.0, 0.1))

# ---------------------------------------------------------------- the machine
MCH = empty('MCH_root', (0.62, -0.45, 0), (0, 0, R(-17)))
box('MCH_plinth', (0.86, 0.66, 0.14), M['bronze'], MCH, (0, 0, 0.11), bevel=0.02)
for sx in (-0.38, 0.38):
    for sy in (-0.28, 0.28):
        sphere('MCH_foot', 0.055, mat=M['bronze'], parent=MCH, loc=(sx, sy, 0.05), seg=24, ring=12)
box('MCH_housing', (0.72, 0.52, 0.5), M['bronze'], MCH, (0, 0, 0.43), bevel=0.015)
box('MCH_plate', (0.63, 0.02, 0.42), M['iron'], MCH, (0, -0.262, 0.43), bevel=0.004)
for nm, sz, lc in [('t', (0.69, 0.035, 0.03), (0, -0.275, 0.655)), ('b', (0.69, 0.035, 0.03), (0, -0.275, 0.205)),
                   ('l', (0.03, 0.035, 0.45), (-0.33, -0.275, 0.43)), ('r', (0.03, 0.035, 0.45), (0.33, -0.275, 0.43))]:
    box('MCH_bezel_' + nm, sz, M['brass'], MCH, lc, bevel=0.006)
for sx in (-0.36, 0.36):
    for sy in (-0.26, 0.26):
        cyl('MCH_column', 0.03, 0.03, 0.56, M['brass'], MCH, (sx, sy, 0.46), verts=24)
        sphere('MCH_finial', 0.038, mat=M['brass'], parent=MCH, loc=(sx, sy, 0.76), seg=24, ring=12)
# rivets along the bezel
for i in range(9):
    x = -0.3 + i * 0.075
    for z in (0.655, 0.205):
        sphere('MCH_rivet', 0.008, mat=M['brass'], parent=MCH, loc=(x, -0.295, z), seg=12, ring=6)
# indicator lamps
lamp_objs = []
for i in range(3):
    x = -0.1 + i * 0.1
    cyl('MCH_lampbase', 0.025, 0.025, 0.02, M['brass'], MCH, (x, -0.2, 0.69), verts=24)
    lamp_objs.append(sphere(f'MCH_lamp{i}', 0.022, mat=M['lamp'][i], parent=MCH, loc=(x, -0.2, 0.71), seg=24, ring=12))
# gear train (axis along -y)
gear_specs = [(24, 0.15, (-0.12, 0.43)), (14, 0.09, None), (10, 0.06, None)]
DEPTH = 0.018
pitch = [r - DEPTH / 2 for n, r, _ in gear_specs]
c1 = Vector(gear_specs[0][2])
phi12 = R(-20); c2 = c1 + (pitch[0] + pitch[1]) * Vector((cos(phi12), sin(phi12)))
phi23 = R(45); c3 = c2 + (pitch[1] + pitch[2]) * Vector((cos(phi23), sin(phi23)))
centers = [c1, c2, c3]
steps = [2 * pi / n for n, _, _ in gear_specs]
rot0 = [phi12 - 0.3 * steps[0]]
rot0.append(phi12 + pi - 0.8 * steps[1])
u = (phi23 - rot0[1]) / steps[1]
delta = ((u % 1.0) - 0.3) * steps[1]
rot0.append(phi23 + pi - 0.8 * steps[2] - delta * gear_specs[1][0] / gear_specs[2][0])
gears = []
for i, ((n, r, _), c) in enumerate(zip(gear_specs, centers)):
    piv = empty(f'MCH_gearpivot{i}', (c.x, -0.29 - 0.004 * i, c.y), (R(90), 0, 0), MCH)
    gobj = gear_mesh(f'MCH_gear{i}', n, r, DEPTH, 0.022, M['brass'] if i != 1 else M['copper'], piv)
    cyl(f'MCH_hub{i}', 0.022, 0.022, 0.04, M['bronze'], gobj, (0, 0, 0), verts=24)
    torus(f'MCH_gearring{i}', r * 0.55, 0.006, M['bronze'], gobj, (0, 0, -0.012), seg=48, mseg=8)
    for k in range(6):  # spokes
        a = k * pi / 3
        box(f'MCH_spoke{i}{k}', (r * 0.55, 0.012, 0.008), M['bronze'], gobj, (cos(a) * r * 0.3, sin(a) * r * 0.3, -0.012), rot=(0, 0, a), bevel=0.002)
    gobj.rotation_euler = (0, 0, rot0[i])
    gears.append(gobj)
# crown + shaft + armillary sphere
cyl('MCH_crown1', 0.32, 0.28, 0.07, M['bronze'], MCH, (0, 0, 0.715), verts=8, bevel=0.01, smooth=False)
cyl('MCH_crown2', 0.22, 0.16, 0.12, M['bronze'], MCH, (0, 0, 0.81), verts=8, bevel=0.01, smooth=False)
cyl('MCH_shaft', 0.03, 0.03, 0.55, M['brass'], MCH, (0, 0, 1.12), verts=24)
collar = cyl('MCH_collar', 0.06, 0.06, 0.05, M['copper'], MCH, (0, 0, 0.92), verts=12, bevel=0.005, smooth=False)
ARM = empty('MCH_armillary', (0, 0, 1.5), parent=MCH)
torus('MCH_ring_outer', 0.30, 0.014, M['bronze'], ARM, rot=(R(90), 0, 0))
torus('MCH_ring_base', 0.30, 0.012, M['brass'], ARM, rot=(0, 0, 0))
# tick marks on the outer ring
for k in range(24):
    a = 2 * pi * k / 24
    box('MCH_tick', (0.012, 0.03, 0.006), M['brass'], ARM, (0.30 * cos(a), 0, 0.30 * sin(a)), rot=(0, -a, 0), bevel=0)
ring_pivots = []
for i, (rad, tilt) in enumerate([(0.25, 23.5), (0.20, -40), (0.155, 65)]):
    rp = empty(f'MCH_ringpivot{i}', parent=ARM, rot=(R(tilt), 0, 0))
    spin = empty(f'MCH_ringspin{i}', parent=rp)
    torus(f'MCH_ring{i}', rad, 0.009, M['brass'] if i % 2 == 0 else M['copper'], spin)
    sphere(f'MCH_ringbead{i}', 0.022, mat=M['brass'], parent=spin, loc=(rad, 0, 0), seg=16, ring=8)
    ring_pivots.append(spin)
core = sphere('MCH_core', 0.075, mat=M['core'], parent=ARM, seg=48, ring=24)
cld = bpy.data.lights.new('LGT_core', 'POINT'); cld.energy = 0.0; cld.color = (1.0, 0.62, 0.25); cld.shadow_soft_size = 0.075
core_light = bpy.data.objects.new('LGT_core', cld); link(core_light, core)
# pendulum on the +x side face
PEN = empty('MCH_pendulum', (0.39, 0, 0.63), parent=MCH)
cyl('MCH_pend_rod', 0.008, 0.008, 0.36, M['brass'], PEN, (0, 0, -0.18), verts=12)
cyl('MCH_pend_bob', 0.06, 0.06, 0.018, M['brass'], PEN, (0, 0, -0.38), rot=(0, R(90), 0), verts=32, bevel=0.004)
box('MCH_pend_bracket', (0.04, 0.08, 0.05), M['bronze'], MCH, (0.375, 0, 0.64), bevel=0.005)

# ---------------------------------------------------------------- the inventor
CH = empty('CHR_root', (-0.5, 0.6, 0), (0, 0, R(46)))
robe = cyl('CHR_robe', 0.36, 0.23, 0.95, M['robe'], CH, (0, 0, 0.475), verts=48)
sd = robe.modifiers.new('sub', 'SUBSURF'); sd.levels = sd.render_levels = 1
cyl('CHR_hem', 0.365, 0.365, 0.04, M['robe_trim'], CH, (0, 0, 0.03), verts=48)
# apron (front shell)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.375, radius2=0.25, depth=0.62)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > -0.08], context='VERTS')
apron = mesh_obj('CHR_apron', bm, M['leather'], CH, (0, 0, 0.44))
m_ = apron.modifiers.new('solid', 'SOLIDIFY'); m_.thickness = 0.012; m_.offset = 1
torus('CHR_belt', 0.255, 0.022, M['leather'], CH, (0, 0, 0.76), rot=(0, 0, 0))
box('CHR_buckle', (0.07, 0.02, 0.06), M['brass'], CH, (0, -0.27, 0.76), bevel=0.006)
for sx in (-0.1, 0.1):
    sphere('CHR_shoe', 0.075, (1, 1.6, 0.6), M['leather'], CH, (sx, -0.3, 0.04), seg=32, ring=16)
WAIST = empty('CHR_waist', (0, 0, 0.75), parent=CH)
sphere('CHR_chest', 0.27, (1.0, 0.82, 0.95), M['robe'], WAIST, (0, 0, 0.22))
torus('CHR_collar', 0.12, 0.04, M['leather'], WAIST, (0, -0.02, 0.43))
NECK = empty('CHR_neck', (0, 0, 0.35), parent=WAIST)
HEAD = sphere('CHR_head', 0.27, (1.0, 0.95, 1.08), M['skin'], NECK, (0, 0, 0.25))
for sx in (-1, 1):
    sphere('CHR_ear', 0.07, (0.45, 0.8, 1.1), M['skin_rosy'], NECK, (0.265 * sx, 0.0, 0.25))
nose = sphere('CHR_nose', 0.072, (1.0, 0.95, 1.05), M['skin_rosy'], NECK, (0, -0.28, 0.215))
cheeks = [sphere(f'CHR_cheek{i}', 0.06, (1.0, 0.75, 0.75), M['skin_rosy'], NECK, (0.135 * sx, -0.2, 0.17)) for i, sx in enumerate((-1, 1))]
eyes, lids_up, lids_lo, brows = [], [], [], []
for i, sx in enumerate((-1, 1)):
    ec = (0.098 * sx, -0.205, 0.305)
    piv = empty(f'CHR_eye{i}', ec, parent=NECK)
    sphere(f'CHR_sclera{i}', 0.06, mat=M['eye_white'], parent=piv)
    sphere(f'CHR_iris{i}', 0.034, (1, 0.35, 1), M['iris'], piv, (0, -0.05, 0))
    sphere(f'CHR_pupil{i}', 0.018, (1, 0.3, 1), M['pupil'], piv, (0, -0.058, 0))
    eyes.append(piv)
    lu = empty(f'CHR_lidUp{i}', ec, parent=NECK); hemisphere(f'CHR_lidUpMesh{i}', 0.064, True, M['skin'], lu)
    ll = empty(f'CHR_lidLo{i}', ec, parent=NECK); hemisphere(f'CHR_lidLoMesh{i}', 0.0635, False, M['skin'], ll)
    lids_up.append(lu); lids_lo.append(ll)
    bp = empty(f'CHR_brow{i}', (0.105 * sx, -0.235, 0.40), parent=NECK)
    clump(f'CHR_browMesh{i}', [((sx * dx, 0, dz), r, (1.3, 0.8, 0.8)) for dx, dz, r in ((-0.045, -0.005, 0.026), (0.0, 0.004, 0.03), (0.048, 0.0, 0.027))], M['hair'], bp)
    brows.append(bp)
# mustache halves (pivot near the nose so they can lift into a smile)
mustache = []
for i, sx in enumerate((-1, 1)):
    mp = empty(f'CHR_mst{i}', (0.03 * sx, -0.275, 0.16), parent=NECK)
    clump(f'CHR_mstMesh{i}', [((sx * dx, dy, dz), r, (1.2, 0.8, 0.8)) for dx, dy, dz, r in ((0.03, 0.0, 0.0, 0.04), (0.075, 0.02, -0.02, 0.036), (0.115, 0.04, -0.045, 0.028))], M['hair'], mp)
    mustache.append(mp)
mouth = sphere('CHR_mouth', 0.05, (1.0, 0.45, 0.35), M['mouth'], NECK, (0, -0.258, 0.078))
# beard: a few big flowing locks, fused and relaxed (sits below the mouth)
beard_blobs = [((0, -0.17, 0.0), 0.12, (1.25, 0.8, 0.75)),
               ((-0.1, -0.15, -0.03), 0.09, (1, 0.8, 1.0)), ((0.1, -0.15, -0.03), 0.09, (1, 0.8, 1.0)),
               ((-0.05, -0.18, -0.11), 0.075, (1, 0.8, 1.2)), ((0.05, -0.18, -0.11), 0.075, (1, 0.8, 1.2)),
               ((0, -0.19, -0.19), 0.055, (1, 0.8, 1.4)), ((-0.17, -0.07, 0.03), 0.07, (0.8, 1, 1.1)), ((0.17, -0.07, 0.03), 0.07, (0.8, 1, 1.1)),
               ((-0.2, -0.04, 0.12), 0.06, (0.8, 1, 1.2)), ((0.2, -0.04, 0.12), 0.06, (0.8, 1, 1.2))]
clump('CHR_beard', beard_blobs, M['hair'], NECK, (0, 0, -0.03), voxel=0.008, smooth=10)
# smile line: lower half of a thin torus in the face plane
smile_obj = torus('CHR_smile', 0.052, 0.011, M['mouth'], NECK, (0, -0.262, 0.1), rot=(R(90), 0, 0), seg=48, mseg=10)
_bm = bmesh.new(); _bm.from_mesh(smile_obj.data)
bmesh.ops.delete(_bm, geom=[v for v in _bm.verts if v.co.y > 0.004], context='VERTS'); _bm.to_mesh(smile_obj.data); _bm.free()
for sx in (-1, 1):  # side hair tufts
    clump('CHR_sidehair', [((sx * (0.24 + 0.02 * k), 0.05 + 0.04 * k, 0.33 - 0.06 * k), 0.06 - 0.008 * k, (0.8, 1, 1)) for k in range(4)], M['hair'], NECK)
clump('CHR_backhair', [((0.2 * sin(a), 0.2 * cos(a) + 0.05, 0.24 + 0.03 * sin(3 * a)), 0.07, (1, 1, 1)) for a in [x * 0.35 - 1.3 for x in range(9)]], M['hair'], NECK)
# brass goggles pushed up on the forehead
GOG = empty('CHR_goggles', (0, -0.175, 0.49), (R(62), 0, 0), NECK)
for sx in (-1, 1):
    torus('CHR_gogRing', 0.05, 0.012, M['brass'], GOG, (0.068 * sx, 0, 0), seg=48, mseg=12)
    cyl('CHR_gogLens', 0.045, 0.045, 0.006, M['lens'], GOG, (0.068 * sx, 0, 0), verts=32)
cyl('CHR_gogBridge', 0.008, 0.008, 0.04, M['brass'], GOG, (0, 0, 0), rot=(0, R(90), 0), verts=12)
torus('CHR_gogStrap', 0.212, 0.013, M['leather'], NECK, (0, 0.0, 0.44), rot=(R(-12), 0, 0))
# arms: shoulder -> elbow -> hand
shoulders, elbows, hands = [], [], []
for i, sx in enumerate((-1, 1)):
    sh = empty(f'CHR_shoulder{i}', (0.25 * sx, 0, 0.3), parent=WAIST)
    sphere(f'CHR_shoulderball{i}', 0.085, mat=M['robe'], parent=sh)
    cyl(f'CHR_upperarm{i}', 0.075, 0.07, 0.3, M['robe'], sh, (0, 0, -0.15), verts=32)
    el = empty(f'CHR_elbow{i}', (0, 0, -0.3), parent=sh)
    sphere(f'CHR_elbowball{i}', 0.07, mat=M['robe'], parent=el)
    cyl(f'CHR_sleeve{i}', 0.07, 0.1, 0.27, M['robe'], el, (0, 0, -0.14), verts=32)
    hd = empty(f'CHR_hand{i}', (0, 0, -0.31), parent=el)
    sphere(f'CHR_palm{i}', 0.05, (1.0, 0.65, 1.1), M['skin'], hd, (0, 0, -0.03))
    for k in range(4):
        sphere(f'CHR_finger{i}{k}', 0.016, (1, 1, 2.6), M['skin'], hd, (-0.033 + 0.022 * k, -0.004, -0.09 + abs(k - 1.5) * 0.008))
    sphere(f'CHR_thumb{i}', 0.018, (1, 1, 2.0), M['skin'], hd, (0.05 * -sx, -0.03, -0.035), rot=(0, R(35 * sx), 0))
    shoulders.append(sh); elbows.append(el); hands.append(hd)

# ---------------------------------------------------------------- lighting
world = bpy.data.worlds.new('world'); scn.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.008, 0.012, 0.022, 1); bg.inputs['Strength'].default_value = 1.0
# moonlight through the window
sd_ = bpy.data.lights.new('LGT_moon', 'SUN'); sd_.energy = 9.0; sd_.color = (0.5, 0.68, 1.0); sd_.angle = R(0.8)
sun = bpy.data.objects.new('LGT_moon', sd_); link(sun)
d = Vector((0.35, -1.0, -0.7)).normalized()
sun.rotation_euler = (-d).to_track_quat('Z', 'Y').to_euler()
# soft cool fill from camera-left
fd = bpy.data.lights.new('LGT_fill', 'AREA'); fd.energy = 22; fd.color = (0.6, 0.72, 1.0); fd.size = 1.5
fill = bpy.data.objects.new('LGT_fill', fd); fill.location = (-1.6, -2.2, 2.2); link(fill)
fill.rotation_euler = (Vector((-0.5, 0.6, 1.25)) - fill.location).to_track_quat('-Z', 'Y').to_euler()
# warm rim from behind-right
rd = bpy.data.lights.new('LGT_rim', 'SPOT'); rd.energy = 160; rd.color = (1.0, 0.6, 0.3); rd.spot_size = R(40); rd.shadow_soft_size = 0.2
rim = bpy.data.objects.new('LGT_rim', rd); rim.location = (0.9, 2.2, 2.6); link(rim)
rim.rotation_euler = (Vector((-0.5, 0.6, 1.2)) - rim.location).to_track_quat('-Z', 'Y').to_euler()
# atmosphere
vm = bpy.data.materials.new('atmos')
try:
    vm.use_nodes = True
except Exception:
    pass
vn = vm.node_tree.nodes
vn.remove(vn['Principled BSDF'])
pv = vn.new('ShaderNodeVolumePrincipled')
pv.inputs['Density'].default_value = 0.06
pv.inputs['Anisotropy'].default_value = 0.45
pv.inputs['Color'].default_value = (0.85, 0.9, 1.0, 1)
vm.node_tree.links.new(pv.outputs[0], vn['Material Output'].inputs['Volume'])
atm = box('ENV_atmosphere', (5.4, 7.0, 3.6), vm, None, (0.2, -0.85, 1.8), bevel=0)
atm.visible_shadow = False
# dust motes drifting in the moonbeam
bm = bmesh.new()
for k in range(140):
    p = Vector((random.uniform(-1.5, -0.3), random.uniform(0.2, 2.4), random.uniform(0.6, 2.6)))
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(0.0015, 0.003), matrix=Matrix.Translation(p))
dustm = simple('dust', (1, 1, 1), 0.5, **{'Emission Color': (0.8, 0.85, 1.0, 1), 'Emission Strength': 0.0})
dust = mesh_obj('ENV_dust', bm, dustm, None)
K(dust, 'location', 1, (0, 0, 0)); K(dust, 'location', F_END, (0.06, -0.04, -0.07))

# ---------------------------------------------------------------- animation: machine
F_CLICK, F_RAMP0, F_RAMP1 = 40, 50, 112
def speed(f):  # 0..1 ease-in ramp
    if f < F_RAMP0:
        return 0.0
    t = min(1.0, (f - F_RAMP0) / (F_RAMP1 - F_RAMP0))
    return t * t * (3 - 2 * t)
set_interp('LINEAR')
W1 = R(150) / FPS  # rad/frame of the big gear at full speed
ratios = [1.0, -gear_specs[0][0] / gear_specs[1][0], gear_specs[0][0] / gear_specs[2][0]]
theta = 0.0
ring_speeds = [R(70) / FPS, R(-105) / FPS, R(150) / FPS]
ring_theta = [0.0, 0.0, 0.0]
for f in range(1, F_END + 1):
    jolt = R(6) if F_CLICK <= f < F_RAMP0 else 0.0  # the first 'click'
    theta += W1 * speed(f)
    if f % 2 == 1 or f == F_END:
        for gi, gob in enumerate(gears):
            K(gob, 'rotation_euler', f, (0, 0, rot0[gi] + (theta + jolt) * ratios[gi]))
        K(collar, 'rotation_euler', f, (0, 0, theta * 0.5))
    rs = speed(f - 20)
    for ri in range(3):
        ring_theta[ri] += ring_speeds[ri] * rs
        if f % 2 == 1 or f == F_END:
            K(ring_pivots[ri], 'rotation_euler', f, (0, 0, ring_theta[ri]))
    amp = R(16) * speed(f - 10)
    if f % 2 == 1 or f == F_END:
        K(PEN, 'rotation_euler', f, (amp * sin(2 * pi * (f - 60) / 30.0) if f > 60 else 0.0, 0, 0))
set_interp('BEZIER')
core_em = M['core'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
for f, e, lw, z in [(1, 0.4, 0, 1.5), (39, 0.4, 0, 1.5), (42, 3.0, 25, 1.5), (47, 1.2, 10, 1.5), (58, 4.0, 70, 1.5),
                    (90, 14.0, 260, 1.52), (130, 22.0, 420, 1.6), (150, 18.0, 360, 1.6), (170, 24.0, 440, 1.6), (192, 20.0, 400, 1.6)]:
    KS(core_em, f, e)
    K(cld, 'energy', f, lw)
    K(ARM, 'location', f, (0, 0, z))
for i, f0 in enumerate((F_CLICK, F_CLICK + 8, F_CLICK + 16)):
    sock = M['lamp'][i].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    KS(sock, 1, 0.0); KS(sock, f0, 0.0); KS(sock, f0 + 2, 18.0); KS(sock, f0 + 6, 8.0); KS(sock, F_END, 9.0)
for i, ld in enumerate(candle_lights):  # flicker
    for f in range(1, F_END + 1, 6):
        K(ld, 'energy', f, 6 * random.uniform(0.75, 1.15))

# ---------------------------------------------------------------- animation: the inventor
# Each pose: waist lean (x), neck (pitch, yaw), eyes (pitch, yaw), lid_up, lid_lo, brows (z offset, roll),
# mouth scale, mustache roll, shoulders [(x,y,z)], elbows x, cheeks lift
def pose(f, lean=0, npitch=0, nyaw=0, ntilt=0, epitch=0, eyaw=0, lid=-25, lidlo=22, brow=0.0, broll=0.0,
         mouth=(1, 1, 1), smile=0.001, mst=0.0, sh=((-20, 0, 8), (-15, 0, -8)), el=(-35, -30), cheek=0.0, chest=1.0):
    K(WAIST, 'rotation_euler', f, (R(lean), 0, 0))
    K(NECK, 'rotation_euler', f, (R(npitch), R(ntilt), R(nyaw)))
    for e in eyes:
        K(e, 'rotation_euler', f, (R(epitch), 0, R(eyaw)))
    for lu in lids_up:
        K(lu, 'rotation_euler', f, (R(lid + epitch * 0.5), 0, R(eyaw * 0.3)))
    for ll in lids_lo:
        K(ll, 'rotation_euler', f, (R(lidlo), 0, 0))
    for i, b in enumerate(brows):
        sx = (-1, 1)[i]
        K(b, 'location', f, (0.105 * sx, -0.235, 0.40 + brow))
        K(b, 'rotation_euler', f, (0, R(broll * sx), 0))
    K(mouth_obj, 'scale', f, mouth)
    K(smile_obj, 'scale', f, (smile, smile, smile))
    for i, mp in enumerate(mustache):
        K(mp, 'rotation_euler', f, (0, R(mst * (-1, 1)[i]), 0))
    for i, c in enumerate(cheeks):
        sx = (-1, 1)[i]
        K(c, 'location', f, (0.135 * sx, -0.2, 0.17 + cheek))
    for i, s in enumerate(shoulders):
        K(s, 'rotation_euler', f, tuple(R(a) for a in sh[i]))
        K(elbows[i], 'rotation_euler', f, (R(el[i]), 0, 0))
    K(WAIST, 'scale', f, (1, 1, chest))

mouth_obj = mouth
# hand-on-beard thinking pose (right arm = index 0, character's right side is local -x)
THINK_SH = ((-62, 0, 28), (-12, 0, -8))
THINK_EL = (-118, -30)
pose(1, lean=6, npitch=14, nyaw=-4, ntilt=4, epitch=10, eyaw=4, lid=-8, lidlo=14, brow=-0.012, broll=-12, mst=0, sh=THINK_SH, el=THINK_EL)
pose(18, lean=7, npitch=15, nyaw=-3, ntilt=5, epitch=10, eyaw=2, lid=-6, lidlo=14, brow=-0.014, broll=-13, sh=THINK_SH, el=THINK_EL, chest=1.01)
pose(30, lean=7, npitch=15, nyaw=-3, ntilt=5, epitch=10, eyaw=2, lid=-6, lidlo=14, brow=-0.014, broll=-13, sh=THINK_SH, el=THINK_EL)
pose(40, lean=7, npitch=15, nyaw=-2, ntilt=5, epitch=10, eyaw=0, lid=-6, lidlo=14, brow=-0.014, broll=-13, sh=THINK_SH, el=THINK_EL, chest=1.0)
# the click: eyes dart to the lamps, freeze (anticipation)
pose(44, lean=7, npitch=13, nyaw=-2, ntilt=4, epitch=2, eyaw=-6, lid=-18, lidlo=16, brow=0.0, broll=-4, sh=THINK_SH, el=THINK_EL)
pose(50, lean=8, npitch=12, nyaw=-2, ntilt=3, epitch=0, eyaw=-6, lid=-20, lidlo=17, brow=0.004, broll=0, sh=THINK_SH, el=THINK_EL)
# startle: pull back, eyes wide, brows shoot up, hands come up
pose(57, lean=-9, npitch=-6, nyaw=0, ntilt=-2, epitch=-6, eyaw=0, lid=-52, lidlo=32, brow=0.045, broll=12, mouth=(0.85, 1, 2.4),
     sh=((-55, 0, 25), (-55, 0, -25)), el=(-80, -80), chest=1.03)
pose(63, lean=-7, npitch=-4, nyaw=0, ntilt=-1, epitch=-5, eyaw=0, lid=-48, lidlo=30, brow=0.038, broll=10, mouth=(0.8, 1, 2.2),
     sh=((-50, 0, 22), (-50, 0, -22)), el=(-75, -75), chest=1.02)
pose(84, lean=-6, npitch=-6, nyaw=0, ntilt=-2, epitch=-6, eyaw=0, lid=-46, lidlo=30, brow=0.036, broll=9, mouth=(0.8, 1, 2.0),
     sh=((-46, 0, 20), (-46, 0, -20)), el=(-70, -72), chest=1.02)
pose(96, lean=-5, npitch=-8, nyaw=0, ntilt=-2, epitch=-8, eyaw=0, lid=-45, lidlo=30, brow=0.034, broll=8, mouth=(0.8, 1, 1.8),
     sh=((-44, 0, 19), (-44, 0, -19)), el=(-68, -70))
# wonder: the core rises - eyes and head follow it up, the grin arrives
pose(122, lean=-2, npitch=-14, nyaw=0, ntilt=-5, epitch=-10, eyaw=0, lid=-40, lidlo=24, brow=0.03, broll=4, mouth=(0.6, 1, 0.5), smile=0.8, mst=-10,
     sh=((-38, 0, 30), (-38, 0, -30)), el=(-95, -95), cheek=0.01)
pose(140, lean=1, npitch=-15, nyaw=0, ntilt=-6, epitch=-10, eyaw=0, lid=-38, lidlo=20, brow=0.026, broll=2, mouth=(0.01, 1, 0.01), smile=1.15, mst=-16,
     sh=((-36, 0, 33), (-36, 0, -33)), el=(-100, -100), cheek=0.018, chest=1.02)
pose(167, lean=2, npitch=-15, nyaw=0, ntilt=-7, epitch=-9, eyaw=0, lid=-36, lidlo=19, brow=0.024, broll=2, mouth=(0.01, 1, 0.01), smile=1.2, mst=-17,
     sh=((-36, 0, 34), (-36, 0, -34)), el=(-102, -102), cheek=0.02)
pose(192, lean=3, npitch=-14, nyaw=0, ntilt=-8, epitch=-9, eyaw=0, lid=-36, lidlo=19, brow=0.024, broll=2, mouth=(0.01, 1, 0.01), smile=1.25, mst=-18,
     sh=((-35, 0, 35), (-35, 0, -35)), el=(-104, -104), cheek=0.02, chest=1.02)

def blink(f, open_lid, epitch):
    for lu in lids_up:
        for ff, v in ((f - 3, open_lid), (f, 72), (f + 3, open_lid)):
            lu.rotation_euler = (R(v + epitch * 0.5), 0, 0); lu.keyframe_insert('rotation_euler', frame=ff)
blink(26, -6, 10); blink(90, -46, -7); blink(160, -36, -9)

# ---------------------------------------------------------------- camera
cd = bpy.data.cameras.new('CAM_main'); cam = bpy.data.objects.new('CAM_main', cd); link(cam)
scn.camera = cam
cd.sensor_fit = 'AUTO'; cd.sensor_width = 36
aim = empty('CAM_aim')
focus = empty('CAM_focus')
tc = cam.constraints.new('TRACK_TO'); tc.target = aim; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
cd.dof.use_dof = True; cd.dof.focus_object = focus; cd.dof.aperture_fstop = 2.2
HEADPOS = Vector((-0.5, 0.6, 1.36))
K(cam, 'location', 1, (0.30, -4.4, 1.45)); K(cam, 'location', 60, (0.22, -3.6, 1.43)); K(cam, 'location', F_END, (0.02, -1.75, 1.42))
K(aim, 'location', 1, (0.1, 0.1, 1.1)); K(aim, 'location', 60, (0.0, 0.2, 1.15)); K(aim, 'location', F_END, (HEADPOS.x + 0.05, HEADPOS.y, HEADPOS.z - 0.16))
K(cd, 'lens', 1, 30); K(cd, 'lens', 60, 32); K(cd, 'lens', F_END, 40)
# rack focus: machine gears -> the inventor's face as he reacts
GEAR_W = MCH.matrix_world @ Vector((0, -0.29, 0.43))
K(focus, 'location', 1, tuple(GEAR_W)); K(focus, 'location', 46, tuple(GEAR_W)); K(focus, 'location', 58, tuple(HEADPOS)); K(focus, 'location', F_END, tuple(HEADPOS))

# ---------------------------------------------------------------- render settings
r = scn.render
r.engine = 'CYCLES'
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, 100
r.use_motion_blur = True; r.motion_blur_shutter = 0.5
c = scn.cycles
c.device = 'CPU'; c.samples = 96; c.adaptive_threshold = 0.02; c.use_denoising = True
c.max_bounces = 6; c.diffuse_bounces = 2; c.glossy_bounces = 3; c.transmission_bounces = 4; c.volume_bounces = 0; c.transparent_max_bounces = 4
c.caustics_reflective = False; c.caustics_refractive = False; c.blur_glossy = 1.0
c.volume_step_rate = 4.0
try:
    scn.view_settings.view_transform = 'AgX'
    scn.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e:
    print('color mgmt:', e)
scn.view_settings.exposure = 0.3
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('SAVED', OUT, len(bpy.data.objects), 'objects')
