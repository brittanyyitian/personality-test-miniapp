const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../preview/app.js'), 'utf8');
const loadFunction = (name, nextName, globals) => {
  const start = source.indexOf(`const ${name} =`);
  const end = source.indexOf(`const ${nextName} =`, start);
  assert.ok(start >= 0 && end > start);
  return vm.runInNewContext(`${source.slice(start, end)}\n${name};`, globals);
};

test('海报统一采用对方分支的宽高比布局，人格底色不再使用旧版特例', async () => {
  const cases = [
    { id: 'bigfive', ratio: 2.4, height: 1000, heroY: 76, heroHeight: 260, quoteY: 354, footerY: 954 },
    { id: 'bigfive', ratio: 1.5, height: 1334, heroY: 76, heroHeight: 630, quoteY: 720, footerY: 1310 },
    { id: 'bigfive', ratio: 1.6, height: 1334, heroY: 76, heroHeight: 630, quoteY: 720, footerY: 1310 },
    { id: 'bigfive', ratio: 1.61, height: 1000, heroY: 76, heroHeight: 260, quoteY: 354, footerY: 954 },
    { id: 'social', ratio: 2.4, height: 1000, heroY: 76, heroHeight: 260, quoteY: 354, footerY: 954 },
    { id: 'social', ratio: 0.8, height: 1334, heroY: 76, heroHeight: 630, quoteY: 720, footerY: 1310 },
    { id: 'cognitive', ratio: 0.8, height: 1334, heroY: 76, heroHeight: 630, quoteY: 720, footerY: 1310 }
  ];
  for (const item of cases) {
    const rectangles = [];
    const texts = [];
    let heroBox;
    const context = {
      fillRect() {}, beginPath() {}, arc() {}, fill() {},
      fillText(text, x, y) { texts.push({ text, x, y }); }
    };
    const canvas = { getContext: () => context, toDataURL: () => 'data:image/png;base64,test' };
    const createPoster = loadFunction('createIllustratedPoster', 'createIllustratedFullReport', {
      document: { createElement: () => canvas },
      loadPosterImage: async () => ({ naturalWidth: item.ratio * 1000, naturalHeight: 1000 }),
      drawPosterImageContain: (_context, _image, x, y, width, height) => { heroBox = { x, y, width, height }; },
      drawPosterRoundRect: (_context, x, y, width, height) => rectangles.push({ x, y, width, height }),
      drawPosterText: (_context, text, x, y) => texts.push({ text, x, y }),
      resultKeyword: () => '测试'
    });
    await createPoster({ assessmentId: item.id }, {
      hero: '/test.webp', title: '测试', quote: '共鸣文案',
      traits: Array.from({ length: 4 }, () => ({ label: '特质', detail: '说明', tone: 'blue' }))
    });
    assert.equal(canvas.width, 750);
    assert.equal(canvas.height, item.height);
    assert.deepEqual(heroBox, { x: 30, y: item.heroY, width: 690, height: item.heroHeight });
    assert.equal(rectangles[0].y, item.quoteY);
    assert.equal(texts.find(({ text }) => text === '共鸣文案').y, item.quoteY + 54);
    assert.equal(texts.find(({ text }) => text === '人格拼图').y, item.footerY);
    assert.ok(rectangles.every(({ y, height }) => y >= 0 && y + height <= canvas.height));
    assert.ok(texts.every(({ y }) => y >= 0 && y < canvas.height));
  }
});

const shareHarness = ({ downloadFails = false, generationFails = false } = {}) => {
  const app = { className: '', innerHTML: '' };
  app.classList = { contains: (name) => app.className.split(' ').includes(name) };
  const bindings = new Map();
  let requests = 0;
  const renderShare = loadFunction('renderShare', 'renderPoster', {
    state: { result: { assessmentId: 'bigfive', visualCode: 'empathy-low', id: 'preview-bigfive-empathy-low' } },
    app,
    resultVisual: () => ({ title: '更愿意保持判断' }),
    setRoute() {}, renderResult() {}, renderHome() {},
    bind: (selector, handler) => bindings.set(selector, handler),
    escapeHtml: (value) => String(value),
    createResultPoster: async () => {
      if (generationFails) throw new Error('generation failed');
      return 'data:image/png;base64,test';
    },
    api: async () => {
      requests += 1;
      if (downloadFails) throw new Error('download unavailable');
      return { url: '/api/poster/test' };
    },
    console: { warn() {} }
  });
  return { app, bindings, renderShare, requests: () => requests };
};

test('分享页保留人格底色标签，下载只请求一次且失败后使用本地海报', async () => {
  for (const downloadFails of [false, true]) {
    const harness = shareHarness({ downloadFails });
    await harness.renderShare();
    assert.equal(harness.requests(), 1);
    assert.match(harness.app.innerHTML, /共情合作 · 低/);
    assert.match(harness.app.innerHTML, downloadFails ? /href="data:image\/png;base64,test"/ : /href="\/api\/poster\/test"/);
    assert.doesNotMatch(harness.app.innerHTML, /share-loading|share-error/);
  }
});

test('海报生成失败时呈现重试入口，不继续请求下载接口', async () => {
  const harness = shareHarness({ generationFails: true });
  await harness.renderShare();
  assert.equal(harness.requests(), 0);
  assert.match(harness.app.innerHTML, /海报生成失败/);
  assert.equal(typeof harness.bindings.get('[data-action="retry-share"]'), 'function');
});
