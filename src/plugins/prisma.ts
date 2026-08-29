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
  // que la CLI de Prisma. Sobrescribir aquí `datasources.db.url` haría que una
  // ruta relativa de SQLite se resolviese desde el directorio de trabajo del
  // proceso y no desde `prisma/`, abriendo un archivo distinto al que usan
  // `prisma migrate` y `prisma db seed`. `loadConfig()` ya valida la variable.
  const client = options.client ?? new PrismaClient();

  fastify.decorate('prisma', client);

  fastify.addHook('onClose', async () => {
    await client.$disconnect();
  });
};

export const prismaPlugin = fp(prismaPluginImplementation, { name: 'prisma' });
