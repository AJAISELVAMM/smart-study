import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

process.env.DATABASE_URL = ':memory:';
process.env.GEMINI_API_KEY = '';

const here = path.dirname(fileURLToPath(import.meta.url));
const samplePdf = path.resolve(here, '../../client/public/sample_pdfs/computer_networks_intro.pdf');
const [{ app }, database, repository, { default: request }, { PDFParse }] = await Promise.all([
  import('../app.js'),
  import('../database/database.js'),
  import('../database/repository.js'),
  import('supertest'),
  import('pdf-parse'),
]);
const { initializeDatabase, sequelize } = database;
const binaryParser = (response, callback) => {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
};

before(async () => { await initializeDatabase(); });
after(async () => { await sequelize.close(); });

test('health reports status and never exposes a Gemini key', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.equal(response.body.data.aiConfigured, false);
  assert.equal(JSON.stringify(response.body).includes('GEMINI_API_KEY='), false);

  const notFound = await request(app).get('/api/not-a-route').expect(404);
  assert.equal(notFound.body.code, 'NOT_FOUND');
  const malformed = await request(app).post('/api/study/generate').set('Content-Type', 'application/json').send('{"text":').expect(400);
  assert.equal(malformed.body.code, 'INVALID_REQUEST_BODY');
});

test('history starts empty and exposes a paginated predictable response', async () => {
  const response = await request(app).get('/api/history').expect(200);
  assert.deepEqual(response.body.data.sessions, []);
  assert.equal(response.body.data.hasMore, false);
  assert.equal(response.body.data.nextOffset, null);
});

test('PDF text extraction works on the included sample PDF', async () => {
  const response = await request(app).post('/api/study/upload').attach('file', samplePdf).expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.sourceType, 'pdf');
  assert.match(response.body.data.documentName, /computer_networks_intro\.pdf$/i);
  assert.ok(response.body.data.pageCount > 0);
  assert.ok(response.body.data.characterCount > 500);
  assert.match(response.body.data.text, /network/i);
});

test('PDF validation rejects unsupported and corrupt files with safe errors', async () => {
  const unsupported = await request(app)
    .post('/api/study/upload')
    .attach('file', Buffer.from('not a PDF'), { filename: 'notes.txt', contentType: 'text/plain' })
    .expect(415);
  assert.equal(unsupported.body.code, 'UNSUPPORTED_FILE_TYPE');

  const invalidHeader = await request(app)
    .post('/api/study/upload')
    .attach('file', Buffer.from('not a PDF'), { filename: 'notes.pdf', contentType: 'application/pdf' })
    .expect(400);
  assert.equal(invalidHeader.body.code, 'INVALID_PDF');

  const damaged = await request(app)
    .post('/api/study/upload')
    .attach('file', Buffer.from('%PDF-1.7\nthis is damaged content'), { filename: 'damaged.pdf', contentType: 'application/pdf' });
  assert.equal(damaged.status, 422);
  assert.match(damaged.body.code, /^PDF_|NO_EXTRACTABLE_TEXT$/);
  assert.equal(damaged.body.error.includes('damaged content'), false);
});

test('text generation validates minimum source length before trying Gemini', async () => {
  const tooShort = await request(app).post('/api/study/generate').send({ text: 'too short' }).expect(400);
  assert.equal(tooShort.body.code, 'TEXT_TOO_SHORT');

  const unavailable = await request(app).post('/api/study/generate').send({
    text: 'A computer network is a group of interconnected devices. It allows computers to exchange data and share resources using communication protocols.',
    documentName: 'Intro to networks',
    learningMode: 'Beginner',
  }).expect(503);
  assert.equal(unavailable.body.code, 'AI_NOT_CONFIGURED');
  const history = await request(app).get('/api/history').expect(200);
  assert.deepEqual(history.body.data.sessions, []);
});

