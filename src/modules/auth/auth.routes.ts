import { Prisma, type User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AppError, errors } from '../../shared/errors';
import { errorResponseSchema } from '../../shared/schemas';
import { hashPassword, normalizeEmail, toPublicUser, verifyPassword } from './auth.service';
import {
  issueRefreshToken,
  purgeExpiredRefreshTokens,
  revokeAllUserSessions,
  revokeRefreshToken,
  rotateRefreshToken,
} from './session.service';
import {
  authenticationResponseSchema,
  currentUserResponseSchema,
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from './auth.schemas';

function registrationConflict(): AppError {
  return new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'No fue posible registrar la cuenta.');
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Estas rutas son las únicas sin autenticar que ejecutan argon2id con 19 MiB
  // de memoria por llamada: además de la fuerza bruta, un pico de peticiones
  // concurrentes agotaría la memoria del proceso. Por eso llevan un límite
  // mucho más estricto que el global.
  const authRateLimit = {
    rateLimit: {
      max: fastify.config.authRateLimit.max,
      timeWindow: fastify.config.authRateLimit.windowMs,
    },
  };

  const buildSession = async (user: User) => {
    const { refreshToken } = await issueRefreshToken(
      fastify.prisma,
      user.id,
      fastify.config.refreshTokenTtlSeconds,
    );

    return {
      accessToken: fastify.jwt.sign({ sub: user.id, type: 'access' }),
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: fastify.config.accessTokenTtlSeconds,
      refreshExpiresIn: fastify.config.refreshTokenTtlSeconds,
      user: toPublicUser(user),
    };
  };

  app.post(
    '/register',
    {
      config: authRateLimit,
      schema: {
        tags: ['Autenticación'],
        summary: 'Registrar una cuenta adulta',
        body: registerBodySchema,
        response: {
          201: authenticationResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const email = normalizeEmail(request.body.email);
      const passwordHash = await hashPassword(request.body.password);

      const existing = await fastify.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        throw registrationConflict();
      }

      let user: User;
      try {
        user = await fastify.prisma.user.create({
          data: {
            email,
            passwordHash,
            fullName: request.body.fullName,
            role: request.body.role,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw registrationConflict();
        }
        throw error;
      }

      return reply.status(201).send({ data: await buildSession(user) });
    },
  );

  app.post(
    '/login',
    {
      config: authRateLimit,
      schema: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        body: loginBodySchema,
        response: {
          200: authenticationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const user = await fastify.prisma.user.findUnique({
        where: { email: normalizeEmail(request.body.email) },
      });

      if (
        !user ||
        !user.isActive ||
        !(await verifyPassword(user.passwordHash, request.body.password))
      ) {
        throw errors.invalidCredentials();
      }

      // Mantiene acotada la tabla de tokens sin necesitar un proceso aparte.
      await purgeExpiredRefreshTokens(fastify.prisma);

      return { data: await buildSession(user) };
    },
  );

  app.post(
    '/refresh',
    {
      config: authRateLimit,
      schema: {
        tags: ['Autenticación'],
        summary: 'Renovar la sesión con un token de renovación',
        body: refreshBodySchema,
        response: {
          200: authenticationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const rotated = await rotateRefreshToken(
        fastify.prisma,
        request.body.refreshToken,
        fastify.config.refreshTokenTtlSeconds,
      );

      const user = await fastify.prisma.user.findUnique({ where: { id: rotated.userId } });
      if (!user || !user.isActive) {
        throw errors.invalidRefreshToken();
      }

      return {
        data: {
          accessToken: fastify.jwt.sign({ sub: user.id, type: 'access' }),
          refreshToken: rotated.refreshToken,
          tokenType: 'Bearer' as const,
          expiresIn: fastify.config.accessTokenTtlSeconds,
          refreshExpiresIn: fastify.config.refreshTokenTtlSeconds,
          user: toPublicUser(user),
        },
      };
    },
  );

  app.post(
    '/logout',
    {
      schema: {
        tags: ['Autenticación'],
        summary: 'Cerrar la sesión asociada a un token de renovación',
        body: refreshBodySchema,
        response: { 204: z.null(), 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      await revokeRefreshToken(fastify.prisma, request.body.refreshToken);
      return reply.status(204).send(null);
    },
  );

  app.post(
    '/logout-all',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Autenticación'],
        summary: 'Cerrar la sesión en todos los dispositivos',
        security: [{ bearerAuth: [] }],
        response: { 204: z.null(), 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      await revokeAllUserSessions(fastify.prisma, request.user.sub);
      return reply.status(204).send(null);
    },
  );

  app.get(
    '/me',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Autenticación'],
        summary: 'Datos de la cuenta autenticada',
        security: [{ bearerAuth: [] }],
        response: { 200: currentUserResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => {
      const user = await fastify.prisma.user.findUnique({ where: { id: request.user.sub } });
      if (!user) {
        throw errors.unauthorized();
      }

      return { data: toPublicUser(user) };
    },
  );
};
