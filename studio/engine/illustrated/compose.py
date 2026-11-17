"""ILLUSTRATED SHORT COMPOSER (new studio style, 2026-11-17). Turns a shot list of generated stills / clips into a finished 1080x1920 Short.
usage: python3 compose.py shotlist.json out.mp4
shotlist.json:
{ "fps": 30, "base": "<folder the image/video paths are relative to>",
  "audio": "<optional mix.wav>", "captions": "<optional .ass>",
  "shots": [
    {"type": "still",  "image": "a.png", "dur": 1.0, "zoom": [1.02, 1.06], "center": [0.5, 0.42], "snap": false},
    {"type": "insert", "image": "phone.png", "dur": 1.2, "zoom": [1.1, 1.15], "center": [0.5, 0.48],
       "screen": [x0, y0, x1, y1], "msg": {"clock": "3:09 AM", "sender": "Me", "avatar": "face.png", "lines": ["Don't open", "the door", "at 3:17."], "at": 0.3, "typing_at": 0.9}},
    {"type": "clip",   "video": "turn.mp4", "dur": 2.5, "offset": 0.0, "speed": 2.0, "zoom": [1.09, 1.02], "center": [0.5, 0.4]} ] }
Rules (from the style tests): no film grain (it smears line art); light unsharp; stills generated at 2k medium (≈1152x2048) so frames are never upscaled;
all on-screen text is drawn here (exact, readable at phone size), never generated. "snap": true = a quick punch-in at the start of the shot (shock beats)."""
import json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont
W, H = 1080, 1920
F = lambda w, s: ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{w}.otf', s)
ss = lambda x: x * x * (3 - 2 * x); cl = lambda x: max(0.0, min(1.0, x))
def frame_of(img, zoom, cx, cy):
    w, h = img.size; s = max(W / w, H / h); cw, ch = W / (s * zoom), H / (s * zoom)   # cover-fit, then zoom
    x0 = min(max(0, cx * w - cw / 2), w - cw); y0 = min(max(0, cy * h - ch / 2), h - ch)
    return img.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
def draw_message(img, box, m, t, base):
    """exact messaging UI on a blank phone screen (box in the still's pixels); drawn at 4x then downsampled"""
    x0, y0, x1, y1 = box; S = 4; sw, sh = (x1 - x0) * S, (y1 - y0) * S
    ui = Image.new('RGBA', (sw, sh), (13, 16, 32, 255)); d = ImageDraw.Draw(ui)
    d.text((sw / 2, 70), m.get('clock', ''), font=F('Bold', 46), fill=(232, 236, 248), anchor='mm')
    d.rectangle((0, 120, sw, 330), fill=(27, 32, 54))
    if m.get('avatar'):
        av = Image.open(os.path.join(base, m['avatar'])).convert('RGB').resize((150, 150), Image.LANCZOS); mk = Image.new('L', (150, 150), 0); ImageDraw.Draw(mk).ellipse((0, 0, 149, 149), fill=255); ui.paste(av, (sw // 2 - 75, 140), mk)
    d.text((sw / 2, 312), m.get('sender', ''), font=F('Bold', 44), fill=(255, 255, 255), anchor='ms')
    pop = cl((t - m.get('at', 0.3)) / 0.18); k = 1 + 0.12 * math.sin(math.pi * pop) if pop < 1 else 1
    if pop > 0:
        lines = m['lines']; bh0 = 70 + 124 * len(lines); b = Image.new('RGBA', (int(sw * 0.9), bh0), (0, 0, 0, 0)); bd = ImageDraw.Draw(b)
        bd.rounded_rectangle((0, 0, b.width - 1, bh0 - 1), 56, fill=(233, 236, 244))
        for i, s in enumerate(lines): bd.text((44, 88 + i * 124), s, font=F('ExtraBold', 104), fill=(16, 19, 31), anchor='lm')
        bw, bh = int(b.width * pop * k), int(bh0 * pop * k)
        if bw > 10: ui.alpha_composite(b.resize((bw, bh), Image.LANCZOS), (int(sw * 0.05), 390))
    if m.get('typing_at') is not None and t >= m['typing_at']:
        dd = int((t - m['typing_at']) * 4) % 3; yy = 390 + 70 + 124 * len(m['lines']) + 60; d.rounded_rectangle((54, yy, 300, yy + 120), 60, fill=(42, 49, 80))
        for i in range(3): d.ellipse((112 + i * 66 - 18, yy + 42, 112 + i * 66 + 18, yy + 78), fill=(255, 255, 255) if i == dd else (125, 134, 168))
    d.rounded_rectangle((30, sh - 130, sw - 30, sh - 40), 45, fill=(27, 32, 54)); d.text((80, sh - 85), 'Message', font=F('Regular', 40), fill=(106, 114, 144), anchor='lm')
    ui = ui.resize((x1 - x0, y1 - y0), Image.LANCZOS); mk = Image.new('L', ui.size, 0); ImageDraw.Draw(mk).rounded_rectangle((0, 0, ui.width - 1, ui.height - 1), 26, fill=255)
    out = img.copy(); out.paste(ui.convert('RGB'), (x0, y0), mk); return out
def main():
    J = json.load(open(sys.argv[1])); out = sys.argv[2]; fps = J.get('fps', 30); base = J.get('base', os.path.dirname(os.path.abspath(sys.argv[1])))
    tmp = tempfile.mkdtemp(); cache = {}; n = 0
    for sh in J['shots']:
        frames = int(round(sh['dur'] * fps)); z0, z1 = sh.get('zoom', [1.0, 1.0]); cx, cy = sh.get('center', [0.5, 0.5])
        if sh['type'] == 'clip':
            cd = os.path.join(tmp, f'clip{n}'); os.makedirs(cd); subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', os.path.join(base, sh['video']), os.path.join(cd, 'c%04d.png')], check=True)
            cf = sorted(os.listdir(cd)); cfps = float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', os.path.join(base, sh['video'])], capture_output=True, text=True).stdout.strip().split('/')[0]) / float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', os.path.join(base, sh['video'])], capture_output=True, text=True).stdout.strip().split('/')[1])
        else:
            img = cache.setdefault(sh['image'], Image.open(os.path.join(base, sh['image'])).convert('RGB'))
        for i in range(frames):
            u = i / max(1, frames - 1); t = i / fps
            z = (z0 + (z1 - z0) * (1 - (1 - cl(t / 0.13)) ** 3)) if sh.get('snap') else z0 + (z1 - z0) * ss(u)
            if sh['type'] == 'clip':
                ci = min(len(cf) - 1, int((sh.get('offset', 0) + t * sh.get('speed', 1.0)) * cfps)); src = Image.open(os.path.join(cd, cf[ci])).convert('RGB')
            elif sh['type'] == 'insert': src = draw_message(img, sh['screen'], sh['msg'], t, base)
            else: src = img
            fr = frame_of(src, z, cx, cy).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2)); fr.save(os.path.join(tmp, f'f{n:05d}.png')); n += 1
    cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(tmp, 'f%05d.png')]
    if J.get('audio'): cmd += ['-i', os.path.join(base, J['audio'])]
    vf = 'format=yuv420p' + (f",subtitles={os.path.join(base, J['captions'])}" if J.get('captions') else '')
    cmd += ['-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation', '-movflags', '+faststart']
    if J.get('audio'): cmd += ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest']
    subprocess.run(cmd + [out], check=True); print('done', out, n, 'frames')
if __name__ == '__main__': main()
