import sys, subprocess, numpy as np, onnxruntime as ort
model, out_dir, *imgs = sys.argv[1:]
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
W, H = 770, 518  # multiples of 14, 3:2-ish
mean = np.array([0.485, 0.456, 0.406], np.float32); std = np.array([0.229, 0.224, 0.225], np.float32)
for p in imgs:
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}:flags=bicubic','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True).stdout
    x = (np.frombuffer(raw,np.uint8).reshape(H,W,3).astype(np.float32)/255 - mean)/std
    d = sess.run(None,{inp: x.transpose(2,0,1)[None]})[0].squeeze()
    d = (d - d.min())/(d.max()-d.min()+1e-6)   # 1 = near
    name = p.rsplit('/',1)[-1].rsplit('.',1)[0]
    subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','gray16le','-s',f'{d.shape[1]}x{d.shape[0]}','-i','-','-vf','scale=1024:-2:flags=bicubic',f'{out_dir}/{name}_d.png'],input=(d*65535).astype('<u2').tobytes(),check=True)
    print(name, d.shape)
