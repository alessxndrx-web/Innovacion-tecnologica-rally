import type { PrismaClient } from '@prisma/client';
import type { preHandlerHookHandler } from 'fastify';
import type { AppConfig } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    config: AppConfig;
    authenticate: preHandlerHookHandler;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; type: 'access' };
    user: { sub: string; type: 'access' };
  }
}
