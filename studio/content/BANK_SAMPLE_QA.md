# Bank Robbery Dilemma: representative sample, QA and evaluation (Stage C, 2026-11-17)

**Credits spent: 0.**
- No purchases. Nothing published.
- Episode 3 and all earlier episodes are untouched.
- Existing approved characters are unchanged (new characters are additive drafts).

## Deliverables
| # | Item | Where |
|---|---|---|
| 1 | Rendered sample (14.5 s, S1–S5) | `renders/bank_dilemma_sample_v1.mp4` |
| 2 | Character reference sheets (new drafts) | `studio/dev/charsys/library/{nate_calder,sam_ortiz,masked_robber,priya_teller}/reference_sheet.png` + `expressions_12.png` |
| 3 | Bank environment stills (5) | `studio/stories/bank_dilemma/env_stills/ENV1–5*.jpg`, `env_stills_contact.jpg` |
| 4 | Script, storyboard / shot list, camera, lighting, sound, cost plan | `studio/stories/bank_dilemma/PRODUCTION_PLAN.md` (full 21-shot plan); `plan.json` (executable sample plan) |
| 5 | This QA report | — |
| 6 | Comparison with previous videos | `renders/bank_sample_vs_previous_side_by_side.mp4` (EP01 Claw v2 \| EP03 \| new), `studio/stories/bank_dilemma/compare_previous_stills.jpg` |
| 7 | Production standard (draft) | `studio/content/CINEMATIC_PRODUCTION_STANDARD.md`, Bible §C.9 |

## Technical QA (Bible E.3)
**Container (ffprobe):**
- H.264 high, 1080×1920, 30/1 fps, **435 frames, 14.50 s**;
- AAC 48 kHz stereo;
- 16.0 MB.

**Source frames:** 1080×1920 JPEG, natively rendered, not upscaled. All 435 present; no undersized (black) frames.

**Detection:** `blackdetect` and `freezedetect` returned no hits.

**Audio:**
- −14.1 LUFS integrated, −1.5 dBFS peak;
- voice-ducked music and SFX;
- no overlapping voices;
- intentional drop to silence and heartbeat at 12.4 s.

**Captions:**
- 1–3 word chunks on voiced time, breaking at punctuation;
- amber keywords; the robber's lines amber-tinted in quotes;
- MarginV 700, inside the Shorts safe area;
- no overlaps.

**Identity card:** 58 px and 38 px text, in the top safe area below the platform bar, slide and fade.

**Render:**
- ≈ 13 frames/min overall (3 jobs, ≤ 50 frames per browser): 435 frames in ≈ 34 min, plus S3 re-rendered (111 frames, ≈ 9 min).

## What the sample demonstrates (against the brief's Stage B list)
| Requirement | Status |
|---|---|
| Two or more characters interacting | ✅ The robber holds the gun to Sam's temple (composite card: his arm draws over Sam), then throws the bag. It leaves his 2D hand, becomes a 3D object, arcs, lands and slides toward you. Eye-lines: Sam → you, robber → you, you → robber/bag/Sam. |
| Fear, tension, decision-making | ✅ Sam: scared → flinch → worried (looking to you) → scared. Robber: angry, lip-synced shouts. You: contained fear → surprise at the bag → worry → **focused** (new emotion: concentration). |
| Detailed cinematic 3D surroundings | ✅ See §"Environment" below |
| At least 3 purposeful compositions | ✅ **5:** CU hook (push-in), high wide establishing (crane-down), OTS (tilt to follow the bag), CU reaction (push-in), ECU plus identity card |
| Character lighting matches the environment | ✅ Partial. The 2D pass follows the set's key light (shadow side and warm rim); cards cast real shadows. See limitations. |
| Meaningful physical movement | ✅ Throw wind-up and release; flinches with anticipation; trembling gun hand; breathing; blinks; eye darts; hands raised |
| Readable captions and graphics | ✅ |
| Native 1080×1920, 30 fps | ✅ |
| Existing or free temporary audio | ✅ Free Piper TTS (temporary, non-commercial licence, **not for release**); studio `sfxlib`; original synthesized score |

**Environment detail:**
- marble hall with columns, coffered ceiling and chandeliers;
- teller counter with brass-framed glass and live monitors;
- cash; an open vault with lit deposit boxes;
- queue ropes, check island, waiting area, clock, cameras;
- glazed façade with reversed etched lettering onto a sunlit street;
- sun shafts and dust;
- reflections from the HDRI.

## Fixes made during QA
1. **Overexposed close-up faces:** card emissive lowered; per-shot motivated fill instead.
2. **Wide shot:**
   - a column blocked the camera, so it moved between the columns at a high angle;
   - Walter, Elena and Mia were repositioned into frame;
   - the chandelier glow was reduced.
3. **OTS:** Sam was hidden behind Nate's head, so the camera moved right and widened to 38°.
4. **Floor:** the busy mosaic marble was replaced by large-format marble with grout lines (calmer behind characters).
5. **Grade:** too warm and hazy, so it was cooled to teal shadows with more contrast and a darker fog.
6. **Bag landing was out of frame:** the landing mark moved forward and the tilt was re-aimed (S3 re-rendered).
7. **Vault door covered its own opening:** re-hinged so it swings flat (affects stills and future shots only).
8. **Nate's beard** read as a mask: trimmed to a jaw-line beard, drawn **under** the mouth so lips always show.

