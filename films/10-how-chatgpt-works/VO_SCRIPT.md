# VO script: "What happens in the second after you hit Enter on ChatGPT"

For: Lorenzo • AI, Money & the Future (@lorenzo_ai_unplugged). 133 words, 37.6 s of speech, film 44.4 s.

**How to read it**
- Talk to one friend across a table, not to "an audience". Curious and a little amazed: the tone is "wait till you see this", not "lecture".
- **Bold** = lean on that word (a little louder, a little longer). Don't punch every bold word equally; the first one in each line matters most.
- `/` = a short breath (about 0.2 s). `//` = a real pause (about 0.5 s). `[SILENCE]` = stop completely.
- Contractions stay contractions ("doesn't", "there's", "wasn't").
- Timings are where the line starts in the current cut. You don't need to hit them: the build re-times the whole film to your recording. Aim for roughly the same total (about 38 s of speech) so the shots don't get too long or too short.

**Recording tips**
- Phone or USB mic, about a hand-span from your mouth, in a room with soft stuff (a closet full of clothes is ideal). No music, no fan.
- Record the whole script in one take, OR one file per line (`n1.wav` … `n12.wav`). Leave about one second of silence at the start and end.
- Leave a clear gap (at least 0.6 s) between line 9 and line 10: the film drops to dead silence there before the twist.
- Then: `./build.sh --vo myvoice.wav` (one take) or `./build.sh --vo-dir mytakes/` (per-line files).

| # | Starts | Length | Beat | Line (as spoken) |
|---|---|---|---|---|
| n1 | 0.3 s | 5.8 s | HOOK | The question you just asked ChatGPT / set off **billions** of calculations, / for **every** word of the answer. |
| n2 | 6.5 s | 0.9 s | "slow-mo" | Let's **slow** it down. // |
| n3 | 7.6 s | 1.6 s | Enter | **Zero** milliseconds. / You hit **Enter**. |
| n4 | 9.4 s | 3.2 s | Tokens | Your words get **chopped** into **tokens**, / and each one becomes a **number**. |
| n5 | 13.0 s | 3.7 s | Map of meaning | Each number lands on a **map of meaning**, / where **king** sits right next to **queen**. |
| n6 | 16.9 s | 3.4 s | Data centre | Your prompt **races** to a data centre. / **Thousands** of chips light up. |
| n7 | 20.6 s | 3.5 s | Attention | Then, / **attention**. / Every word looks at the **others**, / to work out what you **mean**. |
| n8 | 24.3 s | 2.4 s | Prediction | It **doesn't** look up an answer. / It **guesses** the next word. |
| n9 | 27.0 s | 2.7 s | Streaming | It picks **one**, / then guesses **again**, / one piece at a time. // |
| | 29.9 s | 0.5 s | | **[SILENCE]** (music and effects drop to zero) |
| n10 | 30.4 s | 0.8 s | TWIST | Here's the **twist**. / (land it low and quiet, not shouted) |
| n11 | 31.7 s | 6.5 s | Twist | There's **no** answer stored inside. / It's the world's most powerful **autocomplete**, / trained on **mountains** of text from the internet. |
| n12 | 38.5 s | 3.1 s | Loop-back | That reply **wasn't** looked up. / It was **predicted**. // Follow for more. |

**Delivery notes per beat**
- n1: the hook. Start mid-energy and rise to "billions". Don't rush "for every word of the answer": it's the payoff of the sentence.
- n2: drop your voice, almost conspiratorial. This is the "now let's slow down" moment from the reference.
- n3: "Zero milliseconds" slowly, like a countdown voice; "You hit Enter" crisp (a click sound lands on "Enter").
- n4–n7: steady build, a little faster each line. Smile on "king sits right next to queen".
- n8: a small pivot. "It *doesn't* look up an answer" is the first surprise; let "guesses" land.
- n9: speed up slightly into the silence, as if you're about to reveal something.
- n10: after the silence, low and certain.
- n11: the line people will quote. "World's most powerful autocomplete" is the money phrase: slow down on it.
- n12: echo the hook. Short pause, then a warm, casual "Follow for more".

**Scratch voice used in the current cut:** Kokoro `am_puck`, speed 1.12, one Kokoro call per line (full sentences with commas for phrasing), laid out with 0.22–0.45 s gaps. Every line passes the speech-to-text check (`asr_check.py`, base.en).
