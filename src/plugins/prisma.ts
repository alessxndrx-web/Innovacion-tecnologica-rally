import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

interface PrismaPluginOptions {
  client?: PrismaClient;
}

const prismaPluginImplementation: FastifyPluginAsync<PrismaPluginOptions> = async (
  fastify,
  options,
) => {
  const client =
    options.client ??
    new PrismaClient({
      datasources: { db: { url: fastify.config.databaseUrl } },
    });

  fastify.decorate('prisma', client);

  fastify.addHook('onClose', async () => {
    await client.$disconnect();
  });
};

export const prismaPlugin = fp(prismaPluginImplementation, { name: 'prisma' });
