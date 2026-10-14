// 《Anthropic 把 Git 换掉了 · Anthropic Replaced Git》
// 根据 Anthropic 工程博客《Redesigning source control at Anthropic》（2026-10-13）改编。
// 片里的数字和说法都出自这篇博客；画面上常驻出处（TXT.source）。
//
// 两个剪辑版本，都有旁白（中文 Pangge、英文 Jon，Eleven v4，整条一次合成）：
//   short  约 85 秒，竖屏：抖音、视频号、TikTok / Reels / Shorts。第一帧就是钩子，几乎每句换一个画面。
//   long   约 4 分钟，横屏：B 站、YouTube。讲全细节：数字、Git 的设计、六条原则、怎么实现、结果、教训、对行业的意义。
//
// 每一句是一个 LINE：
//   shot   画面函数名；相邻同名的句子合成一个镜头，镜头里的动画跟着每句的起点（cue）走
//   act    段落；配乐按段落作曲，段落之间留一口气
//   zh/en  旁白，也是字幕（逐字高亮）
//   k      关键词：{ 名字: [中文子串, 英文子串] }。时间轴算出这个词被念出的时刻，画面在那一刻“砸”下去
//   min    这一句至少停留几秒（画面要演完）
//   hold   没有旁白的镜头停留几秒（片尾）
export const LINES = {
  short: [
    // —— 钩子：第一帧就在 ——
    { id: 'S01', shot: 'jam', act: 'hook', zh: 'Anthropic 把 Git 换掉了。', en: 'Anthropic replaced Git.', k: { swap: ['换掉', 'replaced'] } },
    { id: 'S02', shot: 'jam', act: 'hook', zh: '不是 Git 不好，是 AI 写代码太快。', en: 'Not because Git is bad. Because AI writes code too fast.', k: { fast: ['太快', 'too fast'] } },
    { id: 'S03', shot: 'chart', act: 'hook', zh: '今年五月，他们每天合并 2500 次代码；', en: 'In May, they merged 2,500 changes a day.', k: { n1: ['2500', '2,500'] } },
    { id: 'S04', shot: 'chart', act: 'hook', zh: '到了九月：每天 3 万次。', en: 'By September: 30,000 a day.', k: { n2: ['3 万', '30,000'] } },
    { id: 'S05', shot: 'team', act: 'hook', zh: '7 个人、5 个月，造了个新的。怎么做到的？', en: 'Seven people built a replacement in five months. How?',
      k: { seven: ['7 个人', 'Seven'], five: ['5 个月', 'five months'], how: ['怎么', 'How'] } },
    // —— 墙：Git 哪里扛不住 ——
    { id: 'S06', shot: 'repo', act: 'wall', zh: '主分支的历史，将近 100 GB；', en: 'The main branch history: almost 100 GB.', k: { gb: ['100', '100'] } },
    { id: 'S07', shot: 'repo', act: 'wall', zh: '光是 CI，每天就要检出 2500 万次；', en: 'CI alone checks out the code 25 million times a day.', k: { n25m: ['2500 万', '25 million'] } },
    { id: 'S08', shot: 'repo', act: 'wall', zh: '要是硬拉，一天就是 600 PB 的流量。', en: 'Fetched naively, that is 600 petabytes a day.', k: { pb: ['600', '600'] } },
    { id: 'S09', shot: 'mirrors', act: 'wall', zh: '几百台 Git 镜像，也只是在拖时间。', en: 'Hundreds of git mirrors only bought them time.', k: { mir: ['几百台', 'Hundreds'] } },
    // —— 想明白一件事 ——
    { id: 'S10', shot: 'offline', act: 'insight', zh: 'Git 是为离线设计的：每个人揣着一整个仓库。', en: 'Git was built to work offline: everyone carries the whole repo.', k: { whole: ['一整个', 'whole'] } },
    { id: 'S11', shot: 'online', act: 'insight', zh: '可现在用仓库的，几乎都是智能体和自动任务，永远在线。', en: 'But nearly all their clients are agents and jobs. Always online.', k: { on: ['永远在线', 'Always online'] } },
    { id: 'S12', shot: 'online', act: 'insight', zh: '它们不需要整个仓库，只需要问一句。', en: "They don't need the whole repo. They just need to ask.", k: { ask: ['问一句', 'ask'] } },
    // —— Scion ——
    { id: 'S13', shot: 'scion', act: 'scion', zh: '于是，他们造了 Scion。', en: 'So they built Scion.', k: { name: ['Scion', 'Scion'] } },
    { id: 'S14', shot: 'scion', act: 'scion', zh: '提交、合并、查历史，全在服务器上，没有 push。', en: 'Commits, merges and history all happen on the server. No push.', k: { nopush: ['push', 'push'] } },
    { id: 'S15', shot: 'fetch', act: 'scion', zh: '要哪个文件，才拉哪个文件。', en: 'You only fetch the files you ask for.' },
    { id: 'S16', shot: 'tiers', act: 'scion', zh: '三层缓存，每一层命中率都超过 99%。', en: 'Three cache tiers, each with a hit rate over 99 percent.', k: { hit: ['99', '99'] } },
    // —— 结果（高潮）——
    { id: 'S17', shot: 'results', act: 'climax', zh: '结果：CPU 和内存，只要原来的两百分之一；', en: 'The result: 200 times less CPU and memory.', k: { x200: ['两百分之一', '200'] } },
    { id: 'S18', shot: 'results', act: 'climax', zh: '检出代码，从几分钟变成几秒。', en: 'Checkouts went from minutes to seconds.', k: { sec: ['几秒', 'seconds'] } },
    // —— 人 ——
    { id: 'S19', shot: 'rewrite', act: 'human', zh: '7 个人怎么做到的？AI 惹的麻烦，AI 收拾。', en: 'How did seven people do it? The AI that caused the problem helped solve it.', k: { solve: ['AI 收拾', 'helped'] } },
    { id: 'S20', shot: 'rewrite', act: 'human', zh: '他们手写的原型，交给新模型从头写一遍：', en: 'They gave their hand-written prototype to a new model to rewrite:', k: { give: ['新模型', 'new model'] } },
    { id: 'S21', shot: 'rewrite', act: 'human', zh: '内存省 20 倍，速度快 4 倍。', en: '20 times less memory. 4 times faster.', k: { m20: ['20', '20'], s4: ['4 倍', '4 times'] } },
    { id: 'S22', shot: 'no', act: 'human', zh: '那工程师做什么？很多时候，是对 Claude 说“不”。', en: 'So what do engineers do? Very often, they tell Claude "no."', k: { no: ['不”', 'no."'] }, min: 3.6 },
    // —— 结尾 ——
    { id: 'S24', shot: 'bottleneck', act: 'ending', zh: '写代码，已经不是瓶颈了。', en: "Writing code isn't the bottleneck anymore.", k: { neck: ['瓶颈', 'bottleneck'] } },
    { id: 'S25', shot: 'bottleneck', act: 'ending', zh: '他们说，6 到 12 个月内，更多团队会撞上这堵墙。', en: 'They expect more teams to hit this wall within six to twelve months.', k: { wall: ['这堵墙', 'this wall'] } },
    { id: 'S26', shot: 'bottleneck', act: 'ending', zh: '下一个被 AI 挤爆的，会是什么？', en: 'So what breaks next?', k: { next: ['下一个', 'next'] } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 4.2 },
  ],

  long: [
    // —— 钩子 ——
    { id: 'L01', shot: 'jam', act: 'hook', zh: 'Anthropic 把 Git 换掉了。', en: 'Anthropic replaced Git.', k: { swap: ['换掉', 'replaced'] } },
    { id: 'L02', shot: 'jam', act: 'hook', zh: '不是 Git 不好，是 AI 写代码，实在太快了。', en: 'Not because Git is bad. Because AI writes code too fast.', k: { fast: ['太快', 'too fast'] } },
    { id: 'L03', shot: 'chart', act: 'hook', zh: '今年五月，他们每天合并大约 2500 次代码；', en: 'In May 2026, they merged about 2,500 changes a day.', k: { n1: ['2500', '2,500'] } },
    { id: 'L04', shot: 'chart', act: 'hook', zh: '到了九月，每天超过 3 万次。', en: 'By September, over 30,000 a day.', k: { n2: ['3 万', '30,000'] } },
    { id: 'L05', shot: 'team', act: 'hook', zh: '一个 7 人小组，5 个月，从零造了一套新系统。', en: 'A team of seven built a new system from scratch in five months.',
      k: { seven: ['7 人', 'seven'], five: ['5 个月', 'five months'] } },
    { id: 'L06', shot: 'team', act: 'hook', zh: '为什么换？换成了什么？他们学到了什么？', en: 'Why switch? What did they build? And what did they learn?', k: { how: ['学到', 'learn'] } },

    // —— 墙 ——
    { id: 'L07', shot: 'repo', act: 'wall', zh: '先看看，他们的大仓库有多大。', en: 'First: how big is their monorepo?' },
    { id: 'L08', shot: 'repo', act: 'wall', zh: '主分支的历史，将近 100 GB；压缩后的一份工作副本，超过 25 GB。', en: "The main branch's history: almost 100 GB. One compressed working copy: over 25 GB.",
      k: { gb: ['100', '100'], wc: ['25', '25'] } },
    { id: 'L09', shot: 'repo', act: 'wall', zh: '光是 CI，每天就要检出代码约 2500 万次，', en: 'CI alone checks out the code about 25 million times a day,', k: { n25m: ['2500 万', '25 million'] } },
    { id: 'L10', shot: 'repo', act: 'wall', zh: '还没算开发环境、智能体沙箱和科研任务。', en: 'not counting dev environments, agent sandboxes and research jobs.', k: { more: ['沙箱', 'sandboxes'] } },
    { id: 'L11', shot: 'repo', act: 'wall', zh: '要是每次都老老实实地拉，一天就是 600 PB 以上的流量。', en: 'Fetched naively, that would be over 600 petabytes a day.', k: { pb: ['600', '600'] } },
    { id: 'L12', shot: 'mirrors', act: 'wall', zh: 'Git 也有办法：浅克隆、稀疏检出、按需拉取。', en: 'Git has tools for this: shallow clones, sparse checkouts, promisor remotes.',
      k: { t1: ['浅克隆', 'shallow'], t2: ['稀疏', 'sparse'], t3: ['按需', 'promisor'] } },
    { id: 'L13', shot: 'mirrors', act: 'wall', zh: '他们全用上了，最多时开了几百台 Git 镜像。', en: 'They used them all, and at the peak ran several hundred git mirrors.', k: { mir: ['几百台', 'several hundred'] } },
    { id: 'L14', shot: 'mirrors', act: 'wall', zh: '可合并越快，仓库快照就落后得越远；', en: 'But the faster they merged, the further their snapshots fell behind,', k: { lag: ['落后', 'fell behind'] } },
    { id: 'L15', shot: 'mirrors', act: 'wall', zh: '在不完整的克隆上，比对改动、追查作者，越来越费劲。', en: 'and keeping diff and blame working on partial clones took more and more care.', k: { strain: ['费劲', 'care'] } },

    // —— 想明白一件事 ——
    { id: 'L16', shot: 'offline', act: 'insight', zh: '后来他们退后一步，发现了一件事。', en: 'Then they stepped back and noticed something.' },
    { id: 'L17', shot: 'offline', act: 'insight', zh: 'Git 是分布式的：每一份克隆，都是一个完整的仓库，断了网也能用。', en: 'Git is distributed: every clone is a complete repository that works fully offline.',
      k: { whole: ['完整', 'complete'], off: ['断了网', 'offline'] } },
    { id: 'L18', shot: 'offline', act: 'insight', zh: '可他们其实一直把 Git 作为中心化的系统在用；', en: 'But like most companies, they were using it as a centralized system.', k: { center: ['中心化', 'centralized'] } },
    { id: 'L19', shot: 'online', act: 'insight', zh: '而用仓库的，几乎都是智能体和自动任务，天生在线。', en: 'And nearly all of their clients were agents and jobs: online by definition.', k: { on: ['天生在线', 'online by definition'] } },
    { id: 'L20', shot: 'online', act: 'insight', zh: '让 Git 擅长离线的那些设计，反过来拖住了它们。', en: 'The very things that make Git great offline were holding them back.', k: { drag: ['拖住', 'holding'] } },
    { id: 'L21', shot: 'online', act: 'insight', zh: '于是他们问：如果从第一天起，就假设客户端永远在线呢？', en: 'So they asked: what if source control assumed, from day one, that clients are always online?', k: { ask: ['永远在线', 'always online'] } },

    // —— 六条原则 ——
    { id: 'L22', shot: 'scion', act: 'scion', zh: '答案叫 Scion。', en: 'The answer is called Scion.', k: { name: ['Scion', 'Scion'] } },
    { id: 'L23', shot: 'principles', act: 'scion', zh: '第一，客户端永远在线：数据用到的时候，再去拿。', en: 'One: clients are always online, and fetch data only when they need it.', k: { p1: ['第一', 'One'] } },
    { id: 'L24', shot: 'principles', act: 'scion', zh: '第二，服务器包揽一切：查历史、提交、合并、变基，都在服务器上。', en: 'Two: the server does the heavy lifting. History, blame, commits, merges, rebases.', k: { p2: ['第二', 'Two'] } },
    { id: 'L25', shot: 'principles', act: 'scion', zh: '第三，所有查询都开放成 API，很多任务连本地仓库都不用。', en: 'Three: every query is an API, so many jobs need no local repo at all.', k: { p3: ['第三', 'Three'] } },
    { id: 'L26', shot: 'principles', act: 'scion', zh: '第四，一切都能横向扩展：哪里都没有一份完整的仓库，服务器上也没有。', en: 'Four: everything scales out. No full copy of the repo exists anywhere, not even on the server.', k: { p4: ['第四', 'Four'] } },
    { id: 'L27', shot: 'principles', act: 'scion', zh: '第五，提交要轻、要快、不加锁，成本只跟改动大小有关。', en: 'Five: commits are cheap, incremental and lock-free. Their cost scales with the change, not the repo.', k: { p5: ['第五', 'Five'] } },
    { id: 'L28', shot: 'principles', act: 'scion', zh: '第六，工作副本可有可无；真要文件，也只拿你读到的那些。', en: 'Six: the working copy is optional. When you do need files, you only pay for what you read.', k: { p6: ['第六', 'Six'] } },

    // —— 怎么做到 ——
    { id: 'L29', shot: 'changeset', act: 'how', zh: '怎么做到的？在 Scion 里，最小单位叫“变更集”。', en: 'How does it work? In Scion, the unit of work is a changeset.', k: { cs: ['变更集', 'changeset'] } },
    { id: 'L30', shot: 'changeset', act: 'how', zh: 'Git 的提交，指向一整棵目录树；', en: 'A git commit points to a whole tree.', k: { tree: ['目录树', 'whole tree'] } },
    { id: 'L31', shot: 'changeset', act: 'how', zh: '变更集只记：这次改了哪些文件，内容存在哪儿。', en: 'A changeset lists only the files that changed, and where their contents live.', k: { list: ['哪些文件', 'files that changed'], blob: ['存在哪儿', 'contents live'] } },
    { id: 'L32', shot: 'changeset', act: 'how', zh: '它在服务器上生成，没有打包文件，没有锁，马上哪里都能看到。', en: "It's created on the server. No packfiles, no locks, and it's available everywhere instantly.", k: { inst: ['马上', 'instantly'] } },
    { id: 'L33', shot: 'derived', act: 'how', zh: '要查作者、看文件历史？就从变更集，一代一代推出“派生数据”，', en: 'Blame and file history come from “derived data”, computed from each changeset’s parents,', k: { der: ['派生数据', 'derived data'] } },
    { id: 'L34', shot: 'derived', act: 'how', zh: '用得上才算，算法还能随时换，客户端完全不用知道。', en: 'computed only when needed, and improved anytime without the client knowing.', k: { swap: ['随时换', 'improved'] } },
    { id: 'L35', shot: 'fetch', act: 'how', zh: '拉代码也反过来：不说“我有什么”，只说“我要什么”。', en: 'Fetching flips too: the client never says what it has. Only what it wants.', k: { have: ['我有什么', 'what it has'], want: ['我要什么', 'what it wants'] } },
    { id: 'L36', shot: 'fetch', act: 'how', zh: '每个对象都不会再变，所以任何一层缓存，都能直接回答。', en: 'Every object is immutable, so any cache can answer.', k: { any: ['任何一层', 'any cache'] } },
    { id: 'L37', shot: 'tiers', act: 'how', zh: '一共三层：每台机器上的 daemon，每个区域的 cache，最后才是 server。', en: 'Three tiers: a daemon on every machine, a cache in every region, and finally the server.',
      k: { d: ['daemon', 'daemon'], c: ['cache', 'cache'], s: ['server', 'server'] } },
    { id: 'L38', shot: 'tiers', act: 'how', zh: '每一层的缓存命中率，都超过 99%；', en: 'Every tier keeps a cache hit rate above 99 percent,', k: { hit: ['99', '99'] } },
    { id: 'L39', shot: 'tiers', act: 'how', zh: '层与层严格隔开，一层出事，拖不垮整个系统。', en: 'and the tiers are strictly isolated, so one failure cannot take down the whole system.', k: { iso: ['隔开', 'isolated'] } },

    // —— 结果（高潮）——
    { id: 'L40', shot: 'results', act: 'climax', zh: '结果呢？CPU 和内存，只要原来 Git 镜像的两百分之一；', en: 'The result? 200 times less CPU and memory than the old git mirrors.', k: { x200: ['两百分之一', '200'] } },
    { id: 'L41', shot: 'results', act: 'climax', zh: 'CI 和科研任务检出代码，从几分钟变成几秒；', en: 'Checkouts for CI and research went from minutes to seconds.', k: { sec: ['几秒', 'seconds'] } },
    { id: 'L42', shot: 'results', act: 'climax', zh: '光是 CI，就省回了 25% 的 CPU。', en: 'CI alone got back 25 percent of its CPU.', k: { cpu: ['25', '25'] } },

    // —— 学到了什么 ——
    { id: 'L43', shot: 'team', act: 'lessons', zh: '最让人意外的，是做的人有多少。', en: 'The most surprising part is how few people built it.', k: { how: ['多少', 'few'] } },
    { id: 'L44', shot: 'team', act: 'lessons', zh: '7 个人，造了 Scion 和代码审查工具 Antique，还有半打相关系统，', en: 'Seven people built Scion, Antique, their code review tool, and half a dozen related systems,',
      k: { seven: ['7 个人', 'Seven'] } },
    { id: 'L45', shot: 'team', act: 'lessons', zh: '5 个月全部迁移完；同一段时间，每天的合并量还涨了 10 倍。', en: 'and fully migrated in five months, while daily merges grew tenfold.', k: { five: ['5 个月', 'five months'], x10: ['10 倍', 'tenfold'] } },
    { id: 'L46', shot: 'rewrite', act: 'lessons', zh: '有个细节：他们手写过一版导入流水线，自认为不错。', en: 'One detail: they had hand-written an ingestion pipeline, and thought it was good.', k: { hand: ['手写', 'hand-written'] } },
    { id: 'L47', shot: 'rewrite', act: 'lessons', zh: '交给内部早期版的新模型，只说一句“从头写一遍”，', en: 'They gave it to an early internal snapshot of a new model, with no further instructions.', k: { give: ['新模型', 'new model'] } },
    { id: 'L48', shot: 'rewrite', act: 'lessons', zh: '内存省了 20 倍，快了 4 倍，原有的约束一条没破。', en: 'It used 20 times less memory, ran 4 times faster, and kept every implicit invariant.', k: { m20: ['20', '20'], s4: ['4 倍', '4 times'] } },
    { id: 'L49', shot: 'no', act: 'lessons', zh: '团队里每个工程师都认为，Claude 写代码已经比自己强。', en: 'Every engineer on the team now rates Claude as a better coder than themselves.', k: { better: ['比自己强', 'better coder'] } },
    { id: 'L50', shot: 'no', act: 'lessons', zh: '那人做什么？懂系统，做取舍，很多时候，是对 Claude 说“不”。', en: 'So what do people do? Understand the system, make the tradeoffs, and very often, tell Claude "no."',
      k: { no: ['不”', 'no."'] } },
    { id: 'L51', shot: 'no', act: 'lessons', zh: '比如，为了一个假想的风险，给内部服务加一堆多余的校验：不行。', en: 'Like piling extra validation onto a trusted internal service over a hypothetical risk. No.',
      k: { pile: ['多余的校验', 'extra validation'], nope: ['不行', 'No.'] } },
    { id: 'L52', shot: 'no', act: 'lessons', zh: '审代码，也从一行一行地看，变成看意图。', en: 'Reviews moved from reading every line to checking intent.', k: { intent: ['意图', 'intent'] } },
    { id: 'L53', shot: 'superfan', act: 'lessons', zh: '他们还给每个组件，配了一个 Claude “超级粉丝”：', en: 'They also gave every component a Claude "superfan":', k: { fan: ['超级粉丝', 'superfan'] } },
    { id: 'L54', shot: 'superfan', act: 'lessons', zh: '整天盯着监控和日志，能看出告警看不出的细微异常。', en: 'it watches telemetry and logs all day, and spots subtle issues that alerts miss.', k: { spot: ['细微异常', 'subtle issues'] } },
    { id: 'L55', shot: 'mergeq', act: 'lessons', zh: '连合并队列也换了思路：测试还没跑完，可能已经合进了上千个改动。', en: 'Even merge queues: while tests run, hundreds or thousands of changes can land.', k: { land: ['上千个', 'thousands'] } },
    { id: 'L56', shot: 'mergeq', act: 'lessons', zh: '所以不再全库加锁排队，改成合并后、部署前自动测试；', en: 'So there is no global lock. They test after merge and before deploy,', k: { unlock: ['加锁', 'global lock'] } },
    { id: 'L57', shot: 'mergeq', act: 'lessons', zh: '有冲突？Claude 修好它，比人发现它还快。', en: 'and when changes conflict, Claude usually fixes them faster than humans can spot them.', k: { fix: ['修好', 'fixes'] } },

    // —— 对其他人意味着什么 ——
    { id: 'L58', shot: 'ecosystem', act: 'world', zh: '那大家是不是都该扔掉 Git？不是。', en: 'So should everyone ditch Git? No.', k: { nope: ['不是', 'No.'] } },
    { id: 'L59', shot: 'ecosystem', act: 'world', zh: '他们自己说，Scion 只适合超大的单体仓库，不是通用的 Git 替代品。', en: 'They say Scion only makes sense for enormous monorepos. It is not a general replacement for Git.', k: { only: ['超大', 'enormous'] } },
    { id: 'L60', shot: 'ecosystem', act: 'world', zh: '但这类问题，未来 6 到 12 个月，会越来越常见。', en: 'But they expect this class of problem to become common in the next six to twelve months.', k: { m612: ['6 到 12', 'six to twelve'] } },
    { id: 'L61', shot: 'ecosystem', act: 'world', zh: '所以他们想把思路带回 Git：更强的服务器端接口，能好好配合的稀疏和浅克隆，', en: 'So they want to bring the ideas back to Git: richer server-side APIs, sparse and shallow features that compose,',
      k: { back: ['带回', 'back'] } },
    { id: 'L62', shot: 'ecosystem', act: 'world', zh: '和 GitHub、GitLab、开源社区一起做。', en: 'working with GitHub, GitLab and the open-source community.', k: { tog: ['一起', 'working with'] } },

    // —— 结尾 ——
    { id: 'L63', shot: 'bottleneck', act: 'ending', zh: '写代码，已经不是瓶颈了。', en: "Writing code isn't the bottleneck anymore.", k: { neck: ['瓶颈', 'bottleneck'] } },
    { id: 'L64', shot: 'bottleneck', act: 'ending', zh: '瓶颈搬了家：搬到了所有按“人的速度”设计的工具上。', en: 'It moved to every tool built for human speed.', k: { wall: ['人的速度', 'human speed'] } },
    { id: 'L65', shot: 'bottleneck', act: 'ending', zh: '下一个被 AI 挤爆的，会是什么？', en: 'So what breaks next?', k: { next: ['下一个', 'next'] } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 5 },
  ],
};

