"""Single source of truth for timing. Writes cues.js for the composition; mix.py imports it."""
import json, os

FPS = 60
DUR = 60.0
BPM = 145.0
B = 60.0 / BPM          # one beat = 0.41379 s
D = 18.0                # THE DROP (sub-bass boom + flash)

def bar(n):  # bar n after the drop
    return round(D + n * 4 * B, 4)

VO = {  # clip -> start time in the film
    "nurse": 0.80,
    "stella_promise": 11.70,   # "...and I've got you." ends ~17.45, then 1 beat of silence
    "s1": bar(3) - 0.10,       # Location identified.
    "s2": bar(4) + 0.30,       # Root cause found.
    "s3": bar(6) + 0.75,       # Remote control engaged.
    "s4": bar(8) + 0.25,       # Rolling back.
    "s5": bar(12) + 0.15,      # Locked down.
    "s6": bar(13) + 0.25,      # Priority one is logged.
    "s7": bar(20) + 0.20,      # Ward Four is back online.
}

SILENCE = (round(D - B, 4), D)   # 1 beat of silence before the downbeat

SCENES = {   # section windows (seconds)
    "call": (0.0, 11.5), "stella": (11.5, SILENCE[0]),
    "blackhole": (D, bar(2)), "constellation": (bar(2), bar(4)), "diag": (bar(4), bar(6)),
    "remote": (bar(6), bar(8)), "road": (bar(8), bar(10)), "flap": (bar(10), bar(12)),
    "lock": (bar(12), bar(13)), "ticket": (bar(13), bar(15)), "slabs": (bar(15), bar(19)),
    "ba": (bar(19), bar(20)), "online": (bar(20), bar(21.5)), "end": (bar(21.5), DUR),
}

EVENTS = {
    "click1": bar(6) + 0.66, "click2": bar(7) + 1.05, "stamp": bar(14), "lockshut": bar(12) + 0.40,
    "end_w1": bar(21.5), "end_w2": bar(22), "end_w3": bar(22.5), "logo": bar(23.5), "tagline": bar(24),
    "flap_start": bar(10) + 0.25, "flap_full": bar(11) + 0.40,
}

# Transition hits (flash / chromatic aberration / whoosh)
HITS = [D, bar(2), bar(4), bar(6), bar(8), bar(10), bar(12), bar(13), EVENTS["stamp"], bar(15),
        bar(16), bar(17), bar(18), bar(19), bar(20), bar(21.5), bar(22), bar(22.5), EVENTS["logo"]]

if __name__ == "__main__":
    out = dict(FPS=FPS, DUR=DUR, BPM=BPM, B=B, D=D, VO=VO, SILENCE=SILENCE, SCENES=SCENES, EVENTS=EVENTS, HITS=HITS)
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cues.js")
    open(p, "w").write("window.CUES=" + json.dumps(out, indent=1) + ";\n")
    for k, v in SCENES.items():
        print(f"{k:14} {v[0]:6.2f} – {v[1]:6.2f}")
