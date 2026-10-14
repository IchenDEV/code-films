# 出处与致谢 · Credits

## 内容来源

全部数字与说法出自 Anthropic 工程博客：

**Redesigning source control at Anthropic**，2026-10-13，Nick G. 与 source control team
https://www.anthropic.com/engineering/redesigning-source-control

片中旁白是对原文的转述，不是译文。画面上的出处常驻：竖屏在顶部标题下方，横屏在左上角。

| 片中说法 | 原文依据（节选） |
|---|---|
| 五月每天约 2500 次合并，九月每天超过 3 万次 | "In May 2026, Anthropic averaged around 2,500 code changes merged per day; as of September, we merged over 30,000 per day." |
| 把 Git 换掉了（指单体仓库） | "fully migrated our monorepo from git in five months" |
| 主分支历史将近 100 GB，压缩后的工作副本超过 25 GB | "The history of our main branch alone is almost 100 GB, and a compressed working copy is over 25 GB." |
| CI 每天检出约 2500 万次；硬拉一天 600 PB 以上 | "on the order of 25 million code checkouts per day for CI" · "over 600 PB of git traffic per day" |
| 几百台 Git 镜像 | "we operated several hundred internal git mirrors" |
| 客户端几乎都是智能体和任务，天生在线 | "nearly all of our clients were agents and jobs that are online by definition" |
| 六条原则 | 原文 "Principles for agent-scale source control" 一节 |
| 变更集、派生数据、只说“我要什么”、三层缓存、命中率超过 99%、故障隔离 | 原文 "How Scion works" 一节 |
| CPU 和内存只要原来的两百分之一；检出从几分钟到几秒；CI 省回 25% CPU | "200x smaller than our previous git mirroring infrastructure in terms of CPU and memory" · "in seconds rather than minutes" · "CI alone realized a 25% CPU capacity win" |
| 7 个人，Scion 与 Antique 加半打相关系统，5 个月迁移完，同期合并量涨 10 倍 | 原文 "Rapid development with a small team" 一段 |
| 新模型从头写一遍：内存省 20 倍、快 4 倍，约束全部保留 | 原文关于 Claude Mythos Preview 重写 ingestion pipeline 的一段 |
| 工程师最常做的事，是对 Claude 说“不” | "Very often, we found that the role of the engineers was to tell Claude 'no.'" |
| 多余的校验、看意图不逐行看 | 原文 "Engineers are no less valuable" 一段 |
| 超级粉丝 | 原文 "A new level of operational excellence" 一段 |
| 不再全库加锁；合并后、部署前测试；冲突 Claude 修得比人发现得快 | 原文 "We're completely rethinking our priors" 一段 |
| 不是通用的 Git 替代品；6 到 12 个月；和 GitHub、GitLab、开源社区合作；Git 社区近 20 年 | 原文 "Contributing to the wider ecosystem" 一节 |
| 下一个被挤爆的会是什么（CI、构建……） | 原文开头："source control, builds, and CI" 是“为人的规模建造”的基础设施 |

画面里的文件名（`src/cache.py` 等）、哈希、改动编号、监控曲线、机器人与人物都是示意，不是 Anthropic 的真实内容。“scion /ˈsaɪən/ · 嫁接用的一截新枝”只是这个英文词的词义，原文没有解释命名原因。

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

全部由 Canvas 2D 程序逐帧绘制，没有素材图。机器人与人物是本片原创造型，不是任何品牌的标志。画面与代码：IDEVLAB。
