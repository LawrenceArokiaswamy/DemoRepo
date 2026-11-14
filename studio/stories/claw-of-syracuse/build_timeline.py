"""Build the final edit from the recorded narration (run after audio generation).
Places each narration line on its shot, re-times the picture with a world-time map (slow motion where a line needs
more time, never faster than ~1.12x), cuts Titus's line into a lip-sync clip, and writes captions + on-screen labels.
inputs : audio/narration_raw.wav, audio/timing_raw.json (align.py), story_62s.json (storyboard V2 timing, world-time shots)
outputs: audio/voice_track.wav, audio/titus.wav, audio/titus_words.json, story.json (timeMap, shots, dialogue), captions.ass"""
import json, subprocess, wave, numpy as np, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
TEMPO, SR = 1.08, 48000
base = json.load(open('story_62s.json')); T = json.load(open('audio/timing_raw.json')); P = T['phrases']; W = T['words']
w = wave.open('audio/narration_raw.wav'); raw = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; w.close()

def tighten(seg, cap=0.32, thr=0.012):   # shorten long internal pauses to a natural breath
    win = int(0.02 * SR); e = np.sqrt(np.convolve(seg ** 2, np.ones(win) / win, 'same')); quiet = e < thr; out = []; i = 0; n = len(seg)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            keep = min(j - i, int(cap * SR)); out.append(seg[i:i + keep // 2]); out.append(seg[j - keep // 2:j]); i = j
        else:
            j = i
            while j < n and not quiet[j]: j += 1
            out.append(seg[i:j]); i = j
    return np.concatenate(out)
def tempo(x):
    open('/tmp/_in.raw', 'wb').write((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '/tmp/_in.raw', '-af', f'atempo={TEMPO}', '-f', 's16le', '/tmp/_out.raw'], check=True)
    return np.frombuffer(open('/tmp/_out.raw', 'rb').read(), np.int16).astype(np.float32) / 32768
clips = []
for i, p in enumerate(P):
    a, b = int(max(0, p['start'] - 0.03) * SR), int(min(len(raw) / SR, p['end'] + 0.08) * SR); seg = raw[a:b]
    seg = tighten(seg) if i not in (9,) else seg            # keep "Then... they let go." as performed
    clips.append(tempo(seg) if i != 14 else seg)             # Titus's scream untouched
dur = [len(c) / SR for c in clips]

# world-time anchors for each line (storyboard V2): line i starts 0.25 s after the shot at world time Wl[i] begins
Wl = {3: 4.4, 4: 9.4, 5: 13.9, 6: 16.4, 7: 20.55, 8: 22.4, 9: 28.0, 10: 32.0, 11: 36.0, 12: 37.5, 13: 42.5, 14: 49.5, 15: 51.6, 16: 52.6, 17: 55.5}
LEAD, GAP, MAXS = 0.22, 0.28, 1.12
tm = [(0.0, 29.0)]; start = {1: 0.25}
hook_end = 0.25 + dur[0] + 0.25; tm.append((hook_end, 31.2)); start[2] = hook_end + 0.05
rew_end = hook_end + max(0.9, dur[1] + 0.2); tm.append((rew_end, 4.4)); V = rew_end; start[3] = V + LEAD; prevW, prevI = 4.4, 3
for i in range(4, 18):
    need = start[prevI] + dur[prevI - 1] + GAP - LEAD
    if i == 11:   # the drop: silent slow-motion fall and impact between "let go" and "capsized"
        v0 = max(need, V + (32.95 - prevW) / MAXS); tm.append((v0, 32.95)); tm.append((v0 + 1.7, 33.75)); tm.append((v0 + 3.2, 36.0)); V, prevW = v0 + 3.2, 36.0; start[11] = V + LEAD; prevI = 11; continue
    Vi = max(need, V + (Wl[i] - prevW) / MAXS) if i != 15 else V + (Wl[i] - prevW)   # Titus's scream lands on his beat in real time
    if i == 17: Vi = max(Vi, V + 3.7)   # the fishing payoff (catch + laugh + wink) needs room
    tm.append((Vi, Wl[i])); start[i] = Vi + (LEAD if i not in (15,) else 0.05); V, prevW, prevI = Vi, Wl[i], i
end = start[17] + dur[16] + 1.8; tm.append((end, prevW + (end - V))); tm[-1] = (end, min(62.5, tm[-1][1]))
DUR = round(end + 0.2, 2)

# voice track (Titus's line goes in the voice track too; his clip also drives lip-sync)
track = np.zeros(int(DUR * SR) + SR)
for i, c in enumerate(clips): a = int(start[i + 1] * SR); track[a:a + len(c)] += c[:len(track) - a]
track = track[:int(DUR * SR)]
def wav(path, x): ww = wave.open(path, 'wb'); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); ww.close()
wav('audio/voice_track.wav', track); wav('audio/titus.wav', clips[14])
# Titus words for lip-sync (relative to his clip), placed at his world beat
tw = [x for x in W if P[14]['start'] - 0.05 <= x['start'] <= P[14]['end']]; t0 = P[14]['start'] - 0.03
json.dump([{'w': x['w'], 'start': round(x['start'] - t0, 3), 'end': round(x['end'] - t0, 3)} for x in tw], open('audio/titus_words.json', 'w'))
# world time of a video time (piecewise linear) and its inverse for re-timing shots
def v2w(v):
    for (a, wa), (b, wb) in zip(tm, tm[1:]):
        if v <= b: return wa + (wb - wa) * max(0, (v - a)) / max(1e-6, b - a)
    return tm[-1][1]
def w2v(wt, lo=None):   # first video time >= lo whose world time is wt (monotonic segments after the rewind)
    segs = list(zip(tm, tm[1:]))[2:]
    for (a, wa), (b, wb) in segs:
        if wa <= wt <= wb and wb > wa: return a + (b - a) * (wt - wa) / (wb - wa)
    return segs[-1][1][0]
S = json.loads(json.dumps(base)); S['duration'] = DUR; S['timeMap'] = [[round(a, 3), round(b, 3)] for a, b in tm]
for sh in S['shots']:
    n = sh['name']
    if n.startswith('S01a'): a, b = 0, (hook_end) * 0.52
    elif n.startswith('S01b'): a, b = hook_end * 0.52, hook_end
    elif n.startswith('S02'): a, b = hook_end, rew_end
    else: a, b = w2v(sh['a_world']), w2v(sh['b_world'])
    oa, ob = sh['a'], sh['b']; sh['a'], sh['b'] = round(a, 3), round(b, 3)
    for k in sh['keys']: k['t'] = round(a + (k['t'] - oa) / max(1e-6, ob - oa) * (b - a), 3)
S['shots'][-1]['b'] = DUR; S['shots'][-1]['keys'][-1]['t'] = DUR
S['kicks'] = [{'t': round(w2v(k['t']), 3), 'a': k['a']} for k in base['kicks']]
S['dialogue'] = [{'speaker': 'titus', 'words': 'audio/titus_words.json', 'env': 'build/titus_env.json', 'offset': Wl[15]}]
S['audio'] = {'voice': 'audio/voice_track.wav', 'voiceOffset': 0, 'music': 'audio/music.mp3', 'musicLUFS': -21}
json.dump(S, open('story.json', 'w'), indent=1)

# captions (ASS): narration in short chunks timed from word timings; Titus in his own style; on-screen labels
def ts(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f'{h}:{m:02d}:{s:05.2f}'
ev = []
for i, p in enumerate(P):
    if i == 14: ev.append(('Shout', start[15], start[15] + dur[14] + 0.3, 'THERE IT IS!')); continue
    ws = [x for x in W if p['start'] - 0.05 <= x['start'] <= p['end'] + 0.05]; chunk, cs = [], None
    scale = (dur[i]) / max(0.3, (p['end'] - p['start']))
    for j, x in enumerate(ws):
        if cs is None: cs = start[i + 1] + (x['start'] - p['start']) * scale
        chunk.append(x['w'])
        if len(chunk) >= 5 or j == len(ws) - 1 or x['w'].endswith(('.', ',', ':', '?', '!')):
            ce = start[i + 1] + (x['end'] - p['start']) * scale + 0.12; ev.append(('Cap', cs, ce, ' '.join(chunk).replace('...', '…'))); chunk, cs = [], None
lab = [('Label', start[3], start[3] + 3.4, 'SYRACUSE · SICILY · 213 BC'), ('Note', w2v(22.4), w2v(28.0), 'RECONSTRUCTION — machine design is our interpretation'),
       ('Note', w2v(49.5), w2v(55.5), 'DRAMATIZATION — the fishing rod is a joke, not history')]
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,64,&H00FFFFFF,&H00FFFFFF,&H00101010,&H90000000,1,0,0,0,100,100,0,0,1,5,2,2,80,80,520,1
Style: Shout,DejaVu Sans,96,&H0040D8FF,&H00FFFFFF,&H00101010,&H90000000,1,0,0,0,100,100,2,0,1,7,3,5,60,60,0,1
Style: Label,DejaVu Sans,46,&H00F0F0F0,&H00FFFFFF,&H00101010,&H70000000,1,0,0,0,100,100,6,0,1,3,1,8,60,60,190,1
Style: Note,DejaVu Sans,30,&H00E8E8E8,&H00FFFFFF,&H00101010,&H70000000,0,1,0,0,100,100,1,0,3,2,0,8,60,60,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open('captions.ass', 'w').write(hdr + ''.join(f'Dialogue: 0,{ts(a)},{ts(b)},{st},,0,0,0,,{t}\n' for st, a, b, t in ev + lab))
print('duration', DUR, 'lines', {k: round(v, 2) for k, v in start.items()})
print('timeMap', S['timeMap'])
for sh in S['shots']: print(f"{sh['name'][:40]:40s} {sh['a']:6.2f}-{sh['b']:6.2f}  world {sh.get('a_world')}")
