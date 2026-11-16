# EP03 · What If Everyone Could See Your Search History?: delivery metadata

**Status: creatively approved by the owner (2026-11-16) and handed off for final upload.** It has not been published; the owner uploads it.

| Field | Value |
|---|---|
| **Upload file** | `EP03_Internet_History_UPLOAD.mp4` (this folder; local, gitignored; a byte-identical copy of the production master `renders/ep03_final_master.mp4`) |
| SHA-256 | `77bf44cc8f202a1df97ae29b774309ea4def2ee182997b2d7545cbb9dbd73bb9` |
| Size | 302,014,340 bytes (302.0 MB), 48.3 Mb/s |
| Video | H.264 High, yuv420p, **native 1080×1920** (rendered at full size, not upscaled), square pixels, **30 fps** constant, **1,500 frames**, CRF 19 |
| Duration | **50.000 s** |
| Audio | AAC-LC 192 kb/s, 48 kHz stereo. **The corrected final mix:** −14.2 LUFS integrated, LRA 3.8 LU, peak −1.44 dBFS, flat factor 0 (no clipping) |
| Mix balance | The narration leads the music and SFX bed by a median 10.9 dB across core speech. Music is normalised to −25 LUFS and ducked under the voice; SFX were lowered 2 dB. Only short, deliberate SFX hits (bubble pops, notifications) briefly match the voice. The master's audio matches the committed `stories/ep03/audio/final_mix.wav` (correlation 0.9996) |
| Proxy (backup) | `renders/ep03_final_review.mp4`, 44,954,639 bytes, same picture and audio, two-pass 7.1 Mb/s, SHA-256 `531f2d43d77351c4…`, committed |
| Narrator | ElevenLabs v4 "Grady" via Higgsfield (`e2a2d2e6-9ed2-59cd-82af-feaa27f8a678`): the approved 11-line script, atempo 1.05 |
| Music | Original score, ElevenLabs Music v2.5, 50 s |
| SFX | Studio SFX library (free): café ambience with a quiet "next day" dip, UI pops, typing, cursor |
| Credits | **10.03** of the approved 10.76 (narration 2.76, music 7.27). Cash: $0. Nothing was spent after approval |
| Production | 2026-11-16. Studio three.js renderer, C+ v2 characters, conformed to the voice through `story.timeMap` |
| QA (technical, run on the master) | Full decode with 0 errors; 1,500/1,500 frames. No black segments (blackdetect ≥0.1 s) and no freezes ≥1 s (freezedetect). 0 shader errors in the render log |
| QA (captions) | All 11 lines start within ±0.04 s of the voice onset (the last caption leads by 0.2 s). 41 chunks, none overlapping. Placement keeps faces and phone screens clear |
| QA (readability, 390×693 phone size) | The alert, both date bubbles, the share cards ("Everyone nearby" wraps), the mole and relationship queries (the relationship query held whole), the diner bubbles, the callback, the laugh, and the thumb/cursor ending |
| Shorts cover frame | **0:01.5** (the 9:41 alert) or **0:12** (his date-search bubble), if a custom cover is not offered |
| Sources | Jonathon W. Penney, "Chilling Effects: Online Surveillance and Wikipedia Use", *Berkeley Technology Law Journal* 31 (2016), https://papers.ssrn.com/abstract=2769645. It is cited in the description only; the narration makes no research claim. All searches and characters are fiction |
| Backup | See `BACKUP.md` (download and keep two copies; the proxy in git; rebuild from git) |
