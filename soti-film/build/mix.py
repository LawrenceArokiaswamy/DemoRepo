"""Sound mix for the SOTI film. Every cue comes from cues.py so picture and sound share one clock.
Usage: python3 mix.py  -> assets/mix/final_mix.wav (-14 LUFS integrated, -1 dBTP)"""
import json, os, subprocess
from cues import VO, SCENES as SC, EVENTS as EV, D, B, SILENCE, bar, DUR

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda p: os.path.join(HERE, "assets", p)
OUT = A("mix"); os.makedirs(OUT, exist_ok=True)
SR = 48000

clips = []  # (file, at, trim_start, trim_dur, gain_db, extra_filters, bus)
def add(f, at, gain=0.0, ss=0.0, dur=None, fx="", bus="sfx"):
    clips.append((f, at, ss, dur, gain, fx, bus))

PHONE = "highpass=f=320,lowpass=f=3300,acompressor=threshold=-22dB:ratio=5:attack=4:release=60,asoftclip=type=tanh,volume=2.2"
STELLA = "highpass=f=90,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,aecho=0.85:0.5:38|71:0.13|0.08,equalizer=f=3500:t=q:w=1.2:g=2"

# ---------- pre-drop: the call ----------
add(A("music/underscore_echoes.mp3"), 0.0, -12, ss=4.0, dur=SILENCE[0], fx="afade=t=in:d=1.5,afade=t=out:st=%.3f:d=0.25" % (SILENCE[0] - 0.25), bus="music")
add(A("sfx/heart_fast.mp3"), 0.6, -20, dur=10.4, fx="lowpass=f=900,afade=t=in:d=1.5,afade=t=out:st=8.6:d=1.8")
add(A("sfx/dial.mp3"), 0.0, -14, dur=0.62, fx="afade=t=out:st=0.5:d=0.12," + PHONE)
add(A("sfx/click_device.mp3"), 0.64, -10, dur=0.4)
# hospital room heard *through the phone*: respirator + distant critical alarm
add(A("sfx/respirator.mp3"), 0.7, -21, dur=10.6, fx=PHONE + ",afade=t=in:d=0.3,afade=t=out:st=9.8:d=0.8")
for k in range(4):
    add(A("sfx/critical_alarm.mp3"), 1.2 + k * 2.6, -25, fx=PHONE)
add(A("vo/nurse.wav"), VO["nurse"], 4.0, fx=PHONE, bus="vo")
add(A("sfx/click_select.mp3"), 10.75, -14, dur=0.3)            # line hands over to Stella
add(A("sfx/ui_start.mp3"), 11.2, -12, dur=1.6)                  # Stella card morphs in
# ---------- Stella's promise ----------
add(A("vo/stella_promise.wav"), VO["stella_promise"], 9.0, fx=STELLA, bus="vo")
# chips pop on spoken words
nurse_w = json.load(open(A("vo/vo.json")))
def wt(clip, i): return VO[clip] + nurse_w[clip]["words"][i]["s"]
for i in (8, 13, 17, 23): add(A("sfx/glitch_scifi.mp3"), wt("nurse", i) - 0.02, -19)
for i in (1, 8, 10, 15, 17): add(A("sfx/pop.mp3"), wt("stella_promise", i) - 0.02, -13)
# riser → 1 beat of silence → boom
add(A("sfx/riser_tech.mp3"), SILENCE[0] - 5.0, -14, ss=12.6, dur=5.0, fx="afade=t=in:d=2.5")
add(A("sfx/riser.mp3"), SILENCE[0] - 2.61, -9, dur=2.61)

