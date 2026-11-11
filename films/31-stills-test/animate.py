# Stills test: approved Higgsfield keyframes (film 26) brought to life in code, zero credits.
# Per shot: depth-based 3D parallax camera (Depth Anything V2 depth), light that lives (lamp/candle flicker,
# phone-screen glow), drifting dust in the light, soft bloom, grain, vignette, serif captions. -> out/video.mp4
import numpy as np, cv2, subprocess, os
from PIL import Image, ImageDraw, ImageFont
H = os.path.dirname(os.path.abspath(__file__)); W_, H_ = 1080, 1920; FPS = 30; rng = np.random.default_rng(31)
FONT = f'{H}/../26-same-room-ai/fonts/PlayfairDisplay-Italic.ttf'
# name, dur, camera move (tx0,ty0,tx1,ty1 parallax shift; z0,z1 zoom; depth-zoom), lights, captions
SHOTS = [
 dict(k='k1', dur=3.4, t=(-.018, 0, .018, 0), z=(1.04, 1.10), dz=.05, warm=.09, phone=0, dust=1, cap=[(.4, 3.2, 'We used to talk until 3 AM.')]),
 dict(k='k2', dur=3.4, t=(0, -.01, 0, .01), z=(1.12, 1.03), dz=.04, warm=.05, phone=.22, dust=0, cap=[(.5, 3.2, 'Now we say goodnight to our screens.')]),
 dict(k='k5', dur=3.6, t=(.03, 0, -.02, 0), z=(1.05, 1.11), dz=.08, warm=.05, phone=.25, dust=0, cap=[(.6, 3.4, 'Strangers in the same room.')]),
 dict(k='k9b', dur=4.0, t=(0, .012, 0, -.006), z=(1.03, 1.12), dz=.06, warm=.10, phone=0, dust=1, cap=[(.5, 3.7, 'Put it down.'), (1.1, 3.7, 'They’re still here.')]),
]
XF = .6  # crossfade
def ease(x): return x * x * (3 - 2 * x)
def load(k):
    im = cv2.cvtColor(cv2.imread(f'{H}/gen/{k}.png'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    im = cv2.resize(im, (W_, H_), interpolation=cv2.INTER_LANCZOS4)
    d = cv2.resize(cv2.imread(f'{H}/gen/{k}_d.png', cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535, (W_, H_))
    d = cv2.dilate(d, np.ones((9, 9), np.uint8)); d = cv2.GaussianBlur(d, (0, 0), 6)   # grow near edges -> less tearing
    lum = im @ [.3, .59, .11]
    warm = np.clip((im[..., 0] - im[..., 2] - .15) * 3, 0, 1) * np.clip((lum - .45) * 3, 0, 1); warm = cv2.GaussianBlur(warm, (0, 0), 25)
    blue = np.clip((im[..., 2] - im[..., 0] - .05) * 4, 0, 1) * np.clip((lum - .25) * 3, 0, 1); blue = cv2.GaussianBlur(blue, (0, 0), 30)
    return im, d, warm / max(warm.max(), 1e-3), blue / max(blue.max(), 1e-3)
yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32); cxn = (xx - W_ / 2) / W_; cyn = (yy - H_ / 2) / W_
vig = 1 - .38 * np.clip(np.sqrt(cxn ** 2 + (cyn * .62) ** 2) * 1.5 - .25, 0, 1) ** 1.6
def flick(t, seed, rate=7): return sum(np.sin(2 * np.pi * (rate * (.37 + .29 * k)) * t + seed * (k + 1)) / (k + 1) for k in range(4)) / 2.1
def dust_init(n=70): return [dict(x=rng.uniform(0, W_), y=rng.uniform(0, H_), r=rng.uniform(1.2, 4.5), v=rng.uniform(4, 18), ph=rng.uniform(0, 6.3), a=rng.uniform(.25, .8)) for _ in range(n)]
def render_shot(S, t):
    im, d, warm, blue = S['_c']; u = ease(min(1, t / S['dur']))
    tx = S['t'][0] + (S['t'][2] - S['t'][0]) * u; ty = S['t'][1] + (S['t'][3] - S['t'][1]) * u; z = S['z'][0] + (S['z'][1] - S['z'][0]) * u
    zz = z * (1 + S['dz'] * u * d)                       # near things grow faster as the camera moves in
    mx = W_ / 2 + (xx - W_ / 2) / zz - tx * W_ * (d - .4); my = H_ / 2 + (yy - H_ / 2) / zz - ty * W_ * (d - .4)
    f = cv2.remap(im, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    wm = cv2.remap(warm, mx, my, cv2.INTER_LINEAR); bm = cv2.remap(blue, mx, my, cv2.INTER_LINEAR)
    T = S['_t0'] + t
    f = f * (1 + S['warm'] * wm[..., None] * flick(T, 1.3, 5) * np.array([1, .85, .6]))
    if S['phone']: f = f + S['phone'] * bm[..., None] * (.5 + .5 * flick(T, 4.1, 2.2)) * np.array([.35, .55, 1]) * .5
    if S['dust']:
        lay = np.zeros((H_, W_), np.float32)
        for p in S['_dust']:
            x = (p['x'] + 14 * np.sin(T * .5 + p['ph']) - tx * W_ * .6) % W_; y = (p['y'] - p['v'] * T) % H_
            cv2.circle(lay, (int(x), int(y)), max(1, int(p['r'])), p['a'], -1, cv2.LINE_AA)
        lay = cv2.GaussianBlur(lay, (0, 0), 1.6) * (.25 + 1.2 * cv2.GaussianBlur(wm, (0, 0), 60))
        f = f + lay[..., None] * np.array([1, .85, .6]) * .35
    return f
def finish(f, i):
    b = cv2.GaussianBlur(np.clip(f - .7, 0, 1), (0, 0), 22); f = f + b * .45             # bloom on highlights
    f = f * vig[..., None]; f = f + rng.normal(0, .018, (H_ // 2, W_ // 2, 1)).repeat(2, 0).repeat(2, 1).astype(np.float32)
    return np.clip(f, 0, 1)
font_cache = {}
def caption(img, text, alpha, y, size=60):
    if alpha <= 0: return img
    fnt = font_cache.setdefault(size, ImageFont.truetype(FONT, size)); ov = Image.new('RGBA', img.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(ov)
    w = dr.textlength(text, font=fnt); x = (W_ - w) / 2
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((x, y + 4), text, font=fnt, fill=(0, 0, 0, int(190 * alpha)))
    from PIL import ImageFilter; sh = sh.filter(ImageFilter.GaussianBlur(6))
    dr.text((x, y), text, font=fnt, fill=(255, 255, 255, int(255 * alpha)))
    return Image.alpha_composite(Image.alpha_composite(img, sh), ov)
t0 = 0
for S in SHOTS: S['_c'] = load(S['k']); S['_t0'] = t0; S['_dust'] = dust_init(); t0 += S['dur'] - XF
TOT = t0 + XF; N = int(TOT * FPS); os.makedirs(f'{H}/out', exist_ok=True)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W_}x{H_}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{H}/out/video.mp4'], stdin=subprocess.PIPE)
for i in range(N):
    T = i / FPS; acc = None; caps = []
    for S in SHOTS:
        lt = T - S['_t0']
        if lt < -1e-6 or lt > S['dur']: continue
        a = min(1, lt / XF) if S is not SHOTS[0] else 1
        fr = render_shot(S, lt); acc = fr if acc is None else acc * (1 - a) + fr * a
        for c0, c1, txt in S['cap']:
            al = np.clip(min((lt - c0) / .5, (c1 - lt) / .5), 0, 1)
            if al > 0: caps.append((txt, al))
    acc = finish(acc, i); acc *= min(1, T / .5, (TOT - T) / .8)
    img = Image.fromarray((acc * 255).astype(np.uint8)).convert('RGBA')
    for j, (txt, al) in enumerate(caps): img = caption(img, txt, al, 1430 + 78 * j if len(caps) > 1 else 1450)
    ff.stdin.write(np.asarray(img.convert('RGB')).tobytes())
    if i % 60 == 0: print(i, '/', N, flush=True)
ff.stdin.close(); ff.wait(); print('video', TOT)
