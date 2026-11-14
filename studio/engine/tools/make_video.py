"""make_video.py <story-slug> [--jobs N] [--frames a-b] [--skip-render]
Story folder: studio/stories/<slug>/ (story.json, business.js, audio/). Pipeline (free, no credits):
  validate -> lip-sync envelope (+ alignment if words.json missing) -> render frames in parallel -> cue sheet -> SFX -> mix -> encode 1080x1920 -> QA."""
import sys, os, json, subprocess, argparse, time
ap = argparse.ArgumentParser(); ap.add_argument('slug'); ap.add_argument('--jobs', type=int, default=3); ap.add_argument('--frames'); ap.add_argument('--skip-render', action='store_true'); a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__)); STUDIO = os.path.abspath(os.path.join(HERE, '../..')); SD = os.path.join(STUDIO, 'stories', a.slug); B = os.path.join(SD, 'build'); os.makedirs(B, exist_ok=True)
S = json.load(open(os.path.join(SD, 'story.json'))); PY = os.environ.get('STUDIO_PY', sys.executable)
def run(*cmd, **kw): print('$', ' '.join(map(str, cmd)), flush=True); subprocess.run(list(map(str, cmd)), check=True, **kw)
# 1. validate: required fields, every performance refers to a cast member, shots cover the duration
assert all(k in S for k in ('period', 'set', 'cast', 'shots', 'duration')), 'story.json missing required fields'
for k in S.get('performances', {}): assert k in S['cast'], f'performance for unknown character {k}'
cov = sorted((s['a'], s['b']) for s in S['shots']); assert cov[0][0] <= 0 and cov[-1][1] >= S['duration'] - 1e-6, 'shots do not cover the duration'
# 2. speech data: word timings (align.py from the script) and loudness envelope (envelope.py) per dialogue line
for line in S.get('dialogue', []):
    wav = os.path.join(SD, S['audio']['voice']); words = os.path.join(SD, line['words'])
    if not os.path.exists(words):
        sc = os.path.join(B, 'script.txt'); open(sc, 'w').write('\n'.join(x.strip() + ('.' if not x.strip().endswith(('.', '!', '?')) else '') for x in line['script'].replace('...', '.').split('.') if x.strip()))
        run(PY, os.path.join(HERE, 'align.py'), wav, sc, os.path.join(B, 'timing.json')); json.dump(json.load(open(os.path.join(B, 'timing.json')))['words'], open(words, 'w'))
    run(PY, os.path.join(HERE, 'envelope.py'), wav, os.path.join(SD, line['env']))
# 3. render frames (parallel chunks; deterministic per frame so chunks can be resumed)
total = round(S['duration'] * S.get('fps', 30)); FR = os.path.join(B, 'frames'); env = {**os.environ, 'RESUME': '1'}
if not a.skip_render:
    lo, hi = (map(int, a.frames.split('-')) if a.frames else (0, total - 1)); n = hi - lo + 1; step = (n + a.jobs - 1) // a.jobs; t0 = time.time()
    procs = [subprocess.Popen(['node', os.path.join(HERE, 'render.mjs'), a.slug, FR, f'{lo + i * step}-{min(hi, lo + (i + 1) * step - 1)}'], env=env) for i in range(a.jobs) if lo + i * step <= hi]
    assert all(p.wait() == 0 for p in procs), 'render failed'; print(f'rendered {n} frames in {time.time() - t0:.0f}s')
# 4. sound: cue sheet from the animation -> SFX -> mix
run('node', os.path.join(HERE, 'render.mjs'), a.slug, '--cues', os.path.join(B, 'cues.json'))
run(PY, os.path.join(HERE, 'sfxlib.py'), os.path.join(B, 'cues.json'), os.path.join(B, 'sfx.wav'), ','.join(S.get('ambience', [])))
au = S['audio']; run('bash', os.path.join(HERE, 'mix.sh'), B, os.path.join(SD, au['voice']), au.get('voiceOffset', 0), os.path.join(SD, au['music']), au.get('musicLUFS', -24), S['duration'])
# 5. encode genuine 1080x1920 H.264 + AAC, then QA
mp4 = os.path.join(B, f"{a.slug}.mp4")
run('ffmpeg', '-v', 'error', '-y', '-framerate', S.get('fps', 30), '-i', os.path.join(FR, 'f%04d.jpg'), '-i', os.path.join(B, 'mix.wav'), '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=1080:1920:flags=lanczos,setsar=1', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4)
run(sys.executable, os.path.join(HERE, 'qa.py'), FR, os.path.join(SD, 'story.json'), os.path.join(B, 'qa_sheet.jpg'), mp4)
print('OUTPUT', mp4)
