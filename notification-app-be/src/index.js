import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { notificationsRouter } from './routes/notificationsRoutes.js';
import { bootstrapLogger, logEvent } from './lib/logger.js';

bootstrapLogger();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  await logEvent('backend', 'debug', 'route', 'GET /health');
  res.json({ ok: true, service: 'notification-app-be' });
});

app.use(notificationsRouter);

app.use((error, _req, res, _next) => {
  logEvent(
    'backend',
    'error',
    'handler',
    error instanceof Error ? error.message : String(error)
  ).catch(() => null);

  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Notification backend listening on http://127.0.0.1:${port}`);
});
