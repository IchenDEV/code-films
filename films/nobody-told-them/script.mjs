// 《初生牛犊 · Nobody Told Them》：根据 Theo（t3.gg）的一段直播整理的短片。
// 画面是一本孔版印刷（risograph）的小册子：两种专色——荧光粉与孔版蓝——叠印在米色纸上，略微错版。
export const LINES = {
  p1: ['Theo 在脑子里画过一架梯子：人们怎样用 AI，模型每变强一次，它又怎样变。',
       'Theo once drew a ladder in his head: how people use AI, and how it changes each time the models get better.'],
  // 第一章 · 梯子
  t1: ['第一层：AI 帮你做本来就会的事——补一行代码，改一个熟悉的工具。',
       'Rung one: AI helps with what you already know. It finishes a line, or tweaks a tool you use.'],
  t2: ['一切，还在你的小泡泡里。', 'Everything stays in your little bubble.'],
  t3: ['第二层：让它去你不太懂的地方。Theo 在发布 Rust 项目，可他几乎不会 Rust。',
       'Rung two: you let it go where you don’t quite understand. Theo ships Rust projects, and he barely knows Rust.'],
  t4: ['代码不是他写的，用户却是真的。', 'He isn’t really writing the code. The users are real.'],
  t5: ['第三层最疯狂：拆开《超级马里奥 64》这样的编译代码。没有哪个人能完整看懂它，AI 却能懂到足以动手。',
       'Rung three is the crazy one: opening up compiled code like Super Mario 64. No one person fully understands it. AI understands it well enough to work inside.'],
  // 第二章 · 潮水
  g1: ['模型每升级一次，抬起的人都不一样：开发者，懂技术却不写代码的人，完全不懂技术的人。',
       'Every time models level up, they lift different people: developers, technical people who don’t code, and non-technical people.'],
  g2: ['起初，主要是开发者受益；后来，懂技术的人也能改网站、写脚本了。',
       'At first it was mostly developers. Then technical people started editing sites and writing scripts.'],
  g3: ['到了 Opus 4.5，没怎么写过代码的人也能做出应用；Fable 5 又让开发者一下跃远。Theo 以为，鸿沟会越拉越宽。',
       'By Opus 4.5, people who had barely coded could build apps. Fable 5 sent developers leaping ahead, and Theo thought the gap would only widen.'],
  g4: ['然后是 Opus 5.5。变的不是能力，是门槛：一个模型，几乎什么都能做，价格也够得着。',
       'Then came Opus 5.5. What changed wasn’t power, it was access: one model that does almost anything, at a price people can reach.'],
  g5: ['没打开过 Blender 的人，开始把童年游戏里的地图，搬进自己逆向出来的游戏。',
       'People who had never opened Blender began porting maps from childhood games into games they had reverse engineered.'],
  g6: ['完全不懂技术的人，还没走远。这就是机会：以前帮妈妈修电脑的人，现在能替她解决更多事。',
       'Non-technical people haven’t moved as far yet. That’s the opportunity: whoever fixed their mom’s computer can now solve much more for her.'],
  // 第三章 · 怪人
  w1: ['Theo 最辣的观点是：开发者，其实不太有创意。', 'Theo’s spiciest take: developers aren’t especially creative.'],
  w2: ['我们很会交付代码。可很多所谓的创意，只是把现成的库，换个方式连起来。',
       'We’re great at delivering code. But much of what we call creativity is linking existing libraries in a slightly new way.'],
  w3: ['反倒是懂技术、不写代码的人，硬用 Zapier 把毫不相干的系统绑在一起；有人在 OBS 里叠了四万个场景。',
       'Meanwhile, technical non-coders forced unrelated systems together with Zapier. One built forty thousand scenes in OBS, stacked like layers.'],
  w4: ['完全不是设计好的用法。可它管用。', 'Nothing like how it was designed. But it works.'],
  w5: ['他问过：为什么不能把环境变量文件提交进 Git？因为有密钥。可真正的问题是：今天这些边界，是因为它对，还是工具恰好长成了这样？',
       'He asked: why can’t we commit our env files? Because secrets. But are today’s boundaries right, or just how the tools happened to grow?'],
  w6: ['音乐里常这样：有人学错了远方的曲子，混进本地的东西，长成了新的声音。软件也会，出自那些不知道什么“不该要”的人。',
       'Music does this all the time: someone copies a distant style wrong, mixes in something local, and a new sound is born. Software will too, from people who don’t know what they’re not supposed to ask for.'],
  // 第四章 · 扔掉
  y1: ['疯狂的实验，现在谁都能做。但还得愿意失败。', 'Crazy experiments are open to everyone now. But you have to be willing to fail.'],
  y2: ['开发者让 AI 花两小时写出两千行，心里还按一周的活去心疼，舍不得扔。',
       'A developer gets two thousand lines from two hours with AI, and still guards it like a week of work.'],
  y3: ['不写代码的人想的是：试试看，不行就算了。', 'A non-coder thinks: let’s see if this works. If not, fine.'],
  y4: ['Theo 想找一个 AI 做不到的任务：用 Rust 重写 TypeScript 编译器。不到二十小时，它跑起来了，现在比官方的 Go 版本快两三倍。',
       'Theo tried to invent a task AI couldn’t do: rewrite the TypeScript compiler in Rust. It ran in under twenty hours, and now beats the Go version by two to three times.'],
  // 第五章 · 目标
  o1: ['目标，比技术偏好更重要。', 'Goals matter more than technical preferences.'],
  o2: ['他在做一个操作系统，却几乎不放自己的喜好：用 Bash 不用 Zsh，因为智能体三成以上的错误出在 Shell 上。它不是给他用的，是给他的智能体用的。',
       'He’s building an operating system with almost none of his taste in it: Bash, not Zsh, because a third of his agents’ errors came from the shell. It’s not for him. It’s for his agents.'],
  // 第六章 · 我错了
  x1: ['经验，也可能变成枷锁。它教会我们，什么东西“不该放在一起”。', 'Expertise can become a constraint. It teaches us what doesn’t belong together.'],
  x2: ['那个遇到问题就说“装个 Ubuntu 吧”的高中同学，也许会跑在你前面。',
       'That high school friend whose answer to everything was “install Ubuntu” might run laps around you.'],
  x3: ['Theo 说：我错了。他以为开发者和其他人的差距会越来越大。现在，他不那么确定了。',
       'Theo says: I was wrong. He thought the gap between developers and everyone else would keep widening. Now he isn’t so sure.'],
  x4: ['想象力、品味、敢问蠢问题、敢扔掉失败的作品——这些，会越来越重要。',
       'Imagination, taste, asking stupid questions, throwing away failed work: these will matter more and more.'],
  x5: ['未来会很怪。也许，还很酷。', 'The future is going to be weird. And probably pretty cool.'],
};

