# Retarget CMU mocap (BVH) onto a Meshy-style rig (Hips/Spine02/Spine01/Spine/neck/Head, Left/Right Arm, ForeArm, Hand, UpLeg, Leg, Foot).
# Spine, neck, head and legs: rest-relative rotation transfer (both rigs stand upright at rest).
# Arms (CMU rest is a T-pose, Meshy rest an A-pose): direction matching, so the limb points where the actor's limb points.
# Hips translation is scaled by the ratio of hip heights.
#   import retarget as RT; src = RT.load_bvh(path); fix_tails(arm) first (see hallway.py), then per frame RT.apply(src, src_frame, arm)
import bpy
from mathutils import Matrix, Vector

MAP = {"root": "Hips", "lowerback": "Spine02", "upperback": "Spine01", "thorax": "Spine", "lowerneck": "neck", "head": "Head",
       "lfemur": "LeftUpLeg", "ltibia": "LeftLeg", "lfoot": "LeftFoot", "rfemur": "RightUpLeg", "rtibia": "RightLeg", "rfoot": "RightFoot",
       "lclavicle": "LeftShoulder", "lhumerus": "LeftArm", "lradius": "LeftForeArm", "lwrist": "LeftHand",
       "rclavicle": "RightShoulder", "rhumerus": "RightArm", "rradius": "RightForeArm", "rwrist": "RightHand"}
DIRECTIONAL = {"LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "RightShoulder", "RightArm", "RightForeArm", "RightHand"}
ORDER = ["Hips", "Spine02", "Spine01", "Spine", "neck", "Head", "LeftUpLeg", "LeftLeg", "LeftFoot", "RightUpLeg", "RightLeg", "RightFoot",
         "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "RightShoulder", "RightArm", "RightForeArm", "RightHand"]

def load_bvh(path, scale=0.056):
    before = set(bpy.data.objects)
    bpy.ops.import_anim.bvh(filepath=path, global_scale=scale, frame_start=1, use_fps_scale=False, axis_forward='-Z', axis_up='Y')
    a = [o for o in bpy.data.objects if o not in before and o.type == 'ARMATURE'][0]
    a.hide_render = True; return a

def _rot(m): return m.to_3x3().normalized()

def apply(src, frame, dst, root_offset=Vector((0, 0, 0)), yaw=0.0, lock_root_xy=False):
    """pose dst like src at the given src frame; dst bones must have proper tails (re-aimed at their children)"""
    sc = bpy.context.scene
    sc.frame_set(int(frame)); bpy.context.view_layer.update()
    Ms, Md = src.matrix_world, dst.matrix_world
    Ryaw = Matrix.Rotation(yaw, 3, 'Z')
    s_rest_h = (Ms @ src.data.bones["root"].head_local).z or 1.0
    d_rest_h = (Md @ dst.data.bones["Hips"].head_local).z
    k = d_rest_h / s_rest_h
    for pb in dst.pose.bones: pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
    inv_src = {v: k_ for k_, v in MAP.items()}
    for name in ORDER:
        if name not in dst.pose.bones or inv_src[name] not in src.pose.bones: continue
        sb, db = src.pose.bones[inv_src[name]], dst.pose.bones[name]
        bpy.context.view_layer.update()
        cur_w = Md @ db.matrix                                   # current world matrix of the dst bone (parents already posed)
        if name in DIRECTIONAL:
            sdir = Ryaw @ (_rot(Ms) @ (sb.tail - sb.head)).normalized()
            ddir = (_rot(cur_w) @ Vector((0, 1, 0))).normalized()
            R = ddir.rotation_difference(sdir).to_matrix()
        else:
            s_now = Ryaw @ _rot(Ms @ sb.matrix); s_rest = Ryaw @ _rot(Ms @ sb.bone.matrix_local)
            d_rest = _rot(Md @ db.bone.matrix_local)
            R = (s_now @ s_rest.inverted() @ d_rest) @ _rot(cur_w).inverted()
        new_w = (R @ cur_w.to_3x3()).to_4x4(); new_w.translation = cur_w.translation   # keep the armature's object scale
        if name == "Hips":
            sh = Ryaw @ (Ms @ sb.head); dh = Md @ dst.data.bones["Hips"].head_local
            t = Vector((sh.x * k, sh.y * k, sh.z * k)) + root_offset
            if lock_root_xy: t.x, t.y = dh.x + root_offset.x, dh.y + root_offset.y
            new_w.translation = t
        db.matrix = Md.inverted() @ new_w
    bpy.context.view_layer.update()
