"""Animatic scratch audio + captions (no narration recorded yet): SFX cues in video time, owned score timed so its peak
hits the crash, scratch narration shown as on-screen text with the approved timings, shot numbers for review."""
import json, os, subprocess
os.chdir(os.path.dirname(os.path.abspath(__file__)))
DUR = 39.8; E = []
def at(t, **k): E.append(dict(t=round(t, 3), **k))
at(0.0, type='groan', gain=1.4); at(0.0, type='pour', end=3.2, peak=1.0, gain=1.2); at(0.4, type='creak', f=180, dur=1.2, gain=1.0)   # hook: hanging ship
at(3.25, type='whoosh', dur=0.45, hi=True, gain=1.6)                                                      # rewind
at(13.0, type='creak', f=140, dur=0.9, gain=0.8); at(14.9, type='creak', f=110, dur=0.5, gain=1.4)        # the trap is sprung
at(15.4, type='groan', gain=1.3); at(15.5, type='creak', f=120, dur=2.2, gain=1.1); at(17.3, type='whoosh', dur=0.6, gain=0.9)   # arm swings out
at(18.0, type='chain', dur=1.6, gain=1.2); at(19.95, type='clunk', gain=2.2); at(20.0, type='thud', gain=1.2)                  # claw drops, bites
at(21.4, type='snap', gain=1.4); at(21.5, type='groan', gain=1.5)                                                              # chain snaps taut
at(22.7, type='pour', end=26.6, peak=24.2, gain=1.6); at(23.0, type='creak', f=160, dur=2.4, gain=1.0); at(24.6, type='groan', gain=1.2)   # the lift
at(27.3, type='clank', gain=1.4); at(27.4, type='whoosh', dur=1.0, gain=1.2)                                                    # claw releases
at(30.15, type='thud', gain=2.6); at(30.15, type='pour', end=33.5, peak=30.5, gain=1.9); for_t = [30.4, 30.7, 31.1]
for t in for_t: at(t, type='plop', gain=1.4)
at(31.0, type='creak', f=200, dur=0.6, gain=0.7); at(31.3, type='whoosh', dur=0.5, gain=0.6)                                  # rope pole swings out (echo)
at(32.6, type='whoosh', dur=0.25, hi=True, gain=1.0)                                                                           # panic sting
json.dump({'duration': DUR, 'events': E}, open('build/cues.json', 'w'))
subprocess.run(['python3', '../../engine/tools/sfxlib.py', 'build/cues.json', 'build/sfx.wav', 'sea,wind'], check=True)
# score: peak (~45.0 s into the cue) lands on the crash at 30.15 s; fade out under the last line, music hit at the end
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '14.85', '-i', '../claw-of-syracuse/audio/music.mp3', '-t', str(DUR), '-af', 'afade=t=in:d=0.3,afade=t=out:st=38.6:d=1.2', '-ar', '48000', '-ac', '2', 'build/music.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/sfx.wav', '-i', 'build/music.wav', '-filter_complex', '[0]volume=1.0[a];[1]volume=0.55[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9', '-ar', '48000', 'build/scratch_mix.wav'], check=True)
# captions: scratch narration (approved script timings) + shot numbers
VO = [(0.00, 2.00, 'This warship is being lifted out of the sea…'), (2.15, 3.25, '…by one old man.'), (3.70, 6.50, 'Rome had sent sixty warships to take the city of Syracuse.'),
      (6.70, 9.30, 'But Syracuse had Archimedes — a mathematician in his seventies.'), (9.45, 10.75, "And he wasn't worried."), (11.10, 13.30, 'The Romans rowed right up under the walls…'),
      (13.40, 14.90, '…exactly where he wanted them.'), (15.40, 17.90, 'Then a giant wooden arm swung out over the water.'), (18.15, 19.35, 'An iron claw dropped…'),
      (19.50, 20.80, '…and bit into the ship.'), (21.20, 22.40, 'And it began to pull.'), (22.70, 25.70, 'Up. Up. Out of the sea.'), (26.60, 28.60, 'And then… the claw released it.'),
      (31.00, 34.60, 'Soon, even a rope hanging over the wall made Roman soldiers panic.'), (35.10, 36.70, 'Rome had sixty warships.'), (37.00, 38.70, 'Syracuse had Archimedes.')]
S = json.load(open('story.json'))['shots']
ts = lambda x: f'0:{int(x // 60):02d}:{x % 60:05.2f}'
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 540
PlayResY: 960
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: VO,DejaVu Sans,30,&H00FFFFFF,&H00FFFFFF,&H00101010,&H90000000,1,0,0,0,100,100,0,0,1,3,1,2,40,40,170,1
Style: Shot,DejaVu Sans,17,&H0000E0FF,&H00FFFFFF,&H00101010,&HA0000000,0,0,0,0,100,100,0,0,3,1,0,7,10,10,10,1
Style: Tag,DejaVu Sans,15,&H00C0C0C0,&H00FFFFFF,&H00101010,&HA0000000,0,1,0,0,100,100,0,0,3,1,0,9,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = [f'Dialogue: 0,{ts(a)},{ts(b)},VO,,0,0,0,,{t}' for a, b, t in VO]
ev += [f"Dialogue: 0,{ts(s['a'])},{ts(s['b'])},Shot,,0,0,0,,{s['name'].replace(',', '')[:58]}" for s in S]
ev.append(f'Dialogue: 0,{ts(0)},{ts(DUR)},Tag,,0,0,0,,ANIMATIC · scratch audio · narration as text')
open('build/animatic.ass', 'w').write(hdr + '\n'.join(ev) + '\n'); print('ok', len(E), 'cues')
