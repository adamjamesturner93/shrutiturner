CREATE TABLE "RetreatVenueProfile" (
  "id" TEXT NOT NULL,
  "contentfulVenueId" TEXT NOT NULL,
  "venueSlug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatVenueProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatVenueRoomGroup" (
  "id" TEXT NOT NULL,
  "venueProfileId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL,
  "capacityPerRoom" INTEGER NOT NULL,
  "bedSetup" TEXT NOT NULL,
  "allowShared" BOOLEAN NOT NULL DEFAULT false,
  "privateGuestCountsJson" JSONB,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatVenueRoomGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatVenueRoomTemplate" (
  "id" TEXT NOT NULL,
  "roomGroupId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatVenueRoomTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RetreatDate"
  ADD COLUMN "venueProfileId" TEXT,
  ADD COLUMN "accommodationConfiguredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "RetreatVenueProfile_contentfulVenueId_key" ON "RetreatVenueProfile"("contentfulVenueId");
CREATE UNIQUE INDEX "RetreatVenueProfile_venueSlug_key" ON "RetreatVenueProfile"("venueSlug");
CREATE INDEX "RetreatVenueRoomGroup_venueProfileId_active_displayOrder_idx" ON "RetreatVenueRoomGroup"("venueProfileId", "active", "displayOrder");
CREATE UNIQUE INDEX "RetreatVenueRoomTemplate_roomGroupId_label_key" ON "RetreatVenueRoomTemplate"("roomGroupId", "label");
CREATE INDEX "RetreatVenueRoomTemplate_roomGroupId_displayOrder_idx" ON "RetreatVenueRoomTemplate"("roomGroupId", "displayOrder");
CREATE INDEX "RetreatDate_venueProfileId_idx" ON "RetreatDate"("venueProfileId");

ALTER TABLE "RetreatVenueRoomGroup"
  ADD CONSTRAINT "RetreatVenueRoomGroup_venueProfileId_fkey"
  FOREIGN KEY ("venueProfileId") REFERENCES "RetreatVenueProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RetreatVenueRoomTemplate"
  ADD CONSTRAINT "RetreatVenueRoomTemplate_roomGroupId_fkey"
  FOREIGN KEY ("roomGroupId") REFERENCES "RetreatVenueRoomGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RetreatDate"
  ADD CONSTRAINT "RetreatDate_venueProfileId_fkey"
  FOREIGN KEY ("venueProfileId") REFERENCES "RetreatVenueProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
