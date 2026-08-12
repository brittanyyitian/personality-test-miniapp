const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const memory = new Map();
let calls;

function resetWx() {
  calls = { navigateTo: [], redirectTo: [], reLaunch: [], navigateBack: 0, toasts: [] };
  global.wx = {
    getStorageSync(key) { return memory.get(key); },
    setStorageSync(key, value) { memory.set(key, value); },
    removeStorageSync(key) { memory.delete(key); },
    navigateTo(options) { calls.navigateTo.push(options.url); },
    redirectTo(options) { calls.redirectTo.push(options.url); },
    reLaunch(options) { calls.reLaunch.push(options.url); },
    navigateBack() { calls.navigateBack += 1; },
    showToast(options) { calls.toasts.push(options.title); },
    hideLoading() {}
  };
}

function loadPage(relativePath) {
  let definition;
  global.Page = (page) => { definition = page; };
  const file = path.resolve(__dirname, '..', relativePath);
  delete require.cache[file];
  require(file);
  return definition;
}

function instantiate(definition) {
  return {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update, callback) {
      Object.assign(this.data, update);
      if (callback) callback();
    }
  };
}

test.beforeEach(() => {
  memory.clear();
  resetWx();
});

test('首页五块完成后不再制造一个循环重测入口', () => {
  const ids = ['relationship', 'attachment', 'bigfive', 'cognitive', 'social'];
  memory.set('mind_results_v1', ids.map((assessmentId, index) => ({
    id: `${assessmentId}_${index}`,
    assessmentId,
    title: `${assessmentId} result`,
    summary: '一段足够完整的结果说明。',
    scores: {}
  })));
  const page = instantiate(loadPage('miniprogram/pages/home/index.js'));
  page.onShow();
  assert.equal(page.data.completedCount, 5);
  assert.equal(page.data.recommendation, null);
});

test('损坏草稿从最早缺题恢复，快速返回会取消自动前进', async () => {
  memory.set('mind_draft_relationship', { answers: [1, 0, 4], current: 2 });
  const page = instantiate(loadPage('miniprogram/pages/quiz/index.js'));
  page.onLoad({ id: 'relationship' });
  assert.equal(page.data.current, 1);
  assert.equal(page.data.options.length, 4);

  page.selectAnswer({ currentTarget: { dataset: { value: 4 } } });
  page.exitOrPrevious();
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(page.data.current, 0);
  page.onUnload();
});

test('同一答题页重复提交只保存一份结果', () => {
  const answers = Array(20).fill(4);
  memory.set('mind_draft_relationship', { answers, current: 19 });
  const page = instantiate(loadPage('miniprogram/pages/quiz/index.js'));
  page.onLoad({ id: 'relationship' });
  page.finish();
  page.finish();
  assert.equal(memory.get('mind_results_v1').length, 1);
  assert.equal(calls.redirectTo.length, 1);
  page.onUnload();
});

test('全部拼完的核心结果把继续动作收口到首页', () => {
  const ids = ['relationship', 'attachment', 'bigfive', 'cognitive', 'social'];
  const results = ids.map((assessmentId, index) => ({
    id: `${assessmentId}_${index}`,
    assessmentId,
    title: `${assessmentId} result`,
    typeName: assessmentId === 'cognitive' ? '深层理解者' : undefined,
    typeCode: assessmentId === 'cognitive' ? 'INFJ' : undefined,
    summary: '这是一段能用于核心结果展示的共鸣文案。',
    scores: {}
  }));
  memory.set('mind_results_v1', results);
  const page = instantiate(loadPage('miniprogram/result-package/pages/result/index.js'));
  page.onLoad({ id: 'relationship_0', view: 'core' });
  assert.equal(page.data.nextPiece, null);
  assert.equal(page.data.nextActionText, '回到我的拼图');
  page.continueNext();
  assert.deepEqual(calls.reLaunch, ['/pages/home/index']);
  page.onUnload();
});

test('朋友圈回流转到 intro，intro 连点只进入同一测试一次', () => {
  const resultPage = instantiate(loadPage('miniprogram/result-package/pages/result/index.js'));
  resultPage.onLoad({ id: 'social', from: 'share', name: encodeURIComponent('小范围话痨') });
  assert.match(calls.redirectTo[0], /^\/pages\/intro\/index\?id=social&from=share&name=/);

  calls.redirectTo = [];
  const introPage = instantiate(loadPage('miniprogram/pages/intro/index.js'));
  introPage.onLoad({ id: 'social', name: encodeURIComponent('小范围话痨') });
  introPage.start();
  introPage.start();
  assert.deepEqual(calls.redirectTo, ['/pages/quiz/index?id=social']);
  introPage.onUnload();
});
