const app = document.querySelector('#app');

const state = {
  catalog: null,
  assessment: null,
  questions: [],
  answers: [],
  current: 0,
  result: null,
  results: [],
  coupleCode: '',
  couplePartnerCode: '',
  coupleCodePanel: false,
  coupleInviteSent: false,
  coupleDemo: '',
  coupleScoreExpanded: false,
  returnToCouple: false,
  coupleReport: null,
  inspirationGroup: null,
  inspirationCard: null
};

const RESULT_KEY = 'mind_preview_results_v1';
const normalizeStoredResult = (result) => result?.assessmentId === 'cognitive' ? {
  ...result,
  summary: String(result.summary || '').replace(/\s*其中有些方向很接近中间，说明你会随场景切换。?/, ''),
  reminder: '把结果当作一张观察自己的地图，而不是必须维持的人设。你随时可以使用不那么习惯的那一面。'
} : result;
const loadResults = () => {
  try { return JSON.parse(localStorage.getItem(RESULT_KEY) || '[]').map(normalizeStoredResult); } catch (error) { return []; }
};
const persistResult = (result) => {
  const record = {
    ...result,
    id: `${result.assessmentId}_${Date.now()}`,
    completedAt: new Date().toISOString()
  };
  state.results = [record, ...state.results.filter((item) => item.assessmentId !== record.assessmentId)].slice(0, 20);
  state.coupleCode = '';
  state.coupleReport = null;
  state.coupleInviteSent = false;
  localStorage.setItem(RESULT_KEY, JSON.stringify(state.results));
  return record;
};

const asset = (path) => {
  if (!path) return '';
  if (path.startsWith('/result-package/')) return `/miniprogram${path}`;
  return path.replace('/assets/', '/miniprogram/assets/');
};
const clampPercent = (value) => Math.max(4, Math.min(96, Math.round(Number(value) || 0)));
const findVisualSection = (sections, patterns) => sections.find((section) => patterns.some((pattern) => pattern.test(section.title))) || null;
const illustratedAnalysis = (result, visual) => {
  if (!visual?.analysisProfile) return [];
  const normalize = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => item?.body)
    .map((item) => ({ title: String(item.title || ''), body: String(item.body || '').trim() }));
  const insights = normalize(result.insights);
  const sections = normalize(result.sections);
  const deepSections = normalize(result.deepDive?.sections);
  const profile = visual.analysisProfile;
  const labels = visual.analysisLabels || {};
  const core = String(result.deepDive?.body || '').trim()
    || findVisualSection(deepSections, [/一起工作/, /顺起来/])?.body
    || findVisualSection(sections, [/自然的样子/, /两个细节/, /思考顺序/])?.body
    || findVisualSection(insights, [/不是社牛/, /场合雷达/, /进入人群/])?.body
    || profile.driver;
  const tension = findVisualSection(sections, [/容易卡住/, /生活节奏/, /情绪被看见/])?.body;
  const stress = findVisualSection(insights, [/压力/, /反过来/, /自动角色/])?.body
    || findVisualSection(deepSections, [/压力/])?.body;
  const misread = findVisualSection(insights, [/误会/, /误读/])?.body
    || findVisualSection(sections, [/关系里的你/])?.body;
  const recovery = findVisualSection(insights, [/调整/, /恢复/, /散场/])?.body
    || findVisualSection(deepSections, [/平衡/, /恢复/])?.body;
  const conflict = tension && !profile.conflict.includes(tension) && !tension.includes(profile.conflict)
    ? `${profile.conflict} ${tension}`
    : profile.conflict;
  const labelFor = (key, index, fallback) => Array.isArray(labels)
    ? (labels[index] || fallback)
    : (labels[key] || fallback);
  return [
    { key: 'driver', index: '01', title: labelFor('driver', 0, '核心驱动力'), body: core || profile.driver },
    { key: 'conflict', index: '02', title: labelFor('conflict', 1, '内在矛盾'), body: conflict },
    { key: 'stress', index: '03', title: labelFor('stress', 2, '压力反转'), body: stress || profile.stress },
    { key: 'misread', index: '04', title: labelFor('misread', 3, '关系误读'), body: misread || profile.misread },
    { key: 'understood', index: '05', title: labelFor('understood', 4, '被理解方式'), body: profile.understood },
    { key: 'recovery', index: '06', title: labelFor('recovery', 5, '恢复建议'), body: recovery || profile.recovery }
  ];
};
const visualTendencyPercent = (result, axis, tendencyScale = 50) => {
  const scores = result?.scores || {};
  if (axis.scale === 'derived-security') {
    return clampPercent(100 - (((Number(scores.anxiety) || 0) + (Number(scores.avoidance) || 0)) / 2));
  }
  if (axis.scale === 'percent') {
    const value = Number(scores[axis.key]) || 0;
    return clampPercent(axis.direction === -1 ? 100 - value : value);
  }
  if (axis.scale === 'likert') {
    const value = Number(scores[axis.key]) || 0;
    const percent = ((value - 1) / 4) * 100;
    return clampPercent(axis.direction === -1 ? 100 - percent : percent);
  }
  return clampPercent(50 + (Number(scores[axis.key]) || 0) * tendencyScale * (axis.direction || 1));
};
const resultVisual = (result) => {
  const visualCode = result?.visualCode || result?.typeCode;
  const visual = state.catalog?.resultVisuals?.[result?.assessmentId]?.[visualCode] || null;
  if (!visual) return null;
  const analysis = illustratedAnalysis(result, visual);
  const analysisHeadingLines = Array.isArray(visual.analysisHeadingLines) && visual.analysisHeadingLines.length
    ? visual.analysisHeadingLines
    : [visual.analysisHeadingLine1, visual.analysisHeadingLine2].filter(Boolean);
  const normalizedVisual = { ...visual, analysis, analysisHeadingLines };
  if (!Array.isArray(visual.tendencyAxes)) return analysis.length ? normalizedVisual : visual;
  return {
    ...normalizedVisual,
    tendencies: visual.tendencyAxes.map((axis) => ({
      label: axis.label,
      percent: visualTendencyPercent(result, axis, visual.tendencyScale || 50),
      tone: axis.tone
    }))
  };
};
const puzzlePieces = [
  { id: 'relationship', name: '恋爱模式', image: '/assets/doodle-relationship.png', color: '#f47716', background: '#fff9f2' },
  { id: 'attachment', name: '依恋模式', image: '/assets/doodle-attachment.png', color: '#b69aef', background: '#fbf7ff' },
  { id: 'bigfive', name: '人格底色', image: '/assets/doodle-bigfive.png', color: '#3f9a5f', background: '#f7fbf4' },
  { id: 'cognitive', name: '思考模式', image: '/assets/doodle-cognitive.png', color: '#f7bf2d', background: '#fffbec' },
  { id: 'social', name: '社交模式', image: '/assets/doodle-social.png', color: '#3f7ee8', background: '#f5f8ff' }
];
const pieceFor = (id) => puzzlePieces.find((piece) => piece.id === id) || puzzlePieces[0];
const resultKeyword = (result) => {
  if (!result) return '';
  if (result.assessmentId === 'cognitive' && result.typeName) return result.typeName;
  const title = String(result.title || '新的一面');
  return title.includes('·') ? title.split('·').pop().trim() : title;
};
const firstSentence = (text, limit = 62) => {
  const source = String(text || '').trim();
  if (!source) return '';
  const sentence = source.split(/[。！？]/)[0];
  return `${sentence.length > limit ? `${sentence.slice(0, limit)}…` : sentence}。`;
};
const latestFor = (id) => state.results.find((result) => result.assessmentId === id);
const metricLabels = { anxiety: '回应敏感', avoidance: '独立倾向', security: '连接安全', energy: '连接活力', empathy: '共情合作', order: '自律秩序', sensitivity: '情绪敏感', openness: '开放想象', commitment: '共同投入', appreciation: '被看见感', response: '情绪回应', SA: '主动连接', PF: '计划倾向', SH: '表达需要' };
const resultMetrics = (result) => {
  const clamp = (value) => Math.max(4, Math.min(96, Math.round(Number(value) || 0)));
  if (result.assessmentId === 'cognitive') {
    const code = String(result.typeCode || 'XXXX');
    return [
      ['EI', code[0] === 'X' ? '连接节奏' : code[0] === 'E' ? '向外连接' : '独处充电', code[0] === 'I' ? -1 : 1],
      ['NS', code[1] === 'X' ? '信息偏好' : code[1] === 'N' ? '抽象联想' : '具体感知', code[1] === 'S' ? -1 : 1],
      ['TF', code[2] === 'X' ? '判断依据' : code[2] === 'T' ? '逻辑判断' : '价值感受', code[2] === 'F' ? -1 : 1]
    ].map(([key, label, direction]) => ({ label, percent: clamp(50 + (Number(result.scores?.[key]) || 0) * 50 * direction) }));
  }
  if (result.assessmentId === 'attachment') {
    const anxiety = Number(result.scores?.anxiety) || 0;
    const avoidance = Number(result.scores?.avoidance) || 0;
    const anxietyPercent = anxiety;
    const avoidancePercent = avoidance;
    return [
      { label: metricLabels.anxiety, percent: clamp(anxietyPercent) },
      { label: metricLabels.avoidance, percent: clamp(avoidancePercent) },
      { label: metricLabels.security, percent: clamp(100 - ((anxietyPercent + avoidancePercent) / 2)) }
    ];
  }
  const scoreEntries = Object.entries(result.scores || {});
  const entries = Array.isArray(result.metricKeys) && result.metricKeys.length
    ? result.metricKeys.map((key) => [key, result.scores?.[key]]).filter(([, value]) => value !== undefined)
    : scoreEntries;
  return entries.slice(0, 3).map(([key, raw]) => {
    let percent = Number(raw) || 0;
    if (['bigfive', 'relationship'].includes(result.assessmentId)) percent = ((percent - 1) / 4) * 100;
    if (result.assessmentId === 'social') percent = 50 + percent * 6.25;
    return { label: metricLabels[key] || key, percent: clamp(percent) };
  });
};
const resultHighlights = (result, limit = 240) => {
  const source = Array.isArray(result?.insights) && result.insights.length ? result.insights : (Array.isArray(result?.sections) ? result.sections : []);
  return source
  .filter((section) => section?.title && section?.body)
  .slice(0, 5)
  .map((section) => ({
    title: String(section.title).trim(),
    body: String(section.body).trim().length > limit ? `${String(section.body).trim().slice(0, limit)}…` : String(section.body).trim()
  }));
};
const resultStoryConfig = {
  relationship: {
    eyebrow: '关系不是一张成绩单', heading: '这段关系里，正在发生什么', metricsTitle: '这段关系最关键的三个信号',
    blocks: [['支点', '你们还拥有的底气', 'support'], ['循环', '最容易反复的相处模式', 'cycle'], ['你的感受', '你可能已经做了很多', 'effort'], ['下一步', '接下来要看行动', 'action']]
  },
  attachment: {
    eyebrow: '靠近与退后，都是为了保护连接', heading: '你怎样靠近，也怎样保护自己', metricsTitle: '你的亲密距离',
    blocks: [['触发', '一个很像你的时刻', 'scene'], ['保护', '你会自动进入的循环', 'protect'], ['误读', '别人看到的你', 'misread'], ['需要', '真正能让你安心的信号', 'need']]
  },
  bigfive: {
    eyebrow: '人格不是类型，而是五种倾向的组合', heading: '你的底色，藏在这些反差里', metricsTitle: '最突出的三条性格线索',
    blocks: [['外在', '别人先看到的你', 'outside'], ['内在', '熟悉以后才会看见', 'inside'], ['压力', '被放大的那一面', 'stress'], ['理解', '不必把优势改掉', 'growth']]
  },
  cognitive: {
    eyebrow: '不是四个字母，是你的思考顺序', heading: '你的大脑，通常这样工作', metricsTitle: '你处理信息的三个偏好',
    blocks: [['01', '心里真正发生的', 'process'], ['02', '压力下的思维反转', 'process'], ['03', '关系里容易被误会的地方', 'process'], ['04', '让思考恢复流动', 'process']]
  },
  social: {
    eyebrow: '不是社牛或社恐那么简单', heading: '你在人群里的样子，会随场景改变', metricsTitle: '你的社交启动方式',
    blocks: [['现场', '一个很像你的瞬间', 'scene'], ['角色', '你在人群里的自动位置', 'role'], ['反差', '别人容易误会的地方', 'misread'], ['散场后', '你真正需要的恢复方式', 'recovery']]
  }
};
const resultStory = (result) => {
  const config = resultStoryConfig[result.assessmentId] || { eyebrow: '一份关于你的当前观察', heading: '为什么这很像你', metricsTitle: '三个关键线索', blocks: [] };
  const source = resultHighlights(result, 1000);
  const lead = source[0]?.body || String(result.summary || result.shareLine || '这是一块关于你的当前观察。').trim();
  const candidates = source.slice(1);
  return {
    ...config,
    id: result.assessmentId,
    lead,
    dimensions: result.assessmentId === 'bigfive' ? Object.entries(result.scores || {}).slice(0, 5).map(([key, raw]) => ({
      key, label: metricLabels[key] || key, percent: Math.max(4, Math.min(96, Math.round(((Number(raw) - 1) / 4) * 100)))
    })) : [],
    blocks: config.blocks.map((definition, index) => ({
      marker: definition[0],
      title: candidates[index]?.title || source[index]?.title || definition[1],
      body: candidates[index]?.body || source[index]?.body || lead,
      kind: definition[2]
    }))
  };
};
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const api = async (url, body) => {
  const response = await fetch(url, body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
};

const refreshStoredResults = async () => {
  let changed = false;
  const refresh = async (result, cognitiveBaseline) => {
    const assessment = state.catalog?.assessments?.[result.assessmentId];
    if (!assessment || !Array.isArray(result.answers) || result.answers.length !== assessment.questions.length) return result;
    if (result.version === assessment.version && Array.isArray(result.insights)) return result;
    try {
      const questionIds = Array.isArray(result.questionIds) && result.questionIds.length === result.answers.length
        ? result.questionIds
        : assessment.questions.map((question) => question.id);
      const data = await api('/api/score', {
        id: result.assessmentId,
        answers: result.answers,
        questionIds,
        cognitiveBaseline: result.assessmentId === 'cognitive' ? null : cognitiveBaseline
      });
      changed = true;
      return { ...result, ...data.result, id: result.id, completedAt: result.completedAt, answers: result.answers.slice(), questionIds };
    } catch (error) {
      return result;
    }
  };
  const cognitiveResults = [];
  for (const result of state.results) {
    cognitiveResults.push(result.assessmentId === 'cognitive' ? await refresh(result, null) : result);
  }
  const cognitiveBaseline = cognitiveResults.find((result) => result.assessmentId === 'cognitive') || null;
  const upgraded = [];
  for (const result of cognitiveResults) {
    upgraded.push(result.assessmentId === 'cognitive' ? result : await refresh(result, cognitiveBaseline));
  }
  state.results = upgraded;
  if (changed) localStorage.setItem(RESULT_KEY, JSON.stringify(state.results));
};

const drawPosterText = (context, text, x, y, maxWidth, lineHeight, maxLines) => {
  const chars = String(text || '').split('');
  let line = '';
  let lines = 0;
  let cursorY = y;
  chars.forEach((char) => {
    if (lines >= maxLines) return;
    const test = line + char;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
      lines += 1;
    } else {
      line = test;
    }
  });
  if (line && lines < maxLines) context.fillText(line, x, cursorY);
  return cursorY + lineHeight;
};

const loadPosterImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = asset(src);
});

const drawPosterRoundRect = (context, x, y, width, height, radius, fill) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
};

const drawPosterImageContain = (context, image, x, y, width, height) => {
  if (!image) return;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + ((width - drawWidth) / 2), y + ((height - drawHeight) / 2), drawWidth, drawHeight);
};

const createIllustratedPoster = async (result, visual) => {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1334;
  const context = canvas.getContext('2d');
  const heroImage = await loadPosterImage(visual.hero);
  const title = visual.title || resultKeyword(result) || '新的一面';
  const quote = String(visual.quote || result.summary || result.shareLine || '').trim();
  const toneColors = { red: '#c95746', yellow: '#a87908', green: '#42775d', purple: '#705c83', blue: '#4f78a8' };
  const compactWideHero = result.assessmentId === 'bigfive';
  const posterLayout = compactWideHero ? {
    heroY: 82,
    heroHeight: 430,
    quoteY: 520,
    traitsY: 706,
    titleY: 1050,
    subtitleY: 1090,
    dividerY: 1195,
    footerY: 1240
  } : {
    heroY: 76,
    heroHeight: 630,
    quoteY: 720,
    traitsY: 906,
    titleY: 1210,
    subtitleY: 1248,
    dividerY: 1276,
    footerY: 1310
  };

  context.fillStyle = '#fff8e8';
  context.fillRect(0, 0, 750, 1334);
  context.fillStyle = 'rgba(240, 73, 50, .05)';
  context.beginPath();
  context.arc(652, 88, 170, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(247, 196, 35, .08)';
  context.beginPath();
  context.arc(70, 560, 220, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#776f62';
  context.font = '700 21px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(`PERSONALITY PUZZLE · ${result.typeCode || result.assessmentId.toUpperCase()}`, 42, 48);
  context.fillStyle = '#e94b35';
  context.fillRect(42, 62, 56, 6);

  drawPosterImageContain(context, heroImage, 30, posterLayout.heroY, 690, posterLayout.heroHeight);

  drawPosterRoundRect(context, 42, posterLayout.quoteY, 666, 164, 30, 'rgba(255, 253, 248, .96)');
  context.fillStyle = '#ef4934';
  context.font = '700 58px Georgia, serif';
  context.fillText('“', 72, posterLayout.quoteY + 58);
  context.fillStyle = '#2f2b25';
  context.font = '600 27px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  drawPosterText(context, quote, 122, posterLayout.quoteY + 54, 530, 43, 3);

  const traits = Array.isArray(visual.traits) ? visual.traits.slice(0, 4) : [];
  traits.forEach((trait, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 42 + (column * 339);
    const y = posterLayout.traitsY + (row * 126);
    drawPosterRoundRect(context, x, y, 327, 108, 24, '#fffdf8');
    context.fillStyle = toneColors[trait.tone] || '#685f54';
    context.fillRect(x, y, 7, 108);
    context.font = '700 24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(String(trait.label || ''), x + 25, y + 39);
    context.fillStyle = '#615a50';
    context.font = '19px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    drawPosterText(context, trait.detail, x + 25, y + 72, 276, 28, 2);
  });

  context.fillStyle = '#26231f';
  context.font = '700 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(`我是「${title}」`, 42, posterLayout.titleY);
  context.fillStyle = '#777063';
  context.font = '21px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('人格不是标签，是一张继续认识自己的地图。', 42, posterLayout.subtitleY);
  drawPosterRoundRect(context, 42, posterLayout.dividerY, 666, 2, 1, 'rgba(74, 65, 53, .16)');
  context.fillStyle = '#e94b35';
  context.font = '700 19px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('人格拼图', 42, posterLayout.footerY);
  context.fillStyle = '#777063';
  context.font = '18px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('分享给朋友，看看你会拼出什么', 468, posterLayout.footerY);
  return canvas.toDataURL('image/png');
};

const createIllustratedFullReport = async (result, visual) => {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 4200;
  const context = canvas.getContext('2d');
  const collection = resultCollection();
  const images = await Promise.all([visual.hero, ...collection.map((item) => item.image), visual.aiIcon].map(loadPosterImage));
  const [heroImage, ...restImages] = images;
  const aiImage = restImages.pop();
  const puzzleImages = restImages;
  const toneColors = { red: '#c95746', yellow: '#a87908', green: '#42775d', purple: '#705c83', blue: '#4f78a8' };
  const completed = collection.filter((item) => item.result).length;

  context.fillStyle = '#fff8e8';
  context.fillRect(0, 0, 750, 4200);
  context.fillStyle = 'rgba(240,73,50,.045)';
  context.beginPath();
  context.arc(640, 130, 210, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(247,196,35,.07)';
  context.beginPath();
  context.arc(70, 670, 250, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#776f62';
  context.font = '700 21px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(`${result.assessmentId === 'social' ? 'FULL SOCIAL MODE REPORT' : 'FULL PERSONALITY REPORT'} · ${result.typeCode || result.assessmentId.toUpperCase()}`, 42, 48);
  context.fillStyle = '#e94b35';
  context.fillRect(42, 62, 72, 6);
  drawPosterImageContain(context, heroImage, 30, 78, 690, 570);

  drawPosterRoundRect(context, 42, 668, 666, 166, 30, 'rgba(255,253,248,.96)');
  context.fillStyle = '#ef4934';
  context.font = '700 58px Georgia, serif';
  context.fillText('“', 72, 728);
  context.fillStyle = '#2f2b25';
  context.font = '600 27px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  drawPosterText(context, visual.quote || result.summary || result.shareLine, 122, 724, 530, 43, 3);

  (visual.traits || []).slice(0, 4).forEach((trait, index) => {
    const x = 42 + ((index % 2) * 339);
    const y = 858 + (Math.floor(index / 2) * 126);
    drawPosterRoundRect(context, x, y, 327, 108, 24, '#fffdf8');
    context.fillStyle = toneColors[trait.tone] || '#685f54';
    context.fillRect(x, y, 7, 108);
    context.font = '700 24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(String(trait.label || ''), x + 25, y + 39);
    context.fillStyle = '#615a50';
    context.font = '19px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    drawPosterText(context, trait.detail, x + 25, y + 72, 276, 28, 2);
  });

  drawPosterRoundRect(context, 42, 1122, 666, 350, 30, '#fffdf8');
  context.fillStyle = '#27231f';
  context.font = '700 30px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(visual.tendencyTitle || '人格维度', 72, 1172);
  (visual.tendencies || []).slice(0, 5).forEach((item, index) => {
    const y = 1220 + (index * 58);
    context.fillStyle = '#595248';
    context.font = '20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(String(item.label || ''), 72, y + 17);
    drawPosterRoundRect(context, 226, y, 360, 16, 8, '#ece7dc');
    drawPosterRoundRect(context, 226, y, 360 * (Number(item.percent) / 100), 16, 8, toneColors[item.tone] || '#685f54');
    context.fillStyle = '#27231f';
    context.font = '700 20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(`${item.percent}%`, 614, y + 17);
  });

  drawPosterRoundRect(context, 42, 1500, 666, 154, 30, '#f7ded1');
  context.fillStyle = '#e84b35';
  context.font = '800 17px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(visual.analysisEyebrow || `TYPE NOTES · ${result.typeCode || ''}`, 72, 1543);
  context.fillStyle = '#3d3028';
  context.font = '800 34px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  const analysisHeadingLines = Array.isArray(visual.analysisHeadingLines) && visual.analysisHeadingLines.length
    ? visual.analysisHeadingLines
    : ['不止四个字母，', '这是你的内在运作方式'];
  analysisHeadingLines.slice(0, 2).forEach((line, index) => context.fillText(line, 72, 1590 + (index * 40)));
  (visual.analysis || []).slice(0, 6).forEach((item, index) => {
    const y = 1678 + (index * 232);
    drawPosterRoundRect(context, 42, y, 666, 212, 25, '#fffdf8');
    context.strokeStyle = index === 5 ? '#31805e' : '#e84b35';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(83, y + 44, 25, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = index === 5 ? '#31805e' : '#e84b35';
    context.font = '800 17px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(item.index, 71, y + 50);
    context.fillStyle = '#28241f';
    context.font = '700 27px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(String(item.title || ''), 126, y + 49);
    context.fillStyle = '#5a5349';
    context.font = '20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    drawPosterText(context, item.body, 126, y + 87, 530, 30, 5);
  });

  drawPosterRoundRect(context, 42, 3090, 666, 236, 30, '#fffdf8');
  context.fillStyle = '#28241f';
  context.font = '700 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('✱ 你的人格拼图进度', 72, 3140);
  context.fillStyle = '#82796d';
  context.font = '19px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(`已完成 ${completed} / 5`, 572, 3140);
  collection.forEach((item, index) => {
    const x = 54 + (index * 132);
    drawPosterImageContain(context, puzzleImages[index], x, 3160, 100, 94);
    context.fillStyle = '#37322c';
    context.font = '700 16px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(item.name, x + 50, 3269);
    context.fillStyle = item.result ? '#e84b35' : '#a39b90';
    context.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(item.result ? '已完成' : '待解锁', x + 50, 3295);
  });
  context.textAlign = 'left';

  drawPosterRoundRect(context, 42, 3354, 666, 166, 30, '#fffdf8');
  context.fillStyle = '#28241f';
  context.font = '700 27px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('朋友眼中的你', 72, 3402);
  let chipX = 72;
  let chipY = 3430;
  (visual.friendTags || []).slice(0, 5).forEach((tag, index) => {
    context.font = '18px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    const width = Math.ceil(context.measureText(tag).width) + 34;
    if (chipX + width > 674) { chipX = 72; chipY += 48; }
    drawPosterRoundRect(context, chipX, chipY, width, 36, 18, ['#fff0e9', '#fff7dc', '#eaf5e9', '#f1eafa', '#fbe8e8'][index] || '#f5f0e8');
    context.fillStyle = ['#c95746', '#996b00', '#42775d', '#705c83', '#b65d65'][index] || '#655e54';
    context.fillText(tag, chipX + 17, chipY + 25);
    chipX += width + 10;
  });

  drawPosterRoundRect(context, 42, 3548, 666, 330, 30, '#fffdf8');
  drawPosterImageContain(context, aiImage, 68, 3582, 120, 88);
  context.fillStyle = '#244937';
  context.font = '700 27px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('AI 看到的你', 72, 3698);
  (visual.notes || []).slice(0, 3).forEach((note, index) => {
    const y = 3598 + (index * 86);
    context.fillStyle = '#31805e';
    context.beginPath();
    context.arc(226, y + 7, 4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#484239';
    context.font = '20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    drawPosterText(context, note, 244, y + 14, 420, 31, 2);
  });

  context.fillStyle = '#28241f';
  context.font = '700 31px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(`我是「${visual.title || resultKeyword(result)}」`, 42, 3980);
  context.fillStyle = '#777063';
  context.font = '21px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('人格不是标签，是一张继续认识自己的地图。', 42, 4020);
  context.fillStyle = 'rgba(74,65,53,.16)';
  context.fillRect(42, 4056, 666, 2);
  context.fillStyle = '#e94b35';
  context.font = '700 20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('人格拼图 · 完整报告', 42, 4100);
  context.fillStyle = '#777063';
  context.font = '18px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('分享给朋友，看看你会拼出什么', 468, 4100);
  return canvas.toDataURL('image/png');
};

const createResultPoster = async (result) => {
  const visual = resultVisual(result);
  if (visual) return createIllustratedPoster(result, visual);
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1334;
  const context = canvas.getContext('2d');
  const piece = pieceFor(result.assessmentId);
  const collection = resultCollection();
  const pieceNumber = puzzlePieces.findIndex((item) => item.id === result.assessmentId) + 1;
  const title = resultKeyword(result) || '新的一面';
  const resonanceSource = String(result.summary || result.shareLine || '').trim();
  const resonance = resonanceSource
    ? (resonanceSource.length > 118 ? `${resonanceSource.slice(0, 118)}…` : resonanceSource)
    : '这是一块关于你的当前观察。';
  const [heroImage, ...puzzleImages] = await Promise.all([piece, ...collection].map((item) => loadPosterImage(item.image)));

  context.fillStyle = '#eee2f4';
  context.fillRect(0, 0, 750, 1334);
  context.fillStyle = '#fffefa';
  context.fillRect(48, 150, 654, 870);
  context.fillStyle = '#77736c';
  context.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText(`PIECE ${String(pieceNumber).padStart(2, '0')}`, 88, 210);
  if (heroImage) context.drawImage(heroImage, 405, 108, 280, 280);
  context.fillStyle = '#11110f';
  context.font = '700 52px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  drawPosterText(context, title, 88, 365, 520, 66, 2);
  context.fillStyle = '#37342f';
  context.font = '29px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  drawPosterText(context, resonance, 88, 500, 540, 48, 4);
  puzzleImages.forEach((image, index) => {
    if (!image) return;
    context.globalAlpha = collection[index].result ? 1 : 0.13;
    context.drawImage(image, 88 + (index * 76), 820, 64, 64);
  });
  context.globalAlpha = 1;
  context.fillStyle = '#11110f';
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('你会拼出什么？', 72, 1110);
  context.fillStyle = '#77736c';
  context.font = '24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText('来试试吧。', 72, 1155);
  return canvas.toDataURL('image/png');
};

const setRoute = (view, id = '', extra = {}) => {
  const query = new URLSearchParams({ view });
  if (id) query.set('id', id);
  Object.entries(extra).forEach(([key, value]) => { if (value) query.set(key, value); });
  history.replaceState(null, '', `?${query}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
};

const backButton = () => '<button class="back-button" type="button" data-action="home" aria-label="返回首页">‹</button>';

const bind = (selector, handler) => {
  app.querySelectorAll(selector).forEach((element) => element.addEventListener('click', handler));
};

const renderHome = () => {
  window.clearTimeout(state.advanceTimer);
  window.clearTimeout(state.revealTimer);
  state.transitioning = false;
  setRoute('home');
  const pieces = puzzlePieces.map((piece, index) => {
    const result = latestFor(piece.id);
    return `<button class="doodle-piece doodle-piece-${index} ${result ? 'done' : 'pending'}" type="button" data-id="${piece.id}">
      <img src="${asset(piece.image)}" alt="" />
      <span><strong>${piece.name}</strong><small>${result ? escapeHtml(resultKeyword(result)) : '点击开始'}</small></span>
    </button>`;
  }).join('');
  const completed = puzzlePieces.filter((piece) => latestFor(piece.id)).length;
  const target = puzzlePieces.find((piece) => !latestFor(piece.id)) || null;
  const assessment = target ? state.catalog.assessments[target.id] : null;

  app.className = 'screen doodle-home';
  app.style.background = '';
  app.innerHTML = `<header><strong>我的拼图</strong><h1>你，由很多面组成。</h1></header>
    <section class="doodle-cluster" aria-label="我的性格拼图">${pieces}</section>
    <p class="doodle-progress">已拼出 <b>${completed}</b> / 5 块</p>
    ${target ? `<h2>继续探索</h2><button class="doodle-recommend" type="button" data-recommend="${target.id}"><span><strong>${escapeHtml(assessment.intro.split('。')[0])}？</strong><small>${escapeHtml(assessment.duration)}</small></span><b>→</b></button>` : '<p class="puzzle-complete">五块拼图已经完整，随时可以点开回看。</p>'}`;
  bind('.doodle-piece', (event) => openEntry(event.currentTarget.dataset.id));
  bind('[data-recommend]', (event) => startAssessment(event.currentTarget.dataset.recommend));
};

const openEntry = (id) => {
  const stored = latestFor(id);
  if (stored) {
    state.result = stored;
    renderResult('core');
    return;
  }
  startAssessment(id);
};

const startAssessment = (id, options = {}) => {
  state.assessment = state.catalog.assessments[id];
  if (!state.assessment) return renderHome();
  state.returnToCouple = Boolean(options.returnToCouple);
  state.questions = state.assessment.questions.slice();
  state.answers = [];
  state.current = 0;
  state.result = null;
  state.transitioning = false;
  renderQuiz();
};

const renderIntro = () => {
  const assessment = state.assessment;
  const name = new URLSearchParams(location.search).get('name') || '新的一面';
  setRoute('intro', assessment.id, { name });
  const piece = pieceFor(assessment.id);
  app.className = 'screen doodle-friend';
  app.style.background = '';
  app.innerHTML = `<img class="friend-shape top" src="${asset(piece.image)}" alt="" /><img class="friend-shape bottom" src="${asset(piece.image)}" alt="" />
    <section><h1>TA 拼出了<br>「${escapeHtml(name)}」</h1><h2>那你呢？</h2><p>${escapeHtml(assessment.duration)}</p></section>
    <div class="friend-web-actions"><button class="doodle-black-button" type="button" data-action="start">我也测测</button><button class="friend-later" type="button" data-action="home">先看看我的拼图</button></div>`;
  bind('[data-action="home"]', renderHome);
  bind('[data-action="start"]', () => startAssessment(assessment.id));
};

const renderQuiz = () => {
  const assessment = state.assessment;
  const question = state.questions[state.current];
  const selected = Number(state.answers[state.current]) || 0;
  const progress = Math.round(((state.current + 1) / state.questions.length) * 100);
  const piece = pieceFor(assessment.id);
  const optionValues = assessment.options.length === 5 && !['attachment', 'relationship'].includes(assessment.id)
    ? [1, 2, 4, 5]
    : assessment.options.map((_, index) => index + 1);
  setRoute('quiz', assessment.id);
  app.className = 'screen quiz-screen';
  app.style.background = piece.background;
  app.innerHTML = `<div class="quiz-topbar"><button class="quiz-back" type="button" data-action="previous">${state.current > 0 ? '上一题' : '退出'}</button><div class="quiz-progress"><i style="width:${progress}%;background:${piece.color}"></i></div><span>${String(state.current + 1).padStart(2, '0')} / ${state.questions.length}</span></div>
    <div class="quiz-shape-stage phase-${Math.min(3, Math.floor(progress / 26))}"><img src="${asset(piece.image)}" alt="" /></div>
    <h1 class="question">${escapeHtml(question.text)}</h1>
    <div class="options">${optionValues.map((value) => `<button class="option ${selected === value ? 'selected' : ''}" style="${selected === value ? `border-color:${piece.color}` : ''}" type="button" data-value="${value}" ${state.transitioning ? 'disabled' : ''}>${escapeHtml(assessment.options[value - 1])}</button>`).join('')}</div>`;
  bind('.option', (event) => {
    if (state.transitioning) return;
    state.transitioning = true;
    state.answers[state.current] = Number(event.currentTarget.dataset.value);
    renderQuiz();
    const expected = state.current;
    state.advanceTimer = window.setTimeout(() => {
      if (state.current !== expected) return;
      advanceQuestion();
    }, 220);
  });
  bind('[data-action="previous"]', previousQuestion);
};

const previousQuestion = () => {
  window.clearTimeout(state.advanceTimer);
  state.transitioning = false;
  if (state.current === 0) return state.returnToCouple ? renderCouple() : renderHome();
  state.current -= 1;
  renderQuiz();
};

const advanceQuestion = async () => {
  if (!state.answers[state.current]) return;
  if (state.current < state.questions.length - 1) {
    state.current += 1;
    state.transitioning = false;
    renderQuiz();
    return;
  }
  try {
    if (state.assessment.id === 'cognitive') {
      const followupData = await api('/api/followups', { id: state.assessment.id, answers: state.answers });
      const existingIds = new Set(state.questions.map((question) => question.id));
      const pendingFollowups = (followupData.questions || []).filter((question) => !existingIds.has(question.id));
      if (pendingFollowups.length) {
        state.questions = state.questions.concat(pendingFollowups);
        state.answers = state.answers.concat(Array(pendingFollowups.length).fill(0));
        state.current += 1;
        state.transitioning = false;
        renderQuiz();
        return;
      }
    }
    const data = await api('/api/score', {
      id: state.assessment.id,
      answers: state.answers,
      questionIds: state.questions.map((question) => question.id),
      cognitiveBaseline: state.assessment.id === 'cognitive' ? null : state.results.find((result) => result.assessmentId === 'cognitive') || null
    });
    state.result = persistResult({ ...data.result, answers: state.answers.slice(), questionIds: state.questions.map((question) => question.id) });
    state.transitioning = false;
    renderResult('reveal');
  } catch (error) {
    state.transitioning = false;
    window.alert(error.message);
    renderQuiz();
  }
};

const resultCollection = () => puzzlePieces.map((piece) => ({ ...piece, result: latestFor(piece.id) }));

const renderResult = (stage = 'core') => {
  const result = state.result;
  if (!result) return renderHome();
  const previewType = new URLSearchParams(location.search).get('preview');
  setRoute('result', result.id || result.assessmentId, previewType ? { preview: previewType } : {});
  const piece = pieceFor(result.assessmentId);
  const visual = resultVisual(result);
  const title = visual?.title || resultKeyword(result) || '新的一面';
  const resonanceSource = String(result.summary || result.shareLine || '').trim();
  const resonance = resonanceSource
    ? (resonanceSource.length > 118 ? `${resonanceSource.slice(0, 118)}…` : resonanceSource)
    : '这是一块关于你的当前观察。';
  const collection = resultCollection();
  const completed = collection.filter((item) => item.result).length;
  const next = collection.find((item) => !item.result) || null;
  const cognitiveReady = state.results.some((item) => item.assessmentId === 'cognitive' && item.typeCode !== 'XXXX' && item.version === state.catalog.assessments.cognitive.version);
  const attachmentReady = state.results.some((item) => item.assessmentId === 'attachment' && item.version === state.catalog.assessments.attachment.version);
  const coupleNext = !cognitiveReady ? 'cognitive' : !attachmentReady ? 'attachment' : null;
  const nextText = state.returnToCouple
    ? (coupleNext ? `继续完成${pieceFor(coupleNext).name}` : '生成两个人的相处地图')
    : (next ? '继续拼下一块' : '回到我的拼图');
  const pieceNumber = puzzlePieces.findIndex((item) => item.id === result.assessmentId) + 1;
  app.style.background = '';

  if (stage === 'reveal') {
    app.className = 'screen reveal-screen';
    app.innerHTML = `<h1>拼图 +1</h1><img class="reveal-shape" src="${asset(piece.image)}" alt="" /><p class="reveal-piece-name">${piece.name}</p><h2>${escapeHtml(title)}</h2><p class="reveal-note">越来越了解自己了！</p><button class="doodle-black-button" type="button" data-action="core">看看这一块</button>`;
    bind('[data-action="core"]', () => renderResult('core'));
    state.revealTimer = window.setTimeout(() => renderResult('core'), 1800);
    return;
  }

  const metrics = resultMetrics(result);
  const story = resultStory(result);
  if (visual) {
    app.className = `screen illustrated-result-screen result-kind-${result.assessmentId} result-type-${String(result.typeCode || '').toLowerCase()} result-visual-${String(result.visualCode || '').toLowerCase()}`;
    app.innerHTML = `<p class="poster-kicker ${visual.heroIncludesKicker ? 'poster-kicker-hidden' : ''}">${escapeHtml(visual.kicker)}</p>
      <img class="poster-hero" src="${asset(visual.hero)}" alt="${escapeHtml(visual.title)} 主视觉" />
      ${result.assessmentId === 'attachment' && result.profileTitle ? `<div class="poster-profile"><span>当前画像</span><b>${escapeHtml(result.profileTitle)}</b></div>` : ''}
      <section class="poster-quote"><b>“</b><p>${escapeHtml(visual.quote)}</p></section>
      <section class="poster-traits">${visual.traits.map((item) => `<article class="poster-trait poster-tone-${escapeHtml(item.tone)}"><h2>${escapeHtml(item.label)}</h2><p>${escapeHtml(item.detail)}</p></article>`).join('')}</section>
      <section class="poster-tendencies"><h2>${escapeHtml(visual.tendencyTitle || '关系倾向')}</h2><div>${visual.tendencies.map((item) => `<article class="poster-tendency"><span>${escapeHtml(item.label)}</span><i><em class="poster-fill-${escapeHtml(item.tone)}" style="width:${item.percent}%"></em></i><b>${item.percent}%</b></article>`).join('')}</div></section>
      ${visual.analysis?.length ? `<section class="poster-analysis"><div class="poster-analysis-head"><p>${escapeHtml(visual.analysisEyebrow || `TYPE NOTES · ${result.typeCode || ''}`)}</p><h2>${(visual.analysisHeadingLines?.length ? visual.analysisHeadingLines : ['不止四个字母，', '这是你的内在运作方式']).map((line) => escapeHtml(line)).join('<br>')}</h2></div><div class="poster-analysis-list">${visual.analysis.map((item) => `<article class="poster-analysis-card poster-analysis-${escapeHtml(item.key)}"><span>${escapeHtml(item.index)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div></article>`).join('')}</div></section>` : ''}
      <section class="illustrated-puzzle-panel"><div class="illustrated-panel-head"><h2>✱ 你的人格拼图进度</h2><span>已完成 ${completed} / 5</span></div><div class="illustrated-puzzle-list">${collection.map((item) => `<article><img class="${item.result ? 'done' : 'pending'}" src="${asset(item.image)}" alt="${escapeHtml(item.name)}" /><b>${escapeHtml(item.name)}</b><small>${item.result ? escapeHtml(resultKeyword(item.result) || '已完成') : '待解锁'}</small></article>`).join('')}</div></section>
      <section class="poster-friend-tags"><h2>朋友眼中的你</h2><div>${visual.friendTags.map((item, index) => `<span class="poster-friend-tag poster-friend-tag-${index}">${escapeHtml(item)}</span>`).join('')}</div></section>
      <section class="poster-notes"><div class="poster-notes-identity"><img src="${asset(visual.aiIcon)}" alt="AI 观察员" /><h2>AI 看到的你</h2></div><ul>${visual.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
      <p class="poster-boundary">结果呈现的是你此刻的回答倾向，只用于自我理解；它不是临床诊断，也不替你判断一段关系。</p>
      <div class="illustrated-actions"><button class="illustrated-primary" type="button" data-action="share">分享我的结果</button><button class="illustrated-secondary" type="button" data-action="next">${escapeHtml(nextText)}</button>${state.returnToCouple ? '' : '<button class="illustrated-link" type="button" data-action="couple"><b>把 TA 拼进来</b><small>看看你们哪里同频，哪里容易错频道</small></button>'}<div class="illustrated-utility"><button class="illustrated-restart" type="button" data-action="restart">重新测这一块</button><i></i><button class="illustrated-source" type="button" data-action="sources">依据与边界</button></div></div>`;
    bind('[data-action="share"]', renderShare);
    bind('[data-action="next"]', () => {
      if (state.returnToCouple) {
        if (coupleNext) return startAssessment(coupleNext, { returnToCouple: true });
        state.returnToCouple = false;
        return renderCouple();
      }
      return next ? startAssessment(next.id) : renderHome();
    });
    bind('[data-action="couple"]', () => { state.returnToCouple = false; renderCouple(); });
    bind('[data-action="restart"]', () => startAssessment(result.assessmentId, { returnToCouple: state.returnToCouple }));
    bind('[data-action="sources"]', renderSources);
    return;
  }
  app.className = `screen core-result-screen result-kind-${result.assessmentId}`;
  app.innerHTML = `<img class="core-hero-shape" src="${asset(piece.image)}" alt="" /><p class="core-piece-label">PIECE ${String(pieceNumber).padStart(2, '0')}</p><h1>${escapeHtml(title)}</h1>
    <p class="core-resonance">${escapeHtml(resonance)}</p>
    <section class="metric-section"><h2>${escapeHtml(story.metricsTitle)}</h2><div class="metric-list">${metrics.map((metric, index) => `<div class="metric-row"><div><span>${escapeHtml(metric.label)}</span><b>${metric.percent}%</b></div><i><em class="metric-${index}" style="width:${metric.percent}%"></em></i></div>`).join('')}</div></section>
    <section class="result-story story-${story.id}"><p class="story-eyebrow">${escapeHtml(story.eyebrow)}</p><h2>${escapeHtml(story.heading)}</h2><p class="story-lead">${escapeHtml(story.lead)}</p>${story.id === 'bigfive' ? `<div class="trait-spectrum">${story.dimensions.map((item) => `<div class="trait-row"><div><span>${escapeHtml(item.label)}</span><b>${item.percent}%</b></div><i><em style="width:${item.percent}%"></em></i></div>`).join('')}</div>` : ''}<div class="story-blocks">${story.blocks.map((item) => `<article class="story-block story-block-${item.kind}"><span class="story-marker">${escapeHtml(item.marker)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div></article>`).join('')}</div></section>
    <div class="mini-puzzle">${collection.map((item) => `<img class="${item.result ? 'done' : 'pending'}" src="${asset(item.image)}" alt="${item.name}" />`).join('')}</div><p class="core-progress"><b>${completed} 块</b>的你，已经被拼出来。</p>
    <div class="core-actions"><button class="doodle-black-button" type="button" data-action="share">分享我的结果</button><button class="core-secondary" type="button" data-action="next">${escapeHtml(nextText)}</button>${state.returnToCouple ? '' : '<button class="core-couple" type="button" data-action="couple"><b>把 TA 拼进来</b><small>看看你们哪里同频，哪里容易错频道</small></button>'}<div class="core-utility"><button class="core-restart" type="button" data-action="restart">重新测这一块</button><i></i><button class="core-source" type="button" data-action="sources">依据与边界</button></div></div>`;
  bind('[data-action="share"]', renderShare);
  bind('[data-action="next"]', () => {
    if (state.returnToCouple) {
      if (coupleNext) return startAssessment(coupleNext, { returnToCouple: true });
      state.returnToCouple = false;
      return renderCouple();
    }
    return next ? startAssessment(next.id) : renderHome();
  });
  bind('[data-action="couple"]', () => { state.returnToCouple = false; renderCouple(); });
  bind('[data-action="restart"]', () => startAssessment(result.assessmentId, { returnToCouple: state.returnToCouple }));
  bind('[data-action="sources"]', renderSources);
};

const shareLink = () => {
  const visual = resultVisual(state.result);
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('view', 'intro');
  url.searchParams.set('id', state.result.assessmentId);
  url.searchParams.set('name', visual?.title || resultKeyword(state.result) || '新的一面');
  return url.toString();
};

const renderShare = async () => {
  const result = state.result;
  const title = resultVisual(result)?.title || resultKeyword(result) || '新的一面';
  const [bigFiveDimension, bigFiveBand] = String(result.visualCode || '').split('-');
  const bigFiveLevel = { low: '低', mid: '中', high: '高' }[bigFiveBand];
  const bigFiveDimensionLabel = { energy: '外向活力', empathy: '共情合作', order: '秩序自律' }[bigFiveDimension];
  const resultBadge = result.assessmentId === 'bigfive' && bigFiveLevel && bigFiveDimensionLabel
    ? `${bigFiveDimensionLabel} · ${bigFiveLevel}`
    : (result.typeCode || '');
  const previewType = String(result.id || '').startsWith('preview-cognitive-')
    || String(result.id || '').startsWith('preview-social-')
    ? result.typeCode
    : String(result.id || '').startsWith('preview-bigfive-')
      ? `bigfive-${result.visualCode}`
    : String(result.id || '').startsWith('preview-attachment-')
      ? `attachment-${result.typeCode}`
      : '';
  setRoute('share', result.id || result.assessmentId, { preview: previewType });
  app.className = 'screen web-share-screen';
  app.innerHTML = '<button class="share-back" type="button" data-action="result">返回结果</button><div class="share-loading"><i></i><p>正在生成你的人格海报…</p></div>';
  bind('[data-action="result"]', () => renderResult('core'));
  const posterData = await createResultPoster(result);
  if (!app.classList.contains('web-share-screen')) return;
  const download = await api('/api/poster', { dataUrl: posterData, filename: `${title}-人格海报.png` });
  if (!app.classList.contains('web-share-screen')) return;
  app.innerHTML = `<button class="share-back" type="button" data-action="result">返回结果</button><div class="share-title-row"><div><p>SHARE YOUR PIECE</p><h1>保存并分享这张人格海报</h1></div><span>${escapeHtml(resultBadge)}</span></div><p class="share-help">短海报适合分享；完整报告会保存全部分析内容。</p><figure class="web-share-poster"><img src="${posterData}" alt="${escapeHtml(title)}人格海报" /></figure><div class="web-share-actions"><a href="${download.url}" download="${escapeHtml(title)}-人格海报.png">保存分享海报</a><button class="share-full-report" type="button" data-action="full-report">保存完整报告</button><button type="button" data-action="copy-link">复制链接</button><button type="button" data-action="system-share">发给朋友</button></div><button class="share-home" type="button" data-action="home">回到我的拼图</button>`;
  bind('[data-action="result"]', () => renderResult('core'));
  bind('[data-action="home"]', renderHome);
  let fullReportDownload = null;
  bind('[data-action="full-report"]', async (event) => {
    const button = event.currentTarget;
    const visual = resultVisual(result);
    if (!visual || button.disabled) return;
    button.disabled = true;
    button.textContent = '正在生成完整报告…';
    try {
      if (!fullReportDownload) {
        const reportData = await createIllustratedFullReport(result, visual);
        fullReportDownload = await api('/api/poster', { dataUrl: reportData, filename: `${title}-完整人格报告.png` });
      }
      const anchor = document.createElement('a');
      anchor.href = fullReportDownload.url;
      anchor.download = `${title}-完整人格报告.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      button.textContent = '再次保存完整报告';
    } catch (error) {
      button.textContent = '重新生成完整报告';
      window.alert(error.message || '完整报告生成失败，请再试一次');
    } finally {
      button.disabled = false;
    }
  });
  bind('[data-action="copy-link"]', async () => {
    try { await navigator.clipboard.writeText(shareLink()); window.alert('链接已复制'); } catch (error) { window.prompt('复制这条分享链接', shareLink()); }
  });
  bind('[data-action="system-share"]', async () => {
    const data = { title: `我是「${title}」`, text: `我拼出了「${title}」，那你呢？`, url: shareLink() };
    if (navigator.share) { try { await navigator.share(data); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(shareLink()); window.alert('分享链接已复制'); } catch (error) { window.prompt('复制这条分享链接', shareLink()); }
  });
};

const renderPoster = async () => {
  renderShare();
};

const renderExtension = (kind) => {
  const fallback = {
    love: { eyebrow: '继续了解自己', title: '恋爱里的你', lead: '喜欢一个人时，你会把熟悉的靠近方式一起带进关系。', sections: [{ title: '关系里的你', body: state.result.sections.find((item) => item.title === '关系里的你')?.body || state.result.summary }], action: '清楚表达一个具体需要，比让对方猜更容易得到真实回应。' },
    stuck: { eyebrow: '继续了解自己', title: '你容易卡在哪里', lead: '卡住常常是熟悉的保护方式在压力里自动出现。', sections: [{ title: '容易卡住的时刻', body: state.result.sections.find((item) => item.title.includes('卡住'))?.body || state.result.reminder }], action: '先把事实和猜测分开，再决定要不要开口。' },
    practice: { eyebrow: '一个小练习', title: '把需要说具体一点', lead: '只练习说清这一刻，不急着解释整段关系。', sections: [{ title: '试试这样说', body: '当＿＿发生时，我有点＿＿。如果可以，我希望我们＿＿。' }], action: '请求越具体，就越容易被听懂。' }
  }[kind];
  const copy = state.result.extensions?.[kind] || fallback;
  const sections = copy.sections.map((section) => `<article class="analysis-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></article>`).join('');
  setRoute('extension', kind);
  app.className = 'screen detail-screen';
  app.innerHTML = `<button class="back-button" type="button" data-action="result" aria-label="返回结果">‹</button><p class="eyebrow">${escapeHtml(copy.eyebrow)}</p><h1>${escapeHtml(copy.title)}</h1><p class="extension-copy">${escapeHtml(copy.lead)}</p>${sections}<aside><h3>可以试试</h3><p>${escapeHtml(copy.action)}</p></aside><button class="primary-button" type="button" data-action="result">回到完整结果</button>`;
  bind('[data-action="result"]', renderResult);
};

const renderInspiration = () => {
  setRoute('inspiration');
  const groups = Object.entries(state.catalog.inspirationCards);
  app.className = 'screen detail-screen';
  app.innerHTML = `${backButton()}<div class="intro-art lavender"><img src="/miniprogram/assets/mist-inspiration-lavender.png" alt="" /></div><p class="eyebrow">塔罗式意象卡 · 非占卜</p><h1>抽一张塔罗</h1>
    <p class="intro-copy">先选一个你此刻更想看见的方向。它只提供象征性的自我反思，不预测未来。</p>
    <div class="choice-grid">${groups.map(([key, group]) => `<button type="button" class="choice-card ${state.inspirationGroup === key ? 'selected' : ''}" data-group="${key}">${escapeHtml(group.title)}</button>`).join('')}</div>
    ${state.inspirationCard ? `<article class="drawn-card"><img class="drawn-card-art" src="/miniprogram/assets/tarot-card-art.jpg" alt="" /><div class="drawn-card-copy"><p class="eyebrow">${escapeHtml(state.inspirationCard.symbol)}</p><h2>${escapeHtml(state.inspirationCard.title)}</h2><p>${escapeHtml(state.inspirationCard.face)}</p><small><b>也留意：</b>${escapeHtml(state.inspirationCard.shadow)}</small><small><b>留给你的问题：</b>${escapeHtml(state.inspirationCard.reflection)}</small><small><b>今天可以：</b>${escapeHtml(state.inspirationCard.action)}</small></div></article>` : ''}
    <button class="primary-button" type="button" data-action="draw" ${state.inspirationGroup ? '' : 'disabled'}>${state.inspirationCard ? '再抽一次' : '抽一张塔罗'}</button>`;
  bind('[data-action="home"]', renderHome);
  bind('[data-group]', (event) => { state.inspirationGroup = event.currentTarget.dataset.group; state.inspirationCard = null; renderInspiration(); });
  bind('[data-action="draw"]', () => {
    const cards = state.catalog.inspirationCards[state.inspirationGroup].cards;
    state.inspirationCard = cards[Math.floor(Math.random() * cards.length)];
    renderInspiration();
  });
};

const renderCouple = async () => {
  setRoute('couple', '', { code: state.couplePartnerCode, demo: state.coupleDemo });
  app.className = 'screen couple-screen';
  const seriousResults = state.results.filter((result) => ['cognitive', 'attachment', 'bigfive', 'relationship'].includes(result.assessmentId));
  const cognitiveReady = seriousResults.some((result) => result.assessmentId === 'cognitive' && result.typeCode !== 'XXXX' && result.version === state.catalog.assessments.cognitive.version);
  const attachmentReady = seriousResults.some((result) => result.assessmentId === 'attachment' && result.version === state.catalog.assessments.attachment.version);
  const hasResults = cognitiveReady && attachmentReady;
  const hasIncomingInvite = Boolean(state.couplePartnerCode);
  const hero = `<div class="couple-hero" aria-label="我和 TA 的两块拼图">
      <div class="couple-person couple-person-me"><img src="/miniprogram/assets/doodle-relationship.png" alt="我的拼图" /><span>我</span></div>
      <b>${state.coupleReport ? '×' : '+'}</b>
      <div class="couple-person couple-person-partner ${hasIncomingInvite || state.coupleReport ? 'arrived' : ''}"><img src="/miniprogram/assets/doodle-social.png" alt="TA 的拼图" /><span>TA</span></div>
    </div>`;

  if (state.coupleReport) {
    const cards = state.coupleReport.cards.map((card, index) => `<article class="couple-report-card couple-report-card-${index}"><span>0${index + 1}</span><div><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.body)}</p></div></article>`).join('');
    const scoreItems = state.coupleScoreExpanded
      ? (state.coupleReport.dimensions || [])
      : (state.coupleReport.dimensions || []).filter((item) => ['回应敏感', '空间需要', '整理能量'].includes(item.label));
    const dimensions = scoreItems.map((item) => {
      const note = item.label === '整理能量' ? '差异最大' : '';
      return `<article class="couple-score-row"><div class="couple-score-label"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(note)}</small></div><div class="couple-score-track"><i class="mine" style="left:${Number(item.mine)}%"><em>我</em></i><i class="theirs" style="left:${Number(item.theirs)}%"><em>TA</em></i></div><div class="couple-score-ends"><span>${escapeHtml(item.leftLabel)}</span><span>${escapeHtml(item.rightLabel)}</span></div></article>`;
    }).join('');
    const scoreMore = `<button class="couple-score-more" type="button" data-action="toggle-scores">${state.coupleScoreExpanded ? '收起另外 3 项' : '查看另外 3 项'} <span>›</span></button>`;
    app.innerHTML = `${backButton()}<p class="couple-eyebrow">OUR MAP · 双人拼图</p><h1 class="couple-title"><span>我们一起，</span><span>拼出「我们」</span></h1><p class="couple-intro">${escapeHtml(state.coupleReport.summary)}</p>${hero}
      <section class="couple-score-evidence"><h2>你们在关系里的位置</h2><p>不是匹配分，只看彼此更靠近哪一边</p>${dimensions}${scoreMore}</section>
      <section class="couple-report-list">${cards}</section>
      <aside class="couple-action"><small>下次错频道时，可以试试</small><p>${escapeHtml(state.coupleReport.action)}</p></aside>
      <p class="couple-boundary">差异不等于不适合。真实互动，永远比人格组合更重要。</p>
      <button class="couple-primary" type="button" data-action="share-report">分享我们的相处地图</button>
      <button class="couple-reset" type="button" data-action="again">换一个人重新拼</button>`;
    bind('[data-action="home"]', renderHome);
    bind('[data-action="toggle-scores"]', () => {
      state.coupleScoreExpanded = !state.coupleScoreExpanded;
      renderCouple();
    });
    bind('[data-action="share-report"]', async () => {
      const data = { title: '我们的相处地图', text: state.coupleReport.summary, url: location.href };
      if (navigator.share) { try { await navigator.share(data); return; } catch (error) { if (error?.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(location.href); window.alert('报告链接已复制'); } catch (error) { window.prompt('复制报告链接', location.href); }
    });
    bind('[data-action="again"]', () => {
      state.coupleReport = null;
      state.couplePartnerCode = '';
      state.coupleCodePanel = false;
      state.coupleInviteSent = false;
      state.coupleScoreExpanded = false;
      state.coupleDemo = '';
      renderCouple();
    });
    return;
  }

  if (hasResults && !state.coupleCode) {
    const data = await api('/api/share-code', { results: seriousResults });
    state.coupleCode = data.code;
  }

  const missingCount = Number(!cognitiveReady) + Number(!attachmentReady);
  const nextRequirement = !cognitiveReady
    ? { id: 'cognitive', title: '思考模式', duration: '约 6 分钟' }
    : !attachmentReady ? { id: 'attachment', title: '依恋模式', duration: '约 4 分钟' } : null;
  const requirement = (id, title, subtitle, ready) => `<div class="couple-requirement ${ready ? 'done' : ''}">
    <img src="/miniprogram/assets/doodle-${id}.png" alt="" /><span><strong>${title}</strong><small>${subtitle}</small></span><em>${ready ? '已拼上 ✓' : '待完成'}</em>
  </div>`;
  const requirements = `<section class="couple-requirements"><h2>你的准备进度</h2>${requirement('cognitive', '思考模式', '你怎样理解世界', cognitiveReady)}${requirement('attachment', '依恋模式', '你怎样靠近与退后', attachmentReady)}</section>`;
  const readyCard = `<section class="couple-ready"><b>✓</b><span><strong>你的这一半已经拼好</strong><small>认知偏好与依恋倾向已准备完成</small></span></section>`;
  const codePanel = state.coupleCodePanel ? `<section class="couple-code-panel"><h2>对方的结果码</h2><textarea data-field="partner" placeholder="粘贴对方主动分享的结果码">${escapeHtml(state.couplePartnerCode)}</textarea><button type="button" data-action="create-report">生成相处地图</button><button type="button" data-action="copy-code">复制我的结果码</button></section>` : '';
  const eyebrow = hasIncomingInvite ? 'TA 的邀请' : hasResults ? '邀请 TA' : '先完成自己';
  const title = hasIncomingInvite ? 'TA 把一半拼图，留给了你' : hasResults ? '你的一半，已经准备好了' : '先准备好你的一半';
  const intro = hasIncomingInvite
    ? (hasResults
      ? '你们两边都准备好了。点击下方按钮，就能在这台设备上生成相处地图。'
      : '补上你的思考模式和依恋模式，就能在这台设备上生成你们的相处地图。')
    : hasResults
      ? '把这份邀请发给 TA。TA 补完自己的两块后，就会看到你们哪里同频、哪里容易错频道。'
      : `双人拼图需要「思考模式 + 依恋模式」。你还差 ${missingCount} 块，完成后才能生成邀请。`;
  const flowSteps = `<div class="couple-steps">
    <div class="couple-step ${!hasResults ? 'active' : 'done'}"><span>1</span><b>拼好我的一半</b></div>
    <div class="couple-step ${hasResults && !hasIncomingInvite ? 'active' : hasIncomingInvite ? 'done' : ''}"><span>2</span><b>发给 / 来自 TA</b></div>
    <div class="couple-step ${hasIncomingInvite && hasResults ? 'active' : ''}"><span>3</span><b>生成「我们」</b></div>
  </div>`;
  const waiting = state.coupleInviteSent && !hasIncomingInvite
    ? '<section class="couple-waiting"><strong>邀请已经准备好</strong><p>如果刚才取消了分享，可以再次发送。当前版本不会自动知道 TA 是否完成。</p></section>'
    : '';

  app.innerHTML = `${backButton()}<p class="couple-eyebrow">${eyebrow}</p>
    <h1 class="couple-title">${title}</h1>
    <p class="couple-intro">${intro}</p>${flowSteps}
    ${hero}<section class="couple-belief"><strong>两个人都没有问题。</strong><p>只是可能一直在用不同的方式，理解同一件事。</p></section>
    ${hasResults ? `${readyCard}<button class="couple-primary" type="button" data-action="${hasIncomingInvite ? 'create-report' : 'invite'}">${hasIncomingInvite ? '生成我们的相处地图' : state.coupleInviteSent ? '再次发给 TA' : '生成邀请，发给 TA'}</button><p class="couple-action-note">${hasIncomingInvite ? '双方结果只在本机组合，不上传逐题答案' : 'TA 完成后，报告会先显示在 TA 的设备上，再由 TA 分享给你'}</p>${waiting}<button class="couple-manual-toggle" type="button" data-action="toggle-code">${state.coupleCodePanel ? '收起手动方式' : '已经拿到结果码？手动拼入'}</button>${codePanel}<p class="couple-privacy">只交换生成地图所需的结构化结果，不公开逐题答案。</p>` : `${requirements}<button class="couple-primary" type="button" data-action="start-${nextRequirement.id}">完成${nextRequirement.title} · ${nextRequirement.duration}</button><p class="couple-privacy">完成后自动回到这里；如果你是从 TA 的邀请进入，邀请会继续保留。</p>`}`;
  bind('[data-action="home"]', renderHome);
  bind('[data-action="start-cognitive"]', () => startAssessment('cognitive', { returnToCouple: true }));
  bind('[data-action="start-attachment"]', () => startAssessment('attachment', { returnToCouple: true }));
  bind('[data-action="copy-code"]', async () => {
    try { await navigator.clipboard.writeText(state.coupleCode); } catch (error) { window.prompt('复制结果码', state.coupleCode); }
  });
  bind('[data-action="toggle-code"]', () => { state.coupleCodePanel = !state.coupleCodePanel; renderCouple(); });
  bind('[data-action="invite"]', async () => {
    const inviteUrl = new URL(location.origin + location.pathname);
    inviteUrl.searchParams.set('view', 'couple');
    inviteUrl.searchParams.set('code', state.coupleCode);
    const inviteLink = inviteUrl.toString();
    const data = { title: '把我的拼图拼进来', text: '看看我们在关系里的共同节奏和容易误会的地方。', url: inviteLink };
    if (navigator.share) {
      try {
        await navigator.share(data);
        state.coupleInviteSent = true;
        return renderCouple();
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try { await navigator.clipboard.writeText(inviteLink); window.alert('邀请链接已复制'); } catch (error) { window.prompt('复制邀请链接', inviteLink); }
    state.coupleInviteSent = true;
    renderCouple();
  });
  bind('[data-action="create-report"]', async () => {
    const code = (app.querySelector('[data-field="partner"]')?.value || state.couplePartnerCode).trim();
    if (!code) return window.alert('还没有收到对方的拼图');
    state.couplePartnerCode = code;
    try {
      const data = await api('/api/couple-report', { results: seriousResults, code });
      state.coupleReport = data.report;
      state.coupleScoreExpanded = false;
      renderCouple();
    } catch (error) {
      window.alert(error.message);
    }
  });
};

const setupCoupleDemo = async (demo) => {
  if (!['missing', 'incoming', 'incoming-ready', 'ready', 'report'].includes(demo)) return;
  state.coupleDemo = demo;
  state.coupleCode = '';
  state.coupleReport = null;
  state.coupleCodePanel = false;
  state.coupleInviteSent = false;
  state.coupleScoreExpanded = false;
  state.results = state.results.filter((result) => !['cognitive', 'attachment'].includes(result.assessmentId));
  const mine = [
    { id: 'demo-mine-cognitive', assessmentId: 'cognitive', typeCode: 'INTJ', version: state.catalog.assessments.cognitive.version, scores: { EI: -0.72, NS: 0.78, TF: -0.66, JP: 0.68 } },
    { id: 'demo-mine-attachment', assessmentId: 'attachment', typeCode: 'secure', version: state.catalog.assessments.attachment.version, scores: { anxiety: 68, avoidance: 31 } }
  ];
  const partner = [
    { id: 'demo-partner-cognitive', assessmentId: 'cognitive', typeCode: 'ENFP', version: state.catalog.assessments.cognitive.version, scores: { EI: 0.75, NS: 0.82, TF: 0.71, JP: -0.58 } },
    { id: 'demo-partner-attachment', assessmentId: 'attachment', typeCode: 'avoidant', version: state.catalog.assessments.attachment.version, scores: { anxiety: 34, avoidance: 73 } }
  ];
  if (demo === 'missing') state.results = [mine[0], ...state.results];
  if (['incoming-ready', 'ready', 'report'].includes(demo)) state.results = [...mine, ...state.results];
  if (['incoming', 'incoming-ready', 'report'].includes(demo)) {
    const shared = await api('/api/share-code', { results: partner });
    state.couplePartnerCode = shared.code;
  } else {
    state.couplePartnerCode = '';
  }
  if (demo === 'report') {
    const data = await api('/api/couple-report', { results: mine, code: state.couplePartnerCode });
    state.coupleReport = data.report;
  }
};

const renderSources = () => {
  setRoute('sources', state.result?.id || state.result?.assessmentId || '');
  app.className = 'screen web-sources-screen';
  app.innerHTML = `<button class="share-back" type="button" data-action="back">${state.result ? '返回结果' : '返回首页'}</button><p class="sources-label">依据与边界</p><h1>它帮助理解，<br>不负责定义。</h1><p class="sources-lead">结果是一张观察自己的地图，不是必须维持的人设。</p>
    <section class="sources-card"><h2>题目从哪里来</h2><p>认知偏好参考心理功能与类型动力学；性格底色采用五因素结构；依恋倾向观察焦虑与回避两个连续维度；关系状态关注投入、欣赏、回应和修复。</p></section>
    <section class="sources-card"><h2>它不是什么</h2><p>不是临床诊断，也不应用于招聘、治疗、升学，或替你决定一段关系。它只描述本次回答呈现的倾向。</p></section>
    <button class="doodle-black-button sources-done" type="button" data-action="back">我知道了</button>`;
  bind('[data-action="back"]', () => state.result ? renderResult('core') : renderHome());
};

const boot = async () => {
  app.innerHTML = '<p class="loading">正在准备题目…</p>';
  try {
    state.catalog = await api('/api/catalog');
    state.results = loadResults();
    await refreshStoredResults();
    const query = new URLSearchParams(location.search);
    const view = query.get('view');
    const id = query.get('id');
    const coupleDemo = String(query.get('demo') || '').toLowerCase();
    const previewIdMatch = String(id || '').match(/^preview-(cognitive|social)-([a-z0-9]+)$/i);
    const attachmentPreviewIdMatch = String(id || '').match(/^preview-attachment-(secure|anxious|avoidant|fearful-avoidant)$/i);
    const bigFivePreviewIdMatch = String(id || '').match(/^preview-bigfive-((?:energy|empathy|order)-(?:low|mid|high))$/i);
    const previewRaw = String(query.get('preview') || previewIdMatch?.[2]
      || (attachmentPreviewIdMatch ? `attachment-${attachmentPreviewIdMatch[1]}` : '')
      || (bigFivePreviewIdMatch ? `bigfive-${bigFivePreviewIdMatch[1]}` : ''));
    const previewType = previewRaw.toUpperCase();
    const previewAssessment = previewIdMatch?.[1]?.toLowerCase()
      || (state.catalog.resultVisuals?.cognitive?.[previewType] ? 'cognitive' : '')
      || (state.catalog.resultVisuals?.social?.[previewType] ? 'social' : '');
    const attachmentPreviewMatch = previewRaw.toLowerCase().match(/^attachment-(secure|anxious|avoidant|fearful-avoidant)$/);
    const attachmentPreviewType = attachmentPreviewMatch?.[1] || '';
    const bigFivePreviewMatch = previewRaw.toLowerCase().match(/^bigfive-((?:energy|empathy|order)-(?:low|mid|high))$/);
    const bigFivePreviewType = bigFivePreviewMatch?.[1] || '';
    state.couplePartnerCode = query.get('code') || '';
    if (['result', 'share', 'poster'].includes(view) && previewAssessment && state.catalog.resultVisuals?.[previewAssessment]?.[previewType]) {
      const previewVisual = state.catalog.resultVisuals[previewAssessment][previewType];
      const previewProfile = previewVisual.analysisProfile;
      const isSocialPreview = previewAssessment === 'social';
      const previewResult = {
        id: `preview-${previewAssessment}-${previewType.toLowerCase()}`,
        assessmentId: previewAssessment,
        typeCode: previewType,
        typeName: previewVisual.title,
        title: `${previewType} · ${previewVisual.title}`,
        summary: previewVisual.quote,
        shareLine: previewVisual.quote,
        scores: previewVisual.previewScores,
        insights: isSocialPreview ? [
          { title: '这不是社牛或社恐那么简单', body: previewProfile.driver },
          { title: '你在人群里的自动角色', body: previewProfile.stress },
          { title: '别人容易误会你的地方', body: previewProfile.misread },
          { title: '散场以后，你真正需要的', body: previewProfile.recovery }
        ] : [
          { title: '别人先看到的你', body: previewVisual.quote },
          { title: '你心里真正发生的', body: previewProfile.driver },
          { title: '压力一来，你可能会反过来', body: previewProfile.stress },
          { title: '关系里容易被误会的地方', body: previewProfile.misread },
          { title: '更适合你的调整方式', body: previewProfile.recovery }
        ],
        sections: isSocialPreview ? [
          { title: '你如何进入人群', body: previewProfile.driver },
          { title: '情绪被看见的方式', body: previewProfile.conflict },
          { title: '你在局里的功能', body: previewProfile.stress },
          { title: '容易被误会的地方', body: previewProfile.misread }
        ] : [
          { title: '你自然的样子', body: previewProfile.driver },
          { title: '你习惯的生活节奏', body: previewProfile.conflict },
          { title: '关系里的你', body: previewProfile.misread },
          { title: '容易卡住的时刻', body: previewProfile.conflict }
        ],
        deepDive: {
          body: previewProfile.driver,
          sections: [
            { title: '它们怎样一起工作', body: previewProfile.driver },
            { title: '压力大时可能发生什么', body: previewProfile.stress },
            { title: '让自己更平衡一点', body: previewProfile.recovery }
          ]
        }
      };
      state.result = previewResult;
      state.results = [previewResult, ...state.results.filter((result) => result.assessmentId !== previewAssessment)];
      if (view === 'share') return renderShare();
      if (view === 'poster') return renderPoster();
      return renderResult('core');
    }
    if (['result', 'share', 'poster'].includes(view) && state.catalog.resultVisuals?.bigfive?.[bigFivePreviewType]) {
      const previewVisual = state.catalog.resultVisuals.bigfive[bigFivePreviewType];
      const previewProfile = previewVisual.analysisProfile;
      const previewResult = {
        id: `preview-bigfive-${bigFivePreviewType}`,
        assessmentId: 'bigfive',
        visualCode: bigFivePreviewType,
        title: previewVisual.title,
        summary: previewVisual.quote,
        shareLine: previewVisual.quote,
        scores: previewVisual.previewScores,
        insights: [
          { title: '你的底色不是一个标签', body: previewProfile.driver },
          { title: '别人先看到的你', body: previewVisual.quote },
          { title: '熟悉以后才会看见的部分', body: previewProfile.conflict },
          { title: '压力下可能出现的反差', body: previewProfile.stress },
          { title: '更适合你的调整方式', body: previewProfile.recovery }
        ],
        sections: [
          { title: '你自然的样子', body: previewProfile.driver },
          { title: '你习惯的生活节奏', body: previewProfile.conflict },
          { title: '关系里的你', body: previewProfile.misread },
          { title: '容易卡住的时刻', body: previewProfile.stress }
        ]
      };
      state.result = previewResult;
      state.results = [previewResult, ...state.results.filter((result) => result.assessmentId !== 'bigfive')];
      if (view === 'share') return renderShare();
      if (view === 'poster') return renderPoster();
      return renderResult('core');
    }
    if (['result', 'share', 'poster'].includes(view) && state.catalog.resultVisuals?.attachment?.[attachmentPreviewType]) {
      const previewVisual = state.catalog.resultVisuals.attachment[attachmentPreviewType];
      const previewProfile = previewVisual.analysisProfile;
      const previewResult = {
        id: `preview-attachment-${attachmentPreviewType}`,
        assessmentId: 'attachment',
        typeCode: attachmentPreviewType,
        typeName: previewVisual.title,
        title: previewVisual.title,
        profileKey: attachmentPreviewType === 'secure' ? 'low_low' : attachmentPreviewType === 'anxious' ? 'high_low' : attachmentPreviewType === 'avoidant' ? 'low_high' : 'high_high',
        profileTitle: attachmentPreviewType === 'secure' ? '关系里比较能松下来' : attachmentPreviewType === 'anxious' ? '很认真地确认连接' : attachmentPreviewType === 'avoidant' ? '习惯把自己照顾好' : '一边想确认，一边想退开',
        summary: previewVisual.quote,
        shareLine: previewVisual.quote,
        scores: previewVisual.previewScores,
        insights: [
          { title: '你的主要倾向', body: previewProfile.driver },
          { title: '一个很像你的瞬间', body: previewProfile.conflict },
          { title: '你最容易掉进去的循环', body: previewProfile.stress },
          { title: '别人可能误会你的地方', body: previewProfile.misread },
          { title: '更适合你的调整方式', body: previewProfile.recovery }
        ],
        sections: [
          { title: '你自然的样子', body: previewProfile.driver },
          { title: '这份反应在保护什么', body: previewProfile.conflict },
          { title: '关系里的你', body: previewProfile.misread },
          { title: '容易卡住的时刻', body: previewProfile.conflict },
          { title: '你真正需要的', body: previewProfile.understood }
        ]
      };
      state.result = previewResult;
      state.results = [previewResult, ...state.results.filter((result) => result.assessmentId !== 'attachment')];
      if (view === 'share') return renderShare();
      if (view === 'poster') return renderPoster();
      return renderResult('core');
    }
    if (view === 'intro' && state.catalog.assessments[id]) {
      state.assessment = state.catalog.assessments[id];
      return renderIntro();
    }
    const stored = id ? state.results.find((result) => result.id === id || result.assessmentId === id) : null;
    if (stored) state.result = stored;
    if (view === 'couple') {
      await setupCoupleDemo(coupleDemo);
      return renderCouple();
    }
    if (view === 'sources') return renderSources();
    if (view === 'inspiration') return renderInspiration();
    if (view === 'result' && stored) return renderResult('core');
    if (view === 'share' && stored) return renderShare();
    if (view === 'poster' && stored) return renderPoster();
    renderHome();
  } catch (error) {
    app.innerHTML = `<p class="loading">加载失败：${escapeHtml(error.message)}</p>`;
  }
};

boot();
