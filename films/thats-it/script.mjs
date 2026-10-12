// 《就这？· That's It?》
// 根据 Andrej Karpathy 2026 年 10 月 11 日的帖子（重提他 4 月 9 日的旧帖）改编。无口播：画面和字幕讲完全部故事，情绪跟着配乐走。
//
// 锚词「就这？」：开头是你对一个呆呆的聊天框的失望；中间发现每个人的「这」不一样大；
// 结尾它被重新定义——不是 AI 的尽头，只是你站的地方，「就从这儿开始」。
//
// 每一句字幕是一个 LINE：
//   shot   画面函数名；相邻同名的句子合成一个镜头
//   act    配乐段落；音乐按段落时长作曲（见 tools/music.py）
//   beats  这一句停留几拍。全片 72 BPM，一拍 0.833 秒：4 拍 3.3 秒，5 拍 4.2 秒，6 拍 5 秒
//   rest   这一句之后的留白（拍），只有画面和音乐
//   zh/en  字幕：一行中文（不超过 18 字），下面一行英文斜体
// 没有 zh 的是无字幕的画面（片名、片尾）。
export const BPM = 72;

export const LINES = [
  // —— 处境：你的「就这？」——
  { id: 'L01', shot: 'phone', act: 'hook', beats: 4,
    zh: '你让它推荐一家馆子——', en: 'You asked it for a good place to eat—' },
  { id: 'L02', shot: 'shop', act: 'hook', beats: 6,
    zh: '它说得头头是道。那家店，三年前就关了。', en: 'It sounded so sure. That place closed three years ago.' },
  { id: 'L03', shot: 'shrug', act: 'hook', beats: 5,
    zh: '你笑了一下：就这？', en: 'You laughed. That\'s it?' },

  // —— 另一扇窗：他的「要变天」——
  { id: 'L04', shot: 'facade', act: 'storm', beats: 4,
    zh: '同一天，另一扇窗里——', en: 'The same day, behind another window—' },
  { id: 'L05', shot: 'desk', act: 'storm', beats: 5,
    zh: '有人看着它，一下午做完了一个月的活。', en: 'someone watched it do a month of work in one afternoon.' },
  { id: 'L06', shot: 'desk', act: 'storm', beats: 5,
    zh: '他盯着屏幕，后背发凉：要变天了。', en: 'He stared at the screen, a chill down his back: everything is about to change.' },

  // —— 谁看错了 ——
  { id: 'L07', shot: 'split', act: 'question', beats: 5,
    zh: '一个说“就这”，一个说“变天”——谁看错了？', en: 'One says "That\'s it?" One says "Everything changes." Who\'s wrong?' },
  { id: 'L08', shot: 'split', act: 'question', beats: 5,
    zh: '谁都没有。只是，站的地方不一样。', en: 'Neither. They\'re just standing in different places.' },
  { id: 'TITLE', shot: 'title', act: 'funnel', beats: 4 },

  // —— 漏斗：八十亿人 ——
  { id: 'L09', shot: 'funnel', act: 'funnel', beats: 5,
    zh: '把地球上八十亿人，排成一个漏斗。', en: 'Line up all eight billion of us as a funnel.' },
  { id: 'L10', shot: 'funnel', act: 'funnel', beats: 5,
    zh: '最上面，大约六十亿人，几乎没碰过它。', en: 'At the top, about six billion have barely touched it.' },
  { id: 'L11', shot: 'funnel', act: 'funnel', beats: 6,
    zh: '往下，十到二十亿人，见过一个呆呆的聊天框。', en: 'Below them, one or two billion have met a slightly dopey chatbot.' },
  { id: 'L12', shot: 'funnel', act: 'funnel', beats: 5,
    zh: '再往下，两千万人：几个月的活，一句话。', en: 'Further down, twenty million: months of work, from one sentence.' },
  { id: 'L13', shot: 'funnel', act: 'funnel', beats: 6,
    zh: '最底下，只有大约五千人。他们看见了什么？', en: 'At the very bottom, about five thousand. What do they see?' },

  // —— 为什么：问题的大小、本事的山脉、一道门 ——
  { id: 'L14', shot: 'sea', act: 'why', beats: 5,
    zh: '先说你。一杯水，量不出海有多深。', en: 'First, you. A cup of water can\'t tell you how deep the sea is.' },
  { id: 'L15', shot: 'sea', act: 'why', beats: 5,
    zh: '得有一个够大、够难、你真在乎的问题。', en: 'It takes a problem big enough, hard enough—one you truly care about.' },
  { id: 'L16', shot: 'peaks', act: 'why', beats: 4,
    zh: '它的本事，是一座山脉——不是平原。', en: 'Its abilities are a mountain range, not a plain.' },
  { id: 'L17', shot: 'peaks', act: 'why', beats: 5,
    zh: '算式、代码——能对答案的地方，高得惊人。', en: 'Math, code—wherever the answer can be checked, it towers.' },
  { id: 'L18', shot: 'peaks', act: 'why', beats: 5,
    zh: '因为它，就是在一遍遍“对答案”里长大的。', en: 'Because it grew up checking its answers, over and over.' },
  { id: 'L19', shot: 'valley', act: 'why', beats: 5,
    zh: '而找馆子、过日子，还在山谷里。', en: 'Finding dinner, getting through the day—that\'s still down in the valley.' },
  { id: 'L20', shot: 'door', act: 'door', beats: 5,
    zh: '还有一道门。门外的人，只看过预告片。', en: 'And there\'s a door. Those outside have only seen the trailer.' },
  { id: 'L21', shot: 'door', act: 'door', beats: 4,
    zh: '而门里那五千人，看见的是——', en: 'Inside, those five thousand see—' },

  // —— 高潮：曲线立起来 ——
  { id: 'L22', shot: 'swarm', act: 'climax', beats: 6,
    zh: '成千上万个 AI，几周做完顶尖高手几年的活。', en: 'thousands of AIs doing in weeks what top experts would need years for.' },
  { id: 'L23', shot: 'vertigo', act: 'climax', beats: 6, rest: 2,
    zh: '曲线立了起来——快得，连人都看不懂了。', en: 'The curve goes vertical—too fast for people to follow.' },

  // —— 高潮之后：画这个漏斗的人 ——
  { id: 'L24', shot: 'napkin', act: 'reveal', beats: 5,
    zh: '画出这个漏斗的，是 Andrej Karpathy。', en: 'The funnel was drawn by Andrej Karpathy.' },
  { id: 'L25', shot: 'keys', act: 'reveal', beats: 5,
    zh: '不到一年前，他还一个字一个字地敲代码。', en: 'Less than a year ago, he was still typing code, character by character.' },
  { id: 'L26', shot: 'gap', act: 'reveal', beats: 6,
    zh: '2026 年 10 月，他写道：这道鸿沟，正在变宽。', en: 'In October 2026, he wrote: this gap is getting wider.' },

  // —— 回到「就这？」——
  { id: 'L27', shot: 'city', act: 'ending', beats: 6,
    zh: '我们活在同一天，却看见了不同的明天。', en: 'We live in the same day, yet see different tomorrows.' },
  { id: 'L28', shot: 'return', act: 'ending', beats: 6,
    zh: '下次有人说“就这？”——他没错，那只是他站的地方。', en: 'Next time someone says "That\'s it?"—they\'re not wrong. It\'s just where they stand.' },
  { id: 'L29', shot: 'return', act: 'ending', beats: 5,
    zh: '问它那个，你放在心里很多年的问题。', en: 'Ask it the question you\'ve carried for years.' },
  { id: 'L30', shot: 'dawn', act: 'ending', beats: 6,
    zh: '就这？——不，就从这儿开始。', en: 'That\'s it? No. This is where it starts.' },
  { id: 'END', shot: 'endcard', act: 'end', beats: 8 },
];

