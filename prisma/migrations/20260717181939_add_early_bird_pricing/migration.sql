-- AlterTable
ALTER TABLE "AuthChallenge" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PlatformSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "RetreatOnlineAccessEntitlement_liveAccessStartsAt_liveAccessEnd" RENAME TO "RetreatOnlineAccessEntitlement_liveAccessStartsAt_liveAcces_idx";

-- RenameIndex
ALTER INDEX "RetreatOnlineAccessEntitlement_replayAvailableAt_replayExpiresA" RENAME TO "RetreatOnlineAccessEntitlement_replayAvailableAt_replayExpi_idx";
