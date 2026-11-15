# Episode 2: VASA, "The Warship That Sank on Its First Voyage"

**Status**
- Topic approved by the owner (2026-11-15). Unpaid stage approved.
- **Animatic v1 and revised script: AWAITING OWNER REVIEW.** Paid narration and music need separate approval.
- No paid generation, and no full animation, until approval (Bible H).

**Spend so far:** $0 cash, 0 credits. The quotes below are preflights only, made with `get_cost: true`; nothing was submitted.

**Evidence labels**
- **[MUSEUM]**: stated by the Vasa Museum (vasamuseet.se).
- **[SECONDARY]**: reputable secondary source, consistent across sources.
- **[DISPUTED]**: sources disagree, or the claim is a hypothesis.
- **DRAMATIZATION / RECONSTRUCTION**: as defined in Bible B.2.

---

## F. Final production (2026-11-15)

**Owner approval:** final production, plus the 10.26-credit audio budget.

**Spend:** 2.99 (narration) + 7.27 (music) = **10.26 credits**, exactly as approved.

**Conform**
- The natural Grady read runs about 8 s longer than the animatic plan, so the picture was conformed to the voice through `story.timeMap` (`build_final.py`).
- Each line starts on its picture beat, or after the previous line; the voice is sped up 5% (atempo 1.05).
- The final cut is **57.43 s**.

**Audio**
- The score was edited into three segments. Music fades as water pours in, the sinking plays over near-silence with sound effects only, and mournful music returns on "Within sight of the city…".
- The inquiry falls in the score's natural pause; the ending re-enters under the seabed and recovery.
- About 134 synthesized sound-effect cues: lids, cannons, running feet, hull groans, salute, gust, water.
- Sea ambience is muted in the inquiry room and underwater.

**Deliverables**
- `renders/vasa_final_review.mp4`: 61 MB, local only, gitignored per directive.
- QA results: `final_videos/EP02_Vasa/metadata.md`.
- Publishing package: `final_videos/EP02_Vasa/`.

**Lessons**
1. Plan scripts at the measured pace of the voice *including* its dramatic pauses. Grady with ellipses runs ~120 wpm, not 138.
2. A time map conforms picture to voice with no re-animation.
3. Generated music does not follow requested section timings; plan to edit it into segments.

## R. Revision 1: owner notes applied, animatic v1 (2026-11-15)

**Owner decisions (2026-11-15)**
- Approved: Vasa as Episode 2, plus the **unpaid** stage (ship, harbour, period costumes, foot planting and acting improvements inside the episode, low-res animatic).
- **Not yet approved:** the narration (2.99 credits) and the music (7.27 credits). Nothing is generated until the owner has reviewed the animatic and explicitly authorised those costs.
- Keep the exact Episode 1 Grady voice.
- Two script changes requested:
  - **Opening:** say at once that she sank on her first voyage.
  - **Ending:** must not suggest the ship *sailed* for 333 years.

**Revised script (supersedes §2; 106 words; planned ~50.4 s; timing will be conformed to the recorded voice)**

