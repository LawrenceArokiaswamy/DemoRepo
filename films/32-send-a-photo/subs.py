# Film 32 subtitles, streaming-style (SDH): a scene/emotion line at the top, dialogue with speaker and delivery plus
# sound cues just above the middle. White text on dark boxes so it reads on any shot. Writes subs.ass (libass).
import os
HERE = os.path.dirname(os.path.abspath(__file__))

# [start s, end s, text] — top line: what is happening and what they feel
TOP = [
    (0.3, 3.1, "[Golden hour. His son is home after two years.]"),
    (3.3, 6.3, "[Dad holds on a little longer than his son does]"),
    (6.5, 9.5, "[That evening. Dad shyly holds out his phone]"),
    (9.7, 13.5, "[The son doesn't look up from his laptop]"),
    (13.7, 17.5, "[Dad smiles it off. But it stings.]"),
    (17.8, 21.5, "[Late at night. Dad squints at the screen, tapping slowly]"),
    (21.7, 25.9, "[He tucks his sleeping son in… and quietly takes a photo]"),
    (26.1, 29.9, "[Morning. Dad hoping for just one more day]"),
    (30.1, 33.9, "[The car pulls away. Dad keeps waving long after it's gone]"),
    (34.1, 36.9, "[Weeks later. Dad keeps calling. Busy at work, the son turns his phone over]"),
    (37.1, 43.9, "[Messages from Mom]"),
    (44.1, 47.9, "[It finally sinks in]"),
    (48.1, 51.9, "[Rain. Dad's chair sits empty.]"),
    (52.1, 55.9, "[After the funeral. Dad's glasses and phone, left behind]"),
    (56.1, 60.6, "[He opens Dad's phone. Drafts, all addressed to him]"),
    (60.7, 65.9, "[Not one of them was ever sent]"),
    (66.1, 70.9, "[He breaks down]"),
    (71.1, 75.9, "[Years later. In his dad's shirt, in his dad's chair]"),
    (76.1, 82.9, "[This time, he puts the laptop away]"),
    (83.1, 87.8, "[He holds his boy close]"),
]
# middle: narration, dialogue (SPEAKER: (delivery) line) and sound cues in brackets
MID = [
    (0.6, 3.1, "His son came home for the first time in two years."),
    (6.9, 9.4, "DAD: (hopeful) Son… how do I send a photo?"),
    (9.9, 11.8, "SON: (not looking up) I showed you already, Dad."),
    (12.0, 13.5, "DAD: (quietly) Right… okay."),
    (15.0, 17.3, "[clock ticking]"),
    (18.0, 21.3, "Later that night, he tried on his own."),
    (24.2, 25.6, "[camera shutter clicks]"),
    (26.5, 28.1, "DAD: (gently) Stay one more day?"),
    (28.3, 29.9, "SON: (rushed) Can't, Dad. Big week."),
    (30.4, 33.6, "[engine starts, car drives away]"),
    (44.3, 47.6, "[breath catches]"),
    (48.3, 51.6, "[rain, distant thunder]"),
    (66.3, 70.6, "[quiet sobbing]"),
    (71.3, 73.0, "Years later."),
    (73.4, 75.9, "BOY: (excited) Dad, how do I send a photo?"),
    (77.0, 79.6, "He wasn't learning the phone."),
    (79.8, 82.8, "He was trying to reach you."),
]

def ts(s):
    h = int(s // 3600); m = int(s % 3600 // 60); sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

def esc(t):
    t = t.replace("{", "(").replace("}", ")")
    # speaker label bold, delivery note italic
    if ":" in t and t.split(":")[0].isupper():
        who, line = t.split(":", 1); line = line.strip()
        if line.startswith("("):
            note, rest = line[1:].split(")", 1); line = r"{\i1}(" + note + r"){\i0} " + rest.strip()
        return r"{\b1}" + who + r":{\b0} " + line
    if t.startswith("["): return r"{\i1}" + t + r"{\i0}"
    return t

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Top,Inter,46,&H00B8EBFF,&H000000FF,&H38000000,&H00000000,0,1,0,0,100,100,0,0,3,14,0,8,80,80,175,1
Style: Mid,Inter,60,&H00FFFFFF,&H000000FF,&H30000000,&H00000000,0,0,0,0,100,100,0,0,3,16,0,8,70,70,1090,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(os.path.join(HERE, "subs.ass"), "w") as f:
    f.write(HEAD)
    for a, b, t in TOP: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Top,,0,0,0,,{{\\fad(200,200)}}{esc(t)}\n")
    for a, b, t in MID: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Mid,,0,0,0,,{{\\fad(150,150)}}{esc(t)}\n")
print("wrote subs.ass")
