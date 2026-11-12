# Film 34 post: per-frame dips to black between places, the white flash and black gap before the cry, the end-card darken,
# then out/post/%04d.png (still 540x960; ffmpeg upscales). Frames missing from the render (the black gap) are generated.
import os, sys
from PIL import Image, ImageEnhance
H = os.path.dirname(os.path.abspath(__file__)); SRC, DST = f"{H}/out/frames", f"{H}/out/post"; os.makedirs(DST, exist_ok=True)
FPS, TOTAL = 30, 62 * 30; W, Hh = 540, 960
DIPS = [5.0, 17.0, 32.0, 40.0, 46.5, 54.0]
def level(f):
    t = f / FPS; black = max(1 - min(1, f / 10), 0.0); white = 0.0
    for c in DIPS: black = max(black, 1 - abs(t - c) * FPS / 7)
    if 23.6 <= t < 24.0: white = (t - 23.6) / 0.4
    if 24.0 <= t < 25.2: black = 1.0
    if 25.2 <= t < 25.9: black = max(black, 1 - (t - 25.2) / 0.7)
    black = max(black, min(1, (t - 61.3) / 0.7)) if t > 61.3 else black
    dark = 0.45 * min(1, max(0, (t - 56.8) / 1.0))
    return black, white, dark
only = sys.argv[1:] and [int(x) for x in sys.argv[1].split(",")]
for f in (only or range(TOTAL)):
    black, white, dark = level(f); src = f"{SRC}/{f:04d}.png"
    im = Image.open(src).convert("RGB") if os.path.exists(src) else Image.new("RGB", (W, Hh))
    if im.size != (W, Hh): im = im.resize((W, Hh), Image.LANCZOS)
    if white: im = Image.blend(im, Image.new("RGB", im.size, (255, 255, 255)), white ** 1.5)
    if dark: im = ImageEnhance.Brightness(im).enhance(1 - dark)
    if black: im = Image.blend(im, Image.new("RGB", im.size), min(1, black))
    im.save(f"{DST}/{f:04d}.png", compress_level=1)
print("post ok")
