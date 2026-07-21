ALTER TABLE "RetreatRatePlan"
  ADD COLUMN "earlyBirdPricePence" INTEGER,
  ADD COLUMN "earlyBirdEndsAt" TIMESTAMP(3);

CREATE INDEX "RetreatRatePlan_earlyBirdEndsAt_idx"
  ON "RetreatRatePlan"("earlyBirdEndsAt");
