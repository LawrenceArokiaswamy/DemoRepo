# Split a still into layers for 2.5D animation: depth map (Depth Anything V2 Small, Apache-2.0),
# subject matte (BiRefNet lite, MIT), a background with the subject painted out, and the subject as RGBA.
# usage: /root/visionvenv/bin/python layers.py in.jpg outdir
import sys, os, numpy as np, cv2, onnxruntime as ort
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
img = cv2.imread(src)[:, :, ::-1].astype(np.float32) / 255.0; H, W = img.shape[:2]
MEAN, STD = np.array([0.485, 0.456, 0.406]), np.array([0.229, 0.224, 0.225])
def prep(x, w, h):
    x = cv2.resize(x, (w, h), interpolation=cv2.INTER_CUBIC); x = (x - MEAN) / STD
    return x.transpose(2, 0, 1)[None].astype(np.float32)
so = ort.SessionOptions(); so.intra_op_num_threads = 4
# depth (relative inverse depth: larger = nearer)
d = ort.InferenceSession('/root/models/depth-anything-v2-small/onnx/model.onnx', so)
dw, dh = 518, int(round(518 * H / W / 14)) * 14
dep = d.run(None, {d.get_inputs()[0].name: prep(img, dw, dh)})[0][0]
dep = cv2.resize(dep, (W, H), interpolation=cv2.INTER_CUBIC); dep = (dep - dep.min()) / (dep.max() - dep.min())
dep = cv2.GaussianBlur(dep, (0, 0), 3)
cv2.imwrite(f'{out}/depth.png', (dep * 65535).astype(np.uint16))
# matte
m = ort.InferenceSession('/root/models/BiRefNet_lite-ONNX/onnx/model.onnx', so)
o = m.run(None, {m.get_inputs()[0].name: prep(img, 1024, 1024)})[-1][0, 0]
a = 1 / (1 + np.exp(-o)); a = cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC).clip(0, 1)
cv2.imwrite(f'{out}/matte.png', (a * 255).astype(np.uint8))
# subject RGBA and background with the subject painted out (dilated hole, Telea inpaint at half res, then upscaled)
bgr = (img[:, :, ::-1] * 255).astype(np.uint8)
cv2.imwrite(f'{out}/fg.png', np.dstack([bgr, (a * 255).astype(np.uint8)]))
hole = cv2.dilate((a > 0.08).astype(np.uint8) * 255, np.ones((25, 25), np.uint8))
small = cv2.resize(bgr, (W // 2, H // 2)); hs = cv2.resize(hole, (W // 2, H // 2))
fill = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA); fill = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC)
fill = cv2.GaussianBlur(fill, (0, 0), 6); hm = (cv2.GaussianBlur(hole, (0, 0), 6) / 255.0)[:, :, None]
bg = (bgr * (1 - hm) + fill * hm).astype(np.uint8); cv2.imwrite(f'{out}/bg.jpg', bg, [cv2.IMWRITE_JPEG_QUALITY, 94])
print('layers', out, W, H, 'subject coverage %.2f' % (a > 0.5).mean())
