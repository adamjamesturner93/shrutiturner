CREATE TYPE "ClassRoomSetupStatus" AS ENUM ('pending', 'ready', 'failed');

CREATE TABLE "ClassTimetableRule" (
  "id" TEXT NOT NULL,
  "classDefinitionSlug" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startsAtLocal" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
  "defaultCapacity" INTEGER NOT NULL,
  "instructorUserId" TEXT NOT NULL,
  "instructorProfileEntryId" TEXT,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "endsOn" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassTimetableRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassTimetableExclusion" (
  "id" TEXT NOT NULL,
  "timetableRuleId" TEXT NOT NULL,
  "localDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassTimetableExclusion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClassSession"
ADD COLUMN "timetableRuleId" TEXT,
ADD COLUMN "localDate" TIMESTAMP(3),
ADD COLUMN "generationKey" TEXT,
ADD COLUMN "roomSetupStatus" "ClassRoomSetupStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "roomSetupError" TEXT,
ADD COLUMN "reminderProcessedAt" TIMESTAMP(3),
ADD COLUMN "autoCancelledForNoAttendanceAt" TIMESTAMP(3),
ADD COLUMN "firstSignupInstructorEmailSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ClassSession_generationKey_key" ON "ClassSession"("generationKey");
CREATE INDEX "ClassSession_timetableRuleId_startsAtUtc_idx" ON "ClassSession"("timetableRuleId", "startsAtUtc");
CREATE INDEX "ClassSession_roomSetupStatus_startsAtUtc_idx" ON "ClassSession"("roomSetupStatus", "startsAtUtc");

CREATE UNIQUE INDEX "ClassTimetableExclusion_timetableRuleId_localDate_key"
  ON "ClassTimetableExclusion"("timetableRuleId", "localDate");
CREATE INDEX "ClassTimetableExclusion_localDate_idx" ON "ClassTimetableExclusion"("localDate");
CREATE INDEX "ClassTimetableRule_active_weekday_startsOn_idx"
  ON "ClassTimetableRule"("active", "weekday", "startsOn");
CREATE INDEX "ClassTimetableRule_instructorUserId_active_idx"
  ON "ClassTimetableRule"("instructorUserId", "active");

ALTER TABLE "ClassTimetableRule"
ADD CONSTRAINT "ClassTimetableRule_instructorUserId_fkey"
FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassTimetableRule"
ADD CONSTRAINT "ClassTimetableRule_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassTimetableExclusion"
ADD CONSTRAINT "ClassTimetableExclusion_timetableRuleId_fkey"
FOREIGN KEY ("timetableRuleId") REFERENCES "ClassTimetableRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassSession"
ADD CONSTRAINT "ClassSession_timetableRuleId_fkey"
FOREIGN KEY ("timetableRuleId") REFERENCES "ClassTimetableRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
