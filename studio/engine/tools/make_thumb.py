"""Studio thumbnail + vertical cover generator (original brand system; Bible F.6).
usage: python3 make_thumb.py spec.json
spec: { "out_dir": "...", "bg": {"img": path, "crop": [x0,y0,x1,y1]},            # 16:9 background crop from a clean (caption-free) render
        "inset": {"img": path, "crop": [...], "side": "right"},                 # optional character inset with a diagonal edge
        "lines": ["1 OLD MAN", "vs 60 WARSHIPS"], "hi": ["60 WARSHIPS"],         # 2-4 words per line, one highlighted phrase
        "cover": {"img": path, "crop": [...] } }                                 # vertical 1080x1920 cover (same type system)
Brand: Inter Display Black, white with a heavy dark outline, one signature-yellow phrase, a yellow accent bar, warm contrast
grade + vignette. Few words, one idea, readable at phone size."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
S = json.load(open(sys.argv[1])); os.makedirs(S['out_dir'], exist_ok=True)
FONT = '/usr/share/fonts/truetype/inter/InterDisplay-Black.ttf'
if not os.path.exists(FONT):
    import glob; FONT = (glob.glob('/usr/share/fonts/**/InterDisplay-Black*', recursive=True) + glob.glob('/usr/share/fonts/**/DejaVuSans-Bold.ttf', recursive=True))[0]
YEL, INK, WHITE = (255, 201, 60), (18, 14, 24), (255, 255, 255)
def grade(im): im = ImageEnhance.Contrast(im).enhance(1.12); im = ImageEnhance.Color(im).enhance(1.15); return im
def vignette(im, k=0.55):
    w, h = im.size; m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m); d.ellipse((-w * 0.25, -h * 0.25, w * 1.25, h * 1.25), fill=255); m = m.filter(ImageFilter.GaussianBlur(w * 0.12))
    dark = Image.new('RGB', (w, h), (10, 8, 16)); return Image.composite(im, Image.blend(im, dark, k), m)
def crop_fit(spec, size):
    im = Image.open(spec['img']).convert('RGB'); x0, y0, x1, y1 = spec['crop']; return grade(im.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS))
def text_block(im, lines, hi, x, y, size, align='left', maxw=None):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(FONT, size); yy = y; boxes = []
    for ln in lines:
        w = d.textlength(ln, font=f)
        if maxw and w > maxw: f2 = ImageFont.truetype(FONT, int(size * maxw / w)); w = d.textlength(ln, font=f2)
        else: f2 = f
        xx = x if align == 'left' else x - w / 2
        col = YEL if any(h == ln for h in hi) else WHITE
        d.text((xx, yy), ln, font=f2, fill=col, stroke_width=max(6, size // 9), stroke_fill=INK); boxes.append((xx, yy, w)); yy += int(f2.size * 1.02)
    return boxes, yy
# ---- 16:9 thumbnail 1280x720
W, H = 1280, 720; im = crop_fit(S['bg'], (W, H))
if S.get('inset'):
    ins = crop_fit(S['inset'], (int(W * 0.46), H)); m = Image.new('L', ins.size, 0); d = ImageDraw.Draw(m); iw = ins.size[0]
    d.polygon([(iw * 0.18, 0), (iw, 0), (iw, H), (0, H)], fill=255); edge = Image.new('L', ins.size, 0); de = ImageDraw.Draw(edge); de.line([(iw * 0.18, 0), (0, H)], fill=255, width=14)
    x = W - iw; im.paste(ins, (x, 0), m); bar = Image.new('RGB', ins.size, YEL); im.paste(bar, (x, 0), edge)
im = vignette(im, 0.45)
top = S.get('text_pos') == 'top'; g = Image.new('L', (W, H), 0); dg = ImageDraw.Draw(g)
for i in range(H // 2): dg.line([(0, i if top else H - i), (W, i if top else H - i)], fill=int(150 * (1 - i / (H / 2)) ** 1.6))
im = Image.composite(Image.new('RGB', (W, H), (8, 6, 12)), im, g)
boxes, yy = text_block(im, S['lines'], S.get('hi', []), 54, 40 if top else H - 60 - len(S['lines']) * 118, 116, maxw=W * (0.56 if S.get('inset') else 0.9))
ImageDraw.Draw(im).rectangle((56, yy + 6, 56 + 170, yy + 20), fill=YEL)
im.save(os.path.join(S['out_dir'], 'thumbnail_1280x720.png'))
# ---- vertical cover 1080x1920 (text in the upper third, clear of the bottom UI zone)
W2, H2 = 1080, 1920; cv = crop_fit(S['cover'], (W2, H2)); cv = vignette(cv, 0.35)
g = Image.new('L', (W2, H2), 0); dg = ImageDraw.Draw(g)
for i in range(700): dg.line([(0, i), (W2, i)], fill=int(165 * (1 - i / 700) ** 1.5))
cv = Image.composite(Image.new('RGB', (W2, H2), (8, 6, 12)), cv, g)
boxes, yy = text_block(cv, S['lines'], S.get('hi', []), W2 / 2, 210, 128, align='center', maxw=W2 * 0.86)
ImageDraw.Draw(cv).rectangle((W2 / 2 - 110, yy + 10, W2 / 2 + 110, yy + 26), fill=YEL)
cv.save(os.path.join(S['out_dir'], 'cover_1080x1920.png'))
print('ok', S['out_dir'])
