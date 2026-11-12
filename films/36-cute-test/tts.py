# Kokoro (offline, Apache-2.0) line for the cute three.js test + a per-frame mouth-open curve for lip sync
import soundfile as sf, numpy as np, json, os, sys
from kokoro_onnx import Kokoro
H = os.path.dirname(os.path.abspath(__file__)); C = '/root/lemo-opuscar/core/tts'
k = Kokoro(f'{C}/kokoro-v1.0.onnx', f'{C}/voices-v1.0.bin')
voice = sys.argv[1] if len(sys.argv) > 1 else 'af_heart'
txt = "You still call me every Sunday... You know that's my favourite part of the whole week?"
s, sr = k.create(txt, voice=voice, speed=0.88, lang='en-us')
a = np.abs(s); nz = np.where(a > a.max() * 0.01)[0]; s = s[max(0, nz[0] - 240):nz[-1] + 4800]
sf.write(f'{H}/audio/line.wav', s, sr)
fps = 30; hop = sr // fps; env = []
for i in range(0, len(s), hop):
    w = s[i:i + hop]; env.append(float(np.sqrt((w ** 2).mean()) if len(w) else 0))
e = np.array(env); e = np.clip(e / (np.percentile(e, 95) + 1e-9), 0, 1.2) ** 0.7
e = np.convolve(e, [0.25, 0.5, 0.25], 'same')
json.dump({'fps': fps, 'mouth': [round(float(x), 3) for x in e], 'dur': len(s) / sr}, open(f'{H}/remotion/public/mouth.json', 'w'))
print(voice, 'dur', round(len(s) / sr, 2))
