const { assessments, typeTitles } = require('../data/assessments');

const round = (value, digits = 2) => Number(value.toFixed(digits));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const band = (value) => (value < 2.5 ? 'low' : value < 3.5 ? 'mid' : 'high');

function answerMap(questions, answers) {
  const result = {};
  questions.forEach((question, index) => {
    result[question.id] = Number(answers[index]);
  });
  return result;
}

const cognitiveFunctionNames = {
  Se: '感知当下', Si: '经验参照', Ne: '展开可能', Ni: '收束洞见',
  Te: '组织推进', Ti: '内在分析', Fe: '关系协调', Fi: '价值一致'
};

const cognitiveFunctionDetail = {
  Se: '你容易相信正在发生的真实反馈，并在现场迅速调整。',
  Si: '你会自然地把当下与过去经验对照，很多细节会成为判断的参照。',
  Ne: '你很容易由一个线索展开几种可能，也擅长在不同事物之间发现新联系。',
  Ni: '你会让零散线索在心里慢慢收束，直到一个核心方向逐渐清楚。',
  Te: '你习惯把想法放到现实中检验，并快速找到步骤、资源和下一步。',
  Ti: '你需要事情在自己心里真正说得通，也会反复检查概念与逻辑是否一致。',
  Fe: '你很容易感觉到人与人之间的气氛，也会自然地考虑大家能否理解和协作。',
  Fi: '你对“这是不是真正符合我”很敏感，重要选择需要和内心珍视的东西一致。'
};

const cognitiveLetterCards = {
  E: { title: 'E', body: '和外界交流、行动时，想法往往会越来越清楚。' },
  I: { title: 'I', body: '重要的想法更习惯先在心里整理。' },
  N: { title: 'N', body: '容易留意模式、意义和未来可能。' },
  S: { title: 'S', body: '更信任具体细节、真实经验和眼前反馈。' },
  T: { title: 'T', body: '做决定时会先检查逻辑、标准和是否说得通。' },
  F: { title: 'F', body: '做决定时会考虑价值是否一致，以及它对人的影响。' },
  J: { title: 'J', body: '事情有方向、有安排时更安心。' },
  P: { title: 'P', body: '保留一点选择和调整空间时更自然。' }
};

const cognitiveFunctionGuide = {
  Se: { name: '感知当下', plain: '看见正在发生的真实信息', stress: '容易只顾眼前反应，先动了再处理后果。', growth: '给重要选择留一个很短的停顿，再决定要不要立刻行动。' },
  Si: { name: '经验参照', plain: '用记得的细节和经验确认当下', stress: '容易反复检查细节，或过度依赖熟悉的做法。', growth: '保留有用的经验，也问一句：这次有哪个条件已经不一样了？' },
  Ne: { name: '展开可能', plain: '从一个线索看见更多连接和方向', stress: '容易被太多可能拉走，想得很开却难以收尾。', growth: '不用关掉好奇心，只选一个最想验证的方向先走一步。' },
  Ni: { name: '看见方向', plain: '让零散线索慢慢收束成核心判断', stress: '容易把一个强烈预感当成唯一答案，越想越难松开。', growth: '把心里的方向拿出来，用一个现实细节或他人的反馈验证它。' },
  Te: { name: '组织推进', plain: '把目标变成标准、步骤和可执行的安排', stress: '容易只看效率和结果，话说得太快、太硬。', growth: '推进之前先确认一个人的真实状态，通常反而能走得更快。' },
  Ti: { name: '理清逻辑', plain: '在心里搭出一套前后一致的解释', stress: '容易一直拆解、反复校验，因为还不够完整而迟迟不动。', growth: '允许一个“目前足够说得通”的答案，再用行动补齐后面的信息。' },
  Fe: { name: '感受关系', plain: '留意人与人之间的情绪、气氛和需要', stress: '容易过度扫描别人的反应，为了维持关系而忽略自己。', growth: '在照顾气氛之前，先用一句话说出自己此刻真正的感受。' },
  Fi: { name: '守住价值', plain: '确认选择是否忠于自己真正珍视的东西', stress: '容易把价值冲突都压在心里，又希望别人能自己懂。', growth: '不需要把全部内心都解释完，先说清一件你真的很在意的事。' }
};

const cognitiveTypeDynamics = {
  INTJ: { lead: '一个负责看见长期方向，一个负责把方向变成可以推进的路径。', together: '你常常先在心里看到一个大致结局，再倒推现在该做什么。别人看到的是冷静和效率，你自己更在意的是这条路是否真的通向长期。' },
  INTP: { lead: '一个负责检查事情是否说得通，一个负责打开新的解释角度。', together: '你不太容易接受现成答案。你会一边拆开逻辑，一边寻找还有没有更合理的可能，直到它在你心里真正成立。' },
  ENTJ: { lead: '一个负责快速组织和推进，一个负责确认长期方向。', together: '你不只想把事情做完，还会在意这份投入最后会把人和事带到哪里。方向一旦成形，你会很自然地开始排资源和下一步。' },
  ENTP: { lead: '一个负责不断发现新可能，一个负责判断哪个解释更说得通。', together: '你容易被新问题和新角度点亮，也不会因为大家都认同就停止追问。你的灵活不是随意，背后其实有一套不断更新的内在逻辑。' },
  INFJ: { lead: '一个负责看见方向，一个负责感受人与关系。', together: '你常常不只听见别人说了什么，还会留意话背后的感受和事情将要去向哪里。你想理解的往往不是一个表面答案，而是人、关系和未来之间的联系。' },
  INFP: { lead: '一个负责守住内心真正珍视的东西，一个负责不断看见还有哪些可能。', together: '你会先感觉一件事是否真诚、是否和自己重要的价值一致，然后才愿意把想象力和热情交给它。你的开放不是没有立场，而是想找到既真实又有可能的路。' },
  ENFJ: { lead: '一个负责感受和连接人，一个负责看见这段关系可能走向哪里。', together: '你容易先感觉到谁需要被看见，也会自然地想怎样让一群人往更好的方向走。你不只照顾当下气氛，心里通常还有一个对未来的判断。' },
  ENFP: { lead: '一个负责打开人和事的新可能，一个负责确认哪些真正值得投入。', together: '你容易被人、故事和新方向打动，但真正让你长久留下的，往往是那些和你内心价值有真实连接的事。好奇心帮你打开门，真诚感决定你会不会继续走。' },
  ISTJ: { lead: '一个负责保留可靠的经验和细节，一个负责把事情稳稳推进。', together: '你常常先确认什么已经被证明是可靠的，再按清楚标准把责任落到实处。别人看到的可能是循规蹈矩，你更在意的是答应过的事要真正做到。' },
  ISFJ: { lead: '一个负责记住具体细节，一个负责把这些细节变成对人的照顾。', together: '你容易记住别人的习惯、需要和曾经发生过的小事，并用实际行动让关系更安稳。你的体贴很少是突然的，它来自长时间的留心。' },
  ESTJ: { lead: '一个负责把事情组织清楚，一个负责用经验确保它可靠落地。', together: '你擅长把模糊问题变成可执行的标准和步骤，也会不断对照以往经验，确认事情不只是看起来有效。你的直接往往来自对结果的负责。' },
  ESFJ: { lead: '一个负责维持人与人的连接，一个负责记住让关系安心的具体细节。', together: '你会留意大家有没有被照顾到，也会通过熟悉的仪式、记得的小事和持续回应让关系更稳。对你来说，在意通常就是要被做出来。' },
  ISTP: { lead: '一个负责理清问题真正怎样运作，一个负责根据现场反馈立刻调整。', together: '你会先观察真实情况，再快速找到问题的结构和最直接的解法。你不一定需要说很多，理解和行动本身就是你的表达。' },
  ISFP: { lead: '一个负责确认什么对自己真正重要，一个负责在当下用行动把它表达出来。', together: '你对真实感受和现场氛围都很敏感，很多时候不会先长篇解释，而是通过选择、作品或一个具体动作说出“这对我很重要”。' },
  ESTP: { lead: '一个负责迅速进入现场，一个负责在行动中理清问题。', together: '你通常不需要等所有信息到齐才开始，而是先通过真实反馈抓住关键，再迅速调整做法。你看起来随机应变，心里其实一直在分析什么有效。' },
  ESFP: { lead: '一个负责感受当下的人和氛围，一个负责确认自己真正喜欢什么。', together: '你容易进入眼前的生活，用真实的回应和行动让气氛活起来。你的热情并不代表没有底线，真正愿意长久投入的，仍然是符合内心的人和事。' }
};

const cognitiveTypeStacks = {
  INTJ: ['Ni', 'Te', 'Fi', 'Se'], INTP: ['Ti', 'Ne', 'Si', 'Fe'],
  ENTJ: ['Te', 'Ni', 'Se', 'Fi'], ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
  INFJ: ['Ni', 'Fe', 'Ti', 'Se'], INFP: ['Fi', 'Ne', 'Si', 'Te'],
  ENFJ: ['Fe', 'Ni', 'Se', 'Ti'], ENFP: ['Ne', 'Fi', 'Te', 'Si'],
  ISTJ: ['Si', 'Te', 'Fi', 'Ne'], ISFJ: ['Si', 'Fe', 'Ti', 'Ne'],
  ESTJ: ['Te', 'Si', 'Ne', 'Fi'], ESFJ: ['Fe', 'Si', 'Ne', 'Ti'],
  ISTP: ['Ti', 'Se', 'Ni', 'Fe'], ISFP: ['Fi', 'Se', 'Ni', 'Te'],
  ESTP: ['Se', 'Ti', 'Fe', 'Ni'], ESFP: ['Se', 'Fi', 'Te', 'Ni']
};

function cognitiveFunctionScores(questions, answers) {
  const values = answerMap(questions, answers);
  const totals = Object.fromEntries(Object.keys(cognitiveFunctionNames).map((key) => [key, 0]));
  const baseCounts = Object.fromEntries(Object.keys(cognitiveFunctionNames).map((key) => [key, 0]));
  questions.forEach((question) => {
    const answer = values[question.id];
    if (!answer || !question.cognitiveFunction) return;
    const centered = (answer - 3) / 2;
    if (question.oppositeFunction) {
      totals[question.cognitiveFunction] += centered * 0.75;
      totals[question.oppositeFunction] -= centered * 0.75;
      return;
    }
    totals[question.cognitiveFunction] += centered;
    baseCounts[question.cognitiveFunction] += 1;
  });
  const raw = Object.fromEntries(Object.keys(totals).map((key) => [key, baseCounts[key] ? totals[key] / baseCounts[key] : 0]));
  const responseBaseline = mean(Object.values(raw));
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [
    key,
    round(Math.max(-1, Math.min(1, value - responseBaseline)), 3)
  ]));
}

function rankCognitiveTypes(functionScores) {
  const introvertedAverage = mean([functionScores.Si, functionScores.Ni, functionScores.Ti, functionScores.Fi]);
  const extravertedAverage = mean([functionScores.Se, functionScores.Ne, functionScores.Te, functionScores.Fe]);
  return Object.entries(cognitiveTypeStacks).map(([typeCode, stack]) => {
    const dominant = stack[0];
    const auxiliary = stack[1];
    const orientation = typeCode[0] === 'I' ? introvertedAverage : extravertedAverage;
    const supportingProcess = ['Se', 'Si', 'Ne', 'Ni'].includes(dominant)
      ? (typeCode[2] === 'T' ? mean([functionScores.Te, functionScores.Ti]) : mean([functionScores.Fe, functionScores.Fi]))
      : (typeCode[1] === 'N' ? mean([functionScores.Ne, functionScores.Ni]) : mean([functionScores.Se, functionScores.Si]));
    // 类型动力学同时要求主导功能、内外倾方向和另一类心理过程能够彼此支持。
    // 辅助功能只作较小区分，避免单道 Ne/Se、Fe/Te 题把整个类型翻转。
    const score = (functionScores[dominant] * 0.45)
      + (orientation * 0.25)
      + (supportingProcess * 0.20)
      + (functionScores[auxiliary] * 0.10);
    return { typeCode, score: round(score, 3), stack };
  }).sort((a, b) => b.score - a.score || a.typeCode.localeCompare(b.typeCode));
}

function cognitiveDimensions(questions, answers) {
  if (questions.some((question) => question.cognitiveFunction)) {
    const functions = cognitiveFunctionScores(questions, answers);
    const average = (...keys) => mean(keys.map((key) => functions[key]));
    const normalized = {
      EI: round((average('Se', 'Ne', 'Te', 'Fe') - average('Si', 'Ni', 'Ti', 'Fi')) / 2, 3),
      NS: round((average('Ne', 'Ni') - average('Se', 'Si')) / 2, 3),
      TF: round((average('Te', 'Ti') - average('Fe', 'Fi')) / 2, 3),
      JP: round((average('Te', 'Fe') - average('Se', 'Ne')) / 2, 3)
    };
    return Object.fromEntries(Object.entries(normalized).map(([key, value]) => [key, { raw: value, max: 1, normalized: value }]));
  }
  const values = answerMap(questions, answers);
  const dimensions = { EI: { raw: 0, max: 0 }, NS: { raw: 0, max: 0 }, TF: { raw: 0, max: 0 }, JP: { raw: 0, max: 0 } };
  questions.forEach((question) => {
    const answer = values[question.id];
    if (!answer) return;
    dimensions[question.dimension].raw += (answer - 3) * question.direction;
    dimensions[question.dimension].max += 2;
  });
  Object.keys(dimensions).forEach((key) => {
    dimensions[key].normalized = dimensions[key].max ? round(dimensions[key].raw / dimensions[key].max, 3) : 0;
  });
  return dimensions;
}

