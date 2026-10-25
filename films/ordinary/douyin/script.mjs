// 《凡人》抖音版（9:16，约 1:40）：旁白重写，画面是原片镜头的重新剪辑。
// 原片的镜头函数（../shots/*.js）原样复用：每个段落从原片某个镜头里取一段 [from, to]（原片镜头内的秒数），
// 按这段旁白的实测长度快放或慢放；原片镜头读到的 sh、dur 也是原片时间轴（../timeline_zh.json）里的，镜头内的对位不变。
// 原片的画面文字与出处：../script.mjs 的 CAPTIONS；旁白简报与 Gemini 改写稿：brief/。

// 旁白：每句一行。act 段落（配乐、进度条刻度按它分），seg 画面段落（见 SEGS），k 关键词（字幕念到时变金色、画面一顶、音效对位），
// tag 只发给合成的语气标签。整条一次合成（tools/tts.py）。
export const LINES = [
  { id: 'h1', act: 'hook', seg: 'hook', zh: '科学把我们从神坛上，请下来过三次。', k: { three: '三次' } },
  { id: 'h2', act: 'hook', seg: 'hook', zh: '第三次，正在发生。', k: { now: '正在发生' } },
  { id: 'a1', act: 'altar', seg: 'vitruvian', zh: '很久以前，我们以为自己是世界的中心。', k: { center: '中心' } },
  { id: 'a2', act: 'altar', seg: 'fuxi', zh: '女娲用黄土造人；', k: { clay: '黄土' } },
  { id: 'a3', act: 'altar', seg: 'adam', zh: '神照着自己的模样造人。', k: { image: '自己的模样' } },
  { id: 'b1', act: 'one', seg: 'ptolemy', zh: '第一次，是位置。托勒密说，地球是宇宙的中心。', k: { ch: '第一次', name: '位置' } },
  { id: 'b2', act: 'one', seg: 'ptolemy', zh: '这一信，就信了一千四百年。', k: { years: '一千四百年' } },
  { id: 'b3', act: 'one', seg: 'copernicus', zh: '一五四三年，哥白尼把中心，让给了太阳。', k: { sun: '太阳' } },
  { id: 'b4', act: 'one', seg: 'zoom', zh: '可太阳，也只是几千亿颗恒星之一。', k: { stars: '几千亿颗' } },
  { id: 'b5', act: 'one', seg: 'cosmicyear', zh: '宇宙一百三十八亿年，压成一年，文明只占最后十几秒。', k: { secs: '最后十几秒' } },
  { id: 'b6', act: 'one', seg: 'paleblue', zh: '六十亿公里外回头看，地球，只是一粒暗淡的蓝点。', k: { dot: '暗淡的蓝点' } },
  { id: 'c1', act: 'two', seg: 'chain', zh: '第二次，是出身。万物阶梯上，我们离神只有一步。', k: { ch: '第二次', name: '出身', god: '只有一步' } },
  { id: 'c2', act: 'two', seg: 'darwin', zh: '一八五九年，达尔文出版了《物种起源》。', k: { book: '《物种起源》' } },
  { id: 'c3', act: 'two', seg: 'ladder', zh: '那架阶梯，倒了下来，长成了一棵树。', k: { fall: '倒了下来', tree: '一棵树' } },
  { id: 'c5', act: 'two', seg: 'huxley', zh: '我们和黑猩猩，DNA 有百分之九十八点八相同。', k: { pct: '百分之九十八点八' } },
  { id: 'c6', act: 'two', seg: 'tree', zh: '说白了，我们只是生命之树上，平凡的一枝。', tag: '[sighs]', k: { branch: '平凡的一枝' } },
  { id: 'd2', act: 'three', seg: 'descartes', zh: '只剩思想了。笛卡尔说：“我思，故我在。”', k: { ch: '思想', cogito: '我思，故我在' } },
  { id: 'd3', act: 'three', seg: 'turing', zh: '一九五〇年，图灵问：机器，能思考吗？', tag: '[curious]', k: { q: '能思考吗' } },
  { id: 'd4', act: 'three', seg: 'chess', zh: '四十七年后，深蓝击败了国际象棋世界冠军。', k: { y: '四十七年后' } },
  { id: 'd5', act: 'three', seg: 'go', zh: '又过十九年，AlphaGo 走出一步，人类几乎不会走的棋。', k: { y: '十九年' } },
  { id: 'd6', act: 'three', seg: 'protein', zh: '再过四年，AlphaFold 算出了蛋白质的结构；', k: { y: '四年' } },
  { id: 'd7', act: 'three', seg: 'talk', zh: '又过两年，它开口跟我们说话了。', k: { y: '两年' } },
  { id: 'd9', act: 'three', seg: 'curve', zh: '写作、编程，它已经胜过大多数人。', k: { most: '大多数人' } },
  { id: 'd10', act: 'three', seg: 'making', zh: '就连这条视频——画面、配乐、旁白——都是 AI 做的。', k: { ai: 'AI 做的' } },
  { id: 'e1', act: 'end', seg: 'descend', zh: '所以你看，科学只做了一件事：把我们从神坛上，请下来。', k: { down: '请下来' } },
  { id: 'e2', act: 'end', seg: 'recap', zh: '我们不在宇宙的中心，不在造物的顶端，甚至不是唯一会思考的存在。', k: { r1: '宇宙的中心', r2: '造物的顶端', r3: '唯一会思考' } },
  { id: 'e3', act: 'end', seg: 'ordinary', zh: '到头来，我们，只是凡人。', k: { fan: '凡人' } },
  { id: 'e4', act: 'outro', seg: 'endcard', zh: '三次里，你最难接受哪一次？评论区打一、二、三。', k: { poll: '评论区' } },
];

