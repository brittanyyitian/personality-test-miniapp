const { getResults } = require('../../utils/storage');
const { compactResult, createShareCode, parseShareCode, createCoupleReport, getCoupleReadiness } = require('../../utils/couple');

Page({
  data: {
    shareCode: '',
    inputCode: '',
    hasResults: false,
    readiness: { cognitive: false, attachment: false },
    report: null
  },

  onLoad(options) {
    let inputCode = '';
    try {
      inputCode = decodeURIComponent(options.code || '').trim();
    } catch (error) {
      inputCode = String(options.code || '').trim();
    }
    if (inputCode) this.setData({ inputCode });
  },

  onShow() {
    const results = getResults();
    const readiness = getCoupleReadiness(results);
    const hasResults = readiness.cognitive && readiness.attachment;
    this.results = results;
    this.setData({ hasResults, readiness, shareCode: hasResults ? createShareCode(results) : '' });
  },

  updateCode(event) {
    this.setData({ inputCode: event.detail.value });
  },

  copyCode() {
    if (!this.data.shareCode) return;
    wx.setClipboardData({ data: this.data.shareCode });
  },

  createReport() {
    try {
      const theirs = parseShareCode(this.data.inputCode);
      const mine = compactResult(this.results);
      const report = createCoupleReport(mine, theirs);
      this.setData({ report });
    } catch (error) {
      wx.showToast({ title: error.message || '结果码无法读取', icon: 'none' });
    }
  },

  goAssessment(event) {
    wx.navigateTo({ url: `/pages/quiz/index?id=${event.currentTarget.dataset.id}&return=couple` });
  },

  onShareAppMessage() {
    if (!this.data.shareCode) {
      return { title: '一起看看我们的相处地图', path: '/pages/home/index' };
    }
    return {
      title: '把我的拼图拼进来，看看我们怎么相处',
      path: `/pages/couple/index?code=${encodeURIComponent(this.data.shareCode)}`
    };
  }
});
