CREATE TYPE "RetreatEventKind" AS ENUM (
  'residential_retreat',
  'day_retreat',
  'in_person_workshop',
  'online_workshop'
);

CREATE TABLE "RetreatFormatPreset" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "eventKind" "RetreatEventKind" NOT NULL,
  "starterContentJson" JSONB NOT NULL,
  "operationalDefaultsJson" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatFormatPreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatExperience" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventKind" "RetreatEventKind" NOT NULL,
  "formatPresetId" TEXT,
  "draftContentJson" JSONB NOT NULL,
  "publishedContentJson" JSONB,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "publishedRevision" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "sourceContentfulEntryId" TEXT,
  "sourceContentfulHash" TEXT,
  "sourceContentfulLocale" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatExperience_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RetreatDate"
ADD COLUMN "eventKind" "RetreatEventKind" NOT NULL DEFAULT 'residential_retreat',
ADD COLUMN "experienceId" TEXT,
ADD COLUMN "formatPresetId" TEXT;

UPDATE "RetreatDate"
SET "eventKind" = 'online_workshop'
WHERE "retreatType" = 'online';

CREATE UNIQUE INDEX "RetreatFormatPreset_name_key" ON "RetreatFormatPreset"("name");
CREATE INDEX "RetreatFormatPreset_active_eventKind_name_idx" ON "RetreatFormatPreset"("active", "eventKind", "name");
CREATE UNIQUE INDEX "RetreatExperience_slug_key" ON "RetreatExperience"("slug");
CREATE UNIQUE INDEX "RetreatExperience_sourceContentfulEntryId_key" ON "RetreatExperience"("sourceContentfulEntryId");
CREATE INDEX "RetreatExperience_eventKind_publishedAt_idx" ON "RetreatExperience"("eventKind", "publishedAt");
CREATE INDEX "RetreatExperience_formatPresetId_idx" ON "RetreatExperience"("formatPresetId");
CREATE INDEX "RetreatDate_eventKind_startsAt_idx" ON "RetreatDate"("eventKind", "startsAt");
CREATE INDEX "RetreatDate_experienceId_startsAt_idx" ON "RetreatDate"("experienceId", "startsAt");
CREATE INDEX "RetreatDate_formatPresetId_idx" ON "RetreatDate"("formatPresetId");

ALTER TABLE "RetreatExperience"
ADD CONSTRAINT "RetreatExperience_formatPresetId_fkey"
FOREIGN KEY ("formatPresetId") REFERENCES "RetreatFormatPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RetreatDate"
ADD CONSTRAINT "RetreatDate_experienceId_fkey"
FOREIGN KEY ("experienceId") REFERENCES "RetreatExperience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RetreatDate"
ADD CONSTRAINT "RetreatDate_formatPresetId_fkey"
FOREIGN KEY ("formatPresetId") REFERENCES "RetreatFormatPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "RetreatFormatPreset" (
  "id", "name", "description", "eventKind", "starterContentJson",
  "operationalDefaultsJson", "active", "revision", "createdAt", "updatedAt"
) VALUES
  (
    'format_residential_retreat',
    'Residential retreat',
    'A multi-day in-person retreat with room choices and deposit options.',
    'residential_retreat',
    '{"schemaVersion":1,"title":"","subtitle":"","shortDescription":"","fullDescription":"","scheduleMarkdown":"## Arrival day\n\n- Arrival and welcome\n\n## Retreat day\n\n- Morning movement\n- Time to rest and explore\n\n## Departure day\n\n- Closing practice","atmosphereDescription":"","audienceDescription":"","experienceLevel":"All levels","suitableFor":[],"included":[],"notIncluded":[],"whatToBring":[],"foodAndDrinkDescription":"","accommodationDescription":"","durationLabel":"3 days / 2 nights","gallery":[],"seoTitle":"","seoDescription":""}'::jsonb,
    '{"schemaVersion":1,"timezone":"Europe/London","capacity":12,"currency":"GBP","pricePence":0,"paymentPolicy":"deposit","isRecorded":false,"chatEnabled":true}'::jsonb,
    true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'format_day_retreat',
    'Day retreat',
    'A full-day in-person event sold as one ticket per person.',
    'day_retreat',
    '{"schemaVersion":1,"title":"","subtitle":"","shortDescription":"","fullDescription":"","scheduleMarkdown":"## Your day\n\n- Welcome\n- Guided movement\n- Time to pause and reflect\n- Closing practice","atmosphereDescription":"","audienceDescription":"","experienceLevel":"All levels","suitableFor":[],"included":[],"notIncluded":[],"whatToBring":[],"foodAndDrinkDescription":"","accommodationDescription":"","durationLabel":"1 day","gallery":[],"seoTitle":"","seoDescription":""}'::jsonb,
    '{"schemaVersion":1,"timezone":"Europe/London","durationMinutes":480,"capacity":20,"currency":"GBP","pricePence":0,"paymentPolicy":"full_payment","isRecorded":false,"chatEnabled":true}'::jsonb,
    true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'format_in_person_workshop',
    'In-person workshop',
    'A focused in-person workshop sold as one ticket per person.',
    'in_person_workshop',
    '{"schemaVersion":1,"title":"","subtitle":"","shortDescription":"","fullDescription":"","scheduleMarkdown":"- Welcome and introduction\n- Guided exploration\n- Practical takeaways and questions","atmosphereDescription":"","audienceDescription":"","experienceLevel":"All levels","suitableFor":[],"included":[],"notIncluded":[],"whatToBring":[],"foodAndDrinkDescription":"","accommodationDescription":"","durationLabel":"Workshop","gallery":[],"seoTitle":"","seoDescription":""}'::jsonb,
    '{"schemaVersion":1,"timezone":"Europe/London","durationMinutes":150,"capacity":20,"currency":"GBP","pricePence":0,"paymentPolicy":"full_payment","isRecorded":false,"chatEnabled":true}'::jsonb,
    true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'format_online_workshop_150',
    '2.5-hour live online workshop',
    'A reusable 2.5-hour online format with live access and optional replay.',
    'online_workshop',
    '{"schemaVersion":1,"title":"","subtitle":"","shortDescription":"","fullDescription":"","scheduleMarkdown":"- Welcome and check-in\n- Guided movement and practical teaching\n- Reflection and questions\n- Takeaway practice","atmosphereDescription":"","audienceDescription":"","experienceLevel":"All levels","suitableFor":[],"included":["Live online teaching","Practical takeaways"],"notIncluded":[],"whatToBring":[],"foodAndDrinkDescription":"","accommodationDescription":"","durationLabel":"2.5 hours","gallery":[],"seoTitle":"","seoDescription":""}'::jsonb,
    '{"schemaVersion":1,"timezone":"Europe/London","durationMinutes":150,"capacity":30,"currency":"GBP","pricePence":3500,"paymentPolicy":"full_payment","isRecorded":true,"replayAccessDurationDays":7,"chatEnabled":true}'::jsonb,
    true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );
