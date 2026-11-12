# quick turnaround render of a character .blend: front, 3/4, side, back
import bpy, sys, math, os
argv = sys.argv[sys.argv.index('--') + 1:]; BL, OUT = argv[0], argv[1]
bpy.ops.wm.open_mainfile(filepath=BL); sc = bpy.context.scene; ob = [o for o in sc.objects if o.type == 'MESH'][0]; ob.rotation_mode = 'XYZ'
sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 300, 520
sc.view_settings.view_transform = 'Standard'; w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (.5, .5, .52, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .6
bpy.ops.object.light_add(type='AREA', location=(1.5, -2.5, 2.5)); L = bpy.context.object; L.data.energy = 300; L.data.size = 2; L.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.object.camera_add(location=(0, -4.2, .85), rotation=(math.radians(90), 0, 0)); cam = bpy.context.object; cam.data.lens = 55; sc.camera = cam
os.makedirs(OUT, exist_ok=True)
for i, a in enumerate((0, 35, 90, 180)):
    ob.rotation_euler = (0, 0, math.radians(a)); sc.render.filepath = f'{OUT}/turn_{i}.jpg'; sc.render.image_settings.file_format = 'JPEG'; bpy.ops.render.render(write_still=True)
