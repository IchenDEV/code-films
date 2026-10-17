# 出处与致谢 · Credits

## 内容来源

全部数字与说法出自 claude.dev 博客：

**How the Claude Code team does code review**，2026-10-15，Addy Osmani、Morgan Westlee Lunt、Qing Wang
https://claude.dev/blog/solving-code-review-at-anthropic/

片中旁白是对原文的转述，不是译文。画面上的出处常驻：竖屏在顶部标题下方，横屏在左上角；长版开场另有一张原文标题卡。

| 片中说法 | 原文依据（节选） |
|---|---|
| Anthropic 的工程师，已经不逐行看代码了 | "At Anthropic, our jobs have moved from reading every diff to the decisions machines are bad at" · 图 E："People moved from reading every diff to the decisions machines are bad at" |
| Claude Code 约九成的代码是 Claude 写的 | "Claude writes about 90 percent of Claude Code's own code" |
| 六月到九月，合并的 PR 翻了一倍多，要回滚的比例降了四成多 | "From June to September, merged pull requests to Claude Code's codebase more than doubled while the share that had to be reverted fell by more than 40 percent." |
| 大仓库每天合并的改动，五月约 2500 次，九月 3 万多次 | "In Anthropic's monorepo, changes landing per day went from about 2,500 in May to more than 30,000 in September this year." |
| Claude Code 在单独的仓库里，压力也不小 | "Claude Code lives in its own repository, separate from the monorepo, but it's seeing a lot of pressure too." |
| 一行一行看，几乎不可能 | "manual, line-by-line code review is incredibly difficult if not impossible" |
| 没有取消审查，把大部分“读代码”交给了机器 | "We didn't remove review. But we did move most of the reading to machines" |
| 审查的两份工作 | "Find and fix issues before they ship" · "Build shared context and codebase understanding across the team" |
| “人看过没有”是粗糙的代替指标；该问会出什么错、该由哪道检查拦下 | "'did a human read the code?' is an imprecise proxy for 'what could go wrong with this change, and which check—automated or human—is the right one to catch it?'" |
| 像拼写检查一样一直在跑 | "Now, review runs continuously, more like spellcheck while you write." |
| 人的时间有两头；这头省了那头涨，等于没省 | "Human time covers both sides of review's cost … Cutting the first doesn't help if the time just shows up in the second." |
| 大多数 PR 最多一个人参与，可以是作者；回滚率、事故率当护栏 | "most pull requests … merge with at most one human in the loop, who can be the author, with no increase in reverts or incidents" · "Revert and incident rates are the guardrail" |
| 六层检查，底下一张回滚的网；每层都会漏，很少能穿过全部 | 图 B："Six layers of checks, with rollback under them" · "Each layer catches some problems and misses others. Few get through all of them, and rollback handles the rest." |
| 第一层：自己跑测试、拿出结果；全新上下文的分身来审 | "ask it to show the output instead of saying it's done. Then a subagent reviews the diff with fresh context." |
| Boris Cherny：验证可能是最重要的一件事，结果好 2–3 倍 | "Boris Cherny, who created Claude Code, has called giving Claude a way to verify its work probably the most important thing … He estimates it makes the final result two to three times better" |
| 从源头改：skill、lint 规则、CLAUDE.md、REVIEW.md；文档出错就是“它在撒谎” | "we fix it at the source: in the skill, with a lint rule, or with updates to instructional files" ·  "for docs it's 'it lies,' for config it's 'it misroutes'" |
| 第二层：几个 AI 找 bug，另一组投票，够多 AI 认可才贴出；只关于风格的丢掉 | "Several agents look for bugs at the same time. Then a separate group votes on each finding, and it only gets posted if enough of them agree it's real. Findings that are only about style, diagnostics, or cleanup get dropped." |
| 标签：重要、小问题、原本就有；老 bug 不算作者的；每条都必须回应 | "Each is tagged Important, Nit, or Pre-existing, so a bug the PR didn't introduce doesn't look like the author's fault." · "Every finding has to be answered." |
| 收到实质性意见的内部 PR：16% → 54% | "the share of internal PRs getting substantive review comments went from 16% to 54%" |
| 安全审查、自动化检查；有意见没解决或亮红灯，不准合 | "A PR can't merge while any finding from the bug review or the security review is still open." · 图 A："Red blocks the merge" |
| PR 里写清怎么测、怎么撤回 | "The PR template asks how the change was tested and how to undo it." |
| 文档零个人、普通改动一个、最高风险两个 | 原文风险分级表（Low / Medium / High） |
| 风险由改动决定、分类器定级；只有受信任的作者能走轻的路径 | "The change sets the tier, not the author. A classifier reads the change and picks its risk tier." · "Only authors on the repo's trusted list get the lighter paths" |
| AI 的批准永远不算人的批准 | "An agent's approval never counts as a person's, either." |
| 谁指挥 AI 写的，谁就算一个审核人 | "On an agent-written PR, the person directing the agent counts as one of the required reviewers, the same as if they'd typed the code themselves." |
| 合并队列、开关、内部先用、分批发布（先 latest 渠道，stable 渠道随后）；关开关不用部署 | "The merge queue re-runs every check against main" · "New behavior usually ships behind a flag to Anthropic employees first" · "Flags turn off without a deploy." |
| 多数问题几分钟就能撤回 | "Flags, reverts and staged releases undo most mistakes in minutes." |
| 原文引用的一位同事：放慢速度能少出错，但主要是因为什么都做得少了 | "One colleague said slowing down does lower your error rate, but mostly because you're doing less of everything. We'd rather get faster at noticing and fixing problems." |
| 每次事故变成考题，每天考一遍；改了提示词、工具或模型，分数涨了才留下 | 图 C：事故 → 专家确认 → 加进题库 → 改审查器 → 每日评测 → "Score went up? keep it; if not, drop it" |
| 作者是 AI 时噪音更贵 | "Noise costs more when the author is an agent. A person can wave off a nit in seconds. An agent fixes it, which means another commit and another round of review." |
| 一个 PR 一晚上改了 50 多轮，直到作者叫停 | "One CLI PR went through more than fifty rounds of review and fixes overnight before its author stopped it." |
| 审查器反复揪出的问题约 59% 第一轮就在了；每一轮多挖出几个老的（这是对审查器的整体统计，不只是那个 50 轮的 PR） | "about 59% of it was code that had been there since the reviewer's first pass. The reviewer was rarely finding new bugs, it was finding a few more old ones each round." |
| 三轮不过换思路；之后只看新改动；指出一类；说过的不再说 | "A round cap. After three rounds, the reviewer asks the author to step back and reconsider the approach." · "Diff-only re-review after the first few passes." · "Flag the class of bug" · "No repeats of findings already posted." |
| 一轮就过 65% → 78%；五轮以上 8.9% → 1.5%；平均 2.08 → 1.32 | 图 D：Pass after one review and fix round · Need five or more rounds · Mean reviews to pass |
| 把资深工程师拽出来抓低级错误，太贵了 | "Pulling a senior engineer out of deep work to catch a routine mistake costs far more than an automated review." |
| 人做的五件事 | "Should we build this at all?" · "Risky code such as billing, the auto-updater and CI workflows." · "Architecture that sets a pattern others will copy." · "Reading the evidence." · "Owning the outcome." |
| 让 Claude 现写一份讲解；一行文案改动几乎教不了什么 | "they ask Claude to write an explainer for exactly that slice" · "A one-line copy change teaches you almost nothing." |
| 团队的默契：你合进去的，你负责；改动小、可撤回、风险越大查得越严、复盘看系统 | "it's a team norm that you usually fix it" · 原文 "You land it, you own it" 一节 |
| 照着做的清单 | 原文 "How you can adopt this process" 一节 |
| 哪些改动不用人看就能合，这条线还在挪 | "letting owners decide which low-risk changes merge on automated checks alone, and that line keeps moving" |
| 从“人看过”到“有人负责” | 本片的概括，依据："We didn't remove review." 与 "A person is accountable for every change that ships, whoever typed it." |

