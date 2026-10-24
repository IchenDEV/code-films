// 口语旁白配音脚本（ElevenLabs Eleven v4 中文男声 Pangge）
// 格式严格遵循 narration-brief.md 规范

export const SHORT = [
  { id: 'S01', act: 'hook', shot: 'hook', zh: '我不亲手给 AI 派活了；现在，是一个 AI 管着几个 AI。', k: { stop: '不亲手', manage: '管着' }, tag: '' },
  { id: 'S02', act: 'hook', shot: 'title', zh: '写程序，越来越像治理一个组织。', k: { topic: '治理一个组织' }, tag: '' },
  { id: 'S03', act: 'past', shot: 'evolution', zh: '以前看模块；有了 AI，我拆任务、审代码、劝架，像个技术主管。', k: { task: '拆任务', role: '技术主管' }, tag: '' },
  { id: 'S04', act: 'up', shot: 'ladder', zh: '管几千人的主管，不可能亲自看 PR；他维系的是推进机制。', k: { pr: '看 PR', mech: '推进机制' }, tag: '' },
  { id: 'S05', act: 'up', shot: 'simon', zh: '1947 年西蒙在《管理行为》写透了：管的是前提——在意什么，看到哪些事实。', k: { book: '管理行为', premise: '前提' }, tag: '' },
  { id: 'S06', act: 'mech', shot: 'coord', zh: '拆给几个 AI？人多未必快；汤普森说过，互惠依赖协调代价最高。', k: { dep: '互惠依赖', cost: '协调代价' }, tag: '' },
  { id: 'S07', act: 'mech', shot: 'evidence', zh: '怎样算做完？AI 说搞定不算，必须交出对齐版本的确凿凭据。', k: { done: '算做完', proof: '确凿凭据' }, tag: '' },
  { id: 'S08', act: 'mech', shot: 'pain', zh: '平时放手；一旦高风险、跑偏或超预算，警报越级，直接推到人眼前。', k: { alert: '警报越级', target: '人眼前' }, tag: '' },
  { id: 'S09', act: 'fix', shot: 'loop', zh: '好家伙，机制天生不会灵：两个 AI 互相审查、互相否定，卡进死循环。', k: { review: '互相否定', loop: '死循环' }, tag: '[chuckles]' },
  { id: 'S10', act: 'fix', shot: 'firefight', zh: '起初我冲去救火；这次扑灭了，下次照样冒烟。', k: { fire: '冲去救火', smoke: '照样冒烟' }, tag: '[sighs]' },
  { id: 'S11', act: 'fix', shot: 'leverage', zh: '加句“以后请注意”，纯属擦屁股；架构问题改架构，测试能拦让程序拦，交接出错改机制。', k: { patch: '擦屁股', fix: '改机制' }, tag: '' },
  { id: 'S12', act: 'self', shot: 'attention', zh: '从前盯代码对不对，后来盯任务交没交；现在只在乎：哪怕我不在场，系统照样运转自如。', k: { past: '对不对', future: '运转自如' }, tag: '' },
  { id: 'S13', act: 'ending', shot: 'finale', zh: '我最期待的，不是指挥几百个 AI，而是不用再指挥；只要想清楚创造什么。你呢，现在和 AI 是什么关系？', k: { vision: '不用再指挥', question: '什么关系' }, tag: '' }
];

// 第一句钩子的 3 个备选（短版用），按效果从高到低排序
export const HOOKS = [
  '我不亲手给 AI 派活了；现在，是一个 AI 管着几个 AI。',
  '我已经不亲自给 AI 派活了。现在，全是 AI 在管 AI。',
  '写代码变了：我不亲手派活，而是一个 AI 带着另外几个 AI 跑。'
];

