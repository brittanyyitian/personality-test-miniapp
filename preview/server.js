const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessments, homeSections, inspirationCards } = require('../miniprogram/data/assessments');
const { RESULT_VISUALS } = require('../miniprogram/data/result-visuals');
const { getFollowupQuestions, scoreAssessment } = require('../miniprogram/utils/scoring');
const { createShareCode, parseShareCode, compactResult, createCoupleReport } = require('../miniprogram/utils/couple');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const posterFiles = new Map();

const sendJson = (response, status, value) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
};

const readJson = (request) => new Promise((resolve, reject) => {
  let raw = '';
  request.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 12 * 1024 * 1024) reject(new Error('Request too large'));
  });
  request.on('end', () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
  });
  request.on('error', reject);
});

http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://local').pathname;

  if (pathname === '/api/catalog' && request.method === 'GET') {
    sendJson(response, 200, { assessments, homeSections, inspirationCards, resultVisuals: RESULT_VISUALS });
    return;
  }

  if (pathname === '/api/followups' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      sendJson(response, 200, { questions: getFollowupQuestions(body.id, body.answers) });
    } catch (error) {
      sendJson(response, 400, { error: '无法读取追问题目' });
    }
    return;
  }

  if (pathname === '/api/score' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const result = scoreAssessment(body.id, body.answers, body.questionIds, body.cognitiveBaseline);
      if (!result) throw new Error('Invalid answers');
      sendJson(response, 200, { result });
    } catch (error) {
      sendJson(response, 400, { error: '答案不完整，暂时无法生成结果' });
    }
    return;
  }

  if (pathname === '/api/poster' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const match = String(body.dataUrl || '').match(/^data:image\/png;base64,(.+)$/);
      if (!match) throw new Error('Invalid poster');
      const data = Buffer.from(match[1], 'base64');
      if (!data.length || data.length > 8 * 1024 * 1024) throw new Error('Poster too large');
      const token = crypto.randomUUID();
      const filename = String(body.filename || '人格拼图.png').replace(/[\\/\r\n]/g, '-').slice(0, 80);
      posterFiles.set(token, { data, filename, createdAt: Date.now() });
      while (posterFiles.size > 10) posterFiles.delete(posterFiles.keys().next().value);
      sendJson(response, 200, { url: `/api/poster/${token}` });
    } catch (error) {
      sendJson(response, 400, { error: '图片生成失败，请再试一次' });
    }
    return;
  }

  if (pathname.startsWith('/api/poster/') && request.method === 'GET') {
    const token = pathname.slice('/api/poster/'.length);
    const file = posterFiles.get(token);
    if (!file) {
      response.writeHead(404);
      response.end('Poster not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': file.data.length,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Cache-Control': 'no-store'
    });
    response.end(file.data);
    return;
  }

  if (pathname === '/api/share-code' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      sendJson(response, 200, { code: createShareCode(body.results || []) });
    } catch (error) {
      sendJson(response, 400, { error: error.message || '暂时无法生成结果码' });
    }
    return;
  }

  if (pathname === '/api/couple-report' && request.method === 'POST') {
    try {
      const body = await readJson(request);
      const mine = compactResult(body.results || []);
      const theirs = parseShareCode(body.code);
      sendJson(response, 200, { report: createCoupleReport(mine, theirs) });
    } catch (error) {
      sendJson(response, 400, { error: error.message || '结果码无法读取' });
    }
    return;
  }

  const relative = pathname === '/' ? 'preview/index.html' : pathname.replace(/^\//, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(4173, '0.0.0.0', () => console.log('preview http://0.0.0.0:4173'));
