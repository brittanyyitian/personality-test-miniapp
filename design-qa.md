# 依恋结果长页 Design QA

## Evidence

- Source visual truth: `design/attachment-result-sources/attachment-result-page-reference.png`
- Source pixels: 430 × 2690 px, mobile content capture, 1× density.
- Browser-rendered implementation:
  - `preview/attachment-result-long-single-final.png` — 430 × 1878 px browser capture of the long result body.
  - `preview/attachment-result-analysis-final.png` — 415 × 676 px focused analysis capture.
  - `preview/attachment-result-actions-final.png` — 415 × 676 px focused bottom-action capture.
- Combined comparison inputs:
  - `preview/attachment-result-top-comparison.png`
  - `preview/attachment-result-bottom-comparison.png`
- CSS viewport: 430 × 700 px for interaction and focused captures; 430 × 2300 px for the long-page capture. Device scale factor is 1. The in-app browser reserves 15 px for its scrollbar in the 430 × 700 focused captures, so the rendered content width is 415 px. No density rescaling was used for the source or implementation.
- State: `?view=result&preview=attachment-fearful-avoidant`, completed puzzle state. The other three public attachment types were separately loaded at the same result route.

## Required Fidelity Surfaces

- Fonts and typography: passed. Display lettering remains inside the supplied raster hero; UI copy uses the existing PingFang/system stack. The quote, four traits, metrics, six analysis headings and body copy have distinct optical weights and no truncation or horizontal overflow.
- Spacing and layout rhythm: passed. The page follows the reference order and density: kicker → hero → centered quote → four traits → three metrics → six-part analysis → puzzle → friend tags → AI notes → boundary note → actions. The final action panel is full bleed like the source.
- Colors and visual tokens: passed. Cream paper, brick red, black primary action, white secondary action, muted green/yellow/purple metrics and low-contrast card borders match the selected direction.
- Image quality and asset fidelity: passed. All four attachment types use real compressed WebP hero assets derived from high-resolution PNG sources. No placeholder or code-drawn hero artwork is used. The avoidant scene contains exactly two characters and no residual hidden face.
- Copy and content: passed. Each of the four types has its own quote, four traits, three scores, five friend tags, three observer notes, six analysis paragraphs and type-specific analysis heading. A weak boundary statement is visible before the action area.

## Comparison History

### Iteration 1

- P2: The small “你的依恋类型是” kicker was hidden although it was not included in the hero asset.
- P2: The quote block did not guarantee vertical centering.
- P2: All attachment types shared the same analysis headline, weakening differentiation.
- Fixes: exposed the kicker; converted the quote to a minimum-height centered flex row; added four type-specific two-line analysis headlines and changed the eyebrow to `ATTACHMENT NOTES`.
- Post-fix evidence: `preview/attachment-result-top-comparison.png` and the four `preview/attachment-*-top-qa.png` captures.

### Iteration 2

- P2: The lower action panel was inset and rounded, while the selected source uses a full-width color field.
- P2: Analysis copy was visually denser and smaller than the source.
- Fixes: made the action field full bleed, restored the outlined “把 TA 拼进来” treatment, increased analysis title/body size, spacing and line height, and added the weak boundary statement.
- Post-fix evidence: `preview/attachment-result-analysis-final.png`, `preview/attachment-result-actions-final.png`, and `preview/attachment-result-bottom-comparison.png`.

## Interaction And Runtime Checks

- Four preview states loaded: secure, anxious, avoidant and fearful-avoidant.
- Each state exposed four distinct traits, three percentage metrics, six analysis modules and unique text content.
- “分享我的结果” opened the share view and generated a poster preview.
- “返回结果” restored the result view while preserving the preview type.
- “把 TA 拼进来” opened the couple flow.
- No horizontal page overflow was detected at the mobile viewport.
- Browser console warnings/errors: none.
- Automated tests: 63 passed, 0 failed.
- Static route/package check: passed; 7 main-package pages, 1 subpackage, main package 1.09 MB.
- JavaScript syntax checks passed for the changed JS modules; 10 miniprogram JSON files parsed successfully.

## Remaining P3 Polish

