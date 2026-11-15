"""Conform the locked v2 edit to the recorded narration (run after audio/narration_raw.wav exists).
Every shot keeps its content and order; each shot's length follows its narration line (picture cut to the voice).
Writes build/retime.json (read by build_story.py), audio/voice_track.wav, build/cues.json + build/sfx.wav, build/music.wav, captions.ass."""
import json, os, subprocess, wave, numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__))); SR = 48000
w = wave.open('audio/narration_raw.wav'); raw = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; w.close()
# speech segments (>=0.25 s pauses) measured on the recording; line -> segment indices
SEG = [(0.04, 2.76), (3.18, 4.61), (4.97, 8.77), (9.14, 11.34), (11.72, 13.71), (14.06, 15.22), (15.75, 18.26), (18.54, 20.47), (20.91, 24.72), (25.07, 26.86), (27.17, 28.51),
       (28.91, 30.18), (30.67, 31.06), (31.68, 32.09), (32.65, 33.48), (33.9, 34.55), (35.03, 36.35), (36.78, 37.31), (37.57, 41.22), (41.52, 43.54), (43.8, 45.78)]
LINES = [([0], 'This warship is being lifted out of the sea…'), ([1], '…by one old man.'), ([2], 'Rome had sent sixty warships to take the city of Syracuse.'),
         ([3, 4], 'But Syracuse had Archimedes — a mathematician in his seventies.'), ([5], "And he wasn't worried."), ([6], 'The Romans rowed right up under the walls…'),
         ([7], '…exactly where he wanted them.'), ([8], 'Then a giant wooden arm swung out over the water.'), ([9], 'An iron claw dropped…'), ([10], '…and bit into the ship.'),
         ([11], 'And it began to pull.'), ([12, 13, 14], 'Up. Up. Out of the sea.'), ([15, 16], 'And then… the claw released it.'),
         ([17, 18], 'Soon, even a rope hanging over the wall made Roman soldiers panic.'), ([19], 'Rome had sixty warships.'), ([20], 'Syracuse had Archimedes.')]
TEMPO = {i: 1.08 for i in range(16)}; TEMPO.update({11: 1.04, 12: 1.04, 15: 1.04})   # dramatic lines untouched
def clip(i):
    idx = LINES[i][0]; a, b = SEG[idx[0]][0] - 0.03, SEG[idx[-1]][1] + 0.06; x = raw[int(a * SR):int(b * SR)]
    if i == 3:   # tighten the comma pause in line 4 to a breath
        p0, p1 = SEG[3][1] - a, SEG[4][0] - a; x = np.concatenate([x[:int((p0 + 0.1) * SR)], x[int((p1 - 0.1) * SR):]])
    if TEMPO[i] != 1.0:
        open('/tmp/_i.raw', 'wb').write((x * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '/tmp/_i.raw', '-af', f'atempo={TEMPO[i]}', '-f', 's16le', '/tmp/_o.raw'], check=True)
        x = np.frombuffer(open('/tmp/_o.raw', 'rb').read(), np.int16).astype(np.float32) / 32768
    return x
