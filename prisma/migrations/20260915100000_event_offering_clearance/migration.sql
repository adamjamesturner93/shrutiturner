-- Existing bookings retain their established setup workflow. New event runs use offering-specific review.
ALTER TABLE "RetreatDate" ADD COLUMN "requiresOfferingClearance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RetreatDate" ALTER COLUMN "requiresOfferingClearance" SET DEFAULT true;
