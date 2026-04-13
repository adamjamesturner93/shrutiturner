ALTER TYPE "NewsletterSubscriberStatus" ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE "NewsletterSubscriber"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "consentedAt" TIMESTAMP(3),
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

ALTER TABLE "NewsletterSubscriber"
ALTER COLUMN "status" SET DEFAULT 'pending';

UPDATE "NewsletterSubscriber"
SET
  "consentedAt" = COALESCE("subscribedAt", "createdAt"),
  "verifiedAt" = CASE
    WHEN "status" = 'subscribed' THEN COALESCE("subscribedAt", "createdAt")
    ELSE NULL
  END
WHERE "consentedAt" IS NULL
   OR ("status" = 'subscribed' AND "verifiedAt" IS NULL);

CREATE TABLE "NewsletterSignupEvent" (
    "id" TEXT NOT NULL,
    "hashedEmail" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSignupEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsletterSubscriber_verificationTokenHash_idx" ON "NewsletterSubscriber"("verificationTokenHash");
CREATE INDEX "NewsletterSubscriber_verifiedAt_status_idx" ON "NewsletterSubscriber"("verifiedAt", "status");
CREATE INDEX "NewsletterSignupEvent_eventType_createdAt_idx" ON "NewsletterSignupEvent"("eventType", "createdAt");
CREATE INDEX "NewsletterSignupEvent_source_createdAt_idx" ON "NewsletterSignupEvent"("source", "createdAt");
CREATE INDEX "NewsletterSignupEvent_hashedEmail_createdAt_idx" ON "NewsletterSignupEvent"("hashedEmail", "createdAt");
