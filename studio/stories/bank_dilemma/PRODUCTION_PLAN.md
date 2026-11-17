# "What If Your Best Friend's Life Depended on Your Next Move?": production plan (Stage A)

**Genre:** psychological thriller, What If.
**Format:** 1080×1920, 30 fps, target **≈ 55 s**.
**Status:**
- Stage A is planned.
- Stage B, the representative sample (shots S1–S5, 14.5 s), is rendered.
- **The full episode waits for owner approval (Stage D).**
- 0 credits spent.

Fictional entertainment. **No tactical content:** no disarming, shooting, hostage-rescue or robbery methods are shown or described.

## 1. Script (full episode, ≈ 55 s, ≈ 150 wpm)
**Spine:**
| Stage | Content |
|---|---|
| HOOK | Gun to your best friend's head |
| PROBLEM | The robber's offer |
| ESCALATION | Your secret skill |
| COMPLICATION | Skill can't guarantee anyone's safety; the robber gets impatient |
| TWIST | You choose restraint; then his phone reveals this robbery was about *you* |
| PAYOFF | The question |

N = narrator. R = robber. S = Sam.

| # | Time | Beat | Line | Notes |
|---|---|---|---|---|
| 1 | 0.0–4.0 | Hook | N: "Your best friend has a gun pointed at his head." · R: "Everybody, stay down!" | **In sample** |
| 2 | 4.0–12.0 | Offer | R: "Fill the bag. A hundred grand is yours. And you walk out with me." | **In sample** |
| 3 | 12.0–20.0 | Identity | N: "But there's one thing he doesn't know about you… Eight years. Two tours. The one they sent when there could be no second chance." | **Sample covers to 14.5 s** |
| 4 | 20.0–32.0 | Dilemma | N: "From here, you can see every mistake he's making. But training doesn't make a room safe. One wrong move… and it isn't you who pays." | |
| 5 | 32.0–43.0 | Escalation | R: "I said NOW!" · S (whisper): "Please…" · N: "Fight, and gamble with six lives. Or obey… and trust a man holding a gun." | |
| 6 | 43.0–55.0 | Payoff and twist | *(he lowers his hands, picks up the bag)* · *(phone buzzes; the robber's face drops)* · on the phone: "THE ONE IN THE GREEN JACKET. BRING HIM." · N: "Would your training make you brave enough to fight… or wise enough not to?" | |

**Twist logic:**
- The robbery was a pretext to take *Nate*: someone knows who he is.
- It pays off the hidden-identity setup.
- It supports a continuation without requiring one, and changes the meaning of the robber's "you walk out with me".

## 2. Cast: extraction from the script → library lookup
Run with `lookup.py`.
| Character | Script evidence | Lookup | Decision |
|---|---|---|---|
| **Nate Calder** (you) | Former military sniper, calm, protagonist | No match | **NEW draft** `nate_calder` v0.1: athletic build, buzz cut, short beard, field jacket, dog tags |
| **Sam Ortiz** (best friend) | Terrified hostage, strong fear | No match (Theo deliberately **not** reused) | **NEW draft** `sam_ortiz` v0.1: slim/tall, curly hair, denim jacket, big readable eyes |
| **Masked robber** | Masked, armed, impatient | No match | **NEW draft** `masked_robber` v0.1: balaclava with eye band and mouth opening (emotion stays readable), black hoodie, handgun silhouette, duffel |
| **Teller** | Bank employee | No match | **NEW draft** `priya_teller` v0.1 (reusable staff template) |
| Customers | Bystanders | Walter, Elena, Mia | **REUSED** library characters (no new design) |

## 3. Environment: `engine/web/sets/bank.js` (new, reusable, 0 credits)
A classic marble banking hall, 16 × 22 m, ceiling 6 m.

**Story props:**
- teller counter with brass-framed glass, speak holes, deal trays and window numbers;
- 4 teller stations with live UI monitors;
- cash stacks at window 2;
- a round steel vault door standing ajar, lit inside;
- a queue lane with brass stanchions and velvet rope;
- a check-writing island with slips, pens and a clipboard;
- a waiting area (sofa, armchairs, coffee table, plants);
- a wall clock (ticks in the sound mix);
- security cameras, a fire alarm, framed art, a wet-floor sign;
- marble columns and a coffered ceiling with brass chandeliers and sconces;
- a green runner from the doors to the counter (a leading line);
- a glazed brass façade with etched, reversed lettering, onto a sunlit street.

**Sources:**
- Poly Haven CC0 for 19 models, 6 textures and 1 HDRI, fetched by `tools/fetch_assets.py`;
- everything else is procedural.

**Reusable for:** any bank, lobby, heist, museum-office or courthouse story (swap the sign and palette).

## 4. Lighting design (scene-specific, not a universal preset)
**Motivation:** a late-afternoon sun through the glass façade.
| Element | Design |
|---|---|
| **Key** | Warm sun, 2.0, from the doors (front-left, high). It casts long mullion shadows across the marble, so the room reads as "outside world is normal, inside is not". |
| **Fill** | Cool sky bounce (hemisphere, 0.38). Teal-blue shadows give warm/cool contrast. |
| **Practicals** | Warm chandeliers, sconces and a counter spot (with shadows), the green-marble sign glow, cool monitor glow behind the glass, cool vault light. |
| **Atmosphere** | Sun shafts through the façade and slow dust motes. Fog only at depth. |
| **Characters** | Their 2D lighting pass is driven by the **same key light**: shading falls on the side away from the sun, and a warm rim appears on the sun side, stronger when backlit. Real silhouette shadows come from the cards, plus soft contact shadows. Close-ups get a motivated fill (bounce off the marble) so faces never go muddy against the bright façade. |
| **Grade** | Cool shadows, warm highlights, contrast 0.28, vignette 0.42, ACES exposure 0.88. Bloom only on practicals and the façade. |

**Episode arc** (planned for the full episode): the sun dims slightly through Beats 4–5 (tension). Beat 6 flashes the phone's cold screen light on the robber's face; red-blue light then appears outside in the last shot.

## 5. Shot list and camera plan (full episode)
Each shot has one job. **[S]** marks shots rendered in the Stage B sample.
| # | Time | Shot | Verb | Camera | Purpose |
|---|---|---|---|---|---|
| **S1 [S]** | 0.0–2.9 | CU Sam, gun at his temple | hook | 28°, eye level, slow push 3.0→2.6 m, shallow focus | Terror before context |
| **S2 [S]** | 2.9–5.7 | High wide, crane down | establish | 48°→46°, from above the doors | Geography: doors → you → hostages → robber → counter |
| **S3 [S]** | 5.7–9.4 | OTS (your shoulder) | build | 38°, tilt down to follow the bag, then back | The choice is literally thrown at your feet |
| **S4 [S]** | 9.4–12.4 | CU Nate, push-in | react | 28°→27° | Shock hardens into focus |
| **S5 [S]** | 12.4–14.5 | ECU eyes plus identity card | reveal | 24°, 1.2 m | "Former military marksman" |
| 6 | 14.5–16.5 | Memory insert: dog tags in his palm, desaturated, slow rack focus | reveal | macro | His past, with no combat imagery |
| 7 | 16.5–20.0 | Low angle on Nate, hands still up | build | 35°, slow orbit 10° | Capability under restraint |
| 8 | 20.0–22.5 | POV: Nate scans the room | build | Handheld-style pan, rack focus | What he sees |
| 9 | 22.5–24.0 | Insert: robber's shaking gun hand (silhouette only) | build | ECU | He's nervous, so he's dangerous |
| 10 | 24.0–26.0 | Insert: Mia hiding in Elena's arms | stakes | CU | Innocent people nearby |
| 11 | 26.0–28.5 | Walter grips his cane; the teller frozen behind the glass | stakes | Two-shot | More lives |
| 12 | 28.5–32.0 | Slow push on Nate (the dilemma) | act | 30°→22° over 3.5 s | Intense concentration |
| 13 | 32.0–34.0 | Robber snaps toward camera: "I said NOW!" | escalate | Snap zoom 32°→26° | Impatience |
| 14 | 34.0–37.0 | CU Sam looks straight into the lens (eye contact with you): "Please…" | act | 28°, locked | Emotional peak |
| 15 | 37.0–40.0 | Reverse CU Nate; the clock ticks over | act | 28° | Time pressure |
| 16 | 40.0–43.0 | Insert: the clock's second hand; music drops out | build | ECU | Silence |
| 17 | 43.0–46.0 | Wide side angle: Nate slowly lowers his hands and picks up the bag | pay off | 40°, static | The choice: restraint |
| 18 | 46.0–48.0 | MCU robber smirks; his phone buzzes | twist setup | 32° | Confidence |
| 19 | 48.0–49.5 | Insert: phone notification (blurred → sharp) | twist | ECU | Withheld for a beat |
| 20 | 49.5–51.5 | CU robber, his face drops; cold screen light | twist | 28°, push | The complication |
| 21 | 51.5–55.0 | Final: Nate centred, bag in hand, robber's eyes on him, red-blue light outside | pay off | 34°, slow pull-back | The question |

**Continuity:**
- The robber and Sam stay screen-left of the counter centre line.
- You stay screen-right in wides.
- Eye-lines are computed from world positions, so they stay correct whichever angle a shot uses.

## 6. Sound plan
- **Narration:** the studio voice (ElevenLabs v4 "Grady" via Higgsfield).
- **Robber:** the existing preset voice "Benji" or a new preset (quote first).
- **Sample:** uses **free, temporary Piper TTS** ("Ryan", CC BY-NC-SA, so for internal review only; **not for release**).
- **Music:**
  - **Sample:** an original synthesized suspense bed (drone, pulse, cluster, silence before the reveal; 0 credits).
  - **Full episode:** either keep a synthesized score (0 credits) or an ElevenLabs score (quote).
- **SFX** (studio `sfxlib.py`): room tone, wall clock, scuffs and steps, bag whoosh/thud/slide, heartbeat in the reveal, and the phone buzz (`buzz`, already built).
- **Mix:** `mix.sh` to −14 LUFS and −1.5 dBFS peak. Voice-ducked music and SFX.

## 7. Cost estimate
| Item | Credits | Cash |
|---|---|---|
| Characters, environment, animation, render | 0 | $0 |
| Narration ≈ 55 s (Grady), quote first | ≈ 3.3 | — |
| Robber and Sam lines (≈ 6 s) | ≈ 0.5 | — |
| Music: synthesized (0), or ElevenLabs 60 s | 0 – ≈ 6.8 | — |
| **Total** | **≈ 3.8 (synth score) – ≈ 10.6 (AI score)** | $0 |

**Render compute:**
- ≈ 1,650 frames.
- About 5 s/frame across 3 jobs on this container, so ≈ 2.3 h.
