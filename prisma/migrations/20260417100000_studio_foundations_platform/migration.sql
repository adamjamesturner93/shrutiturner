CREATE TYPE "AuthChallengePurpose" AS ENUM ('login', 'signup', 'email_change');

ALTER TABLE "User"
  ADD COLUMN "pendingEmail" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "legalHoldUntil" TIMESTAMP(3),
  ADD COLUMN "legalHoldReason" TEXT;

ALTER TABLE "Session"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AdminActionLog"
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "requestPath" TEXT,
  ADD COLUMN "requestIp" TEXT;

CREATE TABLE "AuthChallenge" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "purpose" "AuthChallengePurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentIp" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "lastAttemptIp" TEXT,
  "redirectTo" TEXT,
  "consumedAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLifecycleEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "userId" TEXT,
  "actorUserId" TEXT,
  "payloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLifecycleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformSetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "businessName" TEXT NOT NULL DEFAULT 'Shruti Turner',
  "supportEmail" TEXT,
  "contactEmail" TEXT,
  "instagramUrl" TEXT,
  "defaultSeoTitle" TEXT,
  "defaultSeoDescription" TEXT,
  "gaMeasurementId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthChallenge_email_purpose_expiresAt_idx" ON "AuthChallenge"("email", "purpose", "expiresAt");
CREATE INDEX "AuthChallenge_userId_purpose_expiresAt_idx" ON "AuthChallenge"("userId", "purpose", "expiresAt");
CREATE INDEX "AuthChallenge_consumedAt_expiresAt_idx" ON "AuthChallenge"("consumedAt", "expiresAt");
CREATE INDEX "UserLifecycleEvent_eventType_createdAt_idx" ON "UserLifecycleEvent"("eventType", "createdAt");
CREATE INDEX "UserLifecycleEvent_userId_createdAt_idx" ON "UserLifecycleEvent"("userId", "createdAt");
CREATE INDEX "UserLifecycleEvent_actorUserId_createdAt_idx" ON "UserLifecycleEvent"("actorUserId", "createdAt");

ALTER TABLE "AuthChallenge"
  ADD CONSTRAINT "AuthChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserLifecycleEvent"
  ADD CONSTRAINT "UserLifecycleEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserLifecycleEvent"
  ADD CONSTRAINT "UserLifecycleEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlatformSetting"
  ADD CONSTRAINT "PlatformSetting_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
