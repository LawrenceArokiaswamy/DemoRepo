# Film 34 "Her First Home": shared Blender helpers (materials, bevelled blocks, text, image planes).
import bpy, bmesh, math
from mathutils import Vector

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

_M = {}
def mat(name, hexcol, rough=0.55, sss=0.0, emit=0.0, coat=0.0, metal=0.0, alpha=1.0, trans=0.0):
    if name in _M: return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; c = lin(hexcol)
    b.inputs["Base Color"].default_value = (*c, 1); b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss; b.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.25)
        b.inputs["Subsurface Scale"].default_value = 0.03
    if coat: b.inputs["Coat Weight"].default_value = coat
    if emit: b.inputs["Emission Color"].default_value = (*c, 1); b.inputs["Emission Strength"].default_value = emit
    if alpha < 1: b.inputs["Alpha"].default_value = alpha
    if trans: b.inputs["Transmission Weight"].default_value = trans
    _M[name] = m; return m

def skin_mat(name, hexcol, sick_hex="#a9c08a"):
    """skin with a 'sick' mix factor driven per frame (node 'SICK')"""
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.5
    b.inputs["Subsurface Weight"].default_value = 0.12; b.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.25)
    b.inputs["Subsurface Scale"].default_value = 0.03
    mx = N.new("ShaderNodeMix"); mx.data_type = 'RGBA'; mx.name = "SICK"; mx.inputs["Factor"].default_value = 0.0
    mx.inputs["A"].default_value = (*lin(hexcol), 1); mx.inputs["B"].default_value = (*lin(sick_hex), 1)
    L.new(mx.outputs["Result"], b.inputs["Base Color"]); return m

def img_mat(name, path, rough=0.6, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path); t.extension = 'CLIP'
    L.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit: L.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = emit
    return m

def _link(o, parent):
    bpy.context.scene.collection.objects.link(o)
    if parent is not None: o.parent = parent

def piv(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); o.empty_display_size = 0.1; _link(o, parent)
    o.location = loc; o.rotation_euler = rot; return o

def rbox(name, size, m, parent=None, loc=(0, 0, 0), bev=0.03, rot=(0, 0, 0), seg=3, cuts=0, taper=None):
    """bevelled box; taper=(kx, ky) scales the bottom face (for skirts, lamp shades)"""
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    if cuts: bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co).x) > 0.5], cuts=cuts, use_grid_fill=True)
    for v in bm.verts:
        if taper and v.co.z < 0: v.co.x *= taper[0]; v.co.y *= taper[1]
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); _link(o, parent); o.location = loc; o.rotation_euler = rot
    if m: me.materials.append(m)
    if bev:
        md = o.modifiers.new("bev", 'BEVEL'); md.width = bev; md.segments = seg; md.limit_method = 'ANGLE'
        md.harden_normals = False
    return o

def sphere(name, r, m, parent=None, loc=(0, 0, 0), scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=r)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); _link(o, parent); o.location = loc; o.scale = scale; me.materials.append(m); return o

def cyl(name, r, h, m, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=32):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = len(p.vertices) == 4
    o = bpy.data.objects.new(name, me); _link(o, parent); o.location = loc; o.rotation_euler = rot; me.materials.append(m); return o

def text(name, body, size, m, parent=None, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0), font=None, extrude=0.002, align='CENTER'):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude
    cu.align_x = align; cu.align_y = 'CENTER'
    if font: cu.font = bpy.data.fonts.load(font)
    o = bpy.data.objects.new(name, cu); _link(o, parent); o.location = loc; o.rotation_euler = rot; cu.materials.append(m); return o

def plane(name, w, h, m, parent=None, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    for v in bm.verts: v.co.x *= w; v.co.y *= h
    bm.to_mesh(me); bm.free(); me.uv_layers.new()
    for i, l in enumerate(me.loops):
        co = me.vertices[l.vertex_index].co; me.uv_layers[0].data[i].uv = (co.x / w + 0.5, co.y / h + 0.5)
    o = bpy.data.objects.new(name, me); _link(o, parent); o.location = loc; o.rotation_euler = rot; me.materials.append(m); return o

def area(name, loc, target, size, power, col, size_y=None):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.color = col; l.size = size
    if size_y: l.shape = 'RECTANGLE'; l.size_y = size_y
    o = bpy.data.objects.new(name, l); _link(o, None); o.location = loc; aim(o, target); return o

def point(name, loc, power, col, r=0.1):
    l = bpy.data.lights.new(name, 'POINT'); l.energy = power; l.color = col; l.shadow_soft_size = r
    o = bpy.data.objects.new(name, l); _link(o, None); o.location = loc; return o

def aim(o, target):
    d = Vector(target) - o.location; o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def walk(objs, fn):
    for o in objs:
        fn(o); walk(o.children, fn)

def show(root, on):
    def f(o): o.hide_render = not on
    f(root); walk(root.children, f)

# ---------- tiny math ----------
def clamp01(x): return max(0.0, min(1.0, x))
def smooth(x): u = clamp01(x); return u * u * (3 - 2 * u)
def seg(t, a, b): return clamp01((t - a) / (b - a))
def mix(a, b, k): return a + (b - a) * k