// 读音替换：只发给合成，字幕不变（同长度的同音字，避开多音字误读）
export const SAY = { zh: [['长成', '涨成'], ['配乐', '配越'], ['〇', '零']] };

// 画面段落：src 原片镜头；from/to 取原片镜头内的哪一段（秒）；w 横屏画面里要露出的宽度（像素，默认 1180），cx 露出部分的中心（默认 960）
// cy：露出部分的竖向中心（默认 540）
// sync：[关键词, 原片镜头内的秒]，让原片镜头里的变化（换图、走下台阶）落在这个词被念出的时刻；时间按这些锚点分段线性换算
// stamp：关键词被念出时砸出的大字 [关键词, 大字, 小字, 样式]；样式省略时是章节卡（画面压暗、正中），'num' 是数字（画面上部、不压暗）
export const SEGS = {
  hook: { src: 'descend', from: 1.6, to: 6.4, w: 860, cy: 640, stamp: [['three', '3 次', '科学把我们请下神坛']] },
  vitruvian: { src: 'vitruvian', from: 1.0, to: 6.5, w: 1100 },
  fuxi: { src: 'fuxi', from: 1.2, to: 5.6, w: 1000 },
  adam: { src: 'adam', from: 1.0, to: 5.6, w: 1500, cx: 860 },
  ptolemy: { src: 'ptolemy', from: 1.0, to: 10.6, w: 1150, stamp: [['ch', '第一次', '位置'], ['years', '1400 年', '地心说', 'num']] },
  copernicus: { src: 'copernicus', from: 1.4, to: 7.6, w: 1150 },
  zoom: { src: 'zoom', from: 2.0, to: 10.0, w: 900, stamp: [['stars', '几千亿', '银河系里的恒星', 'num']] },
  cosmicyear: { src: 'cosmicyear', from: 1.4, to: 10.8, w: 1500, stamp: [['secs', '约 11 秒', '宇宙一年里的全部文明', 'num']] },
  paleblue: { src: 'paleblue', from: 2.0, to: 11.0, w: 1250, cx: 1100 },
  chain: { src: 'chain', from: 4.0, to: 16.0, w: 1150, stamp: [['ch', '第二次', '出身']] },
  darwin: { src: 'darwin', from: 1.0, to: 5.0, w: 1150 },
  ladder: { src: 'ladder', from: 1.0, to: 7.6, w: 1700 },
  huxley: { src: 'huxley', from: 1.6, to: 10.6, w: 1500, stamp: [['pct', '98.8%', '人与黑猩猩的 DNA', 'num']] },
  tree: { src: 'tree', from: 2.0, to: 10.0, w: 1600 },
  descartes: { src: 'descartes', from: 5.0, to: 14.0, w: 1150, stamp: [['ch', '第三次', '心智']] },
  turing: { src: 'turing', from: 1.0, to: 7.2, w: 1350 },
  chess: { src: 'chess', from: 1.0, to: 5.2, w: 1350, stamp: [['y', '47 年', '1950 → 1997', 'num']] },
  go: { src: 'go', from: 1.0, to: 6.6, w: 1350, stamp: [['y', '19 年', '1997 → 2016', 'num']] },
  protein: { src: 'protein', from: 1.0, to: 5.2, w: 1350, stamp: [['y', '4 年', '2016 → 2020', 'num']] },
  talk: { src: 'talk', from: 1.0, to: 5.0, w: 1350, stamp: [['y', '2 年', '2020 → 2022', 'num']] },
  curve: { src: 'curve', from: 3.0, to: 10.0, w: 1450 },
  making: { src: 'making', from: 1.0, to: 8.2, w: 1650 },
  descend: { src: 'descend', from: 2.0, to: 7.0, w: 1150, sync: [['down', 5.4]] },
  recap: { src: 'recap', from: 1.5, to: 10.2, w: 1600, sync: [['r2', 3.5], ['r3', 6.4]] },
  ordinary: { src: 'black', from: 0.5, to: 4.5, stamp: [['fan', '凡人', 'ORDINARY']] },
  endcard: { src: null, hold: 1.5 },
};

// 平台版本：只做抖音
export const VARIANTS = {
  douyin: { name: '凡人_抖音', cta: ['这三次里，你最难接受哪一次？', '评论区打 1、2、3'] },
};

// 画面文字
export const TXT = {
  header: ['科学把人类请下神坛的 3 次', '第 3 次，正在发生'],
  source: '改编自纪录短片《凡人 · Ordinary》',
  chapters: { one: '位置', two: '出身', three: '心智' },
  poll: [['1', '位置', '地球不是宇宙的中心'], ['2', '出身', '人是生命之树的一枝'], ['3', '心智', '会思考的不只我们']],
  sign: 'IDEVLAB',
};
