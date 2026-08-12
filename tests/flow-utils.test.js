const test = require('node:test');
const assert = require('node:assert/strict');

const memory = new Map();
global.wx = {
  getStorageSync(key) { return memory.get(key); },
  setStorageSync(key, value) { memory.set(key, value); },
  removeStorageSync(key) { memory.delete(key); }
};

const { getPiece, getResultVisual, getResultHeroAsset, buildMetrics, buildResultStory, firstSentence, buildHighlights } = require('../miniprogram/utils/puzzle');
const { assessments } = require('../miniprogram/data/assessments');
const { typeTitles } = require('../miniprogram/data/assessments');
const { scoreAssessment } = require('../miniprogram/utils/scoring');
const { getResults, getResult, saveResult, getDraft } = require('../miniprogram/utils/storage');

test.beforeEach(() => memory.clear());

test('未知测评不会被误映射成第一块拼图', () => {
  assert.equal(getPiece('unknown'), null);
});

test('SPARK 使用慢性撤退者海报模板，未配置的社交结果保持默认模板', () => {
  const sparkVisual = getResultVisual({ assessmentId: 'social', typeCode: 'SPARK' });
  assert.equal(sparkVisual.title, '慢性撤退者');
  assert.equal(sparkVisual.template, 'illustrated-poster');
  assert.equal(sparkVisual.hero, '/assets/result-chronic-retreater.webp');
  assert.equal(sparkVisual.aiIcon, '/assets/result-ai-observer.webp');
  assert.equal(sparkVisual.traits.length, 4);
  assert.equal(sparkVisual.tags.length, 9);
  assert.equal(sparkVisual.tendencies.length, 4);
  assert.equal(sparkVisual.friendTags.length, 5);
  assert.equal(getResultVisual({ assessmentId: 'social', typeCode: 'ROOM' }), null);
});

test('INTJ 静默构图者复用完整海报模板并登记头图', () => {
  const hero = getResultHeroAsset({ assessmentId: 'cognitive', typeCode: 'INTJ' });
  assert.equal(hero.title, '静默构图者');
  assert.equal(hero.hero, '/result-package/assets/result-cognitive-intj-hero.webp');
  const visual = getResultVisual({ assessmentId: 'cognitive', typeCode: 'INTJ' });
  const sparkVisual = getResultVisual({ assessmentId: 'social', typeCode: 'SPARK' });
  assert.equal(visual.template, 'illustrated-poster');
  assert.equal(visual.template, sparkVisual.template);
  assert.equal(visual.hero, '/result-package/assets/result-cognitive-intj-hero.webp');
  assert.equal(visual.tags.length, 9);
  ['traits', 'tags', 'tendencies', 'friendTags', 'notes'].forEach((key) => {
    assert.equal(Array.isArray(visual[key]), true, key);
    assert.equal(Array.isArray(sparkVisual[key]), true, key);
  });
});

test('16 种认知结果全部复用同一模板并关联独立头图', () => {
  Object.entries(typeTitles).forEach(([typeCode, title]) => {
    const scores = {
      EI: typeCode[0] === 'E' ? 0.6 : -0.6,
      NS: typeCode[1] === 'N' ? 0.6 : -0.6,
      TF: typeCode[2] === 'T' ? 0.6 : -0.6,
      JP: typeCode[3] === 'J' ? 0.6 : -0.6
    };
    const visual = getResultVisual({ assessmentId: 'cognitive', typeCode, scores });
    assert.equal(visual.template, 'illustrated-poster', typeCode);
    assert.equal(visual.title, title, typeCode);
    assert.equal(visual.hero, `/result-package/assets/result-cognitive-${typeCode.toLowerCase()}-hero.webp`, typeCode);
    assert.equal(visual.traits.length, 4, typeCode);
    assert.equal(visual.tags.length, 9, typeCode);
    assert.equal(visual.tendencies.length, 4, typeCode);
    assert.equal(visual.friendTags.length, 5, typeCode);
    assert.equal(visual.notes.length, 3, typeCode);
    assert.equal(visual.analysis.length, 6, typeCode);
    visual.tendencies.forEach((item) => assert.equal(item.percent, 80, `${typeCode}:${item.label}`));
  });
});

