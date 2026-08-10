const { assessments } = require('../../data/assessments');
const { getLatestByAssessment } = require('../../utils/storage');
const { PIECES, resultKeyword } = require('../../utils/puzzle');

Page({
  data: {
    pieces: [],
    completedCount: 0,
    recommendation: null
  },

  onShow() {
    this.refreshPuzzle();
  },

  refreshPuzzle() {
    const pieces = PIECES.map((piece, index) => {
      const result = getLatestByAssessment(piece.id);
      return {
        ...piece,
        index,
        done: Boolean(result),
        resultId: result ? result.id : '',
        keyword: result ? resultKeyword(result) : ''
      };
    });
    const completedCount = pieces.filter((piece) => piece.done).length;
    const target = pieces.find((piece) => !piece.done) || null;
    const assessment = target ? assessments[target.id] : null;
    this.setData({
      pieces,
      completedCount,
      recommendation: target && assessment ? {
        id: target.id,
        title: assessment.intro.split('。')[0],
        duration: assessment.duration
      } : null
    });
  },

  openPiece(event) {
    const { id, resultId } = event.currentTarget.dataset;
    const piece = this.data.pieces.find((item) => item.id === id);
    if (!piece) return;
    if (piece.done) {
      const resultQuery = resultId
        ? `id=${encodeURIComponent(resultId)}`
        : `assessment=${encodeURIComponent(id)}`;
      wx.navigateTo({ url: `/pages/result/index?${resultQuery}&view=core` });
      return;
    }
    wx.navigateTo({ url: `/pages/quiz/index?id=${encodeURIComponent(id)}` });
  },

  openRecommendation() {
    const target = this.data.recommendation;
    if (!target) return;
    if (!assessments[target.id]) return;
    wx.navigateTo({ url: `/pages/quiz/index?id=${encodeURIComponent(target.id)}` });
  }
});
