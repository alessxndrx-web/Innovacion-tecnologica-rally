import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { AppConfig } from './config/env';
import { loadConfig } from './config/env';
import { activityRoutes } from './modules/activities/activity.routes';
import { adaptedActivityRoutes } from './modules/activities/adapted.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { attemptRoutes } from './modules/attempts/attempt.routes';
import { learnerRoutes } from './modules/learners/learner.routes';
import { registerErrorHandler } from './plugins/error-handler';
import { authenticationPlugin } from './plugins/authentication';
import { prismaPlugin } from './plugins/prisma';

export interface BuildAppOptions {
  config?: AppConfig;
  prisma?: PrismaClient;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const logger =
    options.logger === false
      ? false
      : {
          level: config.logLevel,
          redact: [
            'req.headers.authorization',
            'req.headers.cookie',
            'body.password',
            'password',
            'passwordHash',
          ],
        };
  const fastify = Fastify({
    logger,
    bodyLimit: 64 * 1024,
    genReqId: () => randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.decorate('config', config);
  registerErrorHandler(fastify);

  await fastify.register(cors, { origin: config.corsOrigins });
  await fastify.register(
    prismaPlugin,
    options.prisma === undefined ? {} : { client: options.prisma },
  );
  await fastify.register(authenticationPlugin);

  fastify.get('/health', async (_request, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
      return { data: { status: 'ok', database: 'ready' } };
    } catch {
      return reply.status(503).send({
        error: {
          code: 'NOT_READY',
          message: 'La aplicación todavía no está lista.',
          details: [],
          requestId: reply.request.id,
        },
      });
    }
  });

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(learnerRoutes, { prefix: '/api/v1/learners' });
  await fastify.register(activityRoutes, { prefix: '/api/v1/activities' });
  await fastify.register(adaptedActivityRoutes, { prefix: '/api/v1/learners' });
  await fastify.register(attemptRoutes, { prefix: '/api/v1/learners' });

  return fastify;
}
