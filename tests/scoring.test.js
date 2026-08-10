const test = require('node:test');
const assert = require('node:assert/strict');

const { assessments, inspirationCards } = require('../miniprogram/data/assessments');
const { scoreAssessment, getFollowupQuestions } = require('../miniprogram/utils/scoring');
const { createShareCode, parseShareCode, compactResult, createCoupleReport, getCoupleReadiness } = require('../miniprogram/utils/couple');

test('每个正式测试都能用完整答案得到结构化长结果', () => {
  for (const id of ['cognitive', 'attachment', 'bigfive', 'relationship', 'social']) {
    const assessment = assessments[id];
    const answers = assessment.questions.map((_, index) => (index % 5) + 1);
    const result = scoreAssessment(id, answers, assessment.questions.map((question) => question.id));
    assert.equal(result.assessmentId, id);
    assert.ok(result.title.length > 0);
    assert.ok(result.summary.length > 20);
    assert.ok(result.sections.length >= 3);
    assert.ok(result.ruleIds.length >= 1);
    assert.ok(result.evidenceId.startsWith('S'));
    assert.ok(result.map.x >= 0 && result.map.x <= 100);
    assert.ok(result.map.y >= 0 && result.map.y <= 100);
  }
});

test('未完成答案不会被静默补齐', () => {
  assert.throws(() => scoreAssessment('attachment', [1, 2, 3]), /未完成|NaN|reduce|undefined/);
});

test('认知偏好固定 36 题并直接给出四字母结果', () => {
  assert.equal(assessments.cognitive.questions.length, 36);
  const neutralAnswers = assessments.cognitive.questions.map(() => 3);
  const followups = getFollowupQuestions('cognitive', neutralAnswers);
  const result = scoreAssessment('cognitive', neutralAnswers, assessments.cognitive.questions.map((question) => question.id));
  assert.equal(followups.length, 0);
  assert.equal(result.typeCode, 'XXXX');
  assert.match(result.title, /暂未分开/);
});

test('认知偏好用 Fi/Ti 功能而不是“会不会解决问题”区分 INFP 与 INTP', () => {
  const questions = assessments.cognitive.questions;
  const ids = questions.map((question) => question.id);
  const answersFor = (preference) => questions.map((question) => {
    if (question.oppositeFunction) {
      return preference[question.cognitiveFunction] >= preference[question.oppositeFunction] ? 5 : 1;
    }
    return preference[question.cognitiveFunction];
  });
  const infp = scoreAssessment('cognitive', answersFor({ Fi: 5, Ne: 5, Si: 4, Te: 1, Ti: 2, Fe: 2, Ni: 2, Se: 1 }), ids);
  const intp = scoreAssessment('cognitive', answersFor({ Ti: 5, Ne: 5, Si: 4, Fe: 1, Fi: 2, Te: 2, Ni: 2, Se: 1 }), ids);
  assert.equal(infp.typeCode, 'INFP');
  assert.equal(intp.typeCode, 'INTP');
  assert.ok(infp.functionScores.Fi > infp.functionScores.Ti);
  assert.ok(intp.functionScores.Ti > intp.functionScores.Fi);
});

