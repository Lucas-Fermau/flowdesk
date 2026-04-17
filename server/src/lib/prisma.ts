import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalCache = globalThis as typeof globalThis & {
  __prismaClient?: PrismaClient;
};

export const prisma =
  globalCache.__prismaClient ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalCache.__prismaClient = prisma;