| Time (s) | VO | Shot |
|---|---|---|
| 0.2–2.4 | "Sweden built a warship so powerful…" | S01 gilded stern under full sail (water level) |
| 2.7–4.0 | "…it sank on its first voyage." | S02 sailor waving; the horizon tilts; his smile freezes, eyes drop, then look to camera |
| 4.2–6.8 | "The king wanted two gun decks. Sixty-four cannons." | S03 quay: two rows of lids swing open, cannons run out; the shipwright looks up, worried. Caption STOCKHOLM · 1628 |
| 7.0–9.3 | "First, a test: thirty men ran across the deck." | S04 the crew lined up at the rail; the captain signals |
| (9.4–14.1) | *(no VO: three runs, each roll bigger)* | S05a runners; S05b the admiral's eyes widen; S05c our sailor lands dizzy on the high side |
| 13.9–16.1 | "She rolled so hard, the admiral stopped the test." | S06a the admiral's raised hand; S06b everyone frozen mid-stride, one still sliding |
| 17.4–18.4 | "They sailed anyway." | S07 he glances toward the palace, sighs, waves them out |
| (18.6–21.0) | *(departure, salute)* | S08 caption 10 AUGUST 1628 |
| 21.1–23.8 | "A breeze. She leaned… and came back." | S09 our sailor grips the rail, then laughs with relief |
| 24.2–25.4 | "Then, a stronger gust." | S10 a dark gust line races across the water |
| 26.0–27.6 | "The lower gunports were open." | S11 lower gun deck: back to camera, then head → shoulders → body turn; surprise |
| (28.2–30.2) | *(water)* | S12 water pours through the low ports |
| 31.0–33.0 | "Within sight of the city, she sank." | S13 from the shore: townsfolk and a child watch her go over (respectful, no humour) |
| 33.6–35.0 | "At least thirty people died." | (S13) |
| 35.6–40.6 | "The designer was dead. The builders said the king approved the plans. Nobody was punished." | S14 inquiry: councillors point at each other, then at the empty chair with the shipwright's cap, then glance up at the king's portrait and lower their arms |
| 41.0–45.6 | "She sank in twenty minutes. Then she lay underwater for 333 years…" | S15 the hull on the seabed, light shafts |
| 46.0–47.8 | "…until they brought her back," | S16 1961: the dark hull breaks the surface between pontoons; press boats, flashes. Caption 1961 |
| 48.2–49.4 | "almost whole." | S17 payoff: the stern, framed exactly like the opening |

**Why these lines**
- **The hook** states the outcome in under 2 s ("…it sank on its first voyage") while the picture shows pride turning to dread.
- **The "twenty minutes" fact** moves to the ending, where its contrast with 333 years lands. The ship is never described as travelling for 333 years: she *lay underwater* for 333 years.
- **"Within sight of the city":** the museum says she sank in sight of the shipyard, so the line is supported by the record.
- **"The builders said the king approved the plans":** this is attributed testimony, as in the museum's inquest page.
- **The interval:** August 1628 to April 1961 is 332 years 8 months. The Vasa Museum itself says "after 333 years", so we use "333 years".

**What was built in this stage**
- **Vasa ship:** `engine/blender/build_vasa.py` → `engine/web/props/models/vasa.glb` (≈1.1 MB, 229 parts). The lower gunports are real openings. Runtime: `engine/web/props/vasa.js` (hinged lids, cannons running out, heel/pitch/sink, the 1961 wreck look, painted stern carvings).
- **Stockholm harbour set:** `engine/web/sets/stockholm.js`. Calm Baltic water, rocky shores, the town, a stylised castle tower, the quay, instanced crowds, the inquiry room, the seabed.
- **1628 costumes** on the same C+ V1 rig: `build_cplus_sailor.py -- out.glb <costume>` builds sailor (3 cap colours), officer (admiral/captain), councillor (ruff) and shipwright. The Roman V1 baseline output is unchanged in structure. Faces gain a 1620s moustache option, and costumes can be recoloured per character.
- **C+ V1.1 (inside the episode):** 2-bone leg IK with foot locks (`ch.pose({ feet })`) and a procedural walk/run gait with planted feet (`gait()`).
- **The episode:** `stories/vasa/` (`build_story.py`, `business.js`, `story.json`, `captions_animatic.ass`). The stability-test roll is a deterministic spring driven by where the crew is, so each run rolls the ship further.

**Deliverable:** `renders/vasa_animatic_v2.mp4`
- 1080×1920, 30 fps, 50.4 s, 1,512 frames, 19.96 MB.
- Rendered at 0.33 scale and upscaled, with the script as burned-in text.
- A contact sheet (one frame per 0.8 s) is in `renders/vasa_animatic_v2_contact.jpg`.
- Every frame was checked: no black frames.

