import { createServer } from 'http';
import { createApp } from './app';
import { initSocket } from './lib/socket';
import { env } from './config/env';

const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer);

const server = httpServer.listen(env.PORT, () => {
  console.log(`[flowdesk-api] listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`[flowdesk-api] received ${signal}, closing...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
