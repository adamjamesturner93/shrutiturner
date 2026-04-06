-- CreateEnum
CREATE TYPE "AcceptanceType" AS ENUM ('terms', 'health_waiver', 'health_data', 'recording_notice', 'immediate_start', 'marketing');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('injury_concern', 'participant_removal', 'unsafe_behaviour', 'safeguarding_issue', 'technical_safeguarding_issue');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'member';
ALTER TYPE "UserRole" ADD VALUE 'owner_admin';

-- Normalize existing role rows to the new top-level role layer.
UPDATE "User" SET "role" = 'member' WHERE "role" = 'student';
UPDATE "User" SET "role" = 'owner_admin' WHERE "role" = 'admin';

-- AlterTable
ALTER TABLE "ClassBooking" ADD COLUMN     "complianceSnapshotJson" JSONB;

-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRecorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordingScope" TEXT,
ADD COLUMN     "replayAccessDurationDays" INTEGER,
ADD COLUMN     "replayAvailable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MembershipSubscription" ADD COLUMN     "complianceSnapshotJson" JSONB;

-- AlterTable
ALTER TABLE "RetreatBooking" ADD COLUMN     "complianceSnapshotJson" JSONB;

-- AlterTable
ALTER TABLE "RetreatDate" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRecorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordingScope" TEXT,
ADD COLUMN     "replayAccessDurationDays" INTEGER,
ADD COLUMN     "replayAvailable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SmallGroupProgramme" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRecorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordingScope" TEXT,
ADD COLUMN     "replayAccessDurationDays" INTEGER,
ADD COLUMN     "replayAvailable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SmallGroupProgrammeEnrollment" ADD COLUMN     "complianceSnapshotJson" JSONB;

-- CreateTable
CREATE TABLE "PolicyDocumentVersion" (
    "id" TEXT NOT NULL,
    "type" "AcceptanceType" NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "contentSource" TEXT NOT NULL DEFAULT 'app',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedByUserId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptanceEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "AcceptanceType" NOT NULL,
    "policyVersionId" TEXT,
    "version" TEXT NOT NULL,
    "acceptanceSurface" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcceptanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLog" (
    "id" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "sessionId" TEXT,
    "affectedUserId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "followUpNotes" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PolicyDocumentVersion_type_isCurrent_idx" ON "PolicyDocumentVersion"("type", "isCurrent");

-- CreateIndex
CREATE INDEX "PolicyDocumentVersion_slug_isCurrent_idx" ON "PolicyDocumentVersion"("slug", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocumentVersion_type_version_key" ON "PolicyDocumentVersion"("type", "version");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_userId_type_acceptedAt_idx" ON "AcceptanceEvent"("userId", "type", "acceptedAt");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_policyVersionId_acceptedAt_idx" ON "AcceptanceEvent"("policyVersionId", "acceptedAt");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_actorUserId_acceptedAt_idx" ON "AcceptanceEvent"("actorUserId", "acceptedAt");

-- CreateIndex
CREATE INDEX "IncidentLog_sessionId_createdAt_idx" ON "IncidentLog"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_affectedUserId_createdAt_idx" ON "IncidentLog"("affectedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_actorUserId_createdAt_idx" ON "IncidentLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_category_createdAt_idx" ON "IncidentLog"("category", "createdAt");

-- AddForeignKey
ALTER TABLE "PolicyDocumentVersion" ADD CONSTRAINT "PolicyDocumentVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
