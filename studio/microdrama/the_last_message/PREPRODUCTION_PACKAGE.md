# "The Last Message": live-action AI microdrama, zero-spend preproduction package

**Date:** 2026-11-18. **Status:** for owner approval.
**What was done:** nothing generated, nothing purchased, **0 credits spent** (balance 217.77).
**Scope:** a separate business experiment.
- The illustrated animation studio, its pipelines and all episodes are untouched.
- This folder is the only change.

**Evidence base** (all checked live today):
- Higgsfield's own `/short-drama` production workflow (its official recipe, read in full).
- Model specs from `models_explore`.
- Credit quotes from `estimate_*_cost` (they submit nothing).
- Plan and top-up prices from the pricing tool (read only).

---
## 0. What Higgsfield actually offers for this (verified)

**Short Drama Studio (`/short-drama`)** makes one episode per run, as a guided, staged pipeline:
- **Look:** chosen from a gallery (default `realism_cinematic`, live action).
- **Plan:** script → plan with a price.
- **Character pictures:** a face, an outfit and a reference sheet per character, plus locations and props.
- **Clips:** multi-shot talking clips with **dialogue generated inside the video**.
- **Assembly and edit:** joined into one film; optional edit (tighter cut, name cards, subtitles, AI music score).
- **Limits per run:**
  - 8 character pictures, 4 locations, 4 props;
  - clips of 4–30 s;
  - at most one clip per started 15 s;
  - film ≤ 180 s.
- **Draft → final:**
  - clips are first made as **480p drafts** you can review;
  - a draft can be **finalized at 1080p within 7 days**;
  - 720p clips can also be made directly.
- **Engine:** `seedance_2_5` in `omni_reference` mode. That's up to 30 reference images, 10 reference videos and 10 reference audio clips per request, with `generate_audio: true`.
- **Continuity:**
  - consecutive clips in the same scene are made as **forward extensions** of the previous clip;
  - character sheets and locations are fed into every clip as references.
- **Safety rules:**
  - a built-in check for minors;
  - no sexual content;
  - blocked or failed takes are left out.
- **Remakes are paid** and happen only on your request.