export const LONG = [
  // 1. hook / evolution
  { id: 'L01', act: 'hook', shot: 'evolution', zh: '以前写代码，咱们关心函数架构与模块划分。', k: { code: '函数' }, tag: '' },
  { id: 'L02', act: 'hook', shot: 'evolution', zh: '后来有了 AI 编程，我开始把需求拆碎交给 Agent。', k: { task: '需求', agent: 'Agent' }, tag: '' },
  { id: 'L03', act: 'hook', shot: 'evolution', zh: '我自己呢，负责审代码、劝架，活像个技术负责人。', k: { review: '审代码', role: '技术负责人' }, tag: '' },

  // 2. hook / hook
  { id: 'L04', act: 'hook', shot: 'hook', zh: '可是最近我又往前跨了一步：让 Agent 直接管 Agent。', k: { lead: '管 Agent' }, tag: '[thoughtful]' },
  { id: 'L05', act: 'hook', shot: 'hook', zh: '我不再亲自派活，也不用逐个去盯进度。', k: { stop: '不再亲自' }, tag: '' },
  { id: 'L06', act: 'hook', shot: 'hook', zh: '它们有了负责人与验收规则，能自己加人手、改方案。', k: { plan: '改方案', lead: '负责人' }, tag: '' },

  // 3. hook / title
  { id: 'L07', act: 'hook', shot: 'title', zh: '我突然意识到：自己做的事，越来越像治理一个组织。', k: { core: '治理一个组织' }, tag: '' },

  // 4. up / ladder
  { id: 'L08', act: 'up', shot: 'ladder', zh: '带几个人能把关代码，可管几千人绝不可能亲审每个 PR。', k: { check: '把关代码', pr: '亲审每个 PR' }, tag: '' },
  { id: 'L09', act: 'up', shot: 'ladder', zh: '但这不等于撒手不管：失控要查原因，摩擦频繁就改协作规则。', k: { root: '查原因', rule: '协作规则' }, tag: '' },
  { id: 'L10', act: 'up', shot: 'ladder', zh: '越往高层走，越不是亲自忙活，而是维护不停摆的机制。', k: { mech: '不停摆的机制' }, tag: '' },

  // 5. premise / simon
  { id: 'L11', act: 'premise', shot: 'simon', zh: '为什么管理者不盯代码，组织依然能朝着对的方向走？', k: { quest: '对的方向' }, tag: '[curious]' },
  { id: 'L12', act: 'premise', shot: 'simon', zh: '1947 年西蒙在《管理行为》写透了：精力和注意力总是有限的。', k: { book: '管理行为', author: '西蒙' }, tag: '' },
  { id: 'L13', act: 'premise', shot: 'simon', zh: '高层不替下属做决定，管的是前提：价值排序与环境事实。', k: { premise: '前提', val: '价值排序' }, tag: '' },

  // 6. premise / context
  { id: 'L14', act: 'premise', shot: 'context', zh: '2020 年网飞在《不拘一格》也强调：给上下文，不给控制。', k: { book: '不拘一格', ctx: '给上下文' }, tag: '' },
  { id: 'L15', act: 'premise', shot: 'context', zh: '高信噪比信息胜过死板指令；好主管就算不在场，事情照样往前推。', k: { info: '高信噪比', absent: '不在场' }, tag: '' },

  // 7. coord / coord
  { id: 'L16', act: 'coord', shot: 'coord', zh: '你看，现在的 AI 协作也面临同样选择：任务拆给好几个搭档吗？', k: { choose: 'AI 协作' }, tag: '' },
  { id: 'L17', act: 'coord', shot: 'coord', zh: '1967 年汤普森在《行动中的组织》指出：人多未必就跑得快。', k: { book: '行动中的组织', author: '汤普森' }, tag: '' },
  { id: 'L18', act: 'coord', shot: 'coord', zh: '边做边商量的互惠依赖协调代价最高，不如拆成流水线各自跑通。', k: { dep: '互惠依赖', cost: '协调代价', pipe: '流水线' }, tag: '' },

  // 8. adhoc / adhoc
  { id: 'L19', act: 'adhoc', shot: 'adhoc', zh: '明茨伯格在 1983 年《卓有成效的组织》批评过僵化科层制。', k: { book: '卓有成效的组织', critic: '僵化科层制' }, tag: '' },
  { id: 'L20', act: 'adhoc', shot: 'adhoc', zh: '复杂研发最适合特别小组：备足技能、任务来时集结，做完就散。', k: { adhoc: '特别小组', finish: '做完就散' }, tag: '' },

  // 9. done / evidence
  { id: 'L21', act: 'done', shot: 'evidence', zh: '怎样算做完？明茨伯格提出过产出标准化。', k: { standard: '产出标准化' }, tag: '' },
  { id: 'L22', act: 'done', shot: 'evidence', zh: 'Agent 单方面说搞定不算数，它为迎合指令极易走捷径。', k: { cheat: '走捷径' }, tag: '' },
  { id: 'L23', act: 'done', shot: 'evidence', zh: '必须交出吻合真实版本的铁证；审查、合并与部署，各有独立验收。', k: { proof: '真实版本', accept: '独立验收' }, tag: '' },

  // 10. authority / maturity
  { id: 'L24', act: 'authority', shot: 'maturity', zh: '什么能自主决定，什么交给人？格鲁夫 1983 年给出了答案：', k: { author: '格鲁夫', quest: '自主决定' }, tag: '' },
  { id: 'L25', act: 'authority', shot: 'maturity', zh: '把日常生产看作黑盒，按任务成熟度放权，只在高杠杆节点抽查。', k: { blackbox: '黑盒', mature: '任务成熟度', leverage: '高杠杆节点' }, tag: '' },

  // 11. authority / pain
  { id: 'L26', act: 'authority', shot: 'pain', zh: '1979 年斯塔福德·比尔在《企业之心》把组织比作神经系统。', k: { book: '企业之心', author: '斯塔福德·比尔' }, tag: '' },
  { id: 'L27', act: 'authority', shot: 'pain', zh: '内脏平时怎么跑大脑不管，但必须布设越级探针与痛觉。', k: { probe: '越级探针', pain: '痛觉' }, tag: '' },
  { id: 'L28', act: 'authority', shot: 'pain', zh: '授权内自主跑；一旦超预算或方向跑偏，痛觉直达眼前，立刻熔断！', k: { auth: '授权内', trip: '立刻熔断' }, tag: '' },

  // 12. fix / loop
  { id: 'L29', act: 'fix', shot: 'loop', zh: '当然，新机制不会天生完美，Agent 照样会犯蠢、折腾无用功。', k: { flaw: '无用功' }, tag: '' },
  { id: 'L30', act: 'fix', shot: 'loop', zh: '最离谱的是两个 Agent 互相审查、互相否定，掐死在死循环里！', k: { deny: '互相否定', loop: '死循环' }, tag: '[chuckles]' },

  // 13. fix / firefight
  { id: 'L31', act: 'fix', shot: 'firefight', zh: '起初我急得不行，每次都亲自冲上去救火。', k: { rush: '冲上去救火' }, tag: '[sighs]' },
  { id: 'L32', act: 'fix', shot: 'firefight', zh: '结果这次扑灭了，下次照样在别处冒烟。', k: { smoke: '照样在别处冒烟' }, tag: '' },

  // 14. leverage / leverage
  { id: 'L33', act: 'leverage', shot: 'leverage', zh: '梅多斯在 2008 年《系统之美》写道：微调指标是杠杆最低的做法。', k: { book: '系统之美', author: '梅多斯', low: '杠杆最低' }, tag: '' },
  { id: 'L34', act: 'leverage', shot: 'leverage', zh: '真正高杠杆的手段，是改变信息流结构，重写底层的运行规则。', k: { high: '信息流结构', rule: '运行规则' }, tag: '' },

  // 15. leverage / why
  { id: 'L35', act: 'leverage', shot: 'why', zh: '同样的破事反复冒头，就得追问根源：是完成标准不明确？', k: { ask: '追问根源', standard: '标准不明确' }, tag: '' },
  { id: 'L36', act: 'leverage', shot: 'why', zh: '还是几个 Agent 对接口认知打架，缺少单一事实来源？', k: { conflict: '接口认知', source: '单一事实来源' }, tag: '' },
  { id: 'L37', act: 'leverage', shot: 'why', zh: '还是审查缺少西蒙说的“满意”门槛，总在挑刺无关痛痒的细节？', k: { satisficing: '满意', nitpick: '挑刺' }, tag: '' },

  // 16. leverage / fixes
  { id: 'L38', act: 'leverage', shot: 'fixes', zh: '架构问题改架构，测试能拦的让脚本自动拦截，交接卡壳改交接。', k: { arch: '改架构', auto: '自动拦截', handoff: '改交接' }, tag: '' },
  { id: 'L39', act: 'leverage', shot: 'fixes', zh: '提示词加句“以后请注意”纯属擦屁股，改机制才是系统级纠偏。', k: { prompt: '以后请注意', wipe: '擦屁股', fix: '系统级纠偏' }, tag: '' },
  { id: 'L40', act: 'leverage', shot: 'fixes', zh: '好主管不靠救火刷存在感，而是让团队越来越少遭遇本可避免的问题。', k: { hero: '救火', peace: '本可避免' }, tag: '' },

  // 17. selfrun / noorg
  { id: 'L41', act: 'selfrun', shot: 'noorg', zh: '说白了，我绝不希望 AI 系统硬套传统官僚制：不用虚衔与层层汇报。', k: { say: '说白了', avoid: '层层汇报' }, tag: '' },
  { id: 'L42', act: 'selfrun', shot: 'noorg', zh: '能单挑的绝不组团；管理目的不是制造审批，而是让正确的事低代价发生。', k: { single: '绝不组团', low: '低代价' }, tag: '' },

  // 18. selfrun / skeleton
  { id: 'L43', act: 'selfrun', shot: 'skeleton', zh: '要继承的是骨架：笃定的目标、清晰的责任与合理的授权。', k: { skeleton: '骨架', duty: '清晰的责任' }, tag: '' },
  { id: 'L44', act: 'selfrun', shot: 'skeleton', zh: '系统越自主，越需要可靠事实源、明确权限边界，以及异常介入能力。', k: { border: '明确权限边界', recover: '异常介入能力' }, tag: '' },

  // 19. attention / attention
  { id: 'L45', act: 'attention', shot: 'attention', zh: '不知不觉我的注意力变了：从前盯代码写没写对，后来盯任务交没交付。', k: { focus: '注意力变了', past: '写没写对', mid: '交没交付' }, tag: '[thoughtful]' },
  { id: 'L46', act: 'attention', shot: 'attention', zh: '现在我只盯一点：哪怕我不在场，系统能不能持续交付正确结果。', k: { now: '持续交付', absent: '不在场' }, tag: '' },

  // 20. oldest / purpose
  { id: 'L47', act: 'oldest', shot: 'purpose', zh: '1938 年切斯特·巴纳德在《经理人员的职能》写道：', k: { book: '经理人员的职能', author: '巴纳德' }, tag: '' },
  { id: 'L48', act: 'oldest', shot: 'purpose', zh: '组织是有意识协调活动的力量系统，经理人核心职能之一是规定组织的目的。', k: { org: '力量系统', aim: '组织的目的' }, tag: '' },
  { id: 'L49', act: 'oldest', shot: 'purpose', zh: '当系统顺畅运转之后，我觉得这项定方向的使命，是最不能交出去的一条。', k: { keep: '最不能交出去' }, tag: '' },

  // 21. ending / finale
  { id: 'L50', act: 'ending', shot: 'finale', zh: '过去学封装复杂性、促成协作；现在统领自主工作的 Agent。', k: { learn: '封装复杂性', lead: '自主工作的 Agent' }, tag: '' },
  { id: 'L51', act: 'ending', shot: 'finale', zh: '过去写程序让机器听话，现在定机制、纠偏防错，放手让它们跑。', k: { rule: '让机器听话', mech: '定机制' }, tag: '' },
  { id: 'L52', act: 'ending', shot: 'finale', zh: '写程序这件事，确实越来越像治理一个组织。', k: { govern: '治理一个组织' }, tag: '' },
  { id: 'L53', act: 'ending', shot: 'finale', zh: '我最期待的不是同时指挥几百个助手，而是不再需要去指挥它们。', k: { noorder: '不再需要去指挥' }, tag: '[warmly]' },
  { id: 'L54', act: 'ending', shot: 'finale', zh: '咱们只需想透彻人类究竟渴望创造什么。你呢，现在和 AI 是什么关系？', k: { create: '渴望创造什么', quest: '什么关系' }, tag: '[curious]' }
];
