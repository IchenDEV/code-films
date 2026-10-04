# Workflow and lessons

The first film, 《凡人 / Ordinary》, went through four rounds of iteration (v1 → v4). This document records the method each step used, and the pitfalls hit along the way. It's useful for anyone making a similar "code-generated documentary".

## 1. Content: one source of truth

`films/<name>/script.mjs` holds the bilingual narration (`LINES`) and the shot list (`SHOTS`). Each shot only states:

- which lines it speaks, and the gaps before, between and after them (`lead` / `gap` / `tail`);
- its minimum duration (`min`) and the crossfade from the previous shot (`xf`);
- optional extras: archival caption (`caption`), chapter label (`label`), silence before it (`silenceBefore`), hard cut (`hardOut`).

`engine/pipeline/build_timeline.mjs` turns the **measured** narration durations into absolute times. So rewording a line or switching voices never means re-timing the picture by hand.

## 2. Narration (ElevenLabs)

- **One line at a time, with context.** Every line carries `previous_text` / `next_text`, so the delivery connects naturally. It also means one line can be redone without redoing the rest. Results are cached by a hash of (text, voice, model, settings), so changing one line only costs credits for that line.
- **Choosing voices.**
  - First have candidates read the same passage, measuring pitch, pace and pitch variation for reference.
  - **Always judge them in the full mix (music + reverb).** Dry narration sounds very different from the finished film and can mislead the choice.
  - "Documentary feel" and "epic trailer feel" pull in different directions. Settings that push expressiveness too far tip into exaggeration.
- **Stability.** If it's too high (0.72) the read sounds flat and read-aloud; around 0.4 has enough rise and fall.
- **Pronunciation check.** Feed the synthesized narration back into speech-to-text (`elevenlabs speech-to-text`) and compare with the script. This catches problems like misread characters, or tones and characters a model doesn't know. For Chinese, eleven_v4 is clearly more accurate than multilingual_v2.
- **Trimming silence.** Don't use ffmpeg `silenceremove`; it can cut quiet openings like "女娲" or "银河". `vo_trim.py` cuts by the energy envelope and keeps some margin.
- **Pace control.** `vo_pace.py` slows lines that are faster than documentary pace, using pitch-preserving atempo, and never speeds anything up. Set the cap too low, though (Chinese 4.1 characters/s), and the second half drags. 4.4 ended up as the right value.

## 3. Sound

- **The score is composed in code**: the film's `score.py` arranges it using the instruments in `engine/pipeline/orchestra.py`.
  - A single theme recurs throughout. Each section is arranged by shot name: the ancient-myth section uses pentatonic harp, the cosmic zoom uses a repeating string figure and taiko, and the AI section uses an accelerating arpeggio.
  - A **section-level dynamics curve** applied at the end lets quiet passages be truly quiet and climaxes really build. Without it, the whole score sits at the same loudness.
- **Ducking under narration.** The music drops about 6 dB while narration plays, and the narration sits 7 dB above the music.
- **Final loudness.** The final mix gets two-pass linear loudnorm to -16 LUFS, which leaves the dynamics intact.
- **Transitions.**
  - "A click on every shot change" was too busy.
  - In the end, only the three act changes get a sound: a heavy object hitting the ground, landing exactly as the chapter title appears.
- **The hard cut.** Before the screen scene, everything (music, reverb tails) is zeroed: true digital silence.

## 4. Picture

- **Every frame is a pure function of time.** Shot functions receive `u` (time within the shot), so you can jump to any frame, render in parallel, or spot-check a single frame (`stills.mjs @go+5`).
- **Archival images.** Black-and-white engravings and manuscripts are inverted into glowing lines on black. Color originals keep their color and only get a darkened border. Slow pans and zooms are interpolated in log space, so the zoom speed looks uniform.
- **Check frame by frame.** After every change, render a contact sheet with `stills.mjs` + `contact_sheet.py` and look for overlap, misalignment, unreadable subtitles, etc. Many problems, like the time axis covering the Go board or the code running into the subtitles, are only visible this way.

## 5. Rendering and delivery

- **Rendering.** On a 4-core machine with no GPU, Chromium software rendering runs about 10 frames/s. Encode intermediate files with `veryfast/crf17`; a slow intermediate encode steals rendering CPU and can halve throughput.
- **Delivery.** The master has film grain and is large (about 1.7 GB / 6 minutes). Delivery copies are compressed separately: H.265 is about 45 MB and H.264 about 110 MB, with essentially no visual difference.
- **Run long jobs with `setsid nohup` plus a status file** that writes a timestamped line for each step. Don't use a leftover "done" marker from the previous run as proof the current run has finished.

## 6. Narrative structure (main changes from v1 to v4)

- **v1:** seven acts, typographic subtitles, no voiceover.
- **v2:** reorganized into three dethronements (position, origin, mind), with archival images and ElevenLabs narration added.
- **v3:**
  - added a cold open (a question asked to the computer, with no answer), the cosmic year, and the AI acceleration timeline (47 → 19 → 4 → 2 years → months);
  - added the ability curve, the film revealing that it was made by AI, and a closing three-part callback;
  - narration says "我们" wherever possible.
- **v4:** a more relaxed Chinese delivery, a tighter second half, and the transition clicks replaced by the "landing" sound at the three act changes.
