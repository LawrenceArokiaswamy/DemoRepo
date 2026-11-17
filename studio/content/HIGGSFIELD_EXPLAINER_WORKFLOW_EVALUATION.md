# Evaluation: the "Claude + Higgsfield animated explainer" workflow vs our studio

**Date:** 2026-11-17.
**Status:** evaluation only.
- No tools were installed, no credits were spent, nothing was generated or rendered, and the pipeline is unchanged.
- The only figures from Higgsfield are free cost quotes (`get_cost: true`).

## 0. Evidence and its limits (read first)
- **The article itself could not be read.**
  - URL: https://higgsfield.ai/@sanjii/blogs/make-viral-animated-explainers-in-one-claude-chat
  - The session's network policy blocked `higgsfield.ai`. With the owner's approval it was added to the environment's allowed hosts on 2026-11-17, but the automatic permission check in this session then refused the fetch.
  - **Nothing below is claimed to be in the article.** Its author, wording, examples and any claims about specific channels are unverified.
- **What was examined instead: Higgsfield's own production workflow for this exact use case.**
  - The Higgsfield connector ships a workflow called `faceless-video` (v2.4). It is triggered by "narrated animated explainer video" requests made in a Claude chat.
  - It is the platform's own documented recipe, so it is the best available evidence of how a "one Claude chat" explainer is actually produced on Higgsfield. It is very likely what the article demonstrates, but that is an inference.
- **Model specifications** come from `models_explore` (MiniMax H3, Seedream 5.5).
- **Prices** are live credit quotes made on 2026-11-17 with `get_cost: true`, which submits nothing.
- **Account:** Higgsfield "starter" plan, balance 254.77 credits (`balance`).
- **Rick Clips:** there is **no evidence** that Rick Clips uses this workflow. Nothing examined mentions any channel, and the article could not be read. Treat any such claim as marketing until shown otherwise.

## 1. How the workflow works (from Higgsfield's `faceless-video` workflow)
1. **Style key.** One image (Seedream 5.5) built from preset reference images. A single style formula is pasted, byte-identical, into every later prompt. The workflow calls this "the entire consistency mechanism".
2. **Asset roster.** Character sheets (2:3), 4–6 locations plus 1–2 coverage angles each, and props, all made with Seedream 5.5 at 1k.
3. **Script and block plan.** Every **10 s block** is one MiniMax H3 video call containing **five hard-cut shots of about 2 s each** ("SHOT 1 0.0–2.0s … HARD CUT …"), with up to 7 reference images per call.
4. **Video.** `minimax_h3`, **2K only**, 9:16 supported, 4–15 s per call, 1–12 calls per batch.
5. **Voiceover.** ElevenLabs text-to-speech: **one line per 10 s block**, 7.8–9.5 s of speech, never time-stretched.
6. **Assembly, captions and delivery.** Higgsfield's remote sandbox runs bundled scripts: concatenation, Whisper-timed burned captions, and an upload to a hosted URL.

**Documented limitations,** written by Higgsfield in its own workflow text:
- **Moderation:** "NSFW is a ~50% probabilistic false-positive." A retry ladder allows up to about 8 attempts per block before stopping.
- **Under-delivery:** "the model under-delivers": 8 blocks × 5 requested cuts returned 29 cuts (about 4 s per frame). A block with too few cuts is regenerated.
- **Drift:** "Block 1 … drifts most often … redrew the cat in a different style even though the refs were attached." The fix is to regenerate.
- **No talking:** "Characters never talk on screen (no lip-sync)". Characters "only emote and gesture".
- **Fragile runtime:** the sandbox is ephemeral. Runs lost their downloaded clips three times, and an upload once stored an empty file.
- **Frame rate:** "Assembly fps = source fps … never hardcode 30". The model's frame rate is not stated, so a 30 fps output is not guaranteed.

## 2. Comparison with our studio (Blender + three.js)

