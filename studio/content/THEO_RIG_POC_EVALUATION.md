# Theo in-house rig: proof of concept and GO / NO-GO (2026-11-17)

**Scope:**
- **Zero Higgsfield credits**, no new services, no new Theo design, no pipeline changes.
- Isolated folder: `stories/theo_rig/`.

**Deliverables:**
| What | File |
|---|---|
| PoC | `renders/theo_rig_poc_AD01.mp4`: native 1080×1920, 30 fps, 150 frames, 5.0 s |
| Side by side with the AI reference | `renders/theo_rig_vs_ai_side_by_side.mp4` |
| Phone-size sheet | `design/theo_rig/compare_phone_size.jpg` |

## 1. What could be extracted, and what had to be rebuilt
| Part | Source | Method |
|---|---|---|
| Hair, front and ¾ | Approved model sheet | **Extracted cleanly** (`extract_assets.py`): the sheet's uniform grey background plus brown-hue keying keeps the hair with its own ink outline. Exact likeness |
| Head, eyes, brows, mouth | Sheet proportions (head ≈ 290 px, hair 1.24× the head width) | **Rebuilt in vector**: 5 expressions (neutral, reading, concerned, scared, dread), blink, eye darts, shock lines, the ¾ turn (feature shift plus hair swap) |
| Hoodie, sleeves, stick limbs, mitts, shoes | Sheet colours (skin 243/216/198, hoodie 156/144/142) | **Rebuilt in vector**: the sheet's body is a single painted shape, and its sleeves are baked into standing poses, so it can't be cut into movable parts |
| Apartment | Approved scene still | Plate with the AI Theo filled out (multi-scale diffusion); the puppet covers the fill |
| Phone insert | Existing insert still plus our exact message UI | Reused through `engine/illustrated/compose.py` |

**Format chosen:** layered raster (hair) plus vector (everything else) on an HTML canvas, rendered headless with the existing Chromium. Two-bone IK arms.
- **SVG** was skipped: same result, slower to drive per frame.
- **External skeletal tools** were skipped: they would mean new software.
- **Render speed:** the puppet takes 0.15 s/frame (23 s for 5 s); the full compose with the insert takes about 80 s.

## 2. Comparison at phone size (AI reference vs in-house rig)
| Criterion | AI (generated stills + 1 clip) | In-house rig | Notes |
|---|---|---|---|
| Character likeness | 5 | **4** | Head, hair and face language read as Theo. The body doesn't (a rigid block) |
| Expression | 4 | **4** | The rig gives exact, timed control: neutral → reading → concerned → scared → dread |
| Movement quality | 3.5 (one smooth turn, otherwise stills) | **3** | Breathing, anticipation, recoil, blinks, eye darts, tilt and the head turn are all there, but the movement reads as cut-out puppetry; the body is stiff |
| Lighting / integration | **5** | 2.5 | AI: Theo sits *in* the sofa, the phone light falls on the hoodie and hands. Rig: overlays only, no contact shadows, a faint fill smudge around the torso |
| Visual polish | **5** | 2.5 | Line-weight variation, soft hoodie folds and painted shading are missing on the rig's body |
| Text readability | 5 (our overlay) | 5 (our overlay) | The same exact message |
| Consistency / repeatability | 3.5 (drift between generations) | **5** | The rig is identical every time |
| Credits per shot | 0.5–7.5 | **0** | |
| Production time per acting shot | ≈ 10–20 min (generate, check, retry) | ≈ 20–40 min to key a performance today; ≈ 10–15 with a pose library | |

**Honest gap:**
- **Face and acting:** the rig is close.
- **Body, drawing quality and lighting integration:** the rig is clearly behind. That gap won't close with more vector code in reasonable time.

## 3. What a production-ready rig needs, and what it costs
**The key change:** don't hand-draw the body in vector. Generate a **one-time Theo parts kit** in the approved style and cut it into layers, the same way the hair worked:
- hoodie torso (front, ¾, side), sleeves and arms in 3–4 bends, mitt poses (open, grip, point);
- legs (seated, standing, mid-step), shoes;
- a mouth set.

