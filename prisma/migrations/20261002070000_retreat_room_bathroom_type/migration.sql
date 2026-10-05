ALTER TABLE "RetreatVenueRoomGroup" ADD COLUMN "bathroomType" TEXT;
-- Only unambiguous explicit labels are backfilled. Private does not imply en-suite.
UPDATE "RetreatVenueRoomGroup" SET "bathroomType" = 'private'
WHERE "name" ILIKE '%private bathroom%' AND "name" NOT ILIKE '%shared bathroom%';
UPDATE "RetreatVenueRoomGroup" SET "bathroomType" = 'shared'
WHERE "name" ILIKE '%shared bathroom%' AND "name" NOT ILIKE '%private bathroom%';
ALTER TABLE "RetreatVenueRoomGroup" ADD CONSTRAINT "RetreatVenueRoomGroup_bathroomType_check"
CHECK ("bathroomType" IS NULL OR "bathroomType" IN ('private', 'shared'));
