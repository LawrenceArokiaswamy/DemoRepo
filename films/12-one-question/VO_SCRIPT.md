# VO script: "One question" (how ChatGPT answers you)

For: Lorenzo • AI in 60 Seconds (@lorenzo_ai_unplugged). 180 words, about 45 s of speech, film about 54 s.

## How to read it
- You're telling a 10-year-old about something amazing that just happened inside their own phone. Curious, warm, a little cheeky. Smile while you talk: people can hear it.
- **Bold** = lean on that word (a bit louder and longer). Lean hardest on the first bold word in each line.
- `/` = a short breath (about 0.2 s). `//` = a real pause (about 0.5 s). `[SILENCE]` = stop completely.
- Keep the contractions ("Let's", "doesn't", "Here's").
- The timings are where each line starts in the current cut. You don't have to hit them: the build re-times the whole film to your recording. Aim for about the same total (about 45 s of speech) so no shot gets too long or too short.

## Recording tips
- Phone or USB mic, a hand-span from your mouth, in a soft room (a closet full of clothes works well). No music, no fan.
- Either record the whole script in one take, or one file per line (`n1.wav` … `n21.wav`). Leave about a second of silence at the start and end.
- Leave a clear gap of **at least 0.6 s between line 18 and line 19**: the film drops to dead silence there before the payoff.
- Leave a small gap (about half a second) after "twinkle, twinkle, little…" so viewers can shout "star" in their heads.
- Then run `./build.sh --vo myvoice.wav` (one take) or `./build.sh --vo-dir mytakes/` (one file per line).

## The script

| # | Starts | Beat | Line (as spoken) |
|---|---|---|---|
| n1 | 0.2 s | HOOK | ChatGPT gets about **two and a half billion** questions / a **day**. |
| n2 | 3.7 s | the promise | Let's follow / just **one**. |
| n3 | 5.0 s | the thumb types | So, / can I eat **pizza** for **breakfast**? // **Send!** (read the question like you're the one typing it; "Send!" is a happy little tap) |
| n4 | 7.7 s | dive into the phone | Your words become / **ones** and **zeros**. (a bit hushed, like you're sneaking inside the phone) |
| n5 | 9.6 s | the chip | The phone's **brain** / packs them up, |
| n6 | 11.1 s | the antenna | and the **antenna** / fires them **out!** |
| n7 | 12.9 s | the journey | **Zap!** / To a **tower**, / down a cable of **light**, / into a building full of **computers**. (speed up through the list, like you're racing with it) |
| n8 | 16.7 s | data centre | Computers only understand **numbers**, |
| n9 | 18.5 s | LEGO bricks | so your question gets **chopped** into little **LEGO** bricks, / each with a **number**. |
| n10 | 22.2 s | reading together | Then, / it reads **all** the words **together**. |
| n11 | 24.0 s | the funny wrong guess | **Pizza**, / plus **breakfast**… // a map to a pizza shop? // **Nope!** / A **food** question. (play the "map to a pizza shop?" like a silly idea; "Nope!" is the laugh) |
| n12 | 28.0 s | the surprise | Here's the **surprise**: // it **doesn't** look the answer up. |
| n13 | 30.3 s | one word at a time | It writes **one** word at a time, / always guessing the most likely **next** word. |
| n14 | 34.1 s | the game | Like: / twinkle, twinkle, little… // (leave the gap) |
| n15 | 35.9 s | the payoff of the game | **Star!** // It learned that by reading a **gigantic** pile of **text**. |
| n16 | 39.1 s | race back | Then, / the answer **zooms** all the way **back!** |
| n17 | 40.9 s | the reply | Technically, **yes!** // Just maybe add some **fruit**. (read it like the friendly reply on screen) |
| n18 | 43.3 s | the clock stops | All of that, / in about **two seconds**. // |
| | 44.8 s | | **[SILENCE]** about half a second: music and effects drop to zero |
| n19 | 45.4 s | the payoff | It just did that **for you**… / and about **two and a half billion** more times **today**. (slower, a little amazed) |
| n20 | 49.2 s | the laugh | And it has **never** once tasted a pizza. (deadpan, let the joke land by itself) |
| n21 | 51.4 s | close | **Follow** for more. (warm, casual) |

## Delivery notes
- n1–n2: start with energy; "just one" drops a little, like a secret.
- n3: you *are* the person typing. A tiny question in your voice, then a bright "Send!".
- n4–n7: the dive. Each line is a step deeper, then "Zap!" kicks off a quick race.
- n8–n11: teacher mode, but fun. Smile on "LEGO". "Nope!" should sound like you're shaking your head.
- n12–n15: "the surprise" is the most important idea in the film: slow down on "doesn't look the answer up". Then play the twinkle game for real.
- n16–n18: fast again, then a satisfied "about two seconds".
- n19–n21: after the silence, slower and warmer. n20 is the joke: flat and dry works best.

**Scratch voice in the current cut:** Kokoro `am_puck` (speed 1.15, long lines 1.2), one Kokoro call per line, laid out with 0.12–0.55 s gaps. Every line passes the speech-to-text check (`asr_check.py`, base.en). Line wording was tuned so the scratch engine doesn't clip first words ("So, can I…", "Then, it reads…").
