import bpy, sys, math
argv = sys.argv[sys.argv.index('--') + 1:]; BL, OUT = argv[0], argv[1]
bpy.ops.wm.open_mainfile(filepath=BL); sc = bpy.context.scene; ob = [o for o in sc.objects if o.type == 'MESH'][0]; ob.rotation_mode = 'XYZ'
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 600, 600; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (.5, .5, .52, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
bpy.ops.object.light_add(type='AREA', location=(1, -2, 2.2)); L = bpy.context.object; L.data.energy = 200; L.data.size = 1.5; L.rotation_euler = (math.radians(50), 0, math.radians(25))
z = max(v.co.z for v in ob.data.vertices) - .17
for i, a in enumerate((0, 180)):
    ob.rotation_euler = (0, 0, math.radians(a)); bpy.ops.object.camera_add(location=(0, -.95, z), rotation=(math.radians(90), 0, 0)); cam = bpy.context.object; cam.data.lens = 70; sc.camera = cam
    sc.render.filepath = f'{OUT}_{i}.jpg'; sc.render.image_settings.file_format = 'JPEG'; bpy.ops.render.render(write_still=True)
