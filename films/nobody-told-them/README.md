# 初生牛犊 · Nobody Told Them

> 未来会很怪。也许，还很酷。
> *The future is going to be weird. And probably pretty cool.*

About 4 minutes, in Chinese and English (Chinese 3:56, English 4:18). Adapted from a talk by Theo (t3.gg) about who benefits as AI models improve. Narrated in third person via ElevenLabs by Pangge (Chinese) and Michael Dan (English), both on Eleven v4.

<img src="../../docs/images/nobody-told-them-stills.jpg" alt="Stills from Nobody Told Them" width="100%">

The picture is a risograph zine made in code: two spot inks, fluorescent pink and riso blue (plus a little yellow), overprinted on cream paper with fixed ink grain, halftone screens and slightly misregistered plates. Each shot draws into separate ink layers that are multiplied onto the paper.

| Part | Content |
|---|---|
| Title | 初生牛犊 / NOBODY TOLD THEM, a little calf trotting across |
| 01 · The Ladder | Three rungs: help with what you know (a bubble), what you don't (a crab carrying Rust parcels to real users), the untouchable (a diver inside a sunken castle of gears, Super Mario 64) |
| 02 · The Tide | Three tubes for developers, technical people, non-technical people, filling unevenly as Copilot, tools, Opus 4.5, Fable 5 and Opus 5.5 are stamped; a childhood map carried into a new game; question marks turning into stars for mom |
| 03 · The Weirdos | Identical bricks under a chili pepper; Zapier tangles and 40,000 OBS layers; the .env box whose boundaries move; a melody learned wrong that becomes a new sound |
| 04 · Throw It Away | Rockets that sometimes fizzle; a 2,000-line PR hugged versus a crumpled try in the bin; the crab building a tower in under 20 hours |
| 05 · The Goal | A bullseye; the fancy Zsh shell set down for the plain Bash shell, for the agents |
| 06 · I Was Wrong | A fence of "doesn't belong together" and a kid with an Ubuntu disc vaulting it; the stickers that will matter; a weird, joyful mashup |

## Making this film

```bash
./run.sh nobody-told-them preview
./run.sh nobody-told-them tts        # narration (needs a logged-in elevenlabs CLI)
./run.sh nobody-told-them timeline
./run.sh nobody-told-them audio
./run.sh nobody-told-them render     # → out/初生牛犊.mp4, out/NobodyToldThem.mp4
```

The subset fonts are in `fonts/`; `./make_fonts.sh` rebuilds them (needs fonttools).

## Files

| File | Content |
|---|---|
| `script.mjs` | Bilingual narration, chapter stickers, shot list |
| `rstyle.js` | The risograph engine: paper, ink layers, grain, halftones, misregistration, knockouts, figures and props, subtitles |
| `shots/part1.js` … `part5.js` | The shots, chapter by chapter |
| `score.py` | A playful score in A minor / C major at 104 bpm: piano staccato, harp, short-bow bass, a little synth arpeggio |
| `sfx.py` | Press thunks, sticker pops, bubbles, crumpled paper, rockets, gears |
