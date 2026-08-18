const sources = [
  {
    id: 'S01',
    title: '16 型认知偏好',
    basis: '参考 Myers & Briggs Foundation 公开的类型动力学：Se、Si、Ne、Ni、Te、Ti、Fe、Fi 八种心理过程，以及主导与辅助过程的组合顺序。36 道日常场景题先形成八功能画像，再推导四字母偏好。',
    limit: '题目与分析均为依据公开定义编写的原创内容，未经官方量表的样本常模验证；不复制官方 MBTI 题目、报告或 Logo，也不测能力、智力或职业上限。'
  },
  {
    id: 'S03',
    title: '依恋倾向',
    basis: '采用 ECR-R / ECR-RS 的二维框架：依恋焦虑描述对失去、拒绝和回应变化的敏感；依恋回避描述对靠近、开放和依靠他人的不适。24 道中文情境题逐题映射到这两个构念，正反向题共同计分。',
    references: 'Fraley、Waller 与 Brennan（2000）ECR-R；Fraley 等（2011）ECR-RS；李同归、加藤和生（2006）ECR 中文版修订研究。',
    limit: '这是依据正式构念编写的产品化自我探索题，不是 ECR/ECR-R 的原题翻译，也不声称具有原量表常模。四种名称表示二维空间中当前最接近的区域，不是诊断、终身身份或童年原因判断。'
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
    basis: '关系状态按共同投入、被看见感、情绪回应、冲突修复、信任与边界五个连续方向计分；双人地图只组合双方的思考偏好与依恋连续分数，不生成匹配百分比。',
    references: 'Rusbult、Martz 与 Agnew（1998）Investment Model Scale；Reis 等人的 Perceived Partner Responsiveness 研究；Funk 与 Rogge（2007）Couples Satisfaction Index。',
    limit: '题目为依据正式构念编写的产品化自我探索内容，不等同上述原量表，也没有人口常模。结果不预测分手、出轨、结婚或“最佳人格配对”。'
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
