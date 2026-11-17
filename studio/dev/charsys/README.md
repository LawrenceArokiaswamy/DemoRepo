# CHARSYS: universal illustrated character system (dev, 2026-11-17)

**Status:** development. Isolated in `studio/dev/charsys/`; nothing in production uses it yet.
**Base:** Theo v3 (the approved master animation base), generalised. **Zero credits** were spent building it.

## 1. Architecture
```
character.json (library) ─► build preset + overrides ─► skeleton(pose) ─► garment / hair / face / props ─► canvas
                               (proportions in head radii)   (joints, IK, views)  (component libraries)       (render_canvas.mjs → PNG → compose.py)
```

**Units.**
- Everything is measured in **head radii (R)**; `scale` sets pixels per R.
- Proportions, not pixels, define a character, so the same rig drives a child (≈ 2.3 heads tall), an adult (≈ 3.2), a tall slim adult or a stooped elder.

**Skeleton** (`skeleton()` in `charsys.js`):
- hips, shoulders, head centre, legs (stand, walk phase, sit, crouch), stoop, lean, shrug, hunch, breathing;
- **views:** yaw 0 = front, 0.5 = three-quarter, 1 = profile; `back` for the back view; `dir` for left/right;
- **arms:** 2-bone IK to hand targets; elbows hang down by default.

**Components:**
| Library | Entries |
|---|---|
| `BUILDS` | adult, slim_tall, elderly, child, stocky. Each is a proportion preset with per-character `body_overrides` |
| `GARMENTS` | hoodie, cardigan_shirt, striped_tee (with shorts), sweater_skirt, legionary (tunic, lorica segmentata, focale, cingulum and apron, gladius) |
| `SLEEVE` | the Theo v3 continuous bent sleeve, in long, short and tunic variants |
| `HAIR` | crop, bald_sides, kid_tousled, bob_wavy, plus raster override (Theo's sheet hair) |
| `FACIAL_HAIR` | moustache |
| Headgear | galea |
| Glasses, earrings | |
| `PROPS` | cane, scutum |
| Footwear | shoe, sneaker, caligae |

**Face** (generalised Theo v3):
- dot eyes with highlight, blink, gaze and eye darts;
- thick brows with raise, arch, inner lift and asymmetry;
- an **animated mouth**: the gasp snaps open with an overshoot and a quiver; the wobble trembles; grin, frown, flat and shout;
- shock lines and worry lines;
- per-character tuning: wrinkles (crow's feet, forehead, smile lines, under-eye), blush, eye size, sparkle, brow thickness and colour, face width.

**Expressions** (`EXPR`): neutral, happy, curious, surprised, scared, sad, angry. They blend through `mixExpr`.

**Motion presets** (`MOTION`): young_adult, elderly, child, soldier, poised. Each sets tempo, shrug size, bounce, tremor, breathing rate and amplitude, and recoil. One performance script plays differently per character.

**Raster override:** any character can use approved raster parts (Theo: sheet hair, kit torso) while keeping the shared skeleton and face.

## 2. Files
| File | Purpose |
|---|---|
| `charsys.js` | Skeleton, components, face, drawing (one module, about 300 lines) |
| `sheet.html` | Render modes: `?mode=lineup`, `?mode=turn&id=<id>`, `?mode=action`, `?mode=walk` |
| `render_canvas.mjs` | Headless render (existing Chromium); about 0.05–0.25 s per frame |
| `library/<id>/character.json` | Canonical spec (attributes, build, components, palette, motion, line art, sources, **version and approval status**) |
| `library/<id>/turnaround_expressions.png` | Front, ¾, side and back views plus 7 expressions, rendered from the spec |
| `library/index.json` | Character index |
| `library/lineup_validation.png` | The five-character lineup |
| `library/walk_cycle_validation.png` | Walk validation |
| `lookup.py` | Reuse-first character lookup |
| `SCRIPT_TO_CHARACTER_SPEC.md` | Script → characters procedure and schema |

## 3. Adding a character
1. **Look up first:** `python3 lookup.py "<description>"`. Reuse any approved match; never silently replace one.
2. **If it's new:** write `library/<new_id>/character.json` using existing components (build, garment, hair, facial hair, props, palette, motion).
3. **Render the sheet:** `node render_canvas.mjs "sheet.html?mode=turn&id=<new_id>" out/turn_<id> 0`, then copy the PNG into the library folder.
4. **Owner review:** the character stays `draft` until approved. Once approved, bump `version` and set `status` to `approved`.
5. **Missing component** (e.g. a samurai dō, a crown): add one function to `GARMENTS`, `HAIR` or `PROPS`. It becomes reusable by every later character.
