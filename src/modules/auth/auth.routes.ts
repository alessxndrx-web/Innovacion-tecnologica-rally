import { Prisma, type User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AppError, errors } from '../../shared/errors';
import { errorResponseSchema } from '../../shared/schemas';
import { hashPassword, normalizeEmail, toPublicUser, verifyPassword } from './auth.service';
import { authenticationResponseSchema, loginBodySchema, registerBodySchema } from './auth.schemas';

function registrationConflict(): AppError {
  return new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'No fue posible registrar la cuenta.');
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/register',
    {
      schema: {
        tags: ['Autenticación'],
        summary: 'Registrar una cuenta adulta',
        body: registerBodySchema,
        response: {
          201: authenticationResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
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

      return reply.status(201).send({
        data: {
          accessToken: fastify.jwt.sign({ sub: user.id, type: 'access' }),
          tokenType: 'Bearer' as const,
          expiresIn: fastify.config.accessTokenTtlSeconds,
          user: toPublicUser(user),
        },
      });
    },
  );

  app.post(
    '/login',
    {
      schema: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        body: loginBodySchema,
        response: {
          200: authenticationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
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

      return {
        data: {
          accessToken: fastify.jwt.sign({ sub: user.id, type: 'access' }),
          tokenType: 'Bearer' as const,
          expiresIn: fastify.config.accessTokenTtlSeconds,
          user: toPublicUser(user),
        },
      };
    },
  );
};
