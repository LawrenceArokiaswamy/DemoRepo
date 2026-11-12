# 2D textures for film 34 (PIL): her sketchbook pages (dress designs), the photo frame border, wall clock face
import sys, math
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]
def paper(w, h, col=(246, 240, 228)):
    im = Image.new("RGB", (w, h), col); d = ImageDraw.Draw(im)
    for y in range(40, h, 38): d.line([(30, y), (w - 30, y)], fill=(226, 220, 206), width=1)
    return im, d
def figure(d, cx, top, s, dress=(200, 32, 44), pose=0):
    ink = (60, 52, 48)
    d.ellipse([cx - 14 * s, top, cx + 14 * s, top + 28 * s], outline=ink, width=3)          # head
    d.line([(cx, top + 28 * s), (cx, top + 44 * s)], fill=ink, width=3)                       # neck
    hem = 70 * s if pose == 0 else 85 * s
    pts = [(cx - 16 * s, top + 44 * s), (cx + 16 * s, top + 44 * s), (cx + 10 * s, top + 92 * s), (cx + hem, top + 190 * s), (cx - hem, top + 190 * s), (cx - 10 * s, top + 92 * s)]
    d.polygon(pts, fill=dress, outline=ink, width=3)
    for sx in (-1, 1):
        d.line([(cx + sx * 16 * s, top + 48 * s), (cx + sx * (40 + 20 * pose) * s, top + (110 - 50 * pose) * s)], fill=ink, width=3)
        d.line([(cx + sx * 12 * s, top + 190 * s), (cx + sx * 16 * s, top + 250 * s)], fill=ink, width=3)
    d.line([(cx - 10 * s, top + 92 * s), (cx + 10 * s, top + 92 * s)], fill=ink, width=4)
im, d = paper(900, 640)
figure(d, 230, 90, 1.6, (200, 32, 44), 1); figure(d, 640, 90, 1.6, (52, 92, 160), 0)
d.text((520, 560), "my first collection", fill=(90, 80, 74)); d.text((120, 40), "~ dance ~", fill=(170, 40, 50))
for i in range(14): d.line([(620 + i * 9, 470), (630 + i * 9, 452)], fill=(120, 110, 100), width=2)
im.filter(ImageFilter.SMOOTH).save(out + "/sketch.png")
# clock face
c = Image.new("RGB", (512, 512), (250, 248, 242)); d = ImageDraw.Draw(c)
d.ellipse([6, 6, 506, 506], outline=(40, 40, 44), width=18)
for i in range(12):
    a = i / 12 * 2 * math.pi; r0, r1 = 200, 232 if i % 3 else 214
    d.line([(256 + r0 * math.sin(a), 256 - r0 * math.cos(a)), (256 + 232 * math.sin(a), 256 - 232 * math.cos(a))], fill=(40, 40, 44), width=10 if i % 3 == 0 else 5)
c.save(out + "/clock.png")
print("art ok")
