import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import {
  jsonSchemaTransform,
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
    // Sin esto, detrás de un balanceador todas las peticiones comparten la IP
    // del proxy y la limitación de tasa las trata como un único cliente.
    trustProxy: config.trustProxy,
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Muchos clientes HTTP envían `Content-Type: application/json` con el cuerpo
  // vacío en un POST sin datos. El parser por defecto lo rechaza con
  // FST_ERR_CTP_EMPTY_JSON_BODY; aquí se interpreta como ausencia de cuerpo,
  // que es lo que esperan rutas como /complete y /abandon.
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_request, body: string, done) => {
      if (body.trim() === '') {
        done(null, null);
        return;
      }

      try {
        done(null, JSON.parse(body));
      } catch {
        const failure = Object.assign(new Error('El cuerpo no es JSON válido.'), {
          statusCode: 400,
        });
        done(failure, undefined);
      }
    },
  );
  fastify.decorate('config', config);
  registerErrorHandler(fastify);

  // swagger-ui necesita estilos y scripts en línea; fuera de la documentación
  // la política por defecto de helmet se mantiene intacta.
  await fastify.register(helmet, config.enableDocs ? { contentSecurityPolicy: false } : {});
  await fastify.register(cors, { origin: config.corsOrigins });

  // El almacén en memoria cuenta por proceso: con varias réplicas el límite
  // efectivo se multiplica por el número de instancias. Redis lo hace común.
  const redis = config.redisUrl === null ? null : new Redis(config.redisUrl);
  if (redis === null && config.nodeEnv === 'production') {
    fastify.log.warn(
      'REDIS_URL no está configurada: la limitación de tasa cuenta por proceso y no será ' +
        'correcta si se ejecuta más de una instancia.',
    );
  }
  if (redis !== null) {
    fastify.addHook('onClose', async () => {
      await redis.quit();
    });
  }

  await fastify.register(rateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    ...(redis === null ? {} : { redis }),
    // Las sondas de salud del orquestador no deben consumir cuota.
    allowList: (request) => request.url === '/health',
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: `Demasiadas solicitudes. Vuelve a intentarlo en ${context.after}.`,
        details: [],
        requestId: request.id,
      },
    }),
  });

  await fastify.register(
    prismaPlugin,
    options.prisma === undefined ? {} : { client: options.prisma },
  );
  await fastify.register(authenticationPlugin);

  if (config.enableDocs) {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Sinappsis API',
          description: 'Backend del MVP de Sinappsis.',
          version: '0.1.0',
        },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
      transform: jsonSchemaTransform,
    });
    await fastify.register(swaggerUi, { routePrefix: '/docs' });
  }

  fastify.get(
    '/health',
    { schema: { tags: ['Operación'], summary: 'Estado del servicio' } },
    async (_request, reply) => {
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
    },
  );

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(learnerRoutes, { prefix: '/api/v1/learners' });
  await fastify.register(activityRoutes, { prefix: '/api/v1/activities' });
  await fastify.register(adaptedActivityRoutes, { prefix: '/api/v1/learners' });
  await fastify.register(attemptRoutes, { prefix: '/api/v1/learners' });

  return fastify;
}
