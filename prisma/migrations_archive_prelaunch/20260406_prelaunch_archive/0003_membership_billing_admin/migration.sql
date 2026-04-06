-- Enums
CREATE TYPE "MembershipPlan" AS ENUM ('steady', 'committed', 'unlimited', 'instructor');
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'paused', 'cancelled', 'expired', 'past_due');
CREATE TYPE "CreditEntryType" AS ENUM (
  'purchase',
  'booking_use',
  'booking_refund',
  'admin_adjustment',
  'referral_applied',
  'promo'
);
CREATE TYPE "BillingEventStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');

-- User extensions
ALTER TABLE "User"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "isCoachingClient" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "adminNotes" TEXT;

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- Membership subscriptions
CREATE TABLE "MembershipSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" "MembershipPlan" NOT NULL,
  "status" "MembershipStatus" NOT NULL,
  "pricePence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "classesPerWeek" INTEGER NOT NULL,
  "classesUsedThisWeek" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "renewsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "stripeCurrentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipSubscription_stripeSubscriptionId_key"
  ON "MembershipSubscription"("stripeSubscriptionId");
CREATE INDEX "MembershipSubscription_userId_status_idx"
  ON "MembershipSubscription"("userId", "status");
CREATE INDEX "MembershipSubscription_stripeSubscriptionId_idx"
  ON "MembershipSubscription"("stripeSubscriptionId");

ALTER TABLE "MembershipSubscription"
  ADD CONSTRAINT "MembershipSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Credit ledger
CREATE TABLE "CreditLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "CreditEntryType" NOT NULL,
  "description" TEXT NOT NULL,
  "sourceRef" TEXT,
  "expiresAt" TIMESTAMP(3),
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeInvoiceId" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreditLedgerEntry_userId_createdAt_idx" ON "CreditLedgerEntry"("userId", "createdAt");
CREATE INDEX "CreditLedgerEntry_createdByUserId_idx" ON "CreditLedgerEntry"("createdByUserId");
CREATE INDEX "CreditLedgerEntry_stripeCheckoutSessionId_idx" ON "CreditLedgerEntry"("stripeCheckoutSessionId");

ALTER TABLE "CreditLedgerEntry"
  ADD CONSTRAINT "CreditLedgerEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditLedgerEntry"
  ADD CONSTRAINT "CreditLedgerEntry_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Billing events
CREATE TABLE "BillingEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "providerEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" "BillingEventStatus" NOT NULL DEFAULT 'received',
  "payloadJson" JSONB NOT NULL,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");
CREATE INDEX "BillingEvent_provider_type_idx" ON "BillingEvent"("provider", "type");
CREATE INDEX "BillingEvent_status_createdAt_idx" ON "BillingEvent"("status", "createdAt");

ALTER TABLE "BillingEvent"
  ADD CONSTRAINT "BillingEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend referral ledger for applied discount linking
ALTER TABLE "ReferralLedgerEntry"
  ADD COLUMN "appliedToBillingEventId" TEXT,
  ADD COLUMN "stripeInvoiceId" TEXT,
  ADD COLUMN "stripeCheckoutSessionId" TEXT;

CREATE INDEX "ReferralLedgerEntry_appliedToBillingEventId_idx"
  ON "ReferralLedgerEntry"("appliedToBillingEventId");

ALTER TABLE "ReferralLedgerEntry"
  ADD CONSTRAINT "ReferralLedgerEntry_appliedToBillingEventId_fkey"
  FOREIGN KEY ("appliedToBillingEventId") REFERENCES "BillingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
