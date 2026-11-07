# VO script: "America just voted. AI stocks just fell. Connected?"

For: Lorenzo • AI in 60 Seconds (@lorenzo_ai_unplugged). 14 lines, about 150 spoken words (number words such as "five and a half" count individually; about 140 without them). About 47 s of speech, film about 53 s.
Voice in this cut: **Fish Audio**, model `s2-pro`, library voice "Explainer" (id `3e8a237e7b5d4eaab50bd9e05053d70e`), energetic explainer read at speed 1.07 (n11 at 0.95 for the slow question).
Each line is one Fish call with inline delivery tags (`[excited]`, `[pause]`, `[short pause]`, …) and the bold words in capitals; the lines are stitched into `take.wav` with designed gaps (0.75 s of silence after n11) and the film is built with `./build.sh --vo take.wav`. The tagged script is `fish_vo.json`; regenerate with `python3 ../tools/fish/gen.py .` (add line ids to retake only those) then `$LIB/.venv/bin/python ../tools/fish/stitch.py .`. Every line was checked with Whisper small.en. The earlier scratch voice was Kokoro am_puck (`./build.sh` with no options still builds it).

## How to read it
- A calm-urgent news read: like the first minute of a good evening bulletin explained to a smart 10-year-old. Steady, clear, never shouting, never selling.
- Strictly neutral on the election line: same tone you'd use for a weather report. No smile, no frown on "Democrats won".
- **Bold** = lean on that word. `/` = short breath (about 0.2 s). `//` = real pause (about 0.5 s). `[SILENCE]` = stop completely.
- The three "Reason one / two / three" lines are the spine of the film: give each "Reason…" a tiny lift, like turning a page.
- The everyday comparisons (brick maker, lemonade stand, candy line) are lighter and warmer, almost a smile.
- Timings are where each line starts in the current cut. You don't have to hit them: the build re-times everything to your recording. Aim for about 47 s of speech.

## The script

| # | Starts | Beat | Line (as spoken) |
|---|---|---|---|
| n1 | 0.3 s | HOOK | America just **voted**. / AI stocks just **fell**. // **Connected?** |
| n2 | 3.6 s | the result (neutral, one beat) | Tuesday, Democrats won the **House** and **Senate**, / AP says, / with a few races **still counting**. |
| n3 | 8.6 s | the drop | Thursday, / the Nasdaq fell **five and a half percent**. |
| n4 | 11.3 s | WHY, reason 1 | So **why?** // Reason **one**: / AI lives in giant computer warehouses, / called **data centers**. |
| n5 | 16.4 s | reason 1, cause → effect | Investors fear the election could **slow** building them. / **Fewer** data centers, / fewer **chips** sold. |
| n6 | 21.4 s | comparison | Like a **brick maker** / hearing the town might stop new **houses**. |
| n7 | 24.4 s | WHY, reason 2 | Reason **two**: / big tech is spending **huge** sums on AI, / and profits look **slower**. |
| n8 | 28.7 s | comparison | Like a **lemonade** stand / that's worth **less** once sales slow down. |
| n9 | 32.1 s | WHY, reason 3 | Reason **three**: / worry about higher **interest rates**. / **Safe** savings pay more, / so some money leaves **risky** stocks. |
| n10 | 38.0 s | comparison | Like kids leaving the **candy** line / when the **ice-cream truck** shows up. |
| n11 | 41.6 s | the question | So, / did the **election** cause it? // [SILENCE ~0.5 s] |
| n12 | 43.5 s | the verdict | **Partly.** / It was Thursday's **spark**. / But the slide started **before** anyone voted. |
| n13 | 48.0 s | loop-back | **Connected?** / Yes. / But not the **whole** story. |
| n14 | 50.2 s | CTA | Follow for more. |

On screen at the end: **NOT FINANCIAL ADVICE** (also small, bottom-left, through the whole market section).

## Recording tips
- Phone or USB mic, a hand-span from your mouth, in a soft room (a closet full of clothes works well). No music, no fan.
- Either record the whole script in one take, or one file per line (`n1.wav` … `n14.wav`). Leave about a second of silence at the start and end.
- Leave a clear gap of **at least 0.6 s after line n11** ("did the election cause it?"): the film drops to dead silence there before "Partly."
- Say "five and a half percent", not "five point five".
- Then run `./build.sh --vo myvoice.wav` (one take, Whisper finds every line) or `./build.sh --vo-dir mytakes/` (one file per line).
