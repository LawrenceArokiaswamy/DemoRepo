"""Her voice + very soft UI sound effects (no music). Master to -14 LUFS for Instagram."""
import json, subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); T = json.load(open(f"{H}/timeline.json"))
NAME = {"tick": "click", "click-soft": "click-soft", "pop": "pop", "whoosh-short": "whoosh-short", "chime": "chime"}
ins = ["-i", f"{H}/../work/aroll.mov"]; parts = ["[0:a]aformat=sample_rates=48000:channel_layouts=stereo[v]"]; labels = []
for i, s in enumerate(T["sfx"], 1):
    ins += ["-i", f"{H}/assets/sfx/{NAME[s['n']]}.mp3"]; ms = int(s["t"] * 1000)
    parts.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=200,lowpass=f=9000,volume={s['g'] + 8}dB,adelay={ms}|{ms}[s{i}]"); labels.append(f"[s{i}]")
parts.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0[fx]")
parts.append("[v][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[m]")
pre = f"{H}/../work/mix_pre.wav"; out = f"{H}/../work/final_mix.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(parts), "-map", "[m]", "-ar", "48000", pre], check=True)
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-ar", "48000", out], check=True)
print(len(labels), "sfx mixed; master", m["input_i"], "→ -14 LUFS")
