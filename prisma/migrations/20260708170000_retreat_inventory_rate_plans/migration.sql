-- Additive retreat inventory, rate-plan and reminder schema.

CREATE TYPE "RetreatInventoryType" AS ENUM ('bed_space', 'room', 'ticket', 'addon', 'online_live_place');
CREATE TYPE "RetreatBookingUnit" AS ENUM ('bed_space', 'whole_room', 'ticket', 'addon', 'online_live_place');
CREATE TYPE "RetreatBookingItemType" AS ENUM ('accommodation', 'ticket', 'addon', 'online_live_place');
CREATE TYPE "RetreatDepositType" AS ENUM ('percentage', 'fixed_amount', 'full_payment');
CREATE TYPE "RetreatOnlineAccessType" AS ENUM ('live_only', 'replay_only', 'live_and_replay');

ALTER TABLE "RetreatDate"
  ADD COLUMN "bookingOpensAt" TIMESTAMP(3),
  ADD COLUMN "bookingClosesAt" TIMESTAMP(3);

ALTER TABLE "RetreatRoomOption"
  ADD COLUMN "inventoryPoolId" TEXT,
  ADD COLUMN "bookingUnit" "RetreatBookingUnit" NOT NULL DEFAULT 'bed_space',
  ADD COLUMN "guestCountPerUnit" INTEGER,
  ADD COLUMN "physicalRoomCount" INTEGER,
  ADD COLUMN "bedsPerPhysicalRoom" INTEGER,
  ADD COLUMN "allowedGuestCountsJson" JSONB,
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "RetreatBooking"
  ADD COLUMN "holdExpiresAt" TIMESTAMP(3);

ALTER TABLE "CoachingApplication"
  ADD COLUMN "paymentReminderSentAt" TIMESTAMP(3),
  ADD COLUMN "paymentReminderSentByUserId" TEXT;

ALTER TABLE "RetreatBookingInstalment"
  ADD COLUMN "lastReminderSentAt" TIMESTAMP(3),
  ADD COLUMN "lastReminderMode" TEXT,
  ADD COLUMN "lastReminderSentByUserId" TEXT;

CREATE TABLE "RetreatInventoryPool" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "inventoryType" "RetreatInventoryType" NOT NULL,
  "name" TEXT NOT NULL,
  "totalQuantity" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatInventoryPool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatRatePlan" (
  "id" TEXT NOT NULL,
  "roomOptionId" TEXT NOT NULL,
  "guestCount" INTEGER NOT NULL,
  "totalPricePence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatRatePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatDepositRule" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "depositType" "RetreatDepositType" NOT NULL,
  "depositPercentageBasisPoints" INTEGER,
  "fixedDepositAmountPence" INTEGER,
  "balanceDueAt" TIMESTAMP(3),
  "balanceDueDaysBeforeStart" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatDepositRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatBookingItem" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "itemType" "RetreatBookingItemType" NOT NULL,
  "inventoryPoolId" TEXT,
  "roomOptionId" TEXT,
  "ratePlanId" TEXT,
  "addonId" TEXT,
  "quantity" INTEGER NOT NULL,
  "guestCount" INTEGER NOT NULL,
  "unitPricePence" INTEGER NOT NULL,
  "totalPricePence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatBookingItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatAddon" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "inventoryPoolId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "pricePence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "requiresTimeSlot" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatAddon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatOnlineAccessEntitlement" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "userId" TEXT,
  "attendeeEmail" TEXT NOT NULL,
  "accessType" "RetreatOnlineAccessType" NOT NULL,
  "liveAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
  "replayAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
  "liveAccessStartsAt" TIMESTAMP(3),
  "liveAccessEndsAt" TIMESTAMP(3),
  "replayAvailableAt" TIMESTAMP(3),
  "replayExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatOnlineAccessEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetreatBooking_bookingStatus_holdExpiresAt_idx"
  ON "RetreatBooking"("bookingStatus", "holdExpiresAt");
CREATE INDEX "RetreatRoomOption_inventoryPoolId_idx" ON "RetreatRoomOption"("inventoryPoolId");
CREATE INDEX "RetreatRoomOption_retreatDateId_active_displayOrder_idx"
  ON "RetreatRoomOption"("retreatDateId", "active", "displayOrder");

