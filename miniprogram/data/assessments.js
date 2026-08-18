const likert = ['很不像我', '比较不像我', '看情况', '比较像我', '很像我'];
const attachmentLikert = ['非常不同意', '比较不同意', '不确定', '比较同意', '非常同意'];

// 每道产品题都要能回溯到 ECR-R 的焦虑/回避构念。这里记录的是
// 语义对应关系，不表示当前中文情境题与原量表具有测量等价性。
const attachmentReferences = {
  RS01: ['ECR-R 1', 'ECR-R 2'],
  RS02: ['ECR-R 19'],
  RS03: ['ECR-R 2', 'ECR-R 6'],
  RS04: ['ECR-R 21'],
  RS05: ['ECR-R 4', 'ECR-R 5'],
  RS06: ['ECR-R 23', 'ECR-R 25'],
  RS07: ['ECR-R 1', 'ECR-R 6'],
  RS08: ['ECR-R 28'],
  RS09: ['ECR-R 3', 'ECR-R 12'],
  RS10: ['ECR-R 29'],
  RS11: ['ECR-R 10'],
  RS12: ['ECR-R 30'],
  RS13: ['ECR-R 13'],
  RS14: ['ECR-R 23', 'ECR-R 32'],
  RS15: ['ECR-R 6', 'ECR-R 16'],
  RS16: ['ECR-R 31'],
  RS17: ['ECR-R 17'],
  RS18: ['ECR-R 35'],
  RS19: ['ECR-R 9'],
  RS20: ['ECR-R 20'],
  RS21: ['ECR-R 11'],
  RS22: ['ECR-R 33', 'ECR-R 34'],
  RS23: ['ECR-R 3', 'ECR-R 13'],
  RS24: ['ECR-R 22', 'ECR-R 26']
};

const relationshipReferences = {
  commitment: ['Investment Model Scale · commitment / investment'],
  appreciation: ['Perceived Partner Responsiveness · validation / caring'],
  response: ['Perceived Partner Responsiveness · understanding / support'],
  repair: ['relationship conflict repair research'],
  trust: ['dyadic trust and relationship boundary research']
};

const cognitiveQuestionOrder = [
  'CP01', 'CP05', 'CP09', 'CP13', 'CP17', 'CP21', 'CP25', 'CP29',
  'CP02', 'CP06', 'CP10', 'CP14', 'CP18', 'CP22', 'CP26', 'CP30',
  'CP03', 'CP07', 'CP11', 'CP15', 'CP19', 'CP23', 'CP27', 'CP31',
  'CP04', 'CP08', 'CP12', 'CP16', 'CP20', 'CP24', 'CP28', 'CP32',
  'CP35', 'CP33', 'CP36', 'CP34'
];