// —— 流量短版（约 1 分 16 秒，竖屏）——
// 同一套镜头，节奏快一倍（每句 3～4 拍，2.5～3.3 秒），给抖音 / 视频号 / YouTube Shorts：
//   第一帧：顶部常驻钩子（“全球只有约 5000 人，用过最前沿的 AI”）+ 一句身份提问（“你是不是也觉得 AI 有点傻？”）
//   中段埋悬念（“他们看见了什么？”），高潮兑现；结尾让观众在评论区按 1/2/3/4 站队
// id 与长版相同的句子，镜头里的对位点（cue）也相同。
// 短版有旁白：整片旁白一次合成（Eleven v4，一条录音，音高和语速前后一致），只在段与段之间的停顿里分开，每段整段连续播放；字幕和镜头跟着逐字时间走。
// 语气要平和：不用 [excited] [serious] 这类标签（会演过头、像咬着牙说话），稳定度 0.5、表现力 0.15。
// SAY：只发给合成的读音替换（字幕不变）。多音字能改写的已在字幕里一起改写（做完、基本、就见过）。
export const NARRATION = {
  zh: { voice: 'hFamrilbAE6WDMtWgKvu', voiceName: 'Pangge', model: 'eleven_v4', languageCode: 'zh', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
  en: { voice: 'dSByRdUbTGloB7TFA1qD', voiceName: 'Jon - Catalyst', model: 'eleven_v4', languageCode: 'en', settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, speed: 1.0 } },
};
export const SAY = { zh: { L14: [['量不出', '粮不出']], L24: [['Karpathy', '卡帕西']] } };
export const SHORT = [
  { id: 'L01', shot: 'phone', act: 'hook', beats: 4,
    zh: '你是不是也觉得——AI 有点傻？', en: 'Do you think AI is kind of dumb?' },
  { id: 'L02', shot: 'shop', act: 'hook', beats: 4,
    zh: '它推荐的馆子，三年前就关门了。', en: 'The restaurant it recommended closed three years ago.' },
  { id: 'L03', shot: 'shrug', act: 'hook', beats: 3,
    zh: '你心想：就这？', en: 'You thought: That\'s it?' },
  { id: 'L05', shot: 'desk', act: 'storm', beats: 4,
    zh: '可隔壁有人，用它一下午做完一个月的活。', en: 'But next door, someone used it to do a month of work in one afternoon.' },
  { id: 'L06', shot: 'desk', act: 'storm', beats: 3,
    zh: '他后背发凉：要变天了。', en: 'A chill down his back: everything is about to change.' },
  { id: 'L07', shot: 'split', act: 'question', beats: 3,
    zh: '你们俩，谁看错了？', en: 'So which of you is wrong?' },
  { id: 'L08', shot: 'split', act: 'question', beats: 4,
    zh: '都没有。只是站的地方不一样。', en: 'Neither. You\'re standing in different places.' },
  { id: 'L09', shot: 'funnel', act: 'funnel', beats: 3,
    zh: '把八十亿人排成一个漏斗——', en: 'Line up eight billion people as a funnel—' },
  { id: 'L10', shot: 'funnel', act: 'funnel', beats: 3,
    zh: '六十亿人，基本没碰过它；', en: 'six billion have barely touched it;' },
  { id: 'L11', shot: 'funnel', act: 'funnel', beats: 3,
    zh: '十到二十亿人，就见过一个聊天框；', en: 'one to two billion only know the chatbot;' },
  { id: 'L12', shot: 'funnel', act: 'funnel', beats: 4,
    zh: '两千万人，看它一句话做完几个月的活；', en: 'twenty million watch it do months of work from one sentence;' },
  { id: 'L13', shot: 'funnel', act: 'funnel', beats: 4,
    zh: '最底下只有五千人。他们看见了什么？', en: 'and at the bottom, five thousand. What do they see?' },
  { id: 'L14', shot: 'sea', act: 'why', beats: 3,
    zh: '一杯水，量不出海有多深；', en: 'A cup of water can\'t measure the sea;' },
  { id: 'L15', shot: 'sea', act: 'why', beats: 3,
    zh: '问题越大，它就越深。', en: 'the bigger your problem, the deeper it goes.' },
  { id: 'L17', shot: 'peaks', act: 'why', beats: 4,
    zh: '能对答案的地方——算式、代码——它高得惊人；', en: 'Wherever answers can be checked—math, code—it towers;' },
  { id: 'L19', shot: 'valley', act: 'why', beats: 3,
    zh: '找馆子、过日子，还在山谷里。', en: 'finding dinner is still down in the valley.' },
  { id: 'L20', shot: 'door', act: 'door', beats: 3,
    zh: '门外的人，只看过预告片。', en: 'Those outside have only seen the trailer.' },
  { id: 'L21', shot: 'door', act: 'door', beats: 3,
    zh: '门里那五千人看见的是——', en: 'Inside, the five thousand see—' },
  { id: 'L22', shot: 'swarm', act: 'climax', beats: 4,
    zh: '成千上万个 AI，几周做完高手几年的活；', en: 'thousands of AIs doing in weeks what experts need years for;' },
  { id: 'L23', shot: 'vertigo', act: 'climax', beats: 4, rest: 1,
    zh: '曲线立了起来——快到人都看不懂。', en: 'the curve goes vertical—too fast for people to follow.' },
  { id: 'L24', shot: 'napkin', act: 'ending', beats: 3,
    zh: '这是 Karpathy 画的漏斗。', en: 'This is Andrej Karpathy\'s funnel.' },
  { id: 'L28', shot: 'return', act: 'ending', beats: 3,
    zh: '所以，说“就这？”的人没有错——', en: 'So whoever says "That\'s it?" isn\'t wrong—' },
  { id: 'L29', shot: 'return', act: 'ending', beats: 3,
    zh: '只是还没问它，真正在乎的问题。', en: 'they just haven\'t asked the question they truly care about.' },
  { id: 'L30', shot: 'dawn', act: 'ending', beats: 5,
    zh: '就这？——不，就从这儿开始。', en: 'That\'s it? No. This is where it starts.' },
  { id: 'END', shot: 'endcard', act: 'end', beats: 5 },
];

