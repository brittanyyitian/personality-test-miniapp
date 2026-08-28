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
  assert.match(source, /const wideHero = Boolean/);
  assert.match(source, /canvasHeight: 1000/);
  assert.match(source, /canvasHeight: 1334/);
  assert.match(source, /if \(visual\) return createIllustratedPoster\(result, visual\)/);
  assert.match(source, /preview-\(cognitive\|social\)-\(\[a-z0-9\]\+\)/i);
  assert.match(source, /preview-bigfive-\(\(\?:energy\|empathy\|order\|sensitivity\|openness\)/i);
  assert.match(source, /resultVisuals\?\.bigfive\?\.\[bigFivePreviewType\]/);
  assert.match(source, /\['result', 'share', 'poster'\]\.includes\(view\)/);
  assert.match(source, /resultVisuals\?\.social\?\.\[previewType\]/);
  assert.match(source, /SHARE YOUR PIECE/);
  assert.match(source, /let downloadUrl = posterData/);
  assert.match(source, /data-action="retry-share"/);
  assert.match(source, /下载接口不可用，已切换为浏览器本地下载/);
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

test('同版本旧结果即使没有原始答案也会用连续分数迁移到当前视觉', () => {
  const source = read('preview/app.js');
  assert.match(source, /const storedResultVisualCode = \(result\) =>/);
  assert.match(source, /\['energy', 'empathy', 'order', 'sensitivity', 'openness'\]/);
  assert.match(source, /const level = value < 2\.5 \? 'low' : value < 3\.5 \? 'mid' : 'high'/);
  assert.match(source, /const visualCode = result\.visualCode \|\| result\.typeCode/);
  assert.match(source, /const hasCurrentVisual = Boolean\(state\.catalog\?\.resultVisuals\?\.\[result\.assessmentId\]\?\.\[visualCode\]\)/);
  assert.match(source, /const migratedResult = canUseInferredVisual \? \{ \.\.\.result, visualCode: inferredVisualCode \} : result/);
  assert.match(source, /return migratedResult/);
});

test('依恋结果头图只在故事场景上叠加斜切木质画框', () => {
  const web = read('preview/app.js');
  const webStyle = read('preview/styles.css');
  const template = read('miniprogram/result-package/pages/result/index.wxml');
  const miniStyle = read('miniprogram/result-package/pages/result/index.wxss');
  assert.match(web, /result\.assessmentId === 'attachment'/);
  assert.match(web, /attachment-wood-frame/);
  assert.match(template, /result\.assessmentId === 'attachment'/);
  assert.match(template, /wood-frame-rail-top/);
  assert.match(webStyle, /\.attachment-wood-frame/);
  assert.match(miniStyle, /\.attachment-wood-frame/);
  assert.match(webStyle, /result-kind-attachment\.illustrated-result-screen/);
  assert.match(miniStyle, /result-kind-attachment \.poster-analysis-head/);
  assert.match(web, /attachment-scene-crop/);
  assert.doesNotMatch(template, /attachment-hero-caption/);
  assert.match(web, /drawAttachmentPosterHero\(context, heroImage, visual, result\)/);
  assert.match(web, /drawAttachmentPosterHero\(context, heroImage, visual, result, \{/);
  assert.match(read('miniprogram/result-package/pages/result/index.js'), /drawAttachmentPosterHero\(ctx, imageInfo, visual, result\)/);
  assert.match(read('miniprogram/result-package/pages/result/index.js'), /drawAttachmentPosterHero\(ctx, heroImage, visual, result, \{/);
  assert.match(template, /result\.assessmentId === 'attachment' \? displayTitle : result\.typeCode/);
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
