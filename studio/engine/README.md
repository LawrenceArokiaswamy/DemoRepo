# Studio engine: one cartoon art style, unlimited characters, 3D CC0 worlds

Everything here is original code. It runs in a cloud container with no GPU and costs nothing: three.js r160 runs in headless Chromium with SwiftShader, and the 3D assets come from Poly Haven (CC0). Paid credits are used only for narration and music, and only after approval.

```
engine/web/
  stage.js        renderer, PBR lighting, ACES, soft shadows, bloom + depth of field + grade, lit 2D character cards
  toon.js         FACE presets (12 expressions) + blendFace (the approved parametric face)
  chargen.js      spec -> character in the locked "pebble folk" style; IK arms, gait legs, sitting, head turn,
                  mouth shapes for speech, period wardrobes (roman / medieval / victorian), checkPeriod, periodExtra
  acting.js       ACTIONS library + WALK styles + makePerformer(spec, {beats, path, speech})
  lipsync.js      text -> visemes, co-articulation, loudness-driven jaw, emphasis -> brows / nods / gestures
  director.js     plays a story folder (director.html?story=/stories/<slug>)
  sets/           roman_harbour.js, workshop.js  (each exports build())
engine/tools/
  setup.sh        installs three.js + Playwright and fetches the CC0 assets (assets and lib are git-ignored)
  make_video.py   validate -> lip-sync data -> parallel render -> cues -> SFX -> mix -> 1080x1920 encode -> QA
  render.mjs      frame renderer / cue exporter;  align.py  word timings;  envelope.py  loudness
  sfxlib.py       typed SFX events + ambience;  mix.sh  -14 LUFS mix with ducking;  qa.py  contact sheet + checks
stories/<slug>/   story.json (cast bible, performances, shots, audio), business.js (object interaction), audio/
```

## Character acting (shared by every character)
| Area | What exists |
|---|---|
| Face | Brows (separate per side), lids, pupils, cheeks, sweat, tears, 12 blended presets. Blinks are scheduled per character. |
| Speech | 14 mouth shapes (MBP, FV, TH, CDN, CH, L, R, WQ, U, O, AI, E, I, rest). They blend into each other, lead the audio by 40 ms, and are scaled by loudness. Loud stressed syllables lift the brows, nod the head and trigger gestures. |
| Body | Turns where the head leads and the body follows; look-around; pointing; 2-bone IK reach and grab (`reachL/R`), with hand positions returned so 3D props can follow the hands. |
| Locomotion | Walk and run driven by distance travelled, so feet do not slide. Walk styles: shuffle, stride, bouncy, march, swagger. Bob, lean, hip sway and arm counter-swing are included. |
| Reactions | Recoil, stumble (wobble), fall to sitting (with a landing squash), dazed, shock jolt, laugh, tremble. |
| Personality | Amplitude, tempo, bounce, tremble, idle sway and posture scale every action. Kids are bigger and faster; elders are smaller, slower and hunched. |

## Limits (honest)
- Characters are flat cards that turn up to about ±0.6 of a full yaw. There is no full profile, back view or 3D turnaround.
- A fall to lying flat is not supported (the card would clip). Falling to a sitting position works.
- Lip-sync is driven by text plus loudness, not by phoneme recognition. It depends on accurate word timings from `align.py`.
- Story-specific object interaction (pouring, throwing, physics) is written per story in `business.js`.
- Rendering takes about 5 s per frame per process at 1080×1920. Three processes on 4 cores render about 16 frames per minute.
