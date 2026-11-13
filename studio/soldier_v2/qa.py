#!/usr/bin/env python3
"""Labeled contact sheet: qa.py <stills_dir> <out.jpg> <cols> [label]"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]); label = sys.argv[4] if len(sys.argv) > 4 else ""
fs = sorted(glob.glob(d + "/f*.jpg")); W, H = 360, 640
sh = Image.new("RGB", (W * min(cols, len(fs)), H * ((len(fs) + cols - 1) // cols) + 40), "black"); dr = ImageDraw.Draw(sh)
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception: font = ImageFont.load_default()
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * H + 40
    sh.paste(Image.open(f).resize((W, H)), (x, y)); dr.text((x + 8, y + 6), os.path.basename(f)[1:5], fill="yellow", font=font, stroke_width=2, stroke_fill="black")
dr.text((8, 8), label, fill="white", font=font); sh.save(out, quality=88); print(out, len(fs))