This gives the rig the AI drawing quality while keeping in-house, zero-credit, consistent animation.

**One-time cost:**
| Item | Cost |
|---|---|
| Parts kit: ≈ 6–8 images at 2k medium (1.0 each) | **≈ 6–8 credits** |
| Rig tooling: pose and timeline JSON, a pose library, IK, layer swaps for head and body turns, contact shadows and light passes, mouth sets, an integration preset for `compose.py` | **≈ 4–6 working days** (Claude usage), no paid tools |
| Each new recurring character | ≈ 8–10 credits + ½ day |

**Recurring cost per 50 s episode** (estimates; live quotes from 2026-11-17):
| Item | In-house rig pipeline | All-AI pipeline (previous plan) |
|---|---|---|
| Location plates (3–5 × 1.0, reusable across a series) | ≈ 3–5 | included in stills |
| Inserts and props (2–4 × 1.0) | ≈ 2–4 | included |
| Character animation | **0** | ≈ 31–44 stills + 15–22 clips |
| Narration and music (existing) | ≈ 10 | ≈ 10 |
| Optional AI hero clip | 0–7.5 | — |
| **Total** | **≈ 15–20 credits (≈ 23–27 with one AI clip)** | **≈ 56–76 credits** |
| Production time | ≈ 1.5–2 days per Short once the pose library exists | ≈ 1 day |

## 4. What the in-house engine handles well, and what still justifies paid AI
**Well:**
- reactions and facial acting;
- seated and standing medium shots;
- gestures and phone or screen interaction;
- dialogue-style shots;
- narration with characters reacting;
- inserts with exact text;
- recurring characters across a series;
- push-ins, cuts and parallax;
- anything where consistency matters.

**Still worth occasional paid AI** (stills or a clip):
- new locations: a 1-credit still, reused across a series;
- full-body action: walking through a space, running, falls, fights;
- complex hand-object interaction;
- crowds;
- camera orbits around a character;
- one-off hero shots where polish matters most.

## 5. Recommendation: **conditional GO**, as a hybrid in-house pipeline
- **GO** on the in-house rig as the default for character acting. It brings recurring cost down from **≈ 56–76** to **≈ 15–20 credits per Short**, with perfect character consistency. That's the sustainable cost base the CA$3,000/month goal needs.
- **Condition:** the body must come from a one-time AI parts kit in the approved style (≈ 6–8 credits). The vector body in this PoC is **not** production quality.
- **Gate:** before any episode, one 5 s re-test with the parts-kit body must reach at least 4 out of 5 on likeness, integration and polish at phone size, side by side with the AI reference.
- **NO-GO** on hand-drawing the body in code, and on all-AI animation per episode as the default.
- **Not started:** no After Dark production, no pilot spend.

---

## 6. Parts-kit retest (owner-approved kit, 2026-11-17)
**Spend:** **2.0 credits** of the approved 6–8. Two 2k parts sheets:
- `design/theo_rig/parts_kit/kit_A.png`: 3 torsos, 4 sleeves, 4 forearm and mitt poses, seated legs.
- `kit_B.png`: seated body (front and ¾), phone (back and flat), 2 grip mitts, contact shadow.

**Cutting:** `stories/theo_rig/cut_parts.py` split them automatically into 20 transparent layers (`layers/kitA`, `layers/kitB`), clean on the first pass.

**Rig v2:** `stories/theo_rig/puppet2.html`.
- The head, face and hair are as in v1.
- Body, sleeves, mitts, phone and contact shadow come from the kit.
- Forearms are black sticks, which is exactly how the style draws them.
- The hunch on the scare and a phone-light pass are added.
- Render: 0.16 s/frame.

**Files:**
- `renders/theo_rig_v2_AD01.mp4` (1080×1920, 30 fps, 150 frames, 5.0 s);
- `renders/theo_rig_v2_vs_ai_side_by_side.mp4`;
- `design/theo_rig/compare_v2_phone_size.jpg`.

