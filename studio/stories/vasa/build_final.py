"""Episode 2 (Vasa) final conform: the recorded Grady narration (audio/narration_raw.wav) is laid line by line onto the approved
animation. Each line starts on its planned picture beat (world time W) or as soon as the previous line has finished (plus its
natural pause), whichever is later; story.timeMap maps video time -> animation time so picture waits for the voice (gentle slow
motion where a line runs long; the silent beats like the stability-test runs keep their full length).
Writes: build/timeline.json (timeMap + line placements, read by build_story.py), audio/voice_track.wav, captions.ass, build/cues.json."""
import json, subprocess, wave, re, numpy as np
TEMPO = 1.05   # as Episode 1 (Bible D.1): a slightly brisker read, natural pitch (atempo)
SR = 44100
# line spans in narration_raw.wav (seconds): tools/align.py + manual fix of lines 7-9 from the detected pauses (silencedetect -38 dB)
SPANS = [(0.0, 2.755), (3.089, 5.199), (5.513, 9.491), (9.772, 13.627), (13.925, 17.388), (17.809, 19.075), (19.52, 22.935), (23.202, 25.093), (25.539, 27.232),
         (27.635, 29.937), (30.21, 32.304), (32.584, 34.106), (34.767, 37.595), (38.065, 39.366), (39.695, 41.851), (42.145, 46.593), (46.894, 48.32), (48.647, 49.576)]
TEXT = [l.strip() for l in open('build/phrases.txt') if l.strip()]
W = [0.2, 2.7, 4.2, 7.0, 13.9, 17.4, 21.1, 24.2, 26.0, 31.0, 33.6, 35.6, 37.2, 39.6, 41.0, 42.8, 46.0, 48.2]   # planned picture beats (animation time)
W_END = 50.4
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/narration_raw.wav', '-af', f'atempo={TEMPO}', '-ar', str(SR), '-ac', '1', 'build/narr_t.wav'], check=True)
with wave.open('build/narr_t.wav') as f: narr = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
spans = [(a / TEMPO, b / TEMPO) for a, b in SPANS]; dur = [b - a for a, b in spans]
V = []; prev_end = 0
for i, w in enumerate(W):
    gap = (spans[i][0] - spans[i - 1][1]) if i else 0
    v = w if i == 0 else max(w + (V[-1] - W[i - 1]), prev_end + max(0.25, gap)); V.append(round(v, 3)); prev_end = v + dur[i]
V_END = round(max(V[-1] + (W_END - W[-1]), prev_end + 1.2), 3)
TM = [[0, 0]] + [[v, w] for v, w in zip(V, W)] + [[V_END, W_END]]
json.dump({'timeMap': TM, 'duration': V_END, 'lines': [{'text': t, 'v': v, 'dur': round(d, 3)} for t, v, d in zip(TEXT, V, dur)]}, open('build/timeline.json', 'w'), indent=1)
def w2v(w):   # animation time -> video time (inverse of the piecewise-linear map)
    for (v0, w0), (v1, w1) in zip(TM, TM[1:]):
        if w <= w1: return v0 + (v1 - v0) * (w - w0) / max(1e-6, (w1 - w0))
    return TM[-1][0]
# voice track: each line clip at its video time
N = int((V_END + 0.5) * SR); trk = np.zeros(N, np.float32)
for (a, b), v in zip(spans, V):
    c = narr[int(max(0, a - 0.04) * SR):int((b + 0.09) * SR)].copy(); fl = int(0.01 * SR); c[:fl] *= np.linspace(0, 1, fl); c[-fl:] *= np.linspace(1, 0, fl)
    i = int(max(0, v - 0.04) * SR); trk[i:i + len(c)] += c[:N - i]
