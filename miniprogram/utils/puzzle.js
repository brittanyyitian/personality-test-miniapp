const PIECES = [
  {
    id: 'relationship',
    name: '恋爱模式',
    image: '/assets/doodle-relationship.png',
    color: '#F47716',
    background: '#FFF0E5',
    questionBackground: '#FFF9F2'
  },
  {
    id: 'attachment',
    name: '依恋模式',
    image: '/assets/doodle-attachment.png',
    color: '#B69AEF',
    background: '#F2EBFB',
    questionBackground: '#FBF7FF'
  },
  {
    id: 'bigfive',
    name: '人格底色',
    image: '/assets/doodle-bigfive.png',
    color: '#3F9A5F',
    background: '#EAF4E8',
    questionBackground: '#F7FBF4'
  },
  {
    id: 'cognitive',
    name: '思考模式',
    image: '/assets/doodle-cognitive.png',
    color: '#F7BF2D',
    background: '#FFF3CE',
    questionBackground: '#FFFBEC'
  },
  {
    id: 'social',
    name: '社交模式',
    image: '/assets/doodle-social.png',
    color: '#3F7EE8',
    background: '#E8EEFC',
    questionBackground: '#F5F8FF'
  }
];

const { RESULT_VISUALS } = require('../data/result-visuals');

const METRIC_LABELS = {
  anxiety: '回应敏感',
  avoidance: '独立倾向',
  security: '连接安全',
  energy: '连接活力',
  empathy: '共情合作',
  order: '自律秩序',
  sensitivity: '情绪敏感',
  openness: '开放想象',
  commitment: '共同投入',
  appreciation: '被看见感',
  response: '情绪回应',
  repair: '冲突修复',
  trust: '信任边界',
  SA: '主动连接',
  PF: '计划倾向',
  SH: '表达需要',
  CB: '关系黏度',
  DR: '带动气氛',
  JK: '幽默化解'
};

function getPiece(id) {
  return PIECES.find((piece) => piece.id === id) || null;
}

function findAnalysisSection(sections, patterns) {
  return sections.find((section) => patterns.some((pattern) => pattern.test(section.title))) || null;
}

function illustratedAnalysis(result, visual) {
  if (!visual || !visual.analysisProfile) return [];
  const profile = visual.analysisProfile;
  const insights = Array.isArray(result.insights) ? result.insights : [];
  const sections = Array.isArray(result.sections) ? result.sections : [];
  const deepSections = Array.isArray(result.deepDive && result.deepDive.sections) ? result.deepDive.sections : [];
  const normalized = (items) => items
    .filter((item) => item && item.body)
    .map((item) => ({ title: String(item.title || ''), body: String(item.body || '').trim() }));
  const insightItems = normalized(insights);
  const sectionItems = normalized(sections);
  const deepItems = normalized(deepSections);
  const core = String(result.deepDive && result.deepDive.body || '').trim()
    || (findAnalysisSection(deepItems, [/一起工作/, /顺起来/]) || {}).body
    || (findAnalysisSection(sectionItems, [/自然的样子/, /两个细节/, /思考顺序/]) || {}).body
    || profile.driver;
  const tension = (findAnalysisSection(sectionItems, [/容易卡住/, /生活节奏/]) || {}).body;
  const stress = (findAnalysisSection(insightItems, [/压力/, /反过来/])
    || findAnalysisSection(deepItems, [/压力/]) || {}).body;
  const misread = (findAnalysisSection(insightItems, [/误会/, /误读/])
    || findAnalysisSection(sectionItems, [/关系里的你/]) || {}).body;
  const recovery = (findAnalysisSection(insightItems, [/调整/, /恢复/])
    || findAnalysisSection(deepItems, [/平衡/, /恢复/]) || {}).body;
  const conflict = tension && !profile.conflict.includes(tension) && !tension.includes(profile.conflict)
    ? `${profile.conflict} ${tension}`
    : profile.conflict;
  return [
    { key: 'driver', index: '01', title: '核心驱动力', body: core || profile.driver },
    { key: 'conflict', index: '02', title: '内在矛盾', body: conflict },
    { key: 'stress', index: '03', title: '压力反转', body: stress || profile.stress },
    { key: 'misread', index: '04', title: '关系误读', body: misread || profile.misread },
    { key: 'understood', index: '05', title: '被理解方式', body: profile.understood },
    { key: 'recovery', index: '06', title: '恢复建议', body: recovery || profile.recovery }
  ];
}

