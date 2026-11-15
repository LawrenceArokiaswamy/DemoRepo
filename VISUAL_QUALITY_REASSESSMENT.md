# Visual quality reassessment: references vs our Episodes 1–2

- **Status:** Phases 1–2 approved by the owner (2026-11-15), with refinements: warm light is not mandatory, and Episode 3 is the restaurant / internet-history scene.
- **Gate 1:** benchmark stills delivered (see the Bible's visual standard v2 section, B). Gate 2 awaits approval.
- **Next:** Phase 3 (three benchmark stills) only after approval.
- **Budget:** $0, 0 credits.

## 0. What was analysed (honest scope)

| Video | Available? | How analysed |
|---|---|---|
| Ref: *The Ancient Jar That Warned an Empire* (64.9 s) | ✅ | Contact sheet at 0.5 fps, full-res frames, a 5 fps motion strip (18–20.4 s) |
| Ref: *Levels of Pirate Cannonballs* (63.6 s) | ✅ | Same; motion strip 5.0–7.4 s (broadside → impact) |
| Ref: *This Shape Saved Roller Coasters* | ❌ **Not in this session** | **Not analysed.** It was not attached. The only other upload (`3d0b22fb…mp4`) is our own Roman-concrete test. Please attach it if you want it included |
| Ours: *The Claw of Syracuse* v2 | ✅ | Contact sheet, frames |
| Ours: *Vasa* final review | ✅ | Contact sheet, frames |

Findings below are drawn only from the four available videos. This also builds on the earlier `REFERENCE_3D_CINEMATIC_ANALYSIS.md`.

## 1. Findings: what the references do, and why ours looks weaker

| Area | References (observed) | Ours (observed) | Root cause |
|---|---|---|---|
| **Overall cohesion** | Every surface is *designed*: stylised, hand-painted-looking textures with soft gradients, worn edges and ink-like edge accents; one consistent palette per scene (warm key against cool shadow) | Large flat toon-coloured areas with no texture, gradient or wear (walls, hull, sails, deck); saturated primaries (pure red hull, yellow trim) that fight each other; skies often blown out to white | **Art direction + asset workflow.** Our assets are code-built primitives with flat colours; there is no texture-painting step and no colour key per scene |
| **Characters** | Deliberately *tiny* design vocabulary: a white round head, dot eyes, line brows and mouth, black stick limbs, one clothing colour. Very consistent ink line. Characters are a small part of a frame built mostly from environment | C+ is bigger and more detailed: large faces with toon-shaded skin (muddy dark patches on cheeks and jaws), tube limbs, chunky hats. More "stuff", less appeal. The face shell reads as a sticker in profile | **Art direction** (too much detail in the wrong places) **+ shading** (3-band toon on skin makes faces dirty) |
| **Facial acting** | Expression changes are tiny and fast: brows snap, eyes widen, a sweat drop; poses *hold*. 2D symbols (sweat, shock lines, thought bubbles) carry emotion | Big faces with big expressions, but changes are blended slowly; few holds; no symbol language | **Animation design**: timing (holds and snaps) and an FX vocabulary, not rig capability |
| **Body acting** | Clear silhouettes: one readable gesture per beat, held long enough to read; contact-heavy actions (carrying, sitting on barrels, holding things) | Poses are often small or ambiguous at phone size; interaction with props is rare | **Animation design and staging** |
| **Character–world integration** | Soft contact shadows, warm bounce, rim light separating figure from background, consistent line weight between characters and props | Hard sun shadows only, no ambient occlusion or contact darkening; characters look pasted on | **Rendering setup** (no AO or contact shadows, limited lights). Fixable in our renderer |
| **Lighting and grading** | Motivated *practical* lights (candles, braziers, lanterns) with glow; strong value hierarchy (bright subject, darker frame edges); golden/blue hours; coloured shadows | One key light plus a flat fill; interiors are brown boxes; underwater is flat teal; little value hierarchy | **Lighting design** (art direction), plus no AO or volumetric glow (renderer setup) |
| **Environment richness and depth** | Dense set dressing: carpets with patterns, candelabras, banners, stained glass, columns, crowds, foliage. Clear foreground/middle/background layers, often with a foreground framing element | Sparse sets: few props, large empty planes, little foreground framing; depth comes mostly from distance | **Asset library and workflow.** We lack a reusable stylised prop and texture kit |
| **Camera** | Almost every shot moves with purpose: slow push-ins, whip pans used as transitions (pirate broadside → whip → splinters), follow moves; low angles for power; inserts and cutaways for mechanisms | Mostly static or slow drift; obstructed compositions (masts, rigging, sails across the frame); several wides where the subject is small or hidden | **Shot design and workflow.** We place cameras after building scenes, and there is no still-frame composition gate |
| **Visual hierarchy and clarity** | One subject per shot, centred in the vertical frame, big and lit; text labels on key props (the "CARCASS" crate); every cause has its effect shown in close-up | Our cause → effect shots are often wide or partially occluded (the Vasa gun-deck flooding, the 1961 raising) | **Story-to-shot design** |
| **Effects** | Stylised, readable FX: cartoon smoke puffs, splinter starbursts, impact flashes, speed lines, fire with shape design | A few sprites; water and impact FX barely read | **FX library missing** (renderer-capable) |

**The main point.** The quality gap is mostly not resolution or polygon count. The references use *simpler* characters and *richer, more designed* environments, lighting and camera work. We built the opposite balance: detailed characters in plain worlds.

**What our pipeline genuinely limits** (being honest about the renderer):
- CPU-only WebGL (SwiftShader) means no real-time global illumination and slower renders (2–5 s per 1080×1920 frame).
- Shadow quality is limited.
- Blender's EEVEE needs a GPU, and Cycles on CPU would take minutes per frame, so it isn't practical for animation here; it is usable only for single stills.

Most of the reference look is *stylised* lighting and painting, which three.js can do: ambient occlusion passes, emissive glow and bloom, fog gradients, painted textures. None of these are blockers.

## 2. Proposed studio visual standard ("Lantern style")

An original identity, not a copy of the reference.

**Principles**
1. **Designed worlds, simple actors.** Spend the detail on environments, light and props. Characters become *cleaner and more graphic*.
2. **Every frame is lit like a painting:**
   - a warm motivated key, a cool shadow and a coloured rim;
   - one practical light source in most shots (lantern, fire, window, sun);
   - a bright subject on a darker frame.
3. **One subject per shot**, big and clear in the central 60% of the 9:16 frame, with a foreground framing layer and atmospheric background depth.
4. **Snap and hold:**
   - fast transitions into strong poses (4–6 frames), then holds (12–20 frames) so viewers can read them;
   - a small 2D symbol language (shock lines, sweat drop, impact star, motion lines).
5. **Cause → effect gets its own shot:** an insert or cutaway, never a busy wide.

**Keeping C+.** Keep the rig, face system, springs, gait/IK and costumes. Change its *look*:
- **Skin shading:** flat skin with a soft single-step shadow and a rim, instead of the dirty 3-band toon.
- **Proportions:** slightly slimmer limbs and simpler hats and costumes.
- **Line:** one consistent ink line weight shared with props.
- **Faces:** slightly smaller face features, so faces read as designed graphics rather than stickers.

## 3. The five most important reusable improvements

| # | Improvement | Current limitation | Proposed solution | Effect on episodes | Renderer supports? | Effort | Recurring cost |
|---|---|---|---|---|---|---|---|
| 1 | **Lighting and atmosphere kit** | One key plus a flat fill; no ambient occlusion or contact shadows; interiors and underwater look flat | Per-shot light rigs (warm key, cool fill, coloured rim); practical lights with glow halos plus bloom; an ambient-occlusion pass (three.js SAO/SSAO); soft contact shadows under characters and props; height/depth fog; stronger painted sky gradients | Biggest single jump in polish and integration; characters stop looking pasted on | **Yes** (three.js addons already vendored) | ≈2 days | None. Renders get about 20–40% slower |
| 2 | **Stylised texture and set-dressing kit** | Flat untextured surfaces; sparse sets | A library of procedural "hand-painted" canvas textures (stone, wood, plaster, fabric, metal) with gradients, wear and ink edges; a reusable Blender prop kit (barrels, crates, lanterns, banners, rope coils, carpets, candles, flags, furniture); scatter and dressing helpers | Rich, readable worlds without photoreal clutter; reusable across eras | **Yes** | ≈3–4 days to start, then it grows a little each episode | None. (Optional AI-generated texture art would cost credits; not proposed) |
| 3 | **C+ look refresh (same rig)** | Muddy face shading, tube limbs, heavy hats, stickered faces in profile | Flat/soft character shader with rim; refined proportions; consistent ink; smaller, crisper face graphics with a profile variant; a library of 12 key acting poses with snap-and-hold timing | Appealing, readable characters that fit the painted worlds | **Yes** | ≈2–3 days | None |
| 4 | **Shot-language toolkit** | Static cameras placed after the build; obstructed compositions | Camera presets (push-in, follow, low-angle reveal, whip-pan transition with a smear blur, crash-in insert, x-ray cutaway); a 9:16 composition overlay; a mandatory **still-frame gate** (key frames approved before animating) | Cinematic motion and clarity; fewer wasted renders | **Yes** | ≈2 days | None |
| 5 | **Stylised FX and symbol library** | Water, impact, smoke and fire barely read | Shape-designed 2D/3D FX: smoke puffs, splinter bursts, impact stars, splashes and droplets, flames, speed lines, sweat drop, shock lines, dust; as deterministic sprite or mesh systems | Cause → effect becomes unmistakable and fun | **Yes** | ≈2–3 days | None |

**Total:** about 11–14 working days, best done *inside* the Episode 3 benchmark and production rather than as a separate project.

**Recommended order:** 1 → 3 → 2 → 4 → 5. The Phase 3 stills need 1, 2 and 3; the motion test needs 4 and 5.

**Expectation (honest).** These steps can bring us much closer in clarity, appeal and polish. Whether we fully match the reference's finish depends on the still-frame results; I'll judge that from the frames, not assume it.

## 4. Phase 3 proposal: benchmark scene

The **Episode 3 scene** is not chosen yet.

**Recommendation:** Hero of Alexandria's temple doors (backlog EP05, ranked #2 earlier).
- A firelit temple interior gives practical lighting, rich set dressing, a mechanism cutaway, and a curious crowd plus an inventor character.
- It would show every improvement above.

**The three stills:**
1. **Close-up:** a priest's awe as the doors move.
2. **Interaction:** Hero adjusting the hidden mechanism by lamplight.
3. **Wide:** the temple at dusk with the crowd and fire.

These are produced only after you approve the findings and choose the scene.
