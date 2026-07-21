-- Additive retreat reinstatement schema.

CREATE TYPE "RetreatInstalmentKind" AS ENUM ('deposit', 'scheduled', 'balance', 'full_payment');
CREATE TYPE "RetreatInstalmentStatus" AS ENUM ('pending', 'paid', 'refunded', 'cancelled', 'failed');
CREATE TYPE "RetreatRoomUnitStatus" AS ENUM ('available', 'assigned', 'unavailable');
CREATE TYPE "RetreatAttendeeStatus" AS ENUM ('pending_claim', 'claimed', 'cancelled');

ALTER TABLE "RetreatDate"
  ADD COLUMN "retreatType" TEXT NOT NULL DEFAULT 'in_person',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
  ADD COLUMN "paymentPlanSnapshotJson" JSONB,
  ADD COLUMN "refundPolicySnapshotJson" JSONB,
  ADD COLUMN "payInFullDiscountEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "payInFullDiscountPercent" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "payInFullDiscountCapPence" INTEGER NOT NULL DEFAULT 5000,
  ADD COLUMN "dailyRoomName" TEXT,
  ADD COLUMN "dailyRoomUrl" TEXT,
  ADD COLUMN "onlineRoomSetupStatus" "ClassRoomSetupStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "onlineRoomSetupError" TEXT;

ALTER TABLE "RetreatRoomOption"
  ADD COLUMN "pricePerPersonPence" INTEGER,
  ADD COLUMN "roomCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RetreatBooking"
  ADD COLUMN "roomUnitId" TEXT,
  ADD COLUMN "attendeeCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "payInFullDiscountPence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nonRefundableAmountPence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "paymentPlanSnapshotJson" JSONB,
  ADD COLUMN "refundPolicySnapshotJson" JSONB;

CREATE TABLE "RetreatRoomUnit" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "roomOptionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "status" "RetreatRoomUnitStatus" NOT NULL DEFAULT 'available',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatRoomUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatAttendee" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isPurchaser" BOOLEAN NOT NULL DEFAULT false,
  "status" "RetreatAttendeeStatus" NOT NULL DEFAULT 'pending_claim',
  "claimToken" TEXT,
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatAttendee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatBookingInstalment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "kind" "RetreatInstalmentKind" NOT NULL,
  "label" TEXT NOT NULL,
  "amountPence" INTEGER NOT NULL,
  "dueAt" TIMESTAMP(3),
  "status" "RetreatInstalmentStatus" NOT NULL DEFAULT 'pending',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "publicPaymentToken" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatBookingInstalment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RetreatRoomUnit_retreatDateId_roomOptionId_label_key"
  ON "RetreatRoomUnit"("retreatDateId", "roomOptionId", "label");
CREATE INDEX "RetreatRoomUnit_retreatDateId_status_idx"
  ON "RetreatRoomUnit"("retreatDateId", "status");
CREATE INDEX "RetreatRoomUnit_roomOptionId_status_idx"
  ON "RetreatRoomUnit"("roomOptionId", "status");

CREATE UNIQUE INDEX "RetreatAttendee_claimToken_key" ON "RetreatAttendee"("claimToken");
CREATE INDEX "RetreatAttendee_bookingId_status_idx" ON "RetreatAttendee"("bookingId", "status");
CREATE INDEX "RetreatAttendee_email_status_idx" ON "RetreatAttendee"("email", "status");
CREATE INDEX "RetreatAttendee_userId_status_idx" ON "RetreatAttendee"("userId", "status");

CREATE UNIQUE INDEX "RetreatBookingInstalment_stripeCheckoutSessionId_key"
  ON "RetreatBookingInstalment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "RetreatBookingInstalment_publicPaymentToken_key"
  ON "RetreatBookingInstalment"("publicPaymentToken");
CREATE UNIQUE INDEX "RetreatBookingInstalment_bookingId_sequence_key"
  ON "RetreatBookingInstalment"("bookingId", "sequence");
CREATE INDEX "RetreatBookingInstalment_bookingId_status_idx"
  ON "RetreatBookingInstalment"("bookingId", "status");
CREATE INDEX "RetreatBookingInstalment_publicPaymentToken_idx"
  ON "RetreatBookingInstalment"("publicPaymentToken");

CREATE INDEX "RetreatDate_retreatType_startsAt_idx" ON "RetreatDate"("retreatType", "startsAt");
CREATE INDEX "RetreatDate_dailyRoomName_idx" ON "RetreatDate"("dailyRoomName");
CREATE INDEX "RetreatBooking_roomUnitId_bookingStatus_idx"
  ON "RetreatBooking"("roomUnitId", "bookingStatus");

ALTER TABLE "RetreatRoomUnit"
  ADD CONSTRAINT "RetreatRoomUnit_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatRoomUnit"
  ADD CONSTRAINT "RetreatRoomUnit_roomOptionId_fkey"
  FOREIGN KEY ("roomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatBooking"
  ADD CONSTRAINT "RetreatBooking_roomUnitId_fkey"
  FOREIGN KEY ("roomUnitId") REFERENCES "RetreatRoomUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatAttendee"
  ADD CONSTRAINT "RetreatAttendee_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatAttendee"
  ADD CONSTRAINT "RetreatAttendee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingInstalment"
  ADD CONSTRAINT "RetreatBookingInstalment_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
