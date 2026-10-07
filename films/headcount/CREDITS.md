# Credits

## Source

Adapted from the essay 《反对 AI 官僚主义：我们是来解决问题的，不是来模拟人类公司的》. The film condenses its argument and adds its own points: handoffs as lossy compression, three tests for when splitting is worth it (parallel reads with a single writer, a fresh-context reviewer, permission isolation), and the warning that a scheduler can itself become middle management.

## Research cited on screen and in the narration

- Google Research & MIT, *Towards a Science of Scaling Agent Systems: When and Why Agent Systems Work*, arXiv:2512.08296 (Dec 2025). 180 configurations; +80.9% on parallelizable Finance-Agent tasks with centralized coordination, −39% to −70% for every multi-agent variant on sequential PlanCraft tasks. <https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/>

## Further reading behind the added points

- Cognition, *Don't Build Multi-Agents* (share full context; actions carry implicit decisions). <https://cognition.ai/blog/dont-build-multi-agents>
- Walden Yan's follow-up, *Multi-Agents: What's Actually Working*: writes stay single-threaded, reads and verification can run in parallel, reviewers start with a clean context.
- Cemri et al., *Why Do Multi-Agent LLM Systems Fail?* (MAST taxonomy), arXiv:2503.13657.
- Anthropic, *How we built our multi-agent research system* (parallel breadth-first research wins; tightly coupled work like coding is harder). <https://www.anthropic.com/engineering/multi-agent-research-system>

## Narration

Synthesized with [ElevenLabs](https://elevenlabs.io) using library voices *Pangge* (Chinese) and *Michael Dan* (English), model `eleven_v4`. The audio files are not included in this repository; regenerate them with `./run.sh headcount tts` (subject to ElevenLabs' terms).

## Fonts (SIL Open Font License 1.1, bundled as subsets in `fonts/`)

| File | Font |
|---|---|
| `display-zh.ttf` | Smiley Sans 得意黑 |
| `display-en.ttf` | Bebas Neue |
| `body-en.ttf` | Archivo |

Chinese body text uses Noto Sans CJK from the system.

## Everything else

Picture, score, sound design and code are original to this project and released under the MIT License.
