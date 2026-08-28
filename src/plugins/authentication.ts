import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { AppError, errors } from '../shared/errors';

const authenticationPluginImplementation: FastifyPluginAsync = async (fastify) => {
  await fastify.register(jwt, {
    secret: fastify.config.jwtAccessSecret,
    sign: { expiresIn: fastify.config.accessTokenTtlSeconds },
  });

  fastify.decorate('authenticate', async (request) => {
    try {
      await request.jwtVerify();
      if (request.user.type !== 'access') {
        throw errors.unauthorized();
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.sub },
        select: { isActive: true },
      });
      if (!user?.isActive) {
        throw errors.unauthorized();
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw errors.unauthorized();
    }
  });
};

export const authenticationPlugin = fp(authenticationPluginImplementation, {
  name: 'authentication',
  dependencies: ['prisma'],
});