function getFollowupQuestions(id, answers) {
  if (id !== 'cognitive' || !Array.isArray(answers)) return [];
  const baseCount = assessments.cognitive.questions.length;
  const baseAnswers = answers.slice(0, baseCount).map(Number);
  if (baseAnswers.length !== baseCount || baseAnswers.some((value) => !Number.isFinite(value) || value < 1 || value > 5)) return [];
  const straightLining = Math.max(...baseAnswers) === Math.min(...baseAnswers);
  return straightLining ? assessments.cognitive.followups.slice() : [];
}

const cognitiveCopy = {
  E: {
    tag: '边聊边想',
    natural: '你常常会在互动里把想法越说越清楚。外界的回应能帮你整理线索，也容易让你更快进入行动。',
    love: '关系里有来有回时，你更容易感到连接正在发生。'
  },
  I: {
    tag: '先想再说',
    natural: '重要的想法说出口前，你更愿意先在心里整理。安静不是疏远，而是你确认感受和判断的方式。',
    love: '你未必频繁表达，但会把真正重要的人和事放在心里反复想过。'
  },
  N: {
    tag: '看见可能',
    natural: '你容易从零散线索里看见可能性和长期方向。新鲜的连接会点亮你，但选择太多时也可能暂时难以落地。'
  },
  S: {
    tag: '重视具体',
    natural: '你更信任真实发生过的经验和能被确认的细节。清楚的例子与下一步，会比抽象承诺更让你安心。'
  },
  T: {
    tag: '标准清楚',
    decision: '做判断时，你会自然地寻找一致的标准和说得通的逻辑。直接能让问题更清楚，只是有时别人需要先被理解，再一起找办法。'
  },
  F: {
    tag: '在意影响',
    decision: '做选择时，你很自然地把具体的人和关系放进考虑。你愿意照顾感受，也需要留意不要太快把自己的不舒服放到最后。'
  },
  J: {
    tag: '喜欢确定',
    rhythm: '事情有安排、关系有回应时，你会明显放松。确定感能帮你稳定推进；计划改变时，给自己留一点缓冲会更舒服。',
    stuck: '重要的事一直悬着时，你容易把很多精力放在等待一个确定答案。'
  },
  P: {
    tag: '保留空间',
    rhythm: '你喜欢让选择保持一点开放，边走边调整常常比过早定死更自然。自由让你灵活，也可能让需要明确节奏的人有些没底。',
    stuck: '选项很多或期限还远时，你可能会把真正的决定留到很后面。'
  }
};

const typeProfileSummaries = {
  INTJ: '你习惯先在心里搭好一套结构，再决定要不要行动。真正重要的事，你不会只看眼前顺不顺，而会反复确认它是否值得长期投入。',
  INTP: '你很难只接受一个现成答案。比起快速表态，你更愿意把问题拆开、换几个角度，再找到真正说得通的那一层。',
  ENTJ: '你会本能地寻找方向、资源和下一步。看见事情可以变得更好时，你很难只停在讨论里，也容易把身边的人一起带进节奏。',
  ENTP: '新的可能会迅速点亮你。你喜欢通过讨论碰撞想法，也擅长看见别人还没注意到的转弯，只是兴趣离开后，收尾会需要额外耐心。',
  INFJ: '你习惯先在心里看清事情的长期走向，也很容易留意别人没有说出口的感受。',
  INFP: '你对“这件事是否真诚、是否符合内心”很敏感。你不一定马上表达，但真正认定的人和价值，会被你安静而长久地放在心里。',
  ENFJ: '你很容易感受到一群人之间的温度，也愿意主动让关系往更好的方向走。你擅长照顾气氛，却可能比别人更晚发现自己已经累了。',
  ENFP: '你会被人、故事和新的可能迅速打动。真诚的连接能让你很有能量，但当选择太多、情绪太满时，也容易一时不知道先抓住哪一个。',
  ISTJ: '你更信任经过验证的经验，也愿意把答应的事情稳稳做好。别人可能只看见你的克制，却不一定知道可靠就是你表达在意的一种方式。',
  ISFJ: '你会记住许多别人没留意的小事，并用具体行动照顾重要的人。你不喜欢给别人添麻烦，也因此容易把自己的需要放得太轻。',
  ESTJ: '你擅长把模糊的事变得清楚、可执行。面对责任时你愿意站出来，只是当别人仍在消化感受时，你可能已经走到了“那现在怎么办”。',
  ESFJ: '关系里有没有回应、大家是否舒服，对你很重要。你愿意维持连接，也会认真兑现日常里的承诺，只是别人的冷淡容易让你多想一会儿。',
  ISTP: '你习惯先观察真实情况，再用最直接的方式解决问题。你不太喜欢把情绪说得很满，但在需要的时候出现，是你很实际的在意。',
  ISFP: '你对氛围、分寸和真实感受很敏锐。你未必喜欢解释自己，却会通过选择、行动和细节表达“这对我很重要”。',
  ESTP: '你很能进入现场，也愿意先行动再调整。越真实、越有反馈的事情越能调动你；太久的悬而未决反而容易让你失去耐心。',
  ESFP: '你很会感受当下的人和气氛，也愿意用真实的回应让关系有温度。你看起来轻松明亮，但不代表你不会认真在意别人怎样对待你。'
};

const cognitiveFacetCopy = {
  expression: {
    positive: '很多想法是在说出来以后才真正成形，交流对你来说也是整理思路的一部分。',
    negative: '你不是没有想法，而是希望先在心里把它放到一个合适的位置，再认真说出来。'
  },
  energy: {
    positive: '有回应、有互动的环境更容易把你的状态调动起来。',
    negative: '热闹过后你需要把注意力收回来，独处是恢复，不是对谁失去兴趣。'
  },
  participation: {
    positive: '当现场需要有人迈出第一步时，你通常比自己想象中更愿意站出来。',
    negative: '你会先读懂现场和人与人的距离，确认舒服以后才真正加入。'
  },
  detail: {
    positive: '比起停在眼前的细节，你更容易继续追问它背后的意义和走向。',
    negative: '你很容易从具体细节里确认一件事是否可靠，真实发生过的行动比漂亮说法更有分量。'
  },
  possibility: {
    positive: '你会自然看到事情还可以怎样发展，这让你很早就察觉新的可能。',
    negative: '你更愿意先把眼前真实的部分处理好，再考虑还没有发生的可能。'
  },
  learning: {
    positive: '你擅长从零散线索里抓住规律，有时答案还没完全出现，你已经隐约看见方向。',
    negative: '清楚的步骤、真实的例子和可验证的经验，会让你学得更安心。'
  },
  principle: {
    positive: '你希望判断经得起推敲，也不喜欢因为对象不同就改变同一套标准。',
    negative: '你会把真实的人放进判断里，因为对你来说，影响谁、怎样影响同样是事实的一部分。'
  },
  care: {
    positive: '你更愿意先把问题讲清楚；这份直接常常是认真负责，而不是不在意。',
    negative: '做选择时你很难完全忽略关系里的感受，哪怕这会让决定变慢一点。'
  },
  support: {
    positive: '别人来找你时，你会很自然地一起找出口，用解决问题的方式表达在意。',
    negative: '你知道很多时候人并不缺答案，先被听见、被理解，才有力气继续往前。'
  },
  closure: {
    positive: '事情一直悬着会占据你的注意力，明确不是控制，而是让你知道力气该放在哪里。',
    negative: '你不急着过早封住答案，保留选择会让你更从容地看清真正想要什么。'
  },
  flexibility: {
    positive: '计划被突然打乱时，你需要一点时间重新找到秩序，这不是僵硬，而是认真投入过。',
    negative: '面对变化时你通常能边走边调，新的情况不会立刻让你失去方向。'
  },
  planning: {
    positive: '提前安排会让你更安心，也让你能把答应的事情稳稳放在心上。',
    negative: '你更喜欢跟着现场调整，太早把一切定死反而会消耗你的兴致。'
  }
};

function cognitiveFacetScores(questions, answers) {
  const values = answerMap(questions, answers);
  const grouped = {};
  questions.forEach((question) => {
    if (!question.facet || !values[question.id]) return;
    if (!grouped[question.facet]) grouped[question.facet] = [];
    grouped[question.facet].push(((values[question.id] - 3) * question.direction) / 2);
  });
  return Object.fromEntries(Object.entries(grouped).map(([key, list]) => [key, round(mean(list), 3)]));
}

function cognitiveExtensions(letters, typeCode) {
  const thinking = letters.TF === 'T'
    ? '你表达在意时，常会先帮对方分析问题、找办法。你不是没有感受，只是习惯让“我能为你做什么”走在前面。'
    : '你很容易先感受到一件事对彼此的影响。关系里的语气、态度和有没有被认真对待，常常和事情本身一样重要。';
  const closeness = letters.EI === 'E'
    ? '有来有回的聊天、及时的回应和一起经历事情，会让你更确定连接正在发生。'
    : '你需要先确认安全和信任，才会慢慢把更深的自己交出来。表达不频繁，不等于感情不深。';
  const rhythm = letters.JP === 'J'
    ? '暧昧太久、计划一直悬着，容易消耗你的注意力。你想要的不是控制，而是知道彼此大致站在哪里。'
    : '你喜欢让关系自然生长，不急着过早定义。只是对方需要确定时，完全随缘可能会被理解成不够认真。';
  const language = letters.NS === 'N'
    ? '你容易通过未来、意义和“我们可能成为怎样”感受到浪漫，也需要一些具体行动替想象落地。'
    : '你更容易从真实陪伴、兑现承诺和日常细节里感受到爱。只有漂亮的话，很难让你真正安心。';
  return {
    love: {
      eyebrow: `${typeCode} · 延伸解读`,
      title: '恋爱里的你',
      lead: `${closeness} ${language}`,
      sections: [
        { title: '你怎么确认喜欢', body: closeness },
        { title: '你表达在意的方式', body: thinking },
        { title: '你舒服的相处节奏', body: rhythm },
        { title: '别人可能没看见的部分', body: letters.EI === 'I' ? '你常常先把感受整理好再说，所以对方可能低估了你心里已经发生了多少。' : '你愿意主动靠近，但如果回应长期落空，表面的热情也会慢慢变成自我怀疑。' }
      ],
      action: '可以把“你应该懂我”换成一句更具体的话：我喜欢怎样被回应、我需要多久独处、什么会让我确认我们是站在一起的。'
    },
    stuck: {
      eyebrow: `${typeCode} · 延伸解读`,
      title: '你容易卡在哪里',
      lead: cognitiveCopy[letters.JP].stuck,
      sections: [
        { title: '最容易触发你的时刻', body: rhythm },
        { title: '你会自动启动的方式', body: letters.TF === 'T' ? '你可能先讲道理、找原因，希望尽快恢复秩序；可对方还停在感受里时，会觉得自己没有被听见。' : '你可能先照顾对方的感受，反复调整表达；如果一直没有回应，也容易把不舒服变成对自己的怀疑。' },
        { title: '真正让你累的', body: letters.NS === 'N' ? '不是只有眼前这件事，而是你会很快联想到它是不是代表关系以后也会这样。' : '不是你不愿意理解，而是模糊的承诺和没有落实的行动，会让你很难继续相信。' },
        { title: '你真正需要的', body: '你需要的不是完美处理，而是一个足够清楚的信号：我们看见问题，也愿意一起回来。' }
      ],
      action: '卡住时先问自己：我现在想确认事实、表达感受，还是一起解决问题？一次只做其中一件。'
    },
    practice: {
      eyebrow: `${typeCode} · 一个小练习`,
      title: '把需要翻译成一句话',
      lead: '选一件最近反复想起的小事，不解释整段关系，只练习说清这一刻。',
      sections: [
        { title: '先写事实', body: '只写摄像机能拍到的内容，不写“你根本不在乎我”这类解释。' },
        { title: '再写感受', body: '用一个简单词：失落、紧张、委屈、疲惫或不确定。' },
        { title: '最后写请求', body: '请求要小到对方知道怎样回应，例如“今晚能不能留十分钟听我说完”。' }
      ],
      action: '句式：当＿＿发生时，我有点＿＿。如果可以，我希望我们＿＿。'
    }
  };
}

