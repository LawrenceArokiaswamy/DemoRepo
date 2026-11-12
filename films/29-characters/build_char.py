# Turn a Hunyuan3D shape (GLB, untextured) + its front character image into a clean, textured, rigged Blender character.
# Usage: python build_char.py -- <name> <shape.glb> <front.png> <out.blend> [height_m]
# 1) import, orient (face -Y), scale to height, voxel-remesh (manifold, even), decimate
# 2) texture: front faces get the image projected straight on (full detail: eyes, knit); back faces get colours sampled
#    from the image at the same height, with the face region replaced by hair colour (back of the head)
# 3) rig: a simple humanoid armature placed from the body's proportions, bound with automatic (heat) weights
import bpy, bmesh, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
NAME, GLB, IMG, OUT = argv[:4]; HEIGHT = float(argv[4]) if len(argv) > 4 else 1.65
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.object; ob.name = NAME
ob.rotation_mode = 'XYZ'
for o in [o for o in bpy.data.objects if o.type == 'EMPTY']: bpy.data.objects.remove(o)
ob.parent = None; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
def bounds():
    xs = [v.co for v in ob.data.vertices]; mn = Vector((min(v.x for v in xs), min(v.y for v in xs), min(v.z for v in xs))); mx = Vector((max(v.x for v in xs), max(v.y for v in xs), max(v.z for v in xs))); return mn, mx
mn, mx = bounds(); sz = mx - mn; print('raw size', tuple(round(v, 3) for v in sz))
# the tallest axis is up; put it on Z
if sz.y > sz.z * 1.2: ob.rotation_euler = (math.radians(90), 0, 0); bpy.ops.object.transform_apply(rotation=True)
mn, mx = bounds(); sz = mx - mn
s = HEIGHT / sz.z; ob.scale = (s, s, s); bpy.ops.object.transform_apply(scale=True)
mn, mx = bounds(); ob.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z); bpy.ops.object.transform_apply(location=True)
# which way is the face? the nose sticks out: compare the extent of the head slice towards -Y and +Y
mn, mx = bounds(); head = [v.co for v in ob.data.vertices if v.co.z > HEIGHT * .86]
fy = sum(1 for v in head if v.y < 0); print('head verts -y/+y', fy, len(head) - fy)
cy = sum(v.y for v in head) / len(head); front_neg = min(v.y for v in head) < -(max(v.y for v in head))
if not front_neg: ob.rotation_euler = (0, 0, math.pi); bpy.ops.object.transform_apply(rotation=True)
# remesh + decimate
rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = .0055; bpy.ops.object.modifier_apply(modifier='rm')
dc = ob.modifiers.new('dc', 'DECIMATE'); dc.ratio = min(1., 60000 / max(1, len(ob.data.polygons))); bpy.ops.object.modifier_apply(modifier='dc')
sm_ = ob.modifiers.new('sm', 'SMOOTH'); sm_.factor = .6; sm_.iterations = 6; bpy.ops.object.modifier_apply(modifier='sm')
for p in ob.data.polygons: p.use_smooth = True
print('faces', len(ob.data.polygons))
# ---- texture: front projection ----
img = bpy.data.images.load(os.path.abspath(IMG)); img.pack(); W, H = img.size; px = list(img.pixels)
# find the character's silhouette in the image (background is flat light grey) -> map mesh x/z bounds to it
def pix(x, y): i = (y * W + x) * 4; return px[i], px[i + 1], px[i + 2]
bg = pix(5, H - 5); rows = []; cols = []
def isfg(c): return sum(abs(c[k] - bg[k]) for k in range(3)) > .09
for y in range(0, H, 4):
    for x in range(0, W, 4):
        if isfg(pix(x, y)): rows.append(y); cols.append(x)
iy0, iy1, ix0, ix1 = min(rows), max(rows), min(cols), max(cols); print('image bbox', ix0, ix1, iy0, iy1, W, H)
mn, mx = bounds()
def uv_of(co): return ((ix0 + (co.x - mn.x) / (mx.x - mn.x) * (ix1 - ix0)) / W, (iy0 + (co.z - mn.z) / (mx.z - mn.z) * (iy1 - iy0)) / H)
me = ob.data; uvl = me.uv_layers.new(name='front'); bm = bmesh.new(); bm.from_mesh(me); uv = bm.loops.layers.uv.active
for f in bm.faces:
    for l in f.loops: l[uv].uv = uv_of(l.vert.co)
