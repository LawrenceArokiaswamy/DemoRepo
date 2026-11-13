---
name: make-video
description: Turns a chosen story into a finished animated science-story Short (round-head characters, one-word captions, fast cuts, music, sound effects) with this folder's engine. Use after /find-story when the user types /make-video and a number, or gives any true story in one sentence.
argument-hint: "<option number from /find-story, or a one-sentence story>"
---

# Make the video

Story: $ARGUMENTS

Work through everything without stopping. Ask only for the voice choice (step 3) and anything that truly blocks you.
`<py>` = `python3` on a Mac, `py` (or `python`) on Windows. All commands run from this folder.

## 1. The story and the facts
- A number → read that option from `topics/latest_options.md`. A sentence → research it first (2+ reliable sources).
  Empty → ask which story and stop.
- Make `stories/<slug>/` and write `facts.md`: the real dates, names and numbers, what is dramatized, the source links.

## 2. The script
Follow `references/formula.md`: the six beats, 110-170 words (45-60 s), one idea per line, every line something you can
show, numbers written as words, `*star*` words for the yellow captions, the arguable twist as the very last line.
Save the plain narration (no stars) as `script.txt`. Show it to the user in a copyable block with the word count.

## 3. The voice (ask once)
"Which voice? 1) Record it yourself on your phone (best for a channel) 2) Free computer voice (good for a test)
3) ElevenLabs (natural, needs your own key)". Then:
- own voice → ask them to save it as `stories/<slug>/voice.mp3` (or .m4a/.wav) and tell you; no word file needed.
- free → `<py> scripts/voice.py stories/<slug>/script.txt` (Windows gives exact word timings; on a Mac the player lines
  the script up with the pauses by itself).
- ElevenLabs → `<py> scripts/voice.py stories/<slug>/script.txt --engine elevenlabs` (key in `keys.txt` or ELEVENLABS_API_KEY).
Never edit or re-time the user's own recording.

## 4. The shot plan and story.js
Read `references/workflow.md`, `references/engine.md` and the example closest to the story (`examples/`). Write the shot
list as the comment at the top of `stories/<slug>/story.js` (one line per shot: the word it starts on, place, camera, who
does what, effect, sound). A new shot every 2-3 s, a sound on every cut, the laugh gets crowd laughter, time jumps get a
`CS.title`, the payoff is the best-looking shot. Build `SHORT` with `CS.shots`, round-head people (`style: "round"`), rich
places, and time everything with `T.w("word")`. New characters or props: write a draw function like the cow and germ
cards in `examples/sprouting-cows/story.js`.

## 5. Pack, look, fix
1. `<py> scripts/pack.py stories/<slug>/story.js stories/<slug>/voice.mp3 -o stories/<slug>/<slug>.html [--words stories/<slug>/words.json]`
2. `<py> scripts/stills.py stories/<slug>/<slug>.html <the middle second of every shot…>` and open every PNG with Read.
3. Fix everything `references/checklist.md` flags (cut-off faces are the most common one: move the camera, not the person),
   repack, look again. Repeat until it passes.

## 6. Deliver
- If `node`, `ffmpeg` and puppeteer-core are available: `node scripts/render.mjs stories/<slug>/<slug>.html --gpu`
  (drop `--gpu` if it fails). Otherwise tell the user: open the HTML in Chrome and press **Export video**.
- Write `stories/<slug>/upload.txt`: 3 title ideas (formula.md patterns, under 50 characters), a short description with
  the sources, 3-5 hashtags.
- Add the story to `topics/used.txt`. Reply with the file paths and one line per shot, and offer the next story.
