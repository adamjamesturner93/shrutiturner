-- Additive: older deployments can continue to read and write existing records.
ALTER TABLE "RetreatRoomOption" ADD COLUMN "venueRoomGroupId" TEXT;
ALTER TABLE "RetreatBooking" ADD COLUMN "bedPreference" TEXT;
ALTER TABLE "GiftPurchase" ADD COLUMN "retreatBedPreference" TEXT;

ALTER TABLE "RetreatRoomOption" ADD CONSTRAINT "RetreatRoomOption_venueRoomGroupId_fkey"
  FOREIGN KEY ("venueRoomGroupId") REFERENCES "RetreatVenueRoomGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Link existing date inventory to an unambiguous group at the same venue.
-- This also covers the original Powis House seed, which predates group links.
WITH matches AS (
  SELECT option."id" AS option_id, MIN(room_group."id") AS group_id
  FROM "RetreatRoomOption" option
  JOIN "RetreatDate" retreat ON retreat."id" = option."retreatDateId"
  LEFT JOIN "RetreatInventoryPool" pool ON pool."id" = option."inventoryPoolId"
  JOIN "RetreatVenueRoomGroup" room_group ON room_group."venueProfileId" = retreat."venueProfileId"
    AND room_group."active" = true
    AND (pool."name" = room_group."name" OR option."label" = room_group."name"
      OR option."externalRoomOptionId" IN ('venue-' || room_group."id" || '-shared', 'venue-' || room_group."id" || '-private'))
  GROUP BY option."id"
  HAVING COUNT(DISTINCT room_group."id") = 1
)
UPDATE "RetreatRoomOption" option SET "venueRoomGroupId" = matches.group_id
FROM matches WHERE option."id" = matches.option_id;
