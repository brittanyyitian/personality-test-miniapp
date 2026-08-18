const { getResults } = require('../../utils/storage');
const { compactResult, createShareCode, parseShareCode, createCoupleReport, getCoupleReadiness } = require('../../utils/couple');

const INVITE_STORAGE_KEY = 'mind_couple_invite_v1';
const PRIMARY_SCORE_KEYS = ['attachment-anxiety', 'attachment-avoidance', 'cognitive-EI'];

function visibleScoreDimensions(report, expanded) {
  const dimensions = Array.isArray(report?.dimensions) ? report.dimensions : [];
  return expanded ? dimensions : dimensions.filter((item) => PRIMARY_SCORE_KEYS.includes(item.key));
}

function readStoredInvite() {
  try {
    return String(wx.getStorageSync(INVITE_STORAGE_KEY) || '').trim();
  } catch (error) {
    return '';
  }
}

function storeInvite(code) {
  try {
    if (code) wx.setStorageSync(INVITE_STORAGE_KEY, code);
    else wx.removeStorageSync(INVITE_STORAGE_KEY);
  } catch (error) {
    // 邀请仍保留在当前页面栈中；持久化失败不阻断主流程。
  }
}

Page({
  data: {
    shareCode: '',
    inputCode: '',
    hasIncomingInvite: false,
    showCodePanel: false,
    hasResults: false,
    readiness: { cognitive: false, attachment: false },
    missingCount: 2,
    nextRequirement: null,
    invitePrepared: false,
    pageEyebrow: '先完成自己',
    pageTitle: '先准备好你的一半',
    pageIntro: '双人拼图需要「思考模式 + 依恋模式」。完成后才能生成邀请。',
    scoreExpanded: false,
    report: null
  },

  onLoad(options = {}) {
    let inputCode = '';
    try {
      inputCode = decodeURIComponent(options.code || '').trim();
    } catch (error) {
      inputCode = String(options.code || '').trim();
    }
    if (!inputCode) inputCode = readStoredInvite();
    if (inputCode) {
      storeInvite(inputCode);
      this.setData({ inputCode, hasIncomingInvite: true });
    }
  },

  onShow() {
    const results = getResults();
    const readiness = getCoupleReadiness(results);
    const hasResults = readiness.cognitive && readiness.attachment;
    const nextRequirement = !readiness.cognitive
      ? { id: 'cognitive', name: '思考模式', duration: '约 6 分钟' }
      : !readiness.attachment ? { id: 'attachment', name: '依恋模式', duration: '约 4 分钟' } : null;
    const missingCount = Number(!readiness.cognitive) + Number(!readiness.attachment);
    const hasIncomingInvite = this.data.hasIncomingInvite;
    const pageEyebrow = hasIncomingInvite ? 'TA 的邀请' : hasResults ? '邀请 TA' : '先完成自己';
    const pageTitle = hasIncomingInvite ? 'TA 把一半拼图，留给了你' : hasResults ? '你的一半，已经准备好了' : '先准备好你的一半';
    const pageIntro = hasIncomingInvite
      ? (hasResults
        ? '你们两边都准备好了。点击下方按钮，就能在这台设备上生成相处地图。'
        : '补上你的思考模式和依恋模式，就能在这台设备上生成你们的相处地图。')
      : hasResults
        ? '把这份邀请发给 TA。TA 补完自己的两块后，就会看到你们哪里同频、哪里容易错频道。'
        : `双人拼图需要「思考模式 + 依恋模式」。你还差 ${missingCount} 块，完成后才能生成邀请。`;
    this.results = results;
    this.setData({
      hasResults,
      readiness,
      missingCount,
      nextRequirement,
      pageEyebrow,
      pageTitle,
      pageIntro,
      shareCode: hasResults ? createShareCode(results) : ''
    });
  },

  updateCode(event) {
    this.setData({ inputCode: event.detail.value });
  },

  toggleCodePanel() {
    this.setData({ showCodePanel: !this.data.showCodePanel });
  },

  copyCode() {
    if (!this.data.shareCode) return;
    wx.setClipboardData({ data: this.data.shareCode });
  },

  createReport() {
    if (!this.data.inputCode.trim()) {
      wx.showToast({ title: '还没有收到对方的拼图', icon: 'none' });
      return;
    }
    try {
      const theirs = parseShareCode(this.data.inputCode);
      const mine = compactResult(this.results);
      const report = createCoupleReport(mine, theirs);
      this.setData({
        report: { ...report, visibleDimensions: visibleScoreDimensions(report, false) },
        scoreExpanded: false
      });
    } catch (error) {
      wx.showToast({ title: error.message || '结果码无法读取', icon: 'none' });
    }
  },

  resetReport() {
    storeInvite('');
    this.setData(
      { report: null, inputCode: '', hasIncomingInvite: false, showCodePanel: false, invitePrepared: false, scoreExpanded: false },
      () => this.onShow()
    );
  },

  toggleScoreDimensions() {
    if (!this.data.report) return;
    const scoreExpanded = !this.data.scoreExpanded;
    this.setData({
      scoreExpanded,
      report: {
        ...this.data.report,
        visibleDimensions: visibleScoreDimensions(this.data.report, scoreExpanded)
      }
    });
  },

  prepareInvite() {
    this.setData({ invitePrepared: true });
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
      path: `/pages/couple/index?code=${encodeURIComponent(this.data.shareCode)}`,
      success: () => this.setData({ invitePrepared: true })
    };
  }
});