const assessments = {
  cognitive: {
    id: 'cognitive',
    title: '16 型人格偏好',
    shortTitle: '16 型人格偏好',
    section: '了解自己',
    duration: '36 题 · 约 6 分钟',
    evidence: '依据荣格的感觉、直觉、思维、情感四种心理功能及内外倾态度，并参考 Myers-Briggs 类型动力学编写；题目为原创自我探索版，不属于官方 MBTI® 量表',
    evidenceId: 'S01',
    version: '0.8.0',
    tone: 'serious',
    accent: 'blue',
    icon: '/assets/mist-blue.png',
    introArt: '/assets/hero-blue.png',
    intro: '看看你更习惯怎样获取信息、形成判断和安排生活。它描述偏好，不衡量能力，也不会替你规定职业或关系。',
    instruction: '请按大多数真实时候的你作答，而不是理想中的你。',
    options: likert,
    questions: [
      ['CP01', '第一次到一个陌生地方时，我会先看动线、人的位置和现场正在发生什么，再决定怎么行动。', 'Se', '现场线索'],
      ['CP02', '处理实际问题时，我更容易在直接操作和即时反馈中找到办法。', 'Se', '直接反馈'],
      ['CP03', '正在发生的事情会自然抓住我的注意，我能较快投入现场。', 'Se', '当下投入'],
      ['CP04', '计划外的具体情况出现时，我通常能根据现场条件及时改变做法。', 'Se', '实时适应'],

      ['CP05', '遇到新情况时，我会自然地和过去类似的经验对照。', 'Si', '经验对照'],
      ['CP06', '回想一段重要经历时，我常会用当时的具体细节理解它。', 'Si', '细节记忆'],
      ['CP07', '有经验验证过的方法，会让我比较安心。', 'Si', '稳定参照'],
      ['CP08', '熟悉的事情只要和往常有一点不同，我往往很快就能感觉到。', 'Si', '差异感知'],

      ['CP09', '别人提到一个普通想法时，我常会顺着想到几种用法、变化，或它还能连接到什么。', 'Ne', '可能展开'],
      ['CP10', '同一件还没定论的事，我很容易换几个假设重新解释。', 'Ne', '假设转换'],
      ['CP11', '我常在看似无关的观点、故事或领域之间发现联系。', 'Ne', '跨域连接'],
      ['CP12', '讨论一个尚未定型的问题时，我会自然提出几种不同走向。', 'Ne', '方向扩展'],

      ['CP13', '几件看似分散的事放在一起后，我常会突然意识到：它们其实都指向同一个问题。', 'Ni', '内在收束'],
      ['CP14', '安静想一段时间后，答案有时会以一个比较完整的样子出现。', 'Ni', '内在洞见'],
      ['CP15', '我很自然地会想，眼前这件事长期会走向哪里。', 'Ni', '长期走向'],
      ['CP16', '比起不断增加新选项，我更想找到最值得相信的那个方向。', 'Ni', '方向判断'],

      ['CP17', '接到一个只有目标、没有做法的任务时，我会很快开始列步骤、找资源和排时间。', 'Te', '组织推进'],
      ['CP18', '评估方案时，我会先看它能不能被实际执行和验证。', 'Te', '外部标准'],
      ['CP19', '一群人迟迟无法推进时，我常会想先把分工和时间定下来。', 'Te', '明确安排'],
      ['CP20', '做决定时，效率、成本和可行性会被我认真放进考虑。', 'Te', '现实效能'],

      ['CP21', '即使一个结论很受欢迎，只要其中有一步推不出来，我就很难真正接受它。', 'Ti', '内在一致'],
      ['CP22', '如果一个概念说得不够准确，我会很想把它的边界理清。', 'Ti', '概念精确'],
      ['CP23', '理解复杂事物时，我喜欢在心里建立一套自己说得通的解释。', 'Ti', '内在框架'],
      ['CP24', '一个问题越复杂，我越容易想把它拆开，看清每部分怎样连在一起。', 'Ti', '分析结构'],

      ['CP25', '聊天中有人突然安静或语气变了，我通常会很快察觉，并调整自己接下来的表达。', 'Fe', '关系气氛'],
      ['CP26', '判断怎样回应一个人时，我会自然参考对方表达的需要和我们所处的关系。', 'Fe', '人际参照'],
      ['CP27', '做涉及多个人的决定时，彼此能否接受和协作对我很重要。', 'Fe', '共同影响'],
      ['CP28', '冲突过后，我会在意大家是否重新理解了对方。', 'Fe', '恢复理解'],

      ['CP29', '面对一个条件很好、但心里始终觉得“不像我”的选择时，我通常很难只看现实好处答应。', 'Fi', '价值一致'],
      ['CP30', '即使外界有明确期待，我也很难长期做不符合真实自己的事。', 'Fi', '真实选择'],
      ['CP31', '我通常能感觉到，某个选择是“应该这样”，还是“我真的想这样”。', 'Fi', '内在感受'],
      ['CP32', '对我真正重要的价值，就算不容易解释，我也会安静地守住。', 'Fi', '价值守护'],

      ['CP33', '如果一个选择逻辑上说得通，却违背我真正珍视的东西，我仍然很难接受。', 'Fi', '价值取舍', 'Ti'],
      ['CP34', '一群人意见不同但必须继续推进时，我更倾向先定清规则和行动，再处理每个人是否舒服。', 'Te', '推进取舍', 'Fe'],
      ['CP35', '接触一件新事物时，我更自然地先联想它还能引出哪些可能，而不是先沉浸在眼前的具体体验里。', 'Ne', '联想或体验', 'Se'],
      ['CP36', '判断一件事接下来会怎样时，我更依赖零散线索在心里形成的方向，而不是过去相似经历提供的参照。', 'Ni', '洞见或经验', 'Si']
    ]
      .map(([id, text, cognitiveFunction, facet, oppositeFunction]) => ({ id, text, cognitiveFunction, facet, oppositeFunction }))
      .sort((a, b) => cognitiveQuestionOrder.indexOf(a.id) - cognitiveQuestionOrder.indexOf(b.id)),
    followups: [
      ['CF01', '当我还没想清楚时，比起独自整理，我更容易通过说出来和外界反馈把想法理清。', 'Ne', '互动或独处', 'Ni', 'EI'],
      ['CF02', '需要做出决定时，我通常先把步骤和标准摆到外部，而不是先在心里反复校准自己的逻辑。', 'Te', '外部或内部整理', 'Ti', 'EI'],
      ['CF03', '面对陌生问题，我更自然地展开几种可能，而不是先抓住眼前可以验证的事实。', 'Ne', '可能或事实', 'Se', 'NS'],
      ['CF04', '判断事情走向时，我更依赖零散线索在心里形成的方向，而不是过去相似经验提供的参照。', 'Ni', '方向或经验', 'Si', 'NS'],
      ['CF05', '发生分歧时，我更自然地先确定可执行标准，而不是先调整到彼此都能接受的表达。', 'Te', '标准或关系', 'Fe', 'TF'],
      ['CF06', '判断一个选择时，我更先检查逻辑是否一致，而不是它是否符合自己真正重视的东西。', 'Ti', '逻辑或价值', 'Fi', 'TF'],
      ['CF07', '开始一项开放任务时，我更自然地先列步骤推进，而不是先保留多种可能继续探索。', 'Te', '推进或探索', 'Ne', 'JP'],
      ['CF08', '多人一起行动时，我更自然地先确认共识和安排，而不是跟着现场变化边走边调整。', 'Fe', '安排或现场', 'Se', 'JP']
    ].map(([id, text, cognitiveFunction, facet, oppositeFunction, axis]) => ({ id, text, cognitiveFunction, facet, oppositeFunction, axis }))
  },

  attachment: {
    id: 'attachment',
    title: '依恋倾向',
    shortTitle: '依恋倾向',
    section: '理解关系',
    duration: '24 题 · 约 4 分钟',
    evidence: '依据 ECR-R / ECR-RS 的依恋焦虑、依恋回避二维模型编写中文情境题；逐题保留构念来源，但不声称与原量表具有测量等价性',
    evidenceId: 'S03',
    version: '0.6.0',
    tone: 'serious',
    accent: 'coral',
    icon: '/assets/mist-attachment-coral.png',
    introArt: '/assets/intro-attachment-coral-v2.jpg',
    intro: '看看你在亲密关系里怎样确认连接、表达需要，也怎样为自己保留空间。',
    instruction: '请按你在重要亲密关系中的通常感受回答，而不是只按最近一次争执。没有恋爱经历时，可以参考一段对你重要的亲密关系。',
    options: attachmentLikert,
    questions: [
      ['RS01', '当对方的回应明显变少时，我会很快担心自己是不是不再重要。', 'anxiety', 'rejection', false],
      ['RS02', '难受的时候，即使对方愿意听，我也更倾向先独自处理。', 'avoidance', 'openness', false],
      ['RS03', '关系有一点不确定时，我会反复确认对方是不是还在意我。', 'anxiety', 'reassurance', false],
      ['RS04', '把真正脆弱的一面交给对方，会让我有失去掌控的感觉。', 'avoidance', 'dependence', false],
      ['RS05', '当我感觉自己比对方更投入时，我会明显不安。', 'anxiety', 'worth', false],
      ['RS06', '当对方想更深入了解我的感受时，我有时会下意识退开。', 'avoidance', 'closeness', false],

      ['RS07', '发生摩擦后，如果迟迟没有和好，我容易想到这段关系可能会结束。', 'anxiety', 'rejection', false],
      ['RS08', '我通常愿意和对方讨论自己的烦恼或担心。', 'avoidance', 'openness', true],
      ['RS09', '如果对方没有明确表达在意，我会很难判断我们的关系是不是还好。', 'anxiety', 'reassurance', false],
      ['RS10', '需要支持时，向对方求助通常会让我觉得有帮助。', 'avoidance', 'dependence', true],
      ['RS11', '对方语气变冷或心不在焉时，我容易先怀疑是不是自己做错了什么。', 'anxiety', 'worth', false],
      ['RS12', '大多数重要的事情，我愿意让对方知道。', 'avoidance', 'closeness', true],

      ['RS13', '当对方有自己的安排、没有顾到我时，我容易感觉自己正在被推开。', 'anxiety', 'rejection', false],
      ['RS14', '谈到很深的感受时，我有时会沉默、转开话题，或想尽快结束。', 'avoidance', 'openness', false],
      ['RS15', '等待对方回应时，我常常很难把注意力放回自己的事情。', 'anxiety', 'reassurance', false],
      ['RS16', '遇到重要的事情时，我通常愿意和对方把它谈开。', 'avoidance', 'dependence', true],
      ['RS17', '看到对方对别人更热情时，我会在意自己在对方心里的位置。', 'anxiety', 'worth', false],
      ['RS18', '向对方表达喜欢、在意或亲近，对我来说通常比较自然。', 'avoidance', 'closeness', true],

      ['RS19', '关系出现短暂冷淡时，我通常不会立刻想到自己可能失去对方。', 'anxiety', 'rejection', true],
      ['RS20', '我愿意让对方知道自己正在害怕、委屈或无助。', 'avoidance', 'openness', true],
      ['RS21', '即使暂时得不到确认，我通常也能先安定下来，等有机会再沟通。', 'anxiety', 'reassurance', true],
      ['RS22', '需要帮助时，我能够比较自然地依靠对方。', 'avoidance', 'dependence', true],
      ['RS23', '对方没有立刻回应时，我容易把这种安静理解成拒绝或变心。', 'anxiety', 'worth', false],
      ['RS24', '关系越来越亲近时，我多数时候仍能感到放松，而不是被困住。', 'avoidance', 'closeness', true]
    ].map(([id, text, dimension, facet, reverse]) => ({
      id,
      text,
      dimension,
      facet,
      reverse,
      references: attachmentReferences[id]
    }))
  },

  bigfive: {
    id: 'bigfive',
    title: '性格底色',
    shortTitle: '性格底色',
    section: '了解自己',
    duration: '20 题 · 约 3 分钟',
    evidence: '采用公共领域 Mini-IPIP 结构；中文工作译稿仍需本地验证',
    evidenceId: 'S04',
    version: '0.2.0',
    tone: 'serious',
    accent: 'green',
    icon: '/assets/mist-leaf-green.png',
    introArt: '/assets/mist-leaf-green.png',
    intro: '不把你装进一个类型，而是从五个连续方向看看那些较稳定的性格倾向。',
    instruction: '请按大多数真实时候的你作答。',
    options: likert,
    questions: [
      ['BF01', '参加一个感兴趣但彼此不熟的活动时，我通常会主动和不止一个人聊起来。', 'energy', false],
      ['BF02', '朋友讲烦恼时，即使我不同意他的做法，也能先理解那种感受从哪里来。', 'empathy', false],
      ['BF03', '一件事即使没人催，我也会在截止前给自己留出检查和收尾的时间。', 'order', false],
      ['BF04', '收到一条语气模糊的消息后，我可能会反复想对方是不是有什么情绪。', 'sensitivity', false],
      ['BF05', '看到一个熟悉的问题时，我常会想：它还可以用另一种完全不同的方式理解吗？', 'openness', false],
      ['BF06', '连续和很多人相处以后，我通常更想一个人待着，而不是继续下一场。', 'energy', true],
      ['BF07', '如果别人的情绪不影响眼前的事情，我通常不会特意去了解。', 'empathy', true],
      ['BF08', '临时小事一多，我原本安排好的待办和物品就很容易失去顺序。', 'order', true],
      ['BF09', '计划突然变化或别人语气不太好时，我通常很快就能把心情放回原位。', 'sensitivity', true],
      ['BF10', '讨论一个暂时不能落地的概念时，我很快就会觉得没有必要继续。', 'openness', true],
      ['BF11', '一群人都在等别人开口时，我常会先抛出一个话题或行动建议。', 'energy', false],
      ['BF12', '熟悉的人说“没事”时，我往往仍能从语气或动作里察觉他其实不太对劲。', 'empathy', false],
      ['BF13', '开始一个步骤很多的任务前，我习惯先把顺序和关键节点理清。', 'order', false],
      ['BF14', '一次失误或争执过去后，我的身体和情绪往往还会绷一阵子。', 'sensitivity', false],
      ['BF15', '面对有很多隐喻、留白或多种解释的作品时，我通常很难产生兴趣。', 'openness', true],
      ['BF16', '即使在熟悉的群体里，只要别人聊得顺，我也很少主动把注意力拉到自己这里。', 'energy', true],
      ['BF17', '有人反复讲同一类烦恼却不行动时，我很快会失去继续听的耐心。', 'empathy', true],
      ['BF18', '我常等到桌面、消息或待办已经积累很多，才一次性处理。', 'order', true],
      ['BF19', '忙乱或被否定的一天结束后，我通常不需要很久就能恢复平静。', 'sensitivity', true],
      ['BF20', '只要旧办法仍然可靠，我通常不会为了新鲜感特意换一种做法。', 'openness', true]
    ].map(([id, text, dimension, reverse]) => ({ id, text, dimension, reverse }))
  },

  relationship: {
    id: 'relationship',
    title: '恋爱里的关系状态',
    shortTitle: '恋爱状态',
    section: '理解关系',
    duration: '20 题 · 约 4 分钟',
    evidence: '依据关系投入、伴侣回应、冲突修复与信任边界等构念原创编写；每道题保留构念来源，但不声称等同某一套正式量表',
    evidenceId: 'S05',
    version: '0.6.0',
    tone: 'serious',
    accent: 'lavender',
    icon: '/assets/mist-relationship-lavender.png',
    introArt: '/assets/mist-relationship-lavender.png',
    intro: '不判断合不合适，只帮你看看这段关系里已经拥有的资源，以及正在消耗力气的地方。',
    instruction: '请按最近一个月的大多数真实情况回答，不只按最好或最糟的一天。',
    options: ['几乎没有', '偶尔', '有时', '经常', '大多数时候'],
    questions: [
      ['RC01', '遇到现实问题时，我们通常把它当成两个人共同面对的事。', 'commitment', false],
      ['RC02', '我们会让彼此知道：你的付出和在意，我有看见。', 'appreciation', false],
      ['RC03', '我表达难受时，大多数时候能感到对方愿意听和理解。', 'response', false],
      ['RC04', '争执开始升级时，我们至少有一个人会尝试让对话慢下来。', 'repair', false],
      ['RC05', '我可以说出真实想法，而不用担心被嘲讽、报复或故意冷落。', 'trust', false],

      ['RC06', '我能感受到双方都愿意为这段关系投入时间和精力。', 'commitment', false],
      ['RC07', '日常相处里，我们仍会主动表达感谢、喜欢或肯定。', 'appreciation', false],
      ['RC08', '即使意见不同，我也能感到自己的感受和需要被认真对待。', 'response', false],
      ['RC09', '不愉快之后，我们通常有人愿意重新开口，把关系接回来。', 'repair', false],
      ['RC10', '彼此需要独处、朋友时间或个人安排时，这些边界通常会被尊重。', 'trust', false],

      ['RC11', '涉及两个人的未来和重要决定时，我们会认真把双方都放进去。', 'commitment', false],
      ['RC12', '即使在普通的日子里，我仍能感到对方欣赏真实的我。', 'appreciation', false],
      ['RC13', '当我需要支持时，对方通常会先弄清我真正需要什么。', 'response', false],
      ['RC14', '伤害发生后，我们能够承认各自的部分，并看到后续行动。', 'repair', false],
      ['RC15', '关于关系里重要的事情，我们大多不需要靠猜、查或试探才知道真相。', 'trust', false],

      ['RC16', '涉及两个人的重要安排，常常只有一方在做决定或承担。', 'commitment', true],
      ['RC17', '相处久了以后，彼此的付出很容易被当成理所当然。', 'appreciation', true],
      ['RC18', '当我说出感受时，对方常会淡化它、转开话题或急着反驳。', 'response', true],
      ['RC19', '同一个矛盾常常反复出现，却很少真正谈清楚或形成改变。', 'repair', true],
      ['RC20', '为了安心，我们常需要查看、限制或反复证明彼此的行踪和关系。', 'trust', true]
    ].map(([id, text, dimension, reverse]) => ({ id, text, dimension, reverse, references: relationshipReferences[dimension] }))
  },

  social: {
    id: 'social',
    title: 'SBTI · 社交人格',
    shortTitle: 'SBTI',
    section: '玩点有趣的',
    duration: '24 题 · 约 3 分钟',
    evidence: '原创娱乐测试，借用互联网人格测试的表达形式，不属于心理量表',
    evidenceId: 'S06',
    version: '0.3.0',
    tone: 'play',
    accent: 'blue',
    icon: '/assets/mist-social-blue.png',
    introArt: '/assets/mist-social-blue.png',
    intro: '看看你在群聊、饭局、熟人圈和突然冷场时，最容易切换成哪一种抽象社交人设。',
    instruction: '按最近半年更常见的你回答，不用挑最体面的一面。',
    options: ['完全不是', '有一点', '一半一半', '比较像', '非常像'],
    questions: [
      ['SB01', '刚进一个没人认识我的群聊或饭局时，我通常能先找一句话让自己加入。', 'SA', 1],
      ['SB02', '一场聚会结束后，如果有人提议续摊，我多数时候还有兴趣继续。', 'SA', 1],
      ['SB03', '加入新群体时，我会先观察谁熟、谁在主导，以及什么话题比较安全。', 'SA', -1],
      ['SB04', '消息、邀约和新认识的人同时变多时，我常会先减少回复，让自己安静下来。', 'SA', -1],
      ['SB05', '见面前知道时间、地点、谁会来和大致流程，会让我明显更放松。', 'PF', 1],
      ['SB06', '大家在群里说了很久“都可以”时，我通常会直接给出一个能落地的方案。', 'PF', 1],
      ['SB07', '朋友临时说“半小时后出来吗”，我反而可能比提前一周约更有兴致。', 'PF', -1],
      ['SB08', '一次见面连去哪、吃什么、几点结束都提前定好，会让我觉得少了点呼吸感。', 'PF', -1],
      ['SB09', '遇到特别好笑、尴尬或委屈的事时，我脑中很快会出现一个“必须告诉的人”。', 'SH', 1],
      ['SB10', '在信任的人面前，我状态不好时不太会努力装成一切正常。', 'SH', 1],
      ['SB11', '即使有人认真问“你怎么了”，我也常需要先说没事，等自己想清楚再谈。', 'SH', -1],
      ['SB12', '群体里有人碰到我的边界时，我更常先忍过去，回去以后才越想越介意。', 'SH', -1],
      ['SB13', '看到路边小事、吃到好东西或想到一句话时，我会自然地发给亲近的人。', 'CB', 1],
      ['SB14', '一段关系对我重要时，我会希望我们不只聊大事，也参与彼此普通的一天。', 'CB', 1],
      ['SB15', '即使很喜欢一个人，我也需要有一段明确不聊天、不解释行程的个人时间。', 'CB', -1],
      ['SB16', '别人连续追问我在哪里、和谁、为什么没回时，我会先感到被侵入，而不是被关心。', 'CB', -1],
      ['SB17', '气氛突然冷下来时，我常会主动找一句话把场子接住。', 'DR', 1],
      ['SB18', '有了新点子，我容易顺手把身边的人一起拉进来。', 'DR', 1],
      ['SB19', '有人先把话题或活动开起来以后，我参与起来会更自然。', 'DR', -1],
      ['SB20', '一群人意见不一致时，我通常先观察，不急着推动决定。', 'DR', -1],
      ['SB21', '尴尬出现时，我很自然地会用一句玩笑让大家松一点。', 'JK', 1],
      ['SB22', '自己出糗以后，我通常能很快把它变成一个梗。', 'JK', 1],
      ['SB23', '遇到重要或严肃的话题时，我更希望把话说清楚，而不是玩梗。', 'JK', -1],
      ['SB24', '被人误会时，我会认真解释，不太会用表情包糊弄过去。', 'JK', -1]
    ].map(([id, text, dimension, direction]) => ({ id, text, dimension, direction }))
  }
};

