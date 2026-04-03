CREATE TYPE "HealthDeclarationStatus" AS ENUM ('none_declared', 'context_declared');

ALTER TABLE "HealthProfile"
ADD COLUMN "declarationStatus" "HealthDeclarationStatus" NOT NULL DEFAULT 'none_declared',
ADD COLUMN "tracksFlareCheckIns" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "HealthProfile"
SET
  "declarationStatus" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM "HealthConditionSelection" hcs
      WHERE hcs."profileId" = "HealthProfile"."id"
    )
    OR LENGTH(TRIM(COALESCE("additionalNotes", ''))) > 0
      THEN 'context_declared'::"HealthDeclarationStatus"
    ELSE 'none_declared'::"HealthDeclarationStatus"
  END,
  "tracksFlareCheckIns" = false,
  "lastConfirmedAt" = "lastUpdatedAt";
