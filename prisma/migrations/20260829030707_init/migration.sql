-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('LETTERS', 'NUMBERS', 'COLORS', 'SHAPES', 'SEQUENCES');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarKey" TEXT,
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "visualSupport" BOOLEAN NOT NULL DEFAULT true,
    "audioSupport" BOOLEAN NOT NULL DEFAULT false,
    "shortInstructions" BOOLEAN NOT NULL DEFAULT true,
    "stepByStep" BOOLEAN NOT NULL DEFAULT true,
    "breaksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attentionSupport" BOOLEAN NOT NULL DEFAULT true,
    "autonomyLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimatedMinutes" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityStep" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "expectedResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAttempt" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalAnswers" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "activityStepId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Learner_ownerId_idx" ON "Learner"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProfile_learnerId_key" ON "LearningProfile"("learnerId");

-- CreateIndex
CREATE INDEX "Activity_isPublished_category_difficulty_idx" ON "Activity"("isPublished", "category", "difficulty");

-- CreateIndex
CREATE INDEX "ActivityStep_activityId_idx" ON "ActivityStep"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityStep_activityId_stepNumber_key" ON "ActivityStep"("activityId", "stepNumber");

-- CreateIndex
CREATE INDEX "ActivityAttempt_learnerId_startedAt_idx" ON "ActivityAttempt"("learnerId", "startedAt");

-- CreateIndex
CREATE INDEX "ActivityAttempt_activityId_idx" ON "ActivityAttempt"("activityId");

-- CreateIndex
CREATE INDEX "ActivityAttempt_startedById_idx" ON "ActivityAttempt"("startedById");

-- CreateIndex
CREATE INDEX "AttemptResponse_activityStepId_idx" ON "AttemptResponse"("activityStepId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptResponse_attemptId_activityStepId_key" ON "AttemptResponse"("attemptId", "activityStepId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityStep" ADD CONSTRAINT "ActivityStep_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAttempt" ADD CONSTRAINT "ActivityAttempt_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptResponse" ADD CONSTRAINT "AttemptResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ActivityAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptResponse" ADD CONSTRAINT "AttemptResponse_activityStepId_fkey" FOREIGN KEY ("activityStepId") REFERENCES "ActivityStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restricciones de dominio trasladadas del esquema SQLite original. Prisma no
-- las genera a partir de schema.prisma, así que se mantienen aquí: son la
-- última defensa si un cálculo del servidor se equivoca.
ALTER TABLE "LearningProfile"
  ADD CONSTRAINT "LearningProfile_autonomyLevel_check" CHECK ("autonomyLevel" BETWEEN 1 AND 3);

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 3),
  ADD CONSTRAINT "Activity_estimatedMinutes_check" CHECK ("estimatedMinutes" > 0);

ALTER TABLE "ActivityStep"
  ADD CONSTRAINT "ActivityStep_stepNumber_check" CHECK ("stepNumber" > 0);

ALTER TABLE "ActivityAttempt"
  ADD CONSTRAINT "ActivityAttempt_currentStep_check" CHECK ("currentStep" > 0),
  ADD CONSTRAINT "ActivityAttempt_correctAnswers_check" CHECK ("correctAnswers" >= 0),
  ADD CONSTRAINT "ActivityAttempt_totalAnswers_check" CHECK ("totalAnswers" >= 0),
  ADD CONSTRAINT "ActivityAttempt_score_check" CHECK ("score" BETWEEN 0 AND 100),
  ADD CONSTRAINT "ActivityAttempt_stars_check" CHECK ("stars" BETWEEN 0 AND 3);
