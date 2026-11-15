# EP00 — The Claw of Syracuse

| Field | Value |
|---|---|
| ID | EP00 (pilot) |
| Category | Extraordinary history |
| Story folders | v1: `studio/stories/claw-of-syracuse/` · v2: `studio/stories/claw-v2/` (reuses v1 world + `business.js`) |
| Status | v1 **rejected** (2026-11-14). v2 **complete and closed** (2026-11-15): **ready for owner publication approval** |
| Publication | not published (owner approval required) · URL: — · metrics: — |

## 1. Topic and research

**Documented:**
- Marcellus attacked Syracuse with 60 quinqueremes (Polybius 8.4).
- An "iron hand" on a chain, swung from a beam on the wall, gripped ships' prows, lifted them and let them fall, swamping or capsizing them (Polybius 8.6; Plutarch, *Marcellus* 15; Livy 24.34).
- Romans panicked at any rope or piece of wood showing over the wall (Plutarch, *Marcellus* 17).
- Archimedes was about 74 years old (born c. 287 BC).
- Rome later turned to a siege; the city fell in 212 BC.

**RECONSTRUCTION (labelled on screen):** the exact claw design.

**DRAMATIZATION:**
- Archimedes physically on the wall, signalling.
- "He wasn't worried" and "exactly where he wanted them" (light characterisation).

Full notes are in `studio/stories/claw-of-syracuse/research.md`.

## 2. Evolution, v1 → v2

### v1 (79 s), rejected by the owner
**Technically fine:**
- 1080×1920, 30 fps, −14 LUFS.
- Narration by Eleven v4 "Grady" and a character line by "Benji".
- Score by ElevenLabs Music v2.5.

