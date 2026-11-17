"""Captions (Bible E.1): 1-3 word chunks spread over VOICED time of each line, amber key words, robber lines in quotes + amber-tinted,
plus the identity card graphic. Output: build/captions.ass"""
import json, subprocess, numpy as np, re
P = json.load(open('plan.json')); SR = 16000
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'build/voice.wav', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768; hop = 160; e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)]); voiced = 20 * np.log10(e) > -37
KEY = {'gun', 'head', 'hundred', 'grand', "doesn't", 'know', 'down', 'bag', 'me'}
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h}:{m:02d}:{s:05.2f}'
def chunks(text):
    w = text.split(); out = []; i = 0
    while i < len(w):
        n = 3 if len(' '.join(w[i:i + 3])) <= 18 else 2
        if len(w) - (i + n) == 1: n += 1   # never leave a single tiny word alone
        for j in range(i, min(i + n, len(w)) - 1):
            if w[j][-1] in '.!?,': n = j - i + 1; break   # phrases end at punctuation
        out.append(w[i:i + n]); i += n
    return out
ev = []
for c in P['captions']:
    a0, b0 = c['a'], c['b']; fr = np.arange(int(a0 * 100), min(len(voiced), int(b0 * 100)))
    vt = [f / 100 for f in fr if voiced[f]] or [a0, b0]; t0, t1 = vt[0], vt[-1] + 0.12; ch = chunks(c['text']); tot = sum(len(' '.join(k)) for k in ch); t = t0
    for k in ch:
        d = (t1 - t0) * len(' '.join(k)) / tot; words = []
        for w in k:
            bare = re.sub(r'[^a-z\']', '', w.lower()); words.append(r'{\c&H0040D8FF&}' + w + r'{\c&HFFFFFF&}' if bare in KEY and c['who'] == 'N' else w)
        style = 'Robber' if c['who'] == 'R' else 'Cap'; ev.append(f'Dialogue: 0,{ts(t)},{ts(t + d - 0.02)},{style},,0,0,0,,' + ' '.join(words)); t += d
for gfx in P['graphics']:
    a, b = gfx['a'], gfx['b']
    ev.append(f'Dialogue: 1,{ts(a)},{ts(b)},Card,,0,0,0,,' + r'{\move(540,330,540,300,0,350)\fad(250,200)\bord0\shad0\1c&H101010&\1a&H50&\p1}m -330 -70 l 330 -70 330 80 -330 80{\p0}')
    ev.append(f'Dialogue: 2,{ts(a + 0.08)},{ts(b)},Card,,0,0,0,,' + r'{\move(540,290,540,262,0,350)\fad(250,200)\fs58\c&H0040D8FF&}' + gfx['line1'])
    ev.append(f'Dialogue: 2,{ts(a + 0.25)},{ts(b)},Card,,0,0,0,,' + r'{\move(540,352,540,330,0,350)\fad(250,200)\fs38\c&HE6E6E6&}' + gfx['line2'])
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,78,&H00FFFFFF,&H00FFFFFF,&H00141414,&H96000000,-1,0,0,0,100,100,0,0,1,5,2,2,80,140,700,1
Style: Robber,DejaVu Sans,74,&H00B8E6FF,&H00FFFFFF,&H00141414,&H96000000,-1,0,0,0,100,100,0,0,1,5,2,2,80,140,700,1
Style: Card,DejaVu Sans,58,&H00FFFFFF,&H00FFFFFF,&H00141414,&H64000000,-1,0,0,0,100,100,1,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open('build/captions.ass', 'w').write(head + '\n'.join(ev) + '\n'); print(len(ev), 'events')
