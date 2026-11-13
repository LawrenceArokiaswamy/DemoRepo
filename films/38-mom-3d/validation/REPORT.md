# Mom character — validation report

Scope: the Mom model only, as asked. No other family members were converted. The original Meshy file `model/mom.glb` was never modified. Every fix described here is applied when a scene loads the model, inside that scene's own copy.

Every claim below comes from a test that was actually run. The test script and its output are named next to each claim.

## Verdict in one paragraph

Mom is a real 3D, rigged, single-mesh character. She holds her shape from every angle, she sits, reaches, turns her head and walks, and with the facial controls I added she can blink, look around, smile, look sad or worried, and cry. She is good enough for the slow, emotional shots our channel uses.

She is not yet a production hero rig:
- She has **no finger bones**: each hand moves as one solid "mitten".
- She has **no face bones or shape keys from Meshy**: the face controls are separate 3D pieces I built and attached to the head.
- Her **shoulders bunch up** when the arms are raised forward.
- In a walk her **feet cross the centre line**.

Two problems found during testing are fixed: the wrist pinch, and fingers poking through the trousers.

## 1. True 3D geometry — PASS

Source: `inspect_model.py` → `inspect.json`; `weld_check.py` → `weld_check.json`.

| Item | Measured |
|---|---|
| Mesh | 1 skinned mesh `char1`: 49,861 vertices, 62,485 triangles, 1.65 m tall, 0.89 m wide in A-pose |
| After merging UV-seam duplicates | 31,243 vertices in **one connected piece**, 10 open edges (closed body) |
| Materials | 1 PBR material with 4 maps at 2048²: base colour, metal/roughness, normal, emission (black, unused) |
| Shape keys | none |

**What is a real mesh:** the whole body is one sculpted, fused surface: head, nose, ears, hair, collar, cardigan with pockets, cuffs and buttons, trousers, and slippers. The clay (untextured) renders prove it: hair locks, pockets, cuffs and slipper shapes exist in the geometry itself.

**What is only texture:**
- Colour, and fine detail such as the knit ribbing and the button holes (painted colour plus a normal map).
- Meshy also *painted* the eyes, brows and mouth onto the face texture; they were not modelled.

Painted features can't move, so I removed them from a copy of the texture (`face_clean.py` → `model/face_rig/Image_0_faceclean.png`) and replaced them with real 3D parts (section 4).

**Note on file size:** 62k triangles is fine for Cycles. The mesh is a dense, irregular triangle soup, as is usual for AI output; it is not clean quad topology. That matters for the improvements listed at the end.

## 2. Character consistency from all angles — PASS

Source: `angles.py` → **`mom_angles.jpg`**. The top row is textured; the bottom row is the clay mesh. Each row shows front, three-quarter, side and back.

The silhouette, proportions, hair volume and clothing match from every side, and the back view is fully modelled (hair, cardigan, trousers). There are no flat or missing sides and no "billboard" faces.

Minor issue: the side view shows the nose as a small rounded bump. It reads clearly in front and three-quarter views, and only slightly in profile.

## 3. Rigging — PASS, with limits

Source: `inspect.json`.

- **24 bones:**
  - Hips → Spine02 → Spine01 → Spine → neck → Head (plus head_end and headfront)
  - Left/Right: Shoulder → Arm → ForeArm → Hand
  - Left/Right: UpLeg → Leg → Foot → ToeBase
- **Skin weights:**
  - Every vertex is weighted: 0 unweighted vertices.
  - At most 4 bones per vertex.
  - Every vertex's weights sum to 1.
- **Missing bones:**
  - Fingers and thumb
  - Forearm twist (needed for clean wrist roll)
  - Jaw, eyes, eyelids and face
  - Breathing or chest
  - Hair and clothing secondary motion
- **Import fix:** glTF doesn't store bone tails, so on import the bones point in arbitrary directions. `tools/character/load_char.py` re-aims every bone at its child and zeroes the roll. Without this step IK fails; with it, IK legs and arms reach their targets (tested in every pose below).
- **Controls added on top** (in the scene, not in the file):
  - IK on both arms and both legs, with pole targets.
  - A helper that sets a hand's or foot's world direction (`orient_hand`).
  - A wrist twist cap (section 6).

