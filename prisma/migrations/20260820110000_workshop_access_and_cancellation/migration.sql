ALTER TYPE "EverfitConnectionStatus" ADD VALUE IF NOT EXISTS 'removed';

CREATE TYPE "RetreatLiveRecordingState" AS ENUM ('idle', 'recording', 'stopped', 'failed');
CREATE TYPE "RetreatCancellationSource" AS ENUM ('customer', 'event_cancelled');

ALTER TABLE "RetreatDate"
ADD COLUMN "liveRecordingState" "RetreatLiveRecordingState" NOT NULL DEFAULT 'idle';

UPDATE "RetreatDate"
SET "participantMicDefaultMuted" = true,
    "participantCameraDefaultOff" = true
WHERE "retreatType" = 'online'
  AND "isRecorded" = true
  AND "status" IN ('draft', 'open', 'sold_out', 'closed');

ALTER TABLE "RetreatCancellationRequest"
ADD COLUMN "source" "RetreatCancellationSource" NOT NULL DEFAULT 'customer';

ALTER TABLE "GiftPurchase"
ADD COLUMN "liveReminder24hSentAt" TIMESTAMP(3),
ADD COLUMN "liveReminder1hSentAt" TIMESTAMP(3);

ALTER TABLE "GuestAcceptanceEvent"
ADD COLUMN "promotedToUserId" TEXT,
ADD COLUMN "promotedAt" TIMESTAMP(3);

CREATE TABLE "GiftCancellationRequest" (
  "id" TEXT NOT NULL,
  "giftPurchaseId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "requestedByEmail" TEXT NOT NULL,
  "reason" TEXT,
  "status" "RetreatCancellationStatus" NOT NULL DEFAULT 'requested',
  "source" "RetreatCancellationSource" NOT NULL DEFAULT 'customer',
  "policySnapshotJson" JSONB NOT NULL,
  "refundableAmountPence" INTEGER NOT NULL,
  "adminDecisionReason" TEXT,
  "reviewedByUserId" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftCancellationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GiftCancellationRequest_giftPurchaseId_status_requestedAt_idx"
ON "GiftCancellationRequest"("giftPurchaseId", "status", "requestedAt");
CREATE INDEX "GiftCancellationRequest_status_source_requestedAt_idx"
ON "GiftCancellationRequest"("status", "source", "requestedAt");

ALTER TABLE "GiftCancellationRequest"
ADD CONSTRAINT "GiftCancellationRequest_giftPurchaseId_fkey"
FOREIGN KEY ("giftPurchaseId") REFERENCES "GiftPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftCancellationRequest"
ADD CONSTRAINT "GiftCancellationRequest_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GiftCancellationRequest"
ADD CONSTRAINT "GiftCancellationRequest_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