test('history stores and reopens structured study data without returning source text', async () => {
  const studyKit = {
    title: 'Computer Networks',
    summary: {
      overview: 'A computer network connects devices so they can communicate and share resources.',
      key_concepts: ['Nodes communicate using protocols.'], main_takeaways: ['Networks share data.'],
      important_facts: [], formulas: [],
    },
    smart_notes: [{ heading: 'Network basics', content: 'Devices communicate over links.', key_points: ['Protocols define communication.'], definitions: [], examples: [], formulas: [], exam_focus: [] }],
    flashcards: [{ question: 'What does a network connect?', answer: 'Devices that communicate and share resources.', topic: 'Basics', difficulty: 'Easy' }],
    glossary: [{ term: 'Protocol', meaning: 'A set of rules for communication.', example: '' }],
    exam_questions: [{ question: 'Define a computer network.', marks: 2, difficulty: 'Easy', topic: 'Basics', type: 'Short Answer', answer: 'A group of interconnected devices.', explanation: 'Devices communicate and share resources.' }],
  };
  const created = await repository.createSession({
    documentName: 'Computer Networks', sourceType: 'text', learningMode: 'Standard',
    sourceText: 'A private original source paragraph that must not be returned in history summaries.', studyKit,
  });

  const list = await request(app).get('/api/history').expect(200);
  assert.equal(list.body.data.sessions.length, 1);
  assert.equal(list.body.data.sessions[0].id, created.id);
  assert.equal(Object.hasOwn(list.body.data.sessions[0], 'sourceText'), false);

  const detail = await request(app).get(`/api/history/${created.id}`).expect(200);
  assert.equal(detail.body.data.studyKit.title, 'Computer Networks');
  assert.deepEqual(detail.body.data.chatMessages, []);
  assert.equal(Object.hasOwn(detail.body.data, 'sourceText'), false);
  const studyDetail = await request(app).get(`/api/study/${created.id}`).expect(200);
  assert.equal(studyDetail.body.data.studyKit.title, 'Computer Networks');

  const notFound = await request(app).get('/api/history/999999').expect(404);
  assert.equal(notFound.body.code, 'SESSION_NOT_FOUND');
});

test('grounded Ask AI does not fabricate a response or save a turn without Gemini', async () => {
  const existing = await repository.listSessions();
  const id = existing.sessions[0].id;
  const response = await request(app).post('/api/chat').send({ sessionId: id, question: 'Explain network protocols.' }).expect(503);
  assert.equal(response.body.code, 'AI_NOT_CONFIGURED');
  const detail = await request(app).get(`/api/history/${id}`).expect(200);
  assert.deepEqual(detail.body.data.chatMessages, []);
});

test('PDF section and complete-kit exports are valid and contain generated material', async () => {
  const list = await repository.listSessions();
  const sessionId = list.sessions[0].id;
  const response = await request(app).post('/api/export/pdf').send({ sessionId, type: 'complete' }).buffer(true).parse(binaryParser).expect(200);
  assert.match(response.headers['content-type'], /application\/pdf/);
  assert.match(response.headers['content-disposition'], /Computer_Networks_complete\.pdf/);
  assert.ok(response.body.length > 500);
  assert.equal(response.body.subarray(0, 4).toString(), '%PDF');

  const parser = new PDFParse({ data: new Uint8Array(response.body) });
  try {
    const extracted = await parser.getText();
    assert.match(extracted.text, /Complete Study Kit/);
    assert.match(extracted.text, /computer network|Computer Networks/i);
    assert.match(extracted.text, /Flashcards/);
  } finally { await parser.destroy(); }

  const section = await request(app).post('/api/export/pdf').send({ sessionId, type: 'questions' }).expect(200);
  assert.match(section.headers['content-type'], /application\/pdf/);
});

test('history search, individual deletion, and clear-history endpoints work', async () => {
  const created = await repository.createSession({
    documentName: 'Discrete Mathematics', sourceType: 'text', learningMode: 'Exam Revision',
    sourceText: 'Discrete mathematics includes logic and graph theory.',
    studyKit: { title: 'Discrete Mathematics', summary: { overview: 'Logic and graphs.' } },
  });
  const found = await request(app).get('/api/history').query({ q: 'Discrete' }).expect(200);
  assert.equal(found.body.data.sessions.length, 1);
  assert.equal(found.body.data.sessions[0].documentName, 'Discrete Mathematics');

  await request(app).delete(`/api/history/${created.id}`).expect(200);
  await request(app).get(`/api/history/${created.id}`).expect(404);
  await request(app).delete('/api/history').expect(200);
  const empty = await request(app).get('/api/history').expect(200);
  assert.deepEqual(empty.body.data.sessions, []);
});

test('History supports limit and offset pagination without losing sessions', async () => {
  for (let index = 0; index < 5; index += 1) {
    await repository.createSession({
      documentName: `Pagination session ${index + 1}`, sourceType: 'text', learningMode: 'Standard',
      sourceText: `Source text for pagination record ${index + 1}.`,
      studyKit: { title: `Pagination ${index + 1}` },
    });
  }
  const first = await request(app).get('/api/history').query({ limit: 2, offset: 0 }).expect(200);
  assert.equal(first.body.data.sessions.length, 2);
  assert.equal(first.body.data.hasMore, true);
  assert.equal(first.body.data.nextOffset, 2);

  const second = await request(app).get('/api/history').query({ limit: 2, offset: first.body.data.nextOffset }).expect(200);
  assert.equal(second.body.data.sessions.length, 2);
  assert.equal(second.body.data.hasMore, true);
  assert.equal(second.body.data.nextOffset, 4);

  const last = await request(app).get('/api/history').query({ limit: 2, offset: second.body.data.nextOffset }).expect(200);
  assert.equal(last.body.data.sessions.length, 1);
  assert.equal(last.body.data.hasMore, false);
  assert.equal(last.body.data.nextOffset, null);
});
