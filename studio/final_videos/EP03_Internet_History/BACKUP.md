# EP03 · Backup procedure for the production master

This session's working disk is **temporary**. The upload file (`EP03_Internet_History_UPLOAD.mp4`, 302 MB) is too large for git, which has a 50 MB rule, and full-quality masters stay out of git by policy. So it is protected in three layers.

## Layer 1: your own copies (do this now; free; about 5 minutes)
1. **Download:** in the Claude app, open the file card **EP03_Internet_History_UPLOAD.mp4** (sent in the chat) and download it to your computer.
2. **Check that it is intact:** the SHA-256 must be:
   `77bf44cc8f202a1df97ae29b774309ea4def2ee182997b2d7545cbb9dbd73bb9`
   - **Windows:** `certutil -hashfile EP03_Internet_History_UPLOAD.mp4 SHA256`
   - **Mac:** `shasum -a 256 EP03_Internet_History_UPLOAD.mp4`
   - Or simply confirm it is 302,014,340 bytes and plays to the end (0:50).
3. **Keep two copies in different places:**
   - your computer, for example `YouTube/EP03_Internet_History/`;
   - a free cloud folder, such as Google Drive's free 15 GB tier.
   Put the thumbnail and cover PNGs in the same folder. They are also in git.
4. Upload to YouTube **from that downloaded copy**.

## Layer 2: an upload-ready proxy in git (already done)
`renders/ep03_final_review.mp4` is committed on branch `claude/eager-volta-ovkg46`. It is a 45 MB copy at native 1080×1920 and 30 fps, made from the master with the same audio (two-pass, 7.1 Mb/s, SHA-256 `531f2d43…`).
- Raw link: https://github.com/LawrenceArokiaswamy/DemoRepo/raw/claude/eager-volta-ovkg46/renders/ep03_final_review.mp4
- If the master is ever lost, this file is still a valid YouTube upload. For a 50 s Short the difference after YouTube's own re-encode is small.

## Layer 3: rebuild from git (no credits; about 2 hours of CPU)
Everything needed to recreate the master is committed:
- the scene code;
- the timeline (`story.json`);
- captions (`captions.ass`);
- the final corrected mix (`studio/stories/ep03/audio/final_mix.wav`).

```bash
cd studio/engine/tools
R=/path/to/frames; mkdir -p $R
for a in $(seq 0 100 1499); do node render.mjs ep03 $R $a-$((a+99)); done        # 1,500 native frames, ~3.5 s each
cd ../../stories/ep03
ffmpeg -framerate 30 -i $R/f%04d.jpg -i audio/final_mix.wav \
  -vf "subtitles=captions.ass,format=yuv420p" -c:v libx264 -preset slow -crf 19 -profile:v high \
  -c:a aac -b:a 192k -ar 48000 -t 50.0 -movflags +faststart EP03_Internet_History_UPLOAD.mp4
```
- After rebuilding, run `grep -ci "shader error"` on the render output (it must be 0) and check that `ffprobe` reports 1080×1920, 30/1 and 1,500 frames.
- A rebuild is visually identical, but its checksum may differ from the original.
