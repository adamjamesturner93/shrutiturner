-- Consolidate newsletter/blog notifications into a single marketing toggle.
ALTER TABLE "UserNotificationPreference"
ADD COLUMN "marketingEmails" BOOLEAN NOT NULL DEFAULT true;

UPDATE "UserNotificationPreference"
SET "marketingEmails" = COALESCE("newsletter", false) OR COALESCE("blogUpdates", false);

ALTER TABLE "UserNotificationPreference"
DROP COLUMN "newsletter",
DROP COLUMN "blogUpdates";
