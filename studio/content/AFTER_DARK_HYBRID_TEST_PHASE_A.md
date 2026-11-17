# After Dark hybrid evaluation: Phase A (free) and the revised paid test

**Status (2026-11-17):**
- **Phase A:** complete; owner-approved, $0, 0 credits.
- **Paid test:** **not started**. It needs the approvals in §8.

**What Phase A covered:**
- A free in-house 5 s style render, also owner-approved.
- **No Higgsfield credits spent** (balance 254.77, starter plan).
- No existing pipeline file changed. Everything lives in two new test folders:
  - `stories/ad01_style_test/` (its own set file, loaded through the director's existing `set` path);
  - `stories/ad01_plate_ref/`.

## 0. Phase A results (V0, the in-house baseline)
- **Files:**
  - `renders/ad01_style_test_inhouse.mp4`: native **1080×1920, 30 fps, 150 frames, 5.000 s**, 31.2 MB, no audio (a visual test).
  - Phone-size sheet: `design/ad01_test/inhouse_sheet.jpg`.
- **Render:** 2.65 s/frame (≈ 7 min of CPU), 0 shader errors, 0 black frames.
- **What works:**
  - The insert message is fully legible at 390×693.
  - Theo holds the phone in both hands (the arm pose was solved numerically: hands within 2–3 cm of the phone).
  - The reading → frown → eyes-widen → swallow reaction reads clearly; the underlit phone face sells the hour.
  - The warm leak round the door sits behind his left shoulder.
- **What is weak, the target of the paid test:** the flat behind him is dark, plain and blocky. Walls read as flat stripes, the window and door barely register, and nothing says "a real lived-in apartment". **Richness and lighting score: 2/5.**
- **Reference frames for the paint-over:** `design/ad01_test/ref_A_backwall_16x9.jpg` and `ref_B_s2cam_9x16.jpg`, character-free and evenly lit.
  - Ref A still shows the sofa in front of the wall. The plate-A prompt asks for the wall surface only; if the sofa gets painted in anyway, the plate still works as a straight-on camera plate.

## 1. Shot specification (locked; the same for every version)
| | |
|---|---|
| Beat | AD01 "The Message From Tomorrow", beat 1, the hook |
| Format | 9:16, native 1080×1920, 30 fps, **5.0 s = 150 frames** |
| S1 (0.0–1.8 s) | Insert over Theo's right shoulder: his phone shows a message from **"Me"**, with his own face as the avatar: "Don't open the door at 3:17." The clock reads 3:09. The bubble pops at 0.35 s; typing dots from 1.15 s |
| S2 (1.8–5.0 s) | His phone-lit face on the sofa, with a slow push-in from 2.45 m to 2.05 m (fov 36). The front door, with warm hall light leaking round its edges, sits behind his left shoulder |
| Acting | Tired reading, then a frown at 2.2 s, eyes widening on "3:17" at 3.35 s (head pulls back), a swallow at 4.3 s; blinks at 0.9, 2.95 and 4.5 s; a breathing idle |
| Light | Cold moonlight key from behind (the window); fill 0.4; the phone as the face light (0.8, rising to 0.95 on the hit); a faint 0.25 cold fill on the face shot only; the only warm accent is the door |
| Cast | The C+ v2 modern man ("Theo", grey hoodie), the same loader settings as Episode 3 |

## 2. References (prepared; nothing uploaded)
| Reference | File | Use |
|---|---|---|
| Character identity | `renders/character_concept_Cplus.jpg`, `renders/character_test_cplus_turnaround.jpg` | Theo stays ours in every version; no AI character is needed |
| Wall layout for plate A | `design/ad01_test/ref_A_backwall_16x9.jpg`: our flat's back wall straight on, no character, evenly lit (render of `stories/ad01_plate_ref`, frame 0, `LANDSCAPE=1`) | Paint-over source, so the painted wall matches our 3D wall exactly |
| Camera layout for plate B | `design/ad01_test/ref_B_s2cam_9x16.jpg`: the S2 start camera, no character | Paint-over source for the camera-locked room plate |
| Current in-house result | `renders/ad01_style_test_inhouse.mp4` and `design/ad01_test/inhouse_sheet.jpg` | The baseline for pass/fail |

## 3. Prompts for the paid test (written in advance; not submitted)
Both use **Seedream 5.5, 2K, PNG**. Our reference render goes in as `image_references`. The prompts use no brand or studio names, and there are no people in either plate.

**Plate A: painted back wall, a reusable texture (16:9).**
> Repaint this exact wall as a cinematic hand-painted background for a stylized 3D animated film. Keep the layout, proportions and straight-on perspective from the reference exactly: a closed front door in a shallow recess on the left with warm amber hall light leaking under and around its edges, a tall window on the right showing a moonlit city skyline, thin dark curtains, a framed print centred above where a sofa will stand, a radiator under the window, a dark skirting board. Old patterned wallpaper in muted blue-grey with subtle wear and soft stains. 3 AM: cold blue moonlight, deep soft shadows, one warm accent from the door. Painterly brush texture, clean readable shapes, slightly desaturated, light film grain. Wall surface only: no furniture in front of the wall, no people, no text, no logos.

**Plate B: camera plate for the main sofa angle (9:16).**
> Repaint this exact view as a cinematic hand-painted background for a stylized 3D animated film. Keep the camera angle, perspective and every object position from the reference exactly: a worn fabric sofa facing the camera, a side table with an unlit lamp, a rug, a bookshelf at the left wall, and behind, a closed front door in a recess with warm amber hall light leaking under and around it, and a tall window with a moonlit city. A small city apartment at 3 AM: cold blue moonlight, deep soft shadows, one warm accent from the door. Painterly brush texture, clean readable shapes, slightly desaturated, light film grain. The sofa is empty: no people, no characters, no text, no logos.

**Parked:** the earlier AI video prompts (MiniMax H3 and Kling 3.0). Under the revised plan the backdrop is tested first, and video inserts wait for evidence (§7).

## 4. How the backdrop integrates with our three.js renderer
The only change is inside the test folder; the engine is unchanged. The test business file loads the plate as a texture.

**Plate A, a painted wall texture.**
- The plate becomes the material of the back wall (z = −3.0, 5.2 × 2.7 m, the same proportions as 16:9).
- It replaces our wallpaper, door and window geometry for that wall.
- The material is a `MeshBasicMaterial`, unlit, because the painting carries its own light. It gets a small grade multiplier so the moonlight doesn't light it twice.
- A `ShadowMaterial` "shadow catcher" plane 1 cm in front of the wall receives Theo's and the sofa's shadows.
- Floor, sofa, rug and props stay our 3D objects, lit by our lights.
- **Perspective is automatically correct from any camera that sees the wall,** because it is the wall.
- **Limitation:** the painted depth is flat. The door recess and window reveals have no parallax on large camera orbits. That is fine for push-ins and moderate angles.

**Plate B, a camera-projected room plate.**
- The plate is projected from its matching camera (the S2 start camera) onto our existing set geometry (camera projection mapping: a projector matrix sampled in a small `onBeforeCompile` shader, about 60 lines in the test folder).
- The character sits in front as now. Our 3D sofa remains as an invisible depth and shadow proxy.
- Push-ins and small moves (up to about 10–15° or 0.5 m) keep correct parallax. Larger moves stretch the projection.

**Both plates:**
- Theo, the phone, the on-screen text and all acting stay our own render. **Character consistency is unaffected by design.**
- The After Dark grade and ink pass run over the composite, so the plate and characters share one finish.

## 5. Can the same backdrop be reused across episodes and camera angles?
**Plate A (wall texture): yes on both counts.**
- It is a property of the set, like our procedural wallpaper.
- Every episode set in the Ashgrove flat (AD01, AD02, AD04 and part of AD05) can use it from any angle that faces that wall.
- A full room needs about **3–4 wall plates**, one per wall, at about 3.5 credits each: **≈ 10.5–14 credits once for the whole series.**

**Plate B (camera plate): across episodes yes, across angles no.**
- It serves one coverage angle, here the "sofa reverse", the series' most-used angle.
- Each additional angle needs its own plate, generated with plate A or B as a style reference to stay consistent.
- Consistency between separately generated plates is **likely similar but not guaranteed identical**. Comparing A and B in this test measures exactly that.

**Recommendation going in:** plate A is the reusable foundation. Plate B is only worth it for the one or two hero angles if it scores clearly higher.

## 6. Scoring sheet and pass/fail against our current render
**Comparison set:** three 5 s versions of the same shot spec:
- **V0:** today's in-house render (done);
- **V1:** V0 plus plate A;
- **V2:** V0 plus plate B.

They are judged at phone size (390×693) and full size.

| # | Criterion (1–5) | Weight | How it is judged |
|---|---|---|---|
| 1 | Character consistency (Theo identical to V0) | gate | Must be identical. It is ours in every version, so any difference is a bug |
| 2 | Integration: perspective, contact and light direction match; no seams or "sticker" look | 25% | Owner, at full size and phone size |
| 3 | Background richness and cinematic lighting | 25% | Owner: the "would I stop scrolling?" frame |
| 4 | Face readability (the reaction still pops against the background) | 20% | 390×693 sheet; face contrast must not drop |
| 5 | Text readability (the insert message) | gate | Must stay 100% legible; the text is ours, so this checks the background behind it |
| 6 | Reusability: other angles and episodes without new generations | 15% | Plate A: any wall-facing angle; plate B: one angle |
| 7 | Cost per episode once amortised | 15% | Credits ÷ expected episodes using the plate |

**PASS** (the plate is adopted for the After Dark set) if **all** of these hold:
- gates 1 and 5 hold;
- weighted score ≥ 4.0;
- V0's weighted score is beaten by ≥ 0.8;
- the integration score is ≥ 4 (no visible seams at phone size);
- **commercial rights are confirmed for the actual plan** (§8, item 1).

**FAIL** (the in-house set is kept; the lesson goes in the Bible; no further spend on plates) if any of:
- a gate fails;
- integration is below 4;
- there is less than a 0.8 improvement over V0.

**V0 baseline** (self-scored, for the owner to confirm):
- consistency: gate holds;
- integration: 5 (it is native);
- richness and lighting: **2**, the dark and plain flat that this test targets;
- face readability: 4;
- text: gate holds;
- reuse: 5;
- cost: 5.
- **Weighted ≈ 4.05.** The plate must win on richness without losing integration or face readability.

## 7. The revised paid experiment: smallest useful test
| Item | Model | Output | Credits |
|---|---|---|---|
| Plate A: painted back wall (reusable wall texture) | Seedream 5.5, 2K, 16:9, our layout render as reference | 1 PNG, 2K-class, 16:9 | 3.5 |
| Plate B: sofa-angle room plate | Seedream 5.5, 2K, 9:16, our S2 layout render (plus plate A as a style reference) | 1 PNG, 2K-class, 9:16 | 3.5 |
| One retry, only if a plate fails or is unusable (warped layout) | Seedream 5.5, 2K | at most 1 PNG | ≤ 3.5 |
| **Cap** | | **2 plates (+1 retry)** | **≤ 10.5 credits** from the existing balance; **$0 cash**; no plan change, no purchase |

- **Credits are quoted live:** 3.5 credits per 2K Seedream 5.5 image, in 9:16 or 16:9 (`get_cost`, 2026-11-17).
- **Free after the plates arrive:** uploading our two reference renders, integrating V1 and V2 in the test folder, rendering 2 × 150 frames (≈ 20 min of CPU), and the comparison sheet.
- **If the owner wants the absolute minimum:** plate A only (3.5, +3.5 retry ≤ 7.0). It answers integration and reuse. It does **not** test the richer camera plate.

**Why not AI video first:**
- Background richness is our weakest area.
- A plate is reusable across a whole series for a few credits.
- It doesn't touch character consistency.
- AI video costs 8.75–20 credits per 5 s, a single use, and risks drift.

**Video inserts are re-evaluated only after a plate passes.**

## 8. Approvals and confirmations needed before any paid generation
1. **Commercial rights for the actual subscription: not yet confirmed.**
   - I could not open Higgsfield's Terms of Service from this session: this session's own automatic permission check blocked every fetch of higgsfield.ai, even after the host was added to the environment's allowlist.
   - **Owner action:**
     1. Sign in at higgsfield.ai, open **Pricing / Plans**, and check whether the **current "Starter" plan** lists **commercial use** of generated images.
     2. Open the **Terms of Service**, and read the sections on ownership of outputs and commercial use.
     3. Reply with what they say, or paste the relevant sentence.
   - If the Starter plan does **not** include commercial rights, the test can still run for evaluation only, but no plate may appear in a published episode, and the plan question goes back to the owner (cash budget $10–20/month).
2. **Credit approval, in the owner's words:** "Approve up to 10.5 Higgsfield credits from the existing balance for the Ashgrove backdrop test: plate A (painted back wall, 3.5), plate B (sofa-angle plate, 3.5), at most one retry (3.5). No cash, no plan change, no credit purchase."
   - Or, for the minimum: "plate A only, up to 7.0 credits".
3. **Permission to upload our two reference renders to Higgsfield** (`media_upload`). They are our own original renders, contain no personal data, and the upload is free.