with wave.open('audio/voice_track.wav', 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(trk, -1, 1) * 32767).astype(np.int16).tobytes())
# captions: the Episode 1 style (Bible E.1): short chunks spread over the line's voiced time by syllables, ~36% from the bottom
def syl(wd): return max(1, len(re.findall(r'[aeiouy]+', wd.lower())))
def ts(x): return f'{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}'
HI = {'sank', 'first', 'voyage', 'two', 'gun', 'decks', 'sixty-four', 'thirty', 'test', 'anyway', 'gunports', 'open', 'died', 'punished', 'twenty', 'minutes', '333', 'years', 'back', 'whole', 'king'}
ev = []
for (t, v, d) in zip(TEXT, V, dur):
    words = t.split(); chunks = []; cur = []
    for wd in words:
        cur.append(wd)
        if len(cur) >= 3 or re.search(r'[.,:…]$', wd): chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    tot = sum(syl(w) for c in chunks for w in c); t0 = v
    for c in chunks:
        dd = d * sum(syl(w) for w in c) / tot
        txt = ' '.join(('{\\c&H0040D8FF&}' + w + '{\\c&HFFFFFF&}') if re.sub(r'[^a-z0-9-]', '', w.lower()) in HI else w for w in c)
        ev.append(f'Dialogue: 0,{ts(t0)},{ts(t0 + dd)},Cap,,0,0,0,,{txt}'); t0 += dd
NOTES = [(4.2, 6.9, 'STOCKHOLM · 1628'), (18.8, 20.9, '10 AUGUST 1628'), (45.2, 47.9, '1961'), (4.2, 6.9, None)]
for a, b, x in NOTES:
    if x: ev.append(f'Dialogue: 0,{ts(w2v(a))},{ts(w2v(b))},Note,,0,0,0,,{x}')
ev.append(f'Dialogue: 0,{ts(w2v(7.0))},{ts(w2v(9.3))},Tag,,0,0,0,,Reconstruction')
hdr = """[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,76,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,1,0,1,6,3,2,130,130,700,1
Style: Note,DejaVu Sans,44,&H00F2F2F2,&H00FFFFFF,&H64000000,&H64000000,1,0,0,0,100,100,2,0,3,10,0,8,90,90,215,1
Style: Tag,DejaVu Sans,30,&H00E0E0E0,&H00FFFFFF,&H80000000,&H80000000,0,0,0,0,100,100,0,0,3,6,0,9,40,40,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open('captions.ass', 'w').write(hdr + '\n'.join(ev) + '\n')
# SFX cue sheet (animation-time events -> video time)
cues = []; at = lambda w, **k: cues.append({'t': round(w2v(w), 3), **k})
for k in range(3): at(1.0 + k * 0.9, type='creak', dur=1.0, f=180 + k * 30)                      # hook: timber creaks as she leans
at(2.6, type='groan', dur=1.8)
for k, w in enumerate(range(0, 9)): at(4.6 + k * 0.22, type='clunk')                              # gunport lids swing open
for k in range(6): at(5.3 + k * 0.25, type='roll')                                                 # cannons run out
for r in range(4):                                                                                  # the runs: thundering feet + hull groans, bigger each time
    t0 = 9.6 + r * 1.4
    if t0 > 14.45: break
    for s in range(int(min(1.4, 14.45 - t0) / 0.09)): at(t0 + s * 0.09, type='step')
    at(t0 + 0.9, type='groan', dur=1.4 + r * 0.3); at(t0 + 1.0, type='creak', dur=1.0, f=150 + r * 20)
at(14.3, type='whoosh', dur=0.3, hi=True)                                                           # STOP
for k, w in enumerate((19.3, 19.6, 19.9, 20.2)): at(w, type='thud')                               # salute
at(21.4, type='creak', dur=1.8, f=160); at(24.4, type='whoosh', dur=1.2); at(25.0, type='groan', dur=2.2)
at(27.6, type='pour', dur=3.5, decay=0.05); at(28.4, type='pour', dur=3.0, decay=0.05); at(29.0, type='groan', dur=2.5)
at(30.6, type='groan', dur=3.0); at(31.5, type='pour', dur=4.0, decay=0.2); at(32.8, type='creak', dur=2.0, f=120)
for k in range(30): at(40.9 + k * 0.14, type='bubble')
at(45.2, type='pour', dur=4.5, decay=0.15)
for k in range(10): at(46.0 + k * 0.33, type='drip')
json.dump({'duration': V_END, 'events': sorted(cues, key=lambda e: e['t'])}, open('build/cues.json', 'w'))
print('V_END', V_END); print('timeMap', TM)