const typeTitles = {
  INTJ: '静默构图者', INTP: '逻辑探路者', ENTJ: '推进设计者', ENTP: '可能性拆解者',
  INFJ: '深层理解者', INFP: '内在守护者', ENFJ: '关系点灯者', ENFP: '灵感连接者',
  ISTJ: '稳定建造者', ISFJ: '细节照顾者', ESTJ: '秩序推进者', ESFJ: '日常联结者',
  ISTP: '冷静解决者', ISFP: '感受行动者', ESTP: '现场应变者', ESFP: '氛围点亮者'
};

const inspirationCards = {
  understood: {
    title: '看看此刻的自己',
    cards: [
      ['T01', '镜子', 'Mirror', '有些答案不是向外找，而是承认自己其实已经看见了。', '别急着只盯着不够好的部分；你也可能忽略了已经发生的变化。', '如果不评价对错，你现在最真实的感受是什么？', '写下一句只描述感受、不解释原因的话。'],
      ['T02', '月亮', 'Moon', '模糊会放大想象。此刻的不安可能是真的，但你给它补上的故事还需要确认。', '在信息不足时，大脑很容易把最担心的版本当成事实。', '这件事里，哪些是事实，哪些只是你正在猜？', '把事实和猜测分别写成两行。'],
      ['T03', '壳', 'Shell', '退回自己的空间，不一定是逃避，也可能是在恢复感觉。', '壳能保护你，也可能让真正关心的人不知道怎样靠近。', '你现在需要安静，还是需要一个不会追问的人陪着？', '给一个可信任的人发出清楚的小信号。'],
      ['T04', '窗', 'Window', '换一个角度，不是强迫自己乐观，而是允许事情还有别的解释。', '一直站在同一个位置，熟悉的结论会看起来像唯一答案。', '如果从三个月后的自己看，这件事会有什么不同？', '写下一个你还没有验证过的解释。'],
      ['T05', '火种', 'Ember', '你不需要立刻燃烧起来，只要还有一点想靠近的东西，就不算完全停住。', '把自己逼得太用力，火种反而容易熄灭。', '哪件小事仍然能让你有一点点兴趣？', '今天只为它留十分钟。'],
      ['T06', '空椅', 'Empty Chair', '缺席也会占据空间。你在等的，也许是一句迟迟没有出现的话。', '一直替别人补全答案，会让等待变成对自己的消耗。', '如果这张椅子上的人能听见，你最想说哪一句？', '先把这句话写给自己，不必马上发送。']
    ]
  },
  relationship: {
    title: '看看一段关系',
    cards: [
      ['T07', '桥', 'Bridge', '靠近不是猜中彼此，而是愿意搭一段可以走过去的路。', '桥需要两端都愿意连接；一个人不断修补，不会自动变成双向。', '你们之间最需要被翻译的差异是什么？', '用“我感到…我希望…”说一个具体请求。'],
      ['T08', '结', 'Knot', '反复出现的问题，通常不是因为谁记性不好，而是某个需要一直没被说清。', '越急着一次解开，越容易把结拉得更紧。', '你们通常从哪一句话开始进入旧循环？', '约定下一次在那句话出现时先暂停十分钟。'],
      ['T09', '花园', 'Garden', '关系的温度常藏在重复的小动作里，不只在重要时刻。', '只在问题发生时用力，会让平常的连接慢慢缺水。', '最近哪一个小动作，让你感觉自己被放在心上？', '今天也做一个同样具体的小动作。'],
      ['T10', '门', 'Door', '边界不是把人挡在外面，而是让靠近有一个彼此都舒服的方式。', '门一直锁着会变成隔绝，一直敞开也会让人失去自己的空间。', '你现在想打开一点，还是想先关上一会儿？', '把需要的距离和大致时间说清楚。'],
      ['T11', '灯塔', 'Lighthouse', '清楚的信号不会替对方航行，但能减少关系里的猜测。', '如果你一直只发隐晦的信号，对方可能真的看不懂。', '你希望对方知道的重点，能不能用一句话说清？', '删掉试探，只保留最具体的一句。'],
      ['T12', '双岸', 'Two Shores', '两个人可以不同，也可以都是真的。理解差异不等于放弃自己的需要。', '把所有差异都解释成互补，会忽略真实的消耗。', '这份不同是可以协商的节奏，还是不可退让的底线？', '分别写下可协商和不可协商的部分。']
    ]
  },
  forward: {
    title: '看看下一步',
    cards: [
      ['T13', '种子', 'Seed', '开始不需要很大，只需要一个能够被重复的小动作。', '总想着最终结果，会让第一步显得太轻、太不值得。', '十分钟内能开始的动作是什么？', '完成它，然后停下来，不额外加码。'],
      ['T14', '河流', 'River', '有些前进不是用力冲过去，而是允许自己绕开暂时过不去的地方。', '顺流不等于放弃方向，也不等于什么都不做。', '你正在和哪件无法立即改变的事较劲？', '把力气移到仍然可控的一小部分。'],
      ['T15', '山', 'Mountain', '困难真实存在，但你不需要一次走完整座山。', '只盯着山顶，会看不见脚下已经站稳的位置。', '现在真正挡住你的，是任务太大，还是害怕开始？', '把下一步缩小到不需要勇气也能做。'],
      ['T16', '钟', 'Clock', '不是所有答案都需要今天出现。时间有时不是拖延，而是让信息和情绪慢慢归位。', '等待应该有边界；无限期悬着也会继续消耗你。', '这件事可以等多久，再回来重新判断？', '给等待设一个明确的回看日期。'],
      ['T17', '船', 'Boat', '你不必控制所有风向，但可以选择今天怎样握住方向。', '一直等完全安全的天气，可能永远不会离岸。', '此刻仍然在你手里的选择有哪些？', '选一个风险可承受的小决定。'],
      ['T18', '晨光', 'Dawn', '新的阶段不一定轰轰烈烈，它可能只是你终于愿意用不同方式对待自己。', '急着证明已经走出来，会让还没恢复的部分再次被忽略。', '什么变化虽然很小，却说明你已经不在原地？', '把这个变化记录下来，作为自己的证据。']
    ]
  }
};

