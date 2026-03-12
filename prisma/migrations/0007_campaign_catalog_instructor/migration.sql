ALTER TABLE "User"
  ADD COLUMN "instructorProfileEntryId" TEXT;

ALTER TABLE "ClassSession"
  ADD COLUMN "instructorProfileEntryId" TEXT,
  ADD COLUMN "instructorNameSnapshot" TEXT,
  ADD COLUMN "instructorBioSnapshot" TEXT;

ALTER TABLE "EmailCampaign"
  ADD COLUMN "audienceType" TEXT,
  ADD COLUMN "triggeredBy" TEXT,
  ADD COLUMN "contentfulEntryId" TEXT,
  ADD COLUMN "contentfulContentType" TEXT,
  ADD COLUMN "postmarkBatchId" TEXT,
  ADD COLUMN "sentCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "errorSummary" TEXT;

CREATE INDEX "EmailCampaign_contentfulEntryId_contentfulContentType_idx"
  ON "EmailCampaign"("contentfulEntryId", "contentfulContentType");

CREATE TABLE "BillingCatalogItem" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "stripeProductId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "unitAmountPence" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingCatalogItem_key_key" ON "BillingCatalogItem"("key");
CREATE UNIQUE INDEX "BillingCatalogItem_stripePriceId_key" ON "BillingCatalogItem"("stripePriceId");
CREATE INDEX "BillingCatalogItem_key_active_idx" ON "BillingCatalogItem"("key", "active");

CREATE TABLE "PromotionCodeMirror" (
  "id" TEXT NOT NULL,
  "stripeCouponId" TEXT NOT NULL,
  "stripePromotionCodeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amountOffPence" INTEGER,
  "percentOff" DOUBLE PRECISION,
  "currency" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "maxRedemptions" INTEGER,
  "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromotionCodeMirror_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionCodeMirror_stripePromotionCodeId_key" ON "PromotionCodeMirror"("stripePromotionCodeId");
CREATE UNIQUE INDEX "PromotionCodeMirror_code_key" ON "PromotionCodeMirror"("code");
CREATE INDEX "PromotionCodeMirror_active_code_idx" ON "PromotionCodeMirror"("active", "code");
