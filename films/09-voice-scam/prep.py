# Build voice stems, a 60 Hz waveform envelope for the page and word-timed captions, all from film.json.
import json, os, numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
F = json.load(open(f'{H}/film.json')); W = json.load(open(f'{H}/vo/words.json'))
lines = {L['id']: L for L in json.load(open(f'{H}/lines.json'))}
N = int(F['dur'] * SR)
narr = np.zeros(N); scam = np.zeros(N)
def load(i):
    a, sr = sf.read(f'{H}/vo/{i}.wav'); a = a if a.ndim == 1 else a.mean(1)
    return soxr.resample(a, sr, SR)
def phone(x):
    # phone line: band-pass 320-3300 Hz, light saturation, a touch of line hiss
    x = sosfilt(butter(4, [320, 3300], 'band', fs=SR, output='sos'), x)
    x = np.tanh(x * 2.6) / np.tanh(2.6)
    x = x + sosfilt(butter(2, [1500, 6000], 'band', fs=SR, output='sos'), np.random.default_rng(3).standard_normal(len(x))) * 0.004
    return x
caps = []
for i, t0 in F['lines'].items():
    a = load(i); s = int(t0 * SR)
    if i.startswith('s'): a = phone(a); scam[s:s + len(a)] += a[:N - s]
    else: narr[s:s + len(a)] += a[:N - s]
    ws = W[i]
    for k, (w, a0, a1) in enumerate(ws):
        caps.append({'w': w, 't0': round(t0 + max(a0, 0), 3), 't1': round(t0 + a1, 3), 'line': i, 'spk': 's' if i.startswith('s') else 'n', 'k': k})
    caps[-1]['end'] = True
m = []
for c in caps:
    if m and c['w'].startswith('.') and c['line'] == m[-1]['line']:
        m[-1]['w'] += c['w']; m[-1]['t1'] = c['t1']; m[-1]['end'] = c.get('end', False) or m[-1].get('end', False); continue
    if c['line'] == 'n2' and c['w'] == 'three': c['w'] = '3'
    m.append(c)
caps = m
os.makedirs(f'{H}/out', exist_ok=True)
sf.write(f'{H}/out/voice_narr.wav', narr, SR); sf.write(f'{H}/out/voice_scam.wav', scam, SR)
def env(x):
    hop = SR // 60; n = len(x) // hop
    e = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)); return np.round(e / (e.max() + 1e-9), 3).tolist()
json.dump({'narr': env(narr), 'scam': env(scam)}, open(f'{H}/env.json', 'w'))
json.dump(caps, open(f'{H}/caps.json', 'w'), indent=0)
# srt cues: one per line, text from lines.json (n7 with digits)
disp = {'n2': 'Made from 3 seconds of audio.', 'n7': 'Americans lost $3.5 billion to impostor scams last year.'}
cues = []
for i, t0 in F['lines'].items():
    ws = W[i]; txt = disp.get(i, lines[i]['text'].replace('...', '…'))
    if i.startswith('s'): txt = '[cloned voice] ' + txt
    cues.append({'t0': round(t0, 2), 't1': round(t0 + ws[-1][2] + 0.25, 2), 'text': txt})
json.dump(cues, open(f'{H}/out/cues.json', 'w'), indent=1)
print('voice end', max(c['t1'] for c in caps), 'caps', len(caps))
# beat grid shared by the page (glow pulses) and the score
def bpm(t):
    if t < 21.1: return 125 + 27 * (t / 21.1) ** 1.6     # 125 -> 152, accelerating into the reveal
    if t < F['lift']: return 128
    return 122
beats = []; t = 0.02; S = F['silence']
while t < F['dur'] - 0.3:
    if not (S[0] - 0.02 <= t < S[1] - 0.02): beats.append(round(t, 4))
    t = S[1] if (t < S[0] and t + 60 / bpm(t) >= S[0]) else t + 60 / bpm(t)
json.dump(beats, open(f'{H}/beats.json', 'w'))
print('beats', len(beats))
