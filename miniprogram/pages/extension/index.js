const { getResult } = require('../../utils/storage');

const config = {
  love: {
    eyebrow: '延伸解读',
    title: '恋爱里的你',
    pick: ['关系里的你', '你自然的样子'],
    lead: '喜欢一个人时，你会把自己熟悉的感受、判断和靠近方式一起带进关系。',
    close: '不需要把所有需要藏起来。清楚、具体地表达，通常比让对方猜更容易得到真实回应。'
  },
  stuck: {
    eyebrow: '延伸解读',
    title: '你容易卡在哪里',
    pick: ['容易卡住的时刻', '最需要照顾的一处', '会随情境变化的一面'],
    lead: '卡住不一定是你做错了，更可能是熟悉的保护方式在压力里自动出现。',
    close: '下次再次出现时，可以先分清：此刻发生的是事实，还是一个还需要确认的猜测。'
  },
  practice: {
    eyebrow: '一个小练习',
    title: '把需要说具体一点',
    pick: ['你真正需要的', '给你的理解'],
    lead: '选一件最近反复想起的小事，不急着解释整段关系，只写下一句具体的需要。',
    close: '试着使用这个句式：“当＿＿发生时，我有点＿＿。如果可以，我希望我们＿＿。”'
  }
};

Page({
  data: { page: null, result: null },

  onLoad(options) {
    const result = getResult(options.id);
    const fallback = config[options.kind] || config.love;
    if (!result) return;
    const mainSection = result.sections.find((section) => fallback.pick.includes(section.title)) || result.sections[0];
    const page = result.extensions && result.extensions[options.kind]
      ? result.extensions[options.kind]
      : {
        eyebrow: fallback.eyebrow,
        title: fallback.title,
        lead: fallback.lead,
        sections: [mainSection, { title: '可以怎样理解', body: fallback.close }],
        action: fallback.close
      };
    this.setData({ page, result });
    wx.setNavigationBarTitle({ title: page.title });
  },

  backToResult() {
    wx.navigateBack();
  }
});
