# usage: fish_tts.py OUT.wav VOICE_ID MODEL TEXTFILE [temperature] [top_p] [speed]
import sys, json, urllib.request
out, ref, model, tf = sys.argv[1:5]
temp = float(sys.argv[5]) if len(sys.argv) > 5 else 0.7
top_p = float(sys.argv[6]) if len(sys.argv) > 6 else 0.7
speed = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0
body = {"text": open(tf).read().strip(), "reference_id": ref, "format": "wav", "sample_rate": 44100,
        "temperature": temp, "top_p": top_p, "normalize": True, "latency": "normal", "prosody": {"speed": speed, "volume": 0}}
req = urllib.request.Request("https://api.fish.audio/v1/tts", data=json.dumps(body).encode(),
      headers={"Content-Type": "application/json", "model": model, "Authorization": "Bearer proxy-injected"})
try:
    d = urllib.request.urlopen(req, timeout=300).read()
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300]); sys.exit(1)
open(out, "wb").write(d); print("ok", out, len(d))
