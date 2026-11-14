"""Loudness envelope for lip-sync: wav -> JSON {rate, data[]} (100 Hz, 0..1). usage: envelope.py in.wav out.json [start] [end]"""
import sys, json, wave, numpy as np
src, dst = sys.argv[1], sys.argv[2]; a = float(sys.argv[3]) if len(sys.argv) > 3 else 0; b = float(sys.argv[4]) if len(sys.argv) > 4 else None
w = wave.open(src); sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes(); x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
x = x.reshape(-1, ch).mean(1); x = x[int(a * sr): int(b * sr) if b else None]
hop = sr // 100; frames = len(x) // hop; rms = np.sqrt(np.array([np.mean(x[i * hop:(i + 2) * hop] ** 2) for i in range(frames)]) + 1e-9)
db = 20 * np.log10(rms); lo, hi = np.percentile(db, 20), np.percentile(db, 99); e = np.clip((db - lo) / (hi - lo), 0, 1)
e = np.convolve(e, np.ones(3) / 3, mode='same'); json.dump({'rate': 100, 'data': [round(float(v), 3) for v in e]}, open(dst, 'w')); print('frames', frames, 'mean', float(e.mean()))
