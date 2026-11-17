"""cut_parts.py <sheet.png> <outdir> : split a parts sheet (pieces on a flat light background) into transparent PNG layers.
Background colour = median of the image border; alpha from colour distance (soft edge); connected components on a 1/4-scale mask (no scipy)."""
import sys, os, numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.int16); h, w, _ = a.shape
border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]); bg = np.median(border, 0)
dist = np.sqrt(((a - bg) ** 2).sum(-1)); alpha = np.clip((dist - 10) / 18, 0, 1)
A = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
sm = np.asarray(A.resize((w // 4, h // 4), Image.BOX)) > 40; sm = np.asarray(Image.fromarray(sm.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
lab = np.zeros(sm.shape, np.int32); n = 0; H4, W4 = sm.shape
for y in range(H4):
    for x in range(W4):
        if sm[y, x] and not lab[y, x]:
            n += 1; st = [(y, x)]; lab[y, x] = n
            while st:
                cy, cx = st.pop()
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < H4 and 0 <= nx < W4 and sm[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; st.append((ny, nx))
boxes = []
for k in range(1, n + 1):
    ys, xs = np.where(lab == k)
    if len(ys) < 60: continue
    boxes.append((ys.min() * 4, xs.min() * 4, ys.max() * 4 + 4, xs.max() * 4 + 4, k))
boxes.sort(key=lambda b: (round(b[0] / 250), b[1]))   # row-major
rgba = im.convert('RGBA'); rgba.putalpha(A); prev = Image.new('RGB', (w // 3, h // 3), (60, 140, 60)); pd = ImageDraw.Draw(prev)
for i, (y0, x0, y1, x1, k) in enumerate(boxes):
    pad = 6; bx = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
    m = Image.fromarray(((lab == k) * 255).astype(np.uint8)).resize((w // 4 * 4, h // 4 * 4)).filter(ImageFilter.MaxFilter(9)).crop((0, 0, w, h)) if False else None
    piece = rgba.crop(bx); piece.save(os.path.join(out, f'part_{i:02d}.png'))
    prev.paste(piece.resize((max(1, piece.width // 3), max(1, piece.height // 3))), (bx[0] // 3, bx[1] // 3), piece.resize((max(1, piece.width // 3), max(1, piece.height // 3))))
    pd.text((bx[0] // 3, bx[1] // 3), str(i), fill=(255, 255, 0))
prev.save(os.path.join(out, 'index.jpg'), quality=88); print(len(boxes), 'parts ->', out)
