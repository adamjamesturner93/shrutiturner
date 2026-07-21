ALTER TABLE "GiftPurchase"
ADD COLUMN "retreatRatePlanId" TEXT,
ADD COLUMN "retreatGuestCount" INTEGER;

CREATE INDEX "GiftPurchase_retreatRatePlanId_idx"
ON "GiftPurchase"("retreatRatePlanId");

ALTER TABLE "GiftPurchase"
ADD CONSTRAINT "GiftPurchase_retreatRatePlanId_fkey"
FOREIGN KEY ("retreatRatePlanId") REFERENCES "RetreatRatePlan"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
