const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('网页插画结果分享使用类型头图并直接展示可保存海报', () => {
  const source = read('preview/app.js');
  assert.match(source, /createIllustratedPoster/);
  assert.match(source, /loadPosterImage\(visual\.hero\)/);
  assert.match(source, /if \(visual\) return createIllustratedPoster\(result, visual\)/);
  assert.match(source, /preview-\(cognitive\|social\)-\(\[a-z0-9\]\+\)/i);
  assert.match(source, /preview-bigfive-\(\(\?:energy\|empathy\|order\|sensitivity\|openness\)/i);
  assert.match(source, /resultVisuals\?\.bigfive\?\.\[bigFivePreviewType\]/);
  assert.match(source, /\['result', 'share', 'poster'\]\.includes\(view\)/);
  assert.match(source, /resultVisuals\?\.social\?\.\[previewType\]/);
  assert.match(source, /SHARE YOUR PIECE/);
  assert.doesNotMatch(source, /<h1>这是我的一块<\/h1>/);
});

test('网页完整报告按需接入结果页全部核心内容', () => {
  const source = read('preview/app.js');
  assert.match(source, /createIllustratedFullReport/);
  assert.match(source, /visual\.tendencies/);
  assert.match(source, /visual\.analysis/);
  assert.match(source, /visual\.friendTags/);
  assert.match(source, /visual\.notes/);
  assert.match(source, /data-action="full-report"/);
  assert.match(source, /finally\s*\{\s*button\.disabled = false/);
});

test('人格底色结果页移除隐藏标题占位并同步收紧网页与小程序顶距', () => {
  const web = read('preview/styles.css');
  const mini = read('miniprogram/result-package/pages/result/index.wxss');
  assert.match(web, /\.illustrated-result-screen\.result-kind-bigfive\s*\{\s*padding-top:\s*10px/);
  assert.match(web, /\.result-kind-bigfive \.poster-kicker-hidden\s*\{\s*display:\s*none/);
  assert.match(mini, /\.core-screen-illustrated\.result-kind-bigfive\s*\{\s*padding-top:\s*calc\(18rpx \+ env\(safe-area-inset-top\)\)/);
  assert.match(mini, /\.result-kind-bigfive \.poster-kicker-hidden\s*\{\s*display:\s*none/);
});

test('小程序分享页预览正式海报且保存同一张生成图片', () => {
  const logic = read('miniprogram/result-package/pages/result/index.js');
  const template = read('miniprogram/result-package/pages/result/index.wxml');
  assert.match(logic, /visual && visual\.hero \? visual\.hero : piece\.image/);
  assert.match(logic, /sharePosterPath: tempFilePath/);
  assert.match(template, /src="\{\{sharePosterPath\}\}"/);
  assert.match(template, /show-menu-by-longpress="\{\{true\}\}"/);
  assert.match(logic, /drawFullReport/);
  assert.match(logic, /canvasId: 'fullReportPoster'/);
  assert.match(template, /bindtap="saveFullReport"/);
  assert.match(template, /canvas-id="fullReportPoster"/);
  assert.doesNotMatch(template, /class="share-card"/);
});

test('网页与小程序双人地图默认突出三项，并可展开全部六项连续位置', () => {
  const web = read('preview/app.js');
  const logic = read('miniprogram/pages/couple/index.js');
  const template = read('miniprogram/pages/couple/index.wxml');
  assert.match(web, /state\.coupleReport\.dimensions/);
  assert.match(web, /\['回应敏感', '空间需要', '整理能量'\]/);
  assert.match(web, /coupleScoreExpanded/);
  assert.match(web, /couple-score-track/);
  assert.match(web, /class="mine" style="left:/);
  assert.match(web, /class="theirs" style="left:/);
  assert.match(logic, /PRIMARY_SCORE_KEYS/);
  assert.match(logic, /toggleScoreDimensions/);
  assert.match(template, /wx:for="\{\{report\.visibleDimensions\}\}"/);
  assert.match(template, /查看另外 3 项/);
  assert.match(template, /class="couple-score-dot couple-score-dot-me"/);
  assert.match(template, /class="couple-score-dot couple-score-dot-ta"/);
  assert.match(template, /不是匹配分/);
});
