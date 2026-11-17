# Character system: validation report (2026-11-17)

**Scope:** zero credits, isolated in `studio/dev/charsys/`, no production or episode files touched.

## What was built
| Deliverable | Where |
|---|---|
| Universal rig architecture | `dev/charsys/charsys.js`, `dev/charsys/README.md` |
| Script → character extraction and reuse spec | `dev/charsys/SCRIPT_TO_CHARACTER_SPEC.md`, `dev/charsys/lookup.py` (reuse-first; tested) |
| Persistent character library | `dev/charsys/library/<id>/character.json` and `turnaround_expressions.png` (5 characters), `library/index.json` |
| Five-character lineup | `dev/charsys/library/lineup_validation.png` |
| Three characters, same action | `renders/charsys_action_three_characters.mp4`: 1080×1920, 30 fps, 150 frames, 5.0 s |
| Walk validation | `dev/charsys/library/walk_cycle_validation.png` |

**The five characters:** none is a recoloured Theo. Each differs in build, proportions, garment, hair, face tuning and motion.
| Character | Build | Look | Motion |
|---|---|---|---|
| **Theo** | adult | Master base, approved raster hair and torso | young_adult |
| **Walter**, ~78 | elderly: stoop, belly, shorter legs | Bald with white side hair, bushy white brows, moustache, glasses, wrinkles, cardigan and collared shirt, cane | slow, small shrug, tremor |
| **Marcus**, Trajanic legionary c. AD 100–115 | stocky | Lorica segmentata, red tunic, focale, cingulum and studded apron, gladius on the right, scutum, Imperial-type helmet, caligae, clean-shaven | economical: shield up, hand to sword |
| **Mia**, ~7 | child: ≈ 2.3 heads tall, short limbs | Big sparkly eyes, blush, tousled hair with cowlick, striped tee and shorts, sneakers | fast, bouncy jump, hands fly up |
| **Elena**, 30s | slim_tall | Wavy auburn bob, earrings, knit sweater, A-line skirt, boots | poised |

**Same action, three performances:** one script (notice → anticipation → surprise → turn toward it). Timing, amplitude and body language come from each character's motion preset and build:
- the child reacts first and biggest;
- the soldier is quick and contained;
- the elder is slowest, with a hand to his chest and a tremor.

## Estimated time per additional character
| Case | Time | Credits |
|---|---|---|
| **Assembled** from existing components (spec, sheet render, review) | **15–30 min** | 0 |
| Needs **one new component** (a new costume such as a medieval royal robe and crown, a new hairstyle, a prop), drawn in vector and reusable afterwards | **1–3 h** | 0 |
| A new **period wardrobe set** (e.g. 4–6 components for Edo Japan) | **½–1 day** | 0 |
| Optional **hero polish**: an AI parts kit cut into layers (as for Theo) | ≈ 1 h | **≈ 2 credits** |

## Estimated recurring credits per 50 s episode
| Item | Credits |
|---|---|
| Characters and animation | **0** (library reuse) |
| Location plates (1.0 each, reused across a series) | ≈ 3–5 |
| Inserts and props | ≈ 2–4 |
| Narration and music (existing) | ≈ 10 |
| **Total** | **≈ 15–20 credits** (against 56–76 for all-AI) |
| Optional AI motion hero shot | + 7.5 |

## Limitations (honest)
1. **Detail level:** vector-assembled characters are cleaner and less detailed than AI-drawn Theo. There are no cloth folds or texture, and hands are mitts. They clearly share the house style, but hero characters may justify a 2-credit parts kit.
2. **Side and back views are simplified:** profile faces are ¾-shifted features with one eye, and back views carry no costume back detail beyond the silhouette.
3. **Movement:** notice, surprise, turn, gestures, breathing, blinking and a **basic walk** are validated. **Running, sitting for new characters, object interaction and lip-sync visemes are not yet built.**
4. **Component library is small:** 5 builds, 5 garments, 5 hairstyles (including Theo's raster), 1 facial-hair style, 1 headgear, 2 props, 3 footwear. Hundreds of characters need it to grow, at about 1–3 h per component, each reusable.
5. **Script extraction is a Claude procedure** (the spec plus `lookup.py`), not an automated parser. Owner approval remains the gate for every new character.
6. **Historical uncertainty:** the Roman tunic colour (red or undyed) and the shield blazon are flagged in the character file.

## Recommended next steps (each needs owner approval)
1. Owner review of the five designs (approve, or change specific traits).
2. Motion library: run, sit, point, walk-to-mark, lip-sync mouth set, object hold and hand-off. ≈ 2–3 days.
3. Wardrobe expansion driven by the next real scripts (only what's needed). ≈ 1–3 h per component.
4. Hook into production: a scene-blocking JSON (characters, marks, actions, camera) rendered by `compose.py`, with the `stories/theo_rig` pipeline as the template. ≈ 1–2 days.
5. Promote `dev/charsys` to `engine/charsys` after approval.
