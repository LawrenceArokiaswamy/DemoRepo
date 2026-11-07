# Timing backbone. Reads the narration (Kokoro per-line WAVs, a folder of per-line WAVs, or ONE replacement recording),
# gets word timestamps (Whisper), lays the lines on the timeline and writes everything the picture, the mix and the subtitles read:
#   film.json  (line starts/ends, absolute word times, silence + hit, duration)   out/vo.wav (voice stem, 48 kHz)
#   caps.json  (word-synced caption chunks with highlight flags)                    out/cues.json (srt cues)
# usage: prep.py                      -> vo/<id>.wav + vo/words.json (Kokoro scratch, from tts.py + asr_check.py)
#        prep.py --vo-dir DIR         -> DIR/<id>.wav per line (n1.wav … n13.wav), words from DIR/words.json (build.sh runs asr_check)
#        prep.py --vo FILE.wav        -> one take of the whole script; transcribed here with faster-whisper word timestamps
import json, os, re, sys, difflib, numpy as np, soundfile as sf, soxr
H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
LINES = json.load(open(f'{H}/lines.json')); IDS = [L['id'] for L in LINES]
TEXT = {L['id']: L['text'] for L in LINES}
# breathing room after each line (s) when we lay the lines out ourselves. n11 -> n12 is the hard silence before the verdict.
GAP = {'n1': .4, 'n2': .25, 'n3': .3, 'n4': .45, 'n5': .25, 'n6': .45, 'n7': .25, 'n8': .45, 'n9': .3, 'n10': .45, 'n12': .45}
SIL_AFTER = 'n11'; SIL = .55    # ~0.55 s of digital silence after "so, who wins?"
START = .25; TAIL = 2.0         # first word at 0.25 s; end card after the last word
# words shown in yellow (normalised)
HL = {'usa', 'china', 'winning', 'scoreboard', 'one', 'smartest', 'seven', 'percent', 'huge', 'barely', 'two', 'computing', 'seventytwo', 'ten',
      'easily', 'three', 'electricity', 'eats', 'six', 'four', 'shock', 'deepseek', 'hundred', 'billion', 'day', 'wins', 'leads', 'fast', 'cheap', 'over', 'first', 'lap', 'follow'}
HL_ONLY = {'one': {'n2'}, 'two': {'n5', 'n10'}, 'percent': {'n2'}, 'day': {'n9'}, 'usa': {'n1', 'n4', 'n6'}, 'china': {'n1', 'n8', 'n10'}}
norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))
def script_words(i): return TEXT[i].split()

def load(fn):
    a, sr = sf.read(fn); a = a if a.ndim == 1 else a.mean(1)
    return soxr.resample(a, sr, SR) if sr != SR else a

def align(sw, asr):
    """map script words onto ASR word timings (difflib on normalised words; unmatched runs share their span)"""
    A = [norm(w) for w in sw]; B = [norm(w[0]) for w in asr]
    out = [None] * len(sw)
    for tag, a0, a1, b0, b1 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(a1 - a0): out[a0 + k] = (asr[b0 + k][1], asr[b0 + k][2])
        elif tag in ('replace', 'delete') and a1 > a0:
            if b1 > b0: s, e = asr[b0][1], asr[b1 - 1][2]
            else:
                s = asr[b0 - 1][2] if b0 > 0 else (asr[0][1] if asr else 0); e = asr[b0][1] if b0 < len(asr) else s + .3 * (a1 - a0)
            for k in range(a1 - a0): out[a0 + k] = (s + (e - s) * k / (a1 - a0), s + (e - s) * (k + 1) / (a1 - a0))
    return [(w, max(0., a), b) for w, (a, b) in zip(sw, out)]

mode = 'kokoro'; arg = None
if '--vo' in sys.argv: mode, arg = 'take', sys.argv[sys.argv.index('--vo') + 1]
elif '--vo-dir' in sys.argv: mode, arg = 'dir', sys.argv[sys.argv.index('--vo-dir') + 1]

lines = {}   # id -> (t0, t1, [(word, abs_a, abs_b)])
if mode in ('kokoro', 'dir'):
    d = f'{H}/vo' if mode == 'kokoro' else os.path.abspath(arg)
    W = json.load(open(f'{d}/words.json'))
    clips = {i: load(f'{d}/{i}.wav') for i in IDS}
    t = START; place = {}
    for i in IDS:
        a = clips[i]; dur = len(a) / SR
        ws = align(script_words(i), W[i])
        ws = [(w, min(max(x0, 0), dur), min(max(x1, 0.02), dur)) for w, x0, x1 in ws]
        place[i] = t; lines[i] = (t, t + dur, [(w, t + x0, t + x1) for w, x0, x1 in ws])
        if i == SIL_AFTER: t = t + dur + .10 + SIL
        else: t = t + dur + GAP.get(i, .3)
    DUR = lines[IDS[-1]][1] + TAIL
    voice = np.zeros(int(DUR * SR) + SR)
    for i in IDS:
        s = int(place[i] * SR); voice[s:s + len(clips[i])] += clips[i]
