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

function drawRoundRect(ctx, x, y, width, height, radius, fill) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
  ctx.setFillStyle(fill);
  ctx.fill();
}

function drawImageContain(ctx, imageInfo, x, y, width, height) {
  if (!imageInfo || !imageInfo.path || !imageInfo.width || !imageInfo.height) return;
  const scale = Math.min(width / imageInfo.width, height / imageInfo.height);
  const drawWidth = imageInfo.width * scale;
  const drawHeight = imageInfo.height * scale;
  ctx.drawImage(imageInfo.path, x + ((width - drawWidth) / 2), y + ((height - drawHeight) / 2), drawWidth, drawHeight);
}

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    wx.getImageInfo({
      src,
      success: resolve,
      fail: () => resolve(null)
    });
  });
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
    sharePosterPath: '',
    sharePosterLoading: false,
    fullReportPath: '',
    fullReportLoading: false,
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
    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.setData({ stage: 'share' });
    this.prepareSharePoster();
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

  restartAssessment() {
    const result = this.data.result;
    if (!result || !isKnownAssessment(result.assessmentId) || this.restarting) return;
    this.restarting = true;
    const returnQuery = this.data.returnToCouple ? '&return=couple' : '';
    wx.redirectTo({
      url: `/pages/quiz/index?id=${encodeURIComponent(result.assessmentId)}${returnQuery}`,
      fail: () => {
        this.restarting = false;
        wx.showToast({ title: '暂时无法重新测试', icon: 'none' });
      }
    });
  },

  openCouple() {
    wx.navigateTo({ url: '/pages/couple/index' });
  },

  openSources() {
    if (!this.data.result || !isKnownAssessment(this.data.result.assessmentId)) return;
    wx.navigateTo({ url: `/pages/sources/index?id=${encodeURIComponent(this.data.result.assessmentId)}` });
  },

  savePoster() {
    const { result, piece, sharePosterPath } = this.data;
    if (!result || !piece || this.posterSaving) return;
    if (sharePosterPath) {
      this.savePosterFile(sharePosterPath);
      return;
    }
    this.pendingPosterSave = true;
    this.prepareSharePoster();
  },

  saveFullReport() {
    const { result, visual, fullReportPath } = this.data;
    if (!result || !visual || this.fullReportGenerating || this.posterSaving) return;
    if (fullReportPath) {
      this.savePosterFile(fullReportPath);
      return;
    }
    this.fullReportGenerating = true;
    this.setData({ fullReportLoading: true });
    wx.showLoading({ title: '生成完整报告' });
    Promise.all([loadCanvasImage(visual.hero), loadCanvasImage(visual.aiIcon)])
      .then(([heroImage, aiImage]) => this.drawFullReport(heroImage, aiImage))
      .catch(() => this.finishFullReportFailure());
  },

  prepareSharePoster() {
    const { result, piece, visual, displayTitle, resonance, sharePosterPath } = this.data;
    if (!result || !piece || sharePosterPath || this.posterGenerating) return;
    this.posterGenerating = true;
    this.setData({ sharePosterLoading: true });
    const source = visual && visual.hero ? visual.hero : piece.image;
    wx.getImageInfo({
      src: source,
      success: (imageInfo) => this.drawPoster(imageInfo, displayTitle, resonance),
      fail: () => this.drawPoster(null, displayTitle, resonance)
    });
  },

  savePosterFile(filePath) {
    if (!filePath || this.posterSaving) return;
    this.posterSaving = true;
    wx.showLoading({ title: '正在保存' });
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存到相册' }),
      fail: () => wx.showToast({ title: '需要相册权限才能保存', icon: 'none' }),
      complete: () => {
        this.posterSaving = false;
        wx.hideLoading();
      }
    });
  },

  drawPoster(imageInfo, displayTitle, resonance) {
    const ctx = wx.createCanvasContext('sharePoster', this);
    const { result, visual } = this.data;
    if (visual) {
      const toneColors = { red: '#C95746', yellow: '#A87908', green: '#42775D', purple: '#705C83' };
      ctx.setFillStyle('#FFF8E8');
      ctx.fillRect(0, 0, 750, 1334);
      ctx.setFillStyle('rgba(240,73,50,.05)');
      ctx.beginPath();
      ctx.arc(652, 88, 170, 0, Math.PI * 2);
      ctx.fill();
      ctx.setFillStyle('rgba(247,196,35,.08)');
      ctx.beginPath();
      ctx.arc(70, 560, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.setFillStyle('#776F62');
      ctx.setFontSize(21);
      ctx.fillText(`PERSONALITY PUZZLE · ${result.typeCode || result.assessmentId.toUpperCase()}`, 42, 48);
      ctx.setFillStyle('#E94B35');
      ctx.fillRect(42, 62, 56, 6);
      drawImageContain(ctx, imageInfo, 30, 76, 690, 630);
      drawRoundRect(ctx, 42, 720, 666, 164, 30, 'rgba(255,253,248,.96)');
      ctx.setFillStyle('#EF4934');
      ctx.setFontSize(58);
      ctx.fillText('“', 72, 778);
      ctx.setFillStyle('#2F2B25');
      ctx.setFontSize(27);
      drawWrappedText(ctx, visual.quote || resonance, 122, 774, 530, 43, 3);
      (visual.traits || []).slice(0, 4).forEach((trait, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 42 + (column * 339);
        const y = 906 + (row * 126);
        drawRoundRect(ctx, x, y, 327, 108, 24, '#FFFDF8');
        ctx.setFillStyle(toneColors[trait.tone] || '#685F54');
        ctx.fillRect(x, y, 7, 108);
        ctx.setFontSize(24);
        ctx.fillText(String(trait.label || ''), x + 25, y + 39);
        ctx.setFillStyle('#615A50');
        ctx.setFontSize(19);
        drawWrappedText(ctx, trait.detail, x + 25, y + 72, 276, 28, 2);
      });
      ctx.setFillStyle('#26231F');
      ctx.setFontSize(28);
      ctx.fillText(`我是「${displayTitle}」`, 42, 1210);
      ctx.setFillStyle('#777063');
      ctx.setFontSize(21);
      ctx.fillText('人格不是标签，是一张继续认识自己的地图。', 42, 1248);
      ctx.setFillStyle('rgba(74,65,53,.16)');
      ctx.fillRect(42, 1276, 666, 2);
      ctx.setFillStyle('#E94B35');
      ctx.setFontSize(19);
      ctx.fillText('人格拼图', 42, 1310);
      ctx.setFillStyle('#777063');
      ctx.setFontSize(18);
      ctx.fillText('分享给朋友，看看你会拼出什么', 456, 1310);
      this.exportPosterCanvas(ctx);
      return;
    }

    ctx.setFillStyle('#F2EBFB');
    ctx.fillRect(0, 0, 750, 1334);
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(48, 150, 654, 870);
    ctx.setFillStyle('#77736C');
    ctx.setFontSize(22);
    ctx.fillText(`PIECE ${String(this.data.pieceNumber).padStart(2, '0')}`, 88, 210);
    if (imageInfo && imageInfo.path) ctx.drawImage(imageInfo.path, 405, 118, 280, 280);
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
    this.exportPosterCanvas(ctx);
  },

  drawFullReport(heroImage, aiImage) {
    const ctx = wx.createCanvasContext('fullReportPoster', this);
    const { result, visual, pieces, completedCount, displayTitle, resonance } = this.data;
    const toneColors = { red: '#C95746', yellow: '#A87908', green: '#42775D', purple: '#705C83' };

    ctx.setFillStyle('#FFF8E8');
    ctx.fillRect(0, 0, 750, 4200);
    ctx.setFillStyle('rgba(240,73,50,.045)');
    ctx.beginPath();
    ctx.arc(640, 130, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.setFillStyle('rgba(247,196,35,.07)');
    ctx.beginPath();
    ctx.arc(70, 670, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.setFillStyle('#776F62');
    ctx.setFontSize(21);
    ctx.fillText(`${result.assessmentId === 'social' ? 'FULL SOCIAL MODE REPORT' : 'FULL PERSONALITY REPORT'} · ${result.typeCode || result.assessmentId.toUpperCase()}`, 42, 48);
    ctx.setFillStyle('#E94B35');
    ctx.fillRect(42, 62, 72, 6);
    drawImageContain(ctx, heroImage, 30, 78, 690, 570);

    drawRoundRect(ctx, 42, 668, 666, 166, 30, 'rgba(255,253,248,.96)');
    ctx.setFillStyle('#EF4934');
    ctx.setFontSize(58);
    ctx.fillText('“', 72, 728);
    ctx.setFillStyle('#2F2B25');
    ctx.setFontSize(27);
    drawWrappedText(ctx, visual.quote || resonance, 122, 724, 530, 43, 3);

    (visual.traits || []).slice(0, 4).forEach((trait, index) => {
      const x = 42 + ((index % 2) * 339);
      const y = 858 + (Math.floor(index / 2) * 126);
      drawRoundRect(ctx, x, y, 327, 108, 24, '#FFFDF8');
      ctx.setFillStyle(toneColors[trait.tone] || '#685F54');
      ctx.fillRect(x, y, 7, 108);
      ctx.setFontSize(24);
      ctx.fillText(String(trait.label || ''), x + 25, y + 39);
      ctx.setFillStyle('#615A50');
      ctx.setFontSize(19);
      drawWrappedText(ctx, trait.detail, x + 25, y + 72, 276, 28, 2);
    });

    drawRoundRect(ctx, 42, 1122, 666, 350, 30, '#FFFDF8');
    ctx.setFillStyle('#27231F');
    ctx.setFontSize(30);
    ctx.fillText(visual.tendencyTitle || '人格维度', 72, 1172);
    (visual.tendencies || []).slice(0, 4).forEach((item, index) => {
      const y = 1220 + (index * 58);
      const percent = Math.max(0, Math.min(100, Number(item.percent) || 0));
      ctx.setFillStyle('#595248');
      ctx.setFontSize(20);
      ctx.fillText(String(item.label || ''), 72, y + 17);
      drawRoundRect(ctx, 226, y, 360, 16, 8, '#ECE7DC');
      drawRoundRect(ctx, 226, y, 360 * (percent / 100), 16, 8, toneColors[item.tone] || '#685F54');
      ctx.setFillStyle('#27231F');
      ctx.setFontSize(20);
      ctx.fillText(`${percent}%`, 614, y + 17);
    });

    drawRoundRect(ctx, 42, 1500, 666, 154, 30, '#F7DED1');
    ctx.setFillStyle('#E84B35');
    ctx.setFontSize(17);
    ctx.fillText(`${visual.analysisEyebrow || 'TYPE NOTES'} · ${result.typeCode || ''}`, 72, 1543);
    ctx.setFillStyle('#3D3028');
    ctx.setFontSize(29);
    ctx.fillText(visual.analysisHeadingLine1 || '不止四个字母，', 72, 1588);
    ctx.fillText(visual.analysisHeadingLine2 || '这是你的内在运作方式', 72, 1624);
    (visual.analysis || []).slice(0, 6).forEach((item, index) => {
      const y = 1678 + (index * 232);
      drawRoundRect(ctx, 42, y, 666, 212, 25, '#FFFDF8');
      ctx.setStrokeStyle(index === 5 ? '#31805E' : '#E84B35');
      ctx.setLineWidth(2);
      ctx.beginPath();
      ctx.arc(83, y + 44, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setFillStyle(index === 5 ? '#31805E' : '#E84B35');
      ctx.setFontSize(17);
      ctx.fillText(String(item.index || '').padStart(2, '0'), 71, y + 50);
      ctx.setFillStyle('#28241F');
      ctx.setFontSize(27);
      ctx.fillText(String(item.title || ''), 126, y + 49);
      ctx.setFillStyle('#5A5349');
      ctx.setFontSize(20);
      drawWrappedText(ctx, item.body, 126, y + 87, 530, 30, 5);
    });

    drawRoundRect(ctx, 42, 3090, 666, 236, 30, '#FFFDF8');
    ctx.setFillStyle('#28241F');
    ctx.setFontSize(28);
    ctx.fillText('✱ 你的人格拼图进度', 72, 3140);
    ctx.setFillStyle('#82796D');
    ctx.setFontSize(19);
    ctx.fillText(`已完成 ${completedCount} / 5`, 572, 3140);
    (pieces || []).slice(0, 5).forEach((piece, index) => {
      const x = 54 + (index * 132);
      drawRoundRect(ctx, x, 3173, 108, 92, 22, piece.done ? '#F7DED1' : '#F2EEE5');
      ctx.setFillStyle(piece.done ? '#E84B35' : '#AAA195');
      ctx.setFontSize(28);
      ctx.fillText(piece.done ? '✦' : '·', x + 43, 3226);
      ctx.setFillStyle('#37322C');
      ctx.setFontSize(16);
      ctx.fillText(String(piece.name || ''), x + 15, 3288);
      ctx.setFillStyle(piece.done ? '#E84B35' : '#A39B90');
      ctx.setFontSize(14);
      ctx.fillText(piece.done ? '已完成' : '待解锁', x + 15, 3311);
    });

    drawRoundRect(ctx, 42, 3354, 666, 166, 30, '#FFFDF8');
    ctx.setFillStyle('#28241F');
    ctx.setFontSize(27);
    ctx.fillText('朋友眼中的你', 72, 3402);
    let chipX = 72;
    let chipY = 3430;
    (visual.friendTags || []).slice(0, 5).forEach((tag, index) => {
      ctx.setFontSize(18);
      const width = Math.ceil(ctx.measureText(String(tag)).width) + 34;
      if (chipX + width > 674) {
        chipX = 72;
        chipY += 48;
      }
      drawRoundRect(ctx, chipX, chipY, width, 36, 18, ['#FFF0E9', '#FFF7DC', '#EAF5E9', '#F1EAFA', '#FBE8E8'][index] || '#F5F0E8');
      ctx.setFillStyle(['#C95746', '#996B00', '#42775D', '#705C83', '#B65D65'][index] || '#655E54');
      ctx.fillText(String(tag), chipX + 17, chipY + 25);
      chipX += width + 10;
    });

    drawRoundRect(ctx, 42, 3548, 666, 330, 30, '#FFFDF8');
    drawImageContain(ctx, aiImage, 68, 3582, 120, 88);
    ctx.setFillStyle('#244937');
    ctx.setFontSize(27);
    ctx.fillText('AI 看到的你', 72, 3698);
    (visual.notes || []).slice(0, 3).forEach((note, index) => {
      const y = 3598 + (index * 86);
      ctx.setFillStyle('#31805E');
      ctx.beginPath();
      ctx.arc(226, y + 7, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.setFillStyle('#484239');
      ctx.setFontSize(20);
      drawWrappedText(ctx, note, 244, y + 14, 420, 31, 2);
    });

    ctx.setFillStyle('#28241F');
    ctx.setFontSize(31);
    ctx.fillText(`我是「${displayTitle}」`, 42, 3980);
    ctx.setFillStyle('#777063');
    ctx.setFontSize(21);
    ctx.fillText('人格不是标签，是一张继续认识自己的地图。', 42, 4020);
    ctx.setFillStyle('rgba(74,65,53,.16)');
    ctx.fillRect(42, 4056, 666, 2);
    ctx.setFillStyle('#E94B35');
    ctx.setFontSize(20);
    ctx.fillText('人格拼图 · 完整报告', 42, 4100);
    ctx.setFillStyle('#777063');
    ctx.setFontSize(18);
    ctx.fillText('分享给朋友，看看你会拼出什么', 456, 4100);
    this.exportFullReportCanvas(ctx);
  },

  exportFullReportCanvas(ctx) {
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'fullReportPoster',
          width: 750,
          height: 4200,
          destWidth: 750,
          destHeight: 4200,
          fileType: 'png',
          success: ({ tempFilePath }) => {
            this.fullReportGenerating = false;
            this.setData({ fullReportPath: tempFilePath, fullReportLoading: false });
            wx.hideLoading();
            this.savePosterFile(tempFilePath);
          },
          fail: () => this.finishFullReportFailure()
        }, this);
      }, 180);
    });
  },

  finishFullReportFailure() {
    this.fullReportGenerating = false;
    this.setData({ fullReportLoading: false });
    wx.hideLoading();
    wx.showToast({ title: '完整报告生成失败，请重试', icon: 'none' });
  },

  exportPosterCanvas(ctx) {
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
            this.posterGenerating = false;
            this.setData({ sharePosterPath: tempFilePath, sharePosterLoading: false });
            if (this.pendingPosterSave) {
              this.pendingPosterSave = false;
              this.savePosterFile(tempFilePath);
            }
          },
          fail: () => {
            this.posterGenerating = false;
            this.pendingPosterSave = false;
            this.setData({ sharePosterLoading: false });
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
