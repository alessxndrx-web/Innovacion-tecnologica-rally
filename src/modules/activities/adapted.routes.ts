import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { assertLearnerAccess } from '../../shared/authorization';
import { errors } from '../../shared/errors';
import { errorResponseSchema } from '../../shared/schemas';
import { adaptActivity } from './adaptation.service';
import { adaptedActivityParamsSchema, adaptedActivityResponseSchema } from './activity.schemas';

export const adaptedActivityRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook('preHandler', fastify.authenticate);

  app.get(
    '/:learnerId/activities/:activityId/adapted',
    {
      schema: {
        tags: ['Actividades adaptadas'],
        summary: 'Obtener la presentación adaptada y determinista',
        security: [{ bearerAuth: [] }],
        params: adaptedActivityParamsSchema,
        response: {
          200: adaptedActivityResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);
      const [activity, profile] = await Promise.all([
        fastify.prisma.activity.findFirst({
          where: { id: request.params.activityId, isPublished: true },
          include: { steps: { orderBy: { stepNumber: 'asc' } } },
        }),
        fastify.prisma.learningProfile.findUnique({
          where: { learnerId: request.params.learnerId },
        }),
      ]);

      if (!activity) {
        throw errors.activityNotFound();
      }
      if (!profile) {
        throw errors.forbiddenLearner();
      }

      return {
        data: adaptActivity(
          {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            category: activity.category,
            difficulty: activity.difficulty,
            estimatedMinutes: activity.estimatedMinutes,
            steps: activity.steps,
          },
          profile,
        ),
      };
    },
  );
};
