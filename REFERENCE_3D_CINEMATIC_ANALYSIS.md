# Reference 3D Cinematic Analysis

How the owner's reference Shorts achieve their look, how our Episode 1 compares, and what to build next.

- **Status:** analysis and proposal. **Nothing here is approved for production yet.**
- **Written:** 2026-11-15, after Episode 1 (*The Claw of Syracuse* v2) was closed.

**Sources analysed** (provided by the owner, attributed to the channel "Rick Clips"; analysed for production principles only, never to be copied):
- **R1:** "The Ancient Jar That Warned an Empire". 1080×1920, 30 fps, 64.9 s, AAC 44.1 kHz.
- **R2:** "Levels of Pirate Cannonballs". 1080×1920, 30 fps, 63.6 s, AAC 44.1 kHz.

Reference frames are **not** stored in this repository; they are another creator's copyrighted work. Observations are described in text with timestamps.

**Evidence labels:**
- **[OBS]**: observed directly in the frames or audio, or measured with ffmpeg.
- **[HYP]**: informed hypothesis, *not verified*. We do not know the creator's software, team, budget or workflow.

**Method:**
- ffprobe;
- per-frame scene-change scores (`select=gte(scene,0)`);
- 1 fps contact sheets of both videos;
- full-size key frames;
- 8 fps strips through transitions;
- EBU R128 loudness;
- pixel measurement of caption position.

---

## 1. Headline findings

1. **[OBS] One unified illustrated style.**
   - Every surface (stone, planks, cannons, sails, crates, clouds, water) has **dark ink outlines**, **flat or cel-banded shading** and **hand-painted-looking colour textures** with little or no photographic detail.
   - Characters, props and environments are drawn in the same visual language.
   - This is the single biggest difference from our Episode 1, which pairs photo-scanned PBR stone and HDRI photo skies with flat 2D character cards.
2. **[OBS] Characters are 3D objects in the world.**
   - Rounded 3D bodies with the same outline treatment, sphere heads with **2D drawn faces**, and **thin stick limbs**.
   - They stand on floors with contact shadows, turn to any direction, hold and pull props (R2 13 s: a captain at an ammo crate; R1 30 s: the inventor hauling a cart uphill), and are lit by the scene's own lights.
