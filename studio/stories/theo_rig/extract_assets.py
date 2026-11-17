"""Theo rig PoC (zero credits): extract reusable layers from the APPROVED assets (no new design).
- layers/plate_apartment.png : the apartment still with the AI Theo filled out (multi-scale diffusion fill; the puppet covers the area)
- layers/hair_front.png, layers/hair_34.png : hair cut from the approved model sheet (front + three-quarter views), with its own outline
Prints sampled palette colours (skin, hoodie, outline) used by the vector parts."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
D = '../../design'
# ---------- clean plate
im = Image.open(f'{D}/style_ref_test/shot_H_exactstyle_hair.png').convert('RGB').resize((1080, 1920), Image.LANCZOS)
m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m)
d.ellipse((205, 455, 775, 1035), fill=255)                                   # head + hair
d.polygon([(130, 880), (760, 880), (780, 1200), (740, 1490), (140, 1500)], fill=255)   # hoodie, arms, phone, hands
d.polygon([(300, 1430), (640, 1430), (500, 1840), (380, 1840)], fill=255)  # legs
m = m.filter(ImageFilter.MaxFilter(15))
a = np.asarray(im).astype(np.float32); k = np.asarray(m) > 0
def fill(img, mask):
    if min(img.shape[:2]) < 24:
        out = img.copy(); out[mask] = img[~mask].mean(0) if (~mask).any() else 128; return out
    sm = np.asarray(Image.fromarray(img.astype(np.uint8)).resize((img.shape[1] // 2, img.shape[0] // 2), Image.BOX)).astype(np.float32)
    mm = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((img.shape[1] // 2, img.shape[0] // 2), Image.BOX)) > 127
    lo = fill(sm, mm); up = np.asarray(Image.fromarray(lo.astype(np.uint8)).resize((img.shape[1], img.shape[0]), Image.BILINEAR)).astype(np.float32)
    out = img.copy(); out[mask] = up[mask]
    for _ in range(6):   # local smoothing inside the hole only
        b = (np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 4; out[mask] = b[mask]
    return out
plate = fill(a, k); Image.fromarray(plate.clip(0, 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.4, 60, 2)).save('layers/plate_apartment.png')
# ---------- hair from the model sheet
sh = np.asarray(Image.open(f'{D}/characters/theo_model_sheet.png').convert('RGB')).astype(np.int16)
def cut(box, name):
    x0, y0, x1, y1 = box; c = sh[y0:y1, x0:x1]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    brown = (r > g + 8) & (g > b - 6) & (r < 150) & (r > 40) & ((r - b) > 22)
    dark = (r < 70) & (g < 60) & (b < 60)
    bm = Image.fromarray((brown * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))   # drop specks
    near = np.asarray(bm.filter(ImageFilter.MaxFilter(15))) > 0
    hair = (np.asarray(bm) > 0) | (dark & near)
    al = Image.fromarray((hair * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = Image.fromarray(c.astype(np.uint8)).convert('RGBA'); rgba.putalpha(al); bb = al.getbbox(); rgba.crop(bb).save(f'layers/{name}.png'); print(name, 'bbox in crop', bb)
cut((170, 30, 570, 380), 'hair_front'); cut((680, 25, 1090, 380), 'hair_34')
# palette samples (front view): face skin, hoodie, outline
for nm, (x, y) in {'skin': (370, 300), 'hoodie': (330, 560), 'hood_shadow': (300, 470)}.items(): print(nm, tuple(sh[y, x]))