C = [clip(i) for i in range(16)]; D = [len(c) / SR for c in C]
# ---- picture cut to the voice: shot lengths from their lines (old shot list order, 21 shots)
st, sh = {}, []   # line start times, shot (a, b)
def shot(a, b): sh.append((round(a, 3), round(b, 3))); return b
t = 0.0
st[0] = 0.03;               t = shot(t, st[0] + D[0] + 0.02)                 # 01 hook (cut to him on "by")
st[1] = t + 0.06;           t = shot(t, st[1] + D[1] + 0.05)                 # 02 old man
t = shot(t, t + 0.4)                                                          # 03 rewind
st[2] = t + 0.08;           t = shot(t, st[2] + D[2] + 0.08)                  # 04 fleet
st[3] = t + 0.08;           t = shot(t, st[3] + D[3] + 0.05)                 # 05 sand tray
st[4] = t + 0.05;           t = shot(t, st[4] + D[4] + 0.3)                  # 06 smirk
st[5] = t + 0.08;           t = shot(t, st[5] + D[5] + 0.03)                  # 07 grinning Romans
st[6] = t + 0.05;           t = shot(t, st[6] + D[6] + 0.4)                 # 08 signal (+ creak)
st[7] = t + 0.08;           t = shot(t, st[7] + D[7] + 0.02)                  # 09 arm swings out
st[8] = t + 0.12; st[9] = st[8] + D[8] + 0.08; t = shot(t, st[9] + 0.7)     # 10 claw drops ... bites
t = shot(t, st[9] + D[9] + 0.2)                                              # 11 sailor's grin fades
st[10] = t + 0.05;          t = shot(t, st[10] + D[10] + 0.2)                # 12 chain taut
st[11] = t + 0.03;          t = shot(t, st[11] + D[11] + 0.2)                # 13 the lift
t = shot(t, t + 0.8)                                                          # 14 silence: terror
st[12] = t + 0.05;          t = shot(t, st[12] + 1.0)                       # 15 'And then...' (ship hangs)
t = shot(t, st[12] + D[12] + 0.1)                                            # 15b claw opens on 'released it'
t = shot(t, t + 2.2)                                                          # 16 fall + crash (no voice)
st[13] = t + 0.15;          t = shot(t, t + 1.6)                             # 17 rope POV
t = shot(t, st[13] + D[13] + 0.15)                                            # 18 panic
st[14] = t + 0.1;           t = shot(t, st[14] + D[14] + 0.12)               # 19 fleet holds back
st[15] = t + 0.1;           t = shot(t, st[15] + D[15] + 1.2)                # 20 final image
DUR = round(t, 2); json.dump({'shots': sh, 'duration': DUR}, open('build/retime.json', 'w'))
# voice track
tr = np.zeros(int(DUR * SR) + SR)
for i, c in enumerate(C): a = int(st[i] * SR); tr[a:a + len(c)] += c
tr = tr[:int(DUR * SR)]; ww = wave.open('audio/voice_track.wav', 'wb'); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes((np.clip(tr, -1, 1) * 32767).astype(np.int16).tobytes()); ww.close()
# ---- remap the animatic's SFX cue times (old shot timing) onto the new cut
old = [s for s in json.load(open('story_animatic_timing.json'))]
def remap(x):
    for (oa, ob), (na, nb) in zip(old, sh):
        if oa <= x < ob: return na + (x - oa) / (ob - oa) * (nb - na)
    return sh[-1][1]
E = json.load(open('build/cues_animatic.json'))['events']
for e in E:
    e['t'] = round(remap(e['t']), 3)
    if 'end' in e: e['end'] = round(remap(e['end']), 3)
    if 'peak' in e: e['peak'] = round(remap(e['peak']), 3)
