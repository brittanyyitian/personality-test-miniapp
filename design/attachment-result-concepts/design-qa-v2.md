# Design QA：恐惧—回避型依恋结果长页 v2

## Visual truth

- 指定母版：`cognitive-long-page-reference.png`
- 插画色彩参考：`style-reference-secure.jpg`
- 依恋场景素材：`attachment-fearful-avoidant-v2-bright.png`

## Implementation evidence

- 页面：`fearful-result-page-v2.html`
- 完整长图：`fearful-result-page-v2.jpg`（430 × 2789 px）
- 同屏对照：`fearful-result-page-v2-qa.jpg`
- 本地预览：`http://127.0.0.1:4173/design/attachment-result-concepts/fearful-result-page-v2.html`

## Findings and fixes

1. v1 错用了旧版文档式结果页：边框与段落过多，未继承当前思考模式的海报式母版。
   - v2 改为同一阅读顺序：大结果名与主视觉、共鸣框、四个特征、倾向条、六段 Type Notes、拼图/朋友/AI、红色操作区。
2. v1 主视觉有灰雾与低饱和感。
   - v2 保留开门与递热饮的情境，增强朱红、钴蓝、叶绿和暖黄，移除灰雾。
3. 依恋内容不能机械复制四字母人格结构。
   - 保留母版视觉结构，但将内容改为依恋专属的“核心渴望—内在矛盾—压力反转—关系误读—被理解方式—恢复建议”。

## Surface review

- Typography：大红结果名与 Type Notes 层级对齐指定母版。
- Spacing：四卡、倾向条和分析长卡间距统一；无横向溢出。
- Color：插画和控件使用红、黄、绿、紫的高饱和暖色体系。
- Image quality：人物与门未裁切；430px 长页中主视觉清楚，无水印。
- Copy：先共鸣，再解释反应逻辑，最后给可执行的小请求。
- Browser：页面无控制台 error。

## Comparison history

- Pass 1：识别 v1 使用了错误的旧母版。
- Pass 2：按用户指定截图重排，插画增艳并完成同屏对照。
- Pass 3：检查完整 430px 长页，未发现 P0、P1 或 P2 视觉问题。
- Pass 4：将结果名、场景与解释句整合进同一张主视觉；移除独立标题、插画白框和悬空说明。
- Pass 5：页面纸张色校准为素材边缘均值 `#fbf2cd`，消除主视觉矩形色差；共鸣卡设为 126px 高并将正文垂直居中。

final result: passed