// 每个平台一个成片：剪辑版本（长 / 短）× 画幅 × 片尾互动语。字幕都是中文在上、英文斜体在下。
// fmt：h 横屏 1920×1080 · v 竖屏 1080×1920
export const VARIANTS = {
  bilibili: { cut: 'long', fmt: 'h', lang: 'zh', name: '就这_B站', cta: ['你站在漏斗的哪一层？', '弹幕告诉我'] },
  youtube: { cut: 'long', fmt: 'h', lang: 'en', name: 'ThatsIt_YouTube', cta: ['Where do you stand in the funnel?', 'Tell me in the comments'] },
  douyin: { cut: 'long', fmt: 'v', lang: 'zh', name: '就这_抖音', cta: ['你站在漏斗的哪一层？', '评论区说说'] },
  channels: { cut: 'long', fmt: 'v', lang: 'zh', name: '就这_视频号', safe67: true, cta: ['你站在漏斗的哪一层？', '转给那个说“就这？”的人'] },
  // 流量短版：片尾让观众在评论区按数字站队（评论数是推荐的第一信号）
  douyin_short: { cut: 'short', fmt: 'v', lang: 'zh', name: '就这_抖音_短版', cta: ['你在第几层？', '评论区打数字'], poll: true },
  channels_short: { cut: 'short', fmt: 'v', lang: 'zh', name: '就这_视频号_短版', safe67: true, cta: ['你在第几层？', '转给那个说“就这？”的人'], poll: true },
  shorts: { cut: 'short', fmt: 'v', lang: 'en', name: 'ThatsIt_Shorts', cta: ['Where are you?', 'Comment your number'], poll: true },
};

