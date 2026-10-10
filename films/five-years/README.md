# 五年 · 从写代码，到让 AI 指挥 AI

> 从开发者亲自操作代码，到 Agent 自主组织软件开发，这条路是怎么一步一步走过来的。
> *From writing code to AI directing AI: five years of how we build software.*

一部记录片，不是预测：只讲截至 2026 年 10 月已经发生的事。一个脚本、两个剪辑、六个平台成片：

| 版本 | 平台 | 画幅 | 时长 |
|---|---|---|---|
| 长版 · 中文 | B 站 | 16:9 | 5:09 |
| 长版 · English | YouTube | 16:9 | 5:29 |
| 短版 · 中文 | 抖音 / 视频号 | 9:16 | 1:24 / 1:25 |
| 短版 · 中文 | 小红书 | 3:4 | 1:23 |
| 短版 · English | YouTube Shorts | 9:16 | 1:17 |

## 这一部改了什么

之前几部片子的反馈是：慢，冲击力不够，前三秒抓不住人。这一部针对性地改了：

- **第一帧就在动。** 冷开场直接从上千个光点里高速穿出，旁白第一句在 0.1 秒开口：“你看到的每一个光点，都是一个正在写代码的 AI。”然后倒带回 2021 年的一个光标。没有黑场淡入，没有片头卡。
- **画面是“渲染感”的。** 深色空间里的光：3D 光点群、等轴测的代码城市、辉光（bloom）、粒子爆发、镜头冲击和抖动、重击式大字。琥珀色是人，青色是 AI，白紫色是协调者。转场是快切、甩镜、缩放和故障闪，三到五秒一个新画面。
- **旁白更像人说话。** 仍用 Pangge（Eleven v4），但改成按段落整段合成（带上下文），而不是一句一句拼；脚本写成口语，加了“好家伙”“嗯……”“你呢？”，并用 v4 的语气标签 `[laughs]` `[sighs]` `[curious]` `[playful]` 指导表演，不进字幕。英文版用 Jon（Catalyst）。所有段落都转写回来核对过。多音字逐个排查：能改写的改写（“写句注释”“做很多事”“一键改名”），必须保留的词只在送给合成的文本里换成同音字（协调→协条、一行→一杭、弹幕→蛋幕，见 `script.mjs` 的 `SAY`），字幕仍是原文。
- **真正的配乐。** ElevenLabs Music 按时间轴作曲：段落边界取自实测的镜头（片名重击、协调者接过目标的那一下），混音时再强制“落地前静一秒”，配乐在旁白下自动退让约 9 dB。音效（键盘、Tab 键、提示音、心跳、印章、重击……）全部挂在画面的对位点上。整体 -14 LUFS。
- **年代不会对不上。** 顶部年份标尺和角落的日期标签来自同一份 `MARKS`，每个日期都对照原始发布核实过（见 [CREDITS.md](CREDITS.md)）。
- **为平台各做一版。** 竖屏有常驻标题条和逐字高亮的大字幕；主体和字幕都落在视频号 6:7 的安全区内；小红书是 3:4；结尾互动语按平台不同（评论区 / 弹幕 / 转发）。封面、SRT、章节和文案见 [发布文案.md](发布文案.md)。

## 结构（长版）

| 段落 | 内容 |
|---|---|
| 冷开场 | 上千个光点 = 上千个 AI，指挥它们的也是 AI；倒带：五年前只有一个光标；片名 |
| 2021 年以前 | 一行一行地敲；IDE 能高亮、跳转、重构，但不能决定写什么 |
| 2021 | Copilot：巨大的 Tab 键落下，灰色的猜测变成代码；补全靠 AI，推进靠人 |
| 2023—2024 | 一句“改成异步”，Composer 改好几个文件；人盯着每一个 Diff |
| 2024—2025 | Agent 在代码城市里自己搜、改、测，挂了接着查；Devin、Claude Code、Codex CLI；IDE → 终端 |
| 2025—2026 | 1 → 2 → 4 → 10 个 Agent，Worktree 与沙箱隔离；Codex App：GUI 回来了，列的是 Agent |
| 瓶颈 | 请求像潮水一样涌向一个人；Symphony；瓶颈是人 |
| Agent 管 Agent | 人把目标交给协调者：侦察、并行、串行、子管理者、回收、改道；Cursor Projects |
| 2024 年就有 | 《Building Effective Agents》的 Orchestrator-Workers：架构早就有了，变的是执行者靠得住了 |
| 验证闭环 | 写、测、构建、部署、观察、修复；Harness Engineering：一百万行，零行手写，工程师搭环境 |
| 别想得太成熟 | 一行修改开十个 Agent；各自测试全过、合在一起照样崩；什么时候拆、等、一起验证 |
| 五层阶梯 | L0 手写 → L5 Agent 指挥 Agent，你在第几层？ |
| 结尾 | 又回到一个光标：下一步是什么？我不知道 |

## 制作

```bash
./run.sh five-years tts        # 整段合成旁白（需要已登录的 elevenlabs CLI）
./run.sh five-years timeline   # 按实测旁白排时间轴
./run.sh five-years sfx        # 音效库
./run.sh five-years music      # 按段落作曲
./run.sh five-years mix        # 混音 → out/mix/*.wav（-14 LUFS）
./run.sh five-years render     # → out/deliver/*.mp4
./run.sh five-years covers     # → out/deliver/covers/
./run.sh five-years extras     # → out/deliver/*.srt、chapters.json
./run.sh five-years preview douyin
```

## 文件

| 文件 | 内容 |
|---|---|
| `script.mjs` | 两个剪辑版本的旁白（中 / 英，带 `[语气]` 与 `{对位点}`）、六个平台版本、画面文字、年代标签 |
| `web/engine.js` | 三种画幅的布局、光与辉光、文字、面板、代码高亮、3D 与等轴测 |
| `web/main.js` | 镜头调度与转场、辉光后期、字幕（竖屏逐字高亮）、年代标尺、标题条 |
| `web/shots/a.js` … `d.js` | 镜头：光点群、倒带、片名、IDE、Tab、Diff；代码城市、终端、十个 Agent、过载、瓶颈；动态组织、Projects、档案、闭环、Harness；冷静、阶梯、结尾 |
| `web/cover.js` | 各平台封面 |
| `tools/tts.py` | 整段合成 + 逐字时间戳 + 静音修剪 + 转写核对 |
| `tools/timeline.mjs` | 镜头、对位点、字幕短语、章节 |
| `tools/music.py` · `sfx_gen.py` · `mix.py` | 配乐、音效、混音 |
| `tools/render.mjs` · `covers.mjs` · `extras.mjs` | 渲染与交付 |
| `tools/audition.py` · `contour.py` | 试音（语速、音高、起伏）、配乐响度轮廓检查 |
