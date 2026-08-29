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

export function dataResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: z.record(z.unknown()).optional() });
}
