const cognitiveTypes = {
  INTJ: ['静默构图者', '你习惯先把全局搭好，再决定从哪里开始。安静不是退出，而是在脑中持续构图。', ['默默观察', '先想后说', '结构脑', '计划在心', '关键时刻开口', '独处充电', '讨厌低效', '外冷内稳', '想得很远']],
  INTP: ['逻辑探路者', '你很难满足于现成答案。把问题拆开、换几个角度，才更接近真正说得通的解释。', ['逻辑拆解', '问题很多', '先研究一下', '概念收藏家', '脑洞推演', '安静烧脑', '不爱定论', '突然顿悟', '追问为什么']],
  ENTJ: ['推进设计者', '你会本能寻找方向、资源和下一步。想清楚方向以后，推进比空转更重要。', ['目标雷达', '推进很快', '路径规划', '结果导向', '敢做决定', '资源整合', '不爱拖延', '标准明确', '带队前进']],
  ENTP: ['可能性拆解者', '新的可能会迅速点亮你。你喜欢先拆开所有选项，再找最值得尝试的那条路。', ['脑洞开机', '反向提问', '可能很多', '边聊边想', '不怕推翻', '临场改路', '辩一辩看', '讨厌无聊', '点子接力']],
  INFJ: ['深层理解者', '你不只听见别人说了什么，也会留意没有说出口的部分，并寻找背后的长期走向。', ['读懂弦外音', '安静共情', '深度连接', '直觉很准', '想得很远', '需要独处', '保护边界', '慢慢靠近', '温柔坚定']],
  INFP: ['内在守护者', '你对真诚和内在价值非常敏感。真正认定的人与事，会被你安静而长久地守住。', ['真心优先', '柔软内核', '价值感强', '想象丰富', '情绪细腻', '不爱勉强', '安静坚持', '需要共鸣', '守护喜欢']],
  ENFJ: ['关系点灯者', '你很容易感受到人群之间的温度，也愿意主动让关系向更明亮的方向发展。', ['主动关心', '关系升温', '读懂气氛', '鼓励高手', '连接大家', '认真回应', '照顾全场', '容易操心', '温暖推动']],
  ENFP: ['灵感连接者', '人、故事和新的可能会迅速点亮你。你擅长把零散灵感连接成有生命力的方向。', ['灵感很多', '热情连接', '故事雷达', '边说边想', '真诚直接', '点子串联', '容易兴奋', '讨厌受限', '带来可能']],
  ISTJ: ['稳定建造者', '你更信任经过验证的经验，愿意把重要的事情一件件落实，慢慢搭建出可靠秩序。', ['稳稳推进', '细节确认', '承诺在线', '计划清楚', '经验可靠', '一步一步', '责任感强', '不爱冒进', '长期耐心']],
  ISFJ: ['细节照顾者', '你会先注意到别人细小的需要，再悄悄把贴心落在具体行动和日常细节里。', ['记得小事', '安静照顾', '回应及时', '细节在线', '熟人温暖', '不愿添麻烦', '认真守护', '习惯体谅', '可靠陪伴']],
  ESTJ: ['秩序推进者', '你擅长把事情理顺节奏、分清责任，让模糊的任务稳定地向前推进。', ['流程清楚', '马上执行', '责任明确', '效率优先', '敢于拍板', '标准在线', '推进稳定', '不爱含糊', '落地很强']],
  ESFJ: ['日常联结者', '你擅长把零碎日常慢慢连成温暖关系，让每个人都感到自己被认真放在心上。', ['主动问候', '回应在线', '记得约定', '照顾气氛', '日常分享', '关系维护', '温暖周到', '容易多想', '大家都好']],
  ISTP: ['冷静解决者', '现场越混乱，你越能安静观察真实情况，找到最直接、最有效的解决办法。', ['冷静观察', '动手解决', '先看现场', '步骤清楚', '反应很快', '少说多做', '工具思维', '独立处理', '临危不乱']],
  ISFP: ['感受行动者', '你先感受到真实的氛围与分寸，再用选择、行动和细节表达自己在意什么。', ['感受敏锐', '行动表达', '审美在线', '不爱解释', '温柔有界', '顺势调整', '在意真实', '安静体验', '保护自由']],
  ESTP: ['现场应变者', '你很能进入现场。情况一变，你会迅速换招，在真实反馈里找到下一步。', ['现场雷达', '马上换招', '行动很快', '临场发挥', '敢于尝试', '结果反馈', '不怕变化', '直接解决', '越忙越稳']],
  ESFP: ['氛围点亮者', '你很会感受当下的人和气氛，一出现就自然带来热度、回应与生命力。', ['自带热度', '回应很快', '气氛担当', '真实表达', '快乐分享', '现场有梗', '喜欢参与', '热情直接', '点亮大家']]
};

