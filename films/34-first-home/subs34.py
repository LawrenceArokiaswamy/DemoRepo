# Film 34 subtitles: the letter (serif, near the top), and the streaming-style pair 30% up from the bottom
# (yellow scene line, white dialogue with speaker + delivery). Writes subs34.ass (libass, 1080x1920).
import os
HERE = os.path.dirname(os.path.abspath(__file__))
LETTER = [
    (0.4, 4.8, "Before you…\\Nshe was someone else."),
    (5.6, 9.9, "Then you happened."),
    (10.2, 16.8, "She gave you her body first."),
    (17.3, 23.5, "Then hours of a pain doctors\\Nrate above a broken bone."),
    (26.4, 31.8, "And she forgot all of it."),
    (32.4, 39.8, "She packed herself away.\\NQuietly."),
    (40.3, 46.3, "Even her name\\Nbecame “Mom”."),
    (47.0, 53.8, "Everything she was…\\Nshe gave to you."),
]
SCENE = [
    (1.0, 4.8, "[She had dreams of her own.]"),
    (10.3, 12.3, "[Sick every morning.]"),
    (12.5, 14.7, "[Awake at 3 AM.]"),
    (14.9, 16.8, "[Her blood volume rose almost 50%.]"),
    (17.3, 20.9, "[Hour 2.]"),
    (20.9, 23.5, "[Hour 14.]"),
    (32.4, 35.8, "[Her dress. Her dancing shoes. Her drawings.]"),
    (36.0, 39.8, "[She never told anyone.]"),
    (40.3, 42.4, "[Years went by.]"),
    (46.8, 49.9, "[Years later, he found the box.]"),
    (50.3, 53.8, "[He finally sees her.]"),
]
DIALOG = [
    (8.6, 9.9, "SHE: (whispering) Hi, little one…"),
    (21.8, 23.5, "SHE: (gasping) I can do this…"),
    (24.35, 25.6, "[baby crying]"),
    (28.3, 31.6, "SHE: (softly) Hi… I'm your mom."),
    (40.5, 42.4, "KID: (calling) Mom! Mom!"),
    (42.7, 44.6, "SON: (not looking) Mom, why don't you ever dress up?"),
    (44.8, 46.3, "MOM: (smiling) I'm fine like this."),
    (55.4, 56.9, "SON: (crying) Thank you, Ma."),
]
END = [(57.0, 62.0, "Her body was\\Nyour first home."), ]
END2 = [(58.8, 62.0, "She gave you everything she was.\\NRemind her who she is.")]

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
with open(os.path.join(HERE, "subs34.ass"), "w") as f:
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
print("wrote subs34.ass")
