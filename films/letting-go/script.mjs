// 《放手 · Letting Go》：一部关于提示词演进的水墨短片。
// 画面语言：朱红是人的指导（描红、告示、引线、印章），墨色是模型自己的笔；纸是它能看到的一切。
// 每一段之前有一张“年代卡”：一条横贯的历史线，逐段向前延伸。
export const LINES = {
  // 序
  o1: ['有些提示词，像一份嘱托；有些，像岗位说明书；还有一些，像一间贴满警告的屋子。',
       'Some prompts read like a quiet request. Some, like a job description. Some, like a room papered with warnings.'],
  o2: ['必须遵守。禁止省略。再次强调——绝对不能违反！',
       'Follow strictly. Omit nothing. Once again: never, ever break the rules.'],
  o3: ['可是，提示词的历史，并不是命令越写越多的历史。',
       'But the history of prompting is not a history of ever more commands.'],
  o4: ['它是一条边界。在人和模型之间，不断移动。',
       'It is a boundary between a person and a model, always on the move.'],
  o5: ['哪些事，要由人说清楚？哪些事，可以交给它自己判断？',
       'What must a person spell out? And what can be left to its own judgment?'],
  // 一 · 续写 2019—2022
  a1: ['起初，模型并不听指令。它只会，接着往下写。',
       'At first, a model did not follow instructions. It could only keep writing.'],
  a2: ['于是我们像描红一样：先写好几行范例，再留下一个空格。',
       'So we did what children do with a copybook: write a few lines of examples, then leave one blank.'],
  a3: ['答案，就是最顺手的那一笔。',
       'The answer was simply the most natural next stroke.'],
  // 二 · 嘱咐 2022—2023
  b1: ['二〇二二年底，ChatGPT 出现。我们终于可以直接开口：帮我做一件事。',
       'At the end of 2022, ChatGPT arrived. We could finally just say: please, do this for me.'],
  b2: ['于是有人写：你是一位拥有二十年经验的世界顶级专家。',
       'So some wrote: you are a world-class expert with twenty years of experience.'],
  b3: ['其实真正有用的，是另外三件事：写给谁，为了什么，哪里不能动。',
       'What actually helped was simpler: who it is for, what it is for, and what must not change.'],
  b4: ['再后来，一句话的心愿，也被套进角色、背景、目标、约束、工作流……像给一幅小画，装了十层画框。',
       'Then a one-line wish got wrapped in role, background, goal, constraints, workflow... a tiny sketch inside ten frames.'],
  // 三 · 步骤 2022—2024
  c1: ['我们又开始教它怎么想。最有名的一句，是：让我们一步一步地思考。',
       'Next, we taught it how to think. The most famous line: let’s think step by step.'],
  c2: ['走错了，就回头；一条路不够，就分出许多条。',
       'If a path went wrong, turn back. If one path was not enough, branch into many.'],
  c3: ['还有人让它扮演五位专家开会。可画里添上五位先生，不等于真的开了一场会。',
       'Some asked it to play five experts in a meeting. But painting five scholars in is not the same as holding one.'],
  // 四 · 补丁 2023—2024
  d1: ['等它走进真实的产品，每次失误，都换来一张新告示：严禁解释，只许输出标签。',
       'In real products, every mistake earned another notice on the wall: no explanations, only the tags.'],
  d2: ['一块补丁盖住一道裂缝，又撑开另一道：单引号全换成双引号，O’Connor 也坏了。',
       'One patch covered a crack and pulled open another. Replace every single quote with a double quote, and O’Connor breaks too.'],
  d3: ['后来，格式交给接口去守。可画得对不对，还得人来看。',
       'Later, the interface took over keeping the format. Whether the picture is true still needs a human eye.'],
  // 五 · 推理 2024—2025
  e1: ['二〇二四年，模型开始被训练得会自己推理。',
       'In 2024, models began to be trained to reason on their own.'],
  e2: ['再替它写好“第一步、第二步”，往往帮不上忙，甚至添乱。',
       'Writing out “step one, step two” often stopped helping, and sometimes got in the way.'],
  // 六 · 上下文 2025
  e3: ['问题变成了：它到底看到了什么？',
       'The question became: what can it actually see?'],
  e4: ['它改错了地方，也许不是不认真，而是只看到了旧图纸。多写三遍“认真阅读”，补不上没看见的那一页。',
       'If it changed the wrong thing, perhaps it was not careless. It had only seen the old plans. Writing “read carefully” three times cannot add a page it never saw.'],
  // 七 · 放手 2026
  g1: ['二〇二六年，有团队删掉了八成旧提示词，作品并没有变差。',
       'By 2026, one team deleted more than eighty percent of its old prompt, and the work did not get worse.'],
  g2: ['像“绝对不许写注释”这样的铁律，换成了一句：照着周围已有的写法来。',
       'An iron rule like “never write comments” became a single line: follow the style already around you.'],
  g3: ['原来，旧的约束，挡住了——更好的那一笔。',
       'The old constraints had been blocking... a better stroke.'],
  // 八 · 今后
  f0: ['往后，提示词会像一份有版本、能检验的配置：删一条，试一次，有用就留。',
       'From here, a prompt becomes something with versions and tests: remove a rule, try again, keep what helps.'],
  f1: ['放手，不是什么都不说。',
       'Letting go does not mean saying nothing.'],
  f2: ['你想做成什么，为什么值得，哪些代价不能接受，怎样才算好——这些，依然由你决定。',
       'What you hope to make, why it is worth making, what it must not cost, and what counts as good. Those are still yours to decide.'],
  f3: ['模型越强，我们越该少替它安排每一步，多把值得完成的事，交代清楚。',
       'The stronger the model, the less we should plan its every step, and the more clearly we should say what is worth doing.'],
};

