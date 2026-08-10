const { assessments } = require('../../data/assessments');
const { getPiece } = require('../../utils/puzzle');

function safeDecode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

Page({
  data: {
    assessment: null,
    piece: null,
    friendResult: ''
  },

  onLoad(options) {
    const assessment = assessments[options.id];
    if (!assessment) {
      wx.showToast({ title: '这个测试暂时不可用', icon: 'none' });
      this.returnTimer = setTimeout(() => wx.reLaunch({ url: '/pages/home/index' }), 500);
      return;
    }
    this.setData({
      assessment,
      piece: getPiece(assessment.id),
      friendResult: safeDecode(options.name) || '新的一面'
    });
  },

  onUnload() {
    if (this.returnTimer) clearTimeout(this.returnTimer);
  },

  start() {
    if (!this.data.assessment || this.starting) return;
    this.starting = true;
    wx.redirectTo({
      url: `/pages/quiz/index?id=${encodeURIComponent(this.data.assessment.id)}`,
      fail: () => {
        this.starting = false;
        wx.showToast({ title: '暂时无法开始，请再试一次', icon: 'none' });
      }
    });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' });
  }
});
