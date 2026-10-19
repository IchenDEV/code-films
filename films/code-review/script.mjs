// 《Anthropic 不再逐行审代码了 · Who Reviews the Code Now?》
// 根据 claude.dev 博客《How the Claude Code team does code review》（2026-10-15，Addy Osmani、Morgan Westlee Lunt、Qing Wang）改编。
// 片里的数字和说法都出自这篇博客；画面上常驻出处（TXT.source），逐条对照见 CREDITS.md。
// 和上一部《Anthropic 把 Git 换掉了》（films/scion，同一套画面语言）是姊妹篇：那篇结尾问“下一个被 AI 挤爆的是什么”，这篇讲代码审查。
//
// 两个剪辑版本，都有旁白（中文 Pangge、英文 Jon，Eleven v4，整条一次合成）：
//   short  约 95 秒，竖屏：抖音、视频号、小红书、TikTok / Reels / Shorts。第一帧就是钩子，几乎每句换一个画面，中段再埋一个钩子（一晚 50 轮）。
//   long   约 5 分钟，横屏：B 站、YouTube。讲全细节：审查的两份工作、人的时间、六层检查、怎么让 AI 审得更好、人留在哪、怎么照着做。
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
    { id: 'S01', shot: 'flood', act: 'hook', zh: 'Anthropic 的工程师，已经不逐行看代码了。', en: 'Engineers at Anthropic no longer read every line of code.', k: { stop: ['不逐行', 'no longer'] } },
    { id: 'S02', shot: 'ratio', act: 'hook', zh: 'Claude Code 约九成的代码，是 Claude 自己写的。', en: 'Claude writes about 90 percent of Claude Code.', k: { n90: ['九成', '90 percent'] } },
    { id: 'S03', shot: 'paradox', act: 'hook', zh: '可六月到九月，合并的 PR 翻了一倍多，', en: 'Yet from June to September, merged PRs more than doubled,', k: { x2: ['翻了一倍多', 'more than doubled'] } },
    { id: 'S04', shot: 'paradox', act: 'hook', zh: '要回滚的比例，反而降了四成多。', en: 'while the share that got reverted fell over 40 percent.', k: { n40: ['四成多', '40 percent'] } },
    { id: 'S05', shot: 'paradox', act: 'hook', zh: '人看得少了，怎么反而更稳？', en: 'Fewer human eyes. So why is it more stable?', k: { why: ['怎么', 'why'] } },
    // —— 压力 ——
    { id: 'S06', shot: 'pressure', act: 'pressure', zh: '整个 Anthropic 的大仓库，每天合并的改动，从五月的 2500 涨到九月的 3 万多，', en: "Anthropic's whole monorepo went from about 2,500 merges a day in May to over 30,000 in September.",
      k: { n1: ['2500', '2,500'], n2: ['3 万', '30,000'] } },
    { id: 'S07', shot: 'pressure', act: 'pressure', zh: '一行一行看？根本看不完。', en: 'Read every line? Impossible.', k: { cant: ['看不完', 'Impossible'] } },
    { id: 'S08', shot: 'question', act: 'pressure', zh: '所以他们不问“人看过没有”，只问“会出什么错，谁来拦”。', en: "So they stopped asking 'did a human read it?' and asked 'what could go wrong, and what catches it?'",
      k: { q1: ['人看过没有', 'did a human'], q2: ['出什么错', 'what could go wrong'], q3: ['谁来拦', 'catches'] } },
    // —— 六层筛子 ——
    { id: 'S10', shot: 'sieve', act: 'layers', zh: '答案不是一道门，是六层筛子，底下垫一张回滚的网。', en: 'Not one gate, but six layers of checks, with a rollback net underneath.',
      k: { six: ['六层', 'six layers'], net: ['网', 'net'] } },
    { id: 'S11', shot: 'selfcheck', act: 'layers', zh: '第一层：Claude 先自己跑测试，再派个分身审一遍。', en: 'One: Claude runs the tests, then a fresh subagent reviews the diff.',
      k: { test: ['跑测试', 'runs the tests'], fresh: ['分身', 'subagent'] } },
    { id: 'S12', shot: 'jury', act: 'layers', zh: '第二层：几个 AI 找 bug，另一组投票，够多 AI 认可才贴出来。', en: 'Two: agents hunt for bugs, others vote, only agreed findings get posted.',
      k: { hunt: ['找 bug', 'hunt'], vote: ['投票', 'vote'], real: ['认可', 'agreed'] } },
    { id: 'S14', shot: 'tiers', act: 'layers', zh: '几个人点头，看风险：文档零个，普通改动一个，高风险两个。', en: 'Human approvals scale with risk: docs, zero. Ordinary changes, one. High risk, two.',
      k: { r0: ['零个', 'zero'], r1: ['一个', 'one'], r2: ['两个', 'two'] } },
    { id: 'S15', shot: 'tiers', act: 'layers', zh: '而且，AI 的批准，永远不算人的批准。', en: "And an agent's approval never counts as a human's.", k: { never: ['不算', 'never'] }, min: 2.8 },
    { id: 'S16', shot: 'release', act: 'layers', zh: '最后，合并队列、功能开关、分批发布，多数问题几分钟就能撤回。', en: 'Last: merge queue, feature flags, staged releases. Most mistakes undone in minutes.',
      k: { flag: ['开关', 'flags'], undo: ['撤回', 'undone'] } },
    // —— 中段钩子：一晚 50 轮 ——
    { id: 'S17', shot: 'night', act: 'night', zh: '最离谱的一次：AI 写、AI 审，一个 PR 一晚上改了 50 多轮。', en: 'The wildest night: an AI author, an AI reviewer, one PR, more than fifty rounds.',
      k: { n50: ['50', 'fifty'] } },
    { id: 'S18', shot: 'night', act: 'night', zh: '一查，审查器反复揪出的问题，约 59% 第一轮就在了。', en: 'And about 59 percent of what the reviewer kept flagging had been there since its first pass.', k: { n59: ['59', '59'] } },
    { id: 'S19', shot: 'rules', act: 'night', zh: '于是立规矩：三轮不过换思路，之后只看新改动，说过的不再说。', en: 'New rules: after three rounds, rethink. Then only the new diff. Never repeat a finding.',
      k: { r3: ['三轮', 'three rounds'], diff: ['新改动', 'new diff'], rep: ['不再说', 'Never repeat'] } },
    // —— 结果（高潮）——
    { id: 'S20', shot: 'converge', act: 'climax', zh: '结果：一轮就过的 PR，从 65% 涨到 78%；', en: 'The result: PRs passing after one round, from 65 to 78 percent.', k: { p78: ['78', '78'] } },
    { id: 'S21', shot: 'converge', act: 'climax', zh: '要改五轮以上的，从 8.9% 降到 1.5%。', en: 'PRs needing five or more rounds, from 8.9 down to 1.5 percent.', k: { p15: ['1.5', '1.5'] } },
    // —— 人 ——
    { id: 'S22', shot: 'humans', act: 'human', zh: '那人做什么？机器不擅长的：该不该做、高风险代码、架构，', en: 'So what do people do? What machines are bad at: whether to build it, risky code, architecture,',
      k: { what: ['做什么', 'what do people do'], d1: ['该不该做', 'whether to build'], d2: ['高风险代码', 'risky code'], d3: ['架构', 'architecture'] } },
    { id: 'S23', shot: 'humans', act: 'human', zh: '还有：对结果负责。', en: 'and owning the outcome.', k: { own: ['负责', 'owning'] } },
    { id: 'S24', shot: 'own', act: 'human', zh: '团队的默契：你合进去的，你负责。', en: 'The team norm: you land it, you own it.', k: { land: ['你负责', 'you own it'] }, min: 3.2 },
    // —— 结尾 ——
    { id: 'S25', shot: 'ending', act: 'ending', zh: '代码审查没有消失，只是从“人看过”，变成了“有人负责”。', en: "Review didn't disappear. It moved from 'a human read it' to 'a human owns it.'",
      k: { from: ['人看过', 'a human read it'], to: ['有人负责', 'a human owns it'] } },
    { id: 'S26', shot: 'ending', act: 'ending', zh: '你们团队呢？代码现在谁在审？', en: 'And your team? Who reviews your code now?', k: { who: ['谁在审', 'Who reviews'] } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 4.5 },
  ],

  long: [
    // —— 钩子 ——
    { id: 'L01', shot: 'flood', act: 'hook', zh: 'Anthropic 的工程师，已经不逐行看代码了。', en: 'Engineers at Anthropic no longer read every line of code.', k: { stop: ['不逐行', 'no longer'] } },
    { id: 'L02', shot: 'ratio', act: 'hook', zh: 'Claude Code 约九成的代码，是 Claude 自己写的。', en: 'Claude writes about 90 percent of Claude Code.', k: { n90: ['九成', '90 percent'] } },
    { id: 'L03', shot: 'paradox', act: 'hook', zh: '可六月到九月，合并的 PR 翻了一倍多，', en: 'Yet from June to September, merged PRs more than doubled,', k: { x2: ['翻了一倍多', 'more than doubled'] } },
    { id: 'L04', shot: 'paradox', act: 'hook', zh: '要回滚的比例，反而降了四成多。', en: 'while the share that got reverted fell over 40 percent.', k: { n40: ['四成多', '40 percent'] } },
    { id: 'L05', shot: 'paradox', act: 'hook', zh: '人看得少了，代码怎么反而更稳？', en: 'Fewer human eyes. So why is it more stable?', k: { why: ['怎么', 'why'] } },
    { id: 'L06', shot: 'paradox', act: 'hook', zh: '这是 Claude Code 团队十月的博客，我们一层层拆开。', en: "That's from the Claude Code team's October post. Let's take it apart.",
      k: { post: ['博客', 'post'] } },

    // —— 压力 ——
    { id: 'L07', shot: 'pressure', act: 'pressure', zh: '先看压力：Anthropic 大仓库每天合并的改动，五月约 2500 次，九月 3 万多次。', en: "First, the pressure. Anthropic's monorepo went from about 2,500 merges a day in May to over 30,000 in September.",
      k: { n1: ['2500', '2,500'], n2: ['3 万', '30,000'] } },
    { id: 'L08', shot: 'pressure', act: 'pressure', zh: 'Claude Code 在单独的仓库里，压力也不小。', en: 'Claude Code has its own repo, under a lot of pressure too.', k: { own: ['单独', 'own repo'] } },
    { id: 'L09', shot: 'pressure', act: 'pressure', zh: '这个速度，靠人一行一行地看，几乎不可能。', en: 'At that speed, line-by-line human review is close to impossible.', k: { cant: ['不可能', 'impossible'] } },
    { id: 'L10', shot: 'pressure', act: 'pressure', zh: '但他们没有取消审查，而是把大部分“读代码”交给了机器。', en: "But they didn't remove review. They moved most of the reading to machines.", k: { move: ['交给了机器', 'to machines'] } },

    // —— 审查是做什么的 ——
    { id: 'L11', shot: 'twojobs', act: 'purpose', zh: '代码审查本来有两份工作：上线前找出问题，和让团队懂代码。', en: 'Code review does two jobs: catch problems before they ship, and spread understanding of the code.',
      k: { j1: ['找出问题', 'catch problems'], j2: ['懂代码', 'understanding'] } },
    { id: 'L13', shot: 'question', act: 'purpose', zh: '他们认为，“人看过没有”只是个粗糙的代替指标。', en: 'They argue that "did a human read it?" is an imprecise proxy.', k: { q1: ['人看过没有', 'did a human'] } },
    { id: 'L14', shot: 'question', act: 'purpose', zh: '该问的是：“这次改动可能出什么错？该由哪一道检查拦下？”', en: 'The real question: what could go wrong, and which check, automated or human, should catch it?',
      k: { q2: ['出什么错', 'what could go wrong'], q3: ['拦下', 'catch'] } },
    { id: 'L15', shot: 'spell', act: 'purpose', zh: '审查也不再是终点前的一道关，而像打字时的拼写检查，一直在跑。', en: 'And review is no longer a gate at the end of the road. It runs all the time, like spellcheck.',
      k: { spell: ['拼写检查', 'spellcheck'] } },

    // —— 人的时间 ——
    { id: 'L16', shot: 'scale', act: 'time', zh: '最稀缺的，是人的时间和注意力。', en: 'The scarce resource is human time and attention.', k: { scarce: ['稀缺', 'scarce'] } },
    { id: 'L17', shot: 'scale', act: 'time', zh: '它有两头：审代码的时间，和收拾烂代码闯祸的时间；这头省了那头涨，等于没省。', en: 'It has two sides: time reviewing, and time fixing what bad code breaks. Save one, lose the other, and you saved nothing.',
      k: { a: ['审代码', 'reviewing'], b: ['闯祸', 'breaks'], zero: ['没省', 'saved nothing'] } },
    { id: 'L19', shot: 'scale', act: 'time', zh: '所以目标是：大多数 PR 最多一个人参与，可以就是作者；回滚率和事故率当护栏。', en: 'So the goal: most PRs merge with at most one human, who can be the author, with revert and incident rates as the guardrail.',
      k: { one: ['一个人', 'one human'], rail: ['护栏', 'guardrail'] } },

    // —— 六层 ——
    { id: 'L21', shot: 'sieve', act: 'layers', zh: '办法是：不靠一道门，靠六层检查，底下再垫一张回滚的网。', en: 'Their answer: not one gate, but six layers of checks, with a rollback net underneath.',
      k: { six: ['六层', 'six layers'], net: ['网', 'net'] } },
    { id: 'L22', shot: 'sieve', act: 'layers', zh: '每一层都会漏，但很少有问题能穿过所有层。', en: 'Every layer misses something. Few problems get through all of them.', k: { few: ['很少', 'Few'] } },

    { id: 'L23', shot: 'selfcheck', act: 'verify', zh: '第一层，开 PR 之前：让 Claude 自己跑检查，拿出结果，而不是只说“做完了”。', en: 'Layer one, before the PR: Claude runs the checks and shows the output, not just "done."',
      k: { test: ['检查', 'checks'], done: ['做完了', 'done'] } },
    { id: 'L25', shot: 'selfcheck', act: 'verify', zh: '再开一个全新上下文的分身，来审这次改动。', en: 'Then a subagent with fresh context reviews the diff.', k: { fresh: ['分身', 'subagent'] } },
    { id: 'L26', shot: 'quote', act: 'verify', zh: 'Claude Code 的创造者 Boris Cherny 说，让 Claude 能验证自己的结果，可能是最重要的一件事，', en: 'Boris Cherny, who created Claude Code, calls verification probably the most important thing,',
      k: { boris: ['Boris', 'Boris'] } },
    { id: 'L27', shot: 'quote', act: 'verify', zh: '他估计，能让最终结果好上两到三倍。', en: 'and estimates it makes results two to three times better.', k: { x3: ['两到三倍', 'two to three'] } },
    { id: 'L28', shot: 'docs', act: 'verify', zh: '同一个问题被反复指出，就从源头改：改 skill、加 lint 规则，或者写进 CLAUDE.md 和 REVIEW.md。', en: 'When the same comment keeps coming up, they fix it at the source: a skill, a lint rule, or CLAUDE.md and REVIEW.md.',
      k: { cm: ['CLAUDE.md', 'CLAUDE.md'], rm: ['REVIEW.md', 'REVIEW.md'] } },
    { id: 'L29', shot: 'docs', act: 'verify', zh: '好的 REVIEW.md 都很短，先说清什么叫出错。比如文档出错，就是“它在撒谎”。', en: 'Good REVIEW.md files are short and say what failure looks like. For docs: "it lies."',
      k: { lies: ['撒谎', 'it lies'] } },

    { id: 'L31', shot: 'jury', act: 'aireview', zh: '第二层，每个 PR 都过 Claude 审查：几个 AI 找 bug，另一组逐条投票，够多 AI 认可才贴出来。', en: 'Layer two: every PR gets a Claude review. Agents hunt for bugs, others vote on each finding, and only agreed ones are posted.',
      k: { hunt: ['找 bug', 'hunt'], vote: ['投票', 'vote'], real: ['认可', 'agreed'] } },
    { id: 'L33', shot: 'tags', act: 'aireview', zh: '留下的标上：重要、小问题、原本就有，老 bug 不算作者的；每条都必须回应。', en: "Survivors are tagged Important, Nit or Pre-existing, so an old bug isn't blamed on the author. Every finding must be answered.",
      k: { t1: ['重要', 'Important'], t2: ['小问题', 'Nit'], t3: ['原本就有', 'Pre-existing'], answer: ['必须回应', 'must be answered'] } },
    { id: 'L35', shot: 'hits', act: 'aireview', zh: '刚上线时，收到实质性意见的内部 PR，从 16% 涨到 54%。', en: 'At launch, internal PRs getting substantive comments went from 16 to 54 percent.',
      k: { a16: ['16', '16'], a54: ['54', '54'] } },

    { id: 'L36', shot: 'gates', act: 'gates', zh: '第三层安全审查，第四层自动化检查；有意见没解决，或者亮了红灯，都不准合。', en: 'Layer three, security review. Layer four, required CI. Any open finding, or anything red, blocks the merge.',
      k: { sec: ['安全审查', 'security review'], ci: ['自动化检查', 'required CI'], red: ['红灯', 'red'] } },
    { id: 'L38', shot: 'gates', act: 'gates', zh: '提 PR 时还要写清：怎么测的，出了事怎么撤回。', en: 'And every PR says how it was tested, and how to undo it.', k: { undo: ['怎么撤回', 'how to undo'] } },

    { id: 'L39', shot: 'tiers', act: 'approval', zh: '第五层，人的批准按风险分级：改文档零个人，普通改动一个，最高风险两个。', en: 'Layer five: human approval scaled by risk. Docs: zero people. Ordinary changes: one. The riskiest code: two.',
      k: { r0: ['零个人', 'zero'], r1: ['一个', 'one'], r2: ['两个', 'two'] } },
    { id: 'L41', shot: 'tiers', act: 'approval', zh: '风险由改动决定，由分类器来定级；而且只有受信任的作者，才能走轻的那条路。', en: 'The change sets the tier, not the author, and a classifier picks it. Only trusted authors get the lighter paths.', k: { cls: ['分类器', 'classifier'] } },
    { id: 'L42', shot: 'tiers', act: 'approval', zh: 'AI 的批准，永远不算人的批准；', en: "An agent's approval never counts as a human's,", k: { never: ['不算', 'never'] } },
    { id: 'L43', shot: 'tiers', act: 'approval', zh: '谁指挥 AI 写的，谁就算一个审核人，跟亲手写的一样。', en: 'and whoever directed the agent counts as a reviewer, as if they had typed it themselves.', k: { who: ['谁就算', 'counts'] } },

    { id: 'L44', shot: 'release', act: 'release', zh: '第六层：合并队列在最新主分支上再查一遍；新功能藏在开关后面，内部先用，再分批发布。', en: 'Layer six: a merge queue re-checks against the latest main. New features ship behind a flag, to employees first, then gradually.',
      k: { mq: ['合并队列', 'merge queue'], flag: ['开关', 'flag'] } },
    { id: 'L46', shot: 'release', act: 'release', zh: '最底下那张网：出了事关掉开关，不用部署，多数问题几分钟就能撤回。', en: 'The net at the bottom: flags turn off without a deploy, and most mistakes are undone in minutes.',
      k: { undo: ['撤回', 'undone'] } },
    { id: 'L47', shot: 'slow', act: 'release', zh: '有个同事说：放慢速度确实能少出错，但主要是因为你什么都做得少了。', en: 'As one colleague put it: slowing down does lower your error rate, but mostly because you do less of everything.',
      k: { less: ['做得少了', 'less of everything'] } },
    { id: 'L48', shot: 'slow', act: 'release', zh: '他们宁可更快地发现、更快地修。', en: "They'd rather get faster at noticing and fixing.", k: { fast: ['更快', 'faster'] } },

    // —— 怎么让 AI 审得更好 ——
    { id: 'L49', shot: 'evalloop', act: 'better', zh: 'AI 审得好不好？每一次事故，都变成一道考题，审查器每天考一遍。', en: 'Is the reviewer any good? Every incident becomes an exam question, and the reviewer takes the exam daily.',
      k: { exam: ['考题', 'exam'] } },
    { id: 'L50', shot: 'evalloop', act: 'better', zh: '改了提示词、工具或模型，分数涨了才留下。', en: 'Change its prompts, tools or model, and the change stays only if the score goes up.',
      k: { up: ['分数涨了', 'score goes up'] } },
    { id: 'L52', shot: 'evalloop', act: 'better', zh: '作者是 AI 时，噪音更贵：人扫一眼就能跳过，AI 会去改，又多一轮。', en: 'Noise costs more when the author is an agent. A person waves off a nit. An agent fixes it, and that is another round.',
      k: { round: ['又多一轮', 'another round'] } },

    { id: 'L53', shot: 'night', act: 'night', zh: '最离谱的一次：AI 写、AI 审，一个 PR 一晚上改了 50 多轮，直到作者叫停。', en: 'The wildest case: an AI author and an AI reviewer took one PR through more than fifty rounds overnight, until its author stopped it.',
      k: { n50: ['50', 'fifty'] } },
    { id: 'L54', shot: 'night', act: 'night', zh: '一查，审查器反复揪出的问题，约 59% 在第一轮就已经在了：', en: 'Git blame showed about 59 percent of what the reviewer kept flagging had been there since its first pass.', k: { n59: ['59', '59'] } },
    { id: 'L55', shot: 'night', act: 'night', zh: '它很少找到新 bug，只是每一轮多挖出几个老的。', en: 'It was rarely finding new bugs, just a few more old ones each round.', k: { old: ['老的', 'old ones'] } },
    { id: 'L56', shot: 'rules', act: 'night', zh: '于是改规矩：三轮不过，就让作者退一步换思路；前几轮之后只看新改动；', en: 'So they changed the rules. After three rounds, the author steps back and rethinks. After the first few passes, review only the new diff.',
      k: { r3: ['三轮', 'three rounds'], diff: ['新改动', 'new diff'] } },
    { id: 'L57', shot: 'rules', act: 'night', zh: '指出一类 bug，让作者一次改完；说过的，不再说。', en: 'Flag the whole class of bug. Never repeat a finding.', k: { cls: ['一类', 'class'], rep: ['不再说', 'Never repeat'] } },

    { id: 'L58', shot: 'converge', act: 'climax', zh: '结果：一轮就过的 PR，从 65% 涨到 78%；', en: 'The result: PRs passing after one round went from 65 to 78 percent.', k: { p78: ['78', '78'] } },
    { id: 'L59', shot: 'converge', act: 'climax', zh: '要改五轮以上的，从 8.9% 降到 1.5%；', en: 'PRs needing five or more rounds fell from 8.9 to 1.5 percent.', k: { p15: ['1.5', '1.5'] } },
    { id: 'L60', shot: 'converge', act: 'climax', zh: '平均审几轮能过，从 2.08 降到 1.32。', en: 'Mean reviews to pass: from 2.08 down to 1.32.', k: { m132: ['1.32', '1.32'] } },

    // —— 人留在哪 ——
    { id: 'L61', shot: 'humans', act: 'human', zh: '那人做什么？把资深工程师拽出来抓低级错误，太贵了。', en: 'So what do people do? Pulling a senior engineer away to catch a routine mistake costs too much.',
      k: { what: ['做什么', 'what do people do'] } },
    { id: 'L62', shot: 'humans', act: 'human', zh: '人只做机器不擅长的：该不该做、高风险代码、会被照抄的架构、看懂证据，', en: 'People keep what machines are bad at: whether to build it, risky code, architecture others will copy, reading the evidence,',
      k: { five: ['不擅长', 'bad at'], d1: ['该不该做', 'whether to build'], d2: ['高风险代码', 'risky code'], d3: ['架构', 'architecture'], d4: ['看懂证据', 'reading the evidence'] } },
    { id: 'L63', shot: 'humans', act: 'human', zh: '以及，对结果负责。', en: 'and owning the outcome.', k: { own: ['负责', 'owning'] } },
    { id: 'L64', shot: 'explainer', act: 'human', zh: '那团队怎么懂代码？想了解哪一块，就让 Claude 现写一份讲解。', en: 'How does anyone learn the code? They ask Claude for an explainer of exactly that slice.',
      k: { exp: ['讲解', 'explainer'] } },
    { id: 'L65', shot: 'explainer', act: 'human', zh: '一行文案改动，几乎教不了你什么；一份讲解，能教你很多。', en: 'A one-line copy change teaches you almost nothing. An explainer teaches you a lot.',
      k: { lot: ['很多', 'a lot'] } },
    { id: 'L66', shot: 'own', act: 'human', zh: '团队的默契：你合进去的，你负责。', en: 'The team norm: you land it, you own it.', k: { land: ['你负责', 'you own it'] } },
    { id: 'L67', shot: 'own', act: 'human', zh: '改动小、都能撤回、风险越大查得越严；复盘只看系统，不追究人。', en: 'Changes are small and reversible, bigger risk gets more checks, and incident reviews look at the system, not the person.',
      k: { sys: ['不追究人', 'not the person'] } },

    // —— 怎么照着做 ——
    { id: 'L69', shot: 'adopt', act: 'adopt', zh: '想照着做？短的 CLAUDE.md 和 REVIEW.md，AI 审查加安全审查，', en: 'Want to try it? A short CLAUDE.md and REVIEW.md, AI and security review,',
      k: { a1: ['CLAUDE.md', 'CLAUDE.md'], a2: ['AI 审查', 'AI and security'] } },
    { id: 'L70', shot: 'adopt', act: 'adopt', zh: '按风险分级批准，限制轮数，合并队列、开关、一键回滚，再把事故变成考题。', en: 'risk-tiered approval, capped review rounds, a merge queue, flags, one-step rollback, and incidents turned into an eval.',
      k: { a3: ['分级', 'risk-tiered'], a4: ['一键回滚', 'one-step rollback'], a5: ['考题', 'eval'] } },

    // —— 结尾 ——
    { id: 'L72', shot: 'ending', act: 'ending', zh: '他们说，哪些改动不用人看就能合，这条线还在往前挪。', en: 'They say the line for what can merge on automated checks alone keeps moving.', k: { line: ['这条线', 'the line'] } },
    { id: 'L73', shot: 'ending', act: 'ending', zh: '代码审查没有消失，只是从“人看过”，变成了“有人负责”。', en: "Review didn't disappear. It moved from 'a human read it' to 'a human owns it.'",
      k: { from: ['人看过', 'a human read it'], to: ['有人负责', 'a human owns it'] } },
    { id: 'L74', shot: 'ending', act: 'ending', zh: '你们团队呢？代码现在谁在审？', en: 'And your team? Who reviews your code now?', k: { who: ['谁在审', 'Who reviews'] } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 5 },
  ],
};