// 旁白：Eleven v4，整条一次合成（一条录音，音高和语速前后一致），只在段与段之间的停顿里分开。
// 语气平和：不加 [excited] 这类标签，稳定度 0.5、表现力 0.15（更激动会像咬着牙说话）。
export const NARRATION = {
  zh: { voice: 'hFamrilbAE6WDMtWgKvu', voiceName: 'Pangge', model: 'eleven_v4', languageCode: 'zh', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
  en: { voice: 'dSByRdUbTGloB7TFA1qD', voiceName: 'Jon - Catalyst', model: 'eleven_v4', languageCode: 'en', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
};
// 只发给合成的读音替换（字幕不变）。多音字能改写的已在字幕里改写（从头写一遍、做什么、改动……）。
export const SAY = { zh: [['Scion', '赛恩'], ['Antique', '安提克'], ['daemon', '迪蒙'], ['校验', '较验'], ['一行一行', '一杭一杭']] };

// 每个平台一个成片。fmt：h 横屏 1920×1080 · v 竖屏 1080×1920
export const VARIANTS = {
  douyin: { cut: 'short', fmt: 'v', lang: 'zh', name: 'Scion_抖音', cta: ['下一个被 AI 挤爆的是？', '评论区打数字'], poll: true },
  channels: { cut: 'short', fmt: 'v', lang: 'zh', name: 'Scion_视频号', safe67: true, cta: ['下一个被 AI 挤爆的是？', '转给你们组写代码最快的人'], poll: true },
  tiktok: { cut: 'short', fmt: 'v', lang: 'en', name: 'Scion_TikTok_Reels_Shorts', cta: ['What breaks next?', 'Comment your number'], poll: true },
  bilibili: { cut: 'long', fmt: 'h', lang: 'zh', name: 'Scion_B站', cta: ['下一个被 AI 挤爆的是？', '弹幕告诉我'], poll: true },
  youtube: { cut: 'long', fmt: 'h', lang: 'en', name: 'Scion_YouTube', cta: ['What breaks next?', 'Tell me in the comments'], poll: true },
};

// 画面上的文字：[中文, English]
export const TXT = {
  header: [['每天 3 万次合并，Git 成了瓶颈', 'Anthropic：7 个人、5 个月，换掉了它'], ['30,000 merges a day: Git became the bottleneck', '7 people at Anthropic replaced it in 5 months']],
  source: ['来源：Anthropic 工程博客 · 2026.10.13', 'Source: Anthropic Engineering · Oct 13, 2026'],
  chapters: {
    hook: ['开场', 'Intro'], wall: ['Git 撞墙', 'The wall'], insight: ['想明白一件事', 'The insight'], scion: ['Scion 的六条原则', 'Six principles'],
    how: ['怎么做到的', 'How it works'], climax: ['结果', 'Results'], lessons: ['学到了什么', 'Lessons'], human: ['人做什么', 'The humans'],
    world: ['对其他人意味着什么', 'What it means for you'], ending: ['瓶颈搬家了', 'The bottleneck moved'], end: ['', ''],
  },
  merges: ['每天合并次数', 'merges per day'], perDay: ['次 / 天', 'a day'], may: ['5 月', 'May'], sep: ['9 月', 'Sep'],
  months: [['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']],
  people: ['7 个人', '7 people'], monthsN: ['5 个月', '5 months'], how: ['怎么做到的？', 'How?'], why3: [['为什么换？', '换成什么？', '学到什么？'], ['Why?', 'What?', 'Lessons?']],
  history: ['主分支历史', 'main branch history'], wc: ['工作副本（压缩）', 'working copy (compressed)'], checkouts: ['CI 检出 / 天', 'CI checkouts / day'],
  traffic: ['硬拉的流量 / 天', 'naive traffic / day'], plus: ['+ 开发环境 · 智能体沙箱 · 科研任务', '+ dev envs · agent sandboxes · research jobs'],
  tools: [['浅克隆', '稀疏检出', '按需拉取'], ['shallow clone', 'sparse checkout', 'promisor remote']],
  mirrors: ['Git 镜像 × 几百台', 'git mirrors × hundreds'], seed: ['快照', 'seed'], main: ['main 最新', 'tip of main'], behind: ['落后', 'behind'],
  diffBlame: ['diff · blame ？', 'diff · blame ?'],
  offline: ['离线', 'OFFLINE'], fullRepo: ['完整仓库', 'FULL REPO'], centralized: ['其实是中心化地在用', 'used as a centralized system'],
  online: ['永远在线', 'ALWAYS ONLINE'], agents: ['智能体 · 自动任务', 'agents · jobs'], q1: ['谁最后改了这里？', 'Who last changed this?'], a1: ['agent-41 · 3 分钟前', 'agent-41 · 3 min ago'],
  whatIf: ['如果从第一天就假设：客户端永远在线？', 'What if clients were always online, from day one?'],
  scionDef: ['scion /ˈsaɪən/ · 嫁接用的一截新枝', 'scion /ˈsaɪən/ · a young shoot cut for grafting'],
  scionSub: ['Anthropic 自研的版本控制系统', "Anthropic's in-house version control"],
  principles: [
    ['客户端永远在线', '服务器做重活', '一切都是 API', '横向扩展', '提交轻快无锁', '工作副本可选'],
    ['Always online', 'Server does the work', 'Everything is an API', 'Scales out', 'Cheap, lock-free commits', 'Optional working copy'],
  ],
  onServer: [['提交', '合并', '变基', '历史', 'blame'], ['commit', 'merge', 'rebase', 'history', 'blame']], noPush: ['没有 push', 'no push'],
  commit: ['Git 提交', 'git commit'], tree: ['整棵目录树', 'whole tree'], changeset: ['变更集', 'changeset'], changed: ['改了的文件', 'changed files'],
  blobStore: ['对象存储', 'blob storage'], wal: ['预写日志', 'write-ahead log'], noPack: [['无打包文件', '无锁', '无需协调'], ['no packfiles', 'no locks', 'no coordination']],
  derived: ['派生数据', 'derived data'], derivedKinds: [['作者 blame', '文件历史', '跳表'], ['blame', 'path history', 'skip lists']], lazy: ['用到才算', 'computed on demand'],
  iHave: ['我有…', 'I have…'], iWant: ['我要：', 'I want:'], immutable: ['内容寻址 · 永不改变', 'content-addressed · never changes'],
  tierNames: [['scion-daemon', '每台机器'], ['scion-cache', '每个区域'], ['scion-server', '权威'], ['Spanner · 云存储', '']],
  tierNamesEn: [['scion-daemon', 'per node'], ['scion-cache', 'per region'], ['scion-server', 'authoritative'], ['Spanner · cloud storage', '']],
  hitRate: ['命中率', 'hit rate'], isolated: ['故障隔离', 'failure isolated'],
  res: [['CPU + 内存', 'CPU + memory'], ['检出', 'checkout'], ['CI 的 CPU', 'CI CPU']], minutes: ['几分钟', 'minutes'], seconds: ['几秒', 'seconds'], cpuBack: ['省回', 'freed'],
  vsMirrors: ['对比原来的 Git 镜像', 'vs. old git mirrors'],
  products: [['Scion', 'Antique 代码审查', '代码搜索', '权限系统', '+ 半打系统'], ['Scion', 'Antique code review', 'code search', 'access control', '+ half a dozen more']],
  growth: ['合并量 ×10', 'merges ×10'],
  handwritten: ['手写原型', 'hand-written prototype'], rewritten: ['新模型从头写一遍', 'rewritten by a new model'], prompt: ['“从头写一遍。”', '"Rewrite it."'],
  model: ['Claude Mythos Preview（内部早期快照）', 'Claude Mythos Preview (early internal snapshot)'],
  memory: ['内存', 'memory'], speed: ['速度', 'speed'], invariants: ['原有约束：全部保留', 'implicit invariants: all kept'],
  better: ['“Claude 写代码比我强”', '"Claude codes better than me"'], everyone: ['团队里每个工程师', 'every engineer on the team'],
  validation: ['校验', 'check'], no: ['不', 'NO'], intent: ['看意图，不逐行看', 'review intent, not every line'], overEng: ['过度设计', 'over-engineering'],
  fans: ['#scion-daemon-superfan', '#scion-cache-superfan', '#merge-queue-superfan'], fanSays: ['p99 延迟有点怪，我去看看', 'p99 latency looks odd. Checking.'], alert: ['告警：一切正常', 'alerts: all green'],
  queue: ['合并队列 · 全库锁', 'merge queue · global lock'], postMerge: ['合并后测试', 'post-merge tests'], preDeploy: ['部署前测试', 'pre-deploy tests'], conflict: ['冲突', 'conflict'], fixed: ['已修复', 'fixed'],
  notFor: ['不是通用的 Git 替代品', 'not a general Git replacement'], forWho: ['只适合超大单体仓库', 'only for enormous monorepos'], soon: ['6–12 个月', '6–12 months'],
  ideas: [['服务器端 API', '新的协商协议', '稀疏 + 浅克隆'], ['server-side APIs', 'new negotiation', 'sparse + shallow']], partners: ['GitHub · GitLab · 开源社区', 'GitHub · GitLab · open source'],
  git20: ['Git 社区：近 20 年', 'Git community: ~2 decades'],
  necks: [['写代码', '源码管理', '构建 · CI', '？'], ['writing code', 'source control', 'builds · CI', '?']], humanSpeed: ['按人的速度设计', 'built for human speed'],
  poll: [[['1', 'CI / 构建'], ['2', '代码审查'], ['3', '合并队列'], ['4', '我们自己']], [['1', 'CI / builds'], ['2', 'code review'], ['3', 'merge queues'], ['4', 'us']]],
  title: ['把 Git 换掉', 'REPLACING GIT'], sign: 'IDEVLAB',
  disclaimer: ['数据与说法均出自 Anthropic 工程博客；画面为示意', 'All figures from the Anthropic Engineering post; visuals are illustrative'],
};
