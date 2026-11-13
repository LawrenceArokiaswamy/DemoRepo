# Character generator: one locked art style, unlimited characters

All code here is original. It needs no paid services and no credits.

## Pieces
| File | Role |
|---|---|
| `chargen.js` | `normalizeSpec(spec)` fills in defaults. `drawCharacter(g, spec, pose)` draws any character in the locked "pebble folk" 2.5D toon style. `crowdSpec(seed, role)` makes seeded extras. `persona(spec)` sets performance scaling. |
| `acting.js` | `ACTIONS` is the shared action library (idle, notice, curious, suspicious, disbelief, laugh, shock, fear, sad, confused, realize, angry). `makePerformer(spec, beats)` turns a beat sheet into poses frame by frame. |
| `cast.js` | Example **per-story cast bible**. Shots refer to characters only by id, so every shot gets the same spec. |
| `lineup.html` | Model sheet: the 5 hero characters plus 16 crowd extras. |
| `duo.js` / `duo.html` | 8 s test: two characters react to the same event in the CC0 workshop set. |
| `sfx_duo.py` | Synthesized SFX for the test (numpy only). |

## Spec (every field optional)
`age` child/teen/adult/elder (drives head-to-body ratio, limb length, eye size, lids, wrinkles) ·
`build` slim/average/stout/muscular · `height` · `skin` · `cheek` ·
`head {shape: round|squircle|oval|square|long|pear, width, jaw}` · `eyes {size, spacing}` ·
`brows {thick, bushy, color}` · `nose` button/round/big/long/hook · `ears` · `wrinkles` 0..1 · `freckles` ·
`hair {style: curly|short|sidepart|bowl|spiky|long|bun|ponytail|bald|balding, color}` ·
`facialHair {type: none|mustache|handlebar|beard|bigbeard|goatee|stubble}` ·
`outfit {top: tunic|robe|coat|armor|dress, color, color2, trim, legs, boots, belt, cape, apron, collar}` ·
`headwear {type: crown|helmet(+crest, cheek)|laurel|cap|tophat|hood|goggles}` ·
`prop {type: sword|spear|staff|scroll|flask|shield(+shape scutum, emblem)}` ·
`personality {energy, tempo, posture: upright|hunched|proud, exaggeration}`

## Same rig, different performance
Every character uses the same parametric face (brows, lids, pupils, mouth, cheeks, sweat, tears) and the same body controls (yaw, tilt, lean, squash/stretch, shrug, arms, hands, step).
`persona()` scales:
- **amplitude**: child 1.35×, elder 0.7× of the personality's exaggeration
- **tempo**: transition time is 0.32 s ÷ tempo
- **laugh bounce**
- **tremble**
- **idle sway**
- **blink rate**

In the test, the soldier's shock is a large, fast squash/stretch jolt. The elder's is a small, slow startle followed by a wheezing laugh.

## Crowds
`crowdSpec(seed, role, period)` draws from controlled palettes and component lists, and the same seed always gives the same extra. Each extra is a separate canvas card drawn from the same code. For large battles, the plan is to bake a few dozen variants × a pose cycle into a texture atlas and instance them. That is not built yet.

## Limits (honest)
- Lip-sync is not wired up yet. The mouth controls exist, but there is no phoneme mapping.
- Walking is a simple leg-swing cycle, not a full walk.
- Hands are simple shapes, as in the style.
- Characters are flat cards. They can turn about ±0.6 yaw but cannot go to full profile or back view.
