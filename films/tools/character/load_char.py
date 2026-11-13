# Import a Meshy-rigged character GLB and make its skeleton usable for IK and retargeting.
import bpy
from mathutils import Vector
NEXT = {"Hips": "Spine02", "Spine02": "Spine01", "Spine01": "Spine", "Spine": "neck", "neck": "Head", "Head": "head_end",
        "LeftShoulder": "LeftArm", "LeftArm": "LeftForeArm", "LeftForeArm": "LeftHand", "RightShoulder": "RightArm",
        "RightArm": "RightForeArm", "RightForeArm": "RightHand", "LeftUpLeg": "LeftLeg", "LeftLeg": "LeftFoot", "LeftFoot": "LeftToeBase",
        "RightUpLeg": "RightLeg", "RightLeg": "RightFoot", "RightFoot": "RightToeBase"}
def load(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in list(new):
        if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o); new.remove(o)
    arm = [o for o in new if o.type == 'ARMATURE'][0]; mesh = [o for o in new if o.type == 'MESH'][0]
    if arm.animation_data: arm.animation_data.action = None
    # glTF stores no bone tails: re-aim each bone at its child joint (leaf bones: short extension), zero the rolls
    bpy.context.view_layer.objects.active = arm
    for o in bpy.context.view_layer.objects: o.select_set(o == arm)
    bpy.ops.object.mode_set(mode='EDIT'); EB = arm.data.edit_bones
    for b in EB:
        if b.name in NEXT and NEXT[b.name] in EB: b.tail = EB[NEXT[b.name]].head.copy()
    for b in EB:
        if b.name not in NEXT or NEXT[b.name] not in EB:
            d = (b.head - b.parent.head).normalized() if b.parent else Vector((0, 0, 1)); b.tail = b.head + d * 6.0
        b.roll = 0.0
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm, mesh
