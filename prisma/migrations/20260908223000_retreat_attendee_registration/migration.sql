ALTER TABLE "RetreatAttendee"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "emergencyContactName" TEXT,
  ADD COLUMN "emergencyContactPhone" TEXT,
  ADD COLUMN "dietaryRequirements" TEXT,
  ADD COLUMN "mobilityNeeds" TEXT,
  ADD COLUMN "practicalConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "invitationQueuedAt" TIMESTAMP(3);

-- Copy practical details without asserting that anyone has confirmed registration.
UPDATE "RetreatAttendee" a SET
  "phone" = CASE WHEN a."isPrimary" THEN b."phone" END,
  "emergencyContactName" = CASE WHEN a."isPrimary" THEN b."emergencyContactName" END,
  "emergencyContactPhone" = CASE WHEN a."isPrimary" THEN b."emergencyContactPhone" END,
  "dietaryRequirements" = CASE WHEN a."isPrimary" THEN b."dietaryRequirements" ELSE b."guestTwoDietaryRequirements" END,
  "mobilityNeeds" = CASE WHEN a."isPrimary" THEN b."mobilityNeeds" END
FROM "RetreatBooking" b WHERE b."id" = a."bookingId";

-- Recover older bookings that have no corresponding attendee rows.
INSERT INTO "RetreatAttendee" ("id","bookingId","userId","email","firstName","lastName","displayName","isPrimary","isPurchaser","status","createdAt","updatedAt")
SELECT 'legacy-primary-' || b."id", b."id", b."attendeeUserId", b."attendeeEmail", b."attendeeFirstName", b."attendeeLastName", concat_ws(' ',b."attendeeFirstName",b."attendeeLastName"), true, b."attendeeEmail"=b."purchaserEmail", CASE WHEN b."attendeeUserId" IS NULL THEN 'pending_claim' ELSE 'claimed' END::"RetreatAttendeeStatus", b."createdAt", NOW()
FROM "RetreatBooking" b WHERE NOT EXISTS (SELECT 1 FROM "RetreatAttendee" a WHERE a."bookingId"=b."id" AND a."isPrimary");

INSERT INTO "RetreatAttendee" ("id","bookingId","email","firstName","lastName","displayName","isPrimary","isPurchaser","status","createdAt","updatedAt")
SELECT 'legacy-second-' || b."id", b."id", b."guestTwoEmail", COALESCE(b."guestTwoFirstName",''), COALESCE(b."guestTwoLastName",''), concat_ws(' ',b."guestTwoFirstName",b."guestTwoLastName"), false, false, 'pending_claim', b."createdAt", NOW()
FROM "RetreatBooking" b WHERE b."attendeeCount">1 AND b."guestTwoEmail" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "RetreatAttendee" a WHERE a."bookingId"=b."id" AND NOT a."isPrimary");
