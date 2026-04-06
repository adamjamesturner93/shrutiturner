CREATE TYPE "SmallGroupProgrammeStatus" AS ENUM (
  'draft',
  'upcoming',
  'open',
  'in_progress',
  'completed',
  'waitlist',
  'archived'
);

CREATE TYPE "SmallGroupSessionStatus" AS ENUM (
  'scheduled',
  'completed',
  'cancelled'
);

CREATE TYPE "SmallGroupEnrollmentStatus" AS ENUM (
  'active',
  'completed',
  'cancelled',
  'waitlist'
);

CREATE TABLE "SmallGroupProgramme" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT,
  "durationLabel" TEXT NOT NULL,
  "cohortSize" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "scheduleLabel" TEXT,
  "pricePence" INTEGER NOT NULL,
  "status" "SmallGroupProgrammeStatus" NOT NULL DEFAULT 'draft',
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "featuredBadge" TEXT,
  "contentfulEntryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmallGroupProgramme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmallGroupProgrammeSession" (
  "id" TEXT NOT NULL,
  "programmeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "sequenceNumber" INTEGER NOT NULL,
  "status" "SmallGroupSessionStatus" NOT NULL DEFAULT 'scheduled',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmallGroupProgrammeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmallGroupProgrammeEnrollment" (
  "id" TEXT NOT NULL,
  "programmeId" TEXT NOT NULL,
  "userId" TEXT,
  "attendeeName" TEXT NOT NULL,
  "attendeeEmail" TEXT NOT NULL,
  "sessionsAttended" INTEGER NOT NULL DEFAULT 0,
  "progressSummary" TEXT,
  "status" "SmallGroupEnrollmentStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmallGroupProgrammeEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmallGroupProgramme_slug_key" ON "SmallGroupProgramme"("slug");
CREATE UNIQUE INDEX "SmallGroupProgramme_contentfulEntryId_key" ON "SmallGroupProgramme"("contentfulEntryId");
CREATE INDEX "SmallGroupProgramme_status_startDate_idx" ON "SmallGroupProgramme"("status", "startDate");

CREATE UNIQUE INDEX "SmallGroupProgrammeSession_programmeId_sequenceNumber_key"
ON "SmallGroupProgrammeSession"("programmeId", "sequenceNumber");
CREATE INDEX "SmallGroupProgrammeSession_programmeId_startsAt_idx"
ON "SmallGroupProgrammeSession"("programmeId", "startsAt");

CREATE INDEX "SmallGroupProgrammeEnrollment_programmeId_status_idx"
ON "SmallGroupProgrammeEnrollment"("programmeId", "status");
CREATE INDEX "SmallGroupProgrammeEnrollment_userId_status_idx"
ON "SmallGroupProgrammeEnrollment"("userId", "status");
CREATE INDEX "SmallGroupProgrammeEnrollment_attendeeEmail_status_idx"
ON "SmallGroupProgrammeEnrollment"("attendeeEmail", "status");

ALTER TABLE "SmallGroupProgrammeSession"
ADD CONSTRAINT "SmallGroupProgrammeSession_programmeId_fkey"
FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmallGroupProgrammeEnrollment"
ADD CONSTRAINT "SmallGroupProgrammeEnrollment_programmeId_fkey"
FOREIGN KEY ("programmeId") REFERENCES "SmallGroupProgramme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmallGroupProgrammeEnrollment"
ADD CONSTRAINT "SmallGroupProgrammeEnrollment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