Object.keys(inspirationCards).forEach((key) => {
  inspirationCards[key].cards = inspirationCards[key].cards.map(([id, title, symbol, face, shadow, reflection, action]) => ({ id, title, symbol, face, shadow, reflection, action }));
});

const homeSections = [
  {
    title: '了解自己',
    items: [
      { id: 'cognitive', title: '16 型人格偏好', subtitle: '36 题 · 约 6 分钟', featured: true, icon: '/assets/home-hero-pale-blue-v3.jpg' },
      { id: 'bigfive', title: '性格底色', subtitle: '看看你的稳定倾向', icon: '/assets/mist-leaf-green.png' }
    ]
  },
  {
    title: '理解关系',
    items: [
      { id: 'attachment', title: '依恋倾向', subtitle: '看见你怎样确认连接', compact: true, icon: '/assets/mist-attachment-coral.png' },
      { id: 'relationship', title: '恋爱状态', subtitle: '看见最近关系里的资源', compact: true, icon: '/assets/mist-relationship-lavender.png' },
      { id: 'couple', title: '两个人合不合', subtitle: '比较双方的认知与依恋节奏', icon: '/assets/icon-feather-blue.png' }
    ]
  },
  {
    title: '玩点有趣的',
    items: [
      { id: 'social', title: 'SBTI', subtitle: '看看你的抽象社交人设', compact: true, icon: '/assets/mist-social-blue.png' },
      { id: 'inspiration', title: '抽一张塔罗', subtitle: '给今天一个象征性提醒', compact: true, icon: '/assets/mist-inspiration-lavender.png' }
    ]
  }
];

module.exports = {
  assessments,
  typeTitles,
  inspirationCards,
  homeSections,
  likert
};
