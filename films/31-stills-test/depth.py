# Depth maps for the stills (Depth Anything V2 Small, ONNX) -> gen/<name>_d.png (16-bit, near = bright)
import sys, numpy as np, onnxruntime as ort, cv2
s = ort.InferenceSession('/root/models/da2s.onnx')
for path in sys.argv[1:]:
    im = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB).astype(np.float32) / 255; h, w = im.shape[:2]
    x = cv2.resize(im, (518, 924), interpolation=cv2.INTER_CUBIC); x = (x - [.485, .456, .406]) / [.229, .224, .225]
    d = s.run(None, {'pixel_values': x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC); d = (d - d.min()) / (d.max() - d.min())
    cv2.imwrite(path.rsplit('.', 1)[0] + '_d.png', (d * 65535).astype(np.uint16)); print(path)