## 4. Facial animation — PASS for the expressions we need, with gaps

Source: `face_tests.py` → **`face_sheet.jpg`**. Top row: neutral, smile, sad, worried. Bottom row: crying, blink, look left, look right.

**Built in `tools/character/face_rig.py`, all real 3D parts attached to the Head bone:**
- Eyes: white, iris, pupil and two catch-lights. They rotate, so she can look in any direction.
- Upper and lower eyelids: the upper lid closes for blinks and droops when sad; the lower lid rises for a smiling squint. A lash line appears when the eyes are closed.
- Brows: inner raise, outer raise and lower.
- A curved mouth line: smile, sad (frown) and slightly open.
- Tears that pool and roll down.
- Cheek blush.
- One `set()` call drives everything, and `expression(name)` provides presets.

**Tested and working:**
- Blink
- Gaze in all directions (eyes lead, head follows)
- Smile
- Sad
- Worried (inner brows up)
- Crying (tear plus sad mouth)
- Slow, heavy-lidded close

All of these are also used and animated in the 10-second test.

**Missing face controls (not built, so none of these were tested):**
- Lip-sync mouth shapes (visemes: A/E/O, M/B/P, F/V).
- Cheek raise on a smile; the cheeks don't move.
- Jaw opening with real depth; the mouth is a drawn line, not a hole.
- Nose scrunch, and lip press or quiver.

For dialogue close-ups, the mouth would need a proper sculpted mouth with shape keys. For our non-speaking emotional beats, the current set is enough.

## 5. Body animation — PASS with known issues

Source: `body_tests.py` → **`body_poses.jpg`** (stand, head left, head right, sit, sit and reach); `walk_test.py` → **`walk_strip.jpg`** and **`walk_test.mp4`**.

| Test | Result |
|---|---|
| Standing, arms relaxed | Works. The first test showed skin-coloured spots on the trousers. Diagnosed: these were her **fingertips poking through the thighs** because the test swung the arms in too far (32°). It was not a texture fault. Fixed by using 26° plus a slight forward angle; before/after in **`stand_clip_fix.png`**. |
| Head turn left / right (55°) | Works. The neck deforms cleanly and the hair moves with the head (no hair simulation). |
| Sitting on the floor against the wall | Works with IK: knees up, feet flat, seat on the floor, back on the wall. |
| Reaching (door) | Works. The hand reaches its target and the elbow bends the right way. **Issue:** the shoulder and upper sleeve on the reaching side bunch into folds. Merging the seam duplicates and adding a Corrective Smooth modifier (applied in `anim10.py`) reduced this but didn't remove it. |
| Walking (CMU motion capture, clip 82_08, retargeted with `tools/retarget/retarget.py`) | Works: real heel-toe walk with arm swing. **Issue:** the feet cross the centre line on each step (visible in `walk_strip.jpg`). This comes from the actor's narrow gait combined with Mom's wider hips. It needs a hip-spread correction in the retargeter before walks are used in a film. |

## 6. Hand quality — MIXED

Sources:
- **`hands.jpg`**: before the fix (resting frame, door touch, resting frame).
- **`hands_wrist_fix.jpg`**: before (frame 61) and after (frames 61, 151, 191, 251).

**Fingers:** sculpted as one block: four fingers together and a thumb, with no finger bones. They cannot curl, grip, spread or point. On a door, wall or knee a flat open hand reads naturally; holding a mug, a phone or another hand would not. *This is the biggest limitation of the model.*

