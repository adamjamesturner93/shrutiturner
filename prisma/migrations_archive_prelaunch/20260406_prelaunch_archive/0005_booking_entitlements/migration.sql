CREATE TYPE "BookingEntitlementType" AS ENUM ('membership', 'credit', 'manual');

ALTER TABLE "ClassBooking"
  ADD COLUMN "entitlementType" "BookingEntitlementType" NOT NULL DEFAULT 'manual',
  ADD COLUMN "creditLedgerEntryId" TEXT;

CREATE UNIQUE INDEX "ClassBooking_creditLedgerEntryId_key" ON "ClassBooking"("creditLedgerEntryId");
CREATE INDEX "ClassBooking_entitlementType_idx" ON "ClassBooking"("entitlementType");

ALTER TABLE "ClassBooking"
  ADD CONSTRAINT "ClassBooking_creditLedgerEntryId_fkey"
  FOREIGN KEY ("creditLedgerEntryId") REFERENCES "CreditLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
