CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Learner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarKey" TEXT,
    "birthYear" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Learner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "visualSupport" BOOLEAN NOT NULL DEFAULT true,
    "audioSupport" BOOLEAN NOT NULL DEFAULT false,
    "shortInstructions" BOOLEAN NOT NULL DEFAULT true,
    "stepByStep" BOOLEAN NOT NULL DEFAULT true,
    "breaksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attentionSupport" BOOLEAN NOT NULL DEFAULT true,
    "autonomyLevel" INTEGER NOT NULL DEFAULT 1 CHECK ("autonomyLevel" BETWEEN 1 AND 3),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningProfile_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1 CHECK ("difficulty" BETWEEN 1 AND 3),
    "estimatedMinutes" INTEGER NOT NULL CHECK ("estimatedMinutes" > 0),
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ActivityStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL CHECK ("stepNumber" > 0),
    "instruction" TEXT NOT NULL,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "expectedResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityStep_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ActivityAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStep" INTEGER NOT NULL DEFAULT 1 CHECK ("currentStep" > 0),
    "correctAnswers" INTEGER NOT NULL DEFAULT 0 CHECK ("correctAnswers" >= 0),
    "totalAnswers" INTEGER NOT NULL DEFAULT 0 CHECK ("totalAnswers" >= 0),
    "score" INTEGER NOT NULL DEFAULT 0 CHECK ("score" BETWEEN 0 AND 100),
    "stars" INTEGER NOT NULL DEFAULT 0 CHECK ("stars" BETWEEN 0 AND 3),
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityAttempt_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityAttempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityAttempt_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AttemptResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "activityStepId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttemptResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ActivityAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttemptResponse_activityStepId_fkey" FOREIGN KEY ("activityStepId") REFERENCES "ActivityStep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Learner_ownerId_idx" ON "Learner"("ownerId");
CREATE UNIQUE INDEX "LearningProfile_learnerId_key" ON "LearningProfile"("learnerId");
CREATE INDEX "Activity_isPublished_category_difficulty_idx" ON "Activity"("isPublished", "category", "difficulty");
CREATE UNIQUE INDEX "ActivityStep_activityId_stepNumber_key" ON "ActivityStep"("activityId", "stepNumber");
CREATE INDEX "ActivityStep_activityId_idx" ON "ActivityStep"("activityId");
CREATE INDEX "ActivityAttempt_learnerId_startedAt_idx" ON "ActivityAttempt"("learnerId", "startedAt");
CREATE INDEX "ActivityAttempt_activityId_idx" ON "ActivityAttempt"("activityId");
CREATE INDEX "ActivityAttempt_startedById_idx" ON "ActivityAttempt"("startedById");
CREATE UNIQUE INDEX "AttemptResponse_attemptId_activityStepId_key" ON "AttemptResponse"("attemptId", "activityStepId");
CREATE INDEX "AttemptResponse_activityStepId_idx" ON "AttemptResponse"("activityStepId");
