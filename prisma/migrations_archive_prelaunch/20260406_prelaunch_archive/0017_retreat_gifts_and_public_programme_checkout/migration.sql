-- Gift enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftType') THEN
    CREATE TYPE "GiftType" AS ENUM ('retreat', 'small_group');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftPurchaseStatus') THEN
    CREATE TYPE "GiftPurchaseStatus" AS ENUM ('pending_payment', 'purchased', 'redeemed', 'expired', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftDeliveryTarget') THEN
    CREATE TYPE "GiftDeliveryTarget" AS ENUM ('recipient', 'buyer');
  END IF;
END $$;

-- Add missing enrolment status for checkout reservations
DO $$
BEGIN
  ALTER TYPE "SmallGroupEnrollmentStatus" ADD VALUE IF NOT EXISTS 'pending_payment';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Retreat room options
CREATE TABLE IF NOT EXISTS "RetreatRoomOption" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RetreatRoomOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetreatRoomOption_retreatDateId_externalRoomOptionId_key"
ON "RetreatRoomOption"("retreatDateId", "externalRoomOptionId");

CREATE INDEX IF NOT EXISTS "RetreatRoomOption_retreatDateId_availableSpots_idx"
ON "RetreatRoomOption"("retreatDateId", "availableSpots");

ALTER TABLE "RetreatRoomOption"
ADD CONSTRAINT "RetreatRoomOption_retreatDateId_fkey"
FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Retreat booking room and guest extensions
ALTER TABLE "RetreatBooking"
  ADD COLUMN IF NOT EXISTS "roomOptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "guestTwoFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestTwoLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestTwoEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "guestTwoDietaryRequirements" TEXT,
  ADD COLUMN IF NOT EXISTS "roomOptionLabelSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "roomOptionTypeSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "guestsIncluded" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "giftPurchaseId" TEXT;

CREATE INDEX IF NOT EXISTS "RetreatBooking_roomOptionId_bookingStatus_idx"
ON "RetreatBooking"("roomOptionId", "bookingStatus");

CREATE UNIQUE INDEX IF NOT EXISTS "RetreatBooking_giftPurchaseId_key"
ON "RetreatBooking"("giftPurchaseId");

ALTER TABLE "RetreatBooking"
ADD CONSTRAINT "RetreatBooking_roomOptionId_fkey"
FOREIGN KEY ("roomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Gift purchase model
CREATE TABLE IF NOT EXISTS "GiftPurchase" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GiftPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GiftPurchase_code_key" ON "GiftPurchase"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "GiftPurchase_stripeCheckoutSessionId_key"
ON "GiftPurchase"("stripeCheckoutSessionId");
CREATE INDEX IF NOT EXISTS "GiftPurchase_status_type_createdAt_idx"
ON "GiftPurchase"("status", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "GiftPurchase_recipientEmail_status_idx"
ON "GiftPurchase"("recipientEmail", "status");
CREATE INDEX IF NOT EXISTS "GiftPurchase_purchaserEmail_status_idx"
ON "GiftPurchase"("purchaserEmail", "status");
CREATE INDEX IF NOT EXISTS "GiftPurchase_retreatDateId_status_idx"
ON "GiftPurchase"("retreatDateId", "status");
CREATE INDEX IF NOT EXISTS "GiftPurchase_smallGroupProgrammeId_status_idx"
ON "GiftPurchase"("smallGroupProgrammeId", "status");

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_purchaserUserId_fkey"
FOREIGN KEY ("purchaserUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_redeemedByUserId_fkey"
FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_retreatDateId_fkey"
FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_retreatRoomOptionId_fkey"
FOREIGN KEY ("retreatRoomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Link retreat bookings to gifts
ALTER TABLE "RetreatBooking"
ADD CONSTRAINT "RetreatBooking_giftPurchaseId_fkey"
FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enrich small group programme shape
ALTER TABLE "SmallGroupProgramme"
  ADD COLUMN IF NOT EXISTS "subtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "longDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "durationWeeks" INTEGER,
  ADD COLUMN IF NOT EXISTS "sessionsPerWeek" INTEGER,
  ADD COLUMN IF NOT EXISTS "totalSessions" INTEGER,
  ADD COLUMN IF NOT EXISTS "whoItsForJson" JSONB,
  ADD COLUMN IF NOT EXISTS "equipmentJson" JSONB,
  ADD COLUMN IF NOT EXISTS "inclusionsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "weekByWeekJson" JSONB;

-- Programme checkout fields
ALTER TABLE "SmallGroupProgrammeEnrollment"
  ADD COLUMN IF NOT EXISTS "pricePaidPence" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentWindowExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "giftPurchaseId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "SmallGroupProgrammeEnrollment_stripeCheckoutSessionId_key"
ON "SmallGroupProgrammeEnrollment"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX IF NOT EXISTS "SmallGroupProgrammeEnrollment_giftPurchaseId_key"
ON "SmallGroupProgrammeEnrollment"("giftPurchaseId");

CREATE INDEX IF NOT EXISTS "SmallGroupProgrammeEnrollment_paymentWindowExpiresAt_status_idx"
ON "SmallGroupProgrammeEnrollment"("paymentWindowExpiresAt", "status");

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_smallGroupProgrammeId_fkey"
FOREIGN KEY ("smallGroupProgrammeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SmallGroupProgrammeEnrollment"
ADD CONSTRAINT "SmallGroupProgrammeEnrollment_giftPurchaseId_fkey"
FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