test('16 种类型都有独立的功能组合、四字母解释和八维分布', () => {
  const stacks = {
    INTJ: ['Ni', 'Te', 'Fi', 'Se'], INTP: ['Ti', 'Ne', 'Si', 'Fe'], ENTJ: ['Te', 'Ni', 'Se', 'Fi'], ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
    INFJ: ['Ni', 'Fe', 'Ti', 'Se'], INFP: ['Fi', 'Ne', 'Si', 'Te'], ENFJ: ['Fe', 'Ni', 'Se', 'Ti'], ENFP: ['Ne', 'Fi', 'Te', 'Si'],
    ISTJ: ['Si', 'Te', 'Fi', 'Ne'], ISFJ: ['Si', 'Fe', 'Ti', 'Ne'], ESTJ: ['Te', 'Si', 'Ne', 'Fi'], ESFJ: ['Fe', 'Si', 'Ne', 'Ti'],
    ISTP: ['Ti', 'Se', 'Ni', 'Fe'], ISFP: ['Fi', 'Se', 'Ni', 'Te'], ESTP: ['Se', 'Ti', 'Fe', 'Ni'], ESFP: ['Se', 'Fi', 'Te', 'Ni']
  };
  const questions = assessments.cognitive.questions;
  const ids = questions.map((question) => question.id);
  const combinations = new Set();
  Object.entries(stacks).forEach(([expected, stack]) => {
    const preference = { Se: 2, Si: 2, Ne: 2, Ni: 2, Te: 2, Ti: 2, Fe: 2, Fi: 2 };
    preference[stack[0]] = 5;
    preference[stack[1]] = 4;
    preference[stack[2]] = 3;
    preference[stack[3]] = 1;
    const answers = questions.map((question) => question.oppositeFunction
      ? (preference[question.cognitiveFunction] >= preference[question.oppositeFunction] ? 5 : 1)
      : preference[question.cognitiveFunction]);
    const result = scoreAssessment('cognitive', answers, ids);
    assert.equal(result.typeCode, expected);
    assert.equal(result.letterCards.map((card) => card.title).join(''), expected);
    assert.equal(result.deepDive.coreFunctions.length, 2);
    assert.equal(result.deepDive.functionDistribution.length, 8);
    assert.ok(result.deepDive.sections.length >= 4);
    combinations.add(result.deepDive.title);
  });
  assert.equal(combinations.size, 16);
});

test('八功能题量平衡，四组同向功能都有取舍题', () => {
  const directCounts = {};
  const contrastPairs = new Set();
  assessments.cognitive.questions.forEach((question) => {
    if (question.oppositeFunction) {
      contrastPairs.add([question.cognitiveFunction, question.oppositeFunction].sort().join('-'));
    } else {
      directCounts[question.cognitiveFunction] = (directCounts[question.cognitiveFunction] || 0) + 1;
    }
  });
  assert.deepEqual(Object.values(directCounts).sort(), Array(8).fill(4));
  assert.deepEqual([...contrastPairs].sort(), ['Fe-Te', 'Fi-Ti', 'Ne-Se', 'Ni-Si']);
  const directOrder = assessments.cognitive.questions.filter((question) => !question.oppositeFunction);
  for (let index = 1; index < directOrder.length; index += 1) {
    assert.notEqual(directOrder[index].cognitiveFunction, directOrder[index - 1].cognitiveFunction, '同一功能不应连续成组出现');
  }
});

test('16 种典型功能画像在单题轻微扰动后不会跳型', () => {
  const stacks = {
    INTJ: ['Ni', 'Te', 'Fi', 'Se'], INTP: ['Ti', 'Ne', 'Si', 'Fe'], ENTJ: ['Te', 'Ni', 'Se', 'Fi'], ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
    INFJ: ['Ni', 'Fe', 'Ti', 'Se'], INFP: ['Fi', 'Ne', 'Si', 'Te'], ENFJ: ['Fe', 'Ni', 'Se', 'Ti'], ENFP: ['Ne', 'Fi', 'Te', 'Si'],
    ISTJ: ['Si', 'Te', 'Fi', 'Ne'], ISFJ: ['Si', 'Fe', 'Ti', 'Ne'], ESTJ: ['Te', 'Si', 'Ne', 'Fi'], ESFJ: ['Fe', 'Si', 'Ne', 'Ti'],
    ISTP: ['Ti', 'Se', 'Ni', 'Fe'], ISFP: ['Fi', 'Se', 'Ni', 'Te'], ESTP: ['Se', 'Ti', 'Fe', 'Ni'], ESFP: ['Se', 'Fi', 'Te', 'Ni']
  };
  const questions = assessments.cognitive.questions;
  const ids = questions.map((question) => question.id);
  Object.entries(stacks).forEach(([expected, stack]) => {
    const preference = { Se: 2, Si: 2, Ne: 2, Ni: 2, Te: 2, Ti: 2, Fe: 2, Fi: 2 };
    preference[stack[0]] = 5;
    preference[stack[1]] = 4;
    preference[stack[2]] = 3;
    preference[stack[3]] = 1;
    const answers = questions.map((question) => question.oppositeFunction
      ? (preference[question.cognitiveFunction] >= preference[question.oppositeFunction] ? 5 : 1)
      : preference[question.cognitiveFunction]);
    answers.forEach((answer, index) => {
      const perturbed = answers.slice();
      perturbed[index] = answer === 5 ? 4 : answer === 1 ? 2 : answer + 1;
      assert.equal(scoreAssessment('cognitive', perturbed, ids).typeCode, expected, `${expected} 在 ${questions[index].id} 扰动后跳型`);
    });
  });
});

