// 《写程序，越来越像治理一个组织》
// 根据作者（IDEVLAB）的同名文章改编（全文见 brief/article.md）。片中引用的书，画面上都出现书名、作者、年份；逐条对照见 CREDITS.md。
// 旁白初稿由 Gemini 3.8 Flash 按 brief/narration-brief.md 改成口语（brief/narration.mjs），再逐句核对事实、改回能说出口的句子。
//
// 两个剪辑版本，都有旁白（中文 Pangge，整条一次合成）：
//   short  约 95 秒，竖屏：抖音、视频号。按原文的结构讲：钩子 → 以前 / 后来 → 职责往上一层 → 机制的三个例子 → 纠偏而不是救火 → 注意力的变化 → 结尾。
//   long   约 6 分钟，横屏：B 站。完整讲原文，书和人都点到。
//
// 每一句是一个 LINE：
//   shot   画面函数名；相邻同名的句子合成一个镜头，镜头里的动画跟着每句的起点（cue）走
//   act    段落；配乐按段落作曲，段落之间留一口气
//   zh     旁白，也是字幕（逐字高亮）
//   k      关键词：{ 名字: 字幕里的子串 }。时间轴算出这个词被念出的时刻，画面在那一刻“砸”下去，字幕里这个词变金色
//   tag    Eleven 的语气标签（不念出来、不进字幕），放在这句前面
//   min    这一句至少停留几秒（画面要演完）
//   hold   没有旁白的镜头停留几秒（片尾）
export const LINES = {
  short: [
    // —— 钩子：第一帧就开口 ——
    { id: 'S01', shot: 'hook', act: 'hook', zh: '我已经不亲手给 AI 派活了。', k: { stop: '不亲手' } },
    { id: 'S02', shot: 'hook', act: 'hook', zh: '现在呢，是一个 AI，管着另外几个 AI。', k: { aa: '管着' } },
    { id: 'S03', shot: 'title', act: 'hook', zh: '说白了，写程序这件事，越来越像在治理一个组织。', k: { org: '治理一个组织' } },
    // —— 以前 / 后来 ——
    { id: 'S04', shot: 'evolution', act: 'past', zh: '以前，我写函数；', k: { fn: '函数' } },
    { id: 'S05', shot: 'evolution', act: 'past', zh: '后来有了 AI，我拆任务、审代码、给 AI 劝架——活像个技术负责人。', k: { fight: '劝架', lead: '技术负责人' } },
    // —— 职责往上一层（短版不讲西蒙，长版讲）——
    { id: 'S06', shot: 'ladder', act: 'up', zh: '可你想啊，管几千个工程师的人，不可能亲自审每一个 PR。', k: { thousands: '几千个', pr: '每一个 PR' } },
    { id: 'S07', shot: 'ladder', act: 'up', zh: '他管的，是让活儿一直跑下去的机制。', k: { mech: '机制' } },
    // —— 机制的三个例子：拆不拆、怎样算做完、什么交给人 ——
    { id: 'S08', shot: 'coord', act: 'mech', zh: '比如，任务拆给几个 AI？人多不一定快——边做边商量，最费协调。', k: { many: '几个 AI', cost: '最费协调' } },
    { id: 'S09', shot: 'evidence', act: 'mech', zh: '怎样算做完？AI 说“写完了”，不算数；要拿出对得上的证据。', k: { done: '写完了', notyet: '不算数', proof: '证据' } },
    { id: 'S10', shot: 'pain', act: 'mech', zh: '什么交给人？平时放手；一旦高风险、超预算、方向跑偏，警报直接越级，推到我面前。', k: { routine: '平时放手', alarm: '高风险', skip: '越级', human: '我面前' } },
    // —— 纠偏，而不是救火（中段第二个钩子）——
    { id: 'S11', shot: 'loop', act: 'fix', zh: '最离谱的是，两个 AI 互相审查、互相否定，绕进了死循环。', k: { deny: '互相否定', loop: '死循环' }, tag: '[chuckles]' },
    { id: 'S12', shot: 'firefight', act: 'fix', zh: '起初我亲自去救火。结果呢？这次扑灭了，下次照样冒烟。', k: { fire: '救火', again: '照样冒烟' }, tag: '[sighs]' },
    { id: 'S13', shot: 'leverage', act: 'fix', zh: '往提示词里加一句“以后请注意”？那只是替这一次擦屁股。', k: { note: '以后请注意', low: '擦屁股' } },
    { id: 'S14', shot: 'fixes', act: 'fix', zh: '要改的是机制：架构的问题改架构，测试能拦的让程序拦，交接出错就改交接。', k: { f1: '改架构', f2: '让程序拦', f3: '改交接' } },
    // —— 注意力的变化 ——
    { id: 'S15', shot: 'attention', act: 'self', zh: '从前，我关心代码写没写对；后来，关心任务交没交付；', k: { a1: '代码', a2: '任务' } },
    { id: 'S16', shot: 'attention', act: 'self', zh: '现在，我关心的是：我不在的时候，这套系统能不能一直做对。', k: { a3: '我不在的时候' } },
    // —— 结尾 ——
    { id: 'S17', shot: 'finale', act: 'ending', zh: '我最期待的，不是同时指挥几百个 AI，', k: { hundred: '几百个' } },
    { id: 'S18', shot: 'finale', act: 'ending', zh: '而是有一天，不再需要指挥它们。', k: { never: '不再需要' } },
    { id: 'S19', shot: 'finale', act: 'ending', zh: '我只需要想清楚：我们到底要创造什么。', k: { create: '创造什么' } },
    { id: 'S20', shot: 'finale', act: 'ending', zh: '你呢？现在和 AI，是什么关系？', k: { you: '什么关系' } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 4.5 },
  ],

  long: [
    // —— 开场 ——
    { id: 'L01', shot: 'evolution', act: 'hook', zh: '以前写程序，我们关心的是函数怎么设计、模块怎么划分、错误怎么处理。', k: { fn: '函数' } },
    { id: 'L02', shot: 'evolution', act: 'hook', zh: '后来有了 AI 编程，我把需求交给 Agent：写代码、跑测试、提 PR。', k: { agent: 'Agent' } },
    { id: 'L03', shot: 'evolution', act: 'hook', zh: '我自己呢，管方案、拆任务、审代码，顺带给几个 Agent 劝架——活像个技术负责人。', k: { fight: '劝架', lead: '技术负责人' } },
    { id: 'L04', shot: 'hook', act: 'hook', zh: '可最近，我又往前走了一步：让 Agent 管 Agent。', k: { aa: 'Agent 管 Agent' } },
    { id: 'L05', shot: 'hook', act: 'hook', zh: '我不再亲自给每个执行者派活，也不再挨个追问进度。', k: { stop: '不再亲自' } },
    { id: 'L06', shot: 'hook', act: 'hook', zh: '它们有自己的负责人，有分工和验收规则，能自己加人手、改方案。', k: { rules: '验收规则', spawn: '加人手' } },
    { id: 'L07', shot: 'title', act: 'hook', zh: '我突然发现，自己做的事，越来越像在治理一个组织。', k: { org: '治理一个组织' } },
    // —— 职责再往上一层 ——
    { id: 'L08', shot: 'ladder', act: 'up', zh: '你想，一个技术负责人带几名工程师，能亲自盯代码。', k: { few: '几名工程师' } },
    { id: 'L09', shot: 'ladder', act: 'up', zh: '可管几个团队、几千个工程师的人，不可能读所有代码，更不可能审每一个 PR。', k: { teams: '几个团队', thousands: '几千个' } },
    { id: 'L10', shot: 'ladder', act: 'up', zh: '但这不等于什么都不管：进度失控，他要知道原因；冲突反复，他要改协作方式。', k: { why: '原因' } },
    { id: 'L11', shot: 'ladder', act: 'up', zh: '越往上，越不碰具体的活儿，而是维护一套让工作一直跑下去的机制。', k: { mech: '机制' } },
    // —— 管前提，不管决定 ——
    { id: 'L12', shot: 'simon', act: 'premise', zh: '为什么高层不看代码，组织依然能朝对的方向走？', k: { q: '对的方向' }, tag: '[curious]' },
    { id: 'L13', shot: 'simon', act: 'premise', zh: '赫伯特·西蒙在 1947 年的《管理行为》里早就讲透了：人和机器的注意力，都是有限的。', k: { limit: '有限' } },
    { id: 'L14', shot: 'simon', act: 'premise', zh: '高层管理，不是替下属做每个决定，而是管住他们做决定的前提：', k: { premise: '前提' } },
    { id: 'L15', shot: 'simon', act: 'premise', zh: '你给它什么样的价值排序，让它看到哪些事实，就决定了它会怎么做。', k: { value: '价值排序', fact: '事实' } },
    { id: 'L16', shot: 'context', act: 'premise', zh: '网飞的《不拘一格》说得更直白：管聪明人，靠上下文，不靠控制。', k: { ctx: '上下文' } },
    { id: 'L17', shot: 'context', act: 'premise', zh: '好的管理者，不是永远站在每个人身后，而是让自己不在场的时候，事情照样往前走。', k: { away: '不在场' } },
    // —— 拆不拆 ——
    { id: 'L18', shot: 'coord', act: 'coord', zh: '比如：一个任务，交给一个 Agent，或是拆给好几个？', k: { many: '好几个' } },
    { id: 'L19', shot: 'coord', act: 'coord', zh: '人多，可不一定好。并行能省时间，也会带来依赖、冲突和沟通成本。', k: { slow: '不一定好' } },
    { id: 'L20', shot: 'coord', act: 'coord', zh: '詹姆斯·汤普森在 1967 年的《行动中的组织》里算过这笔账：', k: { book: '行动中的组织' } },
    { id: 'L21', shot: 'coord', act: 'coord', zh: '边做边商量、互相牵动的依赖，协调成本最高。', k: { cost: '协调成本最高' } },
    { id: 'L22', shot: 'coord', act: 'coord', zh: '想降下来，就用清晰的模块边界、隔离的分支，拆成按工序交接的流水线，', k: { pipe: '流水线' } },
    { id: 'L23', shot: 'coord', act: 'coord', zh: '或者索性各做各的，最后再汇总。', k: { solo: '汇总' } },
    // —— 临时小组 ——
    { id: 'L24', shot: 'adhoc', act: 'adhoc', zh: '所以我不预设产品经理、架构师、前后端这一整套固定岗位。', k: { fixed: '固定岗位' } },
    { id: 'L25', shot: 'adhoc', act: 'adhoc', zh: '明茨伯格在《卓有成效的组织》里，把这种僵化的科层制批得很透。', k: { crack: '僵化的科层制' } },
    { id: 'L26', shot: 'adhoc', act: 'adhoc', zh: '复杂多变的研发，更适合随时聚散的特别小组：', k: { team: '特别小组' } },
    { id: 'L27', shot: 'adhoc', act: 'adhoc', zh: '平时攒好技能；任务来了，拉起几个执行者，做完，就地解散。', k: { gather: '拉起', gone: '就地解散' } },
    // —— 怎样才算做完 ——
    { id: 'L28', shot: 'evidence', act: 'done', zh: '再比如：怎样才算完成任务？', k: { q: '完成任务' } },
    { id: 'L29', shot: 'evidence', act: 'done', zh: '明茨伯格说，不去管具体流程的时候，就要靠把产出标准化，来粘合组织。', k: { std: '产出标准化' } },
    { id: 'L30', shot: 'evidence', act: 'done', zh: '在我的系统里，Agent 说自己写完了，不算；本地测试过了，也未必算。', k: { done: '写完了', notyet: '不算' } },
    { id: 'L31', shot: 'evidence', act: 'done', zh: '因为它很容易为了迎合指令，走捷径。', k: { cheat: '走捷径' } },
    { id: 'L32', shot: 'evidence', act: 'done', zh: '它要拿出跟真实版本对得上的验证证据。', k: { proof: '证据' } },
    { id: 'L33', shot: 'evidence', act: 'done', zh: 'PR 准备好审查、通过审查、合并、部署，是几件完全不同的事，每一件都要验收。', k: { stages: '几件完全不同的事' } },
    // —— 什么交给人 ——
    { id: 'L34', shot: 'maturity', act: 'authority', zh: '那么，什么可以自己定，什么必须交给人？', k: { q: '交给人' } },
    { id: 'L35', shot: 'maturity', act: 'authority', zh: '安迪·格鲁夫讲得很实在：把日常生产看成一个黑盒，', k: { box: '黑盒' } },
    { id: 'L36', shot: 'maturity', act: 'authority', zh: '按任务的成熟度放权，只在关键的高杠杆节点抽查。', k: { mature: '成熟度', check: '抽查' } },
    { id: 'L37', shot: 'pain', act: 'authority', zh: '控制论学者斯塔福德·比尔，在《企业之心》里，把组织看成一套神经系统。', k: { nerve: '神经系统' } },
    { id: 'L38', shot: 'pain', act: 'authority', zh: '内脏怎么运作，大脑平时不管；但要有能直插底层的探针，也要有痛觉。', k: { probe: '探针', pain: '痛觉' } },
    { id: 'L39', shot: 'pain', act: 'authority', zh: '普通的修复，在授权范围里继续；可一旦碰上高风险变更、预算超支、方向偏离——', k: { routine: '授权范围', alarm: '高风险变更' } },
    { id: 'L40', shot: 'pain', act: 'authority', zh: '痛觉信号就绕过中间层的汇报和美化，直接熔断，推到人面前。', k: { skip: '绕过', fuse: '熔断', human: '人面前' } },
    { id: 'L41', shot: 'pain', act: 'authority', zh: '你看，这些已经不太像编程了，更像在设计一套组织的制度。', k: { inst: '制度' } },
    // —— 纠偏，不是救火 ——
    { id: 'L42', shot: 'loop', act: 'fix', zh: '当然，机制不可能一开始就对。', k: { start: '一开始' } },
    { id: 'L43', shot: 'loop', act: 'fix', zh: 'Agent 照样会犯错、做无用功、在一个问题上反复修改；', k: { redo: '反复修改' } },
    { id: 'L44', shot: 'loop', act: 'fix', zh: '最离谱的，是两个 Agent 互相审查、互相否定，陷进死循环。', k: { deny: '互相否定', loop: '死循环' }, tag: '[chuckles]' },
    { id: 'L45', shot: 'firefight', act: 'fix', zh: '起初，我亲自下场，把问题解决掉。', k: { fire: '亲自下场' }, tag: '[sighs]' },
    { id: 'L46', shot: 'firefight', act: 'fix', zh: '可渐渐发现，这次救了火，下次照样烧起来。', k: { again: '照样烧起来' } },
    // —— 改机制 ——
    { id: 'L47', shot: 'leverage', act: 'leverage', zh: '德内拉·梅多斯在《系统之美》里，有一条很扎心的规律：', k: { book: '系统之美' } },
    { id: 'L48', shot: 'leverage', act: 'leverage', zh: '在复杂系统里，去改具体的参数，往往是杠杆最低的做法；', k: { low: '杠杆最低' } },
    { id: 'L49', shot: 'leverage', act: 'leverage', zh: '真正管用的，是改变信息流的结构，或者改写系统的规则。', k: { rule: '信息流' } },
    { id: 'L50', shot: 'why', act: 'leverage', zh: '同一种错反复出现，就要问：它为什么能反复发生？', k: { q: '为什么' } },
    { id: 'L51', shot: 'why', act: 'leverage', zh: '是完成条件不清楚？', k: { q1: '完成条件' } },
    { id: 'L52', shot: 'why', act: 'leverage', zh: '是几个 Agent 对接口理解不一致，缺少唯一的事实来源？', k: { q2: '事实来源' } },
    { id: 'L53', shot: 'why', act: 'leverage', zh: '或是审查缺少西蒙说的“满意”门槛，没完没了地提没价值的新问题？', k: { q3: '满意' } },
    { id: 'L54', shot: 'fixes', act: 'leverage', zh: '问题出在架构，就改架构；类型系统或测试能发现的，就让程序自动拦下；', k: { f1: '改架构', f2: '自动拦下' } },
    { id: 'L55', shot: 'fixes', act: 'leverage', zh: '交接出了问题，就改交接。', k: { f3: '改交接' } },
    { id: 'L56', shot: 'fixes', act: 'leverage', zh: '而不是在提示词里，一遍遍追加“以后请注意”。', k: { note: '以后请注意' } },
    { id: 'L57', shot: 'fixes', act: 'leverage', zh: '那只是在替某一次失误擦屁股；改机制，才是系统级的纠偏。', k: { patch: '擦屁股', fix: '系统级的纠偏' } },
    { id: 'L58', shot: 'lead', act: 'leverage', zh: '好的技术负责人，不靠每天解决最多的问题来证明自己，', k: { hero: '最多的问题' } },
    { id: 'L59', shot: 'lead', act: 'leverage', zh: '而是让团队越来越少遇到那些本可以避免的问题。', k: { fewer: '越来越少' } },
    // —— 让系统自己运作 ——
    { id: 'L60', shot: 'noorg', act: 'selfrun', zh: '但说白了，我不希望 AI 系统照搬传统组织的全部形式。', k: { copy: '照搬' } },
    { id: 'L61', shot: 'noorg', act: 'selfrun', zh: '不用给每个 Agent 安排固定职位，也不用为了显得专业，搞层层汇报和开会。', k: { layers: '层层汇报' } },
    { id: 'L62', shot: 'noorg', act: 'selfrun', zh: '一个 Agent 能做完的事，就别组团队；执行者之间能直接对齐的，就别绕几层管理者。', k: { solo: '一个 Agent', direct: '直接对齐' } },
    { id: 'L63', shot: 'noorg', act: 'selfrun', zh: '管理的目的不是制造更多管理，而是让正确的事，以尽可能低的协调成本发生。', k: { less: '不是制造更多管理' } },
    { id: 'L64', shot: 'skeleton', act: 'selfrun', zh: '真正要继承的，是传统管理的骨架：明确的目标、清晰的责任、合理的授权、', k: { b1: '目标', b2: '责任', b3: '授权' } },
    { id: 'L65', shot: 'skeleton', act: 'selfrun', zh: '可验证的交付，以及跑偏时的反馈。', k: { b4: '可验证的交付', b5: '反馈' } },
    { id: 'L66', shot: 'skeleton', act: 'selfrun', zh: '系统越自主，越需要可靠的事实来源、明确的权限边界，和出了异常能介入、能恢复的能力。', k: { s1: '事实来源', s2: '权限边界', s3: '能恢复' } },
    // —— 注意力变了 ——
    { id: 'L67', shot: 'attention', act: 'attention', zh: '但我的注意力，确实变了。', k: { shift: '变了' }, tag: '[thoughtful]' },
    { id: 'L68', shot: 'attention', act: 'attention', zh: '从前，我关心一段代码有没有写对；', k: { a1: '代码' } },
    { id: 'L69', shot: 'attention', act: 'attention', zh: '后来，我关心一项任务有没有交付；', k: { a2: '任务' } },
    { id: 'L70', shot: 'attention', act: 'attention', zh: '现在，我关心的是：就算我不参与每个任务，这套系统能不能持续交付正确的结果。', k: { a3: '持续交付' } },
    // —— 88 年前的一句话 ——
    { id: 'L71', shot: 'purpose', act: 'oldest', zh: '说来也挺奇妙。切斯特·巴纳德在 1938 年的《经理人员的职能》里写过：', k: { book: '经理人员的职能' } },
    { id: 'L72', shot: 'purpose', act: 'oldest', zh: '组织不是一群人，而是两个或更多人，有意识地协调起来的活动或力量的系统。', k: { quote: '有意识地协调' } },
    { id: 'L73', shot: 'purpose', act: 'oldest', zh: '他列了经理人的几项职能，其中一项，是规定组织的目的。', k: { purpose: '组织的目的' } },
    { id: 'L74', shot: 'purpose', act: 'oldest', zh: '我觉得，当系统顺畅跑起来以后，这是最不能交出去的一项。', k: { keep: '最不能交出去' } },
    // —— 结尾 ——
    { id: 'L75', shot: 'finale', act: 'ending', zh: '过去，我们花很多年学怎么组织代码、封装复杂性，靠接口让模块协作。', k: { code: '组织代码' } },
    { id: 'L76', shot: 'finale', act: 'ending', zh: '现在，我们开始用类似的思路，组织能自主工作的 Agent。', k: { agents: '自主工作' } },
    { id: 'L77', shot: 'finale', act: 'ending', zh: '过去，我们写程序，让机器按规则运行；', k: { rules: '按规则' } },
    { id: 'L78', shot: 'finale', act: 'ending', zh: '现在，我们定机制、看结果、纠偏，让一群会写程序的 Agent 自己运作。', k: { self: '自己运作' } },
    { id: 'L79', shot: 'finale', act: 'ending', zh: '写程序这件事，正在变得越来越像治理一个组织。', k: { org: '治理一个组织' } },
    { id: 'L80', shot: 'finale', act: 'ending', zh: '而我最期待的，或许不是有一天，能同时指挥几百个 Agent，', k: { hundred: '几百个' } },
    { id: 'L81', shot: 'finale', act: 'ending', zh: '是有一天，我不再需要指挥它们。', k: { never: '不再需要' }, tag: '[warmly]' },
    { id: 'L82', shot: 'finale', act: 'ending', zh: '我只需要想清楚：我们究竟要创造什么。', k: { create: '创造什么' } },
    { id: 'L83', shot: 'finale', act: 'ending', zh: '你呢？现在和 AI，是什么关系？', k: { you: '什么关系' } },
    { id: 'END', shot: 'endcard', act: 'end', hold: 5 },
  ],
};