function cognitiveDeepDive(typeCode, functionScores) {
  const stack = cognitiveTypeStacks[typeCode];
  const dynamics = cognitiveTypeDynamics[typeCode];
  const dominant = cognitiveFunctionGuide[stack[0]];
  const auxiliary = cognitiveFunctionGuide[stack[1]];
  const inferior = cognitiveFunctionGuide[stack[3]];
  const functionDistribution = Object.entries(functionScores)
    .map(([code, value]) => ({
      code,
      name: cognitiveFunctionGuide[code].name,
      plain: cognitiveFunctionGuide[code].plain,
      value,
      percent: Math.max(6, Math.min(94, Math.round(((value + 1) / 2) * 100)))
    }))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const dominantIsPerceiving = ['Se', 'Si', 'Ne', 'Ni'].includes(stack[0]);
  const supportingLabel = dominantIsPerceiving
    ? (typeCode[2] === 'T' ? '思维判断' : '价值与人的影响')
    : (typeCode[1] === 'N' ? '模式、意义与可能' : '具体事实与经验');
  return {
    title: `你的核心功能组合：${stack[0]}–${stack[1]}`,
    lead: dynamics.lead,
    body: dynamics.together,
    coreFunctions: [
      { code: stack[0], role: '主导功能 · 你最自然的方式', name: dominant.name, body: cognitiveFunctionDetail[stack[0]] },
      { code: stack[1], role: '辅助功能 · 帮你和世界连接', name: auxiliary.name, body: cognitiveFunctionDetail[stack[1]] }
    ],
    functionDistribution,
    sections: [
      { title: '为什么得到这个组合', body: `计分先综合判断你更常依赖哪一种主导功能，再看另一类心理过程更偏向“${supportingLabel}”，同时检查内外倾方向是否一致；不是把八个分数最高的两个直接拼在一起。` },
      { title: '它们怎样一起工作', body: dynamics.together },
      { title: '你顺起来的时候', body: `${cognitiveFunctionDetail[stack[0]]} ${cognitiveFunctionDetail[stack[1]]}` },
      { title: '压力大时可能发生什么', body: `类型动力学认为，当一个人过度依赖“${dominant.name}”时，${dominant.stress}平时较少使用的“${inferior.name}”也可能突然变强：${inferior.stress}这是一种理论提示，不是本次题目直接测出的压力诊断。` },
      { title: '让自己更平衡一点', body: `${auxiliary.growth} ${inferior.growth}` }
    ],
    note: '核心组合来自类型动力学；八维条形图来自本次回答。它们不是简单的“前两名拼接”，也不代表能力高低。'
  };
}

function scoreCognitive(answers, questionIds) {
  const assessment = assessments.cognitive;
  const allQuestions = assessment.questions.concat(assessment.followups);
  const questions = questionIds
    ? questionIds.map((id) => allQuestions.find((question) => question.id === id)).filter(Boolean)
    : allQuestions.slice(0, answers.length);
  const functions = cognitiveFunctionScores(questions, answers);
  const dimensions = cognitiveDimensions(questions, answers);
  const candidates = rankCognitiveTypes(functions);
  const answerSpread = Math.max(...answers.map(Number)) - Math.min(...answers.map(Number));
  const isFlat = answerSpread === 0;
  const typeCode = candidates[0].typeCode;
  const letters = { EI: typeCode[0], NS: typeCode[1], TF: typeCode[2], JP: typeCode[3] };
  const typeName = typeTitles[typeCode] || '认知偏好画像';
  const candidateGap = round(candidates[0].score - candidates[1].score, 3);
  const boundaryFlags = isFlat ? ['flat'] : [];
  Object.entries(dimensions).forEach(([key, value]) => {
    if (Math.abs(value.normalized) < 0.12) boundaryFlags.push(key);
  });
  if (candidateGap < 0.05) boundaryFlags.push('TYPE');
  const title = `${typeCode} · ${typeName}`;
  const confidence = isFlat ? '回答较集中' : '本次画像';
  const strongestFunctions = Object.entries(functions).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const personalDetail = strongestFunctions.map(([key]) => cognitiveFunctionDetail[key]).join(' ');
  const deepDive = cognitiveDeepDive(typeCode, functions);
  const stack = cognitiveTypeStacks[typeCode];
  const dominant = cognitiveFunctionGuide[stack[0]];
  const auxiliary = cognitiveFunctionGuide[stack[1]];
  const inferior = cognitiveFunctionGuide[stack[3]];
  const relationshipMisread = letters.EI === 'I'
    ? (letters.TF === 'T'
      ? '你常常先在心里把问题想明白，再用解决问题或实际行动表达在意。别人可能只看到你话少、反应慢，却没看到你已经认真处理了很久。'
      : '你心里的感受通常比说出来的多。你会先确认安全、分寸和自己真正想说什么，因此沉默有时会被误会成冷淡。')
    : (letters.TF === 'T'
      ? '你习惯边互动边理清问题，也会很快提出办法。你的直接常常来自投入，只是别人有时会先听见“结论”，晚一点才感受到你的在意。'
      : '你会主动回应、照顾气氛，也容易让别人以为你一直有余力。实际上，长期只有你在维持连接时，你也会突然耗尽。');
  const insights = [
    { title: '别人先看到的你', body: `${typeProfileSummaries[typeCode]} 这不是你全部的样子，但很可能是你最省力、也最常被别人认出来的一面。` },
    { title: '你心里真正发生的', body: deepDive.body },
    { title: '压力一来，你可能会反过来', body: `平时你更依赖“${dominant.name}”。压力累积时，${dominant.stress} 同时，较少使用的“${inferior.name}”也可能突然冒出来：${inferior.stress}` },
    { title: '关系里容易被误会的地方', body: relationshipMisread },
    { title: '更适合你的调整方式', body: `你不需要变成相反的人。先让“${auxiliary.name}”多参与一点：${auxiliary.growth} 当你卡得很紧时，也可以试试：${inferior.growth}` }
  ];
  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    title,
    typeCode,
    typeName,
    letterCards: typeCode.split('').map((letter) => cognitiveLetterCards[letter]),
    deepDive,
    tags: [cognitiveCopy[letters.EI].tag, cognitiveCopy[letters.NS].tag, cognitiveCopy[letters.TF].tag],
    summary: typeProfileSummaries[typeCode],
    sections: [
      { title: '你自然的样子', body: `${cognitiveCopy[letters.EI].natural} ${cognitiveCopy[letters.NS].natural}` },
      { title: '你如何做决定', body: cognitiveCopy[letters.TF].decision },
      { title: '很像你的两个细节', body: personalDetail },
      { title: '你习惯的生活节奏', body: cognitiveCopy[letters.JP].rhythm },
      { title: '关系里的你', body: `${cognitiveCopy[letters.EI].love} 这是一种偏好，不代表你只能用这一种方式靠近别人。` },
      { title: '容易卡住的时刻', body: cognitiveCopy[letters.JP].stuck }
    ],
    insights,
    reminder: '把结果当作一张观察自己的地图，而不是必须维持的人设。你随时可以使用不那么习惯的那一面。',
    extensions: cognitiveExtensions(letters, typeCode),
    scores: Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, value.normalized])),
    facets: functions,
    functionScores: functions,
    functionLabels: cognitiveFunctionNames,
    typeCandidates: candidates.slice(0, 3),
    baselineProfile: {
      typeCode,
      dominantFunction: candidates[0].stack[0],
      auxiliaryFunction: candidates[0].stack[1],
      candidateGap,
      strength: candidateGap >= 0.05 ? 'stable' : 'nearby',
      sourceVersion: assessment.version
    },
    shareLine: `${typeCode}｜${typeProfileSummaries[typeCode].split('。')[0]}。`,
    scoreLabels: { x: '更关注自己', x2: '更关注他人', y: '需要确定', y2: '随遇而安' },
    map: {
      x: Math.round(((dimensions.TF.normalized + 1) / 2) * 100),
      y: Math.round(((1 - dimensions.JP.normalized) / 2) * 100)
    },
    confidence,
    boundaryFlags,
    ruleIds: [`CP_${typeCode}`, ...boundaryFlags.map((flag) => `CP_BOUNDARY_${flag}`)],
    evidenceId: assessment.evidenceId,
    version: assessment.version,
    tone: assessment.tone
  };
}

const attachmentProfiles = {
  low_low: ['关系里比较能松下来', '你通常能在亲近和独立之间找到一点余地。联系暂时变少时，你不容易马上否定关系；需要帮助时，也比较愿意让对方靠近。', '这不代表你从不不安，而是很多时候，你相信问题可以被谈清楚，关系不必靠反复确认才能维持。', '稳定也可能让你低估对方的不安。对方需要回应时，多说一句确定的话，会让这份安全感变成两个人都能感受到的东西。'],
  mid_low: ['愿意靠近，也会在意回应', '你愿意投入关系，也能表达需要。只是当回应变得模糊时，你偶尔会多想一会儿，希望得到更清楚的确认。', '你并不是一直缺乏安全感，更像是在关系重要的时候，对变化比较敏感。', '不安出现时，试着问一件具体的事，比反复猜“他还在不在意我”更容易得到真实答案。'],
  high_low: ['很认真地确认连接', '你很在意关系里的回应。对方语气淡一点、消息慢一点，你可能就会想：是不是哪里变了。', '你需要先感到确定，才能真正放松。只是有时候，越急着确认，心里反而越难安静。', '比起试探或一个人补全故事，直接说“我现在有点不安，想确认我们是不是还好”，更容易被理解。'],
  low_mid: ['独立里保留一点距离', '你大多相信关系不会轻易消失，但遇到很浓的情绪时，还是更习惯先自己整理。', '这份独立让你不容易被关系牵着走，也可能让别人晚一点才知道你的真实需要。', '不用一次说完整，先告诉对方“我需要一点时间，之后会回来谈”，就能同时保留空间和连接。'],
  mid_mid: ['靠近和退后都会出现', '你既会期待回应，也会在压力变大时想先退开。关系顺利时你能自然靠近；不确定时，心里可能同时出现“想确认”和“别管我”。', '这不是矛盾的人格，而是你会根据当时的安全感调整距离。', '先分清此刻更需要“被确认”还是“有空间”，再把其中一个需要说出来，会比忽冷忽热更轻松。'],
  high_mid: ['想靠近，也怕自己太需要', '你很在意对方的回应，却不一定能轻松地把这份在意说出来。有时你会等、会猜，甚至先变得冷一点。', '你一边希望连接稳定，一边又担心自己的需要显得太多。真正让你累的，常常是不知道能不能放心表达。', '把试探换成一个小而具体的请求，例如“今晚能不能留十分钟听我说”，会更容易得到清楚回应。'],
  low_high: ['习惯把自己照顾好', '你不太需要频繁确认关系，也习惯把情绪先放回自己手里。别人靠得很近时，你可能会下意识守住自己的节奏。', '独立让你有稳定感，但对方可能只看到你的平静，看不到你其实也有需要。', '偶尔说清楚“我想自己待一会儿，但不是在推开你”，会少很多误会。'],
  mid_high: ['需要空间，也在意是否被理解', '你希望关系可靠，却不喜欢被过度追问或紧紧靠住。你在意对方有没有理解自己，同时又很难马上解释内心发生了什么。', '当亲近被体验成压力时，退后是你恢复秩序的方式；但退得太突然，连接也会一起变得模糊。', '为自己的空间加一个时间边界，比如“我想安静到晚上，之后再聊”，会让双方都更安心。'],
  high_high: ['一边想确认，一边想退开', '关系对你很重要，但真正靠近时，你也可能感到紧张。你想知道对方是否还在，又担心暴露需要后失去主动。', '这不是你故意让人猜，而是两种保护方式同时出现：怕失去，也怕受伤。', '先不急着解决整段关系，只说清楚这一刻更需要什么。一个具体请求更容易被接住。']
};

// 对外结果只保留依恋理论中常用的四个象限。3×3 band 仍用于生成
// 更细的共情文案，但不会再变成额外的“类型”或额外海报。
const attachmentCoreStyles = {
  secure: { typeCode: 'secure', typeName: '安全型依恋', profileName: '能安心靠近，也保有自己' },
  anxious: { typeCode: 'anxious', typeName: '焦虑型依恋', profileName: '越重要，越需要确认连接' },
  avoidant: { typeCode: 'avoidant', typeName: '回避型依恋', profileName: '独立让你更有安全感' },
  fearful: { typeCode: 'fearful-avoidant', typeName: '恐惧—回避型依恋', profileName: '怕失去，也怕靠得太近' }
};

