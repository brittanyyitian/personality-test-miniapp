const fs = require('node:fs');
const path = require('node:path');
const { assessments, typeTitles, inspirationCards } = require('../miniprogram/data/assessments');
const { contentCatalog } = require('../miniprogram/utils/scoring');

const output = [];
const line = (value = '') => output.push(value);
const clean = (value = '') => String(value).replaceAll('|', '｜').replaceAll('\n', ' ');

const dimensionLabels = {
  EI: '外倾—内倾', NS: '直觉—感觉', TF: '思考—情感', JP: '判断—感知',
  anxiety: '依恋焦虑', avoidance: '依恋回避',
  energy: '外向活力', empathy: '共情合作', order: '自律秩序', sensitivity: '情绪敏感', openness: '开放想象',
  commitment: '共同投入', appreciation: '被看见感', response: '情绪回应', repair: '冲突修复',
  SA: '主动连接—低调入场', PF: '提前安排—临场随缘', SH: '外显分享—内部消化', CB: '日常融合—边界清晰', DR: '主动开局—等待加入', JK: '玩梗化解—认真说清'
};

function questionTable(assessment) {
  line('| 编号 | 题目 | 计分维度 | 方向/反向 |');
  line('|---|---|---|---|');
  assessment.questions.forEach((question) => {
    const direction = Object.hasOwn(question, 'reverse') ? (question.reverse ? '反向' : '正向') : (question.direction < 0 ? '第二极' : '第一极');
    line(`| ${question.id} | ${clean(question.text)} | ${dimensionLabels[question.dimension] || question.dimension} | ${direction} |`);
  });
  if (assessment.followups?.length) {
    line('');
    line('边界追问（仅相应维度接近中间时出现）：');
    line('');
    line('| 编号 | 题目 | 维度 | 方向 |');
    line('|---|---|---|---|');
    assessment.followups.forEach((question) => line(`| ${question.id} | ${clean(question.text)} | ${dimensionLabels[question.dimension]} | ${question.direction < 0 ? '第二极' : '第一极'} |`));
  }
}

line('# 小程序题库、计分与结果文案总表 v2');
line('');
line('更新时间：2026-08-07');
line('');
line('这份文件是内容审阅稿。正式测试彼此独立，用户不会一次做完全部题目。当前共有 5 套测试：36+10+20+10+24=100 道题。另有双人相处地图和 18 张塔罗式意象卡，它们不计入测试题数。');
line('');
line('统一表达原则：描述倾向，不下诊断；先接住感受，再给解释；不以百分比判定两个人是否适合；不把娱乐结果包装成科学结论。');

line('');
line('## 1. 16 型人格偏好');
line('');
line(`- 题量：${assessments.cognitive.questions.length} 道固定题，完成后直接生成结果。`);
line(`- 依据说明：${assessments.cognitive.evidence}。`);
line('- 计分：E/I、N/S、T/F、J/P 四个连续维度；每题 1–5 分，以中点 3 为 0。始终输出明确四字母，并把接近中间的维度作为结果提醒，不追加题目。');
line('');
questionTable(assessments.cognitive);
line('');
line('### 16 种结果标题');
line('');
line('| 类型 | 结果标题 |');
line('|---|---|');
Object.entries(typeTitles).forEach(([code, title]) => line(`| ${code} | ${title} |`));
line('');
line('### 分析文案组件');
line('');
line('| 偏好 | 标签 | 主要分析 | 关系/节奏补充 |');
line('|---|---|---|---|');
Object.entries(contentCatalog.cognitiveCopy).forEach(([key, value]) => {
  const main = value.natural || value.decision || value.rhythm;
  const extra = [value.love, value.stuck].filter(Boolean).join(' ');
  line(`| ${key} | ${clean(value.tag)} | ${clean(main)} | ${clean(extra)} |`);
});
line('');
line('结果组装：四字母标题 + 三个标签 + 类型摘要 + 两个高辨识度细节 + 生活、关系与卡点分析。维度接近中间时仍给出明确类型，只在提醒中保留弹性。');

