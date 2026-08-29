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
  // El cliente lee `DATABASE_URL` a través de `env()` en schema.prisma, igual
  // que la CLI de Prisma: así el servidor, `prisma migrate` y `prisma db seed`
  // apuntan siempre a la misma base sin posibilidad de divergir. `loadConfig()`
  // ya valida que la variable exista antes de llegar aquí.
  const client = options.client ?? new PrismaClient();

  fastify.decorate('prisma', client);

  fastify.addHook('onClose', async () => {
    await client.$disconnect();
  });
};

export const prismaPlugin = fp(prismaPluginImplementation, { name: 'prisma' });
