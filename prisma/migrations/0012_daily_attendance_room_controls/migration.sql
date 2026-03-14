CREATE TYPE "AttendanceSource" AS ENUM ('daily', 'manual');

CREATE TYPE "ClassAttendanceEventType" AS ENUM ('joined', 'left');

ALTER TABLE "ClassSession"
ADD COLUMN "communityModeEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN "communityModeUpdatedAt" TIMESTAMP(3);

ALTER TABLE "ClassBooking"
ADD COLUMN "firstJoinedAt" TIMESTAMP(3),
ADD COLUMN "lastJoinedAt" TIMESTAMP(3),
ADD COLUMN "lastLeftAt" TIMESTAMP(3),
ADD COLUMN "joinCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "attendanceMarkedAt" TIMESTAMP(3),
ADD COLUMN "attendanceMarkedByUserId" TEXT,
ADD COLUMN "attendanceSource" "AttendanceSource";

CREATE TABLE "ClassAttendanceEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "dailyParticipantId" TEXT,
    "type" "ClassAttendanceEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAttendanceEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassBooking_attendanceMarkedByUserId_idx" ON "ClassBooking"("attendanceMarkedByUserId");
CREATE INDEX "ClassAttendanceEvent_sessionId_occurredAt_idx" ON "ClassAttendanceEvent"("sessionId", "occurredAt");
CREATE INDEX "ClassAttendanceEvent_bookingId_occurredAt_idx" ON "ClassAttendanceEvent"("bookingId", "occurredAt");
CREATE INDEX "ClassAttendanceEvent_userId_occurredAt_idx" ON "ClassAttendanceEvent"("userId", "occurredAt");

ALTER TABLE "ClassBooking"
ADD CONSTRAINT "ClassBooking_attendanceMarkedByUserId_fkey"
FOREIGN KEY ("attendanceMarkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClassAttendanceEvent"
ADD CONSTRAINT "ClassAttendanceEvent_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassAttendanceEvent"
ADD CONSTRAINT "ClassAttendanceEvent_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "ClassBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClassAttendanceEvent"
ADD CONSTRAINT "ClassAttendanceEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
