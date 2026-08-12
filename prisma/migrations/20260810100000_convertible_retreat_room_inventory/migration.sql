-- A sellable room option can consume more than one base unit from a shared
-- inventory pool (for example, a king room consumes two single-bed units).
ALTER TABLE "RetreatRoomOption"
  ADD COLUMN "inventoryUnitsPerBooking" INTEGER NOT NULL DEFAULT 1;

-- Physical rooms belong to the same canonical pool as their interchangeable
-- sellable configurations. Keeping roomOptionId preserves compatibility with
-- existing assignments and admin screens.
ALTER TABLE "RetreatRoomUnit"
  ADD COLUMN "inventoryPoolId" TEXT;

UPDATE "RetreatRoomUnit" AS unit
SET "inventoryPoolId" = option."inventoryPoolId"
FROM "RetreatRoomOption" AS option
WHERE option."id" = unit."roomOptionId"
  AND option."inventoryPoolId" IS NOT NULL;

CREATE INDEX "RetreatRoomUnit_inventoryPoolId_status_idx"
  ON "RetreatRoomUnit"("inventoryPoolId", "status");

ALTER TABLE "RetreatRoomUnit"
  ADD CONSTRAINT "RetreatRoomUnit_inventoryPoolId_fkey"
  FOREIGN KEY ("inventoryPoolId") REFERENCES "RetreatInventoryPool"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