**Known weak spots, to fix in the final pass (no new tools needed)**
- **S05a (the runs):** cluttered by sails and rigging; needs a cleaner camera.
- **S10 (the gust line):** the dark ripple barely reads; it needs whitecaps or a lower camera.
- **S12 (the gunports dipping under):** reads, but the water is stylised.
- **S16 (1961):** the hull is small in frame.
- **Final quality** (full-res render, sound, real captions) comes after the voice is recorded.

**Animatic notes and limitations**
- **No voice:** the animatic carries the script as on-screen text. No paid narration was generated, and the free local text-to-speech model host is blocked by the network policy.
- **No music; sound design comes in the final mix.**
- **Low resolution:** 356×634, the standard animatic scale.
- **Not final polish:**
  - water through the ports is a stylised sheet effect;
  - the 1961 salvage scene is simplified;
  - the king's portrait is a placeholder painting (not a likeness).

---

## 0. Narrator voice: verified

Episode 1 used **ElevenLabs Eleven v4 via Higgsfield, preset voice "Grady"** (`voice_id e2a2d2e6-9ed2-59cd-82af-feaa27f8a678`). This is confirmed by three independent records:
1. **The original generation call:** `model: elevenlabs_v4`, 16 `dialogue` lines, all with that preset voice ID, `use_unlim: false`, no other voice settings.
2. **Higgsfield's transaction log:** "Eleven v4", −2.76 credits, 2026-11-15 02:32 UTC.
3. **The file** `studio/stories/claw-v2/audio/narration_raw.mp3`: written 02:32, mono 44.1 kHz, 46.0 s.

There is no Fish Audio integration, and no Fish Audio call appears anywhere in the records. Episode 2 will use the identical call format and voice, which preserves the voice the owner liked. Bible D.1 has been updated to match.

---

## 1. Fact sheet (what the script relies on)

