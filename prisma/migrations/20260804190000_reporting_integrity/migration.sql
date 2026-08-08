-- Additive reporting integrity changes for actionable email failures and
-- Stripe-backed 1:1 revenue projections.

ALTER TABLE "EmailDelivery"
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedByUserId" TEXT,
  ADD COLUMN "resolutionCode" TEXT,
  ADD COLUMN "resolutionNote" TEXT;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "EmailDelivery_status_resolvedAt_nextRetryAt_idx"
  ON "EmailDelivery"("status", "resolvedAt", "nextRetryAt");

CREATE INDEX "EmailDelivery_resolvedByUserId_resolvedAt_idx"
  ON "EmailDelivery"("resolvedByUserId", "resolvedAt");

CREATE TABLE "CoachingSubscriptionProjection" (
  "id" TEXT NOT NULL,
  "coachingClientProfileId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripePriceId" TEXT,
  "status" TEXT NOT NULL,
  "unitAmountPence" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "interval" TEXT NOT NULL,
  "intervalCount" INTEGER NOT NULL DEFAULT 1,
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "cancelAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "lastStripeEventAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CoachingSubscriptionProjection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachingSubscriptionProjection_coachingClientProfileId_key"
  ON "CoachingSubscriptionProjection"("coachingClientProfileId");

CREATE UNIQUE INDEX "CoachingSubscriptionProjection_stripeSubscriptionId_key"
  ON "CoachingSubscriptionProjection"("stripeSubscriptionId");

CREATE INDEX "CoachingSubscriptionProjection_status_currentPeriodEnd_idx"
  ON "CoachingSubscriptionProjection"("status", "currentPeriodEnd");

CREATE INDEX "CoachingSubscriptionProjection_stripeCustomerId_idx"
  ON "CoachingSubscriptionProjection"("stripeCustomerId");

ALTER TABLE "CoachingSubscriptionProjection"
  ADD CONSTRAINT "CoachingSubscriptionProjection_coachingClientProfileId_fkey"
  FOREIGN KEY ("coachingClientProfileId") REFERENCES "CoachingClientProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
