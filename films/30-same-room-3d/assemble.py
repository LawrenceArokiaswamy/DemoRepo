# Film 30 "Same Room" (3D couple, free Blender): cut the 9 rendered shots (out/frames/s{1..9}_000-119.jpg, 24 fps, 5 s each) into a 45 s vertical film,
# upscale to 1080x1920, light grade, serif captions, flashback dip-to-black, fade out. Writes out/video.mp4 (no audio).
import subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); os.makedirs(f'{H}/out', exist_ok=True)
FONT = f'{H}/fonts/PlayfairDisplay-Italic.ttf'; MONO = f'{H}/fonts/IBMPlexMono-Medium.ttf'
SHOT = 5.0
CAPS = [  # (start, end, text, font, size, y)
    (0.7, 4.4, 'We used to talk until 3 AM.', FONT, 58, 1450),
    (5.7, 9.5, 'Now we say goodnight to our screens.', FONT, 54, 1450),
    (11.6, 14.7, 'I stopped showing him things.', FONT, 56, 1450),
    (15.4, 19.2, '3 YEARS AGO TODAY', MONO, 30, 1460),
    (21.0, 24.6, 'Strangers in the same room.', FONT, 58, 1450),
    (31.4, 34.6, '“I’m here.”', FONT, 64, 1450),
    (36.0, 39.6, 'We talked until 3 AM again.', FONT, 56, 1450),
    (40.7, 44.4, 'Put it down.', FONT, 66, 1420), (41.4, 44.4, 'They’re still here.', FONT, 66, 1505),
]
def esc(s): return s.replace('\\', '\\\\').replace(':', '\\:').replace("'", "’").replace('%', '\\%')
inputs = []; fl = []
for i in range(1, 10):
    inputs += ['-framerate', '24', '-i', f'{H}/out/frames/s{i}_%03d.jpg']
    fl.append(f'[{i-1}:v]trim=0:{SHOT},setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1[v{i}]')
fl.append(''.join(f'[v{i}]' for i in range(1, 10)) + 'concat=n=9:v=1:a=0[cat]')
g = '[cat]eq=contrast=1.04:saturation=1.03,unsharp=5:5:0.35'
# dip to black between the flashback and the present (4.6-5.4 s) and fade in/out
g += ",fade=t=in:st=0:d=0.6,fade=t=out:st=44.2:d=0.8"
g += ",geq=lum='lum(X,Y)*(1-0.85*max(0,1-abs(T-5)/0.4))':cb='cb(X,Y)':cr='cr(X,Y)'"
for a, b, s, f, size, y in CAPS:
    al = f"if(lt(t,{a}),0,if(lt(t,{a}+0.5),(t-{a})/0.5,if(lt(t,{b}-0.5),1,if(lt(t,{b}),({b}-t)/0.5,0))))"
    g += f",drawtext=fontfile='{f}':text='{esc(s)}':fontsize={size}:fontcolor=white:alpha='{al}':x=(w-text_w)/2:y={y}:shadowcolor=black@0.7:shadowx=0:shadowy=3:borderw=0"
g += '[outv]'; fl.append(g)
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fl), '-map', '[outv]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '30', f'{H}/out/video.mp4']
subprocess.run(cmd, check=True); print('video written')
