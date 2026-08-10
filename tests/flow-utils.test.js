const test = require('node:test');
const assert = require('node:assert/strict');

const memory = new Map();
global.wx = {
  getStorageSync(key) { return memory.get(key); },
  setStorageSync(key, value) { memory.set(key, value); },
  removeStorageSync(key) { memory.delete(key); }
};

const { getPiece, buildMetrics, buildResultStory, firstSentence, buildHighlights } = require('../miniprogram/utils/puzzle');
const { assessments } = require('../miniprogram/data/assessments');
const { scoreAssessment } = require('../miniprogram/utils/scoring');
const { getResults, getResult, saveResult, getDraft } = require('../miniprogram/utils/storage');

test.beforeEach(() => memory.clear());

test('未知测评不会被误映射成第一块拼图', () => {
  assert.equal(getPiece('unknown'), null);
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