line('');
line('## 2. 依恋倾向');
line('');
line(`- 题量：${assessments.attachment.questions.length} 题。`);
line(`- 依据说明：${assessments.attachment.evidence}。`);
line('- 计分：依恋焦虑、依恋回避两个连续维度，各自按低/中/高分三档组合成 9 个结果。超过 6 题选择中点，或两个维度都落在中心区域时，额外提示“会随关系情境变化”。');
line('');
questionTable(assessments.attachment);
line('');
line('### 9 个结果分支');
line('');
line('| 焦虑×回避 | 标题 | 核心分析 | 保护作用 | 提醒 |');
line('|---|---|---|---|---|');
Object.entries(contentCatalog.attachmentProfiles).forEach(([key, value]) => line(`| ${key} | ${clean(value[0])} | ${clean(value[1])} | ${clean(value[2])} | ${clean(value[3])} |`));

line('');
line('## 3. 性格底色（Mini-IPIP 结构）');
line('');
line(`- 题量：${assessments.bigfive.questions.length} 题，每个维度 4 题。`);
line(`- 依据说明：${assessments.bigfive.evidence}。`);
line('- 计分：外向活力、共情合作、自律秩序、情绪敏感、开放想象五个连续维度。1–2.49 为低，2.5–3.49 为中，3.5–5 为高。结果展示两个较突出的方向和一个更接近中间的方向。');
line('');
questionTable(assessments.bigfive);
line('');
line('### 15 个维度文案分支');
line('');
line('| 维度 | 档位 | 标题 | 分析 |');
line('|---|---|---|---|');
Object.entries(contentCatalog.bigFiveModules).forEach(([key, module]) => {
  ['low', 'mid', 'high'].forEach((level) => line(`| ${module.label} | ${level} | ${clean(module[level][0])} | ${clean(module[level][1])} |`));
});

line('');
line('## 4. 恋爱里的关系状态');
line('');
line(`- 题量：${assessments.relationship.questions.length} 题。`);
line(`- 依据说明：${assessments.relationship.evidence}。`);
line('- 计分：共同投入、被看见感、情绪回应、冲突修复四个维度，按低/中/高解释。0 个低分且至少 2 个高分为“有可以依靠的连接”；至多 1 个低分为“有基础，也有一处需要照顾”；其余为“关系正在消耗一些力气”。');
line('');
questionTable(assessments.relationship);
line('');
line('### 12 个维度文案分支');
line('');
line('| 维度 | 档位 | 分析 |');
line('|---|---|---|');
Object.entries(contentCatalog.relationshipModules).forEach(([, module]) => {
  ['low', 'mid', 'high'].forEach((level) => line(`| ${module.label} | ${level} | ${clean(module[level])} |`));
});
line('');
line('安全提醒固定保留：如果用户经常感到害怕、被威胁、被控制、被强迫或担心人身安全，优先联系可信任的人和当地专业求助渠道。');

line('');
line('## 5. SBTI · 社交人格（重新设计）');
line('');
line(`- 题量：${assessments.social.questions.length} 题，约 3 分钟。`);
line('- 定位：原创娱乐测试。借用互联网人格测试的快节奏、梗系结果表达，不复制网络版本的题目、类型或评分模型，也不冒充心理量表。');
line('- 六个维度：主动连接/低调入场、提前安排/临场随缘、外显分享/内部消化、日常融合/边界清晰、主动开局/等待加入、玩梗化解/认真说清。前四个维度组成 16 种核心人设，后两个维度作为结果修饰。');
line('');
questionTable(assessments.social);
line('');
line('### 16 个核心结果 + 1 个低分化结果');
line('');
line('| 内部组合 | 分享码 | 标题 | 核心分析 | 容易被误会 | 给你的提醒 |');
line('|---|---|---|---|---|---|');
Object.entries(contentCatalog.socialProfiles).forEach(([key, value]) => line(`| ${key} | ${value[0]} | ${value[1]} | ${clean(value[2])} | ${clean(value[3])} | ${clean(value[4])} |`));
line('');
line('修饰标签：DR 高为“会主动开局”，低为“等气氛对上”；JK 高为“擅长玩梗”，低为“认真说清楚”。结果页固定注明“娱乐向社交速写，不是心理诊断”。');

