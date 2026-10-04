# 凡人 · Ordinary

> 科学所做的，或许只有一件事：把我们，从神坛上请下来。
> *Perhaps science has only ever done one thing: it has brought us down from the altar.*

About 6 minutes, in Chinese and English. Narrated by Haoran (Chinese) and Michael Dan (English), both via ElevenLabs.

▶ **Watch**: [Chinese](https://github.com/IchenDEV/code-films/releases/download/ordinary-v1.0/ordinary-zh.mp4) · [English](https://github.com/IchenDEV/code-films/releases/download/ordinary-v1.0/ordinary-en.mp4)

<img src="../../docs/images/stills.jpg" alt="Stills from Ordinary" width="100%">

| Act | Content |
|---|---|
| Cold open | Someone types to a computer: "我们是什么？" No answer |
| Prologue · Fire | Thunder and lightning, the fire's first light, a person looking up at the stars |
| The Altar | Round heaven, square earth; Fuxi and Nüwa; *The Creation of Adam*; the Vitruvian Man |
| First · Place | Ptolemy → Copernicus → Galileo → the zoom out to the cosmos → the cosmic year → the pale blue dot |
| Second · Origin | The Great Chain of Being → Darwin → homologous bones → the genetic code → Huxley's skeletons → the tree of life |
| Third · Mind | Descartes → neurons → machines → Turing, Deep Blue, AlphaGo, AlphaFold → acceleration → the ability curve → this film revealing it was made by AI |
| Epilogue | The screen answers; walking down from the altar; the three dethronements recapped; "我们，只是凡人。" |

## Making this film

```bash
./run.sh ordinary preview          # live preview (works without synthesizing narration)
./run.sh ordinary tts              # narration (needs a logged-in elevenlabs CLI)
./run.sh ordinary timeline         # lay out shots from the measured narration lengths
./run.sh ordinary audio            # sound effects + score + narration
./run.sh ordinary render           # → out/凡人.mp4, out/Ordinary.mp4
./run.sh ordinary compress         # delivery copies H.265 / H.264
```

Archival images: `python3 ../../engine/pipeline/fetch_archive.py` downloads the originals into `archive/`, and `python3 process_archive.py` processes them into `img/` (the processed versions are already in the repo).

## Files

| File | Content |
|---|---|
| `film.json` | Languages, output filenames, narration voices and parameters, speaking-rate cap, preloaded images |
| `script.mjs` | Bilingual narration, on-screen dialogue, chapter titles, archival captions, shot list |
| `events.mjs` | Events inside shots: lightning, neuron spikes, montage cut points, on-screen typing |
| `shots/` | Shot functions for each act |
| `score.py` | Score: a D-minor theme and how each section is arranged |
| `sfx.py` | Sound design: storm, fire, keyboard, spikes, gears, the "landing" thud between acts… |
| `docs/` | Outline, copyedit history, notes on the v3 structural changes |
| `legacy-v1/` | Code for the first version, 《规律之内》 (archived) |

Sources and licenses: [CREDITS.md](CREDITS.md).
