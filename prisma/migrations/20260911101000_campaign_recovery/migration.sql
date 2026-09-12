ALTER TABLE "EmailCampaign"
  ADD COLUMN "audienceSnapshotJson" JSONB,
  ADD COLUMN "processingToken" TEXT,
  ADD COLUMN "processingLeaseExpiresAt" TIMESTAMP(3);