- Exact typeface texture inside each generated hero varies slightly from the reference hand-lettering. This is confined to the raster assets and does not affect hierarchy or legibility.
- The reference example shows a 2/5 puzzle state, while the QA browser had 5/5 stored results; the component layout and state labels were still verified.

## 双人拼图状态重构补充验收

- Source/current-problem capture: `preview/couple-before-reference.png`, 1021 × 1742 px. It shows the earlier mismatch: the headline promises “把 TA 拼进来”, while the only actionable task is an unfinished prerequisite card.
- Browser-rendered states, each 1021 × 1358 px at the same in-app-browser stage:
  - `preview/couple-missing-final.jpg` — one prerequisite missing.
  - `preview/couple-ready-final.jpg` — my half complete, invitation ready.
  - `preview/couple-incoming-ready-final.jpg` — partner invite present and both prerequisites complete.
- Combined comparison evidence: `preview/couple-before-after-comparison.jpg`.
- State routes: `?view=couple&demo=missing`, `?view=couple&demo=ready`, and `?view=couple&demo=incoming-ready`.

Required surface review:

- Fonts and typography: passed. Existing system type stack and weight hierarchy were preserved; state headline, explanatory copy, progress labels and single primary action are legible without truncation.
- Spacing and layout rhythm: passed. The new three-step strip fits the existing mobile card width, prerequisite rows are secondary status rather than competing buttons, and the black primary action remains above the fold.
- Colors and visual tokens: passed. Existing cream, rust, black and muted green tokens were reused; active/done states are visually distinct without introducing a new theme.
- Image quality and asset fidelity: passed. Existing puzzle assets are reused unchanged; no visual asset was generated, replaced or modified for this flow.
- Copy and content: passed. Every state now names the real current task, states what happens after sharing, and accurately discloses that automatic cross-device completion status is unavailable without a backend.

Interaction checks:

- The missing-state primary button opened the first question of the required attachment assessment.
- The incoming-ready primary button generated a four-card couple report.
- The ready state exposes one primary invitation action; manual result-code entry remains collapsed as a weak fallback.
- The partner invite code is persisted across the prerequisite quiz/result return path and cleared when the user chooses to pair with someone else.

## 依恋画像层级补充验收

- The public taxonomy remains exactly four attachment types.
- The scoring result now exposes one of nine `profileTitle` values as “当前画像”, derived from low/mid/high anxiety × avoidance bands.
- Browser DOM verification on `?view=result&preview=attachment-fearful-avoidant` showed `恐惧—回避型依恋` plus `当前画像 · 一边想确认，一边想退开`, followed by type-specific quote, traits, metrics and six-part analysis.
- Stored attachment results with answers are automatically rescored when the new profile field is absent, while records without recoverable answers remain readable.

## 双人地图分数区补充验收

- 默认只展示“回应敏感、空间需要、整理能量”三项，另外三项通过弱操作展开，避免分数区占满手机首屏。
- 三项与展开后的六项都继续读取同一份连续维度数据；没有新增匹配分或优劣判断。
- 分数区直接落在暖色页面底面，不再使用白色外层卡片；每项仍为一条共享刻度线。
- “我”使用橙色实底白字，“TA”使用蓝色实底白字；浏览器计算样式与移动端截图均确认标签可见。
- 默认态渲染 3 行，展开态渲染 6 行，“查看另外 3 项 / 收起另外 3 项”交互已在网页预览验证。

final result: passed

## 人格底色分享海报横向素材间距复验

- User-reported issue: 750 × 1334 分享海报仍沿用竖向人物插画的 630 px 高主视觉槽；横向素材按 contain 居中后，画面上下产生了两段无意义空白。
- Same-state evidence:
  - Before: `preview/bigfive-energy-low-share-final.png`，375 × 812 px。
  - After: `preview/bigfive-energy-low-share-spacing-mobile-final.png`，375 × 812 px。
  - Combined comparison: `preview/bigfive-share-spacing-before-after.jpg`。
