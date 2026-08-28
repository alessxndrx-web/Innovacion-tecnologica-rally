import { z } from 'zod';
import { dataResponseSchema, uuidSchema } from '../../shared/schemas';

const currentYear = new Date().getUTCFullYear();

export const learningProfileInputSchema = z.object({
  visualSupport: z.boolean(),
  audioSupport: z.boolean(),
  shortInstructions: z.boolean(),
  stepByStep: z.boolean(),
  breaksEnabled: z.boolean(),
  attentionSupport: z.boolean(),
  autonomyLevel: z.number().int().min(1).max(3),
});

export const defaultLearningProfile = {
  visualSupport: true,
  audioSupport: false,
  shortInstructions: true,
  stepByStep: true,
  breaksEnabled: true,
  attentionSupport: true,
  autonomyLevel: 1,
} as const;

export const createLearnerBodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  avatarKey: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  birthYear: z
    .number()
    .int()
    .min(currentYear - 18)
    .max(currentYear)
    .optional(),
  learningProfile: learningProfileInputSchema.partial().optional(),
});

export const learnerParamsSchema = z.object({ learnerId: uuidSchema });

export const learningProfileSchema = learningProfileInputSchema.extend({
  id: uuidSchema,
  learnerId: uuidSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const learnerSchema = z.object({
  id: uuidSchema,
  displayName: z.string(),
  avatarKey: z.string().nullable(),
  birthYear: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  learningProfile: learningProfileSchema,
});

export const learnerResponseSchema = dataResponseSchema(learnerSchema);
export const learnerListResponseSchema = dataResponseSchema(z.array(learnerSchema));
export const learningProfileResponseSchema = dataResponseSchema(learningProfileSchema);
