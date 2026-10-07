# 编制 · Headcount

> 任务应当催生组织，而不是编制滋生任务。
> *Let the work create the team. Not the headcount create the work.*

About 4½ minutes in Chinese (4:38) and 5¼ in English (5:17). An essay film against AI bureaucracy: multi-agent systems that copy a company's org chart, then pay compute for agents to report to each other. Narrated by Pangge (Chinese) and Michael Dan (English) on ElevenLabs Eleven v4.

<img src="../../docs/images/headcount-stills.jpg" alt="Stills from Headcount" width="100%">

The picture is a constructivist paper collage made in code: cream paper, black and red cut-outs with hard shadows, a little kraft paper. **Black squares are fixed desks. Red circles are workers that appear for a task and disappear when it's done.**

| Part | Content |
|---|---|
| Title | 编制 / HEADCOUNT: a red wedge knocks a grid of black desks askew |
| Cold open | A login bug; an org chart of six desks drops in; memos fly ("Any update?"); one red circle fixes it in a straight line; the org chart is stamped into the system prompt |
| 01 · Headcount | Roles, layers, approvals and reports circling the untouched problem; nameplates hung first, every task stopping at every desk; "why here?" |
| 02 · The Handoff Tax | +81% on parallel work vs −39% to −70% step by step (Google Research & MIT, 180 configurations); an intent losing its points at each desk; a tower of coordination over a tiny bug |
| 03 · Just in Time | The tower falls; a scheduler and its four questions; an instance spawned with a lens, a log and an hourglass, reclaimed, leaving only evidence |
| 04 · Three Reasons | *The film's own addition.* Many eyes read, one pen writes (or merges conflict); a fresh eye on a blank page and a balance, "a check, not division of labor"; a locked wall between the production database and the open web; none apply → don't split |
| 05 · Not a Caste | Models racing at different speeds and prices, pinned into a pyramid of job titles, crossed out; the execution spec card |
| 06 · Reclaim | New evidence: a branch grows, two merge, two are cut and the budget fuse stops; the scheduler grows a desk and turns square (bureaucracy at a new desk); records, results, and the person who owns the goal |
| Ending | Time cards, ties and masks fly off an office tower; a red task with a ring of workers blooming and dissolving |

## What the film adds to the essay

The essay argues for "just-in-time" organization over fixed roles. The film agrees, and adds four things from current practice:

1. **The real cost of a handoff is distortion, not tokens.** Each retelling is lossy compression; downstream gets the summary and loses upstream's implicit decisions (Cognition's "share full context; actions carry implicit decisions").
2. **A concrete test for splitting.** Only split when (a) the work is truly parallel: reads can fan out, but writes keep one pen; (b) you need a reviewer with a fresh context, which is a check and balance rather than a division of labor; or (c) you need to isolate permissions. Otherwise, don't split.
3. **The scheduler is not immune.** Once it asks for status reports and assigns work to itself, the bureaucracy is back at a new desk.
4. **Responsibility doesn't get garbage-collected.** It lives in traceable records, checkable results and the person who owns the goal.

Sources are listed in [CREDITS.md](CREDITS.md).

## Making this film

```bash
./run.sh headcount preview
./run.sh headcount tts        # narration (needs a logged-in elevenlabs CLI)
./run.sh headcount timeline
./run.sh headcount audio
./run.sh headcount render     # → out/编制.mp4, out/Headcount.mp4
```

The subset fonts are in `fonts/`. To rebuild them, download the three fonts into `$SRC`, install `subset-font` with npm in any directory, then run `SRC=… SUBSET_FONT_DIR=… node make_fonts.mjs`.

## Files

| File | Content |
|---|---|
| `script.mjs` | Bilingual narration, chapter tabs, shot list |
| `cstyle.js` | The collage engine: paper, cut-outs with hard shadows, desks, memos, agents, eyes, clocks, subtitles, chapter tabs |
| `shots/part1.js` … `part4.js` | The shots: cold open and 01; 02–03; 04–05; 06 and the ending |
| `score.py` | D minor "office march" (plucked bass, staccato piano, ticks) that opens into F major for just-in-time, returns detuned when the scheduler grows a desk, and resolves in F |
| `sfx.py` | Paper slaps, a rubber stamp, memo flutters, clock ticks, scissors, archive slips |
