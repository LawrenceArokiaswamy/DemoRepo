"""Align a known script (one phrase per line) to narration audio using detected pauses.
DP groups consecutive speech segments into phrases so that each phrase's duration matches its
syllable share; words inside a phrase are spread by syllables. usage: align.py audio script.txt out.json"""
import sys, re, json, subprocess
audio, script, out = sys.argv[1:4]
def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower()); v = re.findall(r"[aeiouy]+", w); n = len(v)
    if w.endswith("e") and n > 1 and not w.endswith(("le", "ee")): n -= 1
    return max(1, n)
phr = [l.strip() for l in open(script) if l.strip()]
words = [p.split() for p in phr]; ps = [sum(syl(w) for w in ws) + 0.6 for ws in words]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio], capture_output=True, text=True).stdout)
err = subprocess.run(["ffmpeg", "-i", audio, "-af", "silencedetect=noise=-38dB:d=0.1", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r"silence_start: ([0-9.]+)", err)]; en = [float(v) for v in re.findall(r"silence_end: ([0-9.]+)", err)]
segs, cur = [], 0.0
for a, b in zip(st, en):
    if a > cur + 0.05: segs.append((cur, a))
    cur = b
if cur < dur - 0.05: segs.append((cur, dur))
N, M = len(phr), len(segs); tot = sum(b - a for a, b in segs); exp = [p / sum(ps) * tot for p in ps]
INF = 1e9; D = [[INF] * (M + 1) for _ in range(N + 1)]; B = [[0] * (M + 1) for _ in range(N + 1)]; D[0][0] = 0
for i in range(1, N + 1):
    for j in range(i, M - (N - i) + 1):
        for k in range(i - 1, j):
            if D[i - 1][k] >= INF: continue
            d = segs[j - 1][1] - segs[k][0]; c = D[i - 1][k] + ((d - exp[i - 1]) / max(exp[i - 1], 0.3)) ** 2
            if c < D[i][j]: D[i][j], B[i][j] = c, k
spans, j = [], M
for i in range(N, 0, -1): k = B[i][j]; spans.append((segs[k][0], segs[j - 1][1])); j = k
spans.reverse(); W = []
for (a, b), ws in zip(spans, words):
    s = [syl(w) for w in ws]; t = a
    for w, n in zip(ws, s): d = (b - a) * n / sum(s); W.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)}); t += d
json.dump({"duration": dur, "phrases": [{"text": p, "start": round(a, 3), "end": round(b, 3)} for p, (a, b) in zip(phr, spans)], "words": W}, open(out, "w"), indent=1)
for p, (a, b) in zip(phr, spans): print(f"{a:6.2f}-{b:6.2f}  {p}")
