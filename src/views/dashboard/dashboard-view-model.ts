import type { HealthDeclarationStatusDto } from "@/lib/api/types";

export function shouldPromptForHealthProfile(
  declarationStatus: HealthDeclarationStatusDto,
  hasHealthDataConsent: boolean | undefined,
  needsHealthDataConsentRefresh: boolean | undefined
) {
  return (
    declarationStatus === "incomplete" ||
    !hasHealthDataConsent ||
    Boolean(needsHealthDataConsentRefresh)
  );
}

export function shouldPromptForHealthReview(needsReview: boolean) {
  return needsReview;
}
