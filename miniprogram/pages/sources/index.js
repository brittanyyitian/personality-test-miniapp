const sources = [
  {
    id: 'S01',
    title: '16 型认知偏好',
    basis: '参考 Myers & Briggs Foundation 公开的类型动力学：Se、Si、Ne、Ni、Te、Ti、Fe、Fi 八种心理过程，以及主导与辅助过程的组合顺序。36 道日常场景题先形成八功能画像，再推导四字母偏好。',
    limit: '题目与分析均为依据公开定义编写的原创内容，未经官方量表的样本常模验证；不复制官方 MBTI 题目、报告或 Logo，也不测能力、智力或职业上限。'
  },
  {
    id: 'S03',
    title: '关系安全感',
    basis: '构念参考 ECR-RS 所使用的依恋焦虑与依恋回避两个连续维度。',
    limit: '当前 10 题为原创中文题，不声称与原量表等效，不追溯童年原因或诊断依恋障碍。'
  },
  {
    id: 'S04',
    title: '性格底色',
    basis: '采用公共领域的 Mini-IPIP 20 题结构，呈现大五人格的五个连续方向。',
    limit: '中文为工作译稿，上线前仍需回译、认知访谈与本地样本检验；当前不显示人口百分位。'
  },
  {
    id: 'S05',
    title: '关系状态与双人地图',
    basis: '参考关系质量研究中较稳定出现的投入、欣赏、回应与冲突修复等关系特定变量。',
    limit: '题目为研究启发型原创内容，不预测分手、出轨、结婚或“最佳人格配对”。'
  },
  {
    id: 'S06',
    title: '社交状态与灵感卡',
    basis: '原创娱乐与反思内容。',
    limit: '不复制 SBTI 的题目、算法或人物标签；灵感卡不预测复合、正缘、婚姻、财运或未来事件。'
  }
];

Page({
  data: { sources, focus: '' },
  onLoad(options) {
    const map = { cognitive: 'S01', attachment: 'S03', bigfive: 'S04', relationship: 'S05', social: 'S06' };
    this.setData({ focus: map[options.id] || '' });
  }
});
