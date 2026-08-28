const test = require('node:test');
const assert = require('node:assert/strict');

const { assessments, inspirationCards } = require('../miniprogram/data/assessments');
const { scoreAssessment, getFollowupQuestions } = require('../miniprogram/utils/scoring');
const { getResultVisual } = require('../miniprogram/utils/puzzle');
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

test('认知偏好集中作答时追加取舍题并仍给出明确四字母结果', () => {
  assert.equal(assessments.cognitive.questions.length, 36);
  const neutralAnswers = assessments.cognitive.questions.map(() => 3);
  const followups = getFollowupQuestions('cognitive', neutralAnswers);
  const questions = assessments.cognitive.questions.concat(followups);
  const answers = neutralAnswers.concat(followups.map((_, index) => (index % 2 ? 2 : 4)));
  const result = scoreAssessment('cognitive', answers, questions.map((question) => question.id));
  assert.equal(followups.length, 8);
  assert.match(result.typeCode, /^[EI][NS][TF][JP]$/);
  assert.doesNotMatch(result.title, /暂未分开|XXXX/);
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
  const contentProfiles = new Set();
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
    const visual = getResultVisual(result);
    assert.equal(visual.analysis.length, 6);
    contentProfiles.add(visual.analysis.map((item) => item.body).join('|'));
    combinations.add(result.deepDive.title);
  });
  assert.equal(combinations.size, 16);
  assert.equal(contentProfiles.size, 16);
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
  assert.equal(high.title, '恐惧—回避型依恋');
  assert.equal(high.typeCode, 'fearful-avoidant');
  assert.match(high.summary, /一边想确认，一边想退开/);
});

test('依恋二维结果明确映射四种核心依恋倾向', () => {
  const answersFor = (anxietyHigh, avoidanceHigh) => assessments.attachment.questions.map((question) => {
    const high = question.dimension === 'anxiety' ? anxietyHigh : avoidanceHigh;
    return question.reverse ? (high ? 1 : 5) : (high ? 5 : 1);
  });
  const secure = scoreAssessment('attachment', answersFor(false, false));
  const anxious = scoreAssessment('attachment', answersFor(true, false));
  const avoidant = scoreAssessment('attachment', answersFor(false, true));
  const fearful = scoreAssessment('attachment', answersFor(true, true));
  assert.deepEqual(
    [secure.typeCode, anxious.typeCode, avoidant.typeCode, fearful.typeCode],
    ['secure', 'anxious', 'avoidant', 'fearful-avoidant']
  );
  assert.deepEqual(
    [secure.title, anxious.title, avoidant.title, fearful.title],
    ['安全型依恋', '焦虑型依恋', '回避型依恋', '恐惧—回避型依恋']
  );
});

test('依恋中间分数只影响细节，不会生成第五种公开类型', () => {
  const allowed = new Set(['secure', 'anxious', 'avoidant', 'fearful-avoidant']);
  const answerSets = [
    assessments.attachment.questions.map(() => 3),
    assessments.attachment.questions.map((_, index) => [2, 3, 4, 3][index % 4]),
    assessments.attachment.questions.map((question) => question.reverse ? 4 : 2),
    assessments.attachment.questions.map((question) => question.reverse ? 2 : 4)
  ];
  answerSets.forEach((answers) => {
    const result = scoreAssessment('attachment', answers);
    assert.equal(allowed.has(result.typeCode), true, result.typeCode);
  });
  const neutral = scoreAssessment('attachment', assessments.attachment.questions.map(() => 3));
  assert.equal(neutral.typeCode, 'secure');
  assert.equal(neutral.confidence, '回答较集中');
  assert.match(neutral.summary, /最接近的方向/);
});

test('依恋结果页指标直接使用标准化百分比，不会二次换算', () => {
  const result = scoreAssessment('attachment', assessments.attachment.questions.map((question) => question.reverse ? 5 : 1));
  const metrics = require('../miniprogram/utils/puzzle').buildMetrics(result);
  assert.deepEqual(metrics.map((item) => item.percent), [4, 4, 96]);
  assert.deepEqual(getResultVisual(result).tendencies.map((item) => item.percent), [4, 4, 96]);
});