test('16 种认知结果拥有独立六段画像，不能退化成四字母通用拼接', () => {
  const profiles = Object.keys(typeTitles).map((typeCode) => {
    const visual = getResultVisual({ assessmentId: 'cognitive', typeCode, scores: {} });
    assert.deepEqual(visual.analysis.map((item) => item.title), ['核心驱动力', '内在矛盾', '压力反转', '关系误读', '被理解方式', '恢复建议'], typeCode);
    visual.analysis.forEach((item) => assert.ok(item.body.length >= 45, `${typeCode}/${item.title} 内容过短`));
    return visual.analysis.map((item) => item.body).join('|');
  });
  assert.equal(new Set(profiles).size, 16);
});

test('illustrated 画像优先接入正式 insights、sections 与 deepDive', () => {
  const result = {
    assessmentId: 'cognitive', typeCode: 'INTJ', scores: {},
    insights: [
      { title: '压力一来，你可能会反过来', body: '来自正式 insights 的压力分析，会随本次答案变化。' },
      { title: '关系里容易被误会的地方', body: '来自正式 insights 的关系误读，会随本次答案变化。' },
      { title: '更适合你的调整方式', body: '来自正式 insights 的恢复建议，会随本次答案变化。' }
    ],
    sections: [{ title: '容易卡住的时刻', body: '来自正式 sections 的当次卡点。' }],
    deepDive: { body: '来自正式 deepDive 的核心功能组合。', sections: [] }
  };
  const analysis = getResultVisual(result).analysis;
  assert.match(analysis[0].body, /正式 deepDive/);
  assert.match(analysis[1].body, /正式 sections/);
  assert.match(analysis[2].body, /正式 insights/);
  assert.match(analysis[3].body, /正式 insights/);
  assert.match(analysis[5].body, /正式 insights/);
});

test('16 种预览强度各不相同且方向符合类型', () => {
  const vectors = Object.keys(typeTitles).map((typeCode) => {
    const visual = getResultVisual({ assessmentId: 'cognitive', typeCode, scores: {} });
    const scores = visual.previewScores;
    assert.equal(Math.sign(scores.EI), typeCode[0] === 'E' ? 1 : -1, typeCode);
    assert.equal(Math.sign(scores.NS), typeCode[1] === 'N' ? 1 : -1, typeCode);
    assert.equal(Math.sign(scores.TF), typeCode[2] === 'T' ? 1 : -1, typeCode);
    assert.equal(Math.sign(scores.JP), typeCode[3] === 'J' ? 1 : -1, typeCode);
    return Object.values(scores).join(',');
  });
  assert.equal(new Set(vectors).size, 16);
});

