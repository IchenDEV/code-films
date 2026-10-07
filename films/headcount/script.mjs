// 《编制 · Headcount》：反对 AI 官僚主义。根据一篇文章改写，并加入了本片自己的观点（第四章、交接失真、调度器变中层）。
// 画面是一组构成主义的剪纸拼贴：米色纸上，黑色的方块是固定的工位，红色的圆是随任务出现、做完就消失的执行者。
export const LINES = {
  // 冷开场 · 一个登录异常
  n1: ['一个偶发的登录异常。系统派出了产品经理、架构师、后端、前端和测试；为了体面，又加了一位项目经理居中协调。',
       'One flaky login bug. The system sends a product manager, an architect, a backend agent, a frontend agent and a tester. And for appearances, a project manager to coordinate.'],
  n2: ['控制台里热闹非凡。“请确认是否已复现。”“上下文已转交后端。”“有什么进展吗？”',
       'The console is busy. “Please confirm you can reproduce it.” “Context handed to backend.” “Any update?”'],
  n3: ['而这件事，一个拿着工具的执行流，两分钟就能修完。',
       'One agent with the right tools could have fixed it in two minutes.'],
  n4: ['我们本想用 AI 消除组织的摩擦，却亲手把最旧的那种摩擦，写进了系统提示词。',
       'We wanted AI to remove the friction of organizations. Instead, we wrote the oldest kind of friction into the system prompt.'],
  // 01 · 编制
  d1: ['这就是 AI 官僚主义：角色、层级和审批，从手段变成了目的。算力都花在伺候内部协调上，换不回相称的质量。',
       'This is AI bureaucracy: roles, layers and approvals turn from means into ends. Compute goes into serving internal coordination, and the quality never pays it back.'],
  d2: ['问题不在 Agent 多，也不在有人协调。问题在顺序：先照着公司挂好工位牌，再让每件事都从流水线上走一遍。',
       'The problem isn’t many agents, or having a coordinator. It’s the order: hang up a company’s nameplates first, then push every task down the whole line.'],
  d3: ['真正该被追问的，不是“为什么不设这个岗位”，而是“这件事，凭什么要经过它”。',
       'The question isn’t “why don’t we have this role?” It’s “why does this task have to pass through it?”'],
  // 02 · 交接税
  c1: ['协调不是免费的。谷歌和 MIT 的研究者比较了一百八十种智能体配置：能拆开并行的任务，多智能体确实更强。',
       'Coordination isn’t free. Researchers at Google and MIT compared a hundred and eighty agent configurations. On tasks that split into parallel parts, multi-agent systems really did better.'],
  c2: ['可在一步扣一步的推理任务上，所有多智能体方案都退步了，跌幅从百分之三十九到七十。',
       'But on tasks where each step depends on the last, every multi-agent variant got worse, by thirty-nine to seventy percent.'],
  c3: ['我想补一句：交接最贵的不是 token，是失真。每一次转述都是有损压缩：下游拿到的是摘要，丢掉的是上游做过的那些隐含决定。',
       'I’d add one thing: the real cost of a handoff isn’t tokens, it’s distortion. Every retelling is lossy compression. Downstream gets the summary, and loses the quiet decisions made upstream.'],
  c4: ['于是拆得越细，越要同步；同步越多，越要总结；总结打架，就再设一个协调官。问题还没动，组织已经叠床架屋。',
       'So the finer you split, the more you sync. The more you sync, the more you summarize. When summaries clash, you add a coordinator. The problem hasn’t moved, and the org chart is already a tower.'],
  // 03 · 即时
  j1: ['解法不是取消组织，而是让组织随任务即时形成。',
       'The answer isn’t no organization. It’s organization that forms around the task, just in time.'],
  j2: ['组织者更像调度器，只问四件事：现在什么能推进？需要什么能力？哪些可以并行？什么产物值得接受？',
       'The organizer works like a scheduler, and asks four things. What can move now? What does it need? What can run in parallel? What result is good enough to accept?'],
  j3: ['要排查页面，就即时派生一个实例：给它浏览器、日志和一个时限。做完，回收，上下文归零，只交回证据。',
       'Need to debug a page? Spawn an instance on the spot: give it a browser, the logs, and a time limit. When it’s done, it’s reclaimed, its context is cleared, and only the evidence comes back.'],
  j4: ['临时的是执行者，持久的是产物。', 'The workers are temporary. The results are permanent.'],
  // 04 · 三条理由（本片的补充）
  o1: ['那什么时候值得多派一个？我的检验只有三条。', 'So when is another agent worth it? My test has three questions.'],
  o2: ['第一，活能真正并行。读资料、查日志、搜代码，可以很多双眼睛一起看；但写，最好只有一支笔。几个实例同时改同一份东西，各自的隐含决定会在合并时打架。',
       'One: the work truly runs in parallel. Reading docs, scanning logs, searching code: many eyes can look at once. But writing should have one pen. When several instances edit the same thing, their hidden choices collide at merge time.'],
  o3: ['第二，需要一双没被说服过的眼睛。审查者最好从空白的上下文出发，不继承作者的假设。这不是分工，是制衡。这一种结构，值得留下。',
       'Two: you need eyes that haven’t been convinced yet. A reviewer should start from a blank context, without the author’s assumptions. That isn’t division of labor, it’s a check and balance. That kind of structure is worth keeping.'],
  o4: ['第三，需要隔离权限。能碰生产数据库的，和随手读网页的，不该是同一个进程。',
       'Three: you need to separate permissions. The process that can touch the production database shouldn’t be the one browsing random web pages.'],
  o5: ['三条都不沾，就别拆。', 'If none of the three applies, don’t split.'],
  // 05 · 不是种姓
  m1: ['模型各有所长：有的文字顺，有的抠逻辑狠，有的审美在线；速度和价格，还差着十倍、百倍。',
       'Models have their strengths. One writes smoothly, one is relentless on logic, one has taste. And they differ ten or a hundredfold in speed and price.'],
  m2: ['但别把工位牌换成模型的名字，搞出一套模型种姓。那只是把人的官僚，换成了品牌的官僚。',
       'But don’t swap the nameplates for model names and build a caste system. That just trades office bureaucracy for brand bureaucracy.'],
  m3: ['调度的单位是一份规格：模型、推理强度、工具、上下文，和预算。难题给足算力，琐事交给又快又便宜的。',
       'The unit of scheduling is a spec: model, reasoning effort, tools, context, and budget. Hard problems get real compute. Chores go to whatever is fast and cheap.'],
  // 06 · 回收
  r1: ['JIT 也不只发生在开头。新证据一回来，后续任务就该增加、合并，或者当场熔断，而不是把预算烧完。',
       'Just in time doesn’t stop at the start. When new evidence comes back, the next tasks should grow, merge, or be cut on the spot, not left to burn the budget.'],
  r2: ['还有一个陷阱，我想说在前面：调度器自己，也可能长成新的中层。它一旦开始要汇报、写周报、给自己派活，官僚就换了个工位，又回来了。',
       'And one trap I want to name: the scheduler itself can grow into middle management. Once it starts asking for status reports and assigning work to itself, bureaucracy is back, at a new desk.'],
  r3: ['责任，也不会随实例一起销毁。它留在可追溯的记录、可复查的产物，和真正拥有目标的那个人身上。',
       'Responsibility isn’t destroyed with the instance. It lives in the records you can trace, the results you can check, and the person who actually owns the goal.'],
  // 尾声
  e1: ['AI 原生的系统，不需要证明自己像一家公司。不用打卡，不用职场礼仪，也不用在控制台里演办公室政治。',
       'An AI-native system doesn’t need to prove it looks like a company. No time cards, no office manners, no office politics acted out in the console.'],
  e2: ['任务应当催生组织，而不是编制滋生任务。', 'Let the work create the team. Not the headcount create the work.'],
};

