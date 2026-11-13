# Toon face test (7.5 s): EP01 "pebble folk" style + parametric facial animation in a CC0 PBR workshop

- `web/toon.js`: original 2.5D cartoon character. Faces are continuous controls (brows: height/angle/bend per side; lids top/bottom
  per eye; eye scale; pupil look/size; mouth width/open/smile/asymmetry/teeth/tongue/wobble; cheeks, blush, sweat, tears) with 12
  presets (neutral, notice, curious, suspicious, disbelief, laugh, shock, fear, angry, sad, confused, realize) that blend smoothly.
  Head yaw with feature parallax, light-direction form shading + rim light, squash/stretch, shrug, lean, keyed arms and hands.
- `web/main.js`: the scene timeline (face keys + body keys + secondary motion: blinks, eye darts, laugh bounce, fear tremble).
- Environment: Poly Haven CC0 assets (`fetch.py` -> `web/assets/`, not committed), three.js r160 PBR (`web/lib/`, not committed).
- No paid credits used for this test. Render: ~6 s/frame on the CPU-only machine.