| # | Claim used | Status | Source / note |
|---|---|---|---|
| F1 | Vasa sailed **about 20 minutes** before sinking | [MUSEUM] | "Facts about Vasa" and the family trail say ~20 min. The easy-Swedish page says ~15 min. Script says "twenty minutes". |
| F2 | She sank after about **1,300 m**, in sight of the yard, 10 Aug 1628; wreck at 32 m | [MUSEUM] | "The Disaster". Not stated in the VO. |
| F3 | Built for **64 cannons** on **two gun decks** | [MUSEUM] | "Machine of War" / FAQ. The museum notes some ports were empty in 1628 because the foundry fell behind. VO: "The king wanted two gun decks. Sixty-four cannons." (the plan, which is accurate). |
| F4 | Before sailing, **30 men ran back and forth across the deck**; the ship rolled so much that the **admiral (Vice Admiral Klas Fleming) stopped the test**, fearing she would capsize at the quay | [MUSEUM] | Timeline, inquest testimony, audio guide. Run count: "three rounds" (audio guide) vs "a few trips" (inquest). VO avoids the number. Timing: "a few weeks" vs "days" before departure; VO says "before her first voyage". |
| F5 | **They sailed anyway**: under pressure from the king to get the ship to sea, Fleming let her sail | [MUSEUM] | Timeline. |
| F6 | A light gust heeled her to port and **she recovered**; a **stronger gust** pushed her further and **water poured in through the open lower gunports** | [MUSEUM] | "The Disaster". The gunports were open (the captain's decision); the museum calls it fateful. |
| F7 | **At least 30 people died** (of roughly 150 aboard) | [MUSEUM] with [DISPUTED] range | Museum pages give "at least 30" and "30–50". VO: "At least thirty people died." |
| F8 | Inquiry: the designer **Henrik Hybertsson had died** (1627); the builders testified she was built to **dimensions the king had approved**; **nobody was punished** (those questioned were later promoted) | [MUSEUM] | "The Inquest", timeline, audio guide 8. |
| F9 | **Raised 24 April 1961**, after 333 years; located by Anders Franzén in 1956 | [MUSEUM] | Salvage / excavation pages. |
| F10 | Preserved because the cold, brackish, low-oxygen Baltic kept wood-eating organisms away; **about 95% original** | [MUSEUM] / [SECONDARY] | Salvage page; Archaeology magazine. VO says "almost whole". |
| F11 | Most bronze guns were salvaged in the 1660s with a diving bell | [SECONDARY], counts differ (53 vs 59 of 64) | **Not used** in the script. |
| F12 | Main cause: **too little hull below the waterline for the heavy upper works** (top-heavy, unstable), plus sailing with open gunports | [MUSEUM] | Inquest experts and the modern museum view. The museum also says she was "very well built" by the standards of the era. **Not argued in the VO** (no lecture mid-story, B.6). |
| F13 | **Mismatched rulers / asymmetric hull** | [DISPUTED] | A hypothesis by a museum archaeologist, reported in the press (PRI 2013, WGBH 2016). **Not on the museum's own history pages. EXCLUDED from the script.** |

**Owner question: which ending is strongest?**

| Option | Assessment |
|---|---|
| (a) Failed stability warning | The best irony, but it falls at the midpoint; ending on it would mean skipping the sinking payoff. **Used as the midpoint turn** ("They sailed anyway."). |
| (b) The inquiry | A great dark-comic twist (nobody punished; the king approved the design), but a sour emotional landing after deaths. **Used as a brief beat**, not the end. |
| (c) The recovery 333 years later | The biggest WOW image, historically solid, and hopeful. It closes the loop with the hook ("twenty minutes"). **CHOSEN.** Final line: *"Her first voyage lasted twenty minutes. Her second… took three hundred and thirty-three years."* The "two voyages" framing is a figure of speech, already used by naval historians (USNI *Proceedings* 1969, "The Two Voyages of the Wasa"). It doesn't distort any fact: raised in 1961, 333 years after 1628. |

---

## 2. Script v1 (SUPERSEDED by §R; kept for the record)

- **Narration:** 98 words.
- **Pace:** planned at ~138 wpm, the measured pace of this voice on Episode 1, plus written pauses.
- **Target length:** about 49 s.
- **Timing:** estimated until the voice is recorded. Picture is conformed to the voice, as on Episode 1 (Bible J).

| Time | VO (Grady) | On screen / caption |
|---|---|---|
| 0.3–1.6 | "This was the mightiest warship in Sweden…" | |
| 2.0–3.3 | "It lasted twenty minutes." | |
| 3.6–6.4 | "The king wanted two gun decks. Sixty-four cannons." | caption **STOCKHOLM · 1628** |
| 6.8–9.8 | "Before her first voyage, thirty men ran across the deck to test her." | |
| 9.8–13.0 | *(no VO: the runs; music + footsteps)* | |
| 13.0–15.4 | "She rolled so hard, the admiral stopped the test." | |
| 15.4–16.4 | *(silence beat)* | |
| 16.5–17.6 | "They sailed anyway." | |
| 17.6–20.4 | *(no VO: departure; salute; crowd)* | caption **10 AUGUST 1628** |
| 20.6–23.4 | "A breeze. She leaned… and came back." | |
| 23.8–25.0 | "Then, a stronger gust." | |
| 25.6–27.6 | "The lower gunports were open." | |
| 27.6–32.0 | *(no VO: water and the sinking; music drops away)* | |
| 32.2–33.6 | "At least thirty people died." | |
| 34.0–39.0 | "The designer was dead. The builders said the king had approved the design. Nobody was punished." | |
| 39.4–43.6 | "But the cold Baltic kept her almost whole. In 1961, she came back up." | caption **1961** |
| 44.0–46.0 | "Her first voyage lasted twenty minutes." | |
| 46.4–49.0 | "Her second… took three hundred and thirty-three years." | end on the image (no end card text beyond captions) |

**Language:** short sentences, no jargon ("gunports" is shown before it is said). Broad international English.

**Captions:** 35–40% frame height, voiced-time timing with phrase pinning (E.1).

**On-screen labels**
- The deck, gun-deck and inquiry scenes are **RECONSTRUCTION**.
- The sailor we follow is a **representative, unnamed** sailor (DRAMATIZATION of a real crew).
- One small label, "Reconstruction", appears at 3.6 s.

---

## 3. Storyboard v1 (17 shots; SUPERSEDED by the §R shot list, which is implemented in `stories/vasa/build_story.py`)

**Legend:**
- **Lens:** vertical FOV.
- **Acting:** C+ V1 characters. The **foot-planting** improvement (2-bone leg IK + foot locks) is built inside this episode for S05 and S09.
- **Eyelines:** look → POV → reaction.

**S01 (0.0–1.4) HOOK, water-level hero shot**
- *Camera:* water level, 24°, slow push.
- *Picture:* Vasa's tall gilded stern and full sails glide past the lens; banners snap; a tiny crowd on the shore.
- *Sound:* sails, gulls, crowd cheer.

**S02 (1.4–3.4) HOOK, the tilt**
- *Camera:* medium close-up, 30°.
- *Picture:* our sailor waves proudly to shore with a big grin. The horizon behind him slowly tilts 6°. His smile freezes; his eyes slide down, then to camera.
- *Mute read:* WHAT?!

**S03 (3.4–6.6) Who / why**
- *Camera:* crane up the hull at the quay.
- *Picture:* a second row of gunports snaps open, lid-lid-lid; cannons roll out. The shipwright (C+, apron, worried brow) watches.
- *Caption:* STOCKHOLM · 1628.

**S04 (6.6–9.8) The test is set up**
- *Camera:* high wide on deck at the quay, the palace in the background.
- *Picture:* the captain gives a signal; 30 sailors line up at the port rail; our sailor stretches like an athlete. *(restrained humour)*

**S05 (9.8–13.0) The runs (memorable moment)**
- *Picture:* three runs, each a bigger roll.
  1. Low angle from the bow: a stampede of feet, the deck tilts.
  2. A bucket slides across the deck; the crowd of sailors slows mid-deck.
  3. Our sailor runs uphill in a long stride, lands and wobbles, dizzy.
- *Intercut:* the admiral on the quay, eyes widening.
- *Sound:* footsteps rumble in sync, hull groans louder each run.

**S06 (13.0–15.4) STOP**
- *Camera:* medium on the admiral (C+, wide hat, sash).
- *Picture:* his hand shoots up. Reverse: all 30 men freeze mid-stride; one keeps sliding gently with the tilt.

**S07 (15.4–17.6) "They sailed anyway"**
- *Picture:* silence. The admiral looks at the ship, then at a royal banner on the palace (the king's pressure). He sighs and waves them out. The sailors exchange glances; ours gulps.

**S08 (17.6–20.4) Departure**
- *Camera:* grand wide, golden preset, slow drift.
- *Picture:* Vasa leaves the quay under a few sails; salute smoke puffs from her side; crowds wave from the shore.
- *Caption:* 10 AUGUST 1628.
- *Music:* proud swell.

**S09 (20.4–23.6) First gust**
- *Camera:* deck, three-quarter.
- *Picture:* a breeze; the ship leans. Our sailor's feet plant and he grabs a line; she comes back. He exhales a relieved laugh to a mate.

**S10 (23.6–25.4) The gust line**
- *Camera:* wide from the water.
- *Picture:* a dark ripple races across the bay toward the ship; the sails bang full.

**S11 (25.4–28.0) The gun deck**
- *Picture:* lower gun deck interior, backlit square ports. The ship heels, and the waterline climbs to the sills. Our sailor turns: head → shoulders → body (the acting-test move). Eyes wide.

**S12 (28.0–30.2) Water**
- *Picture:* POV insert. Water pours through the ports in sheets; a cannon tilts.
- *Music:* drops to one low note.
- **The episode's replayable WOW.**

**S13 (30.2–33.6) The sinking (respectful)**
- *Camera:* wide from the shore crowd's position.
- *Picture:* Vasa heels over, the sails touch the water, and she goes down; the flags last. Foreground silhouettes; a C+ child takes a parent's hand.
- *Sound:* silence, then the VO.
- **No humour.**

**S14 (33.6–39.2) The inquiry (restrained irony)**
- *Picture:* a council room. Officials stand in a circle, each pointing at another (spring overshoot). All turn and point at an empty chair with the shipwright's cap on it. Then they glance up at the king's portrait and slowly lower their arms.

**S15 (39.2–42.6) 333 years**
- *Picture:* underwater, green murk, light shafts. The hull rests on the seabed; a time-lapse of sediment and flickering surface light; a fish passes.

**S16 (42.6–46.0) She comes back**
- *Picture:* 1961. The hull breaks the surface, water streaming from the gunports, with salvage pontoons and press boats around her. Camera flashes. Slow crane up.
- *Caption:* 1961.

**S17 (46.0–49.0) PAYOFF**
- *Picture:* **callback to S01.** The same water-level lens on the same gilded stern, now dripping and rising, in soft morning light. Hold.
- Final line. Cut to black on "…years."

**Hook (0–3.4 s):**
- the grand stern;
- then the proud sailor's frozen smile as the world tilts behind him;
- then "It lasted twenty minutes."

**Payoff (44–49 s):**
- the stern rising from the water, framed exactly like the opening;
- "Her first voyage lasted twenty minutes. Her second… took three hundred and thirty-three years."

---

## 4. Asset reuse and production-effort plan

**Reused (zero cost):**
- the engine and director;
- the painterly style and `golden` / `day` presets;
- `ocean.js` waves and splashes;
- the spline camera and `frameOf` ship-attach cameras;
- the painted shadow cards;
- **C+ V1 rig, face, springs and acting functions** (`character_cplus.js`), including the acting-test head/shoulder/body turn and point (S11, S14);
- 45 CC0 props (crates, barrels, buckets, lanterns, candlestick);
- `sfxlib.py`, `mix.sh`, the caption tools, the render batching and QA scripts.

**New work:**

| Item | Approach | Effort |
|---|---|---|
| **Vasa galleon** | New `blender/build_vasa.py` → GLB. Hull with tumblehome; two rows of gunports with hinged lids; 64 instanced cannons; tall stern castle with gilded carvings as painted textures; 3 masts + bowsprit; a few set sails; simple rigging; flags. Heel and sinking driven in code. | 2 days |
| Lower gun-deck interior + water ingress FX (animated water sheets, rising water plane, splashes) | modular set + shader planes | 1 day |
| Stockholm 1628 harbour: quay, low rocky shores, painterly town and palace silhouette, distant crowd | low-poly + painted backdrop; C+ instances at distance | 1 day |
| C+ costume variants: 1620s sailor (cap, shirt, breeches, bare feet or shoes), officer/admiral (wide hat, sash), captain, shipwright (apron), councillors (dark doublet, ruff), child | parameters in the build script (same rig and face) | 1–1.5 days |
| **Foot planting** (owner carry-forward): 2-bone leg IK, foot locks, weight shift | in `character_cplus.js` (production-driven, not a separate project) | 0.5 day |
| Inquiry room; underwater set; 1961 raising (pontoons, press boats) | simple sets, fog, light shafts | 1 day |
| Animatic (low-res, temp audio) → owner review | existing pipeline | 1 day |
| Acting and animation of 17 shots; final render (≈1,470 frames, ≈2.5–3.5 s/frame, ≈1.5 h CPU plus re-renders) | existing pipeline | 2 days |
| SFX, mix (−14 LUFS), captions, QA, delivery | existing pipeline | 0.75 day |

**Total:** ≈ **10–11 working days** to final. This is more than my earlier 5–6-day shortlist estimate, now that every shot is planned.

**Ways to save time if needed:**
- Simplify S14 to a quick, still "blame tableau" (−0.5 day).
- Cut S15 into S16 (−0.25 day).
- Use fewer distinct costume variants (−0.5 day).

**Order of work after approval:**
1. Ship + harbour + costumes.
2. Low-res animatic with a **temporary** voice timing (silent captions).
3. **Owner review.**
4. Paid narration (after approval).
5. Conform picture to the voice.
6. Final animation, render and audio.
7. QA and delivery.

---

## 5. Quote for paid items (SEPARATE APPROVAL NEEDED; nothing has been charged)

The balance is 275.06 credits (starter plan).

| Item | Model | Quote (preflight `get_cost`) |
|---|---|---|
| Narration, the exact Episode 1 voice (Grady), the 14 script lines above | `elevenlabs_v4`, preset `e2a2d2e6-…` | **2.99 credits** |
| Original score, 50 s (proud fanfare → comic-tense pizzicato for the runs → suspense → near-silence → mournful strings → wonder) | `elevenlabs_music_v2_5`, 50 s | **7.27 credits** |
| **Total** | | **10.26 credits** |

**Contingency:** one narration retake if a line needs a different read, ≈ +1–3 credits. That would be quoted again first.

**Free alternative to a new score:**
- Reuse a section of the owned Claw score (no cost). Not recommended: its mood and themes belong to Syracuse.
- Sound design (sails, creaks, footsteps, gust, water, crowd, salute) is synthesized for free.

---

## 6. Sources

**Vasa Museum (vasamuseet.se):**
- [The Disaster](https://www.vasamuseet.se/en/explore/vasa-history/disaster)
- [Timeline](https://www.vasamuseet.se/en/explore/vasa-history/timeline)
- [The Inquest](https://www.vasamuseet.se/en/explore/vasa-history/inquest)
- [Audio guide 8: The Inquiry](https://www.vasamuseet.se/besok/audioguide/audioguide-english/textversion/8.-the-inquiry)
- [Facts about Vasa](https://www.vasamuseet.se/en/explore/vasa-history/facts-about-vasa)
- [Machine of War](https://www.vasamuseet.se/en/explore/vasa-history/machine-of-war)
- [The Salvage](https://www.vasamuseet.se/en/explore/vasa-history/salvage)
- [The Excavation](https://www.vasamuseet.se/en/explore/vasa-history/excavation)
- [Preservation timeline](https://www.vasamuseet.se/en/explore/research/how-we-preserve-vasa/preservation-timeline)
- [Ship & history FAQ](https://faq.vasamuseet.se/category/45?lang=en)
- [Fact and fiction (children's audio-guide sources)](https://www.vasamuseet.se/en/visit/kids--families/fact-and-fiction)

**Secondary:**
- [Archaeology magazine](https://archive.archaeology.org/1207/features/vasa_warship_sweden_stockholm_harbor.html)
- [USNI Proceedings 1969, "The Two Voyages of the Wasa"](https://www.usni.org/magazines/proceedings/1969-03/two-voyages-wasa)
- Fred Hocker, *Vasa: A Swedish Warship* (2011)

**Disputed / excluded:**
- [PRI The World 2013](https://theworld.org/stories/2013/08/15/swedish-preservationists-document-likely-cause-sinking-ancient-sailing-ship) and [WGBH 2016](https://www.wgbh.org/news/2016-10-11/new-clues-emerge-in-centuries-old-swedish-shipwreck) (the rulers hypothesis).
- 1660s cannon counts: [The Local 2018](https://www.thelocal.com/20180828/the-vasa-ship-missing-cannon-may-have-been-found-stockholm).

**Method note:**
- This session's network policy blocks direct page fetches from vasamuseet.se. The museum statements above were checked through search results that quote those pages.
- Before the final lock, the owner or a later session may want to open the links directly. No claim in the script depends on a single non-museum source.