line('');
line('## 6. 两个人合不合');
line('');
line('- 没有单独题库。双方先完成测试，本机生成结果码，再比较连续分数。不会输出“匹配百分比”。');
line('');
line('| 规则 | 触发方向 | 分析主题 |');
line('|---|---|---|');
[
  ['CM01', '双方依恋焦虑都高', '都很在意回应'],
  ['CM02', '一方焦虑高、另一方回避高', '靠近与退后的节奏'],
  ['CM03', '双方依恋回避都高', '都需要自己的空间'],
  ['CM05', 'E/I 差异较大', '不同的充电方式'],
  ['CM06', 'N/S 差异较大', '一个谈可能，一个谈具体'],
  ['CM07', 'T/F 差异较大', '理解与解决的顺序'],
  ['CM08', 'J/P 差异较大', '确定与自由的节奏'],
  ['CM10', '情绪敏感差异较大', '感受变化的速度不同'],
  ['CM12', '共情合作差异较大', '照顾感受的方式不同'],
  ['CM14', '认知偏好最接近的维度', '一处共同节奏']
].forEach((row) => line(`| ${row[0]} | ${row[1]} | ${row[2]} |`));
line('');
line('固定结论：相似是共同语言，差异是需要翻译的地方；愿意交换结果、一起理解差异，本身就是关系资源。');

line('');
line('## 7. 抽一张塔罗（重新设计）');
line('');
line('- 结构：先选“看看此刻的自己 / 看看一段关系 / 看看下一步”，再抽 1 张。共 18 张原创塔罗式意象卡。');
line('- 每张卡包含：意象、正向提醒、需要留意的一面、反思问题、今天可以做的小动作。');
line('- 边界：不预测未来、复合、婚姻、财运、健康或生死；不使用“必然、注定、灵验”等承诺；定位为象征性自我反思。');
Object.entries(inspirationCards).forEach(([, group]) => {
  line('');
  line(`### ${group.title}`);
  group.cards.forEach((card) => {
    line('');
    line(`#### ${card.id} · ${card.title} / ${card.symbol}`);
    line('');
    line(`- 正向提醒：${card.face}`);
    line(`- 需要留意：${card.shadow}`);
    line(`- 留给你的问题：${card.reflection}`);
    line(`- 今天可以：${card.action}`);
  });
});

line('');
line('## 8. 依据、版权与审核边界');
line('');
line('- Mini-IPIP：Donnellan 等人开发的 20 题 Big Five 短量表，原论文说明其来自 50 题 IPIP-FFM，并在五项研究中验证。https://pubmed.ncbi.nlm.nih.gov/16768595/');
line('- 依恋：采用成人依恋研究常用的“焦虑 / 回避”连续维度框架。ECR-RS 论文：https://doi.org/10.1037/a0020290');
line('- 关系回应：伴侣回应通常指感到被理解、被关心、被欣赏；相关纵向研究：https://pubmed.ncbi.nlm.nih.gov/28592909/');
line('- SBTI：2026 年流行的是娱乐性、梗系人格测试，不是严肃心理量表。本项目只保留娱乐表达形式，题目、模型、类型名全部原创。现象参考：https://www.sbtitype.com/');
line('- “塔罗”在小程序审核中存在内容风险。上线前应再次核对微信最新平台规则；推荐使用“塔罗式意象卡 / 今日意象牌”的非占卜定位，不提供算命、运势或结果预测。');
line('- MBTI® 及 Myers-Briggs Type Indicator® 是商标。本项目页面使用“16 型人格偏好”，不宣称官方 MBTI，也不复制付费量表题目。');

line('');
line('## 9. 当前题量汇总');
line('');
line('| 模块 | 数量 |');
line('|---|---:|');
Object.values(assessments).forEach((assessment) => line(`| ${assessment.title} | ${assessment.questions.length}${assessment.followups?.length ? ` + 最多 ${assessment.followups.length} 追问` : ''} |`));
line('| 塔罗式意象卡 | 18 张 |');
line('| 双人相处地图 | 10 条组合规则 |');

const target = path.resolve(__dirname, '../content-review-v2.md');
fs.writeFileSync(target, `${output.join('\n')}\n`);
console.log(target);
