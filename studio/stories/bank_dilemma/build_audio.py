"""Sample audio (free, temporary): voice track (Piper TTS temp voices), studio SFX via sfxlib, an original synthesized suspense score, then mix.sh.
Final episode: narrator = studio voice (ElevenLabs v4 'Grady' via Higgsfield, owner-approved credits) and an owned/approved score."""
import json, subprocess, numpy as np, wave, os
P = json.load(open('plan.json')); D = 14.5; SR = 48000; B = 'build'; os.makedirs(B, exist_ok=True)
def load(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def save(f, L, R=None):
    R = L if R is None else R; x = np.stack([L, R], 1); x = np.clip(x, -1, 1); w = wave.open(f, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
N = int(D * SR); V = np.zeros(N)
for e in P['narration'] + P['dialogue']:
    x = load(e['file']) * (0.9 if 'who' in e else 1.0); i = int(e['at'] * SR); V[i:i + len(x)] += x[:N - i]
save(f'{B}/voice.wav', V)
# ---- SFX cue sheet (video time)
bag = P['bag']; cues = {'duration': D, 'events': []}; ev = cues['events'].append
ev({'type': 'thud', 't': 0.02, 'gain': 0.9})                       # cold-open hit
for k in range(3): ev({'type': 'tick', 't': 3.0 + k, 'gain': 0.5})   # the wall clock in the wide
ev({'type': 'scuff', 't': 3.3, 'gain': 0.5}); ev({'type': 'step', 't': 3.45, 'gain': 0.5})   # robber lunges as he shouts
ev({'type': 'whoosh', 't': bag['release'] - 0.05, 'dur': 0.55, 'gain': 0.9})
ev({'type': 'thud', 't': bag['land'], 'gain': 0.8}); ev({'type': 'scuff', 't': bag['land'] + 0.02, 'gain': 0.8}); ev({'type': 'scrape', 't': bag['land'] + 0.08, 'gain': 0.9})
json.dump(cues, open(f'{B}/cues.json', 'w'))
subprocess.run(['python3', '../../engine/tools/sfxlib.py', f'{B}/cues.json', f'{B}/sfx_raw.wav', 'room'], check=True)
s = load(f'{B}/sfx_raw.wav'); t = np.arange(N) / SR
# heartbeat + room drop-out in the ECU (12.4 s ->): the world goes quiet, only his pulse
hb = np.zeros(N)
for k in range(3):
    for dt, g in [(0, 1.0), (0.24, 0.7)]:
        i = int((12.45 + k * 0.82 + dt) * SR); m = int(0.18 * SR); tb = np.arange(m) / SR; x = g * np.sin(2 * np.pi * (52 - 18 * tb) * tb) * np.exp(-tb * 22); hb[i:i + m] += x[:len(hb[i:i + m])]
duck = np.where(t < 12.4, 1.0, np.maximum(0.15, 1 - (t - 12.4) / 0.6))
save(f'{B}/sfx.wav', s[:N] * duck + hb[:N] * 0.9)
# ---- original suspense score (synth): drone + pulse + rising cluster; silence before the reveal
rng = np.random.default_rng(3)
def osc(f, ph=0): return np.sin(2 * np.pi * f * t + ph)
drone = (osc(55) + 0.6 * osc(82.4) + 0.35 * osc(110.2) + 0.25 * osc(54.6)) * 0.22
strings = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 5.2 * t + i)) for i, f in enumerate([440, 466.2, 523.3, 554.4])) * 0.05
rise = np.clip((t - 5.7) / 6.5, 0, 1) ** 1.6
pulse = np.zeros(N); bpm = 96
for k in range(int(D * bpm / 60) + 1):
    tk = k * 60 / bpm
    if 2.9 < tk < 12.3: i = int(tk * SR); m = int(0.25 * SR); tb = np.arange(m) / SR; x = np.sin(2 * np.pi * (70 - 25 * tb) * tb) * np.exp(-tb * 14) * (0.5 + 0.5 * (tk > 5.7)); pulse[i:i + m] += x[:len(pulse[i:i + m])]
hit = np.zeros(N); m = int(2.5 * SR); tb = np.arange(m) / SR; hit[:m] = (np.sin(2 * np.pi * (48 - 10 * tb) * tb) * np.exp(-tb * 1.6) + rng.standard_normal(m) * np.exp(-tb * 6) * 0.15)
env = np.clip(t / 0.3, 0, 1) * np.where(t < 12.25, 1, np.maximum(0.12, 1 - (t - 12.25) / 0.25))
music = (drone * (0.7 + 0.3 * rise) + strings * rise * 1.6 + pulse * 0.6) * env + hit * 0.9
music += np.where(t > 12.6, osc(1760) * 0.012 * np.clip((t - 12.6) / 1.5, 0, 1), 0)   # thin high tone under the reveal
save(f'{B}/music.wav', music / np.max(np.abs(music)) * 0.8)
subprocess.run(['bash', '../../engine/tools/mix.sh', B, f'{B}/voice.wav', '0', f'{B}/music.wav', '-23', str(D)], check=True)
