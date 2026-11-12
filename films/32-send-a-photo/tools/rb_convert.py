# Convert a Microsoft Rocketbox avatar (MIT) + Rocketbox mocap clips into one GLB for three.js.
# Usage: python rb_convert.py -- <avatar dir> <anim dir> <out.glb> clip1,clip2,...
# - imports the *_facial.fbx (native Biped bone axes), metres, facing +Y in Blender (= +Z in glTF, toward a three.js camera at +Z)
# - PBR materials: colour, normal, roughness derived from the specular map; alpha-hashed hair/lashes
# - keeps the ARKit face shapes (AK_xx_Name -> name) for expressions and blinks
# - each clip: per frame every bone takes the clip bone's world orientation (same skeleton, same axes), hips also its offset
import bpy, glob, os, sys, math, numpy as np
from mathutils import Matrix, Quaternion, Vector
SRC, ANIMS, OUT, CLIPS = sys.argv[sys.argv.index('--') + 1:][:4]; CLIPS = [c for c in CLIPS.split(',') if c]
def log(*a): print('[rb]', *a, flush=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
fbx = glob.glob(f'{SRC}/Export/*_facial.fbx')[0]
bpy.ops.import_scene.fbx(filepath=fbx, automatic_bone_orientation=False)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE'); mesh = next(o for o in bpy.data.objects if o.type == 'MESH')
for o in (arm, mesh):
    if o.animation_data: o.animation_data_clear()
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
def settle():
    bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    w = mesh.matrix_world.copy(); mesh.data.transform(w, shape_keys=True); mesh.matrix_parent_inverse = Matrix.Identity(4); mesh.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
settle()
# face +Y (nose in front of head on +Y): glTF export maps Blender +Y to -Z... we want the face toward glTF +Z, i.e. Blender -Y
nose, head = arm.data.bones['Bip01 MNose'].head_local, arm.data.bones['Bip01 Head'].head_local
if nose.y > head.y: arm.matrix_world = Matrix.Rotation(math.pi, 4, 'Z') @ arm.matrix_world; settle()
zs = [v.co.z for v in mesh.data.vertices]; log('height', round(max(zs) - min(zs), 3))
# materials
TEX = f'{SRC}/Textures'
def img(p, cs='sRGB'): i = bpy.data.images.load(p, check_existing=True); i.colorspace_settings.name = cs; return i
for slot in mesh.material_slots:
    m = slot.material; base = m.name.split('.')[0]; part = base.split('_')[-1]; pre = base.rsplit('_', 1)[0]
    nt = m.node_tree; nt.nodes.clear(); out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    c = nt.nodes.new('ShaderNodeTexImage'); c.image = img(f'{TEX}/{pre}_{part}_color.tga'); nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
    m.name = {'head': 'skin', 'body': 'body', 'opacity': 'hair'}.get(part, part)
    if part == 'opacity': nt.links.new(c.outputs['Alpha'], b.inputs['Alpha']); b.inputs['Roughness'].default_value = .6; m.surface_render_method = 'DITHERED'; continue
    np_ = f'{TEX}/{pre}_{part}_normal.tga'
    if os.path.exists(np_): n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(np_, 'Non-Color'); nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    sp = f'{TEX}/{pre}_{part}_specular.tga'
    if os.path.exists(sp):
        s = img(sp, 'Non-Color'); w, h = s.size; px = np.empty(w * h * 4, np.float32); s.pixels.foreach_get(px); g = px.reshape(-1, 4)[:, :3].mean(1)
        r = np.clip(.92 - .75 * g, .3, .95); ri = bpy.data.images.new(f'{pre}_{part}_rough', w, h); ri.colorspace_settings.name = 'Non-Color'
        ri.pixels.foreach_set(np.stack([r, r, r, np.ones_like(r)], 1).ravel()); ri.pack()
        rn = nt.nodes.new('ShaderNodeTexImage'); rn.image = ri; nt.links.new(rn.outputs['Color'], b.inputs['Roughness'])
    b.inputs['Metallic'].default_value = 0
# face shapes: keep ARKit ones under their ARKit names
kb = mesh.data.shape_keys.key_blocks if mesh.data.shape_keys else []
for k in list(kb)[1:]:
    if k.name.startswith('AK_'): n = k.name.split('_', 2)[2]; k.name = n[0].lower() + n[1:]
    else: mesh.shape_key_remove(k)
log('shapes', len(mesh.data.shape_keys.key_blocks) - 1 if mesh.data.shape_keys else 0)
# clips
scene = bpy.context.scene; bones = sorted(arm.data.bones, key=lambda b: len(b.parent_recursive)); rest = {b.name: b.matrix_local.copy() for b in bones}
for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'
HIPS = 'Bip01 Pelvis'
for clip in CLIPS:
    before = set(bpy.data.objects); bpy.ops.import_scene.fbx(filepath=f'{ANIMS}/{clip}.fbx', automatic_bone_orientation=False)
    new = [o for o in bpy.data.objects if o not in before]; src = next(o for o in new if o.type == 'ARMATURE'); act = src.animation_data.action
    f0, f1 = (int(round(v)) for v in act.frame_range); sw = src.matrix_world.copy()
    names = [b.name for b in bones if b.name in src.data.bones]
    srest = {n: sw @ src.data.bones[n].matrix_local for n in names}
    full = rest[HIPS].to_quaternion() @ srest[HIPS].to_quaternion().inverted(); face = Quaternion((full.w, 0, 0, full.z)).normalized()
    h0 = srest[HIPS].to_translation(); frames = []
    for f in range(f0, f1 + 1):
        scene.frame_set(f); ev = src.evaluated_get(bpy.context.evaluated_depsgraph_get()); pose = {}; basis = {}
        for b in bones:
            par = pose[b.parent.name] if b.parent else Matrix.Identity(4); rel = (rest[b.parent.name].inverted() @ rest[b.name]) if b.parent else rest[b.name]; base = par @ rel
            if b.name in srest:
                swm = ev.matrix_world @ ev.pose.bones[b.name].matrix; rot = face @ swm.to_quaternion(); loc = base.to_translation()
                if b.name == HIPS: loc = rest[b.name].to_translation() + face @ (swm.to_translation() - h0)
                pose[b.name] = Matrix.Translation(loc) @ rot.to_matrix().to_4x4()
            else: pose[b.name] = base
            basis[b.name] = rel.inverted() @ par.inverted() @ pose[b.name]
        frames.append(basis)
    a = bpy.data.actions.new(clip); arm.animation_data_create(); arm.animation_data.action = a
    for fi, basis in enumerate(frames):
        for pb in arm.pose.bones:
            m = basis[pb.name]; pb.rotation_quaternion = m.to_quaternion(); pb.keyframe_insert('rotation_quaternion', frame=fi)
            if pb.name == HIPS: pb.location = m.to_translation(); pb.keyframe_insert('location', frame=fi)
    a.use_fake_user = True; tr = arm.animation_data.nla_tracks.new(); tr.name = clip; tr.strips.new(clip, 0, a); arm.animation_data.action = None
    for o in new: bpy.data.objects.remove(o, do_unlink=True)
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    log('clip', clip, len(frames), 'frames')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_morph=True, export_morph_normal=False, export_skins=True, export_animations=True,
    export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_image_format='WEBP', export_image_quality=88, export_optimize_animation_size=True,
    export_frame_step=1, export_apply=True, export_yup=True)
log('EXPORTED', OUT, round(os.path.getsize(OUT) / 1e6, 1), 'MB')
