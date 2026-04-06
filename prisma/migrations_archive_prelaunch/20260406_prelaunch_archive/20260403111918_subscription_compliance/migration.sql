-- CreateEnum
CREATE TYPE "SubscriptionComplianceEventKind" AS ENUM ('disclosure_acknowledged', 'trial_reminder', 'monthly_reminder', 'annual_renewal_reminder', 'renewal_cooling_off_notice', 'end_of_contract_notice', 'membership_cancelled', 'cooling_off_cancellation', 'refund_issued');

-- DropIndex
DROP INDEX "User_referredByUserId_idx";

-- AlterTable
ALTER TABLE "ClassOperationalSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClassTimetableRule" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GiftPurchase" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MembershipSubscription" ADD COLUMN     "disclosureAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "disclosureVersion" TEXT,
ADD COLUMN     "initialCoolingOffEndsAt" TIMESTAMP(3),
ADD COLUMN     "latestInvoiceAmountPence" INTEGER,
ADD COLUMN     "latestInvoiceId" TEXT,
ADD COLUMN     "latestInvoicePaidAt" TIMESTAMP(3),
ADD COLUMN     "renewalCoolingOffEndsAt" TIMESTAMP(3),
ADD COLUMN     "renewalCoolingOffKind" TEXT,
ADD COLUMN     "renewalCoolingOffStartedAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RetreatRoomOption" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SmallGroupProgramme" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SmallGroupProgrammeEnrollment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SmallGroupProgrammeSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ThemedWeek" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SubscriptionComplianceEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "kind" "SubscriptionComplianceEventKind" NOT NULL,
    "status" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'app',
    "summary" TEXT NOT NULL,
    "metadataJson" JSONB,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionComplianceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_userId_eventAt_idx" ON "SubscriptionComplianceEvent"("userId", "eventAt");

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_membershipId_eventAt_idx" ON "SubscriptionComplianceEvent"("membershipId", "eventAt");

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_kind_eventAt_idx" ON "SubscriptionComplianceEvent"("kind", "eventAt");

-- AddForeignKey
ALTER TABLE "SubscriptionComplianceEvent" ADD CONSTRAINT "SubscriptionComplianceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionComplianceEvent" ADD CONSTRAINT "SubscriptionComplianceEvent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "MembershipSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
