# Credits

## Source

Adapted from the essay 《从写代码，到让 AI 指挥 AI：我们这五年是怎么开发软件的？》. The film keeps its constraints: it records what had already happened by October 2026 rather than predicting the future, and it keeps the historical distinction that orchestrator-workers architectures existed in 2024, while 2026 is when models' engineering ability, verification and execution environments made them a working way to build software.

## Facts on screen (checked against the primary sources)

- GitHub Copilot technical preview, 2021-06-29. <https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/>
- GitHub Copilot Chat preview (part of Copilot X), 2023-03-22. <https://techcrunch.com/2023/03/22/githubs-copilot-goes-beyond-code-completion-adds-a-chat-mode-and-more/>
- Devin, 2024-03-12. <https://cognition.ai/blog/introducing-devin>
- Cursor 0.37, Composer multi-file editing (beta), 2024-07-13. <https://cursor.com/changelog/0-37-x>
- Cursor 0.43, early agent in Composer, 2024-11-24. <https://cursor.com/changelog/0-43-x>
- Anthropic, *Building Effective Agents* (orchestrator-workers), 2024-12-19. <https://www.anthropic.com/engineering/building-effective-agents>
- Claude Code research preview, 2025-02-24. <https://www.anthropic.com/news/claude-3-7-sonnet>
- OpenAI Codex CLI, 2025-04-16. <https://github.com/openai/codex>
- OpenAI Codex cloud agent, parallel tasks in isolated sandboxes, 2025-05-16. <https://openai.com/index/introducing-codex/>
- OpenAI Codex app, 2026-02-02. <https://openai.com/index/introducing-the-codex-app/>
- OpenAI, *Harness engineering*, 2026-02-11: about a million lines of code over five months, none written by hand. <https://openai.com/index/harness-engineering/>
- OpenAI, Symphony, 2026-04-27: context switching across agent sessions became the bottleneck. <https://openai.com/index/open-source-codex-orchestration-symphony/>
- Cursor Projects, 2026-09-10: a coordinator agent that writes no code. <https://cursor.com/changelog/projects>

Product names appear as text only; no logos are used. The year ruler and the date tags on screen come from one list (`MARKS` in `script.mjs`), so the ruler always points at the date of the event being shown; the only backward jump is the deliberate flashback to December 2024.

## Narration, score and sound effects

Generated with [ElevenLabs](https://elevenlabs.io): narration by library voices *Pangge* (Chinese) and *Jon – Catalyst* (English) on `eleven_v4`; score with `music_v2_5`; sound effects with `eleven_text_to_sound_v2`. The audio files are not included in this repository; regenerate them with the steps in the README (subject to ElevenLabs' terms).

## Fonts (SIL Open Font License 1.1, bundled as subsets in `fonts/`)

| File | Font |
|---|---|
| `display-zh.ttf` | Smiley Sans 得意黑 |
| `black-en.ttf` | Archivo Black |
| `num.ttf` | Bebas Neue |
| `mono.ttf` | JetBrains Mono |
| `ui.ttf` | Inter |

Chinese body text uses Noto Sans CJK from the system.

## Everything else

Picture, sound design, mixing and code are original to this project and released under the MIT License.