function getResultVisual(result) {
  if (!result || !result.assessmentId || !result.typeCode) return null;
  const assessmentVisuals = RESULT_VISUALS[result.assessmentId];
  const visual = assessmentVisuals ? assessmentVisuals[result.typeCode] || null : null;
  if (!visual) return null;
  const analysis = illustratedAnalysis(result, visual);
  if (!Array.isArray(visual.tendencyAxes)) return analysis.length ? { ...visual, analysis } : visual;
  return {
    ...visual,
    analysis,
    tendencies: visual.tendencyAxes.map((axis) => ({
      label: axis.label,
      percent: clamp(50 + (Number(result.scores && result.scores[axis.key]) || 0) * 50 * axis.direction),
      tone: axis.tone
    }))
  };
}

function getResultHeroAsset(result) {
  const visual = getResultVisual(result);
  return visual ? { kicker: visual.kicker, title: visual.title, hero: visual.hero } : null;
}

function clamp(value) {
  return Math.max(4, Math.min(96, Math.round(Number(value) || 0)));
}

function resultKeyword(result) {
  if (!result) return '';
  if (result.assessmentId === 'cognitive' && result.typeName) return result.typeName;
  const title = String(result.title || '新的一面');
  return title.includes('·') ? title.split('·').pop().trim() : title;
}

function cognitiveMetrics(result) {
  const code = String(result.typeCode || 'XXXX');
  const scores = result.scores || {};
  const definitions = [
    ['EI', code[0] === 'X' ? '连接节奏' : code[0] === 'E' ? '向外连接' : '独处充电', code[0] === 'I' ? -1 : 1],
    ['NS', code[1] === 'X' ? '信息偏好' : code[1] === 'N' ? '抽象联想' : '具体感知', code[1] === 'S' ? -1 : 1],
    ['TF', code[2] === 'X' ? '判断依据' : code[2] === 'T' ? '逻辑判断' : '价值感受', code[2] === 'F' ? -1 : 1]
  ];
  return definitions.map(([key, label, direction]) => ({
    key,
    label,
    percent: clamp(50 + (Number(scores[key]) || 0) * 50 * direction)
  }));
}

function buildMetrics(result) {
  if (!result) return [];
  if (result.assessmentId === 'cognitive') return cognitiveMetrics(result);
  if (result.assessmentId === 'attachment') {
    const anxiety = Number(result.scores && result.scores.anxiety) || 0;
    const avoidance = Number(result.scores && result.scores.avoidance) || 0;
    const anxietyPercent = anxiety;
    const avoidancePercent = avoidance;
    return [
      { key: 'anxiety', label: METRIC_LABELS.anxiety, percent: clamp(anxietyPercent) },
      { key: 'avoidance', label: METRIC_LABELS.avoidance, percent: clamp(avoidancePercent) },
      { key: 'security', label: METRIC_LABELS.security, percent: clamp(100 - ((anxietyPercent + avoidancePercent) / 2)) }
    ];
  }

  const scoreEntries = Object.entries(result.scores || {});
  const entries = Array.isArray(result.metricKeys) && result.metricKeys.length
    ? result.metricKeys.map((key) => [key, result.scores && result.scores[key]]).filter(([, value]) => value !== undefined)
    : scoreEntries;
  return entries.slice(0, 3).map(([key, raw]) => {
    let percent = Number(raw) || 0;
    if (result.assessmentId === 'bigfive' || result.assessmentId === 'relationship') {
      percent = ((percent - 1) / 4) * 100;
    } else if (result.assessmentId === 'social') {
      percent = 50 + percent * 6.25;
    }
    return { key, label: METRIC_LABELS[key] || key, percent: clamp(percent) };
  });
}