test('16 种认知头图都会让人格类型提示只出现一次', () => {
  const embeddedKickers = new Set(['INTJ', 'INTP', 'ENFP', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
  Object.keys(typeTitles).forEach((typeCode) => {
    const visual = getResultVisual({ assessmentId: 'cognitive', typeCode, scores: {} });
    assert.equal(visual.kicker, '你的人格类型是', typeCode);
    assert.equal(visual.heroIncludesKicker, embeddedKickers.has(typeCode), typeCode);
  });
});

test('缺少共鸣文案时不会生成单独句号', () => {
  assert.equal(firstSentence(''), '');
  assert.equal(firstSentence('  '), '');
});

test('未分化认知结果仍提供三个中性指标', () => {
  const metrics = buildMetrics({ assessmentId: 'cognitive', typeCode: 'XXXX', scores: {} });
  assert.deepEqual(metrics.map((item) => item.label), ['连接节奏', '信息偏好', '判断依据']);
  assert.deepEqual(metrics.map((item) => item.percent), [50, 50, 50]);
});

test('五套核心结果都稳定提供三个指标', () => {
  Object.keys(assessments).forEach((id) => {
    const assessment = assessments[id];
    const fourPointAnswers = [1, 2, 4, 5];
    const answers = assessment.questions.map((_, index) => fourPointAnswers[index % fourPointAnswers.length]);
    const result = scoreAssessment(id, answers, assessment.questions.map((question) => question.id));
    assert.equal(buildMetrics(result).length, 3, id);
  });
});

test('五套核心结果使用不同的信息结构', () => {
  const headings = new Set();
  Object.keys(assessments).forEach((id) => {
    const assessment = assessments[id];
    const answers = assessment.questions.map((_, index) => [1, 2, 4, 5][index % 4]);
    const result = scoreAssessment(id, answers, assessment.questions.map((question) => question.id));
    const story = buildResultStory(result);
    assert.equal(story.id, id);
    assert.equal(story.blocks.length, 4, id);
    assert.ok(story.lead.length >= 30, `${id} 共鸣引导过短`);
    headings.add(story.heading);
  });
  assert.equal(headings.size, 5);
});

test('五套题库在四档典型答案下都有完整核心分析', () => {
  const profiles = [1, 2, 4, 5];
  Object.keys(assessments).forEach((id) => {
    const assessment = assessments[id];
    profiles.forEach((answer) => {
      const answers = assessment.questions.map(() => answer);
      const result = scoreAssessment(id, answers, assessment.questions.map((question) => question.id));
      assert.ok(result.title, `${id}/${answer} 缺少结果名`);
      assert.ok(result.summary.length > 20, `${id}/${answer} 摘要过短`);
      assert.equal(buildMetrics(result).length, 3, `${id}/${answer} 指标不足`);
      const highlights = buildHighlights(result);
      assert.equal(highlights.length, 5, `${id}/${answer} 分析不足`);
      highlights.forEach((item) => assert.ok(item.body.length >= 30, `${id}/${answer}/${item.title} 内容过短`));
    });
  });
});

test('五因素会把明显低于中点的特质识别为核心画像', () => {
  const assessment = assessments.bigfive;
  const answers = assessment.questions.map((question) => question.dimension === 'energy'
    ? (question.reverse ? 5 : 1)
    : 3);
  const result = scoreAssessment('bigfive', answers, assessment.questions.map((question) => question.id));
  assert.equal(result.title, '能量更愿意往内收');
  assert.match(result.insights[0].body, /外向活力/);
});

test('五套测试的高低典型回答会产生不同分析内容', () => {
  const profileA = [1, 2, 4, 5];
  const profileB = [5, 4, 2, 1];
  Object.keys(assessments).forEach((id) => {
    const assessment = assessments[id];
    const low = scoreAssessment(id, assessment.questions.map((_, index) => profileA[index % profileA.length]), assessment.questions.map((question) => question.id));
    const high = scoreAssessment(id, assessment.questions.map((_, index) => profileB[index % profileB.length]), assessment.questions.map((question) => question.id));
    assert.notEqual(JSON.stringify(low.insights), JSON.stringify(high.insights), `${id} 高低回答没有拉开分析`);
  });
});

test('storage 兼容数组与旧 envelope，并忽略损坏值', () => {
  memory.set('mind_results_v1', { results: [null, { id: 7, assessmentId: 'social', title: '旧结果' }] });
  assert.equal(getResults().length, 1);
  assert.equal(getResult('7').title, '旧结果');

  memory.set('mind_results_v1', 'broken');
  assert.deepEqual(getResults(), []);
  memory.set('mind_draft_social', 'broken');
  assert.equal(getDraft('social'), null);
});

test('同一毫秒重复保存也会得到不同 resultId', () => {
  const originalNow = Date.now;
  Date.now = () => 1234;
  try {
    const first = saveResult({ assessmentId: 'social', title: 'A' });
    const second = saveResult({ assessmentId: 'social', title: 'B' });
    assert.notEqual(first.id, second.id);
    assert.equal(getResults().length, 2);
  } finally {
    Date.now = originalNow;
  }
});
