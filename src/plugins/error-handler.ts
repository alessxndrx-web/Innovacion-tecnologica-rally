import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppError, type ErrorDetail } from '../shared/errors';

interface HttpError {
  statusCode: number;
  code?: string | undefined;
}

/**
 * Fastify señala con `statusCode` los fallos de protocolo que ya son culpa del
 * cliente (JSON mal formado, `Content-Type` no soportado, cuerpo demasiado
 * grande, límite de peticiones). Sin este reconocimiento acababan en el 500
 * genérico y se registraban como errores no controlados del servidor.
 */
function asClientError(error: unknown): HttpError | null {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null;
  }

  const { statusCode } = error;
  if (typeof statusCode !== 'number' || statusCode < 400 || statusCode > 499) {
    return null;
  }

  const code = 'code' in error ? error.code : undefined;
  return { statusCode, code: typeof code === 'string' ? code : undefined };
}

/**
 * Mensajes propios por estado: describen el problema sin reenviar al cliente el
 * texto interno del error.
 */
const CLIENT_ERROR_MESSAGES: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'La solicitud no es válida.' },
  401: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión para realizar esta acción.' },
  403: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción.' },
  404: { code: 'ROUTE_NOT_FOUND', message: 'No se encontró la ruta solicitada.' },
  405: { code: 'METHOD_NOT_ALLOWED', message: 'El método no está permitido en esta ruta.' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'El contenido enviado es demasiado grande.' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'El tipo de contenido no es compatible.' },
  429: { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas solicitudes. Inténtalo más tarde.' },
};

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
    const respond = (statusCode: number, code: string, message: string, details: ErrorDetail[]) => {
      void reply.status(statusCode).send({
        error: { code, message, details, requestId: request.id },
      });
    };

    if (error instanceof AppError) {
      respond(error.statusCode, error.code, error.message, error.details);
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      respond(
        400,
        'VALIDATION_ERROR',
        'Los datos enviados no son válidos.',
        error.validation.map((issue) => ({
          field: issue.instancePath.replace(/^\//, '').replaceAll('/', '.'),
          message: issue.message ?? 'Valor inválido.',
        })),
      );
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      respond(409, 'RESOURCE_CONFLICT', 'Ya existe un registro con esos datos.', []);
      return;
    }

    const clientError = asClientError(error);
    if (clientError) {
      const mapped = CLIENT_ERROR_MESSAGES[clientError.statusCode] ?? {
        code: 'REQUEST_ERROR',
        message: 'La solicitud no se pudo procesar.',
      };
      request.log.info(
        { statusCode: clientError.statusCode, errorCode: clientError.code },
        'Solicitud rechazada',
      );
      respond(clientError.statusCode, mapped.code, mapped.message, []);
      return;
    }

    request.log.error({ err: error }, 'Error no controlado');
    respond(500, 'INTERNAL_ERROR', 'Ocurrió un error interno. Inténtalo nuevamente.', []);
  });
}