const STORY_CONFIG = {
  relationship: {
    eyebrow: '关系不是一张成绩单',
    heading: '这段关系里，正在发生什么',
    metricsTitle: '这段关系最关键的三个信号',
    blocks: [
      ['支点', '你们还拥有的底气', 'support'],
      ['循环', '最容易反复的相处模式', 'cycle'],
      ['你的感受', '你可能已经做了很多', 'effort'],
      ['下一步', '接下来要看行动', 'action']
    ]
  },
  attachment: {
    eyebrow: '靠近与退后，都是为了保护连接',
    heading: '你怎样靠近，也怎样保护自己',
    metricsTitle: '你的亲密距离',
    blocks: [
      ['触发', '一个很像你的时刻', 'scene'],
      ['保护', '你会自动进入的循环', 'protect'],
      ['误读', '别人看到的你', 'misread'],
      ['需要', '真正能让你安心的信号', 'need']
    ]
  },
  bigfive: {
    eyebrow: '人格不是类型，而是五种倾向的组合',
    heading: '你的底色，藏在这些反差里',
    metricsTitle: '最突出的三条性格线索',
    blocks: [
      ['外在', '别人先看到的你', 'outside'],
      ['内在', '熟悉以后才会看见', 'inside'],
      ['压力', '被放大的那一面', 'stress'],
      ['理解', '不必把优势改掉', 'growth']
    ]
  },
  cognitive: {
    eyebrow: '不是四个字母，是你的思考顺序',
    heading: '你的大脑，通常这样工作',
    metricsTitle: '你处理信息的三个偏好',
    blocks: [
      ['01', '心里真正发生的', 'process'],
      ['02', '压力下的思维反转', 'process'],
      ['03', '关系里容易被误会的地方', 'process'],
      ['04', '让思考恢复流动', 'process']
    ]
  },
  social: {
    eyebrow: '不是社牛或社恐那么简单',
    heading: '你在人群里的样子，会随场景改变',
    metricsTitle: '你的社交启动方式',
    blocks: [
      ['现场', '一个很像你的瞬间', 'scene'],
      ['角色', '你在人群里的自动位置', 'role'],
      ['反差', '别人容易误会的地方', 'misread'],
      ['散场后', '你真正需要的恢复方式', 'recovery']
    ]
  }
};

function cleanStorySections(result) {
  const source = Array.isArray(result && result.insights) && result.insights.length
    ? result.insights
    : (Array.isArray(result && result.sections) ? result.sections : []);
  return source
    .filter((section) => section && section.body)
    .map((section) => ({
      title: String(section.title || '').trim(),
      body: String(section.body || '').trim()
    }));
}

function buildResultStory(result) {
  if (!result) return null;
  const config = STORY_CONFIG[result.assessmentId] || {
    eyebrow: '一份关于你的当前观察',
    heading: '为什么这很像你',
    metricsTitle: '三个关键线索',
    blocks: []
  };
  const source = cleanStorySections(result);
  const lead = source[0] && source[0].body
    ? source[0].body
    : String(result.summary || result.shareLine || '这是一块关于你的当前观察。').trim();
  const candidates = source.slice(1);
  const blocks = config.blocks.map((definition, index) => {
    const section = candidates[index] || source[index] || {};
    return {
      marker: definition[0],
      title: section.title || definition[1],
      body: section.body || lead,
      kind: definition[2]
    };
  });
  return {
    id: result.assessmentId,
    eyebrow: config.eyebrow,
    heading: config.heading,
    metricsTitle: config.metricsTitle,
    lead,
    dimensions: result.assessmentId === 'bigfive'
      ? Object.entries(result.scores || {}).slice(0, 5).map(([key, raw]) => ({
        key,
        label: METRIC_LABELS[key] || key,
        percent: clamp(((Number(raw) - 1) / 4) * 100)
      }))
      : [],
    blocks
  };
}

function firstSentence(text, maxLength) {
  const source = String(text || '').trim();
  if (!source) return '';
  const sentence = source.split(/[。！？]/)[0] || source;
  const limit = maxLength || 54;
  return sentence.length > limit ? `${sentence.slice(0, limit)}…` : `${sentence}。`;
}

function buildHighlights(result, maxLength) {
  const limit = maxLength || 240;
  const source = Array.isArray(result && result.insights) && result.insights.length
    ? result.insights
    : (Array.isArray(result && result.sections) ? result.sections : []);
  return source
    .filter((section) => section && section.title && section.body)
    .slice(0, 5)
    .map((section) => {
      const body = String(section.body).trim();
      return {
        title: String(section.title).trim(),
        body: body.length > limit ? `${body.slice(0, limit)}…` : body
      };
    });
}

module.exports = {
  PIECES,
  getPiece,
  getResultVisual,
  getResultHeroAsset,
  illustratedAnalysis,
  resultKeyword,
  buildMetrics,
  buildResultStory,
  firstSentence,
  buildHighlights
};