test('主导 Fi 且整体直觉偏好高于感觉时，不因单个 Se 略高于 Ne 被判成 ISFP', () => {
  const { rankCognitiveTypes } = require('../miniprogram/utils/scoring');
  const candidates = rankCognitiveTypes({ Fi: 0.36, Ni: 0.26, Te: 0.02, Ti: -0.02, Se: -0.10, Fe: -0.18, Ne: -0.18, Si: -0.18 });
  assert.equal(candidates[0].typeCode, 'INFP');
});

test('认知基线只解释其他题库的表现方式，不改变独立量表得分', () => {
  const cognitive = scoreAssessment(
    'cognitive',
    assessments.cognitive.questions.map((question) => {
      const preference = { Fi: 5, Ne: 4, Si: 3, Te: 1, Ti: 2, Fe: 2, Ni: 2, Se: 1 };
      return question.oppositeFunction
        ? (preference[question.cognitiveFunction] >= preference[question.oppositeFunction] ? 5 : 1)
        : preference[question.cognitiveFunction];
    }),
    assessments.cognitive.questions.map((question) => question.id)
  );
  const answers = assessments.attachment.questions.map((_, index) => (index % 5) + 1);
  const independent = scoreAssessment('attachment', answers);
  const contextualized = scoreAssessment('attachment', answers, undefined, cognitive);
  assert.deepEqual(contextualized.scores, independent.scores);
  assert.deepEqual(contextualized.rawScores, independent.rawScores);
  assert.equal(contextualized.title, independent.title);
  assert.equal(contextualized.baselineContext.typeCode, cognitive.typeCode);
  assert.match(contextualized.sections.at(-1).body, /依恋题仍独立决定/);
});

test('旧版本或未分化的认知结果不会被套入其他题库', () => {
  const answers = assessments.relationship.questions.map(() => 4);
  const oldBaseline = { assessmentId: 'cognitive', typeCode: 'INFP', version: '0.1.0' };
  const result = scoreAssessment('relationship', answers, undefined, oldBaseline);
  assert.equal(result.baselineContext, undefined);
  assert.ok(!result.sections.some((section) => section.title === '结合你的认知偏好'));
});

test('四套正式结果都有可分享文案和三组个性化延伸分析', () => {
  for (const id of ['cognitive', 'attachment', 'bigfive', 'relationship']) {
    const assessment = assessments[id];
    const result = scoreAssessment(id, assessment.questions.map((_, index) => (index % 5) + 1), assessment.questions.map((question) => question.id));
    assert.ok(result.shareLine.length > 10);
    for (const kind of ['love', 'stuck', 'practice']) {
      assert.ok(result.extensions[kind].sections.length >= 3);
      assert.ok(result.extensions[kind].action.length > 10);
    }
  }
});

test('关系安全感反向题参与确定性评分', () => {
  const high = scoreAssessment('attachment', assessments.attachment.questions.map((question) => question.reverse ? 1 : 5));
  assert.equal(high.rawScores.anxiety, 5);
  assert.equal(high.rawScores.avoidance, 5);
  assert.equal(high.title, '一边想确认，一边想退开');
});

