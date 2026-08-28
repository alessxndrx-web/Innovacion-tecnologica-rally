import type { PrismaClient } from '@prisma/client';
import { errors } from './errors';

export async function assertLearnerAccess(
  prisma: PrismaClient,
  learnerId: string,
  userId: string,
): Promise<void> {
  const learner = await prisma.learner.findFirst({
    where: { id: learnerId, ownerId: userId },
    select: { id: true },
  });

  if (!learner) {
    throw errors.forbiddenLearner();
  }
}
