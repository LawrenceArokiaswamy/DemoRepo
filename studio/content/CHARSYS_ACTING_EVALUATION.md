# Character system: facial expression and acting, evaluation (2026-11-17)

**Status:** dev only, waiting for owner approval. **Credits spent: 0.** No production engine, episode or approved asset was changed.
**Work area:** `studio/dev/charsys/`.

## 1. What was delivered
| # | Deliverable | Where |
|---|---|---|
| 1 | Universal facial rig and acting system | `dev/charsys/face_rig.js`, wired into `charsys.js` (`drawHead`) |
| 2 | Expression sheets for Theo, Walter and Marcus (12 emotions, large faces) | `dev/charsys/library/<id>/expressions_12.png` |
| 2b | Updated reference template for all 5 characters | `dev/charsys/library/<id>/reference_sheet.png` |
| 3 | Acting demos, 11.2 s each, 1080×1920 | `renders/charsys_acting_theo.mp4`, `…_walter_elderly.mp4`, `…_marcus_legionary.mp4` |
| 4 | Phone-size comparison | `renders/charsys_acting_three_phone_size.mp4` (3-up at 1/3 scale), `dev/charsys/library/acting_phone_size.jpg` (beat sheet), `dev/charsys/library/quiz_phone_size.png` plus `quiz_key.json` |
| 5 | Automated checks | `dev/charsys/check_faces.mjs` → `library/face_checks.json` |
| 6 | Hair redesign (owner request) | Walter: `silver_swept` (full, wavy silver hair). Mia: `pigtails_bangs` (pigtails with ties and a fringe) |

## 2. The facial system
**Continuous controls** (any value, not presets). Every control is blendable.
- **Brows:** height, angle, arch and asymmetry, per side.
- **Eyes:** upper and lower lid, eye width and height, white-eye (fear) mode, pupil size, gaze direction, sparkle.
- **Mouth:** width, jaw opening, curvature, independent left and right corners, horizontal shift, upper-lip raise, teeth, tongue, rounding (O shapes), tremble and quiver.
- **Cheeks and accents:** cheek lift, blush, sweat, tears, nose wrinkle, shock lines, worry lines, anger mark.
- **Head:** tilt and squash/stretch.

**Emotions:** neutral plus the 12 requested: happy/excited, sad, scared/terrified, angry, surprised/shocked, confused, curious, disgusted, suspicious, embarrassed, worried/anxious, relieved.

**Intensity:** `subtle` 0.35, `clear` 0.7, `extreme` 1.0, or any number in between. Each emotion also has an extreme overlay that fades in above 0.75: wider white eyes, bigger mouth, sweat and tears.

**Mouth shapes:** rest, A, E, O, U, M/B/P, F/V, plus gasp, laugh and cry. These are ready for lip-sync later.

**Preserved from Theo v3:**
- the gasp snaps open with an overshoot and quiver;
- trembling dread on the lips;
- blinks and eye darts.

**Layering rules** (these prevent the problems in the brief):
- Brows draw on top of the fringe, so hair never hides them.
- Brows are clamped so they never sit on an eye or a glasses frame.
- Under a helmet, brows stay below the brim. When there is no room, the brow flattens its slant but keeps its direction, so it never disappears.
- Glasses never cover brows. The far lens hides in profile.
- Walter's moustache moves with the mouth corners.
- Characters with headgear use a "hands at chest" pose instead of "hands to face", so arms never cover the face.

## 3. Whole-body acting
Each emotion carries a body pose: shoulders, posture, lean, crouch, head tilt, breathing rate and hand pose. Hand poses include cheer, hands up, hands at chest (shaking), beside the face, fists, head scratch, chin, crossed arms, fidget and wringing.

**Character-specific secondary actions** come from the character file (`acting` map). The same instruction produces a different performance per character.
| Character | Behaviour |
|---|---|
| **Mia** (child) | jumps when happy or surprised; fastest and biggest reactions |
| **Marcus** (legionary) | raises the shield when scared or surprised; hand to the gladius when angry; quick and contained |
| **Walter** (elderly) | recoils and grips the cane when scared, surprised or worried; lowers his head when sad; slow, with a tremor |
| **Theo, Elena** | default body language |

**Motion quality:**
- anticipation before sudden beats (eyes squeeze and the body dips just before a shock);
- overshoot on snaps;
- eased transitions;
- follow-through on hands and secondary actions;
- breathing that follows emotion;
- no random jitter: tremble is a deliberate, smooth oscillation.

