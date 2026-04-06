-- Enums
CREATE TYPE "ClassSessionStatus" AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE "ClassBookingStatus" AS ENUM ('booked', 'cancelled', 'attended', 'no_show');
CREATE TYPE "ClassWaitlistStatus" AS ENUM ('waiting', 'promoted', 'removed');
CREATE TYPE "ClassSessionEventType" AS ENUM (
  'booking_created',
  'booking_cancelled',
  'waitlist_joined',
  'waitlist_promoted',
  'session_cancelled'
);

-- Class sessions
CREATE TABLE "ClassSession" (
  "id" TEXT NOT NULL,
  "classDefinitionSlug" TEXT NOT NULL,
  "titleSnapshot" TEXT NOT NULL,
  "typeSnapshot" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "levelSnapshot" TEXT NOT NULL,
  "startsAtUtc" TIMESTAMP(3) NOT NULL,
  "endsAtUtc" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
  "capacity" INTEGER NOT NULL,
  "status" "ClassSessionStatus" NOT NULL DEFAULT 'scheduled',
  "notes" TEXT,
  "instructorUserId" TEXT NOT NULL,
  "dailyRoomName" TEXT,
  "dailyRoomUrl" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledByUserId" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassSession_classDefinitionSlug_startsAtUtc_idx"
  ON "ClassSession"("classDefinitionSlug", "startsAtUtc");
CREATE INDEX "ClassSession_startsAtUtc_status_idx"
  ON "ClassSession"("startsAtUtc", "status");
CREATE INDEX "ClassSession_instructorUserId_startsAtUtc_idx"
  ON "ClassSession"("instructorUserId", "startsAtUtc");

ALTER TABLE "ClassSession"
  ADD CONSTRAINT "ClassSession_instructorUserId_fkey"
  FOREIGN KEY ("instructorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassSession"
  ADD CONSTRAINT "ClassSession_cancelledByUserId_fkey"
  FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bookings
CREATE TABLE "ClassBooking" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ClassBookingStatus" NOT NULL DEFAULT 'booked',
  "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClassBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassBooking_sessionId_userId_key"
  ON "ClassBooking"("sessionId", "userId");
CREATE INDEX "ClassBooking_userId_status_idx"
  ON "ClassBooking"("userId", "status");
CREATE INDEX "ClassBooking_sessionId_status_idx"
  ON "ClassBooking"("sessionId", "status");

ALTER TABLE "ClassBooking"
  ADD CONSTRAINT "ClassBooking_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassBooking"
  ADD CONSTRAINT "ClassBooking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Waitlist
CREATE TABLE "ClassWaitlistEntry" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "ClassWaitlistStatus" NOT NULL DEFAULT 'waiting',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "promotedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClassWaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassWaitlistEntry_sessionId_userId_key"
  ON "ClassWaitlistEntry"("sessionId", "userId");
CREATE UNIQUE INDEX "ClassWaitlistEntry_sessionId_position_key"
  ON "ClassWaitlistEntry"("sessionId", "position");
CREATE INDEX "ClassWaitlistEntry_sessionId_status_position_idx"
  ON "ClassWaitlistEntry"("sessionId", "status", "position");
CREATE INDEX "ClassWaitlistEntry_userId_status_idx"
  ON "ClassWaitlistEntry"("userId", "status");

ALTER TABLE "ClassWaitlistEntry"
  ADD CONSTRAINT "ClassWaitlistEntry_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassWaitlistEntry"
  ADD CONSTRAINT "ClassWaitlistEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Operational event log
CREATE TABLE "ClassSessionEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" "ClassSessionEventType" NOT NULL,
  "message" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassSessionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassSessionEvent_sessionId_createdAt_idx"
  ON "ClassSessionEvent"("sessionId", "createdAt");
CREATE INDEX "ClassSessionEvent_type_createdAt_idx"
  ON "ClassSessionEvent"("type", "createdAt");

ALTER TABLE "ClassSessionEvent"
  ADD CONSTRAINT "ClassSessionEvent_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