画面里的 PR 编号、代码色条、文案改动（"Sign in" → "Log in"）、机器人与人物都是示意，不是 Anthropic 的真实内容。“合并的 PR”与“要回滚的比例”两组柱子只表示原文给出的相对变化（翻了一倍多、降了四成多），不是实际数值。竖屏常驻标题与封面里的“九成代码 AI 写”都指 Claude Code 自己的代码，不是 Anthropic 的全部代码。“人看得少了，怎么反而更稳？”是开场的设问；原文没有说回滚减少是人看得少造成的，片子后面给出的答案是六层检查与回滚。

和上一部《Anthropic 把 Git 换掉了》（films/scion）同一套画面语言；压力段落的 2500 → 3 万次与上一部出自同一组数据，这篇博客也引用了它。

## 声音

- 中文旁白：ElevenLabs Eleven v4 · Pangge（hFamrilbAE6WDMtWgKvu）
- 英文旁白：ElevenLabs Eleven v4 · Jon - Catalyst（dSByRdUbTGloB7TFA1qD）
- 配乐：ElevenLabs Music（music_v2_5），按段落作曲，四首（短版中 / 英、长版中 / 英）
- 音效：ElevenLabs Sound Effects（eleven_text_to_sound_v2）

## 字体（SIL Open Font License 1.1，许可证在 fonts/licenses/）

- Noto Sans SC（中文字幕、标题）
- Space Grotesk（英文字幕、标题、数字）
- JetBrains Mono（代码、标签）

## 画面

全部由 Canvas 2D 程序逐帧绘制，没有素材图。机器人、小虫与人物是本片原创造型，不是任何品牌的标志。画面与代码：IDEVLAB。