// 章节号：印在左上角的一枚粉色贴纸
export const CAPTIONS = {
  c1: ['01 · 梯子', '01 · THE LADDER'], c2: ['02 · 潮水', '02 · THE TIDE'], c3: ['03 · 怪人', '03 · THE WEIRDOS'],
  c4: ['04 · 扔掉', '04 · THROW IT AWAY'], c5: ['05 · 目标', '05 · THE GOAL'], c6: ['06 · 我错了', '06 · I WAS WRONG'],
};

export const SHOTS = [
  { kind: 'title', lines: [], min: 5.0, xf: 0 },
  { kind: 'ladder', lines: ['p1'], lead: 0.6, tail: 1.2, xf: 1.0 },
  { kind: 'bubble', lines: ['t1', 't2'], lead: 0.6, gap: 0.5, tail: 0.8, caption: 'c1', xf: 0.8 },
  { kind: 'crab', lines: ['t3', 't4'], lead: 0.5, gap: 0.5, tail: 0.9, xf: 0.8 },
  { kind: 'deep', lines: ['t5'], lead: 0.5, tail: 1.4, xf: 0.9 },
  { kind: 'tanks', lines: ['g1', 'g2', 'g3', 'g4'], lead: 0.6, gap: 0.5, tail: 1.0, caption: 'c2', xf: 0.9 },
  { kind: 'maps', lines: ['g5'], lead: 0.5, tail: 0.8, xf: 0.8 },
  { kind: 'rope', lines: ['g6'], lead: 0.5, tail: 1.2, xf: 0.8 },
  { kind: 'bricks', lines: ['w1', 'w2'], lead: 0.6, gap: 0.5, tail: 0.8, caption: 'c3', xf: 0.9 },
  { kind: 'layers', lines: ['w3', 'w4'], lead: 0.5, gap: 0.5, tail: 0.9, xf: 0.8 },
  { kind: 'envfile', lines: ['w5'], lead: 0.5, tail: 0.9, xf: 0.8 },
  { kind: 'music', lines: ['w6'], lead: 0.5, tail: 1.2, xf: 0.8 },
  { kind: 'trash', lines: ['y1', 'y2', 'y3'], lead: 0.6, gap: 0.5, tail: 0.8, caption: 'c4', xf: 0.9 },
  { kind: 'tower', lines: ['y4'], lead: 0.5, tail: 1.2, xf: 0.8 },
  { kind: 'shells', lines: ['o1', 'o2'], lead: 0.6, gap: 0.6, tail: 1.0, caption: 'c5', xf: 0.9 },
  { kind: 'fence', lines: ['x1', 'x2'], lead: 0.6, gap: 0.5, tail: 0.9, caption: 'c6', xf: 0.9 },
  { kind: 'wrong', lines: ['x3', 'x4'], lead: 0.5, gap: 0.7, tail: 1.0, xf: 0.8 },
  { kind: 'weird', lines: ['x5'], lead: 0.6, tail: 3.0, min: 7, xf: 0.8 },
  { kind: 'end', lines: [], min: 7, xf: 1.2 },
];
