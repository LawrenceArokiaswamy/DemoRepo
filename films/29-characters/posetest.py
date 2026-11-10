import bpy, sys, math
from mathutils import Vector, Matrix
argv = sys.argv[sys.argv.index('--') + 1:]; BL, OUT, MODE = argv[0], argv[1], argv[2]
bpy.ops.wm.open_mainfile(filepath=BL); sc = bpy.context.scene; rig = [o for o in sc.objects if o.type == 'ARMATURE'][0]
def apply_pose(rig, targets):
    pb = rig.pose.bones; M = {}
    for b in rig.data.bones:
        base = (M[b.parent.name] @ (b.parent.matrix_local.inverted() @ b.matrix_local)) if b.parent else b.matrix_local.copy()
        if b.name in targets:
            cur = (base.to_3x3() @ Vector((0, 1, 0))).normalized(); q = cur.rotation_difference(Vector(targets[b.name]).normalized())
            Mb = Matrix.Translation(base.translation) @ (q.to_matrix() @ base.to_3x3()).to_4x4(); pb[b.name].matrix_basis = base.inverted() @ Mb
        else: pb[b.name].matrix_basis = Matrix.Identity(4); Mb = base
        M[b.name] = Mb
def mir(d): return {k.replace('.L', '.X').replace('.R', '.L').replace('.X', '.R'): (-v[0], v[1], v[2]) for k, v in d.items()}
SIT = {'thigh.L': (.12, -1, -.04), 'shin.L': (.02, -.1, -1), 'foot.L': (0, -1, -.35)}; SIT.update(mir(SIT))
PHONE = {'spine': (0, -.05, 1), 'chest': (0, -.18, 1), 'neck': (0, -.35, 1), 'head': (0, -.75, 1), 'upperarm.R': (-.18, -.3, -1), 'forearm.R': (.4, -1, .75), 'hand.R': (.25, -.7, .8)}
PHONE.update(mir({k: v for k, v in PHONE.items() if k.endswith('.R')}))
H = max(v.co.z for v in [o for o in sc.objects if o.type == 'MESH'][0].data.vertices)
if MODE == 'sit': apply_pose(rig, {**SIT, **PHONE}); rig.location.z = -(.52 * H - .5)
sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 400, 560; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (.5, .5, .52, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, .15, .25)); seat = bpy.context.object; seat.scale = (1.0, .6, .5)
bpy.ops.object.light_add(type='AREA', location=(1, -2, 2.2)); L = bpy.context.object; L.data.energy = 220; L.data.size = 1.5; L.rotation_euler = (math.radians(50), 0, math.radians(25))
for i, (p, r) in enumerate((((0, -2.6, .9), (90, 0, 0)), ((1.9, -1.9, .95), (88, 0, 45)))):
    bpy.ops.object.camera_add(location=p, rotation=tuple(math.radians(a) for a in r)); cam = bpy.context.object; cam.data.lens = 45; sc.camera = cam
    sc.render.filepath = f'{OUT}_{i}.jpg'; sc.render.image_settings.file_format = 'JPEG'; bpy.ops.render.render(write_still=True)
