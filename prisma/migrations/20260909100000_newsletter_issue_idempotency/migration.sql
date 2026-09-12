ALTER TABLE "EmailCampaign"
ADD COLUMN "sourceIssueKey" TEXT,
ADD COLUMN "sourceVersion" TEXT,
ADD COLUMN "contentSnapshotJson" JSONB,
ADD COLUMN "audiencePreparedAt" TIMESTAMP(3);

ALTER TABLE "EmailDelivery"
ADD COLUMN "campaignRecipientKey" TEXT;

CREATE UNIQUE INDEX "EmailCampaign_sourceIssueKey_key"
ON "EmailCampaign"("sourceIssueKey");

CREATE UNIQUE INDEX "EmailDelivery_campaignRecipientKey_key"
ON "EmailDelivery"("campaignRecipientKey");
