CREATE TYPE "MembershipDunningStatus" AS ENUM ('open', 'suspended', 'recovered', 'cancelled');

CREATE TYPE "BillingRefundStatus" AS ENUM ('pending', 'succeeded', 'failed', 'credited');

ALTER TYPE "SubscriptionComplianceEventKind" ADD VALUE 'payment_failure_notice';
ALTER TYPE "SubscriptionComplianceEventKind" ADD VALUE 'payment_recovery_notice';

CREATE TABLE "MembershipDunningCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" "MembershipDunningStatus" NOT NULL DEFAULT 'open',
    "stripeInvoiceId" TEXT,
    "amountDuePence" INTEGER NOT NULL DEFAULT 0,
    "invoiceUrl" TEXT,
    "firstFailedAt" TIMESTAMP(3) NOT NULL,
    "lastFailedAt" TIMESTAMP(3) NOT NULL,
    "graceEndsAt" TIMESTAMP(3) NOT NULL,
    "day0NoticeSentAt" TIMESTAMP(3),
    "day3ReminderSentAt" TIMESTAMP(3),
    "day6ReminderSentAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "graceExtendedUntil" TIMESTAMP(3),
    "manualExtensionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipDunningCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingRefund" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "status" "BillingRefundStatus" NOT NULL DEFAULT 'pending',
    "amountPence" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refundedAsCredit" BOOLEAN NOT NULL DEFAULT false,
    "stripeRefundId" TEXT,
    "stripeInvoiceId" TEXT,
    "paymentIntentId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingRefund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MembershipDunningCase_userId_status_idx" ON "MembershipDunningCase"("userId", "status");
CREATE INDEX "MembershipDunningCase_membershipId_status_idx" ON "MembershipDunningCase"("membershipId", "status");
CREATE INDEX "MembershipDunningCase_status_graceEndsAt_idx" ON "MembershipDunningCase"("status", "graceEndsAt");
CREATE INDEX "MembershipDunningCase_stripeInvoiceId_idx" ON "MembershipDunningCase"("stripeInvoiceId");

CREATE UNIQUE INDEX "BillingRefund_stripeRefundId_key" ON "BillingRefund"("stripeRefundId");
CREATE INDEX "BillingRefund_userId_createdAt_idx" ON "BillingRefund"("userId", "createdAt");
CREATE INDEX "BillingRefund_membershipId_createdAt_idx" ON "BillingRefund"("membershipId", "createdAt");
CREATE INDEX "BillingRefund_stripeInvoiceId_idx" ON "BillingRefund"("stripeInvoiceId");

ALTER TABLE "MembershipDunningCase" ADD CONSTRAINT "MembershipDunningCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipDunningCase" ADD CONSTRAINT "MembershipDunningCase_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "MembershipSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "MembershipSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
