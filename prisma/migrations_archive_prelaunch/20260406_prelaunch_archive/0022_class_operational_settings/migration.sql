CREATE TABLE "ClassOperationalSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "preJoinWindowMinutes" INTEGER NOT NULL DEFAULT 10,
  "lateJoinCutoffMinutes" INTEGER NOT NULL DEFAULT 5,
  "creditRefundWindowMinutes" INTEGER NOT NULL DEFAULT 180,
  "emptyClassAutoCancelWindowMinutes" INTEGER NOT NULL DEFAULT 180,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassOperationalSettings_pkey" PRIMARY KEY ("id")
);