else:
    # one recording of the whole script: transcribe it, find every script line inside it
    from faster_whisper import WhisperModel
    raw = load(arg)
    m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small.en'), device='cpu', compute_type='int8')
    segs, _ = m.transcribe(soxr.resample(raw, SR, 16000).astype(np.float32), language='en', word_timestamps=True, vad_filter=False)
    asr = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    allw = [(i, w) for i in IDS for w in script_words(i)]
    al = align([w for _, w in allw], asr)
    # Whisper's word starts drift by a few hundred ms; snap each line start to the real voice onset (10 ms RMS envelope)
    hop = SR // 100; nf = len(raw) // hop; en = np.sqrt((raw[:nf * hop].reshape(nf, hop) ** 2).mean(1)); thr = .06 * np.percentile(en, 99)
    def onset(ta):
        a, b = int(max(0, ta - .6) * 100), int((ta + .6) * 100); best = None
        for f in range(max(a, 12), min(b, nf)):
            if en[f] > thr and (en[f - 12:f] < thr).all() and (best is None or abs(f / 100 - ta) < abs(best / 100 - ta)): best = f
        return best / 100 - .02 if best is not None else ta
    k = 0; raw_lines = {}
    for i in IDS:
        n = len(script_words(i)); ws = list(al[k:k + n]); k += n
        o = onset(ws[0][1]); ws[0] = (ws[0][0], o, ws[0][2]); raw_lines[i] = ws
    lead = raw_lines[IDS[0]][0][1] - START  # shift so the first word lands at START
    for i in IDS:
        ws = [(w, a - lead, b - lead) for w, a, b in raw_lines[i]]
        lines[i] = (ws[0][1] - .03, ws[-1][2] + .05, ws)
    nxt = IDS[IDS.index(SIL_AFTER) + 1]
    if lines[nxt][0] - lines[SIL_AFTER][1] < .45:
        print(f'warning: only {lines[nxt][0] - lines[SIL_AFTER][1]:.2f} s between "{TEXT[SIL_AFTER]}" and "{TEXT[nxt]}": leave a ~0.6 s pause there', file=sys.stderr)
    DUR = lines[IDS[-1]][1] + TAIL
    voice = np.zeros(int(DUR * SR) + SR)
    src = raw[int(max(lead, 0) * SR):]; dst = int(max(-lead, 0) * SR)
    n = min(len(src), len(voice) - dst); voice[dst:dst + n] = src[:n]

nxt = IDS[IDS.index(SIL_AFTER) + 1]
S0 = lines[SIL_AFTER][1] + (.10 if mode != 'take' else .06)
HIT = lines[nxt][0] - .02
voice = voice[:int(DUR * SR)]
os.makedirs(f'{H}/out', exist_ok=True)
sf.write(f'{H}/out/vo.wav', voice.astype(np.float32), SR, subtype='FLOAT')

# captions: chunks of up to 3 words, broken at punctuation / pauses, never across lines
def hl(x, i):
    k = norm(x)
    return k in HL and (k not in HL_ONLY or i in HL_ONLY[k])
caps = []
for i in IDS:
    t0, t1, ws = lines[i]; cur = []
    for k, (w, a, b) in enumerate(ws):
        cur.append(w)
        nxt_w = ws[k + 1] if k + 1 < len(ws) else None
        if not nxt_w or re.search(r'[.,?!:…]$', w) or len(cur) >= 3 or (nxt_w and nxt_w[1] - b > .28):
            st = ws[k - len(cur) + 1][1]
            caps.append({'line': i, 'w': [[x, hl(x, i)] for x in cur], 't0': round(st - .05, 3), 't1': round(b, 3)})
            cur = []
for k, c in enumerate(caps):     # hold each chunk until the next one (or 0.45 s past its last word)
    nx = caps[k + 1]['t0'] if k + 1 < len(caps) else 99
    c['t1'] = round(min(nx - .02, c['t1'] + .45), 3)
json.dump(caps, open(f'{H}/caps.json', 'w'))

film = {'dur': round(DUR, 3), 'S0': round(S0, 3), 'HIT': round(HIT, 3),
        'lines': {i: [round(lines[i][0], 3), round(lines[i][1], 3)] for i in IDS},
        'words': {i: [[w, round(a, 3), round(b, 3)] for w, a, b in lines[i][2]] for i in IDS}, 'mode': mode}
json.dump(film, open(f'{H}/film.json', 'w'), indent=0)
# srt: one cue per spoken line (long lines split at sentence breaks)
cues = []
for i in IDS:
    t0, t1, ws = lines[i]; parts = [[]]
    for w in ws:
        parts[-1].append(w)
        if re.search(r'[.?!]$', w[0]) and len(parts[-1]) >= 3 and w is not ws[-1]: parts.append([])
    for p in parts:
        if not p: continue
        cues.append({'t0': round(p[0][1] - .05, 2), 't1': round(p[-1][2] + .3, 2), 'text': ' '.join(x[0] for x in p)})
for k in range(len(cues) - 1): cues[k]['t1'] = min(cues[k]['t1'], round(cues[k + 1]['t0'] - .02, 2))
json.dump(cues, open(f'{H}/out/cues.json', 'w'), indent=1)
print(f'mode {mode}  dur {DUR:.2f}s  silence {S0:.2f}-{HIT:.2f}  caps {len(caps)}')