// 九种共鸣画像必须服从四个主区域，不能再出现“主标题是安全型，
// 细分画像却同时强调追逐与退开”的互相否定。靠近中点时仍给明确主结果，
// 但使用该主结果内部更温和的画像。
function attachmentProfileKey(typeCode, anxiety, avoidance) {
  if (typeCode === 'secure') {
    if (anxiety < 2.5 && avoidance < 2.5) return 'low_low';
    return anxiety >= avoidance ? 'mid_low' : 'low_mid';
  }
  if (typeCode === 'anxious') {
    if (anxiety >= 3.5 && avoidance < 2.5) return 'high_low';
    return avoidance >= 2.5 ? 'high_mid' : 'mid_low';
  }
  if (typeCode === 'avoidant') {
    if (avoidance >= 3.5 && anxiety < 2.5) return 'low_high';
    return anxiety >= 2.5 ? 'mid_high' : 'low_mid';
  }
  if (anxiety >= 3.5 && avoidance >= 3.5) return 'high_high';
  if (Math.abs(anxiety - avoidance) <= 0.2) return 'mid_mid';
  if (anxiety > avoidance) return 'high_mid';
  if (avoidance > anxiety) return 'mid_high';
  return 'high_high';
}

function attachmentExtensions(anxiety, avoidance, profile) {
  const seeksReply = anxiety > 3;
  const needsSpace = avoidance > 3;
  const loveSignal = seeksReply
    ? '你会从回应的速度、语气和有没有被放在心上，确认这段关系是不是还稳稳存在。'
    : '你通常不会因为短暂安静就否定关系，也愿意给彼此一些不用时时解释的空间。';
  const spaceSignal = needsSpace
    ? '真正靠近以后，你仍然需要保留自己的节奏。你不是不想爱，而是不希望亲密变成随时都要交代。'
    : '你愿意让重要的人参与自己的生活，也比较能在需要时承认“这件事我想和你一起面对”。';
  return {
    love: {
      eyebrow: '依恋倾向 · 延伸解读',
      title: '恋爱里的你',
      lead: `${loveSignal} ${spaceSignal}`,
      sections: [
        { title: '你怎样确认被爱', body: loveSignal },
        { title: '你舒服的距离', body: spaceSignal },
        { title: '别人可能没看见的部分', body: seeksReply ? '你看起来像是在等一条消息，心里真正等待的却是一个确定信号：我对你仍然重要。' : '你不常追问，不代表什么都不在意。很多时候，你只是更相信稳定应该体现在长期行动里。' },
        { title: '你真正想听见的', body: needsSpace ? '你可以有自己的空间，我不会因为你暂时安静就否定我们的连接。' : '你的需要不会给我添麻烦，我们可以一起想办法。' }
      ],
      action: '把“你应该知道”换成一个小而具体的请求，会比试探更容易得到真实回应。'
    },
    stuck: {
      eyebrow: '依恋倾向 · 延伸解读',
      title: '你容易卡在哪里',
      lead: profile[2],
      sections: [
        { title: '最容易触发你的时刻', body: seeksReply ? '回复突然变慢、语气变淡，或者争执后没有下文时，你会比平时更难把注意力收回来。' : '别人情绪很浓、追问很紧，或者要求你马上表态时，你更容易觉得没有喘息空间。' },
        { title: '你会自动做什么', body: needsSpace ? '你可能先沉默、缩回去，等自己恢复以后再处理；但对方只看见了距离，不一定知道你还会回来。' : '你可能继续解释、继续确认，希望尽快把关系拉回安全的位置；越没有回应，心里越难停下来。' },
        { title: '这其实在保护什么', body: profile[2] },
        { title: '循环怎样停下来', body: needsSpace ? '空间可以保留，但给它一个大致时间：“我想安静到晚上，之后我们再聊。”' : '先说事实和一个请求：“刚才没有回应，我有点不安。你方便告诉我什么时候能聊吗？”' }
      ],
      action: '先照顾当下最具体的不安，不急着用这一刻判断整段关系。'
    },
    practice: {
      eyebrow: '依恋倾向 · 一个小练习',
      title: '让需要更容易被接住',
      lead: '想起最近一次你想靠近、又不知道怎样开口的时刻。',
      sections: [
        { title: '只写发生了什么', body: '不写“你从来不在乎”，只写能够被看到或听到的事实。' },
        { title: '承认一个感受', body: '选一个最贴近的词：不安、委屈、疲惫、压力或失落。' },
        { title: '提出一个小请求', body: '请求要小到对方知道怎样回应，也允许对方诚实回答。' }
      ],
      action: '句式：刚才＿＿的时候，我有点＿＿。你愿不愿意＿＿？'
    }
  };
}

const attachmentFacetCopy = {
  rejection: '当回应突然变少，或摩擦迟迟没有收尾时，你会更容易把变化理解成关系可能正在远离。',
  reassurance: '真正让你安定下来的，往往不是自己反复想通，而是得到一个清楚、持续的关系信号。',
  worth: '当投入看起来不对等，或回应没有及时出现时，你容易开始怀疑自己在对方心里的位置。',
  openness: '难受时，你更习惯先把情绪收回自己这里；这样能保护脆弱，也可能让对方晚一点才知道你需要什么。',
  dependence: '让自己真正依靠另一个人会带来一点失去掌控的感觉，所以你可能更愿意先证明自己可以处理。',
  closeness: '关系靠得很近时，你仍需要保留一块属于自己的空间；如果没有说清，它有时会被误读成冷淡。'
};

