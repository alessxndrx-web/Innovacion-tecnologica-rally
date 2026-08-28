import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '../../shared/schemas';
import { errors } from '../../shared/errors';
import {
  activityFilterSchema,
  activityListResponseSchema,
  activityParamsSchema,
  activityResponseSchema,
} from './activity.schemas';

interface ActivityStepViewInput {
  id: string;
  stepNumber: number;
  instruction: string;
  imageUrl: string | null;
  audioUrl: string | null;
}

function summaryView(activity: {
  id: string;
  title: string;
  description: string;
  category: 'LETTERS' | 'NUMBERS' | 'COLORS' | 'SHAPES' | 'SEQUENCES';
  difficulty: number;
  estimatedMinutes: number;
  imageUrl: string | null;
}) {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    category: activity.category,
    difficulty: activity.difficulty,
    estimatedMinutes: activity.estimatedMinutes,
    imageUrl: activity.imageUrl,
  };
}

function stepView(step: ActivityStepViewInput) {
  return {
    id: step.id,
    number: step.stepNumber,
    instruction: step.instruction,
    imageUrl: step.imageUrl,
    audioUrl: step.audioUrl,
  };
}

export const activityRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook('preHandler', fastify.authenticate);

  app.get(
    '/',
    {
      schema: {
        tags: ['Actividades'],
        summary: 'Listar actividades publicadas',
        security: [{ bearerAuth: [] }],
        querystring: activityFilterSchema,
        response: { 200: activityListResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => {
      const activities = await fastify.prisma.activity.findMany({
        where: {
          isPublished: true,
          ...(request.query.category === undefined ? {} : { category: request.query.category }),
          ...(request.query.difficulty === undefined
            ? {}
            : { difficulty: request.query.difficulty }),
        },
        orderBy: [{ category: 'asc' }, { title: 'asc' }],
      });
      return { data: activities.map(summaryView) };
    },
  );

  app.get(
    '/:activityId',
    {
      schema: {
        tags: ['Actividades'],
        summary: 'Obtener una actividad publicada',
        security: [{ bearerAuth: [] }],
        params: activityParamsSchema,
        response: {
          200: activityResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const activity = await fastify.prisma.activity.findFirst({
        where: { id: request.params.activityId, isPublished: true },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      if (!activity) {
        throw errors.activityNotFound();
      }
      return {
        data: {
          ...summaryView(activity),
          steps: activity.steps.map(stepView),
        },
      };
    },
  );
};
