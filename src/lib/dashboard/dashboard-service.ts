import { db } from "@/lib/db";
import type { DashboardSummaryDto } from "@/lib/api/types";
import { needsHealthDeclarationReview } from "@/lib/health/health-service";

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryDto> {
  const healthProfile = await db.healthProfile.findUnique({
    where: { userId },
    select: {
      declarationStatus: true,
      lastConfirmedAt: true,
    },
  });

  return {
    hasHealthProfile: Boolean(healthProfile),
    healthDeclarationStatus: healthProfile?.declarationStatus ?? "incomplete",
    healthDeclarationLastConfirmedAt: healthProfile?.lastConfirmedAt.toISOString() ?? "",
    healthDeclarationNeedsReview: needsHealthDeclarationReview(healthProfile?.lastConfirmedAt),
  };
}
