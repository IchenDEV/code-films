# Anthropic 不再逐行审代码了 · Who Reviews the Code Now?

> AI 写 90% 的代码，谁来审？
> *AI writes 90% of the code. Who reviews it?*

根据 claude.dev 博客《How the Claude Code team does code review》（2026-10-15）制作：Claude Code 约九成的代码是 Claude 写的；六月到九月，合并的 PR 翻了一倍多，要回滚的比例反而降了四成多。他们没有取消审查，而是把大部分“读代码”交给机器，用六层检查加一张回滚的网，把人的时间留给机器不擅长的决定。出处逐条见 [CREDITS.md](CREDITS.md)。

这是《Anthropic 把 Git 换掉了》（films/scion）的姊妹篇：同一套画面语言，那篇结尾问“下一个被 AI 挤爆的是什么”，这篇讲代码审查。

## 两个剪辑、五个成片

两个剪辑都有旁白，都是一条完整录音（中文 Pangge、英文 Jon，Eleven v4，语气平和）；字幕逐字高亮，关键词念到时变金色，画面上的数字同时“砸”下来。

| 成片 | 平台 | 画幅 | 片尾互动 |
|---|---|---|---|
| `CodeReview_抖音.mp4` | 抖音、小红书 | 9:16 · 中文 | 评论区打数字 |
| `CodeReview_视频号.mp4` | 视频号 | 9:16 · 中文 | 转给你们组负责 Code Review 的人 |
| `CodeReview_TikTok_Reels_Shorts.mp4` | TikTok、Instagram Reels、YouTube Shorts | 9:16 · 英文 | Comment your number |
| `CodeReview_B站.mp4` | B 站 | 16:9 · 中文 | 弹幕打数字 |
| `CodeReview_YouTube.mp4` | YouTube | 16:9 · 英文 | Tell me in the comments |

时长以 `node tools/timeline.mjs` 的输出为准。各平台的标题、简介、话题、置顶评论与测试方法见 [发布文案.md](发布文案.md)。

## 结构

短版是一条故事线：结论 → 反常的数 → 压力 → 换一个问题 → 六层筛子 → 一晚 50 轮（中段再钩一次）→ 新规矩与结果（高潮）→ 人留在哪 → “你合进去的，你负责” → 投票。长版在同一条线上补全细节：

| 段落 | 讲什么 | 配乐 |
|---|---|---|
| 开场 | 不再逐行看；九成是 Claude 写的；合并翻倍、回滚比例降四成多 | 第一拍就满能量 |
| 人看不过来了 | 2500 → 3 万次 / 天；Claude Code 的单独仓库；读代码交给机器 | 压力上升 |
| 审查是做什么的 | 两份工作；换一个问题；像拼写检查一直在跑 | 收住，长音 |
| 最稀缺的是人 | 两头的时间；最多一个人；护栏 | 收住，带一点紧张 |
| 六层检查 | 筛子总览；每层都会漏 | 稳定推进 |
| ①–⑥ | 自己先验证（Boris Cherny 的话）、CLAUDE.md / REVIEW.md、AI 审查与投票、标签、16% → 54%、安全与自动化、按风险批准、合并队列、开关、回滚、同事的话 | 稳定的律动 |
| 让 AI 审得更好 | 事故变考题；噪音更贵 | 思考 |
| 一晚 50 轮 | 50+ 轮；59% 是老代码；新规矩 | 夜晚、带点荒诞 |
| 结果 | 65% → 78%、8.9% → 1.5%、2.08 → 1.32 | 全片最响 |
| 人留在哪 | 五件事；现写讲解；你合进去的，你负责 | 温暖 |
| 怎么照着做 | 一张清单 | 踏实 |
| 谁在审 | 这条线还在挪；从“人看过”到“有人负责” | 悬而未决 |

## 视觉

深蓝蓝图上的扁平动态图形（沿用上一部）：橙色小机器人是写代码的 Claude，紫色是审查的 AI，红色小虫是问题，薄荷绿是通过，金色是数字。本片的标志画面是“六层筛子”：六块斜放的玻璃板，虫子往下掉，大多在前几层被拦住，极少数落进最底下回滚的网。全部由 Canvas 2D 程序绘制。

## 制作

```bash
./run.sh code-review tts         # 旁白（短版 / 长版 × 中 / 英），整条一次合成、转写核对、按段落分开，并排时间轴
./run.sh code-review music       # 作曲（需要已登录、带 music_generation 权限的 elevenlabs CLI）+ 铺底长音
./run.sh code-review sfx         # 音效库
./run.sh code-review mix         # 混音 → out/mix/*.wav（-14 LUFS），检查掉空与跳变
./run.sh code-review smoke       # 每个转场逐帧画一遍
./run.sh code-review render      # → out/deliver/*.mp4（一次一个版本；磁盘紧时先看 df -h /）
./run.sh code-review covers      # → out/deliver/covers/
./run.sh code-review extras      # → out/deliver/*.srt、chapters.json
./run.sh code-review stills douyin @sieve+3 @night%90 --sheet
./run.sh code-review preview douyin
```

字体裁剪：`SRC=<放 NotoSansSC.ttf / SpaceGrotesk.ttf / JetBrainsMono.ttf 的目录> SUBSET_FONT_DIR=<装了 subset-font 的目录> node make_fonts.mjs`（三个都是 Google Fonts 的可变字体，OFL）。

## 文件

| 文件 | 内容 |
|---|---|
| `script.mjs` | 短版 24 句、长版 61 句双语旁白（镜头、段落、关键词）、旁白设置与读音替换、五个平台版本、画面文字（中 / 英） |
| `web/engine.js` | 背景、光、形状、文字、数字砸落与盖章、小机器人、人、图标 |
| `web/main.js` | 镜头调度与转场、关键词上的镜头冲击、逐字高亮字幕、竖屏常驻标题与进度条、出处与章节 |
| `web/shots/a.js` | 本片道具（代码面板、小虫、放大镜、PR 卡片）；代码瀑布、九成、反常的数、压力、换一个问题、两份工作、拼写检查、人的时间 |
| `web/shots/b.js` | 六层筛子、自己先验证、Boris 的话、CLAUDE.md / REVIEW.md、AI 审查与投票、标签、16% → 54%、安全与自动化、按风险批准、合并与回滚、同事的话 |
| `web/shots/c.js` | 考题循环、一晚 50 轮、新规矩、结果、人留在哪、讲解、你合进去的你负责、清单、结尾、片尾投票 |
| `web/cover.js` | 各平台封面 |
| `tools/` | 与上一部相同的流水线：旁白、作曲、铺底、音效、混音、检查、时间轴、渲染、封面、字幕与章节、截帧、冒烟测试 |
