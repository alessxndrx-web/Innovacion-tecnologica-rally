import { z } from 'zod';

export const uuidSchema = z.string().uuid('El identificador debe ser un UUID válido.');

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
      }),
    ),
    requestId: z.string(),
  }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export function dataResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: z.record(z.unknown()).optional() });
}
