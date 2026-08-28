import type { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { assertLearnerAccess } from '../../shared/authorization';
import { errors } from '../../shared/errors';
import { errorResponseSchema } from '../../shared/schemas';
import {
  createLearnerBodySchema,
  defaultLearningProfile,
  learnerListResponseSchema,
  learnerParamsSchema,
  learnerResponseSchema,
  learningProfileInputSchema,
  learningProfileResponseSchema,
} from './learner.schemas';

const learnerInclude = { learningProfile: true } satisfies Prisma.LearnerInclude;
type LearnerWithProfile = Prisma.LearnerGetPayload<{ include: typeof learnerInclude }>;

function profileView(profile: NonNullable<LearnerWithProfile['learningProfile']>) {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function learnerView(learner: LearnerWithProfile) {
  if (!learner.learningProfile) {
    throw new Error('El estudiante no tiene perfil de aprendizaje.');
  }
  return {
    id: learner.id,
    displayName: learner.displayName,
    avatarKey: learner.avatarKey,
    birthYear: learner.birthYear,
    createdAt: learner.createdAt.toISOString(),
    updatedAt: learner.updatedAt.toISOString(),
    learningProfile: profileView(learner.learningProfile),
  };
}

export const learnerRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook('preHandler', fastify.authenticate);

  app.post(
    '/',
    {
      schema: {
        tags: ['Estudiantes'],
        body: createLearnerBodySchema,
        response: { 201: learnerResponseSchema, 400: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const requestedProfile = request.body.learningProfile;
      const profile = {
        visualSupport: requestedProfile?.visualSupport ?? defaultLearningProfile.visualSupport,
        audioSupport: requestedProfile?.audioSupport ?? defaultLearningProfile.audioSupport,
        shortInstructions:
          requestedProfile?.shortInstructions ?? defaultLearningProfile.shortInstructions,
        stepByStep: requestedProfile?.stepByStep ?? defaultLearningProfile.stepByStep,
        breaksEnabled: requestedProfile?.breaksEnabled ?? defaultLearningProfile.breaksEnabled,
        attentionSupport:
          requestedProfile?.attentionSupport ?? defaultLearningProfile.attentionSupport,
        autonomyLevel: requestedProfile?.autonomyLevel ?? defaultLearningProfile.autonomyLevel,
      };
      const learner = await fastify.prisma.learner.create({
        data: {
          ownerId: request.user.sub,
          displayName: request.body.displayName,
          ...(request.body.avatarKey === undefined ? {} : { avatarKey: request.body.avatarKey }),
          ...(request.body.birthYear === undefined ? {} : { birthYear: request.body.birthYear }),
          learningProfile: { create: profile },
        },
        include: learnerInclude,
      });
      return reply.status(201).send({ data: learnerView(learner) });
    },
  );

  app.get(
    '/',
    {
      schema: {
        tags: ['Estudiantes'],
        response: { 200: learnerListResponseSchema },
      },
    },
    async (request) => {
      const learners = await fastify.prisma.learner.findMany({
        where: { ownerId: request.user.sub },
        include: learnerInclude,
        orderBy: { createdAt: 'desc' },
      });
      return { data: learners.map(learnerView) };
    },
  );

  app.get(
    '/:learnerId',
    {
      schema: {
        tags: ['Estudiantes'],
        params: learnerParamsSchema,
        response: {
          200: learnerResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);
      const learner = await fastify.prisma.learner.findUnique({
        where: { id: request.params.learnerId },
        include: learnerInclude,
      });
      if (!learner) {
        throw errors.forbiddenLearner();
      }
      return { data: learnerView(learner) };
    },
  );

  app.put(
    '/:learnerId/learning-profile',
    {
      schema: {
        tags: ['Perfiles de apoyo'],
        params: learnerParamsSchema,
        body: learningProfileInputSchema,
        response: {
          200: learningProfileResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      await assertLearnerAccess(fastify.prisma, request.params.learnerId, request.user.sub);
      const profile = await fastify.prisma.learningProfile.upsert({
        where: { learnerId: request.params.learnerId },
        create: { learnerId: request.params.learnerId, ...request.body },
        update: request.body,
      });
      return { data: profileView(profile) };
    },
  );
};