// 旁白：Eleven v4，整条一次合成（一条录音，音高和语速前后一致），只在段与段之间的停顿里分开。
// 语气平和：不加 [excited] 这类标签，稳定度 0.5、表现力 0.15（更激动会像咬着牙说话）。
export const NARRATION = {
  zh: { voice: 'hFamrilbAE6WDMtWgKvu', voiceName: 'Pangge', model: 'eleven_v4', languageCode: 'zh', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
  en: { voice: 'dSByRdUbTGloB7TFA1qD', voiceName: 'Jon - Catalyst', model: 'eleven_v4', languageCode: 'en', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
};
// 只发给合成的读音替换（字幕不变）。逐行、一行一行的“行”读 háng；能改写的多音字已在字幕里改写（做什么、对结果负责、撤回……）。
export const SAY = {
  zh: [['逐行', '逐杭'], ['一行一行', '一杭一杭'], ['一行文案', '一杭文案'], ['CLAUDE.md', 'Claude 点 M D'], ['REVIEW.md', 'Review 点 M D'], ['Boris Cherny', '鲍里斯·切尔尼'],
    ],
  en: [['CLAUDE.md', 'Claude dot M D'], ['REVIEW.md', 'Review dot M D']],
};

// 每个平台一个成片。fmt：h 横屏 1920×1080 · v 竖屏 1080×1920
export const VARIANTS = {
  douyin: { cut: 'short', fmt: 'v', lang: 'zh', name: 'CodeReview_抖音', cta: ['你们团队，代码谁在审？', '评论区打数字'], poll: true },
  // 视频号与抖音画面只差片尾的 CTA：base 指向抖音，渲染时只重画片尾
  channels: { cut: 'short', fmt: 'v', lang: 'zh', name: 'CodeReview_视频号', base: 'douyin', safe67: true, cta: ['你们团队，代码谁在审？', '转给你们组负责 Code Review 的人'], poll: true },
  tiktok: { cut: 'short', fmt: 'v', lang: 'en', name: 'CodeReview_TikTok_Reels_Shorts', cta: ['Who reviews your code now?', 'Comment your number'], poll: true },
  bilibili: { cut: 'long', fmt: 'h', lang: 'zh', name: 'CodeReview_B站', cta: ['你们团队，代码谁在审？', '弹幕打数字'], poll: true },
  youtube: { cut: 'long', fmt: 'h', lang: 'en', name: 'CodeReview_YouTube', cta: ['Who reviews your code now?', 'Tell me in the comments'], poll: true },
};

// 画面上的文字：[中文, English]
export const TXT = {
  header: [['Claude Code 九成代码 AI 写，谁来审？', '合并翻倍，回滚比例反降四成多'], ['AI writes 90% of Claude Code. Who reviews it?', 'Merged PRs 2×, revert share down 40%+']],
  source: ['来源：claude.dev 博客 · Claude Code 团队 · 2026.10.15', 'Source: claude.dev blog · Claude Code team · Oct 15, 2026'],
  chapters: {
    hook: ['开场', 'Intro'], pressure: ['人看不过来了', 'Too much to read'], purpose: ['审查是做什么的', 'What review is for'], time: ['最稀缺的是人', 'Human time'],
    layers: ['六层检查', 'Six layers'], verify: ['① 自己先验证', '① Verify first'], aireview: ['② AI 审查', '② AI review'], gates: ['③④ 安全与自动化', '③④ Security & CI'],
    approval: ['⑤ 按风险批准', '⑤ Risk-based approval'], release: ['⑥ 合并与回滚', '⑥ Merge & rollback'], better: ['让 AI 审得更好', 'A better reviewer'],
    night: ['一晚 50 轮', '50 rounds overnight'], climax: ['结果', 'Results'], human: ['人留在哪', 'Where humans stay'], adopt: ['怎么照着做', 'How to adopt'],
    ending: ['谁在审', 'Who reviews'], end: ['', ''],
  },
  lineByLine: ['逐行审', 'LINE BY LINE'], notAnymore: ['不再逐行', 'NOT ANYMORE'], reviewer: ['审核人', 'reviewer'],
  byClaude: ['Claude 写的', 'by Claude'], byHuman: ['人写的', 'by humans'], ofCode: ['Claude Code 的代码', "Claude Code's code"],
  merged: ['合并的 PR', 'merged PRs'], reverted: ['要回滚的比例', 'revert rate'], jun: ['6 月', 'Jun'], sep: ['9 月', 'Sep'], more: ['更多', 'more'], fewer: ['更少', 'less'],
  mergesDay: ['Anthropic 大仓库 · 每天合并的改动', "Anthropic monorepo · changes merged per day"], may: ['5 月', 'May'], lastEp: ['上期：Anthropic 把 Git 换掉了', 'Last episode: Anthropic replaced Git'],
  oneReviewer: ['一个人', 'one human'],
  oldQ: ['人看过没有？', 'Did a human read it?'], newQ: ['可能出什么错？', 'What could go wrong?'], newQ2: ['该由哪一道检查拦下？', 'Which check should catch it?'],
  layers: [['自己先验证', 'AI 审查', '安全审查', '自动化检查', '人的批准', '合并队列 + 开关'], ['verification', 'AI review', 'security review', 'required CI', 'human approval', 'merge queue + flags']],
  rollback: ['回滚', 'fast rollback'], bugsIn: ['问题', 'problems'],
  tests: ['测试', 'tests'], build: ['构建', 'build'], lint: ['代码规范', 'lint'], shot: ['截图对比', 'screenshot'], fresh: ['全新上下文', 'fresh context'], showOutput: ['拿出结果，别说“做完了”', 'show the output, not "done"'],
  hunters: ['找 bug', 'bug hunters'], voters: ['投票', 'verifiers vote'], posted: ['贴出', 'posted'], droppedStyle: ['只关于风格 → 丢掉', 'style only → dropped'],
  tags: [['重要', '小问题', '原本就有'], ['Important', 'Nit', 'Pre-existing']], mustAnswer: ['每条必须回应：修，或写理由', 'every finding answered: fix it, or give a reason'],
  substantive: ['收到实质性意见的内部 PR', 'internal PRs with substantive comments'], before: ['之前', 'before'], after: ['之后', 'after'],
  security: ['安全审查', 'security review'], ci: ['自动化检查', 'required CI'], ciItems: [['规范', '类型', '测试', '构建'], ['lint', 'types', 'tests', 'build']], blocked: ['不准合', 'BLOCKED'],
  template: [['怎么测的？', '怎么撤回？'], ['How was it tested?', 'How to undo it?']],
  risk: [['低风险', '中风险', '高风险'], ['low risk', 'medium', 'high risk']], riskEx: [['文档 · 文案', '普通改动', '最高风险代码'], ['docs · copy', 'ordinary changes', 'highest-risk code']],
  people: [['0 人', '1 人', '2 人'], ['0 people', '1 person', '2 people']], botApprove: ['AI 批准', 'agent approval'], notHuman: ['≠ 人的批准', "≠ a human's"],
  classifier: ['分类器定级：看改动，不看作者', 'a classifier sets the tier: the change, not the author'], director: ['指挥 AI 的人 = 审核人之一', 'whoever directed the agent = a reviewer'],
  stages: [['合并队列', '功能开关', '内部先用', '分批发布'], ['merge queue', 'feature flag', 'employees first', 'staged release']], minutes: ['多数几分钟撤回', 'most undone in minutes'],
  slowQuote: ['“放慢速度确实能少出错，但主要是因为你什么都做得少了。”', '"Slowing down does lower your error rate, but mostly because you\'re doing less of everything."'],
  colleague: ['—— 原文引用的一位同事', '— one colleague, quoted in the post'],
  round: ['第', 'ROUND'], roundSuffix: ['轮', ''], night: ['一个晚上', 'one night'], author: ['作者', 'author'], reviewerBot: ['审查', 'reviewer'],
  firstPass: ['第一轮就在的老代码', 'there since the first pass'], newBugs: ['新问题', 'new'], stop: ['停！', 'STOP'],
  rules: [['三轮不过，换思路', '之后只看新改动', '指出一类，一次改完', '说过的，不再说'], ['3 rounds, then rethink', 'only the new diff', 'flag the class of bug', 'never repeat a finding']],
  conv: [['一轮就通过', '要改 5 轮以上', '平均审几轮'], ['pass after one round', 'need 5+ rounds', 'mean reviews to pass']],
  decisions: [['该不该做', '高风险代码', '架构', '看懂证据', '对结果负责'], ['Should we build it?', 'Risky code', 'Architecture', 'Reading the evidence', 'Owning the outcome']],
  autoRing: ['自动检查绕一圈', 'automated checks all around'], riskyEx: ['计费 · 自动更新 · CI 流程', 'billing · auto-updater · CI workflows'],
  landOwn: [['你合进去的', '你负责'], ['You land it,', 'you own it.']], ownWhy: [['改动小', '都能撤回', '风险越大查得越严', '复盘看系统，不追究人'], ['small changes', 'everything reversible', 'blast radius sets the bar', 'blame-free reviews']],
  fromTo: [['人看过', '有人负责'], ['a human read it', 'a human owns it']],
  twoJobs: [['找出问题、修掉', '让团队懂代码'], ['find & fix issues', 'share understanding']], proxy: ['粗糙的代替指标', 'an imprecise proxy'],
  gate: ['终点前一道关', 'a gate at the end'], spellcheck: ['像拼写检查，一直在跑', 'like spellcheck, always on'],
  timeSides: [['审代码的时间', '修烂代码的时间'], ['time reviewing', 'time fixing what breaks']], goal: ['大多数 PR：最多 1 个人', 'most PRs: at most 1 human'], canBeAuthor: ['（可以就是作者）', '(can be the author)'],
  guard: ['护栏：回滚率 · 事故率', 'guardrail: reverts · incidents'], saved: ['没省', 'saved nothing'],
  boris: ['Boris Cherny · Claude Code 的创造者', 'Boris Cherny · created Claude Code'], borisQuote: ['让 Claude 能验证自己的结果，可能是最重要的一件事', 'giving Claude a way to verify its work: probably the most important thing'],
  better23: ['结果好 2–3 倍', '2–3× better results'], viaBlog: ['据 claude.dev 博客转述', 'as quoted in the claude.dev post'],
  claudeMd: ['项目是什么 · 约定 · 目标与非目标', 'the project · conventions · goals & non-goals'], reviewMd: ['这里的“出错”长什么样', 'what failure looks like here'],
  fails: [['文档：它在撒谎', '配置：它送错了地方'], ['docs: "it lies"', 'config: "it misroutes"']],
  evalSteps: [['事故 / 回滚', '专家确认', '加进考题', '改审查器', '每天考一遍', '分数涨了？'], ['incident / revert', 'expert-checked', 'added to the set', 'change the reviewer', 'daily eval', 'score up?']],
  keep: ['留下', 'keep'], drop: ['丢掉', 'drop'], responses: [['修了', '说它错了', '本来就这样', '没关系'], ['fixed', 'wrong', 'intentional', "didn't matter"]],
  nitHuman: ['人：扫一眼，跳过', 'human: waves it off'], nitAgent: ['AI：改掉 → 又一轮', 'agent: fixes it → another round'],
  explainer: ['讲解 · 只讲这一块', 'explainer · just this slice'], oneLine: ['一行文案改动', 'one-line copy change'], teaches: [['几乎教不了什么', '教你很多'], ['teaches almost nothing', 'teaches a lot']],
  adopt: [['短的 CLAUDE.md + REVIEW.md', 'AI 审查 + 安全审查', '按风险分级批准', '限制审查轮数', '合并队列 · 开关 · 一键回滚', '事故 → 考题；统计人的时间'],
    ['short CLAUDE.md + REVIEW.md', 'AI review + security review', 'risk-tiered approval', 'capped review rounds', 'merge queue · flags · rollback', 'incidents → eval; measure human time']],
  autoMerge: ['不用人看就能合的改动', 'changes that merge on checks alone'], lineMoves: ['这条线还在往前挪', 'the line keeps moving'],
  poll: [[['1', '全靠人逐行看'], ['2', 'AI 先审，人再看'], ['3', '低风险让 AI 直接合'], ['4', '没人审，线上见']], [['1', 'humans read every line'], ['2', 'AI first, then a human'], ['3', 'low-risk merges on AI alone'], ['4', 'nobody. Prod will tell us']]],
  title: ['谁在审代码', 'WHO REVIEWS'], sign: 'IDEVLAB',
  disclaimer: ['数据与说法均出自 claude.dev 博客；画面为示意', 'All figures from the claude.dev post; visuals are illustrative'],
};
