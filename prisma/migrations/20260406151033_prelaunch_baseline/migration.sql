-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'admin', 'member', 'owner_admin');

-- CreateEnum
CREATE TYPE "AcceptanceType" AS ENUM ('terms', 'health_waiver', 'health_data', 'recording_notice', 'immediate_start', 'marketing');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('injury_concern', 'participant_removal', 'unsafe_behaviour', 'safeguarding_issue', 'technical_safeguarding_issue');

-- CreateEnum
CREATE TYPE "ReplayAssetStatus" AS ENUM ('processing', 'ready', 'delete_pending', 'deleted', 'sync_failed', 'delete_failed');

-- CreateEnum
CREATE TYPE "ReplayEntitlementAccessType" AS ENUM ('participant', 'assigned_instructor');

-- CreateEnum
CREATE TYPE "ReferralEventStatus" AS ENUM ('pending_signup', 'pending_qualification', 'qualified', 'rewarded', 'void');

-- CreateEnum
CREATE TYPE "ReferralLedgerType" AS ENUM ('reward', 'adjustment', 'applied');

-- CreateEnum
CREATE TYPE "MembershipPlan" AS ENUM ('movewell', 'instructor');

-- CreateEnum
CREATE TYPE "MembershipBillingInterval" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'paused', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "SubscriptionComplianceEventKind" AS ENUM ('disclosure_acknowledged', 'trial_reminder', 'monthly_reminder', 'annual_renewal_reminder', 'renewal_cooling_off_notice', 'end_of_contract_notice', 'membership_cancelled', 'cooling_off_cancellation', 'refund_issued');

-- CreateEnum
CREATE TYPE "CreditEntryType" AS ENUM ('purchase', 'booking_use', 'booking_refund', 'admin_adjustment', 'referral_applied', 'promo');

-- CreateEnum
CREATE TYPE "ClassSessionStatus" AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ClassRoomSetupStatus" AS ENUM ('pending', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "ClassBookingStatus" AS ENUM ('booked', 'cancelled', 'attended', 'no_show');

-- CreateEnum
CREATE TYPE "BookingEntitlementType" AS ENUM ('membership', 'credit', 'manual');

-- CreateEnum
CREATE TYPE "ClassWaitlistStatus" AS ENUM ('waiting', 'promoted', 'removed');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('daily', 'manual');

-- CreateEnum
CREATE TYPE "ClassAttendanceEventType" AS ENUM ('joined', 'left');

-- CreateEnum
CREATE TYPE "PostClassFeeling" AS ENUM ('great', 'good', 'okay', 'tough', 'too_much');

-- CreateEnum
CREATE TYPE "HealthDeclarationStatus" AS ENUM ('none_declared', 'context_declared');

-- CreateEnum
CREATE TYPE "ClassSessionEventType" AS ENUM ('booking_created', 'booking_cancelled', 'waitlist_joined', 'waitlist_promoted', 'session_cancelled');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('received', 'processed', 'ignored', 'failed');

-- CreateEnum
CREATE TYPE "BillingDisputeStatus" AS ENUM ('open', 'warning_closed', 'won', 'lost');

-- CreateEnum
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('subscribed', 'unsubscribed');