// 章节题款：竖排在画面右上角，配一方小印（印文见 style.js 的 CHAPTER_MARKS）
export const CAPTIONS = {
  c1: ['一 · 续写', 'I · Continuation'], c2: ['二 · 嘱咐', 'II · Instructions'], c3: ['三 · 步骤', 'III · Steps'],
  c4: ['四 · 补丁', 'IV · Patches'], c5: ['五 · 推理', 'V · Reasoning'], c6: ['六 · 上下文', 'VI · Context'],
  c7: ['七 · 放手', 'VII · Letting Go'], c8: ['八 · 今后', 'VIII · Next'],
};
export const LABELS = { title: ['放手', 'Letting Go'] };

const ERA = (n) => ({ kind: `era${n}`, lines: [], min: 3.1, xf: 0.8 });
export const SHOTS = [
  { kind: 'notes', lines: ['o1', 'o2'], lead: 1.6, gap: 0.65, tail: 1.0, min: 10, xf: 0 },
  { kind: 'thesis', lines: ['o3', 'o4', 'o5'], lead: 1.2, gap: 0.65, tail: 1.3, xf: 1.4 },
  { kind: 'title', lines: [], min: 5.6, xf: 1.4 },
  ERA(1),
  { kind: 'trace', lines: ['a1', 'a2', 'a3'], lead: 0.8, gap: 0.50, tail: 1.5, caption: 'c1', xf: 0.9 },
  ERA(2),
  { kind: 'letter', lines: ['b1', 'b2', 'b3'], lead: 0.8, gap: 0.50, tail: 1.0, caption: 'c2', xf: 0.9 },
  { kind: 'frames', lines: ['b4'], lead: 0.6, tail: 1.5, min: 8, xf: 1.2 },
  ERA(3),
  { kind: 'stones', lines: ['c1', 'c2'], lead: 0.8, gap: 0.55, tail: 1.0, caption: 'c3', xf: 0.9 },
  { kind: 'scholars', lines: ['c3'], lead: 0.6, tail: 1.3, min: 7, xf: 1.2 },
  ERA(4),
  { kind: 'patches', lines: ['d1', 'd2'], lead: 0.8, gap: 0.55, tail: 1.0, caption: 'c4', xf: 0.9 },
  { kind: 'scroll', lines: ['d3'], lead: 0.6, tail: 1.5, min: 8, xf: 1.2 },
  ERA(5),
  { kind: 'reason', lines: ['e1', 'e2'], lead: 0.8, gap: 0.55, tail: 1.5, caption: 'c5', xf: 0.9 },
  ERA(6),
  { kind: 'lamp', lines: ['e3', 'e4'], lead: 0.8, gap: 0.50, tail: 1.3, caption: 'c6', xf: 0.9 },
  ERA(7),
  { kind: 'letgo', lines: ['g1', 'g2', 'g3'], lead: 0.8, gap: 0.55, tail: 3.3, caption: 'c7', xf: 0.9 },
  ERA(8),
  { kind: 'grading', lines: ['f0'], lead: 0.8, tail: 1.1, caption: 'c8', xf: 0.9 },
  { kind: 'seals', lines: ['f1', 'f2'], lead: 1.2, gap: 0.75, tail: 1.1, xf: 1.4 },
  { kind: 'freehand', lines: ['f3'], lead: 1.0, tail: 2.7, min: 10, xf: 1.6 },
  { kind: 'end', lines: [], min: 6.5, xf: 1.6 },
];