**Creatively failed:**
- Archimedes first appears at 39 s.
- Three points of view (Titus, Marcellus, Archimedes) plus a catapult subplot.
- Lever explanation in the middle of the climax.
- A 31 s epilogue (Marcellus' joke, "days later", a fishing-rod gag).
- Dense narration sped up 1.08×, with long subtitles.
- Flat cards in a photoreal-ish world.
- "Tour" camera shots.

**Problems caught and fixed during v1 QA:**
- 229 silent black frames from a render job that lost WebGL.
- The narrator talked over Titus's scream.
- The scream was shot wide, so his lip-sync was unreadable.
- A weak end shot.

### v2 (39.8 s), rebuilt story-first
- **Spine:** Rome is unstoppable, the old man is outmatched, he has a secret, the trap, the lift and drop, Romans afraid of a rope.
- **Hook:** "This warship is being lifted out of the sea… by one old man."
- **Ending:** "Rome had sixty warships." / "Syracuse had Archimedes."

**Owner's script changes:**
- cut "Thousands of soldiers. Against one city.";
- "he let go" became "the claw released it";
- the rope ending.

## 3. Approved script (locked)

| # | Time (s) | Line |
|---|---|---|
| 1 | 0.00–2.00 | This warship is being lifted out of the sea… |
| 2 | 2.15–3.25 | …by one old man. |
| 3 | 3.70–6.50 | Rome had sent sixty warships to take the city of Syracuse. |
| 4 | 6.70–9.30 | But Syracuse had Archimedes — a mathematician in his seventies. |
| 5 | 9.45–10.75 | And he wasn't worried. |
| 6 | 11.10–13.30 | The Romans rowed right up under the walls… |
| 7 | 13.40–14.90 | …exactly where he wanted them. |
| 8 | 15.40–17.90 | Then a giant wooden arm swung out over the water. |
| 9 | 18.15–19.35 | An iron claw dropped… |
| 10 | 19.50–20.80 | …and bit into the ship. |
| 11 | 21.20–22.40 | And it began to pull. |
| 12 | 22.70–25.70 | Up. Up. Out of the sea. |
| 13 | 26.60–28.60 | And then… the claw released it. |
| 14 | 31.00–34.60 | Soon, even a rope hanging over the wall made Roman soldiers panic. |
| 15 | 35.10–36.70 | Rome had sixty warships. |
| 16 | 37.00–38.70 | Syracuse had Archimedes. |

## 4. Shot list (`studio/stories/claw-v2/build_story.py` is authoritative)

There are 21 shots. Each has one stated purpose.
- **01 HOOK:** three-quarter side view of the arm, chain and hull rising from the sea.
- **02:** Archimedes, calm.
- **03:** rewind.
- **04:** the fleet seen from the wall at dawn.
- **05:** Archimedes at his sand tray while a worker panics.
- **06:** smirk.
- **07:** grinning Romans with the wall looming.
- **08:** raised-hand signal.
- **09:** the arm swings toward the ship.
- **10:** the claw drops behind a sailor and bites.
- **11:** the sailor's grin fades.
- **12:** the chain snaps taut.
- **13:** the lift, ending on the hook angle.
- **14:** terror on the tilted deck.
- **15:** the ship hanging.
- **15b:** close-up of the claw opening.
- **16:** slow-motion fall and crash.
- **17:** the Roman's POV of a pole and rope swinging out beside the idle claw (mirrors the claw shots).
- **18:** reverse close-up of the same sailor panicking, with the rope above him.
- **19:** the fleet holding back.
- **20:** Archimedes with the claw chain above him and the fleet behind.

## 5. Assets and configuration
- **Set:** `syracuse` with story options:
  - `noStones`;
  - `extraFleet: 22`;
  - `ropeGag {pivot [-3.6, 13.6, 0.4], len 3.6, t0 55, swing 0.9, until 58.5}`;
  - `workerRun`;
  - `hideAfter 59.5`;
  - `clearAfter 49.5` with `hazeScale 0.3`;
  - `exposure [[34.6, 39.8, 0.62, 0.15]]`.
- **Cast:** Archimedes (rod prop removed for v2), Titus (the recurring Roman sailor, unnamed on screen), crew extras, workers.
- **Audio:**
  - narration in Eleven v4 "Grady" (pending generation; quote 2.76 credits);
  - the owned score `claw-of-syracuse/audio/music.mp3`, entered at 14.85 s so its peak lands on the crash at about 30.2 s;
  - SFX from `sfxlib.py`.
- **Captions:** ASS, 1–3 words per chunk, block about 35–40% above the bottom edge.

## 6. Costs and time (actual)

| Item | Credits |
|---|---|
| v1 narration (Eleven v4) | 4.60 |
| v1 score (Music v2.5), reused in v2 | 9.02 |
| v2 narration | pending owner approval (quote 2.76) |
| **Total so far** | **13.62** |

- **Cash:** $0.
- **CPU render time:**
  - v1 final ≈ 3.5 h, plus ≈ 1.5 h of fixes;
  - v2 animatics ≈ 20 min each;
  - v2 final ≈ 90 min.

## 7. Issues and fixes (v2)

| Issue | Root cause | Fix |
|---|---|---|
| Ship cut off or unreadable in hook | Front-on camera | Three-quarter side angle (probed hand position) |
| "Sixty warships" didn't read | Only 7 fleet ships | `extraFleet: 22` + view from the wall |
| Rope invisible, then off-frame | Thin prop; guessed angles | Thicker prop; aimed with `probe.mjs` point-in-ship-frame |
| Rope panic not tied to the rope | Cards always face the camera | POV shot + reverse close-up with the rope above his head, pupils up |
| Crew floating on water late | Actors left behind when the ship moved | `hideAfter` |
| Backlit, washed-out last shots | Sun-facing cameras, bright haze | `exposure` override + `hazeScale` |
| Raised hand hidden | Arm angle 165° hid the hand behind the head | `armR [128, 30]`; reframed |
| Release not visible | Attached camera pointed at the sky | Probed claw position (`probe_expr.mjs`); world-space close-up |

## 8. QA results (v2 final, 2026-11-15)

**Technical**
- 1080×1920, 9:16, H.264, 30/1 fps, 1,391 frames, 46.37 s.
- AAC 48 kHz stereo.
- No black or frozen frames.
- −14.1 LUFS, true peak −1.3 dBTP.
- During speech the voice is 12.6 dB over the music and 17.6 dB over the SFX.
- Delivery copy 29 MB, SSIM 0.967 vs the 111 MB master.

**Captions**
- Standard position: text rows 1155–1204, i.e. 716–765 px above the bottom edge (35–40% target).
- In four face close-ups (shots 02, 06, 08, 11) captions sit above the head.
- No overlapping or stacked chunks.
- Nothing in the bottom 25% or the right 130 px UI zones.
- The RECONSTRUCTION label sits below the top UI strip.

**Re-timing**
- The voice runs about 138 wpm (planned 160), so the picture was conformed to it: 46.4 s vs 39.8 s planned.
- Tempo ≤ 1.08 on ordinary lines, ≤ 1.04 on dramatic lines.

**Render incidents**
- One OOM kill, and render browsers degrading after about 300 frames (black frames).
- Fixed by fresh-browser batches (Bible C.7).

**Known weaknesses (not release-blocking)** are listed in the delivery note: card/3D style gap, small rope prop in the POV, hazy fleet shot, warm backlight in the final shot.

## 9. Lessons learned
See Bible §J.
- Story gates before technology.
- Use an animatic to catch staging problems cheaply.
- Probe, don't guess camera positions.
- POV plus reverse shot for eyelines.
- Callbacks reuse the original composition.
- Check every render for black frames and voice overlaps.

## 10. Final corrections before publication approval (2026-11-15)
1. **Resolution query.** The owner saw 512×910. ffprobe of the delivery file, master, committed file and source frames all show 1080×1920 at 30/1. 512×910 is the Claude app's downscaled attachment preview. The deliverable is native, not upscaled.
2. **Ending glare (shots 19–20).** Exposure 0.62 → 0.52, sun-glow sprite off, bloom 0.08, `hazeScale` 0.2. Re-rendered 164 frames. The fleet, the claw and Archimedes' face now read.
3. **RECONSTRUCTION label.** Was 30 px italic. Now 40 px upright, on a soft dark box below the top UI bar, reading "RECONSTRUCTION · exact design unknown".
4. **Caption sync.**
   - Words were spread across whole lines, including dramatic pauses ("Up. Up.", "And then…"), so some captions showed during silence.
   - Captions now follow voiced segments only, phrases are pinned to segments, and the dash and short final words stay with their phrase.
   - Scan result: 44 captions, 0 shown during silence, 0 overlapping.
5. **Final specs.** Delivery copy 1080×1920, 9:16, H.264 yuv420p, 30/1 fps, 1,391 frames, 46.37 s, AAC 48 kHz stereo, 29.2 MB. Master 111.6 MB (local). −14.1 LUFS, true peak −1.3 dBTP. No black or frozen frames. SSIM 0.967.
6. **Status.** Delivered for the owner's publication approval. Not published.

## 11. Close-out (2026-11-15)

**Owner decision:** no more creative or animation revisions. Publish, then learn from real audience feedback.

**Publication files (all native 1080×1920, 30/1 fps, AAC 48 kHz stereo, 46.37 s):**

| File | Size | Bitrate | Purpose |
|---|---|---|---|
| `renders/claw_of_syracuse_v2_UPLOAD_1080p.mp4` | 49.4 MB | 8.5 Mb/s | **Use this one for YouTube / Instagram.** SSIM 0.973 vs master |
| `renders/claw_of_syracuse_v2.mp4` | 29.2 MB | 4.8 Mb/s | Review copy. The GitHub copy is identical (SHA-256 `d6b0867a…8372a`) |
| `stories/claw-v2/build/out/claw_v2_master.mp4` | 111.6 MB | 19 Mb/s | Local only (too large for git). Lost when the session container is reclaimed; reproducible from the committed sources |

**Download:** `https://github.com/LawrenceArokiaswamy/DemoRepo/raw/claude/eager-volta-ovkg46/renders/<file>` (private repo; sign-in required). The "512×910" the owner saw comes from the Claude app's attachment preview, not from the files.

**Preserved for reuse (committed):**
- `stories/claw-v2/build_story.py` (shots, performances, options), `build_final.py` (conform to voice, captions, SFX remap, music timing), `build_scratch_audio.py`;
- `story.json`, `captions.ass`, `audio/narration_raw.mp3` (paid, 2.76 credits), `story_animatic_timing.json`;
- the shared world and business code in `stories/claw-of-syracuse/` (score `audio/music.mp3`, paid);
- animatics and storyboard sheets in `renders/`.

**To rebuild the master:**
1. `python3 build_story.py 30`
2. Render frames in batches.
3. `python3 build_final.py`
4. `mix.sh`
5. The encode in Bible §E.2.

**After publication, record here:** URL, publish date, and 48 h / 7 d / 28 d views, average view duration, % viewed, swipe-away rate, likes, comments, shares and subscribers gained.

## 12. Lessons carried into Episode 2
1. Story gates first, then an animatic, before any expensive render or spend.
2. Record narration **before** locking picture timing; plan scripts at about 138 wpm for this voice, not 160.
3. Render in fresh-browser batches, with a black-frame watcher.
4. Time captions to voiced speech; check faces against the caption band.
5. Plan sun direction per shot; use exposure, bloom and haze overrides for sun-facing shots.
6. Deliver with raw ffprobe output plus the GitHub path, because app previews are downscaled.
7. **Next quality focus (owner):** 3D environments, lighting, cinematography and animation. Evaluate with small tests after reviewing audience data.
