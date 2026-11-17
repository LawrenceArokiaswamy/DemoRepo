# Cinematic production standard: 2D actors in 3D worlds (DRAFT v1, 2026-11-17, awaiting owner approval)

**Direction (owner):** highly expressive 2D cartoon characters inside cinematic 3D environments.
- Characters stay simple, recognizable and cheap to animate.
- The world, light, camera and sound carry the production value.
- This is our own identity; we don't imitate any studio or creator.

**Validated by:** the Bank Robbery Dilemma representative sample (`renders/bank_dilemma_sample_v1.mp4`). The QA report is `studio/content/BANK_SAMPLE_QA.md`.

---
## 1. Pipeline (what runs, end to end, 0 credits)
```
script ─► cast extraction + library lookup (dev/charsys) ─► environment: reuse / build set module (engine/web/sets/*.js, CC0 assets)
       ─► plan.json  (actors + marks + facing, acting scripts, dialogue, shots with purpose, captions, graphics)
       ─► business.js (stages 2D actors as lit cards in the 3D set, camera from plan)   ─► render.mjs (3 jobs, ≤ 50 frames per browser)
       ─► build_audio.py (voice, sfxlib SFX, score, mix.sh)  ─► build_captions.py (ASS)  ─► ffmpeg master + delivery copy ─► QA
```
- **Where things live:** everything except shared modules lives in `studio/stories/<slug>/`.
- **Reference implementation:** `stories/bank_dilemma/` (`plan.json`, `business.js`, `build_audio.py`, `build_captions.py`).

## 2. Characters and acting (Part 1)
**Cast from script.** Follow `dev/charsys/SCRIPT_TO_CHARACTER_SPEC.md`:
- Extract the characters, run `lookup.py` and **reuse approved characters**.
- New characters are drafts assembled from library components; save them to `dev/charsys/library/<id>/`.
- Each new character has a reference sheet: turnaround, 12 emotions, intensities, mouths, body poses, acting notes.
- Never default to Theo.

**Emotion:**
- the 12-emotion face rig (`face_rig.js`), plus `focused` (concentration/resolve);
- continuous transitions with anticipation before sudden beats;
- breathing, tremor, blinks (`perform.js` `blinkAt`) and eye darts.

**Eye-lines:**
- Each acting step names a look target (`nate`, `sam`, `robber`, `bag`).
- Eye direction is computed from world positions and the camera, so eye contact holds in every angle.

**View selection:**
- The camera-vs-facing angle chooses the front, ¾, profile or back drawing.
- Characters keep a world facing direction even though they're cards.

**Dialogue:** loudness-envelope lip-sync (jaw, width, rounding, closures) from the actual line audio.

**Interaction:**
- Props in hand (pistol silhouette, duffel, cane, shield).
- A two-character composite card for physical contact (the hostage hold): one character's arms draw over the other.
- A **2D → 3D hand-off**: the bag leaves the robber's drawn hand and becomes a 3D object with an arc, landing, slide, and real shadow.

**Grounding:**
- Cards stand on the floor and cast real silhouette shadows from the set's key light.
- Each card has a soft contact shadow.
- The 2D drop shadow is disabled in 3D.

## 3. Environments (Part 2)
- **One reusable set module per location type** (`engine/web/sets/`).
- Build each set from **CC0 Poly Haven** models, textures and HDRIs plus procedural story props.
- Budget: a new set is ≈ 1–3 h; reuse with a re-skin (sign, palette, props) is ≈ 15–30 min.

**Every set needs:**
- foreground, midground and background layers;
- story props that explain the place (counter, vault, queue ropes, cash, clock);
- PBR materials with reflections from an HDRI;
- a leading line toward the story focus;
- atmosphere (shafts, dust, depth fog) only where it's motivated;
- consistent real-world scale (1 R = 0.27 m; adult ≈ 1.75 m).

**Avoid:** empty rooms, untextured boxes in frame, and unexplained objects.

## 4. Lighting (Part 2.3)
Design per scene and write it down in the plan: the motivation, then key, fill, practicals, atmosphere, grade.

**Characters belong to the light:**
- The 2D lighting pass uses the same key-light vector: the shadow side gets a cool fill tint, and the light side gets a warm rim that's stronger when backlit.
- Close-ups get a motivated fill so faces never go muddy.

**Genre starting points** (adapt per scene, never paste):
| Genre | Key | Fill | Practicals | Grade |
|---|---|---|---|---|
| Thriller / heist (validated) | Low sun through glass, long hard shadows | Cool sky bounce | Warm brass and screens | Teal shadows, warm highlights, contrast 0.28, vignette 0.4 |
| Horror | Cold moonlight or a single practical | Very low; let shapes fall to black, but keep faces ≥ 25% luminance | Flicker, screen glow | Desaturated, green-cyan shadows, heavy vignette |
| History (day) | Golden hour or overcast with a direction | Warm bounce | Fire, lanterns | Warm, low contrast |
| Science / lab | Large soft overheads | Neutral | Screens, indicator LEDs | Clean, cool white, high clarity |
| Mystery | Hard window slats, side light | Minimal | Desk lamps | Split-tone, deep shadows |

## 5. Camera (Part 3)
- **One verb per shot:** hook, establish, build, react, reveal, pay off. This is written in `plan.json` and the storyboard.
- **Coverage pattern for a dialogue or dilemma scene:** CU hook → high or wide establish → OTS → reaction CU → insert/ECU. Use low or high angles only with a dramatic reason.
- **Moves:** slow push for emotion, crane or pull for reveals, tilt to follow a thrown object, snap zoom only for revelations. Breathing handheld (≤ 6 mm) only in close shots.
- **Camera targets are symbolic** (`head:sam`, `mid:pair`, `eyes:nate`). Focus distance follows the target automatically.
- **Close-ups get a high-res face window** (500–1000 px per head radius) over the body card, so faces stay razor-sharp at 1080×1920.
- **Composition:**
  - faces that carry emotion take up ≥ 30% of frame height;
  - wides carry geography, not acting;
  - keep captions in the safe zone (MarginV 700);
  - nothing important in the bottom 25% or right 120 px.

## 6. Graphics, captions, sound (Parts 3.4 and 4)
**Captions (Bible E.1):**
- 1–3 word chunks spread over voiced time;
- phrases break at punctuation;
- amber keywords;
- the robber's lines amber-tinted and in quotes.

**Graphics library (built):** an identity card (slide plus fade, 58/38 px).
**Next to build (needed by the full episode):** a phone notification card, a clock/timer, highlight rings and screen-space labels.

**Sound:**
- the narrator voice;
- dialogue with lip-sync;
- `sfxlib` Foley (room tone, clock, steps, whoosh/thud/scrape, heartbeat, phone buzz);
- a score with **intentional silence before reveals**;
- `mix.sh` to −14 LUFS.

## 7. Story (Part 4)
- HOOK → PROBLEM → ESCALATION → COMPLICATION → TWIST → PAYOFF.
- Something meaningful every 5–8 s, but never a twist for the sake of the clock.
- Silence and stillness are tools.

## 8. Gates (Bible §H is unchanged)
1. Script.
2. Storyboard / shot plan.
3. Representative sample (10–15 s, the hardest shots).
4. **Owner approval.**
5. Full render, mix, captions.
6. QA.
7. Publishing package.
8. Owner approval.

**Paid generation (narration, score) is quoted and approved before use.**
