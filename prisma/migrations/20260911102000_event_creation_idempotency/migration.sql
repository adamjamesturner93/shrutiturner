CREATE TABLE "AdminEventCreation" (
  "key" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "dateId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminEventCreation_pkey" PRIMARY KEY ("key")
);
