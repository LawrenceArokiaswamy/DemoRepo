# Fish Audio narration, one API call per line (sequential: the account allows one request at a time).
#   python3 gen.py FILM_DIR [ids...]   reads FILM_DIR/fish_vo.json, writes FILM_DIR/vo_fish/<id>.wav
#   With no ids it skips lines already generated; with ids it retakes just those lines.
# fish_vo.json: {"voice": <Fish model id>, "model": "s2-pro", "speed": 1.07,
#                "lines": [[id, text with [delivery tags], gap_after_s, optional_speed], ...]}
# The API key is injected by the network proxy for api.fish.audio (environment secret); nothing is stored here.
import json, os, sys, subprocess
d = os.path.abspath(sys.argv[1]); S = json.load(open(f'{d}/fish_vo.json')); only = set(sys.argv[2:])
raw = f'{d}/vo_fish'; os.makedirs(raw, exist_ok=True)
for L in S['lines']:
    lid, txt = L[0], L[1]; spd = L[3] if len(L) > 3 else S.get('speed', 1.0)
    out = f'{raw}/{lid}.wav'
    if (only and lid not in only) or (not only and os.path.exists(out)): continue
    open(f'{raw}/{lid}.txt', 'w').write(txt)
    for attempt in range(3):
        r = subprocess.run([sys.executable, os.path.dirname(os.path.abspath(__file__)) + '/fish_tts.py', out, S['voice'], S['model'], f'{raw}/{lid}.txt',
                            str(S.get('temperature', .7)), str(S.get('top_p', .7)), str(spd)], capture_output=True, text=True)
        print(lid, r.stdout.strip())
        if r.returncode == 0: break