- Fix: 只对 `assessmentId === 'bigfive'` 的短分享海报启用横向主视觉布局，把主视觉槽从 630 px 压到 430 px，并同步前移共鸣句、四个特征、结果署名和页脚。认知、依恋与社交海报保持原坐标不变。
- Web and mini-program parity: passed。网页 Canvas 与微信小程序 Canvas 使用同一组人格底色专属坐标。
- Visual result: passed。主视觉上下仍保留必要呼吸感，但标题到素材、素材到共鸣句之间不再出现大段空白；内容整体仍完整落在 750 × 1334 画布内。
- Browser console errors: none。
- Automated tests: 69 passed, 0 failed；静态分包检查通过。

final result: passed

## 人格底色三档主视觉接入验收

### Evidence

- Source visual truth:
  - `/var/folders/91/3cfcmnr17dgfn1g40f_2k2tw0000gn/T/codex-clipboard-84787c59-710b-43e8-bae3-3d766b23e161.png` — 外向活力低，1920 × 819 px。
  - `/var/folders/91/3cfcmnr17dgfn1g40f_2k2tw0000gn/T/codex-clipboard-bb4aa1b7-5a33-429c-affd-c0be2d2f042d.png` — 外向活力中，1942 × 809 px。
  - `/var/folders/91/3cfcmnr17dgfn1g40f_2k2tw0000gn/T/codex-clipboard-a224c6db-96cb-4ac3-ad26-9a2f2bc2bab6.png` — 外向活力高，2048 × 768 px。
- Browser-rendered implementation:
  - `preview/bigfive-energy-low-mobile-final.png`
  - `preview/bigfive-energy-mid-mobile-final.png`
  - `preview/bigfive-energy-high-mobile-final.png`
  - `preview/bigfive-energy-low-share-final.png`
- Combined comparison input: `preview/bigfive-low-source-vs-implementation.jpg`。左侧为透明源素材落在同一奶油色底上的原图，右侧为手机结果页首屏。
- Browser viewport override: 390 × 844 px；in-app browser 保存出的页面内容面为 375 × 812 px，1× density。
- States: `?view=result&preview=bigfive-energy-low|mid|high`，以及 `?view=share&preview=bigfive-energy-low`。

### Required Fidelity Surfaces

- Asset fidelity: passed。三张页面均直接使用用户提供的真实插画与手写字，透明背景、构图比例、标题和能量档位没有被重新绘制或裁切。
- Layout and hierarchy: passed。沿用已经落地的认知 / 依恋 / 社交长结果母版，顺序为主视觉 → 共鸣句 → 四个可感知特征 → 五维连续分数 → 六段深度分析 → 拼图进度 → 朋友标签 → AI 观察 → 行动区。
- Mobile readability: passed。人格底色的四个特征从原母版四列调整为两列两行，正文提升到 11 px 网页等效字号；五维分数完整保留，未压缩成三种人格标签。
- Scoring integrity: passed。三张素材只由 `scores.energy` 的低 / 中 / 高区间选择；`energy / empathy / order / sensitivity / openness` 五个原始连续维度、原标题和正式分析数据仍然独立保留。
- Share result: passed。短海报正确复用同一张能量档位素材，分享页档位徽标显示“外向活力 · 低 / 中 / 高”，完整报告入口存在。

### Comparison History

- Iteration 1: 直接套用既有四列特征卡后，手机上正文只有约 9 px，信息虽齐但过密。
- Fix: 仅对人格底色结果改为 2 × 2 特征卡，扩大标题、正文、五维标签和数值，不改动其他已上线结果母版。
- Iteration 2: 分享页因人格底色没有 `typeCode`，右上角出现空白胶囊。
- Fix: 分享页改用 `visualCode` 显示明确档位，例如“外向活力 · 低”。
- Post-fix comparison: `preview/bigfive-low-source-vs-implementation.jpg`；三档手机截图均确认主视觉、文本和五维分数无截断、无横向溢出。

### Interaction And Runtime Checks

- 三个预览入口均加载对应素材与独立文案，DOM 中均存在四个特征、五条分数和六段分析。
- 分享页生成短海报成功，同时出现“保存分享海报”和“保存完整报告”。
- Browser console errors: none。
- Automated tests: 69 passed, 0 failed。
- Static package check: passed；7 个主包页面，1 个分包，主包 1.73 MB，结果分包低于 2 MB。

final result: passed