bm.to_mesh(me); bm.free()
# per-vertex "frontness" (how much the surface faces the camera) and a back colour
hair = None
col_attr = me.color_attributes.new('backcol', 'FLOAT_COLOR', 'POINT'); fr = me.attributes.new('frontness', 'FLOAT', 'POINT')
head_z = HEIGHT * .80
# hair colour: sample just above the forehead in the image (top of the head)
samp = []
for yy in range(iy1 - (iy1 - iy0) // 14, iy1 - 2, 2):
    for xx in range((ix0 + ix1) // 2 - (ix1 - ix0) // 8, (ix0 + ix1) // 2 + (ix1 - ix0) // 8, 2):
        c = pix(xx, yy)
        if isfg(c): samp.append(c)
samp.sort(key=lambda c: sum(c)); dk = samp[: max(1, len(samp) // 3)]; hair = tuple(sum(c[k] for c in dk) / len(dk) for k in range(3)); print('hair colour', hair)
for v in me.vertices:
    n = v.normal; f_ = max(0., min(1., (-n.y - .05) / .4))
    u, w_ = uv_of(v.co); c = pix(min(W - 1, int(u * W)), min(H - 1, int(w_ * H)))
    if not isfg(c):
        f_ = 0.; px_, py_ = min(W - 1, int(u * W)), min(H - 1, int(w_ * H)); cx = (ix0 + ix1) // 2; st = 1 if px_ < cx else -1
        for _ in range(200):
            px_ += st * 2
            if isfg(pix(px_, py_)): break
        px_ += st * 6; c = pix(max(0, min(W - 1, px_)), py_)
    if v.co.z > head_z: c = hair      # back of the head: hair, not the face
    fr.data[v.index].value = f_
    lin = lambda x: x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4
    col_attr.data[v.index].color = (*(lin(x) for x in c), 1)
# material: mix(back colour, projected image, frontness)
m = bpy.data.materials.new(NAME + '_mat'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = .7
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img; tx.interpolation = 'Cubic'; uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'front'; nt.links.new(uvn.outputs['UV'], tx.inputs['Vector'])
ca = nt.nodes.new('ShaderNodeAttribute'); ca.attribute_name = 'backcol'; fa = nt.nodes.new('ShaderNodeAttribute'); fa.attribute_name = 'frontness'
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; nt.links.new(fa.outputs['Fac'], mix.inputs['Factor']); nt.links.new(ca.outputs['Color'], mix.inputs['A']); nt.links.new(tx.outputs['Color'], mix.inputs['B'])
nt.links.new(mix.outputs['Result'], b.inputs['Base Color']); b.inputs['Subsurface Weight'].default_value = .05
ob.data.materials.clear(); ob.data.materials.append(m)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT)); print('saved', OUT)

# ---- rig: humanoid armature from proportions, automatic (heat) weights ----
Hh = HEIGHT; vs = [v.co.copy() for v in ob.data.vertices]
arm_band = [v for v in vs if .3 * Hh < v.z < .62 * Hh and abs(v.x) > .1 * Hh]
tipL = max(arm_band, key=lambda v: v.x); tipR = min(arm_band, key=lambda v: v.x)
shZ = .81 * Hh; shX = .115 * Hh
J = {'hips': Vector((0, 0, .52 * Hh)), 'chest': Vector((0, 0, .70 * Hh)), 'neck': Vector((0, 0, .80 * Hh)), 'head': Vector((0, 0, .845 * Hh)), 'top': Vector((0, 0, 1.0 * Hh))}
for s_, tip in (('L', tipL), ('R', tipR)):
    sx = 1 if s_ == 'L' else -1; sh = Vector((sx * shX, 0, shZ)); wr = tip + (sh - tip).normalized() * .075 * Hh; el = sh.lerp(wr, .5) + Vector((sx * .01, .02, 0))
    J['sh' + s_] = sh; J['el' + s_] = el; J['wr' + s_] = wr; J['tip' + s_] = tip
    J['hp' + s_] = Vector((sx * .055 * Hh, 0, .5 * Hh)); J['kn' + s_] = Vector((sx * .058 * Hh, -.01, .28 * Hh)); J['an' + s_] = Vector((sx * .06 * Hh, .0, .05 * Hh)); J['toe' + s_] = Vector((sx * .06 * Hh, -.09 * Hh, .015 * Hh))
bpy.ops.object.armature_add(location=(0, 0, 0)); rig = bpy.context.object; rig.name = NAME + '_rig'; bpy.ops.object.mode_set(mode='EDIT'); eb = rig.data.edit_bones; eb.remove(eb[0])
def bone(n, a, b, parent=None, connect=False):
    x = eb.new(n); x.head = a; x.tail = b
    if parent: x.parent = eb[parent]; x.use_connect = connect
    return x
bone('root', J['hips'] + Vector((0, 0, -.08 * Hh)), J['hips'])
bone('spine', J['hips'], J['chest'], 'root', True); bone('chest', J['chest'], J['neck'], 'spine', True); bone('neck', J['neck'], J['head'], 'chest', True); bone('head', J['head'], J['top'], 'neck', True)
for s_ in 'LR':
    bone('upperarm.' + s_, J['sh' + s_], J['el' + s_], 'chest'); bone('forearm.' + s_, J['el' + s_], J['wr' + s_], 'upperarm.' + s_, True); bone('hand.' + s_, J['wr' + s_], J['tip' + s_], 'forearm.' + s_, True)
    bone('thigh.' + s_, J['hp' + s_], J['kn' + s_], 'root'); bone('shin.' + s_, J['kn' + s_], J['an' + s_], 'thigh.' + s_, True); bone('foot.' + s_, J['an' + s_], J['toe' + s_], 'shin.' + s_, True)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO'); print('vertex groups', len(ob.vertex_groups), 'weighted', sum(1 for v in ob.data.vertices if len(v.groups)))
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT)); print('rigged', OUT)