| Criterion | Higgsfield explainer workflow | Our studio (C+ v2 + three.js) | Edge |
|---|---|---|---|
| **Character consistency between shots** | Reference images plus a repeated style formula. Drift is a documented failure, and the fix costs credits. Faces and costumes can vary from clip to clip | Deterministic rigged characters, identical in every frame and every episode | **Ours** |
| **Animation and acting** | Fluid, natural body motion and secondary motion, clearly richer than ours. Acting comes from a prompt and cannot be timed to a word. No lip-sync; "emote and gesture" only | Keyframed expressions locked to exact narration words (as in Episode 3); a full expression set, blinks, gulps, sweat. Motion is stiffer and more puppet-like | **Split.** Theirs moves better; ours acts to the script |
| **Background richness and lighting** | Painterly, detailed environments and cinematic light at no extra effort. The strongest advantage | Clean but simpler sets; lighting is hand-tuned (fill lights, phone glow). Each new set takes 1–1.5 days | **Theirs** |
| **Shot planning and camera** | Planned in prompts (five cuts per 10 s); camera moves are described, not controlled. Cut counts and durations are unreliable | Exact cameras, lenses, timings and push-ins; conformed to the voice with `timeMap` | **Ours** for control, **theirs** for speed |
| **Automation through Claude Code** | Fully scriptable through the Higgsfield connector, which is already connected; batched generation. The official workflow needs Higgsfield's remote sandbox | Fully scripted locally (render, conform, mix, captions, QA, package) | Even |
| **Output resolution and fps** | 2K at 9:16; frame rate set by the model (unverified). Caption and assembly run in Higgsfield's sandbox | Native 1080×1920, exactly 30 fps, verified frame counts | Even. Theirs is sharper; ours is fully controlled |
| **On-screen text** (phones, bubbles, alerts) | AI video garbles small text; it would have to be composited afterwards | Pixel-exact UI cards, legible at phone size (a key Episode 3 requirement) | **Ours** |
| **Commercial rights** | **Not verified.** The Terms of Service page could not be read here. The owner must confirm on higgsfield.ai that the plan allows monetised YouTube use; trial or free generations may differ. YouTube's altered/synthetic content disclosure applies | All our own code, CC0 assets and our generated audio | Ours (certain) |
| **Cost** | See §3: about 125–190 credits per 50 s episode | About 10 credits per episode (audio only) | **Ours, by more than 10×** |
| **Production time** | A few hours per episode once assets exist | About 3–5 days per episode | **Theirs** |

## 3. Credits and cost per finished 50 s episode
**Live quotes (2026-11-17, credits):**
- MiniMax H3, 2K, 9:16: **10 s = 20**, 5 s = 10.
- Seedream 5.5 still, 1k: **2.5**.
- Kling 3.0, 5 s: 8.75.
- Seedance 2.5, 5 s: 35.

**Higgsfield workflow, 50 s at 9:16:**

| Item | Credits |
|---|---|
| 5 blocks × 10 s H3 | 100 |
| Assets: style key, 2 characters, 4 locations, 2 coverage angles, 2 props ≈ 11 stills × 2.5 | ≈ 27.5 |
| Narration (Grady, our standard) | ≈ 2.8 |
| Music (50 s score; could be skipped for a free bed) | 0–7.3 |
| **Clean run** | **≈ 130–138** |
| Retries: the workflow documents frequent block regenerations (cut under-delivery, block-1 drift, moderation). Assume 1–2 of 5 blocks regenerated, +20–40, plus a couple of asset redos | +25–50 |
| **Realistic total** | **≈ 155–190 credits per episode** |

- **Unknown:** whether failed or moderated jobs are refunded. If they are not, retries cost more.
- **Our studio:** about 10 credits per episode (Episode 3 cost 10.03), plus CPU time.

**Converting to dollars.** The dollar rate per credit depends on the owner's plan and is not recorded in the Bible; confirm it on the Higgsfield billing page.

| Assumed rate (unverified) | Per episode | 20–30 episodes a month |
|---|---|---|
| $0.05–0.07 per credit, typical of entry plans | ≈ **$8–13** | ≈ **$160–400** |

- **The 254.77 credits currently on the account** cover about **1.5 AI episodes in total**, or about 25 of our current episodes.

## 4. Can it support 20–30 episodes a month?
- **Higgsfield workflow: no, within the budget.**
  - It needs about 3,100–5,700 credits a month, roughly 8–20× the $10–20 cash budget even at the low end of the assumed rate.
  - Production speed is not the bottleneck; credits are.
  - Even 2 episodes a month would exhaust the current balance.
- **Our studio: also no at 20–30, but for time rather than money.**
  - Each episode takes about 3–5 working days (Episode 3: about 1.5 h of rendering plus direction, QA and revisions).
  - A realistic sustained pace is **4–8 a month**, rising with reuse of shared sets such as Ashgrove House.
  - Claude usage is also a limited resource (Bible §J).
- **Conclusion:** 20–30 a month is not reachable with either pipeline at this budget. The lever is **reuse and templates**, not AI video for every shot.

## 5. Recommendation: hybrid, not replacement
**Do not replace the studio.** Full AI video would:
- give up exact acting-to-word sync, deterministic character consistency and legible on-screen text, which are the strengths behind Episode 3's approval;
- cost more than 10× as much per episode;
- add documented failure modes: drift, moderation false positives, under-delivered cuts.

