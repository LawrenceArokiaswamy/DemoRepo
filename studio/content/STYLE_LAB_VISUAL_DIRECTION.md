# Style Lab: visual-direction experiment (2026-11-17, time-boxed)

**Scope:**
- **Zero Higgsfield credits.** Plate A is reused; it was already paid for in the earlier test.
- No paid tools and no installs.
- No production file, rig or episode modified. Episode 3's final cut is untouched.

**Where the experiment lives:**
| What | Files |
|---|---|
| Shared character design | `stories/style_lab/face.js` |
| Style B | `stories/style_lab/b_stick.html` (canvas page) and `render_canvas.mjs` |
| Style C | `stories/style_lab/business_c.js` with the story in `stories/style_lab_c/` |
| Stills and sheets | `design/style_lab/` |
| Videos | `renders/style_lab_*.mp4` |

**One prototype round** per style, plus one fix pass each. Nothing further was built without approval.

## 0. The owner's reference recording (quality principles only)
**What it is:**
- A 5.3 s screen recording of the promo for the "made in 1 Claude chat" Higgsfield workflow ("MADE IN 1 CHAT").
- AI-generated illustrated shots with a little generated motion, **hard-cut every 0.5–0.8 s** (cuts measured at 0.08, 0.54, 1.01, 1.68, 2.48 … s).
- Characters: simple round heads with caricatured faces, stick-like bodies dressed in costume (hats, aprons, a moustache), fully illustrated warm backgrounds.

**Principles taken (no characters or artwork copied):**
1. Faces are big: the head fills about 40–45% of the frame width.
2. Character and background share **one** rendering language (line, shading, light).
3. Costume and props carry role and era; the body stays simple.
4. Caricatured acting: heavy brows, sweat drops.

**Key fact for the economics:** the reference's richness comes from generating a new illustration **per shot**. It is not character animation, and it cannot be reproduced with zero credits.

## 1. What was built
**Shared beat, framing and lighting intent:**
- AD01 beat 1, 5 s.
- Insert of the message "Don't open the door at 3:17.", then the face shot.
- Reading → frown → eyes widen → looks toward the door.
- Moonlight from behind, the phone underlighting his face, a warm door leak; Plate A as the back wall.

| | A: current | B: 2D stick figure | C: 2.5D hybrid |
|---|---|---|---|
| Character | C+ v2 rig (existing Theo) | **New original Theo design** (shared with C): egg head, signature ink-curl of hair, big lidded eyes, thick brows; ink tube limbs, a cel-shaded hoodie torso | The same new design as dimensional toon shapes: an egg sphere with the 2D face painted into its own texture, the curl as a 3D tube, a capsule hoodie torso, tube limbs placed between joints |
| Environment | three.js Ashgrove set + Plate A | Plate A crop with parallax, painted 2D sofa, bloom, vignette, grain | three.js set + Plate A, plus layers: a foreground lamp silhouette, dust motes in the phone light, moon haze, a rim kicker |
| Render speed | 2.5–4.3 s/frame | **0.07 s/frame** | ≈ 4.4 s/frame |
| Built in this lab | (existing) | ≈ 1.5 h for one camera view and one shot | ≈ 1.5 h; still shows toon "ring" banding from the close phone light |

## 2. Still comparison
**Files:**
- `design/style_lab/compare_three_stills_phone.jpg`: 390×693 each, the real phone viewing size.
- `design/style_lab/compare_three_faces_native.jpg`: native-resolution face crops.
- Individual stills: `still_A_current.jpg`, `still_B_stick2d.jpg`, `still_C_hybrid25d.jpg`.

**Scores (1–5)**, judged at phone size and at native resolution:
| # | Criterion | A | B | C | Notes |
|---|---|---|---|---|---|
| 1 | Overall visual appeal | **3.5** | **3.5** | 2.5 | A: rich 3D shading. B: clean and graphic but flat against the painterly wall. C: reads as a plush toy |
| 2 | Character originality / memorability | 3 | **4** | 3 | B's egg head and curl make a recognisable silhouette mark. A is a generic chibi |
| 3 | Facial expression readability (phone) | 4 | **5** | 3.5 | B's flat, high-contrast face reads instantly; C's toon banding muddies its face |
| 4 | Emotional storytelling potential | **4** | **4** | 3 | A has full-body 3D acting. B has caricatured faces and sweat drops but limited bodies |
| 5 | Cinematic environment quality | **4** | 3 | **4** | B's flat-shaded figure doesn't sit *in* the painted light the way the reference does |
| 6 | Animation feasibility (our tools today) | **4** | 3 | 2 | A: proven rig and pipeline. B: front view only; needs head turns, ¾ and profile views, hand poses and walks. C: needs rig and look-dev |
| 7 | Consistency across episodes | **5** | **5** | 4 | Both A and B are deterministic code and rigs |
| 8 | Production time per finished minute | 3 | 3 | 2 | See §5. Simpler drawing ≠ less total work |
| 9 | Reusable assets / automation | **4** | **4** | 3 | |
| 10 | Suitability across all categories | **4** | **4** | 3 | B suits costume and prop storytelling well (history, What If); horror relies on lighting, where B is weaker |
| | **Total (of 50)** | **38.5** | **38.5** | 30 | |

**Strongest challenger: B.** It ties A overall, wins on originality and face readability, and loses on environment integration and animation feasibility. C is not competitive without days of look-dev.