**Gate (≥ 4 on likeness, integration and polish at phone size):**
| | v1 | v2 | Gate |
|---|---|---|---|
| Likeness | 4 | **4** | ✅ |
| Integration | 2.5 | **3** | ❌ |
| Polish | 2.5 | **3.5** | ❌ |

**What still holds v2 back, all bounded and known:**
1. **The background:** the plate is a paint-out of a scene that had Theo in it, so a smudge shows around him. A production plate is generated *empty* (1.0 credit per location, reused for the whole series).
2. **The pose:** v2 is square-on, while the AI shot is ¾ and sunk into the sofa. The kit already has the ¾ seated body; it needs the matching ¾ shoulder and arm placement.
3. **The face:** brow, mouth and outline strokes are thinner than the sheet's, so they should be thickened to the sheet's line weights.
4. **The arms:** the sleeve-to-stick transition needs a cuff and an elbow overlap.
5. **The phone light:** too blue on the hoodie; needs warmer ambient matching.

**Estimate to reach the gate:** ≈ ½–1 working day plus 1.0 credit for an empty apartment plate. Not done: it would be a new iteration, and that needs the owner's approval.

---

## 7. Finishing pass: rig v3 (owner-approved, 2026-11-17)
**Spend:** **1.0 credit** for an **empty 2k apartment plate** (`design/theo_rig/plate_apartment_empty_2k.png`), reusable for every Ashgrove episode.
- Total spent on the rig: 3.0 credits (kit 2.0, plate 1.0). Cash $0.

**Changes, all inside `stories/theo_rig/` (`puppet3.html`):**
- the empty plate: no paint-out smudge, sharp at 2k;
- the kit's **¾ seated body** sunk onto the cushion, with a matching ¾ head rest angle;
- face line weights matched to the sheet (outline, brows, mouth) and slightly larger eyes;
- a stronger caricature gasp and dread, plus worry lines;
- **continuous bent sleeves** with cuffs, and a foreshortened far arm;
- warmer phone light on the hoodie.

**Files:**
- `renders/theo_rig_v3_AD01.mp4` (1080×1920, 30 fps, 150 frames, 5.0 s);
- `renders/theo_rig_v3_vs_ai_side_by_side.mp4`;
- `design/theo_rig/compare_v3_phone_size.jpg`.
- Render speed: 0.22 s/frame; the full compose with the insert takes about 80 s.

**Gate (≥ 4, phone size):**
| | Score | |
|---|---|---|
| Likeness | 4 | ✅ |
| Integration | 4 | ✅ |
| Polish | 4 at phone size, 3.5 full-screen | ✅, borderline |

**Remaining difference from the AI shots:** the AI faces carry extra caricature line detail (cheek lines, mouth interiors with teeth on every expression), and their forearms curve organically. Neither blocks production; both improve with the pose and expression library.

**Recommendation: GO for the in-house illustrated pipeline.**
- **Per-episode character animation: 0 credits.**
- **Per Short:**
  - location plates at 1.0 each (reused across the series);
  - inserts at 1.0 each;
  - narration and music ≈ 10;
  - **≈ 15–20 credits per Short** in total, against 56–76 for all-AI.
- Paid AI is reserved for the shots listed in §4.
- **Next build (needs the owner's go-ahead):** about 4–6 working days for the production rig tooling, including:
  - a pose and expression library;
  - timeline JSON authoring;
  - a front, ¾ and side head turnaround;
  - mouth shapes;
  - a walk cycle from the kit's legs;
  - a `compose.py` preset.

**Owner note, 2026-11-17: "the mouth isn't moving when scared".** Fixed for free in `puppet3.html`:
- the gasp snaps open with an overshoot, then quivers;
- the dread mouth trembles every frame with its corners pulled down;
- the shoulders shrug up on the scare, then settle into the hunch.

**Lesson for the production rig:** every expression needs secondary motion (open/close timing, tremble, corner pulls), not a static shape. See `design/theo_rig/mouth_shrug_sequence.jpg`.
