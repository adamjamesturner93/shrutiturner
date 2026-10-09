ALTER TABLE "RetreatDate" ADD COLUMN "stripeWorkshopProductId" TEXT;
CREATE UNIQUE INDEX "RetreatDate_stripeWorkshopProductId_key" ON "RetreatDate"("stripeWorkshopProductId");
ALTER TABLE "RetreatBooking" ADD COLUMN "promotionCodeSnapshot" TEXT, ADD COLUMN "stripePromotionCodeId" TEXT, ADD COLUMN "originalTotalPence" INTEGER, ADD COLUMN "promotionDiscountPence" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GiftPurchase" ADD COLUMN "promotionCodeSnapshot" TEXT, ADD COLUMN "stripePromotionCodeId" TEXT, ADD COLUMN "originalTotalPence" INTEGER, ADD COLUMN "promotionDiscountPence" INTEGER NOT NULL DEFAULT 0;
