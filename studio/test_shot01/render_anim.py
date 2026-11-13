import bpy, sys, time, os
a=sys.argv[sys.argv.index('--')+1:]
blend,outdir=a[0],a[1]; os.makedirs(outdir,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend); s=bpy.context.scene
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 720, 1280, 100
s.cycles.samples=32; s.cycles.adaptive_threshold=0.03; s.render.use_persistent_data=True; s.render.use_motion_blur=True
log=open(os.path.join(outdir,'times.log'),'a')
for f in range(s.frame_start, s.frame_end+1):
    out=os.path.join(outdir,f"f{f:04d}.png")
    if os.path.exists(out): continue
    s.frame_set(f); s.render.filepath=out; t=time.time()
    bpy.ops.render.render(write_still=True)
    log.write(f"{f} {time.time()-t:.1f}\n"); log.flush()
