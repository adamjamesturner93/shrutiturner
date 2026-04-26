-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('queued', 'sending', 'sent', 'failed', 'dead_letter');

-- CreateEnum
CREATE TYPE "EmailDeliveryAttemptStatus" AS ENUM ('started', 'sent', 'failed');

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT,
    "templateKey" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'transactional',
    "provider" TEXT NOT NULL DEFAULT 'postmark',
    "subject" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "messageStream" TEXT,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'queued',
    "retryable" BOOLEAN NOT NULL DEFAULT true,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "payloadJson" JSONB NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "EmailDeliveryAttemptStatus" NOT NULL DEFAULT 'started',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "responseJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EmailEvent"
ADD COLUMN     "deliveryId" TEXT;

-- CreateIndex
CREATE INDEX "EmailDelivery_status_nextRetryAt_idx" ON "EmailDelivery"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_userId_createdAt_idx" ON "EmailDelivery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_templateKey_createdAt_idx" ON "EmailDelivery"("templateKey", "createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_providerMessageId_idx" ON "EmailDelivery"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDeliveryAttempt_deliveryId_attemptNumber_key" ON "EmailDeliveryAttempt"("deliveryId", "attemptNumber");

-- CreateIndex
CREATE INDEX "EmailDeliveryAttempt_deliveryId_attemptNumber_idx" ON "EmailDeliveryAttempt"("deliveryId", "attemptNumber");

-- CreateIndex
CREATE INDEX "EmailEvent_deliveryId_eventAt_idx" ON "EmailEvent"("deliveryId", "eventAt");

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDeliveryAttempt" ADD CONSTRAINT "EmailDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