**Cinema Studio (Higgsfield's own cinematic models):**
| Model | What it is | Use |
|---|---|---|
| **Cinema Studio 4.0** (`cinematic_studio_video_4_0`) | Same reference modes as Seedance 2.5 (omni-reference, extension, video edit), 4–30 s, native audio, **plus film-craft controls**: camera body, lens, aperture, lighting rig, genre, era, colour palette, pacing | Hero shots that need exact cinematography |
| Cinema Studio Video 3.0 | 4–15 s, start/end frame, genre hint (horror, noir…), up to 4K | Alternative look |
| Cinema Studio Image 2.5 / Soul Cinema | Cinematic stills up to 4K | Location plates, posters, thumbnails |
| Soul Cast | Consistent character identity stills | Casting exploration |

**Voices:**
- **Native.** Seedance and Cinema Studio speak the dialogue themselves, in sync with the lips.
- **Voice lock.** To keep a character's voice the same across 10 episodes, give each character a **reference voice clip** (from ElevenLabs v4 or a cloned "voice element") and pass it as `audio_references`.
- **Separate tracks.** ElevenLabs v4 or other TTS for separate dialogue, plus `audio_dubbing` for other languages.

**Music:** ElevenLabs Music v2.5 (any length).

**Editing:**
- Short Drama's own auto-edit, or Higgsfield's montage and editing workflows.
- **Or our own post pipeline (recommended):** captions, phone UI graphics, sound design, mix, QA, at 0 credits.

**What's not possible:**
- No long-term "cast database" across runs. Continuity is kept by **reusing the same reference pictures and voice clips** in every episode. We store them in this folder as the series bible.
- **Small on-screen text** (phone screens, timestamps) is unreliable in AI video. We render those inserts ourselves (crisp, readable, free).

---
## 1. Pilot script, "The Last Message", Episode 1 (≈ 62 s)
**Format:** 9:16, live action, night, one apartment.
**Cast:** DANIEL (30s), MAYA (30s, his wife).
**Runtime:** ≈ 62 s on purpose: TikTok's Creator Rewards requires videos **over 1 minute** (verify current rules).

```
COLD OPEN. INT. APARTMENT 4B, LIVING ROOM. NIGHT. Rain on the window. 11:57 on the wall clock.

0:00  A phone buzzes on the coffee table. DANIEL (30s, tired, t-shirt) reaches for it.
      INSERT (our graphics): "MAYA ♥  sent a video". Under it, small: "Tomorrow, 12:03 AM".
      Daniel frowns at the date. Taps.

0:05  INSERT, THE VIDEO (handheld selfie, dark): MAYA, the same living room behind her but wrong:
      the lamp on the floor, the only light her phone. She's pale, shaking, whispering.
                MAYA (video)
          Danny. Listen. In one minute I'm going to knock.
          Don't let me in. Whatever I say... don't open the door.
      Something THUMPS off-screen. She looks past the camera. The video cuts out.

0:15  Daniel, very still. He dials. It rings... and he hears HER RINGTONE, muffled, right
      outside the front door. Then: KNOCK. KNOCK. KNOCK.

0:21  He creeps to the door. PEEPHOLE POV: MAYA in the corridor, coat, bag of groceries,
      smiling, perfectly normal.
                MAYA (through the door)
          Danny? It's me. I forgot my keys.
      He doesn't move. The chain is on. He opens the door the width of the chain.

0:31            DANIEL
          Why did you send me that video?
      A beat. Her smile stays... a little too long.
                MAYA
          ...What video?

0:38  Behind Daniel, deep in the dark hallway: a floorboard CREAKS. He turns. Nothing.
      His phone buzzes in his hand.
      INSERT (our graphics): "MAYA ♥  sent a video · Tomorrow, 12:04 AM". Thumbnail:
      DANIEL HIMSELF at the door, seen FROM BEHIND, from inside the hallway.

0:48  Daniel slowly looks from the phone... to the hallway... to the gap in the door.
                MAYA (outside, soft, too calm)
          Danny... who's in there with you?

0:55  The wall clock ticks to 11:58. Hard cut to black. Silence.
      TITLE (our graphics): THE LAST MESSAGE. "Episode 2: Don't open the door."
1:02  END.
```
**Why it should hold viewers:**
- **Hook in 1 s:** a message from tomorrow.
- **A new turn every ~8 s:**
  1. the warning;
  2. the ringtone outside the door;
  3. Maya smiling at the door;
  4. "What video?";
  5. someone inside;
  6. the second video;
  7. the final line.
- **The cliffhanger flips the threat:** the danger may be *inside*.
- **One location, two actors, one night:** this is the cheapest possible format that still escalates.
- **No violence shown:** the fear comes from implication and sound.

**Series engine (10 episodes):**
- Each episode ends with a new "message from tomorrow" that changes who to trust.
- The rules are fixed and simple: messages arrive 6 minutes ahead, always from Maya's phone, always in that apartment.
- This makes the season cheap (one main set) and bingeable.

---
## 2. Cast and character-continuity plan
| Character | Look (locked for the season) | States needed |
|---|---|---|
| **DANIEL**, 30s | Short dark hair, light stubble, tired eyes; grey t-shirt, dark sweatpants, barefoot; **wedding ring left hand**; phone in a **black case** | E1: one state (home, night) |
| **MAYA**, 30s | Shoulder-length chestnut hair, small mole under left eye (identity anchor); **wedding ring** | **Door Maya:** camel wool coat, scarf, paper grocery bag, composed. **Video Maya:** same face, oversized cream sweater, hair messy, tear-streaked, lit only by a phone. Two outfits and sheets, one face |
| (Season) **The Other**, voice only in E1 | Hallway creak / whisper | Defined in E2; no picture in E1 |

**Continuity system:**
1. **One face picture per actor, made once** (3:4), plus an **outfit flat-lay** and a **16:9 character sheet** per state. These are saved as the series bible in `bible/` and passed as references to **every clip of every episode**.
2. **Voice lock:** one 8–10 s reference line per character (ElevenLabs v4, ≈ 0.46 credits per line), passed as `audio_references` in every clip. Same voices all season.
3. **Continuity sheet** (checked in every clip prompt):
   - rings;
   - Maya's mole;
   - the phone case;
   - door chain on;
   - clock time;
   - lamp standing (present) or fallen (future);
   - rain on the window in every living-room shot;
   - apartment number 4B.
4. **Fictional people only:** generated faces, never uploaded photos of real people or lookalikes.
5. Short Drama's checks keep every clip within its safety rules (adults only, no sexual content).

---
## 3. Apartment 4B: reusable location plan (≤ 4 locations per run)
| # | Location reference (16:9, made once, reused all season) | Used for |
|---|---|---|
| L1 | **Living room, present.** Sofa facing camera, coffee table, rain-streaked window right, **wall clock** above the TV, warm floor lamp, kitchen doorway left; night, warm practicals plus cool city light | Opening, reactions |
| L2 | **Living room, "tomorrow".** The same layout, lamp knocked over, one cushion on the floor, darker, only phone light | Maya's video (and future flash-forwards) |
| L3 | **Entry and front door (inside).** Door with peephole and **brass chain**, coat hooks, shoe rack, light switch; behind the camera, the dark hallway to the bedrooms | Door scene, the creak, the final shot |
| L4 | **Building corridor (outside 4B).** Worn carpet, numbered doors, flickering ceiling light | Peephole POV and the chain gap |

**Props (≤ 4):**
- P1 Daniel's phone (black case);
- P2 the grocery bag;
- (season) P3 Maya's phone, P4 the spare key.

**Lighting bible:**
- Present: warm 2700K practicals, cool blue window spill, rain shadows.
- Future: phone-light only, cold.
- Corridor: sick green fluorescent.

These three palettes tell viewers "when" they are without text.

---
## 4. Cinematic shot list (≈ 62 s, 5 AI clips plus 3 free inserts)
AI clips are Seedance 2.5 or Cinema Studio 4.0 omni-reference, multi-shot inside each clip. **G** marks inserts made in our own post pipeline (0 credits).
| Clip | Time | Shots inside the clip | Purpose |
|---|---|---|---|
| **A** (10 s) | 0:00–0:05 + 0:13–0:18 | 1. ECU phone buzzing on the table (screen dark, UI added by us). 2. MCU Daniel lit by the phone, frowns. 3. MS Daniel very still; dials; ringtone heard **through the door** | Hook, reaction |
| **G1** (2 s) | 0:02–0:04 | Phone UI: "MAYA ♥ sent a video · Tomorrow, 12:03 AM" | Readable hook |
| **B** (9 s) | 0:05–0:14 | Maya's selfie video, handheld, L2: whispered warning; thump; she looks off; cut | The warning |
| **C** (12 s) | 0:18–0:30 | 1. Knock, Daniel's head turns. 2. Tracking behind him down the entry. 3. **Peephole POV** (fisheye) of smiling Maya. 4. CU Daniel's hand on the chain | Escalation |
| **D** (12 s) | 0:30–0:42 | 1. OTS through the chain gap on Maya: Daniel's line. 2. CU Maya: smile holds too long, "...What video?" 3. CU Daniel. 4. **Hallway behind him, creak**: he turns | Twist 1 |
| **G2** (3 s) | 0:42–0:45 | Phone UI: second video, thumbnail of Daniel from behind (a frame from clip E, composited) | Twist 2 |
| **E** (12 s) | 0:45–0:57 | 1. Slow push in on Daniel looking phone → hallway → door. 2. ECU Maya's eye in the chain gap: "Danny... who's in there with you?" 3. Clock ticks to 11:58 | Cliffhanger |
| **G3** (5 s) | 0:57–1:02 | Black, then the title card plus the episode 2 tease | Series hook |

AI seconds total: 55 s.

**Proof-of-concept scene (12–15 s): clips C + D condensed into one 12 s clip.** It is the hardest part:
- two characters and a dialogue exchange;
- lip-sync;
- a fisheye POV;
- a door and chain interaction;
- a performance beat ("smile holds too long").

---
## 5. Dialogue and sound-design requirements
**Dialogue:**
- 4 lines in total: 3 for Maya, 1 for Daniel, ≈ 45 words.
- Spoken **in-clip** by the model (lip-synced), with locked reference voices.
- Delivery notes:
  - Maya (video): breathy whisper, urgent;
  - Maya (door): warm, ordinary, then flat;
  - Daniel: low, controlled fear.
- Every line is captioned (most microdrama is watched muted).

**Sound (built in our pipeline, 0 credits; the clips' own audio is used for dialogue and room tone):**
- Rain on glass, fridge hum, distant traffic.
- Phone vibrations (`sfxlib buzz`).
- **Muffled ringtone through the door** (filtered).
- Three knocks, chain rattle, floorboard creak.
- A low synth drone under the second half.
- **Total silence** before the final line.
- Clock tick on the cut.
- A sub-bass hit on the title.

**Music:** none under dialogue; a 10 s sting on the title. Either synthesized (0 credits) or ElevenLabs Music (≈ 8.7 credits for 60 s).

**Mix:** −14 LUFS, −1.5 dBTP, voices always intelligible (our `mix.sh` standard).

---
## 6. Production plan (real tools, step by step)
| Step | Tool | Output | Time |
|---|---|---|---|
| 1 | (done) Script, bible, shot list | This package | — |
| 2 | **`/short-drama` workflow**, step-by-step mode, look `realism_cinematic`, 9:16 | Plan plus price; nothing charged until approved | 15 min |
| 3 | Character pictures and locations (GPT Image 2.6 2K or Cinema Studio Image 2.5) | Faces, outfits, sheets, L1–L4, props, saved to `bible/` | ≈ 5–10 min |
| 4 | Voice references (ElevenLabs v4) | 2–3 voice clips | 5 min |
| 5 | **480p drafts** (Seedance 2.5 omni-reference, native audio; extension for same-scene clips) | Review every draft; remake only what fails | ≈ 4 min per batch |
| 6 | (PoC only) **A/B:** the same scene in **Cinema Studio 4.0** at 480p | Pick the engine with better acting and lip-sync | +4 min |
| 7 | **Finals** from approved drafts (1080p, or 720p direct) | Final clips | ≈ 6–8 min |
| 8 | **Our post pipeline** (separate folder, no changes to animation pipelines): phone UI inserts, captions, sound design, mix, title, QA, publishing package | Upload-ready episode | ≈ 1–2 h |
| 9 | Owner approval → owner publishes | — | — |

**Realistic hands-on time:**
- PoC: ≈ 2–3 h.
- Episode: ≈ 5–8 h (most of it review and post).
- At a steady season pace: ≈ 4–6 h per episode.

---
## 7. Exact current credit quotes (live, 2026-11-18)
**Unit prices:**
| Item | Quote |
|---|---|
| Seedance 2.5 omni-reference + audio, 9:16, **480p draft** | **30 credits / 10 s** (3 per s) |
| Seedance 2.5, **720p** direct | **70 / 10 s** (7 per s) |
| Seedance 2.5, **1080p** | **160 / 10 s** (16 per s). A 1080p final from a draft is billed at this rate on top of the draft (per Higgsfield's workflow) |
| Seedance extension, 480p draft | 30 / 10 s |
| **Cinema Studio 4.0** omni-reference + audio, 720p / 1080p | **70 / 160 per 10 s** (same as Seedance) |
| Cinema Studio 3.0, 1080p + audio | 130 / 10 s |
| Kling 3.0 pro + sound (start/end frame only, weaker identity lock) | 20 / 10 s (cheap B-roll only) |
| GPT Image 2.6 high 2K (character sheets, locations) | 2.75 each |
| Cinema Studio Image 2.5, 2K | 2.00 each |
| ElevenLabs v4 voice line (≈ 70 characters) | 0.46 |
| ElevenLabs Music v2.5, 60 s instrumental | 8.72 |

**A. Proof of concept: the 12 s door scene (clips C+D).**
| Item | Credits |
|---|---|
| Pictures: Daniel (face, outfit, sheet), Door-Maya (face, outfit, sheet), L3 entry, L4 corridor, phone: 9 × 2.75 | 24.75 |
| Voice references: 2 × 0.46 | 0.92 |
| A/B 480p drafts: Seedance 2.5 vs Cinema Studio 4.0, 12 s each: 2 × 36 | 72 |
| Retry allowance: 1 more 480p draft | 36 |
| **Subtotal, draft-quality PoC (judge acting, lip-sync, continuity)** | **≈ 134** |
| + 1080p final of the winning take: 12 s × 16 | 192 |
| **Total, PoC with 1080p final** | **≈ 326** |

- Current balance is 217.77.
- **The draft PoC fits. The 1080p PoC doesn't** (it needs ≈ 110 more credits).
- The 1080p final can be bought later, only if the draft convinces you.

**B. Complete ≈ 60 s episode (55 AI seconds).**
| Item | 1080p | 720p direct |
|---|---|---|
| Pictures: 14 (Daniel 3; Maya: 1 face + 2 outfits + 2 sheets; 4 locations; 2 props) | 38.5 | 38.5 |
| Voice references (3) | 1.4 | 1.4 |
| Drafts 480p, 55 s × 3 = 165; **+100% retry allowance** | 330 | — |
| Finals: 55 s × 16 = 880, **+1 clip retry** (12 s × 16 = 192) | 1,072 | — |
| 720p direct: 55 s × 7 = 385; **+100% retry allowance** | — | 770 |
| Music sting (optional) | 8.7 | 8.7 |
| **Episode total** | **≈ 1,450** | **≈ 820** |
| Episodes 2–10 (bible reused; ≈ 10 credits of new places and props each) | ≈ 1,420 | ≈ 790 |

The retry allowance is deliberately generous for a first episode. Expect ≈ 50% retries once prompts are proven, which lowers 1080p to ≈ 1,280 and 720p to ≈ 620.

---
## 8. Per-episode and 10-episode season costs (credits → dollars)
**Dollar value of a credit** (today's prices; several are **promotional and end Nov 19–20**):
| How credits are bought | $ per credit |
|---|---|
| Ultra plan, annual (3,000 per month at $50 per month, sale; normally $129) | ≈ $0.017 (normally ≈ $0.043) |
| Ultra plan, monthly ($79 per month, sale) | ≈ $0.026 |
| Plus plan, monthly ($39 for 1,000) | ≈ $0.039 |
| One-time top-ups (500–4,000 credits, sale −31…38%; expire after 90 days) | ≈ $0.053–0.059 (normally ≈ $0.085) |

| | Credits | $ on a plan (≈ $0.017–0.043) | $ via top-ups (≈ $0.053–0.085) |
|---|---|---|---|
| PoC, drafts only | ≈ 134 | **$0** (current balance) | — |
| PoC + 1080p final | ≈ 326 | ≈ $6–14 | ≈ $17–28 |
| **Episode, 720p** | ≈ 620–820 | **≈ $11–35** | ≈ $33–70 |
| **Episode, 1080p** | ≈ 1,280–1,450 | **≈ $22–62** | ≈ $68–123 |
| **Season (10 eps), 720p** | ≈ 6,500–8,000 | **≈ $110–345** | ≈ $345–680 |
| **Season (10 eps), 1080p** | ≈ 13,000–14,500 | **≈ $220–625** | ≈ $690–1,230 |

**Capacity:** Ultra gives 3,000 credits per month, enough for ≈ 2 episodes at 1080p or ≈ 4 at 720p. A season on one plan alone takes 3–5 months.

**Recommendation:** make the season at **720p** unless the PoC shows 1080p visibly improves retention. Phones show the difference much less than the cost does (2.3×).

---
## 9. Commercial use and distribution
1. **Higgsfield licence.**
   - On 2026-11-17 you confirmed your plan includes commercial use (Terms of Use §4.4). The terms pages can't be opened from this environment.
   - **Re-check the current terms for the plan you'll actually produce on.**
   - Check also for model-specific terms on Seedance 2.5 / ByteDance and ElevenLabs. The model records show none.
2. **Copyright.**
   - Purely AI-generated footage may get little or no copyright protection (US Copyright Office position). Our **script, edit, graphics, sound design and series concept** are human-authored and protectable.
   - Expect re-uploads. Brand the series (title card, watermark) and build the audience on our channel.
3. **Platform disclosure (required for realistic AI people):**
   - YouTube "altered or synthetic content" toggle;
   - TikTok "AI-generated" label;
   - Meta "AI info".
   - Not labelling risks removal or demonetisation.
4. **Likeness:** only generated, fictional faces and voices. Never resemble or name a real person, and never clone a real person's voice without written consent.
5. **Music:** generated or synthesized only; never commercial tracks. Verify the AI-music licence. AI music may not be registrable in Content ID, so it can't be used to protect our uploads.
6. **Microdrama platforms** (ReelShort, DramaBox and similar apps) license content under rights warranties and often have AI-content policies. **Verify before pitching.** No streaming app is being built (per your brief).
7. **Monetisation rules to verify:**
   - YouTube Partner Program (repetitive or mass-produced content policy: each episode must be original, with real storytelling);
   - TikTok Creator Rewards (eligibility, **> 1 minute**, region).

---
## 10. Go / no-go framework
**Gate 1: Proof of concept** (≈ 134 credits, already in balance). Score at phone size, side by side Seedance vs Cinema Studio:
| Criterion | Go if |
|---|---|
| Face and outfit consistency across shots | ≥ 4/5, with no identity drift |
| Lip-sync and dialogue naturalness | ≥ 4/5, with no robotic delivery |
| Acting beat ("the smile holds too long") reads without captions | Yes, in a blind view by 3 people |
| Artifacts (hands on the chain, door, eyes) | None that a viewer notices in one view |
| "Would I keep watching?" (3 outside viewers) | ≥ 2 of 3 say yes |
| Hands-on time for 12 s | ≤ 3 h |

**No-go:** 2 or more criteria fail after one retry. In that case, stop, or return to the illustrated studio.

**Gate 2: Pilot episode** (≈ 620–820 at 720p). You publish it, and we measure after 7 days.
| Signal (per platform analytics) | Go | Kill |
|---|---|---|
| Viewers still watching after 3 s | ≥ 65% | < 45% |
| Average % watched (60 s) | ≥ 60% | < 35% |
| Comments asking for part 2, per 1k views | ≥ 2 | ≈ 0 |
| Follows per 1k views | ≥ 5 | < 1 |
| Shares per 1k views | ≥ 3 | < 0.5 |

These are working thresholds for a first test, not industry facts. Refine them after the first 3 episodes.

**Gate 3: Economics** (before committing to a season). Revenue is the big unknown. Assumed payout rates **to verify on your own analytics**:
- YouTube Shorts ≈ $0.03–0.08 per 1k views;
- TikTok Creator Rewards (videos > 1 min) ≈ $0.40–1.00 per 1k qualified views.

| Question | Rule |
|---|---|
| Break-even per 720p episode (≈ $11–35 on a plan) | ≈ 15k–90k qualified TikTok views, or ≈ 0.2–1.2M Shorts views |
| Your goal of CA$3,000 per month (≈ US$2,150) at 8 episodes a month | Needs ≈ 2.5–5M qualified TikTok views a month (≈ 300k–650k per episode), plus a second revenue line |
| **Go to a season** if | Episodes 1–3 average ≥ 100k views with Gate 2 retention, and revenue per episode ≥ 3× cost |
| **Scale** if | One episode passes 1M views, or a sponsor or licensing offer appears |
| **Kill** if | After 5 episodes, average views < 20k, or cost per 1k views > 3× revenue per 1k views |

**Business reality (honest):** this format can be cheap to *make* (≈ $11–35 per episode on a plan), but income from platform payouts alone is small and uncertain. The realistic upside is:
- a few breakout episodes;
- sponsorships;
- licensing a proven season to microdrama platforms;
- longer YouTube compilations (higher payout per view than Shorts).

Treat the first 3 episodes as a **paid audience test (≈ 2,000–2,500 credits at 720p)**, not as a business yet.

---
## Approval requested (nothing has been spent)
1. Approve the **script and plan** as they are, or with changes.
2. Approve **Gate 1, the draft PoC, ≈ 134 credits** from the current balance: A/B 480p drafts of the door scene, plus pictures and voices.
3. Optional later: the 1080p final of the winning take (≈ 192 more credits; needs a top-up or a plan).
