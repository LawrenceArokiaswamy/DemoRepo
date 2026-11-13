import bpy, sys, time
args=sys.argv[sys.argv.index('--')+1:]
blend, outdir, pct, samples = args[0], args[1], int(args[2]), int(args[3]); frames=[int(x) for x in args[4].split(',')]
bpy.ops.wm.open_mainfile(filepath=blend)
s=bpy.context.scene; s.render.resolution_percentage=pct; s.cycles.samples=samples
s.render.use_motion_blur = len(args)>5 and args[5]=='mb'
for f in frames:
    s.frame_set(f); s.render.filepath=f"{outdir}/f{f:04d}.png"; t=time.time()
    bpy.ops.render.render(write_still=True); print("FRAME",f,round(time.time()-t,1),"s")