function scoreAttachment(answers) {
  const assessment = assessments.attachment;
  const values = answerMap(assessment.questions, answers);
  const grouped = { anxiety: [], avoidance: [] };
  const facetValues = {};
  assessment.questions.forEach((question) => {
    const answer = values[question.id];
    const scored = question.reverse ? 6 - answer : answer;
    grouped[question.dimension].push(scored);
    if (!facetValues[question.facet]) facetValues[question.facet] = [];
    facetValues[question.facet].push(scored);
  });
  const facets = Object.fromEntries(Object.entries(facetValues).map(([key, list]) => [key, round(mean(list))]));
  const anxiety = round(mean(grouped.anxiety));
  const avoidance = round(mean(grouped.avoidance));
  const aBand = band(anxiety);
  const vBand = band(avoidance);
  const neutralCount = answers.filter((value) => Number(value) === 3).length;
  const mostlyNeutral = neutralCount / answers.length >= 0.6;
  const answerCounts = answers.reduce((counts, value) => {
    const key = String(Number(value));
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const straightLining = Math.max(...Object.values(answerCounts)) / answers.length >= 0.8;
  const centered = anxiety >= 2.8 && anxiety <= 3.2 && avoidance >= 2.8 && avoidance <= 3.2;
  // ECR 将焦虑与回避视为连续维度，没有官方的固定分型阈值。产品结果以
  // 五级量尺的理论中点划分“最接近的区域”，而不是复用 3.5 高分阈值。
  // 这能保留明确的共鸣主结果，同时避免把大部分中间答案吞进安全型。
  const seeksReply = anxiety > 3;
  const needsSpace = avoidance > 3;
  const resultStyle = seeksReply && needsSpace
    ? attachmentCoreStyles.fearful
    : seeksReply
      ? attachmentCoreStyles.anxious
      : needsSpace
        ? attachmentCoreStyles.avoidant
        : attachmentCoreStyles.secure;
  const profileKey = attachmentProfileKey(resultStyle.typeCode, anxiety, avoidance);
  const profile = attachmentProfiles[profileKey];
  const title = resultStyle.typeName;
  const anxietyFacet = ['rejection', 'reassurance', 'worth'].sort((a, b) => facets[b] - facets[a])[0];
  const avoidanceFacet = ['openness', 'dependence', 'closeness'].sort((a, b) => facets[b] - facets[a])[0];
  const scenario = seeksReply && needsSpace
    ? '很像你的时刻，可能是你盯着一条迟迟没来的回复，心里很想问清楚；可对方真的靠近时，你又怕自己显得太需要，于是先冷下来、说“没事”。'
    : seeksReply
      ? '很像你的时刻，可能是对方只比平时晚回了一会儿，你表面还在做自己的事，注意力却不断回到那段对话：是不是我说错了，还是关系哪里变了。'
      : needsSpace
        ? '很像你的时刻，可能是对方想立刻把话谈清楚，而你脑子里只剩下“先让我安静一下”。你不是不在意，而是需要先把自己从压力里找回来。'
        : '很像你的时刻，可能是关系短暂安静时，你仍能继续自己的生活；等双方状态合适，再回来把事情说清楚。';
  const loop = seeksReply && needsSpace
    ? '你可能先追着确认，得不到想要的回应后又突然撤回；对方只看到忽近忽远，你却同时经历了“怕失去”和“怕暴露”。'
    : seeksReply
      ? '变化出现后，你会更用力寻找信号；对方越含糊，你越想确认，确认越频繁，对方又可能越想退开。真正让你累的不是在意，而是连接一直没有一个清楚落点。'
      : needsSpace
        ? '压力出现后，你先靠沉默恢复；对方看不见你会不会回来，就更用力追问，而追问又让你退得更远。问题往往不是空间本身，而是空间没有时间边界。'
        : '你通常有能力把不安放回对话，而不是立刻变成试探或消失。需要留意的是：你觉得“这件事可以慢慢谈”时，对方可能仍在等待一句明确回应。';
  const misread = seeksReply && needsSpace
    ? '别人可能以为你故意让人猜，其实你不是想制造距离，而是不确定自己的需要能不能被安全接住。'
    : seeksReply
      ? '别人可能只看到你在催回复、问关系，却没看到你真正想确认的是：“我对你还是重要的吗？”'
      : needsSpace
        ? '别人可能把你的沉默理解成冷淡或惩罚，其实很多时候，你只是还没有整理好到能够不伤人地说。'
        : '别人可能觉得你不需要安慰。其实稳定并不等于没有脆弱，只是你比较相信需要可以直接说、关系也经得起短暂距离。';
  const need = seeksReply && needsSpace
    ? '你真正需要的不是无限确认，也不是彻底自由，而是“可以表达需要、也可以暂停，但双方都会回来”的关系。'
    : seeksReply
      ? '你真正需要的是持续、可预期的回应，不是每分钟在线。比起一句很浓的保证，稳定做到的小事更能让你慢慢松下来。'
      : needsSpace
        ? '你真正需要的是不被逼着立刻打开，同时也知道关系不会因为你暂时安静就被撤走。'
        : '你真正需要的是彼此都能直接表达：想靠近时可以靠近，需要空间时也不用靠失联来争取。';
  const insights = [
    { title: `你的主要倾向：${resultStyle.typeName}`, body: `你更接近“${resultStyle.profileName}”。${profile[1]} 依恋类型是对两条连续维度的便捷概括，不是不可改变的身份。` },
    { title: '一个很像你的瞬间', body: `${scenario} 从这次回答看，你对“${attachmentFacetCopy[anxietyFacet].split('。')[0]}”尤其敏感。` },
    { title: '你最容易掉进去的循环', body: `${loop} 你更常用的保护方式是：${attachmentFacetCopy[avoidanceFacet]}` },
    { title: '别人可能误会你的地方', body: misread },
    { title: '你真正需要的关系信号', body: need },
    { title: `焦虑侧面最敏感：${attachmentFacetCopy[anxietyFacet].split('。')[0]}`, body: attachmentFacetCopy[anxietyFacet] },
    { title: `回避侧面最敏感：${attachmentFacetCopy[avoidanceFacet].split('。')[0]}`, body: attachmentFacetCopy[avoidanceFacet] }
  ];
  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    title,
    typeCode: resultStyle.typeCode,
    typeName: resultStyle.typeName,
    profileKey,
    profileTitle: profile[0],
    profileName: resultStyle.profileName,
    tags: [resultStyle.profileName, seeksReply ? '更在意回应' : '更能相信连接', needsSpace ? '更需要空间' : '更愿意靠近'],
    summary: `在“${resultStyle.typeName}”这个大类里，你此刻更像“${profile[0]}”。${profile[1]}${centered ? ' 这次两条倾向都比较温和，因此你在不同关系情境里可能表现出更多弹性；主类型描述的是当前最接近的方向。' : ''}`,
    sections: [
      { title: '你的依恋类型怎样理解', body: `${resultStyle.typeName}表示你当前在依恋焦虑与依恋回避两条轴上的相对位置。它描述这段重要关系中更常出现的反应，不是对你一生的定型。` },
      { title: '你自然的样子', body: profile[1] },
      { title: '这份反应在保护什么', body: profile[2] },
      { title: '最容易触发你的地方', body: attachmentFacetCopy[anxietyFacet] },
      { title: '你保护自己的方式', body: attachmentFacetCopy[avoidanceFacet] },
      { title: '关系里的你', body: seeksReply ? '当回应变慢或关系信号变得模糊时，你更容易把注意力放到“连接还在不在”。这份敏感让你很早发现变化，也会让等待变得辛苦。' : '你通常不需要很多确认，也能相信关系不会因为短暂距离就消失。只是别人未必拥有同样稳定的感受。' },
      { title: '容易卡住的时刻', body: needsSpace ? '压力出现时，你更习惯先靠自己恢复。如果没有说明，空间可能会被对方理解成拒绝。' : '你愿意让信任的人看见需要，但对方开放得更慢时，你可能会不知道该继续靠近还是停下来。' },
      { title: '你真正需要的', body: profile[3] }
    ],
    insights,
    reminder: profile[3],
    extensions: attachmentExtensions(anxiety, avoidance, profile),
    shareLine: `${title}｜${profile[0]}。`,
    scores: { anxiety: round(((anxiety - 1) / 4) * 100, 1), avoidance: round(((avoidance - 1) / 4) * 100, 1) },
    rawScores: { anxiety, avoidance },
    rawFacets: facets,
    scoreLabels: { x: '更愿意靠近', x2: '更需要空间', y: '更需要回应', y2: '更能等待' },
    map: { x: Math.round(((avoidance - 1) / 4) * 100), y: Math.round(((5 - anxiety) / 4) * 100) },
    confidence: mostlyNeutral || straightLining ? '回答较集中' : centered ? '倾向较温和' : '可供参考',
    boundaryFlags: [
      ...(mostlyNeutral ? ['mostly-neutral'] : []),
      ...(straightLining ? ['straight-line'] : []),
      ...(centered ? ['near-midpoint'] : [])
    ],
    ruleIds: [`RS_STYLE_${resultStyle.typeCode.toUpperCase().replace(/-/g, '_')}`, `RS_A_${aBand.toUpperCase()}_V_${vBand.toUpperCase()}`, `RS_AF_${anxietyFacet.toUpperCase()}`, `RS_VF_${avoidanceFacet.toUpperCase()}`],
    evidenceId: assessment.evidenceId,
    version: assessment.version,
    tone: assessment.tone
  };
}

const bigFiveModules = {
  energy: {
    label: '外向活力',
    low: ['能量更愿意往内收', '你不一定排斥社交，只是更习惯把注意力留给少数人或自己的世界。安静能帮你恢复，也让你有时间整理想法。'],
    mid: ['看人，也看场合', '你既能参与热闹，也会需要独处恢复。熟悉、安全或有兴趣的场合可能让你很主动。'],
    high: ['连接会带来能量', '和人互动、交换想法或一起行动，常常能让你更有精神。安静下来以后，也别忘了看看自己是不是已经累了。']
  },
  empathy: {
    label: '共情合作',
    low: ['更愿意保持判断', '你不太会因为大家有同一种感受就立刻跟随，更习惯保留判断。直接和清楚是你的优势。'],
    mid: ['理解与立场都保留', '你能照顾他人感受，也不会为了和谐一直放弃自己的看法。你会随关系调整靠近的方式。'],
    high: ['很容易把别人放进心里', '你会自然注意别人的感受，也愿意配合和支持。只是体谅太快时，自己的不舒服也可能被放到最后。']
  },
  order: {
    label: '自律秩序',
    low: ['更依赖当下动力', '你不太喜欢被固定流程绑住，常根据兴趣和现场情况行动。长期任务里，把第一步做小会更容易开始。'],
    mid: ['有框架，也留余地', '你会在需要时安排事情，也能接受计划变化。重要任务上愿意负责，却不必把所有生活都管理得很紧。'],
    high: ['确定感来自有条理', '提前安排、把事情做好，会让你觉得踏实。计划被打乱时，你可能比表面看起来更受影响。']
  },
  sensitivity: {
    label: '情绪敏感',
    low: ['不容易被波动带走', '压力出现时，你通常比较能保持平稳。这让你在混乱里有稳定感，也需要记得别人可能有更强烈的感受。'],
    mid: ['会波动，也能回来', '你会受到压力和关系变化影响，但多数时候也能慢慢恢复。状态会影响你，却不一定决定所有反应。'],
    high: ['很早就能感觉到变化', '你对压力、语气和环境变化比较敏锐。许多别人晚一点才发现的东西，你可能先感觉到了，也需要更稳定的恢复空间。']
  },
  openness: {
    label: '开放想象',
    low: ['更信任具体和可落地', '比起只谈概念，你更喜欢知道实际怎么做、有没有经验可以参考。具体例子会让你更容易进入。'],
    mid: ['在现实与新鲜之间切换', '你能欣赏新的可能，也会确认它是否适用。不同任务会调动你不同的一面。'],
    high: ['容易被新的可能吸引', '你喜欢连接想法、想象不同路径，也愿意重新理解熟悉的事。选择太多时，先验证一个方向会更有满足感。']
  }
};

function bigFiveExtensions(scores, strongest, context, balanced = false) {
  const energy = bigFiveModules.energy[band(scores.energy)][1];
  const empathy = bigFiveModules.empathy[band(scores.empathy)][1];
  const sensitivity = bigFiveModules.sensitivity[band(scores.sensitivity)][1];
  const order = bigFiveModules.order[band(scores.order)][1];
  return {
    love: {
      eyebrow: '性格底色 · 延伸解读',
      title: '恋爱里的你',
      lead: `${empathy} ${energy}`,
      sections: [
        { title: '你靠近一个人的方式', body: energy },
        { title: '你怎样照顾关系', body: empathy },
        { title: '你对变化的感受', body: sensitivity },
        { title: '你期待的日常', body: order }
      ],
      action: '告诉对方一件“怎样做会让你更有被爱感”的小事，比只分享类型更有用。'
    },
    stuck: {
      eyebrow: '性格底色 · 延伸解读',
      title: '你容易卡在哪里',
      lead: `${sensitivity} ${order}`,
      sections: [
        { title: '压力刚出现时', body: sensitivity },
        { title: '事情拖久以后', body: order },
        { title: '关系里容易忽略的', body: empathy },
        { title: '不必逼自己改变的', body: balanced
          ? '五个方向都接近中间，并不代表你没有特点，而是对象、任务和当时状态会更明显地影响你使用哪一面。'
          : `你的“${bigFiveModules[strongest].label}”是很自然的一部分；调整是多一种选择，不是把它改掉。` }
      ],
      action: '把一件让你累的事缩小成“今天只处理哪一步”，会比要求自己马上恢复更现实。'
    },
    practice: {
      eyebrow: '性格底色 · 一个小练习',
      title: '给自己换一种用力方式',
      lead: balanced
        ? '你的五个方向都比较有弹性，练习不需要把自己推向某个固定极端。'
        : `你在“${bigFiveModules[context].label}”上比较会随情境变化，这也是最容易练习新选择的地方。`,
      sections: [
        { title: '先找到熟悉反应', body: '写下压力出现时，你最容易自动做出的一个动作。' },
        { title: '换一个很小的动作', body: '不要走到完全相反，只比平时多一点表达、多一点停顿或多一点安排。' },
        { title: '观察真实效果', body: '看这次变化有没有让你更舒服，而不是要求自己一次做到完美。' }
      ],
      action: '今天只试一次新的反应，就已经足够。'
    }
  };
}

function scoreBigFive(answers) {
  const assessment = assessments.bigfive;
  const values = answerMap(assessment.questions, answers);
  const grouped = {};
  assessment.questions.forEach((question) => {
    if (!grouped[question.dimension]) grouped[question.dimension] = [];
    const answer = values[question.id];
    grouped[question.dimension].push(question.reverse ? 6 - answer : answer);
  });
  const scores = Object.fromEntries(Object.entries(grouped).map(([key, valuesList]) => [key, round(mean(valuesList))]));
  // 五因素既可能以高分突出，也可能以低分突出；按偏离中点的程度选核心特征，
  // 避免“所有低分特质都永远不可能成为结果标题”。
  const ranked = Object.keys(scores).sort((a, b) => Math.abs(scores[b] - 3) - Math.abs(scores[a] - 3));
  const topDeviation = Math.abs(scores[ranked[0]] - 3);
  const topKeys = ranked.filter((key) => Math.abs(scores[key] - 3) === topDeviation);
  const balanced = topDeviation === 0;
  const multiPeak = topKeys.length > 2;
  const selected = ranked.slice(0, 2);
  const context = Object.keys(scores).sort((a, b) => Math.abs(scores[a] - 3) - Math.abs(scores[b] - 3))[0];
  const moduleFor = (key) => bigFiveModules[key][band(scores[key])];
  const first = moduleFor(selected[0]);
  const second = moduleFor(selected[1]);
  const middle = moduleFor(context);
  const primaryTitle = balanced ? '看人，也看场合' : multiPeak ? '多条性格线索同时出现' : first[0];
  const primarySummary = balanced
    ? '五个方向都接近量尺中点。你不是没有特点，而是对象、任务和当时状态会更明显地决定你使用哪一种反应。'
    : multiPeak
      ? topKeys.map((key) => moduleFor(key)[1]).join(' ')
      : `${first[1]} ${second[1]}`;
  const energyBand = band(scores.energy);
  const empathyBand = band(scores.empathy);
  const orderBand = band(scores.order);
  const sensitivityBand = band(scores.sensitivity);
  const opennessBand = band(scores.openness);
  const socialFace = energyBand === 'low'
    ? '刚认识你的人可能觉得你安静、慢热；真正熟悉以后才会发现，你不是没有表达欲，而是更愿意把精力留给值得的人和话题。'
    : energyBand === 'high'
      ? '刚认识你的人往往很快感受到你的存在感和回应。只是你愿意出现，不代表每一次热闹都不会消耗你。'
      : '你在不同人面前的状态可能差很多：有兴趣、有安全感时会主动，没有必要时也能安静待着。';
  const hiddenSide = empathyBand === 'high' && sensitivityBand === 'high'
    ? '你很快就能看见别人的情绪，也很容易把气氛带回自己身上。别人得到你的理解后，未必知道你其实也需要被问一句“那你呢”。'
    : empathyBand === 'low'
      ? '你不容易为了维持和气就放弃判断。别人有时会觉得你太直接，但你的认真通常体现在：愿意面对问题本身，不用漂亮话敷衍。'
      : sensitivityBand === 'high'
        ? '你表面可能仍在照常处理事情，身体和情绪却比别人更早收到变化。你需要的不是“别想太多”，而是更稳定的恢复条件。'
        : '你通常能在理解别人和保留自己之间切换。真正重要的不是永远平衡，而是压力大时仍知道自己此刻偏向了哪一边。';
  const stressContrast = orderBand === 'high' && sensitivityBand === 'high'
    ? '越在意把事情做好，你越可能在计划被打乱或结果不理想时责怪自己。别人只看到你重新安排，未必看见你心里已经复盘了很多遍。'
    : orderBand === 'low' && opennessBand === 'high'
      ? '新点子会迅速带来能量，但当兴奋过去、任务进入重复收尾，你可能开始拖延，再因为没有完成而否定自己。问题不一定是能力，而是启动和收尾需要不同结构。'
      : sensitivityBand === 'high'
        ? '压力刚出现时，你会先捕捉到变化；如果没有恢复空间，小事也可能在脑中不断放大。先让身体松一点，通常比逼自己马上想通更有效。'
        : '压力下你更可能继续处理眼前问题，直到事情结束才意识到自己其实已经累了。稳定是资源，也别让它变成忽略感受的理由。';
  const fitReminder = selected[0] === 'order'
    ? (orderBand === 'high' ? '给计划留一个“允许变化”的版本，比要求自己完全放松更适合你。' : '把任务入口做小、把收尾交给外部提醒，比逼自己突然变自律更有效。')
    : selected[0] === 'sensitivity'
      ? (sensitivityBand === 'high' ? '减少持续刺激、给恢复留白，不是脆弱，而是在照顾一套接收信息更细的系统。' : '你很能稳住场面，也可以主动问自己一次：我是真的没事，还是还没来得及感觉？')
      : selected[0] === 'energy'
        ? (energyBand === 'high' ? '在安排下一场连接前，给自己一个不需要回应任何人的空档。' : '不用逼自己变外向；提前准备一句开场和一个离场时间，已经足够扩大选择。')
        : `保留“${first[0]}”带来的优势，同时只练习一个比平时多一点的新动作。`;
  const insights = [
    { title: '你的底色不是一个标签', body: balanced
      ? `五个方向这次都接近中间位置。${primarySummary}`
      : multiPeak
        ? `这次同样鲜明的线索包括${topKeys.map((key) => `“${bigFiveModules[key].label}”`).join('、')}。${primarySummary}`
        : `你最突出的两条线索是“${bigFiveModules[selected[0]].label}”和“${bigFiveModules[selected[1]].label}”。${first[1]} 同时，${second[1]}` },
    { title: '别人先看到的你', body: socialFace },
    { title: '熟悉以后才会看见的部分', body: hiddenSide },
    { title: '压力下可能出现的反差', body: stressContrast },
      { title: '更适合你的调整方式', body: fitReminder }
  ];
  const visualDimension = [
    { key: 'energy', level: energyBand },
    { key: 'empathy', level: empathyBand },
    { key: 'order', level: orderBand },
    { key: 'sensitivity', level: sensitivityBand }
  ].reduce((current, candidate) => (
    Math.abs(scores[candidate.key] - 3) > Math.abs(scores[current.key] - 3) ? candidate : current
  ));
  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    // 主视觉只在当前已有素材覆盖的维度中选择更显著的一条；完整结果仍由五个维度共同组成。
    // 同等显著时沿用较早已接入的维度，确保中点和旧结果的展示稳定。
    visualCode: `${visualDimension.key}-${visualDimension.level}`,
    title: primaryTitle,
    tags: balanced
      ? ['五维相对均衡', '看情境切换', '连续维度']
      : (multiPeak ? topKeys.slice(0, 2) : selected).map((key) => bigFiveModules[key].label).concat(multiPeak ? '多维并列' : '连续维度'),
    summary: primarySummary,
    sections: [
      { title: first[0], body: first[1] },
      { title: second[0], body: second[1] },
      { title: '会随情境变化的一面', body: middle[1] },
      { title: '关系里的你', body: `${bigFiveModules.empathy[band(scores.empathy)][1]} ${bigFiveModules.sensitivity[band(scores.sensitivity)][1]}` },
      { title: '给你的理解', body: '五个方向没有好坏，也不需要互相抵消。它们只是帮你看见：什么更自然，什么需要多一点准备。' }
    ],
    insights,
    reminder: '这不是人口百分位，也不用于诊断或高风险决定。把最像你的部分留下，不像的部分也可以先放着。',
    extensions: bigFiveExtensions(scores, selected[0], context, balanced),
    shareLine: `${primaryTitle}｜${primarySummary.split('。')[0]}。`,
    scores,
    scoreLabels: { x: '更安静', x2: '更有活力', y: '更具体', y2: '更开放' },
    map: { x: Math.round(((scores.energy - 1) / 4) * 100), y: Math.round(((5 - scores.openness) / 4) * 100) },
    confidence: '探索性结果',
    boundaryFlags: [],
    ruleIds: balanced
      ? ['BF_BALANCED_MID']
      : topKeys.map((key) => `BF_${key.toUpperCase()}_${band(scores[key]).toUpperCase()}`),
    evidenceId: assessment.evidenceId,
    version: assessment.version,
    tone: assessment.tone
  };
}

