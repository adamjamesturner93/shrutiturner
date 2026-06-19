export type OnboardingStep = "profile" | "legal" | "source" | "health" | "welcome" | "complete";

export type OnboardingChecklistStep = Exclude<OnboardingStep, "welcome" | "complete">;

export type OnboardingState = {
  isComplete: boolean;
  checklistComplete: boolean;
  nextStep: OnboardingStep;
  missingSteps: OnboardingChecklistStep[];
};

export type OnboardingStateInput = {
  firstName?: string | null;
  lastName?: string | null;
  dob?: Date | string | null;
  isOnboarded?: boolean;
  hasAgreedToTerms?: boolean;
  hasAgreedToHealth?: boolean;
  heardAboutSource?: string | null;
  hasHealthProfile?: boolean;
  healthDeclarationStatus?: "incomplete" | "none_declared" | "context_declared";
  hasConsentedToHealthData?: boolean;
  needsHealthDataConsentRefresh?: boolean;
};

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function deriveOnboardingState(input: OnboardingStateInput): OnboardingState {
  const missingSteps: OnboardingChecklistStep[] = [];

  const hasProfile = hasText(input.firstName) && Boolean(input.dob);
  if (!hasProfile) missingSteps.push("profile");

  const hasLegal = Boolean(input.hasAgreedToTerms) && Boolean(input.hasAgreedToHealth);
  if (!hasLegal) missingSteps.push("legal");

  if (!hasText(input.heardAboutSource)) missingSteps.push("source");

  const checklistComplete = missingSteps.length === 0;
  const isComplete = checklistComplete && Boolean(input.isOnboarded);
  const nextStep = checklistComplete
    ? input.isOnboarded
      ? "complete"
      : "welcome"
    : missingSteps[0];

  return {
    isComplete,
    checklistComplete,
    nextStep,
    missingSteps,
  };
}
