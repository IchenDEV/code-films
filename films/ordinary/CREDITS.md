# Credits

## Archival images (public domain, via Wikimedia Commons)

The originals are downloaded by `pipeline/fetch_archive.py`; `film/img/` contains processed versions (resized, cropped; engravings inverted to glowing lines).

| In the film | Source | Commons file |
|---|---|---|
| Fuxi and Nüwa | Silk painting, Tang dynasty, Astana (Xinjiang) | `Anonymous-Fuxi and Nüwa.jpg` |
| The Creation of Adam | Michelangelo, c. 1511 | `Michelangelo - Creation of Adam (cropped).jpg` |
| Nut, goddess of the sky | Ancient Egyptian papyrus (British Museum) | `Geb, Nut, Shu.jpg` |
| Vitruvian Man | Leonardo da Vinci, c. 1490 | `Da Vinci Vitruve Luc Viatour.jpg` |
| Ptolemaic / Copernican systems | Andreas Cellarius, *Harmonia Macrocosmica*, 1660 | `Cellarius Harmonia Macrocosmica - …` |
| The Flammarion engraving | 1888 | `Flammarion.jpg` |
| Pale Blue Dot | NASA/JPL-Caltech, Voyager 1, 1990 (2020 remaster) | `Pale Blue Dot from Voyager 1 - PIA23645.png` |
| The Great Chain of Being | Diego de Valadés, *Rhetorica Christiana*, 1579 | `The Great Chain of Being (1579).jpg` |
| "I think" | Charles Darwin, Notebook B, 1837 | `Darwin Tree 1837.png` |
| Skeletons of apes and man | T. H. Huxley, *Evidence as to Man's Place in Nature*, 1863 | `Huxley - Mans Place in Nature.jpg` |
| The pineal gland | René Descartes, *Treatise of Man* | `Descartes mind and body.gif` |
| Purkinje cells | Santiago Ramón y Cajal, 1899 | `PurkinjeCell.jpg` |

Exact URLs: `pipeline/archive_sources.tsv`.

## Narration

The narration was synthesized with [ElevenLabs](https://elevenlabs.io) using library voices *Haoran* (Chinese) and *Michael Dan* (English). The audio files are not included in this repository; regenerate them with `./run.sh tts` (subject to ElevenLabs' terms).

## Fonts

Noto Serif CJK / Noto Sans CJK (SIL Open Font License), Nimbus Roman / Nimbus Mono PS (URW base35), DejaVu Sans Mono. They are loaded from the system and are not bundled.

## Everything else

Animation, score, sound design and pipeline code are original to this project and released under the [MIT License](LICENSE).