const relationshipModules = {
  commitment: {
    label: '共同投入',
    low: '你可能有一种“很多事还是我一个人在扛”的感觉。先挑一件具体的事谈分工，比一次讨论全部失望更容易开始。',
    mid: '你们在一些事情上能站到一起，也有些时候各自忙着自己的部分。把希望对方参与什么说具体，会更清楚。',
    high: '你能感受到对方愿意和你一起处理生活，而不是只在顺利的时候出现。这种“我们是一队”的感觉很珍贵。'
  },
  appreciation: {
    label: '被看见感',
    low: '你可能做了不少，却很少听见一句明确的看见。先说一件最近最希望被理解的付出，会比耗尽后翻旧账更容易开始。',
    mid: '你们不是没有感谢，只是忙起来以后容易默认“对方应该知道”。在意需要偶尔被说出来。',
    high: '你们比较能让彼此知道：付出不是理所当然。具体的感谢会让日常小事也有温度。'
  },
  response: {
    label: '情绪回应',
    low: '当你难受时，可能不太确定自己能不能被接住。可以先从一个小请求开始，例如“先听我说完，不急着给办法”。',
    mid: '有些时候你能被理解，有些时候你们会错过重点。先确认此刻想被听见还是想一起想办法，会更容易对上频道。',
    high: '你大多能在表达脆弱时得到回应，不必一个人把所有情绪整理好才出现。这份空间很珍贵。'
  },
  repair: {
    label: '冲突修复',
    low: '真正消耗你们的可能不只是争执，而是争完以后没有回来。约定暂停后的回来时间，比要求当场一次解决更现实。',
    mid: '你们有时能谈开，有时会卡进熟悉的循环。先识别“通常从哪一句开始失控”，会更容易改变。',
    high: '即使情绪上来，你们大多还知道怎样回到问题，也愿意在不愉快后重新靠近。这种修复能力比从不争执更重要。'
  },
  trust: {
    label: '信任与边界',
    low: '你可能需要花很多力气确认真相、保护自己，或担心表达之后会付出代价。信任不能只靠一个人更懂事；安全、诚实和边界需要双方持续做到。',
    mid: '多数时候你们能尊重彼此，但在压力、社交边界或重要信息上仍会出现猜测。把双方都能接受的界线说具体，会比临时试探更安心。',
    high: '你们大多能诚实谈重要的事，也允许彼此保留合理空间。这样的信任不是毫无边界，而是不用靠控制和反复证明维持连接。'
  }
};

const relationshipPairOrder = ['commitment', 'appreciation', 'response', 'repair', 'trust'];

const relationshipStrengthPairs = {
  commitment_appreciation: '像队友，也看得见彼此',
  commitment_response: '一起承担，也接得住情绪',
  commitment_repair: '遇到问题，仍愿意并肩回来',
  commitment_trust: '既站在一起，也保有边界',
  appreciation_response: '被看见，也能被接住',
  appreciation_repair: '有温度，也愿意把话说回来',
  appreciation_trust: '欣赏彼此，也能安心做自己',
  response_repair: '情绪有回应，冲突也能回来',
  response_trust: '能说真话，也能保留空间',
  repair_trust: '有分歧，也不会失去安全'
};

const relationshipStrainPairs = {
  commitment_appreciation: '付出很多，却越来越不像队友',
  commitment_response: '一起生活，却常常各自承受',
  commitment_repair: '愿意继续，但改变没有真正落地',
  commitment_trust: '想走下去，安全感却跟不上',
  appreciation_response: '彼此在意，却总在需要时错过',
  appreciation_repair: '失望在累积，感谢越来越少',
  appreciation_trust: '在意还在，安心感却变薄了',
  response_repair: '情绪出现了，却很难真正收尾',
  response_trust: '想被理解，也怕说出真实感受',
  repair_trust: '冲突之后，连接很难安全地回来'
};

function relationshipPairKey(keys) {
  return keys.slice(0, 2)
    .sort((a, b) => relationshipPairOrder.indexOf(a) - relationshipPairOrder.indexOf(b))
    .join('_');
}

function relationshipExtensions(scores, strongest, weakest, balanced = false) {
  if (balanced) {
    const level = band(scores[strongest]);
    const levelCopy = level === 'high'
      ? '五种关系资源都比较常出现。真正托住你们的不是某一个优点，而是投入、回应、修复与边界能够一起工作。'
      : level === 'low'
        ? '你感受到的消耗可能不只集中在一次争执，而是投入、回应、修复与安全感都需要双方重新参与。'
        : '五种关系资源目前比较接近：有些时候能够做到，有些时候又不够稳定。具体场景比硬找一个最弱点更重要。';
    return {
      love: {
        eyebrow: '关系状态 · 延伸解读',
        title: '关系中的你',
        lead: levelCopy,
        sections: [
          { title: '你看到的是整体', body: levelCopy },
          { title: '不必硬找一处短板', body: '当几条线索接近时，关系真实的样子往往取决于具体场景，而不是某个固定弱点。' },
          { title: '你为关系做的努力', body: '你愿意认真看见这段关系，说明你并不只想下结论，也想知道双方还能怎样参与。' },
          { title: '别把责任都放回自己', body: '表达可以由你先开始，但稳定的改变必须由两个人共同完成。' }
        ],
        action: '从最近一件具体小事开始，说清发生了什么，以及下次希望双方分别做什么。'
      },
      stuck: {
        eyebrow: '关系状态 · 延伸解读',
        title: '关系容易卡在哪里',
        lead: levelCopy,
        sections: [
          { title: '不是单一问题', body: '几项分数接近时，反复出现的循环可能同时牵动投入、回应和修复，不能只归因给一个方面。' },
          { title: '先缩小场景', body: '挑最近一次最有感受的经历，比一次讨论整段关系更容易看见真实问题。' },
          { title: '确认双方是否参与', body: '对方是暂时不知道怎样做，还是一直不愿意面对？这两种情况需要不同选择。' },
          { title: '你可以保留的底线', body: '理解对方不等于无限等待。你的感受、安全和边界也应该被放进关系里。' }
        ],
        action: '只讨论一个具体场景、一个感受和一个下一步，先看对方是否愿意真正参与。'
      },
      practice: {
        eyebrow: '关系状态 · 一个小练习',
        title: '从具体场景看见整体',
        lead: '回想最近一次让你觉得关系很好，或明显感到消耗的时刻。',
        sections: [
          { title: '写下发生了什么', body: '只记录双方实际说了什么、做了什么，不先判断谁更爱谁。' },
          { title: '标出被牵动的资源', body: '看看这件事同时影响了投入、被看见、回应、修复或边界中的哪几项。' },
          { title: '提出一个可观察请求', body: '把期待变成下次双方都知道怎样做到的一个动作。' }
        ],
        action: '句式：下次再遇到＿＿，我希望我可以＿＿，也希望你愿意＿＿。'
      }
    };
  }
  const strongCopy = relationshipModules[strongest][band(scores[strongest])];
  const weakCopy = relationshipModules[weakest][band(scores[weakest])];
  return {
    love: {
      eyebrow: '关系状态 · 延伸解读',
      title: '关系中的你',
      lead: `你最能依靠的是“${relationshipModules[strongest].label}”，最消耗力气的是“${relationshipModules[weakest].label}”。`,
      sections: [
        { title: '你已经拥有的', body: strongCopy },
        { title: '你一直在等的', body: weakCopy },
        { title: '你为关系做的努力', body: '你愿意认真回答这些问题，说明你并不是只想给关系下结论，而是想知道还有哪里能够被看见。' },
        { title: '别把责任都放回自己', body: '表达可以由你先开始，但稳定的改变必须由两个人共同完成。' }
      ],
      action: '挑一件最近发生的小事，说清“我希望下次我们可以怎样做”，比讨论谁更爱谁更容易靠近。'
    },
    stuck: {
      eyebrow: '关系状态 · 延伸解读',
      title: '关系容易卡在哪里',
      lead: weakCopy,
      sections: [
        { title: '反复出现的地方', body: weakCopy },
        { title: '为什么一直很累', body: '真正消耗人的往往不是一次争执，而是同一个需要说了很多次，却始终没有进入两个人的行动。' },
        { title: '先确认一件事', body: '对方是暂时不知道怎样做，还是一直不愿意面对？这两种情况需要完全不同的选择。' },
        { title: '你可以保留的底线', body: '理解对方不等于无限等待。你的感受、安全和边界，也应该被放进这段关系里。' }
      ],
      action: '只讨论一个具体场景、一个感受和一个下一步，先看对方是否愿意真正参与。'
    },
    practice: {
      eyebrow: '关系状态 · 一个小练习',
      title: '把旧循环停在更早的地方',
      lead: '回想一次最近的不愉快，找到你们通常从哪一句话开始听不见彼此。',
      sections: [
        { title: '圈出转折点', body: '不是找谁先犯错，而是找到对话从解决事情变成互相保护自己的那一刻。' },
        { title: '约定暂停信号', body: '选一句双方都听得懂的话，出现时先停十分钟，不继续升级。' },
        { title: '约定回来时间', body: '暂停不是消失。明确什么时候回来，才能让空间不变成惩罚。' }
      ],
      action: '可以直接说：“我不想把话说重，我们先停一下，晚上九点再回来聊。”'
    }
  };
}

