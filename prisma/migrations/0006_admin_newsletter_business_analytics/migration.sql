CREATE TABLE "BillingMetricDaily" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "cashCollectedPence" INTEGER NOT NULL DEFAULT 0,
  "failedPaymentsCount" INTEGER NOT NULL DEFAULT 0,
  "activeMembersCount" INTEGER NOT NULL DEFAULT 0,
  "mrrPence" INTEGER NOT NULL DEFAULT 0,
  "churnedMembersCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingMetricDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingMetricDaily_date_key" ON "BillingMetricDaily"("date");

CREATE TABLE "EmailCampaign" (
  "id" TEXT NOT NULL,
  "providerCampaignId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "stream" TEXT,
  "status" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailCampaign_providerCampaignId_key" ON "EmailCampaign"("providerCampaignId");
CREATE INDEX "EmailCampaign_status_sentAt_idx" ON "EmailCampaign"("status", "sentAt");

CREATE TABLE "EmailEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'postmark',
  "providerEventId" TEXT NOT NULL,
  "messageId" TEXT,
  "type" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "campaignId" TEXT,
  "eventAt" TIMESTAMP(3) NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailEvent_providerEventId_key" ON "EmailEvent"("providerEventId");
CREATE INDEX "EmailEvent_email_eventAt_idx" ON "EmailEvent"("email", "eventAt");
CREATE INDEX "EmailEvent_type_eventAt_idx" ON "EmailEvent"("type", "eventAt");
CREATE INDEX "EmailEvent_campaignId_eventAt_idx" ON "EmailEvent"("campaignId", "eventAt");
CREATE INDEX "EmailEvent_userId_eventAt_idx" ON "EmailEvent"("userId", "eventAt");

CREATE TABLE "EmailAudienceSnapshot" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "newsletterCount" INTEGER NOT NULL DEFAULT 0,
  "blogCount" INTEGER NOT NULL DEFAULT 0,
  "bothCount" INTEGER NOT NULL DEFAULT 0,
  "neitherCount" INTEGER NOT NULL DEFAULT 0,
  "unsubscribes30d" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailAudienceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailAudienceSnapshot_date_key" ON "EmailAudienceSnapshot"("date");

ALTER TABLE "EmailEvent"
  ADD CONSTRAINT "EmailEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailEvent"
  ADD CONSTRAINT "EmailEvent_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
