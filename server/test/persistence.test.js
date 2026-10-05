import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseUrl = pathToFileURL(path.join(serverRoot, 'database', 'database.js')).href;
const repositoryUrl = pathToFileURL(path.join(serverRoot, 'database', 'repository.js')).href;

function runNode(script, databasePath) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: serverRoot,
    timeout: 30_000,
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: databasePath, GEMINI_API_KEY: '' },
  }).trim();
}

test('SQLite session and chat history persist after closing and reopening the Node process', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'ssc-persistence-'));
  const databasePath = path.join(temporaryDirectory, 'persistence.db');
  try {
    const createScript = `
      const db = await import(${JSON.stringify(databaseUrl)});
      const repo = await import(${JSON.stringify(repositoryUrl)});
      await db.initializeDatabase();
      const session = await repo.createSession({
        documentName: 'Persistence verification', sourceType: 'text', learningMode: 'Beginner',
        sourceText: 'Original source content for a process-restart persistence check.',
        studyKit: { title: 'Persistent Study Kit', summary: { overview: 'Saved across process restarts.' } },
      });
      await repo.saveChatTurn(session.id, 'What persisted?', 'The saved study kit and chat history.');
      console.log(JSON.stringify({ id: session.id }));
      await db.sequelize.close();
    `;
    const created = JSON.parse(runNode(createScript, databasePath));
    assert.equal(created.id, 1);

    const reopenScript = `
      const db = await import(${JSON.stringify(databaseUrl)});
      const repo = await import(${JSON.stringify(repositoryUrl)});
      await db.initializeDatabase();
      const sessions = await repo.listSessions();
      const detail = await repo.getSessionDetail(1);
      console.log(JSON.stringify({ count: sessions.sessions.length, title: detail.studyKit.title, chat: detail.chatMessages }));
      await db.sequelize.close();
    `;
    const persisted = JSON.parse(runNode(reopenScript, databasePath));
    assert.equal(persisted.count, 1);
    assert.equal(persisted.title, 'Persistent Study Kit');
    assert.equal(persisted.chat.length, 2);
    assert.equal(persisted.chat[0].message, 'What persisted?');
    assert.equal(persisted.chat[1].message, 'The saved study kit and chat history.');
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
