-- Backward-compatible operational state for online retreat sessions.
CREATE TYPE "RetreatLiveRoomState" AS ENUM ('unprepared', 'prepared', 'started', 'ended');
CREATE TYPE "RetreatLiveDisplayMode" AS ENUM ('gallery', 'presenter');
CREATE TYPE "RetreatLiveChatMessageType" AS ENUM ('message', 'announcement');

ALTER TABLE "RetreatDate"
  ADD COLUMN "liveRoomState" "RetreatLiveRoomState" NOT NULL DEFAULT 'unprepared',
  ADD COLUMN "liveStartedAt" TIMESTAMP(3),
  ADD COLUMN "liveEndedAt" TIMESTAMP(3),
  ADD COLUMN "liveDisplayMode" "RetreatLiveDisplayMode" NOT NULL DEFAULT 'gallery',
  ADD COLUMN "liveDisplayVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "focusedPresenterUserId" TEXT,
  ADD COLUMN "liveChatDisabledAt" TIMESTAMP(3);

-- Existing prepared rooms should retain their operational state after deployment.
UPDATE "RetreatDate"
SET "liveRoomState" = 'prepared'
WHERE "onlineRoomSetupStatus" = 'ready'
  AND "dailyRoomName" IS NOT NULL;

ALTER TABLE "RetreatBooking"
  ADD COLUMN "liveReminder24hSentAt" TIMESTAMP(3),
  ADD COLUMN "liveReminder1hSentAt" TIMESTAMP(3);

CREATE TABLE "RetreatLiveAttendance" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "dailySessionId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL,
  "leftAt" TIMESTAMP(3),
  "durationSeconds" INTEGER NOT NULL DEFAULT 0,
  "lastEventAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatLiveAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetreatLiveChatMessage" (
  "id" TEXT NOT NULL,
  "retreatDateId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "type" "RetreatLiveChatMessageType" NOT NULL DEFAULT 'message',
  "text" VARCHAR(1000) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetreatLiveChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RetreatLiveAttendance_retreatDateId_userId_bookingId_dailySessionId_key"
  ON "RetreatLiveAttendance"("retreatDateId", "userId", "bookingId", "dailySessionId");
CREATE INDEX "RetreatLiveAttendance_retreatDateId_joinedAt_idx"
  ON "RetreatLiveAttendance"("retreatDateId", "joinedAt");
CREATE INDEX "RetreatLiveAttendance_bookingId_joinedAt_idx"
  ON "RetreatLiveAttendance"("bookingId", "joinedAt");
CREATE INDEX "RetreatLiveAttendance_userId_joinedAt_idx"
  ON "RetreatLiveAttendance"("userId", "joinedAt");
CREATE INDEX "RetreatLiveChatMessage_retreatDateId_createdAt_idx"
  ON "RetreatLiveChatMessage"("retreatDateId", "createdAt");
CREATE INDEX "RetreatLiveChatMessage_senderUserId_createdAt_idx"
  ON "RetreatLiveChatMessage"("senderUserId", "createdAt");
CREATE INDEX "RetreatLiveChatMessage_expiresAt_idx"
  ON "RetreatLiveChatMessage"("expiresAt");
CREATE INDEX "RetreatDate_liveRoomState_startsAt_idx"
  ON "RetreatDate"("liveRoomState", "startsAt");

ALTER TABLE "RetreatLiveAttendance"
  ADD CONSTRAINT "RetreatLiveAttendance_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RetreatLiveAttendance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RetreatLiveAttendance_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RetreatBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RetreatLiveChatMessage"
  ADD CONSTRAINT "RetreatLiveChatMessage_retreatDateId_fkey"
  FOREIGN KEY ("retreatDateId") REFERENCES "RetreatDate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RetreatLiveChatMessage_senderUserId_fkey"
  FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