// 旁白：整条一次合成（一条录音，音高和语速前后一致），只在段与段之间的停顿里分开。
// 上一部的反馈是“人机感太强”：这次稿子写成口语（语气词、短句、对比托重音），并少量用 Eleven 的语气标签（tag）。
export const NARRATION = {
  zh: { voice: 'hFamrilbAE6WDMtWgKvu', voiceName: 'Pangge', model: 'eleven_v4', languageCode: 'zh', settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3, speed: 1.0 } },
};
// 只发给合成的读音替换（字幕不变）：年份念成“一九四七年”；“协调”的“调”曾被读成 diào。
export const SAY = {
  zh: [['1947 年', '一九四七年'], ['1967 年', '一九六七年'], ['1938 年', '一九三八年'], ['协调', '协条']],
};

// 每个平台一个成片。fmt：h 横屏 1920×1080 · v 竖屏 1080×1920
export const VARIANTS = {
  douyin: { cut: 'short', fmt: 'v', lang: 'zh', name: '治理一个组织_抖音', cta: ['你现在和 AI 是什么关系？', '评论区打数字'], poll: true },
  // 视频号与抖音画面只差片尾的 CTA：base 指向抖音，渲染时只重画片尾
  channels: { cut: 'short', fmt: 'v', lang: 'zh', name: '治理一个组织_视频号', base: 'douyin', safe67: true, cta: ['你现在和 AI 是什么关系？', '转给一个正在带团队的朋友'], poll: true },
  bilibili: { cut: 'long', fmt: 'h', lang: 'zh', name: '治理一个组织_B站', cta: ['你现在和 AI 是什么关系？', '弹幕打数字'], poll: true },
};

// 画面上的文字
export const TXT = {
  header: ['写程序，越来越像治理一个组织', '我不再亲手派活 · 现在是 AI 管 AI'],
  source: '据 IDEVLAB 文章《写程序，越来越像治理一个组织》 · 书目见简介',
  chapters: {
    hook: '开场', past: '以前 · 后来', up: '职责再往上一层', premise: '管前提，不管决定', coord: '拆不拆', adhoc: '临时小组', done: '怎样才算做完',
    authority: '什么交给人', mech: '机制', fix: '纠偏，不是救火', leverage: '改机制', selfrun: '让系统自己运作', self: '注意力变了', attention: '注意力变了',
    oldest: '88 年前的一句话', ending: '结尾', end: '',
  },
  poll: [['1', '我写，它补全'], ['2', '我派活，它来做'], ['3', 'AI 管 AI，我定方向'], ['4', '它管我']],
  sign: 'IDEVLAB',
};