function scoreRelationship(answers) {
  const assessment = assessments.relationship;
  const values = answerMap(assessment.questions, answers);
  const grouped = {};
  assessment.questions.forEach((question) => {
    if (!grouped[question.dimension]) grouped[question.dimension] = [];
    const answer = values[question.id];
    grouped[question.dimension].push(question.reverse ? 6 - answer : answer);
  });
  const scores = Object.fromEntries(Object.entries(grouped).map(([key, value]) => [key, round(mean(value))]));
  const answerCounts = answers.reduce((counts, value) => {
    const key = String(Number(value));
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const straightLining = Math.max(...Object.values(answerCounts)) / answers.length >= 0.8;
  const keys = Object.keys(scores);
  const lows = keys.filter((key) => band(scores[key]) === 'low');
  const highs = keys.filter((key) => band(scores[key]) === 'high');
  const ordered = keys.slice().sort((a, b) => scores[b] - scores[a]);
  const highestScore = Math.max(...keys.map((key) => scores[key]));
  const lowestScore = Math.min(...keys.map((key) => scores[key]));
  const strongestKeys = keys.filter((key) => scores[key] === highestScore);
  const weakestKeys = keys.filter((key) => scores[key] === lowestScore);
  const balanced = highestScore === lowestScore;
  const strongest = ordered[0];
  const weakest = ordered[ordered.length - 1];
  const secondWeakest = ordered[ordered.length - 2];
  const secondStrongest = ordered[1];
  const labelsFor = (items) => items.map((key) => `“${relationshipModules[key].label}”`).join('、');
  const fragileTitles = {
    commitment: '有连接，也像是一个人在扛',
    appreciation: '有在意，却不总能被看见',
    response: '靠得很近，也可能接不住彼此',
    repair: '愿意继续，也困在旧矛盾里',
    trust: '有感情，安全感仍会摇晃'
  };
  const depletedTitles = {
    commitment: '两个人还没真正站到一边',
    appreciation: '关系里很久没有被看见',
    response: '很多感受还没有被接住',
    repair: '旧矛盾正在反复消耗关系',
    trust: '安全与边界正在消耗关系'
  };
  let title;
  let stateCode;
  let stateName;
  let summary;
  if (balanced && highs.length) {
    stateCode = 'resourced';
    stateName = '关系有底气';
    title = '五种关系资源都在托住你们';
    summary = '共同投入、被看见感、情绪回应、冲突修复与信任边界都比较稳定。真正托住你们的不是某一个突出优点，而是几种资源能够一起工作。';
  } else if (balanced && !lows.length) {
    stateCode = 'developing';
    stateName = '有基础，也有待确认';
    title = '关系有基础，也还在慢慢确认';
    summary = '五种关系资源目前处在相近位置：有些时候能够做到，有些时候又不够稳定。比起硬给某一项下结论，更值得回到最近发生的具体场景。';
  } else if (balanced) {
    stateCode = 'depleted';
    stateName = '多处资源正在消耗';
    title = '不是一处问题，而是整体都在消耗';
    summary = '共同投入、被看见感、情绪回应、冲突修复与信任边界都落在较低位置。你感受到的累可能不是一次争执造成的，而是多个环节都需要双方重新参与。';
  } else if (!lows.length && highs.length >= 2) {
    stateCode = 'resourced';
    stateName = '关系有底气';
    title = relationshipStrengthPairs[relationshipPairKey([strongest, secondStrongest])];
    summary = `这段关系目前有不止一个支点。得分较高的是${labelsFor([strongest, secondStrongest])}；相对更需要照顾的是${labelsFor(weakestKeys)}。`;
  } else if (!lows.length) {
    stateCode = 'developing';
    stateName = '有基础，也有待确认';
    title = `相处有基础，${weakestKeys.map((key) => relationshipModules[key].label).join('与')}还需要更确定`;
    summary = `五个关系维度都没有明显落入低位，但支点还不算非常稳定。相对更能依靠的是${labelsFor(strongestKeys)}，更容易出现不确定的是${labelsFor(weakestKeys)}。`;
  } else if (lows.length === 1) {
    stateCode = 'fragile';
    stateName = '有连接，也有消耗';
    title = `${fragileTitles[weakest]}，但${relationshipModules[strongest].label}还在`;
    summary = `这段关系不是只有好或不好。“${relationshipModules[strongest].label}”仍在托住你们，但“${relationshipModules[weakest].label}”已经形成清楚的消耗，需要从感受进入双方能观察到的行动。`;
  } else {
    stateCode = 'depleted';
    stateName = '多处资源正在消耗';
    const weakPair = weakestKeys.length >= 2 ? weakestKeys.slice(0, 2) : [weakest, secondWeakest];
    title = weakestKeys.length > 2
      ? '多处关系资源正在一起消耗'
      : relationshipStrainPairs[relationshipPairKey(weakPair)] || depletedTitles[weakest];
    summary = `你可能已经花了不少力气维持这段关系。${labelsFor(lows)}同时落在低位；现在更重要的是分清哪些可以协商，哪些必须由双方一起投入。`;
  }
  const weakLabel = relationshipModules[weakest].label;
  const strongLabel = relationshipModules[strongest].label;
  const relationshipLoop = balanced ? (stateCode === 'resourced'
    ? '你们不一定没有摩擦，但投入、回应、修复与边界通常能一起把关系接回来。需要留意的是，稳定也要继续通过具体行动让双方都感受到。'
    : stateCode === 'developing'
      ? '你们可能不是固定卡在某一个问题上，而是在不同场景里有时能够互相接住、有时又各自退回熟悉反应。找到最近一次具体转折，比硬找一个短板更准确。'
      : '消耗可能已经不只发生在一次争执里：投入变少、回应错位、问题没有收尾和安全感下降会互相影响。先选一个最影响日常安全的场景开始。') : ({
    commitment: '遇到重要安排时，一方先承担、先决定，另一方后来再配合或解释。久而久之，表面争的是一件事，心里累的是“为什么总是我先把我们放进去”。',
    appreciation: '付出不断发生，却很少被具体说出来。被忽略的一方越做越委屈，另一方又可能觉得“我明明也在努力”，最后双方都觉得自己没有被看见。',
    response: '一个人想先被理解，另一个人急着解释、讲道理或解决。越解释，前者越觉得感受被跳过；越表达情绪，后者越觉得自己做什么都不对。',
    repair: '争执时先升级，之后靠沉默让事情过去。表面恢复正常，同一个伤口却没有被处理，下一次只需要一个很小的触发就会把旧账一起带回来。',
    trust: '一方因为不确定而追问、查看或试探，另一方因为被管得太紧而开始隐藏、回避。越想获得安全，双方越难自然地相信彼此。'
  }[weakest]);
  const effortCopy = balanced ? (stateCode === 'depleted'
    ? '你可能已经在不止一个地方解释、体谅或等待。需要提醒你的是，关系整体的消耗不能只靠你一个人再多做一点来补上。'
    : '你不是在给关系找毛病。几项线索接近，说明更应该回到具体经历，看看哪些行动让你安心，哪些时刻让你失去连接。') : scores[weakest] < 2.5
    ? `你可能已经试过解释、体谅、等待，甚至把要求降得更低。需要提醒你的是，“${weakLabel}”不是只靠你更懂事就能补上的，它必须进入双方可观察的行动。`
    : `你不是在给关系找毛病。你只是察觉到“${weakLabel}”在某些时刻还不够稳定，希望连接不只在顺利时成立。`;
  const nextEvidence = balanced
    ? '挑最近一次最有感受的场景，只讨论双方实际做了什么，以及下次各自愿意多做哪一个动作。'
    : ({
    commitment: '接下来不要只听“我会改”，看对方是否会主动参与一次具体安排，并承担属于自己的部分。',
    appreciation: '接下来留意的不是一句笼统的“爱你”，而是彼此能不能具体说出：我看见你最近做了什么。',
    response: '下一次难受时，先明确说“我现在想先被听完，不急着找办法”，再观察对方能否调整回应。',
    repair: '暂停可以，但要约定回来时间。真正的变化是争执后有人主动重启，并让下一次处理方式不再完全一样。',
    trust: '把边界说成双方都能执行的约定，再看它是否长期一致；安全感不能靠临时查证维持。'
  }[weakest]);
  const overallInsight = balanced
    ? `五种关系资源这次处在同一水平。${summary}`
    : `相对更能托住你的是${labelsFor(strongestKeys)}，更容易消耗你的是${labelsFor(weakestKeys)}，另一处需要留意的是“${relationshipModules[secondWeakest].label}”。这些线索可以同时存在，不需要把关系压成一个好或坏的结论。`;
  const insights = [
    { title: `整体状态：${stateName}`, body: overallInsight },
    { title: balanced ? '这段关系呈现的整体样子' : '你们还拥有的底气', body: balanced ? summary : relationshipModules[strongest][band(scores[strongest])] },
    { title: '最容易反复的相处循环', body: relationshipLoop },
    { title: '你可能已经做了很多', body: effortCopy },
    { title: '接下来要看行动，不只看态度', body: balanced ? nextEvidence : `${nextEvidence} 同时留意“${relationshipModules[secondWeakest].label}”是否也在同一场景里出现。` }
  ];
  const sections = balanced
    ? keys.map((key) => ({ title: relationshipModules[key].label, body: relationshipModules[key][band(scores[key])] }))
      .concat({ title: '你真正需要的', body: '把最具体的一次经历说出来，通常比讨论谁一直做错更容易靠近。关系的改变也不该永远只由一个人完成。' })
    : [
      { title: '最稳的一处', body: relationshipModules[strongest][band(scores[strongest])] },
      { title: '最需要照顾的一处', body: relationshipModules[weakest][band(scores[weakest])] },
      ...ordered.filter((key) => key !== strongest && key !== weakest).map((key) => ({ title: relationshipModules[key].label, body: relationshipModules[key][band(scores[key])] })),
      { title: '你真正需要的', body: '把最具体的一次经历说出来，通常比讨论谁一直做错更容易靠近。关系的改变也不该永远只由一个人完成。' }
    ];
  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    title,
    typeCode: stateCode,
    typeName: stateName,
    profileName: title,
    tags: balanced
      ? [stateName, '五项相对均衡', stateCode === 'depleted' ? '需要共同投入' : '结合具体场景']
      : [stateName, `${relationshipModules[strongest].label}较稳`, `${relationshipModules[weakest].label}需照顾`],
    summary,
    sections,
    insights,
    reminder: '如果你经常感到害怕、被威胁、被控制、被强迫，或担心人身安全，这已经超出本测试能处理的范围。请优先联系可信任的人和当地专业求助渠道。',
    extensions: relationshipExtensions(scores, strongest, weakest, balanced),
    shareLine: balanced
      ? `${title}｜五种关系资源这次处在相近位置。`
      : `${title}｜相对更稳的是${relationshipModules[strongest].label}，更需要照顾的是${relationshipModules[weakest].label}。`,
    scores,
    metricKeys: balanced ? ['commitment', 'response', 'trust'] : [strongest, weakest, secondWeakest],
    scoreLabels: { x: '共同投入', x2: '彼此看见', y: '情绪回应', y2: '冲突修复' },
    map: { x: Math.round(((scores.appreciation - 1) / 4) * 100), y: Math.round(((5 - scores.response) / 4) * 100) },
    confidence: straightLining ? '回答较集中' : '最近一个月的自我观察',
    boundaryFlags: straightLining ? ['straight-line'] : [],
    ruleIds: [
      `RC_STATE_${stateCode.toUpperCase()}`,
      balanced
        ? `RC_BALANCED_${band(scores[strongest]).toUpperCase()}`
        : `RC_PAIR_${relationshipPairKey(stateCode === 'resourced' ? [strongest, secondStrongest] : [weakest, secondWeakest]).toUpperCase()}`,
      ...ordered.map((key) => `RC_${key.toUpperCase()}_${band(scores[key]).toUpperCase()}`)
    ],
    evidenceId: assessment.evidenceId,
    version: assessment.version,
    tone: assessment.tone
  };
}

const socialProfiles = {
  MIX: ['MIX', '看场合的人', '你没有稳定地站在某一种社交人设里。对象、场合和当天电量一变，你进入人群的方式也会跟着变。', '别人可能会觉得你前后反差很大，其实不同场景确实会调动你不同的一面。', '先保留这种弹性，不必为了一个好记的标签强行把自己固定下来。'],
  OPSC: ['SPARK', '全自动气氛组', '你很容易在人群里点亮第一盏灯：开口、组局、接住冷场，也让熟悉的人参与进来。', '别人可能以为你永远有电，却看不见你也会在散场后突然安静。', '热情可以继续，但不用负责所有人的体验。'],
  OPSB: ['HOST', '礼貌控场王', '你愿意把气氛和安排都照顾好，同时清楚地保留自己的边界。你能热情出现，也知道什么时候该停。', '清楚和周到有时会被误读成距离感，其实你只是不喜欢关系失去分寸。', '不必把每一次相处都办得很完整，偶尔让别人接手也很好。'],
  OPHC: ['ANCHOR', '热闹里的定心丸', '你会把人聚在一起，却不一定把自己的情绪摆在最前面。比起成为焦点，你更像让大家觉得安心的那个人。', '别人习惯被你接住以后，可能忘了问你是不是也需要回应。', '试着让一个可信任的人知道：你今天也想被照顾一下。'],
  OPHB: ['STAGE', '职业组局人', '你擅长让事情顺利发生：地点定好、话题接上、每个人都有位置。至于内心那部分，你更愿意留给自己。', '别人可能只看见你稳稳控场，误以为你不需要更深的连接。', '不用一次说很多，表达一个真实感受就已经是在靠近。'],
  OFSC: ['POP', '随地开麦体', '你靠现场感活起来。好玩的念头、突然的邀约和即时分享，会让关系迅速有温度。', '你的热情来得快，别人偶尔会跟不上，也可能不确定你是不是认真的。', '在最重要的事上补一句确定，会让轻松和可靠同时存在。'],
  OFSB: ['WAVE', '野生喜剧人', '你愿意连接、愿意分享，也喜欢让关系保持轻盈。你能制造快乐，但不喜欢被快乐绑住。', '别人可能把你的随性理解成不在意，其实你只是需要自由地靠近。', '如果一件事真的重要，清楚说一次，比反复玩梗更能被听见。'],
  OFHC: ['SUN', '人群充电宝', '你喜欢和人在一起，也很会跟着现场流动。你不一定谈很多自己，却会用陪伴让别人感觉没那么孤单。', '总是表现得轻松，会让真实的疲惫藏得太好。', '下一次说“我其实有点累”，不需要等到完全撑不住。'],
  OFHB: ['BREEZE', '轻盈过路客', '你愿意进入人群、享受当下，也能在需要时自然离开。你不追求时时绑定，反而让相处少一点压力。', '别人可能不知道你什么时候会再出现，也不容易判断怎样才算真正靠近你。', '给重要的人留一句明确的在意，会让自由不等于模糊。'],
  RPSC: ['ROOM', '小范围话痨', '你不是没话说，只是需要对的人和足够安全的场。熟人局里，你可以认真安排，也可以分享很多细节。', '不熟的人可能以为你冷，熟悉的人却知道你只是启动得慢。', '慢热没有问题，给别人一个小小的进入提示就够了。'],
  RPSB: ['STEADY', '低调掌舵者', '你更喜欢清楚、可靠、不过度侵入的关系。你不抢话，却会默默让事情回到有秩序的位置。', '你的照顾常藏在行动里，别人未必及时看懂。', '重要的在意偶尔需要说出来，不必全靠别人领会。'],
  RPHC: ['NEST', '熟人限定版', '你把热闹留给少数真正信任的人。进入安全圈以后，你会比表面更柔软，也更愿意长期陪伴。', '你退回安静时，亲近的人可能担心是不是做错了什么。', '需要独处时说一句“不是你的问题”，会替关系省下很多猜测。'],
  RPHB: ['GUARD', '沉默项目经理', '你习惯先想清楚、安排清楚，也把私人感受保护得很好。你不需要成为中心，却能在关键处让事情不掉下去。', '高效率和低表达放在一起，容易让人觉得你只关心事情、不关心人。', '把结论前面的那一点感受也说出来，会更容易被理解。'],
  RFSC: ['NIGHT', '深夜开麦者', '你平时更像安静观察的人，但遇到对的对象和对的时刻，会突然说出很深、很真的东西。', '你的表达窗口比较短，别人错过以后，可能不知道你其实很想被听见。', '不用等完美时机，先说“我有件事想慢慢讲”就可以。'],
  RFSB: ['SIDE', '随缘观察员', '你喜欢站在稍微靠边的位置，看清气氛以后再决定要不要加入。你不急着证明存在感，也不喜欢关系太黏。', '你的自在可能被误读成没兴趣，尤其当你很少主动留下信号。', '对在意的人多给一个回应，就能让边界和连接同时存在。'],
  RFHC: ['PING', '被动上线体', '你需要较长的安静时间，但真正信任的人发来一个轻轻的信号时，你也愿意慢慢靠近。', '你希望别人懂得等待，却不一定告诉对方要等多久。', '给空间加一个大致时间，会让关心不必一直悬着。'],
  RFHB: ['SLEEP', '省电模式常驻', '你最舒服的社交状态，是不必随时回应、不必解释太多，也保留足够自由。你会在真正必要的时候出现。', '安静太久时，别人可能把你的省电视为拒绝或失联。', '不想聊天也可以发一句“我在，只是想安静一会儿”。']
};

function scoreSocial(answers) {
  const assessment = assessments.social;
  const totals = { SA: 0, PF: 0, SH: 0, CB: 0, DR: 0, JK: 0 };
  assessment.questions.forEach((question, index) => {
    totals[question.dimension] += (Number(answers[index]) - 3) * question.direction;
  });
  const flat = ['SA', 'PF', 'SH', 'CB'].every((key) => Math.abs(totals[key]) <= 2);
  const code = flat ? 'MIX' : `${totals.SA >= 0 ? 'O' : 'R'}${totals.PF >= 0 ? 'P' : 'F'}${totals.SH >= 0 ? 'S' : 'H'}${totals.CB >= 0 ? 'C' : 'B'}`;
  const profile = socialProfiles[code];
  const approach = flat
    ? '你进入人群的速度很看熟悉程度和当天电量。有时会先开口，有时也需要先观察。'
    : totals.SA >= 0
    ? '你通常在互动里更容易启动。有人、有回应、有新鲜话题时，你会更快进入状态。'
    : '你更习惯先看清气氛，再决定怎样参与。慢一点进入，不代表你没有兴趣。';
  const visibility = flat
    ? '你会根据对象决定说多少。安全时更愿意分享，不确定时则先把感受留给自己。'
    : totals.SH >= 0
    ? '你的感受比较容易被重要的人看见。分享让你确认连接，也需要留意自己是不是在期待立即回应。'
    : '你会把很多感受留到自己先想清楚。安静能保护你，但别人也可能因此晚一点才知道你的需要。';
  const role = flat
    ? '你不总占据同一个位置：需要时能接话，也能安心待在观察位。'
    : totals.DR >= 0
    ? (totals.JK >= 0 ? '你常用主动和幽默把场子接起来，是局里很自然的“开机键”。' : '你会主动推动事情，也更愿意把重要的话认真说清楚。')
    : (totals.JK >= 0 ? '你不一定先开局，但很会在合适的时候用一个梗加入，让气氛松下来。' : '你更像稳定的观察位：不抢着推进，等信息够了再认真回应。');
  const socialMoment = flat
    ? '你可能在一个熟人局里聊到停不下来，换到完全陌生的群体却只想安静观察。不是前后矛盾，而是安全感、兴趣和当天电量都会改变你的启动方式。'
    : totals.SA >= 0
      ? (totals.PF >= 0
        ? '很像你的时刻，可能是大家还在群里反复说“都可以”，你已经把地点、时间和下一步定了下来，也顺手让每个人都有参与感。'
        : '很像你的时刻，可能是一个临时念头把你点亮，你迅速叫上几个人、把气氛带起来，先让事情发生再边走边调。')
      : (totals.SH >= 0
        ? '很像你的时刻，可能是白天在人群里一直安静，到了晚上面对一个信任的人，却突然讲出很多别人从没见过的想法和感受。'
        : '很像你的时刻，可能是你坐在边上把每个人都看明白了，却直到散场也没有说出自己其实很在意哪一件事。');
  const afterParty = totals.SA >= 0
    ? (totals.CB >= 0
      ? '连接会让你有能量，但你也容易把“继续回应”当成自己的责任。真正累的时候，不需要靠突然消失来证明你也有边界。'
      : '你可以很热情地出现，也可以很快回到自己的节奏。重要关系里，多留一句“我今天很开心，只是接下来想自己待会儿”，会减少反差带来的猜测。')
    : (totals.CB >= 0
      ? '你需要安静恢复，却也会把少数重要的人长久放在心里。退回自己的世界时，给亲近的人一个小信号，会让独处不被误读成撤回关系。'
      : '你最舒服的是低负担、不过度解释的连接。自由对你很重要，但长期完全没有信号，也会让别人不知道自己是否被你放在关系里。');
  const expression = totals.SH >= 0
    ? '你比较愿意让重要的人看见真实状态。需要留意的是，分享以后如果没有立刻得到回应，你可能会比预想中更失落。'
    : '你会先把感受留在自己这里，等确定安全、也确定该怎么说以后再打开。你不是没需要，只是表达窗口比别人想象得更窄。';
  const insights = [
    { title: '这不是社牛或社恐那么简单', body: profile[2] },
    { title: '一个很像你的瞬间', body: socialMoment },
    { title: '你在人群里的自动角色', body: `${role} 这更像你在熟悉环境里的默认位置，不代表每个场合都必须由你承担同一种功能。` },
    { title: '别人容易误会你的地方', body: `${profile[3]} ${expression}` },
    { title: '散场以后，你真正需要的', body: afterParty }
  ];
  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    title: `${profile[0]} · ${profile[1]}`,
    typeCode: profile[0],
    tags: flat ? ['看对象', '看场合', '保留弹性'] : [totals.DR >= 0 ? '会主动开局' : '等气氛对上', totals.JK >= 0 ? '擅长玩梗' : '认真说清楚', '娱乐向'],
    summary: profile[2],
    sections: [
      { title: '你的互联网社交人设', body: profile[2] },
      { title: '你如何进入人群', body: approach },
      { title: '情绪被看见的方式', body: visibility },
      { title: '你在局里的功能', body: role },
      { title: '容易被误会的地方', body: profile[3] }
    ],
    insights,
    reminder: `${profile[4]} 这是一张娱乐向社交速写，不是心理诊断，也不需要维持成固定人设。`,
    scores: totals,
    scoreLabels: { x: '低调入场', x2: '主动连接', y: '临场随缘', y2: '提前安排' },
    map: { x: Math.max(4, Math.min(96, 50 + totals.SA * 5)), y: Math.max(4, Math.min(96, 50 - totals.PF * 5)) },
    confidence: flat ? '分化不明显' : '娱乐向结果',
    boundaryFlags: flat ? ['flat'] : [],
    ruleIds: [`SBTI_${profile[0]}`, totals.DR >= 0 ? 'SBTI_DRIVE' : 'SBTI_WAIT', totals.JK >= 0 ? 'SBTI_JOKE' : 'SBTI_CLEAR'],
    evidenceId: assessment.evidenceId,
    version: assessment.version,
    tone: assessment.tone
  };
}

