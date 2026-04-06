-- CreateEnum
CREATE TYPE "ReplayAssetStatus" AS ENUM ('processing', 'ready', 'delete_pending', 'deleted', 'sync_failed', 'delete_failed');

-- CreateEnum
CREATE TYPE "ReplayEntitlementAccessType" AS ENUM ('participant', 'assigned_instructor');

-- CreateEnum
CREATE TYPE "BillingDisputeStatus" AS ENUM ('open', 'warning_closed', 'won', 'lost');

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('export', 'deletion');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('pending', 'completed', 'blocked', 'failed');

-- CreateEnum
CREATE TYPE "ScheduledJobRunStatus" AS ENUM ('started', 'succeeded', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ScheduledJobTriggerType" AS ENUM ('cron', 'manual', 'webhook');

-- CreateEnum
CREATE TYPE "ParticipantModerationActionType" AS ENUM ('removed', 'block_reentry', 'unblock_reentry');

-- AlterTable
ALTER TABLE "RetreatDate" ADD COLUMN "refundRuleId" TEXT;

-- AlterTable
ALTER TABLE "SmallGroupProgramme" ADD COLUMN "refundRuleId" TEXT;

-- AlterTable
ALTER TABLE "SmallGroupProgrammeSession" ADD COLUMN "instructorUserId" TEXT;

-- CreateTable
CREATE TABLE "ReplayAsset" (
  "id" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "classSessionId" TEXT,
  "retreatDateId" TEXT,
  "smallGroupProgrammeId" TEXT,
  "smallGroupProgrammeSessionId" TEXT,
  "dailyRoomName" TEXT,
  "dailyRecordingId" TEXT,
  "playbackUrl" TEXT,
  "status" "ReplayAssetStatus" NOT NULL DEFAULT 'processing',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "deleteAfterAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "syncError" TEXT,
  "recordingConfigSnapshotJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReplayAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayEntitlement" (
  "id" TEXT NOT NULL,
  "replayAssetId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessType" "ReplayEntitlementAccessType" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedByUserId" TEXT,
  "complianceSnapshotJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReplayEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRule" (
  "id" TEXT NOT NULL,
  "family" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "description" TEXT,
  "configJson" JSONB NOT NULL,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeUntil" TIMESTAMP(3),
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefundRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "type" "PrivacyRequestType" NOT NULL,
  "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'pending',
  "summaryChecksum" TEXT,
  "summaryJson" JSONB,
  "blockReason" TEXT,
  "generatedAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActionLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "reason" TEXT,
  "oldValueJson" JSONB,
  "newValueJson" JSONB,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobRun" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "triggerType" "ScheduledJobTriggerType" NOT NULL,
  "actorUserId" TEXT,
  "status" "ScheduledJobRunStatus" NOT NULL DEFAULT 'started',
  "countersJson" JSONB,
  "errorSummary" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduledJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDisputeCase" (
  "id" TEXT NOT NULL,
  "stripeDisputeId" TEXT NOT NULL,
  "userId" TEXT,
  "paymentIntentId" TEXT,
  "chargeId" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "status" "BillingDisputeStatus" NOT NULL DEFAULT 'open',
  "openedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  "payloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingDisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantModerationAction" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actionType" "ParticipantModerationActionType" NOT NULL,
  "reason" TEXT NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParticipantModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipantBlock" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "blockedUntil" TIMESTAMP(3),
  "liftedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionParticipantBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatDateInstructorAssignment" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetreatDateInstructorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupProgrammeInstructorAssignment" (
  "id" TEXT NOT NULL,
  "programmeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmallGroupProgrammeInstructorAssignment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "ReplayAsset_classSessionId_key" ON "ReplayAsset"("classSessionId");
CREATE UNIQUE INDEX "ReplayAsset_dailyRecordingId_key" ON "ReplayAsset"("dailyRecordingId");
CREATE INDEX "ReplayAsset_resourceType_status_idx" ON "ReplayAsset"("resourceType", "status");
CREATE INDEX "ReplayAsset_deleteAfterAt_status_idx" ON "ReplayAsset"("deleteAfterAt", "status");
CREATE INDEX "ReplayAsset_dailyRoomName_idx" ON "ReplayAsset"("dailyRoomName");
CREATE INDEX "ReplayAsset_retreatDateId_idx" ON "ReplayAsset"("retreatDateId");
CREATE INDEX "ReplayAsset_smallGroupProgrammeId_idx" ON "ReplayAsset"("smallGroupProgrammeId");
CREATE INDEX "ReplayAsset_smallGroupProgrammeSessionId_idx" ON "ReplayAsset"("smallGroupProgrammeSessionId");

CREATE INDEX "ReplayEntitlement_userId_endsAt_revokedAt_idx" ON "ReplayEntitlement"("userId", "endsAt", "revokedAt");
CREATE INDEX "ReplayEntitlement_replayAssetId_accessType_idx" ON "ReplayEntitlement"("replayAssetId", "accessType");
CREATE UNIQUE INDEX "ReplayEntitlement_replayAssetId_userId_accessType_key" ON "ReplayEntitlement"("replayAssetId", "userId", "accessType");

CREATE INDEX "RefundRule_family_activeFrom_activeUntil_idx" ON "RefundRule"("family", "activeFrom", "activeUntil");
CREATE UNIQUE INDEX "RefundRule_family_code_version_key" ON "RefundRule"("family", "code", "version");

CREATE INDEX "PrivacyRequest_userId_type_createdAt_idx" ON "PrivacyRequest"("userId", "type", "createdAt");
CREATE INDEX "PrivacyRequest_status_createdAt_idx" ON "PrivacyRequest"("status", "createdAt");
CREATE INDEX "PrivacyRequest_actorUserId_createdAt_idx" ON "PrivacyRequest"("actorUserId", "createdAt");

CREATE INDEX "AdminActionLog_actorUserId_createdAt_idx" ON "AdminActionLog"("actorUserId", "createdAt");
CREATE INDEX "AdminActionLog_targetType_targetId_createdAt_idx" ON "AdminActionLog"("targetType", "targetId", "createdAt");
CREATE INDEX "AdminActionLog_actionType_createdAt_idx" ON "AdminActionLog"("actionType", "createdAt");

CREATE INDEX "ScheduledJobRun_jobName_createdAt_idx" ON "ScheduledJobRun"("jobName", "createdAt");
CREATE INDEX "ScheduledJobRun_status_createdAt_idx" ON "ScheduledJobRun"("status", "createdAt");

CREATE UNIQUE INDEX "BillingDisputeCase_stripeDisputeId_key" ON "BillingDisputeCase"("stripeDisputeId");
CREATE INDEX "BillingDisputeCase_userId_status_openedAt_idx" ON "BillingDisputeCase"("userId", "status", "openedAt");
CREATE INDEX "BillingDisputeCase_resourceType_resourceId_status_idx" ON "BillingDisputeCase"("resourceType", "resourceId", "status");
CREATE INDEX "BillingDisputeCase_paymentIntentId_idx" ON "BillingDisputeCase"("paymentIntentId");
CREATE INDEX "BillingDisputeCase_chargeId_idx" ON "BillingDisputeCase"("chargeId");

CREATE INDEX "ParticipantModerationAction_sessionId_createdAt_idx" ON "ParticipantModerationAction"("sessionId", "createdAt");
CREATE INDEX "ParticipantModerationAction_userId_createdAt_idx" ON "ParticipantModerationAction"("userId", "createdAt");
CREATE INDEX "ParticipantModerationAction_actorUserId_createdAt_idx" ON "ParticipantModerationAction"("actorUserId", "createdAt");

CREATE INDEX "SessionParticipantBlock_sessionId_active_idx" ON "SessionParticipantBlock"("sessionId", "active");
CREATE INDEX "SessionParticipantBlock_userId_active_idx" ON "SessionParticipantBlock"("userId", "active");
CREATE UNIQUE INDEX "SessionParticipantBlock_sessionId_userId_active_key" ON "SessionParticipantBlock"("sessionId", "userId", "active");

CREATE INDEX "RetreatDateInstructorAssignment_userId_createdAt_idx" ON "RetreatDateInstructorAssignment"("userId", "createdAt");
CREATE UNIQUE INDEX "RetreatDateInstructorAssignment_retreatDateId_userId_key" ON "RetreatDateInstructorAssignment"("retreatDateId", "userId");

CREATE INDEX "SmallGroupProgrammeInstructorAssignment_userId_createdAt_idx" ON "SmallGroupProgrammeInstructorAssignment"("userId", "createdAt");
CREATE UNIQUE INDEX "SmallGroupProgrammeInstructorAssignment_programmeId_userId_key" ON "SmallGroupProgrammeInstructorAssignment"("programmeId", "userId");

CREATE INDEX "RetreatDate_refundRuleId_idx" ON "RetreatDate"("refundRuleId");
CREATE INDEX "SmallGroupProgramme_refundRuleId_idx" ON "SmallGroupProgramme"("refundRuleId");
CREATE INDEX "SmallGroupProgrammeSession_instructorUserId_startsAt_idx" ON "SmallGroupProgrammeSession"("instructorUserId", "startsAt");

-- Foreign keys
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_smallGroupProgrammeId_fkey" FOREIGN KEY ("smallGroupProgrammeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_smallGroupProgrammeSessionId_fkey" FOREIGN KEY ("smallGroupProgrammeSessionId") REFERENCES "SmallGroupProgrammeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_replayAssetId_fkey" FOREIGN KEY ("replayAssetId") REFERENCES "ReplayAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefundRule" ADD CONSTRAINT "RefundRule_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduledJobRun" ADD CONSTRAINT "ScheduledJobRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingDisputeCase" ADD CONSTRAINT "BillingDisputeCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RetreatDate" ADD CONSTRAINT "RetreatDate_refundRuleId_fkey" FOREIGN KEY ("refundRuleId") REFERENCES "RefundRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatDateInstructorAssignment" ADD CONSTRAINT "RetreatDateInstructorAssignment_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatDateInstructorAssignment" ADD CONSTRAINT "RetreatDateInstructorAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmallGroupProgramme" ADD CONSTRAINT "SmallGroupProgramme_refundRuleId_fkey" FOREIGN KEY ("refundRuleId") REFERENCES "RefundRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmallGroupProgrammeSession" ADD CONSTRAINT "SmallGroupProgrammeSession_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmallGroupProgrammeInstructorAssignment" ADD CONSTRAINT "SmallGroupProgrammeInstructorAssignment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmallGroupProgrammeInstructorAssignment" ADD CONSTRAINT "SmallGroupProgrammeInstructorAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
