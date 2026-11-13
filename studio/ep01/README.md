# EP01 — The Concrete That Heals Itself (proof of concept)

All code in this folder is original (no code from the unlicensed cartoon-short-kit). Third-party: three.js r160 (MIT, not committed —
`npm pack three@0.160.0`, copy `package/build/three.module.js` to `web/lib/`), Playwright, FFmpeg. Narration: ElevenLabs v4 via Higgsfield
(2.3 credits). Music: ElevenLabs Music v2.5 via Higgsfield (4.51 credits). SFX: synthesized (`tools/sfx.py`).

Pipeline: script.txt -> narration -> `tools/tighten.py` (pauses + tempo) -> `tools/align.py` (timing.json) -> `web/episode.js` (shots, cameras,
lights, acting, fx, story state) -> `render.mjs frames "0-917"` (~1.8 s/frame, CPU only) -> `tools/sfx.py` + `tools/mix.sh` (-14 LUFS, voice on top)
-> `tools/captions.py` (ASS) -> ffmpeg composite.

Facts: lime clasts / hot mixing and self-healing — Seymour, Masic et al., Science Advances, 2023 (study samples were from the Privernum city
wall); Roman marine concrete's long-term durability is well documented (e.g. Jackson et al.). The laughing foreman is dramatization; the modern
pier is an illustrative contrast, not a specific structure.
