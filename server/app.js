import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { initializeDatabase, sequelize } from './database/database.js';
import chatRoutes from './routes/chatRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const app = express();
app.disable('x-powered-by');

const allowedOrigins = new Set(config.allowedOrigins);
app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    try {
      const hostname = new URL(origin).hostname;
      // The Arena preview uses a per-port *.e2b.app origin; Vite proxies /api.
      callback(null, hostname.endsWith('.e2b.app'));
    } catch {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: {
    status: 'ok',
    service: 'Smart Study Companion API',
    aiConfigured: Boolean(config.geminiApiKey),
    geminiModel: config.geminiModel,
  } });
});
app.use('/api/study', studyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/export', exportRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await initializeDatabase();
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`Smart Study Companion API listening on 0.0.0.0:${config.port}`);
  });
  const shutdown = () => server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  startServer().catch((error) => {
    console.error(`API startup failed: ${error?.message || 'database initialization error'}`);
    process.exitCode = 1;
  });
}

export { startServer };
