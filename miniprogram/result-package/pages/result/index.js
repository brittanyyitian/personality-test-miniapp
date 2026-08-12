const { getResult, getResults, getLatestByAssessment } = require('../../../utils/storage');
const { PIECES, getPiece, getResultVisual, resultKeyword, buildMetrics, buildResultStory } = require('../../../utils/puzzle');
const { getCoupleReadiness } = require('../../../utils/couple');

function isKnownAssessment(id) {
  return PIECES.some((piece) => piece.id === id);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

function introPath(options) {
  const assessmentId = isKnownAssessment(options.id) ? options.id : '';
  if (!assessmentId) return '';
  const name = encodeURIComponent(safeDecode(options.name) || '新的一面');
  return `/pages/intro/index?id=${encodeURIComponent(assessmentId)}&from=share&name=${name}`;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = String(text || '').split('');
  let line = '';
  let lines = 0;
  let cursorY = y;
  chars.forEach((char) => {
    if (lines >= maxLines) return;
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
      lines += 1;
    } else {
      line = test;
    }
  });
  if (line && lines < maxLines) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function latestResultsByAssessment() {
  const latest = {};
  getResults().forEach((result) => {
    if (!latest[result.assessmentId]) latest[result.assessmentId] = result;
  });
  return latest;
}

Page({
  data: {
    result: null,
    piece: null,
    visual: null,
    pieces: [],
    metrics: [],
    story: null,
    displayTitle: '',
    resonance: '',
    completedCount: 0,
    pieceNumber: 1,
    nextPiece: null,
    coupleNext: null,
    returnToCouple: false,
    stage: 'reveal'
  },

  onLoad(options) {
    if (options.from === 'share') {
      const path = introPath(options);
      if (path) {
        wx.redirectTo({ url: path });
        return;
      }
    }

    const fallbackAssessment = isKnownAssessment(options.assessment) ? options.assessment : '';
    const result = getResult(options.id) || (fallbackAssessment ? getLatestByAssessment(fallbackAssessment) : null);
    if (!result || !isKnownAssessment(result.assessmentId)) {
      wx.showToast({ title: '这份结果已经不在本机', icon: 'none' });
      this.returnTimer = setTimeout(() => wx.reLaunch({ url: '/pages/home/index' }), 700);
      return;
    }

    const latest = latestResultsByAssessment();
    latest[result.assessmentId] = result;
    const pieces = PIECES.map((piece) => ({
      ...piece,
      done: Boolean(latest[piece.id]),
      keyword: latest[piece.id] ? resultKeyword(latest[piece.id]) : ''
    }));
    const completedCount = pieces.filter((piece) => piece.done).length;
    const currentIndex = PIECES.findIndex((piece) => piece.id === result.assessmentId);
    const nextPiece = pieces.find((piece) => !piece.done) || null;
    const returnToCouple = options.return === 'couple';
    const readiness = getCoupleReadiness(Object.values(latest));
    const coupleNext = !readiness.cognitive
      ? PIECES.find((piece) => piece.id === 'cognitive')
      : !readiness.attachment ? PIECES.find((piece) => piece.id === 'attachment') : null;
    const visual = getResultVisual(result);
    const displayTitle = (visual && visual.title) || resultKeyword(result) || '新的一面';
    const resonanceSource = String(result.summary || result.shareLine || '').trim();
    const resonance = resonanceSource
      ? (resonanceSource.length > 118 ? `${resonanceSource.slice(0, 118)}…` : resonanceSource)
      : '这是一块关于你的当前观察，也可以在以后重新拼一次。';

    this.setData({
      result,
      piece: getPiece(result.assessmentId),
      visual,
      pieces,
      metrics: buildMetrics(result),
      story: buildResultStory(result),
      displayTitle,
      resonance,
      completedCount,
      pieceNumber: currentIndex + 1,
      nextPiece,
      coupleNext,
      returnToCouple,
      nextActionText: returnToCouple
        ? (coupleNext ? `继续完成${coupleNext.name}` : '生成两个人的相处地图')
        : (nextPiece ? '继续拼下一块' : '回到我的拼图'),
      stage: options.view === 'core' ? 'core' : 'reveal'
    });

    if (options.view !== 'core') {
      this.revealTimer = setTimeout(() => this.setData({ stage: 'core' }), 1800);
    }
  },

  onUnload() {
    if (this.revealTimer) clearTimeout(this.revealTimer);
    if (this.returnTimer) clearTimeout(this.returnTimer);
    if (this.posterSaving) {
      this.posterSaving = false;
      wx.hideLoading();
    }
  },

  showCore() {
    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.setData({ stage: 'core' });
  },

  showShare() {
    this.setData({ stage: 'share' });
  },

  continueNext() {
    if (this.data.returnToCouple) {
      if (this.data.coupleNext) {
        wx.redirectTo({ url: `/pages/quiz/index?id=${encodeURIComponent(this.data.coupleNext.id)}&return=couple` });
        return;
      }
      wx.navigateBack({
        delta: 1,
        fail: () => wx.redirectTo({ url: '/pages/couple/index' })
      });
      return;
    }
    const next = this.data.nextPiece;
    if (!next) {
      wx.reLaunch({ url: '/pages/home/index' });
      return;
    }
    wx.redirectTo({ url: `/pages/quiz/index?id=${encodeURIComponent(next.id)}` });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' });
  },

  openCouple() {
    wx.navigateTo({ url: '/pages/couple/index' });
  },

  openSources() {
    if (!this.data.result || !isKnownAssessment(this.data.result.assessmentId)) return;
    wx.navigateTo({ url: `/pages/sources/index?id=${encodeURIComponent(this.data.result.assessmentId)}` });
  },

  savePoster() {
    const { result, piece, displayTitle, resonance } = this.data;
    if (!result || !piece || this.posterSaving) return;
    this.posterSaving = true;
    wx.showLoading({ title: '正在生成' });
    wx.getImageInfo({
      src: piece.image,
      success: ({ path }) => this.drawPoster(path, displayTitle, resonance),
      fail: () => this.drawPoster('', displayTitle, resonance)
    });
  },

  drawPoster(imagePath, displayTitle, resonance) {
    const ctx = wx.createCanvasContext('sharePoster', this);
    ctx.setFillStyle('#F2EBFB');
    ctx.fillRect(0, 0, 750, 1334);
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(48, 150, 654, 870);
    ctx.setFillStyle('#77736C');
    ctx.setFontSize(22);
    ctx.fillText(`PIECE ${String(this.data.pieceNumber).padStart(2, '0')}`, 88, 210);
    if (imagePath) ctx.drawImage(imagePath, 405, 118, 280, 280);
    ctx.setFillStyle('#11110F');
    ctx.setFontSize(48);
    ctx.fillText(displayTitle, 88, 330);
    ctx.setFillStyle('#37342F');
    ctx.setFontSize(29);
    drawWrappedText(ctx, resonance, 88, 430, 540, 48, 4);
    ctx.setFillStyle('#F47716');
    ctx.fillRect(88, 808, 58, 58);
    ctx.setFillStyle('#B69AEF');
    ctx.fillRect(162, 808, 58, 58);
    ctx.setFillStyle('#EAE5D9');
    ctx.fillRect(236, 808, 58, 58);
    ctx.fillRect(310, 808, 58, 58);
    ctx.fillRect(384, 808, 58, 58);
    ctx.setFillStyle('#11110F');
    ctx.setFontSize(34);
    ctx.fillText('你会拼出什么？', 72, 1100);
    ctx.setFillStyle('#77736C');
    ctx.setFontSize(24);
    ctx.fillText('来试试吧。', 72, 1145);
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'sharePoster',
          width: 750,
          height: 1334,
          destWidth: 1500,
          destHeight: 2668,
          fileType: 'png',
          success: ({ tempFilePath }) => {
            wx.saveImageToPhotosAlbum({
              filePath: tempFilePath,
              success: () => wx.showToast({ title: '已保存到相册' }),
              fail: () => wx.showToast({ title: '需要相册权限才能保存', icon: 'none' }),
              complete: () => {
                this.posterSaving = false;
                wx.hideLoading();
              }
            });
          },
          fail: () => {
            this.posterSaving = false;
            wx.hideLoading();
            wx.showToast({ title: '生成失败，请再试一次', icon: 'none' });
          }
        }, this);
      }, 120);
    });
  },

  sharePath() {
    if (!this.data.result || !isKnownAssessment(this.data.result.assessmentId)) return '/pages/home/index';
    const name = encodeURIComponent(this.data.displayTitle);
    return `/pages/intro/index?id=${this.data.result.assessmentId}&from=share&name=${name}`;
  },

  onShareAppMessage() {
    if (!this.data.result) {
      return { title: '你会拼出什么？', path: '/pages/home/index' };
    }
    return {
      title: `我拼出了「${this.data.displayTitle}」，那你呢？`,
      path: this.sharePath()
    };
  },

  onShareTimeline() {
    if (!this.data.result) return { title: '你会拼出什么？' };
    const name = encodeURIComponent(this.data.displayTitle);
    return {
      title: `我拼出了「${this.data.displayTitle}」，那你呢？`,
      query: `id=${this.data.result.assessmentId}&from=share&name=${name}`
    };
  }
});
