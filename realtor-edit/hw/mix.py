"""Her voice + very soft UI sound effects (no music). Master to -14 LUFS for Instagram."""
import json, subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); C = f"{H}/../comp"; T = json.load(open(f"{C}/timeline.json"))
# cold open: soft impact on the first shock, whooshes on the cut and into the 3D world
T["sfx"] += [{"n": "thump", "t": 0.0, "g": -20}, {"n": "whoosh-short", "t": 0.5, "g": -22}, {"n": "whoosh-short", "t": 1.12, "g": -20}]
NAME = {"tick": "click", "click-soft": "click-soft", "pop": "pop", "whoosh-short": "whoosh-short", "chime": "chime", "thump": "thump"}
ins = ["-i", f"{H}/../work/aroll.mov"]; parts = ["[0:a]aformat=sample_rates=48000:channel_layouts=stereo[v]"]; labels = []
for i, s in enumerate(T["sfx"], 1):
    ins += ["-i", f"{C}/assets/sfx/{NAME[s['n']]}" + (".wav" if s["n"] == "thump" else ".mp3")]; ms = int(s["t"] * 1000)
    parts.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=200,lowpass=f=9000,volume={s['g'] + 8}dB,adelay={ms}|{ms}[s{i}]"); labels.append(f"[s{i}]")
parts.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0[fx]")
parts.append("[v][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[m]")
pre = f"{H}/../work/mix_pre_hw.wav"; out = f"{H}/../work/final_mix_hw.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(parts), "-map", "[m]", "-ar", "48000", pre], check=True)
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-ar", "48000", out], check=True)
print(len(labels), "sfx mixed; master", m["input_i"], "→ -14 LUFS")
