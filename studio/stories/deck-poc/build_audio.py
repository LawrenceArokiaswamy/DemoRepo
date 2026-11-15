"""Sound for the 5 s deck POC: synthesized SFX (sfxlib) + a slice of the owned Claw score (peak lands just after the reaction)."""
import json, subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__))); D = 5.0; E = []
def at(t, **k): E.append(dict(t=t, **k))
for t in (0.25, 1.4, 2.55): at(t, type='creak', f=210, dur=0.5, gain=0.8)                      # rope/timber on each haul
at(2.85, type='groan', gain=1.5); at(2.95, type='whoosh', dur=1.1, gain=1.2)                   # something huge passes over
at(3.15, type='chain', dur=0.9, gain=0.9); at(3.55, type='thud', gain=1.6); at(3.56, type='whoosh', dur=0.25, hi=True, gain=0.8)   # reaction sting
json.dump({'duration': D, 'events': E}, open('build/cues.json', 'w'))
subprocess.run(['python3', '../../engine/tools/sfxlib.py', 'build/cues.json', 'build/sfx.wav', 'sea,wind'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '40.6', '-i', '../claw-of-syracuse/audio/music.mp3', '-t', str(D), '-af', 'afade=t=in:d=0.4,afade=t=out:st=4.4:d=0.6,volume=0.5', '-ar', '48000', '-ac', '2', 'build/music.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/sfx.wav', '-i', 'build/music.wav', '-filter_complex', '[0][1]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5,aresample=48000', '-ac', '2', 'build/mix.wav'], check=True)
print('audio ok')