const baselineFunctionCopy = {
  Se: '你通常先确认眼前正在发生的具体信息，再根据现场反馈调整',
  Si: '你通常会把当下与过去经验对照，用熟悉的细节建立确定感',
  Ne: '你通常会从一个线索展开几种可能，并寻找不同事情之间的联系',
  Ni: '你通常会让零散线索在心里收束，先形成一个整体方向',
  Te: '你通常会把问题整理成标准、步骤和可以推进的行动',
  Ti: '你通常需要先在心里理清结构，确认事情前后一致',
  Fe: '你通常会留意外部关系气氛，并参考彼此的需要调整回应',
  Fi: '你通常会先确认真实感受，以及这件事是否符合自己珍视的价值'
};

function normalizeCognitiveBaseline(source) {
  if (!source || source.assessmentId !== 'cognitive' || source.typeCode === 'XXXX') return null;
  if (source.version !== assessments.cognitive.version || !cognitiveTypeStacks[source.typeCode]) return null;
  const profile = source.baselineProfile || {};
  const stack = cognitiveTypeStacks[source.typeCode];
  return {
    typeCode: source.typeCode,
    dominantFunction: profile.dominantFunction || stack[0],
    auxiliaryFunction: profile.auxiliaryFunction || stack[1],
    strength: profile.strength || ((source.boundaryFlags || []).includes('TYPE') ? 'nearby' : 'stable'),
    sourceVersion: source.version
  };
}

function applyCognitiveBaseline(result, source) {
  const baseline = normalizeCognitiveBaseline(source);
  if (!baseline || !['attachment', 'bigfive', 'relationship'].includes(result.assessmentId)) return result;
  const natural = baselineFunctionCopy[baseline.dominantFunction];
  const qualifier = baseline.strength === 'stable' ? '' : '目前类型边界仍有接近，所以这里只参考较稳定的认知倾向。';
  const testMeaning = {
    attachment: '依恋题仍独立决定你对回应与空间的需要；这份基线只解释你可能怎样理解、消化和表达关系里的不安。',
    bigfive: '性格底色的五个连续维度仍由本题库独立计分；这份基线只解释这些倾向通常通过什么认知方式表现出来。',
    relationship: '关系状态仍只依据你对最近一个月相处情况的回答；这份基线只解释你更可能怎样看见问题、组织感受和开口沟通。'
  }[result.assessmentId];
  return {
    ...result,
    sections: [
      ...result.sections,
      { title: '结合你的认知偏好', body: `${natural}。${testMeaning}${qualifier}` }
    ],
    baselineContext: baseline,
    ruleIds: [...result.ruleIds, `BASE_CP_${baseline.typeCode}`]
  };
}

function scoreAssessment(id, answers, questionIds, cognitiveBaseline) {
  const assessment = assessments[id];
  const minimumLength = assessment ? assessment.questions.length : 0;
  const wrongLength = !assessment || !Array.isArray(answers) || answers.length < minimumLength || (id !== 'cognitive' && answers.length !== minimumLength);
  const missingAnswer = Array.isArray(answers) && answers.some((answer) => !Number(answer) || Number(answer) < 1 || Number(answer) > 5);
  if (wrongLength || missingAnswer || (questionIds && questionIds.length !== answers.length)) {
    throw new Error('存在未完成的题目');
  }
  if (id === 'cognitive') return scoreCognitive(answers, questionIds);
  if (id === 'attachment') return applyCognitiveBaseline(scoreAttachment(answers), cognitiveBaseline);
  if (id === 'bigfive') return applyCognitiveBaseline(scoreBigFive(answers), cognitiveBaseline);
  if (id === 'relationship') return applyCognitiveBaseline(scoreRelationship(answers), cognitiveBaseline);
  if (id === 'social') return scoreSocial(answers);
  throw new Error(`未知测评：${id}`);
}

module.exports = {
  scoreAssessment,
  getFollowupQuestions,
  cognitiveDimensions,
  cognitiveFunctionScores,
  rankCognitiveTypes,
  normalizeCognitiveBaseline,
  applyCognitiveBaseline,
  band,
  contentCatalog: {
    cognitiveCopy,
    attachmentProfiles,
    bigFiveModules,
    relationshipModules,
    socialProfiles
  }
};