# ---------- THE DROP ----------
add(A("music/drop_infected_mushroom_vibes.mp3"), D, ss=33.41, dur=DUR - D, gain=-5.5, fx="afade=t=out:st=%.3f:d=1.4" % (DUR - D - 1.4), bus="music")
# second layer: trailer drums, tempo-locked (both exactly 145 BPM), entering at bar 4 and building to the slabs
LAYER_START = bar(4)
add(A("music/layer_epical_drums_06.mp3"), LAYER_START, ss=1.678 + 36 * B, dur=DUR - LAYER_START,
    fx="volume='if(lt(t,%.3f),0,min(1,0.18+0.82*(t-%.3f)/%.3f))':eval=frame,afade=t=out:st=%.3f:d=1.2" % (LAYER_START, LAYER_START, bar(19) - LAYER_START, DUR - LAYER_START - 1.2),
    bus="music_late", gain=-5)
add(A("sfx/boom.mp3"), D, -1)
add(A("sfx/boom_heart.mp3"), D, -4)
add("SUB", D, -2)                                              # synthesized sub-bass drop
add(A("sfx/impact_movie.mp3"), D, -9, dur=3.5)

# ---------- montage system lines ----------
for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7"):
    add(A(f"vo/{k}.wav"), VO[k], 10.0, fx=STELLA + ",equalizer=f=2500:t=q:w=1:g=4", bus="vo")

# ---------- transitions & UI sound design ----------
add(A("sfx/whoosh_fast.mp3"), SC["constellation"][0] - 0.25, -8)
add(A("sfx/beep_pos.mp3"), VO["s1"] - 0.15, -10)                # reticle locks
add(A("sfx/tech_transition.mp3"), SC["diag"][0] - 0.2, -9)      # iris
add(A("sfx/key-press.mp3"), SC["diag"][0] + 0.1, -14); add(A("sfx/key-press.mp3"), SC["diag"][0] + 0.24, -14); add(A("sfx/key-press.mp3"), SC["diag"][0] + 0.38, -14)
add(A("sfx/stamp.mp3"), VO["s2"] + 0.75 + 0.14, -10, dur=1.0)   # ROOT CAUSE stamp
add(A("sfx/glitch_quick.mp3"), SC["remote"][0] - 0.22, -13, dur=0.5)  # panel morphs into button
add(A("sfx/click_cool.mp3"), EV["click1"], -4); add(A("sfx/whoosh_sweep.mp3"), EV["click1"] + 0.05, -12)
add(A("sfx/click_cool.mp3"), EV["click2"], -4)
add(A("sfx/whoosh_elec.mp3"), EV["click2"] + 0.05, -8, dur=1.4)  # flood
add(A("sfx/whoosh_pass.mp3"), SC["road"][0], -9, dur=3.1)
add(A("sfx/glitch_break.mp3"), SC["flap"][0], -8)              # flash cut
add(A("sfx/scanner.mp3"), EV["flap_start"], -10, dur=EV["flap_full"] - EV["flap_start"] + 0.2, fx="afade=t=out:st=%.3f:d=0.2" % (EV["flap_full"] - EV["flap_start"]))
add(A("sfx/typing.mp3"), EV["flap_start"], -13, dur=EV["flap_full"] - EV["flap_start"] + 0.5)
add(A("sfx/positive.mp3"), EV["flap_full"] + 0.15, -8)          # ONLINE
add(A("sfx/whoosh_sweep.mp3"), SC["lock"][0] - 0.2, -11)
add(A("sfx/stamp.mp3"), EV["lockshut"], -6, dur=1.0)            # lock snaps
add(A("sfx/whoosh_sweep.mp3"), SC["ticket"][0] - 0.2, -11)      # iris
for k in range(5): add(A("sfx/pop.mp3"), SC["ticket"][0] + 0.2 + k * 0.16, -14)
add(A("sfx/stamp.mp3"), EV["stamp"], -2, dur=1.2); add(A("sfx/impact-bass-1.mp3"), EV["stamp"], -8)
add(A("sfx/whoosh_pass.mp3"), SC["slabs"][0] - 0.2, -9, dur=1.8)
for k in (1, 2, 3): add(A("sfx/whoosh_sweep.mp3"), SC["slabs"][0] + k * 4 * B - 0.12, -10)
add(A("sfx/tech_transition.mp3"), SC["ba"][0] - 0.1, -10)
add(A("sfx/whoosh_elec.mp3"), SC["ba"][0] + 0.35, -15, dur=1.2)  # slider sweep
add(A("sfx/whoosh_sweep.mp3"), SC["online"][0] - 0.2, -11)
add(A("sfx/positive.mp3"), SC["online"][0] + 0.25, -10); add(A("sfx/pop.mp3"), SC["online"][0] + 0.25, -12); add(A("sfx/pop.mp3"), SC["online"][0] + 0.45, -12)
# end type hits, word-synced
add(A("sfx/impact-bass-1.mp3"), EV["end_w1"], -3); add(A("sfx/glitch_break.mp3"), EV["end_w1"], -14)
add(A("sfx/impact-bass-1.mp3"), EV["end_w2"], -4)
add(A("sfx/boom_heart.mp3"), EV["end_w3"], -5); add(A("sfx/impact-bass-1.mp3"), EV["end_w3"], -2)
add(A("sfx/logo_hit.mp3"), EV["logo"] - 0.05, -4, dur=DUR - EV["logo"] + 0.05, fx="afade=t=out:st=%.3f:d=1.0" % (DUR - EV["logo"] - 1.0))

