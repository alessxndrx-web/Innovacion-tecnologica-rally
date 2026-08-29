import { z } from 'zod';
import { activityCategorySchema } from '../activities/activity.schemas';
import { dataResponseSchema, uuidSchema } from '../../shared/schemas';

export const createAttemptBodySchema = z
  .object({ activityId: uuidSchema })
  .strict('Solo se permite seleccionar la actividad.');

export const attemptParamsSchema = z.object({
  learnerId: uuidSchema,
  attemptId: uuidSchema,
});

export const responseParamsSchema = attemptParamsSchema.extend({ stepId: uuidSchema });

export const submitResponseBodySchema = z
  .object({ response: z.record(z.unknown()) })
  .strict('No se permiten campos adicionales.');

// Fastify entrega `null` como cuerpo cuando la petición no trae ninguno, así
// que `.optional()` por sí solo rechazaba `POST .../complete` sin cuerpo, que
// es exactamente como lo documenta el README. `.nullish()` acepta ambos casos.
export const emptyBodySchema = z.object({}).strict().nullish();

export const attemptResponseItemSchema = z.object({
  id: uuidSchema,
  attemptId: uuidSchema,
  activityStepId: uuidSchema,
  response: z.unknown(),
  isCorrect: z.boolean().nullable(),
  answeredAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const attemptSchema = z.object({
  id: uuidSchema,
  learnerId: uuidSchema,
  activity: z.object({
    id: uuidSchema,
    title: z.string(),
    category: activityCategorySchema,
  }),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']),
  currentStep: z.number().int().min(1),
  correctAnswers: z.number().int().min(0),
  totalAnswers: z.number().int().min(0),
  score: z.number().int().min(0).max(100),
  stars: z.number().int().min(0).max(3),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  responses: z.array(attemptResponseItemSchema),
});

export const attemptResponseSchema = dataResponseSchema(attemptSchema);
export const submittedResponseSchema = dataResponseSchema(attemptResponseItemSchema);

export const progressResponseSchema = dataResponseSchema(
  z.object({
    overall: z.object({
      activitiesStarted: z.number().int().min(0),
      activitiesCompleted: z.number().int().min(0),
      averageScore: z.number().int().min(0).max(100),
      totalStars: z.number().int().min(0),
      latestActivityAt: z.string().datetime().nullable(),
    }),
    categories: z.array(
      z.object({
        category: activityCategorySchema,
        activitiesStarted: z.number().int().min(0),
        activitiesCompleted: z.number().int().min(0),
        averageScore: z.number().int().min(0).max(100),
        totalStars: z.number().int().min(0),
        latestActivityAt: z.string().datetime().nullable(),
      }),
    ),
  }),
);