CREATE INDEX "RetreatInventoryPool_retreatDateId_inventoryType_active_idx"
  ON "RetreatInventoryPool"("retreatDateId", "inventoryType", "active");

CREATE UNIQUE INDEX "RetreatRatePlan_roomOptionId_guestCount_key"
  ON "RetreatRatePlan"("roomOptionId", "guestCount");
CREATE INDEX "RetreatRatePlan_roomOptionId_active_idx"
  ON "RetreatRatePlan"("roomOptionId", "active");

CREATE INDEX "RetreatDepositRule_retreatDateId_active_idx"
  ON "RetreatDepositRule"("retreatDateId", "active");

CREATE INDEX "RetreatBookingItem_bookingId_idx" ON "RetreatBookingItem"("bookingId");
CREATE INDEX "RetreatBookingItem_inventoryPoolId_idx" ON "RetreatBookingItem"("inventoryPoolId");
CREATE INDEX "RetreatBookingItem_roomOptionId_idx" ON "RetreatBookingItem"("roomOptionId");
CREATE INDEX "RetreatBookingItem_addonId_idx" ON "RetreatBookingItem"("addonId");

CREATE INDEX "RetreatAddon_retreatDateId_active_idx" ON "RetreatAddon"("retreatDateId", "active");
CREATE INDEX "RetreatAddon_inventoryPoolId_idx" ON "RetreatAddon"("inventoryPoolId");

CREATE INDEX "RetreatOnlineAccessEntitlement_bookingId_idx"
  ON "RetreatOnlineAccessEntitlement"("bookingId");
CREATE INDEX "RetreatOnlineAccessEntitlement_retreatDateId_attendeeEmail_idx"
  ON "RetreatOnlineAccessEntitlement"("retreatDateId", "attendeeEmail");
CREATE INDEX "RetreatOnlineAccessEntitlement_userId_retreatDateId_idx"
  ON "RetreatOnlineAccessEntitlement"("userId", "retreatDateId");
CREATE INDEX "RetreatOnlineAccessEntitlement_liveAccessStartsAt_liveAccessEndsAt_idx"
  ON "RetreatOnlineAccessEntitlement"("liveAccessStartsAt", "liveAccessEndsAt");
CREATE INDEX "RetreatOnlineAccessEntitlement_replayAvailableAt_replayExpiresAt_idx"
  ON "RetreatOnlineAccessEntitlement"("replayAvailableAt", "replayExpiresAt");

ALTER TABLE "RetreatInventoryPool"
  ADD CONSTRAINT "RetreatInventoryPool_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatRoomOption"
  ADD CONSTRAINT "RetreatRoomOption_inventoryPoolId_fkey"
  FOREIGN KEY ("inventoryPoolId") REFERENCES "RetreatInventoryPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatRatePlan"
  ADD CONSTRAINT "RetreatRatePlan_roomOptionId_fkey"
  FOREIGN KEY ("roomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatDepositRule"
  ADD CONSTRAINT "RetreatDepositRule_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatAddon"
  ADD CONSTRAINT "RetreatAddon_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatAddon"
  ADD CONSTRAINT "RetreatAddon_inventoryPoolId_fkey"
  FOREIGN KEY ("inventoryPoolId") REFERENCES "RetreatInventoryPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingItem"
  ADD CONSTRAINT "RetreatBookingItem_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingItem"
  ADD CONSTRAINT "RetreatBookingItem_inventoryPoolId_fkey"
  FOREIGN KEY ("inventoryPoolId") REFERENCES "RetreatInventoryPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingItem"
  ADD CONSTRAINT "RetreatBookingItem_roomOptionId_fkey"
  FOREIGN KEY ("roomOptionId") REFERENCES "RetreatRoomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingItem"
  ADD CONSTRAINT "RetreatBookingItem_ratePlanId_fkey"
  FOREIGN KEY ("ratePlanId") REFERENCES "RetreatRatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatBookingItem"
  ADD CONSTRAINT "RetreatBookingItem_addonId_fkey"
  FOREIGN KEY ("addonId") REFERENCES "RetreatAddon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetreatOnlineAccessEntitlement"
  ADD CONSTRAINT "RetreatOnlineAccessEntitlement_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatOnlineAccessEntitlement"
  ADD CONSTRAINT "RetreatOnlineAccessEntitlement_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetreatOnlineAccessEntitlement"
  ADD CONSTRAINT "RetreatOnlineAccessEntitlement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
