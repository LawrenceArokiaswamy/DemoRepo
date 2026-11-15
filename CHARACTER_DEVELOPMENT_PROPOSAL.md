# Character Development Proposal

**Goal:** one original, appealing, professionally designed stylised 3D character, reusable across episodes and periods, before Episode 2 production.

- **Status (updated 2026-11-15):** Option D (hybrid) approved and built. The C+ direction was approved and turned into a rigged 3D character, with an acting test delivered for owner review. See Bible C.8d and `renders/character_test_cplus_*`. Episode 2 animation waits for that review.
- **Written:** 2026-11-15.
- **Budget:** $0 cash, 0 Higgsfield credits.
- **Benchmark:** the owner's reference Shorts (see `REFERENCE_3D_CINEMATIC_ANALYSIS.md`), used as a *quality* bar, never as a design to copy.

**Evidence labels:**
- **[VERIFIED]**: tested in this environment.
- **[OBS]**: observed in the frames.
- **[HYP]**: hypothesis.

---

## 1. Honest diagnosis: why our sailor doesn't look professionally designed

| Area | Our POC sailor (`actor3d.js`) | What a designed character needs |
|---|---|---|
| Silhouette and proportions | Egg-shaped torso with no shoulders, waist or neck; stubby leg capsules. Reads as "primitives stacked". | A clear, characterful silhouette (pear or bean torso, defined shoulders and waist from the costume). Head-to-body ratio chosen on purpose. Readable as a black shape. |
| Head and face | Sphere plus a flat 2D face decal: small features, thin lines, same eye shape for every emotion. In 3/4 and side views the decal stretches around the sphere. | A face designed for its head: big readable eyes with shaped upper lids, separately moving pupils and brows, a mouth-shape library, line weight matched to the body outline. Consistent from front, 3/4 and side. |
| Costume | Two lathes plus three ink bands; armour reads as a "white egg". | Layered costume pieces (tunic hem, belt, shoulder guard, helmet with brim) with 2–3 flat colours, trim, and shapes that define the silhouette and the period. |
| Hands and limbs | Sphere hands; uniform tubes. | Mitten hands with a visible thumb (4 fingers or a mitten); tapered limbs; readable elbows and wrists. |
| Geometry and materials | Smooth now, but simple; outline thickness doesn't adapt to distance. | Subdivision-smoothed forms with designed edge flow; consistent outline width; flat toon colour plus painted accents. |
| Rig and articulation | No skeleton: parts are rotated groups; arms are tubes rebuilt every frame. | A real skeleton (spine, neck, head, clavicles, arms, legs, ~20 bones) with skin weights so the body bends smoothly; blend-shapes for squash and facial accents. |
| Acting | Poses pop between beats; no blinks; no anticipation, overshoot or follow-through. | Blinks, anticipation, overshoot and settle, follow-through on crests and loose cloth, held "golden poses" and timed expression changes. |

**What the reference does [OBS]:**
- Its characters are *simple* but **designed**: consistent line weight, very large expressive drawn faces, costume and hat silhouettes that identify each character, thin but deliberate limbs.
- Quality comes from **design consistency and expression drawing**, not from mesh complexity.
- Our target is the same discipline with our own design language.

---

## 2. Recommended visual direction: "Pebble-folk 3D" (original)

Our existing identity (round "pebble" people with warm Mediterranean palettes and our own `toon.js` faces), developed into a proper 3D design:

1. **Silhouette:** a soft pear/bean torso, with shoulders and waist defined by the costume.
   - Head:body ≈ 1:1.8 (big, friendly heads).
   - Short legs with chunky footwear.
   - **Tapered soft-tube arms with mitten hands and a visible thumb.** This deliberately differs from the reference's thin black stick limbs.
2. **Head:** a soft squircle (slightly wider at the cheeks); a small 3D nose bump that varies per character; simple ears.
3. **Face, layered and animatable:**
   - eye whites with shaped upper lids (blink and squint via lid shapes);
   - pupils that slide for gaze;
   - **separate floating brows** that can raise, frown or tilt;
   - a **mouth-shape library** (≈12 shapes covering expressions and lip-sync visemes).
   - Features are drawn with a line weight matched to the body outline.
   - The face is projected through a **front-projected UV on the head**, so it stays undistorted in 3/4 and side views.
4. **Costume system:** modular, period-specific pieces (tunic, toga drape, armour, helmet, hats, aprons), each with 2–3 flat colours, trim, and a silhouette-defining shape.
5. **Rendering:** the existing painterly style (cel bands, ink outlines, painted materials). Outline width is kept consistent across distances.

**Originality guardrails:**
- Not white heads.
- Not stick limbs.
- Not single-word captions.
- Our own face drawings, palettes and proportions.

---

## 3. Ways to get better characters: comparison

