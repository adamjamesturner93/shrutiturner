ALTER TYPE "GiftPurchaseStatus" ADD VALUE IF NOT EXISTS 'refunded';

ALTER TABLE "GiftPurchase"
  ADD COLUMN "nonRefundableAmountPence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "refundedAmountPence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "stripeRefundId" TEXT,
  ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "GiftPurchase_stripeRefundId_key"
  ON "GiftPurchase"("stripeRefundId");
