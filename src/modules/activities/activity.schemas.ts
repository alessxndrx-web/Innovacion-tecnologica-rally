import { z } from 'zod';
import { dataResponseSchema, uuidSchema } from '../../shared/schemas';

export const activityCategorySchema = z.enum([
  'LETTERS',
  'NUMBERS',
  'COLORS',
  'SHAPES',
  'SEQUENCES',
]);

export const activityParamsSchema = z.object({ activityId: uuidSchema });
export const adaptedActivityParamsSchema = z.object({
  learnerId: uuidSchema,
  activityId: uuidSchema,
});

export const activityFilterSchema = z.object({
  category: activityCategorySchema.optional(),
  difficulty: z.coerce.number().int().min(1).max(3).optional(),
});

export const activitySummarySchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string(),
  category: activityCategorySchema,
  difficulty: z.number().int(),
  estimatedMinutes: z.number().int(),
  imageUrl: z.string().nullable(),
});

export const activityStepSchema = z.object({
  id: uuidSchema,
  number: z.number().int(),
  instruction: z.string(),
  imageUrl: z.string().nullable(),
  audioUrl: z.string().nullable(),
});

export const activityDetailSchema = activitySummarySchema.extend({
  steps: z.array(activityStepSchema),
});

export const activityListResponseSchema = dataResponseSchema(z.array(activitySummarySchema));
export const activityResponseSchema = dataResponseSchema(activityDetailSchema);

export const adaptedActivitySchema = z.object({
  activity: activitySummarySchema.omit({ imageUrl: true }),
  presentation: z.object({
    showOneStepAtATime: z.boolean(),
    useShortInstructions: z.boolean(),
    showVisualSupport: z.boolean(),
    enableAudio: z.boolean(),
    enableBreaks: z.boolean(),
    attentionSupport: z.boolean(),
    autonomyLevel: z.number().int().min(1).max(3),
  }),
  steps: z.array(activityStepSchema),
});

export const adaptedActivityResponseSchema = dataResponseSchema(adaptedActivitySchema);