| Option | Artistic quality | Setup time | Animation | Licensing | CPU / our renderer | Cost |
|---|---|---|---|---|---|---|
| **A. Improve procedural construction** (three.js only) | Medium: limited by primitive and lathe forms; hard to get designed shapes and smooth joints | 2–3 days | Group rotations; no true skinning | Ours | ✓ | $0 |
| **B. Free CC0 character assets** (e.g. Quaternius, KayKit, Kenney rigged packs) | Good base quality, but **not original**: recognisable library styles; would need re-proportioning and new faces | 1 day (if downloadable) | Rigged, often with animation sets | CC0 per their pages (verify at download). Mixamo animations are free to use but need an Adobe account and can't be redistributed raw | ✓ (glTF) | $0. **Their hosts are blocked by this environment's network policy [VERIFIED]: needs owner approval to allow-list them** |
| **C. Blender, scripted by Claude** (headless `bpy`), exported as glTF to our renderer | **High ceiling:** subdivision surfaces, designed shapes, proper skinning, blend-shapes | 2–3 days for the first character; then variants are fast | Real skeleton plus blend-shapes; three.js plays glTF skins and morphs | Ours | **[VERIFIED]** `bpy` 5.3.0 installs from PyPI (≈1.1 GB) and runs headless on CPU. Built a subdivided body, a 2-bone armature with automatic weights and a "Surprise" shape key; exported a GLB with 1 skin and 1 morph target in 0.1 s | $0 |
| **D. Hybrid** (recommended): C as the build tool + deliberate art direction (design sheets and owner review gates) + our existing face system and acting code | **Highest achievable here**; quality set by design iteration, not code | 2–3 days to Milestone 1 | As C, plus our procedural acting (beats, lip-sync) driving bones and morphs | Ours | ✓ | $0 |

**Why not B as the main route:**
- It is fastest, but it would make our cast look like everyone else's free assets, which undercuts "original identity".
- It is also currently blocked by network policy.
- It remains a useful *reference for rig conventions* if you approve allow-listing a host.

**What Blender is used for:** only to build and rig characters. Rendering stays in our existing renderer. No pipeline migration.

---

## 4. Limitations (honest)

- **Design quality depends on iteration and art direction.** Claude builds characters through code and inspection, not freehand sculpting. Expect 2–3 review rounds on design sheets before a character is "appealing", with owner feedback deciding.
- **Automatic skin weights** are good for cartoon bodies but may need corrective tweaks at shoulders and hips.
- **Face consistency** in profile still needs design work: a front-projected face reads well up to about 60–70° of head turn. Full profiles need a dedicated profile mouth and eye treatment (planned in the test).
- **Mesh-detail limits:** fine hand-sculpted detail (wrinkles, cloth folds) is not realistic for us. Our style should stay simple and bold, which suits it.
- **Disk:** `bpy` adds about 1.1 GB per session; it can be installed by the setup script.

---

## 5. Test plan

### Milestone 1: one original character (design only; no movement yet)

**Character:** a Roman sailor/soldier, which immediately replaces the POC sailor.

1. **Design exploration (≈0.5 day):** build **three variants** (A/B/C) that differ in proportions, head shape and face style. Each is shown as a turnaround (front, 3/4, side, back) plus a black-silhouette row. **Owner picks one** (or mixes features).
2. **Production model (≈1–1.5 days, Blender `bpy`):**
   - subdivision body and head;
   - mitten hands with thumb, footwear;
   - modular costume (tunic, belt, armour plates, helmet with brim and crest);
   - front-projected face UV;
   - armature (~20 bones);
   - shape keys (blink, squint, brow up/down, cheek squash);
   - glTF export.
3. **Face system (≈0.5 day):**
   - eye, lid, pupil, brow and mouth layers driven by our existing `FACE` presets;
   - 12 mouth shapes;
   - brows as separate movable pieces.
4. **Review sheet** (our renderer, painterly style, 1080 px):
   - front, 3/4, side and back views;
   - **6 expressions:** neutral, happy, shock, fear, angry, suspicious;
   - **2 visemes;**
   - a phone-size thumbnail row.

**Effort and cost:** ≈2–3 days total; $0, 0 credits.

**Acceptance criteria:**
1. The silhouette is distinctive and appealing as a solid black shape.
2. Features look intentional, not like stacked primitives.
3. The face reads well and stays consistent in front, 3/4 and side views.
4. All 6 expressions read at phone thumbnail size (≈270 px tall).
5. Clean geometry: no facets, seams or broken outlines.
6. Clearly original (not resembling the reference's characters).
7. Owner approval.

### Milestone 2 (only after Milestone 1 is approved): movement and acting test
- Blinks, gaze, anticipation, overshoot and settle, follow-through (crest, tunic hem), weight shifts.
- A short gesture-and-reaction clip.
- A walk cycle.
- About 2 days. Separate approval.

**Out of scope until approved:** new scenes, Episode 2 production, pipeline migration, paid assets or credits.
