-- Enums
CREATE TYPE "ReferralEventStatus" AS ENUM (
  'pending_signup',
  'pending_qualification',
  'qualified',
  'rewarded',
  'void'
);

CREATE TYPE "ReferralLedgerType" AS ENUM ('reward', 'adjustment', 'applied');

-- User extensions
ALTER TABLE "User"
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "ethnicity" TEXT,
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "referredByUserId" TEXT;

-- Backfill referral code deterministically for existing users
UPDATE "User"
SET "referralCode" = 'REF' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 10))
WHERE "referralCode" IS NULL;

-- Constraints and indexes for User extensions
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_referredByUserId_fkey"
  FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Referral domain
CREATE TABLE "ReferralEvent" (
  "id" TEXT NOT NULL,
  "referrerUserId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "referralCodeSnapshot" TEXT NOT NULL,
  "status" "ReferralEventStatus" NOT NULL DEFAULT 'pending_signup',
  "qualifiedAt" TIMESTAMP(3),
  "rewardedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralEvent_referrerUserId_referredUserId_key"
  ON "ReferralEvent"("referrerUserId", "referredUserId");
CREATE INDEX "ReferralEvent_referrerUserId_idx" ON "ReferralEvent"("referrerUserId");
CREATE INDEX "ReferralEvent_referredUserId_idx" ON "ReferralEvent"("referredUserId");
CREATE INDEX "ReferralEvent_status_idx" ON "ReferralEvent"("status");

ALTER TABLE "ReferralEvent"
  ADD CONSTRAINT "ReferralEvent_referrerUserId_fkey"
  FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralEvent"
  ADD CONSTRAINT "ReferralEvent_referredUserId_fkey"
  FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ReferralLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT,
  "amountPence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "type" "ReferralLedgerType" NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReferralLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralLedgerEntry_userId_createdAt_idx"
  ON "ReferralLedgerEntry"("userId", "createdAt");
CREATE INDEX "ReferralLedgerEntry_eventId_idx" ON "ReferralLedgerEntry"("eventId");

ALTER TABLE "ReferralLedgerEntry"
  ADD CONSTRAINT "ReferralLedgerEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralLedgerEntry"
  ADD CONSTRAINT "ReferralLedgerEntry_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "ReferralEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Health domain
CREATE TABLE "HealthProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "additionalNotes" TEXT NOT NULL DEFAULT '',
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

ALTER TABLE "HealthProfile"
  ADD CONSTRAINT "HealthProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HealthConditionSelection" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "conditionKey" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HealthConditionSelection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthConditionSelection_profileId_conditionKey_key"
  ON "HealthConditionSelection"("profileId", "conditionKey");
CREATE INDEX "HealthConditionSelection_profileId_idx" ON "HealthConditionSelection"("profileId");

ALTER TABLE "HealthConditionSelection"
  ADD CONSTRAINT "HealthConditionSelection_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HealthProfileRevision" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "snapshotJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HealthProfileRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthProfileRevision_profileId_createdAt_idx"
  ON "HealthProfileRevision"("profileId", "createdAt");
CREATE INDEX "HealthProfileRevision_updatedByUserId_idx"
  ON "HealthProfileRevision"("updatedByUserId");

ALTER TABLE "HealthProfileRevision"
  ADD CONSTRAINT "HealthProfileRevision_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthProfileRevision"
  ADD CONSTRAINT "HealthProfileRevision_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification preferences
CREATE TABLE "UserNotificationPreference" (
  "userId" TEXT NOT NULL,
  "classReminders" BOOLEAN NOT NULL DEFAULT true,
  "scheduleUpdates" BOOLEAN NOT NULL DEFAULT true,
  "programAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "newsletter" BOOLEAN NOT NULL DEFAULT true,
  "blogUpdates" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserNotificationPreference"
  ADD CONSTRAINT "UserNotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