const facetCopy = {
  E: { label: '向外连接', detail: '互动会帮助你整理想法，也让行动更快启动。', note: '你常在回应与互动里找到能量。' },
  I: { label: '独处蓄能', detail: '重要判断会先在心里成形，安静也是恢复方式。', note: '你需要独处整理，再把真正重要的话说出来。' },
  N: { label: '可能联想', detail: '容易从线索看见意义、连接与还未发生的方向。', note: '你常越过表面细节，寻找背后的模式与可能。' },
  S: { label: '具体感知', detail: '更信任实际经验、明确细节和可以验证的行动。', note: '真实发生的细节与行动，会让你更安心。' },
  T: { label: '逻辑判断', detail: '做决定时会寻找一致标准和真正说得通的结构。', note: '你希望判断经得起推敲，也倾向先处理问题本身。' },
  F: { label: '价值感受', detail: '做选择时会自然考虑人的感受、关系与内在价值。', note: '你会把具体的人和真实感受放进每一次选择。' },
  J: { label: '计划推进', detail: '清楚的安排和阶段目标，会让你更稳定地向前。', note: '方向明确以后，你更容易持续而稳定地推进。' },
  P: { label: '灵活探索', detail: '喜欢保留调整空间，在行动与反馈中继续修正。', note: '你需要一点开放空间，边走边找到更合适的路径。' }
};

const tones = ['red', 'yellow', 'green', 'purple'];
const tagFaces = ['look', 'look', 'wink', 'look', 'wink', 'look', 'calm', 'tired', 'calm'];
const heroesWithEmbeddedKicker = new Set(['INTJ', 'INTP', 'ENFP', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);

function cognitiveVisual(typeCode, definition) {
  const [title, quote, tagLabels] = definition;
  const letters = typeCode.split('');
  return {
    template: 'illustrated-poster',
    kicker: '你的人格类型是',
    title,
    hero: `/result-package/assets/result-cognitive-${typeCode.toLowerCase()}-hero.webp`,
    // Some supplied hero images already contain this line. The page only fills it
    // in for images that do not, so every result shows it exactly once.
    heroIncludesKicker: heroesWithEmbeddedKicker.has(typeCode),
    aiIcon: '/assets/result-ai-observer.webp',
    quote,
    traits: letters.map((letter, index) => ({ ...facetCopy[letter], tone: tones[index] })),
    tags: tagLabels.map((label, index) => ({
      label,
      face: tagFaces[index],
      tone: index === 0 ? 'yellow' : index === 1 ? 'blue' : index === 2 ? 'coral' : ''
    })),
    tendencyTitle: '思维倾向',
    tendencyAxes: [
      { key: 'EI', label: letters[0] === 'I' ? '独处充电' : '向外连接', direction: letters[0] === 'I' ? -1 : 1, tone: 'red' },
      { key: 'NS', label: letters[1] === 'N' ? '抽象联想' : '具体感知', direction: letters[1] === 'S' ? -1 : 1, tone: 'yellow' },
      { key: 'TF', label: letters[2] === 'T' ? '逻辑判断' : '价值感受', direction: letters[2] === 'F' ? -1 : 1, tone: 'green' },
      { key: 'JP', label: letters[3] === 'J' ? '计划推进' : '灵活探索', direction: letters[3] === 'P' ? -1 : 1, tone: 'purple' }
    ],
    friendTags: tagLabels.slice(0, 5),
    notes: [facetCopy[letters[0]].note, `${facetCopy[letters[1]].note}${facetCopy[letters[2]].note}`, facetCopy[letters[3]].note]
  };
}

const cognitive = Object.fromEntries(Object.entries(cognitiveTypes).map(([code, definition]) => [code, cognitiveVisual(code, definition)]));

const social = {
  SPARK: {
    template: 'illustrated-poster',
    kicker: '你的人格类型是',
    title: '慢性撤退者',
    hero: '/assets/result-chronic-retreater.webp',
    aiIcon: '/assets/result-ai-observer.webp',
    quote: '你不是突然不喜欢一个人。你只是在一次次小失望里，安静地把期待收回来。',
    traits: [
      { label: '慢热', detail: '熟起来前冷淡，熟起来后才走心。', tone: 'red' },
      { label: '高敏感', detail: '能察觉很多细节，但很少说出来。', tone: 'yellow' },
      { label: '边界强', detail: '不轻易越界，也不喜欢被打扰。', tone: 'green' },
      { label: '容易胡思乱想', detail: '想太多是日常，但表面依旧平静。', tone: 'purple' }
    ],
    tags: ['自动开场王', '气氛升温器', '接话不冷场', '组局发起人', '现场梗很多', '分享欲在线', '越熟越能聊', '散场后省电', '也需要回应'].map((label, index) => ({ label, face: tagFaces[index], tone: index === 0 ? 'yellow' : index === 1 ? 'blue' : index === 2 ? 'coral' : '' })),
    tendencyTitle: '关系倾向',
    tendencies: [
      { label: '独立倾向', percent: 82, tone: 'red' },
      { label: '表达需求', percent: 31, tone: 'yellow' },
      { label: '关系敏感', percent: 67, tone: 'green' },
      { label: '边界意识', percent: 91, tone: 'purple' }
    ],
    friendTags: ['可靠', '温柔', '有点敏感', '慢热', '爱胡思乱想'],
    notes: ['你不是不需要爱，你只是不喜欢“需要别人”的自己。', '你很少大吵大闹，但会在心里一点点退出。', '你在意细节，也擅长保护自己。']
  }
};

const RESULT_VISUALS = { cognitive, social };

module.exports = { RESULT_VISUALS, cognitiveTypes };
