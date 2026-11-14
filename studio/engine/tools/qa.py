"""QA: labelled contact sheet (one frame per N, plus each shot's first/middle frame) and hard checks. usage: qa.py <frames_dir> <story.json> <out.jpg> [video.mp4]"""
import sys, json, glob, subprocess
from PIL import Image, ImageDraw, ImageStat
fd, sj, out = sys.argv[1:4]; video = sys.argv[4] if len(sys.argv) > 4 else None; S = json.load(open(sj)); fps = S.get('fps', 30)
frames = sorted(glob.glob(f'{fd}/f*.jpg')); total = round(S['duration'] * fps); problems = []
if len(frames) < total: problems.append(f'missing frames: {len(frames)}/{total}')
picks = []
for sh in S['shots']: picks += [int(sh['a'] * fps) + 2, int((sh['a'] + sh['b']) / 2 * fps), int(sh['b'] * fps) - 3]
picks = sorted(set(min(max(0, p), total - 1) for p in picks)); cols = 6; w, h = 270, 480
sheet = Image.new('RGB', (cols * w, ((len(picks) + cols - 1) // cols) * (h + 22)), '#111'); d = ImageDraw.Draw(sheet)
for i, f in enumerate(picks):
    im = Image.open(f'{fd}/f{f:04d}.jpg'); st = ImageStat.Stat(im.convert('L'))
    if st.mean[0] < 12 or st.mean[0] > 245: problems.append(f'frame {f} nearly black/white (mean {st.mean[0]:.0f})')
    if im.size != (1080, 1920): problems.append(f'frame {f} size {im.size}')
    x, y = (i % cols) * w, (i // cols) * (h + 22); sheet.paste(im.resize((w, h)), (x, y + 22))
    shot = next((s.get('name', '') for s in S['shots'] if s['a'] <= f / fps < s['b']), ''); d.text((x + 4, y + 4), f'{f/fps:5.2f}s {shot[:30]}', fill='#ffd060')
sheet.save(out, quality=88)
if video:
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', video], capture_output=True, text=True); info = json.loads(p.stdout)
    vs = [s for s in info['streams'] if s['codec_type'] == 'video'][0]; print('video', vs['width'], 'x', vs['height'], vs['r_frame_rate'], 'duration', info['format']['duration'], 'audio' if any(s['codec_type'] == 'audio' for s in info['streams']) else 'NO AUDIO')
    if (vs['width'], vs['height']) != (1080, 1920): problems.append(f"video is {vs['width']}x{vs['height']}, expected 1080x1920")
print('QA sheet', out); print('PROBLEMS:' if problems else 'checks passed', *problems, sep='\n  ')