json.dump({'duration': DUR, 'events': E}, open('build/cues.json', 'w'))
subprocess.run(['python3', '../../engine/tools/sfxlib.py', 'build/cues.json', 'build/sfx.wav', 'sea,wind'], check=True)
crash = remap(30.15); off = 45.0 - crash   # score peak (~45.0 s into the cue) on the crash
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{off:.2f}', '-i', '../claw-of-syracuse/audio/music.mp3', '-t', str(DUR), '-af', f'afade=t=in:d=0.3,afade=t=out:st={DUR - 1.4:.2f}:d=1.4', '-ar', '48000', '-ac', '2', 'build/music.wav'], check=True)
# ---- captions: 1-3 word chunks timed by syllable share within each line's clip; key words highlighted
def syl(wd): import re; return max(1, len(re.findall(r'[aeiouy]+', wd.lower())))
KEY = {'lifted', 'one', 'old', 'man.', 'sixty', 'warships', 'Archimedes', "wasn't", 'worried.', 'exactly', 'giant', 'wooden', 'arm', 'iron', 'claw', 'bit', 'pull.', 'Up.', 'released', 'rope', 'panic.', 'Syracuse', 'Archimedes.'}
ts = lambda x: f'0:{int(x // 60):02d}:{x % 60:05.2f}'; ev = []; raw_ev = []
FACE = [sh[1], sh[5], sh[7], sh[10]]   # tight face close-ups: captions go above the head instead of across the face
style_at = lambda x: 'CapHi' if any(a <= x < b for a, b in FACE) else 'Cap'
for i, (_, text) in enumerate(LINES):
    words = [x.replace('§', '\u00a0') for x in text.replace(' —', '§—').split()]; tot = sum(syl(x) for x in words); acc = 0; chunk = []
    # voiced intervals of this line's clip: words are spread over speaking time only (pauses inside a line are skipped)
    c = C[i]; win = int(0.02 * SR); e = np.sqrt(np.convolve(c ** 2, np.ones(win) / win, 'same')); v = e > 0.012
    iv = []; k = 0
    while k < len(v):
        if v[k]:
            j = k
            while j < len(v) and (v[j] or (j + int(0.15 * SR) < len(v) and v[j:j + int(0.15 * SR)].any())): j += 1
            iv.append((k / SR, j / SR)); k = j
        else: k += 1
    iv = [q for q in iv if q[1] - q[0] > 0.06] or iv; vt = sum(b - a for a, b in iv)
    def at_voiced(f):   # fraction of voiced time -> clip time
        r = f * vt
        for a, b in iv:
            if r <= b - a: return a + r
            r -= b - a
        return iv[-1][1]
    # phrases split at punctuation; if they match the voiced intervals one-to-one, pin each phrase to its own interval
    ph, cur = [], []
    for wd in words:
        cur.append(wd)
        if wd.endswith(('.', ',', '…', '—')): ph.append(cur); cur = []
    if cur: ph.append(cur)
    if len(ph) == len(iv) and len(iv) > 1:
        bounds = []   # syllable fraction where each phrase starts
        cum = 0
        for q in ph: bounds.append(cum / tot); cum += sum(syl(x) for x in q)
        bounds.append(1.0)
        def at_voiced(f):
            for k in range(len(iv)):
                if f <= bounds[k + 1] + 1e-9:
                    u = (f - bounds[k]) / max(1e-9, bounds[k + 1] - bounds[k]); return iv[k][0] + u * (iv[k][1] - iv[k][0])
            return iv[-1][1]
    T = lambda f: st[i] + at_voiced(f); cs = T(0)
    for j, wd in enumerate(words):
        chunk.append(wd); acc += syl(wd)
        short_last = j == len(words) - 2 and len(words[-1]) <= 3   # keep a tiny final word ('it.') with its phrase
        if (len(chunk) >= 3 and not short_last) or len(chunk) == 4 or j == len(words) - 1 or wd.endswith(('.', ',', '…', '—')) or (len(chunk) == 2 and syl(wd) > 2):
            ce = T(acc / tot) if acc < tot else st[i] + iv[-1][1]; txt = ' '.join(('{\\c&H0040D8FF&}' + x + '{\\c&HFFFFFF&}') if x.split('\u00a0')[0].strip('…') in KEY or x in KEY else x for x in chunk)
            raw_ev.append([cs, ce + 0.05, txt]); chunk = []; cs = T(min(1.0, acc / tot + 1e-3))
for k, (a, b, txt) in enumerate(raw_ev):   # never let two chunks overlap (they would stack)
    if k + 1 < len(raw_ev): b = min(b, raw_ev[k + 1][0])
    ev.append(f'Dialogue: 0,{ts(a)},{ts(b)},{style_at((a + b) / 2)},,0,0,0,,{txt}')
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,76,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,1,0,1,6,3,2,130,130,700,1
Style: CapHi,DejaVu Sans,76,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,1,0,1,6,3,2,130,130,1240,1
Style: Note,DejaVu Sans,40,&H00F2F2F2,&H00FFFFFF,&H64000000,&H64000000,1,0,0,0,100,100,1,0,3,10,0,8,90,90,215,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
notes = [f"Dialogue: 0,{ts(sh[8][0])},{ts(sh[12][1])},Note,,0,0,0,,RECONSTRUCTION · exact design unknown"]
open('captions.ass', 'w').write(hdr + '\n'.join(ev + notes) + '\n')
print('duration', DUR); print('line starts', {i + 1: round(v, 2) for i, v in st.items()}); print('shots', sh)
