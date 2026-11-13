# Look test 37: one quiet italic line per beat (lower-case, small serif, no box), placed low in the frame
import os
H = os.path.dirname(os.path.abspath(__file__))
LINES = [(1.0, 4.7, "she sat by your door every night."),
         (5.1, 8.3, "close enough that you'd never be alone."),
         (8.8, 10.0, "and stayed after your light went out.")]
def ts(s): return f"0:{int(s // 60):02d}:{s % 60:05.2f}"
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Line,Playfair Display,50,&H00F4F0EA,&H000000FF,&H50000000,&H90000000,0,1,0,0,100,100,0.5,0,1,1.2,3,2,90,90,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(f"{H}/subs37.ass", "w") as f:
    f.write(head)
    for a, b, t in LINES: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Line,,0,0,0,,{{\\fad(400,400)}}{t}\n")
print("wrote subs37.ass")
