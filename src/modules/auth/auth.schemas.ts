import { z } from 'zod';
import { dataResponseSchema, uuidSchema } from '../../shared/schemas';

export const userRoleSchema = z.enum(['PARENT', 'TEACHER']);

export const publicUserSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  fullName: z.string(),
  role: userRoleSchema,
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres.')
  .max(128, 'La contraseña no puede exceder 128 caracteres.')
  .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, 'La contraseña debe incluir una letra.')
  .regex(/[0-9]/, 'La contraseña debe incluir un número.');

export const registerBodySchema = z.object({
  email: z.string().trim().email('El correo no es válido.').max(254),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(100),
  role: userRoleSchema,
});

export const loginBodySchema = z.object({
  email: z.string().trim().email('El correo no es válido.').max(254),
  password: z.string().min(1).max(128),
});

export const authenticationResponseSchema = dataResponseSchema(
  z.object({
    accessToken: z.string(),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive(),
    user: publicUserSchema,
  }),
);

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
