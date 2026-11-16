"""Episode 3 final conform (the Episode 2 method): the recorded Grady narration (audio/narration_raw.wav) is laid line by line onto the
approved V2 animation. Each line starts on its planned picture beat (animation time W) or once the previous line has finished, whichever is
later. story.timeMap maps video time -> animation time, so picture waits for voice.
Extra ANCHORS lock key reactions to the exact spoken words: bubble pops on the queries, share cards on "family" / "Strangers", the relationship
insert on its line, the laugh on "the shame starts to fade", the look-up on "would you still dare to ask?".
Writes: build/timeline.json (read by build_story.py), audio/voice_track.wav, captions.ass, build/cues_final.json."""
import json, subprocess, wave, re, numpy as np
TEMPO = 1.05   # Episodes 1-2 standard (Bible D.1): a slightly brisker read, natural pitch
SR = 44100
# line spans in narration_raw.wav (silencedetect -38 dB, d=0.18; one span per script line)
SPANS = [(0.0, 4.765), (4.969, 7.368), (7.682, 13.116), (13.415, 16.184), (16.485, 20.281), (20.631, 22.416), (22.714, 24.352), (24.836, 30.226), (30.504, 33.789), (34.042, 40.201), (40.498, 44.854)]
TEXT = ["At 9:41 tonight, every search you've ever made goes public.", 'For everyone. All at once.', "At first, it's funny. He searched: how to seem interesting on a date.", 'She searched: how to leave a date early.',
        'Then your boss can see it. Your family. Strangers.', 'So people stop searching.', 'Even when they need it most.', 'No one looks up a scary symptom. No one asks how to leave a bad relationship.',
        'Questions that could have helped… go unasked.', "Weeks later, people realize everyone's history is weird… and the shame starts to fade.", 'If every search became public… would you still dare to ask?']
W = [0.2, 4.8, 7.6, 13.2, 16.8, 21.4, 23.4, 25.8, 32.6, 35.8, 42.6]   # planned line starts (animation time)
W_END = 50.0
# (line, raw time of the word, animation beat): picture events locked to words
ANCHORS = [(2, 11.019, 10.3),    # "how to seem…" -> his bubble pops
           (4, 18.313, 18.0),    # "Your family" -> Mom card
           (4, 19.407, 19.4),    # "Strangers" -> Everyone nearby card
           (9, 38.529, 39.2),    # "and the shame starts to fade" -> he relaxes (she is already laughing)
           (10, 43.161, 45.6)]   # "would you still dare to ask?" -> he looks up into camera
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/narration_raw.wav', '-af', f'atempo={TEMPO}', '-ar', str(SR), '-ac', '1', 'build/narr_t.wav'], check=True)
with wave.open('build/narr_t.wav') as f: narr = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
spans = [(a / TEMPO, b / TEMPO) for a, b in SPANS]; dur = [b - a for a, b in spans]
V = []; prev_end = 0
for i, w in enumerate(W):
    gap = (spans[i][0] - spans[i - 1][1]) if i else 0
    v = w if i == 0 else max(w + (V[-1] - W[i - 1]), prev_end + max(0.3, gap)); V.append(round(v, 3)); prev_end = v + dur[i]
V_END = round(max(50.0, prev_end + 2.4), 3)   # 50.0 s cut (fits the 50 s score); at least 2.4 s hold after the last word
pts = [(0.0, 0.0)] + list(zip(V, W)) + [(V[li] + (raw / TEMPO - spans[li][0]), w) for li, raw, w in ANCHORS] + [(V_END, W_END)]
pts.sort(); TM = [list(map(lambda x: round(x, 3), pts[0]))]
for v, w in pts[1:]:
    if v > TM[-1][0] + 0.05 and w > TM[-1][1] + 0.05: TM.append([round(v, 3), round(w, 3)])
    else: print('skip non-monotonic anchor', v, w)
