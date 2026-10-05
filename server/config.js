import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

export const SERVER_ROOT = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(SERVER_ROOT, '.env') });
dotenv.config({ path: path.resolve(SERVER_ROOT, '..', '.env'), override: false });

const configuredDatabase = process.env.DATABASE_URL || './database/study_companion.db';
export const DATABASE_PATH = configuredDatabase === ':memory:'
  ? ':memory:'
  : path.isAbsolute(configuredDatabase)
    ? configuredDatabase
    : path.resolve(SERVER_ROOT, configuredDatabase);

if (DATABASE_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

export const config = Object.freeze({
  port: Number.parseInt(process.env.PORT || '5000', 10),
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  databasePath: DATABASE_PATH,
  allowedOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
  maxUploadBytes: (Number.parseInt(process.env.MAX_UPLOAD_MB || '25', 10) || 25) * 1024 * 1024,
  maxDocumentChars: Number.parseInt(process.env.MAX_DOCUMENT_CHARS || '2000000', 10) || 2_000_000,
  minTextChars: 80,
  directContextChars: 36_000,
  chunkSizeChars: 18_000,
  chunkOverlapChars: 1_200,
  maxChunks: 20,
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
});
