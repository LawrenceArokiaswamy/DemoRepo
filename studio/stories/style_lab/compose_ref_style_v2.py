"""Style lab v2 (final look: exact reference style, normal haircut): assemble the 5 s test (AD01 beat 1) from 3 generated stills + 1 generated motion clip.
Free compositing: fast cuts like the reference, push-ins and a snap-zoom, and the EXACT message drawn on the blank phone screen (pixel-perfect).
usage: python3 compose_ref_style.py <clip_frames_dir> <out_frames_dir> [clip_offset_s] [clip_speed]"""
import sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../design/style_ref_test')
CLIP, OUT = sys.argv[1], sys.argv[2]; OFF = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0; SPD = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
os.makedirs(OUT, exist_ok=True); W, H, FPS = 1080, 1920, 30
F = lambda w, s: ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{w}.otf', s)
src = {k: Image.open(os.path.join(D, f)).convert('RGB') for k, f in [('D', 'h_insert.png'), ('B', 'h_reading.png'), ('A', 'shot_H_exactstyle_hair.png')]}
clip = sorted(os.listdir(CLIP)); clipfps = 24.0
ss = lambda x: x * x * (3 - 2 * x); cl = lambda x: max(0.0, min(1.0, x))
def frame_of(img, zoom, cx=0.5, cy=0.5):   # crop around (cx,cy) at zoom, resize to 1080x1920
    w, h = img.size; cw, ch = w / zoom, h / zoom; x0 = min(max(0, cx * w - cw / 2), w - cw); y0 = min(max(0, cy * h - ch / 2), h - ch)
    return img.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
# the message UI, drawn at the insert's native screen box (x 238-507, y 329-993 in the 752x1344 still), then the whole still is transformed
SX0, SY0, SX1, SY1 = 228, 325, 523, 1006
avatar = src['B'].crop((130, 300, 400, 570)).resize((64, 64), Image.LANCZOS); am = Image.new('L', (64, 64), 0); ImageDraw.Draw(am).ellipse((0, 0, 63, 63), fill=255)
def insert_still(t):
    im = src['D'].copy(); S = 4; sw, sh = (SX1 - SX0) * S, (SY1 - SY0) * S   # draw the UI at 4x then downsample for crisp text
    ui = Image.new('RGBA', (sw, sh), (13, 16, 32, 255)); d = ImageDraw.Draw(ui)
    d.text((sw / 2, 70), '3:09 AM', font=F('Bold', 46), fill=(232, 236, 248), anchor='mm')
    d.rectangle((0, 120, sw, 330), fill=(27, 32, 54)); ui.paste(avatar.resize((150, 150), Image.LANCZOS), (sw // 2 - 75, 140), am.resize((150, 150)))
    d.text((sw / 2, 312), 'Me', font=F('Bold', 44), fill=(255, 255, 255), anchor='ms')
    pop = cl((t - 0.3) / 0.18); k = 1 + 0.12 * math.sin(math.pi * pop) if pop < 1 else 1
    if pop > 0:
        bw, bh = int(sw * 0.9 * pop * k), int(430 * pop * k)
        if bw > 10:
            b = Image.new('RGBA', (int(sw * 0.9), 430), (0, 0, 0, 0)); bd = ImageDraw.Draw(b); bd.rounded_rectangle((0, 0, b.width - 1, 429), 56, fill=(233, 236, 244))
            for i, s in enumerate(["Don't open", 'the door', 'at 3:17.']): bd.text((44, 88 + i * 124), s, font=F('ExtraBold', 104), fill=(16, 19, 31), anchor='lm')
            ui.alpha_composite(b.resize((bw, bh), Image.LANCZOS), (int(sw * 0.05), 390))
    if t >= 0.9:
        dd = int((t - 0.9) * 4) % 3; d.rounded_rectangle((54, 860, 300, 980), 60, fill=(42, 49, 80))
        for i in range(3): d.ellipse((112 + i * 66 - 18, 920 - 18, 112 + i * 66 + 18, 920 + 18), fill=(255, 255, 255) if i == dd else (125, 134, 168))
    d.rounded_rectangle((30, sh - 130, sw - 30, sh - 40), 45, fill=(27, 32, 54)); d.text((80, sh - 85), 'Message', font=F('Regular', 40), fill=(106, 114, 144), anchor='lm')
    ui = ui.resize((SX1 - SX0, SY1 - SY0), Image.LANCZOS); mk = Image.new('L', ui.size, 0); ImageDraw.Draw(mk).rounded_rectangle((0, 0, ui.width - 1, ui.height - 1), 26, fill=255)
    im.paste(ui.convert('RGB'), (SX0, SY0), mk); return im
grain = [Image.fromarray((np.random.default_rng(i).normal(0, 7, (H // 2, W // 2))).clip(-20, 20).astype(np.int16).astype(np.uint8)) for i in range(6)]
for f in range(150):
    t = f / FPS
    if t < 1.2: fr = frame_of(insert_still(t), 1.12 + 0.05 * ss(t / 1.2), 0.5, 0.48)          # insert: exact message, slow push
    elif t < 2.1: fr = frame_of(src['B'], 1.02 + 0.04 * ss((t - 1.2) / 0.9), 0.5, 0.42)      # reading, slow push
    elif t < 2.5: fr = frame_of(src['A'], 1.02 + 0.07 * (1 - (1 - cl((t - 2.1) / 0.13)) ** 3), 0.5, 0.40)   # SHOCK: snap-zoom
    else:                                                                                   # generated motion: the turn to the door
        ct = OFF + (t - 2.5) * SPD; i = min(len(clip) - 1, int(ct * clipfps)); fr = frame_of(Image.open(os.path.join(CLIP, clip[i])).convert('RGB'), 1.09 - 0.07 * ss(cl((t - 2.5) / 0.6)), 0.5, 0.40)
    fr = fr.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))   # crisp line art; no grain (it smeared fine lines)
    fr.save(os.path.join(OUT, f'f{f:04d}.png'))
print('done', OUT)