test('依恋倾向为 24 题，二维各 12 题且六个侧面各四题', () => {
  assert.equal(assessments.attachment.questions.length, 24);
  const dimensions = {};
  const facets = {};
  const reverseFacets = {};
  assessments.attachment.questions.forEach((question) => {
    dimensions[question.dimension] = (dimensions[question.dimension] || 0) + 1;
    facets[question.facet] = (facets[question.facet] || 0) + 1;
    if (question.reverse) reverseFacets[question.facet] = (reverseFacets[question.facet] || 0) + 1;
  });
  assert.deepEqual(dimensions, { anxiety: 12, avoidance: 12 });
  assert.deepEqual(Object.values(facets).sort(), Array(6).fill(4));
  assert.deepEqual(Object.values(reverseFacets).sort(), Array(6).fill(1));
});

test('恋爱状态为 20 题，五个关系资源各四题且各有反向题', () => {
  assert.equal(assessments.relationship.questions.length, 20);
  const dimensions = {};
  const reversed = {};
  assessments.relationship.questions.forEach((question) => {
    dimensions[question.dimension] = (dimensions[question.dimension] || 0) + 1;
    if (question.reverse) reversed[question.dimension] = (reversed[question.dimension] || 0) + 1;
  });
  assert.deepEqual(Object.values(dimensions).sort(), Array(5).fill(4));
  assert.deepEqual(Object.values(reversed).sort(), Array(5).fill(1));
});

test('SBTI 使用 24 道题且低分化答案不会被硬塞进某种人设', () => {
  assert.equal(assessments.social.questions.length, 24);
  const flat = scoreAssessment('social', assessments.social.questions.map(() => 4));
  assert.equal(flat.typeCode, 'MIX');
  assert.deepEqual(flat.boundaryFlags, ['flat']);
  assert.match(flat.reminder, /不需要维持成固定人设/);
});

test('塔罗式意象卡共 18 张且每张都有反思与行动字段', () => {
  const cards = Object.values(inspirationCards).flatMap((group) => group.cards);
  assert.equal(cards.length, 18);
  cards.forEach((card) => {
    assert.ok(card.face.length > 10);
    assert.ok(card.shadow.length > 10);
    assert.ok(card.reflection.endsWith('？'));
    assert.ok(card.action.length > 5);
  });
});

test('双人结果码可往返且篡改会失败', () => {
  const cognitive = scoreAssessment('cognitive', assessments.cognitive.questions.map((_, index) => (index % 5) + 1), assessments.cognitive.questions.map((question) => question.id));
  const result = scoreAssessment('attachment', assessments.attachment.questions.map(() => 4));
  const code = createShareCode([cognitive, result]);
  const decoded = parseShareCode(code);
  assert.deepEqual(decoded.a, result.scores);
  assert.equal(code.startsWith('M2.'), true);
  assert.throws(() => parseShareCode(`${code}X`), /无效|不完整/);
});

test('双人地图必须具备当前版本认知偏好与依恋倾向', () => {
  const cognitive = scoreAssessment('cognitive', assessments.cognitive.questions.map((_, index) => (index % 5) + 1), assessments.cognitive.questions.map((question) => question.id));
  const attachment = scoreAssessment('attachment', assessments.attachment.questions.map(() => 4));
  assert.deepEqual(getCoupleReadiness([cognitive]), { cognitive: true, attachment: false });
  assert.deepEqual(getCoupleReadiness([cognitive, attachment]), { cognitive: true, attachment: true });
  assert.throws(() => createShareCode([attachment]), /认知偏好和依恋倾向/);
});

test('双人报告始终包含共同资源且不输出匹配百分比', () => {
  const mine = compactResult([
    scoreAssessment('cognitive', assessments.cognitive.questions.map(() => 4), assessments.cognitive.questions.map((q) => q.id)),
    scoreAssessment('attachment', assessments.attachment.questions.map(() => 5))
  ]);
  const theirs = compactResult([
    scoreAssessment('cognitive', assessments.cognitive.questions.map(() => 2), assessments.cognitive.questions.map((q) => q.id)),
    scoreAssessment('attachment', assessments.attachment.questions.map(() => 1))
  ]);
  const report = createCoupleReport(mine, theirs);
  assert.equal(report.cards[0].ruleId, 'CM14');
  assert.ok(!JSON.stringify(report).includes('%'));
  assert.ok(report.cards.length <= 4);
});
