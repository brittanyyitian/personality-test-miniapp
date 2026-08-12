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
  localStorage.setItem(RESULT_KEY, JSON.stringify(state.results));
  return record;
};

const asset = (path) => {
  if (!path) return '';
  if (path.startsWith('/result-package/')) return `/miniprogram${path}`;
  return path.replace('/assets/', '/miniprogram/assets/');
};
const clampPercent = (value) => Math.max(4, Math.min(96, Math.round(Number(value) || 0)));
const resultVisual = (result) => {
  const visual = state.catalog?.resultVisuals?.[result?.assessmentId]?.[result?.typeCode] || null;
  if (!visual || !Array.isArray(visual.tendencyAxes)) return visual;
  return {
    ...visual,
    tendencies: visual.tendencyAxes.map((axis) => ({
      label: axis.label,
      percent: clampPercent(50 + (Number(result.scores?.[axis.key]) || 0) * 50 * axis.direction),
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
    const anxietyPercent = ((anxiety - 1) / 4) * 100;
    const avoidancePercent = ((avoidance - 1) / 4) * 100;
    return [
      { label: metricLabels.anxiety, percent: clamp(anxietyPercent) },
      { label: metricLabels.avoidance, percent: clamp(avoidancePercent) },
      { label: metricLabels.security, percent: clamp(100 - ((anxietyPercent + avoidancePercent) / 2)) }
    ];
  }
  const entries = Object.entries(result.scores || {});
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
    eyebrow: '关系不是一张成绩单', heading: '这段关系里，正在发生什么', metricsTitle: '支撑这段关系的三个信号',
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

const createResultPoster = async (result) => {
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
  const optionValues = assessment.options.length === 5 ? [1, 2, 4, 5] : assessment.options.map((_, index) => index + 1);
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
  if (!previewType) setRoute('result', result.id || result.assessmentId);
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
    app.className = `screen illustrated-result-screen result-kind-${result.assessmentId}`;
    app.innerHTML = `<p class="poster-kicker ${visual.heroIncludesKicker ? 'poster-kicker-hidden' : ''}">${escapeHtml(visual.kicker)}</p>
      <img class="poster-hero" src="${asset(visual.hero)}" alt="${escapeHtml(visual.title)} 主视觉" />
      <section class="poster-quote"><b>“</b><p>${escapeHtml(visual.quote)}</p></section>
      <section class="poster-traits">${visual.traits.map((item) => `<article class="poster-trait poster-tone-${escapeHtml(item.tone)}"><h2>${escapeHtml(item.label)}</h2><p>${escapeHtml(item.detail)}</p></article>`).join('')}</section>
      <section class="poster-tags-panel"><div class="poster-tags-head"><h2>✱ 你在人群里的标签</h2><span>最像你的三种已经点亮</span></div><div class="poster-tags-grid">${visual.tags.map((item) => `<article class="poster-tag-card ${item.tone ? `poster-tag-card-${escapeHtml(item.tone)}` : ''}"><span class="poster-tag-face poster-tag-face-${escapeHtml(item.face)}"><i class="poster-face-eye poster-face-eye-left"></i><i class="poster-face-eye poster-face-eye-right"></i><i class="poster-face-nose"></i><i class="poster-face-mouth"></i></span><b>${escapeHtml(item.label)}</b></article>`).join('')}</div></section>
      <section class="poster-tendencies"><h2>${escapeHtml(visual.tendencyTitle || '关系倾向')}</h2><div>${visual.tendencies.map((item) => `<article class="poster-tendency"><span>${escapeHtml(item.label)}</span><i><em class="poster-fill-${escapeHtml(item.tone)}" style="width:${item.percent}%"></em></i><b>${item.percent}%</b></article>`).join('')}</div></section>
      <section class="illustrated-puzzle-panel"><div class="illustrated-panel-head"><h2>✱ 你的人格拼图进度</h2><span>已完成 ${completed} / 5</span></div><div class="illustrated-puzzle-list">${collection.map((item) => `<article><img class="${item.result ? 'done' : 'pending'}" src="${asset(item.image)}" alt="${escapeHtml(item.name)}" /><b>${escapeHtml(item.name)}</b><small>${item.result ? escapeHtml(resultKeyword(item.result) || '已完成') : '待解锁'}</small></article>`).join('')}</div></section>
      <section class="poster-friend-tags"><h2>朋友眼中的你</h2><div>${visual.friendTags.map((item, index) => `<span class="poster-friend-tag poster-friend-tag-${index}">${escapeHtml(item)}</span>`).join('')}</div></section>
      <section class="poster-notes"><div class="poster-notes-identity"><img src="${asset(visual.aiIcon)}" alt="AI 观察员" /><h2>AI 看到的你</h2></div><ul>${visual.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
      <div class="illustrated-actions"><button class="illustrated-primary" type="button" data-action="share">分享我的结果</button><button class="illustrated-secondary" type="button" data-action="next">${escapeHtml(nextText)}</button>${state.returnToCouple ? '' : '<button class="illustrated-link" type="button" data-action="couple">拼入对方，看看我们怎么相处</button>'}<button class="illustrated-source" type="button" data-action="sources">依据与边界</button></div>`;
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
    bind('[data-action="sources"]', renderSources);
    return;
  }
  app.className = `screen core-result-screen result-kind-${result.assessmentId}`;
  app.innerHTML = `<img class="core-hero-shape" src="${asset(piece.image)}" alt="" /><p class="core-piece-label">PIECE ${String(pieceNumber).padStart(2, '0')}</p><h1>${escapeHtml(title)}</h1>
    <p class="core-resonance">${escapeHtml(resonance)}</p>
    <section class="metric-section"><h2>${escapeHtml(story.metricsTitle)}</h2><div class="metric-list">${metrics.map((metric, index) => `<div class="metric-row"><div><span>${escapeHtml(metric.label)}</span><b>${metric.percent}%</b></div><i><em class="metric-${index}" style="width:${metric.percent}%"></em></i></div>`).join('')}</div></section>
    <section class="result-story story-${story.id}"><p class="story-eyebrow">${escapeHtml(story.eyebrow)}</p><h2>${escapeHtml(story.heading)}</h2><p class="story-lead">${escapeHtml(story.lead)}</p>${story.id === 'bigfive' ? `<div class="trait-spectrum">${story.dimensions.map((item) => `<div class="trait-row"><div><span>${escapeHtml(item.label)}</span><b>${item.percent}%</b></div><i><em style="width:${item.percent}%"></em></i></div>`).join('')}</div>` : ''}<div class="story-blocks">${story.blocks.map((item) => `<article class="story-block story-block-${item.kind}"><span class="story-marker">${escapeHtml(item.marker)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div></article>`).join('')}</div></section>
    <div class="mini-puzzle">${collection.map((item) => `<img class="${item.result ? 'done' : 'pending'}" src="${asset(item.image)}" alt="${item.name}" />`).join('')}</div><p class="core-progress"><b>${completed} 块</b>的你，已经被拼出来。</p>
    <div class="core-actions"><button class="doodle-black-button" type="button" data-action="share">分享我的结果</button><button class="core-secondary" type="button" data-action="next">${escapeHtml(nextText)}</button>${state.returnToCouple ? '' : '<button class="core-couple" type="button" data-action="couple">拼入对方，看看我们怎么相处</button>'}<button class="core-source" type="button" data-action="sources">依据与边界</button></div>`;
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

const renderShare = () => {
  const result = state.result;
  const piece = pieceFor(result.assessmentId);
  const title = resultVisual(result)?.title || resultKeyword(result) || '新的一面';
  const resonance = firstSentence(result.summary || result.shareLine);
  const collection = resultCollection();
  const pieceNumber = puzzlePieces.findIndex((item) => item.id === result.assessmentId) + 1;
  setRoute('share', result.id || result.assessmentId);
  app.className = 'screen web-share-screen';
  app.innerHTML = `<button class="share-back" type="button" data-action="result">返回结果</button><h1>这是我的一块</h1><section class="web-share-card"><small>PIECE ${String(pieceNumber).padStart(2, '0')}</small><img src="${asset(piece.image)}" alt="" /><h2>${escapeHtml(title)}</h2><p>${escapeHtml(resonance)}</p><div class="share-mini-puzzle">${collection.map((item) => `<img class="${item.result ? 'done' : 'pending'}" src="${asset(item.image)}" alt="" />`).join('')}</div></section><p class="share-invite">你会拼出什么？<br>来试试吧！</p><div class="web-share-actions"><button type="button" data-action="copy-link">复制链接</button><button type="button" data-action="save-poster">保存图片</button><button type="button" data-action="system-share">发给朋友</button></div><button class="doodle-black-button share-home" type="button" data-action="home">回到我的拼图</button>`;
  bind('[data-action="result"]', () => renderResult('core'));
  bind('[data-action="home"]', renderHome);
  bind('[data-action="save-poster"]', renderPoster);
  bind('[data-action="copy-link"]', async () => {
    try { await navigator.clipboard.writeText(shareLink()); window.alert('链接已复制'); } catch (error) { window.prompt('复制这条分享链接', shareLink()); }
  });
  bind('[data-action="system-share"]', async () => {
    const data = { title: `我拼出了「${title}」`, text: `我拼出了「${title}」，那你呢？`, url: shareLink() };
    if (navigator.share) { try { await navigator.share(data); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(shareLink()); window.alert('分享链接已复制'); } catch (error) { window.prompt('复制这条分享链接', shareLink()); }
  });
};

const renderPoster = async () => {
  const result = state.result;
  setRoute('poster', result.id || result.assessmentId);
  app.className = 'screen web-poster-screen';
  app.innerHTML = '<p class="poster-loading">正在生成你的拼图卡片…</p>';
  const posterData = await createResultPoster(result);
  const title = resultVisual(result)?.title || resultKeyword(result) || '人格拼图';
  const download = await api('/api/poster', { dataUrl: posterData, filename: `${title}-人格拼图.png` });
  app.innerHTML = `<button class="share-back" type="button" data-action="share">返回分享</button><h1>保存这块拼图</h1><p class="poster-hint">长按图片保存，或使用下方按钮下载。</p><img class="poster-preview" src="${posterData}" alt="${escapeHtml(title)}拼图卡片" /><a class="doodle-black-button poster-download" href="${download.url}" download="${escapeHtml(title)}-人格拼图.png">下载图片</a>`;
  bind('[data-action="share"]', renderShare);
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
  setRoute('couple', '', { code: state.couplePartnerCode });
  app.className = 'screen detail-screen';
  const seriousResults = state.results.filter((result) => ['cognitive', 'attachment', 'bigfive', 'relationship'].includes(result.assessmentId));
  const cognitiveReady = seriousResults.some((result) => result.assessmentId === 'cognitive' && result.typeCode !== 'XXXX' && result.version === state.catalog.assessments.cognitive.version);
  const attachmentReady = seriousResults.some((result) => result.assessmentId === 'attachment' && result.version === state.catalog.assessments.attachment.version);
  if (!cognitiveReady || !attachmentReady) {
    const missingButtons = `${cognitiveReady ? '' : '<button class="primary-button" type="button" data-action="start-cognitive">完成 16 型人格偏好</button>'}${attachmentReady ? '' : '<button class="secondary-button" type="button" data-action="start-attachment">完成依恋倾向</button>'}`;
    app.innerHTML = `${backButton()}<div class="intro-art blue"><img src="/miniprogram/assets/icon-feather-blue.png" alt="" /></div><p class="eyebrow">两个人的相处地图</p><h1>两个人合不合</h1><p class="intro-copy">双方都需要完成认知偏好和依恋倾向，才能比较彼此的理解方式、确认连接的需要和靠近退开的节奏。</p>${missingButtons}`;
    bind('[data-action="home"]', renderHome);
    bind('[data-action="start-cognitive"]', () => startAssessment('cognitive', { returnToCouple: true }));
    bind('[data-action="start-attachment"]', () => startAssessment('attachment', { returnToCouple: true }));
    return;
  }

  if (!state.coupleCode) {
    const data = await api('/api/share-code', { results: seriousResults });
    state.coupleCode = data.code;
  }

  if (state.coupleReport) {
    const cards = state.coupleReport.cards.map((card) => `<article class="analysis-section"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`).join('');
    app.innerHTML = `${backButton()}<p class="eyebrow">组合结果</p><h1>${escapeHtml(state.coupleReport.title)}</h1><p class="intro-copy">${escapeHtml(state.coupleReport.summary)}</p>${cards}<aside><h3>可以试试</h3><p>${escapeHtml(state.coupleReport.action)}</p></aside><button class="secondary-button" type="button" data-action="again">重新输入结果码</button>`;
    bind('[data-action="home"]', renderHome);
    bind('[data-action="again"]', () => { state.coupleReport = null; renderCouple(); });
    return;
  }

  const inviteUrl = new URL(location.origin + location.pathname);
  inviteUrl.searchParams.set('view', 'couple');
  inviteUrl.searchParams.set('code', state.coupleCode);
  const inviteLink = inviteUrl.toString();
  app.innerHTML = `${backButton()}<p class="eyebrow">双方主动分享</p><h1>两个人的相处地图</h1>
    <p class="intro-copy">不算匹配百分比。相似是共同语言，差异是需要翻译的地方。</p>
    <section class="info-block"><h3>我的匿名结果码</h3><textarea class="code-field" readonly>${escapeHtml(state.coupleCode)}</textarea><button class="share-row" type="button" data-action="copy-code">复制结果码</button><button class="doodle-black-button couple-invite-button" type="button" data-action="invite">邀请对方拼进来</button></section>
    <section class="info-block"><h3>或者输入对方的结果码</h3><textarea class="code-field" data-field="partner" placeholder="粘贴对方主动分享的结果码">${escapeHtml(state.couplePartnerCode)}</textarea></section>
    <button class="primary-button" type="button" data-action="create-report">生成相处地图</button>
    <p class="footnote">结果码只包含必要的结构化分数，不包含逐题答案。</p>`;
  bind('[data-action="home"]', renderHome);
  bind('[data-action="copy-code"]', async () => {
    try { await navigator.clipboard.writeText(state.coupleCode); } catch (error) { window.prompt('复制结果码', state.coupleCode); }
  });
  bind('[data-action="invite"]', async () => {
    const data = { title: '把我的拼图拼进来', text: '看看我们在关系里的共同节奏和容易误会的地方。', url: inviteLink };
    if (navigator.share) { try { await navigator.share(data); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(inviteLink); window.alert('邀请链接已复制'); } catch (error) { window.prompt('复制邀请链接', inviteLink); }
  });
  bind('[data-action="create-report"]', async () => {
    const code = app.querySelector('[data-field="partner"]').value.trim();
    if (!code) return;
    state.couplePartnerCode = code;
    try {
      const data = await api('/api/couple-report', { results: seriousResults, code });
      state.coupleReport = data.report;
      renderCouple();
    } catch (error) {
      window.alert(error.message);
    }
  });
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
    const previewType = query.get('preview');
    state.couplePartnerCode = query.get('code') || '';
    if (view === 'result' && state.catalog.resultVisuals?.cognitive?.[previewType]) {
      const storedCognitive = state.results.find((result) => result.assessmentId === 'cognitive');
      const previewVisual = state.catalog.resultVisuals.cognitive[previewType];
      const signs = {
        EI: previewType[0] === 'E' ? 0.72 : -0.72,
        NS: previewType[1] === 'N' ? 0.76 : -0.76,
        TF: previewType[2] === 'T' ? 0.68 : -0.68,
        JP: previewType[3] === 'J' ? 0.7 : -0.7
      };
      const previewResult = storedCognitive ? {
        ...storedCognitive,
        id: `preview-cognitive-${previewType.toLowerCase()}`,
        typeCode: previewType,
        typeName: previewVisual.title,
        title: `${previewType} · ${previewVisual.title}`,
        scores: signs
      } : {
        id: `preview-cognitive-${previewType.toLowerCase()}`,
        assessmentId: 'cognitive',
        typeCode: previewType,
        typeName: previewVisual.title,
        title: `${previewType} · ${previewVisual.title}`,
        summary: previewVisual.quote,
        shareLine: previewVisual.quote,
        scores: signs,
        sections: [
          { title: '你的思考顺序', body: previewVisual.quote },
          { title: '心里真正发生的', body: previewVisual.notes[0] },
          { title: '压力下的思维反转', body: previewVisual.notes[1] },
          { title: '关系里容易被误会的地方', body: previewVisual.notes[2] },
          { title: '让思考恢复流动', body: '把此刻最重要的方向拆成一个可以验证的小步骤，会更容易继续前进。' }
        ]
      };
      state.result = previewResult;
      state.results = [previewResult, ...state.results.filter((result) => result.assessmentId !== 'cognitive')];
      return renderResult('core');
    }
    if (view === 'intro' && state.catalog.assessments[id]) {
      state.assessment = state.catalog.assessments[id];
      return renderIntro();
    }
    const stored = id ? state.results.find((result) => result.id === id || result.assessmentId === id) : null;
    if (stored) state.result = stored;
    if (view === 'couple') return renderCouple();
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
