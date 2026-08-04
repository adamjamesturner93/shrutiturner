CREATE TYPE "RetreatCancellationStatus" AS ENUM (
  'requested',
  'approved',
  'rejected',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE "RetreatRefundStatus" AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed'
);

ALTER TABLE "RetreatDate"
  ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "RetreatRoomUnit"
  ADD COLUMN "capacityUnits" INTEGER NOT NULL DEFAULT 1;

UPDATE "RetreatRoomUnit" unit
SET "capacityUnits" = GREATEST(COALESCE(option."bedsPerPhysicalRoom", 1), 1)
FROM "RetreatRoomOption" option
WHERE option."id" = unit."roomOptionId"
  AND option."bookingUnit" = 'bed_space';

ALTER TABLE "GiftPurchase"
  ADD COLUMN "deliveryEmailSentAt" TIMESTAMP(3);

CREATE TABLE "RetreatCancellationRequest" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "requestedByEmail" TEXT NOT NULL,
  "reason" TEXT,
  "status" "RetreatCancellationStatus" NOT NULL DEFAULT 'requested',
  "policySnapshotJson" JSONB NOT NULL,
  "refundableAmountPence" INTEGER NOT NULL,
  "adminDecisionReason" TEXT,
  "reviewedByUserId" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatCancellationRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RetreatCancellationRequest_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RetreatRefund" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "cancellationRequestId" TEXT,
  "amountPence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "status" "RetreatRefundStatus" NOT NULL DEFAULT 'pending',
  "stripeRefundIdsJson" JSONB,
  "failureReason" TEXT,
  "initiatedByUserId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RetreatRefund_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RetreatRefund_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RetreatRefund_cancellationRequestId_fkey"
    FOREIGN KEY ("cancellationRequestId") REFERENCES "RetreatCancellationRequest"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "RetreatCancellationRequest_bookingId_status_requestedAt_idx"
  ON "RetreatCancellationRequest"("bookingId", "status", "requestedAt");

CREATE INDEX "RetreatCancellationRequest_status_requestedAt_idx"
  ON "RetreatCancellationRequest"("status", "requestedAt");

CREATE INDEX "RetreatRefund_bookingId_status_createdAt_idx"
  ON "RetreatRefund"("bookingId", "status", "createdAt");

CREATE INDEX "RetreatRefund_cancellationRequestId_idx"
  ON "RetreatRefund"("cancellationRequestId");

CREATE INDEX "RetreatRefund_status_createdAt_idx"
  ON "RetreatRefund"("status", "createdAt");
