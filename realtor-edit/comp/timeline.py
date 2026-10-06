"""One timeline for picture + sound. Every time is pinned to a real word in her (edited) speech.
Writes timeline.json (for the mix) and timeline.js (window.TL, for the composition)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(os.path.join(HERE, "assets/words.json")))
C = json.load(open(os.path.join(HERE, "../work/cuts.json")))
DUR = round(C["duration"], 3)

def at(word, after=0.0, offset=0.0):
    """Start time of the first word matching `word` at/after `after` seconds."""
    w0 = word.lower().strip(".,!?")
    for w in W:
        if w["s"] >= after - 1e-3 and w["w"].lower().strip(".,!?") == w0:
            return round(w["s"] + offset, 3)
    raise KeyError(word)

def end(word, after=0.0):
    w0 = word.lower().strip(".,!?")
    for w in W:
        if w["s"] >= after - 1e-3 and w["w"].lower().strip(".,!?") == w0:
            return round(w["e"], 3)
    raise KeyError(word)

# cut points inside the edit (we alternate punch-in on each, to hide jump cuts)
cuts, t = [], 0.0
for s, e in C["segments"][:-1]:
    t += e - s; cuts.append(round(t, 3))

T = {}
T["hook"] = 0.0
T["mia"] = at("M", 5)
T["lawyer"] = at("lawyer", 6)
T["walk"] = at("First", 7)
T["days"] = at("one", 9)
T["tips"] = [at("As", 12), at("Next", 22), at("Make", 31), at("Check", 37), at("Last", 46)]
T["ticks"] = [end("those", 21), end("well", 29), end("properly", 36), end("it", 46), end("house", 58)]
T["allDone"] = at("These", 59)
T["checklist"] = at("checklist", 62)
T["dm"] = at("DM", 64)
T["endcard"] = at("always", 70) - 0.2
T["dur"] = DUR

# icon pops, pinned to the word that names them
T["icons"] = [
    [{"i": "lock", "l": "Locks", "t": at("locks", 14)}, {"i": "door-open", "l": "Main door", "t": at("main", 15)},
     {"i": "warehouse", "l": "Garage remotes", "t": at("garage", 16)}, {"i": "trees", "l": "Backyard", "t": at("backyard", 17)}],
    [{"i": "refrigerator", "l": "Appliances", "t": at("appliances", 25)}, {"i": "cooking-pot", "l": "Stove", "t": at("kitchen", 26)},
     {"i": "microwave", "l": "Microwave", "t": at("working", 26.5)}, {"i": "washing-machine", "l": "Washer & dryer", "t": at("washer", 28)}],
    [{"i": "droplets", "l": "Under sinks", "t": at("under", 33)}, {"i": "shield-check", "l": "No leaks", "t": at("leakages", 35)},
     {"i": "wrench", "l": "Faucets", "t": at("faucets", 36)}],
    [], [],
]
# B-roll cutaways (card over a softly blurred her). src, start, dur, media-start
T["broll"] = [
    {"src": "13126", "t": at("walkthrough", 9) - 0.15, "d": 2.5, "m": 3.0},
    {"src": "27591", "t": at("main", 15) - 0.1, "d": 2.3, "m": 2.0},
    {"src": "34140", "t": at("backyard", 17) + 0.1, "d": 2.0, "m": 2.5},
    {"src": "43033", "t": at("appliances", 25) - 0.25, "d": 2.4, "m": 2.0},
    {"src": "15041", "t": at("washer", 28) - 0.2, "d": 2.3, "m": 3.0},
    {"src": "24211", "t": at("sinks", 32) - 0.1, "d": 2.2, "m": 4.0},
    {"src": "1523", "t": at("faucets", 36) - 0.35, "d": 1.9, "m": 6.0},
    {"src": "15065", "t": at("send", 69) - 0.1, "d": 2.3, "m": 6.0},
]
# custom graphics for tips 4 & 5
T["ceiling"] = {"t": at("ceiling", 38) - 0.1, "stain": at("leakage", 41), "changes": at("changes", 43), "out": end("it", 46) - 0.05}
T["fixtures"] = {"t": at("thermostat", 51) - 0.3, "holes": at("holes", 53), "major": at("major", 57), "out": end("house", 58) + 0.1}
T["cuts"] = cuts

# soft sound effects (name, time, gain dB) — kept quiet so her voice leads
sfx = []
sfx += [("click-soft", t, -24) for t in T["tips"]]
sfx += [("pop", ic["t"], -27) for grp in T["icons"] for ic in grp]
sfx += [("whoosh-short", b["t"] - 0.05, -28) for b in T["broll"]]
sfx += [("tick", t, -22) for t in T["ticks"]]
sfx += [("pop", T["mia"], -26), ("pop", T["lawyer"], -26), ("click-soft", T["walk"], -24), ("pop", T["days"], -26),
        ("whoosh-short", T["ceiling"]["t"], -28), ("pop", T["ceiling"]["stain"], -27), ("whoosh-short", T["fixtures"]["t"], -28),
        ("pop", T["fixtures"]["holes"], -27), ("chime", T["allDone"], -24), ("pop", T["checklist"], -26), ("pop", T["dm"], -24),
        ("whoosh-short", T["endcard"], -28)]
T["sfx"] = [{"n": n, "t": round(t, 3), "g": g} for n, t, g in sorted(sfx, key=lambda x: x[1])]

json.dump(T, open(os.path.join(HERE, "timeline.json"), "w"), indent=1)
open(os.path.join(HERE, "timeline.js"), "w").write("window.TL=" + json.dumps(T) + ";\n")
if __name__ == "__main__":
    print("duration", DUR, "| tips", T["tips"], "| ticks", T["ticks"])
    print("broll", [(b["src"], b["t"]) for b in T["broll"]]); print("cuts", cuts); print(len(T["sfx"]), "sfx")
