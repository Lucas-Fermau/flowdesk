import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from './jwt';
import { prisma } from './prisma';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  if (io) return io;

  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? '';
    if (!token) return next(new Error('Token ausente'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    // Auto-join project rooms for workspaces user belongs to
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      // no-op
    });

    void prisma; // referenced for potential future per-connection queries
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToProject(projectId: string, event: string, payload: unknown) {
  io?.to(`project:${projectId}`).emit(event, payload);
}
