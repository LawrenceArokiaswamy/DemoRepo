# Film 35 subtitles: the letter (serif, near the top), and the streaming-style pair 30% up from the bottom
# (yellow scene line, white dialogue with speaker + delivery). Writes subs35.ass (libass, 1080x1920).
import os
HERE = os.path.dirname(os.path.abspath(__file__))
LETTER = [
    (18.4, 21.7, "He taught each of them one thing.\\NHe never told them why."),
    (25.6, 28.9, "He had 5 months.\\NHe spent every day getting them ready."),
    (40.4, 43.6, "20 years later."),
]
SCENE = []
DIALOG = [
    (0.7, 2.4, "ANNA: (laughing) Why do I need this?"),
    (2.5, 3.9, "DANIEL: (smiling) Just in case."),
    (4.4, 7.8, "DANIEL: Over, under, through. Now you try."),
    (8.4, 10.5, "DANIEL: One, two, three…"),
    (10.6, 13.0, "MIA: (giggling) You have to dance with me at my wedding!"),
    (15.3, 17.8, "DANIEL: (quietly) …I promise."),
    (22.0, 23.3, "ANNA: Who are you talking to?"),
    (23.4, 24.8, "DANIEL: (too quickly) Practising a speech. Go to sleep."),
    (30.6, 34.6, "SAM: (whispering) Over, under, through."),
    (44.35, 46.5, "DANIEL: (recording) Hey, baby girl… I'm sorry I'm not there."),
    (47.4, 49.4, "DANIEL: (recording) But I promised you a dance."),
    (50.0, 52.9, "MIA: (whispering) One, two, three…"),
    (53.35, 56.3, "DANIEL: (recording) Sam… take care of her for me."),
    (56.5, 58.6, "DANIEL: (recording) Anna… thank you for staying brave."),
]
END = [(59.0, 65.0, "He couldn't stay.\\NSo he made sure\\Nthey'd be okay."), ]
END2 = [(60.8, 65.0, "Hug your dad today.\\NSay it out loud.")]

def ts(s):
    h = int(s // 3600); m = int(s % 3600 // 60); sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"
def esc(t):
    if ":" in t and t.split(":")[0].isupper():
        who, line = t.split(":", 1); line = line.strip()
        if line.startswith("("):
            note, rest = line[1:].split(")", 1); line = r"{\i1}(" + note + r"){\i0} " + rest.strip()
        return who + ": " + line
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
Style: Letter,Playfair Display,72,&H00FFFFFF,&H000000FF,&H78000000,&H00000000,0,1,0,0,100,100,0,0,3,18,0,8,70,70,165,1
Style: Scene,Inter,50,&H0000E6FF,&H000000FF,&H10000000,&H00000000,-1,1,0,0,100,100,0,0,3,14,0,8,50,50,1090,1
Style: Mid,Inter,60,&H00FFFFFF,&H000000FF,&H10000000,&H00000000,-1,0,0,0,100,100,0,0,3,16,0,8,50,50,1225,1
Style: End,Playfair Display,92,&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,0,1,0,0,100,100,0,0,1,2,6,5,70,70,0,1
Style: End2,Inter,54,&H0000E6FF,&H000000FF,&H40000000,&H00000000,-1,0,0,0,100,100,0,0,3,16,0,8,80,80,1130,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(os.path.join(HERE, "subs35.ass"), "w") as f:
    f.write(HEAD)
    # close-ups where the face sits high: the letter drops below the subtitle pair so it never covers the eyes
    LOW = [(21.7, 23.6), (36.0, 38.2), (50.0, 54.0)]
    for a, b, t in LETTER:
        cuts = sorted({a, b} | {x for w in LOW for x in w if a < x < b})
        for i, (u, v) in enumerate(zip(cuts, cuts[1:])):
            low = any(w0 <= u and v <= w1 for w0, w1 in LOW)
            fi = 450 if i == 0 else 0; fo = 350 if v == b else 0
            pos = "\\an8\\pos(540,1340)" if low else ""
            f.write(f"Dialogue: 0,{ts(u)},{ts(v)},Letter,,0,0,0,,{{{pos}\\fad({fi},{fo})}}{t}\n")
    for a, b, t in SCENE: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Scene,,0,0,0,,{{\\fad(200,200)}}{esc(t)}\n")
    for a, b, t in DIALOG: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Mid,,0,0,0,,{{\\fad(150,150)}}{esc(t)}\n")
    for a, b, t in END: f.write(f"Dialogue: 1,{ts(a)},{ts(b)},End,,0,0,0,,{{\\pos(540,780)\\fad(900,500)}}{t}\n")
    for a, b, t in END2: f.write(f"Dialogue: 1,{ts(a)},{ts(b)},End2,,0,0,0,,{{\\fad(700,500)}}{t}\n")
print("wrote subs35.ass")
