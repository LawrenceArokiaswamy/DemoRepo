"""Split a transparent sprite sheet into its separate pieces (alpha connected components on a downscaled, dilated mask)."""
import sys, json
from PIL import Image, ImageFilter
src, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGBA'); W, H = im.size; k = 8
a = im.split()[3].resize((W // k, H // k), Image.BILINEAR).point(lambda v: 255 if v > 20 else 0).filter(ImageFilter.MaxFilter(5))
w, h = a.size; px = a.load(); seen = [[False] * w for _ in range(h)]; comps = []
for y in range(h):
    for x in range(w):
        if px[x, y] and not seen[y][x]:
            st = [(x, y)]; seen[y][x] = True; x0 = x1 = x; y0 = y1 = y; n = 0
            while st:
                cx, cy = st.pop(); n += 1; x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not seen[ny][nx]: seen[ny][nx] = True; st.append((nx, ny))
            if n > 60: comps.append((x0 * k, y0 * k, (x1 + 1) * k, (y1 + 1) * k, n))
comps.sort(key=lambda c: (round(c[1] / 300), c[0]))  # reading order: rows, then left to right
meta = []
for i, (x0, y0, x1, y1, n) in enumerate(comps):
    m = 12; box = (max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)); crop = im.crop(box)
    bb = crop.getbbox(); crop = crop.crop(bb); box = (box[0] + bb[0], box[1] + bb[1], box[0] + bb[2], box[1] + bb[3])
    name = f'{prefix}{i}'; crop.save(f'{outdir}/{name}.png'); meta.append({'name': name, 'box': box, 'size': crop.size})
json.dump(meta, open(f'{outdir}/{prefix}meta.json', 'w'), indent=1)
for m in meta: print(m['name'], m['box'], m['size'])
