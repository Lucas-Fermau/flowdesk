import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          cb(null, true);
        } else {
          cb(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', router);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  app.use(errorHandler);

  return app;
}