# ---------- build the ffmpeg graph ----------
def build():
    inputs, parts, buses = [], [], {"vo": [], "music": [], "music_late": [], "sfx": []}
    for i, (f, at, ss, dur, gain, fx, bus) in enumerate(clips):
        if f == "SUB":
            inputs += ["-f", "lavfi", "-i", f"aevalsrc='0.95*sin(2*PI*(38+46*exp(-t*9))*t)*exp(-t*1.25)':s={SR}:d=4"]
        else:
            inputs += ["-i", f]
        trim = f"atrim=start={ss}" + (f":duration={dur}" if dur else "") + ",asetpts=PTS-STARTPTS"
        chain = [trim, f"aformat=sample_rates={SR}:channel_layouts=stereo"]
        if fx and not fx.startswith("volume='"): chain.append(fx)
        chain.append(f"volume={gain}dB")
        ms = int(round(at * 1000)); chain.append(f"adelay={ms}|{ms}")
        if fx and fx.startswith("volume='"): chain.append(fx)   # time-based automation after the delay (t == film time)
        chain.append(f"apad=whole_dur={DUR}")
        parts.append(f"[{i}:a]{','.join(chain)}[c{i}]"); buses[bus].append(f"[c{i}]")
    g = parts[:]
    for b, ins in buses.items():
        g.append(f"{''.join(ins)}amix=inputs={len(ins)}:normalize=0:dropout_transition=0[{b}]")
    # light ducking: voices push the music down ~4-5 dB
    g.append("[vo]asplit=3[vo_main][vo_key1][vo_key2]")
    g.append("[music][vo_key1]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=300:makeup=1[mduck]")
    g.append("[music_late][vo_key2]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=300:makeup=1[lduck]")
    g.append(f"[vo_main][mduck][lduck][sfx]amix=inputs=4:normalize=0,atrim=0:{DUR},alimiter=limit=0.89:attack=3:release=60[mix]")
    return inputs, ";".join(g)

def run():
    inputs, graph = build()
    pre = os.path.join(OUT, "premix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[mix]", "-ar", str(SR), pre], check=True)
    # two-pass loudness normalisation to -14 LUFS / -1 dBTP
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
    final = os.path.join(OUT, "final_mix.wav")
    af = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-ar", str(SR), final], check=True)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", final, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m2 = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
    print(f"clips: {len(clips)}  premix {m['input_i']} LUFS → final {m2['input_i']} LUFS, true peak {m2['input_tp']} dBTP")

if __name__ == "__main__":
    run()
