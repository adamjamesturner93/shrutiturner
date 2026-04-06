ALTER TABLE "SmallGroupProgramme"
ADD COLUMN "runSlug" TEXT,
ADD COLUMN "templateSlug" TEXT,
ADD COLUMN "templateContentfulEntryId" TEXT;

UPDATE "SmallGroupProgramme"
SET
  "runSlug" = COALESCE("runSlug", "slug"),
  "templateSlug" = COALESCE("templateSlug", "slug"),
  "templateContentfulEntryId" = COALESCE("templateContentfulEntryId", "contentfulEntryId");

ALTER TABLE "SmallGroupProgramme"
ALTER COLUMN "runSlug" SET NOT NULL,
ALTER COLUMN "templateSlug" SET NOT NULL;

CREATE UNIQUE INDEX "SmallGroupProgramme_runSlug_key" ON "SmallGroupProgramme"("runSlug");
CREATE INDEX "SmallGroupProgramme_templateSlug_status_startDate_idx"
ON "SmallGroupProgramme"("templateSlug", "status", "startDate");