**Adopt a narrow, credit-capped hybrid** where AI is strongest and cheapest:
1. **AI stills, not AI video, for background richness.**
   - Seedream 5.5 matte paintings (2.5 credits each) as backdrops, window views or skies behind our three.js sets; or as **texture and concept references** for new sets such as the Ashgrove flat.
   - About 2–4 stills per episode, ≈ 5–10 credits.
   - This addresses our weakest area (backgrounds and lighting richness) without touching characters or timing.
2. **Thumbnails.**
   - An AI-painted background behind our own rendered characters and type, a few credits per thumbnail.
   - It improves the click-through image, where richness matters most.
3. **At most one AI video insert per episode, used selectively:**
   - only for a shot with **no hero character and no text**, such as an establishing shot, weather, the city at night, or a corridor;
   - 5 s on Kling 3.0 = 8.75 credits;
   - only after a test proves it blends with our look.
4. **Keep in-house:**
   - all hero characters, expressions and acting;
   - all on-screen text and UI;
   - the camera, conform, captions, mix and QA.

**Projected hybrid cost:** about 10 (audio) + 5–10 (stills) + 0–9 (optional insert) = **≈ 15–30 credits per episode**, about 1.5–3× today's cost.

## 6. Zero-spend test plan: one 5 s scene from After Dark AD01
**Scene:** AD01 beat 1, the hook (0–4 s, extended to 5 s). A dark bedroom; the phone lights Theo's face; a message from "Me" reads "Don't open the door at 3:17."

It tests the hardest things at once:
- a consistent character;
- a readable reaction;
- low-key cinematic light;
- legible on-screen text.

**Phase A: free, preparation only** (done now or on request; no rendering, no spend):
1. **Shot spec**, locked for both pipelines:
   - 9:16, 5.0 s, a slow push-in from a medium to a close-up;
   - cold moonlight from the window plus the warm phone glow on the face;
   - the reaction: a frown, then the eyes widen on "3:17";
   - the text insert is a separate element.
2. **References already rendered** (no new renders): `renders/character_concept_Cplus.jpg` and `renders/character_test_cplus_turnaround.jpg`. These test whether AI video can hold **our** C+ character, which is the realistic hybrid question.
3. **Prompt package** written in advance:
   - H3 version: one shot, no cuts, "the character only emotes, does not talk";
   - Kling 3.0 version;
   - the same text for both.
4. **Scoring rubric** (1–5 each):
   - identity match to the C+ sheet;
   - expression readability at 390×693;
   - lighting and background richness;
   - motion quality;
   - artefacts and warping;
   - text (expected to fail, which confirms the composite plan);
   - fit with our existing look;
   - credits per usable second.

**Phase B: needs approval.**
- **Free part:** render the same 5 s shot in our engine. It uses the existing C+ man and the Episode 3 phone rig in a darkened void or room, with the After Dark grade; about 150 frames, ≈ 10 min of CPU. This is a style test only, not production of the episode.
- **Credit part:** the AI side, capped.

| Step | Credits |
|---|---|
| Upload the 2 existing reference images | 0 |
| 1 × MiniMax H3, 5 s, 2K, 9:16, image references | 10 |
| 1 × Kling 3.0, 5 s, 9:16, image references | 8.75 |
| 1 Seedream 5.5 dark-bedroom backdrop (tests the "AI stills behind our characters" hybrid) | 2.5 |
| One retry allowance in total, used only on a failure or moderation block | ≤ 10 |
| **Cap** | **≤ 31.25 credits**, from the existing 254.77 balance; **$0 cash** |

**Decision rule after the test:**
- **Adopt the AI-stills hybrid** if the AI backdrop composited behind our character scores ≥ 4 on richness and fit.
- **Adopt occasional AI video inserts** only if an AI clip scores ≥ 4 on identity and fit **and** costs ≤ 2 credits per usable second.
- **Otherwise:** keep the studio as it is and record the lesson.

## 7. Exact approval needed before testing
The owner must approve, in their own words:
1. **"Approve up to 31.25 Higgsfield credits from the existing balance for the After Dark 5-second AI comparison test (H3 5 s, Kling 3.0 5 s, one Seedream backdrop, one retry). No cash, no plan change, no credit purchase."**
2. **"Approve a free 5-second in-house style render of AD01 beat 1 (style test only, not episode production)."**
3. **Rights check (owner action):** confirm on higgsfield.ai, under the Terms of Service for the current plan, that generated images and videos may be used in a monetised YouTube channel. No AI output goes into a published episode until this is confirmed.

Nothing in Phase B starts until items 1 and 2 are approved. Item 3 is needed before any AI asset is published.
