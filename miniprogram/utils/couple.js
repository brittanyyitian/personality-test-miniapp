const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const { assessments } = require('../data/assessments');

function encodeAscii(text) {
  let output = '';
  let index = 0;
  while (index < text.length) {
    const a = text.charCodeAt(index++);
    const b = index < text.length ? text.charCodeAt(index++) : NaN;
    const c = index < text.length ? text.charCodeAt(index++) : NaN;
    output += BASE64[a >> 2];
    output += BASE64[((a & 3) << 4) | (Number.isNaN(b) ? 0 : b >> 4)];
    if (!Number.isNaN(b)) output += BASE64[((b & 15) << 2) | (Number.isNaN(c) ? 0 : c >> 6)];
    if (!Number.isNaN(c)) output += BASE64[c & 63];
  }
  return output;
}

function decodeAscii(text) {
  let bits = 0;
  let bitCount = 0;
  let output = '';
  for (const char of text) {
    const value = BASE64.indexOf(char);
    if (value < 0) throw new Error('结果码格式不正确');
    bits = (bits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      output += String.fromCharCode((bits >> bitCount) & 255);
      bits &= (1 << bitCount) - 1;
    }
  }
  return output;
}

function checksum(text) {
  let value = 17;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) % 9973;
  return value.toString(36).toUpperCase();
}

function compactResult(results) {
  const latest = (id) => results.find((result) => result.assessmentId === id);
  const cognitive = latest('cognitive');
  const attachment = latest('attachment');
  return {
    v: 2,
    c: cognitive ? cognitive.scores : null,
    a: attachment ? attachment.scores : null,
    versions: {
      c: cognitive?.version || null,
      a: attachment?.version || null
    }
  };
}

function getCoupleReadiness(results) {
  const cognitive = results.find((result) => result.assessmentId === 'cognitive');
  const attachment = results.find((result) => result.assessmentId === 'attachment');
  return {
    cognitive: Boolean(cognitive && cognitive.typeCode !== 'XXXX' && cognitive.version === assessments.cognitive.version),
    attachment: Boolean(attachment && attachment.version === assessments.attachment.version)
  };
}

function createShareCode(results) {
  const readiness = getCoupleReadiness(results);
  if (!readiness.cognitive || !readiness.attachment) throw new Error('请先完成最新版认知偏好和依恋倾向');
  const payload = JSON.stringify(compactResult(results));
  const encoded = encodeAscii(payload);
  return `M2.${encoded}.${checksum(encoded)}`;
}

function parseShareCode(code) {
  const clean = String(code || '').trim();
  const parts = clean.split('.');
  if (parts.length !== 3 || !['M1', 'M2'].includes(parts[0]) || checksum(parts[1]) !== parts[2]) throw new Error('结果码无效或不完整');
  const payload = JSON.parse(decodeAscii(parts[1]));
  if (![1, 2].includes(payload.v)) throw new Error('结果码版本暂不支持');
  return payload;
}

function distance(a, b) {
  return Math.abs(Number(a) - Number(b));
}

function isHighAttachmentScore(value) {
  return Number(value) > 50;
}

