const { assessments } = require('../../data/assessments');
const { scoreAssessment } = require('../../utils/scoring');
const { saveDraft, getDraft, clearDraft, saveResult, getLatestByAssessment } = require('../../utils/storage');
const { getPiece } = require('../../utils/puzzle');

function displayOptions(options) {
  if (!Array.isArray(options)) return [];
  const values = options.length === 5 ? [1, 2, 4, 5] : options.map((_, index) => index + 1);
  return values.map((value) => ({ value, label: options[value - 1] }));
}

function isValidAnswer(value) {
  const answer = Number(value);
  return Number.isInteger(answer) && answer >= 1 && answer <= 5;
}

function restoreDraft(draft, questionCount) {
  const source = draft && Array.isArray(draft.answers) ? draft.answers : [];
  const answers = source.slice(0, questionCount).map((answer) => (isValidAnswer(answer) ? Number(answer) : 0));
  while (answers.length < questionCount) answers.push(0);
  const requested = draft && Number.isInteger(Number(draft.current)) ? Number(draft.current) : 0;
  const safeCurrent = Math.max(0, Math.min(requested, questionCount - 1));
  const firstMissing = answers.findIndex((answer) => !isValidAnswer(answer));
  return {
    answers,
    current: firstMissing >= 0 && firstMissing < safeCurrent ? firstMissing : safeCurrent
  };
}

Page({
  data: {
    assessment: null,
    piece: null,
    questions: [],
    options: [],
    answers: [],
    current: 0,
    question: null,
    selected: 0,
    progress: 0,
    progressText: '',
    phase: 0,
    transitioning: false,
    finishing: false
  },

  onLoad(options) {
    const assessment = assessments[options.id];
    if (!assessment) {
      wx.reLaunch({ url: '/pages/home/index' });
      return;
    }
    const questions = assessment.questions;
    const restored = restoreDraft(getDraft(assessment.id), questions.length);
    this.advanceSequence = 0;
    this.submitting = false;
    this.unloaded = false;
    this.returnTarget = options.return === 'couple' ? 'couple' : '';
    this.setData({
      assessment,
      piece: getPiece(assessment.id),
      questions,
      options: displayOptions(assessment.options),
      answers: restored.answers,
      current: restored.current
    }, () => this.syncQuestion());
  },

  onUnload() {
    this.unloaded = true;
    this.cancelAdvance();
  },

  cancelAdvance() {
    this.advanceSequence = (this.advanceSequence || 0) + 1;
    if (this.nextTimer) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
    }
  },

  syncQuestion() {
    const { questions, current, answers } = this.data;
    const question = questions[current];
    const progress = Math.round(((current + 1) / questions.length) * 100);
    this.setData({
      question,
      selected: Number(answers[current]) || 0,
      progress,
      progressText: `${String(current + 1).padStart(2, '0')} / ${questions.length}`,
      phase: Math.min(3, Math.floor(progress / 26)),
      transitioning: false
    });
  },

  selectAnswer(event) {
    if (this.data.transitioning || this.data.finishing) return;
    const value = Number(event.currentTarget.dataset.value);
    if (!this.data.options.some((option) => option.value === value)) return;
    const answers = this.data.answers.slice();
    answers[this.data.current] = value;
    this.setData({ answers, selected: value, transitioning: true });
    saveDraft(this.data.assessment.id, { answers, current: this.data.current, updatedAt: Date.now() });
    const sequence = (this.advanceSequence || 0) + 1;
    this.advanceSequence = sequence;
    const expectedCurrent = this.data.current;
    this.nextTimer = setTimeout(() => {
      this.nextTimer = null;
      if (this.unloaded || sequence !== this.advanceSequence || expectedCurrent !== this.data.current) return;
      this.advance();
    }, 220);
  },

  exitOrPrevious() {
    if (this.data.finishing) return;
    this.cancelAdvance();
    if (this.data.current === 0) {
      wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/home/index' }) });
      return;
    }
    const previous = this.data.current - 1;
    saveDraft(this.data.assessment.id, { answers: this.data.answers, current: previous, updatedAt: Date.now() });
    this.setData({ current: previous, transitioning: false }, () => this.syncQuestion());
  },

  advance() {
    if (this.data.finishing) return;
    const { assessment, questions, answers, current } = this.data;
    if (current < questions.length - 1) {
      const next = current + 1;
      this.setData({ current: next }, () => {
        saveDraft(assessment.id, { answers, current: next, updatedAt: Date.now() });
        this.syncQuestion();
      });
      return;
    }
    this.finish();
  },

  finish() {
    if (this.submitting) return;
    if (this.savedResultId) {
      this.openSavedResult();
      return;
    }
    this.submitting = true;
    this.setData({ finishing: true });
    try {
      const questionIds = this.data.questions.map((question) => question.id);
      const cognitiveBaseline = this.data.assessment.id === 'cognitive' ? null : getLatestByAssessment('cognitive');
      const result = scoreAssessment(this.data.assessment.id, this.data.answers, questionIds, cognitiveBaseline);
      const saved = saveResult({ ...result, questionIds, answers: this.data.answers.slice() });
      this.savedResultId = saved.id;
      clearDraft(this.data.assessment.id);
      this.openSavedResult();
    } catch (error) {
      this.submitting = false;
      this.setData({ finishing: false, transitioning: false });
      wx.showToast({ title: error.message || '还有题目没有完成', icon: 'none' });
    }
  },

  openSavedResult() {
    if (!this.savedResultId) return;
    this.submitting = true;
    this.setData({ finishing: true });
    const returnQuery = this.returnTarget === 'couple' ? '&return=couple' : '';
    wx.redirectTo({
      url: `/result-package/pages/result/index?id=${encodeURIComponent(this.savedResultId)}${returnQuery}`,
      fail: () => {
        this.submitting = false;
        this.setData({ finishing: false, transitioning: false });
        wx.showToast({ title: '结果已保存，请再试一次', icon: 'none' });
      }
    });
  }
});
