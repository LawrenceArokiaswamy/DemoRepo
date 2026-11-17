# Illustrated Shorts: the new studio style (production template)

The owner-directed look (2026-11-17), matched to the owner's reference:
- clean webcomic line art with soft flat colour;
- round pale heads, small dot eyes, thick brows, a big expressive mouth;
- thin black stick limbs and round black mitt hands;
- soft painted backgrounds.

Characters and scenes are always **our own**. The reference frames are used only as *style* references.

## Locked assets
| Asset | File / ID |
|---|---|
| Theo, model sheet (5 views + 6 expressions, 2k) | `design/characters/theo_model_sheet.png`, Higgsfield job `368d2705-8e11-4456-bdca-1b2bffb73346` |
| Theo, approved scene still (haircut) | `design/style_ref_test/shot_H_exactstyle_hair.png`, job `3bcbae4e-1361-4f29-8ef1-33ecccb5e81c` |
| Style references (owner's frames, UI and captions cropped off) | `design/style_ref_test/styleref_1..3.jpg`, media `047c2a88…`, `49dcdb52…`, `6f26be07…` |

## Per-episode workflow
1. **Script and narration:** the current studio process (Grady narration, conform).
2. **Shot list:** one still per beat, about every 1–2 s. Mark 2–3 hero beats as animated clips.
3. **Generate the stills** with `gpt_image_2_6`, **`quality: medium`, `resolution: 2k`, 9:16** (1.0 credit each). This size is never upscaled, so it stays sharp.
   - References, in this order: the character sheet, the location still (once a location exists), then one style reference.
   - The prompt is the STYLE BLOCK, plus the CHARACTER BLOCK, plus the shot.
   - Anything that must show text (phones, signs) gets a **blank** surface; `compose.py` draws the exact text.
4. **Animated hero shots** with `kling3_0`, using **start_image + end_image = two of our own stills** (this keeps the character on-model).
   - `mode: pro` for sharpness: 7.5 credits per 5 s (std mode is 6.25 but softer).
   - `sound: off`.
5. **Compose:**
   ```
   python3 studio/engine/illustrated/compose.py shotlist.json out.mp4
   ```
   - Produces 1080×1920 at 30 fps.
   - Push-ins, snap-zooms on shock beats, exact on-screen text, audio and burned captions.
   - No grain, light unsharp. See `examples/ad01_beat1.json`.
6. **QA and package:** the current studio gates (Bible §H, §K).

## Prompt blocks (paste verbatim)
**STYLE BLOCK**
> 2D cartoon illustration in exactly the art style of the reference images: clean black outlines of even weight, soft flat colour with gentle shading, softly painted background with gentle depth of field, warm soft palette. Round pale heads, small solid black dot eyes, thick expressive black eyebrows, big expressive mouths; thin black stick limbs; round black mitt hands. No text, no labels, no logos.

**CHARACTER BLOCK: Theo**
> A young man with a plain round pale head and short, slightly messy dark-brown hair; simple grey hoodie with a front pocket and white drawstrings; thin black stick legs; small dark shoes.

## Cost guide (live quotes, 2026-11-17)
| Item | Credits |
|---|---|
| Still, 2k medium | 1.0 |
| Still, 1k medium (too soft for final use) | 0.5 |
| Still, 2k high | 2.75 |
| Kling 3.0, 5 s, pro, sound off | 7.5 |
| Kling 3.0, 5 s, std, sound off | 6.25 |

**A 50 s Short:**
| Item | Credits |
|---|---|
| ≈ 25–35 stills × 1.0, plus about 25% retries | ≈ 31–44 |
| 2–3 animated clips × 7.5 | ≈ 15–22 |
| Narration and music | ≈ 10 |
| **Total** | **≈ 56–76 credits** |

**Cheaper:** about 40 credits with 1–2 clips and fewer stills.
