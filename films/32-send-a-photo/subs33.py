# Film 33 subtitles (from the film 32 template), streaming-style (SDH): a scene/emotion line at the top, dialogue with speaker and delivery plus
# sound cues just above the middle. White text on dark boxes so it reads on any shot. Writes subs.ass (libass).
import os
HERE = os.path.dirname(os.path.abspath(__file__))

# [start s, end s, text] — scene line: what is happening and what they feel
TOP = [
    (0.3, 4.9, "[Dad's slippers. Taped. Again.]"),
    (5.2, 8.4, "[20 years ago. The shoe store.]"),
    (8.6, 11.4, "[He counted every bill twice]"),
    (11.6, 14.4, "[He kept his son dry. Not himself.]"),
    (14.6, 18.4, "[She mended hers. She bought him new.]"),
    (18.6, 21.9, "[He got the new one. She kept the old.]"),
    (22.1, 25.9, "[There was never enough for three]"),
    (26.1, 29.9, "[She went to bed hungry. Again.]"),
    (30.1, 33.9, "[Dad took the night shifts nobody wanted]"),
    (34.1, 39.9, "[A new laptop. Dad's phone stayed cracked.]"),
    (40.1, 43.9, "[Their best clothes were ten years old]"),
    (44.1, 47.9, "[They stood aside… and still smiled]"),
    (60.1, 63.9, "[Dad's wardrobe. Everything still patched.]"),
    (64.1, 67.9, "[He kept the receipt. For twenty years.]"),
    (68.1, 71.9, "[Every dollar he sent… never spent]"),
    (72.1, 76.9, "[This time, he didn't let her refuse]"),
    (77.1, 81.9, "[She cried over a pair of slippers]"),
]
# phone screens: the scene line goes to the very top so it never covers the messages
TOPUI = [
    (48.1, 55.9, "[Years later. He had money to give back.]"),
    (56.1, 59.9, "[Then the call no one wants]"),
]
# dialogue (SPEAKER: (delivery) line), narration and sound cues
MID = [
    (0.6, 4.8, "My dad wore the same slippers for eleven years."),
    (5.6, 7.8, "BOY: (excited) Those ones, Dad!"),
    (9.9, 11.4, "DAD: (smiling) Only the best for you."),
    (11.7, 14.3, "[rain pouring]"),
    (18.9, 21.8, "MOM: (softly) I don't need anything. Mine still fits."),
    (22.4, 25.6, "[spoons on plates]"),
    (26.4, 28.0, "MOM: (gently) Eat, I'm not hungry."),
    (28.1, 29.7, "[stomach growls]"),
    (30.4, 33.6, "[the booth light hums]"),
    (35.7, 37.3, "SON: (not looking up) Finally."),
    (37.4, 39.6, "DAD: (proud) Study hard."),
    (41.3, 43.8, "SON: (embarrassed) Can you guys… stand over there?"),
    (46.5, 47.8, "[camera clicks]"),
    (60.4, 63.6, "[wardrobe door creaks]"),
    (68.4, 71.6, "[he can't hold it in]"),
    (74.4, 76.8, "MOM: (tearful) I don't need anything…"),
    (77.5, 81.6, "SON: (softly) I know, Mom. That's why."),
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
Style: Top,Inter,52,&H0000E6FF,&H000000FF,&H10000000,&H00000000,-1,1,0,0,100,100,0,0,3,14,0,8,50,50,1090,1
Style: TopUI,Inter,52,&H0000E6FF,&H000000FF,&H10000000,&H00000000,-1,1,0,0,100,100,0,0,3,14,0,8,50,50,150,1
Style: Mid,Inter,64,&H00FFFFFF,&H000000FF,&H10000000,&H00000000,-1,0,0,0,100,100,0,0,3,16,0,8,50,50,1235,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(os.path.join(HERE, "subs33.ass"), "w") as f:
    f.write(HEAD)
    for a, b, t in TOP: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Top,,0,0,0,,{{\\fad(200,200)}}{esc(t)}\n")
    for a, b, t in TOPUI: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},TopUI,,0,0,0,,{{\\fad(200,200)}}{esc(t)}\n")
    for a, b, t in MID: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Mid,,0,0,0,,{{\\fad(150,150)}}{esc(t)}\n")
print("wrote subs33.ass")