3. **[OBS] The camera almost never rests.**
   - Push-ins, cranes, orbits and continuous flights link spaces (R2 3.4–5.4 s: one move from the ship's hold, through the deck, past the sails, to the open sea).
   - Cut detection with a hard-cut threshold found only 1 cut per video; the composition still changes every ~2–3 s. Most "cuts" are camera moves, quick dissolves or fast angle changes.
4. **[OBS] Every scene has an art-directed colour key:**
   - golden throne room (R1 0–12 s);
   - bright day for the army reveal (14–16 s);
   - magenta-gold sunset with painted sun rays (30–31 s);
   - deep moonlit blue (33–45 s);
   - furnace orange (R2 22–24 s);
   - purple dusk with fire (R2 34–48 s).
5. **[OBS] Dense, specific worlds.**
   - Crowds of hundreds (R1 14–16 s: an army filling a courtyard).
   - Dressed interiors: thrones, banners, carpets, columns, chandeliers.
   - Labelled props used for jokes ("LANGRAGE", "GARBAGE", "HOT SHOT", "CARCASS").
   - Stylised effects: splinters, fire, smoke plumes, glowing cannonballs.
6. **[OBS] Character concept is close to ours.**
   - Round white heads with drawn faces are also the core of our "pebble-folk" design.
   - **Risk:** if we adopt their rendering look as well, we may converge on their identity. We must keep our own palette, proportions, face design and story voice (see §7).

---

## 2. Timestamped shot breakdown

### R1: "The Ancient Jar That Warned an Empire" (64.9 s)

| Time | What we see | Camera / technique | Story function |
|---|---|---|---|
| 0–1 | Inventor (blue robe) beside a giant bronze jar ringed with golden dragon heads; frog statue below; warm candle light | Medium close-up; shallow depth of field; warm key light from candles at left | **Hook:** an impossible-looking object plus its maker |
| 1–2 | Extreme close-up of a golden dragon head, fire bowl in foreground | Low macro angle; foreground flame for depth; strong specular on gold | Detail that sparks curiosity |
| 2–3 | Wide: the court before the throne, three guards | Symmetrical wide; red and gold palette | Context: who must be convinced |
| 3–5 | Inventor reacts (sweat drop, wide eyes) | Close-up reaction; expression change mid-shot | Stakes and humour |
| 5–7 | Three angles in about 0.6 s, then a dolly-in on the emperor; his drawn face swaps neutral → grimace → laugh about every 0.25 s; the whole court laughs | Rapid cutting, then a push-in; expression swaps timed to the narration | **Humour beat**; the hero is mocked |
| 7–12 | Orbit and push around the jar: 8 dragons, frogs, "a ball", "a frog's mouth" | Slow orbit plus push-in; ends tight on the frog's mouth | Explains the device visually while the narrator lists the parts |
| 12.6–14.6 | Push into the frog mouth → dissolve (≈0.25 s) → emperor on a balcony → crane up and back to reveal a vast army in a courtyard, city and mountains | Dissolve plus crane reveal | **Scale reveal:** the empire's power |
| 17–19 | Emperor; inventor at the jar ("nothing") | Medium shots | Setup: nothing happens |
| 20 | Emperor's face reflected in a wine cup | Creative macro / reflection shot | Visual variety; characterisation |
| 21–26 | Emperor on the throne; banquet hall laughing | Close-ups plus a wide | Mockery escalates |
| 27–29 | City gate, wide; inventor pushes the jar into the city | Wide establishing; dolly forward | New act |
| 30–31 | Sunset: inventor hauls the jar uphill on a cart, sun rays behind | Silhouette composition; painted god rays; magenta-gold grade | Emotional low point, beautiful |
| 32 | Evening campfire, alone | Wide | Loneliness |
| 33–36 | Moonlit night: inventor asleep by the jar; a dragon drops its ball | Blue grade; pull-back | **The event happens** |
| 37–45 | Barred window, guards on the walls, castle gate at night | Through-the-bars framing; low angles | He tries to warn them |
| 46–48 | Next morning: a distant city collapses into a dust plume | Wide; smoke and debris effects | **Payoff:** he was right |
| 49–55 | Cutaway inside the jar: pendulum, rods aimed at the dragons | Top-down and orbit inside a golden mechanism | "Oh, that's how it worked" explanation, **after** the payoff |
| 56–57 | A dragon's jaw drops the ball into a frog | Close insert | Mechanism closure |
| 58–61 | Mountains and the jar on a hill at sunrise | Wides | Calm |
| 62–64 | Cross-section of the earth, glowing fault line under the empire | Stylised science visualisation | Final "whoa" fact |

### R2: "Levels of Pirate Cannonballs" (63.6 s)

| Time | What we see | Camera / technique | Story function |
|---|---|---|---|
| 0 | Ship deck wide, two crew behind a cannon | Wide | Hook setup |
| 1 | Cannon fires; ball flies | Over-the-shoulder along the barrel | Action at once |
| 2–3 | Below deck: barrels, a smiling pirate ("ones") | Low interior | Level 1 |
| 3.4–5.4 | **One continuous flight** from the hold, up through the deck, past the sails, to the open sea and a Navy ship | Seamless camera path with motion blur | Transition without a cut |
| 5–6 | Navy ship fires across the sea | Wide; island pillars | Level 2 threat |
| 7 | Pirate deck explodes in splinters, a pirate screams | Debris effects; wide-angle | **Visual WOW** |
| 8–11 | Crew reaction shots ("tore the crew") | Close-ups; varied angles | Reactions |
| 12–17 | Navy captain at the ammo crate; barrels labelled LANGRAGE / GARBAGE | Medium shots; prop gag | **Humour through props** |
| 18–22 | Island fort reveal; "HOT SHOT" furnace building, piles of cannonballs | Aerial establishing; then medium | Level 3 |
| 23–24 | Inside the furnace: rows of glowing balls | Symmetrical macro; orange key light | Visual richness |
| 25–26 | Tongs load a glowing ball into a cannon | Over-the-shoulder | Process |
| 27–29 | Cutaway: a soaked wad, then a **gunpowder bag with a face, sweating** | Stylised cutaway; anthropomorphic gag | Humour plus clarity |
| 30–36 | Glowing ball buried in a hull; the ship catches fire from inside at dusk | Time-lapse feel; purple-orange grade | Escalation |
| 37–46 | "CARCASS" crate; smug pirate captain lights a tar ball and fires | Character close-ups; prop text | Level 4, a character moment |
| 47–48 | Navy ship ablaze ("torch") | Wide; fire effects | Payoff |
| 49–53 | Ironclad hull; cannonballs bounce off | Wipe-like transition along the hull; impact sparks | Reversal |
| 54–59 | Fort with a giant gun; tripod hoists a 1,000 lb ball | Low angles for scale | Final level |
| 60–61 | Shot skips across the water; huge explosion | Effects | **Big WOW** |
| 62–63 | Pirates sit in a barrel in the water under a mushroom of smoke | Comic tableau | **Funny ending** |

### Format observations (both)

- **[OBS]** R2 uses a "levels" escalation format (each level bigger). R1 is a chronological mystery with a mechanism reveal and a science-visualisation ending.
- **[OBS]** Humour beats roughly every 5–10 s: reactions, labelled props, an anthropomorphic powder bag, the laughing court.
- **[OBS]** Explanations come **after** the payoff and as designed cutaways (R1 49–55, 62–64; R2 27–29), never as a lecture over the climax.
- **[OBS]** Captions: **one word at a time**, large, bold, white with a black outline. The caption block sits roughly **30% above the bottom edge**, i.e. a vertical centre around y ≈ 1340/1920 (estimated from scaled frames).
- **[OBS]** Loudness: R1 −14.1 LUFS / LRA 2.1 / peak −2.1 dBFS; R2 −14.0 LUFS / LRA 2.1 / peak −1.9 dBFS. Very compressed, consistent narration.
- **[HYP]** Narration pace looks faster than ours (one-word captions change rapidly). Not measured.

---

## 3. Technique observations

**Lighting and rendering:**
- **[OBS]** Clear key / fill / rim structure with saturated, coloured light (candle-gold, moon-blue, furnace-orange).
- **[OBS]** Contact shadows under every character and prop.
- **[OBS]** Soft gradient skies with **painted** clouds and sun rays, not photos.
- **[OBS]** Mild depth of field in close-ups; atmospheric fade to pastel in distant layers.
- **[OBS]** Speculars mostly reserved for metal (gold dragons, cannons, bronze).
- **[HYP]** Toon or cel shading with stepped light ramps, plus line rendering from geometry edges or an inverted-hull outline. Consistent with a real-time engine or Blender NPR rendering; **tool unknown**.

**Materials:**
- **[OBS]** Flat-colour albedo with painted detail (brick lines, plank seams, fabric patterns) and almost no roughness or bump micro-detail.
- **[OBS]** A highly saturated palette.

**Cinematography:**
- **[OBS]** Apparent lenses range from wide (≈24–28 mm equivalent, deck and furnace shots) to tele-ish close-ups (≈70–85 mm equivalent, emperor and reactions).
- **[OBS]** Frequent low angles for scale.
- **[OBS]** Foreground objects for depth (fire bowl, cannon barrel, bars).
- **[OBS]** Continuous camera flights, cranes for reveals, push-ins on emotion, short dissolves, and motion blur on fast moves.

**Character animation:**
- **[OBS]** Simple rigs: body tilt and squash, stick-limb gestures, prop holding.
- **[OBS]** Faces are 2D drawings that **swap** quickly (snappy, readable), plus sweat drops and other emote marks.
- **[OBS]** Characters are placed and lit in 3D and can face any direction.
- **[HYP]** Faces are animated textures on a sphere, not 3D facial rigs.

---

## 4. Side-by-side with our Episode 1 (Syracuse v2)

| Area | Reference | Syracuse v2 | Gap |
|---|---|---|---|
| 3D environment | Dense, stylised, outlined, painted | Real geometry, but sparse; photo PBR textures; placeholder city blocks | **Large** |
| Character integration | 3D bodies, any facing, lit and shadowed, hold props | 2D cards always facing the camera; fake card lighting; blob shadows | **Large** |
| Materials | Painted flat colour, coherent | Photo-scanned stone / wood next to flat cartoons | **Large** |
| Lighting | Art-directed colour keys per scene, painted skies | HDRI photo sky; haze; exposure fixes needed for glare | **Medium–large** |
| Camera | Constant motivated motion, flights, reveals, macro inserts, dissolves, motion blur | Mostly slow two-key moves and hard cuts; some good reveals | **Medium** |
| Animation fluidity | Snappy face swaps, gestures, prop interaction | Procedural acting beats; limited prop interaction | **Medium** |
| Composition | Strong foreground, mid and background layering | Improved in v2 (POV / reverse, low angles); fewer foreground layers | **Medium** |
| Storytelling / pacing | Hook in 1 s, humour every 5–10 s, escalation, explain-after-payoff | v2 hook and escalation good; little humour; no cutaways | **Small–medium** |
| Music / SFX | Consistent, compressed, −14 LUFS | Original score plus synthesized SFX, −14 LUFS | **Small** |
| Captions | One-word bold captions | 1–3 word chunks, highlighted keywords | **Style choice** |

---

## 5. The five biggest visual gaps

Each gap lists what the reference achieves, what we lack, the likely cause, what's required, feasibility and cost. All "Effort" figures are Claude working time.

### Gap 1: No unified art style (the photoreal-versus-cartoon clash)
- **Reference:** one illustrated look across everything (outlines, cel shading, painted colour).
- **Syracuse:** PBR materials with photo textures (Poly Haven), HDRI sky, ACES tone mapping, next to flat drawn cards.
- **Cause:** the engine was built for photoreal PBR (`stage.js`), and sets use photo texture sets.
- **Required:**
  - a toon material path (`MeshToonMaterial` with 3- or 4-step gradient maps);
  - an outline post-pass (edge detection on depth and normals, ink colour, ≈1.5–3 px at 1080 wide);
  - flat or painted colour textures in place of photo textures (procedural canvas paint, or CC0 stylised kits such as Quaternius / Kenney, licences to be verified);
  - a per-scene palette.
- **Feasibility:** **current three.js pipeline: yes.** Post-processing already exists (bloom, bokeh, grade passes).
- **Effort:** about 2–3 days for the style system, plus about 0.5–1 day per existing set to restyle.
- **Cost:** $0. Render time roughly +10–30% for the extra pass **[HYP: measure]**.
- **Test:** A/B the same Syracuse frame, current versus toon plus outline. Pass if a stranger reads the characters and the world as one style.

### Gap 2: Characters are flat cards, not 3D actors
- **Reference:** rounded 3D bodies, sphere heads with drawn faces, stick limbs, real shadows, any facing, prop contact.
- **Syracuse:** canvas cards that always face the camera; eyelines only via POV / reverse editing; blob shadows.
- **Cause:** the `chargen` design is 2D-first (drawn on canvas).
- **Required:** a "3D pebble actor":
  - capsule body mesh with costume colours from the existing spec;
  - sphere head with the **existing face drawing** projected as a texture (reusing `toon.js` faces and lip-sync);
  - tube stick limbs with simple 2-bone IK for reaching or holding;
  - real cast shadows; head and body yaw toward a look target.
  - Acting beats and lip-sync carry over.
- **Feasibility:** current pipeline, yes (procedural geometry, no rigging tool needed). **[HYP]** Quality ceiling is "clean stylised", not squash-and-stretch feature animation.
- **Effort:** about 4–6 days to a usable actor, then reusable for every story.
- **Cost:** $0.
- **Test:** one character turns from profile to front, picks up a cannonball, casts a correct shadow.
- **Originality guard:** our proportions, face style and palette must stay distinct from the reference's (see §7).

### Gap 3: Lighting is photographic, not art-directed
- **Reference:** a colour key per scene (gold interior, blue night, magenta sunset, furnace orange), painted gradient skies, painted sun rays, rim light on characters.
- **Syracuse:** HDRI photo skies plus haze; glare needed per-shot exposure fixes.
- **Cause:** image-based lighting from photographic HDRIs; realistic tone mapping.
- **Required:**
  - painted sky domes (gradient shader, cloud sprites, sun-ray sprite);
  - three-light setups per shot (key colour, fill colour, rim);
  - a "colour script" per episode;
  - a cheap screen-space god-ray pass (radial blur from the sun position).
- **Feasibility:** current pipeline, yes.
- **Effort:** about 1.5–2 days.
- **Cost:** $0. Optional: AI-painted sky backdrops at 0.25 credits each, **only with approval**.
- **Test:** the same set at "noon / sunset / moonlight" presets reads as three moods.

### Gap 4: Camera language is too static
- **Reference:** continuous flights between spaces, crane reveals of scale, macro inserts, quick dissolves, motion blur, expression swaps synced to words.
- **Syracuse:** two-key linear moves per shot; hard cuts only; no blur.
- **Cause:** `camKeys` interpolates a few keys; no spline paths, transition tools or blur.
- **Required:**
  - Catmull-Rom spline camera paths with ease-in/out and look-at curves (multi-key);
  - a "flight" shot type that passes through sets;
  - dissolve and whip transitions at encode (ffmpeg `xfade`);
  - camera-velocity motion blur as a post pass;
  - an insert-shot library (macro props).
- **Feasibility:** current pipeline, yes.
- **Effort:** about 1.5–2 days.
- **Cost:** $0.
- **Test:** one 5 s continuous move from a wide establishing view to a character close-up with no cut.

### Gap 5: Worlds are sparse; scale and density are missing
- **Reference:** crowds of hundreds, fully dressed interiors, labelled prop gags, stylised effects (splinters, fire, smoke, glow).
- **Syracuse:** few hero props; a 7 + 22 fleet; realistic spray particles; empty city blocks.
- **Cause:** every asset is hand-coded or a photoreal CC0 model; no stylised kit; no crowd system.
- **Required:**
  - instanced crowds of simplified 3D actors (≤ 1,000 instances);
  - a stylised prop kit (crates, barrels, banners, columns, carpets) built procedurally or from CC0 stylised kits (licences to be verified);
  - stylised effect sprites (cartoon smoke puffs, flame cards, splinter shards).
- **Feasibility:** current pipeline, yes. **[HYP]** Asset breadth is the long-term bottleneck: each new world needs about 1–2 days of kit building until a library exists.
- **Effort:** about 2–3 days initial kit, then about 1–2 days per new world.
- **Cost:** $0 with CC0 kits. Downloading them may need network allow-listing (to check).

---

## 6. Production approach options

| | A: upgrade three.js pipeline | B: Blender + Claude automation | C: hybrid (three.js render + Blender asset prep + selective AI) |
|---|---|---|---|
| Fit with CPU-only | Good (real-time rasterizer on SwiftShader, ~4–12 s/frame today) | **Weak:** Eevee needs a GPU/OpenGL; Cycles on CPU is slow at 1080×1920 (likely tens of seconds to minutes per frame **[HYP]**) | Good (Blender headless only for offline asset conversion and baking) |
| Visual ceiling | Clean stylised NPR (toon, outlines, painted), which matches the reference category | Higher (Grease-Pencil line art, real rigs, better shading) | Same as A, with better assets |
| Reuse of our systems | Keeps director, story options, acting, lip-sync, captions, mix, QA | Most rebuilt in `bpy` | Keeps everything in A |
| Effort to first proof | ~3–4 days | ~1.5–3 weeks (install, pipeline, rigs) **[HYP]** | A + ~1 day |
| Recurring cost | $0 | $0 (but long renders; maybe a GPU later) | $0; optional AI texture or sky ≈ 0.25 credits each, with approval |
| Risk | Low–medium | High | Medium |

**Recommendation: A now, C as needed.**
- The reference's look is a *stylised NPR* look, the category a real-time rasterizer does well and cheaply.
- Our biggest gaps (style unity, 3D actors, art-directed light, camera language) are all engineering-sized, $0, and reuse what already works.
- Blender is worth revisiting only for offline asset preparation, or if we later get GPU time.
- Claude Code cannot by itself make studio-quality *character animation*. Expect "clean, expressive, stylised", improving with each episode, not feature-film acting.

---

## 7. Originality guardrails
- Do **not** adopt the reference's exact recipe (white round head + stick limbs + identical outline weight + caption style). Keep our differences:
  - our face drawing and eye style;
  - body silhouettes that vary per character (our pebble-folk shapes);
  - our palette (warm Mediterranean and sunrise as our signature);
  - 1–3 word captions with highlighted keywords, not single words;
  - our narration voice.
- Learn the **principles**: unified style, 3D actors in lit space, colour scripting, motivated camera, density, humour cadence, explain-after-payoff.

---

## 8. Proposed 5-second proof of concept (awaiting approval)

**Shot "Deck at sunset" (original, reusing Syracuse assets), 5.0 s at 30 fps (150 frames):**
- A Roman warship deck at golden sunset.
- The camera starts **wide and low behind a cannon-like ballista or crate stack** (foreground layer). It **dollies forward and cranes down** past two sailors coiling rope.
- It **ends on a medium close-up** of one sailor who **turns his head and body toward the wall** as a huge shadow (the claw arm) sweeps across the deck. His drawn face swaps calm → shock.

**What it demonstrates:**
1. One toon / outlined style across the ship, sea, sky and characters (Gap 1).
2. Two **3D pebble actors** with cast shadows, a body turn and a prop in hand (Gap 2).
3. A painted sunset sky with a warm key, purple fill, rim light and god rays (Gap 3).
4. A continuous spline camera move with mild motion blur (Gap 4).
5. A dressed deck: ropes, crates, shields, ballista; stylised spray (Gap 5, partially).

**Build:**
- toon materials and outline pass;
- painted sky and light preset;
- the 3D actor v0;
- a spline camera;
- restyled ship and wall;
- a small CC0 or procedural prop kit.

| Item | Estimate |
|---|---|
| Development | ≈ 3–4 working days (style 1, actor 1.5–2, sky / light 0.5, camera 0.5, shot 0.5) |
| Render | 150 frames × ≈ 6–15 s ≈ 15–40 min on the current CPU sandbox, in fresh-browser batches |
| Cost | **$0, 0 Higgsfield credits** (sound uses existing SFX and score) |

**Acceptance criteria:**
1. A stranger says the characters and world look like one style.
2. The sailor reads as **in** the scene (shadow, lighting, turn).
3. The camera move is smooth and purposeful.
4. The emotion reads with sound off.
5. 1080×1920 at 30 fps, verified with ffprobe.
6. Side-by-side with Syracuse v2, the improvement is obvious.

**Compared with current capability:** every element is new except the ship, wall, sea and face drawing. If the test fails criterion 1 or 2, we stop and reconsider (Option C or B) before investing further.

---

## 9. Prioritised roadmap (after approval)
1. Style system (Gap 1).
2. 3D pebble actor v0 (Gap 2).
3. Painted skies and light presets (Gap 3).
4. Spline camera, transitions, motion blur (Gap 4).
5. The 5 s proof of concept, then owner review.
6. Stylised prop kit and crowds (Gap 5), built per episode as needed.
7. Episode 2 storyboarded with the new toolkit. Humour cadence and explain-after-payoff cutaways go into the storytelling checklist (Bible §B).

Every step is a small, testable increment. Nothing replaces a PROVEN system until its replacement passes a side-by-side test and owner approval.

---

## 10. Proof-of-concept results (2026-11-15)

**Deliverables:**
- `renders/poc_deck_at_sunset_1080p.mp4`: 1080×1920, 9:16, H.264, 30/1 fps, 150 frames, 5.0 s, −14.1 LUFS.
- `renders/poc_stage1_style_before_after.jpg`: the Stage 1 still.
- `renders/poc_vs_episode1.jpg`: comparison with Episode 1.

**Effort and cost:** about 1 working day (estimate 3–4), $0, no credits. Render 5.3 s/frame.

| Criterion | Result |
|---|---|
| One cohesive style (characters + world) | **Improved clearly** vs Episode 1. Outlines, cel light and painted sky unify the frame. Still below the reference: wall and deck read as softened photos; warm grade makes everything orange-brown. |
| Character feels in the world | **Yes.** A 3D body, lit by the scene, casting shadows, hands on the rope, turning in place. Weaker than the reference: faceted shading, small face features. |
| Cinematic camera | **Smooth and purposeful** (spline glide, reveal from his back to his face). The first ~2 s under-feature the sailors and are slow to start. |
| Lighting and shadows working together | Sun dimming as the claw passes reads as a threat overhead. **The shadow shape does not read as a claw.** |
| Emotion readable on mute | **Yes:** calm hauling → head snaps → full turn → open-mouthed shock, hands up. |

**Verdict:**
- An unmistakable step up from Episode 1 in cohesion, integration and camera.
- Not yet at the reference's polish. The main remaining gaps are colour and lighting design (brightness and separation), painted material art, and crisp bold faces.
- The fixes are listed in Bible §C.8a, about 1 day.

## 11. Polish pass results (2026-11-15, ≈1 day, $0): PROOF OF CONCEPT CLOSED

**Deliverables:**
- `renders/poc_deck_at_sunset_v2_1080p.mp4`: 1080×1920, 9:16, H.264, 30/1 fps, 150 frames, 5.0 s, −14.1 LUFS, no black or frozen frames.
- `renders/poc_polish_before_after.jpg`: before/after comparison.

**Improved:**
- **Colour and lighting:** bright, clean "golden" look, clear separation of the sailors from the deck, sea and sky; no orange grade.
- **Characters:** smooth bodies; a bigger, bolder face; shock that reads on a phone.
- **Materials:** painted stone blocks and planks with inked seams.
- **Opening:** the sailor is visible from frame 1, and the boom-up shows the hauling.
- **Claw:** a chain-and-hook shadow crosses the deck and closes on the sailor.

**Remaining weaknesses (honest):**
1. The **deck dominates the palette** (large warm-orange area); a cooler or darker deck tint would help.
2. The claw's three hooks read less clearly than the chain links.
3. The secondary sailor's reaction is small and partly off-frame.
4. Motion is **posed rather than animated**: no squash and stretch, no follow-through on the arms or crest, no blinks.
5. The reference still leads in environment density and in hand-designed props.

**Recommendation:** adopt the components (style presets, painted textures, 3D actor, spline camera, shadow card) as the Episode 2 foundation. Address items 1–4 inside Episode 2 production, not as further POC work.