rates = [(round(b[0], 2), round((b[1] - a[1]) / (b[0] - a[0]), 2)) for a, b in zip(TM, TM[1:])]
print('duration', V_END, '\nplayback rate per segment (anim s per video s):', rates)
json.dump({'timeMap': TM, 'duration': V_END, 'lines': [{'text': t, 'v': v, 'dur': round(d, 3)} for t, v, d in zip(TEXT, V, dur)]}, open('build/timeline.json', 'w'), indent=1)
def w2v(w):
    for (v0, w0), (v1, w1) in zip(TM, TM[1:]):
        if w <= w1: return v0 + (v1 - v0) * (w - w0) / max(1e-6, (w1 - w0))
    return TM[-1][0]
def v2w(v):
    for (v0, w0), (v1, w1) in zip(TM, TM[1:]):
        if v <= v1: return w0 + (w1 - w0) * (v - v0) / max(1e-6, (v1 - v0))
    return TM[-1][1]
# voice track
N = int((V_END + 0.5) * SR); trk = np.zeros(N, np.float32)
for (a, b), v in zip(spans, V):
    c = narr[int(max(0, a - 0.04) * SR):int((b + 0.09) * SR)].copy(); fl = int(0.01 * SR); c[:fl] *= np.linspace(0, 1, fl); c[-fl:] *= np.linspace(1, 0, fl)
    i = int(max(0, v - 0.04) * SR); trk[i:i + len(c)] += c[:N - i]
with wave.open('audio/voice_track.wav', 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(trk, -1, 1) * 32767).astype(np.int16).tobytes())
# captions: Episode 1/2 style chunks spread by syllables; placement per shot (approved V2): top over phone inserts and the ending phone, low under faces/bubbles
def syl(wd): return max(1, len(re.findall(r'[aeiouy]+', wd.lower())))
def ts(x): return f'{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}'
def place(w):   # w = animation time at chunk start
    if w < 2.8 or 16.6 <= w < 21.2 or 27.0 <= w < 28.55 or 30.0 <= w < 31.9 or w >= 41.8: return 'top'
    if 7.4 <= w < 16.6 or 35.4 <= w < 41.8 or 25.6 <= w < 27.0 or 28.55 <= w < 30.0 or 31.9 <= w < 33.15: return 'low'   # diner close-ups: keep the eyes clear (final QA)
    return ''
HI = {'9:41', 'public', 'everyone', 'funny', 'boss', 'family', 'strangers', 'stop', 'most', 'symptom', 'relationship', 'unasked', 'weird', 'shame', 'dare'}
ev = []
for (t, v, d) in zip(TEXT, V, dur):
    words = t.split(); chunks = []; cur = []
    for wd in words:
        cur.append(wd)
        if len(cur) >= 3 or re.search(r'[.,:…?]$', wd): chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    tot = sum(syl(w) for c in chunks for w in c); t0 = v
    for c in chunks:
        dd = d * sum(syl(w) for w in c) / tot; pos = place(v2w(t0))
        txt = ' '.join(('{\\c&H003CC9FF&}' + w + '{\\c&HFFFFFF&}') if re.sub(r'[^a-z0-9:]', '', w.lower()) in HI else w for w in c)
        mv = 160 if pos == 'top' else 250 if pos == 'low' else 0
        ev.append(f'Dialogue: 0,{ts(t0)},{ts(t0 + dd)},Cap,,0,0,{mv},,' + ('{\\an8}' if pos == 'top' else '') + txt); t0 += dd
ev.append(f'Dialogue: 0,{ts(0.2)},{ts(w2v(2.9))},Note,,0,0,120,,{{\\an2}}FICTION · WHAT IF?')
hdr = """[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,76,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,1,0,0,0,100,100,1,0,1,6,3,2,130,130,700,1
Style: Note,DejaVu Sans,44,&H00F2F2F2,&H00FFFFFF,&H64000000,&H64000000,1,0,0,0,100,100,2,0,3,10,0,8,90,90,215,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open('captions.ass', 'w').write(hdr + '\n'.join(ev) + '\n')
# SFX: the approved V2 cue sheet (animation time) mapped to video time; the quiet "next day" ambience dip as well
C = json.load(open('build/cues.json'))
cues = [{**e, 't': round(w2v(e['t']), 3)} for e in C['events']]
json.dump({'duration': V_END, 'events': cues, 'quiet': [round(w2v(22.2), 3), round(w2v(35.4), 3)]}, open('build/cues_final.json', 'w'))
print('lines at', V)