function attachmentStyle(scores) {
  const anxiety = isHighAttachmentScore(scores.anxiety);
  const avoidance = isHighAttachmentScore(scores.avoidance);
  if (anxiety && avoidance) return 'fearful';
  if (anxiety) return 'anxious';
  if (avoidance) return 'avoidant';
  return 'secure';
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function cognitivePercent(value) {
  return clampPercent(((Number(value) + 1) / 2) * 100);
}

const cognitivePairDefinitions = [
  ['EI', 'CM05', '不同的充电方式', '一个人更容易通过互动整理想法，另一个人更需要安静才能回来。提前留出各自的恢复时间，会少很多“你为什么不陪我”和“我快喘不过气”的误解。'],
  ['NS', 'CM06', '一个谈可能，一个谈具体', '一个人容易谈可能、意义和以后，另一个人更关注眼前事实与怎么做。先确认是在想象可能，还是决定下一步，会少很多错位。'],
  ['TF', 'CM07', '理解与解决的顺序', '一个人更自然地先找逻辑和办法，另一个人更自然地先感受事情对关系的影响。先问“现在想被理解，还是一起解决”，通常能更快对上频道。'],
  ['JP', 'CM08', '确定与自由的节奏', '一个人希望早点定下来，另一个人更舒服于保留选择。可以把事情分成“必须提前定”和“可以临时改”两类。']
];

function attachmentPairResult(mineScores, theirScores) {
  const mineStyle = attachmentStyle(mineScores);
  const theirStyle = attachmentStyle(theirScores);
  if (mineStyle === theirStyle) {
    const shared = {
      secure: ['CM16', '同频安稳', '共同的安全节奏', '你们都比较能相信连接，也愿意给彼此空间。相似会带来轻松感，也要记得稳定并不等于对方每次都不需要一句明确回应。'],
      anxious: ['CM01', '双向高敏', '都很在意回应', '你们都能很快发现关系里的温度变化。好处是彼此不会太迟钝；压力大时，也可能互相放大不安。可以约定一种简单、稳定的回应方式。'],
      avoidant: ['CM03', '双向留白', '都需要自己的空间', '你们都尊重空间，相处可能很轻松、不黏。需要留意的是，问题也可能因为谁都不先开口而安静积累。低压力的近况交流会更适合你们。'],
      fearful: ['CM17', '同步拉扯', '都会靠近，也都会退开', '你们都可能在不确定时想确认连接，又在压力变大时退回自己的保护里。相似让你们容易理解这种矛盾，也可能让两个人同时等待对方先回来。']
    }[mineStyle];
    return { mineStyle, theirStyle, profileName: shared[1], card: { ruleId: shared[0], title: shared[2], body: shared[3] } };
  }
  const directCross = (mineStyle === 'anxious' && theirStyle === 'avoidant')
    || (mineStyle === 'avoidant' && theirStyle === 'anxious');
  if (directCross) {
    return {
      mineStyle,
      theirStyle,
      profileName: '一近一退',
      card: { ruleId: 'CM02', title: '靠近与退后的节奏', body: '一方在不确定时更想靠近，另一方在压力中更想先退开。两边都在保护关系，却容易彼此误读。暂停可以有，但要说清楚什么时候回来。' }
    };
  }
  if (mineStyle === 'fearful' || theirStyle === 'fearful') {
    return {
      mineStyle,
      theirStyle,
      profileName: '交错节奏',
      card: { ruleId: 'CM18', title: '需要确认，也需要留白', body: '至少一方会同时经历“想确认连接”和“需要退开保护自己”，另一方的节奏又不完全相同。先说清这一刻需要回应还是空间，比给彼此固定角色更准确。' }
    };
  }
  const anxietyDistance = distance(mineScores.anxiety, theirScores.anxiety);
  const avoidanceDistance = distance(mineScores.avoidance, theirScores.avoidance);
  if (anxietyDistance >= avoidanceDistance) {
    return {
      mineStyle,
      theirStyle,
      profileName: '回应频率不同',
      card: { ruleId: 'CM04', title: '确认安全的频率不同', body: '你们对关系温度变化的敏感程度不完全一样。回应不需要很长，一句明确的“我收到了”，往往就能避免更敏感的一方独自猜测。' }
    };
  }
  return {
    mineStyle,
    theirStyle,
    profileName: '空间尺度不同',
    card: { ruleId: 'CM13', title: '留空间的尺度不同', body: '你们对“先自己消化一下”的需要不完全一样。提前说清楚这是暂时停一停，而不是拒绝交流，会让空间更像恢复，而不是疏远。' }
  };
}

function cognitivePairCard(mineScores, theirScores) {
  const axes = cognitivePairDefinitions.map(([key, ruleId, title, body]) => ({
    key,
    ruleId,
    title,
    body,
    mine: Number(mineScores[key]),
    theirs: Number(theirScores[key]),
    value: distance(mineScores[key], theirScores[key])
  }));
  const opposite = axes.filter((axis) => axis.mine * axis.theirs < 0).sort((a, b) => b.value - a.value);
  if (opposite.length) return opposite[0];
  const differences = axes.slice().sort((a, b) => b.value - a.value);
  if (differences[0].value === 0) {
    return {
      ruleId: 'CM09',
      title: '大体同频，也别替对方作答',
      body: '你们理解事情的习惯比较接近，因此常有“不用解释也懂”的轻松感。越是同频，越要记得在重要时刻多问一句，别把相似误当成完全一样。'
    };
  }
  const axis = differences[0];
  const positive = (axis.mine + axis.theirs) >= 0;
  const sameSideCopy = {
    EI: positive ? '你们都比较容易在互动中整理想法，只是一个人启动得更快、需要的来回更多。' : '你们都需要安静整理，只是一个人可能需要更长时间才能重新进入对话。',
    NS: positive ? '你们都容易先看可能和方向，只是一个人会展开得更远，另一个人更快回到可落实的部分。' : '你们都重视具体事实与经验，只是一个人需要更多细节，另一个人更容易在信息够用时继续推进。',
    TF: positive ? '你们都重视逻辑与清楚标准，只是一个人更快进入解决问题，另一个人会多留一点空间确认影响。' : '你们都会把人的感受和关系影响放进判断，只是一个人更早感受到气氛变化。',
    JP: positive ? '你们都偏好一定的确定和安排，只是一个人希望更早定下来，另一个人可以多保留一点调整余地。' : '你们都愿意保留选择、边走边调，只是一个人需要更多自由，另一个人会更早寻找一个大致方向。'
  }[axis.key];
  return { ruleId: 'CM19', title: '方向相近，使用强度不同', body: sameSideCopy };
}

function coupleScoreDimensions(mine, theirs) {
  const definitions = [
    ['attachment', 'anxiety', '回应敏感', '较能等待', '更需回应', (value) => clampPercent(value)],
    ['attachment', 'avoidance', '空间需要', '更愿靠近', '更需空间', (value) => clampPercent(value)],
    ['cognitive', 'EI', '整理能量', '独处整理', '互动整理', cognitivePercent],
    ['cognitive', 'NS', '理解信息', '具体经验', '可能意义', cognitivePercent],
    ['cognitive', 'TF', '形成判断', '感受影响', '逻辑标准', cognitivePercent],
    ['cognitive', 'JP', '安排节奏', '保留选择', '提前确定', cognitivePercent]
  ];
  return definitions.map(([group, key, label, leftLabel, rightLabel, normalize]) => {
    const mineValue = normalize(group === 'attachment' ? mine.a[key] : mine.c[key]);
    const theirValue = normalize(group === 'attachment' ? theirs.a[key] : theirs.c[key]);
    return {
      key: `${group}-${key}`,
      group,
      groupLabel: group === 'attachment' ? '依恋分数' : '思考偏好位置',
      label,
      leftLabel,
      rightLabel,
      mine: mineValue,
      theirs: theirValue,
      mineStyle: `left:${mineValue}%`,
      theirStyle: `left:${theirValue}%`
    };
  });
}

function createCoupleReport(mine, theirs) {
  if (!mine.c || !mine.a || !theirs.c || !theirs.a) throw new Error('双方都需要完成认知偏好和依恋倾向');
  const currentVersions = [mine, theirs].every((item) => item.v === 2
    && item.versions?.c === assessments.cognitive.version
    && item.versions?.a === assessments.attachment.version);
  if (!currentVersions) throw new Error('双方都需要使用最新版认知偏好和依恋倾向结果');
  const attachmentPair = attachmentPairResult(mine.a, theirs.a);
  const cognitiveCard = cognitivePairCard(mine.c, theirs.c);

  if (mine.a && theirs.a) {
    const peakAnxiety = Math.max(Number(mine.a.anxiety), Number(theirs.a.anxiety));
    const peakAvoidance = Math.max(Number(mine.a.avoidance), Number(theirs.a.avoidance));
    let returnBody = '你们不一定需要马上把话说完，但需要让对方知道：这次暂停不是关系结束。约定一个重新开口的时间，比逼着当场解决更有用。';
    if (isHighAttachmentScore(peakAnxiety) && peakAnxiety >= peakAvoidance) {
      returnBody = '至少有一个人会在冲突后很快确认关系是否还安全。先给一句明确的“我没有要离开，我们晚点继续”，能让后面的讨论少掉很多防御。';
    } else if (isHighAttachmentScore(peakAvoidance)) {
      returnBody = '至少有一个人需要先从高压里退出来，才有能力重新连接。空间可以有，但最好同时说清楚多久后回来，避免沉默被理解成不在意。';
    }
    if (attachmentPair.mineStyle === 'fearful' && attachmentPair.theirStyle === 'fearful') {
      returnBody = '你们都可能先确认连接，又在压力升高时退回保护里。比起同时等待对方先开口，可以约定一句暂停信号和一个明确回来时间。';
    }
    var returnCard = { ruleId: 'CM15', title: '冲突之后，怎么回来', body: returnBody };
  }

  const candidates = Object.keys(mine.c).map((key) => ({ key, value: distance(mine.c[key], theirs.c[key]) }));
  const smallestDistance = Math.min(...candidates.map((candidate) => candidate.value));
  const commonKeys = candidates.filter((candidate) => candidate.value === smallestDistance).map((candidate) => candidate.key);
  const names = { EI: '恢复能量的方式', NS: '理解信息的方式', TF: '做判断的方式', JP: '安排生活的节奏' };
  const resource = commonKeys.length === 1
    ? { ruleId: 'CM14', title: '一处共同节奏', body: `你们在“${names[commonKeys[0]]}”上比较容易找到共同节奏。这不保证每次都顺利，却是一处可以依靠的基础。` }
    : { ruleId: 'CM14', title: '不止一处共同节奏', body: `你们在${commonKeys.map((key) => `“${names[key]}”`).join('、')}上都比较接近。相似带来共同语言，也别替对方省略重要时刻的真实回答。` };
  const cards = [resource, attachmentPair.card, cognitiveCard, returnCard];

  return {
    title: '两个人的相处地图',
    profileName: attachmentPair.profileName,
    summary: `你们当前更接近「${attachmentPair.profileName}」。这里没有匹配百分比；相似是共同语言，差异是需要翻译的地方。`,
    dimensions: coupleScoreDimensions(mine, theirs),
    cards,
    action: '倾诉前先问一句——你现在想被听见，还是想一起想办法？'
  };
}

module.exports = {
  compactResult,
  getCoupleReadiness,
  createShareCode,
  parseShareCode,
  createCoupleReport
};
