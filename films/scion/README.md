# Anthropic 把 Git 换掉了 · Anthropic Replaced Git

> 写代码已经不是瓶颈了。下一个被 AI 挤爆的，会是什么？
> *Writing code isn't the bottleneck anymore. So what breaks next?*

根据 Anthropic 工程博客《Redesigning source control at Anthropic》（2026-10-13）制作：每天合并量从 2500 次涨到 3 万次以后，Git 成了最大的瓶颈；一个 7 人小组用 5 个月造了自研版本控制 Scion，并把单体仓库整个迁了过去。出处逐条见 [CREDITS.md](CREDITS.md)。

## 两个剪辑、五个成片

两个剪辑都有旁白，都是一条完整录音（中文 Pangge、英文 Jon，Eleven v4，语气平和）；字幕逐字高亮，关键词念到时变金色，画面上的数字同时“砸”下来。

| 成片 | 平台 | 画幅 | 时长 | 片尾互动 |
|---|---|---|---|---|
| `Scion_抖音.mp4` | 抖音、小红书 | 9:16 · 中文 | 1:29 | 评论区打数字 |
| `Scion_视频号.mp4` | 视频号 | 9:16 · 中文 | 1:29 | 转给你们组写代码最快的人 |
| `Scion_TikTok_Reels_Shorts.mp4` | TikTok、Instagram Reels、YouTube Shorts | 9:16 · 英文 | 1:32 | Comment your number |
| `Scion_B站.mp4` | B 站 | 16:9 · 中文 | 4:21 | 弹幕告诉我 |
| `Scion_YouTube.mp4` | YouTube | 16:9 · 英文 | 5:04 | Tell me in the comments |

各平台的标题、简介、话题、置顶评论、发布时间与测试方法见 [发布文案.md](发布文案.md)。

## 这一部换了做法

前几部的问题是慢、前三秒抓不住人。这一部：

- **第一帧就是冲突**：一根标着 git 的管子被改动堵死，告急灯在闪；第一句就是结论。
- **节奏**：短版平均 3.4 秒一句，每句都有一个画面动作；镜头在每个关键词上轻轻一“顶”，配一个音效；转场是 0.3 秒的横甩或白闪。
- **竖屏常驻标题 + 带章节刻度的进度条**；横屏左上是出处，右上是当前章节。
- **短版讲故事，长版讲细节**：长版多了 Git 的变通办法、六条原则、变更集与派生数据、只说“我要什么”的拉取协议、三层缓存与故障隔离、超级粉丝、合并队列、对行业的意义。

## 结构（长版）

| 段落 | 讲什么 | 配乐 |
|---|---|---|
| 开场 | 换掉了 Git；2500 → 3 万次 / 天；7 个人 5 个月 | 第一拍就满能量 |
| Git 撞墙 | 100 GB、2500 万次检出、600 PB；浅克隆、稀疏检出、几百台镜像 | 压力上升 |
| 想明白一件事 | Git 为离线设计，客户端却都永远在线 | 收住，长音 |
| 六条原则 | 在线、服务器包揽、API、横向扩展、轻快无锁、工作副本可选 | 转亮 |
| 怎么做到的 | 变更集、派生数据、拉取协议、三层缓存 | 稳定的律动 |
| 结果 | 1/200、几分钟变几秒、CI +25% | 全片最响 |
| 学到了什么 | 7 个人、新模型重写、说“不”、超级粉丝、合并队列 | 温暖、带点俏皮 |
| 对其他人意味着什么 | 不是通用替代品、6–12 个月、带回 Git | 开阔 |
| 瓶颈搬家了 | 下一个是谁？ | 悬而未决 |

## 视觉

深蓝蓝图上的扁平动态图形：橙色小机器人是智能体，薄荷绿是 Scion，红色是撑不住的地方，金色是数字。全部由 Canvas 2D 程序绘制。

## 制作

```bash
./run.sh scion tts         # 旁白（短版 / 长版 × 中 / 英），整条一次合成、转写核对、按段落分开，并排时间轴
./run.sh scion music       # 作曲（需要已登录的 elevenlabs CLI）+ 铺底长音
./run.sh scion sfx         # 音效库
./run.sh scion mix         # 混音 → out/mix/*.wav（-14 LUFS），检查掉空与跳变
./run.sh scion smoke       # 每个转场逐帧画一遍
./run.sh scion render      # → out/deliver/*.mp4（一次一个版本；磁盘紧时先看 df -h /）
./run.sh scion covers      # → out/deliver/covers/
./run.sh scion extras      # → out/deliver/*.srt、chapters.json
./run.sh scion stills douyin @results+2 @tiers+3 --sheet
./run.sh scion preview douyin
```

字体裁剪：`SRC=<放 Noto Sans SC / Space Grotesk / JetBrains Mono 的目录> SUBSET_FONT_DIR=<装了 subset-font 的目录> node make_fonts.mjs`。

## 文件

| 文件 | 内容 |
|---|---|
| `script.mjs` | 短版 25 句、长版 65 句双语旁白（镜头、段落、关键词）、旁白设置与读音替换、五个平台版本、画面文字（中 / 英） |
| `web/engine.js` | 背景、光、形状、文字、数字砸落与盖章、小机器人、人、服务器、数据块、分支图、嫩芽、图标 |
| `web/main.js` | 镜头调度与转场、关键词上的镜头冲击、逐字高亮字幕、竖屏常驻标题与进度条、出处与章节 |
| `web/shots/a.js` | 堵住的管子、合并量、7 个人、仓库有多大、镜像、离线、永远在线 |
| `web/shots/b.js` | Scion 揭晓、六条原则、变更集、派生数据、拉取、三层缓存、结果 |
| `web/shots/c.js` | 新模型重写、说“不”、超级粉丝、合并队列、对其他人意味着什么、瓶颈搬家、片尾投票 |
| `web/cover.js` | 各平台封面 |
| `tools/tts.py` · `music.py` · `bed.py` · `sfx_gen.py` · `mix.py` · `check_audio.py` · `contour.py` · `remux.sh` | 旁白、作曲、铺底、音效、混音、响度与连贯性检查、只换音轨 |
| `tools/timeline.mjs` · `render.mjs` · `covers.mjs` · `extras.mjs` · `stills.mjs` · `smoke.mjs` | 时间轴、渲染、封面、字幕与章节、截帧、逐帧冒烟测试 |
