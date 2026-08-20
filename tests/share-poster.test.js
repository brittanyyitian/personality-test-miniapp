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
