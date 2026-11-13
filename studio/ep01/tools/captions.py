#!/usr/bin/env python3
"""Word-timed caption groups -> ASS subtitles (original). captions.py timing.json out.ass"""
import json, sys, re
T = json.load(open(sys.argv[1])); W = T["words"]
KEY = {"ruin", "lime", "lumps", "sloppy", "thousand", "crumbled", "crack", "seal", "pockets", "dissolves", "fresh", "stone", "heals"}
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
groups, cur = [], []
for i, w in enumerate(W):
    cur.append(w); txt = " ".join(x["w"] for x in cur); end_phrase = re.search(r"[.!?,]$|\.\.\.$", w["w"])
    nxt_gap = W[i + 1]["start"] - w["end"] if i + 1 < len(W) else 1
    if end_phrase or len(cur) >= 3 or len(txt) >= 13 or nxt_gap > 0.15: groups.append(cur); cur = []
if cur: groups.append(cur)
lines = []
for gi, g in enumerate(groups):
    a = g[0]["start"]; b = groups[gi + 1][0]["start"] if gi + 1 < len(groups) else g[-1]["end"] + 0.4
    b = min(b, g[-1]["end"] + 0.45)
    words = []
    for w in g:
        clean = re.sub(r"[^A-Za-z]", "", w["w"]).lower(); t = w["w"].replace("...", "…")
        words.append("{\\c&H0048D6FF&}" + t + "{\\c&H00FFFFFF&}" if clean in KEY else t)
    lines.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\pos(540,1290)\\fscx86\\fscy86\\t(0,90,\\fscx100\\fscy100)}}" + " ".join(words))
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Display,92,&H00FFFFFF,&H00FFFFFF,&H00141010,&H96000000,-1,0,0,0,100,100,0,0,1,7,4,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(sys.argv[2], "w").write(hdr + "\n".join(lines) + "\n"); print(len(groups), "caption groups")
for g in groups[:8]: print(round(g[0]["start"], 2), " ".join(x["w"] for x in g))
