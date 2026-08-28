import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppError } from '../shared/errors';

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'No se encontró la ruta solicitada.',
        details: [],
        requestId: request.id,
      },
    });
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: request.id,
        },
      });
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      void reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos.',
          details: error.validation.map((issue) => ({
            field: issue.instancePath.replace(/^\//, '').replaceAll('/', '.'),
            message: issue.message ?? 'Valor inválido.',
          })),
          requestId: request.id,
        },
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      void reply.status(409).send({
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'Ya existe un registro con esos datos.',
          details: [],
          requestId: request.id,
        },
      });
      return;
    }

    request.log.error({ err: error }, 'Error no controlado');
    void reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error interno. Inténtalo nuevamente.',
        details: [],
        requestId: request.id,
      },
    });
  });
}