**Wrist pinch — found, diagnosed, fixed:**
- The resting hands showed a sharp pinch where the cuff meets the wrist.
- **Weight transfer:** I moved the cuff vertices' hand weights onto the forearm (about 1,350 vertices per side). This alone **did not** remove the pinch (tested).
- **Wrist bend limit:** I limited how far the wrist bends. This **did not** remove it either (tested).
- **Diagnosis:** I measured the hand's roll against the forearm. It was **120–130°** at rest and 37° at the door touch, where there was no pinch. With no twist bone, a large roll wrings the fused cuff like a candy wrapper.
- **Fix in `anim10.py`:**
  - Hand roll is capped at 45° (`cap_twist`).
  - The resting palm faces the thighs, close to the model's natural roll.
  - I checked every 4 frames across the shot: the roll moves smoothly (−45° → +37° at the reach → back), with no sudden jump.
- **Result:** in `hands_wrist_fix.jpg` the cuff sits cleanly over the wrist in every frame.

**Remaining:** hands are smooth, with no knuckle or nail detail. The wrist is now fine in our poses, but extreme wrist roll (for example, palm up) would still pinch until twist bones are added.

## 7. Scene consistency (hallway) — PASS

Source: `scene_inventory.py` → `scene_inventory.json`.

| Object type | Count | Notes |
|---|---|---|
| Separate mesh objects | 77 | **Set (59):** floor, ceiling, door with 2 panels, jambs, header and knob, left and right wainscot (base, rail, cap, 7+5 panels), staircase (newel post, 9 balusters, handrail), runner rug, sconce, ceiling lamp, door-slit glow strip, 5 frames with 5 photos, console table, vase and potted plant (Poly Haven, CC0). **Mom (18):** her body mesh plus 17 face-rig pieces (2 eyes, 4 catch-lights, 2 upper and 2 lower lids, 2 lash lines, 2 brows, 1 mouth, 2 tears) |
| Lights | 7 | lampL (ceiling, 120 W), sconceL (25 W), wash, slitlight (light under the door, switched off on cue), fill, facefill, bounce; each one is a separate, animatable object |
| Cameras | 1 | Animated dolly and zoom |
| IK and pole empties | 17 | Rig controls |
| Armatures | 1 | Mom |

The only flat image planes are the 5 family photos inside the frames, which is correct for printed photos. Everything else is real geometry with its own material, so the set can be relit, reframed, rearranged and reused.

## 8. 10-second animation test

Script: `../anim10.py`. Output: `../mom-validation-animation.mp4`, 1080×1920, 30 fps, 300 frames, Cycles.

The beats:
1. **0–2.3 s:** she sits against the hallway wall, worried and breathing, with one blink.
2. **2.3–4.2 s:** her eyes go to the door first, then her head turns.
3. **4.3–6 s:** her left hand reaches out and rests on the door frame, and her face softens with hope.
4. **7 s:** the light under the door goes out.
5. **7.4–9 s:** her hand lowers back to her knee and her head drops.
6. **At the end:** a slow, heavy close of the eyes, a tear and a sad mouth.

Sound: soft piano and strings, plus touch and light-click effects, mastered to −14 LUFS and −1.6 dBTP.

QA results (full-resolution face, hand and foot crops, plus a contact sheet; see `QA_A10.md`).

## 9. What needs improving, in priority order

1. **Finger bones and posable hands.** This is needed for any holding or hugging shot. The best route is to re-rig the hands with 3 bones per finger and auto-weights on the hand region only. A separately modelled hand would be needed for true finger separation, because the fingers are fused in the mesh.
2. **Forearm twist bones.** Two per forearm, sharing the hand roll. This removes the need for the 45° roll cap.
3. **Shoulder fix.** Corrective shape keys or a shoulder helper bone, driven by arm raise, to stop the sleeve bunching when she reaches.
4. **Walk retarget: hip spread and foot correction.** This stops the feet crossing.
5. **A real mouth.** A sculpted mouth cavity with lip-sync shape keys, plus cheek raise and lower lids, needed for talking or big-emotion close-ups.
6. **Hair and cloth secondary motion.** A light spring on the hair and cardigan hem would avoid the "hard plastic" feel in fast moves.
7. **Cleaner topology** (optional). A quad retopology of the shoulders and wrists would deform better than the AI triangle mesh.

Items 1–4 are worth doing once, in the shared character loader, before the rest of the family is built. The same fixes then apply to every character.
