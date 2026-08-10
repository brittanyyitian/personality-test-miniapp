const RESULT_KEY = 'mind_results_v1';
const { assessments } = require('../data/assessments');
const { scoreAssessment } = require('./scoring');

function normalizeResult(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.assessmentId !== 'cognitive') return result;
  return {
    ...result,
    summary: String(result.summary || '').replace(/\s*其中有些方向很接近中间，说明你会随场景切换。?/, ''),
    reminder: '把结果当作一张观察自己的地图，而不是必须维持的人设。你随时可以使用不那么习惯的那一面。'
  };
}

function getResults() {
  let stored;
  try {
    stored = wx.getStorageSync(RESULT_KEY);
  } catch (error) {
    return [];
  }
  const records = Array.isArray(stored)
    ? stored
    : stored && Array.isArray(stored.results) ? stored.results : [];
  const normalized = records.map(normalizeResult).filter(Boolean);
  let changed = false;
  const upgrade = (result, cognitiveBaseline) => {
    const assessment = assessments[result.assessmentId];
    const answers = Array.isArray(result.answers) ? result.answers : null;
    const needsUpgrade = assessment && answers && answers.length === assessment.questions.length
      && (result.version !== assessment.version || !Array.isArray(result.insights));
    if (!needsUpgrade) return result;
    try {
      const questionIds = Array.isArray(result.questionIds) && result.questionIds.length === answers.length
        ? result.questionIds
        : assessment.questions.map((question) => question.id);
      const rescored = scoreAssessment(result.assessmentId, answers, questionIds, cognitiveBaseline);
      changed = true;
      return {
        ...result,
        ...rescored,
        id: result.id,
        completedAt: result.completedAt,
        answers: answers.slice(),
        questionIds: questionIds.slice(),
        copyVersion: '0.2.0',
        scoringVersion: rescored.version
      };
    } catch (error) {
      return result;
    }
  };
  const withCognitive = normalized.map((result) => result.assessmentId === 'cognitive' ? upgrade(result, null) : result);
  const cognitiveBaseline = withCognitive.find((result) => result.assessmentId === 'cognitive') || null;
  const upgraded = withCognitive.map((result) => result.assessmentId === 'cognitive' ? result : upgrade(result, cognitiveBaseline));
  if (changed) {
    try {
      wx.setStorageSync(RESULT_KEY, upgraded);
    } catch (error) {
      // 迁移失败不阻断读取；结果仍可在本次页面中使用新文案。
    }
  }
  return upgraded;
}

function saveResult(result) {
  if (!result || !result.assessmentId) throw new Error('结果数据不完整');
  const results = getResults();
  const idBase = `${result.assessmentId}_${Date.now()}`;
  let id = idBase;
  let suffix = 1;
  while (results.some((item) => item.id === id)) {
    id = `${idBase}_${suffix}`;
    suffix += 1;
  }
  const record = {
    ...result,
    id,
    completedAt: new Date().toISOString(),
    copyVersion: '0.2.0',
    scoringVersion: result.version || '0.1.0'
  };
  wx.setStorageSync(RESULT_KEY, [record, ...results].slice(0, 50));
  return record;
}

function getResult(id) {
  if (id === undefined || id === null || id === '') return null;
  const target = String(id);
  return getResults().find((result) => String(result.id) === target) || null;
}

function getLatestByAssessment(assessmentId) {
  return getResults().find((result) => result.assessmentId === assessmentId) || null;
}

function deleteResult(id) {
  wx.setStorageSync(RESULT_KEY, getResults().filter((result) => result.id !== id));
}

function saveDraft(assessmentId, draft) {
  try {
    wx.setStorageSync(`mind_draft_${assessmentId}`, draft);
    return true;
  } catch (error) {
    return false;
  }
}

function getDraft(assessmentId) {
  try {
    const draft = wx.getStorageSync(`mind_draft_${assessmentId}`);
    return draft && typeof draft === 'object' ? draft : null;
  } catch (error) {
    return null;
  }
}

function clearDraft(assessmentId) {
  try {
    wx.removeStorageSync(`mind_draft_${assessmentId}`);
  } catch (error) {
    // 结果已经保存时，草稿清理失败不应阻断结果页。
  }
}

module.exports = {
  getResults,
  saveResult,
  getResult,
  getLatestByAssessment,
  deleteResult,
  saveDraft,
  getDraft,
  clearDraft
};
