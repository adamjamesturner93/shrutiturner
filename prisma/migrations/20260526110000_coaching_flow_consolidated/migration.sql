-- Consolidated coaching flow changes that were local-only before production deployment.

-- Client-facing decisions, wait-list state and coaching billing/setup tracking.
ALTER TYPE "CoachingApplicationStatus" ADD VALUE IF NOT EXISTS 'waitlisted';
ALTER TYPE "CoachingApplicationStatus" ADD VALUE IF NOT EXISTS 'withdrawn';

ALTER TABLE "CoachingApplication"
  ADD COLUMN "decisionReason" TEXT,
  ADD COLUMN "waitlistedAt" TIMESTAMP(3),
  ADD COLUMN "waitlistLeftAt" TIMESTAMP(3);

ALTER TABLE "CoachingClientProfile"
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "billingCancellationRequestedAt" TIMESTAMP(3),
  ADD COLUMN "billingFinalPaymentAt" TIMESTAMP(3),
  ADD COLUMN "billingEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CoachingClientProfile_stripeSubscriptionId_key"
  ON "CoachingClientProfile"("stripeSubscriptionId");

CREATE INDEX "CoachingApplication_status_waitlistedAt_idx"
  ON "CoachingApplication"("status", "waitlistedAt");

-- Client-confirmed coaching package changes.
CREATE TYPE "CoachingPackageChangeStatus" AS ENUM (
  'pending_client_confirmation',
  'applied',
  'cancelled'
);

CREATE TYPE "CoachingPackageChangeEffectiveMode" AS ENUM (
  'next_invoice',
  'immediate',
  'manual'
);

CREATE TABLE "CoachingPackageChangeRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "fromTier" "CoachingSupportTier" NOT NULL,
  "toTier" "CoachingSupportTier" NOT NULL,
  "fromOfferKey" TEXT,
  "toOfferKey" TEXT NOT NULL,
  "effectiveMode" "CoachingPackageChangeEffectiveMode" NOT NULL DEFAULT 'next_invoice',
  "status" "CoachingPackageChangeStatus" NOT NULL DEFAULT 'pending_client_confirmation',
  "note" TEXT,
  "stripeSubscriptionId" TEXT,
  "clientConfirmedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CoachingPackageChangeRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CoachingPackageChangeRequest"
ADD CONSTRAINT "CoachingPackageChangeRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoachingPackageChangeRequest"
ADD CONSTRAINT "CoachingPackageChangeRequest_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CoachingPackageChangeRequest"
ADD CONSTRAINT "CoachingPackageChangeRequest_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "CoachingClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CoachingPackageChangeRequest_userId_status_createdAt_idx"
ON "CoachingPackageChangeRequest"("userId", "status", "createdAt");

CREATE INDEX "CoachingPackageChangeRequest_profileId_status_createdAt_idx"
ON "CoachingPackageChangeRequest"("profileId", "status", "createdAt");

CREATE INDEX "CoachingPackageChangeRequest_toOfferKey_status_idx"
ON "CoachingPackageChangeRequest"("toOfferKey", "status");
