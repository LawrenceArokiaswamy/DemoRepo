# STUDIO PRODUCTION BIBLE

The studio's permanent operating manual: creative playbook, production workflow, technical reference and memory.
**Read this before any video work** (see `CLAUDE.md`). Visual-quality reference study and improvement roadmap: [`REFERENCE_3D_CINEMATIC_ANALYSIS.md`](REFERENCE_3D_CINEMATIC_ANALYSIS.md) (proposal; not yet approved). Episode records live in `studio/episodes/`. The topic backlog lives in `studio/content/`.

Status tags used throughout:
- **PROVEN**: used in a delivered video and verified.
- **EXPERIMENTAL**: built or tested, not yet validated in a published video.
- **ASPIRATIONAL**: a target we are working toward; not a current capability.
- **DEPRECATED**: no longer recommended (kept so we don't repeat it).

Never silently replace a PROVEN method with an untested one. Never describe an ASPIRATIONAL goal as a capability.

Version history: v1, 2026-11-15, written after Episode 1 (Claw of Syracuse) v1 failed review and v2 was rebuilt story-first.

---

## A. Studio vision and creative identity

**Mission.** Original animated Shorts that tell extraordinary true stories (science, nature, history, engineering, survival, mysteries, the occasional clearly-labelled What If?) so clearly and compellingly that a stranger stops scrolling, understands at once, feels something, and stays for the payoff.

**Audience experience.** WHAT?! → OH NO! → WHOA! An emotional journey, not a template. Every video is a miniature film, not an illustrated explanation.

**Ambition (ASPIRATIONAL).** An audience experience roughly 2× more compelling than leading animated-fact channels:
- stronger hooks and greater curiosity;
- cinematic presentation and better emotion;
- smarter humour and exceptional sound;
- more satisfying endings, with more rewatch and sharing.

It must have our own identity and never copy another creator's characters, art, scripts or branding. Long-term revenue goal is about $20k/month, built sustainably. We make no view or revenue promises without evidence.

**Operating philosophy (owner decision 2026-11-15):** *Publish consistently. Learn from real audience feedback. Improve with every episode.* Quality rises episode by episode through small, validated improvements inside real production. There are no standalone redesign or R&D projects unless a serious production blocker emerges, and no chasing perfection before publishing.

**Priority order (when goals conflict):**
1. Storytelling and engagement.
2. Clarity and emotional impact.
3. Cinematic direction.
4. Visual and animation quality.
5. Audio quality and sync.
6. Technical polish.
7. Efficiency and scale.

Technology serves the story; never the reverse.

**Visual identity today (PROVEN):**
- 2D "pebble-folk" cartoon characters drawn on canvas cards (big heads, round expressive eyes, bold outlines, period costumes);
- staged inside 3D worlds rendered with three.js (CC0 Poly Haven assets, procedural props);
- warm cinematic grade.

Known weakness: flat cards in a photoreal-ish world can look like two styles. See C.4.

---

## B. Storytelling playbook (PROVEN on Claw v2; refine with evidence)

### B.1 Topic selection
- Choose stories with one clear human (or creature) at the centre, a real threat or mystery, and a visual WOW moment that can be shown, not just told.
- Prefer topics that reuse existing sets, props and cast (see F.5). Check `studio/content/production_backlog.md` (15 permanent topics; never remove one silently).

### B.2 Research and fact-checking
- Verify key claims against primary or reputable secondary sources. Record the sources in the episode record.
- Keep three categories separate, and label them on screen when it matters:
  - **documented**;
  - **RECONSTRUCTION** (our interpretation of something real but undocumented in detail);
  - **DRAMATIZATION** (invented for storytelling).
- Wording must not overstate. Example from Claw v2: "the claw released it", not "he let go", because Archimedes designed the machines but is not documented operating one.

### B.3 The story spine (every episode, answered in the first ~10 s)
- **WHO** is this about?
- **WHAT** extraordinary thing is happening?
- **WHY** should I care what happens next?

One hero, one threat or mystery, one turn, one payoff, one ending. No competing storylines, unnecessary characters, subplots or epilogues.

### B.4 Hooks (first 1–2 s)
- Open on an impossible-looking event, a dramatic consequence, a surprising visual, danger, a mystery, or an emotional contradiction.
- The hook must create curiosity, not confusion. Answer "who?" within ~2 s while raising "how?".
  - Claw v2: "This warship is being lifted out of the sea… by one old man."
- The first frame must read on mute.
- Avoid generic openers ("Did you know…", dates, establishing shots).

### B.5 Curiosity, suspense, escalation
- Every beat must do at least one of these:
  - reveal something;
  - raise the stakes;
  - build suspense;
  - show an emotional reaction;
  - answer one question while opening another;
  - move toward the payoff.
- Show cause and effect one action per line (Claw v2: arm, then claw drops, then bites, then pull, then lift).
- Use silence before the big moment.

### B.6 Explanation
- Never interrupt the climax with a technical lecture.
- If a mechanism needs explaining, place it after the payoff as a simple diagram or analogy, or cut it if the action already explains itself (Claw v2 cut it).

### B.7 Humour
- Small and natural: irony, reactions, visual callbacks, contrast.
- Never force it into tragedy.

### B.8 WOW moment and ending
- At least one replayable moment per episode.
- End on the strongest meaningful beat: a reveal, reversal, callback or memorable image. No drawn-out epilogues.
- Example (Claw v2): the true "rope panic" callback, then "Rome had sixty warships. / Syracuse had Archimedes."

### B.9 Length and pacing
- Never pad. Typical lengths are 20–35, 35–60 or 60–90 s, depending on the story.
- Narration about 150–165 words per minute (Claw v2: 92 words in 39.8 s). Cut words rather than speed up the voice.
- Shots about 1.5–3 s; hold the payoff or emotion longer only when it earns it.
- A visual change at least every ~3 s.

### B.10 Common storytelling mistakes (learned the hard way, Claw v1)
- Hero introduced at 39 s of 79 s.
- Three competing points of view.
- Machine shown before its inventor matters.
- Explanation mid-climax.
- Two endings (a 31 s epilogue).
- Dense, sped-up narration fighting long subtitles.
- Shots composed to show off the 3D world instead of telling the story.

### B.11 Gates for every story (must pass before storyboarding)
- **A, Hook:** would a stranger stop scrolling in 1–3 s?
- **B, Clarity:** can a first-time viewer say who and what?
- **C, Emotion:** curiosity, tension, laughter or surprise?
- **D, Payoff:** does the ending reward watching?
- **E, Presentation:** do the narration, visuals, edit, sound and acting work together?

---

## C. Visual production manual

### C.1 Pipeline (PROVEN)
`studio/engine/web/director.js` plays a story folder `studio/stories/<slug>/` in headless Chromium (three.js r160, SwiftShader WebGL, CPU only).

**`story.json` holds:**
- `set` (module in `engine/web/sets/`), `period`, `cast` (character specs), `extras`, `performances` (acting beats in *world* time);
- `shots` (camera keys in *video* time, optional `attach` to a ship frame and `attachUp`);
- `timeMap` (video time → world time: slow motion, cuts, rewinds, flash-forwards), `duration`, `fps`.

**`business.js` (optional)** holds story-specific simulation: ship state, claw machine, splashes, debris, props, actor placement (`placeActor`), camera frames (`frameOf`), per-character lighting (`cardLight`).

**Story options (proven in Claw v2, set in `story.json`):**
- `noStones`;
- `extraFleet: N` (more distant ships);
- `ropeGag {pivot, len, t0, swing, until}`;
- `workerRun {t0, t1, x0, x1, z}`;
- `hideAfter {w, ids}`;
- `clearAfter` + `hazeScale` (thinner haze late in a film);
- `exposure [[t0, t1, exposure, sunGlowScale, bloomStrength]]` (per-shot exposure, sun-glow and bloom/glare control, in video time).
  - Proven on Claw v2 shots 19–20: `0.52, 0.0, 0.08` with `hazeScale 0.2`.
  - **Times are video seconds**, so recompute them after any re-time. Claw v2's builder derives them from the shot start.

### C.2 Building an episode as data (PROVEN in Claw v2)
- Write a small `build_story.py` per episode. It holds the shot list as `(name, video a→b, world a→b, camera keys, attach)`, the performances, and the story options, and emits `story.json` plus the `timeMap`.
- One script means re-timing or reframing is a one-line edit. Reuse the world, cast and business of an earlier story with `"business": "../<other>/business.js"`.

### C.3 Characters (PROVEN with limits)
- Generator: `engine/web/chargen.js` (`drawCharacter`) with period-checked costumes (`periodExtra`, `checkPeriod`).
- Acting: `engine/web/acting.js`.
  - Actions: idle, talk, notice, curious, suspicious, disbelief, point, laugh, shock, recoil, stumble, dazed, sheepish, fear, sad, confused, realize, angry, carry, effort, shuffle, stride, bouncy, march, swagger.
  - Face presets in `engine/web/toon.js` `FACE`: neutral, notice, curious, suspicious, disbelief, laugh, shock, fear, angry, sad, confused, realize.
- A beat may override the face (`face: {preset, mouth: {smile}, lidT, pupil: [x, y]}`) and the body (`armL`/`armR: [shoulder, elbow]`, `handR`, `headTilt`). Examples:
  - smirk: `{preset:'suspicious', mouth:{smile:0.55, asym:0.8}}`;
  - looking up: `pupil:[0, -0.9]`;
  - visible raised hand: `armR: [128, 30]` (165° hides the hand behind the head).
- Lip-sync: `engine/web/lipsync.js` with `tools/align.py` (word timings) and `tools/envelope.py` (loudness). Hard m/b/p closure is PROVEN.
- **Limits.** Cards always face the camera. Eyelines are therefore made by editing: a POV shot, then a reverse close-up (Claw v2, shots 17 and 18). Characters lean or slide; they do not truly turn.

**Rules:**
- Faces that must read emotion are ≥ 30–35% of frame height.
- Wide shots carry spectacle, never facial acting.
- Never claim an emotion reads unless it visibly does.

### C.4 Environments, lighting, materials
- **Sets:**
  - `syracuse.js`: wall, city, claw machine, fleet, Etna, ocean;
  - `roman_harbour.js`;
  - `workshop.js`.
- **Props:** `props/warship.js` (procedural, weathered, varied oars).
- **FX:** `fx/ocean.js` (Gerstner waves, impact craters and rings, splash, crown).
- **Assets:** 45 CC0 models, 14 texture sets, HDRI skies. Fetch them with `tools/fetch_assets.py` (via `setup.sh`).
- **Lighting:**
  - the HDR sky is column-rolled to place the sun (r160 has no `backgroundRotation`);
  - per-scene card lighting through `cardLight`;
  - shots that face the sun need the `exposure` override.

**Problems to avoid (all seen in Claw):**
- untextured placeholder boxes in frame (the city behind Archimedes): pick angles that avoid them, or dress them;
- haze or mist planes washing out the far fleet;
- backlit faces.

### C.5 Camera direction (PROVEN rules)
- Every shot names its job in one verb: establish, introduce, reveal, build, act, react, or pay off.
- One subject per shot.
- Motivated moves only: push in for emotion, pull back or crane for a reveal, track to follow a cause. No idle drifting.
- **Place cameras from data, not guesses.** Use `tools/probe.mjs` (actor positions in a ship's local frame, plus any world point) and `tools/probe_expr.mjs` (any scene value, e.g. `wp(C.SET.hand)`). Claw v2 lost several iterations to guessed angles before probing.
- Screen direction depends on the side you shoot from. Check with a test frame before a long render.

### C.6 Physics and movement
- Weight comes from timing: strain before motion, overshoot and settle, the stern pushing water, drainage streams, a slow-motion fall, then real-time impact (`timeMap`).
- Authored curves, not simulation (PROVEN look; limited ceiling).

### C.7 Rendering (PROVEN)
- **Full quality:** 1080×1920, about 8–12 s/frame per job on CPU. Three parallel jobs give about 13 frames/min overall (≈ 90 min for 40 s at 30 fps).
- **Animatic:** `SCALE=0.33` env var, 356×634, 4–5 s/frame. Use 15 fps for animatics (`build_story.py 15`), 30 for finals (`build_story.py 30`).
- **Known failure: a job can silently lose its WebGL context and write black frames** (Claw v1: 229 frames).
  - Always check: `find <frames> -size -20k`.
  - Re-render missing frames into a fresh directory, then copy them over. Never `rm` with variable paths.
- **Root cause found (Claw v2 final):** a single headless browser starts writing black frames after about 300–340 heavy frames (seen three times; healthy jobs stopped just short of it). **PROVEN fix:** render in batches of ≤ 40–100 frames per `node render.mjs` call (a fresh browser each time), looping over the range. Also run a watcher that stops on the first undersized frames.

### C.8a Cinematic POC components (EXPERIMENTAL, built 2026-11-15 for "Deck at sunset"; reusable, not yet used in an episode)

**Status:**
- Proven in a 5 s test at 1080×1920 / 30 fps: `renders/poc_deck_at_sunset_1080p.mp4`.
- Not yet proven across a full episode.
- Owner approval is needed before adoption.

**Effort and cost:**
- About 1 working day (estimate was 3–4).
- $0, 0 credits.
- Rendering runs at **5.3 s/frame**, faster than the PBR look (8–12 s/frame).

**`engine/web/style/painterly.js`:** enable per story with `"style": {"preset": "sunset"|"day"|"night", "shadowBox": [x, y, z, r], "override": {...}}`.
- Cel-banded `MeshToonMaterial` (3 bands: 0.56 / 0.8 / 1.0).
- Photo textures sampled at a soft mip with a saturation lift, so they read as painted.
- Depth- and colour-edge **ink pass** inserted right after the scene render (needs depth textures on the composer targets).
- Painted sky dome with a sun glow and cel-banded clouds.
- Lighting presets: key, fill, rim and fog.
- Stylised matte water.
- **Skipped automatically:** 2D cards, and any material with its own `onBeforeCompile` (e.g. the ocean's waves).
- **Business code must not overwrite** fog, exposure or sky when `story.style` is set (Syracuse business is guarded).

**`engine/web/actor3d.js` `makeActor3D(spec)`:** the 3D pebble actor.
- Body: pebble lathe body, rounded head with our **`drawFace`** decal (identity preserved), helmet with crest, ears.
- Limbs: chunky sleeves with **2-bone IK** to hand targets, mitten hands, legs and sandals.
- Rendering: inverted-hull ink outlines, toon shading, cast and received shadows.
- Pose: `setPose({pos, yaw, lean, side, bob, squash, headYaw, headPitch, headTilt, face, handL, handR})`. Hands are given in the parent's space, so a parent such as a ship makes props easy.

**Director:**
- `shot.spline: true` gives Catmull-Rom camera travel through all keys, constant speed, eased once over the shot.
- `CTX.composer` and `CTX.style` are exposed.

**Lessons from the POC:**
1. **Place attached objects before the camera reads their frame.** Call the business's `placeShip(t)` from `frameOf(name, w)`. Otherwise the camera lags a frame, and on frame 0 it sits at the default spot.
2. **Probe the rig and deck before staging.** The mast stood exactly where the actors were first placed. Use `probe_expr.mjs`.
3. **Shadows from far-off objects:** use an invisible stand-in (`colorWrite: false`, `castShadow`) placed up-sun of the target deck point. Dimming the key light about 35% as it passes makes "something huge overhead" read.
4. **Head leads body** in turns (anticipation). Throw shock hands **beside** the head, relative to facing, never across the face.

**Known limitations (honest):**
- Head and body show faceted banding.
- Face features are small on the 3D head.
- Warm grading pushes the whole frame orange-brown.
- Wall and deck textures are still softened photos, not painted.
- The claw shadow reads as darkening, not as a claw silhouette.
- The opening 2 s of the POC under-feature the characters.

**Next fixes (≈1 day, $0):**
- Smoother normals and more segments on actor bodies.
- Bigger, bolder face decal.
- A brighter, more separated colour preset.
- Procedural painted stone and plank textures with inked seams.
- A sharper, higher-contrast claw-shaped shadow.
- Better opening framing.

### C.8b Polish pass (2026-11-15, ≈1 day, $0): what changed and what we learned

**New reusable components (EXPERIMENTAL):**
- **`golden` preset** (`painterly.js`): bright, clean daylight-golden look. Blue sky, cool fill (0.85), warm key (3.6), a **low grazing rim** (`rimHeight` 0.12), no orange grade (`ink.warm` 0, `sat` 1.12), crisp cel shadows (`sharpShadows` → `PCFShadowMap`).
- **Painted procedural textures:**
  - `stage.pbr()` now tags each map with its source id (`map.userData.src`).
  - The style swaps photo maps for painted canvases with **inked seams**: stone blocks (`castle_wall`/`rock`), planks (`plank`/`wood`), plaster, sand.
  - Repeat and offset are preserved. Opt out with `"paintTextures": false`.
- **Actor quality:**
  - Spline-resampled lathe bodies (no faceted bands), denser head, helmet and limb geometry.
  - **Face decal 1.16× larger** (`opts.faceScale`).
  - Sleeves start inside the body (no open tube ends).
  - Sleeve colour = body colour (no "disc" at the shoulder); cheek guards off for 3D.
- **Bold expressions:** for phone readability, scale `eye` ×1.2–1.32, `browY` ×1.5, `pupilS` 0.7, mouth `open` 1.0 / `w` 54 for shock.
- **Spline camera fix:** the camera now passes through **every key at its time** (it used to spread keys by curve length, so mid keys were reached far too early). `spline: 'out'` moves from frame 1 and settles at the end.
- **Painted shadow card (PROVEN technique for a story-critical silhouette):**
  - A dark alpha-masked plane lying on the deck (claw: beam, chain links, hub, three hooks), sliding across the surface, combined with a ~20% key-light dip.
  - Reliable and art-directable. **Use it whenever the audience must read a shadow's shape.**

**Lessons:**
1. **A high rim light washes out all ground shadows**: it lights every upward surface from a second direction. Keep rim lights low and grazing.
2. **Shadow-mapping a thin, hanging, off-screen object is fragile** for a story beat: grazing camera angles squash it, and fill light weakens it. Prefer a painted shadow card for must-read silhouettes; keep real shadow maps for contact and ambient shadows.
3. **Debug in two views:** an overhead "god" camera plus a visible-red stand-in (`story.debugClaw`) found in minutes what eye-level frames hid for hours.
4. **The opening must show the story action:** boom up over the subject so the deck action reads, then settle low for emotion.

### C.8c Retained for Episode 2 (owner decision 2026-11-15)

**Kept** as the Episode 2 foundation: the environment, lighting and camera improvements from the POC.
- painterly style, the `golden` / `day` / `sunset` / `night` presets, painted procedural textures;
- low grazing rim light, the painted shadow-card technique;
- spline camera with key times, the overhead debug view.

**Character design: superseded by C.8d, C+ Version 1, approved as the production character system 2026-11-15.** The POC actor (`actor3d.js`) is a technical prototype, not the studio's character design. Character quality is being solved first; see [`CHARACTER_DEVELOPMENT_PROPOSAL.md`](CHARACTER_DEVELOPMENT_PROPOSAL.md).

**Verified 2026-11-15:**
- Blender's Python module (`bpy` 5.3.0, via PyPI) runs headless on CPU here.
- It can build subdivided meshes, armatures with automatic weights and shape keys, and export them as GLB (skin and morph targets confirmed).
- Free character-asset hosts (Quaternius, Kenney) and blender.org are blocked by the current network policy.

### C.8d Rigged 3D character pipeline: Blender build + our renderer (APPROVED 2026-11-15 as C+ Version 1, the production character system)

**C+ VERSION 1 BASELINE (owner-approved 2026-11-15).** This is the studio's production character system: the model, rig, face, runtime and acting helpers listed below, at git commit `4bccd75`, with the acting test `renders/character_test_cplus_1080p.mp4` as the reference.
- The owner judged it a meaningful improvement (more expressive face, more recognisable costume, gestures and reactions inside the 3D world), though not yet at the reference channel's artistic level.
- Keep V1 working. Improve it **inside episode production**, carrying each change forward. Do not start another standalone character-development project unless a serious production blocker emerges.
- Record each episode's character improvements here as V1.1, V1.2 and so on, with what changed and why.

**Carry-forward improvement list (apply during episodes; owner priority order not implied):**
1. Better foot planting and body weight (2-bone leg IK and foot locks; weight shifts over the planted foot).
2. More natural gestures, anticipation and follow-through.
3. Better side-profile facial expressions (a profile eye/mouth treatment beyond the front projection).
4. Clearer character acting (one readable idea per beat; hold golden poses).
5. Stronger cinematic compositions.
6. More distinctive environments and props.

**V1.1 (Episode 2, 2026-11-15, built inside production)**
- **Foot planting:** 2-bone leg IK and foot locks, used as `ch.pose({ feet: { L: [x,y,z], R: [...] }, footPitch })`. Targets are ankle positions in the character's root space, solved after the body pose, so hip and spine motion bends the knees instead of sliding the feet.
- **Gait:** `gait(dist, { stride, lift, run })` gives a procedural walk or run with planted stance feet, hip bob and sway, and arm swing.
- **Costumes:** the build script takes `-- out.glb <costume>`, with `roman` (V1, unchanged), `sailor1628[:capHex]`, `officer1628`, `council1628` and `shipwright1628`. All share the same rig, face shell and proportions.
- **Runtime options:** `loadCPlus(THREE, { url, faceRes, face: { stache }, recolor: { materialName: hex } })`.
- **Lesson:** a vertical 9:16 frame is narrow, only about 0.8 m wide at 2 m with a 40° lens. Foreground characters must stand almost on the lens axis, so probe their screen positions (`probe_expr.mjs` + `Vector3.project`).

The approved **C+ "Cinematic Expressive"** direction is now a real, reusable, rigged 3D character. Blender is used only to **build and rig**; rendering stays in our three.js engine. Cost: $0 cash, 0 credits.

**Files (all reusable):**
| File | What it is |
|---|---|
| `studio/engine/blender/build_cplus_sailor.py` | Builds the Roman sailor from the C+ proportions in headless `bpy`, rigs it and exports `cplus_sailor.glb` (≈0.55 MB). Re-run after any design change (≈2 s). |
| `studio/engine/web/characters/cplus_sailor.glb` | The model: 20-bone skeleton (hips, spine, chest, neck, head, crest; upperarm/forearm/hand L/R; thigh/shin/foot L/R; cape1, cape2), skinned arms, legs, torso and cape; rigid helmet, costume and hands bone-parented; separate relaxed + pointing right hand; `FaceShell` with a planar front UV. |
| `studio/engine/web/cplus_face.js` | The C+ face as live drawing: heavy-lid eyes, pupils with catch-lights, thick tapered brows, cheeks, 8 mouths (smile, flat, frown, grin, O, grimace, shout, smirk). 10 numeric expressions (`neutral relaxed curious happy surprised scared concern angry suspicious squint`) that blend (`blendExp`), plus live `blink` and `gaze`. |
| `studio/engine/web/character_cplus.js` | Runtime: `loadCPlus(THREE)`, `ch.pose({bones, offset, squash, face, blink, gaze, hand})`, `ch.update(camera, outlinePx)`. Acting helpers: `channel()` (eased pose-to-pose keys), `springBank()` (deterministic springs + secondary follow-through), `blinkAt()`. |
| `studio/stories/char-test/` | The acting test (`story.json` shots, `business.js` staging, `performance.js` the acting). Template for future performances. |
| `studio/stories/char-turn/` | Turnaround / pose check (frames 0–4 = 0°, 45°, 90°, 180°, −45°). |

**Workflow (VERIFIED):**
1. Edit and run the build: `<bpyenv>/bin/python studio/engine/blender/build_cplus_sailor.py -- studio/engine/web/characters/cplus_sailor.glb`. `bpy` lives in a scratchpad venv (`pip install bpy`, ≈1.1 GB; reinstall in a new session).
2. Check the turnaround: `SCALE=0.5 node render.mjs char-turn <dir> 0-4`. Read the frames before anything else.
3. Animate in a story `performance.js`: per-channel keys `[t, [x,y,z], dur, ease]` → spring bank → `ch.pose()`. Render low-res keyframes (`SCALE=0.33`, chosen frames) before full renders.
4. Full render in batches of ≤66 frames into a **fresh** directory, then encode (E.2).

**Pose conventions:** bone rotations are deltas in the character's own axes, applied in the rest frame and inherited down the chain.
- x is pitch: + leans forward or nods down; on an arm, − raises it forward and up.
- y is yaw: + turns to the character's left.
- z is roll: + tilts the head toward his right shoulder; + raises the LEFT arm sideways, − the RIGHT.
- The character faces +Z with +X on his left. `frameOf('char')` in the test gives character-local camera keys, so shots ride the ship's roll.

**Acting technique (VERIFIED in the test):**
- Eased pose-to-pose targets fed through springs with different stiffness per body part give natural lag, overshoot and settle: head ≈3.4 Hz, chest ≈2.3, hips ≈1.8, arms ≈2.6 with damping 0.5 for overshoot.
- Staggering the keys (eyes → head → chest → hips) creates the "head first, then shoulders, then body" turn.
- Secondary springs (crest drags behind the head, cape behind the chest) give follow-through for free.
- The springs are integrated from t = 0 with a fixed step, so every frame is identical in any batch or order.
- Anticipation = a small opposite move before the main one (dip before the head turn; crouch + squint + squash before the surprise take; arm pull-back before the point).
- Blinks on head turns and after big beats; saccade gaze changes (≈0.06 s) lead head turns.

**Look integration:**
- The painterly style converts the GLB's flat materials to toon automatically. Base colours are toned ×0.7 at load (`tone` option) because the key light is calibrated for textured sets; untoned steel rendered pure white.
- Bold outlines: inverted hulls (skinned hulls bound to the same skeleton) at a **screen-constant width** (`outlinePx`, ≈4.6–6 px at 1080×1920), plus the existing ink pass.
- The face texture is a transparent, toon-lit canvas over the skin, so head shading and shadows fall across the face.
- Real cast shadows on the deck come from the key light.

**Design decisions taken in 3D (refinements, not a redesign):**
- Helmet raised 0.115 m above the head centre and eyes/brows lowered on the face. In 3D the brim hid the brows; brow height is clamped to stay under the brim, so surprise reads mainly through the eyes and mouth.
- The 3D nose replaces the drawn nose.
- **Hands:** rounded chunky 4-finger mittens with thumb (fixes the blocky concept hands). There is a separate pointing hand with the thumb up and out so the point reads unambiguously.
- **Side profile:** real head volume with a cheek bulge, a forward chin and a 3D nose. The face is front-projected and reads to about 60–70° of head turn.
- The hair tuft was dropped: at the temple it read as a bruise or black eye.
- The crest is a rounded brush, so it reads from the front too.
- Pteruges are long leather strips.
- A cape strap with brooch shows the one-shoulder cape from the front.

**Limitations (honest):**
- **Face projection:** a planar front projection, so features stretch near full profile. No dedicated profile face yet.
- **Feet:** no IK foot planting. Body turns rotate the legs from the hips; a small step lift hides it at 0.3 rad, but large turns or walks need foot IK (not built).
- **Expressions and mouths:** brow raise is limited by the helmet brim. Mouth shapes switch at the blend midpoint, with a size dip that hides the pop. No lip-sync visemes for this face yet.
- **Rigid joints:** shoulder plates, cheek guards, skirt and pteruges are rigid (no cloth). Elbows and knees are 2-bone blends, so extreme bends pinch a little.
- **One-off design:** one costume, built by script. A second character means a new build script or parameters (the inventor variation is not built yet).
- **Render speed:** ≈3 s/frame at 1080×1920 on CPU.

**Lessons:**
1. Check the turnaround after every model change before any animation; it caught the hidden brows, the bruise-like tuft and the blown-out colours in minutes.
2. A 2D concept detail doesn't always survive 3D; judge it in the 3D render.
3. Never reuse a scratch render directory. A stale folder mixed in old frames, so always render into a fresh directory.

### C.8 Consistency (ASPIRATIONAL improvements, not yet built)
- Toon or outline post-pass to unify flat cards and 3D surfaces.
- Shadows cast from card silhouettes.
- Stylised replacements for placeholder city geometry.
- These are the top candidates for the next visual upgrade, to be evaluated only with a small test and owner approval.

---

## D. Audio production manual

### D.1 Narration (PROVEN)
**Correction recorded 2026-11-15.** The established narrator voice is **ElevenLabs "Eleven v4", called through the Higgsfield MCP** (`generate_audio`, model `elevenlabs_v4`, preset voice "Grady", id `e2a2d2e6-9ed2-59cd-82af-feaa27f8a678`). There is **no Fish Audio integration in this repository**. If the owner adds one, document it here first.

**Verified again 2026-11-15 (Episode 2 prep)** against three records:
1. The Episode 1 generation call in the session transcript: `model: elevenlabs_v4`, `dialogue: [{text, voice_type: "preset", voice_id: "e2a2d2e6-9ed2-59cd-82af-feaa27f8a678"}, …]` (16 lines), `use_unlim: false`, no other voice settings.
2. The Higgsfield transaction log: "Eleven v4", −2.76 credits, 2026-11-15 02:32 UTC.
3. The file `stories/claw-v2/audio/narration_raw.mp3`: written at 02:32, mono 44.1 kHz, 46.0 s.

The owner wants this **exact voice** preserved, so it is the studio narrator. To reproduce it, use the same model and voice ID with the same `dialogue` line-per-phrase format and no extra settings. Any "Fish Audio" reference means this voice.

**Cost:**
- About 4.6 credits for ~80 s of narration (Claw v1).
- The quote for the Claw v2 script was 2.76 credits.
- Always quote first with `get_cost: true`, and get the owner's approval before spending.

**Workflow:**
1. Quote the cost with `get_cost: true`.
2. Generate the lines with that voice.
3. Download the result into `stories/<slug>/audio/`.
4. Time it with `tools/align.py` (word timings) and `tools/envelope.py` (lip-sync loudness).
5. Place the lines on the picture slots (per-episode script).

**Rules:**
- Cut words before speeding up; at most ±8% tempo.
- Never speed up a character's dialogue.
- A second voice for a character line in Claw v1 was preset "Benji" (`e6f9b893-51b1-51d3-afe9-9e0482cb7ac1`).

### D.2 Music (PROVEN)
- Original scores from ElevenLabs Music v2.5 via Higgsfield (Claw: 9.02 credits for 80 s). Reuse paid scores whenever possible.
- Time the score so its peak lands on the payoff impact (offset with `ffmpeg -ss`).
- Use silence before the release.
- Free music libraries (YouTube Audio Library, Pixabay): EXPERIMENTAL. Check each track's licence and Content ID risk before use.

### D.3 Sound effects (PROVEN, free)
`tools/sfxlib.py cues.json out.wav "sea,wind"` synthesises:
- impacts and mechanics: step, scrape, whoosh, plop, sizzle, bubble, clunk, roll, scuff, thud, chisel, tick, bell, clank, chain, snap;
- timber and water: creak (f, dur), groan, pour (end, peak), drip;
- ambience beds: sea, wind, room, masons.

Cue sheets are in video time; build them per episode (Claw v2: `build_scratch_audio.py`).

### D.4 Mixing (PROVEN)
`tools/mix.sh <build_dir> <voice.wav> <voice_offset> <music> <music_LUFS> <duration>`.
- Voice, plus music ducked under the voice, plus SFX ducked under the voice.
- Normalised to −14 LUFS, limiter at −1.5 dBFS sample peak.
- Expects `<build_dir>/sfx.wav`.
- Music around −21 LUFS before ducking.

### D.5 Audio QA
- `ffmpeg -af ebur128=peak=true`: target I ≈ −14 LUFS, true peak ≤ −1 dBTP.
- `astats`: no clipped samples.
- Listen for voice overlaps (Claw v1 had the narrator and a character talking over each other). Check the voice-track energy around every character line.

---

## E. Subtitles and delivery

### E.1 Captions (standard from Claw v2)
- **Format:** ASS rendered by libass in ffmpeg (`-vf ass=captions.ass`).
- **Typography:** DejaVu Sans Bold, white with a dark outline (≈5 px at 1080 wide) and a soft shadow.
- **Chunks:** 1–3 words at a time, timed to word timings. Key words highlighted in the accent colour (amber `&H0040D8FF`).
- **Timing (PROVEN in Claw v2 `build_final.py`):**
  - Spread words only over **voiced** time; skip pauses inside a line.
  - When a line's punctuation phrases match its voiced segments one for one, pin each phrase to its segment.
  - Keep "—" and tiny final words attached to their phrase.
  - Never let chunks overlap (they stack).
  - QA scan: no caption shown while the voice track is silent (< −37 dB).
- **Position:**
  - centred horizontally;
  - caption block about **35–40% of frame height above the bottom edge**, i.e. bottom-aligned with `MarginV` ≈ 700 at 1920 tall;
  - adjust per shot when it would cover a face or key action.
- **Safe area for Shorts and Reels:**
  - keep text out of the bottom ~25% (buttons, description) and the right ~120 px (action buttons);
  - keep it out of the top ~10%.
- **Labels:** short notes at the top, e.g. "RECONSTRUCTION · exact design unknown" or "DRAMATIZATION · …".
  - Style: 40 px, upright (italic 30 px proved too small for phones), soft dark box (`BorderStyle 3`, 60% alpha), `MarginV` ≈ 215 so it sits below the platform's top bar.
  - Show it only while the reconstructed object is on screen.

### E.2 Export (PROVEN)
- **Production master:** `ffmpeg -framerate 30 -i frames/f%04d.jpg -i mix.wav -vf "ass=captions.ass,scale=1080:1920,setsar=1" -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest`. About 240 MB for 80 s; kept outside git.
- **Delivery copy (< 50 MB for git and upload):** `-crf 22 -maxrate 4.8M -bufsize 9.6M`, audio copied. SSIM against the master should be ≥ 0.95.
- **Upload master (PROVEN, preferred for platforms):** from the master, `-c:v libx264 -preset slow -crf 17 -maxrate 8.2M -bufsize 16M -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart`. About 8.5 Mb/s; for about 46 s it stays under 50 MB (git-safe). SSIM ≈ 0.97. For episodes over about 48 s, lower `-maxrate` proportionally to stay under 50 MB.
- **Verified for Claw v2 final:** 1080×1920, 9:16, H.264 yuv420p, 30/1 fps, AAC 48 kHz stereo; delivery copy about 29 MB; SSIM 0.967.
- **Discrepancy found in QA (2026-11-15):**
  - The owner saw **512×910** on a delivered MP4.
  - ffprobe of every copy (delivery, master, committed file, source frames) reported 1080×1920.
  - The Claude app **re-encodes attachments to a smaller preview**; the same thing happened with an earlier episode.
  - **Rule:** in every delivery note, include the raw ffprobe output and the repository path of the original file (branch + `renders/<file>.mp4`), and state that the in-app preview may be downscaled.
  - Never upscale a lower-resolution render and call it 1080p: confirm the source frames are 1080×1920 with `identify frames/f0000.jpg`.

### E.3 Video QA (every delivery)
- `ffprobe`: 1080×1920, 30/1 fps, expected frame count, AAC 48 kHz stereo.
- `blackdetect=d=0.1:pix_th=0.08` and `freezedetect=n=0.002:d=0.5`: no hits except intended ones.
- Contact sheet (1 frame per 1–3 s), a **muted** viewing, and a lip-sync strip for any spoken character.
- Never call a video publishable just because it exported.

---

## F. Technical infrastructure

### F.1 Layout
```
STUDIO_PRODUCTION_BIBLE.md   this file
CLAUDE.md                    mandatory instructions for every session
renders/                     delivered videos and review sheets (< 50 MB each)
studio/
  content/                   production_backlog.md (generated) + backlog.json (source of truth) + render_backlog_md.py
  episodes/                  one production record per episode (EPxx_slug.md)
  engine/
    web/                     director.js, stage.js (renderer, ?scale=), chargen.js, acting.js, toon.js, lipsync.js,
                             sets/, props/, fx/, assets/ (fetched, git-ignored), lib/ (three.js, git-ignored)
    tools/                   render.mjs, probe.mjs, probe_expr.mjs, make_video.py, mix.sh, sfxlib.py,
                             align.py, envelope.py, qa.py, fetch_assets.py, setup.sh
  stories/<slug>/            story.json, build_story.py / build_*.py, business.js, audio/, captions, build/ (git-ignored)
  ep01/, soldier_v2/, chargen/   earlier prototypes (DEPRECATED as pipelines; kept for reference)
.claude/commands/make-video.md   /make-video command
```

### F.2 Commands (PROVEN)
- **Fresh session setup:** `bash studio/engine/tools/setup.sh` (three.js r160, Playwright, numpy and pillow, CC0 assets). Free. Chromium is preinstalled in cloud sessions.
- **Render frames:** `cd studio/engine/tools && node render.mjs <slug> <outdir> <a-b|list>`.
  - `RESUME=1` skips existing frames.
  - `SCALE=0.33` renders a low-res animatic.
  - Run three jobs in parallel on separate ranges.
- **Probe positions:**
  - `node probe.mjs <slug> <frame> <actor> <hero|flag> ["x,y,z"]`;
  - `node probe_expr.mjs <slug> <frame> "<expr using C, wp(obj)>"`.
- **Sound effects:** `python3 studio/engine/tools/sfxlib.py cues.json sfx.wav "sea,wind"`.
- **Mix:** `bash studio/engine/tools/mix.sh build voice.wav 0 music.wav -21 <dur>`.
- **One-shot pipeline (older stories):** `python3 studio/engine/tools/make_video.py <slug>`.
- **Backlog markdown:** `python3 studio/content/render_backlog_md.py`.

### F.3 Dependencies
- three.js r160 (MIT) and Playwright with preinstalled Chromium.
- ffmpeg/ffprobe with libass, Python 3 with numpy and pillow.
- No GPU. All free except Higgsfield credits.

### F.4 Known limitations
- Cards always face the camera.
- SwiftShader is slow, with no global illumination or volumetrics.
- Silent black-frame failures (C.7).
- The harness refuses `rm` on variable paths (use fresh directories).
- Long background waits time out after 2 h; re-arm them.

### F.5 Reusable asset inventory (as of 2026-11-15)
- **Syracuse world:**
  - city wall, a city of whitewashed houses with terracotta roofs, a temple;
  - Etna, ocean and mist, sunrise HDR skies;
  - the claw machine (beam, chain, iron hand, winch);
  - a hero warship, a flagship, a 7-ship fleet plus up to N extra distant ships;
  - debris, splashes, drainage streams, sand tray, rope gag.
- **Cast:**
  - Archimedes (elder, robe);
  - Roman soldiers and crew, period extras;
  - Marcellus (commander).
- **Stockholm 1628 (Episode 2):** `sets/stockholm.js` (harbour, shores, town, castle tower, quay, instanced crowds, inquiry room, seabed) and the **Vasa** galleon (`blender/build_vasa.py` → `props/models/vasa.glb`, runtime `props/vasa.js`). The ship has hinged gunport lids, cannons that run out, heel/pitch/sink controls, a 1961 wreck look and a painted stern.
- **C+ 1628 costumes:** sailor (3 cap colours), officer, councillor, shipwright.
- **Also available:** workshop and Roman-harbour sets, 45 CC0 props, and two owned music scores (Claw 80 s; ep01 31 s).

---

## G. Budget and cost controls
- **Cash:** about **$10–20 per month**. No new paid tools or services without approval.
- **Credits:** Higgsfield credits are a conserved resource.
  - Quote every generation with `get_cost: true`.
  - Get owner approval before any spend.
  - Record the actual spend from `transactions` in the episode record.
- **Reference prices (quoted 2026-11-14/15):**
  - narration ≈ 2.8–4.6 credits per episode;
  - an 80 s score ≈ 9 credits;
  - a keyframe image 0.25;
  - AI video (Kling 3.0 Pro) 7.5 credits per 5 s, so not used per scene.
- **Reuse first:** sets, cast, props, scores and SFX.

---

## H. Production workflow and approval gates

| # | Stage | Inputs → outputs | Accept when | Approval |
|---|---|---|---|---|
| 1 | Topic | backlog → chosen topic + spine | passes B.3, has a showable WOW | owner |
| 2 | Research | sources → `research.md` (documented / reconstruction / dramatization) | key claims sourced | — |
| 3 | Script | → narration with timing estimates | Gates A–E (B.11), 150–165 wpm | **owner** |
| 4 | Storyboard | → shot list (see, hear, understand, feel, why) in `build_story.py` | every shot has one purpose | **owner** |
| 5 | Animatic | `build_story.py 15`, `SCALE=0.33`, scratch audio + text VO | **muted first-time-viewer test** passes | **owner** |
| 6 | Narration | cost quote → voice lines → align / envelope | in sync, no overlaps | **owner approves credits** |
| 7 | Final render | `build_story.py 30`, three jobs | no missing or black frames | — |
| 8 | Mix | voice + music + SFX | −14 LUFS, ≤ −1 dBTP, voice clear | — |
| 9 | Subtitles | ASS per E.1 | safe area, readable, synced | — |
| 10 | QA | E.3 + section I checklists | no release blockers | — |
| 11 | Delivery | master (local) + < 50 MB copy in `renders/` | — | **owner approves publication** |
| 12 | Record | episode record + Bible updates | lessons logged | — |

**Permanent workflow (owner directive 2026-11-15)**
Topic research → script approval → storyboard → animatic → review → narration → final animation → render → sound design → captions → QA → publishing package → owner approval → publication (by the owner) → performance review.

**Mandatory release gate.** An episode may be marked **Ready for Publication** only when all of these hold:
1. The final upload-ready video is complete.
2. Technical and creative QA have passed (section I, plus the episode's own checklist).
3. A thumbnail (1280×720) and a vertical cover (1080×1920) are prepared.
4. Three title options and a recommended title are written.
5. The final description is written.
6. **Exactly five** hashtags are chosen.
7. YouTube tags are prepared (under 500 characters).
8. The package is stored in `studio/final_videos/EPxx_Name/`.
9. The owner has reviewed the deliverables.

Only after the owner's explicit approval does the status become **Approved for Publication**. Claude never publishes.

**Status ladder** (`FINAL_VIDEO_INDEX.md`, `backlog.json`): In Production → QA → Ready for Publication → Approved for Publication → Published (with URL) → Reviewed (metrics recorded).

**Stop and reconsider** when:
- a story fails Gate B twice;
- a fix needs a new engine or paid service;
- an animatic still fails the muted test after one fix pass.

Report honestly; don't polish a failing concept.

---

## K. Delivery, archive and publishing packages (PERMANENT, owner directive 2026-11-15)

**K.1 Final video archive: `studio/final_videos/`, the one place to find everything needed to publish.**
```
studio/final_videos/
├── FINAL_VIDEO_INDEX.md            (episode, title, status, file, size, resolution, duration, QA, URL)
├── EP01_Claw_of_Syracuse/   EP01_Claw_of_Syracuse_UPLOAD.mp4, thumbnail_1280x720.png, cover_1080x1920.png,
│                             YOUTUBE_PUBLISHING_PACKAGE.md, metadata.md
└── EP02_Vasa/               (same set)
```
- Only **approved, upload-ready** videos go here. Animatics, tests and intermediates stay in `renders/` or the scratchpad.
- Never modify or delete the original render; the archive holds a **copy**, checked with `cmp` and a full ffmpeg decode.
- `*.mp4` in `final_videos/` is **gitignored**; videos are never auto-committed.
- **The cloud session's disk is temporary.** Its local files are lost when the container is reclaimed. Durable copies are:
  - the owner's own download of each upload file;
  - a free cloud folder such as Google Drive's free tier (the recommended no-cost backup);
  - with the owner's approval, a ≤ 50 MB copy committed under `renders/`.
- Never let the scratchpad hold the only copy of a finished video.

**K.2 Publishing package (`YOUTUBE_PUBLISHING_PACKAGE.md`), mandatory per episode**
1. Episode number and title.
2. Three titles and the recommended one, with a reason.
3. A copy-paste description: a strong first line, the story without the full payoff, natural keywords, a subscribe line, source links.
4. **Exactly five** hashtags.
5. Comma-separated tags (under 500 characters).
6. The thumbnail and cover filenames.
7. The recommended Shorts cover frame or timestamp.
8. Sources.
9. Category (Education).
10. Status.
11. URL.

`metadata.md` records the technical specs, SHA prefix, narrator, music, credits, QA results and approval status.

**K.3 Thumbnails and covers (studio identity)**
- **Tool:** `engine/tools/make_thumb.py <spec.json>`. Specs live in `studio/design/thumbs/`.
- **Clean frames only:** render caption-free frames from the story. For 16:9 art, render natively in landscape: `LANDSCAPE=1 node render.mjs <slug> <dir> <frame>` (1920×1080, same cameras, wider view).
- **Identity:**
  - one strong story image, full bleed;
  - an optional character inset with a diagonal yellow edge;
  - 2–4 words in Inter Display Black, white with a heavy dark outline;
  - **one** signature-yellow phrase over a yellow accent bar;
  - a warm contrast grade and vignette.
  - Text goes over empty sky or sea, never over the subject or a face.
- **Keep it truthful:** no misleading claims, no copying another creator's look.
- **Same system, different image:** keep the type, colour and layout, but give every episode its own story image.
- **Shorts thumbnails (checked November 2026):**
  - Desktop YouTube Studio lets most creators set a custom Short thumbnail.
  - Mobile support is inconsistent, so always name a **frame timestamp** to select during upload as the fallback.
  - Never promise that a custom image will appear on a Short.

**K.4 Performance review (after publication).** Record in the episode record and the index:
- views at 48 h, 7 days and 28 days;
- viewed vs swiped away;
- retention curve and average view duration;
- likes, comments, shares and subscribers gained;
- one or two lessons.

Do not call an episode a failure from early views alone.

---

## I. Quality assurance checklists

**Creative:**
- Do the first 1–2 s stop the scroll, and does the first frame read on mute?
- Is who, what and why clear by about 10 s?
- Does curiosity continue throughout, with no dead shots?
- Are the threat, the trap or mystery, and the payoff visually clear?
- Is the WOW moment replayable?
- Is any callback obvious?
- Is the ending the strongest beat?
- Are claims accurate and labels in place?

**Visual:**
- Are faces readable where emotion matters?
- Are eyelines clear (POV and reverse shots)?
- No floating or sliding actors?
- No placeholder geometry in frame?
- No washed-out or backlit faces?
- Is scale clear, with consistent exposure and colour?
- No geometry breaks?

**Audio:**
- Is the narration intelligible on a phone speaker?
- No overlaps?
- Does the music support the voice, never bury it?
- Are SFX synced to actions?
- Silence used deliberately?
- −14 LUFS, no clipping?

**Technical:**
- 1080×1920, 30 fps, expected frame count?
- No black or frozen frames?
- Captions inside the safe area and synced?
- Delivery copy under 50 MB, SSIM ≥ 0.95?

**Publication readiness:**
- Owner has reviewed the final.
- Title, description and sources prepared.
- Status updated in the backlog and the episode record.

---

## J. Continuous improvement

**Standing creative improvements (Episode 3 onward; owner directive 2026-11-15).** Each episode must improve at least one of these, inside production, never as a separate tech project:
1. **Stronger hooks.** The first 1–2 s are visually irresistible: striking action, danger, curiosity or an unexpected image that stops the scroll.
2. **Clearer visual storytelling.** For complicated actions, choose the angle that makes cause and effect unmistakable (Vasa: the open ports dipping under, shown from outside). Avoid cluttered wides that hide the main event (Vasa's running wide fought sails and rigging).
3. **More cinematic action.** Purposeful camera movement, strong compositions, readable scale, visual progression.
4. **Better emotional storytelling.** Expressions, body language, reactions, anticipation, timing, follow-through.
5. **Stronger endings.** Give reveals and payoffs enough screen time and dramatic framing.

**Production efficiency (Claude usage is a limited resource).**
- Reuse tools and assets.
- Run deterministic renders in background batches.
- Verify with low-res keyframes before any full render; never repeat a full-resolution render for optional tweaks.
- Keep documents concise.
- Do not open research or redesign cycles that aren't needed to finish the episode.

**Operating principle:** FINISH → REVIEW → PUBLISH → MEASURE → IMPROVE → REPEAT.

**VISUAL STANDARD v2: owner-approved direction (2026-11-15).** Analysis: `VISUAL_QUALITY_REASSESSMENT.md`.

*A. APPROVED DESIGN PRINCIPLES* (permanent; they apply to every genre: science, futures, religion, human behaviour, history). Warm light and lanterns are **not** mandatory.
1. Simple, appealing, expressive characters.
2. Rich, carefully designed environments.
3. Cohesive stylised materials and textures.
4. Cinematic lighting appropriate to each story.
5. Clear foreground, mid-ground and background separation.
6. One obvious focal point per shot.
7. Strong acting with readable poses.
8. Purposeful camera direction.
9. Clear cause-and-effect animation.
10. Distinctive but restrained cartoon effects.

Keep an original identity; never copy the reference.

*B. IMPLEMENTED AND TESTED: Gate 1 benchmark stills only* (`stories/ep03-bench`, `renders/ep03_benchmark_A/B/C.jpg`). Verified only on stills; **not yet production-ready** until the Gate 2 motion test passes.
- **Lighting and atmosphere:**
  - `interior_evening` preset (cool moonlight key, warm hemisphere);
  - practical pendant and phone point lights with glow halos;
  - GTAO ambient occlusion (`style.ao`).
  - **Lesson:** glow sprites must be hidden during the AO pass, or they render as dark quads (fixed in `painterly.js`).
- **Painted-look texture kit** `style/painted.js`: wood floor, wallpaper, panels, velvet, linen, night city, paintings, glow sprite. Mark textures with `userData.painted` so the style converter doesn't blur them.
- **Set** `sets/restaurant.js`: a dressed bistro. Furniture is scaled to C+ proportions (seat 0.38 m, table 0.62 m), and tables take chair angles.
  - **Lesson:** a vertical frame cannot hold two people sitting opposite each other; seat couples at adjacent angles (about 70°) so both faces read.
- **C+ look v2** (`loadCPlus({ look: 'v2' })`): two-tone cel shading plus a soft fresnel rim; head and face never self-shadow; skin tone 0.85.
- **Modern costumes** `modern_m` and `modern_f`: slimmer limbs, lumpy hair volume with fringe tufts (the first version read as a beret).
- **Landscape thumbnail renders** (`LANDSCAPE=1`), already used in production.
- **Render cost:** 4.9 s/frame at 1080×1920 for the benchmark (AO plus 8–10 lights), against about 2–2.5 s for the Vasa scenes. That's roughly a 2× regression, acceptable for a 60 s Short (about 2.5 h CPU).

*B2. IMPLEMENTED, TESTED IN MOTION AND **OWNER-APPROVED FOR EPISODE 3** (Gate 2, 2026-11-15):* `stories/ep03-motion`, `renders/ep03_gate2_motion_test.mp4` (9 s). Do not rebuild the rig or the pipeline; improve inside production.
- **C+ v2 character cleanup** (same rig; Roman and 1628 costumes untouched):
  - face `style: 'v2'`: eyes about 20% smaller, thinner lid lines, solid tapered brows without outline, slimmer mouth;
  - sculpted hair: a smooth shell with a curved hairline, a swept quiff (men), long hair with face-framing curtains (women), replacing the lumpy tufts;
  - slimmer limbs;
  - mitten hands (palm + mitten + thumb; pointing variant) instead of finger tubes;
  - the transparent face layer is hidden from AO, which removed a seam across the face.
- **Snap-and-hold acting:** `snap(t, t0, d)` uses an ease-out-back (overshoot) over 3–5 frames, then holds. Applied to:
  - eyes first, then head, on the glance;
  - anticipation then shock on the take, with squash and stretch;
  - head-snap then eye-narrow on the suspicion;
  - a staggered wave of diners' reactions.
  - Secondary motion: phone vibration, a tremble during the shock hold, a gulp, breathing.
- **Cartoon symbols as overlays** (depthTest off, so hair never hides them): shock lines and a sliding sweat drop.
- **Sound, free:** `sfxlib.py` gained `buzz`, `ding(f, pan)` and a `cafe` murmur ambience.
- **Staging lesson:** a phone screen meant to be read needs a dedicated insert shot with the phone light reduced, or it blows out.
- **Coding lesson (three times now):** run `node --check` after every scripted JS edit.
- **Render cost:** 3.6–4.0 s/frame at 1080×1920 (270 frames in 17.4 min including loads), against about 2.3 s for Vasa scenes: roughly 1.7× slower. That's acceptable (about 4 h CPU for a 60 s Short).

**Gate 2 lessons (owner review), fixed inside Episode 3 production:**
- **Endings need faces, not tiny figures.** Show "it's happening to everyone" with low angles among the tables and quick reaction close-ups, not a distant wide shot.
- **Readable phone screens:** front-facing, a dark surround, phone light reduced in the insert, held at least 1.3 s.
- **Material finish:**
  - a lower rim (about 0.22);
  - subtle painted skin, hair and fabric textures to break the plastic gradient;
  - smaller, softer noses on modern builds.
- **Composition:**
  - the principal subject is at least 40% of frame height in medium shots;
  - no more than about 20% empty floor, ceiling or wall;
  - backgrounds support the story and don't compete with it.

*B3. Episode 3 animatic (2026-11-16): implemented and checked in the 0.33-scale animatic only. Not yet verified at full resolution or approved by the owner.*
- **Material finish (Gate 2 note C), applied:** `rimK 0.22`, `paintK 0.06` (painted world-position value noise in the v2 toon shader) and modern noses at 74% size.
  - The hair strand-gradient texture has **not** been built; it stays planned.
- **Close-up fill:** a soft warm point light near the camera, only in close and medium character shots (`S.fill` in `stories/ep03/business.js`). Pendant lamps alone leave cel-shaded faces too dark for reaction shots.
- **Search bubbles:** a reusable UI-card sprite with a pop. In a two-shot, pull bubbles 30% toward the pair's midpoint so they stay inside a 9:16 frame. Over a wide room, show them at about 1.9× size.
- **Phone insert camera:** a vertical phone placed in the table frame, facing the insert camera. One rig covers the alert, the sharing cards, typing then deleting, and the empty search bar with a blinking cursor.
- **Showing the whole room in 9:16:** the restaurant's diners are spread ±4.5 m apart. One static wide cannot hold them, so "it's happening to everyone" uses a slow pan across the room.
- **Lessons:**
  - **Check render logs for `Shader Error` after any shader edit.** A broken `onBeforeCompile` (a varying declared in the wrong string) does not crash. It renders every character black, and this was caught only by comparing against the Gate 2 frames. `grep -ci "shader error"` on the render output must return 0.
  - Close-up cameras on C+ v2 heads need about 1.4 m distance at fov 38. At 0.85 m the face overfills the frame.

**Approved Episode 3 story decisions (owner, 2026-11-16):**
- Keep the 9:41 opening, the two dating-search jokes, the turn to serious consequences, and the final ethical dilemma.
- Show the consequences with empathy: people stop seeking help when they need it most.
- No real research is spoken in the narration. Penney (2016) is cited only in the source notes and the YouTube description, and the episode must not imply the study shows the embarrassment fades.
- End on an empty search bar with a blinking cursor: "If every search became public… would you still dare to ask?"
- Audio after animatic approval only: prefer a 50 s score if the cut fits, otherwise 55 s.

*C. PLANNED / EXPERIMENTAL (not started)*:
- shot-language toolkit (camera presets, whip-pan transitions, still-frame composition overlay);
- stylised FX library;
- C+ acting pose library with snap-and-hold timing;
- cleaner character design pass (smaller face features, simpler hair silhouettes);
- higher texture detail density.

**Coding lesson (twice in one session):** never append a `//` comment in the middle of a one-line statement during scripted edits; it swallows the rest of the line.

**Lessons learned (PROVEN):**
1. Story before technology. Claw v1 was technically complete and creatively failed.
2. Approve the script, then the storyboard, then an animatic before any expensive step. The animatic caught a dozen staging problems at about 1/10 of the cost.
3. Evaluate muted, as a stranger. Narration must not rescue unclear visuals.
4. Place cameras from probed data, not guesses.
5. Make eyelines with a POV shot plus a reverse close-up (the cards can't turn).
6. Callbacks work best when they reuse the original composition (the rope shot mirrors the claw shot).
7. Check every render for black frames.
8. Check for voice overlaps around every character line.
9. Late-day or sun-facing shots need an exposure override.

**Failed or deprecated:**
- Long single-take tour shots of the world.
- Explanation shots mid-climax.
- Character dialogue that the narrator talks over.
- Epilogue gags (the v1 fishing rod).
- Mist planes near the camera (whiteout).
- `ep01/` and `soldier_v2/` one-off pipelines (superseded by `engine/`).

**Experimental:**
- `ropeGag`, `workerRun`, `extraFleet`, `exposure` and the haze options (first used in Claw v2).
- Free music libraries.

**Future research (ASPIRATIONAL; needs approval and a small test first). See `REFERENCE_3D_CINEMATIC_ANALYSIS.md` §5–§9 for the prioritised plan:**
- Toon or outline unification pass.
- Card silhouette shadows.
- Stylised city replacements.
- Selective AI video for one hero shot per episode, if the budget allows.

**Efficiency:** per-episode `build_story.py`; reuse of business code across stories; low-res animatics.

**Episode 1 retrospective (2026-11-15):**
- **Process:** story-first gates fixed the core problem (v1 → v2).
- **Biggest time sinks:**
  - re-timing after narration (record the voice earlier);
  - guessed camera angles (probe them);
  - render failures (batch the renders).
- **Next phase (ASPIRATIONAL, owner priority after audience data):** substantially better 3D environments, lighting, cinematography and animation. Approach it through small validated tests per episode, never a pipeline rebuild without approval.