// 画面上的文字。漏斗的数字都是 Karpathy 自己说的“粗算”（napkin math）。
export const TXT = {
  title: '就这？', titleEn: 'THAT\'S IT?',
  titleSub: '为什么每个人眼里的 AI，不一样大', titleSubEn: 'Why AI looks so different depending on where you stand',
  // 竖屏顶部常驻标题：第一帧就在。数字是 Karpathy 的粗算，高潮处兑现
  header: ['全球只有约 5000 人，用过最前沿的 AI', '你站在第几层？'],
  headerEn: ['Only ~5,000 people have used the most advanced AI', 'Where do you stand?'],
  poll: [['1', '几乎没用过'], ['2', '偶尔聊聊天'], ['3', '天天拿它干活'], ['4', '我在门里面']],
  pollEn: [['1', 'barely used it'], ['2', 'the odd chat'], ['3', 'it does my work'], ['4', 'I\'m inside the door']],
  ask1: '附近有什么好吃的馆子？', ask1En: 'Any good places to eat nearby?',
  answer1: '强烈推荐「老街小馆」！招牌红烧肉，口碑极佳。', answer1En: 'Try "Old Street Kitchen"! Famous braised pork, rave reviews.',
  shopName: '老街小馆', closed: '停业', closedNote: '本店已于三年前停止营业 · 感谢多年厚爱',
  justThis: '就这？', bigChange: '要变天了',
  calendar: ['一', '个', '月'],
  tiers: [
    { n: '60 亿', pct: '约 75%', what: '几乎没碰过', en: '6 BILLION · BARELY TOUCHED IT' },
    { n: '10–20 亿', pct: '约 20%', what: '一个呆呆的聊天框', en: '1–2 BILLION · A DOPEY CHATBOT' },
    { n: '2000 万', pct: '约 0.2%', what: '写代码、做数学的专业用户', en: '20 MILLION · PROS IN MATH & CODE' },
    { n: '≈ 5000', pct: '约 0.00006%', what: '实验室内部', en: '≈ 5,000 · INSIDE THE LABS' },
  ],
  eightB: '80 亿人', eightBEn: '8 BILLION PEOPLE',
  cup: '一杯水', deep: '你真在乎的问题',
  peakA: '算式', peakB: '代码', peakC: '证明',
  valleyA: '找馆子', valleyB: '过日子', valleyC: '写封信',
  doors: ['免费', '付费', '内部'], trailer: '预告片',
  bars: [['顶尖高手', '几年'], ['成千上万个 AI', '几周']],
  manuscripts: ['证明', '定理', '新材料', '新药', '漏洞', '补丁'],
  karpathy: 'Andrej Karpathy', karpathyRole: 'OpenAI 创始成员之一 · 前特斯拉 AI 总监', karpathyRoleEn: 'OpenAI founding member · former Director of AI, Tesla',
  napkin: '粗算 · napkin math',
  oneYear: '不到一年前', postDate: '2026.10.11 · X',
  // 依据：帖子原文（画面上原样引用）与 karpathy.ai 的自我介绍
  codeQuote: ['“less than 1 year ago, I was writing code manually by hand,', 'typing memorized computer code commands into a code editor', 'character by character, occasionally pressing Tab…”'],
  codeQuoteSrc: '— Andrej Karpathy · X · 2026.10.11', roleSrc: '据 karpathy.ai', roleSrcEn: 'per karpathy.ai', postAprDate: '重提 2026.04.09 的旧帖',
  quote: 'this gap in shared understanding', quote2: 'of LLM capability is *widening*.',
  dream: '我的小馆子', dreamReply: '好呀！我们一步一步来：先把菜单和成本算清楚。',
  code: 'for i in range(len(rows)):', dreamAsk: '我想开一家自己的小馆子，该从哪儿开始？', dreamLines: ['菜单 · 成本 · 选址', '房租多少？', '先卖什么？'],
  start: '就从这儿开始', startEn: 'This is where it starts',
  source: '根据 Andrej Karpathy 2026 年 10 月 11 日的帖子', sourceEn: 'Based on Andrej Karpathy\'s post, October 11, 2026',
  sign: 'IDEVLAB',
  // 英文版（YouTube、Shorts）画面上的字：键名加 En
  justThisEn: 'That\'s it?', bigChangeEn: 'Everything\'s changing', calendarEn: ['ONE', ' ', 'MONTH'],
  cupEn: 'a cup of water', deepEn: 'a problem you truly care about',
  peakAEn: 'MATH', peakBEn: 'CODE', peakCEn: 'PROOFS', valleyAEn: 'dinner?', valleyBEn: 'errands', valleyCEn: 'a letter',
  doorsEn: ['FREE', 'PAID', 'INTERNAL'], trailerEn: 'TRAILER', barsEn: [['Top experts', 'years'], ['Thousands of AIs', 'weeks']],
  oneYearEn: 'Less than a year ago', dreamEn: 'My little place', dreamLinesEn: ['menu · costs · rent', 'how much rent?', 'what to cook first?'],
  dreamAskEn: 'I want to open my own little restaurant. Where do I start?', dreamReplyEn: 'Love it! Step by step: let\'s work out the menu and costs first.',
};