## 3. Motion test: Style B (5 s, zero credits)
**Files:**
| What | File |
|---|---|
| B motion test | `renders/style_lab_B_motion_test.mp4`: native 1080×1920, 30 fps, 150 frames, 5.000 s |
| Side by side with the current baseline | `renders/style_lab_A_vs_B_side_by_side.mp4` |
| Frame sheet | `design/style_lab/B_motion_sheet.jpg` |

**Checklist:**
| Requirement | Result |
|---|---|
| Smooth, purposeful body movement | **Partial.** Breathing, a recoil on the shock, a hunch, the phone sinking as he turns. The head *slides* rather than rotates, and the body never turns: this is cut-out puppetry, not full animation |
| Readable facial acting | **Strong.** Tired → frown → shock → dread with eyes to the door, plus a sweat drop. The best of the three |
| Phone interaction | Yes: the thumb scrolls in the insert, both hands grip, the phone lowers on the look |
| Cinematic lighting | **Moderate.** Phone underlight, moon rim, door bloom and grade are painted on as overlays, not a lit form |
| Camera movement | Yes: a push-in with parallax (the wall at 55%) |
| Clear, pixel-perfect text | **Yes**, the sharpest of all versions (vector UI) |
| Consistent proportions | Yes |
| Professional composition | Good: big face (≈ 45% of frame width), door over his shoulder, clean insert |

## 4. The honest quality gap
**Versus the reference:** neither A nor B reaches the illustrated density of the AI-generated reference.
- B's gap is **rendering**: flat vector fills and lighting overlays against a painted wall, so the character looks placed on the background rather than painted into it.
- A's gap is **character charm and readability**: the C+ chibi is competent but generic, with smaller, softer faces.
- Closing B's gap needs one of:
  - a hand-built illustrated rendering system for the character (hatching, painted shading, textured lines): ≈ 3–5 days of look-dev, quality uncertain;
  - per-shot AI illustration, which is the reference's method and breaks the zero-credit and budget limits (§5).

**B versus A:**
- B is more **brandable** and **readable**.
- A is more **cinematic** and more **animatable today**.

## 5. Realistic production time and cost
**Simpler characters do not automatically mean cheaper production.** Most of our episode time goes to:
- story and script;
- staging and direction;
- the conform to the voice;
- environments;
- QA and the publishing package.

Character animation is roughly 30–40% of the work. Render time is not the bottleneck: A renders unattended at about 1.5 h per episode.

| | A: current (+ plates) | B: 2D stick figure | C: 2.5D hybrid |
|---|---|---|---|
| One-time build before production | **0** (exists) | **≈ 5–8 working days**: 2D rig with ¾ and profile head views, a pose and hand library, walk cycle, a costume system for history and science, lip and mouth sets, a shot template, a background compositor | ≈ 8–12 days: rig, toon look-dev fix, face texture system, costumes |
| Per 50 s Short once built | ≈ 3–5 days now; ≈ 2.5–4 with set reuse | ≈ 2–3 days (faster posing, instant renders, simpler QA) | ≈ 3–5 days |
| Credits per Short | ≈ 10 audio + 0–7 plates | ≈ 10 audio + ≈ 3.5 per new location plate | the same as A |
| Matching the reference look | not possible | **per-shot AI illustration**: ≈ 15–25 images × 3.5 ≈ 50–90 credits per Short, with the consistency risk of a generated character | not applicable |
| Long-form (5–10 min) | **Strong.** 3D sets give unlimited camera angles from one build | Weak to moderate. Every new camera angle of a location needs its own painted plate | Like A |

## 6. Business evaluation (target CA$3,000/month)
No audience-performance claims are made; retention can only be measured after publishing.

| Factor | A: keep current | B: adopt stick figure |
|---|---|---|
| Production speed | 4–8 Shorts/month is plausible now with set reuse | Slower for about 2 months (the 5–8-day build), then possibly 20–30% faster per Short |
| Audience appeal / retention | **Unknown.** Nothing is published yet | **Unknown.** Plausible advantages: bigger and more readable faces, a stronger brand silhouette. Plausible risk: it reads as "another stick-figure channel" in a crowded format |
| Visual consistency | High | High |
| Production cost | ≈ 10–17 credits per Short | ≈ 10–20 credits per Short (plates per angle). Matching the reference needs ≈ 50–90, above budget |
| Scalability to 4–8 per month | Yes | Yes, after the build |
| Long-form potential | **Better** (3D sets) | Weaker (a plate per angle) |

## 7. Recommendation: **KEEP CURRENT**, carrying over B's proven strengths at no extra cost
**Why:**
- B ties A on the 10-point score but doesn't beat it.
- Adopting B costs about 5–8 days of new tooling *before* the next video ships, and its premium look depends on rendering work or per-shot AI art that we haven't validated.
- We have **zero** published retention data. The priority is to release Episode 3, then the next episodes, and measure.

**Bring into the current style (no new system):**
1. **Bigger faces:** frame key reaction shots so the head is about 40–45% of the frame width.
2. **Caricature beats:** sweat drops (we have them), stronger brow and lid shapes in the C+ expression set.
3. **A signature silhouette mark** for the studio's recurring host or characters, like B's ink-curl.
4. **Costume and prop storytelling** for history and science episodes.

**Keep B on file as the prepared alternative:**
- If the first 3–4 published episodes show weak retention in the first seconds, or comments about readability or the character look, the B design and renderer are ready for a proper evaluation.
- That evaluation would include the 2D rig build quote above.

**Do not pursue C.**

**Approval needed:** none to keep current. Adopting B would need explicit owner approval of the ≈ 5–8-day build; no production change was made.