// 章节号：左上角一枚红色的斜切纸片
export const CAPTIONS = {
  c1: ['01 · 编制', '01 · HEADCOUNT'], c2: ['02 · 交接税', '02 · THE HANDOFF TAX'], c3: ['03 · 即时', '03 · JUST IN TIME'],
  c4: ['04 · 三条理由', '04 · THREE REASONS'], c5: ['05 · 不是种姓', '05 · NOT A CASTE'], c6: ['06 · 回收', '06 · RECLAIM'],
};

export const SHOTS = [
  { kind: 'title', lines: [], min: 5.5, xf: 0 },
  { kind: 'tower', lines: ['n1'], lead: 0.6, tail: 0.8, xf: 1.0 },
  { kind: 'chatter', lines: ['n2'], lead: 0.4, tail: 0.8, xf: 0.6 },
  { kind: 'direct', lines: ['n3'], lead: 0.4, tail: 1.4, xf: 0.6 },
  { kind: 'stamp', lines: ['n4'], lead: 0.5, tail: 1.4, xf: 0.8 },
  { kind: 'loop', lines: ['d1'], lead: 0.8, tail: 0.8, caption: 'c1', xf: 0.9 },
  { kind: 'belt', lines: ['d2', 'd3'], lead: 0.5, gap: 0.6, tail: 1.2, xf: 0.8 },
  { kind: 'bars', lines: ['c1', 'c2'], lead: 0.8, gap: 0.5, tail: 1.0, caption: 'c2', xf: 0.9 },
  { kind: 'whisper', lines: ['c3'], lead: 0.5, tail: 1.0, xf: 0.8 },
  { kind: 'sprawl', lines: ['c4'], lead: 0.5, tail: 1.2, xf: 0.8 },
  { kind: 'sched', lines: ['j1', 'j2'], lead: 0.8, gap: 0.6, tail: 0.9, caption: 'c3', xf: 0.9 },
  { kind: 'spawn', lines: ['j3', 'j4'], lead: 0.5, gap: 0.6, tail: 1.2, xf: 0.8 },
  { kind: 'eyes', lines: ['o1', 'o2'], lead: 0.8, gap: 0.6, tail: 0.8, caption: 'c4', xf: 0.9 },
  { kind: 'fresh', lines: ['o3'], lead: 0.5, tail: 0.9, xf: 0.8 },
  { kind: 'walls', lines: ['o4', 'o5'], lead: 0.5, gap: 0.8, tail: 1.4, xf: 0.8 },
  { kind: 'caste', lines: ['m1', 'm2'], lead: 0.8, gap: 0.6, tail: 0.9, caption: 'c5', xf: 0.9 },
  { kind: 'spec', lines: ['m3'], lead: 0.5, tail: 1.2, xf: 0.8 },
  { kind: 'prune', lines: ['r1'], lead: 0.8, tail: 0.9, caption: 'c6', xf: 0.9 },
  { kind: 'creep', lines: ['r2'], lead: 0.5, tail: 1.0, xf: 0.8 },
  { kind: 'ledger', lines: ['r3'], lead: 0.5, tail: 1.4, xf: 0.8 },
  { kind: 'office', lines: ['e1'], lead: 0.8, tail: 0.8, xf: 1.0 },
  { kind: 'final', lines: ['e2'], lead: 0.8, tail: 3.2, min: 7, xf: 0.9 },
  { kind: 'end', lines: [], min: 6, xf: 1.2 },
];
