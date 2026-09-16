-- CreateEnum
CREATE TYPE "CohortState" AS ENUM ('draft', 'on_sale', 'confirmed', 'active', 'follow_up', 'archived', 'cancelled');

-- CreateEnum
CREATE TYPE "ExerciseClearanceStatus" AS ENUM ('pending_confirmation', 'ready', 'pending_review', 'cleared', 'cleared_with_considerations', 'not_cleared');

-- AlterTable
ALTER TABLE "SmallGroupProgramme" ADD COLUMN     "agreementVersion" TEXT NOT NULL DEFAULT '1',
ADD COLUMN     "closingBody" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closingVideoUrl" TEXT,
ADD COLUMN     "cohortState" "CohortState",
ADD COLUMN     "communityOpenAt" TIMESTAMP(3),
ADD COLUMN     "confirmationDeadline" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "creditActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditAmountPence" INTEGER,
ADD COLUMN     "creditEndsAt" TIMESTAMP(3),
ADD COLUMN     "creditServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "creditStartsAt" TIMESTAMP(3),
ADD COLUMN     "definitionId" TEXT,
ADD COLUMN     "enrolmentClosesAt" TIMESTAMP(3),
ADD COLUMN     "enrolmentOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "equipment" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "followUpAccessEndsAt" TIMESTAMP(3),
ADD COLUMN     "liveCoachingEndsAt" TIMESTAMP(3),
ADD COLUMN     "maximumParticipants" INTEGER,
ADD COLUMN     "minimumParticipants" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "refundWording" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reminder1h" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminder24h" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resourcesJson" JSONB,
ADD COLUMN     "salePricePence" INTEGER,
ADD COLUMN     "salesCopy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "structuredProgrammeEndsAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/London';

-- AlterTable
ALTER TABLE "SmallGroupProgrammeSession" ADD COLUMN     "dailyRoomName" TEXT,
ADD COLUMN     "dailyRoomUrl" TEXT,
ADD COLUMN     "exerciseKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "taughtAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SmallGroupProgrammeEnrollment" ADD COLUMN     "acceptedAgreementVersion" TEXT,
ADD COLUMN     "creditRedeemedAt" TIMESTAMP(3),
ADD COLUMN     "creditRedeemedBy" TEXT,
ADD COLUMN     "creditReference" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "purchaserEmail" TEXT,
ADD COLUMN     "refundError" TEXT,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundStatus" TEXT,
ADD COLUMN     "refundedPence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProgrammeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "curriculumJson" JSONB,
    "resourcesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeWeek" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT '',
    "education" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT,
    "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releasesAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "workoutPublished" BOOLEAN NOT NULL DEFAULT false,
    "workoutJson" JSONB,
    "reflection" TEXT NOT NULL DEFAULT '',
    "reflectionAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "ProgrammeWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingClearance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offeringKey" TEXT NOT NULL,
    "programmeId" TEXT,
    "healthRevision" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "status" "ExerciseClearanceStatus" NOT NULL DEFAULT 'pending_confirmation',
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "considerations" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferingClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammePost" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "authorId" TEXT,
    "parentId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "announcement" BOOLEAN NOT NULL DEFAULT false,
    "resourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProgrammePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeMessage" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveryId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "ProgrammeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeDefinition_slug_key" ON "ProgrammeDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeWeek_sessionId_key" ON "ProgrammeWeek"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeWeek_programmeId_number_key" ON "ProgrammeWeek"("programmeId", "number");

-- CreateIndex
CREATE INDEX "OfferingClearance_programmeId_status_idx" ON "OfferingClearance"("programmeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingClearance_userId_offeringKey_key" ON "OfferingClearance"("userId", "offeringKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammePost_sourceKey_key" ON "ProgrammePost"("sourceKey");

-- CreateIndex
CREATE INDEX "ProgrammePost_programmeId_createdAt_idx" ON "ProgrammePost"("programmeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeMessage_sourceKey_key" ON "ProgrammeMessage"("sourceKey");

-- CreateIndex
CREATE INDEX "ProgrammeMessage_sentAt_dueAt_idx" ON "ProgrammeMessage"("sentAt", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgrammeSession_dailyRoomName_key" ON "SmallGroupProgrammeSession"("dailyRoomName");

-- AddForeignKey
ALTER TABLE "SmallGroupProgramme" ADD CONSTRAINT "SmallGroupProgramme_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ProgrammeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeWeek" ADD CONSTRAINT "ProgrammeWeek_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeWeek" ADD CONSTRAINT "ProgrammeWeek_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SmallGroupProgrammeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingClearance" ADD CONSTRAINT "OfferingClearance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingClearance" ADD CONSTRAINT "OfferingClearance_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammePost" ADD CONSTRAINT "ProgrammePost_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammePost" ADD CONSTRAINT "ProgrammePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammePost" ADD CONSTRAINT "ProgrammePost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProgrammePost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeMessage" ADD CONSTRAINT "ProgrammeMessage_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