## Known issues (honest)
1. **S3:** Nate's raised arm partly covers the bag after it lands, so the beat ("thrown at your feet") reads, but not cleanly.
2. **The bag in flight is briefly very large** when it passes near the camera (about 6 frames). It's physically correct but distracting; the arc should be lowered.
3. **Hands are mitts and limbs are sticks.** The pistol is a simple silhouette. That's intentional for the style and for non-graphic violence, but it limits hand acting.
4. **Character lighting is a 2D approximation.** There's no true bounce colour from nearby surfaces and no contact occlusion on clothing. Sam's close-up face is slightly hot on the sun side.
5. **Cards are flat.** At the over-the-shoulder angle, the back of Nate's head is a flat disc: readable, but not volumetric.
6. **Not built yet:**
   - walking, running, sitting and reaching in 3D (only standing, crouching, holding and throwing are used here);
   - audio-aligned lip-sync for complex dialogue (envelope-driven only);
   - the phone-notification graphic for Beat 6.
7. **The temporary voices are robotic** compared with the studio narrator. They are a placeholder only.
8. **The vault fix came after the sample render.** The wide shot (S2) shows the old door position at the far right edge, so it's only barely visible.

## Comparison with previous studio videos
`renders/bank_sample_vs_previous_side_by_side.mp4` plays the first 14.5 s of each, muted except the new one.
| Aspect | EP01 Claw v2 | EP03 Internet History | **Bank sample** |
|---|---|---|---|
| Faces and acting | Small faces, limited range | Painted, warm, appealing; limited expression range | **Strongest:** 12-emotion rig, continuous transitions, eye-lines, lip-synced shouting, high-res face windows in close-ups |
| Environment | Large scale, sparse geometry | Rich mood, simpler set | **Most detailed interior to date:** many story props, PBR marble and brass, reflections |
| Camera | Good spectacle | Mostly medium shots | **Most varied:** CU → high wide → OTS → CU → ECU, each with a job |
| Lighting | Natural sun | Warm practicals, very cohesive | Motivated sun plus practicals. **EP03 still looks more cohesive** (its painted filter unifies characters and set). |
| Sound | Owned narrator and score | Owned narrator and score | Temporary voices and a synthesized score: weaker than both |

## Gap to premium professional animation (honest)
**This is not Pixar-level, and it doesn't claim to be.** Measured against premium 2D-in-3D work, these are the gaps:
1. **Character rendering.** Flat cards with vector shading are clean and readable, but have no volumetric turn, cloth or secondary hair motion.
2. **Hands and full-body animation.** No finger acting, no locomotion in this sample. Body acting is pose-blended, not keyframed by an animator.
3. **Lighting integration.** Characters don't pick up coloured bounce light; shadows on characters are approximate. A painterly unifying pass (like EP03's) would close part of this gap.
4. **Environment.** It's rich for a CPU renderer (no GI, no ray-traced reflections), but materials are 1k–2k and there's no true volumetric lighting.
5. **Voice.** The temporary TTS is far from performance quality. The released episode must use the studio narrator and a real dialogue voice.

**Where it is already commercially competitive for Shorts:**
- clarity of story and emotion at phone size;
- shot variety and purposeful staging;
- consistent original characters;
- 0 credits per episode for visuals;
- a repeatable pipeline.

**Most valuable next improvements** (cheap, no new engine):
1. A painterly unification pass on characters and set (reuse `style/painterly.js`). ≈ ½ day.
2. Locomotion clips (walk and stand-up) plus a reach/pick-up for Beat 6. ≈ 1 day.
3. Real narrator and dialogue voices (≈ 3.8 credits, quote first).

## Time and cost
**Actual development time (this task), ≈ 2 h 05 min wall clock (15:20–17:26):**
- planning, components, characters and set: ≈ 1 h;
- sample render: ≈ 45 min compute;
- QA fixes, stills and docs: ≈ 20 min.

**Reusable from here:** bank set, 4 characters, actor and camera code, audio and caption builders.

**Projected full episode (≈ 55 s, 21 shots):**
| Item | Estimate |
|---|---|
| Development (16 new shots, phone graphic, reach/pick-up acting, Beat 6 lighting change) | ≈ 4–6 h |
| Render compute | ≈ 2.3 h (≈ 1,650 frames) |
| Narration and voices | ≈ 3.8 credits (synth score) – ≈ 10.6 credits (ElevenLabs score), **quote and approval first** |
| Cash | $0 |

**Later episodes in an existing set:** ≈ 3–5 h each. A new location adds ≈ 1–3 h per set.

## Stage D gate
**Nothing further is produced until the owner reviews this sample.**

**If approved:** finish the remaining 16 shots with the same assets, lighting and shot plan (`PRODUCTION_PLAN.md` §5). Quote the narration and voices before any spend.