test('依恋倾向为 24 题，二维各 12 题并按 ECR-R 构念平衡正反向题', () => {
  assert.equal(assessments.attachment.questions.length, 24);
  const dimensions = {};
  const facets = {};
  const reverseDimensions = {};
  assessments.attachment.questions.forEach((question) => {
    dimensions[question.dimension] = (dimensions[question.dimension] || 0) + 1;
    facets[question.facet] = (facets[question.facet] || 0) + 1;
    if (question.reverse) reverseDimensions[question.dimension] = (reverseDimensions[question.dimension] || 0) + 1;
    assert.ok(Array.isArray(question.references) && question.references.length >= 1, question.id);
  });
  assert.deepEqual(dimensions, { anxiety: 12, avoidance: 12 });
  assert.deepEqual(Object.values(facets).sort(), Array(6).fill(4));
  assert.deepEqual(reverseDimensions, { avoidance: 8, anxiety: 2 });
});

test('随机四档答案不会再大比例坍缩成安全型', () => {
  let seed = 20260818;
  const random = () => {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const values = [1, 2, 4, 5];
  const counts = { secure: 0, anxious: 0, avoidant: 0, 'fearful-avoidant': 0 };
  const samples = 20000;
  for (let sample = 0; sample < samples; sample += 1) {
    const answers = assessments.attachment.questions.map(() => values[Math.floor(random() * values.length)]);
    counts[scoreAssessment('attachment', answers).typeCode] += 1;
  }
  Object.entries(counts).forEach(([type, count]) => {
    const ratio = count / samples;
    assert.ok(ratio >= 0.15 && ratio <= 0.35, `${type}: ${ratio}`);
  });
});

test('恋爱状态为 20 题，五个关系资源各四题且各有反向题', () => {
  assert.equal(assessments.relationship.questions.length, 20);
  const dimensions = {};
  const reversed = {};
  assessments.relationship.questions.forEach((question) => {
    dimensions[question.dimension] = (dimensions[question.dimension] || 0) + 1;
    if (question.reverse) reversed[question.dimension] = (reversed[question.dimension] || 0) + 1;
    assert.ok(Array.isArray(question.references) && question.references.length > 0, question.id);
  });
  assert.deepEqual(Object.values(dimensions).sort(), Array(5).fill(4));
  assert.deepEqual(Object.values(reversed).sort(), Array(5).fill(1));
});

test('恋爱状态五项平分时输出均衡画像，不伪造最强或最弱维度', () => {
  const assessment = assessments.relationship;
  for (const target of [1, 2, 3, 4, 5]) {
    const answers = assessment.questions.map((question) => question.reverse ? 6 - target : target);
    const result = scoreAssessment('relationship', answers);
    assert.match(result.tags.join(' '), /五项相对均衡/);
    assert.doesNotMatch(result.summary, /最稳|最弱|更值得照顾的一处/);
    assert.ok(result.ruleIds.some((ruleId) => ruleId.startsWith('RC_BALANCED_')));
  }
});

test('恋爱状态同时组合整体状态、支点和两处风险', () => {
  const assessment = assessments.relationship;
  const scoresFor = { commitment: 5, appreciation: 4, response: 2, repair: 1, trust: 1 };
  const answers = assessment.questions.map((question) => {
    const target = scoresFor[question.dimension];
    return question.reverse ? 6 - target : target;
  });
  const result = scoreAssessment('relationship', answers);
  assert.equal(result.typeCode, 'depleted');
  assert.equal(result.title, '冲突之后，连接很难安全地回来');
  assert.deepEqual(result.metricKeys, ['commitment', 'trust', 'repair']);
  assert.match(result.insights[0].body, /共同投入/);
  assert.match(result.insights[0].body, /信任与边界/);
  assert.match(result.insights[0].body, /冲突修复/);
});

test('恋爱状态按得分最高的两种关系资源选择对应主视觉', () => {
  const assessment = assessments.relationship;
  const expected = {
    commitment_appreciation: ['commitment', 'appreciation'],
    appreciation_response: ['appreciation', 'response'],
    commitment_response: ['commitment', 'response'],
    commitment_repair: ['commitment', 'repair']
  };
  Object.entries(expected).forEach(([visualCode, strongest]) => {
    const answers = assessment.questions.map((question) => {
      const target = strongest.includes(question.dimension) ? 5 : 3;
      return question.reverse ? 6 - target : target;
    });
    const result = scoreAssessment('relationship', answers);
    assert.equal(result.visualCode, visualCode);
  });
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

test('依恋四个主类型下保留九种可见的当前画像', () => {
  const cases = [
    ['secure', 'low_low', 1, 1],
    ['secure', 'mid_low', 3, 1],
    ['secure', 'low_mid', 1, 3],
    ['anxious', 'high_low', 5, 1],
    ['anxious', 'high_mid', 5, 3],
    ['avoidant', 'low_high', 1, 5],
    ['avoidant', 'mid_high', 3, 5],
    ['fearful-avoidant', 'high_high', 5, 5]
  ];
  const profiles = new Map();
  cases.forEach(([typeCode, profileKey, anxietyTarget, avoidanceTarget]) => {
    const answers = assessments.attachment.questions.map((question) => {
      const target = question.dimension === 'anxiety' ? anxietyTarget : avoidanceTarget;
      return question.reverse ? 6 - target : target;
    });
    const result = scoreAssessment('attachment', answers);
    assert.equal(result.typeCode, typeCode);
    assert.equal(result.profileKey, profileKey);
    assert.match(result.summary, new RegExp(result.profileTitle));
    profiles.set(result.profileKey, result.profileTitle);
  });

  const dimensionIndexes = { anxiety: 0, avoidance: 0 };
  const softFearfulAnswers = assessments.attachment.questions.map((question) => {
    const target = dimensionIndexes[question.dimension] < 3 ? 4 : 3;
    dimensionIndexes[question.dimension] += 1;
    return question.reverse ? 6 - target : target;
  });
  const softFearful = scoreAssessment('attachment', softFearfulAnswers);
  assert.equal(softFearful.typeCode, 'fearful-avoidant');
  assert.equal(softFearful.profileKey, 'mid_mid');
  assert.match(softFearful.summary, /靠近和退后都会出现/);
  profiles.set(softFearful.profileKey, softFearful.profileTitle);

  assert.equal(profiles.size, 9);
  assert.equal(new Set(profiles.values()).size, 9);
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
  assert.equal(report.matchScore, undefined);
  assert.match(report.summary, /没有匹配百分比/);
  assert.equal(report.dimensions.length, 6);
  assert.equal(report.cards.length, 4);
  assert.ok(report.cards.some((card) => card.ruleId === 'CM15'));
});

test('双人地图不会把完全相同的依恋分数写成差异', () => {
  const cognitiveScores = { EI: -0.4, NS: 0.2, TF: -0.1, JP: 0.3 };
  const versions = { c: assessments.cognitive.version, a: assessments.attachment.version };
  const payload = (attachment) => ({ v: 2, c: cognitiveScores, a: attachment, versions });
  const secure = createCoupleReport(payload({ anxiety: 25, avoidance: 25 }), payload({ anxiety: 25, avoidance: 25 }));
  assert.equal(secure.profileName, '同频安稳');
  assert.equal(secure.cards[1].ruleId, 'CM16');
  assert.doesNotMatch(secure.cards[1].title + secure.cards[1].body, /不同|一个人.*另一个人/);

  const fearful = createCoupleReport(payload({ anxiety: 75, avoidance: 75 }), payload({ anxiety: 75, avoidance: 75 }));
  assert.equal(fearful.profileName, '同步拉扯');
  assert.equal(fearful.cards[1].ruleId, 'CM17');
  assert.match(fearful.cards[1].body, /你们都/);
});

test('双人地图把同方向认知差异写成强度不同，而不是相反偏好', () => {
  const versions = { c: assessments.cognitive.version, a: assessments.attachment.version };
  const mine = { v: 2, c: { EI: -0.9, NS: 0, TF: 0, JP: 0 }, a: { anxiety: 25, avoidance: 25 }, versions };
  const theirs = { v: 2, c: { EI: -0.1, NS: 0, TF: 0, JP: 0 }, a: { anxiety: 25, avoidance: 25 }, versions };
  const report = createCoupleReport(mine, theirs);
  assert.equal(report.cards[2].ruleId, 'CM19');
  assert.match(report.cards[2].body, /都需要安静整理/);
  assert.doesNotMatch(report.cards[2].body, /一个人.*互动.*另一个人.*安静/);
});

test('双人结果码只携带地图实际使用的思考与依恋分数', () => {
  const cognitive = scoreAssessment('cognitive', assessments.cognitive.questions.map((_, index) => (index % 4) + 1), assessments.cognitive.questions.map((question) => question.id));
  const attachment = scoreAssessment('attachment', assessments.attachment.questions.map(() => 4));
  const bigfive = scoreAssessment('bigfive', assessments.bigfive.questions.map(() => 4));
  const relationship = scoreAssessment('relationship', assessments.relationship.questions.map(() => 4));
  const decoded = parseShareCode(createShareCode([cognitive, attachment, bigfive, relationship]));
  assert.deepEqual(Object.keys(decoded).sort(), ['a', 'c', 'v', 'versions']);
  assert.deepEqual(Object.keys(decoded.versions).sort(), ['a', 'c']);
});