## 4. Instruction API
```js
import { scriptFromInstructions, actingState } from './face_rig.js';
const script = scriptFromInstructions([
  { character: 'theo', emotion: 'curious',    intensity: 'subtle',  transition_duration: 0.5,  hold_duration: 1.0 },
  { character: 'theo', emotion: 'suspicious', intensity: 'clear',   transition_duration: 0.4,  hold_duration: 1.0 },
  { character: 'theo', emotion: 'surprised',  intensity: 'extreme', transition_duration: 0.12, hold_duration: 0.6 },  // realization → shock: snap with anticipation
  { character: 'theo', emotion: 'scared',     intensity: 'extreme', transition_duration: 0.4,  hold_duration: 1.5, secondary_action: null },
]);
const state = actingState(character, script, t);  // → face controls + body pose + secondary action, per frame
```
- Emotions blend continuously, e.g. curiosity → suspicion → realization → shock → fear.
- `secondary_action` overrides the character's default; `null` or omitted uses the character's acting map.
- Available secondary actions: `raise_shield`, `hand_on_sword`, `grip_cane`, `lower_head`, `jump`.

## 5. Validation results
### A. Expression sheets
Twelve emotions at "clear" intensity with large faces, for Theo, Walter and Marcus. The reference sheets also show "subtle / clear / extreme" strips for happy, sad, scared, angry and surprised.

### B. Acting tests
Each test runs **Neutral → Curious → Happy → Shocked → Scared → Sad → Relieved** in 11.2 s, with the character-specific secondaries:
- Walter grips his cane on the shock and lowers his head when sad;
- Marcus raises his shield on the shock and while scared.

### C. Phone size
- **The 3-up video** shows each character at one-third size (360×640 per character), about what a phone feed shows.
- **The beat sheet** shows all seven beats per character at thumbnail size.
- **The blind quiz** (`quiz_phone_size.png`) has numbered faces with no captions; the answers are in `quiz_key.json`.

### Automated checks (`node check_faces.mjs`)
**Coverage:**
- 13 emotions × 5 intensities (0, 0.35, 0.7, 0.85, 1.0) × 2 views (front and ¾) × 3 characters = **390 cases**.
- Missing features: mouth vanished, eyes collapsed, brows missing.
- Overlaps: brow on eye, brow on glasses, brow under the helmet brim, mouth touching an eye (tested against the real mouth contour).

**Result: 0 issues in 390 cases.** It had 111 before the fixes in this round.

**Auto-corrections the rig made silently** (counted, not errors): 228 brows lifted off eyes or glasses, 39 brows kept below the helmet brim.

**Distinctness at 96 px:** every pair of the 12 emotions was compared pixel by pixel, per character. Average difference: Theo 19.8, Walter 19.2, Marcus 26.2. The closest pairs:
| Character | Closest pairs (score) |
|---|---|
| Theo | scared vs worried (6.4), suspicious vs worried (7.8) |
| Walter | scared vs worried (5.1), suspicious vs worried (5.6) |
| Marcus | suspicious vs worried (6.7) |

- Scared vs worried was strengthened in this round:
  - **scared:** white eyes and an open gasp;
  - **worried:** a side glance, a tight off-centre mouth and a bitten lip.
- These two still share raised inner brows by design, and the body separates them further (recoil vs wringing hands).
- **No two emotions are identical**: there are no zero-difference pairs.

## 6. Honest limitations
1. **No independent human test yet.** Recognisability was checked by the automated metrics and by my own review only. The blind quiz and answer key are there so you (or anyone) can test real recognition on a phone.
2. **Walter's face is the hardest to read.** Glasses, a moustache and wrinkles take up face area, so his subtle intensities are weaker. Use "clear" or "extreme" for him in wide shots.
3. **Under the helmet,** Marcus's brows have less travel room. Extreme brow angles are flattened (the direction stays readable), so his anger and fear lean more on eyes, mouth and body.
4. **Profile faces** are still the simplified ¾-shift style; acting is designed for front and ¾ views.
5. **Visemes exist, but there is no automatic lip-sync** from audio yet.
6. **Hands are mitts,** so finger acting (pointing, counting) is not available.
7. **Not integrated into production:** as instructed, the production engine (`compose.py`, `stories/theo_rig`) is unchanged.

## 7. Next steps (each needs your approval)
1. Your review of the sheets, the videos and the quiz. Tell me any expression that reads wrong and I'll retune it (≈ 15 min each, 0 credits).
2. Integration into production: a scene-blocking JSON drives `scriptFromInstructions`, rendered through `compose.py`. ≈ 1 day, 0 credits.
3. Lip-sync from narration timing (visemes are already built). ≈ ½–1 day, 0 credits.
