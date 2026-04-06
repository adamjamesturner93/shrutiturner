-- CreateEnum
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('subscribed', 'unsubscribed');

-- CreateEnum
CREATE TYPE "RetreatDateStatus" AS ENUM ('open', 'sold_out', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "RetreatBookingStatus" AS ENUM ('pending', 'deposit_paid', 'balance_due', 'paid_in_full', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "RetreatPaymentStatus" AS ENUM ('unpaid', 'deposit_paid', 'partially_paid', 'paid_in_full', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "CoachingSupportTier" AS ENUM ('personal_programme', 'coached_plan', 'coaching', 'unsure');

-- CreateEnum
CREATE TYPE "CoachingApplicationStatus" AS ENUM ('submitted', 'under_review', 'follow_up_needed', 'approved', 'declined', 'converted');

-- CreateEnum
CREATE TYPE "CoachingClientStatus" AS ENUM ('application_pending', 'onboarding', 'active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "EverfitConnectionStatus" AS ENUM ('not_started', 'invite_sent', 'connected', 'sync_issue');

-- CreateEnum
CREATE TYPE "CoachingSessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CoachingCheckInCadence" AS ENUM ('weekly', 'monthly');

-- CreateEnum
CREATE TYPE "CoachingCheckInStatus" AS ENUM ('due', 'submitted', 'reviewed', 'overdue');

-- CreateEnum
CREATE TYPE "BlogCommentStatus" AS ENUM ('visible', 'hidden', 'deleted');

-- CreateEnum
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('new', 'archived');

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'subscribed',
    "source" TEXT,
    "token" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatDate" (
    "id" TEXT NOT NULL,
    "externalDateId" TEXT NOT NULL,
    "retreatSlug" TEXT NOT NULL,
    "retreatTitleSnapshot" TEXT NOT NULL,
    "retreatLocationSnapshot" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "RetreatDateStatus" NOT NULL DEFAULT 'open',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "pricePence" INTEGER NOT NULL,
    "depositAmountPence" INTEGER NOT NULL,
    "singleRoomSupplementPence" INTEGER NOT NULL DEFAULT 0,
    "balanceDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetreatDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatBooking" (
    "id" TEXT NOT NULL,
    "retreatDateId" TEXT NOT NULL,
    "purchaserUserId" TEXT,
    "attendeeUserId" TEXT,
    "purchaserFirstName" TEXT NOT NULL,
    "purchaserLastName" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "attendeeFirstName" TEXT NOT NULL,
    "attendeeLastName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "dietaryRequirements" TEXT,
    "medicalConditions" TEXT,
    "mobilityNeeds" TEXT,
    "singleRoomRequested" BOOLEAN NOT NULL DEFAULT false,
    "roomType" TEXT,
    "acceptedTermsVersion" TEXT,
    "acceptedHealthWaiverVersion" TEXT,
    "acceptedHealthDataVersion" TEXT,
    "totalPricePence" INTEGER NOT NULL,
    "depositAmountPence" INTEGER NOT NULL,
    "balanceAmountPence" INTEGER NOT NULL,
    "depositPaidPence" INTEGER NOT NULL DEFAULT 0,
    "balancePaidPence" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "paymentStatus" "RetreatPaymentStatus" NOT NULL DEFAULT 'unpaid',
    "bookingStatus" "RetreatBookingStatus" NOT NULL DEFAULT 'pending',
    "stripeDepositSessionId" TEXT,
    "stripeBalanceSessionId" TEXT,
    "stripeDepositPaymentIntentId" TEXT,
    "stripeBalancePaymentIntentId" TEXT,
    "balancePaymentUrlToken" TEXT,
    "balanceDueAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depositPaidAt" TIMESTAMP(3),
    "balancePaidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetreatBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "applicantFirstName" TEXT NOT NULL,
    "applicantLastName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "tier" "CoachingSupportTier" NOT NULL,
    "answersJson" JSONB NOT NULL,
    "hasMoveWellMembershipSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "isExistingCoachingClientSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "coachingAgreementVersion" TEXT,
    "coachingAgreementAcceptedAt" TIMESTAMP(3) NOT NULL,
    "status" "CoachingApplicationStatus" NOT NULL DEFAULT 'submitted',
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "tier" "CoachingSupportTier" NOT NULL,
    "status" "CoachingClientStatus" NOT NULL DEFAULT 'onboarding',
    "includesMoveWellMembership" BOOLEAN NOT NULL DEFAULT false,
    "everfitConnectionStatus" "EverfitConnectionStatus" NOT NULL DEFAULT 'not_started',
    "onboardingChecklistJson" JSONB,
    "nextCheckInDueAt" TIMESTAMP(3),
    "latestCoachResponseSummary" TEXT,
    "startDate" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "sessionType" TEXT NOT NULL DEFAULT 'coaching',
    "status" "CoachingSessionStatus" NOT NULL DEFAULT 'scheduled',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingCheckIn" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "cadence" "CoachingCheckInCadence" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "status" "CoachingCheckInStatus" NOT NULL DEFAULT 'due',
    "answersJson" JSONB,
    "coachResponseSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "postSlug" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "BlogCommentStatus" NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogReaction" (
    "id" TEXT NOT NULL,
    "postSlug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "conditions" TEXT,
    "howFound" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactSubmissionStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_userId_key" ON "NewsletterSubscriber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_token_key" ON "NewsletterSubscriber"("token");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_updatedAt_idx" ON "NewsletterSubscriber"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatDate_externalDateId_key" ON "RetreatDate"("externalDateId");

-- CreateIndex
CREATE INDEX "RetreatDate_retreatSlug_startsAt_idx" ON "RetreatDate"("retreatSlug", "startsAt");

-- CreateIndex
CREATE INDEX "RetreatDate_status_startsAt_idx" ON "RetreatDate"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_stripeDepositSessionId_key" ON "RetreatBooking"("stripeDepositSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_stripeBalanceSessionId_key" ON "RetreatBooking"("stripeBalanceSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_balancePaymentUrlToken_key" ON "RetreatBooking"("balancePaymentUrlToken");

-- CreateIndex
CREATE INDEX "RetreatBooking_retreatDateId_bookingStatus_idx" ON "RetreatBooking"("retreatDateId", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_purchaserUserId_bookingStatus_idx" ON "RetreatBooking"("purchaserUserId", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_attendeeUserId_bookingStatus_idx" ON "RetreatBooking"("attendeeUserId", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_purchaserEmail_bookingStatus_idx" ON "RetreatBooking"("purchaserEmail", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_attendeeEmail_bookingStatus_idx" ON "RetreatBooking"("attendeeEmail", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_paymentStatus_balanceDueAt_idx" ON "RetreatBooking"("paymentStatus", "balanceDueAt");

-- CreateIndex
CREATE INDEX "CoachingApplication_status_createdAt_idx" ON "CoachingApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CoachingApplication_tier_createdAt_idx" ON "CoachingApplication"("tier", "createdAt");

-- CreateIndex
CREATE INDEX "CoachingApplication_userId_createdAt_idx" ON "CoachingApplication"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachingApplication_applicantEmail_createdAt_idx" ON "CoachingApplication"("applicantEmail", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingClientProfile_userId_key" ON "CoachingClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingClientProfile_applicationId_key" ON "CoachingClientProfile"("applicationId");

-- CreateIndex
CREATE INDEX "CoachingClientProfile_status_updatedAt_idx" ON "CoachingClientProfile"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CoachingClientProfile_tier_updatedAt_idx" ON "CoachingClientProfile"("tier", "updatedAt");

-- CreateIndex
CREATE INDEX "CoachingSession_clientProfileId_startsAt_idx" ON "CoachingSession"("clientProfileId", "startsAt");

-- CreateIndex
CREATE INDEX "CoachingSession_status_startsAt_idx" ON "CoachingSession"("status", "startsAt");

-- CreateIndex
CREATE INDEX "CoachingCheckIn_clientProfileId_dueAt_idx" ON "CoachingCheckIn"("clientProfileId", "dueAt");

-- CreateIndex
CREATE INDEX "CoachingCheckIn_status_dueAt_idx" ON "CoachingCheckIn"("status", "dueAt");

-- CreateIndex
CREATE INDEX "BlogComment_postSlug_status_createdAt_idx" ON "BlogComment"("postSlug", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_authorUserId_createdAt_idx" ON "BlogComment"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- CreateIndex
CREATE INDEX "BlogReaction_postSlug_createdAt_idx" ON "BlogReaction"("postSlug", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReaction_postSlug_userId_key" ON "BlogReaction"("postSlug", "userId");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_email_createdAt_idx" ON "ContactSubmission"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_attendeeUserId_fkey" FOREIGN KEY ("attendeeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingApplication" ADD CONSTRAINT "CoachingApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingClientProfile" ADD CONSTRAINT "CoachingClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingClientProfile" ADD CONSTRAINT "CoachingClientProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CoachingApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "CoachingClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingCheckIn" ADD CONSTRAINT "CoachingCheckIn_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "CoachingClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
