import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { assertLearnerAccess } from '../../shared/authorization';
import { errors } from '../../shared/errors';
import { errorResponseSchema } from '../../shared/schemas';
import { calculateAttemptScore, evaluateExpectedResponse } from './scoring.service';
import {
  attemptParamsSchema,
  attemptResponseSchema,
  createAttemptBodySchema,
  emptyBodySchema,
  progressResponseSchema,
  responseParamsSchema,
  submitResponseBodySchema,
  submittedResponseSchema,
} from './attempt.schemas';

const attemptInclude = {
  activity: { select: { id: true, title: true, category: true } },
  responses: { orderBy: { answeredAt: 'asc' as const } },
} satisfies Prisma.ActivityAttemptInclude;

type AttemptWithDetails = Prisma.ActivityAttemptGetPayload<{ include: typeof attemptInclude }>;

function responseView(response: AttemptWithDetails['responses'][number]) {
  return {
    id: response.id,
    attemptId: response.attemptId,
    activityStepId: response.activityStepId,
    response: response.response,
    isCorrect: response.isCorrect,
    answeredAt: response.answeredAt.toISOString(),
    updatedAt: response.updatedAt.toISOString(),
  };
}

function attemptView(attempt: AttemptWithDetails) {
  return {
    id: attempt.id,
    learnerId: attempt.learnerId,
    activity: attempt.activity,
    status: attempt.status,
    currentStep: attempt.currentStep,
    correctAnswers: attempt.correctAnswers,
    totalAnswers: attempt.totalAnswers,
    score: attempt.score,
    stars: attempt.stars,
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    updatedAt: attempt.updatedAt.toISOString(),
    responses: attempt.responses.map(responseView),
  };
}

export const attemptRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook('preHandler', fastify.authenticate);

  app.post(
    '/:learnerId/attempts',
    {
      schema: {
        tags: ['Intentos'],
        params: attemptParamsSchema.pick({ learnerId: true }),
        body: createAttemptBodySchema,
        response: {
          201: attemptResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);
      const activity = await fastify.prisma.activity.findFirst({
        where: { id: request.body.activityId, isPublished: true },
        select: { id: true },
      });
      if (!activity) {
        throw errors.activityNotFound();
      }

      const attempt = await fastify.prisma.activityAttempt.create({
        data: {
          learnerId: request.params.learnerId,
          activityId: activity.id,
          startedById: request.user.sub,
          status: 'IN_PROGRESS',
          currentStep: 1,
          correctAnswers: 0,
          totalAnswers: 0,
          score: 0,
          stars: 0,
        },
        include: attemptInclude,
      });
      return reply.status(201).send({ data: attemptView(attempt) });
    },
  );

  app.put(
    '/:learnerId/attempts/:attemptId/responses/:stepId',
    {
      schema: {
        tags: ['Intentos'],
        params: responseParamsSchema,
        body: submitResponseBodySchema,
        response: {
          200: submittedResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);

      const saved = await fastify.prisma.$transaction(async (transaction) => {
        const attempt = await transaction.activityAttempt.findFirst({
          where: { id: request.params.attemptId, learnerId: request.params.learnerId },
        });
        if (!attempt) {
          throw errors.attemptNotFound();
        }
        if (attempt.status !== 'IN_PROGRESS') {
          throw errors.attemptNotEditable();
        }

        const step = await transaction.activityStep.findFirst({
          where: { id: request.params.stepId, activityId: attempt.activityId },
        });
        if (!step) {
          throw errors.invalidActivityStep();
        }

        const isCorrect = evaluateExpectedResponse(step.expectedResponse, request.body.response);
        const response = await transaction.attemptResponse.upsert({
          where: {
            attemptId_activityStepId: {
              attemptId: attempt.id,
              activityStepId: step.id,
            },
          },
          create: {
            attemptId: attempt.id,
            activityStepId: step.id,
            response: request.body.response as Prisma.InputJsonValue,
            isCorrect,
          },
          update: {
            response: request.body.response as Prisma.InputJsonValue,
            isCorrect,
            answeredAt: new Date(),
          },
        });
        await transaction.activityAttempt.update({
          where: { id: attempt.id },
          data: { currentStep: Math.max(attempt.currentStep, step.stepNumber + 1) },
        });
        return response;
      });

      return { data: responseView(saved) };
    },
  );

  app.post(
    '/:learnerId/attempts/:attemptId/complete',
    {
      schema: {
        tags: ['Intentos'],
        params: attemptParamsSchema,
        body: emptyBodySchema,
        response: {
          200: attemptResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);

      const completed = await fastify.prisma.$transaction(async (transaction) => {
        const attempt = await transaction.activityAttempt.findFirst({
          where: { id: request.params.attemptId, learnerId: request.params.learnerId },
          include: attemptInclude,
        });
        if (!attempt) {
          throw errors.attemptNotFound();
        }
        if (attempt.status === 'COMPLETED') {
          return attempt;
        }
        if (attempt.status !== 'IN_PROGRESS') {
          throw errors.attemptNotEditable();
        }

        const calculated = calculateAttemptScore(attempt.responses);
        return transaction.activityAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'COMPLETED',
            correctAnswers: calculated.correctAnswers,
            totalAnswers: calculated.totalAnswers,
            score: calculated.score,
            stars: calculated.stars,
            completedAt: new Date(),
          },
          include: attemptInclude,
        });
      });

      return { data: attemptView(completed) };
    },
  );

  app.get(
    '/:learnerId/progress',
    {
      schema: {
        tags: ['Progreso'],
        params: attemptParamsSchema.pick({ learnerId: true }),
        response: {
          200: progressResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);
      const attempts = await fastify.prisma.activityAttempt.findMany({
        where: { learnerId: request.params.learnerId },
        select: {
          status: true,
          score: true,
          stars: true,
          startedAt: true,
          completedAt: true,
          activity: { select: { category: true } },
        },
        orderBy: { startedAt: 'desc' },
      });

      const summarize = (items: typeof attempts) => {
        const completed = items.filter((attempt) => attempt.status === 'COMPLETED');
        const averageScore =
          completed.length === 0
            ? 0
            : Math.round(
                completed.reduce((total, attempt) => total + attempt.score, 0) / completed.length,
              );
        const latest = items.reduce<Date | null>((current, attempt) => {
          const candidate = attempt.completedAt ?? attempt.startedAt;
          return current === null || candidate > current ? candidate : current;
        }, null);

        return {
          activitiesStarted: items.length,
          activitiesCompleted: completed.length,
          averageScore,
          totalStars: completed.reduce((total, attempt) => total + attempt.stars, 0),
          latestActivityAt: latest?.toISOString() ?? null,
        };
      };

      const categories = ['LETTERS', 'NUMBERS', 'COLORS', 'SHAPES', 'SEQUENCES'] as const;
      return {
        data: {
          overall: summarize(attempts),
          categories: categories.map((category) => ({
            category,
            ...summarize(attempts.filter((attempt) => attempt.activity.category === category)),
          })),
        },
      };
    },
  );
};
