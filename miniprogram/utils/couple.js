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
  const bigfive = latest('bigfive');
  const relationship = latest('relationship');
  return {
    v: 2,
    c: cognitive ? cognitive.scores : null,
    a: attachment ? attachment.scores : null,
    b: bigfive ? bigfive.scores : null,
    r: relationship ? relationship.scores : null,
    versions: {
      c: cognitive?.version || null,
      a: attachment?.version || null,
      b: bigfive?.version || null,
      r: relationship?.version || null
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

function createCoupleReport(mine, theirs) {
  if (!mine.c || !mine.a || !theirs.c || !theirs.a) throw new Error('双方都需要完成认知偏好和依恋倾向');
  const currentVersions = [mine, theirs].every((item) => item.v === 2
    && item.versions?.c === assessments.cognitive.version
    && item.versions?.a === assessments.attachment.version);
  if (!currentVersions) throw new Error('双方都需要使用最新版认知偏好和依恋倾向结果');
  const cards = [];
  if (mine.a && theirs.a) {
    const mineAnxiety = mine.a.anxiety;
    const mineAvoidance = mine.a.avoidance;
    const theirAnxiety = theirs.a.anxiety;
    const theirAvoidance = theirs.a.avoidance;
    const anxiousAvoidant = (mineAnxiety >= 62.5 && theirAvoidance >= 62.5) || (theirAnxiety >= 62.5 && mineAvoidance >= 62.5);
    if (anxiousAvoidant) {
      cards.push({
        ruleId: 'CM02',
        title: '靠近与退后的节奏',
        body: '一个人在不确定时更想靠近，另一个人在压力中更想先退开。两边都在保护关系，却容易彼此误读。暂停可以有，但要说清楚什么时候回来。'
      });
    } else if (mineAnxiety >= 62.5 && theirAnxiety >= 62.5) {
      cards.push({
        ruleId: 'CM01',
        title: '都很在意回应',
        body: '你们都能很快发现关系里的温度变化。好处是彼此不会太迟钝；压力大时，也可能互相放大不安。可以约定一种简单、稳定的回应方式。'
      });
    } else if (mineAvoidance >= 62.5 && theirAvoidance >= 62.5) {
      cards.push({
        ruleId: 'CM03',
        title: '都需要自己的空间',
        body: '你们都尊重空间，相处可能很轻松、不黏。需要留意的是，问题也可能因为谁都不先开口而安静积累。低压力的近况交流会更适合你们。'
      });
    } else if (distance(mineAnxiety, theirAnxiety) >= distance(mineAvoidance, theirAvoidance)) {
      cards.push({
        ruleId: 'CM04',
        title: '确认安全的频率不同',
        body: '你们都未必会强烈拉扯，但一个人可能更早察觉关系温度的变化。回应不需要很长，一句明确的“我收到了”，往往就能避免对方独自猜测。'
      });
    } else {
      cards.push({
        ruleId: 'CM13',
        title: '留空间的尺度不同',
        body: '你们对“先自己消化一下”的需要并不完全一样。提前说清楚这是暂时停一停，而不是拒绝交流，会让空间更像恢复，而不是疏远。'
      });
    }
  }

  if (mine.c && theirs.c) {
    const pairs = [
      ['EI', 'CM05', '不同的充电方式', '一个人可能通过互动恢复能量，另一个人需要安静才能回来。提前留出各自的恢复时间，会少很多“你为什么不陪我”和“我快喘不过气”的误解。'],
      ['NS', 'CM06', '一个谈可能，一个谈具体', '一个人容易谈可能、意义和以后，另一个人更关注眼前事实与怎么做。先确认是在想象可能，还是决定下一步，会少很多错位。'],
      ['TF', 'CM07', '理解与解决的顺序', '一个人会先找逻辑和办法，另一个人会先感受事情对关系的影响。先问“现在想被理解，还是一起解决”，通常能更快对上频道。'],
      ['JP', 'CM08', '确定与自由的节奏', '一个人希望早点定下来，另一个人更舒服于保留选择。可以把事情分成“必须提前定”和“可以临时改”两类。']
    ];
    const differences = pairs
      .map(([key, ruleId, title, body]) => ({ key, ruleId, title, body, value: distance(mine.c[key], theirs.c[key]) }))
      .sort((a, b) => b.value - a.value);
    if (differences[0].value >= 0.7) {
      cards.push(differences[0]);
    } else {
      cards.push({
        ruleId: 'CM09',
        title: '大体同频，也别替对方作答',
        body: '你们理解事情的习惯比较接近，因此常有“不用解释也懂”的轻松感。越是同频，越要记得在重要时刻多问一句，别把相似误当成完全一样。'
      });
    }
  }

  if (mine.b && theirs.b) {
    const nDistance = distance(mine.b.sensitivity, theirs.b.sensitivity);
    const aDistance = distance(mine.b.empathy, theirs.b.empathy);
    if (nDistance >= 1.4) {
      cards.push({ ruleId: 'CM10', title: '感受变化的速度不同', body: '一个人对变化反应更快，另一个人比较不容易被波动带走。平稳可以成为支点，但不要把敏感简单说成想太多。' });
    } else if (aDistance >= 1.4) {
      cards.push({ ruleId: 'CM12', title: '照顾感受的方式不同', body: '一个人更自然地照顾感受，另一个人更习惯保留判断、直接说重点。把“态度”和“内容”分开谈，会更容易听见彼此。' });
    }
  }

  if (mine.a && theirs.a) {
    const peakAnxiety = Math.max(Number(mine.a.anxiety), Number(theirs.a.anxiety));
    const peakAvoidance = Math.max(Number(mine.a.avoidance), Number(theirs.a.avoidance));
    let returnBody = '你们不一定需要马上把话说完，但需要让对方知道：这次暂停不是关系结束。约定一个重新开口的时间，比逼着当场解决更有用。';
    if (peakAnxiety >= 62.5 && peakAnxiety >= peakAvoidance) {
      returnBody = '至少有一个人会在冲突后很快确认关系是否还安全。先给一句明确的“我没有要离开，我们晚点继续”，能让后面的讨论少掉很多防御。';
    } else if (peakAvoidance >= 62.5) {
      returnBody = '至少有一个人需要先从高压里退出来，才有能力重新连接。空间可以有，但最好同时说清楚多久后回来，避免沉默被理解成不在意。';
    }
    cards.push({ ruleId: 'CM15', title: '冲突之后，怎么回来', body: returnBody });
  }

  let resource = null;
  if (mine.c && theirs.c) {
    const candidates = Object.keys(mine.c).map((key) => ({ key, value: distance(mine.c[key], theirs.c[key]) })).sort((a, b) => a.value - b.value);
    const names = { EI: '恢复能量的方式', NS: '理解信息的方式', TF: '做判断的方式', JP: '安排生活的节奏' };
    resource = {
      ruleId: 'CM14',
      title: '一处共同节奏',
      body: `你们在“${names[candidates[0].key]}”上比较容易找到共同节奏。这不保证每次都顺利，却是一处可以依靠的基础。`
    };
  } else {
    resource = {
      ruleId: 'CM14',
      title: '共同看见差异',
      body: '愿意交换结果、一起理解差异，本身就是一种关系资源。相似不自动等于适合，差异也不自动等于冲突。'
    };
  }
  cards.unshift(resource);

  return {
    title: '两个人的相处地图',
    summary: '这里没有匹配百分比。我们只把相似看作共同语言，把差异看作需要翻译的地方。',
    cards: cards.slice(0, 4),
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
