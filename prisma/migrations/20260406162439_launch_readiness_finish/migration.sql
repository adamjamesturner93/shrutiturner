-- AlterEnum
ALTER TYPE "ScheduledJobRunStatus" ADD VALUE 'skipped';

-- AlterTable
ALTER TABLE "PrivacyRequest" ADD COLUMN     "exportRowCountsJson" JSONB,
ADD COLUMN     "exportSectionsJson" JSONB;

-- CreateTable
CREATE TABLE "ScheduledJobLease" (
    "jobName" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "leasedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledJobLease_pkey" PRIMARY KEY ("jobName")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledJobLease_leaseId_key" ON "ScheduledJobLease"("leaseId");

-- CreateIndex
CREATE INDEX "ScheduledJobLease_leasedUntil_idx" ON "ScheduledJobLease"("leasedUntil");

-- AddForeignKey
ALTER TABLE "ScheduledJobLease" ADD CONSTRAINT "ScheduledJobLease_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