-- CreateEnum
CREATE TYPE "RetreatDateStatus" AS ENUM ('open', 'sold_out', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "RetreatBookingStatus" AS ENUM ('pending', 'deposit_paid', 'balance_due', 'paid_in_full', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "RetreatPaymentStatus" AS ENUM ('unpaid', 'deposit_paid', 'partially_paid', 'paid_in_full', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('retreat', 'small_group');

-- CreateEnum
CREATE TYPE "GiftPurchaseStatus" AS ENUM ('pending_payment', 'purchased', 'redeemed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "GiftDeliveryTarget" AS ENUM ('recipient', 'buyer');

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

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('export', 'deletion');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('pending', 'completed', 'blocked', 'failed');

-- CreateEnum
CREATE TYPE "ScheduledJobRunStatus" AS ENUM ('started', 'succeeded', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ScheduledJobTriggerType" AS ENUM ('cron', 'manual', 'webhook');

-- CreateEnum
CREATE TYPE "ParticipantModerationActionType" AS ENUM ('removed', 'block_reentry', 'unblock_reentry');

-- CreateEnum
CREATE TYPE "SmallGroupProgrammeStatus" AS ENUM ('draft', 'upcoming', 'open', 'in_progress', 'completed', 'waitlist', 'archived');

-- CreateEnum
CREATE TYPE "SmallGroupSessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SmallGroupEnrollmentStatus" AS ENUM ('pending_payment', 'active', 'completed', 'cancelled', 'waitlist');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "ethnicity" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "hasAgreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "hasAgreedToHealth" BOOLEAN NOT NULL DEFAULT false,
    "termsAgreedAt" TIMESTAMP(3),
    "healthAgreedAt" TIMESTAMP(3),
    "acceptedTermsVersion" TEXT,
    "acceptedHealthWaiverVersion" TEXT,
    "hasConsentedToHealthData" BOOLEAN NOT NULL DEFAULT false,
    "acceptedHealthDataConsentVersion" TEXT,
    "healthDataConsentedAt" TIMESTAMP(3),
    "heardAboutSource" TEXT,
    "heardAboutDetail" TEXT,
    "stripeCustomerId" TEXT,
    "isCoachingClient" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "referralCode" TEXT,
    "instructorProfileEntryId" TEXT,
    "referredByUserId" TEXT,
    "authCode" TEXT,
    "authCodeExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocumentVersion" (
    "id" TEXT NOT NULL,
    "type" "AcceptanceType" NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "contentSource" TEXT NOT NULL DEFAULT 'app',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedByUserId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptanceEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "AcceptanceType" NOT NULL,
    "policyVersionId" TEXT,
    "version" TEXT NOT NULL,
    "acceptanceSurface" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcceptanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLog" (
    "id" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "sessionId" TEXT,
    "affectedUserId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "followUpNotes" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayAsset" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "classSessionId" TEXT,
    "retreatDateId" TEXT,
    "smallGroupProgrammeId" TEXT,
    "smallGroupProgrammeSessionId" TEXT,
    "dailyRoomName" TEXT,
    "dailyRecordingId" TEXT,
    "playbackUrl" TEXT,
    "status" "ReplayAssetStatus" NOT NULL DEFAULT 'processing',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deleteAfterAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "recordingConfigSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplayAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayEntitlement" (
    "id" TEXT NOT NULL,
    "replayAssetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessType" "ReplayEntitlementAccessType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "complianceSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplayEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRule" (
    "id" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "configJson" JSONB NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'pending',
    "summaryChecksum" TEXT,
    "summaryJson" JSONB,
    "blockReason" TEXT,
    "generatedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reason" TEXT,
    "oldValueJson" JSONB,
    "newValueJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "triggerType" "ScheduledJobTriggerType" NOT NULL,
    "actorUserId" TEXT,
    "status" "ScheduledJobRunStatus" NOT NULL DEFAULT 'started',
    "countersJson" JSONB,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDisputeCase" (
    "id" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "userId" TEXT,
    "paymentIntentId" TEXT,
    "chargeId" TEXT,
    "purchaserEmail" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "status" "BillingDisputeStatus" NOT NULL DEFAULT 'open',
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingDisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantModerationAction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actionType" "ParticipantModerationActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipantBlock" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blockedUntil" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionParticipantBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCodeSnapshot" TEXT NOT NULL,
    "status" "ReferralEventStatus" NOT NULL DEFAULT 'pending_signup',
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "giftGrantedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "type" "ReferralLedgerType" NOT NULL,
    "description" TEXT NOT NULL,
    "appliedToBillingEventId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "MembershipPlan" NOT NULL,
    "billingInterval" "MembershipBillingInterval" NOT NULL DEFAULT 'monthly',
    "status" "MembershipStatus" NOT NULL,
    "pricePence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "classesPerWeek" INTEGER NOT NULL,
    "classesUsedThisWeek" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "disclosureVersion" TEXT,
    "disclosureAcceptedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "initialCoolingOffEndsAt" TIMESTAMP(3),
    "renewalCoolingOffStartedAt" TIMESTAMP(3),
    "renewalCoolingOffEndsAt" TIMESTAMP(3),
    "renewalCoolingOffKind" TEXT,
    "latestInvoiceId" TEXT,
    "latestInvoiceAmountPence" INTEGER,
    "latestInvoicePaidAt" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "complianceSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "BillingMetricDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cashCollectedPence" INTEGER NOT NULL DEFAULT 0,
    "failedPaymentsCount" INTEGER NOT NULL DEFAULT 0,
    "activeMembersCount" INTEGER NOT NULL DEFAULT 0,
    "mrrPence" INTEGER NOT NULL DEFAULT 0,
    "churnedMembersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingMetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "declarationStatus" "HealthDeclarationStatus" NOT NULL DEFAULT 'none_declared',
    "tracksFlareCheckIns" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT NOT NULL DEFAULT '',
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthConditionSelection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "conditionKey" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthConditionSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfileRevision" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthProfileRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "userId" TEXT NOT NULL,
    "classReminders" BOOLEAN NOT NULL DEFAULT true,
    "scheduleUpdates" BOOLEAN NOT NULL DEFAULT true,
    "programAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ClassTimetableRule" (
    "id" TEXT NOT NULL,
    "classDefinitionSlug" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAtLocal" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "defaultCapacity" INTEGER NOT NULL,
    "instructorUserId" TEXT NOT NULL,
    "instructorProfileEntryId" TEXT,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTimetableRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTimetableExclusion" (
    "id" TEXT NOT NULL,
    "timetableRuleId" TEXT NOT NULL,
    "localDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTimetableExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "classDefinitionSlug" TEXT NOT NULL,
    "timetableRuleId" TEXT,
    "localDate" TIMESTAMP(3),
    "generationKey" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "typeSnapshot" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "levelSnapshot" TEXT NOT NULL,
    "startsAtUtc" TIMESTAMP(3) NOT NULL,
    "endsAtUtc" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "capacity" INTEGER NOT NULL,
    "status" "ClassSessionStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "instructorUserId" TEXT NOT NULL,
    "instructorProfileEntryId" TEXT,
    "instructorNameSnapshot" TEXT,
    "instructorBioSnapshot" TEXT,
    "roomSetupStatus" "ClassRoomSetupStatus" NOT NULL DEFAULT 'pending',
    "roomSetupError" TEXT,
    "dailyRoomName" TEXT,
    "dailyRoomUrl" TEXT,
    "communityModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "communityModeUpdatedAt" TIMESTAMP(3),
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingScope" TEXT,
    "replayAvailable" BOOLEAN NOT NULL DEFAULT false,
    "replayAccessDurationDays" INTEGER,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
    "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "reminderProcessedAt" TIMESTAMP(3),
    "autoCancelledForNoAttendanceAt" TIMESTAMP(3),
    "firstSignupInstructorEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClassBookingStatus" NOT NULL DEFAULT 'booked',
    "entitlementType" "BookingEntitlementType" NOT NULL DEFAULT 'manual',
    "creditLedgerEntryId" TEXT,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstJoinedAt" TIMESTAMP(3),
    "lastJoinedAt" TIMESTAMP(3),
    "lastLeftAt" TIMESTAMP(3),
    "joinCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceMarkedAt" TIMESTAMP(3),
    "attendanceMarkedByUserId" TEXT,
    "attendanceSource" "AttendanceSource",
    "preClassEnergyLevel" INTEGER,
    "preClassFlareToday" BOOLEAN,
    "preClassSubmittedAt" TIMESTAMP(3),
    "postClassFeeling" "PostClassFeeling",
    "postClassSubmittedAt" TIMESTAMP(3),
    "complianceSnapshotJson" JSONB,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassAttendanceEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "dailyParticipantId" TEXT,
    "type" "ClassAttendanceEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAttendanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassWaitlistEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "ClassWaitlistStatus" NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassWaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "ClassSessionEventType" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "providerCampaignId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "stream" TEXT,
    "status" TEXT NOT NULL,
    "audienceType" TEXT,
    "triggeredBy" TEXT,
    "contentfulEntryId" TEXT,
    "contentfulContentType" TEXT,
    "postmarkBatchId" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'postmark',
    "providerEventId" TEXT NOT NULL,
    "messageId" TEXT,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAudienceSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newsletterCount" INTEGER NOT NULL DEFAULT 0,
    "blogCount" INTEGER NOT NULL DEFAULT 0,
    "bothCount" INTEGER NOT NULL DEFAULT 0,
    "neitherCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribes30d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAudienceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "ClassOperationalSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "preJoinWindowMinutes" INTEGER NOT NULL DEFAULT 10,
    "lateJoinCutoffMinutes" INTEGER NOT NULL DEFAULT 5,
    "creditRefundWindowMinutes" INTEGER NOT NULL DEFAULT 180,
    "emptyClassAutoCancelWindowMinutes" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassOperationalSettings_pkey" PRIMARY KEY ("id")
);

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
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingScope" TEXT,
    "replayAvailable" BOOLEAN NOT NULL DEFAULT false,
    "replayAccessDurationDays" INTEGER,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
    "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
    "refundRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetreatDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatRoomOption" (
    "id" TEXT NOT NULL,
    "retreatDateId" TEXT NOT NULL,
    "externalRoomOptionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "roomType" TEXT NOT NULL,
    "guestsIncluded" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL,
    "availableSpots" INTEGER NOT NULL,
    "pricePence" INTEGER NOT NULL,
    "depositAmountPence" INTEGER,
    "isWaitlistOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetreatRoomOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatDateInstructorAssignment" (
    "id" TEXT NOT NULL,
    "retreatDateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetreatDateInstructorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetreatBooking" (
    "id" TEXT NOT NULL,
    "retreatDateId" TEXT NOT NULL,
    "roomOptionId" TEXT,
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
    "guestTwoFirstName" TEXT,
    "guestTwoLastName" TEXT,
    "guestTwoEmail" TEXT,
    "guestTwoDietaryRequirements" TEXT,
    "singleRoomRequested" BOOLEAN NOT NULL DEFAULT false,
    "roomType" TEXT,
    "roomOptionLabelSnapshot" TEXT,
    "roomOptionTypeSnapshot" TEXT,
    "guestsIncluded" INTEGER NOT NULL DEFAULT 1,
    "giftPurchaseId" TEXT,
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
    "complianceSnapshotJson" JSONB,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depositPaidAt" TIMESTAMP(3),
    "balancePaidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetreatBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftPurchase" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "GiftType" NOT NULL,
    "status" "GiftPurchaseStatus" NOT NULL DEFAULT 'pending_payment',
    "purchaserUserId" TEXT,
    "redeemedByUserId" TEXT,
    "purchaserFirstName" TEXT NOT NULL,
    "purchaserLastName" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "recipientFirstName" TEXT NOT NULL,
    "recipientLastName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientMessage" TEXT,
    "deliveryTarget" "GiftDeliveryTarget" NOT NULL,
    "productSlug" TEXT NOT NULL,
    "productTitleSnapshot" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "totalPaidPence" INTEGER NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "retreatDateId" TEXT,
    "retreatRoomOptionId" TEXT,
    "smallGroupProgrammeId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestAcceptanceEvent" (
    "id" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "type" "AcceptanceType" NOT NULL,
    "policyVersionId" TEXT,
    "version" TEXT NOT NULL,
    "acceptanceSurface" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,
    "retreatBookingId" TEXT,
    "giftPurchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAcceptanceEvent_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "SmallGroupProgramme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "runSlug" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "durationLabel" TEXT NOT NULL,
    "durationWeeks" INTEGER,
    "cohortSize" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "scheduleLabel" TEXT,
    "pricePence" INTEGER NOT NULL,
    "sessionsPerWeek" INTEGER,
    "totalSessions" INTEGER,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingScope" TEXT,
    "replayAvailable" BOOLEAN NOT NULL DEFAULT false,
    "replayAccessDurationDays" INTEGER,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "participantMicDefaultMuted" BOOLEAN NOT NULL DEFAULT false,
    "participantCameraDefaultOff" BOOLEAN NOT NULL DEFAULT false,
    "refundRuleId" TEXT,
    "status" "SmallGroupProgrammeStatus" NOT NULL DEFAULT 'draft',
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "featuredBadge" TEXT,
    "whoItsForJson" JSONB,
    "equipmentJson" JSONB,
    "inclusionsJson" JSONB,
    "weekByWeekJson" JSONB,
    "contentfulEntryId" TEXT,
    "templateContentfulEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmallGroupProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupProgrammeSession" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "instructorUserId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "sequenceNumber" INTEGER NOT NULL,
    "status" "SmallGroupSessionStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmallGroupProgrammeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupProgrammeEnrollment" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT,
    "attendeeName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "sessionsAttended" INTEGER NOT NULL DEFAULT 0,
    "progressSummary" TEXT,
    "status" "SmallGroupEnrollmentStatus" NOT NULL DEFAULT 'active',
    "pricePaidPence" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paymentWindowExpiresAt" TIMESTAMP(3),
    "complianceSnapshotJson" JSONB,
    "giftPurchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmallGroupProgrammeEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupProgrammeInstructorAssignment" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmallGroupProgrammeInstructorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemedWeek" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemedWeek_pkey" PRIMARY KEY ("id")
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
    "userId" TEXT,
    "anonymousToken" TEXT,
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "PolicyDocumentVersion_type_isCurrent_idx" ON "PolicyDocumentVersion"("type", "isCurrent");

-- CreateIndex
CREATE INDEX "PolicyDocumentVersion_slug_isCurrent_idx" ON "PolicyDocumentVersion"("slug", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocumentVersion_type_version_key" ON "PolicyDocumentVersion"("type", "version");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_userId_type_acceptedAt_idx" ON "AcceptanceEvent"("userId", "type", "acceptedAt");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_policyVersionId_acceptedAt_idx" ON "AcceptanceEvent"("policyVersionId", "acceptedAt");

-- CreateIndex
CREATE INDEX "AcceptanceEvent_actorUserId_acceptedAt_idx" ON "AcceptanceEvent"("actorUserId", "acceptedAt");

-- CreateIndex
CREATE INDEX "IncidentLog_sessionId_createdAt_idx" ON "IncidentLog"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_affectedUserId_createdAt_idx" ON "IncidentLog"("affectedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_actorUserId_createdAt_idx" ON "IncidentLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentLog_category_createdAt_idx" ON "IncidentLog"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReplayAsset_classSessionId_key" ON "ReplayAsset"("classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplayAsset_dailyRecordingId_key" ON "ReplayAsset"("dailyRecordingId");

-- CreateIndex
CREATE INDEX "ReplayAsset_resourceType_status_idx" ON "ReplayAsset"("resourceType", "status");

-- CreateIndex
CREATE INDEX "ReplayAsset_deleteAfterAt_status_idx" ON "ReplayAsset"("deleteAfterAt", "status");

-- CreateIndex
CREATE INDEX "ReplayAsset_dailyRoomName_idx" ON "ReplayAsset"("dailyRoomName");

-- CreateIndex
CREATE INDEX "ReplayAsset_retreatDateId_idx" ON "ReplayAsset"("retreatDateId");

-- CreateIndex
CREATE INDEX "ReplayAsset_smallGroupProgrammeId_idx" ON "ReplayAsset"("smallGroupProgrammeId");

-- CreateIndex
CREATE INDEX "ReplayAsset_smallGroupProgrammeSessionId_idx" ON "ReplayAsset"("smallGroupProgrammeSessionId");

-- CreateIndex
CREATE INDEX "ReplayEntitlement_userId_endsAt_revokedAt_idx" ON "ReplayEntitlement"("userId", "endsAt", "revokedAt");

-- CreateIndex
CREATE INDEX "ReplayEntitlement_replayAssetId_accessType_idx" ON "ReplayEntitlement"("replayAssetId", "accessType");

-- CreateIndex
CREATE UNIQUE INDEX "ReplayEntitlement_replayAssetId_userId_accessType_key" ON "ReplayEntitlement"("replayAssetId", "userId", "accessType");

-- CreateIndex
CREATE INDEX "RefundRule_family_activeFrom_activeUntil_idx" ON "RefundRule"("family", "activeFrom", "activeUntil");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRule_family_code_version_key" ON "RefundRule"("family", "code", "version");

-- CreateIndex
CREATE INDEX "PrivacyRequest_userId_type_createdAt_idx" ON "PrivacyRequest"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_status_createdAt_idx" ON "PrivacyRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_actorUserId_createdAt_idx" ON "PrivacyRequest"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_actorUserId_createdAt_idx" ON "AdminActionLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_createdAt_idx" ON "AdminActionLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_actionType_createdAt_idx" ON "AdminActionLog"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledJobRun_jobName_createdAt_idx" ON "ScheduledJobRun"("jobName", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledJobRun_status_createdAt_idx" ON "ScheduledJobRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingDisputeCase_stripeDisputeId_key" ON "BillingDisputeCase"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "BillingDisputeCase_userId_status_openedAt_idx" ON "BillingDisputeCase"("userId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "BillingDisputeCase_purchaserEmail_status_openedAt_idx" ON "BillingDisputeCase"("purchaserEmail", "status", "openedAt");

-- CreateIndex
CREATE INDEX "BillingDisputeCase_resourceType_resourceId_status_idx" ON "BillingDisputeCase"("resourceType", "resourceId", "status");

-- CreateIndex
CREATE INDEX "BillingDisputeCase_paymentIntentId_idx" ON "BillingDisputeCase"("paymentIntentId");

-- CreateIndex
CREATE INDEX "BillingDisputeCase_chargeId_idx" ON "BillingDisputeCase"("chargeId");

-- CreateIndex
CREATE INDEX "ParticipantModerationAction_sessionId_createdAt_idx" ON "ParticipantModerationAction"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantModerationAction_userId_createdAt_idx" ON "ParticipantModerationAction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantModerationAction_actorUserId_createdAt_idx" ON "ParticipantModerationAction"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionParticipantBlock_sessionId_active_idx" ON "SessionParticipantBlock"("sessionId", "active");

-- CreateIndex
CREATE INDEX "SessionParticipantBlock_userId_active_idx" ON "SessionParticipantBlock"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipantBlock_sessionId_userId_active_key" ON "SessionParticipantBlock"("sessionId", "userId", "active");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ReferralEvent_referrerUserId_idx" ON "ReferralEvent"("referrerUserId");

-- CreateIndex
CREATE INDEX "ReferralEvent_referredUserId_idx" ON "ReferralEvent"("referredUserId");

-- CreateIndex
CREATE INDEX "ReferralEvent_status_idx" ON "ReferralEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralEvent_referrerUserId_referredUserId_key" ON "ReferralEvent"("referrerUserId", "referredUserId");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_userId_createdAt_idx" ON "ReferralLedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_eventId_idx" ON "ReferralLedgerEntry"("eventId");

-- CreateIndex
CREATE INDEX "ReferralLedgerEntry_appliedToBillingEventId_idx" ON "ReferralLedgerEntry"("appliedToBillingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipSubscription_stripeSubscriptionId_key" ON "MembershipSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "MembershipSubscription_userId_status_idx" ON "MembershipSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "MembershipSubscription_stripeSubscriptionId_idx" ON "MembershipSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_userId_eventAt_idx" ON "SubscriptionComplianceEvent"("userId", "eventAt");

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_membershipId_eventAt_idx" ON "SubscriptionComplianceEvent"("membershipId", "eventAt");

-- CreateIndex
CREATE INDEX "SubscriptionComplianceEvent_kind_eventAt_idx" ON "SubscriptionComplianceEvent"("kind", "eventAt");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_userId_createdAt_idx" ON "CreditLedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_createdByUserId_idx" ON "CreditLedgerEntry"("createdByUserId");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_stripeCheckoutSessionId_idx" ON "CreditLedgerEntry"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_provider_type_idx" ON "BillingEvent"("provider", "type");

-- CreateIndex
CREATE INDEX "BillingEvent_status_createdAt_idx" ON "BillingEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingMetricDaily_date_key" ON "BillingMetricDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX "HealthConditionSelection_profileId_idx" ON "HealthConditionSelection"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthConditionSelection_profileId_conditionKey_key" ON "HealthConditionSelection"("profileId", "conditionKey");

-- CreateIndex
CREATE INDEX "HealthProfileRevision_profileId_createdAt_idx" ON "HealthProfileRevision"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "HealthProfileRevision_updatedByUserId_idx" ON "HealthProfileRevision"("updatedByUserId");

-- CreateIndex
CREATE INDEX "ClassTimetableRule_active_weekday_startsOn_idx" ON "ClassTimetableRule"("active", "weekday", "startsOn");

-- CreateIndex
CREATE INDEX "ClassTimetableRule_instructorUserId_active_idx" ON "ClassTimetableRule"("instructorUserId", "active");

-- CreateIndex
CREATE INDEX "ClassTimetableExclusion_localDate_idx" ON "ClassTimetableExclusion"("localDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTimetableExclusion_timetableRuleId_localDate_key" ON "ClassTimetableExclusion"("timetableRuleId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_generationKey_key" ON "ClassSession"("generationKey");

-- CreateIndex
CREATE INDEX "ClassSession_classDefinitionSlug_startsAtUtc_idx" ON "ClassSession"("classDefinitionSlug", "startsAtUtc");

-- CreateIndex
CREATE INDEX "ClassSession_startsAtUtc_status_idx" ON "ClassSession"("startsAtUtc", "status");

-- CreateIndex
CREATE INDEX "ClassSession_instructorUserId_startsAtUtc_idx" ON "ClassSession"("instructorUserId", "startsAtUtc");

-- CreateIndex
CREATE INDEX "ClassSession_timetableRuleId_startsAtUtc_idx" ON "ClassSession"("timetableRuleId", "startsAtUtc");

-- CreateIndex
CREATE INDEX "ClassSession_roomSetupStatus_startsAtUtc_idx" ON "ClassSession"("roomSetupStatus", "startsAtUtc");

-- CreateIndex
CREATE UNIQUE INDEX "ClassBooking_creditLedgerEntryId_key" ON "ClassBooking"("creditLedgerEntryId");

-- CreateIndex
CREATE INDEX "ClassBooking_userId_status_idx" ON "ClassBooking"("userId", "status");

-- CreateIndex
CREATE INDEX "ClassBooking_sessionId_status_idx" ON "ClassBooking"("sessionId", "status");

-- CreateIndex
CREATE INDEX "ClassBooking_entitlementType_idx" ON "ClassBooking"("entitlementType");

-- CreateIndex
CREATE INDEX "ClassBooking_attendanceMarkedByUserId_idx" ON "ClassBooking"("attendanceMarkedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassBooking_sessionId_userId_key" ON "ClassBooking"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "ClassAttendanceEvent_sessionId_occurredAt_idx" ON "ClassAttendanceEvent"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "ClassAttendanceEvent_bookingId_occurredAt_idx" ON "ClassAttendanceEvent"("bookingId", "occurredAt");

-- CreateIndex
CREATE INDEX "ClassAttendanceEvent_userId_occurredAt_idx" ON "ClassAttendanceEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ClassWaitlistEntry_sessionId_status_position_idx" ON "ClassWaitlistEntry"("sessionId", "status", "position");

-- CreateIndex
CREATE INDEX "ClassWaitlistEntry_userId_status_idx" ON "ClassWaitlistEntry"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassWaitlistEntry_sessionId_userId_key" ON "ClassWaitlistEntry"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassWaitlistEntry_sessionId_position_key" ON "ClassWaitlistEntry"("sessionId", "position");

-- CreateIndex
CREATE INDEX "ClassSessionEvent_sessionId_createdAt_idx" ON "ClassSessionEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ClassSessionEvent_type_createdAt_idx" ON "ClassSessionEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_providerCampaignId_key" ON "EmailCampaign"("providerCampaignId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_sentAt_idx" ON "EmailCampaign"("status", "sentAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_contentfulEntryId_contentfulContentType_idx" ON "EmailCampaign"("contentfulEntryId", "contentfulContentType");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_providerEventId_key" ON "EmailEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailEvent_email_eventAt_idx" ON "EmailEvent"("email", "eventAt");

-- CreateIndex
CREATE INDEX "EmailEvent_type_eventAt_idx" ON "EmailEvent"("type", "eventAt");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_eventAt_idx" ON "EmailEvent"("campaignId", "eventAt");

-- CreateIndex
CREATE INDEX "EmailEvent_userId_eventAt_idx" ON "EmailEvent"("userId", "eventAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAudienceSnapshot_date_key" ON "EmailAudienceSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCatalogItem_key_key" ON "BillingCatalogItem"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCatalogItem_stripePriceId_key" ON "BillingCatalogItem"("stripePriceId");

-- CreateIndex
CREATE INDEX "BillingCatalogItem_key_active_idx" ON "BillingCatalogItem"("key", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCodeMirror_stripePromotionCodeId_key" ON "PromotionCodeMirror"("stripePromotionCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCodeMirror_code_key" ON "PromotionCodeMirror"("code");

-- CreateIndex
CREATE INDEX "PromotionCodeMirror_active_code_idx" ON "PromotionCodeMirror"("active", "code");

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
CREATE INDEX "RetreatDate_refundRuleId_idx" ON "RetreatDate"("refundRuleId");

-- CreateIndex
CREATE INDEX "RetreatRoomOption_retreatDateId_availableSpots_idx" ON "RetreatRoomOption"("retreatDateId", "availableSpots");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatRoomOption_retreatDateId_externalRoomOptionId_key" ON "RetreatRoomOption"("retreatDateId", "externalRoomOptionId");

-- CreateIndex
CREATE INDEX "RetreatDateInstructorAssignment_userId_createdAt_idx" ON "RetreatDateInstructorAssignment"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatDateInstructorAssignment_retreatDateId_userId_key" ON "RetreatDateInstructorAssignment"("retreatDateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_giftPurchaseId_key" ON "RetreatBooking"("giftPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_stripeDepositSessionId_key" ON "RetreatBooking"("stripeDepositSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_stripeBalanceSessionId_key" ON "RetreatBooking"("stripeBalanceSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatBooking_balancePaymentUrlToken_key" ON "RetreatBooking"("balancePaymentUrlToken");

-- CreateIndex
CREATE INDEX "RetreatBooking_retreatDateId_bookingStatus_idx" ON "RetreatBooking"("retreatDateId", "bookingStatus");

-- CreateIndex
CREATE INDEX "RetreatBooking_roomOptionId_bookingStatus_idx" ON "RetreatBooking"("roomOptionId", "bookingStatus");

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
CREATE UNIQUE INDEX "GiftPurchase_code_key" ON "GiftPurchase"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GiftPurchase_stripeCheckoutSessionId_key" ON "GiftPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "GiftPurchase_status_type_createdAt_idx" ON "GiftPurchase"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "GiftPurchase_recipientEmail_status_idx" ON "GiftPurchase"("recipientEmail", "status");

-- CreateIndex
CREATE INDEX "GiftPurchase_purchaserEmail_status_idx" ON "GiftPurchase"("purchaserEmail", "status");

-- CreateIndex
CREATE INDEX "GiftPurchase_retreatDateId_status_idx" ON "GiftPurchase"("retreatDateId", "status");

-- CreateIndex
CREATE INDEX "GiftPurchase_smallGroupProgrammeId_status_idx" ON "GiftPurchase"("smallGroupProgrammeId", "status");

-- CreateIndex
CREATE INDEX "GuestAcceptanceEvent_purchaserEmail_acceptedAt_idx" ON "GuestAcceptanceEvent"("purchaserEmail", "acceptedAt");

-- CreateIndex
CREATE INDEX "GuestAcceptanceEvent_policyVersionId_acceptedAt_idx" ON "GuestAcceptanceEvent"("policyVersionId", "acceptedAt");

-- CreateIndex
CREATE INDEX "GuestAcceptanceEvent_retreatBookingId_type_acceptedAt_idx" ON "GuestAcceptanceEvent"("retreatBookingId", "type", "acceptedAt");

-- CreateIndex
CREATE INDEX "GuestAcceptanceEvent_giftPurchaseId_type_acceptedAt_idx" ON "GuestAcceptanceEvent"("giftPurchaseId", "type", "acceptedAt");

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
CREATE UNIQUE INDEX "SmallGroupProgramme_slug_key" ON "SmallGroupProgramme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgramme_runSlug_key" ON "SmallGroupProgramme"("runSlug");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgramme_contentfulEntryId_key" ON "SmallGroupProgramme"("contentfulEntryId");

-- CreateIndex
CREATE INDEX "SmallGroupProgramme_status_startDate_idx" ON "SmallGroupProgramme"("status", "startDate");

-- CreateIndex
CREATE INDEX "SmallGroupProgramme_templateSlug_status_startDate_idx" ON "SmallGroupProgramme"("templateSlug", "status", "startDate");

-- CreateIndex
CREATE INDEX "SmallGroupProgramme_refundRuleId_idx" ON "SmallGroupProgramme"("refundRuleId");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeSession_programmeId_startsAt_idx" ON "SmallGroupProgrammeSession"("programmeId", "startsAt");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeSession_instructorUserId_startsAt_idx" ON "SmallGroupProgrammeSession"("instructorUserId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgrammeSession_programmeId_sequenceNumber_key" ON "SmallGroupProgrammeSession"("programmeId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgrammeEnrollment_stripeCheckoutSessionId_key" ON "SmallGroupProgrammeEnrollment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgrammeEnrollment_giftPurchaseId_key" ON "SmallGroupProgrammeEnrollment"("giftPurchaseId");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeEnrollment_programmeId_status_idx" ON "SmallGroupProgrammeEnrollment"("programmeId", "status");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeEnrollment_userId_status_idx" ON "SmallGroupProgrammeEnrollment"("userId", "status");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeEnrollment_attendeeEmail_status_idx" ON "SmallGroupProgrammeEnrollment"("attendeeEmail", "status");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeEnrollment_paymentWindowExpiresAt_status_idx" ON "SmallGroupProgrammeEnrollment"("paymentWindowExpiresAt", "status");

-- CreateIndex
CREATE INDEX "SmallGroupProgrammeInstructorAssignment_userId_createdAt_idx" ON "SmallGroupProgrammeInstructorAssignment"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmallGroupProgrammeInstructorAssignment_programmeId_userId_key" ON "SmallGroupProgrammeInstructorAssignment"("programmeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemedWeek_slug_key" ON "ThemedWeek"("slug");

-- CreateIndex
CREATE INDEX "ThemedWeek_startDate_endDate_idx" ON "ThemedWeek"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ThemedWeek_sortOrder_startDate_idx" ON "ThemedWeek"("sortOrder", "startDate");

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
CREATE UNIQUE INDEX "BlogReaction_postSlug_anonymousToken_key" ON "BlogReaction"("postSlug", "anonymousToken");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_email_createdAt_idx" ON "ContactSubmission"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDocumentVersion" ADD CONSTRAINT "PolicyDocumentVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceEvent" ADD CONSTRAINT "AcceptanceEvent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_smallGroupProgrammeId_fkey" FOREIGN KEY ("smallGroupProgrammeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAsset" ADD CONSTRAINT "ReplayAsset_smallGroupProgrammeSessionId_fkey" FOREIGN KEY ("smallGroupProgrammeSessionId") REFERENCES "SmallGroupProgrammeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_replayAssetId_fkey" FOREIGN KEY ("replayAssetId") REFERENCES "ReplayAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayEntitlement" ADD CONSTRAINT "ReplayEntitlement_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRule" ADD CONSTRAINT "RefundRule_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobRun" ADD CONSTRAINT "ScheduledJobRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDisputeCase" ADD CONSTRAINT "BillingDisputeCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantModerationAction" ADD CONSTRAINT "ParticipantModerationAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipantBlock" ADD CONSTRAINT "SessionParticipantBlock_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ReferralEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLedgerEntry" ADD CONSTRAINT "ReferralLedgerEntry_appliedToBillingEventId_fkey" FOREIGN KEY ("appliedToBillingEventId") REFERENCES "BillingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionComplianceEvent" ADD CONSTRAINT "SubscriptionComplianceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionComplianceEvent" ADD CONSTRAINT "SubscriptionComplianceEvent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "MembershipSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthConditionSelection" ADD CONSTRAINT "HealthConditionSelection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfileRevision" ADD CONSTRAINT "HealthProfileRevision_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfileRevision" ADD CONSTRAINT "HealthProfileRevision_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTimetableRule" ADD CONSTRAINT "ClassTimetableRule_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTimetableRule" ADD CONSTRAINT "ClassTimetableRule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTimetableExclusion" ADD CONSTRAINT "ClassTimetableExclusion_timetableRuleId_fkey" FOREIGN KEY ("timetableRuleId") REFERENCES "ClassTimetableRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_timetableRuleId_fkey" FOREIGN KEY ("timetableRuleId") REFERENCES "ClassTimetableRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_creditLedgerEntryId_fkey" FOREIGN KEY ("creditLedgerEntryId") REFERENCES "CreditLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_attendanceMarkedByUserId_fkey" FOREIGN KEY ("attendanceMarkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendanceEvent" ADD CONSTRAINT "ClassAttendanceEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendanceEvent" ADD CONSTRAINT "ClassAttendanceEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ClassBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendanceEvent" ADD CONSTRAINT "ClassAttendanceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassWaitlistEntry" ADD CONSTRAINT "ClassWaitlistEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassWaitlistEntry" ADD CONSTRAINT "ClassWaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSessionEvent" ADD CONSTRAINT "ClassSessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatDate" ADD CONSTRAINT "RetreatDate_refundRuleId_fkey" FOREIGN KEY ("refundRuleId") REFERENCES "RefundRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatRoomOption" ADD CONSTRAINT "RetreatRoomOption_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatDateInstructorAssignment" ADD CONSTRAINT "RetreatDateInstructorAssignment_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatDateInstructorAssignment" ADD CONSTRAINT "RetreatDateInstructorAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_roomOptionId_fkey" FOREIGN KEY ("roomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_attendeeUserId_fkey" FOREIGN KEY ("attendeeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetreatBooking" ADD CONSTRAINT "RetreatBooking_giftPurchaseId_fkey" FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchase" ADD CONSTRAINT "GiftPurchase_purchaserUserId_fkey" FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchase" ADD CONSTRAINT "GiftPurchase_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchase" ADD CONSTRAINT "GiftPurchase_retreatDateId_fkey" FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchase" ADD CONSTRAINT "GiftPurchase_retreatRoomOptionId_fkey" FOREIGN KEY ("retreatRoomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftPurchase" ADD CONSTRAINT "GiftPurchase_smallGroupProgrammeId_fkey" FOREIGN KEY ("smallGroupProgrammeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAcceptanceEvent" ADD CONSTRAINT "GuestAcceptanceEvent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAcceptanceEvent" ADD CONSTRAINT "GuestAcceptanceEvent_retreatBookingId_fkey" FOREIGN KEY ("retreatBookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAcceptanceEvent" ADD CONSTRAINT "GuestAcceptanceEvent_giftPurchaseId_fkey" FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "SmallGroupProgramme" ADD CONSTRAINT "SmallGroupProgramme_refundRuleId_fkey" FOREIGN KEY ("refundRuleId") REFERENCES "RefundRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeSession" ADD CONSTRAINT "SmallGroupProgrammeSession_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeSession" ADD CONSTRAINT "SmallGroupProgrammeSession_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeEnrollment" ADD CONSTRAINT "SmallGroupProgrammeEnrollment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeEnrollment" ADD CONSTRAINT "SmallGroupProgrammeEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeEnrollment" ADD CONSTRAINT "SmallGroupProgrammeEnrollment_giftPurchaseId_fkey" FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeInstructorAssignment" ADD CONSTRAINT "SmallGroupProgrammeInstructorAssignment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupProgrammeInstructorAssignment" ADD CONSTRAINT "SmallGroupProgrammeInstructorAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
